"""Reusable in-article widgets. Each returns crawlable HTML; learn.js only enhances it."""

def journey():
    steps = [
      ("Discovery", "Someone has a need and finds you through search, maps, social media or a referral.",
       "Leaks: not showing up where they look, or an incomplete listing.", "Helps: SEO, a complete Google Business Profile, reviews, ads."),
      ("Website visit", "They check you out before committing. This is the trust moment.",
       "Leaks: slow or confusing pages, nothing that shows you're credible.", "Helps: a clear headline, proof, fast mobile pages."),
      ("Inquiry", "They call, book or send a message.",
       "Leaks: no obvious next step, long forms, hidden phone number.", "Helps: one clear action, tappable phone number, short forms."),
      ("Customer", "You respond and they buy or hire you.",
       "Leaks: slow replies, unclear pricing, no follow-up.", "Helps: quick responses, a clear next step, a follow-up routine."),
    ]
    items = "".join(f'''<li class="lw-step"><button type="button" class="lw-stepbtn" aria-expanded="{'true' if i==0 else 'false'}"><span class="lw-n">{i+1}</span><span class="lw-t">{t}</span></button>
      <div class="lw-detail"><p>{d}</p><p class="lw-leak">{l}</p><p class="lw-help">{h}</p></div></li>''' for i,(t,d,l,h) in enumerate(steps))
    return f'''<figure class="lw journey" data-widget="journey">
  <figcaption class="lw-cap">The customer journey: where marketing helps at each step. Select a step.</figcaption>
  <div class="lw-rail" aria-hidden="true"><span class="lw-dot"></span></div>
  <ol class="lw-steps">{items}</ol>
</figure>'''

def beforeafter():
    notes = [
      ("Clear headline", "Says what you do and where, instead of a generic welcome."),
      ("One obvious action", "A visible button replaces tiny links and competing calls to action."),
      ("Fewer menu items", "A short, plain menu is easier to scan, especially on a phone."),
      ("Proof near the top", "Reviews or credentials appear before the visitor has to ask."),
      ("Contact details up front", "The phone number is where people expect it, and it's tappable on mobile."),
    ]
    li = "".join(f"<li><strong>{a}.</strong> {b}</li>" for a,b in notes)
    return f'''<figure class="lw ba" data-widget="ba" data-state="after">
  <figcaption class="lw-cap">A simplified before-and-after of a fictional business website. Toggle to compare.</figcaption>
  <div class="ba-ctl" role="group" aria-label="Compare versions"><button type="button" data-s="before" aria-pressed="false">Before</button><button type="button" data-s="after" aria-pressed="true">After</button></div>
  <div class="ba-stage">
    <div class="ba-pane ba-before" aria-label="Before: cluttered homepage">
      <span class="ba-tag">Before</span>
      <div class="old-nav"><b>Smith &amp; Sons</b><span>Home | About | Services | Gallery | Links | FAQ | Contact | Blog | Staff</span></div>
      <div class="old-banner">WELCOME TO OUR WEBSITE!!!</div>
      <div class="old-cols"><div class="old-text"><i style="width:96%"></i><i style="width:88%"></i><i style="width:93%"></i><i style="width:70%"></i><i style="width:90%"></i></div>
      <div class="old-side"><span>Click here</span><span>Read more</span><span>Sign up</span></div></div>
      <div class="old-foot"><span class="tiny-btn">submit</span><small>Phone number is in the footer, somewhere.</small></div>
    </div>
    <div class="ba-pane ba-after" aria-label="After: clear homepage">
      <span class="ba-tag ba-tag-a">After</span>
      <div class="mk-nav"><b>Smith &amp; Sons Plumbing</b><span>Services &nbsp; Reviews &nbsp; Contact</span><em>(555) 010-0123</em></div>
      <div class="mk-hero"><div class="mk-h">Fast, reliable plumbing in Kissimmee.</div><p>Same-day appointments. Upfront pricing.</p><span class="mk-btn">Call or book online</span></div>
      <div class="mk-proof"><span>Licensed &amp; insured</span><span>Rated by local customers</span><span>Works on mobile</span></div>
    </div>
  </div>
  <ol class="ba-notes">{li}</ol>
  <p class="lw-fine">Illustration with a fictional business. Your results depend on your market, offer and traffic.</p>
</figure>'''

