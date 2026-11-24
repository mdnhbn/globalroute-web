// Language: TypeScript | Target: Next.js Frontend Local Device Storage (IndexedDB) & Backup/Restore
export interface LocalVaultPayload {
  version: number;
  exportedAt: string;
  autoBackupEnabled: boolean;
  profileData: Record<string, unknown>;
  documents: Array<{
    id: string;
    title: string;
    docType: string;
    fileName: string;
    mimeType: string;
    dataBase64: string;
    updatedAt: string;
  }>;
  agencyClients: Array<Record<string, unknown>>;
}

const DB_NAME = "GlobalRouteLocalVaultDB";
const DB_VERSION = 1;
const STORE_NAME = "vault_records";
const VAULT_KEY = "primary_user_vault";

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

export function getDefaultVaultPayload(): LocalVaultPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    autoBackupEnabled: true,
    profileData: {},
    documents: [],
    agencyClients: [],
  };
}

export async function loadLocalVault(): Promise<LocalVaultPayload> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(VAULT_KEY);

    req.onsuccess = () => {
      const value = req.result as LocalVaultPayload | undefined;
      if (!value) {
        resolve(getDefaultVaultPayload());
        return;
      }
      resolve({
        version: value.version ?? 1,
        exportedAt: value.exportedAt ?? new Date().toISOString(),
        autoBackupEnabled: typeof value.autoBackupEnabled === "boolean" ? value.autoBackupEnabled : true,
        profileData: value.profileData && typeof value.profileData === "object" ? value.profileData : {},
        documents: Array.isArray(value.documents) ? value.documents : [],
        agencyClients: Array.isArray(value.agencyClients) ? value.agencyClients : [],
      });
    };

    req.onerror = () => reject(req.error ?? new Error("Failed to read from IndexedDB."));
    tx.oncomplete = () => db.close();
  });
}

export async function saveLocalVault(payload: LocalVaultPayload): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const normalized: LocalVaultPayload = {
      ...payload,
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const req = store.put(normalized, VAULT_KEY);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("Failed to save to IndexedDB."));
    tx.oncomplete = () => db.close();
  });
}

export async function autoSaveVaultPartial(
  updater: (current: LocalVaultPayload) => LocalVaultPayload
): Promise<LocalVaultPayload> {
  const current = await loadLocalVault();
  const next = updater(current);
  await saveLocalVault(next);
  return next;
}

export async function exportVaultBackupFile(): Promise<string> {
  const vault = await loadLocalVault();
  const backupObject = {
    app: "GlobalRoute",
    backupType: "local-device-vault",
    createdAt: new Date().toISOString(),
    data: vault,
  };
  const jsonText = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `globalroute-backup-${stamp}.json`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return fileName;
}

export async function importVaultBackupFromFile(file: File): Promise<LocalVaultPayload> {
  const rawText = await file.text();
  const parsed = JSON.parse(rawText) as {
    app?: string;
    data?: Partial<LocalVaultPayload>;
  } & Partial<LocalVaultPayload>;

  const source = parsed && typeof parsed === "object" && parsed.data ? parsed.data : parsed;
  if (!source || typeof source !== "object") {
    throw new Error("Invalid backup file format.");
  }

  const restored: LocalVaultPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    autoBackupEnabled:
      typeof source.autoBackupEnabled === "boolean" ? source.autoBackupEnabled : true,
    profileData: source.profileData && typeof source.profileData === "object" ? source.profileData : {},
    documents: Array.isArray(source.documents) ? source.documents : [],
    agencyClients: Array.isArray(source.agencyClients) ? source.agencyClients : [],
  };

  await saveLocalVault(restored);
  return restored;
}
