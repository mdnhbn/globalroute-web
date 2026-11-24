// Language: TypeScript (React/Next.js) | Target: Job Matching, CV/Cover Letter & Visa Roadmap Page
"use client";

import React, { useState } from "react";

import LocalStorageWarning from "@/components/backup/LocalStorageWarning";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

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
        setErrorMsg("ম্যাচড জব লোড করা যায়নি।");
        return;
      }
      setJobs(Array.isArray(data?.matches) ? data.matches : []);
    } catch {
      setErrorMsg("ব্যাকএন্ড সার্ভারের সাথে সংযোগ করা যায়নি।");
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
        setErrorMsg("সিভি ও কভার লেটার তৈরি করা যায়নি।");
        return;
      }
      setCvResult(data);
    } catch {
      setErrorMsg("সিভি তৈরির সময় সার্ভার এরর হয়েছে।");
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
        setErrorMsg("ভিসা রোডম্যাপ লোড করা যায়নি।");
        return;
      }
      setVisaResult(data);
    } catch {
      setErrorMsg("ভিসা রোডম্যাপ লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoadingVisa(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          জব ম্যাচিং, দেশভিত্তিক সিভি/কভার লেটার ও ভিসা গাইড
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
        <h2 className="text-lg font-bold text-slate-900">প্রোফাইল ও গন্তব্য তথ্য</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">পূর্ণ নাম</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">ইমেইল</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">ফোন / WhatsApp</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">বর্তমান দেশ (যেখান থেকে আবেদন করবেন)</label>
            <input
              type="text"
              required
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">গন্তব্য দেশ (যে দেশে যেতে চান)</label>
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
            <label className="block text-xs font-semibold text-slate-700">কাজের ক্যাটাগরি</label>
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
            <label className="block text-xs font-semibold text-slate-700">আগ্রহী পদের নাম</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">কাজের অভিজ্ঞতা (বছর)</label>
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
            <label className="block text-xs font-semibold text-slate-700">নিয়োগকর্তা / কোম্পানির নাম (ঐচ্ছিক)</label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">দক্ষতা, লাইসেন্স, সার্টিফিকেট ও অভিজ্ঞতার বিবরণ</label>
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
            {loadingJobs ? "ম্যাচিং চলছে..." : "প্রোফাইলের সাথে জব ম্যাচ করুন"}
          </button>

          <button
            type="submit"
            disabled={loadingCv}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingCv ? "তৈরি হচ্ছে..." : "দেশভিত্তিক সিভি ও কভার লেটার তৈরি করুন"}
          </button>

          <button
            type="button"
            disabled={loadingVisa}
            onClick={handleLoadVisaRoadmap}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingVisa ? "লোড হচ্ছে..." : "ভিসা ও এম্বাসি গাইডলাইন দেখুন"}
          </button>
        </div>
      </form>

      {/* ম্যাচড জব তালিকা */}
      {jobs.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">ম্যাচ হওয়া জবসমূহ (রেফারেন্স সহ)</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {job.title} — {job.country}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                    Match: {job.match_score}%
                  </span>
                </div>
                <div className="mt-1 text-slate-700">
                  Employer: {job.employer} | Salary: {job.salary_range} | CV Format: {job.cv_format}
                </div>
                <div className="mt-2">
                  <a
                    href={job.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 underline"
                  >
                    অফিসিয়াল রেফারেন্স / আবেদন পোর্টাল: {job.reference_url}
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
            <h3 className="text-base font-bold text-slate-900">তৈরিকৃত সিভি ({cvResult.cv_format})</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {cvResult.cv_document}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">কভার লেটার (আবেদন / ইমেইলের জন্য)</h3>
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
            ভিসা ও এম্বাসি প্রসেস ({visaResult.origin_country} থেকে {visaResult.destination_country})
          </h2>
          <p className="text-xs font-semibold text-slate-800">{visaResult.submission_guidance}</p>
          <p className="text-xs text-slate-700">খরচ ও ফি তথ্য: {visaResult.estimated_official_fees}</p>
          <div>
            <div className="text-xs font-bold text-slate-900">প্রয়োজনীয় ডকুমেন্টসমূহ:</div>
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
