// formPersistence.js
export const formPersistenceMixin = {
  methods: {
    saveFormState(formData) {
      if (!this.kukudushi?.exists) {
        const storageKey = `kukudushi_form_${this.kukudushi.id}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: formData,
          })
        );
      }
    },

    loadFormState() {
      if (!this.kukudushi?.exists) {
        const storageKey = `kukudushi_form_${this.kukudushi.id}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState) {
          const { timestamp, data } = JSON.parse(savedState);
          // Clear data older than 24 hours
          if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(storageKey);
            return null;
          }
          return data;
        }
      }
      return null;
    },

    clearFormState() {
      if (!this.kukudushi?.exists) {
        const storageKey = `kukudushi_form_${this.kukudushi.id}`;
        localStorage.removeItem(storageKey);
      }
    },
  },
};
