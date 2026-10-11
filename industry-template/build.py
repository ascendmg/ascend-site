#!/usr/bin/env python3
"""Builds the four industry solution pages from one shared layout.
Run from anywhere:  python3 industry-template/build.py
Edit copy/demos in the PAGES dict below; shared styling lives in industry.css, behaviour in industry.js."""
import html, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
e = html.escape
CAL = "https://calendly.com/michael-hqascend/free-consultation"
idx = (root / "index.html").read_text()
nav = idx[idx.index("<body>") + 6: idx.index("</nav>") + 6]
mob = re.search(r'<div class="mobile-menu".*?\n</div>', idx, re.S).group(0)
foot = idx[idx.index("<footer>"): idx.index("</footer>") + 9]

CHECK = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def frame(url, body, extra_id="", attrs=""):
    return f'''<div class="ind-frame" role="group" aria-label="Interactive demonstration">
  <div class="ind-bar" aria-hidden="true"><i></i><i></i><i></i><span class="ind-url">{e(url)}</span></div>
  <div class="ind-body" id="{extra_id}" {attrs}>{body}</div>
</div>'''

# ---------------------------------------------------------------- LAW FIRMS
def law_demo():
    areas = [
        ("Immigration", "Inmigración", ["Applications and renewals", "Questions about status or next steps", "Preparing for an interview"],
         ["Solicitudes y renovaciones", "Dudas sobre su estatus o los próximos pasos", "Preparación para una entrevista"]),
        ("Family", "Familia", ["Divorce and separation", "Child custody and support", "Changing an existing order"],
         ["Divorcio y separación", "Custodia y manutención de menores", "Modificar una orden existente"]),
        ("Criminal defense", "Defensa penal", ["Charges and arrests", "Court dates and what to expect", "Questions about your rights"],
         ["Cargos y arrestos", "Fechas de corte y qué esperar", "Preguntas sobre sus derechos"]),
        ("Disability", "Incapacidad", ["Applying for benefits", "Appealing a denial", "Gathering medical records"],
         ["Solicitar beneficios", "Apelar una denegación", "Reunir expedientes médicos"]),
    ]
    tabs = "".join(f'<button type="button" role="tab" id="lt{i}" aria-controls="lp{i}" aria-selected="{"true" if i==0 else "false"}" tabindex="{0 if i==0 else -1}"><span lang="en">{a[0]}</span><span lang="es">{a[1]}</span></button>' for i, a in enumerate(areas))
    panes = ""
    for i, (en, es, ben, bes) in enumerate(areas):
        lis_en = "".join(f'<li lang="en">{x}</li>' for x in ben); lis_es = "".join(f'<li lang="es">{x}</li>' for x in bes)
        panes += f'''<div class="ind-pane" role="tabpanel" id="lp{i}" aria-labelledby="lt{i}" {"hidden" if i else ""}>
  <div class="ind-split">
    <div class="ind-box"><h3><span lang="en">{en} matters</span><span lang="es">Asuntos de {es.lower()}</span></h3>
      <h4><span lang="en">Common reasons people reach out</span><span lang="es">Motivos frecuentes de consulta</span></h4>
      <ul>{lis_en}{lis_es}</ul>
    </div>
    <div class="ind-box"><h4><span lang="en">What happens next</span><span lang="es">Qué sigue</span></h4>
      <ol class="ind-steps" style="list-style:none;padding:0;margin:0">
        <li><span lang="en">Tell the office a little about your situation.</span><span lang="es">Cuéntele a la oficina brevemente su situación.</span></li>
        <li><span lang="en">Schedule a consultation.</span><span lang="es">Programe una consulta.</span></li>
        <li><span lang="en">Learn what your options may be.</span><span lang="es">Conozca sus opciones.</span></li>
      </ol>
      <div class="ind-actions">
        <button type="button" class="ind-btn" data-demo-msg data-en="Demonstration only: nothing is sent." data-es="Solo una demostración: no se envía nada."><span lang="en">Request a consultation</span><span lang="es">Solicitar una consulta</span></button>
        <button type="button" class="ind-btn alt" data-demo-msg data-en="Demonstration only: no call is placed." data-es="Solo una demostración: no se realiza ninguna llamada."><span lang="en">Call the office</span><span lang="es">Llamar a la oficina</span></button>
      </div>
    </div></div>
</div>'''
    body = f'''<div class="ind-top"><div class="ind-brand">Sample Law Office<b>.</b></div>
  <div class="ind-lang" role="group" aria-label="Language"><button type="button" data-l="en" aria-pressed="true">EN</button><button type="button" data-l="es" aria-pressed="false">ES</button></div></div>
<div class="ind-tabs" role="tablist" aria-label="Practice areas">{tabs}</div>{panes}
<p class="ind-toast" role="status" aria-live="polite"></p>'''
    return frame("sample-law-office.com", body, "lawDemo", 'data-lang="en"')

