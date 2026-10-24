// ══════════════ EXERCICE « QUEL COMPTE ? » ══════════════
// Questions tirées des écritures types du guide (complements.json, fusionnés dans les classes) :
// l'apprenant saisit les comptes et le sens (débit / crédit) ; la correction se fait ligne par ligne.

export const NB_QUESTIONS = 10;

// Sous-comptes « par défaut » du plan : la racine suffit (5212 vaut 5211, 401 vaut 4011…)
const RACINE = { "5211": "521", "5711": "571", "4011": "401", "4111": "411", "4621": "462" };

// Énoncé de la question : énoncé dédié, sinon libellé de l'écriture, précisé du moyen de règlement
export function enonce(e) {
  let t = e.q || e.op;
  const comptes = e.l.flatMap(([D, C]) => [...D, ...C]);
  if (comptes.includes("5211") && !/banque|bancaire|chèque|virement|escompte/i.test(t)) t += " (par banque)";
  else if (comptes.includes("5711") && !/caisse|espèces|comptant/i.test(t)) t += " (en espèces)";
  return t;
}

// Réservoir de questions d'une classe (k de 1 à 9) ou de toutes (k = 0)
export function reservoir(classes, k = 0) {
  return classes.filter(C => !k || C.classe === k)
    .flatMap(C => C.comptes.flatMap(x => (x.ecr || []).map((e, i) => ({ id: `${x.c}-${i}`, k: C.classe, c: x.c, titre: x.titre, e }))));
}

// Tirage sans remise (aléa injectable pour les tests)
export function tirer(liste, n = NB_QUESTIONS, alea = Math.random) {
  const L = [...liste];
  for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  return L.slice(0, n);
}

const chiffres = s => String(s || "").replace(/\D/g, "");
const attendus = e => e.l.flatMap(([D, C]) => [...D.map(n => ({ n, s: "D" })), ...C.map(n => ({ n, s: "C" }))]);
// Compte saisi compatible avec le compte attendu : identique, plus détaillé, ou au moins au niveau de la racine à 3 chiffres
const compatible = (a, e) => {
  const r = RACINE[e] || e;
  return a === e || a.startsWith(r) || (r.startsWith(a) && a.length >= Math.min(3, r.length));
};
// Sous-compte voisin (même compte à 3 chiffres, subdivision différente) : accepté, avec la subdivision attendue en rappel
const voisin = (a, e) => a.length >= 4 && e.length >= 4 && a.slice(0, 3) === e.slice(0, 3);
const tropVague = (a, e) => a.length >= 1 && (RACINE[e] || e).startsWith(a);

// saisie : [{ c, s: "D" | "C" }] → { ok, lignes: [{ c, s, etat: ok | proche | sens | vague | faux, attendu? }], manquants: [{ n, s }], nOk, nAtt }
export function corriger(e, saisie = []) {
  const A = attendus(e).map(x => ({ ...x, pris: false }));
  const S = saisie.map(l => ({ c: chiffres(l.c), s: l.s === "C" ? "C" : "D" })).filter(l => l.c);
  const lignes = S.map(l => {
    const x = A.find(x => !x.pris && x.s === l.s && compatible(l.c, x.n));
    if (x) { x.pris = true; return { ...l, etat: "ok", attendu: x.n }; }
    return { ...l };
  }).map(l => {
    if (l.etat) return l;
    const x = A.find(x => !x.pris && x.s === l.s && voisin(l.c, x.n));
    if (x) { x.pris = true; return { ...l, etat: "proche", attendu: x.n }; }
    return l;
  }).map(l => {
    if (l.etat) return l;
    const autreSens = A.find(x => !x.pris && compatible(l.c, x.n));
    if (autreSens) return { ...l, etat: "sens", attendu: autreSens.n };
    const vague = A.find(x => !x.pris && tropVague(l.c, x.n));
    return vague ? { ...l, etat: "vague", attendu: vague.n } : { ...l, etat: "faux" };
  });
  const manquants = A.filter(x => !x.pris).map(({ n, s }) => ({ n, s }));
  const bon = l => l.etat === "ok" || l.etat === "proche";
  const nOk = lignes.filter(bon).length;
  return { ok: !manquants.length && lignes.every(bon), lignes, manquants, nOk, nAtt: A.length };
}
