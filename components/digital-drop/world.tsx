import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Float, Text, Sparkles, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { canopyTexture, glassTexture } from './materials';
import { metricBox, usePbr } from './pbr';
export { Cat } from './character';

const font = '/fonts/jersey-10.ttf';
const hot = (color: string, k = 3) => new THREE.Color(color).multiplyScalar(k);
const roads = [-36, -12, 12, 36];

// Deterministic pseudo-random so scenery is identical for every player in a room.
function seeded(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function Box({ position, scale, color = '#d9dee6', rotation, cast = true }: { position: [number, number, number]; scale: [number, number, number]; color?: string; rotation?: [number, number, number]; cast?: boolean }) {
  const surface = usePbr('concrete');
  const [w, h, d] = scale;
  const geometry = useMemo(() => metricBox(w, h, d), [w, h, d]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow geometry={geometry}><meshStandardMaterial {...surface} color={color} normalScale={[.45, .45]} roughness={.92} /></mesh>;
}

const facadeColors = ['#c5b9a5', '#b69780', '#a6b5ae', '#aab7c0', '#c4b496', '#dddcd4', '#a4a3ad', '#8b9da8'];

/** Actual recessed window layers, separate from the mineral facade. Two instanced draws per tower. */
function Facade({ width, height, depth = width, seed }: { width: number; height: number; depth?: number; seed: number }) {
  const surface = usePbr('concrete');
  const geometry = useMemo(() => metricBox(width, height, depth), [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const glass = useMemo(() => glassTexture(), []);
  const windows = useMemo(() => {
    const list: { position: [number, number, number]; rotation: [number, number, number]; width: number; tint: string }[] = [];
    const random = seeded(seed * 79 + 1), rows = Math.max(2, Math.floor((height - 1.5) / 2.1));
    for (let face = 0; face < 4; face++) {
      const span = face % 2 ? depth : width, columns = Math.max(1, Math.floor(span / 1.35));
      const angle = face * Math.PI / 2, distance = (face % 2 ? width : depth) / 2 + .025;
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const lateral = ((x + .5) / columns - .5) * span;
        list.push({ position: [Math.cos(angle) * lateral + Math.sin(angle) * distance, 2.1 + y * (height - 2.9) / Math.max(1, rows - 1), -Math.sin(angle) * lateral + Math.cos(angle) * distance], rotation: [0, angle, 0], width: span / columns * .66, tint: random() > .8 ? '#d8c7a9' : '#afc5cf' });
      }
    }
    return list;
  }, [width, height, depth, seed]);
  return <group>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow geometry={geometry}><meshStandardMaterial {...surface} color={facadeColors[seed % facadeColors.length]} normalScale={[.55, .55]} roughness={.95} /></mesh>
    <Instances limit={windows.length} receiveShadow><boxGeometry args={[1, 1, .09]} /><meshStandardMaterial color="#41494b" metalness={.7} roughness={.4} />
      {windows.map((w, i) => <Instance key={i} position={w.position} rotation={w.rotation} scale={[w.width + .12, 1.5, 1]} />)}
    </Instances>
    <Instances limit={windows.length} receiveShadow><planeGeometry args={[1, 1]} /><meshPhysicalMaterial map={glass} roughness={.16} metalness={.32} clearcoat={1} clearcoatRoughness={.08} envMapIntensity={1.25} />
      {windows.map((w, i) => <Instance key={i} position={[w.position[0] + Math.sin(w.rotation[1]) * .051, w.position[1], w.position[2] + Math.cos(w.rotation[1]) * .051]} rotation={w.rotation} scale={[w.width, 1.34, 1]} color={w.tint} />)}
    </Instances>
  </group>;
}

const roofColors = ['#82574b', '#516573', '#53665c', '#9c8762', '#696272', '#454d53'];

function Tower({ x, z, height = 12, width = 5, seed = 1 }: { x: number; z: number; height?: number; width?: number; seed?: number }) {
  const roof = roofColors[seed % roofColors.length];
  return <group position={[x, 0, z]}>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[width / 2, height / 2, width / 2]} position={[0, height / 2, 0]} /></RigidBody>
    <Facade width={width} height={height} seed={seed} />
    {/* Recessed entry, canopy and structural bands give the towers readable scale. */}
    <Box position={[0, 1.25, -width / 2 - .035]} scale={[width * .48, 2.5, .08]} color="#223847" />
    <Box position={[0, 2.6, -width / 2 - .35]} scale={[width * .75, .18, .85]} color={roof} />
    {[-1, 1].map(side => <Box key={side} position={[side * (width / 2 - .12), height / 2, -width / 2 - .04]} scale={[.18, height, .12]} color="#ece6d9" />)}
    {Array.from({ length: Math.max(1, Math.floor(height / 4)) }, (_, i) => <Box key={i} position={[0, (i + 1) * 3.5, 0]} scale={[width + .13, .12, width + .13]} color="#e4dfd3" cast={false} />)}
    <Box position={[0, height + .2, 0]} scale={[width + .4, .4, width + .4]} color={roof} />
    <Box position={[0, .3, 0]} scale={[width + .25, .6, width + .25]} color="#e9e4da" />
    {width > 2.5 && <><Box position={[width * .2, height + .75, -width * .15]} scale={[1, .7, .8]} color="#c9ced6" /><Box position={[-width * .22, height + .6, width * .2]} scale={[.6, .4, .6]} color="#aeb5bf" /></>}
    {seed % 3 === 0 && <Antenna position={[0, height + .4, 0]} />}
  </group>;
}

/** Rooftop antenna with a blinking tip. */
function Antenna({ position }: { position: [number, number, number] }) {
  const tip = useRef<THREE.Mesh>(null);
  const offset = (position[0] * 7 + position[2] * 3) % 5;
  useFrame(({ clock }) => { if (tip.current) tip.current.scale.setScalar(Math.sin(clock.elapsedTime * 2 + offset) > .5 ? 1 : .4); });
  return <group position={position}><mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[.05, .08, 2, 6]} /><meshStandardMaterial color="#7a838f" /></mesh>
    <mesh ref={tip} position={[0, 2.05, 0]}><sphereGeometry args={[.14, 10, 8]} /><meshBasicMaterial color={hot('#ff3b30', 2)} toneMapped={false} /></mesh></group>;
}

/** Roadside district sign: blue panel, yellow header, on two posts. */
function DistrictSign({ position, title, index, rotation = 0 }: { position: [number, number, number]; title: string; index: string; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-2, 2].map(x => <Box key={x} position={[x, 1, 0]} scale={[.18, 2, .18]} color="#5b6470" />)}
    <Box position={[0, 2.6, 0]} scale={[5.4, 1.9, .2]} color="#1f6fe0" />
    <Box position={[0, 3.35, .02]} scale={[5.4, .45, .22]} color="#ffd23f" />
    <Text font={font} position={[0, 3.33, .14]} fontSize={.4} color="#1b1b1b">{index}</Text>
    <Text font={font} position={[0, 2.4, .12]} fontSize={.68} color="#ffffff" outlineWidth={.02} outlineColor="#0a2a6b">{title}</Text>
  </group>;
}

