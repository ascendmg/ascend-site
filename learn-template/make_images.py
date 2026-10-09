#!/usr/bin/env python3
"""Generates 1200x630 featured/OG images for each article from articles.json (brand colours, category motif).
Run:  python3 make_images.py   (needs Pillow)"""
import json, pathlib, textwrap
from PIL import Image, ImageDraw, ImageFont
here = pathlib.Path(__file__).parent; root = here.parent
cfg = json.loads((here / "articles.json").read_text())
CATS = {c["slug"]: c["name"] for c in cfg["categories"]}
S = 2; W, H = 1200 * S, 630 * S
INK = (22, 20, 42); MUTED = (93, 89, 107); BG = (250, 248, 245)
ACC = {"web-design": (99, 102, 241), "seo": (168, 85, 247), "marketing": (236, 72, 153)}
FB = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"; FM = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
def font(p, s): return ImageFont.truetype(p, s * S)
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient(w, h, c1, c2, c3):
    g = Image.new("RGB", (w, h)); px = g.load()
    for x in range(w):
        t = x / (w - 1); c = lerp(c1, c2, t * 2) if t < .5 else lerp(c2, c3, (t - .5) * 2)
        for y in range(h): px[x, y] = c
    return g

def rr(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle([v * S for v in box], r * S, fill=fill, outline=outline, width=width * S)

def motif(d, cat):
    a = ACC[cat]
    if cat == "marketing":   # customer journey: 4 nodes on a line
        xs = [700, 820, 940, 1060]; y = 300
        d.line([(xs[0] * S, y * S), (xs[-1] * S, y * S)], fill=(225, 220, 240), width=6 * S)
        for i, x in enumerate(xs):
            r = 34
            d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=lerp((99, 102, 241), (236, 72, 153), i / 3), outline=(255, 255, 255), width=5 * S)
            d.text((x * S, y * S), str(i + 1), font=font(FB, 30), fill=(255, 255, 255), anchor="mm")
        for i, lab in enumerate(["Discover", "Visit", "Inquire", "Customer"]):
            d.text((xs[i] * S, (y + 66) * S), lab, font=font(FM, 17), fill=MUTED, anchor="mm")
    elif cat == "web-design":  # before/after browser
        for k, (x, lab) in enumerate([(640, "Before"), (880, "After")]):
            rr(d, (x, 190, x + 215, 400), 16, fill=(255, 255, 255), outline=(225, 220, 240), width=2)
            d.rectangle([(x + 2) * S, 192 * S, (x + 213) * S, 218 * S], fill=(243, 241, 248))
            for j in range(3): d.ellipse([(x + 14 + j * 14) * S, 201 * S, (x + 22 + j * 14) * S, 209 * S], fill=(217, 213, 230))
            if k == 0:
                for j, w_ in enumerate([170, 120, 150, 90, 160]): rr(d, (x + 18, 236 + j * 16, x + 18 + w_ * .9, 242 + j * 16), 3, fill=(216, 214, 222))
                rr(d, (x + 18, 350, x + 62, 366), 3, fill=(207, 207, 216))
            else:
                rr(d, (x + 18, 238, x + 190, 252), 6, fill=INK); rr(d, (x + 18, 260, x + 150, 270), 5, fill=(216, 214, 222))
                rr(d, (x + 18, 290, x + 130, 318), 14, fill=a)
                for j in range(3): rr(d, (x + 18 + j * 60, 340, x + 66 + j * 60, 350), 4, fill=(220, 224, 250))
            d.text(((x + 108) * S, 424 * S), lab, font=font(FM, 18), fill=MUTED, anchor="mm")
    else:  # seo: results page
        rr(d, (640, 170, 1100, 440), 20, fill=(255, 255, 255), outline=(225, 220, 240), width=2)
        rr(d, (664, 192, 1076, 226), 17, fill=(243, 241, 248))
        d.ellipse([678 * S, 201 * S, 694 * S, 217 * S], outline=a, width=3 * S); d.line([(692 * S, 215 * S), (700 * S, 223 * S)], fill=a, width=3 * S)
        for j, (tag, col) in enumerate([("Ad", (192, 36, 111)), ("Map", (42, 143, 196)), ("Organic", (75, 79, 208))]):
            y = 246 + j * 62
            rr(d, (664, y, 1076, y + 52), 12, outline=(232, 228, 242), width=2)
            rr(d, (676, y + 10, 676 + 18 + len(tag) * 8, y + 28), 9, fill=col)
            d.text((685 * S, (y + 19) * S), tag, font=font(FB, 11), fill=(255, 255, 255), anchor="lm")
            rr(d, (676, y + 34, 960, y + 40), 3, fill=(216, 214, 222))

def make(a, og=True):
    cat = a["category"]; c = ACC[cat]
    img = Image.new("RGB", (W, H), BG)
    glow = gradient(W // 4, H // 4, (99, 102, 241), (168, 85, 247), (236, 72, 153)).resize((W, H))
    mask = Image.new("L", (W, H), 0); md = ImageDraw.Draw(mask)
    md.ellipse([W * .45, -H * .5, W * 1.25, H * .6], fill=70)
    from PIL import ImageFilter
    mask = mask.filter(ImageFilter.GaussianBlur(120 * S)); img.paste(glow, (0, 0), mask)
    d = ImageDraw.Draw(img)
    if not og:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); motif(ImageDraw.Draw(layer), cat)
        box = (600 * S, 140 * S, 1130 * S, 470 * S); crop = layer.crop(box)
        f = 1.55; crop = crop.resize((int(crop.width * f), int(crop.height * f)), Image.LANCZOS)
        img.paste(crop, ((W - crop.width) // 2, (H - crop.height) // 2 - 10 * S), crop)
        d.rectangle([0, 0, 14 * S, H], fill=c)
        out = root / a["image"]; out.parent.mkdir(parents=True, exist_ok=True)
        img.resize((1200, 630), Image.LANCZOS).save(out, optimize=True); print("wrote", out.name, out.stat().st_size // 1024, "KB"); return
    d.rectangle([0, 0, 14 * S, H], fill=c)
    # category pill
    label = CATS[cat].upper(); f = font(FB, 20)
    tw = d.textlength(label, font=f)
    rr(d, (72, 72, 72 + tw / S + 40, 116), 22, fill=tuple(int(255 - (255 - v) * .14) for v in c))
    d.text((92 * S, 94 * S), label, font=f, fill=tuple(int(v * .8) for v in c), anchor="lm")
    # title
    tf = font(FB, 52); lines = []; cur = ""
    for wd in a["title"].split():
        t = (cur + " " + wd).strip()
        if d.textlength(t, font=tf) / S > 500 and cur: lines.append(cur); cur = wd
        else: cur = t
    lines.append(cur)
    for i, ln in enumerate(lines[:6]): d.text((72 * S, (160 + i * 64) * S), ln, font=tf, fill=INK, anchor="la")
    d.text((72 * S, 548 * S), "Ascend  |  Learn", font=font(FM, 24), fill=MUTED, anchor="la")
    motif(d, cat)
    out = root / a["image"].replace(".png", "-og.png"); out.parent.mkdir(parents=True, exist_ok=True)
    img.resize((1200, 630), Image.LANCZOS).save(out, optimize=True); print("wrote", out.name, out.stat().st_size // 1024, "KB")

for a in cfg["articles"]: make(a, og=True); make(a, og=False)
