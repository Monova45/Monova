"use client";
import { useEffect, useState } from 'react';
import { sfx } from './audio';
import { abilities, districts, levelOf, loadCareer, rarities, useDrop, weapons } from './state';
import { MAX_PLAYERS, createRoom, joinRoom, leaveRoom, net, setMatchMode, slotColors } from './net';
import { AbilityIcon, CheckIcon, CoinIcon, CopyIcon, CrownIcon, LinkIcon, PlusIcon, WeaponIcon } from './icons';
import styles from './ui.module.css';

export const controls: [string, string][] = [['W A S D', 'Mover'], ['SHIFT', 'Correr'], ['ESPACIO', 'Saltar'], ['CLIC', 'Disparar'], ['CLIC DER.', 'Apuntar'], ['R', 'Recargar'], ['E', 'Interactuar'], ['1–5 / RUEDA', 'Armas'], ['Q', 'Habilidad'], ['M', 'Mapa de campaña'], ['ESC', 'Pausa']];
const tabs = [['play', 'JUGAR'], ['locker', 'CASILLERO'], ['arsenal', 'ARSENAL'], ['settings', 'AJUSTES']] as const;
type Tab = typeof tabs[number][0];

function Meter({ label, value }: { label: string; value: number }) {
  return <div className={styles.meter}><span>{label}</span><div>{Array.from({ length: 5 }, (_, i) => <i key={i} data-on={i < value} />)}</div></div>;
}

