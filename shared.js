/* ================================================
   shared.js — Portfolio of Rodrigo Diaz
   GSAP · ScrollTrigger · Lenis · VanillaTilt
   Spaceship Cursor · Aerospace Hero Background
   ================================================ */

// ── CDN URLS ────────────────────────────────────
const _CDN = {
  gsap:  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  st:    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  lenis: 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1/bundled/lenis.min.js',
  tilt:  'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.2/vanilla-tilt.min.js',
};

const _REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const _IS_HOME = !!document.querySelector('.hero');

// Mark home page for nav color switching
if (_IS_HOME) document.body.classList.add('home-page');

// ════════════════════════════════════════════════
//  RUNS IMMEDIATELY (no CDN needed)
// ════════════════════════════════════════════════

// ── 1. Claim hero elements so CSS observer skips them ──
;(function claimHero() {
  ['.hero-eyebrow', '.hero-name', '.hero-desc', '.hero-cta', '.hero-status', '.hero-telemetry'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove('reveal','reveal-delay-1','reveal-delay-2','reveal-delay-3','reveal-delay-4');
    el.setAttribute('data-hero', '1');
    el.style.opacity = '0';
  });
})();

// ── 2. Immediately reveal anything .reveal already on screen ──
;(function immediateReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.hasAttribute('data-hero')) obs.observe(el);
  });
})();

// ── 3. Hard fallback: force-show everything if CDNs die ──
let _gsapReady = false;
const _fallback = setTimeout(() => {
  if (_gsapReady) return;
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  document.querySelectorAll('[data-hero]').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}, 2500);

// ── 4. Start aerospace hero background immediately ──
if (!_REDUCED_MOTION) _initAerospaceBackground();

// ════════════════════════════════════════════════
//  CDN LOADER
// ════════════════════════════════════════════════
function _load(src) {
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = resolve;
    document.head.appendChild(s);
  });
}

_load(_CDN.gsap)
  .then(() => _load(_CDN.st))
  .then(() => Promise.all([_load(_CDN.lenis), _load(_CDN.tilt)]))
  .then(boot);

// ════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════
function boot() {
  _gsapReady = true;
  clearTimeout(_fallback);

  gsap.registerPlugin(ScrollTrigger);

  _initPageTransition();
  _initLenis();
  _initSpaceshipCursor();
  _initHero();
  _initScrollAnims();
  _initScrollProgress();
  _initVanillaTilt();
  _initNav();
  _initTelemetryTicker();
}

