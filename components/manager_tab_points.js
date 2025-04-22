export default {
  name: 'ManagerTabPoints',
  props: {
    kukudushi: {
      type: Object,
      required: true,
    },
    pluginDirUrl: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    kukudushis_selected: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      pointsAmount: 0,
      pointsMessage: '',
      loading: false,
      pointsEntries: [],
      initialized: false,
      allRowsSelected: false,
    };
  },
  computed: {
    isValidEntry() {
      return this.pointsAmount !== 0 && this.pointsMessage.trim() !== '';
    },
    hasChanges() {
      return this.pointsEntries.some((entry) => entry.status !== 'Unchanged');
    },
    hasSelectedRows() {
      return this.pointsEntries.some((entry) => entry.selected);
    },
  },
  template: `
        <div class="choices">
          <div class="section points-add-section">
            <!-- Points Amount Input -->
            <div class="input-group">
              <label for="points-amount" class="select-label">Points Amount:</label>
              <input 
                type="number"
                id="points-amount"
                v-model.number="pointsAmount"
                class="points-input"
                placeholder="Enter points amount"
              />
            </div>
    
            <!-- Points Message Input -->
            <div class="input-group">
              <label for="points-message" class="select-label">Message:</label>
              <input 
                type="text"
                id="points-message"
                v-model="pointsMessage"
                class="message-input"
                placeholder="Enter message for points entry"
              />
            </div>
    
            <!-- Add Points Button -->
            <button 
              @click="addPointsEntry"
              :disabled="!isValidEntry"
              class="add-points-button"
            >
              Add Points
            </button>

            </div>
            <div class="section points-overview-section">
    
            <!-- Points Table -->
            <label for="points-history" class="select-label">Points Overview:</label>
            <div id="points-history" class="points-history">
                <div v-for="(entry, index) in pointsEntries" 
                    :key="index" 
                    class="points-card"
                >
                    <input 
                    type="checkbox"
                    class="points-checkbox"
                    v-model="entry.selected"
                    @change="updateSelectAll"
                    />
                    
                    <div class="points-content">
                    <div class="points-amount" 
                        :class="entry.amount > 0 ? 'amount-positive' : 'amount-negative'"
                    >
                        {{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}
                    </div>
                    
                    <div class="points-date">
                        {{ formatDate(entry.date) }}
                    </div>

                    <div class="points-description">
                        {{ entry.description }}
                    </div>

                    <div class="points-footer">
                        <div class="points-status" :class="'status-' + entry.status.toLowerCase()">
                        {{ entry.status }}
                        </div>
                        <button 
                        @click="toggleRemoveEntry(index)"
                        class="remove-button"
                        >
                        <img 
                            :src="getTrashIcon(entry.status)" 
                            alt="Remove"
                            class="trash-icon"
                        />
                        {{ entry.status === 'Remove' ? 'Restore' : 'Remove' }}
                        </button>
                    </div>
                    </div>
                </div>
            </div>
  
            <!-- Table Actions -->
            <div class="table-actions" v-if="pointsEntries.length > 0">
              <button class="remove-selected-items-button" @click="removeSelected" :disabled="!hasSelectedRows">
                Remove Selected
              </button>
            </div>
  
          </div>
        </div>
      `,
  watch: {
    pointsEntries: {
      deep: true,
      handler(newVal) {
        if (this.initialized) {
          // Notify parent of changes
          this.$emit('points-change', {
            kukudushiId: this.kukudushi.id,
            entries: newVal,
            hasChanges: this.hasChanges,
          });
        }
      },
    },
    pointsAmount(newVal) {
      if (this.initialized && !this.kukudushi.exists) {
        localStorage.setItem('kukudushi_points_amount', newVal.toString());
      }
    },
    pointsMessage(newVal) {
      if (this.initialized && !this.kukudushi.exists) {
        localStorage.setItem('kukudushi_points_message', newVal);
      }
    },
  },
  methods: {
    getTrashIcon(status) {
      return `${this.pluginDirUrl}/media/${
        status === 'Remove' ? 'trash-restore.svg' : 'trash.svg'
      }`;
    },
    async fetchPointsData() {
      try {
        const urlParams = new URLSearchParams();
        if (this.kukudushi.id) {
          urlParams.append('uid', this.kukudushi.id);
        }

        const response = await fetch(
          `${
            this.pluginDirUrl
          }backend/get_points_data.php?${urlParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.points_data) {
          this.pointsEntries = data.points_data.map((point) => ({
            id: point.id, // Assuming each point has a unique ID
            date: point.date,
            amount: point.amount,
            description: point.description,
            selected: false,
            status: 'Unchanged',
          }));
        }
      } catch (error) {
        console.error('Error fetching points data:', error);
        this.$emit('error', 'Failed to load points data');
      }
    },

    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    },

    addPointsEntry() {
      if (!this.isValidEntry) return;

      const tempId = `temp_${Date.now()}`; // Generate a temporary ID

      this.pointsEntries.unshift({
        id: null,
        amount: this.pointsAmount,
        description: this.pointsMessage.trim(),
        date: new Date().toISOString(),
        selected: false,
        status: 'Add',
        tempId: tempId,
      });

      //this.pointsAmount = 0;
      //this.pointsMessage = '';
      this.notifyChanges();
    },

    toggleRemoveEntry(index) {
      const entry = this.pointsEntries[index];
      console.log('Toggling remove for entry:', entry);

      if (entry.id) {
        // For existing entries, toggle between Remove and Unchanged
        entry.status = entry.status === 'Remove' ? 'Unchanged' : 'Remove';
        this.notifyChanges();
      } else if (entry.status === 'Add') {
        // For new entries that haven't been saved yet, keep them in the list
        entry.status = 'Remove';
        this.notifyChanges();
      }
    },

    removeNewEntry(index) {
      this.pointsEntries.splice(index, 1);
      this.notifyChanges(); // Make sure to call this
    },

    toggleAllRows() {
      const newState = !this.allRowsSelected;
      this.pointsEntries.forEach((entry) => {
        entry.selected = newState;
      });
      this.allRowsSelected = newState;
    },

    updateSelectAll() {
      this.allRowsSelected =
        this.pointsEntries.length > 0 &&
        this.pointsEntries.every((entry) => entry.selected);
    },

    removeSelected() {
      const selectedEntries = this.pointsEntries.filter(
        (entry) => entry.selected
      );
      selectedEntries.forEach((entry) => {
        const index = this.pointsEntries.indexOf(entry);
        if (index !== -1) {
          if (entry.id) {
            this.pointsEntries[index].status = 'Remove';
          } else {
            this.pointsEntries.splice(index, 1);
          }
        }
      });
      this.notifyChanges();
    },

    getStatusStyle(status) {
      const styles = {
        Add: { color: 'green' },
        Remove: { color: 'red' },
        Unchanged: { color: 'grey' },
      };
      return styles[status] || {};
    },

    notifyChanges() {
      if (this.initialized) {
        const hasChanges = this.pointsEntries.some(
          (entry) => entry.status === 'Add' || entry.status === 'Remove'
        );

        console.log('Points changes:', {
          entries: this.pointsEntries,
          hasChanges: hasChanges,
        });

        this.$emit('points-change', {
          kukudushiId: this.kukudushi.id,
          entries: this.pointsEntries,
          hasChanges: hasChanges,
        });
      }
    },

    handleSaveUpdates(updates) {
      if (!updates.points) return;

      // Handle removed points
      if (updates.points.removed) {
        this.pointsEntries = this.pointsEntries.filter(
          (entry) => !updates.points.removed.includes(entry.id)
        );
      }

      // Handle new points (update temporary IDs with real ones)
      this.pointsEntries.forEach((entry) => {
        if (entry.tempId && updates.points[entry.tempId]) {
          entry.id = updates.points[entry.tempId];
          entry.tempId = null; // Clear temporary ID
          entry.status = 'Unchanged';
        }
      });
    },
  },
  async mounted() {
    await this.fetchPointsData();

    // Load saved form values if kukudushi doesn't exist
    if (!this.kukudushi.exists) {
      const savedAmount = localStorage.getItem('kukudushi_points_amount');
      const savedMessage = localStorage.getItem('kukudushi_points_message');

      if (savedAmount) {
        this.pointsAmount = parseFloat(savedAmount);
      }
      if (savedMessage) {
        this.pointsMessage = savedMessage;
      }
    }

    this.$nextTick(() => {
      this.initialized = true;
    });
  },
  beforeDestroy() {
    this.initialized = false;
  },
};
