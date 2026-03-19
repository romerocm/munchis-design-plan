"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDropNumber } from "@/lib/drops/constants";
import type { DropShoppingItem, Drop } from "@/types/database";

interface Props {
  dropId: string;
  drop: Drop;
  getToken: () => Promise<string | null>;
  onBack: () => void;
  onSwitchToBaking: () => void;
  onViewRecipe: (recipeId: string) => void;
}

export function ShoppingList({ dropId, drop, getToken, onBack, onSwitchToBaking, onViewRecipe }: Props) {
  const [items, setItems] = useState<DropShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [boughtExpanded, setBoughtExpanded] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchItems = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/drops/${dropId}/shopping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { items: data } = await res.json();
      setItems(data);
    }
    setLoading(false);
  }, [dropId, getToken]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function toggleItem(itemId: string, checked: boolean) {
    const token = await getToken();
    if (!token) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => i.id === itemId ? { ...i, checked, checked_at: checked ? new Date().toISOString() : null } : i)
    );

    await fetch(`/api/parrot/drops/${dropId}/shopping`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemId, checked }),
    });
  }

  async function syncFromRecipe() {
    const token = await getToken();
    if (!token) return;
    setSyncing(true);
    const res = await fetch(`/api/parrot/drops/${dropId}/shopping`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { items: updated, added } = await res.json();
      if (updated) setItems(updated);
    }
    setSyncing(false);
  }

  const stillNeed = items.filter((i) => !i.checked);
  const bought = items.filter((i) => i.checked);
  const allBought = items.length > 0 && stillNeed.length === 0;

  if (loading) {
    return (
      <div className="pb-8">
        {/* Nav skeleton */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="h-4 w-24 bg-forest/5 rounded animate-pulse" />
          <div className="h-4 w-20 bg-forest/5 rounded animate-pulse" />
        </div>
        {/* Tabs */}
        <div className="flex border-b border-forest/8 mx-4">
          <div className="flex-1 pb-2 flex justify-center"><div className="h-4 w-16 bg-forest/5 rounded animate-pulse" /></div>
          <div className="flex-1 pb-2 flex justify-center"><div className="h-4 w-14 bg-forest/5 rounded animate-pulse" /></div>
        </div>
        {/* Title */}
        <div className="px-4 mt-4">
          <div className="h-8 w-40 bg-forest/5 rounded animate-pulse" />
          <div className="h-4 w-32 bg-forest/5 rounded animate-pulse mt-1.5" />
        </div>
        {/* Progress bar */}
        <div className="mx-4 mt-4 h-2 bg-forest/5 rounded-full animate-pulse" />
        {/* Items */}
        <div className="px-4 mt-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-forest/5">
              <div className="w-5 h-5 rounded-md bg-forest/5 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-4 bg-forest/5 rounded animate-pulse" />
              <div className="h-4 w-12 bg-forest/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-forest/50 text-sm btn-press">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drop {formatDropNumber(drop.number)}
        </button>
        {drop.recipe_id && (
          <button onClick={() => onViewRecipe(drop.recipe_id!)} className="text-amber text-sm font-medium btn-press">
            View recipe
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-forest/8 mx-4">
        <button
          className="flex-1 pb-2 text-sm font-medium text-center text-forest border-b-2 border-forest"
        >
          Shopping
        </button>
        <button
          onClick={onSwitchToBaking}
          className="flex-1 pb-2 text-sm font-medium text-center text-forest/35"
        >
          Baking
        </button>
      </div>

      {/* Title */}
      <div className="px-4 mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-forest">Shopping List</h1>
          <p className="text-[13px] text-forest/45 mt-0.5">{drop.flavor_name}</p>
        </div>
        {drop.recipe_id && (
          <button
            onClick={syncFromRecipe}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/5 text-[12px] font-medium text-forest/50 btn-press hover:bg-forest/8 transition disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={syncing ? "animate-spin" : ""}>
              <path d="M10.5 2v3h-3M1.5 10V7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.2 4.5A4.5 4.5 0 0110.1 3.5M9.8 7.5A4.5 4.5 0 011.9 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Sync
          </button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-forest/6 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ backgroundColor: "#E1CDE4", width: `${(bought.length / items.length) * 100}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-forest/50">{bought.length}/{items.length}</span>
          </div>
        </div>
      )}

      {/* Still Need */}
      {stillNeed.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[11px] font-semibold text-amber uppercase tracking-wider mb-2">Still Need</p>
          <div className="bg-white rounded-xl border border-forest/6 overflow-hidden">
            {stillNeed.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id, true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-forest/4 last:border-b-0 btn-press"
              >
                <div className="w-5 h-5 rounded-md border-2 border-forest/20 flex-shrink-0" />
                <span className="flex-1 text-left text-[14px] text-forest">{item.ingredient_name}</span>
                <span className="text-[14px] text-forest/50">
                  {item.scaled_quantity} {item.unit}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bought */}
      {bought.length > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={() => setBoughtExpanded(!boughtExpanded)}
            className="flex items-center gap-2 mb-2 btn-press"
          >
            <p className="text-[11px] font-semibold text-forest/40 uppercase tracking-wider">Bought</p>
            <span className="px-1.5 py-0.5 rounded-full bg-forest/8 text-[10px] font-semibold text-forest/50">
              {bought.length}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${boughtExpanded ? "rotate-180" : ""}`}>
              <path d="M2.5 4L5 6.5 7.5 4" stroke="#1B3D2F" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            </svg>
          </button>
          {boughtExpanded ? (
            <div className="bg-white/60 rounded-xl border border-forest/4 overflow-hidden">
              {bought.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id, false)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-forest/3 last:border-b-0 btn-press"
                >
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1CDE4", borderColor: "#E1CDE4" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 6.5L5 8.5L9 4" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="flex-1 text-left text-[14px] text-forest/40 line-through">{item.ingredient_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/60 border border-forest/4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1CDE4" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 6.5L5 8.5L9 4" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[13px] text-forest/40">
                {bought.map((i) => i.ingredient_name).slice(0, 4).join(" · ")}
                {bought.length > 4 ? ` + ${bought.length - 4} more` : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Completion CTA */}
      {allBought && (
        <div className="mx-4 mt-6 p-5 rounded-2xl bg-mint/40 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-forest/8 flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#1B3D2F" strokeWidth="1.5" opacity="0.4" />
              <path d="M8 12l3 3 5-5" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            </svg>
          </div>
          <p className="font-display font-black text-lg text-forest">All ingredients bought!</p>
          <p className="text-[13px] text-forest/45 mt-1">You&apos;re ready for baking day. Tap below to switch to the baking plan.</p>
          <button
            onClick={onSwitchToBaking}
            className="mt-4 w-full py-3 rounded-xl bg-forest text-white text-sm font-semibold btn-press flex items-center justify-center gap-2"
          >
            Start baking plan
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center px-6">
          <p className="font-display font-black text-lg text-forest">No shopping list</p>
          <p className="text-[13px] text-forest/40 mt-1">
            Link a recipe to this drop to auto-generate a shopping list when orders close.
          </p>
        </div>
      )}
    </div>
  );
}
