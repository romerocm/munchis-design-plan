/**
 * Seed recipes from JSON files into the Supabase database.
 *
 * Usage:
 *   npx tsx scripts/seed-recipes.ts                  # seed all recipes
 *   npx tsx scripts/seed-recipes.ts croissant-clasico # seed one recipe by slug
 *   npx tsx scripts/seed-recipes.ts --dry-run         # validate without writing
 *
 * Reads .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
}

interface RecipeStepInput {
  title: string;
  description?: string;
  duration_min?: number;
  is_timer_step?: boolean;
}

interface RecipeInput {
  slug: string;
  name: string;
  status?: string;
  emoji?: string;
  description?: string;
  category?: string;
  base_yield: number;
  yield_unit: string;
  oven_temp_c?: number;
  oven_mode?: string;
  prep_time_min?: number;
  bake_time_min?: number;
  rest_time_min?: number;
  notes?: string;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStepInput[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RECIPES_DIR = join(import.meta.dirname ?? __dirname, "..", "recipes");
const ENV_PATH = join(import.meta.dirname ?? __dirname, "..", ".env.local");

const VALID_UNITS = new Set([
  "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "unit", "pinch",
]);

const VALID_STATUSES = new Set([
  "idea", "draft", "testing", "active", "archived",
]);

const VALID_OVEN_MODES = new Set(["conventional", "convection", "steam"]);

// ---------------------------------------------------------------------------
// Env loading (minimal — no dotenv dependency needed)
// ---------------------------------------------------------------------------

function loadEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(recipe: RecipeInput): string[] {
  const errors: string[] = [];

  if (!recipe.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(recipe.slug)) {
    errors.push(`Invalid slug: "${recipe.slug}" — must be lowercase, hyphen-separated`);
  }
  if (!recipe.name?.trim()) {
    errors.push("Missing required field: name");
  }
  if (!recipe.base_yield || recipe.base_yield < 1) {
    errors.push(`Invalid base_yield: ${recipe.base_yield} — must be >= 1`);
  }
  if (!recipe.yield_unit?.trim()) {
    errors.push("Missing required field: yield_unit");
  }
  if (recipe.status && !VALID_STATUSES.has(recipe.status)) {
    errors.push(`Invalid status: "${recipe.status}" — must be one of: ${[...VALID_STATUSES].join(", ")}`);
  }
  if (recipe.oven_temp_c != null && (recipe.oven_temp_c < 50 || recipe.oven_temp_c > 350)) {
    errors.push(`Invalid oven_temp_c: ${recipe.oven_temp_c} — must be 50-350`);
  }
  if (recipe.oven_mode && !VALID_OVEN_MODES.has(recipe.oven_mode)) {
    errors.push(`Invalid oven_mode: "${recipe.oven_mode}" — must be one of: ${[...VALID_OVEN_MODES].join(", ")}`);
  }

  if (!recipe.ingredients?.length) {
    errors.push("Recipe must have at least one ingredient");
  } else {
    recipe.ingredients.forEach((ing, i) => {
      if (!ing.name?.trim()) errors.push(`Ingredient ${i + 1}: missing name`);
      if (ing.quantity == null || ing.quantity <= 0) errors.push(`Ingredient ${i + 1} (${ing.name}): quantity must be > 0`);
      if (!VALID_UNITS.has(ing.unit)) errors.push(`Ingredient ${i + 1} (${ing.name}): invalid unit "${ing.unit}" — valid: ${[...VALID_UNITS].join(", ")}`);
    });
  }

  if (!recipe.steps?.length) {
    errors.push("Recipe must have at least one step");
  } else {
    recipe.steps.forEach((step, i) => {
      if (!step.title?.trim()) errors.push(`Step ${i + 1}: missing title`);
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seedRecipe(
  supabase: ReturnType<typeof createClient>,
  recipe: RecipeInput,
  dryRun: boolean,
): Promise<{ action: "insert" | "update" | "skip"; slug: string }> {
  // Check if recipe exists by slug
  const { data: existing } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", recipe.slug)
    .maybeSingle();

  const recipeRow = {
    slug: recipe.slug,
    name: recipe.name.trim(),
    status: recipe.status || "draft",
    emoji: recipe.emoji || null,
    description: recipe.description || null,
    category: recipe.category || null,
    base_yield: recipe.base_yield,
    yield_unit: recipe.yield_unit,
    oven_temp_c: recipe.oven_temp_c ?? null,
    oven_mode: recipe.oven_mode || "conventional",
    prep_time_min: recipe.prep_time_min ?? null,
    bake_time_min: recipe.bake_time_min ?? null,
    rest_time_min: recipe.rest_time_min ?? null,
    notes: recipe.notes || null,
  };

  if (dryRun) {
    return { action: existing ? "update" : "insert", slug: recipe.slug };
  }

  let recipeId: string;

  if (existing) {
    // Update existing recipe
    const { error } = await supabase
      .from("recipes")
      .update(recipeRow)
      .eq("id", existing.id);

    if (error) throw new Error(`Failed to update recipe "${recipe.slug}": ${error.message}`);
    recipeId = existing.id;

    // Clear old ingredients and steps (will re-insert)
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);
  } else {
    // Insert new recipe
    const { data, error } = await supabase
      .from("recipes")
      .insert(recipeRow)
      .select("id")
      .single();

    if (error) throw new Error(`Failed to insert recipe "${recipe.slug}": ${error.message}`);
    recipeId = data.id;
  }

  // Insert ingredients
  if (recipe.ingredients.length > 0) {
    const ingredientRows = recipe.ingredients.map((ing, i) => ({
      recipe_id: recipeId,
      name: ing.name.trim(),
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category || null,
      notes: ing.notes || null,
      sort_order: i + 1,
    }));

    const { error } = await supabase.from("recipe_ingredients").insert(ingredientRows);
    if (error) throw new Error(`Failed to insert ingredients for "${recipe.slug}": ${error.message}`);
  }

  // Insert steps
  if (recipe.steps.length > 0) {
    const stepRows = recipe.steps.map((step, i) => ({
      recipe_id: recipeId,
      step_number: i + 1,
      title: step.title.trim(),
      description: step.description || null,
      duration_min: step.duration_min ?? null,
      is_timer_step: step.is_timer_step ?? false,
    }));

    const { error } = await supabase.from("recipe_steps").insert(stepRows);
    if (error) throw new Error(`Failed to insert steps for "${recipe.slug}": ${error.message}`);
  }

  return { action: existing ? "update" : "insert", slug: recipe.slug };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const slugFilter = args.find((a) => !a.startsWith("--"));

  // Load env
  const env = loadEnv(ENV_PATH);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load recipe files
  const files = readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "schema.json")
    .filter((f) => !slugFilter || basename(f, ".json") === slugFilter);

  if (files.length === 0) {
    console.log(slugFilter ? `No recipe found for slug: ${slugFilter}` : "No recipe JSON files found in recipes/");
    process.exit(0);
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Found ${files.length} recipe file(s)\n`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = join(RECIPES_DIR, file);
    let recipe: RecipeInput;

    try {
      recipe = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      console.error(`  FAIL  ${file} — invalid JSON`);
      failed++;
      continue;
    }

    const errors = validate(recipe);
    if (errors.length > 0) {
      console.error(`  FAIL  ${file}`);
      errors.forEach((e) => console.error(`         ${e}`));
      failed++;
      continue;
    }

    try {
      const result = await seedRecipe(supabase, recipe, dryRun);
      const icon = result.action === "insert" ? "  NEW " : "  UPD ";
      console.log(`${icon} ${recipe.name} (${recipe.slug})`);
      if (result.action === "insert") inserted++;
      else updated++;
    } catch (err) {
      console.error(`  FAIL  ${file} — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${failed} failed`);
  if (dryRun) console.log("(dry run — no changes written)");
  if (failed > 0) process.exit(1);
}

main();
