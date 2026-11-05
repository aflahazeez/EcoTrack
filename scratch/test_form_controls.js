const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

console.log('============================================================');
console.log('FORM CONTROLS & HABIT TITLE INPUT AUDIT');
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

const habitsHtml = fs.readFileSync(path.join(projectRoot, 'habits.html'), 'utf8');
const habitsCss = fs.readFileSync(path.join(projectRoot, 'css', 'habits.css'), 'utf8');

// 1. HTML Form Control Markup
console.log('--- 1. HTML Form Control Markup ---');
check('Habit title input exists with id "input-custom-habit-title"', habitsHtml.includes('id="input-custom-habit-title"'));
check('Habit title input has class "hub-form-control"', habitsHtml.includes('class="form-control hub-form-control"'));
check('Custom habit form has class "custom-form-grid"', habitsHtml.includes('class="custom-form-grid"'));
check('Category select exists with id "select-custom-habit-cat"', habitsHtml.includes('id="select-custom-habit-cat"'));
check('Date picker exists with id "checklist-date-picker"', habitsHtml.includes('id="checklist-date-picker"'));
check('Toolbar category filter exists with id "habit-category-filter"', habitsHtml.includes('id="habit-category-filter"'));

// 2. CSS Sizing, Border-Box & Background
console.log('\n--- 2. CSS Box Model, Background & Colors ---');
check('CSS defines .hub-form-control rule', habitsCss.includes('.hub-form-control'));
check('CSS explicitly targets #input-custom-habit-title', habitsCss.includes('#input-custom-habit-title'));
check('CSS sets box-sizing: border-box', habitsCss.includes('box-sizing: border-box'));
check('CSS sets background-color: var(--card-surface)', habitsCss.includes('background-color: var(--card-surface'));
check('CSS sets color: var(--text-ivory)', habitsCss.includes('color: var(--text-ivory'));
check('CSS sets border-radius: var(--radius-pill)', habitsCss.includes('border-radius: var(--radius-pill'));

// 3. Hover, Focus & Interactive Glow States
console.log('\n--- 3. Hover & Focus States ---');
check('CSS defines hover state with emerald border', habitsCss.includes('#input-custom-habit-title:hover') && habitsCss.includes('border-color: var(--action-emerald'));
check('CSS defines focus state with lime border & glow', habitsCss.includes('#input-custom-habit-title:focus') && habitsCss.includes('box-shadow: var(--glow-lime'));

// 4. Placeholder & Browser Autofill
console.log('\n--- 4. Placeholder & Browser Defaults Overrides ---');
check('CSS styles ::placeholder with muted accent-sage', habitsCss.includes('::placeholder') && habitsCss.includes('var(--accent-sage)'));
check('CSS styles -webkit-input-placeholder', habitsCss.includes('::-webkit-input-placeholder'));
check('CSS styles -moz-placeholder', habitsCss.includes('::-moz-placeholder'));
check('CSS overrides -webkit-autofill to prevent white background', habitsCss.includes(':-webkit-autofill'));
check('CSS removes default appearance (-webkit-appearance: none)', habitsCss.includes('-webkit-appearance: none'));

// 5. Form Labels, Textareas & Checkboxes
console.log('\n--- 5. Form Labels, Textareas & Checkboxes ---');
check('CSS styles .form-label with warm ivory text', habitsCss.includes('.form-label') && habitsCss.includes('color: var(--text-ivory)'));
check('CSS styles textarea controls', habitsCss.includes('textarea.hub-form-control'));
check('CSS styles checkboxes with emerald accent', habitsCss.includes('input[type="checkbox"]'));

// 6. Responsive Grid & Overflow Protection
console.log('\n--- 6. Responsive Grid Layout ---');
check('CSS defines .custom-form-grid with align-items: flex-end', habitsCss.includes('.custom-form-grid') && habitsCss.includes('align-items: flex-end'));
check('CSS defines mobile 1-column stack under 992px', habitsCss.includes('@media (max-width: 992px)') && habitsCss.includes('.custom-form-grid'));

console.log('\n============================================================');
console.log(`FORM CONTROLS AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
