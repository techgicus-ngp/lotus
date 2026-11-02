import { GARDEN_CLUBHOUSE_MAP_ID, PLOTS_ON_12M_ROAD } from '../constants';

// ── Palette (from the Flutter `_AC` class) ────────────────────────────────
export const AC = {
  primary: '#1A73E8',
  surface: '#F8F9FA',
  border: '#E0E0E0',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B7280',
  available: '#DFB694',
  token: '#E0A33C',
  partialPayment: '#C97A3C',
  agreement: '#4F7A3B',
  sold: '#A9543F',
  rlApproved: '#16A34A',
  rlPending: '#9CA3AF',
  hi12m: '#8B5CF6',
  hi9m: '#06B6D4',
  plotTones: ['#DFB694', '#CB9E7F'],
  plotBorder: '#9A6E52',
  roadFill: '#15181D',
  openSpaceFill: '#6E9B3E',
  openSpaceBorder: '#54782F',
  amenityFill: '#3E86C4',
  amenityBorder: '#2F679A',
  utilityFill: '#4E6A8C',
  utilityBorder: '#3B5169',
  canvas: '#15181D',
  roadLabelInk: '#C9CED4',
  openSpaceInk: '#F2F6EC',
  amenityInk: '#EDF4FB',
  utilityInk: '#EDF2F8',
  selected: '#9C36B5',
};

export const STATUS_LEGEND = [
  [AC.available, 'Available'],
  [AC.token, 'Token'],
  [AC.partialPayment, 'Partial Payment'],
  [AC.agreement, 'Agreement'],
  [AC.sold, 'Sold'],
];

// ── Status helpers ────────────────────────────────────────────────────────
export function normalizeStatus(status = '') {
  switch (status.toLowerCase()) {
    case 'booked': case 'token': return 'Token';
    case 'reserved': case 'partial payment': return 'Partial Payment';
    case 'agreement': return 'Agreement';
    case 'sold': return 'Sold';
    default: return 'Available';
  }
}
export const isTokenStatus = (s = '') => ['token', 'booked'].includes(s.toLowerCase());

export function statusColor(s = '') {
  switch (s.toLowerCase()) {
    case 'available': return AC.available;
    case 'token': case 'booked': return AC.token;
    case 'partial payment': case 'reserved': return AC.partialPayment;
    case 'agreement': return AC.agreement;
    case 'sold': return AC.sold;
    default: return AC.primary;
  }
}

/** Is the colour light enough that dark text/icons are needed on it? */
export function isLightColor(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.6;
}

// RL ("approval") status is stored in the plot's `contactPhone` field.
export function rlStatusOf(plot) {
  const v = (plot.contactPhone ?? '').trim().toLowerCase();
  return ['approved', 'pending', 'rejected'].includes(v) ? v : 'pending';
}
export const rlLabel = (p) => ({ approved: 'Approved', rejected: 'Rejected', pending: 'Pending' })[rlStatusOf(p)];
export const rlColor = (p) =>
  ({ approved: AC.rlApproved, rejected: AC.sold, pending: AC.rlPending })[rlStatusOf(p)];

// ── Kind helpers ──────────────────────────────────────────────────────────
export const isAmenitySpaceTitle = (p) => {
  const t = p.title.toLowerCase().trim();
  return t.includes('aminity space') || t.includes('amenity space');
};
export const isAmenityPlot = (p) =>
  p.type === 'amenity' || p.type === 'open_space.Amenityspace' || isAmenitySpaceTitle(p) ||
  (p.type === 'open_space' && p.title.toLowerCase().includes('amenity'));
export const isGardenPlot = (p) =>
  (p.type === 'open_space' || p.type === 'grass_open_space') && !isAmenityPlot(p);
export const isEssPlot = (p) => p.type === 'space for ESS' || p.type === 'open_space.SpaceforESS';
export const isStpPlot = (p) => p.type === 'space for STP' || p.type === 'open_space.SpaceforSTP';
export const isOpenSpaceType = (p) => p.type === 'open_space' || p.type === 'grass_open_space';

export const is12mRoadPlot = (plot) => PLOTS_ON_12M_ROAD.has(plot.plotNo);
export const detectRoadWidth = (road) => (`${road.title} ${road.srNo}`.toLowerCase().includes('12') ? '12m' : '9m');

export function roadLabelText(road) {
  const t = `${road.title} ${road.srNo}`.toLowerCase();
  const m = t.match(/(\d+(\.\d+)?)/);
  const width = m ? m[1] : detectRoadWidth(road) === '12m' ? '12' : '9';
  if (t.includes('highway')) return `${width} Meter Wide State Highway`;
  if (t.includes('service')) return `${width} Meter Wide Service Road`;
  return `${width} Meter Wide Road`;
}

export function fallbackKindName(p) {
  if (isAmenityPlot(p)) return 'AMENITY SPACE';
  if (isStpPlot(p)) return 'WWTP';
  if (isEssPlot(p)) return 'UTILITY';
  return 'OPEN SPACE';
}

// ── Colours used on the map ───────────────────────────────────────────────
function availableTone(p) {
  const key = p.plotNo || p.srNo;
  const n = parseInt((key.match(/\d+/) ?? ['0'])[0], 10) || 0;
  return AC.plotTones[n % AC.plotTones.length];
}
function statusFill(p) {
  switch (p.status.toLowerCase()) {
    case 'token': case 'booked': return AC.token;
    case 'partial payment': case 'reserved': return AC.partialPayment;
    case 'agreement': return AC.agreement;
    case 'sold': return AC.sold;
    default: return availableTone(p);
  }
}

export function plotFillColor(p, mapId) {
  if (p.type === 'road') return AC.roadFill;
  if (mapId === GARDEN_CLUBHOUSE_MAP_ID) {
    if (isAmenityPlot(p)) return '#A1887F'; // clubhouse
    if (isGardenPlot(p)) return '#4CAF50'; // garden grass
  }
  if (isAmenityPlot(p)) return AC.amenityFill;
  if (isStpPlot(p)) return AC.utilityFill;
  if (isEssPlot(p)) return '#6B5B8C';
  if (isOpenSpaceType(p)) return AC.openSpaceFill;
  return statusFill(p);
}

export function defaultBorderColor(p) {
  if (p.type === 'road') return AC.roadFill;
  if (isAmenityPlot(p)) return AC.amenityBorder;
  if (isStpPlot(p) || isEssPlot(p)) return AC.utilityBorder;
  if (isOpenSpaceType(p)) return AC.openSpaceBorder;
  return AC.plotBorder;
}

export function labelInkFor(p) {
  if (isAmenityPlot(p)) return AC.amenityInk;
  if (isStpPlot(p) || isEssPlot(p)) return AC.utilityInk;
  return AC.openSpaceInk;
}

// Draw order: big background areas first, roads next, plots on top.
export function kindDrawOrder(type) {
  if (type === 'road') return 1;
  if (type === 'plot') return 3;
  return 0;
}

// ── Geometry ──────────────────────────────────────────────────────────────
export function boundsOf(plots) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of plots) for (const c of p.corners) {
    minLat = Math.min(minLat, c.lat); maxLat = Math.max(maxLat, c.lat);
    minLng = Math.min(minLng, c.lng); maxLng = Math.max(maxLng, c.lng);
  }
  if (minLat > maxLat) return null;
  return { south: minLat, west: minLng, north: maxLat, east: maxLng };
}
