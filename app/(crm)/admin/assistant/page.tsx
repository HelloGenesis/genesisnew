import { AssistantChat } from "@/components/crm/assistant-chat";
import { aiConfigured } from "@/lib/crm/ai";
import { addedConnectors, builtInConnectors } from "@/lib/crm/ai-connectors";
import { chatForView, recentChats } from "@/lib/crm/assistant";
import { isSuperAdmin, usesAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Genesis Copilot" };

/** Genesis Copilot, the CRM's AI assistant (lib/crm/assistant): chat, attach screenshots, sheets and PDFs, and it works in the CRM. */
export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ chat?: string; prompt?: string }> }) {
  const viewer = await requireStaff();
  if (!usesAi(viewer)) return <p className="crm-notice">Genesis Copilot is open to the owners only. Ask Shivam or Tanvi if you need something done with it.</p>;
  const { chat, prompt } = await searchParams;
  const [chats, open, builtIns, added] = await Promise.all([recentChats(viewer.id), chat ? chatForView(viewer.id, chat) : null, builtInConnectors(viewer), addedConnectors(viewer.ws ?? null)]);
  /* Who may connect apps (app/(crm)/admin/actions/connectors). */
  const canManage = viewer.workspaceId ? viewer.workspaceRole === "ADMIN" : isSuperAdmin(viewer);
  return (
    <>
      <h1 className="sr-only">Genesis Copilot</h1>
      {aiConfigured() ? (
        <AssistantChat key={open?.id ?? "new"} chats={chats.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))} open={open} firstName={viewer.name?.split(" ")[0] ?? null} initialText={prompt?.slice(0, 2000) ?? ""} connectors={{ builtIns, added: added.map((c) => ({ id: c.id, name: c.name, url: c.url, enabled: c.enabled, hasToken: c.hasToken })), canManage }} />
      ) : (
        <p className="crm-notice">Genesis Copilot isn&apos;t set up yet: an admin needs to add ANTHROPIC_API_KEY.</p>
      )}
    </>
  );
}
