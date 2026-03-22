"use client";

import type { Drop } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";
import { parseLocalDate, formatDay, formatDayOffset, utcToCST } from "@/lib/format";

interface BakingTimelineProps {
  drop: Drop;
  orderedCount: number;
}

type StepState = "done" | "active" | "waiting" | "upcoming";

interface TimelineStep {
  label: string;
  detail: string;
  state: StepState;
}

function buildSteps(drop: Drop, orderedCount: number, t: (key: any, params?: any) => string, lang: string): TimelineStep[] {
  const now = new Date();
  const pickupDate = parseLocalDate(drop.pickup_date);
  const ingredientsDate = (() => { const d = parseLocalDate(drop.pickup_date); d.setDate(d.getDate() - 2); return d; })();
  const bakingDate = (() => { const d = parseLocalDate(drop.pickup_date); d.setDate(d.getDate() - 1); return d; })();
  // Use closed_at (actual close moment) if available, otherwise fall back to scheduled close
  const closeDay = formatDay(drop.closed_at || drop.orders_close_at, lang);
  const ingredientsDay = formatDayOffset(drop.pickup_date, -2, lang);
  const bakingDay = formatDayOffset(drop.pickup_date, -1, lang);
  const pickupDay = formatDay(drop.pickup_date, lang);

  // Ingredients: done if baker toggled groceries_bought_at, or if we're past that phase.
  const ingredientsDone =
    !!drop.groceries_bought_at
    || ["baking", "ready", "completed"].includes(drop.status)
    || now >= ingredientsDate;
  const todayCST = utcToCST(new Date().toISOString()).date;
  const isPickupDay = todayCST >= drop.pickup_date;
  const bakingDone = drop.status === "ready" || drop.status === "completed";
  const bakingActive = !bakingDone && drop.status === "baking";
  const pickupActive = drop.status === "ready" && isPickupDay;
  const pickupDone = drop.status === "completed";

  // Show actual groceries date when available
  const ingredientsDetail = drop.groceries_bought_at
    ? `${formatDay(drop.groceries_bought_at, lang)} · ${t("timeline.ingredientsDetail")}`
    : `${ingredientsDay} · ${t("timeline.ingredientsDetail")}`;

  return [
    {
      label: t("timeline.ordersClosed"),
      detail: `${closeDay} · ${t("timeline.ordersLockedIn", { count: orderedCount })}`,
      state: "done" as StepState,
    },
    {
      label: t("timeline.freshIngredients"),
      detail: ingredientsDetail,
      state: ingredientsDone ? "done" as StepState : "upcoming" as StepState,
    },
    {
      label: bakingActive ? t("timeline.bakingInProgress") : bakingDone ? t("timeline.bakingComplete") : t("timeline.bakingDay"),
      detail: `${bakingDay} · ${t("timeline.madeByHand")}`,
      state: (bakingDone ? "done" : bakingActive ? "active" : "upcoming") as StepState,
    },
    {
      label: pickupActive
        ? t("timeline.readyForPickup")
        : pickupDone
        ? t("timeline.pickupComplete")
        : drop.status === "ready" && !isPickupDay
        ? t("timeline.pickupOn", { day: pickupDay })
        : t("timeline.pickupAt", { location: drop.pickup_location }),
      detail: `${pickupDay} · ${drop.pickup_time_start?.slice(0, 5)}–${drop.pickup_time_end?.slice(0, 5)}`,
      state: (pickupDone ? "done" : pickupActive ? "active" : drop.status === "ready" && !isPickupDay ? "waiting" : "upcoming") as StepState,
    },
  ];
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 7.5L6.5 10L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function BakingTimeline({ drop, orderedCount }: BakingTimelineProps) {
  const { t, lang } = useTranslation();
  const steps = buildSteps(drop, orderedCount, t, lang);

  return (
    <div className="flex flex-col justify-center gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div key={i} className={`flex items-start gap-4 ${isLast ? "" : "pb-6"}`}>
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Circle */}
              {step.state === "done" && (
                <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                  <CheckIcon />
                </div>
              )}
              {step.state === "active" && (
                <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
              {step.state === "waiting" && (
                <div className="w-8 h-8 rounded-full border-2 border-amber/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber/40" />
                </div>
              )}
              {step.state === "upcoming" && (
                <div className="w-8 h-8 rounded-full border-2 border-forest/12 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-forest/15" />
                </div>
              )}
              {/* Connector line */}
              {!isLast && (
                <div className={`w-0.5 h-6 ${step.state === "done" ? "bg-forest" : "bg-forest/12"}`} />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pt-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  step.state === "done" ? "text-forest" :
                  step.state === "active" ? "text-amber" :
                  step.state === "waiting" ? "text-amber/70" :
                  "text-forest/35"
                }`}>
                  {step.label}
                </span>
                {step.state === "active" && (
                  <span className="text-[11px] font-semibold text-amber bg-amber/12 px-2 py-0.5 rounded-full">{t("timeline.now")}</span>
                )}
                {step.state === "waiting" && (
                  <span className="text-[11px] font-semibold text-amber/60 bg-amber/8 px-2 py-0.5 rounded-full">{t("timeline.soon")}</span>
                )}
              </div>
              <span className={`text-[13px] ${step.state === "upcoming" ? "text-forest/25" : step.state === "waiting" ? "text-forest/35" : "text-forest/40"}`}>
                {step.detail}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
