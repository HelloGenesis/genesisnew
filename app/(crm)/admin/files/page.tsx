import { FileLibrary } from "@/components/crm/file-library";
import { StorageMeter } from "@/components/crm/storage-meter";
import { PageHead } from "@/components/crm/ui";
import { libraryFor } from "@/lib/crm/library";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Files" };

/** Every project's files in one place, from Genesis's Drive (lib/crm/library). */
export default async function FilesPage() {
  const viewer = await requireStaff();
  return (
    <div className="space-y-6">
      <PageHead kicker="Files" title="Files" sub="Briefs, scripts, footage, cuts and finals from every project, kept in Google Drive. Drop files anywhere here to upload." />
      <StorageMeter workspaceId={viewer.workspaceId} admin={viewer.workspaceRole === "ADMIN" && !viewer.demo} />
      <FileLibrary mode="files" library={await libraryFor(viewer, false)} />
    </div>
  );
}
