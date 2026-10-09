(function () {
  const A = window.AX; if (!A) return;
  const $ = (id) => document.getElementById(id);

  /* Before / after */
  const ba = $('ba');
  if (ba) {
    const range = $('baRange'); let x = 0, cancel = null;
    const snaps = document.querySelectorAll('[data-ba]');
    function set(v) {
      x = Math.max(0, Math.min(100, v));
      ba.style.setProperty('--x', x + '%'); range.value = Math.round(x);
      ba.dataset.shown = x > 62 ? '1' : '0';
      snaps.forEach(b => b.classList.toggle('on', (x >= 50) === (b.dataset.ba === '100')));
    }
    function go(to, ms) { if (cancel) cancel(); cancel = A.animate(x, to, ms, set); }
    range.addEventListener('input', () => { if (cancel) cancel(); set(parseFloat(range.value)); });
    let dragging = false;
    function fromEvent(e) { const r = ba.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    ba.addEventListener('pointerdown', (e) => { dragging = true; if (cancel) cancel(); set(fromEvent(e)); try { ba.setPointerCapture(e.pointerId); } catch (_) {} });
    ba.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e)); });
    const end = () => { dragging = false; };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end);
    snaps.forEach(b => b.addEventListener('click', () => go(parseFloat(b.dataset.ba), 800)));
    set(0);
    A.onView(ba, () => go(100, 1800), 0.5);
  }

  /* What we build */
  const dev = $('dev');
  if (dev) {
    const T = {
      biz: { c: ['#6366f1', '#a855f7'], title: 'Business Websites', text: 'A clear, credible home for your company that explains what you do and makes contacting you easy.', bullets: ['Services, about, and contact pages', 'Click-to-call and quote forms', 'Built to rank on Google'],
        html: (n) => nav(n, 'Harbor Co.', ['Services', 'About', 'Contact'], 'Get a quote') + hero('Trusted local service, made simple.', 'Clear pricing and fast replies.', 'Get a quote') + '<div class="pv-grid">' + cells(['Repairs', 'Installs', 'Inspections'], 'Short, plain-language description.') + '</div>' },
      shop: { c: ['#ec4899', '#6366f1'], title: 'E-Commerce', text: 'Online stores that make browsing, choosing, and checking out feel effortless.', bullets: ['Product pages and collections', 'Cart and secure checkout', 'Shopify or fully custom'],
        html: (n) => nav(n, 'Maple Goods', ['Shop', 'New', 'Cart (2)'], 'Cart') + hero('New arrivals, ready to ship.', 'Free returns on every order.', 'Shop now') + '<div class="pv-grid four">' + prods(['$48', '$36', '$62', '$29']) + '</div>' },
      land: { c: ['#22d3ee', '#6366f1'], title: 'Landing Pages', text: 'One focused page for one goal, ideal for ad campaigns, launches, and offers.', bullets: ['Single clear message and offer', 'Lead form that is hard to miss', 'Fast, distraction-free layout'],
        html: (n) => hero('Get your free estimate in 2 minutes.', 'Tell us what you need and we will reply the same day.', 'Start now') + '<div class="pv-form"><i></i><i></i><i></i><span>Request my estimate</span></div>' },
      custom: { c: ['#a855f7', '#ec4899'], title: 'Custom Websites', text: 'When a template will not do, we design and build exactly what your business needs, from booking tools to portals.', bullets: ['Unique design, no templates', 'Custom features and integrations', 'Built to grow with you'],
        html: (n) => nav(n, 'Nova', ['Product', 'Pricing', 'Login'], 'Start') + '<div class="pv-bento"><div class="g w2 h2"></div><div class="bars w2 h2"><u style="--h:30%"></u><u style="--h:48%"></u><u style="--h:40%"></u><u style="--h:72%"></u><u style="--h:90%"></u></div><div class="w2"></div><div></div><div class="g"></div></div>' }
    };
    function nav(n, brand, links, cta) { return '<div class="pv-nav"><b>' + brand + '</b>' + links.map(l => '<span>' + l + '</span>').join('') + '<em>' + cta + '</em></div>'; }
    function hero(h, p, b) { return '<div class="pv-hero"><h5>' + h + '</h5><p>' + p + '</p><span class="b">' + b + '</span></div>'; }
    function cells(names, d) { return names.map(n => '<div class="pv-cell"><b>' + n + '</b>' + d + '</div>').join(''); }
    function prods(prices) { return prices.map((p, i) => '<div class="pv-prod"><i></i><span>Item ' + (i + 1) + '<em>' + p + '</em></span></div>').join(''); }
    const tabs = $('bTabs'), wrap = $('devWrap'); let cur = 'biz';
    function render(k) {
      cur = k; const t = T[k];
      dev.style.setProperty('--c1', t.c[0]); dev.style.setProperty('--c2', t.c[1]);
      dev.style.animation = 'none'; void dev.offsetWidth; dev.style.animation = '';
      dev.innerHTML = t.html(true);
      $('bTitle').textContent = t.title; $('bText').textContent = t.text;
      $('bList').innerHTML = t.bullets.map(b => '<li>' + b + '</li>').join('');
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.b === k ? 'true' : 'false'));
    }
    tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => render(b.dataset.b)));
    A.tabKeys(tabs);
    document.querySelectorAll('[data-dev]').forEach(b => { if (b.closest('.switch')) b.addEventListener('click', () => {
      wrap.dataset.dev = b.dataset.dev;
      b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    }); });
    render('biz');
  }

  /* Services */
  document.querySelectorAll('#svcGrid .svc').forEach(b => b.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  }));
  const proc = $('proc');
  if (proc) {
    const fill = $('procFill');
    A.onView(proc, () => { proc.classList.add('go'); fill.style.width = '100%'; }, 0.5);
  }
})();
