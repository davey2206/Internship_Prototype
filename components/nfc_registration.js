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
      isScanning: false,
      countdown: 0,
      lastScan: null,
      successMessage: '',
      errorMessage: '',
      models: [],
      selectedModel: '',
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
  },
  template: `
        <div class="nfc-registration-container">
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
                        <select v-model="selectedModel">
                            <option value="">Select a model</option>
                            <option v-for="model in models" :key="model.model_id" :value="model.model_id">
                                {{ model.model_name }}
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
    `,
  mounted() {
    this.fetchModels();
    this.logToWP('NFC Registration component mounted', 'info');

    // Initialize success audio
    this.successAudio = new Audio(
      this.pluginDirUrl + 'media/audio/kukudushi-programmed-success.mp3'
    );

    // Setup listener for NDEFReader scans
    this.setupNFCReader();
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

        const existsInDatabase = await this.checkIfUIDExistsInDatabase(
          uidToUse
        );

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
          const registerSuccess = await this.registerKukudushi(uidToUse);

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
        const registerSuccess = await this.registerKukudushi(cleanUID);

        if (!registerSuccess) {
          throw new Error('Failed to register tag in database');
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

        if (!dbResponse.ok) {
          throw new Error(`Database check failed: ${dbResponse.status}`);
        }

        const dbData = await dbResponse.json();
        this.logToWP('Database response received', 'info', { dbData });

        return dbData.exists === true;
      } catch (error) {
        this.logToWP('Error checking UID in database', 'error', {
          error: error.message,
        });
        throw error;
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
  },
};
