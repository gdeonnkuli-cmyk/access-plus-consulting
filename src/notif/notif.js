// ══════════════════ NOTIFICATIONS ÉCO-CAMPUS ══════════════════
// Collection « notifications » : { dest, type, titre, texte, vue, ts, auteur, auteurNom }
//   dest = uid d'un destinataire, ou groupe « all », « apprenants », « formateurs », « admin ».
// Collection « notifEtat/{uid} » : { vu (ms) : tout ce qui précède est lu, lues : { id: true } }.
// Envoi : notifier() écrit la notification, puis, au mieux : copie par e-mail (destinataire unique,
// selon ses préférences) et notification push via la fonction Vercel /api/push.
import { useEffect, useState } from "react";
import { collection, doc, addDoc, getDoc, setDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";

export const TYPES = {
  info: { l: "Information", ico: "info-circle", col: "#1E4FA3" },
  annonce: { l: "Annonce", ico: "speakerphone", col: "#C98A1B" },
  module: { l: "Nouveau module", ico: "book-2", col: "#0A2A5C" },
  video: { l: "Nouvelle vidéo", ico: "video", col: "#C2410C" },
  pres: { l: "Nouveau cours", ico: "presentation", col: "#D97706" },
  message: { l: "Message", ico: "message-circle", col: "#0D7A6B" },
  code: { l: "Accès", ico: "key", col: "#0A2A5C" },
  correction: { l: "Correction", ico: "checkbox", col: "#7C3AED" },
  contenu: { l: "Vos contenus", ico: "file-check", col: "#1E4FA3" },
  suggestion: { l: "Suggestion", ico: "bulb", col: "#C98A1B" },
  abonnement: { l: "Abonnement", ico: "clock", col: "#A3122A" },
};
export const GROUPES = { all: "Tout le monde", apprenants: "Tous les apprenants", formateurs: "Tous les formateurs", admin: "Administration" };
const RESERVES = Object.keys(GROUPES);
export const estGroupe = d => RESERVES.includes(d);
export const destsPour = (uid, role) => role === "admin" ? ["admin", "all"] : [uid, "all", role === "formateur" ? "formateurs" : "apprenants"];

const coupe = (s, n) => String(s || "").slice(0, n);
let CFG = { db: null, auth: null, email: null };
// Appelé une fois au démarrage de l'application (App.jsx)
export function initNotif({ db, auth, email }) { CFG = { db, auth, email }; }

// Envoie une notification. Ne lève jamais d'erreur : une notification ne doit pas bloquer l'action principale.
export async function notifier({ dest, type = "info", titre, texte = "", vue = "", auteurNom = "", email = false, push = true }) {
  const { db, auth } = CFG;
  const moi = auth?.currentUser;
  if (!db || !moi || !dest || !titre) return null;
  try {
    const n = { dest: coupe(dest, 128), type, titre: coupe(titre, 120), texte: coupe(texte, 1000), vue: coupe(vue, 40), ts: serverTimestamp(), auteur: moi.uid, auteurNom: coupe(auteurNom, 80) };
    const r = await addDoc(collection(db, "notifications"), n);
    if (email && !estGroupe(dest)) copieEmail(dest, n);
    if (push) envoyerPush(r.id);
    return r.id;
  } catch (e) { console.log("notifier", e.message); return null; }
}

// Copie par e-mail au destinataire (lecture de users/{uid} réservée à l'encadrement)
async function copieEmail(uid, n) {
  try {
    const u = await getDoc(doc(CFG.db, "users", uid));
    const d = u.exists() ? u.data() : null;
    if (!d?.mail || d.preferences?.notifEmails === false || !CFG.email) return;
    await CFG.email({ to_email: d.mail, subject: `Éco-Campus RDC — ${n.titre}`, nom: d.nom || "", message: n.texte ? `${n.titre}\n\n${n.texte}` : n.titre });
  } catch (e) { console.log("copieEmail", e.message); }
}

// Demande l'envoi push au serveur (fonction Vercel). Sans configuration, le serveur répond 503 : on ignore.
export async function envoyerPush(notifId) {
  try {
    const t = await CFG.auth?.currentUser?.getIdToken();
    if (!t) return;
    await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ notifId }) });
  } catch (e) { /* réseau ou fonction absente en développement */ }
}

// Notifications reçues (temps réel), triées de la plus récente à la plus ancienne
export function useNotifications(db, uid, role) {
  const [liste, sListe] = useState([]);
  const cle = uid ? destsPour(uid, role).join("|") : "";
  useEffect(() => {
    if (!db || !cle) return;
    const q = query(collection(db, "notifications"), where("dest", "in", cle.split("|")));
    return onSnapshot(q, s => {
      const L = s.docs.map(d => ({ id: d.id, ...d.data(), t: d.data().ts?.toMillis?.() ?? Date.now() }));
      L.sort((a, b) => b.t - a.t);
      sListe(L.slice(0, 60));
    }, e => console.log("notifications", e.message));
  }, [db, cle]);
  return liste;
}

export function useNotifEtat(db, uid) {
  const [etat, sEtat] = useState({ vu: 0, lues: {} });
  useEffect(() => {
    if (!db || !uid) return;
    return onSnapshot(doc(db, "notifEtat", uid), s => sEtat({ vu: 0, lues: {}, ...(s.data() || {}) }), () => {});
  }, [db, uid]);
  return etat;
}

export const estLue = (n, etat) => n.t <= (etat.vu || 0) || !!etat.lues?.[n.id];

export async function marquerLue(db, uid, etat, id) {
  try {
    const lues = { ...(etat.lues || {}), [id]: true };
    const ids = Object.keys(lues);
    if (ids.length > 150) ids.slice(0, ids.length - 150).forEach(k => delete lues[k]);
    await setDoc(doc(db, "notifEtat", uid), { vu: etat.vu || 0, lues });
  } catch (e) { console.log("marquerLue", e.message); }
}
export async function toutMarquerLu(db, uid) {
  try { await setDoc(doc(db, "notifEtat", uid), { vu: Date.now(), lues: {} }); } catch (e) { console.log("toutMarquerLu", e.message); }
}

// Rappels calculés localement (non stockés) : abonnement bientôt expiré
export function rappelsLocaux(u) {
  const R = [];
  if (u?.abonnement === "actif" && u.dateExpiration) {
    const j = Math.ceil((new Date(u.dateExpiration) - new Date()) / 864e5);
    if (j >= 0 && j <= 7) R.push({ id: "local-expiration", local: true, type: "abonnement", titre: j === 0 ? "Votre accès expire aujourd'hui" : `Votre accès expire dans ${j} jour${j > 1 ? "s" : ""}`, texte: "Renouvelez votre abonnement pour garder l'accès aux modules, QCM et ateliers.", vue: "param", t: Date.now() });
  }
  return R;
}

export const depuis = t => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};
