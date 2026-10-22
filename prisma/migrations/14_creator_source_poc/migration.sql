-- Where each influencer came from, and their agency's point of contact (22 Oct 2026).
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "poc_name" TEXT;
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "poc_contact" TEXT;
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "source" TEXT;
