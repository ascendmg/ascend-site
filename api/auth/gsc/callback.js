import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/gsc/callback?code=...&state=<website_id>
 *
 * Google redirects here after the client approves access. Exchanges
 * the one-time code for a refresh_token and stores it in gsc_connections.
 *
 * The refresh_token is the sensitive part — it's what lets Ascend pull
 * this client's Search Console data indefinitely without them logging
 * in again. It is written straight to Supabase via the service role
 * key and is never sent back to the browser in this response.
 */
export default async function handler(req, res) {
  const { code, state: website_id, error } = req.query;

  if (error) {
    return res.status(400).send(`Search Console connection was not completed: ${error}`);
  }
  if (!code || !website_id) {
    return res.status(400).send('Missing code or website_id from Google redirect.');
  }

  const required = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_OAUTH_REDIRECT_URI', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    return res.status(500).send(`Server missing config: ${missing.join(', ')}`);
  }

  // Exchange the authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    // No refresh_token usually means the client had already granted access
    // before and Google didn't re-issue one — prompt=consent above should
    // prevent this, but surfaced here rather than silently failing.
    return res.status(400).send(
      `Could not get a refresh token from Google. Response: ${JSON.stringify(tokens)}`
    );
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { error: dbError } = await supabase
    .from('gsc_connections')
    .upsert({
      website_id,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      scope: tokens.scope,
    }, { onConflict: 'website_id' });

  if (dbError) {
    return res.status(500).send(`Connected to Google, but failed to save: ${dbError.message}`);
  }

  // Redirect back to a simple confirmation. Update this path once the
  // client dashboard (phase 8) exists.
  res.writeHead(302, { Location: '/location?gsc_connected=1' });
  res.end();
}
