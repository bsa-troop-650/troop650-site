// Shared events source: one Firestore fetch per page load, cached at module
// level so the home page and gallery pages share it. Falls back to the static
// seed list if Firestore is empty or unreachable (e.g. local dev offline).
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { STATIC_FALLBACK } from "./adventures";

let cache = null; // promise

async function load() {
  try {
    const snap = await getDocs(collection(db, "events"));
    if (snap.empty) return { events: STATIC_FALLBACK, source: "static" };
    const events = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        type: v.type || "Adventure",
        name: v.title,
        slug: v.slug,
        start: v.start,
        end: v.end || undefined,
        place: v.location || "",
        photo: v.coverUrl || undefined,
        focus: v.focus || undefined,
        photoCount: v.photoCount || 0,
      };
    });
    return { events, source: "firestore" };
  } catch (e) {
    console.warn("events: falling back to static list —", e?.message);
    return { events: STATIC_FALLBACK, source: "static" };
  }
}

export function useEvents() {
  const [state, setState] = useState({ events: [], source: "loading", loading: true });
  useEffect(() => {
    cache = cache || load();
    let on = true;
    cache.then((r) => on && setState({ ...r, loading: false }));
    return () => { on = false; };
  }, []);
  return state;
}