/** Floating billboard panel with a gentle bob. */
function Billboard3D({ position, text, color = '#ff8a1e', rotation = 0, size = 1 }: { position: [number, number, number]; text: string; color?: string; rotation?: number; size?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.position.y = position[1] + Math.sin(clock.elapsedTime * .8 + position[0]) * .25; });
  return <group ref={group} position={position} rotation={[0, rotation, 0]} scale={size}>
    <mesh castShadow><boxGeometry args={[6.4, 2, .25]} /><meshStandardMaterial color={color} roughness={.5} /></mesh>
    <mesh position={[0, 0, .13]}><planeGeometry args={[6, 1.6]} /><meshStandardMaterial color="#ffffff" roughness={.6} /></mesh>
    <Text font={font} fontSize={.95} position={[0, -.05, .15]} color={color}>{text}</Text>
    <Text font={font} fontSize={.95} position={[0, -.05, -.14]} rotation={[0, Math.PI, 0]} color="#ffffff">{text}</Text>
  </group>;
}

function Streets() {
  const lamps = useMemo(() => roads.flatMap(n => Array.from({ length: 8 }, (_, i) => i * 12.5 - 44).flatMap(t => [[n + 4.8, t], [t, n + 4.8]] as [number, number][])), []);
  const grass = usePbr('grass', 260);
  const roadV = usePbr('asphalt', 2, 25), roadH = usePbr('asphalt', 25, 2);
  return <>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[50, 1, 50]} position={[0, -1, 0]} /></RigidBody>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[520, 520]} /><meshStandardMaterial {...grass} normalScale={[.75, .75]} roughness={1} /></mesh>
    {roads.map(n => <group key={n}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[n, .02, 0]} receiveShadow><planeGeometry args={[8, 100]} /><meshStandardMaterial {...roadV} normalScale={[.65, .65]} roughness={.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .025, n]} receiveShadow><planeGeometry args={[100, 8]} /><meshStandardMaterial {...roadH} normalScale={[.65, .65]} roughness={.9} /></mesh>
      {[-1, 1].map(k => <group key={k}>
        <Box position={[n + k * 4.6, .07, 0]} scale={[1.2, .14, 100]} color="#cfd3d8" cast={false} />
        <Box position={[0, .07, n + k * 4.6]} scale={[100, .14, 1.2]} color="#cfd3d8" cast={false} />
        <Box position={[n + k * 3.7, .035, 0]} scale={[.12, .01, 100]} color="#ffd23f" cast={false} />
        <Box position={[0, .04, n + k * 3.7]} scale={[100, .01, .12]} color="#ffd23f" cast={false} />
      </group>)}
    </group>)}
    <Instances limit={260} receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffffff" roughness={.6} />
      {roads.flatMap(n => Array.from({ length: 16 }, (_, i) => [<Instance key={`a${n}${i}`} position={[n, .04, i * 6 - 45]} scale={[.16, .01, 2]} />, <Instance key={`b${n}${i}`} position={[i * 6 - 45, .045, n]} scale={[2, .01, .16]} />]))}
    </Instances>
    <Instances limit={80} castShadow><cylinderGeometry args={[.07, .1, 1, 8]} /><meshStandardMaterial color="#4a525c" roughness={.5} metalness={.4} />
      {lamps.map(([x, z], i) => <Instance key={i} position={[x, 2.4, z]} scale={[1, 4.8, 1]} />)}
    </Instances>
    <Instances limit={80}><boxGeometry args={[.7, .18, .35]} /><meshStandardMaterial color="#fffbe8" emissive="#fff3c4" emissiveIntensity={.4} />
      {lamps.map(([x, z], i) => <Instance key={i} position={[x, 4.85, z]} />)}
    </Instances>
    {/* Low wall around the playable square. */}
    {[-1, 1].map(n => <group key={`edge${n}`}><Box position={[n * 49.6, .35, 0]} scale={[.5, .7, 99.7]} color="#e9e4da" /><Box position={[0, .35, n * 49.6]} scale={[99.7, .7, .5]} color="#e9e4da" /></group>)}
  </>;
}


