/**
 * Ascend SEO — AI Recommendation Layer
 * ---------------------------------------
 * Takes the raw issues from an audit (and, once connected, Search
 * Console data) and asks Claude to turn them into prioritized,
 * human-readable recommendations — grouped sensibly instead of one
 * row per duplicate issue across pages.
 *
 * This NEVER writes directly to a client's site. Its only output is
 * rows in the `recommendations` table, which sit in `pending` status
 * until a human approves them (see api/approve-recommendation.js,
 * next phase).
 *
 * Requires: ANTHROPIC_API_KEY in Vercel env vars.
 */

const SYSTEM_PROMPT = `You are an SEO analyst for Ascend, a small web design and marketing agency.
You will be given raw technical SEO audit issues found across pages of a real client website, and
optionally real Google Search Console performance data.

Turn this into a short list of prioritized, actionable recommendations. Group related issues across
pages into ONE recommendation where it makes sense (e.g. "3 pages are missing meta descriptions" is
one recommendation listing all 3 affected pages, not three separate ones).

For each recommendation return:
- issue: short description of the problem
- why_it_matters: plain-English explanation, specific to what was actually found (not generic SEO advice)
- recommended_action: a concrete next step
- priority: "high", "medium", or "low"
- affected_pages: array of URLs this applies to
- auto_implementable: true only if this is a safe, mechanical change (like adding a meta tag) that
  doesn't require judgment about content accuracy. Writing alt text, schema data, or anything requiring
  real understanding of the business should be false.
- requires_approval: should be true for every single recommendation, without exception. Nothing gets
  implemented without a human clicking approve first.

Do not invent issues that weren't in the provided data. Do not soften or inflate severity to sound
more impressive. If something is genuinely low priority, say so.

Respond with ONLY a JSON array of recommendation objects, no other text.`;

async function generateRecommendations({ issues, gscData = null, siteContext = '' }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set — cannot generate AI recommendations yet.');
  }

  const userContent = `Site context: ${siteContext || 'not provided'}

Audit issues found (${issues.length} total):
${JSON.stringify(issues, null, 2)}

Search Console data: ${gscData ? JSON.stringify(gscData, null, 2) : 'Not connected yet for this site — base recommendations on technical audit data only.'}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Claude API error: ${data?.error?.message || res.status}`);
  }

  const text = data.content?.find(block => block.type === 'text')?.text || '[]';
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude response wasn't valid JSON: ${cleaned.slice(0, 200)}`);
  }
}

export { generateRecommendations };
