import { useMemo } from 'react';
import * as THREE from 'three';
import { furTexture } from './materials';

/** Tapered, groomed fibers share the skin's albedo and lighting. One draw per head. */
let groom: THREE.BufferGeometry | undefined;
function headGroom() {
  if (groom) return groom;
  const count = 10000, positions = new Float32Array(count * 9), colors = new Float32Array(count * 9), normals = new Float32Array(count * 9);
  const canvas = furTexture().image as HTMLCanvasElement;
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  let state = 314159;
  const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
  const color = new THREE.Color(), normal = new THREE.Vector3(), tangent = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1, angle = random() * Math.PI * 2, radial = Math.sqrt(1 - y * y);
    normal.set(Math.cos(angle) * radial, y, Math.sin(angle) * radial);
    const x = normal.x * .551, py = normal.y * .476, z = normal.z * .501;
    const length = .006 + random() * .014;
    tangent.crossVectors(normal, up).normalize().multiplyScalar(.0012);
    positions.set([x - tangent.x, py, z - tangent.z, x + tangent.x, py, z + tangent.z, x + normal.x * length, py + normal.y * length - length * .25, z + normal.z * length], i * 9);
    const u = ((Math.atan2(normal.z, -normal.x) / (Math.PI * 2)) + 1) % 1;
    const v = Math.acos(normal.y) / Math.PI;
    const pixel = (Math.min(canvas.height - 1, Math.floor(v * canvas.height)) * canvas.width + Math.floor(u * canvas.width)) * 4;
    color.setRGB(pixels[pixel] / 255, pixels[pixel + 1] / 255, pixels[pixel + 2] / 255, THREE.SRGBColorSpace);
    for (let vertex = 0; vertex < 3; vertex++) {
      colors.set([color.r, color.g, color.b], i * 9 + vertex * 3);
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
  return <mesh geometry={geometry} receiveShadow dispose={null}>
    <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} />
  </mesh>;
}
