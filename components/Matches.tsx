"use client";

import type { MatchItem } from "@/lib/client";
import Avatar from "./Avatar";

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Matches({ matches, onDiscover }: { matches: MatchItem[]; onDiscover: () => void }) {
  if (matches.length === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji" aria-hidden>💌</div>
        <p className="empty-title">No matches yet</p>
        <p className="empty-sub">When someone you like likes you back, they&apos;ll show up here. Nobody sees your likes unless it&apos;s mutual.</p>
        <button className="btn-primary" onClick={onDiscover}>Start discovering</button>
      </div>
    );
  }
  return (
    <ul className="matches" data-testid="matches-list">
      {matches.map(({ profile, matchedAt }) => (
        <li key={profile.id} className="match-row">
          <Avatar src={profile.photo} name={profile.name} className="match-avatar" />
          <div className="match-meta">
            <p className="match-name">
              {profile.name}, {profile.age}
            </p>
            <p className="match-sub">{profile.location}</p>
          </div>
          <span className="match-time">{ago(matchedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
