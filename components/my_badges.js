export default {
  template: `
  <div>
    <div v-for="(badgesType, index) in badges" :key="index" class="badges-type-group-container">
      <div class="badges-type-header">
        <div class="badges-type-header-title">{{ badgesType.Name }}</div>
        <span>{{badgesType.Unlocked}}/5 Collected</span>
      </div>
      <div class="badges-list-container-horizontal">
        <div class="badges-list-scrollable">
          <transition-group name="fade-shrink" tag="div" class="horizontal-badges-list">
            <div v-for="(badge, index) in 5" :key="index" class="badges-list-item">
              <div class="list-item-badges-image-container">
                <img
                  class="badges_image"
                  :class="{ 'grayed-out': index >= badgesType.Unlocked }"
                  :src="pluginDirUrl + '/media/badges/' + getBadgeImage(index)"
                >
              </div>
              <div class="badges-track-focus-container" v-if="badgesType.Collected >= badgesType.BadgeRanks[index]">
                {{ badgesType.BadgeRanks[index] }}/{{ badgesType.BadgeRanks[index] }}
              </div>
              <div class="badges-track-focus-container" v-else">
                {{ badgesType.Collected }}/{{ badgesType.BadgeRanks[index] }}
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
`,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
    badges: [],
  },
  computed: {

  },
  methods: {
    getBadgeImage(index) {
      const names = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      return names[index] + '.webp';
    }
  },
};