# ---------------------------------------------------------------- COURSE
def course_demo():
    mods = [("Welcome", "A short introduction to the course, what you will build, and how to use the lessons."),
            ("Core skills", "The key ideas, taught one step at a time with a clear example."),
            ("Practice", "A short exercise so students apply what they just learned."),
            ("Next steps", "A recap and what to do after finishing the course.")]
    steps = [("Overview", "ov"), ("Enroll", "en"), ("Learn", "ln")]
    jt = "".join(f'<button type="button" role="tab" id="cj{k}" aria-controls="cp{k}" aria-selected="{"true" if i==0 else "false"}" tabindex="{0 if i==0 else -1}"><span class="n">{i+1}</span>{n}</button>' for i, (n, k) in enumerate(steps))
    ov = "".join(f"<li><strong>{e(m)}.</strong> {e(d)}</li>" for m, d in mods)
    lessons = "".join(f'<button type="button" role="tab" aria-selected="{"true" if i==0 else "false"}" aria-controls="lesson{i}"><span class="ck" aria-hidden="true"></span>{i+1}. {e(m)}</button>' for i, (m, d) in enumerate(mods))
    lpanes = "".join(f'''<div id="lesson{i}" {"hidden" if i else ""} role="tabpanel"><h3>{e(m)}</h3><p style="font-size:14px;color:#364055;line-height:1.55;margin-bottom:14px">{e(d)}</p><button type="button" class="ind-btn" data-complete="{i}">Mark complete</button></div>''' for i, (m, d) in enumerate(mods))
    body = f'''<div class="ind-top"><div class="ind-brand">Sample Course<b>.</b></div><span class="ind-note">Sample content</span></div>
<div class="ind-journey ind-tabs" role="tablist" aria-label="Student journey">{jt}</div>
<div class="ind-pane" role="tabpanel" id="cpov" aria-labelledby="cjov">
  <div class="ind-split"><div class="ind-box"><h3>What you will learn</h3><ul>{ov}</ul></div>
  <div class="ind-box"><h4>Clear price, clear access</h4><p style="font-size:14px;color:#364055;line-height:1.5;margin-bottom:14px">Show what is included and how long access lasts before anyone reaches checkout.</p><button type="button" class="ind-btn" data-go="en">Enroll in this course</button></div></div>
</div>
<div class="ind-pane" role="tabpanel" id="cpen" aria-labelledby="cjen" hidden>
  <div class="ind-split"><div class="ind-box"><h3>Enroll</h3><ul><li>Create your account</li><li>Review what is included</li><li>Pay securely, then start right away</li></ul></div>
  <div class="ind-box"><h4>Demonstration</h4><p style="font-size:14px;color:#364055;line-height:1.5;margin-bottom:14px">In a real build, a secure checkout opens here. This demo takes no payment.</p><button type="button" class="ind-btn" data-go="ln">Continue to the course</button></div></div>
</div>
<div class="ind-pane" role="tabpanel" id="cpln" aria-labelledby="cjln" hidden>
  <div class="ind-split"><div class="ind-box"><h4>Your lessons</h4><div class="ind-lessons" role="tablist" aria-label="Lessons">{lessons}</div>
    <div class="ind-prog" aria-hidden="true"><i></i></div><div class="ind-progtxt" role="status" aria-live="polite">0 of 4 lessons complete</div></div>
  <div class="ind-box">{lpanes}</div></div>
</div>'''
    return frame("sample-course.com", body, "courseDemo")

# ---------------------------------------------------------------- ECOMMERCE
TEE = '<svg viewBox="0 0 64 56" aria-hidden="true"><path fill="currentColor" d="M22 4l10 5 10-5 18 8-6 12-8-3v30H18V21l-8 3L4 12z"/></svg>'
MUG = '<svg viewBox="0 0 64 56" aria-hidden="true"><path fill="currentColor" d="M10 10h34v32a8 8 0 01-8 8H18a8 8 0 01-8-8z"/><path fill="none" stroke="currentColor" stroke-width="6" d="M44 18h4a7 7 0 010 14h-4"/></svg>'
TOTE = '<svg viewBox="0 0 64 56" aria-hidden="true"><path fill="currentColor" d="M12 20h40l3 32H9z"/><path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M22 20v-6a10 10 0 0120 0v6"/></svg>'
CAP = '<svg viewBox="0 0 64 56" aria-hidden="true"><path fill="currentColor" d="M10 38a22 22 0 0144 0z"/><path fill="currentColor" d="M44 36h18c0 4-6 8-14 8h-8z"/></svg>'

