"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CountdownTimer } from "./shared/countdown-timer";
import { formatCents, formatDay, formatTime12 } from "@/lib/format";
import type { Drop } from "@/types/database";

interface Order {
  id: string;
  status: string;
  customer_name: string;
  quantity: number;
  total_cents: number;
  payment_expires_at: string;
  wompi_payment_link: string | null;
  paid_at: string | null;
}

interface Props {
  order: Order;
  drop: Drop;
}

export function OrderStatusPage({ order: initialOrder, drop }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const isPending = order.status === "pending";
  const isConfirmed = order.status === "confirmed";
  const isExpired = order.status === "expired";

  // Poll order status every 5s while pending
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== order.status) {
            setOrder((prev) => ({ ...prev, status: data.status, paid_at: data.paid_at }));
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPending, order.id, order.status]);

  const flavorName = drop.flavor_name;
  const totalFormatted = formatCents(order.total_cents);
  const pickupDay = formatDay(drop.pickup_date);

  // ─── Confirmed state ───
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-forest flex flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-8 max-w-[480px] w-full">
          {/* Confetti */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber/70" />
            <div className="w-2 h-2 rounded-full bg-[#E1CDE4]/90" />
            <div className="w-4 h-4 rounded-full bg-white/15" />
            <div className="w-2.5 h-2.5 rounded-full bg-mint/70" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#E1CDE4]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>

          <h1 className="font-display font-black text-4xl lg:text-[56px] text-white text-center leading-none">
            You got yours!
          </h1>
          <p className="text-[15px] text-white/50 text-center">
            Payment confirmed. We&apos;ll bake your cookies fresh this Saturday.
          </p>

          {/* Share card */}
          <div className="w-full max-w-[320px] rounded-3xl bg-white overflow-hidden">
            {drop.hero_image_url ? (
              <img src={drop.hero_image_url} alt={flavorName} className="w-full h-[200px] object-cover" />
            ) : (
              <div className="w-full h-[200px] bg-forest/4 flex items-center justify-center">
                <span className="text-sm text-forest/20">Cookie photo</span>
              </div>
            )}
            <div className="flex flex-col items-center p-6 gap-2 text-center">
              <Image src="/images/logo-wordmark.svg" alt="munchis" width={80} height={24} className="h-4 w-auto opacity-60" />
              <span className="font-display font-black text-[22px] text-forest">{flavorName}</span>
              <span className="text-[13px] text-forest/40">{order.quantity} cookies · {totalFormatted}</span>
              <span className="text-xs text-forest/30">Pickup {pickupDay} at {drop.pickup_location}</span>
            </div>
          </div>

          {/* Pickup reminder */}
          <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/8 max-w-full">
            <span className="text-[13px] text-white/50 text-center">
              Pickup {pickupDay} {drop.pickup_time_start ? formatTime12(drop.pickup_time_start) : ""}–{drop.pickup_time_end ? formatTime12(drop.pickup_time_end) : ""} at {drop.pickup_location} · We&apos;ll WhatsApp you a reminder
            </span>
          </div>

          <a href="/" className="text-sm text-white/40 hover:text-white/60 transition">
            Back to munchis
          </a>
        </div>
      </div>
    );
  }

  // ─── Expired state ───
  if (isExpired) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-6 max-w-[420px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-forest/6 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="rgba(27,61,47,0.3)" strokeWidth="2" />
              <path d="M14 9v6" stroke="rgba(27,61,47,0.3)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="14" cy="19" r="1" fill="rgba(27,61,47,0.3)" />
            </svg>
          </div>
          <h1 className="font-display font-black text-3xl text-forest">Order expired</h1>
          <p className="text-[15px] text-forest/45 leading-relaxed">
            The 2-hour payment window has passed. Your spot has been released.
            Don&apos;t worry — you can place a new order if the drop is still open.
          </p>
          <a
            href="/"
            className="flex items-center justify-center px-8 py-3.5 rounded-2xl bg-forest text-white font-semibold text-[15px] btn-press"
          >
            Back to munchis
          </a>
        </div>
      </div>
    );
  }

  // ─── Pending (Pay Now) state ───
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-8 max-w-[480px] w-full">
        {/* Journey steps */}
        <div className="flex items-center gap-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-forest flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5L4.5 7.5L7.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-xs text-forest/40">Reserved</span>
          </div>
          <div className="w-6 lg:w-8 h-0.5 bg-amber/30" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-amber flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-xs font-semibold text-amber">Pay</span>
          </div>
          <div className="w-6 lg:w-8 h-0.5 bg-forest/8" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full border-[1.5px] border-forest/12" />
            <span className="text-xs text-forest/25">Pickup</span>
          </div>
        </div>

        {/* Success icon */}
        <div className="w-[72px] h-[72px] rounded-full bg-forest/6 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 16.5L14.5 21L22 12" stroke="#1B3D2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        <h1 className="font-display font-black text-3xl lg:text-[40px] text-forest text-center leading-tight">
          Order reserved!
        </h1>
        <p className="text-[15px] text-forest/45 text-center leading-relaxed max-w-[360px]">
          Pay within 20 minutes to lock in your order. Everything will be baked fresh by hand, just for you.
        </p>

        {/* Countdown */}
        <div className="flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-amber bg-amber/6">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#C4841D" strokeWidth="1.5"/><path d="M9 5.5v4l2.5 1.5" stroke="#C4841D" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <CountdownTimer targetDate={order.payment_expires_at} label="" compact />
          <span className="text-amber font-bold text-sm lg:text-base">remaining to pay</span>
        </div>

        {/* Order details card */}
        <div className="w-full max-w-[420px] rounded-[20px] border border-forest/8 bg-white overflow-hidden">
          <div className="flex justify-between p-5 pb-3">
            <span className="text-sm text-forest/60">{order.quantity}× {flavorName}</span>
            <span className="text-sm text-forest/60">{totalFormatted}</span>
          </div>
          <div className="h-px bg-forest/6 mx-5" />
          <div className="flex justify-between items-baseline p-5 pt-3">
            <span className="text-[15px] font-semibold text-forest">Total</span>
            <span className="font-display font-black text-2xl text-forest">{totalFormatted}</span>
          </div>
          <div className="h-px bg-forest/6 mx-5" />
          <div className="flex items-center gap-2 p-5 pt-3">
            <span className="text-[13px] text-forest/40">
              Baked fresh · Pickup {pickupDay} · {drop.pickup_location}
            </span>
          </div>
        </div>

        {/* CTA */}
        {order.wompi_payment_link && (
          <a
            href={order.wompi_payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full max-w-[360px] py-4 rounded-2xl bg-forest text-white font-semibold text-base btn-press"
          >
            Open payment link
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3h6v6M11 3L3 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        )}
        <p className="text-[13px] text-forest/45 font-medium">Payment link also sent to your WhatsApp</p>
      </div>
    </div>
  );
}
