// Co-op multiplayer over WebRTC (PeerJS). The room code maps to a well-known peer id: the first player to claim it
// becomes the host (authoritative for Bugs, kills and projectiles) and up to four more players connect to it directly.
import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { useDrop } from './state';

export const MAX_PLAYERS = 5;
export const DEFAULT_CODE = '4321';
export const slotColors = ['#ff8737', '#2fd4ff', '#b45cff', '#5dff9d', '#ffd23f'];

export type MatchMode = 'pvp' | 'coop';
export type LobbyPlayer = { id: string; name: string; slot: number };
export type PlayerSnapshot = { id: string; x: number; y: number; z: number; yaw: number; hp: number; alive: boolean; w: number };
export type Msg =
  | { t: 'hello'; name: string }
  | { t: 'full' }
  | { t: 'lobby'; players: LobbyPlayer[]; mode: MatchMode }
  | { t: 'start'; spawn: number; mode: MatchMode }
  | { t: 'state'; s: PlayerSnapshot }
  | { t: 'shot'; id: string; from: number[]; to: number[]; w: number }
  | { t: 'hit'; bug: number; dmg: number; by: string }
  | { t: 'bugs'; b: number[] }
  | { t: 'kill'; bug: number; by: string }
  | { t: 'orb'; p: number[]; v: number[] }
  | { t: 'end'; result: 'win' | 'over' }
  | { t: 'bye'; id: string }
  | { t: 'pvp'; target: string; dmg: number; by: string; x: number; z: number }
  | { t: 'down'; id: string; by: string }
  | { t: 'winner'; id: string };

/** Remote players, mutated in place by the network layer and read every frame by the renderer. */
export type Remote = PlayerSnapshot & { name: string; slot: number; seen: number; target: { x: number; y: number; z: number } };
export const remotes = new Map<string, Remote>();

let peer: Peer | undefined, host: DataConnection | undefined;
const clients = new Map<string, DataConnection>();
const listeners = new Set<(msg: Msg) => void>();
export const net = { mode: 'solo' as 'solo' | 'host' | 'client', id: '' };

