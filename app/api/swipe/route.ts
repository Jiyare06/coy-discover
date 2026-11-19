import { DiscoverError, parseSwipeInput, recordSwipe } from "@/lib/discover";
import { handleError, json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * POST /swipe  { targetId: string, action: "like" | "pass" }
 * → { matched: false } | { matched: true, profile, matchedAt }
 */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new DiscoverError(400, "invalid_json", "Body must be valid JSON");
    }
    const { targetId, action } = parseSwipeInput(body);
    const result = await getStore().mutate((state) => recordSwipe(state, state.currentUserId, targetId, action));
    return json(result);
  } catch (err) {
    return handleError(err);
  }
}
