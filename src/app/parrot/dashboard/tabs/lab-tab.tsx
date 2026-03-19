"use client";

import { useState } from "react";
import { RECIPE_STATUS_LABELS, RECIPE_STATUS_COLORS } from "@/lib/recipes/constants";
import { formatCents } from "@/lib/format";
import type { Recipe, Drop, DropStats } from "@/types/database";

type FilterChip = "all" | "active" | "testing" | "draft" | "archived";

interface Props {
  recipes: Recipe[];
  drops: Drop[];
  dropStats: DropStats[];
  onSelectRecipe: (recipe: Recipe) => void;
  onCreateRecipe: () => void;
  onOpenShopping: (dropId: string) => void;
  onOpenBaking: (dropId: string) => void;
}

export function LabTab({ recipes, drops, dropStats, onSelectRecipe, onCreateRecipe, onOpenShopping, onOpenBaking }: Props) {
  const [filter, setFilter] = useState<FilterChip>("all");

  const filters: { id: FilterChip; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Signature" },
    { id: "testing", label: "Testing" },
    { id: "draft", label: "Drafts" },
    { id: "archived", label: "Archived" },
  ];

  // Active now: closed drops with shopping to do, or baking drops with steps to do
  const activeNow = dropStats.filter(
    (ds) =>
      (ds.status === "closed" && ds.shopping_total > 0 && ds.shopping_checked < ds.shopping_total) ||
      (ds.status === "baking" && ds.baking_total > 0 && ds.baking_done < ds.baking_total)
  );

  // Filter recipes (treat legacy "idea" as "draft")
  const filtered = filter === "all"
    ? recipes.filter((r) => r.status !== "archived")
    : filter === "draft"
    ? recipes.filter((r) => r.status === "draft" || r.status === "idea")
    : recipes.filter((r) => r.status === filter);

  // Group by status (merge legacy "idea" into "draft")
  const grouped = new Map<string, Recipe[]>();
  for (const r of filtered) {
    const key = r.status === "idea" ? "draft" : r.status;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  // Display order for status groups
  const statusOrder = ["active", "testing", "draft", "archived"];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-5 pb-1">
        <div>
          <h1 className="font-display font-black text-2xl text-forest">Lab</h1>
          <p className="text-[13px] text-forest/45 mt-0.5">Your recipes & experiments</p>
        </div>
        <button
          onClick={onCreateRecipe}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-white text-sm font-semibold btn-press"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New
        </button>
      </div>

      {/* Active Now */}
      {activeNow.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[11px] font-semibold text-amber uppercase tracking-wider mb-2">Active Now</p>
          <div className="space-y-2">
            {activeNow.map((ds) => {
              const isBakingState = ds.status === "baking";
              const hasBaking = isBakingState && ds.baking_total > 0 && ds.baking_done < ds.baking_total;
              const hasShopping = !isBakingState && ds.shopping_total > 0 && ds.shopping_checked < ds.shopping_total;

              if (hasBaking) {
                return (
                  <button
                    key={`baking-${ds.drop_id}`}
                    onClick={() => onOpenBaking(ds.drop_id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-amber/8 border border-amber/15 btn-press"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="#B8860B" strokeWidth="1.3" />
                        <path d="M8 4.5V8l2.5 1.5" stroke="#B8860B" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-forest">
                        Baking {ds.recipe_name || ds.flavor_name}
                      </p>
                      <p className="text-[12px] text-forest/45">
                        {ds.baking_done}/{ds.baking_total} steps done
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </button>
                );
              }

              if (hasShopping) {
                return (
                  <button
                    key={`shopping-${ds.drop_id}`}
                    onClick={() => onOpenShopping(ds.drop_id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-mint/40 border border-forest/8 btn-press"
                  >
                    <div className="w-9 h-9 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="3" width="10" height="10" rx="2" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.5" />
                        <path d="M5.5 8l2 2 3-3.5" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-forest">
                        Shopping for Drop #{String(ds.drop_number).padStart(2, "0")}
                      </p>
                      <p className="text-[12px] text-forest/45">
                        {ds.shopping_checked}/{ds.shopping_total} items bought
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </button>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 px-4 mt-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition btn-press ${
              filter === f.id
                ? "bg-forest text-white"
                : "bg-forest/5 text-forest/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recipe Groups */}
      <div className="mt-4 px-4 space-y-4">
        {statusOrder.map((status) => {
          const group = grouped.get(status);
          if (!group || group.length === 0) return null;

          return (
            <div key={status}>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                status === "active" ? "text-forest" :
                status === "testing" ? "text-amber" :
                "text-forest/40"
              }`}>
                {RECIPE_STATUS_LABELS[status as keyof typeof RECIPE_STATUS_LABELS]}
              </p>
              <div className="space-y-2">
                {group.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => onSelectRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center px-6">
          <div className="w-14 h-14 rounded-full bg-forest/5 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 6v6l4 2" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
              <circle cx="12" cy="12" r="9" stroke="#1B3D2F" strokeWidth="1.5" opacity="0.25" />
            </svg>
          </div>
          <p className="font-display font-black text-lg text-forest">No recipes yet</p>
          <p className="text-[13px] text-forest/40 mt-1">
            Tap + New to start building your first recipe.
          </p>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const timeMin = (recipe.prep_time_min || 0) + (recipe.bake_time_min || 0);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-forest/6 btn-press"
    >
      {/* Image / emoji */}
      <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 overflow-hidden">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{recipe.emoji || "📝"}</span>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[15px] font-semibold text-forest truncate">{recipe.name}</p>
        <p className="text-[12px] text-forest/45 mt-0.5">
          {timeMin > 0 ? `~${timeMin}min` : recipe.description || "Tap to edit"}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
      </svg>
    </button>
  );
}
