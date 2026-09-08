import Image from "next/image";
import Link from "next/link";

import { GlassButton } from "@/components/genesis/glass-button";
import { isPending } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { filmUrl } from "@/lib/films";
import {
  CLIP_LABELS,
  hasStory,
  reelClip,
  reelPoster,
  type WorkItem,
} from "@/lib/work";
import { VIDEO_GUARD } from "@/lib/video-guard";

/**
 * One project, rendered identically whether it arrived as a modal over the
 * grid or as its own page at /work/<slug>.
 *
 * ONE COMPONENT FOR BOTH, deliberately. The brief wants a project to open as
 * an immersive popup while browsing AND to have a permanent shareable URL —
 * which is two presentations of one thing, and the fastest way to make them
 * disagree is to write them twice.
 *
 * IT OMITS WHAT IS NOT WRITTEN. Objective, ask, approach, execution and
 * results are all still to come from Genesis, and every block below
 * disappears when its field is pending rather than printing a placeholder.
 * These are real clients: a heading reading "Results" over invented numbers
 * beside Mahindra's name is a claim about Mahindra, not a layout detail. What
 * the visitor sees today is the work, the client and the vertical; what they
 * will see once the copy lands is the full case study, with no code change.
 */
export function WorkDetail({ item }: { item: WorkItem }) {
  const story = hasStory(item);
  /*
    The rest of the reel — everything after the one already playing above.
    Aditya Birla Capital is eighteen clips and Mahindra Finance five; showing
    the lead and silently dropping the other seventeen was the state of this
    page the moment the footage was connected.
  */
  const rest = (item.reel ?? []).slice(1);

  return (
    <article className="flex flex-col gap-8">
      {/* The piece itself, first and large. */}
      <figure className="relative overflow-hidden rounded-panel border border-[var(--glass-border)] bg-ink">
        {/*
          object-CONTAIN, and the height is still clamped.

          This was object-cover in a landscape box, and every film in the
          catalogue is 1080x1920 — so the player took a wide slice out of the
          middle of a portrait video and threw the rest away. On House of
          Hiranandani that meant a strip of balcony where the building was.
          Genesis was right that the ratio was wrong; cover is for artwork you
          are cropping deliberately, and a film is not that.

          Contain letterboxes instead, which is what every video player does
          with mixed aspect ratios and costs nothing but the black at the
          sides. The clamp stays, because an aspect ratio cannot know how tall
          the screen is and this window has to fit a laptop.
        */}
        <div className="relative h-[clamp(16rem,52vh,34rem)] w-full">
          {item.clip ? (
            <video
              /*
                THE FULL FILM WHERE THERE IS ONE. `item.clip` is the four-second
                preview cut for hover; playing it here is why every video on the
                site was four seconds long. filmUrl returns the master out of
                Drive when that is switched on, and undefined when it is not —
                in which case this is exactly what it was before.
              */
              src={(item.reel?.[0] && filmUrl(item.reel[0])) || item.clip}
              poster={item.poster ?? item.art}
              controls
              playsInline
              preload="metadata"
              {...VIDEO_GUARD}
              className="absolute inset-0 size-full object-contain"
            />
          ) : item.art ? (
            <Image
              src={item.art}
              alt={`${item.client} — ${item.title}`}
              fill
              // Sits in a max-w-4xl column, full width below that.
              sizes="(min-width: 896px) 896px, 100vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(150deg,rgb(255_255_255/0.06),transparent_60%)] p-8">
              <span className="text-balance text-center text-h2 font-normal tracking-tight text-bone/80">
                {item.client}
              </span>
            </div>
          )}
        </div>
      </figure>

      {/*
        WHY THESE ARE `preload="none"` AND NOT AUTOPLAYING. Eighteen tiles is
        eighteen files and eighteen decoders if they all start on load, on a
        page the visitor opened to read a case study. Each one shows its
        poster, costs nothing until it is clicked, and carries its own
        controls — which is also what makes them reachable by keyboard,
        unlike the hover playback on the grid.
      */}
      {rest.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="micro-label">
            More from this {rest.length + 1 > 6 ? "campaign" : "set"} ·{" "}
            {String(rest.length + 1).padStart(2, "0")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map((n) => (
              <li key={n} className="flex flex-col gap-2">
                <video
                  src={filmUrl(n) ?? mediaUrl(reelClip(n))}
                  poster={mediaUrl(reelPoster(n))}
                  muted
                  loop
                  playsInline
                  controls
                  preload="none"
                  {...VIDEO_GUARD}
                  className="aspect-[9/16] w-full rounded-card border border-[var(--glass-border)] bg-ink object-cover"
                />
                {/*
                  Only where the file told us what it is. The first thirty-two
                  clips have no name of their own, and a caption reading
                  "Clip 14" is worse than no caption.
                */}
                {CLIP_LABELS[n] && (
                  <p className="text-micro leading-snug text-ash">
                    {CLIP_LABELS[n]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="micro-label text-brand-ink">{item.vertical}</span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span className="micro-label !text-faint">{item.format}</span>
        </div>
        <h1 className="text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
          {item.client}
        </h1>
        <p className="text-lead leading-relaxed text-ash">{item.title}</p>
      </header>

      {story && (
        <div className="flex flex-col gap-6 border-t border-[var(--glass-border)] pt-8">
          <Block heading="Objective" body={item.objective} />
          <Block heading="The ask" body={item.ask} />
          <Block heading="Our approach" body={item.approach} />

          {item.whatWeDid && item.whatWeDid.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="micro-label">What we did</h2>
              <ul className="flex flex-wrap gap-2">
                {item.whatWeDid.map((entry) => (
                  <li
                    key={entry}
                    className="glass-chip rounded-full px-3 py-1.5 text-small text-bone"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Block heading="Execution" body={item.execution} />

          {item.results && item.results.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="micro-label">Results</h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-[var(--glass-border)] sm:grid-cols-3">
                {item.results.map((result) => (
                  <div
                    key={result.label}
                    className="flex flex-col gap-1 bg-ink p-4"
                  >
                    <dt className="micro-label !text-faint">{result.label}</dt>
                    <dd className="text-h3 font-normal tracking-tight text-bone">
                      {result.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-3 border-t border-[var(--glass-border)] pt-8">
        {/*
          The case-study link appears only when there is a case study. A "View
          Full Case Study" button that goes nowhere is the single most
          annoying thing a portfolio can do to someone evaluating an agency.
        */}
        {item.caseStudyHref && (
          <GlassButton href={item.caseStudyHref} variant="brand" arrow>
            View full case study
          </GlassButton>
        )}
        <GlassButton href="/#contact" variant="glass" arrow>
          Start a project
        </GlassButton>
        <Link
          href="/our-work"
          className="rounded-full px-3 py-2 text-small text-ash underline-offset-4 transition-colors hover:text-bone hover:underline"
        >
          All work
        </Link>
      </footer>
    </article>
  );
}

function Block({ heading, body }: { heading: string; body?: string }) {
  if (isPending(body)) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="micro-label">{heading}</h2>
      <p className="max-w-2xl text-body leading-relaxed text-ash">{body}</p>
    </section>
  );
}
