// Language: TypeScript (React/Next.js) | Target: Login Page with Pending Agency Status Handling
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import WhatsAppButton from "@/components/common/WhatsAppButton";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface LoginApiResponse {
  access_token: string;
  token_type: string;
  role: "individual" | "agency" | "admin";
  status: "active" | "pending_verification" | "rejected" | "suspended";
  preferred_language: string;
  detail?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

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
        setErrorNotice(typeof data?.detail === "string" ? data.detail : "লগইন ব্যর্থ হয়েছে।");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("globalroute_token", data.access_token);
        window.localStorage.setItem("globalroute_role", data.role);
        window.localStorage.setItem("globalroute_status", data.status);
        if (data.preferred_language) {
          window.localStorage.setItem("globalroute_selected_locale", data.preferred_language);
        }
      }

      if (data.role === "agency" && data.status === "pending_verification") {
        setStatusNotice(
          "আপনার Agency অ্যাকাউন্টটি এখনো Pending Verification অবস্থায় আছে। আপনার লাইসেন্স ও Manual Payment যাচাই হওয়ার পর অনুমোদন দেওয়া হবে এবং WhatsApp-এ জানানো হবে।"
        );
        return;
      }

      if (data.role === "agency" && data.status === "rejected") {
        setErrorNotice("আপনার Agency আবেদনটি অনুমোদিত হয়নি। বিস্তারিত জানতে WhatsApp সাপোর্টে যোগাযোগ করুন।");
        return;
      }

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErrorNotice("ব্যাকএন্ড সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">সাইন-ইন / লগইন</h1>
        <LanguageSwitcher />
      </div>

      <form
        onSubmit={handleLogin}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
            ইমেইল ঠিকানা
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
            পাসওয়ার্ড
          </label>
          <input
            id="login-password"
            type="password"
            required
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
          {submitting ? "লগইন হচ্ছে..." : "লগইন করুন"}
        </button>

        <div className="pt-2 text-center text-xs text-slate-600">
          নতুন অ্যাকাউন্ট প্রয়োজন?{" "}
          <Link href="/register" className="font-bold text-blue-600 underline">
            রেজিস্ট্রেশন করুন
          </Link>
        </div>
      </form>

      <WhatsAppButton
        phoneNumber="8801700000000"
        defaultMessage="আসসালামু আলাইকুম, লগইন বা ভেরিফিকেশন বিষয়ে সাহায্য প্রয়োজন।"
      />
    </main>
  );
}
