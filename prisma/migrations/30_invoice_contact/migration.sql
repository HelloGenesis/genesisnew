-- The brand's point of contact on an invoice (Genesis, 12 Nov 2026): name and phone, beside the registered name.
ALTER TABLE "crm_invoices" ADD COLUMN "bill_to_contact" TEXT;
ALTER TABLE "crm_invoices" ADD COLUMN "bill_to_phone" TEXT;
