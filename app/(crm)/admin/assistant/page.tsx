import { AssistantChat } from "@/components/crm/assistant-chat";
import { PageHead } from "@/components/crm/ui";
import { aiConfigured } from "@/lib/crm/ai";
import { chatForView, recentChats } from "@/lib/crm/assistant";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI assistant" };

/** The CRM's AI assistant (lib/crm/assistant): chat, attach screenshots, sheets and PDFs, and it works in the CRM. */
export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const viewer = await requireStaff();
  const { chat } = await searchParams;
  const [chats, open] = await Promise.all([recentChats(viewer.id), chat ? chatForView(viewer.id, chat) : null]);
  return (
    <>
      <PageHead kicker="Today" title="AI assistant" sub="Ask it to make quotes, proposals and influencer plans, add leads, clients and tasks, find creators, or update anything in the CRM, from text, screenshots, Excel or PDFs." />
      {aiConfigured() ? (
        <AssistantChat key={open?.id ?? "new"} chats={chats.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))} open={open} firstName={viewer.name?.split(" ")[0] ?? null} />
      ) : (
        <p className="crm-notice">The AI isn&apos;t set up yet: an admin needs to add ANTHROPIC_API_KEY.</p>
      )}
    </>
  );
}
