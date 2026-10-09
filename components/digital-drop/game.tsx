"use client";
import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, Lightformer, Stars, useProgress } from '@react-three/drei';
import Link from 'next/link';
import { Engine } from './engine';
import { World } from './world';
import { Showroom } from './showroom';
import { PostFX } from './effects';
import { Hud } from './hud';
import { sfx } from './audio';
import { TOTAL_BUGS, grade, useDrop } from './state';
import { MAX_PLAYERS, net, onNet, send, slotColors } from './net';
import { MainMenu, controls } from './menu';
import { Lobby } from './lobby';
import { RemotePlayers } from './remote';
import styles from './game.module.css';

const lock = () => {
  const canvas = document.querySelector('#drop-game canvas') as HTMLCanvasElement | null;
  void canvas?.requestPointerLock?.()?.catch(() => useDrop.getState().notify('HAZ CLIC EN EL ESCENARIO PARA ACTIVAR LA CÁMARA'));
};
function Loader({ ready }: { ready: boolean }) {
  const { progress, active } = useProgress();
  const shown = active ? progress : ready ? 100 : 15;
  return <div className={styles.loader} data-done={ready && !active}><span>MONOVA CITY</span><div><i style={{ width: `${shown}%` }} /></div><small>SINCRONIZANDO {Math.round(shown)}%</small></div>;
}

function Lighting({ quality }: { quality: boolean }) {
  return <>
    <hemisphereLight args={['#9cc4ec', '#1b2230', .9]} />
    <directionalLight castShadow={quality} position={[-25, 40, 18]} intensity={2.2} color="#c9dcff" shadow-mapSize={quality ? [2048, 2048] : [512, 512]} shadow-bias={-.0004} shadow-normalBias={.04} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={55} shadow-camera-bottom={-55} shadow-camera-far={120} />
    <directionalLight position={[30, 12, -30]} intensity={.8} color="#ff9a52" />
    {/* Image-based lighting built from light panels: gives metals something to reflect without loading an HDR file. */}
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2} color="#ff8a3d" position={[0, 5, -10]} scale={[20, 2, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#8ebeff" position={[-10, 8, 6]} rotation-y={Math.PI / 2} scale={[20, 3, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[6, 12, 6]} scale={4} />
      <Lightformer form="rect" intensity={.6} color="#3b5878" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
    </Environment>
  </>;
}

export default function DigitalDrop() {
  const phase = useDrop(s => s.phase), round = useDrop(s => s.round), quality = useDrop(s => s.quality), muted = useDrop(s => s.muted);
  const lobby = useDrop(s => s.lobby), matchMode = useDrop(s => s.matchMode), roomCode = useDrop(s => s.roomCode);
  // Invite links (/3d?sala=1234) open the multiplayer section with the code filled in.
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
    sfx.ui(); useDrop.getState().start(); lock();
  };
  useEffect(() => {
    try { const saved = localStorage.getItem('monova-drop-name'); if (saved) useDrop.setState({ playerName: saved }); } catch {}
    return onNet(msg => {
      if (msg.t !== 'start') return;
      useDrop.setState({ spawn: msg.spawn, matchMode: msg.mode ?? 'pvp' }); useDrop.getState().start();
      useDrop.getState().notify('PARTIDA INICIADA · HAZ CLIC PARA ACTIVAR LA CÁMARA');
    });
  }, []);
  const toMenu = () => { useDrop.setState({ phase: 'menu' }); sfx.drone(false); };
  const resume = () => { useDrop.setState({ phase: 'play' }); lock(); };

  return <main id="drop-game" className={styles.game} data-phase={phase} data-lobby={online && phase === 'menu'} onContextMenu={e => e.preventDefault()} onClick={e => { if (phase === 'play' && !document.pointerLockElement && (e.target as HTMLElement).tagName === 'CANVAS') lock(); }}>
    <Canvas shadows={quality} flat dpr={quality ? [1, 1.75] : [.75, 1]} camera={{ position: [9, 4.3, 14], fov: 50, near: .1, far: 400 }} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }} onCreated={() => setReady(true)} fallback={<p className={styles.fallback}>Necesitas un navegador compatible con WebGL para jugar.</p>}>
      <color attach="background" args={['#070c14']} />
      <fog attach="fog" args={phase === 'menu' ? ['#070c14', 18, 60] : ['#0a1220', 35, 150]} />
      <Lighting quality={quality} />
      <Stars radius={150} depth={40} count={1500} factor={3} fade speed={.4} />
      <Suspense fallback={null}>
        {phase === 'menu' ? <Showroom quality={quality} /> : <Physics paused={phase !== 'play' && !online} gravity={[0, -20, 0]}><World /><Engine key={round} /><RemotePlayers /></Physics>}
      </Suspense>
      <PostFX quality={quality} />
    </Canvas>
    <Loader ready={ready} />
    <div className={styles.vignette} />
    <div className={styles.scanlines} />
    {/* Re-keyed on every phase change so each screen enters with a quick wipe. */}
    <div key={phase} className={styles.wipe} />
    <header className={styles.header}>
      <Link href="/">MONOVA<span>/ 3D</span></Link>
      <span>DIGITAL DROP · {online ? `${matchMode === 'pvp' ? 'BATALLA' : 'CO-OP'} · SALA ${roomCode} · ${lobby.length}/${MAX_PLAYERS}` : 'SINGLE PLAYER'}</span>
      <button onClick={() => { if (phase === 'play') { useDrop.setState({ phase: 'pause' }); document.exitPointerLock?.(); } else if (phase !== 'menu') toMenu(); }}>{phase === 'menu' ? 'v1.0' : 'PAUSA'}</button>
    </header>

    {phase === 'menu' && (online ? <Lobby ready={ready} onStart={deploy} /> : <MainMenu ready={ready} invited={invited} onDeploy={deploy} />)}

    {(phase === 'play' || phase === 'pause') && <Hud />}

    {phase === 'pause' && <div className={styles.overlay}>
      <div className={styles.pause}>
        <p className={styles.eyebrow}>{online ? 'LA PARTIDA SIGUE EN CURSO' : 'SESIÓN SUSPENDIDA'}</p><h2>PAUSA</h2>
        <div className={styles.pauseActions}>
          <button className={styles.primary} onClick={resume}>CONTINUAR <b>↗</b></button>
          <button onClick={() => useDrop.setState(s => ({ muted: !s.muted }))}>AUDIO · {muted ? 'OFF' : 'ON'}</button>
          <button onClick={toMenu}>ABANDONAR PARTIDA</button>
        </div>
      </div>
      <div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div>
    </div>}

    {(phase === 'over' || phase === 'win') && <Results won={phase === 'win'} onRetry={deploy} onMenu={toMenu} waiting={online && !isHost} />}
  </main>;
}

