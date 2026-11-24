"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import { API_BASE } from "@/lib/account-session";

export default function VerifyEmailPage() {
  const { t, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setEmail(query.get("email") || "");
    const requestedLocale = query.get("locale");
    if (requestedLocale) setLocale(requestedLocale);
  }, [setLocale]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!response.ok) {
        setError(response.status === 400 ? t("verify.invalid") : t("common.serverError"));
        return;
      }
      setMessage(t("verify.verified"));
    } catch {
      setError(t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? t("verify.resendWait") : t("common.serverError"));
        return;
      }
      setMessage(t("verify.resendSent"));
    } catch {
      setError(t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t("verify.title")}</h1>
        <LanguageSwitcher />
      </div>
      <form onSubmit={handleVerify} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-700">{t("verify.description", { email })}</p>
        <label className="block text-xs font-semibold text-slate-700" htmlFor="verification-code">
          {t("verify.code")}
        </label>
        <input
          id="verification-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-[0.4em]"
        />
        {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{error}</p> : null}
        {message ? <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{message}</p> : null}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50">
          {submitting ? t("verify.verifying") : t("verify.submit")}
        </button>
        <button type="button" disabled={submitting || !email} onClick={handleResend} className="w-full text-sm font-semibold text-blue-700 underline disabled:opacity-50">
          {t("register.resend")}
        </button>
        {message === t("verify.verified") ? (
          <Link href="/login" className="block text-center text-sm font-bold text-blue-700 underline">{t("common.login")}</Link>
        ) : null}
      </form>
    </main>
  );
}
