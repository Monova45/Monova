"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import NextImage from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
import styles from "./monova-game.module.css";

// Ninja-Kun style arcade: climb a stepped mountain, jump between ledges and
// clear every Halloween monster with shurikens (or by stomping on them).

const W = 320;
// View height in game pixels. 240 gives the classic 4:3 screen; in phone portrait
// play the view grows taller (the mountain scrolls vertically) to fill the screen.
let H = 240;
const BASE_H = 240;
export function setViewHeight(height: number) { H = Math.round(Math.max(BASE_H, Math.min(460, height))); }
const TIER_GAP = 38;

// Three hand-tuned levels: each mountain is taller, with its own rock colour
// (never orange, so Monova always stands out) and a few more monsters.
type Rock = { base: string; face: string; shade: string; top: string; shine: string };
const LEVELS: { height: number; enemies: number; time: number; ghosts: boolean; rock: Rock }[] = [
  { height: 480, enemies: 7, time: 150, ghosts: false, rock: { base: "#55627f", face: "#7484a8", shade: "#343d55", top: "#c3cee8", shine: "#eef3ff" } },
  { height: 640, enemies: 10, time: 180, ghosts: true, rock: { base: "#3d6b66", face: "#55908a", shade: "#243f3c", top: "#a6dcc6", shine: "#e6fff4" } },
  { height: 800, enemies: 13, time: 210, ghosts: true, rock: { base: "#57407a", face: "#7559a0", shade: "#33244b", top: "#c7b2ee", shine: "#f3ebff" } },
];
export const MAX_LEVEL = LEVELS.length;
const GRAVITY = 0.22;
const STEP = 1000 / 60;
const SCALE = 2; // render at 2x so text stays crisp while sprites stay pixelated

type Input = { left: boolean; right: boolean; jump: boolean; down: boolean; throw: boolean };
type Platform = { x: number; y: number; w: number; ground?: boolean };
type Body = { x: number; y: number; w: number; h: number; vx: number; vy: number; onGround: boolean; drop: number };
type EnemyKind = "zombie" | "pumpkin" | "ghost";
type Enemy = Body & { kind: EnemyKind; hp: number; dir: number; timer: number; stun: number; flash: number; phase: number };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; hostile: boolean; spin: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Popup = { x: number; y: number; text: string; life: number };
type Mode = "title" | "intro" | "play" | "paused" | "dead" | "over" | "clear" | "win";

type Game = {
  mode: Mode; modeTimer: number; level: number; score: number; hi: number; lives: number; time: number;
  player: Body & { dir: number; invuln: number; cooldown: number; anim: number; jumpHeld: boolean; throwHeld: boolean; jumpBuffer: number; doubleJump: boolean };
  platforms: Platform[]; enemies: Enemy[]; shots: Shot[]; particles: Particle[]; popups: Popup[];
  tick: number; seed: number; ground: number; camY: number;
};

const PALETTE: Record<string, string> = {
  o: "#ff8a2a", d: "#c4520c", w: "#f7f3ea", k: "#17110d", p: "#ff9fb0", g: "#9aa3ad", O: "#ff5106",
  z: "#7fbf5a", Z: "#4d7d36", b: "#4a5d8a", n: "#5b3f2c", r: "#c92a2a", G: "#2f8a3a", y: "#ffd23f",
};

const CAT = [
  "...k.......k....",
  "..kok.....kok...",
  "..kowwwwwwwok...",
  ".gkoooooooookg..",
  ".gwoooooooooowg.",
  ".gwookooookoowg.",
  ".gwoooopooooowg.",
  "..kooowkwoooook.",
  "...kooooooook...",
  "....kkkkkkkk....",
  "...kwkkwwkkwk...",
  "..okkkwwwwkkko..",
  "..okkwkwwkwkko..",
  "....kkwkkwkk..o.",
  "....kk....kk.o..",
  "...ooo....ooo...",
];
const CAT_WALK = [...CAT.slice(0, 14), ".....kk..kk...o.", "....ooo..ooo...."];
const CAT_JUMP = [...CAT.slice(0, 13), "...kkwkkwkkk..o.", "...ookk..kkoo.o.", "................"];

const ZOMBIE = [
  "....ZZZZZ.......",
  "...ZzzzzzZ......",
  "...ZzkzzkZ......",
  "...ZzzzzzZ......",
  "...ZzrrrzZ......",
  "....ZzzzZ.......",
  "..bbbbbbbbzz....",
  ".bbbbbbbbbzzz...",
  ".bbbbbbbb.......",
  "..bbbbbbb.......",
  "..nnnnnnn.......",
  "..nnn.nnn.......",
  "..nnn.nnn.......",
  "..nn...nn.......",
  ".ZZZ...ZZZ......",
  "................",
];
const ZOMBIE_WALK = [...ZOMBIE.slice(0, 11), "..nnn..nnn......", "...nn..nnn......", "...nn...nn......", "..ZZZ...ZZZ.....", "................"];

const PUMPKIN = [
  "......GGG.......",
  ".......G........",
  "...ddoooooodd...",
  "..dooooooooood..",
  ".dooykooooykood.",
  ".dookkkooookkkod",
  ".doooooykooooood",
  ".dooooooooooood.",
  ".doykooooooykod.",
  ".dookkkkkkkkood.",
  "..dooookkoooood.",
  "...dddoooooddd..",
  "......dddd......",
  "................",
];

