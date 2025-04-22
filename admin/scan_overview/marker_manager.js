export class MarkerManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.markers = new Map();
    this.clusters = new Map();
    this.currentZoom = 0;
    this.updateTimeout = null;
    this.lastDateRange = null;
    //this.pendingUpdate = false;
    this.isUpdating = false;
    this.setupCameraHandler();
  }

  setupCameraHandler() {
    if (this.cameraEventHandler) return;

    const cameraMoveEndHandler = _.debounce(async () => {
      if (this.isUpdating) {
        return; // Skip if already updating
      }

      if (this.markerManager && this.lastDateRange) {
        await this.updateMarkers(this.lastDateRange);
      }
    }, 250);

    this.cameraEventHandler =
      this.viewer.camera.changed.addEventListener(cameraMoveEndHandler);
  }

  clearAll() {
    // Remove all entities from the viewer
    this.markers.forEach((entity) => {
      try {
        if (entity && this.viewer.entities.contains(entity)) {
          this.viewer.entities.remove(entity);
        }
      } catch (e) {
        console.warn('Error removing marker entity:', e);
      }
    });

    this.clusters.forEach((cluster) => {
      try {
        if (cluster.entity && this.viewer.entities.contains(cluster.entity)) {
          this.viewer.entities.remove(cluster.entity);
        }
      } catch (e) {
        console.warn('Error removing cluster entity:', e);
      }
    });

    this.markers.clear();
    this.clusters.clear();
  }

  async updateMarkersWithDebounce(dateRange) {
    if (this.pendingUpdate) return;

    this.pendingUpdate = true;
    await new Promise((resolve) => setTimeout(resolve, 100)); // Debounce delay

    await this.updateMarkers(dateRange);
    this.pendingUpdate = false;
  }

  async updateMarkers(dateRange) {
    if (this.isUpdating) {
      return; // Skip if already updating
    }

    this.isUpdating = true;

    try {
      if (!dateRange || !dateRange.from || !dateRange.to) {
        console.warn('Invalid date range, using last known range');
        dateRange = this.lastDateRange;
        if (!dateRange) {
          this.isUpdating = false;
          return;
        }
      }

      this.lastDateRange = dateRange;

      const camera = this.viewer.camera;
      const zoom = this.calculateZoomLevel(camera);
      const bounds = this.getCurrentBounds();

      // Clear existing entities before fetching new data
      this.clearAll();

      const response = await fetch('./backend/get_scan_data.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: dateRange.from,
          to: dateRange.to,
          zoom: zoom,
          bounds: bounds,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const clusters = [];
      const unclustered = [];

      // Calculate screen positions for all points first
      console.log('Raw data points:', data.data.length);

      const pointsWithScreenPos = data.data
        .filter((point) => {
          if (!point || (!point.geo_latitude && !point.center?.lat)) {
            console.log(
              'Filtered out point due to missing coordinates:',
              point
            );
            return false;
          }
          return true;
        })
        .map((point) => {
          console.log('Processing point:', point);
          const longitude = point.geo_longitude || point.center?.lng;
          const latitude = point.geo_latitude || point.center?.lat;

          console.log('Checking visibility for:', { longitude, latitude });
          const isVisible = this.isPointVisible(longitude, latitude);
          console.log('Visibility result:', isVisible);

          if (!isVisible) {
            console.log('Point not visible:', { longitude, latitude });
            return null;
          }

          const pos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
            this.viewer.scene,
            Cesium.Cartesian3.fromDegrees(longitude, latitude)
          );

          if (!pos) {
            console.log('Failed to get screen coordinates for point:', {
              longitude,
              latitude,
            });
            return null;
          }

          return {
            ...point,
            screenPos: pos,
            radius: this.calculateClusterRadius(point.count || 1),
          };
        })
        .filter(Boolean);

      console.log('Points before clustering:', pointsWithScreenPos.length);

      // Sort by size (larger clusters first)
      pointsWithScreenPos.sort((a, b) => (b.count || 1) - (a.count || 1));

      // Process points for clustering
      for (const point of pointsWithScreenPos) {
        let shouldCluster = false;
        let nearestCluster = null;
        let minDistance = Infinity;

        // Check against existing clusters
        for (const cluster of clusters) {
          if (!cluster.screenPos) continue;

          // Calculate great circle distance first
          const geoDist = this.calculateDistance(
            {
              lat: point.geo_latitude || point.center?.lat,
              lng: point.geo_longitude || point.center?.lng,
            },
            {
              lat: cluster.center.lat,
              lng: cluster.center.lng,
            }
          );

          // Skip if points are too far apart geographically
          const maxGeoDistance = Math.max(
            50,
            camera.positionCartographic.height / 10000
          );
          if (geoDist > maxGeoDistance) continue;

          const distance = Math.sqrt(
            Math.pow(point.screenPos.x - cluster.screenPos.x, 2) +
              Math.pow(point.screenPos.y - cluster.screenPos.y, 2)
          );

          const combinedRadius = (point.radius + cluster.radius) * 1.2;

          if (distance < combinedRadius) {
            shouldCluster = true;
            if (distance < minDistance) {
              minDistance = distance;
              nearestCluster = cluster;
            }
          }
        }

        if (shouldCluster && nearestCluster) {
          // Merge with nearest cluster
          this.mergeWithCluster(nearestCluster, point);
          nearestCluster.screenPos = point.screenPos;
          nearestCluster.radius = this.calculateClusterRadius(
            nearestCluster.count
          );
        } else {
          if (point.count > 1) {
            clusters.push(point);
          } else {
            unclustered.push(point);
          }
        }
      }

      // Second pass to merge close clusters
      let mergeOccurred;
      do {
        mergeOccurred = false;
        for (let i = 0; i < clusters.length; i++) {
          for (let j = i + 1; j < clusters.length; j++) {
            const cluster1 = clusters[i];
            const cluster2 = clusters[j];

            if (!cluster1.screenPos || !cluster2.screenPos) continue;

            const geoDist = this.calculateDistance(
              { lat: cluster1.center.lat, lng: cluster1.center.lng },
              { lat: cluster2.center.lat, lng: cluster2.center.lng }
            );

            const maxGeoDistance = Math.max(
              50,
              camera.positionCartographic.height / 10000
            );
            if (geoDist > maxGeoDistance) continue;

            const distance = Math.sqrt(
              Math.pow(cluster1.screenPos.x - cluster2.screenPos.x, 2) +
                Math.pow(cluster1.screenPos.y - cluster2.screenPos.y, 2)
            );

            const minSeparation = (cluster1.radius + cluster2.radius) * 1.2;

            if (distance < minSeparation) {
              this.mergeWithCluster(cluster1, cluster2);
              clusters.splice(j, 1);

              // Update screen position and radius
              cluster1.screenPos =
                Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                  this.viewer.scene,
                  Cesium.Cartesian3.fromDegrees(
                    cluster1.center.lng,
                    cluster1.center.lat
                  )
                );
              cluster1.radius = this.calculateClusterRadius(cluster1.count);

              mergeOccurred = true;
              break;
            }
          }
          if (mergeOccurred) break;
        }
      } while (mergeOccurred);

      // Create entities
      clusters.forEach((cluster) => {
        const entity = this.createClusterEntity(cluster);
        if (entity) {
          const key = `${cluster.center.lat},${cluster.center.lng}`;
          if (!this.clusters.has(key)) {
            this.clusters.set(key, {
              entity,
              count: cluster.count,
              scans: cluster.scans,
            });
          }
        }
      });

      // Create individual markers
      unclustered.forEach((point) => {
        if (!point.id || this.markers.has(point.id)) return;

        const entity = this.createMarkerEntity(point);
        if (entity) {
          this.markers.set(point.id, entity);
        }
      });
    } catch (error) {
      console.error('Error updating markers:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  zoomToMarkers() {
    if (this.markers.size === 0 && this.clusters.size === 0) {
      console.warn('No markers or clusters to zoom to');
      return;
    }

    const positions = [];

    // Collect all positions
    this.markers.forEach((entity) => {
      positions.push(entity.position.getValue());
    });

    this.clusters.forEach((cluster) => {
      positions.push(cluster.entity.position.getValue());
    });

    if (positions.length === 0) {
      console.warn('No valid positions found');
      return;
    }

    // Create a bounding sphere containing all positions
    const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);

    // Zoom to the bounding sphere
    this.viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 1.5,
      offset: new Cesium.HeadingPitchRange(
        0,
        -Math.PI / 4,
        boundingSphere.radius * 2
      ),
    });
  }

  renderClusters(clusters) {
    console.log('Rendering clusters:', clusters);

    clusters.forEach((cluster) => {
      try {
        if (cluster.count === 1) {
          // Single marker
          const entity = this.createMarkerEntity(cluster.scans[0]);
          if (entity) {
            this.markers.set(cluster.scans[0].id, entity);
            console.log('Created single marker:', entity);
          }
        } else {
          // Cluster
          const entity = this.createClusterEntity(cluster);
          if (entity) {
            this.clusters.set(cluster.center.lat + ',' + cluster.center.lng, {
              entity,
              count: cluster.count,
              scans: cluster.scans,
            });
            console.log('Created cluster:', entity);
          }
        }
      } catch (error) {
        console.error('Error rendering cluster:', error, cluster);
      }
    });

    console.log('Current markers:', this.markers.size);
    console.log('Current clusters:', this.clusters.size);
  }

  createMarkerEntity(point) {
    console.log('Creating marker entity:', point);

    console.log('Creating marker entity:', point);

    try {
      const id = point.id || point.scans?.[0]?.id;
      if (!id || this.viewer.entities.getById(`scan-${id}`)) {
        return null;
      }

      const position = Cesium.Cartesian3.fromDegrees(
        parseFloat(point.geo_longitude || point.center?.lng),
        parseFloat(point.geo_latitude || point.center?.lat)
      );

      if (!position) {
        console.warn('Invalid position for marker:', point);
        return null;
      }

      return this.viewer.entities.add({
        id: `scan-${id}`,
        position: position,
        point: {
          pixelSize: this.getMarkerSize(),
          color: Cesium.Color.YELLOW.withAlpha(0.8),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 5000000, 0.4),
          show: true,
        },
        description: this.generateDescription(point.scans?.[0] || point),
        show: true,
      });
    } catch (error) {
      console.error('Error creating marker entity:', error);
      return null;
    }
  }

  createClusterEntity(cluster) {
    console.log('Creating cluster entity with center:', cluster.center);

    try {
      return this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          parseFloat(cluster.center.lng),
          parseFloat(cluster.center.lat)
        ),
        billboard: {
          image: this.createClusterIcon(cluster.count),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 5000000, 0.4),
          show: true, // Explicitly set show to true
        },
        description: this.generateClusterDescription(cluster.scans),
        show: true, // Explicitly set show to true
      });
    } catch (error) {
      console.error('Error creating cluster entity:', error);
      return null;
    }
  }

  isPointVisible(longitude, latitude) {
    try {
      // Convert coordinate strings to numbers if needed
      const lon = parseFloat(longitude);
      const lat = parseFloat(latitude);

      if (isNaN(lon) || isNaN(lat)) {
        console.warn('Invalid coordinates:', longitude, latitude);
        return false;
      }

      // Get the camera's position in cartographic coordinates (radians)
      const cameraPosition = this.viewer.camera.positionCartographic;
      const camereLon = Cesium.Math.toDegrees(cameraPosition.longitude);
      const camereLat = Cesium.Math.toDegrees(cameraPosition.latitude);
      const heightKm = cameraPosition.height / 1000;

      // If we're zoomed in close enough, use screen space check
      if (heightKm < 1000) {
        const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          this.viewer.scene,
          Cesium.Cartesian3.fromDegrees(lon, lat)
        );

        if (screenPos) {
          const canvas = this.viewer.canvas;
          const inView =
            screenPos.x >= 0 &&
            screenPos.x <= canvas.clientWidth &&
            screenPos.y >= 0 &&
            screenPos.y <= canvas.clientHeight;
          return inView;
        }
        return true;
      }

      // For higher altitudes, use distance check with a more lenient threshold
      const distance = this.calculateDistance(
        { lat: camereLat, lng: camereLon },
        { lat: lat, lng: lon }
      );

      // More lenient threshold calculation
      // At max height (20000km), allow points up to 10000km away
      // At min height (1000km), allow points up to 2000km away
      const maxDistance = Math.max(2000, heightKm * 0.5);

      return distance <= maxDistance;
    } catch (error) {
      console.warn('Error checking point visibility:', error);
      return true; // If there's an error, assume point is visible
    }
  }

  calculateZoomLevel(camera) {
    const height = camera.positionCartographic.height;
    return Math.floor(Math.log2(360 / (height / 1000000)));
  }

  calculateClusterRadius(count) {
    const minSize = 75;
    const maxSize = 150;
    const maxCount = 200;
    const baseRadius =
      Math.min(
        maxSize,
        minSize + (maxSize - minSize) * Math.min(count / maxCount, 1)
      ) / 2;

    return baseRadius;
  }

  // Helper method to calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toRad(value) {
    return (value * Math.PI) / 180;
  }

  // Helper method to merge a point or cluster with an existing cluster
  mergeWithCluster(cluster, point) {
    const pointCount = point.count || 1;
    const pointScans = point.scans || [point];

    cluster.count += pointCount;
    cluster.scans.push(...pointScans);

    // Recalculate center based on weighted average
    const totalWeight = cluster.count;
    cluster.center = {
      lat:
        (cluster.center.lat * (cluster.count - pointCount) +
          (point.center?.lat || point.geo_latitude) * pointCount) /
        totalWeight,
      lng:
        (cluster.center.lng * (cluster.count - pointCount) +
          (point.center?.lng || point.geo_longitude) * pointCount) /
        totalWeight,
    };
  }

  getCurrentBounds() {
    const scene = this.viewer.scene;
    const camera = scene.camera;
    const canvas = scene.canvas;
    const pixelRatio = window.devicePixelRatio || 1;

    // Calculate the minimum separation distance based on zoom level
    const height = camera.positionCartographic.height;
    const zoomLevel = this.calculateZoomLevel(camera);

    // More granular pixel distance calculation
    const basePixelDistance = Math.min(
      canvas.clientWidth / 8, // Max 1/8th of screen width
      Math.max(50, height / 15000) // Minimum 50px, scaled with height
    );

    // Scale pixel distance based on zoom
    const pixelDistance =
      basePixelDistance * Math.pow(0.8, Math.max(0, zoomLevel - 3));

    // Get the geographic bounds
    const corners = [
      new Cesium.Cartesian2(0, 0),
      new Cesium.Cartesian2(canvas.clientWidth, 0),
      new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight),
      new Cesium.Cartesian2(0, canvas.clientHeight),
    ];

    let west = 180;
    let east = -180;
    let south = 90;
    let north = -90;

    corners.forEach((corner) => {
      const ray = camera.getPickRay(corner);
      if (!ray) return;

      const intersection = scene.globe.pick(ray, scene);
      if (!intersection) return;

      const cartographic = Cesium.Cartographic.fromCartesian(intersection);
      if (!cartographic) return;

      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);

      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    });

    // Handle edge cases
    if (west === 180 || east === -180 || south === 90 || north === -90) {
      const centerCartographic = camera.positionCartographic;
      const centerLon = Cesium.Math.toDegrees(centerCartographic.longitude);
      const centerLat = Cesium.Math.toDegrees(centerCartographic.latitude);
      const visibleRange = (camera.positionCartographic.height / 1000000) * 10;

      west = Math.max(-180, Math.min(180, centerLon - visibleRange));
      east = Math.max(-180, Math.min(180, centerLon + visibleRange));
      south = Math.max(-90, Math.min(90, centerLat - visibleRange));
      north = Math.max(-90, Math.min(90, centerLat + visibleRange));
    }

    // Handle date line crossing
    if (east < west) {
      if (Math.abs(east + 360 - west) < Math.abs(east - west)) {
        east += 360;
      } else {
        west -= 360;
      }
    }

    // Add buffer and ensure bounds are within valid ranges
    const bufferDegrees = 1;
    const geoBounds = {
      west: Math.max(-180, Math.min(180, west - bufferDegrees)),
      east: Math.max(-180, Math.min(180, east + bufferDegrees)),
      south: Math.max(-90, Math.min(90, south - bufferDegrees)),
      north: Math.max(-90, Math.min(90, north + bufferDegrees)),
    };

    // Maintain both clustering parameters and geographic bounds
    return {
      ...geoBounds,
      pixelDistance,
      checkOverlap: (newCluster) => {
        const placedClusters = Array.from(this.clusters.values()).map((c) => ({
          center: c.entity.position.getValue(),
          count: c.count,
        }));

        const newRadius = this.calculateClusterRadius(newCluster.count || 1);
        const newPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          scene,
          Cesium.Cartesian3.fromDegrees(
            newCluster.center?.lng || newCluster.geo_longitude,
            newCluster.center?.lat || newCluster.geo_latitude
          )
        );

        if (!newPos) return true; // Off screen, consider as overlapping

        for (const placed of placedClusters) {
          const placedRadius = this.calculateClusterRadius(placed.count);
          const placedPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
            scene,
            placed.center
          );

          if (!placedPos) continue;

          const minDistance = (newRadius + placedRadius) * pixelRatio;
          const actualDistance = Math.sqrt(
            Math.pow(newPos.x - placedPos.x, 2) +
              Math.pow(newPos.y - placedPos.y, 2)
          );

          if (actualDistance < minDistance) {
            return true; // Overlap detected
          }
        }

        return false;
      },
    };
  }

  getMarkerSize() {
    const isSmallScreen = window.innerWidth < 768;
    const minSize = isSmallScreen ? 20 : 36;
    const zoom = this.viewer.camera.positionCartographic.height;
    return minSize * Math.min(1, Math.log(zoom) / Math.log(10));
  }

  createClusterIcon(count) {
    const minSize = 75;
    const maxSize = 150;
    const maxCount = 200;
    const isSmallScreen = window.innerWidth < 768;
    const size = Math.min(
      maxSize,
      minSize + (maxSize - minSize) * Math.min(count / maxCount, 1)
    );

    const canvas = document.createElement('canvas');
    const baseRadius = size / 2 - 4;
    const radius = isSmallScreen ? baseRadius : baseRadius * 2;

    canvas.width = radius * 2 + 8;
    canvas.height = radius * 2 + 8;

    const context = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = 'rgba(255, 255, 0, 0.8)';
    context.fill();
    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.stroke();

    const fontSize = Math.max(14, size / (isSmallScreen ? 3.75 : 8.1));

    context.fillStyle = 'black';
    context.font = `bold ${fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(count.toString(), centerX, centerY);

    return canvas;
  }

  generateDescription(scan) {
    const datetime = new Date(scan.datetime);
    const formattedDate = !isNaN(datetime)
      ? datetime.toLocaleString()
      : 'Unknown Date';
    const location =
      [scan.geo_city, scan.geo_country].filter(Boolean).join(', ') ||
      'Unknown Location';

    return `
      <div class="scan-popup">
        <h3>Scan Details</h3>
        <table>
          <tr><td><strong>Time:</strong></td><td>${formattedDate}</td></tr>
          <tr><td><strong>Location:</strong></td><td>${location}</td></tr>
          <tr><td><strong>Region:</strong></td><td>${
            scan.geo_region || 'Unknown'
          }</td></tr>
          <tr><td><strong>IP:</strong></td><td>${scan.ip}</td></tr>
          <tr><td><strong>Organization:</strong></td><td>${
            scan.geo_organization || 'Unknown'
          }</td></tr>
          <tr><td><strong>Timezone:</strong></td><td>${
            scan.geo_timezone || 'Unknown'
          }</td></tr>
          <tr><td><strong>Browser:</strong></td><td>${scan.browser}</td></tr>
        </table>
      </div>
    `;
  }

  generateClusterDescription(scans) {
    if (!scans || scans.length === 0) {
      return '<div class="cluster-popup"><h3>No scan data available</h3></div>';
    }

    const countryStats = scans.reduce((acc, scan) => {
      const country = scan.geo_country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const countryStatsHtml = Object.entries(countryStats)
      .map(
        ([country, count]) =>
          `<p>${country}: ${count} scan${count !== 1 ? 's' : ''}</p>`
      )
      .join('');

    return `
      <div class="cluster-popup">
        <h3>${scans.length} Scans in this Area</h3>
        <div class="country-stats">
          <h4>Scans by Country:</h4>
          ${countryStatsHtml}
        </div>
        <hr>
        ${scans
          .map((scan) => {
            const datetime = new Date(scan.datetime);
            const formattedDate = !isNaN(datetime)
              ? datetime.toLocaleString()
              : 'Unknown Date';
            const location =
              [scan.geo_city, scan.geo_country].filter(Boolean).join(', ') ||
              'Unknown Location';

            return `
            <div class="scan-item">
              <p><strong>${formattedDate}</strong></p>
              <p>${location}</p>
            </div>
          `;
          })
          .join('<hr>')}
      </div>
    `;
  }
}
