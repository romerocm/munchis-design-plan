"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Icon } from "./icon";
import { NotifyForm } from "./notify-form";
import type { Drop } from "@/types/database";

interface NextDropCardProps {
  nextDrop: Drop | null;
  currentDropId?: string;
  className?: string;
}

export function NextDropCard({ nextDrop, currentDropId, className = "" }: NextDropCardProps) {
  const { t, lang } = useTranslation();

  if (nextDrop) {
    return (
      <div className={`p-8 rounded-[20px] bg-[#E1CDE4] flex flex-col items-center justify-center text-center gap-3 ${className}`}>
        <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">{t("nextDrop.comingNextWeek")}</p>
        <p className="font-display font-black text-2xl text-forest">{nextDrop.flavor_name}</p>
        {nextDrop.flavor_description && (
          <p className="text-[13px] text-forest/45 max-w-[320px]">{nextDrop.flavor_description}</p>
        )}
        {!nextDrop.flavor_description && (
          <p className="text-[13px] text-forest/45 max-w-[320px]">
            {t("nextDrop.noDescFallback")}
          </p>
        )}
        <div className="flex gap-2 items-center pt-2">
          <NotifyForm dropId={currentDropId} subtitle="" inline />
        </div>
      </div>
    );
  }

  // No next drop scheduled — suggestion CTA
  const waText = lang === "es"
    ? "Hola%20munchis!%20Me%20encantaría%20ver%20este%20sabor%3A%20"
    : "Hey%20munchis!%20I%27d%20love%20to%20see%20this%20flavor%20next%3A%20";

  return (
    <div className={`p-8 rounded-[20px] bg-[#E1CDE4] flex flex-col items-center justify-center text-center gap-3 ${className}`}>
      <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider">{t("nextDrop.whatBakeNext")}</p>
      <p className="font-display font-black text-2xl text-forest">{t("nextDrop.suggestFlavor")}</p>
      <p className="text-[13px] text-forest/45 max-w-[320px]">
        {t("nextDrop.suggestDesc")}
      </p>
      <a
        href={`https://wa.me/50361569747?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 px-6 py-3 rounded-xl bg-forest text-white text-sm font-semibold btn-press inline-flex items-center gap-2"
      >
        <Icon name="whatsapp-solid" size={16} className="invert" />
        {t("nextDrop.sendSuggestion")}
      </a>
    </div>
  );
}
