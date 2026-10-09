// Synthesized Web Audio: no audio files to load, every sound is built from oscillators and filtered noise.
let ctx: AudioContext | undefined, master: GainNode | undefined, noise: AudioBuffer | undefined, drone: { stop: () => void } | undefined;
let muted = false;

function boot() {
  if (typeof window === 'undefined') return;
  ctx ??= new AudioContext();
  if (!master) {
    master = ctx.createGain(); master.gain.value = muted ? 0 : .7;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  void ctx.resume();
  return ctx;
}

function osc(type: OscillatorType, from: number, to: number, duration: number, volume: number, delay = 0) {
  const a = boot(); if (!a || !master) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + duration);
  g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + duration + .02);
}

function hiss(filter: BiquadFilterType, frequency: number, duration: number, volume: number, delay = 0, q = 1) {
  const a = boot(); if (!a || !master || !noise) return;
  const t = a.currentTime + delay, src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noise; f.type = filter; f.frequency.value = frequency; f.Q.value = q;
  g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
  src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random() * .5); src.stop(t + duration + .02);
}

const shots: Array<() => void> = [
  () => { hiss('bandpass', 2400, .09, .35, 0, 1.5); osc('square', 900, 180, .08, .07); },
  () => { hiss('highpass', 3000, .05, .22); osc('sawtooth', 520, 140, .05, .05); },
  () => { hiss('lowpass', 900, .45, .7); osc('sine', 120, 35, .4, .45); osc('sawtooth', 300, 60, .25, .08); },
  () => { hiss('bandpass', 1400, .16, .45, 0, 2); osc('triangle', 420, 90, .14, .18); },
  () => { osc('sine', 1600, 1200, .05, .05); hiss('highpass', 5000, .03, .08); },
];

export const sfx = {
  setMuted(value: boolean) { muted = value; if (master && ctx) master.gain.setTargetAtTime(value ? 0 : .7, ctx.currentTime, .05); },
  shot(weapon: number) { shots[weapon]?.(); },
  hit() { osc('square', 1800, 1400, .04, .05); },
  kill() { osc('square', 880, 1760, .07, .07); osc('square', 1320, 2640, .09, .06, .06); hiss('bandpass', 700, .3, .3, 0, .8); },
  hurt() { osc('sine', 160, 50, .22, .45); hiss('lowpass', 500, .18, .35); },
  impact() { hiss('bandpass', 3200, .04, .12, 0, 3); },
  reload() { osc('square', 300, 280, .03, .06); osc('square', 520, 500, .04, .07, .55); hiss('highpass', 4000, .05, .1, .58); },
  empty() { osc('square', 1200, 1100, .02, .04); },
  pickup() { [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, f, .14, .09, i * .06)); },
  ability() { osc('sawtooth', 200, 1600, .35, .08); hiss('bandpass', 1500, .4, .2, 0, .6); },
  jump() { osc('sine', 220, 440, .12, .1); },
  land() { osc('sine', 90, 30, .5, .6); hiss('lowpass', 400, .6, .5); },
  enemyShot() { osc('sawtooth', 700, 200, .18, .05); },
  ui() { osc('sine', 1400, 1300, .03, .04); },
  deploy() { osc('sawtooth', 80, 400, 1.2, .1); hiss('bandpass', 800, 1.4, .25, 0, .5); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => osc('triangle', f, f, .5, .1, i * .12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => osc('sawtooth', f, f * .98, .45, .07, i * .18)); },
  drone(on: boolean) {
    if (!on) { drone?.stop(); drone = undefined; return; }
    const a = boot(); if (!a || !master || drone) return;
    const g = a.createGain(), f = a.createBiquadFilter(), lfo = a.createOscillator(), depth = a.createGain();
    g.gain.setValueAtTime(0, a.currentTime); g.gain.linearRampToValueAtTime(.06, a.currentTime + 3);
    f.type = 'lowpass'; f.frequency.value = 420; lfo.frequency.value = .08; depth.gain.value = 260;
    lfo.connect(depth); depth.connect(f.frequency); f.connect(g); g.connect(master);
    const voices = [55, 55.4, 82.4].map(freq => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.connect(f); o.start(); return o; });
    lfo.start();
    drone = { stop: () => { const t = a.currentTime; g.gain.setTargetAtTime(0, t, .4); [...voices, lfo].forEach(o => o.stop(t + 2)); } };
  },
};
