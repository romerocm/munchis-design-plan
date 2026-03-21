"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken as getAuthToken } from "@/lib/auth/get-token";
import { formatDropNumber } from "@/lib/drops/constants";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { InputModal } from "@/components/shared/input-modal";
import { TabBar, type Tab } from "./tabs/tab-bar";
import { HomeTab } from "./tabs/home-tab";
import { OrdersTab } from "./tabs/orders-tab";
import { DropsTab } from "./tabs/drops-tab";
import { LabTab } from "./tabs/lab-tab";
import { DropManager } from "./drop-manager";
import { DropDetail } from "./drop-detail";
import { RecipeDetailView } from "./recipe-detail";
import { ShoppingList } from "./shopping-list";
import { BakingPlan } from "./baking-plan";
import { PickupChecklist } from "./pickup-checklist";
import type { Drop, Order, Recipe, DropStats } from "@/types/database";

type View =
  | { type: "tabs" }
  | { type: "dropDetail"; drop: Drop }
  | { type: "editDrop"; drop: Drop; from?: "dropDetail" }
  | { type: "recipeDetail"; recipeId: string }
  | { type: "shopping"; dropId: string }
  | { type: "baking"; dropId: string }
  | { type: "pickup"; dropId: string };

interface Props {
  drops: Drop[];
  orders: Order[];
  recipes: Recipe[];
  dropStats: DropStats[];
}

const DASHBOARD_SUBS = [
  { table: "drops", event: "*" as const },
  { table: "orders", event: "*" as const },
];

