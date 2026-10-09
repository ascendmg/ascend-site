#!/usr/bin/env python3
"""Builds the Learn hub and every article from articles.json + content/<slug>.html.
Run from this folder:  python3 build.py
Outputs ../learn.html and ../<slug>.html, and updates lastmod entries in ../sitemap.xml.
To add an article: add an entry to articles.json, write content/<slug>.html, run this script.
See README.md."""
import json, re, math, html, pathlib, datetime
from widgets import REGISTRY

here = pathlib.Path(__file__).parent
root = here.parent
cfg = json.loads((here / "articles.json").read_text())
SITE = cfg["site"]; BASE = SITE["base"]; AUTHOR = cfg["author"]
CATS = {c["slug"]: c for c in cfg["categories"]}
ARTS = {a["slug"]: a for a in cfg["articles"]}
e = html.escape

idx = (root / "index.html").read_text()
nav = idx[idx.index("<body>") + 6: idx.index("</nav>") + 6]
mob = re.search(r'<div class="mobile-menu".*?\n</div>', idx, re.S).group(0)
foot = idx[idx.index("<footer>"): idx.index("</footer>") + 9]
CAL = "https://calendly.com/michael-hqascend/free-consultation"

def nice(d): return datetime.date.fromisoformat(d).strftime("%B %-d, %Y")
def slugify(t): return re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", t).lower()).strip("-")
def words(t): return len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", t)))

