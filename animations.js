/* =============================================
   MONOVA — Advanced Animation System
   ============================================= */

const raf = requestAnimationFrame;

/* ── 1. PAGE ENTRANCE ── */
(function pageEntrance() {
  const veil = document.createElement('div');
  veil.style.cssText = `position:fixed;inset:0;background:#030608;z-index:9999;pointer-events:none;transition:opacity 0.7s cubic-bezier(0.4,0,0.2,1)`;
  document.body.appendChild(veil);
  requestAnimationFrame(() => {
    setTimeout(() => {
      veil.style.opacity = '0';
      setTimeout(() => veil.remove(), 750);
    }, 80);
  });
})();


/* ── 2. CUSTOM CURSOR ── */
(function customCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cur-dot';
  ring.className = 'cur-ring';
  document.body.append(dot, ring);
  document.body.classList.add('cursor-ready');

  let mx = -200, my = -200;
  let rx = -200, ry = -200;
  let visible = false;
  let hasPointer = false;

  function setVisible(v) {
    if (visible === v) return;
    visible = v;
    const op = v ? '1' : '0';
    dot.style.opacity = ring.style.opacity = op;
  }

  function syncPointer(e) {
    mx = e.clientX;
    my = e.clientY;
    hasPointer = true;
    if (!visible) setVisible(true);
  }

  window.addEventListener('pointermove', syncPointer, { passive: true });
  window.addEventListener('pointerdown', syncPointer, { passive: true });
  document.addEventListener('mouseleave', () => setVisible(false));
  document.addEventListener('mouseenter', () => {
    if (hasPointer) setVisible(true);
  });
  window.addEventListener('blur', () => setVisible(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setVisible(false);
  });

  // RAF loop — ring lerps toward dot
  (function loop() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    dot.style.transform  = `translate3d(${mx}px,${my}px,0)`;
    ring.style.transform = `translate3d(${Math.round(rx)}px,${Math.round(ry)}px,0)`;
    raf(loop);
  })();

  // Hover state — observe DOM changes for dynamic elements
  function bindHover(root) {
    root.querySelectorAll('a,button,[role=button]').forEach(el => {
      if (el._curBound) return;
      el._curBound = true;
      el.addEventListener('mouseenter', () => { dot.classList.add('cur-hover'); ring.classList.add('cur-hover'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('cur-hover'); ring.classList.remove('cur-hover'); });
    });
  }
  bindHover(document);

  // Re-bind on DOM mutations (modals, dynamic content)
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1) bindHover(n);
  }))).observe(document.body, { childList: true, subtree: true });
})();


/* ── 3. MOUSE SPARK TRAIL ── */
(function sparkTrail() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let lastX = 0, lastY = 0, lastTime = 0;

  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastTime < 40) return; // throttle
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) < 12) return;
    lastX = e.clientX; lastY = e.clientY; lastTime = now;

    for (let i = 0; i < 2; i++) {
      const p = document.createElement('div');
      p.className = 'spark';
      p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${(Math.random()-0.5)*60}px;--dy:${(Math.random()-0.5)*60}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  });
})();


