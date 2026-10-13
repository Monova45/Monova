"use client";
import { useEffect, useRef, useState } from 'react';
import { screen } from './effects';
import { TOTAL_BUGS, abilities, districts, hudBus, radar, rarities, spawns, useDrop, weapons } from './state';
import { net, remotes, slotColors } from './net';
import { AbilityIcon, BugIcon, HealthIcon, PlayersIcon, ShieldIcon, SkullIcon, StormIcon, WeaponIcon } from './icons';
import styles from './ui.module.css';

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
const clock = (seconds: number) => `${pad(seconds / 60)}:${pad(seconds % 60)}`;

function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const c = canvas.current?.getContext('2d'); if (!c) return;
      const size = 300, k = size / 100, cx = (x: number) => size / 2 + x * k, s = useDrop.getState();
      c.clearRect(0, 0, size, size);
      c.save();
      c.fillStyle = '#233c43'; c.fillRect(0, 0, size, size);
      c.fillStyle = '#29464b'; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if ((i + j) % 2) c.fillRect(i * 30, j * 30, 30, 30);
      c.strokeStyle = '#647b84'; c.lineWidth = 8 * k;
      [-36, -12, 12, 36].forEach(n => { c.beginPath(); c.moveTo(cx(n), 0); c.lineTo(cx(n), size); c.moveTo(0, cx(n)); c.lineTo(size, cx(n)); c.stroke(); });
      c.strokeStyle = '#a9c8cc20'; c.lineWidth = 1;
      for (let grid = 0; grid <= size; grid += 30) { c.beginPath(); c.moveTo(grid, 0); c.lineTo(grid, size); c.moveTo(0, grid); c.lineTo(size, grid); c.stroke(); }
      c.fillStyle = '#8152b37a'; c.beginPath(); c.rect(0, 0, size, size); c.arc(size / 2, size / 2, s.radius * k, 0, Math.PI * 2, true); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.arc(size / 2, size / 2, s.radius * k, 0, Math.PI * 2); c.stroke();
      spawns.forEach(([x, z], i) => {
        if (s.opened.includes(i)) return;
        c.fillStyle = '#ffd23f'; c.strokeStyle = '#1b1b1b'; c.lineWidth = 3;
        c.beginPath(); c.roundRect(cx(x + 3) - 7, cx(z) - 6, 14, 12, 3); c.fill(); c.stroke();
      });
      radar.bugs.forEach(b => { if (!b.alive || Math.hypot(b.x - radar.x, b.z - radar.z) > 30) return; c.fillStyle = '#ff3b4a'; c.beginPath(); c.arc(cx(b.x), cx(b.z), 5, 0, Math.PI * 2); c.fill(); });
      radar.mates.forEach(mate => { c.fillStyle = slotColors[mate.slot]; c.strokeStyle = '#07101b'; c.lineWidth = 3; c.beginPath(); c.arc(cx(mate.x), cx(mate.z), 7, 0, Math.PI * 2); c.fill(); c.stroke(); });
      c.translate(cx(radar.x), cx(radar.z)); c.rotate(-radar.yaw);
      c.fillStyle = '#ffffff40'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 60, -Math.PI / 2 - .5, -Math.PI / 2 + .5); c.fill();
      c.fillStyle = '#fff'; c.strokeStyle = '#1b1b1b'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -14); c.lineTo(10, 10); c.lineTo(0, 5); c.lineTo(-10, 10); c.closePath(); c.stroke(); c.fill();
      c.restore();
    };
    draw(); return () => cancelAnimationFrame(frame);
  }, []);
  return <div className={styles.map}><canvas ref={canvas} width={300} height={300} />
    {districts.map((d, i) => <b key={d} style={{ left: `${50 + spawns[i][0]}%`, top: `${50 + spawns[i][1] - 8}%` }}>{d.replace('MONOVA ', '')}</b>)}
  </div>;
}

