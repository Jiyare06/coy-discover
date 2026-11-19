# Part A — Two core features for Coy

Coy's loop today: verify with phone OTP → verify your (college) email → add a crush into one of a limited number of slots → share the invite link so your crush can join → if they add you too, you both find out. Nobody finds out otherwise. Extra slots are a paid upgrade.

That loop is strong at one moment, the mutual reveal, and thin on either side of it. Both suggestions below target those gaps.

---

## 1. Private chat after a match, with a guided first message

**What it is**

When a mutual match happens, open an in-app 1:1 chat instead of ending the flow at "you matched."

- **Icebreaker prompts** ("What made you add me?", "Coffee or chai near campus?") so neither person has to write the awkward first line.
- **Phone numbers stay hidden by default.** People choose when to share contacts or socials.
- **Unmatch, block and report** from inside the chat. Unmatching removes the thread for both people without saying who left.
- **A soft nudge** if neither person has said anything within 48 hours.

**Why it's needed**

- **The match is the payoff, and right now it has nowhere to go.** Both people are nervous, and the next step is to message someone you know in real life, off-platform, about a crush. Many matches will stall there. A guided first message turns a reveal into a conversation.
- **Safety and privacy.** Taking the conversation to WhatsApp or Instagram reveals phone numbers and handles straight away. Coy's brand is discretion, so the first conversation should stay inside that same protected space.
- **Retention and growth.** Without chat, Coy is an app you open once and wait on. With chat, people come back daily. Every active conversation also makes Coy look worthwhile to friends who haven't joined, which feeds the invite loop.
- **Data to improve the product.** Knowing which matches turn into conversations tells you whether matching works. Today the funnel ends at the reveal and you can't see past it.

---

## 2. Crush slots that expire, with anti-probing protection

**What it is**

- Each crush slot lasts a fixed time, for example 30 days. Before it expires, the user gets a private reminder and can renew it with one tap or let it lapse. A lapsed slot frees up automatically.
- **A cooldown when you remove a crush.** If you remove someone, you can't add them back for a while, for example 7 days. The slot also doesn't free up right away.
- **Rate limits** on how often someone can add and remove crushes.

**Why it's needed**

- **It closes a privacy hole in mutual-crush apps.** With a limited number of slots and instant reveals, a curious user can add someone, see whether a match appears, remove them, and try the next person. That lets them quietly test whether people like them, which breaks Coy's core promise that you never learn who likes you unless it's mutual. Cooldowns and rate limits make this kind of probing slow and expensive while barely affecting genuine users.
- **It keeps slots honest and the data fresh.** Crushes change over a semester. Without expiry, slots fill up with old feelings, users feel stuck, and the "liked by" data you match against goes stale. Expiry plus a renewal reminder is a gentle prompt to reconsider, and it brings people back into the app.
- **It makes the paid tier fairer.** Free users get slots back over time instead of hitting a permanent wall, so the free product stays usable. Extra slots then become something people buy for convenience, not the only way out of a full list.

---

*Note: these suggestions are based on the onboarding flow the assignment describes (OTP, adding a crush, email verification, invite link, extra slots). Before submitting, walk through the live app yourself and adjust any details that don't match what you see.*
