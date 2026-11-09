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

/** Soft tabby pigment; the fine fibers live in the bump map and silhouette groom. */
export function furTexture() {
  return canvasTexture('fur-soft-tabby', 512, 512, g => {
    let state = 181;
    const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
    const base = g.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, '#e58432'); base.addColorStop(.38, '#f5a44c');
    base.addColorStop(.73, '#ef8c36'); base.addColorStop(1, '#e98a37');
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);

    // Broken, softly edged crown stripes keep the cheeks open and expressive.
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 12; i++) {
      const x = i * 44 - 3, end = 145 + (i % 4) * 24;
      g.beginPath(); g.moveTo(x, -20);
      g.bezierCurveTo(x - 16, 42, x + 20, end * .66, x - 4, end);
      g.strokeStyle = '#aa54271e'; g.lineWidth = 22; g.stroke();
      g.strokeStyle = '#aa542766'; g.lineWidth = 12 - i % 3; g.stroke();
      g.strokeStyle = '#b7612e55'; g.lineWidth = 5; g.stroke();
    }
    // Low contrast color threads avoid the peppered noise of individual dark dots.
    for (let i = 0; i < 4400; i++) {
      const x = random() * 512, y = random() * 512;
      g.strokeStyle = i % 3 === 0 ? '#bd7d3709' : '#fff0cf12'; g.lineWidth = .7;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + .8, y + 2, x + (random() - .5) * 2, y + 3 + random() * 6); g.stroke();
    }
  });
}

