# Ascent: Future Plan (Shelved)

**Status: shelved. Internal document. Not linked from the public site.**
**Do not restore, advertise, or mark "Coming Soon" without an explicit instruction from Michael.**

Last updated: 2026-10-13

---

## 1. What Ascent Was

Ascent was HQAscend's self-serve marketing-management plan. A visitor dragged an
ad-budget slider on the pricing page and saw a **management fee that was a
percentage of their ad budget**. The percentage fell as the budget rose.

Before it was retired it went through three public forms:

1. **Checkout version:** the slider led to "Pay Monthly" or "90 Days Upfront" cards and a
   real Stripe Checkout Session (`/api/create-checkout-session`).
2. **Consultation version (2026-10-13):** checkout removed. The slider stayed as an
   estimator, and the button read "Discuss This Plan".
3. **Retired (2026-10-13):** replaced by consultation-based marketing retainers
   starting at $2,000 per month. This is the current public model.

Why it was shelved: the percentage model only works with a larger team, more
clients, and a standardized, repeatable service that can profitably support
smaller budgets. HQAscend is not there yet.

---

## 2. Where the Implementation Is Preserved

| What | Where |
| --- | --- |
| Full site as it was, with Ascent live | Git tag **`ascent-pricing-final`** (commit `576caf2`) |
| Source snapshots of every Ascent file | `docs/archive/ascent/` (see section 6) |
| This plan | `docs/ascent-future-plan.md` |

Show the old version at any time:

```bash
git show ascent-pricing-final:pricing.html          # the old pricing page
git diff ascent-pricing-final -- pricing.html        # what changed since
git checkout ascent-pricing-final -- pricing.html    # restore ONE file (don't do this casually)
```

The `docs/` folder is blocked from the public site in `vercel.json` (redirect to `/`)
and `robots.txt`. Keep it that way.

---

## 3. The Calculator

**Location (old):** `pricing.html`, Marketing tab, first slide (`#slide-marketing`).

**Inputs**

- Monthly ad budget slider: `$1,000` to `$100,000`, step `$500`, default `$1,000`.

**Outputs**

- Management fee percentage (50.0% down to 15.0%).
- Management fee in dollars per month.
- Two side-by-side boxes separating the **ad budget** (paid to Google/Meta) from the
  **HQAscend management fee** (paid to HQAscend).
- CTA ("Discuss This Plan" in the final version; Pay Monthly / 90 Days Upfront in the first).

### 3.1 The Formula

```js
const MIN_SPEND = 1000, MAX_SPEND = 100000;
const MIN_FEE_PCT = 0.50, MAX_FEE_PCT = 0.15;

progress = (spend - MIN_SPEND) / (MAX_SPEND - MIN_SPEND);      // 0 to 1
feePct   = MIN_FEE_PCT + progress * (MAX_FEE_PCT - MIN_FEE_PCT); // 50% to 15%, linear
feeUSD   = Math.ceil((spend * feePct) / 5) * 5;                  // round UP to next $5
```

- Client side used `Math.ceil(Math.round(spend * feePct * 1000) / 1000 / 5) * 5` to avoid a
  floating-point error ($15,005 instead of $15,000 at $100K).
- The server (`api/create-checkout-session.js`) recalculated the fee itself and did **not**
  have that rounding guard, so the two could disagree by $5 at some budgets.
- 90-day upfront billing charged `feeUSD * 3` as a one-time payment.
- Monthly billing created a recurring Stripe subscription at `feeUSD` per month.

### 3.2 Sample Output

| Ad budget | Fee % | Fee (USD/mo) |
| --- | --- | --- |
| $1,000 | 50.0% | $500 |
| $2,000 | 49.6% | $995 |
| $5,000 | 48.6% | $2,430 |
| $10,000 | 46.8% | $4,685 |
| $25,000 | 41.5% | $10,380 |
| $50,000 | 32.7% | $16,340 |
| $70,500 | 25.4% | **$17,930 (peak)** |
| $80,000 | 22.1% | $17,660 |
| $90,000 | 18.5% | $16,685 |
| $100,000 | 15.0% | $15,000 |

---

## 4. Known Flaw: The Curve Is Not Monotonic

**The old curve can charge less in dollar fees at higher ad budgets.**

Because the percentage falls linearly while the budget rises linearly, the dollar fee
is a downward-opening parabola in the budget. It peaks near **$70,500** (about
**$17,930 per month**) and then *declines*.

Consequences:

- A client spending **$100,000** pays **$15,000**. Every budget from about **$42,500** up to just
  under $100,000 pays at least that much, and a **$70,500** client pays **$2,930 more** than a
  $100,000 client.
- Above roughly $70,500, 56 of the $500 budget steps *lower* the fee instead of raising it.
- Clients near the top of the range could lower their fee by raising their budget.
- At the low end, the fee is $500 for a $1,000 budget. That is almost certainly below
  the cost of building, running and reporting on a real campaign.
- Fulfillment effort probably does not scale with ad spend this way (setup, tracking and
  reporting likely cost similar time at $2K and $20K). This has not been measured and must be validated.

