// Language: TypeScript (React/Next.js) | Target: Multi-Language Selector with Automatic RTL Direction
"use client";

import React, { useEffect, useState } from "react";

import {
  getTextDirection,
  normalizeLocale,
  SUPPORTED_LOCALES,
  SupportedLocale,
} from "@/lib/i18n";

interface LanguageSwitcherProps {
  value?: string;
  onChange?: (locale: SupportedLocale) => void;
}

const STORAGE_KEY = "globalroute_selected_locale";

export default function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  const [selected, setSelected] = useState<SupportedLocale>(() => {
    if (value) return normalizeLocale(value);
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeLocale(saved);
    }
    return "en";
  });

  useEffect(() => {
    if (value) {
      const normalized = normalizeLocale(value);
      setSelected(normalized);
    }
  }, [value]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = selected;
      document.documentElement.dir = getTextDirection(selected);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, selected);
    }
  }, [selected]);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = normalizeLocale(e.target.value);
    setSelected(nextLocale);
    if (onChange) {
      onChange(nextLocale);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="language-switcher-select" className="text-xs font-semibold text-slate-700">
        Language:
      </label>
      <select
        id="language-switcher-select"
        value={selected}
        onChange={handleSelectChange}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