const roomId = (code: string) => `monova-digital-drop-v1-${code.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
const status = (netStatus: string) => useDrop.setState({ netStatus });
export const onNet = (fn: (msg: Msg) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** Host → everyone, client → host. Hosts also relay player-originated messages to the other clients. */
export function send(msg: Msg) {
  if (net.mode === 'host') clients.forEach(c => c.open && c.send(msg));
  else if (net.mode === 'client' && host?.open) host.send(msg);
}

function lobby() {
  const players: LobbyPlayer[] = [{ id: net.id, name: useDrop.getState().playerName, slot: 0 }];
  clients.forEach((c, id) => { const r = remotes.get(id); if (r) players.push({ id, name: r.name, slot: r.slot }); });
  return players.sort((a, b) => a.slot - b.slot);
}

function applyLobby(players: LobbyPlayer[]) {
  useDrop.setState({ lobby: players });
  const ids = new Set(players.map(p => p.id));
  remotes.forEach((_, id) => { if (!ids.has(id)) remotes.delete(id); });
  players.forEach(p => {
    if (p.id === net.id) return;
    const r = remotes.get(p.id);
    if (r) { r.name = p.name; r.slot = p.slot; }
    else remotes.set(p.id, { id: p.id, name: p.name, slot: p.slot, x: 0, y: -50, z: 0, yaw: 0, hp: 100, alive: true, w: 0, seen: 0, target: { x: 0, y: -50, z: 0 } });
  });
}

function receive(msg: Msg, from?: string) {
  if (msg.t === 'lobby') { applyLobby(msg.players); useDrop.setState({ matchMode: msg.mode ?? 'pvp' }); }
  if (msg.t === 'state') {
    const r = remotes.get(msg.s.id);
    if (r) { Object.assign(r, { yaw: msg.s.yaw, hp: msg.s.hp, alive: msg.s.alive, w: msg.s.w, seen: performance.now() }); r.target = { x: msg.s.x, y: msg.s.y, z: msg.s.z }; if (r.y < -40) { r.x = msg.s.x; r.y = msg.s.y; r.z = msg.s.z; } }
  }
  if (net.mode === 'host' && from && (msg.t === 'state' || msg.t === 'shot' || msg.t === 'pvp' || msg.t === 'down')) clients.forEach((c, id) => id !== from && c.open && c.send(msg));
  listeners.forEach(fn => fn(msg));
}

function hostConnection(conn: DataConnection) {
  conn.on('data', raw => {
    const msg = raw as Msg;
    if (msg.t === 'hello') {
      if (clients.size >= MAX_PLAYERS - 1 || useDrop.getState().phase !== 'menu') { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
      const used = new Set([0, ...[...remotes.values()].map(r => r.slot)]);
      const slot = [1, 2, 3, 4].find(n => !used.has(n)) ?? 4;
      clients.set(conn.peer, conn);
      remotes.set(conn.peer, { id: conn.peer, name: msg.name.slice(0, 14) || `AGENTE ${slot + 1}`, slot, x: 0, y: -50, z: 0, yaw: 0, hp: 100, alive: true, w: 0, seen: 0, target: { x: 0, y: -50, z: 0 } });
      const players = lobby(); applyLobby(players); send({ t: 'lobby', players, mode: useDrop.getState().matchMode });
      useDrop.getState().pushFeed(`${msg.name.toUpperCase()} SE UNIÓ`);
      return;
    }
    receive(msg, conn.peer);
  });
  const drop = () => {
    if (!clients.has(conn.peer)) return;
    const name = remotes.get(conn.peer)?.name ?? 'AGENTE';
    clients.delete(conn.peer); remotes.delete(conn.peer);
    const players = lobby(); applyLobby(players); send({ t: 'lobby', players, mode: useDrop.getState().matchMode }); send({ t: 'bye', id: conn.peer });
    useDrop.getState().pushFeed(`${name.toUpperCase()} SALIÓ`);
  };
  conn.on('close', drop); conn.on('error', drop);
}

async function createPeer(id?: string) {
  const { default: PeerClass } = await import('peerjs');
  return new Promise<Peer>((resolve, reject) => {
    const p = id ? new PeerClass(id, { debug: 0 }) : new PeerClass({ debug: 0 });
    const onError = (err: unknown) => { p.destroy(); reject(err); };
    p.once('open', () => { p.off('error', onError); resolve(p); });
    p.once('error', onError);
  });
}

function becomeClient(p: Peer, code: string, name: string) {
  return new Promise<void>((resolve, reject) => {
    const conn = p.connect(roomId(code), { reliable: true });
    const timer = setTimeout(() => reject(new Error('timeout')), 6000);
    const fail = (err: unknown) => { clearTimeout(timer); reject(err); };
    p.once('error', fail);
    conn.once('open', () => {
      p.off('error', fail); clearTimeout(timer);
      host = conn; net.mode = 'client'; net.id = p.id;
      conn.send({ t: 'hello', name } satisfies Msg);
      conn.on('data', raw => {
        const msg = raw as Msg;
        if (msg.t === 'full') { status('SALA LLENA O PARTIDA EN CURSO'); leaveRoom(false); return; }
        if (msg.t === 'bye') remotes.delete(msg.id);
        receive(msg);
      });
      conn.on('close', () => {
        if (net.mode !== 'client') return;
        leaveRoom(false); status('EL ANFITRIÓN SE DESCONECTÓ');
        const s = useDrop.getState(); if (s.phase !== 'menu') { useDrop.setState({ phase: 'menu' }); s.notify('ANFITRIÓN DESCONECTADO'); }
      });
      resolve();
    });
  });
}

export async function joinRoom(code: string, name: string) {
  leaveRoom(false);
  status('CONECTANDO…');
  try {
    // Try to join an existing host first; if nobody holds the room id, claim it and host.
    const p = await createPeer(); peer = p;
    try { await becomeClient(p, code, name); status(`CONECTADO · SALA ${code}`); return; }
    catch { p.destroy(); }
    const h = await createPeer(roomId(code)); peer = h;
    net.mode = 'host'; net.id = h.id;
    h.on('connection', hostConnection);
    applyLobby(lobby());
    status(`ANFITRIÓN · SALA ${code}`);
  } catch (err) {
    const type = (err as { type?: string }).type;
    if (type === 'unavailable-id') return joinRoom(code, name);
    leaveRoom(false); status(type === 'network' || type === 'server-error' ? 'SIN CONEXIÓN AL SERVIDOR DE SALAS' : 'NO SE PUDO CONECTAR');
  }
}

/** Host-only: switch between battle royale and co-op and tell the lobby. */
export function setMatchMode(mode: MatchMode) {
  useDrop.setState({ matchMode: mode });
  if (net.mode === 'host') send({ t: 'lobby', players: lobby(), mode });
}

export function leaveRoom(reset = true) {
  clients.forEach(c => c.close()); clients.clear(); host?.close(); host = undefined;
  peer?.destroy(); peer = undefined; remotes.clear();
  net.mode = 'solo'; net.id = '';
  useDrop.setState({ lobby: [], ...(reset ? { netStatus: '' } : {}) });
}

if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => leaveRoom());
