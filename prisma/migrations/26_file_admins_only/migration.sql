-- Admins only (Genesis, 31 Oct 2026: "by default the file access is visible to admin for each organisation").
ALTER TYPE "FileAudience" ADD VALUE IF NOT EXISTS 'ADMINS' BEFORE 'TEAM';
