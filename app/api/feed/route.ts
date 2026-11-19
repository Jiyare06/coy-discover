import { getFeed } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /feed — profiles the current user has not swiped on yet. */
export async function GET() {
  try {
    const state = await getStore().read();
    const profiles = getFeed(state, state.currentUserId);
    return json({ profiles, remaining: profiles.length });
  } catch (err) {
    return handleError(err);
  }
}
