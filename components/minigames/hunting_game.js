export default {
  template: `
    <div class="Game" ref="gameContainer">
      <div id="Score">{{ displayScore }}</div>

      <div
        v-if="seal"
        :class="seal.class"
        :style="{ transform: 'translate(' + seal.x + 'px, ' + seal.y + 'px)' }"
      ></div>

      <div class="buttonHolder" v-for="(label, idx) in ['Left', 'Forward', 'Right']" :key="idx"
           :style="{ transform: 'translate(' + linePositions[idx] + 'px, ' + buttonY + 'px)' }">
        <button @click="move(idx)">{{ label }}</button>
      </div>
    </div>
  `,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
  },
  data() {
    return {
      score: 250,
      seal: null,
      sealLine: 1,
      gameWidth: 0,
      gameHeight: 0,
      linePositions: [0, 0, 0],
    };
  },
  computed: {
    displayScore() {
      if (this.score === 0) return "You win";
      if (this.score > 500) return "You Lose";
      return `Distance ${this.score}`;
    },
    buttonY() {
      return this.gameHeight - 100;
    },
  },
  methods: {
    getLinePositions() {
      const x = Math.floor((this.gameWidth - 100) / 3);
      return [x, 2 * x, 3 * x];
    },
    spawnSeal() {
      const rng = Math.floor(Math.random() * 3);
      const y = this.gameHeight - 400;

      let sealClass = rng === 1 ? "Seal" : "Blood";
      let x = this.linePositions[rng];
      if (rng === 0 || rng === 1) x -= 25;

      this.sealLine = rng;
      this.seal = { class: sealClass, x, y };
    },
    move(direction) {
      if (direction === this.sealLine) {
        this.score -= 50;
      } else {
        this.score += 100;
      }

      if (this.score > 0 && this.score <= 500) {
        this.seal = null;
        this.spawnSeal();
      }
    },
  },
  mounted() {
    const gameEl = this.$refs.gameContainer;
    this.gameWidth = gameEl.clientWidth;
    this.gameHeight = gameEl.clientHeight;
    this.linePositions = this.getLinePositions();
    this.spawnSeal();
  },
};