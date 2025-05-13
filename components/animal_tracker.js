import LoginStreakComponent from './login_streak_window.js';
import ExpiredSessionModal from './expired_session_modal.js';
import NotificationManager from './notification_manager.js';
import TutorialManager from './tutorial_manager.js';
import customInfoboxComponent from './animal_information_window.js';
import userMenuComponent from './user_menu.js';
import animalMarkerComponent from './animal_marker.js';
import markerManagerComponent from './marker_manager.js';
import {
  getAnimalIconUrl,
  getAnimalPictureUrl,
  getAnimalShapeUrl,
  generateImageryViewModels,
} from './helper_functions.js';

export default {
  components: {
    NotificationManager,
    TutorialManager,
    customInfoboxComponent,
    userMenuComponent,
    markerManagerComponent,
    animalMarkerComponent,
    ExpiredSessionModal,
    LoginStreakComponent,
  },
  template: `
    <div>
      <NotificationManager 
        v-if="notificationData.length > 0 && activeModalType === 'notification'"
        :componentKey="'notification-' + modalKey"
        :pluginDirUrl="pluginDirUrl"
        :notifications="notificationData"
        :is_new_user="Boolean(kukudushi?.new_user)"
        @close-notification="handleNotificationClose"
      />
      
      <TutorialManager
        v-if="isTutorialActive && activeModalType === 'tutorial'"
        ref="tutorialManager"
        :componentKey="'tutorial-' + modalKey"
        :pluginDirUrl="pluginDirUrl"
        :is-active="isTutorialActive"
        :kukudushi="kukudushi"
        :animals="animals"
        :viewer="viewer"
        @update-user-menu="updateUserMenu"
        @activate-animals-tab="changeAnimalManagerMenuTabToAnimals"
        @close-infobox="closeInfobox"
        @force-show-marker="focusOnAnimal"
        @tutorial-completed="handleTutorialComplete"
        @tutorial-skipped="handleTutorialSkipped"
      />

      <ExpiredSessionModal
        v-if="activeModalType === 'expired-session'"
        :componentKey="'expired-session-' + modalKey"
        :pluginDirUrl="pluginDirUrl"
        :kukudushi="kukudushi"
      />

      <div id="cesiumContainer" style="width: 100%; height: 100vh;"></div>
      <div class="header-container">
        <div class="header-top">
            <!-- Menu Button -->
            <button id="menu-button">
                <img :src="menuIconUrl" alt="Menu Icon" />
            </button>

            <div class="kukudushi-logo">
                <div class="kukudushi-logo-img-container">
                    <img class="kukudushi-logo-img" src="https://kukudushi.com/wp-content/uploads/2024/09/kukudushi-logo-colored-1024x1024.png"/>
                </div>
                <div class="kukudushi-logo-text">
                    KUKUDUSHI
                </div>
            </div>
            <div class="header-item-right">
              <button 
                class="tutorial-button"
                id="tutorial-button"
                @click="startTutorial"
                :disabled="isTutorialActive"
              >
                <img :src="tutorialIconUrl" alt="Tutorial Icon" />
              </button>
            </div>
        </div>
        <div class="header-bottom">
        </div>
      </div>

      <LoginStreakComponent 
        :loading="loading"
        :loadingComplete="loadingComplete"
        :points_data="points_data"
        :points_streak="points_streak"
      />
      
      <!-- Animal Select Panel -->
      <div id="animal-select-panel" v-show="animalManagerMenuVisible">
        <userMenuComponent 
          :animals="animals"
          :selectedAnimalIds="selectedAnimalIds"
          :loading="loading"
          :loadingComplete="loadingComplete"
          :pluginDirUrl="pluginDirUrl"
          :kukudushi="kukudushi"
          :buyingAnimalId="buyingAnimalId"
          :animal_purchase_status="animal_purchase_status"
          :userPoints="kukudushi?.points || 0"
          @buy-animal="buyAnimal"
          @update-buying-animal="updateBuyingAnimal"
          @animal-select="onAnimalSelect"
          @focus-animal="focusAnimal"
          @set-animal-purchase-status="setAnimalPurchaseStatus"
        />
      </div>
      
        <!-- Custom Info Box -->
        <transition name="custom-infoBox-transition" appear>
          <customInfoboxComponent 
            v-if="selectedEntity && getAnimalByEntity(selectedEntity)"
            :pluginDirUrl="pluginDirUrl"
            :selectedEntity="selectedEntity" 
            :animal="getAnimalByEntity(selectedEntity)" 
            :buyingAnimalId="buyingAnimalId"
            :userPoints="kukudushi?.points || 0"
            @close-infobox="closeInfobox"
            @fly-to-first-position="flyToFirstPosition"
            @buy-animal="buyAnimal"
            @update-buying-animal="updateBuyingAnimal"
          />
        </transition>

      <!-- Marker Manager to handle all markers -->
      <markerManagerComponent
        v-if="viewer && track_data_collection.length > 0"
        :tracks_data="track_data_collection"
        :pluginDirUrl="pluginDirUrl"
        :viewer="viewer"
        @marker-clicked="onMarkerClicked"
      />

      <div class="toolbar-right-container">
        <div class="zoom-controls-container">
          <button class="zoom-button" id="zoom-in-button" @click="zoomIn">
            +
          </button>
          <button class="zoom-button" id="zoom-out-button" @click="zoomOut">
            -
          </button>
        </div>

        <button class="shop-button" id="shop-button" @click="openShop">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="24" height="24">
            <path d="M740 854C740 883 763 906 792 906S844 883 844 854 820 802 792 802 740 825 740 854ZM217 156H958C977 156 992 173 989 191L957 452C950 509 901 552 843 552H297L303 581C311 625 350 656 395 656H875C892 656 906 670 906 687S892 719 875 719H394C320 719 255 666 241 593L141 94H42C25 94 10 80 10 62S25 31 42 31H167C182 31 195 42 198 56L217 156ZM230 219L284 490H843C869 490 891 470 895 444L923 219H230ZM677 854C677 791 728 740 792 740S906 791 906 854 855 969 792 969 677 918 677 854ZM260 854C260 791 312 740 375 740S490 791 490 854 438 969 375 969 260 918 260 854ZM323 854C323 883 346 906 375 906S427 883 427 854 404 802 375 802 323 825 323 854Z" 
                  stroke="black" 
                  stroke-width="20">
            </path>
          </svg>
        </button>
      </div>

      <div class="footer-container" 
          :class="{ 'footer-background-visible': animalManagerMenuVisible }" 
          :style="footerStyle"
      >
        <div class="footer-top">
            <div class="kukus-container">
                <div class="kukus-img-container">
                    <img class="kukus-img" :src="pluginDirUrl + '/media/plus_points_coin.webp'"/>
                </div>
                <div class="kukus-amount">
                    {{ formattedPoints }}
                </div>
            </div>
            <div class="footer-item-right">
              <!-- Center Globe Button -->
              <button class="center-globe-button" id="center-globe-button" @click="centerGlobe">
                  <svg width="30" height="29" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" overflow="hidden" viewBox="0 0 97 96">
                    <defs>
                        <clipPath id="clip0">
                          <rect x="377" y="128" width="97" height="96"></rect>
                        </clipPath>
                        <clipPath id="clip1">
                          <rect x="378" y="128" width="96" height="96"></rect>
                        </clipPath>
                        <clipPath id="clip2">
                          <rect x="378" y="128" width="96" height="96"></rect>
                        </clipPath>
                        <clipPath id="clip3">
                          <rect x="378" y="128" width="96" height="96"></rect>
                        </clipPath>
                    </defs>
                    <g clip-path="url(#clip0)" transform="translate(-377 -128)">
                        <g clip-path="url(#clip1)">
                          <g clip-path="url(#clip2)">
                              <g clip-path="url(#clip3)">
                                <path d="M426 138C405 138 388 155 388 176 388 197 405 214 426 214 447 214 464 197 464 176 464 155 447 138 426 138ZM392 176C392 167.1 395.4 159.1 401 153 401.9 153.5 402.8 154.3 403 155L403 161.3C403 161.7 403.1 162.2 403.4 162.5L410 171 410.5 170.5C410.8 170.2 410.9 169.7 410.7 169.3L409.5 167.3C409 166.5 409.8 165.5 410.7 165.8 411 165.9 411.2 166.1 411.3 166.3L414.6 172.8C415 173.5 415.6 174.1 416.3 174.3L420.7 175.8C421 175.9 421.2 176.1 421.3 176.3L421.6 176.8C421.9 177.5 422.6 177.9 423.4 177.9L424.6 177.9C424.9 177.9 425.2 178.1 425.4 178.3L426.7 180.2C427 180.6 427.4 180.9 427.9 181L430 181.5C430.6 181.6 430.9 182.3 430.7 182.8 430.7 182.8 429.1 184.4 429.1 186.7 429.1 193.3 435.1 195.2 435.1 196.7 435.1 200.8 434.5 206.5 434.2 208.7 431.6 209.3 428.9 209.7 426.1 209.7 407.3 210 392 194.7 392 176ZM438.8 207.5C441 205.6 444.7 202.4 446 201 447.7 199.1 448 196 448 196 448 196 455 194.1 455 189 455 185.5 448 184 448 184 446.8 180.1 440.9 178 436 178 434.9 178 431 180 431 180L429 179 429 176C429 175.4 428.6 175 428 175L426 175 426 172C426 171.4 425.6 171 425 171L424 171 422.9 171.7C421.9 172.4 420.5 172 420 170.9 420 170.9 419 169.5 419 168.9 419 164.6 424 164.9 424 164.9L426.2 164.9C426.7 164.9 427.1 165.2 427.2 165.7L427.8 168.2C427.9 168.6 428.3 169 428.8 169L429.2 169C429.7 169 430.1 168.7 430.2 168.2L430.9 164.5C431 164.2 431.1 163.9 431.3 163.6L434.1 160.1C434.7 159.4 435.5 159 436.4 159L439 159C439.6 159 440 158.6 440 158L440 157 439.7 156.7C439.1 156.1 439.5 155 440.4 155L441 155C441.6 155 442 155.4 442 156 442 156.6 442.4 157 443 157L444 157 444.6 154.4C444.8 153.5 444.4 152.7 443.7 152.2L435.2 147.1C435.1 147 434.9 147 434.7 147L433 147C431.9 147 431 147.9 431 149L431 150C431 150.6 430.6 151 430 151L429 151 428 150 425 150C424.4 150 424 149.6 424 149L424 146.5C424 146.2 424.1 145.9 424.4 145.7L430.8 143 431.8 144.7C432 144.9 432.2 145 432.5 145L435 145C435.6 145 436 144.6 436 144L436 143.5C449.9 147.8 460 160.7 460 176 460 190.2 451.2 202.4 438.8 207.5Z" fill="#000000" fill-rule="nonzero" fill-opacity="1"></path>
                                <path d="M438.3 171.8 433.5 170.2C433.1 170.1 432.8 170.1 432.4 170.2L429 171C428.7 171.2 428.6 171.6 429 172L433.6 172C433.9 172 434.1 172 434.3 172.1L437.8 173.5C438.4 173.7 439 173.3 439 172.7 439 172.3 438.7 171.9 438.3 171.8Z" fill="#000000" fill-rule="nonzero" fill-opacity="1"></path>
                              </g>
                          </g>
                        </g>
                    </g>
                  </svg>

              </button>
            </div>
        </div>
        <div class="footer-bottom">
        </div>
      </div>

    </div>
  `,
  data() {
    return {
      viewer: null,
      selectedEntity: null,
      kukudushi: null,
      animals: [],
      buyingAnimalId: null,
      pluginDirUrl: kukudushiData.plugin_url,
      points_data: null,
      points_streak: null,
      notificationData: [],
      track_data_collection: [],
      selectedAnimalIds: [], // Store multiple selected animal IDs
      loading: true,
      loadingComplete: false,
      activePointColor: '#F0BC3C',
      activePolylineColor: '#0F9CB9',
      imageryViewModels: [],
      animalManagerMenuVisible: false, // Renamed variable for menu visibility
      animal_purchase_status: null,
      screenWidth: window.innerWidth,
      isTutorialActive: false,
      tutorialIconUrl: kukudushiData.plugin_url + '/media/tutorial_icon.webp',
      activeModalType: null, // 'notification' or 'tutorial'
      modalKey: 0,
    };
  },
  errorCaptured(err, vm, info) {
    console.error(`[Component Error]: ${err.toString()}\nInfo: ${info}`);
    return false; // Prevents the error from propagating to parent components
  },
  watch: {
    selectedEntity(newVal) {
      console.log('selectedEntity changed:', newVal);
    },
  },
  methods: {
    setupAutomaticTilt() {
      // Set up continuous tilt updates during camera movement
      this.viewer.scene.preRender.addEventListener(() => {
        try {
          const camera = this.viewer.camera;
          const currentHeight = camera.positionCartographic.height;
          const { tilt: targetTilt } =
            this.calculateTiltForHeight(currentHeight);
          const currentTilt = camera.pitch;

          // Only apply if the difference is significant
          if (Math.abs(targetTilt - currentTilt) > Cesium.Math.EPSILON5) {
            // Use a smoother transition during active animations
            const smoothFactor = 0.15; // Default smooth factor

            // Calculate the interpolated tilt
            const newTilt = Cesium.Math.lerp(
              currentTilt,
              targetTilt,
              smoothFactor
            );

            // Get the point on the globe the camera is currently focused on
            const centerRay = new Cesium.Ray(camera.position, camera.direction);
            const centerPoint = this.viewer.scene.globe.pick(
              centerRay,
              this.viewer.scene
            );

            if (centerPoint) {
              // First, just update the tilt
              camera.setView({
                orientation: {
                  heading: camera.heading,
                  pitch: newTilt,
                  roll: 0,
                },
              });

              // Then adjust the camera position to keep looking at the same point
              const newRay = new Cesium.Ray(camera.position, camera.direction);
              const surfacePoint = this.viewer.scene.globe.pick(
                newRay,
                this.viewer.scene
              );

              if (surfacePoint) {
                const offsetVector = Cesium.Cartesian3.subtract(
                  centerPoint,
                  surfacePoint,
                  new Cesium.Cartesian3()
                );

                if (Cesium.Cartesian3.magnitude(offsetVector) > 10) {
                  // Only adjust if offset is significant
                  // Adjust camera position to keep the same center point
                  const newPosition = Cesium.Cartesian3.add(
                    camera.position,
                    offsetVector,
                    new Cesium.Cartesian3()
                  );

                  camera.position = newPosition;
                }
              }
            } else {
              // If we couldn't get a center point (e.g., over ocean), just update tilt
              camera.setView({
                orientation: {
                  heading: camera.heading,
                  pitch: newTilt,
                  roll: 0,
                },
              });
            }
          }
        } catch (e) {
          console.error('Error in tilt adjustment:', e);
        }
      });
    },
    calculateTiltForHeight(height) {
      const tiltZones = [
        { maxHeight: 1500000, minHeight: 250000, maxAngle: -90, minAngle: -70 }, // Far zone
        { maxHeight: 250000, minHeight: 100000, maxAngle: -70, minAngle: -45 }, // Middle zone
        { maxHeight: 100000, minHeight: 25000, maxAngle: -45, minAngle: -30 }, // Close zone
      ];

      let targetTilt = Cesium.Math.toRadians(-90); // Default to straight down
      let activeZone = -1;

      // Check through all zones
      for (let i = 0; i < tiltZones.length; i++) {
        const zone = tiltZones[i];
        if (height <= zone.maxHeight && height >= zone.minHeight) {
          // Calculate normalized position (0 = max height, 1 = min height)
          const zoneRange = zone.maxHeight - zone.minHeight;
          const normalizedPosition = (zone.maxHeight - height) / zoneRange;

          // Use cubic easing
          const easedPosition =
            normalizedPosition *
            normalizedPosition *
            (3 - 2 * normalizedPosition);

          // Interpolate between angles
          targetTilt = Cesium.Math.toRadians(
            zone.maxAngle + easedPosition * (zone.minAngle - zone.maxAngle)
          );
          activeZone = i;
          break;
        }
      }

      // Handle heights outside zones
      if (height > tiltZones[0].maxHeight) {
        targetTilt = Cesium.Math.toRadians(tiltZones[0].maxAngle);
      } else if (height < tiltZones[tiltZones.length - 1].minHeight) {
        targetTilt = Cesium.Math.toRadians(
          tiltZones[tiltZones.length - 1].minAngle
        );
      }

      return { tilt: targetTilt, activeZone };
    },
    startTutorial() {
      console.log('Start tutorial clicked');
      this.activeModalType = 'tutorial';
      this.isTutorialActive = true;

      // Find the tutorial component and call startTutorial
      this.$nextTick(() => {
        const tutorialManager = this.$refs.tutorialManager;
        if (tutorialManager) {
          tutorialManager.startTutorial();
        }
      });
    },

    openShop() {
      window.open('https://kukudushi.com/shop/', '_blank');
    },

    handleTutorialComplete() {
      console.log('Tutorial completed!');
      setTimeout(() => {
        this.isTutorialActive = false;
        this.activeModalType = null;
        this.modalKey++;
      }, 2000);
    },

    handleTutorialSkipped() {
      console.log('Tutorial skipped!');
      setTimeout(() => {
        this.isTutorialActive = false;
        this.activeModalType = null;
        this.modalKey++;
      }, 2000);
    },
    showPointsVisuals(pointsAwarded, originalPoints) {
      if (!pointsAwarded || pointsAwarded <= 0) return;

      // Target element for the endpoint positioning
      const footerImage = document.querySelector('.kukus-img-container');

      // Calculate dynamic positioning
      let startBottom = window.innerHeight * 0.33; // 33% of viewport height
      let startLeft = window.innerWidth / 2; // Center horizontally
      let endBottom = 0;

      if (footerImage) {
        const rect = footerImage.getBoundingClientRect();
        startLeft = rect.left + rect.width / 2;
        endBottom = window.innerHeight - rect.top - rect.height / 2;
      }

      // Create the DOM elements dynamically
      const pointsContainer = document.createElement('div');
      pointsContainer.id = 'points';
      pointsContainer.classList.add('points');

      // Apply dynamic positioning
      pointsContainer.style.setProperty(
        '--dynamic-start-bottom',
        `${startBottom}px`
      );
      pointsContainer.style.setProperty(
        '--dynamic-start-left',
        `${startLeft}px`
      );
      pointsContainer.style.setProperty(
        '--dynamic-end-bottom',
        `${endBottom}px`
      );

      const pointsImage = document.createElement('div');
      pointsImage.classList.add('points-image');

      const img = document.createElement('img');
      img.src = `${this.pluginDirUrl}media/plus_points_coin.webp`;
      img.classList.add('img');

      const imgText = document.createElement('div');
      imgText.classList.add('img-text');
      imgText.innerText = `+${pointsAwarded}`;

      pointsImage.appendChild(img);
      pointsImage.appendChild(imgText);
      pointsContainer.appendChild(pointsImage);
      document.body.appendChild(pointsContainer);

      // Trigger coin animation
      setTimeout(() => {
        pointsContainer.classList.add('visible');

        // Delay the counter animation until the coin animation is nearly done
        const pointsDisplay = document.querySelector('.kukus-amount');
        if (pointsDisplay) {
          setTimeout(() => {
            this.animatePoints(
              pointsDisplay,
              originalPoints,
              originalPoints + pointsAwarded
            );
          }, 1400); // Delay by 1400ms (just before the coin finishes)
        }

        setTimeout(() => {
          pointsContainer.remove(); // Cleanup
        }, 2000);
      }, 100);
    },
    // Method to animate the points counter
    animatePoints(element, start, end) {
      let current = start;
      const duration = 1000; // Total animation duration
      const increment = Math.ceil((end - start) / 100); // Step increment
      const halfDuration = duration / 2; // Halfway mark for scaling

      // Apply the initial transition for smooth scaling
      element.style.transition =
        'transform 0.5s ease-in-out, font-size 0.5s ease-in-out';

      // Scale up font size to 1.5x
      element.style.transform = 'scale(1.5)';

      // Start the counter animation
      const startTime = performance.now();

      const updateCounter = (timestamp) => {
        const elapsedTime = timestamp - startTime;

        if (current < end) {
          current += increment;
          if (current > end) current = end;

          element.innerText = current.toLocaleString();

          // When halfway through, scale back to normal size
          if (elapsedTime > halfDuration) {
            element.style.transform = 'scale(1)';
          }

          requestAnimationFrame(updateCounter);
        } else {
          element.innerText = end.toLocaleString();
          element.style.transform = 'scale(1)'; // Ensure final reset

          // Update the Vue data property (total points)
          this.kukudushi.points = end;
        }
      };

      requestAnimationFrame(updateCounter);
    },
    handleNotificationClose(notificationData) {
      // Only reset the modal if this is the last notification
      if (notificationData.isLastNotification) {
        setTimeout(() => {
          this.activeModalType = null;
          this.modalKey++;
        }, 2000);
      }

      // Prepare data for API call
      const payload = {
        kukudushi_id: this.kukudushi.id,
        new_user: notificationData.newUser || false,
      };

      // Add start and end datetime only for regular notifications
      if (!notificationData.newUser) {
        payload.notification_id = notificationData.id;
        payload.start_read = notificationData.startTime.toISOString();
        payload.end_read = notificationData.endTime.toISOString();
      }

      // API request to backend
      fetch(`${this.pluginDirUrl}backend/handle_notification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status !== 'success') {
            console.warn('Failed to mark notification as read:', data.message);
          } else {
            if (this.kukudushi.new_user) {
              this.kukudushi.new_user = false;
            }
          }
        })
        .catch((error) => {
          console.error('Error sending notification read data:', error);
        });
    },
    zoomIn() {
      const camera = this.viewer.camera;
      const currentPosition = camera.positionCartographic;
      const currentHeading = camera.heading;

      // Calculate new height (50% of current height)
      const zoomFactor = 0.5;
      const newHeight = currentPosition.height * zoomFactor;

      // Calculate target tilt for the new height
      const { tilt: targetTilt } = this.calculateTiltForHeight(newHeight);

      // Simple zoom with correct tilt
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          currentPosition.longitude,
          currentPosition.latitude,
          newHeight
        ),
        orientation: {
          heading: currentHeading,
          pitch: targetTilt, // Use calculated tilt
          roll: 0,
        },
        duration: 0.5,
      });
    },

    zoomOut() {
      const camera = this.viewer.camera;
      const currentPosition = camera.positionCartographic;
      const currentHeading = camera.heading;

      // Calculate new height (200% of current height)
      const zoomFactor = 2.0;
      const newHeight = currentPosition.height * zoomFactor;

      // Calculate target tilt for the new height
      const { tilt: targetTilt } = this.calculateTiltForHeight(newHeight);

      // Simple zoom with correct tilt
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          currentPosition.longitude,
          currentPosition.latitude,
          newHeight
        ),
        orientation: {
          heading: currentHeading,
          pitch: targetTilt, // Use calculated tilt
          roll: 0,
        },
        duration: 0.5,
      });
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
    centerGlobe() {
      const scene = this.viewer.scene;
      const camera = this.viewer.camera;
      const ellipsoid = scene.globe.ellipsoid;

      const cameraCartographic = camera.positionCartographic;
      const targetZoomLevel = ellipsoid.maximumRadius * 3;

      if (cameraCartographic.height < targetZoomLevel) {
        const newPosition = Cesium.Cartesian3.fromRadians(
          cameraCartographic.longitude,
          cameraCartographic.latitude,
          targetZoomLevel
        );

        camera.flyTo({
          destination: newPosition,
          orientation: {
            heading: camera.heading,
            pitch: Cesium.Math.toRadians(-90), // Force vertical view
            roll: 0,
          },
          duration: 1.5,
        });
      }
    },
    setAnimalPurchaseStatus(status) {
      this.animal_purchase_status = status;
    },
    updateUserMenu(on) {
      console.log(
        'animal_tracker.js - updateUserMenu(' + on ? 'true)' : 'false)'
      );
      if (on && !this.animalManagerMenuVisible) {
        this.toggleAnimalManagerMenu();
      } else if (!on && this.animalManagerMenuVisible) {
        this.toggleAnimalManagerMenu();
      }
    },
    toggleAnimalManagerMenu() {
      if (!this.animalManagerMenuVisible) {
        //Close animal information window if open
        this.closeInfobox();

        //Show line underneath header section when menu is visible
        jQuery('.header-top').css({
          'border-bottom': '1px solid #fff5',
          'padding-bottom': '10px',
        });

        //Change cesium full screen button background color and color
        jQuery('.cesium-button.cesium-fullscreenButton').css({
          'background-color': 'var(--e-global-color-62937a8)',
        });

        this.animalManagerMenuVisible = true;
      } else {
        //Remove line underneath header section when menu is NOT visible
        jQuery('.header-top').css({
          'border-bottom': '',
          'padding-bottom': '',
        });

        //Restore original cesium full screen button background color and color
        jQuery('.cesium-button.cesium-fullscreenButton').css({
          'background-color': 'var(--e-global-color-accent)',
        });

        this.animalManagerMenuVisible = false;
      }
    },
    changeAnimalManagerMenuTabToAnimals() {
      const animalsTab = document.querySelector(
        '.dashboard-tablinks:first-child'
      );
      animalsTab.click();

      console.log('Animals tab activated');
    },
    // Method specifically for tutorial support
    focusOnAnimal(animalId) {
      console.log('Tutorial requested to focus on animal ID:', animalId);
      
      // Find the animal in the list
      const animal = this.animals.find(a => a.id === animalId);
      if (!animal) {
        console.error('Cannot focus on animal - ID not found:', animalId);
        return;
      }
      
      // Make sure the animal is set as owned for tutorial purposes
      animal.is_owned = true;
      
      // Find the corresponding track
      const track = this.track_data_collection.find(t => t.id === animalId);
      if (!track || !track.positions || track.positions.length === 0) {
        console.error('No track data found for animal:', animalId);
        return;
      }
      
      // Get position
      const position = track.positions[0].position;
      
      // Ensure the animal is selected so tracks are visible
      if (!this.selectedAnimalIds.includes(animalId)) {
        this.selectedAnimalIds.push(animalId);
        this.updateTrackVisibility();
      }
      
      // Use a reasonable default altitude of ~350km
      const DEFAULT_VIEW_ALTITUDE = 350000;
      
      console.log('Setting up precisely centered view on animal marker');
      
      // Get cartographic coordinates
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      
      // Calculate an adjusted position that will center the marker in view
      // We need to offset our viewpoint southward to ensure the marker (which rises above ground) is centered
      const adjustedLat = cartographic.latitude - 0.005; // Shift camera position slightly south
      
      // Create a camera position that's offset to ensure marker is centered
      const cameraPosition = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        adjustedLat, // Offset south
        cartographic.height + DEFAULT_VIEW_ALTITUDE
      );
      
      // Calculate the direction vector from camera to target
      const direction = Cesium.Cartesian3.subtract(
        position, 
        cameraPosition, 
        new Cesium.Cartesian3()
      );
      Cesium.Cartesian3.normalize(direction, direction);
      
      // Calculate up vector for camera
      const up = new Cesium.Cartesian3(0, 0, 1); // Use Z-up coordinate system
      
      // Fly to the position with precise targeting
      this.viewer.camera.flyTo({
        destination: cameraPosition,
        orientation: {
          direction: direction,
          up: up
        },
        duration: 2.0,
        complete: () => {
          console.log('Camera positioned with marker perfectly centered');
          
          // Verify the marker is visible and centered
          setTimeout(() => {
            // Check if we need to adjust further
            const markerElement = document.querySelector(`[data-marker-id="${animalId}"]`);
            if (markerElement) {
              const rect = markerElement.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              
              // Check if marker is in the center third of the screen vertically
              const isVerticallyWellCentered = (rect.top > viewportHeight/3 && rect.bottom < viewportHeight*2/3);
              
              console.log('Marker position in viewport:', {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                viewportHeight,
                viewportWidth,
                isVerticallyWellCentered
              });
              
              // If marker is not well centered, make one more adjustment
              if (!isVerticallyWellCentered) {
                console.log('Fine-tuning marker position to ensure it\'s centered');
                
                // Create a direct look vector to the target
                this.viewer.camera.lookAt(
                  position,
                  new Cesium.HeadingPitchRange(
                    0,
                    Cesium.Math.toRadians(-35), // Less steep angle to center better
                    DEFAULT_VIEW_ALTITUDE
                  )
                );
              }
            }
            
            // Signal that animal markers should be refreshed
            this.$emit('refresh-markers');
          }, 500);
        }
      });
    },
    
    focusAnimal(animal, selectEntity = false) {
      this.flyToFirstPosition(animal, () => {
        if (selectEntity) {
          const firstPositionEntity =
            animal.locations.length > 0
              ? this.viewer.entities.getById(animal.locations[0].id)
              : null;
          if (firstPositionEntity) {
            setTimeout(() => {
              this.viewer.selectedEntity = firstPositionEntity;
              this.selectedEntity = firstPositionEntity;
            }, 1000);
          }
        }
      });

      //this.animalManagerMenuVisible = false; // Close the menu when focusing on an animal
      if (this.animalManagerMenuVisible) {
        this.toggleAnimalManagerMenu();
      }

      if (!selectEntity) {
        this.closeInfobox();
      }
    },
    onMarkerClicked(animal) {
      const firstPositionEntity = this.viewer.entities.getById(
        animal.locations[0].id
      );
      if (firstPositionEntity) {
        if (!this.selectedAnimalIds.includes(animal.id)) {
          this.selectedAnimalIds.push(animal.id);
          this.updateTrackVisibility();
        }

        //this.selectedEntity = firstPositionEntity;
        //this.viewer.selectedEntity = firstPositionEntity;
        this.focusAnimal(animal, true);
        this.zoom;
      }
    },
    closeInfobox() {
      console.log('Closing infobox...');
      this.selectedEntity = null;
      this.viewer.selectedEntity = null;
    },
    updateBuyingAnimal(animalId) {
      this.buyingAnimalId = animalId;
    },
    buyAnimal(animalId) {
      this.buyingAnimalId = animalId; // Set the loading state here

      const urlParams = new URLSearchParams(window.location.search);
      let urlString = `${this.pluginDirUrl}backend/buy_animal.php?buy_animal_id=${animalId}`;
      if (urlParams.get('uid')) urlString += `&uid=${urlParams.get('uid')}`;
      if (urlParams.get('id')) urlString += `&id=${urlParams.get('id')}`;

      fetch(urlString)
        .then((response) => response.json())
        .then((data) => {
          const bought_animal = data.bought_animal;
          const message = data.message;
          if (bought_animal) {
            bought_animal.picture = getAnimalPictureUrl(
              this.pluginDirUrl,
              bought_animal
            );
            bought_animal.shape = getAnimalShapeUrl(
              this.pluginDirUrl,
              bought_animal
            );
            bought_animal.is_new = true;
            const iconUrl = getAnimalIconUrl(this.pluginDirUrl, bought_animal);
            const positions = this.generatePositions(bought_animal, iconUrl);
            const polyline = this.generatePolylines(bought_animal);

            const track_data = {
              id: bought_animal.id,
              animal: bought_animal,
              positions: positions,
              polylines: polyline,
              icon: iconUrl,
              is_default: bought_animal.is_default,
            };

            // Get animal indexes in array
            const existing_track_data_index =
              this.track_data_collection.findIndex(
                (animal) => animal.id == bought_animal.id
              );
            const existing_animal_index = this.animals.findIndex(
              (animal) => animal.id == bought_animal.id
            );

            // Find existing position
            const existing_positions =
              this.track_data_collection[existing_track_data_index].positions;

            // Remove existing position from map
            existing_positions.forEach((pos) => {
              this.viewer.entities.remove(pos);
            });

            // Replace animals in array
            this.track_data_collection[existing_track_data_index] = track_data;
            this.animals[existing_animal_index] = bought_animal;

            // Re-add positions and polylines
            positions.forEach((pos) => {
              this.viewer.entities.add(pos);
            });

            if (polyline) this.viewer.entities.add(polyline);

            this.updateTrackVisibility();

            // Refresh points value
            this.kukudushi.points = data.remaining_points;

            // Show message
            //alert(message);
            this.setAnimalPurchaseStatus('success'); // Set the status to success
          } else {
            // Error, show error message
            //alert(message);
            this.setAnimalPurchaseStatus('failed'); // Set the status to failed
          }
        })
        .catch((error) => {
          console.error('Error adding bought animal:', error);
          this.setAnimalPurchaseStatus('failed'); // Set the status to failed
        })
        .finally(() => {
          this.buyingAnimalId = null; // Clear the loading state
        });
    },
    fetchAnimals() {
      const urlParams = new URLSearchParams(window.location.search);
      let urlString = `${this.pluginDirUrl}backend/get_dashboard_animals.php`;
      if (urlParams.get('uid')) urlString += `?uid=${urlParams.get('uid')}`;
      if (urlParams.get('id')) urlString += `?id=${urlParams.get('id')}`;

      this.loading = true;

      fetch(urlString)
        .then((response) => response.json())
        .then((data) => {
          this.kukudushi = data.kukudushi;

          // Check if kukudushi exists and is valid
          if (!this.kukudushi?.exists || this.kukudushi?.temporary_id_expired) {
            this.activeModalType = 'expired-session';
            this.modalKey++; // Force modal recreation
            this.loading = false;
            return;
          }

          this.points_data = data.points_data;
          this.points_streak = data.points_streak;
          this.notificationData = data.notifications_data;

          // Set activeModalType if we have notifications
          if (this.notificationData && this.notificationData.length > 0) {
            this.activeModalType = 'notification';
          }

          //const entitiesToAdd = []; // Batch entities here

          //make it a bool instead of 1/0
          this.kukudushi.new_user = this.kukudushi.new_user ? true : false;

          data.animals.forEach((animal) => {
            if (animal.is_default) {
              this.selectedAnimalIds = [animal.id];
            }

            animal.picture = getAnimalPictureUrl(this.pluginDirUrl, animal);
            animal.shape = getAnimalShapeUrl(this.pluginDirUrl, animal);
            const iconUrl = getAnimalIconUrl(this.pluginDirUrl, animal);
            const positions = this.generatePositions(animal, iconUrl);
            const polyline = this.generatePolylines(animal);

            const track_data = {
              id: animal.id,
              animal: animal,
              positions: positions,
              polylines: polyline,
              icon: iconUrl,
              is_default: animal.is_default,
            };

            this.track_data_collection.push(track_data);
            this.animals.push(animal);

            positions.forEach((entity) => this.viewer.entities.add(entity));
            if (polyline) this.viewer.entities.add(polyline);
          });

          // Add all entities at once
          //entitiesToAdd.forEach((entity) => this.viewer.entities.add(entity));

          // Handle points animation only if points_awarded > 0
          const { points_awarded, original_points_amount } =
            this.points_data || {};
          if (points_awarded > 0) {
            this.showPointsVisuals(points_awarded, original_points_amount);
          }

          this.loading = false;
          this.updateTrackVisibility();
        })
        .catch((error) => {
          console.error('Error fetching animals:', error);
          this.loading = false;
        });
    },
    generatePositions(animal, iconUrl) {
      return animal.locations
        .map((position, index) => {
          const lng = parseFloat(position.lng);
          const lat = parseFloat(position.lat);

          if (isNaN(lng) || isNaN(lat)) {
            console.error('Invalid position coordinates:', position);
            return null; // Skip invalid positions
          }

          const entityPosition = Cesium.Cartesian3.fromDegrees(lng, lat);

          const isFirstPosition = index === 0;
          const isLastPosition = index === animal.locations.length - 1;

          const entity = {
            id: position.id,
            position: entityPosition,
            locationDot: true,
            dt_move: position.dt_move,
            isFirst: isFirstPosition, // Mark the first position of every animal
            isLast: isLastPosition, // Mark the last position of every animal
            show: new Cesium.CallbackProperty(() => {
              // First, check if the animal is selected
              if (
                isFirstPosition ||
                this.selectedAnimalIds.includes(animal.id)
              ) {
                // If selected, apply the custom visibility logic
                return this.isEntityVisible(entityPosition);
              }
              return false; // Not visible if the animal is not selected
            }, false),
          };

          if (isFirstPosition) {
            entity.point = {
              pixelSize: new Cesium.CallbackProperty(() => {
                const cameraDistance = Cesium.Cartesian3.distance(
                  this.viewer.camera.position,
                  entityPosition
                );
                const minSize = 7; // Reduced from 7
                const maxSize = 23; // Reduced from 23
                // Adjusted scaling factor for smoother transition
                const sizeFactor = 0.00003; // Doubled from 0.000024

                // Add logarithmic scaling for better control at close ranges
                const scaledSize = Math.max(
                  minSize,
                  Math.min(
                    maxSize,
                    maxSize -
                      Math.log(cameraDistance) * sizeFactor * cameraDistance
                  )
                );
                return scaledSize;
              }, false),
              color: Cesium.Color.fromCssColorString(this.activePointColor),
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure point is always rendered on top
              translucencyByDistance: new Cesium.NearFarScalar(
                1.5e2,
                1.0,
                1.5e7,
                0.5
              ), // Adjust translucency by distance
              show: entity.show, // Ensure the show property is respected
            };

            /*
            this.animalMarkers.push({
              id: position.id,
              animal: animal,
              position: entityPosition,
              viewer: this.viewer,
            });
            */
          } else {
            entity.point = {
              pixelSize: new Cesium.CallbackProperty(() => {
                const cameraDistance = Cesium.Cartesian3.distance(
                  this.viewer.camera.position,
                  entityPosition
                );
                const minSize = 5;
                const maxSize = 20; // Reduced from 15
                // Adjusted scaling factor for smoother transition
                const sizeFactor = 0.00003; // Doubled from 0.000012

                // Add logarithmic scaling for better control at close ranges
                const scaledSize = Math.max(
                  minSize,
                  Math.min(
                    maxSize,
                    maxSize -
                      Math.log(cameraDistance) * sizeFactor * cameraDistance
                  )
                );
                return scaledSize;
              }, false),
              color: Cesium.Color.fromCssColorString(this.activePointColor),
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure point is always rendered on top
              translucencyByDistance: new Cesium.NearFarScalar(
                1.5e2,
                1.0,
                1.5e7,
                0.5
              ), // Adjust translucency by distance
              show: entity.show, // Ensure the show property is respected
            };
          }

          return entity;
        })
        .filter((entity) => entity !== null); // Filter out invalid entities
    },
    generatePolylines(animal) {
      const positions = animal.locations.map((pos) =>
        Cesium.Cartesian3.fromDegrees(parseFloat(pos.lng), parseFloat(pos.lat))
      );
      if (positions.length < 2) {
        return null;
      }

      return {
        polyline: {
          positions: positions,
          width: new Cesium.CallbackProperty(() => {
            const firstPosition = positions[0];
            const cameraDistance = Cesium.Cartesian3.distance(
              this.viewer.camera.position,
              firstPosition
            );
            const minWidth = 3; // Reduced from 2
            const maxWidth = 8; // Reduced from 10
            // Adjusted scaling factor for smoother transition
            const sizeFactor = 0.00001; // Doubled from 0.000007

            // Add logarithmic scaling for better control at close ranges
            const scaledWidth = Math.max(
              minWidth,
              Math.min(
                maxWidth,
                maxWidth -
                  Math.log(cameraDistance) * sizeFactor * cameraDistance
              )
            );
            return scaledWidth;
          }, false),
          material: Cesium.Color.fromCssColorString(this.activePolylineColor),
          clampToGround: true,
          show: new Cesium.CallbackProperty(() => {
            return this.selectedAnimalIds.includes(animal.id);
          }, false),
        },
      };
    },
    getAnimalByEntity(entity) {
      if (!entity) return null;
      return (
        this.animals.find((animal) =>
          animal.locations.some((location) => location.id === entity.id)
        ) || null
      );
    },
    setBoundingSphereAndFlyTo(animal) {
      const positions = animal.positions
        .slice(0, 10)
        .map((entity) => entity.position); // Use only the first 10 positions
      if (positions.length > 1) {
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        this.viewer.camera.flyToBoundingSphere(boundingSphere);
      }
    },
    flyToFirstPosition(animal, onComplete = null) {
      const positions = animal.locations
        .slice(0, 5)
        .map((location) =>
          Cesium.Cartesian3.fromDegrees(
            parseFloat(location.lng),
            parseFloat(location.lat)
          )
        );

      if (positions.length > 0) {
        let boundingSphere;

        if (positions.length === 1) {
          const position = positions[0];
          boundingSphere = new Cesium.BoundingSphere(position, 1000);
        } else {
          boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        }

        // Calculate the appropriate distance for this view
        // Adjust this to control how close the camera gets
        const zoomDistance = boundingSphere.radius * 6.0;

        // Calculate the height above ground this represents
        const cartographic = Cesium.Cartographic.fromCartesian(
          boundingSphere.center
        );
        const targetHeight = zoomDistance; // Approximate height

        // Use our tilt calculation function directly
        const { tilt } = this.calculateTiltForHeight(targetHeight);

        this.viewer.camera.flyToBoundingSphere(boundingSphere, {
          duration: 2.0,
          offset: new Cesium.HeadingPitchRange(
            0, // We can keep heading at 0 or use current camera heading
            tilt, // Use our calculated tilt
            zoomDistance
          ),
          complete: onComplete,
        });
      } else {
        console.warn('No valid positions available for this animal.');
        if (onComplete) onComplete();
      }
    },
    onAnimalSelect(animalId) {
      const index = this.selectedAnimalIds.indexOf(animalId);
      if (index === -1) {
        this.selectedAnimalIds.push(animalId);
      } else {
        this.selectedAnimalIds.splice(index, 1);
      }

      this.updateTrackVisibility();
    },
    updateTrackVisibility() {
      this.track_data_collection.forEach((track_data) => {
        const isActiveTrack = this.selectedAnimalIds.includes(track_data.id);

        const positionIndex = 0;
        track_data.positions.forEach((position) => {
          if (position && positionIndex > 0) {
            position.show = new Cesium.CallbackProperty(
              () => isActiveTrack,
              false
            );

            positionIndex++;
          }
        });

        if (track_data.polylines) {
          track_data.polylines.polyline.show = new Cesium.CallbackProperty(
            () => isActiveTrack,
            false
          );
        }
      });
    },
    initializeMap() {
      Cesium.Ion.defaultAccessToken = kukudushiData.cesiumAccessToken;

      this.imageryViewModels = generateImageryViewModels();

      this.viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProviderViewModels: this.imageryViewModels,
        selectedImageryProviderViewModel: this.imageryViewModels[0],
        animation: false,
        timeline: false,
        infoBox: false,
        homeButton: false,
        fullscreenButton: true,
        sceneModePicker: false, // Disable the 3D/2D button
        geocoder: false, //Disable the search button
        navigationInstructionsInitiallyVisible: false, //Disable tutorial element open up automatically first run
        allowMultipleImageryLayers: true, // Allow multiple layers
      });

      // Add labels layer by default
      const labelsLayer = this.viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
          subdomains: 'abcd',
          minimumLevel: 0,
          maximumLevel: 18,
        })
      );

      // Optional: Adjust label layer opacity if needed
      labelsLayer.alpha = 1.0; // 0.0 to 1.0

      // Remove camera's north/south pole restriction
      this.viewer.scene.camera.constrainedAxis = undefined;

      // Remove the default cesium terrain providers
      this.viewer.baseLayerPicker.viewModel.terrainProviderViewModels.removeAll();

      // Remove the cesium logo
      this.viewer._cesiumWidget._creditContainer.parentNode.removeChild(
        this.viewer._cesiumWidget._creditContainer
      );

      // Adjust the zooming in and out speed
      this.viewer.scene.screenSpaceCameraController._zoomFactor = 10.0; // Default is 5
      this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 45000000.0;

      const handler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      );

      handler.setInputAction((click) => {
        const pickedObject = this.viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const pickedAnimal = this.animals.find((animal) =>
            animal.locations.some(
              (location) => location.id === pickedObject.id.id
            )
          );
          if (
            pickedAnimal &&
            !this.selectedAnimalIds.includes(pickedAnimal.id)
          ) {
            this.selectedAnimalIds.push(pickedAnimal.id);
            this.updateTrackVisibility();
          }
          this.selectedEntity = pickedObject.id;
        } else {
          this.selectedEntity = null;
          this.viewer.selectedEntity = null;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      this.setupAutomaticTilt();

      this.fetchAnimals();

      this.centerGlobe();
    },
  },
  computed: {
    menuIconUrl() {
      return this.animalManagerMenuVisible
        ? this.pluginDirUrl + '/media/close.svg'
        : this.pluginDirUrl + '/media/menu_icon.svg';
    },
    tutorialIconUrl() {
      return this.pluginDirUrl + '/media/tutorial_icon.webp';
    },
    formattedPoints() {
      const points = this.kukudushi?.points ?? 0;
      return new Intl.NumberFormat('de-DE').format(points);
    },
    footerMaskPercentage() {
      const baseWidth = 440; // Width where 50% works well
      const minWidth = 110; // Smallest width where mask scales
      const maxPercentage = 100; // Max mask percentage
      const minPercentage = 50; // Min mask percentage at baseWidth

      // Gradual scaling
      const ratio = (baseWidth - this.screenWidth) / (baseWidth - minWidth);
      const scaledPercentage =
        minPercentage + ratio * (maxPercentage - minPercentage);

      return Math.min(
        maxPercentage,
        Math.max(minPercentage, scaledPercentage)
      ).toFixed(2);
    },
    footerStyle() {
      return this.animalManagerMenuVisible
        ? {
            '--dynamic-footer-mask': `${this.footerMaskPercentage}%`,
            maskImage: `
              linear-gradient(
                to top, 
                rgba(0, 0, 0, 1) var(--dynamic-footer-mask), 
                rgba(0, 0, 0, 0) var(--dynamic-footer-mask), 
                rgba(0, 0, 0, 0) 100%
              ),
              url('/wp-content/plugins/kukudushi-engine-vue/media/hero-container-bottom-shape-devider.svg')
            `,
            WebkitMaskImage: `
              linear-gradient(
                to top, 
                rgba(0, 0, 0, 1) var(--dynamic-footer-mask), 
                rgba(0, 0, 0, 0) var(--dynamic-footer-mask), 
                rgba(0, 0, 0, 0) 100%
              ),
              url('/wp-content/plugins/kukudushi-engine-vue/media/hero-container-bottom-shape-devider.svg')
            `,
            maskPosition: 'top center',
            WebkitMaskPosition: 'top center',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
          }
        : {};
    },
  },
  mounted() {
    //Update url
    let currentUrl = window.location.href;
    let updatedUrl = currentUrl.replace('/animal-tracker-3d', '');
    window.history.replaceState({}, '', updatedUrl);

    //Initialise Cesium Map
    this.initializeMap();

    this.setupAutomaticTilt();

    //Add menu button click event
    jQuery('#menu-button').on('click', () => {
      this.toggleAnimalManagerMenu();
    });
  },
};
