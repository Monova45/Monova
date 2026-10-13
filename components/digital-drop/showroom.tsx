import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, ContactShadows, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import { usePbr } from './pbr';
import { Cat } from './character';
import { slotColors } from './net';

// Party members stand beside the local Monova, Fortnite-lobby style.
const SPOTS: [number, number][] = [[-2.9, -1.2], [2.9, -1.2], [-5.6, -2.6], [5.6, -2.6]];

/** Radial blue backdrop with soft light beams, drawn on a large plane behind the stage. */
function backdropMaterial() {
  return new THREE.ShaderMaterial({
    depthWrite: false, fog: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv;
      void main(){
        vec2 p = vUv - vec2(.5, .42);
        float r = length(p * vec2(1., 1.3));
        vec3 c = mix(vec3(.19, .36, .43), vec3(.035, .09, .14), smoothstep(0., .55, r));
        c = mix(c, vec3(.015, .03, .065), smoothstep(.45, .9, r));
        float a = atan(p.y, p.x);
        float beams = pow(.5 + .5 * sin(a * 9. + time * .15), 6.) * smoothstep(.75, .05, r);
        c += vec3(.55, .8, 1.) * beams * .22;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

function Member({ position, name, slot }: { position: [number, number]; name: string; slot: number }) {
  const color = slotColors[slot];
  return <group position={[position[0], 0, position[1]]} rotation={[0, Math.PI - position[0] * .06, 0]}>
    <group scale={2.9}><Cat armed={false} local={false} /></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}><ringGeometry args={[1.05, 1.25, 48]} /><meshBasicMaterial color={color} transparent opacity={.9} /></mesh>
    <Billboard position={[0, 6.6, 0]}>
      <Text font="/fonts/jersey-10.ttf" fontSize={.55} outlineWidth={.06} outlineColor="#0a2a6b" anchorY="bottom">{name.toUpperCase()}<meshBasicMaterial color="#ffffff" toneMapped={false} /></Text>
      <mesh position={[0, -.25, 0]}><planeGeometry args={[1.4, .08]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    </Billboard>
  </group>;
}

export function Showroom({ quality, party = [] }: { quality: boolean; party?: { id: string; name: string; slot: number }[] }) {
  const cat = useRef<THREE.Group>(null), ring = useRef<THREE.Mesh>(null), backdrop = useRef<THREE.Mesh>(null);
  const look = useMemo(() => ({ target: new THREE.Vector3(), camera: new THREE.Vector3() }), []);
  const material = useMemo(() => backdropMaterial(), []);
  const stage = usePbr('concrete', 4);
  const crowd = party.length > 0;
  useFrame(({ camera, clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    // Pull back when the party grows so every member fits in frame.
    look.camera.set(pointer.x * .8, 4 + pointer.y * .4, crowd ? 17 : 13.5);
    camera.position.lerp(look.camera, 1 - Math.exp(-2.5 * dt));
    look.target.set(pointer.x * .3, 3.1, 0); camera.lookAt(look.target);
    if (cat.current) cat.current.rotation.y = Math.PI + Math.sin(t * .4) * .12 + pointer.x * .25;
    if (ring.current) ring.current.rotation.z = t * .3;
    if (backdrop.current) (backdrop.current.material as THREE.ShaderMaterial).uniforms.time.value = t;
  });
  return <group>
    <mesh ref={backdrop} material={material} position={[0, 8, -26]}><planeGeometry args={[140, 70]} /></mesh>
    {/* Stage floor: a soft blue disc fading into the backdrop. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]} receiveShadow><circleGeometry args={[40, 64]} /><meshStandardMaterial color="#152731" roughness={.4} metalness={.25} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><circleGeometry args={[3.2, 64]} /><meshPhysicalMaterial {...stage} color="#6e7a7e" normalScale={[.25, .25]} roughness={.5} metalness={.3} clearcoat={.3} /></mesh>
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 0]}><ringGeometry args={[3.2, 3.5, 64, 1, 0, Math.PI * 1.6]} /><meshBasicMaterial color="#ff8c42" toneMapped={false} /></mesh>
    {[4.4, 5.8, 7.2].map((radius, i) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, .008, 0]}><ringGeometry args={[radius, radius + .025, 96]} /><meshBasicMaterial color="#82c8d8" transparent opacity={.35 - i * .08} /></mesh>)}
    {[-1, 1].map(side => <group key={side} position={[side * 7, 4, -7]} rotation={[0, 0, side * -.18]}><mesh><boxGeometry args={[.16, 10, .2]} /><meshBasicMaterial color="#ff9b5e" toneMapped={false} /></mesh><mesh position={[side * .4, 0, 0]}><boxGeometry args={[.035, 10, .2]} /><meshBasicMaterial color="#76cfe1" toneMapped={false} /></mesh></group>)}
    <group ref={cat} scale={3.3}><Cat armed={false} /></group>
    {party.slice(0, SPOTS.length).map((p, i) => <Member key={p.id} position={SPOTS[i]} name={p.name || 'AGENTE'} slot={p.slot} />)}
    {quality && <ContactShadows position={[0, .02, 0]} scale={22} blur={2.2} opacity={.45} far={6} color="#0a2a6b" />}
    <Sparkles count={40} scale={[16, 8, 6]} position={[0, 4, -2]} color="#ffffff" size={3} speed={.3} opacity={.7} />
    <spotLight position={[0, 14, 8]} angle={.55} penumbra={.9} intensity={180} color="#ffffff" castShadow={quality} shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-6, 5, 4]} color="#7fc0ff" intensity={38} distance={20} />
    <pointLight position={[6, 5, 4]} color="#ffd9a0" intensity={32} distance={20} />
  </group>;
}
