/**
 * EcoTrack – Phase 5 Dashboard Comprehensive Verification Suite
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Verifies:
 * 1. DOM markup and element IDs in dashboard.html.
 * 2. CSS styles, Dark Botanical tokens and responsive rules in css/dashboard.css.
 * 3. History snapshot logging and duplicate prevention in js/calculator.js.
 * 4. Independent empty states for footprint, habits, and history.
 * 5. Data rendering for footprint, category breakdowns, subcategories, and streaks.
 * 6. Single vs multi-point historical calculations.
 * 7. Fallback table and Chart.js integration resilience.
 * 8. Zero competition branding in UI text.
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('============================================================');
console.log('ECOTRACK PHASE 5: PERSONAL IMPACT DASHBOARD AUDIT SUITE');
console.log('============================================================\n');

// -----------------------------------------------------------------------------
// 1. DOM Element & Schema Verification in dashboard.html
// -----------------------------------------------------------------------------
console.log('--- 1. Dashboard DOM Elements & Markup Schema ---');
const dashboardHtmlPath = path.join(__dirname, '..', 'dashboard.html');
const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');

const requiredDashboardIds = [
  'main-content',
  'footprint-content',
  'footprint-empty-state',
  'dash-footprint-tonnes',
  'dash-footprint-monthly',
  'dash-mode-badge',
  'dash-calc-date',
  'dash-trans-kg',
  'dash-trans-pct',
  'dash-trans-bar',
  'dash-energy-kg',
  'dash-energy-pct',
  'dash-energy-bar',
  'dash-subcat-elec',
  'dash-subcat-lpg',
  'dash-waste-kg',
  'dash-waste-pct',
  'dash-waste-bar',
  'habits-content',
  'habits-empty-state',
  'dash-habit-today-pct',
  'dash-habit-today-count',
  'dash-habit-today-bar',
  'dash-habit-current-streak',
  'dash-habit-longest-streak',
  'dash-habit-total-completions',
  'dash-habit-total-registered',
  'history-content',
  'history-empty-state',
  'history-chart-wrapper',
  'historyChart',
  'history-fallback-wrapper',
  'history-fallback-body',
  'history-single-note',
  'dash-activity-list'
];

requiredDashboardIds.forEach(id => {
  assert(dashboardHtml.includes(`id="${id}"`), `dashboard.html contains #${id}`);
});

assert(dashboardHtml.includes('href="css/dashboard.css"'), 'dashboard.html links css/dashboard.css');
assert(dashboardHtml.includes('src="js/dashboard.js"'), 'dashboard.html loads js/dashboard.js');
assert(dashboardHtml.includes('chart.umd.min.js'), 'dashboard.html loads Chart.js CDN');
assert(dashboardHtml.includes('src="js/storage.js"'), 'dashboard.html loads js/storage.js');
assert(dashboardHtml.includes('src="js/data.js"'), 'dashboard.html loads js/data.js');

// -----------------------------------------------------------------------------
// 2. CSS Stylesheet Rules in css/dashboard.css
// -----------------------------------------------------------------------------
console.log('\n--- 2. CSS Rules & Styling Integrity ---');
const dashboardCssPath = path.join(__dirname, '..', 'css', 'dashboard.css');
const dashboardCss = fs.readFileSync(dashboardCssPath, 'utf8');

assert(dashboardCss.includes('.dashboard-header'), 'css/dashboard.css styles .dashboard-header');
assert(dashboardCss.includes('.dashboard-main-grid'), 'css/dashboard.css styles .dashboard-main-grid');
assert(dashboardCss.includes('.footprint-hero'), 'css/dashboard.css styles .footprint-hero');
assert(dashboardCss.includes('.category-progress-fill'), 'css/dashboard.css styles .category-progress-fill');
assert(dashboardCss.includes('.energy-subcategories'), 'css/dashboard.css styles .energy-subcategories');
assert(dashboardCss.includes('.habits-overview-grid'), 'css/dashboard.css styles .habits-overview-grid');
assert(dashboardCss.includes('.chart-wrapper'), 'css/dashboard.css styles .chart-wrapper');
assert(dashboardCss.includes('.chart-fallback-table'), 'css/dashboard.css styles .chart-fallback-table');
assert(dashboardCss.includes('.dashboard-empty-card'), 'css/dashboard.css styles .dashboard-empty-card');
assert(dashboardCss.includes('.activity-item'), 'css/dashboard.css styles .activity-item');

// -----------------------------------------------------------------------------
// 3. Calculator History Snapshot & Deduplication Logic
// -----------------------------------------------------------------------------
console.log('\n--- 3. History Snapshot & Deduplication in js/calculator.js ---');
const calculatorJsPath = path.join(__dirname, '..', 'js', 'calculator.js');
const calculatorJs = fs.readFileSync(calculatorJsPath, 'utf8');

assert(calculatorJs.includes('saveFootprintHistorySnapshot'), 'calculator.js defines saveFootprintHistorySnapshot');
assert(calculatorJs.includes('STORAGE_KEYS.HISTORY'), 'calculator.js uses STORAGE_KEYS.HISTORY');
assert(calculatorJs.includes('saveFootprintHistorySnapshot(resultData)'), 'handleCalculate calls saveFootprintHistorySnapshot');
assert(calculatorJs.includes('saveHistorySnapshot: saveFootprintHistorySnapshot'), 'EcoCalculator exposes saveHistorySnapshot');

// Simulate storage environment and test history deduplication
global.window = global;
const mockStorage = {};
const mockEcoStorage = {
  get: (k, def) => mockStorage[k] !== undefined ? mockStorage[k] : def,
  set: (k, v) => { mockStorage[k] = JSON.parse(JSON.stringify(v)); return true; }
};

global.EcoStorage = mockEcoStorage;
global.STORAGE_KEYS = {
  FOOTPRINT: 'ecotrack_footprint_data',
  HABITS: 'ecotrack_habits_data',
  HISTORY: 'ecotrack_history_log'
};

// Evaluate calculator.js in a controlled sandbox
eval(calculatorJs);

assert(typeof global.window.EcoCalculator.saveHistorySnapshot === 'function', 'EcoCalculator.saveHistorySnapshot is a function');

const sampleResult = {
  calculatedAt: '2026-11-05T08:00:00.000Z',
  calculationMode: 'estimated',
  totals: {
    annualKg: 1350.5,
    annualTonnes: 1.35,
    monthlyKg: 112.54
  },
  breakdown: {
    transport: { annualKg: 650.0 },
    energy: {
      annualKg: 600.0,
      electricity: { annualKg: 450.0 },
      lpg: { annualKg: 150.0 }
    },
    waste: { annualKg: 100.5 }
  }
};

// Save once
global.window.EcoCalculator.saveHistorySnapshot(sampleResult);
let historyList = mockEcoStorage.get(global.STORAGE_KEYS.HISTORY, []);
assert(historyList.length === 1, 'First snapshot creates 1 history record');
assert(historyList[0].timestamp === '2026-11-05T08:00:00.000Z', 'History record stores correct timestamp');
assert(historyList[0].annualTonnes === 1.35, 'History record stores correct annual tonnes');
assert(historyList[0].mode === 'estimated', 'History record stores mode');
assert(historyList[0].categoryBreakdown.transport === 650.0, 'History record stores category breakdown');

// Save identical result again -> must be deduplicated
global.window.EcoCalculator.saveHistorySnapshot(sampleResult);
historyList = mockEcoStorage.get(global.STORAGE_KEYS.HISTORY, []);
assert(historyList.length === 1, 'Duplicate snapshot was rejected (length remains 1)');

// Save distinct second result -> should append
const sampleResult2 = {
  calculatedAt: '2026-11-05T09:30:00.000Z',
  calculationMode: 'precise',
  totals: {
    annualKg: 1100.0,
    annualTonnes: 1.10,
    monthlyKg: 91.67
  },
  breakdown: {
    transport: { annualKg: 500.0 },
    energy: {
      annualKg: 500.0,
      electricity: { annualKg: 400.0 },
      lpg: { annualKg: 100.0 }
    },
    waste: { annualKg: 100.0 }
  }
};

global.window.EcoCalculator.saveHistorySnapshot(sampleResult2);
historyList = mockEcoStorage.get(global.STORAGE_KEYS.HISTORY, []);
assert(historyList.length === 2, 'Second distinct calculation appended to history (length is 2)');
assert(historyList[1].mode === 'precise', 'Second calculation stores precise mode');

// -----------------------------------------------------------------------------
// 4. Dashboard Script Logic & Independent Empty States
// -----------------------------------------------------------------------------
console.log('\n--- 4. Dashboard Script Logic & Independent States in js/dashboard.js ---');
const dashboardJsPath = path.join(__dirname, '..', 'js', 'dashboard.js');
const dashboardJs = fs.readFileSync(dashboardJsPath, 'utf8');

// Evaluate dashboard.js in sandbox
eval(dashboardJs);

assert(typeof global.window.EcoDashboard === 'object', 'window.EcoDashboard is exposed');
assert(typeof global.window.EcoDashboard.init === 'function', 'EcoDashboard.init is a function');
assert(typeof global.window.EcoDashboard.renderAll === 'function', 'EcoDashboard.renderAll is a function');

// Test Empty State when storage is blank
mockStorage[global.STORAGE_KEYS.FOOTPRINT] = null;
mockStorage[global.STORAGE_KEYS.HABITS] = null;
mockStorage[global.STORAGE_KEYS.HISTORY] = [];

global.window.EcoDashboard.loadStorageData();
assert(global.window.EcoDashboard.getFootprintData() === null, 'Footprint data is null in blank storage');
assert(global.window.EcoDashboard.getHabitsData() === null, 'Habits data is null in blank storage');
assert(global.window.EcoDashboard.getHistoryData().length === 0, 'History data is empty in blank storage');

// Test Independent State: Footprint Only (No habits)
mockStorage[global.STORAGE_KEYS.FOOTPRINT] = sampleResult;
mockStorage[global.STORAGE_KEYS.HABITS] = null;
mockStorage[global.STORAGE_KEYS.HISTORY] = [];

global.window.EcoDashboard.loadStorageData();
assert(global.window.EcoDashboard.getFootprintData() !== null, 'Footprint data loaded');
assert(global.window.EcoDashboard.getHabitsData() === null, 'Habits data remains null independently');
// Check automatic history synchronization from footprint
const syncedHistory = global.window.EcoDashboard.getHistoryData();
assert(syncedHistory.length === 1, 'Single footprint backfilled 1 history entry automatically');
assert(syncedHistory[0].annualTonnes === 1.35, 'Backfilled entry matches footprint tonnes');

// Test Independent State: Habits Only (No footprint)
mockStorage[global.STORAGE_KEYS.FOOTPRINT] = null;
mockStorage[global.STORAGE_KEYS.HABITS] = {
  version: 2,
  habits: [
    { id: 'h1', title: 'Walk to school', category: 'Transportation' },
    { id: 'h2', title: 'Switch off lights', category: 'Energy' }
  ],
  completions: {
    '2026-11-04': ['h1'],
    '2026-11-05': ['h1', 'h2']
  },
  dailySelections: {
    '2026-11-05': ['h1', 'h2']
  },
  stats: {
    currentStreak: 2,
    longestStreak: 4,
    totalCompletions: 3
  }
};
mockStorage[global.STORAGE_KEYS.HISTORY] = [];

global.window.EcoDashboard.loadStorageData();
assert(global.window.EcoDashboard.getFootprintData() === null, 'Footprint is null independently');
assert(global.window.EcoDashboard.getHabitsData() !== null, 'Habits data loaded independently');
assert(global.window.EcoDashboard.getHabitsData().stats.currentStreak === 2, 'Habit streak correctly read');
assert(global.window.EcoDashboard.getHabitsData().stats.totalCompletions === 3, 'Lifetime completions correctly read');

// -----------------------------------------------------------------------------
// 5. Independent Brand Verification
// -----------------------------------------------------------------------------
console.log('\n--- 5. Independent Brand Verification ---');
const prohibitedBrandTerms = [
  'TERRACODE',
  'terracode',
  'FOSS Club',
  'foss club',
  'MEA Engineering',
  'mea engineering'
];

prohibitedBrandTerms.forEach(term => {
  assert(!dashboardHtml.includes(term), `dashboard.html has NO "${term}" in UI text`);
  assert(!dashboardCss.includes(term), `css/dashboard.css has NO "${term}"`);
  assert(!dashboardJs.includes(term), `js/dashboard.js has NO "${term}"`);
});

// -----------------------------------------------------------------------------
// 6. Exclusion of Unsupported / Complex Analytics
// -----------------------------------------------------------------------------
console.log('\n--- 6. Complex Analytics & Benchmark Integrity ---');
assert(!dashboardHtml.includes('globalHouseholdAverageTonnes'), 'dashboard.html does not display unsupported global baseline');
assert(!dashboardHtml.includes('indiaHouseholdAverageTonnes'), 'dashboard.html does not display unsupported national all-sector baseline');
assert(!dashboardHtml.includes('grade-a'), 'dashboard.html does not display unsupported letter grades');

// -----------------------------------------------------------------------------
// 7. UI Refinements Verification
// -----------------------------------------------------------------------------
console.log('\n--- 7. Dashboard & Homepage UI Refinements ---');
assert(dashboardHtml.includes('Personal Analytics'), 'dashboard.html contains "Personal Analytics" tag');
assert(!dashboardHtml.includes('Personal Analytics &bull; Phase 5'), 'dashboard.html does not contain "• Phase 5" in heading');
assert(!dashboardHtml.includes('Personal Analytics • Phase 5'), 'dashboard.html does not contain "• Phase 5" text');
assert(!dashboardHtml.includes('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'), 'dashboard.html does not contain dollar currency symbol');
assert(dashboardHtml.includes('M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z'), 'dashboard.html uses leaf symbol beside Latest Footprint metric');
assert(dashboardCss.includes('gap: 24px'), 'css/dashboard.css defines 24px vertical spacing between cards');
assert(dashboardCss.includes('gap: 20px'), 'css/dashboard.css defines 20px mobile spacing');

// Dashboard caption verification
assert(dashboardHtml.includes('Get an overview of your carbon footprint, track your daily sustainable habits, and monitor your environmental progress.'), 'dashboard.html contains exact updated caption');
assert(!dashboardHtml.includes('Unified command center tracking your latest carbon footprint evaluation'), 'dashboard.html removed old caption');

// Scope 1 & Scope 2 Busbar Boundary removal verification
assert(!dashboardHtml.includes('Scope 1 & Scope 2 Busbar Boundary'), 'dashboard.html removed "Scope 1 & Scope 2 Busbar Boundary"');
assert(!dashboardHtml.includes('Scope 1 &amp; Scope 2 Busbar Boundary'), 'dashboard.html removed HTML-escaped "Scope 1 & Scope 2 Busbar Boundary"');

// Homepage caption verification
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtml.includes('EcoTrack is a lightweight sustainability platform that helps you quantify annual carbon emissions, build daily eco-friendly routines, and track measurable environmental progress.'), 'index.html contains exact updated caption');
assert(!indexHtml.includes('progress—stored privately in your browser.'), 'index.html removed old caption ending');

console.log('\n============================================================');
console.log(`TOTAL PHASE 5 DASHBOARD AUDIT: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
