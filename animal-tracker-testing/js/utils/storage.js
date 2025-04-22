export const StorageService = {
  STORAGE_KEY: 'animalTrackerTest',
  TEMPLATES_KEY: 'animalTrackerTemplates',

  // Save test data with auto-save indicator
  saveTest(data) {
    try {
      const saveData = {
        ...data,
        metadata: {
          ...data.metadata,
          lastSaved: new Date().toISOString(),
        },
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
      this.showSaveIndicator();
      return true;
    } catch (error) {
      console.error('Error saving test:', error);
      return false;
    }
  },

  // Load test data
  loadTest() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Error loading test:', error);
      return null;
    }
  },

  // Save template
  saveTemplate(template) {
    try {
      const templates = this.loadTemplates();
      templates.push({
        ...template,
        id: Date.now().toString(),
        created: new Date().toISOString(),
      });
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  },

  // Load all templates
  loadTemplates() {
    try {
      const savedTemplates = localStorage.getItem(this.TEMPLATES_KEY);
      return savedTemplates ? JSON.parse(savedTemplates) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  },

  // Delete template
  deleteTemplate(templateId) {
    try {
      const templates = this.loadTemplates();
      const filteredTemplates = templates.filter((t) => t.id !== templateId);
      localStorage.setItem(
        this.TEMPLATES_KEY,
        JSON.stringify(filteredTemplates)
      );
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  },

  // Show save indicator
  showSaveIndicator() {
    const indicator = document.querySelector('.save-indicator');
    if (!indicator) {
      const newIndicator = document.createElement('div');
      newIndicator.className = 'save-indicator';
      newIndicator.textContent = 'Changes saved';
      document.body.appendChild(newIndicator);

      // Show indicator
      setTimeout(() => {
        newIndicator.classList.add('visible');
      }, 100);

      // Hide indicator
      setTimeout(() => {
        newIndicator.classList.remove('visible');
        setTimeout(() => {
          document.body.removeChild(newIndicator);
        }, 300);
      }, 2000);
    }
  },

  // Clear test data
  clearTest() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing test:', error);
      return false;
    }
  },

  // Backup data to file
  backupData() {
    try {
      const backup = {
        test: this.loadTest(),
        templates: this.loadTemplates(),
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `animal-tracker-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  },

  // Restore from backup
  restoreFromBackup(backupData) {
    try {
      const { test, templates } = JSON.parse(backupData);

      if (test) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(test));
      }

      if (templates) {
        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
      }

      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  },
};
