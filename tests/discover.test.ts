import { describe, expect, it } from "vitest";
import { DiscoverError, getFeed, getMatches, parseSwipeInput, recordSwipe } from "@/lib/discover";
import { CURRENT_USER_ID as ME, SEEDED_ADMIRERS, seedState } from "@/lib/seed";

const ADMIRER = SEEDED_ADMIRERS[0];
const fresh = () => seedState(new Date("2026-01-01T00:00:00Z"));
const nonAdmirer = (s = fresh()) => s.profiles.find((p) => !SEEDED_ADMIRERS.includes(p.id))!.id;

describe("seed data", () => {
  it("has at least 30 complete profiles", () => {
    const s = fresh();
    expect(s.profiles.length).toBeGreaterThanOrEqual(30);
    for (const p of s.profiles) {
      expect(p.name && p.photo && p.bio && p.location).toBeTruthy();
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.interests.length).toBeGreaterThan(0);
    }
    expect(new Set(s.profiles.map((p) => p.id)).size).toBe(s.profiles.length);
  });

  it("includes some profiles that already liked the user", () => {
    const s = fresh();
    const incoming = s.swipes.filter((x) => x.to === ME && x.action === "like");
    expect(incoming.length).toBeGreaterThan(0);
    expect(s.matches).toHaveLength(0);
  });
});

describe("getFeed", () => {
  it("returns every profile before any swipes", () => {
    const s = fresh();
    expect(getFeed(s, ME)).toHaveLength(s.profiles.length);
  });

  it("never returns a profile the user has swiped on (like or pass)", () => {
    const s = fresh();
    const [a, b] = getFeed(s, ME);
    recordSwipe(s, ME, a.id, "like");
    recordSwipe(s, ME, b.id, "pass");
    const ids = getFeed(s, ME).map((p) => p.id);
    expect(ids).not.toContain(a.id);
    expect(ids).not.toContain(b.id);
    expect(ids).toHaveLength(s.profiles.length - 2);
  });

  it("is empty once everything has been swiped", () => {
    const s = fresh();
    for (const p of getFeed(s, ME)) recordSwipe(s, ME, p.id, "pass");
    expect(getFeed(s, ME)).toEqual([]);
  });

  it("has a stable order across calls (cards don't reshuffle on reload)", () => {
    const s = fresh();
    expect(getFeed(s, ME).map((p) => p.id)).toEqual(getFeed(s, ME).map((p) => p.id));
  });

  it("ignores other users' swipes when filtering", () => {
    const s = fresh();
    const target = nonAdmirer(s);
    s.swipes.push({ from: "p02", to: target, action: "pass", at: "2026-01-01T00:00:00Z" });
    expect(getFeed(s, ME).map((p) => p.id)).toContain(target);
  });
});

describe("recordSwipe / matching", () => {
  it("creates a match when liking someone who already liked the user", () => {
    const s = fresh();
    const res = recordSwipe(s, ME, ADMIRER, "like");
    expect(res.matched).toBe(true);
    if (res.matched) expect(res.profile.id).toBe(ADMIRER);
    expect(getMatches(s, ME).map((m) => m.profile.id)).toEqual([ADMIRER]);
  });

  it("does not match on a one-sided like", () => {
    const s = fresh();
    expect(recordSwipe(s, ME, nonAdmirer(s), "like")).toEqual({ matched: false });
    expect(getMatches(s, ME)).toEqual([]);
  });

  it("does not match when passing on an admirer", () => {
    const s = fresh();
    expect(recordSwipe(s, ME, ADMIRER, "pass")).toEqual({ matched: false });
    expect(getMatches(s, ME)).toEqual([]);
  });

  it("is symmetric when both sides are real profiles", () => {
    const s = fresh();
    const [a, b] = ["p01", "p02"];
    expect(recordSwipe(s, a, b, "like").matched).toBe(false);
    expect(recordSwipe(s, b, a, "like").matched).toBe(true);
    expect(getMatches(s, a).map((m) => m.profile.id)).toEqual([b]);
    expect(getMatches(s, b).map((m) => m.profile.id)).toEqual([a]);
    expect(s.matches).toHaveLength(1);
  });

  it("is idempotent for a repeated identical swipe and never duplicates a match", () => {
    const s = fresh();
    const first = recordSwipe(s, ME, ADMIRER, "like");
    const again = recordSwipe(s, ME, ADMIRER, "like");
    expect(again).toEqual(first);
    expect(s.matches).toHaveLength(1);
    expect(s.swipes.filter((x) => x.from === ME)).toHaveLength(1);
    expect(recordSwipe(s, ME, "p02", "pass")).toEqual(recordSwipe(s, ME, "p02", "pass"));
  });

  it("rejects changing a decision with 409", () => {
    const s = fresh();
    recordSwipe(s, ME, ADMIRER, "pass");
    expect(() => recordSwipe(s, ME, ADMIRER, "like")).toThrowError(
      expect.objectContaining({ status: 409, code: "already_swiped" }),
    );
    expect(getMatches(s, ME)).toEqual([]);
  });

  it("rejects unknown profiles and self-swipes", () => {
    const s = fresh();
    expect(() => recordSwipe(s, ME, "nope", "like")).toThrowError(expect.objectContaining({ status: 404 }));
    expect(() => recordSwipe(s, "p01", "p01", "like")).toThrowError(expect.objectContaining({ status: 400 }));
  });
});