const GHOST = [
  ".....wwwwww.....",
  "...wwwwwwwwww...",
  "..wwwwwwwwwwww..",
  ".wwwkkwwwwkkwww.",
  ".wwwkkwwwwkkwww.",
  ".wwwwwwwwwwwwww.",
  ".wwwwwkkkkwwwww.",
  ".wwwwwkkkkwwwww.",
  ".wwwwwwwwwwwwww.",
  ".wwwwwwwwwwwwww.",
  ".wwwwwwwwwwwwww.",
  ".ww.www..www.ww.",
  ".w...w....w...w.",
  "................",
];

function makeSprite(rows: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d")!;
  rows.forEach((row, y) => row.padEnd(16, ".").slice(0, 16).split("").forEach((cell, x) => {
    if (cell === ".") return;
    ctx.fillStyle = PALETTE[cell] ?? "#f0f";
    ctx.fillRect(x, y, 1, 1);
  }));
  return canvas;
}

function random(game: Game) {
  game.seed = (game.seed * 1664525 + 1013904223) % 4294967296;
  return game.seed / 4294967296;
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function levelConfig(game: Game) {
  return LEVELS[Math.min(game.level, MAX_LEVEL) - 1];
}

// A tall stepped mountain of ledges, narrower toward the top, with random gaps.
function buildLevel(game: Game) {
  const config = levelConfig(game);
  game.ground = config.height - 16;
  const platforms: Platform[] = [{ x: 0, y: game.ground, w: W, ground: true }];
  const tiers = Math.floor((game.ground - 40) / TIER_GAP);
  for (let index = 0; index < tiers; index++) {
    const y = game.ground - 40 - index * TIER_GAP;
    const span = Math.max(70, W - 24 - index * ((W - 110) / tiers));
    const start = (W - span) / 2 + (random(game) - 0.5) * 30;
    let x = start;
    while (x < start + span - 30) {
      const w = Math.min(44 + random(game) * 56, start + span - x);
      platforms.push({ x: Math.round(Math.max(0, x)), y, w: Math.round(w) });
      x += w + 20 + random(game) * 16;
    }
  }
  game.platforms = platforms;
  game.camY = game.ground + 16 - H;
}

function spawnEnemies(game: Game) {
  const config = levelConfig(game);
  // Keep the start area calm: skip the lowest ledges near the spawn point.
  const ledges = game.platforms.filter(p => !p.ground && !(p.y > game.ground - 60 && p.x < 80));
  const step = ledges.length / config.enemies;
  game.enemies = Array.from({ length: config.enemies }, (_, index) => {
    const roll = random(game);
    const kind: EnemyKind = config.ghosts && roll < 0.22 ? "ghost" : roll < 0.62 ? "zombie" : "pumpkin";
    const ledge = kind === "ghost" ? null : ledges[Math.floor(index * step + random(game) * step) % ledges.length];
    const x = ledge ? ledge.x + 4 + random(game) * Math.max(1, ledge.w - 20) : 20 + random(game) * (W - 40);
    const y = ledge ? ledge.y - 16 : 30 + random(game) * (game.ground - 140);
    return { kind, x, y, w: 12, h: kind === "zombie" ? 15 : 12, vx: 0, vy: 0, onGround: false, drop: 0,
      hp: kind === "zombie" ? 2 : 1, dir: random(game) < 0.5 ? -1 : 1, timer: 60 + random(game) * 90, stun: 0, flash: 0, phase: random(game) * Math.PI * 2 };
  });
}

function resetPlayer(game: Game) {
  Object.assign(game.player, { x: 20, y: game.ground - 23, vx: 0, vy: 0, dir: 1, onGround: true, drop: 0, invuln: 120, cooldown: 0 });
}

export function startLevel(game: Game) {
  buildLevel(game);
  spawnEnemies(game);
  resetPlayer(game);
  game.shots = [];
  game.time = levelConfig(game).time * 60;
  game.mode = "intro";
  game.modeTimer = 100;
}

export function createGame(seed: number, hi = 0): Game {
  const game: Game = {
    mode: "title", modeTimer: 0, level: 1, score: 0, hi, lives: 3, time: LEVELS[0].time * 60,
    player: { x: 20, y: LEVELS[0].height - 39, w: 13, h: 22, vx: 0, vy: 0, onGround: true, drop: 0, dir: 1, invuln: 0, cooldown: 0, anim: 0, jumpHeld: false, throwHeld: false, jumpBuffer: 0, doubleJump: true },
    platforms: [], enemies: [], shots: [], particles: [], popups: [], tick: 0, seed, ground: LEVELS[0].height - 16, camY: 0,
  };
  buildLevel(game);
  return game;
}

export function newGame(game: Game) {
  game.level = 1;
  game.score = 0;
  game.lives = 3;
  startLevel(game);
}

// Moves a body and lands it on one-way ledges from above.
function physics(body: Body, platforms: Platform[]) {
  const prevBottom = body.y + body.h;
  body.vy = Math.min(body.vy + GRAVITY, 5);
  body.x += body.vx;
  body.y += body.vy;
  body.x = Math.max(0, Math.min(W - body.w, body.x));
  body.onGround = false;
  if (body.drop > 0) body.drop--;
  if (body.vy < 0) return;
  for (const p of platforms) {
    if (body.drop > 0 && !p.ground) continue;
    const bottom = body.y + body.h;
    if (prevBottom <= p.y + 0.5 && bottom >= p.y && body.x + body.w > p.x + 2 && body.x < p.x + p.w - 2) {
      body.y = p.y - body.h;
      body.vy = 0;
      body.onGround = true;
      return;
    }
  }
}

function ledgeUnder(body: Body, platforms: Platform[]) {
  return platforms.find(p => Math.abs(body.y + body.h - p.y) < 1 && body.x + body.w > p.x && body.x < p.x + p.w);
}

function burst(game: Game, x: number, y: number, colors: string[], amount = 14) {
  for (let i = 0; i < amount; i++) {
    const angle = random(game) * Math.PI * 2;
    const speed = 0.6 + random(game) * 2.2;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.8, life: 30 + random(game) * 20, color: colors[i % colors.length] });
  }
}

