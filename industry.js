/* Industry solution pages: illustrative performance views. The default state is rendered in HTML; this only switches views and selected areas. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Pick an area: toggle-button group, one pressed at a time (Tab / Enter / Space work natively). */
  $$('.ix-view').forEach(function (view) {
    var picks = $$('.ix-pick', view);
    picks.forEach(function (b) {
      b.addEventListener('click', function () {
        picks.forEach(function (x) {
          var on = x === b;
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
          var d = document.getElementById(x.getAttribute('aria-controls')); if (d) d.hidden = !on;
        });
        /* On phones the detail sits below the list: bring it into view. */
        if (window.matchMedia('(max-width:820px)').matches) {
          var t = document.getElementById(b.getAttribute('aria-controls')), rm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
          if (t) t.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  });

  /* Optional view switcher (e.g. Enrollment / Student activation): tablist with arrow keys. */
  $$('.ix-views').forEach(function (list) {
    var btns = $$('[role="tab"]', list);
    function select(b, focus) {
      btns.forEach(function (x) {
        var on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) b.focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = btns[(i + 1) % btns.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = btns[(i - 1 + btns.length) % btns.length];
        else if (e.key === 'Home') n = btns[0]; else if (e.key === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });
})();
