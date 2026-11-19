export type UserId = string;

/** Full profile as stored. Only the fields in PublicProfile ever leave the server. */
export interface Profile {
  id: UserId;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string; // city or college
  interests: string[];
}

/** The shape the API exposes. Built by an explicit allow-list (see toPublicProfile). */
export type PublicProfile = Pick<Profile, "id" | "name" | "age" | "photo" | "bio" | "location" | "interests">;

export type SwipeAction = "like" | "pass";

export interface Swipe {
  from: UserId;
  to: UserId;
  action: SwipeAction;
  at: string; // ISO timestamp
}

export interface Match {
  /** Pair stored in sorted order so (a,b) and (b,a) are the same match. */
  users: [UserId, UserId];
  at: string;
}

export interface DbState {
  version: 1;
  currentUserId: UserId;
  profiles: Profile[];
  swipes: Swipe[];
  matches: Match[];
}
