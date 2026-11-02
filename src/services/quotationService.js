import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../constants';
import { quotationFromDoc, quotationToMap } from '../models/quotation';

const col = () => collection(db, COLLECTIONS.quotations);

export async function createQuotation(q) {
  const ref = await addDoc(col(), quotationToMap(q));
  return ref.id;
}
export const updateQuotation = (id, q) => updateDoc(doc(db, COLLECTIONS.quotations, id), quotationToMap(q));
export const deleteQuotation = (id) => deleteDoc(doc(db, COLLECTIONS.quotations, id));

export async function getQuotation(id) {
  const snap = await getDoc(doc(db, COLLECTIONS.quotations, id));
  return snap.exists() ? quotationFromDoc(snap.data(), snap.id) : null;
}

const mapSnap = (snap) => snap.docs.map((d) => quotationFromDoc(d.data(), d.id));

export function watchAllQuotations(cb, onError) {
  return onSnapshot(query(col(), orderBy('quotationDate', 'desc')), (s) => cb(mapSnap(s)), onError);
}

export function watchEmployeeQuotations(uid, cb, onError) {
  return onSnapshot(
    query(col(), where('createdByUid', '==', uid), orderBy('quotationDate', 'desc')),
    (s) => cb(mapSnap(s)),
    onError,
  );
}
