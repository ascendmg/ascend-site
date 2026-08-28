import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/manage-task
 * Header: x-dashboard-password: <password>
 *
 * Body for adding a task (action: 'create'):
 *   { action: 'create', client_id, title, due_date }
 *
 * Body for toggling complete (action: 'toggle'):
 *   { action: 'toggle', task_id, completed }
 *
 * Simple CRM to-dos per client — "send invoice," "follow up on renewal,"
 * that kind of thing. Separate from the SEO `tasks` table, which tracks
 * implementation work on recommendations, not general agency admin.
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
    const { client_id, title, due_date } = req.body;
    if (!client_id || !title) return res.status(400).json({ error: 'client_id and title are required.' });

    const { data, error } = await supabase
      .from('client_tasks')
      .insert({ client_id, title, due_date: due_date || null })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, task: data });
  }

  if (action === 'toggle') {
    const { task_id, completed } = req.body;
    if (!task_id || completed === undefined) return res.status(400).json({ error: 'task_id and completed are required.' });

    const { data, error } = await supabase
      .from('client_tasks')
      .update({ completed })
      .eq('id', task_id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, task: data });
  }

  return res.status(400).json({ error: 'action must be "create" or "toggle".' });
}
