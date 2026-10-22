import "server-only";

import { after } from "next/server";

import { getPrisma } from "@/lib/db";

import { archiveKey } from "./archive-key";
import { invoiceFolderId, quotesFolderId, uploadReplacing } from "./drive";
import { appUrl } from "./notify";
import { renderPdf } from "./pdf";
import { quoteRef } from "./quote-templates";

/**
 * EVERY QUOTE AND INVOICE, FILED IN GOOGLE DRIVE (Genesis, 22 Oct 2026). The
 * PDF the client sees is printed on the server and kept in the client's
 * folder (lib/crm/drive): when a quote is sent, accepted or paid, and when an
 * invoice is sent, signed or paid — each time replacing the last copy. A Drive
 * that isn't connected, or a slow print, never gets in the way of the action
 * that triggered it: it runs after the response, and a failure is only logged.
 */

/** The address the headless browser prints: the client's own page, with the archiver's pass. */
function printUrl(kind: "quote" | "invoice", token: string) {
  const base =
    process.env.NODE_ENV === "development" && !process.env.APP_BASE_URL
      ? "http://localhost:3005"
      : process.env.VERCEL_URL && process.env.VERCEL_ENV !== "production"
        ? `https://${process.env.VERCEL_URL}`
        : appUrl("/");
  const url = new URL(`/${kind}/${token}`, base);
  url.searchParams.set("archive", archiveKey(token));
  if (kind === "invoice") url.searchParams.set("preview", "1");
  return url.toString();
}

export async function archiveInvoice(id: string) {
  const inv = await getPrisma().invoice.findUnique({ where: { id }, select: { id: true, token: true, number: true, billToName: true } });
  if (!inv) return null;
  const bytes = await renderPdf(printUrl("invoice", inv.token));
  const parentId = await invoiceFolderId(inv.id, inv.number);
  await uploadReplacing(`invoice:${inv.id}`, { name: `Invoice ${inv.number} - ${inv.billToName}.pdf`, bytes, parentId });
  return parentId;
}

export async function archiveQuote(id: string) {
  const q = await getPrisma().quote.findUnique({ where: { id }, select: { id: true, token: true, number: true, title: true, company: true, contactName: true, accountId: true, account: { select: { name: true } } } });
  if (!q) return null;
  const bytes = await renderPdf(printUrl("quote", q.token));
  const parentId = await quotesFolderId({ accountId: q.account ? q.accountId : null, name: q.account?.name ?? (q.company || q.contactName || "No client") });
  await uploadReplacing(`quote:${q.id}`, { name: `${quoteRef(q.number)} - ${q.title}.pdf`, bytes, parentId });
  return parentId;
}

/** Files it after the response; never throws into the caller. */
export function archiveLater(kind: "quote" | "invoice", id: string) {
  after(async () => {
    try {
      await (kind === "quote" ? archiveQuote(id) : archiveInvoice(id));
    } catch (error) {
      console.error(`[archive] ${kind} ${id} not filed in Drive:`, (error as Error).message);
    }
  });
}
