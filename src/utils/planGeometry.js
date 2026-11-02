// Local-metre geometry + CAD helpers for the SVG masterplan overlay.
// (Lifted from the existing MapViewer implementation.)

export const SQFT = 10.7639104;

/** Bounding box of an array of {lat, lng} points. */
export function getBounds(pts) {
  if (!pts || !pts.length) return null;
  let south = 90, north = -90, west = 180, east = -180;
  for (const p of pts) {
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
  }
  return { south, north, west, east };
}

/* ── Self-Contained Local Meter Geometry & CAD Helpers ─────────────── */

export function createLocalProjection(originLat, originLng) {
  const R = 6378137;
  const cosLat = Math.cos((originLat * Math.PI) / 180);
  return {
    toMeters(lat, lng) {
      const x = ((lng - originLng) * Math.PI * R * cosLat) / 180;
      const y = -((lat - originLat) * Math.PI * R) / 180;
      return [x, y];
    },
    toLatLng(x, y) {
      const lat = originLat - (y * 180) / (Math.PI * R);
      const lng = originLng + (x * 180) / (Math.PI * R * cosLat);
      return { lat, lng };
    },
  };
}

export function ptsToPath(pts) {
  if (!pts || pts.length < 3) return "";
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  return `${d}Z`;
}

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function computeFeatureMetrics(pts) {
  if (!pts || pts.length < 3) {
    return { cx: 0, cy: 0, ir: 4, angle: 0 };
  }
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  // Shoelace Area Centroid so rounded corner plots with 25+ curve vertices stay dead-center
  let area2 = 0;
  let sx = 0;
  let sy = 0;

  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    if (x1 < minX) minX = x1;
    if (x1 > maxX) maxX = x1;
    if (y1 < minY) minY = y1;
    if (y1 > maxY) maxY = y1;

    const cross = x1 * y2 - x2 * y1;
    area2 += cross;
    sx += (x1 + x2) * cross;
    sy += (y1 + y2) * cross;
  }

  const bw = maxX - minX;
  const bh = maxY - minY;
  const cx = Math.abs(area2) > 1e-4 ? sx / (3 * area2) : (minX + maxX) / 2;
  const cy = Math.abs(area2) > 1e-4 ? sy / (3 * area2) : (minY + maxY) / 2;

  let ir = Infinity;
  let longestLen = 0;
  let longestAngle = 0;

  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const d = distToSeg(cx, cy, x1, y1, x2, y2);
    if (d < ir) ir = d;

    const segLen = Math.hypot(x2 - x1, y2 - y1);
    if (segLen > longestLen) {
      longestLen = segLen;
      let deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      longestAngle = deg;
    }
  }

  const boxIr = Math.min(bw, bh) * 0.42;
  const safeIr =
    Number.isFinite(ir) && ir > 1.5
      ? Math.max(ir, boxIr * 0.85)
      : Math.max(2.2, boxIr);

  return { cx, cy, ir: safeIr, angle: longestAngle };
}

/* ── Road Label Placement ──────────────────────────────────────────────
   A road polygon can be long, bent, or run into a junction, so its centroid often lands
   on a junction or off the road's own axis, and neighbouring labels then collide.
   Instead: find the road's direction, slide the label along it, and take the straightest
   stretch (not a junction) where the whole label fits inside the road, clear of plots and
   of labels already placed. If nothing fits, the label is skipped rather than overlapping. */
const ROAD_GLYPH_W = 0.7; // average glyph advance (em) for bold uppercase + tracking
const roadTextLength = (text, size) => text.length * size * ROAD_GLYPH_W;

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* Direction of the road: principal axis of its outline (radians, along the road) */
function roadAxisAngle(pts) {
  let n = 0;
  let mx = 0;
  let my = 0;
  const samples = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 1.5));
    for (let k = 0; k < steps; k++) {
      const x = x1 + ((x2 - x1) * k) / steps;
      const y = y1 + ((y2 - y1) * k) / steps;
      samples.push([x, y]);
      mx += x;
      my += y;
      n++;
    }
  }
  mx /= n;
  my /= n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of samples) {
    sxx += (x - mx) * (x - mx);
    syy += (y - my) * (y - my);
    sxy += (x - mx) * (y - my);
  }
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

function labelBox(cx, cy, len, hgt, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const hx = len / 2;
  const hy = hgt / 2;
  return [
    [-hx, -hy],
    [hx, -hy],
    [hx, hy],
    [-hx, hy],
  ].map(([u, v]) => [cx + u * c - v * s, cy + u * s + v * c]);
}

/* Separating-axis test for two convex quads, with a clearance margin */
function boxesOverlap(a, b, margin) {
  for (const q of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = q[i];
      const [x2, y2] = q[(i + 1) % 4];
      const nx = y1 - y2;
      const ny = x2 - x1;
      const l = Math.hypot(nx, ny) || 1;
      let aMin = Infinity;
      let aMax = -Infinity;
      let bMin = Infinity;
      let bMax = -Infinity;
      for (const [x, y] of a) {
        const d = (x * nx + y * ny) / l;
        if (d < aMin) aMin = d;
        if (d > aMax) aMax = d;
      }
      for (const [x, y] of b) {
        const d = (x * nx + y * ny) / l;
        if (d < bMin) bMin = d;
        if (d > bMax) bMax = d;
      }
      if (aMax + margin < bMin || bMax + margin < aMin) return false;
    }
  }
  return true;
}

