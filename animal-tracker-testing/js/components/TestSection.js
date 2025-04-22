// TestSection.js
const TestSection = {
  template: `
          <div class="test-section" :class="{ 'expanded': isExpanded }">
              <!-- Section Header -->
              <div class="section-header" @click="toggleExpand">
                  <div class="section-title">
                      <h2>{{ section.title }}</h2>
                      <span class="section-progress">{{ sectionProgress }}% Complete</span>
                  </div>
                  <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
              </div>
  
              <!-- Section Content -->
              <div class="section-content" v-if="isExpanded">
                  <div class="section-description" v-if="section.description">
                      {{ section.description }}
                  </div>
  
                  <!-- Prerequisites if any -->
                  <div class="prerequisites" v-if="section.prerequisites">
                      <h3>Before You Start</h3>
                      <ul>
                          <li v-for="prereq in section.prerequisites" :key="prereq">
                              {{ prereq }}
                          </li>
                      </ul>
                  </div>
  
                  <!-- Subsections -->
                  <div 
                      v-for="subsection in section.subsections" 
                      :key="subsection.id"
                      class="subsection"
                  >
                      <h3>{{ subsection.title }}</h3>
                      
                      <!-- Test Items -->
                      <div 
                          v-for="test in subsection.tests" 
                          :key="test.id" 
                          class="test-item"
                      >
                          <div class="test-header">
                              <h4>{{ test.title }}</h4>
                              <div class="test-description" v-if="test.description">
                                  {{ test.description }}
                              </div>
                          </div>
  
                          <!-- Different types of test inputs -->
                          <div class="test-input">
                              <!-- Time and Score input -->
                              <template v-if="test.type === 'time-score'">
                                  <time-input
                                      :value="getTestValue(test.id, 'time')"
                                      @input="updateTestValue(test.id, 'time', $event)"
                                  />
                                  <score-input
                                      :value="getTestValue(test.id, 'score')"
                                      @input="updateTestValue(test.id, 'score', $event)"
                                      :guide="test.scoreGuide"
                                  />
                              </template>
  
                              <!-- Checklist -->
                              <template v-else-if="test.type === 'checklist'">
                                  <div 
                                      v-for="(item, index) in test.items"
                                      :key="index"
                                      class="checklist-item"
                                  >
                                      <label>
                                          <input 
                                              type="checkbox"
                                              :checked="isItemChecked(test.id, index)"
                                              @change="toggleChecklistItem(test.id, index)"
                                          >
                                          {{ item }}
                                      </label>
                                  </div>
                              </template>
  
                              <!-- Pass/Fail test -->
                              <template v-else-if="test.type === 'pass-fail'">
                                  <div class="pass-fail-buttons">
                                      <button 
                                          :class="{ active: getTestValue(test.id) === 'pass' }"
                                          @click="updateTestValue(test.id, null, 'pass')"
                                      >Pass</button>
                                      <button 
                                          :class="{ active: getTestValue(test.id) === 'fail' }"
                                          @click="updateTestValue(test.id, null, 'fail')"
                                      >Fail</button>
                                  </div>
                              </template>
                          </div>
  
                          <!-- Notes field for each test -->
                          <notes-field
                              :value="getTestNotes(test.id)"
                              @input="updateTestNotes(test.id, $event)"
                          />
                      </div>
                  </div>
              </div>
          </div>
      `,

  props: {
    section: {
      type: Object,
      required: true,
    },
    sectionData: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      isExpanded: false,
    };
  },

  computed: {
    sectionProgress() {
      const totalTests = this.getTotalTests();
      const completedTests = this.getCompletedTests();
      return Math.round((completedTests / totalTests) * 100);
    },
  },

  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },

    getTotalTests() {
      return this.section.subsections.reduce((total, subsection) => {
        return total + subsection.tests.length;
      }, 0);
    },

    getCompletedTests() {
      let completed = 0;
      this.section.subsections.forEach((subsection) => {
        subsection.tests.forEach((test) => {
          if (this.isTestComplete(test)) {
            completed++;
          }
        });
      });
      return completed;
    },

    isTestComplete(test) {
      const testData = this.sectionData[test.id];
      if (!testData) return false;

      switch (test.type) {
        case 'time-score':
          return testData.time && testData.score;
        case 'checklist':
          return testData.items && testData.items.some((item) => item);
        case 'pass-fail':
          return testData.result === 'pass' || testData.result === 'fail';
        default:
          return false;
      }
    },

    getTestValue(testId, field) {
      return this.sectionData[testId]?.[field];
    },

    updateTestValue(testId, field, value) {
      const testData = this.sectionData[testId] || {};
      if (field) {
        testData[field] = value;
      } else {
        testData.result = value;
      }
      this.$emit('update:section', {
        ...this.sectionData,
        [testId]: testData,
      });
    },

    getTestNotes(testId) {
      return this.sectionData[testId]?.notes || '';
    },

    updateTestNotes(testId, notes) {
      this.updateTestValue(testId, 'notes', notes);
    },

    isItemChecked(testId, index) {
      return this.sectionData[testId]?.items?.[index] || false;
    },

    toggleChecklistItem(testId, index) {
      const testData = this.sectionData[testId] || { items: [] };
      if (!testData.items) testData.items = [];
      testData.items[index] = !testData.items[index];
      this.updateTestValue(testId, null, testData);
    },
  },
};

export default TestSection;
