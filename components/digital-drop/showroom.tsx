import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, MeshReflectorMaterial, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Cat } from './character';
import { windowTexture } from './materials';

const hot = (color: string, k: number) => new THREE.Color(color).multiplyScalar(k);

export function Showroom({ quality }: { quality: boolean }) {
  const cat = useRef<THREE.Group>(null), rings = useRef<THREE.Group>(null), scan = useRef<THREE.Mesh>(null);
  const look = useMemo(() => ({ target: new THREE.Vector3(), camera: new THREE.Vector3() }), []);
  const towers = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const h = 10 + (i * 5) % 4 * 5, map = windowTexture(4, Math.round(h * 1.3), i + 3, .35);
    return { x: -30 + i * 5, z: -16 - (i % 3) * 4, h, material: new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: .9, color: '#5d6a78', metalness: .6, roughness: .4 }) };
  }), []);
  useFrame(({ camera, clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    look.camera.set(9 + Math.sin(t * .12) * .6 + pointer.x * .9, 4.3 + pointer.y * .5, 14);
    camera.position.lerp(look.camera, 1 - Math.exp(-2.5 * dt));
    look.target.set(1.8 + pointer.x * .3, 2.4, 0); camera.lookAt(look.target);
    if (cat.current) cat.current.rotation.y = Math.PI - .28 + Math.sin(t * .25) * .15 + pointer.x * .18;
    if (rings.current) rings.current.children.forEach((c, i) => { c.rotation.z = .4 + t * (i - 1 || .5) * .05; });
    if (scan.current) { const k = (t * .45) % 1; scan.current.position.y = .2 + k * 7.5; (scan.current.material as THREE.MeshBasicMaterial).opacity = .35 * (1 - k); }
  });
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.16, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      {quality
        ? <MeshReflectorMaterial resolution={1024} blur={[400, 120]} mixBlur={1} mixStrength={6} roughness={.8} depthScale={1} minDepthThreshold={.4} maxDepthThreshold={1.3} color="#0b1119" metalness={.6} mirror={0} />
        : <meshStandardMaterial color="#0e151f" metalness={.65} roughness={.35} />}
    </mesh>
    <group position={[4, 0, 0]}>
      <mesh receiveShadow castShadow><cylinderGeometry args={[3.5, 3.75, .25, 96]} /><meshStandardMaterial color="#1d2631" metalness={.9} roughness={.18} /></mesh>
      <mesh position={[0, .13, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.33, 3.4, 128]} /><meshBasicMaterial color={hot('#ff8a2a', 5)} toneMapped={false} /></mesh>
      <mesh position={[0, .131, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.2, 2.215, 128]} /><meshBasicMaterial color={hot('#8ebeff', 2)} toneMapped={false} /></mesh>
      <mesh position={[0, -.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.76, 3.8, 128]} /><meshBasicMaterial color={hot('#ff8a2a', 1.6)} toneMapped={false} /></mesh>
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2, .012, 6, 96]} /><meshBasicMaterial color={hot('#ffb36b', 4)} transparent toneMapped={false} /></mesh>
      <group ref={cat} scale={3.8} position={[0, .13, 0]}><Cat armed={false} /></group>
      <ContactShadows position={[0, .14, 0]} scale={8} blur={2.4} opacity={.8} far={4} />
      <Sparkles count={45} scale={[8, 7, 8]} position={[0, 3, 0]} color="#ffad62" size={2.5} speed={.25} />
    </group>
    <group ref={rings} position={[4, 4, -4]}>
      {[-1, 0, 1].map(n => <mesh key={n} position={[0, 0, n * -2]} rotation={[0, 0, .4]}><torusGeometry args={[4.4 + n * .6, n === 0 ? .06 : .04, 8, 6]} />
        <meshBasicMaterial color={n === 0 ? hot('#ff7a00', 4) : hot('#496078', 1.4)} toneMapped={false} /></mesh>)}
    </group>
    {towers.map((t, i) => <group key={i} position={[t.x, 0, t.z]}>
      <mesh position={[0, t.h / 2, 0]} material={t.material}><boxGeometry args={[2.4, t.h, 3]} /></mesh>
      <mesh position={[1.22, t.h / 2, 1.52]}><boxGeometry args={[.04, t.h, .04]} /><meshBasicMaterial color={hot(i % 3 ? '#5f8fb8' : '#ff7a00', 3)} toneMapped={false} /></mesh>
    </group>)}
    <Float floatIntensity={.4} rotationIntensity={1}><mesh position={[8.5, 5.2, -3]} rotation={[.4, .7, .2]}><octahedronGeometry args={[.45]} /><meshBasicMaterial color={hot('#ff8a28', 4)} toneMapped={false} /></mesh></Float>
    <Float floatIntensity={.6} speed={1.5}><mesh position={[-.5, 6, -6]} rotation={[.2, .3, .6]}><octahedronGeometry args={[.25]} /><meshBasicMaterial color={hot('#8ebeff', 3)} toneMapped={false} /></mesh></Float>
    <spotLight position={[2, 12, 5]} angle={.5} penumbra={.8} intensity={260} color="#ffe6cf" castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[9, 4, 5]} color="#8ebeff" intensity={45} distance={18} />
    <pointLight position={[1, 5, -3]} color="#ff7a00" intensity={90} distance={20} />
    <pointLight position={[4, .8, 3.5]} color="#ff7a00" intensity={10} distance={6} />
    <pointLight position={[7, 6, 7]} color="#fff1e0" intensity={70} distance={16} />
  </group>;
}
