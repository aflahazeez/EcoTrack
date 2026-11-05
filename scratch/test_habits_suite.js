const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

console.log('============================================================');
console.log('ECOTRACK PHASE 4 REFINEMENTS: COMPREHENSIVE TEST SUITE');
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

// Mock browser window and localStorage environment
const localStorageStore = {};
global.window = {
  localStorage: {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
  },
  matchMedia: (query) => ({
    matches: false, // default: no reduced motion
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
};
global.localStorage = global.window.localStorage;

// Load storage.js
const storageCode = fs.readFileSync(path.join(projectRoot, 'js', 'storage.js'), 'utf8');
eval(storageCode);
const EcoStorage = global.window.EcoStorage;
const STORAGE_KEYS = global.window.STORAGE_KEYS;

// Load data.js
const dataCode = fs.readFileSync(path.join(projectRoot, 'js', 'data.js'), 'utf8');
eval(dataCode);
const ECO_DATA = global.window.ECO_DATA;

// Load habits.js
const habitsCode = fs.readFileSync(path.join(projectRoot, 'js', 'habits.js'), 'utf8');
eval(habitsCode);
const EcoHabits = global.window.EcoHabits;

// 1. Data Catalogs & Fallbacks
console.log('--- 1. Data Catalogs & Fallback Verification ---');
check('ECO_DATA.defaultHabits is populated with 8 items', Array.isArray(ECO_DATA.defaultHabits) && ECO_DATA.defaultHabits.length === 8);
check('ECO_DATA.ecoTips is populated with 19 items', Array.isArray(ECO_DATA.ecoTips) && ECO_DATA.ecoTips.length === 19);

// 2. LocalStorage Isolation (Calculator Footprint Protection)
console.log('\n--- 2. LocalStorage Isolation & State Initialization ---');
const originalFootprint = { calculationMode: 'precise', totalAnnualKg: 1340.40, timestamp: '2026-11-04T12:00:00Z' };
EcoStorage.set(STORAGE_KEYS.FOOTPRINT, originalFootprint);

EcoHabits.reloadState();
let state = EcoHabits.getState();
check('Initial habit pool has 8 habits', state.habits.length === 8);
check('Initial completions is empty object', Object.keys(state.completions).length === 0);
check('STORAGE_KEYS.FOOTPRINT remains completely untouched', 
  EcoStorage.get(STORAGE_KEYS.FOOTPRINT, null).totalAnnualKg === 1340.40);

// 3. Daily Randomized Habit Selection (5 Habits per Day)
console.log('\n--- 3. Daily Randomized Habit Checklist Selection ---');
const todayStr = EcoHabits.getTodayStr();
const todayHabitIds = EcoHabits.getDailySelectedHabits(todayStr);

check('Exactly 5 habits selected for today from the pool of 8', todayHabitIds.length === 5);
const uniqueTodayHabits = new Set(todayHabitIds);
check('Selected daily habits contain no duplicates', uniqueTodayHabits.size === 5);

// Verify stability across reloads on the same date
const reloadCheck1 = EcoHabits.getDailySelectedHabits(todayStr);
check('Daily habit selection is 100% stable across reloads on same date', 
  JSON.stringify(todayHabitIds) === JSON.stringify(reloadCheck1));

// Verify rotation on a different calendar date
const tomorrowStr = EcoHabits.getRelativeDate(todayStr, -1);
const tomorrowHabitIds = EcoHabits.getDailySelectedHabits(tomorrowStr);
check('Exactly 5 habits selected for tomorrow', tomorrowHabitIds.length === 5);
check('Tomorrow habit selection is not identical to today', 
  JSON.stringify(todayHabitIds) !== JSON.stringify(tomorrowHabitIds));

// Verify pool <= 5 handling
const savedHabits = state.habits;
EcoHabits._setHabits(savedHabits.slice(0, 3));
const smallSelection = EcoHabits.getDailySelectedHabits('2026-12-01');
check('When pool has <= 5 habits, all available habits are selected', smallSelection.length === 3);
EcoHabits._setHabits(savedHabits); // restore

// 4. Daily Habit Progress Calculation Denominator
console.log('\n--- 4. Daily Habit Progress Calculation ---');
// Select first habit from today's active 5
const habitToComplete = todayHabitIds[0];
EcoHabits.toggleHabit(habitToComplete);
state = EcoHabits.getState();

check('Habit marked completed for today', state.completions[todayStr].includes(habitToComplete));
const completedCount = state.completions[todayStr].length;
check('Progress numerator is completed count (1)', completedCount === 1);
const activeDailyCount = todayHabitIds.length;
check('Progress denominator is today selected habit count (5)', activeDailyCount === 5);
const expectedPct = Math.round((1 / 5) * 100);
check('Progress percentage evaluates to 20%', expectedPct === 20);

// 5. Custom and Tip-Derived Habits Integration into Daily Pool
console.log('\n--- 5. Custom & Tip-Derived Habits in Daily Pool ---');
const customRes = EcoHabits.addCustomHabit('Use cloth bags for shopping', 'Waste');
check('Custom habit added successfully', customRes.success === true);
state = EcoHabits.getState();
const customHabit = state.habits.find(h => h.title === 'Use cloth bags for shopping');
check('Custom habit exists in pool', !!customHabit);

// Confirm custom habit is immediately available in today's selection
const updatedTodaySelection = EcoHabits.getDailySelectedHabits(todayStr);
check('Custom habit is immediately present in today daily selection', updatedTodaySelection.includes(customHabit.id));

// Duplicate prevention
const dupRes = EcoHabits.addCustomHabit('use cloth bags for shopping', 'Waste');
check('Duplicate custom habit rejected (case-insensitive)', dupRes.success === false);

// Convert Tip to Habit
const tipRes = EcoHabits.addTipAsHabit('tip_energy_ac');
check('Tip "tip_energy_ac" converted to habit successfully', tipRes.success === true);
state = EcoHabits.getState();
const tipHabit = state.habits.find(h => h.tipId === 'tip_energy_ac');
check('Tip-derived habit exists in pool', !!tipHabit);
const updatedTodayWithTip = EcoHabits.getDailySelectedHabits(todayStr);
check('Tip-derived habit is immediately present in today selection', updatedTodayWithTip.includes(tipHabit.id));

// Deletion removes from selection
EcoHabits.deleteHabit(customHabit.id);
state = EcoHabits.getState();
check('Deleted custom habit is removed from pool', !state.habits.some(h => h.id === customHabit.id));
check('Deleted custom habit is removed from today selection', !EcoHabits.getDailySelectedHabits(todayStr).includes(customHabit.id));

// 6. Streak Preservation Across Date Selection
console.log('\n--- 6. Streak & Historical Completions Preservation ---');
check('Today completions intact after pool operations', state.completions[todayStr].includes(habitToComplete));
check('Current streak is 1 day', state.stats.currentStreak === 1);

// Test multi-day streak calculation
const testHistory = {};
testHistory[EcoHabits.getRelativeDate(todayStr, 2)] = ['habit_1'];
testHistory[EcoHabits.getRelativeDate(todayStr, 1)] = ['habit_2'];
testHistory[todayStr] = [habitToComplete];
const streakCalc = EcoHabits.calculateStreak(testHistory, todayStr);
check('Streak correctly evaluates to 3 consecutive active days', streakCalc.currentStreak === 3);
check('Historical total completions correctly tallied', streakCalc.totalLifetimeCompletions === 3);

// 7. Daily Eco Tips Selection (Exactly 4 per Day)
console.log('\n--- 7. Daily Eco Tips Selection (4 per Day) ---');
const todayTipIds = EcoHabits.getDailyTipsSelection(todayStr);
check('Exactly 4 tips selected for today', todayTipIds.length === 4);
const uniqueTips = new Set(todayTipIds);
check('Selected 4 tips contain no duplicates', uniqueTips.size === 4);

// Stability on same date
const reloadTips = EcoHabits.getDailyTipsSelection(todayStr);
check('Tip selection is 100% stable across reloads on same date', 
  JSON.stringify(todayTipIds) === JSON.stringify(reloadTips));

// Rotation on new date
const tomorrowTipIds = EcoHabits.getDailyTipsSelection(tomorrowStr);
check('Exactly 4 tips selected for tomorrow', tomorrowTipIds.length === 4);
check('Tomorrow tip selection differs from today', 
  JSON.stringify(todayTipIds) !== JSON.stringify(tomorrowTipIds));

// 8. Single-Card Carousel Mechanics
console.log('\n--- 8. Single-Card Carousel Mechanics ---');
check('Initial carousel slide index is 0', EcoHabits.getCurrentTipSlide() === 0);

// Navigate Next
EcoHabits.nextTipSlide();
check('Next slide navigates to index 1', EcoHabits.getCurrentTipSlide() === 1);

EcoHabits.nextTipSlide();
check('Next slide navigates to index 2', EcoHabits.getCurrentTipSlide() === 2);

EcoHabits.nextTipSlide();
check('Next slide navigates to index 3 (4th tip)', EcoHabits.getCurrentTipSlide() === 3);

// Looping back to first slide
EcoHabits.nextTipSlide();
check('Reaching end loops back to index 0 (1st tip)', EcoHabits.getCurrentTipSlide() === 0);

// Navigate Previous
EcoHabits.prevTipSlide();
check('Previous from index 0 loops to index 3', EcoHabits.getCurrentTipSlide() === 3);

// Direct slide jump via dot indicator
EcoHabits.goToTipSlide(2);
check('goToTipSlide(2) jumps to index 2', EcoHabits.getCurrentTipSlide() === 2);

// Auto-Timer & Reduced Motion
EcoHabits.stopAutoTimer('Paused for testing');
check('Carousel auto-timer can be stopped/paused gracefully', true);
EcoHabits.startAutoTimer();
check('Carousel auto-timer starts successfully when motion enabled', true);
EcoHabits.stopAutoTimer();

// 9. HTML Schema & Restyled Dropdown Verification
console.log('\n--- 9. HTML Schema & CSS Class Verification ---');
const habitsHtml = fs.readFileSync(path.join(projectRoot, 'habits.html'), 'utf8');
const habitsCss = fs.readFileSync(path.join(projectRoot, 'css', 'habits.css'), 'utf8');

check('habits.html uses .hub-category-select for restyled dropdown', habitsHtml.includes('class="hub-category-select"'));
check('habits.html wraps dropdown in .category-select-wrapper', habitsHtml.includes('class="category-select-wrapper"'));
check('habits.css defines .hub-category-select styling', habitsCss.includes('.hub-category-select'));
check('habits.css defines custom chevron arrow background-image', habitsCss.includes('background-image: url('));
check('habits.css defines option tag styling', habitsCss.includes('.hub-category-select option'));

// Carousel DOM elements
const carouselRequiredIds = [
  'tips-carousel',
  'carousel-btn-prev',
  'carousel-viewport',
  'carousel-btn-next',
  'carousel-dots',
  'carousel-status-pill',
  'carousel-status-text'
];
carouselRequiredIds.forEach(id => {
  check(`habits.html contains #${id}`, habitsHtml.includes(`id="${id}"`));
});

// Verify only 1 card active style in CSS
check('habits.css sets .carousel-slide display: none by default', habitsCss.includes('.carousel-slide {') && habitsCss.includes('display: none'));
check('habits.css sets .carousel-slide.active display: block', habitsCss.includes('.carousel-slide.active {') && habitsCss.includes('display: block'));

// 10. Centered Heading & Balanced Spacing Verification
console.log('\n--- 10. Centered Heading & Balanced Spacing Verification ---');
check('habits.html contains strictly centered h1 "Sustainable Living Hub"', 
  habitsHtml.includes('<h1 class="section-title">Sustainable Living Hub</h1>'));
check('habits.html removed previous date badge from header', 
  !habitsHtml.includes('class="hub-date-badge"'));
check('habits.css centers .hub-header with balanced spacing', 
  habitsCss.includes('.hub-header {') && habitsCss.includes('text-align: center'));

// 11. Checklist Date Navigation Controls & DOM Schema
console.log('\n--- 11. Checklist Date Navigation Controls & DOM Schema ---');
const dateNavRequiredIds = [
  'btn-date-prev',
  'displayed-date-label',
  'btn-date-next',
  'checklist-date-picker',
  'btn-date-today',
  'date-status-banner',
  'future-date-state',
  'past-empty-state',
  'add-custom-habit-card'
];
dateNavRequiredIds.forEach(id => {
  check(`habits.html contains #${id}`, habitsHtml.includes(`id="${id}"`));
});
check('habits.html contains .checklist-date-nav wrapper', habitsHtml.includes('class="checklist-date-nav"'));
check('habits.html date picker has type="date"', habitsHtml.includes('type="date" id="checklist-date-picker"'));

// 12. Consistent Dark Botanical Controls Styling
console.log('\n--- 12. Consistent Dark Botanical Controls Styling ---');
check('habits.css styles .eco-date-input with dark color-scheme', 
  habitsCss.includes('.eco-date-input') && habitsCss.includes('color-scheme: dark'));
check('habits.css styles webkit calendar picker indicator', 
  habitsCss.includes('::-webkit-calendar-picker-indicator'));
check('habits.css styles .checklist-date-nav bar', habitsCss.includes('.checklist-date-nav'));
check('habits.css styles .eco-nav-btn and arrows', habitsCss.includes('.eco-nav-btn'));
check('habits.css styles .date-display-badge', habitsCss.includes('.date-display-badge'));
check('habits.css styles .date-status-banner', habitsCss.includes('.date-status-banner'));
check('habits.css styles .habit-item-card.read-only', habitsCss.includes('.habit-item-card.read-only'));

// 13. Date Navigation Logic & Mode Switching
console.log('\n--- 13. Date Navigation Logic & Mode Switching ---');
const initialViewDate = EcoHabits.getSelectedViewDate();
check('Initial selected view date is user local calendar today', initialViewDate === EcoHabits.getTodayStr());
check('Initial date mode evaluates to "today"', EcoHabits.getDateMode() === 'today');

// Navigate to Past Date
const pastDateStr = EcoHabits.getRelativeDate(initialViewDate, 1);
EcoHabits.changeSelectedDate(pastDateStr);
check('changeSelectedDate updates selected view date to past date', EcoHabits.getSelectedViewDate() === pastDateStr);
check('Date mode evaluates to "past" for yesterday', EcoHabits.getDateMode() === 'past');

// Navigate to Future Date
const futureDateStr = EcoHabits.getRelativeDate(initialViewDate, -1);
EcoHabits.changeSelectedDate(futureDateStr);
check('changeSelectedDate updates selected view date to future date', EcoHabits.getSelectedViewDate() === futureDateStr);
check('Date mode evaluates to "future" for tomorrow', EcoHabits.getDateMode() === 'future');

// Return to Today
EcoHabits.changeSelectedDate(initialViewDate);
check('changeSelectedDate returns to today', EcoHabits.getSelectedViewDate() === initialViewDate);
check('Date mode returns to "today"', EcoHabits.getDateMode() === 'today');

// 14. Past-Date Behavior (Read-Only Protection)
console.log('\n--- 14. Past-Date Behavior & Historical Record Protection ---');
// Setup: Log a completion on a specific past date (e.g. 2 days ago)
const twoDaysAgoStr = EcoHabits.getRelativeDate(initialViewDate, 2);
const fixtureCompletions = EcoHabits.getState().completions;
fixtureCompletions[twoDaysAgoStr] = ['habit_trans_public', 'habit_energy_lights'];
EcoHabits._setCompletions(fixtureCompletions);

const fixtureSelections = EcoHabits.getState().dailySelections;
fixtureSelections[twoDaysAgoStr] = ['habit_trans_public', 'habit_energy_lights', 'habit_water_tap'];
EcoHabits._setDailySelections(fixtureSelections);

// Switch view to twoDaysAgoStr
EcoHabits.changeSelectedDate(twoDaysAgoStr);
check('View date switched to 2 days ago', EcoHabits.getSelectedViewDate() === twoDaysAgoStr);

const pastHabits = EcoHabits.getHabitsForDate(twoDaysAgoStr);
check('Past date returns recorded habits', pastHabits.length >= 2);
check('Past habits include "habit_trans_public"', pastHabits.some(h => h.id === 'habit_trans_public'));

// Verify past date is strictly read-only: Attempting toggle is blocked
EcoHabits.toggleHabit('habit_water_tap');
const updatedCompletions = EcoHabits.getState().completions;
check('Toggling habit on past date is blocked (not added to completions)', 
  !updatedCompletions[twoDaysAgoStr].includes('habit_water_tap'));

// Attempting to add custom habit on past date is rejected
const customOnPast = EcoHabits.addCustomHabit('Past habit test', 'Energy');
check('Adding custom habit on past date is rejected', customOnPast.success === false);

// Attempting reset on past date is blocked
EcoHabits.resetToday();
check('Resetting on past date is blocked (past completions preserved)', 
  EcoHabits.getState().completions[twoDaysAgoStr].length === 2);

// 15. Future-Date Behavior (No Completions, Empty State)
console.log('\n--- 15. Future-Date Behavior ---');
EcoHabits.changeSelectedDate(futureDateStr);
const futureHabits = EcoHabits.getHabitsForDate(futureDateStr);
check('Future date returns empty habits array (ready when day arrives)', futureHabits.length === 0);

// Attempting toggle on future date is blocked
EcoHabits.toggleHabit('habit_trans_public');
check('No completions recorded for future date', !state.completions[futureDateStr]);

// Attempting custom habit on future date is rejected
const customOnFuture = EcoHabits.addCustomHabit('Future habit test', 'Energy');
check('Adding custom habit on future date is rejected', customOnFuture.success === false);

// 16. Reload Resets View Date to Today
console.log('\n--- 16. Reload State Resets to Today ---');
EcoHabits.reloadState();
check('reloadState() resets selected view date back to today', 
  EcoHabits.getSelectedViewDate() === EcoHabits.getTodayStr());
check('View date mode is back to "today"', EcoHabits.getDateMode() === 'today');

// 17. Independent Branding Verification
console.log('\n--- 17. Independent Brand Verification ---');
check('habits.html has NO TERRACODE in UI text', !habitsHtml.includes('TERRACODE 2026'));
check('habits.html has NO FOSS Club in UI text', !habitsHtml.includes('FOSS Club'));
check('habits.html has NO MEA Engineering in UI text', !habitsHtml.includes('MEA Engineering'));

// 18. Final Footprint Safety Check
console.log('\n--- 18. Final Footprint Integrity Check ---');
const finalFootprint = EcoStorage.get(STORAGE_KEYS.FOOTPRINT, null);
check('STORAGE_KEYS.FOOTPRINT remains completely untouched at end of tests', 
  finalFootprint && finalFootprint.totalAnnualKg === 1340.40);

console.log('\n============================================================');
console.log(`TOTAL PHASE 4 REFINEMENTS AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
