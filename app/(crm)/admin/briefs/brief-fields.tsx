import { Field, Select } from "@/components/crm/ui";
import { DIVISION_LABEL } from "@/lib/crm/catalog";

export const PLATFORMS = ["Instagram", "YouTube", "LinkedIn", "Facebook", "X", "Website", "TV / OTT", "Print", "Events", "WhatsApp"];
export const BRIEF_STATUS: Record<string, string> = { NEW: "New", QUOTED: "Quoted", WON: "Won", ON_HOLD: "On hold", LOST: "Lost" };

type BriefValues = {
  id?: string; title?: string; leadId?: string | null; accountId?: string | null; division?: string | null; services?: string[]; objective?: string | null; audience?: string | null;
  deliverables?: string | null; platforms?: string[]; budgetPaise?: number | null; deadline?: Date | null; references?: string[]; notes?: string | null;
};

/** The brief form, for a new lead or an existing client. `about` picks which: "lead:<id>" or "account:<id>". */
export function BriefFields({ brief, leads, accounts }: { brief?: BriefValues; leads: [string, string][]; accounts: [string, string][] }) {
  const about = brief?.leadId ? `lead:${brief.leadId}` : brief?.accountId ? `account:${brief.accountId}` : "";
  return (
    <>
      {brief?.id && <input type="hidden" name="id" value={brief.id} />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Title *" className="sm:col-span-2"><input name="title" required defaultValue={brief?.title} className="crm-input" placeholder="Diwali influencer campaign" /></Field>
        <Field label="From" className="sm:col-span-2">
          <select name="about" defaultValue={about} className="crm-input">
            <option value="">Not linked yet</option>
            <optgroup label="Clients">
              {accounts.map(([id, name]) => <option key={id} value={`account:${id}`}>{name}</option>)}
            </optgroup>
            <optgroup label="Leads">
              {leads.map(([id, name]) => <option key={id} value={`lead:${id}`}>{name}</option>)}
            </optgroup>
          </select>
        </Field>
        <Field label="Division"><Select name="division" defaultValue={brief?.division} options={DIVISION_LABEL} /></Field>
        <Field label="Services" hint="Comma separated."><input name="services" defaultValue={brief?.services?.join(", ")} className="crm-input" placeholder="UGC, AI avatar" /></Field>
        <Field label="Budget (₹)"><input name="budget" inputMode="decimal" defaultValue={brief?.budgetPaise ? brief.budgetPaise / 100 : ""} className="crm-input" /></Field>
        <Field label="Needed by"><input name="deadline" type="date" defaultValue={brief?.deadline?.toISOString().slice(0, 10)} className="crm-input" /></Field>
      </div>
      <Field label="Objective"><textarea name="objective" defaultValue={brief?.objective ?? ""} className="crm-input !min-h-16" placeholder="What the campaign has to achieve" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Audience"><textarea name="audience" defaultValue={brief?.audience ?? ""} className="crm-input !min-h-16" placeholder="Who it's for: age, city, interests" /></Field>
        <Field label="Deliverables"><textarea name="deliverables" defaultValue={brief?.deliverables ?? ""} className="crm-input !min-h-16" placeholder="4 reels, 10 stories, 1 hero film…" /></Field>
      </div>
      <fieldset>
        <legend className="crm-label">Platforms</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1 text-[0.8125rem] text-ash has-[:checked]:border-[var(--brand-ink)] has-[:checked]:text-bone">
              <input type="checkbox" name="platforms" value={p} defaultChecked={brief?.platforms?.includes(p)} className="sr-only" />
              {p}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="References" hint="Links, one a line: decks, Drive folders, reference videos."><textarea name="references" defaultValue={brief?.references?.join("\n")} className="crm-input !min-h-16" /></Field>
      <Field label="Notes"><textarea name="notes" defaultValue={brief?.notes ?? ""} className="crm-input !min-h-16" placeholder="Anything else from the call" /></Field>
    </>
  );
}
