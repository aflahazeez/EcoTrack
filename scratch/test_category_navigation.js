const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('ECOTRACK PHASE 7 TASK 5: CATEGORY NAVIGATION TEST SUITE');
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

// -----------------------------------------------------------------------------
// 1. Footer Resource Links Schema
// -----------------------------------------------------------------------------
console.log('--- 1. Footer Resource Links Schema ---');

const expectedHrefs = [
  'habits.html#tips-transportation',
  'habits.html#tips-energy',
  'habits.html#tips-water',
  'habits.html#tips-waste'
];

const targetPages = ['index.html', 'habits.html', 'tips.html', 'dashboard.html'];

targetPages.forEach(file => {
  const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  expectedHrefs.forEach(href => {
    check(`${file} contains resource link href="${href}"`, content.includes(`href="${href}"`));
  });
});

// Calculator page must NOT have its facet links overwritten
const calcHtml = fs.readFileSync(path.join(projectRoot, 'calculator.html'), 'utf8');
check('calculator.html keeps Transportation Footprint link', calcHtml.includes('Transportation Footprint'));
check('calculator.html keeps Household Electricity link', calcHtml.includes('Household Electricity'));
check('calculator.html keeps Domestic Cooking Gas link', calcHtml.includes('Domestic Cooking Gas'));
check('calculator.html keeps Household Waste link', calcHtml.includes('Household Waste'));
check('calculator.html does NOT contain habits.html#tips-transportation', !calcHtml.includes('habits.html#tips-transportation'));

// Dynamic templates in js/page-views.js
const pageViewsJs = fs.readFileSync(path.join(projectRoot, 'js', 'page-views.js'), 'utf8');
expectedHrefs.forEach(href => {
  check(`js/page-views.js contains resource link href="${href}"`, pageViewsJs.includes(href));
});

// -----------------------------------------------------------------------------
// 2. Eco Tips Data Verification
// -----------------------------------------------------------------------------
console.log('\n--- 2. Eco Tips Category Datasets ---');

// Load data.js
const dataCode = fs.readFileSync(path.join(projectRoot, 'js', 'data.js'), 'utf8');
const dataSandbox = { window: {}, console };
vm.createContext(dataSandbox);
vm.runInContext(dataCode, dataSandbox);
const ECO_DATA = dataSandbox.window.ECO_DATA;

check('ECO_DATA is loaded', Boolean(ECO_DATA && Array.isArray(ECO_DATA.ecoTips)));

const categories = ['Transportation', 'Energy', 'Water', 'Waste'];
const expectedFirstTips = {
  'Transportation': 'tip_trans_transit',
  'Energy': 'tip_energy_lighting',
  'Water': 'tip_water_tap',
  'Waste': 'tip_waste_bottles'
};

categories.forEach(cat => {
  const tips = ECO_DATA.ecoTips.filter(t => t.category.toLowerCase() === cat.toLowerCase());
  check(`${cat} category has exactly 4 tips in ECO_DATA.ecoTips`, tips.length === 4);
  check(`${cat} category first tip is ${expectedFirstTips[cat]}`, tips[0].id === expectedFirstTips[cat]);
});

// -----------------------------------------------------------------------------
// 3. Habits Carousel Engine (js/habits.js)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Habits Carousel Category API & State ---');

// Build mock DOM environment for habits.js
const habitsHtml = fs.readFileSync(path.join(projectRoot, 'habits.html'), 'utf8');

