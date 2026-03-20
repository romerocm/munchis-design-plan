"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDropNumber } from "@/lib/drops/constants";
import { useSwipeDismiss } from "@/hooks/use-swipe-dismiss";
import type { Drop, Order } from "@/types/database";

interface Props {
  dropId: string;
  drop: Drop;
  getToken: () => Promise<string | null>;
  onBack: () => void;
  onUpdateStatus: (dropId: string, status: string) => Promise<void>;
}

interface UndoToast {
  orderIds: string[];
  name: string;
  action: "no_show" | "pickup";
  timer: ReturnType<typeof setTimeout>;
}

interface CustomerGroup {
  phone: string;
  name: string;
  orders: Order[];
  totalQuantity: number;
  pickupCode: string; // first order's code
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPickupTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function PickupChecklist({ dropId, drop, getToken, onBack, onUpdateStatus }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [pickedUpExpanded, setPickedUpExpanded] = useState(true);
  const [noShowExpanded, setNoShowExpanded] = useState(false);
  const undoToastRef = useRef(undoToast);
  undoToastRef.current = undoToast;

  const fetchOrders = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/drops/${dropId}/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { orders: data } = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }, [dropId, getToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoToastRef.current) clearTimeout(undoToastRef.current.timer);
    };
  }, []);

  // Derive pickup codes — stable order by created_at
  const pickupCodes = useMemo(() => {
    const sorted = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return new Map(sorted.map((o, i) => [o.id, `#${String(i + 1).padStart(2, "0")}`]));
  }, [orders]);

  // Group by phone
  const customerGroups = useMemo(() => {
    const map = new Map<string, CustomerGroup>();
    const sorted = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const order of sorted) {
      const existing = map.get(order.customer_whatsapp);
      if (existing) {
        existing.orders.push(order);
        existing.totalQuantity += order.quantity;
      } else {
        map.set(order.customer_whatsapp, {
          phone: order.customer_whatsapp,
          name: order.customer_name,
          orders: [order],
          totalQuantity: order.quantity,
          pickupCode: pickupCodes.get(order.id) || "#??",
        });
      }
    }
    return Array.from(map.values());
  }, [orders, pickupCodes]);

  // Filter
  const searchLower = search.toLowerCase();
  const filteredGroups = searchLower
    ? customerGroups.filter((g) =>
        g.name.toLowerCase().includes(searchLower) ||
        g.phone.includes(searchLower) ||
        g.orders.some((o) => (pickupCodes.get(o.id) || "").includes(searchLower))
      )
    : customerGroups;

  // Sections — a customer appears in "waiting" if ANY order is still confirmed,
  // "picked up" if all are handled AND at least one is picked_up (mixed picked_up + no_show goes here),
  // "no-show" only if ALL orders are no_show
  const waiting = filteredGroups.filter((g) => g.orders.some((o) => o.status === "confirmed"));
  const handled = filteredGroups.filter((g) => g.orders.every((o) => o.status !== "confirmed"));
  const pickedUp = handled.filter((g) => g.orders.some((o) => o.status === "picked_up"));
  const noShow = handled.filter((g) => g.orders.every((o) => o.status === "no_show"));

  // Progress
  const totalOrders = orders.length;
  const pickedUpCount = orders.filter((o) => o.status === "picked_up").length;
  const noShowCount = orders.filter((o) => o.status === "no_show").length;
  const handledCount = pickedUpCount + noShowCount;
  const allDone = totalOrders > 0 && handledCount === totalOrders;
  const progressPct = totalOrders > 0 ? Math.round((pickedUpCount / totalOrders) * 100) : 0;

  // Stats for completion
  const totalCookies = orders.filter((o) => o.status === "picked_up").reduce((s, o) => s + o.quantity, 0);
  const totalRevenue = orders.filter((o) => o.status === "picked_up").reduce((s, o) => s + o.total_cents, 0);

  async function markOrder(orderId: string, action: "pickup" | "no_show" | "undo_no_show" | "undo_pickup") {
    const token = await getToken();
    if (!token) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (action === "pickup") return { ...o, status: "picked_up" as const, picked_up_at: new Date().toISOString() };
        if (action === "no_show") return { ...o, status: "no_show" as const, picked_up_at: null };
        if (action === "undo_no_show" || action === "undo_pickup") return { ...o, status: "confirmed" as const, picked_up_at: null };
        return o;
      })
    );

    // Show undo toast for single no_show (bulk is handled in markAllOrders)
    if (action === "no_show") {
      if (undoToast) clearTimeout(undoToast.timer);
      const timer = setTimeout(() => setUndoToast(null), 5000);
      setUndoToast({ orderIds: [orderId], name: order.customer_name, action: "no_show", timer });
    }

    await fetch(`/api/parrot/drops/${dropId}/pickup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, action }),
    });
  }

  async function markAllOrders(phone: string, action: "pickup" | "no_show") {
    const group = customerGroups.find((g) => g.phone === phone);
    if (!group) return;
    const eligibleOrders = group.orders.filter((o) => o.status === "confirmed");
    if (eligibleOrders.length === 0) return;

    // Clear any existing toast before bulk action
    if (undoToast) clearTimeout(undoToast.timer);

    // Optimistic update all at once
    const orderIds = eligibleOrders.map((o) => o.id);
    setOrders((prev) =>
      prev.map((o) => {
        if (!orderIds.includes(o.id)) return o;
        if (action === "pickup") return { ...o, status: "picked_up" as const, picked_up_at: new Date().toISOString() };
        if (action === "no_show") return { ...o, status: "no_show" as const, picked_up_at: null };
        return o;
      })
    );

    // Show single undo toast for the whole batch
    if (action === "no_show") {
      const timer = setTimeout(() => setUndoToast(null), 5000);
      setUndoToast({ orderIds, name: group.name, action: "no_show", timer });
    }

    // Fire API calls
    const token = await getToken();
    if (!token) return;
    await Promise.all(
      eligibleOrders.map((order) =>
        fetch(`/api/parrot/drops/${dropId}/pickup`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId: order.id, action }),
        })
      )
    );
  }

  function handleUndo() {
    if (!undoToast) return;
    clearTimeout(undoToast.timer);
    const undoAction = undoToast.action === "no_show" ? "undo_no_show" : "undo_pickup";
    for (const orderId of undoToast.orderIds) {
      markOrder(orderId, undoAction);
    }
    setUndoToast(null);
  }

  // Selected group for bottom sheet
  const selectedGroup = selectedPhone ? customerGroups.find((g) => g.phone === selectedPhone) : null;

  // Toast portal — rendered outside all conditional returns so it's always visible
  const toastPortal = undoToast && typeof document !== "undefined" && createPortal(
    <div className="fixed bottom-6 left-4 right-4 z-[60] flex justify-center animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 bg-forest/95 rounded-2xl shadow-lg max-w-lg w-full">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
          <circle cx="8" cy="8" r="6.5" stroke="#EF4444" strokeWidth="1.2" />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-[13px] text-white font-medium">
          {undoToast.name} marked as no-show{undoToast.orderIds.length > 1 ? ` (${undoToast.orderIds.length} orders)` : ""}
        </span>
        <button
          onClick={handleUndo}
          className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-forest btn-press"
          style={{ backgroundColor: "#E1CDE4" }}
        >
          Undo
        </button>
      </div>
    </div>,
    document.body
  );

  if (loading) {
    return (
      <>
        <div className="pb-8">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="h-4 w-24 bg-forest/5 rounded animate-pulse" />
          </div>
          <div className="px-4 mt-2">
            <div className="h-8 w-48 bg-forest/5 rounded animate-pulse" />
            <div className="h-4 w-32 bg-forest/5 rounded animate-pulse mt-1.5" />
          </div>
          <div className="mx-4 mt-4 h-10 bg-forest/5 rounded-xl animate-pulse" />
          <div className="mx-4 mt-3 h-2.5 bg-forest/5 rounded-full animate-pulse" />
          <div className="px-4 mt-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-forest/5">
                <div className="w-11 h-11 rounded-xl bg-forest/5 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-forest/5 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-forest/5 rounded animate-pulse mt-1" />
                </div>
                <div className="h-9 w-20 bg-forest/5 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {toastPortal}
      </>
    );
  }

  // Completion state
  if (allDone && !undoToast) {
    return (
      <div className="pb-8">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-forest/50 text-sm btn-press">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Drop {formatDropNumber(drop.number)}
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pt-10 pb-8">
          <div className="w-20 h-20 rounded-full bg-forest flex items-center justify-center mb-5">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M10 18l5.5 5.5L26 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display font-black text-2xl text-forest text-center">
            {pickedUpCount > 0 ? "All picked up!" : "Drop wrapped up"}
          </h1>
          <p className="text-[14px] text-forest/45 mt-1.5 text-center">
            {pickedUpCount > 0
              ? `${pickedUpCount} happy customer${pickedUpCount !== 1 ? "s" : ""} served today. You\u2019re incredible, Heidi.`
              : `No pickups this time — it happens. Onward to the next drop!`}
          </p>
        </div>

        <div className="px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-forest/6 rounded-full overflow-hidden">
              <div className="h-full rounded-full w-full" style={{ backgroundColor: "#E1CDE4" }} />
            </div>
            <span className="text-[12px] font-medium text-forest">100%</span>
          </div>
        </div>

        <div className="flex gap-2 px-4 mb-6">
          <div className="flex-1 flex flex-col items-center py-3.5 bg-white rounded-xl border border-forest/6">
            <span className="font-display font-black text-xl text-forest">{pickedUpCount}</span>
            <span className="text-[10px] font-semibold text-forest/40 uppercase tracking-wider">Orders</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3.5 bg-white rounded-xl border border-forest/6">
            <span className="font-display font-black text-xl text-forest">{totalCookies}</span>
            <span className="text-[10px] font-semibold text-forest/40 uppercase tracking-wider">Cookies</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3.5 bg-white rounded-xl border border-forest/6">
            <span className="font-display font-black text-xl text-amber">{formatCents(totalRevenue)}</span>
            <span className="text-[10px] font-semibold text-forest/40 uppercase tracking-wider">Revenue</span>
          </div>
        </div>

        {noShowCount > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-[12px] text-forest/35">
              {noShowCount} no-show{noShowCount > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => {
                const noShowOrders = orders.filter((o) => o.status === "no_show");
                for (const o of noShowOrders) {
                  markOrder(o.id, "undo_no_show");
                }
              }}
              className="text-[12px] font-medium text-forest/40 underline btn-press"
            >
              Undo
            </button>
          </div>
        )}

        <div className="px-4">
          <button
            onClick={async () => {
              await onUpdateStatus(dropId, "completed");
              onBack();
            }}
            className="w-full py-3.5 rounded-xl bg-forest text-white text-sm font-semibold btn-press"
          >
            Complete drop
          </button>
          <p className="text-center text-[12px] text-forest/30 mt-2">
            This will close Drop {formatDropNumber(drop.number)} and move it to history
          </p>
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
        <div className="flex items-center px-2.5 py-1 rounded-full text-forest text-[11px] font-semibold" style={{ backgroundColor: "#E1CDE4" }}>
          {formatPickupTime(drop.pickup_time_start)} – {formatPickupTime(drop.pickup_time_end)}
        </div>
      </div>

      {/* Title */}
      <div className="px-4 mt-1">
        <h1 className="font-display font-black text-2xl text-forest">Pickup Checklist</h1>
        <p className="text-[13px] text-forest/45 mt-0.5">
          {drop.pickup_location} · {drop.flavor_name}
        </p>
      </div>

      {/* Progress */}
      <div className="px-4 mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-semibold text-forest">{pickedUpCount} of {totalOrders} picked up</span>
          <span className="text-[12px] font-medium text-forest/40">{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-forest/6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: "#E1CDE4" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-forest/8">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <circle cx="6" cy="6" r="4.5" stroke="#1B3D2F" strokeWidth="1.2" opacity="0.3" />
            <path d="M9.5 9.5L12 12" stroke="#1B3D2F" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or #code"
            className="flex-1 text-[14px] text-forest bg-transparent outline-none placeholder:text-forest/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-forest/30 btn-press">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Waiting section */}
      {waiting.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-[11px] font-semibold text-amber uppercase tracking-wider">Waiting for pickup</p>
            <span className="text-[11px] font-medium text-forest/30">
              {waiting.reduce((s, g) => s + g.orders.filter((o) => o.status === "confirmed").length, 0)} remaining
            </span>
          </div>
          <div className="px-4 space-y-1.5">
            {waiting.map((group) => {
              const confirmedOrders = group.orders.filter((o) => o.status === "confirmed");
              const hasMultiple = group.orders.length > 1;
              const firstOrder = confirmedOrders[0] || group.orders[0];
              const code = pickupCodes.get(firstOrder.id) || "#??";
              const totalQty = confirmedOrders.reduce((s, o) => s + o.quantity, 0);

              return (
                <button
                  key={group.phone}
                  onClick={() => setSelectedPhone(group.phone)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-forest/6 btn-press"
                >
                  {/* Pickup code badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center">
                      <span className="font-display font-black text-[13px] text-white">{code}</span>
                    </div>
                    {hasMultiple && (
                      <div className="absolute -top-1 -right-1.5 w-5 h-5 rounded-full bg-amber flex items-center justify-center border-2 border-white">
                        <span className="text-[9px] font-bold text-white">{group.orders.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Name + details */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-forest truncate">{group.name}</span>
                      <span className="text-[11px] text-forest/30 flex-shrink-0">
                        ·{group.phone.slice(-4)}
                      </span>
                    </div>
                    <p className="text-[12px] text-forest/40 truncate">
                      {totalQty}× {drop.flavor_name}
                      {hasMultiple ? ` (${confirmedOrders.length} orders)` : ""}
                    </p>
                  </div>

                  {/* Quick hand button — only for single-order customers */}
                  {!hasMultiple && confirmedOrders.length === 1 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        markOrder(confirmedOrders[0].id, "pickup");
                      }}
                      className="px-4 py-2 rounded-full bg-forest text-white text-[12px] font-semibold flex-shrink-0 btn-press"
                    >
                      Handed
                    </div>
                  )}
                  {(hasMultiple || confirmedOrders.length !== 1) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <path d="M5 3l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Picked up section */}
      {pickedUp.length > 0 && (
        <div className="mt-5 px-4">
          <button
            onClick={() => setPickedUpExpanded(!pickedUpExpanded)}
            className="flex items-center gap-2 mb-2 btn-press"
          >
            <p className="text-[11px] font-semibold text-forest/40 uppercase tracking-wider">Picked up</p>
            <span className="px-1.5 py-0.5 rounded-full bg-forest/8 text-[10px] font-semibold text-forest/50">
              {pickedUpCount}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${pickedUpExpanded ? "rotate-180" : ""}`}>
              <path d="M2.5 4L5 6.5 7.5 4" stroke="#1B3D2F" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            </svg>
          </button>
          {pickedUpExpanded ? (
            <div className="bg-white/60 rounded-xl border border-forest/4 overflow-hidden">
              {pickedUp.map((group) => (
                <button
                  key={group.phone}
                  onClick={() => setSelectedPhone(group.phone)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-forest/4 last:border-b-0 btn-press"
                >
                  <div className="w-5 h-5 rounded-full bg-forest flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2.5 5.5l2 2 3.5-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-semibold text-forest/35">{group.pickupCode}</span>
                  <span className="flex-1 text-left text-[13px] text-forest/40">{group.name}</span>
                  <span className="text-[11px] text-forest/25">
                    {group.orders[0].picked_up_at ? formatTime(group.orders[0].picked_up_at) : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/60 border border-forest/4">
              <div className="w-5 h-5 rounded-full bg-forest flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 5.5l2 2 3.5-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[13px] text-forest/40">
                {pickedUp.slice(0, 3).map((g) => g.name).join(" · ")}
                {pickedUp.length > 3 ? ` + ${pickedUp.length - 3} more` : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* No-show section */}
      {noShow.length > 0 && (
        <div className="mt-4 px-4">
          <button
            onClick={() => setNoShowExpanded(!noShowExpanded)}
            className="flex items-center gap-2 mb-2 btn-press"
          >
            <p className="text-[11px] font-semibold text-red-500/60 uppercase tracking-wider">No-show</p>
            <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-[10px] font-semibold text-red-500">
              {noShowCount}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${noShowExpanded ? "rotate-180" : ""}`}>
              <path d="M2.5 4L5 6.5 7.5 4" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            </svg>
          </button>
          {noShowExpanded && (
            <div className="bg-white/60 rounded-xl border border-red-100 overflow-hidden">
              {noShow.map((group) => (
                <div key={group.phone} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-red-50 last:border-b-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <circle cx="7" cy="7" r="5.5" stroke="#EF4444" strokeWidth="1" opacity="0.4" />
                    <path d="M5 5l4 4M9 5l-4 4" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                  </svg>
                  <span className="text-[12px] font-semibold text-forest/25">{group.pickupCode}</span>
                  <span className="flex-1 text-[13px] text-forest/30">{group.name}</span>
                  <button
                    onClick={() => {
                      for (const o of group.orders) {
                        if (o.status === "no_show") markOrder(o.id, "undo_no_show");
                      }
                    }}
                    className="text-[11px] font-medium text-forest/30 btn-press"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Motivational footer */}
      {!allDone && orders.length > 0 && (
        <div className="mt-8 flex flex-col items-center px-6">
          <p className="font-display font-black text-lg text-forest">
            {handledCount === 0 ? "Ready when you are!" : "Almost there, Heidi!"}
          </p>
          <p className="text-[13px] text-forest/40 mt-0.5 text-center">
            {totalOrders - handledCount} more happy customers to go
          </p>
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center px-6">
          <p className="font-display font-black text-lg text-forest">No orders yet</p>
          <p className="text-[13px] text-forest/40 mt-1">
            Orders will appear here once customers pay for this drop.
          </p>
        </div>
      )}

      {/* Bottom sheet */}
      {selectedGroup && typeof document !== "undefined" && createPortal(
        <PickupDetailSheet
          group={selectedGroup}
          drop={drop}
          pickupCodes={pickupCodes}
          onClose={() => setSelectedPhone(null)}
          onMarkOrder={markOrder}
          onMarkAll={markAllOrders}
        />,
        document.body
      )}

      {/* Undo toast */}
      {toastPortal}
    </div>
  );
}

// Bottom sheet for customer detail
function PickupDetailSheet({
  group,
  drop,
  pickupCodes,
  onClose,
  onMarkOrder,
  onMarkAll,
}: {
  group: CustomerGroup;
  drop: Drop;
  pickupCodes: Map<string, string>;
  onClose: () => void;
  onMarkOrder: (orderId: string, action: "pickup" | "no_show" | "undo_no_show" | "undo_pickup") => void;
  onMarkAll: (phone: string, action: "pickup" | "no_show") => void;
}) {
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd, animateClose } = useSwipeDismiss(onClose);
  const confirmedOrders = group.orders.filter((o) => o.status === "confirmed");
  const hasMultiple = group.orders.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={animateClose} />
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full max-w-lg bg-cream rounded-t-2xl pb-8 animate-slide-up"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-forest/10 mx-auto mt-3 mb-4 cursor-grab" />

        {/* Customer header */}
        <div className="flex items-start gap-3 px-5 pb-4">
          <div className="w-14 h-14 rounded-xl bg-forest flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-base text-white">{group.pickupCode}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-black text-xl text-forest">{group.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[13px] text-forest/40">{group.phone}</span>
              <a
                href={`https://wa.me/${group.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1C3.2 1 1 3.2 1 6c0 .9.2 1.8.7 2.5L1 11l2.6-.7c.7.4 1.6.7 2.4.7 2.8 0 5-2.2 5-5s-2.2-5-5-5z" fill="white" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Orders label */}
        <div className="flex items-center justify-between px-5 mb-2">
          <span className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider">
            Orders ({group.orders.length})
          </span>
          {hasMultiple && (
            <span className="px-2 py-0.5 rounded-full bg-amber/10 text-[10px] font-semibold text-amber">
              Multiple orders
            </span>
          )}
        </div>

        {/* Order cards */}
        <div className="px-5 space-y-2">
          {group.orders.map((order) => {
            const code = pickupCodes.get(order.id) || "#??";
            const isConfirmed = order.status === "confirmed";
            const isPickedUp = order.status === "picked_up";
            const isNoShow = order.status === "no_show";

            return (
              <div key={order.id} className="p-3.5 rounded-xl bg-white border border-forest/6">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-forest/60">{code}</span>
                    <span className="text-[13px] font-semibold text-forest">{drop.flavor_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                    isConfirmed ? "bg-amber/10 text-amber" :
                    isPickedUp ? "bg-forest text-white" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {isConfirmed ? "Waiting" : isPickedUp ? "Picked up" : "No show"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-forest/40">{order.quantity} cookies</span>
                  <span className="font-semibold text-forest">{formatCents(order.total_cents)}</span>
                </div>
                {isConfirmed && (
                  <button
                    onClick={() => {
                      onMarkOrder(order.id, "pickup");
                      // Close only if this was the last confirmed order
                      if (confirmedOrders.length <= 1) animateClose();
                    }}
                    className="w-full mt-2.5 py-2.5 rounded-lg bg-forest text-white text-[12px] font-semibold btn-press"
                  >
                    Mark as handed
                  </button>
                )}
                {isPickedUp && (
                  <button
                    onClick={() => { onMarkOrder(order.id, "undo_pickup"); }}
                    className="w-full mt-2.5 py-2.5 rounded-lg bg-forest/5 text-forest/50 text-[12px] font-medium btn-press"
                  >
                    Undo — move back to waiting
                  </button>
                )}
                {isNoShow && (
                  <button
                    onClick={() => { onMarkOrder(order.id, "undo_no_show"); }}
                    className="w-full mt-2.5 py-2.5 rounded-lg bg-red-50 text-red-500 text-[12px] font-medium btn-press"
                  >
                    Undo no-show — move back to waiting
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Hand all button */}
        {hasMultiple && confirmedOrders.length > 1 && (
          <div className="px-5 mt-3">
            <button
              onClick={() => { onMarkAll(group.phone, "pickup"); animateClose(); }}
              className="w-full py-3 rounded-xl bg-amber text-white text-[13px] font-semibold btn-press"
            >
              Hand all {confirmedOrders.length} orders
            </button>
          </div>
        )}

        {/* Divider + No-show */}
        {confirmedOrders.length > 0 && (
          <>
            <div className="h-px bg-forest/6 mx-5 mt-4" />
            <button
              onClick={() => {
                for (const o of confirmedOrders) {
                  onMarkOrder(o.id, "no_show");
                }
                animateClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 btn-press"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#EF4444" strokeWidth="1" />
                <path d="M5 5l4 4M9 5l-4 4" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] font-medium text-red-500">Mark as no-show</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