/** Fortnite-style front end: top tabs, party on the left, the squad's Monovas in the middle, mode + PLAY bottom-right. */
export function Lobby({ ready, invited, onPlay }: { ready: boolean; invited: string; onPlay: () => void }) {
  const lobby = useDrop(s => s.lobby), matchMode = useDrop(s => s.matchMode), roomCode = useDrop(s => s.roomCode), netStatus = useDrop(s => s.netStatus);
  const spawn = useDrop(s => s.spawn), ability = useDrop(s => s.ability), playerName = useDrop(s => s.playerName);
  const muted = useDrop(s => s.muted), quality = useDrop(s => s.quality), sensitivity = useDrop(s => s.sensitivity);
  const [tab, setTab] = useState<Tab>('play');
  const [code, setCode] = useState(invited);
  const [joining, setJoining] = useState(Boolean(invited));
  const [copied, setCopied] = useState('');
  const [career] = useState(loadCareer);
  const online = lobby.length > 0, isHost = online && net.mode === 'host', busy = netStatus === 'CONECTANDO…' || netStatus === 'CREANDO SALA…';
  const { level, progress } = levelOf(career.credits);
  const mode = !online ? 'solo' : matchMode;
  const canPlay = ready && (!online || isHost);
  const leader = lobby.find(p => p.slot === 0);

  const pick = (t: Tab) => { if (t !== tab) { sfx.ui(); setTab(t); } };
  const setName = (name: string) => { useDrop.setState({ playerName: name }); try { localStorage.setItem('monova-drop-name', name); } catch {} };
  const copy = (text: string, what: string) => { void navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(''), 1600); }); };
  const join = () => { if (code && !busy) { sfx.ui(); void joinRoom(code, playerName || 'AGENTE'); } };
  const cycleZone = () => { sfx.ui(); useDrop.setState({ spawn: (spawn + 1) % districts.length }); };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'Enter' && tab === 'play' && canPlay) onPlay();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [tab, canPlay, onPlay]);

  return <div className={styles.lobby} data-tab={tab}>
    <nav className={styles.topbar}>
      <div className={styles.brand}>MONOVA<small>DIGITAL DROP</small></div>
      <div className={styles.tabs}>{tabs.map(([id, label]) => <button key={id} data-active={tab === id} onClick={() => pick(id)}>{label}</button>)}</div>
      <div className={styles.profile}>
        <div className={styles.level}><b>{level}</b><div><small>NIVEL</small><i><u style={{ width: `${progress * 100}%` }} /></i></div></div>
        <div className={styles.coins}><CoinIcon />{career.credits.toLocaleString('es')}</div>
      </div>
    </nav>

    {tab === 'play' && <>
      <aside className={styles.party}>
        <h3>GRUPO <span>{online ? lobby.length : 1}/{MAX_PLAYERS}</span></h3>
        {online ? <>
          <div className={styles.roomBox}>
            <small>CÓDIGO DE SALA</small>
            <strong>{roomCode}</strong>
            <div>
              <button onClick={() => copy(roomCode, 'code')}>{copied === 'code' ? <CheckIcon /> : <CopyIcon />}{copied === 'code' ? 'COPIADO' : 'CÓDIGO'}</button>
              <button onClick={() => copy(`${location.origin}/3d?sala=${encodeURIComponent(roomCode)}`, 'link')}>{copied === 'link' ? <CheckIcon /> : <LinkIcon />}{copied === 'link' ? 'COPIADO' : 'ENLACE'}</button>
            </div>
          </div>
          <ul className={styles.members}>{Array.from({ length: MAX_PLAYERS }, (_, i) => {
            const p = lobby.find(x => x.slot === i);
            if (!p) return <li key={i} data-empty onClick={() => copy(`${location.origin}/3d?sala=${encodeURIComponent(roomCode)}`, 'link')}><span className={styles.plus}><PlusIcon /></span><b>INVITAR</b></li>;
            return <li key={i} style={{ '--c': slotColors[i] } as React.CSSProperties} data-me={p.id === net.id}>
              <span className={styles.dot} /><b>{p.name || 'AGENTE'}</b>{i === 0 && <CrownIcon className={styles.crown} />}{p.id === net.id && <em>TÚ</em>}
            </li>;
          })}</ul>
          <button className={styles.leave} onClick={() => { sfx.ui(); leaveRoom(); }}>SALIR DEL GRUPO</button>
        </> : <>
          <label className={styles.nameField}><span>TU NOMBRE</span><input value={playerName} maxLength={14} placeholder="AGENTE" onChange={e => setName(e.target.value.toUpperCase())} /></label>
          <button className={styles.yellow} disabled={busy} onClick={() => { sfx.ui(); void createRoom(); }}>{netStatus === 'CREANDO SALA…' ? 'CREANDO…' : 'CREAR SALA'}</button>
          {joining ? <div className={styles.joinBox}>
            <input autoFocus value={code} maxLength={8} placeholder="CÓDIGO" inputMode="numeric" onChange={e => setCode(e.target.value.replace(/\s/g, ''))} onKeyDown={e => { if (e.key === 'Enter') join(); }} />
            <button disabled={!code || busy} onClick={join}>{netStatus === 'CONECTANDO…' ? '…' : 'UNIRSE'}</button>
          </div> : <button className={styles.blue} onClick={() => { sfx.ui(); setJoining(true); }}>UNIRSE CON CÓDIGO</button>}
          {netStatus && !busy && <p className={styles.status}>{netStatus}</p>}
          <p className={styles.hint}>Crea una sala y comparte el código: pueden jugar de 2 a {MAX_PLAYERS} amigos.</p>
        </>}
      </aside>

      <div className={styles.news}><small>NOVEDAD</small><b>MODO BATALLA</b><span>Todos contra todos · el último en pie gana</span></div>

      <div className={styles.playDock}>
        <div className={styles.modeCard}>
          <small>{online ? (isHost ? 'ELIGE EL MODO' : 'MODO DEL LÍDER') : 'MODO'}</small>
          {online ? <div className={styles.modeSwitch}>{([['pvp', 'BATALLA'], ['coop', 'CO-OP']] as const).map(([id, label]) => <button key={id} data-active={matchMode === id} disabled={!isHost} onClick={() => { sfx.ui(); setMatchMode(id); }}>{label}</button>)}</div>
            : <b>CAMPAÑA</b>}
          <p>{mode === 'pvp' ? (lobby.length < 2 ? 'Necesita 2 jugadores · se jugará CO-OP' : `${lobby.length} jugadores · sin Bugs · último en pie gana`) : mode === 'coop' ? 'Equipo contra los 16 Bugs' : 'Elimina 16 Bugs y sobrevive al Firewall'}</p>
          {mode !== 'pvp' && (!online || isHost) && <button className={styles.zone} onClick={cycleZone}>ATERRIZAJE · <b>{districts[spawn]}</b> ›</button>}
        </div>
        <button className={styles.play} disabled={!canPlay} onClick={onPlay}>
          {!ready ? 'CARGANDO…' : online && !isHost ? <><CheckIcon />LISTO</> : 'JUGAR'}
        </button>
        {online && !isHost && <p className={styles.waiting}>ESPERANDO A QUE {(leader?.name || 'EL LÍDER').toUpperCase()} INICIE</p>}
      </div>
    </>}

    {tab === 'locker' && <section className={styles.locker}>
      <header><h2>CASILLERO</h2><p>Elige el protocolo que Monova activa con <kbd>Q</kbd>.</p></header>
      <div className={styles.lockerGrid}>{abilities.map((a, i) => <button key={a.name} data-active={ability === i} onClick={() => { sfx.ui(); useDrop.setState({ ability: i }); }}>
        <AbilityIcon index={i} className={styles.lockerIcon} /><b>{a.name}</b><small>{a.detail}</small>{ability === i && <span className={styles.equipped}><CheckIcon />EQUIPADO</span>}
      </button>)}</div>
    </section>}

    {tab === 'arsenal' && <section className={styles.shop}>
      <header><h2>ARSENAL</h2><p>Despliegas con Pixel Blaster. Abre los Data Crates para desbloquear el resto.</p></header>
      <div className={styles.shopGrid}>{weapons.map((w, i) => {
        const r = rarities[w.rarity];
        return <article key={w.name} style={{ '--r': r.color, '--rd': r.dark, animationDelay: `${i * .06}s` } as React.CSSProperties}>
          <div className={styles.shopArt}><WeaponIcon index={i} /></div>
          <div className={styles.shopInfo}><small>{r.label}</small><b>{w.name}</b>
            <Meter label="DAÑO" value={w.power} /><Meter label="CADENCIA" value={w.rate} /><Meter label="PRECISIÓN" value={w.range} />
          </div>
          <kbd>{i + 1}</kbd>
        </article>;
      })}</div>
    </section>}

    {tab === 'settings' && <section className={styles.settings}>
      <header><h2>AJUSTES</h2></header>
      <div className={styles.rows}>
        <button onClick={() => useDrop.setState({ quality: !quality })}><span>CALIDAD GRÁFICA</span><b>‹ {quality ? 'ÉPICA' : 'RENDIMIENTO'} ›</b></button>
        <button onClick={() => useDrop.setState({ muted: !muted })}><span>AUDIO</span><b>‹ {muted ? 'DESACTIVADO' : 'ACTIVADO'} ›</b></button>
        <label><span>SENSIBILIDAD DEL MOUSE</span><b>{sensitivity.toFixed(1)}</b><input type="range" min={.3} max={2.5} step={.1} value={sensitivity} onChange={e => useDrop.setState({ sensitivity: Number(e.target.value) })} /></label>
      </div>
      <h3>CONTROLES</h3>
      <div className={styles.keys}>{controls.map(([k, l]) => <div key={k}><kbd>{k}</kbd><span>{l}</span></div>)}</div>
      <p className={styles.career}>{career.matches} PARTIDAS · {career.wins} VICTORIAS · {career.kills} ELIMINACIONES</p>
    </section>}
  </div>;
}
