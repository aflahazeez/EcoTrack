/**
 * EcoTrack – Scientific Emission Factors & Static Content Data
 * Sustainable Intelligence & Carbon Analytics Platform
 * 
 * Emission factors and benchmarks documented with precise authoritative sources.
 * Sources include:
 * - CEA (Central Electricity Authority, Ministry of Power, Govt. of India)
 * - IPCC (Intergovernmental Panel on Climate Change) 2006 Guidelines
 * - UK DESNZ / DEFRA (Dept. for Environment, Food & Rural Affairs) 2023 Factors
 * - Academic literature (Scarborough et al., Nature Food 2023; Poore & Nemecek, Science 2018)
 * - Global Carbon Project / Our World in Data (2022-2023)
 * - US EPA / Arbor Day Foundation forestry sequestration metrics
 * 
 * Note: Heuristic model multipliers are explicitly marked as such.
 */

const ECO_DATA = {
  // Emission Factors in kg CO2e per unit
  emissionFactors: {
    transport: {
      // Source: UK DESNZ / DEFRA Greenhouse Gas Conversion Factors 2023 (Average petrol car)
      // Unit: kg CO2e per vehicle kilometer
      petrolCarPerKm: 0.1708,

      // Source: UK DESNZ / DEFRA Greenhouse Gas Conversion Factors 2023 (Average diesel car)
      // Unit: kg CO2e per vehicle kilometer
      dieselCarPerKm: 0.1684,

      // Source: Calculated based on ~0.16 kWh/km average EV consumption charged on the All-India Grid mix
      // Indian Grid CEA factor ~0.72 kg CO2/kWh -> 0.16 * 0.72 ≈ 0.115 kg CO2e/km
      // (For comparison, renewable/UK grid EV is ~0.053 kg CO2e/km)
      // Unit: kg CO2e per vehicle kilometer
      electricVehiclePerKm: 0.115,

      // Source: UK DESNZ / DEFRA Greenhouse Gas Conversion Factors 2023 (Medium motorbike)
      // Unit: kg CO2e per vehicle kilometer
      motorcyclePerKm: 0.084,

      // Source: Heuristic mid-occupancy estimate based on Indian Urban Transit / DEFRA bus data
      // Local bus (~10 passengers) ~0.096 kg/pkm; intercity full coach ~0.027 kg/pkm; weighted blend ~0.045
      // Unit: kg CO2e per passenger kilometer
      busPerKm: 0.045,

      // Source: Indian Railways & CEA Electric Traction Benchmark
      // National passenger electric rail averages 0.015 - 0.035 kg CO2e per passenger kilometer
      // Unit: kg CO2e per passenger kilometer
      trainPerKm: 0.035
    },

    energy: {
      // Source: Central Electricity Authority (CEA) of India, "CO2 Baseline Database for the Indian Power Sector" (Version 18, 2023)
      // Weighted average emission factor at busbar: ~0.714 kg CO2/kWh.
      // Factoring in ~18% Transmission & Distribution (T&D) losses to consumer meter: 0.714 / (1 - 0.18) ≈ 0.82 kg CO2/kWh.
      // Unit: kg CO2e per kWh
      electricityPerKWh: 0.82,

      // Source: Stoichiometric combustion of a standard 14.2 kg domestic Indian LPG cylinder.
      // IPCC 2006 Guidelines for National Greenhouse Gas Inventories (Energy Volume, Stationary Combustion: ~63.1 g CO2/MJ, NCV 47.31 MJ/kg -> ~2.985 kg CO2/kg LPG).
      // Calculation: 14.2 kg * 2.985 kg CO2/kg = 42.39 kg CO2e.
      // Unit: kg CO2e per cylinder
      lpgCylinderKg: 42.4
    },

    diet: {
      // Source: Scarborough et al. (Nature Food 2023, "Vegans, vegetarians, fish-eaters and meat-eaters in the UK")
      // & Poore & Nemecek (Science 2018). Converted to annualized global adult benchmarks.
      // Unit: Annual kg CO2e per person
      heavyMeat: 2600,            // >100g meat / day
      averageOmnivore: 1800,      // 50-100g meat / day
      pescatarian: 1400,          // Fish-eater, no red/poultry meat
      vegetarian: 1100,           // Dairy/eggs, no meat (Indian vegetarian cohort benchmark)
      vegan: 850                  // 100% plant-based diet
    },

    waste: {
      // NOTE: These are HEURISTIC model multipliers adopted from consumer lifestyle calculators
      // (e.g. UC Berkeley CoolClimate Network, WWF Environmental Impact Calculator methodology).
      // They are NOT direct IPCC empirical constants, but lifestyle scaling approximations.
      lowWasteMultiplier: 0.85,   // Active recycler, composts organic food waste, avoids single-use plastics
      averageMultiplier: 1.0,     // Standard urban consumer packaging and waste profile
      highWasteMultiplier: 1.25   // Frequent single-use plastics, high packaging, no recycling
    }
  },

  // Benchmarks for Comparison & Real-World Context
  benchmarks: {
    // Source: Global Carbon Project (GCP) & Our World in Data (2022-2023)
    // India per-capita annual carbon emissions: ~1.9 to 2.0 metric tonnes CO2e
    indiaAverageTonnes: 1.9,

    // Source: International Energy Agency (IEA) & World Bank (2022-2023)
    // Global per-capita annual carbon emissions: ~4.5 to 4.7 metric tonnes CO2e
    globalAverageTonnes: 4.5,

    // Source: US EPA Greenhouse Gas Equivalencies & Arbor Day Foundation
    // An average urban mature tree absorbs approximately 48 lbs (21.77 kg) of CO2 per year over its growth lifespan.
    // (Note: Actual sequestration varies from 10 to 30 kg/year based on tree species, age, and tropical vs temperate climate)
    treeAbsorptionKgPerYear: 21.77
  }
};

// Expose on window object for cross-script browser accessibility
if (typeof window !== 'undefined') {
  window.ECO_DATA = ECO_DATA;
}
