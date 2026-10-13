import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();
function canvasTexture(key: string, width: number, height: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const hit = cache.get(key); if (hit) return hit;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  if (repeat) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(...repeat); }
  cache.set(key, texture); return texture;
}

/** Facade with a deterministic pattern of lit windows; the same texture feeds map and emissiveMap. */
export function windowTexture(cols: number, rows: number, seed = 1, warm = .25) {
  return canvasTexture(`win${cols}-${rows}-${seed}-${warm}`, cols * 16, rows * 24, g => {
    let r = seed * 9301;
    const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = '#05080d'; g.fillRect(0, 0, cols * 16, rows * 24);
    g.fillStyle = '#0a1018'; for (let y = 0; y < rows; y += 3) g.fillRect(0, y * 24, cols * 16, 2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = rand();
      const lit = v > .72;
      g.fillStyle = !lit ? '#0d141e' : v < .72 + warm * .28 ? '#ff9a4a' : v < .985 ? '#7fb2dc' : '#ffffff';
      g.globalAlpha = !lit ? 1 : .25 + rand() * .55;
      g.fillRect(x * 16 + 5, y * 24 + 7, 6, 11);
    }
    g.globalAlpha = 1;
  });
}

export function groundTexture() {
  return canvasTexture('ground', 512, 512, g => {
    g.fillStyle = '#121a24'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .025})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    g.strokeStyle = '#ffffff10'; g.lineWidth = 2;
    for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
    g.strokeStyle = '#ffffff06'; g.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  }, [25, 25]);
}

