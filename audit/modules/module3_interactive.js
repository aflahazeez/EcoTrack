/**
 * EcoTrack Master Audit Runner - Module 3: Interactive Lifecycle & Accessibility Audit
 * Audits habit toggle/creation/deletion, dashboard sync, and keyboard ARIA navigation.
 */

const path = require('path');
const { SCREENSHOT_DIR } = require('../lib/reporter');

const LIVE_HABITS_URL = 'https://aflahazeez.github.io/EcoTrack/habits.html';
const LIVE_DASHBOARD_URL = 'https://aflahazeez.github.io/EcoTrack/dashboard.html';

async function runInteractiveAudit(cdp, reporter) {
  console.log('\n============================================================');
  console.log('MODULE 3: INTERACTIVE LIFECYCLE & ACCESSIBILITY AUDIT');
  console.log('============================================================\n');

  await cdp.setViewport(1440, 900);
  await cdp.navigate(LIVE_HABITS_URL);

  // 1. Accessible Habit Checkbox Toggle & Storage Persistence
  try {
    const habitCheckData = await cdp.evaluate(`
      (() => {
        // Query the live accessible custom ARIA pattern:
        const habitCard = document.querySelector('.habit-item-card[role="checkbox"]');
        if (!habitCard) return { found: false };

        const habitId = habitCard.getAttribute('data-habit-id');
        const initialChecked = habitCard.getAttribute('aria-checked') === 'true';

        // Trigger toggle click
        habitCard.click();

        // Query the re-rendered card by its unique habit ID
        const updatedCard = document.querySelector(\`.habit-item-card[data-habit-id="\${habitId}"]\`);
        const afterClickChecked = updatedCard ? updatedCard.getAttribute('aria-checked') === 'true' : !initialChecked;

        // Check local storage persistence in canonical application key 'ecotrack_habits_data'
        const rawStore = localStorage.getItem('ecotrack_habits_data');
        const data = rawStore ? JSON.parse(rawStore) : null;
        const todayStr = (() => {
          const d = new Date();
          return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        })();
        const todayCompletions = (data && data.completions && Array.isArray(data.completions[todayStr]))
          ? data.completions[todayStr]
          : [];

        const hasStorageRecord = afterClickChecked
          ? todayCompletions.includes(habitId)
          : !todayCompletions.includes(habitId);

        return {
          found: true,
          habitId,
          initialChecked,
          afterClickChecked,
          toggledSuccessfully: initialChecked !== afterClickChecked,
          hasStorageRecord
        };
      })()
    `);

    const togglePass = habitCheckData.found && habitCheckData.toggledSuccessfully && habitCheckData.hasStorageRecord;
    reporter.record(
      'Module 3: Interactive',
      'Habit Checklist: Accessible ARIA Card Toggle & Persistence',
      togglePass ? 'PASS' : 'FAIL',
      habitCheckData
    );

    // Capture habit active screenshot
    const shotPath = path.join(SCREENSHOT_DIR, 'habits_active_checklist.png');
    await cdp.captureScreenshot(shotPath);
    reporter.recordScreenshot('habits_active_checklist.png', 'Habit Checklist Active Toggle State', '1440x900');

  } catch (err) {
    reporter.record('Module 3: Interactive', 'Habit Checklist Toggle', 'FAIL', err.message);
  }

  // 2. Custom Habit Creation & Deletion Lifecycle (Independent Execution)
  try {
    const customHabitTitle = `Eco Audit Habit ${Date.now()}`;
    const customHabitResult = await cdp.evaluate(`
      (() => {
        const form = document.getElementById('form-add-custom-habit');
        const input = document.getElementById('input-custom-habit-title');
        const selectCat = document.getElementById('select-custom-habit-cat');
        if (!form || !input) {
          return { supported: false, reason: 'Form elements not found' };
        }

        input.value = ${JSON.stringify(customHabitTitle)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        if (selectCat) {
          selectCat.value = 'Sustainable Lifestyle';
          selectCat.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Submit form
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        // Verify insertion into DOM
        const customCards = Array.from(document.querySelectorAll('.habit-item-card'));
        const insertedCard = customCards.find(c => c.textContent.includes(${JSON.stringify(customHabitTitle)}));
        const inserted = !!insertedCard;
        const habitId = insertedCard ? insertedCard.getAttribute('data-habit-id') : null;

        // Verify persistence in local storage
        const rawData = localStorage.getItem('ecotrack_habits_data');
        const data = rawData ? JSON.parse(rawData) : null;
        const inStorage = !!(data && Array.isArray(data.habits) && data.habits.some(h => h.title === ${JSON.stringify(customHabitTitle)} && h.isCustom));

        // Test deletion
        let deleted = false;
        let removedFromStorage = false;
        if (habitId) {
          const deleteBtn = document.querySelector(\`.btn-delete-habit[data-delete-id="\${habitId}"]\`);
          if (deleteBtn) {
            deleteBtn.click();
            const cardAfter = document.querySelector(\`.habit-item-card[data-habit-id="\${habitId}"]\`);
            deleted = !cardAfter;

            const rawAfter = localStorage.getItem('ecotrack_habits_data');
            const dataAfter = rawAfter ? JSON.parse(rawAfter) : null;
            removedFromStorage = !(dataAfter && Array.isArray(dataAfter.habits) && dataAfter.habits.some(h => h.id === habitId));
          }
        }

        return {
          supported: true,
          inserted,
          inStorage,
          deleted,
          removedFromStorage
        };
      })()
    `);

    if (customHabitResult.supported) {
      const pass = customHabitResult.inserted && customHabitResult.inStorage && customHabitResult.deleted && customHabitResult.removedFromStorage;
      reporter.record(
        'Module 3: Interactive',
        'Custom Habit Creation, Persistence & Deletion Lifecycle',
        pass ? 'PASS' : 'FAIL',
        customHabitResult
      );
    } else {
      reporter.record(
        'Module 3: Interactive',
        'Custom Habit Creation Form',
        'FAIL',
        customHabitResult.reason || 'Custom habit form not present'
      );
    }
  } catch (err) {
    reporter.record('Module 3: Interactive', 'Custom Habit Lifecycle', 'FAIL', err.message);
  }

  // 3. Dashboard Habit Metric Synchronization with Client Storage (Controlled Test State)
  try {
    await cdp.navigate(LIVE_DASHBOARD_URL);

    const dashSyncResult = await cdp.evaluate(`
      (() => {
        const todayStr = (() => {
          const d = new Date();
          return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        })();

        // Inject valid, controlled habit test state: 5 habits, 2 completed today (40%), 3-day streak
        const controlledData = {
          habits: [
            { id: 'h_test_1', title: 'Walk or bike for short trips', category: 'Transportation' },
            { id: 'h_test_2', title: 'Switch off unused lights', category: 'Energy' },
            { id: 'h_test_3', title: 'Take shorter showers', category: 'Water' },
            { id: 'h_test_4', title: 'Segregate waste', category: 'Waste' },
            { id: 'h_test_5', title: 'Carry reusable bottle', category: 'Sustainable Lifestyle' }
          ],
          completions: {
            [todayStr]: ['h_test_1', 'h_test_2']
          },
          stats: {
            currentStreak: 3,
            longestStreak: 7,
            totalCompletions: 15
          }
        };

        localStorage.setItem('ecotrack_habits_data', JSON.stringify(controlledData));

        // Re-initialize dashboard with controlled data
        if (window.EcoDashboard && typeof window.EcoDashboard.init === 'function') {
          window.EcoDashboard.init();
        }

        const countEl = document.getElementById('dash-habit-today-count');
        const pctEl = document.getElementById('dash-habit-today-pct');
        const barEl = document.getElementById('dash-habit-today-bar');
        const streakEl = document.getElementById('dash-habit-current-streak');
        const contentCard = document.getElementById('habits-content');

        const countText = countEl ? countEl.textContent.trim() : '';
        const pctText = pctEl ? pctEl.textContent.trim() : '';
        const barWidth = barEl ? barEl.style.width : '';
        const streakText = streakEl ? streakEl.textContent.trim() : '';
        const isContentVisible = contentCard ? (contentCard.style.display !== 'none') : false;

        // Controlled expectations: 2 of 5 completed, 40%, 3 days
        const matchesCount = countText.includes('2 of 5');
        const matchesPct = pctText === '40%';
        const matchesBar = barWidth === '40%';
        const matchesStreak = streakText.includes('3 days') || streakText.includes('3');

        return {
          hasDashboardElements: !!(countEl && pctEl && barEl && streakEl),
          isContentVisible,
          countText,
          pctText,
          barWidth,
          streakText,
          matchesCount,
          matchesPct,
          matchesBar,
          matchesStreak,
          synced: isContentVisible && matchesCount && matchesPct && matchesBar && matchesStreak
        };
      })()
    `);

    reporter.record(
      'Module 3: Interactive',
      'Dashboard Habit Metric Synchronization with Client Storage',
      dashSyncResult.synced ? 'PASS' : 'FAIL',
      dashSyncResult
    );
  } catch (err) {
    reporter.record('Module 3: Interactive', 'Dashboard Habit Sync', 'FAIL', err.message);
  }

  // 4. Keyboard Navigation & ARIA Accessibility
  try {
    await cdp.navigate(LIVE_HABITS_URL);
    // Simulate pressing Tab key 5 times to test focus traversal
    for (let i = 0; i < 5; i++) {
      await cdp.dispatchKey('rawKeyDown', 'Tab', 'Tab', 9);
      await cdp.dispatchKey('keyUp', 'Tab', 'Tab', 9);
      await new Promise(r => setTimeout(r, 100));
    }

    const focusCheck = await cdp.evaluate(`
      (() => {
        const active = document.activeElement;
        const isBody = active === document.body;
        const hasAriaOrRole = active ? (active.hasAttribute('role') || active.hasAttribute('aria-label') || ['A', 'BUTTON', 'INPUT'].includes(active.tagName)) : false;
        return {
          focusedTag: active ? active.tagName : null,
          isBody,
          hasAriaOrRole
        };
      })()
    `);

    const focusPass = !focusCheck.isBody && focusCheck.hasAriaOrRole;
    reporter.record(
      'Module 3: Interactive',
      'Keyboard Tab Traversal & Interactive Element Focusability',
      focusPass ? 'PASS' : 'FAIL',
      focusCheck
    );
  } catch (err) {
    reporter.record('Module 3: Interactive', 'Keyboard Navigation Traversal', 'FAIL', err.message);
  }
}

module.exports = { runInteractiveAudit };
