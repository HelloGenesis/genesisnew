"""
Cut the small division marks — the yellow N beside the gradient name — into
web assets that line up with each other.

    python3 scripts/cut-division-marks.py ["<folder of Genesis's exports>"]

WHERE THEY COME FROM. Genesis's "Genesis 2026 Rebranding 3" folder: twenty-six
1080x1080 squares, numbered 9..34, with no names. Read visually, they are three
families per division — GENESIS.<name>, N + <name>, and each with and without
its tagline — and Genesis asked for the "small logo and name in gradient" one.
Three of the four are exported twice under different numbers; the pairs are
byte-identical (9=10, 17=18, 25=26), so one file per division is used.

The tagline-free cut is the one taken, because on the site the tagline is live
text under the mark: that is what carries the drawn divider Genesis asked for,
and burned-in copy cannot be revealed on hover or read by a screen reader.

THE SAME TRAP AS THE LAST SET, and the reason this is a script rather than a
drag into /public. Each square was exported at whatever size fitted its
artboard, so the lettering is not the same size from file to file:

    file   division         cap-to-baseline
     9     Influence        109px
    17     Studios          111px
    25     AI Lab           110px
    34     Brand & Design    79px   <- 28% smaller, to fit its longer name

Sized by their boxes, Brand & Design would render visibly smaller than the
other three. Each file is instead cropped tight to its ink horizontally and
padded so the cap-to-baseline body is the same 66% of every box with the
baseline at 74% — the normalisation scripts/normalise-division-names.py uses
for the name-only set, so the two sets agree about what "the same size" means.

NO RESAMPLING. Pixels are copied; only the transparency around them changes.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pnglib import read_png, write_png

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Downloads/Genesis  2026 Rebranding 3")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "brand", "divisions", "mark")

FILES = {"influence": 9, "studios": 17, "ai-lab": 25, "brand-design": 34}
BODY, HEADROOM = 0.66, 0.08

os.makedirs(OUT, exist_ok=True)
for slug, n in FILES.items():
    w, h, px = read_png(os.path.join(SRC, f"{n}.png"))
    rows = [sum(1 for x in range(w) if px[(y * w + x) * 4 + 3] > 16) for y in range(h)]
    cols = [sum(1 for y in range(h) if px[(y * w + x) * 4 + 3] > 16) for x in range(w)]
    body = [y for y, c in enumerate(rows) if c >= max(rows) * 0.12]
    cap_top, baseline = body[0], body[-1]
    ink = [y for y, c in enumerate(rows) if c]
    xs = [x for x, c in enumerate(cols) if c]
    x0, x1 = xs[0], xs[-1]

    out_h = round((baseline - cap_top + 1) / BODY)
    out_w = x1 - x0 + 1
    shift = round(HEADROOM * out_h) - cap_top
    assert ink[0] + shift >= 0 and ink[-1] + shift < out_h, (slug, "would clip")

    out = bytearray(out_w * out_h * 4)
    for y in range(h):
        ty = y + shift
        if 0 <= ty < out_h:
            s = (y * w + x0) * 4
            out[ty * out_w * 4:(ty + 1) * out_w * 4] = px[s:s + out_w * 4]
    write_png(os.path.join(OUT, f"{slug}.png"), out_w, out_h, bytes(out))
    print(f'  "{slug}": {n}.png {w}x{h} -> {out_w}x{out_h}  ratio {out_w / out_h:.3f}')