/** Repeated road markings and planting use instancing to keep draw calls low. */
function CityDetails() {
  const crossings = useMemo(() => roads.flatMap(x => roads.flatMap(z => [-1, 1].flatMap(side => Array.from({ length: 6 }, (_, i) => [
    [x - 2.7 + i * 1.08, z + side * 3.1, 0],
    [x + side * 3.1, z - 2.7 + i * 1.08, 1],
  ]).flat()))), []);
  const plants = useMemo(() => {
    const random = seeded(812);
    return Array.from({ length: 480 }, () => ({ x: random() * 96 - 48, z: random() * 96 - 48, size: .1 + random() * .18 })).filter(p => roads.every(r => Math.abs(p.x - r) > 6 && Math.abs(p.z - r) > 6));
  }, []);
  return <>
    <Instances limit={crossings.length}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#eee6d2" roughness={.95} />
      {crossings.map(([x, z, turn], i) => <Instance key={i} position={[x, .052, z]} scale={turn ? [1.3, .012, .48] : [.48, .012, 1.3]} />)}
    </Instances>
    <Instances limit={plants.length}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={1} />
      {plants.map((p, i) => <Instance key={i} position={[p.x, p.size * .5, p.z]} scale={[p.size, p.size * .7, p.size]} color={i % 4 === 0 ? '#eacb8e' : '#879774'} />)}
    </Instances>
    {/* Rings make each district recognizable from the airborne deployment. */}
    {[[23, -23, '#ff9659'], [23, 23, '#73c9df'], [-24, 25, '#bc83ed']].map(([x, z, color]) => <mesh key={String(color)} position={[Number(x), .065, Number(z)]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[9.5, 9.62, 64]} /><meshBasicMaterial color={String(color)} transparent opacity={.7} /></mesh>)}
  </>;
}

