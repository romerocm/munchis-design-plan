"use client";

import { useState, useEffect } from "react";

type Lang = "en" | "es";

const STORAGE_KEY = "munchis-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(STORAGE_KEY) as Lang) || "en";
}

export function LanguagePicker() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getInitialLang());
  }, []);

  function toggle() {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("munchis-lang-change", { detail: next }));
  }

  return (
    <div className="flex rounded-lg p-[3px] gap-[2px] bg-forest/6 cursor-pointer" onClick={toggle}>
      <span
        className={`rounded-md px-2 py-[3px] text-[11px] leading-[14px] transition-colors ${
          lang === "en"
            ? "bg-forest text-white font-semibold"
            : "text-forest/35 font-medium"
        }`}
      >
        EN
      </span>
      <span
        className={`rounded-md px-2 py-[3px] text-[11px] leading-[14px] transition-colors ${
          lang === "es"
            ? "bg-forest text-white font-semibold"
            : "text-forest/35 font-medium"
        }`}
      >
        ES
      </span>
    </div>
  );
}