function Results({ won, onRetry, onMenu, waiting }: { won: boolean; onRetry: () => void; onMenu: () => void; waiting: boolean }) {
  const kills = useDrop(s => s.kills), credits = useDrop(s => s.credits), time = useDrop(s => s.time), shots = useDrop(s => s.shots), hits = useDrop(s => s.hits), hp = useDrop(s => s.hp);
  const pvp = useDrop(s => s.matchMode) === 'pvp' && net.mode !== 'solo', winner = useDrop(s => s.winner), placement = useDrop(s => s.placement), pkills = useDrop(s => s.pkills);
  const accuracy = shots ? hits / shots : 0, rank = grade(kills, accuracy, hp, won);
  if (pvp) {
    // Final standings: the winner, then everyone else from last eliminated to first.
    const lobby = useDrop.getState().lobby, eliminated = useDrop.getState().eliminated;
    const nameOf = (id: string) => id === net.id ? (useDrop.getState().playerName || 'TÚ') : lobby.find(p => p.id === id)?.name || 'AGENTE';
    const out = [...new Map(eliminated.map(e => [e.id, e])).values()].reverse();
    const winnerId = lobby.find(p => !out.some(e => e.id === p.id))?.id;
    const order = [...(winnerId ? [winnerId] : []), ...out.map(e => e.id)];
    const killsOf = (id: string) => eliminated.filter(e => e.by === id && e.id !== id).length;
    return <div className={styles.overlay} data-result={won ? 'win' : 'over'}>
      <p className={styles.eyebrow}>MONOVA / DIGITAL DROP · BATALLA</p>
      <h2>{won ? 'ÚLTIMO EN PIE.' : 'ELIMINADO.'}</h2>
      <p>{won ? '¡Ganaste la batalla! IDEAS THAT WORK.' : `Ganador: ${winner || 'AGENTE'}`}</p>
      <div className={styles.board}>{order.map((id, i) => {
        const slot = lobby.find(p => p.id === id)?.slot ?? 0;
        return <div key={id} data-me={id === net.id} style={{ '--c': slotColors[slot], animationDelay: `${i * .08}s` } as React.CSSProperties}>
          <b>#{i + 1}</b><i /><span>{nameOf(id)}</span><small>{killsOf(id)} ELIM.</small>{i === 0 && <em>GANADOR</em>}
        </div>;
      })}</div>
      <div className={styles.results}>
        <div className={styles.rank}><small>TU PUESTO</small><strong data-rank={won ? 'S' : 'A'}>#{won ? 1 : placement || 2}</strong></div>
        <div><small>ELIMINACIONES</small><strong>{pkills}</strong></div>
        <div><small>PRECISIÓN</small><strong>{Math.round(accuracy * 100)}<em>%</em></strong></div>
        <div><small>TIEMPO</small><strong>{Math.floor(time)}<em>s</em></strong></div>
      </div>
      <div className={styles.overlayActions}><button className={styles.primary} disabled={waiting} onClick={onRetry}>{waiting ? 'ESPERANDO ANFITRIÓN' : 'REVANCHA'}</button><button onClick={onMenu}>MENÚ</button></div>
    </div>;
  }
  return <div className={styles.overlay} data-result={won ? 'win' : 'over'}>
    <p className={styles.eyebrow}>MONOVA / DIGITAL DROP · {won ? 'MISIÓN CUMPLIDA' : 'MISIÓN FALLIDA'}</p>
    <h2>{won ? 'SYSTEM CLEAN.' : 'CONEXIÓN PERDIDA.'}</h2>
    <p>{won ? 'IDEAS THAT WORK.' : 'Vuelve a desplegar. El sistema te necesita.'}</p>
    <div className={styles.results}>
      <div className={styles.rank}><small>RANGO</small><strong data-rank={rank}>{rank}</strong></div>
      <div><small>BUGS</small><strong>{kills}<em>/{TOTAL_BUGS}</em></strong></div>
      <div><small>PRECISIÓN</small><strong>{Math.round(accuracy * 100)}<em>%</em></strong></div>
      <div><small>TIEMPO</small><strong>{Math.floor(time)}<em>s</em></strong></div>
      <div><small>CRÉDITOS</small><strong>{credits}</strong></div>
    </div>
    <div className={styles.overlayActions}><button className={styles.primary} disabled={waiting} onClick={onRetry}>{waiting ? 'ESPERANDO ANFITRIÓN' : 'VOLVER A JUGAR'}</button><button onClick={onMenu}>MENÚ</button></div>
  </div>;
}
