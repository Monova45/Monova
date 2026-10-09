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
import { TOTAL_BUGS, abilities, districts, grade, useDrop, weapons } from './state';
import { DEFAULT_CODE, MAX_PLAYERS, joinRoom, leaveRoom, net, onNet, send, setMatchMode, slotColors } from './net';
import { RemotePlayers } from './remote';
import styles from './game.module.css';

const lock = () => {
  const canvas = document.querySelector('#drop-game canvas') as HTMLCanvasElement | null;
  void canvas?.requestPointerLock?.()?.catch(() => useDrop.getState().notify('HAZ CLIC EN EL ESCENARIO PARA ACTIVAR LA CÁMARA'));
};
const districtInfo = ['Centro neurálgico · zona abierta', 'Cañón de servidores · cobertura alta', 'Pabellón de diseño · líneas largas', 'Reactor de IA · zona radial', 'Barrio corrupto · alto riesgo'];
const controls: [string, string][] = [['W A S D', 'Mover'], ['SHIFT', 'Correr'], ['ESPACIO', 'Saltar'], ['CLIC', 'Disparar'], ['CLIC DER.', 'Apuntar'], ['R', 'Recargar'], ['E', 'Abrir cofre'], ['1–5 / RUEDA', 'Armas'], ['Q', 'Habilidad'], ['ESC', 'Pausa']];

