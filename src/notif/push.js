// Notifications push (Firebase Cloud Messaging) : abonnement de l'appareil courant.
// La clé publique VAPID est saisie par l'administrateur (config/push.vapid) ; l'envoi est fait par /api/push.
import { getApp } from "firebase/app";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const CLE = "ec_push_jeton";
const lire = () => { try { return localStorage.getItem(CLE) || ""; } catch { return ""; } };
const ecrire = v => { try { v ? localStorage.setItem(CLE, v) : localStorage.removeItem(CLE); } catch {} };

export const pushPossible = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const pushActif = () => pushPossible() && Notification.permission === "granted" && !!lire();

const appareil = () => { const u = navigator.userAgent || ""; return /iPhone|iPad/i.test(u) ? "iPhone/iPad" : /Android/i.test(u) ? "Android" : /Windows/i.test(u) ? "Windows" : /Mac/i.test(u) ? "Mac" : "Autre"; };

async function messagerie() {
  const m = await import("firebase/messaging");
  if (!(await m.isSupported())) throw new Error("Ce navigateur ne gère pas les notifications push. Sur iPhone, installez d'abord l'application sur l'écran d'accueil.");
  return m;
}

export async function activerPush(db, uid, role) {
  if (!pushPossible()) throw new Error("Les notifications push ne sont pas disponibles sur cet appareil ou ce navigateur.");
  const cfg = await getDoc(doc(db, "config", "push"));
  const vapidKey = cfg.data()?.vapid;
  if (!vapidKey) throw new Error("Les notifications push ne sont pas encore configurées par l'administrateur.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Autorisation refusée : activez les notifications pour Éco-Campus dans les réglages du navigateur.");
  const reg = await navigator.serviceWorker.ready;
  const m = await messagerie();
  const jeton = await m.getToken(m.getMessaging(getApp()), { vapidKey, serviceWorkerRegistration: reg });
  if (!jeton) throw new Error("Impossible d'obtenir l'identifiant de l'appareil. Réessayez.");
  await setDoc(doc(db, "pushTokens", jeton), { uid, role, ts: serverTimestamp(), appareil: appareil() });
  ecrire(jeton);
  return jeton;
}

export async function desactiverPush(db) {
  const jeton = lire();
  ecrire("");
  try { if (jeton) await deleteDoc(doc(db, "pushTokens", jeton)); } catch {}
  try { const m = await messagerie(); await m.deleteToken(m.getMessaging(getApp())); } catch {}
}
