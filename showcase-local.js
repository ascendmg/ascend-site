/* Cedarline Landscaping example: zone highlight, project filter and before/after, quote flow. Everything is local; nothing is sent. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.SXCustom = window.SXCustom || {};
  window.SXCustom.local = function (api) {
    var root = api.root, site = $('.sx-site', root), stage = $('.sx-stage', root);

    function scrollTo(el) {
      if (!el) return;
      var full = stage.classList.contains('sx-full'), box = full ? stage : site;
      var top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - (full ? 0 : 70);
      box.scrollTop = Math.max(0, top);
    }

    /* property plan: highlight the chosen zone */
    var zmap = { lawn: 1, beds: 1, trim: 1, clean: 1 };
    function setZone(z) { $$('[data-zonewrap]', root).forEach(function (w) { w.setAttribute('data-zone', z); }); }
    setZone('lawn');
    /* project filter + open project */
    function filter(k) { $$('.cl-pc', root).forEach(function (li) { li.hidden = !(k === 'all' || li.dataset.svc === k); }); }
    api.onEvent(function (t, v) {
      if (t !== 'switch') return;
      var p = v.split(':');
      if (p[0] === 'zone' && zmap[p[1]]) setZone(p[1]);
      if (p[0] === 'pf') filter(p[1]);
      if (p[0] === 'proj') { var host = $('.sx-view:not([hidden]) .cl-page', root); scrollTo(host); }
    });

    /* before/after: range input and drag */
    function setPos(ba, pct) { pct = Math.max(0, Math.min(100, pct)); ba.style.setProperty('--pos', pct + '%'); var r = ba.closest('.sx-reg'); var inp = r && $('input[data-bar]', r); if (inp) inp.value = Math.round(pct); }
    root.addEventListener('input', function (ev) {
      var i = ev.target.closest && ev.target.closest('input[data-bar]'); if (!i) return;
      var ba = $('[data-ba]', i.closest('.sx-reg')); ba.style.setProperty('--pos', i.value + '%');
    });
    root.addEventListener('pointerdown', function (ev) {
      var ba = ev.target.closest && ev.target.closest('[data-ba]'); if (!ba) return;
      var move = function (e) { var r = ba.getBoundingClientRect(); setPos(ba, (e.clientX - r.left) / r.width * 100); };
      move(ev); ba.setPointerCapture && ba.setPointerCapture(ev.pointerId);
      var up = function () { ba.removeEventListener('pointermove', move); ba.removeEventListener('pointerup', up); ba.removeEventListener('pointercancel', up); };
      ba.addEventListener('pointermove', move); ba.addEventListener('pointerup', up); ba.addEventListener('pointercancel', up);
    });

    /* navigation helpers: pre-select a service/town in the quote form, open a project */
    var form = $('#cl-q', root);
    var named = function (n) { return $$('input[name="' + n + '"]', root); };
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-presel],[data-preltown],[data-openproj]'); if (!b) return;
      if (b.hasAttribute('data-presel')) { var v = b.getAttribute('data-presel'); named('qs').forEach(function (r) { r.checked = (v && r.value === v); }); if (v) { setStep(1); } }
      if (b.dataset.preltown) named('qt').forEach(function (r) { r.checked = r.value === b.dataset.preltown; });
      if (b.dataset.openproj) { api.sw('proj:' + b.dataset.openproj); }
    });
    root.addEventListener('click', function (ev) {
      var m = ev.target.closest('.cl-burger'); /* menu closes after a link is chosen */
      var l = ev.target.closest('.cl-mob [data-goto]'); if (l) { var burger = $('.cl-burger[aria-expanded="true"]', root); if (burger) burger.click(); }
    });

    /* ---------------- quote flow ---------------- */
    if (!form) return;
    var step = 1, started = false, err = $('#cl-qerr', root), next = $('#cl-next', root), prev = $('#cl-prev', root), done = $('#cl-done', root), nav = $('#cl-nav', root);
    var sq = $('#cl-sq', root), sqo = $('#cl-sqo', root);
    var fmt = function (n) { return Number(n).toLocaleString('en-US') + ' sq ft'; };
    sq.addEventListener('input', function () { sqo.textContent = fmt(sq.value); });
    form.addEventListener('input', function (e) { if (!started) { started = true; api.track('quote_start'); } if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); } err.hidden = true; });
    form.addEventListener('change', function () { if (!started) { started = true; api.track('quote_start'); } err.hidden = true; });
    var label = function (n) { var r = named(n).filter(function (x) { return x.checked; })[0]; return r ? r.dataset.label : ''; };
    function setStep(n) {
      step = n;
      $$('.cl-qs', form).forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
      $$('.cl-qsteps li', form).forEach(function (li) { var k = Number(li.dataset.s); li.classList.toggle('done', k < n); if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      prev.hidden = n === 1; next.textContent = n === 4 ? 'Send request' : 'Continue'; next.removeAttribute('data-track'); if (n < 4) next.setAttribute('data-track', 'quote_step');
      err.hidden = true; done.hidden = true; nav.hidden = false;
      if (n === 4) {
        $('#cl-review', root).innerHTML = [['Service', label('qs')], ['Town', label('qt')], ['Address', $('#cl-addr', root).value.trim()], ['Area', fmt(sq.value)], ['Notes', $('#cl-note', root).value.trim() || 'None'], ['Name', $('#cl-name', root).value.trim()], ['Reply by', label('qc') + ': ' + $('#cl-contact', root).value.trim()]]
          .map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + api.esc(r[1]) + '</dd></div>'; }).join('');
      }
    }
    function fail(msg, el) { err.textContent = msg; err.hidden = false; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } }
    function validate() {
      if (step === 1 && !label('qs')) { fail('Choose a service to continue.', named('qs')[0]); return false; }
      if (step === 2) {
        if (!label('qt')) { fail('Choose your town. If you are not sure, pick Another town.', named('qt')[0]); return false; }
        var a = $('#cl-addr', root); if (a.value.trim().length < 5) { fail('Enter the property address, for example 214 Elm Street.', a); return false; }
      }
      if (step === 3) {
        var n = $('#cl-name', root); if (n.value.trim().length < 2) { fail('Enter your name so we know who to reply to.', n); return false; }
        var c = $('#cl-contact', root), v = c.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.replace(/\D/g, '').length >= 10;
        if (!ok) { fail('Enter a phone number (10 digits) or an email address we can reply to.', c); return false; }
      }
      return true;
    }
    next.addEventListener('click', function () {
      if (!validate()) return;
      if (step < 4) { setStep(step + 1); var f = $('.cl-qs:not([hidden]) legend, .cl-qs:not([hidden]) h2', form); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } return; }
      api.track('quote_submit');
      $$('.cl-qs', form).forEach(function (s) { s.hidden = true; }); nav.hidden = true;
      $('#cl-ref', root).textContent = 'CL-' + (2400 + Math.floor(Math.random() * 500));
      $('#cl-done-p', root).textContent = label('qs') + ' in ' + label('qt') + '. We will reply by ' + label('qc').toLowerCase() + ' within one business day. This is a simulation, so nothing was sent.';
      done.hidden = false; $$('.cl-qsteps li', form).forEach(function (li) { li.classList.add('done'); li.removeAttribute('aria-current'); }); done.focus();
    });
    prev.addEventListener('click', function () { setStep(step - 1); });
    $('#cl-again', root).addEventListener('click', function () { form.reset(); sqo.textContent = fmt(2500); started = false; setStep(1); });
    setStep(1);
  };
})();