def head(title, desc, canon, og, extra="", ogtype="website", ld=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/brand/favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{canon}">
<meta property="og:site_name" content="Ascend Website Design &amp; Marketing">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{og}">
<meta property="og:url" content="{canon}">
<meta property="og:type" content="{ogtype}">
{extra}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{og}">
<script type="application/ld+json">{ld}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/shared.css?v=6">
<link rel="stylesheet" href="/learn.css?v=1">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
{nav}
{mob}
'''

def tail():
    return f'''
{foot}
<script src="/script.js?v=3"></script>
<script src="/learn.js?v=1" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
'''

def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}

def card(a, lazy=True):
    c = CATS[a["category"]]
    return f'''<article class="lh-post" data-cat="{a["category"]}">
  <a href="/{a["slug"]}" class="lh-link">
    <div class="lh-img"><img src="/{a["image"]}" alt="{e(a["imageAlt"])}" width="1200" height="630" loading="{'lazy' if lazy else 'eager'}" decoding="async"></div>
    <div class="lh-body">
      <span class="lh-cat" data-c="{a["category"]}">{e(c["name"])}</span>
      <h2>{e(a["title"])}</h2>
      <p>{e(a["cardDescription"])}</p>
      <div class="lh-meta"><span>{a["_rt"]} min read</span><span class="lh-go">Read the guide <i aria-hidden="true">&rarr;</i></span></div>
    </div>
  </a>
</article>'''

def build_article(a):
    body = (here / "content" / f'{a["slug"]}.html').read_text()
    body = re.sub(r"<!--widget:([a-z\-]+)-->", lambda m: REGISTRY[m.group(1)](), body)
    toc = []
    def add_id(m):
        t = re.sub(r"<[^>]+>", "", m.group(1)); i = slugify(t); toc.append((i, t))
        return f'<h2 id="{i}">{m.group(1)}</h2>'
    body = re.sub(r"<h2>(.*?)</h2>", add_id, body, flags=re.S)
    faq = a.get("faq", [])
    if faq: toc.append(("faq", "Frequently asked questions"))
    c = CATS[a["category"]]; url = f'{BASE}/{a["slug"]}'; img = f'{BASE}/{a["image"]}'; ogimg = img.replace('.png', '-og.png')
    svc = a["service"]
    tochtml = "".join(f'<li><a href="#{i}">{e(t)}</a></li>' for i, t in toc)
    faqhtml = ""
    if faq:
        faqhtml = '<section class="la-faq" aria-labelledby="faq"><h2 id="faq">Frequently asked questions</h2>' + "".join(f'<div class="la-q"><h3>{e(x["q"])}</h3><p>{e(x["a"])}</p></div>' for x in faq) + '</section>'
    rel = [ARTS[s] for s in a.get("related", []) if s in ARTS]
    relhtml = "".join(card(r) for r in rel)
    pub = a.get("published")
    dates = f'<span>Updated <time datetime="{a["updated"]}">{nice(a["updated"])}</time></span>' if not pub else f'<span>Published <time datetime="{pub}">{nice(pub)}</time></span><span>Updated <time datetime="{a["updated"]}">{nice(a["updated"])}</time></span>'
    ld = {"@context": "https://schema.org", "@graph": [
      {"@type": "Article", "@id": url + "#article", "headline": a["title"], "description": a["description"], "image": [img],
       "dateModified": a["updated"], **({"datePublished": pub} if pub else {}),
       "author": {"@type": "Person", "name": AUTHOR["name"], "jobTitle": AUTHOR["title"], "url": AUTHOR["url"]},
       "publisher": {"@type": "Organization", "name": SITE["publisher"], "logo": {"@type": "ImageObject", "url": SITE["logo"]}},
       "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "articleSection": c["name"], "inLanguage": "en-US"},
      crumbs_ld([("Home", BASE + "/"), ("Learn", BASE + "/learn"), (a["title"], url)]),
    ]}
    if faq:
        ld["@graph"].append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": x["q"], "acceptedAnswer": {"@type": "Answer", "text": x["a"]}} for x in faq]})
    extra = f'<meta property="article:section" content="{e(c["name"])}">\n<meta property="article:modified_time" content="{a["updated"]}">\n' + (f'<meta property="article:published_time" content="{pub}">\n' if pub else "") + f'<meta property="article:author" content="{e(AUTHOR["name"])}">\n'
    page = head(a["seoTitle"], a["description"], url, ogimg, extra, "article", json.dumps(ld, ensure_ascii=False))
    page += f'''
<main class="la" id="main">
<header class="la-hero">
  <div class="la-wrap">
    <div class="la-crumbs" role="navigation" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/learn">Learn</a></li><li><a href="/learn#{a["category"]}">{e(c["name"])}</a></li><li aria-current="page">{e(a["title"])}</li></ol></div>
    <span class="lh-cat" data-c="{a["category"]}">{e(c["name"])}</span>
    <h1>{e(a["title"])}</h1>
    <p class="la-dek">{e(a["dek"])}</p>
    <div class="la-meta"><span>By <strong>{e(AUTHOR["name"])}</strong>, {e(AUTHOR["title"])}</span>{dates}<span>{a["_rt"]} min read</span></div>
  </div>
</header>
<div class="la-wrap">
  <figure class="la-feature"><img src="/{a["image"]}" alt="{e(a["imageAlt"])}" width="1200" height="630" fetchpriority="high"></figure>
  <div class="la-grid">
    <aside class="la-toc" aria-label="Table of contents">
      <details open><summary>In this guide</summary><ol>{tochtml}</ol></details>
    </aside>
    <article class="la-body">
{body}
{faqhtml}
      <aside class="la-cta" aria-label="Next step">
        <div><h2>{e(svc["title"])}</h2><p>{e(svc["text"])}</p></div>
        <div class="la-cta-btns"><a class="btn-primary" href="{svc["url"]}">{e(svc["label"])}</a><a class="btn-ghost" href="{CAL}" target="_blank" rel="noopener">Book a free call</a></div>
      </aside>
    </article>
  </div>
  <section class="la-related" aria-labelledby="keep">
    <div class="la-relhead"><h2 id="keep">Keep learning</h2><a href="/learn">All guides &rarr;</a></div>
    <div class="lh-grid">{relhtml}</div>
  </section>
</div>
</main>
'''
    page += tail()
    (root / f'{a["slug"]}.html').write_text(page)

def build_hub():
    h = cfg["hub"]; url = BASE + "/learn"
    arts = sorted(ARTS.values(), key=lambda a: a["updated"], reverse=True)
    counts = {s: sum(1 for a in arts if a["category"] == s) for s in CATS}
    chips = f'<button type="button" class="lh-chip" data-f="all" aria-pressed="true">All <span>{len(arts)}</span></button>' + "".join(f'<button type="button" class="lh-chip" data-f="{c["slug"]}" aria-pressed="false" id="{c["slug"]}">{e(c["name"])} <span>{counts[c["slug"]]}</span></button>' for c in cfg["categories"] if counts[c["slug"]])
    ld = {"@context": "https://schema.org", "@graph": [
      {"@type": "CollectionPage", "@id": url, "url": url, "name": h["title"], "description": h["description"], "inLanguage": "en-US", "isPartOf": {"@type": "WebSite", "name": "Ascend Website Design & Marketing", "url": BASE + "/"}},
      {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f'{BASE}/{a["slug"]}', "name": a["title"]} for i, a in enumerate(arts)]},
      crumbs_ld([("Home", BASE + "/"), ("Learn", url)])]}
    og = f'{BASE}/{arts[0]["image"]}'
    page = head(h["seoTitle"], h["description"], url, "https://www.hqascend.com/assets/brand/og-image.jpg", "", "website", json.dumps(ld, ensure_ascii=False))
    page += f'''
<main class="lh" id="main">
<header class="lh-hero">
  <div class="la-wrap">
    <div class="la-crumbs" role="navigation" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Learn</li></ol></div>
    <div class="eyebrow">Learn</div>
    <h1>{e(h["title"])}.</h1>
    <p class="lh-lead">{e(h["lead"])}</p>
    <div class="lh-filter" role="group" aria-label="Filter guides by category">{chips}</div>
  </div>
</header>
<section class="lh-list">
  <div class="la-wrap">
    <p class="lh-empty" hidden>No guides in this category yet.</p>
    <div class="lh-grid" id="lhGrid">
{chr(10).join(card(a, i > 2) for i, a in enumerate(arts))}
    </div>
    <div class="lh-strip">
      <p><strong>Not sure where to start?</strong> Tell us about your business and we'll point you to what will help most.</p>
      <a class="btn-primary" href="{CAL}" target="_blank" rel="noopener">Book a free call</a>
    </div>
  </div>
</section>
</main>
'''
    page += tail()
    (root / "learn.html").write_text(page)

def update_sitemap():
    p = root / "sitemap.xml"; s = p.read_text()
    entries = [("/learn", cfg["hub"]["updated"], "0.8")] + [(f'/{a["slug"]}', a["updated"], "0.7") for a in ARTS.values()]
    for path, lm, pr in entries:
        loc = BASE + path
        s = re.sub(r"\s*<url>\s*<loc>" + re.escape(loc) + r"</loc>.*?</url>", "", s, flags=re.S)
        s = s.replace("</urlset>", f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lm}</lastmod>\n    <priority>{pr}</priority>\n  </url>\n</urlset>")
    p.write_text(s)

for a in ARTS.values():
    body = (here / "content" / f'{a["slug"]}.html').read_text()
    a["_rt"] = max(1, math.ceil((words(body) + sum(words(x["q"] + " " + x["a"]) for x in a.get("faq", []))) / 230))
for a in ARTS.values(): build_article(a); print("built", a["slug"], a["_rt"], "min")
build_hub(); update_sitemap(); print("built learn.html, sitemap updated")
