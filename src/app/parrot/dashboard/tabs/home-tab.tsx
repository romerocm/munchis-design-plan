"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { findActiveDrop } from "@/lib/drops/find-active";
import { DROP_STATUS_LABELS, DROP_TRANSITIONS, formatDropNumber } from "@/lib/drops/constants";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import { formatCents, getInitials } from "@/lib/format";
import type { Drop, Order, DropStats } from "@/types/database";
import { getGreeting } from "@/lib/greetings";

interface Props {
  drops: Drop[];
  orders: Order[];
  dropStats: DropStats[];
  onEditDrop: (drop: Drop) => void;
  onViewOrders: () => void;
  onUpdateStatus: (dropId: string, status: string) => Promise<void>;
  onOpenShopping: (dropId: string) => void;
  onOpenBaking: (dropId: string) => void;
  onOpenPickup: (dropId: string) => void;
}

export function HomeTab({ drops, orders, dropStats, onEditDrop, onViewOrders, onUpdateStatus, onOpenShopping, onOpenBaking, onOpenPickup }: Props) {
  const router = useRouter();
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  // Current drop = the active one (live > closed > baking), fallback to newest
  const currentDrop = findActiveDrop(drops);

  const paidOrders = currentDrop
    ? orders.filter(
        (o) =>
          o.drop_id === currentDrop.id &&
          (o.status === "confirmed" || o.status === "picked_up")
      )
    : [];
  const activeOrders = currentDrop
    ? orders.filter(
        (o) =>
          o.drop_id === currentDrop.id &&
          (o.status === "pending" || o.status === "confirmed" || o.status === "picked_up")
      )
    : [];
  const usedCapacity = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
  const remainingCapacity = currentDrop ? currentDrop.capacity - usedCapacity : 0;
  const isSoldOut = currentDrop ? remainingCapacity <= 0 : false;
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const totalTreats = paidOrders.reduce((sum, o) => sum + o.quantity, 0);
  const recentOrders = currentDrop
    ? orders.filter((o) => o.drop_id === currentDrop.id && o.status !== "no_show" && o.status !== "expired" && o.status !== "cancelled").slice(0, 5)
    : [];
  const upcomingDrafts = drops.filter((d) => d.status === "draft" || d.status === "scheduled");

  // Defer to client to avoid SSR hydration mismatch (server may be in different timezone)
  const [today, setToday] = useState(-1); // -1 = SSR placeholder, no day highlighted
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    setToday(new Date().getDay());
    setGreeting(getGreeting());
  }, []);

  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ dropId: string; status: string } | null>(null);
  // Clear pending once props reflect the new status, or after 10s safety timeout
  useEffect(() => {
    if (!pendingStatus) return;
    if (currentDrop && currentDrop.status === pendingStatus.status) {
      setPendingStatus(null);
      return;
    }
    const timeout = setTimeout(() => setPendingStatus(null), 10000);
    return () => clearTimeout(timeout);
  }, [currentDrop, pendingStatus]);

  const [syncing, setSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    setSyncing(true);
    router.refresh();
    // Brief visual feedback so Heidi sees the spin
    setTimeout(() => setSyncing(false), 800);
  }, [router]);


  return (<>
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-end justify-between px-4 pt-5 pb-3">
        <div>
          <p className="text-[13px] text-forest/45 leading-snug line-clamp-2 max-w-[260px]">{greeting || "\u00A0"}</p>
          <a href="/parrot/dashboard"><img src="/images/logo-wordmark.svg" alt="munchis" className="h-7" /></a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center btn-press"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={syncing ? "animate-spin" : ""}>
              <path d="M13.5 2.5v3.5h-3.5M2.5 13.5V10h3.5" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              <path d="M3.5 6A5 5 0 0112.3 4L13.5 6M12.5 10a5 5 0 01-8.8 2L2.5 10" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            </svg>
          </button>
          <button
            onClick={async () => {
              if (!confirm("Log out?")) return;
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/parrot/login");
            }}
            className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center btn-press"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current Drop Banner */}
      {currentDrop && (
        <div className="mx-4 rounded-2xl bg-forest p-4 space-y-3 overflow-visible">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                DROP {formatDropNumber(currentDrop.number)} · {currentDrop.flavor_name.toUpperCase()}
              </p>
              <p className="font-display font-black text-xl text-white mt-1">
                {DROP_STATUS_LABELS[currentDrop.status] || currentDrop.status}
              </p>
            </div>
            {/* Tappable status badge */}
            <div className="relative" data-status-dropdown>
              <button
                ref={statusBtnRef}
                onClick={() => {
                  if (statusDropdown) {
                    setStatusDropdown(null);
                    setDropdownPos(null);
                  } else {
                    const rect = statusBtnRef.current?.getBoundingClientRect();
                    if (rect) setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                    setStatusDropdown(currentDrop.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/12 text-xs font-semibold text-white uppercase btn-press"
                disabled={!!pendingStatus}
              >
                {pendingStatus?.dropId === currentDrop.id ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
                    <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.5" opacity="0.3" />
                    <path d="M11 6a5 5 0 00-5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : currentDrop.status === "live" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                ) : null}
                {pendingStatus?.dropId === currentDrop.id ? pendingStatus.status : currentDrop.status}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M2 3L4 5L6 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          {/* Week timeline */}
          <div className="flex gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
              const dayIndex = i === 0 ? 1 : i === 6 ? 0 : i + 1;
              const isToday = today === dayIndex;
              const isPast = dayIndex < today && today !== 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1 rounded-full ${isToday ? "bg-amber" : isPast ? "bg-white/40" : "bg-white/10"}`} />
                  <span className={`text-[10px] ${isToday ? "text-white font-bold" : "text-white/25"}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shopping / Baking progress — when drop has a recipe */}
      {currentDrop && (currentDrop.status === "closed" || currentDrop.status === "baking") && (() => {
        const stats = dropStats.find((ds) => ds.drop_id === currentDrop.id);
        const hasShopping = stats && stats.shopping_total > 0;
        const hasBaking = stats && stats.baking_total > 0;
        const hasRecipe = !!currentDrop.recipe_id;

        if (hasRecipe && (hasShopping || hasBaking)) {
          return (
            <div className="mx-4 mt-3 space-y-2">
              {/* Shopping progress */}
              {hasShopping && currentDrop.status === "closed" && (
                <button
                  onClick={() => onOpenShopping(currentDrop.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-mint/40 border border-forest/8 btn-press"
                >
                  <div className="w-9 h-9 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="3" width="10" height="10" rx="2" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.5" />
                      <path d="M5.5 8l2 2 3-3.5" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-forest">Shopping list</p>
                    <p className="text-[12px] text-forest/45">
                      {stats!.shopping_checked}/{stats!.shopping_total} items bought
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-forest/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest rounded-full"
                        style={{ width: `${(stats!.shopping_checked / stats!.shopping_total) * 100}%` }}
                      />
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Baking progress */}
              {hasBaking && currentDrop.status === "baking" && (
                <button
                  onClick={() => onOpenBaking(currentDrop.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-amber/8 border border-amber/15 btn-press"
                >
                  <div className="w-9 h-9 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#B8860B" strokeWidth="1.3" />
                      <path d="M8 4.5V8l2.5 1.5" stroke="#B8860B" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-forest">Baking plan</p>
                    <p className="text-[12px] text-forest/45">
                      {stats!.baking_done}/{stats!.baking_total} steps done
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-amber/15 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber rounded-full"
                        style={{ width: `${(stats!.baking_done / stats!.baking_total) * 100}%` }}
                      />
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          );
        }

        // Fallback: old groceries checkbox when no recipe linked
        if (currentDrop.status === "closed") {
          return (
            <button
              onClick={async () => {
                const supabase = createClient();
                const newValue = currentDrop.groceries_bought_at ? null : new Date().toISOString();
                await supabase
                  .from("drops")
                  .update({ groceries_bought_at: newValue })
                  .eq("id", currentDrop.id);
                router.refresh();
              }}
              className="mx-4 mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-white btn-press"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                currentDrop.groceries_bought_at
                  ? "bg-forest border-forest"
                  : "border-forest/20"
              }`}>
                {currentDrop.groceries_bought_at && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6.5L5 8.5L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-semibold text-forest">Groceries bought</span>
            </button>
          );
        }

        return null;
      })()}

      {/* Pickup progress — when drop is ready */}
      {currentDrop && currentDrop.status === "ready" && (() => {
        const dropOrders = orders.filter((o) => o.drop_id === currentDrop.id);
        const pickupEligible = dropOrders.filter((o) => o.status === "confirmed" || o.status === "picked_up" || o.status === "no_show");
        const pickedUpOrders = dropOrders.filter((o) => o.status === "picked_up");
        if (pickupEligible.length === 0) return null;
        return (
          <div className="mx-4 mt-3">
            <button
              onClick={() => onOpenPickup(currentDrop.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-forest/6 btn-press"
              style={{ backgroundColor: "#E1CDE420" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1CDE440" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="10" height="10" rx="2" stroke="#8B6B8E" strokeWidth="1.3" />
                  <path d="M5.5 8l2 2 3-3.5" stroke="#8B6B8E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-forest">Pickup checklist</p>
                <p className="text-[12px] text-forest/45">
                  {pickedUpOrders.length}/{pickupEligible.length} picked up
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E1CDE440" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: "#E1CDE4", width: `${pickupEligible.length > 0 ? (pickedUpOrders.length / pickupEligible.length) * 100 : 0}%` }}
                  />
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="#8B6B8E" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
            </button>
          </div>
        );
      })()}

      {/* Stats */}
      {currentDrop && (
        <div className="flex gap-2 mx-4 mt-3">
          <div className="flex-1 p-3.5 rounded-xl bg-white">
            <p className="font-display font-black text-2xl text-forest">{paidOrders.length}</p>
            <p className="text-[11px] text-forest/40">Orders</p>
          </div>
          <div className="flex-1 p-3.5 rounded-xl bg-white">
            <p className="font-display font-black text-2xl text-forest">{totalTreats}</p>
            <p className="text-[11px] text-forest/40">Treats</p>
          </div>
          <div className="flex-1 p-3.5 rounded-xl bg-white">
            <p className="font-display font-black text-2xl text-amber">{formatCents(totalRevenue, 0)}</p>
            <p className="text-[11px] text-forest/40">Revenue</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {currentDrop && (
        <div className="flex gap-2 mx-4 mt-2">
          <button onClick={() => onEditDrop(currentDrop)} className="flex-1 flex items-center gap-2.5 p-3.5 rounded-xl bg-white btn-press">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M12.75 2.25L15.75 5.25M1.5 16.5L2.25 13.5L13.5 2.25L15.75 4.5L4.5 15.75L1.5 16.5Z" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            <span className="text-sm font-semibold text-forest">Edit drop</span>
          </button>
          <button onClick={onViewOrders} className="flex-1 flex items-center gap-2.5 p-3.5 rounded-xl bg-white btn-press">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.5" />
              <path d="M1.5 7.5h15" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.5" />
            </svg>
            <span className="text-sm font-semibold text-forest">View orders</span>
          </button>
        </div>
      )}

      {/* Empty state — no orders yet */}
      {currentDrop && recentOrders.length === 0 && (
        <div className="mt-5 mx-4 flex flex-col items-center text-center py-10 px-6 rounded-2xl bg-white">
          <div className="w-14 h-14 rounded-full bg-forest/5 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3 3-3" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="#1B3D2F" strokeWidth="1.5" opacity="0.25" />
            </svg>
          </div>
          <p className="font-display font-black text-lg text-forest">No orders yet</p>
          <p className="text-[13px] text-forest/40 mt-1 max-w-[240px] leading-relaxed">
            {currentDrop.status === "closed"
              ? "This drop closed without any orders. You can reopen it or start baking."
              : currentDrop.status === "live"
              ? "Share your drop link to start getting orders!"
              : "Orders will appear here once the drop goes live."}
          </p>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-5 mx-4">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="font-display font-black text-lg text-forest">Recent orders</h2>
            <button onClick={onViewOrders} className="text-xs text-forest/30 btn-press">
              {recentOrders.length} total →
            </button>
          </div>
          <div className="space-y-1.5">
            {recentOrders.map((order) => (
              <button
                key={order.id}
                onClick={onViewOrders}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-white btn-press"
              >
                <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-forest">
                    {getInitials(order.customer_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-forest truncate">{order.customer_name}</p>
                  <p className="text-[11px] text-forest/40">{order.quantity}x {currentDrop?.flavor_name} · {formatCents(order.total_cents)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Drops */}
      {upcomingDrafts.length > 0 && (
        <div className="mt-5 mx-4">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="font-display font-black text-lg text-forest">Upcoming drops</h2>
          </div>
          {upcomingDrafts.map((draft) => (
            <button
              key={draft.id}
              onClick={() => onEditDrop(draft)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border-[1.5px] border-dashed border-forest/10 btn-press mb-1.5"
            >
              <div className="w-11 h-11 rounded-xl bg-[#E1CDE4] flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-forest/40">{formatDropNumber(draft.number)}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-forest">{draft.flavor_name}</p>
                <p className="text-[11px] text-forest/35">
                  {draft.status === "scheduled" ? "Scheduled" : "Draft"} · {new Date(draft.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-forest/30">Edit</span>
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Status dropdown — rendered as portal to avoid iOS PWA clipping */}
    {statusDropdown && currentDrop && dropdownPos && createPortal(
      <>
        {/* Backdrop to catch outside taps */}
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => { setStatusDropdown(null); setDropdownPos(null); }}
        />
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-lg min-w-[160px]"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2.5 text-sm font-semibold text-forest bg-forest/5 rounded-t-xl">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-forest mr-2" />
            {currentDrop.status.charAt(0).toUpperCase() + currentDrop.status.slice(1)}
          </div>
          {(DROP_TRANSITIONS[currentDrop.status] || []).map((s) => {
            const isReopen = currentDrop.status === "closed" && s === "live";
            const transitionLabels: Record<string, Record<string, string>> = {
              draft: { scheduled: "Schedule drop" },
              scheduled: { live: "Go live now", draft: "Back to draft" },
              closed: { baking: "Start baking", live: "Reopen orders" },
              baking: { ready: "Ready for pickup", closed: "Back to closed" },
              ready: { completed: "Drop complete", baking: "Back to baking" },
              completed: { ready: "Back to ready" },
            };
            const label = transitionLabels[currentDrop.status]?.[s]
              || s.charAt(0).toUpperCase() + s.slice(1);
            const isBackward = label.startsWith("Back") || label.startsWith("Reopen");
            const disabled = isReopen && isSoldOut;
            return (
              <button
                key={s}
                disabled={disabled || !!pendingStatus}
                onClick={async () => {
                  if (disabled) return;
                  setStatusDropdown(null);
                  setDropdownPos(null);
                  setPendingStatus({ dropId: currentDrop.id, status: s });
                  try {
                    await onUpdateStatus(currentDrop.id, s);
                  } catch {
                    setPendingStatus(null);
                  }
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium ${
                  disabled
                    ? "text-forest/20 cursor-not-allowed"
                    : isBackward
                    ? "text-forest/40 active:bg-forest/5"
                    : "active:bg-forest/5"
                }`}
              >
                {isBackward ? (
                  <span>{"\u2190"} {label}</span>
                ) : (
                  <span className="animate-gradient-text font-semibold">
                    {"\u2192"} {label}
                  </span>
                )}
                {disabled && (
                  <span className="block text-[11px] text-forest/20 mt-0.5">Sold out — no capacity left</span>
                )}
              </button>
            );
          })}
          {(DROP_TRANSITIONS[currentDrop.status] || []).length === 0 && (
            <div className="px-4 py-2.5 text-sm text-forest/25">
              No further transitions
            </div>
          )}
        </div>
      </>,
      document.body
    )}
  </>
  );
}
