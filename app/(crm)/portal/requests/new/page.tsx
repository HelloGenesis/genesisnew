import { redirect } from "next/navigation";
import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import type { RequestKind } from "@/lib/generated/prisma/enums";
import { REQUEST_KIND } from "@/lib/crm/catalog";
import { requirePortal } from "@/lib/crm/session";

import { createRequest } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "New request" };

/** What a good brief answers, per kind — the questions Genesis would otherwise ask on a call. */
const PROMPTS: Record<RequestKind, string> = {
  NEW_BRIEF: "What's it for (launch, campaign, always-on)?\nWho is it for?\nThe one thing people should feel or do.\nFormats and platforms (9:16 reels, 16:9 YouTube…).\nReferences you like.\nDeadline, and anything we must include or avoid.",
  REVISION: "Which piece, and which version?\nEverything you'd like changed, in one note. Timestamps help: 0:12 make the logo bigger.",
  NEW_CONTENT: "What should this month's / this batch's content cover?\nAny products, offers or dates to feature?\nReferences.",
  SUPPORT: "What do you need help with?",
  BILLING: "Invoice, GST details, payment method or plan change: tell us what you need.",
  CANCELLATION: "Which plan, and when should it end? Anything we could have done better?",
};

export default async function NewRequest({ searchParams }: { searchParams: Promise<{ kind?: string; project?: string }> }) {
  const { account } = await requirePortal();
  /* A vendor's work lives under My work, not client projects. */
  if (account.kind === "VENDOR") redirect("/portal/work");
  const params = await searchParams;
  const kind = (params.kind && params.kind in REQUEST_KIND ? params.kind : "NEW_BRIEF") as RequestKind;
  const projects = await getPrisma().project.findMany({ where: { accountId: account.id, status: { in: ["ACTIVE", "ON_HOLD", "DELIVERED"] } }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHead kicker={account.name} title="New request" sub="Tell us what you need. The more context, the fewer back-and-forths." />
      <Card>
        <ActionForm action={createRequest} submit="Send to the team">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type"><Select name="kind" required defaultValue={kind} options={REQUEST_KIND} /></Field>
            <Field label="Project (optional)"><Select name="projectId" defaultValue={params.project} options={projects.map((p) => [p.id, p.name] as const)} /></Field>
          </div>
          <Field label="Title"><input name="title" required className="crm-input" placeholder="Diwali offer reels" /></Field>
          <Field label="Details"><textarea name="body" required className="crm-input !min-h-48" placeholder={PROMPTS[kind]} /></Field>
          <Field label="Links (one per line)" hint="References, product photos, a Drive folder, your brand guidelines."><textarea name="links" className="crm-input !min-h-16" /></Field>
        </ActionForm>
      </Card>
    </>
  );
}
