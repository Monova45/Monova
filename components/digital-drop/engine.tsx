"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { Cat, catPose } from './character';
import { CombatEffects, burst, resetEffects, screen, shockwave, tracer } from './effects';
import { firewallMaterial } from './materials';
import { absorbDamage, firewallRadius, matchResult } from './systems';
import { sfx } from './audio';
import { TOTAL_BUGS, emitHud, enemyKinds, radar, spawns, useDrop, weapons } from './state';
import { net, onNet, remotes, send } from './net';

const kinds = [
  { hp: 70, speed: 3.3, scale: .6, damage: 8, color: '#ff3b30', height: 1.2 },
  { hp: 70, speed: 2.4, scale: .85, damage: 8, color: '#2fd4ff', height: .55 },
  { hp: 160, speed: 1.2, scale: 1.4, damage: 15, color: '#ff2d8a', height: 1.5 },
  { hp: 110, speed: 1.7, scale: .85, damage: 10, color: '#b45cff', height: 1.6 },
];
type Bug = { x: number; z: number; y: number; hp: number; max: number; kind: number; attack: number; melee: number; flash: number; dying: number; phase: number; tx: number; tz: number };
type Orb = { p: THREE.Vector3; v: THREE.Vector3; life: number };
const UP = new THREE.Vector3(0, 1, 0), DROP_HEIGHT = 34, PROTECTION = 5, RESPAWN = 6;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function Engine() {
  const { gl } = useThree();
  const { world, rapier } = useRapier();
  const body = useRef<RapierRigidBody>(null), cat = useRef<THREE.Group>(null), capsule = useRef<THREE.Group>(null), muzzle = useRef<THREE.PointLight>(null);
  const shell = useRef<THREE.InstancedMesh>(null), halo = useRef<THREE.InstancedMesh>(null), limbs = useRef<THREE.InstancedMesh>(null), eyes = useRef<THREE.InstancedMesh>(null);
  const xray = useRef<THREE.InstancedMesh>(null), barBack = useRef<THREE.InstancedMesh>(null), barFill = useRef<THREE.InstancedMesh>(null), orbMesh = useRef<THREE.InstancedMesh>(null);
  const wall = useRef<THREE.Mesh>(null), shieldMesh = useRef<THREE.Mesh>(null), scanMesh = useRef<THREE.Mesh>(null), lids = useRef<(THREE.Group | null)[]>([]), beacons = useRef<(THREE.Mesh | null)[]>([]);
  const keys = useRef(new Set<string>());
  const mouse = useRef({ yaw: 0, pitch: .18, fire: false, aim: false });
  const timer = useRef({ fire: 0, reload: 0, flush: 0, shield: 0, boost: 0, scan: 0, flash: 0, hurtSound: 0, landed: false, fallSpeed: 0, protect: PROTECTION, sync: 0, bugSync: 0, dead: false, respawn: 0, ended: false, lastBy: '', watching: '' });
  const run = useRef({ hp: 100, shield: 100, kills: 0, time: 0, cooldown: 0, outside: false, prompt: '' });
  const opened = useRef(new Set<number>());
  // Bugs get tougher with more players; every peer derives the same value from the lobby size.
  const hpScale = 1 + .35 * Math.max(0, useDrop.getState().lobby.length - 1);
  const bugs = useRef<Bug[]>(Array.from({ length: TOTAL_BUGS }, (_, i) => {
    const x = Math.cos(i * 2.4) * (16 + i), z = Math.sin(i * 2.4) * (16 + i), hp = kinds[i % 4].hp * hpScale;
    return { x, z, tx: x, tz: z, y: 0, hp, max: hp, kind: i % 4, attack: 1 + i * .1, melee: 0, flash: 0, dying: -1, phase: i * 1.7 };
  }));
  const orbs = useRef<Orb[]>([]);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), v: new THREE.Vector3(), w: new THREE.Vector3(), aim: new THREE.Vector3(), cam: new THREE.Vector3(), target: new THREE.Vector3(), color: new THREE.Color(), white: new THREE.Color(6, 6, 6) }), []);
  const kindColors = useMemo(() => kinds.map(k => new THREE.Color(k.color).multiplyScalar(4)), []);
  const firewall = useMemo(() => firewallMaterial(), []);
  const slot = useDrop.getState().lobby.find(p => p.id === net.id)?.slot ?? 0;
  // Battle royale: online + PvP mode. Each player drops into a different district; co-op drops the squad together.
  const pvp = net.mode !== 'solo' && useDrop.getState().matchMode === 'pvp';
  const spawn = useMemo(() => {
    if (pvp) { const [x, z] = spawns[slot % spawns.length]; return [x - 2, z + 2]; }
    const [x, z] = spawns[useDrop.getState().spawn]; return [x + (slot % 3 - 1) * 2.5, z + (slot > 2 ? 2.5 : 0)];
  }, [slot, pvp]);
  const incoming = useRef<{ dmg: number; by: string; x: number; z: number }[]>([]);
  const killBug = useRef<(i: number, by: string) => void>(() => {});
  const finish = (result: 'win' | 'over') => {
    if (timer.current.ended) return;
    timer.current.ended = true;
    useDrop.setState({ phase: result }); document.exitPointerLock?.(); sfx.drone(false);
    if (result === 'win') sfx.win(); else sfx.lose();
  };

  useEffect(() => {
    resetEffects(); sfx.deploy(); sfx.drone(true);
    killBug.current = (i, by) => {
      const b = bugs.current[i]; if (!b || b.dying > 0) return;
      b.hp = 0; b.dying = .4; run.current.kills++;
      const c = kinds[b.kind].color, mine = by === net.id || by === 'me';
      burst(b.x, b.y, b.z, 36, c, 10, .22); shockwave(b.x, .15, b.z, c, 4 * kinds[b.kind].scale); sfx.kill();
      if (net.mode === 'host') send({ t: 'kill', bug: i, by });
      if (mine) { emitHud('kill'); screen.shake = Math.max(screen.shake, .25); useDrop.setState(st => ({ credits: st.credits + 50 })); useDrop.getState().pushFeed(`${enemyKinds[b.kind]} ELIMINADO · +50`); }
      else useDrop.getState().pushFeed(`${(remotes.get(by)?.name ?? 'ALIADO').toUpperCase()} ▸ ${enemyKinds[b.kind]}`);
    };
    radar.bugs = bugs.current.map(b => ({ x: b.x, z: b.z, alive: true }));
    const switchWeapon = (n: number) => {
      const s = useDrop.getState(); if (!s.unlocked.includes(n) || n === s.weapon) return;
      useDrop.setState({ weapon: n, ammo: 0 }); s.notify(`${weapons[n].name.toUpperCase()} · RECARGANDO`); timer.current.reload = 0; sfx.ui();
    };
    const down = (e: KeyboardEvent) => {
      if (['Space', 'Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) e.preventDefault();
      keys.current.add(e.code);
      const s = useDrop.getState();
      if (e.code === 'Escape' && s.phase === 'play') { useDrop.setState({ phase: 'pause' }); document.exitPointerLock?.(); }
      if (e.code.startsWith('Digit')) switchWeapon(Number(e.code.slice(5)) - 1);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement && !mouse.current.aim) return;
      const k = .0021 * useDrop.getState().sensitivity * (mouse.current.aim ? .6 : 1);
      mouse.current.yaw -= e.movementX * k;
      mouse.current.pitch = THREE.MathUtils.clamp(mouse.current.pitch + e.movementY * k, -.45, .95);
    };
    const press = (e: MouseEvent) => { if (e.button === 0) mouse.current.fire = true; if (e.button === 2) mouse.current.aim = true; };
    const release = (e: MouseEvent) => { if (e.button === 0) mouse.current.fire = false; if (e.button === 2) mouse.current.aim = false; };
    const wheel = (e: WheelEvent) => { const s = useDrop.getState(); const list = [...s.unlocked].sort((a, b) => a - b); const i = list.indexOf(s.weapon); switchWeapon(list[(i + (e.deltaY > 0 ? 1 : -1) + list.length) % list.length]); };
    const blur = () => { keys.current.clear(); mouse.current.fire = false; if (useDrop.getState().phase === 'play') useDrop.setState({ phase: 'pause' }); };
    const lock = () => { if (!document.pointerLockElement && useDrop.getState().phase === 'play') blur(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('mousemove', move);
    gl.domElement.addEventListener('mousedown', press); window.addEventListener('mouseup', release); gl.domElement.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('blur', blur); document.addEventListener('pointerlockchange', lock);
    const offNet = onNet(msg => {
      const list = bugs.current;
      if (msg.t === 'shot') {
        const from = new THREE.Vector3().fromArray(msg.from), to = new THREE.Vector3().fromArray(msg.to), w = weapons[msg.w] ?? weapons[0];
        tracer(from, to, w.color, msg.w === 4 ? .07 : msg.w === 2 ? .09 : .035); burst(to.x, to.y, to.z, 4, w.color, 3, .1);
        if (body.current && from.distanceTo(body.current.translation() as THREE.Vector3) < 28) sfx.shot(msg.w);
      }
      if (msg.t === 'hit' && net.mode === 'host') { const b = list[msg.bug]; if (b && b.hp > 0) { b.hp -= msg.dmg; b.flash = .1; if (b.hp <= 0) killBug.current(msg.bug, msg.by); } }
      if (msg.t === 'kill' && net.mode === 'client') killBug.current(msg.bug, msg.by);
      if (msg.t === 'bugs' && net.mode === 'client') list.forEach((b, i) => {
        b.tx = msg.b[i * 3]; b.tz = msg.b[i * 3 + 1];
        const hp = msg.b[i * 3 + 2];
        if (hp < b.hp && hp > 0) b.flash = .08;
        if (b.hp > 0) b.hp = hp > 0 ? hp : b.hp;
      });
      if (msg.t === 'orb' && net.mode === 'client') orbs.current.push({ p: new THREE.Vector3().fromArray(msg.p), v: new THREE.Vector3().fromArray(msg.v), life: 3 });
      if (msg.t === 'end') finish(msg.result);
      if (msg.t === 'pvp' && msg.target === net.id) incoming.current.push(msg);
      if (msg.t === 'down') {
        const victim = msg.id === net.id ? 'TÚ' : remotes.get(msg.id)?.name ?? 'AGENTE', killer = msg.by === net.id ? 'TÚ' : remotes.get(msg.by)?.name ?? 'LA INFECCIÓN';
        useDrop.getState().pushFeed(`${killer} ▸ ${victim}`.toUpperCase());
        if (msg.by === net.id && msg.id !== net.id) { emitHud('kill'); sfx.kill(); useDrop.setState(st => ({ pkills: st.pkills + 1, credits: st.credits + 150 })); }
        const r = remotes.get(msg.id); if (r) { r.alive = false; burst(r.x, r.y, r.z, 50, '#ff8737', 10, .2); shockwave(r.x, .1, r.z, '#ff3b3b', 6); }
      }
      if (msg.t === 'winner') { useDrop.setState({ winner: msg.id === net.id ? useDrop.getState().playerName || 'TÚ' : remotes.get(msg.id)?.name ?? 'AGENTE' }); finish(msg.id === net.id ? 'win' : 'over'); }
    });
    return () => {
      offNet();
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('mousemove', move);
      gl.domElement.removeEventListener('mousedown', press); window.removeEventListener('mouseup', release); gl.domElement.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', blur); document.removeEventListener('pointerlockchange', lock); sfx.drone(false);
    };
  }, [gl]);

  useFrame(({ clock, camera }, delta) => {
    const s = useDrop.getState(), cam = camera as THREE.PerspectiveCamera;
    if (wall.current) (wall.current.material as THREE.ShaderMaterial).uniforms.time.value = clock.elapsedTime;
    const online = net.mode !== 'solo', authority = net.mode !== 'client';
    if (!body.current || !(s.phase === 'play' || (online && s.phase === 'pause'))) return;
    const input = s.phase === 'play' && !timer.current.dead;
    const dt = Math.min(delta, .04), t = timer.current, r = run.current, k = keys.current, m = mouse.current, { o } = tmp;
    t.fire -= dt; t.shield -= dt; t.boost -= dt; t.scan -= dt; t.flash -= dt; t.hurtSound -= dt; t.protect -= dt; r.cooldown = Math.max(0, r.cooldown - dt);
    if (!input) { k.clear(); m.fire = false; }
    r.time += dt;
    const p = body.current.translation(), v = body.current.linvel();
    const grounded = !!world.castRay(new rapier.Ray({ x: p.x, y: p.y - .7, z: p.z }, { x: 0, y: -1, z: 0 }), .2, true, undefined, undefined, undefined, body.current ?? undefined);
    const right = tmp.w.set(Math.cos(m.yaw), 0, -Math.sin(m.yaw));

    // Drop and landing.
    if (!t.landed) {
      t.fallSpeed = Math.min(t.fallSpeed, v.y);
      if (grounded) {
        t.landed = true; body.current.setGravityScale(1, true); sfx.land(); screen.shake = .9;
        shockwave(p.x, .1, p.z, '#ff7a00', 9); burst(p.x, .3, p.z, 40, '#ffb35c', 12);
        s.notify('ATERRIZAJE COMPLETADO · ELIMINA LOS BUGS');
      }
    }
    if (capsule.current) capsule.current.visible = !t.landed;

    // Movement.
    const sprint = k.has('ShiftLeft') && !m.aim, boost = t.boost > 0 ? 1.6 : 1;
    const direction = tmp.v.set(Number(k.has('KeyD')) - Number(k.has('KeyA')), 0, Number(k.has('KeyS')) - Number(k.has('KeyW'))).normalize().applyAxisAngle(UP, m.yaw);
    const speed = (sprint ? 9 : m.aim ? 3.6 : 5.5) * boost, control = grounded ? 12 : 4;
    body.current.setLinvel({ x: THREE.MathUtils.damp(v.x, direction.x * speed, control, dt), y: v.y, z: THREE.MathUtils.damp(v.z, direction.z * speed, control, dt) }, true);
    if (k.has('Space') && grounded && t.landed) { body.current.setLinvel({ x: v.x, y: t.boost > 0 ? 10 : 7.5, z: v.z }, true); sfx.jump(); }
    k.delete('Space');
    if (cat.current) cat.current.rotation.y = THREE.MathUtils.damp(cat.current.rotation.y, m.yaw, 18, dt);

    // Over-the-shoulder camera with collision, FOV kicks and shake.
    const distance = m.aim ? 2.6 : 5.2, shoulder = m.aim ? .75 : 1;
    const watched = t.dead && pvp ? [...remotes.values()].find(x => x.alive && x.y > -40) : undefined;
    if (watched?.name !== t.watching) { t.watching = watched?.name ?? ''; useDrop.setState({ spectating: t.watching }); }
    const focus = watched ?? p;
    const target = tmp.target.set(focus.x, focus.y + .9, focus.z).addScaledVector(right, shoulder);
    const back = tmp.cam.set(Math.sin(m.yaw) * Math.cos(m.pitch), Math.sin(m.pitch), Math.cos(m.yaw) * Math.cos(m.pitch));
    const hit = world.castRay(new rapier.Ray(target, back), distance, true, undefined, undefined, undefined, body.current ?? undefined);
    const desired = target.clone().addScaledVector(back, hit ? Math.max(.6, hit.timeOfImpact - .25) : distance);
    cam.position.lerp(desired, 1 - Math.exp(-(t.landed ? 18 : 6) * dt));
    screen.shake = Math.max(0, screen.shake - dt * 3);
    if (screen.shake > 0) cam.position.add(tmp.v.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(screen.shake * .35));
    cam.lookAt(tmp.v.copy(cam.position).addScaledVector(back, -10));
    const fov = m.aim ? 46 : sprint && direction.lengthSq() > 0 ? 70 : t.boost > 0 ? 72 : 62;
    if (Math.abs(cam.fov - fov) > .05) { cam.fov = THREE.MathUtils.damp(cam.fov, fov, 10, dt); cam.updateProjectionMatrix(); }

    // Damage helper: shield first, then health, with screen feedback.
    const damage = (amount: number, fromX?: number, fromZ?: number, by?: string) => {
      if (t.shield > 0 || t.protect > 0 || t.dead) return;
      if (by) t.lastBy = by;
      const next = absorbDamage(r.hp, r.shield, amount); r.hp = next.hp; r.shield = next.shield;
      screen.hurt = Math.min(1, screen.hurt + amount / 18); screen.shake = Math.max(screen.shake, amount / 30);
      if (fromX !== undefined && fromZ !== undefined) emitHud('hurt', Math.atan2(fromX - p.x, fromZ - p.z) - m.yaw);
      if (t.hurtSound <= 0) { sfx.hurt(); t.hurtSound = .25; }
    };

    // Hits from other players arrive through the network and are applied by the victim.
    incoming.current.splice(0).forEach(h => damage(h.dmg, h.x, h.z, h.by));

    // Firewall (closes faster in battle royale to force encounters).
    const radius = firewallRadius(r.time * (pvp ? 1.5 : 1)), outside = Math.hypot(p.x, p.z) > radius;
    if (outside) { damage(dt * 10); screen.hurt = Math.max(screen.hurt, .25); }
    if (outside !== r.outside) { r.outside = outside; useDrop.setState({ outside }); }
    if (p.y < -8) r.hp = 0;

    // Death: solo ends the run, co-op respawns after a countdown (the team loses only if everyone is down).
    if (r.hp <= 0 && !t.dead && online) {
      t.dead = true; t.respawn = RESPAWN; useDrop.setState(st => ({ deaths: st.deaths + 1 }));
      burst(p.x, p.y, p.z, 50, '#ff8737', 10, .2); shockwave(p.x, .1, p.z, '#ff3b3b', 6); sfx.lose();
      if (pvp) {
        const placement = 1 + [...remotes.values()].filter(x => x.alive && x.y > -40).length;
        useDrop.setState({ placement }); send({ t: 'down', id: net.id, by: t.lastBy });
        useDrop.getState().pushFeed(`${t.lastBy ? (remotes.get(t.lastBy)?.name ?? 'AGENTE') : 'LA INFECCIÓN'} ▸ TÚ`.toUpperCase());
        s.notify(`ELIMINADO · PUESTO #${placement} · MODO ESPECTADOR`);
      } else s.notify('AGENTE CAÍDO · REDESPLIEGUE EN CURSO');
    }
    if (t.dead && !pvp) {
      t.respawn -= dt;
      if (t.respawn <= 0) {
        t.dead = false; t.landed = false; t.protect = 4; r.hp = 70; r.shield = 50;
        body.current.setTranslation({ x: spawn[0], y: DROP_HEIGHT, z: spawn[1] }, true); body.current.setLinvel({ x: 0, y: 0, z: 0 }, true); body.current.setGravityScale(.45, true);
        sfx.deploy(); s.notify('REDESPLIEGUE · PROTECCIÓN ACTIVA');
      }
    }
    if (cat.current) cat.current.visible = !t.dead;

    // Reload, abilities.
    if ((k.has('KeyR') && s.ammo < weapons[s.weapon].ammo || s.ammo === 0) && t.reload <= 0) { t.reload = 1.3; sfx.reload(); }
    k.delete('KeyR');
    if (t.reload > 0) { t.reload -= dt; if (t.reload <= 0) useDrop.setState({ ammo: weapons[s.weapon].ammo }); }
    if (k.has('KeyQ') && input) {
      k.delete('KeyQ');
      if (r.cooldown <= 0 && t.landed) {
        if (s.ability === 0) t.shield = 5;
        if (s.ability === 1) t.boost = 6;
        if (s.ability === 2) t.scan = 4;
        if (s.ability === 3) {
          const forward = tmp.v.set(-Math.sin(m.yaw), 0, -Math.cos(m.yaw));
          const blocked = world.castRay(new rapier.Ray(p, forward), 7, true, undefined, undefined, undefined, body.current ?? undefined);
          const d = blocked ? Math.max(0, blocked.timeOfImpact - 1) : 7;
          burst(p.x, p.y, p.z, 25, '#ff7a00', 6); body.current.setTranslation({ x: p.x + forward.x * d, y: p.y + .5, z: p.z + forward.z * d }, true);
          shockwave(p.x + forward.x * d, .1, p.z + forward.z * d, '#ffb35c', 4);
        }
        r.cooldown = 15; sfx.ability(); screen.shake = .3;
      } else if (r.cooldown > 0) sfx.empty();
    }

    // Firing: ray from the camera through the crosshair, tracer from the blaster to the impact.
    if (m.fire && t.fire <= 0 && t.reload <= 0 && t.landed) {
      if (s.ammo <= 0) { sfx.empty(); t.fire = .3; }
      else {
        const w = weapons[s.weapon];
        t.fire = w.interval / (t.boost > 0 ? 1.5 : 1);
        const moving = Math.hypot(v.x, v.z) > 1 ? 1.8 : 1, spread = w.spread * moving * (m.aim ? .35 : 1);
        const aim = cam.getWorldDirection(tmp.aim).add(tmp.v.set((Math.random() - .5) * spread, (Math.random() - .5) * spread, (Math.random() - .5) * spread)).normalize();
        const origin = cam.position;
        const wallHit = world.castRay(new rapier.Ray(origin, aim), 90, true, undefined, undefined, undefined, body.current ?? undefined);
        let nearest = wallHit?.timeOfImpact ?? 90, index = -1;
        bugs.current.forEach((b, i) => {
          if (b.hp <= 0) return;
          const rel = tmp.v.set(b.x - origin.x, b.y - origin.y, b.z - origin.z), along = rel.dot(aim);
          if (along > 0 && along < nearest && rel.addScaledVector(aim, -along).length() < kinds[b.kind].scale * 1.15) { nearest = along; index = i; }
        });
        let victim: string | undefined;
        if (pvp) remotes.forEach(x => {
          if (!x.alive || x.y < -40) return;
          const rel = tmp.v.set(x.x - origin.x, x.y + .15 - origin.y, x.z - origin.z), along = rel.dot(aim);
          if (along > 0 && along < nearest && rel.addScaledVector(aim, -along).length() < .7) { nearest = along; index = -1; victim = x.id; }
        });
        const impact = tmp.cam.copy(origin).addScaledVector(aim, nearest);
        const gun = tmp.target.set(.44, -.1, -.65).applyAxisAngle(UP, cat.current?.rotation.y ?? m.yaw).add(p as THREE.Vector3Like);
        tracer(gun, impact, w.color, s.weapon === 4 ? .07 : s.weapon === 2 ? .09 : .035);
        if (muzzle.current) { muzzle.current.position.copy(gun); muzzle.current.color.set(w.color); }
        t.flash = .05; catPose.recoil = 1; screen.shake = Math.max(screen.shake, w.power * .03);
        sfx.shot(s.weapon);
        let hits = s.hits;
        const hurtBug = (b: Bug, amount: number) => {
          b.flash = .1;
          const i = bugs.current.indexOf(b);
          if (!authority) { send({ t: 'hit', bug: i, dmg: amount, by: net.id }); return; }
          b.hp -= amount;
          if (b.hp <= 0) killBug.current(i, net.id || 'me');
        };
        if (index >= 0) {
          const enemy = bugs.current[index];
          hits++; burst(impact.x, impact.y, impact.z, 8, kinds[enemy.kind].color, 5);
          const lethal = enemy.hp <= w.damage * (s.weapon === 3 ? 1.5 : 1);
          hurtBug(enemy, w.damage * (s.weapon === 3 ? 1.5 : 1));
          if (!lethal) { sfx.hit(); emitHud('hit'); }
        } else if (victim) {
          hits++; burst(impact.x, impact.y, impact.z, 10, '#ff3b3b', 5); sfx.hit(); emitHud('hit');
          send({ t: 'pvp', target: victim, dmg: w.damage, by: net.id, x: round1(p.x), z: round1(p.z) });
        } else if (wallHit) { burst(impact.x, impact.y, impact.z, 6, w.color, 4, .1); sfx.impact(); }
        if (s.weapon === 2) {
          shockwave(impact.x, Math.max(.15, impact.y), impact.z, w.color, 5); burst(impact.x, impact.y, impact.z, 20, w.color, 9);
          if (pvp) remotes.forEach(x => { if (x.id !== victim && x.alive && Math.hypot(x.x - impact.x, x.z - impact.z) < 3.5) send({ t: 'pvp', target: x.id, dmg: 30, by: net.id, x: round1(p.x), z: round1(p.z) }); });
          bugs.current.forEach(b => { if (b !== bugs.current[index] && b.hp > 0 && Math.hypot(b.x - impact.x, b.z - impact.z) < 5) hurtBug(b, 45); });
        }
        if (online) send({ t: 'shot', id: net.id, from: gun.toArray().map(round1), to: impact.toArray().map(round1), w: s.weapon });
        useDrop.setState({ ammo: s.ammo - 1, shots: s.shots + 1, hits });
      }
    }
    if (muzzle.current) muzzle.current.intensity = t.flash > 0 ? 40 : 0;

    // Enemy AI: chase, keep inside the firewall, separate, and attack (Spitters fire orbs from range).
    const active = r.time > PROTECTION;
    const players = [{ x: p.x, y: p.y, z: p.z, alive: !t.dead }, ...[...remotes.values()].map(x => ({ x: x.x, y: x.y, z: x.z, alive: x.alive && x.y > -40 }))].filter(x => x.alive);
    bugs.current.forEach((b, i) => {
      const kind = kinds[b.kind];
      b.flash -= dt; b.melee -= dt;
      // Melee is resolved locally by each peer against its own agent.
      const own = Math.hypot(p.x - b.x, p.z - b.z);
      if (b.hp > 0 && active && b.kind !== 3 && own < 1.4 + kind.scale && b.melee <= 0 && !t.dead) { damage(kind.damage, b.x, b.z); b.melee = 1.3; burst(p.x, p.y, p.z, 6, kind.color, 4); }
      if (!authority) {
        b.x = THREE.MathUtils.damp(b.x, b.tx, 10, dt); b.z = THREE.MathUtils.damp(b.z, b.tz, 10, dt);
        if (b.hp <= 0 && b.dying > 0) b.dying -= dt;
      } else if (b.hp > 0) {
        let near = players[0] ?? { x: 0, y: 0, z: 0 }, best = Infinity;
        players.forEach(pl => { const d = Math.hypot(pl.x - b.x, pl.z - b.z); if (d < best) { best = d; near = pl; } });
        const dx = near.x - b.x, dz = near.z - b.z, dist = Math.hypot(dx, dz) || .001;
        let mx = 0, mz = 0;
        if (Math.hypot(b.x, b.z) > radius - 2) { mx = -b.x; mz = -b.z; }
        else if (active && dist < 30) {
          if (b.kind === 3) { const want = dist > 15 ? 1 : dist < 9 ? -1 : 0; mx = dx / dist * want + -dz / dist * .6; mz = dz / dist * want + dx / dist * .6; }
          else if (dist > 1.3 + kind.scale) { mx = dx; mz = dz; }
        } else { mx = Math.sin(r.time * .3 + b.phase); mz = Math.cos(r.time * .25 + b.phase * 1.3); }
        const len = Math.hypot(mx, mz);
        if (len > .01) {
          mx /= len; mz /= len;
          const step = kind.speed * (active && dist < 30 ? 1 : .35) * dt;
          if (world.castRay(new rapier.Ray({ x: b.x, y: .8, z: b.z }, { x: mx, y: 0, z: mz }), 1.6, true, undefined, undefined, undefined, body.current ?? undefined)) { const sx = mz, sz = -mx; mx = sx; mz = sz; }
          b.x += mx * step; b.z += mz * step;
        }
        bugs.current.forEach((other, j) => {
          if (j <= i || other.hp <= 0) return;
          const ox = b.x - other.x, oz = b.z - other.z, d = Math.hypot(ox, oz), min = kind.scale + kinds[other.kind].scale;
          if (d < min && d > .001) { const push = (min - d) / 2 / d; b.x += ox * push; b.z += oz * push; other.x -= ox * push; other.z -= oz * push; }
        });
        b.attack -= dt;
        if (active && b.attack <= 0 && b.kind === 3 && dist < 22 && players.length) {
          const from = new THREE.Vector3(b.x, b.y, b.z), dir = new THREE.Vector3(near.x, near.y + .3, near.z).sub(from).normalize().multiplyScalar(11);
          if (orbs.current.length > 24) orbs.current.shift();
          orbs.current.push({ p: from, v: dir, life: 3 }); sfx.enemyShot(); b.attack = 2.2;
          if (online) send({ t: 'orb', p: from.toArray().map(round1), v: dir.toArray().map(round1) });
        }
      } else if (b.dying > 0) b.dying -= dt;
      b.y = b.kind === 1 ? kind.height : kind.height + Math.sin(r.time * 3 + i) * .14;
      radar.bugs[i] = { x: b.x, z: b.z, alive: b.hp > 0 };
    });

    // Enemy projectiles.
    orbs.current = orbs.current.filter(orb => {
      orb.life -= dt; const stepLength = orb.v.length() * dt;
      const blocked = world.castRay(new rapier.Ray(orb.p, tmp.v.copy(orb.v).normalize()), stepLength, true, undefined, undefined, undefined, body.current ?? undefined);
      orb.p.addScaledVector(orb.v, dt);
      if (orb.p.distanceTo(tmp.v.set(p.x, p.y + .2, p.z)) < .9) { damage(10, orb.p.x, orb.p.z); burst(orb.p.x, orb.p.y, orb.p.z, 14, '#b45cff', 6); return false; }
      if (blocked || orb.life <= 0 || orb.p.y < 0) { burst(orb.p.x, orb.p.y, orb.p.z, 8, '#b45cff', 4); return false; }
      return true;
    });

    // Instanced enemy rendering.
    const camQuat = cam.quaternion, scan = t.scan > 0;
    bugs.current.forEach((b, i) => {
      const kind = kinds[b.kind], alive = b.hp > 0, dyingK = alive ? 1 : Math.max(0, b.dying / .4);
      const scale = kind.scale * dyingK * Math.min(1, r.time / 1.2), facing = Math.atan2(p.x - b.x, p.z - b.z);
      const hidden = scale <= .001;
      o.position.set(b.x, b.y + (alive ? 0 : (1 - dyingK) * .8), b.z); o.rotation.set(alive ? 0 : (1 - dyingK) * 4, facing + (alive ? 0 : (1 - dyingK) * 6), b.kind === 3 ? Math.sin(r.time * 6) * .15 : 0);
      o.scale.set(scale, scale * (b.kind === 1 ? .55 : .8), scale); o.updateMatrix();
      shell.current?.setMatrixAt(i, o.matrix); xray.current?.setMatrixAt(i, o.matrix);
      xray.current?.setColorAt(i, kindColors[b.kind]);
      o.rotation.set(Math.PI / 2 + Math.sin(r.time * 2 + i) * .25, 0, r.time * 3 + i); o.scale.set(scale * 1.15, scale * 1.15, scale * 1.15); o.updateMatrix();
      halo.current?.setMatrixAt(i, o.matrix); halo.current?.setColorAt(i, b.flash > 0 ? tmp.white : kindColors[b.kind]);
      o.position.set(b.x + Math.sin(facing) * scale * .82, b.y + .1 * scale, b.z + Math.cos(facing) * scale * .82); o.rotation.set(0, facing, 0); o.scale.set(scale * .6, scale * .12, scale * .1); o.updateMatrix();
      eyes.current?.setMatrixAt(i, o.matrix); eyes.current?.setColorAt(i, b.flash > 0 ? tmp.white : kindColors[b.kind]);
      for (let part = 0; part < 4; part++) {
        const side = part % 2 ? 1 : -1, front = part < 2 ? 1 : -1, swing = Math.sin(r.time * (b.kind === 0 ? 14 : 9) + part * 1.6 + i) * .35;
        const angle = facing + side * Math.PI / 2, reach = scale * (b.kind === 1 ? 1.2 : .9);
        o.position.set(b.x + Math.sin(angle) * reach + Math.sin(facing) * front * scale * .4, b.y - scale * .55, b.z + Math.cos(angle) * reach + Math.cos(facing) * front * scale * .4);
        o.rotation.set(swing, facing, side * .6); o.scale.set(scale * .12, scale * (b.kind === 1 ? .7 : 1), scale * .12); o.updateMatrix();
        limbs.current?.setMatrixAt(i * 4 + part, o.matrix);
      }
      const showBar = alive && !hidden && b.hp < kind.hp, ratio = Math.max(0, b.hp / kind.hp);
      o.position.set(b.x, b.y + scale + .5, b.z); o.quaternion.copy(camQuat); o.scale.set(showBar ? 1.2 : 0, showBar ? .1 : 0, 1); o.updateMatrix(); barBack.current?.setMatrixAt(i, o.matrix);
      o.translateX(-(1 - ratio) * .6); o.scale.set(showBar ? 1.2 * ratio : 0, showBar ? .1 : 0, 1); o.updateMatrix(); barFill.current?.setMatrixAt(i, o.matrix);
      o.quaternion.identity();
    });
    for (const mesh of [shell, halo, eyes, limbs, xray, barBack, barFill]) {
      if (!mesh.current) continue; mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }
    if (xray.current) xray.current.visible = scan;
    if (orbMesh.current) {
      for (let i = 0; i < 25; i++) { const orb = orbs.current[i]; o.position.copy(orb?.p ?? tmp.v.set(0, -50, 0)); o.rotation.set(0, 0, 0); o.scale.setScalar(orb ? .28 : 0); o.updateMatrix(); orbMesh.current.setMatrixAt(i, o.matrix); }
      orbMesh.current.instanceMatrix.needsUpdate = true;
    }

    // Data crates.
    let prompt = '';
    spawns.forEach(([x, z], i) => {
      const lid = lids.current[i], beacon = beacons.current[i], isOpen = opened.current.has(i);
      if (lid) lid.rotation.x = THREE.MathUtils.damp(lid.rotation.x, isOpen ? -1.9 : 0, 8, dt);
      if (beacon) { beacon.visible = !isOpen; beacon.scale.x = beacon.scale.z = 1 + Math.sin(r.time * 4 + i) * .15; }
      if (isOpen || !t.landed || Math.hypot(p.x - x - 3, p.z - z) > 3.5) return;
      prompt = `ABRIR DATA CRATE · ${weapons[i].name.toUpperCase()}`;
      if (!k.has('KeyE')) return;
      opened.current.add(i);
      const unlocked = [...new Set([...s.unlocked, i])];
      useDrop.setState({ unlocked, opened: [...opened.current], weapon: i, ammo: weapons[i].ammo, credits: useDrop.getState().credits + 100 });
      s.notify(`DATA CRATE · ${weapons[i].name.toUpperCase()} DESBLOQUEADO`); s.pushFeed(`+100 · ${weapons[i].short} EN SLOT ${i + 1}`);
      r.hp = Math.min(100, r.hp + 25); r.shield = Math.min(100, r.shield + 40); t.reload = 0;
      burst(x + 3, 1, z, 40, '#ffb35c', 8); shockwave(x + 3, .1, z, '#ffb35c', 5); sfx.pickup();
    });
    k.delete('KeyE');
    if (prompt !== r.prompt) { r.prompt = prompt; useDrop.setState({ prompt }); }

    // Ability and firewall visuals.
    if (wall.current) wall.current.scale.set(radius, 1, radius);
    if (shieldMesh.current) { shieldMesh.current.position.set(p.x, p.y, p.z); shieldMesh.current.visible = t.shield > 0; shieldMesh.current.rotation.y += dt; }
    if (scanMesh.current) { scanMesh.current.position.set(p.x, .15, p.z); scanMesh.current.visible = scan; scanMesh.current.scale.setScalar(((4 - t.scan) % 1) * 30 + 1); }

    // HUD sync at 10 Hz (and immediately on kills) instead of every frame.
    radar.x = p.x; radar.z = p.z; radar.yaw = m.yaw;
    radar.mates = pvp ? [] : [...remotes.values()].filter(x => x.alive && x.y > -40).map(x => ({ x: x.x, z: x.z, slot: x.slot }));
    if (online) {
      t.sync -= dt; t.bugSync -= dt;
      if (t.sync <= 0) { t.sync = 1 / 15; send({ t: 'state', s: { id: net.id, x: round1(p.x), y: round1(p.y), z: round1(p.z), yaw: Math.round(m.yaw * 100) / 100, hp: Math.round(r.hp), alive: !t.dead, w: s.weapon } }); }
      if (authority && t.bugSync <= 0) { t.bugSync = 1 / 12; send({ t: 'bugs', b: bugs.current.flatMap(b => [round1(b.x), round1(b.z), Math.round(b.hp)]) }); }
    }
    t.flush -= dt;
    const solo = matchResult(r.hp, r.kills, radius);
    const wiped = online && authority && t.dead && [...remotes.values()].every(x => !x.alive);
    const result = pvp ? null : online ? (r.kills >= TOTAL_BUGS && radius <= 8 ? 'win' : wiped ? 'over' : null) : solo;
    // Battle royale: the host declares the last agent standing.
    const standing = [...(t.dead ? [] : [net.id]), ...[...remotes.values()].filter(x => x.alive).map(x => x.id)];
    if (pvp && authority && r.time > 4 && standing.length <= 1 && !t.ended) {
      const id = standing[0] ?? t.lastBy ?? net.id;
      send({ t: 'winner', id }); useDrop.setState({ winner: id === net.id ? s.playerName || 'TÚ' : remotes.get(id)?.name ?? 'AGENTE' }); finish(id === net.id ? 'win' : 'over');
    }
    if (t.flush <= 0 || r.kills !== s.kills || result) {
      t.flush = .1;
      useDrop.setState({ hp: Math.max(0, r.hp), shield: r.shield, time: r.time, radius, kills: r.kills, cooldown: r.cooldown, reload: t.reload > 0 ? 1 - t.reload / 1.3 : 0, respawn: t.dead && !pvp ? Math.ceil(t.respawn) : 0, alive: standing.length });
    }
    if (result) { if (online && authority) send({ t: 'end', result }); finish(result); }
  });

  return <>
    <CombatEffects />
    <RigidBody ref={body} colliders={false} position={[spawn[0], DROP_HEIGHT, spawn[1]]} enabledRotations={[false, false, false]} gravityScale={.45} ccd>
      <CapsuleCollider args={[.4, .35]} />
      <group ref={cat} position={[0, -.75, 0]}><Cat /></group>
      <group ref={capsule}>
        <mesh><capsuleGeometry args={[1, 2, 8, 16]} /><meshBasicMaterial color={new THREE.Color('#ff7a00').multiplyScalar(2)} wireframe transparent opacity={.35} toneMapped={false} /></mesh>
        <mesh position={[0, 3.5, 0]}><coneGeometry args={[.9, 6, 16, 1, true]} /><meshBasicMaterial color={new THREE.Color('#ffb35c').multiplyScalar(2)} transparent opacity={.18} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        <pointLight color="#ff7a00" intensity={60} distance={14} />
      </group>
    </RigidBody>
    <pointLight ref={muzzle} intensity={0} distance={8} decay={2} />
    <instancedMesh ref={shell} args={[undefined, undefined, TOTAL_BUGS]} castShadow frustumCulled={false}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#1a1f28" metalness={.85} roughness={.28} flatShading /></instancedMesh>
    <instancedMesh ref={xray} args={[undefined, undefined, TOTAL_BUGS]} frustumCulled={false} renderOrder={10}><dodecahedronGeometry args={[1.05, 0]} /><meshBasicMaterial wireframe transparent opacity={.7} depthTest={false} toneMapped={false} /></instancedMesh>
    <instancedMesh ref={halo} args={[undefined, undefined, TOTAL_BUGS]} frustumCulled={false}><torusGeometry args={[.82, .05, 6, 40]} /><meshBasicMaterial toneMapped={false} /></instancedMesh>
    <instancedMesh ref={eyes} args={[undefined, undefined, TOTAL_BUGS]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial toneMapped={false} /></instancedMesh>
    <instancedMesh ref={limbs} args={[undefined, undefined, TOTAL_BUGS * 4]} castShadow frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#59667a" metalness={.8} roughness={.3} /></instancedMesh>
    <instancedMesh ref={barBack} args={[undefined, undefined, TOTAL_BUGS]} frustumCulled={false} renderOrder={11}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#05070b" transparent opacity={.7} depthTest={false} /></instancedMesh>
    <instancedMesh ref={barFill} args={[undefined, undefined, TOTAL_BUGS]} frustumCulled={false} renderOrder={12}><planeGeometry args={[1, 1]} /><meshBasicMaterial color={new THREE.Color('#ff5a3c').multiplyScalar(2)} depthTest={false} toneMapped={false} /></instancedMesh>
    <instancedMesh ref={orbMesh} args={[undefined, undefined, 25]} frustumCulled={false}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color={new THREE.Color('#c77dff').multiplyScalar(5)} toneMapped={false} /></instancedMesh>
    <mesh ref={wall} position={[0, 6, 0]} material={firewall}><cylinderGeometry args={[1, 1, 12, 128, 1, true]} /></mesh>
    <mesh ref={shieldMesh} visible={false}><icosahedronGeometry args={[1.6, 2]} /><meshBasicMaterial color={new THREE.Color('#ffad42').multiplyScalar(2)} wireframe transparent opacity={.35} toneMapped={false} /></mesh>
    <mesh ref={scanMesh} rotation={[-Math.PI / 2, 0, 0]} visible={false}><ringGeometry args={[.96, 1, 96]} /><meshBasicMaterial color={new THREE.Color('#ff7a00').multiplyScalar(3)} transparent opacity={.7} toneMapped={false} /></mesh>
    {spawns.map(([x, z], i) => <group key={i} position={[x + 3, .45, z]}>
      <mesh castShadow receiveShadow><boxGeometry args={[1.4, .8, 1]} /><meshStandardMaterial color="#2a3644" metalness={.85} roughness={.25} /></mesh>
      <mesh position={[0, 0, -.51]}><boxGeometry args={[1.1, .06, .02]} /><meshBasicMaterial color={new THREE.Color('#ff7a00').multiplyScalar(4)} toneMapped={false} /></mesh>
      <group ref={el => { lids.current[i] = el; }} position={[0, .4, .55]}><mesh position={[0, .1, -.55]} castShadow><boxGeometry args={[1.5, .2, 1.1]} /><meshStandardMaterial color="#8295a6" metalness={.8} roughness={.25} /></mesh></group>
      <mesh ref={el => { beacons.current[i] = el; }} position={[0, 8, 0]}><cylinderGeometry args={[.35, .5, 16, 16, 1, true]} /><meshBasicMaterial color={new THREE.Color('#ff9a3c').multiplyScalar(1.2)} transparent opacity={.1} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>)}
  </>;
}
