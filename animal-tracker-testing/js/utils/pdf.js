import ExportService from './export.js';

export const PDFService = {
  // Generate PDF report
  async generatePDF(testData) {
    const summary = ExportService.generateSummary(testData);
    const chartsData = ExportService.generateChartsData(summary);

    // Create charts
    const charts = await this.createCharts(chartsData);

    // Create content for PDF
    const content = this.createPDFContent(testData, summary, charts);

    // PDF options
    const opt = {
      margin: 10,
      filename: `animal-tracker-test-${new Date().toISOString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // Generate PDF
    await html2pdf().set(opt).from(content).save();
  },

  // Create charts using Chart.js
  async createCharts(chartsData) {
    const chartsContainer = document.createElement('div');
    chartsContainer.style.display = 'none';
    document.body.appendChild(chartsContainer);

    const charts = {
      radar: await this.createRadarChart(
        chartsData.sectionScores,
        chartsContainer
      ),
      time: await this.createTimeChart(chartsData.timeMetrics, chartsContainer),
      completion: await this.createCompletionChart(
        chartsData.completion,
        chartsContainer
      ),
    };

    document.body.removeChild(chartsContainer);
    return charts;
  },

  // Create radar chart for section scores
  async createRadarChart(data, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    container.appendChild(canvas);

    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Section Scores',
            data: data.data,
            backgroundColor: 'rgba(15, 156, 185, 0.2)',
            borderColor: 'rgba(15, 156, 185, 1)',
            pointBackgroundColor: 'rgba(15, 156, 185, 1)',
            pointRadius: 4,
          },
        ],
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 2,
            },
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for render
    const dataUrl = canvas.toDataURL();
    container.removeChild(canvas);
    return dataUrl;
  },

  // Create line chart for time metrics
  async createTimeChart(data, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    container.appendChild(canvas);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Time (seconds)',
            data: data.data,
            borderColor: 'rgba(31, 88, 174, 1)',
            tension: 0.4,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const dataUrl = canvas.toDataURL();
    container.removeChild(canvas);
    return dataUrl;
  },

  // Create doughnut chart for completion status
  async createCompletionChart(data, container) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    container.appendChild(canvas);

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: [
              'rgba(15, 156, 185, 0.8)',
              'rgba(185, 185, 185, 0.4)',
            ],
          },
        ],
      },
      options: {
        cutout: '70%',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const dataUrl = canvas.toDataURL();
    container.removeChild(canvas);
    return dataUrl;
  },

  // Create HTML content for PDF
  createPDFContent(testData, summary, charts) {
    const container = document.createElement('div');
    container.className = 'pdf-container';

    // Add header
    container.innerHTML += `
      <div class="pdf-header">
        <h1>Animal Tracker Test Report</h1>
        <div class="metadata">
          <p><strong>Tester:</strong> ${summary.tester.name}</p>
          <p><strong>Device:</strong> ${summary.tester.device}</p>
          <p><strong>Browser:</strong> ${summary.tester.browser} ${
      summary.tester.browserVersion
    }</p>
          <p><strong>Date:</strong> ${new Date(
            summary.date
          ).toLocaleDateString()}</p>
          <p><strong>Last Saved:</strong> ${new Date(
            summary.lastSaved
          ).toLocaleString()}</p>
        </div>
      </div>
    `;

    // Add overview section
    container.innerHTML += `
      <div class="pdf-section">
        <h2>Overview</h2>
        <div class="overview-grid">
          <div class="overview-item">
            <h3>Completion Status</h3>
            <img src="${charts.completion}" alt="Completion Chart" />
            <p>Completed: ${summary.completedTests} of ${
      summary.totalTests
    } tests</p>
          </div>
          <div class="overview-item">
            <h3>Overall Score</h3>
            <div class="score-display">${summary.totalScore.toFixed(1)}</div>
            <p>Average across all sections</p>
          </div>
        </div>
      </div>
    `;

    // Add performance analysis
    container.innerHTML += `
      <div class="pdf-section">
        <h2>Performance Analysis</h2>
        <div class="chart-grid">
          <div class="chart-item">
            <h3>Section Scores</h3>
            <img src="${charts.radar}" alt="Section Scores Chart" />
          </div>
          <div class="chart-item">
            <h3>Time Metrics</h3>
            <img src="${charts.time}" alt="Time Metrics Chart" />
          </div>
        </div>
      </div>
    `;

    // Add detailed results
    container.innerHTML += `
      <div class="pdf-section">
        <h2>Detailed Results</h2>
        ${this.createDetailedResults(testData)}
      </div>
    `;

    // Apply PDF styles
    container.innerHTML += `
      <style>
        .pdf-container {
          font-family: Arial, sans-serif;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .metadata {
          text-align: left;
          margin: 20px 0;
        }
        .pdf-section {
          margin-bottom: 40px;
        }
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .score-display {
          font-size: 48px;
          font-weight: bold;
          color: #0F9CB9;
          text-align: center;
          margin: 20px 0;
        }
        .detailed-results {
          margin-top: 20px;
        }
        .test-item {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
      </style>
    `;

    return container;
  },

  // Create detailed results HTML
  createDetailedResults(testData) {
    let html = '<div class="detailed-results">';

    Object.entries(testData.sections).forEach(([sectionId, sectionData]) => {
      html += `
        <div class="section-result">
          <h3>${sectionId}</h3>
      `;

      Object.entries(sectionData).forEach(([testId, testData]) => {
        html += `
          <div class="test-item">
            <p><strong>${testId}</strong></p>
            ${testData.score ? `<p>Score: ${testData.score}/10</p>` : ''}
            ${testData.time ? `<p>Time: ${testData.time}</p>` : ''}
            ${testData.notes ? `<p>Notes: ${testData.notes}</p>` : ''}
          </div>
        `;
      });

      html += '</div>';
    });

    html += '</div>';
    return html;
  },
};
