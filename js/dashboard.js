/**
 * EcoTrack – Personal Impact Dashboard Controller (Phase 5)
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Features:
 * 1. Footprint Overview:
 *    - Displays latest annual footprint (tonnes CO2e) and monthly rate (kg CO2e).
 *    - Calculation mode badge (Estimated vs Precise) and verified assessment date.
 *    - Recalculate quick action link.
 * 2. Category Breakdown:
 *    - Transportation, Household Energy, Household Waste.
 *    - Emission values (kg CO2e), percentage shares, and responsive progress bars.
 *    - Subcategory shares for Grid Electricity and Domestic LPG within Energy.
 * 3. Habit Progress:
 *    - Today's completed habits vs. today's selected habits with percentage and progress bar.
 *    - Current consecutive-day streak and all-time longest streak.
 *    - Total lifetime habit checkoffs and total registered habits.
 * 4. Historical Footprint Chart:
 *    - Reads genuine chronological history from STORAGE_KEYS.HISTORY.
 *    - Deduplicates identical calculation events defensively.
 *    - Single-calculation baseline mode with clear explanation.
 *    - Multi-point historical trend line via Chart.js with graceful CSS fallback table.
 *    - Zero synthetic or invented data points; no unsupported benchmark comparisons.
 * 5. Recent Activity Feed:
 *    - Chronological log of recent calculation events and recorded habit completions.
 * 6. Independent Empty States:
 *    - Clear, friendly callouts if footprint or habit data is not yet recorded.
 *    - Sections operate completely independently without cross-blocking.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Module State
  // ---------------------------------------------------------------------------
  let footprintData = null;
  let habitsData = null;
  let historyData = [];
  let historyChartInstance = null;

  // DOM Elements Cache
  const elements = {};

  // ---------------------------------------------------------------------------
  // 2. Date & Formatting Helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns user's local date string (YYYY-MM-DD)
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
   * Formats ISO or YYYY-MM-DD date string into human-friendly format
   * @param {string} dateStr 
   * @returns {string}
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Formats number with commas
   * @param {number} num 
   * @returns {string}
   */
  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('en-US');
  }

  // ---------------------------------------------------------------------------
  // 3. Storage Reader & History Synchronization
  // ---------------------------------------------------------------------------

  /**
   * Reads data defensively from EcoStorage
   */
  function loadStorageData() {
    if (typeof EcoStorage === 'undefined' || typeof STORAGE_KEYS === 'undefined') {
      footprintData = null;
      habitsData = null;
      historyData = [];
      return;
    }

    footprintData = EcoStorage.get(STORAGE_KEYS.FOOTPRINT, null);
    habitsData = EcoStorage.get(STORAGE_KEYS.HABITS, null);
    
    const rawHistory = EcoStorage.get(STORAGE_KEYS.HISTORY, []);
    historyData = Array.isArray(rawHistory) ? rawHistory : [];

    // If footprint exists but history is empty, backfill a single history snapshot
    syncHistoryFromFootprint();
  }

  /**
   * Synchronizes latest footprint into history log if not already present
   */
  function syncHistoryFromFootprint() {
    if (!footprintData || !footprintData.totals) return;
    if (typeof EcoStorage === 'undefined' || typeof STORAGE_KEYS === 'undefined') return;

    const timestamp = footprintData.calculatedAt || new Date().toISOString();
    const annualKg = Math.round(footprintData.totals.annualKg * 100) / 100;
    const annualTonnes = Math.round(footprintData.totals.annualTonnes * 100) / 100;
    const mode = footprintData.calculationMode || 'estimated';

    const exists = historyData.some(entry => {
      if (!entry) return false;
      if (entry.timestamp === timestamp) return true;
      if (entry.mode === mode && Math.abs(entry.annualKg - annualKg) < 0.001) return true;
      return false;
    });

    if (!exists) {
      const transportKg = footprintData.breakdown && footprintData.breakdown.transport
        ? Math.round(footprintData.breakdown.transport.annualKg * 100) / 100 : 0;
      const energyKg = footprintData.breakdown && footprintData.breakdown.energy
        ? Math.round(footprintData.breakdown.energy.annualKg * 100) / 100 : 0;
      const wasteKg = footprintData.breakdown && footprintData.breakdown.waste
        ? Math.round(footprintData.breakdown.waste.annualKg * 100) / 100 : 0;
      const elecKg = footprintData.breakdown && footprintData.breakdown.energy && footprintData.breakdown.energy.electricity
        ? Math.round(footprintData.breakdown.energy.electricity.annualKg * 100) / 100 : 0;
      const lpgKg = footprintData.breakdown && footprintData.breakdown.energy && footprintData.breakdown.energy.lpg
        ? Math.round(footprintData.breakdown.energy.lpg.annualKg * 100) / 100 : 0;

      const snapshot = {
        id: 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: timestamp,
        calculationMode: mode,
        mode: mode,
        annualKg: annualKg,
        annualTonnes: annualTonnes,
        categoryBreakdown: {
          transport: transportKg,
          energy: energyKg,
          waste: wasteKg,
          electricity: elecKg,
          lpg: lpgKg
        },
        breakdown: {
          transport: transportKg,
          energy: energyKg,
          waste: wasteKg,
          electricity: elecKg,
          lpg: lpgKg
        }
      };

      historyData.push(snapshot);
      EcoStorage.set(STORAGE_KEYS.HISTORY, historyData);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Rendering: Footprint Overview & Categories
  // ---------------------------------------------------------------------------

  function renderFootprintSection() {
    const hasFootprint = Boolean(footprintData && footprintData.totals);

    if (elements.footprintContent) {
      elements.footprintContent.style.display = hasFootprint ? '' : 'none';
    }
    if (elements.footprintEmptyState) {
      elements.footprintEmptyState.style.display = hasFootprint ? 'none' : 'block';
    }

    if (!hasFootprint) return;

    const { totals, breakdown, calculationMode, calculatedAt } = footprintData;

    // Totals
    if (elements.footprintAnnualTonnes) {
      elements.footprintAnnualTonnes.textContent = (totals.annualTonnes || 0).toFixed(2);
    }
    if (elements.footprintMonthlyKg) {
      elements.footprintMonthlyKg.textContent = formatNumber(totals.monthlyKg || 0);
    }

    // Calculation Mode Badge
    if (elements.footprintModeBadge) {
      const isPrecise = calculationMode === 'precise';
      elements.footprintModeBadge.textContent = isPrecise ? 'Precise Mode' : 'Estimated Mode';
      elements.footprintModeBadge.className = isPrecise 
        ? 'footprint-mode-badge badge-mode-precise' 
        : 'footprint-mode-badge badge-mode-estimated';
    }

    // Calculation Date
    if (elements.footprintDate) {
      elements.footprintDate.textContent = `Calculated on ${formatDisplayDate(calculatedAt)}`;
    }

    // Category Breakdown
    if (breakdown) {
      // 1. Transportation
      if (breakdown.transport) {
        if (elements.breakdownTransportKg) {
          elements.breakdownTransportKg.textContent = `${formatNumber(breakdown.transport.annualKg)} kg`;
        }
        const transPct = Math.round(breakdown.transport.percentage || 0);
        if (elements.breakdownTransportPct) {
          elements.breakdownTransportPct.textContent = `${transPct}%`;
        }
        if (elements.breakdownTransportBar) {
          elements.breakdownTransportBar.style.width = `${Math.min(100, Math.max(0, transPct))}%`;
        }
      }

      // 2. Household Energy
      if (breakdown.energy) {
        if (elements.breakdownEnergyKg) {
          elements.breakdownEnergyKg.textContent = `${formatNumber(breakdown.energy.annualKg)} kg`;
        }
        const energyPct = Math.round(breakdown.energy.percentage || 0);
        if (elements.breakdownEnergyPct) {
          elements.breakdownEnergyPct.textContent = `${energyPct}%`;
        }
        if (elements.breakdownEnergyBar) {
          elements.breakdownEnergyBar.style.width = `${Math.min(100, Math.max(0, energyPct))}%`;
        }

        // Subcategories: Electricity & LPG
        if (breakdown.energy.electricity && elements.subcatElectricityVal) {
          const elecKg = formatNumber(breakdown.energy.electricity.annualKg);
          const elecSubPct = Math.round(breakdown.energy.electricity.percentageOfEnergy || 0);
          elements.subcatElectricityVal.textContent = `${elecKg} kg (${elecSubPct}% of energy)`;
        }

        if (breakdown.energy.lpg && elements.subcatLpgVal) {
          const lpgKg = formatNumber(breakdown.energy.lpg.annualKg);
          const lpgSubPct = Math.round(breakdown.energy.lpg.percentageOfEnergy || 0);
          elements.subcatLpgVal.textContent = `${lpgKg} kg (${lpgSubPct}% of energy)`;
        }
      }

      // 3. Household Waste
      if (breakdown.waste) {
        if (elements.breakdownWasteKg) {
          elements.breakdownWasteKg.textContent = `${formatNumber(breakdown.waste.annualKg)} kg`;
        }
        const wastePct = Math.round(breakdown.waste.percentage || 0);
        if (elements.breakdownWastePct) {
          elements.breakdownWastePct.textContent = `${wastePct}%`;
        }
        if (elements.breakdownWasteBar) {
          elements.breakdownWasteBar.style.width = `${Math.min(100, Math.max(0, wastePct))}%`;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Rendering: Habit Progress & Streaks
  // ---------------------------------------------------------------------------

  function renderHabitsSection() {
    const hasHabits = Boolean(
      habitsData && 
      Array.isArray(habitsData.habits) && 
      habitsData.habits.length > 0
    );

    const hasAnyCompletions = Boolean(
      habitsData &&
      habitsData.completions &&
      Object.keys(habitsData.completions).some(k => Array.isArray(habitsData.completions[k]) && habitsData.completions[k].length > 0)
    );

    // If no habits and no completions exist, display empty state
    if (elements.habitsContent) {
      elements.habitsContent.style.display = (hasHabits || hasAnyCompletions) ? 'block' : 'none';
    }
    if (elements.habitsEmptyState) {
      elements.habitsEmptyState.style.display = (hasHabits || hasAnyCompletions) ? 'none' : 'block';
    }

    if (!hasHabits && !hasAnyCompletions) return;

    const todayStr = getLocalDateString();
    const todayCompleted = (habitsData.completions && Array.isArray(habitsData.completions[todayStr]))
      ? habitsData.completions[todayStr].length
      : 0;

    // Today's selected habit count (defaults to 5 or available pool)
    let todaySelectedCount = 5;
    if (habitsData.dailySelections && Array.isArray(habitsData.dailySelections[todayStr]) && habitsData.dailySelections[todayStr].length > 0) {
      todaySelectedCount = habitsData.dailySelections[todayStr].length;
    } else if (Array.isArray(habitsData.habits)) {
      todaySelectedCount = Math.min(5, Math.max(1, habitsData.habits.length));
    }

    const todayPct = todaySelectedCount > 0 ? Math.round((todayCompleted / todaySelectedCount) * 100) : 0;

    // Habit Metric Displays
    if (elements.habitTodayCount) {
      elements.habitTodayCount.textContent = `${todayCompleted} of ${todaySelectedCount}`;
    }
    if (elements.habitTodayPct) {
      elements.habitTodayPct.textContent = `${todayPct}%`;
    }
    if (elements.habitTodayBar) {
      elements.habitTodayBar.style.width = `${Math.min(100, Math.max(0, todayPct))}%`;
    }

    // Streak stats
    const stats = habitsData.stats || {};
    const currentStreak = typeof stats.currentStreak === 'number' ? stats.currentStreak : 0;
    const longestStreak = typeof stats.longestStreak === 'number' ? stats.longestStreak : currentStreak;
    const totalCompletions = typeof stats.totalCompletions === 'number' ? stats.totalCompletions : 0;
    const totalRegistered = Array.isArray(habitsData.habits) ? habitsData.habits.length : 0;

    if (elements.habitCurrentStreak) {
      elements.habitCurrentStreak.textContent = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
    }
    if (elements.habitLongestStreak) {
      elements.habitLongestStreak.textContent = `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`;
    }
    if (elements.habitTotalCompletions) {
      elements.habitTotalCompletions.textContent = formatNumber(totalCompletions);
    }
    if (elements.habitTotalRegistered) {
      elements.habitTotalRegistered.textContent = `${totalRegistered} ${totalRegistered === 1 ? 'habit' : 'habits'}`;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Rendering: Historical Footprint Chart
  // ---------------------------------------------------------------------------

  function renderHistorySection() {
    const hasHistory = Array.isArray(historyData) && historyData.length > 0;

    if (elements.historyContent) {
      elements.historyContent.style.display = hasHistory ? 'block' : 'none';
    }
    if (elements.historyEmptyState) {
      elements.historyEmptyState.style.display = hasHistory ? 'none' : 'block';
    }

    if (!hasHistory) return;

    // Deduplicate history entries by timestamp
    const cleanHistory = [];
    const seenTimestamps = new Set();
    historyData.forEach(entry => {
      if (!entry || !entry.timestamp) return;
      if (!seenTimestamps.has(entry.timestamp)) {
        seenTimestamps.add(entry.timestamp);
        cleanHistory.push(entry);
      }
    });

    // Sort chronologically ascending
    cleanHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Single calculation note
    const isSingle = cleanHistory.length === 1;
    if (elements.historySingleNote) {
      elements.historySingleNote.style.display = isSingle ? 'flex' : 'none';
    }

    // Render Chart.js line chart or pure-CSS fallback table
    renderHistoryChart(cleanHistory);
    renderFallbackTable(cleanHistory);
  }

  function renderFallbackTable(records) {
    if (!elements.historyFallbackBody) return;
    elements.historyFallbackBody.innerHTML = '';

    records.forEach(rec => {
      const tr = document.createElement('tr');
      const dateStr = formatDisplayDate(rec.timestamp);
      const modeLabel = rec.mode === 'precise' || rec.calculationMode === 'precise' ? 'Precise' : 'Estimated';
      const tonnesStr = (rec.annualTonnes || (rec.annualKg ? rec.annualKg / 1000 : 0)).toFixed(2);
      const kgStr = formatNumber(rec.annualKg || 0);

      tr.innerHTML = `
        <td><strong>${dateStr}</strong></td>
        <td><span class="badge ${modeLabel === 'Precise' ? 'badge-emerald' : 'badge-lime'}">${modeLabel}</span></td>
        <td><strong>${tonnesStr} t</strong> (${kgStr} kg CO₂e)</td>
      `;
      elements.historyFallbackBody.appendChild(tr);
    });
  }

  function destroyHistoryChart() {
    if (historyChartInstance) {
      try {
        historyChartInstance.destroy();
      } catch (e) {}
      historyChartInstance = null;
    }
  }

  function renderSvgHistoryChart(container, records) {
    if (!container || !records || records.length === 0) return;

    const width = 760;
    const height = 280;
    const padLeft = 60;
    const padRight = 40;
    const padTop = 35;
    const padBottom = 45;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const values = records.map(r => {
      if (typeof r.annualTonnes === 'number') return r.annualTonnes;
      if (typeof r.annualKg === 'number') return Math.round((r.annualKg / 1000) * 100) / 100;
      return 0;
    });

    const maxVal = Math.max(...values, 0.5);
    const yMax = Math.ceil(maxVal * 1.25 * 10) / 10;
    const ySteps = 4;

    // Grid lines & Y labels
    let gridHtml = '';
    for (let i = 0; i <= ySteps; i++) {
      const val = (yMax * (ySteps - i)) / ySteps;
      const y = padTop + (chartH * i) / ySteps;
      gridHtml += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(110, 231, 183, 0.08)" stroke-width="1" stroke-dasharray="${i === ySteps ? 'none' : '4,4'}" />
        <text x="${padLeft - 10}" y="${y + 4}" fill="#7e998c" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" text-anchor="end">${val.toFixed(1)} t</text>
      `;
    }

    // Coordinates
    const points = records.map((r, i) => {
      const val = values[i];
      const x = records.length === 1
        ? padLeft + chartW / 2
        : padLeft + (chartW * i) / (records.length - 1);
      const y = padTop + chartH - (val / yMax) * chartH;
      const label = formatDisplayDate(r.timestamp);
      return { x, y, val, label, mode: r.mode || r.calculationMode || 'estimated' };
    });

    // X-axis date labels
    let xLabelsHtml = '';
    points.forEach(pt => {
      xLabelsHtml += `
        <text x="${pt.x}" y="${height - 15}" fill="#7e998c" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" text-anchor="middle">${pt.label}</text>
      `;
    });

    // Paths
    let pathD = '';
    let areaD = '';
    if (points.length === 1) {
      pathD = `M ${padLeft} ${points[0].y} L ${width - padRight} ${points[0].y}`;
      areaD = `M ${padLeft} ${points[0].y} L ${width - padRight} ${points[0].y} L ${width - padRight} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`;
    } else {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) * 0.45;
        const cpY1 = prev.y;
        const cpX2 = curr.x - (curr.x - prev.x) * 0.45;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
      areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
    }

    // Data dots
    let dotsHtml = '';
    points.forEach(pt => {
      const r = records.length === 1 ? 8 : 6;
      dotsHtml += `
        <g class="svg-chart-point" tabindex="0" role="graphics-symbol" aria-label="${pt.val.toFixed(2)} tonnes on ${pt.label}">
          <circle cx="${pt.x}" cy="${pt.y}" r="${r + 4}" fill="rgba(163, 230, 53, 0.2)" class="point-glow" />
          <circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="#a3e635" stroke="#061610" stroke-width="2.5" />
          <title>${pt.val.toFixed(2)} tonnes CO₂e (${pt.label})</title>
        </g>
      `;
    });

    // Baseline badge
    let baselineBadge = '';
    if (records.length === 1) {
      const pt = points[0];
      baselineBadge = `
        <rect x="${pt.x - 70}" y="${pt.y - 32}" width="140" height="22" rx="4" fill="#061610" stroke="#10b981" stroke-width="1" />
        <text x="${pt.x}" y="${pt.y - 17}" fill="#a3e635" font-size="11" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif" text-anchor="middle">Baseline: ${pt.val.toFixed(2)} t CO₂e</text>
      `;
    }

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="history-svg-chart" role="img" aria-label="Historical Carbon Footprint Trend Chart" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="svgTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <g class="svg-grid">${gridHtml}</g>
        <path d="${areaD}" fill="url(#svgTrendAreaGrad)" />
        <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="${records.length === 1 ? '2' : '3'}" stroke-linecap="round" stroke-linejoin="round" ${records.length === 1 ? 'stroke-dasharray="4,4"' : ''} />
        ${baselineBadge}
        <g class="svg-dots">${dotsHtml}</g>
        <g class="svg-x-labels">${xLabelsHtml}</g>
      </svg>
    `;

    container.innerHTML = svg;
  }

  function renderHistoryChart(records) {
    const root = getDashboardContainer();
    if (!root) return;

    const q = (id) => (root.querySelector ? root.querySelector('#' + id) : document.getElementById(id));
    const container = q('history-chart-wrapper');
    const fallback = q('history-fallback-wrapper');

    if (!container) return;

    const hasChartJs = typeof Chart !== 'undefined';

    if (hasChartJs) {
      let canvas = container.querySelector('canvas#historyChart');
      if (!canvas) {
        container.innerHTML = '<canvas id="historyChart" aria-label="Historical Carbon Footprint Chart"></canvas>';
        canvas = container.querySelector('canvas#historyChart');
      }

      // Destroy previous chart if canvas changed or detached
      if (historyChartInstance && (historyChartInstance.canvas !== canvas || !historyChartInstance.canvas.isConnected)) {
        destroyHistoryChart();
      }

      if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          try { existingChart.destroy(); } catch (e) {}
        }
      }

      container.style.display = 'block';
      if (fallback) fallback.style.display = 'none';

      const labels = records.map(r => formatDisplayDate(r.timestamp));
      const dataPoints = records.map(r => {
        if (typeof r.annualTonnes === 'number') return r.annualTonnes;
        if (typeof r.annualKg === 'number') return Math.round((r.annualKg / 1000) * 100) / 100;
        return 0;
      });

      if (historyChartInstance && historyChartInstance.canvas === canvas) {
        historyChartInstance.data.labels = labels;
        historyChartInstance.data.datasets[0].data = dataPoints;
        historyChartInstance.update();
        return;
      }

      try {
        const ctx = canvas.getContext('2d');
        historyChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Annual Footprint (tonnes CO₂e)',
              data: dataPoints,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#a3e635',
              pointBorderColor: '#061610',
              pointBorderWidth: 2,
              pointRadius: records.length === 1 ? 8 : 5,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#061610',
                borderColor: '#245443',
                borderWidth: 1,
                titleColor: '#fbf8ee',
                bodyColor: '#a3e635',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: function (context) {
                    return ` ${context.parsed.y.toFixed(2)} tonnes CO₂e / year`;
                  }
                }
              }
            },
            scales: {
              x: {
                offset: records.length === 1,
                grid: {
                  color: 'rgba(110, 231, 183, 0.08)'
                },
                ticks: {
                  color: '#7e998c',
                  font: { family: 'Plus Jakarta Sans', size: 12 }
                }
              },
              y: {
                beginAtZero: true,
                suggestedMax: Math.max(...dataPoints, 1) * 1.25,
                grid: {
                  color: 'rgba(110, 231, 183, 0.08)'
                },
                ticks: {
                  color: '#7e998c',
                  font: { family: 'Plus Jakarta Sans', size: 12 },
                  callback: function (val) {
                    return `${val} t`;
                  }
                }
              }
            }
          }
        });
        return;
      } catch (e) {
        console.warn('[EcoDashboard] Chart.js initialization error, falling back to SVG chart:', e);
      }
    }

    // Fallback: If Chart.js is unavailable or throws, render standalone Dark Botanical SVG Trend Chart
    container.style.display = 'block';
    renderSvgHistoryChart(container, records);
    if (fallback) fallback.style.display = 'block';
  }

  // ---------------------------------------------------------------------------
  // 7. Rendering: Recent Activity Feed
  // ---------------------------------------------------------------------------

  function renderRecentActivity() {
    if (!elements.activityList) return;

    const activities = [];

    // 1. Footprint Calculation Event
    if (footprintData && footprintData.calculatedAt) {
      const modeLabel = footprintData.calculationMode === 'precise' ? 'Precise Mode' : 'Estimated Mode';
      const tonnes = footprintData.totals ? footprintData.totals.annualTonnes.toFixed(2) : '0';
      activities.push({
        type: 'calculator',
        timestamp: footprintData.calculatedAt,
        title: `Carbon Footprint Assessed (${modeLabel})`,
        desc: `Evaluated annual footprint at ${tonnes} tonnes CO₂e across Transportation, Energy, and Waste.`,
        dateLabel: formatDisplayDate(footprintData.calculatedAt)
      });
    }

    // 2. Habit Completion Days
    if (habitsData && habitsData.completions && typeof habitsData.completions === 'object') {
      const completionDates = Object.keys(habitsData.completions)
        .filter(d => Array.isArray(habitsData.completions[d]) && habitsData.completions[d].length > 0)
        .sort()
        .reverse();

      // Take up to 5 most recent active days
      completionDates.slice(0, 5).forEach(dateStr => {
        const count = habitsData.completions[dateStr].length;
        activities.push({
          type: 'habit',
          timestamp: dateStr,
          title: `Completed ${count} Sustainable ${count === 1 ? 'Habit' : 'Habits'}`,
          desc: `Maintained daily green commitment in the Sustainable Living Hub.`,
          dateLabel: formatDisplayDate(dateStr)
        });
      });
    }

    // Sort all activities chronologically descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    elements.activityList.innerHTML = '';

    if (activities.length === 0) {
      elements.activityList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.925rem;">
          No recent activity logged yet. Calculate your footprint or check off a daily habit to begin your activity timeline.
        </div>
      `;
      return;
    }

    activities.slice(0, 6).forEach(act => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const isCalc = act.type === 'calculator';
      const iconSvg = isCalc
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

      item.innerHTML = `
        <div class="activity-icon ${isCalc ? 'activity-icon-calc' : 'activity-icon-habit'}" aria-hidden="true">
          ${iconSvg}
        </div>
        <div class="activity-body">
          <div class="activity-title">${act.title}</div>
          <div class="activity-desc">${act.desc}</div>
        </div>
        <div class="activity-date">${act.dateLabel}</div>
      `;
      elements.activityList.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------------
  // 8. DOM Caching & Init Lifecycle
  // ---------------------------------------------------------------------------

  function getDashboardContainer() {
    return (typeof document !== 'undefined')
      ? (document.getElementById('incoming-page-view') || document.getElementById('current-page-view') || document)
      : null;
  }

  function cacheDomElements() {
    const root = getDashboardContainer();
    if (!root) return;

    const q = (id) => (root.querySelector ? root.querySelector('#' + id) : document.getElementById(id));

    // Footprint section
    elements.footprintContent = q('footprint-content');
    elements.footprintEmptyState = q('footprint-empty-state');
    elements.footprintAnnualTonnes = q('dash-footprint-tonnes');
    elements.footprintMonthlyKg = q('dash-footprint-monthly');
    elements.footprintModeBadge = q('dash-mode-badge');
    elements.footprintDate = q('dash-calc-date');

    // Category breakdown
    elements.breakdownTransportKg = q('dash-trans-kg');
    elements.breakdownTransportPct = q('dash-trans-pct');
    elements.breakdownTransportBar = q('dash-trans-bar');

    elements.breakdownEnergyKg = q('dash-energy-kg');
    elements.breakdownEnergyPct = q('dash-energy-pct');
    elements.breakdownEnergyBar = q('dash-energy-bar');
    elements.subcatElectricityVal = q('dash-subcat-elec');
    elements.subcatLpgVal = q('dash-subcat-lpg');

    elements.breakdownWasteKg = q('dash-waste-kg');
    elements.breakdownWastePct = q('dash-waste-pct');
    elements.breakdownWasteBar = q('dash-waste-bar');

    // Habits section
    elements.habitsContent = q('habits-content');
    elements.habitsEmptyState = q('habits-empty-state');
    elements.habitTodayCount = q('dash-habit-today-count');
    elements.habitTodayPct = q('dash-habit-today-pct');
    elements.habitTodayBar = q('dash-habit-today-bar');
    elements.habitCurrentStreak = q('dash-habit-current-streak');
    elements.habitLongestStreak = q('dash-habit-longest-streak');
    elements.habitTotalCompletions = q('dash-habit-total-completions');
    elements.habitTotalRegistered = q('dash-habit-total-registered');

    // History section
    elements.historyContent = q('history-content');
    elements.historyEmptyState = q('history-empty-state');
    elements.historySingleNote = q('history-single-note');
    elements.historyFallbackBody = q('history-fallback-body');
    elements.historyChartWrapper = q('history-chart-wrapper');
    elements.historyFallbackWrapper = q('history-fallback-wrapper');

    // Activity feed
    elements.activityList = q('dash-activity-list');
  }

  function renderAll() {
    renderFootprintSection();
    renderHabitsSection();
    renderHistorySection();
    renderRecentActivity();
  }

  function init() {
    cacheDomElements();
    loadStorageData();
    renderAll();
  }

  // Run on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Expose API for testing and programmatic updates
  if (typeof window !== 'undefined') {
    window.EcoDashboard = {
      init,
      loadStorageData,
      renderAll,
      renderFootprint: renderFootprintSection,
      renderHabits: renderHabitsSection,
      renderHistory: renderHistorySection,
      renderActivity: renderRecentActivity,
      destroyChart: destroyHistoryChart,
      syncHistoryFromFootprint,
      getFootprintData: () => footprintData,
      getHabitsData: () => habitsData,
      getHistoryData: () => historyData,
      _setFootprintData: (d) => { footprintData = d; },
      _setHabitsData: (h) => { habitsData = h; },
      _setHistoryData: (arr) => { historyData = arr; }
    };
  }

})();