/** Pumpkin onesie with the jack-o'-lantern face centered on the -Z side of a sphere (u = .75). */
export function onesieTexture() {
  return canvasTexture('onesie-tailored', 1024, 512, g => {
    g.scale(2, 2);
    const base = g.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, '#ff9b35'); base.addColorStop(.55, '#f88a24'); base.addColorStop(1, '#ed781b');
    g.fillStyle = base; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 8; i++) {
      const x = i * 64 + 30;
      g.beginPath(); g.moveTo(x, -5); g.bezierCurveTo(x - 9, 72, x + 9, 185, x, 261);
      g.strokeStyle = '#9b4f1610'; g.lineWidth = 9; g.stroke();
      g.strokeStyle = '#a84f1a20'; g.lineWidth = 1; g.stroke();
      g.beginPath(); g.moveTo(x + 2, -5); g.bezierCurveTo(x - 7, 72, x + 11, 185, x + 2, 261);
      g.strokeStyle = '#ffca7e30'; g.lineWidth = .65; g.stroke();
    }
    // Fine woven threads remain quiet at the normal lobby camera distance.
    g.lineWidth = .35;
    for (let y = 0; y < 256; y += 2) { g.strokeStyle = '#ffdfa51a'; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    for (let x = 0; x < 512; x += 2) { g.strokeStyle = '#9e53180a'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }

    const cx = 384;
    const applique = (path: Path2D) => {
      g.fillStyle = '#38261d'; g.fill(path);
      g.strokeStyle = '#9c4d21'; g.lineWidth = 1.4; g.stroke(path);
      g.strokeStyle = '#f6ac5966'; g.lineWidth = .45; g.setLineDash([1, 1.6]); g.stroke(path); g.setLineDash([]);
    };
    const tri = (x: number, y: number, w: number, h: number) => {
      const path = new Path2D(); path.moveTo(x - w / 2, y + h / 2); path.lineTo(x, y - h / 2);
      path.lineTo(x + w / 2, y + h / 2); path.closePath(); applique(path);
    };
    tri(cx - 34, 92, 36, 30); tri(cx + 34, 92, 36, 30); tri(cx, 122, 18, 16);
    const smile = new Path2D(); smile.moveTo(cx - 60, 140);
    smile.quadraticCurveTo(cx, 193, cx + 60, 140); smile.quadraticCurveTo(cx + 31, 153, cx + 16, 153);
    smile.lineTo(cx + 16, 164); smile.lineTo(cx + 5, 164); smile.lineTo(cx + 5, 156);
    smile.lineTo(cx - 13, 156); smile.lineTo(cx - 13, 164); smile.lineTo(cx - 24, 161);
    smile.lineTo(cx - 24, 152); smile.quadraticCurveTo(cx - 43, 148, cx - 60, 140); smile.closePath(); applique(smile);
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

/** Honey amber iris with restrained organic fibers, shared by every Monova. */
export function irisTexture() {
  return canvasTexture('monova-iris-honey', 512, 512, g => {
    let state = 721;
    const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
    const gradient = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#683c1b'); gradient.addColorStop(.37, '#a46126');
    gradient.addColorStop(.6, '#d9a64f'); gradient.addColorStop(.78, '#f1cf83');
    gradient.addColorStop(.91, '#c89b54'); gradient.addColorStop(.98, '#886333'); gradient.addColorStop(1, '#60472e');
    g.fillStyle = gradient; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 94; i++) {
      const angle = i * Math.PI * 2 / 94 + random() * .035, inner = 104 + random() * 34, outer = 210 + random() * 29;
      const bend = (random() - .5) * .035;
      g.strokeStyle = i % 3 ? '#fff1bb2c' : '#8b602e26'; g.lineWidth = 1.2 + random() * 1.4;
      g.beginPath(); g.moveTo(256 + Math.cos(angle) * inner, 256 + Math.sin(angle) * inner);
      g.quadraticCurveTo(256 + Math.cos(angle + bend) * 180, 256 + Math.sin(angle + bend) * 180, 256 + Math.cos(angle + bend) * outer, 256 + Math.sin(angle + bend) * outer); g.stroke();
    }
    const collarette = g.createRadialGradient(256, 256, 111, 256, 256, 150);
    collarette.addColorStop(0, '#bb7c2e00'); collarette.addColorStop(.55, '#edc46a30'); collarette.addColorStop(1, '#bb7c2e00');
    g.fillStyle = collarette; g.fillRect(0, 0, 512, 512);
  });
}

/** Fine directional fibers: a height field rather than painted shading. */
export function fiberBump(kind: 'fur' | 'ceramic') {
  const texture = canvasTexture(`micro-${kind}`, 512, 512, g => {
    let seed = 491;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < (kind === 'fur' ? 16000 : 14000); i++) {
      const x = random() * 512, y = random() * 512;
      const value = Math.floor(kind === 'fur' ? 121 + random() * 14 : 70 + random() * 115);
      g.strokeStyle = `rgb(${value},${value},${value})`; g.lineWidth = kind === 'fur' ? .8 : .4;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + 1.2, y + 2, x + (random() - .5) * 3, y + (kind === 'fur' ? 5 + random() * 9 : 1)); g.stroke();
    }
  }, kind === 'fur' ? [3, 2] : [2, 2]);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** Soft interior variation behind the physical glass; not a baked reflection. */
export function glassTexture() {
  return canvasTexture('architectural-glass', 128, 256, g => {
    const gradient = g.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#596c70'); gradient.addColorStop(.5, '#253a43'); gradient.addColorStop(1, '#35454c');
    g.fillStyle = gradient; g.fillRect(0, 0, 128, 256);
    g.fillStyle = '#c8bba629'; g.fillRect(8, 12, 26, 235);
    g.fillStyle = '#0b131a'; g.fillRect(62, 0, 3, 256); g.fillRect(0, 156, 128, 3);
    g.fillStyle = '#d0d7d333'; g.fillRect(0, 0, 128, 3);
  });
}

/** Layered leaves break up the canopy surface at close range. */
export function canopyTexture() {
  return canvasTexture('leaf-canopy', 512, 512, g => {
    let state = 718;
    const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#34422b'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5200; i++) {
      const x = random() * 512, y = random() * 512, a = random() * Math.PI, size = 2 + random() * 5;
      g.fillStyle = ['#65794b', '#82925b', '#485f37', '#536d43', '#9aa16b'][i % 5];
      g.beginPath(); g.ellipse(x, y, size, size * .42, a, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#c4c48b44'; g.lineWidth = .5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size); g.stroke();
    }
  }, [2, 2]);
}
