import { getMatches } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /matches — mutual matches only, newest first. */
export async function GET() {
  try {
    const state = await getStore().read();
    return json({ matches: getMatches(state, state.currentUserId) });
  } catch (err) {
    return handleError(err);
  }
}
