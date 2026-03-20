"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CountdownTimer } from "../shared/countdown-timer";
import { NotifyForm } from "../shared/notify-form";
import { OrderSheet } from "../order-sheet";
import { NextDropCard } from "../shared/next-drop-card";
import { MarqueeStrip } from "./marquee-strip";
import { HowItWorks } from "./how-it-works";
import { Footer } from "./footer";
import { BakingTimeline } from "../shared/baking-timeline";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents, formatDay, formatTime12, utcToCST } from "@/lib/format";
import type { Drop } from "@/types/database";

interface Props {
  drop: Drop | null;
  remaining: number;
  nextDrop: Drop | null;
}

const cx = "max-w-[1280px] mx-auto w-full px-12";

export function DesktopDropPage({ drop, remaining, nextDrop }: Props) {
  const [showOrder, setShowOrder] = useState(false);
  const router = useRouter();

  const isLive = drop?.status === "live";
  const isClosed = drop?.status === "closed" || drop?.status === "baking" || drop?.status === "ready" || drop?.status === "completed";
  const priceFormatted = drop ? formatCents(drop.price_cents) : "";
  const orderedCount = drop ? drop.capacity - remaining : 0;
  const capacityPercent = drop && drop.capacity > 0 ? Math.round((orderedCount / drop.capacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-cream flex flex-col gap-4 pb-12">
      {/* Nav */}
      <nav className={`flex items-center justify-between py-5 ${cx}`}>
        <a href="/">
          <Image
            src="/images/logo-wordmark.svg"
            alt="munchis"
            width={140}
            height={40}
            className="h-8 w-auto"
          />
        </a>
        <div className="flex items-center gap-4">
          <a
            href="#meet-heidi"
            className="text-sm text-forest/50 hover:text-forest transition"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("meet-heidi")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            About
          </a>
          {isLive && remaining > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-accent/8 border border-green-accent/20">
              <div className="w-2 h-2 rounded-full bg-green-accent animate-pulse" />
              <span className="text-[13px] font-semibold text-forest">DROP LIVE</span>
            </div>
          )}
          {isLive && remaining <= 0 && (
            <div className="px-3.5 py-1.5 rounded-full border border-amber/30 bg-amber/8">
              <span className="text-xs font-semibold text-amber">SOLD OUT</span>
            </div>
          )}
          {(!drop || drop.status === "draft" || drop.status === "scheduled") && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-forest/10">
              <div className="w-1.5 h-1.5 rounded-full bg-amber" />
              <span className="text-xs font-semibold text-forest/50">COMING SOON</span>
            </div>
          )}
          {isClosed && (
            <div className={`px-3.5 py-1.5 rounded-full border ${remaining === 0 ? "border-amber/30 bg-amber/8" : "border-forest/10"}`}>
              <span className={`text-xs font-semibold ${remaining === 0 ? "text-amber" : "text-forest/50"}`}>
                {drop?.status === "ready" && utcToCST(new Date().toISOString()).date >= drop.pickup_date
                  ? "READY FOR PICKUP"
                  : drop?.status === "ready"
                  ? "BAKING DONE"
                  : remaining === 0 ? "SOLD OUT" : "ORDERS CLOSED"}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Split */}
      {isLive && drop && (
        <div className={cx}>
          <div className="flex rounded-[28px] overflow-hidden min-h-[520px]">
            {/* Left content */}
            <div className="flex-1 flex flex-col justify-center p-12 gap-4 bg-white">
              <p className="text-xs font-semibold text-amber uppercase tracking-wider">
                THIS WEEK&apos;S DROP
              </p>
              <h1 className="font-display font-black text-5xl text-forest leading-[1.05]">
                {drop.flavor_name}
              </h1>
              <p className="text-[15px] text-forest/45 leading-relaxed max-w-[400px]">
                {drop.flavor_description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl text-forest">{priceFormatted}</span>
                <span className="text-sm text-forest/35">each</span>
              </div>
              {/* CTA + Countdown + Scarcity — tightly coupled (Fitts' Law) */}
              <div className="flex flex-col gap-4 pt-2">
                {remaining <= 0 ? (
                  <>
                    {/* Scarcity bar — full, pulsing amber */}
                    <div className="flex flex-col gap-1.5 max-w-[280px]">
                      <div className="h-1.5 rounded-full bg-forest/6 w-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber w-full" />
                      </div>
                      <span className="text-xs font-semibold text-amber">{drop.capacity} of {drop.capacity} claimed — sold out</span>
                    </div>
                    {/* FOMO nudge + inline notify */}
                    <div className="flex flex-col gap-3 max-w-[340px]">
                      <p className="text-sm text-forest/50">
                        This drop went fast. Get a heads-up next time so you don&apos;t miss out.
                      </p>
                      <NotifyForm
                        dropId={drop.id}
                        subtitle="Be first in line for the next drop"
                        bgClass="bg-forest/[0.04] border border-forest/10"
                      />
                    </div>
                  </>
                ) : (
                <>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowOrder(true)}
                    className="px-8 py-4 rounded-2xl bg-amber text-white font-semibold text-base flex items-center gap-2 btn-press"
                  >
                    Order Now
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-forest/30 uppercase tracking-wider">CLOSES THURSDAY</span>
                    <CountdownTimer targetDate={drop.orders_close_at} label="" compact />
                  </div>
                </div>
                {/* Scarcity indicator (Goal-Gradient Effect) */}
                <div className="flex flex-col gap-1.5 max-w-[280px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-forest/50">{orderedCount} of {drop.capacity} claimed</span>
                    <span className="text-xs text-forest/30">{remaining} left</span>
                  </div>
                  <div className="h-1 rounded-full bg-forest/6 w-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber animate-fill-bar"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
                </>
                )}
              </div>
            </div>
            {/* Right image */}
            <div className="flex-1 relative bg-forest/[0.04]">
              <img
                src={drop.hero_image_url || "/images/hero-cookies.jpg"}
                alt={drop.flavor_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-forest/85 backdrop-blur-sm">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 117 3.5a1.5 1.5 0 010 3z"
                    fill="white"
                  />
                </svg>
                <span className="text-[11px] font-semibold text-white tracking-wide">
                  {drop.pickup_location} · {formatDay(drop.pickup_date)} {drop.pickup_time_start ? formatTime12(drop.pickup_time_start) : ""}{drop.pickup_time_end ? `–${formatTime12(drop.pickup_time_end)}` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Drop hero */}
      {(!drop || drop.status === "draft" || drop.status === "scheduled") && (
        <div className={cx}>
          <div className="flex rounded-[28px] overflow-hidden min-h-[400px] bg-forest/[0.03] items-center justify-center">
            <div className="text-center max-w-lg px-8">
              <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-3">LIMITED BATCH</p>
              <h1 className="font-display font-black text-4xl text-forest mb-3">
                Something sweet is coming
              </h1>
              <p className="text-[15px] text-forest/45 leading-relaxed max-w-[380px] mx-auto mb-2">
                Small-batch, handmade treats. Each drop sells out fast — be the first to know when orders open.
              </p>
              {drop?.status === "scheduled" && (
                <CountdownTimer targetDate={drop.orders_open_at} label="OPENS IN" />
              )}
              <div className="mt-6 max-w-sm mx-auto">
                <NotifyForm dropId={drop?.id} subtitle="Get notified before it's gone" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closed/Baking hero — warm baking journey (Peak-End Rule + Goal-Gradient) */}
      {isClosed && drop && (() => {
        const soldOut = remaining === 0;
        const todayCST = utcToCST(new Date().toISOString()).date;
        const isPickupDay = todayCST >= drop.pickup_date;
        const pickupDay = formatDay(drop.pickup_date);
        const heading = drop.status === "baking"
          ? "We\u2019re baking your treats right now"
          : drop.status === "ready" && isPickupDay
          ? "Ready for pickup!"
          : drop.status === "ready"
          ? "Fresh out of the oven!"
          : drop.status === "completed"
          ? "Drop complete!"
          : soldOut
          ? "Sold out!"
          : "Orders are closed";
        const body = drop.status === "baking"
          ? "Every batch handmade from scratch by Heidi. Your treats will be ready for pickup soon."
          : drop.status === "ready" && isPickupDay
          ? `Your treats are ready! Head to ${drop.pickup_location} to pick up your order.`
          : drop.status === "ready"
          ? `Your treats are baked and beautiful! Pickup is ${pickupDay} at ${drop.pickup_location}. Almost there!`
          : drop.status === "completed"
          ? `All ${orderedCount} orders picked up. Thanks for being part of this drop!`
          : soldOut
          ? `All ${drop.capacity} spots claimed! We\u2019re getting fresh ingredients and baking everything by hand.`
          : "We\u2019re getting ready to buy fresh ingredients and bake everything by hand.";
        return (
        <div className={cx}>
          <div className="flex rounded-[28px] overflow-hidden min-h-[420px] gap-4">
            {/* Left — warm message */}
            <div className="flex-[3] flex flex-col justify-center p-14 gap-6 bg-white rounded-[28px]">
              <div className={`inline-flex px-3 py-1 rounded-full self-start ${soldOut ? "bg-amber/10" : "bg-forest/6"}`}>
                <span className={`text-xs font-semibold ${soldOut ? "text-amber" : "text-forest/50"}`}>
                  {soldOut ? `${drop.capacity} of ${drop.capacity} claimed` : `${orderedCount} orders this drop`}
                </span>
              </div>
              <h1 className="font-display font-black text-[44px] text-forest leading-[1.08]">
                {heading}
              </h1>
              <p className="text-[15px] text-forest/45 leading-relaxed max-w-[420px]">
                {body}
              </p>
            </div>
            {/* Right — baking timeline (Goal-Gradient + Zeigarnik) */}
            <div className="flex-[2] flex flex-col justify-center p-10 bg-forest/[0.03] rounded-[28px]">
              <BakingTimeline drop={drop} orderedCount={orderedCount} />
            </div>
          </div>
        </div>
        );
      })()}

      {/* Marquee — show when ordering is possible */}
      {(isLive || (!drop || drop.status === "draft" || drop.status === "scheduled")) && (
        <MarqueeStrip />
      )}

      {/* How It Works — full version for both live and pre-drop */}
      {(isLive || (!drop || drop.status === "draft" || drop.status === "scheduled")) && (
        <div className={cx}>
          <HowItWorks />
        </div>
      )}

      {/* Bottom Cards — Meet Heidi left (smaller), Coming Next Week right (bigger) */}
      <div className={`flex gap-4 ${cx}`}>
        {/* Meet Heidi — left, smaller */}
        <div id="meet-heidi" className={`${isClosed ? "flex-[2]" : "flex-[2]"} p-8 rounded-[20px] bg-mint flex flex-col items-center justify-center text-center gap-3`}>
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <Image src="/images/munchis-icon.svg" alt="munchis" width={48} height={48} />
          </div>
          <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider">The hands behind every treat</p>
          <p className="font-display font-black text-xl text-forest">Meet Heidi</p>
          <p className="text-[13px] text-forest/45 max-w-[360px]">
            Food engineer and pastry chef. Every munchis treat is her rebellion: handmade, small-batch, no shortcuts.
          </p>
        </div>

        {/* Coming Next Week — right, promoted when closed */}
        <NextDropCard nextDrop={nextDrop} currentDropId={drop?.id} className={`${isClosed ? "flex-[3]" : "flex-[3]"}`} />
      </div>

      {/* Footer */}
      <div className={cx}>
        <Footer />
      </div>

      {/* Order Sheet (modal on desktop) */}
      {showOrder && drop && isLive && (
        <OrderSheet
          drop={drop}
          remaining={remaining}
          onClose={() => setShowOrder(false)}
          onOrderComplete={(result) => {
            setShowOrder(false);
            router.push(`/order/${result.order_id}`);
          }}
        />
      )}
    </div>
  );
}
