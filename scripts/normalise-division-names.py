"""
Re-cut the four division NAME marks so they are uniform on the orb board.

WHAT WAS WRONG, measured rather than eyeballed. The four files were exported
with whatever padding the source artboard happened to have, and the layout
sizes each mark from its FILE box:

    file        ink x-range      pad L / R     body height   descender
    influence   182..543         182 / 184     65            1
    studios     164..459         164 / 163     68            0
    ai-lab      215..464         215 / 219     65            1
    brand-design 16..631          16 /  16     66            16

Two faults come out of that table.

  THE INK SITS AT A DIFFERENT OFFSET IN EVERY FILE. Three marks are floating
  in ~180px of transparent air on each side; Brand & Design has 16. The boxes
  were aligned correctly all along — it is the LETTERS inside them that start
  in four different places. Rendered at 1440 the ink began 109px into AI Lab's
  box and 6px into Brand & Design's, which is the gap Genesis reported.

  BRAND & DESIGN RENDERED 20% SMALLER THAN THE REST. Its file is 88px tall
  where the others are ~71, and the extra 17 is the descender of the "g".
  `fluid` sizing divides by the file's aspect ratio, so a taller box means a
  narrower mark, and a narrower mark means smaller letters: 26.4px of body
  height against 32-34px for the other three. The descender was quietly
  shrinking the whole wordmark.

WHAT THIS WRITES. Each mark cropped tight to its ink horizontally, and padded
vertically so that the CAP-TO-BASELINE body is the same fraction of every
output box (66%) with the baseline at the same height (74%). That leaves 8%
of headroom for the dot on an "i" and 26% of depth for a descender, which is
the deepest one in the set plus margin.

The point of normalising on the BASELINE rather than on the file box is that
the baseline is what the eye actually lines up. Once every file carries the
same metrics, the existing ratio-based `fluid` sizing gives all four the same
body height and the same left edge for free, with no per-division fudge in
the layout.

NO RESAMPLING. Pixels are copied, never scaled, so the artwork is bit-for-bit
what the designer exported; only the surrounding transparency changes.

Run:  python3 scripts/normalise-division-names.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pnglib import read_png, write_png

SRC = "public/brand/divisions/name"
SLUGS = ["influence", "studios", "ai-lab", "brand-design"]

# Where the body sits in the output box.
BODY = 0.66      # cap-to-baseline, as a share of output height
HEADROOM = 0.08  # above the cap line, for the dot on an "i"

results = {}
for slug in SLUGS:
    w, h, px = read_png(f"{SRC}/{slug}.png")
    rows = [sum(1 for x in range(w) if px[(y * w + x) * 4 + 3] > 16) for y in range(h)]
    cols = [sum(1 for y in range(h) if px[(y * w + x) * 4 + 3] > 16) for x in range(w)]
    thr = max(rows) * 0.12
    body = [y for y, c in enumerate(rows) if c >= thr]
    cap_top, baseline = body[0], body[-1]
    ink_rows = [y for y, c in enumerate(rows) if c > 0]
    xs = [x for x, c in enumerate(cols) if c > 0]
    x0, x1 = xs[0], xs[-1]

    body_h = baseline - cap_top + 1
    out_h = round(body_h / BODY)
    out_w = x1 - x0 + 1
    cap_out = round(HEADROOM * out_h)
    shift = cap_out - cap_top

    # Nothing may be clipped.
    assert ink_rows[0] + shift >= 0, slug
    assert ink_rows[-1] + shift < out_h, (slug, ink_rows[-1] + shift, out_h)

    out = bytearray(out_w * out_h * 4)
    for y in range(h):
        ty = y + shift
        if not (0 <= ty < out_h):
            continue
        src = (y * w + x0) * 4
        dst = (ty * out_w) * 4
        out[dst:dst + out_w * 4] = px[src:src + out_w * 4]

    write_png(f"{SRC}/{slug}.png", out_w, out_h, bytes(out))
    results[slug] = (out_w, out_h, out_w / out_h)
    print(f"{slug:14s} {w}x{h} -> {out_w}x{out_h}  ratio {out_w/out_h:.4f}")

print("\nNAME table:")
for slug in SLUGS:
    w, h, _ = results[slug]
    print(f"  {slug}: width {w}, height {h}")
print(f"\nNAME_MAX_RATIO = {max(r for _, _, r in results.values()):.4f}")
