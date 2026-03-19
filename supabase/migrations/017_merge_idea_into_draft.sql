-- Merge "idea" status into "draft" — simplify to 3 active states + archived.
-- Keep the enum value for backwards compat, but migrate all existing rows.
UPDATE recipes SET status = 'draft' WHERE status = 'idea';
