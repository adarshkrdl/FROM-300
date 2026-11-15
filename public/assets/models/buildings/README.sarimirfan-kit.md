# Low-Poly City

A planned low-poly city rendered in real time in the browser. Not random building placement — a hand-designed zoning map drives a road hierarchy, districts get appropriate buildings, a sunken river runs along the southern waterfront with bridges crossing it, and street lights line the avenues.

Around 670,000 triangles across 152 model types, drawn in roughly one draw call per model type via GPU instancing.

Built with three.js and vanilla JavaScript ES modules. No build step.

**[View the live demo →](https://sarimirfan7212-creator.github.io/lowpoly-city/)**

---

## Features

- **A designed city, not a random one** — a 6×6 zoning grid places a dense downtown core, a commercial ring around it, residential outskirts, industry on the west edge by the highway, a stadium to the south, a park to the north, and a river along the southern boundary. Contiguous regions, so the result reads as a real city rather than noise.
- **Road hierarchy** — five road classes at different widths, from 26-unit highways down to 7-unit local streets, generated from the zoning plan.
- **Deterministic generation** — a seeded mulberry32 RNG drives every variation, so the same seed produces the identical city on every load. Reproducible, not chaotic.
- **GPU instancing** — 152 model types share a single material and texture atlas, so the entire city collapses to about one draw call per model type instead of thousands.
- **Animated river** — a procedurally generated sunken waterway with an animated surface, with the ground plane cut away around it.
- **Procedural bridges and street lights** — both generated in code rather than placed by hand.
- **Nature pass** — trees, plants, and rocks distributed through the park and along the streets.
- **Physically-based rendering** — ACES filmic tone mapping, soft shadow maps, image-based lighting from a room environment probe, and distance fog.
- **Live district legend** — a panel lists each district with its cell count as the city generates.
- **Free camera** — drag to orbit, scroll to zoom, right-drag to pan.

## Architecture

The generator runs as a pipeline: plan the city, build the roads, place the geometry.

```
MasterPlan.js   →  zoning grid, district regions, road graph, river bounds
RoadNetwork.js  →  district ground planes + road ribbons from the plan
Water.js        →  animated river surface
Bridge.js       →  crossings where roads meet the river
StreetLight.js  →  lights along the avenues
AssetLibrary.js →  loads kit.glb, bakes transforms, exposes geometry by name
Buildings.js    →  chooses models per district, returns placements
Nature.js       →  chooses vegetation, returns placements
InstanceManager →  groups placements into one InstancedMesh per model type
```

Separating **planning** (data) from **building** (geometry) is what makes the city coherent. Every placement decision is made against the plan before a single triangle exists.

## Tech used

| What | Why |
| :--- | :--- |
| **HTML5 / CSS3** | Glassmorphic HUD and legend panels, backdrop blur |
| **Vanilla JavaScript (ES modules)** | Modular generator, no framework |
| **three.js r169** | Scene graph, PBR materials, shadows, tone mapping |
| **InstancedMesh** | Draws thousands of buildings in a handful of draw calls |
| **Draco compression** | Shrinks the 152-model kit from 43 MB to 2.5 MB |
| **glTF / GLB** | Model kit format, loaded via GLTFLoader + DRACOLoader |
| **PMREM + RoomEnvironment** | Image-based lighting without an HDRI download |
| **OrbitControls** | Camera orbit, zoom, and pan |
| **Import maps** | Resolves the bare `three` specifier to a pinned CDN build — no bundler |

## Project structure

```
lowpoly-city/
├── index.html              # Shell — HUD, legend, import map, module entry
├── assets/
│   ├── kit.glb             # 152-model kit, Draco-compressed (2.5 MB)
│   └── manifest.json       # Model metadata: category and bounding size
├── src/
│   ├── main.js             # Orchestrates the generation pipeline
│   ├── core/
│   │   ├── Engine.js           # Renderer, scene, camera, lighting, resize
│   │   ├── AssetLibrary.js     # Loads and prepares the model kit
│   │   ├── InstanceManager.js  # Placements → InstancedMesh groups
│   │   └── RNG.js              # Seeded deterministic random
│   ├── world/
│   │   ├── MasterPlan.js       # Zoning grid, districts, road graph
│   │   ├── RoadNetwork.js      # Road and district geometry
│   │   ├── Buildings.js        # Building selection and placement
│   │   └── Nature.js           # Vegetation placement
│   └── procedural/
│       ├── Water.js            # Animated river
│       ├── Bridge.js           # River crossings
│       └── StreetLight.js      # Street lighting
├── screenshots/
├── .gitignore
├── LICENSE
└── README.md
```

## Screenshots

> Drop your images into `screenshots/` and they'll appear here.

| City overview | District zoning |
| :---: | :---: |
| ![City](screenshots/city.png) | ![Districts](screenshots/districts.png) |

| Waterfront and bridges | Downtown core |
| :---: | :---: |
| ![Waterfront](screenshots/waterfront.png) | ![Downtown](screenshots/downtown.png) |

## How to run it

This project uses ES modules, an import map, and `fetch()` for the model kit — all of which browsers block over `file://`. **Double-clicking `index.html` will leave you stuck on the loading screen.** Serve it over HTTP:

```bash
# Clone the repo
git clone https://github.com/sarimirfan7212-creator/lowpoly-city.git
cd lowpoly-city

# Start a local server (pick whichever you have)
python3 -m http.server 8000        # Python 3
npx serve                          # Node.js
php -S localhost:8000              # PHP
```

Then open <http://localhost:8000> in your browser.

VS Code users can right-click `index.html` and choose *Open with Live Server*.

### Requirements

A modern browser with WebGL support: Chrome 89+, Firefox 89+, Safari 16.4+, or Edge 89+. An internet connection is needed on first load, since three.js and the Draco decoder come from a CDN. A discrete GPU helps at 670k triangles but isn't required.

## Controls

| Action | Input |
| :--- | :--- |
| Orbit the camera | Left-click and drag |
| Zoom | Scroll wheel |
| Pan | Right-click and drag |

## Working with the model kit

`assets/kit.glb` is Draco-compressed. If you rebuild it from the source pack, re-compress it before committing or the repo balloons back to 43 MB:

```bash
npx @gltf-transform/cli draco input.glb assets/kit.glb
```

`DRACOLoader` passes uncompressed files through unchanged, so an uncompressed kit still works — it's just 17× larger.

## Credits

The 3D models come from the **"LowPoly City 01"** asset pack.

> **TODO:** add the pack's author, source URL, and license terms here. Redistribution is permitted, but attribution is almost always a condition of that permission.

three.js is by mrdoob and contributors. Draco is by Google.

## License

The **code** in this repository is MIT licensed — see [LICENSE](LICENSE).

The **3D assets** in `assets/` are third-party work under their own separate license and are **not** covered by the MIT license above. See Credits.
