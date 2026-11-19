import type { DbState, Match, Profile, PublicProfile, SwipeAction, UserId } from "./types";

/**
 * Core Discover logic: pure functions over DbState, no I/O.
 *
 * Privacy rule (Coy's core promise): nothing about who has liked the user may leak
 * unless the like is mutual. Concretely:
 *  1. Profiles are serialised through an explicit allow-list (toPublicProfile).
 *  2. Feed order is a function of (viewer, profile id) only, never of incoming likes,
 *     so admirers can't be inferred from where they sit in the stack.
 *  3. A swipe response is { matched: false } for a pass, and for a like that isn't
 *     reciprocated — identical whether or not the other person liked you.
 *  4. Incoming swipes are never returned by any function here.
 */

export class DiscoverError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function toPublicProfile(p: Profile): PublicProfile {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    photo: p.photo,
    bio: p.bio,
    location: p.location,
    interests: [...p.interests],
  };
}

/**
 * FNV-1a + murmur3 finaliser: small, deterministic string hash used for a stable
 * per-viewer shuffle. The finaliser matters — plain FNV barely mixes ids that differ
 * only in their last character, which left the deck almost in id order.
 */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Profiles the user has not swiped on yet, in a stable order that is independent of likes. */
export function getFeed(state: DbState, userId: UserId): PublicProfile[] {
  const swiped = new Set(state.swipes.filter((s) => s.from === userId).map((s) => s.to));
  return state.profiles
    .filter((p) => p.id !== userId && !swiped.has(p.id))
    .map((p) => ({ p, k: hash(`${userId}:${p.id}`) }))
    .sort((a, b) => a.k - b.k || a.p.id.localeCompare(b.p.id))
    .map(({ p }) => toPublicProfile(p));
}

export function parseSwipeInput(body: unknown): { targetId: string; action: SwipeAction } {
  if (!body || typeof body !== "object") throw new DiscoverError(400, "invalid_body", "Expected a JSON object");
  const { targetId, action } = body as Record<string, unknown>;
  if (typeof targetId !== "string" || targetId.length === 0 || targetId.length > 64) {
    throw new DiscoverError(400, "invalid_target", "targetId must be a non-empty string");
  }
  if (action !== "like" && action !== "pass") {
    throw new DiscoverError(400, "invalid_action", 'action must be "like" or "pass"');
  }
  return { targetId, action };
}

const pairKey = (a: UserId, b: UserId): [UserId, UserId] => (a < b ? [a, b] : [b, a]);

function findMatch(state: DbState, a: UserId, b: UserId): Match | undefined {
  const [x, y] = pairKey(a, b);
  return state.matches.find((m) => m.users[0] === x && m.users[1] === y);
}

export type SwipeResult = { matched: false } | { matched: true; profile: PublicProfile; matchedAt: string };

/**
 * Record a swipe. Mutates `state`.
 * Replaying the same swipe is idempotent (safe for client retries); changing a decision is a 409.
 */
export function recordSwipe(
  state: DbState,
  userId: UserId,
  targetId: string,
  action: SwipeAction,
  now: Date = new Date(),
): SwipeResult {
  if (targetId === userId) throw new DiscoverError(400, "self_swipe", "You can't swipe on yourself");
  const target = state.profiles.find((p) => p.id === targetId);
  if (!target) throw new DiscoverError(404, "not_found", "Profile not found");

  const existing = state.swipes.find((s) => s.from === userId && s.to === targetId);
  if (existing) {
    if (existing.action !== action) {
      throw new DiscoverError(409, "already_swiped", "You've already swiped on this profile");
    }
    const m = action === "like" ? findMatch(state, userId, targetId) : undefined;
    return m ? { matched: true, profile: toPublicProfile(target), matchedAt: m.at } : { matched: false };
  }

  const at = now.toISOString();
  state.swipes.push({ from: userId, to: targetId, action, at });

  if (action === "pass") return { matched: false };

  const likedBack = state.swipes.some((s) => s.from === targetId && s.to === userId && s.action === "like");
  if (!likedBack) return { matched: false };

  if (!findMatch(state, userId, targetId)) state.matches.push({ users: pairKey(userId, targetId), at });
  return { matched: true, profile: toPublicProfile(target), matchedAt: at };
}

export interface MatchView {
  profile: PublicProfile;
  matchedAt: string;
}

/** Mutual matches only, newest first. */
export function getMatches(state: DbState, userId: UserId): MatchView[] {
  const byId = new Map(state.profiles.map((p) => [p.id, p]));
  return state.matches
    .filter((m) => m.users.includes(userId))
    .map((m) => {
      const otherId = m.users[0] === userId ? m.users[1] : m.users[0];
      const other = byId.get(otherId);
      return other ? { profile: toPublicProfile(other), matchedAt: m.at } : null;
    })
    .filter((v): v is MatchView => v !== null)
    .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
}
