-- Tax invoice or proforma invoice (Genesis, 16 Nov 2026: "one option here to create a tax invoice or a performa invoice").
ALTER TABLE "crm_invoices" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'TAX';