describe("privacy: never reveal who liked the user unless mutual", () => {
  it("feed items expose only public fields — no like/admirer hints", () => {
    const s = fresh();
    const allowed = ["age", "bio", "id", "interests", "location", "name", "photo"];
    for (const p of getFeed(s, ME)) expect(Object.keys(p).sort()).toEqual(allowed);
    expect(JSON.stringify(getFeed(s, ME))).not.toMatch(/like|admir|swipe/i);
  });

  it("feed order does not depend on who liked the user", () => {
    const withLikes = fresh();
    const withoutLikes = fresh();
    withoutLikes.swipes = [];
    const other = fresh();
    other.swipes = other.profiles
      .filter((p) => !SEEDED_ADMIRERS.includes(p.id))
      .map((p) => ({ from: p.id, to: ME, action: "like" as const, at: "2026-01-01T00:00:00Z" }));

    const order = (st: typeof withLikes) => getFeed(st, ME).map((p) => p.id);
    expect(order(withLikes)).toEqual(order(withoutLikes));
    expect(order(withLikes)).toEqual(order(other));
  });

  it("admirers are not clustered at the front of the deck", () => {
    const ids = getFeed(fresh(), ME).map((p) => p.id);
    const firstN = ids.slice(0, SEEDED_ADMIRERS.length);
    expect(firstN.every((id) => SEEDED_ADMIRERS.includes(id))).toBe(false);
  });

  it("a pass response is identical for admirers and non-admirers", () => {
    const s = fresh();
    expect(recordSwipe(s, ME, ADMIRER, "pass")).toEqual(recordSwipe(s, ME, nonAdmirer(s), "pass"));
  });

  it("an unreciprocated like looks the same regardless of the other person's pass/no-action", () => {
    const s = fresh();
    const passer = nonAdmirer(s);
    s.swipes.push({ from: passer, to: ME, action: "pass", at: "2026-01-01T00:00:00Z" });
    const silent = s.profiles.find((p) => p.id !== passer && !SEEDED_ADMIRERS.includes(p.id))!.id;
    expect(recordSwipe(s, ME, passer, "like")).toEqual(recordSwipe(s, ME, silent, "like"));
  });

  it("the 409 for a changed decision is the same for admirers and non-admirers", () => {
    const s = fresh();
    const t = nonAdmirer(s);
    recordSwipe(s, ME, ADMIRER, "pass");
    recordSwipe(s, ME, t, "pass");
    const err = (id: string) => {
      try {
        recordSwipe(s, ME, id, "like");
      } catch (e) {
        return { status: (e as DiscoverError).status, code: (e as DiscoverError).code, msg: (e as Error).message };
      }
    };
    expect(err(ADMIRER)).toEqual(err(t));
  });

  it("matches only ever contain mutual likes", () => {
    const s = fresh();
    for (const p of getFeed(s, ME)) recordSwipe(s, ME, p.id, "like");
    expect(getMatches(s, ME).map((m) => m.profile.id).sort()).toEqual([...SEEDED_ADMIRERS].sort());
  });
});

describe("parseSwipeInput", () => {
  it("accepts valid input", () => {
    expect(parseSwipeInput({ targetId: "p01", action: "like" })).toEqual({ targetId: "p01", action: "like" });
  });
  it.each([null, "x", {}, { targetId: "p01" }, { targetId: "", action: "like" }, { targetId: "p01", action: "superlike" }, { targetId: 5, action: "like" }])(
    "rejects %j",
    (body) => {
      expect(() => parseSwipeInput(body)).toThrowError(expect.objectContaining({ status: 400 }));
    },
  );
});

describe("feed shuffle quality", () => {
  it("is not simply id order (forwards or backwards)", () => {
    const s = fresh();
    const ids = getFeed(s, ME).map((p) => p.id);
    const sorted = [...ids].sort();
    expect(ids).not.toEqual(sorted);
    expect(ids).not.toEqual([...sorted].reverse());
    // Count adjacent pairs whose ids are consecutive — a well-mixed deck has few.
    const num = (id: string) => Number(id.slice(1));
    const adjacent = ids.slice(1).filter((id, i) => Math.abs(num(id) - num(ids[i])) === 1).length;
    expect(adjacent).toBeLessThan(8);
  });
});
