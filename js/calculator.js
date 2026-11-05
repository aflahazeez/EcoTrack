/**
 * EcoTrack – Carbon Footprint Assessment Engine (Phase 3 Enhancement)
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Features:
 * - Dual Calculation Modes:
 *   1. Estimated Calculation Mode: Qualitative selections converted into documented representative midpoints.
 *   2. Precise Calculation Mode: Direct user-entered measurements with robust validation.
 * - Three Audited Emission Categories:
 *   1. Transportation (Personal car, motorcycle/scooter, public transit, active/mixed travel).
 *   2. Household Energy (Combines grid electricity and domestic LPG cooking gas).
 *   3. Household Waste (Municipal solid waste with composting and recycling mitigation models).
 *   (Diet category completely removed).
 * - Shared Calculation Engine:
 *   Both modes pass normalized inputs to the same core calculation math and centralized factors in js/data.js.
 * - Defensive Input Validation:
 *   Rejects negative values, non-numeric strings, and invalid inputs without silent arbitrary replacement.
 * - Visualization:
 *   Chart.js doughnut chart (Transportation, Energy, Household Waste) with pure-CSS fallback progress bars.
 * - Persistence & Restoration:
 *   Saves calculation mode, raw inputs, normalized inputs, and result metrics under STORAGE_KEYS.FOOTPRINT.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Module State
  // ---------------------------------------------------------------------------
  let currentStep = 1;
  let activeMode = 'estimated'; // 'estimated' | 'precise'
  let chartInstance = null;
  let electricityMode = 'kwh'; // 'kwh' | 'inr' (for precise mode)

  // DOM Elements Cache
  const elements = {};

  // ---------------------------------------------------------------------------
  // 2. Input Normalization Functions
  // ---------------------------------------------------------------------------

  /**
   * Safe non-negative number parser
   * @param {any} val 
   * @returns {number|null} returns null if invalid or negative
   */
  function parsePositiveNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    const num = Number(val);
    if (isNaN(num) || num < 0) return null;
    return num;
  }

  /**
   * Normalizes raw inputs from Estimated Mode into standard numerical inputs
   * @param {Object} raw 
   * @returns {Object} Normalized numerical schema
   */
  function normalizeEstimatedInputs(raw) {
    const data = (typeof ECO_DATA !== 'undefined' && ECO_DATA.estimatedDefaults)
      ? ECO_DATA.estimatedDefaults
      : {
          transport: {
            vehicleFactors: {
              petrolCar: 0.1708,
              electricCar: 0.1270,
              twoWheeler: 0.0600,
              publicTransit: 0.0400,
              mixedTransport: 0.0950,
              activeClean: 0.0000
            },
            distanceMidpointsKm: { short: 7, moderate: 18, long: 35, extensive: 65 },
            frequencyDaysPerWeek: { daily: 5.5, regular: 3.5, occasional: 1.5 }
          },
          energy: {
            householdSizeMidpoints: { '1': 1.0, '2': 2.0, '3_4': 3.5, '5_plus': 5.5 },
            electricityMidpointsKWh: { veryLow: 45, low: 85, moderate: 180, high: 360 },
            lpgRefillFrequenciesPerYear: { everyMonth: 12.0, everyTwoMonths: 6.0, everyThreeMonths: 4.0, everyFourToSixMonths: 2.4, noLpg: 0.0 }
          },
          waste: {
            generationMidpointsKgPerMonth: { low: 15, moderate: 35, high: 75, veryHigh: 130 },
            practiceFactors: { segregatedComposting: 0.08, regularRecycling: 0.20, unsegregatedDisposal: 0.45 }
          }
        };

    // A. Transportation
    const method = raw.transportMethod || 'petrolCar';
    const distTier = raw.distanceRange || 'moderate';
    const freqTier = raw.travelFrequency || 'daily';

    const dailyKm = data.transport.distanceMidpointsKm[distTier] !== undefined
      ? data.transport.distanceMidpointsKm[distTier]
      : 18;
    const daysPerWeek = data.transport.frequencyDaysPerWeek[freqTier] !== undefined
      ? data.transport.frequencyDaysPerWeek[freqTier]
      : 5.5;

    const annualDistanceKm = dailyKm * daysPerWeek * 52;
    const vehicleFactor = data.transport.vehicleFactors[method] !== undefined
      ? data.transport.vehicleFactors[method]
      : 0.1708;

    // B. Household Energy
    const members = data.energy.householdSizeMidpoints[raw.householdSize] !== undefined
      ? data.energy.householdSizeMidpoints[raw.householdSize]
      : 3.5;

    const monthlyElecKWh = data.energy.electricityMidpointsKWh[raw.electricityLevel] !== undefined
      ? data.energy.electricityMidpointsKWh[raw.electricityLevel]
      : 180;
    const annualElecKWh = monthlyElecKWh * 12;

    const lpgRefillsPerYear = data.energy.lpgRefillFrequenciesPerYear[raw.lpgRefill] !== undefined
      ? data.energy.lpgRefillFrequenciesPerYear[raw.lpgRefill]
      : 4.0;
    const cylinderSizeKg = parseFloat(raw.lpgSize) || 14.2;
    const annualLpgKg = lpgRefillsPerYear * cylinderSizeKg;

    // C. Household Waste
    const wasteGenTier = raw.wasteGen || 'moderate';
    const monthlyWasteKg = data.waste.generationMidpointsKgPerMonth[wasteGenTier] !== undefined
      ? data.waste.generationMidpointsKgPerMonth[wasteGenTier]
      : 35;
    const annualWasteKg = monthlyWasteKg * 12;

    const practiceKey = raw.wastePractice || 'regularRecycling';
    const wasteFactor = data.waste.practiceFactors[practiceKey] !== undefined
      ? data.waste.practiceFactors[practiceKey]
      : 0.20;

    return {
      mode: 'estimated',
      transport: {
        method: method,
        annualDistanceKm: annualDistanceKm,
        vehicleFactor: vehicleFactor,
        details: { dailyKm, daysPerWeek }
      },
      energy: {
        householdMembers: members,
        annualElectricityKWh: annualElecKWh,
        monthlyElectricityKWh: monthlyElecKWh,
        annualLpgKg: annualLpgKg,
        monthlyLpgKg: annualLpgKg / 12,
        cylinderSizeKg: cylinderSizeKg
      },
      waste: {
        householdAnnualWasteKg: annualWasteKg,
        householdMonthlyWasteKg: monthlyWasteKg,
        practiceFactor: wasteFactor,
        practiceKey: practiceKey
      }
    };
  }

  /**
   * Normalizes raw inputs from Precise Mode into standard numerical inputs
   * @param {Object} raw 
   * @returns {Object} Normalized numerical schema
   */
  function normalizePreciseInputs(raw) {
    const factors = (typeof ECO_DATA !== 'undefined' && ECO_DATA.emissionFactors)
      ? ECO_DATA.emissionFactors
      : {
          transport: {
            petrolCarPerKm: 0.1708,
            dieselCarPerKm: 0.1684,
            cngCarPerKm: 0.1380,
            electricCarPerKm: 0.1046,
            scooterSmallPerKm: 0.0440,
            motorcycleMediumPerKm: 0.0840,
            electricTwoWheelerPerKm: 0.0236,
            busPerKm: 0.0450,
            trainMetroPerKm: 0.0304
          },
          energy: {
            electricityPerKWh: 0.675,
            lpgPerKg: 2.993,
            avgElectricityTariffInr: 6.5
          },
          waste: {
            unsegregatedDisposalPerKg: 0.45,
            regularRecyclingPerKg: 0.20,
            segregatedCompostingPerKg: 0.08
          }
        };

    // A. Transportation
    let carAnnualKm = 0;
    let carFactor = 0;
    if (raw.carFuelType && raw.carFuelType !== 'none') {
      const dist = parsePositiveNumber(raw.carDistance) || 0;
      carAnnualKm = raw.carFrequency === 'monthly' ? dist * 12 : dist * 52;
      switch (raw.carFuelType) {
        case 'petrol': carFactor = factors.transport.petrolCarPerKm; break;
        case 'diesel': carFactor = factors.transport.dieselCarPerKm; break;
        case 'cng': carFactor = factors.transport.cngCarPerKm; break;
        case 'electric': carFactor = factors.transport.electricCarPerKm; break;
        default: carFactor = 0;
      }
    }

    let twoWheelerAnnualKm = 0;
    let twoWheelerFactor = 0;
    if (raw.twowheelerType && raw.twowheelerType !== 'none') {
      const dist = parsePositiveNumber(raw.twowheelerDistance) || 0;
      twoWheelerAnnualKm = raw.twowheelerFrequency === 'monthly' ? dist * 12 : dist * 52;
      switch (raw.twowheelerType) {
        case 'scooterSmall': twoWheelerFactor = factors.transport.scooterSmallPerKm; break;
        case 'motorcycleMedium': twoWheelerFactor = factors.transport.motorcycleMediumPerKm; break;
        case 'electricTwoWheeler': twoWheelerFactor = factors.transport.electricTwoWheelerPerKm; break;
        default: twoWheelerFactor = 0;
      }
    }

    const busDistance = parsePositiveNumber(raw.busDistance) || 0;
    const busAnnualKm = busDistance * 52;

    const trainDistance = parsePositiveNumber(raw.trainDistance) || 0;
    const trainAnnualKm = trainDistance * 52;

    // B. Household Energy
    const members = Math.max(1, parseInt(raw.householdMembers, 10) || 1);

    // Electricity
    let monthlyElecKWh = 0;
    const rawElec = parsePositiveNumber(raw.electricityValue) || 0;
    if (raw.electricityMode === 'inr') {
      monthlyElecKWh = rawElec / (factors.energy.avgElectricityTariffInr || 7.0);
    } else {
      monthlyElecKWh = rawElec;
    }
    const annualElecKWh = monthlyElecKWh * 12;

    // LPG
    let annualLpgKg = 0;
    const cylinderSizeKg = parseFloat(raw.lpgCylinderSize) || 14.2;
    if (raw.lpgMode === 'cylinders') {
      const cylCount = parsePositiveNumber(raw.lpgCylinderCount) || 0;
      annualLpgKg = cylCount * cylinderSizeKg;
    } else if (raw.lpgMode === 'directKg') {
      const monthlyKg = parsePositiveNumber(raw.lpgKgAmount) || 0;
      annualLpgKg = monthlyKg * 12;
    } else {
      annualLpgKg = 0;
    }

    // C. Household Waste
    const wasteQty = parsePositiveNumber(raw.wasteQuantity) || 0;
    const monthlyWasteKg = raw.wasteFrequency === 'weekly' ? (wasteQty * 52) / 12 : wasteQty;
    const annualWasteKg = monthlyWasteKg * 12;

    let wasteFactor = factors.waste.regularRecyclingPerKg;
    switch (raw.wastePractice) {
      case 'segregatedComposting': wasteFactor = factors.waste.segregatedCompostingPerKg; break;
      case 'regularRecycling': wasteFactor = factors.waste.regularRecyclingPerKg; break;
      case 'unsegregatedDisposal': wasteFactor = factors.waste.unsegregatedDisposalPerKg; break;
      default: wasteFactor = factors.waste.regularRecyclingPerKg;
    }

    return {
      mode: 'precise',
      transport: {
        carAnnualKm,
        carFactor,
        twoWheelerAnnualKm,
        twoWheelerFactor,
        busAnnualKm,
        trainAnnualKm
      },
      energy: {
        householdMembers: members,
        annualElectricityKWh: annualElecKWh,
        monthlyElectricityKWh: monthlyElecKWh,
        annualLpgKg: annualLpgKg,
        monthlyLpgKg: annualLpgKg / 12,
        cylinderSizeKg: cylinderSizeKg
      },
      waste: {
        householdAnnualWasteKg: annualWasteKg,
        householdMonthlyWasteKg: monthlyWasteKg,
        practiceFactor: wasteFactor,
        practiceKey: raw.wastePractice || 'regularRecycling'
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Shared Calculation Engine
  // ---------------------------------------------------------------------------

  /**
   * Pure calculation function accepting normalized inputs from either mode.
   * Calculates Transportation, Energy (Electricity & LPG), and Household Waste.
   * @param {Object} normalized 
   * @returns {Object} Structured results matching requirements
   */
  function calculateFootprintFromNormalizedInputs(normalized) {
    const factors = (typeof ECO_DATA !== 'undefined' && ECO_DATA.emissionFactors)
      ? ECO_DATA.emissionFactors
      : {
          transport: { busPerKm: 0.0450, trainMetroPerKm: 0.0304 },
          energy: { electricityPerKWh: 0.675, lpgPerKg: 2.993 },
          waste: { unsegregatedDisposalPerKg: 0.45, regularRecyclingPerKg: 0.20, segregatedCompostingPerKg: 0.08 }
        };

    const benchmarks = (typeof ECO_DATA !== 'undefined' && ECO_DATA.benchmarks)
      ? ECO_DATA.benchmarks
      : {
          indiaHouseholdAverageTonnes: 1.3,
          globalHouseholdAverageTonnes: 3.2
        };

    // 1. Transportation
    let transportAnnualKg = 0;
    if (normalized.mode === 'estimated') {
      transportAnnualKg = normalized.transport.annualDistanceKm * normalized.transport.vehicleFactor;
    } else {
      const carKg = normalized.transport.carAnnualKm * normalized.transport.carFactor;
      const twoWheelerKg = normalized.transport.twoWheelerAnnualKm * normalized.transport.twoWheelerFactor;
      const busKg = normalized.transport.busAnnualKm * factors.transport.busPerKm;
      const trainKg = normalized.transport.trainAnnualKm * factors.transport.trainMetroPerKm;
      transportAnnualKg = carKg + twoWheelerKg + busKg + trainKg;
    }
    const transportMonthlyKg = transportAnnualKg / 12;

    // 2. Household Energy (Combines Electricity & LPG)
    const members = Math.max(1, normalized.energy.householdMembers || 1);

    // Electricity (per-capita)
    const indAnnualKWh = normalized.energy.annualElectricityKWh / members;
    const electricityAnnualKg = indAnnualKWh * factors.energy.electricityPerKWh;
    const electricityMonthlyKg = electricityAnnualKg / 12;

    // LPG (per-capita)
    const indAnnualLpgKg = normalized.energy.annualLpgKg / members;
    const lpgAnnualKg = indAnnualLpgKg * factors.energy.lpgPerKg;
    const lpgMonthlyKg = lpgAnnualKg / 12;

    // Combined Energy
    const energyAnnualKg = electricityAnnualKg + lpgAnnualKg;
    const energyMonthlyKg = electricityMonthlyKg + lpgMonthlyKg;

    const electricityEnergyPct = energyAnnualKg > 0 ? (electricityAnnualKg / energyAnnualKg) * 100 : 0;
    const lpgEnergyPct = energyAnnualKg > 0 ? (lpgAnnualKg / energyAnnualKg) * 100 : 0;

    // 3. Household Waste (per-capita)
    const indAnnualWasteKg = normalized.waste.householdAnnualWasteKg / members;
    const wasteAnnualKg = indAnnualWasteKg * normalized.waste.practiceFactor;
    const wasteMonthlyKg = wasteAnnualKg / 12;

    // Overall Totals
    const totalAnnualKg = transportAnnualKg + energyAnnualKg + wasteAnnualKg;
    const totalMonthlyKg = totalAnnualKg / 12;
    const totalAnnualTonnes = totalAnnualKg / 1000;

    // Category Percentages
    const calcPct = (catKg) => totalAnnualKg > 0 ? (catKg / totalAnnualKg) * 100 : 0;
    const transportPct = calcPct(transportAnnualKg);
    const energyPct = calcPct(energyAnnualKg);
    const wastePct = calcPct(wasteAnnualKg);

    // Benchmarks & Equivalents
    const indiaBaseline = benchmarks.indiaHouseholdAverageTonnes || 1.3;
    const globalBaseline = benchmarks.globalHouseholdAverageTonnes || 3.2;

    const vsIndiaPct = ((totalAnnualTonnes - indiaBaseline) / indiaBaseline) * 100;
    const vsGlobalPct = ((totalAnnualTonnes - globalBaseline) / globalBaseline) * 100;

    // Rating
    let rating = 'low';
    let ratingText = 'Low Footprint • Below National Baseline';
    let ratingClass = 'badge-emerald';

    if (totalAnnualTonnes > 2.5) {
      rating = 'high';
      ratingText = 'High Footprint • Action Strongly Recommended';
      ratingClass = 'badge-amber';
    } else if (totalAnnualTonnes >= 1.3) {
      rating = 'moderate';
      ratingText = 'Moderate Footprint • Near National Baseline';
      ratingClass = 'badge-lime';
    }

    // Top Category Determination
    const categoryRanks = [
      { id: 'transport', name: 'Transportation', kg: transportAnnualKg, pct: transportPct },
      { id: 'energy', name: 'Household Energy', kg: energyAnnualKg, pct: energyPct },
      { id: 'waste', name: 'Household Waste', kg: wasteAnnualKg, pct: wastePct }
    ];
    categoryRanks.sort((a, b) => b.kg - a.kg);
    const topCategory = categoryRanks[0];

    return {
      calculatedAt: new Date().toISOString(),
      calculationMode: normalized.mode,
      normalizedInputs: normalized,
      totals: {
        annualKg: totalAnnualKg,
        monthlyKg: totalMonthlyKg,
        annualTonnes: totalAnnualTonnes
      },
      breakdown: {
        transport: {
          annualKg: transportAnnualKg,
          monthlyKg: transportMonthlyKg,
          percentage: transportPct
        },
        energy: {
          annualKg: energyAnnualKg,
          monthlyKg: energyMonthlyKg,
          percentage: energyPct,
          electricity: {
            annualKg: electricityAnnualKg,
            monthlyKg: electricityMonthlyKg,
            percentageOfEnergy: electricityEnergyPct,
            percentageOfTotal: calcPct(electricityAnnualKg),
            annualKWh: indAnnualKWh
          },
          lpg: {
            annualKg: lpgAnnualKg,
            monthlyKg: lpgMonthlyKg,
            percentageOfEnergy: lpgEnergyPct,
            percentageOfTotal: calcPct(lpgAnnualKg)
          }
        },
        waste: {
          annualKg: wasteAnnualKg,
          monthlyKg: wasteMonthlyKg,
          percentage: wastePct
        }
      },
      equivalents: {
        vsIndiaPct,
        vsGlobalPct,
        rating,
        ratingText,
        ratingClass,
        topCategory
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 3.5. Historical Snapshot Helper (Phase 5)
  // ---------------------------------------------------------------------------

  /**
   * Appends a lightweight snapshot of calculation results to STORAGE_KEYS.HISTORY.
   * Defensively prevents duplicate records for identical calculation events.
   * Leaves STORAGE_KEYS.FOOTPRINT completely unchanged.
   * @param {Object} resultData 
   */
  function saveFootprintHistorySnapshot(resultData) {
    if (!resultData || typeof EcoStorage === 'undefined' || typeof STORAGE_KEYS === 'undefined') return;

    try {
      const existing = EcoStorage.get(STORAGE_KEYS.HISTORY, []);
      const historyList = Array.isArray(existing) ? existing : [];

      const timestamp = resultData.calculatedAt || new Date().toISOString();
      const annualKg = Math.round((resultData.totals ? resultData.totals.annualKg : 0) * 100) / 100;
      const annualTonnes = Math.round((resultData.totals ? resultData.totals.annualTonnes : 0) * 100) / 100;
      const mode = resultData.calculationMode || 'estimated';

      // Duplicate prevention: check exact timestamp or recent identical calculation
      const isDuplicate = historyList.some(entry => {
        if (!entry) return false;
        if (entry.timestamp === timestamp) return true;
        if (entry.mode === mode && Math.abs(entry.annualKg - annualKg) < 0.001) {
          const entryTime = new Date(entry.timestamp).getTime();
          const currTime = new Date(timestamp).getTime();
          if (!isNaN(entryTime) && !isNaN(currTime) && Math.abs(currTime - entryTime) < 3000) {
            return true;
          }
        }
        return false;
      });

      if (!isDuplicate) {
        const transportKg = resultData.breakdown && resultData.breakdown.transport
          ? Math.round(resultData.breakdown.transport.annualKg * 100) / 100 : 0;
        const energyKg = resultData.breakdown && resultData.breakdown.energy
          ? Math.round(resultData.breakdown.energy.annualKg * 100) / 100 : 0;
        const wasteKg = resultData.breakdown && resultData.breakdown.waste
          ? Math.round(resultData.breakdown.waste.annualKg * 100) / 100 : 0;
        const elecKg = resultData.breakdown && resultData.breakdown.energy && resultData.breakdown.energy.electricity
          ? Math.round(resultData.breakdown.energy.electricity.annualKg * 100) / 100 : 0;
        const lpgKg = resultData.breakdown && resultData.breakdown.energy && resultData.breakdown.energy.lpg
          ? Math.round(resultData.breakdown.energy.lpg.annualKg * 100) / 100 : 0;

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

        historyList.push(snapshot);

        // Cap history at 50 records to prevent storage exhaustion
        if (historyList.length > 50) {
          historyList.splice(0, historyList.length - 50);
        }

        EcoStorage.set(STORAGE_KEYS.HISTORY, historyList);
      }
    } catch (err) {
      console.warn('[EcoCalculator] Could not save historical snapshot:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Form Validation Engine
  // ---------------------------------------------------------------------------

  function setError(inputElem, errorElem, msg) {
    if (!inputElem) return;
    const group = inputElem.closest('.input-group') || inputElem;
    group.classList.add('has-error');
    if (errorElem) {
      if (msg) errorElem.textContent = msg;
      errorElem.classList.add('visible');
    }
  }

  function clearError(inputElem, errorElem) {
    if (!inputElem) return;
    const group = inputElem.closest('.input-group') || inputElem;
    group.classList.remove('has-error');
    if (errorElem) {
      errorElem.classList.remove('visible');
    }
  }

  function validateEstimatedStep(stepNum) {
    // In Estimated mode, inputs are predefined <select> options with valid default midpoints
    return true;
  }

  function validatePreciseStep1() {
    let isValid = true;
    const carFuel = elements.carFuelType ? elements.carFuelType.value : 'none';
    const twoWheeler = elements.twowheelerType ? elements.twowheelerType.value : 'none';

    if (carFuel !== 'none') {
      const val = elements.carDistance ? elements.carDistance.value.trim() : '';
      const num = Number(val);
      if (val !== '' && (isNaN(num) || num < 0)) {
        setError(elements.carDistance, elements.carDistanceError, 'Please enter a valid positive distance (0 or more).');
        isValid = false;
      } else {
        clearError(elements.carDistance, elements.carDistanceError);
      }
    } else {
      clearError(elements.carDistance, elements.carDistanceError);
    }

    if (twoWheeler !== 'none') {
      const val = elements.twowheelerDistance ? elements.twowheelerDistance.value.trim() : '';
      const num = Number(val);
      if (val !== '' && (isNaN(num) || num < 0)) {
        setError(elements.twowheelerDistance, elements.twowheelerDistanceError, 'Please enter a valid positive distance (0 or more).');
        isValid = false;
      } else {
        clearError(elements.twowheelerDistance, elements.twowheelerDistanceError);
      }
    } else {
      clearError(elements.twowheelerDistance, elements.twowheelerDistanceError);
    }

    const busVal = elements.busDistance ? elements.busDistance.value.trim() : '';
    const busNum = Number(busVal);
    if (busVal !== '' && (isNaN(busNum) || busNum < 0)) {
      setError(elements.busDistance, elements.busDistanceError, 'Please enter a valid positive distance (0 or more).');
      isValid = false;
    } else {
      clearError(elements.busDistance, elements.busDistanceError);
    }

    const trainVal = elements.trainDistance ? elements.trainDistance.value.trim() : '';
    const trainNum = Number(trainVal);
    if (trainVal !== '' && (isNaN(trainNum) || trainNum < 0)) {
      setError(elements.trainDistance, elements.trainDistanceError, 'Please enter a valid positive distance (0 or more).');
      isValid = false;
    } else {
      clearError(elements.trainDistance, elements.trainDistanceError);
    }

    return isValid;
  }

  function validatePreciseStep2() {
    let isValid = true;

    // Household members: must be integer >= 1
    const membersVal = elements.householdMembers ? elements.householdMembers.value.trim() : '';
    const membersNum = parseInt(membersVal, 10);
    if (membersVal === '' || isNaN(membersNum) || membersNum < 1) {
      setError(elements.householdMembers, elements.householdMembersError, 'Household size must be at least 1 person.');
      isValid = false;
    } else {
      clearError(elements.householdMembers, elements.householdMembersError);
    }

    // Electricity
    const elecVal = elements.electricityValue ? elements.electricityValue.value.trim() : '';
    const elecNum = Number(elecVal);
    if (elecVal !== '' && (isNaN(elecNum) || elecNum < 0)) {
      setError(elements.electricityValue, elements.electricityError, 'Please enter a valid non-negative number.');
      isValid = false;
    } else {
      clearError(elements.electricityValue, elements.electricityError);
    }

    // LPG
    const lpgMode = elements.lpgMode ? elements.lpgMode.value : 'cylinders';
    if (lpgMode === 'cylinders') {
      const cylVal = elements.lpgCylinderCount ? elements.lpgCylinderCount.value.trim() : '';
      const cylNum = Number(cylVal);
      if (cylVal !== '' && (isNaN(cylNum) || cylNum < 0)) {
        setError(elements.lpgCylinderCount, elements.lpgCylinderError, 'Please enter a valid cylinder count (0 or more).');
        isValid = false;
      } else {
        clearError(elements.lpgCylinderCount, elements.lpgCylinderError);
      }
    } else if (lpgMode === 'directKg') {
      const kgVal = elements.lpgKgAmount ? elements.lpgKgAmount.value.trim() : '';
      const kgNum = Number(kgVal);
      if (kgVal !== '' && (isNaN(kgNum) || kgNum < 0)) {
        setError(elements.lpgKgAmount, elements.lpgKgError, 'Please enter a valid monthly kg amount (0 or more).');
        isValid = false;
      } else {
        clearError(elements.lpgKgAmount, elements.lpgKgError);
      }
    } else {
      clearError(elements.lpgCylinderCount, elements.lpgCylinderError);
      clearError(elements.lpgKgAmount, elements.lpgKgError);
    }

    return isValid;
  }

  function validatePreciseStep3() {
    let isValid = true;
    const wasteVal = elements.wasteQuantity ? elements.wasteQuantity.value.trim() : '';
    const wasteNum = Number(wasteVal);
    if (wasteVal !== '' && (isNaN(wasteNum) || wasteNum < 0)) {
      setError(elements.wasteQuantity, elements.wasteQuantityError, 'Please enter a valid positive waste amount (0 or more).');
      isValid = false;
    } else {
      clearError(elements.wasteQuantity, elements.wasteQuantityError);
    }
    return isValid;
  }

  // ---------------------------------------------------------------------------
  // 5. Form Input Readers & Populators
  // ---------------------------------------------------------------------------

  function getEstimatedInputsFromUI() {
    return {
      transportMethod: elements.estTransportMethod ? elements.estTransportMethod.value : 'petrolCar',
      distanceRange: elements.estDistanceRange ? elements.estDistanceRange.value : 'moderate',
      travelFrequency: elements.estTravelFrequency ? elements.estTravelFrequency.value : 'daily',
      householdSize: elements.estHouseholdSize ? elements.estHouseholdSize.value : '3_4',
      electricityLevel: elements.estElectricityLevel ? elements.estElectricityLevel.value : 'moderate',
      lpgRefill: elements.estLpgRefill ? elements.estLpgRefill.value : 'everyThreeMonths',
      lpgSize: elements.estLpgSize ? elements.estLpgSize.value : '14.2',
      wasteGen: elements.estWasteGen ? elements.estWasteGen.value : 'moderate',
      wastePractice: elements.estWastePractice ? elements.estWastePractice.value : 'regularRecycling'
    };
  }

  function getPreciseInputsFromUI() {
    return {
      carFuelType: elements.carFuelType ? elements.carFuelType.value : 'petrol',
      carDistance: elements.carDistance ? elements.carDistance.value : '0',
      carFrequency: elements.carFrequency ? elements.carFrequency.value : 'weekly',
      twowheelerType: elements.twowheelerType ? elements.twowheelerType.value : 'scooterSmall',
      twowheelerDistance: elements.twowheelerDistance ? elements.twowheelerDistance.value : '0',
      twowheelerFrequency: elements.twowheelerFrequency ? elements.twowheelerFrequency.value : 'weekly',
      busDistance: elements.busDistance ? elements.busDistance.value : '0',
      trainDistance: elements.trainDistance ? elements.trainDistance.value : '0',
      householdMembers: elements.householdMembers ? elements.householdMembers.value : '1',
      electricityMode: electricityMode,
      electricityValue: elements.electricityValue ? elements.electricityValue.value : '0',
      lpgMode: elements.lpgMode ? elements.lpgMode.value : 'cylinders',
      lpgCylinderSize: elements.lpgCylinderSize ? elements.lpgCylinderSize.value : '14.2',
      lpgCylinderCount: elements.lpgCylinderCount ? elements.lpgCylinderCount.value : '0',
      lpgKgAmount: elements.lpgKgAmount ? elements.lpgKgAmount.value : '0',
      wasteQuantity: elements.wasteQuantity ? elements.wasteQuantity.value : '0',
      wasteFrequency: elements.wasteFrequency ? elements.wasteFrequency.value : 'weekly',
      wastePractice: elements.wastePractice ? elements.wastePractice.value : 'regularRecycling'
    };
  }

  function populateEstimatedUI(inputs) {
    if (!inputs) return;
    if (elements.estTransportMethod && inputs.transportMethod) elements.estTransportMethod.value = inputs.transportMethod;
    if (elements.estDistanceRange && inputs.distanceRange) elements.estDistanceRange.value = inputs.distanceRange;
    if (elements.estTravelFrequency && inputs.travelFrequency) elements.estTravelFrequency.value = inputs.travelFrequency;
    if (elements.estHouseholdSize && inputs.householdSize) elements.estHouseholdSize.value = inputs.householdSize;
    if (elements.estElectricityLevel && inputs.electricityLevel) elements.estElectricityLevel.value = inputs.electricityLevel;
    if (elements.estLpgRefill && inputs.lpgRefill) elements.estLpgRefill.value = inputs.lpgRefill;
    if (elements.estLpgSize && inputs.lpgSize) elements.estLpgSize.value = inputs.lpgSize;
    if (elements.estWasteGen && inputs.wasteGen) elements.estWasteGen.value = inputs.wasteGen;
    if (elements.estWastePractice && inputs.wastePractice) elements.estWastePractice.value = inputs.wastePractice;
    if (typeof window !== 'undefined' && typeof window.initCustomSelects === 'function') {
      window.initCustomSelects();
    }
  }

  function populatePreciseUI(inputs) {
    if (!inputs) return;
    if (elements.carFuelType && inputs.carFuelType !== undefined) {
      elements.carFuelType.value = inputs.carFuelType;
      handleCarFuelTypeChange();
    }
    if (elements.carDistance && inputs.carDistance !== undefined) elements.carDistance.value = inputs.carDistance;
    if (elements.carFrequency && inputs.carFrequency !== undefined) {
      elements.carFrequency.value = inputs.carFrequency;
      handleCarFrequencyChange();
    }
    if (elements.twowheelerType && inputs.twowheelerType !== undefined) {
      elements.twowheelerType.value = inputs.twowheelerType;
      handleTwoWheelerTypeChange();
    }
    if (elements.twowheelerDistance && inputs.twowheelerDistance !== undefined) elements.twowheelerDistance.value = inputs.twowheelerDistance;
    if (elements.twowheelerFrequency && inputs.twowheelerFrequency !== undefined) {
      elements.twowheelerFrequency.value = inputs.twowheelerFrequency;
      handleTwoWheelerFrequencyChange();
    }
    if (elements.busDistance && inputs.busDistance !== undefined) elements.busDistance.value = inputs.busDistance;
    if (elements.trainDistance && inputs.trainDistance !== undefined) elements.trainDistance.value = inputs.trainDistance;
    if (elements.householdMembers && inputs.householdMembers !== undefined) elements.householdMembers.value = inputs.householdMembers;
    if (inputs.electricityMode) setElectricityMode(inputs.electricityMode);
    if (elements.electricityValue && inputs.electricityValue !== undefined) elements.electricityValue.value = inputs.electricityValue;
    if (elements.lpgMode && inputs.lpgMode !== undefined) {
      elements.lpgMode.value = inputs.lpgMode;
      handleLpgModeChange();
    }
    if (elements.lpgCylinderSize && inputs.lpgCylinderSize !== undefined) elements.lpgCylinderSize.value = inputs.lpgCylinderSize;
    if (elements.lpgCylinderCount && inputs.lpgCylinderCount !== undefined) elements.lpgCylinderCount.value = inputs.lpgCylinderCount;
    if (elements.lpgKgAmount && inputs.lpgKgAmount !== undefined) elements.lpgKgAmount.value = inputs.lpgKgAmount;
    if (elements.wasteQuantity && inputs.wasteQuantity !== undefined) elements.wasteQuantity.value = inputs.wasteQuantity;
    if (elements.wasteFrequency && inputs.wasteFrequency !== undefined) {
      elements.wasteFrequency.value = inputs.wasteFrequency;
      handleWasteFrequencyChange();
    }
    if (elements.wastePractice && inputs.wastePractice !== undefined) elements.wastePractice.value = inputs.wastePractice;
    if (typeof window !== 'undefined' && typeof window.initCustomSelects === 'function') {
      window.initCustomSelects();
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Mode Switcher & Wizard Navigation
  // ---------------------------------------------------------------------------

  function setCalculationMode(mode) {
    activeMode = mode === 'precise' ? 'precise' : 'estimated';

    const wizardElem = document.querySelector('.calculator-wizard');
    if (wizardElem) {
      wizardElem.setAttribute('data-mode', activeMode);
    }

    if (elements.modeCardEstimated) {
      const isEst = activeMode === 'estimated';
      elements.modeCardEstimated.classList.toggle('active', isEst);
      elements.modeCardEstimated.setAttribute('aria-checked', isEst ? 'true' : 'false');
    }

    if (elements.modeCardPrecise) {
      const isPrec = activeMode === 'precise';
      elements.modeCardPrecise.classList.toggle('active', isPrec);
      elements.modeCardPrecise.setAttribute('aria-checked', isPrec ? 'true' : 'false');
    }
  }

  function goToStep(targetStep, skipValidation = false) {
    if (targetStep < 1 || targetStep > 4) return;

    // Validate if moving forward
    if (!skipValidation && targetStep > currentStep) {
      if (activeMode === 'estimated') {
        if (currentStep === 1 && !validateEstimatedStep(1)) return;
        if (currentStep === 2 && !validateEstimatedStep(2)) return;
        if (currentStep === 3 && !validateEstimatedStep(3)) return;
      } else {
        if (currentStep === 1 && !validatePreciseStep1()) return;
        if (currentStep === 2 && !validatePreciseStep2()) return;
        if (currentStep === 3 && !validatePreciseStep3()) return;
      }
    }

    currentStep = targetStep;

    // Toggle panels
    for (let i = 1; i <= 4; i++) {
      const panel = document.getElementById(`step-panel-${i}`);
      const navItem = document.getElementById(`step-nav-${i}`);

      if (panel) {
        panel.classList.toggle('active', i === currentStep);
      }

      if (navItem) {
        navItem.classList.remove('active', 'completed');
        if (i === currentStep) {
          navItem.classList.add('active');
          navItem.setAttribute('aria-current', 'step');
        } else if (i < currentStep) {
          navItem.classList.add('completed');
          navItem.removeAttribute('aria-current');
        } else {
          navItem.removeAttribute('aria-current');
        }
      }
    }

    // Progress bar width (4 steps -> 0%, 33.3%, 66.7%, 100%)
    if (elements.stepProgressBar) {
      const progressWidths = { 1: '0%', 2: '33.33%', 3: '66.66%', 4: '100%' };
      elements.stepProgressBar.style.width = progressWidths[currentStep] || '0%';
    }

    // Smooth scroll to wizard
    const wizardElem = document.querySelector('.calculator-wizard');
    if (wizardElem && typeof wizardElem.getBoundingClientRect === 'function') {
      const rect = wizardElem.getBoundingClientRect();
      if (rect && rect.top < 0 && typeof wizardElem.scrollIntoView === 'function') {
        wizardElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function handleCalculate() {
    let rawInputs;
    let normalizedInputs;

    if (activeMode === 'estimated') {
      if (!validateEstimatedStep(1) || !validateEstimatedStep(2) || !validateEstimatedStep(3)) return;
      rawInputs = getEstimatedInputsFromUI();
      normalizedInputs = normalizeEstimatedInputs(rawInputs);
    } else {
      if (!validatePreciseStep1() || !validatePreciseStep2() || !validatePreciseStep3()) return;
      rawInputs = getPreciseInputsFromUI();
      normalizedInputs = normalizePreciseInputs(rawInputs);
    }

    const resultData = calculateFootprintFromNormalizedInputs(normalizedInputs);
    resultData.originalInputs = rawInputs;

    // Save to LocalStorage defensively
    if (typeof EcoStorage !== 'undefined' && typeof STORAGE_KEYS !== 'undefined') {
      EcoStorage.set(STORAGE_KEYS.FOOTPRINT, resultData);
      saveFootprintHistorySnapshot(resultData);
    }

    // Render results
    renderResults(resultData);

    // Advance to Step 4
    goToStep(4, true);
  }

  // ---------------------------------------------------------------------------
  // 7. Results Dashboard Rendering
  // ---------------------------------------------------------------------------

  function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
  }

  function getInsightForTopCategory(topCategory, breakdown) {
    if (topCategory.id === 'transport') {
      return {
        text: `Transportation is your highest emission category (${Math.round(topCategory.pct)}% of total). Shifting daily commutes to metro rail, public transit, carpooling, or electric mobility provides the fastest carbon reduction.`,
        link: 'tips.html#transport'
      };
    } else if (topCategory.id === 'energy') {
      const elecKg = breakdown.energy.electricity.annualKg;
      const lpgKg = breakdown.energy.lpg.annualKg;
      if (elecKg >= lpgKg) {
        return {
          text: `Household Energy is your largest emission contributor (${Math.round(topCategory.pct)}% of total), driven predominantly by grid electricity. Setting AC to 24°C, switching to 5-star BLDC appliances, and considering rooftop solar will yield major savings.`,
          link: 'tips.html#energy'
        };
      } else {
        return {
          text: `Household Energy accounts for ${Math.round(topCategory.pct)}% of your footprint, with significant domestic cooking gas usage. Using pressure cookers, covering cooking pots, and utilizing electric induction for boiling can cut cooking fuel consumption by 20–30%.`,
          link: 'tips.html#energy'
        };
      }
    } else {
      return {
        text: `Household Waste is your leading emission source (${Math.round(topCategory.pct)}% of total). Initiating home composting of organic kitchen waste and recycling dry paper/plastics directly mitigates anaerobic landfill methane generation.`,
        link: 'tips.html#waste'
      };
    }
  }

  function renderResults(data) {
    const { totals, breakdown, equivalents, calculationMode } = data;

    // Mode Indicator & Scope Callout
    if (elements.resultsModeBadge) {
      if (calculationMode === 'estimated') {
        elements.resultsModeBadge.textContent = 'Estimated Calculation Mode';
        elements.resultsModeBadge.className = 'results-mode-badge badge-estimated';
      } else {
        elements.resultsModeBadge.textContent = 'Precise Calculation Mode';
        elements.resultsModeBadge.className = 'results-mode-badge badge-precise';
      }
    }

    if (elements.resultsModeDisclaimer) {
      if (calculationMode === 'estimated') {
        elements.resultsModeDisclaimer.textContent = 'This footprint is based on your lifestyle choices and representative category assumptions. It provides an indicative baseline for understanding your primary impact areas.';
      } else {
        elements.resultsModeDisclaimer.textContent = 'This footprint uses your provided usage values. Note that all carbon footprints remain estimates because emission factors, grid transmission variations, and lifecycle boundaries have inherent limitations.';
      }
    }

    // Totals Hero Card
    if (elements.resTotalTonnes) elements.resTotalTonnes.textContent = totals.annualTonnes.toFixed(2);
    if (elements.resTotalKg) elements.resTotalKg.textContent = formatNumber(totals.annualKg);
    if (elements.resMonthlyKg) elements.resMonthlyKg.textContent = formatNumber(totals.monthlyKg);

    if (elements.resBenchmarkBadge) {
      elements.resBenchmarkBadge.textContent = equivalents.ratingText;
      elements.resBenchmarkBadge.className = `results-rating-pill ${equivalents.ratingClass}`;
    }

    // 1. Transportation Card
    if (elements.resTransportAnnual) elements.resTransportAnnual.textContent = formatNumber(breakdown.transport.annualKg);
    if (elements.resTransportMonthly) elements.resTransportMonthly.textContent = formatNumber(breakdown.transport.monthlyKg);
    if (elements.resTransportPct) elements.resTransportPct.textContent = Math.round(breakdown.transport.percentage);

    // 2. Household Energy Card (Electricity + LPG Combined)
    if (elements.resEnergyAnnual) elements.resEnergyAnnual.textContent = formatNumber(breakdown.energy.annualKg);
    if (elements.resEnergyMonthly) elements.resEnergyMonthly.textContent = formatNumber(breakdown.energy.monthlyKg);
    if (elements.resEnergyPct) elements.resEnergyPct.textContent = Math.round(breakdown.energy.percentage);

    if (elements.resElectricityAnnual) elements.resElectricityAnnual.textContent = formatNumber(breakdown.energy.electricity.annualKg);
    if (elements.resElectricitySubpct) elements.resElectricitySubpct.textContent = Math.round(breakdown.energy.electricity.percentageOfEnergy);

    if (elements.resLpgAnnual) elements.resLpgAnnual.textContent = formatNumber(breakdown.energy.lpg.annualKg);
    if (elements.resLpgSubpct) elements.resLpgSubpct.textContent = Math.round(breakdown.energy.lpg.percentageOfEnergy);

    // 3. Household Waste Card
    if (elements.resWasteAnnual) elements.resWasteAnnual.textContent = formatNumber(breakdown.waste.annualKg);
    if (elements.resWasteMonthly) elements.resWasteMonthly.textContent = formatNumber(breakdown.waste.monthlyKg);
    if (elements.resWastePct) elements.resWastePct.textContent = Math.round(breakdown.waste.percentage);

    // Equivalency Grid
    if (elements.resCompareIndia) {
      const diff = Math.round(equivalents.vsIndiaPct);
      elements.resCompareIndia.textContent = (diff > 0 ? `+${diff}%` : `${diff}%`);
      elements.resCompareIndia.style.color = diff <= 0 ? 'var(--accent-lime)' : 'var(--accent-amber)';
    }
    if (elements.resCompareIndiaDesc) {
      const absDiff = Math.abs(Math.round(equivalents.vsIndiaPct));
      elements.resCompareIndiaDesc.textContent = equivalents.vsIndiaPct <= 0
        ? `${absDiff}% below the national household baseline (1.3 t).`
        : `${absDiff}% above the national household baseline (1.3 t).`;
    }

    if (elements.resCompareGlobal) {
      const diff = Math.round(equivalents.vsGlobalPct);
      elements.resCompareGlobal.textContent = (diff > 0 ? `+${diff}%` : `${diff}%`);
      elements.resCompareGlobal.style.color = diff <= 0 ? 'var(--action-emerald)' : 'var(--accent-amber)';
    }
    if (elements.resCompareGlobalDesc) {
      const absDiff = Math.abs(Math.round(equivalents.vsGlobalPct));
      elements.resCompareGlobalDesc.textContent = equivalents.vsGlobalPct <= 0
        ? `${absDiff}% below the global household baseline (3.2 t).`
        : `${absDiff}% above the global household baseline (3.2 t).`;
    }

    // Tailored Personalized Insight
    const insight = getInsightForTopCategory(equivalents.topCategory, breakdown);
    if (elements.resInsightText) elements.resInsightText.textContent = insight.text;
    if (elements.resInsightLink) elements.resInsightLink.setAttribute('href', insight.link);

    // Update CSS Fallback Bars
    updateFallbackBars(breakdown);

    // Render Chart.js Donut Chart
    renderDonutChart(breakdown);
  }

  function updateFallbackBars(breakdown) {
    const updateBar = (barElem, pctElem, pct) => {
      const rounded = Math.round(pct);
      if (barElem) barElem.style.width = `${rounded}%`;
      if (pctElem) pctElem.textContent = `${rounded}%`;
    };

    updateBar(elements.fbTransportBar, elements.fbTransportPct, breakdown.transport.percentage);
    updateBar(elements.fbEnergyBar, elements.fbEnergyPct, breakdown.energy.percentage);
    updateBar(elements.fbWasteBar, elements.fbWastePct, breakdown.waste.percentage);
  }

  function renderDonutChart(breakdown) {
    const chartCanvas = document.getElementById('carbonChart');
    const chartContainer = document.getElementById('chart-container');
    const fallbackContainer = document.getElementById('fallback-chart');

    if (!chartCanvas || typeof Chart === 'undefined') {
      if (chartContainer) chartContainer.style.display = 'none';
      if (fallbackContainer) fallbackContainer.style.display = 'block';
      return;
    }

    if (chartContainer) chartContainer.style.display = 'block';
    if (fallbackContainer) fallbackContainer.style.display = 'none';

    const dataValues = [
      Math.round(breakdown.transport.annualKg),
      Math.round(breakdown.energy.annualKg),
      Math.round(breakdown.waste.annualKg)
    ];

    if (chartInstance) {
      chartInstance.data.datasets[0].data = dataValues;
      chartInstance.update();
      return;
    }

    try {
      const ctx = chartCanvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Transportation', 'Household Energy', 'Household Waste'],
          datasets: [{
            data: dataValues,
            backgroundColor: [
              '#10b981', // Action Emerald
              '#a3e635', // Accent Lime
              '#38bdf8'  // Sky Cyan
            ],
            borderColor: '#0f2c22',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#061610',
              borderColor: '#245443',
              borderWidth: 1,
              titleColor: '#fbf8ee',
              bodyColor: '#6ee7b7',
              padding: 12,
              boxPadding: 6,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return ` ${val.toLocaleString()} kg CO₂e (${pct}%)`;
                }
              }
            }
          },
          animation: {
            duration: 800,
            easing: 'easeOutQuart'
          }
        }
      });
    } catch (e) {
      console.warn('[EcoTrack] Chart.js init error, using fallback progress bars:', e);
      if (chartContainer) chartContainer.style.display = 'none';
      if (fallbackContainer) fallbackContainer.style.display = 'block';
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Interactive Control Handlers
  // ---------------------------------------------------------------------------

  function handleCarFuelTypeChange() {
    if (!elements.carFuelType || !elements.carDistanceGroup) return;
    const isNone = elements.carFuelType.value === 'none';
    elements.carDistanceGroup.style.display = isNone ? 'none' : 'grid';
    if (isNone) clearError(elements.carDistance, elements.carDistanceError);
  }

  function handleCarFrequencyChange() {
    if (!elements.carFrequency || !elements.carUnitLabel) return;
    elements.carUnitLabel.textContent = elements.carFrequency.value === 'monthly' ? 'km / month' : 'km / week';
  }

  function handleTwoWheelerTypeChange() {
    if (!elements.twowheelerType || !elements.twowheelerDistanceGroup) return;
    const isNone = elements.twowheelerType.value === 'none';
    elements.twowheelerDistanceGroup.style.display = isNone ? 'none' : 'grid';
    if (isNone) clearError(elements.twowheelerDistance, elements.twowheelerDistanceError);
  }

  function handleTwoWheelerFrequencyChange() {
    if (!elements.twowheelerFrequency || !elements.twowheelerUnitLabel) return;
    elements.twowheelerUnitLabel.textContent = elements.twowheelerFrequency.value === 'monthly' ? 'km / month' : 'km / week';
  }

  function setElectricityMode(mode) {
    electricityMode = mode;
    if (mode === 'inr') {
      if (elements.btnModeInr) {
        elements.btnModeInr.classList.add('active');
        elements.btnModeInr.setAttribute('aria-selected', 'true');
      }
      if (elements.btnModeKwh) {
        elements.btnModeKwh.classList.remove('active');
        elements.btnModeKwh.setAttribute('aria-selected', 'false');
      }
      if (elements.electricityUnitLabel) elements.electricityUnitLabel.textContent = '₹ / month';
      if (elements.electricityHint) {
        elements.electricityHint.innerHTML = 'Converted using state tariff rate &rarr; calculated at <strong>0.675 kg CO₂ / kWh</strong> (CEA Baseline Ver. 22.0, August 2026, for FY 2025–26 busbar net generation).';
      }
    } else {
      if (elements.btnModeKwh) {
        elements.btnModeKwh.classList.add('active');
        elements.btnModeKwh.setAttribute('aria-selected', 'true');
      }
      if (elements.btnModeInr) {
        elements.btnModeInr.classList.remove('active');
        elements.btnModeInr.setAttribute('aria-selected', 'false');
      }
      if (elements.electricityUnitLabel) elements.electricityUnitLabel.textContent = 'kWh / month';
      if (elements.electricityHint) {
        elements.electricityHint.innerHTML = 'Grid Factor: <strong>0.675 kg CO₂ / kWh</strong>. (Source: CEA Baseline Database Version 22.0, August 2026, for FY 2025–26 busbar net generation; excludes T&amp;D losses).';
      }
    }
  }

  function handleLpgModeChange() {
    if (!elements.lpgMode) return;
    const mode = elements.lpgMode.value;

    if (elements.lpgCylinderGroup) {
      elements.lpgCylinderGroup.style.display = mode === 'cylinders' ? 'block' : 'none';
      if (mode !== 'cylinders') clearError(elements.lpgCylinderCount, elements.lpgCylinderError);
    }

    if (elements.lpgKgGroup) {
      elements.lpgKgGroup.style.display = mode === 'directKg' ? 'block' : 'none';
      if (mode !== 'directKg') clearError(elements.lpgKgAmount, elements.lpgKgError);
    }
  }

  function handleWasteFrequencyChange() {
    if (!elements.wasteFrequency || !elements.wasteUnitLabel) return;
    elements.wasteUnitLabel.textContent = elements.wasteFrequency.value === 'monthly' ? 'kg / month' : 'kg / week';
  }

  // ---------------------------------------------------------------------------
  // 9. DOM Caching & Event Binding
  // ---------------------------------------------------------------------------

  function cacheDomElements() {
    // Mode cards
    elements.modeCardEstimated = document.getElementById('mode-card-estimated');
    elements.modeCardPrecise = document.getElementById('mode-card-precise');

    // Progress bar
    elements.stepProgressBar = document.getElementById('step-progress-bar');

    // Estimated Mode Form Elements
    elements.estTransportMethod = document.getElementById('est-transport-method');
    elements.estDistanceRange = document.getElementById('est-distance-range');
    elements.estTravelFrequency = document.getElementById('est-travel-frequency');
    elements.estHouseholdSize = document.getElementById('est-household-size');
    elements.estElectricityLevel = document.getElementById('est-electricity-level');
    elements.estLpgRefill = document.getElementById('est-lpg-refill');
    elements.estLpgSize = document.getElementById('est-lpg-size');
    elements.estWasteGen = document.getElementById('est-waste-gen');
    elements.estWastePractice = document.getElementById('est-waste-practice');

    elements.btnNextStep1Est = document.getElementById('btn-next-step-1-est');
    elements.btnBackStep2Est = document.getElementById('btn-back-step-2-est');
    elements.btnNextStep2Est = document.getElementById('btn-next-step-2-est');
    elements.btnBackStep3Est = document.getElementById('btn-back-step-3-est');
    elements.btnCalculateEst = document.getElementById('btn-calculate-est');

    // Precise Mode Form Elements
    elements.carFuelType = document.getElementById('car-fuel-type');
    elements.carDistance = document.getElementById('car-distance');
    elements.carFrequency = document.getElementById('car-frequency');
    elements.carDistanceGroup = document.getElementById('car-distance-group');
    elements.carUnitLabel = document.getElementById('car-unit-label');
    elements.carDistanceError = document.getElementById('car-distance-error');

    elements.twowheelerType = document.getElementById('twowheeler-type');
    elements.twowheelerDistance = document.getElementById('twowheeler-distance');
    elements.twowheelerFrequency = document.getElementById('twowheeler-frequency');
    elements.twowheelerDistanceGroup = document.getElementById('twowheeler-distance-group');
    elements.twowheelerUnitLabel = document.getElementById('twowheeler-unit-label');
    elements.twowheelerDistanceError = document.getElementById('twowheeler-distance-error');

    elements.busDistance = document.getElementById('bus-distance');
    elements.busDistanceError = document.getElementById('bus-distance-error');
    elements.trainDistance = document.getElementById('train-distance');
    elements.trainDistanceError = document.getElementById('train-distance-error');

    elements.householdMembers = document.getElementById('household-members');
    elements.householdMembersError = document.getElementById('household-members-error');

    elements.btnModeKwh = document.getElementById('btn-mode-kwh');
    elements.btnModeInr = document.getElementById('btn-mode-inr');
    elements.electricityValue = document.getElementById('electricity-value');
    elements.electricityUnitLabel = document.getElementById('electricity-unit-label');
    elements.electricityHint = document.getElementById('electricity-hint');
    elements.electricityError = document.getElementById('electricity-error');

    // Tariff Helper (Bill-only users)
    elements.toggleTariffHelper = document.getElementById('toggle-tariff-helper');
    elements.tariffHelperInputs = document.getElementById('tariff-helper-inputs');
    elements.tariffHelperToggleIcon = document.getElementById('tariff-helper-toggle-icon');
    elements.billAmountInput = document.getElementById('bill-amount-input');
    elements.manualTariffInput = document.getElementById('manual-tariff-input');
    elements.btnApplyBillConversion = document.getElementById('btn-apply-bill-conversion');

    elements.lpgMode = document.getElementById('lpg-mode');
    elements.lpgCylinderGroup = document.getElementById('lpg-cylinder-group');
    elements.lpgCylinderSize = document.getElementById('lpg-cylinder-size');
    elements.lpgCylinderCount = document.getElementById('lpg-cylinder-count');
    elements.lpgCylinderError = document.getElementById('lpg-cylinder-error');
    elements.lpgKgGroup = document.getElementById('lpg-kg-group');
    elements.lpgKgAmount = document.getElementById('lpg-kg-amount');
    elements.lpgKgError = document.getElementById('lpg-kg-error');

    elements.wasteQuantity = document.getElementById('waste-quantity');
    elements.wasteUnitLabel = document.getElementById('waste-unit-label');
    elements.wasteFrequency = document.getElementById('waste-frequency');
    elements.wastePractice = document.getElementById('waste-practice');
    elements.wasteQuantityError = document.getElementById('waste-quantity-error');

    elements.btnNextStep1 = document.getElementById('btn-next-step-1');
    elements.btnBackStep2 = document.getElementById('btn-back-step-2');
    elements.btnNextStep2 = document.getElementById('btn-next-step-2');
    elements.btnBackStep3 = document.getElementById('btn-back-step-3');
    elements.btnCalculate = document.getElementById('btn-calculate');
    elements.btnEditInputs = document.getElementById('btn-edit-inputs');

    // Step 4: Results Elements
    elements.resultsModeCallout = document.getElementById('results-mode-callout');
    elements.resultsModeBadge = document.getElementById('results-mode-badge');
    elements.resultsModeDisclaimer = document.getElementById('results-mode-disclaimer');

    elements.resTotalTonnes = document.getElementById('res-total-tonnes');
    elements.resTotalKg = document.getElementById('res-total-kg');
    elements.resMonthlyKg = document.getElementById('res-monthly-kg');
    elements.resBenchmarkBadge = document.getElementById('res-benchmark-badge');

    elements.resTransportAnnual = document.getElementById('res-transport-annual');
    elements.resTransportMonthly = document.getElementById('res-transport-monthly');
    elements.resTransportPct = document.getElementById('res-transport-pct');

    elements.resEnergyAnnual = document.getElementById('res-energy-annual');
    elements.resEnergyMonthly = document.getElementById('res-energy-monthly');
    elements.resEnergyPct = document.getElementById('res-energy-pct');
    elements.resElectricityAnnual = document.getElementById('res-electricity-annual');
    elements.resElectricitySubpct = document.getElementById('res-electricity-subpct');
    elements.resLpgAnnual = document.getElementById('res-lpg-annual');
    elements.resLpgSubpct = document.getElementById('res-lpg-subpct');

    elements.resWasteAnnual = document.getElementById('res-waste-annual');
    elements.resWasteMonthly = document.getElementById('res-waste-monthly');
    elements.resWastePct = document.getElementById('res-waste-pct');

    elements.resCompareIndia = document.getElementById('res-compare-india');
    elements.resCompareIndiaDesc = document.getElementById('res-compare-india-desc');
    elements.resCompareGlobal = document.getElementById('res-compare-global');
    elements.resCompareGlobalDesc = document.getElementById('res-compare-global-desc');

    elements.resInsightText = document.getElementById('res-insight-text');
    elements.resInsightLink = document.getElementById('res-insight-link');

    elements.fbTransportBar = document.getElementById('fb-transport-bar');
    elements.fbTransportPct = document.getElementById('fb-transport-pct');
    elements.fbEnergyBar = document.getElementById('fb-energy-bar');
    elements.fbEnergyPct = document.getElementById('fb-energy-pct');
    elements.fbWasteBar = document.getElementById('fb-waste-bar');
    elements.fbWastePct = document.getElementById('fb-waste-pct');
  }

  function bindEvents() {
    // Mode Card Selector
    if (elements.modeCardEstimated) {
      elements.modeCardEstimated.addEventListener('click', () => setCalculationMode('estimated'));
      elements.modeCardEstimated.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setCalculationMode('estimated');
        }
      });
    }

    if (elements.modeCardPrecise) {
      elements.modeCardPrecise.addEventListener('click', () => setCalculationMode('precise'));
      elements.modeCardPrecise.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setCalculationMode('precise');
        }
      });
    }

    // Step Nav Clicks
    for (let i = 1; i <= 4; i++) {
      const navBtn = document.getElementById(`step-nav-${i}`);
      if (navBtn) {
        navBtn.addEventListener('click', () => {
          if (i < currentStep) {
            goToStep(i, true);
          } else if (i > currentStep) {
            goToStep(i);
          }
        });
      }
    }

    // Estimated Mode Wizard Actions
    if (elements.btnNextStep1Est) {
      elements.btnNextStep1Est.addEventListener('click', () => {
        if (validateEstimatedStep(1)) goToStep(2);
      });
    }
    if (elements.btnBackStep2Est) {
      elements.btnBackStep2Est.addEventListener('click', () => goToStep(1));
    }
    if (elements.btnNextStep2Est) {
      elements.btnNextStep2Est.addEventListener('click', () => {
        if (validateEstimatedStep(2)) goToStep(3);
      });
    }
    if (elements.btnBackStep3Est) {
      elements.btnBackStep3Est.addEventListener('click', () => goToStep(2));
    }
    if (elements.btnCalculateEst) {
      elements.btnCalculateEst.addEventListener('click', handleCalculate);
    }

    // Precise Mode Wizard Actions
    if (elements.btnNextStep1) {
      elements.btnNextStep1.addEventListener('click', () => {
        if (validatePreciseStep1()) goToStep(2);
      });
    }
    if (elements.btnBackStep2) {
      elements.btnBackStep2.addEventListener('click', () => goToStep(1));
    }
    if (elements.btnNextStep2) {
      elements.btnNextStep2.addEventListener('click', () => {
        if (validatePreciseStep2()) goToStep(3);
      });
    }
    if (elements.btnBackStep3) {
      elements.btnBackStep3.addEventListener('click', () => goToStep(2));
    }
    if (elements.btnCalculate) {
      elements.btnCalculate.addEventListener('click', handleCalculate);
    }

    // Recalculate
    if (elements.btnEditInputs) {
      elements.btnEditInputs.addEventListener('click', () => goToStep(1));
    }

    // Precise Form Controls
    if (elements.carFuelType) elements.carFuelType.addEventListener('change', handleCarFuelTypeChange);
    if (elements.carFrequency) elements.carFrequency.addEventListener('change', handleCarFrequencyChange);
    if (elements.twowheelerType) elements.twowheelerType.addEventListener('change', handleTwoWheelerTypeChange);
    if (elements.twowheelerFrequency) elements.twowheelerFrequency.addEventListener('change', handleTwoWheelerFrequencyChange);

    if (elements.btnModeKwh) elements.btnModeKwh.addEventListener('click', () => setElectricityMode('kwh'));
    if (elements.btnModeInr) elements.btnModeInr.addEventListener('click', () => setElectricityMode('inr'));

    // Tariff Helper Event Handlers
    if (elements.toggleTariffHelper && elements.tariffHelperInputs) {
      elements.toggleTariffHelper.addEventListener('click', () => {
        const isHidden = elements.tariffHelperInputs.style.display === 'none' || elements.tariffHelperInputs.style.display === '';
        elements.tariffHelperInputs.style.display = isHidden ? 'block' : 'none';
        if (elements.tariffHelperToggleIcon) {
          elements.tariffHelperToggleIcon.innerHTML = isHidden ? '&#9652;' : '&#9662;';
        }
      });
    }

    if (elements.btnApplyBillConversion && elements.billAmountInput && elements.manualTariffInput && elements.electricityValue) {
      elements.btnApplyBillConversion.addEventListener('click', () => {
        const bill = parseFloat(elements.billAmountInput.value);
        const tariff = parseFloat(elements.manualTariffInput.value);
        if (!isNaN(bill) && bill >= 0 && !isNaN(tariff) && tariff > 0) {
          const kwh = Math.round((bill / tariff) * 10) / 10;
          elements.electricityValue.value = kwh;
          clearError(elements.electricityValue, elements.electricityError);
        }
      });
    }

    if (elements.lpgMode) elements.lpgMode.addEventListener('change', handleLpgModeChange);
    if (elements.wasteFrequency) elements.wasteFrequency.addEventListener('change', handleWasteFrequencyChange);

    // Live Validation Error Clearing
    const inputErrorPairs = [
      [elements.carDistance, elements.carDistanceError],
      [elements.twowheelerDistance, elements.twowheelerDistanceError],
      [elements.busDistance, elements.busDistanceError],
      [elements.trainDistance, elements.trainDistanceError],
      [elements.householdMembers, elements.householdMembersError],
      [elements.electricityValue, elements.electricityError],
      [elements.lpgCylinderCount, elements.lpgCylinderError],
      [elements.lpgKgAmount, elements.lpgKgError],
      [elements.wasteQuantity, elements.wasteQuantityError]
    ];

    inputErrorPairs.forEach(([inputElem, errorElem]) => {
      if (inputElem) {
        inputElem.addEventListener('input', () => {
          const num = Number(inputElem.value.trim());
          if (!isNaN(num) && num >= 0) {
            clearError(inputElem, errorElem);
          }
        });
      }
    });

    // Form submit prevention
    const form = document.getElementById('calculator-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCalculate();
      });
    }
  }

  function init() {
    cacheDomElements();
    bindEvents();

    // Check LocalStorage for saved footprint
    let savedData = null;
    if (typeof EcoStorage !== 'undefined' && typeof STORAGE_KEYS !== 'undefined') {
      savedData = EcoStorage.get(STORAGE_KEYS.FOOTPRINT, null);
    }

    if (savedData && savedData.originalInputs) {
      // Manual (Estimated) Mode is always selected by default on fresh visits to the Calculator
      setCalculationMode('estimated');

      if (savedData.calculationMode === 'estimated') {
        populateEstimatedUI(savedData.originalInputs);
      } else {
        populatePreciseUI(savedData.originalInputs);
      }

      renderResults(savedData);

      if (window.location.hash === '#results') {
        if (savedData.calculationMode) {
          setCalculationMode(savedData.calculationMode);
        }
        goToStep(4, true);
      } else {
        goToStep(1, true);
      }
    } else {
      setCalculationMode('estimated');
      goToStep(1, true);
    }

    if (typeof window !== 'undefined' && typeof window.initCustomSelects === 'function') {
      window.initCustomSelects();
    }
  }

  // Run on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Expose on window for automated testing and dashboard compatibility
  if (typeof window !== 'undefined') {
    window.EcoCalculator = {
      init: init,
      setMode: setCalculationMode,
      getMode: () => activeMode,
      goToStep: goToStep,
      normalizeEstimatedInputs: normalizeEstimatedInputs,
      normalizePreciseInputs: normalizePreciseInputs,
      calculate: calculateFootprintFromNormalizedInputs,
      validatePreciseStep1: validatePreciseStep1,
      validatePreciseStep2: validatePreciseStep2,
      validatePreciseStep3: validatePreciseStep3,
      renderResults: renderResults,
      saveHistorySnapshot: saveFootprintHistorySnapshot
    };
  }

})();
