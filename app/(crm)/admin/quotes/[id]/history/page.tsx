import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, Empty, PageHead } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { dateTime } from "@/lib/crm/catalog";
import { docRef } from "@/lib/crm/quote-templates";
import { quoteScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

const WHAT: Record<string, string> = {
  "quote.created": "Created",
  "quote.saved": "Saved changes",
  "quote.sent": "Sent to the client",
  "quote.revised": "Revision made",
  "quote.status": "Client's answer recorded",
};

/**
 * CHANGE HISTORY (Genesis, 29 Oct 2026): every save of this quote and its
 * revisions, newest first, with who and what changed (lib/crm/quote-history).
 * Saves from before 29 Oct 2026 weren't recorded.
 */
export default async function QuoteHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff("plans");
  const { id } = await params;
  const prisma = getPrisma();
  const q = await prisma.quote.findFirst({ where: { id, ...quoteScope(viewer) }, select: { id: true, kind: true, title: true, number: true, baseNumber: true, revision: true, revisionOfId: true } });
  if (!q) notFound();
  const rootId = q.revisionOfId ?? q.id;
  const versions = await prisma.quote.findMany({
    where: { OR: [{ id: rootId }, { revisionOfId: rootId }], ...quoteScope(viewer) },
    orderBy: { revision: "asc" },
    select: { id: true, number: true, baseNumber: true, revision: true, createdAt: true, createdById: true, sentAt: true, viewedAt: true, acceptedAt: true, acceptedBy: true },
  });
  const ref = new Map(versions.map((v) => [v.id, docRef(v)]));
  const logs = await prisma.auditLog.findMany({
    where: { entity: "quote", entityId: { in: versions.map((v) => v.id) }, action: { in: Object.keys(WHAT) } },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { actor: { select: { name: true, email: true } } },
  });
  const makers = await prisma.user.findMany({ where: { id: { in: versions.map((v) => v.createdById).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, email: true } });
  const maker = new Map(makers.map((u) => [u.id, u.name ?? u.email]));

  type Entry = { at: Date; version: string; what: string; who: string | null; changes: string[] };
  const entries: Entry[] = logs.map((l) => {
    const m = (l.metadata ?? {}) as { changes?: string[]; status?: string; revision?: number };
    return {
      at: l.createdAt,
      version: ref.get(l.entityId ?? "") ?? "",
      what: l.action === "quote.status" ? (m.status === "ACCEPTED" ? "Marked accepted" : "Marked declined") : l.action === "quote.revised" ? `Revision R${m.revision ?? ""} made` : WHAT[l.action],
      who: l.actor?.name ?? l.actor?.email ?? null,
      changes: Array.isArray(m.changes) ? m.changes : [],
    };
  });
  /* What the quote itself remembers: when each version was made and what the client did. */
  for (const v of versions) {
    if (!logs.some((l) => l.entityId === v.id && (l.action === "quote.created" || l.action === "quote.revised"))) entries.push({ at: v.createdAt, version: docRef(v), what: v.revision ? `Revision R${v.revision} made` : "Created", who: v.createdById ? (maker.get(v.createdById) ?? null) : null, changes: [] });
    if (v.viewedAt) entries.push({ at: v.viewedAt, version: docRef(v), what: "Opened by the client", who: null, changes: [] });
    if (v.acceptedAt && v.acceptedBy && !v.acceptedBy.startsWith("Recorded by")) entries.push({ at: v.acceptedAt, version: docRef(v), what: "Accepted by the client", who: v.acceptedBy, changes: [] });
  }
  entries.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <>
      <PageHead kicker={`${q.kind === "INFLUENCER_PLAN" ? "Influencer plan" : "Price quote"} ${docRef(q)} · change history`} title={q.title} sub={versions.length > 1 ? `All ${versions.length} versions, newest first.` : "Every change, newest first."}>
        <Link href={`/admin/quotes/${q.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">← Back to the {q.kind === "INFLUENCER_PLAN" ? "plan" : "quote"}</Link>
      </PageHead>
      {entries.length === 0 ? (
        <Empty>No changes recorded yet. Changes are recorded from 29 Oct 2026, each time someone saves.</Empty>
      ) : (
        <Card>
          <ol className="divide-y divide-[var(--glass-border)]">
            {entries.map((e, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem]">
                  <span className="font-medium text-bone">{e.what}</span>
                  {versions.length > 1 && <Badge>{e.version}</Badge>}
                  <span className="text-ash">{e.who ? `${e.who} · ` : ""}{dateTime(e.at)}</span>
                </div>
                {e.changes.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[0.875rem] text-ash">
                    {e.changes.map((c, j) => <li key={j}>{c}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
