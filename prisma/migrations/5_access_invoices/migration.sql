-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "grants" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "crm_tasks" ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "crm_quotes" ADD COLUMN     "igst" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proposal_influencers" TEXT,
ADD COLUMN     "proposal_objectives" TEXT,
ADD COLUMN     "proposal_platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "proposal_problems" TEXT;

-- CreateTable
CREATE TABLE "crm_invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "fy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "account_id" TEXT,
    "quote_id" TEXT,
    "order_id" TEXT,
    "bill_to_name" TEXT NOT NULL,
    "bill_to_email" TEXT,
    "bill_to_gstin" TEXT,
    "bill_to_address" TEXT,
    "place_of_supply" TEXT NOT NULL DEFAULT 'Maharashtra',
    "igst" BOOLEAN NOT NULL DEFAULT false,
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "subtotal_paise" INTEGER NOT NULL DEFAULT 0,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "cgst_paise" INTEGER NOT NULL DEFAULT 0,
    "sgst_paise" INTEGER NOT NULL DEFAULT 0,
    "igst_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "razorpay_link_id" TEXT,
    "payment_url" TEXT,
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "sac" TEXT NOT NULL DEFAULT '998361',
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unit_paise" INTEGER NOT NULL,

    CONSTRAINT "crm_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_number_key" ON "crm_invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_token_key" ON "crm_invoices"("token");

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_razorpay_link_id_key" ON "crm_invoices"("razorpay_link_id");

-- CreateIndex
CREATE INDEX "crm_invoices_status_issue_date_idx" ON "crm_invoices"("status", "issue_date");

-- CreateIndex
CREATE INDEX "crm_invoices_account_id_idx" ON "crm_invoices"("account_id");

-- CreateIndex
CREATE INDEX "crm_invoices_created_by_id_idx" ON "crm_invoices"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_invoices_fy_seq_key" ON "crm_invoices"("fy", "seq");

-- AddForeignKey
ALTER TABLE "crm_invoice_lines" ADD CONSTRAINT "crm_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

