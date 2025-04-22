import ManagerComponent from './manager.js';

document.addEventListener('DOMContentLoaded', function () {
  // Check if mount point exists
  const managerRoot = document.getElementById('kukudushi-manager-root');
  if (managerRoot && window.Vue) {
    const app = Vue.createApp({
      components: {
        ManagerComponent,
      },
      template: `
          <ManagerComponent
              v-if="shouldShowManager"
              :plugin-dir-url="pluginDirUrl"
              :kukudushi="kukudushi"
              :username="username"
              @close="closeManager"
          />
      `,
      data() {
        return {
          shouldShowManager: false,
          pluginDirUrl: window.managerData.plugin_url,
          kukudushi: null,
          username: window.managerData.current_user,
        };
      },
      methods: {
        showManager(kukudushi) {
          this.kukudushi = kukudushi;

          console.log('Preselect kukudushi manager-init');
          console.log(this.kukudushi);

          this.shouldShowManager = true;
        },
        closeManager() {
          this.shouldShowManager = false;
          this.kukudushi = null;
        },
      },
    });

    // Mount the app
    const mountedApp = app.mount('#kukudushi-manager-root');

    // Make the manager instance globally available
    window.ManagerComponent = {
      show: (kukudushi) => mountedApp.showManager(kukudushi),
      close: () => mountedApp.closeManager(),
    };

    console.log('Kukudushi Manager initialized successfully');
  } else {
    console.error('Cannot initialize Kukudushi Manager:', {
      managerRootExists: !!managerRoot,
      vueExists: !!window.Vue,
    });
  }
});
