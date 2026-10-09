/* Helpers shared by the interactive service pages. No dependencies. */
window.AX = (function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  // Animate a value from its current state to a target. Returns a cancel function.
  function animate(from, to, ms, onUpdate, onDone) {
    if (reduce || ms <= 0) { onUpdate(to); if (onDone) onDone(); return function () {}; }
    let raf, cancelled = false; const t0 = performance.now();
    function f(now) {
      if (cancelled) return;
      const p = Math.max(0, Math.min((now - t0) / ms, 1));
      onUpdate(lerp(from, to, ease(p)));
      if (p < 1) raf = requestAnimationFrame(f); else if (onDone) onDone();
    }
    raf = requestAnimationFrame(f);
    return function () { cancelled = true; cancelAnimationFrame(raf); };
  }
  // Run a function the first time an element scrolls into view.
  function onView(el, fn, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: threshold || 0.35 });
    io.observe(el);
  }
  function setFill(r) {
    const min = parseFloat(r.min), max = parseFloat(r.max), v = parseFloat(r.value);
    r.style.setProperty('--pr', (v - min) / (max - min));
  }
  // Roving tabs: arrow keys move between buttons in a [role=tablist]
  function tabKeys(list) {
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const b = Array.from(list.querySelectorAll('button')); const i = b.indexOf(document.activeElement);
      if (i < 0) return; const n = b[(i + (e.key === 'ArrowRight' ? 1 : b.length - 1)) % b.length];
      n.focus(); n.click(); e.preventDefault();
    });
  }
  function contactLink(msg) { return 'contact?msg=' + encodeURIComponent(msg); }
  return { reduce, money, num, lerp, ease, animate, onView, setFill, tabKeys, contactLink };
})();
