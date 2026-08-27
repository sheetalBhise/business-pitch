import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StoryRadar,
  StoryChip,
  computeMechanicState,
  formatWeight,
  STORY_FRAMES,
} from "./radarMechanic";

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

const IMG = (name) => `${import.meta.env.BASE_URL}metro-narration/${name}`;

// Figma prototype (Application slides) embedded as an iframe.
const APP_PROTO_URL =
  "https://www.figma.com/proto/97BfqxcGOwn8OTC8eqj9rT/Presentations?node-id=1400-2308&viewport=-13%2C-1630%2C0.14&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1400%3A2308&page-id=74%3A55";
const APP_EMBED_SRC = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
  APP_PROTO_URL
)}`;

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

// ── Scene content ────────────────────────────────────────────────────────────
// Business-pitch retelling of the Metro+ interactive narration. Copy is
// sourced from the interactive prototype and the Figma presentation deck.

const SCENES = [
  // ── Cover ──────────────────────────────────────────────────────────────
  {
    id: "cover",
    kind: "title",
    eyebrow: "Business pitch · Confidential",
    title: (
      <>
        Metro<em>+</em>
      </>
    ),
    sub: "Predictable last-mile connectivity for India’s metro cities — the case for building it.",
    tags: ["Service", "Mobility", "Infrastructure"],
  },

  // ── 1. Problem statement ───────────────────────────────────────────────
  { id: "ch1", kind: "chapter", index: "01", title: "Problem statement", kicker: "The brief, reframed" },
  {
    id: "1.brief",
    kind: "brief",
    eyebrow: "What we are actually solving",
    label: "The problem, stated",
    tag: "",
    quote:
      "Design the end-to-end last-mile service that makes the metro a credible daily commute in Mumbai.",
    scope: "A service — not a device.",
    variant: "revised",
  },

  // ── 2. Problem space ───────────────────────────────────────────────────
  { id: "ch2", kind: "chapter", index: "02", title: "Problem space", kicker: "Who is in the segment, and what it costs them" },
  {
    id: "2.players",
    kind: "players",
    eyebrow: "Players in the segment",
    headline: "Three players share one broken last mile",
    hub: "Players in the ecosystem",
    players: [
      {
        tag: "Demand",
        name: "Metro passengers",
        line: "Daily commuters choosing in real time between metro, cab, auto and shared shuttle.",
      },
      {
        tag: "Supply",
        name: "Aggregator marketplaces",
        line: "Ola, Uber & Rapido compete for the same first- and last-mile trips, with no shared signal.",
      },
      {
        tag: "Network",
        name: "Metro, the institution",
        line: "The public operator carrying the capacity risk of a ₹-thousand-crore network.",
      },
    ],
  },

  // ── 4. Personas (directly after Players) ──────────────────────────────
  { id: "ch4", kind: "chapter", index: "04", title: "The people", kicker: "Two personas the service must serve" },
  {
    id: "4.passenger",
    kind: "personaFull",
    variant: "passenger",
    archetype: "9-to-5 Gladiator",
    initial: "S",
    name: "Samaiyra",
    meta: "28 · Product Manager · Infosys · Mumbai",
    bio: "Travels daily for work. Her commute decisions are driven by time, comfort and cost, mode-hopping between metro, cab and auto depending on urgency and convenience.",
    quote: "The hardest thing to plan in my day isn't work — it's reaching work.",
    pains: [
      "Traffic uncertainty and delays",
      "Expensive, recurring commute costs",
      "Last-mile issues — auto rejections and waiting time",
      "A tiring daily travel experience",
    ],
    needs: [
      "A reliable, predictable commute",
      "Comfortable yet cost-effective options",
      "Visibility into travel time and traffic",
      "A smooth, hassle-free journey",
    ],
    sliders: [
      { left: "Planned commute", right: "Spontaneous travel", value: 24 },
      { left: "Cost conscious", right: "Comfort driven", value: 52 },
      { left: "Okay with uncertainty", right: "Needs predictability", value: 82 },
      { left: "Single transport mode", right: "Multi-mode traveller", value: 78 },
    ],
  },
  {
    id: "4.driver",
    kind: "personaFull",
    variant: "driver",
    archetype: "Stability Seeker",
    initial: "R",
    name: "Ramesh Gupta Ji",
    meta: "30 · Rickshaw driver · Mumbai",
    bio: "His life revolves around earning a stable income, reading commuter demand, and balancing long shifts with family. He takes pride in his work and aspires to do better.",
    quote: "सवारियों की इज़्ज़त अपनी जगह, लेकिन पीक आवर्स में कमाई से समझौता… अपनी डिक्शनरी में नहीं है।",
    quoteLang: "hi",
    pains: [
      "Income loss during illness or vehicle issues",
      "High dependency on daily earnings",
      "Limited earning outside fixed routes",
    ],
    needs: [
      "Stable, predictable daily income",
      "Continuous ride demand through the day",
      "Financial security during downtime",
      "Incentives and earning benefits",
      "Flexible earning across the day",
    ],
    sliders: [
      { left: "Stability driven", right: "Experimental", value: 20 },
      { left: "Income predictability", right: "High-profit seeking", value: 30 },
      { left: "Fixed routine", right: "Flexible working style", value: 50 },
      { left: "Demand aware", right: "Demand dependent", value: 22 },
    ],
  },

  {
    id: "2.metro",
    kind: "pullquote",
    eyebrow: "…and the metro pays too",
    quote: (
      <>
        Last-mile connectivity is the <strong>#1 reason</strong> commuters avoid
        Mumbai Metro. The Aqua Line runs at <strong>1.3% capacity</strong>. India
        has invested <strong>$26 Bn</strong> into metro rail — with average
        ridership at just <strong>25–35%</strong> of capacity.
      </>
    ),
    cite: "MMMOCL · TOI · BBC — 2025–26",
  },

  // ── 3. Affinity insights ───────────────────────────────────────────────
  { id: "ch3", kind: "chapter", index: "03", title: "Affinity insights", kicker: "What 16+ field interviews told us" },
  {
    id: "3.affinity",
    kind: "affinity",
    eyebrow: "Synthesised from the field",
    headline: "Five insights that shaped the service",
    notes: [
      {
        lead: "Availability gives prime confidence",
        quote: "Buggy routes don’t have a fixed timetable — they run on a flexible schedule.",
        src: "P1 · 12",
      },
      {
        lead: "The day starts with rejections and negotiation",
        quote: "She used to travel by auto in the evening and faced constant rejection from drivers due to traffic.",
        src: "MP1 · 12",
      },
      {
        lead: "Metro travel is a choice — the first & last leg is forced",
        quote: "Metro is faster, but cab + metro time is roughly the same, because reaching the metro takes time.",
        src: "MP3 · 19",
      },
      {
        lead: "Transit creates culture",
        quote: "Share rickshaws are arranged by her company for employees, but she still prefers the AC BEST bus.",
        src: "MP4 · 7",
      },
      {
        lead: "Commute mode is sensitive to choose, hard to change",
        quote: "Bikes are treated strictly as a fallback for extreme-weather disruption — never a daily preference.",
        src: "MP5 · 12",
      },
    ],
  },

  // ── 4. Personas ────────────────────────────────────────────────────────
  // ── 5. Conclusion — humans are unpredictable ───────────────────────────
  { id: "ch5", kind: "chapter", index: "05", title: "The variable no model controls" },
  {
    id: "5.oneline",
    kind: "problemPanel",
    mark: "The problem, in one line",
    lines: [
      "Drivers can't estimate the scale of demand.",
      "Passengers don't know how long to wait.",
    ],
    foot:
      "Between them sits a rule-of-the-jungle city and an unregulated web of shared-mobility hacks. Both sides pay for the gap in time, money and dignity. Everything that follows is one attempt to close it.",
  },
  {
    id: "5.human",
    kind: "whatif",
    eyebrow: "",
    lead: "Human beings are unpredictable.",
    items: [
      "You book your ride, but a broken elevator delays you at your pickup point.",
      "You head downstairs — and remember you didn't kiss your kid goodbye.",
      "You left without your work laptop. (More often than you'd think.)",
    ],
    close: "How do we still give them predictability?",
  },

  // ── 6. Pole planning ───────────────────────────────────────────────────
  { id: "ch6", kind: "chapter", index: "06", title: "Pole planning", kicker: "Turning routes into a predictable network" },
  {
    id: "6.promise",
    kind: "problem",
    eyebrow: "The promise",
    question:
      "How do we guarantee that whenever a passenger reaches a pole, a vehicle is never more than 2 minutes away?",
    note: "Assumption: the passenger has already booked a Metro+ vehicle from home.",
  },
  {
    id: "6.routes",
    kind: "statement",
    eyebrow: "Route predictability",
    headline: "To promise predictability, first define the routes",
  },
  {
    id: "6.map",
    kind: "figma",
    artifact: { label: "Route map · poles linked to routes", src: IMG("route-map-poles-linked.png") },
    caption:
      "Poles connect to routes with the metro station as their base, and a single pole can belong to multiple routes. (Pole & route placement is decided by K-means — more on that later.)",
  },
  {
    id: "6.surge",
    kind: "figma",
    artifact: { label: "A pole surges", src: IMG("pole-surge-state.png") },
    caption:
      "Say a pole suddenly sees a surge and tells the station. That pole’s vehicle is already full — so why should it travel on to Pole 4 and Pole 6?",
  },
  {
    id: "6.system",
    kind: "statement",
    eyebrow: "The gap",
    headline: "So we need an intelligent system",
    body:
      "One that tracks how many passengers are travelling from a pole, and knows when enough of them will fill a vehicle to capacity.",
  },
  {
    id: "6.detach",
    kind: "figma",
    artifact: { label: "Pole detached & served independently", src: IMG("pole-detached-state.png") },
    caption:
      "Pole 10 is detached from the loop and served on its own because it’s full now, and the nodes after it re-attach to a different route.",
  },

  // ── 7. The 3-body problem ──────────────────────────────────────────────
  { id: "ch7", kind: "chapter", index: "07", title: "Human ⟷ pole interaction", kicker: "The 3-body problem" },
  {
    id: "7.3body",
    kind: "statement",
    eyebrow: "A classic tension",
    headline: "It’s a 3-body problem.",
    body: "Keeping Passenger ⟷ Pole ⟷ E-vehicle in sync.",
    center: true,
  },
  {
    id: "7.solution",
    kind: "statement",
    eyebrow: "The solution",
    headline: (
      <>
        The <em>Quarter</em> and the <em>Half</em> user.
      </>
    ),
    center: true,
  },
  {
    id: "7.fraction",
    kind: "quote",
    quote: (
      <>
        A user isn’t 0 or 1.
        <br />
        They arrive as a <em>fraction</em>.
      </>
    ),
  },
  {
    id: "7.reads",
    kind: "quote",
    quote:
      "So the service doesn’t wait for certainty. It reads partial commitment — a booking — and acts on it.",
  },
  {
    id: "7.defs",
    kind: "definitions",
    headline: "Each pole has two boundaries: 20 m and 75 m",
    defs: [
      {
        frac: "¼",
        name: "Quarter User",
        ring: "beyond 75 m",
        desc:
          "Books from home, 75 m or more from the pole. In a 3-seater they hold ¼ of a seat because they’ve paid and pledged the journey.",
      },
      {
        frac: "½",
        name: "Half User",
        ring: "crosses 75 m",
        desc:
          "Crosses the pole’s outer 75 m ring. Proximity raises commitment, so their weight in the demand signal rises.",
      },
      {
        frac: "1",
        name: "Full User",
        ring: "crosses 20 m",
        desc:
          "Arrives within 20 m of the pole. Intent is now certain: a whole seat, a whole user.",
      },
    ],
    subtext: "Scroll for the simulation ↓",
  },
  { id: "7.radar", kind: "radar", weight: 5 },

  // ── 8. Application ─────────────────────────────────────────────────────
  { id: "ch8", kind: "chapter", index: "08", title: "The application", kicker: "What the passenger and driver actually hold" },
  {
    id: "8.app",
    kind: "appEmbed",
    eyebrow: "Application slides",
    headline: "The product, interactive",
    caption: "A live Figma prototype — click through the Metro+ app flows.",
    src: APP_EMBED_SRC,
    href: APP_PROTO_URL,
  },
  {
    id: "8.close",
    kind: "closing",
    quote:
      "Good service design makes the invisible visible — and holds the whole system accountable to it.",
  },
];

// ── Small presentational helpers ─────────────────────────────────────────────

function ArtifactImage({ label, src, kind = "photo" }) {
  return (
    <figure className={`mn-asset mn-asset--${kind}`}>
      <img src={src} alt={label} loading="lazy" />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

// ── Radar scene (imperative progress; isolated re-render) ─────────────────────

const RadarScene = forwardRef(function RadarScene(_, ref) {
  const [progress, setProgress] = useState(0);
  useImperativeHandle(ref, () => ({ setProgress }), []);
  const { weight, frame, caption } = computeMechanicState(progress);
  return (
    <div className="mn-radar">
      <div
        className="mn-radar__viz"
        role="img"
        aria-label="Riders convert from quarter to half to full users as two rickshaws are dispatched from the metro toward the pole."
      >
        <StoryRadar progress={progress} />
      </div>
      <aside className="mn-radar__panel">
        <div className="mn-radar__frameno">
          Frame {String(frame + 1).padStart(2, "0")} · {String(STORY_FRAMES).padStart(2, "0")}
        </div>
        <div className="mn-radar__weight">
          <span className="mn-radar__weight-v">{formatWeight(weight)}</span>
          <span className="mn-radar__weight-k">
            pole weight
            <br />Σ commitment
          </span>
        </div>
        <div className="mn-radar__chips">
          <StoryChip label="Rickshaw 1" status={["Idle", "Ready", "Dispatched", "Arriving", "At pole"][frame]} />
          <StoryChip label="Rickshaw 2" status={["Idle", "Idle", "Ready", "Dispatched", "Arriving"][frame]} />
        </div>
        <div className="mn-radar__caption">
          <h4>{caption.t}</h4>
          <p>{caption.d}</p>
        </div>
        <div className="mn-radar__dots" aria-hidden="true">
          {Array.from({ length: STORY_FRAMES }).map((_, i) => (
            <span key={i} data-on={i <= frame} />
          ))}
        </div>
      </aside>
    </div>
  );
});

// ── Scene renderer ────────────────────────────────────────────────────────────

function SceneBody({ scene, radarRef }) {
  switch (scene.kind) {
    case "title":
      return (
        <div className="mn-title">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h1 className="mn-title__h">{scene.title}</h1>
          <p className="mn-title__sub">{scene.sub}</p>
          <div className="mn-tags">
            {scene.tags.map((t) => (
              <span className="mn-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>
      );
    case "chapter":
      return (
        <div className="pd-chapter">
          <h2 className="pd-chapter__title">{scene.title}</h2>
          {scene.kicker && <p className="pd-chapter__kicker">{scene.kicker}</p>}
        </div>
      );
    case "brief":
      return (
        <div className={`mn-brief mn-brief--${scene.variant}`}>
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <article className="mn-brief__card">
            <header>
              <span className="mn-brief__tag">{scene.tag}</span>
              <h3>{scene.label}</h3>
            </header>
            <p className="mn-brief__quote">“{scene.quote}”</p>
            <footer>
              <span>Scope</span>
              <strong>{scene.scope}</strong>
            </footer>
          </article>
        </div>
      );
    case "players":
      return (
        <div className="mn-block">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-h2">{scene.headline}</h2>
          <div className="pd-players">
            <div className="pd-players__ring">
              {scene.players.map((p) => (
                <article className="pd-player" key={p.name}>
                  <span className="pd-player__tag">{p.tag}</span>
                  <h3>{p.name}</h3>
                  <p>{p.line}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    case "issues":
      return (
        <div className="mn-block">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-h2">{scene.headline}</h2>
          <div className="mn-personas">
            {scene.personas.map((p) => (
              <article className={`mn-persona mn-persona--${p.tag.includes("driver") ? "driver" : "passenger"}`} key={p.name}>
                <header>
                  <span className="mn-persona__avatar">{p.initial}</span>
                  <div>
                    <span className="mn-persona__tag">{p.tag}</span>
                    <h3>{p.name}</h3>
                    <span className="mn-persona__meta">{p.meta}</span>
                  </div>
                </header>
                <p className="mn-persona__line">{p.line}</p>
                <div className="mn-persona__cols">
                  <div>
                    <span className="mn-persona__k">Wants</span>
                    <ul>
                      {p.wants.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="mn-persona__k">Pains</span>
                    <ul>
                      {p.pains.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    case "pullquote":
      return (
        <blockquote className="pd-pullquote">
          {scene.eyebrow && <p className="pd-pullquote__eyebrow">{scene.eyebrow}</p>}
          <p className="pd-pullquote__q">{scene.quote}</p>
          <cite className="pd-pullquote__cite">{scene.cite}</cite>
        </blockquote>
      );
    case "affinity":
      return (
        <div className="mn-block">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-h2">{scene.headline}</h2>
          <div className="pd-affinity">
            {scene.notes.map((n, i) => (
              <article className="pd-note" key={i} style={{ "--i": i }}>
                <p className="pd-note__lead">{n.lead}</p>
                <p className="pd-note__quote">“{n.quote}”</p>
                <span className="pd-note__src">{n.src}</span>
              </article>
            ))}
          </div>
        </div>
      );
    case "personaFull":
      return (
        <div className={`pd-persona pd-persona--${scene.variant}`}>
          <header className="pd-persona__head">
            <span className="pd-persona__avatar">{scene.initial}</span>
            <div className="pd-persona__id">
              <span className="pd-persona__archetype">{scene.archetype}</span>
              <h2 className="pd-persona__name">{scene.name}</h2>
              <span className="pd-persona__meta">{scene.meta}</span>
            </div>
          </header>
          <p className="pd-persona__bio">{scene.bio}</p>
          <p className={`pd-persona__quote${scene.quoteLang === "hi" ? " pd-persona__quote--hi" : ""}`}>
            “{scene.quote}”
          </p>
          <div className="pd-persona__grid">
            <div className="pd-persona__col">
              <span className="pd-persona__k pd-persona__k--pain">Pain points</span>
              <ul>
                {scene.pains.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="pd-persona__col">
              <span className="pd-persona__k pd-persona__k--need">Needs</span>
              <ul>
                {scene.needs.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pd-persona__sliders">
            {scene.sliders.map((s) => (
              <div className="pd-slider" key={s.left}>
                <div className="pd-slider__labels">
                  <span>{s.left}</span>
                  <span>{s.right}</span>
                </div>
                <div className="pd-slider__track">
                  <span className="pd-slider__knob" style={{ left: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "problem":
      return (
        <div className="mn-problem">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-problem__q">{scene.question}</h2>
          <p className="mn-problem__note">{scene.note}</p>
        </div>
      );
    case "problemPanel":
      return (
        <aside className="mn-problem-panel" aria-label="Problem statement">
          <span className="mn-problem-panel__mark">{scene.mark}</span>
          <p className="mn-problem-panel__body">
            <span>{scene.lines[0]}</span>
            <span>{scene.lines[1]}</span>
          </p>
          <p className="mn-problem-panel__foot">{scene.foot}</p>
        </aside>
      );
    case "artifact":
      return (
        <div className="mn-block">
          {scene.eyebrow && <p className="mn-eyebrow">{scene.eyebrow}</p>}
          <h2 className="mn-h2">{scene.headline}</h2>
          {scene.body && <p className="mn-lede">{scene.body}</p>}
          <ArtifactImage label={scene.artifact.label} kind={scene.artifact.kind} src={scene.artifact.src} />
        </div>
      );
    case "figma":
      return (
        <div className="mn-block mn-block--figma">
          <ArtifactImage label={scene.artifact.label} kind="figma" src={scene.artifact.src} />
          <p className="mn-caption">{scene.caption}</p>
        </div>
      );
    case "statement":
      return (
        <div className={`mn-statement${scene.center ? " mn-statement--center" : ""}`}>
          {scene.eyebrow && <p className="mn-eyebrow">{scene.eyebrow}</p>}
          {scene.headline && <h2 className="mn-statement__h">{scene.headline}</h2>}
          {scene.body && <p className="mn-statement__body">{scene.body}</p>}
        </div>
      );
    case "whatif":
      return (
        <div className="mn-block">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-h2">{scene.lead}</h2>
          <ul className="mn-whatif">
            {scene.items.map((it, i) => (
              <li key={i}>
                <span className="mn-whatif__k">What if…</span>
                {it}
              </li>
            ))}
          </ul>
          <p className="mn-whatif__close">{scene.close}</p>
        </div>
      );
    case "definitions":
      return (
        <div className="mn-block">
          <h2 className="mn-h2">{scene.headline}</h2>
          <ol className="mn-defs">
            {scene.defs.map((d) => (
              <li className="mn-def" key={d.name}>
                <span className="mn-def__frac">{d.frac}</span>
                <div>
                  <h3>
                    {d.name} <span className="mn-def__ring">{d.ring}</span>
                  </h3>
                  <p>{d.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mn-subtext">{scene.subtext}</p>
        </div>
      );
    case "radar":
      return <RadarScene ref={radarRef} />;
    case "appEmbed":
      return (
        <div className="pd-app">
          <p className="mn-eyebrow">{scene.eyebrow}</p>
          <h2 className="mn-h2">{scene.headline}</h2>
          <div className="pd-app__frame">
            <iframe
              title="Metro+ application prototype"
              src={scene.src}
              allowFullScreen
            />
          </div>
          <p className="mn-caption">
            {scene.caption}{" "}
            <a href={scene.href} target="_blank" rel="noreferrer">
              Open in Figma ↗
            </a>
          </p>
        </div>
      );
    case "closing":
      return (
        <div className="mn-closing">
          <p className="mn-quote__mark" aria-hidden="true">
            ”
          </p>
          <p className="mn-closing__q">{scene.quote}</p>
        </div>
      );
    case "quote":
      return (
        <div className="mn-quote">
          <p className="mn-quote__mark" aria-hidden="true">
            ”
          </p>
          <p className="mn-quote__q">{scene.quote}</p>
        </div>
      );
    default:
      return null;
  }
}

// ── Static (reduced-motion) fallback ──────────────────────────────────────────

function StaticDeck() {
  const radarRef = useRef(null);
  useEffect(() => {
    radarRef.current?.setProgress(0.5);
  }, []);
  return (
    <div className="mn pd mn--static">
      <div className="mn__static-scroll">
        {SCENES.map((s) => (
          <section className={`mn__scene mn__scene--${s.kind} mn__scene--static`} key={s.id}>
            <div className="mn__inner">
              <SceneBody scene={s} radarRef={radarRef} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ── Main engine ───────────────────────────────────────────────────────────────

export default function PitchDeck() {
  const reduce = usePrefersReducedMotion();
  const scrollerRef = useRef(null);
  const sceneRefs = useRef([]);
  const innerRefs = useRef([]);
  const fillRef = useRef(null);
  const hintRef = useRef(null);
  const radarRef = useRef(null);
  const target = useRef(0);
  const smooth = useRef(0);

  const { bands, total, radarIndex } = useMemo(() => {
    const w = SCENES.map((s) => s.weight ?? 1);
    const tot = w.reduce((a, b) => a + b, 0);
    let acc = 0;
    const bd = w.map((wi) => {
      const a = acc / tot;
      acc += wi;
      const b = acc / tot;
      return { a, b, c: (a + b) / 2, w: b - a };
    });
    return { bands: bd, total: tot, radarIndex: SCENES.findIndex((s) => s.kind === "radar") };
  }, []);

  // Fit each scene's content to the viewport (slide-deck behaviour): scenes are
  // fixed-height overlays, so content taller than the screen is scaled down.
  useEffect(() => {
    if (reduce) return;
    const fit = () => {
      innerRefs.current.forEach((inner) => {
        if (!inner) return;
        const scene = inner.parentElement;
        if (!scene) return;
        const availH = scene.clientHeight - 88;
        const availW = scene.clientWidth - 96;
        const natH = inner.offsetHeight;
        const natW = inner.offsetWidth;
        const k = Math.min(1, availH / natH || 1, availW / natW || 1);
        inner.style.transform =
          k < 0.999 ? `translate(-50%, -50%) scale(${k})` : "translate(-50%, -50%)";
      });
    };
    fit();
    const t = setTimeout(fit, 400);
    window.addEventListener("resize", fit);
    const ro = new ResizeObserver(fit);
    innerRefs.current.forEach((i) => i && ro.observe(i));
    document.fonts?.ready.then(fit);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fit);
      ro.disconnect();
    };
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const T = 0.22 / total;
    let raf = 0;
    let lastActive = -1;

    const loop = () => {
      const el = scrollerRef.current;
      if (el) {
        const max = Math.max(1, el.scrollHeight - el.clientHeight);
        target.current = clamp(el.scrollTop / max);
      }
      smooth.current += (target.current - smooth.current) * 0.12;
      const p = smooth.current;

      let active = 0;
      for (let i = 0; i < SCENES.length; i++) {
        const node = sceneRefs.current[i];
        if (!node) continue;
        const { a, b, c, w } = bands[i];
        const up = i === 0 ? 1 : smoothstep((p - (a - T)) / (2 * T));
        const down = i === SCENES.length - 1 ? 1 : smoothstep(((b + T) - p) / (2 * T));
        const opacity = up * down;
        node.style.opacity = opacity.toFixed(3);
        node.style.visibility = opacity >= 0.01 ? "visible" : "hidden";
        if (i === radarIndex) {
          node.style.transform = "none";
          node.style.filter = "none";
        } else {
          const d = clamp((p - c) / (w / 2 || 1), -1.4, 1.4);
          node.style.transform = `translate3d(0, ${(-d * 3.5).toFixed(2)}vh, 0) scale(${(
            1 + d * 0.025
          ).toFixed(3)})`;
          node.style.filter = opacity < 0.92 ? `blur(${((1 - opacity) * 3.5).toFixed(2)}px)` : "none";
        }
        if (p >= a && p < b) active = i;
      }

      if (radarRef.current && radarIndex >= 0) {
        const rb = bands[radarIndex];
        radarRef.current.setProgress(clamp((p - rb.a) / (rb.w || 1)));
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (hintRef.current) hintRef.current.style.opacity = clamp(1 - p * 30).toFixed(3);

      if (active !== lastActive) lastActive = active;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce, bands, total, radarIndex]);

  if (reduce) return <StaticDeck />;

  return (
    <div className="mn pd" ref={scrollerRef}>
      <div className="mn__track" style={{ height: `${total * 85}vh` }} aria-hidden="true" />

      <div className="mn__scenes">
        {SCENES.map((s, i) => (
          <section
            className={`mn__scene mn__scene--${s.kind}`}
            key={s.id}
            ref={(el) => (sceneRefs.current[i] = el)}
          >
            <div className="mn__inner" ref={(el) => (innerRefs.current[i] = el)}>
              <SceneBody scene={s} radarRef={radarRef} />
            </div>
          </section>
        ))}
      </div>

      <div className="pd-brand" aria-hidden="true">
        Metro<span>+</span>
      </div>
      <div className="mn__rail" aria-hidden="true">
        <span className="mn__rail-fill" ref={fillRef} />
      </div>
      <p className="mn__hint" ref={hintRef} aria-hidden="true">
        Scroll to begin ↓
      </p>
    </div>
  );
}
