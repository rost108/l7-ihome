#!/usr/bin/env python3
"""Статичні SEO-сторінки моделей: content.json + model.html -> /<slug>/index.html.

Пошуковики й соцмережі отримують готовий HTML (title, опис, H1, характеристики, фото,
розмітку Product/BreadcrumbList), а скрипт сторінки далі оновлює її з content.json,
тож правки з адмінки видно відвідувачам одразу. Після змін моделей в адмінці
перезапустити: python3 tools/build_pages.py
"""
import html, json, os, re, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://rost108.github.io/l7-ihome/"
e = lambda s: html.escape(str(s or ""), quote=True)


def img_size(path):
    try:
        from PIL import Image
        with Image.open(os.path.join(ROOT, path)) as im:
            return im.size
    except Exception:
        return (1500, 837)


def area_txt(m):
    v = (m.get("stat1Value") or "").replace(".", ",")
    return f"{v} м²" if v else ""


def build(m, items, tpl):
    slug, name = m["slug"], m["name"]
    url = SITE + slug + "/"
    img = SITE + m["img"]
    w, h = img_size(m["img"])
    area, guests = area_txt(m), (m.get("stat2Value") or "").replace(" ", "")
    title = f"{name} — капсульний будинок {area} під ключ | L7 iHOME".replace("  ", " ")
    up = int(re.findall(r"\d+", guests)[-1]) if re.findall(r"\d+", guests) else 0
    gword = "гості" if up % 10 in (2, 3, 4) and up % 100 not in (12, 13, 14) else "гостей"
    first = re.split(r"(?<=[.!?])\s", (m.get("desc") or "").strip())[0]
    facts = ", ".join(x for x in [area, guests and f"{guests} {gword}"] if x)
    desc = f"{name}: {facts}. {first} Фото, характеристики й прорахунок під ключ."
    if len(desc) > 160:
        desc = f"{name}: {facts}. {first} Прорахунок під ключ."
    desc = re.sub(r"\s+", " ", desc).strip()

    s = tpl
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="../">', 1)
    s = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", s, 1, re.S)
    s = re.sub(r'(id="seoDesc" content=")[^"]*', lambda x: x.group(1) + e(desc), s, 1)
    s = re.sub(r'(id="seoCanonical" href=")[^"]*', lambda x: x.group(1) + url, s, 1)
    s = re.sub(r'(id="seoOgTitle" content=")[^"]*', lambda x: x.group(1) + e(f"{name} — L7 iHOME"), s, 1)
    s = re.sub(r'(id="seoOgDesc" content=")[^"]*', lambda x: x.group(1) + e(desc), s, 1)
    s = re.sub(r'(id="seoOgUrl" content=")[^"]*', lambda x: x.group(1) + url, s, 1)
    s = re.sub(r'(id="seoOgImage" content=")[^"]*', lambda x: x.group(1) + img, s, 1)
    s = re.sub(r'(id="seoTwTitle" content=")[^"]*', lambda x: x.group(1) + e(f"{name} — L7 iHOME"), s, 1)
    s = re.sub(r'(id="seoTwImage" content=")[^"]*', lambda x: x.group(1) + img, s, 1)
    s = re.sub(r'(id="seoAlt" href=")[^"]*', lambda x: x.group(1) + url, s, 1)
    s = re.sub(r'(og:image:width" content=")\d+', lambda x: x.group(1) + str(w), s, 1)
    s = re.sub(r'(og:image:height" content=")\d+', lambda x: x.group(1) + str(h), s, 1)
    s = s.replace('<meta name="twitter:card"', f'<meta name="twitter:description" content="{e(desc)}">\n  <meta property="og:image:alt" content="{e(name)} — капсульний будинок L7 iHOME">\n  <meta name="twitter:card"', 1)

    photos = [m["img"]] + list(m.get("gallery") or [])
    ld = [
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Головна", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Моделі", "item": SITE + "#models"},
            {"@type": "ListItem", "position": 3, "name": name, "item": url}]},
        {"@context": "https://schema.org", "@type": "Product", "name": name, "sku": m.get("code"),
         "url": url, "image": [SITE + p for p in photos], "description": m.get("desc", ""),
         "category": "Капсульні будинки", "brand": {"@type": "Brand", "name": "L7 iHOME"},
         "manufacturer": {"@type": "Organization", "name": "L7 iHOME", "url": SITE},
         "additionalProperty": [{"@type": "PropertyValue", "name": m.get("stat1Label") or "Корисна площа", "value": area},
                                {"@type": "PropertyValue", "name": m.get("stat2Label") or "Гостей", "value": guests}] +
                               [{"@type": "PropertyValue", "name": r["k"], "value": (r.get("v", "") + (" " + r["unit"] if r.get("unit") else ""))} for r in m.get("rows") or []]},
    ]
    ld_html = "".join(f'\n  <script type="application/ld+json" data-ld="product">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    s = s.replace("</head>", ld_html + "\n</head>", 1)

    # тіло: готовий вміст (скрипт потім перезапише тими самими даними)
    s = s.replace("<body", f'<body data-slug="{e(slug)}"', 1)
    s = s.replace('<span class="here" id="crumbName">Капсула</span>', f'<span class="here" id="crumbName">{e(name)}</span>', 1)
    s = s.replace('<span class="badge badge--ink" id="pCode"></span>', f'<span class="badge badge--ink" id="pCode">{e(m.get("code"))}</span>', 1)
    if m.get("tag"):
        s = s.replace('<span class="badge badge--brand" id="pTag" hidden></span>', f'<span class="badge badge--brand" id="pTag">{e(m["tag"])}</span>', 1)
    s = s.replace(f'<img id="pImg" src="" alt="" width="1500" height="837"', f'<img id="pImg" src="{e(m["img"])}" alt="{e(name)} — капсульний будинок L7 iHOME" width="{w}" height="{h}"', 1)
    for i in (1, 2):
        if m.get(f"callout{i}"):
            s = s.replace(f'id="pCallout{i}" hidden></span>', f'id="pCallout{i}">{e(m["callout" + str(i)])}</span>', 1)
    s = s.replace('<h1 id="pName">Капсула</h1>', f'<h1 id="pName">{e(name)}</h1>', 1)
    s = s.replace('<p class="desc" id="pDesc"></p>', f'<p class="desc" id="pDesc">{e(m.get("desc"))}</p>', 1)
    unit = f' <small>{e(m["stat1Unit"])}</small>' if m.get("stat1Unit") else ""
    s = s.replace('<div class="val" id="pStat1Value"></div>', f'<div class="val" id="pStat1Value">{e(m.get("stat1Value"))}{unit}</div>', 1)
    s = s.replace('<div class="val" id="pStat2Value"></div>', f'<div class="val" id="pStat2Value">{e(m.get("stat2Value"))}</div>', 1)
    rows = "".join(f'<div class="spec-row"><span class="k">{e(r["k"])}</span><span class="v">{e(r.get("v"))}' + (f'<small>{e(r["unit"])}</small>' if r.get("unit") else "") + "</span></div>" for r in m.get("rows") or [])
    s = s.replace('<div id="pRows"></div>', f'<div id="pRows">{rows}</div>', 1)
    if len(photos) > 1:
        gal = "".join(f'<button type="button" data-p="{e(p)}"' + (' class="active"' if i == 0 else "") + f'><img src="{e(p)}" alt="{e(name)} — вигляд {i + 1}" loading="lazy" decoding="async"></button>' for i, p in enumerate(photos))
        s = s.replace('<div class="gallery" id="pGallery" hidden></div>', f'<div class="gallery" id="pGallery">{gal}</div>', 1)
    others = "".join(
        f'<a class="model-card" style="display:block" href="{e(o["slug"])}/"><div class="model-figure"><div class="badges"><span class="badge badge--ink">{e(o["code"])}</span>'
        + (f'<span class="badge badge--brand">{e(o["tag"])}</span>' if o.get("tag") else "")
        + f'</div><img loading="lazy" decoding="async" src="{e(o["img"])}" alt="{e(o["name"])}"></div><div class="model-body"><div class="name">{e(o["name"])}</div><div class="meta">{e(o.get("meta"))}</div></div></a>'
        for o in items if o is not m)
    s = s.replace('<div class="lineup-grid" id="otherModels"></div>', f'<div class="lineup-grid" id="otherModels">{others}</div>', 1)
    s = re.sub(r"<!-- redirect:start -->.*?<!-- redirect:end -->\s*", "", s, flags=re.S)
    os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
    open(os.path.join(ROOT, slug, "index.html"), "w").write(s)
    return url, photos


def sitemap(pages):
    today = date.today().isoformat()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
           f'  <url>\n    <loc>{SITE}</loc>\n    <lastmod>{today}</lastmod>\n    <image:image><image:loc>{SITE}assets/capsule-360.jpg</image:loc></image:image>\n  </url>']
    for url, photos in pages:
        imgs = "".join(f"\n    <image:image><image:loc>{SITE}{p}</image:loc></image:image>" for p in photos)
        out.append(f"  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>{imgs}\n  </url>")
    out.append("</urlset>\n")
    open(os.path.join(ROOT, "sitemap.xml"), "w").write("\n".join(out))


if __name__ == "__main__":
    content = json.load(open(os.path.join(ROOT, "content.json")))
    items = content["models"]["items"]
    tpl = open(os.path.join(ROOT, "model.html")).read()
    pages = [build(m, items, tpl) for m in items]
    sitemap(pages)
    print("built:", ", ".join(u for u, _ in pages))
