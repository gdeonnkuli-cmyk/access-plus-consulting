// ══════════════════ BANNIÈRE PUBLICITAIRE DE L'ACCUEIL ══════════════════
// Sur la page d'accueil de l'apprenant uniquement : de courts messages défilent toutes les 30 secondes
// (réglable par l'admin), dans un ordre aléatoire propre à chaque utilisateur et renouvelé chaque jour.
// Les messages dépendent de la situation : « visiteurs » = sans accès actif (offres, accroches) ;
// « abonnes » = accès actif (défis, nouveautés) ; « tous » = astuces fiscales et comptables.
// Ce n'est ni une notification ni un message : rien dans la cloche, aucun push.
// Réglages admin : config/marketing { actif, intervalleS, desactives: [id], perso: [{ id, cible, type, titre, texte, vue }] }.
// L'utilisateur peut masquer la bannière (localStorage ec_mkt_off, propre à l'appareil) et la réactiver dans Paramètres.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

export const TYPES_MKT = {
  astuce: { l: "Astuce", ico: "bulb", col: "#C98A1B" },
  defi: { l: "Défi", ico: "target", col: "#7C3AED" },
  offre: { l: "Offre", ico: "gift", col: "#A3122A" },
  nouveaute: { l: "Nouveauté", ico: "sparkles", col: "#0D7A6B" },
  motivation: { l: "Motivation", ico: "flame", col: "#C2410C" },
};
export const CIBLES = { tous: "Tout le monde", visiteurs: "Sans accès actif", abonnes: "Abonnés" };
export const INTERVALLES = [15, 30, 45, 60, 120];
export const MKT_DEFAUT = { actif: true, intervalleS: 30, desactives: [], perso: [] };

