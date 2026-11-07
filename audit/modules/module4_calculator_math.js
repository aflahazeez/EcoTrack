/**
 * EcoTrack Master Audit Runner - Module 4: Carbon Calculator Mathematical Implementation Audit
 *
 * Conducts independent mathematical verification across 125 varied test vectors.
 *
 * CRITICAL METHODOLOGICAL DISTINCTION:
 * This module tests IMPLEMENTATION CONSISTENCY (verifying that js/calculator.js faithfully
 * implements the documented constants and formulas in js/data.js without arithmetic or rounding drift).
 * Independent scientific accuracy of the underlying emission factors is reviewed separately
 * in environmental_factor_review/CORRECTED_VEHICLE_FACTOR_REVIEW.md.
 */

const LIVE_CALCULATOR_URL = 'https://aflahazeez.github.io/EcoTrack/calculator.html';

// ---------------------------------------------------------------------------
// 1. INDEPENDENT MATHEMATICAL ENGINE (Built from documented standards)
// ---------------------------------------------------------------------------
// Pure independent reference formulas. Zero application code imported.

const INDEPENDENT_CONSTANTS = {
  // Grid Electricity: CEA Version 22.0 (FY 2025-26) net generation busbar
  ELECTRICITY_PER_KWH: 0.675,

  // LPG: IPCC 2006 Vol 2 Ch 2 Table 2.2 + AR5 GWPs
  LPG_PER_KG: 2.993,

  // Transport factors (kg CO2e / km)
  TRANSPORT: {
    petrolCar: 0.1708,
    dieselCar: 0.1684,
    cngCar: 0.1380,
    electricCar: 0.1046,
    scooterSmall: 0.0440,
    motorcycleMedium: 0.0840,
    electricTwoWheeler: 0.0236,
    bus: 0.0450,
    trainMetro: 0.0304,
    activeClean: 0.0000,
    // Estimated blended midpoints:
    estTwoWheeler: 0.0600,
    estPublicTransit: 0.0380,
    estMixedTransport: 0.0950
  },

  // Waste factors (kg CO2e / kg waste)
  WASTE: {
    segregatedComposting: 0.08,
    regularRecycling: 0.20,
    unsegregatedDisposal: 0.45
  },

  // Estimated midpoints
  EST_MIDPOINTS: {
    distanceKm: { short: 7, moderate: 18, long: 35, extensive: 65 },
    frequencyDays: { daily: 5.5, regular: 3.5, occasional: 1.5 },
    householdSize: { '1': 1.0, '2': 2.0, '3_4': 3.5, '5_plus': 5.5 },
    electricityKWh: { veryLow: 45, low: 85, moderate: 180, high: 360 },
    lpgRefillsPerYear: { everyMonth: 12.0, everyTwoMonths: 6.0, everyThreeMonths: 4.0, everyFourToSixMonths: 2.4, noLpg: 0.0 },
    wasteKgMonth: { low: 15, moderate: 35, high: 75, veryHigh: 130 }
  }
};

/**
 * Pure independent calculation for Estimated Mode
 */
