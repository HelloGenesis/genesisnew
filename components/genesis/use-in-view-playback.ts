"use client";

import { useEffect, useRef } from "react";

/**
 * Plays a video while it is on screen and pauses it the moment it leaves.
 *
 * WHY THE GALLERIES DO NOT WAIT FOR A HOVER ANY MORE. Genesis's instruction
 * is that the work "will play directly within the gallery, without any
 * pop-ups" — so a grid of stills that only become films if you happen to
 * point at one is the wrong reading twice over. It hides that they are films
 * at all, and on a touch screen there is no hover to give, which meant the
 * entire portfolio was still images on every phone.
 *
 * WHY IT IS NOT `autoPlay`. The library at /our-work carries the whole
 * catalogue; the Studios wall doubles its row for the loop. `autoPlay` on
 * either is every file pulled on load and every decoder alive at once. A row
 * or a grid is always wider and taller than the viewport, so at most a
 * handful are ever visible — and those are the only ones this attaches a
 * decoder to. Everything off screen costs its poster and nothing else.
 *
 * IT DOES NOT REWIND ON THE WAY OUT. A clip that resets whenever it scrolls
 * past the edge of the screen restarts from frame one every time, so on a
 * drifting wall nothing past the first second of any clip would ever be seen.
 *
 * REDUCE MOTION STOPS IT ENTIRELY. Auto-playing video is precisely what that
 * setting exists to prevent, and the caller is expected to leave a poster and
 * a play control in its place.
 *
 * This was written three times — the Studios reel wall, the work tiles and
 * the case-study posters — before it was written once.
 */
export function useInViewPlayback<T extends HTMLVideoElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          /*
            play() rejects if the element is detached, if the play is
            superseded by a pause, or if autoplay policy blocks it. All three
            are ordinary here and none is worth surfacing — the poster stays
            up, which is the correct fallback.
          */
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      // A little margin, so a tile is already running by the time it arrives
      // rather than starting in full view.
      { rootMargin: "200px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return ref;
}
