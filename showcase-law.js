/* Calder & Vance Law example: English/Spanish toggle and the consultation request flow. Nothing is sent. */
(function () {
  'use strict';
  var K = window.SXKit, $ = K.$, $$ = K.$$;
  window.SXCustom = window.SXCustom || {};
  window.SXCustom.law = function (api) {
    var root = api.root, site = $('.sx-site', root);
    function setLang(l) {
      site.setAttribute('data-lang', l); site.setAttribute('lang', l);
      $$('.cv-lang button', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === l ? 'true' : 'false'); });
    }
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('.cv-lang button'); if (b) { setLang(b.dataset.lang); api.track('lang_toggle'); return; }
      var l = ev.target.closest('.cv-mob [data-goto]'); if (l) { var bg = $('.cv-burger[aria-expanded="true"]', root); if (bg) bg.click(); }
      var p = ev.target.closest('[data-presel]'); if (p) { var v = p.getAttribute('data-presel'); $$('input[name="lm"]', root).forEach(function (r) { r.checked = !!v && r.value === v; }); if (v && w) w.set(1); }
    });
    var form = $('#cv-f', root); if (!form) return;
    var lab = function (n) { var r = K.checked(form, n); return r ? r.dataset.label : ''; };
    var w = K.wizard({ root: root, api: api, form: form, last: 3, ev: { start: 'consult_start', step: 'consult_step', submit: 'consult_submit' },
      labels: { next: site.getAttribute('data-lang') === 'es' ? 'Continuar' : 'Continue', send: 'Send request' },
      validate: function (s) {
        var es = site.getAttribute('data-lang') === 'es';
        if (s === 1 && !lab('lm')) return [es ? 'Elija un tema para continuar.' : 'Choose a topic to continue.', $$('input[name="lm"]', form)[0]];
        if (s === 2) {
          var n = $('#cv-name', form); if (n.value.trim().length < 2) return [es ? 'Escriba su nombre.' : 'Enter your name so we know who to ask for.', n];
          var c = $('#cv-contact', form); if (!K.emailOrPhone(c.value)) return [es ? 'Escriba un teléfono de 10 dígitos o un correo.' : 'Enter a phone number (10 digits) or an email address.', c];
        }
        if (s === 3 && !$('#cv-ok', form).checked) return [es ? 'Marque la casilla para continuar.' : 'Tick the box to confirm you understand.', $('#cv-ok', form)];
        return null;
      },
      enter: function (s) { if (s === 3) $('#cv-rev', form).innerHTML = [['Topic', lab('lm')], ['Name', $('#cv-name', form).value.trim()], ['Reach you by', lab('lc') + ': ' + $('#cv-contact', form).value.trim()], ['Language', lab('ll')], ['Best time', lab('lt')]].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + api.esc(r[1]) + '</dd></div>'; }).join(''); },
      submit: function () { $('#cv-ref', form).textContent = 'CV-' + (3100 + Math.floor(Math.random() * 800)); $('#cv-donep', form).textContent = 'We will reach you by ' + lab('lc').toLowerCase() + ' within one business day, in ' + lab('ll') + '. This is a simulation, so nothing was sent.'; },
      reset: function () { $('#cv-ok', form).checked = false; }
    });
    setLang('en');
  };
})();
