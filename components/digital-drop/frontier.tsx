import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Float, Instance, Instances, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BOSS_DEFS, OUTPOSTS, PORTALS, WORLD_HALF } from './campaign';
import { usePbr } from './pbr';

const font = '/fonts/jersey-10.ttf';
const glow = (color: string, intensity = 2) => new THREE.Color(color).multiplyScalar(intensity);

function TransitGate({ gate }: { gate: typeof PORTALS[number] }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ring.current) ring.current.rotation.z = clock.elapsedTime * .25; });
  return <group position={[gate.x, 0, gate.z]}>
    <mesh position={[0, .15, 0]} receiveShadow><cylinderGeometry args={[2.7, 3.1, .3, 32]} /><meshStandardMaterial color="#263340" metalness={.8} roughness={.35} /></mesh>
    <mesh ref={ring} position={[0, 2.8, 0]}><torusGeometry args={[2.4, .12, 10, 64, Math.PI * 1.85]} /><meshBasicMaterial color={glow(gate.color)} toneMapped={false} /></mesh>
    <mesh position={[0, 2.8, 0]}><circleGeometry args={[2.3, 48]} /><meshBasicMaterial color={gate.color} transparent opacity={.1} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <Sparkles count={14} position={[0, 2.8, 0]} scale={[4, 4, .5]} size={3} color={gate.color} speed={.4} />
    <Text font={font} position={[0, 5.7, 0]} fontSize={.55} color={gate.color} outlineWidth={.03} outlineColor="#07101b">{gate.label}</Text>
    <Text font={font} position={[0, .5, 2]} fontSize={.4} color="#ffffff">E / VIAJAR</Text>
  </group>;
}

function Highway({ x, z }: { x: number; z: number }) {
  const road = usePbr('asphalt', 2, 36), length = Math.hypot(x, z), angle = Math.atan2(x, z);
  return <group position={[x / 2, .055, z / 2]} rotation={[0, angle, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9, length]} /><meshStandardMaterial {...road} roughness={.9} normalScale={[.5, .5]} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 4, .008, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.12, length]} /><meshStandardMaterial color="#c4bda3" roughness={.9} /></mesh>)}
    <Instances limit={40}><boxGeometry args={[.12, .02, 2.4]} /><meshStandardMaterial color="#ead6a0" roughness={.8} />
      {Array.from({ length: Math.floor(length / 5) }, (_, i) => <Instance key={i} position={[0, .012, i * 5 - length / 2 + 3]} />)}
    </Instances>
    <Instances limit={40}><boxGeometry args={[.18, 2.4, .18]} /><meshStandardMaterial color="#49515a" metalness={.6} roughness={.45} />
      {Array.from({ length: Math.floor(length / 12) }, (_, i) => [-1, 1].map(side => <Instance key={`${i}-${side}`} position={[side * 5.2, 1.2, i * 12 - length / 2 + 5]} />))}
    </Instances>
  </group>;
}

