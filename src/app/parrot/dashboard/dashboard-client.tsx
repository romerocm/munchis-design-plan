"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getToken as getAuthToken } from "@/lib/auth/get-token";
import { formatDropNumber } from "@/lib/drops/constants";
import { TabBar, type Tab } from "./tabs/tab-bar";
import { HomeTab } from "./tabs/home-tab";
import { OrdersTab } from "./tabs/orders-tab";
import { DropsTab } from "./tabs/drops-tab";
import { DropManager } from "./drop-manager";
import type { Drop, Order } from "@/types/database";

interface Props {
  drops: Drop[];
  orders: Order[];
}

export function DashboardClient({ drops, orders }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  async function getToken() {
    const token = await getAuthToken();
    if (!token) {
      router.push("/parrot/login");
      return null;
    }
    return token;
  }

  async function updateStatus(dropId: string, status: string) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/parrot/drop-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dropId, status }),
    });
    router.refresh();
  }

  async function simulatePayment(orderId: string) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/parrot/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    });
    router.refresh();
  }

  async function createDrop() {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/parrot/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const { drop } = await res.json();
      router.refresh();
      setEditingDrop(drop);
    }
  }

  // Drop editor detail view
  if (editingDrop) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={() => { setEditingDrop(null); router.refresh(); }}
              className="flex items-center gap-2 text-forest/50 btn-press"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <span className="text-sm font-semibold text-green-accent">Auto-saved</span>
          </div>
          <div className="px-4 pb-3">
            <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">
              DROP {formatDropNumber(editingDrop.number)}
            </p>
            <h1 className="font-display font-black text-2xl text-forest">Edit drop</h1>
          </div>
          <div className="px-4 pb-8">
            <DropManager drop={editingDrop} />
          </div>
        </div>
      </main>
    );
  }

  // Tab views
  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto">
        {tab === "home" && (
          <HomeTab
            drops={drops}
            orders={orders}
            onEditDrop={setEditingDrop}
            onViewOrders={() => setTab("orders")}
            onUpdateStatus={updateStatus}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            drops={drops}
            orders={orders}
            onSimulatePayment={simulatePayment}
          />
        )}
        {tab === "drops" && (
          <DropsTab
            drops={drops}
            orders={orders}
            onEditDrop={setEditingDrop}
            onCreateDrop={createDrop}
          />
        )}
      </div>
      <TabBar active={tab} onChange={setTab} />

    </main>
  );
}
