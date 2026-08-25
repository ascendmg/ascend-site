/**
 * GET /api/auth/gsc/start?website_id=<uuid>
 *
 * Redirects the client to Google's consent screen so they can grant
 * Ascend read-only access to their Search Console property.
 *
 * Requires these Vercel env vars (none of this runs without them):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET   (used only in the callback, server-side)
 *   GOOGLE_OAUTH_REDIRECT_URI    (e.g. https://www.hqascend.com/api/auth/gsc/callback)
 *
 * These come from a Google Cloud OAuth Client ID that Michael creates
 * himself in console.cloud.google.com — see the explanation given
 * before this code was written. This file does not create or assume
 * those credentials exist.
 */
export default async function handler(req, res) {
  const { website_id } = req.query;
  if (!website_id) {
    return res.status(400).json({ error: 'website_id is required' });
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return res.status(500).json({
      error: 'Search Console isn\'t configured yet. GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI need to be set in Vercel first.',
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    response_type: 'code',
    // Read-only. Ascend never needs write access to a client's Search Console.
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    access_type: 'offline', // required to get a refresh_token back
    prompt: 'consent',      // forces refresh_token on every connect, not just the first
    state: website_id,      // carried through to the callback so we know which site this is for
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.writeHead(302, { Location: authUrl });
  res.end();
}
