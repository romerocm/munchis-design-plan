import type { Recipe, RecipeIngredient, RecipeStep } from "@/types/database";

let counter = 0;

export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  counter++;
  const now = new Date().toISOString();
  return {
    id: `recipe-${counter}-${Date.now()}`,
    status: "draft",
    name: "Chocolate Chip Cookies",
    description: "Classic cookies with dark chocolate chips",
    emoji: "🍪",
    image_url: null,
    base_yield: 24,
    yield_unit: "cookies",
    prep_time_min: 20,
    bake_time_min: 12,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function makeIngredient(overrides: Partial<RecipeIngredient> = {}): RecipeIngredient {
  counter++;
  return {
    id: `ingredient-${counter}-${Date.now()}`,
    recipe_id: "recipe-1",
    name: "All-purpose flour",
    quantity: 300,
    unit: "g",
    sort_order: counter,
    category: null,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeStep(overrides: Partial<RecipeStep> = {}): RecipeStep {
  counter++;
  return {
    id: `step-${counter}-${Date.now()}`,
    recipe_id: "recipe-1",
    step_number: counter,
    title: "Mix dry ingredients",
    description: "Combine flour, baking soda, and salt in a bowl",
    duration_min: 5,
    is_timer_step: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