function Crosshair() {
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const play = (kill: boolean) => () => { const el = marker.current; if (!el) return; el.dataset.kill = String(kill); el.classList.remove(styles.hitOn); void el.offsetWidth; el.classList.add(styles.hitOn); };
    const hit = play(false), kill = play(true);
    hudBus.addEventListener('hit', hit); hudBus.addEventListener('kill', kill);
    return () => { hudBus.removeEventListener('hit', hit); hudBus.removeEventListener('kill', kill); };
  }, []);
  const reload = useDrop(s => s.reload);
  return <div className={styles.cross}>
    <i /><i /><i /><i />
    <div ref={marker} className={styles.hitmarker} />
    {reload > 0 && <svg className={styles.reloadRing} viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" pathLength={1} strokeDasharray={`${reload} 1`} /></svg>}
  </div>;
}

/** Red vignette driven by screen.hurt plus arcs pointing at the source of damage. */
function DamageLayer() {
  const vignette = useRef<HTMLDivElement>(null);
  const [arcs, setArcs] = useState<{ id: number; angle: number }[]>([]);
  useEffect(() => {
    let frame = 0, id = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const s = useDrop.getState(), low = s.hp < 30 ? (Math.sin(performance.now() / 180) + 1) * .18 : 0;
      if (vignette.current) vignette.current.style.opacity = String(Math.min(1, screen.hurt + low));
    };
    const hurt = (e: Event) => {
      const angle = (e as CustomEvent<number>).detail, next = ++id;
      setArcs(a => [...a.slice(-3), { id: next, angle }]);
      setTimeout(() => setArcs(a => a.filter(x => x.id !== next)), 900);
    };
    tick(); hudBus.addEventListener('hurt', hurt);
    return () => { cancelAnimationFrame(frame); hudBus.removeEventListener('hurt', hurt); };
  }, []);
  return <><div ref={vignette} className={styles.hurt} />
    {arcs.map(a => <div key={a.id} className={styles.arc} style={{ transform: `translate(-50%,-50%) rotate(${-a.angle * 180 / Math.PI + 180}deg)` }}><i /></div>)}</>;
}

function Bar({ value, tone }: { value: number; tone: 'hp' | 'shield' }) {
  const Icon = tone === 'hp' ? HealthIcon : ShieldIcon;
  return <div className={styles.bar} data-tone={tone} data-low={tone === 'hp' && value < 30}>
    <Icon className={styles.barIcon} />
    <div className={styles.barTrack}><u style={{ width: `${Math.max(0, value)}%` }} /><i /><i /><i /></div>
    <b>{Math.ceil(value)}</b><small>| 100</small>
  </div>;
}

/** Floating damage numbers at the projected hit point. */
function DamageNumbers() {
  const [items, setItems] = useState<{ id: number; x: number; y: number; amount: number; tone: string }[]>([]);
  useEffect(() => {
    let id = 0;
    const add = (e: Event) => {
      const d = (e as CustomEvent<{ x: number; y: number; amount: number; tone: string }>).detail, next = ++id;
      setItems(list => [...list.slice(-10), { ...d, id: next, x: d.x + (Math.random() - .5) * .02 }]);
      setTimeout(() => setItems(list => list.filter(i => i.id !== next)), 900);
    };
    hudBus.addEventListener('damage', add); return () => hudBus.removeEventListener('damage', add);
  }, []);
  return <>{items.map(i => <span key={i.id} className={styles.dmg} data-tone={i.tone} style={{ left: `${i.x * 100}%`, top: `${i.y * 100}%` }}>{Math.round(i.amount)}</span>)}</>;
}

/** Heading strip: cardinal points and district bearings slide as the camera turns. */
function Compass() {
  const strip = useRef<HTMLDivElement>(null), label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      // yaw 0 faces -Z (north on the minimap); heading grows clockwise.
      const heading = ((-radar.yaw * 180 / Math.PI) % 360 + 360) % 360;
      if (strip.current) strip.current.style.transform = `translateX(${-heading * 4}px)`;
      if (label.current) label.current.textContent = String(Math.round(heading) % 360).padStart(3, '0');
    };
    tick(); return () => cancelAnimationFrame(frame);
  }, []);
  const marks = [];
  for (let d = -180; d <= 540; d += 15) {
    const n = ((d % 360) + 360) % 360;
    marks.push(<i key={d} style={{ left: d * 4 }} data-major={n % 45 === 0}>{n === 0 ? 'N' : n === 90 ? 'E' : n === 180 ? 'S' : n === 270 ? 'O' : n % 45 === 0 ? n : ''}</i>);
  }
  return <div className={styles.compass}><div ref={strip}>{marks}</div><span ref={label}>000</span></div>;
}

