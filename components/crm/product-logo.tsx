import { NovaGlyph } from "@/components/genesis/nova-glyphs";

/**
 * THE PRODUCT'S LOGO, small, on the tour's cards (Genesis, 31 Oct 2026: "this
 * should also have a logo"): NOVA's drawn letters with the orb as its O in an
 * agency's CRM, Genesis's N in its own.
 */
export function ProductLogo({ product, className = "" }: { product: string; className?: string }) {
  if (product === "Nova")
    return (
      <span aria-label="NOVA" role="img" className={`inline-flex items-center text-bone ${className}`}>
        <NovaGlyph letter="N" className="h-[0.8125rem]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/genesis-orb.png" alt="" aria-hidden className="mx-[0.1875rem] size-[1rem] scale-[1.35] object-contain" />
        <NovaGlyph letter="V" className="h-[0.8125rem]" />
        <NovaGlyph letter="A" className="ml-px h-[0.8125rem]" />
      </span>
    );
  return (
    <span aria-label="Genesis" role="img" className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 306 500" className="h-4 w-auto" aria-hidden>
        <g fill="#ffd400">
          <polygon points="30,0 306,0 306,340.7" />
          <polygon points="0,149.1 284.25,500 0,500" />
        </g>
      </svg>
      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-bone">Genesis</span>
    </span>
  );
}
