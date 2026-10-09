import { create } from 'zustand';
import { sfx } from './audio';

export const weapons = [
  { name: 'Pixel Blaster', short: 'PIXEL', damage: 26, interval: .3, ammo: 20, spread: .012, color: '#ffb35c', rate: 2, power: 2, range: 4 },
  { name: 'Code Rifle', short: 'RIFLE', damage: 13, interval: .11, ammo: 40, spread: .022, color: '#7fd8ff', rate: 5, power: 1, range: 3 },
  { name: 'Vector Cannon', short: 'VECTOR', damage: 65, interval: .9, ammo: 6, spread: 0, color: '#ff6a2b', rate: 1, power: 5, range: 3 },
  { name: 'Bug Destroyer', short: 'DESTROY', damage: 42, interval: .4, ammo: 16, spread: .008, color: '#ff4fa3', rate: 2, power: 4, range: 4 },
  { name: 'Render Beam', short: 'BEAM', damage: 8, interval: .065, ammo: 80, spread: .004, color: '#d6a5ff', rate: 5, power: 1, range: 5 },
];
export const abilities = [
  { name: 'DESIGN MODE', detail: 'Escudo de vectores · 5 s de inmunidad' },
  { name: 'CODE BOOST', detail: '+60% velocidad y cadencia · 6 s' },
  { name: 'AI SCAN', detail: 'Revela Bugs a través de muros · 4 s' },
  { name: 'DEPLOY', detail: 'Teletransporte táctico de 7 m' },
];
export const enemyKinds = ['GLITCH', 'CRAWLER', 'BRUTE', 'SPITTER'];
export const districts = ['MONOVA HQ', 'CODE DISTRICT', 'DESIGN LAB', 'AI CORE', 'BUG ZONE'];
export const spawns = [[0, 0], [-23, -22], [23, -22], [23, 22], [-23, 22]];
export const TOTAL_BUGS = 16;

type Phase = 'menu' | 'play' | 'pause' | 'win' | 'over';
type State = {
  phase: Phase; hp: number; shield: number; ammo: number; weapon: number; kills: number; time: number; radius: number; credits: number;
  unlocked: number[]; opened: number[]; ability: number; cooldown: number; reload: number; notice: string; noticeId: number; prompt: string; outside: boolean;
  feed: { id: number; text: string }[]; shots: number; hits: number; round: number; spawn: number; muted: boolean; quality: boolean; sensitivity: number;
  respawn: number; deaths: number; playerName: string; netStatus: string; lobby: { id: string; name: string; slot: number }[];
  start: () => void; notify: (text: string) => void; pushFeed: (text: string) => void;
};

let feedId = 0;
export const useDrop = create<State>((set) => ({
  phase: 'menu', hp: 100, shield: 100, ammo: 20, weapon: 0, kills: 0, time: 0, radius: 48, credits: 0, unlocked: [0], opened: [], ability: 0, cooldown: 0, reload: 0,
  notice: '', noticeId: 0, prompt: '', outside: false, feed: [], shots: 0, hits: 0, round: 0, spawn: 0, muted: false, quality: true, sensitivity: 1,
  respawn: 0, deaths: 0, playerName: '', netStatus: '', lobby: [],
  start: () => set(s => ({ phase: 'play', hp: 100, shield: 100, ammo: 20, weapon: 0, kills: 0, time: 0, radius: 48, credits: 0, unlocked: [0], opened: [], cooldown: 0, reload: 0,
    notice: 'CÁPSULA EN CAÍDA · PROTECCIÓN ACTIVA', noticeId: s.noticeId + 1, prompt: '', outside: false, feed: [], shots: 0, hits: 0, respawn: 0, deaths: 0, round: s.round + 1 })),
  notify: text => set(s => ({ notice: text, noticeId: s.noticeId + 1 })),
  pushFeed: text => set(s => ({ feed: [...s.feed.slice(-3), { id: ++feedId, text }] })),
}));
useDrop.subscribe((s, prev) => { if (s.muted !== prev.muted) sfx.setMuted(s.muted); });

/** Final grade shown on the results screen. */
export function grade(kills: number, accuracy: number, hp: number, won: boolean) {
  const score = kills / TOTAL_BUGS * 50 + accuracy * 30 + (won ? hp / 100 * 20 : 0);
  return score >= 85 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D';
}

/** Transient HUD events (hit markers, damage direction) that should not re-render React. */
export const hudBus = new EventTarget();
export const emitHud = (type: 'hit' | 'kill' | 'hurt', detail = 0) => hudBus.dispatchEvent(new CustomEvent(type, { detail }));
/** Live positions for the minimap, written by the engine and drawn by the HUD at display rate. */
export const radar = { x: 0, z: 0, yaw: 0, bugs: [] as { x: number; z: number; alive: boolean }[], mates: [] as { x: number; z: number; slot: number }[] };
