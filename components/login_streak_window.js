export default {
  template: `
    <div id="login-streak" v-show="show" @click="hideStreak" :style="display">
      <div class="login-streak-container">
        <div class="streak-header">
          <div class="streak-reward">
            +{{ points_data.points_awarded }}
            <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" class="coin-icon" />
          </div>
          <div class="streak-day">Streak day {{ points_streak }}</div>
        </div>
        <div class="streak-grid">
          <div v-for="(day, index) in 10" :key="index" class="streak-day-box">
            <div class="day-number">{{ dayStart + index }}</div>

            <div v-if="(dayStart + index) <= points_streak" class="reward-text">
              <h2 class="checkmark_streak">✔</h2>
            </div>
            <div v-else-if="(dayStart + index) % 10 === 0" class="reward-text">
              +100
              <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" class="coin-small" />
            </div>
            <div v-else-if="(dayStart + index) % 5 === 0" class="reward-text">
              +50
              <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" class="coin-small" />
            </div>
            <div v-else class="reward-text">
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
      show: true,
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
    display(){
      if (this.points_data.points_awarded == 0) {
        this.show = false;
      }
    },
    dayStart() {
    // Start from the most recent 10-day block
      return Math.floor((this.points_streak - 1) / 10) * 10 + 1;
    },
  },
  methods: {
    handleResize() {
      this.screenWidth = window.innerWidth; // Update screen width
    },
     hideStreak() {
      this.show = false;
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
};
