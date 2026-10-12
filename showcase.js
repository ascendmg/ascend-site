/* Example-platform showcase engine. Everything is local to the page: nothing is saved, sent, or tracked remotely. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var custom = window.SXCustom = window.SXCustom || {};

  function init(root) {
    var D = JSON.parse($('.sx-data', root).textContent), id = D.id;
    var counts = {}, viewId = D.views[0].id, featId = null, listeners = [];
    var help = $('.sx-help', root);

    function metricText(el) {
      var ev = el.dataset.ev.split(','), fmt = el.dataset.fmt; if (!ev[0]) return 'Set up on a real site';
      if (fmt === 'ratio') return 'Demo activity: ' + (counts[ev[1]] || 0) + ' of ' + (counts[ev[0]] || 0) + ' previews';
      return 'Demo activity: ' + (counts[ev[0]] || 0);
    }
    function refresh() { $$('[data-ev]', root).forEach(function (el) { el.textContent = metricText(el); }); }
    function track(ev) { counts[ev] = (counts[ev] || 0) + 1; refresh(); }

    function renderHelp() {
      var f = D.feats[featId], order = D.order[viewId];
      var chips = order.map(function (k) { return '<button type="button" data-feat="' + k + '" aria-pressed="' + (k === featId) + '">' + esc(D.feats[k].label) + '</button>'; }).join('');
      $('.sx-help-body', help).innerHTML =
        '<div class="sx-chips" role="group" aria-label="Highlights on this page"><span class="sx-chips-l">Highlights</span>' + chips + '</div>' +
        '<p class="sx-hl"><b>' + esc(f.title) + '.</b> ' + esc(f.biz || '') + '</p>';
      refresh();
    }
    function flash(k) {
      $$('.sx-reg', root).forEach(function (r) { r.classList.remove('sx-flash'); });
      $$('.sx-hot', root).forEach(function (h) { h.setAttribute('aria-pressed', h.dataset.feat === k ? 'true' : 'false'); });
      var r = $('.sx-reg[data-reg="' + k + '"]', root);
      if (r) { r.classList.add('sx-flash'); clearTimeout(r._t); r._t = setTimeout(function () { r.classList.remove('sx-flash'); }, 2200); }
    }
    function selectFeat(k, doFlash) {
      if (!D.feats[k]) return;
      var f = D.feats[k]; if (f.view !== viewId && !f.shared) return;
      featId = k; renderHelp(); if (doFlash) flash(k); else flash('');
      if (doFlash && window.matchMedia('(max-width:820px)').matches) { var hb = $('.sx-help', root); if (hb) hb.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    }
    function gotoView(v, quiet) {
      viewId = v;
      $$('.sx-tabs [role=tab]', root).forEach(function (t) {
        var on = t.dataset.view === v; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      });
      $$('.sx-view', root).forEach(function (el) { el.hidden = el.dataset.view !== v; });
      var scr = $('.sx-site', root); if (scr) scr.scrollTop = 0;
      $$('.sxs-links [data-goto]', root).forEach(function (b) { if (b.dataset.goto === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      featId = D.order[v][0]; renderHelp(); flash('');
      listeners.forEach(function (fn) { fn('view', v); });
    }
    function sw(v) {
      var p = v.split(':'), grp = p[0], val = p[1];
      $$('[data-pane^="' + grp + ':"]', root).forEach(function (el) { el.hidden = el.dataset.pane !== v; });
      $$('[data-switch^="' + grp + ':"]', root).forEach(function (el) {
        var on = el.dataset.switch === v; el.setAttribute(el.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-pressed', on);
      });
      listeners.forEach(function (fn) { fn('switch', v); });
    }
    var api = { sw: sw, root: root, data: D, track: track, feat: selectFeat, goto: gotoView, onEvent: function (fn) { listeners.push(fn); }, reduce: reduce, esc: esc,
      count: function (e) { return counts[e] || 0; } };

    /* View tabs: click + arrow keys */
    var tabs = $$('.sx-tabs [role=tab]', root);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { gotoView(t.dataset.view); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0]; else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); n.focus(); gotoView(n.dataset.view); }
      });
    });

    /* Explore example: the same live DOM is shown full-screen (state is kept), with Esc / Close, focus return and scroll lock */
    var stage = $('.sx-stage', root), exBtn = $('.sx-explore', root), clBtn = $('.sx-close', root), isFull = false, holder = null;
    function setFull(on) {
      isFull = on;
      /* Re-parent the live node to <body> while open: a transformed ancestor (scroll-reveal) would otherwise trap position:fixed. */
      if (on) { holder = document.createComment('sx'); root.parentNode.insertBefore(holder, root); document.body.appendChild(root); }
      else if (holder && holder.parentNode) { holder.parentNode.insertBefore(root, holder); holder.parentNode.removeChild(holder); holder = null; }
      stage.classList.toggle('sx-full', on); exBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.documentElement.classList.toggle('sx-lock', on);
      if (on) { stage.setAttribute('role', 'dialog'); stage.setAttribute('aria-modal', 'true'); stage.setAttribute('aria-label', 'Example website concept'); stage.scrollTop = 0; clBtn.focus(); }
      else { stage.removeAttribute('role'); stage.removeAttribute('aria-modal'); stage.removeAttribute('aria-label'); exBtn.focus(); }
    }
    exBtn.addEventListener('click', function () { setFull(true); });
    clBtn.addEventListener('click', function () { setFull(false); });
    document.addEventListener('keydown', function (e) {
      if (!isFull) return;
      if (e.key === 'Escape') { e.preventDefault(); setFull(false); return; }
      if (e.key === 'Tab') {
        var f = $$('button:not([disabled]),a[href],select,input,[tabindex="0"]', stage).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (!stage.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
        else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });

    var toastT = null;
    function toast(msg) {
      var el = $('.sx-toast', root); if (!el) { el = document.createElement('div'); el.className = 'sx-toast'; el.setAttribute('role', 'status'); $('.sx-browser', root).appendChild(el); }
      el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2600);
    }
    /* Declarative interactions via data attributes (delegated) */
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button,[data-switch],[data-acc],[data-goto],[data-feat],[data-track]'); if (b && b.closest('.sx-help') && !b.dataset.feat) return; if (!b || !root.contains(b)) return;
      if (b.dataset.switch) {
        sw(b.dataset.switch);
        var g = b.dataset.switch.split(':')[0], lab = b.dataset.label;
        if (lab) $$('[data-sel="' + g + '"]', root).forEach(function (el) { el.textContent = lab; });
      }
      if (b.hasAttribute('data-acc')) {
        var open = b.getAttribute('aria-expanded') === 'true', body = document.getElementById(b.getAttribute('aria-controls'));
        b.setAttribute('aria-expanded', !open); if (body) body.hidden = open; if (!open && b.dataset.trackOpen) track(b.dataset.trackOpen);
      }
      if (b.dataset.track) b.dataset.track.split(',').forEach(track);
      var PM = { call_click: 'In a live site, this starts a phone call.', text_click: 'In a live site, this opens a text message.' };
      if (b.dataset.track && PM[b.dataset.track]) toast(PM[b.dataset.track]);
      if (b.dataset.goto) { gotoView(b.dataset.goto); var br = $('.sx-browser', root); if (isFull) stage.scrollTop = 0; else if (br && br.getBoundingClientRect().top < 0) br.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      if (b.dataset.feat) selectFeat(b.dataset.feat, !b.closest('.sx-help'));
    });

    gotoView(viewId);
    if (custom[id]) custom[id](api);
  }

  /* ---------- Course example: lessons, completion, dashboard ---------- */
  custom.course = function (api) {
    var root = api.root, C = api.data.course, esc = api.esc;
    var lessons = []; C.modules.forEach(function (m, mi) { m.lessons.forEach(function (l) { lessons.push({ id: l[0], t: l[1], min: l[2], s: l[3], tips: l[4], mod: mi }); }); });
    var base = C.baseline.slice(), done = {}; base.forEach(function (k) { done[k] = 1; });
    var cur = C.start;
    var byId = {}; lessons.forEach(function (l, i) { l.i = i; byId[l.id] = l; });
    var nextIncomplete = function (from) {
      for (var k = 0; k < lessons.length; k++) { var l = lessons[(from + k) % lessons.length]; if (!done[l.id]) return l; } return null;
    };
    function modStats(mi) { var ls = lessons.filter(function (l) { return l.mod === mi; }); return { n: ls.length, d: ls.filter(function (l) { return done[l.id]; }).length }; }
    function total() { return lessons.filter(function (l) { return done[l.id]; }).length; }

    function renderLesson() {
      var l = byId[cur], m = C.modules[l.mod], st = modStats(l.mod), isDone = !!done[l.id], prev = lessons[l.i - 1], next = lessons[l.i + 1];
      var list = lessons.filter(function (x) { return x.mod === l.mod; }).map(function (x) {
        return '<li><button type="button" class="cr-lnk' + (x.id === cur ? ' on' : '') + (done[x.id] ? ' done' : '') + '" data-lesson="' + x.id + '" aria-current="' + (x.id === cur) + '"><span class="ck" aria-hidden="true">' + (done[x.id] ? '✓' : '') + '</span><span>' + x.id + ' ' + esc(x.t) + '<small>' + x.min + ' min' + (done[x.id] ? ' · complete' : '') + '</small></span></button></li>';
      }).join('');
      $('#cr-lesson', root).innerHTML =
        '<div class="sxs-row2 top cr-lesson-grid"><div class="sx-reg" data-reg="l_player">' +
        '<button type="button" class="sx-hot" data-feat="l_player" aria-label="Explain: lesson content" aria-pressed="false">i</button>' +
        '<div class="cr-player">' + (l.id === '2.1' ? C.svgDough : C.svgGeneric) + '<div class="cr-cap">Lesson video · playback is not part of this concept</div></div>' +
        '<div class="cr-lbody"><div class="sxs-eyebrow">Module ' + (l.mod + 1) + ' · Lesson ' + l.id + ' · ' + l.min + ' min</div><h2>' + esc(l.t) + '</h2><p>' + esc(l.s) + '</p>' +
        '<h3 class="cr-h3">Try this</h3><ul class="cr-tips">' + l.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<div class="cr-actions sx-reg" data-reg="l_complete" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;position:relative;padding:4px 0">' +
        '<button type="button" class="sxs-btn" data-mark="1" aria-pressed="' + isDone + '">' + (isDone ? '✓ Completed (tap to undo)' : 'Mark complete') + '</button>' +
        (next ? '<button type="button" class="sxs-btn ghost" data-lesson="' + next.id + '">Next lesson →</button>' : '') +
        '<span class="sxs-fine" role="status" aria-live="polite">' + (isDone ? 'Saved only in this preview.' : '') + '</span></div></div></div>' +
        '<aside class="sx-reg cr-side" data-reg="l_nav" aria-label="Lessons in this module"><button type="button" class="sx-hot" data-feat="l_nav" aria-label="Explain: lesson navigation" aria-pressed="false">i</button>' +
        '<div class="sxs-eyebrow">Module ' + (l.mod + 1) + '</div><h3 class="cr-h3" style="margin:2px 0 8px">' + esc(m.t) + '</h3>' +
        '<div class="sxs-prog" aria-hidden="true"><i style="width:' + Math.round(st.d / st.n * 100) + '%"></i></div><div class="sxs-fine" style="margin:6px 0 10px">' + st.d + ' of ' + st.n + ' lessons complete</div><ul class="cr-lnks">' + list + '</ul></aside></div>';
    }
    function renderDash() {
      var t = total(), n = lessons.length, pct = Math.round(t / n * 100), nx = nextIncomplete(byId[cur].i), finished = !nx;
      var mods = C.modules.map(function (m, mi) {
        var s = modStats(mi), state = s.d === s.n ? 'Complete' : (s.d ? 'In progress' : 'Not started');
        var first = lessons.filter(function (x) { return x.mod === mi; }).filter(function (x) { return !done[x.id]; })[0] || lessons.filter(function (x) { return x.mod === mi; })[0];
        return '<li><button type="button" class="cr-mod' + (s.d === s.n ? ' done' : '') + '" data-lesson="' + first.id + '" data-track="dash_module"><span class="cr-modn">' + (mi + 1) + '</span><span class="cr-modt">' + esc(m.t) + '<small>' + s.d + ' of ' + s.n + ' lessons · ' + state + '</small><span class="sxs-prog" aria-hidden="true"><i style="width:' + Math.round(s.d / s.n * 100) + '%"></i></span></span></button></li>';
      }).join('');
      $('#cr-dash', root).innerHTML =
        '<div class="cr-dhead"><div><div class="sxs-eyebrow">Student dashboard</div><h2>Welcome back, Alex</h2></div><button type="button" class="sxs-btn ghost sm" data-reset="1">Reset demo</button></div>' +
        '<div class="cr-dgrid"><div class="cr-dmain">' +
        '<div class="cr-cont sx-reg" data-reg="d_continue"><button type="button" class="sx-hot" data-feat="d_continue" aria-label="Explain: continue learning" aria-pressed="false">i</button>' +
        (finished ? '<div class="sxs-eyebrow" style="color:#e9d9b8">All lessons complete</div><h3>You finished the example course</h3><p>Review any lesson, or pick up where the next course begins.</p>' :
          '<div class="sxs-eyebrow" style="color:#e9d9b8">Continue learning</div><h3>' + nx.id + ' ' + esc(nx.t) + '</h3><p>Module ' + (nx.mod + 1) + ' · ' + esc(C.modules[nx.mod].t) + ' · ' + nx.min + ' min</p><button type="button" class="sxs-btn cr-resume" data-lesson="' + nx.id + '" data-track="resume">Resume lesson →</button>') + '</div>' +
        '<div class="sx-reg cr-modsbox" data-reg="d_modules"><button type="button" class="sx-hot" data-feat="d_modules" aria-label="Explain: module list" aria-pressed="false">i</button><h3 class="cr-h3">Your modules</h3><ul class="cr-mods">' + mods + '</ul></div></div>' +
        '<div class="cr-dside"><div class="sx-reg cr-progbox" data-reg="d_progress"><button type="button" class="sx-hot" data-feat="d_progress" aria-label="Explain: progress" aria-pressed="false">i</button><h3 class="cr-h3">Overall progress</h3><div class="cr-pct">' + pct + '%</div><div class="sxs-prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div><div class="sxs-fine" style="margin-top:6px">' + t + ' of ' + n + ' lessons complete</div></div>' +
        '<div class="sxs-box"><h3 class="cr-h3">Next steps</h3><ul class="cr-steps"><li>' + (finished ? 'Review any lesson from the module list' : 'Finish Module ' + (nx.mod + 1) + ': ' + esc(C.modules[nx.mod].t)) + '</li><li>Download the printable feeding schedule</li><li>Bake your first loaf in Module 4</li></ul></div>' +
        '<p class="sxs-fine">Progress resets when you leave this example.</p></div></div>';
    }
    function rerender() { renderLesson(); renderDash(); }
    function open(id) { cur = id; renderLesson(); api.goto('lesson'); api.track('lesson_open'); }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lesson],[data-mark],[data-reset]'); if (!b) return;
      if (b.dataset.lesson) { var wasDash = !!b.closest('#cr-dash'); open(b.dataset.lesson); if (wasDash && api.root.querySelector('.cr-lesson-grid')) { /* view switched */ } }
      else if (b.hasAttribute('data-mark')) {
        if (done[cur]) delete done[cur]; else { done[cur] = 1; api.track('lesson_complete'); }
        rerender(); var again = $('[data-mark]', root); if (again) again.focus();
      } else if (b.hasAttribute('data-reset')) { done = {}; base.forEach(function (k) { done[k] = 1; }); cur = C.start; rerender(); }
    });
    /* Sales-page preview + enrollment preview events */
    api.onEvent(function (kind, v) {
      if (kind === 'view' && v === 'dashboard') { renderDash(); api.track('dashboard_visit'); }
      if (kind === 'view' && v === 'lesson') renderLesson();
      if (kind === 'switch') {
        if (v === 'sale:enroll') { api.feat('e_steps'); api.sw('step:1'); }
        if (v.indexOf('step:') === 0) { var n = +v.split(':')[1]; $$('[data-stepdot]', root).forEach(function (d) { var k = +d.dataset.stepdot; d.classList.toggle('on', k <= n); d.setAttribute('aria-current', k === n ? 'step' : 'false'); }); }
        if (v === 'step:4') { api.track('enroll_confirm'); }
        if (v === 'sale:page') { api.feat('s_overview'); }
      }
    });
    rerender();
  };


  /* ---------- Law: language toggle ---------- */
  custom.law = function (api) {
    var root = api.root, site = $$('.lw-site', root);
    $$('[data-lang-set]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.dataset.langSet;
        $$('.sxs-law', root).forEach(function (s) { s.classList.add('lw-site'); s.setAttribute('data-lang', l); });
        $$('[data-lang-set]', root).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.langSet === l ? 'true' : 'false'); });
        if (l === 'es') api.track('lang_es');
        api.feat('p_lang', true);
      });
    });
    $$('.sxs-law', root).forEach(function (s) { s.classList.add('lw-site'); s.setAttribute('data-lang', 'en'); });
  };

  /* ---------- E-commerce: filters, product, cart ---------- */
  custom.ecom = function (api) {
    var root = api.root, S = api.data.shop, esc = api.esc, cart = [{ id: S0(api).coffees[0].id, n: S0(api).coffees[0].n, s: '12', g: 'Whole bean', p: S0(api).coffees[0].p12, q: 1 }, { id: S0(api).coffees[1].id, n: S0(api).coffees[1].n, s: '12', g: 'Whole bean', p: S0(api).coffees[1].p12, q: 1 }], cur = S.coffees[0], size = '12', grind = 'Whole bean', placed = false;
    function S0(a) { return a.data.shop; }
    var money = function (n) { return '$' + n; };
    var bag = function (c) { return S.bag.split('COLOR_X').join(c).replace(/id="bg[^"]*"/, 'id="bgp"').replace(/url\(#bg[^)]*\)/, 'url(#bgp)').replace('width="100%"', 'width="auto"').replace('stop-color="' + c + '" stop-opacity', 'stop-color="' + c + '" stop-opacity'); };
    var flt = { roast: 'all', brew: 'all' };
    function applyFilters() {
      var n = 0;
      $$('.ec-prod', root).forEach(function (p) {
        var ok = (flt.roast === 'all' || p.dataset.roast === flt.roast) && (flt.brew === 'all' || p.dataset.brew === flt.brew || p.dataset.brew === 'both');
        p.hidden = !ok; if (ok) n++;
      });
      $('#ecCount', root).textContent = n + (n === 1 ? ' coffee' : ' coffees'); $('.ec-none', root).hidden = n > 0;
    }
    $$('[data-fgroup]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        flt[b.dataset.fgroup] = b.dataset.f;
        $$('[data-fgroup="' + b.dataset.fgroup + '"]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        applyFilters(); api.track('filter_use');
      });
    });
    var price = function () { return size === '12' ? cur.p12 : cur.p2; };
    function renderProduct() {
      $('#ec-product', root).innerHTML = '<div class="ec-pdp"><div class="ec-pimg">' + cur.img + '</div><div class="sx-reg" data-reg="p_info" style="padding:2px"><button type="button" class="sx-hot" data-feat="p_info" aria-label="Explain: product details" aria-pressed="false">i</button>' +
        '<span class="ec-origin">' + esc(cur.o) + ' \u00b7 ' + cur.r + ' roast</span><h1 class="ec-h1" style="font-size:clamp(26px,4.4cqi,38px)!important">' + esc(cur.n) + '</h1><p class="ec-lead">Tasting notes: ' + esc(cur.notes) + '.</p><p class="ec-tip"><b>How to brew it.</b> ' + esc(cur.tip) + '</p>' +
        '<div class="ec-price" aria-live="polite">' + money(price()) + '</div>' +
        '<div class="sx-reg" data-reg="p_options" style="padding:2px"><button type="button" class="sx-hot" data-feat="p_options" aria-label="Explain: sizes and options" aria-pressed="false" style="top:-4px">i</button><div class="ec-opts" role="group" aria-label="Size"><button type="button" class="ec-opt" data-size="12" aria-pressed="' + (size === '12') + '">12 oz<small>' + money(cur.p12) + '</small></button><button type="button" class="ec-opt" data-size="2" aria-pressed="' + (size === '2') + '">2 lb<small>' + money(cur.p2) + '</small></button></div>' +
        '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="ecGrind">Grind</label><select id="ecGrind" class="ec-sel"><option' + (grind === 'Whole bean' ? ' selected' : '') + '>Whole bean</option><option' + (grind === 'Espresso' ? ' selected' : '') + '>Espresso</option><option' + (grind === 'Filter' ? ' selected' : '') + '>Filter</option></select></div>' +
        '<div><button type="button" class="sxs-btn" data-add="1">Add to cart</button> <span class="sxs-fine" role="status" aria-live="polite" id="ecAdded">' + (placed ? 'Added to your cart.' : '') + '</span></div>' +
        '<div class="ec-info2"><div><b>Delivery</b><span>Ships in 1 to 2 business days; delivery in 3 to 5.</span></div><div><b>Free shipping</b><span>On orders over $' + S.threshold + '.</span></div><div><b>Returns</b><span>If something is wrong with your order, tell us within 14 days and we will make it right.</span></div></div></div></div>';
    }
    function cartCount() { var n = cart.reduce(function (a, l) { return a + l.q; }, 0); $$('.ec-cartn', root).forEach(function (el) { el.textContent = n; }); }
    cartCount();
    function sub() { return cart.reduce(function (a, l) { return a + l.p * l.q; }, 0); }
    function renderCart() {
      var el = $('#ec-cart', root), s = sub();
      if (!cart.length) { el.innerHTML = '<div class="ec-empty sxs-box"><h2 class="lw-h2">Your cart is empty</h2><p>Add a coffee from the shop to see how the cart works.</p><button type="button" class="sxs-btn" data-goto="collection" style="margin-top:12px">Browse coffees</button></div>'; return; }
      var left = Math.max(0, S.threshold - s), pct = Math.min(100, Math.round(s / S.threshold * 100));
      el.innerHTML = '<div class="sxs-row2 top"><div class="sxs-box sx-reg" data-reg="k_path"><button type="button" class="sx-hot" data-feat="k_path" aria-label="Explain: cart" aria-pressed="false">i</button><h2 class="lw-h2" style="font-size:22px!important">Your cart</h2>' +
        cart.map(function (l, i) { return '<div class="ec-line"><div><b>' + esc(l.n) + '</b><small>' + (l.s === '12' ? '12 oz' : '2 lb') + ' \u00b7 ' + esc(l.g) + ' \u00b7 ' + money(l.p) + ' each</small></div><div class="ec-qty"><button type="button" data-q="' + i + ':-1" aria-label="Decrease quantity">\u2212</button><span>' + l.q + '</span><button type="button" data-q="' + i + ':1" aria-label="Increase quantity">+</button></div></div>'; }).join('') + '</div>' +
        '<div class="sxs-box"><div class="sx-reg ec-ship" data-reg="k_notes" style="padding:2px"><button type="button" class="sx-hot" data-feat="k_notes" aria-label="Explain: free shipping bar" aria-pressed="false" style="top:-6px">i</button><div class="sxs-fine" style="margin-bottom:6px">' + (left ? 'You are ' + money(left) + ' away from free shipping.' : 'Free shipping unlocked.') + '</div><div class="sxs-prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div></div>' +
        '<div class="ec-sub"><span>Subtotal</span><span>' + money(s) + '</span></div><div class="sxs-fine" style="margin-bottom:12px">Estimated delivery: 3 to 5 business days. Tax and shipping are shown before payment.</div>' +
        '<div data-pane="co:cart"><button type="button" class="sxs-btn" style="width:100%" data-checkout="1">Checkout</button></div><div data-pane="co:done" hidden><p><b>Example order placed.</b> No payment is taken.</p></div></div></div>';
    }
    function showProduct(i) { cur = S.coffees.filter(function (c) { return c.id === i; })[0]; size = '12'; grind = 'Whole bean'; placed = false; renderProduct(); api.goto('product'); }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open],[data-size],[data-add],[data-q],[data-checkout]'); if (!b) return;
      if (b.dataset.open) showProduct(b.dataset.open);
      else if (b.dataset.size) { size = b.dataset.size; renderProduct(); }
      else if (b.hasAttribute('data-add')) {
        grind = $('#ecGrind', root).value; var hit = cart.filter(function (l) { return l.id === cur.id && l.s === size && l.g === grind; })[0];
        if (hit) hit.q++; else cart.push({ id: cur.id, n: cur.n, s: size, g: grind, p: price(), q: 1 });
        placed = true; renderProduct(); cartCount(); renderCart(); api.track('add_to_cart');
        var a = $('[data-add]', root); if (a) a.focus();
      } else if (b.dataset.q) { var p = b.dataset.q.split(':'); cart[+p[0]].q += +p[1]; if (cart[+p[0]].q <= 0) cart.splice(+p[0], 1); cartCount(); renderCart(); }
      else if (b.hasAttribute('data-checkout')) { $$('[data-pane^="co:"]', root).forEach(function (el) { el.hidden = el.dataset.pane !== 'co:done'; }); api.track('checkout_start'); }
    });
    $$('.sxs-ecom .ec-cartlink', root).forEach(function (el) { el.style.cursor = 'pointer'; el.setAttribute('role', 'button'); el.tabIndex = 0; el.addEventListener('click', function () { renderCart(); api.goto('cart'); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderCart(); api.goto('cart'); } }); });
    api.onEvent(function (k, v) { if (k === 'view' && v === 'cart') renderCart(); if (k === 'view' && v === 'product') renderProduct(); });
    renderProduct(); renderCart(); applyFilters();
  };

  function start() { $$('.sx[data-sx]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* Optional real photos: list a file in assets/concepts/manifest.json (slot name -> file name) and it replaces the concept image in that slot. */
(function () {
  var slots = document.querySelectorAll('.sx-ph[data-slot]'); if (!slots.length || !window.fetch) return;
  fetch('assets/concepts/manifest.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (m) {
    slots.forEach(function (el) { var f = m && m[el.getAttribute('data-slot')]; var img = el.querySelector('.sx-ph-img'); if (f && img) img.style.backgroundImage = 'url(assets/concepts/' + f + ')'; });
  }).catch(function () {});
})();
