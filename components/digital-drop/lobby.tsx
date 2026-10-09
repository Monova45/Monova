"use client";
import { useState } from 'react';
import { sfx } from './audio';
import { districts, useDrop } from './state';
import { MAX_PLAYERS, leaveRoom, net, setMatchMode, slotColors } from './net';
import styles from './game.module.css';

const modes = [
  { id: 'pvp', label: 'BATALLA', detail: 'Todos contra todos. Cada uno cae en un distrito distinto, sin Bugs. El último en pie gana.', tag: 'PVP · 2+ JUGADORES' },
  { id: 'coop', label: 'CO-OP', detail: 'Equipo contra la infección. 16 Bugs más duros según el tamaño del equipo. Reaparición a los 6 s.', tag: 'PVE · EQUIPO' },
] as const;

/** Full-screen room view shown while connected and waiting in the menu. */
export function Lobby({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  const lobby = useDrop(s => s.lobby), matchMode = useDrop(s => s.matchMode), spawn = useDrop(s => s.spawn);
  const [copied, setCopied] = useState('');
  const isHost = net.mode === 'host', host = lobby.find(p => p.slot === 0);
  const code = useDrop(s => s.roomCode);
  const copy = (text: string, what: string) => { void navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(''), 1800); }); };
  const canBattle = lobby.length > 1;

  return <div className={styles.lobby}>
    <div className={styles.lobbyTop}>
      <div>
        <p className={styles.eyebrow}>SALA PRIVADA · {isHost ? 'ERES EL ANFITRIÓN' : `ANFITRIÓN: ${host?.name || 'AGENTE'}`}</p>
        <div className={styles.roomCode}>{code.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * .06}s` }}>{c}</span>)}</div>
      </div>
      <div className={styles.lobbyShare}>
        <button onClick={() => copy(code, 'code')}>{copied === 'code' ? '✓ COPIADO' : 'COPIAR CÓDIGO'}</button>
        <button onClick={() => copy(`${location.origin}/3d?sala=${encodeURIComponent(code)}`, 'link')}>{copied === 'link' ? '✓ COPIADO' : 'COPIAR ENLACE'}</button>
        <button className={styles.ghost} onClick={() => { sfx.ui(); leaveRoom(); }}>SALIR</button>
      </div>
    </div>

    <div className={styles.slots5}>{Array.from({ length: MAX_PLAYERS }, (_, i) => {
      const p = lobby.find(x => x.slot === i), me = p?.id === net.id;
      return <div key={i} className={styles.playerCard} data-empty={!p} data-me={me} style={{ '--c': slotColors[i], animationDelay: `${i * .07}s` } as React.CSSProperties}>
        <small>P{i + 1}{i === 0 ? ' · ANFITRIÓN' : ''}</small>
        <div className={styles.avatar}><i /></div>
        <strong>{p ? p.name || 'AGENTE' : 'ESPERANDO…'}</strong>
        <em>{p ? (me ? 'TÚ' : 'LISTO') : 'LIBRE'}</em>
        {matchMode === 'pvp' && p && <span>CAE EN {districts[i % districts.length]}</span>}
      </div>;
    })}</div>

    <div className={styles.lobbyBottom}>
      <div className={styles.modeCards}>{modes.map(m => <button key={m.id} data-active={matchMode === m.id} disabled={!isHost} onClick={() => { sfx.ui(); setMatchMode(m.id); }}>
        <small>{m.tag}</small><b>{m.label}</b><p>{m.detail}</p>
      </button>)}</div>
      <div className={styles.lobbyStart}>
        {isHost ? <>
          <button className={styles.primary} disabled={!ready} onClick={onStart}>INICIAR · {lobby.length} JUGADOR{lobby.length > 1 ? 'ES' : ''} <b>↗</b></button>
          <small>{matchMode === 'pvp' && !canBattle ? 'BATALLA NECESITA 2 JUGADORES · AHORA SE JUGARÁ CO-OP' : matchMode === 'coop' ? `ATERRIZAJE: ${districts[spawn]}` : `DE 2 A ${MAX_PLAYERS} JUGADORES · INICIA CUANDO QUIERAS`}</small>
        </> : <p className={styles.waitHost}><i />ESPERANDO A QUE {(host?.name || 'EL ANFITRIÓN').toUpperCase()} INICIE LA PARTIDA</p>}
      </div>
    </div>
  </div>;
}
