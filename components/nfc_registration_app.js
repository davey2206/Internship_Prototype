// File: components/nfc_registration_app.js

import NFCRegistrationComponent from './nfc_registration.js';

document.addEventListener('DOMContentLoaded', function () {
  // Check if mount point exists
  const appRoot = document.getElementById('kukudushi-nfc-registration-app');
  if (appRoot && window.Vue) {
    const app = Vue.createApp({
      components: {
        NFCRegistrationComponent,
      },
      template: `
                <NFCRegistrationComponent 
                    :plugin-dir-url="pluginDirUrl"
                />
            `,
      data() {
        return {
          pluginDirUrl: kukudushiData.plugin_url,
        };
      },
    });

    // Mount the app
    app.mount('#kukudushi-nfc-registration-app');
    console.log('Kukudushi NFC Registration App initialized successfully');
  } else {
    console.error('Cannot initialize Kukudushi NFC Registration App:', {
      appRootExists: !!appRoot,
      vueExists: !!window.Vue,
    });
  }
});
