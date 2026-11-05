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
console.log('TESTING CATEGORY DROPDOWN CLIPPING & SELECTION IN CHROME');
console.log('============================================================\n');

function runChromeTest(viewportWidth, viewportHeight) {
  const filePath = path.join(WORKSPACE, 'habits.html');
  const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

  const testScript = `
    window.addEventListener('DOMContentLoaded', () => {
      const select = document.getElementById('select-custom-habit-cat');
      const customSelect = document.getElementById('eco-custom-select-select-custom-habit-cat');
      const trigger = customSelect ? customSelect.querySelector('.eco-custom-select-trigger') : null;
      const dropdown = customSelect ? customSelect.querySelector('.eco-custom-select-dropdown') : null;
      const label = customSelect ? customSelect.querySelector('.eco-custom-select-label') : null;
      
      // 1. Open dropdown
      if (trigger) trigger.click();
      
      const isOpen = customSelect.classList.contains('is-open');
      const options = Array.from(dropdown.querySelectorAll('.eco-custom-select-option'));
      
      // Measure options visibility
      const optionDetails = options.map(opt => {
        const r = opt.getBoundingClientRect();
        return {
          value: opt.getAttribute('data-value'),
          text: opt.textContent.trim(),
          height: Math.round(r.height),
          width: Math.round(r.width),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          isVisible: r.height > 0 && r.width > 0
        };
      });

      // 2. Click the last option
      const lastOption = options[options.length - 1];
      const lastValue = lastOption ? lastOption.getAttribute('data-value') : null;
      const lastText = lastOption ? lastOption.textContent.trim() : null;
      if (lastOption) lastOption.click();

      const nativeValAfterClick = select ? select.value : null;
      const labelTextAfterClick = label ? label.textContent.trim() : null;
      const isClosedAfterClick = !customSelect.classList.contains('is-open');

      // 3. Test horizontal overflow on document
      const docScrollWidth = document.documentElement.scrollWidth;
      const docClientWidth = document.documentElement.clientWidth;
      const hasHorizontalOverflow = docScrollWidth > docClientWidth;

      const report = {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        isOpen,
        optionsCount: options.length,
        allOptionsVisible: optionDetails.every(o => o.isVisible),
        lastOptionDetails: optionDetails[optionDetails.length - 1],
        clickResult: {
          lastValue,
          lastText,
          nativeValAfterClick,
          labelTextAfterClick,
          isClosedAfterClick,
          matched: nativeValAfterClick === lastValue
        },
        hasHorizontalOverflow,
        optionDetails
      };

      const out = document.createElement('div');
      out.id = 'clipping-test-report';
      out.textContent = JSON.stringify(report, null, 2);
      document.body.appendChild(out);
    });
  `;

  const orig = fs.readFileSync(filePath, 'utf8');
  try {
    fs.writeFileSync(filePath, orig.replace('</body>', `<script>${testScript}</script></body>`), 'utf8');
    const res = cp.spawnSync(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      `--window-size=${viewportWidth},${viewportHeight}`,
      '--virtual-time-budget=2000',
      '--dump-dom',
      fileUrl
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const dom = res.stdout || '';
    const m = dom.match(/<div id="clipping-test-report">([\s\S]*?)<\/div>/);
    return m ? JSON.parse(m[1]) : { error: 'No report match', raw: dom.slice(-500) };
  } finally {
    fs.writeFileSync(filePath, orig, 'utf8');
  }
}

// 1. Desktop Test (1280x900)
console.log('--- 1. Testing on Desktop Viewport (1280x900) ---');
const desktop = runChromeTest(1280, 900);
assert(desktop.isOpen, 'Dropdown opened successfully on desktop');
assert(desktop.optionsCount === 5, 'Dropdown contains all 5 category options');
assert(desktop.allOptionsVisible, 'Every single category option is visible with positive dimensions');
assert(desktop.lastOptionDetails && desktop.lastOptionDetails.isVisible, 'The LAST option ("Sustainable Lifestyle") is fully visible');
assert(desktop.clickResult.matched, 'Clicking the last option successfully updated the native <select>');
assert(desktop.clickResult.isClosedAfterClick, 'Dropdown closed cleanly after selecting option');
assert(!desktop.hasHorizontalOverflow, 'No horizontal overflow or unwanted page scrolling');

// 2. Tablet Test (768x1024)
console.log('\n--- 2. Testing on Tablet Viewport (768x1024) ---');
const tablet = runChromeTest(768, 1024);
assert(tablet.optionsCount === 5, 'Tablet contains all 5 category options');
assert(tablet.allOptionsVisible, 'All 5 options visible on tablet without clipping');
assert(tablet.lastOptionDetails && tablet.lastOptionDetails.isVisible, 'Last option visible on tablet');
assert(tablet.clickResult.matched, 'Clicking option updates select on tablet');
assert(!tablet.hasHorizontalOverflow, 'No horizontal scrollbar on tablet');

// 3. Mobile Test (375x812)
console.log('\n--- 3. Testing on Mobile Viewport (375x812) ---');
const mobile = runChromeTest(375, 812);
assert(mobile.optionsCount === 5, 'Mobile contains all 5 category options');
assert(mobile.allOptionsVisible, 'All 5 options visible on mobile without clipping');
assert(mobile.lastOptionDetails && mobile.lastOptionDetails.isVisible, 'Last option visible on mobile');
assert(mobile.clickResult.matched, 'Clicking option updates select on mobile');
assert(!mobile.hasHorizontalOverflow, 'No horizontal scrollbar on mobile');

console.log('\n============================================================');
console.log(`DROPDOWN CLIPPING TESTS: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