/* ── 4. SCROLL REVEAL ── */
(function scrollReveal() {
  const targets = [
    '.service-card',
    '.project-card',
    '.project-grid article',
    '.section-heading',
    '.trust-list div',
    '.pillar',
    '.journey-step',
    '.metrics div',
    '.contact-info-list li',
    '.contact-meeting',
    '.projects-cta',
    '.service-visual-card',
    '.tech-track div',
    '.footer-col',
    '.footer-social',
    '.about-copy > *',
    '.hero-actions',
    '.social-proof',
    '.hero-text',
    '.service-cta-strip',
    '.not-found-preview',
    '.innovation-lab',
    '.premium-difference',
    '.difference-grid article',
    '.outcome-board',
    '.outcome-grid article',
    '.launch-cta',
    '.lab-output article',
    '.process-heading',
    '.process-steps article',
  ].join(',');

  const foldH = window.innerHeight;
  const els = document.querySelectorAll(targets);

  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    // Only hide elements that start BELOW the fold
    if (rect.top > foldH * 0.92) {
      el.classList.add('will-reveal');
      const siblings = el.parentElement
        ? [...el.parentElement.children].filter(c => c.classList.contains('will-reveal'))
        : [];
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${idx * 0.08}s`;
    }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.will-reveal').forEach(el => io.observe(el));
})();


/* ── 5. 3D CARD TILT ── */
(function cardTilt() {
  const cards = document.querySelectorAll('.service-card, .project-card, .project-grid article, .service-visual-card, .contact-right, .journey-section');

  cards.forEach(card => {
    card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
    card.style.willChange = 'transform';

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
      card.style.boxShadow = `${-x * 14}px ${-y * 14}px 36px rgba(255,121,15,0.14)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
})();


/* ── 6. MAGNETIC BUTTONS ── */
(function magneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.primary-button, .nav-cta, .contact-submit').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r   = btn.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const dx  = (e.clientX - cx) * 0.28;
      const dy  = (e.clientY - cy) * 0.28;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();


/* ── 7. RIPPLE ON CLICK ── */
(function ripple() {
  document.querySelectorAll('button, .primary-button, .nav-cta, a.primary-button').forEach(btn => {
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';

    btn.addEventListener('click', e => {
      const r  = btn.getBoundingClientRect();
      const rp = document.createElement('span');
      rp.className = 'ripple-wave';
      rp.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      btn.appendChild(rp);
      setTimeout(() => rp.remove(), 700);
    });
  });
})();


/* ── 8. AMBIENT NEURAL BACKDROP ── */
(function ambientBackdrop() {
  const container = document.createElement('div');
  container.className = 'neural-backdrop';
  document.body.prepend(container);

  const lines = [
    { x: -8, y: 18, r: -18, d: 7 },
    { x: 58, y: 16, r: 24, d: 9 },
    { x: 14, y: 62, r: 12, d: 8 },
    { x: 68, y: 76, r: -22, d: 10 },
  ];

  lines.forEach(line => {
    const el = document.createElement('div');
    el.className = 'neural-line';
    el.style.cssText = `--x:${line.x}%;--y:${line.y}%;--r:${line.r}deg;--d:${line.d}s`;
    container.appendChild(el);
  });
})();


/* ── 8B. PREMIUM PARTICLE ATMOSPHERE ── */
(function premiumAtmosphere() {
  const canvas = document.createElement('canvas');
  canvas.className = 'premium-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particleCount = window.innerWidth < 760 ? 46 : 96;
  const nodes = Array.from({ length: particleCount }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.25 + Math.random() * 0.95,
    vx: (Math.random() - 0.5) * 0.00042,
    vy: (Math.random() - 0.5) * 0.00036,
    phase: Math.random() * Math.PI * 2,
    warm: i % 5 !== 0,
  }));

  let W = 0;
  let H = 0;
  let mx = 0.5;
  let my = 0.28;
  let tx = mx;
  let ty = my;
  let rafId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointer(e) {
    mx = e.clientX / Math.max(1, W);
    my = e.clientY / Math.max(1, H);
    document.documentElement.style.setProperty('--scene-x', `${Math.round(mx * 100)}%`);
    document.documentElement.style.setProperty('--scene-y', `${Math.round(my * 100)}%`);
  }

  function draw(now) {
    tx += (mx - tx) * 0.045;
    ty += (my - ty) * 0.045;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const t = now / 1000;
    const lightX = tx * W;
    const lightY = ty * H;

    nodes.forEach((node, index) => {
      if (!reduceMotion) {
        node.x += node.vx * node.z;
        node.y += node.vy * node.z;
        if (node.x < -0.05) node.x = 1.05;
        if (node.x > 1.05) node.x = -0.05;
        if (node.y < -0.05) node.y = 1.05;
        if (node.y > 1.05) node.y = -0.05;
      }

      const px = (node.x + Math.cos(t * 0.16 + node.phase) * 0.006) * W;
      const py = (node.y + Math.sin(t * 0.14 + node.phase) * 0.006) * H;
      const dx = px - lightX;
      const dy = py - lightY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const magnet = Math.max(0, 1 - dist / Math.min(W, H) / 0.52);
      const alpha = 0.035 + node.z * 0.075 + magnet * 0.16;
      const radius = 0.7 + node.z * 1.25 + magnet * 1.1;

      ctx.beginPath();
      ctx.fillStyle = node.warm
        ? `rgba(255, 132, 24, ${alpha})`
        : `rgba(16, 243, 109, ${alpha * 0.55})`;
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      for (let j = index + 8; j < nodes.length; j += 17) {
        const other = nodes[j];
        const ox = other.x * W;
        const oy = other.y * H;
        const lx = px - ox;
        const ly = py - oy;
        const linkDist = Math.sqrt(lx * lx + ly * ly);
        if (linkDist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 121, 15, ${(1 - linkDist / 150) * (0.035 + magnet * 0.04)})`;
          ctx.lineWidth = 0.38;
          ctx.moveTo(px, py);
          ctx.lineTo(ox, oy);
          ctx.stroke();
        }
      }
    });

    const gradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, Math.min(W, H) * 0.4);
    gradient.addColorStop(0, 'rgba(255, 121, 15, 0.085)');
    gradient.addColorStop(0.42, 'rgba(255, 121, 15, 0.028)');
    gradient.addColorStop(1, 'rgba(255, 121, 15, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
    if (!reduceMotion) rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  if (!reduceMotion) rafId = requestAnimationFrame(draw);
  else draw(0);
  window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
})();

/* ── 8C. REACTIVE PANEL LIGHT ── */
(function reactivePanelLight() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const selector = [
    '.lab-console',
    '.hero-command-card',
    '.difference-grid article',
    '.outcome-grid article',
    '.launch-cta',
    '.process-steps article',
    '.metrics div',
    '.tech-track div',
    '.service-card',
    '.project-grid article',
    '.service-visual-card',
    '.contact-right',
    '.journey-section',
  ].join(',');

  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x.toFixed(1)}%`);
      el.style.setProperty('--my', `${y.toFixed(1)}%`);
    }, { passive: true });
  });
})();

