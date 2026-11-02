import { ExternalLink, FolderOpen } from "lucide-react";

import { ActionForm } from "@/components/crm/action-form";
import { Card } from "@/components/crm/ui";
import type { ActionState } from "@/lib/crm/form-state";
import { dateTime } from "@/lib/crm/catalog";
import { driveFolderUrl } from "@/lib/crm/drive";

/**
 * THE SAME, AS A SMALL BUTTON (Genesis, 3 Nov 2026: "the marked section can
 * just be a small icon or a button"): for a card's corner.
 */
export function DriveButton({ id, saved, save }: { id: string; saved: { folder: string; at: string } | null; save: (state: ActionState, form: FormData) => Promise<ActionState> }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {saved && (
        <a href={driveFolderUrl(saved.folder)} target="_blank" rel="noreferrer" title={`PDF saved ${dateTime(new Date(saved.at))}: open the client's folder`} aria-label="Open the client's Drive folder" className="crm-btn crm-btn-secondary crm-btn-sm !px-2.5">
          <FolderOpen className="size-4" aria-hidden />
        </a>
      )}
      <ActionForm action={save} submit={saved ? "Save to Drive again" : "Save PDF to Drive"} tone="secondary" inline>
        <input type="hidden" name="id" value={id} />
      </ActionForm>
    </div>
  );
}

/**
 * Where a quote or invoice sits in Google Drive (lib/crm/archive): when its
 * PDF was last filed, a link to the client's folder, and "Save now".
 */
export function DriveCard({ id, saved, save, what }: { id: string; saved: { folder: string; at: string } | null; save: (state: ActionState, form: FormData) => Promise<ActionState>; what: string }) {
  return (
    <Card title="Google Drive">
      <p className="text-[0.9375rem] text-ash">
        {saved ? <>PDF saved {dateTime(new Date(saved.at))} in the client&apos;s folder.</> : <>The {what} PDF is filed in the client&apos;s folder when it&apos;s sent, accepted or paid.</>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {saved && (
          <a href={driveFolderUrl(saved.folder)} target="_blank" rel="noreferrer" className="crm-btn crm-btn-secondary crm-btn-sm">
            Open the folder <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
        <ActionForm action={save} submit={saved ? "Save again" : "Save to Drive now"} inline>
          <input type="hidden" name="id" value={id} />
        </ActionForm>
      </div>
    </Card>
  );
}
