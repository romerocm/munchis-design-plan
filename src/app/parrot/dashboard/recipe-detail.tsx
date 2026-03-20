"use client";

import { useState, useEffect, useCallback } from "react";
import { RECIPE_STATUS_LABELS, RECIPE_STATUS_COLORS, RECIPE_TRANSITIONS, RECIPE_TRANSITION_LABELS } from "@/lib/recipes/constants";
import { formatCents } from "@/lib/format";
import { InputModal } from "@/components/shared/input-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeDetail as RecipeDetailType, RecipeStatus } from "@/types/database";

interface Props {
  recipeId: string;
  getToken: () => Promise<string | null>;
  onBack: () => void;
}

export function RecipeDetailView({ recipeId, getToken, onBack }: Props) {
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [inputModal, setInputModal] = useState<{ type: "ingredient" | "step" } | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "archive" | "delete" } | null>(null);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Draft state for edit mode
  const [draftEmoji, setDraftEmoji] = useState("📝");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftYield, setDraftYield] = useState(1);
  const [draftYieldUnit, setDraftYieldUnit] = useState("batch");
  const [draftBakeTime, setDraftBakeTime] = useState<number | null>(null);

  const fetchRecipe = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { recipe: data } = await res.json();
      setRecipe(data);
      setDraftEmoji(data.emoji || "📝");
      setDraftName(data.name);
      setDraftDescription(data.description || "");
      setDraftYield(data.base_yield);
      setDraftYieldUnit(data.yield_unit);
      setDraftBakeTime(data.bake_time_min);
    }
    setLoading(false);
  }, [recipeId, getToken]);

  useEffect(() => { fetchRecipe(); }, [fetchRecipe]);

  async function saveRecipe() {
    if (!recipe) return;
    // Optimistic: apply changes to read view immediately
    setRecipe({
      ...recipe,
      emoji: draftEmoji,
      name: draftName,
      description: draftDescription || null,
      base_yield: draftYield,
      yield_unit: draftYieldUnit,
      bake_time_min: draftBakeTime,
    });
    setEditing(false);

    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        emoji: draftEmoji,
        name: draftName,
        description: draftDescription || null,
        base_yield: draftYield,
        yield_unit: draftYieldUnit,
        bake_time_min: draftBakeTime,
      }),
    });
    if (!res.ok) {
      // Revert on failure — refetch truth from server
      fetchRecipe();
    }
  }

  // ── Optimistic helpers ──
  // Snapshot current recipe, apply local change, fire API, revert on failure.

  function optimistic(mutate: (prev: RecipeDetailType) => RecipeDetailType, apiFn: () => Promise<Response>) {
    if (!recipe) return;
    const snapshot = recipe;
    setRecipe(mutate(recipe));
    setEditingField(null);

    apiFn().then(async (res) => {
      if (!res.ok) {
        setRecipe(snapshot); // revert
      }
    }).catch(() => {
      setRecipe(snapshot); // revert on network error
    });
  }

  async function addIngredient(name: string) {
    const token = await getToken();
    if (!token || !recipe) return;
    // Optimistic: add a temporary ingredient
    const tempId = `temp-${Date.now()}`;
    const nextOrder = recipe.ingredients.length;
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, {
        id: tempId, recipe_id: recipeId, name, quantity: 1, unit: "unit",
        sort_order: nextOrder, category: null, notes: null, created_at: new Date().toISOString(),
      }],
    });

    const res = await fetch(`/api/parrot/recipes/${recipeId}/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, quantity: 1, unit: "unit" }),
    });
    if (res.ok) {
      const { ingredient } = await res.json();
      // Replace temp with real
      setRecipe((prev) => prev ? {
        ...prev,
        ingredients: prev.ingredients.map((i) => i.id === tempId ? ingredient : i),
      } : prev);
    } else {
      // Revert
      setRecipe((prev) => prev ? {
        ...prev,
        ingredients: prev.ingredients.filter((i) => i.id !== tempId),
      } : prev);
    }
  }

  function updateIngredient(ingredientId: string, fields: Record<string, unknown>) {
    const token$ = getToken();
    optimistic(
      (prev) => ({
        ...prev,
        ingredients: prev.ingredients.map((i) =>
          i.id === ingredientId ? { ...i, ...fields } as typeof i : i
        ),
      }),
      async () => {
        const token = await token$;
        if (!token) return new Response(null, { status: 401 });
        return fetch(`/api/parrot/recipes/${recipeId}/ingredients/${ingredientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(fields),
        });
      }
    );
  }

  function updateStepField(stepId: string, fields: Record<string, unknown>) {
    const token$ = getToken();
    optimistic(
      (prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.id === stepId ? { ...s, ...fields } as typeof s : s
        ),
      }),
      async () => {
        const token = await token$;
        if (!token) return new Response(null, { status: 401 });
        return fetch(`/api/parrot/recipes/${recipeId}/steps/${stepId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(fields),
        });
      }
    );
  }

  function deleteIngredient(ingredientId: string) {
    const token$ = getToken();
    optimistic(
      (prev) => ({
        ...prev,
        ingredients: prev.ingredients.filter((i) => i.id !== ingredientId),
      }),
      async () => {
        const token = await token$;
        if (!token) return new Response(null, { status: 401 });
        return fetch(`/api/parrot/recipes/${recipeId}/ingredients/${ingredientId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    );
  }

  async function addStep(title: string) {
    const token = await getToken();
    if (!token || !recipe) return;
    const tempId = `temp-${Date.now()}`;
    const nextNumber = (recipe.steps.length > 0 ? Math.max(...recipe.steps.map((s) => s.step_number)) : 0) + 1;
    setRecipe({
      ...recipe,
      steps: [...recipe.steps, {
        id: tempId, recipe_id: recipeId, step_number: nextNumber, title,
        description: null, duration_min: null, is_timer_step: false, created_at: new Date().toISOString(),
      }],
    });

    const res = await fetch(`/api/parrot/recipes/${recipeId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const { step } = await res.json();
      setRecipe((prev) => prev ? {
        ...prev,
        steps: prev.steps.map((s) => s.id === tempId ? step : s),
      } : prev);
    } else {
      setRecipe((prev) => prev ? {
        ...prev,
        steps: prev.steps.filter((s) => s.id !== tempId),
      } : prev);
    }
  }

  function deleteStep(stepId: string) {
    const token$ = getToken();
    optimistic(
      (prev) => ({
        ...prev,
        steps: prev.steps.filter((s) => s.id !== stepId),
      }),
      async () => {
        const token = await token$;
        if (!token) return new Response(null, { status: 401 });
        return fetch(`/api/parrot/recipes/${recipeId}/steps/${stepId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    );
  }

  async function changeStatus(status: RecipeStatus) {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/parrot/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (status === "archived") {
      onBack();
    } else {
      setStatusDropdown(false);
      fetchRecipe();
    }
  }

  async function deleteRecipe() {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/recipes/${recipeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      onBack();
    }
  }

  if (loading) {
    return (
      <div className="pb-8">
        {/* Nav skeleton */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="h-4 w-12 bg-forest/5 rounded animate-pulse" />
          <div className="h-8 w-16 bg-forest/5 rounded-full animate-pulse" />
        </div>
        {/* Title + status */}
        <div className="px-4 mt-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-48 bg-forest/5 rounded animate-pulse" />
            <div className="h-5 w-16 bg-forest/5 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-forest/5 rounded animate-pulse mt-2" />
        </div>
        {/* Stats row */}
        <div className="flex gap-3 px-4 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-14 bg-forest/5 rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Ingredients section */}
        <div className="px-4 mt-6">
          <div className="h-5 w-28 bg-forest/5 rounded animate-pulse mb-3" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 w-full bg-forest/5 rounded animate-pulse mb-2.5" />
          ))}
        </div>
        {/* Steps section */}
        <div className="px-4 mt-6">
          <div className="h-5 w-20 bg-forest/5 rounded animate-pulse mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 mb-3">
              <div className="w-6 h-6 bg-forest/5 rounded-full animate-pulse flex-shrink-0" />
              <div className="h-4 flex-1 bg-forest/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="px-4 pt-4">
        <button onClick={onBack} className="text-forest/50 text-sm btn-press mb-4">← Lab</button>
        <p className="text-forest/40">Recipe not found.</p>
      </div>
    );
  }

  const totalTime = (recipe.prep_time_min || 0) + (recipe.bake_time_min || 0);
  const INITIAL_SHOW = 6;

  // Edit mode
  if (editing) {
    return (
      <div className="pb-8">
        {/* Nav */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => { setEditing(false); fetchRecipe(); }} className="text-forest/50 text-[15px] btn-press">
            Cancel
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/15">
            <div className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span className="text-xs font-semibold text-amber">Editing</span>
          </div>
          <button onClick={saveRecipe} className="px-4 py-1.5 rounded-full bg-forest text-white text-sm font-semibold btn-press">
            Done
          </button>
        </div>

        {/* Emoji + Recipe Name */}
        <div className="px-4 mt-2 flex items-end gap-3">
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl flex-shrink-0 btn-press hover:ring-2 hover:ring-amber/30 transition"
          >
            {draftEmoji}
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Recipe Name</p>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full font-display font-black text-2xl text-forest bg-transparent border-b-2 border-forest/30 focus:border-amber outline-none pb-1 mt-1"
            />
          </div>
        </div>

        {showEmojiPicker && (
          <EmojiPicker
            current={draftEmoji}
            onSelect={setDraftEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {/* Description */}
        <div className="px-4 mt-4">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Description</p>
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={2}
            className="w-full text-[14px] text-forest/70 bg-transparent border-b border-forest/10 focus:border-amber outline-none mt-1 resize-none"
          />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 px-4 mt-4 border-t border-forest/6 pt-4">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Yield</p>
            <div className="flex items-baseline gap-1 mt-1">
              <input
                type="number"
                value={draftYield}
                onChange={(e) => setDraftYield(parseInt(e.target.value) || 1)}
                className="w-12 font-display font-black text-xl text-forest bg-transparent outline-none"
              />
              <input
                value={draftYieldUnit}
                onChange={(e) => setDraftYieldUnit(e.target.value)}
                className="text-[12px] text-forest/45 bg-transparent outline-none w-16"
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Bake Time</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display font-black text-xl text-forest">~</span>
              <input
                type="number"
                value={draftBakeTime || ""}
                onChange={(e) => setDraftBakeTime(parseInt(e.target.value) || null)}
                placeholder="0"
                className="w-12 font-display font-black text-xl text-forest bg-transparent outline-none"
              />
              <span className="text-[12px] text-forest/45">min</span>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="px-4 mt-5">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-2">Ingredients</p>
          <div className="bg-white rounded-xl border border-forest/6 overflow-hidden">
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className={`flex items-center gap-2.5 px-3 py-3 border-b border-forest/4 last:border-b-0 transition-all duration-200 ${ing.id.startsWith("temp-") ? "animate-fade-up" : ""}`}>
                {editingField === `ing-name-${ing.id}` ? (
                  <input
                    autoFocus
                    defaultValue={ing.name}
                    onBlur={(e) => updateIngredient(ing.id, { name: e.target.value.trim() || ing.name })}
                    onKeyDown={(e) => e.key === "Enter" && updateIngredient(ing.id, { name: (e.target as HTMLInputElement).value.trim() || ing.name })}
                    className="flex-1 text-[14px] text-forest bg-white outline-none border-b-2 border-amber/50"
                  />
                ) : (
                  <span
                    className="flex-1 text-[14px] text-forest cursor-pointer"
                    onClick={() => setEditingField(`ing-name-${ing.id}`)}
                  >
                    {ing.name}
                  </span>
                )}
                {editingField === `ing-qty-${ing.id}` ? (
                  <form
                    className="flex items-center gap-1 bg-cream rounded-full px-2 py-0.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const qty = parseFloat((form.elements.namedItem("qty") as HTMLInputElement).value) || ing.quantity;
                      const unit = (form.elements.namedItem("unit") as HTMLInputElement).value.trim() || ing.unit;
                      updateIngredient(ing.id, { quantity: qty, unit });
                    }}
                  >
                    <input
                      autoFocus
                      name="qty"
                      defaultValue={ing.quantity}
                      className="w-10 text-[12px] text-forest bg-transparent outline-none text-right font-medium"
                      onKeyDown={(e) => e.key === "Escape" && setEditingField(null)}
                    />
                    <input
                      name="unit"
                      defaultValue={ing.unit}
                      className="w-14 text-[12px] text-forest/60 bg-transparent outline-none font-medium"
                      placeholder="unit"
                      onKeyDown={(e) => e.key === "Escape" && setEditingField(null)}
                    />
                    <button type="submit" className="text-[10px] font-bold text-forest/40">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6.5L5 8.5L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setEditingField(`ing-qty-${ing.id}`)}
                    className="px-2.5 py-0.5 rounded-full bg-cream text-[12px] text-forest/60 font-medium hover:ring-1 hover:ring-amber/30 transition btn-press"
                  >
                    {ing.quantity} {ing.unit}
                  </button>
                )}
                <button onClick={() => deleteIngredient(ing.id)} className="text-forest/20 hover:text-red-400 btn-press">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => setInputModal({ type: "ingredient" })}
              className="w-full px-3 py-3 text-center text-[14px] font-medium text-forest/35 hover:text-forest/50 btn-press"
            >
              + Add ingredient
            </button>
          </div>
        </div>

        {/* Baking Steps */}
        <div className="px-4 mt-5">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-2">Baking Steps</p>
          <div className="bg-white rounded-xl border border-forest/6 overflow-hidden">
            {recipe.steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-2.5 px-3 py-3 border-b border-forest/4 last:border-b-0 transition-all duration-200 ${step.id.startsWith("temp-") ? "animate-fade-up" : ""}`}>
                <div className="w-6 h-6 rounded-full bg-[#E1CDE4] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-forest">{step.step_number}</span>
                </div>
                {editingField === `step-title-${step.id}` ? (
                  <input
                    autoFocus
                    defaultValue={step.title}
                    onBlur={(e) => updateStepField(step.id, { title: e.target.value.trim() || step.title })}
                    onKeyDown={(e) => e.key === "Enter" && updateStepField(step.id, { title: (e.target as HTMLInputElement).value.trim() || step.title })}
                    className="flex-1 text-[14px] text-forest bg-white outline-none border-b-2 border-amber/50"
                  />
                ) : (
                  <span
                    className="flex-1 text-[14px] text-forest cursor-pointer"
                    onClick={() => setEditingField(`step-title-${step.id}`)}
                  >
                    {step.title}
                  </span>
                )}
                <button onClick={() => deleteStep(step.id)} className="text-forest/20 hover:text-red-400 btn-press">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => setInputModal({ type: "step" })}
              className="w-full px-3 py-3 text-center text-[14px] font-medium text-forest/35 hover:text-forest/50 btn-press"
            >
              + Add step
            </button>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="px-4 mt-6 space-y-2">
          {/* Promote / change status */}
          {(RECIPE_TRANSITIONS[recipe.status] || []).length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-2">Status</p>
              {(RECIPE_TRANSITIONS[recipe.status] || []).map((target) => {
                const label = RECIPE_TRANSITION_LABELS[recipe.status]?.[target] || target;
                return (
                  <button
                    key={target}
                    onClick={() => changeStatus(target)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-forest/6 btn-press"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${
                        target === "active" ? "bg-green-500" :
                        target === "testing" ? "bg-blue-500" :
                        target === "draft" ? "bg-amber-500" :
                        "bg-gray-400"
                      }`} />
                      <span className="text-sm font-semibold text-forest">{label}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </button>
                );
              })}
            </>
          )}

          {/* Archive (available from any non-archived status) */}
          {recipe.status !== "archived" && (
            <button
              onClick={() => setConfirmAction({ type: "archive" })}
              className="w-full flex items-center p-4 rounded-xl bg-white border border-forest/6 btn-press gap-3"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-forest">Archive recipe</p>
                <p className="text-[12px] text-forest/40">Hide from Lab, keep for history</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="2" width="15" height="4" rx="1" stroke="#1B3D2F" strokeWidth="1.2" opacity="0.3" />
                <path d="M3 6v8.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V6" stroke="#1B3D2F" strokeWidth="1.2" opacity="0.3" />
                <path d="M7 10h4" stroke="#1B3D2F" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
              </svg>
            </button>
          )}

          {/* Delete for archived recipes */}
          {recipe.status === "archived" && (
            <button
              onClick={() => setConfirmAction({ type: "delete" })}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-red-200 btn-press"
            >
              <div>
                <p className="text-sm font-semibold text-red-500">Delete permanently</p>
                <p className="text-[12px] text-red-400/60">This can&apos;t be undone</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v8.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5V4" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Confirm modals */}
        {confirmAction?.type === "archive" && (
          <ConfirmModal
            title="Archive recipe?"
            message="It will be hidden from the Lab but kept for history. You can restore it anytime."
            confirmLabel="Archive"
            onConfirm={() => { setConfirmAction(null); changeStatus("archived"); }}
            onClose={() => setConfirmAction(null)}
          />
        )}
        {confirmAction?.type === "delete" && (
          <ConfirmModal
            title="Delete permanently?"
            message="This recipe and all its ingredients and steps will be gone forever."
            confirmLabel="Delete"
            destructive
            onConfirm={() => { setConfirmAction(null); deleteRecipe(); }}
            onClose={() => setConfirmAction(null)}
          />
        )}

        {/* Input modals */}
        {inputModal?.type === "ingredient" && (
          <InputModal
            title="Add Ingredient"
            placeholder="e.g. Unsalted butter"
            confirmLabel="Add"
            onConfirm={(name) => { setInputModal(null); addIngredient(name); }}
            onClose={() => setInputModal(null)}
          />
        )}
        {inputModal?.type === "step" && (
          <InputModal
            title="Add Step"
            placeholder="e.g. Brown the butter"
            confirmLabel="Add"
            onConfirm={(title) => { setInputModal(null); addStep(title); }}
            onClose={() => setInputModal(null)}
          />
        )}
      </div>
    );
  }

  // Read mode
  return (
    <div className="pb-8">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-forest/50 text-sm btn-press">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lab
        </button>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-1.5 rounded-full bg-forest text-white text-sm font-semibold btn-press"
        >
          Edit
        </button>
      </div>

      {/* Title + Status */}
      <div className="px-4 mt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display font-black text-2xl text-forest">{recipe.name}</h1>
          <div className="relative">
            <button
              onClick={() => setStatusDropdown(!statusDropdown)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase btn-press flex items-center gap-1 ${RECIPE_STATUS_COLORS[recipe.status]}`}
            >
              {RECIPE_STATUS_LABELS[recipe.status]}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            {statusDropdown && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-10 min-w-[180px]">
                {/* Current status */}
                <div className="px-4 py-2.5 text-sm font-semibold text-forest bg-forest/5 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    recipe.status === "active" ? "bg-green-500" :
                    recipe.status === "testing" ? "bg-blue-500" :
                    recipe.status === "draft" ? "bg-amber-500" :
                    recipe.status === "archived" ? "bg-gray-400" :
                    "bg-gray-300"
                  }`} />
                  {RECIPE_STATUS_LABELS[recipe.status]}
                </div>
                {/* Available transitions */}
                {(RECIPE_TRANSITIONS[recipe.status] || []).map((target) => {
                  const label = RECIPE_TRANSITION_LABELS[recipe.status]?.[target] || RECIPE_STATUS_LABELS[target];
                  return (
                    <button
                      key={target}
                      onClick={() => changeStatus(target)}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-forest/60 hover:bg-forest/5 flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        target === "active" ? "bg-green-500" :
                        target === "testing" ? "bg-blue-500" :
                        target === "draft" ? "bg-amber-500" :
                        "bg-gray-400"
                      }`} />
                      {label}
                    </button>
                  );
                })}
                {recipe.status !== "archived" && (
                  <button
                    onClick={() => { setStatusDropdown(false); setConfirmAction({ type: "archive" }); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-forest/40 hover:bg-forest/5 flex items-center gap-2 border-t border-forest/5"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="10" height="3" rx="0.5" stroke="currentColor" strokeWidth="0.8" />
                      <path d="M2 4v5.5a1 1 0 001 1h6a1 1 0 001-1V4" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {recipe.description && (
          <p className="text-[14px] text-forest/50 mt-1 leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {/* Archived banner */}
      {recipe.status === "archived" && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-between">
          <p className="text-[13px] text-forest/50">This recipe is archived.</p>
          <button
            onClick={() => changeStatus("active")}
            className="px-3 py-1 rounded-full bg-forest text-white text-[12px] font-semibold btn-press"
          >
            Restore
          </button>
        </div>
      )}

      {/* Confirm modals (read mode) */}
      {confirmAction?.type === "archive" && (
        <ConfirmModal
          title="Archive recipe?"
          message="It will be hidden from the Lab but kept for history. You can restore it anytime."
          confirmLabel="Archive"
          onConfirm={() => { setConfirmAction(null); changeStatus("archived"); }}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {/* Stats row */}
      <div className="flex gap-6 px-4 mt-4">
        {recipe.bake_time_min && (
          <div>
            <p className="font-display font-black text-xl text-forest">~{recipe.bake_time_min >= 60 ? `${Math.round(recipe.bake_time_min / 60)}h` : `${recipe.bake_time_min}m`}</p>
            <p className="text-[11px] text-forest/40">bake time</p>
          </div>
        )}
        <div>
          <p className="font-display font-black text-xl text-forest">{recipe.base_yield}</p>
          <p className="text-[11px] text-forest/40">{recipe.yield_unit}</p>
        </div>
      </div>

      {/* Ingredients */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-baseline">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Ingredients</p>
          <p className="text-[12px] text-forest/35">{recipe.ingredients.length} items</p>
        </div>
        {recipe.ingredients.length > 0 && (
          <div className="bg-white rounded-xl border border-forest/6 overflow-hidden mt-2">
            {recipe.ingredients.slice(0, INITIAL_SHOW).map((ing) => (
              <div key={ing.id} className="flex justify-between px-4 py-3 border-b border-forest/4 last:border-b-0">
                <span className="text-[14px] text-forest">{ing.name}</span>
                <span className="text-[14px] text-forest/50">{ing.quantity} {ing.unit}</span>
              </div>
            ))}
          </div>
        )}
        {recipe.ingredients.length > INITIAL_SHOW && (
          <p className="text-center text-[13px] text-forest/35 mt-2">
            + {recipe.ingredients.length - INITIAL_SHOW} more ingredients
          </p>
        )}
      </div>

      {/* Baking Steps */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-baseline">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Baking Steps</p>
          <p className="text-[12px] text-forest/35">
            {recipe.steps.length} steps
            {totalTime > 0 && ` · ~${totalTime >= 60 ? `${Math.round(totalTime / 60)}h` : `${totalTime}m`} total`}
          </p>
        </div>
        <div className="mt-3 space-y-0">
          {recipe.steps.slice(0, 3).map((step) => (
            <div key={step.id} className="flex items-center gap-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E1CDE4] flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-forest">{step.step_number}</span>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-forest">{step.title}</p>
                {step.duration_min && (
                  <p className="text-[12px] text-forest/40">{step.duration_min} min</p>
                )}
              </div>
            </div>
          ))}
          {recipe.steps.length > 3 && (
            <div className="flex items-start gap-3 py-2">
              <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-forest/30">{recipe.steps[3].step_number}</span>
              </div>
              <div>
                <p className="text-[14px] text-forest/40">
                  {recipe.steps.slice(3).map((s) => s.title).join(" · ").slice(0, 40)}...
                </p>
                <p className="text-[12px] text-forest/30">
                  + {recipe.steps.length - 3} more steps
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
