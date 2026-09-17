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

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {copy.highlight && (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4">
          <p className="micro-label">Results</p>
          <p className="mt-2 text-pretty text-lead leading-snug text-brand-ink">{copy.highlight}</p>
        </div>
      )}

      <dl className="grid gap-3 text-small sm:grid-cols-2">
        <div>
          <dt className="micro-label">Industry</dt>
          <dd className="mt-1 text-ash">{copy.industry}</dd>
        </div>
        <div>
          <dt className="micro-label">What we did</dt>
          <dd className="mt-1 text-ash">{copy.service}</dd>
        </div>
      </dl>

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
    </div>
  );
}

function Block({ label, paragraphs }: { label: string; paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <section>
      <h3 className="micro-label">{label}</h3>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-pretty text-body leading-relaxed text-ash">
          {paragraph}
        </p>
      ))}
    </section>
  );
}