function independentCalculateEstimated(input) {
  const M = INDEPENDENT_CONSTANTS.EST_MIDPOINTS;
  const C = INDEPENDENT_CONSTANTS;

  // 1. Transport
  const dailyKm = M.distanceKm[input.distanceRange] !== undefined ? M.distanceKm[input.distanceRange] : 18;
  const daysPerWeek = M.frequencyDays[input.travelFrequency] !== undefined ? M.frequencyDays[input.travelFrequency] : 5.5;
  const annualKm = dailyKm * daysPerWeek * 52;

  let vFactor = C.TRANSPORT.petrolCar;
  if (input.transportMethod === 'dieselCar') vFactor = C.TRANSPORT.dieselCar;
  else if (input.transportMethod === 'cngCar') vFactor = C.TRANSPORT.cngCar;
  else if (input.transportMethod === 'electricCar') vFactor = C.TRANSPORT.electricCar;
  else if (input.transportMethod === 'twoWheeler') vFactor = C.TRANSPORT.estTwoWheeler;
  else if (input.transportMethod === 'publicTransit') vFactor = C.TRANSPORT.estPublicTransit;
  else if (input.transportMethod === 'mixedTransport') vFactor = C.TRANSPORT.estMixedTransport;
  else if (input.transportMethod === 'activeClean') vFactor = C.TRANSPORT.activeClean;

  const transportAnnualKg = annualKm * vFactor;

  // 2. Household Energy
  const members = M.householdSize[input.householdSize] !== undefined ? M.householdSize[input.householdSize] : 3.5;
  const monthlyKWh = M.electricityKWh[input.electricityLevel] !== undefined ? M.electricityKWh[input.electricityLevel] : 180;
  const annualKWhPerCapita = (monthlyKWh * 12) / members;
  const electricityAnnualKg = annualKWhPerCapita * C.ELECTRICITY_PER_KWH;

  const refills = M.lpgRefillsPerYear[input.lpgRefill] !== undefined ? M.lpgRefillsPerYear[input.lpgRefill] : 4.0;
  const cylSize = parseFloat(input.lpgSize) || 14.2;
  const annualLpgKgPerCapita = (refills * cylSize) / members;
  const lpgAnnualKg = annualLpgKgPerCapita * C.LPG_PER_KG;
  const energyAnnualKg = electricityAnnualKg + lpgAnnualKg;

  // 3. Waste
  const monthlyWaste = M.wasteKgMonth[input.wasteGen] !== undefined ? M.wasteKgMonth[input.wasteGen] : 35;
  const annualWastePerCapita = (monthlyWaste * 12) / members;
  const wFactor = C.WASTE[input.wastePractice] !== undefined ? C.WASTE[input.wastePractice] : C.WASTE.regularRecycling;
  const wasteAnnualKg = annualWastePerCapita * wFactor;

  // Totals
  const totalAnnualKg = transportAnnualKg + energyAnnualKg + wasteAnnualKg;
  const totalMonthlyKg = totalAnnualKg / 12;
  const totalAnnualTonnes = totalAnnualKg / 1000;

  return {
    transportAnnualKg,
    electricityAnnualKg,
    lpgAnnualKg,
    energyAnnualKg,
    wasteAnnualKg,
    totalAnnualKg,
    totalMonthlyKg,
    totalAnnualTonnes,
    transportPct: totalAnnualKg > 0 ? (transportAnnualKg / totalAnnualKg) * 100 : 0,
    energyPct: totalAnnualKg > 0 ? (energyAnnualKg / totalAnnualKg) * 100 : 0,
    wastePct: totalAnnualKg > 0 ? (wasteAnnualKg / totalAnnualKg) * 100 : 0
  };
}

/**
 * Pure independent calculation for Precise Mode
 */
