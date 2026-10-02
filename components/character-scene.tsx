"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Code2, MousePointer2, Sparkles } from "lucide-react";
import styles from "./character-scene.module.css";

export function CharacterScene() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 65, damping: 22 });
  const y = useSpring(pointerY, { stiffness: 65, damping: 22 });
  const sceneRotateY = useTransform(x, [-1, 1], [-16, 16]);
  const sceneRotateX = useTransform(y, [-1, 1], [10, -10]);
  const rotate = useTransform(x, [-1, 1], [-5, 5]);
  const characterX = useTransform(x, [-1, 1], [-24, 24]);
  const characterY = useTransform(y, [-1, 1], [-12, 12]);
  const backX = useTransform(x, [-1, 1], [25, -25]);
  const backY = useTransform(y, [-1, 1], [18, -18]);
  const frontX = useTransform(x, [-1, 1], [-42, 42]);
  const frontY = useTransform(y, [-1, 1], [-25, 25]);
  function move(event: PointerEvent<HTMLElement>) {
    if (reduced || paused || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width * 2 - 1);
    pointerY.set((event.clientY - rect.top) / rect.height * 2 - 1);
  }
  function reset() { pointerX.set(0); pointerY.set(0); }

  return <main className={styles.page} onPointerMove={move} onPointerLeave={reset}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Image src="/assets/monova-mark.svg" width={28} height={28} alt="" /> MONOVA</Link>
      <span className={styles.headerLabel}>EL LADO CREATIVO DE LA TECNOLOGÍA</span>
      <Link href="/" className={styles.back}><ArrowLeft size={16} /> Volver al inicio</Link>
    </header>
    <section className={styles.hero} aria-labelledby="character-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}><span /> CONOCE A TU PRÓXIMO ALIADO</p>
        <h1 id="character-title">Las grandes<br />ideas tienen<br /><em>personalidad.</em></h1>
        <p className={styles.description}>Curioso por naturaleza. Creativo por instinto.<br />Listo para darle vida a eso que imaginas.</p>
        <Link href="/#servicios" className={styles.cta}>Mira cómo hacemos realidad tu idea <ArrowUpRight size={20} /></Link>
        <div className={styles.hint}><MousePointer2 size={16}/><span className={styles.desktopHint}>Mueve el cursor. Exploremos juntos.</span><span className={styles.mobileHint}>Una pequeña muestra de lo que imaginamos.</span></div>
      </div>
      <div className={`${styles.stage} ${paused ? styles.paused : ""}`}>
        <motion.div className={styles.sceneTilt} style={{ rotateX: sceneRotateX, rotateY: sceneRotateY }}>
        <div className={styles.sceneFloat}>
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.orbitTrack} aria-hidden="true"><span /></div>
        <div className={styles.cube} aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <motion.div className={styles.orbits} style={{ x: backX, y: backY }} aria-hidden="true"><div /><div /><span className={styles.planet} /></motion.div>
        <div className={styles.word} aria-hidden="true">HELLO!</div>
        <div className={styles.platform} aria-hidden="true"><div className={styles.floorShadow} /><span /></div>
        <motion.div className={styles.character} style={{ x: characterX, y: characterY, rotate, z: 85 }}>
          <div className={styles.breathe}><Image src="/assets/monova-seated-v1.png" alt="La mascota de Monova, un gato naranja con traje de astronauta, te saluda" fill priority sizes="(max-width: 760px) 85vw, 540px" /></div>
        </motion.div>
        <motion.div className={`${styles.chip} ${styles.design}`} style={{ x: frontX, y: frontY, z: 150 }}><span><Sparkles size={20}/></span><div><small>UN POCO DE MAGIA</small><strong>Mucho diseño.</strong></div></motion.div>
        <motion.div className={`${styles.chip} ${styles.code}`} style={{ x: backX, y: backY, z: 110 }}><span><Code2 size={20}/></span><div><small>IDEAS EN ACCIÓN</small><strong>Hagámoslo real.</strong></div></motion.div>
        </div>
        </motion.div>
        <button className={styles.motionToggle} type="button" aria-pressed={paused} onClick={() => { setPaused(value => !value); reset(); }}>{paused ? "Activar movimiento" : "Pausar movimiento"}</button>
        <div className={styles.caption}><span /> IMAGINACIÓN SIN MODO AVIÓN</div>
      </div>
    </section>
    <footer className={styles.footer}><span>TECNOLOGÍA + CREATIVIDAD + UN POCO DE CURIOSIDAD</span><span>MONOVA / PERSONAJE <span className={styles.star}>✳</span></span></footer>
  </main>;
}
