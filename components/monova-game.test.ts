import { describe, expect, it } from "vitest";
import { MAX_LEVEL, createGame, newGame, startLevel, update } from "./monova-game";

const idle = { left: false, right: false, jump: false, down: false, throw: false };
function run(game: ReturnType<typeof createGame>, frames: number, input: (f: number) => Partial<typeof idle>) {
  for (let f = 0; f < frames; f++) update(game, { ...idle, ...input(f) });
}

describe("monova game", () => {
  it("starts a level, lands the player and lets them move", () => {
    const game = createGame(42);
    newGame(game);
    run(game, 120, () => ({}));
    expect(game.mode).toBe("play");
    expect(game.player.onGround).toBe(true);
    const x = game.player.x;
    run(game, 30, () => ({ right: true }));
    expect(game.player.x).toBeGreaterThan(x + 30);
  });

  it("jumps high enough to land on the first ledge tier", () => {
    const game = createGame(7);
    newGame(game);
    run(game, 101, () => ({}));
    game.enemies = [Object.assign(game.enemies[0], { kind: "ghost", x: 300, y: 30, phase: 0 })];
    game.player.invuln = 99999;
    const firstTier = game.ground - 40;
    const ledge = game.platforms.filter(p => p.y === firstTier).sort((a, b) => b.w - a.w)[0];
    game.player.x = ledge.x + ledge.w / 2 - 6;
    let peakLanding = false;
    run(game, 5, () => ({}));
    run(game, 80, f => ({ jump: f < 25 }));
    peakLanding = game.player.onGround && Math.abs(game.player.y + game.player.h - firstTier) < 1;
    expect(peakLanding).toBe(true);
  });

  it("shurikens defeat enemies and add score; clearing ends the level", () => {
    const game = createGame(3);
    newGame(game);
    run(game, 101, () => ({}));
    game.player.invuln = 99999;
    const enemy = game.enemies.find(e => e.kind === "pumpkin") ?? game.enemies[0];
    game.enemies = [enemy];
    Object.assign(enemy, { kind: "pumpkin", hp: 1, x: game.player.x + 60, y: game.player.y + game.player.h - 12, vx: 0, vy: 0, timer: 9999, onGround: true });
    run(game, 40, f => ({ throw: f % 4 < 2 }));
    expect(game.enemies.length).toBe(0);
    expect(game.score).toBeGreaterThanOrEqual(100);
    expect(game.mode).toBe("clear");
    run(game, 400, () => ({}));
    expect(game.level).toBe(2);
  });

  it("loses a life on enemy contact and ends after three", () => {
    const game = createGame(9);
    newGame(game);
    run(game, 101, () => ({}));
    for (let i = 0; i < 3; i++) {
      game.player.invuln = 0;
      const e = game.enemies[0];
      Object.assign(e, { kind: "zombie", stun: 0, x: game.player.x, y: game.player.y + 5, vy: 0 });
      run(game, 1, () => ({}));
      run(game, 100, () => ({}));
    }
    expect(game.lives).toBe(0);
    expect(game.mode).toBe("over");
  });

  it("has three levels and shows the win screen after the last one", () => {
    const game = createGame(11);
    newGame(game);
    expect(MAX_LEVEL).toBe(3);
    const heights: number[] = [];
    for (let level = 1; level <= MAX_LEVEL; level++) {
      run(game, 101, () => ({}));
      expect(game.level).toBe(level);
      heights.push(game.ground);
      game.enemies = [];
      run(game, 1, () => ({}));
      expect(game.mode).toBe("clear");
      run(game, 600, () => ({}));
    }
    expect(game.mode).toBe("win");
    expect(heights[1]).toBeGreaterThan(heights[0]);
    expect(heights[2]).toBeGreaterThan(heights[1]);
  });

  it("can climb from the ground to the top tier of every mountain", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const game = createGame(100 + level);
      game.level = level;
      startLevel(game);
      const tiers = [...new Set(game.platforms.filter(p => !p.ground).map(p => p.y))].sort((a, b) => b - a);
      // Each tier must sit within jump reach (~50px) of the one below.
      let prev = game.ground;
      for (const y of tiers) { expect(prev - y).toBeLessThanOrEqual(45); prev = y; }
    }
  });

  it("double jumps once per airtime with a second up press", () => {
    const heightOf = (presses: (f: number) => boolean) => {
      const game = createGame(21);
      newGame(game);
      run(game, 130, () => ({}));
      game.player.invuln = 99999;
      game.enemies = [Object.assign(game.enemies[0], { kind: "ghost", x: 300, y: 30, phase: 0 })];
      game.platforms = game.platforms.filter(p => p.ground);
      const startY = game.player.y;
      let minY = startY;
      run(game, 100, f => { minY = Math.min(minY, game.player.y); return { jump: presses(f) }; });
      return { rise: startY - minY, ready: game.player.doubleJump };
    };
    const single = heightOf(f => f < 12);
    const double = heightOf(f => f < 10 || (f >= 16 && f < 30));
    expect(double.rise).toBeGreaterThan(single.rise + 20);
    expect(double.ready).toBe(true);
  });

  it("stomping a monster with Monova's feet defeats it instead of hurting her", () => {
    for (const kind of ["zombie", "pumpkin", "ghost"] as const) {
      const game = createGame(31);
      newGame(game);
      run(game, 130, () => ({}));
      game.player.invuln = 0;
      const enemy = game.enemies[0];
      game.enemies = [enemy, Object.assign({ ...enemy }, { x: 300, y: 20, kind: "ghost", phase: 0 })];
      // Monova falls from just above the monster, feet slightly overlapping its top
      const h = kind === "zombie" ? 15 : 12;
      Object.assign(enemy, { kind, h, hp: kind === "zombie" ? 2 : 1, stun: 0, timer: 9999, phase: Math.PI / 2, x: game.player.x, y: game.ground - h, vx: 0, vy: 0, onGround: true });
      game.player.y = enemy.y - game.player.h - 1;
      game.player.vy = 2.5;
      game.player.onGround = false;
      const lives = game.lives;
      run(game, 2, () => ({}));
      expect(game.lives).toBe(lives);
      expect(game.enemies.includes(enemy)).toBe(false);
    }
  });
});
