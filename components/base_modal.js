// base_modal.js
export default {
  name: 'BaseModal',
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
    shouldRender: {
      type: Boolean,
      default: true,
    },
    componentKey: {
      type: String,
      required: true,
    },
    currentStep: {
      type: Object,
      default: () => ({ modal_position: 'center' }),
    },
  },

  data() {
    return {
      visible: false,
      fadingOut: false,
      modalVisible: false,
      circleVisibility: [false, false, false, false],
      turtleStyles: {
        position: 'fixed',
        top: '0',
        right: '1%',
        width: '48px',
        height: 'auto',
        transition: 'all 2s ease',
        zIndex: 1000,
      },
      resizeObserver: null,
      mutationObserver: null,
      isAnimatingBack: false,
    };
  },
  template: `
    <div class="modal-root">
      <div 
        class="modal-container" 
        :class="{ 'visible': visible, 'fade-out': fadingOut }"
        @click.stop
      >
        <img 
          ref="turtleAvatar"
          class="turtle-avatar" 
          :src="pluginDirUrl + '/media/animal_avatars/avatar_turtle.webp'" 
          alt="Turtle Avatar"
          :style="turtleContainerStyle"
          :class="{ animate: visible && !fadingOut }"
        />

        <div 
          ref="modalWrapper"
          class="modal-wrapper" 
          :class="[
            modalPosition,
            { 'fade-in': modalVisible, 'fade-out': fadingOut }
          ]"
        >
          <!-- Notification Content -->
          <div class="overlay-modal" @click.stop>
            <slot name="modal-content"></slot>
          </div>

          <!-- Notification Dots -->
          <slot name="modal-dots"></slot>

          <!-- Button Group -->
          <div class="button-group" @click.stop>
            <slot name="modal-buttons"></slot>
          </div>
        </div>

        <div 
          v-for="(_, index) in 4" 
          :key="index"
          class="speech-circle"
          :class="[
            'circle-' + (index + 1),
            { 'fade-in': circleVisibility[index] },
            { 'fade-out': fadingOut }
          ]"
          ref="speechCircles"
        ></div>
      </div>
    </div>
  `,
  computed: {
    modalContainerStyle() {
      const position = this.currentStep?.modal_position || 'center';
      const baseStyle = {
        position: 'fixed',
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 10002,
        display: 'flex',
        justifyContent: 'center',
        alignItems: position === 'center' ? 'center' : 'flex-start',
        pointerEvents: 'none',
      };

      // Adjust vertical positioning
      switch (position) {
        case 'top':
          baseStyle.paddingTop = '10vh';
          break;
        case 'bottom':
          baseStyle.alignItems = 'flex-end';
          baseStyle.paddingBottom = '10vh';
          break;
        default: // center
          baseStyle.alignItems = 'center';
      }

      return baseStyle;
    },

    modalPosition() {
      return this.currentStep?.modal_position || 'center';
    },

    shouldPositionAbove() {
      const position = this.currentStep?.modal_position || 'center';
      return position !== 'top';
    },

    turtleContainerStyle() {
      const modalWrapper = this.$refs.modalWrapper;
      if (!modalWrapper) return this.turtleStyles;

      const modalRect = modalWrapper.getBoundingClientRect();
      const baseStyle = { ...this.turtleStyles };

      if (this.shouldPositionAbove) {
        // Position turtle above modal (original spacing)
        baseStyle.top = `${modalRect.top - modalRect.height * 1.25}px`;
        baseStyle.right = `${
          window.innerWidth - modalRect.right - modalRect.width / 4
        }px`;
      } else {
        // Position turtle below modal (maintain similar spacing ratio)
        baseStyle.top = `${modalRect.bottom + modalRect.height * 0.25}px`;
        baseStyle.right = `${
          window.innerWidth - modalRect.right - modalRect.width / 4
        }px`;
      }

      return baseStyle;
    },
  },
  mounted() {
    console.log('BaseModal mounted:', {
      shouldRender: this.shouldRender,
      pluginDirUrl: this.pluginDirUrl,
    });

    if (this.shouldRender) {
      console.log('Attempting to render modal...');

      this.$nextTick(() => {
        // Reset state whenever mounted with shouldRender true
        this.visible = false;
        this.fadingOut = false;
        this.modalVisible = false;
        this.circleVisibility = [false, false, false, false];

        const modalContainer = this.$el.querySelector('.modal-container');
        if (modalContainer) {
          console.log('Found modal container, set to hidden:', modalContainer);
          modalContainer.classList.remove('hidden');
        }

        const overlayContainer = this.$el.querySelector('.overlay-container');
        if (overlayContainer) {
          console.log(
            'Found overlay container, pointerEvents set to auto:',
            overlayContainer
          );
          overlayContainer.style.pointerEvents = 'auto';
        }

        // Short delay before starting animations
        setTimeout(() => {
          this.visible = true;
          this.animateTurtle();
        }, 50);
      });
    }
  },
  beforeDestroy() {
    this.disconnectObservers();
  },
  watch: {
    shouldRender: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.$nextTick(() => {
            // Reset state and start fresh
            this.resetModalState();

            // Set up initial state for animation
            this.visible = true;
            this.animateTurtle();
          });
        }
      },
    },
    'currentStep.modal_position': {
      handler() {
        this.$nextTick(() => {
          this.updatePositions();
          this.updateTurtlePosition();
        });
      },
    },
  },
  beforeDestroy() {
    this.resetModalState();
  },
  methods: {
    // Add this method to the methods section in base_modal.js
    updateTurtlePosition() {
      // Get the current modal wrapper element
      const modalWrapper = this.$refs.modalWrapper;
      if (!modalWrapper) return;

      // Get turtle avatar element
      const avatar = this.$refs.turtleAvatar;
      if (!avatar) return;

      // Get the modal wrapper's bounding rect
      const modalRect = modalWrapper.getBoundingClientRect();

      // Calculate new position based on modal position
      const viewportHeight = window.innerHeight;
      const estimatedAvatarHeight = 0.18 * viewportHeight;

      // Position above or below the modal based on current positioning
      const top = this.shouldPositionAbove
        ? modalRect.top - estimatedAvatarHeight
        : modalRect.bottom + 20;

      // Apply the new position
      this.turtleStyles.top = `${top}px`;

      // Center horizontally relative to the modal
      this.turtleStyles.right = `${
        window.innerWidth - modalRect.right - modalRect.width / 4
      }px`;
    },
    animateTurtle() {
      const turtleAvatar = this.$el.querySelector('.turtle-avatar');
      if (!turtleAvatar) return;

      turtleAvatar.classList.remove('animate');
      void turtleAvatar.offsetWidth;

      var modalWrapperElement = this.$el.querySelector('.modal-wrapper');
      var top = '55';
      const viewportHeight = window.innerHeight;
      const estimatedAvatarHeight = 0.18 * viewportHeight;

      if (modalWrapperElement) {
        var rect = modalWrapperElement.getBoundingClientRect();
        if (this.shouldPositionAbove) {
          top = rect.top - estimatedAvatarHeight;
        } else {
          top = rect.bottom + 20;
        }
      }

      setTimeout(() => {
        this.turtleStyles.top = top + 'px';
        this.turtleStyles.right = '-12px';
        this.turtleStyles.width = '50vw';
        this.turtleStyles.opacity = 1;

        setTimeout(() => {
          if (!this.isAnimatingBack) {
            turtleAvatar.classList.add('animate');
            this.initializeObserversWithRetry();
            this.fadeInSpeechCircles();
            this.modalVisible = true;
            this.updatePositions();
          }
        }, 2000);
      }, 50);
    },

    startTurtleAnimations() {
      if (this.isAnimatingBack) return;

      const turtleAvatar = this.$el.querySelector('.turtle-avatar');
      if (turtleAvatar) {
        turtleAvatar.classList.add('animate');
      }
    },

    animateTurtleBack() {
      const turtleAvatar = this.$el.querySelector('.turtle-avatar');
      if (!turtleAvatar) return;

      // Stop float animation first
      this.isAnimatingBack = true;
      turtleAvatar.classList.remove('animate');

      // Force reflow
      void turtleAvatar.offsetWidth;

      // Temporarily disable opacity transition
      /*turtleAvatar.style.transition =
        'top 2s ease, right 2s ease, width 2s ease';*/

      // Apply back animation styles
      setTimeout(() => {
        this.turtleStyles.top = '0';
        this.turtleStyles.right = '1%';
        this.turtleStyles.width = '48px';
        this.turtleStyles.opacity = 0;
      }, 100);

      // Reset isAnimatingBack after movement completes
      setTimeout(() => {
        this.isAnimatingBack = false;
      }, 2000);
    },

    fadeInSpeechCircles() {
      const interval = 150;
      let delay = 0;

      // Fade in circles from largest to smallest
      for (let i = this.circleVisibility.length - 1; i > 0; i--) {
        setTimeout(() => {
          this.circleVisibility[i] = true;
          const circleElement = this.$el.querySelector(`.circle-${i + 1}`);
          if (circleElement) {
            circleElement.classList.add('fade-in');
          }
        }, delay);
        delay += interval;
      }

      // Handle the half-circle (first circle) separately
      setTimeout(() => {
        this.circleVisibility[0] = true;
        const lastCircleElement = this.$el.querySelector('.circle-1');
        if (lastCircleElement) {
          lastCircleElement.classList.add('fade-in');
        }
        this.modalVisible = true;

        // Update turtle position after content is visible
        this.$nextTick(() => {
          const modalWrapperElement = this.$el.querySelector('.modal-wrapper');
          if (modalWrapperElement) {
            const rect = modalWrapperElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const estimatedAvatarHeight = 0.18 * viewportHeight;

            const top = this.shouldPositionAbove
              ? rect.top - estimatedAvatarHeight
              : rect.bottom + 20;

            this.turtleStyles.top = top + 'px';
          }
        });
      }, delay);
    },

    fadeOutSpeechCircles(callback) {
      const interval = 150;
      let delay = 0;

      // Fade out circles from smallest to largest
      for (let i = 0; i < this.circleVisibility.length; i++) {
        setTimeout(() => {
          this.circleVisibility[i] = false;
          const circleElement = this.$el.querySelector(`.circle-${i + 1}`);
          if (circleElement) {
            circleElement.classList.add('fade-out');
          }
        }, delay);
        delay += interval;
      }

      // Execute callback after animation completes
      setTimeout(() => {
        if (callback) callback();
      }, delay + 200);
    },

    handleContainerClick(event) {
      // Explicitly stop propagation and prevent default
      event.stopPropagation();
      event.preventDefault();
    },

    closeModal() {
      if (this.$parent?.shouldPreventClose?.()) {
        return;
      }

      this.fadingOut = true;

      const turtleAvatar = this.$el.querySelector('.turtle-avatar');
      if (turtleAvatar) {
        // First start movement animation
        turtleAvatar.style.transition =
          'top 2s ease, right 2s ease, width 2s ease';
        this.turtleStyles.top = '0';
        this.turtleStyles.right = '1%';
        this.turtleStyles.width = '48px';

        // After movement completes, start fade out
        setTimeout(() => {
          turtleAvatar.style.transition = 'opacity 1s ease';
          turtleAvatar.style.opacity = '0';
        }, 2000);
      }

      this.disconnectObservers();

      // Final cleanup after all animations
      setTimeout(() => {
        this.resetModalState();
      }, 3000);
    },

    resetModalState() {
      if (!this.$el) return;

      const turtleAvatar = this.$el?.querySelector('.turtle-avatar');
      if (turtleAvatar) {
        // Reset transitions and classes
        turtleAvatar.style.transition = 'all 2s ease';
        turtleAvatar.classList.remove('animate', 'fade-out');
      }

      // Set initial state
      this.turtleStyles.top = '0';
      this.turtleStyles.right = '1%';
      this.turtleStyles.width = '48px';

      this.visible = false;
      this.fadingOut = false;
      this.modalVisible = false;
      this.circleVisibility = [false, false, false, false];
      this.isAnimatingBack = false;

      this.disconnectObservers();
    },

    initializeObserversWithRetry(retries = 5) {
      if (!this.shouldRender) return;

      this.$nextTick(() => {
        const modal = this.$el.querySelector('.overlay-modal');

        if (modal) {
          this.initializeObservers();
        } else if (retries > 0) {
          setTimeout(() => this.initializeObserversWithRetry(retries - 1), 200);
        } else {
          console.warn('Modal not found, skipping observers initialization.');
        }
      });
    },

    initializeObservers() {
      const modal = this.$el.querySelector('.overlay-modal');
      const target = this.$el;

      if (modal) {
        if ('ResizeObserver' in window) {
          this.resizeObserver = new ResizeObserver(() => {
            this.debounceUpdatePositions();
          });
          this.resizeObserver.observe(modal);
        } else {
          console.warn('ResizeObserver is not supported in this browser.');
          this.updatePositions();
        }

        this.mutationObserver = new MutationObserver(() => {
          this.debounceUpdatePositions();
        });

        this.mutationObserver.observe(target, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }

      // Ensure initial positioning
      this.$nextTick(() => {
        this.updatePositions();
      });
    },

    disconnectObservers() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    },

    updatePositions() {
      const modalWrapper = this.$refs.modalWrapper;
      const avatar = this.$refs.turtleAvatar;
      const circles = Array.from(this.$el.querySelectorAll('.speech-circle'));
      const overlayModal = this.$el.querySelector('.overlay-modal');

      if (!modalWrapper || !avatar || !overlayModal || circles.length === 0)
        return;

      const overlayRect = overlayModal.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      const firstCircle = circles[0];
      const firstCircleHeight = firstCircle.getBoundingClientRect().height;
      const firstCircleWidth = firstCircle.getBoundingClientRect().width;

      const startX = overlayRect.left;
      const startY = this.shouldPositionAbove
        ? overlayRect.top
        : overlayRect.bottom;

      const avatarBottomLeftX = avatarRect.left - avatarRect.width * 0.05;
      const avatarBottomLeftY = avatarRect.bottom - avatarRect.height * 0.35;

      const controlPointX = (startX + avatarBottomLeftX) / 2;
      const controlPointY = this.shouldPositionAbove
        ? avatarBottomLeftY // Original logic for above positioning
        : (startY + avatarBottomLeftY) / 2; // Adjusted logic for below positioning

      const curveDirection = this.shouldPositionAbove
        ? 'right-bottom'
        : 'bottom-right';

      circles.forEach((circle, index) => {
        const t = index / (circles.length - 1);
        const point = this.calculateBezierPoint(
          startX,
          startY,
          avatarBottomLeftX,
          avatarBottomLeftY,
          controlPointX,
          controlPointY,
          t,
          curveDirection // Pass the curve direction
        );

        if (!isNaN(point.x) && !isNaN(point.y)) {
          const adjustedX =
            point.x +
            (this.shouldPositionAbove
              ? -firstCircleWidth / 4 // Move up for center/bottom position
              : -firstCircleWidth / 5);
          const adjustedY =
            point.y +
            (this.shouldPositionAbove
              ? -firstCircleHeight / 4 // Move up for center/bottom position
              : -firstCircleHeight / 1.5);

          Object.assign(circle.style, {
            position: 'fixed',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
          });
        }
      });
    },

    calculateBezierPoint(
      startX,
      startY,
      endX,
      endY,
      controlX,
      controlY,
      t,
      direction = 'right-bottom'
    ) {
      let adjustedStartX = startX,
        adjustedStartY = startY;
      let adjustedEndX = endX,
        adjustedEndY = endY;
      let adjustedControlX = controlX,
        adjustedControlY = controlY;

      if (direction === 'bottom-right') {
        // Adjust control points for a bottom-right curve
        adjustedControlX = startX;
        adjustedControlY = (startY + endY) / 2;
      }

      // Original logic for right-bottom remains the default

      const x =
        Math.pow(1 - t, 2) * adjustedStartX +
        2 * (1 - t) * t * adjustedControlX +
        Math.pow(t, 2) * adjustedEndX;

      const y =
        Math.pow(1 - t, 2) * adjustedStartY +
        2 * (1 - t) * t * adjustedControlY +
        Math.pow(t, 2) * adjustedEndY;

      return { x, y };
    },

    getEvenlySpacedTValues(calculateBezierPoint, numPoints, segments = 100) {
      const arcLengths = [0];
      let totalLength = 0;

      // Calculate arc lengths along the curve
      for (let i = 1; i <= segments; i++) {
        const t0 = (i - 1) / segments;
        const t1 = i / segments;
        const p0 = calculateBezierPoint(t0);
        const p1 = calculateBezierPoint(t1);
        const segmentLength = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        totalLength += segmentLength;
        arcLengths.push(totalLength);
      }

      // Normalize arc lengths
      arcLengths.forEach((length, i) => {
        arcLengths[i] = length / totalLength;
      });

      // Calculate evenly spaced t values
      const tValues = [];
      for (let i = 0; i < numPoints; i++) {
        if (i === 0) {
          tValues.push(0);
        } else if (i === numPoints - 1) {
          tValues.push(1);
        } else {
          const targetLength = i / (numPoints - 1);
          let j = 0;
          while (arcLengths[j] < targetLength) j++;
          const t0 = (j - 1) / segments;
          const t1 = j / segments;
          const segmentRatio =
            (targetLength - arcLengths[j - 1]) /
            (arcLengths[j] - arcLengths[j - 1]);
          tValues.push(t0 + segmentRatio * (t1 - t0));
        }
      }
      return tValues;
    },

    debounceUpdatePositions() {
      this.debounce(this.updatePositions, 100)();
    },

    debounce(func, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    },
  },
};
