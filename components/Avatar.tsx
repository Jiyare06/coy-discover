"use client";

import { useState } from "react";

const GRADIENTS = [
  ["#ff7aa8", "#ffb17a"],
  ["#7a8cff", "#c77aff"],
  ["#3cc8b4", "#7ad0ff"],
  ["#ff8a7a", "#ffd07a"],
  ["#b07aff", "#ff7ad9"],
];

/** Photo with a graceful initials fallback if the placeholder image can't load. */
export default function Avatar({ src, name, className }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const [a, b] = GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
    return (
      <div className={`avatar-fallback ${className ?? ""}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} role="img" aria-label={name}>
        {name.slice(0, 1)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} className={className} draggable={false} onError={() => setFailed(true)} />;
}
