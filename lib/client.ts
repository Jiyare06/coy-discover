import type { PublicProfile, SwipeAction } from "./types";

export type SwipeResponse = { matched: false } | { matched: true; profile: PublicProfile; matchedAt: string };
export interface MatchItem {
  profile: PublicProfile;
  matchedAt: string;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "unknown", body?.error?.message ?? "Request failed");
  return body as T;
}

export const api = {
  feed: () => request<{ profiles: PublicProfile[] }>("/feed").then((b) => b.profiles),
  matches: () => request<{ matches: MatchItem[] }>("/matches").then((b) => b.matches),
  swipe: (targetId: string, action: SwipeAction) =>
    request<SwipeResponse>("/swipe", { method: "POST", body: JSON.stringify({ targetId, action }) }),
  reset: () => request<{ ok: true }>("/api/reset", { method: "POST" }),
};
