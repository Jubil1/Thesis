// time.js

// Clock functionality
class Clock {
  constructor() {
    this.timeElement = document.getElementById('current-time');
    this.init();
  }

  init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Update immediately when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateClock();
      }
    });
  }

  updateClock() {
    if (!this.timeElement) return;

    const now = new Date();
    const formattedTime = Utils.formatPhilippineTime(now);

    this.timeElement.textContent = formattedTime;
    this.timeElement.setAttribute('datetime', now.toISOString());
  }
}
