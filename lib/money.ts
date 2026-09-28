/**
 * HOW EVERY PRICE ON THE SITE IS WRITTEN — one place, so no two pages can
 * disagree about a figure or its format.
 *
 * Genesis's rules (28 Sep 2026):
 *
 *   1. Full digits, Indian grouping, "/-" after: ₹64,999/-, ₹1,49,999/-.
 *      No "65K" or "1.5L" anywhere.
 *   2. ₹1 off every list figure: a ₹65,000 plan is shown as ₹64,999/-.
 *   3. Memberships default to QUARTERLY — the list figure per month, paid
 *      upfront for three months. MONTHLY billing is 10% more.
 *
 * So the copy files hold the round list figure (65000) and call `price()`,
 * and the plan cards derive the monthly and upfront figures from it.
 */

/** Monthly billing costs this much more than quarterly. */
export const MONTHLY_UPLIFT = 0.1;

/** 1234567 → "12,34,567" — the Indian system: last three, then pairs. */
function indianGrouping(value: number) {
  const digits = String(Math.round(Math.abs(value)));
  if (digits.length <= 3) return digits;
  const last = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last}`;
}

/** An exact amount, written the house way: ₹2,84,997/-. */
export function inr(value: number) {
  return `₹${indianGrouping(value)}/-`;
}

/** A list figure as shown to a buyer — ₹1 off, the house way: 65000 → ₹64,999/-. */
export function price(listFigure: number) {
  return inr(listFigure - 1);
}

/** The monthly-billing list figure for a plan whose quarterly rate is `rate`. */
export function monthlyListFigure(rate: number) {
  return Math.round(rate * (1 + MONTHLY_UPLIFT));
}
