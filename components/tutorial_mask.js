export default {
  name: 'TutorialMask',
  props: {
    targetElement: {
      type: String,
      required: false,
      default: null,
    },
    padding: {
      type: Number,
      default: 5,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    fadeOut: {
      type: Boolean,
      default: false,
    },
    showBackground: {
      type: Boolean,
      default: true,
    },
    isNotification: {
      type: Boolean,
      default: true,
    },
    allowInteraction: {
      type: Boolean,
      default: true,
    },
    isStepTransitioning: {
      type: Boolean,
      default: false,
    },
  },
  template: `
    <div 
      class="mask-container"
      :class="{ 'visible': visible, 'fade-out': fadeOut }"
      :style="maskStyle"
    >
      <!-- SVG mask for cutout -->
      <svg v-if="showBackground && shouldShowMask" class="mask-svg" preserveAspectRatio="none">
        <defs>
          <mask id="cutout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
            <rect 
              v-if="targetElement"
              :x="maskRect.x" 
              :y="maskRect.y" 
              :width="maskRect.width" 
              :height="maskRect.height" 
              fill="black"
              rx="4"
              ry="4"
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          :fill="determineFill"
          mask="url(#cutout-mask)"
          class="mask-overlay"
        />
      </svg>

      <!-- Clickthrough area -->
      <div 
        v-if="targetElement && !isStepTransitioning && !isPositioning"
        class="clickthrough-area"
        :style="clickthroughStyle"
        :class="{ 'visible': !isStepTransitioning && !isPositioning }"
        @click="handleTargetClick"
      ></div>
    </div>
  `,
  data() {
    return {
      maskRect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      resizeObserver: null,
      scrollObserver: null,
      lastScrollTime: 0,
      scrollTimeout: null,
      isPositioning: false,
      positioningTimeout: null,
    };
  },
  computed: {
    clickthroughStyle() {
      return {
        position: 'fixed',
        left: `${this.maskRect.x}px`,
        top: `${this.maskRect.y}px`,
        width: `${this.maskRect.width}px`,
        height: `${this.maskRect.height}px`,
        pointerEvents: this.allowInteraction ? 'all' : 'none',
        cursor: 'pointer',
        zIndex: 10003, // Ensure it's above other elements
      };
    },
    determineFill() {
      if (this.showBackground) {
        return this.targetElement !== null
          ? 'rgba(0, 0, 0, 0.75)'
          : 'rgba(0, 0, 0, 0.5)';
      }
      return 'rgba(0, 0, 0, 0)';
    },
    shouldShowMask() {
      // Don't show mask when we want full interaction
      return !(
        !this.showBackground &&
        this.allowInteraction &&
        !this.targetElement
      );
    },

    maskStyle() {
      return {
        pointerEvents: this.shouldShowMask ? 'auto' : 'none',
      };
    },
  },
  methods: {
    getTargetElement() {
      if (!this.targetElement) return null;

      // Get all matching elements
      const elements = Array.from(
        document.querySelectorAll(this.targetElement)
      );
      if (!elements.length) return null;

      // Find elements that are currently in view
      const visibleElements = elements.filter((element) => {
        // Basic visibility check
        const style = window.getComputedStyle(element);
        if (
          element.offsetHeight === 0 ||
          element.offsetWidth === 0 ||
          style.display === 'none'
        ) {
          return false;
        }

        // Check if element is in view
        if (!this.isInView(element)) {
          return false;
        }

        // Check for overlapping fixed elements
        const elementZIndex =
          parseInt(window.getComputedStyle(element).zIndex) || 0;
        const rect = element.getBoundingClientRect();
        const overlappingElements = document.elementsFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );

        // Get potential obstructors like modal wrapper and turtle avatar
        const potentialObstructors = overlappingElements.filter((el) => {
          const style = window.getComputedStyle(el);
          return (
            (el.classList.contains('modal-wrapper') &&
              el.classList.contains('fade-in')) ||
            (el.classList.contains('turtle-avatar') &&
              el.classList.contains('animate')) ||
            el.classList.contains('header-container') ||
            el.classList.contains('footer-container')
          );
        });

        // Check if any obstructor is above our element in z-index
        const isObstructed = potentialObstructors.some((obstructor) => {
          const obstructorStyle = window.getComputedStyle(obstructor);
          const obstructorZIndex = parseInt(obstructorStyle.zIndex) || 0;
          return obstructorZIndex > elementZIndex;
        });

        return !isObstructed;
      });

      // If there are visible and unobstructed elements, return the first one
      if (visibleElements.length > 0) {
        return visibleElements[0];
      }

      // If no unobstructed elements are visible, find the first available element and scroll to it
      const firstElement = elements[0];
      this.scrollElementIntoView(firstElement);
      return firstElement;
    },
    async scrollElementIntoView(element) {
      if (!element) return;

      const scrollContainer = document.querySelector('.scroll-container');
      const horizontalContainer = element.closest(
        '.animal-list-container-horizontal'
      );

      const elementRect = element.getBoundingClientRect();
      const margin = 30; // Margin to ensure element isn't right at the edge

      // Calculate required scrolls
      let verticalScrollNeeded = 0;
      let horizontalScrollNeeded = 0;

      // Calculate vertical scroll amount if needed
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const currentScroll = scrollContainer.scrollTop;
        const maxScroll =
          scrollContainer.scrollHeight - scrollContainer.clientHeight;

        // Get the modal's position to adjust available space
        const modalWrapper = document.querySelector('.modal-wrapper.fade-in');
        let availableTop = containerRect.top;
        let availableBottom = containerRect.bottom;

        if (modalWrapper) {
          const modalRect = modalWrapper.getBoundingClientRect();
          if (modalRect.bottom > containerRect.top) {
            availableTop = Math.max(availableTop, modalRect.bottom);
          }
          if (modalRect.top < containerRect.bottom) {
            availableBottom = Math.min(availableBottom, modalRect.top);
          }
        }

        if (elementRect.top < availableTop) {
          // Need to scroll up
          verticalScrollNeeded = elementRect.top - availableTop - margin;
        } else if (elementRect.bottom > availableBottom) {
          // Need to scroll down
          verticalScrollNeeded = elementRect.bottom - availableBottom + margin;
        }

        // Clamp the scroll value to valid range
        const newScrollTop = Math.max(
          0,
          Math.min(maxScroll, currentScroll + verticalScrollNeeded)
        );
        verticalScrollNeeded = newScrollTop - currentScroll;
      }

      // Calculate horizontal scroll amount if needed
      if (horizontalContainer) {
        const containerRect = horizontalContainer.getBoundingClientRect();
        const currentScroll = horizontalContainer.scrollLeft;
        const maxScroll =
          horizontalContainer.scrollWidth - horizontalContainer.clientWidth;

        if (elementRect.left < containerRect.left) {
          // Need to scroll left
          horizontalScrollNeeded =
            elementRect.left - containerRect.left - margin;
        } else if (elementRect.right > containerRect.right) {
          // Need to scroll right
          horizontalScrollNeeded =
            elementRect.right - containerRect.right + margin;
        }

        // Clamp the scroll value to valid range
        const newScrollLeft = Math.max(
          0,
          Math.min(maxScroll, currentScroll + horizontalScrollNeeded)
        );
        horizontalScrollNeeded = newScrollLeft - currentScroll;
      }

      // Log calculated scroll amounts
      console.log('Required scroll amounts:', {
        vertical: verticalScrollNeeded,
        horizontal: horizontalScrollNeeded,
      });

      // Apply scrolls if needed
      if (verticalScrollNeeded !== 0) {
        console.log(
          `Scrolling ${verticalScrollNeeded > 0 ? 'down' : 'up'} by:`,
          Math.abs(verticalScrollNeeded)
        );
        scrollContainer.scrollBy({
          top: verticalScrollNeeded,
          behavior: 'smooth',
        });
      }

      if (horizontalScrollNeeded !== 0) {
        console.log(
          `Scrolling ${horizontalScrollNeeded > 0 ? 'right' : 'left'} by:`,
          Math.abs(horizontalScrollNeeded)
        );
        horizontalContainer.scrollBy({
          left: horizontalScrollNeeded,
          behavior: 'smooth',
        });
      }

      // Return a promise that resolves when scrolling is likely complete
      return new Promise((resolve) => {
        const scrollDuration = 500; // Typical smooth scroll duration
        setTimeout(() => {
          const finalRect = element.getBoundingClientRect();
          console.log('Final position check:', {
            rect: finalRect,
            isInView: this.isInView(element),
          });
          resolve();
        }, scrollDuration);
      });
    },
    // Helper method to check if element is fully in view
    isInView(element) {
      const elementRect = element.getBoundingClientRect();
      const scrollContainer = document.querySelector('.scroll-container');
      const horizontalContainer = element.closest(
        '.animal-list-container-horizontal'
      );

      let isVerticallyVisible = true;
      let isHorizontallyVisible = true;

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        isVerticallyVisible =
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;
      }

      if (horizontalContainer) {
        const containerRect = horizontalContainer.getBoundingClientRect();
        isHorizontallyVisible =
          elementRect.left >= containerRect.left &&
          elementRect.right <= containerRect.right;
      }

      return isVerticallyVisible && isHorizontallyVisible;
    },

    async updateMask() {
      if (!this.targetElement || this.isStepTransitioning) {
        console.log('Skip mask update - transitioning or no target');
        return;
      }

      // Clear any existing positioning timeout
      if (this.positioningTimeout) {
        clearTimeout(this.positioningTimeout);
      }

      // Start positioning
      this.isPositioning = true;
      console.log('Starting element positioning');

      try {
        // First, wait for modal and turtle to finish their animations
        await this.waitForAnimationsToComplete();
        console.log('Animations complete, proceeding with target search');

        const target = this.getTargetElement();
        if (!target) {
          console.warn(`No element found for selector: ${this.targetElement}`);
          return;
        }

        // Check if target is in view and not obstructed
        const scrollContainer = document.querySelector('.scroll-container');
        const horizontalContainer = target.closest(
          '.animal-list-container-horizontal'
        );

        if (scrollContainer || horizontalContainer) {
          const targetRect = target.getBoundingClientRect();
          const modalWrapper = document.querySelector('.modal-wrapper.fade-in');
          const modalRect = modalWrapper
            ? modalWrapper.getBoundingClientRect()
            : null;

          let availableSpace = {
            top: scrollContainer
              ? scrollContainer.getBoundingClientRect().top
              : 0,
            bottom: scrollContainer
              ? scrollContainer.getBoundingClientRect().bottom
              : window.innerHeight,
            left: horizontalContainer
              ? horizontalContainer.getBoundingClientRect().left
              : 0,
            right: horizontalContainer
              ? horizontalContainer.getBoundingClientRect().right
              : window.innerWidth,
          };

          // Adjust available space based on modal position
          if (modalRect && modalWrapper.style.position === 'fixed') {
            if (modalRect.bottom > availableSpace.top) {
              availableSpace.top = Math.max(
                availableSpace.top,
                modalRect.bottom
              );
            }
            if (modalRect.top < availableSpace.bottom) {
              availableSpace.bottom = Math.min(
                availableSpace.bottom,
                modalRect.top
              );
            }
          }

          // Check if element is obscured or out of view
          const isObscured = this.isElementObscured(target);
          const isOutOfView =
            targetRect.top < availableSpace.top ||
            targetRect.bottom > availableSpace.bottom ||
            (horizontalContainer &&
              (targetRect.left < availableSpace.left ||
                targetRect.right > availableSpace.right));

          console.log('Visibility check:', {
            isObscured,
            isOutOfView,
            targetRect,
            availableSpace,
          });

          if (isObscured || isOutOfView) {
            // Element not fully visible, emit scroll event
            this.$emit('scroll-into-view-if-needed');
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for scroll
          }
        }

        // Final position update
        const finalRect = target.getBoundingClientRect();
        this.maskRect = {
          x: finalRect.x - this.padding,
          y: finalRect.y - this.padding,
          width: finalRect.width + this.padding * 2,
          height: finalRect.height + this.padding * 2,
        };

        console.log('Final mask rect:', this.maskRect);
      } finally {
        this.isPositioning = false;
      }
    },

    // Add method to wait for animations
    async waitForAnimationsToComplete() {
      return new Promise((resolve) => {
        // Get delay from current step or default to 0
        const initialDelay =
          this.$parent.currentTutorialStep?.overlapDetectionDelay || 0;

        // Use initial delay before starting animation checks
        setTimeout(() => {
          if (initialDelay > 0) {
            console.log(
              `Initial delay complete (${initialDelay}ms), checking animations`
            );
          }

          const checkAnimations = (startTime = Date.now()) => {
            const modalWrapper = document.querySelector('.modal-wrapper');
            const turtleAvatar = document.querySelector('.turtle-avatar');
            const timeout = 5000; // 5 second timeout

            if (Date.now() - startTime > timeout) {
              console.log('Animation wait timed out');
              resolve();
              return;
            }

            if (!modalWrapper || !turtleAvatar) {
              setTimeout(() => checkAnimations(startTime), 100);
              return;
            }

            const modalStyle = window.getComputedStyle(modalWrapper);
            const turtleStyle = window.getComputedStyle(turtleAvatar);

            const isModalStable = !modalStyle.transform.includes('translate');
            const isTurtleStable =
              turtleStyle.opacity === '1' &&
              !turtleStyle.transform.includes('scale');

            if (isModalStable && isTurtleStable) {
              console.log('Animations complete');
              // Use standard 200ms buffer for most steps
              const bufferTime = 200;
              setTimeout(resolve, bufferTime);
            } else {
              setTimeout(() => checkAnimations(startTime), 100);
            }
          };

          checkAnimations();
        }, initialDelay);
      });
    },

    isElementObscured(targetElement) {
      if (!targetElement) return false;

      const targetRect = targetElement.getBoundingClientRect();
      const targetZIndex =
        parseInt(window.getComputedStyle(targetElement).zIndex) || 0;

      // Get modal and turtle positions
      const modalWrapper = document.querySelector('.modal-wrapper.fade-in');
      const turtleAvatar = document.querySelector('.turtle-avatar.animate');
      const headerContainer = document.querySelector('.header-container');
      const footerContainer = document.querySelector('.footer-container');

      const obstructors = [
        modalWrapper,
        turtleAvatar,
        headerContainer,
        footerContainer,
      ].filter(Boolean);

      for (const obstructor of obstructors) {
        const style = window.getComputedStyle(obstructor);
        const zIndex = parseInt(style.zIndex) || 0;

        if (zIndex <= targetZIndex || style.position !== 'fixed') {
          continue;
        }

        const obstructorRect = obstructor.getBoundingClientRect();
        if (this.doElementsIntersect(obstructorRect, targetRect)) {
          console.log('Element obscured by:', obstructor, {
            obstructorRect,
            targetRect,
          });
          return true;
        }
      }

      return false;
    },

    // Helper method to check if two rectangles intersect
    doElementsIntersect(rect1, rect2) {
      return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      );
    },
    handleTargetClick(event) {
      console.log('Handle target click triggered');
      const target = this.getTargetElement();
      if (!target || !this.allowInteraction) {
        console.log('Target missing or interaction not allowed');
        return;
      }

      console.log('Target element:', target);

      // Handle marker clicks
      const markerElement = target.closest('[data-marker-id]');
      if (markerElement) {
        console.log('Handling marker click');
        const markerId = markerElement.getAttribute('data-marker-id');

        // Create and dispatch a custom event
        const customEvent = new CustomEvent('marker-click', {
          detail: { id: markerId },
          bubbles: true,
          cancelable: true,
        });
        markerElement.dispatchEvent(customEvent);
        return;
      }

      console.log('Handling regular click');

      // Execute Vue's internal event handlers if they exist
      if (target._vei) {
        console.log('Found Vue event listeners:', target._vei);

        for (const [eventName, listener] of Object.entries(target._vei)) {
          if (eventName.startsWith('on')) {
            console.log(`Executing Vue handler for ${eventName}`);
            listener.value(event);
          }
        }
      }

      // Try to trigger native click listeners
      console.log('Triggering native click listeners');
      const clonedEvent = new event.constructor(event.type, event);
      target.dispatchEvent(clonedEvent);
    },
    setupObservers() {
      if (!this.targetElement) return;

      const target = this.getTargetElement();
      if (!target) return;

      // Find the scrollable container
      const scrollContainer = target.closest('.scroll-container');

      if (scrollContainer) {
        // Setup scroll observer for the container
        const scrollHandler = window.lodash.throttle(() => {
          this.updateMask();
          this.$emit('scroll-into-view-if-needed');
        }, 100);

        scrollContainer.addEventListener('scroll', scrollHandler);

        // Store reference for cleanup
        this.scrollContainer = scrollContainer;
        this.scrollHandler = scrollHandler;
      }

      // Continue with resize observer setup...
      this.resizeObserver = new ResizeObserver(
        window.lodash.throttle(() => {
          this.updateMask();
        }, 100)
      );
      this.resizeObserver.observe(target);
    },
    handleScroll: window.lodash.throttle(function () {
      this.updateMask();
    }, 100),
    setupResizeObserver() {
      if (!this.targetElement) return;

      const target = this.getTargetElement();
      if (!target) return;

      this.resizeObserver = new ResizeObserver(() => {
        this.updateMask();
      });

      this.resizeObserver.observe(target);
    },
    cleanup() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      if (this.scrollHandler && this.scrollContainer) {
        this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
      }

      this.scrollContainer = null;
      this.scrollHandler = null;

      clearTimeout(this.scrollTimeout);

      // Remove scroll listeners
      const target = this.getTargetElement();
      if (target) {
        let element = target;
        while (element) {
          if (element.scrollHeight > element.clientHeight) {
            element.removeEventListener('scroll', this.handleScroll);
          }
          element = element.parentElement;
        }
      }

      window.removeEventListener('scroll', this.handleScroll);
    },
  },
  watch: {
    targetElement: {
      immediate: true,
      handler(newVal) {
        this.$nextTick(() => {
          this.cleanup();
          if (newVal) {
            this.updateMask();
            this.setupObservers();
          }
        });
      },
    },
    isStepTransitioning(newVal) {
      if (newVal) {
        // Immediately hide the mask and clickthrough area
        this.maskRect = { x: 0, y: 0, width: 0, height: 0 };
        console.log('isStepTransitioning() reset mask to 0,0,0,0');
      } else {
        this.updateMask();
      }
    },
  },
  mounted() {
    window.addEventListener('resize', this.updateMask);
  },
  beforeDestroy() {
    this.cleanup();
    window.removeEventListener('resize', this.updateMask);
  },
};
