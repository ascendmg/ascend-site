import Stripe from 'stripe';

/**
 * POST /api/create-checkout-session
 * Body: { spend: number, billingType: 'monthly' | '90day' }
 *
 * Creates a REAL Stripe Checkout Session and returns its URL. The browser
 * redirects the user to Stripe's own hosted checkout page, real card
 * entry and processing happens entirely on Stripe's side, this code
 * never sees or touches raw payment details.
 *
 * The fee is recalculated HERE, server-side, using the exact same
 * graduated formula as the slider (50% at $1,000 down to 15% at
 * $100,000). This is deliberate: the client-side number is for display
 * only. If someone tampered with the browser before hitting "Get
 * Started," the actual charge is still computed from trusted server
 * logic, not whatever the client happened to send.
 *
 * Requires STRIPE_SECRET_KEY in Vercel env vars. Without it, this
 * endpoint fails loudly instead of pretending to work.
 *
 * IMPORTANT before this goes live with real customers: Stripe has a
 * test mode with its own separate test key (starts with sk_test_...).
 * Use that first and pay with Stripe's documented test card numbers to
 * confirm the whole flow end-to-end before ever using a live secret
 * key (sk_live_...) that processes real charges.
 */

const MIN_SPEND = 1000;
const MAX_SPEND = 100000;
const MIN_FEE_PCT = 0.50;
const MAX_FEE_PCT = 0.15;

function calculateFee(spend) {
  const clamped = Math.min(Math.max(spend, MIN_SPEND), MAX_SPEND);
  const progress = (clamped - MIN_SPEND) / (MAX_SPEND - MIN_SPEND);
  const feePct = MIN_FEE_PCT + progress * (MAX_FEE_PCT - MIN_FEE_PCT);
  return Math.round(clamped * feePct);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Checkout is not configured yet. STRIPE_SECRET_KEY needs to be set in Vercel first.',
    });
  }

  const { spend, billingType } = req.body || {};
  const spendNum = parseInt(spend, 10);

  if (!spendNum || isNaN(spendNum) || spendNum < MIN_SPEND || spendNum > MAX_SPEND) {
    return res.status(400).json({ error: `spend must be a number between $${MIN_SPEND} and $${MAX_SPEND}.` });
  }
  if (!['monthly', '90day'].includes(billingType)) {
    return res.status(400).json({ error: 'billingType must be "monthly" or "90day".' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  const feeDollars = calculateFee(spendNum);
  const siteUrl = process.env.SITE_URL || 'https://www.hqascend.com';

  try {
    let session;

    if (billingType === 'monthly') {
      // Recurring monthly charge — the fee re-bills every month until canceled.
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: feeDollars * 100, // Stripe uses cents
            recurring: { interval: 'month' },
            product_data: {
              name: 'Ascent — Marketing Management (Monthly)',
              description: `Based on $${spendNum.toLocaleString()}/mo ad spend`,
            },
          },
          quantity: 1,
        }],
        success_url: `${siteUrl}/pricing-ads?checkout=success`,
        cancel_url: `${siteUrl}/pricing-ads?checkout=canceled`,
        metadata: { ad_spend: spendNum, billing_type: 'monthly' },
      });
    } else {
      // 90 days upfront — one-time charge covering 3 months.
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: feeDollars * 3 * 100,
            product_data: {
              name: 'Ascent — Marketing Management (90 Days)',
              description: `Based on $${spendNum.toLocaleString()}/mo ad spend, 3 months upfront`,
            },
          },
          quantity: 1,
        }],
        success_url: `${siteUrl}/pricing-ads?checkout=success`,
        cancel_url: `${siteUrl}/pricing-ads?checkout=canceled`,
        metadata: { ad_spend: spendNum, billing_type: '90day' },
      });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session failed:', err);
    return res.status(500).json({ error: 'Could not start checkout. ' + (err.message || '') });
  }
}
