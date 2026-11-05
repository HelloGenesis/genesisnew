-- A quote's currency (Genesis, 5 Nov 2026: clients abroad, e.g. Saudi Arabia).
-- Anything but INR is an export of services: no GST. Its Razorpay order keeps
-- the same currency; payments are still recorded in rupees as settled.
ALTER TABLE "crm_quotes" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "crm_orders" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR';
