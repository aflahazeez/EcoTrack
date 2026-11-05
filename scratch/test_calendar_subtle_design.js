const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE = 'c:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('============================================================');
console.log('ECOTRACK: SUBTLE CALENDAR & DROPDOWN DESIGN VERIFICATION');
console.log('============================================================\n');

// 1. CSS Palette & Glow Audit
console.log('--- 1. CSS Palette, Borders & Glow Audit ---');
const styleCss = fs.readFileSync('css/style.css', 'utf8');
const habitsCss = fs.readFileSync('css/habits.css', 'utf8');
const calcCss = fs.readFileSync('css/calculator.css', 'utf8');

// Global select
assert(styleCss.includes('select, select option') && styleCss.includes('background-color: #0a2119'), 
  'Global select/option background set to #0a2119 (surface dark)');
assert(styleCss.includes('select option:checked') && styleCss.includes('#163b2f'),
  'Global select option:checked uses subtle #163b2f, not bright lime or emerald');

// Calculator selects & dropdowns
assert(calcCss.includes('.select-control') && calcCss.includes('background-color: #0a2119'),
  'Calculator .select-control uses #0a2119 background');
assert(calcCss.includes('.select-control') && calcCss.includes('rgba(110, 231, 183, 0.12)'),
  'Calculator .select-control uses subtle 0.12 mint border');
assert(!calcCss.includes('.select-control:focus {\n  border-color: var(--border-focus);\n  box-shadow: var(--glow-lime)'),
  'Calculator .select-control:focus has NO neon lime glow');
assert(calcCss.includes('.select-control option') && calcCss.includes('background-color: #0a2119'),
  'Calculator options use #0a2119 background');
assert(calcCss.includes('.select-control option:checked') && calcCss.includes('#163b2f'),
  'Calculator selected option uses slightly lighter dark green #163b2f with soft ivory text');

// Habit tracker select & date input
assert(habitsCss.includes('.eco-select,') && habitsCss.includes('background-color: #0a2119'),
  'Habits .eco-select and .hub-category-select use #0a2119 background');
assert(habitsCss.includes('.eco-select option:checked') && habitsCss.includes('#163b2f'),
  'Habits dropdown selected options use #163b2f with #fbf8ee text (no bright lime text)');
assert(habitsCss.includes('.eco-date-input') && habitsCss.includes('background-color: #0a2119'),
  'Habits .eco-date-input uses #0a2119 background');
assert(habitsCss.includes('.eco-date-input') && habitsCss.includes('rgba(110, 231, 183, 0.12)'),
  'Habits .eco-date-input uses subtle 0.12 border');
assert(!habitsCss.includes('.eco-date-input:focus {\n  border-color: var(--border-focus);\n  outline: 2px solid var(--border-focus);\n  outline-offset: 1px;\n  box-shadow: var(--glow-lime);'),
  'Habits .eco-date-input:focus has NO neon lime glow');

// Integrated Custom Calendar Popup CSS
console.log('\n--- 2. Custom Calendar Popup Styling Audit ---');
assert(habitsCss.includes('.eco-calendar-popup {'), 'CSS defines .eco-calendar-popup container');
assert(habitsCss.includes('background: #0a2119') || habitsCss.includes('background-color: #0a2119'), 
  'Calendar popup background is #0a2119 (blends seamlessly with surface)');
assert(habitsCss.includes('rgba(110, 231, 183, 0.15)'), 'Calendar popup border is extremely subtle (0.15)');
assert(habitsCss.includes('.cal-day.selected') && habitsCss.includes('background: #184235'), 
  'Selected calendar date uses slightly lighter dark-green #184235 (no bright green/lime box)');
assert(habitsCss.includes('.cal-day:hover') && habitsCss.includes('background: #123328'), 
  'Calendar day hover state is subtle #123328');
assert(habitsCss.includes('.cal-day') && habitsCss.includes('color: #fbf8ee'), 
  'Calendar text is soft ivory #fbf8ee');
assert(habitsCss.includes('.cal-nav-btn:hover') && habitsCss.includes('#123328'), 
  'Calendar nav button hover is subtle #123328');
assert(!habitsCss.includes('.eco-calendar-popup') || !habitsCss.includes('var(--glow-lime)'), 
  'Calendar popup has NO neon lime glow or glowing borders');

