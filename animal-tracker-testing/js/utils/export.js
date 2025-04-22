export const ExportService = {
  // Generate test summary data
  generateSummary(testData) {
    const summary = {
      tester: testData.metadata.tester,
      date: testData.metadata.date,
      lastSaved: testData.metadata.lastSaved,
      progress: testData.metadata.progress,
      sectionScores: {},
      totalScore: 0,
      totalTests: 0,
      completedTests: 0,
      timeMetrics: {},
    };

    Object.entries(testData.sections).forEach(([sectionId, sectionData]) => {
      const sectionSummary = this.processSectionData(sectionId, sectionData);
      summary.sectionScores[sectionId] = sectionSummary;
      summary.totalTests += sectionSummary.totalTests;
      summary.completedTests += sectionSummary.completedTests;
      if (sectionSummary.averageScore) {
        summary.totalScore += sectionSummary.averageScore;
      }
      if (sectionSummary.totalTime) {
        summary.timeMetrics[sectionId] = sectionSummary.totalTime;
      }
    });

    if (Object.keys(summary.sectionScores).length > 0) {
      summary.totalScore =
        summary.totalScore / Object.keys(summary.sectionScores).length;
    }

    return summary;
  },

  // Process individual section data
  processSectionData(sectionId, sectionData) {
    const summary = {
      totalTests: 0,
      completedTests: 0,
      totalScore: 0,
      averageScore: 0,
      totalTime: 0,
      scores: [],
    };

    Object.entries(sectionData).forEach(([testId, testData]) => {
      summary.totalTests++;

      if (testData.score) {
        summary.scores.push(parseInt(testData.score));
        summary.totalScore += parseInt(testData.score);
        summary.completedTests++;
      }

      if (testData.time) {
        summary.totalTime += this.parseTime(testData.time);
      }
    });

    if (summary.completedTests > 0) {
      summary.averageScore = summary.totalScore / summary.completedTests;
    }

    return summary;
  },

  // Parse time string (mm:ss.000) to milliseconds
  parseTime(timeStr) {
    const [minutes, seconds] = timeStr.split(':');
    const [secs, ms] = seconds.split('.');
    return parseInt(minutes) * 60 * 1000 + parseInt(secs) * 1000 + parseInt(ms);
  },

  // Format milliseconds to time string
  formatTime(ms) {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}.${String(milliseconds).padStart(3, '0')}`;
  },

  // Generate charts data
  generateChartsData(summary) {
    return {
      sectionScores: {
        labels: Object.keys(summary.sectionScores),
        data: Object.values(summary.sectionScores).map((s) => s.averageScore),
      },
      timeMetrics: {
        labels: Object.keys(summary.timeMetrics),
        data: Object.values(summary.timeMetrics).map((t) => t / 1000), // Convert to seconds
      },
      completion: {
        labels: ['Completed', 'Remaining'],
        data: [
          summary.completedTests,
          summary.totalTests - summary.completedTests,
        ],
      },
    };
  },

  // Export to JSON
  exportToJSON(testData) {
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
  },

  // Export to CSV
  exportToCSV(testData) {
    const summary = this.generateSummary(testData);
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add header
    csvContent += 'Section,Test,Score,Time,Notes\n';

    // Add test data
    Object.entries(testData.sections).forEach(([sectionId, sectionData]) => {
      Object.entries(sectionData).forEach(([testId, testData]) => {
        const row = [
          sectionId,
          testId,
          testData.score || '',
          testData.time || '',
          testData.notes ? `"${testData.notes.replace(/"/g, '""')}"` : '',
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `animal-tracker-test-${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default ExportService;
