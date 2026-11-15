# Project Status — From ₹300

**Current stage:** Phase 1 — Foundation (playable prototype)
**Branch:** `arena/c586ca84-from-300`
**Last updated:** 2026-11-15

## Completed features
- Vite + Three.js project scaffold (dev/build/preview scripts)
- HTML5 shell with responsive full-screen canvas and mobile-safe viewport
- Third-person player controller: walk/run/jump, AABB collision vs city geometry, camera follow with pointer lock (desktop) and touch-drag look (mobile)
- Unified Input system: keyboard (WASD/Shift/Space/E), pointer lock, virtual joystick + action buttons on mobile
- Procedural city: ground, road grid with footpaths, 8 districts (village outskirts, poor neighbourhood, marketplace, commercial, industrial, financial, luxury residential, entertainment), instanced buildings, streetlights
- Day/night cycle with accelerated simulation clock, directional + ambient lighting, fog color by time of day
- Needs system: hunger, thirst, energy, health, hygiene with decay and status reporting
- Money system (integer paise, ₹300 starting balance)
- Banking system skeleton: savings/current accounts, deposits, withdrawals, transfers, loans, EMIs, interest, credit score, transaction ledger
- Business system skeleton: creation, salaries, monthly revenue/expense simulation, restock, hiring, reputation
- UI: main menu (new game / load / settings), HUD (money, time, day, status), pause menu, notifications, mobile controls overlay
- Save system: IndexedDB, 5 slots, manual save, auto-save (~every 2 min real time), versioned save format, slot listing
- Downloaded & integrated assets (CC0 / MIT): 6 nature models, 1 character model, 5 vehicle models, 1 city-kit building model (2.5 MB)
- Asset loader with GLTFLoader, caching and fallback-to-procedural on load failure
- Production build verified (`npm run build`), dev server verified serving

## Pending features
- Enter/exit building interiors
- Job system (employment, salary, promotions)
- Smartphone UI (banking, stocks, jobs, businesses, map, news)
- Campaign missions and sandbox mode
- Stock market
- Real estate (rent/buy/sell properties)
- Traffic simulation and NPC schedules
- Mercury 3 AI dialogue (secure backend proxy)
- Audio (ambient city sounds, UI)
- Graphics quality settings (low/medium/high)
- District streaming and LOD
- More extensive asset integration (shops, hospitals, schools, banks, ATMs, petrol pumps, factories)

## Known issues
- Bundle is ~630 KB unminified (537+ KB gzip) — above the 500 KB chunk guideline; code-splitting recommended
- GLB asset loading is asynchronous; the game renders procedural geometry until assets arrive
- No audio yet
- Mobile layout not yet tested on a real device (documented manual steps only)
- Camera-vs-geometry collision is AABB-based and approximate

## Git commits
- 5f4f6d6 feat: initialize Three.js game foundation with city, controls, systems and assets (44 files)
Pushed to origin/arena/c586ca84-from-300 (verified: remote ref 5f4f6d6 matches local).

## Remaining tasks
- Phase 2: polish player system + interactions (enter/exit buildings, object interaction prompts)
- Phase 3: interiors and district streaming, LOD
- Job system, smartphone UI, campaign/sandbox, stock market, real estate, traffic, NPCs, Mercury 3 AI
- Continue roadmap per the master prompt
