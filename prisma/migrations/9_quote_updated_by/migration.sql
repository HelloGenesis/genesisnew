-- Who saved a quote last, so two people editing it are told rather than overwriting each other (Genesis, 14 Oct 2026).
ALTER TABLE "crm_quotes" ADD COLUMN "updated_by_id" TEXT;
