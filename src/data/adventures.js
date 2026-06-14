// Date/slug helpers shared by the home page and sub-pages, plus a static
// fallback list used only when Firestore is empty or unreachable.
// The live source of truth is the `events` Firestore collection, synced
// nightly from the troop Google Calendar by pipeline/.

export const STATIC_FALLBACK = [
  { type: "Hike",          name: "Trail Hike — 5 or 10 miles", start: "2026-06-27",                 place: "Route dropping soon" },
  { type: "Summer Camp",   name: "Summer Camp",                start: "2026-07-05", end: "2026-07-11", place: "Fiesta Island, San Diego", photo: "/events/fiesta-island.jpeg" },
  { type: "Campout",       name: "San Mateo Campout",          start: "2026-07-18", end: "2026-07-19", place: "San Mateo", photo: "/events/san-mateo.jpg" },
  { type: "Hike",          name: "Etiwanda Falls Hike",        start: "2026-08-22",                 place: "Etiwanda Falls", photo: "/events/etiwanda-falls.jpg" },
  { type: "Campout",       name: "Silverwood Lake Campout",    start: "2026-09-19", end: "2026-09-20", place: "Silverwood Lake", photo: "/events/silverwood-lake.jpg" },
  { type: "Family Campout",name: "San Gorgonio Family Campout",start: "2026-10-24", end: "2026-10-25", place: "San Gorgonio Campground", photo: "/events/san-gorgonio.png", focus: "50% 75%" },
  { type: "Campout",       name: "Rocketry Campout",           start: "2026-11-21", end: "2026-11-22", place: "Coyote Lake", photo: "/events/coyote-lake.jpg" },
];

export const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const parseLocal = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

// Stable URL slug for an event: "2026-07-18_san-mateo-campout".
// Phase C derives the same slug server-side, so gallery URLs survive the
// static -> Firestore switch.
export const slugFor = (a) =>
  `${a.start}_${a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export const findBySlug = (events, slug) => events.find((a) => slugFor(a) === slug);

export const fmtRange = (a) => {
  const s = parseLocal(a.start);
  const lbl = `${MON[s.getMonth()]} ${s.getDate()}`;
  if (!a.end) return lbl;
  const e = parseLocal(a.end);
  if (e.getMonth() === s.getMonth()) return `${lbl}–${e.getDate()}`;
  return `${lbl} – ${MON[e.getMonth()]} ${e.getDate()}`;
};
