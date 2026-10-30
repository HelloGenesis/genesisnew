import { AssistantChat } from "@/components/crm/assistant-chat";
import { CopilotTour } from "@/components/crm/copilot-tour";
import { aiConfigured } from "@/lib/crm/ai";
import { addedConnectors, builtInConnectors } from "@/lib/crm/ai-connectors";
import { dollars } from "@/lib/crm/ai-usage";
import { todayIst } from "@/lib/crm/catalog";
import { getPrisma } from "@/lib/db";
import { chatForView, recentChats } from "@/lib/crm/assistant";
import { FREE_PROMPTS, novaAiBalance, novaAiPacks } from "@/lib/crm/nova-ai";
import { isSuperAdmin, usesAi, usesNovaAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova Copilot" };

/** Nova Copilot, the CRM's AI assistant (lib/crm/assistant): chat, attach screenshots, sheets and PDFs, and it works in the CRM. */
export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ chat?: string; prompt?: string; topup?: string }> }) {
  const viewer = await requireStaff();
  /* Genesis's owners: Nova Copilot. An agency's team: NOVA AI, on credits (lib/crm/nova-ai). */
  const novaAi = !usesAi(viewer) && usesNovaAi(viewer);
  if (!usesAi(viewer) && !novaAi) return <p className="crm-notice">Nova Copilot is open to the owners only. Ask Shivam or Tanvi if you need something done with it.</p>;
  const { chat, prompt, topup } = await searchParams;
  const monthStart = new Date(`${todayIst().slice(0, 7)}-01T00:00:00+05:30`);
  const [chats, open, builtIns, added, used] = await Promise.all([recentChats(viewer.id), chat ? chatForView(viewer.id, chat) : null, builtInConnectors(viewer), addedConnectors(viewer.ws ?? null), getPrisma().aiUsage.aggregate({ where: { userId: viewer.id, createdAt: { gte: monthStart } }, _sum: { costMicros: true } })]);
  /* Who may connect apps (app/(crm)/admin/actions/connectors). */
  const canManage = viewer.workspaceId ? viewer.workspaceRole === "ADMIN" : isSuperAdmin(viewer);
  const nova = novaAi ? { credits: viewer.demo ? 0 : await novaAiBalance(viewer.workspaceId!), free: FREE_PROMPTS, packs: (await novaAiPacks()).packs, demo: viewer.demo, admin: viewer.workspaceRole === "ADMIN" && !viewer.demo } : undefined;
  const copilotTourSeen = Boolean(await getPrisma().appSetting.findUnique({ where: { key: `tour:copilot:done:${viewer.id}` }, select: { key: true } }));
  return (
    <>
      <h1 className="sr-only">{nova ? "NOVA AI" : "Nova Copilot"}</h1>
      {nova && topup && <p className="crm-notice mb-3">{topup === "done" ? "Credits added. Thank you: we've emailed the details." : "We haven't had Razorpay's confirmation yet. If you paid, refresh in a minute."}</p>}
      {aiConfigured() ? (
        <AssistantChat key={`${open?.id ?? "new"}:${prompt ?? ""}`} chats={chats.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))} open={open} firstName={viewer.name?.split(" ")[0] ?? null} initialText={prompt?.slice(0, 2000) ?? ""} connectors={{ builtIns, added: added.map((c) => ({ id: c.id, name: c.name, url: c.url, enabled: c.enabled, hasToken: c.hasToken })), canManage }} monthCost={dollars(used._sum.costMicros ?? 0)} nova={nova} />
      ) : (
        <p className="crm-notice">Nova Copilot isn&apos;t set up yet: an admin needs to add ANTHROPIC_API_KEY.</p>
      )}
      {aiConfigured() && !nova && <CopilotTour firstTime={!copilotTourSeen} />}
    </>
  );
}
