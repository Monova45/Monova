"use client";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, Lightformer, useProgress } from '@react-three/drei';
import Link from 'next/link';
import { PCFShadowMap } from 'three';
import { Engine } from './engine';
import { World } from './world';
import { Showroom } from './showroom';
import { PostFX } from './effects';
import { Hud } from './hud';
import { sfx } from './audio';
import { TOTAL_BUGS, grade, saveMatch, useDrop } from './state';
import { MAX_PLAYERS, net, onNet, send, slotColors } from './net';
import { Lobby, controls } from './menu';
import { RemotePlayers } from './remote';
import { CoinIcon, CrownIcon, SkullIcon } from './icons';
import styles from './ui.module.css';

const lock = () => {
  const canvas = document.querySelector('#drop-game canvas') as HTMLCanvasElement | null;
  void canvas?.requestPointerLock?.()?.catch(() => useDrop.getState().notify('HAZ CLIC EN LA PANTALLA PARA ACTIVAR LA CÁMARA'));
};

function Loader({ ready }: { ready: boolean }) {
  const { progress, active } = useProgress();
  const shown = active ? progress : ready ? 100 : 15;
  return <div className={styles.loader} data-done={ready && !active}><b>MONOVA</b><span>DIGITAL DROP</span><div><i style={{ width: `${shown}%` }} /></div><small>CARGANDO {Math.round(shown)}%</small></div>;
}

/** Daylight rig: warm sun with shadows, sky/grass hemisphere fill and soft image-based reflections. */
function Lighting({ quality, showroom }: { quality: boolean; showroom: boolean }) {
  return <>
    <hemisphereLight args={['#cadbe8', '#80725d', .7]} />
    <directionalLight castShadow={quality} position={[-42, 38, 32]} intensity={2.4} color="#ffe0b5" shadow-mapSize={quality ? [4096, 4096] : [512, 512]} shadow-bias={-.00012} shadow-normalBias={.035} shadow-radius={3} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-far={150} />
    <directionalLight position={[35, 20, -30]} intensity={.35} color="#a9d0ff" />
    <Suspense fallback={null}>{showroom ? <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={1.35} color="#bfe2ff" position={[0, 10, -12]} scale={[30, 8, 1]} />
      <Lightformer form="rect" intensity={1.05} color="#fff3dc" position={[-12, 8, 8]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} />
      <Lightformer form="rect" intensity={.35} color="#b5ae90" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
    </Environment> : <Environment files="/assets/textures/digital-drop/daylight.hdr" background backgroundIntensity={.8} environmentIntensity={.65} environmentRotation={[0, 2.1, 0]} backgroundRotation={[0, 2.1, 0]} />}</Suspense>
  </>;
}

