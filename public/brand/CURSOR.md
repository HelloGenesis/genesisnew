# The custom cursor — drop the new artwork here

Genesis's final feedback, item 28: "change the current cursor image to the new
cursor asset. I will provide the final image separately. Keep the cursor
behaviour smooth and lightweight. Avoid excessive cursor trails or heavy
effects."

The behaviour half is already done and is deliberately nothing: the cursor is
a native CSS `cursor` on `html` and on every interactive element (see the
`@media (pointer: fine)` block at the foot of `app/globals.css`). There is no
JavaScript, no follower element, no trail, and nothing to animate — a native
cursor is drawn by the compositor and cannot drop a frame, which is the
lightest possible version of what was asked for. Nothing needs to change there
when the art does.

## What to supply

Two PNGs with transparency, replacing the files already here:

    cursor-24.png     24px tall, roughly 16 wide
    cursor-48.png     exactly double, for retina displays

Both must be the SAME artwork at two sizes. The browser picks between them
with `image-set`, so a mismatch shows as the cursor changing shape when a
window moves between displays.

## Two things that will look wrong if they are missed

**Upright, not at an angle.** Genesis's original 3D arrow lies at about 36
degrees; the files here are rotated upright. A cursor supplied on the diagonal
points away from whatever it is over.

**The hotspot is the tip, and it is hard-coded.** The CSS declares `1 0` —
one pixel in from the left, at the very top — so the arrow's tip must sit
there in the 24px file. If the new art has its tip anywhere else, change the
two numbers in `globals.css` to match; a cursor whose hotspot is not its tip
clicks a few pixels away from where it looks like it is pointing, which reads
as the site being broken rather than as a design choice.

## Size

Keep it near 24px tall. It is a pointer, not a badge: at the sizes a 3D render
usually arrives at it stops reading as a cursor and starts reading as a
sticker following the mouse, and it covers the thing it is pointing at.
