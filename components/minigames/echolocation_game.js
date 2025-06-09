export default {
  template: `
    <div class="Game" ref="gameContainer">
      <div
        v-for="(echo, index) in smallEchos"
        :key="'small-' + index"
        class="Echo"
        :style="{ transform: 'translate(' + echo.x + 'px, ' + echo.y + 'px)' }"
      >
        <button class="SmallEchoButton" @click="smallEchoClick"></button>
      </div>

      <div
        v-if="bigEcho"
        class="BigEcho"
        :style="{ transform: 'translate(' + bigEcho.x + 'px, ' + bigEcho.y + 'px)' }"
      >
        <button class="BigEchoButton" @click="bigEchoClick"></button>
      </div>

      <div v-if="endMessage" class="EndText" :style="endMessageStyle">
        {{ endMessage }}
      </div>
    </div>
  `,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
  },
  data() {
    return {
      smallEchos: [],
      bigEcho: null,
      numberOfEchos: 2,
      gameWidth: 0,
      gameHeight: 0,
      endMessage: '',
    };
  },
  computed: {
    endMessageStyle() {
      const x = this.gameWidth / 2 - 50;
      const y = this.gameHeight / 2;
      return {
        transform: `translate(${x}px, ${y}px)`
      };
    },
  },
  methods: {
    getRandomPosition(offset = 100) {
      const y = Math.floor(Math.random() * (this.gameHeight - offset));
      const x = Math.floor(Math.random() * this.gameWidth);
      return { x, y };
    },
    gameStart() {
      this.smallEchos = [];
      for (let i = 0; i < this.numberOfEchos; i++) {
        this.smallEchos.push(this.getRandomPosition());
      }
      this.bigEcho = this.getRandomPosition();
    },
    smallEchoClick() {
      this.endMessage = 'you lose';
    },
    bigEchoClick() {
      if (this.numberOfEchos === 6) {
        this.endMessage = 'you win';
      } else {
        this.destroyEchos();
      }
    },
    destroyEchos() {
      this.smallEchos = [];
      this.bigEcho = null;
      this.numberOfEchos++;
      setTimeout(() => this.gameStart(), 100); // slight delay for UX
    },
  },
  mounted() {
    const gameEl = this.$refs.gameContainer;
    this.gameWidth = gameEl.clientWidth - 50;
    this.gameHeight = gameEl.clientHeight - 50;
    this.gameStart();
  },
};