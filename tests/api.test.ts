import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SEEDED_ADMIRERS } from "@/lib/seed";

// Point the store at a throwaway file before the route modules load it.
const dir = mkdtempSync(path.join(tmpdir(), "coy-"));
const dbFile = path.join(dir, "db.json");
process.env.COY_DB_PATH = dbFile;

const { GET: feed } = await import("@/app/api/feed/route");
const { POST: swipe } = await import("@/app/api/swipe/route");
const { GET: matches } = await import("@/app/api/matches/route");
const { getStore, JsonStore } = await import("@/lib/store");

const post = (body: unknown) =>
  swipe(new Request("http://x/swipe", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

beforeEach(async () => {
  await getStore().reset();
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("API routes", () => {
  it("GET /feed returns unswiped profiles with no-store caching", async () => {
    const res = await feed();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.profiles.length).toBeGreaterThanOrEqual(30);
    expect(body.remaining).toBe(body.profiles.length);
  });

  it("POST /swipe like on an admirer returns a match; GET /matches lists it", async () => {
    const res = await post({ targetId: SEEDED_ADMIRERS[0], action: "like" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.profile.id).toBe(SEEDED_ADMIRERS[0]);

    const m = await (await matches()).json();
    expect(m.matches.map((x: { profile: { id: string } }) => x.profile.id)).toEqual([SEEDED_ADMIRERS[0]]);
  });

  it("swipes persist to disk and drop out of the feed", async () => {
    await post({ targetId: "p01", action: "pass" });
    const onDisk = JSON.parse(readFileSync(dbFile, "utf8"));
    expect(onDisk.swipes.some((s: { from: string; to: string }) => s.from === "me" && s.to === "p01")).toBe(true);

    // A brand-new store instance (≈ server restart / page reload) sees the same state.
    const reopened = new JsonStore(dbFile);
    const st = await reopened.read();
    expect(st.swipes.some((s) => s.from === "me" && s.to === "p01")).toBe(true);
    const ids = (await (await feed()).json()).profiles.map((p: { id: string }) => p.id);
    expect(ids).not.toContain("p01");
  });

  it("returns proper error codes", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post({ targetId: "p01", action: "superlike" })).status).toBe(400);
    expect((await post({ targetId: "ghost", action: "like" })).status).toBe(404);
    await post({ targetId: "p01", action: "pass" });
    const conflict = await post({ targetId: "p01", action: "like" });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error.code).toBe("already_swiped");
  });

  it("concurrent swipes are all persisted (no lost updates)", async () => {
    const ids = (await (await feed()).json()).profiles.slice(0, 10).map((p: { id: string }) => p.id);
    await Promise.all(ids.map((id: string) => post({ targetId: id, action: "pass" })));
    const st = await new JsonStore(dbFile).read();
    expect(st.swipes.filter((s) => s.from === "me")).toHaveLength(10);
  });

  it("concurrent duplicate likes create exactly one match", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => post({ targetId: SEEDED_ADMIRERS[1], action: "like" }).then((r) => r.json())),
    );
    expect(results.every((r) => r.matched)).toBe(true);
    const st = await new JsonStore(dbFile).read();
    expect(st.matches).toHaveLength(1);
  });

  it("no endpoint response mentions incoming likes", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const bodies = [
      await (await feed()).text(),
      await (await post({ targetId: "p01", action: "like" })).text(),
      await (await matches()).text(),
    ];
    for (const b of bodies) expect(b).not.toMatch(/admir|likedYou|likesYou|swipes/i);
    spy.mockRestore();
  });
});
