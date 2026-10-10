// Stockage des enregistrements audio liés aux cantiques.
//  - Mode « firebase » : sons partagés (Firestore + Storage), avec modération.
//  - Mode « local »    : sons conservés sur l'appareil (IndexedDB), sans partage.

import { firebaseConfig, ADMIN_EMAILS, MAX_AUDIO_BYTES, cloudinary } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const COL = "enregistrements";

export const TYPES = {
  solo: "Solo",
  chorale: "Chorale",
  pupitre: "Pupitre",
  instrumental: "Instrumental",
  accompagnement: "Accompagnement",
  autre: "Autre",
};
export const STATUTS = { en_attente: "En attente", approuve: "Publié", rejete: "Rejeté", local: "Sur cet appareil" };
export { MAX_AUDIO_BYTES };

let mode = "local";
let fb = null; // modules + instances Firebase

export async function init() {
  if (!firebaseConfig) return (mode = "local");
  try {
    const [app, auth, fs, st] = await Promise.all([
      import(FB + "firebase-app.js"),
      import(FB + "firebase-auth.js"),
      import(FB + "firebase-firestore.js"),
      cloudinary ? null : import(FB + "firebase-storage.js"),
    ]);
    const a = app.initializeApp(firebaseConfig);
    fb = { auth, fs, st, A: auth.getAuth(a), D: fs.getFirestore(a), S: st?.getStorage(a) };
    mode = "firebase";
  } catch (e) {
    console.warn("Firebase indisponible, passage en mode local", e);
    mode = "local";
  }
  return mode;
}
export const getMode = () => mode;

