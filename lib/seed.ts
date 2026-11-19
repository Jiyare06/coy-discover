import type { DbState, Profile, Swipe } from "./types";

export const CURRENT_USER_ID = "me";

type Row = [name: string, age: number, gender: "women" | "men", photoN: number, location: string, bio: string, interests: string[]];

// 32 mock profiles. Photos are placeholder portraits from randomuser.me;
// the UI falls back to an initials avatar if they fail to load.
const ROWS: Row[] = [
  ["Aanya", 21, "women", 12, "IIT Delhi", "Overthinks texts, underthinks playlists.", ["Indie music", "Chai", "Sketching"]],
  ["Rohan", 22, "men", 32, "BITS Pilani", "Will debate you about the best Maggi recipe.", ["Football", "Cooking", "Startups"]],
  ["Ishita", 20, "women", 44, "St. Stephen's College", "Library by day, open mics by night.", ["Poetry", "Theatre", "Coffee"]],
  ["Kabir", 23, "men", 11, "Bengaluru", "Weekend trekker, weekday debugger.", ["Trekking", "Photography", "Coding"]],
  ["Meera", 21, "women", 65, "Mumbai", "Looking for someone to split dessert with. I want the bigger half.", ["Baking", "Dance", "Travel"]],
  ["Arjun", 22, "men", 45, "NIT Trichy", "Guitar, gym, and too many group projects.", ["Guitar", "Fitness", "Anime"]],
  ["Zoya", 20, "women", 21, "Christ University", "Thrift store finds and sunset chasing.", ["Fashion", "Thrifting", "Film photography"]],
  ["Vihaan", 21, "men", 52, "Pune", "Part-time philosopher, full-time snack enthusiast.", ["Books", "Badminton", "Street food"]],
  ["Saanvi", 22, "women", 33, "IIM Ahmedabad", "Spreadsheets and spontaneity, somehow.", ["Finance", "Yoga", "Podcasts"]],
  ["Aditya", 24, "men", 8, "Hyderabad", "Can cook exactly three dishes, very well.", ["Cooking", "Cricket", "Gaming"]],
  ["Diya", 19, "women", 50, "Lady Shri Ram College", "Debate team captain. Yes, I'll win this argument too.", ["Debating", "Politics", "K-dramas"]],
  ["Reyansh", 23, "men", 67, "Chennai", "Beach runs at 6am. Not a morning person otherwise.", ["Running", "Surfing", "Jazz"]],
  ["Ananya", 21, "women", 17, "Jadavpur University", "Collects bookmarks, loses books.", ["Literature", "Art", "Cats"]],
  ["Ayaan", 20, "men", 23, "VIT Vellore", "Building a drone that delivers samosas.", ["Robotics", "Hackathons", "Food"]],
  ["Kiara", 22, "women", 28, "Delhi", "Plant parent to 14 and counting.", ["Gardening", "Pilates", "Sustainability"]],
  ["Dhruv", 21, "men", 76, "IIT Bombay", "Quizzing nerd, sitcom quote machine.", ["Quizzing", "Sitcoms", "Chess"]],
  ["Myra", 20, "women", 39, "Symbiosis Pune", "Will make you a playlist within a week of knowing you.", ["Music", "Concerts", "Journaling"]],
  ["Ishaan", 22, "men", 14, "Kolkata", "Old Hindi songs and new coffee shops.", ["Retro music", "Cafés", "Cycling"]],
  ["Navya", 23, "women", 56, "Bengaluru", "Product designer. I notice your font choices.", ["Design", "Bouldering", "Ceramics"]],
  ["Krish", 20, "men", 3, "Manipal", "Med student. Ask me about sleep (I have none).", ["Medicine", "Swimming", "Stand-up"]],
  ["Tara", 21, "women", 72, "Ashoka University", "Hot takes on movies, warm takes on people.", ["Cinema", "Writing", "Hiking"]],
  ["Advait", 24, "men", 61, "Gurugram", "Consultant by day, home barista by night.", ["Coffee", "Tennis", "Travel"]],
  ["Riya", 22, "women", 9, "Miranda House", "Classical dancer with a heavy metal playlist.", ["Kathak", "Metal", "Languages"]],
  ["Shaurya", 21, "men", 18, "DTU Delhi", "Formula 1 at 2am is a valid lifestyle.", ["F1", "Cars", "Coding"]],
  ["Pari", 20, "women", 81, "Jaipur", "Rooftop cafés, old havelis, new friends.", ["History", "Photography", "Travel"]],
  ["Atharv", 23, "men", 41, "IISc Bengaluru", "PhD in progress. Mostly progress on memes.", ["Research", "Memes", "Board games"]],
  ["Avni", 21, "women", 3, "NMIMS Mumbai", "Marine Drive walks fix everything.", ["Walking", "Marketing", "Bollywood"]],
  ["Vivaan", 22, "men", 85, "Ahmedabad", "Garba champion three years running.", ["Dance", "Food", "Entrepreneurship"]],
  ["Sara", 20, "women", 90, "Goa", "Sun, sand and second-hand novels.", ["Beaches", "Reading", "Scuba"]],
  ["Arnav", 21, "men", 29, "IIIT Hyderabad", "Competitive programmer. Will compete for your attention.", ["CP", "Basketball", "Lo-fi"]],
  ["Nisha", 23, "women", 47, "Chandigarh", "Road trips need a co-pilot with good snacks.", ["Road trips", "Punjabi music", "Fitness"]],
  ["Yash", 22, "men", 58, "Indore", "Foodie with a strict 'one more plate' policy.", ["Food", "Cricket", "Movies"]],
];

/** Profiles that have already liked the logged-in user, so matches can happen in a demo. */
export const SEEDED_ADMIRERS = ["p03", "p06", "p09", "p13", "p17", "p21", "p26", "p30"];

export function seedProfiles(): Profile[] {
  return ROWS.map(([name, age, gender, n, location, bio, interests], i) => ({
    id: `p${String(i + 1).padStart(2, "0")}`,
    name,
    age,
    photo: `https://randomuser.me/api/portraits/${gender}/${n}.jpg`,
    bio,
    location,
    interests,
  }));
}

export function seedState(now = new Date()): DbState {
  const at = now.toISOString();
  const swipes: Swipe[] = SEEDED_ADMIRERS.map((from) => ({ from, to: CURRENT_USER_ID, action: "like", at }));
  return { version: 1, currentUserId: CURRENT_USER_ID, profiles: seedProfiles(), swipes, matches: [] };
}
