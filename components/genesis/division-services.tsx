import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";
import { Reveal } from "@/components/genesis/reveal";
import { cn } from "@/lib/utils";

/**
 * A DIVISION'S SERVICES, AS ICONS, UNDER ITS CARDS (Genesis, 4 Oct 2026:
 * "add icons for these throughout, and place them below the cards, not below
 * the logo; add more if any are missing"). The middot caption that sat under
 * each lockup on the homepage, set as a row of glass icons, with the services
 * the caption left out added after it.
 */
const SERVICES: Record<string, { label: string; icon: GlassIconName }[]> = {
  Influence: [
    { label: "Influencer Marketing", icon: "megaphone" },
    { label: "Celebrity Partnerships", icon: "star" },
    { label: "UGC", icon: "phone" },
    { label: "Creator Activations", icon: "rocket" },
    { label: "Regional Campaigns", icon: "language" },
  ],
  "Brand & Design": [
    { label: "Strategy", icon: "target" },
    { label: "Identity", icon: "brand" },
    { label: "Design", icon: "palette" },
    { label: "Campaign Creatives", icon: "images" },
    { label: "Pitch Decks", icon: "presentation" },
    { label: "Brand Guidelines", icon: "layers" },
  ],
  Studios: [
    { label: "Strategy", icon: "target" },
    { label: "Scripting", icon: "script" },
    { label: "Content Production", icon: "camera" },
    { label: "Motion Graphics", icon: "motion" },
    { label: "Editing", icon: "edit" },
    { label: "Drone Shoots", icon: "drone" },
  ],
  "AI Lab": [
    { label: "AI Content", icon: "create" },
    { label: "Avatars", icon: "avatar" },
    { label: "Voice & Localisation", icon: "voice" },
    { label: "Automation", icon: "bolt" },
    { label: "Games & Apps", icon: "grid" },
  ],
};

export function DivisionServices({ division, className }: { division: keyof typeof SERVICES; className?: string }) {
  return (
    <Reveal className={cn("mt-10", className)}>
      <ul
        aria-label={`Genesis ${division} services`}
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-3 max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-3"
      >
        {SERVICES[division].map((service) => (
          <li key={service.label} className="flex items-center gap-2.5 text-small text-bone/90">
            <GlassIcon name={service.icon} className="size-7 shrink-0" />
            {service.label}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
