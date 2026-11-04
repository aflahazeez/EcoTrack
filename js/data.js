/**
 * EcoTrack – Scientific Emission Factors & Static Content Data
 * Sustainable Intelligence & Carbon Analytics Platform (Phase 3 Final Scientific Audit)
 * 
 * Centralized, traceable greenhouse gas emission factors and benchmark constants.
 * Scope: Transportation, Household Energy (Electricity & LPG), and Household Waste.
 * 
 * Strict Scientific Accounting Standards:
 * - Electricity: Generation-based factor from Central Electricity Authority (CEA) CO2 Baseline Database
 *   Version 22.0 (August 2026) for FY 2025–26: 0.675 t CO2/MWh = 0.675 kg CO2/kWh at busbar net generation.
 *   Excludes transmission & distribution (T&D) losses. Not a delivered electricity factor.
 * - LPG: Direct stoichiometric combustion CO2 factor from IPCC 2006 Guidelines (63.1 kg CO2/GJ @ 47.31 MJ/kg).
 * - Transportation: Clear distinction between vehicle-kilometre (vkm) and passenger-kilometre (pkm),
 *   tailpipe combustion vs. charging-only, and international proxies vs. empirical Indian ratings.
 * - Waste: Explicitly marked as a provisional heuristic model based on CPCB and IPCC Vol 5.
 * - CO2 vs CO2e Notice: Energy accounts for direct CO2; waste and proxy transport include non-CO2 gases (CO2e).
 *   Aggregated totals are presented cautiously as "Estimated Greenhouse Gas Emissions".
 */

