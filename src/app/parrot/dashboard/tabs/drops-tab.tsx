"use client";

import { findActiveDrop } from "@/lib/drops/find-active";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents } from "@/lib/format";
import type { Drop, Order } from "@/types/database";

interface Props {
  drops: Drop[];
  orders: Order[];
  onEditDrop: (drop: Drop) => void;
  onCreateDrop: () => Promise<void>;
}

export function DropsTab({ drops, orders, onEditDrop, onCreateDrop }: Props) {
  const liveDrop = findActiveDrop(drops.filter((d) => d.status !== "draft" && d.status !== "scheduled" && d.status !== "completed"));
  const drafts = drops.filter((d) => d.status === "draft" || d.status === "scheduled");
  const completed = drops.filter((d) => d.status === "completed");

  function getDropStats(drop: Drop) {
    const dropOrders = orders.filter(
      (o) => o.drop_id === drop.id && (o.status === "confirmed" || o.status === "picked_up")
    );
    return {
      orderCount: dropOrders.length,
      revenue: dropOrders.reduce((sum, o) => sum + o.total_cents, 0),
    };
  }

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-end justify-between px-4 pt-5 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-forest">Drops</h1>
          <p className="text-xs text-forest/40">Schedule and manage your weekly drops</p>
        </div>
        <button
          onClick={onCreateDrop}
          className="px-3.5 py-2 rounded-xl bg-forest text-xs font-semibold text-white btn-press"
        >
          + New
        </button>
      </div>

      {/* This week */}
      {liveDrop && (() => {
        const liveStats = getDropStats(liveDrop);
        return (
          <>
            <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider px-4 mb-2">This week</p>
            <button
              onClick={() => onEditDrop(liveDrop)}
              className="w-[calc(100%-2rem)] mx-4 flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-forest/8 btn-press"
            >
              <div className="w-12 h-12 rounded-xl bg-forest/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {liveDrop.flavor_image_url ? (
                  <img src={liveDrop.flavor_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-forest/30">photo</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-forest">{liveDrop.flavor_name}</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest/8 text-[10px] font-semibold text-forest/60 uppercase">
                    <span className={`w-1.5 h-1.5 rounded-full ${liveDrop.status === "live" ? "bg-green-500 animate-pulse" : "bg-forest/30"}`} />
                    {liveDrop.status}
                  </span>
                </div>
                <p className="text-xs text-forest/40 mt-0.5">
                  Drop {formatDropNumber(liveDrop.number)} · {liveDrop.pickup_location} · Closes {new Date(liveDrop.orders_close_at).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/El_Salvador" })}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
              </svg>
            </button>
            {/* Current drop stats */}
            <div className="flex gap-2 mx-4 mt-2">
              <div className="flex-1 p-3 rounded-xl bg-white">
                <p className="font-display font-black text-lg text-forest">{liveStats.orderCount}</p>
                <p className="text-[10px] text-forest/35">Orders</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white">
                <p className="font-display font-black text-lg text-amber">{formatCents(liveStats.revenue, 0)}</p>
                <p className="text-[10px] text-forest/35">Revenue</p>
              </div>
            </div>
          </>
        );
      })()}

      {/* Scheduled drafts */}
      {drafts.length > 0 && (
        <>
          <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider px-4 mt-5 mb-2">Upcoming</p>
          <div className="mx-4 space-y-1.5">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => onEditDrop(draft)}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white border-[1.5px] border-dashed border-forest/10 btn-press"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E1CDE4] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-forest/40">{formatDropNumber(draft.number)}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-forest">{draft.flavor_name}</p>
                  <p className="text-xs text-forest/35">
                    {new Date(draft.orders_open_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/El_Salvador" })} - {new Date(draft.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/El_Salvador" })} · {draft.pickup_location}
                  </p>
                  <p className="text-[11px] text-amber mt-0.5">
                    {draft.status === "scheduled" ? `Scheduled · Goes live ${daysUntil(draft.orders_open_at)}` : "Draft"}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
                </svg>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Past drops */}
      <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider px-4 mt-5 mb-2">Past drops</p>
      {completed.length > 0 && (() => {
        const allStats = completed.map(getDropStats);
        const totalOrders = allStats.reduce((sum, s) => sum + s.orderCount, 0);
        const totalRevenue = allStats.reduce((sum, s) => sum + s.revenue, 0);
        return (
          <p className="text-[12px] text-forest/35 px-4 -mt-1 mb-2.5">
            {completed.length} drops · {totalOrders} orders · {formatCents(totalRevenue, 0)} earned
          </p>
        );
      })()}
      {completed.length === 0 ? (
        <div className="mx-4 py-6 rounded-xl bg-forest/3 text-center">
          <p className="text-[13px] text-forest/25">No completed drops yet. Your first one is live!</p>
        </div>
      ) : (
        <div className="mx-4 space-y-1.5">
          {completed.map((drop) => {
            const stats = getDropStats(drop);
            return (
              <button
                key={drop.id}
                onClick={() => onEditDrop(drop)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white btn-press"
              >
                <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {drop.flavor_image_url ? (
                    <img src={drop.flavor_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-forest/30">{formatDropNumber(drop.number)}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-forest">{drop.flavor_name}</p>
                  <p className="text-[11px] text-forest/35">
                    {stats.orderCount} orders · {formatCents(stats.revenue, 0)} · {new Date(drop.pickup_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/El_Salvador" })}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
