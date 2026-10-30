import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A VERTICAL LIST THAT OPENS ONE ROW AT A TIME (Genesis, 31 Oct 2026: "make
 * this vertical, dropdown based"), for the Nova page's features and
 * questions. Native <details> under one `name`, so the browser opens one and
 * closes the others with no script, keys work, and the answers stay in the
 * page for search. The first can start open.
 */
export function Accordion({ items, name, openFirst = false, className }: { items: readonly (readonly [string, string])[]; name: string; openFirst?: boolean; className?: string }) {
  return (
    <div className={cn("divide-y divide-[var(--glass-border)] overflow-hidden rounded-card border border-[var(--glass-border)] bg-[var(--glass-fill)]", className)}>
      {items.map(([title, body], i) => (
        <details key={title} name={name} open={openFirst && i === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-body font-semibold leading-snug text-bone transition-colors hover:bg-[var(--hover-wash)] [&::-webkit-details-marker]:hidden">
            {title}
            <Plus className="size-5 shrink-0 text-ash transition-transform duration-300 group-open:rotate-45 group-open:text-[#ffc516]" aria-hidden />
          </summary>
          <p className="-mt-1 max-w-3xl px-6 pb-5 text-pretty text-body leading-relaxed text-ash">{body}</p>
        </details>
      ))}
    </div>
  );
}
