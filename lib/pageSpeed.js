/**
 * Ascend SEO — Page Speed / Core Web Vitals
 * --------------------------------------------
 * Calls Google's PageSpeed Insights API (Lighthouse under the hood).
 *
 * Requires: nothing to test at low volume (keyless works, but is rate
 * limited hard — roughly 1 request/second, shared across everyone not
 * using a key). For real production use, Ascend needs its own API key:
 *   1. Google Cloud Console → create/select a project
 *   2. Enable "PageSpeed Insights API"
 *   3. Create an API key, restrict it to that API only
 *   4. Set GOOGLE_PAGESPEED_API_KEY in Vercel env vars
 * No OAuth, no per-client consent needed — this is a public API about
 * a public URL, not private account data. Much simpler than Search
 * Console (item 4).
 *
 * Field data (real Chrome User Experience Report data from real
 * visitors) is only available for sites with enough traffic. Smaller
 * sites will only get "lab data" (a simulated Lighthouse run). This
 * function reports which one it got — never silently substitutes one
 * for the other without saying so.
 */

async function fetchPageSpeed(url, strategy = 'mobile') {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'performance',
  });
  if (apiKey) params.set('key', apiKey);

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;

  const res = await fetch(endpoint);
  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: data?.error?.message || `PageSpeed API returned ${res.status}`,
      usedApiKey: !!apiKey,
    };
  }

  const lighthouse = data.lighthouseResult;
  const perfScore = lighthouse?.categories?.performance?.score;
  const audits = lighthouse?.audits || {};

  const fieldData = data.loadingExperience?.metrics || null;
  const hasFieldData = !!fieldData;

  return {
    success: true,
    usedApiKey: !!apiKey,
    dataSource: hasFieldData ? 'field (real user data)' : 'lab (simulated Lighthouse run)',
    performance_score: perfScore != null ? Math.round(perfScore * 100) : null,
    core_web_vitals: {
      lcp_ms: hasFieldData
        ? fieldData['LARGEST_CONTENTFUL_PAINT_MS']?.percentile ?? null
        : audits['largest-contentful-paint']?.numericValue != null
          ? Math.round(audits['largest-contentful-paint'].numericValue)
          : null,
      cls: hasFieldData
        ? fieldData['CUMULATIVE_LAYOUT_SHIFT_SCORE']?.percentile != null
          ? fieldData['CUMULATIVE_LAYOUT_SHIFT_SCORE'].percentile / 100
          : null
        : audits['cumulative-layout-shift']?.numericValue ?? null,
      inp_ms: hasFieldData
        ? fieldData['INTERACTION_TO_NEXT_PAINT']?.percentile ?? null
        : null, // INP lab simulation isn't reliably available, field-only in practice
    },
  };
}

export { fetchPageSpeed };
