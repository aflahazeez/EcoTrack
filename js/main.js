/**
 * EcoTrack – Main Application Script
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Handles global interactions:
 * 1. Mobile navigation with full accessibility (ARIA, Escape key, Outside-click)
 * 2. Active navigation link synchronization across pages
 * 3. Focus restoration for keyboard and screen-reader accessibility
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  highlightActiveNavLink();
});

/**
 * Initializes mobile navigation with robust state management & accessibility
 */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');

  if (!toggleBtn || !drawer) return;

  /**
   * Synchronizes mobile drawer state, ARIA attributes, and toggle button icon
   * @param {boolean} isOpen
   */
  function setDrawerState(isOpen) {
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    drawer.classList.toggle('open', isOpen);

    const icon = toggleBtn.querySelector('svg');
    if (icon) {
      if (isOpen) {
        // Close (X) icon
        icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12"/>';
      } else {
        // Hamburger icon
        icon.innerHTML = '<path d="M4 6h16M4 12h16M4 18h16"/>';
      }
    }
  }

  // Toggle drawer open/close on button click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    setDrawerState(!isCurrentlyExpanded);
  });

  // Close drawer and return focus when user presses Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      setDrawerState(false);
      toggleBtn.focus();
    }
  });

  // Close drawer when user clicks outside the navigation container
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open')) {
      if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        setDrawerState(false);
      }
    }
  });

  // Close drawer when any navigation link inside it is clicked
  const mobileLinks = drawer.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      setDrawerState(false);
    });
  });
}

/**
 * Automatically marks the current active page in the navigation menu
 */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop() || 'index.html';

  const allNavLinks = document.querySelectorAll('.nav-link');
  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName || (pageName === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}
