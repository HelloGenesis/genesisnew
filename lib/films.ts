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

/**
 * A FILM WINDOW RETRIES ITS FILM BEFORE IT SETTLES FOR THE PREVIEW.
 *
 * The windows used to list the film and then the four-second preview as a
 * second <source>, so any hiccup loading the film — a cold Drive read timing
 * out on a phone — quietly became a four-second clip. Genesis: "click karu
 * aur window me open ho, tab toh woh fully play honi chahiye". A window now
 * carries the film alone as its `src`, and the preview only as
 * `data-preview`. On an error the film is reloaded once from where it was;
 * only a second failure (a film that genuinely is not there) shows the
 * preview, because a blank window is worse than a short one.
 *
 * Called by FilmRecovery, one capture listener for the whole page — the
 * windows include server components, which cannot carry an onError.
 */
export function recoverFilm(video: HTMLVideoElement) {
  if (!/\/api\/media\/films\//.test(video.currentSrc || video.src)) return;
  if (!video.dataset.retried) {
    video.dataset.retried = "1";
    const at = video.currentTime;
    video.load();
    if (at > 0) video.currentTime = at;
    void video.play().catch(() => {});
    return;
  }
  const preview = video.dataset.preview;
  if (preview) {
    video.src = preview;
    void video.play().catch(() => {});
  }
}
