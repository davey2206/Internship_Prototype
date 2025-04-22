// New component: scan_modal.js
export default {
  name: 'ScanModal',
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
    models: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      scanning: false,
      bulkEnabled: false,
      selectedModel: '0',
      scannedTags: [],
      statusMessage: 'Ready to scan. Click "Start Scanning" to begin.',
      ndefReader: null,
      abortController: null,
    };
  },
  template: `
      <div class="scan-modal-overlay">
        <div class="scan-modal">
          <div class="scan-modal-header">
            <h3>NFC Tag Scanner</h3>
            <button class="close-modal-button" @click="closeModal">✕</button>
          </div>
          
          <div class="scan-controls">
            <button 
              :class="['scan-button', scanning ? 'scanning' : '']" 
              @click="toggleScanning">
              {{ scanning ? 'Stop Scanning' : 'Start Scanning' }}
            </button>
            
            <div class="scan-options">
              <div class="option-group">
                <input type="checkbox" id="bulk-mode" v-model="bulkEnabled">
                <label for="bulk-mode">Enable Bulk</label>
              </div>
              
              <div class="option-group">
                <label for="model-select">Model:</label>
                <select v-model="selectedModel" id="model-select" class="model-select">
                  <option value="0">Select Model...</option>
                  <option v-for="model in models" :key="model.model_id" :value="model.model_id">
                    {{ model.model_name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="scan-actions">
            <button 
                class="reset-button"
                @click="resetScanner"
                :disabled="scanning"
            >
                Reset Scanner
            </button>
            </div>

          // Add this to the template section of scan_modal.js
        <div class="debug-info" v-if="scanning">
            <div class="section-title">Debug Info:</div>
            <pre>Selected Model: {{ selectedModel }}</pre>
            <pre>Bulk Mode: {{ bulkEnabled ? 'Enabled' : 'Disabled' }}</pre>
            <pre>Scanned Tags Count: {{ scannedTags.length }}</pre>
            <pre>Last Status: {{ statusMessage }}</pre>
        </div>
          
          <div class="scan-status">
            <div class="status-message">{{ statusMessage }}</div>
          </div>
          
          <div class="scanned-tags-container">
            <table class="scanned-tags-table">
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Write Status</th>
                  <th>DB Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tag, index) in scannedTags" :key="index">
                  <td>{{ tag.uid }}</td>
                  <td>
                    <span :class="['status-indicator', tag.writeStatus]">
                      <i v-if="tag.writeStatus === 'success'" class="status-icon success">✓</i>
                      <i v-else-if="tag.writeStatus === 'error'" class="status-icon error">✗</i>
                      <span v-else-if="tag.writeStatus === 'pending'" class="status-icon pending"></span>
                    </span>
                  </td>
                  <td>
                    <span :class="['status-indicator', tag.dbStatus]">
                      <i v-if="tag.dbStatus === 'success'" class="status-icon success">✓</i>
                      <i v-else-if="tag.dbStatus === 'error'" class="status-icon error">✗</i>
                      <span v-else-if="tag.dbStatus === 'pending'" class="status-icon pending"></span>
                    </span>
                  </td>
                </tr>
                <tr v-if="scannedTags.length === 0">
                  <td colspan="3" class="empty-table">No tags scanned yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
  methods: {
    resetScanner() {
      console.log('Resetting scanner...');
      this.stopScanning();
      this.statusMessage = 'Scanner reset. Click "Start Scanning" to begin.';

      // Optional: clear the scanned tags list if you want to start fresh
      if (confirm('Do you want to clear the scanned tags list?')) {
        this.scannedTags = [];
      }
    },

    closeModal() {
      if (this.scanning) {
        this.stopScanning();
      }
      this.$emit('close');
    },

    beforeDestroy() {
      if (this.scanning) {
        this.stopScanning();
      }
    },

    toggleScanning() {
      if (this.scanning) {
        this.stopScanning();
      } else {
        this.startScanning();
      }
    },

    // In scan_modal.js
    async startScanning() {
      if (this.selectedModel === '0') {
        this.statusMessage = 'Please select a model before scanning.';
        return;
      }

      if (!('NDEFReader' in window)) {
        this.statusMessage = 'Web NFC is not supported in this browser.';
        return;
      }

      // Make sure any previous scanning session is properly cleaned up
      this.stopScanning();

      try {
        this.abortController = new AbortController();
        this.ndefReader = new NDEFReader();
        this.scanning = true;
        this.statusMessage = 'Scanning for NFC tags...';

        console.log('Initializing NFC reader...');

        // Use broader scan options to detect various tag types
        const scanOptions = {
          signal: this.abortController.signal,
        };

        console.log('Starting scan with options:', scanOptions);
        await this.ndefReader.scan(scanOptions);

        console.log('Scan started successfully, setting up event listeners');

        this.ndefReader.addEventListener('reading', (event) => {
          console.log('Reading event triggered:', event);
          const { serialNumber, message } = event;
          this.handleTagRead(serialNumber, message);
        });

        this.ndefReader.addEventListener('readingerror', (event) => {
          console.error('Read error:', event);
          this.statusMessage = 'Error reading NFC tag. Please try again.';
        });

        console.log('Event listeners set up');
      } catch (error) {
        console.error('Error starting NFC scan:', error);
        this.statusMessage = `Error: ${error.message}`;
        this.scanning = false;
      }
    },

    stopScanning() {
      console.log('Stopping scanning...');
      if (this.abortController) {
        console.log('Aborting previous scan');
        this.abortController.abort();
        this.abortController = null;
      }

      // Reset the reader to ensure it's released
      this.ndefReader = null;
      this.scanning = false;
      this.statusMessage = 'Scanning stopped.';
      console.log('Scanning stopped');
    },

    async handleTagRead(serialNumber, message) {
      try {
        console.log('Tag reading started for:', serialNumber);

        // Clean the UID by removing colons
        const cleanedUID = serialNumber.replace(/:/g, '');

        console.log('Tag detected:', serialNumber);
        console.log('Cleaned UID:', cleanedUID);
        console.log('Message:', message);

        if (message && message.records) {
          console.log('Records count:', message.records.length);
          message.records.forEach((record, i) => {
            console.log(`Record ${i} type:`, record.recordType);
            try {
              let dataStr = '';
              if (typeof record.data === 'string') {
                dataStr = record.data;
              } else if (record.data instanceof ArrayBuffer) {
                dataStr = new TextDecoder().decode(record.data);
              } else {
                dataStr = String(record.data);
              }
              console.log(`Record ${i} data:`, dataStr);
            } catch (e) {
              console.log(`Record ${i} data: [Unable to display]`);
            }
          });
        }

        this.statusMessage = `Tag detected - UID: ${cleanedUID}, processing...`;

        // Check if tag is already processed - use cleaned UID
        if (this.scannedTags.some((tag) => tag.uid === cleanedUID)) {
          this.statusMessage = `Tag ${cleanedUID} already processed.`;

          // Even when already processed, we continue scanning if bulk mode is enabled
          if (!this.bulkEnabled) {
            this.stopScanning();
          }
          return;
        }

        // Check if tag is available for writing or already has Kukudushi data
        const isWritable = this.isTagWritable(message);
        console.log('Is tag writable:', isWritable);

        if (!isWritable) {
          this.statusMessage = `Tag ${cleanedUID} already contains Kukudushi data. Skipping.`;

          // Continue scanning if in bulk mode
          if (!this.bulkEnabled) {
            this.stopScanning();
          }
          return;
        }

        // Use the cleaned UID for all subsequent operations
        const uid = cleanedUID;
        const url = `https://kukudushi.com/?uid=${uid}`;

        // Add to table with pending status
        const tagEntry = {
          uid: uid,
          writeStatus: 'pending',
          dbStatus: 'pending',
        };

        // Add entry to visible table before starting operations
        this.scannedTags.unshift(tagEntry);
        this.statusMessage = `Tag detected: ${uid}. Writing URL...`;

        // Write URL to tag
        try {
          await this.writeUrlToTag(url);
          tagEntry.writeStatus = 'success';
          this.statusMessage = `Successfully wrote URL to tag ${uid}. Saving to database...`;
        } catch (writeError) {
          console.error('Error writing to tag:', writeError);
          tagEntry.writeStatus = 'error';
          this.statusMessage = `Error writing to tag: ${writeError.message}`;

          // If not in bulk mode, stop scanning
          if (!this.bulkEnabled) {
            this.stopScanning();
          }
          return;
        }

        // Save to database
        try {
          await this.saveToDatabse(uid);
          tagEntry.dbStatus = 'success';
          this.statusMessage = `Successfully saved ${uid} to database.`;

          // If not in bulk mode, stop scanning
          if (!this.bulkEnabled) {
            this.stopScanning();
          } else {
            this.statusMessage = 'Ready for next tag...';
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          tagEntry.dbStatus = 'error';
          this.statusMessage = `Database error: ${dbError.message}`;

          // If not in bulk mode, stop scanning
          if (!this.bulkEnabled) {
            this.stopScanning();
          }
        }
      } catch (error) {
        console.error('Error in tag handling process:', error);
        this.statusMessage = `Error processing tag: ${error.message}`;

        // If not in bulk mode, stop scanning
        if (!this.bulkEnabled) {
          this.stopScanning();
        }
      }
    },

    // Renamed to better reflect its purpose
    isTagWritable(message) {
      // Case 1: No message at all - definitely writable
      if (!message) return true;

      // Case 2: No records - definitely writable
      if (!message.records || message.records.length === 0) return true;

      // Check if any record contains a kukudushi.com URL
      for (const record of message.records) {
        if (record.recordType === 'url' && record.data) {
          let urlData;
          if (typeof record.data === 'string') {
            urlData = record.data;
          } else if (record.data instanceof ArrayBuffer) {
            urlData = new TextDecoder().decode(record.data);
          } else {
            continue; // Skip if we can't process the data
          }

          // If tag has a Kukudushi URL, it's not writable
          if (urlData.includes('kukudushi.com')) {
            console.log('Found existing Kukudushi URL:', urlData);
            return false;
          }
        }
      }

      // No Kukudushi URL found, tag is writable regardless of other content
      return true;
    },

    async writeUrlToTag(url) {
      try {
        await this.ndefReader.write({
          records: [{ recordType: 'url', data: url }],
          // Also try to maintain exclusive control during write operations
          exclusive: true,
        });
        return true;
      } catch (error) {
        console.error('Error writing to tag:', error);
        throw new Error('Failed to write URL to tag');
      }
    },

    async saveToDatabse(uid) {
      console.log(`Attempting to save UID ${uid} to database...`);
      const tagEntry = this.scannedTags.find((tag) => tag.uid === uid);

      try {
        // Log the request data
        const requestBody = {
          uid: uid,
          model_id: this.selectedModel,
          points_amount: 1500,
          points_description:
            'Starting points to choose you first animal. Enjoy!',
        };
        console.log('Sending data to server:', requestBody);

        // Create a visible status update
        this.statusMessage = `Saving UID ${uid} to database with model ID ${this.selectedModel}...`;

        const response = await fetch(
          `${this.pluginDirUrl}backend/save_new_kukudushi.php`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        // Log the response status
        console.log(`Server response status: ${response.status}`);

        // Try to get the response text regardless of status
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed server response:', data);
        } catch (parseError) {
          console.error('Failed to parse server response as JSON:', parseError);
          throw new Error(`Invalid server response: ${responseText}`);
        }

        if (data.success) {
          tagEntry.dbStatus = 'success';
          this.statusMessage = `Successfully saved ${uid} to database with ID: ${data.kukudushi_id}.`;

          // If not in bulk mode, stop scanning
          if (!this.bulkEnabled) {
            this.stopScanning();
          } else {
            this.statusMessage = 'Ready for next tag...';
          }
        } else {
          tagEntry.dbStatus = 'error';
          this.statusMessage = `Database error: ${data.message}`;

          // If not in bulk mode, stop scanning
          if (!this.bulkEnabled) {
            this.stopScanning();
          }
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        if (tagEntry) {
          tagEntry.dbStatus = 'error';
        }
        this.statusMessage = `Database error: ${error.message}`;

        // If not in bulk mode, stop scanning
        if (!this.bulkEnabled) {
          this.stopScanning();
        }

        // Re-throw to allow handling in the caller
        throw error;
      }
    },
  },
};
