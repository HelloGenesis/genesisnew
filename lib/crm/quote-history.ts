import "server-only";

import { getPrisma } from "@/lib/db";

import { money } from "./catalog";

/**
 * A QUOTE'S CHANGE HISTORY (Genesis, 29 Oct 2026: "a history button where
 * all previous changes are visible"). Each save is compared with the quote as
 * it was, and what changed is written in plain words on the audit log
 * (action "quote.saved"). Contact details are never written there, only that
 * they changed: the history is seen by everyone who can open the quote.
 */
export async function quoteSnap(id: string) {
  return getPrisma().quote.findUnique({
    where: { id },
    include: { lines: { orderBy: { position: "asc" } }, creators: { orderBy: { position: "asc" } }, account: { select: { name: true } } },
  });
}

type Snap = NonNullable<Awaited<ReturnType<typeof quoteSnap>>>;

const plain = (html: string | null | undefined) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const short = (v: string, n = 60) => (v.length > n ? `${v.slice(0, n - 1)}…` : v);
const rs = (v: number | null | undefined) => (v === null || v === undefined ? "blank" : money(v));
const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function describeChanges(a: Snap, b: Snap): string[] {
  const out: string[] = [];
  const field = (label: string, x: string, y: string) => x !== y && out.push(`${label}: ${short(x || "blank")} → ${short(y || "blank")}`);
  field("Title", a.title, b.title);
  field("Client", a.account?.name ?? a.company ?? "", b.account?.name ?? b.company ?? "");
  if (a.contactName !== b.contactName || a.contactEmail !== b.contactEmail || a.contactPhone !== b.contactPhone) out.push("Client contact details changed");
  field("Valid until", day(a.expiresAt), day(b.expiresAt));
  field("Discount", rs(a.discountPaise), rs(b.discountPaise));
  if (a.addGst !== b.addGst) out.push(b.addGst ? "GST added" : "GST taken off");
  else if (a.gstPercent !== b.gstPercent) field("GST", `${a.gstPercent}%`, `${b.gstPercent}%`);
  if (a.igst !== b.igst) out.push(b.igst ? "Changed to IGST" : "Changed to CGST + SGST");
  if (a.markupPercent !== b.markupPercent) field("Markup", `${a.markupPercent}%`, `${b.markupPercent}%`);
  field("Budget line", a.planBudget ?? "", b.planBudget ?? "");
  if (plain(a.notes) !== plain(b.notes)) out.push("Notes edited");
  if (plain(a.terms) !== plain(b.terms)) out.push("Terms edited");
  const proposal: [string, string | null, string | null][] = [
    ["Problems", a.proposalProblems, b.proposalProblems],
    ["Objectives", a.proposalObjectives, b.proposalObjectives],
    ["Influencer/Talent", a.proposalInfluencers, b.proposalInfluencers],
    ["TG", a.proposalTg, b.proposalTg],
  ];
  for (const [label, x, y] of proposal) if (plain(x) !== plain(y)) out.push(`Proposal: ${label} edited`);
  if (a.proposalPlatforms.join() !== b.proposalPlatforms.join()) field("Platforms", a.proposalPlatforms.join(", "), b.proposalPlatforms.join(", "));
  if (JSON.stringify(a.proposalSections) !== JSON.stringify(b.proposalSections)) out.push("Proposal sections edited");
  if (JSON.stringify(a.planColumns) !== JSON.stringify(b.planColumns)) out.push("Plan columns or sharing changed");
  if (a.parts.join() !== b.parts.join()) field("Parts", a.parts.join(", "), b.parts.join(", "));

  /* Price lines, matched by title. */
  const lineKey = (l: Snap["lines"][number]) => l.title;
  const linesA = new Map(a.lines.map((l) => [lineKey(l), l]));
  const linesB = new Map(b.lines.map((l) => [lineKey(l), l]));
  for (const [k, l] of linesB) {
    const was = linesA.get(k);
    if (!was) out.push(`Line added: ${short(k)} (${l.qty} × ${money(l.unitPaise)})`);
    else if (was.qty !== l.qty || was.unitPaise !== l.unitPaise) out.push(`${short(k)}: ${was.qty} × ${money(was.unitPaise)} → ${l.qty} × ${money(l.unitPaise)}`);
    else if (was.details !== l.details || was.subtitle !== l.subtitle || was.note !== l.note) out.push(`${short(k)}: description edited`);
  }
  for (const k of linesA.keys()) if (!linesB.has(k)) out.push(`Line removed: ${short(k)}`);

  /* Creators, matched by handle (or name). */
  const cKey = (c: Snap["creators"][number]) => (c.handle || c.name).toLowerCase();
  const cA = new Map(a.creators.map((c) => [cKey(c), c]));
  const cB = new Map(b.creators.map((c) => [cKey(c), c]));
  const added = [...cB.keys()].filter((k) => !cA.has(k)).map((k) => cB.get(k)!.name || k);
  const removed = [...cA.keys()].filter((k) => !cB.has(k)).map((k) => cA.get(k)!.name || k);
  const names = (xs: string[]) => (xs.length > 6 ? `${xs.slice(0, 6).join(", ")} and ${xs.length - 6} more` : xs.join(", "));
  if (added.length) out.push(`${added.length === 1 ? "Creator" : `${added.length} creators`} added: ${names(added)}`);
  if (removed.length) out.push(`${removed.length === 1 ? "Creator" : `${removed.length} creators`} removed: ${names(removed)}`);
  const money2: [string, keyof Snap["creators"][number]][] = [
    ["fee", "feePaise"], ["reel cost", "reelCostPaise"], ["story cost", "storyCostPaise"], ["link-in-bio cost", "dlCostPaise"],
    ["reel price", "reelPricePaise"], ["story price", "storyPricePaise"], ["link-in-bio price", "dlPricePaise"],
  ];
  for (const [k, c] of cB) {
    const was = cA.get(k);
    if (!was) continue;
    const bits: string[] = [];
    for (const [label, f] of money2) if (was[f] !== c[f]) bits.push(`${label} ${rs(was[f] as number | null)} → ${rs(c[f] as number | null)}`);
    if (was.reachout !== c.reachout) bits.push(`reach-out ${was.reachout ?? "blank"} → ${c.reachout ?? "blank"}`);
    if (was.deliverables !== c.deliverables) bits.push("deliverables edited");
    if (was.phone !== c.phone || was.email !== c.email) bits.push("contact edited");
    if (was.remarks !== c.remarks) bits.push("remarks edited");
    if (was.followers !== c.followers || was.city !== c.city || was.tier !== c.tier || was.niches.join() !== c.niches.join() || JSON.stringify(was.extra) !== JSON.stringify(c.extra)) bits.push("details edited");
    if (bits.length) out.push(`${c.name || k}: ${bits.join(", ")}`);
  }
  const order = (s: Snap) => s.creators.map(cKey).filter((k) => cA.has(k) && cB.has(k)).join();
  if (!added.length && !removed.length && order(a) !== order(b)) out.push("Creators reordered");

  if (a.totalPaise !== b.totalPaise) out.push(`Total: ${money(a.totalPaise)} → ${money(b.totalPaise)}`);
  return out;
}
