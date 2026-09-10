#!/usr/bin/env bash
#
# Burns the Genesis wordmark into the preview clips under public/work/clips,
# and into each clip's poster.
#
# WHY THE FILE AND NOT AN OVERLAY IN THE PAGE. Genesis's instruction is that
# the portfolio videos must not be downloadable, and that "if they are
# downloaded, a prominent watermark must be applied". A <div> over the video
# satisfies neither half of that: it is not in the file, so anything that
# reaches the file — right-click, the network tab, curl against the URL,
# a download manager — gets clean footage. The only watermark that survives a
# download is one that is part of the bytes being downloaded.
#
# WHAT IS BEING WATERMARKED, AND WHAT IS NOT. These are the four-second
# PREVIEWS, not the masters. The masters are Genesis's own files and are not in
# this repository; nothing here touches them.
#
# IT IS SAFE TO RE-RUN NOW, and that is the reason this version exists. The
# first one stamped every clip in the folder on every run, so the only way to
# add new clips was to know which files had been done — and the September
# Drive ingest added twenty-nine that quietly never were. Each clip this writes
# now carries a `comment=genesis-watermark` tag in its container, and a tagged
# clip is skipped. New clips get marked; marked clips are left alone.
#
# THE POSTER GOES WITH ITS CLIP. The first version stamped every poster in a
# separate blind pass, which cannot be re-run either — a JPEG has nowhere
# useful to record that it was done. So a poster is stamped exactly when its
# own clip is, and never otherwise, which keeps the pair consistent: with only
# the video stamped, the mark POPPED IN on hover, which reads as a rendering
# fault rather than as a watermark.
#
# ADOPTING CLIPS THAT WERE MARKED BEFORE THE TAG EXISTED. The original forty-two
# were stamped by the old version and carry no tag. `--adopt <name>...` writes
# the tag onto the named clips WITHOUT re-encoding them (a stream copy), so a
# normal run then skips them. It takes names, never "everything untagged", so
# it cannot be used to wave an unmarked clip through by accident.
#
# Usage:  bash scripts/watermark-clips.sh
#         bash scripts/watermark-clips.sh --adopt 1 2 3
set -euo pipefail

cd "$(dirname "$0")/.."

CLIPS="public/work/clips"
POSTERS="public/work/posters"
MARK="public/brand/genesis-wordmark-light.png"   # the WHITE lockup
TAG="genesis-watermark"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

[ -d "$CLIPS" ] || { echo "no $CLIPS"; exit 1; }
[ -f "$MARK" ]  || { echo "no $MARK";  exit 1; }

tagged() {
  [ "$(ffprobe -v error -show_entries format_tags=comment -of csv=p=0 "$1" 2>/dev/null)" = "$TAG" ]
}

# The mark is sized as a share of THIS file's width rather than in pixels, so
# a landscape clip and a portrait one get the same relative stamp. `head -1` is
# load-bearing: a handful of clips carry an attached cover-art stream, ffprobe
# reports a width for both, and two numbers reaching the arithmetic is a syntax
# error that fails loudly on exactly the files it must not skip.
mark_width() {
  local w
  w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$1" | head -1)"
  local mw=$(( w * 38 / 100 ))
  echo $(( mw - mw % 2 ))   # libx264 wants even dimensions on yuv420p
}

if [ "${1:-}" = "--adopt" ]; then
  shift
  [ $# -gt 0 ] || { echo "usage: $0 --adopt <clip-name>..."; exit 1; }
  adopted=0
  for name in "$@"; do
    src="$CLIPS/$name.mp4"
    [ -f "$src" ] || { echo "no $src"; exit 1; }
    tagged "$src" && continue
    ffmpeg -nostdin -loglevel error -y -i "$src" -map 0 -c copy \
      -movflags +faststart -metadata comment="$TAG" "$TMP/$name.mp4"
    mv "$TMP/$name.mp4" "$src"
    adopted=$((adopted + 1))
  done
  echo "adopted $adopted clip(s) as already watermarked"
  exit 0
fi

count=0; pcount=0; skipped=0
for src in "$CLIPS"/*.mp4; do
  name="$(basename "$src" .mp4)"
  if tagged "$src"; then skipped=$((skipped + 1)); continue; fi

  mw="$(mark_width "$src")"
  # colorchannelmixer=aa is how the mark is made translucent — `overlay` has
  # no opacity of its own. Centred, because a corner mark is the first thing a
  # crop removes.
  ffmpeg -nostdin -loglevel error -y \
    -i "$src" -i "$MARK" \
    -filter_complex "\
[1:v]format=rgba,scale=${mw}:-2,colorchannelmixer=aa=0.30[wm];\
[0:v:0][wm]overlay=(W-w)/2:(H-h)/2:format=auto[v]" \
    -map "[v]" -map "0:a:0?" \
    -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
    -movflags +faststart -c:a copy -metadata comment="$TAG" \
    "$TMP/$name.mp4"
  mv "$TMP/$name.mp4" "$src"
  count=$((count + 1))
  printf '  %s\n' "$name"

  poster="$POSTERS/$name.jpg"
  if [ -f "$poster" ]; then
    pw="$(mark_width "$poster")"
    ffmpeg -nostdin -loglevel error -y \
      -i "$poster" -i "$MARK" \
      -filter_complex "\
[1:v]format=rgba,scale=${pw}:-2,colorchannelmixer=aa=0.30[wm];\
[0:v:0][wm]overlay=(W-w)/2:(H-h)/2:format=auto" \
      -q:v 3 "$TMP/$name.jpg"
    mv "$TMP/$name.jpg" "$poster"
    pcount=$((pcount + 1))
  fi
done

echo "watermarked $count clip(s) and $pcount poster(s); $skipped already carried the mark"
