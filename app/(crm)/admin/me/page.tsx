import { GoogleCard } from "@/components/crm/google-card";
import { PageHead } from "@/components/crm/ui";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My settings" };

/** MY SETTINGS: what's set up for this person (Genesis, 31 Oct 2026): their Google, connected once for the Inbox. */
export default async function MySettingsPage() {
  const viewer = await requireStaff();
  return (
    <>
      <PageHead kicker="Setup" title="My settings" sub={`Signed in as ${viewer.email ?? viewer.name ?? "you"}. What's connected for you.`} />
      <div className="max-w-2xl">
        <GoogleCard userId={viewer.id} agency={Boolean(viewer.workspaceId)} />
      </div>
    </>
  );
}
