"use client";
import { useEffect, useState } from 'react';
import { sfx } from './audio';
import { abilities, districts, useDrop, weapons } from './state';
import { MAX_PLAYERS, createRoom, joinRoom } from './net';
import styles from './game.module.css';

const sections = [
  { id: 'play', label: 'JUGAR', hint: 'Campaña individual' },
  { id: 'online', label: 'MULTIJUGADOR', hint: `Batalla o co-op · 2 a ${MAX_PLAYERS}` },
  { id: 'agent', label: 'AGENTE', hint: 'Protocolo de combate' },
  { id: 'arsenal', label: 'ARSENAL', hint: '5 herramientas' },
  { id: 'settings', label: 'AJUSTES', hint: 'Gráficos, audio, controles' },
] as const;
type Section = typeof sections[number]['id'];

export const districtInfo = ['Centro neurálgico · zona abierta', 'Cañón de servidores · cobertura alta', 'Pabellón de diseño · líneas largas', 'Reactor de IA · zona radial', 'Barrio corrupto · alto riesgo'];
export const controls: [string, string][] = [['W A S D', 'Mover'], ['SHIFT', 'Correr'], ['ESPACIO', 'Saltar'], ['CLIC', 'Disparar'], ['CLIC DER.', 'Apuntar'], ['R', 'Recargar'], ['E', 'Abrir cofre'], ['1–5 / RUEDA', 'Armas'], ['Q', 'Habilidad'], ['ESC', 'Pausa']];
const ticker = ['BUGS DETECTADOS EN 5 DISTRITOS', 'FIREWALL EN EXPANSIÓN', 'NUEVO: MODO BATALLA · ÚLTIMO EN PIE GANA', 'CREA UNA SALA Y COMPARTE EL CÓDIGO', 'IDEAS THAT WORK', 'MONOVA CITY · PROTOCOLO 001'];

function Meter({ label, value }: { label: string; value: number }) {
  return <div className={styles.stat}><span>{label}</span><div>{Array.from({ length: 5 }, (_, i) => <i key={i} data-on={i < value} />)}</div></div>;
}