function Arena({ index }: { index: number }) {
  const def = BOSS_DEFS[index], concrete = usePbr('concrete', 10);
  return <group position={[def.x, 0, def.z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .07, 0]} receiveShadow><circleGeometry args={[37, 96]} /><meshStandardMaterial {...concrete} color={index === 0 ? '#655347' : index === 1 ? '#8ca7a4' : '#5b526b'} roughness={.85} normalScale={[.55, .55]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .09, 0]}><ringGeometry args={[37, 42, 128]} /><meshPhysicalMaterial color={def.color} emissive={def.color} emissiveIntensity={index === 0 ? .75 : .18} metalness={.2} roughness={.22} clearcoat={1} /></mesh>
    {[9, 19, 30, 36].map(radius => <mesh key={radius} position={[0, .095, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius, radius + .1, 96]} /><meshBasicMaterial color={def.color} transparent opacity={.35} /></mesh>)}
    <mesh position={[0, .17, 39]} receiveShadow><boxGeometry args={[10, .3, 13]} /><meshStandardMaterial color="#71747b" metalness={.6} roughness={.55} /></mesh>
    {/* Structures stay outside the encounter floor, leaving readable escape routes. */}
    {Array.from({ length: index === 2 ? 8 : 10 }, (_, i) => {
      const angle = i / (index === 2 ? 8 : 10) * Math.PI * 2, x = Math.cos(angle) * 46, z = Math.sin(angle) * 46;
      const height = index === 2 ? 24 + i % 3 * 5 : 9 + i % 4 * 4;
      return <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
        <RigidBody type="fixed" colliders={false}><CuboidCollider args={[2, height / 2, 2]} position={[0, height / 2, 0]} /></RigidBody>
        <mesh position={[0, height / 2, 0]} scale={[4, height, 4]} castShadow receiveShadow>
          {index === 1 ? <octahedronGeometry args={[1, 0]} /> : <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial color={index === 1 ? '#426d7f' : '#33303a'} metalness={.65} roughness={.3} />
        </mesh>
        <mesh position={[0, height * .55, -2.04]}><planeGeometry args={[.35, height * .8]} /><meshBasicMaterial color={glow(def.color)} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, height + 1, 0]}><octahedronGeometry args={[1.2, 0]} /><meshBasicMaterial color={glow(def.color)} toneMapped={false} /></mesh>
      </group>;
    })}
    {index === 0 && <>
      {[0, 1, 2].map(i => <mesh key={i} position={[0, 24 + i * 4, 0]} rotation={[Math.PI / 2, 0, .3 * i]}><torusGeometry args={[16 - i * 3, .45, 12, 96]} /><meshStandardMaterial color="#443b34" metalness={.8} roughness={.3} /></mesh>)}
      <Sparkles count={90} position={[0, 12, 0]} scale={[60, 24, 60]} size={6} color="#ffc185" speed={.5} />
    </>}
    {index === 1 && <>
      {Array.from({ length: 12 }, (_, i) => <Float key={i} speed={.5} floatIntensity={2}><mesh position={[Math.cos(i * 2.4) * 22, 15 + i % 4 * 4, Math.sin(i * 2.4) * 22]} rotation={[.4, i, .3]}><octahedronGeometry args={[2 + i % 3, 0]} /><meshPhysicalMaterial color="#81d6df" metalness={.35} roughness={.12} clearcoat={1} emissive="#1b7780" emissiveIntensity={.35} /></mesh></Float>)}
      <Sparkles count={100} position={[0, 10, 0]} scale={[60, 20, 60]} size={4} color="#acffff" speed={.25} />
    </>}
    {index === 2 && <>
      <Float speed={.3} floatIntensity={.5}><mesh position={[0, 48, 0]}><sphereGeometry args={[10, 48, 32]} /><meshStandardMaterial color="#11121e" metalness={.95} roughness={.2} /></mesh>
        <mesh position={[0, 48, 0]} rotation={[.45, .1, .3]}><torusGeometry args={[15, .3, 12, 128]} /><meshBasicMaterial color={glow('#c18bff', 3)} toneMapped={false} /></mesh>
      </Float>
      <mesh position={[0, 24, 0]}><cylinderGeometry args={[.7, 2, 48, 16, 1, true]} /><meshBasicMaterial color={glow(def.color)} transparent opacity={.15} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </>}
  </group>;
}

function FrontierScenery() {
  const rocks = useMemo(() => Array.from({ length: 160 }, (_, i) => {
    const a = i * 2.399, radius = 74 + (i * 37 % 90), x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    return { x, z, size: 1.5 + i % 5 };
  }).filter(p => BOSS_DEFS.every(b => Math.hypot(p.x - b.x, p.z - b.z) > 54) && Math.abs(p.x) > 12), []);
  return <>
    <Instances limit={rocks.length} castShadow receiveShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#6f7167" roughness={1} />
      {rocks.map((p, i) => <Instance key={i} position={[p.x, p.size * .3, p.z]} scale={[p.size, p.size * .7, p.size * .8]} rotation={[i * .2, i, .1]} />)}
    </Instances>
    {/* Navigation pylons establish the scale of the frontier. */}
    {OUTPOSTS.map(p => <group key={p.name} position={[p.x, 0, p.z]}>
      <mesh position={[0, .06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.5, 6, 48]} /><meshBasicMaterial color={p.color} /></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * 6, 5, 0]}><boxGeometry args={[.5, 10, .5]} /><meshStandardMaterial color="#343e47" metalness={.7} roughness={.4} /></mesh>)}
      <mesh position={[0, 10, 0]}><boxGeometry args={[13, 1.2, .6]} /><meshStandardMaterial color="#283b46" /></mesh>
      <Text font={font} position={[0, 10, .35]} fontSize={.6} color={p.color}>{p.name} / BASE</Text>
    </group>)}
    {Array.from({ length: 48 }, (_, i) => {
      const side = Math.floor(i / 12), t = (i % 12) / 11 * WORLD_HALF * 2 - WORLD_HALF;
      return <mesh key={i} position={[side % 2 ? (side === 1 ? WORLD_HALF : -WORLD_HALF) : t, 7 + i % 4, side % 2 ? t : (side === 0 ? WORLD_HALF : -WORLD_HALF)]} scale={[9, 10 + i % 5, 7]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#777c79" roughness={1} /></mesh>;
    })}
  </>;
}

export const Frontier = memo(function Frontier() {
  return <group>
    {BOSS_DEFS.map((b, i) => <group key={b.id}><Highway x={b.entry[0]} z={b.entry[1]} /><Arena index={i} /></group>)}
    {PORTALS.map((gate, i) => <TransitGate key={i} gate={gate} />)}
    <FrontierScenery />
  </group>;
});
