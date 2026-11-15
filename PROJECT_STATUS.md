# Project Status — From ₹300

**Current stage:** Phase 1–13 partially complete (playable prototype with core simulation)
**Branch:** `arena/c586ca84-from-300`
**Last updated:** 2026-11-15

## Completed features
- Vite + Three.js scaffold with responsive HTML5 shell (dev/build/preview)
- Procedural city: 8 districts (village outskirts, poor neighbourhood, marketplace, commercial, industrial, financial, luxury residential, entertainment), road grid, footpaths, instanced buildings, streetlights
- Downloaded & integrated assets (CC0/MIT): 6 nature models, 1 character model, 5 vehicle models, 1 city-kit building (~4.7 MB)
- Third-person player controller: walk/run/jump, AABB collision vs city geometry, follow camera with pointer lock (desktop) and virtual joystick + touch-drag look (mobile)
- Day/night cycle, accelerated simulation clock, time-based lighting & fog
- Needs system: hunger, thirst, energy, health, hygiene with decay & status
- Money (integer paise, ₹300 start), banking (deposit/withdraw/transfer/loan/EMI/interest/credit score/ledger)
- Business system: creation, salaries, monthly revenue/expense simulation, restock, hiring, reputation
- Job system: 10 jobs (shop worker, delivery, restaurant, office, factory, driver, security, salesperson, technician, manager), salary-per-day, requirements, skill gain, promotions, payday
- Corporation system: multiple companies/subsidiaries, internal fund transfers, supply contracts, consolidated reports
- Stock market: IPO, buy/sell shares, portfolio value, market phases (bull/bear/crash/stable), daily price simulation
- Rival system: 6 rival CEOs with personalities (aggressive/cautious/balanced/opportunist), loans, expansion, price wars, bankruptcy check, dialogue lines
- NPC system: 10 NPCs with schedules (commute/work/leisure/sleep) and simplified movement
- Traffic system: downloaded vehicles moving along roads with looping
- Interaction system: raycast "E to interact", enter/exit building interiors with furniture
- Interior system: replaceable indoor scenes (walls, bed, table, chairs, counter, exit door)
- Smartphone UI: banking, jobs, businesses, stock market apps (toggle with Tab)
- Campaign/Sandbox mode selector (no forced ending; sandbox continues indefinitely)
- UI: main menu, HUD (money/time/day/status), pause menu, notifications, mobile controls
- Save system: IndexedDB, 5 slots, manual + auto-save (~2 min), versioned format, all systems serialized
- Asset loader: GLTFLoader caching + procedural fallback on load failure
- Production build verified (~671 KB); dev server verified serving HTTP 200
- City visuals rebuilt: detailed buildings with roofs/windows/doors, district color palettes, grass patches, road markings, streetlights, benches, dustbins, hemisphere + day/night lighting
- Documentation: README, MIT LICENSE, CONTRIBUTING, CHANGELOG, PROJECT_STATUS, ASSET_INVENTORY

## Pending features
- Building-specific interiors (shop, bank, hospital, school, office variants)
- Real estate (rent/buy/sell properties, land development)
- Vehicle marketplace & ownership (purchase the traffic vehicles)
- Transport businesses (taxi/trucking/delivery companies)
- Mercury 3 AI dialogue (secure backend proxy; offline fallback present)
- Audio (ambient city sounds, UI)
- Graphics quality settings (low/medium/high)
- District streaming and LOD
- More assets: shops, hospitals, schools, banks, ATMs, petrol pumps, factories

## Known issues
- Bundle ~671 KB unminified — above 500 KB guideline; code-splitting recommended
- GLB asset loading is asynchronous; procedural geometry renders until assets arrive
- No audio yet
- Mobile layout not tested on a real device (manual steps documented)
- Camera-vs-geometry collision is AABB-based and approximate

## Git commits
- 5f4f6d6 feat: initialize Three.js game foundation
- c3cdba1 docs: update PROJECT_STATUS after initial push
- PENDING: commit all Phase 2–13 systems and push

## Remaining tasks
- Commit current systems and push to origin/arena/c586ca84-from-300
- Continue Phases 14–16: campaign missions, polish, mobile testing, release
