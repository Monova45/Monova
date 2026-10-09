import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { badgeTexture, furTexture, onesieTexture } from './materials';

/** Written by the engine when firing so the blaster kicks back. */
export const catPose = { recoil: 0 };

type CatProps = { armed?: boolean; local?: boolean };
/** Monova: procedural model, faces -Z with feet at y = 0. */
export function Cat(props: CatProps) {
  return <ProceduralCat {...props} />;
}

const cream = '#fbe6cc', pink = '#f49aa1', black = '#141414', white = '#f4f1ec', leaf = '#3f8a2c', orange = '#ff7a12';

/**
 * Monova: orange tabby kitten with the white Monova helmet, M headphones, pumpkin cap and jack-o'-lantern onesie.
 * Faces -Z, feet at y = 0, about 2 units tall. `armed` holds the blaster; otherwise it waves and carries the pumpkin bucket.
 */
function ProceduralCat({ armed = true, local = true }: CatProps) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null), leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null), gun = useRef<THREE.Group>(null);
  const previous = useRef(new THREE.Vector3()), velocity = useRef(0);
  const m = useMemo(() => {
    const badge = badgeTexture();
    return {
      fur: new THREE.MeshStandardMaterial({ map: furTexture(), roughness: .9 }),
      onesie: new THREE.MeshStandardMaterial({ map: onesieTexture(), roughness: .85 }),
      suit: new THREE.MeshStandardMaterial({ color: orange, roughness: .85 }),
      cream: new THREE.MeshStandardMaterial({ color: cream, roughness: .9 }),
      pink: new THREE.MeshStandardMaterial({ color: pink, roughness: .6 }),
      black: new THREE.MeshStandardMaterial({ color: black, roughness: .7 }),
      gloss: new THREE.MeshStandardMaterial({ color: '#050505', roughness: .08, metalness: .2 }),
      iris: new THREE.MeshStandardMaterial({ color: '#a8561c', roughness: .12, emissive: '#6b2e08', emissiveIntensity: .6 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .2 }),
      shine: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.6), toneMapped: false }),
      shell: new THREE.MeshStandardMaterial({ color: white, roughness: .3, metalness: .1 }),
      accent: new THREE.MeshStandardMaterial({ color: orange, roughness: .4, emissive: orange, emissiveIntensity: .35 }),
      glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(orange).multiplyScalar(3), toneMapped: false }),
      badge: new THREE.MeshStandardMaterial({ map: badge, roughness: .4, emissiveMap: badge, emissive: '#ffffff', emissiveIntensity: .5 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#4a1216', roughness: .8 }),
      leaf: new THREE.MeshStandardMaterial({ color: leaf, roughness: .7 }),
      stem: new THREE.MeshStandardMaterial({ color: '#2f6b22', roughness: .8 }),
      pumpkin: new THREE.MeshStandardMaterial({ color: '#ff8a1e', roughness: .55 }),
    };
  }, []);

  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const t = clock.elapsedTime, p = root.current.getWorldPosition(new THREE.Vector3());
    velocity.current = THREE.MathUtils.damp(velocity.current, Math.min(1, p.distanceTo(previous.current) / Math.max(.001, dt) / 4), 8, dt);
    previous.current.copy(p);
    const v = velocity.current, phase = t * (9 + v * 5), gait = Math.sin(phase) * .85 * v;
    // Legs swing from the hip and lift the paw on the forward stroke.
    if (leftLeg.current) { leftLeg.current.rotation.x = gait; leftLeg.current.position.y = .34 + Math.max(0, Math.sin(phase)) * .09 * v; }
    if (rightLeg.current) { rightLeg.current.rotation.x = -gait; rightLeg.current.position.y = .34 + Math.max(0, -Math.sin(phase)) * .09 * v; }
    if (body.current) { body.current.position.y = Math.abs(Math.cos(phase)) * .07 * v + Math.sin(t * 2) * .012 * (1 - v); body.current.rotation.x = -.16 * v; body.current.rotation.z = Math.sin(phase) * .05 * v; }
    if (head.current) { head.current.rotation.z = Math.sin(t * 1.3) * .04 * (1 - v) - Math.sin(phase) * .04 * v; head.current.rotation.x = Math.sin(t * 2) * .02 + .1 * v; }
    if (tail.current) { tail.current.rotation.z = Math.sin(t * 1.8) * .18 + Math.sin(phase) * .3 * v; tail.current.rotation.x = .3 + Math.sin(t * 1.1) * .08 - .35 * v; }
    if (leftArm.current) {
      if (armed) leftArm.current.rotation.set(-gait * .9, 0, .15 + .1 * v);
      else leftArm.current.rotation.set(0, 0, -2.5 + Math.sin(t * 6) * .28);
    }
    if (rightArm.current) rightArm.current.rotation.set(armed ? 1.35 : gait * .9, 0, armed ? .05 : -.12);
    if (local) catPose.recoil = THREE.MathUtils.damp(catPose.recoil, 0, 14, dt);
    const recoil = local ? catPose.recoil : 0;
    if (gun.current) { gun.current.position.z = -.38 + recoil * .16; gun.current.rotation.x = recoil * .35; }
  });

  const paw = (beans: boolean) => <group>
    <mesh castShadow material={m.cream} scale={[1, .95, 1]}><sphereGeometry args={[.115, 20, 14]} /></mesh>
    {beans && <><mesh material={m.pink} position={[0, -.01, -.1]} scale={[1, .8, .35]}><sphereGeometry args={[.05, 12, 8]} /></mesh>
      {[-1, 0, 1].map(k => <mesh key={k} material={m.pink} position={[k * .045, .06, -.09]} scale={[1, 1, .4]}><sphereGeometry args={[.024, 10, 8]} /></mesh>)}</>}
  </group>;

  const arm = (side: -1 | 1, ref: React.RefObject<THREE.Group | null>, beans: boolean) => <group ref={ref} position={[side * .34, .9, 0]}>
    <mesh castShadow material={m.suit} position={[0, -.16, 0]}><capsuleGeometry args={[.105, .2, 8, 16]} /></mesh>
    <mesh material={m.black} position={[0, -.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.1, .045, 10, 24]} /></mesh>
    <group position={[0, -.4, 0]}>{paw(beans)}</group>
  </group>;

  const leg = (side: -1 | 1, ref: React.RefObject<THREE.Group | null>) => <group ref={ref} position={[side * .17, .34, 0]}>
    <mesh castShadow material={m.suit} position={[0, -.1, 0]}><capsuleGeometry args={[.13, .1, 8, 16]} /></mesh>
    <mesh material={m.black} position={[0, -.21, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.12, .05, 10, 24]} /></mesh>
    <mesh castShadow material={m.cream} position={[0, -.29, -.05]} scale={[1, .62, 1.3]}><sphereGeometry args={[.13, 20, 14]} /></mesh>
    {[-1, 0, 1].map(k => <mesh key={k} material={m.cream} position={[k * .055, -.29, -.2]} scale={[1, .8, 1]}><sphereGeometry args={[.04, 10, 8]} /></mesh>)}
  </group>;

  return <group ref={root}><group ref={body}>
    {/* Onesie body with jack-o'-lantern face and leaf collar. */}
    <mesh castShadow receiveShadow material={m.onesie} position={[0, .6, 0]} scale={[1, 1.06, .9]}><sphereGeometry args={[.38, 48, 32]} /></mesh>
    {[-1, 0, 1].map(k => <mesh key={k} material={m.leaf} position={[k * .12, .95, -.25 + Math.abs(k) * .04]} rotation={[-.9, k * .5, k * .6]} scale={[1, .3, .6]}><sphereGeometry args={[.1, 14, 10]} /></mesh>)}
    <mesh material={m.stem} position={[0, .93, -.3]}><sphereGeometry args={[.035, 10, 8]} /></mesh>
    {leg(-1, leftLeg)}{leg(1, rightLeg)}
    {arm(-1, leftArm, !armed)}{arm(1, rightArm, false)}

    {/* Fluffy striped tail. */}
    <group ref={tail} position={[0, .42, .3]}>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} castShadow material={i === 6 ? m.cream : i % 2 ? m.cream : m.fur} position={[0, i * .085, .06 * i - .006 * i * i]} scale={1 + Math.sin(i / 6 * Math.PI) * .25}><sphereGeometry args={[.085, 14, 10]} /></mesh>)}
    </group>

    <group ref={head} position={[0, 1.32, 0]}>
      <mesh castShadow material={m.fur} scale={[1.1, .95, 1]}><sphereGeometry args={[.5, 48, 32]} /></mesh>
      {/* Muzzle, nose and open smile. */}
      <mesh material={m.cream} position={[0, -.18, -.33]} scale={[1.25, .8, .8]}><sphereGeometry args={[.2, 24, 16]} /></mesh>
      {[-1, 1].map(k => <mesh key={k} material={m.cream} position={[k * .25, -.1, -.33]} scale={[1, .8, .6]}><sphereGeometry args={[.14, 20, 14]} /></mesh>)}
      <mesh material={m.pink} position={[0, -.1, -.49]} scale={[1.3, .8, .8]}><sphereGeometry args={[.045, 16, 10]} /></mesh>
      <mesh material={m.mouth} position={[0, -.24, -.45]} scale={[1.2, .9, .5]}><sphereGeometry args={[.08, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
      <mesh material={m.pink} position={[0, -.29, -.46]} scale={[1, .5, .6]}><sphereGeometry args={[.045, 12, 8]} /></mesh>
      {[-1, 1].map(k => <mesh key={k} material={m.shell} position={[k * .045, -.205, -.475]} rotation={[0, 0, Math.PI]}><coneGeometry args={[.013, .04, 6]} /></mesh>)}
      {/* Big glossy eyes. */}
      {[-1, 1].map(k => <group key={k} position={[k * .19, .02, -.38]} rotation={[0, k * -.3, 0]}>
        <mesh material={m.eyeWhite} scale={[1, 1.08, .55]}><sphereGeometry args={[.125, 24, 16]} /></mesh>
        <mesh material={m.iris} position={[0, -.005, -.05]} scale={[1, 1.08, .5]}><sphereGeometry args={[.112, 24, 16]} /></mesh>
        <mesh material={m.gloss} position={[0, -.01, -.09]} scale={[1, 1.1, .4]}><sphereGeometry args={[.05, 20, 14]} /></mesh>
        <mesh material={m.shine} position={[-.03, .04, -.11]}><sphereGeometry args={[.022, 10, 8]} /></mesh>
        <mesh material={m.shine} position={[.03, -.035, -.105]}><sphereGeometry args={[.01, 8, 6]} /></mesh>
      </group>)}
      {/* Whiskers. */}
      {[-1, 1].flatMap(k => [0, 1, 2].map(i => <mesh key={`${k}${i}`} material={m.shell} position={[k * .36, -.15 + i * .035, -.34]} rotation={[0, k * .25, k * (.12 - i * .1)]}><boxGeometry args={[.26, .006, .006]} /></mesh>))}
      {/* Ears with pink inner fur. */}
      {[-1, 1].map(k => <group key={k} position={[k * .38, .38, .02]} rotation={[0, 0, k * -.5]}>
        <mesh castShadow material={m.fur} scale={[1, 1, .55]}><coneGeometry args={[.18, .4, 4]} /></mesh>
        <mesh material={m.pink} position={[0, -.03, -.06]} scale={[1, 1, .2]}><coneGeometry args={[.11, .28, 4]} /></mesh>
      </group>)}
      {/* Monova helmet band with the M plate. */}
      <mesh castShadow material={m.shell} rotation={[-.7, 0, 0]} scale={[1.08, 1, 1]}><torusGeometry args={[.52, .085, 14, 48, Math.PI]} /></mesh>
      <group rotation={[-.7, 0, 0]} scale={[1.08, 1, 1]}>{[.5, Math.PI - .72].map(a => <mesh key={a} material={m.accent} rotation={[0, 0, a]}><torusGeometry args={[.522, .089, 8, 12, .22]} /></mesh>)}</group>
      <group rotation={[-.7, 0, 0]}><group position={[0, .585, 0]}>
        <mesh material={m.black}><boxGeometry args={[.3, .035, .17]} /></mesh>
        <mesh material={m.badge} position={[0, .019, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.18, .18]} /></mesh>
      </group></group>
      {/* Headphones. */}
      {[-1, 1].map(k => <group key={k} position={[k * .54, -.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow material={m.shell}><cylinderGeometry args={[.2, .2, .14, 32]} /></mesh>
        <mesh material={m.black} position={[0, k * -.075, 0]}><cylinderGeometry args={[.16, .16, .02, 32]} /></mesh>
        <mesh material={m.badge} position={[0, k * -.087, 0]} rotation={[k * Math.PI / 2, 0, k * Math.PI / 2]}><circleGeometry args={[.12, 32]} /></mesh>
        <mesh material={m.glow} position={[0, k * -.073, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.17, .008, 6, 40]} /></mesh>
      </group>)}
      {/* Pumpkin cap with stem and leaves. */}
      <group position={[0, .41, .06]}>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} castShadow material={m.pumpkin} rotation={[0, i * Math.PI / 4, 0]} position={[Math.sin(i * Math.PI / 4) * .1, 0, Math.cos(i * Math.PI / 4) * .1]} scale={[.55, .5, 1]}><sphereGeometry args={[.3, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>)}
        <mesh material={m.stem} position={[.02, .2, 0]} rotation={[0, 0, -.35]}><cylinderGeometry args={[.035, .055, .2, 10]} /></mesh>
        {[-1, 1].map(k => <mesh key={k} material={m.leaf} position={[k * .13, .14, -.04]} rotation={[0, k * .5, k * -.45]} scale={[1.5, .18, .8]}><sphereGeometry args={[.1, 14, 10]} /></mesh>)}
      </group>
    </group>

    {armed ? <group ref={gun} position={[.36, .62, -.38]}>
      <mesh castShadow material={m.shell}><boxGeometry args={[.15, .17, .5]} /></mesh>
      <mesh material={m.black} position={[0, -.12, .1]} rotation={[.3, 0, 0]}><boxGeometry args={[.09, .16, .1]} /></mesh>
      <mesh material={m.accent} position={[.078, .02, 0]}><boxGeometry args={[.01, .05, .36]} /></mesh>
      <mesh material={m.black} position={[0, .1, -.02]}><boxGeometry args={[.08, .04, .2]} /></mesh>
      <mesh material={m.glow} position={[0, 0, -.27]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.055, .07, .06, 16]} /></mesh>
    </group> : <group position={[.36, .38, -.08]}>
      {/* Jack-o'-lantern treat bucket. */}
      <mesh castShadow material={m.pumpkin} position={[0, -.1, 0]} scale={[1, .85, 1]}><sphereGeometry args={[.17, 24, 16]} /></mesh>
      <mesh material={m.black} position={[0, .12, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.13, .012, 6, 24, Math.PI]} /></mesh>
      {[-1, 1].map(k => <mesh key={k} material={m.black} position={[k * .055, -.06, -.145]} rotation={[0, 0, 0]}><coneGeometry args={[.03, .04, 3]} /></mesh>)}
      <mesh material={m.black} position={[0, -.14, -.14]} scale={[1, .4, .3]}><sphereGeometry args={[.07, 12, 8]} /></mesh>
    </group>}
  </group></group>;
}
