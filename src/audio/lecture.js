// ══════════════ LECTURE AUDIO : PRÉPARATION DU TEXTE ══════════════
// La lecture utilise la synthèse vocale du navigateur (speechSynthesis), sans serveur ni abonnement.
// Ce module transforme le contenu affiché (leçons fiscales, fiches du guide des comptes, modules de cours)
// en segments courts, réécrits pour l'oral (abréviations, symboles, grands nombres).

const ABREVIATIONS = [
  [/\bO\.-L\./g, "ordonnance-loi"], [/\bA\.M\./g, "arrêté ministériel"],
  [/\bT\.V\.A\./g, "TVA"], [/\bArt\.\s*/g, "Article "], [/\bart\.\s*/g, "article "], [/\bn°\s*/gi, "numéro "],
  [/\bal\.\s*/g, "alinéa "], [/\bcf\.\s*/gi, "voir "], [/\bex\.\s*/g, "par exemple "], [/\betc\./g, "et cetera"],
  [/\bSYSCOHADA\b/g, "Syscohada"], [/\bOHADA\b/g, "Ohada"], [/\bAUDCIF\b/g, "acte uniforme comptable"],
  [/\bN\s*\+\s*1\b/g, "N plus 1"], [/\bN\s*-\s*1\b/g, "N moins 1"],
  // Sigles mal prononcés par la voix de synthèse (« RDC » lu « rez-de-chaussée », « CA » lu « ça »…)
  [/\bR\.D\.C\.|\bRDC\b/g, "République démocratique du Congo"], [/\bR\.H\.A\.O\.?/g, "résultat hors activités ordinaires"],
  [/\bH\.A\.O\.?|\bHAO\b/g, "hors activités ordinaires"], [/\bL\.\s?F\./g, "loi de finances"],
  [/\bCA\b/g, "chiffre d'affaires"], [/\bSA\b/g, "S.A."], [/\bHT\b/g, "hors taxes"], [/\bTTC\b/g, "toutes taxes comprises"],
  [/\bIM\b/g, "impôt mobilier"], [/\bAMR\b/g, "avis de mise en recouvrement"], [/\bATD\b/g, "avis à tiers détenteur"],
  [/\bPV\b/g, "procès-verbal"], [/\bETS\b/g, "établissements"], [/\bASBL\b/g, "association sans but lucratif"],
  // Facture normalisée : sigles épelés (« DEF » serait lu comme un mot)
  [/\be-DEF\b/g, "e-D E F"], [/\bDEF\b/g, "D E F"], [/\be-MCF\b/g, "e-M C F"], [/\bMCF\b/g, "M C F"], [/\be-UF\b/g, "e-U F"],
  [/\bSFE\b/g, "S F E"], [/\bRCCM\b/g, "R C C M"],
  [/\bC\.M\.P\.?/g, "coût moyen pondéré"], [/\bP\.E\.P\.S\.?/g, "premier entré, premier sorti"], [/\bG\.I\.E\.?/g, "groupement d'intérêt économique"],
];
const SYMBOLES = [
  [/≤/g, " inférieur ou égal à "], [/≥/g, " supérieur ou égal à "], [/→/g, ", "], [/⇒/g, ", donc "],
  [/\s=\s/g, " égale "], [/\s<\s/g, " moins de "], [/\s>\s/g, " plus de "], [/±/g, " plus ou moins "], [/×/g, " fois "],
  [/(\d)\s*%/g, "$1 pour cent"], [/\bFC\b/g, "francs congolais"], [/\bUSD\b/g, "dollars"], [/\$/g, " dollars"],
  [/[«»“”"]/g, ""], [/\s\u2212\s/g, " moins "], [/\s[–—-]\s/g, ", "], [/·/g, ", "],
  [/([a-zà-ÿ])\/([a-zà-ÿ])/gi, "$1 ou $2"],
  // Parenthèses et crochets : courte pause, comme à l'oral (la voix les ignore sinon)
  [/\s*[([]\s*/g, ", "], [/\s*[)\]]\s*(?=[.,;:!?]|$)/g, ""], [/\s*[)\]]\s*/g, ", "],
];