/** Stylized trees and bushes scattered on grass, skipping roads and districts. */
function Foliage() {
  const bark = usePbr('bark', 2, 1);
  const leaves = useMemo(() => canopyTexture(), []);
  const { trees, bushes } = useMemo(() => {
    const rand = seeded(42), trees: [number, number, number][] = [], bushes: [number, number, number][] = [];
    const blocked: [number, number, number][] = [[0, 7, 11], [-23, -23, 11], [23, -24, 12], [23, 23, 11], [-24, 25, 11]];
    const free = (x: number, z: number, margin: number) => roads.every(r => Math.abs(x - r) > 5.6 + margin && Math.abs(z - r) > 5.6 + margin) && blocked.every(([bx, bz, br]) => Math.hypot(x - bx, z - bz) > br);
    for (let i = 0; i < 900 && trees.length < 70; i++) {
      const x = rand() * 96 - 48, z = rand() * 96 - 48;
      if (free(x, z, .6)) trees.push([x, z, .8 + rand() * .7]);
    }
    for (let i = 0; i < 900 && bushes.length < 90; i++) {
      const x = rand() * 96 - 48, z = rand() * 96 - 48;
      if (free(x, z, 0)) bushes.push([x, z, .5 + rand() * .6]);
    }
    // Rolling scenery outside the arena.
    for (let i = 0; i < 140; i++) {
      const a = rand() * Math.PI * 2, r = 56 + rand() * 60;
      trees.push([Math.cos(a) * r, Math.sin(a) * r, 1 + rand() * 1.2]);
    }
    return { trees, bushes };
  }, []);
  return <>
    <Instances limit={trees.length} castShadow><cylinderGeometry args={[.18, .28, 1, 12]} /><meshStandardMaterial {...bark} normalScale={[.8, .8]} roughness={1} />
      {trees.map(([x, z, s], i) => <Instance key={i} position={[x, 1 * s, z]} scale={[s, 2 * s, s]} />)}
    </Instances>
    <Instances limit={trees.length * 5} castShadow><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial map={leaves} bumpMap={leaves} bumpScale={.06} roughness={1} />
      {trees.flatMap(([x, z, s], i) => Array.from({ length: 5 }, (_, j) => {
        const angle = j * 2.4 + i, radius = j === 4 ? .15 : .72;
        return <Instance key={`${i}-${j}`} position={[x + Math.cos(angle) * radius * s, (j === 4 ? 4 : 2.85 + (j % 2) * .45) * s, z + Math.sin(angle) * radius * s]} rotation={[i * .17, angle, j * .2]} scale={[(j === 4 ? .95 : 1.1) * s, 1.15 * s, s]} color={i % 3 ? '#b4bf97' : '#c6bd8c'} />;
      }))}
    </Instances>
    <Instances limit={bushes.length} castShadow receiveShadow><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial map={leaves} bumpMap={leaves} bumpScale={.05} roughness={1} />
      {bushes.map(([x, z, s], i) => <Instance key={i} position={[x, .35 * s, z]} scale={[s, .7 * s, s]} color={i % 2 ? '#a7b392' : '#c4bd98'} />)}
    </Instances>
  </>;
}

