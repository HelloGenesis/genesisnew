import { GlassButton } from "@/components/genesis/glass-button";
import { cn } from "@/lib/utils";

/**
 * THE DIVISION PAGES' TWO BUTTONS, AND ONLY THESE (Genesis, 2 Oct 2026: "all
 * verticals will have only 2 CTA buttons all across"): View Pricing slides
 * down to the page's own pricing section, Book a 15-min Call slides down to
 * the footer's calendar, where the time is picked. Every hero, closing band
 * and section ending on the four pages uses this pair; the buttons on a plan
 * or product card, which buy that one thing, stay as they are.
 */
export function VerticalCtas({
  size = "lg",
  stacked = false,
  className,
}: {
  size?: "md" | "lg";
  /** One above the other from lg — a closing band's side column. */
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-3", stacked && "lg:flex-col lg:items-stretch", className)}>
      <GlassButton href="#pricing" variant="brand" size={size} arrow magnetic>
        View Pricing
      </GlassButton>
      <GlassButton href="#book-a-call" variant="glass" size={size} arrow>
        Book a 15-min Call
      </GlassButton>
    </div>
  );
}
