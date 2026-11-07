/**
 * EcoTrack Master Audit Runner - Module 1: Core Regression Unit Suites
 * Runs the 7 canonical regression test suites (574 unit tests) in pure Node.js.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const REGRESSION_SUITES = [
  { name: 'Calculator Model Suite', file: 'scratch/test_calculator_suite.js', expectedTests: 43 },
  { name: 'Browser Integration Suite', file: 'scratch/test_browser_integration.js', expectedTests: 105 },
  { name: 'Habits Tracker Suite', file: 'scratch/test_habits_suite.js', expectedTests: 100 },
  { name: 'Dashboard Analytics Suite', file: 'scratch/test_dashboard_suite.js', expectedTests: 111 },
  { name: 'Category Navigation Suite', file: 'scratch/test_category_navigation.js', expectedTests: 104 },
  { name: 'Browser History Regression Suite', file: 'scratch/test_browser_history_regression.js', expectedTests: 35 },
  { name: 'Slider Navigation Suite', file: 'scratch/test_slider_navigation.js', expectedTests: 76 }
];

async function runRegressionSuites(reporter) {
  console.log('\n============================================================');
  console.log('MODULE 1: CORE REGRESSION SUITES (574 UNIT TESTS)');
  console.log('============================================================\n');

  let totalModulePassed = 0;
  let totalModuleFailed = 0;

  for (const suite of REGRESSION_SUITES) {
    const fullPath = path.join(PROJECT_ROOT, suite.file);
    if (!fs.existsSync(fullPath)) {
      reporter.record('Module 1: Regression', `${suite.name} file exists`, 'FAIL', `File missing: ${suite.file}`);
      totalModuleFailed++;
      continue;
    }

    try {
      const res = cp.spawnSync(process.execPath, [fullPath], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 10000
      });

      const output = (res.stdout || '') + (res.stderr || '');
      const exitCode = res.status;

      // Extract pass/fail from stdout
      // Formats vary: "TOTAL: X passed, Y failed", "All X checks PASSED", etc.
      let passCount = 0;
      let failCount = 0;

      const passedMatch = output.match(/(\d+)\s+(?:checks|tests)?\s*(?:passed|PASSED)/i);
      const failedMatch = output.match(/(\d+)\s+(?:checks|tests)?\s*(?:failed|FAILED)/i);

      if (passedMatch) passCount = parseInt(passedMatch[1], 10);
      if (failedMatch) failCount = parseInt(failedMatch[1], 10);

      // Fallback: count individual PASS / FAIL lines if total line missing
      if (passCount === 0) {
        const passLines = output.split('\n').filter(l => l.includes('PASS') || l.includes('Passed'));
        passCount = passLines.length;
      }

      const isSuccess = exitCode === 0 && failCount === 0 && passCount > 0;
      const status = isSuccess ? 'PASS' : 'FAIL';

      reporter.record(
        'Module 1: Regression',
        `Suite: ${suite.name} (${suite.file})`,
        status,
        {
          expectedTests: suite.expectedTests,
          recordedPasses: passCount,
          recordedFailures: failCount,
          exitCode
        }
      );

      if (isSuccess) totalModulePassed += passCount;
      else totalModuleFailed += (failCount || 1);

    } catch (err) {
      reporter.record('Module 1: Regression', `Suite: ${suite.name} execution`, 'FAIL', err.message);
      totalModuleFailed++;
    }
  }

  console.log(`\nModule 1 Completed: ${totalModulePassed} unit tests passed, ${totalModuleFailed} failed.`);
  return { passed: totalModulePassed, failed: totalModuleFailed };
}

module.exports = {
  runRegressionSuites,
  REGRESSION_SUITES
};
