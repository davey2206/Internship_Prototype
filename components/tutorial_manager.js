// tutorial_manager.js
import BaseModal from './base_modal.js';
import TutorialMask from './tutorial_mask.js';

export default {
  name: 'TutorialManager',
  components: {
    BaseModal,
    TutorialMask,
  },
  template: `
    <div>
      <BaseModal
        :plugin-dir-url="pluginDirUrl"
        :should-render="shouldRender"
        :component-key="componentKey"
        :target-element="currentTutorialStep.highlightElement"
        :show-background="currentTutorialStep.showBackground"
        :allow-interaction="currentTutorialStep.allowInteraction"
        :current-step="currentTutorialStep"
        ref="baseModal"
      >
        <template #modal-content>
          <div class="tutorial-message">
            {{ currentTutorialStep.text }}
          </div>
        </template>

        <template #modal-buttons>
          <button 
            v-if="shouldShowNextButton"
            class="sticky-next-button" 
            @click="handleNextStep"
          >
            Next
          </button>
          <button 
            class="sticky-close-button" 
            @click="handleTutorialEnd"
          >
            {{ isLastStep ? 'Finish' : 'Skip Tutorial' }}
          </button>
        </template>
      </BaseModal>

      <TutorialMask
        v-if="shouldRender"
        ref="tutorialMask"
        :visible="true"
        :target-element="currentTutorialStep.highlightElement"
        :show-background="currentTutorialStep.showBackground"
        :allow-interaction="currentTutorialStep.allowInteraction"
        :is-step-transitioning="isStepTransitioning"
        :isNotification="false"
        :padding="8"
        @scroll-into-view-if-needed="scrollIntoViewIfNeeded"
        @target-clicked="handleTargetElementClicked"
      />
    </div>
  `,
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    componentKey: {
      type: Boolean,
      default: false,
    },
    kukudushi: {
      type: Object,
      required: true,
    },
    animals: {
      type: Array,
      required: true,
    },
    viewer: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      currentStep: 0,
      isStepTransitioning: false,
      isScrolling: false,
      used_animal_original: null,
      used_animal_id: null,
      tutorialSteps: [
        {
          text: 'Welcome to the Animal Tracker! Let’s start with a quick tour.',
          highlightElement: null,
          allowInteraction: false,
          showBackground: true,
          modal_position: 'center',
          validation: null,
          prepare: function () {
            return async function () {
              this.updateUserMenu(false);
              this.closeAnimalInfoWindow();
            }.bind(this);
          },
          completed: null,
        },
        {
          text: 'Click the menu button to see your animals and manage your Kukus.',
          highlightElement: '#menu-button',
          allowInteraction: true,
          showBackground: true,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const element = document.querySelector('#animal-select-panel');
              if (!element) return false;

              const computedStyle = window.getComputedStyle(element);
              return computedStyle.display !== 'none';
            }.bind(this);
          },
          prepare: null,
          completed: null,
        },
        {
          text: 'Here you see all animals available for adoption, including those that you are already tracking.',
          highlightElement: null,
          allowInteraction: false,
          showBackground: true,
          modal_position: 'bottom',
          validation: null,
          prepare: function () {
            return async function () {
              this.activateAnimalsTab();
            }.bind(this);
          },
          completed: null,
        },
        {
          text: 'When you want to adopt a new animal, click the button.',
          highlightElement: '.animal-buy-now-button',
          allowInteraction: false,
          showBackground: true,
          modal_position: 'center',
          overlapDetectionDelay: 1200,
          validation: null,
          prepare: null,
          completed: null,
        },
        {
          text: 'Here is your Kuku balance, these coins are used for adopting new animals. Every day you scan your Kukudushi, you will earn Kukus',
          highlightElement: '.kukus-container',
          allowInteraction: false,
          showBackground: true,
          modal_position: 'bottom',
          validation: null,
          prepare: null,
          completed: null,
        },
        {
          text: 'Close the animal care center',
          highlightElement: '#menu-button',
          allowInteraction: true,
          showBackground: true,
          modal_position: 'top',
          validation: function () {
            return async function () {
              return (
                document.querySelector('#animal-select-panel')?.style
                  .display === 'none'
              );
            }.bind(this);
          },
          prepare: null,
          completed: null,
        },
        {
          text: 'Click on the highlighted turtle’s portrait to fly to its current track.',
          highlightElement: null,
          allowInteraction: true,
          showBackground: true,
          modal_position: 'top',
          step_data: {},
          validation: function () {
            return async function () {
              var infoBox = document.getElementById('custom-infobox-container');
              return infoBox != null;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              const turtleAnimal = this.animals.find((animal) =>
                animal.species.toLowerCase().includes('turtle')
              );
              console.log('Found turtle animal:', turtleAnimal);

              if (turtleAnimal) {
                this.used_animal_original = {
                  ...turtleAnimal,
                };
                this.used_animal_id = turtleAnimal.id;

                turtleAnimal.is_owned = true;

                // First, try to find the marker directly
                let markerElement = this.findMarkerElement(turtleAnimal.id);
                
                // If not found initially, try to make it visible
                if (!markerElement) {
                  // Try to ensure marker is separated and visible
                  const isSeparated = await this.ensureMarkerSeparated(turtleAnimal.id);
                  
                  // Check again after separation attempt
                  if (isSeparated) {
                    await new Promise((resolve) => setTimeout(resolve, 500)); 
                    markerElement = this.findMarkerElement(turtleAnimal.id);
                  }
                }

                if (markerElement) {
                  // Marker found, highlight it
                  this.currentTutorialStep.highlightElement = `[data-marker-id="${turtleAnimal.id}"]`;
                  console.log('Set highlight element:', this.currentTutorialStep.highlightElement);
                } else {
                  // Marker not found - change step text to guide user
                  console.warn('Could not find marker element for highlighting');
                  this.currentTutorialStep.text = 'Find the turtle on the map and click on it to see its details.';
                  
                  // Force fly to the position to make it more likely to be visible
                  const track = this.$parent.track_data_collection.find(
                    (track) => track.id === turtleAnimal.id
                  );
                  
                  if (track && track.positions && track.positions.length > 0) {
                    const position = track.positions[0].position;
                    
                    await new Promise((resolve) => {
                      this.viewer.camera.flyTo({
                        destination: position,
                        orientation: {
                          heading: 0,
                          pitch: Cesium.Math.toRadians(-45),
                          roll: 0
                        },
                        duration: 1.5,
                        complete: resolve
                      });
                    });
                  }
                }
              }
            }.bind(this);
          },
          completed: null,
        },
        {
          text: 'Each animal has detailed information telling you about its life’s journey.',
          highlightElement: '#custom-infobox-container',
          allowInteraction: false,
          showBackground: true,
          modal_position: 'top',
          validation: null,
          prepare: null,
          completed: null,
        },
        {
          text: 'Close the animal information panel',
          highlightElement: '.side-bar-close',
          allowInteraction: true,
          showBackground: true,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const animalInfoWindow = document.querySelector(
                '#custom-infobox-container'
              );
              if (animalInfoWindow) return false;
              return true;
            }.bind(this);
          },
          prepare: null,
          completed: function () {
            return function () {
              this.resetTemporaryOwnedAnimal();
            }.bind(this);
          },
        },
        {
          text: 'With gestures you navigate the globe. To move around, tap and hold a finger on the globe, then move your finger in any direction.',
          highlightElement: null,
          allowInteraction: true,
          showBackground: false,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const camera = this.viewer.camera;
              const currentPosition = camera.positionCartographic;
              const currentHeading = camera.heading;
              const currentPitch = camera.pitch;

              const { initialPosition, initialHeading, initialPitch } =
                this.currentTutorialStep.step_data;

              const positionThreshold = 0.0001;
              const angleThreshold = 0.01;

              const hasMoved =
                Math.abs(
                  currentPosition.longitude - initialPosition.longitude
                ) > positionThreshold ||
                Math.abs(currentPosition.latitude - initialPosition.latitude) >
                  positionThreshold ||
                Math.abs(
                  Cesium.Math.normalize(currentHeading - initialHeading)
                ) > angleThreshold ||
                Math.abs(currentPitch - initialPitch) > angleThreshold;

              return hasMoved;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              const camera = this.viewer.camera;
              this.currentTutorialStep.step_data = {
                initialPosition: camera.positionCartographic.clone(),
                initialHeading: camera.heading,
                initialPitch: camera.pitch,
              };

              const container = document.createElement('div');
              container.style.cssText = `
                position: fixed;
                left: 50%;
                bottom: 15%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                transition: transform 1s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
              `;

              const response = await fetch(
                `${kukudushiData.plugin_url}/media/tutorial_images/TouchDrag.svg`
              );
              const svgContent = await response.text();
              container.innerHTML = svgContent;
              document.body.appendChild(container);

              this.currentGifContainer = container;
            }.bind(this);
          },
          completed: function () {
            return function () {
              if (this.currentGifContainer) {
                document.body.removeChild(this.currentGifContainer);
                this.currentGifContainer = null;
              }
            }.bind(this);
          },
        },
        {
          text: 'You can zoom by pinching your fingers on the globe. Move the fingers away from eachother to zoom in. When you move them towards each other, you zoom out.',
          highlightElement: null,
          allowInteraction: true,
          showBackground: false,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const camera = this.viewer.camera;
              const currentHeight = camera.positionCartographic.height;
              const { initialHeight } = this.currentTutorialStep.step_data;

              // Consider zoom valid if height changed by at least 20%
              const heightChangeThreshold = 0.2;
              const heightChange =
                Math.abs(currentHeight - initialHeight) / initialHeight;

              return heightChange > heightChangeThreshold;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              // Store initial camera height
              const camera = this.viewer.camera;
              this.currentTutorialStep.step_data = {
                initialHeight: camera.positionCartographic.height,
              };

              const container = document.createElement('div');
              container.style.cssText = `
                position: fixed;
                left: 50%;
                bottom: 15%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                transition: transform 1s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
              `;

              const response = await fetch(
                `${this.pluginDirUrl}/media/tutorial_images/TouchZoom.svg`
              );
              const svgContent = await response.text();
              container.innerHTML = svgContent;
              document.body.appendChild(container);

              this.currentGifContainer = container;
            }.bind(this);
          },
          completed: function () {
            return function () {
              if (this.currentGifContainer) {
                document.body.removeChild(this.currentGifContainer);
                this.currentGifContainer = null;
              }
            }.bind(this);
          },
        },
        /*
        {
          text: 'You can tilt your view by resting two fingers on the screen and dragging them up or down to change the perspective of the globe.',
          highlightElement: null,
          allowInteraction: true,
          showBackground: false,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const camera = this.viewer.camera;
              const currentPitch = camera.pitch;
              const { initialPitch } = this.currentTutorialStep.step_data;

              // Consider tilt valid if pitch changed by at least 0.1 radians (about 5.7 degrees)
              const pitchThreshold = 0.1;
              const pitchChange = Math.abs(currentPitch - initialPitch);

              return pitchChange > pitchThreshold;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              // Store initial camera pitch
              const camera = this.viewer.camera;
              this.currentTutorialStep.step_data = {
                initialPitch: camera.pitch,
              };

              const container = document.createElement('div');
              container.style.cssText = `
                position: fixed;
                left: 50%;
                bottom: 15%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                transition: transform 1s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
              `;

              const response = await fetch(
                `${this.pluginDirUrl}/media/tutorial_images/TouchTilt.svg`
              );
              const svgContent = await response.text();
              container.innerHTML = svgContent;
              document.body.appendChild(container);

              this.currentGifContainer = container;
            }.bind(this);
          },
          completed: function () {
            return function () {
              if (this.currentGifContainer) {
                document.body.removeChild(this.currentGifContainer);
                this.currentGifContainer = null;
              }
            }.bind(this);
          },
        },
        */
        {
          text: 'You can rotate your view by resting two fingers on the screen and dragging them in the opposite direction from each other.',
          highlightElement: null,
          allowInteraction: true,
          showBackground: false,
          modal_position: 'top',
          validation: function () {
            return async function () {
              const camera = this.viewer.camera;
              const currentHeading = camera.heading;
              const { initialHeading } = this.currentTutorialStep.step_data;

              // Consider rotation valid if heading changed by at least 0.2 radians (about 11.5 degrees)
              const headingThreshold = 0.2;

              // Calculate absolute heading difference accounting for circular nature of heading
              let headingDifference = Math.abs(currentHeading - initialHeading);
              headingDifference = Math.min(
                headingDifference,
                2 * Math.PI - headingDifference
              );

              return headingDifference > headingThreshold;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              // Store initial camera heading
              const camera = this.viewer.camera;
              this.currentTutorialStep.step_data = {
                initialHeading: camera.heading,
              };

              const container = document.createElement('div');
              container.style.cssText = `
                position: fixed;
                left: 50%;
                bottom: 15%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                transition: transform 1s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
              `;

              const response = await fetch(
                `${this.pluginDirUrl}/media/tutorial_images/TouchRotate.svg`
              );
              const svgContent = await response.text();
              container.innerHTML = svgContent;
              document.body.appendChild(container);

              this.currentGifContainer = container;
            }.bind(this);
          },
          completed: function () {
            return function () {
              if (this.currentGifContainer) {
                document.body.removeChild(this.currentGifContainer);
                this.currentGifContainer = null;
              }
            }.bind(this);
          },
        },
        {
          text: 'You can use this button to reset the globe to its default perspective.',
          highlightElement: '#center-globe-button',
          allowInteraction: true,
          showBackground: true,
          modal_position: 'top',
          validation: function () {
            return async function () {
              console.log(
                'Validating button click, current state:',
                this.currentTutorialStep.step_data?.buttonClicked
              );
              return this.currentTutorialStep.step_data?.buttonClicked === true;
            }.bind(this);
          },
          prepare: function () {
            return async function () {
              // Initialize step_data
              this.currentTutorialStep.step_data = { buttonClicked: false };

              const button = document.querySelector('#center-globe-button');
              if (button) {
                const clickHandler = () => {
                  console.log('Button clicked!');
                  // Clone the entire step to trigger reactivity
                  const updatedStep = { ...this.currentTutorialStep };
                  updatedStep.step_data = {
                    ...updatedStep.step_data,
                    buttonClicked: true,
                  };

                  // Update the entire step object
                  Object.assign(this.currentTutorialStep, updatedStep);
                };

                this.currentTutorialStep.step_data.clickHandler = clickHandler;
                button.addEventListener('click', clickHandler);
              }
            }.bind(this);
          },
          completed: function () {
            return function () {
              const button = document.querySelector('#center-globe-button');
              if (button && this.currentTutorialStep.step_data?.clickHandler) {
                button.removeEventListener(
                  'click',
                  this.currentTutorialStep.step_data.clickHandler
                );
              }
            }.bind(this);
          },
        },
        {
          text: 'Congratulations! You have completed the tutorial. Please click the Finish button.',
          highlightElement: null,
          allowInteraction: false,
          showBackground: true,
          modal_position: 'center',
          validation: null,
          prepare: null,
          completed: null,
        },
      ],
      activeHighlight: null,
    };
  },
  computed: {
    shouldRender() {
      // Now depends on isActive prop instead of localStorage
      console.log('Tutorial shouldRender called, isActive:', this.isActive);
      return this.isActive;
    },
    currentTutorialStep() {
      return this.tutorialSteps[this.currentStep];
    },
    isLastStep() {
      return this.currentStep === this.tutorialSteps.length - 1;
    },
    shouldShowNextButton() {
      // Don't show next button if current step has validation OR current step is last step
      return !this.currentTutorialStep?.validation && !this.isLastStep;
    },
  },
  watch: {
    currentStep: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          this.cleanupStepValidation();
          this.setupStepValidation();
        });
      },
    },
  },
  methods: {
    setupStepValidation() {
      const currentStep = this.currentTutorialStep;
      if (!currentStep?.validation) return;

      const boundValidation = currentStep.validation.call(this);

      const observer = new MutationObserver(async () => {
        try {
          const isValid = await boundValidation();
          if (isValid) {
            this.isStepTransitioning = true;
            setTimeout(() => {
              this.handleNextStep();
            }, 500);
            observer.disconnect();
          }
        } catch (error) {
          console.error('Validation error:', error);
        }
      });

      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style', 'class'],
      });

      this.currentObserver = observer;
    },
    
    // Handler for when the target element is clicked
    handleTargetElementClicked() {
      console.log('Target element clicked - hiding mask immediately');
      
      // Set transitioning to true to hide mask and overlay immediately
      this.isStepTransitioning = true;
      
      // Don't automatically proceed to next step - let validation handle that
      // The validation process is already watching for DOM changes that indicate
      // the user's action was successful (e.g., infobox appearing)
    },
    cleanupStepValidation() {
      if (this.currentObserver) {
        this.currentObserver.disconnect();
        this.currentObserver = null;
      }
    },

    startTutorial() {
      console.log('Starting tutorial...');
      this.currentStep = 0;

      //Make sure user menu is closed
      this.updateUserMenu(false);

      this.$nextTick(async () => {
        // Prepare first step
        await this.prepareStep();

        const baseModal = this.$refs.baseModal;
        if (baseModal) {
          console.log('BaseModal ref found, triggering animations');
          baseModal.visible = true;
          baseModal.animateTurtle();
          this.highlightElement();
        } else {
          console.warn('BaseModal ref not found');
        }
      });
    },

    // Add this new method
    resetTutorial() {
      this.currentStep = 0;
      this.removeHighlight();
    },

    async prepareStep() {
      const currentStep = this.currentTutorialStep;
      if (currentStep?.prepare && typeof currentStep.prepare === 'function') {
        console.log('Preparing step:', this.currentStep);
        try {
          const boundPrepare = currentStep.prepare.call(this);
          await Promise.resolve(boundPrepare());
        } catch (error) {
          console.error('Error during step preparation:', error);
        }
      }
    },

    async completeStep() {
      const currentStep = this.currentTutorialStep;
      if (
        currentStep?.completed &&
        typeof currentStep.completed === 'function'
      ) {
        console.log('Completing step:', this.currentStep);
        try {
          const boundCompleted = currentStep.completed.call(this);
          await Promise.resolve(boundCompleted());
        } catch (error) {
          console.error('Error during step completion:', error);
        }
      }
    },

    async handleNextStep() {
      // Immediately mark as transitioning to hide current mask
      this.isStepTransitioning = true;
      
      // Remove any highlight immediately
      this.removeHighlight();

      const baseModal = this.$refs.baseModal;
      baseModal.modalVisible = false;
      
      // Clean up any mask or overlay
      const tutorialMask = this.$refs.tutorialMask;
      if (tutorialMask && typeof tutorialMask.cleanup === 'function') {
        tutorialMask.cleanup();
      }

      baseModal.fadeOutSpeechCircles(async () => {
        setTimeout(async () => {
          // Complete current step
          await this.completeStep();

          if (!this.isLastStep) {
            this.currentStep++;

            // Prepare next step
            await this.prepareStep();

            // Reset transition state after step change
            // but before new mask appears
            setTimeout(() => {
              this.isStepTransitioning = false;
            }, 100);

            baseModal.fadeInSpeechCircles();
            setTimeout(() => {
              baseModal.modalVisible = true;
            }, 150 * baseModal.circleVisibility.length);
          } else {
            this.completeTutorial();
          }
        }, 200);
      });
    },

    doElementsOverlap(element1, element2) {
      const rect1 = element1.getBoundingClientRect();
      const rect2 = element2.getBoundingClientRect();

      return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      );
    },

    isElementObscured(targetElement) {
      if (!targetElement) return false;

      const targetRect = targetElement.getBoundingClientRect();
      const targetZIndex =
        parseInt(window.getComputedStyle(targetElement).zIndex) || 0;

      const potentialObstructors = document.querySelectorAll(
        '.modal-wrapper.fade-in, .turtle-avatar.animate, .header-container, .footer-container'
      );

      for (const element of potentialObstructors) {
        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex) || 0;
        const position = style.position;

        // Skip elements that are not visible or not in the stacking context
        if (
          zIndex <= targetZIndex ||
          (position !== 'fixed' && position !== 'absolute')
        ) {
          continue;
        }

        const elementRect = element.getBoundingClientRect();

        // Check for intersection
        const intersects = this.doElementsIntersect(elementRect, targetRect);
        if (intersects) {
          console.log('Element obscured by:', element, {
            elementRect,
            targetRect,
          });
          return true;
        }
      }

      return false;
    },
    doElementsIntersect(rect1, rect2) {
      return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      );
    },

    async scrollIntoViewIfNeeded() {
      if (this.isScrolling) return;

      const targetElement = document.querySelector(
        this.currentTutorialStep.highlightElement
      );
      if (!targetElement) return;

      const scrollContainer = targetElement.closest('.scroll-container');
      if (!scrollContainer) return;

      try {
        this.isScrolling = true;

        // Wait for the target element and container to be ready
        await this.waitForElementReady(targetElement, scrollContainer);

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();

        // Wait for modal to be ready
        await this.waitForModal();

        // Adjust available space for fixed modal
        let availableTop = containerRect.top;
        let availableBottom = containerRect.bottom;

        const modalWrapper = document.querySelector('.modal-wrapper.fade-in');
        if (
          modalWrapper &&
          window.getComputedStyle(modalWrapper).position === 'fixed'
        ) {
          const modalRect = modalWrapper.getBoundingClientRect();

          if (modalRect.bottom > availableTop) {
            availableTop = Math.max(availableTop, modalRect.bottom);
          }
          if (modalRect.top < availableBottom) {
            availableBottom = Math.min(availableBottom, modalRect.top);
          }
        }

        // Calculate required scroll
        const margin = 30;
        let requiredScroll = 0;

        if (elementRect.top < availableTop + margin) {
          // Target element is above visible area
          requiredScroll = availableTop - elementRect.top + margin;
        } else if (elementRect.bottom > availableBottom - margin) {
          // Target element is below visible area
          requiredScroll = elementRect.bottom - availableBottom + margin;
        }

        console.log('Required scroll amount:', requiredScroll);

        // Check scroll direction and adjust
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const containerHeight = scrollContainer.offsetHeight;

        if (requiredScroll > 0) {
          // Scroll down
          const maxScrollDown = scrollHeight - containerHeight - scrollTop;
          const scrollDownAmount = Math.min(requiredScroll, maxScrollDown);
          if (scrollDownAmount > 0) {
            console.log('Scrolling down by:', scrollDownAmount);

            await new Promise((resolve) => {
              scrollContainer.scrollBy({
                top: scrollDownAmount,
                behavior: 'smooth',
              });
              setTimeout(resolve, 500);
            });
          } else {
            console.log(
              'Cannot scroll down further; already at bottom of container.'
            );
          }
        } else if (requiredScroll < 0) {
          // Scroll up
          const scrollUpAmount = Math.min(-requiredScroll, scrollTop);
          if (scrollUpAmount > 0) {
            console.log('Scrolling up by:', scrollUpAmount);

            await new Promise((resolve) => {
              scrollContainer.scrollBy({
                top: -scrollUpAmount,
                behavior: 'smooth',
              });
              setTimeout(resolve, 500);
            });
          } else {
            console.log(
              'Cannot scroll up further; already at top of container.'
            );
          }
        } else {
          console.log(
            'No scrolling required; target element is already in view.'
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        const finalRect = targetElement.getBoundingClientRect();
        let finalAvailableTop = containerRect.top;
        let finalAvailableBottom = containerRect.bottom;

        // Adjust available space for fixed modal (recalculate dynamically)
        if (
          modalWrapper &&
          window.getComputedStyle(modalWrapper).position === 'fixed'
        ) {
          const modalRect = modalWrapper.getBoundingClientRect();
          if (modalRect.bottom > finalAvailableTop) {
            finalAvailableTop = Math.max(finalAvailableTop, modalRect.bottom);
          }
          if (modalRect.top < finalAvailableBottom) {
            finalAvailableBottom = Math.min(
              finalAvailableBottom,
              modalRect.top
            );
          }
        }

        // Check final visibility
        const isFinallyVisible =
          finalRect.top >= finalAvailableTop + margin &&
          finalRect.bottom <= finalAvailableBottom - margin;

        console.log('Final visibility check:', {
          isFinallyVisible,
          finalRect,
          finalAvailableTop,
          finalAvailableBottom,
          margin,
        });
      } finally {
        this.isScrolling = false;
      }
    },
    async waitForElementReady(element, container, maxAttempts = 10) {
      for (let i = 0; i < maxAttempts; i++) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if the element's position is stable
        if (
          elementRect.height > 0 &&
          elementRect.width > 0 &&
          containerRect.height > 0 &&
          containerRect.width > 0
        ) {
          console.log('Element and container are ready.');
          return;
        }

        console.log(`Waiting for element... (${i + 1}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms before rechecking
      }

      console.warn('Element did not become ready within the timeout.');
    },
    calculateAvailableSpace(containerRect, targetElement) {
      let availableTop = containerRect.top;
      let availableBottom = containerRect.bottom;

      const obstructingElements = [
        { selector: '.header-container', isFixed: true },
        { selector: '.footer-container', isFixed: true },
        { selector: '.modal-wrapper.fade-in', isFixed: false },
        { selector: '.turtle-avatar.animate', isFixed: false },
      ];

      obstructingElements.forEach(({ selector, isFixed }) => {
        const element = document.querySelector(selector);
        if (!element) return;

        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex) || 0;
        const targetZIndex =
          parseInt(window.getComputedStyle(targetElement).zIndex) || 0;

        const rect = element.getBoundingClientRect();

        // Include relative elements in obstruction detection
        if (
          zIndex > targetZIndex ||
          isFixed ||
          style.position === 'fixed' ||
          style.position === 'relative'
        ) {
          if (this.doElementsIntersect(rect, containerRect)) {
            if (rect.top <= containerRect.top) {
              availableTop = Math.max(availableTop, rect.bottom);
            } else if (rect.bottom >= containerRect.bottom) {
              availableBottom = Math.min(availableBottom, rect.top);
            }
          }
        }
      });

      return { top: availableTop, bottom: availableBottom };
    },

    handleFixedElement(element, containerRect) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      if (style.position === 'fixed') {
        return {
          top:
            rect.bottom <= containerRect.top ? rect.bottom : containerRect.top,
          bottom:
            rect.top >= containerRect.bottom ? rect.top : containerRect.bottom,
        };
      }
      return { top: containerRect.top, bottom: containerRect.bottom };
    },

    handleDynamicElement(element, containerRect, targetElement) {
      const rect = element.getBoundingClientRect();
      const targetZIndex =
        parseInt(window.getComputedStyle(targetElement).zIndex) || 0;
      const zIndex = parseInt(window.getComputedStyle(element).zIndex) || 0;

      if (zIndex > targetZIndex) {
        return {
          top:
            rect.bottom <= containerRect.top ? rect.bottom : containerRect.top,
          bottom:
            rect.top >= containerRect.bottom ? rect.top : containerRect.bottom,
        };
      }
      return { top: containerRect.top, bottom: containerRect.bottom };
    },

    highlightElement() {
      if (this.currentTutorialStep.highlightElement) {
        const element = document.querySelector(
          this.currentTutorialStep.highlightElement
        );
        if (element) {
          // Remove any existing highlight first
          this.removeHighlight();

          // Add highlight class
          element.classList.add('tutorial-highlight');
          this.activeHighlight = element;

          // Scroll element into view if needed
          setTimeout(() => {
            this.scrollIntoViewIfNeeded();
          }, 3000);
        }
      }
    },

    removeHighlight() {
      if (this.activeHighlight) {
        this.activeHighlight.classList.remove('tutorial-highlight');
        this.activeHighlight = null;
      }
    },
    resetTemporaryOwnedAnimal() {
      if (this.used_animal_id && this.used_animal_original) {
        const animal = this.animals.find((a) => a.id === this.used_animal_id);
        if (animal) {
          Object.assign(animal, this.used_animal_original);
          this.used_animal_original = null;
          this.used_animal_id = null;
        }
      }
    },

    async completeTutorial() {
      await this.completeStep();
      this.removeHighlight();
      const baseModal = this.$refs.baseModal;
      baseModal.closeModal();
      localStorage.setItem('tutorialCompleted', 'true');
      this.$emit('tutorial-completed');
    },

    async skipTutorial() {
      await this.completeStep();
      this.removeHighlight();
      const baseModal = this.$refs.baseModal;
      baseModal.closeModal();
      this.resetTemporaryOwnedAnimal();
      localStorage.setItem('tutorialCompleted', 'true');
      this.$emit('tutorial-skipped');
    },
    handleTutorialEnd() {
      // Immediately hide mask and remove highlight
      this.isStepTransitioning = true;
      this.removeHighlight();
      
      // Cleanup mask immediately
      const tutorialMask = this.$refs.tutorialMask;
      if (tutorialMask && typeof tutorialMask.cleanup === 'function') {
        tutorialMask.cleanup();
      }
      
      if (this.isLastStep) {
        this.completeTutorial();
      } else {
        this.skipTutorial();
      }
    },
    waitForModal() {
      return new Promise((resolve) => {
        const checkModal = () => {
          const modalWrapper = document.querySelector('.modal-wrapper.fade-in');
          if (modalWrapper) {
            console.log('Modal found and ready');
            resolve(modalWrapper);
          } else {
            console.log('Modal not ready yet, checking again...');
            setTimeout(checkModal, 100);
          }
        };
        checkModal();
      });
    },
    updateUserMenu(on) {
      console.log(
        'tutorial_manager.js - updateUserMenu(' + on ? 'true)' : 'false)'
      );
      this.$emit('update-user-menu', on);
    },
    activateAnimalsTab() {
      this.$emit('activate-animals-tab');
    },
    closeAnimalInfoWindow() {
      this.$emit('close-infobox');
    },
    findMarkerElement(animalId) {
      console.log('Finding marker for animal ID:', animalId);
      // Try class or attribute based selector
      const markerComponents = document.querySelectorAll('[data-marker-id]');

      console.log('Found marker components:', markerComponents.length);

      const foundMarker = Array.from(markerComponents).find((marker) => {
        console.log(
          'Checking marker with data-marker-id:',
          marker.getAttribute('data-marker-id')
        );
        return marker.getAttribute('data-marker-id') === animalId.toString();
      });

      console.log('Found marker:', foundMarker);
      return foundMarker;
    },
    async ensureMarkerSeparated(animalId) {
      // Find the animal's track data
      const track = this.$parent.track_data_collection.find(
        (track) => track.id === animalId
      );

      if (!track || !track.positions || track.positions.length === 0) {
        console.warn('Could not find track data for animal:', animalId);
        return false;
      }

      // Get the first (most recent) position entity
      const firstPositionEntity = track.positions[0];
      if (!firstPositionEntity || !firstPositionEntity.position) {
        console.warn('No valid position found in track');
        return false;
      }
      
      // Helper to check if marker is visible
      const checkForMarker = () => {
        const markerComponents = document.querySelectorAll('[data-marker-id]');
        console.log('Checking for markers, found:', markerComponents.length);
        
        // Look for our specific marker
        const targetMarker = Array.from(markerComponents).find(
          (marker) => marker.getAttribute('data-marker-id') === animalId.toString()
        );
        
        return targetMarker;
      };
      
      // Helper to check if marker is in a group
      const checkIfInGroup = () => {
        const targetMarker = checkForMarker();
        
        if (!targetMarker) {
          console.log('Target marker not found in DOM');
          return null; // Return null to indicate marker not found
        }

        const isInGroup = targetMarker.classList.contains('groupMember');
        console.log('Is in group:', isInGroup, 'Marker classes:', targetMarker.classList);

        return isInGroup;
      };
      
      // STEP 1: First, fly to a DEFAULT viewing distance to get marker in view
      // Ensure we're properly centered on the target position
      const targetPosition = firstPositionEntity.position;
      console.log('STEP 1: Flying to DEFAULT view position with precise marker centering');
      
      // Calculate a reasonable altitude - about 350km
      const DEFAULT_VIEW_DISTANCE = 350000;
      
      // Extract cartographic coordinates
      const cartographic = Cesium.Cartographic.fromCartesian(targetPosition);
      
      // Calculate an adjusted position that will center the marker in view
      // We need to offset our viewpoint southward to ensure the marker (which appears above ground) is centered
      const adjustedLat = cartographic.latitude - 0.005; // Shift camera position slightly south
      
      // Create a camera position that's offset to ensure marker is centered
      const cameraPosition = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        adjustedLat, // Offset south
        cartographic.height + DEFAULT_VIEW_DISTANCE
      );
      
      // Calculate the direction vector from camera to target
      const direction = Cesium.Cartesian3.subtract(
        targetPosition, 
        cameraPosition, 
        new Cesium.Cartesian3()
      );
      Cesium.Cartesian3.normalize(direction, direction);
      
      // Calculate up vector for camera
      const up = new Cesium.Cartesian3(0, 0, 1); // Use Z-up coordinate system
      
      // Important: Use precise directional targeting to ensure the marker is centered
      await new Promise((resolve) => {
        this.viewer.camera.flyTo({
          destination: cameraPosition,
          orientation: {
            direction: direction,
            up: up
          },
          duration: 1.5,
          complete: resolve
        });
      });
      
      // Wait for markers to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // STEP 2: Check if marker is visible and if it's in a group
      console.log('STEP 2: Checking if marker is visible and in group');
      const isInGroup = checkIfInGroup();
      
      // If marker is found and not in a group, we're done
      if (isInGroup === false) {
        console.log('Success: Marker is visible and NOT in a group');
        return true;
      }
      
      // If marker is not found at all, try a closer view and a different perspective
      if (isInGroup === null) {
        console.log('Marker not found, trying closer view with adjusted position');
        
        // Try a closer view at about 200km
        const CLOSER_VIEW_DISTANCE = 200000;
        
        // Adjust the camera position slightly to the north to ensure
        // the marker (which is slightly south) is in view
        await new Promise((resolve) => {
          // Calculate a position slightly north of the target
          const adjustedLat = cartographic.latitude + 0.01; // Adjust latitude northward
          
          this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
              cartographic.longitude,
              adjustedLat, // Adjusted northward
              CLOSER_VIEW_DISTANCE
            ),
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-70), // Even steeper pitch to look more toward the target
              roll: 0
            },
            duration: 1.5,
            complete: resolve
          });
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again at closer view
        const stillInGroup = checkIfInGroup();
        if (stillInGroup === false) {
          console.log('Success: Marker visible at closer view and NOT in group');
          return true;
        }
        
        // If still not found, try looking directly at the target with a steeper angle
        if (stillInGroup === null) {
          console.log('Still cannot find marker, trying direct look-at approach');
          
          await new Promise((resolve) => {
            // Use lookAt which guarantees the target is in the center of the view
            this.viewer.camera.lookAt(
              targetPosition,
              new Cesium.HeadingPitchRange(
                0,
                Cesium.Math.toRadians(-80),
                150000 // Even closer
              )
            );
            
            // We need to complete the movement
            this.viewer.camera.moveComplete = resolve;
            setTimeout(resolve, 1500); // Fallback if moveComplete doesn't trigger
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Final check
          const finalCheck = checkIfInGroup();
          if (finalCheck === false) {
            console.log('Success: Finally found marker with direct approach');
            return true;
          }
          
          if (finalCheck === null) {
            console.log('Still cannot find marker with direct approach');
            return false;
          }
        }
      }
      
      // STEP 3: If marker is in a group, we need to separate it
      console.log('STEP 3: Marker is in a group, attempting to separate');
      
      // Starting separation attempts
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        console.log(`Separation attempt ${attempts + 1}`);
        
        // Get current camera position relative to target
        const currentDistance = Cesium.Cartesian3.distance(
          this.viewer.camera.position,
          targetPosition
        );

        // Gradual zoom - 30% closer each time (less aggressive than 60%)
        const newDistance = currentDistance * 0.7;
        
        // Try different viewing angles each time
        const headingOffset = (attempts * Math.PI / 4) % (2 * Math.PI);

        // Zoom in gradually to separate marker
        await new Promise((resolve) => {
          // Use lookAt instead of flyToBoundingSphere to ensure target is centered
          this.viewer.camera.lookAt(
            targetPosition,
            new Cesium.HeadingPitchRange(
              headingOffset,
              Cesium.Math.toRadians(-70), // Steeper angle
              newDistance
            )
          );
          
          // We need to complete the movement
          this.viewer.camera.moveComplete = resolve;
          setTimeout(resolve, 800); // Fallback if moveComplete doesn't trigger
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if separation succeeded
        const stillInGroup = checkIfInGroup();
        if (stillInGroup === false) {
          console.log('Success: Marker separated from group');
          return true;
        }
        
        if (stillInGroup === null) {
          console.log('Warning: Lost marker during separation attempt');
          // Try a different angle next time
        }

        attempts++;
      }

      // If we reach here, could not separate marker
      const finalMarker = checkForMarker();
      if (finalMarker) {
        console.log('Found marker on final check, even if still in a group');
        return true; // At least we've found a marker
      }

      console.log('Failed to find/separate marker after all attempts');
      return false;
    },
    getMarkerPosition(markerElement) {
      try {
        const markerId = markerElement.getAttribute('data-marker-id');
        console.log('Getting position for marker ID:', markerId);

        if (!markerId) {
          console.log('No marker ID found');
          return null;
        }

        // If it's a group marker, get all member IDs
        const memberIds = markerId.startsWith('group-')
          ? markerId.split('-').slice(1)
          : [markerId];

        console.log('Member IDs:', memberIds);

        // Try to get position for each member
        for (const id of memberIds) {
          const entity = this.$parent.viewer.entities.getById(id);
          console.log('Found entity:', entity);

          if (entity && entity.position) {
            const position = entity.position.getValue(
              this.$parent.viewer.clock.currentTime
            );
            console.log('Entity position:', position);
            if (position) return position;
          }
        }

        return null;
      } catch (error) {
        console.error('Error getting marker position:', error);
        return null;
      }
    },
  },
  mounted() {
    console.log('Tutorial manager mounted, isActive:', this.isActive);
    //Make sure user menu is closed
    //this.updateUserMenu(false);
    //this.closeAnimalInfoWindow();

    console.log(this.viewer);
  },
  beforeDestroy() {
    // Clean up any remaining highlights
    this.removeHighlight();
    this.cleanupStepValidation();
  },
};