def serp():
    return '''<figure class="lw serp" data-widget="serp">
  <figcaption class="lw-cap">A simplified search results page for a fictional local search. Select a section to see how it gets there.</figcaption>
  <div class="sp-page">
    <div class="sp-search"><span>emergency plumber near me</span></div>
    <button type="button" class="sp-region sp-ad" data-r="ad" aria-pressed="false">
      <span class="sp-chip">Paid</span>
      <span class="sp-adlabel"><b>Sponsored</b> &middot; examplepipes.com</span>
      <span class="sp-title">Example Pipes: 24/7 Emergency Plumber</span>
      <span class="sp-desc">Call now for fast service. Licensed and insured.</span>
    </button>
    <button type="button" class="sp-region sp-map" data-r="map" aria-pressed="false">
      <span class="sp-chip">Local</span>
      <span class="sp-mapview" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="sp-pack"><span><b>Sample Plumbing Co.</b> 4.8 &#9733; &middot; Open now</span><span><b>Demo Drain Experts</b> 4.6 &#9733; &middot; Open 24 hours</span><span><b>Placeholder Pipe &amp; Heat</b> 4.9 &#9733; &middot; Closes 6 PM</span></span>
    </button>
    <button type="button" class="sp-region sp-org" data-r="org" aria-pressed="false">
      <span class="sp-chip">Organic</span>
      <span class="sp-url">sampleplumbing.example &rsaquo; emergency-plumber</span>
      <span class="sp-title">Emergency Plumber: What to Do Before We Arrive</span>
      <span class="sp-desc">Shut-off steps, what counts as an emergency, and how to reach a licensed plumber fast.</span>
    </button>
  </div>
  <div class="sp-info" aria-live="polite">
    <div class="sp-note" data-r="ad"><strong>Sponsored (paid).</strong> Businesses pay per click to appear here. It's fast and controllable, and it stops when the budget stops. Learn more in our <a href="/marketing">marketing service</a>.</div>
    <div class="sp-note" data-r="map"><strong>Local map results.</strong> Driven largely by a complete Google Business Profile, reviews, relevance and how close the business is to the searcher. This is local SEO.</div>
    <div class="sp-note" data-r="org"><strong>Organic results.</strong> Earned by having helpful, well-structured pages on a technically sound, trusted site. There's no per-click fee, but it takes time and ongoing work.</div>
  </div>
  <p class="lw-fine">Illustration only. Real results pages vary by search, location and device, and all business names here are fictional.</p>
</figure>'''

def _check(key, groups):
    out = []
    n = 0
    for g, items in groups:
        li = ""
        for it in items:
            n += 1
            li += f'<li><label><input type="checkbox" data-i="{n}"><span>{it}</span></label></li>'
        out.append(f'<div class="ck-group"><h3>{g}</h3><ul>{li}</ul></div>')
    return f'''<div class="lw checklist" data-widget="checklist" data-key="{key}">
  <div class="ck-top"><strong class="ck-count" aria-live="polite">0 of {n} complete</strong><div class="ck-bar" aria-hidden="true"><i></i></div><button type="button" class="ck-reset">Reset</button></div>
  {''.join(out)}
</div>'''

def checklist_web():
    return _check("web", [
     ("First impression", ["The headline says what you do and where, within a few seconds.", "Photos are real (your work, team or location), not generic stock.", "You can tell at a glance what to do next: call, book or buy."]),
     ("Trust", ["Reviews, credentials or examples of your work are visible.", "Your phone number, address and hours are easy to find and current.", "There are no dead links, old dates or placeholder text."]),
     ("Mobile and speed", ["Text is readable on a phone without zooming.", "Buttons are easy to tap, and the phone number is tappable.", "Pages load in a few seconds on a mobile connection (test with Google PageSpeed Insights).", "There's no sideways scrolling and no pop-up covering the content."]),
     ("Clarity and conversion", ["The menu has about five to seven plain-language items.", "Each page has one main action.", "Forms are short and you've tested that they actually reach you."]),
     ("Basics", ["The site uses HTTPS (the padlock in the address bar).", "Each page has a unique, descriptive title.", "Analytics or call and form tracking is set up, so you can see what's working."]),
    ])

def checklist_seo():
    return _check("seo", [
     ("Foundation", ["Your site uses HTTPS and works well on mobile.", "Pages load reasonably fast.", "Google Search Console is set up and a sitemap is submitted.", "Important pages aren't accidentally blocked from search (check for \"noindex\" settings)."]),
     ("On-page", ["Each main service has its own page.", "Every page has a unique title and meta description.", "Each page has one clear H1 and logical subheadings.", "Images have descriptive alt text.", "Related pages link to each other with descriptive link text."]),
     ("Local", ["Your Google Business Profile is claimed and complete.", "Your business name, address and phone are consistent everywhere.", "You ask customers for reviews and respond to them.", "Your pages clearly state the areas you serve."]),
     ("Content and reputation", ["Your pages answer questions customers actually ask.", "There are no thin or near-duplicate pages.", "You're listed in relevant directories and local organizations."]),
     ("Measurement", ["You track organic visits, calls and form submissions.", "You review Search Console at least monthly.", "You judge progress over months, not days."]),
    ])

REGISTRY = {"journey": journey, "beforeafter": beforeafter, "serp": serp, "checklist-web": checklist_web, "checklist-seo": checklist_seo}
