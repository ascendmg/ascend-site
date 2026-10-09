#!/usr/bin/env python3
"""Builds a case study page from a JSON config.
Usage:  python3 build.py ciudadanoready abogadaus      (run from this folder)
Writes ../<slug>.html using the shared nav/footer from ../index.html.
To add a project: copy a .json file, edit the content, run this script."""
import json, re, sys, html, pathlib
here = pathlib.Path(__file__).parent
root = here.parent
CAL = "https://calendly.com/michael-hqascend/free-consultation"
idx = (root / "index.html").read_text()
nav = idx[idx.index("<body>") + 6: idx.index("</nav>") + 6]
mob = re.search(r'<div class="mobile-menu".*?\n</div>', idx, re.S).group(0)
foot = idx[idx.index("<footer>"): idx.index("</footer>") + 9]
e = html.escape

ICON = {
 "path": '<path d="M4 18c4 0 4-12 8-12s4 12 8 12"/><circle cx="4" cy="18" r="1.6"/><circle cx="20" cy="18" r="1.6"/>',
 "lang": '<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 7 8M12 5c-1 4-4 7-8 8M14 20l4-9 4 9M15.5 17h5"/>',
 "cart": '<path d="M3 4h2l2.4 11h10.3L20 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
 "call": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>',
 "audit": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
}
def ico(k): return f'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON.get(k, ICON["path"])}</svg>'
CHECK = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def page(d):
    n = e(d["name"]); acc = d["accent"]
    tabs = d["showcase"]["tabs"]
    tab_btns = "".join(f'<button type="button" role="tab" id="cs-tab-{t["id"]}" aria-selected="{"true" if i==0 else "false"}" aria-controls="csStage" data-i="{i}">{e(t["label"])}</button>' for i, t in enumerate(tabs))
    pills = "".join(f"<span>{e(c)}</span>" for c in d["capabilities"])
    feats = "".join(f'''<article class="cs-feat" data-i="{i}" tabindex="0" aria-label="{e(f["t"])}">
        <div class="cs-feat-vis" data-vis="{i}"></div>
        <h3>{e(f["t"])}</h3><p>{e(f["d"])}</p>
        <div class="cs-feat-more"><span>{e(f["more"])}</span></div></article>''' for i, f in enumerate(d["features"]["items"]))
    hl = "".join(f'<div class="cs-hl"><span class="cs-hl-ico">{ico(h["icon"])}</span><b>{e(h["t"])}</b></div>' for h in d["challenge"]["highlights"])
    pains = "".join(f"<li>{e(x)}</li>" for x in d["challenge"]["pains"])
    wins = "".join(f"<li>{e(x)}</li>" for x in d["challenge"]["wins"])
    res = "".join(f'<li style="--d:{i*90}ms"><span class="cs-ck">{CHECK}</span>{e(x)}</li>' for i, x in enumerate(d["results"]["items"]))
    ld = json.dumps({"@context": "https://schema.org", "@type": "CreativeWork", "name": f'{d["name"]} case study', "creator": {"@type": "Organization", "name": "Ascend Website Design & Marketing"}, "about": d["category"], "url": f'https://www.hqascend.com/{d["slug"]}'})
    data = json.dumps(d, ensure_ascii=False).replace("</", "<\\/")
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(d["title"])}</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/brand/favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="{e(d["metaDescription"])}">
<link rel="canonical" href="https://www.hqascend.com/{d["slug"]}">
<meta property="og:title" content="{e(d["title"])}">
<meta property="og:description" content="{e(d["metaDescription"])}">
<meta property="og:image" content="https://hqascend.com/assets/brand/og-image.jpg">
<meta property="og:url" content="https://hqascend.com/{d["slug"]}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(d["title"])}">
<meta name="twitter:description" content="{e(d["metaDescription"])}">
<meta name="twitter:image" content="https://hqascend.com/assets/brand/og-image.jpg">
<script type="application/ld+json">{ld}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared.css?v=6">
<link rel="stylesheet" href="case-study.css?v=1">
</head>
<body>
{nav}
{mob}

<main class="cs" style="--cs-accent:{acc}">

