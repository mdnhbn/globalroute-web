"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import BackupRestorePanel from "@/components/backup/BackupRestorePanel";
import LocalStorageWarning from "@/components/backup/LocalStorageWarning";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import SessionNotice from "@/components/common/SessionNotice";
import { useLocale } from "@/components/common/LocaleProvider";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { clearSessionToken, useAccountSession } from "@/lib/account-session";
import { autoSaveVaultPartial, loadLocalVault, LocalVaultPayload } from "@/lib/local-db";

export default function DashboardPage() {
  const { t } = useLocale();
  const session = useAccountSession();
  if (session.state === "loading") return <SessionNotice message={t("session.checking")} />;
  if (session.state === "error") return <SessionNotice message={t("session.error")} showLogin />;
  if (session.state !== "authenticated") return <SessionNotice message={t("dashboard.signInRequired")} showLogin />;
  if (session.account.status === "pending_verification") {
    return <SessionNotice message={t("dashboard.agencyPending")} showLogin />;
  }
  if (session.account.status !== "active") {
    return <SessionNotice message={t("dashboard.unavailable")} showLogin />;
  }
  if (session.account.role === "admin") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin" className="text-sm font-semibold text-blue-700 underline">{t("dashboard.adminLink")}</Link>
      </main>
    );
  }

  return <DashboardVault key={session.account.id} role={session.account.role} />;
}

function DashboardVault({ role }: { role: "individual" | "agency" }) {
  const { t } = useLocale();
  const router = useRouter();
  const [vault, setVault] = useState<LocalVaultPayload | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [saveStateLabel, setSaveStateLabel] = useState<string>("");
  const autoBackupEnabled = vault?.autoBackupEnabled ?? false;

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
        if (active) setSaveStateLabel(t("dashboard.localError"));
      });

    return () => {
      active = false;
    };
  }, [t]);

  // হঠাৎ কারেন্ট বা ডিভাইস বন্ধ হলে ডাটা রক্ষার জন্য Auto-Save
  useEffect(() => {
    if (!autoBackupEnabled) return;
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
          setSaveStateLabel(t("dashboard.autoSaved"));
        })
        .catch(() => {
          setSaveStateLabel(t("dashboard.autoSaveError"));
        });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [noteText, autoBackupEnabled, t]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === "agency" ? t("dashboard.agency") : t("dashboard.individual")}
          </h1>
          <p className="text-xs text-slate-500">
            {saveStateLabel ? saveStateLabel : t("dashboard.localSync")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <LanguageSwitcher />
        </div>
      </div>

      {/* বড় ও স্পষ্ট সতর্কবার্তা */}
      <LocalStorageWarning variant={role} />

      {/* লোকাল Auto-Save ড্রাফট/প্রোফাইল নোট */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="local-draft-box" className="block text-sm font-bold text-slate-900">
          {t("dashboard.draftLabel")}
        </label>
        <p className="mt-1 text-xs text-slate-600">
          {t("dashboard.draftHelp")}
        </p>
        <textarea
          id="local-draft-box"
          rows={5}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t("dashboard.draftPlaceholder")}
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

      <WhatsAppButton defaultMessage={t("dashboard.whatsappMessage")} />
    </main>
  );
}
