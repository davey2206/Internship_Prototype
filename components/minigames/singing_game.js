export default {
  template: `
    <div class="Game" ref="gameContainer">
      <div
        v-for="(note, i) in notes"
        :key="note.id"
        :class="note.class"
        :style="{ transform: 'translate(' + note.x + 'px, ' + note.y + 'px)' }"
      ></div>

      <div class="buttonHolder" v-for="(label, i) in ['1', '2', '3', '4']" :key="i"
           :style="{ transform: 'translate(' + lines[i] + 'px, ' + buttonY + 'px)' }">
        <button @click="pressNote(i)">{{ label }}</button>
      </div>
    </div>
  `,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
  },
  data() {
    return {
      lines: [0, 0, 0, 0],
      notes: [],
      gameHeight: 0,
      gameWidth: 0,
      lineX: [],
      notePressed: 5,
      noteCounter: 0,
      maxNotes: 25,
      noteId: 0,
      lastFrameTime: performance.now(),
    };
  },
  computed: {
    buttonY() {
      return this.gameHeight - 50;
    },
  },
  methods: {
    initGame() {
      const el = this.$refs.gameContainer;
      this.gameHeight = el.clientHeight - 50;
      this.gameWidth = el.clientWidth - 50;

      const x = Math.floor(this.gameWidth / 5);
      this.lines = [x - 50, 2 * x - 25, 3 * x, 4 * x + 25];

      this.spawnNotes();
      requestAnimationFrame(this.gameLoop);
    },
    spawnNotes() {
      if (this.noteCounter >= this.maxNotes) return;
      const line = Math.floor(Math.random() * 4);
      this.createNote(line);
      this.noteCounter++;
      setTimeout(this.spawnNotes, 2000);
    },
    createNote(line) {
      const id = this.noteId++;
      const noteClass = ['Note', 'Note2', 'Note3', 'Note4'][line];
      const x = this.lines[line];
      const y = -100;

      const note = { id, line, class: noteClass, x, y };
      this.notes.push(note);
    },
    removeNote(id) {
      this.notes = this.notes.filter(n => n.id !== id);
    },
    pressNote(line) {
      this.notePressed = line;
    },
    gameLoop(timestamp) {
      const delta = (timestamp - this.lastFrameTime) / 1000; // seconds
      this.lastFrameTime = timestamp;

      const speed = 200; // pixels per second

      this.notes.forEach(note => {
        note.y += speed * delta;

        // Check for hit
        if (
          this.notePressed === note.line &&
          note.y >= this.gameHeight - 25 &&
          note.y <= this.gameHeight + 25
        ) {
          this.removeNote(note.id);
          this.notePressed = 5;
        }

        // Out of bounds
        if (note.y > this.gameHeight + 50) {
          this.removeNote(note.id);
        }
      });

      requestAnimationFrame(this.gameLoop);
    },
  },
  mounted() {
    this.initGame();
  },
};