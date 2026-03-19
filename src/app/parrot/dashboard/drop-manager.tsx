"use client";

import { useState, useRef, useCallback } from "react";
import { useSwipeDismiss } from "@/hooks/use-swipe-dismiss";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth/get-token";
import { formatDropNumber, canScheduleDrop, FIELD_LABELS } from "@/lib/drops/constants";
import { formatCents, formatDay, utcToCST, cstToUTC } from "@/lib/format";
import { DateWheelPicker } from "@/components/shared/date-wheel-picker";
import { TimeWheelPicker } from "@/components/shared/time-wheel-picker";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { RECIPE_STATUS_LABELS, RECIPE_STATUS_COLORS } from "@/lib/recipes/constants";
import type { Drop, Recipe } from "@/types/database";

interface Props {
  drop: Drop;
  recipes?: Recipe[];
  onClose?: () => void;
}

export function DropManager({ drop: initialDrop, recipes = [], onClose }: Props) {
  const [drop, setDrop] = useState(initialDrop);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const flavorInputRef = useRef<HTMLInputElement>(null);
  const closeRecipePicker = useCallback(() => setEditing(null), []);
  const recipePickerSwipe = useSwipeDismiss(closeRecipePicker);

  async function updateField(field: string, value: string | number) {
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const res = await fetch("/api/parrot/drops", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: drop.id, [field]: value }),
    });

    const data = await res.json();
    if (res.ok) {
      setDrop(data.drop);
      setError(null);
    } else {
      setError(data.error || "Something went wrong");
      setTimeout(() => setError(null), 4000);
    }
    setSaving(false);
    setEditing(null);
  }

  async function uploadImage(file: File, type: "hero" | "flavor") {
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dropId", drop.id);
    formData.append("type", type);

    const res = await fetch("/api/parrot/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const { url } = await res.json();
      setDrop((d) => ({
        ...d,
        [type === "hero" ? "hero_image_url" : "flavor_image_url"]: url,
      }));
    }
    setSaving(false);
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function deleteDrop() {
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const res = await fetch(`/api/parrot/drops/${drop.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      router.refresh();
      onClose?.();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete");
      setTimeout(() => setError(null), 4000);
    }
    setSaving(false);
  }

  async function scheduleDrop() {
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const res = await fetch("/api/parrot/drop-status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dropId: drop.id, status: "scheduled" }),
    });

    const data = await res.json();
    if (res.ok) {
      setDrop(data.drop);
      setError(null);
    } else {
      setError(data.error || "Failed to schedule");
      setTimeout(() => setError(null), 4000);
    }
    setSaving(false);
  }

  async function unscheduleDrop() {
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const res = await fetch("/api/parrot/drop-status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dropId: drop.id, status: "draft" }),
    });

    const data = await res.json();
    if (res.ok) {
      setDrop(data.drop);
    } else {
      setError(data.error || "Failed to unschedule");
      setTimeout(() => setError(null), 4000);
    }
    setSaving(false);
  }

  const scheduleCheck = canScheduleDrop(drop as unknown as Record<string, unknown>);

  const priceFormatted = formatCents(drop.price_cents);

  return (
    <div className="space-y-6">
      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-forest text-white text-xs font-semibold animate-pulse">
          Saving...
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl bg-red-soft text-red-text text-sm font-medium text-center animate-fade-up">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-lg text-forest">
          Drop {formatDropNumber(drop.number)} Preview
        </h3>
        <span className="text-xs text-forest/35">Tap any field to edit</span>
      </div>

      {/* ═══ LIVE PREVIEW: Hero Screen ═══ */}
      <div className="rounded-2xl border-2 border-dashed border-forest/10 overflow-hidden bg-cream">
        <div className="px-3 py-2 bg-forest/5 text-[10px] font-semibold text-forest/40 uppercase tracking-wider">
          Hero screen preview
        </div>

        {/* Hero Image */}
        <div
          className="mx-3 mt-3 rounded-xl overflow-hidden bg-forest/5 aspect-[342/200] relative cursor-pointer group"
          onClick={() => heroInputRef.current?.click()}
        >
          {drop.hero_image_url ? (
            <img
              src={drop.hero_image_url}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-forest/20 text-sm">
              Tap to upload hero photo
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
            <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
              Change photo
            </span>
          </div>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file, "hero");
            }}
          />
        </div>

        {/* Editable fields */}
        <div className="p-3 space-y-2">
          {/* Flavor name */}
          {editing === "flavor_name" ? (
            <input
              autoFocus
              defaultValue={drop.flavor_name}
              onBlur={(e) => updateField("flavor_name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateField("flavor_name", (e.target as HTMLInputElement).value)}
              className="font-display font-black text-xl text-forest bg-white px-2 py-1 rounded-lg w-full outline-none ring-2 ring-forest/20"
            />
          ) : (
            <h4
              onClick={() => setEditing("flavor_name")}
              className="font-display font-black text-xl text-forest cursor-pointer hover:bg-forest/5 rounded px-1 -mx-1 transition"
            >
              {drop.flavor_name}
            </h4>
          )}

          {/* Description */}
          {editing === "flavor_description" ? (
            <textarea
              autoFocus
              defaultValue={drop.flavor_description || ""}
              rows={3}
              onBlur={(e) => updateField("flavor_description", e.target.value)}
              className="text-sm text-forest/60 bg-white px-2 py-1 rounded-lg w-full outline-none ring-2 ring-forest/20 resize-none"
            />
          ) : (
            <p
              onClick={() => setEditing("flavor_description")}
              className="text-sm text-forest/50 leading-relaxed cursor-pointer hover:bg-forest/5 rounded px-1 -mx-1 transition"
            >
              {drop.flavor_description || "Tap to add description..."}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-forest/35">Price:</span>
            {editing === "price_cents" ? (
              <input
                autoFocus
                type="number"
                step="0.01"
                defaultValue={(drop.price_cents / 100).toFixed(2)}
                onBlur={(e) => updateField("price_cents", Math.round(parseFloat(e.target.value) * 100))}
                onKeyDown={(e) => e.key === "Enter" && updateField("price_cents", Math.round(parseFloat((e.target as HTMLInputElement).value) * 100))}
                className="text-sm font-semibold text-forest bg-white px-2 py-0.5 rounded w-20 outline-none ring-2 ring-forest/20"
              />
            ) : (
              <span
                onClick={() => setEditing("price_cents")}
                className="text-sm font-semibold text-forest cursor-pointer hover:bg-forest/5 rounded px-1 transition"
              >
                {priceFormatted} each
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LIVE PREVIEW: Flavor Card ═══ */}
      <div className="rounded-2xl border-2 border-dashed border-forest/10 overflow-hidden bg-cream">
        <div className="px-3 py-2 bg-forest/5 text-[10px] font-semibold text-forest/40 uppercase tracking-wider">
          Flavor card preview
        </div>

        <div className="mx-3 mt-3 mb-3 rounded-xl bg-white overflow-hidden">
          {/* Flavor Image */}
          <div
            className="aspect-[342/180] bg-forest/5 relative cursor-pointer group overflow-hidden"
            onClick={() => flavorInputRef.current?.click()}
          >
            {drop.flavor_image_url ? (
              <img
                src={drop.flavor_image_url}
                alt="Flavor"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-forest/20 text-sm">
                Tap to upload flavor photo
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
              <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
                Change photo
              </span>
            </div>
            <input
              ref={flavorInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, "flavor");
              }}
            />
          </div>

          <div className="p-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-semibold text-forest">{drop.flavor_name}</span>
              <span className="text-sm text-forest/50">{priceFormatted} each</span>
            </div>
            <p className="text-sm text-forest/40 leading-relaxed">
              {drop.flavor_description || "No description yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ DROP SETTINGS ═══ */}
      <div className="rounded-2xl border-2 border-dashed border-forest/10 overflow-hidden">
        <div className="px-3 py-2 bg-forest/5 text-[10px] font-semibold text-forest/40 uppercase tracking-wider">
          Drop settings
        </div>

        <div className="p-3 space-y-3">
          {/* ── Recipe link ── */}
          <div className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider pt-1">
            Recipe
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Linked recipe</span>
            <button
              onClick={() => setEditing("recipe_id")}
              className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition text-right max-w-[180px] truncate btn-press"
            >
              {drop.recipe_id
                ? recipes.find((r) => r.id === drop.recipe_id)?.name || "Unknown"
                : "None"}
            </button>
          </div>
          {!drop.recipe_id && (
            <p className="text-[12px] text-forest/30 leading-relaxed -mt-1">
              Link a recipe to auto-generate a shopping list and baking plan when orders close.
            </p>
          )}

          {/* ── Ordering window ── */}
          <div className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider pt-1">
            Ordering window
          </div>

          {/* Orders Open */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Orders open</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditing("orders_open_at")}
                className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.orders_open_at
                  ? (() => { const { date } = utcToCST(drop.orders_open_at); const [,mo,da] = date.split("-"); const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[+mo]} ${+da}`; })()
                  : "Date"}
              </button>
              <button
                onClick={() => setEditing("orders_open_time")}
                className="text-sm font-semibold text-forest bg-white px-2.5 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.orders_open_at
                  ? (() => { const { time } = utcToCST(drop.orders_open_at); const h = parseInt(time.split(":")[0]); const m = time.split(":")[1]; const ampm = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12; return `${h12}:${m} ${ampm}`; })()
                  : "Time"}
              </button>
            </div>
          </div>

          {/* Orders Close */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Orders close</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditing("orders_close_at")}
                className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.orders_close_at
                  ? (() => { const { date } = utcToCST(drop.orders_close_at); const [,mo,da] = date.split("-"); const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[+mo]} ${+da}`; })()
                  : "Date"}
              </button>
              <button
                onClick={() => setEditing("orders_close_time")}
                className="text-sm font-semibold text-forest bg-white px-2.5 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.orders_close_at
                  ? (() => { const { time } = utcToCST(drop.orders_close_at); const h = parseInt(time.split(":")[0]); const m = time.split(":")[1]; const ampm = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12; return `${h12}:${m} ${ampm}`; })()
                  : "Time"}
              </button>
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Capacity</span>
            {editing === "capacity" ? (
              <input
                autoFocus
                type="number"
                defaultValue={drop.capacity}
                onBlur={(e) => updateField("capacity", parseInt(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && updateField("capacity", parseInt((e.target as HTMLInputElement).value))}
                className="text-sm font-semibold text-forest bg-white px-2 py-1 rounded w-20 outline-none ring-2 ring-forest/20 text-right"
              />
            ) : (
              <span
                onClick={() => setEditing("capacity")}
                className="text-sm font-semibold text-forest cursor-pointer hover:bg-forest/5 rounded px-2 py-0.5 transition"
              >
                {drop.capacity} treats
              </span>
            )}
          </div>

          {/* ── Pickup details ── */}
          <div className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider pt-3">
            Pickup details
          </div>

          {/* Pickup Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Pickup date</span>
            <button
              onClick={() => setEditing("pickup_date")}
              className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
            >
              {drop.pickup_date
                ? `${formatDay(drop.pickup_date)}, ${new Date(drop.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Set date"}
            </button>
          </div>

          {/* Pickup Time */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Pickup time</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditing("pickup_time_start")}
                className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.pickup_time_start?.slice(0, 5) || "Start"}
              </button>
              <span className="text-forest/30 text-sm">–</span>
              <button
                onClick={() => setEditing("pickup_time_end")}
                className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition"
              >
                {drop.pickup_time_end?.slice(0, 5) || "End"}
              </button>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Pickup at</span>
            {editing === "pickup_location" ? (
              <input
                autoFocus
                defaultValue={drop.pickup_location}
                onBlur={(e) => updateField("pickup_location", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateField("pickup_location", (e.target as HTMLInputElement).value)}
                className="text-sm font-semibold text-forest bg-white px-2 py-1 rounded w-40 outline-none ring-2 ring-forest/20 text-right"
              />
            ) : (
              <span
                onClick={() => setEditing("pickup_location")}
                className="text-sm font-semibold text-forest cursor-pointer hover:bg-forest/5 rounded px-2 py-0.5 transition"
              >
                {drop.pickup_location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Schedule / Unschedule actions */}
      {drop.status === "draft" && (
        <div className="space-y-2">
          {scheduleCheck.ready ? (
            <button
              onClick={scheduleDrop}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-forest text-white text-sm font-semibold btn-press transition disabled:opacity-50"
            >
              Schedule this drop
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber/8 border border-amber/15">
              <p className="text-sm font-semibold text-forest mb-1.5">Not ready to schedule</p>
              <ul className="space-y-0.5">
                {scheduleCheck.missing.map((f) => (
                  <li key={f} className="text-[12px] text-forest/45">
                    · {FIELD_LABELS[f] || f} is missing
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 rounded-xl border border-red-200 text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            Delete this draft
          </button>
        </div>
      )}

      {drop.status === "scheduled" && (
        <div className="space-y-2">
          <div className="p-3.5 rounded-xl bg-mint/30 border border-forest/8">
            <p className="text-sm font-semibold text-forest">Scheduled</p>
            <p className="text-[12px] text-forest/45 mt-0.5">
              This drop will go live when you promote it. All settings are locked.
            </p>
          </div>
          <button
            onClick={unscheduleDrop}
            disabled={saving}
            className="w-full py-3 rounded-xl border border-forest/15 text-sm font-medium text-forest/50 hover:bg-forest/5 transition disabled:opacity-50"
          >
            Back to draft
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete draft"
          message="Delete this draft drop? This can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => { setShowDeleteConfirm(false); deleteDrop(); }}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* ── Wheel picker modals ── */}
      {editing === "pickup_date" && (
        <DateWheelPicker
          value={drop.pickup_date}
          label="Pickup date"
          onConfirm={(val) => updateField("pickup_date", val)}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "pickup_time_start" && (
        <TimeWheelPicker
          value={drop.pickup_time_start || "14:00"}
          label="Pickup start time"
          onConfirm={(val) => updateField("pickup_time_start", val)}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "pickup_time_end" && (
        <TimeWheelPicker
          value={drop.pickup_time_end || "16:00"}
          label="Pickup end time"
          onConfirm={(val) => updateField("pickup_time_end", val)}
          onClose={() => setEditing(null)}
        />
      )}

      {editing === "orders_open_at" && (() => {
        const cst = drop.orders_open_at ? utcToCST(drop.orders_open_at) : { date: utcToCST(new Date().toISOString()).date, time: "08:00" };
        return (
          <DateWheelPicker
            value={cst.date}
            label="Orders open date"
            onConfirm={(val) => updateField("orders_open_at", cstToUTC(val, cst.time))}
            onClose={() => setEditing(null)}
          />
        );
      })()}

      {editing === "orders_close_at" && (() => {
        const cst = drop.orders_close_at ? utcToCST(drop.orders_close_at) : { date: utcToCST(new Date().toISOString()).date, time: "23:59" };
        return (
          <DateWheelPicker
            value={cst.date}
            label="Orders close date"
            onConfirm={(val) => updateField("orders_close_at", cstToUTC(val, cst.time))}
            onClose={() => setEditing(null)}
          />
        );
      })()}

      {editing === "orders_open_time" && (() => {
        const cst = drop.orders_open_at ? utcToCST(drop.orders_open_at) : { date: utcToCST(new Date().toISOString()).date, time: "08:00" };
        return (
          <TimeWheelPicker
            value={cst.time}
            label="Orders open time"
            onConfirm={(val) => updateField("orders_open_at", cstToUTC(cst.date, val))}
            onClose={() => setEditing(null)}
          />
        );
      })()}

      {editing === "orders_close_time" && (() => {
        const cst = drop.orders_close_at ? utcToCST(drop.orders_close_at) : { date: utcToCST(new Date().toISOString()).date, time: "23:59" };
        return (
          <TimeWheelPicker
            value={cst.time}
            label="Orders close time"
            onConfirm={(val) => updateField("orders_close_at", cstToUTC(cst.date, val))}
            onClose={() => setEditing(null)}
          />
        );
      })()}

      {editing === "recipe_id" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)} />
          <div
            ref={recipePickerSwipe.sheetRef}
            onTouchStart={recipePickerSwipe.onTouchStart}
            onTouchMove={recipePickerSwipe.onTouchMove}
            onTouchEnd={recipePickerSwipe.onTouchEnd}
            className="relative w-full max-w-lg bg-cream rounded-t-2xl p-5 pb-8 animate-slide-up"
          >
            <div className="w-10 h-1 rounded-full bg-forest/10 mx-auto mb-4 cursor-grab" />
            <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-3">Link a recipe</p>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {/* None option */}
              <button
                onClick={() => { updateField("recipe_id", null as any); setEditing(null); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl btn-press transition ${
                  !drop.recipe_id ? "bg-forest/5 ring-1 ring-forest/15" : "bg-white border border-forest/6"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-forest/5 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8h8" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-forest/50">No recipe</span>
                {!drop.recipe_id && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto">
                    <path d="M4 8.5L6.5 11L12 5" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Recipe options */}
              {recipes.filter((r) => r.status !== "archived").map((r) => (
                <button
                  key={r.id}
                  onClick={() => { updateField("recipe_id", r.id); setEditing(null); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl btn-press transition ${
                    drop.recipe_id === r.id ? "bg-forest/5 ring-1 ring-forest/15" : "bg-white border border-forest/6"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{r.emoji || "📝"}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-forest truncate">{r.name}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase mt-0.5 ${RECIPE_STATUS_COLORS[r.status]}`}>
                      {RECIPE_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  {drop.recipe_id === r.id && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <path d="M4 8.5L6.5 11L12 5" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
