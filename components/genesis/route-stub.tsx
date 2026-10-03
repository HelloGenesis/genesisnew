import Link from "next/link";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { SectionLabel } from "@/components/genesis/section-label";

/**
 * Placeholder shell for routes the navigation points at but Phase 4 has not
 * built yet.
 *
 * Its only job is to keep the homepage free of dead links — Phase 2's
 * definition of done requires working nav stubs to every route. Each of these
 * pages is replaced wholesale in Phase 4; nothing here is meant to survive.
 */
export function RouteStub({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Atmosphere tone="brand" origin="top" intensity={0.2} className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-32">
        <SectionLabel dot>{label}</SectionLabel>

        <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
          {title}
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-body leading-relaxed text-ash">
          {description}
        </p>

        <p className="mt-12 rounded-card border border-white/10 bg-white/[0.03] px-6 py-4 text-small text-faint">
          This page is a placeholder. It is built out in Phase 4, the link
          resolves today so the site has no dead ends.
        </p>

        <div className="mt-12">
          <GlassButton href="/" variant="glass" arrow>
            Back to the homepage
          </GlassButton>
        </div>

        <p className="mt-8 text-small text-faint">
          Looking for something specific?{" "}
          <Link href="/#contact" className="text-ash underline underline-offset-4">
            Get in touch
          </Link>
          .
        </p>
      </div>
    </Atmosphere>
  );
}
