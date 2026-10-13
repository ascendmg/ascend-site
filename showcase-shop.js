/* Tidewater Coffee store example: filters, options and live price, cart and checkout. Nothing is sent. */
(function () {
  'use strict';
  var K = window.SXKit, $ = K.$, $$ = K.$$;
  window.SXCustom = window.SXCustom || {};
  window.SXCustom.shop = function (api) {
    var root = api.root, FREE = 40, cart = [], prod = JSON.parse($('#td-prod', root).textContent);
    var money = function (v) { return '$' + (Math.round(v * 100) % 100 ? v.toFixed(2) : String(Math.round(v))); };
    var price = function (l) { var p = prod[l.id]; var b = p.p12 != null ? (l.size === '32' ? p.p32 : p.p12) : p.price; return l.sub ? Math.round(b * 90) / 100 : b; };
    var sub = function () { return cart.reduce(function (s, l) { return s + price(l) * l.qty; }, 0); };
    var count = function () { return cart.reduce(function (s, l) { return s + l.qty; }, 0); };
    var shipCost = function () { var m = $('input[name="tm"]:checked', root); var express = m && m.value === 'exp'; return express ? 12 : (sub() >= FREE || !cart.length ? 0 : 5.95); };
    var bagSvg = function (id) { var p = prod[id], v = $('.sx-view[data-view="' + p.view + '"] .td-fig svg', root); return v ? v.outerHTML : ''; };
    function pdpState(box) {
      var id = box.dataset.pid, p = prod[id], size = ($('input[name="sz-' + id + '"]:checked', box) || {}).value || '12', buy = ($('input[name="bu-' + id + '"]:checked', box) || {}).value || 'once';
      var b = p.p12 != null ? (size === '32' ? p.p32 : p.p12) : p.price, sb = buy === 'sub';
      return { id: id, size: size, grind: ($('select[name="gr-' + id + '"]', box) || {}).value || '', sub: sb, base: b, qty: Math.max(1, Math.min(9, parseInt($('[data-qty]', box).value, 10) || 1)) };
    }
    function add(l, note) {
      var f = cart.filter(function (c) { return c.id === l.id && c.size === l.size && c.grind === l.grind && c.sub === l.sub; })[0];
      if (f) f.qty = Math.min(9, f.qty + l.qty); else cart.push(l);
      render(); api.track('add_to_cart');
      if (note) { note.hidden = false; note.innerHTML = 'Added to your cart. <button type="button" data-goto="cart">View cart</button>'; }
    }
    function render() {
      $$('[data-cartcount]', root).forEach(function (b) { b.textContent = count(); });
      var s = sub(), left = Math.max(0, FREE - s);
      $$('[data-shiptext]', root).forEach(function (t) { t.textContent = !cart.length ? 'Free shipping on orders over ' + money(FREE) + '.' : left > 0 ? 'You are ' + money(left) + ' away from free shipping.' : 'You have free shipping.'; });
      $$('[data-shipfill]', root).forEach(function (t) { t.style.width = Math.min(100, s / FREE * 100) + '%'; });
      var ul = $('[data-lines]', root);
      ul.innerHTML = cart.map(function (l, i) {
        var p = prod[l.id], opt = p.p12 != null ? (l.size === '32' ? '2 lb' : '12 oz') + ' · ' + l.grind + (l.sub ? ' · Subscribe and save' : '') : '';
        return '<li class="td-line"><div class="td-lf">' + bagSvg(l.id) + '</div><div><h3>' + api.esc(p.name) + '</h3><small>' + api.esc(opt) + '</small><button type="button" class="td-rm" data-rm="' + i + '">Remove</button></div><div class="td-lr"><b>' + money(price(l) * l.qty) + '</b><span class="td-step"><button type="button" data-dec="' + i + '" aria-label="Fewer ' + api.esc(p.name) + '">−</button><span aria-live="polite">' + l.qty + '</span><button type="button" data-inc="' + i + '" aria-label="More ' + api.esc(p.name) + '">+</button></span></div></li>';
      }).join('');
      $$('[data-cartempty]', root).forEach(function (e) { e.hidden = cart.length > 0; });
      $$('[data-lines],[data-shipbar]', root).forEach(function (e) { e.hidden = !cart.length; });
      $$('[data-checkout]', root).forEach(function (b) { b.disabled = !cart.length; b.style.opacity = cart.length ? '' : '.5'; });
      var sc = shipCost();
      $$('[data-sub]', root).forEach(function (e) { e.textContent = money(s); });
      $$('[data-shipping]', root).forEach(function (e) { e.textContent = !cart.length ? '$0' : sc ? money(sc) : 'Free'; });
      $$('[data-total]', root).forEach(function (e) { e.textContent = money(s + sc); });
      var ck = $('[data-ckitems]', root); if (ck) { ck.innerHTML = cart.map(function (l) { return '<li><span>' + l.qty + ' × ' + api.esc(prod[l.id].name) + '</span><b>' + money(price(l) * l.qty) + '</b></li>'; }).join(''); $$('[data-ckempty]', root).forEach(function (e) { e.hidden = cart.length > 0; }); }
    }
    /* collection filters */
    var F = { fr: 'all', fm: 'all' };
    function applyFilters() {
      $$('.sx-view[data-view="coffee"] .td-pc', root).forEach(function () {});
      var view = $('.sx-view[data-view="coffee"]', root); if (!view) return;
      var cards = $$('.td-pc', view), n = 0, grid = $('[data-grid]', view);
      cards.forEach(function (c) { var ok = (F.fr === 'all' || c.dataset.roast === F.fr) && (F.fm === 'all' || c.dataset.methods.split(' ').indexOf(F.fm) > -1); c.hidden = !ok; if (ok) n++; });
      var sort = $('[data-sort]', view).value;
      var key = { feat: function (c) { return Number(c.dataset.feat) || 99; }, low: function (c) { return Number(c.dataset.price); }, high: function (c) { return -Number(c.dataset.price); }, az: function (c) { return c.dataset.name; } }[sort];
      cards.sort(function (a, b) { var x = key(a), y = key(b); return x < y ? -1 : x > y ? 1 : 0; }).forEach(function (c) { grid.appendChild(c); });
      $('[data-count]', view).textContent = 'Showing ' + n + ' of ' + cards.length + ' coffees';
      $('[data-empty]', view).hidden = n > 0;
    }
    function setChip(g, v) { $$('.td-chip', root).forEach(function (b) { if (b.dataset.switch && b.dataset.switch.indexOf(g + ':') === 0) b.setAttribute('aria-pressed', b.dataset.switch === g + ':' + v ? 'true' : 'false'); }); }
    api.onEvent(function (t, v) { if (t !== 'switch') return; var p = v.split(':'); if (p[0] === 'fr' || p[0] === 'fm') { F[p[0]] = p[1]; applyFilters(); } });
    root.addEventListener('change', function (ev) {
      if (ev.target.closest('[data-sort]')) { applyFilters(); return; }
      var box = ev.target.closest('.td-pdp'); if (box) updatePrice(box);
    });
    root.addEventListener('input', function (ev) { var box = ev.target.closest && ev.target.closest('.td-pdp'); if (box) updatePrice(box); });
    function updatePrice(box) { var s = pdpState(box), v = s.sub ? Math.round(s.base * 90) / 100 : s.base; $('[data-price]', box).textContent = money(v); var sv = $('[data-save]', box); if (sv) sv.hidden = !s.sub; }
    root.addEventListener('click', function (ev) {
      var t = ev.target, x;
      if ((x = t.closest('[data-resetf]'))) { F = { fr: 'all', fm: 'all' }; setChip('fr', 'all'); setChip('fm', 'all'); $('[data-sort]', root).value = 'feat'; applyFilters(); return; }
      if ((x = t.closest('[data-prefilter]'))) { F = { fr: x.dataset.prefilter, fm: 'all' }; setChip('fr', x.dataset.prefilter); setChip('fm', 'all'); applyFilters(); return; }
      if ((x = t.closest('[data-add]'))) { add({ id: x.dataset.add, size: '12', grind: 'Whole bean', sub: false, qty: 1 }); x.textContent = 'Added'; setTimeout(function () { x.textContent = 'Add to cart'; }, 1200); return; }
      if ((x = t.closest('[data-addpdp]'))) { var box = x.closest('.td-pdp'); var s = pdpState(box); add({ id: s.id, size: s.size, grind: s.grind, sub: s.sub, qty: s.qty }, $('[data-added]', box)); return; }
      if ((x = t.closest('[data-inc]'))) { var l = cart[x.dataset.inc]; l.qty = Math.min(9, l.qty + 1); render(); return; }
      if ((x = t.closest('[data-dec]'))) { var l2 = cart[x.dataset.dec]; l2.qty = Math.max(1, l2.qty - 1); render(); return; }
      if ((x = t.closest('[data-rm]'))) { cart.splice(Number(x.dataset.rm), 1); render(); return; }
      if (t.closest('.td-mob [data-goto]')) { var bg = $('.td-burger[aria-expanded="true"]', root); if (bg) bg.click(); }
    });
    root.addEventListener('change', function (ev) { if (ev.target.name === 'tm') render(); });
    applyFilters(); render();
    /* checkout */
    var form = $('#td-f', root); if (!form) return;
    var lab = function (n) { var r = K.checked(form, n); return r ? r.dataset.label : ''; };
    K.wizard({ root: root, api: api, form: form, last: 3, ev: { start: 'checkout_start', step: 'checkout_step', submit: 'order_placed' }, labels: { next: 'Continue', send: 'Place order (simulated)' },
      validate: function (s) {
        if (!cart.length) return ['Your cart is empty. Add a coffee first.', null];
        if (s === 1) {
          var m = $('#td-mail', form); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) return ['Enter an email address like name@example.com.', m];
          var n = $('#td-name', form); if (n.value.trim().length < 2) return ['Enter your full name.', n];
          var a = $('#td-addr', form); if (a.value.trim().length < 5) return ['Enter your street address.', a];
          var c = $('#td-city', form); if (c.value.trim().length < 2) return ['Enter your city.', c];
          var z = $('#td-zip', form); if (!/^\d{5}(-\d{4})?$/.test(z.value.trim())) return ['Enter a 5-digit ZIP code.', z];
        }
        return null;
      },
      enter: function (s) { render(); if (s === 3) $('#td-rev', form).innerHTML = [['Email', $('#td-mail', form).value.trim()], ['Ship to', $('#td-name', form).value.trim() + ', ' + $('#td-addr', form).value.trim() + ', ' + $('#td-city', form).value.trim() + ' ' + $('#td-zip', form).value.trim()], ['Shipping', lab('tm')], ['Total', $('[data-ckitems]', root) ? $('.td-summary [data-total]', form.closest('.td-cgrid')).textContent : '']].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + api.esc(r[1]) + '</dd></div>'; }).join(''); },
      submit: function () { $('#td-ref', form).textContent = 'TW-' + (5200 + Math.floor(Math.random() * 800)); $('#td-donep', form).textContent = 'A confirmation would be sent to ' + $('#td-mail', form).value.trim() + '.'; cart = []; render(); },
      reset: function () { render(); }
    });
  };
})();
