"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_LOCALE,
  getTextDirection,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  SupportedLocale,
  translate,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  const setLocale = useCallback((value: string) => {
    const next = normalizeLocale(value);
    setLocaleState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // Keep the current selection for this page even when storage is unavailable.
      }
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved) setLocale(saved);
    } catch {
      // The default locale remains usable when browser storage is unavailable.
    }
  }, [setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getTextDirection(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key, values) => translate(locale, key, values) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
