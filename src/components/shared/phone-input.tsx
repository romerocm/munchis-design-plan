"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";

/**
 * Phone input with +503 prefix for El Salvador.
 * - Default: +503 prefix, user types 8-digit local number
 * - Escape hatch: "Not in El Salvador?" switches to free-text international
 * - Always emits E.164 format via onChange (e.g. +50378901234)
 */

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
  bgClass?: string; // default: "bg-white/50", use "bg-white" on cream backgrounds
}

function formatLocal(digits: string): string {
  // Format as "7890 1234"
  const clean = digits.replace(/\D/g, "").slice(0, 8);
  if (clean.length > 4) {
    return clean.slice(0, 4) + " " + clean.slice(4);
  }
  return clean;
}

function toE164(raw: string, isLocal: boolean): string {
  if (isLocal) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    return digits.length > 0 ? `+503${digits}` : "";
  }
  // International: strip everything except digits and leading +
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length > 0) return `+${cleaned}`;
  return "";
}

export function PhoneInput({ value, onChange, placeholder, className = "", onSubmit, bgClass = "bg-white/50" }: PhoneInputProps) {
  const { t } = useTranslation();
  const [isLocal, setIsLocal] = useState(true);
  const [localDisplay, setLocalDisplay] = useState("");
  const [intlDisplay, setIntlDisplay] = useState("");

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setLocalDisplay(formatLocal(raw));
    onChange(toE164(raw, true));
  }

  function handleIntlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIntlDisplay(e.target.value);
    onChange(toE164(e.target.value, false));
  }

  function switchMode(toLocal: boolean) {
    setIsLocal(toLocal);
    if (toLocal) {
      setIntlDisplay("");
      onChange(toE164(localDisplay, true));
    } else {
      setLocalDisplay("");
      onChange("");
    }
  }

  if (!isLocal) {
    return (
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className={`flex gap-2 ${className}`}>
          <input
            type="tel"
            value={intlDisplay}
            onChange={handleIntlChange}
            placeholder={placeholder || "+1 555 123 4567"}
            className={`flex-1 px-4 py-3.5 rounded-xl ${bgClass} text-forest placeholder:text-forest/25 text-sm outline-none`}
            onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          />
        </div>
        <button
          type="button"
          onClick={() => switchMode(true)}
          className="text-[11px] text-forest/30 hover:text-forest/50 transition-colors text-left"
        >
          {t("phone.backToLocal")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <div className={`flex gap-2 ${className}`}>
        <div className={`flex items-center rounded-xl ${bgClass} overflow-hidden flex-1`}>
          <span className="pl-4 pr-2 text-sm font-medium text-forest/40 select-none shrink-0 border-r border-forest/8 py-3.5">
            +503
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={localDisplay}
            onChange={handleLocalChange}
            placeholder={placeholder || "7890 1234"}
            className="flex-1 px-3 py-3.5 bg-transparent text-forest placeholder:text-forest/25 text-sm outline-none"
            onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => switchMode(false)}
        className="text-[11px] text-forest/30 hover:text-forest/50 transition-colors self-start"
      >
        {t("phone.notInElSalvador")}
      </button>
    </div>
  );
}
