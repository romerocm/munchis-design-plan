"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  compact?: boolean;
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    expired: false,
  };
}

export function CountdownTimer({ targetDate, label, compact }: CountdownTimerProps) {
  const [time, setTime] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(targetDate));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  if (time.expired) {
    return (
      <p className="text-sm text-forest/40 text-center">Orders are closed</p>
    );
  }

  if (compact) {
    return (
      <span className="text-sm font-semibold text-forest/60">
        {time.days}d {time.hours}h {time.minutes}m left
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {label && (
        <p className="text-xs font-medium text-forest/40 uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center">
            <span className="font-display font-black text-2xl text-forest">
              {time.days}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-forest/35 uppercase tracking-wider mt-1">
            Days
          </span>
        </div>
        <span className="font-display font-black text-lg text-forest/25 -mt-4">
          :
        </span>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center">
            <span className="font-display font-black text-2xl text-forest">
              {time.hours}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-forest/35 uppercase tracking-wider mt-1">
            Hrs
          </span>
        </div>
        <span className="font-display font-black text-lg text-forest/25 -mt-4">
          :
        </span>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center">
            <span className="font-display font-black text-2xl text-forest">
              {time.minutes}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-forest/35 uppercase tracking-wider mt-1">
            Min
          </span>
        </div>
      </div>
    </div>
  );
}
