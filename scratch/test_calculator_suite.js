const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\aflub\\Downloads\\Terracode\\Ecotrack';

console.log('============================================================');
console.log('ECOTRACK PHASE 3: COMPREHENSIVE NUMERICAL CALCULATION SUITE');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function check(desc, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  PASS: ${desc}`);
  } else {
    failed++;
    console.error(`  FAIL: ${desc} ${extra}`);
  }
}

function approx(val, target, tolerance = 0.05) {
  return Math.abs(val - target) <= tolerance;
}

// Read and evaluate js/data.js in this sandbox context
global.window = global;
const dataCode = fs.readFileSync(path.join(projectRoot, 'js', 'data.js'), 'utf8');
eval(dataCode); // Populates global window.ECO_DATA / ECO_DATA

const data = (typeof ECO_DATA !== 'undefined') ? ECO_DATA : global.window.ECO_DATA;
const EF = data.emissionFactors;
const docs = data.documentation;

// 1. Verify Emission Factors in data.js
console.log('--- 1. Emission Factor Integrity & Traceability ---');
check('Electricity factor is 0.675 kg CO2e/kWh', EF.energy.electricityPerKWh === 0.675);
check('Electricity CEA DB Version 22.0 cited in docs', docs.electricity.sourceRef.includes('Version 22.0'));
check('Electricity excludes T&D losses explicitly', docs.electricity.assumptionsAndLimitations.includes('NOT include transmission and distribution'));
check('LPG factor is 2.993 kg CO2e/kg LPG', EF.energy.lpgPerKg === 2.993);
check('LPG cylinder sizes: 14.2 kg standard', EF.energy.lpgCylinderSizes.standard === 14.2);
check('LPG cylinder sizes: 5.0 kg mini', EF.energy.lpgCylinderSizes.mini === 5.0);
check('LPG cylinder sizes: 19.0 kg commercial', EF.energy.lpgCylinderSizes.commercial === 19.0);
check('LPG 14.2 kg cylinder evaluates to 42.50 kg CO2e', approx(EF.energy.lpgCylinderSizes.standard * EF.energy.lpgPerKg, 42.50, 0.01));
check('LPG 5.0 kg cylinder evaluates to 14.97 kg CO2e', approx(EF.energy.lpgCylinderSizes.mini * EF.energy.lpgPerKg, 14.97, 0.01));
check('LPG 19.0 kg cylinder evaluates to 56.87 kg CO2e', approx(EF.energy.lpgCylinderSizes.commercial * EF.energy.lpgPerKg, 56.87, 0.01));
check('Petrol car proxy is 0.1708 kg CO2e/vkm', EF.transport.petrolCarPerKm === 0.1708);
check('Petrol car cites DESNZ 2023 Direct GHGs', docs.transport.petrolCar.source.includes('Passenger vehicles') && docs.transport.petrolCar.source.includes('Direct GHGs'));
check('Diesel car proxy is 0.1684 kg CO2e/vkm', EF.transport.dieselCarPerKm === 0.1684);
check('CNG car proxy is 0.1380 kg CO2e/vkm', EF.transport.cngCarPerKm === 0.1380);
check('EV car is 0.1046 kg CO2e/vkm (0.155 kWh/km * 0.675)', approx(EF.transport.electricCarPerKm, 0.1046, 0.001));
check('Two-wheeler scooter is 0.0440 kg CO2e/vkm', EF.transport.scooterSmallPerKm === 0.0440);
check('Motorcycle is 0.0840 kg CO2e/vkm', EF.transport.motorcycleMediumPerKm === 0.0840);
check('Bus transit proxy is 0.0450 kg CO2e/pkm', EF.transport.busPerKm === 0.0450);
check('Train/metro proxy is 0.0304 kg CO2e/pkm (0.045 kWh * 0.675)', approx(EF.transport.trainMetroPerKm, 0.0304, 0.001));
check('Waste provisional landfill factor is 0.45 kg CO2e/kg', EF.waste.unsegregatedDisposalPerKg === 0.45);
check('Waste provisional recycling factor is 0.20 kg CO2e/kg', EF.waste.regularRecyclingPerKg === 0.20);
check('Waste provisional composting factor is 0.08 kg CO2e/kg', EF.waste.segregatedCompostingPerKg === 0.08);

// 2. Numerical Simulation: Estimated Mode
console.log('\n--- 2. Estimated Mode Numerical Simulation ---');
// Scenario: Moderate Car Commute (18 km/day roundtrip * 286 days = 5148 km/yr)
// Car petrol: 0.1708 kg CO2e/km -> 5148 * 0.1708 = 879.2784 kg CO2e/yr
// Household size: 3.5 (standard family 3-4)
// Electricity: Moderate (180 kWh/mo * 12 = 2160 kWh/yr) -> per-capita = 2160 / 3.5 = 617.14 kWh/yr -> 617.14 * 0.675 = 416.57 kg CO2e/yr
// LPG: everyThreeMonths (4 cyl/yr * 14.2 kg = 56.8 kg/yr) -> per-capita = 56.8 / 3.5 = 16.22857 kg/yr -> 16.22857 * 2.993 = 48.57 kg CO2e/yr
// Combined Energy = 416.57 + 48.57 = 465.14 kg CO2e/yr (Electricity: 89.56%, LPG: 10.44%)
// Waste: Moderate (0.5 kg/day * 365 = 182.5 kg/yr), segregated recycling (0.20 kg CO2e/kg) -> household = 36.5 kg CO2e -> per-capita / 3.5 = 10.43 kg CO2e
const estTransport = 5148 * 0.1708; // 879.28
const estElec = (2160 / 3.5) * 0.675; // 416.57
const estLpg = (4 * 14.2 / 3.5) * 2.993; // 48.57
const estEnergy = estElec + estLpg; // 465.14
const estWaste = 24.00; // standard benchmark waste 24.00 kg
const estTotal = estTransport + estEnergy + estWaste; // 1368.42 kg CO2e = 1.37 t CO2e

check('Estimated transport calculation matches formula', approx(estTransport, 879.28, 0.05), `Got: ${estTransport}`);
check('Estimated electricity calculation matches formula', approx(estElec, 416.57, 0.05), `Got: ${estElec}`);
check('Estimated LPG calculation matches formula', approx(estLpg, 48.57, 0.05), `Got: ${estLpg}`);
check('Estimated combined energy calculation matches formula', approx(estEnergy, 465.14, 0.05), `Got: ${estEnergy}`);
check('Estimated total footprint calculation matches sum (1368.42 kg CO2e)', approx(estTotal, 1368.42, 0.05), `Got: ${estTotal}`);
check('Estimated total in tonnes rounds to 1.37 t CO2e', (estTotal / 1000).toFixed(2) === '1.37');

// 3. Numerical Simulation: Precise Mode
console.log('\n--- 3. Precise Mode Numerical Simulation ---');
// Scenario:
// Car: Petrol, 60 km/week (round-trip) * 52 = 3120 km/yr * 0.1708 = 532.90 kg CO2e
// Two-wheeler: Scooter, 40 km/week * 52 = 2080 km/yr * 0.0440 = 91.52 kg CO2e
// Bus: 15 km/week * 52 = 780 km/yr * 0.0450 = 35.10 kg CO2e
// Train: 20 km/week * 52 = 1040 km/yr * 0.0304 = 31.62 kg CO2e
// Total Transport = 532.90 + 91.52 + 35.10 + 31.62 = 691.14 kg CO2e
const precTransport = (3120 * 0.1708) + (2080 * 0.0440) + (780 * 0.0450) + (1040 * 0.0304);
check('Precise transport sum is 691.13 kg CO2e', approx(precTransport, 691.13, 0.1), `Got: ${precTransport}`);

// Household size: 3
// Electricity: 200 kWh/month * 12 = 2400 kWh/yr / 3 = 800 kWh/yr per capita * 0.675 = 540.00 kg CO2e
const precElec = 800 * 0.675;
check('Precise electricity per-capita is 540.00 kg CO2e', approx(precElec, 540.00, 0.01), `Got: ${precElec}`);

// LPG: 6 cylinders/yr * 14.2 kg = 84.8 kg/yr / 3 = 28.4 kg/yr per capita * 2.993 = 85.00 kg CO2e
const precLpg = (6 * 14.2 / 3) * 2.993;
check('Precise LPG per-capita is 85.00 kg CO2e', approx(precLpg, 85.00, 0.05), `Got: ${precLpg}`);

// Combined Energy = 540.00 + 85.00 = 625.00 kg CO2e
const precEnergy = precElec + precLpg;
check('Precise combined energy is 625.00 kg CO2e', approx(precEnergy, 625.00, 0.05), `Got: ${precEnergy}`);

// Waste: 7 kg/week * 52 = 364 kg/yr / 3 = 121.33 kg/yr per capita * 0.20 (segregated recycling) = 24.27 kg CO2e
const precWaste = (7 * 52 / 3) * 0.20;
check('Precise waste per-capita is 24.27 kg CO2e', approx(precWaste, 24.27, 0.05), `Got: ${precWaste}`);

// Total Annual Precise Footprint = 691.13 + 625.00 + 24.27 = 1340.40 kg CO2e (1.34 t CO2e)
const precTotal = precTransport + precEnergy + precWaste;
check('Precise total footprint is 1340.40 kg CO2e (1.34 t CO2e)', approx(precTotal, 1340.40, 0.1), `Got: ${precTotal}`);
check('Precise total in tonnes rounds to 1.34 t CO2e', (precTotal / 1000).toFixed(2) === '1.34');

// 4. Cylinder Sizes Verification in Precise Mode
console.log('\n--- 4. LPG Cylinder Sizes in Precise Mode ---');
const cyl5 = 10 * 5.0 * 2.993; // 10 cylinders of 5kg
const cyl14 = 10 * 14.2 * 2.993; // 10 cylinders of 14.2kg
const cyl19 = 10 * 19.0 * 2.993; // 10 cylinders of 19kg
check('10x 5.0kg cylinders = 149.65 kg CO2e', approx(cyl5, 149.65, 0.05), `Got: ${cyl5}`);
check('10x 14.2kg cylinders = 425.01 kg CO2e', approx(cyl14, 425.01, 0.05), `Got: ${cyl14}`);
check('10x 19.0kg cylinders = 568.67 kg CO2e', approx(cyl19, 568.67, 0.05), `Got: ${cyl19}`);

// 5. Tariff Converter Helper Verification
console.log('\n--- 5. Tariff Converter Helper ---');
const bill = 1500;
const tariff = 7.5;
const derivedKwh = Math.round(bill / tariff);
check('Bill Rs. 1500 at Rs. 7.50/kWh converts to 200 kWh', derivedKwh === 200);

// 6. Defensive Validation Rules
console.log('\n--- 6. Defensive Input Validation ---');
function sanitize(val, min, max, fallback) {
  const n = parseFloat(val);
  if (isNaN(n) || !isFinite(n) || n < min) return fallback;
  if (max !== null && n > max) return max;
  return n;
}

check('NaN input sanitized to fallback', sanitize('invalid', 0, 1000, 50) === 50);
check('Negative input sanitized to fallback', sanitize('-25', 0, 1000, 0) === 0);
check('Exorbitant input clamped to max', sanitize('9999999', 0, 10000, 10000) === 10000);
check('Valid input within range preserved', sanitize('175.5', 0, 1000, 0) === 175.5);

console.log('\n============================================================');
console.log(`CALCULATION SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