/* -- 8D. SCROLL-LIT PROCESS LINE -- */
(function processSignal() {
  const flow = document.querySelector('.process-flow');
  const steps = [...document.querySelectorAll('.process-steps article')];
  if (!flow || !steps.length) return;

  const signal = document.createElement('span');
  signal.className = 'process-signal';
  signal.setAttribute('aria-hidden', 'true');
  flow.appendChild(signal);

  let ticking = false;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function update() {
    const rect = flow.getBoundingClientRect();
    const travel = window.innerHeight + rect.height;
    const ratio = clamp((window.innerHeight - rect.top) / Math.max(1, travel), 0, 1);
    const eased = 1 - Math.pow(1 - ratio, 2.2);

    flow.style.setProperty('--process-ratio', eased.toFixed(3));
    flow.style.setProperty('--process-progress', `${Math.round(eased * 100)}%`);

    const activeCount = Math.max(1, Math.ceil(eased * steps.length));
    steps.forEach((step, index) => {
      step.classList.toggle('is-lit', index < activeCount);
    });
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    raf(update);
  }

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
})();


/* ── 9. CSS GLITCH on hover (sin tocar texto) ── */
(function glitchHeadings() {
  document.querySelectorAll('h1').forEach(h => {
    h.addEventListener('mouseenter', () => {
      h.classList.add('glitch-active');
      setTimeout(() => h.classList.remove('glitch-active'), 400);
    });
  });
})();


/* ── 10. TOPBAR SCROLL EFFECT ── */
(function topbarScroll() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    raf(() => {
      if (window.scrollY > 60) {
        topbar.classList.add('scrolled');
      } else {
        topbar.classList.remove('scrolled');
      }
      ticking = false;
    });
  });
})();