function independentCalculatePrecise(input) {
  const C = INDEPENDENT_CONSTANTS;

  // 1. Transport
  let carKg = 0;
  if (input.carFuelType && input.carFuelType !== 'none') {
    const dist = Math.max(0, parseFloat(input.carDistance) || 0);
    const annualKm = input.carFrequency === 'monthly' ? dist * 12 : dist * 52;
    let factor = 0;
    if (input.carFuelType === 'petrol') factor = C.TRANSPORT.petrolCar;
    else if (input.carFuelType === 'diesel') factor = C.TRANSPORT.dieselCar;
    else if (input.carFuelType === 'cng') factor = C.TRANSPORT.cngCar;
    else if (input.carFuelType === 'electric') factor = C.TRANSPORT.electricCar;
    carKg = annualKm * factor;
  }

  let twoWheelerKg = 0;
  if (input.twowheelerType && input.twowheelerType !== 'none') {
    const dist = Math.max(0, parseFloat(input.twowheelerDistance) || 0);
    const annualKm = input.twowheelerFrequency === 'monthly' ? dist * 12 : dist * 52;
    let factor = 0;
    if (input.twowheelerType === 'scooterSmall') factor = C.TRANSPORT.scooterSmall;
    else if (input.twowheelerType === 'motorcycleMedium') factor = C.TRANSPORT.motorcycleMedium;
    else if (input.twowheelerType === 'electricTwoWheeler') factor = C.TRANSPORT.electricTwoWheeler;
    twoWheelerKg = annualKm * factor;
  }

  const busDist = Math.max(0, parseFloat(input.busDistance) || 0);
  const busKg = busDist * 52 * C.TRANSPORT.bus;

  const trainDist = Math.max(0, parseFloat(input.trainDistance) || 0);
  const trainKg = trainDist * 52 * C.TRANSPORT.trainMetro;

  const transportAnnualKg = carKg + twoWheelerKg + busKg + trainKg;

  // 2. Household Energy
  const members = Math.max(1, parseInt(input.householdMembers, 10) || 1);

  // Electricity
  const monthlyElec = Math.max(0, parseFloat(input.electricityValue) || 0);
  const annualElecKWh = monthlyElec * 12;
  const electricityAnnualKg = (annualElecKWh / members) * C.ELECTRICITY_PER_KWH;

  // LPG
  let annualLpgKg = 0;
  const cylSize = parseFloat(input.lpgCylinderSize) || 14.2;
  if (input.lpgMode === 'cylinders') {
    const count = Math.max(0, parseFloat(input.lpgCylinderCount) || 0);
    annualLpgKg = count * cylSize;
  } else if (input.lpgMode === 'directKg') {
    const monthlyKg = Math.max(0, parseFloat(input.lpgKgAmount) || 0);
    annualLpgKg = monthlyKg * 12;
  }
  const lpgAnnualKg = (annualLpgKg / members) * C.LPG_PER_KG;
  const energyAnnualKg = electricityAnnualKg + lpgAnnualKg;

  // 3. Waste
  const wasteQty = Math.max(0, parseFloat(input.wasteQuantity) || 0);
  const annualWasteKg = input.wasteFrequency === 'weekly' ? wasteQty * 52 : wasteQty * 12;
  const wFactor = C.WASTE[input.wastePractice] !== undefined ? C.WASTE[input.wastePractice] : C.WASTE.regularRecycling;
  const wasteAnnualKg = (annualWasteKg / members) * wFactor;

  // Totals
  const totalAnnualKg = transportAnnualKg + energyAnnualKg + wasteAnnualKg;
  const totalMonthlyKg = totalAnnualKg / 12;
  const totalAnnualTonnes = totalAnnualKg / 1000;

  return {
    transportAnnualKg,
    electricityAnnualKg,
    lpgAnnualKg,
    energyAnnualKg,
    wasteAnnualKg,
    totalAnnualKg,
    totalMonthlyKg,
    totalAnnualTonnes,
    transportPct: totalAnnualKg > 0 ? (transportAnnualKg / totalAnnualKg) * 100 : 0,
    energyPct: totalAnnualKg > 0 ? (energyAnnualKg / totalAnnualKg) * 100 : 0,
    wastePct: totalAnnualKg > 0 ? (wasteAnnualKg / totalAnnualKg) * 100 : 0
  };
}

