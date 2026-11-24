"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/common/LocaleProvider";
import { API_BASE, clearSessionToken, saveSessionToken } from "@/lib/account-session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t, setLocale } = useLocale();
  const [hasError, setHasError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");
    const locale = params.get("locale");
    if (locale) setLocale(locale);
    window.history.replaceState(null, "", "/auth/callback");

    if (!token) {
      if (active) setHasError(true);
      return () => { active = false; };
    }

    saveSessionToken(token);
    const controller = new AbortController();
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Authentication could not be completed");
        return response.json();
      })
      .then((account: { role: string }) => {
        if (!active) return;
        router.replace(account.role === "admin" ? "/admin" : "/dashboard");
      })
      .catch(() => {
        clearSessionToken();
        if (active) setHasError(true);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [router, setLocale]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-12 text-center">
      {hasError ? (
        <>
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{t("login.googleFailed")}</p>
          <Link href="/login" className="text-sm font-bold text-blue-700 underline">{t("common.login")}</Link>
        </>
      ) : (
        <p role="status" className="text-sm text-slate-700">{t("common.loading")}</p>
      )}
    </main>
  );
}
