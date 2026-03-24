# Recipes

One JSON file per recipe. Run `npm run seed:recipes` to import into the database.

## File naming

Use the recipe slug as the filename: `croissant-clasico.json`

## Schema

See `schema.json` for the full JSON Schema definition.

### Required fields

- `slug` — Stable identifier (used for idempotent upsert)
- `name` — Display name
- `base_yield` — Number of units the recipe produces
- `yield_unit` — What the yield measures ("units", "batch", "g", etc.)
- `ingredients` — Array with at least one ingredient
- `steps` — Array with at least one step

### Optional fields

- `status` — Recipe status (default: "draft")
- `emoji` — Display emoji
- `description` — Short description
- `category` — Recipe category
- `oven_temp_c` — Oven temperature in Celsius
- `oven_mode` — "conventional" | "convection" | "steam"
- `prep_time_min` — Active preparation time
- `bake_time_min` — Time in the oven
- `rest_time_min` — Resting/chilling/proofing time
- `notes` — Baker's notes

## Import behavior

- **New slug** — inserts recipe
- **Existing slug** — updates recipe, replaces all ingredients and steps
- **Idempotent** — safe to run multiple times
