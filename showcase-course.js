/* Hearth & Crumb course example: lesson player, shared progress, enrollment steps. Nothing is sent. */
(function () {
  'use strict';
  var K = window.SXKit, $ = K.$, $$ = K.$$;
  window.SXCustom = window.SXCustom || {};
  window.SXCustom.course = function (api) {
    var root = api.root, done = {}, cur = '1.1', timer = null, speed = 1, speeds = [1, 1.25, 1.5];
    var ids = $$('.hc-lp', root).map(function (p) { return p.dataset.lid; });
    var uniq = ids.filter(function (v, i, a) { return a.indexOf(v) === i; });
    var N = uniq.length;
    var pane = function (id) { return $('.hc-lp[data-lid="' + id + '"]', root); };
    function stop() { if (timer) { clearInterval(timer); timer = null; } $$('.hc-play', root).forEach(function (b) { b.textContent = '▶'; b.setAttribute('aria-label', 'Play lesson'); }); }
    function fmt(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
    function time(p) { var tot = Number(p.dataset.min) * 60, s = $('[data-scrub]', p); $('[data-time]', p).textContent = fmt(tot * s.value / 100) + ' / ' + p.dataset.min + ':00'; }
    function show(id) {
      stop(); cur = id;
      $$('.hc-lp', root).forEach(function (p) { p.hidden = p.dataset.lid !== id; });
      var p = pane(id); if (p) { time(p); api.track('lesson_open'); }
      refresh();
    }
    function refresh() {
      var n = Object.keys(done).length, pct = Math.round(n / N * 100);
      $$('.hc-lrow[data-lid]', root).forEach(function (b) { b.classList.toggle('done', !!done[b.dataset.lid]); b.classList.toggle('cur', b.hasAttribute('data-open') && b.dataset.lid === cur); });
      $$('[data-pct]', root).forEach(function (x) { x.textContent = pct + '%'; });
      $$('[data-allbar]', root).forEach(function (x) { x.style.width = pct + '%'; });
      $$('[data-ring]', root).forEach(function (x) { x.style.setProperty('--p', pct); });
      $$('[data-count]', root).forEach(function (x) { x.textContent = n + ' of ' + N + ' lessons'; });
      $$('.hc-sm,.hc-drows li', root).forEach(function () {});
      /* module bars/text come from the lesson list structure */
      var mods = {}; $$('.hc-lside .hc-sm', root).forEach(function (m, i) { mods[i] = $$('.hc-lrow', m).map(function (b) { return b.dataset.lid; }); });
      Object.keys(mods).forEach(function (i) {
        var ls = mods[i], c = ls.filter(function (l) { return done[l]; }).length;
        $$('[data-modbar="' + i + '"]', root).forEach(function (b) { b.style.width = (c / ls.length * 100) + '%'; });
        $$('[data-modtxt="' + i + '"]', root).forEach(function (t) { t.textContent = c + ' of ' + ls.length + ' lessons'; });
        $$('[data-modst="' + i + '"]', root).forEach(function (t) { t.textContent = c === ls.length ? 'Complete' : c ? 'In progress' : 'Not started'; t.className = 'hc-st' + (c === ls.length ? ' ok' : c ? ' on' : ''); });
      });
      var nxt = uniq.filter(function (l) { return !done[l]; })[0];
      var nt = $('[data-nexttitle]', root), ns = $('[data-nextsub]', root), rs = $('[data-resume]', root);
      if (nt) { if (nxt) { var b = $('.hc-lrow.sm[data-lid="' + nxt + '"]', root); nt.textContent = nxt + ' ' + $('.hc-lt', b).textContent.replace(nxt, '').trim(); ns.textContent = b.closest('.hc-sm').querySelector('h3').textContent + ' · ' + b.querySelector('.hc-lm').textContent.replace('m', ' min'); rs.dataset.lid = nxt; } else { nt.textContent = 'You finished the course'; ns.textContent = 'Every lesson is complete. Well done.'; } }
      $$('[data-complete]', root).forEach(function (b) { var id = b.closest('.hc-lp').dataset.lid; b.setAttribute('aria-pressed', done[id] ? 'true' : 'false'); b.textContent = done[id] ? 'Completed' : 'Mark complete'; });
    }
    root.addEventListener('click', function (ev) {
      var t = ev.target;
      var play = t.closest('[data-play]');
      if (play) {
        var p = play.closest('.hc-lp'), s = $('[data-scrub]', p);
        if (timer) { stop(); return; }
        if (Number(s.value) >= 100) s.value = 0;
        play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause lesson'); api.track('lesson_play');
        timer = setInterval(function () { s.value = Number(s.value) + 0.8 * speed; time(p); if (Number(s.value) >= 100) { s.value = 100; time(p); stop(); } }, 250);
        return;
      }
      var sp = t.closest('[data-speed]'); if (sp) { speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length]; $$('[data-speed]', root).forEach(function (b) { b.textContent = speed + 'x'; }); return; }
      var cc = t.closest('[data-cc]'); if (cc) { var on = cc.getAttribute('aria-pressed') !== 'true'; cc.setAttribute('aria-pressed', on); $('.hc-cap', cc.closest('.hc-player')).hidden = !on; return; }
      var comp = t.closest('[data-complete]'); if (comp) { var id = comp.closest('.hc-lp').dataset.lid; if (done[id]) delete done[id]; else done[id] = 1; refresh(); return; }
      var nx = t.closest('[data-nextl]'); if (nx) { show(nx.dataset.nextl); var box = $('.sx-stage', root).classList.contains('sx-full') ? $('.sx-stage', root) : $('.sx-site', root); box.scrollTop = 0; return; }
      var o = t.closest('.hc-lrow[data-lid]'); if (o && !o.hasAttribute('data-goto')) { show(o.dataset.lid); return; }
      var g = t.closest('[data-goto][data-lid],[data-resume],[data-modfirst]');
      if (g) { var id2 = g.dataset.lid || g.dataset.modfirst; if (id2) show(id2); }
      var l = t.closest('.hc-mob [data-goto]'); if (l) { var bg = $('.hc-burger[aria-expanded="true"]', root); if (bg) bg.click(); }
    });
    root.addEventListener('input', function (ev) { var s = ev.target.closest && ev.target.closest('[data-scrub]'); if (s) time(s.closest('.hc-lp')); });
    api.onEvent(function (t) { if (t === 'goto') { stop(); } });
    show('2.1'); /* the free sample lesson opens first */
    /* ---------------- enrollment ---------------- */
    var form = $('#hc-f', root); if (!form) return;
    K.wizard({ root: root, api: api, form: form, last: 3, ev: { start: 'enroll_start', step: 'enroll_step', submit: 'enroll_confirm' }, labels: { next: 'Continue', send: 'Pay $129 (simulated)' },
      validate: function (s) {
        if (s === 2) {
          var n = $('#hc-name', form); if (n.value.trim().length < 2) return ['Enter your full name.', n];
          var m = $('#hc-mail', form); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) return ['Enter an email address like jordan@example.com.', m];
          if (!$('#hc-terms', form).checked) return ['Tick the box to accept the course terms.', $('#hc-terms', form)];
        }
        return null;
      }, reset: function () { $('#hc-terms', form).checked = false; } });
  };
})();