// {m}, {t}, {a} : prix des offres mensuelle, trimestrielle et annuelle (config/paiement)
export const BANQUE = [
  // Visiteurs : donner envie de s'abonner
  { id: "v1", cible: "visiteurs", type: "offre", titre: "3 mois d'accès complet pour {t} $", texte: "Modules SYSCOHADA, Code des impôts, paie, TVA, atelier États financiers : tout est inclus, soit moins de 5 $ par mois.", vue: "acces" },
  { id: "v2", cible: "visiteurs", type: "offre", titre: "Le module F1 est gratuit", texte: "Découvrez le panorama du système fiscal congolais et faites votre premier QCM, sans abonnement.", vue: "fisc" },
  { id: "v3", cible: "visiteurs", type: "offre", titre: "Vous avez reçu un code ?", texte: "Touchez la clé 🔑 en haut de l'écran et saisissez-le : tous les contenus s'ouvrent aussitôt.", vue: "home" },
  { id: "v4", cible: "visiteurs", type: "offre", titre: "Un an de formation pour {a} $", texte: "L'offre annuelle est la plus avantageuse : apprenez à votre rythme toute l'année, avec les nouveautés incluses.", vue: "acces" },
  { id: "v5", cible: "visiteurs", type: "nouveaute", titre: "Calculez un bulletin de paie en une minute", texte: "Le simulateur du module Paie donne le net, la CNSS, l'IPR et le coût employeur. Inclus dans l'abonnement.", vue: "acces" },
  { id: "v6", cible: "visiteurs", type: "motivation", titre: "La TVA ne vous fera plus peur", texte: "Tri des factures, prorata, crédit, écritures : le module TVA en pratique vous guide pas à pas.", vue: "acces" },
  { id: "v7", cible: "visiteurs", type: "offre", titre: "Commencez dès {m} $", texte: "Un mois pour tout essayer : modules, QCM, simulateurs et cas pratiques corrigés.", vue: "acces" },
  // Abonnés : défis et nouveautés
  { id: "a1", cible: "abonnes", type: "defi", titre: "Défi du moment : 80 % au QCM TVA en pratique", texte: "10 questions tirées au hasard : saurez-vous déclarer un mois de TVA sans faute ?", vue: "fisc" },
  { id: "a2", cible: "abonnes", type: "defi", titre: "Refaites un QCM, il a changé", texte: "À chaque essai, au moins 30 % des questions sont nouvelles et les réponses sont mélangées.", vue: "fisc" },
  { id: "a3", cible: "abonnes", type: "defi", titre: "Un bilan à équilibrer", texte: "Ouvrez l'atelier États financiers : le cas MINOTERIE, en perte, vous attend.", vue: "ef" },
  { id: "a4", cible: "abonnes", type: "nouveaute", titre: "Nouveau : la TVA en pratique (F12)", texte: "Un mois complet à déclarer, le prorata, l'encaissement et un simulateur de déclaration.", vue: "fisc" },
  { id: "a5", cible: "abonnes", type: "nouveaute", titre: "Nouveau : la paie en RDC (F11)", texte: "CNSS, IPR, INPP, ONEM, SMIG 2026 et un simulateur de bulletin de paie.", vue: "fisc" },
  { id: "a6", cible: "abonnes", type: "defi", titre: "Import-export : testez-vous", texte: "Le module F10 et ses 15 questions : procédures, documents et change.", vue: "fisc" },
  { id: "a7", cible: "abonnes", type: "defi", titre: "Le simulateur de paie vous attend", texte: "Saisissez votre propre bulletin et comparez avec votre fiche de paie : surprises garanties.", vue: "fisc" },
  // Tout le monde : astuces
  { id: "t1", cible: "tous", type: "astuce", titre: "1 000 000 FC payés en espèces ?", texte: "Entre assujettis, une facture d'au moins 1 000 000 FC réglée en espèces perd son droit à déduction de TVA (art. 59 bis).", vue: "fisc" },
  { id: "t2", cible: "tous", type: "astuce", titre: "Carburant : la moitié seulement", texte: "Hors cas particuliers, la TVA sur le carburant n'est déductible qu'à 50 % (art. 41).", vue: "fisc" },
  { id: "t3", cible: "tous", type: "astuce", titre: "Le prorata s'arrondit toujours vers le haut", texte: "64,29 % de recettes ouvrant droit à déduction ? Le prorata retenu est de 65 % (art. 43).", vue: "fisc" },
  { id: "t4", cible: "tous", type: "astuce", titre: "Chaque enfant compte pour l'IPR", texte: "L'IPR baisse de 2 % par personne à charge, dans la limite de 9 personnes (art. 89).", vue: "fisc" },
  { id: "t5", cible: "tous", type: "astuce", titre: "Logement : attention aux 30 %", texte: "L'indemnité de logement n'est exonérée que jusqu'à 30 % du salaire de base ; au-delà, elle est imposable.", vue: "fisc" },
  { id: "t6", cible: "tous", type: "astuce", titre: "CNSS : 5 % + 13 %", texte: "Le salarié cotise 5 % ; l'employeur 13 % (pensions, risques professionnels, prestations familiales).", vue: "fisc" },
  { id: "t7", cible: "tous", type: "astuce", titre: "SMIG 2026 : 21 500 FC par jour", texte: "C'est le minimum du manœuvre ordinaire depuis la paie de janvier 2026 (Décret n° 25/22).", vue: "fisc" },
  { id: "t8", cible: "tous", type: "astuce", titre: "IBP : jamais moins de 1 % du CA", texte: "L'IBP est de 30 % du bénéfice fiscal, mais l'impôt minimum de 1 % du chiffre d'affaires s'applique s'il est plus élevé (art. 92).", vue: "fisc" },
  { id: "t9", cible: "tous", type: "astuce", titre: "Déficits : 60 % au plus", texte: "Un déficit antérieur ne s'impute que dans la limite de 60 % du bénéfice fiscal de l'exercice (art. 42).", vue: "fisc" },
  { id: "t10", cible: "tous", type: "astuce", titre: "Le 15, c'est le jour J", texte: "TVA, IPR, CNSS, INPP et ONEM du mois écoulé se déclarent et se paient au plus tard le 15.", vue: "fisc" },
  { id: "t11", cible: "tous", type: "astuce", titre: "Services : la TVA suit l'encaissement", texte: "Pour une prestation de services, la TVA est due quand vous êtes payé, pas quand vous facturez (art. 26).", vue: "fisc" },
  { id: "t12", cible: "tous", type: "astuce", titre: "TVA non déductible : pas en 445", texte: "Elle reste dans le coût de la charge ou de l'immobilisation, jamais dans les comptes de TVA récupérable.", vue: "fisc" },
  { id: "t13", cible: "tous", type: "astuce", titre: "IPR : au moins 2 000 FC par mois", texte: "Après réduction pour charges de famille, l'IPR ne descend jamais sous 2 000 FC par mois (art. 84).", vue: "fisc" },
  { id: "t14", cible: "tous", type: "astuce", titre: "Exporter, c'est TVA à 0 %", texte: "Mais la déduction n'est acquise qu'avec les documents douaniers et la preuve du rapatriement des fonds (art. 39).", vue: "fisc" },
  { id: "t15", cible: "tous", type: "astuce", titre: "Pas d'opération ? Déclarez quand même", texte: "La déclaration TVA du mois est obligatoire même vide, avec la mention « Néant » (art. 60).", vue: "fisc" },
  { id: "t16", cible: "tous", type: "astuce", titre: "Provisions et IBP", texte: "Les provisions ne sont pas déductibles, sauf provisions minières et créances douteuses des établissements de crédit (art. 46).", vue: "fisc" },
  { id: "t17", cible: "tous", type: "astuce", titre: "Le TFT en une phrase", texte: "Il explique la variation de trésorerie par trois flux : exploitation, investissement et financement.", vue: "ef" },
  { id: "t18", cible: "tous", type: "astuce", titre: "Tout ce qui rémunère est imposable", texte: "Salaires, primes, gratifications, avantages en nature : l'IPR frappe toute rémunération du travail (art. 47).", vue: "fisc" },
  { id: "t19", cible: "tous", type: "defi", titre: "Calcul express", texte: "Revenu imposable de 662 000 FC par mois, sans personne à charge : quel IPR ? Réponse : 79 860 FC.", vue: "fisc" },
  { id: "t20", cible: "tous", type: "motivation", titre: "15 minutes par jour", texte: "Un module, un QCM, une astuce : c'est la régularité qui fait les bons comptables.", vue: "home" },
  { id: "t21", cible: "tous", type: "astuce", titre: "Une idée de contenu ?", texte: "Proposez-la dans Suggestions : chaque proposition est lue par l'équipe Éco-Campus.", vue: "sugg" },
  { id: "t22", cible: "tous", type: "astuce", titre: "Ne ratez aucun direct", texte: "Activez les notifications sur votre téléphone dans Paramètres.", vue: "param" },
  { id: "t23", cible: "tous", type: "motivation", titre: "Apprenez à plusieurs", texte: "Partagez Éco-Campus avec un collègue ou un camarade de promotion : on progresse mieux ensemble.", vue: "home" },
];

