"use client";

import { GlassButton } from "@/components/genesis/glass-button";
import { bookingHref, homePlans, verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/** The homepage work filter each division's "Case Studies" selects — the chip's own name. */
const WORK_FILTER: Record<VerticalKey, string> = {
  "ai-labs": "AI Lab",
  studios: "Studios",
  "brand-design": "Brand & Design",
  influence: "Influence",
};

/**
 * EVERY DIVISION'S THREE WAYS ON (Genesis, 2 Oct 2026): "View AI Labs" (the
 * division's own page, by its name), "Book a 15-min Call", and Case Studies,
 * which scrolls to the homepage's case studies with that division's filter
 * already chosen. The "Explore Pricing" menu came off: the division's bar now
 * shows its subscriptions and pay-per-project cards with their prices.
 */
export function DivisionCtas({
  vertical,
  size = "md",
  align = "start",
  primaryOnly = false,
  className,
}: {
  vertical: VerticalKey;
  size?: "sm" | "md";
  align?: "start" | "center";
  /** Just "View …", no call or case-studies button (the homepage AI Lab panel, Genesis, 4 Oct 2026). */
  primaryOnly?: boolean;
  /** Kept so existing callers compile; there is no menu to open any more. */
  opens?: "down" | "up";
  className?: string;
}) {
  /*
    ONE ROW ON A PHONE (Genesis, 4 Oct 2026: "put these buttons on one line on
    phone"): three equal buttons with short labels; the arrows step aside so
    the words fit. Tablet and up keep the full labels.
  */
  const small = cn(
    size === "sm" && "max-sm:h-10 max-sm:text-small",
    "max-sm:h-11 max-sm:w-full max-sm:justify-center max-sm:px-2 max-sm:text-[0.8125rem] max-sm:[&_svg]:hidden",
  );
  const card = verticalCard(vertical);
  const division = card.name.replace(/^Genesis\s+/, "");

  return (
    <div
      className={cn(
        primaryOnly ? "flex" : "grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3",
        align === "center" && "sm:justify-center",
        className,
      )}
      data-track={`division-ctas:${vertical}`}
    >
      <GlassButton href={homePlans[vertical].page} pageLink variant="brand" arrow className={small}>
        <span className={primaryOnly ? "hidden" : "sm:hidden"}>Explore</span>
        <span className={primaryOnly ? undefined : "hidden sm:inline"}>View {division}</span>
      </GlassButton>
      {!primaryOnly && (
      <>
      <GlassButton href={bookingHref(division)} variant="glass" arrow className={small}>
        <span className="sm:hidden">Book a call</span>
        <span className="hidden sm:inline">Book a 15-min Call</span>
      </GlassButton>
      <GlassButton href="/#library" selectsFilter={WORK_FILTER[vertical]} variant="glass" arrow className={small}>
        <span className="sm:hidden">Case studies</span>
        <span className="hidden sm:inline">Case Studies</span>
      </GlassButton>
      </>
      )}
    </div>
  );
}

/**
 * A PHONE'S PAIR: the division's page and a call, side by side, set between
 * a division's work and its plan box (Genesis, 6 Oct 2026). The plan box's
 * own "View …" button is hidden on a phone where this stands.
 */
export function PhoneDivisionCtas({ vertical, className }: { vertical: VerticalKey; className?: string }) {
  const division = verticalCard(vertical).short;
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:hidden", className)}>
      <GlassButton href={homePlans[vertical].page} pageLink variant="brand" arrow className="h-11 w-full justify-center px-3 text-[0.8125rem]">
        View {division}
      </GlassButton>
      <GlassButton href={bookingHref(division)} variant="glass" arrow className="h-11 w-full justify-center px-3 text-[0.8125rem]">
        Book a call
      </GlassButton>
    </div>
  );
}
