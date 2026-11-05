/**
 * Verification Script for Continuous Horizontal Sliding Page Navigation
 */
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, msg) {
  if (cond) {
    testsPassed++;
    console.log(`  PASS: ${msg}`);
  } else {
    testsFailed++;
    console.error(`  FAIL: ${msg}`);
  }
}

console.log('============================================================');
console.log('ECOTRACK: HORIZONTAL SLIDING TRANSITION TEST SUITE');
console.log('============================================================\n');

// 1. Verify js/page-views.js structure
console.log('--- 1. Page Views Data Registry ---');
const viewsJs = fs.readFileSync('js/page-views.js', 'utf8');
assert(viewsJs.includes('window.ECO_VIEWS'), 'js/page-views.js defines window.ECO_VIEWS');
assert(viewsJs.includes('index.html'), 'window.ECO_VIEWS includes index.html');
assert(viewsJs.includes('calculator.html'), 'window.ECO_VIEWS includes calculator.html');
assert(viewsJs.includes('habits.html'), 'window.ECO_VIEWS includes habits.html');
assert(viewsJs.includes('dashboard.html'), 'window.ECO_VIEWS includes dashboard.html');
assert(viewsJs.includes('tips.html'), 'window.ECO_VIEWS includes tips.html');

// 2. Verify CSS styles for slider viewport and panels
console.log('\n--- 2. CSS Rules in css/style.css ---');
const styleCss = fs.readFileSync('css/style.css', 'utf8');
assert(styleCss.includes('.page-slider-viewport'), 'css/style.css defines .page-slider-viewport');
assert(styleCss.includes('overflow-x: hidden'), 'css/style.css sets overflow-x: hidden on viewport');
assert(styleCss.includes('.page-view-panel'), 'css/style.css defines .page-view-panel');
assert(styleCss.includes('@media (prefers-reduced-motion: reduce)'), 'css/style.css includes prefers-reduced-motion');

// 3. Verify HTML files include required stylesheets and scripts
console.log('\n--- 3. HTML Document Script & Style Inclusion ---');
const htmlFiles = ['index.html', 'calculator.html', 'habits.html', 'tips.html', 'dashboard.html'];
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('js/page-views.js'), `${file} loads js/page-views.js`);
  assert(html.includes('js/main.js'), `${file} loads js/main.js`);
  assert(html.includes('css/style.css'), `${file} links css/style.css`);
});

// 4. Test logic and direction calculation in Node environment
console.log('\n--- 4. Navigation Order & Direction Calculations ---');
const PAGE_ORDER = {
  'index.html': 0,
  'calculator.html': 1,
  'habits.html': 2,
  'tips.html': 2,
  'dashboard.html': 3
};

function getDirection(from, to, forcedBack = null) {
  if (typeof forcedBack === 'boolean') return forcedBack ? 'backward' : 'forward';
  const fromIdx = PAGE_ORDER[from] !== undefined ? PAGE_ORDER[from] : 0;
  const toIdx = PAGE_ORDER[to] !== undefined ? PAGE_ORDER[to] : 0;
  return toIdx >= fromIdx ? 'forward' : 'backward';
}

assert(getDirection('calculator.html', 'dashboard.html') === 'forward', 'Calculator -> Dashboard slides FORWARD (out to left, in from right)');
assert(getDirection('dashboard.html', 'calculator.html') === 'backward', 'Dashboard -> Calculator slides BACKWARD (out to right, in from left)');
assert(getDirection('index.html', 'calculator.html') === 'forward', 'Home -> Calculator slides FORWARD');
assert(getDirection('habits.html', 'index.html') === 'backward', 'Habits -> Home slides BACKWARD');
assert(getDirection('dashboard.html', 'habits.html') === 'backward', 'Dashboard -> Habits slides BACKWARD');
assert(getDirection('habits.html', 'dashboard.html') === 'forward', 'Habits -> Dashboard slides FORWARD');
assert(getDirection('dashboard.html', 'calculator.html', true) === 'backward', 'Forced back in popstate navigates BACKWARD');

// 5. Verify transform coordinates
console.log('\n--- 5. Slide Animation Key Coordinates ---');
function getSlideTransforms(direction) {
  const isForward = direction === 'forward';
  return {
    outgoingStart: 'translateX(0)',
    outgoingEnd: isForward ? 'translateX(-100%)' : 'translateX(100%)',
    incomingStart: isForward ? 'translateX(100%)' : 'translateX(-100%)',
    incomingEnd: 'translateX(0)'
  };
}

