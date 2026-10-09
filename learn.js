/* Learn: enhances server-rendered content. Article text never depends on this file. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function onView(n, fn, th) { if (!('IntersectionObserver' in window)) { fn(); return; } var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: th || 0.35 }); io.observe(n); }

  /* Hub: category filter */
  var chips = $$('.lh-chip');
  if (chips.length) {
    var posts = $$('.lh-post'), empty = $('.lh-empty');
    var apply = function (f) {
      var n = 0; posts.forEach(function (p) { var show = f === 'all' || p.dataset.cat === f; p.hidden = !show; if (show) n++; });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.f === f ? 'true' : 'false'); });
      if (empty) empty.hidden = n > 0;
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.f); try { history.replaceState(null, '', c.dataset.f === 'all' ? location.pathname : '#' + c.dataset.f); } catch (e) {} }); });
    var h = location.hash.replace('#', ''); if (h && chips.some(function (c) { return c.dataset.f === h; })) apply(h);
  }

  /* Article: collapse TOC on small screens, highlight current section */
  var toc = $('.la-toc details');
  if (toc && window.matchMedia('(max-width: 900px)').matches) toc.removeAttribute('open');
  var links = $$('.la-toc li a');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (l) { l.classList.remove('on'); }); map[en.target.id].classList.add('on'); } }); }, { rootMargin: '-90px 0px -70% 0px' });
    heads.forEach(function (h2) { io.observe(h2); });
  }

  /* Journey */
  $$('.journey').forEach(function (w) {
    var steps = $$('.lw-step', w), dot = $('.lw-dot', w), rail = $('.lw-rail', w), cur = 0, touched = false;
    function set(i) {
      cur = i; steps.forEach(function (s, j) { s.classList.toggle('on', j === i); $('.lw-stepbtn', s).setAttribute('aria-expanded', j === i ? 'true' : 'false'); });
      var w2 = rail.clientWidth - 14; dot.style.left = (w2 * i / (steps.length - 1)) + 'px';
    }
    steps.forEach(function (s, i) { $('.lw-stepbtn', s).addEventListener('click', function () { touched = true; set(i); }); });
    set(0);
    window.addEventListener('resize', function () { set(cur); });
    if (!reduce) onView(w, function () { var i = 0, t = setInterval(function () { if (touched || ++i >= steps.length) { clearInterval(t); return; } set(i); }, 1400); });
  });

  /* Before / after */
  $$('.ba').forEach(function (w) {
    $$('.ba-ctl button', w).forEach(function (b) { b.addEventListener('click', function () { w.dataset.state = b.dataset.s; $$('.ba-ctl button', w).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
  });

  /* SERP */
  $$('.serp').forEach(function (w) {
    var info = $('.sp-info', w), regs = $$('.sp-region', w);
    regs.forEach(function (r) {
      r.addEventListener('click', function () { var on = r.getAttribute('aria-pressed') === 'true'; regs.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); if (on) info.removeAttribute('data-active'); else { r.setAttribute('aria-pressed', 'true'); info.setAttribute('data-active', r.dataset.r); } });
    });
  });

  /* Checklists (progress saved in this browser only) */
  $$('.checklist').forEach(function (w) {
    var key = 'ascend-learn-check-' + w.dataset.key, boxes = $$('input', w), count = $('.ck-count', w), bar = $('.ck-bar i', w);
    var saved = {}; try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
    boxes.forEach(function (b) { b.checked = !!saved[b.dataset.i]; });
    function update(save) {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      count.textContent = n + ' of ' + boxes.length + ' complete'; bar.style.width = (100 * n / boxes.length) + '%';
      if (save) { var o = {}; boxes.forEach(function (b) { if (b.checked) o[b.dataset.i] = 1; }); try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} }
    }
    boxes.forEach(function (b) { b.addEventListener('change', function () { update(true); }); });
    $('.ck-reset', w).addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); update(true); });
    update(false);
  });
})();
