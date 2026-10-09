import type { CaseStudyCopy } from "@/lib/case-study-copy";
import { cn } from "@/lib/utils";

/**
 * A case study's write-up, as the master document lays it out: the result,
 * the brief, the approach, what was made, and the takeaway.
 *
 * ONE COMPONENT FOR BOTH PLACES a study is read — the dialog over the
 * homepage slider and the rows on /case-studies — so the two cannot drift
 * into telling the same campaign differently. No hooks, so it renders on
 * the server page and inside the client dialog alike.
 *
 * `compact` is for the page rows, which sit beside a film: the approach and
 * results keep their first paragraph only and the takeaway is left out.
 */
export function CaseStudyBody({
  copy,
  compact = false,
  className,
}: {
  copy: CaseStudyCopy;
  compact?: boolean;
  className?: string;
}) {
  const approach = compact ? copy.approach.slice(0, 1) : copy.approach;

  /*
    GENESIS'S WEBSITE WRITE-UPS (lib/case-study-2026) read as Genesis wrote
    them: the card line, the subtitle, the story, then the outcome as figures.
  */
  if (copy.written) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        {copy.subtitle && <p className="micro-label !text-brand-ink">{copy.subtitle}</p>}
        {copy.card && <p className="text-pretty text-lead leading-snug text-bone">{copy.card}</p>}
        {copy.outcome && copy.outcome.length > 0 && (
          <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4 sm:p-5">
            <h3 className="micro-label">{copy.outcomeLabel ?? "Outcome"}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {copy.outcome.map((item) => (
                <div key={`${item.value}-${item.label}`}>
                  <dt className="sr-only">{item.label}</dt>
                  <dd className="font-display text-h3 leading-none tracking-tight text-brand-ink">{item.value}</dd>
                  <dd className="mt-1 text-small leading-snug text-ash">{item.label}</dd>
                </div>
              ))}
            </dl>
            {copy.featured && <p className="mt-4 border-t border-[var(--glass-border)] pt-3 text-small text-bone">{copy.featured}</p>}
          </section>
        )}
        <Highlights items={copy.highlights} />
        {/*
          THE FULL STORY WHERE GENESIS'S SHEET GIVES IT (9 Oct 2026): the brief,
          the approach, what was made and the takeaway, as on the older
          studies; a write-up with only a story keeps its one block.
        */}
        <Block label={copy.approach.length ? "The brief" : "The story"} paragraphs={compact ? copy.brief.slice(0, 1) : copy.brief} />
        {!compact && <Block label="Our approach" paragraphs={copy.approach} />}
        {!compact && <Block label="Execution" paragraphs={copy.execution} />}
        {!compact && copy.executionNote && <Block label="" paragraphs={[copy.executionNote]} />}
        {!compact && copy.takeaway && <Block label="Takeaway" paragraphs={[copy.takeaway]} />}
        {!compact && <Gallery images={copy.gallery} title={copy.campaign ?? copy.brand} />}
        {!compact && <Links links={copy.links} />}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {copy.highlight && (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4">
          <p className="micro-label">Results</p>
          <p className="mt-2 text-pretty text-lead leading-snug text-brand-ink">{copy.highlight}</p>
        </div>
      )}

      {/*
        NO "INDUSTRY / WHAT WE DID" ROW. Genesis: "remove metadeta ajeeb sa."

        It was a two-cell spec sheet dropped between the result and the first
        paragraph of the story — two tracked-out eyebrow labels over two
        fragments, in the middle of a piece of writing. Both facts were
        already on the page anyway: the discipline pills above the headline
        say what the work was, and the subheadline names the brand and the
        campaign. It read as form fields in an essay.

        `industry` and `service` STAY IN THE DATA. They are what the page's
        SEO description and its CreativeWork schema are built from — see
        descriptionFor in lib/case-study-pages — so removing the fields would
        take the search result with them. This removes the printing of them,
        which is the part that was odd to look at.
      */}

      <Block label="The brief" paragraphs={copy.brief} />
      <Block label="Our approach" paragraphs={approach} />

      <section>
        <h3 className="micro-label">Execution</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {copy.execution.map((item) => (
            <li key={item} className="flex gap-2 text-body leading-relaxed text-ash">
              <span aria-hidden className="text-brand">
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
        {!compact && copy.executionNote && (
          <p className="mt-3 text-pretty text-body leading-relaxed text-ash">{copy.executionNote}</p>
        )}
      </section>

      {!compact && <Block label="Results and impact" paragraphs={copy.results} />}
      {!compact && copy.takeaway && <Block label="Takeaway" paragraphs={[copy.takeaway]} />}
      <Highlights items={copy.highlights} />
      {!compact && <Gallery images={copy.gallery} title={copy.campaign ?? copy.brand} />}
      {!compact && <Links links={copy.links} />}

      {/*
        Genesis's own note on this copy, at the foot of every study it is
        shown in — the windows and the study pages alike.
      */}
      <p className="border-t border-[var(--glass-border)] pt-4 text-micro text-faint">
        Generated using AI, might have errors.
      </p>
    </div>
  );
}

function Block({ label, paragraphs }: { label: string; paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <section>
      {label && <h3 className="micro-label">{label}</h3>}
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-pretty text-body leading-relaxed text-ash">
          <Inline text={paragraph} />
        </p>
      ))}
    </section>
  );
}

/*
  THE SHEET'S OWN MARKS, READ (Genesis, 9 Oct 2026): [words](link) becomes a
  link out (a creator's profile, the reel itself) and **words** go bold.
*/
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          return (
            <a key={index} href={link[2]} target="_blank" rel="noopener" className="text-brand-ink underline-offset-4 hover:underline">
              {link[1]}
            </a>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={index} className="font-medium text-bone">{bold[1]}</strong>;
        return part;
      })}
    </>
  );
}

/** What was delivered, where the sheet gives it in words rather than a figure. */
function Highlights({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section>
      <h3 className="micro-label">What we delivered</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3 py-1.5 text-small text-bone">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The study's stills — design pieces and photos from Genesis's folders. */
function Gallery({ images, title }: { images?: string[]; title?: string }) {
  if (!images?.length) return null;
  return (
    <section>
      <h3 className="micro-label">From the work</h3>
      {/* Columns, not a grid: the stills mix posters, slides and photos, so each keeps its own shape. */}
      <ul className="mt-3 columns-2 gap-2 sm:columns-3">
        {images.map((src, i) => (
          <li key={src} className="mb-2 break-inside-avoid overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--hover-wash)]">
            <a href={src} target="_blank" rel="noopener" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title ?? "Case study"}, still ${i + 1}`} loading="lazy" className="h-auto w-full transition-transform duration-300 hover:scale-[1.03]" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Where the work lives online: the reels, videos and pages from Genesis's sheet. */
function Links({ links }: { links?: { label: string; url: string }[] }) {
  if (!links?.length) return null;
  return (
    <section>
      <h3 className="micro-label">See it live</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-small text-brand-ink transition-colors hover:border-brand/70 hover:bg-brand/20"
            >
              {link.label}
              <span aria-hidden>↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
