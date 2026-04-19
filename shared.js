/* ================================================
   shared.js — Portfolio of Rodrigo Diaz
   GSAP · ScrollTrigger · Lenis · VanillaTilt
   Custom Cursor · Page Transitions · Scroll Progress
   ================================================ */

// ── CDN URLS ────────────────────────────────────
const _CDN = {
  gsap:   'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  st:     'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  lenis:  'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1/bundled/lenis.min.js',
  tilt:   'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.2/vanilla-tilt.min.js',
};

// ── CSS FALLBACK ─────────────────────────────────
// Show content if GSAP doesn't load within 2.5s
let _gsapReady = false;
const _fallback = setTimeout(() => {
  if (_gsapReady) return;
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  document.querySelectorAll('[data-hero]').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}, 2500);

// ── CLAIM HERO ELEMENTS IMMEDIATELY ──────────────
// Prevent CSS reveal observer from firing on them before GSAP loads
(function claimHero() {
  ['.hero-eyebrow', '.hero-name', '.hero-desc', '.hero-cta'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove('reveal', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3', 'reveal-delay-4');
    el.setAttribute('data-hero', '1');
    el.style.opacity = '0';
  });
})();

// ── SCRIPT LOADER ────────────────────────────────
function _load(src) {
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = resolve; // fail silently — CSS fallback catches it
    document.head.appendChild(s);
  });
}

// Load: GSAP → ScrollTrigger → (Lenis + VanillaTilt in parallel) → boot
_load(_CDN.gsap)
  .then(() => _load(_CDN.st))
  .then(() => Promise.all([_load(_CDN.lenis), _load(_CDN.tilt)]))
  .then(boot);

// ── BOOT ─────────────────────────────────────────
function boot() {
  _gsapReady = true;
  clearTimeout(_fallback);

  gsap.registerPlugin(ScrollTrigger);

  _initPageTransition(); // first — creates overlay
  _initLenis();
  _initCustomCursor();
  _initHero();
  _initScrollAnims();
  _initScrollProgress();
  _initVanillaTilt();
  _initNav();
}

// ════════════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ════════════════════════════════════════════════
function _initLenis() {
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Let GSAP anchor scrolls (for href="#section" links)
  document.documentElement.style.scrollBehavior = 'auto';
}

// ════════════════════════════════════════════════
// PAGE TRANSITIONS  (250ms fade out / 350ms fade in)
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

  // Intercept internal link clicks → fade out then navigate
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    // Skip: hash links, external, mailto/tel, new-tab, resume PDF
    if (
      href.startsWith('#') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      link.target === '_blank' ||
      (href.startsWith('http') && !href.includes('rodrigodiaz.dev') && !href.includes('github.io'))
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
// CUSTOM CURSOR  (dot + lagging ring, terracotta)
// ════════════════════════════════════════════════
function _initCustomCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = window.innerWidth  / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my;

  // Dot follows mouse precisely
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { x: mx, y: my, duration: 0.07, ease: 'none' });
  });

  // Ring springs behind with lag
  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    gsap.set(ring, { x: rx, y: ry });
  });

  // Expand on interactive elements
  function _attachHover() {
    document.querySelectorAll('a, button, .project-card, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        gsap.to(dot,  { scale: 1.7, duration: 0.2, ease: 'power2.out' });
        gsap.to(ring, { scale: 1.55, borderColor: 'rgba(196,98,45,0.45)',
                        background: 'rgba(196,98,45,0.06)', duration: 0.25 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(dot,  { scale: 1, duration: 0.2 });
        gsap.to(ring, { scale: 1, borderColor: 'rgba(196,98,45,0.8)',
                        background: 'transparent', duration: 0.25 });
      });
    });
  }
  _attachHover();
}

