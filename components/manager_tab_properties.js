export default {
  name: 'ManagerTabProperties',
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
      selectedType: '0',
      selectedAnimal: '0',
      selectedModel: '0',
      loading: false,
      animals: [],
      types: [],
      models: [],
      ownedAnimalsTable: [], // Array to store metadata rows
      originalAnimalsList: [], // Store the complete list of animals
      initialized: false, // Flag to track initialization
    };
  },
  computed: {
    availableAnimals() {
      const assignedAnimalIds = new Set(
        this.ownedAnimalsTable
          .filter((row) => row.status !== 'Remove')
          .map((row) => row.animal_id.toString())
      );

      console.log('Current assigned IDs:', [...assignedAnimalIds]);
      console.log('Original animals list:', this.originalAnimalsList);

      const filtered = this.originalAnimalsList.filter(
        (animal) => !assignedAnimalIds.has(animal.id.toString())
      );

      console.log('Filtered available animals:', filtered);
      return filtered;
    },
    hasSelectedRows() {
      return this.ownedAnimalsTable.some((row) => row.selected);
    },
    allRowsSelected: {
      get() {
        return (
          this.ownedAnimalsTable.length > 0 &&
          this.ownedAnimalsTable.every((row) => row.selected)
        );
      },
      set(value) {
        this.ownedAnimalsTable.forEach((row) => (row.selected = value));
      },
    },
  },
  template: `
        <div class="choices">
          <!-- Model Selection -->
          <div class="section">
            <label for="model-select" class="select-label">Model:</label>
            <select v-model="selectedModel" id="model-select" class="select" @change="handleModelChange">
              <option value="0">Please select a model</option>
              <option v-for="model in models" :key="model.model_id" :value="model.model_id">
                {{ model.model_name }}
              </option>
            </select>

            <br>
            
          <!-- Type Selection -->
            <label for="type-select" class="select-label">Functionality Type:</label>
            <select v-model="selectedType" id="type-select" class="select" @change="handleTypeChange">
              <option value="0">Please select a type</option>
              <option v-for="type in types" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
          </div>
    
          <!-- Animal Selection -->
          <div class="section">
            <label for="metadata-select" class="select-label">Animal to add:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <select v-model="selectedAnimal" id="metadata-select" class="select" style="flex-grow: 1;">
                <option value="0">Please select an animal</option>
                <option v-for="animal in availableAnimals" :key="animal.id" :value="animal.id">
                  {{ animal.species }} - {{ animal.name }}
                </option>
              </select>
              <button class="add-animal-metadata-button" @click="addAnimalMetadata" :disabled="!selectedAnimal || selectedAnimal === '0'">
                Add
              </button>
            </div>
          </div>
          
          <div class="section">
            <!-- Animals Table -->
            <label for="owned-animals-table" class="select-label">Animals owned:</label>
            <table id="owned-animals-table" class="owned-animals-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      :checked="allRowsSelected"
                      @change="toggleAllRows"
                    />
                  </th>
                  <th>Animal</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in ownedAnimalsTable" :key="index">
                  <td>
                    <input 
                      type="checkbox" 
                      v-model="row.selected"
                      @change="updateSelectAll"
                    />
                  </td>
                  <td>{{ getAnimalName(row.animal_id) }}</td>
                  <td :style="getStatusStyle(row.status)">{{ row.status }}</td>
                  <td>
                    <button 
                      @click="toggleRemoveRow(index)" 
                      class="remove-button"
                    >
                      {{ row.status === 'Remove' ? 'Restore' : 'Remove' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
    
            <!-- Table Actions -->
            <div class="table-actions" v-if="ownedAnimalsTable.length > 0">
              <button class="remove-selected-items-button" @click="removeSelected" :disabled="!hasSelectedRows">
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      `,
  watch: {
    selectedModel(newVal) {
      if (this.initialized) {
        if (newVal !== '0') {
          this.emitPropertyChanges();
        }
        if (!this.kukudushi.exists) {
          localStorage.setItem('kukudushi_selected_model', newVal);
        }
      }
    },
    selectedType(newVal) {
      if (this.initialized) {
        if (newVal !== '0') {
          this.emitPropertyChanges();
        }
        if (!this.kukudushi.exists) {
          localStorage.setItem('kukudushi_selected_type', newVal);
        }
      }
    },
    ownedAnimalsTable: {
      deep: true,
      handler() {
        if (this.initialized) {
          this.emitPropertyChanges();
        }
      },
    },
    '$props.kukudushiStates': {
      deep: true,
      handler(newStates) {
        console.log('kukudushiStates changed:', newStates);

        // Get the current kukudushi's state
        const currentState = newStates.get(this.kukudushi.id);
        if (currentState?.metadata) {
          console.log(
            'Updating ownedAnimalsTable with:',
            currentState.metadata
          );
          this.ownedAnimalsTable = [...currentState.metadata];
        }
      },
    },
  },
  methods: {
    async fetchInitialData() {
      try {
        // Start loading
        const loadPromises = [];

        // Fetch animals with logging
        loadPromises.push(
          fetch(
            `${this.pluginDirUrl}backend/get_available_animals.php?kukudushi_id=${this.kukudushi.id}`
          )
            .then(async (response) => {
              console.log('Animals response:', response);
              const text = await response.text();
              try {
                return JSON.parse(text);
              } catch (e) {
                console.error('Failed to parse JSON:', text);
                throw e;
              }
            })
            .then((animalData) => {
              console.log('Received animal data:', animalData);
              if (Array.isArray(animalData)) {
                this.originalAnimalsList = [...animalData];
                this.animals = [...animalData];
                console.log('Set animals:', this.originalAnimalsList);
              } else {
                console.warn('Animal data is not an array:', animalData);
              }
            })
            .catch((error) => {
              console.error('Error fetching animals:', error);
            })
        );

        // Fetch types
        loadPromises.push(
          fetch(`${this.pluginDirUrl}backend/get_kukudushi_types.php`)
            .then((response) => response.json())
            .then((typeData) => {
              if (Array.isArray(typeData)) {
                this.types = typeData.map((type) => ({
                  id: type.type_id.toString(),
                  name: type.type_name,
                }));
              }
            })
        );

        // Wait for all data to be loaded
        await Promise.all(loadPromises);

        // Disable watchers temporarily
        this.initialized = false;

        // Set initial values only after all data is loaded
        if (this.kukudushi.exists) {
          this.selectedModel = this.kukudushi.model_id?.toString() || '0';

          const typeId = this.kukudushi?.type_id?.toString();

          console.log('Preselect kukudushi tab_properties');
          console.log(this.kukudushi);

          if (typeId && this.types.some((t) => t.id === typeId)) {
            this.selectedType = typeId;
          }

          // Load metadata
          this.loadExistingMetadata();
        } else {
          // Load saved values from localStorage
          this.selectedModel =
            localStorage.getItem('kukudushi_selected_model') || '0';
          this.selectedType =
            localStorage.getItem('kukudushi_selected_type') || '0';
        }

        // Mark as initialized and emit initial state only once
        await this.$nextTick();
        this.initialized = true;

        // Emit initial state after a short delay to ensure all reactivity is settled
        setTimeout(() => {
          this.emitPropertyChanges();
        }, 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        this.$emit('error', 'Failed to load initial data');
      }
    },

    async fetchModels() {
      try {
        const response = await fetch(
          `${this.pluginDirUrl}backend/get_models.php`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          this.models = data;
          if (this.kukudushi.exists && this.kukudushi.model_id) {
            this.selectedModel = this.kukudushi.model_id.toString();
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        this.$emit('error', 'Failed to load model data');
      }
    },

    loadExistingMetadata() {
      if (!this.kukudushi.exists || !this.kukudushi.metadata) return;

      const metadata = Array.isArray(this.kukudushi.metadata)
        ? this.kukudushi.metadata
        : [this.kukudushi.metadata];

      this.ownedAnimalsTable = metadata
        .map((meta) => {
          const animalId = this.parseAnimalId(meta.metadata);
          if (!animalId) return null;
          return {
            animal_id: animalId,
            metadata_id: meta.id, // Store original ID
            raw_metadata: meta.metadata,
            selected: false,
            status: 'Unchanged',
            // Store original data for comparison
            original: {
              ...meta,
            },
          };
        })
        .filter((item) => item !== null);
    },

    parseAnimalId(metadataString) {
      if (!metadataString) return null;
      const match = metadataString.match(/animal_id=(\d+)/);
      return match && match[1] ? match[1] : null;
    },

    emitPropertyChanges() {
      if (!this.initialized) {
        console.log('Skipping property changes - not initialized');
        return;
      }

      const changes = {
        model_id: this.selectedModel,
        type_id: this.selectedType,
        metadata: this.ownedAnimalsTable.map((row) => ({
          ...row,
          raw_metadata: this.generateMetadataString(row.animal_id),
        })),
      };

      console.log('Emitting property changes:', {
        initialized: this.initialized,
        changes,
      });

      this.$emit('property-change', this.kukudushi.id, changes);
    },

    generateMetadataString(animalId) {
      return `animal_id=${animalId}`;
    },

    getAnimalName(animalId) {
      const animal = this.originalAnimalsList.find(
        (a) => a.id === animalId.toString()
      );
      if (animal) {
        let name = `${animal.species} - ${animal.name}`;
        if (!animal.is_active) {
          name += ' (Inactive)';
        }
        return name;
      }
      return 'Unknown Animal';
    },

    addAnimalMetadata() {
      if (!this.selectedAnimal || this.selectedAnimal === '0') return;

      const exists = this.ownedAnimalsTable.some(
        (row) =>
          row.animal_id.toString() === this.selectedAnimal.toString() &&
          row.status !== 'Remove'
      );

      if (exists) {
        this.$emit('error', 'This animal is already in the table');
        return;
      }

      // Add tempId for tracking new entries
      const tempId = `temp_${Date.now()}`;

      this.ownedAnimalsTable.push({
        animal_id: this.selectedAnimal,
        selected: false,
        metadata_id: null,
        status: 'Add',
        tempId: tempId, // Add temporary ID
        raw_metadata: `animal_id=${this.selectedAnimal}`,
      });

      this.selectedAnimal = '0';
      this.emitPropertyChanges();
    },

    toggleRemoveRow(index) {
      const row = this.ownedAnimalsTable[index];

      // Only toggle remove status if the entry has a metadata_id
      if (row.metadata_id) {
        row.status = row.status === 'Remove' ? 'Unchanged' : 'Remove';
        this.emitPropertyChanges();
      } else if (row.status === 'Add') {
        // For new entries that haven't been saved yet
        this.ownedAnimalsTable.splice(index, 1);
        this.emitPropertyChanges();
      }
    },

    removeSelected() {
      const selectedRows = this.ownedAnimalsTable.filter((row) => row.selected);
      selectedRows.forEach((row) => {
        const index = this.ownedAnimalsTable.findIndex((r) => r === row);
        if (index !== -1) {
          if (row.metadata_id) {
            // For existing entries
            this.ownedAnimalsTable[index].status = 'Remove';
          } else {
            // For new unsaved entries
            this.ownedAnimalsTable.splice(index, 1);
          }
        }
      });
      this.emitPropertyChanges();
    },

    toggleAllRows() {
      const newState = !this.allRowsSelected;
      this.ownedAnimalsTable.forEach((row) => (row.selected = newState));
    },

    updateSelectAll() {
      // Will automatically update allRowsSelected computed property
    },

    getStatusStyle(status) {
      const styles = {
        Add: { color: 'green' },
        Remove: { color: 'red' },
        Unchanged: { color: 'grey' },
      };
      return styles[status] || {};
    },
    handleSaveUpdates(updates) {
      if (!updates.metadata) return;

      // Handle removed metadata
      if (updates.metadata.removed) {
        // Remove the entries from ownedAnimalsTable that were confirmed as removed
        this.ownedAnimalsTable = this.ownedAnimalsTable.filter(
          (entry) => !updates.metadata.removed.includes(entry.metadata_id)
        );
      }

      // Handle new metadata (update temporary IDs with real ones)
      this.ownedAnimalsTable = this.ownedAnimalsTable.map((entry) => {
        if (entry.tempId && updates.metadata[entry.tempId]) {
          return {
            ...entry,
            metadata_id: updates.metadata[entry.tempId],
            tempId: null, // Clear temporary ID
            status: 'Unchanged',
          };
        }
        // Reset status for existing entries
        if (entry.status !== 'Add' && entry.metadata_id) {
          entry.status = 'Unchanged';
        }
        return entry;
      });

      this.emitPropertyChanges();
    },
  },
  mounted() {
    console.log('ManagerTabProperties mounted');
    Promise.all([this.fetchModels(), this.fetchInitialData()]).catch(
      (error) => {
        console.error('Error during initialization:', error);
        this.$emit('error', 'Failed to initialize properties');
      }
    );
  },
};
