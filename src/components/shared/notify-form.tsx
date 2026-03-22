"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { PhoneInput } from "./phone-input";

interface NotifyFormProps {
  dropId?: string;
  subtitle?: string;
  inline?: boolean;
  bgClass?: string;
}

export function NotifyForm({ dropId, subtitle, bgClass }: NotifyFormProps) {
  const { t } = useTranslation();
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleSubmit() {
    if (!whatsapp.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: whatsapp.trim(), drop_id: dropId }),
      });

      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center py-2">
        <p className="text-sm font-semibold text-green-accent">
          {t("notify.onTheList")}
        </p>
        <p className="text-xs text-forest/35 mt-1">
          {t("notify.wellWhatsApp")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {subtitle && (
        <p className="text-xs mb-2" style={{ color: "#302086" }}>{subtitle}</p>
      )}
      <div className="flex gap-2 w-full">
        <PhoneInput
          value={whatsapp}
          onChange={setWhatsapp}
          onSubmit={handleSubmit}
          {...(bgClass ? { bgClass } : {})}
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="px-5 py-3.5 rounded-xl bg-forest text-white text-sm font-semibold flex-shrink-0 self-start"
        >
          {status === "loading" ? "..." : t("notify.notifyMe")}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-text mt-2 text-center">
          {t("notify.error")}
        </p>
      )}
    </div>
  );
}
