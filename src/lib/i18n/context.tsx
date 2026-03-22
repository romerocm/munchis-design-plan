"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import en, { type DictionaryKeys } from "./dictionaries/en/index";
import es from "./dictionaries/es/index";

type Lang = "en" | "es";

const STORAGE_KEY = "munchis-lang";
const dictionaries: Record<Lang, Record<DictionaryKeys, string>> = { en, es };

interface I18nContextValue {
  lang: Lang;
  t: (key: DictionaryKeys, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "es") setLang(stored);

    function onLangChange(e: Event) {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "en" || detail === "es") setLang(detail);
    }

    window.addEventListener("munchis-lang-change", onLangChange);
    return () => window.removeEventListener("munchis-lang-change", onLangChange);
  }, []);

  const t = useCallback(
    (key: DictionaryKeys, params?: Record<string, string | number>): string => {
      let str = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
