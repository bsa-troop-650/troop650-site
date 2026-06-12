import React, { useState, useEffect, useRef } from "react";
import {
  Mountain, TreePine, Tent, Compass, Flame, Users, Sparkles,
  ArrowUpRight, ArrowRight, Menu, X, Mail, MapPin, Clock,
  ChevronDown, Backpack, Send, Check, Footprints, Map, PawPrint,
  HandHeart, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { ADVENTURES, MON, parseLocal, startOfToday, slugFor } from "./data/adventures";

/* TROOP 650 — Rancho Cucamonga · marketing site
   Direction by the troop's youth webmaster: warm & friendly (campfire), classic
   Scout green + tan, patrols get their own section, show lots, animal service project.
   Core philosophies held: marketing-first, Be A Scout primary CTA, day-to-day
   stays in GroupMe/Scoutbook. Photos publish with signed release forms on file. */

const BEASCOUT_URL = "https://beascout.scouting.org/list/?zip=92336&program%5B0%5D=scoutsBSA&scoutsBSAFilter=all&miles=10&unitID=143906"; // swap for your unit-specific Apply URL from my.Scouting
const SCOUTBOOK_URL = "https://advancements.scouting.org"; // Scoutbook Plus member login

const FAQS = [
  { q: "Who can join?", a: "Boys and girls, roughly ages 10 to 17. We're a family troop — siblings and friends of all genders are welcome. (If your scout just earned the Arrow of Light, they can cross over now.)" },
  { q: "When and where do you meet?", a: "Thursday evenings, 7:00–8:30 PM, at Etiwanda Community Church in Rancho Cucamonga. December is dark — no meetings." },
  { q: "What do we need to start?", a: "Nothing for your first visit. Just show up. When you're ready to join, we'll walk you through registration and what to pick up first." },
  { q: "How much of a time commitment is it?", a: "A weekly Thursday meeting, plus an adventure most months — usually a weekend campout or hike — and a week of summer camp. Come to what you can." },
];

function relLabel(start) {
  const diff = Math.round((parseLocal(start) - startOfToday()) / 86400000);
  if (diff <= 0) return "Happening now";
  if (diff === 1) return "Tomorrow";
  if (diff < 14) return `In ${diff} days`;
  return `In ${Math.round(diff / 7)} weeks`;
}
function formatRange(a) {
  const s = parseLocal(a.start);
  if (!a.end) return `${MON[s.getMonth()]} ${s.getDate()}`;
  const e = parseLocal(a.end);
  if (s.getTime() === e.getTime()) return `${MON[s.getMonth()]} ${s.getDate()}`;
  if (s.getMonth() === e.getMonth()) return `${MON[s.getMonth()]} ${s.getDate()}\u2013${e.getDate()}`;
  return `${MON[s.getMonth()]} ${s.getDate()} \u2013 ${MON[e.getMonth()]} ${e.getDate()}`;
}
const TYPE_ICON = { "Hike": Footprints, "Summer Camp": Tent, "Campout": Flame, "Family Campout": Users, "Camporee": Compass };

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.14 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

/* fleur-de-lis brandmark (not the official Scouting America emblem) */
function Mark({ size = 30, light = false }) {
  return (
    <img
      src={light ? "/fleur-cream.png" : "/fleur-orange.png"}
      alt="Troop 650"
      className="mark"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

function HeroScene() {
  const stars = [[60,40],[140,70],[220,30],[300,80],[380,50],[470,90],[560,40],[650,70],[740,35],[820,80],[900,55],[110,120],[260,140],[420,130],[600,150],[780,120],[860,140],[160,180],[520,180],[700,190],[40,90],[960,110]];
  const eagle = "M -71.5,-64.1 L -69.9,-58.4 L -61.4,-46.0 L -62.0,-44.7 L -75.0,-53.9 L -68.3,-45.0 L -73.7,-45.3 L -69.3,-38.7 L -73.1,-35.8 L -69.0,-31.1 L -71.5,-27.6 L -67.4,-19.3 L -66.8,-8.6 L -62.6,1.3 L -58.2,4.1 L -58.8,8.9 L -50.3,22.8 L -46.8,24.1 L -46.1,27.9 L -42.3,30.8 L -42.3,35.8 L -37.3,37.4 L -39.8,39.0 L -66.8,37.4 L -66.1,45.3 L -68.7,47.6 L -67.1,50.1 L -69.6,53.6 L -66.4,61.8 L -44.2,66.9 L -31.6,54.5 L -23.3,53.3 L -18.2,54.2 L -20.1,57.1 L -0.2,68.8 L 14.4,71.7 L 17.6,70.4 L 20.1,72.3 L 37.3,71.7 L 42.7,75.2 L 42.7,70.1 L 50.6,72.0 L 49.3,69.1 L 59.8,69.8 L 70.6,64.4 L 75.0,58.4 L 58.5,67.2 L 48.7,64.1 L 49.6,62.2 L 43.9,60.6 L 11.3,39.3 L 16.6,33.9 L 24.3,32.3 L 23.3,26.6 L 17.0,24.1 L 3.0,26.3 L -5.9,20.3 L -36.3,-35.5 L -38.8,-62.5 L -41.1,-56.8 L -39.8,-40.6 L -44.6,-53.3 L -46.5,-72.3 L -48.0,-57.4 L -44.9,-44.7 L -52.2,-61.8 L -54.7,-75.2 L -55.3,-61.8 L -50.6,-46.9 L -63.9,-70.7 L -63.6,-62.8 L -56.3,-46.3 Z";
  const cst = "M 700.1 42 C 693.1 56.5 679.1 71.3 678.3 87.4 C 677.4 104.1 689.7 121 695.1 136.8 C 684 122 671.5 105.4 660.4 90.6 C 654.4 92.2 647.7 93.9 641.7 95.5 C 639.6 101.5 635.2 108 635 114.4 C 634.7 120.2 638.5 126.1 640.2 131.6 C 645.6 126.9 651.6 121.6 657 116.9 C 663.2 120.4 672.3 122 676.3 127.9 C 681.1 135 682.6 145.5 682.5 154.2 C 682.4 157.6 677.9 159.9 675.7 162.7 C 672.5 160.2 668.8 157.4 665.6 154.9 C 667.2 162.6 669 171.2 670.6 178.9 C 675.2 178 680.5 176.9 685.2 176 C 688.8 166.6 693 156 696.7 146.6 C 694.6 157.2 689.2 168.9 690.1 179.7 C 690.5 185.3 697 189.4 700.3 194 C 703.5 189.5 709.9 185.5 710.3 180 C 711 169.1 705.7 157.3 703.6 146.6 C 707.2 156 711.3 166.6 714.8 176 C 719.6 176.8 725 177.8 729.8 178.6 C 731.3 171 732.9 162.4 734.3 154.8 C 731.1 157.3 727.5 160.1 724.3 162.7 C 722.1 159.9 717.6 157.6 717.5 154.2 C 717.3 145.8 718.7 135.6 723.3 128.6 C 727.3 122.6 736.3 120.6 742.4 116.8 C 748 121.6 754.2 126.9 759.8 131.6 C 761.5 125 765.7 117.7 765 110.8 C 764.5 104.7 759.1 99.3 756.2 93.8 C 750.4 93 743.9 92.1 738.1 91.3 C 727.6 105.8 715.7 122.2 705.2 136.7 C 710.6 120.8 722.9 103.9 722 87.1 C 721.2 71.1 707.1 56.4 700.1 42 Z";
  return (
    <svg className="hero-svg" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2c3a" /><stop offset="46%" stopColor="#34384a" />
          <stop offset="74%" stopColor="#7a5a4a" /><stop offset="100%" stopColor="#c97a3e" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.95" /><stop offset="55%" stopColor="#e7a53e" stopOpacity="0.35" /><stop offset="100%" stopColor="#e7a53e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fire" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf8a" stopOpacity="0.9" /><stop offset="100%" stopColor="#de7b33" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="520" fill="url(#sky)" />
      <circle cx="500" cy="300" r="220" fill="url(#sun)" />
      <g className="stars">{stars.map((p, i) => (<circle key={i} cx={p[0]} cy={p[1]} r={i % 4 === 0 ? 1.8 : 1.1} fill="#f4e7c9" style={{ animationDelay: `${(i % 7) * 0.4}s` }} className="twinkle" />))}</g>
      <g className="cst-g">
      <path className="cst" d={cst} pathLength="520" fill="none" stroke="#f4e7c9" strokeWidth="1.1" opacity="0.85" strokeLinejoin="round" />
      {[[700.1,42],[641.7,95.5],[640.2,131.6],[695.1,136.8],[705.2,136.7],[670.6,178.9],[700.3,194],[729.8,178.6],[759.8,131.6],[756.2,93.8]].map((p,i)=>(<circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill="#fff3da" />))}
      </g>
      <g className="eagle-g" transform="translate(330,232) scale(0.85)">
        <path className="eagle" d={eagle} fill="#15110b" opacity="0.88" />
      </g>
      <g stroke="#5b6b6a" strokeWidth="1" fill="none" opacity="0.6">
        <path d="M0 360 Q 250 330 500 352 T 1000 348" /><path d="M0 380 Q 250 352 500 372 T 1000 368" /><path d="M0 400 Q 250 374 500 392 T 1000 388" />
      </g>
      <path d="M0 410 L150 320 L260 380 L400 300 L520 372 L660 286 L800 360 L920 312 L1000 360 L1000 520 L0 520 Z" fill="#2c4636" opacity="0.85" />
      <path d="M0 450 L120 388 L240 440 L380 360 L520 430 L640 372 L780 440 L900 392 L1000 430 L1000 520 L0 520 Z" fill="#1e3d2c" />
      <path d="M0 500 L180 452 L360 500 L520 446 L680 500 L860 458 L1000 496 L1000 520 L0 520 Z" fill="#102017" />
      <g fill="#0b1810"><path d="M250 470 l9 22 l-18 0 z M250 478 l11 24 l-22 0 z" /><path d="M286 476 l8 20 l-16 0 z M286 483 l10 21 l-20 0 z" /><path d="M724 466 l9 22 l-18 0 z M724 474 l11 24 l-22 0 z" /></g>
      <circle cx="500" cy="486" r="40" fill="url(#fire)" className="fire" />
      <path d="M500 470 q 8 10 0 20 q -8 -8 0 -20 z" fill="#ffcf8a" className="fire" />
    </svg>
  );
}

function TopoBand() {
  return (
    <svg className="topo-band" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      {[0,1,2,3,4].map(i => (<path key={i} d={`M0 ${30+i*16} Q 300 ${10+i*16} 600 ${34+i*16} T 1200 ${28+i*16}`} fill="none" stroke="currentColor" strokeWidth="1" opacity={0.5 - i*0.07} />))}
    </svg>
  );
}

function AdventureCard({ a, featured, delay }) {
  const Icon = TYPE_ICON[a.type] || Compass;
  return (
    <Reveal className={`adv-card ${featured ? "adv-feat" : ""}`} delay={delay}>
      <div className="adv-illus">
        {a.photo ? (
          <img className="adv-img" src={a.photo} alt={a.place} loading="lazy" style={{ objectPosition: a.focus || "center" }} />
        ) : (
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="200" height="120" fill="var(--pine)" />
            <path d="M0 86 L46 54 L82 84 L120 50 L156 82 L200 56 L200 120 L0 120Z" fill="#16311f" />
            <path d="M0 104 L60 78 L110 104 L160 80 L200 100 L200 120 L0 120Z" fill="#0e2417" />
            <circle cx="158" cy="34" r="16" fill="var(--gold)" opacity="0.9" />
          </svg>
        )}
        <span className="adv-type">{a.type}</span>
        {featured && <span className="adv-next">Next up</span>}
        {!a.photo && <span className="adv-photo-note">photo zone</span>}
      </div>
      <div className="adv-body">
        <div className="adv-when"><Icon size={15} strokeWidth={2} /><span>{formatRange(a)}</span><span className="adv-rel">{relLabel(a.start)}</span></div>
        <h3 className="adv-name">{a.name}</h3>
        <p className="adv-place"><MapPin size={13} strokeWidth={2} /> {a.place}</p>
      </div>
    </Reveal>
  );
}

function TacoCrest() {
  return (
    <svg viewBox="0 0 84 84" aria-hidden="true" className="crest">
      <circle cx="42" cy="42" r="40" fill="var(--pine)" />
      <circle cx="42" cy="42" r="40" fill="none" stroke="var(--gold)" strokeWidth="2" />
      <path d="M42 19 C 55 34 52 47 42 60 C 32 47 29 34 42 19 Z" fill="var(--chili)" />
      <path d="M42 30 C 49 40 47 48 42 56 C 37 48 35 40 42 30 Z" fill="var(--gold)" />
      <circle cx="20" cy="42" r="2" fill="var(--gold)" /><circle cx="64" cy="42" r="2" fill="var(--gold)" />
    </svg>
  );
}

function SoonCrest() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className="patrol-crest">
      <circle cx="200" cy="200" r="190" fill="none" stroke="var(--sage)" strokeWidth="9" strokeDasharray="24 24" />
      <path d="M200 114 L219 181 L286 200 L219 219 L200 286 L181 219 L114 200 L181 181 Z"
        fill="none" stroke="var(--sage)" strokeWidth="9" strokeLinejoin="round" />
    </svg>
  );
}

function PlaceholderHills() {
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="120" fill="#1e3d2c" />
      <path d="M0 92 L48 60 L92 92 L130 64 L160 88 L160 120 L0 120Z" fill="#13301e" />
    </svg>
  );
}

