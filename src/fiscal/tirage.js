// Tirage d'une série de QCM dans la banque d'un module :
// - n questions (10) parmi la banque (15), dans un ordre aléatoire ;
// - au moins 30 % de questions absentes de la série précédente (quand la banque le permet) ;
// - propositions mélangées : la bonne réponse change de lettre d'une tentative à l'autre.
export const melanger = (a, rnd = Math.random) => {
  const t = [...a];
  for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
};

export function tirerSerie(banque, precedente = [], { n = 10, partNouvelles = 0.3, rnd = Math.random } = {}) {
  const tous = banque.map((_, i) => i);
  const nb = Math.min(n, tous.length);
  const prec = new Set(precedente.filter(i => i >= 0 && i < banque.length));
  const hors = melanger(tous.filter(i => !prec.has(i)), rnd), dans = melanger(tous.filter(i => prec.has(i)), rnd);
  // nombre de nouvelles questions : au moins 30 % de la série, au plus tout ce qui est disponible
  const kMin = Math.min(hors.length, Math.max(prec.size ? Math.ceil(nb * partNouvelles) : 0, nb - dans.length));
  const kMax = Math.min(hors.length, nb);
  const k = kMin + Math.floor(rnd() * (kMax - kMin + 1));
  const choix = melanger([...hors.slice(0, k), ...dans.slice(0, nb - k)], rnd);
  return choix.map(idx => {
    const q = banque[idx], ordre = melanger(q.r.map((_, j) => j), rnd);
    return { ...q, idx, r: ordre.map(j => q.r[j]), b: ordre.indexOf(q.b) };
  });
}

// Mémoire de la dernière série par module (navigateur) : le prochain essai renouvelle les questions
const cle = id => `ec_qcm_${id}`;
export const lireSerie = id => { try { const v = JSON.parse(localStorage.getItem(cle(id)) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
export const ecrireSerie = (id, serie) => { try { localStorage.setItem(cle(id), JSON.stringify(serie.map(q => q.idx))); } catch {} };