function Stat({ label, value }: { label: string; value: number }) {
  return <div className={styles.stat}><span>{label}</span><div>{Array.from({ length: 5 }, (_, i) => <i key={i} data-on={i < value} />)}</div></div>;
}

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
  const phase = useDrop(s => s.phase), round = useDrop(s => s.round), spawn = useDrop(s => s.spawn), muted = useDrop(s => s.muted), quality = useDrop(s => s.quality);
  const ability = useDrop(s => s.ability), sensitivity = useDrop(s => s.sensitivity);
  const lobby = useDrop(s => s.lobby), netStatus = useDrop(s => s.netStatus), playerName = useDrop(s => s.playerName), matchMode = useDrop(s => s.matchMode);
  const [panel, setPanel] = useState('');
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  const online = lobby.length > 0, isHost = online && net.mode === 'host';
  const deploy = () => {
    if (online && !isHost) return;
    if (isHost) {
      // Battle royale needs at least two agents; a lone host plays co-op.
      const mode = lobby.length > 1 ? matchMode : 'coop';
      useDrop.setState({ matchMode: mode }); send({ t: 'start', spawn: useDrop.getState().spawn, mode });
    }
    useDrop.getState().start(); lock();
  };
  useEffect(() => {
    try { const saved = localStorage.getItem('monova-drop-name'); if (saved) useDrop.setState({ playerName: saved }); } catch {}
    return onNet(msg => {
      if (msg.t !== 'start') return;
      useDrop.setState({ spawn: msg.spawn, matchMode: msg.mode }); useDrop.getState().start();
      useDrop.getState().notify('PARTIDA INICIADA · HAZ CLIC PARA ACTIVAR LA CÁMARA');
    });
  }, []);
  const setName = (name: string) => { useDrop.setState({ playerName: name }); try { localStorage.setItem('monova-drop-name', name); } catch {} };
  const toMenu = () => { useDrop.setState({ phase: 'menu' }); sfx.drone(false); };
  const togglePanel = (p: string) => { sfx.ui(); setPanel(panel === p ? '' : p); };

  return <main id="drop-game" className={styles.game} data-phase={phase} onContextMenu={e => e.preventDefault()} onClick={e => { if (phase === 'play' && !document.pointerLockElement && (e.target as HTMLElement).tagName === 'CANVAS') lock(); }}>
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
    <header className={styles.header}>
      <Link href="/">MONOVA<span>/ 3D</span></Link>
      <span>DIGITAL DROP · {online ? `${matchMode === 'pvp' ? 'BATALLA' : 'CO-OP'} · SALA ${code} · ${lobby.length}/${MAX_PLAYERS}` : 'SINGLE PLAYER'}</span>
      <button onClick={() => { if (phase === 'play') { useDrop.setState({ phase: 'pause' }); document.exitPointerLock?.(); } else toMenu(); }}>{phase === 'menu' ? 'MENÚ' : 'PAUSA'}</button>
    </header>

    {phase === 'menu' && <>
      <aside className={styles.agentLabel}><span>OPERADOR ACTIVO</span><strong>M—01</strong><p>MONOVA CAT / CARBON SUIT</p><div><i />SISTEMAS EN LÍNEA</div></aside>
      <div className={styles.menu}>
        <p className={styles.eyebrow}>MONOVA ORIGINAL / PROTOCOLO 001</p>
        <h1>DIGITAL<br /><span>DROP.</span></h1>
        <p className={styles.lede}>La ciudad está infectada.<br />Tú eres la última línea de código.</p>
        <div className={styles.cta}>
          <button className={styles.primary} disabled={!ready || (online && !isHost)} onClick={deploy}>{!ready ? 'CARGANDO…' : online && !isHost ? 'ESPERANDO ANFITRIÓN' : isHost ? <>INICIAR · {lobby.length} JUGADOR{lobby.length > 1 ? 'ES' : ''} <b>↗</b></> : <>DESPLEGAR <b>↗</b></>}</button>
          <div className={styles.dropAt}><small>{online ? `SALA ${code}` : 'ATERRIZAJE'}</small><strong>{online ? `${lobby.length} AGENTE${lobby.length > 1 ? 'S' : ''}` : districts[spawn]}</strong></div>
        </div>
        <div className={styles.links}>{['MULTIJUGADOR', 'ZONA', 'AGENTE', 'ARSENAL', 'AJUSTES', 'CONTROLES'].map(p => <button key={p} data-active={panel === p} onClick={() => togglePanel(p)}>{p}</button>)}</div>
        {panel && <div className={styles.panel}>
          {panel === 'MULTIJUGADOR' && <><h3>MULTIJUGADOR</h3>
            <p>Hasta {MAX_PLAYERS} agentes. Comparte el código; quien entra primero es el anfitrión y elige el modo. En BATALLA cada uno cae en un distrito distinto.</p>
            <div className={styles.mpForm}>
              <label>NOMBRE<input value={playerName} maxLength={14} placeholder="AGENTE" disabled={online} onChange={e => setName(e.target.value.toUpperCase())} /></label>
              <label>CÓDIGO<input value={code} maxLength={8} inputMode="numeric" disabled={online} onChange={e => setCode(e.target.value.replace(/\s/g, ''))} /></label>
            </div>
            {online ? <button className={styles.wide} onClick={() => { sfx.ui(); leaveRoom(); }}>SALIR DE LA SALA</button>
              : <button className={styles.wide} disabled={!code || netStatus === 'CONECTANDO…'} onClick={() => { sfx.ui(); void joinRoom(code, playerName || 'AGENTE'); }}>{netStatus === 'CONECTANDO…' ? 'CONECTANDO…' : 'UNIRSE A LA SALA'}</button>}
            {online && <div className={styles.modes}>{([['pvp', 'BATALLA', 'Todos contra todos · último en pie gana'], ['coop', 'CO-OP', 'Equipo contra los Bugs']] as const).map(([id, label, detail]) =>
              <button key={id} data-active={matchMode === id} disabled={!isHost} onClick={() => { sfx.ui(); setMatchMode(id); }}><b>{label}</b><small>{detail}</small></button>)}</div>}
            {netStatus && <small className={styles.netStatus}>{netStatus}</small>}
            {online && <small className={styles.netStatus} style={{ color: 'var(--muted)' }}>{matchMode === 'pvp' && lobby.length < 2 ? 'BATALLA NECESITA MÍNIMO 2 JUGADORES · SOLO SE JUGARÁ CO-OP' : `DE 2 A ${MAX_PLAYERS} JUGADORES · PUEDES INICIAR CUANDO QUIERAS`}</small>}
            {online && (isHost
              ? <button className={styles.primary} style={{ width: '100%', marginTop: 12 }} disabled={!ready} onClick={() => { sfx.ui(); deploy(); }}>INICIAR CON {lobby.length} JUGADOR{lobby.length > 1 ? 'ES' : ''} <b>↗</b></button>
              : <p className={styles.waitHost}><i />ESPERANDO A QUE {(lobby.find(p => p.slot === 0)?.name || 'EL ANFITRIÓN').toUpperCase()} INICIE LA PARTIDA</p>)}
            {online && <div className={styles.roster}>{Array.from({ length: MAX_PLAYERS }, (_, i) => { const p = lobby.find(x => x.slot === i); return <div key={i} data-empty={!p}><i style={{ background: slotColors[i] }} /><span>{p ? p.name || 'AGENTE' : 'ESPERANDO…'}</span><small>{p ? (i === 0 ? 'ANFITRIÓN' : p.id === net.id ? 'TÚ' : 'LISTO') : ''}{p && i === 0 && p.id === net.id ? ' · TÚ' : ''}</small></div>; })}</div>}
          </>}
          {panel === 'ZONA' && <><h3>PUNTO DE ATERRIZAJE</h3><div className={styles.zones}>{districts.map((d, i) => <button key={d} data-active={spawn === i} onClick={() => { sfx.ui(); useDrop.setState({ spawn: i }); }}><b>{i === 0 ? 'HQ' : `0${i}`}</b><span>{d}<small>{districtInfo[i]}</small></span></button>)}</div></>}
          {panel === 'AGENTE' && <><h3>M-01 · MONOVA CAT</h3><p>Armadura de carbono, visión digital y cuatro protocolos de combate. Elige el protocolo que activarás con <kbd>Q</kbd>.</p>
            <div className={styles.zones}>{abilities.map((a, i) => <button key={a.name} data-active={ability === i} onClick={() => { sfx.ui(); useDrop.setState({ ability: i }); }}><b>0{i + 1}</b><span>{a.name}<small>{a.detail}</small></span></button>)}</div></>}
          {panel === 'ARSENAL' && <><h3>ARSENAL</h3><p>Despliegas con Pixel Blaster. Cada Data Crate desbloquea una herramienta nueva.</p>
            <div className={styles.arsenal}>{weapons.map((w, i) => <div key={w.name}><strong style={{ color: w.color }}>{i + 1} · {w.name}</strong><Stat label="DAÑO" value={w.power} /><Stat label="CADENCIA" value={w.rate} /><Stat label="PRECISIÓN" value={w.range} /></div>)}</div></>}
          {panel === 'AJUSTES' && <><h3>AJUSTES</h3><div className={styles.settings}>
            <button onClick={() => useDrop.setState({ muted: !muted })}>AUDIO <b>{muted ? 'OFF' : 'ON'}</b></button>
            <button onClick={() => useDrop.setState({ quality: !quality })}>GRÁFICOS <b>{quality ? 'ULTRA' : 'RENDIMIENTO'}</b></button>
            <label>SENSIBILIDAD <b>{sensitivity.toFixed(1)}</b><input type="range" min={.3} max={2.5} step={.1} value={sensitivity} onChange={e => useDrop.setState({ sensitivity: Number(e.target.value) })} /></label>
          </div></>}
          {panel === 'CONTROLES' && <><h3>CONTROLES</h3><div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div></>}
        </div>}
      </div>
    </>}

    {(phase === 'play' || phase === 'pause') && <Hud />}

    {phase === 'pause' && <div className={styles.overlay}>
      <p className={styles.eyebrow}>{online ? 'LA PARTIDA SIGUE EN CURSO' : 'SESIÓN SUSPENDIDA'}</p><h2>EN PAUSA</h2>
      <div className={styles.overlayActions}><button className={styles.primary} onClick={() => { useDrop.setState({ phase: 'play' }); lock(); }}>CONTINUAR</button><button onClick={toMenu}>ABANDONAR</button></div>
      <div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div>
    </div>}

    {(phase === 'over' || phase === 'win') && <Results won={phase === 'win'} onRetry={deploy} onMenu={toMenu} waiting={online && !isHost} />}
  </main>;
}

