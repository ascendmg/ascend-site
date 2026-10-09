/* HQAscend case study template runtime. Reads #csData (JSON) and powers hero phone, showcase demos, and feature visuals. */
(function () {
  'use strict';
  var dataEl = document.getElementById('csData'); if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function onView(node, fn, th) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: th || 0.3 });
    io.observe(node);
  }
  var accentStyle = function (c) { return c ? ' style="--a:' + esc(c) + '"' : ''; };

  /* ---------- Hero phone (recreated mobile home) ---------- */
  (function () {
    var m = D.hero.mobile, host = $('#csPhone'); if (!host) return;
    var path = '';
    for (var i = 1; i <= (m.path || 0); i++) path += '<i' + (i === 1 ? ' class="on"' : '') + '>' + i + '</i>' + (i < m.path ? '<u></u>' : '');
    host.innerHTML = '<div class="cs-phone-in"' + accentStyle(m.accent) + '>' +
      '<div class="cs-m-top"><span class="cs-m-brand' + (m.serif ? ' serif' : '') + '">' + esc(m.brand) + '<b>' + esc(m.brandAccent) + '</b></span>' +
      (m.toggle ? '<span class="cs-m-tg"><span>EN</span><span>ES</span></span>' : '<span class="cs-m-burger"></span>') + '</div>' +
      '<div class="cs-m-body"><div class="cs-m-eye">' + esc(m.eyebrow) + '</div>' +
      (m.logo ? '<img class="cs-m-logo" src="' + esc(m.logo) + '" alt="">' : '') +
      '<div class="cs-m-h' + (m.serif ? ' serif' : '') + '">' + esc(m.headline) + '</div>' +
      (path ? '<div class="cs-m-path">' + path + '</div>' : '') +
      '<div class="cs-m-btn">' + esc(m.cta) + '</div><div class="cs-m-btn2">' + esc(m.cta2) + '</div></div></div>';
    if (m.path && !reduce) {
      var dots = $$('.cs-m-path i', host), k = 0;
      setInterval(function () { k = (k + 1) % (dots.length + 1); dots.forEach(function (d, j) { d.classList.toggle('on', j < Math.max(k, 1)); }); }, 900);
    }
  })();

  /* ---------- Demo components ---------- */
  var DEMOS = {};
  DEMOS.screenshot = function (t) { var s = el('div', 'cs-scene shot'); s.innerHTML = '<img src="' + esc(t.img) + '" alt="' + esc(t.alt) + '" loading="lazy">'; return { node: s }; };

  DEMOS.dashboard = function (t) {
    var s = el('div', 'cs-scene'), cur = t.current - 1;
    var stg = t.stages.map(function (n, i) { return '<li><button type="button" data-i="' + i + '" class="' + (i < cur ? 'done ' : '') + (i === cur ? 'cur' : '') + '"><span class="n">' + (i + 1) + '</span>' + esc(n) + '</button></li>'; }).join('');
    var less = t.lessons.map(function (l) { return '<button type="button" aria-expanded="false"><b>' + esc(l.t) + '</b><span>' + esc(l.p) + '</span></button>'; }).join('');
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-dash"><div class="dm-box"><h4>Your progress</h4><div class="dm-prog"><i></i></div><div class="dm-pv" style="font-size:12px;color:#667"><b class="pc" style="color:#1b2230;font-size:15px">0%</b> complete</div><div class="dm-stats"><div><b>' + t.streak + '</b>day streak</div><div><b>' + t.badges + '</b>badges</div></div><ul class="dm-stg">' + stg + '</ul><button class="dm-cont" type="button">Continue &rarr; Stage ' + t.current + '</button></div><div class="dm-box"><h4>Sample lessons</h4><div class="dm-less">' + less + '</div></div></div></div>';
    var bar = $('.dm-prog i', s), pc = $('.pc', s), shown = false;
    function run() {
      if (shown) return; shown = true; bar.style.width = t.progress + '%';
      if (reduce) { pc.textContent = t.progress + '%'; return; }
      var st = performance.now(); (function f(n) { var p = Math.min(1, (n - st) / 1200); pc.textContent = Math.round(t.progress * (1 - Math.pow(1 - p, 3))) + '%'; if (p < 1) requestAnimationFrame(f); })(st);
    }
    $$('.dm-less button', s).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); }); });
    $$('.dm-stg button', s).forEach(function (b) { b.addEventListener('click', function () { $$('.dm-stg button', s).forEach(function (x) { x.classList.remove('cur'); }); b.classList.add('cur'); $('.dm-cont', s).innerHTML = 'Continue &rarr; Stage ' + (+b.dataset.i + 1); }); });
    return { node: s, enter: run };
  };

  DEMOS.bilingual = function (t) {
    var s = el('div', 'cs-scene'), lang = 'en', timer = null, touched = false;
    s.innerHTML = '<div class="dm dm-bi"' + accentStyle(t.accent) + '><div class="dm-head"><span class="dm-brand' + (t.serif ? ' serif' : '') + '">' + esc(t.brand) + '<b>' + esc(t.brandAccent) + '</b></span><div class="dm-nav">' + t.nav.map(function (n) { return '<span class="swap" data-k="nav">' + esc(n.en) + '</span>'; }).join('') + '</div><div class="tg" role="group" aria-label="Language"><button type="button" data-l="en" aria-pressed="true">EN</button><button type="button" data-l="es" aria-pressed="false">ES</button></div></div><h3 class="dm-hero-t swap' + (t.serif ? ' serif' : '') + '">' + esc(t.headline.en) + '</h3><p class="dm-hero-p swap">' + esc(t.text.en) + '</p><span class="dm-btn swap">' + esc(t.button.en) + '</span><p class="dm-hint">Tap EN / ES to switch the interface language.</p></div>';
    var root = $('.dm-bi', s);
    function set(l, user) {
      if (user) touched = true; lang = l; root.classList.add('fade');
      setTimeout(function () {
        $$('[data-k="nav"]', s).forEach(function (n, i) { n.textContent = t.nav[i][l]; });
        $('.dm-hero-t', s).textContent = t.headline[l]; $('.dm-hero-p', s).textContent = t.text[l]; $('.dm-btn', s).textContent = t.button[l];
        $$('.tg button', s).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.l === l ? 'true' : 'false'); });
        root.classList.remove('fade');
      }, reduce ? 0 : 200);
    }
    $$('.tg button', s).forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.l, true); }); });
    return { node: s, enter: function () { if (t.auto && !reduce) { setTimeout(function () { if (!touched) set('es'); }, 1400); timer = setInterval(function () { if (!touched) set(lang === 'en' ? 'es' : 'en'); }, 4200); } }, leave: function () { clearInterval(timer); } };
  };

  DEMOS.quiz = function (t) {
    var s = el('div', 'cs-scene'), lang = 'en', done = false;
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-quiz"><div class="dm-head"><span style="font-size:12px;color:#667;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Practice question</span>' + (t.question.es ? '<div class="tg"><button type="button" data-l="en" aria-pressed="true">EN</button><button type="button" data-l="es" aria-pressed="false">ES</button></div>' : '') + '</div><div class="dm-q"></div><div class="dm-opts" role="radiogroup"></div><button class="dm-cont" type="button" style="margin-top:12px">Check Answer</button><div class="dm-res" aria-live="polite"></div><div class="dm-also">' + (t.also || []).map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div></div></div>';
    var sel = -1, opts = $('.dm-opts', s), q = $('.dm-q', s), res = $('.dm-res', s);
    function draw() {
      q.textContent = t.question[lang]; opts.innerHTML = '';
      t.options.forEach(function (o, i) { var b = el('button', i === sel ? 'sel' : '', '<span class="r"></span>' + esc(o[lang] || o.en)); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === sel ? 'true' : 'false'); b.addEventListener('click', function () { if (done) return; sel = i; res.textContent = ''; res.className = 'dm-res'; draw(); }); opts.appendChild(b); });
    }
    draw();
    $$('.tg button', s).forEach(function (b) { b.addEventListener('click', function () { lang = b.dataset.l; $$('.tg button', s).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); }); });
    $('.dm-cont', s).addEventListener('click', function () {
      if (sel < 0) { res.textContent = 'Pick an answer first.'; res.className = 'dm-res'; return; }
      var ok = !!t.options[sel].correct; res.textContent = ok ? 'Correct!' : 'Not quite. Try another answer.'; res.className = 'dm-res ' + (ok ? 'ok' : 'no');
      $$('.dm-opts button', s).forEach(function (b, i) { b.classList.toggle('ok', ok && i === sel); b.classList.toggle('no', !ok && i === sel); });
      if (ok) done = true;
    });
    return { node: s };
  };

  DEMOS.steps = function (t) {
    var s = el('div', 'cs-scene'), cur = 0, timer = null, touched = false, n = t.steps.length;
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-steps"><span class="fill"></span>' + t.steps.map(function (x, i) { return '<button type="button" data-i="' + i + '"><span class="dot">' + (i + 1) + '</span><b>' + esc(x.t) + '</b></button>'; }).join('') + '</div><div class="dm-stepd" aria-live="polite"></div><div class="dm-price"><b>' + esc(t.price) + '</b><span>' + esc(t.priceNote) + '</span></div></div>';
    var btns = $$('.dm-steps button', s), box = $('.dm-stepd', s), fill = $('.fill', s);
    function go(i) { cur = i; btns.forEach(function (b, j) { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i); }); fill.style.width = (80 * i / (n - 1)) + '%'; box.innerHTML = '<b>' + (i + 1) + '. ' + esc(t.steps[i].t) + '</b><br>' + esc(t.steps[i].d); }
    btns.forEach(function (b) { b.addEventListener('click', function () { touched = true; go(+b.dataset.i); }); });
    go(0);
    return { node: s, enter: function () { if (reduce) return; timer = setInterval(function () { if (touched) { clearInterval(timer); return; } go((cur + 1) % n); }, 1800); }, leave: function () { clearInterval(timer); } };
  };

  DEMOS.pairs = function (t) {
    var s = el('div', 'cs-scene');
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-colhead"><span>English</span><span>Español</span></div><div class="dm-pairs">' + t.pairs.map(function (p) { return '<div class="dm-pair" tabindex="0"><span>' + esc(p.en) + '</span><span>' + esc(p.es) + '</span></div>'; }).join('') + '</div></div>';
    return { node: s };
  };

  DEMOS.contact = function (t) {
    var s = el('div', 'cs-scene');
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-contact"><div><a class="dm-call" href="tel:' + esc(t.phone.replace(/\D/g, '')) + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/></svg>Call ' + esc(t.phone) + '</a><div class="dm-info">' + esc(t.address) + '<br>Hours: ' + esc(t.hours) + '</div></div><form class="dm-form" novalidate>' + t.fields.map(function (f) { return '<label>' + esc(f) + '<input type="text" autocomplete="off" aria-label="' + esc(f) + '"></label>'; }).join('') + '<button type="submit">Send Message</button><div class="sent" aria-live="polite"></div></form></div></div>';
    $('form', s).addEventListener('submit', function (e) { e.preventDefault(); $('.sent', s).textContent = 'Demo only. Nothing was sent.'; });
    return { node: s };
  };

  function ring(score, outOf, r, w) {
    var c = 2 * Math.PI * r; return '<svg width="' + (2 * (r + w)) + '" height="' + (2 * (r + w)) + '" viewBox="0 0 ' + (2 * (r + w)) + ' ' + (2 * (r + w)) + '"><defs><linearGradient id="csg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset=".5" stop-color="#a855f7"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><circle cx="' + (r + w) + '" cy="' + (r + w) + '" r="' + r + '" fill="none" stroke="#e6e9f2" stroke-width="' + w + '"/><circle class="arc" cx="' + (r + w) + '" cy="' + (r + w) + '" r="' + r + '" fill="none" stroke="url(#csg)" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" style="transition:stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)" data-c="' + c + '" data-to="' + (c * (1 - score / outOf)) + '"/></svg>';
  }
  function runRing(root, score, numEl) {
    var a = $('.arc', root); if (!a) return;
    if (reduce) { a.style.transition = 'none'; a.style.strokeDashoffset = a.dataset.to; numEl.textContent = score; return; }
    requestAnimationFrame(function () { a.style.strokeDashoffset = a.dataset.to; });
    var st = performance.now(); (function f(n) { var p = Math.min(1, (n - st) / 1300); numEl.textContent = Math.round(score * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(st);
  }
  DEMOS.audit = function (t) {
    var s = el('div', 'cs-scene');
    s.innerHTML = '<div class="dm"' + accentStyle(t.accent) + '><div class="dm-audit"><div class="dm-ring">' + ring(t.score, t.outOf, 74, 12) + '<div class="t"><b>0</b><small>out of ' + t.outOf + '</small></div></div><ul class="dm-find">' + t.findings.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div></div>';
    return { node: s, enter: function () { runRing(s, t.score, $('b', s)); $$('.dm-find li', s).forEach(function (li, i) { setTimeout(function () { li.classList.add('in'); }, reduce ? 0 : 500 + i * 350); }); } };
  };

  /* ---------- Showcase controller ---------- */
  var stage = $('#csStage'), tabs = $$('#csTabsX, .cs-tabs button'), scenes = [], cur = -1, entered = {};
  var tabBtns = $$('.cs-tabs button');
  D.showcase.tabs.forEach(function (t, i) {
    var f = DEMOS[t.type]; if (!f) return; var d = f(t); d.node.setAttribute('role', 'presentation'); stage.appendChild(d.node); scenes[i] = d;
  });
  function fit() {
    var sc = scenes[cur]; if (!sc) return; var c = sc.node.firstElementChild; if (!c) return;
    var h = Math.max(c.offsetHeight, c.scrollHeight);
    stage.style.height = Math.max(200, Math.min(h, 620)) + 'px';
  }
  window.addEventListener('resize', fit);
  $$('.cs-scene img', stage).forEach(function (im) { im.addEventListener('load', fit); });
  function show(i, user) {
    if (i === cur) return; var prev = scenes[cur], next = scenes[i], t = D.showcase.tabs[i];
    if (prev) { prev.node.classList.remove('on'); prev.node.classList.add('out'); if (prev.leave) prev.leave(); (function (n) { setTimeout(function () { n.classList.remove('out'); }, 360); })(prev.node); }
    next.node.classList.add('on'); next.node.scrollTop = 0; if (next.enter) next.enter();
    cur = i; fit(); setTimeout(fit, 60);
    tabBtns.forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; });
    $('#csUrl').textContent = D.host + (t.path && t.path !== '/' ? t.path : '');
    $('#csCapText').textContent = t.blurb; $('#csTag').textContent = t.tag;
    stage.setAttribute('aria-labelledby', 'cs-tab-' + t.id);
    if (user) { var tb = tabBtns[i]; if (tb.scrollIntoView) tb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
  }
  tabBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { show(i, true); });
    b.addEventListener('keydown', function (e) { var n = tabBtns.length, k = e.key; if (k === 'ArrowRight' || k === 'ArrowLeft') { var j = (i + (k === 'ArrowRight' ? 1 : -1) + n) % n; show(j, true); tabBtns[j].focus(); } });
  });
  var frame = $('#csFrame');
  $$('.cs-dev button').forEach(function (b) { b.addEventListener('click', function () { var m = b.dataset.dev === 'mobile'; frame.classList.toggle('mobile', m); setTimeout(fit, 30); setTimeout(fit, 540); $$('.cs-dev button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
  show(0);
  // Demos animate when the showcase scrolls into view
  onView($('.cs-showwrap'), function () { var sc = scenes[cur]; if (sc && sc.enter) sc.enter(); }, 0.25);

  /* ---------- Section animations ---------- */
  var vs = $('.cs-vs'); if (vs) onView(vs, function () { vs.classList.add('in'); }, 0.3);
  var rs = $('.cs-results'); if (rs) onView(rs, function () { rs.classList.add('in'); }, 0.3);

  /* ---------- Feature visuals ---------- */
  var VIS = {
    stages: function (f, host) {
      var n = f.stages.length, h = ''; for (var i = 0; i < n; i++) h += '<i>' + (i + 1) + '</i>' + (i < n - 1 ? '<u></u>' : '');
      host.innerHTML = '<div class="fv-stages">' + h + '</div><div class="fv-lbl"></div>';
      var dots = $$('i', host), bars = $$('u', host), lbl = $('.fv-lbl', host), k = 0, timer = null;
      function set(x) { k = x; dots.forEach(function (d, j) { d.classList.toggle('on', j <= x); }); bars.forEach(function (b, j) { b.classList.toggle('on', j < x); }); lbl.textContent = 'Stage ' + (x + 1) + ': ' + f.stages[x]; }
      set(0);
      if (!reduce) onView(host, function () { timer = setInterval(function () { set((k + 1) % n); }, 1100); }, 0.4);
      else set(n - 1);
    },
    lang: function (f, host) {
      host.innerHTML = '<div class="fv-lang"><div class="tg"><button type="button" data-l="en" aria-pressed="true">EN</button><button type="button" data-l="es" aria-pressed="false">ES</button></div><br><span class="btn">' + esc(f.en) + '</span></div>';
      var btn = $('.btn', host), user = false, l = 'en';
      function set(x) { l = x; btn.style.opacity = 0; setTimeout(function () { btn.textContent = f[x]; btn.style.opacity = 1; }, 160); $$('.tg button', host).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.l === x ? 'true' : 'false'); }); }
      $$('.tg button', host).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); user = true; set(b.dataset.l); }); });
      if (!reduce) onView(host, function () { setInterval(function () { if (!user) set(l === 'en' ? 'es' : 'en'); }, 2400); }, 0.4);
    },
    quiz: function (f, host) {
      host.innerHTML = '<div class="fv-quiz"><p>' + esc(f.q) + '</p><button type="button" data-c="0">' + esc(f.wrong) + '</button><button type="button" data-c="1">' + esc(f.a) + '</button></div>';
      $$('button', host).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); $$('button', host).forEach(function (x) { x.className = ''; }); b.className = b.dataset.c === '1' ? 'ok' : 'no'; }); });
    },
    call: function (f, host) { host.innerHTML = '<div class="fv-call"><div class="ring"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/></svg></div><b>' + esc(f.phone) + '</b></div>'; },
    audit: function (f, host) { host.innerHTML = '<div class="fv-audit">' + ring(f.score, 100, 40, 9) + '<div class="t"><b>0</b><small>/100</small></div></div>'; onView(host, function () { runRing(host, f.score, $('b', host)); }, 0.4); },
    pairs: function (f, host) { host.innerHTML = '<div class="fv-pairs">' + f.pairs.map(function (p) { return '<div><span>' + esc(p.en) + '</span><span>' + esc(p.es) + '</span></div>'; }).join('') + '</div>'; }
  };
  D.features.items.forEach(function (f, i) { var h = $('[data-vis="' + i + '"]'); if (h && VIS[f.type]) VIS[f.type](f, h); });
  // tap to open "more" on touch
  $$('.cs-feat').forEach(function (c) { c.addEventListener('click', function () { c.classList.toggle('open'); }); });
})();
