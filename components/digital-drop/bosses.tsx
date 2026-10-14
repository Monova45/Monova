import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BOSS_DEFS, BossRuntime, bossDuration, bossUnlocked, enraged } from './campaign';

const bright = (color: string, intensity = 2) => new THREE.Color(color).multiplyScalar(intensity);

function Guardian({ boss, bosses }: { boss: BossRuntime; bosses: BossRuntime[] }) {
  const def = BOSS_DEFS[boss.id];
  const body = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null), ground = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Group>(null), targets = useRef<(THREE.Group | null)[]>([]), seal = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, alive = boss.hp > 0, unlocked = bossUnlocked(boss.id, bosses);
    if (body.current) {
      body.current.visible = alive;
      body.current.position.y = 6 + Math.sin(t * .7 + boss.id) * .5;
      body.current.rotation.y = t * (boss.id === 0 ? .1 : .18);
      body.current.scale.setScalar(boss.phase === 'windup' ? 1 + Math.sin(t * 9) * .025 : 1);
    }
    if (rotor.current) { rotor.current.rotation.y = -t * .45; rotor.current.rotation.z = Math.sin(t * .2) * .18; }
    if (seal.current) { seal.current.visible = alive && !unlocked; seal.current.rotation.y = t * .12; }
    if (ground.current) {
      ground.current.visible = alive && unlocked && (boss.phase === 'attack' || boss.phase === 'windup') && def.attack === 'wave';
      const radius = boss.phase === 'attack' ? 3 + boss.elapsed / bossDuration(boss) * 34 : 37;
      ground.current.scale.set(radius, radius, 1);
      (ground.current.material as THREE.MeshBasicMaterial).opacity = boss.phase === 'attack' ? .95 : .3 + Math.sin(t * 9) * .15;
    }
    if (beam.current) {
      beam.current.visible = alive && (boss.phase === 'windup' || boss.phase === 'attack') && def.attack === 'beam';
      beam.current.rotation.y = boss.aim + (boss.phase === 'attack' ? boss.elapsed * (enraged(boss) ? 1 : .62) : 0);
      beam.current.scale.x = boss.phase === 'attack' ? 1 : .25;
    }
    targets.current.forEach((target, i) => {
      if (!target) return;
      target.visible = alive && def.attack === 'meteor' && Boolean(boss.targets[i]) && (boss.phase === 'windup' || boss.phase === 'attack');
      if (!boss.targets[i]) return;
      target.position.set(boss.targets[i].x - def.x, .14, boss.targets[i].z - def.z);
      target.children[1].scale.y = boss.phase === 'attack' ? 1 : .025;
    });
  });
  return <group position={[def.x, 0, def.z]}>
    <mesh ref={seal} position={[0, 6, 0]}><icosahedronGeometry args={[8, 2]} /><meshBasicMaterial color="#a384ff" wireframe transparent opacity={.16} /></mesh>
    <group ref={body} position={[0, 6, 0]}>
      {boss.id === 0 ? <>
        <mesh castShadow><dodecahedronGeometry args={[3.4, 0]} /><meshStandardMaterial color="#3b3431" metalness={.8} roughness={.3} /></mesh>
        <mesh><octahedronGeometry args={[2.9, 0]} /><meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={2.2} wireframe /></mesh>
        {[-1, 1].map(side => <group key={side} position={[side * 4, -.5, 0]} rotation={[0, 0, side * -.2]}>
          <mesh castShadow><boxGeometry args={[2.2, 4.5, 2.2]} /><meshStandardMaterial color="#71675d" metalness={.8} roughness={.35} /></mesh>
          <mesh position={[0, -2.5, 0]}><cylinderGeometry args={[1.5, 1.7, 1.2, 8]} /><meshStandardMaterial color="#25282d" metalness={.8} roughness={.25} /></mesh>
          <mesh position={[0, -.2, -1.12]}><planeGeometry args={[1.3, 2.7]} /><meshBasicMaterial color={bright(def.color)} toneMapped={false} /></mesh>
        </group>)}
      </> : boss.id === 1 ? <>
        <mesh castShadow><icosahedronGeometry args={[2.8, 2]} /><meshPhysicalMaterial color="#254b62" metalness={.55} roughness={.13} clearcoat={1} /></mesh>
        {[0, 1, 2].map(i => <mesh key={i} rotation={[i * 1.05, .4, i * .6]}><torusGeometry args={[4.5, .12, 8, 64]} /><meshBasicMaterial color={bright(def.color)} toneMapped={false} /></mesh>)}
      </> : <>
        <mesh castShadow><icosahedronGeometry args={[4, 1]} /><meshStandardMaterial color="#211a32" metalness={.9} roughness={.22} /></mesh>
        <mesh><icosahedronGeometry args={[4.08, 1]} /><meshBasicMaterial color={bright(def.color)} wireframe toneMapped={false} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[6.5, .28, 12, 96]} /><meshStandardMaterial color="#696076" metalness={.85} roughness={.2} /></mesh>
      </>}
      <mesh position={[0, .1, -3.05]}><sphereGeometry args={[boss.id === 2 ? 1.35 : .95, 24, 16]} /><meshBasicMaterial color={bright(def.color, 4)} toneMapped={false} /></mesh>
      <group ref={rotor}>
        {Array.from({ length: boss.id === 2 ? 8 : 6 }, (_, i) => {
          const a = i / (boss.id === 2 ? 8 : 6) * Math.PI * 2, radius = boss.id === 2 ? 7 : 4.7;
          return <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a * 2) * 1.6, Math.sin(a) * radius]} rotation={[.4, a, .3]} castShadow><octahedronGeometry args={[boss.id === 2 ? 1.5 : .8, 0]} /><meshPhysicalMaterial color={def.color} emissive={def.color} emissiveIntensity={.25} metalness={.55} roughness={.2} clearcoat={1} /></mesh>;
        })}
      </group>
    </group>
    <Float speed={.5} floatIntensity={.1}><Text position={[0, 17, 0]} rotation={[0, Math.PI, 0]} font="/fonts/jersey-10.ttf" fontSize={1.4} color={def.color}>{def.region}</Text></Float>
    <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} position={[0, .16, 0]} visible={false}><ringGeometry args={[.955, 1, 128]} /><meshBasicMaterial color={bright(def.color)} transparent opacity={.8} toneMapped={false} depthWrite={false} /></mesh>
    <group ref={beam} visible={false}>
      <mesh position={[0, .15, 22]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3, 40]} /><meshBasicMaterial color={bright(def.color)} transparent opacity={.65} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0, 1, 22]}><boxGeometry args={[1.4, 2, 40]} /><meshBasicMaterial color={bright(def.color, 3)} transparent opacity={.4} toneMapped={false} depthWrite={false} /></mesh>
    </group>
    {[0, 1, 2, 3].map(i => <group key={i} ref={node => { targets.current[i] = node; }} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.1, 4.8, 48]} /><meshBasicMaterial color={bright(def.color)} transparent opacity={.8} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[0, 5, 0]}><cylinderGeometry args={[.3, 4.8, 10, 16]} /><meshBasicMaterial color={bright(def.color, 3)} transparent opacity={.55} toneMapped={false} depthWrite={false} /></mesh>
    </group>)}
  </group>;
}

export function Bosses({ bosses }: { bosses: BossRuntime[] }) {
  return <>{bosses.map(boss => <Guardian key={boss.id} boss={boss} bosses={bosses} />)}</>;
}
