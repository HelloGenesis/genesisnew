-- Genesis CRM subscriptions bought on the site are orders too (14 Oct 2026).
ALTER TYPE "Division" ADD VALUE IF NOT EXISTS 'CRM';