export function firewallMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#8a3dff') } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; uniform vec3 color; varying vec2 vUv;
      void main(){
        float lines = smoothstep(.92, 1., fract(vUv.y * 28. - time * .6));
        float columns = smoothstep(.97, 1., fract(vUv.x * 240.));
        float pulse = .5 + .5 * sin(vUv.x * 60. + time * 2.);
        float fade = pow(1. - vUv.y, 1.6);
        float base = smoothstep(.12, 0., vUv.y) * 2.5;
        float a = clamp(fade * (.38 + lines * .35 + columns * .3 * pulse) + base * .3, 0., .85);
        gl_FragColor = vec4(mix(color, vec3(.85, .7, 1.), lines * .5), a);
      }`,
  });
}

/** Daytime sky dome: deep blue zenith, pale horizon and a warm sun disc with halo. */
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true,
    uniforms: { sun: { value: new THREE.Vector3(-.6, .42, .5).normalize() } },
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 sun; varying vec3 vPos;
      void main(){
        float h = clamp(vPos.y, -.2, 1.);
        vec3 zenith = vec3(.19, .40, .65), horizon = vec3(.95, .78, .59), ground = vec3(.42, .53, .38);
        vec3 c = mix(horizon, zenith, pow(smoothstep(0., 1., h), .7));
        c = mix(ground, c, smoothstep(-.12, .02, h));
        float d = max(dot(normalize(vPos), sun), 0.);
        c += vec3(1., .9, .7) * (pow(d, 600.) * 4. + pow(d, 24.) * .35);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

const wallPalette = ['#d9c5a1', '#ce8666', '#679a96', '#97b6c4', '#dfb88a', '#e9e5dc', '#9586b0', '#638da6', '#b68c90', '#9fae87'];

/** Daylight facade: colored wall, framed blue-glass windows and a slab line every few floors. */
export function dayFacadeTexture(cols: number, rows: number, seed = 1) {
  const wall = wallPalette[seed % wallPalette.length];
  return canvasTexture(`day${cols}-${rows}-${seed}`, cols * 32, rows * 40, g => {
    let r = seed * 7919;
    const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = wall; g.fillRect(0, 0, cols * 32, rows * 40);
    g.fillStyle = '#00000014'; for (let y = 0; y < rows; y += 2) g.fillRect(0, y * 40 + 36, cols * 32, 4);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      g.fillStyle = '#ffffff'; g.fillRect(x * 32 + 5, y * 40 + 6, 22, 26);
      const glass = g.createLinearGradient(0, y * 40 + 8, 0, y * 40 + 30);
      const lit = rand() > .85;
      glass.addColorStop(0, lit ? '#fff4c9' : '#658d9c'); glass.addColorStop(1, lit ? '#ffd27a' : '#203d53');
      g.fillStyle = glass; g.fillRect(x * 32 + 7, y * 40 + 8, 18, 22);
      g.fillStyle = '#ffffff66'; g.fillRect(x * 32 + 8, y * 40 + 9, 5, 20);
    }
  });
}

/** Stylized grass: saturated green with soft blotches and blade strokes. */
export function grassTexture() {
  return canvasTexture('grass', 512, 512, g => {
    g.fillStyle = '#668359'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60; i++) { g.fillStyle = Math.random() > .5 ? '#819866' : '#526e48'; g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 50, 0, Math.PI * 2); g.globalAlpha = .35; g.fill(); }
    g.globalAlpha = 1;
    for (let i = 0; i < 3500; i++) { g.fillStyle = Math.random() > .5 ? '#94a777' : '#59724d'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 5); }
  }, [18, 18]);
}

/** Asphalt with subtle grain for roads. */
export function asphaltTexture(direction: 'v' | 'h') {
  return canvasTexture(`asphalt-${direction}`, 256, 256, g => {
    g.fillStyle = '#5a6069'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() > .5 ? '#676e78' : '#4c525a'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  }, direction === 'v' ? [2, 25] : [25, 2]);
}

/** Orange tabby fur: warm base, darker wavy stripes and soft speckle. */
export function furTexture() {
  return canvasTexture('fur', 256, 256, g => {
    g.fillStyle = '#f2892c'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i++) { g.fillStyle = Math.random() > .5 ? '#ffb46e33' : '#c75d1433'; g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 4); }
    g.strokeStyle = '#c65a16'; g.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const x = i * 18.3 + 6; g.lineWidth = 3 + (i % 3) * 2; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= 110; y += 10) g.lineTo(x + Math.sin(y * .06 + i) * 5, y);
      g.stroke();
    }
  });
}

/** Pumpkin onesie with the jack-o'-lantern face centered on the -Z side of a sphere (u = .75). */
export function onesieTexture() {
  return canvasTexture('onesie', 512, 256, g => {
    g.fillStyle = '#ff7a12'; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#e8650a55'; g.fillRect(i * 64 + 30, 0, 6, 256); }
    const cx = 384; g.fillStyle = '#111';
    const tri = (x: number, y: number, w: number, h: number) => { g.beginPath(); g.moveTo(x - w / 2, y + h / 2); g.lineTo(x, y - h / 2); g.lineTo(x + w / 2, y + h / 2); g.fill(); };
    tri(cx - 34, 92, 36, 30); tri(cx + 34, 92, 36, 30); tri(cx, 122, 18, 16);
    g.beginPath(); g.moveTo(cx - 60, 140); g.quadraticCurveTo(cx, 200, cx + 60, 140); g.quadraticCurveTo(cx, 165, cx - 60, 140); g.fill();
    g.fillStyle = '#ff7a12'; g.fillRect(cx - 22, 150, 12, 12); g.fillRect(cx + 10, 150, 12, 12);
  });
}

/** Monova "M" badge used on the helmet plate and headphone cups. */
export function badgeTexture() {
  return canvasTexture('badge', 256, 256, g => {
    g.fillStyle = '#121212'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ff7a12'; g.font = '900 190px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('M', 128, 140);
  });
}

/** Radial amber iris with deterministic fibers, shared by every Monova. */
export function irisTexture() {
  return canvasTexture('monova-iris', 256, 256, g => {
    const gradient = g.createRadialGradient(128, 128, 24, 128, 128, 128);
    gradient.addColorStop(0, '#61300e'); gradient.addColorStop(.3, '#b6681f');
    gradient.addColorStop(.66, '#e7ae50'); gradient.addColorStop(.88, '#9b652c'); gradient.addColorStop(1, '#302219');
    g.fillStyle = gradient; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 180; i++) {
      const angle = i * Math.PI * 2 / 180;
      g.strokeStyle = i % 3 ? '#ffe6a54a' : '#67380b80'; g.lineWidth = i % 3 ? 1 : 2;
      g.beginPath(); g.moveTo(128 + Math.cos(angle) * 43, 128 + Math.sin(angle) * 43);
      g.lineTo(128 + Math.cos(angle + .018) * (108 + i % 17), 128 + Math.sin(angle + .018) * (108 + i % 17)); g.stroke();
    }
  });
}
