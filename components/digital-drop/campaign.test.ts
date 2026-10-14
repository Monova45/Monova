import { describe, expect, it } from 'vitest';
import { BOSS_DEFS, PORTALS, WORLD_HALF, bossDanger, bossDuration, bossUnlocked, campaignComplete, campaignEnemyPosition, createBosses, hurtBoss, stepBoss } from './campaign';

describe('expedition progression and boss combat', () => {
  it('locks Nexus until both guardians fall and requires all bosses for victory', () => {
    const bosses = createBosses();
    expect(bossUnlocked(2, bosses)).toBe(false);
    expect(hurtBoss(bosses[2], 100, false)).toBe(false);
    expect(bosses[2].hp).toBe(bosses[2].max);
    bosses[0].hp = 0; expect(bossUnlocked(2, bosses)).toBe(false);
    bosses[1].hp = 0; expect(bossUnlocked(2, bosses)).toBe(true);
    expect(campaignComplete(bosses)).toBe(false);
    bosses[2].hp = 0; expect(campaignComplete(bosses)).toBe(true);
    expect(campaignComplete([])).toBe(false);
  });
  it('always telegraphs before an attack and does not attack absent players', () => {
    const b = createBosses()[0], d = BOSS_DEFS[0];
    stepBoss(b, 20, [], true); expect(b.phase).toBe('dormant');
    const player = { x: d.x, z: d.z + 10, y: .75, alive: true };
    stepBoss(b, .1, [player], true); expect(b.phase).toBe('windup');
    expect(bossDanger(b, player)).toBe(false);
    stepBoss(b, bossDuration(b), [player], true); expect(b.phase).toBe('attack');
    stepBoss(b, bossDuration(b), [player], true); expect(b.phase).toBe('recover');
  });
  it('allows jumping waves and leaving meteor telegraphs', () => {
    const b = createBosses()[0], d = BOSS_DEFS[0]; b.phase = 'attack';
    expect(bossDanger(b, { x: d.x + 3, z: d.z, y: .75 })).toBe(true);
    expect(bossDanger(b, { x: d.x + 3, z: d.z, y: 1.8 })).toBe(false);
    const meteor = createBosses()[1]; meteor.phase = 'attack'; meteor.targets = [{ x: 10, z: 10 }];
    expect(bossDanger(meteor, { x: 10, z: 10, y: .75 })).toBe(true);
    expect(bossDanger(meteor, { x: 16, z: 10, y: .75 })).toBe(false);
  });
  it('rotates the beam hit volume and scales health for co-op', () => {
    const b = createBosses(3)[2], d = BOSS_DEFS[2]; b.phase = 'attack';
    expect(b.max).toBe(d.hp * 1.9);
    expect(bossDanger(b, { x: d.x, z: d.z + 20, y: .75 })).toBe(true);
    expect(bossDanger(b, { x: d.x + 10, z: d.z, y: .75 })).toBe(false);
    b.elapsed = Math.PI / 2 / .62;
    expect(bossDanger(b, { x: d.x + 20, z: d.z, y: .75 })).toBe(true);
  });
  it('awards a defeat only once and rejects invalid damage', () => {
    const b = createBosses()[0]; b.hp = 30;
    expect(hurtBoss(b, NaN, true)).toBe(false);
    expect(hurtBoss(b, -5, true)).toBe(false);
    expect(hurtBoss(b, 50, true)).toBe(true);
    expect(hurtBoss(b, 50, true)).toBe(false);
  });
  it('keeps destinations and enemy camps inside the expanded ground', () => {
    for (const p of PORTALS) expect(Math.max(Math.abs(p.toX), Math.abs(p.toZ))).toBeLessThan(WORLD_HALF - 10);
    for (let i = 0; i < 32; i++) expect(Math.max(...campaignEnemyPosition(i).map(Math.abs))).toBeLessThan(WORLD_HALF - 10);
  });
});
