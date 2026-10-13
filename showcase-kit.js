/* Shared behaviors for the coded example sites: step-by-step forms. Nothing is sent anywhere. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.SXKit = {
    $: $, $$: $$,
    /* o: {root, api, form, last, ev:{start,step,submit}, validate(step)->[msg, el]|null, enter(step), submit(), labels:{next,send}} */
    wizard: function (o) {
      var f = o.form, step = 1, started = false;
      var err = $('.wz-err', f), next = $('.wz-next', f), prev = $('.wz-prev', f), done = $('.wz-done', f), nav = $('.wz-nav', f);
      function start() { if (!started) { started = true; o.api.track(o.ev.start); } }
      f.addEventListener('input', function (e) { start(); if (e.target.getAttribute && e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); err.hidden = true; });
      f.addEventListener('change', function () { start(); err.hidden = true; });
      function set(n) {
        step = n;
        $$('.wz-s', f).forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
        $$('.wz-steps li', f).forEach(function (li) { var k = Number(li.dataset.s); li.classList.toggle('done', k < n); if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
        prev.hidden = n === 1; next.textContent = n === o.last ? (o.labels && o.labels.send || 'Send') : (o.labels && o.labels.next || 'Continue');
        err.hidden = true; done.hidden = true; nav.hidden = false;
        if (o.enter) o.enter(n);
      }
      function fail(r) { err.textContent = r[0]; err.hidden = false; if (r[1]) { r[1].setAttribute('aria-invalid', 'true'); r[1].focus(); } }
      next.addEventListener('click', function () {
        var r = o.validate ? o.validate(step) : null; if (r) { fail(r); return; }
        if (step < o.last) { o.api.track(o.ev.step); set(step + 1); var h = $('.wz-s:not([hidden]) legend, .wz-s:not([hidden]) h3', f); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } return; }
        o.api.track(o.ev.submit);
        $$('.wz-s', f).forEach(function (s) { s.hidden = true; }); nav.hidden = true;
        $$('.wz-steps li', f).forEach(function (li) { li.classList.add('done'); li.removeAttribute('aria-current'); });
        if (o.submit) o.submit(); done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true });
      });
      prev.addEventListener('click', function () { set(step - 1); });
      var again = $('.wz-again', f); if (again) again.addEventListener('click', function () { f.reset(); started = false; if (o.reset) o.reset(); set(1); });
      set(1);
      return { set: set, get step() { return step; }, start: start };
    },
    emailOrPhone: function (v) { v = v.trim(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.replace(/\D/g, '').length >= 10; },
    checked: function (root, name) { return $$('input[name="' + name + '"]', root).filter(function (x) { return x.checked; })[0]; },
    scrollTop: function (root, api) { var st = $('.sx-stage', root), site = $('.sx-site', root); var box = st.classList.contains('sx-full') ? st : site; box.scrollTop = 0; }
  };
})();
