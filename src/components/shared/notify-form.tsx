"use client";

import { useState } from "react";
import { PhoneInput } from "./phone-input";

interface NotifyFormProps {
  dropId?: string;
  subtitle?: string;
  inline?: boolean;
}

export function NotifyForm({ dropId, subtitle }: NotifyFormProps) {
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
          You&apos;re on the list!
        </p>
        <p className="text-xs text-forest/35 mt-1">
          We&apos;ll WhatsApp you when the drop goes live
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <PhoneInput
          value={whatsapp}
          onChange={setWhatsapp}
          onSubmit={handleSubmit}
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="px-5 py-3.5 rounded-xl bg-forest text-white text-sm font-semibold flex-shrink-0 self-start"
        >
          {status === "loading" ? "..." : "Notify me"}
        </button>
      </div>
      {subtitle && (
        <p className="text-xs text-forest/35 mt-2 text-center">{subtitle}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-text mt-2 text-center">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
