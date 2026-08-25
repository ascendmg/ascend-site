import { createClient } from '@supabase/supabase-js';
import { auditPage, auditSiteFiles } from '../lib/seoAudit.js';

/**
 * POST /api/run-audit
 * Body: { website_id: uuid, url: string }
 *
 * Runs a real audit against `url`, stores the results in Supabase
 * (seo_audits + audit_issues), and returns the scores.
 *
 * Requires these environment variables to be set in Vercel:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (service role, never the anon key —
 *                                 this writes data, and RLS has no
 *                                 public policies for these tables)
 *
 * Not yet handled here, on purpose, left for the next phase:
 *   - Crawling more than one page per call (sitemap loop)
 *   - Page speed / Core Web Vitals (needs PageSpeed Insights API)
 *   - Authority scoring (needs a paid backlink data source)
 *   - Turning audit_issues into `recommendations` rows automatically
 *     (that's the AI analysis layer, a separate step by design, so a
 *     human reviews before anything becomes a recommendation)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website_id, url } = req.body || {};
  if (!website_id || !url) {
    return res.status(400).json({ error: 'website_id and url are required' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server is not configured with Supabase credentials yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const pageResult = await auditPage(url);
    const siteFileIssues = await auditSiteFiles(url);
    const allIssues = [...pageResult.issues, ...siteFileIssues];

    // Recompute scores including the site-file issues (robots/sitemap are 'technical')
    const technicalIssueCount = allIssues.filter(i => i.category === 'technical').length;

    const { data: auditRow, error: auditError } = await supabase
      .from('seo_audits')
      .insert({
        website_id,
        overall_score: pageResult.scores.overall_score,
        technical_score: pageResult.scores.technical_score,
        onpage_score: pageResult.scores.onpage_score,
        content_score: pageResult.scores.content_score,
        local_score: pageResult.scores.local_score,
        authority_score: null, // never fabricated, see lib/seoAudit.js notes
        raw_data: { url, meta: pageResult.meta, technicalIssueCount },
      })
      .select()
      .single();

    if (auditError) throw auditError;

    if (allIssues.length > 0) {
      const issueRows = allIssues.map(issue => ({
        audit_id: auditRow.id,
        category: issue.category,
        issue: issue.issue,
        severity: issue.severity,
        page_url: issue.page_url || url,
        details: issue.details || {},
      }));
      const { error: issuesError } = await supabase.from('audit_issues').insert(issueRows);
      if (issuesError) throw issuesError;
    }

    return res.status(200).json({
      success: true,
      audit_id: auditRow.id,
      scores: pageResult.scores,
      issue_count: allIssues.length,
      issues: allIssues,
    });
  } catch (err) {
    console.error('Audit run failed:', err);
    return res.status(500).json({ error: 'Audit failed to run or save.', detail: String(err) });
  }
};
