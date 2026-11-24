"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionNotice from "@/components/common/SessionNotice";
import { useLocale } from "@/components/common/LocaleProvider";
import { API_BASE, clearSessionToken, useAccountSession } from "@/lib/account-session";

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

class AdminRequestError extends Error {
  constructor(readonly status: number) {
    super(`Admin request failed (${status})`);
  }
}

export default function AdminPanelPage() {
  const { t } = useLocale();
  const session = useAccountSession();
  if (session.state === "loading") return <SessionNotice message={t("session.checking")} />;
  if (session.state === "error") return <SessionNotice message={t("session.error")} showLogin />;
  if (session.state !== "authenticated" || session.account.role !== "admin" || session.account.status !== "active") {
    return <SessionNotice message={t("admin.loginRequired")} showLogin />;
  }

  return <AdminPanel token={session.token} />;
}

function AdminPanel({ token }: { token: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [agencies, setAgencies] = useState<PendingAgencyItem[]>([]);
  const [payments, setPayments] = useState<PendingPaymentItem[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [accessRevoked, setAccessRevoked] = useState(false);

  // নতুন Payment Method যুক্ত করার ফর্ম
  const [methodName, setMethodName] = useState("bKash");
  const [countryScope, setCountryScope] = useState("Bangladesh");
  const [accountDetails, setAccountDetails] = useState("");
  const [instructions, setInstructions] = useState("");

  const request = useCallback(async (path: string, options?: RequestInit) => {
    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_BASE}/admin${path}`, { ...options, headers, cache: "no-store" });
    if (!response.ok) throw new AdminRequestError(response.status);
    return response;
  }, [token]);

  const reportError = useCallback((error: unknown, message: string) => {
    if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
      clearSessionToken();
      setAccessRevoked(true);
      } else {
        setFeedback(message);
    }
  }, []);

  const loadQueues = useCallback(async (signal?: AbortSignal) => {
    const [agenciesResponse, paymentsResponse] = await Promise.all([
      request("/agencies/pending", { signal }),
      request("/payments/pending", { signal }),
    ]);
    const agencies: Promise<PendingAgencyItem[]> = agenciesResponse.json();
    const payments: Promise<PendingPaymentItem[]> = paymentsResponse.json();
    return Promise.all([agencies, payments]);
  }, [request]);

  useEffect(() => {
    const controller = new AbortController();
    loadQueues(controller.signal)
      .then(([agencies, payments]) => {
        if (!controller.signal.aborted) {
          setAgencies(agencies);
          setPayments(payments);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) reportError(error, t("admin.loadError"));
      });
    return () => controller.abort();
  }, [loadQueues, reportError, t]);

  async function handleAgencyDecision(userId: number, decision: "approve" | "reject") {
    setFeedback("");
    try {
      await request(`/agencies/${userId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note: decision === "approve" ? "Verified by Admin" : "Documents/Payment verification failed",
        }),
      });
    } catch (error) {
      reportError(error, t("admin.decisionError"));
      return;
    }

    setFeedback(t("admin.decided", { userId, decision: decision.toUpperCase() }));
    setAgencies((current) => current.filter((agency) => agency.user_id !== userId));
    setPayments((current) => current.filter((payment) => payment.user_id !== userId));
    await loadQueues()
      .then(([agencies, payments]) => {
        setAgencies(agencies);
        setPayments(payments);
      })
      .catch((error) => reportError(error, t("admin.reloadError")));
  }

  async function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    setFeedback("");
    try {
      await request("/payment-methods", {
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
      setAccountDetails("");
      setInstructions("");
      setFeedback(t("admin.paymentSaved"));
    } catch (error) {
      reportError(error, t("admin.paymentSaveError"));
    }
  }

  if (accessRevoked) return <SessionNotice message={t("admin.sessionExpired")} showLogin />;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t("admin.title")}</h1>
        <button
          type="button"
          onClick={() => {
            clearSessionToken();
            router.replace("/login");
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          {t("common.logout")}
        </button>
      </header>

      {feedback ? (
        <p role="status" className="rounded-lg bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-900">{feedback}</p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{t("admin.pendingAgencies")}</h2>
        {agencies.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{t("admin.noAgencies")}</p>
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
                  <div>{t("admin.licenseLabel")} {ag.license_number}</div>
                  <div>{t("admin.documentsLabel")} {ag.trade_license_doc} | {ag.owner_id_doc}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAgencyDecision(ag.user_id, "approve")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    {t("admin.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgencyDecision(ag.user_id, "reject")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
                  >
                    {t("admin.reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{t("admin.pendingPayments")}</h2>
        {payments.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{t("admin.noPayments")}</p>
        ) : (
          <div className="mt-3 space-y-2 text-xs">
            {payments.map((pay) => (
              <div key={pay.id} className="rounded-lg border border-slate-200 p-3">
                {t("admin.userLabel")} #{pay.user_id} | {pay.method_name} | {pay.amount} {pay.currency} | {t("admin.referenceLabel")}:{" "}
                {pay.transaction_reference} | Proof: {pay.proof_reference || "N/A"}
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleAddPaymentMethod} className="max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{t("admin.addPayment")}</h2>
          <input
            type="text"
            required
              placeholder={t("admin.methodNamePlaceholder")}
            value={methodName}
            onChange={(e) => setMethodName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
              placeholder={t("admin.countryPlaceholder")}
            value={countryScope}
            onChange={(e) => setCountryScope(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
              placeholder={t("admin.accountPlaceholder")}
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={3}
              placeholder={t("admin.instructionsPlaceholder")}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
            {t("admin.savePayment")}
          </button>
      </form>
    </main>
  );
}
