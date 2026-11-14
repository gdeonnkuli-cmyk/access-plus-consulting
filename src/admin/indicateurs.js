// ══════════════════ INDICATEURS DU TABLEAU DE BORD (LECTURE SEULE) ══════════════════
// Calculés côté serveur (api/tableau.js) pour les comptes « observateurs » désignés par l'administrateur :
// uniquement des chiffres agrégés, aucune donnée personnelle (nom, e-mail, téléphone, code, note individuelle).
// CommonJS : partagé entre la fonction Vercel et les tests.
const R = require("../attest/regles");

const ADMIN = "admin@accessplus.com";
const JOUR = 86400000;
const estExercice = cle => /^(CPT-|JRN-)/.test(cle);
const moyenne = L => (L.length ? Math.round(L.reduce((a, b) => a + b, 0) / L.length) : null);
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const expire = d => !d || new Date(d) < new Date(); // comme xp() dans l'application

// Date d'inscription : « 3/10/2026 » (format français enregistré à l'inscription) ou ISO
function dateInscription(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const t = new Date(v);
  return isNaN(t) ? null : t;
}

// Clés de score d'un parcours (hors examen final), pour savoir qui l'a commencé
const clesParcours = (id, modules) => R.elementsBase(id, modules).map(e => e.cle);

/**
 * @param {object} d { users, modules, presentations, videos, stages, psycho, attestations, demandes, maintenant }
 * @returns {{ groupes: { titre, ico, kpis: { l, v, suffixe?, ton? }[] }[], parcours: object[] }}
 */
function indicateurs(d) {
  const maintenant = d.maintenant || new Date();
  const users = (d.users || []).filter(u => u && u.mail !== ADMIN);
  const modules = d.modules || [];
  const apprenants = users.filter(u => u.role !== "formateur");
  const formateurs = users.filter(u => u.role === "formateur");

  const actifs = users.filter(u => u.abonnement === "actif" && !expire(u.dateExpiration)).length;
  const demandes = users.filter(u => u.abonnement === "demande").length;
  const expires = users.filter(u => u.abonnement === "expiré" || (u.abonnement === "actif" && expire(u.dateExpiration))).length;
  const nouveaux = users.filter(u => { const t = dateInscription(u.createdAt); return t && t.getMonth() === maintenant.getMonth() && t.getFullYear() === maintenant.getFullYear(); }).length;
  const nouveaux30 = users.filter(u => { const t = dateInscription(u.createdAt); return t && maintenant - t <= 30 * JOUR; }).length;

  // Engagement : mêmes règles que le tableau de bord de l'administrateur
  let engages = 0, surveiller = 0, inactifs = 0;
  apprenants.forEach(u => {
    const jours = u.lastLogin ? Math.floor((maintenant - u.lastLogin) / JOUR) : null;
    const nMods = Object.values(u.progress || {}).filter(v => v === "done").length;
    if (jours == null || jours > 14) inactifs++;
    else if (jours > 7 || nMods === 0) surveiller++;
    else engages++;
  });
  const connectes7 = apprenants.filter(u => u.lastLogin && maintenant - u.lastLogin <= 7 * JOUR).length;
  const progresse = apprenants.filter(u => Object.keys(u.progress || {}).length > 0 || Object.keys(u.scores || {}).length > 0).length;
  const notes = apprenants.flatMap(u => Object.entries(u.scores || {}).filter(([c]) => !estExercice(c)).map(([, s]) => s && s.pct).filter(p => p != null));
  const nReussies = notes.filter(p => p >= R.SEUIL_ELEMENT).length;

  const attest = (d.attestations || []).filter(a => a.statut === "valide");
  const certificats = attest.filter(a => a.type === "reussite");

  // Parcours certifiants : apprenants qui l'ont commencé, examens finaux réussis, certificats délivrés
  const parcours = R.PARCOURS.map(p => {
    const cles = clesParcours(p.id, modules), x = R.EXAMENS[p.id] || {};
    const commence = apprenants.filter(u => cles.some(c => (u.scores || {})[c] != null || (u.progress || {})[c] != null)).length;
    const finalReussi = x.cle ? apprenants.filter(u => { const s = (u.scores || {})[x.cle]; return s && s.pct >= R.SEUIL_ELEMENT; }).length : 0;
    return { id: p.id, titre: p.court, commence, finalReussi, certificats: certificats.filter(a => a.parcours === p.id).length };
  });

  const psycho = (d.psycho || []).map(s => s && s.pct).filter(p => p != null);
  const presentations = d.presentations || [], videos = d.videos || [];

  return {
    groupes: [
      { titre: "Utilisateurs", ico: "users", kpis: [
        { l: "Inscrits au total", v: users.length },
        { l: "Nouveaux ce mois", v: nouveaux, ton: "info" },
        { l: "Nouveaux sur 30 jours", v: nouveaux30, ton: "info" },
        { l: "Apprenants", v: apprenants.length },
        { l: "Formateurs", v: formateurs.length },
      ] },
      { titre: "Abonnements", ico: "ticket", kpis: [
        { l: "Abonnements actifs", v: actifs, ton: "ok" },
        { l: "Demandes en attente", v: demandes, ton: "alerte" },
        { l: "Expirés", v: expires, ton: "danger" },
        { l: "Taux d'abonnés actifs", v: pct(actifs, users.length), suffixe: " %" },
      ] },
      { titre: "Engagement des apprenants", ico: "activity", kpis: [
        { l: "Engagés", v: engages, ton: "ok" },
        { l: "À surveiller", v: surveiller, ton: "alerte" },
        { l: "Inactifs (plus de 14 jours)", v: inactifs, ton: "danger" },
        { l: "Connectés sur 7 jours", v: connectes7, ton: "info" },
        { l: "Ont commencé une formation", v: pct(progresse, apprenants.length), suffixe: " %" },
      ] },
      { titre: "Évaluations et certificats", ico: "certificate", kpis: [
        { l: "Évaluations passées", v: notes.length },
        { l: "Score moyen", v: moyenne(notes), suffixe: " %", ton: "ok" },
        { l: `Taux de réussite (≥ ${R.SEUIL_ELEMENT} %)`, v: notes.length ? pct(nReussies, notes.length) : null, suffixe: " %" },
        { l: "Attestations de suivi", v: attest.filter(a => a.type === "suivi").length },
        { l: "Certificats de réussite", v: certificats.length, ton: "ok" },
      ] },
      { titre: "Contenus", ico: "books", kpis: [
        { l: "Modules de cours publiés", v: modules.filter(m => m.on !== false && (m.status == null || m.status === "approved")).length },
        { l: "Parcours certifiants", v: R.PARCOURS.length },
        { l: "Vidéos", v: videos.filter(v => v.status == null || v.status === "approved").length },
        { l: "Présentations", v: presentations.filter(p => p.on !== false).length },
        { l: "Offres de stage", v: (d.stages || []).length },
      ] },
      { titre: "Tests psychotechniques et services", ico: "brain", kpis: [
        { l: "Tests passés", v: psycho.length },
        { l: "Score moyen", v: moyenne(psycho), suffixe: " %" },
        { l: "Demandes de services", v: (d.demandes || []).length },
      ] },
    ],
    parcours,
  };
}

module.exports = { indicateurs, dateInscription };
