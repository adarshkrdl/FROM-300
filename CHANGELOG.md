# Changelog

## [0.2.0] — 2026-11-15 — Phases 2–13: Core Simulation Systems

### Added
- Job system: 10 jobs, salary-per-day, requirements, skill gain, promotions, payday
- Corporation system: multiple companies/subsidiaries, fund transfers, supply contracts, consolidated reports
- Stock market: IPO, buy/sell shares, portfolio value, market phases, daily price simulation
- Rival system: 6 CEO rivals with personalities, loans, expansion, price wars, bankruptcy, dialogue
- NPC system: scheduled NPCs with simplified movement
- Traffic system: moving downloaded vehicles on roads
- Interaction system: raycast "E to interact", enter/exit building interiors
- Interior system: replaceable indoor scenes with furniture and exit door
- Smartphone UI: banking, jobs, businesses, stock market apps (Tab toggle)
- Campaign/Sandbox selector (no forced ending; sandbox continues indefinitely)
- Save/load now serializes all systems (job, corporation, stock market, rival)

### Changed
- main.js rewritten as full system integration
- City now loads asynchronously; character model (gobkit CC0 minion) applied when ready

## [0.1.0] — 2026-11-15 — Phase 1: Foundation

### Added
- Vite + Three.js browser game scaffold
- Procedural 3D city with 8 districts, roads, footpaths, instanced buildings, streetlights
- Third-person player controller (walk/run/jump) with collision and follow camera
- Keyboard + pointer-lock (desktop) and virtual joystick + touch controls (mobile)
- Day/night cycle, accelerated simulation clock, time-based lighting
- Needs system (hunger, thirst, energy, health, hygiene)
- Money (integer paise), banking, business simulation skeletons
- IndexedDB save system with 5 slots, auto-save, versioned format
- HTML UI: main menu, HUD, pause menu, notifications
- Downloaded CC0/MIT assets: nature models, character model, vehicle models, city-kit building
- Asset loader with fallback to procedural geometry
- Documentation: README, LICENSE (MIT), PROJECT_STATUS, CHANGELOG, CONTRIBUTING, ASSET_INVENTORY
