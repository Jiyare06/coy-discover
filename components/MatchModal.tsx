"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { PublicProfile } from "@/lib/types";
import Avatar from "./Avatar";
import { HeartIcon } from "./icons";

export default function MatchModal({
  profile,
  onKeepSwiping,
  onViewMatches,
}: {
  profile: PublicProfile;
  onKeepSwiping: () => void;
  onViewMatches: () => void;
}) {
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onKeepSwiping();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKeepSwiping]);

  return (
    <motion.div
      className="match-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      data-testid="match-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="match-body"
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <motion.div className="match-heart" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.15, duration: 0.5 }}>
          <HeartIcon size={40} />
        </motion.div>
        <h2 id="match-title">It&apos;s a match!</h2>
        <p>You and {profile.name} liked each other.</p>
        <div className="match-photos">
          <div className="match-me" aria-label="You">You</div>
          <Avatar src={profile.photo} name={profile.name} className="match-them" />
        </div>
        <button ref={primary} className="btn-primary light" onClick={onViewMatches}>
          View matches
        </button>
        <button className="btn-ghost" onClick={onKeepSwiping}>
          Keep swiping
        </button>
      </motion.div>
    </motion.div>
  );
}
