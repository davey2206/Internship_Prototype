export default {
  template: `
    <div id="login-streak">
      <div class="login-streak-container">
        <div class="streak-header">
          <div class="streak-reward">+{{ points_data.points_awarded }} <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" class="coin-icon" /></div>
          <div class="streak-day">Streak day {{ points_streak }}</div>
        </div>

        <div class="streak-grid">
          <div v-for="(day, index) in 10" :key="index" class="streak-day-box" :class="{ 'checked': index < currentDay }">
            <div class="day-number">{{ index + 1 }}</div>
            <div class="reward-text">
              +10 
              <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" class="coin-small" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  components: {

  },
  data() {
    return {
      screenWidth: window.innerWidth, // Reactive property for screen width
    };
  },
  props: {
    loading: Boolean,
    loadingComplete: Boolean,
    points_data: {
      type: Array,
      required: true,
    },
    points_streak: {
      type: Array,
      required: true,
    },
    pluginDirUrl: String,
  },
  computed: {
    //dont display if already loged in today
    // display(){
    //   if (this.points_data.points_awarded == 0) {
    //     return {display: "none"};
    //   }
    // }
  },
  methods: {
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