// ---------------------------------------------------------------------------
// 2. TEST CASE GENERATOR (125 Varied Test Combinations)
// ---------------------------------------------------------------------------
function generateTestCases() {
  const tests = [];
  let id = 1;

  // SECTION A: ESTIMATED MODE (50 Test Cases)
  const estTransportMethods = ['petrolCar', 'dieselCar', 'cngCar', 'electricCar', 'twoWheeler', 'publicTransit', 'mixedTransport', 'activeClean'];
  const estDistances = ['short', 'moderate', 'long', 'extensive'];
  const estFrequencies = ['daily', 'regular', 'occasional'];
  const estHouseholdSizes = ['1', '2', '3_4', '5_plus'];
  const estElecLevels = ['veryLow', 'low', 'moderate', 'high'];
  const estLpgRefills = ['everyMonth', 'everyTwoMonths', 'everyThreeMonths', 'everyFourToSixMonths', 'noLpg'];
  const estLpgSizes = ['5', '14.2', '19'];
  const estWasteGens = ['low', 'moderate', 'high', 'veryHigh'];
  const estWastePractices = ['segregatedComposting', 'regularRecycling', 'unsegregatedDisposal'];

  // A1. Canonical combinations across transport methods
  estTransportMethods.forEach((method, idx) => {
    tests.push({
      id: `EST_${String(id++).padStart(3, '0')}`,
      mode: 'estimated',
      scenario: `Estimated Baseline: ${method}`,
      input: {
        transportMethod: method,
        distanceRange: estDistances[idx % estDistances.length],
        travelFrequency: estFrequencies[idx % estFrequencies.length],
        householdSize: estHouseholdSizes[idx % estHouseholdSizes.length],
        electricityLevel: estElecLevels[idx % estElecLevels.length],
        lpgRefill: estLpgRefills[idx % estLpgRefills.length],
        lpgSize: '14.2',
        wasteGen: estWasteGens[idx % estWasteGens.length],
        wastePractice: estWastePractices[idx % estWastePractices.length]
      }
    });
  });

  // A2. Zero / Minimal Lifestyle combinations
  tests.push({
    id: `EST_${String(id++).padStart(3, '0')}`,
    mode: 'estimated',
    scenario: 'Estimated Ultra-Low Impact (Active travel, no LPG, composting, extended family)',
    input: {
      transportMethod: 'activeClean',
      distanceRange: 'short',
      travelFrequency: 'occasional',
      householdSize: '5_plus',
      electricityLevel: 'veryLow',
      lpgRefill: 'noLpg',
      lpgSize: '14.2',
      wasteGen: 'low',
      wastePractice: 'segregatedComposting'
    }
  });

  // A3. Maximum / High Lifestyle combinations
  tests.push({
    id: `EST_${String(id++).padStart(3, '0')}`,
    mode: 'estimated',
    scenario: 'Estimated Maximum Footprint (Petrol car extensive daily, high electricity, commercial LPG, single occupant)',
    input: {
      transportMethod: 'petrolCar',
      distanceRange: 'extensive',
      travelFrequency: 'daily',
      householdSize: '1',
      electricityLevel: 'high',
      lpgRefill: 'everyMonth',
      lpgSize: '19',
      wasteGen: 'veryHigh',
      wastePractice: 'unsegregatedDisposal'
    }
  });

  // A4. Varied permutations filling up to 50 Estimated tests
  while (tests.length < 50) {
    const i = tests.length;
    tests.push({
      id: `EST_${String(id++).padStart(3, '0')}`,
      mode: 'estimated',
      scenario: `Estimated Permutation #${i}`,
      input: {
        transportMethod: estTransportMethods[i % estTransportMethods.length],
        distanceRange: estDistances[(i * 2) % estDistances.length],
        travelFrequency: estFrequencies[(i * 3) % estFrequencies.length],
        householdSize: estHouseholdSizes[(i * 5) % estHouseholdSizes.length],
        electricityLevel: estElecLevels[(i * 7) % estElecLevels.length],
        lpgRefill: estLpgRefills[(i * 11) % estLpgRefills.length],
        lpgSize: estLpgSizes[i % estLpgSizes.length],
        wasteGen: estWasteGens[(i * 13) % estWasteGens.length],
        wastePractice: estWastePractices[(i * 17) % estWastePractices.length]
      }
    });
  }

  // SECTION B: PRECISE MODE (65 Test Cases)
  // B1. Extreme Boundary: Zero footprint baseline
  tests.push({
    id: `PREC_${String(id++).padStart(3, '0')}`,
    mode: 'precise',
    scenario: 'Precise Zero Baseline (All zeros, 1 person)',
    input: {
      carFuelType: 'none', carDistance: 0, carFrequency: 'weekly',
      twowheelerType: 'none', twowheelerDistance: 0, twowheelerFrequency: 'weekly',
      busDistance: 0, trainDistance: 0,
      householdMembers: 1, electricityValue: 0,
      lpgMode: 'none', lpgCylinderCount: 0, lpgCylinderSize: 14.2, lpgKgAmount: 0,
      wasteQuantity: 0, wasteFrequency: 'weekly', wastePractice: 'regularRecycling'
    }
  });

  // B2. Minimum Values & Decimals
  tests.push({
    id: `PREC_${String(id++).padStart(3, '0')}`,
    mode: 'precise',
    scenario: 'Precise Minimum Floating Decimals',
    input: {
      carFuelType: 'petrol', carDistance: 0.5, carFrequency: 'weekly',
      twowheelerType: 'scooterSmall', twowheelerDistance: 0.25, twowheelerFrequency: 'weekly',
      busDistance: 1.5, trainDistance: 2.5,
      householdMembers: 1, electricityValue: 12.5,
      lpgMode: 'directKg', lpgCylinderCount: 0, lpgCylinderSize: 14.2, lpgKgAmount: 1.5,
      wasteQuantity: 0.75, wasteFrequency: 'weekly', wastePractice: 'segregatedComposting'
    }
  });

  // B3. Maximum Safe Inputs
  tests.push({
    id: `PREC_${String(id++).padStart(3, '0')}`,
    mode: 'precise',
    scenario: 'Precise Maximum Boundary Values',
    input: {
      carFuelType: 'diesel', carDistance: 1200, carFrequency: 'weekly',
      twowheelerType: 'motorcycleMedium', twowheelerDistance: 500, twowheelerFrequency: 'weekly',
      busDistance: 300, trainDistance: 400,
      householdMembers: 20, electricityValue: 5000,
      lpgMode: 'cylinders', lpgCylinderCount: 48, lpgCylinderSize: 19.0, lpgKgAmount: 0,
      wasteQuantity: 150, wasteFrequency: 'weekly', wastePractice: 'unsegregatedDisposal'
    }
  });

  // B4. Specific fuel combinations
  const fuels = ['petrol', 'diesel', 'cng', 'electric'];
  const bikes = ['scooterSmall', 'motorcycleMedium', 'electricTwoWheeler', 'none'];
  const lpgModes = ['cylinders', 'directKg', 'none'];

  fuels.forEach((fuel, fIdx) => {
    tests.push({
      id: `PREC_${String(id++).padStart(3, '0')}`,
      mode: 'precise',
      scenario: `Precise Fuel Focus: Car ${fuel} + Bike ${bikes[fIdx]}`,
      input: {
        carFuelType: fuel, carDistance: 35.5, carFrequency: 'weekly',
        twowheelerType: bikes[fIdx], twowheelerDistance: 20.0, twowheelerFrequency: 'weekly',
        busDistance: 10, trainDistance: 15,
        householdMembers: 3, electricityValue: 220,
        lpgMode: 'cylinders', lpgCylinderCount: 8, lpgCylinderSize: 14.2, lpgKgAmount: 0,
        wasteQuantity: 6.5, wasteFrequency: 'weekly', wastePractice: 'regularRecycling'
      }
    });
  });

  // B5. Monthly vs Weekly frequency test cases
  tests.push({
    id: `PREC_${String(id++).padStart(3, '0')}`,
    mode: 'precise',
    scenario: 'Precise Monthly Frequency Commute',
    input: {
      carFuelType: 'petrol', carDistance: 450, carFrequency: 'monthly', // 450 * 12 = 5400 km/yr
      twowheelerType: 'none', twowheelerDistance: 0, twowheelerFrequency: 'monthly',
      busDistance: 0, trainDistance: 0,
      householdMembers: 2, electricityValue: 150,
      lpgMode: 'directKg', lpgCylinderCount: 0, lpgCylinderSize: 14.2, lpgKgAmount: 14.2,
      wasteQuantity: 30, wasteFrequency: 'monthly', wastePractice: 'regularRecycling'
    }
  });

  // B6. Cylinder Sizes comparison (5kg vs 14.2kg vs 19kg)
  [5.0, 14.2, 19.0].forEach(size => {
    tests.push({
      id: `PREC_${String(id++).padStart(3, '0')}`,
      mode: 'precise',
      scenario: `Precise LPG Cylinder Size: ${size} kg`,
      input: {
        carFuelType: 'electric', carDistance: 50, carFrequency: 'weekly',
        twowheelerType: 'none', twowheelerDistance: 0, twowheelerFrequency: 'weekly',
        busDistance: 0, trainDistance: 0,
        householdMembers: 4, electricityValue: 250,
        lpgMode: 'cylinders', lpgCylinderCount: 10, lpgCylinderSize: size, lpgKgAmount: 0,
        wasteQuantity: 10, wasteFrequency: 'weekly', wastePractice: 'regularRecycling'
      }
    });
  });

  // B7. Varied numerical combinations filling up to 115 total tests
  while (tests.length < 115) {
    const i = tests.length;
    const fuel = fuels[i % fuels.length];
    const bike = bikes[(i * 3) % bikes.length];
    const members = (i % 8) + 1;
    const lpgMode = lpgModes[i % lpgModes.length];

    tests.push({
      id: `PREC_${String(id++).padStart(3, '0')}`,
      mode: 'precise',
      scenario: `Precise Random Combination #${i} (${fuel}, ${members}p)`,
      input: {
        carFuelType: fuel,
        carDistance: Math.round((10 + (i * 7.3)) % 180 * 10) / 10,
        carFrequency: i % 2 === 0 ? 'weekly' : 'monthly',
        twowheelerType: bike,
        twowheelerDistance: bike !== 'none' ? Math.round((5 + (i * 3.7)) % 100 * 10) / 10 : 0,
        twowheelerFrequency: i % 3 === 0 ? 'monthly' : 'weekly',
        busDistance: (i * 4) % 60,
        trainDistance: (i * 6) % 80,
        householdMembers: members,
        electricityValue: Math.round(50 + (i * 19.5) % 450),
        lpgMode: lpgMode,
        lpgCylinderCount: lpgMode === 'cylinders' ? (i % 12) + 1 : 0,
        lpgCylinderSize: 14.2,
        lpgKgAmount: lpgMode === 'directKg' ? (i % 25) + 5 : 0,
        wasteQuantity: Math.round((2 + (i * 1.8) % 25) * 10) / 10,
        wasteFrequency: i % 2 === 0 ? 'weekly' : 'monthly',
        wastePractice: ['segregatedComposting', 'regularRecycling', 'unsegregatedDisposal'][i % 3]
      }
    });
  }

  // SECTION C: EDGE CASES & DEFENSIVE BOUNDARIES (10 Test Cases)
  const edgeCases = [
    { name: 'Negative car distance (-50)', key: 'carDistance', val: -50 },
    { name: 'Negative electricity (-200)', key: 'electricityValue', val: -200 },
    { name: 'Negative LPG count (-5)', key: 'lpgCylinderCount', val: -5 },
    { name: 'Negative waste (-10)', key: 'wasteQuantity', val: -10 },
    { name: 'Zero household members (0 -> clamped to 1)', key: 'householdMembers', val: 0 },
    { name: 'Negative household members (-3 -> clamped to 1)', key: 'householdMembers', val: -3 },
    { name: 'Very large household (50 persons)', key: 'householdMembers', val: 50 },
    { name: 'High electricity bill (15,000 kWh)', key: 'electricityValue', val: 15000 },
    { name: 'Extensive weekly train (1500 km)', key: 'trainDistance', val: 1500 },
    { name: 'Composting with zero waste', key: 'wasteQuantity', val: 0 }
  ];

  edgeCases.forEach((ec, idx) => {
    const baseInput = {
      carFuelType: 'petrol', carDistance: 20, carFrequency: 'weekly',
      twowheelerType: 'none', twowheelerDistance: 0, twowheelerFrequency: 'weekly',
      busDistance: 0, trainDistance: 0,
      householdMembers: 2, electricityValue: 150,
      lpgMode: 'cylinders', lpgCylinderCount: 4, lpgCylinderSize: 14.2, lpgKgAmount: 0,
      wasteQuantity: 5, wasteFrequency: 'weekly', wastePractice: 'regularRecycling'
    };
    baseInput[ec.key] = ec.val;

    tests.push({
      id: `EDGE_${String(id++).padStart(3, '0')}`,
      mode: 'precise',
      scenario: `Edge Case: ${ec.name}`,
      input: baseInput
    });
  });

  return tests;
}

