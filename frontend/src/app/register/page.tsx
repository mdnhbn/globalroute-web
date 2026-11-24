// Language: TypeScript (React/Next.js) | Target: Individual vs Agency Registration with Docs & Manual Payment
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";

interface PaymentMethodItem {
  id: number;
  name: string;
  country_scope: string;
  account_details: string;
  instructions: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export default function RegisterPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [accountType, setAccountType] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [preferredLanguage, setPreferredLanguage] = useState("bn");
  const [password, setPassword] = useState("");

  // Agency ডকুমেন্ট ও তথ্য
  const [agencyName, setAgencyName] = useState("");
  const [registrationCountry, setRegistrationCountry] = useState("Bangladesh");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState("");
  const [recruitingLicenseDoc, setRecruitingLicenseDoc] = useState("");
  const [ownerIdDoc, setOwnerIdDoc] = useState("");

  // Agency Manual Payment
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [selectedMethodName, setSelectedMethodName] = useState("bKash");
  const [amount, setAmount] = useState("50");
  const [currency, setCurrency] = useState("USD");
  const [transactionReference, setTransactionReference] = useState("");
  const [proofReference, setProofReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [resultBanner, setResultBanner] = useState<string>("");
  const [errorBanner, setErrorBanner] = useState<string>("");

  useEffect(() => setPreferredLanguage(locale), [locale]);

  useEffect(() => {
    if (accountType !== "agency") return;
    fetch(`${API_BASE}/payments/methods?country=${encodeURIComponent(registrationCountry)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PaymentMethodItem[]) => {
        if (Array.isArray(data)) {
          setPaymentMethods(data);
          if (data.length > 0) {
            setSelectedMethodName(data[0].name);
          }
        }
      })
      .catch(() => {
        setPaymentMethods([]);
      });
  }, [accountType, registrationCountry]);

  const activeMethodObj = paymentMethods.find((m) => m.name === selectedMethodName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResultBanner("");
    setErrorBanner("");

    const bodyPayload: Record<string, unknown> = {
      full_name: fullName,
      email,
      whatsapp_number: whatsappNumber,
      country,
      preferred_language: preferredLanguage,
      password,
      account_type: accountType,
    };

    if (accountType === "agency") {
      bodyPayload.agency_name = agencyName;
      bodyPayload.registration_country = registrationCountry;
      bodyPayload.license_number = licenseNumber;
      bodyPayload.office_address = officeAddress;
      bodyPayload.trade_license_doc = tradeLicenseDoc;
      bodyPayload.recruiting_license_doc = recruitingLicenseDoc || null;
      bodyPayload.owner_id_doc = ownerIdDoc;
      bodyPayload.payment_method_id = activeMethodObj ? activeMethodObj.id : null;
      bodyPayload.method_name = selectedMethodName;
      bodyPayload.amount = Number(amount);
      bodyPayload.currency = currency;
      bodyPayload.transaction_reference = transactionReference;
      bodyPayload.proof_reference = proofReference || null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.detail === "Email already registered") {
          setErrorBanner(t("register.emailExists"));
        } else if (res.status === 503 && data?.detail === "Email verification is not configured") {
          setErrorBanner(t("register.emailUnavailable"));
        } else {
          setErrorBanner(t("register.failed"));
        }
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}&locale=${locale}&account=${accountType}`);
    } catch {
      setErrorBanner(t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t("register.title")}</h1>
        <LanguageSwitcher onChange={(loc) => setPreferredLanguage(loc)} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="mb-2 text-sm font-bold text-slate-800">{t("register.category")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccountType("individual")}
              className={`rounded-xl border p-4 text-left transition ${
                accountType === "individual"
                  ? "border-blue-600 bg-blue-50 text-blue-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <div className="font-bold">{t("register.individual")}</div>
              <div className="text-xs opacity-80">{t("register.individualDescription")}</div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("agency")}
              className={`rounded-xl border p-4 text-left transition ${
                accountType === "agency"
                  ? "border-blue-600 bg-blue-50 text-blue-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <div className="font-bold">{t("register.agency")}</div>
              <div className="text-xs opacity-80">{t("register.agencyDescription")}</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("register.fullName")}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("register.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("register.whatsapp")}</label>
            <input
              type="text"
              required
              placeholder="+88017xxxxxxxx"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("register.country")}</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">{t("register.password")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {accountType === "agency" ? (
          <div className="space-y-4 rounded-xl border border-amber-300 bg-amber-50/50 p-4">
            <h2 className="text-base font-bold text-slate-900">{t("register.agency")} — {t("register.paymentMethod")}</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.agencyName")}</label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.registrationCountry")}</label>
                <input
                  type="text"
                  required
                  value={registrationCountry}
                  onChange={(e) => setRegistrationCountry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.license")}</label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.office")}</label>
                <input
                  type="text"
                  required
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.tradeLicense")}</label>
                <input
                  type="text"
                  required
                  value={tradeLicenseDoc}
                  onChange={(e) => setTradeLicenseDoc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.recruitingLicense")}</label>
                <input
                  type="text"
                  value={recruitingLicenseDoc}
                  onChange={(e) => setRecruitingLicenseDoc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">{t("register.ownerId")}</label>
                <input
                  type="text"
                  required
                  value={ownerIdDoc}
                  onChange={(e) => setOwnerIdDoc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            {activeMethodObj ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
                <div className="font-bold">{t("register.paymentMethod")}: {activeMethodObj.name}</div>
                <div className="mt-1">{t("register.accountWallet")}: {activeMethodObj.account_details}</div>
                <div className="mt-1">{activeMethodObj.instructions}</div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.paymentMethod")}</label>
                <input
                  type="text"
                  required
                  placeholder="bKash / Nagad / Bank / Card / Payoneer / PayPal / Crypto"
                  value={selectedMethodName}
                  onChange={(e) => setSelectedMethodName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.paymentAmount")}</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-2/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("register.transaction")}</label>
                <input
                  type="text"
                  required
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700">{t("register.proof")}</label>
                <input
                  type="text"
                  value={proofReference}
                  onChange={(e) => setProofReference(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ) : null}

        {errorBanner ? (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">{errorBanner}</p>
        ) : null}

        {resultBanner ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            {resultBanner}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t("register.submitting") : t("register.submit")}
        </button>
      </form>
      <Link
        href={`${API_BASE}/auth/google?locale=${encodeURIComponent(locale)}`}
        className="mx-auto mt-4 block max-w-3xl rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-bold text-slate-800 hover:bg-slate-50"
      >
        {t("login.google")}
      </Link>
    </main>
  );
}
