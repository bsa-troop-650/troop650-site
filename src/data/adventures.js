// Shared event data + helpers, used by the home page and the gallery sub-pages.
// NOTE: this array is the temporary source of truth. Phase C replaces it with a
// Firestore read fed nightly from the troop Google Calendar (adventure-keyword
// whitelist), at which point this file keeps only the helpers.

export const ADVENTURES = [
  { type: "Hike",          name: "Trail Hike — 5 or 10 miles", start: "2026-06-27",                 place: "Route dropping soon" },
  { type: "Summer Camp",   name: "Summer Camp",                start: "2026-07-05", end: "2026-07-11", place: "Fiesta Island, San Diego", photo: "/events/fiesta-island.jpeg" },
  { type: "Campout",       name: "San Mateo Campout",          start: "2026-07-18", end: "2026-07-19", place: "San Mateo", photo: "/events/san-mateo.jpg" },
  { type: "Hike",          name: "Etiwanda Falls Hike",        start: "2026-08-22",                 place: "Etiwanda Falls", photo: "/events/etiwanda-falls.jpg" },
  { type: "Campout",       name: "Silverwood Lake Campout",    start: "2026-09-19", end: "2026-09-20", place: "Silverwood Lake", photo: "/events/silverwood-lake.jpg" },
  { type: "Family Campout",name: "San Gorgonio Family Campout",start: "2026-10-24", end: "2026-10-25", place: "San Gorgonio Campground", photo: "/events/san-gorgonio.png", focus: "50% 75%" },
  { type: "Campout",       name: "Rocketry Campout",           start: "2026-11-21", end: "2026-11-22", place: "Coyote Lake", photo: "/events/coyote-lake.jpg" },
  // Past adventures (feed the recaps rail + gallery pages).
  // TODO Jason: real names/dates/places for these three.
  { type: "Campout",         name: "Spring Campout",      start: "2026-04-01", end: "2026-04-02", place: "", photo: "/events/sillhouette.jpeg" },
  { type: "Service Project", name: "Service Project Day", start: "2026-05-01", end: "2026-05-02", place: "", photo: "/events/woodworking.png" },
  { type: "Campout",         name: "Cabin Campout",       start: "2026-06-01", end: "2026-06-02", place: "", photo: "/events/cabin.jpeg" },
];

export const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const parseLocal = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

// Stable URL slug for an event: "2026-07-18_san-mateo-campout".
// Phase C derives the same slug server-side, so gallery URLs survive the
// static -> Firestore switch.
export const slugFor = (a) =>
  `${a.start}_${a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export const findBySlug = (slug) => ADVENTURES.find((a) => slugFor(a) === slug);

export const fmtRange = (a) => {
  const s = parseLocal(a.start);
  const lbl = `${MON[s.getMonth()]} ${s.getDate()}`;
  if (!a.end) return lbl;
  const e = parseLocal(a.end);
  if (e.getMonth() === s.getMonth()) return `${lbl}–${e.getDate()}`;
  return `${lbl} – ${MON[e.getMonth()]} ${e.getDate()}`;
};
