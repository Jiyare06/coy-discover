"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import Avatar from "./Avatar";
import { PinIcon } from "./icons";

export interface SwipeCardHandle {
  swipe: (action: SwipeAction) => void;
}

interface Props {
  profile: PublicProfile;
  onSwiped: (action: SwipeAction) => void;
}

const DISTANCE_THRESHOLD = 110; // px
const VELOCITY_THRESHOLD = 600; // px/s — a quick flick counts even if short

const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard({ profile, onSwiped }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, DISTANCE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-DISTANCE_THRESHOLD, -20], [1, 0]);
  const leaving = useRef(false);

  const flyOut = (action: SwipeAction) => {
    if (leaving.current) return;
    leaving.current = true;
    const dir = action === "like" ? 1 : -1;
    const width = typeof window === "undefined" ? 500 : window.innerWidth;
    animate(x, dir * (width + 200), { type: "tween", duration: 0.32, ease: "easeIn" }).then(() => onSwiped(action));
  };

  useImperativeHandle(ref, () => ({ swipe: flyOut }));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > DISTANCE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) flyOut("like");
    else if (offset.x < -DISTANCE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) flyOut("pass");
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  return (
    <motion.article
      className="card"
      style={{ x, rotate }}
      drag="x"
      dragMomentum={false}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.95, y: 8, opacity: 0.6 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileTap={{ cursor: "grabbing" }}
      aria-label={`${profile.name}, ${profile.age}`}
      data-testid="top-card"
    >
      <Avatar src={profile.photo} name={profile.name} className="card-photo" />
      <motion.div className="stamp stamp-like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
      <motion.div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>
      <div className="card-info">
        <h2>
          {profile.name} <span className="age">{profile.age}</span>
        </h2>
        <p className="location">
          <PinIcon /> {profile.location}
        </p>
        <p className="bio">{profile.bio}</p>
        <ul className="chips">
          {profile.interests.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
});

export default SwipeCard;

/** Static preview of the next card, sitting behind the active one. */
export function PeekCard({ profile }: { profile: PublicProfile }) {
  return (
    <div className="card card-peek" aria-hidden>
      <Avatar src={profile.photo} name={profile.name} className="card-photo" />
      <div className="card-info">
        <h2>
          {profile.name} <span className="age">{profile.age}</span>
        </h2>
      </div>
    </div>
  );
}
