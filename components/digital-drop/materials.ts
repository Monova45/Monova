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
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#ff6a00') } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; uniform vec3 color; varying vec2 vUv;
      void main(){
        float lines = smoothstep(.92, 1., fract(vUv.y * 28. - time * .6));
        float columns = smoothstep(.97, 1., fract(vUv.x * 240.));
        float pulse = .5 + .5 * sin(vUv.x * 60. + time * 2.);
        float fade = pow(1. - vUv.y, 1.6);
        float base = smoothstep(.12, 0., vUv.y) * 2.5;
        float a = (fade * (.16 + lines * .5 + columns * .35 * pulse) + base);
        gl_FragColor = vec4(color * a * 1.6, a);
      }`,
  });
}

export function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true,
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vPos;
      void main(){
        float h = vPos.y;
        vec3 top = vec3(.012, .02, .045), mid = vec3(.035, .06, .11), glow = vec3(.55, .2, .05);
        vec3 c = mix(mid, top, smoothstep(0., .55, h));
        c += glow * pow(1. - clamp(abs(h - .02) * 3.2, 0., 1.), 4.) * .55;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
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
