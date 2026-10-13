export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { name, email, phone, message } = body;

    // Spam protection: hidden honeypot field plus a minimum fill time.
    // Bots that fill every field or submit instantly get a silent success
    // so they learn nothing, and no email is sent.
    const elapsed = Date.now() - Number(body.t || 0);
    if (body.website || (body.t && elapsed < 2500)) {
      return res.status(200).json({ success: true });
    }

    // Length limits (also keeps header values and email size sane)
    if (String(name).length > 120 || String(email).length > 254 || String(phone || '').length > 40 || String(message).length > 5000) {
      return res.status(400).json({ error: 'One of your entries is too long. Please shorten it and try again.' });
    }

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Very basic email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Same submission id = Resend sends at most one email (duplicate-submit protection)
        ...(body.sid ? { 'Idempotency-Key': `contact-${String(body.sid).slice(0, 64)}` } : {}),
      },
      body: JSON.stringify({
        from: 'HQAscend Website <notifications@hqascend.com>',
        to: ['michael@hqascend.com'],
        reply_to: String(email).trim(),
        subject: `New contact form submission from ${String(name).replace(/[\r\n]+/g, ' ').slice(0, 80)}`,
        html: `
          <h2>New message from the HQAscend contact form</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend API error:', errBody);
      return res.status(502).json({ error: 'Failed to send message. Please try again or email us directly.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again or email us directly.' });
  }
}

// Prevent basic HTML injection in the email body
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