**The formula must be redesigned before any reuse.** Do not restore it as written.

---

## 5. Requirements Before Ascent Could Return

Any future version needs all of the following:

1. **A minimum fee** that covers fulfillment with margin. The current public floor is
   $2,000 per month, and Ascent must never advertise below the floor in force.
2. **A monotonic fee schedule.** Tiers or a fee of the form `max(minimum, pct x spend)`,
   with a rule that fee never decreases as budget increases. Test it across the whole
   range, including rounding.
3. **Clear scope.** State exactly what each tier includes (channels, creative volume,
   landing pages, reporting) and what is quoted separately.
4. **Validated fulfillment costs.** Measure the real hours per client by tier, with
   tooling and ad-platform overhead, before setting any price. The percentage must come
   from the data and not the other way round.
5. **Operational readiness.** A larger team, a standardized repeatable service, onboarding
   and offboarding checklists, and enough clients that a smaller-budget tier is
   profitable.
6. **Terms.** Contract length, cancellation, refunds, and what happens when ad budget
   changes mid-term. The old "No contracts. Cancel anytime" and 90-day upfront
   wording were never reviewed by a lawyer.
7. **Server and client from one source.** One shared pricing function used by both the
   page and the checkout endpoint, with tests.
8. **Stripe test mode first,** then a small pilot with real clients.

Do not restore any of this without Michael's explicit instruction.

---

## 6. Components and Files (As They Were)

Snapshots live in `docs/archive/ascent/` (extension `.txt` so they are never served as
pages). The authoritative copy of everything is the git tag `ascent-pricing-final`.

| Component | Archived snapshot | Original path | Notes |
| --- | --- | --- | --- |
| Pricing page, final consultation version | `pricing.html.txt` | `pricing.html` | Slider, budget/fee boxes, "Discuss This Plan", JS `updateSlider()` |
| Pricing page, original checkout version | `pricing.with-checkout.html.txt` | `pricing.html` | Pay Monthly / 90 Days Upfront cards, `startCheckout()`, success/cancel banner |
| Homepage mini estimator | `index.html.txt`, `script.js.txt` | `index.html` (`#panel-leads`), `script.js` (`updateAds`) | Same formula, no clamp |
| Marketing page "Where the Money Goes" | `marketing.html.txt`, `page-mkt.js.txt`, `page-mkt.css.txt` | `marketing.html`, `page-mkt.js` (`model()`), `page-mkt.css` | Fee drawn as a split bar next to ad spend |
| Checkout endpoint | `create-checkout-session.js.txt` | `api/create-checkout-session.js` | Creates real Stripe Checkout Sessions; **now disabled**, returns HTTP 410 |

### 6.1 Pricing Page Pieces

- Markup: `#slide-marketing` (slider, `#adSlider`, `#sliderFill`, `#sliderThumb`,
  `#spendDisplay`, `#feeDisplay`, `#feeAmount`, `#boxSpend`, `#boxFee`, `#discussAds`).
- CSS: `.slider-card`, `.slider-*`, `.ascent-split`, `.ascent-box`, `.ascent-plus`,
  `.ascent-explain`, `.ascent-cta`, `.fee-note`.
- JS: `updateSlider()` near the bottom of `pricing.html`.
- Tab routing: `/pricing?tab=marketing` (redirects from `/pricing-ads` are in `vercel.json`).

### 6.2 Stripe Checkout Endpoint

- `POST /api/create-checkout-session` with `{ spend, billingType: 'monthly' | '90day' }`.
- Required env var: `STRIPE_SECRET_KEY`. Optional: `SITE_URL`.
- Monthly: `mode: 'subscription'`, price built inline with `price_data`.
- 90-day: `mode: 'payment'`, `unit_amount = fee * 3 * 100`.
- Success/cancel URLs: `/pricing?tab=marketing&checkout=success|canceled`.

---

## 7. How It Could Be Restored (Only When Explicitly Instructed)

1. **Redesign the pricing first** (section 5). Do not skip this.
2. Create a branch: `git checkout -b ascent-revival`.
3. Bring back the UI pieces you want from the tag, then edit them to the new formula:
   `git checkout ascent-pricing-final -- pricing.html` (or copy sections from
   `docs/archive/ascent/pricing.html.txt`).
4. Replace the formula in **one shared module** used by the page and the API.
5. Restore the endpoint: `git checkout ascent-pricing-final -- api/create-checkout-session.js`,
   then update its pricing to match, and remove the HTTP 410 guard.
6. Test in **Stripe test mode** with test cards. Confirm the success and cancel pages.
7. Re-check copy for Title Case, mobile layout, and that the ad budget and the
   management fee are clearly separate.
8. Get a legal review of the terms and the refund/cancellation language.
9. Only then merge and deploy, on Michael's explicit say-so.

---

## 8. What Stayed in Place

- Stripe account, API keys, webhooks, and the other API routes were not changed.
- Existing private client billing (payment links and invoices) was not touched.
- No subscriptions, customer records, or payment history were altered.
- The only billing-related code change is that the **public** Ascent checkout endpoint now
  returns 410 Gone, so nobody can start a new Ascent checkout.
