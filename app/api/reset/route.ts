import { handleError, json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** POST /api/reset — demo helper: restore the seeded state. Disabled in production. */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.COY_ALLOW_RESET !== "1") {
    return json({ error: { code: "forbidden", message: "Reset is disabled" } }, 403);
  }
  try {
    await getStore().reset();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