function addScore(game: Game, points: number, x: number, y: number) {
  game.score += points;
  game.popups.push({ x, y, text: String(points), life: 50 });
  if (game.score > game.hi) {
    game.hi = game.score;
    try { localStorage.setItem("monova-game-hi", String(game.hi)); } catch {}
  }
}

function killEnemy(game: Game, enemy: Enemy, points: number) {
  enemy.hp = 0;
  const colors = enemy.kind === "zombie" ? ["#7fbf5a", "#4a5d8a", "#fff"] : enemy.kind === "pumpkin" ? ["#ff8a2a", "#ffd23f", "#c4520c"] : ["#f7f3ea", "#c9d6ff", "#fff"];
  burst(game, enemy.x + 6, enemy.y + 6, colors);
  addScore(game, points, enemy.x, enemy.y - 4);
}

function hurtPlayer(game: Game) {
  const player = game.player;
  if (player.invuln > 0 || game.mode !== "play") return;
  burst(game, player.x + 6, player.y + 8, ["#ff8a2a", "#17110d", "#f7f3ea"], 22);
  game.lives--;
  game.mode = game.lives <= 0 ? "over" : "dead";
  game.modeTimer = game.lives <= 0 ? 0 : 90;
}

export function update(game: Game, input: Input) {
  game.tick++;
  game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; return --p.life > 0; });
  game.popups = game.popups.filter(p => { p.y -= 0.4; return --p.life > 0; });
  const camTarget = Math.max(0, Math.min(game.ground + 16 - H, game.player.y + game.player.h / 2 - H * 0.58));
  game.camY += (camTarget - game.camY) * 0.12;

  if (game.mode === "title" || game.mode === "over" || game.mode === "paused" || game.mode === "win") return;
  if (game.mode === "intro") { if (--game.modeTimer <= 0) game.mode = "play"; return; }
  if (game.mode === "dead") { if (--game.modeTimer <= 0) { resetPlayer(game); game.shots = []; game.mode = "play"; } return; }
  if (game.mode === "clear") {
    if (game.time > 0) { const chunk = Math.min(game.time, 120); game.time -= chunk; addScoreSilently(game, Math.ceil(chunk / 60) * 10); }
    else if (--game.modeTimer <= 0) { if (game.level >= MAX_LEVEL) game.mode = "win"; else { game.level++; startLevel(game); } }
    return;
  }

  const player = game.player;
  if (--game.time <= 0) { hurtPlayer(game); game.time = levelConfig(game).time * 60; return; }

  // Player movement
  const speed = 1.7;
  player.vx = input.left === input.right ? 0 : input.left ? -speed : speed;
  if (player.vx) player.dir = Math.sign(player.vx);
  // Buffer the press briefly so a jump pressed just before landing still fires.
  // A second press while airborne triggers one double jump until Monova lands again.
  const pressed = input.jump && !player.jumpHeld;
  if (pressed && !player.onGround && player.doubleJump && player.vy > -3) {
    player.vy = -4.3;
    player.doubleJump = false;
    player.jumpBuffer = 0;
    burst(game, player.x + player.w / 2, player.y + player.h, ["#ffd23f", "#fff", "#ff8a2a"], 8);
  } else if (pressed) player.jumpBuffer = 8;
  else if (player.jumpBuffer > 0) player.jumpBuffer--;
  if (player.jumpBuffer > 0 && player.onGround) { player.vy = -4.7; player.jumpBuffer = 0; }
  if (!input.jump && player.vy < -1.6) player.vy = -1.6;
  if (input.down && player.onGround && !ledgeUnder(player, game.platforms)?.ground) player.drop = 14;
  player.jumpHeld = input.jump;
  physics(player, game.platforms);
  if (player.onGround) player.doubleJump = true;
  player.anim += player.vx ? 1 : 0;
  if (player.invuln > 0) player.invuln--;
  if (player.cooldown > 0) player.cooldown--;
  if (input.throw && !player.throwHeld && player.cooldown === 0 && game.shots.filter(s => !s.hostile).length < 3) {
    game.shots.push({ x: player.x + (player.dir > 0 ? 14 : -4), y: player.y + 11, vx: player.dir * 4.2, vy: 0, life: 70, hostile: false, spin: 0 });
    player.cooldown = 14;
  }
  player.throwHeld = input.throw;

  // Enemies
  const pace = 0.32 + game.level * 0.05;
  for (const enemy of game.enemies) {
    if (enemy.flash > 0) enemy.flash--;
    if (enemy.stun > 0) { enemy.stun--; enemy.vx = 0; physics(enemy, game.platforms); continue; }
    if (enemy.kind === "zombie") {
      const ledge = ledgeUnder(enemy, game.platforms);
      enemy.vx = enemy.dir * pace;
      if (ledge && !ledge.ground && (enemy.x + enemy.vx < ledge.x || enemy.x + enemy.w + enemy.vx > ledge.x + ledge.w)) enemy.dir *= -1;
      if (enemy.x <= 0 || enemy.x >= W - enemy.w) enemy.dir *= -1;
      enemy.vx = enemy.dir * pace;
      physics(enemy, game.platforms);
      if (game.level >= 2 && --enemy.timer <= 0) {
        enemy.timer = 150 + random(game) * 150;
        if (Math.abs(enemy.y - player.y) < 30) {
          const dir = player.x > enemy.x ? 1 : -1;
          enemy.dir = dir;
          game.shots.push({ x: enemy.x + 6, y: enemy.y + 5, vx: dir * 2.2, vy: -1.2, life: 120, hostile: true, spin: 0 });
        }
      }
    } else if (enemy.kind === "pumpkin") {
      if (enemy.onGround) {
        enemy.vx = 0;
        if (--enemy.timer <= 0) {
          enemy.timer = 50 + random(game) * 70;
          enemy.dir = player.x > enemy.x ? 1 : -1;
          enemy.vy = -3.3 - random(game) * 1.2;
          enemy.vx = enemy.dir * (0.8 + game.level * 0.1);
        }
      }
      physics(enemy, game.platforms);
    } else {
      enemy.phase += 0.04;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      enemy.vx = (dx / dist) * (0.2 + game.level * 0.03);
      enemy.vy = (dy / dist) * (0.2 + game.level * 0.03) + Math.sin(enemy.phase * 2) * 0.35;
      enemy.dir = Math.sign(dx) || 1;
      enemy.x += enemy.vx;
      enemy.y = Math.max(20, Math.min(game.ground - 14, enemy.y + enemy.vy));
    }

    // Contact with player: stomp from above or get hurt
    if (overlaps(player, enemy) && enemy.hp > 0) {
      const ghostSolid = enemy.kind !== "ghost" || Math.sin(enemy.phase) > -0.4;
      // Landing on a monster with Monova's feet defeats it: falling, and the feet
      // were above the monster's middle on the previous frame.
      const prevFeet = player.y + player.h - player.vy;
      if (player.vy > 0 && prevFeet <= enemy.y + enemy.h * 0.6 && ghostSolid) {
        killEnemy(game, enemy, 300);
        player.vy = -3.8;
        player.doubleJump = true;
        player.invuln = Math.max(player.invuln, 12);
      } else if (enemy.stun > 0) {
        killEnemy(game, enemy, 200);
      } else if (ghostSolid) {
        hurtPlayer(game);
      }
    }
  }

  // Shots
  for (const shot of game.shots) {
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.spin += 0.5;
    shot.life--;
    if (shot.hostile) {
      shot.vy += 0.06;
      if (overlaps({ x: shot.x - 2, y: shot.y - 2, w: 4, h: 4 }, player)) { shot.life = 0; hurtPlayer(game); }
      continue;
    }
    for (const enemy of game.enemies) {
      if (enemy.hp <= 0 || !overlaps({ x: shot.x - 3, y: shot.y - 3, w: 6, h: 6 }, enemy)) continue;
      if (enemy.kind === "ghost" && Math.sin(enemy.phase) < -0.4) continue;
      shot.life = 0;
      enemy.hp--;
      enemy.flash = 8;
      if (enemy.hp <= 0) killEnemy(game, enemy, enemy.kind === "ghost" ? 500 : enemy.kind === "zombie" ? 200 : 100);
      else { enemy.stun = 150; burst(game, shot.x, shot.y, ["#fff", "#ffd23f"], 6); }
      break;
    }
  }
  game.shots = game.shots.filter(s => s.life > 0 && s.x > -10 && s.x < W + 10 && s.y < game.ground + 20);
  game.enemies = game.enemies.filter(e => e.hp > 0);

  if (game.enemies.length === 0 && game.mode === "play") { game.mode = "clear"; game.modeTimer = 90; }
}

