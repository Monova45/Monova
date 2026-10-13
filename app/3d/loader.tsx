"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import styles from './gate.module.css';

const Game = dynamic(()=>import('@/components/digital-drop/game'),{ssr:false,loading:()=> <div className="min-h-screen bg-black text-white grid place-items-center">INICIALIZANDO MONOVA CITY…</div>});

// Desktop only: needs a precise pointer (mouse/trackpad) and a wide viewport. Phones and tablets never load the 3D bundle.
const desktop = '(pointer: fine) and (min-width: 1024px)';
const subscribe = (notify: () => void) => { const m = matchMedia(desktop); m.addEventListener('change', notify); return () => m.removeEventListener('change', notify); };

export default function GameLoader(){
  const isDesktop = useSyncExternalStore(subscribe, () => matchMedia(desktop).matches, () => null);
  if (isDesktop === null) return <div className={styles.gate} />;
  if (isDesktop) return <Game/>;
  return <main className={styles.gate}>
    <div className={styles.card}>
      <span className={styles.badge}>SOLO PC</span>
      <h1>DIGITAL<br/><em>DROP</em></h1>
      <p>Este juego está disponible solo en computador. Ábrelo desde un PC o Mac con teclado y mouse para jugar.</p>
      <div className={styles.keys}><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>+ MOUSE</span></div>
      <Link href="/" className={styles.back}>VOLVER A MONOVA</Link>
    </div>
  </main>;
}
