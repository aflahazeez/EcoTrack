# EcoTrack 🌿

> **Sustainable Intelligence & Carbon Analytics Platform**  
> Developed for **TERRACODE 2026**, organized by the **FOSS Club, MEA Engineering College**.

EcoTrack is an interactive carbon-footprint awareness and reduction platform that helps people understand their environmental impact through carbon calculations, emission tracking, sustainable lifestyle recommendations, and educational resources, encouraging individuals to make more informed and environmentally responsible choices.

The application runs on client-side web technologies with **zero backend dependencies**, storing user data using **browser-based storage** via the browser's `localStorage`.

---

## 📖 Table of Contents

- [Core Pages Architecture](#-core-pages-architecture)
- [Feature Status: Implemented vs. Planned](#-feature-status-implemented-vs-planned)
- [Technology Stack](#-technology-stack)
- [Browser-Based Data Storage](#-browser-based-data-storage)
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
   Interactive multi-step carbon footprint assessment engine featuring dual calculation modes (Estimated and Precise Mode), three audited categories (Transportation, Household Energy [combining Electricity and LPG], and Household Waste), verified emission factors (CEA busbar generation and IPCC stoichiometric combustion), Chart.js doughnut chart with CSS fallback progress bars, and browser-based persistence.

3. **Habit Tracker & Sustainable Living Hub (`habits.html`)**  
   *Current Status: Completed (Phase 4).*  
   Unified sustainable lifestyle hub combining an interactive daily habit checklist with date navigation (Past read-only archive, Today interactive tracker, and Future preview), 5 randomized daily routines, streak counting algorithm, and single-card Eco Tips carousel with "Add as Habit" capability.

4. **Eco-Tips & Knowledge Hub (`tips.html`)**  
   *Current Status: Active Redirecting Bridge (Phase 4).*  
   Directs users smoothly to the integrated Eco Tips section inside the Sustainable Living Hub (`habits.html#tips`).

5. **Impact Dashboard (`dashboard.html`)**  
   *Current Status: Completed (Phase 5).*  
   Unified personal impact analytics command center aggregating latest annual footprint (tonnes $\text{CO}_2\text{e}$), monthly emission rate, calculation mode, category breakdown with electricity/LPG subcategories, habit progress & streaks, historical footprint trend chart with pure-CSS fallback table, recent activity feed, and independent friendly empty states.

---

## 🚦 Feature Status: Implemented vs. Planned

To maintain transparency, the platform's features are categorized into currently functioning foundation modules and upcoming phase deliverables:

### Implemented (Phases 1–7)
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
- **Sustainable Living Hub (`habits.html`, `js/habits.js`, `css/habits.css`):**
  - **Integrated Living Hub:** Unified experience combining a daily sustainable habit tracker with an actionable eco tips spotlight.
  - **Strictly Centered Header:** Clean, balanced page title (`Sustainable Living Hub`) with legacy top date badge removed, centering focus and typography.
  - **Checklist Date Navigation:** Prominent date navigation toolbar integrated directly into the Daily Habit Checklist header (`#checklist`), featuring Previous Day (`#btn-date-prev`), Next Day (`#btn-date-next`), native Dark Botanical date picker (`#checklist-date-picker`), dynamic formatted date label (`#displayed-date-label`), and a quick "Today" jump button (`#btn-date-today`). Defaults to user's local calendar date (`YYYY-MM-DD`).
  - **Past Date Read-Only Archival Mode:** Selecting past calendar dates displays saved completion records and historical progress with checkboxes disabled (`.habit-item-card.read-only`), modification controls hidden (custom habit form, reset button, and delete buttons), a clear status banner (`Day complete — this is a look back at your progress.`), and a dedicated empty state when no activity was logged. Historical records are strictly protected and never overwritten.
  - **Today Mode (Fully Interactive):** Default active view featuring 5 stable randomized habits, live completion toggling, custom habit creation, and reset functionality.
  - **Future Date Safe Guard:** Selecting future dates displays a friendly upcoming empty state (`Not yet! This day is still ahead of us.`), locks interaction, and prevents premature completions or false streak increments.
  - **Daily Habit Rotation (5 per Day):** Deterministic date-seeded pseudo-random selection presenting 5 varied daily routines from the user's available pool (defaults + custom + tip-derived), stable across reloads on the same date and rotating on new calendar days.
  - **Date-Specific Completion Records:** Daily completions indexed strictly by local `YYYY-MM-DD` calendar dates to guarantee completions today do not auto-check tomorrow.
  - **Reliable Streak Engine:** Date-arithmetic streak calculation algorithm that maintains streaks from yesterday if today has not yet been checked, records all-time personal bests, and tallies total lifetime completions from verified historical dates.
  - **Daily Progress Metrics:** Interactive completion percentages and count indicators where the denominator accurately represents the selected date's habit count.
  - **Consistent Dark Botanical Controls:** Uniform styling across all dropdown selects, date inputs, filter pills, inputs, and navigation buttons using deep forest backgrounds (`#0C2B20`), subtle emerald borders (`rgba(16, 185, 129, 0.35)`), warm ivory text (`#FBF8EE`), custom SVG chevrons, and emerald/lime focus indicators with zero browser defaults.
  - **Custom Habits:** Dynamic custom habit creation with category tagging, character length constraints, and case-insensitive duplicate prevention.
  - **Single-Card Eco Tips Carousel:** Daily rotation of 4 distinct tips presented in an accessible single-card carousel with previous/next controls, 4 position indicator dots, 6-second auto-rotation, hover/focus pause, touch/swipe support, and `prefers-reduced-motion` compliance.
  - **Bidirectional "Add as Habit" Integration:** One-click conversion of any eco tip into a trackable daily routine with duplicate prevention and live UI state synchronization.
  - **Navigation Bridge (`tips.html`):** Seamless transition redirect connecting existing links directly to `habits.html#tips`.
- **Personal Impact Dashboard (`dashboard.html`, `js/dashboard.js`, `css/dashboard.css`):**
  - **Footprint Overview:** Latest annual footprint ($t\text{ CO}_2\text{e}$), monthly emission rate, verified assessment date, mode badge (`Estimated` vs `Precise`), and quick re-calculation link.
  - **Category Breakdown:** Audited emissions for Transportation, Household Energy, and Household Waste with dynamic progress bars and subcategory percentage allocations for Grid Electricity and Domestic LPG.
  - **Habit Progress & Streaks:** Today's completed habit count vs. selected habits, visual progress bar, active streak, all-time personal best streak, and total lifetime habit checkoffs from actual saved data.
  - **Historical Footprint Trend Chart:** Activated `STORAGE_KEYS.HISTORY` (`ecotrack_history_log`) recording chronological snapshots upon calculation completion without mutating `STORAGE_KEYS.FOOTPRINT`. Includes defensive duplicate prevention, single-point baseline mode with guidance note, and multi-point line chart via Chart.js with pure-CSS fallback table.
  - **Recent Activity Feed:** Chronological timeline summarizing latest footprint assessments and recorded habit completion days.
  - **Independent Empty States:** Friendly, non-blocking empty states with actionable buttons when either footprint or habit progress has not yet been logged.
- **Continuous Horizontal Sliding Navigation (Phase 6):** Seamless horizontal page-slider viewport engine (`.page-slider-viewport`, `.page-view-panel`) with cubic-bezier easing (`450ms`) animating forward and backward transitions across all five pages without browser reloads.
- **Client-Side History & Hash Router (Phase 6 & 7):** Comprehensive client-side navigation engine supporting `pushState` and `file://` protocol hash routing, automatic forward/backward direction calculation, initial page refresh resolution without flash-to-home, and guarded `popstate` history stack traversal.
- **Mobile Responsive Form Controls (Phase 6):** Fine-tuned flexbox and CSS grid alignments ensuring buttons, dropdowns, date picker bars, and cards adapt cleanly without clipping on narrow viewports (320px–390px).
- **Category-Filtered Eco Tips Navigation (Phase 7):** Direct mapping from footer resource links to targeted carousel categories (`#tips-transportation`, `#tips-energy`, `#tips-water`, `#tips-waste`) with single-card category filtering, custom navigation controls (`showTipCategory`, `clearTipCategory`), and seamless restoration of daily rotation.
- **Footer Standardization & Official GitHub Attribution (Phase 7):** Standardized 4-column footer across all pages with normalized MIT License notice, category resource links, Browser-Based Storage architecture pill, and official GitHub mark link (`View on GitHub`).
- **Comprehensive Third-Party Notices (Phase 7):** Cataloged open-source software licenses and institutional data citations in `THIRD_PARTY_NOTICES.md`.
- **Defensive Storage Engine (`js/storage.js`):** Centralized Web Storage manager with corrupted JSON error handling, storage availability detection, and an in-memory session fallback (`_memoryFallback`) for restricted environments.
- **Traceable Emission Factors (`js/data.js`):** Centralized CEA, IPCC, and empirical factors with detailed source citations, boundary definitions, and uncertainty disclosures.

### Planned for Upcoming Phases
- [ ] **Knowledge Hub Deep Guides & Search** (Expanded searchable articles, in-depth sustainability guides, and downloadable reference checklists).
- [ ] **Progressive Web App (PWA) Offline Installation** (Service worker and web application manifest for installable desktop/mobile experience).
- [ ] **Data Export & Import** (Portable `.json` / `.csv` backup and restoration of footprint logs and habit progress).

---

## 🛠️ Technology Stack

- **Markup:** Semantic [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) with ARIA landmarks.
- **Styling:** Vanilla [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) using CSS Custom Properties (variables), modern Flexbox, and CSS Grid. Zero external CSS frameworks.
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (body) and [Outfit](https://fonts.google.com/specimen/Outfit) (headings) loaded via Google Fonts CDN. *(Note: An active internet connection is required to fetch web font files; standard system sans-serif fonts are configured as local fallbacks if offline).*
- **Icons:** Lightweight inline and standalone [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) icons.
- **Scripting:** Modern [Vanilla JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) without frontend frameworks or bundlers.
- **State Management:** Browser [Web Storage API (`localStorage`)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) with in-memory fallback.

---

## 💾 Browser-Based Data Storage

EcoTrack operates entirely client-side without external databases, server-side APIs, or cloud user accounts. User metrics and habit records are stored using browser-based storage via the browser's Web Storage API (`localStorage`) managed through `js/storage.js`:

- **Strict Key Isolation:**
  - `STORAGE_KEYS.FOOTPRINT` (`ecotrack_footprint_data`): Stores the user's latest annual and monthly carbon calculations, mode selection (`estimated` vs `precise`), category breakdowns, and raw inputs.
  - `STORAGE_KEYS.HABITS` (`ecotrack_habits_data`): Manages the active habits list (defaults and user custom additions), daily completion records mapped strictly by `YYYY-MM-DD` ISO calendar dates, and consistency streak statistics.
  - `STORAGE_KEYS.HISTORY` (`ecotrack_history_log`): Chronological array of verified footprint snapshots (timestamp, mode, annual kg, annual tonnes, and category breakdown) recorded upon calculation completion with duplicate prevention.
  - Operations across the Calculator, Habits, and Dashboard maintain strict isolation and never corrupt or overwrite unrelated datasets.
- **Defensive Parsing & Schema Migration:** Parsing operations are wrapped in `try...catch` blocks with sensible defaults to ensure corrupted or invalid values never crash the application.
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
├── index.html                  # Home page: Landing experience with mission, core pillars & climate benchmarks
├── calculator.html             # Carbon Calculator: Dual-mode footprint assessment wizard
├── habits.html                 # Sustainable Living Hub: Daily habit checklist & Eco Tips carousel
├── tips.html                   # Knowledge Hub: Navigation redirect bridge to habits.html#tips
├── dashboard.html              # Impact Dashboard: Personal impact analytics, charts & activity feed
├── README.md                   # Comprehensive project documentation & methodology
├── THIRD_PARTY_NOTICES.md      # Third-party software notices, licenses, and attributions
├── LICENSE                 # MIT License (2026 Aflah Azeez)
├── .gitignore              # Git exclusions for OS, editor, dependencies, and temp files
│
├── css/
│   ├── style.css               # Core Dark Botanical design system, typography, header, footer & cards
│   ├── calculator.css          # Calculator wizard steps, mode cards, custom sliders & dropdown styling
│   ├── habits.css              # Habit checklist, streak badges, date picker & carousel styling
│   └── dashboard.css           # Impact dashboard layout, metric cards & Chart.js responsive wrappers
│
├── js/
│   ├── main.js                 # Slider navigation engine, drawer menu, router & history management
│   ├── storage.js              # Defensive Web Storage manager with corrupted JSON recovery & fallback
│   ├── data.js                 # Documented emission factors, citations, benchmarks & tips catalog
│   ├── calculator.js           # Dual-mode carbon calculation engine & history snapshot recorder
│   ├── habits.js               # Daily 5-habit rotation, streak engine, date navigation & tips carousel
│   ├── dashboard.js            # Personal analytics engine, Chart.js trend charts & activity feed
│   ├── custom-select.js        # Dark Botanical accessible custom dropdown select component
│   └── page-views.js           # Pre-compiled HTML page templates for horizontal slider transitions
│
├── scripts/
│   └── build_page_views.js     # Build utility compiling HTML pages into js/page-views.js
│
├── scratch/
│   ├── test_calculator_suite.js             # Numerical calculation & emission factor tests (43 checks)
│   ├── test_habits_suite.js                 # Daily habits, streaks & checklist tests (100 checks)
│   ├── test_dashboard_suite.js              # Personal analytics & history snapshot tests (111 checks)
│   ├── test_slider_navigation.js            # Horizontal sliding transition & direction tests (76 checks)
│   ├── test_browser_integration.js          # DOM schema & accounting disclosure audit (105 checks)
│   ├── test_category_navigation.js          # Category resource links & tips filtering tests (104 checks)
│   └── test_browser_history_regression.js   # Browser history traversal & popstate regression tests (35 checks)
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
- **Phase 4: Sustainable Living Hub (Habit Tracker + Eco Tips) (Completed)**
  - Transformed `habits.html` into a unified Sustainable Living Hub.
  - Interactive daily checklist with date-specific completion logging (`YYYY-MM-DD`).
  - Consecutive-day streak calculation algorithm with active status preservation and personal best tracking.
  - Categorized Eco Tips library with 19 practical recommendations across Transportation, Energy, Water Conservation, Waste Management, and Sustainable Lifestyle.
  - One-click "Add as Habit" action linking tips to the active habit checklist with duplicate prevention.
  - Custom habit creation (with length validation and duplicate rejection) and deletion controls.
  - Complete LocalStorage persistence via `EcoStorage` using `STORAGE_KEYS.HABITS`, strictly isolated from footprint data.
  - Transparent redirecting bridge in `tips.html` forwarding smoothly to `habits.html#tips`.
- **Phase 5: Personal Impact Dashboard (Completed)**
  - Unified command center aggregating latest carbon footprint metrics ($t\text{ CO}_2\text{e}$ and monthly rate) and assessment date.
  - Category-wise breakdown with responsive progress bars and subcategory shares for Grid Electricity and Domestic LPG.
  - Habit progress tracking with today's completed habit count vs. selected habits, visual progress bar, active streak, longest streak, and lifetime statistics.
  - Activated `STORAGE_KEYS.HISTORY` (`ecotrack_history_log`) for chronological footprint snapshot tracking with defensive duplicate prevention.
  - Responsive Chart.js historical trend line chart with single-baseline explanation mode and pure-CSS fallback table.
  - Recent activity timeline tracking verified calculation events and recorded habit completion days.
  - Independent, friendly empty states with direct navigation links.
- **Phase 6: Integration, Horizontal Sliding Navigation, and UI Refinements (Completed)**
  - Seamless horizontal sliding transition engine across all five views (`index.html`, `calculator.html`, `habits.html`, `tips.html`, `dashboard.html`).
  - Pre-compiled page-views template registry (`js/page-views.js`) for instant client-side view swapping.
  - History stack engine supporting pushState and `file://` hash navigation with automatic forward/backward direction calculation.
  - Initial load and refresh route resolver eliminating flash-to-home behavior.
  - Mobile responsiveness fixes: unclipped habit cards, proportional button widths, and custom dropdown alignment on viewports from 320px to 390px.
  - Comprehensive automated headless browser verification.
- **Phase 7: Final Polish, Documentation Audit, and Category Navigation (Completed)**
  - **Task 1 (Licensing & Attributions - Completed):** Authored `THIRD_PARTY_NOTICES.md` documenting Chart.js (MIT), Plus Jakarta Sans (OFL), Outfit (OFL), Lucide/Feather icons (ISC/MIT), and CEA/IPCC institutional references.
  - **Task 2 (Build Tooling - Completed):** Relocated page-view compilation script to `scripts/build_page_views.js` with environment-independent path resolution.
  - **Task 3 (Footer Standardization - Completed):** Standardized footer layout, column structure, and MIT license notice across all five HTML pages.
  - **Task 4 (GitHub Brand Integration - Completed):** Replaced legacy badge with official GitHub mark and accessible "View on GitHub" repository link.
  - **Task 5 (Category-Specific Navigation & Carousel Filtering - Completed):** Connected footer resource links directly to the Eco Tips carousel (`#tips-transportation`, `#tips-energy`, `#tips-water`, `#tips-waste`), implemented category filtering API (`showTipCategory`, `clearTipCategory`, `getActiveTipCategory`), synchronized Browser-Based Storage architecture wording across all pages, and eliminated history stack mutations during browser Back/Forward traversal.
  - **Automated Verification:** Expanded test coverage to 7 regression suites with 574 tests passing with zero failures.

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
