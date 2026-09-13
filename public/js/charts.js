/**
 * HealthyLife – Chart.js chart builders.
 * Uses the green/teal theme palette for consistency.
 */

const Charts = {
  instances: {},

  palette: {
    green: '#15803d',
    teal: '#0d9488',
    fill: 'rgba(13, 148, 136, 0.15)',
    grid: 'rgba(0,0,0,0.05)',
    ink: '#4b6157'
  },

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  baseOptions(unit) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14532d',
          padding: 10,
          callbacks: unit ? { label: (c) => `${c.parsed.y} ${unit}` } : {}
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: this.palette.ink } },
        y: {
          beginAtZero: true,
          grid: { color: this.palette.grid },
          ticks: { color: this.palette.ink }
        }
      }
    };
  },

  labels7() {
    return lastNDays(7).map(weekdayShort);
  },

  water() {
    this.destroy('water');
    const el = document.getElementById('chart-water');
    if (!el) return;
    this.instances.water = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.labels7(),
        datasets: [{
          data: HealthData.waterSeries(7),
          backgroundColor: this.palette.teal,
          borderRadius: 6
        }]
      },
      options: this.baseOptions('glasses')
    });
  },

  sleep() {
    this.destroy('sleep');
    const el = document.getElementById('chart-sleep');
    if (!el) return;
    const data = HealthData.sleepSeries(7).map((v) => (v === null ? 0 : v));
    this.instances.sleep = new Chart(el, {
      type: 'line',
      data: {
        labels: this.labels7(),
        datasets: [{
          data,
          borderColor: this.palette.green,
          backgroundColor: this.palette.fill,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: this.palette.green
        }]
      },
      options: this.baseOptions('h')
    });
  },

  activity() {
    this.destroy('activity');
    const el = document.getElementById('chart-activity');
    if (!el) return;
    this.instances.activity = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.labels7(),
        datasets: [{
          data: HealthData.activitySeries(7),
          backgroundColor: this.palette.green,
          borderRadius: 6
        }]
      },
      options: this.baseOptions('min')
    });
  },

  mood() {
    this.destroy('mood');
    const el = document.getElementById('chart-mood');
    if (!el) return;
    const data = HealthData.moodSeries(7).map((v) => (v === null ? null : v));
    this.instances.mood = new Chart(el, {
      type: 'line',
      data: {
        labels: this.labels7(),
        datasets: [{
          data,
          borderColor: this.palette.teal,
          backgroundColor: this.palette.fill,
          fill: false,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: this.palette.teal,
          spanGaps: true
        }]
      },
      options: {
        ...this.baseOptions(),
        scales: {
          x: { grid: { display: false }, ticks: { color: this.palette.ink } },
          y: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              color: this.palette.ink,
              callback: (v) => {
                const labels = { 1: 'Rough', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
                return labels[v] || '';
              }
            },
            grid: { color: this.palette.grid }
          }
        }
      }
    });
  },

  activityWeek() {
    this.destroy('activityWeek');
    const el = document.getElementById('chart-activity-week');
    if (!el) return;
    this.instances.activityWeek = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.labels7(),
        datasets: [
          {
            label: 'Workout minutes',
            data: HealthData.activitySeries(7),
            backgroundColor: this.palette.green,
            borderRadius: 6
          }
        ]
      },
      options: {
        ...this.baseOptions('min'),
        plugins: {
          legend: { display: true, labels: { color: this.palette.ink, boxWidth: 14 } },
          tooltip: { backgroundColor: '#14532d', padding: 10 }
        }
      }
    });
  },

  refreshDashboard() {
    this.water();
    this.sleep();
    this.activity();
    this.mood();
  }
};
