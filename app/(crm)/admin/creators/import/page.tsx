import { redirect } from "next/navigation";
import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { FileImport } from "@/components/crm/file-import";
import { Card, Field, PageHead } from "@/components/crm/ui";
import { IMPORT_KINDS } from "@/lib/crm/sheet-import";
import { seesCreators } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { startSheetImport } from "../../actions/inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import influencers" };

/**
 * INFLUENCERS IN BULK (Genesis, 13 Oct 2026: "add an import data feature …
 * Excel format or import from a Google Sheet"). An Excel or CSV file from
 * your computer, or a Google Sheet by its link (which can then stay in sync
 * daily). Either way the columns are matched for you, and a creator already
 * in the database is updated, never duplicated.
 */
export default async function ImportCreatorsPage() {
  const viewer = await requireStaff();
  if (!seesCreators(viewer)) redirect("/admin/forbidden");
  return (
    <>
      <PageHead kicker="Influence" title="Import influencers" sub="From an Excel / CSV file, or a Google Sheet">
        <Link href="/admin/creators" className="crm-btn crm-btn-secondary crm-btn-sm">← Influencer database</Link>
      </PageHead>
      <Card title="Excel or CSV file">
        <FileImport kind="influencers" noun="creators" fields={IMPORT_KINDS.influencers!.fields} done="/admin/creators" />
      </Card>
      <Card title="Google Sheet">
        <ActionForm action={startSheetImport} submit="Read the sheet">
          <input type="hidden" name="kind" value="influencers" />
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <Field label="Sheet link"><input name="sheet" required className="crm-input" placeholder="https://docs.google.com/spreadsheets/d/…" /></Field>
            <Field label="Tab" hint="Blank = the first tab."><input name="tab" className="crm-input" placeholder="Sheet1" /></Field>
          </div>
          <p className="text-[0.8125rem] text-faint">Read with your connected Google, so any sheet you can open works. Next you check the matched columns and can keep it in sync daily. Nothing is changed in the sheet.</p>
        </ActionForm>
      </Card>
    </>
  );
}
