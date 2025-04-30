// File: components/nfc_registration.js

export default {
  name: 'NFCRegistrationComponent',
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      activeTab: 'nfc-registration', // Default active tab
      isScanning: false,
      countdown: 0,
      lastScan: null,
      successMessage: '',
      errorMessage: '',
      models: [],
      mainModels: [],
      maestros: [],
      selectedModel: '',
      selectedMaestroId: '', // For NFC Registration tab
      initialPoints: 1500,
      pointsDescription: 'Starting points to choose your first animal. Enjoy!',
      registrationCount: 0, // Counter for registered kukudushis
      registrationHistory: [], // History of registrations in current session
      showAdvancedSettings: false,
      successAudio: null, // Audio element for success sound
      lastProcessedUID: null,
      lastProcessedTime: 0,
      processingCooldown: false,
      processingTag: false, // Flag to indicate we're currently processing a tag
      scanQueue: {},
      registeredUIDs: new Set(),
      processedUIDs: new Set(),
      debugEnabled: true, // Control debug logging
      pendingTagAnalysis: false, // Flag to track if we're waiting for tag analysis

      // Model & Maestro management data
      newMainModel: { name: '' },
      newModel: { name: '', mainModelId: '' },
      newMaestro: { name: '' },
      selectedMainModel: null,
      selectedModelToEdit: null,
      selectedMaestro: null,
      editMode: {
        mainModel: false,
        model: false,
        maestro: false,
      },
      loading: {
        mainModels: false,
        models: false,
        maestros: false,
      },
    };
  },
  computed: {
    canStartScan() {
      return this.selectedModel && !this.isScanning;
    },
    canStopScan() {
      return this.isScanning;
    },
    countdownDisplay() {
      if (this.countdown <= 0) return '';
      return `Next scan in ${this.countdown} seconds...`;
    },
    lastScanDisplay() {
      if (!this.lastScan) return '';
      const date = new Date(this.lastScan);
      return date.toLocaleTimeString();
    },
    formattedPoints() {
      return this.initialPoints.toLocaleString();
    },
    activeModels() {
      return this.models.filter((model) => model.is_active);
    },

    // Filter out inactive maestros for the NFC Registration dropdown
    activeMaestros() {
      return this.maestros.filter((maestro) => maestro.is_active);
    },
  },
  watch: {
    successMessage(newVal) {
      if (newVal) {
        // Ensure visibility by forcing scroll
        this.$nextTick(() => {
          const statusElement = document.querySelector('.status-success');
          if (statusElement) {
            statusElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        });
      }
    },
    errorMessage(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          const statusElement = document.querySelector('.status-error');
          if (statusElement) {
            statusElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        });
      }
    },
    registrationHistory(newVal) {
      if (newVal.length > 0) {
        this.$nextTick(() => {
          const historyTable = document.querySelector('.history-table');
          if (historyTable) {
            historyTable.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        });
      }
    },
    activeTab(newTab) {
      if (newTab === 'models-maestros') {
        this.fetchAllData();
      }
    },
  },
  template: `
    <div class="nfc-registration-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          :class="['tab-button', { active: activeTab === 'nfc-registration' }]" 
          @click="activeTab = 'nfc-registration'"
        >
          NFC Registration
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'models-maestros' }]" 
          @click="activeTab = 'models-maestros'"
        >
          Models & Maestros
        </button>
      </div>
      
      <!-- NFC Registration Tab -->
      <div v-if="activeTab === 'nfc-registration'" class="tab-content">
        <div class="registration-header">
          <h2>Kukudushi NFC Registration</h2>
          <button @click="showAdvancedSettings = !showAdvancedSettings">
            {{ showAdvancedSettings ? 'Hide' : 'Show' }} Advanced Settings
          </button>
        </div>
        
        <div class="registration-stats">
          <h3>Registration Stats</h3>
          <div class="registration-count">{{ registrationCount }}</div>
          <div>Kukudushi's registered in this session</div>
        </div>
        
        <div class="form-section">
        <div class="form-row">
          <div class="form-label">Kukudushi Model:</div>
          <div class="form-input">
            <select v-model="selectedModel" :disabled="loading.models">
              <option value="">{{ loading.models ? 'Loading models...' : 'Select a model' }}</option>
              <option v-for="model in activeModels" :key="model.model_id" :value="model.model_id">
                {{ model.model_name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-label">Maestro:</div>
          <div class="form-input">
            <select v-model="selectedMaestroId" :disabled="loading.maestros">
              <option value="">{{ loading.maestros ? 'Loading maestros...' : 'Select a maestro (optional)' }}</option>
              <option v-for="maestro in activeMaestros" :key="maestro.id" :value="maestro.id">
                {{ maestro.name }}
              </option>
            </select>
          </div>
        </div>
          
          <div v-if="showAdvancedSettings">
            <div class="form-row">
              <div class="form-label">Initial Points:</div>
              <div class="form-input">
                <input type="number" v-model.number="initialPoints" min="0" step="100">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-label">Points Description:</div>
              <div class="form-input">
                <input type="text" v-model="pointsDescription">
              </div>
            </div>
          </div>
        </div>
        
        <div class="scan-controls">
          <button 
            class="scan-button" 
            :class="{ 'scanning': isScanning }"
            @click="toggleScanning"
            :disabled="!selectedModel"
          >
            {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
          </button>
        </div>
        
        <div class="scan-status">
          <div class="scan-indicator" :class="isScanning ? 'active' : 'inactive'"></div>
          <div>{{ isScanning ? 'Scanning mode active' : 'Scanning inactive' }}</div>
          <div v-if="countdownDisplay" style="margin-left: 20px;">{{ countdownDisplay }}</div>
        </div>
        
        <div v-if="errorMessage" class="status-message status-error">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="status-message status-success">
          {{ successMessage }}
        </div>
        
        <div v-if="registrationHistory.length > 0" class="registration-history">
          <h3>Registration History</h3>
          <table class="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Kukudushi ID</th>
                <th>Model</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in registrationHistory" :key="index">
                <td>{{ formatTime(item.timestamp) }}</td>
                <td>{{ item.kukudushiId }}</td>
                <td>{{ getModelName(item.modelId) }}</td>
                <td>{{ item.success ? 'Success' : 'Failed' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Models & Maestros Tab -->
      <div v-if="activeTab === 'models-maestros'" class="tab-content">
        <div class="models-maestros-container">
          <h2>Models & Maestros Management</h2>
          
          <!-- Main Models Section -->
          <div class="section main-models-section">
            <h3>Main Models</h3>
            <div class="loading-indicator" v-if="loading.mainModels">Loading...</div>
            
            <div class="list-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mainModel in mainModels" :key="'main-'+mainModel.id">
                    <td>{{ mainModel.id }}</td>
                    <td>
                      <span v-if="editMode.mainModel && selectedMainModel && selectedMainModel.id === mainModel.id">
                        <input type="text" v-model="selectedMainModel.model_name" placeholder="Main Model Name" />
                      </span>
                      <span v-else>{{ mainModel.model_name }}</span>
                    </td>
                    <td>
                      <button 
                        v-if="editMode.mainModel && selectedMainModel && selectedMainModel.id === mainModel.id"
                        @click="saveMainModel"
                        class="save-button"
                      >
                        Save
                      </button>
                      <button 
                        v-else
                        @click="editMainModel(mainModel)"
                        class="edit-button"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="add-form">
              <h4>Add New Main Model</h4>
              <div class="form-row">
                <input type="text" v-model="newMainModel.name" placeholder="New Main Model Name" />
                <button @click="addMainModel" :disabled="!newMainModel.name">Add</button>
              </div>
            </div>
          </div>
          
          <!-- Models Section -->
          <div class="section models-section">
            <h3>Models</h3>
            <div class="loading-indicator" v-if="loading.models">Loading...</div>
            
            <div class="list-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Main Model</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="model in models" :key="'model-'+model.model_id">
                    <td>{{ model.model_id }}</td>
                    <td>
                      <span v-if="editMode.model && selectedModelToEdit && selectedModelToEdit.model_id === model.model_id">
                        <input type="text" v-model="selectedModelToEdit.model_name" placeholder="Model Name" />
                      </span>
                      <span v-else>{{ model.model_name }}</span>
                    </td>
                    <td>
                      <span v-if="editMode.model && selectedModelToEdit && selectedModelToEdit.model_id === model.model_id">
                        <select v-model="selectedModelToEdit.main_model">
                          <option v-for="mainModel in mainModels" :key="mainModel.id" :value="mainModel.id">
                            {{ mainModel.model_name }}
                          </option>
                        </select>
                      </span>
                      <span v-else>{{ getMainModelName(model.main_model) }}</span>
                    </td>
                    <td>
                      <span :class="model.is_active ? 'status-active' : 'status-inactive'">
                        {{ model.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button 
                        v-if="editMode.model && selectedModelToEdit && selectedModelToEdit.model_id === model.model_id"
                        @click="saveModel"
                        class="save-button"
                      >
                        Save
                      </button>
                      <button 
                        v-else
                        @click="editModel(model)"
                        class="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        @click="toggleModelStatus(model)"
                        :class="model.is_active ? 'deactivate-button' : 'activate-button'"
                      >
                        {{ model.is_active ? 'Deactivate' : 'Activate' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="add-form">
              <h4>Add New Model</h4>
              <div class="form-row">
                <input type="text" v-model="newModel.name" placeholder="New Model Name" />
                <select v-model="newModel.mainModelId">
                  <option value="">Select Main Model</option>
                  <option v-for="mainModel in mainModels" :key="mainModel.id" :value="mainModel.id">
                    {{ mainModel.model_name }}
                  </option>
                </select>
                <button @click="addModel" :disabled="!newModel.name || !newModel.mainModelId">Add</button>
              </div>
            </div>
          </div>
          
          <!-- Maestros Section -->
          <div class="section maestros-section">
            <h3>Maestros</h3>
            <div class="loading-indicator" v-if="loading.maestros">Loading...</div>
            
            <div class="list-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="maestro in maestros" :key="'maestro-'+maestro.id">
                    <td>{{ maestro.id }}</td>
                    <td>
                      <span v-if="editMode.maestro && selectedMaestro && selectedMaestro.id === maestro.id">
                        <input type="text" v-model="selectedMaestro.name" placeholder="Maestro Name" />
                      </span>
                      <span v-else>{{ maestro.name }}</span>
                    </td>
                    <td>
                      <span :class="maestro.is_active ? 'status-active' : 'status-inactive'">
                        {{ maestro.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button 
                        v-if="editMode.maestro && selectedMaestro && selectedMaestro.id === maestro.id"
                        @click="saveMaestro"
                        class="save-button"
                      >
                        Save
                      </button>
                      <button 
                        v-else
                        @click="editMaestro(maestro)"
                        class="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        @click="toggleMaestroStatus(maestro)"
                        :class="maestro.is_active ? 'deactivate-button' : 'activate-button'"
                      >
                        {{ maestro.is_active ? 'Deactivate' : 'Activate' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="add-form">
              <h4>Add New Maestro</h4>
              <div class="form-row">
                <input type="text" v-model="newMaestro.name" placeholder="New Maestro Name" />
                <button @click="addMaestro" :disabled="!newMaestro.name">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  mounted() {
    // First, load main models and normal models in parallel
    Promise.all([
      this.fetchModels(),
      this.fetchMainModels(),
      this.fetchMaestros(), // Add this to load maestros on initial load
    ])
      .then(() => {
        // Initialize success audio
        this.successAudio = new Audio(
          this.pluginDirUrl + 'media/audio/kukudushi-programmed-success.mp3'
        );

        // Setup listener for NDEFReader scans
        this.setupNFCReader();

        this.logToWP('Initial data loading completed', 'info', {
          modelsCount: this.models.length,
          mainModelsCount: this.mainModels.length,
          maestrosCount: this.maestros.length,
        });
      })
      .catch((error) => {
        this.logToWP('Error loading initial data', 'error', {
          error: error.message,
        });
        this.errorMessage = `Error initializing: ${error.message}`;
      });
  },
  beforeUnmount() {
    this.stopScanning();
    this.logToWP('NFC Registration component unmounting', 'info');
  },
  methods: {
    // Debug logging helper that sends to WordPress debug.log
    async logToWP(message, level = 'debug', context = {}) {
      if (!this.debugEnabled) return;

      // Also log to console for immediate feedback
      if (level === 'error') {
        console.error(message, context);
      } else {
        console.log(message, context);
      }

      try {
        // Send log to WordPress backend endpoint
        await fetch(`${this.pluginDirUrl}backend/log_to_debug.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            level,
            context: JSON.stringify(context),
            source: 'nfc_registration.js',
          }),
        });
      } catch (error) {
        // Fallback to console if logging fails
        console.error('Error sending log to WordPress:', error);
      }
    },

    async fetchModels() {
      try {
        this.logToWP('Fetching Kukudushi models');
        const response = await fetch(
          `${this.pluginDirUrl}backend/get_models.php`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          this.models = data;
          this.logToWP('Models fetched successfully', 'info', {
            count: data.length,
          });
        }
      } catch (error) {
        this.logToWP('Error fetching models', 'error', {
          error: error.message,
        });
        this.errorMessage = 'Failed to load model data';
      }
    },

    setupNFCReader() {
      if ('NDEFReader' in window) {
        this.logToWP('Web NFC is supported!', 'info');
      } else {
        this.errorMessage =
          'Web NFC is not supported in this browser. Please use Chrome on Android.';
        this.logToWP('Web NFC is not supported in this browser', 'error');
      }
    },

    toggleScanning() {
      if (this.isScanning) {
        this.stopScanning();
      } else {
        this.startScanning();
      }
    },

    async startScanning() {
      if (!this.selectedModel) {
        this.errorMessage = 'Please select a model first';
        return;
      }

      // Clean up previous scan state
      this.stopScanning();

      // Reset all debouncing mechanisms
      this.processingTag = false;
      this.pendingTagAnalysis = false;
      this.scanQueue = {};
      this.registeredUIDs = new Set();
      this.processedUIDs = new Set();

      this.isScanning = true;
      this.errorMessage = '';
      this.successMessage =
        'Scanning started. Bring NFC tag close to the device.';
      this.$forceUpdate(); // Force UI update

      try {
        // Create a new reader
        this.ndefReader = new NDEFReader();
        this.logToWP('New NFC reader created', 'info');

        // Start scanning
        await this.ndefReader.scan();
        this.logToWP('NFC scan started successfully', 'info');

        // Define handler functions
        const readingHandler = async (event) => {
          const { serialNumber, message } = event;

          // Prevent multiple rapid calls
          if (this.processingTag || this.pendingTagAnalysis) {
            this.logToWP('Tag read ignored - already processing a tag', 'info');
            return;
          }

          // Set pending flag to prevent duplicate processing
          this.pendingTagAnalysis = true;
          this.$forceUpdate(); // Force UI update

          try {
            this.logToWP(`NFC tag detected`, 'info', { serialNumber });

            // Clean the serialNumber
            const cleanUID = serialNumber.replace(/:/g, '');

            // First, analyze the tag content
            const tagInfo = await this.analyzeTagContentsFromEvent(event);
            this.logToWP('Tag content analysis results', 'info', {
              cleanUID,
              tagInfo,
            });

            // Now process the tag with the content information
            await this.processTagWithContent(cleanUID, tagInfo);

            // Force UI update after processing is complete
            this.$forceUpdate();
          } catch (error) {
            this.logToWP('Error during tag read handler', 'error', {
              error: error?.message || 'Unknown error',
            });
            this.errorMessage = `Error processing tag: ${
              error?.message || 'Unknown error'
            }`;

            // Ensure error message updates in UI
            this.$forceUpdate();
          } finally {
            // Add a longer delay before resetting the pending flag
            setTimeout(() => {
              this.pendingTagAnalysis = false;
              this.$forceUpdate();
            }, 1000); // Increased to 1 second
          }
        };

        const errorHandler = (error) => {
          this.logToWP('NFC read error', 'error', { error: error.message });
          this.errorMessage = `NFC read error: ${error.message}`;
          this.$forceUpdate(); // Force UI update
        };

        // Add event listeners
        this.ndefReader.addEventListener('reading', readingHandler);
        this.ndefReader.addEventListener('readingerror', errorHandler);

        // Store references to handlers for later removal
        this.currentHandlers = {
          reading: readingHandler,
          error: errorHandler,
        };

        this.logToWP('Event listeners added to NFC reader', 'info');
      } catch (error) {
        this.isScanning = false;
        this.errorMessage = `Error starting NFC scan: ${error.message}`;
        this.logToWP('Error starting NFC scan', 'error', {
          error: error.message,
        });
        this.$forceUpdate(); // Force UI update
      }
    },

    stopScanning() {
      this.logToWP('Stopping NFC scanning...', 'info');

      if (this.ndefReader && this.currentHandlers) {
        try {
          // Remove our specific event listeners
          if (this.currentHandlers.reading) {
            this.ndefReader.removeEventListener(
              'reading',
              this.currentHandlers.reading
            );
          }
          if (this.currentHandlers.error) {
            this.ndefReader.removeEventListener(
              'readingerror',
              this.currentHandlers.error
            );
          }
          this.logToWP('Event listeners removed', 'info');
        } catch (e) {
          this.logToWP('Error removing event listeners', 'error', {
            error: e.message,
          });
        }
      }

      // Clear references
      this.ndefReader = null;
      this.currentHandlers = null;

      // Reset state
      this.isScanning = false;
      this.processingTag = false;
      this.pendingTagAnalysis = false;
      this.countdown = 0;
      this.successMessage = '';
      this.errorMessage = '';

      this.logToWP('NFC scanning stopped', 'info');
    },

    async scanForNFC() {
      if (!this.isScanning) return;

      try {
        if ('NDEFReader' in window) {
          this.ndefReader = new NDEFReader();

          await this.ndefReader.scan();
          this.logToWP('NFC scan started', 'info');

          this.ndefReader.addEventListener('reading', ({ serialNumber }) => {
            this.logToWP('NFC reading event triggered', 'info', {
              serialNumber,
            });
            this.handleNFCRead(serialNumber);
          });

          this.ndefReader.addEventListener('error', (error) => {
            this.errorMessage = `Error: ${error.message}`;
            this.logToWP('NFC read error', 'error', { error: error.message });
          });
        } else {
          // For testing on non-supporting browsers
          this.simulateNFCScan();
        }
      } catch (error) {
        this.errorMessage = `Error starting NFC scan: ${error.message}`;
        this.logToWP('Error starting NFC scan', 'error', {
          error: error.message,
        });
        this.isScanning = false;
      }
    },

    // Analyze tag contents from an NDEF reading event
    async analyzeTagContentsFromEvent(event) {
      const { message } = event;

      const result = {
        hasKukudushiURL: false,
        extractedUID: null,
        allRecords: [],
      };

      if (!message || !message.records) {
        this.logToWP('No message or records in tag', 'info');
        return result;
      }

      try {
        this.logToWP('Analyzing tag contents', 'info', {
          recordCount: message.records.length,
        });

        for (const record of message.records) {
          let recordData = null;
          const recordType = record.recordType || 'unknown';

          try {
            if (typeof record.data === 'string') {
              recordData = record.data;
            } else if (record.data instanceof ArrayBuffer) {
              recordData = new TextDecoder().decode(record.data);
            }

            if (recordData) {
              this.logToWP('Found record data', 'info', {
                recordType,
                recordData: recordData.substring(0, 100), // Limit log size
              });

              result.allRecords.push({
                type: recordType,
                data: recordData,
              });

              if (recordData.includes('kukudushi.com')) {
                result.hasKukudushiURL = true;
                this.logToWP('Found Kukudushi URL in tag', 'info', {
                  recordData,
                });

                // Extract UID from URL
                const uidMatch = recordData.match(/[?&]uid=([^&]+)/);
                if (uidMatch && uidMatch[1]) {
                  result.extractedUID = uidMatch[1];
                  this.logToWP('Extracted UID from tag URL', 'info', {
                    uid: result.extractedUID,
                  });
                }
              }
            }
          } catch (e) {
            this.logToWP('Error decoding record data', 'error', {
              error: e.message,
            });
          }
        }
      } catch (error) {
        this.logToWP('Error analyzing tag contents', 'error', {
          error: error.message,
        });
      }

      return result;
    },

    // Main tag processing method with content information
    async processTagWithContent(cleanUID, tagInfo) {
      // Add debug line to track method entry
      this.logToWP('Starting processTagWithContent', 'info', {
        cleanUID,
        pendingTagAnalysis: this.pendingTagAnalysis,
        processingTag: this.processingTag,
        tagInfo,
      });

      if (this.processingTag) {
        this.logToWP('Already processing a tag, ignoring', 'info');
        return;
      }

      // Set the processing flag
      this.processingTag = true;
      this.lastScan = new Date();

      // Update UI immediately to show we're processing
      this.successMessage = 'Processing tag...';
      this.$forceUpdate();

      try {
        // Add a small delay to ensure the UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if already processed in this session
        if (this.processedUIDs.has(cleanUID)) {
          this.logToWP(`UID was already processed in this session`, 'info', {
            cleanUID,
          });
          this.successMessage = `Tag with UID: ${cleanUID} is already registered`;
          this.$forceUpdate(); // Force UI update
          return;
        }

        // Check if UID exists in our history for this session
        const alreadyInHistory = this.registrationHistory.some(
          (entry) => entry.kukudushiId === cleanUID
        );
        if (alreadyInHistory) {
          this.logToWP(`UID already in local history`, 'info', { cleanUID });
          this.successMessage = `Tag with UID: ${cleanUID} is already registered`;
          this.processedUIDs.add(cleanUID);
          this.$forceUpdate(); // Force UI update
          return;
        }

        // Get the UID we should use - either from the tag URL or the tag itself
        const uidToUse =
          tagInfo.hasKukudushiURL && tagInfo.extractedUID
            ? tagInfo.extractedUID
            : cleanUID;

        // Check if the UID exists in the database
        this.logToWP('Checking database for UID', 'info', { uidToUse });
        this.successMessage = `Checking if tag is registered...`;
        this.$forceUpdate();

        let existsInDatabase = false;
        try {
          existsInDatabase = await this.checkIfUIDExistsInDatabase(uidToUse);
        } catch (dbError) {
          this.logToWP('Error checking database', 'error', {
            error: dbError.message,
          });
          // Continue with existsInDatabase = false
        }

        if (existsInDatabase) {
          // Already registered in database
          this.logToWP(`UID exists in database`, 'info', { uidToUse });
          this.successMessage = `Tag with UID: ${uidToUse} is already registered`;
          this.processedUIDs.add(uidToUse);

          // Add to history
          this.registrationHistory.unshift({
            timestamp: new Date(),
            kukudushiId: uidToUse,
            modelId: this.selectedModel,
            success: true,
            note: 'Already in database',
          });

          this.$forceUpdate(); // Force UI update
          return;
        }

        // Handle tag with Kukudushi URL but not in database
        if (tagInfo.hasKukudushiURL) {
          this.logToWP(`Tag has Kukudushi URL but not in database`, 'info', {
            uidToUse,
            extractedUID: tagInfo.extractedUID,
          });

          // Set success message BEFORE registration to ensure UI update
          this.successMessage = `Registering tag with Kukudushi URL (UID: ${uidToUse})...`;
          this.$forceUpdate(); // Force UI update

          // Add a small delay to ensure the UI updates
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Register in database
          let registerSuccess = false;
          try {
            registerSuccess = await this.registerKukudushi(uidToUse);
          } catch (regError) {
            this.logToWP('Error registering Kukudushi', 'error', {
              error: regError.message,
            });
            this.errorMessage = `Error registering tag: ${regError.message}`;
            this.$forceUpdate();
            // Don't rethrow, continue with registerSuccess = false
          }

          if (registerSuccess) {
            this.successMessage = `Tag with Kukudushi URL registered (UID: ${uidToUse})`;
            this.registrationCount++;

            // Add to history
            this.registrationHistory.unshift({
              timestamp: new Date(),
              kukudushiId: uidToUse,
              modelId: this.selectedModel,
              success: true,
              note: 'Registered existing Kukudushi URL',
            });

            // Add to processed set
            this.processedUIDs.add(uidToUse);

            // Play success sound
            this.playSuccessSound();

            this.$forceUpdate(); // Force UI update
          } else {
            this.errorMessage = 'Failed to register tag - please try again';
            this.$forceUpdate();
          }

          return;
        }

        // Fresh tag - Register and write URL
        this.logToWP(`Fresh tag - registering and writing URL`, 'info', {
          cleanUID,
        });

        // Set initial success message to show activity
        this.successMessage = `Registering tag: ${cleanUID}...`;
        this.$forceUpdate(); // Force UI update

        // Add a small delay to ensure the UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // First register in database
        let registerSuccess = false;
        try {
          registerSuccess = await this.registerKukudushi(cleanUID);

          if (!registerSuccess) {
            throw new Error('Failed to register tag in database');
          }
        } catch (regError) {
          this.logToWP('Error registering tag in database', 'error', {
            error: regError.message,
          });
          this.errorMessage = `Error registering tag: ${regError.message}`;
          this.$forceUpdate();
          throw regError; // Rethrow to stop processing
        }

        // Update success message after DB registration
        this.successMessage = `Successfully registered tag: ${cleanUID}`;
        this.$forceUpdate(); // Force UI update

        // Add a small delay to ensure the UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Add to processed IDs and history immediately after registration
        this.processedUIDs.add(cleanUID);

        // Add to history right after registration
        this.registrationHistory.unshift({
          timestamp: new Date(),
          kukudushiId: cleanUID,
          modelId: this.selectedModel,
          success: true,
          note: 'New registration',
        });

        this.$forceUpdate(); // Force UI update again

        // Add to registration count
        this.registrationCount++;

        // Play success sound
        this.playSuccessSound();

        // Then try to write URL to tag
        let writeSuccess = false;
        const url = `https://kukudushi.com/?uid=${cleanUID}`;

        try {
          this.logToWP('Writing URL to tag', 'info', { url });
          this.successMessage = `Registered tag, now writing URL...`;
          this.$forceUpdate(); // Force UI update

          // Add a small delay to ensure the UI updates
          await new Promise((resolve) => setTimeout(resolve, 100));

          writeSuccess = await this.writeUrlToTag(url);

          // Update history entry with write status
          if (this.registrationHistory.length > 0) {
            this.registrationHistory[0].note = writeSuccess
              ? 'New registration with URL'
              : 'New registration without URL';
            this.$forceUpdate();
          }
        } catch (writeError) {
          this.logToWP('Error writing URL to tag', 'error', {
            error: writeError?.message || 'Unknown error',
          });
          writeSuccess = false;

          // Update message for write error
          this.successMessage = `Successfully registered tag: ${cleanUID} (but could not write URL: ${
            writeError?.message || 'Unknown error'
          })`;
          this.$forceUpdate();
        }

        // Final status update
        if (writeSuccess) {
          this.successMessage = `Successfully registered and wrote URL to tag: ${cleanUID}`;
          this.$forceUpdate();
        }
      } catch (error) {
        this.errorMessage = `Error: ${error?.message || 'Unknown error'}`;
        this.logToWP('Error processing tag', 'error', {
          cleanUID,
          error: error?.message || 'Unknown error',
        });

        // Add failed registration to history
        this.registrationHistory.unshift({
          timestamp: new Date(),
          kukudushiId: cleanUID,
          modelId: this.selectedModel,
          success: false,
          note: `Error: ${error?.message || 'Unknown error'}`,
        });

        this.$forceUpdate(); // Force UI update
      } finally {
        // Add a delay before releasing the processing flag
        setTimeout(() => {
          this.processingTag = false;
          this.$forceUpdate();
        }, 500);
      }
    },

    // For testing purposes only
    simulateNFCScan() {
      this.logToWP('Simulating NFC scan (for testing only)', 'info');

      // Generate a random NFC ID for testing
      const randomId = Math.random()
        .toString(36)
        .substring(2, 12)
        .toUpperCase();

      setTimeout(() => {
        if (this.isScanning) {
          const simulatedEvent = {
            serialNumber: randomId,
            message: {
              records: [
                {
                  recordType: 'url',
                  data: `https://kukudushi.com/?uid=${randomId}`,
                },
              ],
            },
          };

          this.processTagWithContent(randomId, {
            hasKukudushiURL: true,
            extractedUID: randomId,
            allRecords: [
              { type: 'url', data: `https://kukudushi.com/?uid=${randomId}` },
            ],
          });
        }
      }, 3000);
    },

    // This is the original handleNFCRead method that we're replacing with our improved flow
    async handleNFCRead(serialNumber, event) {
      if (!this.isScanning || this.processingTag) {
        return;
      }

      // Clean the serialNumber by removing colons
      const cleanUID = serialNumber.replace(/:/g, '');
      this.logToWP(`NFC tag read with UID`, 'info', { cleanUID });

      // Set the processing flag immediately
      this.processingTag = true;
      this.lastScan = new Date();

      try {
        // STRICT APPROACH: First check our client-side registry
        if (this.processedUIDs.has(cleanUID)) {
          this.logToWP(`UID was already processed in this session`, 'info', {
            cleanUID,
          });
          this.successMessage = `Tag with UID: ${cleanUID} is already registered`;
          this.processingTag = false;
          return;
        }

        // Check if this UID is already in the history table
        const alreadyInHistory = this.registrationHistory.some(
          (entry) => entry.kukudushiId === cleanUID
        );
        if (alreadyInHistory) {
          this.logToWP(
            `UID is already in history table, won't add again`,
            'info',
            { cleanUID }
          );
          this.successMessage = `Tag with UID: ${cleanUID} is already registered`;

          // Mark as processed to prevent future processing
          this.processedUIDs.add(cleanUID);
          this.processingTag = false;
          return;
        }

        // Mark this UID as processed
        this.processedUIDs.add(cleanUID);
        this.logToWP(`Added UID to processed UIDs registry`, 'info', {
          cleanUID,
        });

        // Now check if UID exists in database
        this.logToWP('Checking if UID exists in database', 'info', {
          cleanUID,
        });

        const dbResponse = await fetch(
          `${
            this.pluginDirUrl
          }backend/check_kukudushi_exists.php?uid=${cleanUID}&t=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
          }
        );

        if (!dbResponse.ok) {
          throw new Error(`Database check failed: ${dbResponse.status}`);
        }

        const dbData = await dbResponse.json();
        this.logToWP('Database response received', 'info', { dbData });

        // Check for existing tag with Kukudushi data
        let foundExistingUrl = false;

        try {
          // Try to read the tag content before writing
          const readPromise = new Promise((resolve) => {
            const readHandler = (event) => {
              const { message } = event;
              let urlFound = false;

              if (message && message.records) {
                for (const record of message.records) {
                  if (
                    record.recordType === 'url' ||
                    record.recordType === 'text'
                  ) {
                    let recordData = '';
                    try {
                      if (typeof record.data === 'string') {
                        recordData = record.data;
                      } else if (record.data instanceof ArrayBuffer) {
                        recordData = new TextDecoder().decode(record.data);
                      }

                      if (recordData.includes('kukudushi.com')) {
                        urlFound = true;
                        this.logToWP('Found existing Kukudushi URL', 'info', {
                          recordData,
                        });
                      }
                    } catch (e) {
                      this.logToWP('Error decoding record data', 'error', {
                        error: e.message,
                      });
                    }
                  }
                }
              }

              resolve(urlFound);
              this.ndefReader.removeEventListener('reading', readHandler);
            };

            this.ndefReader.addEventListener('reading', readHandler);

            // Timeout the read operation
            setTimeout(() => {
              this.ndefReader.removeEventListener('reading', readHandler);
              resolve(false);
            }, 500);
          });

          foundExistingUrl = await readPromise;
        } catch (readError) {
          this.logToWP('Error reading tag', 'error', {
            error: readError.message,
          });
        }

        if (dbData.exists === true) {
          this.logToWP(`UID ${cleanUID} already exists in database`, 'info');
          this.successMessage = `Tag with UID: ${cleanUID} is already registered`;

          // Add to history table if not already there
          if (!alreadyInHistory) {
            this.registrationHistory.unshift({
              timestamp: new Date(),
              kukudushiId: cleanUID,
              modelId: this.selectedModel,
              success: true,
              note: 'Already in database',
            });
          }

          this.processingTag = false;
          return;
        }

        // Register in database
        this.logToWP(
          `UID ${cleanUID} not found in database, registering...`,
          'info'
        );
        await this.registerKukudushi(cleanUID);

        // Try to write URL to tag (only if we didn't find an existing URL)
        let writeSuccess = false;

        if (foundExistingUrl) {
          this.logToWP('Tag already has Kukudushi URL, skipping write', 'info');
          writeSuccess = true;
        } else {
          const url = `https://kukudushi.com/?uid=${cleanUID}`;
          this.logToWP('Attempting to write URL', 'info', { url });

          try {
            await this.ndefReader.write({
              records: [{ recordType: 'url', data: url }],
            });
            writeSuccess = true;
            this.logToWP('Write successful', 'info');
          } catch (writeError) {
            this.logToWP('Error writing to tag', 'error', {
              error: writeError.message,
            });
            writeSuccess = false;
          }
        }

        // Set appropriate success message
        if (foundExistingUrl) {
          this.successMessage = `URL already found with UID: ${cleanUID}, registered in database`;
        } else {
          this.successMessage = writeSuccess
            ? `Successfully registered and wrote URL to tag: ${cleanUID}`
            : `Successfully registered tag: ${cleanUID} (but could not write URL)`;
        }

        // Update registration count
        this.registrationCount++;

        // Add to history table (only if not already there)
        if (!alreadyInHistory) {
          this.logToWP(`Adding UID ${cleanUID} to history table`, 'info');
          this.registrationHistory.unshift({
            timestamp: new Date(),
            kukudushiId: cleanUID,
            modelId: this.selectedModel,
            success: true,
          });
        }

        // Play success sound
        this.playSuccessSound();
      } catch (error) {
        this.errorMessage = `Error: ${error.message}`;
        this.logToWP('Error handling NFC tag', 'error', {
          error: error.message,
        });
      } finally {
        this.processingTag = false;
      }
    },

    async checkForExistingKukudushiData(serialNumber) {
      try {
        const reader = this.ndefReader; // Use the existing reader

        return new Promise((resolve) => {
          let resolved = false;

          reader.addEventListener('reading', (event) => {
            if (resolved) return; // Avoid multiple resolutions

            const { message } = event;
            const result = {
              found: false,
              uid: null,
            };

            if (message && message.records) {
              for (const record of message.records) {
                let recordData = '';

                try {
                  if (
                    record.recordType === 'url' ||
                    record.recordType === 'text'
                  ) {
                    if (typeof record.data === 'string') {
                      recordData = record.data;
                    } else if (record.data instanceof ArrayBuffer) {
                      recordData = new TextDecoder().decode(record.data);
                    }

                    this.logToWP('Found record data', 'debug', { recordData });

                    // Check if it's a Kukudushi URL with a UID
                    if (recordData.includes('kukudushi.com')) {
                      result.found = true;

                      // Extract the UID from the URL
                      const uidMatch = recordData.match(/[?&]uid=([^&]+)/);
                      if (uidMatch && uidMatch[1]) {
                        result.uid = uidMatch[1];
                        this.logToWP('Extracted UID from tag', 'info', {
                          uid: result.uid,
                        });
                      }
                    }
                  }
                } catch (e) {
                  this.logToWP('Error processing record data', 'error', {
                    error: e.message,
                  });
                }
              }
            }

            resolved = true;
            resolve(result);
          });

          // Set a timeout in case reading doesn't trigger
          setTimeout(() => {
            if (!resolved) {
              this.logToWP('Timeout waiting for tag data', 'warn');
              resolved = true;
              resolve({ found: false, uid: null });
            }
          }, 1000);
        });
      } catch (error) {
        this.logToWP('Error checking tag data', 'error', {
          error: error.message,
        });
        return { found: false, uid: null };
      }
    },

    async inspectTag(serialNumber) {
      try {
        const reader = new NDEFReader();
        await reader.scan();

        return new Promise((resolve) => {
          reader.addEventListener('reading', ({ message }) => {
            const result = {
              hasKukudushiData: false,
              existingUID: null,
            };

            if (message && message.records) {
              for (const record of message.records) {
                if (record.recordType === 'url') {
                  let urlData;
                  try {
                    if (typeof record.data === 'string') {
                      urlData = record.data;
                    } else if (record.data instanceof ArrayBuffer) {
                      urlData = new TextDecoder().decode(record.data);
                    }

                    if (urlData && urlData.includes('kukudushi.com')) {
                      result.hasKukudushiData = true;

                      // Extract UID from URL if present
                      const uidMatch = urlData.match(/[?&]uid=([^&]+)/);
                      if (uidMatch && uidMatch[1]) {
                        result.existingUID = uidMatch[1];
                      }
                    }
                  } catch (e) {
                    this.logToWP('Error decoding tag data', 'error', {
                      error: e.message,
                    });
                  }
                }
              }
            }

            resolve(result);
            reader.stop();
          });

          // Set a timeout in case reading fails
          setTimeout(() => {
            resolve({ hasKukudushiData: false, existingUID: null });
          }, 1000);
        });
      } catch (error) {
        this.logToWP('Error inspecting tag', 'error', { error: error.message });
        return { hasKukudushiData: false, existingUID: null };
      }
    },

    async writeAndRegisterTag(uid) {
      try {
        // First write the URL to the tag
        const url = `https://kukudushi.com/?uid=${uid}`;
        await this.writeUrlToTag(url);

        // Then register in database
        await this.registerKukudushi(uid);
      } catch (error) {
        throw new Error(`Failed to write or register tag: ${error.message}`);
      }
    },

    // Helper method to check if UID exists in database
    async checkIfUIDExistsInDatabase(uid) {
      try {
        this.logToWP('Checking if UID exists in database', 'info', { uid });

        const dbResponse = await fetch(
          `${
            this.pluginDirUrl
          }backend/check_kukudushi_exists.php?uid=${uid}&t=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
          }
        );

        // First check if the response is JSON
        const contentType = dbResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          this.logToWP('Non-JSON response from database check', 'error', {
            contentType,
            status: dbResponse.status,
          });

          // Try to get the text to see what was returned
          try {
            const text = await dbResponse.text();
            this.logToWP('Response text from non-JSON response', 'error', {
              text: text.substring(0, 200), // First 200 chars for logging
            });
          } catch (textError) {
            this.logToWP('Could not get text from response', 'error', {
              error: textError.message,
            });
          }

          // Return false to indicate the UID doesn't exist rather than crashing
          return false;
        }

        if (!dbResponse.ok) {
          throw new Error(`Database check failed: ${dbResponse.status}`);
        }

        // Now we can safely parse JSON
        const dbData = await dbResponse.json();
        this.logToWP('Database response received', 'info', { dbData });

        return dbData.exists === true;
      } catch (error) {
        this.logToWP('Error checking UID in database', 'error', {
          error: error.message,
        });
        // Return false on error instead of throwing
        return false;
      }
    },

    // Method to write URL to tag
    // Method to write URL to tag
    async writeUrlToTag(url) {
      if (!this.ndefReader) {
        this.logToWP('NFC Reader not initialized', 'error');
        return false;
      }

      try {
        this.logToWP(`Writing URL to tag`, 'info', { url });

        // Update UI to show we're writing
        this.successMessage = `Writing URL to tag...`;
        this.$forceUpdate();

        // Set a timeout for the write operation in case it hangs
        const writePromise = new Promise(async (resolve, reject) => {
          try {
            await this.ndefReader.write({
              records: [{ recordType: 'url', data: url }],
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Write operation timed out'));
          }, 3000); // 3 second timeout
        });

        // Race the write operation against the timeout
        const result = await Promise.race([writePromise, timeoutPromise]);

        this.logToWP('URL write operation completed successfully', 'info');

        // Update UI again to show write was successful
        this.successMessage = `Successfully wrote URL to tag`;
        this.$forceUpdate();

        return true;
      } catch (error) {
        this.logToWP('Error writing to tag', 'error', {
          error: error?.message || 'Unknown error',
        });

        // Update UI to show write failed
        this.successMessage = `Registered tag but couldn't write URL: ${
          error?.message || 'Unknown error'
        }`;
        this.$forceUpdate();

        return false;
      }
    },

    // Method to verify existing UID in database
    async verifyExistingUID(uid) {
      // Check if UID exists in database
      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/check_kukudushi_exists.php?uid=${uid}`
        );
        const data = await response.json();

        if (data.exists) {
          this.successMessage = `Tag already registered with UID: ${uid}`;
          this.logToWP('Tag already registered', 'info', { uid });

          // Add to history
          this.registrationHistory.unshift({
            timestamp: new Date(),
            kukudushiId: uid,
            modelId: this.selectedModel,
            success: true,
            note: 'Already registered',
          });
        } else {
          // UID not in database, register it
          await this.registerKukudushi(uid);
        }
      } catch (error) {
        this.logToWP('Failed to verify UID', 'error', {
          uid,
          error: error.message,
        });
        throw new Error(`Failed to verify UID: ${error.message}`);
      }
    },

    startCountdown() {
      this.countdown = 3; // 3 seconds until next scan

      const interval = setInterval(() => {
        this.countdown--;

        if (this.countdown <= 0) {
          clearInterval(interval);
          if (this.isScanning) {
            this.successMessage = 'Ready for next scan';
          }
        }
      }, 1000);
    },

    async registerKukudushi(serialNumber) {
      try {
        const payload = {
          uid: serialNumber,
          model_id: this.selectedModel,
          points_amount: this.initialPoints,
          points_description: this.pointsDescription,
        };

        // Add maestro_id if selected
        if (this.selectedMaestroId) {
          payload.maestro_id = this.selectedMaestroId;
        }

        this.logToWP('Registering Kukudushi with backend', 'info', { payload });

        const response = await fetch(
          `${this.pluginDirUrl}backend/save_new_kukudushi.php`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          this.logToWP('Non-JSON response from registration', 'error', {
            contentType,
            status: response.status,
          });

          // Try to get the text to see what was returned
          try {
            const text = await response.text();
            this.logToWP('Response text from non-JSON response', 'error', {
              text: text.substring(0, 200), // First 200 chars for logging
            });
          } catch (textError) {
            this.logToWP('Could not get text from response', 'error', {
              error: textError.message,
            });
          }

          throw new Error('Received non-JSON response from server');
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        this.logToWP('Registration response', 'info', { result });

        if (!result.success) {
          throw new Error(result.message || 'Registration failed');
        }

        return true;
      } catch (error) {
        this.logToWP('Failed to register Kukudushi', 'error', {
          serialNumber,
          error: error.message,
        });
        throw error;
      }
    },

    playSuccessSound() {
      if (this.successAudio) {
        this.successAudio.currentTime = 0;
        this.successAudio.play().catch((error) => {
          this.logToWP('Error playing sound', 'error', {
            error: error.message,
          });
        });
      }
    },

    formatTime(date) {
      return new Date(date).toLocaleTimeString();
    },

    getModelName(modelId) {
      const model = this.models.find((m) => m.model_id === modelId);
      return model ? model.model_name : 'Unknown';
    },

    // Models & Maestros Tab Methods
    fetchAllData() {
      this.fetchMainModels();
      this.fetchModels();
      this.fetchMaestros();
    },

    async fetchMainModels() {
      this.loading.mainModels = true;
      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/get_main_models.php`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          this.mainModels = data;
          this.logToWP('Main models fetched successfully', 'info', {
            count: data.length,
          });
        }
      } catch (error) {
        this.logToWP('Error fetching main models', 'error', {
          error: error.message,
        });
        this.errorMessage = 'Failed to load main model data';
      } finally {
        this.loading.mainModels = false;
      }
    },

    async fetchMaestros() {
      this.loading.maestros = true;
      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/get_maestros.php`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          this.maestros = data;
          this.logToWP('Maestros fetched successfully', 'info', {
            count: data.length,
          });
        }
      } catch (error) {
        this.logToWP('Error fetching maestros', 'error', {
          error: error.message,
        });
        this.errorMessage = 'Failed to load maestro data';
      } finally {
        this.loading.maestros = false;
      }
    },

    getMainModelName(mainModelId) {
      // Early return if no ID provided
      if (!mainModelId) return 'Unknown';

      // Debug log to see what we're getting
      this.logToWP('Finding main model name', 'debug', {
        mainModelId,
        typeOfId: typeof mainModelId,
        mainModelsAvailable: this.mainModels.length,
        mainModels: this.mainModels,
      });

      // Convert string IDs to numbers for proper comparison
      const searchId = parseInt(mainModelId);

      // Find the main model
      const mainModel = this.mainModels.find(
        (m) => parseInt(m.id) === searchId
      );

      // Return the name or 'Unknown'
      return mainModel ? mainModel.model_name : `Unknown (ID: ${mainModelId})`;
    },

    // Main Model CRUD
    editMainModel(mainModel) {
      this.selectedMainModel = JSON.parse(JSON.stringify(mainModel));
      this.editMode.mainModel = true;
    },

    async saveMainModel() {
      if (!this.selectedMainModel) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/update_main_model.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.selectedMainModel),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'Main model updated successfully';
          this.fetchMainModels(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to update main model');
        }
      } catch (error) {
        this.errorMessage = `Error updating main model: ${error.message}`;
        this.logToWP('Error updating main model', 'error', {
          error: error.message,
        });
      } finally {
        this.editMode.mainModel = false;
        this.selectedMainModel = null;
      }
    },

    async addMainModel() {
      if (!this.newMainModel.name) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/add_main_model.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_name: this.newMainModel.name }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'New main model added successfully';
          this.newMainModel.name = ''; // Clear the input
          this.fetchMainModels(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to add main model');
        }
      } catch (error) {
        this.errorMessage = `Error adding main model: ${error.message}`;
        this.logToWP('Error adding main model', 'error', {
          error: error.message,
        });
      }
    },

    // Model CRUD
    editModel(model) {
      this.selectedModelToEdit = JSON.parse(JSON.stringify(model));
      this.editMode.model = true;
    },

    async saveModel() {
      if (!this.selectedModelToEdit) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/update_model.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.selectedModelToEdit),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'Model updated successfully';
          this.fetchModels(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to update model');
        }
      } catch (error) {
        this.errorMessage = `Error updating model: ${error.message}`;
        this.logToWP('Error updating model', 'error', { error: error.message });
      } finally {
        this.editMode.model = false;
        this.selectedModelToEdit = null;
      }
    },

    async addModel() {
      if (!this.newModel.name || !this.newModel.mainModelId) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/add_model.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model_name: this.newModel.name,
              main_model: this.newModel.mainModelId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'New model added successfully';
          this.newModel.name = '';
          this.newModel.mainModelId = '';
          this.fetchModels(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to add model');
        }
      } catch (error) {
        this.errorMessage = `Error adding model: ${error.message}`;
        this.logToWP('Error adding model', 'error', { error: error.message });
      }
    },

    // Maestro CRUD
    editMaestro(maestro) {
      this.selectedMaestro = JSON.parse(JSON.stringify(maestro));
      this.editMode.maestro = true;
    },

    async saveMaestro() {
      if (!this.selectedMaestro) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/update_maestro.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.selectedMaestro),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'Maestro updated successfully';
          this.fetchMaestros(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to update maestro');
        }
      } catch (error) {
        this.errorMessage = `Error updating maestro: ${error.message}`;
        this.logToWP('Error updating maestro', 'error', {
          error: error.message,
        });
      } finally {
        this.editMode.maestro = false;
        this.selectedMaestro = null;
      }
    },

    async addMaestro() {
      if (!this.newMaestro.name) return;

      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/add_maestro.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.newMaestro.name }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.successMessage = 'New maestro added successfully';
          this.newMaestro.name = ''; // Clear the input
          this.fetchMaestros(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to add maestro');
        }
      } catch (error) {
        this.errorMessage = `Error adding maestro: ${error.message}`;
        this.logToWP('Error adding maestro', 'error', { error: error.message });
      }
    },

    // Original NFC Registration Methods
    // Debug logging helper that sends to WordPress debug.log
    async logToWP(message, level = 'debug', context = {}) {
      if (!this.debugEnabled) return;

      // Also log to console for immediate feedback
      if (level === 'error') {
        console.error(message, context);
      } else {
        console.log(message, context);
      }

      try {
        // Send log to WordPress backend endpoint
        await fetch(`${this.pluginDirUrl}backend/log_to_debug.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            level,
            context: JSON.stringify(context),
            source: 'nfc_registration.js',
          }),
        });
      } catch (error) {
        // Fallback to console if logging fails
        console.error('Error sending log to WordPress:', error);
      }
    },

    async fetchModels() {
      this.loading.models = true;
      try {
        this.logToWP('Fetching Kukudushi models');
        const response = await fetch(
          `${this.pluginDirUrl}backend/get_models.php`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          this.models = data;
          this.logToWP('Models fetched successfully', 'info', {
            count: data.length,
          });
        }
      } catch (error) {
        this.logToWP('Error fetching models', 'error', {
          error: error.message,
        });
        this.errorMessage = 'Failed to load model data';
      } finally {
        this.loading.models = false;
      }
    },

    setupNFCReader() {
      if ('NDEFReader' in window) {
        this.logToWP('Web NFC is supported!', 'info');
      } else {
        this.errorMessage =
          'Web NFC is not supported in this browser. Please use Chrome on Android.';
        this.logToWP('Web NFC is not supported in this browser', 'error');
      }
    },

    toggleScanning() {
      if (this.isScanning) {
        this.stopScanning();
      } else {
        this.startScanning();
      }
    },

    // Include the rest of your existing NFC registration methods here...
    // (startScanning, stopScanning, analyzeTagContentsFromEvent, processTagWithContent, etc.)

    formatTime(date) {
      return new Date(date).toLocaleTimeString();
    },

    getModelName(modelId) {
      const model = this.models.find((m) => m.model_id === modelId);
      return model ? model.model_name : 'Unknown';
    },
    async toggleModelStatus(model) {
      try {
        const newStatus = !model.is_active;
        const response = await fetch(
          `${this.pluginDirUrl}backend/toggle_model_status.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model_id: model.model_id,
              is_active: newStatus,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Update local model status
          model.is_active = newStatus;
          this.successMessage = `Model ${
            newStatus ? 'activated' : 'deactivated'
          } successfully`;

          // If the currently selected model was deactivated, reset selection
          if (!newStatus && this.selectedModel === model.model_id) {
            this.selectedModel = '';
          }
        } else {
          throw new Error(result.message || 'Failed to update model status');
        }
      } catch (error) {
        this.errorMessage = `Error updating model status: ${error.message}`;
        this.logToWP('Error toggling model status', 'error', {
          error: error.message,
        });
      }
    },

    // Toggle maestro active status
    async toggleMaestroStatus(maestro) {
      try {
        const newStatus = !maestro.is_active;
        const response = await fetch(
          `${this.pluginDirUrl}backend/toggle_maestro_status.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: maestro.id,
              is_active: newStatus,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Update local maestro status
          maestro.is_active = newStatus;
          this.successMessage = `Maestro ${
            newStatus ? 'activated' : 'deactivated'
          } successfully`;

          // If the currently selected maestro was deactivated, reset selection
          if (!newStatus && this.selectedMaestroId === maestro.id) {
            this.selectedMaestroId = '';
          }
        } else {
          throw new Error(result.message || 'Failed to update maestro status');
        }
      } catch (error) {
        this.errorMessage = `Error updating maestro status: ${error.message}`;
        this.logToWP('Error toggling maestro status', 'error', {
          error: error.message,
        });
      }
    },
  },
};
