/**
 * A HINT, NOT A SESSION (Genesis, 14 Oct 2026: "remove the cart button and add
 * it after someone logs in"). The real session cookies are httpOnly, so the
 * site's bar can't read them; this readable cookie, set when a sign-in
 * completes and cleared on sign-out, only decides what the bar shows (cart,
 * "My account"). Nothing is trusted on it: every page behind it checks the
 * real session.
 */
export const SIGNED_IN_HINT = "gm_signed_in";
export const SIGNED_IN_HINT_MAX_AGE = 60 * 60 * 24 * 30;

/** The hint's value: the first name the site's bar greets ("Hi Shivam"), or "1" when there's none yet. */
export const hintValue = (name: string | null | undefined) => {
  const first = (name ?? "").trim().split(/\s+/)[0]?.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 24);
  return first ? encodeURIComponent(first) : "1";
};
