// Language: TypeScript (React/Next.js) | Target: Main User/Agency Dashboard with Warning, Backup & Ads
"use client";

import React, { useEffect, useState } from "react";

import ThirdPartyAdSlot from "@/components/ads/ThirdPartyAdSlot";
import BackupRestorePanel from "@/components/backup/BackupRestorePanel";
import LocalStorageWarning from "@/components/backup/LocalStorageWarning";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { autoSaveVaultPartial, loadLocalVault, LocalVaultPayload } from "@/lib/local-db";

interface AdSlotItem {
  id: number;
  slot_name: string;
  provider_label: string;
  script_code: string;
  is_active: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export default function DashboardPage() {
  const [role, setRole] = useState<"individual" | "agency">("individual");
  const [vault, setVault] = useState<LocalVaultPayload | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [saveStateLabel, setSaveStateLabel] = useState<string>("");
  const [adSlots, setAdSlots] = useState<AdSlotItem[]>([]);

  useEffect(() => {
    let active = true;
    loadLocalVault()
      .then((data) => {
        if (!active) return;
        setVault(data);
        const savedNote = typeof data.profileData?.draftSummary === "string" ? data.profileData.draftSummary : "";
        setNoteText(savedNote);
      })
      .catch(() => {
        // লোকাল স্টোরেজ না থাকলে উপেক্ষা করা হবে
      });

    if (role === "individual") {
      fetch(`${API_BASE}/ads/slots?audience=individual_and_public`)
        .then((res) => (res.ok ? res.json() : []))
        .then((items: AdSlotItem[]) => {
          if (active && Array.isArray(items)) {
            setAdSlots(items);
          }
        })
        .catch(() => {
          if (active) setAdSlots([]);
        });
    } else {
      setAdSlots([]);
    }

    return () => {
      active = false;
    };
  }, [role]);

  // হঠাৎ কারেন্ট বা ডিভাইস বন্ধ হলে ডাটা রক্ষার জন্য Auto-Save
  useEffect(() => {
    if (!vault || !vault.autoBackupEnabled) return;
    const timer = window.setTimeout(() => {
      autoSaveVaultPartial((curr) => ({
        ...curr,
        profileData: {
          ...curr.profileData,
          draftSummary: noteText,
        },
      }))
        .then((updated) => {
          setVault(updated);
          setSaveStateLabel("Auto-Saved to Local Device");
        })
        .catch(() => {
          setSaveStateLabel("Auto-Save failed");
        });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [noteText, vault?.autoBackupEnabled]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === "agency" ? "Agency ড্যাশবোর্ড (Ad-Free)" : "Individual ড্যাশবোর্ড"}
          </h1>
          <p className="text-xs text-slate-500">
            {saveStateLabel ? saveStateLabel : "লোকাল ডিভাইস সিঙ্ক সক্রিয়"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRole(role === "individual" ? "agency" : "individual")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            View Mode: {role === "agency" ? "Agency" : "Individual"}
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* বড় ও স্পষ্ট সতর্কবার্তা */}
      <LocalStorageWarning variant={role} />

      {/* শুধু Individual ইউজারদের জন্য Admin-এর থার্ড-পার্টি অ্যাড স্লট */}
      {role === "individual"
        ? adSlots.map((slot) => (
            <ThirdPartyAdSlot
              key={slot.id}
              slotName={slot.slot_name}
              scriptCode={slot.script_code}
              isAgencyUser={false}
            />
          ))
        : null}

      {/* লোকাল Auto-Save ড্রাফট/প্রোফাইল নোট */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="local-draft-box" className="block text-sm font-bold text-slate-900">
          লোকাল প্রোফাইল / সিভি / ক্লায়েন্ট নোট (Auto-Save)
        </label>
        <p className="mt-1 text-xs text-slate-600">
          আপনি যা লিখবেন তা স্বয়ংক্রিয়ভাবে আপনার লোকাল ডিভাইসে সেভ হতে থাকবে।
        </p>
        <textarea
          id="local-draft-box"
          rows={5}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="এখানে আপনার প্রোফাইল, অভিজ্ঞতা বা ক্লায়েন্টের তথ্য লিখুন..."
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Backup File ডাউনলোড ও Restore প্যানেল */}
      <BackupRestorePanel
        onVaultRestored={(restored) => {
          setVault(restored);
          const restoredNote =
            typeof restored.profileData?.draftSummary === "string" ? restored.profileData.draftSummary : "";
          setNoteText(restoredNote);
        }}
      />

      <WhatsAppButton phoneNumber="8801700000000" defaultMessage="আসসালামু আলাইকুম, আমি GlobalRoute সাপোর্টে কথা বলতে চাই।" />
    </main>
  );
}
