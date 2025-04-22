import TestForm from './components/TestForm.js';
import TestSection from './components/TestSection.js';
import { ScoreInput, TimeInput, NotesField } from './components/FormInputs.js';

const { createApp, ref, reactive } = Vue;

const app = createApp({
  setup() {
    const testLoaded = ref(false);
    const testData = reactive({
      metadata: {
        tester: {
          name: '',
          device: '',
          os: '',
          browser: '',
          browserVersion: '',
        },
        date: new Date().toISOString(),
        lastSaved: null,
        progress: 0,
      },
      sections: {},
      notes: {},
    });

    // Initialize from localStorage if exists
    const loadTest = () => {
      const savedTest = localStorage.getItem('animalTrackerTest');
      if (savedTest) {
        const parsed = JSON.parse(savedTest);
        Object.assign(testData, parsed);
        testLoaded.value = true;
      }
    };

    const startNewTest = () => {
      testLoaded.value = true;
      // Initialize empty test data
      Object.assign(testData, {
        metadata: {
          tester: {
            name: '',
            device: '',
            os: '',
            browser: '',
            browserVersion: '',
          },
          date: new Date().toISOString(),
          lastSaved: null,
          progress: 0,
        },
        sections: {},
        notes: {},
      });
    };

    const saveTest = () => {
      testData.metadata.lastSaved = new Date().toISOString();
      localStorage.setItem('animalTrackerTest', JSON.stringify(testData));
    };

    const exportTest = () => {
      const dataStr = JSON.stringify(testData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `animal-tracker-test-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const importTest = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            const imported = JSON.parse(text);
            Object.assign(testData, imported);
            testLoaded.value = true;
            saveTest(); // Save imported test to localStorage
          } catch (err) {
            alert('Error importing test file: ' + err.message);
          }
        }
      };

      input.click();
    };

    // Auto-save every 5 minutes
    setInterval(saveTest, 5 * 60 * 1000);

    // Load test data on mount if exists
    loadTest();

    return {
      testLoaded,
      testData,
      startNewTest,
      saveTest,
      exportTest,
      importTest,
    };
  },
});

// Register components
app.component('test-form', TestForm);
app.component('test-section', TestSection);
app.component('score-input', ScoreInput);
app.component('time-input', TimeInput);
app.component('notes-field', NotesField);

app.mount('#app');
