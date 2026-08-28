import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/manage-client
 * Header: x-dashboard-password: <password>
 *
 * Body for creating a new client (action: 'create'):
 *   { action: 'create', name, contact_email, contact_phone, industry,
 *     services: string[], monthly_plan, start_date, notes,
 *     website_url, platform }
 *   Creates both the client AND their first website in one call, since
 *   a client with no website can't be audited anyway.
 *
 * Body for updating an existing client (action: 'update'):
 *   { action: 'update', client_id, ...any of the fields above except website_url/platform }
 *
 * This is the piece that was missing from Phase 1 — before this,
 * adding or editing a client meant me running SQL by hand.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-dashboard-password'];
  if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { action } = req.body || {};

  if (action === 'create') {
    const { name, contact_email, contact_phone, industry, services, monthly_plan, start_date, notes, website_url, platform } = req.body;
    if (!name || !contact_email || !website_url) {
      return res.status(400).json({ error: 'name, contact_email, and website_url are required.' });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name,
        contact_email,
        contact_phone: contact_phone || null,
        industry: industry || null,
        services: services || [],
        monthly_plan: monthly_plan || null,
        start_date: start_date || null,
        notes: notes || null,
      })
      .select()
      .single();
    if (clientError) return res.status(500).json({ error: clientError.message });

    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({
        client_id: client.id,
        url: website_url,
        platform: platform || 'unknown',
      })
      .select()
      .single();
    if (websiteError) return res.status(500).json({ error: websiteError.message });

    return res.status(200).json({ success: true, client, website });
  }

  if (action === 'update') {
    const { client_id, ...fields } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id is required.' });

    const allowed = ['name', 'contact_email', 'contact_phone', 'industry', 'services', 'monthly_plan', 'start_date', 'notes', 'status', 'billing_status'];
    const updatePayload = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) updatePayload[key] = fields[key];
    }
    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const { data: updated, error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', client_id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true, client: updated });
  }

  return res.status(400).json({ error: 'action must be "create" or "update".' });
}
