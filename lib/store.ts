import { promises as fs } from "node:fs";
import path from "node:path";
import type { DbState } from "./types";
import { seedState } from "./seed";

/**
 * Tiny JSON-file store.
 *  - Reads lazily seed the file on first use.
 *  - Writes go to a temp file then rename(), so a crash mid-write never leaves a half-written DB.
 *  - All mutations run through a single in-process queue, so two concurrent swipes can't
 *    read the same state and overwrite each other (lost update).
 */
export class JsonStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  async read(): Promise<DbState> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as DbState;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      const fresh = seedState();
      await this.write(fresh);
      return fresh;
    }
  }

  /** Run fn against the current state; whatever state it leaves is persisted atomically. */
  mutate<T>(fn: (state: DbState) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const state = await this.read();
      const result = fn(state);
      await this.write(state);
      return result;
    });
    // Keep the queue alive even if this mutation throws.
    this.queue = run.catch(() => undefined);
    return run;
  }

  async reset(): Promise<DbState> {
    const fresh = seedState();
    await this.mutate((s) => Object.assign(s, fresh));
    return fresh;
  }

  private async write(state: DbState): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2));
    await fs.rename(tmp, this.file);
  }
}

const DEFAULT_PATH = path.join(process.cwd(), "data", "db.json");

// One store per process (survives Next.js dev hot reloads via globalThis).
const g = globalThis as unknown as { __coyStore?: JsonStore };
export function getStore(): JsonStore {
  if (!g.__coyStore) g.__coyStore = new JsonStore(process.env.COY_DB_PATH || DEFAULT_PATH);
  return g.__coyStore;
}