const ECO_DATA = {
  // -------------------------------------------------------------------------
  // 1. Centralized Emission Factors
  // -------------------------------------------------------------------------
  emissionFactors: {
    transport: {
      // Petrol passenger car (UK DESNZ 2023 "Passenger vehicles" table, Average medium petrol car, 1.4-2.0L)
      // Boundary: Direct tailpipe Scope 1 emissions. Unit: kg CO2e / vkm.
      // Status: International proxy (UK Government GHG Conversion Factors 2023).
      petrolCarPerKm: 0.1708,

      // Diesel passenger car (UK DESNZ 2023 "Passenger vehicles" table, Average medium diesel car)
      // Boundary: Direct tailpipe Scope 1 emissions. Unit: kg CO2e / vkm.
      // Status: International proxy (UK Government GHG Conversion Factors 2023).
      dieselCarPerKm: 0.1684,

      // Compressed Natural Gas (CNG) passenger car (UK DESNZ 2023 "Passenger vehicles" table)
      // Boundary: Direct tailpipe Scope 1 emissions. Unit: kg CO2e / vkm.
      // Status: International proxy (UK Government GHG Conversion Factors 2023).
      cngCarPerKm: 0.1380,

      // Electric car charged on Indian national grid
      // Boundary: Scope 2 grid generation thermal stack CO2 charging-only at busbar (excludes T&D and vehicle manufacture).
      // Calculation: ARAI / BEE Indian passenger EV energy consumption benchmark (~0.155 kWh/vkm)
      // multiplied by CEA Database Version 22.0 weighted-average generation factor (0.675 kg CO2/kWh).
      // 0.155 * 0.675 = 0.104625 kg CO2 / vkm. Unit: kg CO2 / vkm.
      // Status: Derived engineering estimate based on official BEE EV ratings and CEA grid factor.
      electricCarPerKm: 0.1046,

      // Small scooter / moped (<125cc petrol)
      // Boundary: Direct Scope 1 tailpipe combustion CO2 (excludes upstream fuel refining and vehicle manufacture).
      // Calculation: ARAI certified test cycle benchmark for 100-110cc scooters (~52 km/L petrol fuel economy)
      // and IPCC 2006 Vol 2 motor gasoline combustion factor (2.31 kg CO2/L): 2.31 / 52 = 0.0444 kg CO2/vkm.
      // Unit: kg CO2 / vkm.
      // Status: Derived engineering estimate based on ARAI certified fuel economy benchmark.
      scooterSmallPerKm: 0.0440,

      // Medium motorcycle (125cc - 500cc petrol, UK DESNZ 2023 "Motorbikes" table)
      // Boundary: Direct tailpipe Scope 1 emissions. Unit: kg CO2e / vkm.
      // Status: International proxy (UK Government GHG Conversion Factors 2023).
      motorcycleMediumPerKm: 0.0840,

      // Electric two-wheeler (Indian electric scooter)
      // Boundary: Scope 2 grid generation thermal stack CO2 charging-only at busbar (excludes T&D).
      // Calculation: FAME-II / ARAI certified benchmark for electric two-wheelers (~0.035 kWh/vkm)
      // multiplied by CEA Database Version 22.0 generation factor (0.675 kg CO2/kWh): 0.035 * 0.675 = 0.0236 kg CO2/vkm.
      // Unit: kg CO2 / vkm.
      // Status: Derived engineering estimate based on ARAI EV ratings and CEA grid factor.
      electricTwoWheelerPerKm: 0.0236,

      // Urban public bus per passenger-km (pkm)
      // Boundary: Operational transit Scope 1 combustion allocated per passenger. Unit: kg CO2e / pkm.
      // Calculation: Adapted from UK DESNZ transit bus factors scaled for Indian urban bus average occupancy
      // (~30-35 passengers per bus according to Central Institute of Road Transport - CIRT annual reports).
      // Status: Provisional transit proxy.
      busPerKm: 0.0450,

      // Electric passenger train / metro per passenger-km (pkm)
      // Boundary: Scope 2 electric traction generation stack CO2 at busbar. Unit: kg CO2 / pkm.
      // Calculation: Delhi Metro Rail Corporation (DMRC) and Indian Railways electric traction statistics
      // (~0.045 kWh/pkm) multiplied by CEA Database Version 22.0 generation factor (0.675 kg CO2/kWh):
      // 0.045 * 0.675 = 0.030375 kg CO2 / pkm.
      // Status: Derived estimate based on DMRC/Indian Railways electric traction data and CEA grid factor.
      trainMetroPerKm: 0.0304,

      // Walking and cycling (Zero direct operational emissions during travel)
      // Boundary: Direct operational travel. Unit: kg CO2 / km.
      activeCleanPerKm: 0.0000
    },

    energy: {
      // Indian national grid electricity generation factor
      // Source: Central Electricity Authority (CEA), Ministry of Power, Government of India.
      // Publication: "CO2 Baseline Database for the Indian Power Sector, Version 22.0" (Published August 2026).
      // Official URL: https://cea.nic.in/cdm-co2-baseline-view?lang=en&mappingId=234
      // Reference Financial Year: FY 2025–26 (covering grid power stations net generation).
      // Weighted-Average Generation Factor: 0.675 t CO2 / MWh = 0.675 kg CO2e / kWh.
      // Boundary: Net electricity generation at power station busbars (Scope 2 direct thermal stack emissions).
      // Expressed in kg CO2e/kWh: CO2 is the universal reference gas (GWP = 1); non-CO2 stack gases from thermal generation are negligible (<0.5%).
      // CRITICAL DISCLOSURES:
      // 1. Strictly a generation-based factor, NOT a measured household-delivered electricity factor.
      // 2. Transmission and distribution (T&D) losses are NOT included.
      // 3. Upstream life-cycle coal mining, transport, and infrastructure embodied carbon are NOT included.
      electricityPerKWh: 0.675,

      // Complete Scope 1 residential combustion factor per kg LPG (including non-CO2 GHGs)
      // Source: IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Vol 2 (Energy), Ch 2, Table 2.2.
      // Global Warming Potentials (GWPs): IPCC Fifth Assessment Report (AR5) 100-year metrics (CO2 = 1, CH4 = 28, N2O = 265).
      // Rigorous Calculation:
      // - CO2: 63.1 kg CO2/GJ * 0.04731 GJ/kg NCV * 1 GWP = 2.98526 kg CO2e / kg
      // - CH4: 0.005 kg CH4/GJ * 0.04731 GJ/kg NCV * 28 GWP = 0.00662 kg CO2e / kg
      // - N2O: 0.0001 kg N2O/GJ * 0.04731 GJ/kg NCV * 265 GWP = 0.00125 kg CO2e / kg
      // - Total Non-CO2: 0.00662 + 0.00125 = 0.00788 kg CO2e / kg (approx. 0.11 kg CO2e per 14.2 kg cylinder)
      // - Combined Scope 1 combustion factor: 2.98526 + 0.00788 = 2.99314 ≈ 2.993 kg CO2e / kg LPG.
      // Boundary: Direct Scope 1 residential stationary combustion (excludes upstream fuel refining and delivery).
      lpgPerKg: 2.993,

      // Domestic & commercial LPG cylinder capacities in kg (with full CO2e values)
      lpgCylinderSizes: {
        mini: 5.0,          // 5 kg mini domestic cylinder (5 * 2.99314 = 14.97 kg CO2e)
        standard: 14.2,     // 14.2 kg standard domestic cylinder (14.2 * 2.99314 = 42.50 kg CO2e: 42.39 kg CO2 + 0.11 kg non-CO2)
        commercial: 19.0    // 19 kg commercial cylinder (19 * 2.99314 = 56.87 kg CO2e)
      }
    },

    waste: {
      // Household waste emission factors (kg CO2e per kg municipal solid waste)
      // PROVISIONAL HEURISTIC MODEL: Based on IPCC 2006 Vol 5 (Waste) Tier 1 first-order decay methane model
      // and Central Pollution Control Board (CPCB) municipal solid waste characterization (~50% organic biodegradable fraction).
      // Boundary: Landfill anaerobic methane (CH4) decomposition (Scope 3 indicative model). Unit: kg CO2e / kg.
      // Limitation: Real-world emissions depend heavily on landfill depth, moisture, compaction,
      // and ambient climate. These serve as indicative lifestyle scaling models, not exact measurements.
      unsegregatedDisposalPerKg: 0.45,   // Unsegregated municipal solid waste sent to open landfills
      regularRecyclingPerKg: 0.20,       // Dry recyclables (paper, plastic, metal) separated; organics to municipal bin
      segregatedCompostingPerKg: 0.08    // Full organic waste aerobic home composting + dry recyclables recycled
    }
  },

  // -------------------------------------------------------------------------
  // 2. Documented Representative Values for Estimated Calculation Mode
  // -------------------------------------------------------------------------
  estimatedDefaults: {
    transport: {
      // Representative vehicle emission factors (kg emissions / km)
      vehicleFactors: {
        petrolCar: 0.1708,      // UK DESNZ medium petrol car proxy (kg CO2e/km)
        dieselCar: 0.1684,      // UK DESNZ medium diesel car proxy (kg CO2e/km)
        cngCar: 0.1380,         // CNG car proxy (kg CO2e/km)
        electricCar: 0.1046,    // BEE EV rating * CEA Version 22.0 (0.675 kg CO2/km)
        twoWheeler: 0.0600,     // Blended two-wheeler average (~125cc ARAI / DESNZ proxy)
        publicTransit: 0.0380,  // Blended bus / metro urban transit average (pkm)
        mixedTransport: 0.0950, // Multimodal composite lifestyle proxy (avoids double-counting)
        activeClean: 0.0000     // Walking or bicycle (zero direct operational emissions)
      },
      // Representative daily travel distance midpoints (Round-Trip km / day)
      distanceMidpointsKm: {
        short: 7,               // Under 10 km/day round-trip (local errands)
        moderate: 18,           // 10–25 km/day round-trip (standard urban commute)
        long: 35,               // 25–50 km/day round-trip (suburban / cross-city commute)
        extensive: 65           // Over 50 km/day round-trip (regional commuter travel)
      },
      // Weekly commute frequency multipliers (commute days per week)
      frequencyDaysPerWeek: {
        daily: 5.5,             // 5–6 days/week regular commuter (~286 days/year)
        regular: 3.5,           // 3–4 days/week hybrid commuter (~182 days/year)
        occasional: 1.5         // 1–2 days/week occasional travel / remote (~78 days/year)
      }
    },

    energy: {
      // Representative household members midpoints for per-capita allocation
      householdSizeMidpoints: {
        '1': 1.0,               // Single occupant
        '2': 2.0,               // Couple or two roommates
        '3_4': 3.5,             // Standard 3–4 person family (midpoint 3.5)
        '5_plus': 5.5           // Extended household (midpoint 5.5)
      },
      // Representative monthly household electricity consumption midpoints (kWh / month)
      electricityMidpointsKWh: {
        veryLow: 45,            // Very low (<50 kWh/mo: LED lights, fans, zero heavy appliances)
        low: 85,                // Low (50–120 kWh/mo: lights, fans, TV, efficient fridge)
        moderate: 180,          // Moderate (120–250 kWh/mo: typical urban home, occasional seasonal AC)
        high: 360               // High (>250 kWh/mo: regular daily AC, electric geysers)
      },
      // Annual LPG cylinder refill frequencies (refills / year)
      lpgRefillFrequenciesPerYear: {
        everyMonth: 12.0,       // 1 refill/month (~12 cylinders/year)
        everyTwoMonths: 6.0,    // 1 refill/2 months (~6 cylinders/year)
        everyThreeMonths: 4.0,  // 1 refill/3 months (~4 cylinders/year)
        everyFourToSixMonths: 2.4, // 1 refill/5 months (~2.4 cylinders/year)
        noLpg: 0.0              // No LPG used (electric induction / solar cooking)
      }
    },

    waste: {
      // Representative monthly household waste generation midpoints (kg / month)
      generationMidpointsKgPerMonth: {
        low: 15,                // Low (<5 kg/wk: minimal packaging lifestyle)
        moderate: 35,           // Moderate (5–12 kg/wk: typical family waste generation)
        high: 75,               // High (12–25 kg/wk: frequent packaged goods)
        veryHigh: 130           // Very High (>25 kg/wk: heavy disposable packaging)
      },
      // Disposal & recycling practice emission factors (kg CO2e / kg waste)
      practiceFactors: {
        segregatedComposting: 0.08, // Organic composted + dry waste recycled
        regularRecycling: 0.20,     // Recyclables separated, organic to municipal bin
        unsegregatedDisposal: 0.45  // All waste sent to municipal landfill unsegregated
      }
    }
  },

  // -------------------------------------------------------------------------
  // 3. Traceable Source Documentation & Scope Catalog
  // -------------------------------------------------------------------------
  documentation: {
    electricity: {
      factor: 0.675,
      unit: "kg CO2e / kWh",
      sourceName: "Central Electricity Authority (CEA), Ministry of Power, Govt. of India",
      sourceRef: "CO2 Baseline Database for the Indian Power Sector, Version 22.0 (August 2026)",
      sourceUrl: "https://cea.nic.in/cdm-co2-baseline-view?lang=en&mappingId=234",
      reportingPeriod: "Fiscal Year 2025–2026 (FY 2025-26)",
      scope: "Scope 2 grid generation at busbar (power station net generation direct stack emissions)",
      assumptionsAndLimitations: "Official national weighted average emission rate for grid-connected power stations is 0.675 t CO2/MWh (0.675 kg CO2e/kWh) for FY 2025-26. CO2 is the universal reference gas (GWP = 1); stack non-CO2 gases from thermal generation are negligible (<0.5%). Accounting Boundary: Strictly net power station busbar generation. Does NOT include transmission and distribution (T&D) losses, nor upstream fuel mining/freight.",
      isProvisional: false
    },
    lpg: {
      factorPerKg: 2.993,
      factorPer14_2kgCylinder: 42.50,
      unit: "kg CO2e / kg LPG (and kg CO2e / 14.2 kg cylinder)",
      sourceName: "IPCC 2006 Guidelines for National Greenhouse Gas Inventories & IPCC AR5 GWP-100",
      sourceRef: "Volume 2 (Energy), Chapter 2 (Stationary Combustion), Tables 2.2 & 2.5",
      reportingPeriod: "2006 Guidelines with AR5 100-year GWPs",
      scope: "Direct residential stationary combustion Scope 1 CO2e",
      assumptionsAndLimitations: "Complete Scope 1 combustion factor: Stoichiometric direct CO2 (63.1 kg CO2/GJ * 0.04731 GJ/kg = 2.9853 kg CO2/kg, or 42.39 kg CO2 per 14.2 kg cylinder) PLUS non-CO2 greenhouse gases (0.005 kg CH4/GJ * 28 GWP + 0.0001 kg N2O/GJ * 265 GWP = 0.00788 kg CO2e/kg, or 0.11 kg CO2e per 14.2 kg cylinder). Combined Scope 1 total = 2.993 kg CO2e/kg (42.50 kg CO2e per 14.2 kg cylinder).",
      isProvisional: false
    },
    transport: {
      petrolCar: { factor: 0.1708, unit: "kg CO2e / vkm", source: "UK DESNZ / DEFRA (2023), Sheet 'Passenger vehicles', Row 'Cars (by size) - Medium car - Petrol', Column 'Direct GHGs'", boundary: "Scope 1 direct tailpipe combustion CO2e (excludes WTT and vehicle manufacture)", isProxy: true, notes: "Average medium petrol car (1.4-2.0L). International proxy." },
      dieselCar: { factor: 0.1684, unit: "kg CO2e / vkm", source: "UK DESNZ / DEFRA (2023), Sheet 'Passenger vehicles', Row 'Cars (by size) - Medium car - Diesel', Column 'Direct GHGs'", boundary: "Scope 1 direct tailpipe combustion CO2e (excludes WTT and vehicle manufacture)", isProxy: true, notes: "Medium diesel car international proxy." },
      cngCar: { factor: 0.1380, unit: "kg CO2e / vkm", source: "UK DESNZ (2023), Sheet 'Passenger vehicles', Row 'Cars (by size) - Medium car - CNG', Column 'Direct GHGs'", boundary: "Scope 1 direct tailpipe combustion CO2e", isProxy: true, notes: "CNG car international proxy." },
      electricCar: { factor: 0.1046, unit: "kg CO2e / vkm", source: "ARAI / BEE India EV rating (~0.155 kWh/vkm) * CEA Ver. 22.0 (0.675 kg CO2e/kWh)", boundary: "Scope 2 operational grid charging direct stack emissions at busbar (charging-only)", isProxy: false, notes: "Derived engineering estimate. Excludes T&D losses and battery manufacture." },
      scooterSmall: { factor: 0.0440, unit: "kg CO2e / vkm", source: "ARAI India benchmark (~52 km/L) * IPCC petrol combustion (2.308 kg CO2/L)", boundary: "Scope 1 direct tailpipe combustion CO2 reference gas component", isProxy: false, notes: "Derived engineering estimate for 100-110cc petrol scooter." },
      motorcycleMedium: { factor: 0.0840, unit: "kg CO2e / vkm", source: "UK DESNZ (2023), Sheet 'Motorbikes', Row 'Medium motorbike (> 125cc to 500cc)', Column 'Direct GHGs'", boundary: "Scope 1 direct tailpipe combustion CO2e", isProxy: true, notes: "Medium motorcycle proxy (125-500cc)." },
      electricTwoWheeler: { factor: 0.0236, unit: "kg CO2e / vkm", source: "ARAI / FAME-II benchmark (~0.035 kWh/vkm) * CEA Ver. 22.0 (0.675 kg CO2e/kWh)", boundary: "Scope 2 operational grid charging direct stack emissions at busbar", isProxy: false, notes: "Derived engineering estimate. Excludes T&D losses." },
      bus: { factor: 0.0450, unit: "kg CO2e / pkm", source: "CIRT India average occupancy (~30-35 pax) & UK DESNZ transit factor", boundary: "Operational passenger travel Scope 1 CO2e allocated per passenger-km", isProxy: true, notes: "Provisional transit proxy. Allocated per passenger-km (pkm)." },
      trainMetro: { factor: 0.0304, unit: "kg CO2e / pkm", source: "DMRC & Indian Railways electric traction (~0.045 kWh/pkm) * CEA Ver. 22.0 (0.675 kg CO2e/kWh)", boundary: "Scope 2 electric traction generation stack emissions at busbar per passenger-km", isProxy: false, notes: "Passenger-kilometre allocation (pkm) Scope 2 generation." },
      activeClean: { factor: 0.0000, unit: "kg CO2e / km", source: "Physical Principle", boundary: "Direct operational travel", isProxy: false, notes: "Zero direct operational emissions during travel." }
    },
    waste: {
      unsegregatedFactor: 0.45,
      recyclingFactor: 0.20,
      compostingFactor: 0.08,
      unit: "kg CO2e / kg waste",
      sourceName: "Central Pollution Control Board (CPCB) India & IPCC 2006 Waste Model",
      sourceRef: "CPCB Solid Waste Annual Report & IPCC Vol 5 (Waste)",
      reportingPeriod: "Provisional Heuristic",
      scope: "Landfill anaerobic methane decay (Scope 3 provisional)",
      assumptionsAndLimitations: "PROVISIONAL HEURISTIC MODEL: Real-world solid waste emissions depend heavily on organic biodegradable fraction (~50% in Indian MSW), moisture content, and whether disposal occurs in open unmanaged dumps or sanitary landfills. Aerobic composting avoids anaerobic methane formation. These factors provide indicative lifestyle models, not exact measurements."
    }
  }
};

// Expose on window object for browser accessibility
if (typeof window !== 'undefined') {
  window.ECO_DATA = ECO_DATA;
}

