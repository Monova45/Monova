import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const assets = {
  asphalt: 'asphalt_04', concrete: 'concrete_wall_007',
  grass: 'leafy_grass', bark: 'bark_brown_01', fabric: 'denim_fabric',
} as const;

const variants = new Map<string, THREE.Texture[]>();

/** Local CC0 scans. Only albedo is sRGB; normal/roughness data stays linear.
 * Clone transforms, not images, so differently sized surfaces cannot change each other.
 * World scans load only when the world mounts; the lobby loads fabric and concrete.
 */
export function usePbr(kind: keyof typeof assets, repeatX = 1, repeatY = repeatX) {
  const base = `/assets/textures/digital-drop/${assets[kind]}`;
  const sources = useLoader(THREE.TextureLoader, [`${base}-color.jpg`, `${base}-normal.jpg`, `${base}-roughness.jpg`]);
  const [color, normal, rough] = sources;
  const maps = useMemo(() => {
    const key = `${kind}:${repeatX}:${repeatY}`;
    const cached = variants.get(key);
    if (cached) return cached;
    const textures = [color, normal, rough].map((source, i) => {
      const texture = source.clone();
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
      return texture;
    });
    variants.set(key, textures);
    return textures;
  }, [kind, color, normal, rough, repeatX, repeatY]);
  return useMemo(() => ({ map: maps[0], normalMap: maps[1], roughnessMap: maps[2] }), [maps]);
}

/** Box UVs measured in meters prevent stretched grain on long curbs and walls. */
export function metricBox(width: number, height: number, depth: number, tile = 2) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const uv = geometry.attributes.uv;
  const faces = [[depth, height], [depth, height], [width, depth], [width, depth], [width, height], [width, height]];
  faces.forEach(([u, v], face) => {
    for (let corner = 0; corner < 4; corner++) {
      const i = face * 4 + corner;
      uv.setXY(i, uv.getX(i) * u / tile, uv.getY(i) * v / tile);
    }
  });
  return geometry;
}
