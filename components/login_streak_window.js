export default {
  template: `
    <div id="login-streak" :style="display">
        <div class="login-streak-container">
            <h1>Login Streak</h1>
            <h2> {{ points_streak }} </h2>
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