/** Green hills and distant blue mountains closing the horizon. */
function Horizon() {
  const hills = useMemo(() => {
    const rand = seeded(99);
    return Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2, r = 150 + rand() * 40; return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 30 + rand() * 30, h: 12 + rand() * 18, far: i % 2 === 0 }; });
  }, []);
  return <>{hills.map((h, i) => <mesh key={i} position={[h.x * (h.far ? 1.25 : 1), -2, h.z * (h.far ? 1.25 : 1)]} scale={[h.s, h.far ? h.h * 2 : h.h, h.s]}>
    <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={h.far ? '#8298ad' : '#809272'} roughness={1} />
  </mesh>)}</>;
}

export const World = memo(function World() {
  const concrete = usePbr('concrete');
  return <group>
    <Horizon />
    <Streets />
    <Foliage />
    <CityDetails />
    {/* HQ: raised central gateway in Monova orange. */}
    <Tower x={-8} z={7} height={16} width={4} seed={4} /><Tower x={8} z={7} height={16} width={4} seed={14} />
    <Box position={[0, 15, 7]} scale={[20, 3, 4]} color="#ff7a12" />
    <Text font={font} position={[0, 15, 4.9]} fontSize={2.1} color="#ffffff" outlineWidth={.05} outlineColor="#a33f00">MONOVA</Text>
    <DistrictSign position={[0, 0, 10]} title="HEADQUARTERS" index="M / 00" />
    <Billboard3D position={[0, 9, -6]} text="IDEAS THAT WORK" />
    {/* Code district: blue office canyon. */}
    {[-30, -23, -16].flatMap((x, i) => [-30, -17].map((z, j) => <Tower key={`code${i}${j}`} x={x} z={z} height={8 + i * 3 + j} width={3} seed={i * 2 + j + 11} />))}
    <DistrictSign position={[-23, 0, -12]} title="CODE DISTRICT" index="01 / CODE" />
    <Billboard3D position={[-23, 14, -24]} text="</> CODE" color="#1f6fe0" rotation={Math.PI / 4} size={.7} />
    {/* Design lab: white pavilion with a chrome sculpture. */}
    {[-1, 1].map(n => <group key={n}><Tower x={23 + n * 7} z={-29} height={6} width={3} seed={20 + n} />
      <RigidBody type="fixed"><mesh position={[23 + n * 7, 2, -19]} castShadow receiveShadow><boxGeometry args={[1, 4, 8]} /><meshStandardMaterial {...concrete} color="#dedbd2" normalScale={[.35, .35]} roughness={.85} /></mesh></RigidBody>
      <Box position={[23 + n * 7.55, 2, -19]} scale={[.05, 3.6, 7.6]} color="#ff7a12" cast={false} /></group>)}
    <mesh position={[23, 7, -25]} castShadow receiveShadow><boxGeometry args={[18, .45, 13]} /><meshStandardMaterial {...concrete} color="#dedbd2" normalScale={[.35, .35]} roughness={.85} /></mesh>
    <mesh position={[23, 7.26, -25]}><boxGeometry args={[14, .08, 9]} /><meshStandardMaterial color="#7cc4ff" roughness={.1} metalness={.3} transparent opacity={.85} /></mesh>
    <Float speed={1.2} floatIntensity={.4}><mesh position={[23, 3.7, -23]} rotation={[.4, .5, .2]} castShadow><torusKnotGeometry args={[1.8, .45, 160, 24]} /><meshStandardMaterial color="#ff7a12" metalness={.6} roughness={.2} /></mesh></Float>
    <DistrictSign position={[23, 0, -12]} title="DESIGN LAB" index="02 / CREATE" />
    {/* AI core: reactor plaza. */}
    <group position={[23, 0, 23]}>
      <mesh position={[0, .2, 0]} receiveShadow><cylinderGeometry args={[6, 7, .4, 64]} /><meshStandardMaterial {...concrete} color="#dfe5ee" normalScale={[.35, .35]} roughness={.8} /></mesh>
      <mesh position={[0, .42, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[5.4, 5.8, 96]} /><meshStandardMaterial color="#3a6fd6" roughness={.4} /></mesh>
      <Reactor />
      <Sparkles count={40} scale={[10, 9, 10]} position={[0, 4, 0]} size={5} speed={.4} color="#ffd23f" />
    </group>
    {[0, 1, 2, 3].map(i => <Tower key={`ai${i}`} x={23 + Math.cos(i * Math.PI / 2) * 8} z={23 + Math.sin(i * Math.PI / 2) * 8} height={6} width={2} seed={30 + i} />)}
    <DistrictSign position={[23, 0, 34]} title="AI CORE" index="03 / THINK" />
    {/* Bug zone: corrupted purple patch with floating glitch cubes. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-24, .03, 25]} receiveShadow><circleGeometry args={[11, 48]} /><meshStandardMaterial color="#5a2f8a" roughness={.9} /></mesh>
    {Array.from({ length: 8 }, (_, i) => <group key={i} position={[-30 + (i % 3) * 6, 0, 18 + Math.floor(i / 3) * 7]}>
      <RigidBody type="fixed"><mesh position={[0, 2, 0]} castShadow receiveShadow rotation={[0, i * .4, (i % 2 ? .06 : -.05)]}><boxGeometry args={[2, 4, 2]} /><meshStandardMaterial {...concrete} color="#7b4bc4" normalScale={[.5, .5]} roughness={.85} /></mesh></RigidBody>
      <Float speed={3} floatIntensity={.6} rotationIntensity={.6}><mesh position={[0, 6.5 + i % 3, 0]} rotation={[.2 * i, .4, .25]} castShadow><boxGeometry args={[1.6, 1.6, 1.6]} /><meshStandardMaterial color="#c77dff" emissive="#9d4dff" emissiveIntensity={.5} roughness={.4} /></mesh></Float>
    </group>)}
    <Sparkles count={60} scale={[20, 8, 20]} position={[-24, 4, 25]} size={6} speed={.6} color="#d9a6ff" />
    <Billboard3D position={[-24, 11, 30]} text="ERROR 404" color="#9b4dff" rotation={-Math.PI / 4} size={.8} />
    <DistrictSign position={[-23, 0, 34]} title="BUG ZONE" index="04 / CORRUPT" />
  </group>;
});

function Reactor() {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (rings.current) { rings.current.rotation.y += dt * .4; rings.current.children.forEach((c, i) => { c.rotation.x += dt * (.3 + i * .2); }); } });
  return <Float speed={2}>
    <mesh position={[0, 4, 0]} castShadow><sphereGeometry args={[1.5, 48, 32]} /><meshStandardMaterial color="#ffb347" emissive="#ff8a1e" emissiveIntensity={1.4} roughness={.3} /></mesh>
    <group ref={rings} position={[0, 4, 0]}>{[0, 1, 2].map(i => <mesh key={i} rotation={[i * .8, .4 + i, .4]} castShadow><torusGeometry args={[2.8 + i * .5, .09, 10, 96]} /><meshStandardMaterial color={['#1f6fe0', '#ffd23f', '#ffffff'][i]} roughness={.3} metalness={.3} /></mesh>)}</group>
  </Float>;
}
