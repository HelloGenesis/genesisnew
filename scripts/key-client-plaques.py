"""
Key the solid background plaque out of a client logo.

WHY THESE THREE. Genesis's instruction on the client wall is that the marks
are PNGs on the page with no blocks behind them. Twenty-seven of the thirty
already are. Three were exported as their brand plaque with the mark reversed
out of it:

    four-points   78% opaque, navy   #013759
    hdfc-bank     76% opaque, blue   #004C8F
    grand-hyatt   75% opaque, maroon #A62F2A

The wall greyscales every mark, so those three plaques flatten to a grey
rectangle — which is exactly the block Genesis asked to be rid of, arriving by
a different route than the white ones did.

FLOOD FILL FROM THE EDGES, NOT "REMOVE THIS COLOUR". The difference matters
for HDFC: its mark has a red square sitting INSIDE the blue field, and a
global colour match would punch that out too if the tolerance ever caught it.
Filling inward from the border only removes background that is actually
connected to the outside, so anything enclosed by the artwork survives.

The edge is feathered rather than cut: a pixel's alpha falls off across the
tolerance band, so the mark keeps its antialiasing instead of gaining a hard
staircase.

Run:  python3 scripts/key-client-plaques.py <slug> [<slug> ...]
"""

import sys, os
from collections import Counter, deque

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pnglib import read_png, write_png

# How far from the plaque colour still counts as plaque. Generous enough for
# JPEG-ish ringing in the source, tight enough to leave the lettering alone.
NEAR = 42
FEATHER = 26

# A plaque's own anti-aliased rim is a ring of near-transparent pixels whose
# COLOUR is nowhere near the plaque's — Grand Hyatt's maroon field is edged in
# a pale pink at 19% alpha. The colour test rejects it, so it survived the
# first pass as a hairline down the side of the mark. Anything this faint that
# the fill can actually reach is edge, not artwork: real ink is opaque, and
# letter antialiasing this thin is sub-pixel at the 38px the wall renders.
RIM_ALPHA = 72

def key(slug):
    path = f"public/clients/{slug}.png"
    w, h, px = read_png(path)

    def rgba(i):
        o = i * 4
        return px[o], px[o + 1], px[o + 2], px[o + 3]

    # The plaque colour is whatever opaque colour dominates the border.
    edge = Counter()
    for x in range(w):
        for y in (0, h - 1):
            r, g, b, a = rgba(y * w + x)
            if a > 200: edge[(r, g, b)] += 1
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, a = rgba(y * w + x)
            if a > 200: edge[(r, g, b)] += 1
    if not edge:
        # Nothing opaque on the border: the plaque is inset. Fall back to the
        # most common opaque colour in the frame.
        for i in range(w * h):
            r, g, b, a = rgba(i)
            if a > 200: edge[(r, g, b)] += 1
    (pr, pg, pb), _ = edge.most_common(1)[0]

    def dist(i):
        r, g, b, _ = rgba(i)
        return max(abs(r - pr), abs(g - pg), abs(b - pb))

    out = bytearray(px)
    seen = bytearray(w * h)
    q = deque()

    def push(i):
        """
        Enqueue a pixel if the fill can travel through it.

        TRANSPARENT PIXELS ARE PASSABLE, and that is not a detail — it is the
        whole reason the first run of this changed nothing. These exports are
        a coloured plaque sitting INSIDE a transparent margin, so every pixel
        on the actual border of the image is already alpha 0. A fill that only
        stepped through near-plaque colours could never leave the corner it
        started in and the plaque was never reached. Alpha-0 pixels are walked
        through (and left alone, since they are already invisible).
        """
        if seen[i]:
            return
        if px[i * 4 + 3] <= RIM_ALPHA or dist(i) <= NEAR + FEATHER:
            seen[i] = 1
            q.append(i)

    for x in range(w):
        push(x); push((h - 1) * w + x)
    for y in range(h):
        push(y * w); push(y * w + w - 1)

    while q:
        i = q.popleft()
        o = i * 4
        if px[o + 3] <= RIM_ALPHA:
            # Transparent margin, or the plaque's feathered rim. Clear it and
            # keep walking.
            out[o + 3] = 0
            x, y = i % w, i // w
            if x > 0: push(i - 1)
            if x < w - 1: push(i + 1)
            if y > 0: push(i - w)
            if y < h - 1: push(i + w)
            continue
        d = dist(i)
        if d <= NEAR:
            out[o + 3] = 0
        else:
            # Feather: fade back in across the band above NEAR.
            fade = (d - NEAR) / FEATHER
            out[o + 3] = min(px[o + 3], int(round(px[o + 3] * fade)))
        x, y = i % w, i // w
        if x > 0: push(i - 1)
        if x < w - 1: push(i + 1)
        if y > 0: push(i - w)
        if y < h - 1: push(i + w)

    # Crop to what is left.
    xs = [x for x in range(w) if any(out[(y * w + x) * 4 + 3] > 8 for y in range(h))]
    ys = [y for y in range(h) if any(out[(y * w + x) * 4 + 3] > 8 for x in range(w))]
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    crop = bytearray(cw * ch * 4)
    for y in range(ch):
        s = ((y + y0) * w + x0) * 4
        crop[y * cw * 4:(y + 1) * cw * 4] = out[s:s + cw * 4]

    write_png(path, cw, ch, bytes(crop))
    op = sum(1 for i in range(cw * ch) if crop[i * 4 + 3] > 200)
    print(f"{slug:14s} plaque rgb({pr},{pg},{pb})  {w}x{h} -> {cw}x{ch}  "
          f"opaque {100 * op / (cw * ch):.1f}%  ratio {cw / ch:.3f}")

for slug in sys.argv[1:]:
    key(slug)
