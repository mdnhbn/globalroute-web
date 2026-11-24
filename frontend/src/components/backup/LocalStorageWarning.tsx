// Language: TypeScript (React/Next.js) | Target: Prominent Local Storage Warning Notice Banner
"use client";

import React from "react";
import { useLocale } from "@/components/common/LocaleProvider";

interface LocalStorageWarningProps {
  variant?: "individual" | "agency";
  compact?: boolean;
}

export default function LocalStorageWarning({
  variant = "individual",
  compact = false,
}: LocalStorageWarningProps) {
  const { t } = useLocale();

  return (
    <div
      role="alert"
      className={`w-full rounded-xl border-2 border-red-500 bg-red-50 text-red-950 shadow-sm ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
          !
        </span>
        <div className="space-y-1.5">
          <h3 className={compact ? "text-sm font-bold text-red-800" : "text-lg font-extrabold text-red-800"}>
            {t("warning.title")}
          </h3>
          <p className={compact ? "text-xs leading-5 text-red-900" : "text-sm leading-6 text-red-900"}>
            {variant === "agency" ? t("warning.agencyBody") : t("warning.body")}
          </p>
          <p className="text-xs font-semibold text-red-700">
            {t("warning.tip")}
          </p>
        </div>
      </div>
    </div>
  );
}
