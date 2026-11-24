// Language: TypeScript (React/Next.js) | Target: Login Page with Pending Agency Status Handling
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { API_BASE, saveSessionToken, type AccountRole, type AccountStatus } from "@/lib/account-session";

interface LoginApiResponse {
  access_token: string;
  token_type: string;
  role: AccountRole;
  status: AccountStatus;
  preferred_language: string;
  detail?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const oauthError = params.get("oauth_error");
    if (!oauthError) return;
    const returnedLocale = params.get("locale");
    if (returnedLocale) setLocale(returnedLocale);
    setErrorNotice(oauthError === "google_unavailable" ? t("login.googleUnavailable") : t("login.googleFailed"));
    window.history.replaceState(null, "", "/login");
  }, [setLocale, t]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) {
        setErrorNotice(data?.detail === "Email verification required" ? t("login.verificationRequired") : t("login.failed"));
        return;
      }

      saveSessionToken(data.access_token);
      if (data.preferred_language) {
        setLocale(data.preferred_language);
      }

      if (data.role === "agency" && data.status === "pending_verification") {
        setStatusNotice(
          t("login.agencyPending")
        );
        return;
      }

      if (data.role === "agency" && data.status === "rejected") {
        setErrorNotice(t("login.agencyRejected"));
        return;
      }

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErrorNotice(t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t("login.title")}</h1>
        <LanguageSwitcher />
      </div>

      <form
        onSubmit={handleLogin}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
            {t("login.email")}
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
            {t("login.password")}
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        {errorNotice ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
            {errorNotice}
          </p>
        ) : null}

        {statusNotice ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            {statusNotice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t("login.submitting") : t("login.submit")}
        </button>

        <a
          href={`${API_BASE}/auth/google?locale=${encodeURIComponent(locale)}`}
          className="block w-full rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          {t("login.google")}
        </a>

        <div className="pt-2 text-center text-xs text-slate-600">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="font-bold text-blue-600 underline">
            {t("login.register")}
          </Link>
        </div>
        {errorNotice === t("login.verificationRequired") ? (
          <Link
            href={`/verify-email?email=${encodeURIComponent(email)}`}
            className="block text-center text-xs font-bold text-blue-700 underline"
          >
            {t("login.verification")}
          </Link>
        ) : null}
      </form>

      <WhatsAppButton
        defaultMessage={t("login.whatsappMessage")}
      />
    </main>
  );
}
