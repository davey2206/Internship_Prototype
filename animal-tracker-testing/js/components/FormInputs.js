export const ScoreInput = {
  template: `
        <div class="score-input">
            <div class="score-select">
                <select 
                    :value="value" 
                    @input="$emit('input', $event.target.value)"
                    :class="scoreClass"
                >
                    <option value="">Select score</option>
                    <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
                </select>
            </div>
            <div class="score-guide" v-if="guide">
                <button 
                    type="button" 
                    class="guide-toggle"
                    @click="showGuide = !showGuide"
                >
                    Scoring Guide (?)
                </button>
                <div class="guide-popup" v-if="showGuide">
                    <div class="guide-content">
                        <div v-for="(desc, score) in guide" :key="score" class="guide-item">
                            <strong>{{ score }}:</strong> {{ desc }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
  props: {
    value: {
      type: [String, Number],
      default: '',
    },
    guide: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      showGuide: false,
    };
  },
  computed: {
    scoreClass() {
      if (!this.value) return '';
      const score = Number(this.value);
      if (score >= 8) return 'score-high';
      if (score >= 5) return 'score-medium';
      return 'score-low';
    },
  },
};

// Time Input Component
export const TimeInput = {
  template: `
        <div class="time-input">
            <input 
                type="text" 
                :value="formattedValue"
                @input="handleInput"
                placeholder="mm:ss.000"
                pattern="[0-9]{2}:[0-5][0-9].[0-9]{3}"
                title="Format: mm:ss.000"
            >
            <div class="time-controls">
                <button @click="startTimer" :disabled="isRunning">Start</button>
                <button @click="stopTimer" :disabled="!isRunning">Stop</button>
                <button @click="resetTimer" :disabled="isRunning">Reset</button>
            </div>
            <div class="current-time" v-if="isRunning">
                {{ currentTimeFormatted }}
            </div>
        </div>
    `,
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isRunning: false,
      startTime: null,
      currentTime: 0,
      timerInterval: null,
    };
  },
  computed: {
    formattedValue() {
      if (!this.value) return '';
      // Ensure the value is in mm:ss.000 format
      const match = this.value.match(/^(\d+):(\d{2})\.(\d{3})$/);
      if (!match) return this.value;
      return this.value;
    },
    currentTimeFormatted() {
      const time = Math.floor(this.currentTime / 1000);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      const milliseconds = this.currentTime % 1000;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
        2,
        '0'
      )}.${String(milliseconds).padStart(3, '0')}`;
    },
  },
  methods: {
    handleInput(event) {
      const value = event.target.value;
      // Validate time format
      if (value === '' || /^\d{2}:\d{2}\.\d{3}$/.test(value)) {
        this.$emit('input', value);
      }
    },
    startTimer() {
      this.isRunning = true;
      this.startTime = Date.now() - (this.currentTime || 0);
      this.timerInterval = setInterval(() => {
        this.currentTime = Date.now() - this.startTime;
      }, 10);
    },
    stopTimer() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.$emit('input', this.currentTimeFormatted);
    },
    resetTimer() {
      this.currentTime = 0;
      this.$emit('input', '00:00.000');
    },
  },
  beforeUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
};

// Notes Field Component
export const NotesField = {
  template: `
        <div class="notes-field">
            <textarea
                :value="value"
                @input="$emit('input', $event.target.value)"
                placeholder="Add notes or observations here..."
                rows="3"
                class="notes-textarea"
            ></textarea>
            <div class="notes-footer" v-if="value">
                <span class="notes-timestamp">Last updated: {{ lastUpdateFormatted }}</span>
            </div>
        </div>
    `,
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      lastUpdate: null,
    };
  },
  watch: {
    value() {
      this.lastUpdate = new Date();
    },
  },
  computed: {
    lastUpdateFormatted() {
      if (!this.lastUpdate) return '';
      return this.lastUpdate.toLocaleString();
    },
  },
};