function addScoreSilently(game: Game, points: number) {
  game.score += points;
  if (game.score > game.hi) {
    game.hi = game.score;
    try { localStorage.setItem("monova-game-hi", String(game.hi)); } catch {}
  }
}

type Sprites = Record<"cat" | "catWalk" | "catJump" | "zombie" | "zombieWalk" | "pumpkin" | "ghost", HTMLCanvasElement> & { monova?: HTMLImageElement };

// Monova pixel-art sheet: frame 0 faces the viewer, frames 1-4 walk to the right.
const SHEET_FRAME_W = 74;
const SHEET_FRAME_H = 96;
const MONOVA_H = 29;
const MONOVA_W = Math.round(MONOVA_H * SHEET_FRAME_W / SHEET_FRAME_H);

function drawSprite(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number, flip: boolean) {
  ctx.save();
  if (flip) { ctx.translate(Math.round(x) + 16, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(sprite, 0, 0); }
  else ctx.drawImage(sprite, Math.round(x), Math.round(y));
  ctx.restore();
}

function makeBackground() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#140a24");
  sky.addColorStop(0.55, "#3a1440");
  sky.addColorStop(1, "#a8401a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  let s = 7;
  for (let i = 0; i < 60; i++) {
    s = (s * 9301 + 49297) % 233280;
    ctx.fillStyle = i % 3 ? "#ffffff66" : "#ffffffcc";
    ctx.fillRect(Math.floor((s / 233280) * W), Math.floor(((s * 7) % 233280) / 233280 * 120), 1, 1);
  }
  ctx.fillStyle = "#ffe3a3";
  ctx.beginPath();
  ctx.arc(262, 46, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3c97a";
  [[254, 40, 4], [268, 52, 5], [270, 36, 3]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = "#1b0d1f";
  [[0, 200, 60, 40], [40, 190, 30, 50], [250, 196, 70, 44], [290, 180, 30, 60]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
  return canvas;
}

// Haunted masonry follows the existing collision surfaces exactly.
function drawMountain(ctx: CanvasRenderingContext2D, game: Game) {
  const rock = levelConfig(game).rock;
  const ground = game.ground;
  const bottom = Math.min(ground, game.camY + H);
  const ledges = game.platforms.filter(p => !p.ground && p.y < bottom).sort((a, b) => a.y - b.y);
  for (const p of ledges) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, ground - p.y);
    ctx.clip();
    ctx.fillStyle = rock.shade;
    ctx.fillRect(p.x, p.y, p.w, ground - p.y);
    // Staggered stone blocks, chipped corners and deterministic cracks.
    const firstRow = Math.max(0, Math.floor((game.camY - p.y - 5) / 11));
    for (let row = firstRow; p.y + 5 + row * 11 < bottom; row++) {
      const y = p.y + 5 + row * 11;
      for (let col = -1; col * 20 < p.w; col++) {
        const x = p.x + col * 20 + (row % 2 ? 10 : 0);
        const variant = Math.abs(row * 7 + col * 13 + p.x) % 5;
        ctx.fillStyle = variant === 0 ? rock.face : rock.base;
        ctx.fillRect(x + 1, y + 1, 18, 9);
        ctx.fillStyle = rock.face;
        ctx.fillRect(x + 2, y + 1, 15, 1);
        ctx.fillStyle = rock.shade;
        ctx.fillRect(x + 17, y + 7, 2, 3);
        if (variant === 2) {
          ctx.fillRect(x + 7, y + 2, 1, 3);
          ctx.fillRect(x + 8, y + 5, 2, 1);
          ctx.fillRect(x + 9, y + 6, 1, 3);
        }
      }
    }
    // Recessed gothic windows with amber light, safely below the ledge.
    for (let y = p.y + 18; y < bottom - 20; y += 55) {
      if (y + 22 < game.camY) continue;
      const x = Math.round(p.x + p.w / 2 - 5);
      ctx.fillStyle = '#211329';
      ctx.fillRect(x - 2, y + 4, 14, 20);
      ctx.fillRect(x, y + 1, 10, 23);
      ctx.fillRect(x + 3, y - 2, 4, 4);
      ctx.fillStyle = '#ff6a16';
      ctx.fillRect(x + 1, y + 5, 8, 16);
      ctx.fillStyle = '#ffd15a';
      ctx.fillRect(x + 2, y + 6, 2, 13);
      ctx.fillStyle = '#342033';
      ctx.fillRect(x + 4, y + 3, 2, 19);
      ctx.fillRect(x, y + 12, 10, 2);
    }
    ctx.fillStyle = '#211329';
    ctx.fillRect(p.x, p.y + 3, p.w, 3);
    ctx.fillStyle = '#aa431e';
    ctx.fillRect(p.x, p.y + 1, p.w, 2);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(p.x, p.y, p.w, 1);
    // Hanging moss and a small cobweb at each exposed corner.
    for (let x = p.x + 5; x < p.x + p.w - 3; x += 17) {
      ctx.fillStyle = '#50604c';
      ctx.fillRect(x, p.y + 4, 3, 3 + (x % 5));
      ctx.fillStyle = '#788056';
      ctx.fillRect(x, p.y + 4, 1, 3);
    }
    ctx.strokeStyle = '#c8b8d680';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p.x + 2, p.y + 6); ctx.lineTo(p.x + 15, p.y + 6);
    ctx.moveTo(p.x + 2, p.y + 6); ctx.lineTo(p.x + 2, p.y + 19);
    ctx.moveTo(p.x + 2, p.y + 6); ctx.lineTo(p.x + 12, p.y + 16);
    ctx.moveTo(p.x + 2, p.y + 12); ctx.lineTo(p.x + 6, p.y + 10); ctx.lineTo(p.x + 8, p.y + 6);
    ctx.moveTo(p.x + 2, p.y + 18); ctx.lineTo(p.x + 10, p.y + 14); ctx.lineTo(p.x + 14, p.y + 6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#211329';
  ctx.fillRect(0, ground, W, Math.max(40, game.camY + H - ground));
  ctx.fillStyle = '#ffad39';
  ctx.fillRect(0, ground, W, 2);
  ctx.fillStyle = '#a63a19';
  ctx.fillRect(0, ground + 2, W, 3);
  for (let x = 0; x < W; x += 16) {
    ctx.fillStyle = '#4b354e';
    ctx.fillRect(x + 1, ground + 6, 14, 8);
  }
}

// Monova's projectile: a tiny spinning jack-o'-lantern.
function drawPumpkinShot(ctx: CanvasRenderingContext2D, shot: Shot) {
  ctx.save();
  ctx.translate(Math.round(shot.x), Math.round(shot.y));
  ctx.rotate(Math.sin(shot.spin) * 0.5);
  ctx.fillStyle = "#c4520c";
  ctx.fillRect(-4, -3, 8, 6);
  ctx.fillStyle = "#ff8a2a";
  ctx.fillRect(-3, -3, 6, 6);
  ctx.fillRect(-4, -2, 8, 4);
  ctx.fillStyle = "#2f8a3a";
  ctx.fillRect(0, -5, 2, 2);
  ctx.fillStyle = "#17110d";
  ctx.fillRect(-2, -1, 1, 1);
  ctx.fillRect(1, -1, 1, 1);
  ctx.fillRect(-2, 1, 4, 1);
  ctx.restore();
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = "#fff", size = 8, align: CanvasTextAlign = "left") {
  ctx.font = `800 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = "#000";
  ctx.fillText(value, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function draw(ctx: CanvasRenderingContext2D, game: Game, sprites: Sprites, background: HTMLCanvasElement) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(background, 0, 0);
  // Bats drifting across the moon
  ctx.fillStyle = "#0d0612";
  for (let i = 0; i < 4; i++) {
    const x = ((game.tick * (0.3 + i * 0.1) + i * 90) % (W + 40)) - 20;
    const y = 30 + i * 14 + Math.sin(game.tick / 12 + i) * 4;
    const wing = Math.sin(game.tick / 4 + i) > 0 ? 2 : -1;
    ctx.fillRect(x - 1, y, 3, 2);
    ctx.fillRect(x - 4, y - wing, 3, 1);
    ctx.fillRect(x + 2, y - wing, 3, 1);
  }
  ctx.translate(0, -Math.round(game.camY));
  drawMountain(ctx, game);

  for (const enemy of game.enemies) {
    if (enemy.flash > 0 && enemy.flash % 2) continue;
    const flip = enemy.dir < 0;
    if (enemy.kind === "ghost") {
      ctx.globalAlpha = Math.sin(enemy.phase) < -0.4 ? 0.25 : 0.9;
      drawSprite(ctx, sprites.ghost, enemy.x - 2, enemy.y - 1, flip);
      ctx.globalAlpha = 1;
    } else if (enemy.kind === "zombie") {
      const walking = Math.floor(game.tick / 10) % 2 === 0 && enemy.stun === 0;
      drawSprite(ctx, walking ? sprites.zombieWalk : sprites.zombie, enemy.x - 2, enemy.y - 1, flip);
    } else drawSprite(ctx, sprites.pumpkin, enemy.x - 2, enemy.y - 2, flip);
    if (enemy.stun > 0) {
      const t = game.tick / 6;
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(enemy.x + 6 + Math.cos(t) * 6, enemy.y - 4 + Math.sin(t) * 2, 2, 2);
      ctx.fillRect(enemy.x + 6 - Math.cos(t) * 6, enemy.y - 4 - Math.sin(t) * 2, 2, 2);
    }
  }

  const player = game.player;
  const visible = game.mode !== "dead" && game.mode !== "over" && game.mode !== "title" && game.mode !== "win" && !(player.invuln > 0 && Math.floor(player.invuln / 4) % 2);
  if (visible) {
    const sheet = sprites.monova;
    if (sheet?.complete && sheet.naturalWidth) {
      const frame = !player.onGround ? 3 : player.vx ? 1 + (Math.floor(player.anim / 7) % 4) : 0;
      const x = Math.round(player.x + player.w / 2 - MONOVA_W / 2);
      const y = Math.round(player.y + player.h - MONOVA_H + 1);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (player.dir < 0 && frame > 0) { ctx.translate(x + MONOVA_W, y); ctx.scale(-1, 1); ctx.drawImage(sheet, frame * SHEET_FRAME_W, 0, SHEET_FRAME_W, SHEET_FRAME_H, 0, 0, MONOVA_W, MONOVA_H); }
      else ctx.drawImage(sheet, frame * SHEET_FRAME_W, 0, SHEET_FRAME_W, SHEET_FRAME_H, x, y, MONOVA_W, MONOVA_H);
      ctx.restore();
    } else {
      const sprite = !player.onGround ? sprites.catJump : player.vx && Math.floor(player.anim / 8) % 2 ? sprites.catWalk : sprites.cat;
      drawSprite(ctx, sprite, player.x - 2, player.y + player.h - 16, player.dir < 0);
    }
  }

  for (const shot of game.shots) {
    if (shot.hostile) { ctx.fillStyle = "#f7f3ea"; ctx.save(); ctx.translate(shot.x, shot.y); ctx.rotate(shot.spin); ctx.fillRect(-3, -1, 6, 2); ctx.fillRect(-4, -2, 2, 4); ctx.fillRect(2, -2, 2, 4); ctx.restore(); }
    else drawPumpkinShot(ctx, shot);
  }
  for (const p of game.particles) { ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
  for (const p of game.popups) text(ctx, p.text, p.x, p.y, "#ffd23f", 7);

  // HUD (screen space)
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = "#000000aa";
  ctx.fillRect(0, 0, W, 14);
  text(ctx, `PUNTOS ${String(game.score).padStart(6, "0")}`, 4, 10, "#ff8a2a");
  text(ctx, `HI ${String(game.hi).padStart(6, "0")}`, 120, 10, "#fff");
  text(ctx, `NIVEL ${game.level}/${MAX_LEVEL}`, 186, 10, "#ffd23f");
  text(ctx, `${Math.ceil(game.time / 60)}`, 248, 10, game.time < 15 * 60 ? "#ff5a5a" : "#fff");
  if (game.mode === "play" || game.mode === "dead") text(ctx, `MONSTRUOS ${game.enemies.length}`, 4, 24, "#fff", 7);
  for (let i = 0; i < game.lives; i++) { ctx.fillStyle = "#ff8a2a"; ctx.fillRect(278 + i * 13, 4, 9, 6); ctx.fillRect(278 + i * 13, 2, 2, 2); ctx.fillRect(285 + i * 13, 2, 2, 2); }

  const center = (lines: [string, string, number][]) => {
    ctx.fillStyle = "#0b0610cc";
    const top = Math.round(H / 2 - 50);
    ctx.fillRect(0, top, W, 100);
    lines.forEach(([value, color, size], i) => text(ctx, value, W / 2, top + 28 + i * 22, color, size, "center"));
  };
  if (game.mode === "title") { ctx.fillStyle = "#0b0610b3"; ctx.fillRect(0, 0, W, H); }
  if (game.mode === "intro") center([[`NIVEL ${game.level}`, "#ff8a2a", 18], ["¡Limpia la montaña!", "#fff", 8]]);
  if (game.mode === "paused") center([["PAUSA", "#ffd23f", 18], ["Presiona P para continuar", "#fff", 8]]);
  if (game.mode === "clear") center([["¡NIVEL SUPERADO!", "#ffd23f", 16], [`Bonus de tiempo`, "#fff", 8]]);
  // Win / game over: dim the scene; the HTML end card carries the message and call to action.
  if (game.mode === "win" || game.mode === "over") { ctx.fillStyle = "#0b0610c7"; ctx.fillRect(0, 0, W, H); }
}

const KEYS: Record<string, keyof Input> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", ArrowDown: "down", KeyS: "down",
  Space: "throw", KeyX: "throw", KeyJ: "throw", KeyK: "throw",
};

export function MonovaGame({ contact }: { contact: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<Input>({ left: false, right: false, jump: false, down: false, throw: false });
  const gameRef = useRef<Game | null>(null);
  const touchPointers = useRef(new Map<number, keyof Input>());
  const [pressed, setPressed] = useState<Partial<Input>>({});
  const [mode, setMode] = useState<Mode>("title");
  const [finalScore, setFinalScore] = useState(0);
  // On phones the game takes over the whole screen while playing.
  const [immersive, setImmersive] = useState(false);
  const [viewH, setViewH] = useState(BASE_H);

  const enterImmersive = () => {
    if (!window.matchMedia("(hover: none), (pointer: coarse), (max-width: 820px)").matches) return;
    setImmersive(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const exitImmersive = () => {
    const game = gameRef.current;
    if (game?.mode === "play") { game.mode = "paused"; setMode("paused"); }
    setImmersive(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    if (!immersive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fit = () => {
      const portrait = window.innerHeight > window.innerWidth;
      // Leave room below the screen for the controls in portrait.
      setViewHeight(portrait ? (W * (window.innerHeight - 210)) / window.innerWidth : BASE_H);
      setViewH(H);
      const game = gameRef.current;
      if (game) game.camY = Math.max(0, Math.min(game.ground + 16 - H, game.camY));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("resize", fit);
      setViewHeight(BASE_H);
      setViewH(BASE_H);
    };
  }, [immersive]);

  const startOrResume = () => {
    const game = gameRef.current;
    if (!game) return;
    enterImmersive();
    if (game.mode === "title" || game.mode === "over" || game.mode === "win") newGame(game);
    else if (game.mode === "paused") game.mode = "play";
    setMode(game.mode);
    canvasRef.current?.focus();
  };

  const onStartKey = useEffectEvent(() => startOrResume());

  const togglePause = () => {
    const game = gameRef.current;
    if (!game) return;
    if (game.mode === "play") game.mode = "paused";
    else if (game.mode === "paused") game.mode = "play";
    setMode(game.mode);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const sprites: Sprites = {
      cat: makeSprite(CAT), catWalk: makeSprite(CAT_WALK), catJump: makeSprite(CAT_JUMP),
      zombie: makeSprite(ZOMBIE), zombieWalk: makeSprite(ZOMBIE_WALK), pumpkin: makeSprite(PUMPKIN), ghost: makeSprite(GHOST),
    };
    sprites.monova = new Image();
    sprites.monova.src = "/assets/game/monova-sprites.png";
    let background = makeBackground();
    let hi = 0;
    try { hi = Number(localStorage.getItem("monova-game-hi")) || 0; } catch {}
    const game = createGame(Date.now() % 100000, hi);
    gameRef.current = game;

    let frame = 0;
    let last = performance.now();
    let acc = 0;
    let lastMode: Mode = game.mode;
    const loop = (now: number) => {
      acc = Math.min(acc + now - last, 250);
      last = now;
      while (acc >= STEP) { update(game, inputRef.current); acc -= STEP; }
      if (background.height !== H) background = makeBackground();
      draw(ctx, game, sprites, background);
      if (game.mode !== lastMode) { lastMode = game.mode; setMode(game.mode); setFinalScore(game.score); }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const onKey = (event: KeyboardEvent, pressed: boolean) => {
      const key = KEYS[event.code];
      if (key) { inputRef.current[key] = pressed; event.preventDefault(); }
      if (!pressed) return;
      if (event.code === "Enter" && (game.mode === "title" || game.mode === "over" || game.mode === "win" || game.mode === "paused")) { event.preventDefault(); onStartKey(); }
      if ((event.code === "KeyP" || event.code === "Escape") && (game.mode === "play" || game.mode === "paused")) togglePause();
    };
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    const blur = () => { Object.keys(inputRef.current).forEach(k => { inputRef.current[k as keyof Input] = false; }); if (game.mode === "play") { game.mode = "paused"; setMode("paused"); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  const syncTouch = () => {
    const next: Partial<Input> = {};
    for (const key of touchPointers.current.values()) next[key] = true;
    for (const key of Object.keys(inputRef.current) as (keyof Input)[]) inputRef.current[key] = !!next[key];
    setPressed(next);
  };
  const releaseTouch = (event: React.PointerEvent) => {
    if (touchPointers.current.delete(event.pointerId)) syncTouch();
  };
  const onTouchDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchPointers.current.set(event.pointerId, event.currentTarget.dataset.control as keyof Input);
    syncTouch();
  };
  const onTouchMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const key = touchPointers.current.get(event.pointerId);
    if (key !== "left" && key !== "right" && key !== "down") return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>("button[data-control]");
    const direction = target?.dataset.control;
    if (direction === "left" || direction === "right" || direction === "down") {
      touchPointers.current.set(event.pointerId, direction);
      syncTouch();
    }
  };

  return <div className={styles.wrap} data-immersive={immersive}>
    <div className={styles.screen}>
      <canvas ref={canvasRef} className={styles.canvas} width={W * SCALE} height={viewH * SCALE} tabIndex={0} aria-label="Juego Juega con Monova. Usa las flechas para moverte, flecha arriba para saltar y espacio para lanzar calabazas." />
      {mode === "title" && <div className={styles.titleCard}>
        <NextImage className={styles.titleMascot} src="/assets/game/monova-promo.png" width={361} height={520} alt="Monova disfrazado de calabaza saludando" priority />
        <div className={styles.titleCopy}>
          <p>EDICIÓN HALLOWEEN 🎃</p>
          <h2>Haz el mejor <span>puntaje</span></h2>
          <small>Supera las 3 montañas y compite por una web para tu marca.</small>
          <strong className={styles.titlePromo}><span>y gana una web</span><b>100% GRATIS</b></strong>
          <button type="button" className={styles.titleStart} onClick={startOrResume}>Entrar al juego</button>
          <em>o presiona Enter</em>
        </div>
      </div>}
      {(mode === "win" || mode === "over") && <div className={styles.titleCard}>
        <NextImage className={styles.titleMascot} src="/assets/game/monova-promo.png" width={361} height={520} alt="Monova disfrazado de calabaza saludando" />
        <div className={styles.titleCopy}>
          <p>{mode === "win" ? "¡LAS 3 MONTAÑAS LIMPIAS! 🎃" : "FIN DEL JUEGO"}</p>
          <h2>{mode === "win" ? <>¡Reto <span>completado!</span></> : <>¡Casi lo <span>logras!</span></>}</h2>
          <small>{finalScore.toLocaleString("es-CO")} puntos</small>
          <strong className={styles.endPitch}>¡Cada punto cuenta! Mejora tu puntaje y compite por una web 100% gratis.</strong>
          <a className={styles.titleStart} href={`${contact.split("?")[0]}?text=${encodeURIComponent(`Hola Monova, participé en el juego de Halloween y conseguí ${finalScore} puntos. Quiero saber más sobre el concurso por una web 100% gratis.`)}`} target="_blank" rel="noreferrer">Subir puntaje</a>
          <button type="button" className={styles.endReplay} onClick={startOrResume}>{mode === "win" ? "Jugar otra vez" : "Reintentar"}</button>
        </div>
      </div>}
      {mode === "paused" && <button type="button" className={styles.start} onClick={startOrResume}>Continuar</button>}
      {mode === "play" && <button type="button" className={styles.pause} onClick={togglePause} aria-label="Pausar">II</button>}
      {immersive && <button type="button" className={styles.exit} onClick={exitImmersive} aria-label="Salir de pantalla completa"><X size={18}/></button>}
    </div>
    {immersive && <div className={styles.touch} role="group" aria-label="Controles táctiles">
      <div className={styles.dpad}>
        <button type="button" className={styles.dLeft} aria-label="Mover a la izquierda" data-control="left" data-pressed={!!pressed.left} onPointerDown={onTouchDown} onPointerMove={onTouchMove} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch} onContextMenu={event => event.preventDefault()}><ChevronLeft size={34} strokeWidth={2.6}/></button>
        <button type="button" className={styles.dDown} aria-label="Bajar de plataforma" data-control="down" data-pressed={!!pressed.down} onPointerDown={onTouchDown} onPointerMove={onTouchMove} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch} onContextMenu={event => event.preventDefault()}><ChevronDown size={26} strokeWidth={2.6}/></button>
        <button type="button" className={styles.dRight} aria-label="Mover a la derecha" data-control="right" data-pressed={!!pressed.right} onPointerDown={onTouchDown} onPointerMove={onTouchMove} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch} onContextMenu={event => event.preventDefault()}><ChevronRight size={34} strokeWidth={2.6}/></button>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.throw} aria-label="Lanzar calabaza" data-control="throw" data-pressed={!!pressed.throw} onPointerDown={onTouchDown} onPointerMove={onTouchMove} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch} onContextMenu={event => event.preventDefault()}><span>🎃</span><small>LANZAR</small></button>
        <button type="button" className={styles.jumpButton} aria-label="Saltar" data-control="jump" data-pressed={!!pressed.jump} onPointerDown={onTouchDown} onPointerMove={onTouchMove} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch} onContextMenu={event => event.preventDefault()}><ChevronUp size={34} strokeWidth={2.8}/><small>SALTAR</small></button>
      </div>
    </div>}
    <ul className={styles.keys}>
      <li><kbd>←</kbd><kbd>→</kbd> Moverse</li>
      <li><kbd>↑</kbd> Saltar</li>
      <li><kbd>↓</kbd> Bajar de plataforma</li>
      <li><kbd>Espacio</kbd> Lanzar calabazas</li>
      <li><kbd>P</kbd> Pausa</li>
    </ul>
  </div>;
}