/* ── 11. COUNTER ANIMATION ── */
(function counters() {
  const els = document.querySelectorAll('.metrics span, .journey-year');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return;
      const suffix = text.replace(/[0-9.]/g, '');
      let start = 0;
      const dur = 1400;
      const startTime = performance.now();

      function tick(now) {
        const p = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(num * ease) + suffix;
        if (p < 1) raf(tick);
      }
      raf(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => io.observe(el));
})();


/* ── 12. HERO ENTRANCE ANIMATION ── */
(function heroEntrance() {
  const heroCopy = document.querySelector('.hero-copy');
  if (!heroCopy) return;

  // Animate children in sequence
  const children = [...heroCopy.children];
  children.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.7s ease ${0.3 + i * 0.15}s, transform 0.7s ease ${0.3 + i * 0.15}s`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }));
  });

  // Animate hero visual
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    heroVisual.style.opacity = '0';
    heroVisual.style.transform = 'translateX(40px)';
    heroVisual.style.transition = 'opacity 0.9s ease 0.5s, transform 0.9s ease 0.5s';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroVisual.style.opacity = '1';
      heroVisual.style.transform = 'translateX(0)';
    }));
  }
})();

/* ── 13. FLOATING BADGE ANIMATION (hero) ── */
(function floatingBadge() {
  document.querySelectorAll('.floating-chip').forEach((el, i) => {
    el.style.animation = `float-badge ${3 + i * 0.7}s ease-in-out infinite alternate`;
  });
})();

/* ── 12. BRAND MARK PULSE ── */
(function brandPulse() {
  document.querySelectorAll('.brand-mark').forEach(mark => {
    mark.classList.add('brand-pulse');
  });
})();


/* ── 13. NEON BORDER ON ACTIVE NAV ── */
(function neonNav() {
  document.querySelectorAll('.desktop-nav .active').forEach(a => {
    a.classList.add('nav-neon');
  });
})();


/* ── 14. BOOT SEQUENCE ── */
(function bootAtmosphere() {
  const canvas = document.getElementById('bootParticleField');
  const overlay = document.getElementById('bootOverlay');
  if (!canvas || !overlay) return;

  const ctx = canvas.getContext('2d');
  const nodes = Array.from({ length: 170 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.35 + Math.random() * 0.9,
    vx: (Math.random() - 0.5) * 0.00055,
    vy: (Math.random() - 0.5) * 0.00045,
    phase: Math.random() * Math.PI * 2,
    warm: i % 4 !== 0,
  }));
  let W = 0;
  let H = 0;
  let raf = 0;
  let started = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    if (!canvas.isConnected) return;

    const t = (now - started) / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    nodes.forEach((n, i) => {
      n.x += n.vx * n.z;
      n.y += n.vy * n.z;
      if (n.x < -0.05) n.x = 1.05;
      if (n.x > 1.05) n.x = -0.05;
      if (n.y < -0.05) n.y = 1.05;
      if (n.y > 1.05) n.y = -0.05;

      const px = (n.x + Math.cos(t * 0.24 + n.phase) * 0.006) * W;
      const py = (n.y + Math.sin(t * 0.2 + n.phase) * 0.005) * H;
      const r = 0.8 + n.z * 1.35;
      const a = 0.06 + n.z * 0.13;
      ctx.beginPath();
      ctx.fillStyle = n.warm ? `rgba(255, 134, 34, ${a})` : `rgba(16, 243, 109, ${a * 0.55})`;
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j += 11) {
        const m = nodes[j];
        const mx = m.x * W;
        const my = m.y * H;
        const dx = px - mx;
        const dy = py - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 122) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 121, 15, ${(1 - d / 122) * 0.052})`;
          ctx.lineWidth = 0.34;
          ctx.moveTo(px, py);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
    });

    ctx.restore();
    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  raf = requestAnimationFrame(draw);
})();

