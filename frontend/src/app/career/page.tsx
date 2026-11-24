// Language: TypeScript (React/Next.js) | Target: Job Matching, CV/Cover Letter & Visa Roadmap Page
"use client";

import React, { useState } from "react";

import LocalStorageWarning from "@/components/backup/LocalStorageWarning";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLocale } from "@/components/common/LocaleProvider";

interface JobMatchItem {
  id: string;
  title: string;
  country: string;
  region: string;
  category: string;
  min_years: number;
  employer: string;
  salary_range: string;
  reference_url: string;
  cv_format: string;
  match_score: number;
}

interface CvLetterResult {
  cv_format: string;
  cv_document: string;
  cover_letter: string;
}

interface VisaRoadmapResult {
  origin_country: string;
  destination_country: string;
  required_documents: string[];
  estimated_official_fees: string;
  submission_guidance: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export default function CareerPage() {
  const { t } = useLocale();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [originCountry, setOriginCountry] = useState("Bangladesh");
  const [targetCountry, setTargetCountry] = useState("Canada");
  const [jobCategory, setJobCategory] = useState("driver");
  const [jobTitle, setJobTitle] = useState("Heavy Truck Driver");
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [employerName, setEmployerName] = useState("Hiring Manager");

  const [jobs, setJobs] = useState<JobMatchItem[]>([]);
  const [cvResult, setCvResult] = useState<CvLetterResult | null>(null);
  const [visaResult, setVisaResult] = useState<VisaRoadmapResult | null>(null);

  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingVisa, setLoadingVisa] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleMatchJobs() {
    setErrorMsg("");
    setLoadingJobs(true);
    try {
      const url = `${API_BASE}/career/jobs/match?target_country=${encodeURIComponent(
        targetCountry
      )}&job_category=${encodeURIComponent(jobCategory)}&experience_years=${Number(experienceYears)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(t("career.jobsError"));
        return;
      }
      setJobs(Array.isArray(data?.matches) ? data.matches : []);
    } catch {
        setErrorMsg(t("common.serverError"));
    } finally {
      setLoadingJobs(false);
    }
  }

  async function handleGenerateCvAndLetter(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoadingCv(true);
    try {
      const res = await fetch(`${API_BASE}/career/cv-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          current_country: originCountry,
          target_country: targetCountry,
          job_title: jobTitle,
          experience_years: Number(experienceYears),
          skills_summary: skillsSummary,
          employer_name: employerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(t("career.cvError"));
        return;
      }
      setCvResult(data);
    } catch {
      setErrorMsg(t("career.serverError"));
    } finally {
      setLoadingCv(false);
    }
  }

  async function handleLoadVisaRoadmap() {
    setErrorMsg("");
    setLoadingVisa(true);
    try {
      const url = `${API_BASE}/career/visa-roadmap?origin_country=${encodeURIComponent(
        originCountry
      )}&destination_country=${encodeURIComponent(targetCountry)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(t("career.visaError"));
        return;
      }
      setVisaResult(data);
    } catch {
      setErrorMsg(t("common.serverError"));
    } finally {
      setLoadingVisa(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {t("career.title")}
        </h1>
        <LanguageSwitcher />
      </div>

      <LocalStorageWarning variant="individual" compact />

      {errorMsg ? (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">{errorMsg}</p>
      ) : null}

      {/* প্রোফাইল ও গন্তব্য ইনপুট */}
      <form
        onSubmit={handleGenerateCvAndLetter}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-slate-900">{t("career.profile")}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.fullName")}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.phone")}</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.origin")}</label>
            <input
              type="text"
              required
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.destination")}</label>
            <input
              type="text"
              required
              placeholder="Canada, Portugal, Italy, Japan, Germany..."
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.category")}</label>
            <input
              type="text"
              required
              placeholder="driver, chef, welder, agriculture, nurse..."
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.jobTitle")}</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.experience")}</label>
            <input
              type="number"
              min={0}
              max={50}
              required
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">{t("career.employer")}</label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">{t("career.skills")}</label>
            <textarea
              required
              rows={3}
              value={skillsSummary}
              onChange={(e) => setSkillsSummary(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loadingJobs}
            onClick={handleMatchJobs}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingJobs ? t("career.matching") : t("career.match")}
          </button>

          <button
            type="submit"
            disabled={loadingCv}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingCv ? t("career.generating") : t("career.generate")}
          </button>

          <button
            type="button"
            disabled={loadingVisa}
            onClick={handleLoadVisaRoadmap}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingVisa ? t("career.loading") : t("career.visa")}
          </button>
        </div>
      </form>

      {/* ম্যাচড জব তালিকা */}
      {jobs.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{t("career.jobsHeading")}</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {job.title} — {job.country}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                    {t("career.matchScore", { score: job.match_score })}
                  </span>
                </div>
                <div className="mt-1 text-slate-700">
                  {t("career.employerLabel")} {job.employer} | {t("career.salaryLabel")} {job.salary_range} | {t("career.cvFormatLabel")} {job.cv_format}
                </div>
                <div className="mt-2">
                  <a
                    href={job.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 underline"
                  >
                    {t("career.officialReference")} {job.reference_url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* জেনারেটেড সিভি ও কভার লেটার */}
      {cvResult ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">{t("career.cvHeading", { format: cvResult.cv_format })}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {cvResult.cv_document}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">{t("career.coverHeading")}</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {cvResult.cover_letter}
            </pre>
          </div>
        </section>
      ) : null}

      {/* ভিসা ও এম্বাসি রোডম্যাপ */}
      {visaResult ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {t("career.visaHeading", { origin: visaResult.origin_country, destination: visaResult.destination_country })}
          </h2>
          <p className="text-xs font-semibold text-slate-800">{visaResult.submission_guidance}</p>
          <p className="text-xs text-slate-700">{t("career.feesLabel")} {visaResult.estimated_official_fees}</p>
          <div>
            <div className="text-xs font-bold text-slate-900">{t("career.documentsHeading")}</div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-700">
              {visaResult.required_documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
