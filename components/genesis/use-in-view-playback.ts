"use client";

import { useEffect, useRef, type RefObject } from "react";

import { filmsFromDrive } from "@/lib/films";
import { posterSrc } from "@/lib/poster";

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
 *
 * THE POSTER IS ITS JOB TOO, when one is passed. A `poster` attribute in the
 * server HTML is fetched on load whatever the video's `preload` says — so a
 * homepage of 146 preload="none" tiles still pulled every one of their 77
 * posters (4.2MB) before first interaction. Pass the poster here instead of
 * to the element and it is attached a screen and a half before the tile
 * arrives: nobody scrolling at reading speed ever sees it missing, and
 * nothing below the fold costs anything on load. It goes through posterSrc,
 * so it arrives as a card-sized WebP rather than the committed JPEG.
 *
 * The poster is attached under Reduce Motion as well — a still is exactly
 * what that setting leaves in place of the film.
 *
 * `scroller` IS FOR A TILE INSIDE A SIDEWAYS RAIL. The rail clips its own
 * overflow, and an observer on the viewport cannot see past that clip however
 * wide its margin — so the next card's poster would only load as it slid in,
 * and arrive as a black card. Observing against the rail itself lets the
 * margin reach the cards beside the visible ones.
 */
export function useInViewPlayback<T extends HTMLVideoElement>(
  poster?: string,
  scroller?: RefObject<HTMLElement | null>,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !poster) return;

    const src = posterSrc(poster) ?? poster;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.poster = src;
        observer.disconnect();
      },
      // Rails scroll sideways as well as down, so the margin is on both axes.
      { root: scroller?.current ?? null, rootMargin: "150% 150%" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [poster, scroller]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (window.matchMedia(PHONE).matches) {
      /*
        ONE AT A TIME ON A PHONE. A phone screen routinely holds two or three
        tiles, and each one playing is its
        own decoder — "phone pe everything loads slowly".
        So on a phone only the tile most in view plays; the rest keep their
        poster until they become the one in view. See `onPhone` below.
      */
      const observer = new IntersectionObserver(
        ([entry]) => {
          visibility.set(video, entry.isIntersecting ? entry.intersectionRatio : 0);
          elect();
        },
        { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      observer.observe(video);
      return () => {
        observer.disconnect();
        visibility.delete(video);
        if (current === video) current = null;
        elect();
      };
    }

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
          warmFilm(video);
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

/** A phone, for the one-at-a-time rule: narrow, or a touch screen. */
const PHONE = "(max-width: 767px), (pointer: coarse)";

/*
  THE PHONE COORDINATOR — shared by every tile on the page. Each tile reports
  how much of it is visible; the most visible one (at least a third in view)
  plays and every other tile is paused. Rails that clip their overflow report
  their clipped share, so a card half slid out of a slider counts as half.
*/
const visibility = new Map<HTMLVideoElement, number>();
let current: HTMLVideoElement | null = null;

function elect() {
  let best: HTMLVideoElement | null = null;
  let bestRatio = 0.34;
  for (const [video, ratio] of visibility) {
    if (ratio > bestRatio) {
      best = video;
      bestRatio = ratio;
    }
  }
  if (best === current) return;
  current?.pause();
  current = best;
  if (best) {
    void best.play().catch(() => {});
    warmFilm(best);
  }
}

/** Data Saver on, or a connection the browser rates 2G/3G. */
function slowConnection(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || /(^|-)(2g|3g)$/.test(connection.effectiveType ?? "");
}

/*
  WARM THE FILM BEHIND A TILE THAT IS PLAYING. The tile plays its four-second
  preview; the window a click opens plays the full Drive film, and a cold one
  took up to twelve seconds to start. So once a tile is actually playing, the
  media route is asked (in the background, low priority, once per clip per
  visit) to pull that film's first and last blocks into the CDN cache — see
  `?warm` in app/api/media. The window then starts from the cache.

  Nothing is downloaded to the phone: the answer is an empty 204. Skipped on
  Data Saver and slow connections, and when films are not served from Drive.
*/
const warmed = new Set<string>();

function warmFilm(video: HTMLVideoElement) {
  if (!filmsFromDrive || slowConnection()) return;
  const match = (video.currentSrc || video.src).match(/\/work\/clips\/([^/?#]+\.mp4)$/);
  if (!match || warmed.has(match[1])) return;
  warmed.add(match[1]);
  void fetch(`/api/media/films/${match[1]}?warm=1`, {
    priority: "low",
  } as RequestInit).catch(() => {});
}
