-- Designed emails with buttons (Genesis, 31 Oct 2026: approve from the email, confirm a quote). The text version stays.
ALTER TABLE "crm_email_outbox" ADD COLUMN "html" TEXT;
