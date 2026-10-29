// ══════════════ ATTESTATIONS : PARCOURS ET RÈGLES DE DÉLIVRANCE ══════════════
// Fichier CommonJS partagé par l'application (aperçu de l'avancement) et la fonction serveur
// api/attestation.js (contrôle et délivrance) : les deux appliquent exactement les mêmes règles.
//
// Deux attestations par parcours :
// - de suivi : tous les éléments du parcours sont faits (QCM passé ou module terminé) ;
// - de réussite : chaque élément évalué au moins SEUIL_ELEMENT %, moyenne au moins SEUIL_MOYENNE %.
// Scores lus dans users/{uid}.scores (meilleur score conservé) ; progression dans users/{uid}.progress.

const SEUIL_ELEMENT = 70;
const SEUIL_MOYENNE = 80;
const SIGNATAIRE = { nom: "Gédéon NKULI", fonction: "Responsable pédagogique" };
const ORGANISME = "Éco-Campus RDC — Access Plus Consulting";

// Leçons du Code des impôts (doit rester aligné sur src/fiscal/modules — vérifié par regles.test.js)
const FISC = [
  ["F1", "Panorama du système fiscal congolais"], ["F2", "Impôt sur les bénéfices et profits (IBP)"],
  ["F3", "Impôt professionnel sur les rémunérations (IPR)"], ["F4", "Impôt mobilier et impôt sur les revenus locatifs"],
  ["F5", "Le régime des entreprises de petite taille"], ["F6", "Taxe sur la valeur ajoutée (TVA)"],
  ["F7", "Obligations déclaratives et contrôle fiscal"], ["F8", "Sanctions, recouvrement et contentieux"],
  ["F9", "Impôts réels, TSCR et conventions fiscales"], ["F10", "Import-export : procédures, documents et change"],
  ["F11", "La paie en RDC : du brut au net, cotisations et écritures"], ["F12", "La TVA en pratique : déclarer son mois sans erreur"],
  ["F13", "La facture normalisée : émettre, vérifier, déduire"],
];

// Modules de finance d'entreprise (doit rester aligné sur src/finance/modules — vérifié par regles.test.js)
const FIN = [
  ["FE1", "Le coût du capital"], ["FE2", "Rentabilité, effet de levier et création de valeur"], ["FE3", "Choisir un investissement"],
  ["FE4", "Choisir un financement"], ["FE5", "Évaluer une entreprise"], ["FE6", "Gérer le risque de change USD/CDF"],
  ["FE7", "Affecter le résultat d'une société (OHADA)"],
];

const PARCOURS = [
  { id: "SYS-N1", titre: "Comptabilité SYSCOHADA révisé — Niveau 1 : fondamentaux", court: "SYSCOHADA · Niveau 1",
    description: "Modules de cours de comptabilité générale et exercice « Quel compte ? » sur l'ensemble du plan." },
  { id: "FISC", titre: "Fiscalité congolaise — Le Code des impôts", court: "Fiscalité RDC",
    description: "Les 13 modules du Code des impôts : IBP, IPR, IM et IRL, TVA, obligations, contentieux, import-export, paie, facture normalisée." },
  { id: "SYS-N2", titre: "Comptabilité SYSCOHADA révisé — Niveau 2 : pratique", court: "SYSCOHADA · Niveau 2",
    description: "Monographie ZAO IMMO SARL (tenue comptable d'un exercice) et exercice « Quel compte ? » classe par classe." },
  { id: "FIN", titre: "Finance d'entreprise — RDC et espace OHADA", court: "Finance d'entreprise",
    description: "Les 7 modules de finance d'entreprise : coût du capital, levier et création de valeur, investissement, financement, évaluation, risque de change USD/CDF et affectation du résultat OHADA, avec 16 cas corrigés." },
];

// Modules de cours pris en compte : ceux publiés (on !== false), dans l'ordre du catalogue
const modulesActifs = modules => (modules || []).filter(m => m && m.on !== false).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

// Éléments d'un parcours : { cle, titre, heures, evalue } (cle = clé de users.scores / users.progress)
function elementsParcours(id, modules) {
  if (id === "SYS-N1") return [
    ...modulesActifs(modules).map(m => ({ cle: m.id, titre: m.titre, heures: 2, evalue: m.evalType !== "none" })),
    { cle: "CPT-T", titre: "Exercice « Quel compte ? » — toutes classes", heures: 2, evalue: true },
  ];
  if (id === "FISC") return FISC.map(([f, t]) => ({ cle: `FISC-${f}`, titre: `${f} · ${t}`, heures: 1, evalue: true }));
  // 2 h par module : leçon et cas corrigés
  if (id === "FIN") return FIN.map(([f, t]) => ({ cle: `FIN-${f}`, titre: `${f} · ${t}`, heures: 2, evalue: true }));
  if (id === "SYS-N2") return [
    { cle: "JRN-ZAO", titre: "Monographie ZAO IMMO SARL — tenue comptable 2021", heures: 10, evalue: true },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => ({ cle: `CPT-${k}`, titre: `Exercice « Quel compte ? » — classe ${k}`, heures: 1, evalue: true })),
  ];
  return [];
}

const mention = moy => (moy == null ? null : moy >= 95 ? "Excellent" : moy >= 90 ? "Très bien" : moy >= SEUIL_MOYENNE ? "Bien" : null);

// Évaluation d'un parcours pour un apprenant ({ scores, progress })
function evaluer(id, modules, user) {
  const scores = (user && user.scores) || {}, progress = (user && user.progress) || {};
  const elements = elementsParcours(id, modules).map(e => {
    const s = scores[e.cle];
    const pct = s && s.pct != null ? Math.round(s.pct) : null;
    const fait = e.evalue ? pct != null : progress[e.cle] === "done";
    return { ...e, pct, fait, reussi: fait && (!e.evalue || pct >= SEUIL_ELEMENT) };
  });
  const notes = elements.filter(e => e.evalue && e.pct != null).map(e => e.pct);
  const moyenne = notes.length ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length) : null;
  const nFaits = elements.filter(e => e.fait).length;
  const suivi = elements.length > 0 && nFaits === elements.length;
  const reussite = suivi && elements.every(e => e.reussi) && moyenne != null && moyenne >= SEUIL_MOYENNE;
  return {
    id, elements, moyenne, nFaits, nTotal: elements.length, suivi, reussite,
    mention: reussite ? mention(moyenne) : null,
    heures: Math.round(elements.reduce((a, e) => a + e.heures, 0)),
    aAmeliorer: elements.filter(e => e.fait && e.evalue && e.pct < SEUIL_ELEMENT).map(e => e.titre),
    aFaire: elements.filter(e => !e.fait).map(e => e.titre),
  };
}

// Numéro d'attestation : EC-AAAA-XXXXXX (alphabet sans caractères ambigus : ni 0/O, ni 1/I/L)
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function numeroAttestation(alea = Math.random, annee = new Date().getFullYear()) {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(alea() * ALPHABET.length) % ALPHABET.length];
  return `EC-${annee}-${s}`;
}
const numeroValide = n => /^EC-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(String(n || ""));

module.exports = { SEUIL_ELEMENT, SEUIL_MOYENNE, SIGNATAIRE, ORGANISME, FISC, FIN, PARCOURS, elementsParcours, evaluer, mention, numeroAttestation, numeroValide, modulesActifs };
