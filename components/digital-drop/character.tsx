import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { HeadFur } from './fur';
import { useDrop } from './state';
import { usePbr } from './pbr';
import { badgeTexture, fiberBump, furTexture, irisTexture, onesieTexture } from './materials';
import { characterShapes } from './character-shapes';

/** Written by the engine when firing so the blaster kicks back. */
export const catPose = { recoil: 0 };

type CatProps = { armed?: boolean; local?: boolean };
/** Monova: procedural model, faces -Z with feet at y = 0. */
export function Cat(props: CatProps) {
  return <ProceduralCat {...props} />;
}

const cream = '#ffe8cb', pink = '#e48b90', black = '#182129', white = '#faf5eb', leaf = '#4b8636', orange = '#f98321';

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
  const shapes = useMemo(() => characterShapes(), []);
  const fabric = usePbr('fabric', 5, 4);
  const m = useMemo(() => {
    const badge = badgeTexture();
    return {
      fur: new THREE.MeshPhysicalMaterial({ map: furTexture(), bumpMap: fiberBump('fur'), bumpScale: .005, roughness: .88, sheen: .8, sheenColor: '#ffd5a0', sheenRoughness: .85 }),
      onesie: new THREE.MeshPhysicalMaterial({ map: onesieTexture(), normalMap: fabric.normalMap, normalScale: new THREE.Vector2(.18, .18), roughnessMap: fabric.roughnessMap, roughness: .92, sheen: .7, sheenRoughness: .9, sheenColor: '#ffbc75' }),
      suit: new THREE.MeshPhysicalMaterial({ color: orange, normalMap: fabric.normalMap, normalScale: new THREE.Vector2(.18, .18), roughnessMap: fabric.roughnessMap, roughness: .9, sheen: .7, sheenColor: '#f9bf86' }),
      cream: new THREE.MeshPhysicalMaterial({ color: cream, bumpMap: fiberBump('fur'), bumpScale: .003, roughness: .92, sheen: .8, sheenColor: '#fff2df' }),
      pink: new THREE.MeshStandardMaterial({ color: pink, bumpMap: fiberBump('ceramic'), bumpScale: .005, roughness: .42 }),
      innerEar: new THREE.MeshStandardMaterial({ color: '#edac9a', roughness: .95 }),
      stitch: new THREE.MeshStandardMaterial({ color: '#f4b45b', roughness: .95 }),
      lip: new THREE.MeshStandardMaterial({ color: '#8a4e34', roughness: .85 }),
      smile: new THREE.MeshStandardMaterial({ color: '#996b4b', roughness: 1 }),
      whisker: new THREE.MeshStandardMaterial({ color: '#fff4dc', roughness: .85 }),
      black: new THREE.MeshStandardMaterial({ color: black, roughness: .7 }),
      gloss: new THREE.MeshStandardMaterial({ color: '#050505', roughness: .08, metalness: .2 }),
      iris: new THREE.MeshPhysicalMaterial({ map: irisTexture(), roughness: .28, clearcoat: .8, clearcoatRoughness: .12 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .2 }),
      shine: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.6), toneMapped: false }),
      shell: new THREE.MeshPhysicalMaterial({ color: white, roughness: .3, metalness: .08, clearcoat: .8, clearcoatRoughness: .2 }),
      accent: new THREE.MeshStandardMaterial({ color: orange, roughness: .4, emissive: orange, emissiveIntensity: .35 }),
      glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(orange).multiplyScalar(3), toneMapped: false }),
      badge: new THREE.MeshStandardMaterial({ map: badge, roughness: .4, emissiveMap: badge, emissive: '#ffffff', emissiveIntensity: .5 }),
      leaf: new THREE.MeshStandardMaterial({ color: leaf, roughness: .7 }),
      stem: new THREE.MeshStandardMaterial({ color: '#2f6b22', roughness: .8 }),
      stripe: new THREE.MeshStandardMaterial({ color: '#a24f20', roughness: .85 }),
      trim: new THREE.MeshStandardMaterial({ color: '#727d83', bumpMap: fiberBump('ceramic'), bumpScale: .002, roughness: .27, metalness: .9 }),
      pumpkin: new THREE.MeshStandardMaterial({ color: '#ff8a1e', roughness: .55 }),
    };
  }, [fabric]);
  useEffect(() => () => Object.values(m).forEach(material => material.dispose()), [m]);
  useEffect(() => () => Object.values(shapes).flat().forEach(geometry => geometry.dispose()), [shapes]);

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
      else leftArm.current.rotation.set(-.18, -.1, -2.05 + Math.sin(t * 4.2) * .19);
    }
    if (rightArm.current) rightArm.current.rotation.set(armed ? 1.35 : gait * .9, 0, armed ? .05 : -.12);
    if (local) catPose.recoil = THREE.MathUtils.damp(catPose.recoil, 0, 14, dt);
    const recoil = local ? catPose.recoil : 0;
    if (gun.current) { gun.current.position.z = -.38 + recoil * .16; gun.current.rotation.x = recoil * .35; }
  });

  const paw = (beans: boolean) => <group>
    <mesh castShadow material={m.cream} scale={[1, 1.05, .88]}><sphereGeometry args={[.112, 24, 18]} /></mesh>
    {[-1, 0, 1].map(k => <mesh key={k} material={m.cream} position={[k * .057, -.08, -.011]} scale={[1, 1.12, .9]}><sphereGeometry args={[.044, 16, 12]} /></mesh>)}
    {beans && <><mesh material={m.pink} position={[0, -.008, -.099]} scale={[1, .9, .3]}><sphereGeometry args={[.045, 16, 12]} /></mesh>
      {[-1, 0, 1].map(k => <mesh key={k} material={m.pink} position={[k * .052, -.073, -.06]} scale={[1, 1.1, .5]}><sphereGeometry args={[.021, 12, 10]} /></mesh>)}</>}
  </group>;

  const arm = (side: -1 | 1, ref: React.RefObject<THREE.Group | null>, beans: boolean) => <group ref={ref} position={[side * .37, .87, -.01]}>
    <mesh castShadow material={m.suit} position={[0, -.16, 0]}><capsuleGeometry args={[.105, .2, 8, 16]} /></mesh>
    <mesh material={m.black} position={[0, -.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.1, .032, 12, 28]} /></mesh>
    <mesh material={m.stitch} position={[0, -.264, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.101, .006, 6, 28]} /></mesh>
    <group position={[0, -.4, 0]}>{paw(beans)}</group>
  </group>;

  const leg = (side: -1 | 1, ref: React.RefObject<THREE.Group | null>) => <group ref={ref} position={[side * .17, .34, 0]}>
    <mesh castShadow material={m.suit} position={[0, -.1, 0]}><capsuleGeometry args={[.13, .1, 8, 16]} /></mesh>
    <mesh material={m.black} position={[0, -.21, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.12, .037, 12, 28]} /></mesh>
    <mesh material={m.stitch} position={[0, -.172, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.121, .006, 6, 28]} /></mesh>
    <mesh castShadow material={m.cream} position={[0, -.29, -.05]} scale={[1, .62, 1.3]}><sphereGeometry args={[.13, 20, 14]} /></mesh>
    {[-1, 0, 1].map(k => <mesh key={k} material={m.cream} position={[k * .055, -.29, -.2]} scale={[1, .8, 1]}><sphereGeometry args={[.04, 10, 8]} /></mesh>)}
  </group>;

  return <group ref={root}><group ref={body}>
    {/* Onesie body with jack-o'-lantern face and leaf collar. */}
    <mesh castShadow receiveShadow material={m.black} geometry={shapes.suit} position={[0, .6, 0]} />
    {shapes.seams.map((geometry, i) => <mesh key={i} material={m.stitch} geometry={geometry} />)}
    {[-1, 0, 1].map(k => <mesh key={k} material={m.leaf} position={[k * .12, .95, -.25 + Math.abs(k) * .04]} rotation={[-.9, k * .5, k * .6]} scale={[1, .3, .6]}><sphereGeometry args={[.1, 14, 10]} /></mesh>)}
    <mesh material={m.stem} position={[0, .93, -.3]}><sphereGeometry args={[.035, 10, 8]} /></mesh>
    {/* Tailored suit: waist piping and polished shoulder plates. */}
    {[-1, 1].map(side => <group key={side} position={[side * .35, .9, -.015]}>
      <mesh material={m.black} scale={[1, .58, 1]}><sphereGeometry args={[.125, 24, 16]} /></mesh>
      <mesh castShadow material={m.shell} position={[0, .02, -.005]} scale={[1, .5, 1]}><sphereGeometry args={[.125, 24, 16]} /></mesh>
      <mesh material={m.accent} position={[side * .07, .048, -.075]} scale={[1, .35, 1]}><sphereGeometry args={[.023, 12, 8]} /></mesh>
    </group>)}
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
      {/* Overlapping, rounded cheek locks keep the plush silhouette soft. */}
      {[-1, 1].flatMap(side => [0, 1, 2].map(i => <mesh key={`${side}-tuft-${i}`} castShadow material={i === 2 ? m.cream : m.fur} position={[side * (.435 - i * .017), -.105 - i * .065, -.135]} rotation={[0, 0, side * (.85 + i * .17)]} scale={[1, 1.8, .75]}><sphereGeometry args={[.066 - i * .009, 20, 14]} /></mesh>))}
      {/* Continuous plush muzzle with a small, closed feline smile. */}
      <mesh material={m.cream} geometry={shapes.muzzle} />
      <mesh material={m.pink} geometry={shapes.nose} position={[0, -.1, -.526]} />
      <mesh material={m.smile} geometry={shapes.noseLine} />
      {shapes.smile.map((geometry, i) => <mesh key={i} material={m.smile} geometry={geometry} />)}
      {/* Layered amber eyes with soft dark rims and animated blinks. */}
      {[-1, 1].map((k, i) => <group key={k} ref={node => { eyes.current[i] = node; }} position={[k * .211, .033, -.404]} rotation={[0, k * -.2, k * -.035]}>
        <mesh material={m.cream} scale={[1.075, 1.18, .46]}><sphereGeometry args={[.153, 40, 28]} /></mesh>
        <mesh material={m.lip} position={[0, 0, -.015]} scale={[1.01, 1.14, .47]}><sphereGeometry args={[.149, 40, 28]} /></mesh>
        <mesh material={m.eyeWhite} position={[0, 0, -.026]} scale={[1, 1.13, .44]}><sphereGeometry args={[.145, 40, 28]} /></mesh>
        <mesh material={m.iris} position={[-k * .008, -.005, -.092]} rotation={[0, Math.PI, 0]} scale={[1, 1.1, 1]}><circleGeometry args={[.119, 64]} /></mesh>
        <mesh material={m.gloss} position={[-k * .008, -.005, -.103]} scale={[.88, 1.18, .32]}><sphereGeometry args={[.074, 32, 24]} /></mesh>
        <mesh material={m.shine} position={[-.034, .046, -.128]} scale={[1, 1.1, .32]}><sphereGeometry args={[.023, 16, 12]} /></mesh>
        <mesh material={m.shine} position={[.03, -.04, -.125]}><sphereGeometry args={[.009, 12, 8]} /></mesh>
        <mesh material={m.cream} geometry={shapes.lids[i]} />
      </group>)}
      {[-1, 1].flatMap(k => [0, 1, 2].map(i => <mesh key={`freckle-${k}-${i}`} material={m.lip} position={[k * (.105 + i * .029), -.133 - (i % 2) * .025, -.516 + i * .006]}><sphereGeometry args={[.0035, 8, 6]} /></mesh>))}
      {/* Whiskers. */}
      {shapes.whiskers.map((geometry, i) => <mesh key={i} material={m.whisker} geometry={geometry} />)}
      {/* Ears with pink inner fur. */}
      {[-1, 1].map(k => <group key={k} position={[k * .37, .37, -.015]} rotation={[0, k * .12, k * -.32]}>
        <mesh castShadow material={m.fur} geometry={shapes.ear} />
        <mesh material={m.cream} geometry={shapes.ear} position={[0, -.002, -.027]} scale={[.77, .8, .22]} />
        <mesh material={m.innerEar} geometry={shapes.ear} position={[0, .008, -.036]} scale={[.58, .64, .1]} />
      </group>)}
      {/* Monova helmet band with the M plate. */}
      <mesh material={m.black} rotation={[-.7, 0, 0]} scale={[1.08, 1, 1]} position={[0, -.023, .015]}><torusGeometry args={[.517, .074, 16, 64, Math.PI]} /></mesh>
      <mesh castShadow material={m.shell} rotation={[-.7, 0, 0]} scale={[1.08, 1, 1]}><torusGeometry args={[.52, .078, 20, 64, Math.PI]} /></mesh>
      <group rotation={[-.7, 0, 0]} scale={[1.08, 1, 1]}>{[.5, Math.PI - .72].map(a => <mesh key={a} material={m.accent} rotation={[0, 0, a]}><torusGeometry args={[.522, .089, 8, 12, .22]} /></mesh>)}</group>
      <group rotation={[-.7, 0, 0]}><group position={[0, .585, 0]}>
        <RoundedBox args={[.29, .043, .17]} radius={.018} smoothness={3} material={m.black} />
        <mesh material={m.badge} position={[0, .023, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}><planeGeometry args={[.132, .132]} /></mesh>
        {[-1, 1].map(k => <mesh key={k} material={m.trim} position={[k * .116, .024, 0]}><sphereGeometry args={[.007, 10, 8]} /></mesh>)}
      </group></group>
      {/* Headphones. */}
      {[-1, 1].map(k => <group key={k} position={[k * .54, -.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={m.black} position={[0, k * .07, 0]} scale={[1, 1, 1.08]}><cylinderGeometry args={[.205, .205, .055, 48]} /></mesh>
        <mesh material={m.trim} position={[0, k * -.09, 0]}><cylinderGeometry args={[.185, .185, .018, 32]} /></mesh>
        <mesh castShadow material={m.shell}><cylinderGeometry args={[.188, .2, .14, 48, 1]} /></mesh>
        <mesh material={m.black} position={[0, k * -.075, 0]}><cylinderGeometry args={[.16, .16, .02, 32]} /></mesh>
        <mesh material={m.badge} position={[0, k * -.087, 0]} rotation={[k * Math.PI / 2, 0, k * Math.PI / 2]}><circleGeometry args={[.12, 32]} /></mesh>
        <mesh material={m.glow} position={[0, k * -.073, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.17, .008, 6, 40]} /></mesh>
      </group>)}
      <group position={[0, .48, .06]}>
        <mesh><coneGeometry args={[.31, .48, 32]} /><meshStandardMaterial color="#c62635" /></mesh>
        <mesh material={m.shell} position={[0, .24, 0]}><sphereGeometry args={[.075, 16, 12]} /></mesh>
      </group>
    </group>

    {armed ? <group ref={gun} position={[.36, .62, -.38]}>
      <mesh castShadow material={m.shell}><boxGeometry args={[.15, .17, .5]} /></mesh>
      <mesh material={m.black} position={[0, -.12, .1]} rotation={[.3, 0, 0]}><boxGeometry args={[.09, .16, .1]} /></mesh>
      <mesh material={m.accent} position={[.078, .02, 0]}><boxGeometry args={[.01, .05, .36]} /></mesh>
      <mesh material={m.black} position={[0, .1, -.02]}><boxGeometry args={[.08, .04, .2]} /></mesh>
      <mesh material={m.glow} position={[0, 0, -.27]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.055, .07, .06, 16]} /></mesh>
    </group> : <group position={[.39, .38, -.085]} rotation={[0, -.08, -.08]}>
      <mesh material={m.leaf}><boxGeometry args={[.29, .26, .26]} /></mesh>
      <mesh material={m.shell}><boxGeometry args={[.05, .265, .265]} /></mesh>
    </group>}
  </group></group>;
}
