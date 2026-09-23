/**
 * A video poster, served through Next's image optimiser instead of as the raw
 * JPEG.
 *
 * WHY. A `poster` attribute is not an <img>: it has no srcset, no lazy
 * loading and no format negotiation, so every poster on the page was fetched
 * whole on load as the JPEG committed to /public. The homepage alone carries
 * 77 of them — 4.2MB, almost all of it below the fold. Routed through
 * /_next/image the same file arrives as WebP at the width the card actually
 * shows, and the optimiser's own cache means it is encoded once per deploy.
 *
 * 384 IS THE CLIP'S OWN RESOLUTION. The previews are 406x720 and the posters
 * are frames cut from them, so a poster wider than that would be an upscale
 * of a frame the video itself replaces a moment later. 384 is the nearest
 * width in Next's default imageSizes; anything off that list is refused.
 *
 * 75 is the only quality Next 16 allows unless `images.qualities` says
 * otherwise.
 *
 * Absolute URLs and data URIs are returned untouched — the optimiser only
 * accepts local paths without a remotePatterns entry.
 */
export function posterSrc(src: string | undefined, width: 64 | 384 | 828 = 384) {
  if (!src || !src.startsWith("/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