export default function DigitalDrop() {
  const phase = useDrop(s => s.phase), round = useDrop(s => s.round), quality = useDrop(s => s.quality), muted = useDrop(s => s.muted);
  const lobby = useDrop(s => s.lobby), matchMode = useDrop(s => s.matchMode), roomCode = useDrop(s => s.roomCode);
  // Invite links (/3d?sala=1234) open the join box with the code filled in.
  const [invited] = useState(() => new URLSearchParams(location.search).get('sala')?.slice(0, 8) ?? '');
  const [ready, setReady] = useState(false);
  const online = lobby.length > 0, isHost = online && net.mode === 'host';
  const deploy = () => {
    if (online && !isHost) return;
    if (isHost) {
      // Battle royale needs at least two agents; a lone host plays co-op.
      const mode = lobby.length > 1 ? matchMode : 'coop';
      useDrop.setState({ matchMode: mode }); send({ t: 'start', spawn: useDrop.getState().spawn, mode });
    }
    sfx.deploy(); useDrop.getState().start(); lock();
  };
  useEffect(() => {
    try { const saved = localStorage.getItem('monova-drop-name'); if (saved) useDrop.setState({ playerName: saved }); } catch {}
    return onNet(msg => {
      if (msg.t !== 'start') return;
      useDrop.setState({ spawn: msg.spawn, matchMode: msg.mode ?? 'pvp' }); useDrop.getState().start();
      useDrop.getState().notify('¡PARTIDA INICIADA! HAZ CLIC PARA ACTIVAR LA CÁMARA');
    });
  }, []);
  const toMenu = () => { useDrop.setState({ phase: 'menu' }); sfx.drone(false); };
  const resume = () => { useDrop.setState({ phase: 'play' }); lock(); };
  const party = lobby.filter(p => p.id !== net.id);

  return <main id="drop-game" className={styles.game} data-phase={phase} onContextMenu={e => e.preventDefault()} onClick={e => { if (phase === 'play' && !document.pointerLockElement && (e.target as HTMLElement).tagName === 'CANVAS') lock(); }}>
    <Canvas shadows={quality ? { type: PCFShadowMap } : false} flat dpr={quality ? [1, 1.75] : [.75, 1]} camera={{ position: [7.5, 4.3, 15], fov: 50, near: .1, far: 500 }} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }} onCreated={() => setReady(true)} fallback={<p className={styles.fallback}>Necesitas un navegador compatible con WebGL para jugar.</p>}>
      <color attach="background" args={[phase === 'menu' ? '#1f6fe0' : '#9fd2ff']} />
      <fog attach="fog" args={phase === 'menu' ? ['#1f6fe0', 30, 90] : ['#c8cdd0', 65, 235]} />
      <Lighting quality={quality} showroom={phase === 'menu'} />
      <Suspense fallback={null}>
        {phase === 'menu' ? <Showroom quality={quality} party={party} /> : <Physics paused={phase !== 'play' && !online} gravity={[0, -20, 0]}><World /><Engine key={round} /><RemotePlayers /></Physics>}
      </Suspense>
      <PostFX quality={quality} />
    </Canvas>
    <Loader ready={ready} />
    <div className={styles.shade} />
    <div key={phase} className={styles.wipe} />

    {phase !== 'menu' && <header className={styles.gameBar}>
      <Link href="/">MONOVA</Link>
      <span>{online ? `${matchMode === 'pvp' ? 'BATALLA' : 'CO-OP'} · SALA ${roomCode} · ${lobby.length}/${MAX_PLAYERS}` : 'CAMPAÑA'}</span>
      <button onClick={() => { if (phase === 'play') { useDrop.setState({ phase: 'pause' }); document.exitPointerLock?.(); } else toMenu(); }}>{phase === 'play' ? 'PAUSA' : 'SALIR'}</button>
    </header>}

    {phase === 'menu' && <Lobby ready={ready} invited={invited} onPlay={deploy} />}

    {(phase === 'play' || phase === 'pause') && <Hud />}

    {phase === 'pause' && <div className={styles.pause}>
      <div className={styles.pauseMenu}>
        <small>{online ? 'LA PARTIDA SIGUE EN CURSO' : 'JUEGO EN PAUSA'}</small>
        <h2>TOMA UN<br /><span>RESPIRO.</span></h2><p className={styles.pauseCopy}>{online ? "Tu equipo sigue en la ciudad. Vuelve cuando estés listo." : "La ciudad puede esperar. Tu próxima jugada, no."}</p>
        <button className={styles.yellow} onClick={resume}>CONTINUAR</button>
        <button onClick={() => useDrop.setState(s => ({ muted: !s.muted }))}>AUDIO · {muted ? 'OFF' : 'ON'}</button>
        <button onClick={toMenu}>VOLVER AL LOBBY</button>
      </div>
      <section className={styles.pauseControls}><small>MANUAL DE CAMPO / 01</small><h3>DOMINA LA CIUDAD</h3><div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div><p>Muévete. Explora. Haz que las ideas funcionen.</p></section>
    </div>}

    {(phase === 'over' || phase === 'win') && <Results won={phase === 'win'} onRetry={deploy} onMenu={toMenu} waiting={online && !isHost} />}
  </main>;
}

