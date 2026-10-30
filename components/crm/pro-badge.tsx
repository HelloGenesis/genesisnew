import { Crown } from "lucide-react";

/** The Pro mark on what a chosen Nova plan unlocks (lib/crm/nova-pro): in the menu, on locked pages, by the storage meter. */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#c084fc] via-[#f472b6] to-[#ffc516] px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#141216] ${className}`}>
      <Crown className="size-2.5" aria-hidden /> Pro
    </span>
  );
}
