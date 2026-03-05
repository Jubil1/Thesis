// nav.js


// Navigation class
class Navigation {
  constructor() {
    this.navLinks = document.querySelectorAll('.nav-link');
    this.sections = Array.from(this.navLinks).map(link =>
      document.querySelector(link.getAttribute('href'))
    ).filter(Boolean);

    this.activeIndex = 0;
    this.isScrollingManually = false;
    this.scrollTimeout = null;

    this.init();
  }

  init() {
    // Add click handlers
    this.navLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = this.sections[index];
        if (target) {
          this.setActiveLinkByIndex(index);
          this.scrollToSection(target);
        }
      });
    });

    // Handle scroll events
    const debouncedScroll = Utils.debounce(() => this.handleScroll(), 10);
    window.addEventListener('scroll', debouncedScroll);

    this.handleScroll(); // Initial call
  }

  scrollToSection(target) {
    this.isScrollingManually = true;
    clearTimeout(this.scrollTimeout);

    target.scrollIntoView({ behavior: 'smooth' });

    this.scrollTimeout = setTimeout(() => {
      this.isScrollingManually = false;
    }, 700);
  }

  setActiveLinkByIndex(index) {
    if (this.activeIndex === index) return;

    this.navLinks.forEach(link => link.classList.remove('active'));
    if (index >= 0 && index < this.navLinks.length) {
      this.navLinks[index].classList.add('active');
    }

    this.activeIndex = index;
  }

  handleScroll() {
    if (this.isScrollingManually) return;

    const scrollPos = window.scrollY + 160;

    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      if (scrollPos >= section.offsetTop) {
        this.setActiveLinkByIndex(i);
        return;
      }
    }

    if (window.scrollY === 0) {
      this.setActiveLinkByIndex(0);
    }
  }
}

// Scroll effects
class ScrollEffects {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.init();
  }

  init() {
    const debouncedScroll = Utils.debounce(() => this.handleScroll(), 10);
    window.addEventListener('scroll', debouncedScroll);
  }

  handleScroll() {
    if (!this.navbar) return;

    const scrollY = window.scrollY;
    const opacity = scrollY > 100 ? 0.98 : 0.95;

    this.navbar.style.background = `rgba(255, 255, 255, ${opacity})`;
  }
}

// Button interactions
class ButtonInteractions {
  constructor() {
    this.loginBtn = document.querySelector('.login-btn');
    this.init();
  }

  init() {
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => this.handleLogin());
    }
  }

  handleLogin() {
    // In a real application, this would redirect to a login page or open a modal
    alert('Login functionality will be implemented. Please visit the barangay office for assistance.');
  }
}
