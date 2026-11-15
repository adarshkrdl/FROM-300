# Asset Inventory — From ₹300

All third-party assets used in the game. Original game code is MIT licensed; assets retain their original licenses and are NOT relicensed as MIT.

## 1. Gobkit Free 3D Assets (CC0)

| Field | Value |
|-------|-------|
| Name | Gobkit Free Assets (minion character + nature kit) |
| Category | Characters, Nature (trees, bushes, rocks, grass) |
| Original URL | https://github.com/Ariescar/gobkit-free-assets |
| GitHub repository | Ariescar/gobkit-free-assets |
| License | CC0 1.0 Universal (public domain) |
| License text | https://creativecommons.org/publicdomain/zero/1.0/ |
| Attribution | Not required; credit welcome: "Characters by Gobkit — https://gobkit.com" |
| Local path | `public/assets/models/characters/`, `public/assets/models/nature/` |
| Files | `npc_minion.glb` (170,752 B); `TreeLow001.glb`, `TreeMed001.glb`, `TreeHigh001.glb`, `Bush001.glb`, `Rock001.glb`, `Grass001.glb` (~14–17 KB each) |
| File size | ~258 KB total |
| Optimization | None needed; low-poly GLB, baked textures |
| Integration status | Integrated — trees placed along district footpaths; minion used as player character fallback; city kit used as landmark buildings |

## 2. Vuena Free Low-Poly Toy Cars (CC0)

| Field | Value |
|-------|-------|
| Name | Free Low-Poly Toy Cars (CC0) |
| Category | Vehicles |
| Original URL | https://github.com/Vuena/free-low-poly-toy-cars-cc0 |
| GitHub repository | Vuena/free-low-poly-toy-cars-cc0 |
| License | CC0 1.0 Universal (public domain) |
| License text | https://creativecommons.org/publicdomain/zero/1.0/ |
| Attribution | Not required |
| Local path | `public/assets/models/vehicles/` |
| Files | `car_muscle.glb` (325,276 B), `truck_monster.glb` (409,444 B), `car_police.glb` (300,448 B), `truck_icecream.glb` (322,744 B), `truck_fire.glb` (338,148 B) |
| File size | ~1.7 MB total |
| Optimization | None needed; low-poly GLB |
| Integration status | Integrated — parked along city roads; intended for traffic simulation |

## 3. Sarim Irfan Low-Poly City Kit (MIT)

| Field | Value |
|-------|-------|
| Name | Low-poly city kit (`kit.glb`) |
| Category | Buildings |
| Original URL | https://github.com/sarimirfan7212-creator/lowpoly-city |
| GitHub repository | sarimirfan7212-creator/lowpoly-city |
| License | MIT License |
| Attribution | Copyright (c) 2026 Sarim Irfan |
| Local path | `public/assets/models/buildings/city-kit.glb` |
| Files | `city-kit.glb` (2,503,672 B) |
| File size | ~2.5 MB |
| Optimization | None needed; scaled at runtime to fit district blocks |
| Integration status | Integrated — one landmark building placed per district block |

## Totals

- Asset files: 14 GLB models
- Total downloaded size: ~4.7 MB
- Licenses: CC0 × 2, MIT × 1
- All assets verified as valid GLB (`glTF` magic bytes) at download time

## Fallback policy

Every downloaded asset has a procedural Three.js fallback. If a GLB fails to load, the game continues using generated geometry and the failure is logged to the console.
