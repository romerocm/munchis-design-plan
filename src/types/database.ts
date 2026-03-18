export type DropStatus = "draft" | "live" | "closed" | "baking" | "ready" | "completed";
export type OrderStatus = "pending" | "confirmed" | "expired" | "cancelled" | "picked_up";

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
  hero_image_url: string | null;
  flavor_image_url: string | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  confirmed_orders: number;
  confirmed_quantity: number;
  confirmed_revenue_cents: number;
  pending_orders: number;
  pending_quantity: number;
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
    };
  };
}