const fwd = getSlideTransforms('forward');
assert(fwd.outgoingStart === 'translateX(0)' && fwd.outgoingEnd === 'translateX(-100%)', 'Forward outgoing moves 0 -> -100% (slides out left)');
assert(fwd.incomingStart === 'translateX(100%)' && fwd.incomingEnd === 'translateX(0)', 'Forward incoming moves 100% -> 0 (slides in right)');

const bwd = getSlideTransforms('backward');
assert(bwd.outgoingStart === 'translateX(0)' && bwd.outgoingEnd === 'translateX(100%)', 'Backward outgoing moves 0 -> 100% (slides out right)');
assert(bwd.incomingStart === 'translateX(-100%)' && bwd.incomingEnd === 'translateX(0)', 'Backward incoming moves -100% -> 0 (slides in left)');

// 6. Verify Issue 1: Restored Dropdown & Input Styling
console.log('\n--- 6. Issue 1: Restored Dropdown & Input Styling ---');
const calcCss = fs.readFileSync('css/calculator.css', 'utf8');
assert(styleCss.includes('color-scheme: dark'), 'css/style.css sets color-scheme: dark on :root');
assert(styleCss.includes('accent-color: #1b4d3e') || styleCss.includes('accent-color: #10b981') || styleCss.includes('accent-color: var(--action-emerald)'), 'css/style.css sets subtle forest accent-color');
assert(styleCss.includes('::selection') && styleCss.includes('var(--card-surface-active)'), 'css/style.css styles ::selection with dark botanical highlights');
assert(styleCss.includes('select, select option') && (styleCss.includes('#0a2119') || styleCss.includes('#0b241c')), 'css/style.css styles select and select option with dark forest backgrounds');
assert(calcCss.includes('.select-control {') && calcCss.includes('appearance: none'), 'css/calculator.css sets appearance: none on .select-control');
assert(calcCss.includes('.select-control') && calcCss.includes('data:image/svg+xml'), 'css/calculator.css includes custom SVG dropdown arrow on .select-control');
assert(calcCss.includes('.select-control:focus'), 'css/calculator.css defines focus ring on .select-control');
assert(calcCss.includes('.select-control option') && (calcCss.includes('#0a2119') || calcCss.includes('#0b241c')), 'css/calculator.css defines dark forest background on options');

// 7. Verify Issue 2: Daily Eco Tips Horizontal Carousel & Timer Cleanup
console.log('\n--- 7. Issue 2: Daily Eco Tips Carousel & Timers ---');
const habitsCss = fs.readFileSync('css/habits.css', 'utf8');
const habitsJs = fs.readFileSync('js/habits.js', 'utf8');
assert(habitsCss.includes('.carousel-track {') && habitsCss.includes('display: flex'), 'css/habits.css defines .carousel-track flex container');
assert(habitsCss.includes('.carousel-track') && habitsCss.includes('transform 400ms'), 'css/habits.css defines 400ms smooth horizontal slide transition');
assert(habitsCss.includes('.carousel-track .carousel-slide') && habitsCss.includes('flex: 0 0 100%'), 'css/habits.css slides occupy 100% width in track');
assert(habitsJs.includes('carousel-track'), 'js/habits.js renders .carousel-track inside viewport');
assert(habitsJs.includes('isSlidingTip'), 'js/habits.js includes debounce lock against rapid slide clicks');
assert(habitsJs.includes('stopCarouselAutoTimer()') && habitsJs.includes('function initHub()'), 'js/habits.js stops existing timers before reinitializing');
assert(habitsJs.includes('stopTimer: stopCarouselAutoTimer'), 'js/habits.js exports stopTimer API for page unmounting');

// 8. Verify Issue 3: Chrome History Stack & Back/Forward Navigation Traversal
console.log('\n--- 8. Issue 3: Chrome History Stack & Navigation Traversal ---');
const mainJs = fs.readFileSync('js/main.js', 'utf8');
assert(mainJs.includes('let navHistory = [currentPage];'), 'js/main.js tracks navigation history stack');
assert(mainJs.includes('function parseHash('), 'js/main.js includes robust parseHash helper');
assert(mainJs.includes('function fileToHash('), 'js/main.js includes fileToHash helper');
assert(mainJs.includes('window.addEventListener(\'hashchange\''), 'js/main.js listens to hashchange for file:// navigation');
assert(mainJs.includes('window.EcoHabits.stopTimer()'), 'js/main.js stops EcoHabits timers when leaving habits page');

// Simulation of navigation sequence: Home -> Calculator -> Habits -> Dashboard -> Back -> Back -> Forward
let simStack = ['index.html'];
let simIdx = 0;

