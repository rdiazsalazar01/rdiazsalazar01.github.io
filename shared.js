/* ================================================
   shared.js — Portfolio of Rodrigo Diaz
   GSAP · ScrollTrigger · Lenis · VanillaTilt
   Custom Cursor · Page Transitions · Starfield
   ================================================ */

// ── CDN URLS ────────────────────────────────────
const _CDN = {
  gsap:  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  st:    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  lenis: 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1/bundled/lenis.min.js',
  tilt:  'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.2/vanilla-tilt.min.js',
};

// ════════════════════════════════════════════════
//  RUNS IMMEDIATELY (no CDN needed)
// ════════════════════════════════════════════════

// ── 1. Claim hero elements so CSS observer skips them ──
// Sets opacity:0 via inline style before IntersectionObserver fires
;(function claimHero() {
  ['.hero-eyebrow', '.hero-name', '.hero-desc', '.hero-cta'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove('reveal','reveal-delay-1','reveal-delay-2','reveal-delay-3','reveal-delay-4');
    el.setAttribute('data-hero', '1');
    el.style.opacity = '0';
  });
})();

// ── 2. Immediately reveal anything .reveal that's already on screen ──
// Runs synchronously so content is never hidden for > 1 frame on page load.
// Hero elements are skipped (data-hero). Out-of-viewport elements are ignored.
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

// ── 4. Start starfield canvas immediately (no GSAP needed) ──
_initStarfield();

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
//  BOOT  (after all CDNs loaded)
// ════════════════════════════════════════════════
function boot() {
  _gsapReady = true;
  clearTimeout(_fallback);

  gsap.registerPlugin(ScrollTrigger);

  _initPageTransition();
  _initLenis();
  _initCustomCursor();
  _initHero();
  _initScrollAnims();
  _initScrollProgress();
  _initVanillaTilt();
  _initNav();
}

