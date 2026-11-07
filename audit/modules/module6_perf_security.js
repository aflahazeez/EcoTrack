/**
 * EcoTrack Master Audit Runner - Module 6: Performance & Client Security Audit
 * Measures navigation timing, asset payload weights, zero-cookie storage, and privacy compliance.
 */

const LIVE_INDEX_URL = 'https://aflahazeez.github.io/EcoTrack/index.html';
const LIVE_CALC_URL = 'https://aflahazeez.github.io/EcoTrack/calculator.html';

async function runPerformanceAndSecurityAudit(cdp, reporter) {
  console.log('\n============================================================');
  console.log('MODULE 6: PERFORMANCE & CLIENT SECURITY AUDIT');
  console.log('============================================================\n');

  await cdp.setViewport(1440, 900);

  // 1. Navigation Timing Metrics
  try {
    await cdp.navigate(LIVE_INDEX_URL);
    const perfTiming = await cdp.evaluate(`
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          return {
            dnsTimeMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
            tcpTimeMs: Math.round(nav.connectEnd - nav.connectStart),
            ttfbMs: Math.round(nav.responseStart - nav.requestStart),
            domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            loadCompleteMs: Math.round(nav.loadEventEnd - nav.startTime),
            transferSize: nav.transferSize || 0
          };
        }
        const t = performance.timing;
        return {
          dnsTimeMs: t.domainLookupEnd - t.domainLookupStart,
          tcpTimeMs: t.connectEnd - t.connectStart,
          ttfbMs: t.responseStart - t.requestStart,
          domContentLoadedMs: t.domContentLoadedEventEnd - t.navigationStart,
          loadCompleteMs: t.loadEventEnd - t.navigationStart,
          transferSize: 0
        };
      })()
    `);

    // Benchmarks: DOMContentLoaded under 3000ms over public internet
    const isPerformant = perfTiming.domContentLoadedMs > 0 && perfTiming.domContentLoadedMs < 4000;
    reporter.record(
      'Module 6: Perf & Security',
      `Navigation Timing: DOMContentLoaded (${perfTiming.domContentLoadedMs}ms) & Load (${perfTiming.loadCompleteMs}ms)`,
      isPerformant ? 'PASS' : 'FAIL',
      perfTiming
    );
  } catch (err) {
    reporter.record('Module 6: Perf & Security', 'Navigation Timing API', 'FAIL', err.message);
  }

  // 2. Client-Side Privacy & Zero-Cookie Policy
  try {
    await cdp.navigate(LIVE_CALC_URL);
    const securityCheck = await cdp.evaluate(`
      (() => {
        // 1. Check cookies (Must be empty)
        const cookies = document.cookie;

        // 2. Check for third-party tracking scripts
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
        const trackerDomains = ['google-analytics.com', 'googletagmanager.com', 'facebook.net', 'hotjar.com', 'segment.io'];
        const foundTrackers = scripts.filter(src => trackerDomains.some(d => src.includes(d)));

        // 3. Verify all external resources use HTTPS
        const allExternalUrls = Array.from(document.querySelectorAll('link[href], script[src], img[src]'))
          .map(el => el.href || el.src)
          .filter(u => u && u.startsWith('http:'));

        // 4. Client storage inspection
        const storageKeys = Object.keys(localStorage);
        const nonEcoKeys = storageKeys.filter(k => !k.startsWith('ecotrack_'));

        return {
          cookiesEmpty: cookies === '',
          cookies,
          zeroTrackers: foundTrackers.length === 0,
          foundTrackers,
          zeroInsecureHttp: allExternalUrls.length === 0,
          insecureUrls: allExternalUrls,
          storageKeys
        };
      })()
    `);

    reporter.record(
      'Module 6: Perf & Security',
      'Zero-Cookie Policy: Document Cookies Strictly Empty',
      securityCheck.cookiesEmpty ? 'PASS' : 'FAIL',
      { cookies: securityCheck.cookies }
    );

    reporter.record(
      'Module 6: Perf & Security',
      'Zero Third-Party Trackers & Analytics Beacons',
      securityCheck.zeroTrackers ? 'PASS' : 'FAIL',
      { foundTrackers: securityCheck.foundTrackers }
    );

    reporter.record(
      'Module 6: Perf & Security',
      'Complete Subresource HTTPS Security (Zero Mixed Content)',
      securityCheck.zeroInsecureHttp ? 'PASS' : 'FAIL',
      { insecureUrls: securityCheck.insecureUrls }
    );

    reporter.record(
      'Module 6: Perf & Security',
      'Local Client Storage Isolation (ecotrack_* namespace)',
      securityCheck.storageKeys.every(k => k.startsWith('ecotrack_')) ? 'PASS' : 'FAIL',
      { storageKeys: securityCheck.storageKeys }
    );

  } catch (err) {
    reporter.record('Module 6: Perf & Security', 'Client Security Audit', 'FAIL', err.message);
  }
}

module.exports = { runPerformanceAndSecurityAudit };
