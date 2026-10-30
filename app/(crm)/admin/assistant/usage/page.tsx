import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Empty, Field, PageHead, Select, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, dateTime, todayIst } from "@/lib/crm/catalog";
import { dollars, SOURCE_LABEL, type UsageSource } from "@/lib/crm/ai-usage";
import { FREE_PROMPTS, novaAiPacks } from "@/lib/crm/nova-ai";
import { isSuperAdmin, usesAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { grantNovaAiCredits, saveNovaAiPricing } from "../../actions/nova-ai";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI usage" };

const tokens = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

/**
 * AI USAGE (Genesis, 30 Oct 2026: "show usage to each user"): what you used
 * Nova Copilot for this month and what it cost (lib/crm/ai-usage); the
 * owners also see everyone's, and the background reading of the inbox and
 * sheet imports. Recorded from 30 Oct 2026. Prices are Anthropic's, in US
 * dollars, as billed to Genesis's API key.
 */
export default async function UsagePage() {
  const viewer = await requireStaff();
  if (!usesAi(viewer)) return <p className="crm-notice">Nova Copilot is open to the owners only, so there&apos;s no AI usage to show.</p>;
  const all = isSuperAdmin(viewer);
  const prisma = getPrisma();
  const today = todayIst();
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00+05:30`);
  const since14 = new Date(`${today}T00:00:00+05:30`);
  since14.setUTCDate(since14.getUTCDate() - 13);
  const sum = { costMicros: true, inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true } as const;

  const [mine, mineAll, everyone, byPerson, bySource, recent, days] = await Promise.all([
    prisma.aiUsage.aggregate({ where: { userId: viewer.id, createdAt: { gte: monthStart } }, _sum: sum, _count: true }),
    prisma.aiUsage.aggregate({ where: { userId: viewer.id }, _sum: { costMicros: true } }),
    all ? prisma.aiUsage.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { costMicros: true } }) : null,
    all ? prisma.aiUsage.groupBy({ by: ["userId"], where: { createdAt: { gte: monthStart }, userId: { not: null } }, _sum: sum, _count: true }) : [],
    all ? prisma.aiUsage.groupBy({ by: ["source"], where: { createdAt: { gte: monthStart }, userId: null }, _sum: sum, _count: true }) : [],
    prisma.aiUsage.findMany({ where: { userId: viewer.id }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.aiUsage.findMany({ where: { createdAt: { gte: since14 }, ...(all ? {} : { userId: viewer.id }) }, select: { createdAt: true, costMicros: true, userId: true } }),
  ]);
  /* NOVA AI's agencies, for the owners. */
  const nova = all
    ? await (async () => {
        const [rows, workspaces, pricing] = await Promise.all([
          prisma.novaAiCredit.groupBy({ by: ["workspaceId", "reason"], _sum: { delta: true } }),
          prisma.account.findMany({ where: { crmWorkspace: true, workspaceId: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
          novaAiPacks(),
        ]);
        const ids = [...new Set(rows.map((r) => r.workspaceId))];
        const sum = (ws: string, reasons: string[]) => rows.filter((r) => r.workspaceId === ws && reasons.includes(r.reason)).reduce((n, r) => n + (r._sum.delta ?? 0), 0);
        return {
          ...pricing,
          workspaces,
          agencies: ids.map((id) => ({ id, name: workspaces.find((w) => w.id === id)?.name ?? "Removed agency", left: sum(id, ["FREE", "USE", "REFUND", "TOPUP", "GRANT"]), used: -sum(id, ["USE", "REFUND"]), bought: sum(id, ["TOPUP"]) })),
        };
      })()
    : null;
  const people = new Map((await prisma.user.findMany({ where: { id: { in: byPerson.map((p) => p.userId!).filter(Boolean) } }, select: { id: true, name: true, email: true } })).map((u) => [u.id, u.name ?? u.email]));
  const chats = new Map((await prisma.aiChat.findMany({ where: { id: { in: recent.map((r) => r.chatId).filter((x): x is string => Boolean(x)) } }, select: { id: true, title: true } })).map((c) => [c.id, c.title]));

  /* Cost per day, the last 14 days (IST), newest first. */
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  const perDay = new Map<string, { you: number; all: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since14);
    d.setUTCDate(d.getUTCDate() + 13 - i);
    perDay.set(dayKey(d), { you: 0, all: 0 });
  }
  for (const r of days) {
    const row = perDay.get(dayKey(r.createdAt));
    if (!row) continue;
    row.all += r.costMicros;
    if (r.userId === viewer.id) row.you += r.costMicros;
  }
  const s = mine._sum;
  const month = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "Asia/Kolkata" }).format(new Date());

  return (
    <>
      <PageHead kicker="Nova Copilot" title="AI usage" sub={`What Nova Copilot used and cost, in US dollars as Anthropic bills it. Recorded from 30 Oct 2026.`}>
        <Link href="/admin/assistant" className="crm-btn crm-btn-secondary crm-btn-sm">← Back to Copilot</Link>
      </PageHead>
      <Stats
        items={[
          { label: `You, ${month}`, value: dollars(s.costMicros ?? 0), hint: `${mine._count} answer${mine._count === 1 ? "" : "s"}` },
          { label: "Tokens read", value: tokens((s.inputTokens ?? 0) + (s.cacheReadTokens ?? 0) + (s.cacheWriteTokens ?? 0)), hint: `${tokens(s.cacheReadTokens ?? 0)} of them from the cache (a tenth of the price)` },
          { label: "Tokens written", value: tokens(s.outputTokens ?? 0), hint: "Copilot's answers and tool calls" },
          everyone ? { label: `Everyone, ${month}`, value: dollars(everyone._sum.costMicros ?? 0), hint: "All Copilot use and background reading" } : { label: "You, all time", value: dollars(mineAll._sum.costMicros ?? 0) },
        ]}
      />

      {all && (
        <Card title={`By person, ${month}`}>
          {byPerson.length + bySource.length === 0 ? (
            <p className="text-ash">Nothing used yet this month.</p>
          ) : (
            <Table head={["Who", "Answers", "Tokens read", "Tokens written", "Cost"]}>
              {[...byPerson.map((p) => ({ key: p.userId!, who: people.get(p.userId!) ?? "Someone removed", n: p._count, x: p._sum })), ...bySource.map((p) => ({ key: p.source, who: `${SOURCE_LABEL[p.source as UsageSource] ?? p.source} (automatic)`, n: p._count, x: p._sum }))]
                .sort((a, b) => (b.x.costMicros ?? 0) - (a.x.costMicros ?? 0))
                .map((r) => (
                  <tr key={r.key}>
                    <td className="text-bone">{r.who}</td>
                    <td className="tabular-nums">{r.n}</td>
                    <td className="tabular-nums">{tokens((r.x.inputTokens ?? 0) + (r.x.cacheReadTokens ?? 0) + (r.x.cacheWriteTokens ?? 0))}</td>
                    <td className="tabular-nums">{tokens(r.x.outputTokens ?? 0)}</td>
                    <td className="tabular-nums text-bone">{dollars(r.x.costMicros ?? 0)}</td>
                  </tr>
                ))}
            </Table>
          )}
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title="Your recent answers">
          {recent.length === 0 ? (
            <Empty>Nothing yet. Each answer Copilot gives you shows here with what it cost.</Empty>
          ) : (
            <Table head={["When", "Chat", "Tokens read", "Written", "Cost"]}>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{dateTime(r.createdAt)}</td>
                  <td>{r.chatId && chats.has(r.chatId) ? <Link href={`/admin/assistant?chat=${r.chatId}`} className="crm-link">{chats.get(r.chatId)}</Link> : <span className="text-faint">{SOURCE_LABEL[r.source as UsageSource] ?? r.source}</span>}</td>
                  <td className="tabular-nums">{tokens(r.inputTokens + r.cacheReadTokens + r.cacheWriteTokens)}</td>
                  <td className="tabular-nums">{tokens(r.outputTokens)}</td>
                  <td className="tabular-nums text-bone">{dollars(r.costMicros)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Last 14 days">
          <Table head={all ? ["Day", "You", "Everyone"] : ["Day", "Cost"]}>
            {[...perDay].map(([d, v]) => (
              <tr key={d}>
                <td className="whitespace-nowrap">{date(d)}</td>
                <td className="tabular-nums">{dollars(v.you)}</td>
                {all && <td className="tabular-nums">{dollars(v.all)}</td>}
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      {/* NOVA AI for agencies (lib/crm/nova-ai): the packs they buy, their credits, and grants. */}
      {all && nova && (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="NOVA AI · agencies' credits">
            {nova.agencies.length === 0 ? (
              <p className="text-ash">No agency has used NOVA AI yet. Each starts with {FREE_PROMPTS} free requests.</p>
            ) : (
              <Table head={["Agency", "Credits left", "Used", "Bought"]}>
                {nova.agencies.map((a) => (
                  <tr key={a.id}>
                    <td className="text-bone">{a.name}</td>
                    <td className="tabular-nums">{a.left}</td>
                    <td className="tabular-nums">{a.used}</td>
                    <td className="tabular-nums">{a.bought}</td>
                  </tr>
                ))}
              </Table>
            )}
            <ActionForm action={grantNovaAiCredits} submit="Apply" reset>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_1fr]">
                <Field label="Agency"><Select name="ws" required options={Object.fromEntries(nova.workspaces.map((w) => [w.id, w.name]))} /></Field>
                <Field label="Credits" hint="Negative takes away."><input name="credits" required inputMode="numeric" className="crm-input" /></Field>
                <Field label="Note"><input name="note" className="crm-input" placeholder="Launch offer, goodwill…" /></Field>
              </div>
            </ActionForm>
          </Card>
          <Card title="NOVA AI packs">
            {nova.placeholder && <p className="crm-notice mb-3">These are placeholder prices. Set Genesis&apos;s own and save.</p>}
            <ActionForm action={saveNovaAiPricing} submit="Save packs">
              <p className="crm-label">Credits, and the price in ₹ with GST. One credit is one request.</p>
              <div className="space-y-2">
                {Array.from({ length: Math.max(nova.packs.length + 1, 4) }, (_, i) => nova.packs[i]).map((p, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input name={`pack${i}_credits`} defaultValue={p?.credits ?? ""} placeholder="Credits" inputMode="numeric" className="crm-input" />
                    <input name={`pack${i}_price`} defaultValue={p?.price ?? ""} placeholder="₹ price" inputMode="numeric" className="crm-input" />
                  </div>
                ))}
              </div>
            </ActionForm>
          </Card>
        </div>
      )}
    </>
  );
}
