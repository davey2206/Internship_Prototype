// expired_session_modal.js
import BaseModal from './base_modal.js';
import TutorialMask from './tutorial_mask.js';

export default {
  name: 'ExpiredSessionModal',
  components: {
    BaseModal,
    TutorialMask,
  },
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
    componentKey: {
      type: String,
      required: true,
    },
    kukudushi: {
      type: Object,
      required: true,
    },
  },
  template: `
    <BaseModal
      :plugin-dir-url="pluginDirUrl"
      :should-render="true"
      :componentKey="componentKey"
      ref="baseModal"
    >
      <template #modal-content>
        <div class="notification-message">
          <div class="message-title">Connection Lost</div>
          <div v-if="kukudushi.temporary_id_expired">
            <p>Your connection with your accessory has been lost.</p>
            <p>
              Don’t worry, this is normal. 
              <br>
              You need to reconnect with your Animal Care Center daily.
            </p>
            <p>Please scan your accessory again to reestablish the connection with your Animal Care Center.</p>
          </div>
          <div v-else>
            <p>We couldn’t locate your Animal Care Center. Please scan your accessory to start your journey.</p>
          </div>
          <p>Need help? <a href="support-link">Contact our support team</a> for assistance.</p>
        </div>
      </template>

      <template #modal-buttons>
        <button 
          class="sticky-next-button" 
          @click="closeModal"
        >
          Get Help
        </button>
      </template>
    </BaseModal>

    <TutorialMask
      :visible="true"
      :fade-out="false"
      :target-element=""
      :show-background="true"
      :padding="8"
      :isNotification="true"
    />
  `,
  methods: {
    closeModal() {
      //const baseModal = this.$refs.baseModal;
      //if (baseModal) {
      //  baseModal.closeModal();
      //}
      // Get the current origin (protocol + hostname)
      const origin = window.location.origin;
      // Redirect to homepage with #how-to-track anchor
      window.location.href = `${origin}/#how-to-track`;
      this.$emit('modal-closed');
    },
  },
};
