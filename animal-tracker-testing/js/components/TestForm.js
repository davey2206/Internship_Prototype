const TestForm = {
  template: `
    <div class="test-form">
      <!-- Header with tester info -->
      <div class="form-header">
        <h1>Animal Tracker Testing</h1>
        <div class="tester-info">
          <div class="form-group">
            <label for="testerName">Tester Name:</label>
            <input 
              id="testerName"
              v-model="testData.metadata.tester.name"
              type="text"
              @change="autoSave"
            >
          </div>
          <div class="form-group">
            <label for="device">Device:</label>
            <input 
              id="device"
              v-model="testData.metadata.tester.device"
              type="text"
              @change="autoSave"
            >
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="os">Operating System:</label>
              <input 
                id="os"
                v-model="testData.metadata.tester.os"
                type="text"
                @change="autoSave"
              >
            </div>
            <div class="form-group">
              <label for="browser">Browser:</label>
              <select 
                id="browser"
                v-model="testData.metadata.tester.browser"
                @change="autoSave"
              >
                <option value="chrome">Google Chrome</option>
                <option value="firefox">Firefox</option>
                <option value="safari">Safari</option>
                <option value="samsung">Samsung Browser</option>
              </select>
            </div>
            <div class="form-group">
              <label for="browserVersion">Browser Version:</label>
              <input 
                id="browserVersion"
                v-model="testData.metadata.tester.browserVersion"
                type="text"
                @change="autoSave"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress Overview -->
      <div class="progress-overview">
        <h2>Overall Progress</h2>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: totalProgress + '%' }"
          ></div>
          <span class="progress-text">{{ totalProgress }}% Complete</span>
        </div>
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">Completed Tests:</span>
            <span class="stat-value">{{ totalCompletedTests }}/{{ totalTests }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Sections Started:</span>
            <span class="stat-value">{{ startedSections }}/{{ totalSections }}</span>
          </div>
        </div>
      </div>

      <!-- Test sections -->
      <div class="test-sections">
        <test-section
          v-for="(section, index) in sections"
          :key="index"
          :section="section"
          :section-data="getSectionData(section.id)"
          @update:section="updateSection"
        ></test-section>
      </div>

      <!-- Action buttons -->
      <div class="form-actions">
        <button class="btn btn-save" @click="saveTest">Save Progress</button>
        <button class="btn btn-export" @click="exportTest">Export Test</button>
      </div>

      <!-- Last saved indicator -->
      <div class="last-saved" v-if="lastSaved">
        Last saved: {{ formatDate(lastSaved) }}
      </div>
    </div>
  `,

  props: {
    testData: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      lastSaved: null,
      autoSaveInterval: null,
      sections: [
        {
          id: 'core-map',
          title: '1. Core Map Interface',
          description: 'Test the basic map functionality and loading',
          subsections: [
            {
              id: 'initial-loading',
              title: 'Initial Loading',
              tests: [
                {
                  id: 'globe-load',
                  title: 'World Globe Load Time',
                  type: 'time-score',
                  description:
                    'Measure the time taken for the initial globe to appear and be interactive',
                },
              ],
            },
            {
              id: 'navigation-controls',
              title: 'Navigation Controls',
              tests: [
                {
                  id: 'zoom-controls',
                  title: 'Zoom In/Out Buttons',
                  type: 'checklist',
                  items: [
                    'Zoom in button works correctly',
                    'Zoom out button works correctly',
                    'Smooth zoom transition',
                  ],
                },
                {
                  id: 'center-globe',
                  title: 'Center Globe Button',
                  type: 'checklist',
                  items: [
                    'Centers the view correctly',
                    'Smooth transition to center',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'animal-markers',
          title: '2. Animal Markers & Tracking',
          description: 'Test animal marker functionality and tracking features',
          subsections: [
            {
              id: 'marker-visibility',
              title: 'Marker Visibility',
              tests: [
                {
                  id: 'marker-display',
                  title: 'Individual Animal Markers',
                  type: 'checklist',
                  items: [
                    'Markers visible on map',
                    'Unowned animals show lock icon',
                    'Correct position on globe',
                  ],
                },
                {
                  id: 'marker-grouping',
                  title: 'Marker Grouping',
                  type: 'checklist',
                  items: [
                    'Markers group at lower zoom levels',
                    'Markers ungroup when zooming in',
                    'Smooth grouping transition',
                  ],
                },
                {
                  id: 'marker-culling',
                  title: 'Marker Visibility Culling',
                  type: 'pass-fail',
                  description:
                    'Markers should disappear when on the other side of the globe',
                },
              ],
            },
            {
              id: 'tracking-features',
              title: 'Tracking Features',
              tests: [
                {
                  id: 'track-lines',
                  title: 'Animal Track Lines',
                  type: 'checklist',
                  items: [
                    'Track lines visible',
                    'Correct path display',
                    'Smooth line rendering',
                  ],
                },
                {
                  id: 'location-indicators',
                  title: 'Location Indicators',
                  type: 'checklist',
                  items: [
                    'First location marker visible',
                    'Last location marker visible',
                    'Location dots along track visible',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'care-center',
          title: '3. Animal Care Center',
          description: 'Test the Animal Care Center menu functionality',
          subsections: [
            {
              id: 'menu-mechanics',
              title: 'Menu Mechanics',
              tests: [
                {
                  id: 'menu-operation',
                  title: 'Opening/Closing',
                  type: 'checklist',
                  items: [
                    'Menu opens smoothly',
                    'Menu closes smoothly',
                    'Transition animations work',
                  ],
                },
              ],
            },
            {
              id: 'menu-tabs',
              title: 'Menu Tabs',
              tests: [
                {
                  id: 'animals-tab',
                  title: 'Animals Tab',
                  type: 'checklist',
                  items: [
                    'Shows owned animals',
                    'Shows available animals',
                    'Correct information display',
                  ],
                },
                {
                  id: 'kukus-tab',
                  title: 'My Kukus Tab',
                  type: 'checklist',
                  items: [
                    'Points history visible',
                    'Correct point calculations',
                    'History properly sorted',
                  ],
                },
                {
                  id: 'donate-tab',
                  title: 'Donate Tab',
                  type: 'checklist',
                  items: [
                    'Tab accessible',
                    'Future functionality noted',
                    'No broken features',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'animal-info',
          title: '4. Animal Information Window',
          description:
            'Test the animal information window functionality and display',
          subsections: [
            {
              id: 'window-behavior',
              title: 'Window Behavior',
              tests: [
                {
                  id: 'window-mechanics',
                  title: 'Opening/Closing Behavior',
                  type: 'checklist',
                  items: [
                    'Window opens smoothly',
                    'Window closes properly',
                    'Transition animations work correctly',
                  ],
                },
              ],
            },
            {
              id: 'info-tabs',
              title: 'Information Tabs',
              tests: [
                {
                  id: 'info-tab',
                  title: 'Info Tab Content',
                  type: 'checklist',
                  items: [
                    'Stats display correctly',
                    'Measurements show accurately',
                    'Conservation status visible',
                  ],
                },
                {
                  id: 'story-tab',
                  title: 'Story Tab',
                  type: 'checklist',
                  items: [
                    'Animal background story displays',
                    'Text formatting correct',
                    'Content loads properly',
                  ],
                },
                {
                  id: 'fun-facts-tab',
                  title: 'Fun Facts Tab',
                  type: 'checklist',
                  items: [
                    'Facts display correctly',
                    'Facts change daily',
                    'Content updates properly',
                  ],
                },
              ],
            },
            {
              id: 'visual-elements',
              title: 'Visual Elements',
              tests: [
                {
                  id: 'animal-image',
                  title: 'Animal Image Display',
                  type: 'checklist',
                  items: [
                    'Image loads correctly',
                    'Proper sizing and scaling',
                    'Image quality maintained',
                  ],
                },
                {
                  id: 'location-info',
                  title: 'Location Information',
                  type: 'checklist',
                  items: [
                    'Date/time alignment correct',
                    'Location data accurate',
                    'Updates periodically',
                    'Timezone handling correct',
                  ],
                },
                {
                  id: 'physical-chars',
                  title: 'Physical Characteristics',
                  type: 'checklist',
                  items: [
                    'Data alignment correct',
                    'All characteristics display',
                    'Units shown correctly',
                  ],
                },
                {
                  id: 'life-stage',
                  title: 'Life Stage Indicator',
                  type: 'checklist',
                  items: [
                    'Indicator displays properly',
                    'Progress shown accurately',
                    'Stage transitions work',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'gesture-nav',
          title: '5. Gesture Navigation',
          description: 'Test touch gesture controls and responsiveness',
          subsections: [
            {
              id: 'basic-gestures',
              title: 'Basic Gestures',
              tests: [
                {
                  id: 'single-finger-pan',
                  title: 'Single Finger Drag/Pan',
                  type: 'time-score',
                  description: 'Test panning response and accuracy',
                  scoreGuide: {
                    10: 'Perfect response and accuracy',
                    '7-9': 'Good response with minor issues',
                    '4-6': 'Noticeable lag or inaccuracy',
                    '1-3': 'Significant problems',
                  },
                },
                {
                  id: 'pinch-zoom',
                  title: 'Two-finger Pinch Zoom',
                  type: 'time-score',
                  description: 'Test zoom response and smoothness',
                  scoreGuide: {
                    10: 'Smooth and precise zooming',
                    '7-9': 'Minor smoothness issues',
                    '4-6': 'Noticeable stuttering',
                    '1-3': 'Very jerky or unresponsive',
                  },
                },
                {
                  id: 'rotation',
                  title: 'Two-finger Rotation',
                  type: 'time-score',
                  description: 'Test rotation response and accuracy',
                  scoreGuide: {
                    10: 'Perfect rotation control',
                    '7-9': 'Minor control issues',
                    '4-6': 'Inconsistent response',
                    '1-3': 'Poor rotation control',
                  },
                },
                {
                  id: 'tilt',
                  title: 'Two-finger Vertical Drag (Tilt)',
                  type: 'time-score',
                  description: 'Test tilt response and control',
                  scoreGuide: {
                    10: 'Smooth and precise tilting',
                    '7-9': 'Slight control issues',
                    '4-6': 'Inconsistent response',
                    '1-3': 'Poor tilt control',
                  },
                },
              ],
            },
            {
              id: 'gesture-conflicts',
              title: 'Gesture Conflicts',
              tests: [
                {
                  id: 'marker-interference',
                  title: 'Marker Interaction Conflicts',
                  type: 'checklist',
                  items: [
                    'Gestures work with finger on marker',
                    'Smooth transition between gestures',
                    'No unintended marker selection',
                  ],
                },
                {
                  id: 'gesture-transitions',
                  title: 'Gesture Transitions',
                  type: 'checklist',
                  items: [
                    'Clean pan to pinch transition',
                    'Smooth gesture switching',
                    'No gesture recognition errors',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'points-system',
          title: '6. Points System',
          description: 'Test points accumulation and management features',
          subsections: [
            {
              id: 'points-earning',
              title: 'Points Earning',
              tests: [
                {
                  id: 'daily-points',
                  title: 'Daily Scan Points',
                  type: 'checklist',
                  items: [
                    'Points awarded correctly',
                    'Daily limit enforced',
                    'Proper point value awarded',
                  ],
                },
                {
                  id: 'streak-building',
                  title: 'Consecutive Day Streak',
                  type: 'checklist',
                  items: [
                    'Streak counts correctly',
                    'Maxes at 5 days',
                    'Resets properly if broken',
                    'Bonus points awarded correctly',
                  ],
                },
                {
                  id: 'points-animation',
                  title: 'Points Award Animation',
                  type: 'checklist',
                  items: [
                    'Animation plays smoothly',
                    'Points value shown correctly',
                    'Animation timing appropriate',
                  ],
                },
              ],
            },
            {
              id: 'points-management',
              title: 'Points Management',
              tests: [
                {
                  id: 'points-history',
                  title: 'Points History',
                  type: 'checklist',
                  items: [
                    'History displays correctly',
                    'All transactions listed',
                    'Dates and amounts accurate',
                  ],
                },
                {
                  id: 'points-display',
                  title: 'Points Balance Display',
                  type: 'checklist',
                  items: [
                    'Current balance accurate',
                    'Updates immediately',
                    'Formatted correctly',
                  ],
                },
                {
                  id: 'points-spending',
                  title: 'Points Spending',
                  type: 'checklist',
                  items: [
                    'Can spend 1000 points for adoption',
                    'Balance updates after spending',
                    'Cannot overspend points',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'adoption-system',
          title: '7. Animal Adoption System',
          description: 'Test the animal adoption workflow and features',
          subsections: [
            {
              id: 'available-animals',
              title: 'Available Animals',
              tests: [
                {
                  id: 'animal-browsing',
                  title: 'Animal Browsing',
                  type: 'checklist',
                  items: [
                    'List loads correctly',
                    'Available animals clearly marked',
                    'Scrolling works smoothly',
                    'Animal details displayed properly',
                  ],
                },
                {
                  id: 'preview-display',
                  title: 'Preview vs Full Display',
                  type: 'checklist',
                  items: [
                    'Preview cards show limited info',
                    'Owned animals show full details',
                    'Clear visual distinction',
                    '"New" badge displays correctly',
                  ],
                },
              ],
            },
            {
              id: 'purchase-process',
              title: 'Purchase Process',
              tests: [
                {
                  id: 'insufficient-points',
                  title: 'Insufficient Points Handling',
                  type: 'checklist',
                  items: [
                    'Clear point requirement message',
                    'Purchase button disabled',
                    'Points needed clearly shown',
                    'Option to earn more points shown',
                  ],
                },
                {
                  id: 'successful-purchase',
                  title: 'Successful Purchase Flow',
                  type: 'checklist',
                  items: [
                    'Points deducted correctly',
                    'Confirmation message shown',
                    'Animal unlocked immediately',
                    'Transition to full tracking view',
                  ],
                },
              ],
            },
            {
              id: 'unlocking-process',
              title: 'Unlocking Process',
              tests: [
                {
                  id: 'unlock-transition',
                  title: 'Unlock Animation/Transition',
                  type: 'checklist',
                  items: [
                    'Smooth unlock animation',
                    'Lock icon removed properly',
                    'New badge appears correctly',
                    'Transition to full tracking view',
                  ],
                },
                {
                  id: 'post-unlock',
                  title: 'Post-Unlock Features',
                  type: 'checklist',
                  items: [
                    'Full tracking enabled',
                    'All features accessible',
                    'History tracking begins',
                    'Collection status updated',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'tutorial-system',
          title: '8. Tutorial System',
          description:
            'Test the first-time user experience and tutorial features',
          subsections: [
            {
              id: 'first-time-exp',
              title: 'First-Time Experience',
              tests: [
                {
                  id: 'initial-guidance',
                  title: 'Initial User Guidance',
                  type: 'checklist',
                  items: [
                    'Tutorial starts automatically',
                    'Clear initial instructions',
                    'Skip option available',
                    'Progress indicator visible',
                  ],
                },
                {
                  id: 'tutorial-flow',
                  title: 'Tutorial Flow',
                  type: 'checklist',
                  items: [
                    'Logical step progression',
                    'Clear instructions at each step',
                    'User can navigate back/forward',
                    'All key features covered',
                  ],
                },
              ],
            },
            {
              id: 'interactive-elements',
              title: 'Interactive Elements',
              tests: [
                {
                  id: 'element-highlighting',
                  title: 'UI Element Highlighting',
                  type: 'checklist',
                  items: [
                    'Correct elements highlighted',
                    'Clear visual emphasis',
                    'Highlight follows steps',
                    'No UI conflicts',
                  ],
                },
                {
                  id: 'gesture-tutorials',
                  title: 'Gesture Tutorials',
                  type: 'checklist',
                  items: [
                    'Clear gesture animations',
                    'Practice opportunities provided',
                    'Feedback on success/failure',
                    'All gestures covered',
                  ],
                },
              ],
            },
            {
              id: 'tutorial-completion',
              title: 'Tutorial Completion',
              tests: [
                {
                  id: 'completion-handling',
                  title: 'Completion Process',
                  type: 'checklist',
                  items: [
                    'Success message shown',
                    'All steps completed flag set',
                    'Return to main interface',
                    'Tutorial access in menu',
                  ],
                },
                {
                  id: 'tutorial-retention',
                  title: 'Tutorial State Retention',
                  type: 'checklist',
                  items: [
                    'Progress saved properly',
                    'Completed state remembered',
                    'Can resume if interrupted',
                    'Reset option available',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'notification-system',
          title: '9. Notification System',
          description: 'Test the notification and messaging features',
          subsections: [
            {
              id: 'welcome-notifications',
              title: 'Welcome Messages',
              tests: [
                {
                  id: 'new-user-welcome',
                  title: 'New User Welcome',
                  type: 'checklist',
                  items: [
                    'Welcome message appears',
                    'Proper timing',
                    'Clear content',
                    'One-time only display',
                  ],
                },
              ],
            },
            {
              id: 'points-notifications',
              title: 'Points Notifications',
              tests: [
                {
                  id: 'points-awarded',
                  title: 'Points Awarded Messages',
                  type: 'checklist',
                  items: [
                    'Shows correct amount',
                    'Clear visibility',
                    'Proper timing',
                    'Stacks appropriately',
                  ],
                },
                {
                  id: 'streak-notifications',
                  title: 'Streak Notifications',
                  type: 'checklist',
                  items: [
                    'Daily streak progress shown',
                    'Milestone notifications',
                    'Streak break warnings',
                    'Clear messaging',
                  ],
                },
              ],
            },
            {
              id: 'system-notifications',
              title: 'System Notifications',
              tests: [
                {
                  id: 'purchase-notifications',
                  title: 'Purchase Notifications',
                  type: 'checklist',
                  items: [
                    'Purchase confirmation shown',
                    'Clear success/failure message',
                    'Points balance updated',
                    'Proper timing',
                  ],
                },
                {
                  id: 'session-notifications',
                  title: 'Session Notifications',
                  type: 'checklist',
                  items: [
                    'Session expiration warning',
                    'Clear renewal instructions',
                    'Proper timing before expiry',
                    'Handles background/foreground',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'collection-management',
          title: '10. Animal Collection Management',
          description:
            'Test the animal collection interface and management features',
          subsections: [
            {
              id: 'owned-animals-display',
              title: 'Owned Animals Display',
              tests: [
                {
                  id: 'display-layout',
                  title: 'Display Layout',
                  type: 'checklist',
                  items: [
                    'Proper alignment of elements',
                    'Correct data displayed',
                    'Consistent formatting',
                    'Responsive layout',
                  ],
                },
                {
                  id: 'scrolling-behavior',
                  title: 'Scrolling Behavior',
                  type: 'checklist',
                  items: [
                    'Smooth vertical scrolling',
                    'Proper horizontal species container scrolling',
                    'No visual glitches',
                    'Maintains performance with many animals',
                  ],
                },
              ],
            },
            {
              id: 'collection-features',
              title: 'Collection Features',
              tests: [
                {
                  id: 'species-filtering',
                  title: 'Species Filtering',
                  type: 'checklist',
                  items: [
                    'Filter controls work correctly',
                    'Instant filter updates',
                    'Clear filter indicators',
                    'Reset filter option',
                  ],
                },
                {
                  id: 'track-visibility',
                  title: 'Track Visibility Control',
                  type: 'checklist',
                  items: [
                    'Toggle controls work',
                    'Visual feedback clear',
                    'All tracks update properly',
                    'State persists correctly',
                  ],
                },
                {
                  id: 'animal-focusing',
                  title: 'Animal Location Focusing',
                  type: 'checklist',
                  items: [
                    'Preview function works',
                    'Track button operates correctly',
                    'Smooth camera transition',
                    'Proper zoom level',
                  ],
                },
              ],
            },
            {
              id: 'collection-progress',
              title: 'Collection Progress',
              tests: [
                {
                  id: 'total-progress',
                  title: 'Total Progress Tracking',
                  type: 'checklist',
                  items: [
                    'Total collected/available count accurate',
                    'Progress updates immediately',
                    'Clear visual representation',
                    'Percentage calculation correct',
                  ],
                },
                {
                  id: 'species-progress',
                  title: 'Species Progress Tracking',
                  type: 'checklist',
                  items: [
                    'Species-specific counts accurate',
                    'Updates with new acquisitions',
                    'Clear per-species progress',
                    'Proper categorization',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'session-management',
          title: '11. Session Management',
          description: 'Test session handling and user authentication',
          subsections: [
            {
              id: 'uid-validation',
              title: 'Kukudushi UID Validation',
              tests: [
                {
                  id: 'url-validation',
                  title: 'URL Parameter Validation',
                  type: 'checklist',
                  items: [
                    'UID extracted correctly',
                    'Invalid UID handled properly',
                    'Error messages clear',
                    'Proper validation timing',
                  ],
                },
                {
                  id: 'temp-id-handling',
                  title: 'Temporary ID Handling',
                  type: 'checklist',
                  items: [
                    'Temp ID processed correctly',
                    'Proper conversion to permanent ID',
                    'Data retention during conversion',
                    'Error handling',
                  ],
                },
              ],
            },
            {
              id: 'session-expiration',
              title: 'Session Expiration',
              tests: [
                {
                  id: 'timeout-handling',
                  title: '24-Hour Timeout',
                  type: 'checklist',
                  items: [
                    'Correct 24-hour timing',
                    'Proper expiration trigger',
                    'Clear user notification',
                    'Data state preserved',
                  ],
                },
                {
                  id: 'reconnection',
                  title: 'Reconnection Handling',
                  type: 'checklist',
                  items: [
                    'Reconnection prompts appear',
                    'Clear instructions provided',
                    'Smooth reconnection process',
                    'State restoration after reconnect',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'performance-technical',
          title: '12. Performance & Technical',
          description: 'Test technical performance and optimization',
          subsections: [
            {
              id: 'map-performance',
              title: 'Map Performance',
              tests: [
                {
                  id: 'loading-performance',
                  title: 'Map Loading Performance',
                  type: 'time-score',
                  description: 'Measure initial map load time and smoothness',
                  scoreGuide: {
                    10: 'Instant load (<2s)',
                    '7-9': 'Fast load (2-4s)',
                    '4-6': 'Moderate load (4-6s)',
                    '1-3': 'Slow load (>6s)',
                  },
                },
                {
                  id: 'marker-efficiency',
                  title: 'Marker Clustering Efficiency',
                  type: 'time-score',
                  description: 'Test marker clustering performance',
                  scoreGuide: {
                    10: 'Smooth clustering, no lag',
                    '7-9': 'Minor lag during clustering',
                    '4-6': 'Noticeable lag',
                    '1-3': 'Severe performance issues',
                  },
                },
              ],
            },
            {
              id: 'animation-performance',
              title: 'Animation Performance',
              tests: [
                {
                  id: 'animation-smoothness',
                  title: 'Animation Smoothness',
                  type: 'time-score',
                  description: 'Test smoothness of all animations',
                  scoreGuide: {
                    10: '60fps consistently',
                    '7-9': 'Minor frame drops',
                    '4-6': 'Noticeable stuttering',
                    '1-3': 'Major performance issues',
                  },
                },
                {
                  id: 'touch-latency',
                  title: 'Touch Response Latency',
                  type: 'time-score',
                  description: 'Measure touch input response time',
                  scoreGuide: {
                    10: 'Instant response (<16ms)',
                    '7-9': 'Quick response (16-33ms)',
                    '4-6': 'Noticeable delay (33-50ms)',
                    '1-3': 'Significant lag (>50ms)',
                  },
                },
              ],
            },
            {
              id: 'resource-usage',
              title: 'Resource Usage',
              tests: [
                {
                  id: 'memory-usage',
                  title: 'Memory Usage',
                  type: 'time-score',
                  description: 'Monitor memory usage with many markers',
                  scoreGuide: {
                    10: 'Efficient memory use',
                    '7-9': 'Moderate memory use',
                    '4-6': 'High memory use',
                    '1-3': 'Memory leaks present',
                  },
                },
                {
                  id: 'network-handling',
                  title: 'Network Request Handling',
                  type: 'checklist',
                  items: [
                    'Efficient request batching',
                    'Proper error handling',
                    'Request throttling works',
                    'Caching implemented',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'cross-platform',
          title: '13. Cross-browser/Platform',
          description:
            'Test compatibility across different browsers and platforms',
          subsections: [
            {
              id: 'browser-compatibility',
              title: 'Mobile Browser Compatibility',
              tests: [
                {
                  id: 'samsung-browser',
                  title: 'Samsung Browser',
                  type: 'checklist',
                  items: [
                    'All features functional',
                    'Correct layout rendering',
                    'Proper touch handling',
                    'Performance acceptable',
                  ],
                },
                {
                  id: 'safari-mobile',
                  title: 'Safari Mobile',
                  type: 'checklist',
                  items: [
                    'All features functional',
                    'Correct layout rendering',
                    'Proper touch handling',
                    'Performance acceptable',
                  ],
                },
                {
                  id: 'chrome-mobile',
                  title: 'Google Chrome Mobile',
                  type: 'checklist',
                  items: [
                    'All features functional',
                    'Correct layout rendering',
                    'Proper touch handling',
                    'Performance acceptable',
                  ],
                },
                {
                  id: 'firefox-mobile',
                  title: 'Firefox Mobile',
                  type: 'checklist',
                  items: [
                    'All features functional',
                    'Correct layout rendering',
                    'Proper touch handling',
                    'Performance acceptable',
                  ],
                },
              ],
            },
            {
              id: 'screen-adaptation',
              title: 'Screen Adaptation',
              tests: [
                {
                  id: 'layout-alignment',
                  title: 'Layout Alignment',
                  type: 'checklist',
                  items: [
                    'Elements properly aligned',
                    'No overlapping components',
                    'Consistent spacing',
                    'Proper margin/padding',
                  ],
                },
                {
                  id: 'text-sizing',
                  title: 'Font Sizes',
                  type: 'checklist',
                  items: [
                    'Text readable on all screens',
                    'Proper scaling across devices',
                    'Consistent font sizes',
                    'No text overflow',
                  ],
                },
                {
                  id: 'visibility',
                  title: 'Element Visibility',
                  type: 'checklist',
                  items: [
                    'No hidden elements',
                    'No partially visible elements',
                    'Clear content boundaries',
                    'Proper scrolling areas',
                  ],
                },
              ],
            },
            {
              id: 'device-specific',
              title: 'Device-specific Features',
              tests: [
                {
                  id: 'orientation',
                  title: 'Screen Orientation',
                  type: 'checklist',
                  items: [
                    'Portrait mode works correctly',
                    'Landscape mode works correctly',
                    'Smooth orientation transitions',
                    'Content properly reorganized',
                  ],
                },
                {
                  id: 'gesture-behavior',
                  title: 'Device-specific Gestures',
                  type: 'checklist',
                  items: [
                    'Device-specific gestures work',
                    'Consistent behavior across devices',
                    'No gesture conflicts',
                    'Proper touch feedback',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'error-handling',
          title: '14. Error Handling',
          description: 'Test error handling and recovery mechanisms',
          subsections: [
            {
              id: 'session-errors',
              title: 'Session Error Recovery',
              tests: [
                {
                  id: 'invalid-session',
                  title: 'Invalid Session Recovery',
                  type: 'checklist',
                  items: [
                    'Clear error message shown',
                    'Recovery options provided',
                    'Data preservation attempt',
                    'Smooth recovery process',
                  ],
                },
              ],
            },
            {
              id: 'network-errors',
              title: 'Network Issues',
              tests: [
                {
                  id: 'connection-interruption',
                  title: 'Network Interruption Handling',
                  type: 'checklist',
                  items: [
                    'Offline mode activated',
                    'Reconnection attempts',
                    'Data preservation',
                    'User notification clear',
                  ],
                },
                {
                  id: 'purchase-errors',
                  title: 'Failed Purchase Recovery',
                  type: 'checklist',
                  items: [
                    'Transaction rollback works',
                    'Points restored properly',
                    'Clear error messaging',
                    'Retry option provided',
                  ],
                },
              ],
            },
            {
              id: 'data-errors',
              title: 'Data Handling',
              tests: [
                {
                  id: 'missing-data',
                  title: 'Missing Data Handling',
                  type: 'checklist',
                  items: [
                    'Graceful fallback display',
                    'Placeholder content shown',
                    'Retry data loading option',
                    'Error logging proper',
                  ],
                },
                {
                  id: 'error-messages',
                  title: 'Error Message Clarity',
                  type: 'checklist',
                  items: [
                    'Messages clear and helpful',
                    'User-friendly language',
                    'Action options provided',
                    'Proper error categorization',
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  },

  computed: {
    progress() {
      // Calculate overall test completion percentage
      let totalTests = 0;
      let completedTests = 0;
      // ... calculation logic
      return Math.round((completedTests / totalTests) * 100);
    },
  },

  methods: {
    countSectionTests(section) {
      return section.subsections.reduce((total, subsection) => {
        return total + subsection.tests.length;
      }, 0);
    },

    countCompletedTests(section, sectionData) {
      if (!sectionData) return 0;

      let completed = 0;
      section.subsections.forEach((subsection) => {
        subsection.tests.forEach((test) => {
          const testData = sectionData[test.id];
          if (this.isTestComplete(test, testData)) {
            completed++;
          }
        });
      });
      return completed;
    },

    isTestComplete(test, testData) {
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

    hasSectionStarted(section, sectionData) {
      if (!sectionData) return false;
      return Object.keys(sectionData).length > 0;
    },

    getSectionData(sectionId) {
      return this.testData.sections[sectionId] || {};
    },

    autoSave() {
      this.saveTest();
      this.lastSaved = new Date();
    },

    updateSection(sectionId, data) {
      if (!this.testData.sections) {
        this.testData.sections = {};
      }
      this.$set(this.testData.sections, sectionId, data);
      this.autoSave();
    },

    saveTest() {
      this.testData.metadata.progress = this.totalProgress;
      this.testData.metadata.lastSaved = new Date().toISOString();
      this.$emit('save', this.testData);
    },

    exportTest() {
      this.$emit('export', this.testData);
    },

    async exportPDF() {
      // Implementation coming in pdf.js
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },
  },
  mounted() {
    // Set up auto-save interval (every 5 minutes)
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 5 * 60 * 1000);

    // Initial save to set up metadata
    this.saveTest();
  },
  beforeDestroy() {
    // Clean up auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  },
};

export default TestForm;
