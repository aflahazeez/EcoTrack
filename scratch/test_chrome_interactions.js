const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE = 'c:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

function runInChrome(htmlFilename, testScript) {
  const filePath = path.join(WORKSPACE, htmlFilename);
  const orig = fs.readFileSync(filePath, 'utf8');
  try {
    fs.writeFileSync(filePath, orig.replace('</body>', `<script>${testScript}</script></body>`), 'utf8');
    const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
    const res = cp.spawnSync(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      '--virtual-time-budget=2000',
      '--dump-dom',
      fileUrl
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const dom = res.stdout || '';
    const m = dom.match(/<div id="chrome-interaction-result">([\s\S]*?)<\/div>/);
    return m ? JSON.parse(m[1]) : { error: 'No report match', rawOutput: dom.slice(-500) };
  } finally {
    fs.writeFileSync(filePath, orig, 'utf8');
  }
}

console.log('============================================================');
console.log('CHROME INTERACTION & FUNCTIONALITY AUDIT');
console.log('============================================================\n');

// 1. Calculator Interaction: Click custom select option -> updates native select -> updates calculations
const calcScript = `
  window.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('est-transport-method');
    const customSelect = document.getElementById('eco-custom-select-est-transport-method');
    const trigger = customSelect ? customSelect.querySelector('.eco-custom-select-trigger') : null;
    const label = customSelect ? customSelect.querySelector('.eco-custom-select-label') : null;
    
    const initialNativeVal = sel ? sel.value : null;
    const initialLabelText = label ? label.textContent.trim() : null;
    
    // Open dropdown
    if (trigger) trigger.click();
    
    // Find option for "electricCar"
    const evOption = customSelect.querySelector('.eco-custom-select-option[data-value="electricCar"]');
    if (evOption) evOption.click();
    
    const updatedNativeVal = sel ? sel.value : null;
    const updatedLabelText = label ? label.textContent.trim() : null;
    const isClosedAfterSelection = trigger.getAttribute('aria-expanded') === 'false';
    
    const report = {
      initialNativeVal,
      initialLabelText: initialLabelText ? initialLabelText.slice(0, 30) + '...' : null,
      updatedNativeVal,
      updatedLabelText: updatedLabelText ? updatedLabelText.slice(0, 30) + '...' : null,
      isClosedAfterSelection,
      valuesMatch: updatedNativeVal === 'electricCar'
    };

    const out = document.createElement('div');
    out.id = 'chrome-interaction-result';
    out.textContent = JSON.stringify(report, null, 2);
    document.body.appendChild(out);
  });
`;

const calcInteraction = runInChrome('calculator.html', calcScript);
console.log('--- 1. Calculator Custom Select Option Click in Chrome ---');
console.log(JSON.stringify(calcInteraction, null, 2));

// 2. Habits Calendar Interaction: Click toggle -> click day 15 -> date updates -> popup closes
const habitsScript = `
  window.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('btn-calendar-toggle');
    const popup = document.getElementById('eco-calendar-popup');
    const triggerLabel = document.getElementById('calendar-trigger-date-text');
    const nativeInput = document.getElementById('checklist-date-picker');
    
    const initialDate = window.EcoHabits.getSelectedViewDate();
    
    // Open calendar
    if (toggleBtn) toggleBtn.click();
    const wasOpen = popup.classList.contains('is-open');
    
    // Click day 15
    const day15 = Array.from(document.querySelectorAll('.cal-day:not(.other-month)')).find(d => d.textContent.trim() === '15');
    if (day15) day15.click();

    setTimeout(() => {
      const dateAfterClick = window.EcoHabits.getSelectedViewDate();
      const nativeValAfterClick = nativeInput ? nativeInput.value : null;
      const isClosedAfterClick = !popup.classList.contains('is-open');
      const triggerTextAfterClick = triggerLabel ? triggerLabel.textContent.trim() : null;
      
      // Click Today button
      const todayBtn = document.getElementById('btn-date-today');
      if (todayBtn) todayBtn.click();

      setTimeout(() => {
        const dateAfterToday = window.EcoHabits.getSelectedViewDate();
        
        const report = {
          initialDate,
          wasOpen,
          dateAfterClick,
          nativeValAfterClick,
          isClosedAfterClick,
          triggerTextAfterClick,
          dateAfterToday,
          todayMatches: dateAfterToday === window.EcoHabits.getTodayStr()
        };

        const out = document.createElement('div');
        out.id = 'chrome-interaction-result';
        out.textContent = JSON.stringify(report, null, 2);
        document.body.appendChild(out);
      }, 200);
    }, 200);
  });
`;

const habitsInteraction = runInChrome('habits.html', habitsScript);
console.log('\n--- 2. Habits Calendar Click & Today Return in Chrome ---');
console.log(JSON.stringify(habitsInteraction, null, 2));
