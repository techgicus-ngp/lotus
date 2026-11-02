import { collection, doc, documentId, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ALLOWED_MAP_IDS, COLLECTIONS } from '../constants';
import { plotFromDoc } from '../models/plot';

/** The maps employees/guests may browse (skips ones where isEnabled === false). */
export async function loadAllowedMaps() {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.maps), where(documentId(), 'in', ALLOWED_MAP_IDS)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => m.isEnabled !== false);
}

export async function getMap(id) {
  const snap = await getDoc(doc(db, COLLECTIONS.maps, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Live-updates when another user changes the map (e.g. books a plot). */
export const watchMap = (id, cb) =>
  onSnapshot(doc(db, COLLECTIONS.maps, id), (s) => s.exists() && cb({ id: s.id, ...s.data() }));

/**
 * Finds a plot by plotNo (or srNo) inside a map — first in the `plots`
 * sub-collection, then in the map doc's embedded `plots[]` array.
 */
export async function findPlotInMap(mapId, mapData, term) {
  const q = term.trim().toLowerCase();
  const sub = await getDocs(collection(db, COLLECTIONS.maps, mapId, 'plots'));
  for (const d of sub.docs) {
    const data = d.data();
    if (String(data.plotNo ?? '').toLowerCase() === q || String(data.srNo ?? '').toLowerCase() === q) {
      return plotFromDoc(data, d.id);
    }
  }
  for (const p of mapData?.plots ?? []) {
    if (String(p.plotNo ?? '').toLowerCase() === q) return plotFromDoc(p);
  }
  return null;
}

/** Searches every map for a plot. Returns { plot, mapId, mapName } or null. */
export async function findPlotAnywhere(term) {
  const maps = await getDocs(collection(db, COLLECTIONS.maps));
  for (const m of maps.docs) {
    const plot = await findPlotInMap(m.id, m.data(), term);
    if (plot) return { plot, mapId: m.id, mapName: m.data().name ?? m.id };
  }
  return null;
}
