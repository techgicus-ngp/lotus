import { addDoc, collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { COLLECTIONS } from '../constants';
import { siteVisitFromDoc } from '../models/siteVisit';

const col = () => collection(db, COLLECTIONS.siteVisits);

/** Uploads the selfie to `site_visits/{uid}/{timestamp}.jpg` and returns its download URL. */
export async function uploadSelfie(employeeUid, blob) {
  const r = ref(storage, `site_visits/${employeeUid}/${Date.now()}.jpg`);
  await uploadBytes(r, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(r);
}

export async function createSiteVisit(v) {
  const ref = await addDoc(col(), {
    mapId: v.mapId, projectName: v.projectName, plotNo: v.plotNo, plotStatus: v.plotStatus,
    selfieUrl: v.selfieUrl ?? '', selfieBase64: v.selfieBase64 ?? '',
    address: v.address, latitude: v.latitude, longitude: v.longitude,
    employeeUid: v.employeeUid, employeeName: v.employeeName,
    visitDate: v.visitDate.toISOString(),
  });
  return ref.id;
}

const mapSnap = (s) => s.docs.map((d) => siteVisitFromDoc(d.data(), d.id));

export function watchEmployeeSiteVisits(uid, cb, onError) {
  return onSnapshot(
    query(col(), where('employeeUid', '==', uid), orderBy('visitDate', 'desc')),
    (s) => cb(mapSnap(s)), onError,
  );
}
export function watchAllSiteVisits(cb, onError) {
  return onSnapshot(query(col(), orderBy('visitDate', 'desc')), (s) => cb(mapSnap(s)), onError);
}
