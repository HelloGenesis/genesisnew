#!/usr/bin/env bash
#
# Burns the Genesis wordmark into the preview clips under public/work/clips.
#
# WHY THE FILE AND NOT AN OVERLAY IN THE PAGE. Genesis's instruction is that
# the portfolio videos must not be downloadable, and that "if they are
# downloaded, a prominent watermark must be applied". A <div> over the video
# satisfies neither half of that: it is not in the file, so anything that
# reaches the file — right-click, the network tab, curl against the URL,
# a download manager — gets clean footage. The only watermark that survives a
# download is one that is part of the bytes being downloaded.
#
# WHAT IS BEING WATERMARKED, AND WHAT IS NOT. These are the 406x720 four-second
# PREVIEWS, not the masters. The masters are Genesis's own files and are not in
# this repository; nothing here touches them. So the trade is: the thumbnails
# and hover loops on the site carry a mark, and the deliverable footage does
# not — which is the right way round.
#
# IT IS NOT IDEMPOTENT. Running it twice stamps the mark twice. The clips are
# in git, so the way back is `git checkout -- public/work/clips`, and the way
# to re-run it is to do that first.
#
# Usage:  bash scripts/watermark-clips.sh
set -euo pipefail

cd "$(dirname "$0")/.."

CLIPS="public/work/clips"
MARK="public/brand/genesis-wordmark-light.png"   # the WHITE lockup
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

[ -d "$CLIPS" ] || { echo "no $CLIPS"; exit 1; }
[ -f "$MARK" ]  || { echo "no $MARK";  exit 1; }

count=0
for src in "$CLIPS"/*.mp4; do
  name="$(basename "$src")"
  out="$TMP/$name"

  # The mark is sized as a share of THIS clip's width rather than in pixels,
  # so a landscape clip and a portrait one get the same relative stamp. It is
  # measured per file rather than expressed in the filter because ffmpeg's
  # scale filter cannot see the other input's dimensions; scale2ref can, but
  # it cannot preserve the overlay's own aspect while doing so.
  # `head -1` is load-bearing: a handful of these files carry an attached
  # cover-art stream alongside the real one, and ffprobe reports a width for
  # both. Two numbers reaching the arithmetic below is a syntax error, not a
  # wrong size, so it fails loudly on exactly the clips it must not skip.
  vw="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$src" | head -1)"
  mw=$(( vw * 38 / 100 ))
  # libx264 wants even dimensions on a yuv420p pipeline.
  mw=$(( mw - mw % 2 ))

  # colorchannelmixer=aa is how the mark is made translucent — `overlay` has
  # no opacity of its own, it composites whatever alpha it is handed.
  # Centred, because a corner mark is the first thing a crop removes.
  ffmpeg -nostdin -loglevel error -y \
    -i "$src" -i "$MARK" \
    -filter_complex "\
[1:v]format=rgba,scale=${mw}:-2,colorchannelmixer=aa=0.30[wm];\
[0:v:0][wm]overlay=(W-w)/2:(H-h)/2:format=auto[v]" \
    -map "[v]" -map "0:a:0?" \
    -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
    -movflags +faststart -c:a copy \
    "$out"

  mv "$out" "$src"
  count=$((count + 1))
  printf '  %s\n' "$name"
done

echo "watermarked $count clips"

# THE POSTERS TOO, and for a reason that is visual rather than legal. Each
# poster is the still the tile shows until the clip starts, so with only the
# video stamped the mark POPPED IN on hover — which reads as a rendering
# fault rather than as a watermark. Same mark, same share of the width, same
# opacity, so the still and the first frame agree.
POSTERS="public/work/posters"
pcount=0
if [ -d "$POSTERS" ]; then
  for src in "$POSTERS"/*.jpg; do
    [ -e "$src" ] || continue
    name="$(basename "$src")"
    out="$TMP/$name"
    iw="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$src" | head -1)"
    mw=$(( iw * 38 / 100 ))
    mw=$(( mw - mw % 2 ))
    ffmpeg -nostdin -loglevel error -y \
      -i "$src" -i "$MARK" \
      -filter_complex "\
[1:v]format=rgba,scale=${mw}:-2,colorchannelmixer=aa=0.30[wm];\
[0:v:0][wm]overlay=(W-w)/2:(H-h)/2:format=auto" \
      -q:v 3 "$out"
    mv "$out" "$src"
    pcount=$((pcount + 1))
  done
fi
echo "watermarked $pcount posters"
