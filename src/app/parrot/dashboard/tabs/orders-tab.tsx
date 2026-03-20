"use client";

import { useState } from "react";
import { findActiveDrop } from "@/lib/drops/find-active";
import { formatDropNumber } from "@/lib/drops/constants";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import { formatCents, getInitials } from "@/lib/format";
import type { Drop, Order } from "@/types/database";

type Filter = "all" | "confirmed" | "pending" | "expired";

interface Props {
  drops: Drop[];
  orders: Order[];
  onSimulatePayment: (orderId: string) => Promise<void>;
}

export function OrdersTab({ drops, orders, onSimulatePayment }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  // Active drop first, then allow switching to view any drop
  const activeDrop = findActiveDrop(drops);

  const [selectedDropId, setSelectedDropId] = useState(activeDrop?.id || "");
  const currentDrop = drops.find((d) => d.id === selectedDropId) || activeDrop;

  const dropOrders = currentDrop
    ? orders.filter((o) => o.drop_id === currentDrop.id)
    : [];

  const filtered = filter === "all"
    ? dropOrders
    : filter === "confirmed"
    ? dropOrders.filter((o) => o.status === "confirmed" || o.status === "picked_up")
    : dropOrders.filter((o) => o.status === filter);

  const counts = {
    all: dropOrders.length,
    confirmed: dropOrders.filter((o) => o.status === "confirmed" || o.status === "picked_up").length,
    pending: dropOrders.filter((o) => o.status === "pending").length,
    expired: dropOrders.filter((o) => o.status === "expired").length,
  };

  const filters: { id: Filter; label: string; color: string }[] = [
    { id: "all", label: `All (${counts.all})`, color: "" },
    { id: "confirmed", label: `Paid (${counts.confirmed})`, color: "text-green-700" },
    { id: "pending", label: `Pending (${counts.pending})`, color: "text-amber-700" },
    { id: "expired", label: `Expired (${counts.expired})`, color: "text-forest/30" },
  ];

  function getTimeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return `${h}h ${m}m left to pay`;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-1">
        <h1 className="font-display font-black text-2xl text-forest">Orders</h1>
      </div>

      {/* Drop selector */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {drops.filter((d) => d.status !== "draft").map((drop) => (
          <button
            key={drop.id}
            onClick={() => { setSelectedDropId(drop.id); setFilter("all"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition btn-press ${
              currentDrop?.id === drop.id
                ? "bg-forest text-white"
                : "bg-forest/5 text-forest/50"
            }`}
          >
            {formatDropNumber(drop.number)} {drop.flavor_name}
            {drop.status === "live" && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition btn-press ${
              filter === f.id
                ? "bg-forest text-white"
                : `bg-forest/5 ${f.color || "text-forest/50"}`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="mx-4 space-y-2">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-forest/25">No {filter === "all" ? "" : filter} orders</p>
          </div>
        )}
        {filtered.map((order) => {
          const isExpired = order.status === "expired";
          const isPending = order.status === "pending";
          const timeLeft = isPending ? getTimeLeft(order.payment_expires_at) : null;

          return (
            <div
              key={order.id}
              className={`rounded-xl bg-white p-3.5 space-y-2.5 ${isExpired ? "opacity-50" : ""}`}
            >
              {/* Customer row */}
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPending ? "bg-amber-50" : isExpired ? "bg-red-50" : "bg-mint"
                }`}>
                  <span className={`text-[11px] font-semibold ${
                    isPending ? "text-amber-700" : isExpired ? "text-red-700" : "text-forest"
                  }`}>
                    {getInitials(order.customer_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest truncate">{order.customer_name}</p>
                  <p className={`text-xs ${isPending && timeLeft ? "text-amber-600" : "text-forest/40"}`}>
                    {isPending && timeLeft ? timeLeft : new Date(order.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {/* Order detail row */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-forest/3">
                <div>
                  <p className="text-[13px] font-medium text-forest">{order.quantity}x {currentDrop?.flavor_name}</p>
                  <p className="text-[11px] text-forest/35">{order.customer_whatsapp}</p>
                </div>
                <span className={`text-sm font-bold text-forest ${isExpired ? "line-through opacity-40" : ""}`}>
                  {formatCents(order.total_cents)}
                </span>
              </div>

              {/* Simulate payment for pending */}
              {isPending && (
                <button
                  onClick={() => onSimulatePayment(order.id)}
                  className="w-full py-2 rounded-lg bg-mint text-xs font-semibold text-green-accent btn-press"
                >
                  Simulate payment
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
