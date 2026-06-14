import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Camera, ArrowLeft, MapPin, CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useEvents } from "../data/useEvents";
import { findBySlug, fmtRange } from "../data/adventures";

/* Per-event photo gallery. Thumbnails come from Firestore docs the nightly
   pipeline syncs out of the event's Google Drive folder; clicking opens a
   lightbox. Empty folders show the coming-soon state. */

export default function GalleryPage() {
  const { slug } = useParams();
  const { events, loading: eventsLoading } = useEvents();
  const event = findBySlug(events, slug);

  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightbox, setLightbox] = useState(-1); // index into photos, -1 closed

  useEffect(() => {
    if (!event?.id) { setPhotosLoading(false); return; }
    let on = true;
    getDocs(query(collection(db, "events", event.id, "photos"), orderBy("order")))
      .then((snap) => { if (on) { setPhotos(snap.docs.map((d) => d.data())); setPhotosLoading(false); } })
      .catch(() => on && setPhotosLoading(false));
    return () => { on = false; };
  }, [event?.id]);

  const step = useCallback((d) => setLightbox((i) => (i + d + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (lightbox < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(-1);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  return (
    <div className="gpage">
      <style>{CSS}</style>
      <header className="gp-bar">
        <Link to="/" className="gp-home"><ArrowLeft size={15} /> Troop 650</Link>
      </header>

      {eventsLoading ? (
        <main className="gp-main"><p className="gp-eyebrow">Gallery</p><p className="gp-lead">Loading…</p></main>
      ) : !event ? (
        <main className="gp-main">
          <p className="gp-eyebrow">Gallery</p>
          <h1>Hmm — no adventure here.</h1>
          <p className="gp-lead">This gallery doesn&rsquo;t exist (or the link is old). Head back and pick one from the recent adventures.</p>
          <Link to="/" className="gp-btn">Back to the site</Link>
        </main>
      ) : (
        <main className="gp-main">
          <p className="gp-eyebrow">{event.type}</p>
          <h1>{event.name}</h1>
          <p className="gp-meta">
            <span><CalendarDays size={14} /> {fmtRange(event)}</span>
            {event.place && <span><MapPin size={14} /> {event.place}</span>}
            {photos.length > 0 && <span><Camera size={14} /> {photos.length} photo{photos.length === 1 ? "" : "s"}</span>}
          </p>

          {photosLoading ? (
            <div className="gp-soon"><p>Loading photos…</p></div>
          ) : photos.length > 0 ? (
            <div className="gp-grid">
              {photos.map((p, i) => (
                <button className="gp-thumb" key={p.fileId || i} onClick={() => setLightbox(i)} aria-label={`Open photo ${i + 1}`}>
                  <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ objectPosition: p.focus || "center" }} />
                </button>
              ))}
            </div>
          ) : (
            <div className="gp-soon">
              <Camera size={22} />
              <p><strong>Photos from this adventure are on the way.</strong></p>
              <p>Our youth webmaster loads each adventure&rsquo;s photos after the trip — check back soon.</p>
            </div>
          )}
        </main>
      )}

      {lightbox >= 0 && photos[lightbox] && (
        <div className="gp-lb" onClick={() => setLightbox(-1)}>
          <img src={photos[lightbox].url} alt="" onClick={(e) => e.stopPropagation()} />
          <button className="gp-lb-x" onClick={() => setLightbox(-1)} aria-label="Close"><X size={22} /></button>
          {photos.length > 1 && (
            <>
              <button className="gp-lb-nav gp-lb-l" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous"><ChevronLeft size={26} /></button>
              <button className="gp-lb-nav gp-lb-r" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next"><ChevronRight size={26} /></button>
              <span className="gp-lb-count">{lightbox + 1} / {photos.length}</span>
            </>
          )}
        </div>
      )}

      <footer className="gp-foot">© 2026 Troop 650 · 650rc.com</footer>
    </div>
  );
}

const CSS = `
.gpage{min-height:100vh;background:#1e3d2c;color:#f4eddc;font-family:'Hanken Grotesk',system-ui,sans-serif;display:flex;flex-direction:column}
.gp-bar{padding:1rem 1.4rem;border-bottom:1px solid rgba(244,237,220,.12)}
.gp-home{display:inline-flex;align-items:center;gap:.45rem;color:#f4eddc;text-decoration:none;font-family:'Space Mono',monospace;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase}
.gp-home:hover{color:#e7a53e}
.gp-main{flex:1;width:min(960px,92%);margin:0 auto;padding:2.6rem 0 3rem}
.gp-eyebrow{font-family:'Space Mono',monospace;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#e7a53e;margin:0 0 .5rem}
.gp-main h1{font-family:'Fraunces',serif;font-size:clamp(1.7rem,4.5vw,2.6rem);line-height:1.12;margin:0 0 .7rem}
.gp-lead{color:rgba(244,237,220,.8);line-height:1.6;max-width:48ch}
.gp-meta{display:flex;flex-wrap:wrap;gap:1.1rem;font-family:'Space Mono',monospace;font-size:.74rem;color:rgba(244,237,220,.75);margin:0 0 1.6rem}
.gp-meta span{display:inline-flex;align-items:center;gap:.4rem}
.gp-meta svg{color:#e7a53e}
.gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.7rem}
.gp-thumb{position:relative;aspect-ratio:1;border:none;border-radius:10px;overflow:hidden;padding:0;cursor:pointer;background:#16311f}
.gp-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}
.gp-thumb:hover img{transform:scale(1.05)}
.gp-soon{border:1.5px dashed rgba(244,237,220,.3);border-radius:10px;padding:2.2rem 1.4rem;text-align:center;color:rgba(244,237,220,.78);line-height:1.55}
.gp-soon svg{color:#e7a53e;margin-bottom:.5rem}
.gp-soon p{margin:.2rem 0;max-width:46ch;margin-inline:auto}
.gp-btn{display:inline-block;margin-top:1.2rem;background:#e7a53e;color:#1e3d2c;font-weight:700;text-decoration:none;padding:.65rem 1.2rem;border-radius:7px}
.gp-foot{padding:1.1rem;text-align:center;font-family:'Space Mono',monospace;font-size:.68rem;color:rgba(244,237,220,.45);border-top:1px solid rgba(244,237,220,.12)}
.gp-lb{position:fixed;inset:0;background:rgba(8,16,11,.94);display:flex;align-items:center;justify-content:center;z-index:60}
.gp-lb img{max-width:92vw;max-height:88vh;border-radius:8px}
.gp-lb-x{position:fixed;top:14px;right:14px;background:none;border:none;color:#f4eddc;cursor:pointer}
.gp-lb-nav{position:fixed;top:50%;transform:translateY(-50%);background:rgba(244,237,220,.12);border:none;color:#f4eddc;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gp-lb-nav:hover{background:#e7a53e;color:#1e3d2c}
.gp-lb-l{left:12px}.gp-lb-r{right:12px}
.gp-lb-count{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);font-family:'Space Mono',monospace;font-size:.72rem;color:rgba(244,237,220,.75)}
@media (max-width:560px){.gp-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}}
`;
