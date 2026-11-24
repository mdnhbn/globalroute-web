// Language: TypeScript (React/Next.js) | Target: Super Admin Control Panel (Approvals, Payments & Ads)
"use client";

import React, { useEffect, useState } from "react";

interface PendingAgencyItem {
  id: number;
  user_id: number;
  agency_name: string;
  registration_country: string;
  license_number: string;
  trade_license_doc: string;
  owner_id_doc: string;
  verification_status: string;
}

interface PendingPaymentItem {
  id: number;
  user_id: number;
  method_name: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  proof_reference: string | null;
  status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export default function AdminPanelPage() {
  const [agencies, setAgencies] = useState<PendingAgencyItem[]>([]);
  const [payments, setPayments] = useState<PendingPaymentItem[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  // নতুন Payment Method যুক্ত করার ফর্ম
  const [methodName, setMethodName] = useState("bKash");
  const [countryScope, setCountryScope] = useState("Bangladesh");
  const [accountDetails, setAccountDetails] = useState("");
  const [instructions, setInstructions] = useState("");

  // নতুন Third-Party Ad Script যুক্ত করার ফর্ম
  const [slotName, setSlotName] = useState("header_banner");
  const [providerLabel, setProviderLabel] = useState("Adsterra");
  const [scriptCode, setScriptCode] = useState("");

  async function loadQueues() {
    try {
      const [agRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/admin/agencies/pending`),
        fetch(`${API_BASE}/admin/payments/pending`),
      ]);
      if (agRes.ok) {
        const agData = await agRes.json();
        if (Array.isArray(agData)) setAgencies(agData);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        if (Array.isArray(payData)) setPayments(payData);
      }
    } catch {
      // ব্যাকএন্ড চালু না থাকলে তালিকা খালি থাকবে
    }
  }

  useEffect(() => {
    loadQueues();
  }, []);

  async function handleAgencyDecision(userId: number, decision: "approve" | "reject") {
    setFeedback("");
    try {
      const res = await fetch(`${API_BASE}/admin/agencies/${userId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note: decision === "approve" ? "Verified by Admin" : "Documents/Payment verification failed",
        }),
      });
      if (res.ok) {
        setFeedback(`User #${userId} এর জন্য ${decision.toUpperCase()} সম্পন্ন হয়েছে।`);
        await loadQueues();
      }
    } catch {
      setFeedback("সিদ্ধান্ত আপডেট করা যায়নি।");
    }
  }

  async function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");
    try {
      const res = await fetch(`${API_BASE}/admin/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: methodName,
          country_scope: countryScope,
          account_details: accountDetails,
          instructions,
          is_active: true,
        }),
      });
      if (res.ok) {
        setAccountDetails("");
        setInstructions("");
        setFeedback("নতুন পেমেন্ট মেথড সেভ হয়েছে।");
      }
    } catch {
      setFeedback("পেমেন্ট মেথড সেভ করা যায়নি।");
    }
  }

  async function handleAddAdScript(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");
    try {
      const res = await fetch(`${API_BASE}/admin/ad-scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_name: slotName,
          provider_label: providerLabel,
          script_code: scriptCode,
          target_audience: "individual_and_public",
          is_active: true,
        }),
      });
      if (res.ok) {
        setScriptCode("");
        setFeedback("থার্ড-পার্টি অ্যাড স্ক্রিপ্ট সেভ হয়েছে।");
      }
    } catch {
      setFeedback("অ্যাড স্ক্রিপ্ট সেভ করা যায়নি।");
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>

      {feedback ? (
        <p className="rounded-lg bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-900">{feedback}</p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Pending Agency Verification</h2>
        {agencies.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">কোনো পেন্ডিং এজেন্সি আবেদন নেই।</p>
        ) : (
          <div className="mt-3 space-y-3">
            {agencies.map((ag) => (
              <div
                key={ag.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {ag.agency_name} ({ag.registration_country}) — User #{ag.user_id}
                  </div>
                  <div>License: {ag.license_number}</div>
                  <div>Trade Doc: {ag.trade_license_doc} | Owner ID: {ag.owner_id_doc}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAgencyDecision(ag.user_id, "approve")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgencyDecision(ag.user_id, "reject")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Pending Manual Payments</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">কোনো পেন্ডিং ম্যানুয়াল পেমেন্ট নেই।</p>
        ) : (
          <div className="mt-3 space-y-2 text-xs">
            {payments.map((pay) => (
              <div key={pay.id} className="rounded-lg border border-slate-200 p-3">
                User #{pay.user_id} | {pay.method_name} | {pay.amount} {pay.currency} | Ref:{" "}
                {pay.transaction_reference} | Proof: {pay.proof_reference || "N/A"}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form onSubmit={handleAddPaymentMethod} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">দেশভিত্তিক Manual Payment মেথড যুক্ত করুন</h2>
          <input
            type="text"
            required
            placeholder="মেথড নাম (bKash, Nagad, Bank, Card, Payoneer, PayPal, Crypto)"
            value={methodName}
            onChange={(e) => setMethodName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="দেশ (Bangladesh, India, Pakistan, ALL)"
            value={countryScope}
            onChange={(e) => setCountryScope(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="অ্যাকাউন্ট নম্বর / IBAN / ইমেইল / ওয়ালেট অ্যাড্রেস"
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={3}
            placeholder="পেমেন্ট করার নির্দেশনা লিখুন..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
            Payment Method সেভ করুন
          </button>
        </form>

        <form onSubmit={handleAddAdScript} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">থার্ড-পার্টি অ্যাড স্ক্রিপ্ট যুক্ত করুন (Non-AdSense)</h2>
          <input
            type="text"
            required
            placeholder="স্লট নাম (header_banner, sidebar, footer)"
            value={slotName}
            onChange={(e) => setSlotName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="প্রোভাইডার (Adsterra, Ad Manager, Custom)"
            value={providerLabel}
            onChange={(e) => setProviderLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={4}
            placeholder="এখানে থার্ড-পার্টি বিজ্ঞাপনের স্ক্রিপ্ট বা কোড পেস্ট করুন..."
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            Ad Script সেভ করুন
          </button>
        </form>
      </div>
    </main>
  );
}
