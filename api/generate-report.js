import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/generate-report
 * Header: x-dashboard-password: <password>
 * Body: { website_id: uuid, period_start: 'YYYY-MM-DD', period_end: 'YYYY-MM-DD' }
 *
 * Pulls everything that happened for a website in the given period —
 * audits run, issues found, recommendations approved/rejected — and
 * writes a client-friendly summary to the `reports` table.
 *
 * Honesty note: this only summarizes what's actually in the database.
 * It does NOT pull real traffic/click data yet, because Search Console
 * isn't connected for any site (see the OAuth explanation from earlier).
 * Once GSC is connected, this should also report real traffic change,
 * not just audit/recommendation activity. Until then, a report only
 * covers "what Ascend checked and did," not "what actually happened
 * to search traffic" — those are different claims and shouldn't be
 * blurred together.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-dashboard-password'];
  if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const { website_id, period_start, period_end } = req.body || {};
  if (!website_id || !period_start || !period_end) {
    return res.status(400).json({ error: 'website_id, period_start, and period_end are required.' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: audits } = await supabase
    .from('seo_audits')
    .select('*')
    .eq('website_id', website_id)
    .gte('run_at', period_start)
    .lte('run_at', period_end)
    .order('run_at', { ascending: true });

  const auditIds = (audits || []).map(a => a.id);

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('website_id', website_id)
    .gte('created_at', period_start)
    .lte('created_at', period_end);

  const first = audits?.[0];
  const last = audits?.[audits.length - 1];
  const scoreChange = first && last ? last.overall_score - first.overall_score : null;

  const approved = (recommendations || []).filter(r => r.status === 'approved' || r.status === 'edited');
  const rejected = (recommendations || []).filter(r => r.status === 'rejected');
  const pending = (recommendations || []).filter(r => r.status === 'pending');

  // Plain-English summary — generated from the real numbers above, not invented.
  let summary = '';
  if (!first) {
    summary = 'No audits were run during this period.';
  } else {
    summary = `${audits.length} audit${audits.length === 1 ? '' : 's'} run this period, covering ${last.pages_audited} page${last.pages_audited === 1 ? '' : 's'}. `;
    summary += `Overall SEO score: ${last.overall_score}/100`;
    if (scoreChange !== null && audits.length > 1) {
      summary += scoreChange > 0 ? ` (up ${scoreChange} points from ${first.overall_score})` : scoreChange < 0 ? ` (down ${Math.abs(scoreChange)} points from ${first.overall_score})` : ' (unchanged)';
    }
    summary += '. ';
    summary += `${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'} generated: ${approved.length} approved, ${rejected.length} rejected, ${pending.length} still awaiting a decision. `;
    summary += 'No changes have been automatically implemented on the live site yet — that capability has not been built.';
  }

  const metrics = {
    audits_run: audits?.length || 0,
    pages_audited_latest: last?.pages_audited || 0,
    overall_score_start: first?.overall_score ?? null,
    overall_score_end: last?.overall_score ?? null,
    score_change: scoreChange,
    recommendations_generated: recommendations?.length || 0,
    recommendations_approved: approved.length,
    recommendations_rejected: rejected.length,
    recommendations_pending: pending.length,
    search_console_data_included: false, // stays false until GSC is actually connected
  };

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      website_id,
      period_start,
      period_end,
      summary_text: summary,
      metrics,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true, report });
}
