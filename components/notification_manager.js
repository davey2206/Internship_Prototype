// notification_manager.js
import BaseModal from './base_modal.js';
import TutorialMask from './tutorial_mask.js';

export default {
  name: 'NotificationManager',
  components: {
    BaseModal,
    TutorialMask,
  },
  props: {
    notifications: {
      type: Array,
      required: false,
      default: () => [],
    },
    is_new_user: {
      type: Boolean,
      required: false,
      default: false,
    },
    pluginDirUrl: {
      type: String,
      required: true,
    },
    componentKey: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      currentNotificationIndex: 0,
      startTime: null,
      localNotifications: [],
      readNotifications: new Set(),
    };
  },
  template: `
    <BaseModal
      :plugin-dir-url="pluginDirUrl"
      :should-render="shouldRender"
      :componentKey="componentKey"
      ref="baseModal"
    >
      <template #modal-content>
        <img 
          v-if="currentNotification.image" 
          :src="currentNotification.image" 
          alt="Notification Image" 
          class="notification-image" 
        />
        <div 
          class="notification-message" 
          v-html="formattedMessage"
        />
      </template>

      <template #modal-dots>
        <div 
          v-if="localNotifications.length > 1" 
          class="notification-dots"
          @click.stop
        >
          <button
            v-for="dot in notificationDots"
            :key="dot.index"
            class="notification-dot"
            :class="{ 'active': dot.active }"
            @click.stop="goToNotification($event, dot.index)"
          ></button>
        </div>
      </template>

      <template #modal-buttons>
        <button 
          class="sticky-close-button" 
          @click="closeModal"
        >
          Close Notification
        </button>
      </template>
    </BaseModal>

    <TutorialMask
      :visible="visible && shouldRender"
      :fade-out="fadingOut"
      :target-element=""
      :show-background="true"
      :padding="8"
      :isNotification="true"
    />
`,

  computed: {
    shouldRender() {
      const hasNotifications =
        this.notifications &&
        Array.isArray(this.notifications) &&
        this.notifications.length > 0;
      // Convert is_new_user to boolean
      const isNewUser = Boolean(this.is_new_user);
      console.log('Render conditions:', {
        hasNotifications,
        isNewUser,
        shouldRender: isNewUser || hasNotifications,
      });
      return isNewUser || hasNotifications;
    },

    currentNotification() {
      return this.localNotifications[this.currentNotificationIndex] || {};
    },

    formattedMessage() {
      if (this.currentNotification.message) {
        return this.currentNotification.message.replace(/\n/g, '<br>');
      }
      return '';
    },

    hasMoreNotifications() {
      return this.currentNotificationIndex < this.localNotifications.length - 1;
    },
    notificationDots() {
      console.log('Notifications length:', this.localNotifications.length);
      const dots = this.localNotifications.map((_, index) => ({
        active: index === this.currentNotificationIndex,
        index,
      }));
      console.log('Generated dots:', dots);
      return dots;
    },
  },

  watch: {
    notifications: {
      immediate: true,
      handler(newNotifications) {
        if (newNotifications?.length > 0) {
          //this.componentKey++; // Force component recreation
        }
        //debug
        console.log('Notifications updated in manager:', newNotifications);
        console.log('Is new user?', this.is_new_user);
        console.log('Should render?', this.shouldRender);

        // Safely initialize localNotifications
        this.localNotifications = newNotifications ? [...newNotifications] : [];

        // Check if a welcome message (id: 0) already exists
        const hasWelcomeMessage = this.localNotifications.some(
          (notification) => notification.id === 0
        );

        // Prepend welcome message for new users if not already added
        if (this.is_new_user && !hasWelcomeMessage) {
          this.localNotifications.unshift({
            id: 0,
            message: `
              <div class="message-title">Welcome to the world of Kukudushi!</div>
              <p>I'm so excited to have you here. You can track us, earn points daily, and discover amazing facts about us along the way.</p> 
              <p>We're getting everything ready for you—hang tight!</p>
            `,
            image: null,
          });
        }

        // Trigger render if applicable
        if (this.shouldRender) {
          this.visible = true;
          this.$nextTick(this.animateTurtle);
        }
      },
    },
  },
  methods: {
    shouldPreventClose() {
      // Prevent closing if we're in the middle of a notification transition
      return (
        this.currentNotificationIndex !== this.localNotifications.length - 1
      );
    },
    goToNotification(event, index) {
      // Prevent any click events from bubbling
      event.stopPropagation();
      event.preventDefault();
      event.stopImmediatePropagation();

      if (index === this.currentNotificationIndex) return;

      const baseModal = this.$refs.baseModal;

      // Hide current modal content
      baseModal.modalVisible = false;

      baseModal.fadeOutSpeechCircles(() => {
        setTimeout(() => {
          // Just mark as read without emitting close
          if (!this.readNotifications.has(this.currentNotification.id)) {
            this.readNotifications.add(this.currentNotification.id);
          }

          // Update to new notification
          this.currentNotificationIndex = index;
          this.startTime = new Date();

          // Re-animate turtle position and speech bubbles
          this.$nextTick(() => {
            baseModal.animateTurtle();
          });
        }, 200);
      });
    },

    closeModal() {
      const baseModal = this.$refs.baseModal;

      baseModal.modalVisible = false;

      baseModal.fadeOutSpeechCircles(() => {
        // Emit close events for all unread notifications
        const remainingNotifications = this.localNotifications.filter(
          (notification) => !this.readNotifications.has(notification.id)
        );

        // Emit close events for remaining unread notifications
        remainingNotifications.forEach((notification) => {
          this.$emit('close-notification', {
            id: notification.id,
            startTime: this.startTime,
            endTime: new Date(),
            newUser: this.is_new_user,
            isLastNotification: true,
          });
          this.readNotifications.add(notification.id);
        });

        // Then proceed with the full modal close
        baseModal.closeModal();
      });
    },

    handleModalClosed() {
      // Ensure we emit the close event for the current notification
      this.emitNotificationClosed();
      this.$emit('modal-closed');
    },

    emitNotificationClosed() {
      // Only emit if this notification hasn't been read yet
      if (this.readNotifications.has(this.currentNotification.id)) {
        return;
      }

      const endTime = new Date();
      const notification_id = this.is_new_user
        ? 0
        : this.currentNotification.id;

      this.$emit('close-notification', {
        id: notification_id,
        startTime: this.startTime,
        endTime: endTime,
        newUser: this.is_new_user,
        isLastNotification:
          this.currentNotificationIndex === this.localNotifications.length - 1,
      });

      // Mark this notification as read
      this.readNotifications.add(this.currentNotification.id);
    },
  },

  mounted() {
    if (this.shouldRender) {
      // Set initial start time for the first notification
      this.startTime = new Date();
    }
  },
};
