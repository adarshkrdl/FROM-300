# Contributing to From ₹300

Thank you for contributing! This is an open-source 3D browser-based business and life simulation game built with Three.js and Vite.

## Getting started

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev` (http://localhost:5173)
4. Build for production: `npm run build`
5. Preview the production build: `npm run preview`

## Project structure

```
index.html          HTML entry point
package.json        Dependencies and scripts
vite.config.js      Vite configuration
src/main.js         Game bootstrap and main loop
src/core/           Renderer, camera, input, asset loader, time
src/player/         Player controller
src/world/          City, districts, streaming
src/systems/        Needs, money, banking, business, time
src/save/           IndexedDB save system
src/ui/             HUD, menus, mobile controls
src/utils/          Helpers
public/assets/      Downloaded game assets (models, textures, audio)
tests/              Tests
```

## Code conventions

- JavaScript ES modules, modern syntax.
- Prefer small, single-responsibility modules under `src/`.
- All money amounts are stored in integer **paise** to avoid floating-point errors.
- No API keys or secrets in frontend code; use a backend proxy for any AI or network feature.
- Assets must be CC0, public domain, MIT or similarly permissive; record every asset in `ASSET_INVENTORY.md`.
- Keep bundle size down: prefer low-poly models, reuse instanced geometry, lazy-load assets.

## Testing

- `npm run build` must pass before pushing.
- Manually verify: startup, 3D rendering, camera, controls, mobile layout, asset loading, collisions, interactions, save/load.
- Browser testing on a real mobile device is recommended before a release.

## Submission process

1. Create a feature branch from `main`.
2. Commit with conventional messages, e.g. `feat: add banking simulation`.
3. Open a pull request against `main`.
4. Ensure the build passes and document any known issues.

## License

Original project code is MIT. Third-party assets retain their original licenses — see `ASSET_INVENTORY.md`. Do not relicense third-party assets as MIT.
