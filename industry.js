/* Industry solution pages: progressive enhancement. Every demo renders a complete default state in HTML. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Accessible tablist: click + arrow keys / Home / End */
  function tabs(list, onSelect) {
    var btns = $$('[role="tab"]', list);
    function select(b, focus) {
      btns.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) b.focus(); if (onSelect) onSelect(b);
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
    return select;
  }

  function toast(root, msg) { var t = $('.ind-toast', root); if (t) t.textContent = msg; }

  /* Law: practice area tabs + EN/ES toggle */
  var law = $('#lawDemo');
  if (law) {
    tabs($('.ind-tabs', law));
    $$('.ind-lang button', law).forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.dataset.l; law.setAttribute('data-lang', l);
        $$('.ind-lang button', law).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        law.setAttribute('lang', l);
      });
    });
    $$('[data-demo-msg]', law).forEach(function (b) { b.addEventListener('click', function () { toast(law, law.getAttribute('data-lang') === 'es' ? b.dataset.es : b.dataset.en); }); });
  }

  /* Course: journey + lessons + progress */
  var course = $('#courseDemo');
  if (course) {
    var go = tabs($('.ind-journey', course));
    var lessons = $$('.ind-lessons button', course), done = {}, total = lessons.length;
    function upd() {
      var n = Object.keys(done).length;
      $('.ind-prog i', course).style.width = Math.round(n / total * 100) + '%';
      $('.ind-progtxt', course).textContent = n + ' of ' + total + ' lessons complete';
      lessons.forEach(function (b, i) { b.classList.toggle('done', !!done[i]); $('.ck', b).textContent = done[i] ? '✓' : ''; });
      $$('[data-complete]', course).forEach(function (b) { var i = +b.dataset.complete; b.textContent = done[i] ? 'Completed ✓ (tap to undo)' : 'Mark complete'; b.classList.toggle('alt', !!done[i]); });
    }
    lessons.forEach(function (b, i) {
      b.addEventListener('click', function () {
        lessons.forEach(function (x, j) { x.setAttribute('aria-selected', j === i ? 'true' : 'false'); var p = document.getElementById('lesson' + j); if (p) p.hidden = j !== i; });
      });
    });
    $$('[data-complete]', course).forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.complete; if (done[i]) delete done[i]; else done[i] = 1; upd(); }); });
    $$('[data-go]', course).forEach(function (b) { b.addEventListener('click', function () { var t = $('#cj' + b.dataset.go, course); if (t) { t.click(); } }); });
    upd();
  }

  /* E-commerce: collection filter, variants, add to cart */
  var shop = $('#shopDemo');
  if (shop) {
    var cart = [], money = function (n) { return '$' + n.toFixed(2).replace(/\.00$/, ''); };
    $$('.ind-filters button', shop).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.ind-filters button', shop).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var f = b.dataset.f, shown = 0;
        $$('.ind-prod', shop).forEach(function (p) { var ok = f === 'all' || p.dataset.c === f; p.hidden = !ok; if (ok) shown++; });
        $('#shopCount', shop).textContent = shown + (shown === 1 ? ' product' : ' products');
      });
    });
    $$('.ind-prod', shop).forEach(function (p) {
      $$('input[type=radio]', p).forEach(function (r) { r.addEventListener('change', function () { $('.ind-art', p).style.setProperty('--c', r.value); }); });
      $('.ind-add', p).addEventListener('click', function () {
        var r = $('input[type=radio]:checked', p), s = $('select', p);
        cart.push({ n: p.dataset.n, v: r ? r.dataset.name : '', s: s ? s.value : '', p: +p.dataset.p });
        render(); toast(shop, 'Added ' + p.dataset.n + ' to the sample cart.');
      });
    });
    function render() {
      $('#cartN', shop).textContent = cart.length;
      var box = $('#cartList', shop); box.hidden = !cart.length;
      var ul = $('ul', box); ul.innerHTML = '';
      var tot = 0; cart.forEach(function (c) {
        tot += c.p; var li = document.createElement('li');
        var a = document.createElement('span'); a.textContent = c.n + ' · ' + [c.v, c.s].filter(Boolean).join(' / ');
        var b = document.createElement('span'); b.textContent = money(c.p); li.appendChild(a); li.appendChild(b); ul.appendChild(li);
      });
      $('#cartTot', shop).textContent = money(tot);
    }
    $('#cartClear', shop).addEventListener('click', function () { cart = []; render(); toast(shop, 'Sample cart cleared.'); });
    $('#cartGo', shop).addEventListener('click', function () { toast(shop, 'Demonstration only: checkout is not connected and nothing is purchased.'); });
  }

  /* Local: service + location -> CTA */
  var loc = $('#localDemo');
  if (loc) {
    var data = JSON.parse($('#localData', loc).textContent);
    var sv = $('#svcSel', loc), lc = $('#locSel', loc);
    function show() {
      var s = data.services[sv.value], l = lc.value, other = l === 'other';
      $('#outMode', loc).textContent = other ? 'Check coverage' : s.mode === 'quote' ? 'Quote request' : 'Booking';
      $('#outTitle', loc).textContent = other ? 'Not sure we cover your area?' : s.title.replace('{loc}', lc.options[lc.selectedIndex].text);
      $('#outText', loc).textContent = other ? 'Send your address or ZIP code and we will confirm whether we work there.' : s.text;
      $('#outPrimary', loc).textContent = other ? 'Ask about your area' : s.cta;
      toast(loc, '');
    }
    sv.addEventListener('change', show); lc.addEventListener('change', show);
    $$('[data-demo-msg]', loc).forEach(function (b) { b.addEventListener('click', function () { toast(loc, 'Demonstration only: nothing is sent.'); }); });
    show();
  }
})();
