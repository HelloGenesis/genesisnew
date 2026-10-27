-- Standard Phone and Email on influencer plan rows, and a tier set by hand (Genesis, 27 Oct 2026).
ALTER TABLE "crm_quote_creators" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "crm_quote_creators" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "crm_quote_creators" ADD COLUMN IF NOT EXISTS "tier" TEXT;

-- 1. The old contact line: its numbers and emails into phone and email, anything else (an agency, a manager) onto remarks.
UPDATE "crm_quote_creators" SET
  "phone" = NULLIF(array_to_string(ARRAY(SELECT DISTINCT trim(m[1]) FROM regexp_matches("contact", '(\+?\d[\d\s-]{7,}\d)', 'g') AS m), ', '), ''),
  "email" = NULLIF(array_to_string(ARRAY(SELECT DISTINCT lower(m[1]) FROM regexp_matches("contact", '([^\s@·,;]+@[^\s@·,;]+\.[A-Za-z]{2,})', 'g') AS m), ', '), '')
WHERE "contact" IS NOT NULL AND "contact" <> '';
UPDATE "crm_quote_creators" SET "remarks" = concat_ws(' · ', NULLIF("remarks", ''), rest)
FROM (
  SELECT "id" AS rid, NULLIF(trim(BOTH ' ·,;|-' FROM regexp_replace(regexp_replace(regexp_replace("contact", '[^\s@·,;]+@[^\s@·,;]+\.[A-Za-z]{2,}', '', 'g'), '\+?\d[\d\s-]{7,}\d', '', 'g'), '\s*[·,;|]\s*([·,;|]\s*)+', ' · ', 'g')), '') AS rest
  FROM "crm_quote_creators" WHERE "contact" IS NOT NULL AND "contact" <> ''
) r
WHERE "id" = r.rid AND r.rest IS NOT NULL AND position(r.rest IN coalesce("remarks", '')) = 0;
UPDATE "crm_quote_creators" SET "contact" = NULL WHERE "contact" IS NOT NULL;

-- 2. Added columns that were really phone, email or tier (from imported sheets): into the standard ones.
UPDATE "crm_quote_creators" SET "phone" = NULLIF(array_to_string(ARRAY(SELECT DISTINCT x FROM unnest(string_to_array(concat_ws(', ', "phone", (SELECT string_agg(trim(value), ', ') FROM jsonb_each_text("extra") WHERE key ~* '^\s*(phone|phone no\.?|phone number|mobile|mobile no\.?|mobile number|contact|contact no\.?|contact number|number|whatsapp|whatsapp number)\s*$' AND trim(value) <> '')), ', ')) AS x WHERE trim(x) <> ''), ', '), '')
WHERE EXISTS (SELECT 1 FROM jsonb_object_keys("extra") k WHERE k ~* '^\s*(phone|phone no\.?|phone number|mobile|mobile no\.?|mobile number|contact|contact no\.?|contact number|number|whatsapp|whatsapp number)\s*$');
UPDATE "crm_quote_creators" SET "email" = NULLIF(array_to_string(ARRAY(SELECT DISTINCT lower(trim(x)) FROM unnest(string_to_array(concat_ws(', ', "email", (SELECT string_agg(trim(value), ', ') FROM jsonb_each_text("extra") WHERE key ~* '^\s*(e-?mail|e-?mail id|email address|mail)\s*$' AND trim(value) <> '')), ', ')) AS x WHERE trim(x) <> ''), ', '), '')
WHERE EXISTS (SELECT 1 FROM jsonb_object_keys("extra") k WHERE k ~* '^\s*(e-?mail|e-?mail id|email address|mail)\s*$');
UPDATE "crm_quote_creators" SET "tier" = (SELECT trim(value) FROM jsonb_each_text("extra") WHERE key ~* '^\s*tier\s*$' AND trim(value) <> '' LIMIT 1)
WHERE "tier" IS NULL AND EXISTS (SELECT 1 FROM jsonb_object_keys("extra") k WHERE k ~* '^\s*tier\s*$');
UPDATE "crm_quote_creators" SET "extra" = "extra" - ARRAY(SELECT k FROM jsonb_object_keys("extra") k WHERE k ~* '^\s*(phone|phone no\.?|phone number|mobile|mobile no\.?|mobile number|contact|contact no\.?|contact number|number|whatsapp|whatsapp number|e-?mail|e-?mail id|email address|mail|tier)\s*$')
WHERE EXISTS (SELECT 1 FROM jsonb_object_keys("extra") k WHERE k ~* '^\s*(phone|phone no\.?|phone number|mobile|mobile no\.?|mobile number|contact|contact no\.?|contact number|number|whatsapp|whatsapp number|e-?mail|e-?mail id|email address|mail|tier)\s*$');
UPDATE "crm_quotes" SET "plan_columns" = jsonb_set("plan_columns", '{custom}', (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements_text("plan_columns"->'custom') x WHERE x !~* '^\s*(phone|phone no\.?|phone number|mobile|mobile no\.?|mobile number|contact|contact no\.?|contact number|number|whatsapp|whatsapp number|e-?mail|e-?mail id|email address|mail|tier)\s*$'))
WHERE jsonb_typeof("plan_columns"->'custom') = 'array';

-- 3. A plan that had hidden the Contact column hides Phone and Email.
UPDATE "crm_quotes" SET "plan_columns" = jsonb_set("plan_columns", '{hidden}', ("plan_columns"->'hidden') - 'contact' || '["phone","email"]'::jsonb)
WHERE jsonb_typeof("plan_columns"->'hidden') = 'array' AND ("plan_columns"->'hidden') ? 'contact';

-- 4. The same numbers and emails everywhere: the database fills in from its plans where it had none, then plans fill in from the database.
UPDATE "crm_creators" c SET "phone" = r.phone
FROM (SELECT "creator_id", (array_agg("phone" ORDER BY "id" DESC))[1] AS phone FROM "crm_quote_creators" WHERE "creator_id" IS NOT NULL AND "phone" IS NOT NULL GROUP BY "creator_id") r
WHERE c."id" = r."creator_id" AND (c."phone" IS NULL OR c."phone" = '');
UPDATE "crm_creators" c SET "email" = r.email
FROM (SELECT "creator_id", (array_agg("email" ORDER BY "id" DESC))[1] AS email FROM "crm_quote_creators" WHERE "creator_id" IS NOT NULL AND "email" IS NOT NULL GROUP BY "creator_id") r
WHERE c."id" = r."creator_id" AND (c."email" IS NULL OR c."email" = '');
UPDATE "crm_quote_creators" q SET "phone" = c."phone" FROM "crm_creators" c WHERE q."creator_id" = c."id" AND q."phone" IS NULL AND c."phone" IS NOT NULL AND c."phone" <> '';
UPDATE "crm_quote_creators" q SET "email" = c."email" FROM "crm_creators" c WHERE q."creator_id" = c."id" AND q."email" IS NULL AND c."email" IS NOT NULL AND c."email" <> '';
