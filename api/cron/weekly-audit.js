import { createClient } from '@supabase/supabase-js';
import { auditPage, auditSiteFiles } from '../../lib/seoAudit.js';
import { discoverUrls } from '../../lib/crawler.js';

/**
 * Vercel Cron target — runs weekly (see vercel.json).
 *
 * Re-audits every website in the system, one at a time, and writes a
 * fresh seo_audits + page_audits + audit_issues run for each. This is
 * what turns the score history from a single snapshot into an actual
 * trend over time.
 *
 * Deliberately NOT wired to auto-generate recommendations or reports
 * yet — those are separate, explicit steps (see api/generate-recommendations.js
 * and api/generate-report.js) so a bad automated crawl can't silently
 * spawn a pile of AI recommendations with no human ever reviewing that
 * the underlying audit itself was even sane.
 *
 * Security: Vercel signs cron requests with a bearer token matching
 * CRON_SECRET if you set one. Without it, this endpoint is reachable
 * by anyone who finds the URL — set CRON_SECRET in Vercel env vars.
 *
 * Cost/rate-limit note: this crawls every page of every website on the
 * same run. With more than a handful of clients, this will start
 * bumping into Vercel's function execution time limit (10s on Hobby,
 * 60s+ on Pro) and needs to be split into per-website invocations
 * instead of one big loop. Fine for now with one real client.
 */
export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: websites, error: websitesError } = await supabase.from('websites').select('id, url');
  if (websitesError) return res.status(500).json({ error: websitesError.message });

  const results = [];

  for (const website of websites || []) {
    try {
      const { urls } = await discoverUrls(website.url);
      const pagesToAudit = urls.slice(0, 10); // cap per run, see cost note above

      const pageResults = [];
      const allIssues = [];
      for (const pageUrl of pagesToAudit) {
        const result = await auditPage(pageUrl);
        pageResults.push({ url: pageUrl, ...result });
        allIssues.push(...result.issues);
      }
      const siteFileIssues = await auditSiteFiles(website.url);
      allIssues.push(...siteFileIssues);

      const avg = key => Math.round(pageResults.reduce((sum, p) => sum + (p.scores[key] || 0), 0) / pageResults.length);

      const { data: auditRow, error: auditError } = await supabase
        .from('seo_audits')
        .insert({
          website_id: website.id,
          overall_score: avg('overall_score'),
          technical_score: avg('technical_score'),
          onpage_score: avg('onpage_score'),
          content_score: avg('content_score'),
          local_score: avg('local_score'),
          authority_score: null,
          pages_audited: pageResults.length,
          raw_data: { source: 'scheduled_cron', total_pages_discovered: urls.length },
        })
        .select()
        .single();
      if (auditError) throw auditError;

      const pageAuditRows = pageResults.map(p => ({
        audit_id: auditRow.id,
        website_id: website.id,
        url: p.url,
        overall_score: p.scores.overall_score,
        technical_score: p.scores.technical_score,
        onpage_score: p.scores.onpage_score,
        content_score: p.scores.content_score,
        local_score: p.scores.local_score,
        title: p.meta?.title || null,
        word_count: p.meta?.wordCount || null,
        h1_count: p.meta?.h1Count || null,
      }));
      if (pageAuditRows.length > 0) {
        await supabase.from('page_audits').insert(pageAuditRows);
      }

      if (allIssues.length > 0) {
        await supabase.from('audit_issues').insert(
          allIssues.map(i => ({
            audit_id: auditRow.id,
            category: i.category,
            issue: i.issue,
            severity: i.severity,
            page_url: i.page_url,
            details: i.details || {},
          }))
        );
      }

      results.push({ website: website.url, status: 'ok', overall_score: avg('overall_score'), pages_audited: pageResults.length });
    } catch (err) {
      results.push({ website: website.url, status: 'failed', error: String(err) });
    }
  }

  return res.status(200).json({ success: true, ran_at: new Date().toISOString(), results });
}
