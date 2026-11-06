const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function getPageData(filename) {
  const content = fs.readFileSync(path.join(projectRoot, filename), 'utf8');
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  const mainMatch = content.match(/<main[\s\S]*?<\/main>/);
  const footerMatch = content.match(/<footer[\s\S]*?<\/footer>/);

  if (!mainMatch || !footerMatch) throw new Error('Missing main or footer in ' + filename);

  return {
    title: titleMatch ? titleMatch[1] : 'EcoTrack',
    html: mainMatch[0] + '\n\n  ' + footerMatch[0]
  };
}

const indexData = getPageData('index.html');
const calcData = getPageData('calculator.html');
const habitsData = getPageData('habits.html');
const dashData = getPageData('dashboard.html');

const output = `/**
 * EcoTrack – Pre-rendered Page View Templates
 * Enables continuous, simultaneous mobile-app horizontal sliding transitions
 * without server dependencies or CORS restrictions under file:// in Chrome.
 */
window.ECO_VIEWS = {
  'index.html': {
    title: ${JSON.stringify(indexData.title)},
    html: ${JSON.stringify(indexData.html)},
    init: null
  },
  'calculator.html': {
    title: ${JSON.stringify(calcData.title)},
    html: ${JSON.stringify(calcData.html)},
    init: function() {
      if (window.EcoCalculator && typeof window.EcoCalculator.init === 'function') {
        window.EcoCalculator.init();
      }
    }
  },
  'habits.html': {
    title: ${JSON.stringify(habitsData.title)},
    html: ${JSON.stringify(habitsData.html)},
    init: function() {
      if (window.EcoHabits && typeof window.EcoHabits.init === 'function') {
        window.EcoHabits.init();
      }
    }
  },
  'dashboard.html': {
    title: ${JSON.stringify(dashData.title)},
    html: ${JSON.stringify(dashData.html)},
    init: function() {
      if (window.EcoDashboard && typeof window.EcoDashboard.init === 'function') {
        window.EcoDashboard.init();
      }
    }
  },
  'tips.html': {
    redirectTo: 'habits.html#tips'
  }
};
`;

fs.writeFileSync(
  path.join(projectRoot, 'js', 'page-views.js'),
  output,
  'utf8'
);
console.log('Successfully wrote js/page-views.js. Length:', output.length);
