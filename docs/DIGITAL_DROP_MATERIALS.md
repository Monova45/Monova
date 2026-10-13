# Digital Drop material upgrade

The character and existing city retain their gameplay geometry and collision shapes.
The visual update adds local photographic PBR textures, separated window geometry,
and a photographed HDR sky and reflection environment.

## Rendering

- `pbr.ts` loads 1K albedo, OpenGL normal and roughness maps. Albedo alone uses sRGB.
  Cached repeat variants share images and GPU textures across city objects. Box UVs
  use world dimensions so long sidewalks do not stretch the concrete scan.
- `world.tsx` uses asphalt, concrete, grass and bark scans. Frames and glass are
  instanced separately on four building faces, allowing distinct material response.
  Canopies use layered procedural leaf detail and clustered silhouettes.
- `character.tsx` preserves costume artwork with fabric normal/roughness maps,
  fine fur bump, fabric sheen, ceramic clearcoat and metal trim.
- `fur.tsx` adds a shared 10,000-triangle head groom in Epic mode. Fiber colors are
  sampled from the character's fur artwork and lit by the same scene as the skin.
- The city uses a local 1K HDR environment; the lobby uses studio light panels.
  Epic adds a 4096 sun shadow map, half-resolution SSAO, SMAA and groomed fur.
  Performance omits those expensive passes and shadows, caps DPR at 1, and retains
  the material maps, HDR reflections and ACES tone mapping.

All downloads are hosted locally under `public/assets/textures/digital-drop`.
Their license, source links and original hashes are recorded alongside them.
The complete material library is approximately 12 MB on disk. World-only textures
are loaded when the city mounts rather than blocking the initial lobby.

## Verification scope

Check the lobby, start a campaign, inspect the city, return to the lobby, and switch
between Epic and Performance. Run TypeScript, targeted ESLint, unit tests and the
production build. This is a material and lighting upgrade to a procedural game;
it does not replace the city or character with a scanned/high-poly GLB. Device-wide
FPS profiling and a complete multiplayer playthrough are outside this validation.
