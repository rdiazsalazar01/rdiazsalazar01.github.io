/* ================================================
   shared.js — Portfolio of Rodrigo Diaz
   Handles: scroll reveal, nav scroll behavior
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

// ── ACTIVE NAV LINK (optional enhancement) ─────
// Marks the current page link in the nav as active.
const currentPath = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-links a').forEach(link => {
  const linkPath = link.getAttribute('href').split('/').pop();
  if (linkPath === currentPath) {
    link.style.color = 'var(--terracotta)';
  }
});
