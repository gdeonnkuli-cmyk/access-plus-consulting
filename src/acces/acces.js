// ══════════════════ ACCÈS ÉCO-CAMPUS : OFFRES, PAIEMENT, CODES OFFERTS ══════════════════
// L'abonnement (quelle que soit sa durée) ouvre l'accès à tous les contenus.
// config/paiement : { prix: { m, t, a }, mpesa, airtel, orange, beneficiaire } — réglé par l'admin.
// bons/{code}     : codes offerts « OF-XXXXXXXX » { dureeId, jours, note, creeLe, uid, nom, utiliseLe }.
//                   Un code ne sert qu'une fois ; la durée court à partir de son utilisation.
import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, writeBatch, serverTimestamp } from "firebase/firestore";

export const DUR = [{ id: "1m", l: "1 mois", j: 30 }, { id: "3m", l: "3 mois", j: 90 }, { id: "6m", l: "6 mois", j: 180 }, { id: "1a", l: "1 an", j: 365 }, { id: "v", l: "À vie", j: 36500 }];

export const OFFRES = [
  { id: "m", l: "Mensuel", dureeId: "1m", duree: "1 mois", mois: 1, prix: 5 },
  { id: "t", l: "Trimestriel", dureeId: "3m", duree: "3 mois", mois: 3, prix: 12, badge: "Le plus choisi" },
  { id: "a", l: "Annuel", dureeId: "1a", duree: "1 an", mois: 12, prix: 40, badge: "Meilleur prix" },
];
export const INCLUS = [
  "Tous les modules SYSCOHADA, QCM et exercices corrigés",
  "Le Code des impôts expliqué : 10 modules avec QCM",
  "L'atelier États financiers et ses cas pratiques",
  "Vidéos, cours en direct, présentations et PDF",
  "Les nouveaux contenus, ajoutés régulièrement",
];
export const OPERATEURS = [{ k: "mpesa", l: "M-Pesa (Vodacom)" }, { k: "airtel", l: "Airtel Money" }, { k: "orange", l: "Orange Money" }];

// Offres avec les prix réglés par l'admin (à défaut : 5, 12, 40 USD)
export const offresAvecPrix = cfg => OFFRES.map(o => {
  const p = Number(cfg?.prix?.[o.id]);
  return { ...o, prix: p > 0 ? p : o.prix };
});
export const parMois = o => Math.round((o.prix / o.mois) * 100) / 100;
export const fUSD = n => `${Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $`;
export const numerosRenseignes = cfg => OPERATEURS.filter(o => String(cfg?.[o.k] || "").trim());

export function usePaiement(db) {
  const [cfg, sCfg] = useState(null);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "config", "paiement"), s => sCfg(s.data() || {}), () => sCfg({}));
  }, [db]);
  return cfg;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const nouveauCodeOffert = (rnd = Math.random) => {
  let c = "OF-";
  for (let i = 0; i < 8; i++) c += ALPHA[Math.floor(rnd() * ALPHA.length)];
  return c;
};
export const estCodeOffert = c => /^OF-[A-Z0-9]{8}$/.test(String(c || "").trim().toUpperCase());

// Utilisation d'un code offert par l'utilisateur connecté (uid, fiche ud).
// Le bon et la fiche sont écrits dans le même lot : les règles Firestore l'exigent.
export async function utiliserCodeOffert(db, uid, ud, saisie) {
  const code = String(saisie || "").trim().toUpperCase();
  if (!estCodeOffert(code)) return { ok: false, err: "Code offert invalide (format OF-XXXXXXXX)." };
  let b;
  try {
    const s = await getDoc(doc(db, "bons", code));
    if (!s.exists()) return { ok: false, err: "Ce code n'existe pas. Vérifiez la saisie." };
    b = s.data();
  } catch (e) { return { ok: false, err: "Vérification impossible. Réessayez." }; }
  if (b.uid) return { ok: false, err: b.uid === uid ? "Vous avez déjà utilisé ce code." : "Ce code a déjà été utilisé." };
  const exp = new Date(Date.now() + b.jours * 864e5).toISOString();
  const actuelle = ud?.abonnement === "actif" && ud.dateExpiration && new Date(ud.dateExpiration) > new Date() ? ud.dateExpiration : null;
  if (actuelle && new Date(actuelle) >= new Date(exp))
    return { ok: false, err: `Votre accès est déjà actif jusqu'au ${new Date(actuelle).toLocaleDateString("fr-FR")}. Gardez ce code pour plus tard.` };
  try {
    const lot = writeBatch(db);
    lot.update(doc(db, "bons", code), { uid, nom: String(ud?.nom || "").slice(0, 120), utiliseLe: serverTimestamp() });
    lot.update(doc(db, "users", uid), { abonnement: "actif", codeValide: true, activationCode: code, dureeId: b.dureeId, dateExpiration: exp, bonCode: code });
    await lot.commit();
  } catch (e) { return { ok: false, err: "Activation refusée. Le code a peut-être déjà été utilisé." }; }
  return { ok: true, code, dureeId: b.dureeId, duree: DUR.find(d => d.id === b.dureeId)?.l || `${b.jours} jours`, exp };
}