// ════════════════════════════════════════════════
//  AEROSPACE HERO BACKGROUND CANVAS
//  Blueprint grid · Orbital arcs · Drifting particles
//  · Soft glow · Mouse parallax
// ════════════════════════════════════════════════
function _initAerospaceBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, DPR;
  let particles = [];
  let arcs = [];
  let raf, t = 0;
  let mouseX = 0, mouseY = 0;        // parallax target (-1..1)
  let pX = 0, pY = 0;                // smoothed

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const w = hero.offsetWidth;
    const h = hero.offsetHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    W = w; H = h;
    makeParticles();
    makeArcs();
  }

  function makeParticles() {
    const density = Math.floor((W * H) / 11000);
    const count = Math.min(Math.max(density, 55), 150);
    particles = Array.from({ length: count }, () => {
      const roll = Math.random();
      const [r, g, b] =
        roll < 0.15 ? [255, 195, 150] :  // warm tint
        roll < 0.40 ? [155, 200, 240] :  // steel blue
                      [235, 240, 250];   // white-blue
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        z:  Math.random() * 0.9 + 0.1,    // depth (for parallax)
        radius: Math.random() * 1.3 + 0.25,
        baseOp: Math.random() * 0.45 + 0.2,
        twFreq: Math.random() * 0.55 + 0.15,
        twPhs:  Math.random() * Math.PI * 2,
        vx:     (Math.random() - 0.5) * 0.03,
        vy:     (Math.random() - 0.5) * 0.018,
        glow:   Math.random() < 0.10,
        r, g, b,
      };
    });
  }

  function makeArcs() {
    // 3 concentric orbital arcs centered off-screen for subtle trajectory feel
    const cx = W * 0.78;
    const cy = H * 0.28;
    arcs = [
      { cx, cy, radius: Math.max(W, H) * 0.55, start: -0.35, sweep: 1.1, speed: 0.04, width: 1,   op: 0.18 },
      { cx, cy, radius: Math.max(W, H) * 0.72, start:  0.20, sweep: 0.9, speed: 0.028, width: 0.8, op: 0.12 },
      { cx: W * 0.15, cy: H * 0.85, radius: Math.max(W, H) * 0.45, start: -1.6, sweep: 0.9, speed: -0.035, width: 1, op: 0.15 },
    ];
  }

  function drawGrid() {
    // Faint blueprint grid with radial mask towards the hero text
    const gridSize = 64;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(123, 176, 214, 0.045)';

    // Parallax offset
    const ox = pX * 18;
    const oy = pY * 18;

    ctx.beginPath();
    for (let x = ((-ox) % gridSize); x < W; x += gridSize) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = ((-oy) % gridSize); y < H; y += gridSize) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    // Stronger minor cross marks every 4 cells
    ctx.strokeStyle = 'rgba(123, 176, 214, 0.12)';
    const major = gridSize * 4;
    ctx.beginPath();
    for (let x = ((-ox) % major); x < W; x += major) {
      for (let y = ((-oy) % major); y < H; y += major) {
        ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
      }
    }
    ctx.stroke();
  }

  function drawArcs() {
    arcs.forEach(a => {
      const phase = t * a.speed;
      const start = a.start + phase;
      const end   = start + a.sweep;

      // Soft glow stroke
      ctx.beginPath();
      ctx.arc(a.cx + pX * 12, a.cy + pY * 12, a.radius, start, end);
      ctx.strokeStyle = `rgba(123, 176, 214, ${a.op})`;
      ctx.lineWidth = a.width;
      ctx.stroke();

      // Traveling dot along the arc (leading edge)
      const dotX = a.cx + pX * 12 + Math.cos(end) * a.radius;
      const dotY = a.cy + pY * 12 + Math.sin(end) * a.radius;
      const gr = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 7);
      gr.addColorStop(0, 'rgba(158, 211, 232, 0.9)');
      gr.addColorStop(0.5, 'rgba(158, 211, 232, 0.25)');
      gr.addColorStop(1, 'rgba(158, 211, 232, 0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach(s => {
      // Drift — wrap at edges
      s.x = ((s.x + s.vx) + W) % W;
      s.y = ((s.y + s.vy) + H) % H;

      // Parallax (deep stars move less)
      const px = s.x + pX * 22 * s.z;
      const py = s.y + pY * 22 * s.z;

      // Twinkle
      const tw = 0.5 + 0.5 * Math.sin(t * s.twFreq * Math.PI * 2 + s.twPhs);
      const op = s.baseOp * (0.55 + 0.45 * tw) * s.z;

      if (s.glow) {
        const gr = ctx.createRadialGradient(px, py, 0, px, py, s.radius * 5);
        gr.addColorStop(0,   `rgba(${s.r},${s.g},${s.b},${op})`);
        gr.addColorStop(0.35,`rgba(${s.r},${s.g},${s.b},${op * 0.22})`);
        gr.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, s.radius * 5, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(px, py, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.r},${s.g},${s.b},${op})`;
      ctx.fill();
    });
  }

  function drawGlow() {
    // Soft glow behind hero text area
    const cx = W * 0.28;
    const cy = H * 0.55;
    const gr = ctx.createRadialGradient(cx + pX * 8, cy + pY * 8, 0, cx, cy, Math.max(W, H) * 0.35);
    gr.addColorStop(0, 'rgba(196, 98, 45, 0.08)');
    gr.addColorStop(0.5, 'rgba(50, 80, 140, 0.04)');
    gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    t = now * 0.001;

    // Ease toward target for smooth parallax
    pX += (mouseX - pX) * 0.04;
    pY += (mouseY - pY) * 0.04;

    drawGlow();
    drawGrid();
    drawArcs();
    drawParticles();

    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);

  window.addEventListener('resize', () => { resize(); }, { passive: true });

  // Mouse parallax (subtle)
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });
}

// ════════════════════════════════════════════════
//  LENIS SMOOTH SCROLL
// ════════════════════════════════════════════════
function _initLenis() {
  if (typeof Lenis === 'undefined' || _REDUCED_MOTION) return;

  const lenis = new Lenis({
    duration:      1.15,
    easing:        t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel:   true,
    wheelMultiplier: 0.9,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.style.scrollBehavior = 'auto';
}

// ════════════════════════════════════════════════
//  PAGE TRANSITIONS
// ════════════════════════════════════════════════
function _initPageTransition() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  gsap.to(overlay, {
    opacity: 0, duration: 0.4, ease: 'power2.out',
    onComplete: () => { overlay.style.pointerEvents = 'none'; },
  });

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (
      href.startsWith('#') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      link.target === '_blank' ||
      (href.startsWith('http') &&
        !href.includes('rodrigodiaz.dev') &&
        !href.includes('github.io'))
    ) return;

    e.preventDefault();
    const dest = link.href;
    overlay.style.pointerEvents = 'all';
    gsap.to(overlay, {
      opacity: 1, duration: 0.26, ease: 'power2.in',
      onComplete: () => window.location.assign(dest),
    });
  });
}

// ════════════════════════════════════════════════
//  SPACESHIP CURSOR
//  SVG spaceship follows cursor smoothly and rotates
//  based on movement direction. Small terracotta
//  trail dot adds polish. Desktop only.
// ════════════════════════════════════════════════
function _initSpaceshipCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (_REDUCED_MOTION) return;

  // Clean minimalist spaceship SVG — tip points up (-Y by default)
  const SHIP_SVG = `
    <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <linearGradient id="shipBody" x1="14" y1="2" x2="14" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#FDFAF6"/>
          <stop offset="1" stop-color="#D4D1CB"/>
        </linearGradient>
      </defs>
      <!-- thruster glow -->
      <path d="M10 22 L14 26 L18 22 Z" fill="#C4622D" opacity="0.85"/>
      <path d="M11.5 22 L14 24.5 L16.5 22 Z" fill="#FFD7A8" opacity="0.9"/>
      <!-- body -->
      <path d="M14 2 L20 18 L14 15.5 L8 18 Z" fill="url(#shipBody)" stroke="#1C1A17" stroke-width="1.1" stroke-linejoin="round"/>
      <!-- cockpit -->
      <circle cx="14" cy="10" r="1.6" fill="#7BB0D6" stroke="#1C1A17" stroke-width="0.7"/>
    </svg>`;

  const ship = document.createElement('div');
  ship.className = 'cursor-ship';
  ship.innerHTML = SHIP_SVG;

  const trail = document.createElement('div');
  trail.className = 'cursor-trail';

  document.body.append(trail, ship);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let sx = mx, sy = my;            // smoothed ship position
  let tx = mx, ty = my;            // smoothed trail
  let targetAngle = 0;             // in radians (0 = pointing up)
  let currentAngle = 0;
  let lastX = mx, lastY = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  // Hide when leaving window, show when entering
  document.addEventListener('mouseleave', () => {
    gsap.to(ship,  { opacity: 0, duration: 0.2 });
    gsap.to(trail, { opacity: 0, duration: 0.2 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to(ship,  { opacity: 1, duration: 0.25 });
    gsap.to(trail, { opacity: 1, duration: 0.25 });
  });

  gsap.ticker.add(() => {
    // Smooth ship movement
    sx += (mx - sx) * 0.18;
    sy += (my - sy) * 0.18;
    // Trail lags a bit more
    tx += (mx - tx) * 0.09;
    ty += (my - ty) * 0.09;

    // Compute angle from velocity (only rotate when actually moving)
    const dx = sx - lastX;
    const dy = sy - lastY;
    const speed = Math.hypot(dx, dy);

    if (speed > 0.6) {
      // atan2 returns angle from +X axis. Ship SVG points -Y (up) by default,
      // so we add PI/2 to align.
      targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
    }
    // Angle interpolation (shortest path)
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    currentAngle += diff * 0.18;

    lastX = sx; lastY = sy;

    gsap.set(ship,  { x: sx, y: sy, rotation: currentAngle * 180 / Math.PI });
    gsap.set(trail, { x: tx, y: ty });
  });

  // Hover states
  const hoverTargets = 'a, button, .project-card, [role="button"], input, textarea, select, .video-btn';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) {
      ship.classList.add('cursor-hover');
      gsap.to(ship, { scale: 1.25, duration: 0.22, ease: 'power2.out' });
      gsap.to(trail, { scale: 2, duration: 0.22 });
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets) && !e.relatedTarget?.closest(hoverTargets)) {
      ship.classList.remove('cursor-hover');
      gsap.to(ship, { scale: 1, duration: 0.22, ease: 'power2.out' });
      gsap.to(trail, { scale: 1, duration: 0.22 });
    }
  });
}

// ════════════════════════════════════════════════
//  HERO ENTRANCE ANIMATION
// ════════════════════════════════════════════════
function _initHero() {
  const name    = document.querySelector('.hero-name');
  const status  = document.querySelector('.hero-status');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const desc    = document.querySelector('.hero-desc');
  const cta     = document.querySelector('.hero-cta');
  const telem   = document.querySelector('.hero-telemetry');

  if (!name) return;

  _splitLines(name);
  gsap.set(name, { opacity: 1 });

  const tl = gsap.timeline({ delay: 0.1 });

  if (status) {
    tl.fromTo(status,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0);
  }
  if (eyebrow) {
    tl.fromTo(eyebrow,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.1);
  }

  const lines = name.querySelectorAll('.line-inner');
  tl.fromTo(lines,
    { y: '108%' },
    { y: '0%', duration: 1.0, stagger: 0.14, ease: 'power4.out' },
    0.25
  );

  if (desc) {
    tl.fromTo(desc,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.52');
  }
  if (cta) {
    tl.fromTo(cta,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.42');
  }
  if (telem) {
    tl.fromTo(telem,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.38');
  }

  // Hero background parallax on scroll
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && !_REDUCED_MOTION) {
    gsap.to(heroBg, {
      yPercent: 22, ease: 'none',
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      },
    });
  }
}

function _splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/gi);
  el.innerHTML = parts
    .map(p => `<span class="line-wrap"><span class="line-inner">${p}</span></span>`)
    .join('');
}

// ════════════════════════════════════════════════
//  TELEMETRY TICKER (home hero status + values)
// ════════════════════════════════════════════════
function _initTelemetryTicker() {
  const values = document.querySelectorAll('.telemetry-value[data-animate]');
  values.forEach(el => {
    const target = parseFloat(el.getAttribute('data-animate'));
    const suffix = el.getAttribute('data-suffix') || '';
    const dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, delay: 1.0, ease: 'power2.out',
      onUpdate: () => { el.firstChild.textContent = obj.v.toFixed(dec) + suffix; },
    });
  });
}

// ════════════════════════════════════════════════
//  SCROLL ANIMATIONS
// ════════════════════════════════════════════════
function _initScrollAnims() {

  function _inView(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }

  gsap.utils.toArray('.section-title').forEach(el => {
    if (_inView(el) || el.classList.contains('visible')) return;
    gsap.set(el, { opacity: 0, y: 34 });
    el.classList.remove('reveal');
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }),
    });
  });

  gsap.utils.toArray('.about-title').forEach(el => {
    if (_inView(el) || el.classList.contains('visible')) return;
    gsap.set(el, { opacity: 0, y: 28 });
    el.classList.remove('reveal');
    ScrollTrigger.create({
      trigger: el, start: 'top 87%', once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
    });
  });

  const aboutSection = document.querySelector('.about-section');
  if (aboutSection && !_REDUCED_MOTION) {
    const inner = aboutSection.querySelector('.about-inner');
    if (inner) {
      gsap.fromTo(inner, { y: -18 }, {
        y: 18, ease: 'none',
        scrollTrigger: {
          trigger: aboutSection, start: 'top bottom', end: 'bottom top', scrub: true,
        },
      });
    }
  }

  const allCards = gsap.utils.toArray('.project-card');
  for (let i = 0; i < allCards.length; i += 2) {
    const row = allCards.slice(i, i + 2)
      .filter(c => !_inView(c) && !c.classList.contains('visible'));
    if (!row.length) continue;
    row.forEach(c => {
      gsap.set(c, { opacity: 0, y: 42 });
      c.classList.remove('reveal', 'reveal-delay-1');
    });
    ScrollTrigger.create({
      trigger: row[0], start: 'top 88%', once: true,
      onEnter: () => gsap.to(row, {
        opacity: 1, y: 0, duration: 0.68, stagger: 0.12, ease: 'power3.out',
      }),
    });
  }

  const takeaways = gsap.utils.toArray('.takeaway-item')
    .filter(t => !_inView(t) && !t.classList.contains('visible'));
  if (takeaways.length) {
    takeaways.forEach(t => {
      gsap.set(t, { opacity: 0, x: -32 });
      t.classList.remove('reveal');
    });
    ScrollTrigger.create({
      trigger: takeaways[0], start: 'top 85%', once: true,
      onEnter: () => gsap.to(takeaways, {
        opacity: 1, x: 0, duration: 0.62, stagger: 0.1, ease: 'power3.out',
      }),
    });
  }

  gsap.utils.toArray('.stat-num, .metric-callout-value[data-animate]').forEach(el => {
    const raw = el.getAttribute('data-animate') || el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
    if (isNaN(num) || num === 0) return;
    const suffix = raw.replace(/[\d.\-]/g, '').trim();
    const dec = (num % 1 !== 0) ? (raw.split('.')[1]?.length ?? 1) : 0;
    const counter = { val: 0 };
    el.textContent = '0' + suffix;
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(counter, {
        val: num, duration: 1.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = counter.val.toFixed(dec) + suffix; },
      }),
    });
  });

  gsap.utils.toArray('.reveal').forEach(el => {
    if (_inView(el) || el.classList.contains('visible')) return;
    const delay =
      el.classList.contains('reveal-delay-4') ? 0.45 :
      el.classList.contains('reveal-delay-3') ? 0.30 :
      el.classList.contains('reveal-delay-2') ? 0.20 :
      el.classList.contains('reveal-delay-1') ? 0.10 : 0;
    gsap.set(el, { opacity: 0, y: 24 });
    ScrollTrigger.create({
      trigger: el, start: 'top 89%', once: true,
      onEnter: () => gsap.to(el, {
        opacity: 1, y: 0, duration: 0.65, delay, ease: 'power3.out',
      }),
    });
  });
}

// ════════════════════════════════════════════════
//  SCROLL PROGRESS BAR
// ════════════════════════════════════════════════
function _initScrollProgress() {
  if (!document.querySelector('.project-body')) return;

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  gsap.to(bar, {
    scaleX: 1, ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top', end: 'bottom bottom', scrub: 0.15,
    },
  });
}

// ════════════════════════════════════════════════
//  VANILLA TILT
// ════════════════════════════════════════════════
function _initVanillaTilt() {
  if (typeof VanillaTilt === 'undefined' || _REDUCED_MOTION) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max: 3.5, speed: 500, perspective: 1400,
    glare: true, 'max-glare': 0.05, scale: 1.005,
  });
}

// ════════════════════════════════════════════════
//  NAV
// ════════════════════════════════════════════════
function _initNav() {
  const nav = document.querySelector('nav');
  if (nav) {
    const onScroll = () => {
      const scrolled = window.scrollY > 60;
      nav.style.boxShadow = scrolled
        ? '0 1px 24px rgba(28,26,23,0.09)' : 'none';
      document.body.classList.toggle('nav-scrolled', scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dd => {
    const trigger = dd.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = dd.classList.contains('open');
      dropdowns.forEach(d => d.classList.remove('open'));
      if (!wasOpen) dd.classList.add('open');
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown'))
      dropdowns.forEach(d => d.classList.remove('open'));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      dropdowns.forEach(d => d.classList.remove('open'));
  });
}
