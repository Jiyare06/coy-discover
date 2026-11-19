"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError, type MatchItem } from "@/lib/client";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import SwipeCard, { PeekCard, type SwipeCardHandle } from "./SwipeCard";
import MatchModal from "./MatchModal";
import Matches from "./Matches";
import { HeartIcon, XIcon } from "./icons";

type View = "swipe" | "matches";
type Toast = { id: number; text: string; kind: "like" | "pass" | "error" };

export default function Discover() {
  const [view, setView] = useState<View>("swipe");
  const [deck, setDeck] = useState<PublicProfile[] | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [newMatch, setNewMatch] = useState<PublicProfile | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  const showToast = useCallback((text: string, kind: Toast["kind"]) => {
    const id = Date.now();
    setToast({ id, text, kind });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 1400);
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [feed, m] = await Promise.all([api.feed(), api.matches()]);
      setDeck(feed);
      setMatches(m);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top = deck?.[0];

  // Called after the card's fly-out animation finishes.
  const handleSwiped = useCallback(
    async (action: SwipeAction) => {
      if (!top) return;
      setDeck((d) => (d ? d.slice(1) : d)); // optimistic: the card is already off-screen
      try {
        const res = await api.swipe(top.id, action);
        if (res.matched) {
          setMatches((m) => [{ profile: res.profile, matchedAt: res.matchedAt }, ...m.filter((x) => x.profile.id !== res.profile.id)]);
          setNewMatch(res.profile);
        } else {
          showToast(action === "like" ? `You liked ${top.name}` : `Passed on ${top.name}`, action);
        }
      } catch (err) {
        if (err instanceof ApiError && err.code === "already_swiped") return; // server already has it; keep it gone
        setDeck((d) => (d ? [top, ...d] : [top])); // put the card back
        showToast("Couldn't save that swipe — try again", "error");
      }
    },
    [top, showToast],
  );

  // Arrow keys on desktop.
  useEffect(() => {
    if (view !== "swipe" || newMatch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") cardRef.current?.swipe("like");
      if (e.key === "ArrowLeft") cardRef.current?.swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, newMatch]);

  const resetDemo = async () => {
    await api.reset().catch(() => undefined);
    setDeck(null);
    await load();
  };

  return (
    <section className="discover" aria-label="Discover">
      <header className="discover-header">
        <h1 className="brand">coy</h1>
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={view === "swipe"} className={view === "swipe" ? "on" : ""} onClick={() => setView("swipe")}>
            Discover
          </button>
          <button role="tab" aria-selected={view === "matches"} className={view === "matches" ? "on" : ""} onClick={() => setView("matches")}>
            Matches{matches.length > 0 && <span className="badge">{matches.length}</span>}
          </button>
        </div>
      </header>

      {view === "matches" ? (
        <Matches matches={matches} onDiscover={() => setView("swipe")} />
      ) : (
        <>
          <div className="deck">
            {loadError ? (
              <div className="empty">
                <p className="empty-title">Couldn&apos;t load profiles</p>
                <button className="btn-primary" onClick={load}>Retry</button>
              </div>
            ) : deck === null ? (
              <div className="card skeleton" aria-busy="true" aria-label="Loading" />
            ) : top ? (
              <>
                {deck[1] && <PeekCard key={`peek-${deck[1].id}`} profile={deck[1]} />}
                <SwipeCard key={top.id} ref={cardRef} profile={top} onSwiped={handleSwiped} />
              </>
            ) : (
              <div className="empty" data-testid="empty-state">
                <div className="empty-emoji" aria-hidden>✨</div>
                <p className="empty-title">You&apos;re all caught up</p>
                <p className="empty-sub">No new profiles right now. Check back later — or see who you matched with.</p>
                <button className="btn-primary" onClick={() => setView("matches")}>View matches</button>
                <button className="btn-link" onClick={resetDemo}>Reset demo data</button>
              </div>
            )}
          </div>

          <div className="actions" aria-hidden={!top}>
            <button className="action pass" aria-label="Pass" disabled={!top} onClick={() => cardRef.current?.swipe("pass")}>
              <XIcon />
            </button>
            <button className="action like" aria-label="Like" disabled={!top} onClick={() => cardRef.current?.swipe("like")}>
              <HeartIcon />
            </button>
          </div>
          {top && <p className="hint">Drag the card, tap the buttons, or use ← → keys</p>}
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newMatch && (
          <MatchModal
            profile={newMatch}
            onKeepSwiping={() => setNewMatch(null)}
            onViewMatches={() => {
              setNewMatch(null);
              setView("matches");
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
