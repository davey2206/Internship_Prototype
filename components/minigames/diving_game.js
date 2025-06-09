export default {
  template: `
  <div class="Game" ref="gameContainer">
    <div id="Time">{{ displayTime }}</div>
    <div ref="seal" class="Seal" :style="sealStyle"></div>
    <div class="buttonHolder" :style="buttonStyle">
      <button @click="moveSeal">dive</button>
    </div>
  </div>
  `,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
  },
  data() {
    return {
      x: 0,
      y: 50,
      velocity: 0,
      timeLeft: 21,
      gameWidth: 0,
      gameHeight: 0,
      lastFrameTime: performance.now(),
    };
  },
  computed: {
    displayTime() {
      return this.timeLeft <= 0 ? 'Lost' : this.timeLeft;
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
    moveSeal() {
      this.velocity = 100; // pixels per second
    },
    timer() {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        setTimeout(this.timer, 1000);
      }
    },
    initGame() {
      const el = this.$refs.gameContainer;
      this.gameHeight = el.clientHeight - 50;
      this.gameWidth = el.clientWidth - 50;
      this.x = Math.floor((this.gameWidth + 25) / 2);
      this.timer();
      requestAnimationFrame(this.gameLoop);
    },
    gameLoop(timestamp) {
      const delta = (timestamp - this.lastFrameTime) / 1000;
      this.lastFrameTime = timestamp;

      // Move seal
      this.y += this.velocity * delta;
      this.velocity *= 0.95; // simulate friction/drag

      // Clamp position
      if (this.y > this.gameHeight - 50) {
        this.y = this.gameHeight - 50;
        this.velocity = 0;
      }

      if (this.timeLeft > 0) {
        requestAnimationFrame(this.gameLoop);
      }
    },
  },
  mounted() {
    this.initGame();
  },
};