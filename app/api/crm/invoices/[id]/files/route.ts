import { NextResponse } from "next/server";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { invoiceFolderId, uploadSmall } from "@/lib/crm/drive";
import { appUrl, queueEmail } from "@/lib/crm/notify";
import { notify } from "@/lib/crm/notifications";
import { invoiceScope } from "@/lib/crm/scope";
import { can, getViewer, staffAccess } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX = 4 * 1024 * 1024;
const TYPES = /^(image\/(png|jpe?g|webp|gif|heic)|application\/pdf)$/;

/**
 * Adds a file to an invoice: a supporting screenshot (kind=SUPPORTING), or
 * the copy signed by hand (kind=SIGNED). The file goes to the company Drive;
 * a signed copy marks the invoice signed and tells finance (Genesis, 12 Oct
 * 2026: "the finance team will be informed which I or the designated person
 * sign manually").
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted" || (!can(viewer, "sales") && !can(viewer, "finance"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const prisma = getPrisma();
  /* Its maker, super admins, or the person named to sign it. */
  const invoice = (await prisma.invoice.findFirst({ where: { id, ...invoiceScope(viewer!) } })) ?? (await prisma.invoice.findFirst({ where: { id, signatoryId: viewer!.id } }));
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData();
  const kind = form.get("kind") === "SIGNED" ? "SIGNED" : "SUPPORTING";
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Up to 4 MB a file. Compress the image or PDF and try again." }, { status: 413 });
  if (!TYPES.test(file.type)) return NextResponse.json({ error: kind === "SIGNED" ? "Upload the signed invoice as a PDF or photo." : "Images (PNG, JPG, WebP) or a PDF." }, { status: 415 });
  try {
    const parent = await invoiceFolderId(invoice.id, invoice.number);
    const driveId = await uploadSmall({ name: kind === "SIGNED" ? `Invoice ${invoice.number} - signed.${file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]}` : file.name, mimeType: file.type, bytes: Buffer.from(await file.arrayBuffer()), parentId: parent });
    const count = await prisma.invoiceFile.count({ where: { invoiceId: invoice.id, kind } });
    const row = await prisma.invoiceFile.create({ data: { invoiceId: invoice.id, kind, driveId, name: file.name.slice(0, 200), mimeType: file.type, size: file.size, caption: String(form.get("caption") ?? "").slice(0, 300) || null, position: count, uploadedById: viewer!.id } });
    if (kind === "SIGNED") {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { signedAt: new Date(), signedById: viewer!.id } });
      const finance = await prisma.staffRole.findMany({ where: { role: { in: ["FINANCE", "OWNER"] } }, select: { userId: true, user: { select: { email: true } } } });
      const who = viewer!.name ?? viewer!.email ?? "Someone";
      await notify(finance.map((f) => f.userId), { title: `Invoice ${invoice.number} signed by ${who}`, body: `${invoice.billToName}. The signed copy is on the invoice.`, href: `/admin/invoices/${invoice.id}` });
      await queueEmail({
        kind: "invoice_signed",
        to: finance.map((f) => f.user.email),
        subject: `Signed: invoice ${invoice.number} · ${invoice.billToName}`,
        text: `${who} signed invoice ${invoice.number} for ${invoice.billToName} and uploaded the signed copy.\n\n${appUrl(`/admin/invoices/${invoice.id}`)}`,
        dedupeKey: `invoice-signed:${row.id}`,
      });
    }
    await recordAuditLog({ action: `invoice.file_${kind.toLowerCase()}`, entity: "invoice", entityId: invoice.id, actorId: viewer!.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    console.error("[crm] invoice upload", error);
    return NextResponse.json({ error: (error as Error).message.includes("isn't connected") || (error as Error).name === "DriveNotConnected" ? (error as Error).message : "Upload failed. Try again." }, { status: 502 });
  }
}
