import React from "react";
import { useParams, Link } from "react-router-dom";
import { Camera, ArrowLeft, MapPin, CalendarDays } from "lucide-react";
import { findBySlug, fmtRange } from "../data/adventures";

/* Per-event photo gallery page.
   Today: shows event details + the cover photo (if any) + a coming-soon state.
   Phase C: the thumbnail grid populates automatically from Firestore docs
   synced nightly out of the event's Google Drive folder. */

export default function GalleryPage() {
  const { slug } = useParams();
  const event = findBySlug(slug);

  return (
    <div className="gpage">
      <style>{CSS}</style>
      <header className="gp-bar">
        <Link to="/" className="gp-home"><ArrowLeft size={15} /> Troop 650</Link>
      </header>

      {!event ? (
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
          </p>

          {event.photo && (
            <div className="gp-cover">
              <img src={event.photo} alt={event.place || event.name} style={{ objectPosition: event.focus || "center" }} />
            </div>
          )}

          <div className="gp-soon">
            <Camera size={22} />
            <p><strong>Photos from this adventure are on the way.</strong></p>
            <p>Our youth webmaster loads each adventure&rsquo;s photos after the trip — check back soon.</p>
          </div>
        </main>
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
.gp-main{flex:1;width:min(820px,92%);margin:0 auto;padding:2.6rem 0 3rem}
.gp-eyebrow{font-family:'Space Mono',monospace;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#e7a53e;margin:0 0 .5rem}
.gp-main h1{font-family:'Fraunces',serif;font-size:clamp(1.7rem,4.5vw,2.6rem);line-height:1.12;margin:0 0 .7rem}
.gp-lead{color:rgba(244,237,220,.8);line-height:1.6;max-width:48ch}
.gp-meta{display:flex;flex-wrap:wrap;gap:1.1rem;font-family:'Space Mono',monospace;font-size:.74rem;color:rgba(244,237,220,.75);margin:0 0 1.6rem}
.gp-meta span{display:inline-flex;align-items:center;gap:.4rem}
.gp-meta svg{color:#e7a53e}
.gp-cover{border-radius:10px;overflow:hidden;margin-bottom:1.6rem;border:1px solid rgba(244,237,220,.14)}
.gp-cover img{display:block;width:100%;height:300px;object-fit:cover}
.gp-soon{border:1.5px dashed rgba(244,237,220,.3);border-radius:10px;padding:2.2rem 1.4rem;text-align:center;color:rgba(244,237,220,.78);line-height:1.55}
.gp-soon svg{color:#e7a53e;margin-bottom:.5rem}
.gp-soon p{margin:.2rem 0;max-width:46ch;margin-inline:auto}
.gp-btn{display:inline-block;margin-top:1.2rem;background:#e7a53e;color:#1e3d2c;font-weight:700;text-decoration:none;padding:.65rem 1.2rem;border-radius:7px}
.gp-foot{padding:1.1rem;text-align:center;font-family:'Space Mono',monospace;font-size:.68rem;color:rgba(244,237,220,.45);border-top:1px solid rgba(244,237,220,.12)}
@media (max-width:560px){.gp-cover img{height:200px}}
`;