// ── Lecture ────────────────────────────────────────────────────────────────
export async function listPublished() {
  if (mode === "local") return (await idbAll()).map(localView);
  const { fs, D } = fb;
  const snap = await fs.getDocs(fs.query(fs.collection(D, COL), fs.where("statut", "==", "approuve")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate);
}

export async function listByStatus(statut) {
  if (mode === "local") return (await idbAll()).map(localView);
  const { fs, D } = fb;
  const snap = await fs.getDocs(fs.query(fs.collection(D, COL), fs.where("statut", "==", statut)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate);
}

// ── Envoi ──────────────────────────────────────────────────────────────────
export async function submit({ cantique, type, voix, contributeur, note, blob, nomFichier }, onProgress) {
  if (!blob || !blob.size) throw new Error("Aucun son sélectionné.");
  if (blob.size > MAX_AUDIO_BYTES) throw new Error("Fichier trop lourd (25 Mo maximum).");
  const meta = {
    cantique: Number(cantique), type, voix: voix || "", contributeur: contributeur.trim(),
    note: (note || "").trim(), nomFichier: nomFichier || "", taille: blob.size,
    mime: blob.type || guessMime(nomFichier),
  };

  if (mode === "local") {
    const rec = { ...meta, id: uid(), statut: "local", creeLe: Date.now(), blob };
    await idbPut(rec);
    onProgress?.(1);
    return { statut: "local" };
  }

  const { auth, fs, A, D } = fb;
  if (!A.currentUser) await auth.signInAnonymously(A);
  const { url, path } = cloudinary
    ? await uploadCloudinary(blob, meta, onProgress)
    : await uploadFirebase(blob, meta, nomFichier, onProgress);
  await fs.addDoc(fs.collection(D, COL), {
    ...meta, url, chemin: path, statut: "en_attente", auteurUid: A.currentUser.uid,
    creeLe: fs.serverTimestamp(),
  });
  return { statut: "en_attente" };
}

async function uploadFirebase(blob, meta, nomFichier, onProgress) {
  const { st, S } = fb;
  const ext = (nomFichier?.split(".").pop() || extFromMime(meta.mime)).toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${COL}/${meta.cantique}/${Date.now()}-${uid()}.${ext || "audio"}`;
  const ref = st.ref(S, path);
  const task = st.uploadBytesResumable(ref, blob, { contentType: meta.mime });
  await new Promise((ok, ko) =>
    task.on("state_changed", (s) => onProgress?.(s.bytesTransferred / s.totalBytes), ko, ok));
  return { url: await st.getDownloadURL(ref), path };
}

// Envoi direct vers Cloudinary (préréglage non signé). Les fichiers audio sont de type « video ».
function uploadCloudinary(blob, meta, onProgress) {
  const form = new FormData();
  form.append("file", blob);
  form.append("upload_preset", cloudinary.uploadPreset);
  form.append("folder", `${COL}/${meta.cantique}`);
  return new Promise((ok, ko) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/video/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let r = {};
      try { r = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && r.secure_url) ok({ url: r.secure_url, path: "cloudinary:" + r.public_id });
      else ko(new Error(r.error?.message || `envoi refusé (${xhr.status})`));
    };
    xhr.onerror = () => ko(new Error("connexion impossible"));
    xhr.send(form);
  });
}

// ── Gestion (modération) ───────────────────────────────────────────────────
export function onAdmin(cb) {
  if (mode === "local") return cb({ email: "appareil", local: true });
  fb.auth.onAuthStateChanged(fb.A, (u) => cb(u && !u.isAnonymous && ADMIN_EMAILS.includes(u.email) ? u : null, u));
}
export const signIn = (email, mdp) => fb.auth.signInWithEmailAndPassword(fb.A, email, mdp);
export const signOut = () => fb.auth.signOut(fb.A);

export async function setStatus(id, statut) {
  const { fs, D } = fb;
  await fs.updateDoc(fs.doc(D, COL, id), { statut, modereLe: fs.serverTimestamp() });
}

export async function remove(rec) {
  if (mode === "local") return idbDel(rec.id);
  const { fs, st, D, S } = fb;
  // Un fichier Cloudinary ne peut pas être effacé depuis l'application (envoi non signé) :
  // il disparaît de l'appli et peut être supprimé à la main dans Cloudinary → Assets.
  if (rec.chemin && st && !rec.chemin.startsWith("cloudinary:")) await st.deleteObject(st.ref(S, rec.chemin)).catch(() => {});
  await fs.deleteDoc(fs.doc(D, COL, rec.id));
}

// ── Utilitaires ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const ts = (r) => (r.creeLe?.toMillis ? r.creeLe.toMillis() : r.creeLe || 0);
const byDate = (a, b) => ts(b) - ts(a);
export const dateOf = (r) => new Date(ts(r));

function guessMime(name = "") {
  const e = name.split(".").pop().toLowerCase();
  return { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg",
    opus: "audio/ogg", amr: "audio/amr", webm: "audio/webm" }[e] || "audio/mpeg";
}
function extFromMime(m = "") {
  return m.includes("webm") ? "webm" : m.includes("mp4") ? "m4a" : m.includes("ogg") ? "ogg"
    : m.includes("wav") ? "wav" : m.includes("mpeg") ? "mp3" : "audio";
}

const urls = new Map();
function localView(r) {
  if (!urls.has(r.id)) urls.set(r.id, URL.createObjectURL(r.blob));
  const { blob, ...rest } = r;
  return { ...rest, url: urls.get(r.id) };
}

function idb() {
  return new Promise((ok, ko) => {
    const q = indexedDB.open("nyembo-audio", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("audio", { keyPath: "id" });
    q.onsuccess = () => ok(q.result);
    q.onerror = () => ko(q.error);
  });
}
async function tx(modeTx, fn) {
  const db = await idb();
  return new Promise((ok, ko) => {
    const t = db.transaction("audio", modeTx);
    const req = fn(t.objectStore("audio"));
    t.oncomplete = () => ok(req?.result);
    t.onerror = () => ko(t.error);
  });
}
const idbAll = async () => ((await tx("readonly", (s) => s.getAll())) || []).sort(byDate);
const idbPut = (r) => tx("readwrite", (s) => s.put(r));
const idbDel = (id) => tx("readwrite", (s) => s.delete(id));
