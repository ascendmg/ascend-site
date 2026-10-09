# Adding a Learn article

1. Add an entry to `articles.json` (copy an existing one): slug, category (web-design, seo or marketing), title, seoTitle, description, dek, cardDescription, updated (YYYY-MM-DD), published (YYYY-MM-DD or null), image path, imageAlt, related slugs, service CTA, optional FAQ.
2. Write the article body in `content/<slug>.html`. Use `<h2>`/`<h3>`, short paragraphs, `<div class="table-wrap"><table>` for comparisons and `<div class="answer">` for the short answer box. Drop in widgets with `<!--widget:journey-->`, `<!--widget:beforeafter-->`, `<!--widget:serp-->`, `<!--widget:checklist-web-->`, `<!--widget:checklist-seo-->` (see `widgets.py` to add more).
3. Run `python3 make_images.py` (featured + social images) then `python3 build.py`.
4. Upload the generated `<slug>.html`, `learn.html`, `sitemap.xml` and `assets/learn/`.

The build script generates: title/meta/canonical/Open Graph, Article + BreadcrumbList (+ FAQPage when FAQ is present) structured data, table of contents from your H2s, reading time, related articles, the hub cards and filters, and the sitemap lastmod.
Only set `published` to a real date. Set `updated` whenever you meaningfully revise an article.
