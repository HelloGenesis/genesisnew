import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { ConnectorCard } from "@/components/crm/connector-card";
import { Card, Field, PageHead, Select } from "@/components/crm/ui";
import { aiPrefs } from "@/lib/crm/ai-prefs";
import { builtInConnectors, addedConnectors } from "@/lib/crm/ai-connectors";
import { dollars } from "@/lib/crm/ai-usage";
import { todayIst } from "@/lib/crm/catalog";
import { connectorKeys } from "@/lib/crm/mcp-keys";
import { usesAi } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

import { saveAiPrefsAction } from "../../actions/ai-prefs";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI settings" };

/**
 * NOVA COPILOT'S SETTINGS, IN ONE PLACE (Genesis, 31 Oct 2026: "settings for
 * AI and Nova Copilot, also on other platforms, all across"): which AI a chat
 * starts on and how hard it thinks, Nova Copilot in ChatGPT and Claude, the
 * apps it can use, and what it has cost. Genesis's owners only.
 */
export default async function AiSettingsPage() {
  const viewer = await requireStaff();
  if (!usesAi(viewer)) return <p className="crm-notice">Nova Copilot is open to the owners only.</p>;
  const monthStart = new Date(`${todayIst().slice(0, 7)}-01T00:00:00+05:30`);
  const [prefs, links, builtIns, added, used] = await Promise.all([
    aiPrefs(viewer.id),
    connectorKeys(viewer.id),
    builtInConnectors(viewer),
    addedConnectors(viewer.ws ?? null),
    getPrisma().aiUsage.aggregate({ where: { userId: viewer.id, createdAt: { gte: monthStart } }, _sum: { costMicros: true } }),
  ]);
  const apps = builtIns.filter((b) => b.on).length + added.filter((a) => a.enabled).length;
  return (
    <>
      <PageHead kicker="Setup" title="AI settings" sub="Nova Copilot, NOVA AI 1.0, and Nova Copilot in ChatGPT and Claude." />

      <Card title="When you start a chat">
        <ActionForm action={saveAiPrefsAction} submit="Save">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Model" hint="Nova Copilot sees every CRM and has every tool. NOVA AI 1.0 is what agencies get: their own CRM, quick answers.">
              <Select name="model" required defaultValue={prefs.model} options={[["copilot", "Nova Copilot"], ["nova", "NOVA AI 1.0"]]} />
            </Field>
            <Field label="Thinking" hint="For Nova Copilot. Deep think takes longer and costs more.">
              <Select name="mode" required defaultValue={prefs.mode} options={[["quick", "Quick answer"], ["balanced", "Balanced"], ["deep", "Deep think"]]} />
            </Field>
          </div>
        </ActionForm>
        <p className="mt-3 text-[0.8125rem] text-faint">You can still switch for any chat from the model button under the message box.</p>
      </Card>

      {/* The same Nova Copilot, from ChatGPT or Claude (app/api/mcp). */}
      <Card title="Nova Copilot on other platforms" action={<span className="text-[0.8125rem] text-ash">ChatGPT · Claude</span>}>
        <ConnectorCard links={links} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Connectors">
          <p className="text-ash">{apps} app{apps === 1 ? "" : "s"} Nova Copilot can use right now: Gmail, Drive, Sheets and the ones you&apos;ve added.</p>
          <Link href="/admin/assistant" className="crm-btn crm-btn-secondary crm-btn-sm mt-4">Manage in the chat →</Link>
        </Card>
        <Card title="AI usage">
          <p className="text-ash">This month you&apos;ve used <strong className="text-bone">{dollars(used._sum.costMicros ?? 0)}</strong>.</p>
          <Link href="/admin/assistant/usage" className="crm-btn crm-btn-secondary crm-btn-sm mt-4">See usage →</Link>
        </Card>
      </div>
    </>
  );
}
