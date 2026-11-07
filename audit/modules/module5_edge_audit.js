/**
 * EcoTrack Master Audit Runner - Module 5: Microsoft Edge Cross-Browser Interactive Audit
 * Audits page crawl, live calculator interaction, slider navigation, mobile/desktop overflow on Edge.
 */

const path = require('path');
const { createBrowser, closeBrowser } = require('../lib/browser_launcher');
const { CDPClient } = require('../lib/cdp_client');
const { SCREENSHOT_DIR } = require('../lib/reporter');

const LIVE_BASE_URL = 'https://aflahazeez.github.io/EcoTrack';

const EDGE_PAGES = [
  'index.html',
  'calculator.html',
  'habits.html',
  'tips.html',
  'dashboard.html'
];

async function runEdgeAudit(reporter) {
  console.log('\n============================================================');
  console.log('MODULE 5: MICROSOFT EDGE CROSS-BROWSER INTERACTIVE AUDIT');
  console.log('============================================================\n');

  const edgeInstance = createBrowser('edge', 9223);
  if (!edgeInstance.isAvailable()) {
    reporter.record('Module 5: Edge Audit', 'Microsoft Edge Executable Availability', 'SKIPPED', 'msedge.exe not found on system path');
    return;
  }

  let cdp = null;

  try {
    console.log('  Launching isolated Microsoft Edge instance on port 9223...');
    await edgeInstance.launch();
    cdp = new CDPClient(9223);
    await cdp.connect();
    console.log('  Connected to Microsoft Edge over CDP.\n');

    reporter.record('Module 5: Edge Audit', 'Microsoft Edge CDP Engine Launch & Handshake', 'PASS');

    // 1. 5-Page Crawl on Edge
    for (const page of EDGE_PAGES) {
      try {
        await cdp.navigate(`${LIVE_BASE_URL}/${page}`);
        const title = await cdp.evaluate('document.title');
        const hasContent = await cdp.evaluate('document.body.innerText.length > 50');
        const pass = title.includes('EcoTrack') && hasContent;

        reporter.record(
          'Module 5: Edge Audit',
          `Edge Page Load: ${page}`,
          pass ? 'PASS' : 'FAIL',
          { title, hasContent }
        );
      } catch (err) {
        reporter.record('Module 5: Edge Audit', `Edge Page Load: ${page}`, 'FAIL', err.message);
      }
    }

    // 2. Edge Interactive Calculator Verification
    try {
      await cdp.setViewport(1440, 900);
      await cdp.navigate(`${LIVE_BASE_URL}/calculator.html`);

      // Run an interactive calculation on Edge
      const calcResult = await cdp.evaluate(`
        (() => {
          if (!window.EcoCalculator) return { error: 'No EcoCalculator global' };
          const sampleInput = {
            transportMethod: 'petrolCar',
            distanceRange: 'moderate',
            travelFrequency: 'daily',
            householdSize: '3_4',
            electricityLevel: 'moderate',
            lpgRefill: 'everyThreeMonths',
            lpgSize: '14.2',
            wasteGen: 'moderate',
            wastePractice: 'regularRecycling'
          };
          const norm = window.EcoCalculator.normalizeEstimatedInputs(sampleInput);
          const res = window.EcoCalculator.calculate(norm);
          return {
            tonnes: res.totals.annualTonnes,
            hasBreakdown: !!res.breakdown
          };
        })()
      `);

      const calcPass = calcResult && calcResult.tonnes > 0 && calcResult.hasBreakdown;
      reporter.record(
        'Module 5: Edge Audit',
        'Edge Interactive Calculator: Calculation Model Execution',
        calcPass ? 'PASS' : 'FAIL',
        calcResult
      );

      // Capture desktop calculator screenshot on Edge
      const edgeCalcShot = path.join(SCREENSHOT_DIR, 'edge_calculator_desktop_1440.png');
      await cdp.captureScreenshot(edgeCalcShot);
      reporter.recordScreenshot('edge_calculator_desktop_1440.png', 'Edge Desktop Calculator View', '1440x900');

    } catch (err) {
      reporter.record('Module 5: Edge Audit', 'Edge Interactive Calculator', 'FAIL', err.message);
    }

    // 3. Edge Slider Navigation Engine DOM Parity Verification
    try {
      const sliderResult = await cdp.evaluate(`
        (() => {
          const viewport = document.getElementById('page-slider-viewport') || document.querySelector('.page-slider-viewport');
          const panel = document.getElementById('current-page-view') || document.querySelector('.page-view-panel');
          const viewsRegistry = window.ECO_VIEWS && Object.keys(window.ECO_VIEWS).length >= 5;
          const hasSlider = !!viewport && !!panel && !!viewsRegistry;
          return {
            hasSlider,
            hasViewport: !!viewport,
            hasPanel: !!panel,
            viewsCount: window.ECO_VIEWS ? Object.keys(window.ECO_VIEWS).length : 0
          };
        })()
      `);
      reporter.record(
        'Module 5: Edge Audit',
        'Edge Slider Navigation Engine DOM Parity',
        sliderResult.hasSlider ? 'PASS' : 'FAIL',
        sliderResult
      );
    } catch (err) {
      reporter.record('Module 5: Edge Audit', 'Edge Slider Navigation', 'FAIL', err.message);
    }

    // 4. Edge Responsive Layout & Overflow Audit (Desktop & Mobile)
    const edgeViewports = [
      { name: 'Edge Desktop', width: 1440, height: 900 },
      { name: 'Edge Mobile', width: 390, height: 844 }
    ];

    for (const evp of edgeViewports) {
      await cdp.setViewport(evp.width, evp.height);
      await cdp.navigate(`${LIVE_BASE_URL}/index.html`);

      const overflowCheck = await cdp.evaluate(`
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
          const clientW = window.innerWidth;
          return { scrollW, clientW, noOverflow: scrollW <= (clientW + 1) };
        })()
      `);

      reporter.record(
        'Module 5: Edge Audit',
        `Edge Zero Horizontal Overflow at ${evp.width}px (${evp.name})`,
        overflowCheck.noOverflow ? 'PASS' : 'FAIL',
        overflowCheck
      );

      if (evp.width === 390) {
        const edgeMobShot = path.join(SCREENSHOT_DIR, 'edge_index_mobile_390.png');
        await cdp.captureScreenshot(edgeMobShot);
        reporter.recordScreenshot('edge_index_mobile_390.png', 'Edge Mobile Responsive View', '390x844');
      }
    }

    // 5. Edge Console & Network Health
    const edgeErrors = cdp.consoleLogs.filter(c => c.level === 'error' && !c.text.includes('net::ERR_ABORTED'));
    reporter.record(
      'Module 5: Edge Audit',
      'Edge Zero JavaScript Console Errors',
      edgeErrors.length === 0 ? 'PASS' : 'FAIL',
      { errorCount: edgeErrors.length, errors: edgeErrors }
    );

  } catch (err) {
    reporter.record('Module 5: Edge Audit', 'Microsoft Edge Test Pipeline', 'FAIL', err.message);
  } finally {
    if (cdp) cdp.close();
    await closeBrowser(edgeInstance);
    console.log('  Microsoft Edge instance terminated and temporary profile cleaned.');
  }
}

module.exports = { runEdgeAudit };