def shop_demo():
    prods = [
        ("Everyday Tee", "wear", 28, TEE, [("Sand", "#d9c7a5"), ("Sage", "#8fae8b"), ("Ink", "#2b2d42")], ["S", "M", "L", "XL"]),
        ("Ceramic Mug", "home", 18, MUG, [("Cream", "#efe6d2"), ("Sky", "#8fb9d6"), ("Clay", "#c27b5a")], None),
        ("Canvas Cap", "wear", 24, CAP, [("Navy", "#2f4a73"), ("Stone", "#b9b3a6"), ("Rust", "#b5593a")], None),
        ("Market Tote", "home", 22, TOTE, [("Natural", "#e4d9bf"), ("Navy", "#2f4a73"), ("Olive", "#7b8a4f")], None),
    ]
    cards = ""
    for i, (n, c, p, svg, cols, sizes) in enumerate(prods):
        sw = "".join(f'<label><input type="radio" name="v{i}" value="{h}" data-name="{nm}" aria-label="{nm}" {"checked" if j==0 else ""}><span style="--sw:{h}"></span></label>' for j, (nm, h) in enumerate(cols))
        sz = f'<label class="ind-field">Size<select aria-label="Size for {n}">' + "".join(f"<option>{s}</option>" for s in sizes) + "</select></label>" if sizes else ""
        cards += f'''<article class="ind-prod" data-c="{c}" data-n="{n}" data-p="{p}">
  <div class="ind-art" style="--c:{cols[0][1]}">{svg}</div>
  <div class="ind-meta"><h3>{n}</h3><span>${p}</span></div>
  <fieldset class="ind-sw"><legend>Color</legend>{sw}</fieldset>{sz}
  <button type="button" class="ind-btn ind-add">Add to cart</button>
</article>'''
    body = f'''<div class="ind-top"><div class="ind-brand">Sample Shop<b>.</b></div>
  <div class="ind-cart" aria-live="polite">Cart <b id="cartN">0</b></div></div>
<div class="ind-top" style="margin-bottom:0"><div class="ind-tabs ind-filters" role="group" aria-label="Collections">
  <button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="wear" aria-pressed="false">Wearables</button><button type="button" data-f="home" aria-pressed="false">Home</button></div>
  <span class="ind-note" id="shopCount">4 products</span></div>
<div class="ind-prods">{cards}</div>
<div class="ind-cartlist" id="cartList" hidden><ul></ul><div class="tot"><span>Subtotal</span><span id="cartTot">$0</span></div>
  <div class="ind-actions"><button type="button" class="ind-btn" id="cartGo">Checkout</button><button type="button" class="ind-btn alt" id="cartClear">Clear cart</button></div></div>
<p class="ind-toast" role="status" aria-live="polite"></p>'''
    return frame("sample-shop.com", body, "shopDemo")

# ---------------------------------------------------------------- LOCAL
def local_demo():
    data = {"services": [
        {"mode": "quote", "title": "Request a quote in {loc}", "text": "Send a few details and a photo. The business replies with an estimate before anything is scheduled.", "cta": "Request a quote"},
        {"mode": "quote", "title": "Get an installation quote in {loc}", "text": "Describe the job and timeline so the business can scope it and follow up.", "cta": "Request a quote"},
        {"mode": "book", "title": "Book a visit in {loc}", "text": "For routine, standard-scope visits, choose a day and time that works.", "cta": "Choose a time"}]}
    svc = ["Repair", "Installation", "Seasonal check-up"]
    locs = [("kissimmee", "Kissimmee"), ("stcloud", "St. Cloud"), ("orlando", "Orlando"), ("other", "Somewhere else")]
    so = "".join(f"<option value='{i}'>{s}</option>" for i, s in enumerate(svc))
    lo = "".join(f"<option value='{v}'>{n}</option>" for v, n in locs)
    body = f'''<div class="ind-top"><div class="ind-brand">Sample Home Services<b>.</b></div><span class="ind-note">Sample business</span></div>
<div class="ind-pickers"><label class="ind-field">What do you need?<select id="svcSel">{so}</select></label>
<label class="ind-field">Where are you?<select id="locSel">{lo}</select></label></div>
<div class="ind-split">
  <div class="ind-box" aria-live="polite"><span class="ind-mode" id="outMode">Quote request</span><h3 id="outTitle">Request a quote in Kissimmee</h3>
    <p id="outText" style="font-size:14px;color:#364055;line-height:1.55">Send a few details and a photo. The business replies with an estimate before anything is scheduled.</p>
    <div class="ind-actions"><button type="button" class="ind-btn" id="outPrimary" data-demo-msg>Request a quote</button><button type="button" class="ind-btn alt" data-demo-msg>Call now</button></div></div>
  <div class="ind-box"><h4>Always visible on a phone</h4><ul><li>Services and service area</li><li>One-tap call button</li><li>Hours and how to reach you</li></ul>
    <div class="ind-trust" aria-label="Trust signals"><span>Real reviews</span><span>Photos of real work</span><span>Verified credentials</span></div></div>
</div>
<script type="application/json" id="localData">{json.dumps(data)}</script>
<p class="ind-toast" role="status" aria-live="polite"></p>'''
    return frame("sample-home-services.com", body, "localDemo")

