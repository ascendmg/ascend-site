import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/approve-recommendation
 * Header: x-dashboard-password: <password>
 * Body: { recommendation_id: uuid, decision: 'approve' | 'reject' | 'edit', edited_action?: string }
 *
 * Records a human decision on a recommendation and updates its status.
 * This is as far as the pipeline goes right now — approving something
 * here does NOT touch any live website. It just marks the recommendation
 * ready for the next phase (automated implementation), which hasn't
 * been built yet on purpose. "Approved" today means "cleared for a
 * human to go make this change," nothing more.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-dashboard-password'];
  if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const { recommendation_id, decision, edited_action } = req.body || {};
  if (!recommendation_id || !['approve', 'reject', 'edit'].includes(decision)) {
    return res.status(400).json({ error: 'recommendation_id and a valid decision are required.' });
  }
  if (decision === 'edit' && !edited_action) {
    return res.status(400).json({ error: 'edited_action is required when decision is "edit".' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase is not configured yet.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { error: approvalError } = await supabase.from('approvals').insert({
    recommendation_id,
    decision,
    edited_action: decision === 'edit' ? edited_action : null,
    decided_by: 'michael', // single-user for now — becomes a real user id once client logins exist
  });
  if (approvalError) {
    return res.status(500).json({ error: approvalError.message });
  }

  const newStatus = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'edited';
  const updatePayload = { status: newStatus };
  if (decision === 'edit') updatePayload.recommended_action = edited_action;

  const { data: updated, error: updateError } = await supabase
    .from('recommendations')
    .update(updatePayload)
    .eq('id', recommendation_id)
    .select()
    .single();
  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({ success: true, recommendation: updated });
}