// ════════════════════════════════════════════════
// HERO — DRAMATIC ENTRANCE
// eyebrow slides in → name lines rise up → desc fades → cta fades
// ════════════════════════════════════════════════
function _initHero() {
  const name    = document.querySelector('.hero-name');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const desc    = document.querySelector('.hero-desc');
  const cta     = document.querySelector('.hero-cta');

  if (!name) return;

  // Split .hero-name HTML by <br> into masked line spans
  _splitLines(name);
  gsap.set(name, { opacity: 1 }); // parent visible; children animate

  const tl = gsap.timeline({ delay: 0.08 });

  // 1. Eyebrow slides up
  if (eyebrow) {
    tl.fromTo(eyebrow,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
      0
    );
  }

  // 2. Name lines rise from below mask (Playfair at large size — theatrical)
  const lines = name.querySelectorAll('.line-inner');
  tl.fromTo(lines,
    { y: '108%' },
    { y: '0%', duration: 0.95, stagger: 0.14, ease: 'power4.out' },
    eyebrow ? 0.22 : 0
  );

  // 3. Description paragraph
  if (desc) {
    tl.fromTo(desc,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
      '-=0.52'
    );
  }

  // 4. CTA buttons
  if (cta) {
    tl.fromTo(cta,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.42'
    );
  }

  // 5. Subtle parallax on hero background as you scroll
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 28, ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}

// Split hero-name innerHTML by <br> → .line-wrap > .line-inner
function _splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/gi);
  el.innerHTML = parts
    .map(p => `<span class="line-wrap"><span class="line-inner">${p}</span></span>`)
    .join('');
}

// ════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ════════════════════════════════════════════════
function _initScrollAnims() {

  // Helper: is element already in viewport when page loads?
  function _inView(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  // ── Section titles — slide up ─────────────────
  gsap.utils.toArray('.section-title').forEach(el => {
    if (_inView(el)) return; // already visible, leave it
    gsap.set(el, { opacity: 0, y: 34 });
    el.classList.remove('reveal');
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }),
    });
  });

  // ── About section — title + content ───────────
  gsap.utils.toArray('.about-title').forEach(el => {
    if (_inView(el)) return;
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
      gsap.fromTo(inner,
        { y: -18 },
        {
          y: 18, ease: 'none',
          scrollTrigger: {
            trigger: aboutSection,
            start: 'top bottom', end: 'bottom top',
            scrub: true,
          },
        }
      );
    }
  }

  // ── Project cards — stagger in rows of 2 ──────
  const allCards = gsap.utils.toArray('.project-card');
  for (let i = 0; i < allCards.length; i += 2) {
    const row = allCards.slice(i, i + 2).filter(c => !_inView(c));
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
  const takeaways = gsap.utils.toArray('.takeaway-item').filter(t => !_inView(t));
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

  // ── Project title (individual project pages) ──
  const projectTitle = document.querySelector('.project-title');
  if (projectTitle && !_inView(projectTitle)) {
    gsap.set(projectTitle, { opacity: 0, y: 32 });
    ScrollTrigger.create({
      trigger: projectTitle, start: 'top 88%', once: true,
      onEnter: () => gsap.to(projectTitle, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }),
    });
  }

  // ── Stat number counters ───────────────────────
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

  // ── Everything else with .reveal ──────────────
  // (section headings not matched above, labels, descriptions, etc.)
  gsap.utils.toArray('.reveal').forEach(el => {
    if (_inView(el)) return;
    const delay =
      el.classList.contains('reveal-delay-4') ? 0.45 :
      el.classList.contains('reveal-delay-3') ? 0.3  :
      el.classList.contains('reveal-delay-2') ? 0.2  :
      el.classList.contains('reveal-delay-1') ? 0.1  : 0;
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
// SCROLL PROGRESS BAR  (individual project pages only)
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
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.15,
    },
  });
}

// ════════════════════════════════════════════════
// VANILLA TILT  (desktop cards only)
// ════════════════════════════════════════════════
function _initVanillaTilt() {
  if (typeof VanillaTilt === 'undefined') return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max:          4.5,
    speed:        500,
    perspective:  1300,
    glare:        true,
    'max-glare':  0.06,
    scale:        1.008,
  });
}

// ════════════════════════════════════════════════
// NAV  (shadow on scroll + click dropdown)
// ════════════════════════════════════════════════
function _initNav() {
  // ── Shadow ────────────────────────────────────
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 60
        ? '0 1px 24px rgba(28,26,23,0.09)'
        : 'none';
    }, { passive: true });
  }

  // ── Click dropdown (toggle .open, click-outside closes) ──
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dd => {
    const trigger = dd.querySelector(':scope > a');
    if (!trigger) return;
    trigger.addEventListener('click', e => {
      e.preventDefault();
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
