(function () {
  const A = window.AX; if (!A) return;
  const $ = (id) => document.getElementById(id);

  /* ---------- Hero dashboard counters (looping, illustrative) ---------- */
  const hd = $('hdash');
  if (hd) {
    const t = { clicks: 1240, leads: 86, conv: 31 };
    const els = {}; hd.querySelectorAll('[data-hd]').forEach(e => els[e.dataset.hd] = e);
    function cycle() {
      A.animate(0, 1, 3000, (p) => { Object.keys(t).forEach(k => els[k].textContent = A.num(t[k] * p)); });
    }
    if (A.reduce) Object.keys(t).forEach(k => els[k].textContent = A.num(t[k]));
    else { cycle(); setInterval(cycle, 5500); }
  }

  /* ---------- Simulator ---------- */
  const range = $('simRange');
  if (range) {
    const M = {
      google: { name: 'Google', label: 'Google Ads', cpc: 3.10, ctr: 0.055, lead: 0.085, sale: 0.022 },
      meta: { name: 'Meta', label: 'Meta Ads', cpc: 1.15, ctr: 0.011, lead: 0.045, sale: 0.012 }
    };
    const G = { leads: { mult: 1.0, rl: 'Leads', cl: 'Cost per lead' }, traffic: { mult: 0.82, rl: 'Site visits', cl: 'Cost per visit' }, sales: { mult: 1.12, rl: 'Purchases', cl: 'Cost per purchase' } };
    let plat = 'google', goal = 'leads';
    const W = [0.20, 0.25, 0.27, 0.28];
    const cur = { imp: 0, clk: 0, res: 0, cpc: 0, cpr: 0, wk: [0, 0, 0, 0], ad: 0, fee: 0 };
    let cancel = null;

    function model() {
      const budget = parseInt(range.value, 10), m = M[plat], g = G[goal];
      const progress = (budget - 1000) / (25000 - 1000);
      const cpc = m.cpc * g.mult * (1 + 0.12 * progress);
      const clicks = budget / cpc, imp = clicks / m.ctr;
      const rate = goal === 'leads' ? m.lead : goal === 'sales' ? m.sale : 0.85;
      const res = clicks * rate;
      const feeProg = (budget - 1000) / (100000 - 1000);
      const feePct = 0.50 + feeProg * (0.15 - 0.50);
      const fee = Math.ceil((budget * feePct) / 5) * 5;
      return { budget, cpc, clicks, imp, res, cpr: budget / res, wk: W.map(w => clicks * w), fee, m, g };
    }
    function chart(wk) {
      const X0 = 36, X1 = 400, Y0 = 138, Y1 = 14, max = Math.max(...wk, 1) * 1.15;
      const px = (i) => X0 + (X1 - X0) * (i / 3), py = (v) => Y0 - (Y0 - Y1) * (v / max);
      let d = ''; wk.forEach((v, i) => d += (i ? ' L' : 'M') + px(i).toFixed(1) + ' ' + py(v).toFixed(1));
      $('sLine').setAttribute('d', d);
      $('sArea').setAttribute('d', d + ' L' + px(3) + ' ' + Y0 + ' L' + px(0) + ' ' + Y0 + ' Z');
      let dots = '', lab = '', grid = '';
      wk.forEach((v, i) => { dots += '<circle cx="' + px(i).toFixed(1) + '" cy="' + py(v).toFixed(1) + '" r="5" fill="#fff" stroke="#a855f7" stroke-width="3"/>'; lab += '<text x="' + px(i) + '" y="160" text-anchor="middle">Week ' + (i + 1) + '</text><text x="' + px(i) + '" y="' + (py(v) - 11).toFixed(1) + '" text-anchor="middle" font-weight="600" fill="#16142a">' + A.num(v) + '</text>'; });
      [0, 0.5, 1].forEach(f => { const y = Y0 - (Y0 - Y1) * f; grid += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y + '" y2="' + y + '" stroke="#e6e2da"/>'; });
      $('sDots').innerHTML = dots; $('sLab').innerHTML = lab; $('sGrid').innerHTML = grid;
    }
    function paint(c, m) {
      $('sImp').textContent = A.num(c.imp); $('sClk').textContent = A.num(c.clk);
      $('sRes').textContent = A.num(c.res); $('sCpc').textContent = '$' + c.cpc.toFixed(2);
      $('sCpr').textContent = A.money(c.cpr);
      chart(c.wk);
      const total = c.ad + c.fee || 1;
      $('spAd').style.width = (c.ad / total * 100) + '%'; $('spFee').style.width = (c.fee / total * 100) + '%';
      $('spAdAmt').textContent = A.money(c.ad); $('spFeeAmt').textContent = A.money(c.fee);
    }
    function update() {
      const m = model();
      $('simBudget').textContent = A.money(m.budget); A.setFill(range);
      $('sResL').textContent = m.g.rl; $('sCprL').textContent = m.g.cl; $('spPlat').textContent = m.m.name;
      const from = { imp: cur.imp, clk: cur.clk, res: cur.res, cpc: cur.cpc, cpr: cur.cpr, wk: cur.wk.slice(), ad: cur.ad, fee: cur.fee };
      if (cancel) cancel();
      cancel = A.animate(0, 1, 450, (p) => {
        cur.imp = A.lerp(from.imp, m.imp, p); cur.clk = A.lerp(from.clk, m.clicks, p); cur.res = A.lerp(from.res, m.res, p);
        cur.cpc = A.lerp(from.cpc, m.cpc, p); cur.cpr = A.lerp(from.cpr, m.cpr, p); cur.ad = A.lerp(from.ad, m.budget, p); cur.fee = A.lerp(from.fee, m.fee, p);
        cur.wk = from.wk.map((v, i) => A.lerp(v, m.wk[i], p));
        paint(cur, m);
      });
      const rateTxt = goal === 'leads' ? Math.round(m.m.lead * 1000) / 10 + '% of clicks become leads' : goal === 'sales' ? Math.round(m.m.sale * 1000) / 10 + '% of clicks become purchases' : '85% of clicks become site visits';
      $('simAssume').textContent = 'Hypothetical scenario, not a forecast or guarantee. Assumptions: ' + m.m.label + ' average cost per click about $' + m.m.cpc.toFixed(2) + ', click-through rate ' + (m.m.ctr * 100).toFixed(1) + '%, ' + rateTxt + '. Real results depend on your market, offer, website, and creative.';
      const msg = "Hi, I'd like to put my ad budget to work. From the simulator: Platform " + m.m.label + ", monthly ad budget " + A.money(m.budget) + ", goal " + m.g.rl + ". About my business: ";
      $('simGo').setAttribute('href', 'contact?msg=' + encodeURIComponent(msg));
    }
    function seg(id, set) {
      const g = $(id); g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); set(b.dataset.v); update(); }));
    }
    seg('simPlat', v => plat = v); seg('simGoal', v => goal = v);
    range.addEventListener('input', update);
    update();
  }

  /* ---------- Google / Meta journeys ---------- */
  const tabs = $('chTabs');
  if (tabs) {
    const INTRO = {
      google: 'Search intent: people on Google are already looking for what you offer, so a sponsored result puts you in front of them right when they are ready to act.',
      meta: 'Audience discovery: people scrolling Facebook and Instagram are not searching yet, so strong creative and targeting introduce your business, and retargeting brings visitors back.'
    };
    const STEPS = { google: ['Search', 'Ad click', 'Website', 'Lead'], meta: ['Scroll', 'Ad tap', 'Product page', 'Purchase'] };
    const jn = { google: $('jnyGoogle'), meta: $('jnyMeta') };
    let kind = 'google', timers = [], seen = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    function typeInto(el, text, ms, delay, done) {
      if (A.reduce) { el.textContent = text; return; }
      el.textContent = '';
      for (let i = 1; i <= text.length; i++) later(() => { el.textContent = text.slice(0, i); if (i === text.length && done) done(); }, delay + i * ms);
    }
    function drawSteps(stage) {
      $('chSteps').innerHTML = STEPS[kind].map((s, i) => '<button type="button" data-i="' + i + '" class="' + (i === stage ? 'on' : (i < stage ? 'done' : '')) + '">' + (i + 1) + '. ' + s + '</button>').join('');
      $('chSteps').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { clear(); stageTo(parseInt(b.dataset.i, 10), true); }));
    }
    function stageTo(i, manual) {
      const el = jn[kind]; el.dataset.stage = i; drawSteps(i);
      if (manual || A.reduce) {
        // jump straight to the finished look of each stage
        el.classList.add('typed', 'scrolled');
        if (kind === 'google') { $('gType').textContent = 'Best Roofing Company Near Me'; $('fName').textContent = i >= 3 ? 'Alex Rivera' : ''; $('fPhone').textContent = i >= 3 ? '(555) 010-0123' : ''; }
      }
    }
    function play() {
      clear(); const el = jn[kind];
      el.classList.remove('typed', 'scrolled'); stageTo(0);
      if (A.reduce) { stageTo(3, true); return; }
      if (kind === 'google') {
        $('gType').textContent = ''; $('fName').textContent = ''; $('fPhone').textContent = '';
        typeInto($('gType'), 'Best Roofing Company Near Me', 55, 300, () => el.classList.add('typed'));
        later(() => stageTo(1), 2700); later(() => stageTo(2), 4300);
        later(() => stageTo(3), 6000);
        typeInto($('fName'), 'Alex Rivera', 70, 4900); typeInto($('fPhone'), '(555) 010-0123', 50, 5700);
      } else {
        later(() => el.classList.add('scrolled'), 300);
        later(() => stageTo(1), 2700); later(() => stageTo(2), 4400); later(() => stageTo(3), 6300);
      }
    }
    function select(k) {
      kind = k; clear();
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === k ? 'true' : 'false'));
      Object.keys(jn).forEach(j => jn[j].hidden = j !== k);
      $('chIntro').textContent = INTRO[k]; play();
    }
    tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => select(b.dataset.p)));
    A.tabKeys(tabs);
    $('chReplay').addEventListener('click', play);
    $('chIntro').textContent = INTRO.google; drawSteps(0); jn.google.dataset.stage = 0; jn.meta.dataset.stage = 0;
    A.onView(jn.google, () => { if (!seen) { seen = true; play(); } }, 0.4);
  }

  /* ---------- Optimization before / after ---------- */
  const sw = $('optSw');
  if (sw) {
    const S = [{ w: [30, 38, 45], t: ['Broad', '38%', '45%'] }, { w: [82, 71, 78], t: ['Refined', '71%', '78%'] }];
    function setO(i) { [1, 2, 3].forEach((n, k) => { $('o' + n).style.width = S[i].w[k] + '%'; $('o' + n + 'v').textContent = S[i].t[k]; }); sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.o === String(i))); }
    sw.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setO(parseInt(b.dataset.o, 10))));
    setO(0);
    A.onView(sw, () => setTimeout(() => setO(1), 1200), 0.6);
  }

  /* ---------- Reporting preview ---------- */
  const rep = $('rep');
  if (rep) {
    const vals = { spend: 5000, clicks: 1610, conv: 143, cpl: 35 };
    const pts = [8, 14, 12, 22, 27, 25, 36, 44];
    let d = ''; pts.forEach((v, i) => d += (i ? ' L' : 'M') + (i * 300 / 7).toFixed(1) + ' ' + (64 - v * 1.3).toFixed(1));
    $('spk').setAttribute('d', d);
    const spk = $('spk'); const len = 420; spk.style.strokeDasharray = len; spk.style.strokeDashoffset = A.reduce ? 0 : len; spk.style.transition = 'stroke-dashoffset 1.6s ease';
    A.onView(rep, () => {
      spk.style.strokeDashoffset = 0;
      A.animate(0, 1, 1400, (p) => {
        rep.querySelectorAll('[data-rp]').forEach(e => { const k = e.dataset.rp; const v = vals[k] * p; e.textContent = (k === 'spend' || k === 'cpl') ? A.money(v) : A.num(v); });
      });
    }, 0.5);
  }
})();
