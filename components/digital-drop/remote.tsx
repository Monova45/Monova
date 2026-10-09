import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Cat } from './character';
import { remotes, slotColors } from './net';
import { useDrop } from './state';

/** Teammate avatar: interpolates toward the latest network snapshot. */
function Teammate({ id }: { id: string }) {
  const group = useRef<THREE.Group>(null), avatar = useRef<THREE.Group>(null);
  const info = remotes.get(id), color = slotColors[info?.slot ?? 0];
  useFrame((_, dt) => {
    const r = remotes.get(id), g = group.current; if (!r || !g) return;
    const k = 1 - Math.exp(-12 * dt);
    r.x += (r.target.x - r.x) * k; r.y += (r.target.y - r.y) * k; r.z += (r.target.z - r.z) * k;
    g.position.set(r.x, r.y - .75, r.z);
    g.visible = r.alive && r.y > -40 && performance.now() - r.seen < 4000;
    if (avatar.current) avatar.current.rotation.y = THREE.MathUtils.damp(avatar.current.rotation.y, r.yaw, 14, dt);
  });
  return <group ref={group}>
    <group ref={avatar}><Cat local={false} /></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .03, 0]}><ringGeometry args={[.55, .62, 48]} /><meshBasicMaterial color={new THREE.Color(color).multiplyScalar(3)} toneMapped={false} transparent opacity={.9} /></mesh>
    <Billboard position={[0, 2.45, 0]}>
      <Text font="/fonts/jersey-10.ttf" fontSize={.34} outlineWidth={.025} outlineColor="#05070b" anchorY="bottom">{info?.name.toUpperCase() ?? 'AGENTE'}<meshBasicMaterial color={new THREE.Color(color).multiplyScalar(1.6)} toneMapped={false} /></Text>
    </Billboard>
  </group>;
}

export function RemotePlayers() {
  const lobby = useDrop(s => s.lobby);
  return <>{lobby.filter(p => remotes.has(p.id)).map(p => <Teammate key={p.id} id={p.id} />)}</>;
}
