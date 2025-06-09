export default {
  template: `
  <div class="DivingGame" ref="gameContainer">
    <div id="DivingTime">{{ displayTime }}</div>
    <div ref="seal" class="DivingSeal" :style="sealStyle"></div>
    <div class="DivingButtonHolder" :style="buttonStyle">
      <button class="DivingButton" @click="moveSeal">dive</button>
    </div>
    <button v-if="showCloseButton" @click="closeGame" class="DivingCloseButton close-button">
      Close Game
    </button>
  </div>
  `,
  props: {
    pluginDirUrl: String,
  },
  data() {
    return {
      x: 0,
      y: 50,
      timeLeft: 20,
      gameWidth: 0,
      gameHeight: 0,
      lastFrameTime: performance.now(),
      showCloseButton: false,
    };
  },
  computed: {
    displayTime() {
      return this.timeLeft <= 0 ? 'Lost' : Math.ceil(this.timeLeft);
    },
    sealStyle() {
      return {
        transform: `translate(${this.x}px, ${this.y}px)`
      };
    },
    buttonStyle() {
      const x = Math.floor(this.gameWidth / 2);
      const y = this.gameHeight - 50;
      return {
        transform: `translate(${x}px, ${y}px)`
      };
    }
  },
  methods: {
    closeGame() {
      this.$emit('close');
    },
    moveSeal() {
      this.y += 10;
    },
    timer() {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        setTimeout(this.timer, 1000);
      } else {
        this.showCloseButton = true;
      }
    },
    startGame() {
      this.timeLeft = 20;
      this.showCloseButton= false;
      this.y = 50;
      const el = this.$refs.gameContainer;
      this.gameHeight = el.clientHeight - 50;
      this.gameWidth = el.clientWidth - 50;
      this.x = Math.floor((this.gameWidth + 25) / 2);
      this.lastFrameTime = performance.now(); // reset timer start
      requestAnimationFrame(this.gameLoop);
    },
    gameLoop(timestamp) {
      const delta = (timestamp - this.lastFrameTime) / 1000; // delta in seconds
      this.lastFrameTime = timestamp;

      // Clamp position and check for bottom
      if (this.y > this.gameHeight - 50) {
        this.y = this.gameHeight - 50;
        this.showCloseButton = true;
      }

      // Reduce timeLeft by delta
      if (this.timeLeft > 0) {
        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.showCloseButton = true;
        }
        requestAnimationFrame(this.gameLoop);
      }
    },
  },
};