/** Center banner for eliminations and match events. */
function Banner() {
  const [banner, setBanner] = useState<{ id: number; text: string; tone: string } | null>(null);
  useEffect(() => {
    let id = 0;
    const show = (e: Event) => { const { text, tone } = (e as CustomEvent<{ text: string; tone: string }>).detail; setBanner({ id: ++id, text, tone }); };
    hudBus.addEventListener('banner', show); return () => hudBus.removeEventListener('banner', show);
  }, []);
  if (!banner) return null;
  return <div key={banner.id} className={styles.banner} data-tone={banner.tone}><small>{banner.tone === 'kill' ? 'ELIMINACIÓN' : 'SISTEMA'}</small><strong>{banner.text}</strong></div>;
}

/** Opening title card shown during the drop. */
function MatchIntro({ pvp, players }: { pvp: boolean; players: number }) {
  const spawn = useDrop(s => s.spawn);
  return <div className={styles.intro}>
    <small>{pvp ? 'MODO BATALLA' : players > 1 ? 'CO-OP' : 'CAMPAÑA'}</small>
    <strong>{pvp ? `${players} AGENTES · 1 GANADOR` : `ELIMINA ${TOTAL_BUGS} BUGS`}</strong>
    <span>{pvp ? 'ÚLTIMO EN PIE GANA · EL FIREWALL SE CIERRA' : `ATERRIZAJE · ${districts[spawn]}`}</span>
  </div>;
}

/** Kill streak callouts: kills within 3 s of each other chain into a combo. */
function Streak() {
  const [streak, setStreak] = useState<{ id: number; n: number } | null>(null);
  useEffect(() => {
    let count = 0, last = 0, id = 0;
    const kill = () => {
      const now = performance.now(); count = now - last < 3000 ? count + 1 : 1; last = now;
      if (count >= 2) setStreak({ id: ++id, n: count });
    };
    hudBus.addEventListener('kill', kill); return () => hudBus.removeEventListener('kill', kill);
  }, []);
  if (!streak) return null;
  const label = streak.n === 2 ? 'DOBLE BAJA' : streak.n === 3 ? 'TRIPLE BAJA' : streak.n === 4 ? 'CUÁDRUPLE' : 'IMPARABLE';
  return <div key={streak.id} className={styles.streak}><strong>{label}</strong><small>x{streak.n} COMBO</small></div>;
}

/** Teammates' health, refreshed a few times per second from the network snapshots. */
function Team() {
  const lobby = useDrop(s => s.lobby);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 250); return () => clearInterval(id); }, []);
  const rivals = useDrop(s => s.matchMode) === 'pvp';
  const mates = lobby.filter(p => p.id !== net.id);
  if (!mates.length) return null;
  return <div className={styles.team}>{mates.map(p => {
    const r = remotes.get(p.id), hp = r?.hp ?? 0, down = !r?.alive;
    if (rivals) return <div key={p.id} data-down={down}><i style={{ background: slotColors[p.slot] }} /><span>{p.name || 'AGENTE'}</span><b>{down ? 'CAÍDO' : 'VIVO'}</b></div>;
    return <div key={p.id} data-down={down}><i style={{ background: slotColors[p.slot] }} /><span>{p.name || 'AGENTE'}</span><b>{down ? 'CAÍDO' : Math.ceil(hp)}</b><em><u style={{ width: `${down ? 0 : hp}%`, background: slotColors[p.slot] }} /></em></div>;
  })}</div>;
}

