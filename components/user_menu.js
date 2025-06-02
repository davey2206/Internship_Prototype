import MyAnimals from './my_animals.js';
import MyBadges from './my_badges.js';
import Donate from './donate.js';

export default {
  template: `
    <div id="user-dashboard-container">
        <div 
            class="menu-hero"
            :style="menuHeroStyle"
        >
            <div class="hero-header-container">
                <!--h2 class="elementor-heading-title elementor-size-default hero-text-header">Animal Care Center</h2-->
            </div>
            <div class="dashboard-tab">
                <button 
                    class="dashboard-tablinks" 
                    :class="{ active: activeTab === 'MyAnimals' }" 
                    @click="setActiveTab('MyAnimals')"
                >
                    Animals
                </button>
                <button 
                    class="dashboard-tablinks" 
                    :class="{ active: activeTab === 'MyBadges' }" 
                    @click="setActiveTab('MyBadges')"
                >
                    My Badges
                </button>
                <button 
                    class="dashboard-tablinks" 
                    :class="{ active: activeTab === 'Donate' }" 
                    @click="setActiveTab('Donate')"
                >
                    Donate
                </button>
            </div>
        </div>
        <div class="scroll-container">
            <div 
                id="MyAnimals" 
                class="dashboard-tab-content" 
                v-show="activeTab === 'MyAnimals'"
            >
                <MyAnimals
                  :animals="animals"
                  :selectedAnimalIds="selectedAnimalIds"
                  :pluginDirUrl="pluginDirUrl"
                  :buyingAnimalId="buyingAnimalId"
                  :userPoints="kukudushi?.points || 0"
                  @animal-select="toggleAnimalVisibility"
                  @focus-animal="focusAnimal"
                  @buy-animal="handleBuyAnimal"
                  @update-buying-animal="$emit('update-buying-animal', $event)"
                />
            </div>
            <div 
                id="MyBadges" 
                class="dashboard-tab-content" 
                v-show="activeTab === 'MyBadges'"
            >
                <MyBadges 
                  :pluginDirUrl="pluginDirUrl"
                  :kukudushi="kukudushi"
                  :badges="badges"
                />
            </div>
            <div 
                id="Donate" 
                class="dashboard-tab-content" 
                v-show="activeTab === 'Donate'"
            >
                <Donate :pluginDirUrl="pluginDirUrl" />
            </div>
        </div>

        <div v-if="loading" class="animal-tracker-loading-spinner"></div>
        <div v-else-if="loadingComplete" class="loading-complete">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
        </div>
    </div>
  `,
  components: {
    MyAnimals,
    MyBadges,
    Donate,
  },
  data() {
    return {
      activeTab: 'MyAnimals', // Set initial tab as default open tab
      screenWidth: window.innerWidth, // Reactive property for screen width
    };
  },
  props: {
    animals: Array,
    selectedAnimalIds: Array,
    loading: Boolean,
    loadingComplete: Boolean,
    pluginDirUrl: String,
    kukudushi: Object,
    buyingAnimalId: [Number, String, null],
    animal_purchase_status: String,
    badges: [],
  },
  computed: {
    // Compute the mask percentage dynamically
    maskPercentage() {
      const baseWidth = 440; // Maximum screen width where 80% applies
      const minWidth = 110; // Minimum screen width
      const maxPercentage = 100; // Cap at 100%
      const minPercentage = 80; // Minimum starting percentage

      // Gradual scaling with clamped output
      const ratio = (baseWidth - this.screenWidth) / (baseWidth - minWidth);
      const scaledPercentage =
        minPercentage + ratio * (maxPercentage - minPercentage);

      // Clamp the result to avoid overshoot
      return Math.min(
        maxPercentage,
        Math.max(minPercentage, scaledPercentage)
      ).toFixed(2);
    },
    // Dynamic style for menu-hero
    menuHeroStyle() {
      return {
        '--dynamic-mask-percentage': `${this.maskPercentage}%`,
        maskImage: `
          linear-gradient(
            to bottom, 
            rgba(0, 0, 0, 1) var(--dynamic-mask-percentage), 
            rgba(0, 0, 0, 0) var(--dynamic-mask-percentage), 
            rgba(0, 0, 0, 0) 100%
          ),
          url('${this.pluginDirUrl}media/hero-container-bottom-shape-devider_inverted.svg')
        `,
        WebkitMaskImage: `
          linear-gradient(
            to bottom, 
            rgba(0, 0, 0, 1) var(--dynamic-mask-percentage), 
            rgba(0, 0, 0, 0) var(--dynamic-mask-percentage), 
            rgba(0, 0, 0, 0) 100%
          ),
          url('${this.pluginDirUrl}media/hero-container-bottom-shape-devider_inverted.svg')
        `,
        maskPosition: 'bottom center',
        WebkitMaskPosition: 'bottom center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      };
    },
  },
  methods: {
    setActiveTab(tabName) {
      this.activeTab = tabName;
    },
    toggleAnimalVisibility(animalId) {
      this.$emit('animal-select', animalId);
    },
    focusAnimal(animal, openInfoBox) {
      this.$emit('focus-animal', animal, openInfoBox);
    },
    handleBuyAnimal(animalId) {
      this.$emit('update-buying-animal', animalId);
      this.$emit('buy-animal', animalId);
    },
    handleResize() {
      this.screenWidth = window.innerWidth; // Update screen width
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
};
