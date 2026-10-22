import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { CreatorFields } from "@/components/crm/creator-fields";
import { Card, PageHead, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { CAMPAIGN_CREATOR_STATUS, CREATOR_TIER, date, money } from "@/lib/crm/catalog";
import { seesCreators, creatorScope } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { saveCreator } from "../../actions/delivery";

export const dynamic = "force-dynamic";

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff();
  if (!seesCreators(viewer)) redirect("/admin/forbidden");
  const { id } = await params;
  const creator = await getPrisma().creator.findFirst({ where: { id, ...creatorScope(viewer) }, include: { campaigns: { orderBy: { createdAt: "desc" }, include: { project: { include: { account: true } } } } } });
  if (!creator) notFound();
  const paid = creator.campaigns.filter((c) => c.status === "POSTED" || c.status === "PAID");
  return (
    <>
      <PageHead kicker={`${creator.platform.toLowerCase()} · ${CREATOR_TIER[creator.tier]}`} title={creator.name} sub={`@${creator.handle} · ${creator.followers.toLocaleString("en-IN")} followers · ${paid.length} campaigns delivered`}>
        {creator.profileUrl && <a href={creator.profileUrl} target="_blank" rel="noopener noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">Profile ↗</a>}
      </PageHead>
      <Card title="Campaigns with Genesis">
        {creator.campaigns.length === 0 ? (
          <p className="text-ash">Not on a campaign yet. Shortlist them from an Influence project.</p>
        ) : (
          <Table head={["Campaign", "Client", "Status", "Fee", "Views", "Post"]}>
            {creator.campaigns.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/projects/${c.projectId}`} className="text-bone hover:underline">{c.project.name}</Link><span className="block text-[0.75rem] text-faint">{date(c.createdAt)}</span></td>
                <td>{c.project.account.name}</td>
                <td><Status value={CAMPAIGN_CREATOR_STATUS[c.status]} /></td>
                <td className="tabular-nums">{money(c.feePaise)}</td>
                <td className="tabular-nums">{c.views?.toLocaleString("en-IN") ?? "—"}</td>
                <td>{c.postUrl ? <a href={c.postUrl} target="_blank" rel="noopener noreferrer" className="crm-link">Post</a> : "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Card title="Profile">
        <ActionForm action={saveCreator} submit="Save">
          <input type="hidden" name="id" value={creator.id} />
          <CreatorFields creator={creator} />
        </ActionForm>
      </Card>
    </>
  );
}
