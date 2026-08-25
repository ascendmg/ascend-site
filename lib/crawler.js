/**
 * Ascend SEO Crawler — URL discovery
 * ------------------------------------
 * Given a site's homepage URL, finds every page worth auditing.
 *
 * Strategy:
 *   1. Try /sitemap.xml first. Handle both a direct <urlset> and a
 *      <sitemapindex> that points to sub-sitemaps (recurse one level).
 *   2. If no usable sitemap exists, fall back to a same-origin link
 *      crawl starting from the homepage, breadth-first, capped in
 *      depth and total pages so a bad site can't run away forever.
 *
 * Honesty notes:
 *   - This does not respect crawl-delay or handle JS-rendered sites
 *     that inject links client-side (would need a headless browser
 *     for that, e.g. Playwright, not wired in yet).
 *   - Hard caps below exist specifically so a single audit run can't
 *     hang a serverless function or blow through the 60-second Vercel
 *     execution limit on the Hobby/Pro tiers.
 */

const MAX_PAGES = 40;
const MAX_SITEMAPS_TO_EXPAND = 5;

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'AscendSEOAuditBot/1.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
}

async function discoverFromSitemap(origin) {
  const rootXml = await fetchText(`${origin}/sitemap.xml`);
  if (!rootXml) return null;

  const isIndex = /<sitemapindex/i.test(rootXml);
  if (!isIndex) {
    const urls = extractLocs(rootXml);
    return urls.length > 0 ? urls : null;
  }

  // It's an index — expand a limited number of sub-sitemaps
  const subSitemaps = extractLocs(rootXml).slice(0, MAX_SITEMAPS_TO_EXPAND);
  const allUrls = [];
  for (const sitemapUrl of subSitemaps) {
    const subXml = await fetchText(sitemapUrl);
    if (subXml) allUrls.push(...extractLocs(subXml));
  }
  return allUrls.length > 0 ? allUrls : null;
}

async function discoverFromLinkCrawl(homepageUrl, origin) {
  const visited = new Set();
  const queue = [homepageUrl];
  const found = [];

  while (queue.length > 0 && found.length < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    const html = await fetchText(url);
    if (!html) continue;
    found.push(url);

    const hrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)].map(m => m[1]);
    for (let href of hrefs) {
      try {
        const abs = new URL(href, url).href.split('#')[0];
        if (abs.startsWith(origin) && !visited.has(abs) && queue.length + found.length < MAX_PAGES) {
          queue.push(abs);
        }
      } catch {
        // ignore malformed hrefs
      }
    }
  }
  return found;
}

/**
 * Returns { urls: string[], method: 'sitemap' | 'link-crawl', truncated: boolean }
 */
async function discoverUrls(homepageUrl) {
  const origin = new URL(homepageUrl).origin;

  const sitemapUrls = await discoverFromSitemap(origin);
  if (sitemapUrls) {
    const sameOrigin = [...new Set(sitemapUrls)].filter(u => u.startsWith(origin));
    const capped = sameOrigin.slice(0, MAX_PAGES);
    return { urls: capped, method: 'sitemap', truncated: sameOrigin.length > MAX_PAGES, totalFound: sameOrigin.length };
  }

  const crawled = await discoverFromLinkCrawl(homepageUrl, origin);
  return { urls: crawled, method: 'link-crawl', truncated: crawled.length >= MAX_PAGES, totalFound: crawled.length };
}

export { discoverUrls, MAX_PAGES };
