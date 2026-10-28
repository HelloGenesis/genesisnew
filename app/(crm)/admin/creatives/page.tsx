import { FileLibrary } from "@/components/crm/file-library";
import { PageHead } from "@/components/crm/ui";
import { libraryFor } from "@/lib/crm/library";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Creative library" };

/** The images and videos from every project, as a gallery (lib/crm/library). */
export default async function CreativesPage() {
  const viewer = await requireStaff();
  return (
    <div className="space-y-6">
      <PageHead kicker="Creative library" title="Creative library" sub="Every image and video made for clients, by client and project. Filter to Final delivery for the approved work." />
      <FileLibrary mode="creatives" library={await libraryFor(viewer, true)} />
    </div>
  );
}
