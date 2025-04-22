import { MarkerManager } from './marker_manager.js';
import { generateImageryViewModels } from '../../components/helper_functions.js';

const app = Vue.createApp({
  data() {
    return {
      viewer: null,
      markerManager: null,
      scans: [],
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
    };
  },
  computed: {
    totalScans() {
      return this.scans.reduce((total, scan) => {
        // If it's a cluster, add its count, otherwise count as 1
        return total + (scan.count || 1);
      }, 0);
    },
    uniqueLocations() {
      const locations = new Set();
      this.scans.forEach((scan) => {
        if (scan.scans) {
          // Handle clusters
          scan.scans.forEach((s) => {
            if (s.geo_latitude && s.geo_longitude) {
              locations.add(`${s.geo_latitude},${s.geo_longitude}`);
            }
          });
        } else {
          // Handle individual scans
          if (scan.geo_latitude && scan.geo_longitude) {
            locations.add(`${scan.geo_latitude},${scan.geo_longitude}`);
          }
        }
      });
      return locations.size;
    },
    mostActiveCountry() {
      const countryCount = {};
      this.scans.forEach((scan) => {
        if (scan.scans) {
          // Handle clusters
          scan.scans.forEach((s) => {
            if (s.geo_country) {
              countryCount[s.geo_country] =
                (countryCount[s.geo_country] || 0) + 1;
            }
          });
        } else {
          // Handle individual scans
          if (scan.geo_country) {
            countryCount[scan.geo_country] =
              (countryCount[scan.geo_country] || 0) + 1;
          }
        }
      });
      const sortedCountries = Object.entries(countryCount).sort(
        (a, b) => b[1] - a[1]
      );
      return sortedCountries.length > 0 ? sortedCountries[0][0] : 'N/A';
    },
  },
  methods: {
    async fetchData(forceUpdate = false) {
      try {
        if (!this.dateRange.from || !this.dateRange.to) {
          console.error('Date range not properly initialized');
          return;
        }

        const response = await fetch('./backend/get_scan_data.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.dateRange.from,
            to: this.dateRange.to,
          }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        this.scans = data.data;
        if (
          this.markerManager &&
          (forceUpdate || !this.markerManager.lastDateRange)
        ) {
          await this.markerManager.updateMarkers(this.dateRange);
        }
      } catch (error) {
        console.error('Error fetching scan data:', error);
      }
    },
    async initCesium() {
      console.log('Initializing Cesium...');
      try {
        // Generate imagery view models
        const imageryViewModels = generateImageryViewModels();

        // Initialize the Cesium viewer
        this.viewer = new Cesium.Viewer('cesiumContainer', {
          imageryProviderViewModels: imageryViewModels,
          selectedImageryProviderViewModel: imageryViewModels[0],
          animation: false,
          timeline: false,
          infoBox: true,
          homeButton: false,
          fullscreenButton: true,
          sceneModePicker: false,
          geocoder: false,
          navigationInstructionsInitiallyVisible: false,
        });

        // Initialize marker manager
        this.markerManager = new MarkerManager(this.viewer);

        // After initialization is complete, fetch data
        await this.fetchData();

        // Remove camera's north/south pole restriction
        this.viewer.scene.camera.constrainedAxis = undefined;

        // Set up other viewer configurations...
        this.setupViewerConfig();

        // Set up camera movement handler for clustering
        this.setupCameraHandler();

        console.log('Cesium initialization complete');
      } catch (error) {
        console.error('Error initializing Cesium:', error);
      }
    },

    setupViewerConfig() {
      // Remove the default cesium terrain providers
      this.viewer.baseLayerPicker.viewModel.terrainProviderViewModels.removeAll();

      // Remove the cesium logo
      this.viewer._cesiumWidget._creditContainer.parentNode.removeChild(
        this.viewer._cesiumWidget._creditContainer
      );

      // Adjust the zooming speed
      this.viewer.scene.screenSpaceCameraController._zoomFactor = 10.0;
      this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 45000000.0;

      // Set scene properties
      this.viewer.scene.globe.baseColor = Cesium.Color.BLACK;
      this.viewer.scene.backgroundColor = Cesium.Color.BLACK;
    },

    setupCameraHandler() {
      let cameraMoveEndHandler = _.debounce(() => {
        if (this.markerManager) {
          // Change this line from updateClusters to updateMarkers
          this.markerManager.updateMarkers(this.dateRange);
        }
      }, 250);

      this.viewer.camera.changed.addEventListener(cameraMoveEndHandler);
    },

    updateVisualization() {
      if (this.markerManager) {
        this.markerManager.updateMarkers(this.dateRange);
      }
    },
  },
  mounted() {
    console.log('Component mounted');
    this.initCesium();
  },
});

// Enable Vue DevTools
//app.config.devtools = true;
//app.config.performance = true;

app.mount('#app');
