import ManagerTabProperties from './manager_tab_properties.js';
import ManagerTabPoints from './manager_tab_points.js';
import ManagerTabList from './manager_tab_list.js';

export default {
  name: 'ManagerComponent',
  components: {
    ManagerTabProperties,
    ManagerTabPoints,
    ManagerTabList,
  },
  props: {
    pluginDirUrl: {
      type: String,
      required: true,
    },
    kukudushi: {
      type: Object,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      activeTab: 'List',
      isVisible: false,
      displayError: {
        show: false,
        message: '',
        type: 'success',
      },
      kukudushiStates: new Map(),
      kukudushis_selected: [], // Array to store selected kukudushi IDs
      loading: false,
      models: [],
    };
  },
  computed: {
    hasUnsavedChanges() {
      return Array.from(this.kukudushiStates.values()).some((state) => {
        return (
          state.hasChanges ||
          (state.points && state.points.some((p) => p.status !== 'Unchanged'))
        );
      });
    },
  },
  template: `
    <div v-if="isVisible" class="overlay" id="overlay">
      <div class="popup" :class="{ 'open-popup': isVisible }">
        <img id="top-img" :src="pluginDirUrl + '/media/kukudushi-logo-latest.png'" />
        <div class="resp-container">
          <div class="tab">
            <button 
              class="tablinks" 
              :class="{ active: activeTab === 'List' }"
              @click="setActiveTab('List')"
            >
              List
            </button>
            <button 
              class="tablinks" 
              :class="{ active: activeTab === 'Properties' }"
              @click="setActiveTab('Properties')"
            >
              Properties
            </button>
            <button 
              class="tablinks" 
              :class="{ active: activeTab === 'Points' }"
              @click="setActiveTab('Points')"
            >
              Points
            </button>
          </div>

          <div class="manager-scroll-container">
            <ManagerTabProperties
              ref="managerTabProperties"
              v-show="activeTab === 'Properties'"
              :kukudushi="kukudushi"
              :pluginDirUrl="pluginDirUrl"
              :username="username"
              :kukudushis_selected="kukudushis_selected"
              @error="showError"
              @success="showSuccess"
              @property-change="handlePropertyChange"
            />
            
            <ManagerTabPoints
              ref="managerTabPoints"
              v-show="activeTab === 'Points'"
              :kukudushi="kukudushi"
              :pluginDirUrl="pluginDirUrl"
              :username="username"
              :kukudushis_selected="kukudushis_selected"
              @points-change="handlePointsChange"
              @error="showError"
              @success="showSuccess"
            />
            
            <ManagerTabList
              v-show="activeTab === 'List'"
              :kukudushi="kukudushi"
              :kukudushiStates="kukudushiStates"
              :kukudushis_selected="kukudushis_selected"
              :hasUnsavedChanges="hasUnsavedChanges"
              :models="models"
              :pluginDirUrl="pluginDirUrl"
              @save-changes="handleSaveChanges"
              @update:kukudushis_selected="updateSelectedKukudushis"
            />
          </div>
        </div>

        <div class="button_holder">
          <button class="bottom_button" @click="closePopup">Close</button>
        </div>

        <!-- Error/Success Messages -->
        <div 
          v-if="displayError.show"
          class="display-error"
          :class="{ 'success': displayError.type === 'success' }"
        >
          <ul>{{ displayError.message }}</ul>
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="loading-spinner">
          <div class="loader"></div>
        </div>
      </div>
    </div>
  `,
  methods: {
    async fetchModels() {
      try {
        const response = await fetch(
          `${this.pluginDirUrl}/backend/get_models.php`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          this.models = data;
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        this.showError('Failed to load model data');
      }
    },
    async handleSaveChanges() {
      if (!this.hasUnsavedChanges) return;

      this.loading = true;
      try {
        const changes = this.gatherChanges();
        console.log('Sending changes:', changes);

        const response = await fetch(
          `${this.pluginDirUrl}/backend/save_manager_changes.php`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changes),
          }
        );

        const data = await response.json();
        console.log('Save response:', data);

        if (data.success) {
          // Update states and notify components
          this.updateStatesAfterSave(data.updates);

          // Find and notify all tab components about the updates
          const pointsTab = this.$refs.managerTabPoints;
          if (pointsTab) {
            pointsTab.handleSaveUpdates(data.updates);
          }

          const propertiesTab = this.$refs.managerTabProperties;
          if (propertiesTab) {
            propertiesTab.handleSaveUpdates(data.updates);
          }

          this.showSuccess(data.message || 'Changes saved successfully');
        } else {
          throw new Error(data.message || 'Failed to save changes');
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        this.showError(`Error saving changes: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    gatherChanges() {
      const changes = {
        kukudushi: {
          id: this.kukudushi.id,
          model_id: null,
          type_id: null,
          is_new: !this.kukudushi.exists,
        },
        metadata: {
          add: [],
          update: [],
          remove: [],
        },
        points: {
          add: [],
          remove: [],
        },
      };

      // Gather changes from kukudushiStates
      this.kukudushiStates.forEach((state, id) => {
        if (state.hasChanges) {
          // Update kukudushi changes
          if (state.model_id !== state.originalState.model_id) {
            changes.kukudushi.model_id = state.model_id;
          }
          if (state.type_id !== state.originalState.type_id) {
            changes.kukudushi.type_id = state.type_id;
          }

          // Gather metadata changes
          if (state.metadata) {
            state.metadata.forEach((meta) => {
              switch (meta.status) {
                case 'Add':
                  changes.metadata.add.push({
                    animal_id: meta.animal_id,
                    tempId: meta.tempId,
                    raw_metadata: meta.raw_metadata,
                  });
                  break;
                case 'Remove':
                  changes.metadata.remove.push(meta.metadata_id);
                  break;
                case 'Update':
                  changes.metadata.update.push(meta);
                  break;
              }
            });
          }

          // Gather points changes - This part seems to be missing!
          if (state.points) {
            state.points.forEach((point) => {
              switch (point.status) {
                case 'Add':
                  changes.points.add.push({
                    amount: point.amount,
                    description: point.description,
                    tempId: point.tempId,
                  });
                  break;
                case 'Remove':
                  changes.points.remove.push(point.id);
                  break;
              }
            });
          }
        }
      });

      console.log('Gathered changes:', changes); // Add logging
      return changes;
    },
    updateStatesAfterSave(updates) {
      console.log('Starting updateStatesAfterSave with updates:', updates);

      this.kukudushiStates.forEach((state, id) => {
        console.log('Processing state for ID:', id, 'Current state:', state);

        if (state.hasChanges) {
          if (state.metadata) {
            // Filter out removed metadata and update remaining entries
            state.metadata = state.metadata.filter((meta) => {
              // Skip entries that were confirmed as removed
              if (
                meta.status === 'Remove' &&
                updates.metadata?.removed?.includes(meta.metadata_id)
              ) {
                return false;
              }

              // Update entries with new IDs and reset status
              if (
                meta.status === 'Add' &&
                meta.tempId &&
                updates.metadata?.[meta.tempId]
              ) {
                meta.metadata_id = updates.metadata[meta.tempId];
                meta.tempId = undefined;
              }

              // Reset status to Unchanged for all remaining entries
              meta.status = 'Unchanged';
              return true;
            });

            // Update original state with the new metadata
            state.originalState = {
              ...state.originalState,
              metadata: JSON.parse(JSON.stringify(state.metadata)),
            };
          }

          // Handle points updates
          if (state.points) {
            state.points = state.points.filter((point) => {
              // Remove points that were confirmed as removed
              if (
                point.status === 'Remove' &&
                updates.points?.removed?.includes(point.id)
              ) {
                return false;
              }

              // Update new points with their real IDs
              if (
                point.status === 'Add' &&
                point.tempId &&
                updates.points?.[point.tempId]
              ) {
                point.id = updates.points[point.tempId];
                point.tempId = undefined;
              }

              // Reset status to Unchanged
              point.status = 'Unchanged';
              return true;
            });

            // Update original state with the new points
            state.originalState = {
              ...state.originalState,
              points: JSON.parse(JSON.stringify(state.points)),
            };
          }

          // Update model and type in original state
          if (state.model_id !== state.originalState.model_id) {
            state.originalState.model_id = state.model_id;
          }
          if (state.type_id !== state.originalState.type_id) {
            state.originalState.type_id = state.type_id;
          }

          // Reset the state's change status
          state.hasChanges = false;
          state.status = 'Unchanged';
        }
      });

      // Force a reactive update
      this.kukudushiStates = new Map(this.kukudushiStates);
    },

    initializeKukudushiState(kukudushi) {
      if (!kukudushi || this.kukudushiStates.has(kukudushi.id)) return;

      const initialState = {
        model_id: kukudushi.model_id?.toString() || '0',
        type_id: kukudushi?.type_id?.toString() || '0',
        metadata: JSON.parse(JSON.stringify(kukudushi.metadata || [])),
        status: kukudushi.exists ? 'Unchanged' : 'Add',
        hasChanges: false,
        originalState: {
          // Add this
          model_id: kukudushi.model_id?.toString() || '0',
          type_id: kukudushi?.type_id?.toString() || '0',
          metadata: JSON.parse(JSON.stringify(kukudushi.metadata || [])),
        },
      };

      this.kukudushiStates.set(kukudushi.id, initialState);
    },

    handlePropertyChange(kukudushiId, changes) {
      console.log('handlePropertyChange:', { kukudushiId, changes });

      const currentState = this.kukudushiStates.get(kukudushiId);
      if (!currentState) {
        console.warn('No state found for kukudushi:', kukudushiId);
        return;
      }

      const hasChanges = this.checkForChanges(currentState, changes);

      const newState = {
        ...currentState,
        ...changes,
        hasChanges,
        status: hasChanges ? 'Update' : 'Unchanged',
        originalState: currentState.originalState, // Preserve original state
      };

      console.log('State update:', {
        previousState: currentState,
        changes,
        hasChanges,
        newState,
      });

      // Force Vue to recognize the change
      this.kukudushiStates = new Map(
        this.kukudushiStates.set(kukudushiId, newState)
      );
    },

    determineStatus(hasChanges, exists, originalState) {
      if (!hasChanges) {
        return exists ? 'Unchanged' : 'Add';
      }
      return exists ? 'Update' : 'Add';
    },

    checkForChanges(currentState, newState) {
      if (!currentState || !newState) return false;

      // Compare against original values
      const originalState = currentState.originalState || currentState;

      // Compare model_id
      const modelChanged =
        newState.model_id !== '0' &&
        originalState.model_id !== newState.model_id;

      // Compare type_id
      const typeChanged =
        newState.type_id !== '0' && originalState.type_id !== newState.type_id;

      // Compare metadata
      const metadataChanged = this.hasMetadataChanges(
        originalState.metadata || [],
        newState.metadata || []
      );

      // For debug logging
      console.log('Original vs New State comparison:', {
        originalState,
        newState,
        modelChanged,
        typeChanged,
        metadataChanged,
      });

      // Return true only if there are actual differences from original state
      return modelChanged || typeChanged || metadataChanged;
    },

    // Add new helper method to check metadata changes
    hasMetadataChanges(originalMetadata, newMetadata) {
      if (!originalMetadata || !newMetadata) return false;
      if (originalMetadata.length !== newMetadata.length) return true;

      // Create mapped version of original metadata for comparison
      const mappedOriginalMetadata = originalMetadata.map((item) => {
        // If it's already in the simplified format, use as is
        if (item.raw_metadata) {
          return item;
        }
        // Otherwise convert from kukudushi metadata format
        let animalId = null;
        if (item.metadata) {
          const match = item.metadata.match(/animal_id=(\d+)/);
          animalId = match ? match[1] : null;
        }
        return {
          animal_id: animalId,
          status: 'Unchanged',
          metadata_id: item.id,
          raw_metadata: item.metadata,
        };
      });

      return newMetadata.some((newItem, index) => {
        const mappedOriginal = mappedOriginalMetadata[index];

        // Check if status has changed
        if (
          newItem.status !== 'Unchanged' &&
          newItem.status !== mappedOriginal.status
        ) {
          console.log('Status changed for metadata entry:', {
            originalStatus: mappedOriginal.status,
            newStatus: newItem.status,
          });
          return true;
        }

        // Compare other relevant fields
        if (newItem.animal_id !== mappedOriginal.animal_id) {
          console.log('Animal ID changed for metadata entry:', {
            originalId: mappedOriginal.animal_id,
            newId: newItem.animal_id,
          });
          return true;
        }

        // Check metadata content, accounting for different formats
        const originalMetadataStr = mappedOriginal.raw_metadata || '';
        const newMetadataStr = newItem.raw_metadata || '';
        if (
          this.normalizeMetadataString(originalMetadataStr) !==
          this.normalizeMetadataString(newMetadataStr)
        ) {
          console.log('Metadata content changed:', {
            original: originalMetadataStr,
            new: newMetadataStr,
          });
          return true;
        }

        return false;
      });
    },

    normalizeMetadataString(metadataStr) {
      // Remove any trailing semicolons and whitespace
      return metadataStr.trim().replace(/;$/, '');
    },

    setActiveTab(tab) {
      this.activeTab = tab;
    },

    showError(message) {
      this.displayError = {
        show: true,
        message,
        type: 'error',
      };
      setTimeout(() => {
        this.displayError.show = false;
      }, 4000);
    },

    showSuccess(message) {
      this.displayError = {
        show: true,
        message,
        type: 'success',
      };
      setTimeout(() => {
        this.displayError.show = false;
      }, 4000);
    },

    openPopup() {
      this.isVisible = true;
      document.body.style.overflow = 'hidden';
    },

    closePopup() {
      if (this.hasUnsavedChanges) {
        if (
          confirm('You have unsaved changes. Are you sure you want to close?')
        ) {
          this.performClose();
        }
      } else {
        this.performClose();
      }
    },

    performClose() {
      this.isVisible = false;
      document.body.style.overflow = null;
      this.$emit('close');
    },

    updateSelectedKukudushis(newSelection) {
      this.kukudushis_selected = newSelection;
    },

    handlePointsChange(change) {
      const { kukudushiId, entries, hasChanges } = change;
      const currentState = this.kukudushiStates.get(kukudushiId);

      if (!currentState) {
        console.warn('No state found for kukudushi:', kukudushiId);
        return;
      }

      const newState = {
        ...currentState,
        hasChanges: hasChanges,
        status: hasChanges ? 'Update' : 'Unchanged',
        points: entries, // Store points changes
      };

      console.log('Points state update:', {
        previousState: currentState,
        hasChanges,
        newState,
      });

      this.kukudushiStates.set(kukudushiId, newState);
    },
  },
  mounted() {
    console.log('ManagerComponent mounted');
    this.openPopup();
    this.fetchModels();

    // Initialize kukudushis_selected with the current kukudushi
    if (this.kukudushi && this.kukudushi.id) {
      this.kukudushis_selected = [this.kukudushi.id];
      this.initializeKukudushiState(this.kukudushi);
    }

    if (!this.kukudushi.exists) {
      this.showError(
        "This kukudushi ID doesn't exist yet. When proceeding, you will add a new kukudushi to the Database!"
      );
    }
  },
};
