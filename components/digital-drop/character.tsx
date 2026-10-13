import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HeadFur } from './fur';
import { useDrop } from './state';
import { usePbr } from './pbr';
import { badgeTexture, fiberBump, furTexture, irisTexture, onesieTexture } from './materials';

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
  const quality = useDrop(s => s.quality);
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null), leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null), gun = useRef<THREE.Group>(null);
  const eyes = useRef<(THREE.Group | null)[]>([]);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const tailCurve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, .18, .14), new THREE.Vector3(.04, .4, .22), new THREE.Vector3(.13, .61, .16), new THREE.Vector3(.16, .68, .07)]), []);
  const previous = useRef(new THREE.Vector3()), velocity = useRef(0);
  const fabric = usePbr('fabric', 5, 4);
  const m = useMemo(() => {
    const badge = badgeTexture();
    return {
      fur: new THREE.MeshPhysicalMaterial({ map: furTexture(), bumpMap: fiberBump('fur'), bumpScale: .022, roughness: .94, sheen: 1, sheenColor: '#ffd5a0', sheenRoughness: .85 }),
      onesie: new THREE.MeshPhysicalMaterial({ map: onesieTexture(), normalMap: fabric.normalMap, normalScale: new THREE.Vector2(.45, .45), roughnessMap: fabric.roughnessMap, roughness: .95, sheen: .8, sheenRoughness: .9, sheenColor: '#ffbc75' }),
      suit: new THREE.MeshPhysicalMaterial({ color: orange, normalMap: fabric.normalMap, normalScale: new THREE.Vector2(.4, .4), roughnessMap: fabric.roughnessMap, roughness: .95, sheen: .7, sheenColor: '#f9bf86' }),
      cream: new THREE.MeshPhysicalMaterial({ color: cream, bumpMap: fiberBump('fur'), bumpScale: .016, roughness: .98, sheen: .9, sheenColor: '#fff2df' }),
      pink: new THREE.MeshStandardMaterial({ color: pink, bumpMap: fiberBump('ceramic'), bumpScale: .005, roughness: .42 }),
      black: new THREE.MeshStandardMaterial({ color: black, roughness: .7 }),
      gloss: new THREE.MeshStandardMaterial({ color: '#050505', roughness: .08, metalness: .2 }),
      iris: new THREE.MeshPhysicalMaterial({ map: irisTexture(), roughness: .22, clearcoat: 1, clearcoatRoughness: .08 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .2 }),
      shine: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.6), toneMapped: false }),
      shell: new THREE.MeshPhysicalMaterial({ color: white, bumpMap: fiberBump('ceramic'), bumpScale: .003, roughness: .32, metalness: .12, clearcoat: .85, clearcoatRoughness: .22 }),
      accent: new THREE.MeshStandardMaterial({ color: orange, roughness: .4, emissive: orange, emissiveIntensity: .35 }),
      glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(orange).multiplyScalar(3), toneMapped: false }),
      badge: new THREE.MeshStandardMaterial({ map: badge, roughness: .4, emissiveMap: badge, emissive: '#ffffff', emissiveIntensity: .5 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#4a1216', roughness: .8 }),
      leaf: new THREE.MeshStandardMaterial({ color: leaf, roughness: .7 }),
      stem: new THREE.MeshStandardMaterial({ color: '#2f6b22', roughness: .8 }),
      stripe: new THREE.MeshStandardMaterial({ color: '#a24f20', roughness: .85 }),
      trim: new THREE.MeshStandardMaterial({ color: '#727d83', bumpMap: fiberBump('ceramic'), bumpScale: .002, roughness: .27, metalness: .9 }),
      pumpkin: new THREE.MeshStandardMaterial({ color: '#ff8a1e', roughness: .55 }),
    };
  }, [fabric]);
  useEffect(() => () => Object.values(m).forEach(material => material.dispose()), [m]);

  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const t = clock.elapsedTime, p = root.current.getWorldPosition(worldPosition);
    velocity.current = THREE.MathUtils.damp(velocity.current, Math.min(1, p.distanceTo(previous.current) / Math.max(.001, dt) / 4), 8, dt);
    previous.current.copy(p);
    const blinkPhase = t % 4.7;
    const blink = blinkPhase < .16 ? Math.max(.07, Math.abs(blinkPhase - .08) / .08) : 1;
    eyes.current.forEach(eye => { if (eye) eye.scale.y = blink; });
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
    {/* Tailored suit: waist piping and polished shoulder plates. */}
    <mesh material={m.stripe} position={[0, .43, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, .9, 1]}><torusGeometry args={[.34, .012, 8, 48]} /></mesh>
    {[-1, 1].map(side => <mesh key={side} material={m.shell} position={[side * .34, .91, -.015]} scale={[1, .6, 1]}><sphereGeometry args={[.125, 24, 16]} /></mesh>)}
    {leg(-1, leftLeg)}{leg(1, rightLeg)}
    {arm(-1, leftArm, !armed)}{arm(1, rightArm, false)}

    {/* Fluffy striped tail. */}
    <group ref={tail} position={[0, .42, .3]}>
      <mesh castShadow material={m.fur}><tubeGeometry args={[tailCurve, 28, .09, 10, false]} /></mesh>
      <mesh material={m.cream} position={[.16, .68, .07]} scale={[1, 1.2, 1]}><sphereGeometry args={[.092, 16, 12]} /></mesh>
    </group>

    <group ref={head} position={[0, 1.32, 0]}>
      {quality && <HeadFur />}
      <mesh castShadow material={m.fur} scale={[1.1, .95, 1]}><sphereGeometry args={[.5, 48, 32]} /></mesh>
      {/* Sculpted cheek tufts create a softer silhouette without hair particles. */}
      {[-1, 1].flatMap(side => [0, 1, 2].map(i => <mesh key={`${side}-tuft-${i}`} castShadow material={i === 2 ? m.cream : m.fur} position={[side * (.43 + i * .014), -.07 - i * .085, -.12]} rotation={[0, 0, side * (1.05 + i * .25)]} scale={[1, 1, .65]}><coneGeometry args={[.09 - i * .01, .19, 12]} /></mesh>))}
      {/* Muzzle, nose and open smile. */}
      <mesh material={m.cream} position={[0, -.18, -.33]} scale={[1.25, .8, .8]}><sphereGeometry args={[.2, 24, 16]} /></mesh>
      {[-1, 1].map(k => <mesh key={k} material={m.cream} position={[k * .1, -.15, -.425]} scale={[1, .75, .65]}><sphereGeometry args={[.14, 20, 14]} /></mesh>)}
      <mesh material={m.pink} position={[0, -.1, -.49]} scale={[1.3, .8, .8]}><sphereGeometry args={[.045, 16, 10]} /></mesh>
      <mesh material={m.mouth} position={[0, -.24, -.45]} scale={[1.2, .9, .5]}><sphereGeometry args={[.08, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
      <mesh material={m.pink} position={[0, -.29, -.46]} scale={[1, .5, .6]}><sphereGeometry args={[.045, 12, 8]} /></mesh>
      {[-1, 1].map(k => <mesh key={k} material={m.shell} position={[k * .045, -.205, -.475]} rotation={[0, 0, Math.PI]}><coneGeometry args={[.013, .04, 6]} /></mesh>)}
      {/* Brow patches follow the eye sockets. */}
      {[-1, 1].map(k => <mesh key={k} material={m.cream} position={[k * .205, .205, -.39]} rotation={[0, 0, k * .12]} scale={[1.4, .36, .38]}><sphereGeometry args={[.09, 20, 12]} /></mesh>)}
      {/* Layered amber eyes with soft dark rims and animated blinks. */}
      {[-1, 1].map((k, i) => <group key={k} ref={node => { eyes.current[i] = node; }} position={[k * .205, .035, -.405]} rotation={[0, k * -.22, 0]}>
        <mesh material={m.stripe} scale={[1.05, 1.16, .45]}><sphereGeometry args={[.158, 32, 24]} /></mesh>
        <mesh material={m.eyeWhite} position={[0, 0, -.017]} scale={[1, 1.12, .5]}><sphereGeometry args={[.148, 32, 24]} /></mesh>
        <mesh material={m.iris} position={[0, -.006, -.091]} rotation={[0, Math.PI, 0]} scale={[1, 1.08, 1]}><circleGeometry args={[.127, 48]} /></mesh>
        <mesh material={m.gloss} position={[0, -.006, -.104]} scale={[.82, 1.2, .36]}><sphereGeometry args={[.078, 24, 20]} /></mesh>
        <mesh material={m.shine} position={[-.038, .05, -.132]} scale={[1, 1.15, .4]}><sphereGeometry args={[.027, 14, 10]} /></mesh>
        <mesh material={m.shine} position={[.033, -.04, -.128]}><sphereGeometry args={[.011, 10, 8]} /></mesh>
      </group>)}
      {[-1, 1].flatMap(k => [0, 1, 2].map(i => <mesh key={`freckle-${k}-${i}`} material={m.stripe} position={[k * (.11 + i * .026), -.135 - (i % 2) * .025, -.51 + i * .01]}><sphereGeometry args={[.006, 6, 6]} /></mesh>))}
      {/* Whiskers. */}
      {[-1, 1].flatMap(k => [0, 1, 2].map(i => <mesh key={`${k}${i}`} material={m.shell} position={[k * .36, -.15 + i * .035, -.34]} rotation={[0, k * .25, k * (.12 - i * .1)]}><boxGeometry args={[.26, .006, .006]} /></mesh>))}
      {/* Ears with pink inner fur. */}
      {[-1, 1].map(k => <group key={k} position={[k * .38, .38, .02]} rotation={[0, 0, k * -.5]}>
        <mesh castShadow material={m.fur} scale={[1, 1, .55]}><coneGeometry args={[.18, .4, 12]} /></mesh>
        <mesh material={m.pink} position={[0, -.03, -.06]} scale={[1, 1, .2]}><coneGeometry args={[.11, .28, 12]} /></mesh>
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
        <mesh material={m.black} position={[0, k * .07, 0]}><cylinderGeometry args={[.215, .215, .055, 32]} /></mesh>
        <mesh material={m.trim} position={[0, k * -.09, 0]}><cylinderGeometry args={[.185, .185, .018, 32]} /></mesh>
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
