import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Field, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { dateTime } from "@/lib/crm/catalog";
import { IMPORT_KINDS, planImport } from "@/lib/crm/sheet-import";
import { sees } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { deleteSheetImport, rerunSheetImport, saveMappingAndRun, startSheetImport } from "../../actions/inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import a Google Sheet" };

/**
 * A GOOGLE SHEET INTO THE CRM (Genesis, 12 Oct 2026). Paste the link and say
 * what it holds; the AI matches the columns, you check the match, and it
 * imports. Re-running only adds new rows and fills empty fields.
 */
export default async function SheetsPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const viewer = await requireStaff();
  const p = await searchParams;
  const prisma = getPrisma();
  const seesAll = sees(viewer, "inbox");
  const [imports, plan] = await Promise.all([
    prisma.sheetImport.findMany({ where: seesAll ? {} : { userId: viewer.id }, orderBy: { createdAt: "desc" } }),
    p.plan ? prisma.sheetImport.findUnique({ where: { id: p.plan } }) : null,
  ]);
  let preview: Awaited<ReturnType<typeof planImport>> | null = null;
  let previewError: string | null = null;
  if (plan && (plan.userId === viewer.id || seesAll)) {
    try {
      preview = await planImport(plan.userId, plan.spreadsheetId, plan.sheetName, plan.kind);
    } catch (error) {
      previewError = (error as Error).message;
    }
  }
  const mapping = (plan?.mapping ?? {}) as Record<string, string>;
  const kindOptions = Object.fromEntries(Object.entries(IMPORT_KINDS).map(([k, v]) => [k, v.label]));

  return (
    <>
      <PageHead kicker="Inbox" title="Import a Google Sheet" sub="Leads, clients, vendors, influencers, expenses or briefs">
        <Link href="/admin/inbox" className="crm-btn crm-btn-secondary crm-btn-sm">← Inbox</Link>
      </PageHead>

      {plan && preview ? (
        <Card title={`Check the columns · ${plan.title}`}>
          <p className="mb-4 text-[0.875rem] text-ash">{preview.rowCount} rows as {IMPORT_KINDS[plan.kind]!.label.toLowerCase()}. The AI matched these; change any that are wrong, or set a column to “—” to leave it out.</p>
          <ActionForm action={saveMappingAndRun} submit={`Import ${preview.rowCount} rows`}>
            <input type="hidden" name="id" value={plan.id} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preview.headers.filter(Boolean).map((h, i) => (
                <Field key={`${h}-${i}`} label={h} hint={preview!.sample.map((row) => row[preview!.headers.indexOf(h)]).filter(Boolean).slice(0, 2).join(" · ").slice(0, 80) || undefined}>
                  <Select name={`col:${h}`} defaultValue={mapping[h]} options={IMPORT_KINDS[plan.kind]!.fields} />
                </Field>
              ))}
            </div>
            {IMPORT_KINDS[plan.kind]!.sync && (
              <label className="flex items-center gap-2 text-[0.875rem] text-ash"><input type="checkbox" name="autoSync" defaultChecked={plan.autoSync} /> Keep in sync (checked daily for new rows)</label>
            )}
          </ActionForm>
        </Card>
      ) : previewError ? (
        <Card title="Couldn't read the sheet"><p className="text-ash">{previewError}</p></Card>
      ) : null}

      <Card title="Bring in a sheet">
        <ActionForm action={startSheetImport} submit="Read the sheet">
          <div className="grid gap-3 sm:grid-cols-[1fr_14rem_12rem]">
            <Field label="Sheet link"><input name="sheet" required className="crm-input" placeholder="https://docs.google.com/spreadsheets/d/…" /></Field>
            <Field label="It holds"><Select name="kind" required defaultValue="leads" options={kindOptions} /></Field>
            <Field label="Tab" hint="Blank = the first tab."><input name="tab" className="crm-input" placeholder="Sheet1" /></Field>
          </div>
          <p className="text-[0.8125rem] text-faint">Read with your connected Google, so any sheet you can open works. Nothing is changed in the sheet.</p>
        </ActionForm>
      </Card>

      {imports.length > 0 && (
        <Table head={["Sheet", "As", "Imported", "Last run", ""]}>
          {imports.map((job) => (
            <tr key={job.id}>
              <td className="text-bone">
                <a href={`https://docs.google.com/spreadsheets/d/${job.spreadsheetId}`} target="_blank" rel="noreferrer" className="hover:underline">{job.title}</a>
                {job.lastError && <span className="block text-[0.75rem] text-[#dc2626]">{job.lastError}</span>}
              </td>
              <td>{IMPORT_KINDS[job.kind]?.label ?? job.kind}{job.autoSync && <> <Badge tone="info">Daily sync</Badge></>}</td>
              <td>{job.rowsImported}</td>
              <td>{job.lastRunAt ? dateTime(job.lastRunAt) : "—"}</td>
              <td className="whitespace-nowrap">
                <Link href={`/admin/inbox/sheets?plan=${job.id}`} className="text-[0.8125rem] text-ash hover:text-bone">Columns</Link>
                <form action={rerunSheetImport} className="ml-3 inline"><input type="hidden" name="id" value={job.id} /><button className="text-[0.8125rem] text-ash hover:text-bone">Run again</button></form>
                <form action={deleteSheetImport} className="ml-3 inline"><input type="hidden" name="id" value={job.id} /><button className="text-[0.8125rem] text-faint hover:text-[#dc2626]">Remove</button></form>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
