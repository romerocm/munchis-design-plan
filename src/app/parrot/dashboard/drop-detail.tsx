"use client";

import { formatDropNumber, DROP_STATUS_LABELS } from "@/lib/drops/constants";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import { formatCents, getInitials } from "@/lib/format";
import type { Drop, Order } from "@/types/database";

interface Props {
  drop: Drop;
  orders: Order[];
  onBack: () => void;
  onEdit: () => void;
  onOpenPickup?: () => void;
}

export function DropDetail({ drop, orders, onBack, onEdit, onOpenPickup }: Props) {
  const dropOrders = orders.filter((o) => o.drop_id === drop.id);
  const paidOrders = dropOrders.filter((o) => o.status === "confirmed" || o.status === "picked_up");
  const activeOrders = dropOrders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "picked_up");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const totalTreats = paidOrders.reduce((sum, o) => sum + o.quantity, 0);
  const usedCapacity = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
  const capacityPct = drop.capacity > 0 ? Math.min(100, Math.round((usedCapacity / drop.capacity) * 100)) : 0;

  const isActive = drop.status !== "completed" && drop.status !== "draft";
  const isCompleted = drop.status === "completed";

  const statusDotColor: Record<string, string> = {
    live: "bg-green-500 animate-pulse",
    closed: "bg-amber-500",
    baking: "bg-amber-500",
    ready: "bg-[#E1CDE4]",
    completed: "bg-forest/30",
    draft: "bg-forest/20",
    scheduled: "bg-purple-400",
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-2 text-forest/50 btn-press">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium">Drops</span>
        </button>
        <button onClick={onEdit} className="px-3.5 py-1.5 rounded-xl bg-forest text-xs font-semibold text-white btn-press">
          Edit
        </button>
      </div>

      {/* Hero */}
      <div className="px-4 pb-4">
        <div className="relative rounded-2xl overflow-hidden bg-forest/5 aspect-[2/1]">
          {drop.hero_image_url ? (
            <img src={drop.hero_image_url} alt="" className="w-full h-full object-cover" />
          ) : drop.flavor_image_url ? (
            <img src={drop.flavor_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-forest/15 text-sm">No image</span>
            </div>
          )}
          {/* Status pill overlay */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-semibold text-forest uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[drop.status] || "bg-forest/30"}`} />
              {drop.status}
            </span>
          </div>
        </div>

        {/* Name + meta */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider">
            Drop {formatDropNumber(drop.number)}
          </p>
          <h1 className="font-display font-black text-2xl text-forest mt-0.5">{drop.flavor_name}</h1>
          {drop.flavor_description && (
            <p className="text-sm text-forest/45 mt-1 leading-relaxed">{drop.flavor_description}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 grid grid-cols-2 gap-2">
        <div className="p-3.5 rounded-xl bg-white">
          <p className="font-display font-black text-2xl text-forest">{paidOrders.length}</p>
          <p className="text-[11px] text-forest/40">Orders</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white">
          <p className="font-display font-black text-2xl text-forest">{totalTreats}</p>
          <p className="text-[11px] text-forest/40">Treats sold</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white">
          <p className="font-display font-black text-2xl text-amber">{formatCents(totalRevenue, 0)}</p>
          <p className="text-[11px] text-forest/40">Revenue</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white">
          <div className="flex items-baseline gap-1">
            <p className="font-display font-black text-2xl text-forest">{capacityPct}%</p>
          </div>
          <p className="text-[11px] text-forest/40">{usedCapacity}/{drop.capacity} capacity</p>
        </div>
      </div>

      {/* Price + Location */}
      <div className="px-4 mt-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.35" />
            <path d="M8 5v3.5h2.5" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.35" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-forest">{formatCents(drop.price_cents)}</p>
            <p className="text-[10px] text-forest/35">per treat</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5C5 1.5 2.5 4 2.5 7c0 4.5 5.5 7.5 5.5 7.5s5.5-3 5.5-7.5c0-3-2.5-5.5-5.5-5.5z" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.35" />
            <circle cx="8" cy="7" r="1.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.35" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-forest">{drop.pickup_location}</p>
            <p className="text-[10px] text-forest/35">pickup</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 mt-4">
        <h2 className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider mb-2">Schedule</h2>
        <div className="rounded-xl bg-white p-3.5 space-y-3">
          <TimelineRow
            label="Orders open"
            value={new Date(drop.orders_open_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" })}
            done={isActive || isCompleted}
          />
          <TimelineRow
            label="Orders close"
            value={new Date(drop.orders_close_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" })}
            done={drop.status !== "live" && drop.status !== "scheduled" && drop.status !== "draft"}
          />
          <TimelineRow
            label="Pickup"
            value={`${new Date(drop.pickup_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/El_Salvador" })} · ${drop.pickup_time_start}–${drop.pickup_time_end}`}
            done={isCompleted}
            isLast
          />
        </div>
      </div>

      {/* Pickup checklist CTA */}
      {drop.status === "ready" && onOpenPickup && paidOrders.length > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={onOpenPickup}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-forest/6 btn-press"
            style={{ backgroundColor: "#E1CDE4" + "20" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1CDE4" + "40" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="#8B6B8E" strokeWidth="1.3" />
                <path d="M5.5 8l2 2 3-3.5" stroke="#8B6B8E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-forest">Pickup checklist</p>
              <p className="text-[12px] text-forest/45">
                {paidOrders.filter((o) => o.status === "picked_up").length}/{paidOrders.length} picked up
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E1CDE4" + "40" }}>
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#E1CDE4", width: `${paidOrders.length > 0 ? (paidOrders.filter((o) => o.status === "picked_up").length / paidOrders.length) * 100 : 0}%` }}
                />
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="#8B6B8E" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Orders list */}
      {dropOrders.length > 0 && (
        <div className="px-4 mt-4 pb-8">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider">Orders</h2>
            <span className="text-[11px] text-forest/25">{dropOrders.length} total</span>
          </div>
          <div className="space-y-1.5">
            {dropOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white">
                <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-forest">
                    {getInitials(order.customer_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-forest truncate">{order.customer_name}</p>
                  <p className="text-[11px] text-forest/40">{order.quantity}x · {formatCents(order.total_cents)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty orders state */}
      {dropOrders.length === 0 && (
        <div className="px-4 mt-4 pb-8">
          <div className="py-8 rounded-xl bg-white text-center">
            <p className="text-sm font-semibold text-forest/30">No orders</p>
            <p className="text-[12px] text-forest/20 mt-1">
              {isCompleted ? "This drop had no orders." : "Orders will show up here."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function TimelineRow({ label, value, done, isLast }: { label: string; value: string; done: boolean; isLast?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full mt-1 ${done ? "bg-forest" : "bg-forest/15"}`} />
        {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-[16px] ${done ? "bg-forest/20" : "bg-forest/8"}`} />}
      </div>
      <div className="flex-1 pb-1">
        <p className="text-[11px] font-semibold text-forest/40 uppercase">{label}</p>
        <p className="text-sm text-forest">{value}</p>
      </div>
    </div>
  );
}