export function MainMenu({ ready, invited, onDeploy }: { ready: boolean; invited: string; onDeploy: () => void }) {
  const spawn = useDrop(s => s.spawn), ability = useDrop(s => s.ability), muted = useDrop(s => s.muted), quality = useDrop(s => s.quality), sensitivity = useDrop(s => s.sensitivity);
  const playerName = useDrop(s => s.playerName), netStatus = useDrop(s => s.netStatus);
  const [section, setSection] = useState<Section>(invited ? 'online' : 'play');
  const [code, setCode] = useState(invited);
  const busy = netStatus === 'CONECTANDO…' || netStatus === 'CREANDO SALA…';
  const go = (s: Section) => { if (s !== section) { sfx.ui(); setSection(s); } };
  const setName = (name: string) => { useDrop.setState({ playerName: name }); try { localStorage.setItem('monova-drop-name', name); } catch {} };

  // Arrow keys move through the menu; Enter deploys from the play section.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const i = sections.findIndex(s => s.id === section);
      if (e.key === 'ArrowDown') { e.preventDefault(); go(sections[(i + 1) % sections.length].id); }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(sections[(i - 1 + sections.length) % sections.length].id); }
      if (e.key === 'Enter' && section === 'play' && ready) onDeploy();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });

  return <>
    <div className={styles.menu}>
      <p className={styles.eyebrow}>MONOVA ORIGINAL / PROTOCOLO 001</p>
      <h1>DIGITAL<br /><span>DROP.</span></h1>
      <p className={styles.lede}>La ciudad está infectada. Tú eres la última línea de código.</p>
      <nav className={styles.nav}>{sections.map((s, i) => <button key={s.id} data-active={section === s.id} onMouseEnter={() => go(s.id)} onFocus={() => go(s.id)} onClick={() => { go(s.id); if (s.id === 'play' && section === 'play' && ready) onDeploy(); }}>
        <small>0{i + 1}</small><b>{s.label}</b><em>{s.hint}</em>
      </button>)}</nav>
      <p className={styles.navHint}><kbd>↑</kbd><kbd>↓</kbd> NAVEGAR · <kbd>ENTER</kbd> DESPLEGAR</p>
    </div>

    <section key={section} className={styles.sheet}>
      {section === 'play' && <>
        <header><small>01 / CAMPAÑA</small><h2>Limpia la ciudad</h2><p>Elimina los 16 Bugs y sobrevive al Firewall hasta que se cierre por completo.</p></header>
        <h3>PUNTO DE ATERRIZAJE</h3>
        <div className={styles.zones}>{districts.map((d, i) => <button key={d} data-active={spawn === i} onClick={() => { sfx.ui(); useDrop.setState({ spawn: i }); }}><b>{i === 0 ? 'HQ' : `0${i}`}</b><span>{d}<small>{districtInfo[i]}</small></span></button>)}</div>
        <button className={styles.primary} disabled={!ready} onClick={onDeploy}>{ready ? <>DESPLEGAR EN {districts[spawn]} <b>↗</b></> : 'CARGANDO…'}</button>
      </>}

      {section === 'online' && <>
        <header><small>02 / MULTIJUGADOR</small><h2>Juega con tu gente</h2><p>De 2 a {MAX_PLAYERS} jugadores. Crea una sala y comparte el código, o entra con el código de un amigo.</p></header>
        <label className={styles.field}><span>TU NOMBRE</span><input value={playerName} maxLength={14} placeholder="AGENTE" onChange={e => setName(e.target.value.toUpperCase())} /></label>
        <button className={styles.bigAction} disabled={busy} onClick={() => { sfx.ui(); void createRoom(); }}>
          <b>{netStatus === 'CREANDO SALA…' ? 'CREANDO SALA…' : 'CREAR SALA'}</b><small>Recibes un código nuevo y eres el anfitrión</small><i>↗</i>
        </button>
        <div className={styles.divide}><span>O ÚNETE CON UN CÓDIGO</span></div>
        <div className={styles.joinRow}>
          <input value={code} maxLength={8} placeholder="0000" inputMode="numeric" onChange={e => setCode(e.target.value.replace(/\s/g, ''))} onKeyDown={e => { if (e.key === 'Enter' && code && !busy) void joinRoom(code, playerName || 'AGENTE'); }} />
          <button disabled={!code || busy} onClick={() => { sfx.ui(); void joinRoom(code, playerName || 'AGENTE'); }}>{netStatus === 'CONECTANDO…' ? 'CONECTANDO…' : 'UNIRSE'}</button>
        </div>
        {netStatus && !busy && <small className={styles.netStatus}>{netStatus}</small>}
      </>}

      {section === 'agent' && <>
        <header><small>03 / AGENTE</small><h2>M-01 · Monova</h2><p>Visión digital, armadura de carbono y cuatro protocolos. Elige el que activarás con <kbd>Q</kbd>.</p></header>
        <div className={styles.zones}>{abilities.map((a, i) => <button key={a.name} data-active={ability === i} onClick={() => { sfx.ui(); useDrop.setState({ ability: i }); }}><b>0{i + 1}</b><span>{a.name}<small>{a.detail}</small></span></button>)}</div>
      </>}

      {section === 'arsenal' && <>
        <header><small>04 / ARSENAL</small><h2>Herramientas</h2><p>Despliegas con Pixel Blaster. Cada Data Crate desbloquea una nueva.</p></header>
        <div className={styles.arsenal}>{weapons.map((w, i) => <div key={w.name} style={{ '--w': w.color } as React.CSSProperties}><strong><kbd>{i + 1}</kbd>{w.name}</strong><Meter label="DAÑO" value={w.power} /><Meter label="CADENCIA" value={w.rate} /><Meter label="PRECISIÓN" value={w.range} /></div>)}</div>
      </>}

      {section === 'settings' && <>
        <header><small>05 / AJUSTES</small><h2>Configuración</h2></header>
        <div className={styles.settings}>
          <button onClick={() => useDrop.setState({ muted: !muted })}>AUDIO <b>{muted ? 'OFF' : 'ON'}</b></button>
          <button onClick={() => useDrop.setState({ quality: !quality })}>GRÁFICOS <b>{quality ? 'ULTRA' : 'RENDIMIENTO'}</b></button>
          <label>SENSIBILIDAD <b>{sensitivity.toFixed(1)}</b><input type="range" min={.3} max={2.5} step={.1} value={sensitivity} onChange={e => useDrop.setState({ sensitivity: Number(e.target.value) })} /></label>
        </div>
        <h3>CONTROLES</h3>
        <div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div>
      </>}
    </section>

    <aside className={styles.agentLabel}><span>OPERADOR ACTIVO</span><strong>M—01</strong><p>MONOVA CAT / CARBON SUIT</p><div><i />SISTEMAS EN LÍNEA</div></aside>
    <div className={styles.ticker}><div>{[...ticker, ...ticker].map((t, i) => <span key={i}>{t}</span>)}</div></div>
  </>;
}
