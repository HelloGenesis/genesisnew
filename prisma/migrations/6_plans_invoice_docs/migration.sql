-- AlterTable
ALTER TABLE "crm_creators" ADD COLUMN     "dl_rate_paise" INTEGER,
ADD COLUMN     "youtube_url" TEXT;

-- AlterTable
ALTER TABLE "crm_quotes" ADD COLUMN     "ext_sheet_id" TEXT,
ADD COLUMN     "int_sheet_id" TEXT,
ADD COLUMN     "markup_percent" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "plan_budget" TEXT;

-- AlterTable
ALTER TABLE "crm_quote_creators" ADD COLUMN     "contact" TEXT,
ADD COLUMN     "dl_cost_paise" INTEGER,
ADD COLUMN     "dl_price_paise" INTEGER,
ADD COLUMN     "engagement_rate" DOUBLE PRECISION,
ADD COLUMN     "reachout" TEXT,
ADD COLUMN     "reel_cost_paise" INTEGER,
ADD COLUMN     "reel_price_paise" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "story_cost_paise" INTEGER,
ADD COLUMN     "story_price_paise" INTEGER;

-- AlterTable
ALTER TABLE "crm_invoices" ADD COLUMN     "bill_to_pan" TEXT,
ADD COLUMN     "execution_date" DATE,
ADD COLUMN     "payment_term_days" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "po_date" DATE,
ADD COLUMN     "po_number" TEXT,
ADD COLUMN     "quotation_date" DATE,
ADD COLUMN     "quotation_ref" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "signatory_id" TEXT,
ADD COLUMN     "signed_at" TIMESTAMP(3),
ADD COLUMN     "signed_by_id" TEXT;

-- AlterTable
ALTER TABLE "crm_invoice_lines" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'NOS';

-- CreateTable
CREATE TABLE "crm_invoice_files" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_invoice_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_invoice_files_invoice_id_kind_idx" ON "crm_invoice_files"("invoice_id", "kind");

-- AddForeignKey
ALTER TABLE "crm_invoice_files" ADD CONSTRAINT "crm_invoice_files_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

