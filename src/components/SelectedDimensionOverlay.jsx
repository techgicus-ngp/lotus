import { memo, useMemo } from "react";
import { SQFT } from "../utils/planGeometry";

const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";
const MAPFONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/* ── CAD Dimension Overlay for Selected Plot (Groups curved corner segments) ── */
const SelectedDimensionOverlay = memo(function SelectedDimensionOverlay({
  feature,
}) {
  const geom = useMemo(() => {
    if (!feature || !feature.pts || feature.pts.length < 3) return null;
    const { pts, cx, cy, ir, raw } = feature;
    const scale = 1.25;
    const off = (0.55 + ir * 0.03) * scale;
    const txt = Math.max(0.65, Math.min(ir * 0.18, 1.35)) * scale;
    const tick = txt * 0.65;
    const hair = 0.06 * scale;

    const numSize = Math.max(1.4, Math.min(ir * 0.34, 3.6));
    const sqmSize = numSize * 0.38;
    const sqftSize = numSize * 0.46;

    // 1. Build raw segments and detect short curve facets (< 2.4m)
    const CURVE_SEG_THRESHOLD = 2.4;
    const rawSegs = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (len < 0.05) continue; // ignore duplicate vertices
      rawSegs.push({ p1, p2, len, isCurvePart: len < CURVE_SEG_THRESHOLD });
    }

    // Rotate array so we start on a main straight edge (if one exists)
    // This prevents a corner curve that wraps around index 0 from being split in two
    const firstMainIdx = rawSegs.findIndex((s) => !s.isCurvePart);
    const orderedSegs =
      firstMainIdx > 0
        ? [...rawSegs.slice(firstMainIdx), ...rawSegs.slice(0, firstMainIdx)]
        : rawSegs;

    // 2. Merge consecutive short curve segments into a single arc group
    const mergedGroups = [];
    let i = 0;
    while (i < orderedSegs.length) {
      if (!orderedSegs[i].isCurvePart) {
        mergedGroups.push([orderedSegs[i]]);
        i++;
      } else {
        const group = [];
        while (i < orderedSegs.length && orderedSegs[i].isCurvePart) {
          group.push(orderedSegs[i]);
          i++;
        }
        mergedGroups.push(group);
      }
    }

    // 3. Create clean dimension lines (1 per straight side, 1 combined arc per rounded corner)
    const edges = [];
    mergedGroups.forEach((group, gIdx) => {
      const totalLen = group.reduce((sum, s) => sum + s.len, 0);
      if (totalLen < 0.8) return; // skip tiny noise chamfers

      const p1 = group[0].p1;
      const p2 = group[group.length - 1].p2;
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const chordLen = Math.hypot(dx, dy);
      if (chordLen < 0.4) return;

      const ux = dx / chordLen;
      const uy = dy / chordLen;

      // For a multi-segment curve, anchor the label above the middle vertex of the curve
      const midSeg = group[Math.floor(group.length / 2)];
      const mx =
        group.length > 1
          ? (midSeg.p1[0] + midSeg.p2[0]) / 2
          : (p1[0] + p2[0]) / 2;
      const my =
        group.length > 1
          ? (midSeg.p1[1] + midSeg.p2[1]) / 2
          : (p1[1] + p2[1]) / 2;

      let nx = -uy;
      let ny = ux;
      if (nx * (mx - cx) + ny * (my - cy) < 0) {
        nx = -nx;
        ny = -ny;
      }

      // Offset each curve vertex outward so the dashed dimension line follows the curve smoothly
      const arcPts = [group[0].p1, ...group.map((s) => s.p2)].map(
        ([px, py]) => {
          const vx = px - cx;
          const vy = py - cy;
          const vl = Math.hypot(vx, vy) || 1;
          const onx = group.length > 1 ? vx / vl : nx;
          const ony = group.length > 1 ? vy / vl : ny;
          return [px + onx * off, py + ony * off];
        },
      );

      const a = arcPts[0];
      const b = arcPts[arcPts.length - 1];
      const arcD = arcPts
        .map(
          (pt, idx) =>
            `${idx === 0 ? "M" : "L"}${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`,
        )
        .join(" ");

      const lx = mx + nx * (off + txt * 0.85);
      const ly = my + ny * (off + txt * 0.85);

      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;

      edges.push({
        key: `edge-${gIdx}`,
        p1,
        p2,
        a,
        b,
        arcD,
        kx: nx * tick * 0.5,
        ky: ny * tick * 0.5,
        lx,
        ly,
        deg,
        label: `${totalLen.toFixed(2)} m`,
      });
    });

    const areaNum = Number(raw.area) || 0;
    const areaSqFt = Number(raw.areaSqFt) || areaNum * SQFT;

    return {
      cx,
      cy,
      txt,
      hair,
      numSize,
      sqmSize,
      sqftSize,
      edges,
      title: raw.type === "plot" ? raw.plotNo : raw.title,
      sqmLabel: `${areaNum.toFixed(1)} m²`,
      sqftLabel: `${Math.round(areaSqFt).toLocaleString("en-IN")} ft²`,
    };
  }, [feature]);

  if (!geom) return null;
  const {
    cx,
    cy,
    txt,
    hair,
    numSize,
    sqmSize,
    sqftSize,
    edges,
    title,
    sqmLabel,
    sqftLabel,
  } = geom;

  return (
    <g style={{ pointerEvents: "none" }}>
      {edges.map((r) => (
        <g key={r.key}>
          <line
            x1={r.p1[0]}
            y1={r.p1[1]}
            x2={r.a[0]}
            y2={r.a[1]}
            stroke="#FFFFFF"
            strokeWidth={hair}
            strokeDasharray={`${hair * 4} ${hair * 3}`}
            opacity="0.78"
          />
          <line
            x1={r.p2[0]}
            y1={r.p2[1]}
            x2={r.b[0]}
            y2={r.b[1]}
            stroke="#FFFFFF"
            strokeWidth={hair}
            strokeDasharray={`${hair * 4} ${hair * 3}`}
            opacity="0.78"
          />
          <path
            d={r.arcD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={hair * 1.15}
            strokeDasharray={`${hair * 5} ${hair * 3}`}
            opacity="0.95"
          />
          <line
            x1={r.a[0] - r.kx}
            y1={r.a[1] - r.ky}
            x2={r.a[0] + r.kx}
            y2={r.a[1] + r.ky}
            stroke="#FFFFFF"
            strokeWidth={hair * 1.5}
          />
          <line
            x1={r.b[0] - r.kx}
            y1={r.b[1] - r.ky}
            x2={r.b[0] + r.kx}
            y2={r.b[1] + r.ky}
            stroke="#FFFFFF"
            strokeWidth={hair * 1.5}
          />
          <text
            x={r.lx}
            y={r.ly}
            transform={`rotate(${r.deg} ${r.lx} ${r.ly})`}
            textAnchor="middle"
            dy="0.35em"
            fontFamily={MONO}
            fontSize={txt}
            fontWeight="700"
            fill="#FFFFFF"
            stroke="#15181D"
            strokeWidth={txt * 0.22}
            paintOrder="stroke"
          >
            {r.label}
          </text>
        </g>
      ))}

      <text
        x={cx}
        y={cy - numSize * 0.52}
        textAnchor="middle"
        dy="0.35em"
        fontFamily={MAPFONT}
        fontSize={numSize}
        fontWeight="800"
        fill="#FFFFFF"
        stroke="rgba(21,24,29,0.65)"
        strokeWidth={numSize * 0.12}
        paintOrder="stroke"
      >
        {title}
      </text>
      <text
        x={cx}
        y={cy + numSize * 0.35}
        textAnchor="middle"
        dy="0.35em"
        fontFamily={MONO}
        fontSize={sqmSize}
        fontWeight="600"
        fill="#F3E8FF"
      >
        {sqmLabel}
      </text>
      <text
        x={cx}
        y={cy + numSize * 0.92}
        textAnchor="middle"
        dy="0.35em"
        fontFamily={MONO}
        fontSize={sqftSize}
        fontWeight="700"
        fill="#FFFFFF"
      >
        {sqftLabel}
      </text>
    </g>
  );
});

export default SelectedDimensionOverlay;