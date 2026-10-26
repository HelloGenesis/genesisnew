import { NextResponse } from "next/server";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { inWorkspace } from "@/lib/crm/request-workspace";
import { isSuperAdmin } from "@/lib/crm/scope";
import { dedicatedSheet, type SheetTabKey } from "@/lib/crm/sheets";
import { xlsx } from "@/lib/xlsx";
import { EXPENSE_CATEGORY } from "@/lib/crm/company";
import { ACCOUNT_KIND, DIVISION_LABEL, LEAD_SOURCE, LEAD_STATUS, ORDER_STATUS, PROJECT_STATUS, REQUEST_KIND, REQUEST_STATUS, projectRef, requestRef } from "@/lib/crm/catalog";
import { type StaffArea, can, getViewer, staffAccess } from "@/lib/crm/session";
import { stageName } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";

type Cell = string | number | null | undefined;
const rs = (p: number | null | undefined) => (p === null || p === undefined ? "" : Math.round(p) / 100);
const d = (v: Date | null | undefined) => (v ? v.toISOString() : "");

/** Spreadsheet-safe CSV: quoted, and a leading = + - @ neutralised so a cell can't run as a formula. */
function csv(rows: Cell[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let s = cell === null || cell === undefined ? "" : String(cell);
          if (/^[=+\-@]/.test(s)) s = `'${s}`;
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}

const EXPORTS: Record<string, { area?: StaffArea; build: () => Promise<Cell[][]> }> = {
  invoices: {
    async build() {
      const rows = await getPrisma().invoice.findMany({ orderBy: [{ issueDate: "desc" }, { seq: "desc" }] });
      return [["Number", "Date", "Due", "Status", "Billed to", "GSTIN", "Place of supply", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)", "Paid at"],
        ...rows.map((i) => [i.number, d(i.issueDate).slice(0, 10), d(i.dueDate).slice(0, 10), i.status, i.billToName, i.billToGstin, i.placeOfSupply, rs(i.subtotalPaise - i.discountPaise), rs(i.cgstPaise), rs(i.sgstPaise), rs(i.igstPaise), rs(i.totalPaise), d(i.paidAt)])];
    },
  },
  quotes: {
    area: "sales",
    async build() {
      const rows = await getPrisma().quote.findMany({ orderBy: { number: "desc" } });
      return [["Number", "Kind", "Title", "Client", "Email", "Status", "Total (₹)", "Issued", "Sent", "Accepted", "Expires"],
        ...rows.map((q) => [`#${String(q.number).padStart(7, "0")}`, q.kind, q.title, q.company ?? q.contactName, q.contactEmail, q.status, rs(q.totalPaise), d(q.issuedAt), d(q.sentAt), d(q.acceptedAt), d(q.expiresAt).slice(0, 10)])];
    },
  },
  expenses: {
    area: "finance",
    async build() {
      const rows = await getPrisma().expense.findMany({ orderBy: { date: "desc" } });
      return [["Date", "Category", "What", "Paid to", "Paid via", "Amount (₹)", "GST (₹)", "Reference", "Notes"],
        ...rows.map((e) => [d(e.date).slice(0, 10), EXPENSE_CATEGORY[e.category], e.description, e.payee, e.paidVia, rs(e.amountPaise), rs(e.gstPaise), e.reference, e.notes])];
    },
  },
  leads: {
    area: "sales",
    async build() {
      const rows = await getPrisma().lead.findMany({ orderBy: { createdAt: "desc" }, include: { owner: true, partner: true } });
      return [["Added", "Name", "Company", "Email", "Phone", "Division", "Interest", "Source", "Partner", "Status", "Value (₹)", "Owner", "Next follow-up", "Notes"],
        ...rows.map((l) => [d(l.createdAt), l.name, l.company, l.email, l.phone, l.division ? DIVISION_LABEL[l.division] : "", l.interest, LEAD_SOURCE[l.source], l.partner?.name, LEAD_STATUS[l.status].label, rs(l.valuePaise), l.owner?.email, d(l.nextFollowUp).slice(0, 10), l.notes])];
    },
  },
  accounts: {
    area: "sales",
    async build() {
      const rows = await getPrisma().account.findMany({ orderBy: { name: "asc" }, include: { parent: true, referredBy: true, manager: true } });
      return [["Name", "Type", "Reseller %", "Status", "Agency", "Referred by", "Email", "Phone", "GSTIN", "City", "Manager", "Added"],
        ...rows.map((a) => [a.name, ACCOUNT_KIND[a.kind], a.isReseller ? a.commissionPercent : "", a.status, a.parent?.name, a.referredBy?.name, a.email, a.phone, a.gstin, a.city, a.manager?.email, d(a.createdAt)])];
    },
  },
  orders: {
    area: "finance",
    async build() {
      const rows = await getPrisma().order.findMany({ orderBy: { createdAt: "desc" }, include: { lines: true, account: true } });
      return [["Reference", "Created", "Status", "Channel", "Client", "Contact", "Email", "Items", "Billing", "Subtotal (₹)", "Discounts (₹)", "Tax (₹)", "Total (₹)", "Paid at", "Razorpay"],
        ...rows.map((o) => [o.reference, d(o.createdAt), ORDER_STATUS[o.status].label, o.channel, o.account?.name ?? o.company, o.contactName, o.contactEmail, o.lines.map((l) => `${l.name} x${l.qty}`).join("; "), o.billing, rs(o.subtotalPaise), rs(o.discountPaise + o.comboDiscountPaise), rs(o.taxPaise), rs(o.totalPaise), d(o.paidAt), [o.razorpayPaymentId, o.razorpaySubscriptionId, o.razorpayLinkId].filter(Boolean).join(" ")])];
    },
  },
  projects: {
    async build() {
      const rows = await getPrisma().project.findMany({ orderBy: { createdAt: "desc" }, include: { account: true, manager: true, _count: { select: { deliverables: { where: { status: "APPROVED" } } } } } });
      return [["Ref", "Project", "Client", "Division", "Stage", "Status", "Delivered", "Quota", "Producer", "Due", "Created"],
        ...rows.map((p) => [projectRef(p.number), p.name, p.account.name, DIVISION_LABEL[p.division], stageName(p), PROJECT_STATUS[p.status].label, p._count.deliverables, p.quota, p.manager?.email, d(p.dueDate).slice(0, 10), d(p.createdAt)])];
    },
  },
  requests: {
    async build() {
      const rows = await getPrisma().request.findMany({ orderBy: { createdAt: "desc" }, include: { account: true, assignee: true } });
      return [["Ref", "Opened", "Client", "Type", "Title", "Status", "Priority", "Assignee", "Closed"],
        ...rows.map((r) => [requestRef(r.number), d(r.createdAt), r.account.name, REQUEST_KIND[r.kind], r.title, REQUEST_STATUS[r.status].label, r.priority, r.assignee?.email, d(r.closedAt)])];
    },
  },
  creators: {
    async build() {
      const rows = await getPrisma().creator.findMany({ orderBy: { followers: "desc" } });
      return [["Name", "Handle", "Platform", "Profile", "Followers", "Avg views", "ER %", "Tier", "Niches", "Languages", "City", "Reel (₹)", "Story (₹)", "Post (₹)", "Email", "Phone", "Managed by", "Tags", "Do not use"],
        ...rows.map((c) => [c.name, c.handle, c.platform, c.profileUrl, c.followers, c.avgViews, c.engagementRate, c.tier, c.niches.join("; "), c.languages.join("; "), c.city, rs(c.reelRatePaise), rs(c.storyRatePaise), rs(c.postRatePaise), c.email, c.phone, c.managedBy, c.tags.join("; "), c.blacklisted ? "yes" : ""])];
    },
  },
  payouts: {
    area: "finance",
    async build() {
      const prisma = getPrisma();
      const [commissions, invoices] = await Promise.all([prisma.commission.findMany({ include: { partner: true } }), prisma.vendorInvoice.findMany({ include: { vendor: true } })]);
      return [["Type", "To", "Reference", "Amount (₹)", "Status", "Created", "Paid"],
        ...commissions.map((c) => ["Commission", c.partner.name, `${c.percent}% of ${rs(c.basePaise)}`, rs(c.amountPaise), c.status, d(c.createdAt), d(c.paidAt)]),
        ...invoices.map((i) => ["Vendor invoice", i.vendor.name, i.number, rs(i.amountPaise + i.taxPaise), i.status, d(i.createdAt), d(i.paidAt)])];
    },
  },
};

/* Which live Google Sheet each export matches (lib/crm/sheets). */
const SHEET: Record<string, SheetTabKey> = { leads: "leads", accounts: "accounts", orders: "orders", projects: "projects", requests: "requests", creators: "creators", expenses: "expenses", invoices: "invoices", quotes: "quotes" };

/**
 * CSV by default; ?format=xlsx for Excel; ?open=sheet to the live Google
 * Sheet for this kind (made on first use, filled within a minute).
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const url = new URL(request.url);
  const spec = EXPORTS[kind];
  if (!spec) return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  const viewer = await getViewer();
  if (staffAccess(viewer) !== "granted" || (spec.area && !can(viewer, spec.area))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  /* A whole-table export is everyone's data: super admins only (expenses: finance too). */
  if (kind !== "expenses" && !isSuperAdmin(viewer!)) return NextResponse.json({ error: "Only super admins can export everything." }, { status: 403 });
  if (url.searchParams.get("open") === "sheet") {
    const tab = SHEET[kind];
    if (!tab) return NextResponse.json({ error: "There's no Google Sheet for this list." }, { status: 404 });
    try {
      const id = await dedicatedSheet(tab);
      if (id) {
        await recordAuditLog({ action: "crm.sheet_opened", entity: kind, actorId: viewer!.id });
        return NextResponse.redirect(`https://docs.google.com/spreadsheets/d/${id}/edit`);
      }
    } catch (error) {
      console.error("[crm] open sheet", kind, error);
    }
    return new NextResponse(
      "The live Google Sheets need the company account (hello@genesismedia.co) to connect Google with file access: sign in as hello@, open Inbox · Gmail & Drive and click Connect Google (or Reconnect).",
      { status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  /* The CRM being looked at: Genesis's own, or the agency an owner switched to — never the two mixed. */
  const rows = await inWorkspace(viewer!.ws, () => spec.build());
  await recordAuditLog({ action: "crm.exported", entity: kind, actorId: viewer!.id, metadata: { format: url.searchParams.get("format") ?? "csv" } });
  const stamp = new Date().toISOString().slice(0, 10);
  if (url.searchParams.get("format") === "xlsx") {
    return new NextResponse(new Uint8Array(xlsx(kind, rows)), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="genesis-${kind}-${stamp}.xlsx"`, "Cache-Control": "no-store" },
    });
  }
  const body = csv(rows);
  return new NextResponse(`﻿${body}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="genesis-${kind}-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
}