// ════════════════════════════════════════════════
//  STARFIELD CANVAS  (home page hero only)
//  Runs immediately — no GSAP dependency
// ════════════════════════════════════════════════
function _initStarfield() {
  const hero = document.querySelector('.hero');
  if (!hero) return; // only on home page

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, stars, raf;
  let shoot = null;
  let lastShootTime = 0;
  let t = 0;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    mkStars();
  }

  function mkStars() {
    const density = Math.floor((W * H) / 7500);
    const count   = Math.min(Math.max(density, 80), 220);
    stars = Array.from({ length: count }, () => {
      // Warm-white, blue-white, or terracotta-tinted stars
      const roll = Math.random();
      const [r, g, b] =
        roll < 0.12 ? [255, 200, 160] : // warm / terracotta tint
        roll < 0.22 ? [180, 210, 255] : // cold blue-white
                      [255, 252, 245];   // neutral white

      return {
        x:      Math.random() * W,
        y:      Math.random() * H,
        radius: Math.random() * 1.45 + 0.2,
        baseOp: Math.random() * 0.55 + 0.25,
        twFreq: Math.random() * 0.55 + 0.18,  // twinkle freq
        twPhs:  Math.random() * Math.PI * 2,   // twinkle phase
        vx:     (Math.random() - 0.5) * 0.038,
        vy:     (Math.random() - 0.5) * 0.022,
        glow:   Math.random() < 0.11,
        r, g, b,
      };
    });
  }

  // Occasionally fire a shooting star
  function maybeShoot(now) {
    const gap = 8000 + Math.random() * 9000; // 8–17 s
    if (now - lastShootTime < gap) return;
    lastShootTime = now;
    const ang = (Math.PI / 5) + (Math.random() - 0.5) * 0.5; // ~36° ± wobble
    shoot = {
      x:       W * (0.1 + Math.random() * 0.6),
      y:       H * (0.05 + Math.random() * 0.3),
      angle:   ang,
      trailLen: W * (0.10 + Math.random() * 0.10),
      speed:   14 + Math.random() * 9,
      prog:    0,
    };
  }

  function drawShoot() {
    if (!shoot) return;
    shoot.prog += shoot.speed / (shoot.trailLen * 2.8);
    if (shoot.prog > 1.5) { shoot = null; return; }

    const op = shoot.prog < 0.18 ? shoot.prog / 0.18
             : shoot.prog > 0.72 ? Math.max(0, 1 - (shoot.prog - 0.72) / 0.65)
             : 1;

    const hx = shoot.x + Math.cos(shoot.angle) * shoot.prog * shoot.trailLen * 2.8;
    const hy = shoot.y + Math.sin(shoot.angle) * shoot.prog * shoot.trailLen * 2.8;
    const tx = hx - Math.cos(shoot.angle) * shoot.trailLen;
    const ty = hy - Math.sin(shoot.angle) * shoot.trailLen;

    const grad = ctx.createLinearGradient(tx, ty, hx, hy);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, `rgba(255,252,245,${(op * 0.82).toFixed(3)})`);

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    t = now * 0.001;

    stars.forEach(s => {
      // Drift — wrap at edges
      s.x = ((s.x + s.vx) + W) % W;
      s.y = ((s.y + s.vy) + H) % H;

      // Twinkle
      const tw = 0.5 + 0.5 * Math.sin(t * s.twFreq * Math.PI * 2 + s.twPhs);
      const op = s.baseOp * (0.52 + 0.48 * tw);

      // Glow halo (only ~11% of stars)
      if (s.glow) {
        const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 5.5);
        gr.addColorStop(0,   `rgba(${s.r},${s.g},${s.b},${(op).toFixed(3)})`);
        gr.addColorStop(0.35,`rgba(${s.r},${s.g},${s.b},${(op * 0.22).toFixed(3)})`);
        gr.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 5.5, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.r},${s.g},${s.b},${(op).toFixed(3)})`;
      ctx.fill();
    });

    maybeShoot(now);
    drawShoot();

    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);

  window.addEventListener('resize', () => { resize(); }, { passive: true });

  // Pause when tab hidden (battery/performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });
}

// ════════════════════════════════════════════════
//  LENIS SMOOTH SCROLL
// ════════════════════════════════════════════════
function _initLenis() {
  if (typeof Lenis === 'undefined') return;

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

  // Fade in on page load
  gsap.to(overlay, {
    opacity: 0, duration: 0.35, ease: 'power2.out',
    onComplete: () => { overlay.style.pointerEvents = 'none'; },
  });

  // Intercept internal link clicks
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
      opacity: 1, duration: 0.22, ease: 'power2.in',
      onComplete: () => window.location.assign(dest),
    });
  });
}

// ════════════════════════════════════════════════
//  CUSTOM CURSOR
// ════════════════════════════════════════════════
function _initCustomCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { x: mx, y: my, duration: 0.07, ease: 'none' });
  });

  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    gsap.set(ring, { x: rx, y: ry });
  });

  document.querySelectorAll('a, button, .project-card, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(dot,  { scale: 1.7, duration: 0.2 });
      gsap.to(ring, { scale: 1.55, borderColor: 'rgba(196,98,45,0.42)', duration: 0.25 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(dot,  { scale: 1, duration: 0.2 });
      gsap.to(ring, { scale: 1, borderColor: 'rgba(196,98,45,0.8)', duration: 0.25 });
    });
  });
}

// ════════════════════════════════════════════════
//  HERO ENTRANCE ANIMATION
// ════════════════════════════════════════════════
function _initHero() {
  const name    = document.querySelector('.hero-name');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const desc    = document.querySelector('.hero-desc');
  const cta     = document.querySelector('.hero-cta');

  if (!name) return;

  // Split hero name by <br> into masked line spans for the slide-up effect
  _splitLines(name);
  gsap.set(name, { opacity: 1 }); // show parent; lines animate

  const tl = gsap.timeline({ delay: 0.1 });

  if (eyebrow) {
    tl.fromTo(eyebrow,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0);
  }

  const lines = name.querySelectorAll('.line-inner');
  tl.fromTo(lines,
    { y: '108%' },
    { y: '0%', duration: 0.95, stagger: 0.14, ease: 'power4.out' },
    eyebrow ? 0.22 : 0
  );

  if (desc) {
    tl.fromTo(desc,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.52');
  }
  if (cta) {
    tl.fromTo(cta,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.42');
  }

  // Hero background parallax on scroll
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 28, ease: 'none',
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
//  SCROLL ANIMATIONS
// ════════════════════════════════════════════════
function _initScrollAnims() {

  function _inView(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }

  // ── Section titles ────────────────────────────
  gsap.utils.toArray('.section-title').forEach(el => {
    if (_inView(el) || el.classList.contains('visible')) return;
    gsap.set(el, { opacity: 0, y: 34 });
    el.classList.remove('reveal');
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }),
    });
  });

  // ── About title ───────────────────────────────
  gsap.utils.toArray('.about-title').forEach(el => {
    if (_inView(el) || el.classList.contains('visible')) return;
    gsap.set(el, { opacity: 0, y: 28 });
    el.classList.remove('reveal');
    ScrollTrigger.create({
      trigger: el, start: 'top 87%', once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
    });
  });

  // ── About section — subtle parallax depth ─────
  const aboutSection = document.querySelector('.about-section');
  if (aboutSection) {
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

  // ── Project cards — stagger in rows of 2 ──────
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

  // ── Takeaway items — stagger from left ────────
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

  // ── Stat counters ─────────────────────────────
  gsap.utils.toArray('.stat-num').forEach(el => {
    const raw = el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) return;
    const suffix  = raw.replace(/[\d.]/g, '').trim();
    const dec     = (num % 1 !== 0) ? (raw.split('.')[1]?.length ?? 1) : 0;
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

  // ── All remaining .reveal elements ────────────
  // Skip: already in viewport, already made visible by immediateReveal observer,
  // or already claimed by one of the specific handlers above.
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
//  SCROLL PROGRESS BAR  (individual project pages)
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
//  VANILLA TILT  (desktop cards only)
// ════════════════════════════════════════════════
function _initVanillaTilt() {
  if (typeof VanillaTilt === 'undefined') return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max: 4.5, speed: 500, perspective: 1300,
    glare: true, 'max-glare': 0.06, scale: 1.008,
  });
}

// ════════════════════════════════════════════════
//  NAV  (shadow + dropdown)
// ════════════════════════════════════════════════
function _initNav() {
  // Shadow on scroll
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 60
        ? '0 1px 24px rgba(28,26,23,0.09)' : 'none';
    }, { passive: true });
  }

  // ── Dropdown ──────────────────────────────────
  // Click opens/closes. Mouse movement never closes it.
  // stopPropagation prevents the page-transition handler
  // from treating the trigger link as a navigation event.
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dd => {
    const trigger = dd.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation(); // ← keeps page-transition from firing
      const wasOpen = dd.classList.contains('open');
      dropdowns.forEach(d => d.classList.remove('open'));
      if (!wasOpen) dd.classList.add('open');
    });
  });

  // Click anywhere outside → close
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown'))
      dropdowns.forEach(d => d.classList.remove('open'));
  });

  // Escape → close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      dropdowns.forEach(d => d.classList.remove('open'));
  });
}
