// ══════════════ LECTURE AUDIO : PRÉPARATION DU TEXTE ══════════════
// La lecture utilise la synthèse vocale du navigateur (speechSynthesis), sans serveur ni abonnement.
// Ce module transforme le contenu affiché (leçons fiscales, fiches du guide des comptes, modules de cours)
// en segments courts, réécrits pour l'oral (abréviations, symboles, grands nombres).

const ABREVIATIONS = [
  [/\bO\.-L\./g, "ordonnance-loi"], [/\bA\.M\./g, "arrêté ministériel"], [/\bH\.A\.O\./g, "hors activités ordinaires"],
  [/\bT\.V\.A\./g, "TVA"], [/\bArt\.\s*/g, "Article "], [/\bart\.\s*/g, "article "], [/\bn°\s*/gi, "numéro "],
  [/\bal\.\s*/g, "alinéa "], [/\bcf\.\s*/gi, "voir "], [/\bex\.\s*/g, "par exemple "], [/\betc\./g, "et cetera"],
  [/\bSYSCOHADA\b/g, "Syscohada"], [/\bOHADA\b/g, "Ohada"], [/\bAUDCIF\b/g, "acte uniforme comptable"],
  [/\bN\s*\+\s*1\b/g, "N plus 1"], [/\bN\s*-\s*1\b/g, "N moins 1"],
];
const SYMBOLES = [
  [/≤/g, " inférieur ou égal à "], [/≥/g, " supérieur ou égal à "], [/→/g, ", "], [/⇒/g, ", donc "],
  [/\s<\s/g, " moins de "], [/\s>\s/g, " plus de "], [/±/g, " plus ou moins "], [/×/g, " fois "],
  [/(\d)\s*%/g, "$1 pour cent"], [/\bFC\b/g, "francs congolais"], [/\bUSD\b/g, "dollars"], [/\$/g, " dollars"],
  [/[«»“”"]/g, ""], [/\s\u2212\s/g, " moins "], [/\s[–—-]\s/g, ", "], [/·/g, ", "],
  [/([a-zà-ÿ])\/([a-zà-ÿ])/gi, "$1 ou $2"],
];

// Texte affiché → texte à prononcer
export function pourLecture(t) {
  let s = String(t == null ? "" : t).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  // 10 000 000 → 10000000 (sinon la voix lit les groupes séparément)
  for (let avant = ""; avant !== s;) { avant = s; s = s.replace(/(\d)[\s\u00a0\u202f](?=\d{3}\b)/g, "$1"); }
  for (const [re, r] of ABREVIATIONS) s = s.replace(re, r);
  for (const [re, r] of SYMBOLES) s = s.replace(re, r);
  s = s.replace(/^[\u2212-]\s*/, "moins ").replace(/^=\s*/, "égale ").replace(/^\+\s*/, "plus ");
  return s.replace(/\s+([,.;:])/g, "$1").replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
}

// Découpe en phrases courtes (la synthèse vocale s'interrompt sur les textes trop longs)
export function decouperPhrases(t, max = 220) {
  const s = pourLecture(t);
  if (!s) return [];
  if (s.length <= max) return [s];
  const morceaux = s.match(/[^.!?;:]+[.!?;:]*\s*/g) || [s];
  const out = [];
  let cur = "";
  for (const m of morceaux) {
    if ((cur + m).length > max && cur) { out.push(cur.trim()); cur = ""; }
    if (m.length > max) { m.split(/,\s*/).forEach(x => { if ((cur + x).length > max && cur) { out.push(cur.trim()); cur = ""; } cur += x + ", "; }); }
    else cur += m;
  }
  if (cur.trim()) out.push(cur.trim().replace(/,$/, "."));
  return out.filter(Boolean);
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
export function texteFiche(x, titreDe = () => "") {
  const sansNum = t => String(t).replace(/^\s*\d+\s*[—–).-]\s*/, "");
  const fo = x.fonctionnement || {};
  const T = [point(`Compte ${x.c}. ${x.titre}`)];
  if ((x.contenu || []).length) T.push("Contenu.", ...x.contenu.map(point));
  if ((x.ecr || []).length) {
    T.push("Écritures types.");
    x.ecr.forEach(e => {
      const lignes = e.l.map(([D, C]) => `au débit, ${D.map(n => `${n} ${titreDe(n)}`).join(" et ")} ; au crédit, ${C.map(n => `${n} ${titreDe(n)}`).join(" et ")}`).join(" ; puis ");
      T.push(point(`${e.q || e.op} : ${lignes}`));
    });
  }
  if ((fo.credit || []).length) T.push("Le compte est crédité.", ...fo.credit.map(point));
  if ((fo.debit || []).length) T.push("Le compte est débité.", ...fo.debit.map(point));
  if (x.dist || (x.exclusions || []).length) T.push("Distinctions et exclusions.", point(x.dist), ...(x.exclusions || []).map(point));
  if (x.ctrl) T.push("Éléments de contrôle.", point(x.ctrl));
  if ((x.commentaires || []).length) T.push("Commentaires.", ...x.commentaires.map(c => point(sansNum(c))));
  if ((x.changements || []).length) T.push("Ce qui change avec le Syscohada révisé.", ...x.changements.map(c => point(String(c).replace(/^Ce qui change avec le SYSCOHADA révisé\s*:\s*/i, ""))));
  return segments(T);
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
