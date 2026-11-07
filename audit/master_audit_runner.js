/**
 * EcoTrack Master Automated Audit Runner
 *
 * Orchestrates the complete end-to-end audit:
 * 1. Module 1: Core Regression Unit Suites (574 tests)
 * 2. Module 2: Chrome Live Responsive & Visual Audit (5 pages, 7 viewports, 14 screenshots)
 * 3. Module 3: Interactive Lifecycle (Habits toggle/create/delete, dashboard sync, keyboard ARIA)
 * 4. Module 4: Carbon Calculator Implementation Consistency (125 test vectors vs independent reference engine)
 * 5. Module 5: Microsoft Edge Cross-Browser Audit (5 pages, calculator interaction, slider navigation, mobile/desktop overflow)
 * 6. Module 6: Performance & Client Security Audit (Navigation timing, zero-cookie privacy)
 *
 * Generates unified final submission evidence in final_submission_audit/
 */

const { AuditReporter, REPORT_DIR } = require('./lib/reporter');
const { createBrowser, closeBrowser } = require('./lib/browser_launcher');
const { CDPClient } = require('./lib/cdp_client');

const { runRegressionSuites } = require('./modules/module1_regression');
const { runChromeAudit } = require('./modules/module2_chrome_audit');
const { runInteractiveAudit } = require('./modules/module3_interactive');
const { runCalculatorMathAudit } = require('./modules/module4_calculator_math');
const { runEdgeAudit } = require('./modules/module5_edge_audit');
const { runPerformanceAndSecurityAudit } = require('./modules/module6_perf_security');

async function main() {
  console.log('======================================================================');
  console.log('🚀 ECOTRACK MASTER AUTOMATED AUDIT RUNNER');
  console.log('Target Live URL: https://aflahazeez.github.io/EcoTrack/');
  console.log(`Output Directory: ${REPORT_DIR}`);
  console.log('Start Time: ' + new Date().toISOString());
  console.log('======================================================================\n');

  const reporter = new AuditReporter();

  // STAGE 1: Offline Unit Regression Suites (574 tests)
  try {
    await runRegressionSuites(reporter);
  } catch (err) {
    reporter.record('Master Runner', 'Module 1 Regression Pipeline', 'FAIL', err.message);
  }

  // STAGE 2: Chrome Live Browser Tests (Modules 2, 3, 4, 6)
  let chromeInstance = null;
  let chromeCdp = null;

  try {
    console.log('\n[Chrome Lifecycle] Launching isolated headless Chrome instance on port 9222...');
    chromeInstance = createBrowser('chrome', 9222);
    await chromeInstance.launch();

    chromeCdp = new CDPClient(9222);
    await chromeCdp.connect();
    console.log('[Chrome Lifecycle] Connected to Chrome over CDP.\n');

    // Module 2: Live Chrome Visual, Responsive & Network
    try {
      await runChromeAudit(chromeCdp, reporter);
    } catch (err) {
      reporter.record('Master Runner', 'Module 2 Chrome Audit Pipeline', 'FAIL', err.message);
    }

    // Module 3: Interactive Lifecycle & Accessibility
    try {
      await runInteractiveAudit(chromeCdp, reporter);
    } catch (err) {
      reporter.record('Master Runner', 'Module 3 Interactive Lifecycle Pipeline', 'FAIL', err.message);
    }

    // Module 4: Calculator Implementation Consistency (125 vectors)
    try {
      await runCalculatorMathAudit(chromeCdp, reporter);
    } catch (err) {
      reporter.record('Master Runner', 'Module 4 Calculator Math Pipeline', 'FAIL', err.message);
    }

    // Module 6: Performance & Client Security
    try {
      await runPerformanceAndSecurityAudit(chromeCdp, reporter);
    } catch (err) {
      reporter.record('Master Runner', 'Module 6 Perf & Security Pipeline', 'FAIL', err.message);
    }

  } catch (err) {
    reporter.record('Master Runner', 'Chrome Testing Stage Initialization', 'FAIL', err.message);
  } finally {
    if (chromeCdp) chromeCdp.close();
    if (chromeInstance) {
      await closeBrowser(chromeInstance);
      console.log('\n[Chrome Lifecycle] Chrome instance terminated and temporary profile deleted.');
    }
  }

  // STAGE 3: Microsoft Edge Cross-Browser Interactive Testing (Module 5)
  try {
    await runEdgeAudit(reporter);
  } catch (err) {
    reporter.record('Master Runner', 'Module 5 Edge Audit Pipeline', 'FAIL', err.message);
  }

  // STAGE 4: Synthesis & Final Submission Report Generation
  console.log('\n======================================================================');
  console.log('📑 SYNTHESIZING MASTER AUDIT EVIDENCE...');
  console.log('======================================================================\n');

  const { reportPath, csvPath } = reporter.generateReport();
  const summary = reporter.results.totals;

  console.log('Master Audit Report Generated: ' + reportPath);
  console.log('Calculator CSV Generated:     ' + csvPath);
  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL CHECKS: ${summary.total}`);
  console.log(`PASSED:       ${summary.passed}`);
  console.log(`FAILED:       ${summary.failed}`);
  console.log(`SKIPPED:      ${summary.skipped}`);
  console.log('----------------------------------------------------------------------\n');

  if (summary.failed === 0) {
    console.log('✅ ALL AUDIT MODULES COMPLETED SUCCESSFULLY. 100% READY FOR SUBMISSION.\n');
    process.exit(0);
  } else {
    console.error(`❌ AUDIT COMPLETED WITH ${summary.failed} FAILED CHECKS. See report for details.\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('FATAL MASTER RUNNER ERROR:', err);
    process.exit(1);
  });
}

module.exports = { main };
