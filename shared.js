/* ================================================
   shared.js — Portfolio of Rodrigo Diaz
   ================================================ */

// ── SCROLL REVEAL ──────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── NAV SHADOW ON SCROLL ───────────────────────
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 60
      ? '0 1px 24px rgba(28,26,23,0.09)'
      : 'none';
  }, { passive: true });
}

// ── DROPDOWN — CLICK TO OPEN, CLICK OUTSIDE TO CLOSE ──
const dropdowns = document.querySelectorAll('.nav-dropdown');

dropdowns.forEach(dropdown => {
  const trigger = dropdown.querySelector('a');
  const menu = dropdown.querySelector('.nav-dropdown-menu');

  // Click the trigger link to toggle
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = dropdown.classList.contains('open');
    // Close all other dropdowns
    dropdowns.forEach(d => d.classList.remove('open'));
    // Toggle this one
    if (!isOpen) dropdown.classList.add('open');
  });
});

// Click anywhere outside to close
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-dropdown')) {
    dropdowns.forEach(d => d.classList.remove('open'));
  }
});

// Escape key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    dropdowns.forEach(d => d.classList.remove('open'));
  }
});
