"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/context";
import { CountdownTimer } from "./shared/countdown-timer";
import { NotifyForm } from "./shared/notify-form";
import { NextDropCard } from "./shared/next-drop-card";
import { BakingTimeline } from "./shared/baking-timeline";
import { OrderSheet } from "./order-sheet";
import { formatDropNumber } from "@/lib/drops/constants";
import { formatCents, formatDay, formatDayOffset, formatTime12, utcToCST } from "@/lib/format";
import { LanguagePicker } from "./shared/language-picker";
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
  nextDrop: Drop | null;
}

interface OrderResult {
  order_id: string;
  payment_link: string;
  expires_at: string;
  total_cents: number;
  quantity: number;
  flavor_name: string;
}

export function DropPage({ drop, remaining, nextDrop }: DropPageProps) {
  const [liveScreen, setLiveScreen] = useState<LiveScreen>("hero");
  const [direction, setDirection] = useState<Direction>("forward");
  const [showOrder, setShowOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  function goTo(screen: LiveScreen, dir: Direction = "forward") {
    setDirection(dir);
    setLiveScreen(screen);
  }

  const screenAnim = direction === "forward" ? "animate-fade-slide-in" : "animate-fade-slide-back";

  // ─── NO DROP, DRAFT, or SCHEDULED: Pre-Drop / Coming Soon ───
  if (!drop || drop.status === "draft" || drop.status === "scheduled") {
    const showCountdown = drop?.status === "scheduled";

    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col">
        <nav className="flex items-center justify-between px-4 py-4">
          <a href="/">
            <Image
              src="/images/logo-wordmark.svg"
              alt="munchis"
              width={120}
              height={34}
              className="h-7 w-auto"
            />
          </a>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-forest/10">
              <div className="w-1.5 h-1.5 rounded-full bg-amber" />
              <span className="text-xs font-semibold text-forest/50">
                {t("nav.comingSoon")}
              </span>
            </div>
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
          <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-2">
            {t("preDrop.limitedBatch")}
          </p>
          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-2">
            {t("preDrop.heading")}
          </h2>
          <p className="text-sm text-forest/45 leading-relaxed mb-4">
            {t("preDrop.description")}
          </p>
          {showCountdown && drop && (
            <div className="flex items-center gap-2 text-sm text-forest/50 mb-6">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7 7-3.1 7-7S10.9 0 7 0zm3.2 9.8L6.8 8V3.5h1.1v4l3 1.5-.7.8z"
                  fill="currentColor"
                  opacity="0.5"
                />
              </svg>
              {t("preDrop.bakedPickup", { bakingDay: formatDayOffset(drop.pickup_date, -1), pickupDay: formatDay(drop.pickup_date), location: drop.pickup_location })}
            </div>
          )}
        </div>

        {showCountdown && drop && (
          <div className="px-4 pb-4">
            <CountdownTimer
              targetDate={drop.orders_open_at}
              label={t("preDrop.opensIn")}
            />
          </div>
        )}

        <div className="px-4 pb-8">
          <NotifyForm
            dropId={drop?.id}
            subtitle={t("preDrop.notifySubtitle")}
          />
        </div>
      </main>
    );
  }

  // ─── CLOSED / BAKING / COMPLETED: Post-Drop ───
  if (
    drop.status === "closed" ||
    drop.status === "baking" ||
    drop.status === "ready" ||
    drop.status === "completed"
  ) {
    const orderedCount = drop.capacity - remaining;

    const bakingDay = formatDayOffset(drop.pickup_date, -1);
    const ingredientsDay = formatDayOffset(drop.pickup_date, -2);
    const pickupDay = formatDay(drop.pickup_date);

    const soldOut = remaining === 0;
    const todayCST = utcToCST(new Date().toISOString()).date;
    const isPickupDay = todayCST >= drop.pickup_date;
    const readyAndPickupDay = drop.status === "ready" && isPickupDay;
    const readyButEarly = drop.status === "ready" && !isPickupDay;

    const statusMessages: Record<string, string> = {
      closed: soldOut
        ? t("closed.allClaimed", { capacity: drop.capacity, ingredientsDay, bakingDay })
        : t("closed.gettingIngredients", { ingredientsDay, bakingDay }),
      baking: t("closed.bakingNow", { pickupDay }),
      ready: readyAndPickupDay
        ? t("closed.readyPickup", { location: drop.pickup_location, pickupDay })
        : t("closed.readyAlmost", { pickupDay, location: drop.pickup_location }),
      completed: t("closed.dropComplete", { dropNumber: formatDropNumber(drop.number), orderedCount }),
    };

    const closedHeading = drop.status === "closed" && soldOut
      ? t("closed.headingSoldOut")
      : drop.status === "baking"
      ? t("closed.headingBaking")
      : readyAndPickupDay
      ? t("closed.headingReadyPickup")
      : readyButEarly
      ? t("closed.headingFreshOven")
      : drop.status === "completed"
      ? t("closed.headingComplete")
      : t("closed.headingClosed");

    const navBadge = readyAndPickupDay
      ? t("nav.readyForPickup")
      : readyButEarly
      ? t("nav.bakingDone")
      : drop.status === "closed" && soldOut
      ? t("nav.soldOut")
      : t("nav.ordersClosed");

    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col">
        <nav className="flex items-center justify-between px-4 py-4">
          <a href="/">
            <Image
              src="/images/logo-wordmark.svg"
              alt="munchis"
              width={120}
              height={34}
              className="h-7 w-auto"
            />
          </a>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <div className={`px-3 py-1.5 rounded-full border ${soldOut ? "border-amber/30 bg-amber/8" : "border-forest/10"}`}>
              <span className={`text-xs font-semibold ${soldOut ? "text-amber" : "text-forest/50"}`}>
                {navBadge}
              </span>
            </div>
          </div>
        </nav>

        {/* Hero image */}
        <div className="mx-4 rounded-2xl overflow-hidden bg-forest/5 aspect-[342/200] relative">
          <img
            src={drop.hero_image_url || "/images/hero-cookies.jpg"}
            alt={drop.flavor_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/85 backdrop-blur-sm">
            <span className="text-[11px] font-semibold text-white tracking-wide">
              {drop.flavor_name}
            </span>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className={`px-3 py-1.5 rounded-full ${soldOut ? "bg-amber/10" : "bg-forest/8"}`}>
              <span className={`text-xs font-semibold ${soldOut ? "text-amber" : "text-forest/60"}`}>
                {soldOut ? t("closed.capacityClaimed", { count: drop.capacity, capacity: drop.capacity }) : t("closed.ordersThisDrop", { count: orderedCount })}
              </span>
            </div>
          </div>

          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-3">
            {closedHeading}
          </h2>

          <p className="text-sm text-forest/55 leading-relaxed mb-6">
            {statusMessages[drop.status as keyof typeof statusMessages]}
          </p>
        </div>

        {/* Baking Timeline */}
        <div className="mx-4 p-5 rounded-2xl bg-forest/[0.03] mb-4">
          <BakingTimeline drop={drop} orderedCount={orderedCount} />
        </div>

        {/* Meet Heidi */}
        <div className="mx-4 p-5 rounded-2xl bg-mint mb-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image src="/images/munchis-icon.svg" alt="munchis" width={40} height={40} />
            </div>
            <p className="text-sm text-forest/55 leading-relaxed max-w-[280px]">
              {t("flavor.meetHeidiShort")}
            </p>
          </div>
        </div>

        {/* Next drop card */}
        <div className="mx-4 mb-4">
          <NextDropCard nextDrop={nextDrop} currentDropId={drop.id} className="!rounded-2xl !p-5" />
        </div>

        {/* Notify for next drop */}
        <div className="px-4 pb-4">
          <p className="font-display font-black text-lg text-forest mb-3 text-center">
            {t("closed.nextWeekFlavor")}
          </p>
          <NotifyForm
            dropId={drop.id}
            subtitle={t("closed.beFirstInLine", { dropNumber: formatDropNumber(drop.number + 1) })}
          />
        </div>

        <div className="px-4 pb-8 text-center">
          <p className="text-sm text-forest/40">{t("closed.followUs")}</p>
          <p className="text-sm font-semibold text-forest">@eatmunchis</p>
        </div>
      </main>
    );
  }

  // ─── LIVE STATE ───
  const priceFormatted = formatCents(drop.price_cents);
  const orderedCount = drop.capacity - remaining;
  const capacityPercent = drop.capacity > 0 ? Math.round((orderedCount / drop.capacity) * 100) : 0;
  const liveSoldOut = remaining <= 0;

  // ─── SOLD OUT (still active, capacity reached) ───
  if (liveSoldOut && liveScreen !== "pay-now" && liveScreen !== "confirmed") {
    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col">
        <nav className="flex items-center justify-between px-4 py-4">
          <a href="/">
            <img
              src="/images/logo-wordmark.svg"
              alt="Munchis"
              className="h-7 w-auto"
            />
          </a>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <div className="px-3 py-1.5 rounded-full border border-amber/30 bg-amber/8">
              <span className="text-xs font-semibold text-amber">{t("nav.soldOut")}</span>
            </div>
          </div>
        </nav>

        {/* Hero image */}
        <div className="overflow-hidden aspect-[16/9] bg-forest/5">
          <img
            src={drop.hero_image_url || "/images/hero-cookies.jpg"}
            alt={drop.flavor_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-4 pt-5">
          <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-1">
            {t("live.thisWeeksDrop")}
          </p>
          <h2 className="font-display font-black text-[32px] text-forest leading-tight mb-1">
            {drop.flavor_name}
          </h2>
          <p className="text-sm text-forest/45 leading-relaxed mb-4">
            {drop.flavor_description}
          </p>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="font-display font-black text-2xl text-forest">{priceFormatted}</span>
            <span className="text-sm text-forest/35">{t("live.each")}</span>
          </div>

          {/* Scarcity bar */}
          <div className="mb-4">
            <div className="h-1.5 rounded-full bg-forest/8 w-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-amber w-full" />
            </div>
            <span className="text-xs font-semibold text-amber">
              {t("live.claimedSoldOut", { capacity: drop.capacity })}
            </span>
          </div>

          {/* FOMO + notify */}
          <p className="text-sm text-forest/50 mb-4">
            {t("live.dropWentFast")}
          </p>
          <NotifyForm
            dropId={drop.id}
            subtitle={t("live.beFirstNext")}
            bgClass="bg-forest/[0.04] border border-forest/10"
          />
        </div>

        <div className="px-4 py-8 text-center">
          <p className="text-sm text-forest/40">{t("closed.followUs")}</p>
          <p className="text-sm font-semibold text-forest">@eatmunchis</p>
        </div>
      </main>
    );
  }

  // ─── PAY NOW screen ───
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
          {t("payNow.orderReserved")}
        </h2>
        <p className="text-sm text-forest/50 text-center max-w-[280px] mb-8">
          {t("payNow.payWithin")}
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
            {t("payNow.bakedPickup", { bakingDay: formatDayOffset(drop.pickup_date, -1), pickupDay: formatDay(drop.pickup_date), location: drop.pickup_location })}
          </p>
          <div className="flex justify-between items-baseline border-t border-forest/8 pt-3">
            <span className="font-semibold text-forest">{t("payNow.total")}</span>
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
          {t("payNow.openPayment")}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3h8v8M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="text-xs text-forest/35 mt-3">{t("payNow.sentToWhatsApp")}</p>
      </main>
    );
  }

  // ─── PAYMENT CONFIRMED screen ───
  if (liveScreen === "confirmed" && orderResult) {
    return (
      <main className="min-h-screen w-full max-w-lg mx-auto bg-forest flex flex-col items-center justify-center px-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          {t("confirmed.paymentConfirmed")}
        </p>
        <h2 className="font-display font-black text-[32px] text-white mb-2 text-center">
          {t("confirmed.youGotYours")}
        </h2>
        <p className="text-sm text-white/50 text-center mb-8">
          {t("confirmed.bakedFreshScratch")}
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
                {t("confirmed.bakedForYou")}
              </span>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 text-white font-semibold text-sm mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2v4h4M12 14v-4H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 6A6 6 0 004.5 3.5L2 6M2 10a6 6 0 009.5 2.5L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("confirmed.shareStories")}
        </button>
        <p className="text-xs text-white/30">{t("confirmed.orSaveScreenshot")}</p>
      </main>
    );
  }

  // ─── HERO screen ───
  if (liveScreen === "hero") {
    return (
      <main key="hero" className={`min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col ${screenAnim}`}>
        <nav className="flex items-center justify-between px-4 py-4">
          <a href="/">
            <Image
              src="/images/logo-wordmark.svg"
              alt="munchis"
              width={120}
              height={34}
              className="h-7 w-auto"
            />
          </a>
          <div className="flex items-center gap-3">
            <LanguagePicker />
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-green-accent/8 border border-green-accent/20">
              <div className="w-2 h-2 rounded-full bg-green-accent animate-pulse" />
              <span className="text-[13px] font-semibold text-forest">
                {t("nav.dropLive")}
              </span>
            </div>
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
                d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 117 3.5a1.5 1.5 0 010 3z"
                fill="white"
              />
            </svg>
            <span className="text-[11px] font-semibold text-white tracking-wide">
              {drop.pickup_location} · {formatDay(drop.pickup_date)} {drop.pickup_time_start ? formatTime12(drop.pickup_time_start) : ""}{drop.pickup_time_end ? `–${formatTime12(drop.pickup_time_end)}` : ""}
            </span>
          </div>
        </div>

        {/* Amber brand banner */}
        <div className="mx-4 mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber/10">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path
              d="M7 1l1.73 3.51L12.5 5l-3 2.93.71 4.14L7 10.27 3.79 12.07l.71-4.14-3-2.93 3.77-.49L7 1z"
              fill="#C8872E"
            />
          </svg>
          <span className="text-xs font-semibold text-forest/60">
            {t("hero.bakedFromScratch")}
          </span>
        </div>

        <div className="px-4 pt-4 flex-1">
          <p className="text-xs font-medium text-forest/40 uppercase tracking-wider mb-2">
            DROP {formatDropNumber(drop.number)} ·{" "}
            {drop.flavor_name.toUpperCase()}
          </p>
          <h2 className="font-display font-black text-[28px] leading-tight text-forest mb-3">
            {t("hero.heading")}
          </h2>
          <p className="text-sm text-forest/55 leading-relaxed">
            {t("hero.description", { flavorName: drop.flavor_name })}
          </p>
        </div>

        <div className="px-4 pt-4 pb-8">
          <div className="flex items-center justify-center mb-6">
            <CountdownTimer
              targetDate={drop.orders_close_at}
              label={t("hero.orderByThursday")}
            />
          </div>
          <button
            onClick={() => goTo("flavor", "forward")}
            className="w-full py-4 rounded-2xl bg-amber text-white font-semibold text-base flex items-center justify-center gap-2 btn-press"
          >
            {t("hero.orderNow")}
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
          {/* Scarcity hint (Goal-Gradient) */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex-1 max-w-[200px] h-1 rounded-full bg-forest/6 overflow-hidden">
              <div className="h-full rounded-full bg-amber/60" style={{ width: `${capacityPercent}%` }} />
            </div>
            <span className="text-xs text-forest/40">{t("hero.claimed", { count: orderedCount, capacity: drop.capacity })}</span>
          </div>
        </div>
      </main>
    );
  }

  // liveScreen === "flavor"
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
          <span className="text-sm font-medium">{t("flavor.back")}</span>
        </button>
      </nav>

      <div className="px-4 pt-2 pb-4">
        <p className="text-xs font-medium text-forest/40 uppercase tracking-wider mb-1">
          {t("flavor.thisWeeksDrop")}
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
              {priceFormatted} {t("live.each")}
            </span>
          </div>
          <p className="text-sm text-forest/50 leading-relaxed mb-4">
            {drop.flavor_description}
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-forest/8">
                <div
                  className="h-1.5 rounded-full bg-amber animate-fill-bar"
                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-forest/40">
                {t("hero.claimed", { count: orderedCount, capacity: drop.capacity })}
              </span>
            </div>
            <button
              onClick={() => setShowOrder(true)}
              className="w-full py-3 rounded-xl bg-amber text-white text-sm font-semibold btn-press"
            >
              {t("flavor.addToOrder")}
            </button>
          </div>
        </div>
      </div>

      {/* Meet Heidi */}
      <div className="mx-4 mt-3 px-4 py-8 rounded-2xl bg-mint animate-stagger-2">

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
              {t("flavor.handsLabel")}
            </p>
            <p className="font-display font-black text-2xl text-forest">
              {t("flavor.meetHeidi")}
            </p>
          </div>
          <p className="text-base text-forest/50 leading-relaxed">
            {t("flavor.meetHeidiLong")}
          </p>
          <p className="text-base font-semibold text-forest leading-relaxed">
            {t("flavor.meetHeidiRebellion")}
          </p>
        </div>
      </div>

      {/* Coming Next Week */}
      <div className="mx-4 mt-3 mb-8 animate-stagger-3">
        <NextDropCard nextDrop={nextDrop} currentDropId={drop.id} className="!rounded-2xl !p-5" />
      </div>

      {showOrder && (
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
    </main>
  );
}
