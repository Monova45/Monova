import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Bloom, ChromaticAberration, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, type ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';

// Pooled, allocation-free effects shared by the engine. Colors above 1 are intentional: they feed the bloom pass.
const MAX_SPARKS = 260, MAX_TRACERS = 16, MAX_RINGS = 10;
type Spark = { position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; life: number; max: number; size: number };
type Tracer = { from: THREE.Vector3; to: THREE.Vector3; color: THREE.Color; life: number; width: number };
type Ring = { position: THREE.Vector3; color: THREE.Color; life: number; size: number };
const sparks: Spark[] = [], tracers: Tracer[] = [], rings: Ring[] = [];
let sparkCursor = 0, tracerCursor = 0, ringCursor = 0;

/** Screen-space feedback that the post-processing stack and camera read every frame. */
export const screen = { hurt: 0, shake: 0 };

export function resetEffects() { sparks.length = tracers.length = rings.length = 0; screen.hurt = screen.shake = 0; }

export function burst(x: number, y: number, z: number, count = 12, color = '#ffb962', force = 8, size = .16) {
  const c = new THREE.Color(color).multiplyScalar(3);
  for (let i = 0; i < count; i++) {
    const life = .35 + Math.random() * .5;
    sparks[sparkCursor] = { position: new THREE.Vector3(x, y, z), velocity: new THREE.Vector3(Math.random() - .5, Math.random() * .9, Math.random() - .5).multiplyScalar(force), color: c, life, max: life, size };
    sparkCursor = (sparkCursor + 1) % MAX_SPARKS;
  }
}
export function tracer(from: THREE.Vector3, to: THREE.Vector3, color: string, width = .035) {
  tracers[tracerCursor] = { from: from.clone(), to: to.clone(), color: new THREE.Color(color).multiplyScalar(4), life: .09, width };
  tracerCursor = (tracerCursor + 1) % MAX_TRACERS;
}
export function shockwave(x: number, y: number, z: number, color = '#ff7a00', size = 5) {
  rings[ringCursor] = { position: new THREE.Vector3(x, y, z), color: new THREE.Color(color).multiplyScalar(3), life: .5, size };
  ringCursor = (ringCursor + 1) % MAX_RINGS;
}

export function CombatEffects() {
  const sparkMesh = useRef<THREE.InstancedMesh>(null), tracerMesh = useRef<THREE.InstancedMesh>(null), ringMesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), up: new THREE.Vector3(0, 1, 0), dir: new THREE.Vector3(), black: new THREE.Color(0) }), []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05), { o } = tmp;
    if (sparkMesh.current) {
      for (let i = 0; i < MAX_SPARKS; i++) {
        const p = sparks[i];
        if (p && p.life > 0) {
          p.life -= dt; p.position.addScaledVector(p.velocity, dt); p.velocity.y -= dt * 14; p.velocity.multiplyScalar(1 - dt * 2);
          if (p.position.y < .05) { p.position.y = .05; p.velocity.y *= -.35; }
          o.position.copy(p.position); o.rotation.set(p.life * 9, p.life * 7, 0); o.scale.setScalar(Math.max(0, p.life / p.max) * p.size);
          sparkMesh.current.setColorAt(i, p.color);
        } else o.scale.setScalar(0);
        o.updateMatrix(); sparkMesh.current.setMatrixAt(i, o.matrix);
      }
      sparkMesh.current.instanceMatrix.needsUpdate = true;
      if (sparkMesh.current.instanceColor) sparkMesh.current.instanceColor.needsUpdate = true;
    }
    if (tracerMesh.current) {
      for (let i = 0; i < MAX_TRACERS; i++) {
        const t = tracers[i];
        if (t && t.life > 0) {
          t.life -= dt; tmp.dir.subVectors(t.to, t.from); const length = tmp.dir.length();
          o.position.copy(t.from).addScaledVector(tmp.dir, .5); o.quaternion.setFromUnitVectors(tmp.up, tmp.dir.normalize());
          o.scale.set(t.width * (t.life / .09 + .2), length, t.width * (t.life / .09 + .2));
          tracerMesh.current.setColorAt(i, t.color);
        } else { o.scale.setScalar(0); o.quaternion.identity(); }
        o.updateMatrix(); tracerMesh.current.setMatrixAt(i, o.matrix);
      }
      tracerMesh.current.instanceMatrix.needsUpdate = true;
      if (tracerMesh.current.instanceColor) tracerMesh.current.instanceColor.needsUpdate = true;
    }
    if (ringMesh.current) {
      for (let i = 0; i < MAX_RINGS; i++) {
        const r = rings[i];
        if (r && r.life > 0) {
          r.life -= dt; const k = 1 - r.life / .5;
          o.position.copy(r.position); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.setScalar(.3 + k * r.size);
          ringMesh.current.setColorAt(i, tmp.black.copy(r.color).multiplyScalar(1 - k));
        } else o.scale.setScalar(0);
        o.updateMatrix(); ringMesh.current.setMatrixAt(i, o.matrix);
      }
      ringMesh.current.instanceMatrix.needsUpdate = true;
      if (ringMesh.current.instanceColor) ringMesh.current.instanceColor.needsUpdate = true;
    }
  });
  return <>
    <instancedMesh ref={sparkMesh} args={[undefined, undefined, MAX_SPARKS]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial toneMapped={false} /></instancedMesh>
    <instancedMesh ref={tracerMesh} args={[undefined, undefined, MAX_TRACERS]} frustumCulled={false}><cylinderGeometry args={[1, 1, 1, 6, 1, true]} /><meshBasicMaterial toneMapped={false} transparent opacity={.9} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
    <instancedMesh ref={ringMesh} args={[undefined, undefined, MAX_RINGS]} frustumCulled={false}><ringGeometry args={[.9, 1, 64]} /><meshBasicMaterial toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></instancedMesh>
  </>;
}

export function PostFX({ quality }: { quality: boolean }) {
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new THREE.Vector2(.0004, .0004), []);
  useFrame((_, dt) => {
    screen.hurt = Math.max(0, screen.hurt - dt * 2.5);
    const k = .0004 + screen.hurt * .006;
    aberration.current?.offset.set(k, k * .6);
  });
  if (!quality) return <EffectComposer multisampling={0}><Bloom mipmapBlur intensity={.6} luminanceThreshold={1} /><ToneMapping mode={ToneMappingMode.ACES_FILMIC} /></EffectComposer>;
  return <EffectComposer multisampling={0}>
    <Bloom mipmapBlur intensity={.85} luminanceThreshold={.95} luminanceSmoothing={.2} radius={.75} />
    <ChromaticAberration ref={aberration} offset={offset} radialModulation modulationOffset={.25} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <Vignette offset={.28} darkness={.62} />
    <Noise opacity={.035} blendFunction={BlendFunction.OVERLAY} />
    <SMAA />
  </EffectComposer>;
}
