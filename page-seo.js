(function () {
  const A = window.AX; if (!A) return;
  const $ = (id) => document.getElementById(id);

  /* ---------- 1. Before / after demo ---------- */
  const stage = $('seoStage');
  if (stage) {
    const list = $('sxList'), range = $('seoRange'), optBtn = $('optBtn');
    const keys = ['a', 'b', 'c', 'd'], ROW = 74;
    const el = (k) => list.querySelector('[data-k="' + k + '"]');
    const bars = $('bars12');
    for (let i = 0; i < 12; i++) bars.appendChild(document.createElement('i'));
    const barEls = bars.querySelectorAll('i');
    const fixes = Array.from(document.querySelectorAll('#fixList li'));
    const snapBtns = stage.querySelectorAll('[data-snap]');
    let t = 0, cancel = null;

    function render(v) {
      t = Math.max(0, Math.min(1, v));
      const m = 4 - 3 * t;
      keys.forEach((k, i) => {
        const shift = Math.max(0, Math.min(1, i - m + 1));
        el(k).style.transform = 'translateY(' + ((i + shift) * ROW) + 'px)';
      });
      el('me').style.transform = 'translateY(' + (m * ROW) + 'px)';
      const pos = Math.round(18 - 15 * t);
      const chip = $('rankChip');
      chip.textContent = 'Position ' + pos + ' · ' + (pos > 10 ? 'Page 2' : 'Page 1');
      chip.classList.toggle('good', pos <= 10);
      list.dataset.ph = t >= 0.5 ? 'after' : 'before';
      const e = Math.pow(t, 1.35);
      $('mVis').textContent = A.num(A.lerp(140, 1150, e));
      $('mInq').textContent = A.num(A.lerp(2, 19, e));
      $('mKw').textContent = A.num(A.lerp(6, 58, e));
      let open = 0;
      fixes.forEach(li => { const f = t >= parseFloat(li.dataset.at); li.classList.toggle('fixed', f); if (!f) open++; });
      $('mIss').textContent = open;
      barEls.forEach((b, i) => {
        const low = 8 + (i % 3) * 1.5, high = 14 + 84 * Math.pow(i / 11, 1.7);
        b.style.height = A.lerp(low, high, t) + '%';
      });
      range.value = Math.round(t * 100); A.setFill(range);
      snapBtns.forEach(b => b.classList.toggle('on', (t >= 0.5) === (b.dataset.snap === '1')));
      optBtn.textContent = t >= 0.99 ? 'Replay' : 'Optimize My SEO';
    }
    function go(to, ms) { if (cancel) cancel(); cancel = A.animate(t, to, ms, render); }
    range.addEventListener('input', () => { if (cancel) cancel(); render(range.value / 100); });
    optBtn.addEventListener('click', () => { if (t >= 0.99) { render(0); } go(1, 3600); });
    snapBtns.forEach(b => b.addEventListener('click', () => go(b.dataset.snap === '1' ? 1 : 0, 900)));
    render(0);
  }

  /* ---------- 2. Growth chart ---------- */
  const chart = $('gChart');
  if (chart) {
    const X0 = 40, X1 = 624, Y0 = 200, Y1 = 14, YMAX = 1200;
    const vis = (m) => 150 * Math.pow(1.17, m);
    const px = (m) => X0 + (X1 - X0) * (m / 12);
    const py = (v) => Y0 - (Y0 - Y1) * (v / YMAX);
    let grid = '';
    [0, 400, 800, 1200].forEach(v => { grid += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + py(v) + '" y2="' + py(v) + '" stroke="#e6e2da"/><text x="' + (X0 - 8) + '" y="' + (py(v) + 4) + '" text-anchor="end" font-size="11" fill="#5d596b">' + v + '</text>'; });
    $('gGrid').innerHTML = grid;
    let lab = ''; [0, 3, 6, 9, 12].forEach(m => { lab += '<text x="' + px(m) + '" y="222" text-anchor="middle">' + (m === 0 ? 'Start' : 'M' + m) + '</text>'; });
    $('gLabels').innerHTML = lab;
    $('gBase').setAttribute('d', 'M' + px(0) + ' ' + py(150) + ' L' + px(12) + ' ' + py(150));
    let cur = 0, cancel = null, touched = false;
    function draw(m) {
      cur = m; let d = '';
      for (let x = 0; x <= m + 0.001; x += 0.25) d += (d ? ' L' : 'M') + px(x).toFixed(1) + ' ' + py(vis(x)).toFixed(1);
      d += ' L' + px(m).toFixed(1) + ' ' + py(vis(m)).toFixed(1);
      $('gLineP').setAttribute('d', d);
      $('gAreaP').setAttribute('d', d + ' L' + px(m).toFixed(1) + ' ' + Y0 + ' L' + px(0) + ' ' + Y0 + ' Z');
      const dot = $('gDot'); dot.setAttribute('cx', px(m)); dot.setAttribute('cy', py(vis(m)));
      const v = vis(m);
      $('gVis').textContent = A.num(v);
      $('gImp').textContent = A.num(v * 13.5);
      $('gKw').textContent = A.num(6 + 80 * Math.pow(m / 12, 1.2));
      $('gInq').textContent = A.num(v * 0.016);
    }
    function to(m, ms) { if (cancel) cancel(); cancel = A.animate(cur, m, ms, draw); }
    const tabs = $('monthTabs');
    tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      touched = true; to(parseInt(b.dataset.m, 10), 1000);
    }));
    A.tabKeys(tabs);
    draw(0);
    A.onView(chart, () => { if (!touched) to(1, 1000); });
  }

  /* ---------- 3. Journey ---------- */
  const nav = $('jrNav');
  if (nav) {
    const steps = [
      ['Website Audit', 'We scan your site for the problems that quietly hold it back, and the opportunities your competitors are already using.', ['Speed, mobile and broken-page checks', 'A plain-English list of what to fix first']],
      ['Technical SEO', 'We make it easy for Google to find, read and trust your pages, and fast for people to use them.', ['Indexing and site structure', 'Faster pages on every device']],
      ['Keyword Strategy', 'We find the searches your future customers really type, and match each one to a page on your site.', ['Real search demand, not guesses', 'A clear plan for which pages to build']],
      ['On-Page Optimization', 'We improve titles, descriptions, content and internal links so each page clearly answers what people are searching for.', ['Clear page titles and descriptions', 'Helpful content and smart internal links']],
      ['Local SEO', 'For businesses that serve a local area, we strengthen your presence in map results and local searches.', ['Google Business Profile tuning', 'Consistent listings and service-area pages']],
      ['Reporting & Optimization', 'Every month you get a simple report, and we keep adjusting based on what the data shows.', ['Rankings, traffic and inquiries tracked', 'Ongoing improvements, not set and forget']]
    ];
    const viz = $('jrViz'); const btns = nav.querySelectorAll('.jr-btn');
    let capTimer = null;
    function show(i, replay) {
      btns.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      $('jrTitle').textContent = steps[i][0]; $('jrText').textContent = steps[i][1];
      $('jrList').innerHTML = steps[i][2].map(t => '<li>' + t + '</li>').join('');
      viz.dataset.s = i;
      viz.classList.remove('play'); void viz.offsetWidth; viz.classList.add('play');
      clearInterval(capTimer);
      const cap = $('v0cap'); cap.textContent = A.reduce ? '4 issues found' : '0 issues found';
      if (i === 0 && !A.reduce) { let n = 0; const times = [400, 750, 1150, 1500]; times.forEach((tm, k) => setTimeout(() => { if (viz.dataset.s === '0') cap.textContent = (k + 1) + ' issues found'; }, tm)); }
    }
    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    A.tabKeys(nav);
    show(0);
  }
})();
