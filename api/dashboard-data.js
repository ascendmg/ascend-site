import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard-data
 * Header: x-dashboard-password: <password>
 *
 * Returns everything the internal dashboard needs to render in one call:
 * clients, websites, their latest audit run, per-page breakdown, issues,
 * and recommendations.
 *
 * This is a STOPGAP, not real auth. There's no per-client login system
 * yet, so this is protected by a single shared password (DASHBOARD_PASSWORD
 * in Vercel env vars) just so the data isn't sitting open to anyone who
 * finds the URL. Once clients need their own logins (phase: client-facing
 * dashboard), this needs to be replaced with real authentication —
 * Supabase Auth is the natural fit since the data already lives there.
 *
 * The Supabase service role key is used here and ONLY here — this file
 * runs server-side on Vercel, never in the browser. The dashboard page
 * itself never sees this key, it only ever sees the JSON this returns.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-dashboard-password'];
  if (!process.env.DASHBOARD_PASSWORD) {
    return res.status(500).json({ error: 'Dashboard password is not configured on the server yet.' });
  }
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured on the server yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, status, websites(id, url, platform)');
  if (clientsError) return res.status(500).json({ error: clientsError.message });

  const websiteIds = clients.flatMap(c => c.websites.map(w => w.id));

  const { data: audits } = await supabase
    .from('seo_audits')
    .select('*')
    .in('website_id', websiteIds)
    .order('run_at', { ascending: false });

  const auditIds = (audits || []).map(a => a.id);

  const [{ data: pageAudits }, { data: issues }, { data: recommendations }] = await Promise.all([
    supabase.from('page_audits').select('*').in('website_id', websiteIds),
    auditIds.length > 0
      ? supabase.from('audit_issues').select('*').in('audit_id', auditIds)
      : Promise.resolve({ data: [] }),
    supabase.from('recommendations').select('*').in('website_id', websiteIds).order('priority', { ascending: true }),
  ]);

  // Attach the latest audit run per website, plus its pages/issues/recs
  const result = clients.map(client => ({
    ...client,
    websites: client.websites.map(website => {
      const websiteAudits = (audits || []).filter(a => a.website_id === website.id);
      const latestAudit = websiteAudits[0] || null;
      return {
        ...website,
        latestAudit,
        pages: latestAudit ? (pageAudits || []).filter(p => p.audit_id === latestAudit.id) : [],
        issues: latestAudit ? (issues || []).filter(i => i.audit_id === latestAudit.id) : [],
        recommendations: (recommendations || []).filter(r => r.website_id === website.id),
      };
    }),
  }));

  return res.status(200).json({ clients: result });
}
