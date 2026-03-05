// Utility function for formatting Philippine time
const Utils = {
  formatPhilippineTime: (date) => {
    const options = {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    const weekday = parts.find(part => part.type === 'weekday').value;
    const month = parts.find(part => part.type === 'month').value;
    const day = parts.find(part => part.type === 'day').value;
    const year = parts.find(part => part.type === 'year').value;
    const hour = parts.find(part => part.type === 'hour').value;
    const minute = parts.find(part => part.type === 'minute').value;
    const second = parts.find(part => part.type === 'second').value;
    const dayPeriod = parts.find(part => part.type === 'dayPeriod').value;

    return `${weekday} | ${month} ${day}, ${year} | ${hour}:${minute}:${second} ${dayPeriod}`;
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
                func(...args);
        };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};