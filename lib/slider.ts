/**
 * How long an auto-sliding rail waits after the reader lets go of it before
 * it moves on its own again. One number for every rail on the site, so they
 * cannot disagree.
 *
 * ZERO, at Genesis's request — it was eight seconds on some rails, then two,
 * then "usko 0 seconds kardo". The rail picks up the moment the reader is done.
 *
 * "Done" is the part that needs care, and it is what `watchReader` is for.
 * With a pause of several seconds, a drift that writes scrollLeft every frame
 * never overlapped with the reader. At zero it would: it would fight a finger
 * mid-swipe, kill the swipe's momentum, and cancel an arrow's smooth scroll
 * one frame in. So a rail holds while the reader is ACTUALLY moving it — a
 * finger or button down, or the row still travelling from their swipe or
 * press — and resumes the instant that stops.
 */
export const SLIDER_RESUME_MS = 0;

/**
 * After the last scroll the drift did not cause, how long before the row
 * counts as settled. Long enough to bridge the gap between momentum-scroll
 * events, short enough to read as "immediately".
 */
const SETTLE_MS = 140;

/**
 * Watches one scrolling rail for the reader's hand.
 *
 * The rail's own loop calls `wrote()` after every scrollLeft it sets; any
 * other movement of the row is the reader's (a swipe, momentum, a trackpad,
 * an arrow's smooth scroll) and holds the drift until it settles.
 */
export function watchReader(el: HTMLElement) {
  let written = el.scrollLeft;
  let down = false;
  let busyUntil = 0;

  const settle = () => {
    busyUntil = performance.now() + SETTLE_MS + SLIDER_RESUME_MS;
  };
  const onScroll = () => {
    if (Math.abs(el.scrollLeft - written) > 1.5) settle();
  };
  const onDown = () => {
    down = true;
  };
  const onUp = () => {
    if (!down) return;
    down = false;
    settle();
  };

  el.addEventListener("scroll", onScroll, { passive: true });
  el.addEventListener("pointerdown", onDown, { passive: true });
  el.addEventListener("touchstart", onDown, { passive: true });
  // On the window: a finger can lift outside the rail it started on.
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
  window.addEventListener("touchend", onUp, { passive: true });

  return {
    /** True while the reader is holding or moving the row. */
    busy: () => down || performance.now() < busyUntil,
    /** Record a position the drift set, so it is not mistaken for the reader. */
    wrote: () => {
      written = el.scrollLeft;
    },
    /** Hold as if the reader had just let go — for an arrow press, say. */
    touch: settle,
    dispose: () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchend", onUp);
    },
  };
}
