"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  compact?: boolean;
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function CountdownTimer({ targetDate, label, compact }: CountdownTimerProps) {
  const { t } = useTranslation();
  // Start null to avoid SSR/client hydration mismatch from Date.now()
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setTime(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTime(getTimeLeft(targetDate));
    }, 1_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [t("countdown.days"), t("countdown.hrs"), t("countdown.min"), t("countdown.sec")];

  // Render placeholder during SSR / first paint to avoid hydration mismatch
  if (!time) {
    if (compact) return <span className="text-sm font-semibold text-forest/60">&nbsp;</span>;
    return (
      <div className="flex items-center gap-3">
        {label && (
          <p className="text-xs font-medium text-forest/40 uppercase tracking-wider">{label}</p>
        )}
        <div className="flex items-center gap-1.5">
          {units.map((u, i) => (
            <div key={u} className="flex flex-col items-center">
              {i > 0 && <span className="font-display font-black text-lg text-forest/25 -mt-4">:</span>}
              <div className={`${u === units[3] ? "w-12 h-12" : "w-14 h-14"} rounded-xl bg-white flex items-center justify-center`}>
                <span className={`font-display font-black ${u === units[3] ? "text-xl text-forest/50" : "text-2xl text-forest"}`}>
                  –
                </span>
              </div>
              <span className="text-[10px] font-semibold text-forest/35 uppercase tracking-wider mt-1">{u}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (time.expired) {
    return (
      <p className="text-sm text-forest/40 text-center">{t("countdown.expired")}</p>
    );
  }

  if (compact) {
    return (
      <span className="text-sm font-semibold text-forest/60">
        {time.days}d {time.hours}h {time.minutes}m {time.seconds}s {t("countdown.left")}
      </span>
    );
  }

  const values = [time.days, time.hours, time.minutes, time.seconds];

  return (
    <div className="flex items-center gap-3">
      {label && (
        <p className="text-xs font-medium text-forest/40 uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        {values.map((val, i) => (
          <div key={i} className="flex flex-col items-center">
            {i > 0 && (
              <span className="font-display font-black text-lg text-forest/25 -mt-4">:</span>
            )}
            <div className={`${i === 3 ? "w-12 h-12" : "w-14 h-14"} rounded-xl bg-white flex items-center justify-center`}>
              <span className={`font-display font-black ${i === 3 ? "text-xl text-forest/50" : "text-2xl text-forest"}`}>
                {val}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-forest/35 uppercase tracking-wider mt-1">
              {units[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
