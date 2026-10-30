import { cn } from "@/lib/utils";

/**
 * GENESIS'S PRODUCTS AS WORDMARKS (Genesis, 30 Oct 2026: "make Genesis
 * Copilot, Nova and other platforms into a logo like" GENESIS MEDIA): the
 * GENESIS letters, then the product in Codec Pro with MEDIA's gradient.
 * Files in public/brand/products, made by scripts/product-wordmarks.mjs: -light
 * (white GENESIS) for the dark theme, -dark for the light one, swapped on
 * --logo-invert like the site's own wordmark (components/genesis/genesis-mark).
 * Nova is a lockup instead (Genesis, 31 Oct 2026): Nova's thin drawn
 * capitals in one colour (components/genesis/nova-glyphs), the Brain's orb in
 * its own gradient as the O (scripts/nova-lockup.mjs).
 */
export const PRODUCTS = {
  /* Nova Copilot (Genesis, 31 Oct 2026): the NOVA lockup, then COPILOT in the gradient, set wide (scripts/nova-copilot-lockup.mjs). */
  copilot: { name: "Nova Copilot", ratio: 2162 / 290, file: "nova-copilot" },
  nova: { name: "Nova by Genesis", ratio: 1150 / 290, file: "nova-by-genesis" },
  "elite-ai": { name: "Genesis Elite AI", ratio: 1837 / 200 },
  "ai-lab": { name: "Genesis AI Lab", ratio: 1737 / 200 },
} as const;
export type Product = keyof typeof PRODUCTS;

/** Sized by its height (h-*); the width follows the file's shape. */
export function ProductWordmark({ product, className }: { product: Product; className?: string }) {
  const p: { name: string; ratio: number; file?: string } = PRODUCTS[product];
  const file = p.file ?? product;
  return (
    <span className={cn("relative block h-[14px] shrink-0", className)} style={{ aspectRatio: p.ratio }} role="img" aria-label={p.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/products/${file}-light.png`} alt="" className="absolute inset-0 size-full object-contain object-left" style={{ opacity: "calc(1 - var(--logo-invert, 0))" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/products/${file}-dark.png`} alt="" className="absolute inset-0 size-full object-contain object-left" style={{ opacity: "var(--logo-invert, 0)" }} />
    </span>
  );
}
