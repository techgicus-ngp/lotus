import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SESSION_KEY } from '../constants';
import { userFromDoc, isAdmin, isGuest } from '../models/user';

const users = () => collection(db, COLLECTIONS.users);

async function ensureAccount({ email, password, name, role }) {
  const snap = await getDocs(query(users(), where('email', '==', email), limit(1)));
  if (!snap.empty) return;
  const ref = doc(users());
  await setDoc(ref, {
    uid: ref.id, email, password, name, groupName: '', role,
    createdDate: new Date().toISOString(),
    isAccessGranted: true,
  });
}

/** Seeds the default admin + guest accounts on first launch. */
export async function ensureAdminExists() {
  await ensureAccount({ email: 'admin@gmail.com', password: 'admin@1223', name: 'Admin', role: 'admin' });
  await ensureAccount({ email: 'lotusvencon@guest.com', password: 'guest@pass', name: 'Guest', role: 'guest' });
}

const canLogin = (u) => isAdmin(u) || isGuest(u) || u.isAccessGranted;

export const saveSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

/** Restores a saved session, re-validated against Firestore. */
export async function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  let uid;
  try { uid = JSON.parse(raw)?.uid; } catch { uid = null; }
  if (!uid) { clearSession(); return null; }

  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) { clearSession(); return null; }
  const user = userFromDoc(snap.data(), snap.id);
  if (!canLogin(user)) { clearSession(); return null; }
  return user;
}

export async function signIn(email, password) {
  const snap = await getDocs(
    query(users(), where('email', '==', email.trim()), where('password', '==', password.trim()), limit(1)),
  );
  if (snap.empty) throw new Error('Invalid email or password.');
  const user = userFromDoc(snap.docs[0].data(), snap.docs[0].id);
  if (!canLogin(user)) throw new Error('Access not granted. Please contact your administrator.');
  saveSession(user);
  return user;
}

export async function registerEmployee({ email, name, groupName = '', password }) {
  const existing = await getDocs(query(users(), where('email', '==', email.trim()), limit(1)));
  if (!existing.empty) throw new Error('Email already registered.');
  const ref = doc(users());
  const user = {
    uid: ref.id, email: email.trim(), name: name.trim(), groupName: groupName.trim(),
    password: password.trim(), role: 'employee',
    createdDate: new Date().toISOString(),
    isAccessGranted: false, // blocked until an admin grants access
  };
  await setDoc(ref, user);
  return user;
}

export const setEmployeeAccess = (uid, granted) =>
  updateDoc(doc(db, COLLECTIONS.users, uid), { isAccessGranted: granted });

export const deleteEmployee = (uid) => deleteDoc(doc(db, COLLECTIONS.users, uid));

export function signOut() {
  clearSession();
}

export function watchEmployees(cb) {
  return onSnapshot(query(users(), where('role', '==', 'employee')), (snap) =>
    cb(snap.docs.map((d) => userFromDoc(d.data(), d.id))),
  );
}
