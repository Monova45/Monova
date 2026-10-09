import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Float, Text, Sparkles, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { groundTexture, skyMaterial, windowTexture } from './materials';
export { Cat } from './character';

const light = '#ff8528';
const neon = (color: string, k = 3) => new THREE.Color(color).multiplyScalar(k);
const font = '/fonts/jersey-10.ttf';

function Box({ position, scale, color = '#232a34', glow = false, intensity = 3 }: { position: [number, number, number]; scale: [number, number, number]; color?: string; glow?: boolean; intensity?: number }) {
  const c = useMemo(() => neon(color, intensity), [color, intensity]);
  return <mesh position={position} castShadow={!glow} receiveShadow={!glow}><boxGeometry args={scale} />
    {glow ? <meshBasicMaterial color={c} toneMapped={false} /> : <meshStandardMaterial color={color} metalness={.65} roughness={.42} />}</mesh>;
}

function Facade({ width, height, depth = width, seed, warm }: { width: number; height: number; depth?: number; seed: number; warm?: number }) {
  const material = useMemo(() => {
    const map = windowTexture(Math.max(3, Math.round(width * 2.2)), Math.max(4, Math.round(height * 1.8)), seed, warm);
    return new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color('#ffffff'), emissiveIntensity: .9, metalness: .7, roughness: .32, color: '#6d7a89' });
  }, [width, height, seed, warm]);
  return <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={material}><boxGeometry args={[width, height, depth]} /></mesh>;
}

function Tower({ x, z, height = 12, width = 5, seed = 1 }: { x: number; z: number; height?: number; width?: number; seed?: number }) {
  return <group position={[x, 0, z]}>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[width / 2, height / 2, width / 2]} position={[0, height / 2, 0]} /></RigidBody>
    <Facade width={width} height={height} seed={seed} />
    <Box position={[0, height + .18, 0]} scale={[width + .35, .35, width + .35]} color="#3c4754" />
    <Box position={[-width / 2 - .03, height / 2, width / 2 + .03]} scale={[.06, height, .06]} color={light} glow intensity={4} />
    <Box position={[0, height + .4, -width / 2 - .05]} scale={[width - .4, .06, .06]} color={seed % 2 ? light : '#7fc4ff'} glow />
    {seed % 3 === 0 && <Beacon position={[0, height + 1.4, 0]} />}
  </group>;
}