/**
 * @param roads  [{ key, pts, label }]
 * @param plots  [{ pts }]  polygons a label must not run over
 * @returns Map(key -> { x, y, angle (deg), size })
 */
export function placeRoadLabels(roads, plots) {
  const plotIndex = plots.map((p) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of p.pts) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    return { pts: p.pts, x0, y0, x1, y1 };
  });
  const onPlot = (x, y) =>
    plotIndex.some(
      (p) =>
        x >= p.x0 &&
        x <= p.x1 &&
        y >= p.y0 &&
        y <= p.y1 &&
        pointInPoly(x, y, p.pts),
    );

  // Prepare each road: axis, polygon in (u along, v across) coordinates, widths along it
  const prepared = [];
  for (const r of roads) {
    if (!r.label || !r.pts || r.pts.length < 3) continue;
    const ang = roadAxisAngle(r.pts);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const uv = r.pts.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
    let uMin = Infinity;
    let uMax = -Infinity;
    for (const [u] of uv) {
      if (u < uMin) uMin = u;
      if (u > uMax) uMax = u;
    }
    const length = uMax - uMin;
    if (length < 3) continue;
    const step = Math.max(0.75, length / 140);
    const slices = [];
    for (let u = uMin + step; u < uMax - step * 0.5; u += step) {
      const vs = [];
      for (let i = 0; i < uv.length; i++) {
        const [u1, v1] = uv[i];
        const [u2, v2] = uv[(i + 1) % uv.length];
        if (u1 !== u2 && u1 <= u !== u2 <= u)
          vs.push(v1 + ((u - u1) * (v2 - v1)) / (u2 - u1));
      }
      vs.sort((a, b) => a - b);
      let best = null;
      for (let i = 0; i + 1 < vs.length; i += 2) {
        const w = vs[i + 1] - vs[i];
        if (!best || w > best.w) best = { w, vm: (vs[i] + vs[i + 1]) / 2 };
      }
      if (best && best.w > 0.5) slices.push({ u, ...best });
    }
    if (!slices.length) continue;
    const widths = slices.map((q) => q.w).sort((a, b) => a - b);
    const wMed = widths[Math.floor(widths.length / 2)];
    prepared.push({ r, ang, c, s, uMin, uMax, slices, wMed, length });
  }
  // Main roads first, so they get the best spots
  prepared.sort((a, b) => b.wMed - a.wMed || b.length - a.length);

  const placed = [];
  const out = new Map();

  for (const p of prepared) {
    const { r, ang, c, s, uMin, uMax, slices, wMed } = p;
    const uMid = (uMin + uMax) / 2;
    const base = Math.min(Math.max(wMed * 0.21, 1.15), 2.4);

    for (const size of [base, base * 0.85, base * 0.72]) {
      if (size < 1.0) break;
      const len = roadTextLength(r.label, size) * 3.04;
      const hgt = size * 2.3;

      // Straight stretches only (no junction bulges), label must fit across the road
      const cands = slices
        .filter((q) => q.w >= hgt + 0.9 && q.w <= wMed * 1.3 + 0.4)
        .map((q) => ({ ...q, d: Math.abs(q.u - uMid) }))
        .sort((a, b) => a.d - b.d);

      for (const q of cands) {
        const cx = q.u * c - q.vm * s;
        const cy = q.u * s + q.vm * c;
        const box = labelBox(cx, cy, len, hgt + 0.5, ang);

        // 1) the whole label inside this road
        let inside = true;
        for (let i = 0; i <= 8 && inside; i++) {
          for (let j = 0; j <= 2; j++) {
            const u = -len / 2 + (len * i) / 8;
            const v = -(hgt + 0.5) / 2 + ((hgt + 0.5) * j) / 2;
            if (
              !pointInPoly(
                cx + u * Math.cos(ang) - v * Math.sin(ang),
                cy + u * Math.sin(ang) + v * Math.cos(ang),
                r.pts,
              )
            ) {
              inside = false;
              break;
            }
          }
        }
        if (!inside) continue;

        // 2) not over any plot
        let hitsPlot = false;
        for (let i = 0; i <= 8 && !hitsPlot; i++) {
          for (let j = 0; j <= 2; j++) {
            const u = -len / 2 + (len * i) / 8;
            const v = -(hgt + 0.5) / 2 + ((hgt + 0.5) * j) / 2;
            if (
              onPlot(
                cx + u * Math.cos(ang) - v * Math.sin(ang),
                cy + u * Math.sin(ang) + v * Math.cos(ang),
              )
            ) {
              hitsPlot = true;
              break;
            }
          }
        }
        if (hitsPlot) continue;

        // 3) not touching a label already placed
        if (placed.some((b) => boxesOverlap(box, b, 1.0))) continue;

        placed.push(box);
        let deg = (ang * 180) / Math.PI;
        if (deg > 90) deg -= 180;
        if (deg <= -90) deg += 180;
        out.set(r.key, { x: cx, y: cy, angle: deg, size });
        break;
      }
      if (out.has(r.key)) break;
    }
  }
  return out;
}