import { useMemo } from 'react';
import * as THREE from 'three';
import { furTexture } from './materials';

/** Short plush fibers soften the silhouette while sharing the skin's albedo. One draw per head. */
let groom: THREE.BufferGeometry | undefined;
function headGroom() {
  if (groom) return groom;
  const count = 11000, positions = new Float32Array(count * 9), colors = new Float32Array(count * 9), normals = new Float32Array(count * 9);
  const canvas = furTexture().image as HTMLCanvasElement;
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  let state = 314159;
  const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
  const color = new THREE.Color(), normal = new THREE.Vector3(), surface = new THREE.Vector3();
  const tangent = new THREE.Vector3(), flow = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1, angle = random() * Math.PI * 2, radial = Math.sqrt(1 - y * y);
    surface.set(Math.cos(angle) * radial, y, Math.sin(angle) * radial);
    // Head is a radius .5 sphere scaled by [1.1, .95, 1]. Its true normal is ellipsoidal.
    normal.set(surface.x / .55, surface.y / .475, surface.z / .5).normalize();
    const x = surface.x * .5505, py = surface.y * .4755, z = surface.z * .5005;
    const length = .0025 + random() * .005;
    tangent.crossVectors(normal, up).normalize().multiplyScalar(.00065 + random() * .0003);
    flow.copy(up).multiplyScalar(-1).addScaledVector(normal, normal.y).normalize();
    positions.set([
      x - tangent.x, py - tangent.y, z - tangent.z,
      x + tangent.x, py + tangent.y, z + tangent.z,
      x + normal.x * length + flow.x * length * .35,
      py + normal.y * length + flow.y * length * .35,
      z + normal.z * length + flow.z * length * .35,
    ], i * 9);
    const u = ((Math.atan2(surface.z, -surface.x) / (Math.PI * 2)) + 1) % 1;
    const v = Math.acos(surface.y) / Math.PI;
    const pixel = (Math.min(canvas.height - 1, Math.floor(v * canvas.height)) * canvas.width + Math.floor(u * canvas.width)) * 4;
    color.setRGB(pixels[pixel] / 255, pixels[pixel + 1] / 255, pixels[pixel + 2] / 255, THREE.SRGBColorSpace);
    for (let vertex = 0; vertex < 3; vertex++) {
      const lift = vertex === 2 ? 1.035 : 1;
      colors.set([color.r * lift, color.g * lift, color.b * lift], i * 9 + vertex * 3);
      normals.set([normal.x, normal.y, normal.z], i * 9 + vertex * 3);
    }
  }
  groom = new THREE.BufferGeometry();
  groom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  groom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  groom.computeBoundingSphere();
  return groom;
}

export function HeadFur() {
  const geometry = useMemo(() => headGroom(), []);
  return <mesh geometry={geometry} dispose={null}>
    <meshPhysicalMaterial vertexColors roughness={.96} sheen={.85} sheenColor="#ffe0ae" sheenRoughness={.9} side={THREE.FrontSide} />
  </mesh>;
}