export function DashboardClient({ drops, orders, recipes, dropStats }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useRealtimeRefresh(DASHBOARD_SUBS);
  const [, startTransition] = useTransition();
  const [showNewRecipe, setShowNewRecipe] = useState(false);

  // Restore view/tab from URL search params on mount
  function parseViewFromParams(): { view: View; tab: Tab } {
    const v = searchParams.get("view");
    const dropId = searchParams.get("dropId");
    const recipeId = searchParams.get("recipeId");
    const t = (searchParams.get("tab") || "home") as Tab;

    if (v === "pickup" && dropId) return { view: { type: "pickup", dropId }, tab: t };
    if (v === "baking" && dropId) return { view: { type: "baking", dropId }, tab: t };
    if (v === "shopping" && dropId) return { view: { type: "shopping", dropId }, tab: t };
    if (v === "dropDetail" && dropId) {
      const drop = drops.find((d) => d.id === dropId);
      if (drop) return { view: { type: "dropDetail", drop }, tab: t };
    }
    if (v === "editDrop" && dropId) {
      const drop = drops.find((d) => d.id === dropId);
      const from = searchParams.get("from") as "dropDetail" | undefined;
      if (drop) return { view: { type: "editDrop", drop, from }, tab: t };
    }
    if (v === "recipeDetail" && recipeId) return { view: { type: "recipeDetail", recipeId }, tab: t };
    return { view: { type: "tabs" }, tab: t };
  }

  const initial = parseViewFromParams();
  const [tab, setTabState] = useState<Tab>(initial.tab);
  const [view, setViewState] = useState<View>(initial.view);

  // Sync state → URL (replaceState, no navigation)
  const syncUrl = useCallback((newView: View, newTab: Tab) => {
    const params = new URLSearchParams();
    if (newView.type !== "tabs") {
      params.set("view", newView.type);
      if ("dropId" in newView) params.set("dropId", newView.dropId);
      if (newView.type === "dropDetail") params.set("dropId", newView.drop.id);
      if (newView.type === "editDrop") {
        params.set("dropId", newView.drop.id);
        if (newView.from) params.set("from", newView.from);
      }
      if (newView.type === "recipeDetail") params.set("recipeId", newView.recipeId);
    }
    if (newTab !== "home") params.set("tab", newTab);
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, []);

  function setView(v: View) {
    setViewState(v);
    syncUrl(v, tab);
  }

  function setTab(t: Tab) {
    setTabState(t);
    syncUrl(view, t);
  }

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
    if (!token) throw new Error("Not authenticated");
    const res = await fetch("/api/parrot/drop-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dropId, status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
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
      setView({ type: "editDrop", drop });
    }
  }

  async function createRecipe(name: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/parrot/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { recipe } = await res.json();
      router.refresh();
      setView({ type: "recipeDetail", recipeId: recipe.id });
    }
  }

  async function handleOrderAction(orderId: string, dropId: string, action: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/drops/${dropId}/pickup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update order");
    }
    router.refresh();
  }

  function getDrop(dropId: string): Drop | undefined {
    return drops.find((d) => d.id === dropId);
  }

  // Sub-views (recipe detail, shopping, baking, drop detail, drop editor)
  if (view.type === "dropDetail") {
    // Use fresh data from props (server may have refreshed)
    const freshDrop = drops.find((d) => d.id === view.drop.id) || view.drop;
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <DropDetail
            drop={freshDrop}
            orders={orders}
            onBack={() => { setView({ type: "tabs" }); router.refresh(); }}
            onEdit={() => setView({ type: "editDrop", drop: freshDrop, from: "dropDetail" })}
            onOpenPickup={() => setView({ type: "pickup", dropId: freshDrop.id })}
            onOrderAction={handleOrderAction}
          />
        </div>
      </main>
    );
  }

  if (view.type === "editDrop") {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={() => {
                if (view.from === "dropDetail") {
                  setView({ type: "dropDetail", drop: view.drop });
                } else {
                  setView({ type: "tabs" });
                }
                router.refresh();
              }}
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
              DROP {formatDropNumber(view.drop.number)}
            </p>
            <h1 className="font-display font-black text-2xl text-forest">Edit drop</h1>
          </div>
          <div className="px-4 pb-8">
            <DropManager drop={view.drop} recipes={recipes} onClose={() => { setView({ type: "tabs" }); router.refresh(); }} />
          </div>
        </div>
      </main>
    );
  }

  if (view.type === "recipeDetail") {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <RecipeDetailView
            recipeId={view.recipeId}
            getToken={getToken}
            onBack={() => {
              startTransition(() => {
                router.refresh();
              });
              setView({ type: "tabs" });
            }}
          />
        </div>
      </main>
    );
  }

  if (view.type === "shopping") {
    const drop = getDrop(view.dropId);
    if (!drop) { setView({ type: "tabs" }); return null; }
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <ShoppingList
            dropId={view.dropId}
            drop={drop}
            getToken={getToken}
            onBack={() => { setView({ type: "tabs" }); router.refresh(); }}
            onSwitchToBaking={() => setView({ type: "baking", dropId: view.dropId })}
            onViewRecipe={(recipeId) => setView({ type: "recipeDetail", recipeId })}
          />
        </div>
      </main>
    );
  }

  if (view.type === "baking") {
    const drop = getDrop(view.dropId);
    if (!drop) { setView({ type: "tabs" }); return null; }
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <BakingPlan
            dropId={view.dropId}
            drop={drop}
            getToken={getToken}
            onBack={() => { setView({ type: "tabs" }); router.refresh(); }}
            onSwitchToShopping={() => setView({ type: "shopping", dropId: view.dropId })}
            onViewRecipe={(recipeId) => setView({ type: "recipeDetail", recipeId })}
            onUpdateStatus={updateStatus}
            onOpenPickup={(dropId) => setView({ type: "pickup", dropId })}
          />
        </div>
      </main>
    );
  }

  if (view.type === "pickup") {
    const drop = getDrop(view.dropId);
    if (!drop) { setView({ type: "tabs" }); return null; }
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-lg mx-auto">
          <PickupChecklist
            dropId={view.dropId}
            drop={drop}
            getToken={getToken}
            onBack={() => { setView({ type: "tabs" }); router.refresh(); }}
            onUpdateStatus={updateStatus}
          />
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
            dropStats={dropStats}
            onEditDrop={(drop) => setView({ type: "editDrop", drop })}
            onViewOrders={() => setTab("orders")}
            onUpdateStatus={updateStatus}
            onOpenShopping={(dropId) => setView({ type: "shopping", dropId })}
            onOpenBaking={(dropId) => setView({ type: "baking", dropId })}
            onOpenPickup={(dropId) => setView({ type: "pickup", dropId })}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            drops={drops}
            orders={orders}
            onSimulatePayment={simulatePayment}
          />
        )}
        {tab === "lab" && (
          <LabTab
            recipes={recipes}
            drops={drops}
            dropStats={dropStats}
            onSelectRecipe={(recipe) => setView({ type: "recipeDetail", recipeId: recipe.id })}
            onCreateRecipe={() => setShowNewRecipe(true)}
            onOpenShopping={(dropId) => setView({ type: "shopping", dropId })}
            onOpenBaking={(dropId) => setView({ type: "baking", dropId })}
          />
        )}
        {tab === "drops" && (
          <DropsTab
            drops={drops}
            orders={orders}
            onEditDrop={(drop) => setView({ type: "dropDetail", drop })}
            onCreateDrop={createDrop}
          />
        )}
      </div>
      <TabBar active={tab} onChange={setTab} />
      {showNewRecipe && (
        <InputModal
          title="New Recipe"
          placeholder="e.g. Matcha White Chocolate"
          confirmLabel="Create"
          onConfirm={(name) => { setShowNewRecipe(false); createRecipe(name); }}
          onClose={() => setShowNewRecipe(false)}
        />
      )}
    </main>
  );
}
