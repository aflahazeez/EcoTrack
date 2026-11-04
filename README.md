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
   *Current Status: Design-System Preview.*  
   Currently functions as a live design-system showcase and component testbed (displaying color tokens, typography, glassmorphism cards, buttons, and responsive grid layouts) while the dedicated landing page content, hero metrics, and interactive previews are scheduled for implementation in Phase 2.

2. **Carbon Calculator (`calculator.html`)**  
   *Current Status: Foundation Shell.*  
   Houses the shared header, responsive navigation, and footer. The interactive multi-step assessment wizard (calculating annual $\text{CO}_2\text{e}$ across transport, household energy, diet, and consumption) is architected for Phase 3.

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

### Implemented (Phase 1 Foundation)
- **Dark Botanical Visual Identity:** Custom CSS design system using deep forest backgrounds (`#061610`), dark green surfaces (`#0F2C22`), emerald action buttons (`#10B981`), lime/sage data accents (`#A3E635`, `#6EE7B7`), and warm ivory text (`#FBF8EE`).
- **Atmospheric Backgrounds:** Multi-layered radial gradient mesh avoiding flat, empty dark voids.
- **Consistent Shared Navigation:** Uniform desktop header and responsive mobile drawer navigation across all five pages.
- **Accessible Mobile Interactions:** Mobile navigation with synchronized `aria-expanded` attributes, Escape key dismissal with focus restoration, and outside-click drawer closing.
- **Active Page Link Indication:** Automatic path-based highlighting for active navigation links.
- **Accessibility Foundations:** Integrated skip-to-content accessibility link (`.skip-link`) and visible high-contrast keyboard focus indicators (`:focus-visible`). *Accessibility features are actively implemented and tested across components.*
- **Defensive Storage Engine (`js/storage.js`):** Centralized LocalStorage wrapper with corrupted JSON error handling, storage availability detection, and an in-memory session fallback (`_memoryFallback`) for restricted environments.
- **Documented Emission Data Structure (`js/data.js`):** Structured baseline constants for transport, electricity, cooking gas, diet cohorts, and comparison benchmarks with detailed source annotations.

### Planned for Upcoming Phases
- [ ] **Interactive Carbon Calculation Wizard:** Step-by-step input sliders for transport km, monthly kWh bills, gas cylinders, and dietary choices (Phase 3).
- [ ] **Chart.js Visualizations:** Donut chart breakdown for emissions and historical comparison bar charts (Phases 3 & 6).
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
| **Electricity** | Indian Grid Average | $0.82\text{ kg CO}_2\text{e / kWh}$ | Central Electricity Authority (CEA) of India, *CO₂ Baseline Database for the Indian Power Sector* (Ver. 18, 2023). Busbar generation weighted average ($\approx 0.714\text{ kg/kWh}$) adjusted for an estimated $\approx 18\%$ transmission and distribution (T&D) loss to consumer end. |
| **Cooking Gas** | Domestic LPG Cylinder | $42.4\text{ kg CO}_2\text{e / cylinder}$ | Stoichiometric combustion calculation for a standard Indian $14.2\text{ kg}$ LPG cylinder. Referenced from IPCC 2006 Guidelines for National Greenhouse Gas Inventories ($63.1\text{ g CO}_2\text{/MJ}$, $\text{NCV } 47.31\text{ MJ/kg} \rightarrow 2.985\text{ kg CO}_2\text{/kg LPG}$). |
| **Transport** | Petrol Car | $0.1708\text{ kg CO}_2\text{e / km}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors (Average petrol passenger vehicle). |
| **Transport** | Diesel Car | $0.1684\text{ kg CO}_2\text{e / km}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors (Average diesel passenger vehicle). |
| **Transport** | Electric Vehicle | $0.115\text{ kg CO}_2\text{e / km}$ | Derived model calculation assuming an EV consumption of $0.16\text{ kWh/km}$ charged on the All-India electricity grid mix ($\approx 0.72\text{ kg CO}_2\text{/kWh}$). |
| **Transport** | Motorcycle | $0.084\text{ kg CO}_2\text{e / km}$ | UK DESNZ / DEFRA 2023 Greenhouse Gas Conversion Factors (Medium motorbike). |
| **Transport** | Rail / Train | $0.035\text{ kg CO}_2\text{e / pkm}$ | Indian Railways & CEA Electric Traction passenger average benchmark. |
| **Diet** | Dietary Cohorts | $850\text{ to } 2,600\text{ kg / year}$ | Annualized adult benchmarks adapted from Scarborough et al. (*Nature Food* 2023) and Poore & Nemecek (*Science* 2018) spanning vegan ($850\text{ kg}$), vegetarian ($1,100\text{ kg}$), omnivore ($1,800\text{ kg}$), and heavy-meat ($2,600\text{ kg}$) cohorts. |
| **Waste** | Lifestyle Scaling Multipliers | $0.85\times\text{ to } 1.25\times$ | *Heuristic model multipliers* adapted from consumer footprint methodologies (e.g., UC Berkeley CoolClimate Network, WWF calculators) representing low-waste, average, and high-packaging lifestyles. These are model parameters rather than empirical constants. |
| **Benchmark** | India Per-Capita | $\approx 1.9\text{ tonnes / year}$ | Global Carbon Project (GCP) & Our World in Data (2022–2023). |
| **Benchmark** | Global Per-Capita | $\approx 4.5\text{ tonnes / year}$ | International Energy Agency (IEA) & World Bank. |
| **Benchmark** | Tree Absorption | $21.77\text{ kg CO}_2\text{ / year}$ | US EPA Greenhouse Gas Equivalencies & Arbor Day Foundation benchmark ($\approx 48\text{ lbs / mature tree / year}$). Actual absorption rates vary depending on tree species, age, and climate. |

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
- **Phase 2: Home Page Landing Experience (Pending Approval)**
  - Dedicated landing page content, dynamic climate impact counter, and interactive preview cards.
- **Phase 3: Carbon Calculator Engine (Planned)**
  - 4-step interactive wizard, category emission breakdowns, and Chart.js donut chart.
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
