import type { DropShoppingItem } from "@/types/database";

let counter = 0;

export function makeShoppingItem(overrides: Partial<DropShoppingItem> = {}): DropShoppingItem {
  counter++;
  return {
    id: `shopping-${counter}-${Date.now()}`,
    drop_id: "drop-1",
    ingredient_name: "All-purpose flour",
    ingredient_category: null,
    base_quantity: 300,
    scaled_quantity: 2500,
    unit: "g",
    checked: false,
    checked_at: null,
    sort_order: counter,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
