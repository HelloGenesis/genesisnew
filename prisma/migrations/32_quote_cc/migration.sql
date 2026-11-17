-- More people on a quote's emails (Genesis, 17 Nov 2026: "add multiple cc option").
ALTER TABLE "crm_quotes" ADD COLUMN "cc_emails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "crm_email_outbox" ADD COLUMN "cc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
