"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { findActiveDrop } from "@/lib/drops/find-active";
import { DROP_STATUS_LABELS, DROP_TRANSITIONS, formatDropNumber } from "@/lib/drops/constants";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import { formatCents, getInitials } from "@/lib/format";
import type { Drop, Order } from "@/types/database";

interface Props {
  drops: Drop[];
  orders: Order[];
  onEditDrop: (drop: Drop) => void;
  onViewOrders: () => void;
  onUpdateStatus: (dropId: string, status: string) => Promise<void>;
}

export function HomeTab({ drops, orders, onEditDrop, onViewOrders, onUpdateStatus }: Props) {
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
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const totalTreats = paidOrders.reduce((sum, o) => sum + o.quantity, 0);
  const recentOrders = currentDrop
    ? orders.filter((o) => o.drop_id === currentDrop.id).slice(0, 5)
    : [];
  const upcomingDrafts = drops.filter((d) => d.status === "draft");

  const today = new Date().getDay(); // 0=Sun

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-end justify-between px-4 pt-5 pb-3">
        <div>
          <p className="text-[13px] text-forest/45">Good morning, Heidi</p>
          <h1 className="font-display font-black text-2xl text-forest">munchis</h1>
        </div>
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

      {/* Current Drop Banner */}
      {currentDrop && (
        <div className="mx-4 rounded-2xl bg-forest p-4 space-y-3">
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
            <div className="relative">
              <button
                onClick={() => setStatusDropdown(statusDropdown ? null : currentDrop.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/12 text-xs font-semibold text-white uppercase btn-press"
              >
                {currentDrop.status === "live" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
                {currentDrop.status}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M2 3L4 5L6 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
              {statusDropdown === currentDrop.id && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-10 min-w-[140px]">
                  {/* Current status */}
                  <div className="px-4 py-2.5 text-sm font-semibold text-forest bg-forest/5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-forest mr-2" />
                    {currentDrop.status.charAt(0).toUpperCase() + currentDrop.status.slice(1)}
                  </div>
                  {/* Valid transitions only */}
                  {(DROP_TRANSITIONS[currentDrop.status] || []).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateStatus(currentDrop.id, s);
                        setStatusDropdown(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-forest/60 hover:bg-forest/5 transition"
                    >
                      → {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  {(DROP_TRANSITIONS[currentDrop.status] || []).length === 0 && (
                    <div className="px-4 py-2.5 text-sm text-forest/25">
                      No further transitions
                    </div>
                  )}
                </div>
              )}
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

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-5 mx-4">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="font-display font-black text-lg text-forest">Recent orders</h2>
            <span className="text-xs text-forest/30">{recentOrders.length} total</span>
          </div>
          <div className="space-y-1.5">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white">
                <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-forest">
                    {getInitials(order.customer_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-forest truncate">{order.customer_name}</p>
                  <p className="text-[11px] text-forest/40">{order.quantity}x {currentDrop?.flavor_name} · {formatCents(order.total_cents)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
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
                <p className="text-[11px] text-forest/35">Draft · Scheduled {new Date(draft.pickup_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
              <span className="text-[11px] font-semibold text-forest/30">Edit</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
