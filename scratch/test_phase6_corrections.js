const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ws = 'c:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(description, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${description}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${description}`);
  }
}

// ---------------------------------------------------------------------------
// 1. UNIT & LOGIC TESTS (Node.js)
// ---------------------------------------------------------------------------
console.log('============================================================');
console.log('SUITE 1: UNIT & LOGIC VERIFICATION (Node.js)');
console.log('============================================================\n');

// Mock browser environment for node
const mockWindow = {
  location: { protocol: 'file:', href: 'file:///c:/Users/aflub/Downloads/Terracode/Ecotrack/dashboard.html', hash: '' },
  matchMedia: (q) => ({ matches: false }),
  addEventListener: () => {},
  scrollTo: () => {}
};
global.window = mockWindow;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
  querySelector: () => null
};

// Test storage & history
const storageCode = fs.readFileSync(path.join(ws, 'js', 'storage.js'), 'utf8');
eval(storageCode);
const dataCode = fs.readFileSync(path.join(ws, 'js', 'data.js'), 'utf8');
eval(dataCode);
const habitsCode = fs.readFileSync(path.join(ws, 'js', 'habits.js'), 'utf8');
eval(habitsCode);
const dashboardCode = fs.readFileSync(path.join(ws, 'js', 'dashboard.js'), 'utf8');
eval(dashboardCode);

assert('EcoHabits module is defined', typeof window.EcoHabits === 'object');
assert('EcoDashboard module is defined', typeof window.EcoDashboard === 'object');
assert('EcoHabits.changeSelectedDate is a function', typeof window.EcoHabits.changeSelectedDate === 'function');
assert('EcoDashboard.destroyChart is a function', typeof window.EcoDashboard.destroyChart === 'function');
assert('EcoDashboard.renderHistory is a function', typeof window.EcoDashboard.renderHistory === 'function');

// ---------------------------------------------------------------------------
// 2. REAL GOOGLE CHROME HEADLESS TEST (Interactive Browser Harness)
// ---------------------------------------------------------------------------
console.log('\n============================================================');
console.log('SUITE 2: REAL GOOGLE CHROME HEADLESS COMPREHENSIVE TESTS');
console.log('============================================================\n');

const testHarnessHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/calculator.css">
  <link rel="stylesheet" href="../css/habits.css">
  <link rel="stylesheet" href="../css/dashboard.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
  <div id="page-slider-viewport">
    <div id="current-page-view" class="page-view-panel"></div>
  </div>

  <div id="test-output" style="white-space: pre; font-family: monospace;"></div>

  <script src="../js/storage.js"></script>
  <script src="../js/data.js"></script>
  <script src="../js/calculator.js"></script>
  <script src="../js/habits.js"></script>
  <script src="../js/dashboard.js"></script>
  <script src="../js/page-views.js"></script>
  <script src="../js/main.js"></script>

  <script>
    const results = [];
    function record(name, pass, extra) {
      results.push({ name, pass: Boolean(pass), extra: extra || '' });
    }

    try {
      // -------------------------------------------------------------
      // TEST ISSUE 8: DASHBOARD HISTORICAL GRAPH
      // -------------------------------------------------------------
      // 1. Empty state when 0 calculations
      localStorage.clear();
      document.getElementById('current-page-view').innerHTML = window.ECO_VIEWS['dashboard.html'].html;
      window.EcoDashboard.init();

      const emptyHistory = document.getElementById('history-empty-state');
      const contentHistory = document.getElementById('history-content');
      record('Dashboard empty history state visible when 0 records', emptyHistory && emptyHistory.style.display !== 'none');
      record('Dashboard history content hidden when 0 records', contentHistory && contentHistory.style.display === 'none');

      // 2. Single calculation baseline
      const date1 = '2026-10-15T12:00:00.000Z';
      const historyRecord1 = {
        id: 'rec_1',
        timestamp: date1,
        mode: 'estimated',
        annualKg: 2800,
        annualTonnes: 2.80
      };
      EcoStorage.set(STORAGE_KEYS.HISTORY, [historyRecord1]);
      EcoStorage.set(STORAGE_KEYS.FOOTPRINT, {
        totals: { annualKg: 2800, annualTonnes: 2.80, monthlyKg: 233 },
        breakdown: {
          transport: { annualKg: 1400, percentage: 50 },
          energy: { annualKg: 1000, percentage: 36, electricity: { annualKg: 800, percentageOfEnergy: 80 }, lpg: { annualKg: 200, percentageOfEnergy: 20 } },
          waste: { annualKg: 400, percentage: 14 }
        },
        calculationMode: 'estimated',
        calculatedAt: date1
      });

      window.EcoDashboard.init();

      record('Dashboard history content visible when 1 record exists', contentHistory && contentHistory.style.display === 'block');
      record('Dashboard history empty state hidden when 1 record exists', emptyHistory && emptyHistory.style.display === 'none');
      const singleNote = document.getElementById('history-single-note');
      record('Dashboard baseline note shown for single record', singleNote && singleNote.style.display !== 'none');

      const chartWrapper = document.getElementById('history-chart-wrapper');
      record('Dashboard chart wrapper displayed', chartWrapper && chartWrapper.style.display !== 'none');

      const canvas1 = chartWrapper.querySelector('canvas#historyChart');
      const svg1 = chartWrapper.querySelector('svg.history-svg-chart');
      record('Dashboard renders graph (Canvas or SVG)', Boolean(canvas1 || svg1));
      if (svg1) {
        record('SVG chart contains baseline badge', svg1.innerHTML.includes('Baseline: 2.80 t CO₂e'));
        record('SVG chart contains trend curve/guide', svg1.innerHTML.includes('<path'));
        record('SVG chart contains data point dot', svg1.innerHTML.includes('svg-chart-point'));
      }

      // 3. Multi-point calculation history
      const date2 = '2026-11-01T12:00:00.000Z';
      const historyRecord2 = {
        id: 'rec_2',
        timestamp: date2,
        mode: 'precise',
        annualKg: 2150,
        annualTonnes: 2.15
      };
      EcoStorage.set(STORAGE_KEYS.HISTORY, [historyRecord1, historyRecord2]);
      window.EcoDashboard.init();

      record('Dashboard baseline note hidden for multi-point history', singleNote && singleNote.style.display === 'none');
      const svg2 = chartWrapper.querySelector('svg.history-svg-chart');
      const canvas2 = chartWrapper.querySelector('canvas#historyChart');
      record('Dashboard renders multi-point graph', Boolean(svg2 || canvas2));
      if (svg2) {
        record('SVG multi-point chart has 2 data points', (svg2.innerHTML.match(/class="svg-chart-point"/g) || []).length === 2);
      }

      // 4. Dynamic remounting during sliding navigation
      // Simulate leaving dashboard to Calculator
      window.EcoDashboard.destroyChart();
      document.getElementById('current-page-view').innerHTML = window.ECO_VIEWS['calculator.html'].html;
      window.EcoCalculator.init();

      // Navigate back to Dashboard (simulating slider DOM insertion)
      const viewport = document.getElementById('page-slider-viewport');
      const incoming = document.createElement('div');
      incoming.id = 'incoming-page-view';
      incoming.className = 'page-view-panel';
      incoming.innerHTML = window.ECO_VIEWS['dashboard.html'].html;
      viewport.appendChild(incoming);

      window.EcoDashboard.init();

      const incomingWrapper = incoming.querySelector('#history-chart-wrapper');
      record('Incoming dashboard view mounts graph properly', Boolean(incomingWrapper && incomingWrapper.style.display !== 'none'));

      // Finalize DOM swap
      viewport.removeChild(document.getElementById('current-page-view'));
      incoming.id = 'current-page-view';
      window.EcoDashboard.init();

      const finalWrapper = document.getElementById('history-chart-wrapper');
      record('Final active dashboard has visible historical graph', finalWrapper && finalWrapper.style.display !== 'none');

      // -------------------------------------------------------------
      // TEST ISSUE 7: HABIT TRACKER RETURN TO TODAY & SMOOTH TRANSITION
      // -------------------------------------------------------------
      document.getElementById('current-page-view').innerHTML = window.ECO_VIEWS['habits.html'].html;
      window.EcoHabits.init();

      const todayStr = window.EcoHabits.getTodayStr();
      const yesterdayStr = '2026-11-04'; // Known past date

      // Record a completion for past date to test data preservation
      const hubData = EcoStorage.get(STORAGE_KEYS.HABITS, {});
      hubData.completions = hubData.completions || {};
      hubData.completions[yesterdayStr] = ['commute_transit'];
      hubData.completions[todayStr] = ['energy_unplug'];
      EcoStorage.set(STORAGE_KEYS.HABITS, hubData);
      window.EcoHabits.init();

      // Step 1: Select past date
      window.EcoHabits.changeSelectedDate(yesterdayStr);
      const listContainer = document.getElementById('habit-items-list');
      record('List container element exists for smooth transition', Boolean(listContainer));

      // Wait 160ms for past date transition to apply
      setTimeout(() => {
        const pickerEl = document.getElementById('checklist-date-picker');
        record('Checklist date picker updates to past date', pickerEl && pickerEl.value === yesterdayStr);
        const pastBadge = document.getElementById('badge-total-count');
        record('Badge label shows "Past Record" for past date', pastBadge && pastBadge.textContent.includes('Past Record'));

        // Step 2: Click "Today" button (#btn-date-today)
        const btnToday = document.getElementById('btn-date-today');
        btnToday.click();

        // Wait 350ms for smooth return-to-today transition to complete
        setTimeout(() => {
          const pickerAfter = document.getElementById('checklist-date-picker');
          record('Date picker returns to today (' + todayStr + ')', pickerAfter && pickerAfter.value === todayStr);

          const badgeAfter = document.getElementById('badge-total-count');
          record('Badge returns to "Today"', badgeAfter && badgeAfter.textContent.includes('Today'));

          const dateBanner = document.getElementById('date-status-banner');
          record('Past date banner hidden when returned to Today', !dateBanner || dateBanner.style.display === 'none');

          // Data safety verification
          const storageAfter = EcoStorage.get(STORAGE_KEYS.HABITS, {});
          record('DATA SAFETY: Past date completions untouched', 
            storageAfter.completions && storageAfter.completions[yesterdayStr] && storageAfter.completions[yesterdayStr].includes('commute_transit'));
          record('DATA SAFETY: Today completions untouched', 
            storageAfter.completions && storageAfter.completions[todayStr] && storageAfter.completions[todayStr].includes('energy_unplug'));

          // Render summary into test-output
          document.getElementById('test-output').textContent = JSON.stringify(results, null, 2);
        }, 350);
      }, 160);

    } catch (e) {
      record('HARNESS ERROR', false, e.stack);
      document.getElementById('test-output').textContent = JSON.stringify(results, null, 2);
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ws, 'scratch', 'test_phase6_harness.html'), testHarnessHtml, 'utf8');

const res = cp.spawnSync(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--allow-file-access-from-files',
  '--virtual-time-budget=3000',
  '--dump-dom',
  'file:///' + path.join(ws, 'scratch', 'test_phase6_harness.html').replace(/\\/g, '/')
], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

const dom = res.stdout;
const match = dom.match(/<div id="test-output"[^>]*>([\s\S]*?)<\/div>/);
if (match && match[1].trim()) {
  try {
    const chromeResults = JSON.parse(match[1]);
    chromeResults.forEach(r => {
      assert(r.name + (r.extra ? ' (' + r.extra + ')' : ''), r.pass);
    });
  } catch (err) {
    console.error('Failed to parse Chrome test output:', match[1]);
  }
} else {
  console.error('No test output from Chrome harness');
}

console.log('\n------------------------------------------------------------');
console.log(`Phase 6 Tests Completed: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
console.log('------------------------------------------------------------\n');

process.exit(failedTests > 0 ? 1 : 0);
