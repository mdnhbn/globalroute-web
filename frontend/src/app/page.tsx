// Language: TypeScript (React/Next.js) | Target: Landing Page with Navigation, Language Switcher & Warning
"use client";

import React from "react";
import Link from "next/link";

import LocalStorageWarning from "@/components/backup/LocalStorageWarning";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import WhatsAppButton from "@/components/common/WhatsAppButton";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">GlobalRoute</h1>
          <p className="mt-1 text-sm text-slate-600">
            Job Matching, Country CV/Cover Letter Builder & Visa/Embassy Roadmap
          </p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">শুরু করুন</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Individual হিসেবে ফ্রি অ্যাকাউন্ট তৈরি করতে পারেন অথবা Agency হিসেবে লাইসেন্স ও Manual Payment প্রুফ
          জমা দিয়ে অনুমোদনের জন্য আবেদন করতে পারেন।
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Register (Individual / Agency)
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Dashboard (Auto-Save & Backup)
          </Link>
          <Link
            href="/career"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Jobs, CV & Visa Guide
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Admin Panel
          </Link>
        </div>
      </section>

      <LocalStorageWarning variant="individual" compact />

      <WhatsAppButton
        defaultMessage="Hello, I want to know more about GlobalRoute."
      />
    </main>
  );
}
