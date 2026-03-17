"use client";

import { useState } from "react";
import { CountdownTimer } from "./shared/countdown-timer";
import { NotifyForm } from "./shared/notify-form";
import { OrderSheet } from "./order-sheet";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents } from "@/lib/format";
import type { Drop } from "@/types/database";

/*
  State machine mapping Paper artboards to screens:

  drop.status    │  Screen rendered         │  Paper artboard
  ───────────────┼──────────────────────────┼─────────────────────
  null / draft   │  PreDrop (countdown)     │  6S-0
  live           │  Hero → Flavor → Order   │  1-0, V-0, 2S-0, 44-0
  closed/baking  │  PostDrop (orders closed)│  7A-0
  completed      │  PostDrop (done msg)     │  7A-0 variant

  Within "live" status, local screen state:
  ┌────────┐  Order Now  ┌────────┐  Add  ┌────────┐  Submit  ┌─────────┐
  │  hero  │────────────▶│ flavor │──────▶│ order  │────────▶│ pay-now │
  └────────┘             └────────┘       │ sheet  │         └────┬────┘
       ▲                      ▲           └────────┘              │ paid
       └──────── ← Back ──────┘                                   ▼
                                                          ┌───────────────┐
                                                          │  confirmed    │
                                                          │  (share card) │
                                                          └───────────────┘
*/

type LiveScreen = "hero" | "flavor" | "pay-now" | "confirmed";
type Direction = "forward" | "back";

interface DropPageProps {
  drop: Drop | null;
  remaining: number;
}

interface OrderResult {
  order_id: string;
  payment_link: string;
  expires_at: string;
  total_cents: number;
  quantity: number;
  flavor_name: string;
}

