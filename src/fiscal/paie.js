// ══════════════════ MOTEUR DE PAIE RDC (module F11) ══════════════════
// Bulletin mensuel : du brut au net et coût employeur. Taux en vigueur en 2026 (voir F11, blocs « maj ») :
//   CNSS (Décret n° 18/04 du 24 novembre 2018) : pensions 5 % salarié + 5 % employeur,
//        risques professionnels 1,5 % et prestations familiales 6,5 % à charge de l'employeur ;
//   ONEM : 0,5 % employeur (depuis le 5 août 2025) ; INPP 2026 : 3,5 % / 3 % / 2 % selon l'effectif, 4 % public ;
//   IPR : barème annuel du Code des impôts mis à jour au 31 mars 2021 (art. 84, 88, 89 O.-L. n° 69/009).
// Assiette des cotisations retenue : rémunération hors immunités (logement ≤ 30 % du salaire de base,
// transport, allocations familiales légales) ; le logement au-delà de 30 % est imposable et cotisable.
export const TAUX_PAIE = {
  cnssSalarie: 5, cnssPensionEmployeur: 5, cnssRisques: 1.5, cnssFamiliales: 6.5,
  onem: 0.5, logementMax: 30, iprPlafond: 30, iprMinMois: 2000, reductionParCharge: 2, chargesMax: 9,
  smigJour: 21500,
};
export const INPP = [
  { k: "1-50", l: "1 à 50 travailleurs", taux: 3.5 },
  { k: "51-300", l: "51 à 300 travailleurs", taux: 3 },
  { k: "300+", l: "Plus de 300 travailleurs", taux: 2 },
  { k: "public", l: "Entreprise publique", taux: 4 },
];
export const TRANCHES_IPR = [
  { de: 0, a: 1944000, taux: 3 },
  { de: 1944001, a: 21600000, taux: 15 },
  { de: 21600001, a: 43200000, taux: 30 },
  { de: 43200001, a: null, taux: 40 },
];

// Arrondi à la dizaine de FC : 5 FC ou moins négligés, au-delà dizaine supérieure (art. 88)
export const arrondiDizaine = x => { const b = Math.floor(x / 10) * 10; return x - b > 5 ? b + 10 : b; };
const bareme = r => TRANCHES_IPR.reduce((s, t, i) => {
  const bas = i ? TRANCHES_IPR[i - 1].a : t.de, haut = t.a == null ? Infinity : t.a;
  return s + Math.max(0, Math.min(r, haut) - bas) * t.taux / 100;
}, 0);

// IPR du mois pour un revenu imposable mensuel : barème annuel ramené au mois, plafond de 30 %,
// réduction de 2 % par personne à charge (9 au plus), minimum de 2 000 FC par mois.
export function iprMensuel(imposableMois, charges = 0) {
  if (imposableMois <= 0) return 0;
  const an = imposableMois * 12;
  const brut = Math.min(bareme(an), an * TAUX_PAIE.iprPlafond / 100);
  const n = Math.min(Math.max(0, Math.floor(charges)), TAUX_PAIE.chargesMax);
  const net = brut * (1 - n * TAUX_PAIE.reductionParCharge / 100);
  return Math.max(TAUX_PAIE.iprMinMois, Math.round(net / 12));
}

const pct = (x, t) => Math.round(x * t / 100);
export function calculPaie({ base = 0, primes = 0, logement = 0, transport = 0, allocations = 0, charges = 0, taille = "1-50" } = {}) {
  const logementImmunise = Math.min(logement, Math.round(base * TAUX_PAIE.logementMax / 100));
  const logementImposable = logement - logementImmunise;
  const brut = base + primes + logement + transport + allocations;
  const assiette = base + primes + logementImposable;
  const cnssSalarie = pct(assiette, TAUX_PAIE.cnssSalarie);
  const imposable = arrondiDizaine(assiette - cnssSalarie);
  const ipr = iprMensuel(imposable, charges);
  const net = brut - cnssSalarie - ipr;
  const tauxInpp = (INPP.find(x => x.k === taille) || INPP[0]).taux;
  const cnssEmployeur = pct(assiette, TAUX_PAIE.cnssPensionEmployeur + TAUX_PAIE.cnssRisques + TAUX_PAIE.cnssFamiliales);
  const inpp = pct(assiette, tauxInpp), onem = pct(assiette, TAUX_PAIE.onem);
  return { brut, logementImmunise, logementImposable, assiette, cnssSalarie, imposable, ipr, net,
    tauxInpp, cnssEmployeur, inpp, onem, coutEmployeur: brut + cnssEmployeur + inpp + onem };
}
