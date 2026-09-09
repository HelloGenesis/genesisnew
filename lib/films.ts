import type { ReelId } from "./work";
/**
 * The FULL-LENGTH films, as opposed to the four-second previews.
 *
 * TWO DIFFERENT FILES ANSWER TO ONE CLIP NUMBER, and keeping them apart is the
 * whole point of this module.
 *
 *   /work/clips/<n>.mp4   4 seconds, 406x720, ~90KB. Committed. This is what a
 *                         tile plays on hover and what a poster is cut from,
 *                         and it must stay small — a grid holds a dozen of
 *                         them at once.
 *   films/<n>.mp4         the master in Genesis's Drive. Full length, 1080x1920,
 *                         8.9Mbps, 64MB on average. One at a time, on a detail
 *                         page somebody has clicked into.
 *
 * Genesis reported that every video on the site was four seconds long. It was:
 * the detail page was playing the hover preview because that is the only file
 * that existed outside Drive. Pointing everything at Drive instead would have
 * fixed the length and made the grid pull 64MB per tile, which is the trade
 * this split refuses to make.
 *
 * OFF UNLESS THE FLAG IS SET, and off means the detail page falls back to the
 * preview exactly as it does today. See the note in media-url.ts: a media layer
 * whose "off" state is anything other than current behaviour cannot be shipped
 * ahead of its content.
 */

const FROM_DRIVE = process.env.NEXT_PUBLIC_FILMS_FROM_DRIVE === "1";

/** True when full-length films are being served out of Drive. */
export const filmsFromDrive = FROM_DRIVE;

/**
 * Where the full film for a clip number is served from, if anywhere.
 *
 * Returns undefined when Drive is not switched on, which is the caller's cue
 * to fall back to the preview rather than render a broken player.
 */
export function filmUrl(n: ReelId): string | undefined {
  return FROM_DRIVE ? `/api/media/films/${n}.mp4` : undefined;
}
