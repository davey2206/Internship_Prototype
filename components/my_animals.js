export default {
  template: `
  <div>
    <div v-for="(animals, species) in groupedAnimals" :key="species" class="species-group-container">
      <div class="species-header">
        <div class="species-header-title">{{ species }}</div>
        <span>{{ animals.filter(animal => animal.is_owned).length }}/{{ animals.length }} Collected</span>
      </div>
      <div class="animal-list-container-horizontal">
        <div class="animal-list-scrollable">
          <transition-group name="fade-shrink" tag="div" class="horizontal-animal-list">
            <div v-for="animal in animals" :key="animal.id" class="animal-list-item">
              <div class="list-item-animal-image-container">
                <img class="animal_image" :src="animal.picture">
                <div v-if="animal.is_new" class="new-tag">New</div>
                <div v-if="!animal.is_active" class="battery-warning-menu">
                  <img :src="pluginDirUrl + '/media/battery_empty_battery.png'" alt="Low Battery">
                </div>
                <div class="animal-info-overlay">
                  <label class="animal-info-name" :for="animal.id">{{ animal.name }}</label>
                  <div class="animal-info-species" >{{ animal.species }}</div>
                </div>
              </div>
              <div v-if="animal.is_owned" class="animal-track-focus-container">
                <button class="animal-focus-button" 
                  @click="handleFocusAnimal(animal, false)">
                    Track Now
                </button>
              </div>
              <div v-else class="animal-list-item-button-container">
                <button class="animal-preview-focus-button" 
                  @click="handleFocusAnimal(animal, true)">
                  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 122.88 78.5" style="enable-background:new 0 0 122.88 78.5;width: 30px;" xml:space="preserve">
                    <style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style>
                    <g>
                      <path class="st0" fill="#fff" d="M50.57,17.2C40.73,10.31,31,8.79,20.94,11.42c2.2-5.29,5.51-8.76,9.4-10.39c5.51-2.31,14.53-0.67,18.08,4.27 C50.24,7.82,51.15,11.56,50.57,17.2L50.57,17.2z M83.52,55.32c-0.27-1.12,0.43-2.24,1.55-2.51c1.12-0.27,2.24,0.43,2.51,1.55 c0.54,2.27,1.47,4.03,2.71,5.3c1.27,1.29,2.9,2.12,4.84,2.5c1.13,0.22,1.86,1.31,1.64,2.44c-0.22,1.13-1.31,1.86-2.44,1.64 c-2.76-0.55-5.13-1.76-7-3.67C85.54,60.75,84.24,58.35,83.52,55.32L83.52,55.32z M13.54,55.32c-0.27-1.12,0.43-2.24,1.55-2.51 c1.12-0.27,2.24,0.43,2.51,1.55c0.54,2.27,1.47,4.03,2.71,5.3c1.27,1.29,2.9,2.12,4.84,2.5c1.13,0.22,1.86,1.31,1.64,2.44 c-0.22,1.13-1.31,1.86-2.44,1.64c-2.76-0.55-5.13-1.76-7-3.67C15.56,60.75,14.26,58.35,13.54,55.32L13.54,55.32z M61.3,47.71 c2.8,0,5.07,2.21,5.07,4.93c0,2.72-2.27,4.93-5.07,4.93c-2.8,0-5.07-2.21-5.07-4.93C56.23,49.92,58.5,47.71,61.3,47.71L61.3,47.71z M26.66,34.57c10,0,18.11,7.88,18.11,17.61c0,9.72-8.11,17.61-18.11,17.61c-10,0-18.11-7.88-18.11-17.61 C8.55,42.45,16.65,34.57,26.66,34.57L26.66,34.57z M96.64,34.57c10,0,18.11,7.88,18.11,17.61c0,9.72-8.11,17.61-18.11,17.61 c-10,0-18.11-7.88-18.11-17.61C78.53,42.45,86.63,34.57,96.64,34.57L96.64,34.57z M72.31,17.2c9.84-6.89,19.57-8.41,29.62-5.78 c-2.2-5.29-5.51-8.76-9.4-10.39C87.02-1.28,78,0.36,74.46,5.3C72.64,7.82,71.73,11.56,72.31,17.2L72.31,17.2z M107.57,17.4 c-3.42-3.52-8.96-5.11-16.63-4.77c-8.69,0.43-17.87,4.06-20.82,12.29c-2.47-5.42-14.89-5.42-17.35,0 c-2.95-8.23-12.13-11.87-20.82-12.29c-7.67-0.34-13.2,1.26-16.63,4.77C10.5,23.86,0.96,40.74,0.16,48.99 C-3.1,82.47,44.92,90.87,52.62,56.3c4.37,7.75,13.27,7.75,17.64,0c7.7,34.58,55.72,26.17,52.46-7.31 C121.92,40.74,112.38,23.86,107.57,17.4L107.57,17.4z">
                      </path>
                    </g>
                  </svg>
                </button>
                <button 
                  class="animal-buy-now-button" 
                  @click="handleBuyAnimal(animal.id)" 
                  :disabled="buyingAnimalId === animal.id || !hasEnoughPoints()"
                >
                  <img v-if="buyingAnimalId !== animal.id" :src="pluginDirUrl + '/media/plus_points_coin.png'" class="kuku_points_img_buy_button" />
                  <div v-else class="button-loading-spinner"></div>
                  <span v-if="buyingAnimalId !== animal.id">
                    1000
                  </span>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
`,
  props: {
    animals: Array,
    selectedAnimalIds: Array,
    pluginDirUrl: String,
    buyingAnimalId: [Number, String, null],
    userPoints: Number,
  },
  computed: {
    groupedAnimals() {
      return this.groupAnimalsBySpecies(this.animals);
    },
    ownedAnimals() {
      return this.animals.filter((animal) => animal.is_owned);
    },
    availableAnimals() {
      return this.animals.filter((animal) => !animal.is_owned);
    },
  },
  methods: {
    hasEnoughPoints() {
      // Assuming animal costs 1000 points
      return this.userPoints >= 1000;
    },
    groupAnimalsBySpecies(animals) {
      return animals.reduce((acc, animal) => {
        const pluralSpecies = animal.main_species + 's';
        if (!acc[pluralSpecies]) {
          acc[pluralSpecies] = [];
        }
        acc[pluralSpecies].push(animal);
        return acc;
      }, {});
    },
    getVisibilityIcon(animalId) {
      return this.selectedAnimalIds.includes(animalId)
        ? `${this.pluginDirUrl}/media/visibility-on.svg`
        : `${this.pluginDirUrl}/media/visibility-off.svg`;
    },
    handleAnimalSelect(animalId) {
      this.$emit('animal-select', animalId);
    },
    handleFocusAnimal(animal, openInfoBox) {
      this.$emit('focus-animal', animal, openInfoBox);
    },
    handleBuyAnimal(animalId) {
      if (!this.hasEnoughPoints()) {
        return; // Don't proceed if not enough points
      }

      // Ask for confirmation before buying
      if (
        confirm('Are you sure you want to buy this animal for 1000 points?')
      ) {
        this.$emit('buy-animal', animalId);
      }
    },
  },
};
