import React from "react";
import rickshawUrl from "./media/rickshaw.png";
import metroLogoUrl from "./media/metro-logo.png";

/**
 * Shared Half-User radar mechanic (ported from the Metro+ case study).
 * -----------------------------------------------------------------
 * The radar visual is a PURE function of a progress value (0..1):
 * riders convert ¼ → ½ → 1 as they near the pole, two rickshaws are
 * dispatched from the metro, and pole-weight accumulates.
 */

// Radar geometry (viewBox 0 0 470 440), centred on the pole
export const R = { cx: 230, cy: 205, full: 58, half: 120, quarter: 185 };

export const STORY_FRAMES = 5;

// Six riders — each a unique user. Row = its centre across the five frames.
export const DOT_TRACKS = {
  1: [[288, 13], [262, 77], [260, 93], [245, 160], [240, 187]],
  2: [[415, 127], [415, 127], [415, 127], [296, 181], [283, 188]],
  3: [[398, 350], [398, 350], [398, 350], [250, 214], [250, 214]],
  4: [[163, 423], [180, 360], [180, 331], [182, 268], [239, 241]],
  5: [[15, 250], [95, 250], [120, 250], [120, 241], [182, 234]],
  6: [[25, 38], [25, 38], [66, 84], [137, 137], [166, 165]],
};
export const DOT_IDS = [1, 2, 3, 4, 5, 6];

// Two rickshaws: metro station (bottom-left) → dispatched toward the pole.
export const RICKSHAW_TRACKS = {
  1: [[119, 392], [102, 365], [176, 287], [235, 230], [243, 218]],
  2: [[85, 418], [85, 418], [103, 364], [125, 338], [180, 284]],
};

export const RICKSHAW_STATUS = {
  1: ["Idle", "Ready", "Dispatched", "Arriving", "At pole"],
  2: ["Idle", "Idle", "Ready", "Dispatched", "Arriving"],
};

export const STORY_CAPTIONS = [
  {
    t: "Six riders, booked from home",
    d: "Every rider is a Quarter User with intent declared, but all are still beyond the 150 m ring. Pooled weight is 1.5, so nothing leaves the station yet.",
  },
  {
    t: "Rickshaw 1 is readied",
    d: "Riders edge inward. Aggregated ¼-demand decides the vehicle type. Rickshaw 1 is prepared at the metro, held but not yet dispatched.",
  },
  {
    t: "First dispatch",
    d: "Two riders cross the 75 m ½ ring. Pole weight reaches 2 → Rickshaw 1 is dispatched, and Rickshaw 2 is readied behind it.",
  },
  {
    t: "Second dispatch",
    d: "Commitment keeps rising and weight climbs to 4. One vehicle can’t serve the pool, so Rickshaw 2 is dispatched to follow.",
  },
  {
    t: "Arrival at the pole",
    d: "Riders reach the 20 m core as Full Users. Rickshaw 1 has arrived and Rickshaw 2 is seconds behind, so the wait collapses to near zero.",
  },
];