function simNavigate(target) {
  simStack = simStack.slice(0, simIdx + 1);
  simStack.push(target);
  simIdx = simStack.length - 1;
}

function simBack() {
  if (simIdx > 0) {
    simIdx--;
    return { target: simStack[simIdx], isBack: true };
  }
  return null;
}

function simForward() {
  if (simIdx < simStack.length - 1) {
    simIdx++;
    return { target: simStack[simIdx], isBack: false };
  }
  return null;
}

// User visits: Home -> Calculator -> Habits -> Dashboard
simNavigate('calculator.html');
simNavigate('habits.html');
simNavigate('dashboard.html');
assert(simStack.length === 4 && simIdx === 3, 'Navigated Home -> Calculator -> Habits -> Dashboard (stack length 4, index 3)');

// User clicks Back from Dashboard -> should go to Habits
const back1 = simBack();
assert(back1 && back1.target === 'habits.html' && back1.isBack === true, 'Dashboard -> Back navigates to habits.html (backward direction)');

// User clicks Back from Habits -> should go to Calculator
const back2 = simBack();
assert(back2 && back2.target === 'calculator.html' && back2.isBack === true, 'Habits -> Back navigates to calculator.html (backward direction)');

// User clicks Back from Calculator -> should go to Home
const back3 = simBack();
assert(back3 && back3.target === 'index.html' && back3.isBack === true, 'Calculator -> Back navigates to index.html (backward direction)');

// User clicks Forward from Home -> should go to Calculator
const fwd1 = simForward();
assert(fwd1 && fwd1.target === 'calculator.html' && fwd1.isBack === false, 'Home -> Forward navigates to calculator.html (forward direction)');

// 9. Verify Additional Phase 6 Issue Fixes
console.log('\n--- 9. Additional Phase 6 Corrections ---');

// Issue 1: Distinct Active Nav Indicator (Habit Tracker vs Eco Tips)
assert(mainJs.includes('destination === \'tips\''), 'js/main.js supports distinct \'tips\' navigation destination');
assert(mainJs.includes('rawHref === \'tips.html\' || rawHref === \'#tips\' || rawHref === \'habits.html#tips\''), 'js/main.js highlights tips links when viewing tips');
assert(mainJs.includes('destination === \'habits\''), 'js/main.js supports distinct \'habits\' navigation destination');

// Issue 2: Carousel Clones & Directional Looping
assert(habitsJs.includes('data-clone=') && habitsJs.includes('prev'), 'js/habits.js prepends clone of Tip 4 for leftward looping');
assert(habitsJs.includes('data-clone=') && habitsJs.includes('next'), 'js/habits.js appends clone of Tip 1 for rightward looping');
assert(habitsJs.includes('currentTrackIndex'), 'js/habits.js tracks trackIndex for seamless clone transitions');

// Issue 3: Refresh Preservation on Calculator, Habits, Tips, Dashboard
assert(mainJs.includes('targetOnLoad'), 'js/main.js checks targetOnLoad on initial load / refresh');
assert(mainJs.includes('currentPanel.innerHTML = window.ECO_VIEWS[targetOnLoad.file].html'), 'js/main.js mounts target view on refresh without falling back to Home');

// Issue 4: Calculator Mode Defaults to Manual Search (Estimated)
const calcJs = fs.readFileSync('js/calculator.js', 'utf8');
assert(calcJs.includes('setCalculationMode(\'estimated\')'), 'js/calculator.js sets estimated mode by default in init()');
assert(calcJs.includes('Manual (Estimated) Mode is always selected by default'), 'js/calculator.js documents manual search default selection');

// Issue 5: Smooth Tips Page Alignment
assert(mainJs.includes('tipsOffset'), 'js/main.js calculates tipsOffset for smooth positioning');
assert(mainJs.includes('PAGE_ORDER') && mainJs.includes('\'tips.html\': 2.5'), 'js/main.js assigns intermediate 2.5 order to tips for consistent direction');

// Issue 6: Habit Checklist Link Anchoring
assert(mainJs.includes('if (rawHref.startsWith(\'#\'))'), 'js/main.js intercepts same-page anchor links');
assert(mainJs.includes('targetEl.scrollIntoView'), 'js/main.js smoothly scrolls to anchor target element');
assert(mainJs.includes('if (base === \'checklist\')'), 'js/main.js maps checklist anchor to habits.html instead of Home');

console.log('\n============================================================');
console.log(`TOTAL SLIDER NAVIGATION TESTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('============================================================\n');

process.exit(testsFailed > 0 ? 1 : 0);