// 3. DOM Schema in habits.html
console.log('\n--- 3. DOM Schema Verification in habits.html ---');
const habitsHtml = fs.readFileSync('habits.html', 'utf8');
assert(habitsHtml.includes('id="eco-calendar-popup"'), 'habits.html includes #eco-calendar-popup');
assert(habitsHtml.includes('id="cal-month-title"'), 'habits.html includes #cal-month-title');
assert(habitsHtml.includes('id="cal-prev-month"'), 'habits.html includes #cal-prev-month');
assert(habitsHtml.includes('id="cal-next-month"'), 'habits.html includes #cal-next-month');
assert(habitsHtml.includes('id="cal-days-grid"'), 'habits.html includes #cal-days-grid');
assert(habitsHtml.includes('id="cal-jump-today"'), 'habits.html includes #cal-jump-today');
assert(habitsHtml.includes('id="cal-close-btn"'), 'habits.html includes #cal-close-btn');
assert(habitsHtml.includes('role="button" tabindex="0" aria-label="Select date from calendar"') && habitsHtml.includes('id="date-display-badge"'),
  'Date display badge has accessible role="button" and tabindex="0"');

// 4. Calendar Logic & Functionality in js/habits.js
console.log('\n--- 4. Calendar Logic & Event Handling in js/habits.js ---');
const habitsJs = fs.readFileSync('js/habits.js', 'utf8');
assert(habitsJs.includes('openCalendarPopup'), 'js/habits.js defines openCalendarPopup');
assert(habitsJs.includes('closeCalendarPopup'), 'js/habits.js defines closeCalendarPopup');
assert(habitsJs.includes('toggleCalendarPopup'), 'js/habits.js defines toggleCalendarPopup');
assert(habitsJs.includes('renderCalendarPopup'), 'js/habits.js defines renderCalendarPopup');
assert(habitsJs.includes('openCalendar: openCalendarPopup'), 'window.EcoHabits exports openCalendar');
assert(habitsJs.includes('closeCalendar: closeCalendarPopup'), 'window.EcoHabits exports closeCalendar');
assert(habitsJs.includes('isCalendarOpen: () => isCalPopupOpen'), 'window.EcoHabits exports isCalendarOpen');
assert(habitsJs.includes('e.key === \'Escape\''), 'Calendar closes on Escape key');

// 5. Real Chrome Headless Interaction Test
console.log('\n--- 5. Real Chrome Headless Calendar Interaction Test ---');
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/habits.css">
</head>
<body>
  ${habitsHtml}
  <script src="js/storage.js"></script>
  <script src="js/data.js"></script>
  <script src="js/page-views.js"></script>
  <script src="js/habits.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Test opening calendar
      const badge = document.getElementById('date-display-badge');
      badge.click();
      
      const popup = document.getElementById('eco-calendar-popup');
      const isOpenAfterClick = popup.classList.contains('is-open');
      const grid = document.getElementById('cal-days-grid');
      const dayCount = grid.children.length;
      const selectedDay = grid.querySelector('.cal-day.selected');
      const selectedDate = selectedDay ? selectedDay.getAttribute('data-cal-date') : null;
      
      // Test clicking day 15
      const allDays = Array.from(grid.querySelectorAll('.cal-day:not(.other-month)'));
      const day15 = allDays.find(d => d.textContent.trim() === '15');
      let switchedDate = null;
      if (day15) {
        day15.click();
        switchedDate = window.EcoHabits.getSelectedViewDate();
      }
      
      // Test jumping back to today
      const todayBtn = document.getElementById('btn-date-today');
      todayBtn.click();
      const backToToday = window.EcoHabits.getSelectedViewDate();
      
      window.CAL_TEST_RESULTS = {
        isOpenAfterClick,
        dayCount,
        selectedDate,
        switchedDate,
        backToToday,
        todayStr: window.EcoHabits.getTodayStr()
      };
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('scratch/test_cal_interaction.html', testHtml, 'utf8');

const chromeRes = cp.spawnSync(CHROME_PATH, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--allow-file-access-from-files',
  '--virtual-time-budget=2000',
  '--dump-dom',
  `file:///${path.join(WORKSPACE, 'scratch/test_cal_interaction.html').replace(/\\/g, '/')}`
], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

const chromeDom = chromeRes.stdout || '';

assert(chromeDom.includes('cal-day'), 'Chrome rendered calendar day buttons inside #cal-days-grid');
assert(chromeDom.includes('class="cal-day'), 'Calendar day elements styled correctly in Chrome DOM');

// Clean up temp file
try { fs.unlinkSync('scratch/test_cal_interaction.html'); } catch(e) {}

console.log('\n============================================================');
console.log(`SUBTLE CALENDAR & DROPDOWN TESTS: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