export function DropPage({ drop, remaining }: DropPageProps) {
  const [liveScreen, setLiveScreen] = useState<LiveScreen>("hero");
  const [direction, setDirection] = useState<Direction>("forward");
  const [showOrder, setShowOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  function goTo(screen: LiveScreen, dir: Direction = "forward") {
    setDirection(dir);
    setLiveScreen(screen);
  }

  const screenAnim = direction === "forward" ? "animate-fade-slide-in" : "animate-fade-slide-back";

  // ─── NO DROP or DRAFT: Pre-Drop Countdown (artboard 6S-0) ───
  if (!drop || drop.status === "draft") {
    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col">
        <nav className="flex items-center justify-between px-4 py-4">
          <h1 className="font-display font-black text-2xl text-forest">
            munchis
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-forest/10">
            <div className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span className="text-xs font-semibold text-forest/50">
              COMING SOON
            </span>
          </div>
        </nav>

        <div className="mx-4 rounded-2xl overflow-hidden bg-forest/5 aspect-[342/300] relative">
          <img
            src={drop?.hero_image_url || "/images/hero-cookies.jpg"}
            alt="Freshly baked cookies"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="px-4 pt-5 flex-1">
          <p className="text-xs font-medium text-forest/40 uppercase tracking-wider mb-2">
            NEXT DROP
          </p>
          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-3">
            Handmade treats, baked fresh every Sunday
          </h2>
          {drop && (
            <div className="flex items-center gap-2 text-sm text-forest/50 mb-6">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7 7-3.1 7-7S10.9 0 7 0zm3.2 9.8L6.8 8V3.5h1.1v4l3 1.5-.7.8z"
                  fill="currentColor"
                  opacity="0.5"
                />
              </svg>
              Baked Saturday · Pickup Sunday at {drop.pickup_location}
            </div>
          )}
        </div>

        {drop && (
          <div className="px-4 pb-4">
            <CountdownTimer
              targetDate={drop.orders_open_at}
              label="OPENS IN"
            />
          </div>
        )}

        <div className="px-4 pb-8">
          <NotifyForm
            dropId={drop?.id}
            subtitle="Get a WhatsApp message the moment the drop goes live"
          />
        </div>
      </main>
    );
  }

  // ─── CLOSED / BAKING / COMPLETED: Post-Drop (artboard 7A-0) ───
  if (
    drop.status === "closed" ||
    drop.status === "baking" ||
    drop.status === "completed"
  ) {
    const orderedCount = drop.capacity - remaining;

    const statusMessages = {
      closed: "We're buying fresh ingredients Friday and baking everything by hand on Saturday. All made from scratch, just for you.",
      baking: "Your treats are being baked fresh right now! Heidi is in the kitchen making everything from scratch for Sunday pickup.",
      completed: `Drop ${formatDropNumber(drop.number)} is complete! ${orderedCount} orders, all handmade. Stay tuned for the next flavor.`,
    };

    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col">
        <nav className="flex items-center justify-between px-4 py-4">
          <h1 className="font-display font-black text-2xl text-forest">
            munchis
          </h1>
          <div className="px-3 py-1.5 rounded-full border border-forest/10">
            <span className="text-xs font-semibold text-forest/50">
              ORDERS CLOSED
            </span>
          </div>
        </nav>

        <div className="px-4 pt-4 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1.5 rounded-full bg-forest/8">
              <span className="text-xs font-semibold text-forest/60">
                {orderedCount} orders this drop
              </span>
            </div>
          </div>

          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-3">
            Orders are closed!
          </h2>

          <p className="text-sm text-forest/55 leading-relaxed mb-6">
            {statusMessages[drop.status as keyof typeof statusMessages]}
          </p>

          {/* Meet Heidi */}
          <div className="p-5 rounded-2xl bg-mint mb-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center">
                <span className="font-display font-black text-sm text-cream/70">
                  H
                </span>
              </div>
              <p className="text-sm text-forest/55 leading-relaxed max-w-[280px]">
                Food engineer and pastry chef. Every munchis treat is handmade,
                small-batch, no shortcuts.
              </p>
            </div>
          </div>
        </div>

        {/* Notify for next drop */}
        <div className="px-4 pb-4">
          <p className="font-display font-black text-lg text-forest mb-3 text-center">
            Next week&apos;s flavor
          </p>
          <NotifyForm
            dropId={drop.id}
            subtitle={`Be first in line when Drop ${formatDropNumber(drop.number + 1)} opens Monday`}
          />
        </div>

        <div className="px-4 pb-8 text-center">
          <p className="text-sm text-forest/40">Follow us for updates</p>
          <p className="text-sm font-semibold text-forest">@eatmunchis</p>
        </div>
      </main>
    );
  }

  // ─── LIVE STATE ───
  const priceFormatted = formatCents(drop.price_cents);
  const orderedCount = drop.capacity - remaining;
  const capacityPercent = drop.capacity > 0 ? Math.round((orderedCount / drop.capacity) * 100) : 0;

  // ─── PAY NOW screen (artboard 52-0) ───
  if (liveScreen === "pay-now" && orderResult) {
    const totalFormatted = formatCents(orderResult.total_cents);
    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mb-5 animate-bounce-in">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M7 14.5L12 19.5L21 10" stroke="#2D7A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check" />
          </svg>
        </div>

        <h2 className="font-display font-black text-[28px] text-forest mb-2 text-center">
          Order reserved!
        </h2>
        <p className="text-sm text-forest/50 text-center max-w-[280px] mb-8">
          Pay within 2 hours to lock in your order. Everything will be baked fresh by hand this Saturday, just for you.
        </p>

        <div className="flex items-center gap-2 mb-8">
          <CountdownTimer targetDate={orderResult.expires_at} label="" />
        </div>

        <div className="w-full bg-white rounded-2xl p-5 mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-forest">
              {orderResult.quantity}x {orderResult.flavor_name}
            </span>
            <span className="text-sm font-semibold text-forest">
              {totalFormatted}
            </span>
          </div>
          <p className="text-xs text-forest/40 mb-3">
            Baked fresh Saturday · Pickup Sunday · {drop.pickup_location}
          </p>
          <div className="flex justify-between items-baseline border-t border-forest/8 pt-3">
            <span className="font-semibold text-forest">Total</span>
            <span className="font-display font-black text-xl text-forest">
              {totalFormatted}
            </span>
          </div>
        </div>

        <a
          href={orderResult.payment_link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl bg-forest text-white font-semibold text-base flex items-center justify-center gap-2 btn-press"
        >
          Open payment link
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3h8v8M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="text-xs text-forest/35 mt-3">Also sent to your WhatsApp</p>
      </main>
    );
  }

  // ─── PAYMENT CONFIRMED screen (artboard 62-0) ───
  if (liveScreen === "confirmed" && orderResult) {
    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-forest flex flex-col items-center justify-center px-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          PAYMENT CONFIRMED
        </p>
        <h2 className="font-display font-black text-[32px] text-white mb-2 text-center">
          You got yours!
        </h2>
        <p className="text-sm text-white/50 text-center mb-8">
          Your order is being baked from scratch this Saturday
        </p>

        {/* Share Card */}
        <div className="w-full rounded-2xl overflow-hidden bg-white mb-8">
          <div className="aspect-[326/200] bg-forest/5 overflow-hidden">
            <img
              src={drop.hero_image_url || "/images/hero-cookies.jpg"}
              alt="Cookies"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display font-black text-lg text-forest">
                munchis
              </span>
              <span className="text-xs text-forest/40">
                DROP {formatDropNumber(drop.number)}
              </span>
            </div>
            <p className="text-sm text-forest/45 mb-1">
              {orderResult.quantity}x {orderResult.flavor_name}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-accent" />
              <span className="text-xs text-green-accent font-medium">
                Baked from scratch, just for you
              </span>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 text-white font-semibold text-sm mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2v4h4M12 14v-4H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 6A6 6 0 004.5 3.5L2 6M2 10a6 6 0 009.5 2.5L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Share to Stories
        </button>
        <p className="text-xs text-white/30">or save screenshot</p>
      </main>
    );
  }

  // ─── HERO screen (artboard 1-0) ───
  if (liveScreen === "hero") {
    return (
      <main key="hero" className={`min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col ${screenAnim}`}>
        <nav className="flex items-center justify-between px-4 py-4">
          <h1 className="font-display font-black text-2xl text-forest">
            munchis
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-forest/10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse" />
            <span className="text-xs font-semibold text-forest">
              DROP LIVE
            </span>
          </div>
        </nav>

        <div className="mx-4 rounded-2xl overflow-hidden bg-forest/5 aspect-[342/300] relative">
          <img
            src={drop.hero_image_url || "/images/hero-cookies.jpg"}
            alt="Freshly baked chocolate chip cookies in a wooden bowl"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/85 backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1l1.73 3.51L12.5 5l-3 2.93.71 4.14L7 10.27 3.79 12.07l.71-4.14-3-2.93 3.77-.49L7 1z"
                fill="#C8872E"
              />
            </svg>
            <span className="text-[11px] font-semibold text-white tracking-wide">
              Baked from scratch · One flavor per drop
            </span>
          </div>
        </div>

        <div className="px-4 pt-5 flex-1">
          <p className="text-xs font-medium text-forest/40 uppercase tracking-wider mb-2">
            DROP {formatDropNumber(drop.number)} ·{" "}
            {drop.flavor_name.toUpperCase()}
          </p>
          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-3">
            Handmade treats,{"\n"}baked fresh every Sunday
          </h2>
          <p className="text-sm text-forest/55 leading-relaxed">
            One flavor per drop, made from scratch by hand. You order, we bake.
            Nothing sits on a shelf. This week: {drop.flavor_name}.
          </p>
        </div>

        <div className="px-4 pt-4 pb-8">
          <div className="flex items-center justify-center mb-6">
            <CountdownTimer
              targetDate={drop.orders_close_at}
              label="ORDER BY THURSDAY ·"
            />
          </div>
          <button
            onClick={() => goTo("flavor", "forward")}
            className="w-full py-4 rounded-2xl bg-forest text-white font-semibold text-base flex items-center justify-center gap-2 btn-press"
          >
            Order Now
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </main>
    );
  }

  // liveScreen === "flavor" (artboard V-0)
  return (
    <main key="flavor" className={`min-h-screen w-full max-w-lg mx-auto bg-cream ${screenAnim}`}>
      <nav className="flex items-center px-4 py-4">
        <button
          onClick={() => goTo("hero", "back")}
          className="flex items-center gap-1.5 text-forest/60"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 4l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
      </nav>

      <div className="px-4 pt-2 pb-4">
        <p className="text-xs font-medium text-forest/40 uppercase tracking-wider mb-1">
          This week&apos;s drop
        </p>
        <h2 className="font-display font-black text-[28px] text-forest">
          {drop.flavor_name}
        </h2>
      </div>

      <div className="mx-4 rounded-2xl bg-white overflow-hidden">
        <div className="aspect-[342/180] bg-forest/5 overflow-hidden">
          <img
            src={drop.flavor_image_url || "/images/flavor-cookies.jpg"}
            alt={`${drop.flavor_name}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-5">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-semibold text-lg text-forest">
              {drop.flavor_name}
            </h3>
            <span className="text-sm font-semibold text-forest/60">
              {priceFormatted} each
            </span>
          </div>
          <p className="text-sm text-forest/50 leading-relaxed mb-4">
            {drop.flavor_description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 h-1.5 rounded-full bg-forest/8">
                <div
                  className="h-1.5 rounded-full bg-forest animate-fill-bar"
                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-forest/40">
                {orderedCount} ordered
              </span>
            </div>
            <button
              onClick={() => setShowOrder(true)}
              className="ml-4 px-5 py-2 rounded-xl bg-forest text-white text-sm font-semibold btn-press"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Coming Next Week */}
      <div className="mx-4 mt-3 p-5 rounded-2xl bg-[#E1CDE4] text-center animate-stagger-2">
        <p className="text-[11px] font-semibold text-forest/40 uppercase tracking-wider mb-2">
          Coming next week
        </p>
        <p className="font-display font-black text-xl text-forest mb-1">
          Matcha White Choc
        </p>
        <p className="text-xs text-forest/50">
          One flavor per drop. Sign up to get notified when it goes live.
        </p>
      </div>

      {/* Meet Heidi */}
      <div className="mx-4 mt-3 mb-8 px-4 py-8 rounded-2xl bg-mint animate-stagger-3">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <img
              src="/images/munchis-icon.svg"
              alt="munchis"
              className="w-full h-full"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-forest/35 uppercase tracking-wider mb-1">
              The hands behind every treat
            </p>
            <p className="font-display font-black text-2xl text-forest">
              Meet Heidi
            </p>
          </div>
          <p className="text-base text-forest/50 leading-relaxed">
            Food engineer and pastry chef. After 5 years mastering industrial
            food production, she chose to go back to basics.
          </p>
          <p className="text-base font-semibold text-forest leading-relaxed">
            Every munchis treat is her rebellion: handmade, small-batch, no shortcuts.
          </p>
        </div>
      </div>

      {showOrder && (
        <OrderSheet
          drop={drop}
          remaining={remaining}
          onClose={() => setShowOrder(false)}
          onOrderComplete={(result) => {
            setOrderResult({
              ...result,
              flavor_name: drop.flavor_name,
            });
            setShowOrder(false);
            goTo("pay-now", "forward");
          }}
        />
      )}
    </main>
  );
}
