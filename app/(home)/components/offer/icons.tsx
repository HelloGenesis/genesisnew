import {
  AudioLines,
  Box,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CirclePlay,
  Clock,
  Drone,
  Eye,
  FileText,
  HeartPulse,
  House,
  Images,
  Languages,
  Layers,
  LayoutGrid,
  Lightbulb,
  ListPlus,
  Mail,
  Megaphone,
  Music,
  Palette,
  Plus,
  Presentation,
  RefreshCw,
  Rocket,
  Scissors,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Type,
  Upload,
  UserRound,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { IconName } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

/** The one map from the copy files' icon names to glyphs. */
const ICONS: Record<IconName, LucideIcon> = {
  idea: Lightbulb,
  brand: Box,
  avatar: UserRound,
  voice: AudioLines,
  sound: Music,
  motion: CirclePlay,
  text: Type,
  palette: Palette,
  delivery: Upload,
  script: FileText,
  camera: Camera,
  edit: Scissors,
  queue: ListPlus,
  create: Sparkles,
  review: Eye,
  repeat: RefreshCw,
  calendar: CalendarDays,
  images: Images,
  video: Video,
  bolt: Zap,
  layers: Layers,
  users: Users,
  star: Star,
  target: Target,
  building: Building2,
  heart: HeartPulse,
  home: House,
  bag: ShoppingBag,
  rocket: Rocket,
  megaphone: Megaphone,
  briefcase: BriefcaseBusiness,
  language: Languages,
  presentation: Presentation,
  mail: Mail,
  grid: LayoutGrid,
  sparkles: Sparkles,
  drone: Drone,
  clock: Clock,
  check: Check,
  plus: Plus,
};

export function OfferIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className={cn("size-5 shrink-0", className)} strokeWidth={1.6} />;
}

/**
 * The icon in its tile — a small brand-tinted square, the treatment every
 * card in the brief's mockups opens with.
 */
export function IconTile({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-card border border-brand/30 bg-brand/10 text-brand-ink",
        className,
      )}
    >
      <OfferIcon name={name} className="size-[1.125rem]" />
    </span>
  );
}
