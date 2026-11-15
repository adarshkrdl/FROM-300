# From ₹300 — Rise of a Business Empire

A 3D browser-based business and life simulation game. Start with ₹300, find work, save, rent a home, start a business, hire employees, expand into factories and corporations, play the stock market and build an empire — all in your browser, no installation required.

## Technology

- Three.js — 3D rendering
- JavaScript ES modules — game logic
- HTML5 + CSS3 — UI
- Vite — dev server and production build
- IndexedDB — local saves

## Features (Phase 1 foundation)

- Playable third-person character in a procedural 3D city (8 districts)
- Desktop (WASD, Shift, Space, E, mouse look) and mobile (virtual joystick, touch look) controls
- Day/night cycle with accelerated simulation clock
- Needs system: hunger, thirst, energy, health, hygiene
- Money and banking simulation (integer-safe paise accounting)
- Business simulation skeleton
- IndexedDB save/load with 5 slots and auto-save
- Downloaded CC0/MIT 3D assets integrated with procedural fallbacks

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD | Virtual joystick (left) |
| Run | Hold Shift | Run button |
| Jump | Space | Jump button |
| Interact | E | Interact button |
| Look around | Drag mouse | Drag right side of screen |
| Pause | Esc | Pause menu |

## Assets

Third-party assets are downloaded, verified and integrated under their original licenses. See `ASSET_INVENTORY.md` for sources, licenses, attribution and integration status. Original game code is MIT licensed.

## License

MIT License — see `LICENSE`. Third-party assets are NOT covered by the MIT license; see `ASSET_INVENTORY.md`.
