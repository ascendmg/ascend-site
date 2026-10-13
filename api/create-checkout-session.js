/**
 * POST /api/create-checkout-session  (DISABLED)
 *
 * This endpoint used to create Stripe Checkout Sessions for the retired Ascent
 * plan (a percentage-of-ad-budget management fee, billed monthly or 90 days upfront).
 * Public checkout was removed on 2026-10-13: every public service action now
 * leads to booking a free consultation, and clients are billed through private
 * payment links or invoices after an agreement.
 *
 * It intentionally does nothing now. It does not call Stripe and does not touch
 * subscriptions, customers or payment history.
 *
 * The full original implementation is preserved in:
 *   - git tag `ascent-pricing-final` (api/create-checkout-session.js)
 *   - docs/archive/ascent/create-checkout-session.js.txt
 *   - docs/ascent-future-plan.md (how and when it could be restored)
 *
 * Do not restore it without Michael's explicit instruction.
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Online checkout is not available. Book a free consultation at https://calendly.com/michael-hqascend/free-consultation' });
}
