  // Nav background on scroll
  const nav = document.getElementById('nav');
  const fill = document.getElementById('ascendFill');

  function onScroll(){
    if(window.scrollY > 40){ nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    fill.style.height = pct + '%';
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile menu toggle
  const navBurger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navBurger && mobileMenu) {
    navBurger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      navBurger.classList.toggle('open', isOpen);
      navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navBurger.classList.remove('open');
        navBurger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    try {
      const pre = new URLSearchParams(window.location.search).get('msg');
      const ta = contactForm.querySelector('textarea[name="message"]');
      if (pre && ta && !ta.value) ta.value = pre.slice(0, 1200);
    } catch (e) {}
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('formStatus');
      const submitBtn = contactForm.querySelector('.form-submit');
      const formData = new FormData(contactForm);
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          statusEl.textContent = "Message sent, we'll get back to you soon.";
          statusEl.className = 'form-status success';
          contactForm.reset();
        } else {
          statusEl.textContent = data.error || 'Something went wrong. Please try again.';
          statusEl.className = 'form-status error';
        }
      } catch (err) {
        statusEl.textContent = 'Something went wrong. Please try again or email us directly.';
        statusEl.className = 'form-status error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  // Mega menu dropdowns
  document.querySelectorAll('.nav-item').forEach(item => {
    const trigger = item.querySelector('.nav-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-item.open').forEach(el => el.classList.remove('open'));
  });

  // Animated count-up for stat numbers, triggers once when scrolled into view
  const countEls = document.querySelectorAll('[data-count-to]');
  if (countEls.length) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.countTo, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 900;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => countIO.observe(el));
  }

  // ===== Homepage interactivity =====
  (function () {
    const explorer = document.getElementById('explorer');
    if (!explorer) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-US');

    // --- Tabs ---
    const tabs = explorer.querySelectorAll('.ex-tab');
    const panels = explorer.querySelectorAll('.ex-panel');
    function openTab(name, scroll) {
      tabs.forEach(t => {
        const on = t.dataset.tab === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
      if (name === 'found') playSerp();
      if (name === 'grow') playTicks();
      if (scroll) {
        const sec = document.getElementById('what');
        if (sec) sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }
    tabs.forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab, false)));
    document.querySelectorAll('[data-goto]').forEach(c =>
      c.addEventListener('click', () => openTab(c.dataset.goto, true)));

    // --- Google results climb ---
    const serpList = document.getElementById('serpList');
    const ROW = 50;
    let serpTimer = null;
    function layoutSerp(order) {
      order.forEach((k, i) => {
        const li = serpList.querySelector('[data-k="' + k + '"]');
        li.style.transform = 'translateY(' + (i * ROW) + 'px)';
        li.querySelector('.pos').textContent = String(i + 1);
      });
    }
    function playSerp() {
      if (!serpList) return;
      clearTimeout(serpTimer);
      let order = ['c1', 'c2', 'c3', 'c4', 'me'];
      const jump = document.getElementById('serpJump');
      if (jump) jump.classList.remove('show');
      layoutSerp(order);
      if (reduce) { layoutSerp(['me', 'c1', 'c2', 'c3', 'c4']); if (jump) jump.classList.add('show'); return; }
      let idx = 4;
      const step = () => {
        if (idx === 0) { if (jump) jump.classList.add('show'); return; }
        const t = order[idx - 1]; order[idx - 1] = order[idx]; order[idx] = t; idx--;
        layoutSerp(order);
        serpTimer = setTimeout(step, 520);
      };
      serpTimer = setTimeout(step, 700);
    }
    const serpReplay = document.getElementById('serpReplay');
    if (serpReplay) serpReplay.addEventListener('click', playSerp);

    // --- Ad budget fee (same formula as the pricing page) ---
    const adsRange = document.getElementById('adsRange');
    function updateAds() {
      const spend = parseInt(adsRange.value, 10);
      const progress = (spend - 1000) / (100000 - 1000);
      const pct = 0.50 + progress * (0.15 - 0.50);
      const dollars = Math.ceil((spend * pct) / 5) * 5;
      document.getElementById('adsVal').innerHTML = fmtMoney(spend) + '<small>/mo ad budget</small>';
      document.getElementById('adsFee').innerHTML = (pct * 100).toFixed(1) + '% &middot; ' + fmtMoney(dollars) + '/mo';
      adsRange.style.setProperty('--pr', progress);
    }
    if (adsRange) { adsRange.addEventListener('input', updateAds); updateAds(); }

    // --- Before / after ---
    const mock = document.getElementById('mock');
    document.querySelectorAll('.switch button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.switch button').forEach(x => x.classList.toggle('on', x === b));
      mock.classList.toggle('after', b.dataset.state === 'after');
    }));

    // --- Monthly checklist ---
    const tickItems = document.querySelectorAll('#tickList li');
    let tickTimers = [];
    function playTicks() {
      tickTimers.forEach(clearTimeout); tickTimers = [];
      tickItems.forEach(li => li.classList.remove('done'));
      tickItems.forEach((li, i) => {
        if (reduce) { li.classList.add('done'); return; }
        tickTimers.push(setTimeout(() => li.classList.add('done'), 350 + i * 450));
      });
    }
    const tickReplay = document.getElementById('tickReplay');
    if (tickReplay) tickReplay.addEventListener('click', playTicks);

    // --- Calculator ---
    const $ = (id) => document.getElementById(id);
    const cV = $('cVisitors'), cC = $('cConv'), cVal = $('cValue'), cT = $('cTraffic'), cL = $('cLift');
    if (cV) {
      const shown = { extra: 0, now: 0, wth: 0 };
      function tween(key, el, to, fmt) {
        const from = shown[key]; const t0 = performance.now(); const dur = reduce ? 0 : 450;
        function f(now) {
          const p = dur ? Math.min((now - t0) / dur, 1) : 1;
          const e = 1 - Math.pow(1 - p, 3);
          shown[key] = from + (to - from) * e;
          el.textContent = fmt(shown[key]);
          if (p < 1) requestAnimationFrame(f);
        }
        requestAnimationFrame(f);
      }
      function setFill(r) {
        const min = parseFloat(r.min), max = parseFloat(r.max), v = parseFloat(r.value);
        r.style.setProperty('--pr', (v - min) / (max - min));
      }
      function calc() {
        [cV, cC, cVal, cT, cL].forEach(setFill);
        const visitors = parseFloat(cV.value), conv = parseFloat(cC.value) / 100, value = parseFloat(cVal.value);
        const traffic = parseFloat(cT.value) / 100, lift = parseFloat(cL.value) / 100;
        $('oVisitors').textContent = visitors.toLocaleString('en-US');
        $('oConv').textContent = parseFloat(cC.value).toFixed(1) + '%';
        $('oValue').textContent = fmtMoney(value);
        $('oTraffic').textContent = '+' + Math.round(traffic * 100) + '%';
        $('oLift').textContent = '+' + Math.round(lift * 100) + '%';
        const now = visitors * conv;
        const wth = visitors * (1 + traffic) * conv * (1 + lift);
        const extra = (wth - now) * value;
        tween('extra', $('coExtra'), extra, fmtMoney);
        $('coYear').textContent = 'per month, about ' + fmtMoney(extra * 12) + ' a year';
        $('nNow').textContent = now.toFixed(1);
        $('nWith').textContent = wth.toFixed(1);
        const max = Math.max(wth, now, 0.001);
        $('barNow').style.width = (now / max * 100) + '%';
        $('barWith').style.width = (wth / max * 100) + '%';
      }
      [cV, cC, cVal, cT, cL].forEach(r => r.addEventListener('input', calc));
      calc();
    }

    playSerp();
  })();
