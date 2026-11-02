const SQM_TO_SQFT = 10.7639;

// Legacy plot docs sometimes store plotNo as a list/map, or with wrapping
// brackets ("[88]") or a "Plot " prefix ("Plot 200"). Normalise to a bare string.
function stripWrappingBrackets(s) {
  if (s.length < 2) return s;
  const pairs = { '[': ']', '{': '}', '(': ')' };
  const closing = pairs[s[0]];
  if (closing && s[s.length - 1] === closing) return s.slice(1, -1).trim();
  return s;
}

function stripPlotPrefix(s) {
  const stripped = s.replace(/^plot\s*[-:.]?\s*/i, '').trim();
  return stripped || s;
}

export function asPlotNo(v) {
  let s;
  if (v == null) s = '';
  else if (typeof v === 'string') s = v;
  else if (typeof v === 'number') s = String(v);
  else if (Array.isArray(v)) {
    s = v.filter((e) => e != null && String(e).trim()).map((e) => String(e).trim()).join('/');
  } else if (typeof v === 'object') {
    const c = v.plotNo ?? v.value ?? v.no;
    s = c != null ? String(c) : '';
  } else s = String(v);
  return stripPlotPrefix(stripWrappingBrackets(s.trim()));
}

const toLatLng = (o) => ({ lat: Number(o.lat), lng: Number(o.lng) });

/** Builds a plot object from a Firestore map's `plots[]` entry (or plots subcollection doc). */
export function plotFromDoc(data, id = null) {
  const area = Number(data.area) || 0;
  return {
    firestoreId: id,
    srNo: data.srNo ?? '',
    plotId: Number(data.plotId) || 0,
    plotNo: asPlotNo(data.plotNo),
    title: data.title ?? '',
    corners: (data.corners ?? []).map(toLatLng),
    status: data.status ?? 'Available',
    area, // square metres
    areaSqFt: data.areaSqFt != null ? Number(data.areaSqFt) : area * SQM_TO_SQFT,
    dimensions: data.dimensions ?? '',
    center: data.center ? toLatLng(data.center) : { lat: 0, lng: 0 },
    labelPosition: data.labelPosition ? toLatLng(data.labelPosition) : null,
    ownerName: data.ownerName ?? '',
    contactPhone: data.contactPhone ?? '', // doubles as the "RL status" field
    contactEmail: data.contactEmail ?? '',
    notes: data.notes ?? '',
    type: data.type ?? 'plot',
    facing: data.facing ?? 'North',
  };
}
