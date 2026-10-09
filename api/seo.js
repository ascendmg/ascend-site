import approveRecommendation from '../lib/handlers/approveRecommendation.js';
import generateRecommendations from '../lib/handlers/generateRecommendations.js';
import generateReport from '../lib/handlers/generateReport.js';

// One serverless function for three SEO endpoints (Vercel Hobby allows 12 functions).
// Old URLs are rewritten here in vercel.json.
export default async function handler(req, res) {
  const fn = req.query && req.query.fn;
  if (fn === 'approve') return approveRecommendation(req, res);
  if (fn === 'recommendations') return generateRecommendations(req, res);
  if (fn === 'report') return generateReport(req, res);
  return res.status(404).json({ error: 'Unknown endpoint' });
}
