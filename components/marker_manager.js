import animalMarkerComponent from './animal_marker.js';

export default {
  template: `
    <div>
      <!-- Individual or Grouped Animal Markers -->
      <animalMarkerComponent
        v-for="marker in groupedMarkers" 
        :key="marker.track_data.id"
        :track_data="marker.track_data"
        :pluginDirUrl="pluginDirUrl"
        :viewer="viewer"
        :is_group="marker.is_group"
        :group_members="marker.group_members"
        @child-marker-clicked="childMarkerClicked"
        @zoom-to-group="zoomToGroup"
      />
    </div>
  `,
  props: {
    tracks_data: {
      type: Array,
      required: true,
    },
    viewer: {
      type: Object,
      required: true,
    },
    pluginDirUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      groupedMarkers: [],
      isGrouping: false,
      //globalCounter: 0,
    };
  },
  components: {
    animalMarkerComponent,
  },
  methods: {
    zoomToGroup(group) {
      const positions = group
        .map((member) => {
          const positionData = member.track_data.positions?.[0]?.position;

          if (
            !positionData ||
            isNaN(positionData.x) ||
            isNaN(positionData.y) ||
            isNaN(positionData.z)
          ) {
            console.error('Invalid position data for group member:', member);
            return null;
          }

          return new Cesium.Cartesian3(
            positionData.x,
            positionData.y,
            positionData.z
          );
        })
        .filter(Boolean);

      if (positions.length === 0) {
        console.error('No valid positions found for group:', group);
        return;
      }

      const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
      let initialGroupSize = group.length;

      const smoothZoom = () => {
        // Get the current camera position and orientation
        const currentCameraPosition = this.viewer.camera.position;
        const currentCameraDirection = this.viewer.camera.direction;
        const currentCameraUp = this.viewer.camera.up;

        // Calculate the current distance from the camera to the bounding sphere center
        const currentDistance = Cesium.Cartesian3.distance(
          currentCameraPosition,
          boundingSphere.center
        );

        // Determine the target distance (10% closer each iteration)
        const newDistance = currentDistance * 0.9;

        // Calculate the new camera position closer to the target
        const directionToCenter = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(
            boundingSphere.center,
            currentCameraPosition,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        );

        const newCameraPosition = Cesium.Cartesian3.add(
          boundingSphere.center,
          Cesium.Cartesian3.multiplyByScalar(
            directionToCenter,
            -newDistance,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        );

        // Set the camera with updated position, keeping the same orientation
        this.viewer.camera.setView({
          destination: newCameraPosition,
          orientation: {
            direction: currentCameraDirection,
            up: currentCameraUp,
          },
        });

        // Recalculate groups after zooming
        this.groupMarkers();

        // Check if the group size has reduced or the group has been fully disassembled
        const remainingGroupMembers = group.filter((member) =>
          this.groupedMarkers.some(
            (marker) =>
              marker.is_group &&
              marker.group_members.some(
                (groupMember) =>
                  groupMember.track_data.id === member.track_data.id
              )
          )
        );

        if (remainingGroupMembers.length < initialGroupSize) {
          console.log('Group size reduced. Stopping zoom.');
          return; // Stop zooming if the group size has reduced
        }

        const isStillGrouped = remainingGroupMembers.length > 0;

        if (isStillGrouped) {
          // Continue zooming if the group is still present
          console.log('Markers still grouped. Continuing zoom.');
          requestAnimationFrame(smoothZoom);
        } else {
          console.log('Group successfully disassembled.');
        }
      };

      // Start smooth zooming
      smoothZoom();
    },
    childMarkerClicked(animal) {
      this.$emit('marker-clicked', animal); // Notify the parent component
    },
    isEntityVisible(entityPosition) {
      // Apply the custom logic for determining visibility based on globe position
      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const cameraPosition = this.viewer.camera.positionWC;
      const occluder = new Cesium.EllipsoidalOccluder(
        ellipsoid,
        cameraPosition
      );
      return occluder.isPointVisible(entityPosition); // Return true if the entity is visible from the camera's perspective
    },
    calculateScreenPosition(position) {
      if (!position) {
        console.error(
          'Invalid position provided to calculateScreenPosition:',
          position
        );
        return null;
      }

      return Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        position
      );
    },
    areMarkersOverlapping(pos1, pos2, threshold = 0.66) {
      const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
      );
      const markerSize = 64; // Assume marker size in pixels
      return distance < markerSize * threshold;
    },
    groupMarkers() {
      if (this.isGrouping) {
        return; // Prevent overlapping grouping processes
      }
      this.isGrouping = true;

      try {
        const screenPositions = this.tracks_data
          .map((data) => {
            const position = data.positions?.[0]?.position;
            if (
              !position ||
              isNaN(position.x) ||
              isNaN(position.y) ||
              isNaN(position.z)
            ) {
              return null;
            }

            if (!this.isEntityVisible(position)) {
              return null; // Exclude markers not visible to the camera
            }

            const screenPosition = this.calculateScreenPosition(position);
            if (
              !screenPosition ||
              isNaN(screenPosition.x) ||
              isNaN(screenPosition.y)
            ) {
              return null;
            }

            return {
              id: data.id,
              track_data: data,
              screenPosition,
              position, // Original Cartesian3 position
            };
          })
          .filter(Boolean); // Remove markers that failed visibility checks

        const groups = [];

        screenPositions.forEach((marker) => {
          let addedToGroup = false;

          for (const group of groups) {
            const overlaps = group.some((member) => {
              const screenOverlap = this.areMarkersOverlapping(
                member.screenPosition,
                marker.screenPosition
              );

              const distance = Cesium.Cartesian3.distance(
                member.position,
                marker.position
              );

              const maxGroupingDistance = 1000; // 1 km
              return screenOverlap && distance <= maxGroupingDistance;
            });

            if (overlaps) {
              group.push(marker);
              addedToGroup = true;
              break;
            }
          }

          if (!addedToGroup) {
            groups.push([marker]);
          }
        });

        // Merge overlapping groups
        const mergedGroups = [];
        while (groups.length > 0) {
          const group = groups.pop();
          let merged = false;

          for (const mergedGroup of mergedGroups) {
            const overlaps = group.some((marker) =>
              mergedGroup.some((member) =>
                this.areMarkersOverlapping(
                  marker.screenPosition,
                  member.screenPosition
                )
              )
            );

            if (overlaps) {
              mergedGroup.push(...group);
              merged = true;
              break;
            }
          }

          if (!merged) {
            mergedGroups.push(group);
          }
        }

        // Create groupedMarkers data
        const updatedGroupedMarkers = mergedGroups.map((group) => {
          if (group.length === 1) {
            return { track_data: group[0].track_data, is_group: false };
          } else {
            // Sort group_members to ensure non-owned animals are last
            const sortedGroupMembers = group
              .map((marker, index) => ({
                track_data: marker.track_data,
                offset: index,
              }))
              .sort((a, b) => {
                return (
                  (a.track_data.animal.is_owned ? 0 : 1) -
                  (b.track_data.animal.is_owned ? 0 : 1)
                );
              });

            return {
              track_data: {
                id: `group-${group.map((m) => m.id).join('-')}`,
                animal: {
                  name: `Group (${group.length})`,
                  picture: null,
                },
                positions: [group[0].track_data.positions[0]],
              },
              is_group: true,
              group_members: sortedGroupMembers,
            };
          }
        });
        this.groupedMarkers = [...updatedGroupedMarkers];
        //console.log('Screen Positions:', screenPositions);
        //console.log('Merged Groups:', mergedGroups);
        //console.log('Grouped Markers:', this.groupedMarkers);
        //this.globalCounter += 1;
        //console.log(new Date() + ' = update #' + this.globalCounter);
      } catch (error) {
        console.error('Error during groupMarkers:', error);
      } finally {
        this.isGrouping = false; // Reset the flag
      }
    },
  },
  beforeDestroy() {
    // Remove the postRender listener
    this.viewer.scene.postRender.removeEventListener(this.groupMarkers);
  },
  mounted() {
    let throttling = false;
    let lastCameraPosition = null;
    let lastCameraDirection = null;
    let postRenderOnly = true; // Start in postRenderOnly mode

    const THRESHOLD = Cesium.Math.EPSILON7; // Adjust this value as needed

    const throttledGroupMarkers = () => {
      if (throttling) return;

      if (postRenderOnly) {
        // In postRenderOnly mode, check if enough markers are visible
        const visibleMarkers = this.groupedMarkers.filter((marker) => {
          const position = marker.track_data.positions?.[0]?.position;
          return position && this.isEntityVisible(position);
        });

        if (visibleMarkers.length > 1) {
          postRenderOnly = false; // Switch to camera-based logic
        } else {
          this.groupMarkers(); // Continue grouping logic without camera checks
          return; // Skip the rest of the logic
        }
      }

      // Get the current camera position and direction
      const currentCameraPosition = this.viewer.camera.positionCartographic;
      const currentCameraDirection = this.viewer.camera.direction;

      if (
        !lastCameraPosition ||
        !lastCameraDirection ||
        Math.abs(currentCameraPosition.latitude - lastCameraPosition.latitude) >
          THRESHOLD ||
        Math.abs(
          currentCameraPosition.longitude - lastCameraPosition.longitude
        ) > THRESHOLD ||
        Math.abs(currentCameraPosition.height - lastCameraPosition.height) >
          THRESHOLD ||
        !Cesium.Cartesian3.equalsEpsilon(
          currentCameraDirection,
          lastCameraDirection,
          THRESHOLD
        )
      ) {
        // Call groupMarkers immediately
        this.groupMarkers();

        // Update the last known camera position & direction
        lastCameraPosition = currentCameraPosition.clone();
        lastCameraDirection = currentCameraDirection.clone();
      }

      // Throttle subsequent calls
      throttling = true;
      setTimeout(() => {
        throttling = false;
      }, 30); // Adjust throttle time as needed
    };

    // Trigger initial grouping
    this.groupMarkers();

    // Use throttled logic for postRender event
    this.viewer.scene.postRender.addEventListener(throttledGroupMarkers);
  },
};