export function Hud() {
  const hp = useDrop(s => s.hp), shield = useDrop(s => s.shield), kills = useDrop(s => s.kills), time = useDrop(s => s.time), radius = useDrop(s => s.radius);
  const weapon = useDrop(s => s.weapon), ammo = useDrop(s => s.ammo), unlocked = useDrop(s => s.unlocked), ability = useDrop(s => s.ability), cooldown = useDrop(s => s.cooldown);
  const notice = useDrop(s => s.notice), noticeId = useDrop(s => s.noticeId), prompt = useDrop(s => s.prompt), outside = useDrop(s => s.outside), feed = useDrop(s => s.feed);
  const respawn = useDrop(s => s.respawn), alive = useDrop(s => s.alive), spectating = useDrop(s => s.spectating), lobbySize = useDrop(s => s.lobby.length), pkills = useDrop(s => s.pkills);
  const pvp = useDrop(s => s.matchMode) === 'pvp' && net.mode !== 'solo';
  const w = weapons[weapon], closing = Math.max(0, (radius - 8) / .23 / (pvp ? 1.5 : 1));
  return <div className={styles.hud}>
    <DamageLayer />
    {outside && <div className={styles.storm} />}
    <Compass />
    <div className={styles.mapStack}>
      <Minimap />
      <div className={styles.stats}>
        <span data-tone="storm"><StormIcon />{closing > 0 ? clock(closing) : 'CERRADA'}</span>
        {pvp ? <span><PlayersIcon />{alive}</span> : <span><BugIcon />{TOTAL_BUGS - kills}</span>}
        <span><SkullIcon />{pvp ? pkills : kills}</span>
      </div>
      <p className={styles.stormText}>{closing > 0 ? `LA TORMENTA SE CIERRA · ${Math.round(radius)} M` : 'ZONA FINAL'}</p>
    </div>
    {outside && <div className={styles.warning}>ESTÁS EN LA TORMENTA · REGRESA A LA ZONA SEGURA</div>}
    <Team />
    <div className={styles.feed}>{feed.map(f => <p key={f.id}>{f.text}</p>)}</div>
    {pvp && hp <= 0 && <div className={styles.spectate}><small>ELIMINADO · ESPECTANDO</small><strong>{spectating ? spectating.toUpperCase() : 'ESPERANDO RESULTADO'}</strong></div>}
    {respawn > 0 && <div className={styles.respawn}><small>AGENTE CAÍDO</small><strong>{respawn}</strong><span>REDESPLIEGUE EN CURSO</span></div>}
    <Banner />
    {time < 4 && <MatchIntro pvp={pvp} players={Math.max(1, lobbySize)} />}
    <Crosshair />
    <DamageNumbers />
    <Streak />
    {notice && <p key={noticeId} className={styles.notice}>{notice}</p>}
    {prompt && <p className={styles.prompt}><kbd>E</kbd>{prompt}</p>}
    <div className={styles.vitals}>
      <div className={styles.ability} style={{ '--cd': cooldown / 15 } as React.CSSProperties} data-ready={cooldown <= 0}>
        <div className={styles.abilityIcon}><AbilityIcon index={ability} /><kbd>Q</kbd>{cooldown > 0 && <span>{Math.ceil(cooldown)}</span>}</div>
        <small>{abilities[ability].name}</small>
      </div>
      <Bar value={shield} tone="shield" />
      <Bar value={hp} tone="hp" />
    </div>
    <div className={styles.inventory}>
      <div className={styles.weaponInfo}>
        <small style={{ color: rarities[w.rarity].color }}>{rarities[w.rarity].label}</small>
        <b>{w.name}</b>
        <span data-low={ammo <= w.ammo * .25}><strong>{ammo}</strong> | {w.ammo}</span>
        {ammo <= w.ammo * .25 && <em>{ammo === 0 ? 'RECARGA · R' : 'MUNICIÓN BAJA'}</em>}
      </div>
      <div className={styles.slots}>{weapons.map((x, i) => {
        const has = unlocked.includes(i), r = rarities[x.rarity];
        return <div key={x.name} data-active={weapon === i} data-locked={!has} style={{ '--r': r.color, '--rd': r.dark } as React.CSSProperties}>
          {has && <WeaponIcon index={i} />}<kbd>{i + 1}</kbd>{has && weapon === i && <small>{ammo}</small>}
        </div>;
      })}</div>
    </div>
  </div>;
}
