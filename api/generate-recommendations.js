import { createClient } from '@supabase/supabase-js';
import { generateRecommendations } from '../lib/aiRecommendations.js';

/**
 * POST /api/generate-recommendations
 * Body: { audit_id: uuid }
 *
 * Pulls the issues from a completed audit, runs them through Claude,
 * and writes the results as `pending` recommendations. Nothing here
 * touches a live site — this only ever creates rows for a human to
 * review in the approval workflow (next phase).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audit_id } = req.body || {};
  if (!audit_id) {
    return res.status(400).json({ error: 'audit_id is required' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: audit, error: auditError } = await supabase
    .from('seo_audits')
    .select('id, website_id, websites(url)')
    .eq('id', audit_id)
    .single();
  if (auditError || !audit) {
    return res.status(404).json({ error: 'Audit not found.' });
  }

  const { data: issues, error: issuesError } = await supabase
    .from('audit_issues')
    .select('category, issue, severity, page_url')
    .eq('audit_id', audit_id);
  if (issuesError) {
    return res.status(500).json({ error: issuesError.message });
  }

  // Check for a Search Console connection — use it if present, note if not
  const { data: gscConnection } = await supabase
    .from('gsc_connections')
    .select('id')
    .eq('website_id', audit.website_id)
    .maybeSingle();

  try {
    const recommendations = await generateRecommendations({
      issues,
      gscData: null, // wire up lib/searchConsole.js here once gscConnection exists
      siteContext: audit.websites?.url || '',
    });

    const rows = recommendations.map(r => ({
      website_id: audit.website_id,
      audit_id,
      issue: r.issue,
      why_it_matters: r.why_it_matters,
      recommended_action: r.recommended_action,
      priority: r.priority,
      affected_pages: r.affected_pages || [],
      auto_implementable: !!r.auto_implementable,
      requires_approval: true, // always, regardless of what the model returns
      status: 'pending',
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('recommendations')
      .insert(rows)
      .select();
    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      count: inserted.length,
      gsc_connected: !!gscConnection,
      recommendations: inserted,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
