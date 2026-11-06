/**
 * EcoTrack – Main Application Script
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Handles global interactions:
 * 1. Mobile navigation with full accessibility (ARIA, Escape key, Outside-click)
 * 2. Active navigation link synchronization across pages
 * 3. Focus restoration for keyboard and screen-reader accessibility
 * 4. Continuous horizontal sliding transitions (mobile-app UX)
 */

// Application lifecycle initialisation triggers at bottom of script after all declarations
// to ensure zero parser delay and immediate first-frame mounting without visual flash

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
        icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12"/>';
      } else {
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
 * Page Order Matrix to determine forward/backward horizontal slide direction
 */
const PAGE_ORDER = {
  'index.html': 0,
  'calculator.html': 1,
  'habits.html': 2,
  'tips.html': 2.5,
  'dashboard.html': 3
};

/**
 * Updates active navigation link state across desktop nav and mobile drawer.
 * Strictly differentiates between Habit Tracker and Eco Tips destinations.
 * @param {string} [pageOrDestination]
 * @param {string} [hash]
 */
function highlightActiveNavLink(pageOrDestination, hash) {
  const currentHash = (hash !== undefined && hash !== null) ? hash : (window.location.hash || '');
  const cleanHash = currentHash.replace(/^#/, '').toLowerCase();
  
  let targetFile = (pageOrDestination || window.location.pathname.split('/').pop() || 'index.html').toLowerCase().split('#')[0];
  if (!targetFile || targetFile === '/') targetFile = 'index.html';

  let destination = 'home';
  if (targetFile === 'tips.html' || cleanHash === 'tips' || cleanHash.startsWith('tips') || cleanHash === 'habits_tips' || (targetFile === 'habits.html' && cleanHash === 'tips')) {
    destination = 'tips';
  } else if (targetFile === 'calculator.html' || cleanHash === 'calculator') {
    destination = 'calculator';
  } else if (targetFile === 'dashboard.html' || cleanHash === 'dashboard') {
    destination = 'dashboard';
  } else if (targetFile === 'habits.html' || cleanHash === 'habits' || cleanHash === 'checklist' || cleanHash === 'habits_checklist') {
    destination = 'habits';
  } else {
    destination = 'home';
  }

  const allNavLinks = document.querySelectorAll('.nav-link');
  allNavLinks.forEach(link => {
    const rawHref = (link.getAttribute('href') || '').trim().toLowerCase();
    let isMatch = false;

    if (destination === 'tips') {
      isMatch = (rawHref === 'tips.html' || rawHref === '#tips' || rawHref === 'habits.html#tips');
    } else if (destination === 'habits') {
      isMatch = (rawHref === 'habits.html' || rawHref === '#checklist' || rawHref === 'habits.html#checklist');
    } else if (destination === 'calculator') {
      isMatch = (rawHref === 'calculator.html');
    } else if (destination === 'dashboard') {
      isMatch = (rawHref === 'dashboard.html');
    } else if (destination === 'home') {
      isMatch = (rawHref === 'index.html' || rawHref === '' || rawHref === '/');
    }

    if (isMatch) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Initializes continuous horizontal sliding transitions (modern mobile-app navigation).
 * Works across local file:// in Chrome, local HTTP servers, and HTTPS deployments.
 */
function initPageSlider() {
  let isTransitioning = false;
  const initialFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  let currentPage = (initialFile === '' || initialFile === '/') ? 'index.html' : initialFile;

  // Detect whether pushState can change page URLs without SecurityError (fails on file:// in Chrome)
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
  let canUsePushState = false;
  if (!isFileProtocol) {
    try {
      if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
        history.replaceState({ page: currentPage, index: 0 }, '', window.location.href);
        canUsePushState = true;
      }
    } catch (_) {
      canUsePushState = false;
    }
  }

  // Navigation History Stack tracking
  let navHistory = [currentPage];
  let navIndex = 0;
  let isProgrammaticNav = false;

  const TIP_CATEGORY_MAP = {
    'transportation': 'Transportation',
    'energy': 'Energy',
    'water': 'Water',
    'waste': 'Waste'
  };

  // Helper: extracts category name from category tips hash
  function extractTipCategory(hash) {
    if (!hash) return null;
    const clean = hash.replace(/^#/, '');
    const match = clean.match(/^(?:habits[_-])?tips[_-](transportation|energy|water|waste)$/i);
    if (match) {
      const slug = match[1].toLowerCase();
      return TIP_CATEGORY_MAP[slug] || null;
    }
    return null;
  }

  // Helper: converts file + anchor into hash slug
  function fileToHash(file, hash) {
    const base = file.replace('.html', '');
    if (hash && hash.startsWith('#')) {
      const anchor = hash.substring(1);
      if (base === 'habits' && anchor === 'tips') return 'tips';
      if (base === 'habits' && anchor.startsWith('tips-')) return anchor;
      if (base === 'habits' && anchor === 'checklist') return 'habits_checklist';
      return base + '_' + anchor;
    }
    return base;
  }

  // Helper: parses hash slug into target file and anchor
  function parseHash(rawHash) {
    const clean = (rawHash || '').replace(/^#/, '');
    if (!clean) return { file: initialFile, hash: '', category: null };

    // Check category tip slugs: e.g. tips-transportation, habits_tips-transportation, tips_transportation
    const catMatch = clean.match(/^(?:habits[_-])?tips[_-](transportation|energy|water|waste)$/i);
    if (catMatch) {
      const slug = catMatch[1].toLowerCase();
      const categoryName = TIP_CATEGORY_MAP[slug];
      return { file: 'habits.html', hash: '#tips-' + slug, category: categoryName };
    }

    const parts = clean.split('_');
    const base = parts[0];
    const anchor = parts[1] ? '#' + parts[1] : '';

    if (base === 'tips') {
      return { file: 'habits.html', hash: '#tips', category: null };
    }

    if (base === 'checklist') {
      return { file: 'habits.html', hash: '#checklist', category: null };
    }

    if (base === 'habits' && parts[1] === 'tips') {
      return { file: 'habits.html', hash: '#tips', category: null };
    }

    if (base === 'habits' && parts[1] === 'checklist') {
      return { file: 'habits.html', hash: '#checklist', category: null };
    }

    const file = base.endsWith('.html') ? base : (base + '.html');
    if (PAGE_ORDER[file] !== undefined) {
      return { file, hash: anchor, category: null };
    }
    return { file: initialFile, hash: '', category: null };
  }

  // Handle direct initial load with hash or target page
  let targetOnLoad = null;
  if (window.location.hash) {
    targetOnLoad = parseHash(window.location.hash);
    if (targetOnLoad.file && targetOnLoad.file !== initialFile && window.ECO_VIEWS && window.ECO_VIEWS[targetOnLoad.file]) {
      currentPage = targetOnLoad.file;
      navHistory = [currentPage];
    }
  }

  // Highlight active link initially
  const initialNavDest = targetOnLoad ? ((targetOnLoad.hash === '#tips' || targetOnLoad.category) ? 'tips.html' : targetOnLoad.file) : currentPage;
  highlightActiveNavLink(initialNavDest, targetOnLoad ? targetOnLoad.hash : window.location.hash);

  // Mount existing main content & footer into the slider viewport
  const main = document.querySelector('.main-content');
  const footer = document.querySelector('.site-footer');

  if (main && !document.getElementById('page-slider-viewport')) {
    const viewport = document.createElement('div');
    viewport.id = 'page-slider-viewport';
    viewport.className = 'page-slider-viewport';

    const currentPanel = document.createElement('div');
    currentPanel.id = 'current-page-view';
    currentPanel.className = 'page-view-panel';

    main.parentNode.insertBefore(viewport, main);
    viewport.appendChild(currentPanel);

    // If initial load has a target page different from initialFile (e.g. index.html#calculator),
    // mount that target page directly into currentPanel
    if (targetOnLoad && targetOnLoad.file && targetOnLoad.file !== initialFile && window.ECO_VIEWS && window.ECO_VIEWS[targetOnLoad.file]) {
      currentPanel.innerHTML = window.ECO_VIEWS[targetOnLoad.file].html;
      if (main.parentNode) main.parentNode.removeChild(main);
      if (footer && footer.parentNode) footer.parentNode.removeChild(footer);

      document.title = (targetOnLoad.category || targetOnLoad.hash === '#tips') ? 'Eco Tips & Knowledge | EcoTrack' : window.ECO_VIEWS[targetOnLoad.file].title;
      if (typeof window.ECO_VIEWS[targetOnLoad.file].init === 'function') {
        window.ECO_VIEWS[targetOnLoad.file].init();
      }
      if (typeof window.initCustomSelects === 'function') {
        window.initCustomSelects(currentPanel);
      }
      if (targetOnLoad.file === 'habits.html' && targetOnLoad.category && window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
        window.EcoHabits.showTipCategory(targetOnLoad.category);
      }

      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('eco-route-resolving');
      }

      if (targetOnLoad.hash) {
        setTimeout(() => scrollToTargetHash(targetOnLoad.hash), 60);
      }
    } else {
      currentPanel.appendChild(main);
      if (footer && footer.parentNode) {
        currentPanel.appendChild(footer);
      }
      if (targetOnLoad && targetOnLoad.file === 'habits.html' && targetOnLoad.category && window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
        window.EcoHabits.showTipCategory(targetOnLoad.category);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('eco-route-resolving');
      }
      if (targetOnLoad && targetOnLoad.hash) {
        setTimeout(() => scrollToTargetHash(targetOnLoad.hash), 60);
      }
    }
  }

  /**
   * Smoothly scrolls to element matching target hash
   * @param {string} hash
   */
  function scrollToTargetHash(hash) {
    if (!hash) return;
    const targetId = hash.replace('#', '');
    let targetEl = document.getElementById(targetId);
    if (!targetEl && targetId.startsWith('tips-')) {
      targetEl = document.getElementById('tips');
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Safely updates browser history and address bar across environments
   * @param {string} targetFile
   * @param {string} [targetHash]
   */
  function updateHistoryState(targetFile, targetHash) {
    if (canUsePushState) {
      try {
        const urlParam = targetHash === '#tips' ? 'tips.html' : (targetFile + (targetHash || ''));
        history.pushState({ page: targetFile, hash: targetHash, index: navIndex }, '', urlParam);
        return;
      } catch (_) {
        canUsePushState = false;
      }
    }

    // Hash-based history for file:// protocol in Chrome
    const hashString = fileToHash(targetFile, targetHash);
    isProgrammaticNav = true;
    if (window.location.hash !== '#' + hashString) {
      window.location.hash = '#' + hashString;
    }
    setTimeout(() => {
      isProgrammaticNav = false;
    }, 80);
  }

  /**
   * Performs continuous horizontal sliding transition between pages
   * @param {string} targetFile - Incoming page filename (e.g. 'dashboard.html')
   * @param {string} [targetHash] - Target anchor hash (e.g. '#tips')
   * @param {boolean|null} [forcedBack=null] - Explicit navigation direction override
   */
  function navigateTo(targetFile, targetHash, forcedBack = null) {
    if (isTransitioning) return;

    // Resolve tips.html redirect alias to habits.html#tips
    if (targetFile === 'tips.html') {
      targetFile = 'habits.html';
      targetHash = targetHash || '#tips';
    }

    // If target view is missing from template registry, fallback to standard link navigation
    if (!window.ECO_VIEWS || !window.ECO_VIEWS[targetFile]) {
      window.location.href = targetFile + (targetHash || '');
      return;
    }

    // Clean up habit tracker timers when leaving habits page
    if (currentPage === 'habits.html' && targetFile !== 'habits.html' && window.EcoHabits && typeof window.EcoHabits.stopTimer === 'function') {
      window.EcoHabits.stopTimer();
    }

    // Clean up dashboard chart instances when leaving dashboard page
    if (currentPage === 'dashboard.html' && targetFile !== 'dashboard.html' && window.EcoDashboard && typeof window.EcoDashboard.destroyChart === 'function') {
      window.EcoDashboard.destroyChart();
    }

    const category = extractTipCategory(targetHash);

    // Same-page navigation check
    if (targetFile === currentPage) {
      if (forcedBack === null) {
        navIndex++;
      }
      if (category) {
        if (window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
          window.EcoHabits.showTipCategory(category);
        }
        highlightActiveNavLink('tips.html', targetHash);
        if (forcedBack === null) updateHistoryState(currentPage, targetHash);
        scrollToTargetHash('#tips');
      } else if (targetHash === '#tips') {
        if (window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
          window.EcoHabits.clearTipCategory();
        }
        highlightActiveNavLink('tips.html', '#tips');
        if (forcedBack === null) updateHistoryState(currentPage, '#tips');
        scrollToTargetHash('#tips');
      } else if (targetHash === '#checklist') {
        highlightActiveNavLink('habits.html', '');
        if (forcedBack === null) updateHistoryState(currentPage, '#checklist');
        scrollToTargetHash('#checklist');
      } else if (targetHash) {
        highlightActiveNavLink(currentPage, targetHash);
        if (forcedBack === null) updateHistoryState(currentPage, targetHash);
        scrollToTargetHash(targetHash);
      } else {
        if (currentPage === 'habits.html' && window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
          window.EcoHabits.clearTipCategory();
        }
        highlightActiveNavLink(currentPage, '');
        if (forcedBack === null) updateHistoryState(currentPage, '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const viewport = document.getElementById('page-slider-viewport');
    const currentView = document.getElementById('current-page-view');

    if (!viewport || !currentView) {
      window.location.href = targetFile + (targetHash || '');
      return;
    }

    isTransitioning = true;

    // Determine slide direction: Forward = Left (-100%), Backward = Right (+100%)
    let isForward = true;
    const isTipsNav = targetHash === '#tips' || Boolean(category);
    if (typeof forcedBack === 'boolean') {
      isForward = !forcedBack;
    } else {
      // Normal user link navigation: push to navigation history stack
      navHistory = navHistory.slice(0, navIndex + 1);
      navHistory.push(isTipsNav ? 'tips.html' : targetFile);
      navIndex = navHistory.length - 1;

      const curKey = (currentPage === 'habits.html' && window.location.hash.includes('tips')) ? 'tips.html' : currentPage;
      const tgtKey = isTipsNav ? 'tips.html' : targetFile;
      const curIdx = PAGE_ORDER[curKey] !== undefined ? PAGE_ORDER[curKey] : 0;
      const tgtIdx = PAGE_ORDER[tgtKey] !== undefined ? PAGE_ORDER[tgtKey] : 0;
      isForward = tgtIdx >= curIdx;
    }

    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fast path: instant replacement for reduced-motion accessibility
    if (isReducedMotion) {
      currentView.innerHTML = window.ECO_VIEWS[targetFile].html;
      if (typeof window.ECO_VIEWS[targetFile].init === 'function') {
        window.ECO_VIEWS[targetFile].init();
      }
      if (targetFile === 'habits.html') {
        if (category && window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
          window.EcoHabits.showTipCategory(category);
        } else if (!category && window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
          window.EcoHabits.clearTipCategory();
        }
      }
      document.title = isTipsNav ? 'Eco Tips & Knowledge | EcoTrack' : window.ECO_VIEWS[targetFile].title;
      currentPage = targetFile;
      highlightActiveNavLink(isTipsNav ? 'tips.html' : targetFile, targetHash);
      if (forcedBack === null) updateHistoryState(targetFile, targetHash);

      if (targetHash) {
        scrollToTargetHash(targetHash);
      } else {
        window.scrollTo(0, 0);
      }
      isTransitioning = false;
      return;
    }

    // Prepare lockstep horizontal slide
    const curHeight = currentView.offsetHeight;

    // Freeze outgoing view position in place
    currentView.style.position = 'absolute';
    currentView.style.top = '0';
    currentView.style.left = '0';
    currentView.style.width = '100%';
    currentView.style.transform = 'translateX(0)';

    // Create incoming view panel off-screen
    const incomingView = document.createElement('div');
    incomingView.id = 'incoming-page-view';
    incomingView.className = 'page-view-panel';
    incomingView.innerHTML = window.ECO_VIEWS[targetFile].html;
    incomingView.style.position = 'absolute';
    incomingView.style.left = '0';
    incomingView.style.width = '100%';
    incomingView.style.transform = isForward ? 'translateX(100%)' : 'translateX(-100%)';

    // If navigating to Eco Tips, align incoming view so tips section is visible smoothly without jumping
    let tipsOffset = 0;
    if (targetHash === '#tips' || isTipsNav) {
      const tipsElem = incomingView.querySelector('#tips');
      if (tipsElem) {
        tipsOffset = tipsElem.offsetTop;
        incomingView.style.top = '-' + Math.max(0, tipsOffset - 24) + 'px';
      } else {
        incomingView.style.top = '0';
      }
    } else {
      incomingView.style.top = '0';
    }

    viewport.appendChild(incomingView);

    // Initialize incoming interactive components (calculators, charts, checklists)
    if (typeof window.ECO_VIEWS[targetFile].init === 'function') {
      window.ECO_VIEWS[targetFile].init();
    }
    if (typeof window.initCustomSelects === 'function') {
      window.initCustomSelects(incomingView);
    }
    if (targetFile === 'habits.html') {
      if (category && window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
        window.EcoHabits.showTipCategory(category);
      } else if (!category && window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
        window.EcoHabits.clearTipCategory();
      }
    }

    // Set viewport minimum height to accommodate largest view during motion
    const incHeight = incomingView.offsetHeight;
    viewport.style.minHeight = Math.max(curHeight, incHeight) + 'px';

    // Synchronize UI indicators immediately
    document.title = isTipsNav ? 'Eco Tips & Knowledge | EcoTrack' : window.ECO_VIEWS[targetFile].title;
    highlightActiveNavLink(isTipsNav ? 'tips.html' : targetFile, targetHash);
    if (forcedBack === null) updateHistoryState(targetFile, targetHash);

    // Force browser layout flush before animating
    void incomingView.offsetHeight;

    // Animate both pages simultaneously with cubic-bezier easing curve
    const slideTransition = 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)';
    currentView.style.transition = slideTransition;
    incomingView.style.transition = slideTransition;

    requestAnimationFrame(() => {
      currentView.style.transform = isForward ? 'translateX(-100%)' : 'translateX(100%)';
      incomingView.style.transform = 'translateX(0)';
    });

    // Finalize DOM swap once animation finishes
    setTimeout(() => {
      if (currentView && currentView.parentNode) {
        currentView.parentNode.removeChild(currentView);
      }

      incomingView.id = 'current-page-view';
      incomingView.style.position = 'relative';
      incomingView.style.top = '';
      incomingView.style.left = '';
      incomingView.style.width = '100%';
      incomingView.style.transform = '';
      incomingView.style.transition = '';
      viewport.style.minHeight = '';

      currentPage = targetFile;
      isTransitioning = false;

      // Finalize dashboard rendering and chart sizing after slide transition settles
      if (targetFile === 'dashboard.html' && window.EcoDashboard && typeof window.EcoDashboard.init === 'function') {
        window.EcoDashboard.init();
      }
      if (targetFile === 'habits.html' && category && window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
        window.EcoHabits.showTipCategory(category, false);
      }

      if ((targetHash === '#tips' || isTipsNav) && tipsOffset > 0) {
        window.scrollTo(0, Math.max(0, tipsOffset - 24));
      } else if (targetHash) {
        scrollToTargetHash(targetHash);
      } else {
        window.scrollTo(0, 0);
      }
    }, 460);
  }

  // Intercept internal page link clicks for continuous sliding navigation
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = e.target.closest('a');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref) return;

    // Handle same-page anchor links (e.g. #checklist, #tips, #main-content)
    if (rawHref.startsWith('#')) {
      const targetId = rawHref.substring(1);
      const category = extractTipCategory(rawHref);
      let targetEl = document.getElementById(targetId);
      if (!targetEl && category) {
        targetEl = document.getElementById('tips');
      }
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (category) {
          if (window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
            window.EcoHabits.showTipCategory(category);
          }
          highlightActiveNavLink('tips.html', rawHref);
          navIndex++;
          updateHistoryState(currentPage, rawHref);
        } else if (targetId === 'tips') {
          if (window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
            window.EcoHabits.clearTipCategory();
          }
          highlightActiveNavLink('tips.html', '#tips');
          navIndex++;
          updateHistoryState(currentPage, '#tips');
        } else if (targetId === 'checklist') {
          highlightActiveNavLink('habits.html', '');
          navIndex++;
          updateHistoryState(currentPage, '#checklist');
        }
      }
      return;
    }

    // Skip external links, downloads, new tabs, or custom protocols
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return;

    let targetUrl;
    try {
      targetUrl = new URL(anchor.href, window.location.href);
    } catch (_) {
      return;
    }

    // Only process same-origin or same file-directory links
    const isSameOrigin = (targetUrl.origin === window.location.origin) ||
                         (targetUrl.protocol === 'file:' && window.location.protocol === 'file:');
    if (!isSameOrigin) return;

    const targetFile = (targetUrl.pathname.split('/').pop() || 'index.html').toLowerCase();
    const targetHash = targetUrl.hash || '';

    // If link target is registered, perform horizontal slide
    if (window.ECO_VIEWS && (window.ECO_VIEWS[targetFile] || targetFile === 'tips.html')) {
      e.preventDefault();
      navigateTo(targetFile, targetHash, null);
    }
  });

  // Handle browser Back & Forward navigation under pushState
  window.addEventListener('popstate', (e) => {
    if (!canUsePushState) return;

    if (e.state && e.state.page) {
      const targetFile = e.state.page;
      const targetHash = e.state.hash || null;
      const targetIdx = typeof e.state.index === 'number' ? e.state.index : 0;
      const isBack = targetIdx < navIndex;
      navIndex = targetIdx;
      navigateTo(targetFile, targetHash, isBack);
    }
  });

  // Handle hash changes for browser Back & Forward navigation under file://
  window.addEventListener('hashchange', () => {
    if (canUsePushState || isProgrammaticNav) return;

    const parsed = parseHash(window.location.hash);
    const targetFile = parsed.file;
    const targetHash = parsed.hash;

    if (!targetFile || !window.ECO_VIEWS || !window.ECO_VIEWS[targetFile]) return;

    if (targetFile === currentPage) {
      const category = extractTipCategory(targetHash);
      if (category) {
        if (window.EcoHabits && typeof window.EcoHabits.showTipCategory === 'function') {
          window.EcoHabits.showTipCategory(category);
        }
        highlightActiveNavLink('tips.html', targetHash);
        scrollToTargetHash(targetHash);
      } else if (targetHash === '#tips') {
        if (window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
          window.EcoHabits.clearTipCategory();
        }
        highlightActiveNavLink('tips.html', '#tips');
        scrollToTargetHash('#tips');
      } else if (targetHash === '#checklist') {
        highlightActiveNavLink('habits.html', '');
        scrollToTargetHash('#checklist');
      } else if (targetHash) {
        highlightActiveNavLink(currentPage, targetHash);
        scrollToTargetHash(targetHash);
      } else {
        if (currentPage === 'habits.html' && window.EcoHabits && typeof window.EcoHabits.clearTipCategory === 'function') {
          window.EcoHabits.clearTipCategory();
        }
        highlightActiveNavLink(currentPage, '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // Determine direction from navigation history stack traversal
    let isBack = false;
    const isTipsNav = targetHash === '#tips' || Boolean(extractTipCategory(targetHash));
    const historyTarget = isTipsNav ? 'tips.html' : targetFile;
    if (navIndex > 0 && (navHistory[navIndex - 1] === targetFile || navHistory[navIndex - 1] === historyTarget)) {
      isBack = true;
      navIndex--;
    } else if (navIndex < navHistory.length - 1 && (navHistory[navIndex + 1] === targetFile || navHistory[navIndex + 1] === historyTarget)) {
      isBack = false;
      navIndex++;
    } else {
      const curKey = (currentPage === 'habits.html' && window.location.hash.includes('tips')) ? 'tips.html' : currentPage;
      const tgtKey = isTipsNav ? 'tips.html' : targetFile;
      const curIdx = PAGE_ORDER[curKey] !== undefined ? PAGE_ORDER[curKey] : 0;
      const tgtIdx = PAGE_ORDER[tgtKey] !== undefined ? PAGE_ORDER[tgtKey] : 0;
      isForward = tgtIdx >= curIdx;
      isBack = !isForward;
      navHistory.push(historyTarget);
      navIndex = navHistory.length - 1;
    }

    navigateTo(targetFile, targetHash, isBack);
  });
}

/**
 * Initializes mobile navigation and page slider controllers.
 * Executes immediately if the DOM shell is available to eliminate initial paint delay,
 * or attaches to DOMContentLoaded as a fallback.
 */
function initApp() {
  initMobileNavigation();
  initPageSlider();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    if (document.querySelector('.main-content')) {
      initApp();
    } else {
      document.addEventListener('DOMContentLoaded', initApp);
    }
  } else {
    initApp();
  }
}

