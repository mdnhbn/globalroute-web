// Language: TypeScript (React/Next.js) | Target: Multi-Language Selector with Automatic RTL Direction
"use client";

import React from "react";

import { normalizeLocale, SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/components/common/LocaleProvider";

interface LanguageSwitcherProps {
  onChange?: (locale: SupportedLocale) => void;
}

export default function LanguageSwitcher({ onChange }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = normalizeLocale(e.target.value);
    setLocale(nextLocale);
    onChange?.(nextLocale);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="language-switcher-select" className="text-xs font-semibold text-slate-700">
        {t("language.label")}
      </label>
      <select
        id="language-switcher-select"
        value={locale}
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