function Results({ won, onRetry, onMenu, waiting }: { won: boolean; onRetry: () => void; onMenu: () => void; waiting: boolean }) {
  const kills = useDrop(s => s.kills), credits = useDrop(s => s.credits), time = useDrop(s => s.time), shots = useDrop(s => s.shots), hits = useDrop(s => s.hits), hp = useDrop(s => s.hp);
  const pvp = useDrop(s => s.matchMode) === 'pvp' && net.mode !== 'solo', winner = useDrop(s => s.winner), placement = useDrop(s => s.placement), pkills = useDrop(s => s.pkills);
  const accuracy = shots ? hits / shots : 0, rank = grade(kills, accuracy, hp, won);
  if (pvp) return <div className={styles.overlay} data-result={won ? 'win' : 'over'}>
    <p className={styles.eyebrow}>MONOVA / DIGITAL DROP · BATALLA</p>
    <h2>{won ? 'ÚLTIMO EN PIE.' : 'ELIMINADO.'}</h2>
    <p>{won ? '¡Ganaste la batalla! IDEAS THAT WORK.' : `Ganador: ${winner || 'AGENTE'}`}</p>
    <div className={styles.results}>
      <div className={styles.rank}><small>PUESTO</small><strong data-rank={won ? 'S' : 'A'}>#{won ? 1 : placement || 2}</strong></div>
      <div><small>ELIMINACIONES</small><strong>{pkills}</strong></div>
      <div><small>BUGS</small><strong>{kills}</strong></div>
      <div><small>PRECISIÓN</small><strong>{Math.round(accuracy * 100)}<em>%</em></strong></div>
      <div><small>TIEMPO</small><strong>{Math.floor(time)}<em>s</em></strong></div>
    </div>
    <div className={styles.overlayActions}><button className={styles.primary} disabled={waiting} onClick={onRetry}>{waiting ? 'ESPERANDO ANFITRIÓN' : 'REVANCHA'}</button><button onClick={onMenu}>MENÚ</button></div>
  </div>;
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
