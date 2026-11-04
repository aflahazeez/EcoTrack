const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

console.log('============================================================');
console.log('ECOTRACK PHASE 3: COMPREHENSIVE INTEGRATION & SCHEMA AUDIT');
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

// 1. Static HTML Content & Element ID Verification
console.log('--- 1. DOM Element & Schema Integrity Check ---');
const calcHtml = fs.readFileSync(path.join(projectRoot, 'calculator.html'), 'utf8');

const requiredIds = [
  'mode-card-estimated', 'mode-card-precise',
  'step-nav-1', 'step-nav-2', 'step-nav-3', 'step-nav-4', 'step-progress-bar',
  'step-panel-1', 'step-panel-2', 'step-panel-3', 'step-panel-4',
  'step-1-estimated', 'step-1-precise',
  'step-2-estimated', 'step-2-precise',
  'step-3-estimated', 'step-3-precise',
  'est-transport-method', 'est-distance-range', 'est-travel-frequency',
  'est-household-size', 'est-electricity-level', 'est-lpg-refill', 'est-lpg-size',
  'est-waste-gen', 'est-waste-practice',
  'car-fuel-type', 'car-distance', 'car-frequency',
  'twowheeler-type', 'twowheeler-distance', 'twowheeler-frequency',
  'bus-distance', 'train-distance',
  'household-members', 'electricity-value',
  'toggle-tariff-helper', 'tariff-helper-inputs', 'bill-amount-input', 'manual-tariff-input', 'btn-apply-bill-conversion',
  'lpg-mode', 'lpg-cylinder-size', 'lpg-cylinder-count', 'lpg-kg-amount',
  'waste-quantity', 'waste-frequency', 'waste-practice',
  'results-mode-callout', 'results-mode-badge', 'results-mode-disclaimer',
  'res-total-tonnes', 'res-total-kg', 'res-monthly-kg',
  'res-transport-annual', 'res-transport-monthly', 'res-transport-pct',
  'res-energy-annual', 'res-energy-monthly', 'res-energy-pct',
  'res-electricity-annual', 'res-electricity-subpct',
  'res-lpg-annual', 'res-lpg-subpct',
  'res-waste-annual', 'res-waste-monthly', 'res-waste-pct',
  'carbonChart', 'fallback-chart'
];

requiredIds.forEach(id => {
  check(`calculator.html contains #${id}`, calcHtml.includes(`id="${id}"`));
});

// 2. Verify Complete Elimination of Diet & Tree Equivalence
console.log('\n--- 2. Diet & Unsupported Equivalence Elimination ---');
check('No diet-cohort select in calculator.html', !calcHtml.includes('diet-cohort'));
check('No Diet section header in calculator.html', !calcHtml.toLowerCase().includes('3. diet') && !calcHtml.toLowerCase().includes('diet & nutrition'));
check('Tree equivalence completely removed from calculator.html', !calcHtml.includes('res-trees-needed') && !calcHtml.includes('Mature Trees Required'));
const calcJs = fs.readFileSync(path.join(projectRoot, 'js', 'calculator.js'), 'utf8');
check('No diet calculation in calculator.js', !calcJs.includes('dietAnnualKg') && !calcJs.includes('dietMonthlyKg'));
check('No treesNeeded in calculator.js active code', !calcJs.includes('elements.resTreesNeeded'));
const dataJs = fs.readFileSync(path.join(projectRoot, 'js', 'data.js'), 'utf8');
check('No diet factors in data.js emissionFactors', !dataJs.includes('veganCohort') && !dataJs.includes('omnivoreCohort'));
check('No treeAbsorption in data.js', !dataJs.includes('treeAbsorptionKgPerYear'));

// 3. Verify Scientific Factor Citations & Disclosures in HTML
console.log('\n--- 3. Scientific Disclosures & Factor Citations ---');
check('CEA 0.675 factor cited in calculator.html', calcHtml.includes('0.675 kg CO'));
check('CEA Version 22.0 cited in calculator.html', calcHtml.includes('Version 22.0'));
check('IPCC 2.985 factor cited in calculator.html', calcHtml.includes('2.985 kg CO'));
check('Scope & Accounting Disclosures card exists', calcHtml.includes('Scientific Accounting Boundaries &amp; Scope Disclosure'));
check('Consistent CO2e accounting notice present in calculator.html', calcHtml.includes('Consistent CO₂e Accounting'));
check('National baseline comparison warning present', calcHtml.includes('Comparisons against national all-sector per-capita averages'));
check('Round-trip commute clarification present', calcHtml.includes('Round-Trip / Two-Way'));
check('Provisional heuristic waste disclosure present', calcHtml.includes('heuristic'));

// 4. Verify CSS Rules & Design Tokens
console.log('\n--- 4. CSS Rules & Styling Integrity ---');
const calcCss = fs.readFileSync(path.join(projectRoot, 'css', 'calculator.css'), 'utf8');
const styleCss = fs.readFileSync(path.join(projectRoot, 'css', 'style.css'), 'utf8');

check('Mode selection cards styling exists in calculator.css', calcCss.includes('.calc-mode-card'));
check('Mode card active state defined', calcCss.includes('.calc-mode-card.active'));
check('Mode card byline styling defined', calcCss.includes('.calc-mode-byline'));
check('Mode panel display switching rule present', calcCss.includes('.mode-panel'));
check('Results mode badge classes defined', calcCss.includes('.badge-estimated') && calcCss.includes('.badge-precise'));
check('Dark Botanical tokens defined in style.css', styleCss.includes('--bg-deep') && styleCss.includes('--accent-lime') && styleCss.includes('--action-emerald'));

// 5. Verify Clean Independent Branding (Zero UI competition references)
console.log('\n--- 5. Independent Brand Verification ---');
const htmlFiles = ['index.html', 'calculator.html', 'habits.html', 'tips.html', 'dashboard.html'];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  check(`${file} has NO TERRACODE in UI text`, !content.includes('TERRACODE 2026'));
  check(`${file} has NO FOSS Club in UI text`, !content.includes('FOSS Club'));
  check(`${file} has NO MEA Engineering in UI text`, !content.includes('MEA Engineering'));
});

console.log('\n============================================================');
console.log(`TOTAL INTEGRATION AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