/** Blinking aviation light on rooftops. */
function Beacon({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  const offset = (position[0] * 7 + position[2] * 3) % 5;
  useFrame(({ clock }) => { if (mesh.current) mesh.current.scale.setScalar(Math.sin(clock.elapsedTime * 2 + offset) > .6 ? 1 : .2); });
  return <group position={position}><mesh position={[0, -.6, 0]}><cylinderGeometry args={[.04, .06, 1.2, 6]} /><meshStandardMaterial color="#3c4754" /></mesh>
    <mesh ref={mesh}><sphereGeometry args={[.13, 10, 8]} /><meshBasicMaterial color={neon('#ff3020', 6)} toneMapped={false} /></mesh></group>;
}

function DistrictSign({ position, title, index, rotation = 0 }: { position: [number, number, number]; title: string; index: string; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <Box position={[0, 1.7, 0]} scale={[5.2, 2.3, .25]} color="#0c121b" />
    <Box position={[-2.55, 1.7, .14]} scale={[.06, 2.3, .03]} color={light} glow intensity={4} />
    <Text font={font} position={[-2.15, 2.1, .15]} anchorX="left" fontSize={.6}>{index}<meshBasicMaterial color={neon('#ffffff', 1.4)} toneMapped={false} /></Text>
    <Text font={font} position={[-2.15, 1.35, .15]} anchorX="left" fontSize={.46}>{title}<meshBasicMaterial color={neon(light, 2.4)} toneMapped={false} /></Text>
    <Box position={[0, .3, 0]} scale={[.15, 1, .15]} />
  </group>;
}

/** Floating holographic panel; purely decorative. */
function Hologram({ position, text, color = light, rotation = 0, size = 1 }: { position: [number, number, number]; text: string; color?: string; rotation?: number; size?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.position.y = position[1] + Math.sin(clock.elapsedTime * .8 + position[0]) * .25; });
  return <group ref={group} position={position} rotation={[0, rotation, 0]} scale={size}>
    <mesh><planeGeometry args={[6, 1.8]} /><meshBasicMaterial color={neon(color, .5)} transparent opacity={.12} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh>
    <Box position={[0, .92, 0]} scale={[6, .03, .03]} color={color} glow />
    <Box position={[0, -.92, 0]} scale={[6, .03, .03]} color={color} glow />
    <Text font={font} fontSize={.95} position={[0, -.05, .02]}>{text}<meshBasicMaterial color={neon(color, 2.2)} toneMapped={false} side={THREE.DoubleSide} /></Text>
  </group>;
}

const roads = [-36, -12, 12, 36];

function Streets() {
  const lamps = useMemo(() => roads.flatMap(n => Array.from({ length: 8 }, (_, i) => i * 12.5 - 44).flatMap(t => [[n + 4.6, t], [t, n + 4.6]] as [number, number][])), []);
  const ground = useMemo(() => groundTexture(), []);
  return <>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[50, 1, 50]} position={[0, -1, 0]} /></RigidBody>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial map={ground} color="#8c99a8" metalness={.55} roughness={.55} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, 0]}><planeGeometry args={[400, 400]} /><meshStandardMaterial color="#070b12" roughness={.9} /></mesh>
    {roads.map(n => <group key={n}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[n, .012, 0]} receiveShadow><planeGeometry args={[8, 100]} /><meshStandardMaterial color="#0b1018" metalness={.7} roughness={.3} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .014, n]} receiveShadow><planeGeometry args={[100, 8]} /><meshStandardMaterial color="#0b1018" metalness={.7} roughness={.3} /></mesh>
      {[-1, 1].map(k => <group key={k}><Box position={[n + k * 4, .03, 0]} scale={[.07, .02, 100]} color="#4f7a96" glow intensity={1.2} /><Box position={[0, .03, n + k * 4]} scale={[100, .02, .07]} color="#4f7a96" glow intensity={1.2} /></group>)}
    </group>)}
    <Instances limit={260}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={neon('#c7d6e2', 1.3)} toneMapped={false} />
      {roads.flatMap(n => Array.from({ length: 16 }, (_, i) => [<Instance key={`a${n}${i}`} position={[n, .03, i * 6 - 45]} scale={[.12, .02, 1.6]} />, <Instance key={`b${n}${i}`} position={[i * 6 - 45, .03, n]} scale={[1.6, .02, .12]} />]))}
    </Instances>
    <Instances limit={80} castShadow><cylinderGeometry args={[.06, .09, 1, 6]} /><meshStandardMaterial color="#2a333f" metalness={.8} roughness={.3} />
      {lamps.map(([x, z], i) => <Instance key={i} position={[x, 2.2, z]} scale={[1, 4.4, 1]} />)}
    </Instances>
    <Instances limit={80}><boxGeometry args={[.5, .08, .22]} /><meshBasicMaterial color={neon('#ffd2a1', 5)} toneMapped={false} />
      {lamps.map(([x, z], i) => <Instance key={i} position={[x, 4.4, z]} />)}
    </Instances>
    {[-1, 1].map(n => <group key={`edge${n}`}><Box position={[n * 49.5, .2, 0]} scale={[.15, .4, 99]} color={light} glow /><Box position={[0, .2, n * 49.5]} scale={[99, .4, .15]} color={light} glow /></group>)}
  </>;
}