<!-- 1. HERO -->
<header class="cs-hero">
  <div class="cs-wrap cs-hero-grid">
    <div class="cs-hero-copy">
      <div class="eyebrow">{e(d["eyebrow"])}</div>
      <h1>{n}</h1>
      <p class="cs-tag">&ldquo;{e(d["tagline"])}&rdquo;</p>
      <p class="cs-desc">{e(d["description"])}</p>
      <div class="hero-ctas">
        <a href="{e(d["url"])}" target="_blank" rel="noopener" class="btn-primary">Visit Live Website &#8599;</a>
        <a href="#explore" class="btn-ghost">Explore the project</a>
      </div>
      <div class="cs-info" aria-label="Project information">
        <div><small>Project</small><b>{e(d["category"])}</b></div>
        <div><small>Industry</small><b>{e(d["industry"])}</b></div>
        <div class="cs-info-wide"><small>What we did</small><div class="cs-pills">{pills}</div></div>
      </div>
    </div>
    <div class="cs-devices" id="csDevices" aria-label="Desktop and mobile previews of {n}">
      <div class="cs-browser">
        <div class="cs-bar"><i></i><i></i><i></i><span>{e(d["host"])}</span></div>
        <img src="{e(d["hero"]["desktop"]["img"])}" alt="{e(d["hero"]["desktop"]["alt"])}" fetchpriority="high">
      </div>
      <div class="cs-phone" id="csPhone" aria-hidden="true"></div>
    </div>
  </div>
  <p class="cs-fine">Desktop preview is a screenshot of the live site. Mobile preview is recreated from the live design.</p>
</header>

<!-- 2. SHOWCASE -->
<section class="cs-sec" id="explore">
  <div class="cs-wrap">
    <div class="cs-head reveal"><h2>{e(d["showcase"]["headline"])}</h2></div>
    <div class="cs-controls reveal">
      <div class="cs-tabs" role="tablist" aria-label="Project areas">{tab_btns}</div>
      <div class="cs-dev" role="group" aria-label="Preview size">
        <button type="button" data-dev="desktop" aria-pressed="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>Desktop</button>
        <button type="button" data-dev="mobile" aria-pressed="false"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>Mobile</button>
      </div>
    </div>
    <div class="cs-showwrap reveal">
      <div class="cs-frame" id="csFrame">
        <div class="cs-bar"><i></i><i></i><i></i><span id="csUrl">{e(d["host"])}</span></div>
        <div class="cs-stage" id="csStage" role="tabpanel" aria-live="polite">
          <noscript><img src="{e(tabs[0].get("img",""))}" alt="{e(tabs[0].get("alt",""))}"></noscript>
        </div>
      </div>
    </div>
    <p class="cs-cap" id="csCap"><span id="csCapText"></span> <em id="csTag"></em></p>
  </div>
</section>

<!-- 3. CHALLENGE / SOLUTION -->
<section class="cs-sec cs-alt">
  <div class="cs-wrap">
    <div class="cs-head reveal"><h2>{e(d["challenge"]["headline"])}</h2></div>
    <div class="cs-vs reveal">
      <div class="cs-side cs-before">
        <span class="cs-label">{e(d["challenge"]["challengeTitle"])}</span>
        <p>{e(d["challenge"]["challenge"])}</p>
        <ul class="cs-pain">{pains}</ul>
      </div>
      <div class="cs-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
      <div class="cs-side cs-after">
        <span class="cs-label">{e(d["challenge"]["solutionTitle"])}</span>
        <p>{e(d["challenge"]["solution"])}</p>
        <ul class="cs-win">{wins}</ul>
      </div>
    </div>
    <div class="cs-hls reveal">{hl}</div>
  </div>
</section>

<!-- 4. FEATURES -->
<section class="cs-sec">
  <div class="cs-wrap">
    <div class="cs-head reveal"><h2>{e(d["features"]["headline"])}</h2></div>
    <div class="cs-feats reveal">{feats}</div>
  </div>
</section>

<!-- 5. RESULTS + CTA -->
<section class="cs-sec cs-alt">
  <div class="cs-wrap">
    <div class="cs-head reveal"><h2>{e(d["results"]["headline"])}</h2></div>
    <ul class="cs-results reveal">{res}</ul>
    <p class="cs-note reveal">{e(d["results"]["note"])}</p>
    <p class="cs-disc reveal">{e(d["results"]["disclaimer"])}</p>
  </div>
</section>

<section class="cs-cta">
  <div class="cs-wrap reveal">
    <h2>Have an Idea Like This?</h2>
    <p>We turn complex ideas into intuitive digital experiences. Let&rsquo;s build yours.</p>
    <div class="hero-ctas" style="justify-content:center;">
      <a href="contact" class="btn-primary">Start Your Project</a>
      <a href="portfolio" class="btn-ghost">Explore More Work</a>
    </div>
  </div>
</section>

</main>

{foot}

<script type="application/json" id="csData">{data}</script>
<script src="script.js?v=3"></script>
<script src="case-study.js?v=1" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
'''

for slug in sys.argv[1:] or ["ciudadanoready", "abogadaus"]:
    d = json.loads((here / f"{slug}.json").read_text())
    (root / f'{d["slug"]}.html').write_text(page(d))
    print("built", d["slug"] + ".html")
