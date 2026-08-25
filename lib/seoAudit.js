/**
 * Ascend SEO Audit Engine
 * ------------------------
 * Fetches a single page's HTML and runs a set of technical/on-page checks
 * against it, then computes category scores (0-100) and an overall score.
 *
 * Honesty notes (read before wiring this into anything client-facing):
 *
 * - This checks ONE page per call. A real site audit means calling this
 *   for every URL in the sitemap and aggregating. That loop isn't built
 *   yet, this is the per-page unit it would run.
 *
 * - "Authority" (backlinks, domain rating) is NOT computed here. That
 *   requires a paid third-party data source (Ahrefs, Moz, Semrush, etc.).
 *   There is no free reliable way to get real backlink data. Until Ascend
 *   subscribes to one of those, authority_score should stay null, not a
 *   fabricated number.
 *
 * - "Local SEO" score here only checks on-page local signals (NAP text
 *   presence, local schema). It does NOT check Google Business Profile
 *   status, review counts, or citation consistency, those need the GBP
 *   API and citation-tracking tools, neither of which are connected yet.
 *
 * - Page speed / Core Web Vitals are NOT computed here. That requires the
 *   Google PageSpeed Insights API (free, but a separate call with its own
 *   quota). Left as a separate function stub below so it's not silently
 *   skipped or faked.
 */

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AscendSEOAuditBot/1.0' },
    redirect: 'follow',
  });
  const html = await res.text();
  return {
    status: res.status,
    finalUrl: res.url,
    redirected: res.redirected,
    html,
  };
}

