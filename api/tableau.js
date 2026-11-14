// Fonction Vercel : tableau de bord en lecture seule pour les observateurs désignés par l'administrateur.
// Seuls l'administrateur et les comptes listés dans config/observateurs.uids y ont accès.
// La réponse ne contient que des chiffres agrégés (src/admin/indicateurs.js) : aucune donnée personnelle.
// Variable d'environnement requise : FIREBASE_SERVICE_ACCOUNT (la même que pour /api/attestation).
// GET /api/tableau (en-tête Authorization: Bearer <jeton d'identité Firebase>) → { ok, genereLe, groupes, parcours }
const admin = require("firebase-admin");
const { indicateurs } = require("../src/admin/indicateurs");

const ADMIN = "admin@accessplus.com";

function init() {
  if (admin.apps.length) return true;
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!brut) return false;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(brut)) });
  return true;
}

const tout = async (db, nom) => (await db.collection(nom).get()).docs.map(d => ({ id: d.id, ...d.data() }));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  try { if (!init()) return res.status(503).json({ ok: false, raison: "Tableau de bord non configuré sur le serveur (clé FIREBASE_SERVICE_ACCOUNT absente)." }); }
  catch (e) { return res.status(500).json({ ok: false, raison: "Clé de compte de service invalide." }); }

  let jeton;
  try { jeton = await admin.auth().verifyIdToken(String(req.headers.authorization || "").replace(/^Bearer\s+/i, "")); }
  catch { return res.status(401).json({ ok: false, raison: "Session expirée : reconnectez-vous." }); }

  const db = admin.firestore();
  const estAdmin = jeton.email === ADMIN;
  if (!estAdmin) {
    const cfg = await db.collection("config").doc("observateurs").get();
    const uids = (cfg.exists && Array.isArray(cfg.data().uids)) ? cfg.data().uids : [];
    if (!uids.includes(jeton.uid)) return res.status(403).json({ ok: false, raison: "Votre compte n'a pas accès au tableau de bord." });
  }

  try {
    const [users, modules, presentations, videos, stages, psycho, attestations, demandes] = await Promise.all(
      ["users", "modules", "presentations", "videos", "stages", "psychoScores", "attestations", "demandes"].map(n => tout(db, n)));
    const r = indicateurs({ users, modules, presentations, videos, stages, psycho, attestations, demandes, maintenant: new Date() });
    return res.status(200).json({ ok: true, genereLe: new Date().toISOString(), ...r });
  } catch (e) {
    return res.status(500).json({ ok: false, raison: "Calcul des indicateurs impossible pour le moment." });
  }
};
