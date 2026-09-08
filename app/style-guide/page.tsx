import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe, Sparkles, Target, Users } from "lucide-react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { AnimatedTimeline } from "@/components/genesis/animated-timeline";
import { GenesisMark, GenesisN } from "@/components/genesis/genesis-mark";
import { GlassButton } from "@/components/genesis/glass-button";
import { LogoMarquee } from "@/components/genesis/logo-marquee";
import { OrbitingCards } from "@/components/genesis/orbiting-cards";
import { PaperCard, PaperStack } from "@/components/genesis/paper-card";
import { PosterRail, type Poster } from "@/components/genesis/poster-card";
import { SectionLabel } from "@/components/genesis/section-label";
import { StatCard, StatRow } from "@/components/genesis/stat-card";
import { ContactForm } from "@/components/genesis/contact-form";
import { Reel } from "@/components/genesis/reel";
import { SocialStars } from "@/components/genesis/social-stars";
import { DocumentWall } from "@/components/genesis/document-wall";
import { FloatingPapers } from "@/components/genesis/floating-papers";
import { GlowWord, IridescentButton } from "@/components/genesis/glow-word";
import { LitRoom } from "@/components/genesis/lit-room";
import { PaperVortex } from "@/components/genesis/paper-vortex";
import { CornerNote, GhostType, Spotlight } from "@/components/genesis/spotlight";
import { StandingFigure } from "@/components/genesis/standing-figure";
import { ToolsStack } from "@/components/genesis/tools-stack";
import { WatchCluster } from "@/components/genesis/watch-cluster";
import { SegmentDemo } from "./segment-demo";

/**
 * Development-only style guide.
 *
 * Renders every shared component in isolation so the design system can be
 * reviewed without the homepage around it. Not linked from any navigation and
 * returns 404 in production — it is a workbench, not a page.
 */

export const metadata: Metadata = {
  title: "Style Guide",
  robots: { index: false, follow: false },
};

const POSTERS: Poster[] = [
  { id: "kayali", client: "Kayali", title: "Product Reel", category: "Reel", meta: ["2025", "0:45"] },
  { id: "tata", client: "Tata Motors", title: "Brand Film", category: "Film", meta: ["2025", "2:10"] },
  { id: "icici", client: "ICICI Bank", title: "Brand Story", category: "Brand Story", meta: ["2024"] },
  { id: "miraggio", client: "Miraggio", title: "Lifestyle Reel", category: "Reel", meta: ["2025"] },
  { id: "yonex", client: "Yonex", title: "Ad Film", category: "Ad Film", meta: ["2024", "1:30"] },
];

