// Language: TypeScript (React/Next.js) | Target: Auto-Backup Toggle, Backup Export & Restore UI
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

import {
  autoSaveVaultPartial,
  exportVaultBackupFile,
  importVaultBackupFromFile,
  loadLocalVault,
  LocalVaultPayload,
} from "@/lib/local-db";

interface BackupRestorePanelProps {
  onVaultRestored?: (vault: LocalVaultPayload) => void;
}

export default function BackupRestorePanel({ onVaultRestored }: BackupRestorePanelProps) {
  const { t } = useLocale();
  const [vault, setVault] = useState<LocalVaultPayload | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    loadLocalVault()
      .then((data) => {
        if (active) setVault(data);
      })
      .catch(() => {
        if (active) setErrorMessage(t("backup.loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function handleToggleAutoBackup() {
    if (!vault) return;
    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const nextValue = !vault.autoBackupEnabled;
      const updated = await autoSaveVaultPartial((curr) => ({
        ...curr,
        autoBackupEnabled: nextValue,
      }));
      setVault(updated);
      setStatusMessage(
        nextValue
          ? t("backup.enabled")
          : t("backup.disabled")
      );
    } catch {
      setErrorMessage(t("backup.error"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExportBackup() {
    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const fileName = await exportVaultBackupFile();
      setStatusMessage(t("backup.downloaded", { fileName }));
    } catch {
      setErrorMessage(t("backup.downloadError"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const restored = await importVaultBackupFromFile(file);
      setVault(restored);
      if (onVaultRestored) {
        onVaultRestored(restored);
      }
      setStatusMessage(t("backup.restoreSuccess"));
    } catch {
      setErrorMessage(t("backup.restoreError"));
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {t("backup.title")}
          </h3>
          <p className="text-xs text-slate-600">
            {t("backup.description")}
          </p>
        </div>

        <button
          type="button"
          disabled={isBusy || !vault}
          onClick={handleToggleAutoBackup}
          className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
            vault?.autoBackupEnabled
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-600 hover:bg-slate-700"
          } disabled:opacity-50`}
        >
          Auto-Backup: {vault?.autoBackupEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={handleExportBackup}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("backup.download")}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          {t("backup.restore")}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileChange}
          className="hidden"
        />
      </div>

      {statusMessage ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
