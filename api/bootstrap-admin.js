import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/bootstrap-admin
 * Body: { user_id: uuid, email: string }
 *
 * Grants the 'admin' role via a membership row — but ONLY if the
 * memberships table is currently completely empty. This solves the
 * bootstrapping problem: normal RLS rules require an existing admin to
 * create new memberships, but the very first admin has no one to
 * approve them. This endpoint is the one-time exception, and it closes
 * itself automatically the moment one membership row exists.
 *
 * Safe to leave deployed indefinitely — after the first admin exists,
 * every subsequent call just returns becameAdmin: false and does nothing.
 * Uses the service role key, server-side only, never exposed to the browser.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, email } = req.body || {};
  if (!user_id || !email) {
    return res.status(400).json({ error: 'user_id and email are required.' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { count, error: countError } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if (count > 0) {
    // Someone is already an admin (or at least a member exists) — this
    // person needs to be invited by an existing admin instead.
    return res.status(200).json({ becameAdmin: false });
  }

  const { error: insertError } = await supabase
    .from('memberships')
    .insert({ user_id, client_id: null, role: 'admin' });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(200).json({ becameAdmin: true });
}