export const WEIGHTS = { q: 0.25, h: 0.5, f: 1 };

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function sampleTrack(track, p) {
  const segs = track.length - 1;
  const x = Math.max(0, Math.min(0.999999, p)) * segs;
  const i = Math.floor(x);
  const t = easeInOut(x - i);
  const a = track[i];
  const b = track[i + 1] || a;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function zoneOf(cx, cy) {
  const d = Math.hypot(cx - R.cx, cy - R.cy);
  if (d <= R.full) return "f";
  if (d <= R.half) return "h";
  return "q";
}

export function formatWeight(w) {
  return (Math.round(w * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
}

export function computeMechanicState(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const weight = DOT_IDS.reduce((sum, id) => {
    const [x, y] = sampleTrack(DOT_TRACKS[id], p);
    return sum + WEIGHTS[zoneOf(x, y)];
  }, 0);
  const frame = Math.min(STORY_FRAMES - 1, Math.round(p * (STORY_FRAMES - 1)));
  return { progress: p, weight, frame, caption: STORY_CAPTIONS[frame] };
}

export function StoryRadar({ progress }) {
  const dots = DOT_IDS.map((id) => {
    const [x, y] = sampleTrack(DOT_TRACKS[id], progress);
    return { id, x, y, zone: zoneOf(x, y) };
  });
  const r1 = sampleTrack(RICKSHAW_TRACKS[1], progress);
  const r2 = sampleTrack(RICKSHAW_TRACKS[2], progress);
  const dotStyle = {
    q: { r: 5, cls: "svc-radar__dot--q" },
    h: { r: 6, cls: "svc-radar__dot--h" },
    f: { r: 7, cls: "svc-radar__dot--f" },
  };

  return (
    <svg viewBox="0 0 470 440" xmlns="http://www.w3.org/2000/svg">
      <circle cx={R.cx} cy={R.cy} r={R.quarter} className="svc-radar__zone svc-radar__zone--q" />
      <circle cx={R.cx} cy={R.cy} r={R.half} className="svc-radar__zone svc-radar__zone--h" />
      <circle cx={R.cx} cy={R.cy} r={R.full} className="svc-radar__zone svc-radar__zone--f" />

      {[0, 45, 90, 135].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={R.cx - R.quarter * Math.cos(rad)}
            y1={R.cy - R.quarter * Math.sin(rad)}
            x2={R.cx + R.quarter * Math.cos(rad)}
            y2={R.cy + R.quarter * Math.sin(rad)}
            className="svc-radar__spoke"
          />
        );
      })}

      <g className="svc-radar__sweep-g">
        <path
          d={`M ${R.cx} ${R.cy} L ${R.cx + R.quarter} ${R.cy} A ${R.quarter} ${R.quarter} 0 0 0 ${
            R.cx + R.quarter * Math.cos(-0.5)
          } ${R.cy + R.quarter * Math.sin(-0.5)} Z`}
          className="svc-radar__sweep"
        />
      </g>

      <circle cx={R.cx} cy={R.cy} r={R.quarter} className="svc-radar__ring" />
      <circle cx={R.cx} cy={R.cy} r={R.half} className="svc-radar__ring" />
      <circle cx={R.cx} cy={R.cy} r={R.full} className="svc-radar__ring" />

      {[
        { r: R.quarter, t: "150 m" },
        { r: R.half, t: "75 m" },
        { r: R.full, t: "20 m" },
      ].map(({ r, t }) => {
        const rad = (-35 * Math.PI) / 180;
        const x = R.cx + (r + 16) * Math.cos(rad);
        const y = R.cy + (r + 16) * Math.sin(rad);
        const x0 = R.cx + r * Math.cos(rad);
        const y0 = R.cy + r * Math.sin(rad);
        return (
          <g key={t}>
            <line x1={x0} y1={y0} x2={x} y2={y} className="svc-radar__tick" />
            <text x={x + 4} y={y + 3} className="svc-radar__meter">
              {t}
            </text>
          </g>
        );
      })}

      <text x={R.cx} y={34} className="svc-radar__frac svc-radar__frac--q">¼</text>
      <text x={R.cx} y={98} className="svc-radar__frac svc-radar__frac--h">½</text>
      <text x={R.cx} y={162} className="svc-radar__frac svc-radar__frac--f">1</text>

      <line x1={48} y1={392} x2={182} y2={253} className="svc-radar__dispatch" />

      <g className="svc-radar__station">
        <rect x={20} y={382} width={56} height={22} rx={3} />
        <text x={48} y={397} className="svc-radar__station-t">METRO</text>
      </g>
      <image
        href={metroLogoUrl}
        x={34}
        y={352}
        width={28}
        height={28}
        preserveAspectRatio="xMidYMid meet"
      />

      {dots.map(({ id, x, y, zone }) => (
        <circle
          key={id}
          cx={x}
          cy={y}
          r={dotStyle[zone].r}
          className={`svc-radar__dot ${dotStyle[zone].cls}`}
        />
      ))}

      <image
        href={rickshawUrl}
        x={-15}
        y={-15}
        width={30}
        height={30}
        className="svc-radar__rickshaw"
        preserveAspectRatio="xMidYMid meet"
        transform={`translate(${r1[0]} ${r1[1]}) scale(-1 1)`}
      />
      <image
        href={rickshawUrl}
        x={-14}
        y={-14}
        width={28}
        height={28}
        className="svc-radar__rickshaw"
        preserveAspectRatio="xMidYMid meet"
        transform={`translate(${r2[0]} ${r2[1]}) scale(-1 1)`}
      />

      <g className="svc-radar__pole">
        <circle cx={R.cx} cy={R.cy} r={9} />
        <circle cx={R.cx} cy={R.cy} r={3.5} className="svc-radar__pole-core" />
        <text x={R.cx} y={R.cy + 26} className="svc-radar__pole-t">POLE</text>
      </g>
    </svg>
  );
}

export function StoryChip({ label, status }) {
  return (
    <span className="svc-chip" data-status={status}>
      <span className="svc-chip__dot" aria-hidden="true" />
      <span className="svc-chip__label">{label}</span>
      <span className="svc-chip__status">{status}</span>
    </span>
  );
}