(function bootParticleMark() {
  const canvas = document.getElementById('bootParticleM');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const host = canvas.closest('.boot-m');
  const overlay = canvas.closest('.boot-overlay');
  const points = [];
  const segments = [];
  let W = 0;
  let H = 0;
  let raf = 0;
  let started = performance.now();
  let mx = -9999;
  let my = -9999;
  let mouseActive = false;

  function addSegment(x1, y1, x2, y2, n = 22) {
    segments.push({ x1, y1, x2, y2 });
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      points.push({
        tx: x1 + (x2 - x1) * t,
        ty: y1 + (y2 - y1) * t,
      });
    }
  }

  function buildMark() {
    points.length = 0;
    segments.length = 0;

    // Monova M built from particle strokes, normalized to the canvas.
    addSegment(0.13, 0.83, 0.13, 0.18, 68);
    addSegment(0.13, 0.18, 0.28, 0.18, 24);
    addSegment(0.28, 0.18, 0.50, 0.43, 56);
    addSegment(0.50, 0.43, 0.72, 0.18, 56);
    addSegment(0.72, 0.18, 0.87, 0.18, 24);
    addSegment(0.87, 0.18, 0.87, 0.83, 68);
    addSegment(0.26, 0.48, 0.50, 0.72, 48);
    addSegment(0.50, 0.72, 0.74, 0.48, 48);
  }

  buildMark();

  const particles = points.map((p, index) => ({
    tx: p.tx,
    ty: p.ty,
    sx: Math.random(),
    sy: Math.random(),
    x: Math.random(),
    y: Math.random(),
    vx: 0,
    vy: 0,
    r: 0.72 + (index % 4) * 0.08 + Math.random() * 0.18,
    a: 0.56 + Math.random() * 0.32,
    phase: Math.random() * Math.PI * 2,
  }));
  const orbiters = Array.from({ length: 48 }, (_, i) => ({
    angle: (Math.PI * 2 * i) / 22,
    radius: 0.38 + Math.random() * 0.18,
    speed: 0.22 + Math.random() * 0.2,
    y: 0.5 + (Math.random() - 0.5) * 0.5,
    r: 0.75 + Math.random() * 1.25,
    phase: Math.random() * Math.PI * 2,
  }));

  function resize() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width * 1.24));
    H = Math.max(1, Math.round(rect.height * 1.32));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    mx = (e.clientX - rect.left) / rect.width;
    my = (e.clientY - rect.top) / rect.height;
    mouseActive = true;
  }

  function drawLineNetwork(progress) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 121, 15, 0.72)';

    segments.forEach((s, index) => {
      const pulse = 0.055 + Math.sin(progress * 3.2 + index * 0.7) * 0.02;
      ctx.beginPath();
      ctx.moveTo(s.x1 * W, s.y1 * H);
      ctx.lineTo(s.x2 * W, s.y2 * H);
      ctx.strokeStyle = `rgba(255, 121, 15, ${pulse})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    });

    ctx.restore();
  }

  function draw(now) {
    try {
    if (!canvas.isConnected) return;

    const elapsed = (now - started) / 1000;
    const assemble = Math.min(elapsed / 1.65, 1);
    const ease = 1 - Math.pow(1 - assemble, 3);
    ctx.clearRect(0, 0, W, H);

    if (ease > 0.42) drawLineNetwork(elapsed);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      const driftX = Math.cos(elapsed * 1.45 + p.phase) * 0.003;
      const driftY = Math.sin(elapsed * 1.2 + p.phase) * 0.003;
      const targetX = p.sx + (p.tx + driftX - p.sx) * ease;
      const targetY = p.sy + (p.ty + driftY - p.sy) * ease;

      p.vx += (targetX - p.x) * 0.035;
      p.vy += (targetY - p.y) * 0.035;

      if (mouseActive) {
        const dxM = p.x - mx;
        const dyM = p.y - my;
        const dist = Math.sqrt(dxM * dxM + dyM * dyM);
        if (dist < 0.22 && dist > 0.001) {
          const force = Math.pow((0.22 - dist) / 0.22, 2) * 0.012;
          p.vx += (dxM / dist) * force;
          p.vy += (dyM / dist) * force;
        }
      }

      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;

      const px = p.x * W;
      const py = p.y * H;
      const glow = p.r * (2.1 + ease * 1.35);
      const alpha = p.a * (0.42 + ease * 0.52 + Math.sin(elapsed * 2.4 + p.phase) * 0.1);

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, glow);
      gradient.addColorStop(0, `rgba(255, 210, 120, ${alpha * 0.72})`);
      gradient.addColorStop(0.28, `rgba(255, 121, 15, ${alpha * 0.24})`);
      gradient.addColorStop(1, 'rgba(255, 121, 15, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(px, py, glow, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 238, 196, ${Math.min(1, alpha + 0.28)})`;
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i += 2) {
      const a = particles[i];
      const ax = a.x * W;
      const ay = a.y * H;

      for (let j = i + 1; j < particles.length; j += 5) {
        const b = particles[j];
        const bx = b.x * W;
        const by = b.y * H;
        const dx = ax - bx;
        const dy = ay - by;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (ease > 0.5 && d < 28) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 156, 48, ${(1 - d / 28) * 0.12})`;
          ctx.lineWidth = 0.42;
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }

    orbiters.forEach(o => {
      const angle = o.angle + elapsed * o.speed;
      const px = (0.5 + Math.cos(angle) * o.radius) * W;
      const py = (o.y + Math.sin(angle + o.phase) * 0.035) * H;
      const alpha = 0.18 + Math.sin(elapsed * 1.6 + o.phase) * 0.08;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 160, 54, ${alpha})`;
      ctx.arc(px, py, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    raf = requestAnimationFrame(draw);
    } catch (err) {
      cancelAnimationFrame(raf);
    }
  }

  resize();
  new ResizeObserver(resize).observe(host);
  overlay.addEventListener('pointermove', updatePointer, { passive: true });
  overlay.addEventListener('pointerleave', () => {
    mouseActive = false;
    mx = -9999;
    my = -9999;
  }, { passive: true });
  raf = requestAnimationFrame(draw);

  window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));
})();

