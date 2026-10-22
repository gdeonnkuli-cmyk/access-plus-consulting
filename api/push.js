// Fonction Vercel : envoi des notifications push (Firebase Cloud Messaging) d'une notification Éco-Campus.
// Variable d'environnement requise (Vercel → Settings → Environment Variables) :
//   FIREBASE_SERVICE_ACCOUNT = contenu JSON de la clé de compte de service
//   (console Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée).
// GET  /api/push            → { configure: true|false }
// POST /api/push {notifId}  (en-tête Authorization: Bearer <jeton d'identité Firebase de l'expéditeur>)
const admin = require("firebase-admin");

const ADMIN_EMAIL = "admin@accessplus.com";
const ROLE_GROUPE = { apprenants: "apprenant", formateurs: "formateur", admin: "admin" };
const FRAICHEUR_MS = 10 * 60 * 1000; // seules les notifications des 10 dernières minutes sont poussées

function init() {
  if (admin.apps.length) return true;
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!brut) return false;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(brut)) });
  return true;
}

module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).json({ configure: !!process.env.FIREBASE_SERVICE_ACCOUNT });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try { if (!init()) return res.status(503).json({ ok: false, raison: "Push non configuré" }); }
  catch (e) { return res.status(500).json({ ok: false, raison: "Clé de compte de service invalide" }); }

  let user;
  try { user = await admin.auth().verifyIdToken(String(req.headers.authorization || "").replace(/^Bearer\s+/i, "")); }
  catch { return res.status(401).json({ ok: false, raison: "Identité invalide" }); }

  const notifId = String((req.body && req.body.notifId) || "");
  if (!notifId) return res.status(400).json({ ok: false });
  const db = admin.firestore();
  const ref = db.collection("notifications").doc(notifId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ ok: false });
  const n = snap.data();
  if (n.auteur !== user.uid && user.email !== ADMIN_EMAIL) return res.status(403).json({ ok: false });
  if (n.pushEnvoye) return res.status(409).json({ ok: false, raison: "Déjà envoyée" });
  const t = n.ts && n.ts.toMillis ? n.ts.toMillis() : 0;
  if (Date.now() - t > FRAICHEUR_MS) return res.status(410).json({ ok: false, raison: "Notification trop ancienne" });
  await ref.update({ pushEnvoye: admin.firestore.FieldValue.serverTimestamp() });

  // Appareils destinataires
  let q = db.collection("pushTokens");
  if (ROLE_GROUPE[n.dest]) q = q.where("role", "==", ROLE_GROUPE[n.dest]);
  else if (n.dest !== "all") q = q.where("uid", "==", n.dest);
  const jetons = (await q.get()).docs.map(d => d.id).filter(j => j);
  if (!jetons.length) return res.status(200).json({ ok: true, envoyes: 0 });

  const base = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
  const lien = n.vue ? `${base}/?vue=${encodeURIComponent(n.vue)}` : `${base}/`;
  const corps = String(n.texte || "").slice(0, 180);
  let envoyes = 0, invalides = [];
  for (let i = 0; i < jetons.length; i += 500) {
    const lot = jetons.slice(i, i + 500);
    const r = await admin.messaging().sendEachForMulticast({
      tokens: lot,
      data: { titre: String(n.titre || "Éco-Campus RDC"), texte: corps, lien, id: notifId },
      webpush: { headers: { Urgency: "high", TTL: "86400" }, fcmOptions: { link: lien } },
    });
    envoyes += r.successCount;
    r.responses.forEach((x, k) => {
      const c = x.error && x.error.code;
      if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token" || c === "messaging/invalid-argument") invalides.push(lot[k]);
    });
  }
  await Promise.all(invalides.map(j => db.collection("pushTokens").doc(j).delete().catch(() => {})));
  return res.status(200).json({ ok: true, envoyes, invalides: invalides.length });
};
