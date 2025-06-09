export default {
  template: `
    <div class="WarmingUpGame" ref="gameRef">
      <div id="WarmingUpScore">{{ scoreDisplay }}</div>
      <div v-if="showTurtle" class="WarmingUpTurtle" :style="turtleStyle"></div>
      <div v-if="sunVisible" class="WarmingUpSun" :style="sunStyle"></div>
      <div v-for="trash in trashes" :key="trash.id" class="WarmingUpTrash" :style="trash.style"></div>
      <div class="WarmingUpButtonHolder" :style="buttonLeftStyle">
        <button class="WarmingUpButton" @click="moveTurtleLeft">Left</button>
      </div>
      <div class="WarmingUpButtonHolder" :style="buttonRightStyle">
        <button class="WarmingUpButton" @click="moveTurtleRight">Right</button>
      </div>
      <button v-if="showCloseButton"  @click="closeGame" class="WarmingUpCloseButton">
        Close Game
      </button>
    </div>
  `,
  props: {
    pluginDirUrl: String,
  },
  data() {
    return {
      windowWidth: 0,
      windowHeight: 0,
      line: 2,
      lines: [],
      turtleY: 0,
      sunLine: null,
      score: 250,
      trashes: [],
      trashCounter: 0,
      showTurtle: false,
      sunVisible: false,
      lastFrameTime: performance.now(),
      sunTimer: 0,
      trashTimer: 0,
      scoreTimer: 0,
      started: false,
      showCloseButton: false,
    };
  },
  watch: {
    MiniGame(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs.warmingUpGame?.startGame?.();
        });
      }
    }
  },
  computed: {
    x() {
      return Math.floor((this.windowWidth - 100) / 3);
    },
    scoreDisplay() {
      if (this.score >= 500){
        this.showCloseButton = true;
        this.score = 10000;
        return "you win";
      } 
      if (this.score <= 0)
      {
        this.showCloseButton = true;
        return "you lose";
      } 
      return `${this.score}/500`;
    },
    turtleStyle() {
      return {
        transform: `translate(${this.lines[this.line - 1]}px, ${this.turtleY}px)`
      };
    },
    sunStyle() {
      return {
        transform: `translate(${this.lines[this.sunLine - 1] - 25}px, 0px)`
      };
    },
    buttonLeftStyle() {
      return {
        transform: `translate(${this.lines[0]}px, ${this.windowHeight - 150}px)`
      };
    },
    buttonRightStyle() {
      return {
        transform: `translate(${this.lines[2]}px, ${this.windowHeight - 150}px)`
      };
    }
  },
  methods: {
    closeGame() {
      this.$emit('close');
    },
    startGame() {
      this.showCloseButton = false;
      this.score = 250;

      if (this.started) return; // prevent double init
      this.started = true;

      this.windowHeight = this.$refs.gameRef.clientHeight - 50;
      this.windowWidth = this.$refs.gameRef.clientWidth - 50;
      this.lines = [this.x, 2 * this.x, 3 * this.x];
      this.turtleY = this.windowHeight - 250;
      this.showTurtle = true;

      requestAnimationFrame(this.gameLoop);
    },
    moveTurtleLeft() {
      if (this.line > 1) this.line--;
    },
    moveTurtleRight() {
      if (this.line < 3) this.line++;
    },
    spawnSun() {
      const RNG = Math.floor(Math.random() * 3);
      this.sunLine = RNG + 1;
      this.sunVisible = false;
      this.$nextTick(() => {
        this.sunVisible = true;
      });
    },
    spawnTrash() {
      const line = Math.floor(Math.random() * 3);
      const id = this.trashCounter++;
      const trash = {
        id,
        line,
        y: -100,
        hit: false,
        style: {
          transform: `translate(${this.lines[line]}px, -100px)`
        }
      };
      this.trashes.push(trash);
    },
    updateTrash(trash, deltaTime) {
      const speed = 200; // pixels per second
      trash.y += speed * deltaTime;

      if (trash.y > this.windowHeight + 50) {
        this.trashes = this.trashes.filter(t => t.id !== trash.id);
        return;
      }

      if ( !trash.hit && this.line === trash.line + 1 && trash.y >= this.turtleY - 25 && trash.y <= this.turtleY + 25) {
        this.score = this.score - 50;
        trash.hit = true;
      }

      trash.style = {
        transform: `translate(${this.lines[trash.line]}px, ${trash.y}px)`
      };
    },
    gameLoop(currentTime) {
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      this.sunTimer += deltaTime;
      this.trashTimer += deltaTime;
      this.scoreTimer += deltaTime;

      // Update trashes
      this.trashes.forEach(trash => this.updateTrash(trash, deltaTime));

      // Spawn sun every 5 seconds
      if (this.sunTimer >= 5) {
        this.spawnSun();
        this.sunTimer = 0;
      }

      // Spawn trash every 2.5 seconds
      if (this.trashTimer >= 2.5) {
        this.spawnTrash();
        this.trashTimer = 0;
      }

      // Update score every 0.1 seconds
      if (this.score > 0 && this.score < 1000 && this.scoreTimer >= 0.1) {
        if (this.line === this.sunLine) {
          this.score++;
        } else {
          this.score--;
        }
        this.scoreTimer = 0;
      }

      requestAnimationFrame(this.gameLoop);
    }
  }
};