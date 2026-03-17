"use client";

import { useState } from "react";
import Image from "next/image";
import { CountdownTimer } from "../shared/countdown-timer";
import { NotifyForm } from "../shared/notify-form";
import { OrderSheet } from "../order-sheet";
import { MarqueeStrip } from "./marquee-strip";
import { HowItWorks } from "./how-it-works";
import { Footer } from "./footer";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents } from "@/lib/format";
import type { Drop } from "@/types/database";

interface Props {
  drop: Drop | null;
  remaining: number;
}

const cx = "max-w-[1280px] mx-auto w-full px-12";

export function DesktopDropPage({ drop, remaining }: Props) {
  const [showOrder, setShowOrder] = useState(false);

  const isLive = drop?.status === "live";
  const isClosed = drop?.status === "closed" || drop?.status === "baking" || drop?.status === "completed";
  const priceFormatted = drop ? formatCents(drop.price_cents) : "";
  const orderedCount = drop ? drop.capacity - remaining : 0;
  const capacityPercent = drop && drop.capacity > 0 ? Math.round((orderedCount / drop.capacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-cream flex flex-col gap-4 pb-12">
      {/* Nav */}
      <nav className={`flex items-center justify-between py-5 ${cx}`}>
        <Image
          src="/images/logo-wordmark.svg"
          alt="munchis"
          width={140}
          height={40}
          className="h-8 w-auto"
        />
        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-forest/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse" />
              <span className="text-xs font-semibold text-forest">DROP LIVE</span>
            </div>
          )}
          {isClosed && (
            <div className="px-3.5 py-1.5 rounded-full border border-forest/10">
              <span className="text-xs font-semibold text-forest/50">ORDERS CLOSED</span>
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
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setShowOrder(true)}
                  className="px-7 py-3.5 rounded-2xl bg-forest text-white font-semibold text-[15px] flex items-center gap-2 btn-press"
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
            </div>
            {/* Right image */}
            <div className="flex-1 relative bg-forest/[0.04]">
              <img
                src={drop.hero_image_url || "/images/hero-cookies.jpg"}
                alt={drop.flavor_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90">
                <span className="text-[11px] font-semibold text-forest">
                  {drop.pickup_location} · Sunday {drop.pickup_time_start?.slice(0, 5)}-{drop.pickup_time_end?.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Drop or Post-Drop hero */}
      {!isLive && (
        <div className={cx}>
          <div className="flex rounded-[28px] overflow-hidden min-h-[400px] bg-forest/[0.03] items-center justify-center">
            <div className="text-center max-w-lg px-8">
              {!drop || drop.status === "draft" ? (
                <>
                  <p className="text-xs font-semibold text-forest/30 uppercase tracking-wider mb-3">NEXT DROP</p>
                  <h1 className="font-display font-black text-4xl text-forest mb-4">
                    Handmade treats, baked fresh every Sunday
                  </h1>
                  {drop && (
                    <CountdownTimer targetDate={drop.orders_open_at} label="OPENS IN" />
                  )}
                  <div className="mt-6 max-w-sm mx-auto">
                    <NotifyForm dropId={drop?.id} subtitle="Get a WhatsApp message when the drop goes live" />
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-block px-3 py-1 rounded-full bg-forest/8 mb-4">
                    <span className="text-xs font-semibold text-forest/60">{orderedCount} orders this drop</span>
                  </div>
                  <h1 className="font-display font-black text-4xl text-forest mb-4">Orders are closed!</h1>
                  <p className="text-sm text-forest/50 leading-relaxed mb-6">
                    We&apos;re buying fresh ingredients Friday and baking everything by hand on Saturday.
                  </p>
                  <div className="max-w-sm mx-auto">
                    <NotifyForm dropId={drop.id} subtitle={`Be first in line when Drop ${formatDropNumber(drop.number + 1)} opens`} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Marquee — full width */}
      <MarqueeStrip />

      {/* How It Works */}
      <div className={cx}>
        <HowItWorks />
      </div>

      {/* Bottom Cards */}
      <div className={`flex gap-4 ${cx}`}>
        {/* Coming Next Week */}
        <div className="flex-1 p-8 rounded-[20px] bg-[#E1CDE4] flex flex-col items-center justify-center text-center gap-3">
          <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">Coming next week</p>
          <p className="font-display font-black text-2xl text-forest">Matcha White Choc</p>
          <p className="text-[13px] text-forest/45 max-w-[320px]">
            One flavor per drop. Sign up to get notified when it goes live.
          </p>
          <div className="flex gap-2 items-center pt-2">
            <NotifyForm dropId={drop?.id} subtitle="" inline />
          </div>
        </div>

        {/* Meet Heidi */}
        <div className="flex-1 p-8 rounded-[20px] bg-mint flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <Image src="/images/munchis-icon.svg" alt="munchis" width={48} height={48} />
          </div>
          <p className="text-[11px] font-semibold text-forest/30 uppercase tracking-wider">The hands behind every treat</p>
          <p className="font-display font-black text-xl text-forest">Meet Heidi</p>
          <p className="text-[13px] text-forest/45 max-w-[360px]">
            Food engineer and pastry chef. Every munchis treat is her rebellion: handmade, small-batch, no shortcuts.
          </p>
        </div>
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
          onOrderComplete={() => setShowOrder(false)}
        />
      )}
    </div>
  );
}
