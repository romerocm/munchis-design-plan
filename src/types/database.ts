export type DropStatus = "draft" | "scheduled" | "live" | "closed" | "baking" | "ready" | "completed";
export type OrderStatus = "pending" | "confirmed" | "expired" | "cancelled" | "no_show" | "picked_up";
export type RecipeStatus = "idea" | "draft" | "testing" | "active" | "archived";
export type IngredientUnit = "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "cup" | "oz" | "lb" | "unit" | "pinch";
export type BakingStepStatus = "pending" | "active" | "completed" | "skipped";

export interface Drop {
  id: string;
  number: number;
  status: DropStatus;
  flavor_name: string;
  flavor_description: string | null;
  flavor_color: string;
  price_cents: number;
  capacity: number;
  pickup_location: string;
  pickup_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  orders_open_at: string;
  orders_close_at: string;
  closed_at: string | null;
  groceries_bought_at: string | null;
  recipe_id: string | null;
  hero_image_url: string | null;
  flavor_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type OvenMode = "conventional" | "convection" | "steam";

export interface Recipe {
  id: string;
  slug: string | null;
  status: RecipeStatus;
  name: string;
  description: string | null;
  emoji: string | null;
  image_url: string | null;
  base_yield: number;
  yield_unit: string;
  prep_time_min: number | null;
  bake_time_min: number | null;
  rest_time_min: number | null;
  oven_temp_c: number | null;
  oven_mode: OvenMode;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
  sort_order: number;
  category: string | null;
  notes: string | null;
  created_at: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string;
  description: string | null;
  duration_min: number | null;
  is_timer_step: boolean;
  created_at: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface DropShoppingItem {
  id: string;
  drop_id: string;
  ingredient_name: string;
  ingredient_category: string | null;
  base_quantity: number;
  scaled_quantity: number;
  unit: string;
  checked: boolean;
  checked_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface DropBakingStep {
  id: string;
  drop_id: string;
  step_number: number;
  title: string;
  description: string | null;
  duration_min: number | null;
  is_timer_step: boolean;
  status: BakingStepStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  drop_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string | null;
  quantity: number;
  total_cents: number;
  payment_expires_at: string;
  paid_at: string | null;
  picked_up_at: string | null;
  wompi_payment_id: string | null;
  wompi_payment_link: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WhatsappMessageStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "undelivered";

export interface WhatsappMessage {
  id: string;
  order_id: string | null;
  drop_id: string | null;
  recipient: string;
  template_name: string;
  content_sid: string;
  twilio_sid: string | null;
  status: WhatsappMessageStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappOptOut {
  id: string;
  whatsapp: string;
  opted_out_at: string;
}

export interface NotifyListEntry {
  id: string;
  whatsapp: string;
  drop_id: string | null;
  created_at: string;
}

export interface DropStats {
  drop_id: string;
  drop_number: number;
  flavor_name: string;
  capacity: number;
  status: DropStatus;
  recipe_id: string | null;
  recipe_name: string | null;
  confirmed_orders: number;
  confirmed_quantity: number;
  confirmed_revenue_cents: number;
  pending_orders: number;
  pending_quantity: number;
  shopping_checked: number;
  shopping_total: number;
  baking_done: number;
  baking_total: number;
}

// Supabase generated type helper
export interface Database {
  public: {
    Tables: {
      drops: {
        Row: Drop;
        Insert: Omit<Drop, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Drop, "id" | "created_at" | "updated_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Order, "id" | "created_at" | "updated_at">>;
      };
      notify_list: {
        Row: NotifyListEntry;
        Insert: Omit<NotifyListEntry, "id" | "created_at">;
        Update: Partial<Omit<NotifyListEntry, "id" | "created_at">>;
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Recipe, "id" | "created_at" | "updated_at">>;
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Omit<RecipeIngredient, "id" | "created_at">;
        Update: Partial<Omit<RecipeIngredient, "id" | "created_at">>;
      };
      recipe_steps: {
        Row: RecipeStep;
        Insert: Omit<RecipeStep, "id" | "created_at">;
        Update: Partial<Omit<RecipeStep, "id" | "created_at">>;
      };
      drop_shopping_items: {
        Row: DropShoppingItem;
        Insert: Omit<DropShoppingItem, "id" | "created_at">;
        Update: Partial<Omit<DropShoppingItem, "id" | "created_at">>;
      };
      drop_baking_steps: {
        Row: DropBakingStep;
        Insert: Omit<DropBakingStep, "id" | "created_at">;
        Update: Partial<Omit<DropBakingStep, "id" | "created_at">>;
      };
      whatsapp_messages: {
        Row: WhatsappMessage;
        Insert: Omit<WhatsappMessage, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<WhatsappMessage, "id" | "created_at" | "updated_at">>;
      };
      whatsapp_opt_outs: {
        Row: WhatsappOptOut;
        Insert: Omit<WhatsappOptOut, "id" | "opted_out_at">;
        Update: Partial<Omit<WhatsappOptOut, "id" | "opted_out_at">>;
      };
    };
    Views: {
      drop_stats: {
        Row: DropStats;
      };
    };
    Functions: {
      expire_stale_orders: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_drop_remaining_capacity: {
        Args: { p_drop_id: string };
        Returns: number;
      };
    };
    Enums: {
      drop_status: DropStatus;
      order_status: OrderStatus;
      recipe_status: RecipeStatus;
      ingredient_unit: IngredientUnit;
      baking_step_status: BakingStepStatus;
    };
  };
}
