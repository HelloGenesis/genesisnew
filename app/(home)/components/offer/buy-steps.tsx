import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";
import { pricingHub } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const STEP_ICONS: GlassIconName[] = ["card", "queue", "create", "repeat"];

/**
 * HOW BUYING FROM GENESIS WORKS, IN FOUR STEPS — "Subscribe or purchase",
 * "Add your briefs", "We create and deliver", "Review and publish content".
 * On the homepage's pricing strip and in every offer pop-up, pay-per-project
 * and subscription alike (Genesis, 2 Oct 2026: "add it on PPP and
 * subscription pop-up windows"). Icons and names only, read left to right.
 */
export function BuySteps({ className, row = false }: { className?: string; row?: boolean }) {
  return (
    /* `row`: one line on a phone as on the website, sliding sideways (Genesis, 4 Oct 2026). */
    <ol className={cn(row ? "no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4" : "grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {pricingHub.steps.items.map((step, index) => (
        <li
          key={step.title}
          className={cn("glass-card flex items-center gap-3 rounded-card p-3.5 sm:p-4", row && "max-sm:shrink-0 max-sm:whitespace-nowrap")}
        >
          <GlassIcon name={STEP_ICONS[index % STEP_ICONS.length]} className="size-11" />
          <span className="font-sans text-small text-bone sm:text-body">{pricingHub.steps.home[index] ?? step.title}</span>
        </li>
      ))}
    </ol>
  );
}