function extract(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractAll(html, regex) {
  return [...html.matchAll(regex)].map(m => m[1]);
}

/**
 * Runs all checks against a single fetched page.
 * Returns { checks: [...], categoryScores: {...}, overallScore }
 */
async function auditPage(url) {
  const issues = [];
  const { status, finalUrl, redirected, html } = await fetchPage(url);

  const isHttps = finalUrl.startsWith('https://');
  if (!isHttps) {
    issues.push({ category: 'technical', issue: 'Page is not served over HTTPS', severity: 'high', page_url: url });
  }

  if (status >= 400) {
    issues.push({ category: 'technical', issue: `Page returned HTTP ${status}`, severity: 'high', page_url: url });
    // Can't meaningfully check content of a page that didn't load
    return finalizeAudit(issues, { loadFailed: true });
  }

  if (redirected) {
    issues.push({ category: 'technical', issue: `Page redirected to ${finalUrl}`, severity: 'low', page_url: url });
  }

  // --- Title tag ---
  const title = extract(html, /<title[^>]*>([^<]*)<\/title>/i);
  if (!title) {
    issues.push({ category: 'onpage', issue: 'Missing <title> tag', severity: 'high', page_url: url });
  } else if (title.length < 15 || title.length > 65) {
    issues.push({ category: 'onpage', issue: `Title tag length is ${title.length} characters (ideal: 15-65)`, severity: 'medium', page_url: url, details: { title } });
  }

  // --- Meta description ---
  const metaDesc = extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || extract(html, /<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  if (!metaDesc) {
    issues.push({ category: 'onpage', issue: 'Missing meta description', severity: 'high', page_url: url });
  } else if (metaDesc.length < 50 || metaDesc.length > 160) {
    issues.push({ category: 'onpage', issue: `Meta description length is ${metaDesc.length} characters (ideal: 50-160)`, severity: 'low', page_url: url });
  }

  // --- H1 ---
  const h1s = extractAll(html, /<h1[^>]*>([^<]*)<\/h1>/gi);
  if (h1s.length === 0) {
    issues.push({ category: 'onpage', issue: 'No <h1> found on page', severity: 'high', page_url: url });
  } else if (h1s.length > 1) {
    issues.push({ category: 'onpage', issue: `Page has ${h1s.length} <h1> tags (should have exactly 1)`, severity: 'medium', page_url: url });
  }

  // --- Canonical tag ---
  const canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (!canonical) {
    issues.push({ category: 'technical', issue: 'Missing canonical tag', severity: 'medium', page_url: url });
  }

  // --- Images missing alt text ---
  const imgTags = extractAll(html, /<img\s[^>]*>/gi);
  const imgsMissingAlt = imgTags.filter(tag => !/alt\s*=\s*["'][^"']+["']/i.test(tag));
  if (imgsMissingAlt.length > 0) {
    issues.push({
      category: 'onpage',
      issue: `${imgsMissingAlt.length} of ${imgTags.length} images missing descriptive alt text`,
      severity: imgsMissingAlt.length > 3 ? 'medium' : 'low',
      page_url: url,
    });
  }

  // --- Open Graph / social tags (basic content completeness signal) ---
  const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  if (!hasOgTitle) {
    issues.push({ category: 'onpage', issue: 'Missing Open Graph title tag (affects link previews)', severity: 'low', page_url: url });
  }

  // --- Structured data (schema.org) ---
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  if (!hasJsonLd) {
    issues.push({ category: 'technical', issue: 'No structured data (JSON-LD schema) found', severity: 'medium', page_url: url });
  }

  // --- Thin content check (very rough word count from visible-ish text) ---
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = textOnly.split(' ').filter(Boolean).length;
  if (wordCount < 300) {
    issues.push({ category: 'content', issue: `Page has approximately ${wordCount} words (thin content, under 300)`, severity: 'medium', page_url: url });
  }

  // --- Local SEO signal (very basic, on-page only) ---
  const hasLocalBusinessSchema = /"@type"\s*:\s*"(LocalBusiness|.*Business.*)"/i.test(html);
  if (!hasLocalBusinessSchema) {
    issues.push({ category: 'local', issue: 'No LocalBusiness structured data found (if this is a local business page)', severity: 'low', page_url: url });
  }

  return finalizeAudit(issues, { title, metaDesc, h1Count: h1s.length, wordCount, imgCount: imgTags.length });
}

/**
 * Checks a site's robots.txt and sitemap.xml, which are per-domain, not
 * per-page, so this runs separately from the page-level audit.
 */
async function auditSiteFiles(baseUrl) {
  const issues = [];
  const origin = new URL(baseUrl).origin;

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`);
    if (robotsRes.status !== 200) {
      issues.push({ category: 'technical', issue: 'robots.txt not found or not reachable', severity: 'medium', page_url: `${origin}/robots.txt` });
    }
  } catch {
    issues.push({ category: 'technical', issue: 'robots.txt request failed', severity: 'medium', page_url: `${origin}/robots.txt` });
  }

  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`);
    if (sitemapRes.status !== 200) {
      issues.push({ category: 'technical', issue: 'sitemap.xml not found or not reachable', severity: 'medium', page_url: `${origin}/sitemap.xml` });
    }
  } catch {
    issues.push({ category: 'technical', issue: 'sitemap.xml request failed', severity: 'medium', page_url: `${origin}/sitemap.xml` });
  }

  return issues;
}

/**
 * Scoring: starts at 100 per category, subtracts points per issue found
 * in that category, weighted by severity. This is a simple, transparent
 * model, not a black box, on purpose, so the numbers can be explained.
 */
const SEVERITY_WEIGHT = { high: 20, medium: 10, low: 4 };

function scoreCategory(issues, category) {
  const relevant = issues.filter(i => i.category === category);
  let score = 100;
  for (const issue of relevant) {
    score -= SEVERITY_WEIGHT[issue.severity] || 5;
  }
  return Math.max(0, score);
}

function finalizeAudit(issues, meta = {}) {
  const technical_score = scoreCategory(issues, 'technical');
  const onpage_score = scoreCategory(issues, 'onpage');
  const content_score = scoreCategory(issues, 'content');
  const local_score = scoreCategory(issues, 'local');
  // Authority is intentionally not scored, see file header notes.
  const authority_score = null;

  const scoredCategories = [technical_score, onpage_score, content_score, local_score];
  const overall_score = Math.round(scoredCategories.reduce((a, b) => a + b, 0) / scoredCategories.length);

  return {
    issues,
    meta,
    scores: {
      overall_score,
      technical_score,
      onpage_score,
      content_score,
      local_score,
      authority_score, // null on purpose, no fabricated number
    },
  };
}

export { auditPage, auditSiteFiles, fetchPage };
