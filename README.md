# EcoTrack 🌿

> **Sustainable Intelligence & Carbon Analytics Platform**  
> Developed for **TERRACODE 2026**, organized by the **FOSS Club, MEA Engineering College**.

EcoTrack is a lightweight environmental sustainability web application designed to help individuals understand their annual carbon footprint and cultivate long-term green habits.

The application runs on client-side web technologies with **zero backend dependencies**, storing user data as browser-local storage via the browser's `localStorage`.

---

## 📖 Table of Contents

- [Core Pages Architecture](#-core-pages-architecture)
- [Feature Status: Implemented vs. Planned](#-feature-status-implemented-vs-planned)
- [Technology Stack](#-technology-stack)
- [Browser-Local Data Storage](#-browser-local-data-storage)
- [Documented Emission Factors & Methodology](#-documented-emission-factors--methodology)
- [Project Structure](#-project-structure)
- [Local Setup Instructions](#-local-setup-instructions)
- [Development Roadmap](#-development-roadmap)
- [Limitations](#-limitations)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 📄 Core Pages Architecture

EcoTrack is designed around a five-page multi-page architecture:

1. **Home (`index.html`)**  
   *Current Status: Complete Landing Page (Phase 2).*  
   The central entry point introducing the platform's mission, four core pillars (Calculator, Habit Tracker, Knowledge Hub, Dashboard), documented environmental benchmarks, and a three-step workflow overview.

2. **Carbon Calculator (`calculator.html`)**  
   *Current Status: Completed (Phase 3).*  
   Interactive multi-step carbon footprint assessment engine featuring dual calculation modes (Estimated and Precise Mode), three audited categories (Transportation, Household Energy [combining Electricity and LPG], and Household Waste), verified emission factors (CEA busbar generation and IPCC stoichiometric combustion), Chart.js doughnut chart with CSS fallback progress bars, and browser-local persistence.

3. **Habit Tracker (`habits.html`)**  
   *Current Status: Foundation Shell.*  
   Houses the shared navigation and styling scaffolding. The daily sustainable commitment checklist, streak counter calculation, and achievement badges will be integrated in Phase 4.

4. **Eco-Tips & Knowledge Hub (`tips.html`)**  
   *Current Status: Foundation Shell.*  
   Houses the shared layout and category structure. The searchable sustainability guides and category filter system are planned for Phase 5.

5. **Impact Dashboard (`dashboard.html`)**  
   *Current Status: Foundation Shell.*  
   Houses the layout shell. The historical footprint comparison charts, habit progress summaries, and LocalStorage data management tools are scheduled for Phase 6.

---

## 🚦 Feature Status: Implemented vs. Planned

To maintain transparency, the platform's features are categorized into currently functioning foundation modules and upcoming phase deliverables:

### Implemented (Phases 1–3)
- **Dark Botanical Visual Identity:** Custom CSS design system using deep forest backgrounds (`#061610`), dark green surfaces (`#0F2C22`), emerald action buttons (`#10B981`), lime/sage data accents (`#A3E635`, `#6EE7B7`), and warm ivory text (`#FBF8EE`).
- **Atmospheric Backgrounds:** Multi-layered radial gradient mesh avoiding flat, empty dark voids.
- **Consistent Shared Navigation:** Uniform desktop header and responsive mobile drawer navigation across all five pages.
- **Accessible Mobile Interactions:** Mobile navigation with synchronized `aria-expanded` attributes, Escape key dismissal with focus restoration, and outside-click drawer closing.
- **Active Page Link Indication:** Automatic path-based highlighting for active navigation links.
- **Accessibility Foundations:** Integrated skip-to-content accessibility link (`.skip-link`) and visible high-contrast keyboard focus indicators (`:focus-visible`). *Accessibility features are actively implemented and tested across components.*
- **Landing Page Experience (`index.html`):** Completed landing page with hero introduction, dual Call-to-Actions, four core feature showcases, verified climate benchmarks, and responsive layout.
- **Dual-Mode Carbon Calculator (`calculator.html`, `js/calculator.js`):**
  - **Estimated Calculation Mode:** Qualitative lifestyle selections converted into documented representative midpoints for quick assessments.
  - **Precise Calculation Mode:** Direct numerical measurements with validation for distance, electricity (kWh with state tariff converter helper), cylinder/kg LPG, and waste.
  - **Three Focused Categories:** Transportation, Household Energy (combining Grid Electricity and Domestic LPG), and Household Waste.
  - **Shared Calculation Engine:** Unified numerical pipeline and defensive validation preventing silent arbitrary replacement.
  - **Visualizations:** Chart.js doughnut chart with pure-CSS fallback progress bars.
  - **Scientific Disclosures Card:** Clear boundary disclosures distinguishing Scope 1, Scope 2, and Scope 3 boundaries and explaining why all-sector comparisons are omitted.
- **Defensive Storage Engine (`js/storage.js`):** Centralized LocalStorage wrapper with corrupted JSON error handling, storage availability detection, and an in-memory session fallback (`_memoryFallback`) for restricted environments.
- **Traceable Emission Factors (`js/data.js`):** Centralized CEA, IPCC, and empirical factors with detailed source citations, boundary definitions, and uncertainty disclosures.

### Planned for Upcoming Phases
- [ ] **Dynamic Daily Habit Checklist:** Interactive checkboxes saving daily green actions to LocalStorage (Phase 4).
- [ ] **Streak & Badge Engine:** Date-difference algorithms calculating consecutive-day streaks and unlocking achievement badges (Phase 4).
- [ ] **Filterable & Searchable Knowledge Hub:** Dynamic client-side search and category filtering for eco-tips (Phase 5).
- [ ] **Data Management Controls:** Dashboard tools to view historical assessment logs and safely reset local records (Phase 6).

---

## 🛠️ Technology Stack

- **Markup:** Semantic [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) with ARIA landmarks.
- **Styling:** Vanilla [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) using CSS Custom Properties (variables), modern Flexbox, and CSS Grid. Zero external CSS frameworks.
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (body) and [Outfit](https://fonts.google.com/specimen/Outfit) (headings) loaded via Google Fonts CDN. *(Note: An active internet connection is required to fetch web font files; standard system sans-serif fonts are configured as local fallbacks if offline).*
- **Icons:** Lightweight inline and standalone [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) icons.
- **Scripting:** Modern [Vanilla JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) without frontend frameworks or bundlers.
- **State Management:** Browser [Web Storage API (`localStorage`)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) with in-memory fallback.

---

## 💾 Browser-Local Data Storage

EcoTrack operates without external databases, server-side APIs, or cloud user accounts. User metrics and habit records are stored as browser-local data using the browser's Web Storage API (`localStorage`) via `js/storage.js`:

- **Browser-Local Persistence:** Data is stored locally within the user's specific browser profile and does not transmit to external servers. It remains subject to the security, retention policies, and clearing mechanisms of the user's local browser and device.
- **Defensive Parsing:** Parsing operations are wrapped in `try...catch` blocks to ensure corrupted or invalid values never crash the application.
- **Private Browsing Fallback:** When `localStorage` is disabled or blocked (e.g., in private/incognito browsing or sandboxed iframes), operations fall back to an internal in-memory object so the site remains usable during that session.
- **No Application Telemetry:** The application codebase does not include analytics trackers, advertising scripts, or telemetry beacons.

---

## 🔬 Documented Emission Factors & Methodology

The emission factors and benchmarks configured in `js/data.js` are documented with their specific published literature, institutional references, or calculation assumptions, and are subject to ongoing review and verification:

| Category | Indicator | Configured Value | Documented Source & Calculation Assumptions |
| :--- | :--- | :--- | :--- |
| **Household Electricity** | Indian Grid Average (Busbar) | $0.675\text{ kg CO}_2\text{e / kWh}$ | Central Electricity Authority (CEA) of India, *CO₂ Baseline Database for the Indian Power Sector, Version 22.0* (Published August 2026, for FY 2025–26; [official CEA database link](https://cea.nic.in/cdm-co2-baseline-view?lang=en&mappingId=234)). National weighted-average emission rate: $0.675\text{ t CO}_2\text{/MWh} = 0.675\text{ kg CO}_2\text{/kWh}$. Generation-based factor at power station busbar (Scope 2 direct stack $\text{CO}_2$). Transmission and distribution (T&D) losses are excluded. Represented as $\text{CO}_2\text{e}$ for its $\text{CO}_2$ component ($\text{GWP} = 1$). |
| **Cooking Gas** | Domestic LPG Cylinder | $42.50\text{ kg CO}_2\text{e / cylinder}$ ($2.993\text{ kg CO}_2\text{e/kg}$) | Direct Scope 1 complete combustion calculation for standard Indian $14.2\text{ kg}$ LPG cylinder. Combines stoichiometric $\text{CO}_2$ ($63.1\text{ kg CO}_2\text{/GJ} \times \text{NCV } 0.04731\text{ GJ/kg} = 2.9853\text{ kg CO}_2\text{/kg LPG}$, IPCC 2006 Vol 2 Ch 2) with non-$\text{CO}_2$ emissions ($\text{CH}_4$: $0.005\text{ kg/GJ} \times 0.04731 \times 28 = 0.00662\text{ kg CO}_2\text{e/kg}$; $\text{N}_2\text{O}$: $0.0001\text{ kg/GJ} \times 0.04731 \times 265 = 0.00125\text{ kg CO}_2\text{e/kg}$, IPCC AR5 GWPs). Non-$\text{CO}_2$ contribution: $0.0079\text{ kg CO}_2\text{e/kg}$. Combined factor: $2.993\text{ kg CO}_2\text{e/kg LPG}$ ($42.50\text{ kg CO}_2\text{e}$ for $14.2\text{ kg}$; $14.97\text{ kg CO}_2\text{e}$ for $5.0\text{ kg}$; $56.87\text{ kg CO}_2\text{e}$ for $19.0\text{ kg}$). |
| **Transport** | Petrol Car | $0.1708\text{ kg CO}_2\text{e / vkm}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors: Sheet *Passenger vehicles*, Column `Direct GHGs` (Tailpipe Scope 1), Row `Cars (by size) - Medium car - Petrol` ($0.17082\text{ kg CO}_2\text{e/vkm}$). International proxy for medium petrol passenger car (1.4–2.0L). Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Diesel Car | $0.1684\text{ kg CO}_2\text{e / vkm}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors: Sheet *Passenger vehicles*, Column `Direct GHGs` (Tailpipe Scope 1), Row `Cars (by size) - Medium car - Diesel` ($0.16844\text{ kg CO}_2\text{e/vkm}$). International proxy for medium diesel passenger car. Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | CNG Car | $0.1380\text{ kg CO}_2\text{e / vkm}$ | UK DESNZ 2023 Greenhouse Gas Conversion Factors: Sheet *Passenger vehicles*, Column `Direct GHGs` (Tailpipe Scope 1), Row `Cars (by size) - Medium car - CNG` ($0.1380\text{ kg CO}_2\text{e/vkm}$). International proxy for medium CNG car. Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Electric Car | $0.1046\text{ kg CO}_2\text{e / vkm}$ | Derived engineering estimate: Bureau of Energy Efficiency (BEE) / ARAI Indian passenger EV benchmark ($\approx 0.155\text{ kWh/vkm}$) $\times$ CEA Database Version 22.0 generation baseline ($0.675\text{ kg CO}_2\text{e/kWh}$). Boundary: Scope 2 operational grid charging direct stack emissions at busbar (excludes T&D losses and battery manufacture). Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Small Scooter / Moped | $0.0440\text{ kg CO}_2\text{e / vkm}$ | Derived engineering estimate: ARAI certified test cycle benchmark for 100–110cc petrol scooters ($\approx 52\text{ km/L}$) $\times$ IPCC petrol combustion ($2.31\text{ kg CO}_2\text{/L}$ represented as $\text{CO}_2\text{e}$). Boundary: Scope 1 direct tailpipe combustion. Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Medium Motorcycle | $0.0840\text{ kg CO}_2\text{e / vkm}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors: Sheet *Motorbikes*, Column `Direct GHGs` (Tailpipe Scope 1), Row `Medium motorbike (> 125cc to 500cc)` ($0.0840\text{ kg CO}_2\text{e/vkm}$). International proxy. Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Electric Two-Wheeler | $0.0236\text{ kg CO}_2\text{e / vkm}$ | Derived engineering estimate: Indian electric two-wheeler benchmark ($\approx 0.035\text{ kWh/vkm}$) $\times$ CEA Database Version 22.0 generation factor ($0.675\text{ kg CO}_2\text{e/kWh}$). Boundary: Scope 2 operational grid charging direct stack emissions at busbar. Vehicle-kilometre ($\text{vkm}$). |
| **Transport** | Public Transit Bus | $0.0450\text{ kg CO}_2\text{e / pkm}$ | Provisional transit proxy adapted from CIRT average urban transit bus occupancy benchmarks ($\approx 30\text{--}35$ passengers per bus) and UK DESNZ transit bus conversion factors (*Local bus* sheet, Direct GHGs). Passenger-kilometre allocation ($\text{pkm}$). |
| **Transport** | Passenger Train / Metro | $0.0304\text{ kg CO}_2\text{e / pkm}$ | Derived estimate: Delhi Metro Rail Corporation (DMRC) & Indian Railways electric traction statistics ($\approx 0.045\text{ kWh/pkm}$) $\times$ CEA Database Version 22.0 generation factor ($0.675\text{ kg CO}_2\text{e/kWh}$). Boundary: Scope 2 traction power direct stack emissions at busbar. Passenger-kilometre allocation ($\text{pkm}$). |
| **Transport** | Walking & Cycling | $0.0000\text{ kg CO}_2\text{e / km}$ | Zero direct operational emissions during active travel. |
| **Household Waste** | Municipal Solid Waste | $0.08\text{ to } 0.45\text{ kg CO}_2\text{e / kg}$ | *Provisional heuristic model* adapted from Central Pollution Control Board (CPCB) solid waste characterization and IPCC 2006 Vol 5 Tier 1 first-order decay methane model. Scaling factors: $0.45\text{ kg CO}_2\text{e/kg}$ unsegregated landfill, $0.20\text{ kg CO}_2\text{e/kg}$ recycling, $0.08\text{ kg CO}_2\text{e/kg}$ organic composting. Disclosed as an indicative lifestyle scaling model rather than an exact physical measurement. |

> **Internally Consistent Metric & Accounting Boundaries Notice (CO₂e Alignment):**  
> Every category is now expressed consistently in **$\text{kg CO}_2\text{e}$** before calculating the overall annual footprint:
> - **Electricity:** Generation at power station busbar based on CEA Version 22.0 ($0.675\text{ kg CO}_2\text{e/kWh}$). Direct stack $\text{CO}_2$ is represented as $\text{CO}_2\text{e}$ ($\text{GWP} = 1$). T&D losses are explicitly excluded.
> - **Domestic LPG:** Complete Scope 1 combustion factor of $2.993\text{ kg CO}_2\text{e/kg}$ ($42.50\text{ kg CO}_2\text{e}$ per $14.2\text{ kg}$ cylinder), combining stoichiometric $\text{CO}_2$ ($2.9853\text{ kg}$) with IPCC AR5 100-year GWPs for fugitive/incomplete $\text{CH}_4$ ($\text{GWP} = 28$) and $\text{N}_2\text{O}$ ($\text{GWP} = 265$) adding $0.0079\text{ kg CO}_2\text{e/kg}$.
> - **Transportation:** Expressed in direct Scope 1 tailpipe $\text{kg CO}_2\text{e}$ for UK DESNZ 2023 proxies (Sheet *Passenger vehicles* / *Motorbikes*, Column `Direct GHGs`, excluding Well-to-Tank [WTT] fuel lifecycle upstream) and empirical Indian combustion/traction derived benchmarks. Vehicle-km ($\text{vkm}$) is distinguished from passenger-km ($\text{pkm}$).
> - **Household Waste:** Provisional heuristic model based on CPCB solid waste composition and IPCC methane generation potential, expressed in $\text{kg CO}_2\text{e}$.
> - **National Baselines:** National all-sector comparisons (e.g. 1.9 t India, 4.5 t Global) are excluded because national figures encompass heavy industry, mining, power generation, freight, and agriculture; comparing household sub-scopes against national all-sector baselines is scientifically misleading.
> - **Tree Equivalence Removal:** Unsupported mature tree absorption comparisons have been completely removed in accordance with scientific verification standards.

---

## 📁 Project Structure

```text
Ecotrack/
│
├── index.html              # Home page (Current: Design-System Preview)
├── calculator.html         # Carbon footprint assessment wizard shell
├── habits.html             # Daily eco-habits & streak tracker shell
├── tips.html               # Knowledge hub & actionable tips shell
├── dashboard.html          # Personal analytics & impact dashboard shell
├── README.md               # Project documentation
├── LICENSE                 # MIT License (2026 Aflah Azeez)
├── .gitignore              # Git exclusions for OS, editor, dependencies, and temp files
│
├── css/
│   ├── style.css           # Core design system tokens, typography, header, footer, & cards
│   ├── calculator.css      # Calculator wizard steps & custom slider styling
│   └── habits.css          # Streak counter & habit checklist styles
│
├── js/
│   ├── main.js             # Mobile drawer navigation, active link synchronization, & a11y
│   ├── storage.js          # Defensive LocalStorage manager with in-memory fallback
│   ├── data.js             # Documented emission factors, citations, and benchmarks
│   ├── calculator.js       # Carbon calculation engine stub
│   └── habits.js           # Habit tracking & streak calculation stub
│
└── assets/
    └── icons/
        ├── leaf.svg        # EcoTrack brand & biophilic identity
        ├── bolt.svg        # Energy & electricity indicator
        ├── car.svg         # Clean transport indicator
        ├── recycle.svg     # Waste & materials indicator
        └── award.svg       # Badges & milestone achievements
```

---

## 🚀 Local Setup Instructions

EcoTrack runs client-side without a backend server or database. An active internet connection is only required to fetch external Google Fonts; otherwise, standard system sans-serif fonts are used as local fallbacks.

### Method 1: Direct Browser Launch
1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/aflahazeez/EcoTrack.git
   cd EcoTrack
   ```
2. Double-click `index.html` or right-click and select **Open With** → your preferred web browser.

### Method 2: VS Code Live Server (Recommended for Development)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension if not already installed.
3. Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
4. The site will launch automatically at `http://127.0.0.1:5500`.

### Method 3: Python Built-in HTTP Server
If you prefer running a local server from your terminal:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 🚦 Development Roadmap

- **Phase 1: Foundation & Design System (Completed)**
  - Dark Botanical / Modern Eco-Tech design tokens defined in `css/style.css`.
  - Accessible, responsive shared navigation and footer across all five pages.
  - Defensive `EcoStorage` manager with corrupted JSON recovery and in-memory fallback.
  - Documented emission factors and citations cataloged in `js/data.js`.
  - JavaScript syntax-verified scripts.
- **Phase 2: Home Page Landing Experience (Completed)**
  - Complete landing page with hero introduction, dual Call-to-Actions, four core feature showcases, verified climate benchmarks, and responsive layout.
- **Phase 3: Carbon Calculator Engine (Completed)**
  - Dual calculation modes (Estimated Mode with representative midpoints and Precise Mode with exact numerical inputs).
  - 3 audited categories: Transportation, Household Energy (combining Grid Electricity and Domestic LPG), and Household Waste.
  - Traceable scientific factors: CEA Version 22.0 generation baseline factor ($0.675\text{ kg CO}_2\text{e/kWh}$) and IPCC LPG combustion including non-$\text{CO}_2$ GHGs ($2.993\text{ kg CO}_2\text{e/kg LPG}$).
  - Collapsible manual tariff helper for bill conversion to kWh.
  - 4-step interactive wizard, Chart.js doughnut visualization with pure-CSS fallback bars, defensive validation, and LocalStorage persistence.
  - Scope & Scientific Accounting Disclosures card.
- **Phase 4: Habit Tracker & Gamification (Planned)**
  - Daily checklist logic, consecutive streak date calculations, and badge rewards.
- **Phase 5: Knowledge Hub (Planned)**
  - Searchable eco-guides and category filtering.
- **Phase 6: Analytics Dashboard (Planned)**
  - Historical comparison charts and LocalStorage data management.

---

## ⚠️ Limitations

- **Browser-Scoped Storage:** Because data is stored in `localStorage`, user progress does not sync across different browsers or separate devices.
- **Approximation Models:** Carbon footprint calculations are based on national weighted averages and statistical cohorts; individual utility meters or specific vehicle telematics may differ.
- **No Third-Party APIs:** To maintain fast local response times and avoid external service dependencies, the platform operates without live utility grid API connections.

---

## 🔮 Future Improvements

- **Progressive Web App (PWA):** Add a web manifest and service worker for full offline installation on mobile and desktop devices.
- **Data Export & Import:** Allow users to export their profile and habit history as a `.json` or `.csv` backup and restore it on another device.
- **Localized Regional Factors:** Provide state-level electricity grid factors within India (e.g., states with higher renewable penetration).
- **Social Sharing Cards:** Generate downloadable summary cards of earned sustainability milestones without transmitting personal data.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 **Aflah Azeez**. Built for **TERRACODE 2026**, organized by the **FOSS Club, MEA Engineering College**.
