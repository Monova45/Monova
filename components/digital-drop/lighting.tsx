import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { BOSS_DEFS } from './campaign';
import { radar } from './state';

const SUN_OFFSET = new THREE.Vector3(-42, 52, 32);
const SHADOW_SPAN = 112, SHADOW_SIZE = 4096;
const REGION_HAZE = ['#cdbbb0', '#b3ced5', '#c0bad1'];

/** One sun follows the player, keeping the same shadow detail in every region. */
export function Lighting({ quality, showroom }: { quality: boolean; showroom: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const basis = useMemo(() => {
    const direction = SUN_OFFSET.clone().normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    return { direction, right, up: new THREE.Vector3().crossVectors(direction, right), focus: new THREE.Vector3() };
  }, []);
  useFrame(() => {
    if (!sun.current) return;
    if (showroom) {
      target.position.set(0, 0, 0); sun.current.position.set(-42, 38, 32);
    } else {
      const { direction, right, up, focus } = basis;
      focus.set(radar.x, 6, radar.z);
      // Snap in light space so walking does not make static shadow edges shimmer.
      const texel = SHADOW_SPAN / SHADOW_SIZE;
      const x = Math.round(focus.dot(right) / texel) * texel;
      const y = Math.round(focus.dot(up) / texel) * texel;
      const z = focus.dot(direction);
      target.position.copy(right).multiplyScalar(x).addScaledVector(up, y).addScaledVector(direction, z);
      sun.current.position.copy(target.position).add(SUN_OFFSET);
    }
    target.updateMatrixWorld();
  });
  return <>
    <primitive object={target} />
    <hemisphereLight args={['#c5ddeb', '#8a7257', showroom ? .7 : .62]} />
    <directionalLight ref={sun} target={target} castShadow={quality} position={[-42, 38, 32]} intensity={showroom ? 2.4 : 2.65} color="#ffe0b5"
      shadow-mapSize={[SHADOW_SIZE, SHADOW_SIZE]} shadow-bias={-.0001} shadow-normalBias={.035} shadow-radius={3}
      shadow-camera-left={-SHADOW_SPAN / 2} shadow-camera-right={SHADOW_SPAN / 2} shadow-camera-top={SHADOW_SPAN / 2} shadow-camera-bottom={-SHADOW_SPAN / 2} shadow-camera-near={.5} shadow-camera-far={180} />
    <directionalLight position={[35, 20, -30]} intensity={.3} color="#a9d0ff" />
    <Suspense fallback={null}>{showroom ? <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={1.35} color="#bfe2ff" position={[0, 10, -12]} scale={[30, 8, 1]} />
      <Lightformer form="rect" intensity={1.05} color="#fff3dc" position={[-12, 8, 8]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} />
      <Lightformer form="rect" intensity={.35} color="#b5ae90" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
    </Environment> : <Environment files="/assets/textures/digital-drop/daylight.hdr" background backgroundIntensity={.72} backgroundBlurriness={.035} environmentIntensity={.62} environmentRotation={[0, 2.1, 0]} backgroundRotation={[0, 2.1, 0]} />}</Suspense>
  </>;
}

/** Distant silhouettes fade into region-colored air; the encounter floor stays clear. */
export function Atmosphere({ showroom }: { showroom: boolean }) {
  const fog = useMemo(() => new THREE.Fog('#b9cbd3', 70, 360), []);
  const colors = useMemo(() => ({ city: new THREE.Color('#b9cbd3'), regions: REGION_HAZE.map(c => new THREE.Color(c)), next: new THREE.Color() }), []);
  useFrame((_, dt) => {
    if (showroom) return;
    colors.next.copy(colors.city);
    BOSS_DEFS.forEach((b, i) => {
      const weight = 1 - THREE.MathUtils.smoothstep(Math.hypot(radar.x - b.x, radar.z - b.z), 30, 100);
      colors.next.lerp(colors.regions[i], weight * .75);
    });
    fog.color.lerp(colors.next, 1 - Math.exp(-dt * 2));
  });
  return showroom ? <fog attach="fog" args={['#1f6fe0', 30, 90]} /> : <primitive attach="fog" object={fog} />;
}