function Results({ won, onRetry, onMenu, waiting }: { won: boolean; onRetry: () => void; onMenu: () => void; waiting: boolean }) {
  const kills = useDrop(s => s.kills), credits = useDrop(s => s.credits), time = useDrop(s => s.time), shots = useDrop(s => s.shots), hits = useDrop(s => s.hits), hp = useDrop(s => s.hp);
  const pvp = useDrop(s => s.matchMode) === 'pvp' && net.mode !== 'solo', winner = useDrop(s => s.winner), placement = useDrop(s => s.placement), pkills = useDrop(s => s.pkills);
  const lobby = useDrop(s => s.lobby), eliminated = useDrop(s => s.eliminated), playerName = useDrop(s => s.playerName);
  const accuracy = shots ? hits / shots : 0, rank = grade(kills, accuracy, hp, won);
  const earned = credits + (won ? 500 : 100);
  // Bank this match into the persistent career exactly once.
  const saved = useRef(false);
  useEffect(() => { if (!saved.current) { saved.current = true; saveMatch(earned, won, pvp ? pkills : kills); } }, [earned, won, pvp, pkills, kills]);

  const nameOf = (id: string) => id === net.id ? (playerName || 'TÚ') : lobby.find(p => p.id === id)?.name || 'AGENTE';
  const out = [...new Map(eliminated.map(e => [e.id, e])).values()].reverse();
  const winnerId = lobby.find(p => !out.some(e => e.id === p.id))?.id;
  const order = [...(winnerId ? [winnerId] : []), ...out.map(e => e.id)];
  const killsOf = (id: string) => eliminated.filter(e => e.by === id && e.id !== id).length;
  const place = won ? 1 : pvp ? placement || 2 : 0;

  return <div className={styles.results} data-won={won}>
    {won && <div className={styles.rays} />}
    <div className={styles.resultHead}>
      {pvp && <b className={styles.place}>#{place}</b>}
      <h2>{won ? (pvp ? '¡VICTORIA MONOVA!' : '¡CIUDAD LIMPIA!') : pvp ? 'ELIMINADO' : 'MISIÓN FALLIDA'}</h2>
      <p>{won ? 'IDEAS THAT WORK' : pvp ? `GANADOR: ${winner || 'AGENTE'}` : 'El sistema te necesita. Vuelve a desplegar.'}</p>
    </div>
    {pvp && <div className={styles.board}>{order.map((id, i) => {
      const slot = lobby.find(p => p.id === id)?.slot ?? 0;
      return <div key={id} data-me={id === net.id} style={{ '--c': slotColors[slot], animationDelay: `${.3 + i * .08}s` } as React.CSSProperties}>
        <b>#{i + 1}</b><i /><span>{nameOf(id)}</span>{i === 0 && <CrownIcon className={styles.crown} />}<small><SkullIcon />{killsOf(id)}</small>
      </div>;
    })}</div>}
    <div className={styles.cards}>
      {pvp ? <>
        <div><small>ELIMINACIONES</small><strong>{pkills}</strong></div>
        <div><small>PRECISIÓN</small><strong>{Math.round(accuracy * 100)}%</strong></div>
        <div><small>SUPERVIVENCIA</small><strong>{Math.floor(time)}s</strong></div>
      </> : <>
        <div data-rank={rank}><small>RANGO</small><strong>{rank}</strong></div>
        <div><small>BUGS</small><strong>{kills}/{TOTAL_BUGS}</strong></div>
        <div><small>PRECISIÓN</small><strong>{Math.round(accuracy * 100)}%</strong></div>
        <div><small>TIEMPO</small><strong>{Math.floor(time)}s</strong></div>
      </>}
      <div data-gold><small>CRÉDITOS GANADOS</small><strong><CoinIcon />+{earned}</strong></div>
    </div>
    <div className={styles.resultActions}>
      <button className={styles.yellow} disabled={waiting} onClick={onRetry}>{waiting ? 'ESPERANDO AL LÍDER' : pvp ? 'REVANCHA' : 'JUGAR DE NUEVO'}</button>
      <button className={styles.blue} onClick={onMenu}>VOLVER AL LOBBY</button>
    </div>
  </div>;
}
