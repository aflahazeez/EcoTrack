const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE = 'c:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

let chromeTestsPassed = 0;
let chromeTestsFailed = 0;

function check(msg, cond) {
  if (cond) {
    chromeTestsPassed++;
    console.log(`  PASS: ${msg}`);
  } else {
    chromeTestsFailed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function runChrome(url) {
  const fileUrl = url.startsWith('http') ? url : `file:///${url.replace(/\\/g, '/')}`;
  const res = cp.spawnSync(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--virtual-time-budget=2000',
    '--dump-dom',
    fileUrl
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

  if (res.error) throw res.error;
  return res.stdout || '';
}

console.log('============================================================');
console.log('REAL GOOGLE CHROME HEADLESS TEST SUITE');
console.log('Using executable: ' + CHROME_PATH);
console.log('============================================================\n');

// 1. Test index.html in Chrome
console.log('--- 1. Testing index.html in Real Chrome ---');
const indexDom = runChrome(path.join(WORKSPACE, 'index.html'));
check('index.html renders title "EcoTrack"', indexDom.includes('<title>EcoTrack'));
check('index.html highlights Home nav link with active and aria-current="page"', 
  indexDom.includes('href="index.html" class="nav-link active"') || indexDom.includes('href="index.html" class="nav-link active" aria-current="page"'));
check('index.html does not highlight Calculator nav link', !indexDom.includes('href="calculator.html" class="nav-link active"'));
check('index.html does not highlight Habit Tracker nav link', !indexDom.includes('href="habits.html" class="nav-link active"'));
check('index.html does not highlight Eco Tips nav link', !indexDom.includes('href="tips.html" class="nav-link active"'));
check('index.html mounts #page-slider-viewport and #current-page-view', indexDom.includes('id="page-slider-viewport"') && indexDom.includes('id="current-page-view"'));

// 2. Test calculator.html in Chrome (Issue 4: Manual Search Default)
console.log('\n--- 2. Testing calculator.html in Real Chrome ---');
const calcDom = runChrome(path.join(WORKSPACE, 'calculator.html'));
check('calculator.html renders title "Carbon Calculator | EcoTrack"', calcDom.includes('<title>Carbon Calculator | EcoTrack</title>'));
check('calculator.html highlights Calculator nav link as active', calcDom.includes('href="calculator.html" class="nav-link active"'));
check('calculator.html does not highlight Home nav link as active', !calcDom.includes('href="index.html" class="nav-link active"'));
check('calculator.html has #mode-card-estimated with class active and aria-checked="true"', 
  calcDom.includes('id="mode-card-estimated"') && calcDom.includes('aria-checked="true"'));
check('calculator.html has #mode-card-precise with aria-checked="false" (Manual Search default)', 
  calcDom.includes('id="mode-card-precise"') && calcDom.includes('aria-checked="false"'));
check('calculator.html wizard starts in data-mode="estimated"', calcDom.includes('calculator-wizard') && calcDom.includes('data-mode="estimated"'));
check('calculator.html step 1 is active panel', calcDom.includes('id="step-panel-1"') && calcDom.includes('step-panel active'));

// 3. Test habits.html in Chrome (Issue 1 & Issue 2: Carousel Clones & Habits Nav)
console.log('\n--- 3. Testing habits.html in Real Chrome ---');
const habitsDom = runChrome(path.join(WORKSPACE, 'habits.html'));
check('habits.html renders title "Sustainable Living Hub | EcoTrack"', habitsDom.includes('<title>Sustainable Living Hub | EcoTrack</title>'));
check('habits.html highlights Habit Tracker nav link as active', habitsDom.includes('href="habits.html" class="nav-link active"'));
check('habits.html does NOT highlight Eco Tips nav link (#tips) when on Habit Tracker', !habitsDom.includes('href="#tips" class="nav-link active"'));
check('habits.html renders .carousel-track inside #carousel-viewport', habitsDom.includes('class="carousel-track" id="carousel-track"'));
check('habits.html renders backward clone data-clone="prev" for continuous leftward looping', habitsDom.includes('data-clone="prev"'));
check('habits.html renders forward clone data-clone="next" for continuous rightward looping', habitsDom.includes('data-clone="next"'));
check('habits.html contains exactly 4 carousel dots', (habitsDom.match(/data-slide-index="[0-3]"/g) || []).length >= 4);
check('habits.html contains checklist navigation anchor #checklist', habitsDom.includes('href="#checklist"'));
check('habits.html contains date navigation controls bar .checklist-date-nav', habitsDom.includes('class="checklist-date-nav"'));
check('habits.html contains date input #checklist-date-picker', habitsDom.includes('id="checklist-date-picker"'));
check('habits.html contains Today jump button #btn-date-today', habitsDom.includes('id="btn-date-today"'));
check('habits.html contains past return button #btn-past-return-today', habitsDom.includes('id="btn-past-return-today"'));
check('habits.html contains future return button #btn-future-return-today', habitsDom.includes('id="btn-future-return-today"'));

// 4. Test tips navigation & tips.html in Chrome
console.log('\n--- 4. Testing tips.html in Real Chrome ---');
const tipsDom = runChrome(path.join(WORKSPACE, 'tips.html'));
check('tips.html loads and renders meta refresh or redirects to habits.html#tips', tipsDom.includes('content="0; url=habits.html#tips"') || tipsDom.includes('habits.html#tips'));

// 5. Test dashboard.html in Chrome (Issue 8: Historical Trend Graph Schema & Structure)
console.log('\n--- 5. Testing dashboard.html in Real Chrome ---');
const dashDom = runChrome(path.join(WORKSPACE, 'dashboard.html'));
check('dashboard.html renders title "Personal Impact Dashboard | EcoTrack"', dashDom.includes('<title>Personal Impact Dashboard | EcoTrack</title>'));
check('dashboard.html highlights Dashboard nav link as active', dashDom.includes('href="dashboard.html" class="nav-link active"'));
check('dashboard.html does not highlight Calculator as active', !dashDom.includes('href="calculator.html" class="nav-link active"'));
check('dashboard.html does not highlight Habit Tracker as active', !dashDom.includes('href="habits.html" class="nav-link active"'));
check('dashboard.html contains chart wrapper #history-chart-wrapper', dashDom.includes('id="history-chart-wrapper"'));
check('dashboard.html contains canvas #historyChart with aria-label', dashDom.includes('id="historyChart"'));
check('dashboard.html contains fallback table wrapper #history-fallback-wrapper', dashDom.includes('id="history-fallback-wrapper"'));
check('dashboard.html contains baseline single assessment note #history-single-note', dashDom.includes('id="history-single-note"'));
check('dashboard.html contains history empty state #history-empty-state', dashDom.includes('id="history-empty-state"'));

// 6. Test Refresh / TargetOnLoad in Chrome (Issue 3: Calculator survives refresh)
console.log('\n--- 6. Testing Refresh & TargetOnLoad under file:// in Real Chrome ---');
const refreshCalcDom = runChrome(path.join(WORKSPACE, 'index.html') + '#calculator');
check('index.html#calculator renders Calculator page content on reload', refreshCalcDom.includes('id="mode-card-estimated"'));
check('index.html#calculator sets title to Calculator', refreshCalcDom.includes('<title>Carbon Calculator | EcoTrack</title>'));
check('index.html#calculator highlights Calculator nav link as active', refreshCalcDom.includes('href="calculator.html" class="nav-link active"'));
check('index.html#calculator does not display Home active link', !refreshCalcDom.includes('href="index.html" class="nav-link active"'));

// 7. Test index.html#tips in Chrome (Issue 1: Eco Tips highlighted distinctly)
console.log('\n--- 7. Testing index.html#tips in Real Chrome ---');
const refreshTipsDom = runChrome(path.join(WORKSPACE, 'index.html') + '#tips');
check('index.html#tips renders Sustainable Living Hub content', refreshTipsDom.includes('Sustainable Living Hub'));
check('index.html#tips highlights Eco Tips nav link as active', 
  refreshTipsDom.includes('href="#tips" class="nav-link active"') || refreshTipsDom.includes('href="tips.html" class="nav-link active"') || refreshTipsDom.includes('href="habits.html#tips" class="nav-link active"'));
check('index.html#tips does NOT highlight Habit Tracker nav link', !refreshTipsDom.includes('href="habits.html" class="nav-link active"'));

// 8. Test index.html#dashboard in Chrome
console.log('\n--- 8. Testing index.html#dashboard in Real Chrome ---');
const refreshDashDom = runChrome(path.join(WORKSPACE, 'index.html') + '#dashboard');
check('index.html#dashboard renders Dashboard content on reload', refreshDashDom.includes('Personal Analytics'));
check('index.html#dashboard highlights Dashboard nav link as active', refreshDashDom.includes('href="dashboard.html" class="nav-link active"'));
check('index.html#dashboard does not highlight Home active link', !refreshDashDom.includes('href="index.html" class="nav-link active"'));

console.log('\n============================================================');
console.log(`REAL GOOGLE CHROME RESULTS: ${chromeTestsPassed} PASSED, ${chromeTestsFailed} FAILED`);
console.log('============================================================\n');

process.exit(chromeTestsFailed > 0 ? 1 : 0);