/* Horizontally scrolling rail of past adventures. Arrows appear only when the
   row overflows its container (i.e. once enough trips have accumulated). */
function RecapRail({ items }) {
  const railRef = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const update = () => {
    const el = railRef.current; if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    update();
    const el = railRef.current; if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [items.length]);
  const nudge = (dir) => railRef.current?.scrollBy({ left: dir * 520, behavior: "smooth" });
  return (
    <div className="recaps-wrap">
      {canL && <button className="rail-btn rail-l" onClick={() => nudge(-1)} aria-label="Scroll back"><ChevronLeft size={20} /></button>}
      <div className="recaps-row" ref={railRef}>
        {items.length === 0 && ["Last campout", "Trail day", "Service project"].map((n, i) => (
          <div className="recap-tile" key={i}><PlaceholderHills /><span className="recap-label">{n}</span></div>
        ))}
        {items.map((t) => (
          <Link className="recap-tile" key={slugFor(t)} to={`/galleries/${slugFor(t)}`}>
            {t.photo ? (
              <img src={t.photo} alt={t.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", objectPosition: t.focus || "center" }} />
            ) : (<PlaceholderHills />)}
            <span className="recap-name">{t.name}</span>
          </Link>
        ))}
      </div>
      {canR && <button className="rail-btn rail-r" onClick={() => nudge(1)} aria-label="Scroll ahead"><ChevronRight size={20} /></button>}
    </div>
  );
}

export default function Troop650Site() {
  const [navOpen, setNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", scout: "", botcheck: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const upcoming = ADVENTURES
    .filter(a => (a.end ? parseLocal(a.end) : parseLocal(a.start)) >= startOfToday())
    .sort((x, y) => parseLocal(x.start) - parseLocal(y.start)).slice(0, 6);

  const recent = ADVENTURES
    .filter(a => (a.end ? parseLocal(a.end) : parseLocal(a.start)) < startOfToday())
    .sort((x, y) => parseLocal(y.start) - parseLocal(x.start));

  const go = (id) => { setNavOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setErr("Name and email, please."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setErr("That email looks off."); return; }
    if (form.botcheck) return; // honeypot: silently drop bots
    setErr(""); setSending(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: "5f26086e-b26a-47ee-b592-03072f0376e6",
          subject: `Troop 650 website inquiry from ${form.name}`,
          from_name: "650rc.com contact form",
          name: form.name,
          email: form.email,
          phone: form.phone || "(none given)",
          message: form.scout || "(no details given)",
        }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setErr("Hmm — that didn\u2019t go through. Try again, or email troop650rc@gmail.com.");
    } catch {
      setErr("Hmm — that didn\u2019t go through. Try again, or email troop650rc@gmail.com.");
    } finally { setSending(false); }
  };

  return (
    <div className="site">
      <style>{CSS}</style>
      <svg className="grain" aria-hidden="true"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>

      <header className="nav">
        <button className="brand" onClick={() => go("top")} aria-label="Troop 650 home"><Mark /><span className="brand-tx"><strong>Troop 650</strong><em>Rancho Cucamonga</em></span></button>
        <nav className={`nav-links ${navOpen ? "open" : ""}`}>
          <button onClick={() => go("adventures")}>Activities</button>
          <button onClick={() => go("patrols")}>Patrols</button>
          <button onClick={() => go("join")}>Join</button>
          <button onClick={() => go("visit")}>Visit</button>
          <button onClick={() => go("members")}>Members</button>
        </nav>
        <button className="hamb" onClick={() => setNavOpen(o => !o)} aria-label="Menu">{navOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </header>

      <section id="top" className="hero">
        <HeroScene />
        <div className="hero-inner">
          <p className="eyebrow rise" style={{ animationDelay: ".05s" }}>Scouts BSA · Troop 650 · Rancho Cucamonga, CA</p>
          <h1 className="rise" style={{ animationDelay: ".15s" }}>Adventure starts<br /><em>in the foothills.</em></h1>
          <p className="hero-sub rise" style={{ animationDelay: ".3s" }}>A family troop of Scouts BSA — boys and girls, ages 10 to 17 — out exploring the San Gabriels, learning to lead, and growing up a little braver. We meet Thursday evenings.</p>
          <div className="hero-cta rise" style={{ animationDelay: ".45s" }}>
            <a className="btn btn-amber" href={BEASCOUT_URL} target="_blank" rel="noreferrer">Apply on Be A Scout <ArrowUpRight size={17} /></a>
            <button className="btn btn-ghost" onClick={() => go("visit")}>Plan a visit <ArrowRight size={17} /></button>
          </div>
        </div>
        <ul className="hero-stats">
          <li><Clock size={16} /><span><b>Thursdays</b>7:00–8:30 PM</span></li>
          <li><Users size={16} /><span><b>Boys &amp; girls</b>Ages 10–17</span></li>
          <li><Tent size={16} /><span><b>Visitors welcome</b>Any week</span></li>
          <li><Mountain size={16} /><span><b>An adventure</b>Most months</span></li>
        </ul>
      </section>

      <section id="why" className="why">
        <Reveal><p className="eyebrow eyebrow-dark">Why Scouting</p></Reveal>
        <Reveal as="h2" className="h2" delay={60}>It isn&rsquo;t a club.<br />It&rsquo;s a launchpad.</Reveal>
        <div className="why-grid">
          {[
            { I: TreePine, t: "The outdoors, on repeat", d: "Campouts, hikes, and a week at summer camp — from Etiwanda Falls to Silverwood Lake. Real places, real dirt, real weekends." },
            { I: Compass, t: "Led by the scouts", d: "Scouts learn to lead by doing it — planning, problem-solving, teaching the younger ones. Adults coach from the back." },
            { I: Backpack, t: "Skills that stick", d: "Building a bench, pitching a tent, cooking over a fire, tying knots. The quiet confidence that follows a kid everywhere else." },
            { I: Users, t: "Small enough to know you", d: "We\u2019re a tight family troop. Every scout gets noticed, every family gets a say. Nobody\u2019s a number here." },
          ].map((c, i) => (<Reveal className="why-card" delay={i * 90} key={i}><span className="why-ic"><c.I size={22} strokeWidth={1.8} /></span><h3>{c.t}</h3><p>{c.d}</p></Reveal>))}
        </div>
        <Reveal className="cadence" delay={120}><span>Weekly meetings</span><i>·</i><span>An adventure most months</span><i>·</i><span>A week of summer camp</span><i>·</i><span>Service &amp; ceremony</span></Reveal>
      </section>

      <section id="adventures" className="adv">
        <TopoBand />
        <div className="adv-head">
          <Reveal><p className="eyebrow">What&rsquo;s next</p></Reveal>
          <Reveal as="h2" className="h2 h2-light" delay={60}>Upcoming adventures</Reveal>
          <Reveal delay={120}><p className="adv-lead">Straight from the troop calendar — there&rsquo;s an outdoor activity almost every month. Here&rsquo;s what&rsquo;s coming up next.</p></Reveal>
        </div>
        {upcoming.length > 0 ? (
          <>
            <div className="adv-grid">{upcoming.map((a, i) => <AdventureCard key={a.name} a={a} featured={i === 0} delay={i * 70} />)}</div>
            <Reveal className="adv-more" delay={80}>And that&rsquo;s just the next few — there&rsquo;s always something on the calendar.</Reveal>
          </>
        ) : (
          <Reveal className="adv-empty"><Sparkles size={26} /><p>Our next season of adventures is being planned. Leave us a line and we&rsquo;ll tell you what&rsquo;s coming up.</p><button className="btn btn-amber" onClick={() => go("visit")}>Get in touch <ArrowRight size={16} /></button></Reveal>
        )}
        <Reveal className="recaps" delay={80}>
          <div className="recaps-tx"><h3>From recent adventures</h3><p>Tap any trip to flip through the photos — our youth webmaster keeps the highlights rolling.</p></div>
          <RecapRail items={recent} />
        </Reveal>
      </section>

      <section id="patrols" className="patrols">
        <Reveal><p className="eyebrow eyebrow-dark">Meet the troop</p></Reveal>
        <Reveal as="h2" className="h2" delay={60}>Our patrols</Reveal>
        <Reveal delay={110}><p className="patrols-lead">Every scout belongs to a patrol — a little crew they camp, cook, and figure things out with. Right now we&rsquo;ve got one, with a second on the way.</p></Reveal>
        <div className="patrol-grid">
          <Reveal className="patrol-card" delay={0}>
            <img src="/spicy-tacos-crest.png" alt="Spicy Tacos patrol crest" className="patrol-crest" /><h3>The Spicy Tacos</h3>
            <p className="patrol-tag">The original crew. Bring an appetite for adventure — and a little heat.</p>
            <Link className="patrol-link" to="/patrols/spicy-tacos">Visit patrol page <ArrowRight size={13} /></Link>
          </Reveal>
          <Reveal className="patrol-card patrol-soon" delay={90}>
            <SoonCrest /><h3>The girls&rsquo; patrol</h3>
            <p className="patrol-tag">Brand new and still picking a name. Watch this space.</p>
            <Link className="patrol-link" to="/patrols/new-patrol">Visit patrol page <ArrowRight size={13} /></Link>
          </Reveal>
        </div>
      </section>

      <section id="service" className="service">
        <Reveal className="service-inner">
          <span className="service-ic"><HandHeart size={24} strokeWidth={1.9} /></span>
          <div><h3>We give back, too.</h3><p>Adventure&rsquo;s only half of it. Our scouts participate in regular <b>service projects</b> — doing a good turn in practical ways.</p></div>
        </Reveal>
      </section>

      <section id="join" className="join">
        <Reveal><p className="eyebrow eyebrow-dark">New families</p></Reveal>
        <Reveal as="h2" className="h2" delay={60}>Joining is easier<br />than you&rsquo;d think.</Reveal>
        <div className="join-cols">
          <Reveal className="steps" delay={100}>
            {[
              { n: "01", t: "Just show up", d: "Drop in any Thursday at 7 PM at Etiwanda Community Church in Rancho Cucamonga. No uniform, no paperwork, no commitment." },
              { n: "02", t: "Meet the troop", d: "Watch a real meeting, meet the scouts and leaders, and ask us anything at all." },
              { n: "03", t: "Make it official", d: "Ready? Apply in a few minutes on Be A Scout and your scout is in." },
            ].map((s, i) => (<div className="step" key={i}><span className="step-n">{s.n}</span><div><h4>{s.t}</h4><p>{s.d}</p></div></div>))}
          </Reveal>
          <Reveal className="cost" delay={160}>
            <h4>What it costs</h4>
            <p>Annual Scouts BSA registration is about <b>$250/year</b>, plus a handbook and the start of a uniform. <span className="cost-note">Cost should never keep a kid out — ask us about assistance.</span></p>
            <div className="join-faq">
              {FAQS.map((f, i) => (<div className={`faq ${openFaq === i ? "open" : ""}`} key={i}><button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}><span>{f.q}</span><ChevronDown size={18} className="faq-chev" /></button><div className="faq-a"><p>{f.a}</p></div></div>))}
            </div>
          </Reveal>
        </div>
        <Reveal className="join-band" delay={80}>
          <span>Seen enough?</span>
          <a className="btn btn-amber" href={BEASCOUT_URL} target="_blank" rel="noreferrer">Apply on Be A Scout <ArrowUpRight size={16} /></a>
          <button className="btn btn-line" onClick={() => go("visit")}>Have a question first?</button>
        </Reveal>
      </section>

      <section id="visit" className="visit">
        <div className="visit-grid">
          <Reveal className="lead-form">
            <p className="eyebrow">Get in touch</p>
            <h2 className="h2 h2-light">Curious? Leave us a line.</h2>
            <p className="visit-sub">Tell us a little about your scout and we&rsquo;ll reach out — or just come by a Thursday meeting.</p>
            {!sent ? (
              <div className="form">
                <div className="field"><label>Your name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="First and last" /></div>
                <div className="row2">
                  <div className="field"><label>Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" /></div>
                  <div className="field"><label>Phone <i>(optional)</i></label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0150" /></div>
                </div>
                <div className="field"><label>About your scout <i>(optional)</i></label><textarea rows={3} value={form.scout} onChange={e => setForm({ ...form, scout: e.target.value })} placeholder="Age, what they're into, anything you're wondering about…" /></div>
                <input type="text" value={form.botcheck} onChange={(e) => setForm({ ...form, botcheck: e.target.value })} style={{ display: "none" }} tabIndex="-1" autoComplete="off" aria-hidden="true" />
                {err && <p className="form-err">{err}</p>}
                <button className="btn btn-amber btn-wide" onClick={submit} disabled={sending}>Send it <Send size={16} /></button>
                <p className="privacy">We&rsquo;ll only use this to reach out about joining Troop 650. No spam, no sharing — ever.</p>
              </div>
            ) : (
              <div className="thanks"><span className="thanks-ic"><Check size={26} strokeWidth={2.5} /></span><h3>Thanks — we&rsquo;ll be in touch soon.</h3><p>In the meantime, you can apply anytime on Be A Scout, or just drop by a Thursday meeting.</p><a className="btn btn-amber" href={BEASCOUT_URL} target="_blank" rel="noreferrer">Apply on Be A Scout <ArrowUpRight size={16} /></a></div>
            )}
          </Reveal>
          <Reveal className="visit-side" delay={120}>
            <div className="side-card side-apply"><Compass size={20} /><h4>Or apply right now</h4><p>Find Troop 650 on Be A Scout and start the application online.</p><a className="btn btn-amber btn-wide" href={BEASCOUT_URL} target="_blank" rel="noreferrer">Be A Scout <ArrowUpRight size={15} /></a></div>
            <div className="side-card"><h4><MapPin size={17} /> Find us</h4><p><b>Thursdays, 7:00–8:30 PM</b><br />Etiwanda Community Church<br />Rancho Cucamonga, CA</p></div>
            <div id="members" className="side-card side-quiet"><h4><Users size={16} /> Current families</h4><p>Day-to-day — calendar, reminders, files — lives in the troop&rsquo;s private GroupMe and Scoutbook.</p><a className="btn btn-ghost btn-wide" href={SCOUTBOOK_URL} target="_blank" rel="noreferrer">Open Scoutbook <ArrowUpRight size={15} /></a><p className="members-note">New here? Your patrol leader or the Scoutmaster adds you to GroupMe.</p></div>
          </Reveal>
        </div>
      </section>

      <footer className="foot">
        <TopoBand />
        <div className="foot-inner">
          <div className="foot-brand"><div className="brand"><Mark size={28} light /><span className="brand-tx"><strong>Troop 650</strong><em>Scouting America</em></span></div><p>A family troop of Scouts BSA in Rancho Cucamonga, California.<br />California Inland Empire Council.</p></div>
          <div className="foot-links"><a href={BEASCOUT_URL} target="_blank" rel="noreferrer">Be A Scout <ArrowUpRight size={13} /></a><button onClick={() => go("adventures")}>Activities</button><button onClick={() => go("patrols")}>Patrols</button><button onClick={() => go("join")}>Join</button><button onClick={() => go("visit")}>Visit</button><button onClick={() => go("members")}>Members</button></div>
        </div>
        <div className="foot-bottom"><p className="foot-privacy"><Map size={13} /> Adventure photos are shared with our families&rsquo; permission — release forms on file.</p><p>© 2026 Troop 650 · 650rc.com · <span className="motto">Be Prepared.</span></p></div>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..800&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
:root{
  --paper:#F4EDDC;--paper-2:#ECE1CB;--card:#FBF6EA;
  --ink:#15281C;--ink-soft:#465A4B;
  --pine:#1E3D2C;--pine-deep:#0E2017;--moss:#345C42;
  --sage:#8FA68E;--sky:#A7C2CC;
  --ember:#DE7B33;--ember-deep:#B85C24;--gold:#E8A53E;
  --chili:#C7402F;--chili-deep:#9E2F22;
  --line:rgba(21,40,28,.14);--line-light:rgba(244,237,220,.16);
  --fdisp:'Fraunces',Georgia,serif;--fbody:'Hanken Grotesk',system-ui,sans-serif;--fmono:'Space Mono',ui-monospace,monospace;
  --shadow:0 18px 48px -22px rgba(14,32,23,.45);
}
*{box-sizing:border-box;margin:0;padding:0}
.site{font-family:var(--fbody);background:var(--paper);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.55;position:relative}
.grain{position:fixed;inset:0;width:100%;height:100%;opacity:.045;pointer-events:none;mix-blend-mode:multiply;z-index:90}
img,svg{display:block}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.reveal{opacity:0;transform:translateY(26px);transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1)}
.reveal.in{opacity:1;transform:none}
.eyebrow{font-family:var(--fmono);font-size:.7rem;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);font-weight:700}
.eyebrow-dark{color:var(--ember-deep)}
.h2{font-family:var(--fdisp);font-weight:600;font-size:clamp(2.1rem,5.5vw,3.5rem);line-height:1.02;letter-spacing:-.015em;margin:.5rem 0 0}
.h2-light{color:var(--paper)}
.btn{display:inline-flex;align-items:center;gap:.5rem;font-weight:600;font-size:.94rem;padding:.8rem 1.25rem;border-radius:999px;transition:transform .2s,box-shadow .2s,background .2s;white-space:nowrap;text-decoration:none}
.btn-sm{padding:.55rem .95rem;font-size:.84rem}
.btn-wide{width:100%;justify-content:center}
.btn-amber{background:var(--ember);color:#2a1606;box-shadow:0 10px 24px -10px rgba(222,123,51,.7)}
.btn-amber:hover{transform:translateY(-2px);background:var(--gold);box-shadow:0 16px 30px -10px rgba(231,165,62,.8)}
.btn-ghost{background:rgba(244,237,220,.1);color:var(--paper);border:1px solid rgba(244,237,220,.4);backdrop-filter:blur(4px)}
.btn-ghost:hover{background:rgba(244,237,220,.2);transform:translateY(-2px)}
.btn-line{border:1.5px solid var(--line);color:var(--ink);background:transparent}
.btn-line:hover{background:var(--ink);color:var(--paper)}
.nav{position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:space-between;padding:.85rem clamp(1rem,4vw,3rem);background:rgba(244,237,220,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:.6rem;color:var(--pine)}
.mark{color:var(--ember)}
.brand-tx{display:flex;flex-direction:column;line-height:1;text-align:left}
.brand-tx strong{font-family:var(--fdisp);font-size:1.18rem;font-weight:700;letter-spacing:-.01em;color:var(--ink)}
.brand-tx em{font-family:var(--fmono);font-style:normal;font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft);margin-top:2px}
.nav-links{display:flex;align-items:center;gap:1.6rem}
.nav-links>button{font-weight:600;font-size:.92rem;color:var(--ink-soft);transition:color .2s;position:relative;padding:.2rem 0}
.nav-links>button:hover{color:var(--ink)}
.nav-links>button::after{content:"";position:absolute;left:0;bottom:-3px;width:0;height:2px;background:var(--ember);transition:width .25s}
.nav-links>button:hover::after{width:100%}
.hamb{display:none;color:var(--pine)}
.hero{position:relative;min-height:92vh;display:flex;flex-direction:column;justify-content:center;padding:5rem clamp(1.2rem,5vw,4rem) 0;overflow:hidden}
.hero-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.hero-inner{position:relative;z-index:2;max-width:760px}
.hero .eyebrow{color:var(--gold)}
.hero h1{font-family:var(--fdisp);font-weight:600;color:var(--paper);font-size:clamp(2.9rem,9vw,6rem);line-height:.96;letter-spacing:-.02em;margin:.7rem 0 0;text-shadow:0 2px 30px rgba(0,0,0,.3)}
.hero h1 em{font-style:italic;font-weight:500;color:var(--gold)}
.hero-sub{color:rgba(244,237,220,.92);font-size:clamp(1.02rem,2.2vw,1.25rem);max-width:54ch;margin-top:1.4rem;text-shadow:0 1px 16px rgba(0,0,0,.35)}
.hero-cta{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}
.hero-stats{position:relative;z-index:2;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:auto;background:var(--line-light);border-top:1px solid var(--line-light)}
.hero-stats li{display:flex;align-items:center;gap:.7rem;padding:1.15rem clamp(1rem,2vw,1.6rem);background:rgba(14,32,23,.55);backdrop-filter:blur(6px);color:var(--paper)}
.hero-stats svg{color:var(--gold);flex-shrink:0}
.hero-stats span{display:flex;flex-direction:column;font-size:.8rem;color:rgba(244,237,220,.7);line-height:1.3}
.hero-stats b{font-size:.94rem;color:var(--paper);font-weight:700}
.rise{opacity:0;animation:rise 1s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes rise{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
.twinkle{animation:tw 3.4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
.cst{stroke-dasharray:520;stroke-dashoffset:520;animation:draw 3.2s cubic-bezier(.55,0,.3,1) forwards .6s, linepulse 4s ease-in-out infinite 3.8s}
.eagle{transform-box:fill-box;transform-origin:center;animation:soar 24s ease-in-out infinite}
@keyframes soar{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(14px,-7px) rotate(-1.2deg)}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes linepulse{0%,100%{opacity:.6}50%{opacity:.18}}
.fire{animation:flick 1.6s ease-in-out infinite alternate;transform-origin:500px 486px}
@keyframes flick{from{opacity:.7;transform:scale(.92)}to{opacity:1;transform:scale(1.08)}}
.why{padding:clamp(4rem,9vw,7rem) clamp(1.2rem,5vw,4rem);background:var(--paper)}
.why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem;margin-top:2.8rem}
.why-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:1.6rem 1.4rem;transition:transform .3s,box-shadow .3s}
.why-card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
.why-ic{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:13px;background:var(--pine);color:var(--gold);margin-bottom:1rem}
.why-card h3{font-family:var(--fdisp);font-size:1.25rem;font-weight:600;margin-bottom:.5rem;letter-spacing:-.01em}
.why-card p{font-size:.93rem;color:var(--ink-soft)}
.cadence{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.7rem;margin-top:2.6rem;font-family:var(--fmono);font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-soft)}
.cadence i{color:var(--ember);font-style:normal}
.adv{position:relative;padding:clamp(4rem,9vw,7rem) clamp(1.2rem,5vw,4rem);background:var(--pine-deep);color:var(--paper)}
.topo-band{position:absolute;top:0;left:0;width:100%;height:90px;color:var(--paper);opacity:.1}
.adv-head{position:relative;max-width:680px}
.adv .eyebrow{color:var(--gold)}
.adv-lead{color:rgba(244,237,220,.78);font-size:1.06rem;margin-top:1rem;max-width:48ch}
.adv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem;margin-top:2.8rem}
.adv-card{background:var(--card);color:var(--ink);border-radius:18px;overflow:hidden;transition:transform .3s,box-shadow .3s;display:flex;flex-direction:column}
.adv-card:hover{transform:translateY(-6px) rotate(-.4deg);box-shadow:0 26px 50px -20px rgba(0,0,0,.55)}
.adv-feat{outline:2px solid var(--gold);outline-offset:-2px}
.adv-illus{position:relative;height:118px}
.adv-illus svg{width:100%;height:100%}
.adv-illus img{width:100%;height:100%;object-fit:cover}
.adv-type{position:absolute;top:.7rem;left:.7rem;font-family:var(--fmono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;background:rgba(14,32,23,.7);color:var(--gold);padding:.3rem .55rem;border-radius:7px}
.adv-next{position:absolute;top:.7rem;right:.7rem;font-size:.66rem;font-weight:700;background:var(--ember);color:#2a1606;padding:.3rem .55rem;border-radius:7px}
.adv-photo-note{position:absolute;bottom:.55rem;right:.7rem;font-family:var(--fmono);font-size:.55rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(244,237,220,.5)}
.adv-body{padding:1.1rem 1.2rem 1.3rem}
.adv-when{display:flex;align-items:center;gap:.45rem;font-size:.82rem;color:var(--ink-soft);font-weight:600}
.adv-when svg{color:var(--ember)}
.adv-rel{margin-left:auto;font-family:var(--fmono);font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ember-deep);background:rgba(222,123,51,.12);padding:.2rem .5rem;border-radius:6px}
.adv-name{font-family:var(--fdisp);font-size:1.32rem;font-weight:600;margin:.5rem 0 .35rem;letter-spacing:-.01em;line-height:1.1}
.adv-place{display:flex;align-items:center;gap:.35rem;font-size:.86rem;color:var(--ink-soft)}
.adv-place svg{color:var(--sage)}
.adv-more{text-align:center;margin-top:1.8rem;font-family:var(--fmono);font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(244,237,220,.6)}
.adv-empty{text-align:center;max-width:440px;margin:3rem auto 0;color:rgba(244,237,220,.85)}
.adv-empty svg{color:var(--gold);margin:0 auto 1rem}
.adv-empty p{margin-bottom:1.4rem}
.recaps{margin-top:3.2rem;border-top:1px solid var(--line-light);padding-top:2.2rem;display:grid;grid-template-columns:1fr 2fr;gap:2rem;align-items:center}
.recaps-tx h3{font-family:var(--fdisp);font-size:1.5rem;font-weight:600;margin-bottom:.5rem}
.recaps-tx p{color:rgba(244,237,220,.7);font-size:.92rem;max-width:40ch}
.recaps-wrap{position:relative}
.recaps-row{display:flex;gap:.9rem;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:4px}
.recaps-row::-webkit-scrollbar{display:none}
.recap-tile{position:relative;flex:0 0 240px;scroll-snap-align:start;border-radius:14px;overflow:hidden;aspect-ratio:4/3;border:1px dashed rgba(244,237,220,.25);display:block;text-decoration:none;color:inherit}
a.recap-tile{border-style:solid;border-color:rgba(244,237,220,.18)}
.recap-tile svg{width:100%;height:100%;opacity:.7}
.recap-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--fmono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(244,237,220,.55)}
.recap-name{position:absolute;left:0;right:0;bottom:0;padding:.9rem .7rem .55rem;font-family:var(--fmono);font-size:.62rem;letter-spacing:.05em;text-transform:uppercase;color:#f4eddc;background:linear-gradient(transparent,rgba(8,16,11,.85))}
.rail-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:38px;height:38px;border-radius:50%;border:1px solid rgba(244,237,220,.3);background:rgba(16,32,23,.88);color:#f4eddc;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,color .2s}
.rail-btn:hover{background:var(--gold);color:#1e3d2c}
.rail-l{left:-12px}.rail-r{right:-12px}
.patrols{padding:clamp(4rem,9vw,7rem) clamp(1.2rem,5vw,4rem);background:var(--paper)}
.patrols-lead{color:var(--ink-soft);font-size:1.04rem;margin-top:1rem;max-width:52ch}
.patrol-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;margin-top:2.6rem;max-width:760px}
.patrol-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:2rem 1.6rem;text-align:center;transition:transform .3s,box-shadow .3s}
.patrol-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.crest{width:84px;height:84px;margin:0 auto 1.1rem}
.patrol-card h3{font-family:var(--fdisp);font-size:1.5rem;font-weight:600;margin-bottom:.45rem}
.patrol-crest{width:140px;height:140px;object-fit:contain;display:block;margin:0 auto}
.patrol-tag{color:var(--ink-soft);font-size:.92rem;max-width:32ch;margin:0 auto}
.patrol-link{display:inline-flex;align-items:center;gap:.35rem;margin-top:.95rem;font-family:var(--fmono);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ember,#de7b33);text-decoration:none}
.patrol-link:hover{text-decoration:underline}
.patrol-soon{background:transparent;border-style:dashed;border-color:var(--sage)}
.patrol-soon h3{color:var(--ink-soft)}
.service{padding:0 clamp(1.2rem,5vw,4rem) clamp(4rem,8vw,6rem);background:var(--paper)}
.service-inner{display:flex;align-items:center;gap:1.4rem;background:linear-gradient(135deg,var(--pine),var(--moss));color:var(--paper);border-radius:20px;padding:1.8rem 2rem;max-width:900px;margin:0 auto;box-shadow:var(--shadow)}
.service-ic{flex-shrink:0;width:56px;height:56px;border-radius:15px;background:rgba(244,237,220,.14);display:flex;align-items:center;justify-content:center;color:var(--gold)}
.service h3{font-family:var(--fdisp);font-size:1.45rem;font-weight:600;margin-bottom:.25rem}
.service p{color:rgba(244,237,220,.86);font-size:.95rem}
.service b{color:var(--gold)}
.join{padding:clamp(4rem,9vw,7rem) clamp(1.2rem,5vw,4rem);background:var(--paper-2)}
.join-cols{display:grid;grid-template-columns:1fr 1fr;gap:2.6rem;margin-top:2.6rem}
.steps{display:flex;flex-direction:column;gap:1.6rem}
.step{display:flex;gap:1.1rem;align-items:flex-start}
.step-n{font-family:var(--fdisp);font-size:1.5rem;font-weight:700;color:var(--ember);flex-shrink:0;line-height:1}
.step h4{font-size:1.12rem;font-weight:700;margin-bottom:.25rem}
.step p{color:var(--ink-soft);font-size:.94rem}
.cost h4{font-size:1.12rem;font-weight:700;margin-bottom:.5rem}
.cost>p{color:var(--ink-soft);margin-bottom:1.5rem}
.cost b{color:var(--ink)}
.cost-note{display:block;margin-top:.5rem;font-size:.88rem;color:var(--ember-deep);font-weight:600}
.join-faq{border-top:1px solid var(--line)}
.faq{border-bottom:1px solid var(--line)}
.faq-q{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:1rem 0;font-weight:600;font-size:1rem;gap:1rem}
.faq-chev{color:var(--ember);transition:transform .3s;flex-shrink:0}
.faq.open .faq-chev{transform:rotate(180deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease}
.faq.open .faq-a{max-height:260px}
.faq-a p{padding:0 0 1.1rem;color:var(--ink-soft);font-size:.92rem;max-width:52ch}
.join-band{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;margin-top:3rem;padding:1.6rem 1.8rem;background:var(--pine);color:var(--paper);border-radius:18px}
.join-band>span{font-family:var(--fdisp);font-size:1.3rem;font-weight:600;margin-right:auto}
.join-band .btn-line{border-color:rgba(244,237,220,.4);color:var(--paper)}
.join-band .btn-line:hover{background:var(--paper);color:var(--pine)}
.visit{padding:clamp(4rem,9vw,7rem) clamp(1.2rem,5vw,4rem);background:var(--pine);color:var(--paper)}
.visit-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:2.6rem;align-items:start}
.visit .eyebrow{color:var(--gold)}
.visit-sub{color:rgba(244,237,220,.8);margin-top:1rem;max-width:46ch}
.form{margin-top:1.8rem;max-width:520px}
.field{margin-bottom:1rem}
.field label{display:block;font-size:.78rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:rgba(244,237,220,.7);margin-bottom:.4rem}
.field label i{font-style:normal;text-transform:none;color:rgba(244,237,220,.45);font-weight:400}
.field input,.field textarea{width:100%;background:rgba(244,237,220,.08);border:1px solid rgba(244,237,220,.22);border-radius:11px;padding:.8rem .95rem;color:var(--paper);font-family:inherit;font-size:.96rem;transition:border .2s,background .2s}
.field input:focus,.field textarea:focus{outline:none;border-color:var(--gold);background:rgba(244,237,220,.13)}
.field input::placeholder,.field textarea::placeholder{color:rgba(244,237,220,.4)}
.field textarea{resize:vertical}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.form-err{color:#ffd0a0;font-size:.85rem;margin-bottom:.7rem;font-weight:600}
.privacy{font-family:var(--fmono);font-size:.66rem;letter-spacing:.04em;color:rgba(244,237,220,.55);margin-top:.9rem;line-height:1.5}
.thanks{margin-top:1.8rem;background:rgba(244,237,220,.08);border:1px solid rgba(244,237,220,.2);border-radius:18px;padding:2.2rem;max-width:520px}
.thanks-ic{display:inline-flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;background:var(--gold);color:var(--pine-deep);margin-bottom:1rem}
.thanks h3{font-family:var(--fdisp);font-size:1.5rem;font-weight:600;margin-bottom:.5rem}
.thanks p{color:rgba(244,237,220,.8);margin-bottom:1.3rem}
.visit-side{display:flex;flex-direction:column;gap:1rem}
.side-card{background:rgba(244,237,220,.07);border:1px solid rgba(244,237,220,.18);border-radius:16px;padding:1.4rem}
.side-card h4{display:flex;align-items:center;gap:.5rem;font-size:1.04rem;font-weight:700;margin-bottom:.5rem}
.side-card p{color:rgba(244,237,220,.78);font-size:.92rem}
.side-card svg{color:var(--gold)}
.side-apply{background:linear-gradient(160deg,rgba(222,123,51,.22),rgba(231,165,62,.06));border-color:rgba(231,165,62,.4)}
.side-apply .btn{margin-top:1rem}
.side-quiet{opacity:.85}
.side-quiet svg{color:var(--sage)}
.side-quiet .btn{margin-top:1rem}
.members-note{font-size:.78rem;color:rgba(244,237,220,.5);margin-top:.7rem}
.foot{position:relative;background:var(--pine-deep);color:var(--paper);padding:clamp(3rem,7vw,5rem) clamp(1.2rem,5vw,4rem) 2rem}
.foot .topo-band{height:80px;opacity:.08}
.foot-inner{position:relative;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem;padding-bottom:2.4rem;border-bottom:1px solid var(--line-light)}
.foot-brand .brand{color:var(--paper);margin-bottom:1rem}
.foot-brand .brand-tx strong{color:var(--paper)}
.foot-brand .brand-tx em{color:var(--gold)}
.foot-brand p{color:rgba(244,237,220,.66);font-size:.9rem;max-width:42ch}
.foot-links{display:flex;flex-direction:column;gap:.7rem;align-items:flex-start}
.foot-links a,.foot-links button{display:inline-flex;align-items:center;gap:.3rem;color:rgba(244,237,220,.8);font-size:.92rem;font-weight:600;transition:color .2s}
.foot-links a:hover,.foot-links button:hover{color:var(--gold)}
.foot-bottom{position:relative;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-top:1.6rem;font-size:.8rem;color:rgba(244,237,220,.55)}
.foot-privacy{display:flex;align-items:center;gap:.45rem}
.foot-privacy svg{color:var(--sage)}
.motto{font-family:var(--fdisp);font-style:italic;color:var(--gold)}
@media(max-width:900px){.why-grid{grid-template-columns:1fr 1fr}.adv-grid{grid-template-columns:1fr 1fr}.join-cols,.visit-grid{grid-template-columns:1fr}.recaps{grid-template-columns:1fr}}
@media(max-width:760px){
  .hamb{display:block}
  .nav-links{position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;gap:0;background:var(--paper);border-bottom:1px solid var(--line);padding:.5rem clamp(1rem,4vw,3rem) 1.2rem;max-height:0;overflow:hidden;transition:max-height .3s}
  .nav-links.open{max-height:420px}
  .nav-links>button{padding:.85rem 0;border-bottom:1px solid var(--line)}
  .nav-links .btn{margin-top:.8rem;justify-content:center}
  .hero-stats{grid-template-columns:1fr 1fr}
  .why-grid{grid-template-columns:1fr}
  .adv-grid{grid-template-columns:1fr}
  .patrol-grid{grid-template-columns:1fr}
  .service-inner{flex-direction:column;text-align:center}
  .row2{grid-template-columns:1fr}
  .join-band>span{margin-right:0;width:100%}
}
@media (max-width:640px){
  /* Bring the hero decorations into the narrow visible slice of the scene.
     Two knobs: translateX for the constellation, translate(x,y) scale() for the eagle. */
  .cst-g{transform:translateX(-140px)}
  .eagle-g{transform:translate(565px,282px) scale(.45)}
}
`;