# ---------------------------------------------------------------- PAGE CONTENT
PAGES = [
 dict(slug="law-firms", label="Law Firms", demo=law_demo, cta="Discuss your firm’s website",
  title="Law Firm Websites | Ascend",
  desc="Website design for law firms: clear practice area pages, attorney credibility, English and Spanish options, and easy consultation requests.",
  h1="Make it easier for the right clients to trust you and reach out.",
  intro="Help visitors understand what you handle, get to know your firm, and take the next step—with clear practice area pages, professional design, and straightforward contact options.",
  demo_label="Try a sample law firm site", demo_note="Switch practice areas and language. Sample content.",
  bh="What a strong law firm site does",
  benefits=[("Clear practice areas", "Help visitors quickly understand whether your firm handles their situation."),
            ("Credibility that feels personal", "Bring together attorney profiles, approved reviews, and a professional presentation."),
            ("English and Spanish options", "Make important information accessible in both languages when needed."),
            ("A clear next step", "Make calling or requesting a consultation easy throughout the site.")],
  proj=dict(h="Law Offices of Ingrid Morfa", sub="Kissimmee, FL · AbogadaUS.com", img="assets/cases/abogadaus-home.jpg", alt="AbogadaUS.com homepage",
            pts=["Bilingual site navigation in English and Spanish", "Click-to-call phone number and a contact form", "Audited with Ascend’s SEO system"],
            href="case-study-abogadaus", link="View the project"),
  close_h="Let’s talk about your firm’s website.", close_p="Tell us about your practice and how clients find you today."),
 dict(slug="course-education", label="Courses &amp; Education", demo=course_demo, cta="Discuss your course platform",
  title="Course & Education Websites | Ascend",
  desc="Course website design that connects your sales page, enrollment, and learning experience so students can buy and keep learning.",
  h1="Make your course easy to buy—and easy to keep learning.",
  intro="Connect your course sales page, checkout, and learning experience so students can understand the value, enroll, and find their next lesson.",
  demo_label="Walk through a sample course", demo_note="Overview, enroll, learn. Sample content, no payment.",
  bh="Built around the student",
  benefits=[("Show what students will learn", "Present the curriculum and a useful lesson preview."),
            ("Straightforward enrollment", "Keep pricing, checkout, and account access easy to understand."),
            ("Organized learning", "Give students a clear dashboard with lessons and progress."),
            ("Built for your audience", "Support mobile use, accessible navigation, and bilingual content when needed.")],
  proj=dict(h="CiudadanoReady", sub="U.S. naturalization test prep · bilingual", img="assets/cases/ciudadanoready-home.jpg", alt="CiudadanoReady.com homepage",
            pts=["Seven-stage course from Welcome to the Oath Ceremony", "English and Spanish interface", "One-time online enrollment through Stripe"],
            href="case-study-ciudadanoready", link="View the project"),
  close_h="Let’s plan your course platform.", close_p="Share what you teach and who it is for."),
 dict(slug="ecommerce-solutions", label="E-Commerce", demo=shop_demo, cta="Discuss your online store",
  title="E-Commerce Website Design | Ascend",
  desc="Online store design that helps customers find products, understand the details, and move confidently toward checkout.",
  h1="Make finding the right product feel effortless.",
  intro="Build a shopping experience that helps customers explore your products, understand the details, and move confidently toward checkout.",
  demo_label="Browse a sample storefront", demo_note="Filter, pick options, add to cart. Demonstration only, nothing is purchased.",
  bh="Built around how people shop",
  benefits=[("Easy product discovery", "Organize collections, search, and filters around how customers shop."),
            ("Product pages that answer questions", "Present useful images, options, sizing, shipping, and other relevant details."),
            ("A smooth purchase path", "Make selecting products and moving to checkout straightforward."),
            ("Practical store management", "Connect inventory, orders, and the tools the business needs.")],
  proj=None, close_h="Let’s plan your online store.", close_p="Tell us what you sell and how you want to sell it."),
 dict(slug="local-service", label="Local Services", demo=local_demo, cta="Discuss your service business",
  title="Local Service Business Websites | Ascend",
  desc="Websites for local service businesses: clear services and coverage, easy calls and quote requests, and trust signals that work on a phone.",
  h1="Help nearby customers find you and take the next step.",
  intro="Make your services, coverage area, and contact options clear so people can quickly decide whether you’re the right business for the job.",
  demo_label="Try a sample service business", demo_note="Pick a service and location. Sample business, nothing is sent.",
  bh="Made for people searching nearby",
  benefits=[("Clear services and coverage", "Explain what you do and where you work."),
            ("Easy calls and quote requests", "Give visitors a simple way to get in touch."),
            ("Useful trust signals", "Highlight authentic reviews, real work, and verified credentials."),
            ("Designed for mobile visitors", "Make essential information and contact actions easy to use on a phone.")],
  proj=None, close_h="Let’s talk about your service business.", close_p="Tell us what you offer and where you work."),
]

