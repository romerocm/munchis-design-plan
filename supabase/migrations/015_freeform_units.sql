-- Switch ingredient units from enum to freeform text so bakers can write
-- "2 large", "¾ cup", etc. instead of being limited to enum values.

ALTER TABLE recipe_ingredients ALTER COLUMN unit TYPE text USING unit::text;
ALTER TABLE recipe_ingredients ALTER COLUMN unit SET DEFAULT 'unit';

ALTER TABLE drop_shopping_items ALTER COLUMN unit TYPE text USING unit::text;
ALTER TABLE drop_shopping_items ALTER COLUMN unit SET DEFAULT 'unit';