// ---------------------------------------------------------------------------
// 3. CDP CONTROLLER CLASS
// ---------------------------------------------------------------------------
async function runCalculatorMathAudit(cdp, reporter) {
  console.log('\n============================================================');
  console.log('MODULE 4: CARBON CALCULATOR IMPLEMENTATION CONSISTENCY AUDIT');
  console.log('Verifying 125 Test Vectors Against Pure Independent Reference Formulas');
  console.log('============================================================\n');

  await cdp.setViewport(1440, 900);
  await cdp.navigate(LIVE_CALCULATOR_URL);

  const testCases = generateTestCases();
  let passedVectors = 0;
  let failedVectors = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    // Compute independent expected value
    const expected = tc.mode === 'estimated'
      ? independentCalculateEstimated(tc.input)
      : independentCalculatePrecise(tc.input);

    // Evaluate live on website engine
    try {
      const actual = await cdp.evaluate(`
        (() => {
          if (!window.EcoCalculator) return { error: 'No EcoCalculator global' };
          const raw = ${JSON.stringify(tc.input)};
          const norm = '${tc.mode}' === 'estimated'
            ? window.EcoCalculator.normalizeEstimatedInputs(raw)
            : window.EcoCalculator.normalizePreciseInputs(raw);
          const res = window.EcoCalculator.calculate(norm);
          return {
            totalAnnualTonnes: res.totals.annualTonnes,
            totalAnnualKg: res.totals.annualKg
          };
        })()
      `);

      if (actual.error) {
        reporter.record('Module 4: Calculator Math', `Vector #${i + 1} (${tc.id})`, 'FAIL', actual.error);
        failedVectors++;
        continue;
      }

      const delta = Math.abs(expected.totalAnnualTonnes - actual.totalAnnualTonnes);
      const isPass = delta < 0.0001; // Strict sub-kilogram tolerance

      const status = isPass ? 'PASS' : 'FAIL';
      if (isPass) passedVectors++;
      else failedVectors++;

      // Log vector to reporter for CSV export
      reporter.recordCalculatorVector({
        id: tc.id,
        mode: tc.mode,
        categoryGroup: tc.scenario,
        inputSummary: JSON.stringify(tc.input),
        expected: expected.totalAnnualTonnes,
        actual: actual.totalAnnualTonnes,
        delta,
        status
      });

      if (!isPass) {
        console.error(`  [MATH MISMATCH] ${tc.id}: Expected ${expected.totalAnnualTonnes}, Actual ${actual.totalAnnualTonnes}, Delta: ${delta}`);
      }
    } catch (err) {
      reporter.record('Module 4: Calculator Math', `Vector #${i + 1} (${tc.id})`, 'FAIL', err.message);
      failedVectors++;
    }
  }

  const allPassed = failedVectors === 0 && passedVectors === testCases.length;
  reporter.record(
    'Module 4: Calculator Math',
    `Implementation Consistency: All ${testCases.length} Test Vectors Evaluated with Zero Numerical Drift`,
    allPassed ? 'PASS' : 'FAIL',
    { totalVectors: testCases.length, passed: passedVectors, failed: failedVectors }
  );

  console.log(`\nModule 4 Completed: ${passedVectors}/${testCases.length} vectors matched perfectly.`);
}

module.exports = {
  runCalculatorMathAudit,
  independentCalculateEstimated,
  independentCalculatePrecise,
  generateTestCases
};
