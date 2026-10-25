// Fonction Vercel : délivrance des attestations Éco-Campus (suivi ou réussite d'un parcours).
// Les scores sont relus côté serveur dans users/{uid} : l'apprenant ne peut pas fabriquer son attestation.
// Variable d'environnement requise : FIREBASE_SERVICE_ACCOUNT (la même que pour /api/push).
// GET  /api/attestation                         → { configure: true|false }
// POST /api/attestation { parcours, type }      (en-tête Authorization: Bearer <jeton d'identité Firebase>)
//      type : "suivi" | "reussite" → { ok, attestation } ; une attestation valide existante est renvoyée telle quelle.
const admin = require("firebase-admin");
const R = require("../src/attest/regles");

function init() {
  if (admin.apps.length) return true;
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!brut) return false;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(brut)) });
  return true;
}

// « 03/10/2026 » ou ISO → ISO (date d'inscription, début de la période de formation)
function versIso(d) {
  if (!d) return null;
  const m = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toISOString();
  const t = new Date(d);
  return isNaN(t) ? null : t.toISOString();
}

module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).json({ configure: !!process.env.FIREBASE_SERVICE_ACCOUNT });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try { if (!init()) return res.status(503).json({ ok: false, raison: "Délivrance non configurée sur le serveur (clé FIREBASE_SERVICE_ACCOUNT absente)." }); }
  catch (e) { return res.status(500).json({ ok: false, raison: "Clé de compte de service invalide." }); }

  let jeton;
  try { jeton = await admin.auth().verifyIdToken(String(req.headers.authorization || "").replace(/^Bearer\s+/i, "")); }
  catch { return res.status(401).json({ ok: false, raison: "Session expirée : reconnectez-vous." }); }

  const corps = req.body || {};
  const parcours = R.PARCOURS.find(p => p.id === corps.parcours);
  const type = corps.type === "reussite" ? "reussite" : corps.type === "suivi" ? "suivi" : null;
  if (!parcours || !type) return res.status(400).json({ ok: false, raison: "Parcours ou type d'attestation inconnu." });

  const db = admin.firestore();
  const uSnap = await db.collection("users").doc(jeton.uid).get();
  if (!uSnap.exists) return res.status(404).json({ ok: false, raison: "Profil introuvable." });
  const u = uSnap.data();
  const actif = u.abonnement === "actif" && !!u.dateExpiration && new Date(u.dateExpiration) > new Date(); // comme xp() côté application
  if (!actif) return res.status(403).json({ ok: false, raison: "Les attestations sont réservées aux abonnés actifs." });
  const nom = String(u.nom || "").trim();
  if (nom.length < 3) return res.status(422).json({ ok: false, raison: "Renseignez votre nom complet dans votre profil : il figurera sur l'attestation." });

  // Attestation déjà délivrée pour ce parcours et ce type : on la renvoie
  const deja = await db.collection("attestations").where("uid", "==", jeton.uid).where("parcours", "==", parcours.id).where("type", "==", type).get();
  const existantes = deja.docs.map(d => d.data()), valide = existantes.find(a => a.statut === "valide");
  if (valide) { const { creeLe, ...renvoi } = valide; return res.status(200).json({ ok: true, attestation: renvoi, existante: true }); }
  if (existantes.length) return res.status(403).json({ ok: false, raison: "Votre attestation pour ce parcours a été révoquée. Contactez Éco-Campus RDC." });

  const modules = parcours.id === "SYS-N1" ? (await db.collection("modules").get()).docs.map(d => ({ id: d.id, ...d.data() })) : [];
  const ev = R.evaluer(parcours.id, modules, u);
  if (type === "suivi" && !ev.suivi) return res.status(422).json({ ok: false, raison: `Parcours incomplet : ${ev.nFaits} / ${ev.nTotal} éléments faits.`, aFaire: ev.aFaire });
  if (type === "reussite" && !ev.reussite) {
    const motifs = [];
    if (!ev.suivi) motifs.push(`${ev.nTotal - ev.nFaits} élément(s) encore à faire`);
    if (ev.aAmeliorer.length) motifs.push(`${ev.aAmeliorer.length} élément(s) sous ${R.SEUIL_ELEMENT} % (${ev.aAmeliorer.slice(0, 3).join(" ; ")}${ev.aAmeliorer.length > 3 ? "…" : ""})`);
    if (ev.moyenne == null || ev.moyenne < R.SEUIL_MOYENNE) motifs.push(`moyenne ${ev.moyenne == null ? "—" : `${ev.moyenne} %`} pour ${R.SEUIL_MOYENNE} % requis`);
    return res.status(422).json({ ok: false, raison: `Réussite non atteinte : ${motifs.join(", ")}.`, aAmeliorer: ev.aAmeliorer, aFaire: ev.aFaire });
  }

  const maintenant = new Date().toISOString();
  const donnees = {
    uid: jeton.uid, nom, parcours: parcours.id, parcoursTitre: parcours.titre, type,
    moyenne: ev.moyenne, mention: type === "reussite" ? ev.mention : null,
    elements: ev.elements.map(e => ({ titre: e.titre, pct: e.pct, evalue: e.evalue })),
    heures: ev.heures, debut: versIso(u.createdAt) || maintenant, fin: maintenant, date: maintenant,
    seuils: { element: R.SEUIL_ELEMENT, moyenne: R.SEUIL_MOYENNE },
    signataire: R.SIGNATAIRE, organisme: R.ORGANISME, statut: "valide",
    creeLe: admin.firestore.FieldValue.serverTimestamp(),
  };
  for (let essai = 0; essai < 5; essai++) {
    const numero = R.numeroAttestation();
    try {
      await db.collection("attestations").doc(numero).create({ numero, ...donnees });
      const { creeLe, ...renvoi } = donnees;
      return res.status(200).json({ ok: true, attestation: { numero, ...renvoi } });
    } catch (e) {
      if (e && (e.code === 6 || /already exists/i.test(e.message || ""))) continue; // numéro déjà pris : on retire
      return res.status(500).json({ ok: false, raison: "Enregistrement impossible, réessayez." });
    }
  }
  return res.status(500).json({ ok: false, raison: "Numéro d'attestation indisponible, réessayez." });
};
