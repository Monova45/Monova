/** Shared world coordinates and deterministic campaign rules (rendering-independent). */
export const WORLD_HALF = 180;
export const WORLD_RADIUS = Math.hypot(WORLD_HALF, WORLD_HALF);
export const BOSS_DEFS = [
  { id: 'forge', name: 'TITÁN DE LA FORJA', region: 'FORJA SOLAR', x: -112, z: -104, hp: 1050, color: '#ff763c', attack: 'wave', reward: 800, weapon: 3, hint: 'SALTA SOBRE LA ONDA', entry: [-112, -72] },
  { id: 'archive', name: 'ORÁCULO DE CRISTAL', region: 'VALLE DE CRISTAL', x: 112, z: -104, hp: 1350, color: '#5be8ed', attack: 'meteor', reward: 1000, weapon: 2, hint: 'SAL DE LOS CÍRCULOS', entry: [112, -72] },
  { id: 'nexus', name: 'NEXUS · EL DEVORADOR', region: 'CIUDADELA NEXUS', x: 0, z: 132, hp: 2100, color: '#b18aff', attack: 'beam', reward: 1800, weapon: 4, hint: 'ESQUIVA EL HAZ GIRATORIO', entry: [0, 96] },
] as const;
export const PORTALS = BOSS_DEFS.flatMap((boss, i) => [
  { x: (i - 1) * 8, z: -8, toX: boss.entry[0], toZ: boss.entry[1], label: boss.region, color: boss.color, boss: i },
  { x: boss.entry[0] + 8, z: boss.entry[1], toX: (i - 1) * 8, toZ: -3, label: 'MONOVA HQ', color: boss.color, boss: -1 },
]);
export const OUTPOSTS = BOSS_DEFS.map(b => ({ x: b.entry[0], z: b.entry[1] + 8, name: b.region, color: b.color }));
export const SUPPLIES = [
  { x: 3, z: 0, weapon: 0 }, { x: -20, z: -22, weapon: 1 },
  { x: 26, z: -22, weapon: 2 }, { x: 26, z: 22, weapon: 3 }, { x: -20, z: 22, weapon: 4 },
  { x: -106, z: -68, weapon: 1 }, { x: 118, z: -68, weapon: 3 }, { x: 6, z: 104, weapon: 2 },
];
export type BossPhase = 'dormant' | 'windup' | 'attack' | 'recover' | 'defeated';
export type BossRuntime = {
  id: number; hp: number; max: number; phase: BossPhase; elapsed: number;
  serial: number; aim: number; targets: { x: number; z: number }[];
};
export type AgentPosition = { x: number; y: number; z: number; alive: boolean };
export function createBosses(players = 1): BossRuntime[] {
  const scale = 1 + .45 * Math.max(0, players - 1);
  return BOSS_DEFS.map((b, id) => ({ id, hp: b.hp * scale, max: b.hp * scale, phase: 'dormant', elapsed: 0, serial: 0, aim: 0, targets: [] }));
}
export const bossUnlocked = (id: number, bosses: BossRuntime[]) => id < 2 || bosses.slice(0, 2).every(b => b.hp <= 0);
export const campaignComplete = (bosses: BossRuntime[]) => bosses.length === BOSS_DEFS.length && bosses.every(b => b.hp <= 0);
export const enraged = (b: BossRuntime) => b.hp > 0 && b.hp <= b.max * .45;
export function bossDuration(b: BossRuntime) {
  if (b.phase === 'windup') return BOSS_DEFS[b.id].attack === 'meteor' ? 2.3 : 1.8;
  if (b.phase === 'attack') return BOSS_DEFS[b.id].attack === 'meteor' ? .75 : BOSS_DEFS[b.id].attack === 'beam' ? 3.5 : 2.5;
  return enraged(b) ? 1.6 : 3.2;
}
/** Returns true once per transition; the host is the only writer in co-op. */
export function stepBoss(b: BossRuntime, dt: number, players: AgentPosition[], unlocked: boolean) {
  if (b.hp <= 0) { b.phase = 'defeated'; return false; }
  if (!unlocked) return false;
  const def = BOSS_DEFS[b.id];
  const nearest = players.filter(p => p.alive && Math.hypot(p.x - def.x, p.z - def.z) < 48)
    .sort((a, c) => Math.hypot(a.x - def.x, a.z - def.z) - Math.hypot(c.x - def.x, c.z - def.z))[0];
  if (!nearest) { b.phase = 'dormant'; b.elapsed = 0; return false; }
  b.elapsed += Math.max(0, dt);
  if (b.phase === 'dormant' || b.elapsed >= bossDuration(b)) {
    b.phase = b.phase === 'windup' ? 'attack' : b.phase === 'attack' ? 'recover' : 'windup';
    b.elapsed = 0;
    if (b.phase === 'windup') {
      b.serial++;
      b.aim = Math.atan2(nearest.x - def.x, nearest.z - def.z);
      const spread = enraged(b) ? 5 : 7;
      b.targets = [{ x: nearest.x, z: nearest.z }, { x: nearest.x - spread, z: nearest.z + 3 }, { x: nearest.x + spread, z: nearest.z - 3 }];
      if (enraged(b)) b.targets.push({ x: nearest.x, z: nearest.z + spread });
    }
    return true;
  }
  return false;
}
export function hurtBoss(b: BossRuntime, amount: number, unlocked: boolean) {
  if (!unlocked || b.hp <= 0 || !Number.isFinite(amount) || amount <= 0) return false;
  b.hp = Math.max(0, b.hp - Math.min(amount, 150));
  if (b.hp === 0) { b.phase = 'defeated'; b.elapsed = 0; return true; }
  return false;
}
/** Hazard hit volumes match the warning geometry. Ground waves can be jumped. */
export function bossDanger(b: BossRuntime, p: Pick<AgentPosition, 'x' | 'y' | 'z'>) {
  if (b.phase !== 'attack' || b.hp <= 0) return false;
  const d = BOSS_DEFS[b.id], dx = p.x - d.x, dz = p.z - d.z;
  if (d.attack === 'wave') return p.y < 1.45 && Math.abs(Math.hypot(dx, dz) - (3 + b.elapsed / bossDuration(b) * 34)) < 1.6;
  if (d.attack === 'meteor') return b.targets.some(t => Math.hypot(p.x - t.x, p.z - t.z) < 4.8);
  const angle = b.aim + b.elapsed * (enraged(b) ? 1 : .62);
  const along = dx * Math.sin(angle) + dz * Math.cos(angle), across = dx * Math.cos(angle) - dz * Math.sin(angle);
  return p.y < 2.2 && along > 3 && along < 42 && Math.abs(across) < 1.5;
}
export function campaignEnemyPosition(i: number): [number, number] {
  if (i < 8) { const angle = i * Math.PI / 4; return [Math.cos(angle) * 38, Math.sin(angle) * 38]; }
  const boss = BOSS_DEFS[Math.floor((i - 8) / 8) % 3], angle = i * 2.4;
  return [boss.x + Math.cos(angle) * 25, boss.z + Math.sin(angle) * 25];
}
