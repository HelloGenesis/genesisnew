import { cn } from "@/lib/utils";

/**
 * GENESIS'S PRODUCTS AS WORDMARKS (Genesis, 30 Oct 2026: "make Genesis
 * Copilot, Nova and other platforms into a logo like" GENESIS MEDIA): the
 * GENESIS letters, then the product in Codec Pro with MEDIA's gradient.
 * Files in public/brand/products, made by scripts/product-wordmarks.mjs: -light
 * (white GENESIS) for the dark theme, -dark for the light one, swapped on
 * --logo-invert like the site's own wordmark (components/genesis/genesis-mark).
 */
export const PRODUCTS = {
  copilot: { name: "Genesis Copilot", ratio: 1978 / 200 },
  nova: { name: "Genesis Nova", ratio: 1667 / 200 },
  "elite-ai": { name: "Genesis Elite AI", ratio: 1837 / 200 },
  "ai-lab": { name: "Genesis AI Lab", ratio: 1737 / 200 },
} as const;
export type Product = keyof typeof PRODUCTS;

/** Sized by its height (h-*); the width follows the file's shape. */
export function ProductWordmark({ product, className }: { product: Product; className?: string }) {
  const p = PRODUCTS[product];
  return (
    <span className={cn("relative block h-[14px] shrink-0", className)} style={{ aspectRatio: p.ratio }} role="img" aria-label={p.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/products/${product}-light.png`} alt="" className="absolute inset-0 size-full object-contain object-left" style={{ opacity: "calc(1 - var(--logo-invert, 0))" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/products/${product}-dark.png`} alt="" className="absolute inset-0 size-full object-contain object-left" style={{ opacity: "var(--logo-invert, 0)" }} />
    </span>
  );
}
