import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";

/* Patrol pages. Deliberately "coming soon": the scouts in each patrol are
   being challenged to write the prompts that will build their own page. */

const PATROLS = {
  "spicy-tacos": {
    name: "The Spicy Tacos",
    tag: "The original crew. Bring an appetite for adventure — and a little heat.",
    crest: "/spicy-tacos-crest.png",
  },
  "new-patrol": {
    name: "The girls\u2019 patrol",
    tag: "Brand new and still picking a name.",
    crest: null,
  },
};

export default function PatrolPage() {
  const { slug } = useParams();
  const patrol = PATROLS[slug];

  return (
    <div className="ppage">
      <style>{CSS}</style>
      <header className="pp-bar">
        <Link to="/" className="pp-home"><ArrowLeft size={15} /> Troop 650</Link>
      </header>

      {!patrol ? (
        <main className="pp-main">
          <h1>No patrol here.</h1>
          <p className="pp-lead">That patrol doesn&rsquo;t exist — yet, anyway.</p>
          <Link to="/" className="pp-btn">Back to the site</Link>
        </main>
      ) : (
        <main className="pp-main">
          {patrol.crest ? (
            <img className="pp-crest" src={patrol.crest} alt={`${patrol.name} crest`} />
          ) : (
            <svg className="pp-crest" viewBox="0 0 400 400" aria-hidden="true">
              <circle cx="200" cy="200" r="190" fill="none" stroke="#8fae93" strokeWidth="9" strokeDasharray="24 24" />
              <path d="M200 114 L219 181 L286 200 L219 219 L200 286 L181 219 L114 200 L181 181 Z" fill="none" stroke="#8fae93" strokeWidth="9" strokeLinejoin="round" />
            </svg>
          )}
          <h1>{patrol.name}</h1>
          <p className="pp-tag">{patrol.tag}</p>

          <div className="pp-soon">
            <Flame size={20} />
            <p><strong>This page belongs to the patrol.</strong></p>
            <p>The scouts are designing it themselves — what goes here, how it looks, and what it says is up to them. Watch this space.</p>
          </div>
        </main>
      )}

      <footer className="pp-foot">© 2026 Troop 650 · 650rc.com</footer>
    </div>
  );
}

const CSS = `
.ppage{min-height:100vh;background:#1e3d2c;color:#f4eddc;font-family:'Hanken Grotesk',system-ui,sans-serif;display:flex;flex-direction:column}
.pp-bar{padding:1rem 1.4rem;border-bottom:1px solid rgba(244,237,220,.12)}
.pp-home{display:inline-flex;align-items:center;gap:.45rem;color:#f4eddc;text-decoration:none;font-family:'Space Mono',monospace;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase}
.pp-home:hover{color:#e7a53e}
.pp-main{flex:1;width:min(680px,92%);margin:0 auto;padding:2.8rem 0 3rem;text-align:center}
.pp-crest{width:150px;height:150px;object-fit:contain;display:block;margin:0 auto 1.2rem}
.pp-main h1{font-family:'Fraunces',serif;font-size:clamp(1.7rem,4.5vw,2.5rem);margin:0 0 .4rem}
.pp-tag{color:rgba(244,237,220,.78);margin:0 0 1.8rem}
.pp-lead{color:rgba(244,237,220,.8)}
.pp-soon{border:1.5px dashed rgba(244,237,220,.3);border-radius:10px;padding:2rem 1.4rem;color:rgba(244,237,220,.78);line-height:1.55}
.pp-soon svg{color:#e7a53e;margin-bottom:.4rem}
.pp-soon p{margin:.2rem 0;max-width:44ch;margin-inline:auto}
.pp-btn{display:inline-block;margin-top:1.2rem;background:#e7a53e;color:#1e3d2c;font-weight:700;text-decoration:none;padding:.65rem 1.2rem;border-radius:7px}
.pp-foot{padding:1.1rem;text-align:center;font-family:'Space Mono',monospace;font-size:.68rem;color:rgba(244,237,220,.45);border-top:1px solid rgba(244,237,220,.12)}
`;
