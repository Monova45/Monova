# MONOVA: DIGITAL DROP

Independent desktop single-player prototype at `/3d`. Does not write contest scores or change `/juego`.

## Run

`npm install` then `npm run dev`. Open `/3d`, select a drop district and press PLAY.

WASD move; Shift sprint; Space jump; mouse rotates when pointer lock is available (otherwise drag right mouse); left click fires; right click aims; R reloads; E opens a nearby data crate; 1–5 selects unlocked tools; Q uses the selected ability; Escape pauses.

Eliminate 16 Bugs and survive until the Firewall reaches 8 meters (about 174 seconds). The first three seconds protect the player while dropping. Crates restore health/shield and unlock one tool per district. No real money, accounts, multiplayer, ranking or contest integration.

## Modules

- `state.ts`: session state, loadout definitions, HUD event bus and minimap radar data.
- `audio.ts`: synthesized Web Audio SFX and ambient drone (no audio files).
- `engine.tsx`: controller, over-the-shoulder camera, enemy AI (Spitters shoot orbs), combat, crates, landing. Pushes HUD state at 10 Hz.
- `effects.tsx`: pooled sparks/tracers/shockwaves and the post-processing stack (bloom, ACES, aberration, vignette, SMAA).
- `materials.ts`: procedural canvas textures (lit facades, ground, Monova fur, onesie, M badge) and Firewall/sky shaders.
- `character.tsx`: procedural Monova (orange tabby, M helmet and headphones, pumpkin cap and onesie).
- `world.tsx`: procedural city, static physics, holograms and street lights.
- `hud.tsx`: in-game HUD, canvas minimap, hit markers and damage indicators.
- `systems.ts`: pure damage, Firewall and match-result rules.
- `game.tsx`: lazy-loaded canvas, lighting, menus, pause and results.

## Current limits

This is a first procedural prototype, not the final art/content build. No custom GLB, bloom pipeline, multiplayer, persistence, server score validation, mobile touch controls or measured 60-FPS guarantee. Enemy navigation uses local obstacle avoidance rather than a navigation mesh. AI Scan highlights enemies in the scene; a full loot/enemy minimap reveal is not yet implemented. The drop uses a falling capsule with preselected landing district rather than an authored cinematic flight. Remaining visual polish includes distinct enemy silhouettes, richer district props and loot particles.

Replace the procedural `Cat` component with a GLB loader for `/models/monova-cat.glb` when a final asset is available, preserving the feet-at-origin, faces -Z, ~2 unit tall contract and the controller/collider dimensions.

## Verification

Targeted ESLint, TypeScript, production build, and three pure-rule tests pass. Browser checked scene load, session start and loss flow. Complete victory playthrough and cross-browser/performance profiling remain to be run.
