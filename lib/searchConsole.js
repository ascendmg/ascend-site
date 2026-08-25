/**
 * Pulls real Search Console performance data for a connected website.
 * Cannot run at all until a client has gone through the OAuth flow
 * in api/auth/gsc/*.js and a row exists in gsc_connections.
 */

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

/**
 * siteUrl must exactly match how the property is registered in Search
 * Console — either "https://example.com/" (URL-prefix) or
 * "sc-domain:example.com" (Domain property). Get this wrong and the
 * API returns an empty result set, not an error, which is a common
 * silent-failure trap worth testing for explicitly once this is wired up.
 */
async function fetchSearchAnalytics({ refreshToken, siteUrl, startDate, endDate, dimensions = ['query'] }) {
  const accessToken = await refreshAccessToken(refreshToken);

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit: 1000,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Search Console API error: ${data?.error?.message || res.status}`);
  }

  return (data.rows || []).map(row => ({
    keys: row.keys,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}

export { fetchSearchAnalytics, refreshAccessToken };