function createMockDom() {
  const elements = new Map();

  function makeEl(id, tag = 'div') {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c);
          } else if (force) {
            this._classes.add(c);
          } else {
            this._classes.delete(c);
          }
        },
        contains(c) { return this._classes.has(c); }
      },
      attributes: new Map(),
      setAttribute(k, v) { this.attributes.set(k, String(v)); },
      getAttribute(k) { return this.attributes.get(k) || null; },
      hasAttribute(k) { return this.attributes.has(k); },
      removeAttribute(k) { this.attributes.delete(k); },
      innerHTML: '',
      textContent: '',
      style: {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      removeEventListener() {},
      scrollIntoView() {}
    };
    return el;
  }

  // Pre-populate required elements
  const requiredIds = [
    'carousel-viewport', 'carousel-dots', 'carousel-track', 'carousel-btn-prev',
    'carousel-btn-next', 'carousel-status-pill', 'carousel-status-text',
    'metric-streak-count', 'metric-streak-best', 'metric-total-habits',
    'metric-lifetime-count', 'metric-progress-count', 'metric-progress-pct',
    'metric-progress-bar', 'metric-progress-msg', 'badge-total-count',
    'filter-count-all', 'filter-count-remaining', 'filter-count-completed',
    'habit-items-list', 'displayed-date-label', 'checklist-date-picker',
    'calendar-trigger-date-text', 'date-status-banner', 'future-date-state',
    'past-empty-state', 'add-custom-habit-card', 'custom-habit-error',
    'hub-toast', 'hub-toast-msg', 'tips'
  ];

  requiredIds.forEach(id => elements.set(id, makeEl(id)));

  const mockDoc = {
    getElementById(id) { return elements.get(id) || null; },
    querySelector(sel) {
      if (sel.startsWith('#')) return elements.get(sel.substring(1)) || null;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.carousel-slide') {
        const vp = elements.get('carousel-viewport');
        if (!vp || !vp.innerHTML) return [];
        // Match slide cards from innerHTML
        const matches = [...vp.innerHTML.matchAll(/data-slide-index="(\d+)"/g)];
        return matches.map((m, i) => {
          const isClone = vp.innerHTML.includes(`data-clone="prev"`) && i === 0
            || vp.innerHTML.includes(`data-clone="next"`) && i === matches.length - 1;
          const el = makeEl(`slide-${i}`);
          el.setAttribute('data-slide-index', m[1]);
          if (isClone) el.setAttribute('data-clone', i === 0 ? 'prev' : 'next');
          return el;
        });
      }
      if (sel === '.carousel-dot') {
        const dots = elements.get('carousel-dots');
        if (!dots || !dots.innerHTML) return [];
        const matches = [...dots.innerHTML.matchAll(/data-slide-index="(\d+)"/g)];
        return matches.map(m => {
          const el = makeEl(`dot-${m[1]}`);
          el.setAttribute('data-slide-index', m[1]);
          return el;
        });
      }
      return [];
    },
    addEventListener() {},
    documentElement: { classList: { remove() {}, add() {} } },
    title: ''
  };

  return { mockDoc, elements };
}

const { mockDoc, elements } = createMockDom();

const habitsCode = fs.readFileSync(path.join(projectRoot, 'js', 'habits.js'), 'utf8');
const storageCode = fs.readFileSync(path.join(projectRoot, 'js', 'storage.js'), 'utf8');