def build(p):
    desc = p["desc"]; url = f"https://www.hqascend.com/{p['slug']}"
    ben = "".join(f'<div class="why-item"><div class="mark">{CHECK}</div><div><h3>{e(t)}</h3><p>{e(d)}</p></div></div>' for t, d in p["benefits"])
    pj = p["proj"]; proj = ""
    if pj:
        li = "".join(f"<li>{e(x)}</li>" for x in pj["pts"])
        proj = f'''<section class="ind-proj-sec"><div class="wrap reveal"><div class="eyebrow" style="margin-top:0">Project example</div><h2>See it in a real project.</h2>
<div class="ind-proj"><a href="{pj['href']}" aria-label="{e(pj['h'])} case study"><img src="{pj['img']}" alt="{e(pj['alt'])}" width="1800" height="{921 if 'abogada' in pj['img'] else 820}" loading="lazy"></a>
<div><h3>{e(pj['h'])}</h3><div class="sub">{e(pj['sub'])}</div><ul>{li}</ul><a href="{pj['href']}" class="btn-ghost">{pj['link']} →</a></div></div></div></section>'''
    ld = json.dumps({"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "name": p["title"], "url": url, "description": desc},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.hqascend.com/"},
            {"@type": "ListItem", "position": 2, "name": re.sub("&amp;", "&", p["label"]), "item": url}]}]})
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(p['title'])}</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/brand/favicon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="https://hqascend.com/assets/brand/og-image.jpg">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p['title'])}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="https://hqascend.com/assets/brand/og-image.jpg">
<script type="application/ld+json">{ld}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared.css?v=7">
<link rel="stylesheet" href="industry.css?v=1">
</head>
<body>
<div class="ascend-line"><div class="ascend-fill" id="ascendFill"></div></div>
{nav}
{mob}
<header class="page-header ind-head">
  <div class="wrap">
    <div class="eyebrow">Solutions · {p['label']}</div>
    <h1>{e(p['h1'])}</h1>
    <p>{e(p['intro'])}</p>
    <div class="ind-cta-row"><a href="{CAL}" class="btn-primary" target="_blank" rel="noopener">{e(p['cta'])}</a><a href="#demo" class="btn-ghost">See how it works ↓</a></div>
  </div>
</header>
<section class="ind-demo-sec" id="demo"><div class="wrap">
  <div class="ind-label"><b>Demonstration</b><span>{e(p['demo_note'])}</span></div>
  {p['demo']()}
</div></section>
<section class="ind-benefits"><div class="wrap reveal"><h2>{e(p['bh'])}</h2><div class="why-grid" style="margin-top:22px">{ben}</div></div></section>
{proj}
<section id="cta"><div class="wrap reveal ind-close">
  <h2 class="section-title" style="margin:0 auto;">{e(p['close_h'])}</h2><p>{e(p['close_p'])}</p>
  <div class="hero-ctas" style="justify-content:center; margin-top:26px;"><a href="{CAL}" class="btn-primary" target="_blank" rel="noopener">{e(p['cta'])}</a></div>
</div></section>
{foot}
<script src="script.js?v=3"></script>
<script src="industry.js?v=1" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
'''

for p in PAGES:
    (root / f"{p['slug']}.html").write_text(build(p))
    print("built", p["slug"])
