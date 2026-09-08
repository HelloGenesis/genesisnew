/**
 * The attributes every piece of Genesis footage on this site is served with.
 *
 * Genesis's instruction for the portfolio is that the videos "should not be
 * available for download", and that "if they are downloaded, a prominent
 * watermark must be applied". Those are two different jobs and this file is
 * only the first of them.
 *
 * WHAT THIS ACTUALLY BUYS, stated plainly rather than implied. It removes the
 * download AFFORDANCES the browser adds on Genesis's behalf: the download
 * button in the native control bar, the "Save video as…" item in the context
 * menu, the picture-in-picture window, and Safari/Chrome's remote-playback
 * casting. That is the whole of it. Anyone who opens devtools, reads the
 * network tab, or fetches the src directly still gets the file, and no
 * combination of HTML attributes changes that — the browser has to be able to
 * fetch a video in order to play one.
 *
 * WHICH IS WHY THE WATERMARK IS IN THE FILE. See scripts/watermark-clips.sh:
 * the preview clips and their posters carry the Genesis wordmark burned into
 * the pixels, so the footage that leaves by the routes above leaves marked.
 * An overlay drawn in the page would satisfy neither instruction — it is not
 * in the bytes, so it is not in the download.
 *
 * `controlsList` IS NOT IN React's TYPES, which is why this is typed as a
 * plain record rather than as VideoHTMLAttributes. React passes unknown
 * lowercase-ish props through to the DOM, and the attribute is real; the type
 * definitions simply have not caught up.
 */

export const VIDEO_GUARD = {
  controlsList: "nodownload noplaybackrate noremoteplayback",
  disablePictureInPicture: true,
  disableRemotePlayback: true,
} as const;

/**
 * The same, plus the context-menu block.
 *
 * SEPARATE BECAUSE OF THE SERVER/CLIENT LINE, not because the two want
 * different policies. `onContextMenu` is a function, and a function cannot be
 * spread onto an element inside a server component — WorkDetail and
 * AvatarDetail are both server-rendered, and handing them a handler is a build
 * error rather than a subtle bug. They take VIDEO_GUARD; anything already
 * marked "use client" takes this.
 *
 * The context menu is the one download route a page CAN close, so it is
 * closed wherever closing it is possible. Returning false from the handler is
 * not enough in React's synthetic system; the event has to be prevented.
 */
export const VIDEO_GUARD_CLIENT = {
  ...VIDEO_GUARD,
  onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
} as const;
