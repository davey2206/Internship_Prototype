import ScanModal from './scan_modal.js';
export default {
  name: 'ManagerTabList',
  components: {
    ScanModal,
  },
  props: {
    kukudushi: {
      type: Object,
      required: true,
    },
    kukudushiStates: {
      type: Map,
      required: true,
    },
    kukudushis_selected: {
      type: Array,
      required: true,
    },
    hasUnsavedChanges: {
      type: Boolean,
      required: true,
    },
    models: {
      type: Array,
      required: true,
    },
    pluginDirUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      itemList: [], // Holds all kukudushi items added to the list
      showScanModal: false,
    };
  },
  template: `
    <div class="add-scan-remove-container">
      <div class="button-container">
        <div class="section-title">Add more kukudushi's to the list:</div>
        <button @click="openScanModal" class="add-scan-button">Add by scan</button>
      </div>
      <div class="list-container">
        <div class="section-title">Overview Current Kukudushi's:</div>
        <table class="item-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Kukudushi ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in itemList" :key="index">
              <td>
                <input 
                  type="checkbox" 
                  :checked="isItemSelected(item.id)"
                  @change="toggleItemSelection(item.id)"
                />
              </td>
              <td>{{ item.id }}</td>
              <td :style="getStatusStyle(item.status)">{{ item.status }}</td>
              <td>
                <button 
                  class="remove-item-button" 
                  @click="toggleRemoveItem(index)"
                  :disabled="!canToggleRemove(item)"
                >
                  {{ item.status === 'Remove' ? 'Restore' : 'Remove' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table Actions -->
        <div class="table-actions" v-if="hasItems">
          <button @click="removeSelected" :disabled="!hasSelectedRows" class="remove-selected-items-button">
            Remove Selected
          </button>
        </div>
      </div>

      <div class="save-changes-container" v-if="hasItems">
        <div class="section-title">Save all changes made in other tabs to selected kukudushi's:</div>
        <button 
          class="save-all-changes-button" 
          :disabled="!hasUnsavedChanges"
          @click="handleSaveChanges"
        >
          {{ hasUnsavedChanges ? 'Save all Changes' : 'No Changes to Save' }}
        </button>
      </div>
      
      <!-- NFC Scan Modal -->
      <ScanModal 
        v-if="showScanModal"
        :plugin-dir-url="pluginDirUrl"
        :models="models"
        @close="showScanModal = false"
      />
    </div>
  `,
  computed: {
    hasItems() {
      return this.itemList.length > 0;
    },
    hasSelectedRows() {
      return this.itemList.some((item) => item.selected);
    },
    allRowsSelected: {
      get() {
        return (
          this.itemList.length > 0 &&
          this.itemList.every((item) => item.selected)
        );
      },
      set(value) {
        this.itemList.forEach((item) => {
          item.selected = value;
        });
      },
    },
  },
  methods: {
    openScanModal() {
      console.log('Opening scan modal');
      this.showScanModal = true;
    },
    async handleSaveChanges() {
      this.$emit('save-changes');
    },
    addItem() {
      const kukudushiCopy = {
        ...this.kukudushi,
        status: this.getStateStatus(this.kukudushi.id),
        selected: false,
      };

      if (!this.itemList.some((item) => item.id === kukudushiCopy.id)) {
        this.itemList.push(kukudushiCopy);
        if (!this.isItemSelected(kukudushiCopy.id)) {
          this.addToSelection(kukudushiCopy.id);
        }
      } else {
        alert('This Kukudushi is already in the list.');
      }
    },

    getStateStatus(kukudushiId) {
      const state = this.kukudushiStates.get(kukudushiId);
      return state ? state.status : this.kukudushi.exists ? 'Unchanged' : 'Add';
    },

    toggleRemoveItem(index) {
      const item = this.itemList[index];
      if (item.exists) {
        const newStatus =
          item.status === 'Remove' ? this.getStateStatus(item.id) : 'Remove';
        this.updateItemStatus(index, newStatus);
      }
    },

    canToggleRemove(item) {
      return item.exists && item.status !== 'Add';
    },

    updateItemStatus(index, newStatus) {
      if (index >= 0 && index < this.itemList.length) {
        this.itemList[index].status = newStatus;
        // Update the state in parent
        const item = this.itemList[index];
        const state = this.kukudushiStates.get(item.id);
        if (state) {
          state.status = newStatus;
          state.hasChanges = newStatus !== 'Unchanged';
        }
      }
    },

    isItemSelected(itemId) {
      return this.kukudushis_selected.includes(itemId);
    },

    toggleItemSelection(itemId) {
      const index = this.kukudushis_selected.indexOf(itemId);
      if (index === -1) {
        this.addToSelection(itemId);
      } else {
        this.removeFromSelection(itemId);
      }
    },

    addToSelection(itemId) {
      const newSelection = [...this.kukudushis_selected, itemId];
      this.$emit('update:kukudushis_selected', newSelection);
    },

    removeFromSelection(itemId) {
      const newSelection = this.kukudushis_selected.filter(
        (id) => id !== itemId
      );
      if (newSelection.length > 0) {
        this.$emit('update:kukudushis_selected', newSelection);
      }
    },

    removeSelected() {
      const selectedItems = this.itemList.filter((item) => item.selected);
      selectedItems.forEach((item) => {
        const index = this.itemList.findIndex(
          (listItem) => listItem.id === item.id
        );
        if (index !== -1) {
          if (item.exists) {
            this.updateItemStatus(index, 'Remove');
          } else {
            this.itemList.splice(index, 1);
          }
        }
      });
    },

    getStatusStyle(status) {
      const styles = {
        Add: { color: 'green' },
        Remove: { color: 'red' },
        Update: { color: 'orange' },
        Unchanged: { color: 'grey' },
      };
      return styles[status] || {};
    },

    // Method to update an item's status when state changes in parent
    updateFromState(kukudushiId) {
      const state = this.kukudushiStates.get(kukudushiId);
      if (!state) return;

      const itemIndex = this.itemList.findIndex(
        (item) => item.id === kukudushiId
      );
      if (itemIndex !== -1) {
        this.itemList[itemIndex].status = state.status;
      }
    },
  },
  watch: {
    kukudushiStates: {
      deep: true,
      handler(newStates) {
        // Update all items in the list when states change
        this.itemList.forEach((item) => {
          const state = newStates.get(item.id);
          if (state) {
            item.status = state.status;
          }
        });
      },
    },
  },
  mounted() {
    console.log(
      'ManagerTabList mounted, ScanModal registered:',
      !!this.$options.components.ScanModal
    );

    // Initialize list with current kukudushi if it exists
    if (this.kukudushi && this.kukudushi.id) {
      this.addItem();
    }
  },
};
