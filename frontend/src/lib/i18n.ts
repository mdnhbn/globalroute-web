// Language: TypeScript | Target: Multi-Language & RTL (Arabic/Urdu) Configuration
export type SupportedLocale = "en" | "bn" | "ur" | "hi" | "ar" | "tr" | "ms";

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "bn", label: "বাংলা (Bangladesh)", dir: "ltr" },
  { code: "ur", label: "اردو (Pakistan)", dir: "rtl" },
  { code: "hi", label: "हिन्दी (India)", dir: "ltr" },
  { code: "ar", label: "العربية (Arabic)", dir: "rtl" },
  { code: "tr", label: "Türkçe (Turkish)", dir: "ltr" },
  { code: "ms", label: "Bahasa Melayu (Malay)", dir: "ltr" },
];

export function isRtlLocale(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  return normalized === "ur" || normalized === "ar";
}

export function getTextDirection(code: string): "ltr" | "rtl" {
  return isRtlLocale(code) ? "rtl" : "ltr";
}

export function normalizeLocale(code?: string): SupportedLocale {
  const clean = (code || "en").trim().toLowerCase();
  const match = SUPPORTED_LOCALES.find((item) => item.code === clean);
  return match ? match.code : "en";
}