(function bootSequence() {
  const overlay = document.getElementById('bootOverlay');
  if (!overlay) return;

  const container = document.getElementById('bootLines');
  const messages = [
    { text: '> MONOVA_OS v2.6  LOADING ...', cls: '' },
    { text: '> IA ENGINE .............. [ONLINE]', cls: 'boot-line--ok' },
    { text: '> SOFTWARE CORE .......... [ONLINE]', cls: 'boot-line--ok' },
    { text: '> DESIGN STUDIO .......... [ONLINE]', cls: 'boot-line--ok' },
    { text: '> AUTOMATION MODULE ...... [ONLINE]', cls: 'boot-line--ok' },
    { text: '> ALL SYSTEMS OPERATIONAL', cls: 'boot-line--ready' },
  ];

  let i = 0;

  function next() {
    if (i >= messages.length) {
      setTimeout(() => {
        overlay.classList.add('boot-done');
        setTimeout(() => overlay.remove(), 850);
      }, 480);
      return;
    }
    const { text, cls } = messages[i++];
    const el = document.createElement('div');
    el.className = 'boot-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    container.appendChild(el);
    setTimeout(next, i === 1 ? 680 : 540);
  }

  setTimeout(next, 280);
})();


/* ── 15. HERO CANVAS — M PARTICLE FIELD ── */
(function heroMCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  // Skip on touch devices — save resources
  if (window.matchMedia('(pointer: coarse)').matches) {
    canvas.remove();
    return;
  }

  const ctx    = canvas.getContext('2d');
  const hero   = canvas.closest('.hero');
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(hero);

  // ── Build M-shape sample points (normalized 0-1) ──
  const PTS = [];
  const TRACE_LINES = [];

  function sampleLine(x1, y1, x2, y2, n) {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      PTS.push({ tx: x1 + (x2 - x1) * t, ty: y1 + (y2 - y1) * t });
    }
  }

  const markBox = { x: 0.23, y: 0.23, w: 0.44, h: 0.45 };

  function markPoint(x, y) {
    return {
      x: markBox.x + x * markBox.w,
      y: markBox.y + y * markBox.h,
    };
  }

  function sampleMarkLine(x1, y1, x2, y2, n) {
    const a = markPoint(x1, y1);
    const b = markPoint(x2, y2);
    TRACE_LINES.push([a, b]);
    sampleLine(a.x, a.y, b.x, b.y, n);
  }

  // Clear Monova M: wide stems, high shoulders, compact inner valley.
  sampleMarkLine(0.03, 0.93, 0.03, 0.07, 24); // left stem
  sampleMarkLine(0.03, 0.07, 0.21, 0.07, 8);  // left shoulder
  sampleMarkLine(0.21, 0.07, 0.50, 0.50, 18); // inner left
  sampleMarkLine(0.50, 0.50, 0.79, 0.07, 18); // inner right
  sampleMarkLine(0.79, 0.07, 0.97, 0.07, 8);  // right shoulder
  sampleMarkLine(0.97, 0.07, 0.97, 0.93, 24); // right stem
  sampleMarkLine(0.23, 0.48, 0.50, 0.82, 14); // lower inner left
  sampleMarkLine(0.50, 0.82, 0.77, 0.48, 14); // lower inner right

  // ── Create particles ──
  const particles = PTS.map(p => ({
    tx: p.tx, ty: p.ty,
    x:  Math.random(),
    y:  Math.random(),
    vx: 0, vy: 0,
    r: 1.4 + Math.random() * 1.6,
    a: 0.45 + Math.random() * 0.55,
  }));

  let mx = -9999, my = -9999;

  hero.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = (e.clientX - rect.left) / W;
    my = (e.clientY - rect.top)  / H;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

  // ── Render loop ──
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const repelR = 0.11;  // normalized repel radius

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 22;
    ctx.shadowColor = 'rgba(255,121,15,0.65)';
    ctx.strokeStyle = 'rgba(255,121,15,0.34)';
    ctx.lineWidth = Math.max(1.4, W * 0.0017);
    TRACE_LINES.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a.x * W, a.y * H);
      ctx.lineTo(b.x * W, b.y * H);
      ctx.stroke();
    });
    ctx.restore();

    // Update + draw particles
    ctx.shadowBlur  = 10;
    ctx.shadowColor = 'rgba(255,121,15,0.75)';

    particles.forEach(p => {
      // Mouse repel
      const dxM = p.x - mx, dyM = p.y - my;
      const dM  = Math.sqrt(dxM * dxM + dyM * dyM);
      if (dM < repelR && dM > 0) {
        const f = ((repelR - dM) / repelR) * 0.009;
        p.vx += (dxM / dM) * f;
        p.vy += (dyM / dM) * f;
      }

      // Spring toward target
      p.vx += (p.tx - p.x) * 0.042;
      p.vy += (p.ty - p.y) * 0.042;

      // Damp + tiny drift
      p.vx = p.vx * 0.84 + (Math.random() - 0.5) * 0.00035;
      p.vy = p.vy * 0.84 + (Math.random() - 0.5) * 0.00035;

      p.x += p.vx;
      p.y += p.vy;

      const px = p.x * W, py = p.y * H;

      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,160,60,${p.a})`;
      ctx.fill();
    });

    ctx.shadowBlur = 0;

    // Draw lines between nearby particles
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const pi = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const pj  = particles[j];
        const dx  = (pi.x - pj.x) * W;
        const dy  = (pi.y - pj.y) * H;
        const d   = Math.sqrt(dx * dx + dy * dy);
        if (d < 38) {
          ctx.beginPath();
          ctx.moveTo(pi.x * W, pi.y * H);
          ctx.lineTo(pj.x * W, pj.y * H);
          ctx.strokeStyle = `rgba(255,121,15,${(1 - d / 38) * 0.28})`;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