// Texte affiché → texte à prononcer
export function pourLecture(t) {
  let s = String(t == null ? "" : t).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  // 10 000 000 → 10000000 (sinon la voix lit les groupes séparément)
  for (let avant = ""; avant !== s;) { avant = s; s = s.replace(/(\d)[\s\u00a0\u202f](?=\d{3}\b)/g, "$1"); }
  for (const [re, r] of ABREVIATIONS) s = s.replace(re, r);
  for (const [re, r] of SYMBOLES) s = s.replace(re, r);
  s = s.replace(/^[\u2212-]\s*/, "moins ").replace(/^=\s*/, "égale ").replace(/^\+\s*/, "plus ");
  return s.replace(/\s+([,.;:])/g, "$1").replace(/,\s*,/g, ",").replace(/,([.;:!?])/g, "$1").replace(/([.;:!?])\s*,/g, "$1").replace(/\s+/g, " ").trim().replace(/^[,;]\s*/, "");
}

// Regroupe des morceaux successifs tant que la longueur reste sous le maximum
function regrouper(parts, sep, max) {
  const out = [];
  let cur = "";
  for (const x of parts) {
    if (cur && (cur + sep + x).length > max) { out.push(cur); cur = x; }
    else cur = cur ? cur + sep + x : x;
  }
  if (cur) out.push(cur);
  return out;
}
// Découpe en phrases courtes (la synthèse vocale s'interrompt sur les textes trop longs) : d'abord aux fins de
// phrase (. ! ? ; :), puis, pour une phrase encore trop longue, aux virgules suivies d'une espace (« 3,5 » reste entier)
export function decouperPhrases(t, max = 220) {
  const s = pourLecture(t);
  if (!s) return [];
  if (s.length <= max) return [s];
  const phrases = (s.match(/[^.!?;:]+(?:[.!?;:]+|$)/g) || [s]).map(x => x.trim()).filter(Boolean);
  const pieces = phrases.flatMap(p => (p.length <= max ? [p] : regrouper(p.split(/,\s+/), ", ", max)));
  return regrouper(pieces, " ", max);
}

// Liste de textes → segments prêts à lire
export const segments = textes => textes.flat().filter(x => x != null && String(x).trim()).flatMap(t => decouperPhrases(t));
// Durée estimée à vitesse normale (≈ 14 caractères par seconde)
export const dureeMinutes = segs => Math.max(1, Math.round(segs.reduce((n, s) => n + s.length, 0) / 14 / 60));

const point = t => { const s = String(t || "").trim(); return s && !/[.!?:;]$/.test(s) ? `${s}.` : s; };

// ── Leçon d'un module du Code des impôts (src/fiscal/modules)
export function texteModuleFiscal(mod) {
  const T = [point(`Module ${mod.id}. ${mod.titre}`), point(mod.resume)];
  for (const b of mod.blocs || []) {
    if (b.type === "essentiel") T.push("L'essentiel en trente secondes.", point(b.texte));
    else if (b.type === "texte") T.push(point(b.titre), ...(b.p || []).map(point), ...(b.puces || []).map(point));
    else if (b.type === "schema") {
      T.push(point(b.titre));
      if (b.kind === "flux") (b.etapes || []).forEach(e => T.push(point(`${e.op === "=" ? "Égale" : e.op === "−" || e.op === "-" ? "Moins" : e.op === "+" ? "Plus" : ""} ${e.l}${e.d ? ` : ${e.d}` : ""}`)));
      else if (b.kind === "chronologie") (b.jalons || []).forEach(j => T.push(point(`${j.date} : ${j.l}. ${j.d || ""}`)));
      else if (b.kind === "arbre") { T.push(point(b.question)); (b.branches || []).forEach(x => T.push(point(`Si ${x.si} : ${x.alors}. ${x.d || ""}`))); }
      else if (b.kind === "cartes") (b.cartes || []).forEach(c => T.push(point(`${c.t} : ${c.d}`)));
      else if (b.kind === "tableau") (b.lignes || []).forEach(l => T.push(point(l.map((v, i) => (b.entetes && b.entetes[i] && i ? `${b.entetes[i]} : ${v}` : v)).join(", "))));
      else T.push("Ce schéma interactif s'utilise à l'écran.");
      if (b.note) T.push(point(b.note));
    } else if (b.type === "exemple") {
      T.push(point(b.titre || "Exemple chiffré"), point(b.enonce));
      (b.lignes || []).forEach(([l, v]) => T.push(point(`${l} : ${typeof v === "number" ? `${Math.round(v).toLocaleString("fr-FR")} francs congolais` : v}`)));
      if (b.conclusion) T.push(point(b.conclusion));
    } else if (b.type === "pieges") T.push("Les pièges à éviter.", ...(b.puces || []).map(point));
    else if (b.type === "maj") T.push("Mise à jour.", point(b.texte));
  }
  return segments(T);
}

