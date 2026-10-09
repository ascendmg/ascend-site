import manageClient from '../lib/handlers/manageClient.js';
import manageTask from '../lib/handlers/manageTask.js';

// One serverless function for both endpoints (Vercel Hobby allows 12 functions).
// /api/manage-client and /api/manage-task are rewritten here in vercel.json.
export default async function handler(req, res) {
  const fn = req.query && req.query.fn;
  if (fn === 'client') return manageClient(req, res);
  if (fn === 'task') return manageTask(req, res);
  return res.status(404).json({ error: 'Unknown endpoint' });
}