function Skyline() {
  return <>{Array.from({ length: 30 }, (_, i) => {
    const a = i * Math.PI / 15, r = 68 + (i % 3) * 10, h = 26 + (i * 7) % 5 * 7, w = 6 + i % 3 * 2;
    return <group key={i} position={[Math.cos(a) * r, -1, Math.sin(a) * r]} rotation={[0, -a, 0]}>
      <Facade width={w} height={h} seed={i + 40} warm={.4} />
      <Box position={[w / 2 + .05, h / 2, w / 2 + .05]} scale={[.12, h, .12]} color={i % 4 ? '#4e86b3' : light} glow intensity={2} />
      {i % 4 === 0 && <Beacon position={[0, h + 1.2, 0]} />}
    </group>;
  })}</>;
}

export const World = memo(function World() {
  const sky = useMemo(() => skyMaterial(), []);
  return <group>
    <mesh material={sky}><sphereGeometry args={[190, 32, 16]} /></mesh>
    <Streets />
    {/* A raised central gateway leaves the playable center open. */}
    <Tower x={-8} z={7} height={16} width={4} seed={7} /><Tower x={8} z={7} height={16} width={4} seed={8} />
    <Box position={[0, 15, 7]} scale={[20, 3, 4]} color="#202a36" />
    <Text font={font} position={[0, 15, 4.95]} fontSize={1.9}>MONOVA<meshBasicMaterial color={neon('#ffffff', 2.2)} toneMapped={false} /></Text>
    <Box position={[0, 13.55, 4.95]} scale={[19, .1, .05]} color={light} glow intensity={5} />
    <Box position={[0, 16.45, 4.95]} scale={[19, .05, .05]} color={light} glow intensity={2} />
    <DistrictSign position={[0, 0, 10]} title="HEADQUARTERS" index="M / 00" />
    <Hologram position={[0, 9, -6]} text="IDEAS THAT WORK" />
    {/* Code district: server canyon. */}
    {[-30, -23, -16].flatMap((x, i) => [-30, -17].map((z, j) => <Tower key={`code${i}${j}`} x={x} z={z} height={8 + i * 3 + j} width={3} seed={i * 2 + j + 11} />))}
    <DistrictSign position={[-23, 0, -12]} title="CODE DISTRICT" index="01 / CODE" />
    <Hologram position={[-23, 13, -24]} text="</> CODE" color="#7fc4ff" rotation={Math.PI / 4} size={.7} />
    {/* Design lab: ivory exhibition pavilion and suspended sculpture. */}
    {[-1, 1].map(n => <group key={n}><Tower x={23 + n * 7} z={-29} height={6} width={3} seed={20 + n} />
      <RigidBody type="fixed"><mesh position={[23 + n * 7, 2, -19]} castShadow receiveShadow><boxGeometry args={[1, 4, 8]} /><meshStandardMaterial color="#7d8995" metalness={.6} roughness={.3} /></mesh></RigidBody>
      <Box position={[23 + n * 7.55, 2, -19]} scale={[.04, 3.6, 7.6]} color="#ffe2c4" glow intensity={1.6} /></group>)}
    <mesh position={[23, 7, -25]} castShadow><boxGeometry args={[18, .45, 13]} /><meshStandardMaterial color="#6f7b88" metalness={.7} roughness={.3} /></mesh>
    <Box position={[23, 6.74, -25]} scale={[17, .04, 12]} color="#ffe9d2" glow intensity={.45} />
    <Float speed={1.2} floatIntensity={.4}><mesh position={[23, 3.7, -23]} rotation={[.4, .5, .2]} castShadow><torusKnotGeometry args={[1.8, .45, 160, 24]} /><meshStandardMaterial color="#eef2f6" metalness={1} roughness={.12} /></mesh></Float>
    <DistrictSign position={[23, 0, -12]} title="DESIGN LAB" index="02 / CREATE" />
    {/* AI core: radial reactor and energy ring. */}
    <group position={[23, 0, 23]}>
      <mesh position={[0, .2, 0]} receiveShadow><cylinderGeometry args={[6, 7, .4, 64]} /><meshStandardMaterial color="#26313d" metalness={.85} roughness={.25} /></mesh>
      <mesh position={[0, .42, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.6, 5.8, 96]} /><meshBasicMaterial color={neon(light, 4)} toneMapped={false} /></mesh>
      <Reactor />
      <Sparkles count={60} scale={[10, 9, 10]} position={[0, 4, 0]} size={4} speed={.4} color="#ffb15c" />
      <pointLight position={[0, 4, 0]} color="#ff7a00" intensity={120} distance={22} decay={2} />
    </group>
    {[0, 1, 2, 3].map(i => <Tower key={`ai${i}`} x={23 + Math.cos(i * Math.PI / 2) * 8} z={23 + Math.sin(i * Math.PI / 2) * 8} height={6} width={2} seed={30 + i} />)}
    <DistrictSign position={[23, 0, 34]} title="AI CORE" index="03 / THINK" />
    {/* Corrupted neighborhood: broken silhouettes and violet energy. */}
    {Array.from({ length: 8 }, (_, i) => <group key={i} position={[-30 + (i % 3) * 6, 0, 18 + Math.floor(i / 3) * 7]}>
      <RigidBody type="fixed"><mesh position={[0, 2, 0]} castShadow receiveShadow rotation={[0, i * .4, (i % 2 ? .06 : -.05)]}><boxGeometry args={[2, 4, 2]} /><meshStandardMaterial color="#2c2638" metalness={.6} roughness={.45} /></mesh></RigidBody>
      <Box position={[0, 4.05, 0]} scale={[2.05, .05, 2.05]} color="#b45cff" glow intensity={3} />
      <Float speed={3} floatIntensity={.6} rotationIntensity={.6}><mesh position={[0, 6.5 + i % 3, 0]} rotation={[.2 * i, .4, .25]}><boxGeometry args={[1.6, 1.6, 1.6]} /><meshStandardMaterial color="#3a2d4c" emissive="#9d4dff" emissiveIntensity={.6 + (i % 3) * .5} metalness={.6} roughness={.3} wireframe={i % 3 === 0} /></mesh></Float>
    </group>)}
    <Sparkles count={70} scale={[20, 8, 20]} position={[-24, 4, 25]} size={5} speed={.6} color="#b26bff" />
    <pointLight position={[-24, 5, 25]} color="#9d4dff" intensity={90} distance={26} decay={2} />
    <Hologram position={[-24, 11, 30]} text="ERROR 404" color="#b45cff" rotation={-Math.PI / 4} size={.8} />
    <DistrictSign position={[-23, 0, 34]} title="BUG ZONE" index="04 / CORRUPT" />
    {/* Drifting data particles over the whole arena. */}
    <Sparkles count={160} scale={[90, 18, 90]} position={[0, 8, 0]} size={2.5} speed={.25} opacity={.6} color="#9fc8ea" />
    {/* Skyline beyond the arena is visual only. */}
    <Skyline />
  </group>;
});

function Reactor() {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (rings.current) { rings.current.rotation.y += dt * .4; rings.current.children.forEach((c, i) => { c.rotation.x += dt * (.3 + i * .2); }); } });
  return <Float speed={2}>
    <mesh position={[0, 4, 0]}><sphereGeometry args={[1.5, 48, 32]} /><meshBasicMaterial color={neon('#ff9a3c', 3.2)} toneMapped={false} /></mesh>
    <mesh position={[0, 4, 0]}><sphereGeometry args={[1.85, 32, 24]} /><meshBasicMaterial color={neon(light, .6)} transparent opacity={.15} toneMapped={false} depthWrite={false} /></mesh>
    <group ref={rings} position={[0, 4, 0]}>{[0, 1, 2].map(i => <mesh key={i} rotation={[i * .8, .4 + i, .4]}><torusGeometry args={[2.8 + i * .5, .05, 8, 96]} /><meshStandardMaterial color="#d4e0eb" metalness={1} roughness={.18} /></mesh>)}</group>
  </Float>;
}