// ── Fiche d'un compte du guide (classes SYSCOHADA + compléments) ; titres : numéro → intitulé
// Sections lisibles séparément (bouton 🔊 de chaque cadre de la fiche) ou ensemble (« Écouter la fiche »)
export const SECTIONS_FICHE = ["contenu", "ecr", "fonct", "dist", "ctrl", "comm", "chg"];
function texteSectionBrut(x, id, titreDe) {
  const sansNum = t => String(t).replace(/^\s*\d+\s*[—–).-]\s*/, "");
  const fo = x.fonctionnement || {};
  if (id === "contenu") return (x.contenu || []).length ? ["Contenu.", ...x.contenu.map(point)] : [];
  if (id === "ecr") return (x.ecr || []).length ? ["Écritures types.", ...x.ecr.map(e => point(`${e.q || e.op} : ${e.l.map(([D, C]) => `au débit, ${D.map(n => `${n} ${titreDe(n)}`).join(" et ")} ; au crédit, ${C.map(n => `${n} ${titreDe(n)}`).join(" et ")}`).join(" ; puis ")}`))] : [];
  if (id === "fonct") return [...((fo.credit || []).length ? ["Le compte est crédité.", ...fo.credit.map(point)] : []), ...((fo.debit || []).length ? ["Le compte est débité.", ...fo.debit.map(point)] : [])];
  if (id === "dist") return x.dist || (x.exclusions || []).length ? ["Distinctions et exclusions.", point(x.dist), ...(x.exclusions || []).map(point)] : [];
  if (id === "ctrl") return x.ctrl ? ["Éléments de contrôle.", point(x.ctrl)] : [];
  if (id === "comm") return (x.commentaires || []).length ? ["Commentaires.", ...x.commentaires.map(c => point(sansNum(c)))] : [];
  if (id === "chg") return (x.changements || []).length ? ["Ce qui change avec le Syscohada révisé.", ...x.changements.map(c => point(String(c).replace(/^Ce qui change avec le SYSCOHADA révisé\s*:\s*/i, "")))] : [];
  return [];
}
export const texteSection = (x, id, titreDe = () => "") => {
  const T = texteSectionBrut(x, id, titreDe);
  return T.length ? segments([point(`Compte ${x.c}`), ...T]) : [];
};
export function texteFiche(x, titreDe = () => "") {
  return segments([point(`Compte ${x.c}. ${x.titre}`), ...SECTIONS_FICHE.flatMap(id => texteSectionBrut(x, id, titreDe))]);
}

// ── Module de cours (titre, description, exercice si accessible)
export function texteModuleCours(mod, avecExercice = true) {
  const T = [point(mod.titre), point(mod.desc)];
  const ex = mod.ex;
  if (avecExercice && ex) {
    T.push(point(`Exercice${ex.ti ? ` : ${ex.ti}` : ""}`), point(ex.en));
    if ((ex.dn || []).length) T.push("Données.", ...ex.dn.map(r => point(`${r.a} : ${r.b}`)));
    if ((ex.tv || []).length) T.push("Travail demandé.", ...ex.tv.map(point));
  }
  return segments(T);
}

// ── Narration d'une présentation (champ « narration » saisi par l'administration) : paragraphes séparés
// par une ligne vide, en général un par diapositive (« Diapositive 3. … ») pour suivre à l'écran
export const paragraphesNarration = t => String(t || "").split(/\n\s*\n/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
export function texteNarration(p) {
  const P = paragraphesNarration(p && p.narration);
  return P.length ? segments([point(p.titre), ...P.map(point)]) : [];
}

// ── Module de finance d'entreprise (src/finance/modules.js) : narration écrite pour l'oral
export function texteModuleFinance(mod) {
  return segments([point(`Finance d'entreprise, module ${String(mod.id).replace(/^FE/, "")}. ${mod.titre}`), ...(mod.narration || []).map(point)]);
}