const habitsSandbox = {
  window: {
    ECO_DATA,
    matchMedia: () => ({ matches: false }),
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  document: mockDoc,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => 123,
  clearInterval: () => {}
};
habitsSandbox.window.window = habitsSandbox.window;
habitsSandbox.window.document = mockDoc;

vm.createContext(habitsSandbox);
vm.runInContext(dataCode, habitsSandbox);
vm.runInContext(storageCode, habitsSandbox);
vm.runInContext(habitsCode, habitsSandbox);

const EcoHabits = habitsSandbox.window.EcoHabits;

check('EcoHabits API is available', Boolean(EcoHabits));
check('EcoHabits exports showTipCategory', typeof EcoHabits.showTipCategory === 'function');
check('EcoHabits exports clearTipCategory', typeof EcoHabits.clearTipCategory === 'function');
check('EcoHabits exports getActiveTipCategory', typeof EcoHabits.getActiveTipCategory === 'function');

// Initial state
EcoHabits.init();
check('Default active category is null', EcoHabits.getActiveTipCategory() === null);
check('Default initial slide index is 0', EcoHabits.getCurrentTipSlide() === 0);

// Test Transportation Category
EcoHabits.showTipCategory('Transportation');
check('Category set to Transportation', EcoHabits.getActiveTipCategory() === 'Transportation');
check('Transportation starts at slide index 0', EcoHabits.getCurrentTipSlide() === 0);
const vpTrans = elements.get('carousel-viewport').innerHTML;
check('Transportation viewport contains first tip title "Choose Public Transit"', vpTrans.includes('Choose Public Transit, Walking, or Cycling'));
check('Transportation viewport renders category tag "Transportation"', vpTrans.includes('>Transportation<'));

// Test Energy Category
EcoHabits.showTipCategory('Energy');
check('Category set to Energy', EcoHabits.getActiveTipCategory() === 'Energy');
check('Energy starts at slide index 0', EcoHabits.getCurrentTipSlide() === 0);
const vpEnergy = elements.get('carousel-viewport').innerHTML;
check('Energy viewport contains first tip title "Switch Off Lights"', vpEnergy.includes('Switch Off Lights &amp; Adopt High-Efficiency LEDs'));
check('Energy viewport renders category tag "Energy"', vpEnergy.includes('>Energy<'));

// Test Water Category
EcoHabits.showTipCategory('water'); // case-insensitivity test
check('Category set to Water (case-insensitive test)', EcoHabits.getActiveTipCategory() === 'Water');
check('Water starts at slide index 0', EcoHabits.getCurrentTipSlide() === 0);
const vpWater = elements.get('carousel-viewport').innerHTML;
check('Water viewport contains first tip title "Turn Off Running Taps"', vpWater.includes('Turn Off Running Taps During Grooming &amp; Scrubbing'));

// Test Waste Category
EcoHabits.showTipCategory('waste');
check('Category set to Waste (case-insensitive test)', EcoHabits.getActiveTipCategory() === 'Waste');
check('Waste starts at slide index 0', EcoHabits.getCurrentTipSlide() === 0);
const vpWaste = elements.get('carousel-viewport').innerHTML;
check('Waste viewport contains first tip title "Carry a Reusable Stainless Steel Water Bottle"', vpWaste.includes('Carry a Reusable Stainless Steel Water Bottle'));

// Test slide navigation within category
EcoHabits.nextTipSlide();
check('Next slide in category moves to index 1', EcoHabits.getCurrentTipSlide() === 1);
EcoHabits.nextTipSlide();
check('Next slide in category moves to index 2', EcoHabits.getCurrentTipSlide() === 2);
EcoHabits.nextTipSlide();
check('Next slide in category moves to index 3', EcoHabits.getCurrentTipSlide() === 3);
EcoHabits.nextTipSlide();
check('Next slide at end loops back to index 0', EcoHabits.getCurrentTipSlide() === 0);

// Test clearTipCategory
EcoHabits.clearTipCategory();
check('clearTipCategory resets category to null', EcoHabits.getActiveTipCategory() === null);
check('clearTipCategory resets slide index to 0', EcoHabits.getCurrentTipSlide() === 0);

// -----------------------------------------------------------------------------
// 4. Router & Hash Parsing in js/main.js
// -----------------------------------------------------------------------------
console.log('\n--- 4. Router & Hash Handling in js/main.js ---');

const mainJs = fs.readFileSync(path.join(projectRoot, 'js', 'main.js'), 'utf8');

// 1. Static verification of production regex in js/main.js
const extractRegexMatch = mainJs.match(/function extractTipCategory\b[\s\S]*?clean\.match\((\/.*?\/i)\)/);
check('js/main.js contains clean.match in extractTipCategory', Boolean(extractRegexMatch));
const prodExtractRegexStr = extractRegexMatch ? extractRegexMatch[1].trim() : '';
check('js/main.js extractTipCategory uses exact required grouped regex',
  prodExtractRegexStr === '/^(?:habits[_-])?tips[_-](transportation|energy|water|waste)$/i');

const parseHashRegexMatch = mainJs.match(/function parseHash\b[\s\S]*?clean\.match\((\/.*?\/i)\)/);
check('js/main.js contains clean.match in parseHash', Boolean(parseHashRegexMatch));
const prodParseRegexStr = parseHashRegexMatch ? parseHashRegexMatch[1].trim() : '';
check('js/main.js parseHash uses exact required grouped regex',
  prodParseRegexStr === '/^(?:habits[_-])?tips[_-](transportation|energy|water|waste)$/i');

// 2. Extract and execute the ACTUAL production router functions from js/main.js
const mapSource = mainJs.match(/const TIP_CATEGORY_MAP = \{[\s\S]*?\n  \};/)?.[0] || '';
const extractFnSource = mainJs.match(/function extractTipCategory\(hash\) \{[\s\S]*?\n  \}/)?.[0] || '';
const fileToHashSource = mainJs.match(/function fileToHash\(file, hash\) \{[\s\S]*?\n  \}/)?.[0] || '';
const parseHashSource = mainJs.match(/function parseHash\(rawHash\) \{[\s\S]*?\n  \}/)?.[0] || '';

check('Extracted TIP_CATEGORY_MAP from js/main.js', Boolean(mapSource));
check('Extracted extractTipCategory from js/main.js', Boolean(extractFnSource));
check('Extracted fileToHash from js/main.js', Boolean(fileToHashSource));
check('Extracted parseHash from js/main.js', Boolean(parseHashSource));

const routerSandbox = {
  initialFile: 'index.html',
  PAGE_ORDER: { 'index.html': 0, 'calculator.html': 1, 'habits.html': 2, 'dashboard.html': 3 },
  console
};
vm.createContext(routerSandbox);
vm.runInContext(`${mapSource}\n${fileToHashSource}\n${extractFnSource}\n${parseHashSource}`, routerSandbox);

const prodExtractTipCategory = routerSandbox.extractTipCategory;
const prodFileToHash = routerSandbox.fileToHash;
const prodParseHash = routerSandbox.parseHash;

// Test actual production extractTipCategory with all valid category hashes
check('Production extractTipCategory: #tips-transportation -> Transportation', prodExtractTipCategory('#tips-transportation') === 'Transportation');
check('Production extractTipCategory: #tips-energy -> Energy', prodExtractTipCategory('#tips-energy') === 'Energy');
check('Production extractTipCategory: #tips-water -> Water', prodExtractTipCategory('#tips-water') === 'Water');
check('Production extractTipCategory: #tips-waste -> Waste', prodExtractTipCategory('#tips-waste') === 'Waste');
check('Production extractTipCategory: #habits-tips-transportation -> Transportation', prodExtractTipCategory('#habits-tips-transportation') === 'Transportation');
check('Production extractTipCategory: #habits_tips_energy -> Energy', prodExtractTipCategory('#habits_tips_energy') === 'Energy');
check('Production extractTipCategory: #habits_tips-transportation -> Transportation', prodExtractTipCategory('#habits_tips-transportation') === 'Transportation');
check('Production extractTipCategory: #habits-tips_water -> Water', prodExtractTipCategory('#habits-tips_water') === 'Water');

// Test actual production extractTipCategory with invalid or unrelated hashes
check('Production extractTipCategory: #tips -> null', prodExtractTipCategory('#tips') === null);
check('Production extractTipCategory: #checklist -> null', prodExtractTipCategory('#checklist') === null);
check('Production extractTipCategory: #random-hash -> null', prodExtractTipCategory('#random-hash') === null);
check('Production extractTipCategory: #tips-invalid -> null', prodExtractTipCategory('#tips-invalid') === null);
check('Production extractTipCategory: #habits-tips-unknown -> null', prodExtractTipCategory('#habits-tips-unknown') === null);
check('Production extractTipCategory: null -> null', prodExtractTipCategory(null) === null);
check('Production extractTipCategory: empty string -> null', prodExtractTipCategory('') === null);

// Test actual production fileToHash
check('Production fileToHash: habits.html#tips-transportation -> tips-transportation', prodFileToHash('habits.html', '#tips-transportation') === 'tips-transportation');
check('Production fileToHash: habits.html#tips-energy -> tips-energy', prodFileToHash('habits.html', '#tips-energy') === 'tips-energy');
check('Production fileToHash: habits.html#tips -> tips', prodFileToHash('habits.html', '#tips') === 'tips');
check('Production fileToHash: habits.html#checklist -> habits_checklist', prodFileToHash('habits.html', '#checklist') === 'habits_checklist');

// Test actual production parseHash
const parsedTrans = prodParseHash('#tips-transportation');
check('Production parseHash: #tips-transportation targets habits.html', parsedTrans.file === 'habits.html');
check('Production parseHash: #tips-transportation targets #tips-transportation', parsedTrans.hash === '#tips-transportation');
check('Production parseHash: #tips-transportation extracts Transportation', parsedTrans.category === 'Transportation');

const parsedEnergy = prodParseHash('#tips-energy');
check('Production parseHash: #tips-energy targets habits.html', parsedEnergy.file === 'habits.html');
check('Production parseHash: #tips-energy targets #tips-energy', parsedEnergy.hash === '#tips-energy');
check('Production parseHash: #tips-energy extracts Energy', parsedEnergy.category === 'Energy');

const parsedHabitsEnergy = prodParseHash('#habits_tips_energy');
check('Production parseHash: #habits_tips_energy targets habits.html', parsedHabitsEnergy.file === 'habits.html');
check('Production parseHash: #habits_tips_energy extracts Energy', parsedHabitsEnergy.category === 'Energy');

const parsedWater = prodParseHash('#tips-water');
check('Production parseHash: #tips-water targets habits.html', parsedWater.file === 'habits.html');
check('Production parseHash: #tips-water extracts Water', parsedWater.category === 'Water');

const parsedWaste = prodParseHash('#tips-waste');
check('Production parseHash: #tips-waste targets habits.html', parsedWaste.file === 'habits.html');
check('Production parseHash: #tips-waste extracts Waste', parsedWaste.category === 'Waste');

const parsedTips = prodParseHash('#tips');
check('Production parseHash: #tips targets habits.html with null category', parsedTips.file === 'habits.html' && parsedTips.category === null);

const parsedChecklist = prodParseHash('#checklist');
check('Production parseHash: #checklist targets habits.html with null category', parsedChecklist.file === 'habits.html' && parsedChecklist.category === null);

const parsedEmpty = prodParseHash('');
check('Production parseHash: empty hash targets index.html with null category', parsedEmpty.file === 'index.html' && parsedEmpty.category === null);

// Verify scroll fallback for category hashes
check('js/main.js falls back to #tips for tips- targets in scrollToTargetHash',
  mainJs.includes("targetId.startsWith('tips-')") && mainJs.includes("document.getElementById('tips')"));

// Verify showTipCategory invocation during navigation
check('js/main.js invokes showTipCategory on same-page category navigation',
  mainJs.includes('window.EcoHabits.showTipCategory(category)'));

console.log('\n============================================================');
console.log(`TOTAL PHASE 7 TASK 5 AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
