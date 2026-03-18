"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth/get-token";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents, formatDay, utcToCST, cstToUTC } from "@/lib/format";
import { DateWheelPicker } from "@/components/shared/date-wheel-picker";
import { TimeWheelPicker } from "@/components/shared/time-wheel-picker";
import type { Drop } from "@/types/database";

interface Props {
  drop: Drop;
}

export function DropManager({ drop: initialDrop }: Props) {
  const [drop, setDrop] = useState(initialDrop);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const flavorInputRef = useRef<HTMLInputElement>(null);

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

  async function deleteDrop() {
    if (!confirm("Delete this draft drop? This can't be undone.")) return;
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    const res = await fetch(`/api/parrot/drops/${drop.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete");
    }
    setSaving(false);
  }

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
          {/* ── Ordering window ── */}
          <div className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider pt-1">
            Ordering window
          </div>

          {/* Orders Open */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Orders open</span>
            <button
              onClick={() => setEditing("orders_open_at")}
              className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition text-right"
            >
              {drop.orders_open_at
                ? (() => { const { date, time } = utcToCST(drop.orders_open_at); const [,mo,da] = date.split("-"); const h = parseInt(time.split(":")[0]); const m = time.split(":")[1]; const ampm = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12; const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[+mo]} ${+da}, ${h12}:${m} ${ampm}`; })()
                : "Set date"}
            </button>
          </div>

          {/* Orders Close */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-forest/60">Orders close</span>
            <button
              onClick={() => setEditing("orders_close_at")}
              className="text-sm font-semibold text-forest bg-white px-3 py-1.5 rounded-lg ring-1 ring-forest/10 hover:ring-forest/20 transition text-right"
            >
              {drop.orders_close_at
                ? (() => { const { date, time } = utcToCST(drop.orders_close_at); const [,mo,da] = date.split("-"); const h = parseInt(time.split(":")[0]); const m = time.split(":")[1]; const ampm = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12; const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[+mo]} ${+da}, ${h12}:${m} ${ampm}`; })()
                : "Set date"}
            </button>
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

      {/* Delete draft drop */}
      {drop.status === "draft" && (
        <button
          onClick={deleteDrop}
          className="w-full py-3 rounded-xl border border-red-200 text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition"
        >
          Delete this draft
        </button>
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
        const cst = drop.orders_open_at ? utcToCST(drop.orders_open_at) : { date: new Date().toISOString().slice(0, 10), time: "00:00" };
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
        const cst = drop.orders_close_at ? utcToCST(drop.orders_close_at) : { date: new Date().toISOString().slice(0, 10), time: "23:59" };
        return (
          <DateWheelPicker
            value={cst.date}
            label="Orders close date"
            onConfirm={(val) => updateField("orders_close_at", cstToUTC(val, cst.time))}
            onClose={() => setEditing(null)}
          />
        );
      })()}
    </div>
  );
}