export const accesActif = u => u?.abonnement === "actif" && !!u.dateExpiration && new Date(u.dateExpiration) > new Date();
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const remplir = (t, prix) => String(t || "").replace(/\{(m|t|a)\}/g, (_, k) => String(prix?.[k] ?? { m: 5, t: 12, a: 40 }[k]).replace(".", ","));

// Messages proposés à un utilisateur selon sa situation et les réglages de l'admin
export function candidats(cfg, abonne) {
  const c = { ...MKT_DEFAUT, ...(cfg || {}) };
  const off = new Set(c.desactives || []);
  return [...BANQUE.filter(m => !off.has(m.id)), ...(c.perso || [])]
    .filter(m => m.titre && (m.cible === "tous" || m.cible === (abonne ? "abonnes" : "visiteurs")));
}
// Liste de la bannière : ordre aléatoire propre à l'utilisateur et au jour, prix remplacés
export function rotation({ uid = "", user, cfg, prix, now = Date.now() }) {
  const c = { ...MKT_DEFAUT, ...(cfg || {}) };
  if (!c.actif) return [];
  const jour = Math.floor(now / 864e5);
  return candidats(c, accesActif(user))
    .map(m => ({ ...m, titre: remplir(m.titre, prix), texte: remplir(m.texte, prix), k: hash(`${uid}:${jour}:${m.id}`) }))
    .sort((a, b) => a.k - b.k);
}
export const intervalleMs = cfg => Math.max(10, Number(cfg?.intervalleS) || MKT_DEFAUT.intervalleS) * 1000;

const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const ecrire = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
export const mktDesactive = () => lire("ec_mkt_off") === "1";
export const setMktDesactive = v => { ecrire("ec_mkt_off", v ? "1" : null); window.dispatchEvent(new Event("ec-mkt")); };

// Réglages de l'admin et prix (config/marketing, config/paiement), plus la préférence de l'appareil
export function useBanniere(db) {
  const [cfg, sCfg] = useState(null), [prix, sPrix] = useState(null), [off, sOff] = useState(mktDesactive());
  useEffect(() => {
    if (!db) return;
    const a = onSnapshot(doc(db, "config", "marketing"), s => sCfg(s.data() || {}), () => sCfg({}));
    const b = onSnapshot(doc(db, "config", "paiement"), s => sPrix(s.data()?.prix || null), () => {});
    return () => { a(); b(); };
  }, [db]);
  useEffect(() => { const f = () => sOff(mktDesactive()); window.addEventListener("ec-mkt", f); return () => window.removeEventListener("ec-mkt", f); }, []);
  return { cfg, prix, off };
}
