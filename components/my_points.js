export default {
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; color: var(--e-global-color-text-normal); max-width: 100vw; overflow-x: hidden;">
      <p :style="pointsDescription">Collect Kuku Points daily by scanning! <br> Build up a streak with consecutive daily scans, and earn bonus points as you go. Keep your streak alive for 5 days in a row to maximize your rewards—earning 50 Kuku Points every day when you hit the 5-day streak!</p>
      <h4 :style="pointsHistoryTitle" id="UserPointsHistoryText">Your Kuku's History</h4>
      <div :style="cardContainerStyle">
        <div v-for="(points_data, index) in paginatedPointsData" :key="points_data.id" :style="cardStyle(index)">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <img :src="pluginDirUrl + '/media/plus_points_coin.webp'" style="width: 18px; height: 18px; margin-right: 5px;">
              <span :style="pointsTextStyle(points_data.amount)">{{ points_data.amount }}</span>
            </div>
            <span v-html="formatDateTime(points_data.date)" :style="dateStyle"></span>
          </div>
          <p :style="descriptionStyle">{{ points_data.description }}</p>
        </div>
      </div>
      <div v-if="totalPages > 1" :style="paginationStyle">
        <button @click="prevPage" :disabled="currentPage === 1" style="margin-right: 10px;">Previous</button>
        <span :style="paginationTextStyle">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button @click="nextPage" :disabled="currentPage === totalPages" style="margin-left: 10px;">Next</button>
      </div>
    </div>
  `,
  props: {
    kukudushi: Object,
    pluginDirUrl: String,
  },
  data() {
    return {
      points_data_collection: [],
      currentPage: 1,
      rowsPerPage: 15,
    };
  },
  methods: {
    fetchPointsData() {
      const urlParams = new URLSearchParams(window.location.search);
      let urlString = `${this.pluginDirUrl}backend/get_points_data.php`;
      urlString += `?uid=${this.kukudushi.id}`;

      fetch(urlString)
        .then((response) => response.json())
        .then((data) => {
          if (
            data != null &&
            data.points_data != null &&
            data.points_data.length > 0
          ) {
            this.points_data_collection = data.points_data;
            this.currentPage = 1;
          }
        })
        .catch((error) => {
          console.error('Error fetching points: ', error);
        });
    },
    formatDateTime(datetime) {
      const [date, time] = datetime.split(' ');
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);

      const curacaoUTCDate = new Date(
        Date.UTC(year, month - 1, day, hour + 4, minute)
      );

      const localDate = new Date(
        curacaoUTCDate.toLocaleString('en-US', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      );

      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };

      return `<strong>${new Intl.DateTimeFormat('default', options).format(
        localDate
      )}</strong>`;
    },
    pointsTextStyle(amount) {
      return {
        fontWeight: 'bold',
        color:
          amount >= 0
            ? 'var(--e-global-color-accent)'
            : 'var(--e-global-color-primary)',
        fontSize: '1em',
      };
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage += 1;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
      }
    },
  },
  watch: {
    kukudushi: {
      handler(newValue) {
        if (newValue && newValue.id) {
          this.fetchPointsData();
        }
      },
      immediate: true,
    },
  },
  computed: {
    paginatedPointsData() {
      const start = (this.currentPage - 1) * this.rowsPerPage;
      const end = start + this.rowsPerPage;
      return this.points_data_collection.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.points_data_collection.length / this.rowsPerPage);
    },
    cardContainerStyle() {
      return {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
      };
    },
    cardStyle() {
      return (index) => ({
        backgroundColor: index % 2 === 0 ? '#f7f7f7' : '#ffffff',
        borderRadius: '10px',
        padding: '15px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      });
    },
    dateStyle() {
      return {
        fontSize: '0.9em',
        color: 'var(--e-global-color-text-normal)',
      };
    },
    descriptionStyle() {
      return {
        marginTop: '10px',
        fontSize: '0.9em',
        color: 'var(--e-global-color-primary)',
      };
    },
    pointsDescription() {
      return {
        textAlign: 'center',
        margin: '20px 0',
        fontSize: '1em',
        fontWeight: '500',
        color: 'var(--e-global-color-primary)',
      };
    },
    pointsHistoryTitle() {
      return {
        margin: '10px 0',
        fontSize: '1.1em',
        fontWeight: 'bold',
        color: 'var(--e-global-color-primary)',
      };
    },
    paginationStyle() {
      return {
        display: 'flex',
        alignItems: 'center',
        marginTop: '15px',
      };
    },
    paginationTextStyle() {
      return {
        color: 'var(--e-global-color-accent)',
        fontWeight: '600',
        fontSize: '0.9em',
      };
    },
  },
};
