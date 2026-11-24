"use client";

import { useEffect, useState } from "react";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");

export type AccountRole = "individual" | "agency" | "admin";
export type AccountStatus = "active" | "pending_verification" | "rejected" | "suspended";

interface Account {
  id: number;
  role: AccountRole;
  status: AccountStatus;
}

type AccountSession =
  | { state: "loading" | "signed-out" | "error" }
  | { state: "authenticated"; account: Account; token: string };

const TOKEN_KEY = "globalroute_token";

export function saveSessionToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem("globalroute_role");
  window.localStorage.removeItem("globalroute_status");
}

export function clearSessionToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

async function readSession(signal: AbortSignal): Promise<AccountSession> {
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  if (!token) return { state: "signed-out" };

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  if (response.status === 401 || response.status === 403) {
    if (window.sessionStorage.getItem(TOKEN_KEY) === token) clearSessionToken();
    return { state: "signed-out" };
  }
  if (!response.ok) throw new Error("Could not verify session");

  const account: Account = await response.json();
  return { state: "authenticated", account, token };
}

export function useAccountSession() {
  const [session, setSession] = useState<AccountSession>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    readSession(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSession(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSession({ state: "error" });
      });
    return () => controller.abort();
  }, []);

  return session;
}