export default function StyleGuidePage() {
  // Workbench only — never expose the component inventory in production.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh bg-ink pb-32">
      <div className="mx-auto max-w-6xl px-6 pt-24">
        <SectionLabel dot>Phase 1 · Design system</SectionLabel>
        <h1 className="mt-4 text-h2 font-normal tracking-tight text-bone">
          Genesis <span className="font-serif italic text-brand-ink">style guide</span>
        </h1>
        <p className="mt-3 max-w-2xl text-small leading-relaxed text-ash">
          Every shared component in isolation. Dev-only route — returns 404 in
          production and is not linked from any navigation.
        </p>
      </div>

      <Section title="Colour tokens" note="Crimson is the brand accent, taken from existing Genesis artwork (img-012/013). Amber carries the light-on-paper motif. Teal comes from the brief and is not evidenced in the references.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            ["void", "#08080a"],
            ["ink", "#0a0a0b"],
            ["elevated", "#131316"],
            ["raised", "#1c1a20"],
            ["brand", "#ffc516"],
            ["brand-deep", "#e0ad13"],
            ["brand", "#ffc516"],
            ["brand-soft", "#ffdc72"],
            ["brand", "#ffc516"],
            ["bone", "#f5f5f4"],
            ["ash", "#a3a3a3"],
            ["faint", "#6b6b70"],
          ].map(([name, hex]) => (
            <div key={name} className="rounded-card border border-white/10 p-2">
              <div
                className="h-14 w-full rounded-field border border-white/10"
                style={{ backgroundColor: hex }}
              />
              <p className="mt-2 text-micro font-medium text-bone">{name}</p>
              <p className="text-micro text-faint">{hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-6">
          <SectionLabel dot>Micro label · letterspaced caps</SectionLabel>
          <h2 className="text-h1 font-normal tracking-tight text-bone">
            Built for the <span className="font-serif italic text-brand-ink">thinkers</span>
          </h2>
          <h3 className="text-fade-down text-h2 font-normal tracking-tight">
            Two-tone headline treatment
          </h3>
          <p className="max-w-prose text-small leading-relaxed text-ash">
            Body copy sits at ash on ink. Line length is capped near 65
            characters so long-form sections stay readable at desktop widths.
          </p>
        </div>
      </Section>

      <Section title="Glass surfaces" note="One UI 'Blur' — heavy blur, low-contrast fill, lit top edge. Not the iOS 'Clear' style.">
        <div className="relative overflow-hidden rounded-panel">
          {/* A busy ground so the blur has something to actually blur. */}
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg,#ffc516,#ffc516,#ffc516,#ffc516)] opacity-40 blur-2xl" />
          <div className="relative grid gap-4 p-8 sm:grid-cols-3">
            <div className="glass rounded-card p-6 text-small text-bone">.glass</div>
            <div className="glass glass-lit rounded-card p-6 text-small text-bone">
              .glass .glass-lit
            </div>
            <div className="glass glass-strong glass-lit rounded-card p-6 text-small text-bone">
              .glass-strong
            </div>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <GlassButton variant="brand" arrow>Contact us</GlassButton>
          <GlassButton variant="luminous">Schedule a call</GlassButton>
          <GlassButton variant="glass" arrow>Start a project</GlassButton>
          <GlassButton variant="ghost">Learn more</GlassButton>
          <GlassButton variant="brand" size="lg" arrow magnetic>
            Magnetic CTA
          </GlassButton>
          <GlassButton variant="glass" size="sm">Small</GlassButton>
        </div>
        <div className="mt-8">
          <SegmentDemo />
        </div>
      </Section>

      <Section title="Brand mark" note="Placeholder, reconstructed from the references. Replace when real logo files land.">
        <div className="flex flex-wrap items-center gap-12">
          <GenesisMark />
          <GenesisN className="size-8" />
        </div>
      </Section>

      <Section title="Stat card & stat row">
        <div className="space-y-6">
          <StatCard
            value="1,00,000+"
            label="Influencer database"
            description="A curated network of creators across every niche and platform."
            icon={<Users className="size-6" />}
            action={<GlassButton variant="ghost" size="sm">→</GlassButton>}
            className="max-w-xl"
          />
          <StatRow
            stats={[
              { value: "500+", label: "Campaigns executed", icon: <Target className="size-5" /> },
              { value: "200+", label: "Brands partnered", icon: <Sparkles className="size-5" /> },
              { value: "50M+", label: "Content reach", icon: <Globe className="size-5" /> },
              { value: "20+", label: "Platforms covered", icon: <Globe className="size-5" /> },
            ]}
          />
          <p className="text-small text-faint">
            Figures here are sample values, shown to demonstrate the count-up and
            the bar&apos;s layout. Real numbers live in lib/home-content.ts.
          </p>
        </div>
      </Section>

      <Section title="Movie-poster case-study card" note="Drag or scroll the rail. Placeholder artwork is generated from each id.">
        <PosterRail posters={POSTERS} />
      </Section>

      <Section title="Orbiting / draggable cards" note="Orbit pauses on hover; each card can be dragged off and snaps back.">
        <OrbitingCards
          items={[
            { id: "1", label: "Travel Creator", sublabel: "856K followers" },
            { id: "2", label: "Fitness Creator", sublabel: "2.4M followers", accent: "brand" },
            { id: "3", label: "Lifestyle Creator", sublabel: "1.2M followers" },
            { id: "4", label: "Finance Creator", sublabel: "1.1M followers", accent: "brand" },
            { id: "5", label: "Fashion Creator", sublabel: "947K followers" },
          ]}
          center={
            <div className="glass glass-lit grid size-24 place-items-center rounded-full">
              <GenesisN className="size-8" />
            </div>
          }
        />
      </Section>

      <Section title="Animated timeline" note="The lit rail fills as the section scrolls.">
        <AnimatedTimeline
          milestones={[
            { date: "Mar 2024", title: "Genesis founded", description: "Sample copy — a one-line milestone, long enough to show how the description wraps beneath its title." },
            { date: "Aug 2024", title: "First brand film", description: "Sample copy — a shorter entry, to show the rail with uneven row heights." },
            { date: "Feb 2025", title: "Creator network at 50K", description: "Sample copy — used here only to demonstrate the timeline component." },
            { date: "Nov 2025", title: "AI Lab launched", description: "Sample copy — the final entry, where the rail fades out." },
          ]}
        />
      </Section>

      <Section title="Magnetic floating paper cards" note="The connective motif — paper caught in a single light.">
        <div className="space-y-12">
          <div className="flex flex-wrap gap-8">
            <PaperCard pinned className="w-64">
              <p className="micro-label mb-2">Pinned</p>
              <p className="text-small text-ash">
                Hover to straighten and lift. Rotation resets on approach.
              </p>
            </PaperCard>
            <PaperCard tone="brand" rotate={2.5} className="w-64">
              <p className="micro-label mb-2">Crimson sheen</p>
              <p className="text-small text-ash">Directional light along the top edge.</p>
            </PaperCard>
          </div>
          <PaperStack
            items={[
              { title: "Preparation", caption: "research, inspiration", body: "Sample copy, at roughly the length a real step runs to, so the card's height and text block can be judged." },
              { title: "Incubation", caption: "letting ideas simmer", body: "Sample copy — deliberately shorter, to show the cards at uneven heights." },
              { title: "Illumination", caption: "refine & execute", body: "Sample copy for the third card in the row." },
            ]}
          />
        </div>
      </Section>

      <Section title="Logo marquee" note="Seamless loop; pauses on hover. Takes any node — the client wall passes logo chips; these wordmarks are just a demo.">
        <LogoMarquee
          items={["KAYALI", "TATA MOTORS", "ICICI BANK", "MIRAGGIO", "YONEX", "KREO TECH", "DOT & KEY"].map(
            (name) => (
              <span
                key={name}
                className="whitespace-nowrap px-6 text-h3 font-semibold tracking-[0.12em] text-bone/35"
              >
                {name}
              </span>
            ),
          )}
        />
      </Section>

      <Section title="Reel" note="Muted, looping, controlless — the spec's 'playing on their own like a GIF'. Without a src it renders a labelled frame, so layout is correct before footage exists. Does NOT autoplay under prefers-reduced-motion.">
        <div className="grid gap-6 sm:grid-cols-3">
          <Reel label="Showreel" aspect="4 / 5" />
          <Reel label="Behind the scenes" aspect="1 / 1" />
          <Reel label="Client film" aspect="16 / 9" />
        </div>
      </Section>

      <Section title="Social stars" note="The lockup's four-point star as a clip-path, so the hover bloom takes the star's silhouette. Marks drawn inline — lucide v1 dropped its brand icons.">
        <SocialStars />
      </Section>

      <Section title="Scene primitives" note="Spotlight, ghosted display type and editorial corner marks — the language the reference layouts are built from.">
        <div className="relative h-80 overflow-hidden rounded-card bg-void">
          <Spotlight x={62} spread={16} tone="warm" />
          <GhostType>OUR SERVICES</GhostType>
          <div className="relative z-[2] flex h-full items-end justify-between p-6">
            <p className="micro-label">Spotlight + GhostType</p>
            <CornerNote index="Services">
              The corner annotation, as used across the reference layouts.
            </CornerNote>
          </div>
        </div>
      </Section>

      <Section title="Lit room" note="An interior drawn entirely as alpha — no clip-paths, no CSS filters. Walls are a lateral falloff; the floor is an ellipse centred below the frame.">
        <div className="relative h-96 overflow-hidden rounded-card">
          <LitRoom />
        </div>
      </Section>

      <Section title="Standing figure" note="Drawn silhouette in an oversized suit, lit from directly above. Cloth nap and a feathered outline; nothing in a hazy room has a razor edge.">
        <div className="relative flex h-80 items-end justify-center overflow-hidden rounded-card bg-void pb-6">
          <LitRoom />
          <div className="relative z-[2] h-56">
            <StandingFigure className="h-full" />
          </div>
        </div>
      </Section>

      <Section title="Paper vortex" note="Every sheet is a post link. Posts repeat around the cloud when there are fewer than sheets. Magnetic: the cursor is a field over the whole scene.">
        <div className="overflow-hidden rounded-card bg-void">
          <PaperVortex
            sheets={34}
            posts={[
              { slug: "ai-content-workflows", title: "What AI actually replaced in our pipeline", category: "AI" },
              { slug: "ai-avatars-in-campaigns", title: "AI avatars are useful. Just not for what most brands ask.", category: "AI" },
              { slug: "creative-process", title: "How a Genesis campaign actually gets made", category: "Inside Genesis" },
            ]}
          />
        </div>
      </Section>

      <Section title="Document wall" note="The curved wall of lit panels from the page-1 landing reference. Pure CSS — no images.">
        <div className="relative h-72 overflow-hidden rounded-card bg-void">
          <DocumentWall tone="brand" />
        </div>
      </Section>

      <Section title="Apple Watch cluster" note='Spec asks for this twice — client logos "movable like Apple Watch Apps" and testimonials the same. Drag it.'>
        <WatchCluster
          height={360}
          cell={130}
          items={["KAYALI", "TATA MOTORS", "HDFC", "ICICI BANK", "YONEX", "MIRAGGIO", "KREO TECH"].map((logo) => ({
            id: logo,
            content: (
              <div className="glass glass-lit grid size-24 place-items-center rounded-panel p-3 text-center">
                <span className="text-micro font-semibold tracking-[0.1em] text-bone/70">
                  {logo}
                </span>
              </div>
            ),
          }))}
        />
      </Section>

      <Section title="Floating papers" note="The blog-teaser treatment: sheets that drift and straighten under the cursor.">
        <FloatingPapers
          papers={[
            { href: "/blog", eyebrow: "AI", title: "What AI actually replaced in our pipeline", description: "Not the ideas, and not the edit.", footnote: "5 min read" },
            { href: "/blog?demo=2", eyebrow: "Playbook", title: "Why most UGC underperforms", description: "And the three fixes that change it.", footnote: "8 min read" },
            { href: "/blog?demo=3", eyebrow: "Inside Genesis", title: "How a campaign actually gets made", description: "Including the unglamorous parts.", footnote: "4 min read" },
          ]}
        />
      </Section>

      <Section title="Tools stack" note="Many inputs converging on one output. One SVG, a shared gradient, a stroke-dashoffset pulse.">
        <ToolsStack
          destination="Genesis.AILab"
          badge="Lab"
          tools={[
            { label: "Image generation", detail: "stills & keyframes" },
            { label: "Video generation", detail: "motion & b-roll" },
            { label: "AI avatars", detail: "presenters" },
            { label: "Voice & dubbing", detail: "multi-language" },
            { label: "Edit & post", detail: "assembly" },
          ]}
        />
      </Section>

      <Section title="Glowing word & iridescent button" note="The waitlist treatment: one word lit from within, held in glass. Emission is text-shadow, not a filter — filters rasterise the whole word.">
        <div className="flex flex-col items-center gap-12 rounded-card bg-void py-16">
          <GlowWord tone="warm" className="text-h2 sm:text-h1">
            waitlist
          </GlowWord>
          <IridescentButton href="#">Join waitlist now</IridescentButton>
        </div>
      </Section>

      <Section title="Contact form" note="Zod-validated server action, rate limited, honeypot-protected. Errors mirror back per field.">
        <div className="max-w-2xl">
          <ContactForm type="CONTACT" source="/style-guide" submitLabel="Send" />
        </div>
      </Section>

      <Section title="Atmosphere" note="Dark ground + one directional light + grain. Sections compose this rather than repeating it.">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["brand", "brand", "brand"] as const).map((tone) => (
            <Atmosphere key={tone} tone={tone} origin="top-right" className="rounded-card">
              <div className="flex h-40 items-end p-6">
                <span className="micro-label">{tone}</span>
              </div>
            </Atmosphere>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-6">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2 className="text-h3 font-normal tracking-tight text-bone">{title}</h2>
        {note && <p className="mt-2 max-w-2xl text-small leading-relaxed text-faint">{note}</p>}
      </div>
      {children}
    </section>
  );
}
