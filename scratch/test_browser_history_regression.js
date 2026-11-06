const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('ECOTRACK: BROWSER HISTORY & SAME-PAGE NAVIGATION REGRESSION TEST');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function check(desc, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  PASS: ${desc}`);
  } else {
    failed++;
    console.error(`  FAIL: ${desc} ${extra}`);
  }
}

// 1. Verify index.html hero trust badge wording
console.log('--- 1. Hero Trust Badge Wording ---');
const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
check('index.html hero badge contains "Browser-Based Storage"', indexHtml.includes('<span>Browser-Based Storage</span>'));
check('index.html hero badge does NOT contain "Browser-Local Storage"', !indexHtml.includes('<span>Browser-Local Storage</span>'));

// 2. Verify js/page-views.js template matches index.html
const pageViewsJs = fs.readFileSync(path.join(projectRoot, 'js', 'page-views.js'), 'utf8');
check('js/page-views.js template contains "Browser-Based Storage"', pageViewsJs.includes('Browser-Based Storage'));
check('js/page-views.js template does NOT contain "Browser-Local Storage"', !pageViewsJs.includes('Browser-Local Storage'));

// 3. Verify guards in js/main.js
console.log('\n--- 2. js/main.js History Guards Inspection ---');
const mainJs = fs.readFileSync(path.join(projectRoot, 'js', 'main.js'), 'utf8');

check('Same-page category navigation guards updateHistoryState with forcedBack === null',
  mainJs.includes('if (forcedBack === null) updateHistoryState(currentPage, targetHash);'));

check('Same-page tips navigation guards updateHistoryState with forcedBack === null',
  mainJs.includes("if (forcedBack === null) updateHistoryState(currentPage, '#tips');"));

check('Same-page checklist navigation guards updateHistoryState with forcedBack === null',
  mainJs.includes("if (forcedBack === null) updateHistoryState(currentPage, '#checklist');"));

check('Same-page top navigation guards updateHistoryState with forcedBack === null',
  mainJs.includes("if (forcedBack === null) updateHistoryState(currentPage, '');"));

// 4. Behavioral Simulation of Navigation & Browser History Traversal
console.log('\n--- 3. Navigation & History Traversal Simulation ---');

// Mock browser environment
function createHarness() {
  const historyStack = [];
  let currentHistoryIndex = -1;
  let pushStateCount = 0;

  const mockHistory = {
    pushState(state, title, url) {
      pushStateCount++;
      currentHistoryIndex++;
      historyStack.splice(currentHistoryIndex, historyStack.length - currentHistoryIndex, { state, title, url });
    },
    replaceState(state, title, url) {
      if (currentHistoryIndex >= 0) {
        historyStack[currentHistoryIndex] = { state, title, url };
      } else {
        historyStack.push({ state, title, url });
        currentHistoryIndex = 0;
      }
    },
    get length() { return historyStack.length; },
    get state() { return historyStack[currentHistoryIndex]?.state || null; }
  };

  const elements = new Map();
  function makeEl(id) {
    const el = {
      id,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      getAttribute() { return null; },
      removeAttribute() {},
      scrollIntoView() {},
      innerHTML: '',
      textContent: '',
      style: {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      appendChild(child) { child.parentNode = el; },
      removeChild() {},
      addEventListener() {},
      removeEventListener() {}
    };
    el.parentNode = { removeChild() {} };
    return el;
  }

  ['page-slider-viewport', 'current-page-view', 'tips', 'checklist', 'carousel-viewport', 'carousel-dots'].forEach(id => {
    elements.set(id, makeEl(id));
  });

  const mockDoc = {
    createElement(tag) { return makeEl('elem-' + Math.random(), tag); },
    getElementById(id) { return elements.get(id) || null; },
    querySelector(sel) {
      if (sel.startsWith('#')) return elements.get(sel.substring(1)) || null;
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    documentElement: { classList: { remove() {}, add() {} } },
    title: ''
  };

  const listeners = { popstate: [], hashchange: [] };

  const mockWindow = {
    location: {
      pathname: '/habits.html',
      href: 'http://localhost/habits.html',
      hash: '',
      origin: 'http://localhost',
      protocol: 'http:'
    },
    history: mockHistory,
    document: mockDoc,
    addEventListener(evt, fn) {
      if (listeners[evt]) listeners[evt].push(fn);
    },
    matchMedia: () => ({ matches: false }),
    scrollTo() {},
    setTimeout: (fn) => fn(),
    clearTimeout() {},
    setInterval: () => 123,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => { fn(); return 1; },
    cancelAnimationFrame: () => {}
  };
  mockWindow.window = mockWindow;

  return { mockWindow, mockDoc, mockHistory, historyStack, listeners, getPushCount: () => pushStateCount };
}

// Load data and habits modules
const dataCode = fs.readFileSync(path.join(projectRoot, 'js', 'data.js'), 'utf8');
const storageCode = fs.readFileSync(path.join(projectRoot, 'js', 'storage.js'), 'utf8');
const habitsCode = fs.readFileSync(path.join(projectRoot, 'js', 'habits.js'), 'utf8');

const harness = createHarness();
const sandbox = {
  window: harness.mockWindow,
  document: harness.mockDoc,
  history: harness.mockHistory,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => 123,
  clearInterval: () => {},
  requestAnimationFrame: (fn) => { fn(); return 1; },
  cancelAnimationFrame: () => {}
};

vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);
vm.runInContext(storageCode, sandbox);
vm.runInContext(habitsCode, sandbox);
vm.runInContext(pageViewsJs, sandbox);
const mainCodeForTest = mainJs.replace('function initPageSlider() {', 'function initPageSlider() {\n    window._navigateTo = navigateTo;');
vm.runInContext(mainCodeForTest, sandbox);

const EcoHabits = sandbox.window.EcoHabits;
const navigateTo = sandbox.window._navigateTo;

check('EcoHabits initialized on habits.html', Boolean(EcoHabits));
check('Default active category is null', EcoHabits.getActiveTipCategory() === null);
check('navigateTo is accessible for test', typeof navigateTo === 'function');

// Step 1: User manually navigates to Transportation category (#tips-transportation)
console.log('\n--- Step 1: User clicks "Clean Commuting" (#tips-transportation) ---');
const pushCountBefore1 = harness.getPushCount();
navigateTo('habits.html', '#tips-transportation', null);

check('pushState called for manual category navigation', harness.getPushCount() === pushCountBefore1 + 1);
check('Category set to Transportation', EcoHabits.getActiveTipCategory() === 'Transportation');
check('Slide index is 0', EcoHabits.getCurrentTipSlide() === 0);
check('Current history URL is habits.html#tips-transportation', harness.mockHistory.state.hash === '#tips-transportation');
const transHistoryIndex = harness.mockHistory.state.index;

// Step 2: User manually navigates to Energy category (#tips-energy)
console.log('\n--- Step 2: User clicks "Energy Conservation" (#tips-energy) ---');
const pushCountBefore2 = harness.getPushCount();
navigateTo('habits.html', '#tips-energy', null);

check('pushState called for second category navigation', harness.getPushCount() === pushCountBefore2 + 1);
check('Category set to Energy', EcoHabits.getActiveTipCategory() === 'Energy');
check('Slide index is 0', EcoHabits.getCurrentTipSlide() === 0);
check('Current history URL is habits.html#tips-energy', harness.mockHistory.state.hash === '#tips-energy');
const energyHistoryIndex = harness.mockHistory.state.index;

check('Energy history index is greater than Transportation history index', energyHistoryIndex > transHistoryIndex);

// Step 3: User presses Browser BACK button (revisiting #tips-transportation)
console.log('\n--- Step 3: User presses Browser BACK to #tips-transportation ---');
const pushCountBeforeBack = harness.getPushCount();

// Simulate popstate event triggered by browser Back button
const backEvent = {
  state: { page: 'habits.html', hash: '#tips-transportation', index: transHistoryIndex }
};
harness.listeners.popstate.forEach(fn => fn(backEvent));

check('ZERO pushState calls during browser BACK traversal', harness.getPushCount() === pushCountBeforeBack);
check('Category correctly restored to Transportation', EcoHabits.getActiveTipCategory() === 'Transportation');
check('Slide index correctly at 0', EcoHabits.getCurrentTipSlide() === 0);

// Step 4: User presses Browser FORWARD button (revisiting #tips-energy)
console.log('\n--- Step 4: User presses Browser FORWARD to #tips-energy ---');
const pushCountBeforeForward = harness.getPushCount();

// Simulate popstate event triggered by browser Forward button
const forwardEvent = {
  state: { page: 'habits.html', hash: '#tips-energy', index: energyHistoryIndex }
};
harness.listeners.popstate.forEach(fn => fn(forwardEvent));

check('ZERO pushState calls during browser FORWARD traversal', harness.getPushCount() === pushCountBeforeForward);
check('Category correctly restored to Energy', EcoHabits.getActiveTipCategory() === 'Energy');
check('Slide index correctly at 0', EcoHabits.getCurrentTipSlide() === 0);

// Step 5: User clicks generic Knowledge Hub (#tips)
console.log('\n--- Step 5: User clicks generic "#tips" ---');
const pushCountBeforeTips = harness.getPushCount();
navigateTo('habits.html', '#tips', null);

check('pushState called for generic #tips navigation', harness.getPushCount() === pushCountBeforeTips + 1);
check('Category correctly cleared to null', EcoHabits.getActiveTipCategory() === null);
check('Default daily tips restored', EcoHabits.getCurrentTipSlide() === 0);
check('History state hash is #tips', harness.mockHistory.state.hash === '#tips');
const tipsHistoryIndex = harness.mockHistory.state.index;

// Step 6: User presses Browser BACK from #tips back to #tips-energy
console.log('\n--- Step 6: User presses Browser BACK from #tips to #tips-energy ---');
const pushCountBeforeBack2 = harness.getPushCount();

const backEvent2 = {
  state: { page: 'habits.html', hash: '#tips-energy', index: energyHistoryIndex }
};
harness.listeners.popstate.forEach(fn => fn(backEvent2));

check('ZERO pushState calls during browser BACK to category', harness.getPushCount() === pushCountBeforeBack2);
check('Category restored to Energy from #tips', EcoHabits.getActiveTipCategory() === 'Energy');

// Step 7: Cross-page navigation to calculator.html, then BACK to habits.html#tips-energy
console.log('\n--- Step 7: Cross-page navigation to calculator.html then BACK ---');
const pushCountBeforeCalc = harness.getPushCount();
navigateTo('calculator.html', '', null);

check('pushState called when navigating to calculator.html', harness.getPushCount() === pushCountBeforeCalc + 1);
const calcHistoryIndex = harness.mockHistory.state.index;

// Simulate browser Back from calculator.html to habits.html#tips-energy
const pushCountBeforeCrossBack = harness.getPushCount();
const crossBackEvent = {
  state: { page: 'habits.html', hash: '#tips-energy', index: energyHistoryIndex }
};
harness.listeners.popstate.forEach(fn => fn(crossBackEvent));

check('ZERO pushState calls during cross-page BACK traversal', harness.getPushCount() === pushCountBeforeCrossBack);
check('Category restored to Energy after returning from calculator.html', EcoHabits.getActiveTipCategory() === 'Energy');

console.log('\n============================================================');
console.log(`TOTAL BROWSER HISTORY AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
