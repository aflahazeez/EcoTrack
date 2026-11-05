/**
 * EcoTrack – Sustainable Living Hub: Habit Tracker & Eco Tips Engine (Phase 4 Refinements)
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Features:
 * 1. Daily randomized 5-habit checklist selection:
 *    - Selects 5 habits from available pool (defaults + custom + tip-derived).
 *    - Generates new selection per local calendar day (YYYY-MM-DD).
 *    - Remains stable throughout that day across page reloads.
 *    - Avoids identical combinations on consecutive days.
 *    - Preserves completed records and calculates streaks reliably.
 *    - Denominator in progress indicators reflects today's selected habit count.
 * 2. Daily Eco Tips Single-Card Carousel:
 *    - Randomly selects 4 distinct tips per calendar day; stable throughout that day.
 *    - Strictly ONE card visible at any time.
 *    - Previous/Next arrows and 4 position indicator dots.
 *    - Auto-slides every 6 seconds, looping back to the first slide.
 *    - Pauses on hover and focus; resumes when cursor/focus leaves.
 *    - Touch/swipe navigation on mobile.
 *    - Honors `prefers-reduced-motion` accessibility setting.
 *    - "Add as Habit" action converts tips to trackable habits and updates UI instantly.
 * 3. Restyled category dropdown using Dark Botanical design tokens.
 * 4. 100% Client-Side LocalStorage persistence via EcoStorage under STORAGE_KEYS.HABITS.
 *    Strictly isolates habit data without touching STORAGE_KEYS.FOOTPRINT.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. Fallback Catalogs
  // -------------------------------------------------------------------------
  const FALLBACK_DEFAULT_HABITS = [
    {
      id: 'habit_trans_public',
      title: 'Use public transport, cycle, or walk for daily trips',
      category: 'Transportation',
      isCustom: false,
      tipId: 'tip_trans_transit'
    },
    {
      id: 'habit_energy_lights',
      title: 'Switch off unused lights and fans when leaving rooms',
      category: 'Energy',
      isCustom: false,
      tipId: 'tip_energy_lighting'
    },
    {
      id: 'habit_energy_unplug',
      title: 'Unplug phantom-draw electronics & chargers when not in use',
      category: 'Energy',
      isCustom: false,
      tipId: 'tip_energy_phantom'
    },
    {
      id: 'habit_water_tap',
      title: 'Turn off tap while brushing, shaving, or soaping hands',
      category: 'Water',
      isCustom: false,
      tipId: 'tip_water_tap'
    },
    {
      id: 'habit_water_wash',
      title: 'Save water while washing dishes, clothes, or vehicles',
      category: 'Water',
      isCustom: false,
      tipId: 'tip_water_fixtures'
    },
    {
      id: 'habit_waste_bottle',
      title: 'Carry a reusable water bottle and beverage cup',
      category: 'Waste',
      isCustom: false,
      tipId: 'tip_waste_bottles'
    },
    {
      id: 'habit_waste_plastic',
      title: 'Avoid single-use plastic bags and disposable cutlery',
      category: 'Waste',
      isCustom: false,
      tipId: 'tip_waste_bags'
    },
    {
      id: 'habit_waste_segregate',
      title: 'Segregate dry recyclables and compostable organic waste',
      category: 'Waste',
      isCustom: false,
      tipId: 'tip_waste_compost'
    }
  ];

  // -------------------------------------------------------------------------
  // 2. Application State & Storage
  // -------------------------------------------------------------------------
  let hubState = {
    version: 2,
    habits: [],
    completions: {},         // { 'YYYY-MM-DD': ['habit_id_1', ...] }
    dailySelections: {},     // { 'YYYY-MM-DD': ['habit_id_1', 'habit_id_2', ...] } (5 habits)
    dailyTipSelections: {},  // { 'YYYY-MM-DD': ['tip_id_1', 'tip_id_2', ...] } (4 tips)
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalCompletions: 0
    }
  };

  // Active checklist navigation date (defaults to local calendar today)
  let selectedViewDate = getLocalDateString();

  let activeStatusFilter = 'all'; // 'all' | 'remaining' | 'completed'
  let activeCategoryFilter = 'all'; // 'all' | 'Transportation' | 'Energy' | 'Water' | 'Waste' | 'Sustainable Lifestyle'

  // Carousel runtime state
  let currentTipSlide = 0;
  let carouselTimer = null;
  let isCarouselHovered = false;
  let isCarouselFocused = false;
  let touchStartX = 0;
  let touchEndX = 0;

  // -------------------------------------------------------------------------
  // 3. Helper Functions: Dates & Seeded PRNG
  // -------------------------------------------------------------------------

  /**
   * Returns local date string in YYYY-MM-DD format
   * @param {Date} [d=new Date()]
   * @returns {string}
   */
  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Returns human-friendly formatted date string (e.g., "Wednesday, 4 November 2026")
   * @param {Date} [d=new Date()]
   * @returns {string}
   */
  function formatHumanDate(d = new Date()) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calculates a relative date string by adding or subtracting days
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @param {number} daysBack
   * @returns {string}
   */
  function getRelativeDateString(dateStr, daysBack) {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() - daysBack);
    return getLocalDateString(d);
  }

  /**
   * Evaluates date mode relative to local calendar today ('past' | 'today' | 'future')
   * @param {string} [dateStr=selectedViewDate] - 'YYYY-MM-DD'
   * @returns {'past' | 'today' | 'future'}
   */
  function getDateMode(dateStr = selectedViewDate) {
    const todayStr = getLocalDateString();
    if (dateStr < todayStr) return 'past';
    if (dateStr > todayStr) return 'future';
    return 'today';
  }

  /**
   * Formats date string into human-friendly label for checklist header
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @returns {string}
   */
  function formatDisplayedDate(dateStr) {
    const todayStr = getLocalDateString();
    const yesterdayStr = getRelativeDateString(todayStr, 1);
    const tomorrowStr = getRelativeDateString(todayStr, -1);

    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const friendly = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (dateStr === todayStr) {
      return `Today • ${friendly}`;
    } else if (dateStr === yesterdayStr) {
      return `Yesterday • ${friendly}`;
    } else if (dateStr === tomorrowStr) {
      return `Tomorrow • ${friendly}`;
    } else {
      return friendly;
    }
  }

  /**
   * Switches the active checklist view date and updates DOM components
   * @param {string} newDateStr - 'YYYY-MM-DD'
   */
  function changeSelectedDate(newDateStr) {
    if (!newDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) return;
    selectedViewDate = newDateStr;

    if (typeof document !== 'undefined') {
      const datePicker = document.getElementById('checklist-date-picker');
      if (datePicker) datePicker.value = selectedViewDate;

      const dateLabel = document.getElementById('displayed-date-label');
      if (dateLabel) dateLabel.textContent = formatDisplayedDate(selectedViewDate);

      const countBadge = document.getElementById('badge-total-count');
      if (countBadge) {
        const mode = getDateMode(selectedViewDate);
        if (mode === 'today') countBadge.textContent = 'Today';
        else if (mode === 'past') countBadge.textContent = 'Past Record';
        else countBadge.textContent = 'Upcoming';
      }
    }

    renderAll();
  }

  /**
   * Returns habit records associated with a specific date
   * @param {string} [dateStr=selectedViewDate]
   * @returns {Object[]}
   */
  function getHabitsForDate(dateStr = selectedViewDate) {
    const mode = getDateMode(dateStr);
    if (mode === 'future') return [];

    if (mode === 'today') {
      return getTodaySelectedHabits(dateStr);
    }

    // Past date
    const recordedIds = hubState.dailySelections[dateStr] || [];
    const completedIds = hubState.completions[dateStr] || [];
    const mergedIdSet = new Set([...recordedIds, ...completedIds]);

    if (mergedIdSet.size === 0) {
      return [];
    }

    const habitMap = new Map();
    hubState.habits.forEach(h => habitMap.set(h.id, h));
    FALLBACK_DEFAULT_HABITS.forEach(h => {
      if (!habitMap.has(h.id)) habitMap.set(h.id, h);
    });

    const result = [];
    mergedIdSet.forEach(id => {
      if (habitMap.has(id)) {
        result.push(habitMap.get(id));
      } else {
        result.push({
          id,
          title: 'Recorded Sustainable Activity',
          category: 'Sustainable Lifestyle',
          isCustom: true
        });
      }
    });

    return result;
  }

  /**
   * Generates a deterministic integer hash from a date string and optional seed offset
   * @param {string} dateStr
   * @param {number} [offset=0]
   * @returns {number}
   */
  function hashDateString(dateStr, offset = 0) {
    let hash = offset;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Seeded pseudo-random number generator (LCG)
   * @param {number} seed
   * @returns {function(): number}
   */
  function createSeededPRNG(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * Deterministic Fisher-Yates array shuffle using a seeded PRNG
   * @param {Array} array
   * @param {number} seed
   * @returns {Array} Shuffled copy
   */
  function seededShuffle(array, seed) {
    const prng = createSeededPRNG(seed);
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  /**
   * Computes the current consecutive day streak and longest streak reliably.
   * If today has completions: streak counts backwards starting today.
   * If today has 0 completions: streak counts backwards from yesterday so the streak
   * does not prematurely drop to 0 before the user logs their first habit today.
   * 
   * @param {Object} completions - { 'YYYY-MM-DD': string[] }
   * @param {string} todayStr - 'YYYY-MM-DD'
   * @returns {{ currentStreak: number, longestStreak: number, totalLifetimeCompletions: number }}
   */
  function calculateStreakAndStats(completions, todayStr) {
    let totalLifetime = 0;
    const completedDays = new Set();

    Object.keys(completions || {}).forEach(date => {
      const list = completions[date];
      if (Array.isArray(list) && list.length > 0) {
        totalLifetime += list.length;
        completedDays.add(date);
      }
    });

    let currentStreak = 0;
    const todayCompleted = completedDays.has(todayStr);

    let startOffset = 0;
    if (todayCompleted) {
      startOffset = 0;
    } else {
      const yesterdayStr = getRelativeDateString(todayStr, 1);
      if (completedDays.has(yesterdayStr)) {
        startOffset = 1;
      }
    }

    if (todayCompleted || completedDays.has(getRelativeDateString(todayStr, 1))) {
      let offset = startOffset;
      while (true) {
        const checkDate = getRelativeDateString(todayStr, offset);
        if (completedDays.has(checkDate)) {
          currentStreak++;
          offset++;
        } else {
          break;
        }
      }
    }

    // Compute all-time longest streak
    const sortedDays = Array.from(completedDays).sort();
    let longestStreak = currentStreak;
    let tempStreak = 0;
    let prevDate = null;

    for (let i = 0; i < sortedDays.length; i++) {
      const curDate = sortedDays[i];
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const expectedNext = getRelativeDateString(prevDate, -1);
        if (curDate === expectedNext) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curDate;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalLifetimeCompletions: totalLifetime
    };
  }

  // -------------------------------------------------------------------------
  // 4. Daily Habit & Tip Randomization Selection
  // -------------------------------------------------------------------------

  /**
   * Returns the stable list of habit IDs selected for a specific calendar date (5 habits).
   * - Stable across refreshes during the same date.
   * - Rotates on a new date.
   * - Avoids identical selection on consecutive days when pool > 5.
   * - Guarantees habits completed today are retained.
   * - Handles pool sizes <= 5 by returning all habits.
   * 
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @returns {string[]} Selected habit IDs
   */
  function ensureDailyHabitsSelection(dateStr) {
    const pool = hubState.habits;
    if (!pool || pool.length === 0) return [];

    // If total pool has <= 5 habits, return all available IDs
    if (pool.length <= 5) {
      const allIds = pool.map(h => h.id);
      hubState.dailySelections[dateStr] = allIds;
      return allIds;
    }

    const existing = hubState.dailySelections[dateStr];
    const validPoolIds = new Set(pool.map(h => h.id));

    // Check if existing daily selection is already valid
    if (Array.isArray(existing) && existing.length > 0) {
      // Filter out any IDs that were deleted from habits pool
      let filtered = existing.filter(id => validPoolIds.has(id));

      // Ensure any habits already checked off today are included
      const todayCompletions = hubState.completions[dateStr] || [];
      todayCompletions.forEach(cId => {
        if (validPoolIds.has(cId) && !filtered.includes(cId)) {
          filtered.push(cId);
        }
      });

      // If count dropped below 5 due to deletion, backfill from remaining pool
      if (filtered.length < 5) {
        const remaining = pool.filter(h => !filtered.includes(h.id));
        for (let i = 0; i < remaining.length && filtered.length < 5; i++) {
          filtered.push(remaining[i].id);
        }
      }

      if (filtered.length >= 5) {
        hubState.dailySelections[dateStr] = filtered;
        return filtered;
      }
    }

    // Generate new randomized selection for dateStr
    const yesterdayStr = getRelativeDateString(dateStr, 1);
    const yesterdaySet = new Set(hubState.dailySelections[yesterdayStr] || []);

    let seed = hashDateString(dateStr, 1337);
    let shuffled = seededShuffle(pool, seed);
    let selectedIds = shuffled.slice(0, 5).map(h => h.id);

    // If generated set is identical to yesterday's set and pool > 5, re-seed to rotate
    if (pool.length > 5 && yesterdaySet.size >= 5) {
      const isIdentical = selectedIds.every(id => yesterdaySet.has(id));
      if (isIdentical) {
        seed = hashDateString(dateStr, 9999);
        shuffled = seededShuffle(pool, seed);
        selectedIds = shuffled.slice(0, 5).map(h => h.id);
      }
    }

    hubState.dailySelections[dateStr] = selectedIds;
    return selectedIds;
  }

  /**
   * Returns today's active habit objects (typically 5 habits)
   * @param {string} [todayStr=getLocalDateString()]
   * @returns {Object[]}
   */
  function getTodaySelectedHabits(todayStr = getLocalDateString()) {
    const selectedIds = new Set(ensureDailyHabitsSelection(todayStr));
    return hubState.habits.filter(h => selectedIds.has(h.id));
  }

  /**
   * Returns the stable list of 4 Eco Tip IDs selected for a specific calendar date.
   * - Stable across refreshes during the same date.
   * - Rotates on a new date.
   * 
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @returns {string[]} 4 tip IDs
   */
  function ensureDailyTipsSelection(dateStr) {
    const allTips = (typeof ECO_DATA !== 'undefined' && Array.isArray(ECO_DATA.ecoTips))
      ? ECO_DATA.ecoTips
      : [];

    if (!allTips || allTips.length === 0) return [];
    if (allTips.length <= 4) {
      const allIds = allTips.map(t => t.id);
      hubState.dailyTipSelections[dateStr] = allIds;
      return allIds;
    }

    const existing = hubState.dailyTipSelections[dateStr];
    const validTipIds = new Set(allTips.map(t => t.id));

    if (Array.isArray(existing) && existing.length === 4 && existing.every(id => validTipIds.has(id))) {
      return existing;
    }

    // Generate 4 distinct tips for dateStr
    const yesterdayStr = getRelativeDateString(dateStr, 1);
    const yesterdayTips = new Set(hubState.dailyTipSelections[yesterdayStr] || []);

    let seed = hashDateString(dateStr, 4242);
    let shuffled = seededShuffle(allTips, seed);
    let selectedIds = shuffled.slice(0, 4).map(t => t.id);

    // If identical to yesterday, re-seed
    if (allTips.length > 4 && yesterdayTips.size === 4) {
      const isIdentical = selectedIds.every(id => yesterdayTips.has(id));
      if (isIdentical) {
        seed = hashDateString(dateStr, 7777);
        shuffled = seededShuffle(allTips, seed);
        selectedIds = shuffled.slice(0, 4).map(t => t.id);
      }
    }

    hubState.dailyTipSelections[dateStr] = selectedIds;
    return selectedIds;
  }

  /**
   * Returns the 4 Eco Tip objects selected for today
   * @param {string} [todayStr=getLocalDateString()]
   * @returns {Object[]}
   */
  function getTodaySelectedTips(todayStr = getLocalDateString()) {
    const allTips = (typeof ECO_DATA !== 'undefined' && Array.isArray(ECO_DATA.ecoTips))
      ? ECO_DATA.ecoTips
      : [];

    const selectedIds = ensureDailyTipsSelection(todayStr);
    const tipMap = new Map(allTips.map(t => [t.id, t]));
    return selectedIds.map(id => tipMap.get(id)).filter(Boolean);
  }

  // -------------------------------------------------------------------------
  // 5. State Persistence (Isolated via EcoStorage)
  // -------------------------------------------------------------------------

  /**
   * Initializes hub state from LocalStorage or sets sensible defaults
   */
  function loadHubState() {
    let saved = null;
    if (typeof EcoStorage !== 'undefined' && typeof STORAGE_KEYS !== 'undefined') {
      saved = EcoStorage.get(STORAGE_KEYS.HABITS, null);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('ecotrack_habits_data');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {
        console.warn('[Hub] Corrupted localStorage, using defaults:', e);
      }
    }

    const initialHabits = (typeof ECO_DATA !== 'undefined' && Array.isArray(ECO_DATA.defaultHabits))
      ? ECO_DATA.defaultHabits
      : FALLBACK_DEFAULT_HABITS;

    if (!saved || typeof saved !== 'object') {
      hubState = {
        version: 2,
        habits: JSON.parse(JSON.stringify(initialHabits)),
        completions: {},
        dailySelections: {},
        dailyTipSelections: {},
        stats: {
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          totalCompletions: 0
        }
      };
    } else {
      hubState = {
        version: saved.version || 2,
        habits: Array.isArray(saved.habits) && saved.habits.length > 0 
          ? saved.habits 
          : JSON.parse(JSON.stringify(initialHabits)),
        completions: (saved.completions && typeof saved.completions === 'object') 
          ? saved.completions 
          : {},
        dailySelections: (saved.dailySelections && typeof saved.dailySelections === 'object') 
          ? saved.dailySelections 
          : {},
        dailyTipSelections: (saved.dailyTipSelections && typeof saved.dailyTipSelections === 'object') 
          ? saved.dailyTipSelections 
          : {},
        stats: (saved.stats && typeof saved.stats === 'object') 
          ? saved.stats 
          : { currentStreak: 0, longestStreak: 0, lastCompletedDate: null, totalCompletions: 0 }
      };
    }

    const todayStr = getLocalDateString();
    selectedViewDate = todayStr;
    ensureDailyHabitsSelection(todayStr);
    ensureDailyTipsSelection(todayStr);

    const recalculated = calculateStreakAndStats(hubState.completions, todayStr);
    hubState.stats.currentStreak = recalculated.currentStreak;
    hubState.stats.longestStreak = Math.max(hubState.stats.longestStreak || 0, recalculated.longestStreak);
    hubState.stats.totalCompletions = recalculated.totalLifetimeCompletions;
  }

  /**
   * Defensively saves the current hub state to LocalStorage
   */
  function saveHubState() {
    const todayStr = getLocalDateString();
    const stats = calculateStreakAndStats(hubState.completions, todayStr);
    hubState.stats.currentStreak = stats.currentStreak;
    hubState.stats.longestStreak = Math.max(hubState.stats.longestStreak || 0, stats.longestStreak);
    hubState.stats.totalCompletions = stats.totalLifetimeCompletions;

    if (typeof EcoStorage !== 'undefined' && typeof STORAGE_KEYS !== 'undefined') {
      EcoStorage.set(STORAGE_KEYS.HABITS, hubState);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('ecotrack_habits_data', JSON.stringify(hubState));
      } catch (e) {
        console.warn('[Hub] Failed to save to localStorage:', e);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 6. Habit Checklist Operations
  // -------------------------------------------------------------------------

  /**
   * Returns the list of habit IDs completed for today
   * @returns {string[]}
   */
  function getTodayCompletedHabitIds() {
    const todayStr = getLocalDateString();
    return hubState.completions[todayStr] || [];
  }

  /**
   * Toggles the completion status of a habit for today
   * @param {string} habitId
   */
  function toggleHabitCompletion(habitId) {
    const todayStr = getLocalDateString();
    if (selectedViewDate !== todayStr) {
      // Historical and future dates are strictly read-only
      return;
    }

    if (!hubState.completions[todayStr]) {
      hubState.completions[todayStr] = [];
    }

    const list = hubState.completions[todayStr];
    const index = list.indexOf(habitId);
    let isNowCompleted = false;

    if (index > -1) {
      list.splice(index, 1);
      isNowCompleted = false;
    } else {
      list.push(habitId);
      isNowCompleted = true;
      hubState.stats.lastCompletedDate = todayStr;
    }

    saveHubState();
    renderAll();

    if (isNowCompleted) {
      const habit = hubState.habits.find(h => h.id === habitId);
      const title = habit ? habit.title : 'Habit';
      showToast(`Completed: ${title}`);
    }
  }

  /**
   * Adds a custom habit to the user's tracker
   * @param {string} title
   * @param {string} category
   * @returns {{ success: boolean, message?: string }}
   */
  function addCustomHabit(title, category) {
    const todayStr = getLocalDateString();
    if (selectedViewDate !== todayStr) {
      return { success: false, message: 'Custom habits can only be added for today.' };
    }

    const cleanTitle = (title || '').trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      return { success: false, message: 'Habit title must be at least 3 characters long.' };
    }
    if (cleanTitle.length > 80) {
      return { success: false, message: 'Habit title cannot exceed 80 characters.' };
    }

    // Duplicate prevention (case-insensitive check)
    const isDuplicate = hubState.habits.some(
      h => h.title.trim().toLowerCase() === cleanTitle.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, message: 'This habit is already in your tracker.' };
    }

    const newHabit = {
      id: 'custom_' + Date.now(),
      title: cleanTitle,
      category: category || 'Sustainable Lifestyle',
      isCustom: true,
      createdAt: todayStr
    };

    hubState.habits.push(newHabit);

    // Immediately include in today's active daily selection so the user can see and check it
    if (!hubState.dailySelections[todayStr]) {
      hubState.dailySelections[todayStr] = [];
    }
    if (!hubState.dailySelections[todayStr].includes(newHabit.id)) {
      hubState.dailySelections[todayStr].push(newHabit.id);
    }

    saveHubState();
    renderAll();
    showToast(`Added custom habit: "${cleanTitle}"`);
    return { success: true };
  }

  /**
   * Deletes a custom habit or tip-derived habit from the tracker
   * @param {string} habitId
   */
  function deleteHabit(habitId) {
    const todayStr = getLocalDateString();
    if (selectedViewDate !== todayStr) {
      return;
    }

    const habit = hubState.habits.find(h => h.id === habitId);
    if (!habit) return;

    hubState.habits = hubState.habits.filter(h => h.id !== habitId);

    // Remove from today's daily selection and completions
    if (hubState.dailySelections[todayStr]) {
      hubState.dailySelections[todayStr] = hubState.dailySelections[todayStr].filter(id => id !== habitId);
      // Backfill to 5 if other habits exist in pool
      if (hubState.dailySelections[todayStr].length < 5) {
        const remaining = hubState.habits.filter(h => !hubState.dailySelections[todayStr].includes(h.id));
        if (remaining.length > 0) {
          hubState.dailySelections[todayStr].push(remaining[0].id);
        }
      }
    }

    if (hubState.completions[todayStr]) {
      hubState.completions[todayStr] = hubState.completions[todayStr].filter(id => id !== habitId);
    }

    saveHubState();
    renderAll();
    showToast(`Removed habit: "${habit.title}"`);
  }

  /**
   * Converts an Eco Tip into a daily habit without creating duplicates
   * @param {string} tipId
   * @returns {{ success: boolean, message?: string }}
   */
  function addTipAsHabit(tipId) {
    const allTips = (typeof ECO_DATA !== 'undefined' && Array.isArray(ECO_DATA.ecoTips))
      ? ECO_DATA.ecoTips
      : [];

    const tip = allTips.find(t => t.id === tipId);
    if (!tip) return { success: false, message: 'Tip not found.' };

    const habitTitle = tip.habitEquivalent || tip.title;

    // Check duplicate by tipId or title
    const alreadyExists = hubState.habits.some(
      h => (h.tipId && h.tipId === tipId) || h.title.trim().toLowerCase() === habitTitle.trim().toLowerCase()
    );

    if (alreadyExists) {
      showToast('This tip is already in your daily habits!');
      return { success: false, message: 'Already in habits.' };
    }

    const todayStr = getLocalDateString();
    const newHabit = {
      id: 'habit_from_' + tip.id,
      title: habitTitle,
      category: tip.category,
      isCustom: false,
      tipId: tip.id,
      createdAt: todayStr
    };

    hubState.habits.push(newHabit);

    // Immediately include in today's active daily selection
    if (!hubState.dailySelections[todayStr]) {
      hubState.dailySelections[todayStr] = [];
    }
    if (!hubState.dailySelections[todayStr].includes(newHabit.id)) {
      hubState.dailySelections[todayStr].push(newHabit.id);
    }

    saveHubState();
    renderAll();
    showToast(`Added to habits: "${habitTitle}"`);
    return { success: true };
  }

  /**
   * Resets today's checked habits
   */
  function resetTodayHabits() {
    const todayStr = getLocalDateString();
    if (selectedViewDate !== todayStr) {
      return;
    }

    hubState.completions[todayStr] = [];
    saveHubState();
    renderAll();
    showToast('Reset today’s habit completions.');
  }

  // -------------------------------------------------------------------------
  // 7. Single-Card Carousel Engine (Eco Tips)
  // -------------------------------------------------------------------------

  /**
   * Checks whether the user has requested reduced motion
   * @returns {boolean}
   */
  function isReducedMotionPreferred() {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Navigates the carousel to a specific slide index (0 to 3)
   * @param {number} targetIndex
   */
  function goToTipSlide(targetIndex) {
    const totalSlides = 4;
    currentTipSlide = (targetIndex + totalSlides) % totalSlides;

    if (typeof document === 'undefined') return;

    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length === 0) return;

    slides.forEach((slide, idx) => {
      const isActive = idx === currentTipSlide;
      slide.classList.toggle('active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentTipSlide;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /**
   * Navigates to the next tip slide, looping back when reaching the 4th
   */
  function nextTipSlide() {
    goToTipSlide(currentTipSlide + 1);
  }

  /**
   * Navigates to the previous tip slide
   */
  function prevTipSlide() {
    goToTipSlide(currentTipSlide - 1);
  }

  /**
   * Starts the 6-second auto-slide rotation unless reduced motion is preferred
   */
  function startCarouselAutoTimer() {
    if (isReducedMotionPreferred()) {
      updateCarouselStatusText('Manual navigation (reduced motion)');
      return;
    }

    stopCarouselAutoTimer();
    carouselTimer = setInterval(() => {
      if (!isCarouselHovered && !isCarouselFocused) {
        nextTipSlide();
      }
    }, 6000);

    updateCarouselStatusText('Auto-rotating every 6s');
  }

  /**
   * Pauses the auto-slide timer
   * @param {string} [reason='paused']
   */
  function stopCarouselAutoTimer(reason) {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
    if (reason) {
      updateCarouselStatusText(reason);
    }
  }

  /**
   * Updates the carousel status pill text
   * @param {string} text
   */
  function updateCarouselStatusText(text) {
    if (typeof document === 'undefined') return;
    const statusText = document.getElementById('carousel-status-text');
    if (statusText) statusText.textContent = text;
  }

  // -------------------------------------------------------------------------
  // 8. UI Rendering & DOM Synchronization
  // -------------------------------------------------------------------------

  /**
   * Displays a temporary floating toast message
   * @param {string} message
   */
  function showToast(message) {
    if (typeof document === 'undefined') return;
    const toast = document.getElementById('hub-toast');
    const toastMsg = document.getElementById('hub-toast-msg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('visible');

    if (window._hubToastTimeout) clearTimeout(window._hubToastTimeout);
    window._hubToastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  /**
   * Helper to map category names to CSS classes
   * @param {string} category
   * @returns {string}
   */
  function getCategoryClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('trans')) return 'cat-transportation';
    if (cat.includes('energy')) return 'cat-energy';
    if (cat.includes('water')) return 'cat-water';
    if (cat.includes('waste')) return 'cat-waste';
    return 'cat-lifestyle';
  }

  /**
   * Updates top progress overview cards and synchronizes checklist header.
   */
  function renderProgressOverview() {
    const todayStr = getLocalDateString();
    const mode = getDateMode(selectedViewDate);

    let totalHabits = 0;
    let completedCount = 0;
    let remainingCount = 0;
    let pct = 0;

    if (mode === 'today') {
      const todayHabits = getTodaySelectedHabits(todayStr);
      totalHabits = todayHabits.length;
      const todayHabitIds = new Set(todayHabits.map(h => h.id));
      const completedIds = getTodayCompletedHabitIds();
      completedCount = completedIds.filter(id => todayHabitIds.has(id)).length;
      remainingCount = Math.max(0, totalHabits - completedCount);
      pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    } else if (mode === 'past') {
      const pastHabits = getHabitsForDate(selectedViewDate);
      totalHabits = pastHabits.length;
      const pastCompletions = hubState.completions[selectedViewDate] || [];
      const pastHabitIds = new Set(pastHabits.map(h => h.id));
      completedCount = pastCompletions.filter(id => pastHabitIds.size === 0 || pastHabitIds.has(id)).length;
      remainingCount = Math.max(0, totalHabits - completedCount);
      pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    } else {
      // Future
      totalHabits = 0;
      completedCount = 0;
      remainingCount = 0;
      pct = 0;
    }

    if (typeof document === 'undefined') return;

    // Elements
    const elPct = document.getElementById('metric-progress-pct');
    const elCount = document.getElementById('metric-progress-count');
    const elBar = document.getElementById('metric-progress-bar');
    const elMsg = document.getElementById('metric-progress-msg');
    const elCardProgressLabel = document.querySelector('.card-progress .metric-label');
    const elStreak = document.getElementById('metric-streak-count');
    const elBestStreak = document.getElementById('metric-streak-best');
    const elLifetime = document.getElementById('metric-lifetime-count');
    const elTotalHabits = document.getElementById('metric-total-habits');
    const elDateBanner = document.getElementById('hub-today-date');

    // Synchronize checklist date controls
    const datePicker = document.getElementById('checklist-date-picker');
    if (datePicker && datePicker.value !== selectedViewDate) {
      datePicker.value = selectedViewDate;
    }

    const dateLabel = document.getElementById('displayed-date-label');
    if (dateLabel) {
      dateLabel.textContent = formatDisplayedDate(selectedViewDate);
    }

    const countBadge = document.getElementById('badge-total-count');
    if (countBadge) {
      if (mode === 'today') countBadge.textContent = 'Today';
      else if (mode === 'past') countBadge.textContent = 'Past Record';
      else countBadge.textContent = 'Upcoming';
    }

    if (elCardProgressLabel) {
      if (mode === 'today') elCardProgressLabel.textContent = "Today's Progress";
      else if (mode === 'past') elCardProgressLabel.textContent = 'Historical Progress';
      else elCardProgressLabel.textContent = 'Upcoming Day';
    }

    if (elDateBanner) {
      elDateBanner.textContent = formatHumanDate();
    }
    if (elPct) elPct.textContent = `${pct}%`;
    if (elCount) elCount.textContent = `${completedCount} of ${totalHabits}`;
    if (elBar) elBar.style.width = `${pct}%`;

    if (elMsg) {
      if (mode === 'future') {
        elMsg.textContent = 'This day is still ahead. Your habits will be ready when the day arrives.';
      } else if (mode === 'past') {
        if (totalHabits === 0) {
          elMsg.textContent = 'No habit completions were logged on this date.';
        } else if (pct === 100) {
          elMsg.textContent = 'Outstanding! All recorded habits were completed on this day.';
        } else {
          elMsg.textContent = `Historical record: ${completedCount} of ${totalHabits} habit${totalHabits === 1 ? '' : 's'} checked off.`;
        }
      } else {
        if (totalHabits === 0) {
          elMsg.textContent = 'Add habits or eco tips below to begin tracking!';
        } else if (pct === 100) {
          elMsg.textContent = 'Outstanding! All daily habits completed today! 🎉';
        } else if (pct >= 50) {
          elMsg.textContent = `Great progress! ${remainingCount} habit${remainingCount === 1 ? '' : 's'} remaining today.`;
        } else if (completedCount > 0) {
          elMsg.textContent = `Good start! Keep going to build your daily streak.`;
        } else {
          elMsg.textContent = `Check off your first habit to keep your green streak alive!`;
        }
      }
    }

    // Streaks and totals are ALWAYS calculated from true history ending today
    if (elStreak) elStreak.textContent = `${hubState.stats.currentStreak}`;
    if (elBestStreak) elBestStreak.textContent = `${hubState.stats.longestStreak} days`;
    if (elLifetime) elLifetime.textContent = `${hubState.stats.totalCompletions}`;
    if (elTotalHabits) elTotalHabits.textContent = `${totalHabits}`;

    // Update filter counts in toolbar
    const countAll = document.getElementById('filter-count-all');
    const countRemaining = document.getElementById('filter-count-remaining');
    const countCompleted = document.getElementById('filter-count-completed');

    if (countAll) countAll.textContent = `(${totalHabits})`;
    if (countRemaining) countRemaining.textContent = `(${remainingCount})`;
    if (countCompleted) countCompleted.textContent = `(${completedCount})`;
  }

  /**
   * Renders the daily habit checklist items respecting the selected view date
   */
  function renderHabitsList() {
    if (typeof document === 'undefined') return;

    const container = document.getElementById('habit-items-list');
    const emptyState = document.getElementById('habits-empty-state');
    const futureEmptyState = document.getElementById('future-date-state');
    const pastEmptyState = document.getElementById('past-empty-state');
    const statusBanner = document.getElementById('date-status-banner');
    const statusText = document.getElementById('date-status-text');
    const customHabitCard = document.getElementById('add-custom-habit-card');
    const btnReset = document.getElementById('btn-reset-today');

    if (!container) return;

    const mode = getDateMode(selectedViewDate);

    // Update banner & interactive control visibility
    if (mode === 'past') {
      if (statusBanner) statusBanner.style.display = 'flex';
      if (statusText) statusText.textContent = 'Day complete — this is a look back at your progress.';
      if (customHabitCard) customHabitCard.style.display = 'none';
      if (btnReset) btnReset.style.display = 'none';
    } else if (mode === 'future') {
      if (statusBanner) statusBanner.style.display = 'none';
      if (customHabitCard) customHabitCard.style.display = 'none';
      if (btnReset) btnReset.style.display = 'none';
    } else {
      // Today
      if (statusBanner) statusBanner.style.display = 'none';
      if (customHabitCard) customHabitCard.style.display = '';
      if (btnReset) btnReset.style.display = 'inline-flex';
    }

    // Future mode handling
    if (mode === 'future') {
      container.innerHTML = '';
      if (futureEmptyState) futureEmptyState.style.display = 'block';
      if (pastEmptyState) pastEmptyState.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
      return;
    } else {
      if (futureEmptyState) futureEmptyState.style.display = 'none';
    }

    // Retrieve habits for selected view date
    const dateHabits = getHabitsForDate(selectedViewDate);
    const dateCompletions = hubState.completions[selectedViewDate] || [];
    const completedIds = new Set(dateCompletions);

    // Past mode with no activity recorded
    if (mode === 'past' && dateHabits.length === 0) {
      container.innerHTML = '';
      if (pastEmptyState) pastEmptyState.style.display = 'block';
      if (emptyState) emptyState.style.display = 'none';
      return;
    } else {
      if (pastEmptyState) pastEmptyState.style.display = 'none';
    }

    // Filter by activeStatusFilter and activeCategoryFilter
    let filtered = dateHabits.filter(habit => {
      const isCompleted = completedIds.has(habit.id);

      // Status filter
      if (activeStatusFilter === 'remaining' && isCompleted) return false;
      if (activeStatusFilter === 'completed' && !isCompleted) return false;

      // Category filter
      if (activeCategoryFilter !== 'all') {
        const cat = habit.category || '';
        if (activeCategoryFilter === 'Transportation' && !cat.includes('Transport')) return false;
        if (activeCategoryFilter === 'Energy' && !cat.includes('Energy')) return false;
        if (activeCategoryFilter === 'Water' && !cat.includes('Water')) return false;
        if (activeCategoryFilter === 'Waste' && !cat.includes('Waste')) return false;
        if (activeCategoryFilter === 'Sustainable Lifestyle' && !cat.includes('Lifestyle')) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
        const emptyTitle = emptyState.querySelector('h4');
        const emptyDesc = emptyState.querySelector('p');
        if (activeStatusFilter === 'remaining' && dateHabits.length > 0) {
          if (emptyTitle) emptyTitle.textContent = mode === 'past' ? 'All Habits Were Completed!' : 'All Caught Up for Today!';
          if (emptyDesc) emptyDesc.textContent = mode === 'past' ? 'All tracked habits were completed on this date.' : 'You have completed all active habits for today. Great job sustaining our planet!';
        } else if (activeStatusFilter === 'completed') {
          if (emptyTitle) emptyTitle.textContent = mode === 'past' ? 'No Habits Completed on this Date' : 'No Habits Completed Yet Today';
          if (emptyDesc) emptyDesc.textContent = mode === 'past' ? 'No habits were checked off on this historical day.' : 'Check off habits as you complete them throughout the day to build your streak.';
        } else {
          if (emptyTitle) emptyTitle.textContent = 'No Habits in this Filter';
          if (emptyDesc) emptyDesc.textContent = 'Try adjusting your category filter to view other habits.';
        }
      }
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    const isReadOnly = mode === 'past';

    let html = '';
    filtered.forEach(habit => {
      const isCompleted = completedIds.has(habit.id);
      const catClass = getCategoryClass(habit.category);
      const isCustom = habit.isCustom === true;
      const isFromTip = !!habit.tipId;

      html += `
        <div class="habit-item-card ${isCompleted ? 'completed' : ''} ${isReadOnly ? 'read-only' : ''}" 
             data-habit-id="${habit.id}"
             role="checkbox"
             aria-checked="${isCompleted ? 'true' : 'false'}"
             ${isReadOnly ? 'aria-disabled="true"' : 'tabindex="0"'}>
          <div class="habit-left">
            <div class="habit-checkbox" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="habit-content">
              <div class="habit-meta-row">
                <span class="category-tag ${catClass}">${escapeHtml(habit.category || 'General')}</span>
                ${isCustom ? '<span class="badge-source">Custom</span>' : ''}
                ${isFromTip ? '<span class="badge-source">From Tip</span>' : ''}
                ${isReadOnly ? '<span class="badge-source" style="background: rgba(110,231,183,0.1); color: var(--accent-sage);">Archived</span>' : ''}
              </div>
              <div class="habit-title">${escapeHtml(habit.title)}</div>
            </div>
          </div>
          <div class="habit-right">
            ${(!isReadOnly && (isCustom || isFromTip)) ? `
              <button type="button" 
                      class="btn-delete-habit" 
                      data-delete-id="${habit.id}" 
                      aria-label="Remove habit: ${escapeHtml(habit.title)}"
                      title="Remove habit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Renders the single-card Eco Tips Carousel with 4 daily selected tips
   */
  function renderEcoTipsCarousel() {
    const viewport = document.getElementById('carousel-viewport');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!viewport) return;

    const todayStr = getLocalDateString();
    const todayTips = getTodaySelectedTips(todayStr);

    if (todayTips.length === 0) {
      viewport.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--text-muted);">No eco tips available today.</p>';
      return;
    }

    const existingHabits = hubState.habits;

    // Build 4 Slide Cards (Strictly only ONE active at a time)
    let slidesHtml = '';
    todayTips.forEach((tip, idx) => {
      const isActive = idx === currentTipSlide;
      const habitTitle = tip.habitEquivalent || tip.title;
      const alreadyInHabits = existingHabits.some(
        h => (h.tipId && h.tipId === tip.id) || h.title.trim().toLowerCase() === habitTitle.trim().toLowerCase()
      );
      const catClass = getCategoryClass(tip.category);
      const isHighImpact = (tip.impact || '').toLowerCase().includes('high');

      slidesHtml += `
        <div class="carousel-slide ${isActive ? 'active' : ''}" 
             data-slide-index="${idx}" 
             role="group" 
             aria-roledescription="slide" 
             aria-label="Tip ${idx + 1} of ${todayTips.length}"
             aria-hidden="${isActive ? 'false' : 'true'}">
          <div class="tip-carousel-card">
            <div class="tip-carousel-header">
              <div class="tip-header-meta">
                <span class="category-tag ${catClass}">${escapeHtml(tip.category)}</span>
                <span class="tip-slide-badge">Tip ${idx + 1} of ${todayTips.length}</span>
              </div>
              <span class="tip-impact-badge ${isHighImpact ? 'high' : 'moderate'}">
                ${escapeHtml(tip.impact || 'Practical Action')}
              </span>
            </div>

            <h3 class="tip-carousel-title">${escapeHtml(tip.title)}</h3>
            <p class="tip-carousel-explanation">${escapeHtml(tip.explanation)}</p>

            <div class="tip-carousel-action-box">
              <div class="action-box-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"></path>
                </svg>
              </div>
              <div class="action-box-text">
                <strong style="color: var(--accent-sage);">Recommended Practical Action:</strong>
                <p style="margin: 0.25rem 0 0 0; color: var(--text-ivory);">${escapeHtml(tip.action)}</p>
              </div>
            </div>

            <div class="tip-carousel-footer">
              <div class="tip-footer-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
                <span>Convert this recommendation into a daily trackable routine</span>
              </div>
              <button type="button" 
                      class="btn btn-sm btn-add-habit ${alreadyInHabits ? 'btn-added' : 'btn-primary'}" 
                      data-tip-habit-id="${tip.id}"
                      ${alreadyInHabits ? 'disabled aria-disabled="true"' : ''}>
                ${alreadyInHabits 
                  ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg><span>In Your Habits</span>`
                  : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span>Add as Habit</span>`
                }
              </button>
            </div>
          </div>
        </div>
      `;
    });
    viewport.innerHTML = slidesHtml;

    // Build 4 Indicator Dots
    if (dotsContainer) {
      let dotsHtml = '';
      for (let i = 0; i < todayTips.length; i++) {
        const isActive = i === currentTipSlide;
        dotsHtml += `
          <button type="button" 
                  class="carousel-dot ${isActive ? 'active' : ''}" 
                  role="tab" 
                  aria-selected="${isActive ? 'true' : 'false'}" 
                  data-slide-index="${i}" 
                  aria-label="Go to tip ${i + 1}"></button>
        `;
      }
      dotsContainer.innerHTML = dotsHtml;
    }
  }

  /**
   * Helper to safely escape HTML to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Triggers full render update of the Sustainable Living Hub
   */
  function renderAll() {
    if (typeof document === 'undefined') return;
    renderProgressOverview();
    renderHabitsList();
    renderEcoTipsCarousel();
  }

  // -------------------------------------------------------------------------
  // 9. Event Handlers & User Interaction Wiring
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    if (typeof document === 'undefined') return;

    // A. Habit Checklist Delegation (Toggling & Deleting)
    const habitListContainer = document.getElementById('habit-items-list');
    if (habitListContainer) {
      habitListContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-habit');
        if (deleteBtn) {
          e.stopPropagation();
          const habitId = deleteBtn.getAttribute('data-delete-id');
          if (habitId) deleteHabit(habitId);
          return;
        }

        const card = e.target.closest('.habit-item-card');
        if (card) {
          if (card.classList.contains('read-only')) return;
          const habitId = card.getAttribute('data-habit-id');
          if (habitId) toggleHabitCompletion(habitId);
        }
      });

      habitListContainer.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          const card = e.target.closest('.habit-item-card');
          if (card && e.target === card) {
            if (card.classList.contains('read-only')) return;
            e.preventDefault();
            const habitId = card.getAttribute('data-habit-id');
            if (habitId) toggleHabitCompletion(habitId);
          }
        }
      });
    }

    // B. Status Filter Pills (All / Remaining / Completed)
    const statusPills = document.querySelectorAll('[data-status-filter]');
    statusPills.forEach(pill => {
      pill.addEventListener('click', () => {
        statusPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeStatusFilter = pill.getAttribute('data-status-filter') || 'all';
        renderHabitsList();
      });
    });

    // C. Habit Category Dropdown Filter (Restyled)
    const catSelect = document.getElementById('habit-category-filter');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        activeCategoryFilter = e.target.value;
        renderHabitsList();
      });
    }

    // D. Add Custom Habit Form
    const customForm = document.getElementById('form-add-custom-habit');
    const inputTitle = document.getElementById('input-custom-habit-title');
    const selectCat = document.getElementById('select-custom-habit-cat');
    const errorBox = document.getElementById('custom-habit-error');

    if (customForm) {
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorBox) errorBox.classList.remove('visible');

        const title = inputTitle ? inputTitle.value : '';
        const cat = selectCat ? selectCat.value : 'Sustainable Lifestyle';

        const result = addCustomHabit(title, cat);
        if (result.success) {
          if (inputTitle) inputTitle.value = '';
          if (errorBox) {
            errorBox.textContent = '';
            errorBox.classList.remove('visible');
          }
        } else {
          if (errorBox) {
            errorBox.textContent = result.message || 'Error adding habit.';
            errorBox.classList.add('visible');
          }
        }
      });
    }

    // E. Reset Today's Habits Button
    const btnReset = document.getElementById('btn-reset-today');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (window.confirm('Reset all habit completions for today? Your past streak history remains safe.')) {
          resetTodayHabits();
        }
      });
    }

    // F. Carousel Navigation Controls (Arrows & Dots)
    const btnPrev = document.getElementById('carousel-btn-prev');
    const btnNext = document.getElementById('carousel-btn-next');
    const dotsContainer = document.getElementById('carousel-dots');
    const carouselContainer = document.getElementById('tips-carousel');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        prevTipSlide();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        nextTipSlide();
      });
    }

    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.carousel-dot');
        if (dot) {
          const index = parseInt(dot.getAttribute('data-slide-index'), 10);
          if (!isNaN(index)) goToTipSlide(index);
        }
      });
    }

    // G. Carousel "Add as Habit" Delegation
    if (carouselContainer) {
      carouselContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tip-habit-id]');
        if (btn) {
          const tipId = btn.getAttribute('data-tip-habit-id');
          if (tipId) addTipAsHabit(tipId);
        }
      });

      // Carousel Hover & Focus Listeners for Auto-Slide Pausing
      carouselContainer.addEventListener('mouseenter', () => {
        isCarouselHovered = true;
        stopCarouselAutoTimer('Paused on hover');
      });

      carouselContainer.addEventListener('mouseleave', () => {
        isCarouselHovered = false;
        if (!isCarouselFocused) {
          startCarouselAutoTimer();
        }
      });

      carouselContainer.addEventListener('focusin', () => {
        isCarouselFocused = true;
        stopCarouselAutoTimer('Paused on focus');
      });

      carouselContainer.addEventListener('focusout', (e) => {
        if (!carouselContainer.contains(e.relatedTarget)) {
          isCarouselFocused = false;
          if (!isCarouselHovered) {
            startCarouselAutoTimer();
          }
        }
      });

      // Keyboard navigation on carousel container (Arrow Left / Right)
      carouselContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevTipSlide();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextTipSlide();
        }
      });

      // Mobile Touch / Swipe Navigation
      carouselContainer.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
        }
      }, { passive: true });

      carouselContainer.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchEndX = e.changedTouches[0].clientX;
          const delta = touchEndX - touchStartX;
          if (delta < -45) {
            nextTipSlide(); // Swiped left -> next slide
          } else if (delta > 45) {
            prevTipSlide(); // Swiped right -> prev slide
          }
        }
      }, { passive: true });
    }

    // H. Checklist Date Navigation Controls
    const btnPrevDate = document.getElementById('btn-date-prev');
    const btnNextDate = document.getElementById('btn-date-next');
    const checklistDatePicker = document.getElementById('checklist-date-picker');
    const btnDateToday = document.getElementById('btn-date-today');
    const btnFutureReturn = document.getElementById('btn-future-return-today');
    const btnPastReturn = document.getElementById('btn-past-return-today');

    if (btnPrevDate) {
      btnPrevDate.addEventListener('click', () => {
        changeSelectedDate(getRelativeDateString(selectedViewDate, 1));
      });
    }

    if (btnNextDate) {
      btnNextDate.addEventListener('click', () => {
        changeSelectedDate(getRelativeDateString(selectedViewDate, -1));
      });
    }

    if (checklistDatePicker) {
      checklistDatePicker.addEventListener('change', (e) => {
        if (e.target.value) {
          changeSelectedDate(e.target.value);
        }
      });
    }

    if (btnDateToday) {
      btnDateToday.addEventListener('click', () => {
        changeSelectedDate(getLocalDateString());
      });
    }

    if (btnFutureReturn) {
      btnFutureReturn.addEventListener('click', () => {
        changeSelectedDate(getLocalDateString());
      });
    }

    if (btnPastReturn) {
      btnPastReturn.addEventListener('click', () => {
        changeSelectedDate(getLocalDateString());
      });
    }

    // Start auto-slide rotation
    startCarouselAutoTimer();
  }

  // -------------------------------------------------------------------------
  // 10. Initialization Lifecycle
  // -------------------------------------------------------------------------
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      loadHubState();
      renderAll();
      setupEventListeners();
    });
  }

  // Expose state and API for unit testing & debugging
  if (typeof window !== 'undefined') {
    window.EcoHabits = {
      getState: () => JSON.parse(JSON.stringify(hubState)),
      toggleHabit: toggleHabitCompletion,
      addCustomHabit,
      deleteHabit,
      addTipAsHabit,
      resetToday: resetTodayHabits,
      calculateStreak: calculateStreakAndStats,
      getTodayStr: getLocalDateString,
      getRelativeDate: getRelativeDateString,
      getSelectedViewDate: () => selectedViewDate,
      changeSelectedDate,
      getDateMode,
      getHabitsForDate,
      getDailySelectedHabits: ensureDailyHabitsSelection,
      getTodaySelectedHabits,
      getDailyTipsSelection: ensureDailyTipsSelection,
      getTodaySelectedTips,
      goToTipSlide,
      nextTipSlide,
      prevTipSlide,
      getCurrentTipSlide: () => currentTipSlide,
      startAutoTimer: startCarouselAutoTimer,
      stopAutoTimer: stopCarouselAutoTimer,
      isReducedMotion: isReducedMotionPreferred,
      reloadState: loadHubState,
      _setHabits: (h) => { hubState.habits = h; },
      _setCompletions: (c) => { hubState.completions = c; },
      _setDailySelections: (s) => { hubState.dailySelections = s; }
    };
  }

})();
