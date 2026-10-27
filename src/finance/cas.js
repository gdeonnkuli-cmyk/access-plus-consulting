// ══════════════════ FINANCE D'ENTREPRISE : 16 CAS CORRIGÉS ══════════════════
// Exercices originaux adaptés à la RDC et à l'espace OHADA (validés par le responsable pédagogique, octobre 2026).
// Tous les chiffres des corrigés sont calculés ici : aucun résultat n'est saisi à la main.
// Un cas : { n, theme, titre, enonce: [..], donnees?: [[libellé, valeur]], tableau?: { e, l }, questions: [..],
//   corrige: [{ q, t: [..], tab?: { e, l, w? }, t2?: [..] }], retenir }
const f = (n, d = 0) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, " ").replace(/^-/, "−");
const p = (x, d = 2) => f(x * 100, d) + " %";
const act = (flux, r) => flux.reduce((s, v, t) => s + v / (1 + r) ** t, 0);
const tri = flux => { let a = -0.99, b = 5; for (let i = 0; i < 200; i++) { const m = (a + b) / 2; (act(flux, a) > 0) === (act(flux, m) > 0) ? (a = m) : (b = m); } return (a + b) / 2; };
const ann = (r, n) => (1 - (1 + r) ** -n) / r;

export const CAS = [];
export const THEMES = {
  cc: "Coût du capital",
  dg: "Diagnostic financier",
  inv: "Choix d'investissement",
  fin: "Choix de financement",
  ev: "Évaluation d'entreprise",
  chg: "Risque de change",
  res: "Affectation du résultat (OHADA)",
};

// ───────── 1. MEDAF et prime de risque pays
{
  const rf = 0.08, pm = 0.07, b = 1.2, rp = 0.04, b2 = 0.9;
  const ke = rf + b * pm + rp, ke2 = rf + b2 * pm + rp;
  CAS.push({
    theme: THEMES.cc, titre: "Coût des capitaux propres par le MEDAF, avec prime de risque pays",
    enonce: [
      "La société KIN-BÂTI SA, entreprise de travaux publics basée à Kinshasa, veut connaître la rentabilité minimale exigée par ses actionnaires. Elle travaille en dollars américains (USD).",
      "Données retenues par son analyste :",
    ],
    donnees: [
      ["Taux sans risque (titre public en USD)", p(rf)],
      ["Prime de risque du marché", p(pm)],
      ["Bêta des actions de KIN-BÂTI", f(b, 2)],
      ["Prime de risque pays RDC", p(rp)],
    ],
    questions: [
      "Calculez le coût des capitaux propres de KIN-BÂTI.",
      "Un actionnaire propose de diversifier l'activité vers l'entretien de routes, moins cyclique : le bêta tomberait à " + f(b2, 2) + ". Quel serait le nouveau coût des capitaux propres ?",
      "Pourquoi ajoute-t-on une prime de risque pays pour une société congolaise ?",
    ],
    corrige: [
      { q: 1, t: [
        "Formule du MEDAF complétée de la prime de risque pays : kₑ = r_f + β × (prime de marché) + prime pays.",
        `kₑ = ${p(rf)} + ${f(b, 2)} × ${p(pm)} + ${p(rp)} = ${p(ke)}.`,
        `Les actionnaires exigent donc au moins ${p(ke)} par an sur les fonds qu'ils laissent dans l'entreprise.`,
      ] },
      { q: 2, t: [`kₑ = ${p(rf)} + ${f(b2, 2)} × ${p(pm)} + ${p(rp)} = ${p(ke2)}, soit ${f((ke - ke2) * 100, 1)} points de moins. Une activité moins sensible aux cycles économiques réduit le risque systématique, donc la rentabilité exigée.`] },
      { q: 3, t: ["Le bêta ne mesure que le risque lié au marché. Une société congolaise supporte en plus des risques propres au pays : instabilité du franc congolais, risque politique, difficulté à rapatrier des fonds, système judiciaire. Les investisseurs demandent une compensation : c'est la prime de risque pays, souvent estimée à partir de l'écart entre le rendement des emprunts d'État du pays et celui d'un émetteur jugé sans risque."] },
    ],
    retenir: "kₑ = r_f + β × (E(R_m) − r_f) + prime pays. Le bêta mesure le risque systématique ; la prime pays couvre les risques propres à la RDC.",
  });
}

// ───────── 2. CMPC
{
  const CP = 6e6, D = 4e6, kd = 0.14, t = 0.3, ke = 0.08 + 1.2 * 0.07 + 0.04, proj = 0.15;
  const wcp = CP / (CP + D), wd = D / (CP + D), kdn = kd * (1 - t), cmpc = wcp * ke + wd * kdn;
  CAS.push({
    theme: THEMES.cc, titre: "Coût moyen pondéré du capital (CMPC)",
    enonce: ["On reprend KIN-BÂTI SA (exercice 1). Sa structure de financement, en valeurs de marché, est la suivante :"],
    donnees: [
      ["Capitaux propres", f(CP) + " USD"],
      ["Dettes financières", f(D) + " USD"],
      ["Coût des capitaux propres (exercice 1)", p(ke)],
      ["Taux d'intérêt moyen des emprunts bancaires", p(kd)],
      ["Impôt sur les bénéfices et profits (IBP)", p(t, 0)],
    ],
    questions: [
      "Calculez le coût de la dette après impôt.",
      "Calculez le CMPC de KIN-BÂTI.",
      "Un projet de carrière de concassage rapporte " + p(proj, 0) + " par an et présente le même risque que l'activité actuelle. Faut-il l'accepter ?",
    ],
    corrige: [
      { q: 1, t: [`Les intérêts sont déductibles de l'IBP : chaque dollar d'intérêt réduit l'impôt de ${f(t, 2)} USD. Coût net : k_d × (1 − t) = ${p(kd)} × ${f(1 - t, 2)} = ${p(kdn)}.`] },
      { q: 2, t: [
        `Poids : capitaux propres ${f(CP)} / ${f(CP + D)} = ${p(wcp, 0)} ; dettes ${p(wd, 0)}.`,
        `CMPC = ${p(wcp, 0)} × ${p(ke)} + ${p(wd, 0)} × ${p(kdn)} = ${p(wcp * ke)} + ${p(wd * kdn)} = ${p(cmpc)}.`,
      ] },
      { q: 3, t: [`Le projet rapporte ${p(proj, 0)}, moins que le CMPC de ${p(cmpc)}. Il ne couvre pas le coût des ressources qui le financent : il détruirait de la valeur. Il faut le refuser, sauf si son risque est plus faible que celui de l'activité actuelle (on utiliserait alors un taux propre au projet).`] },
    ],
    retenir: "CMPC = [CP / (CP + D)] × kₑ + [D / (CP + D)] × k_d × (1 − t). Les poids se calculent en valeurs de marché, pas en valeurs comptables, quand c'est possible.",
  });
}

// ───────── 3. Bêta de comparables
{
  const t = 0.3, comp = [["MBOKA CONSTRUCTION", 1.3, 0.5], ["CONGO GÉNIE CIVIL", 1.1, 0.3], ["LUALABA TRAVAUX", 1.45, 0.8]], cible = 0.6;
  const bu = comp.map(([, bl, de]) => bl / (1 + (1 - t) * de)), bm = bu.reduce((a, b) => a + b) / bu.length;
  const bl = bm * (1 + (1 - t) * cible), ke = 0.08 + bl * 0.07 + 0.04;
  CAS.push({
    theme: THEMES.cc, titre: "Bêta d'une société non cotée à partir de comparables",
    enonce: [
      "La société BÉTON DU FLEUVE SARL n'est pas cotée : on ne peut pas mesurer son bêta directement. Son expert-comptable relève les bêtas de trois entreprises du même secteur, dont les actions sont échangées sur un marché régional. L'IBP est de 30 % pour toutes.",
      "BÉTON DU FLEUVE vise un ratio dettes / capitaux propres de " + f(cible, 2) + ". Taux sans risque 8 %, prime de marché 7 %, prime pays 4 %.",
    ],
    tableau: { e: ["Société comparable", "Bêta des actions (endetté)", "Dettes / capitaux propres"], l: comp.map(([n, b, d]) => [n, f(b, 2), f(d, 2)]) },
    questions: [
      "Calculez le bêta désendetté (bêta de l'actif) de chaque comparable, puis leur moyenne.",
      "Calculez le bêta réendetté de BÉTON DU FLEUVE et son coût des capitaux propres.",
    ],
    corrige: [
      { q: 1, t: ["Formule de Hamada : β_actif = β_endetté / [1 + (1 − t) × D/CP]."], tab: { e: ["Comparable", "Calcul", "β actif"], l: comp.map(([n, b, d], i) => [n, `${f(b, 2)} / (1 + 0,70 × ${f(d, 2)})`, f(bu[i], 3)]).concat([["Moyenne", "", f(bm, 3)]]) } },
      { q: 2, t: [
        `β endetté = β_actif × [1 + (1 − t) × D/CP] = ${f(bm, 3)} × (1 + 0,70 × ${f(cible, 2)}) = ${f(bl, 3)}.`,
        `kₑ = 8 % + ${f(bl, 3)} × 7 % + 4 % = ${p(ke)}.`,
        "Le bêta de l'actif mesure le risque du métier seul ; on le « réendette » avec la structure de financement propre à l'entreprise étudiée, car la dette accroît le risque supporté par les actionnaires.",
      ] },
    ],
    retenir: "Désendetter les bêtas des comparables, en faire la moyenne, puis réendetter avec la structure cible : β_L = β_A × [1 + (1 − t) × D/CP].",
  });
}

// ───────── 4. Effet de levier
{
  const AE = 10e6, RE = 1.8e6, t = 0.3, CP = 6e6, D = 4e6, i = 0.1, RE2 = 0.8e6;
  const re = RE * (1 - t) / AE, rf_ = re + (re - i * (1 - t)) * D / CP, rn = (RE - i * D) * (1 - t);
  const re2 = RE2 * (1 - t) / AE, rf2 = re2 + (re2 - i * (1 - t)) * D / CP, rn2 = (RE2 - i * D) * (1 - t);
  CAS.push({
    theme: THEMES.dg, titre: "Rentabilité économique, rentabilité financière et effet de levier",
    enonce: ["La société TRANSKIN SA exploite une flotte de camions entre Matadi et Kinshasa. Données de l'exercice (en USD) :"],
    donnees: [
      ["Actif économique (immobilisations + BFR)", f(AE)],
      ["Résultat d'exploitation", f(RE)],
      ["Capitaux propres", f(CP)],
      ["Dettes financières (taux d'intérêt " + p(i, 0) + ")", f(D)],
      ["IBP", p(t, 0)],
    ],
    questions: [
      "Calculez la rentabilité économique après impôt.",
      "Calculez la rentabilité financière par la formule du levier, puis vérifiez-la à partir du résultat net.",
      `La saison des pluies coupe la route pendant plusieurs semaines : le résultat d'exploitation tombe à ${f(RE2)} USD. Recalculez les deux rentabilités et commentez.`,
    ],
    corrige: [
      { q: 1, t: [`R_e = RE × (1 − t) / actif économique = ${f(RE)} × 0,70 / ${f(AE)} = ${p(re)}.`] },
      { q: 2, t: [
        `Coût de la dette après impôt : ${p(i, 0)} × 0,70 = ${p(i * (1 - t))}.`,
        `R_f = R_e + (R_e − i × (1 − t)) × D/CP = ${p(re)} + (${p(re)} − ${p(i * (1 - t))}) × ${f(D / CP, 3)} = ${p(rf_)}.`,
        `Vérification : résultat net = (${f(RE)} − ${f(i * D)}) × 0,70 = ${f(rn)} USD ; ${f(rn)} / ${f(CP)} = ${p(rf_)}.`,
        `La dette coûte moins que ce que rapporte l'actif : l'écart profite aux actionnaires, c'est l'effet de levier positif (+${f((rf_ - re) * 100, 2)} points).`,
      ] },
      { q: 3, t: [
        `R_e = ${f(RE2)} × 0,70 / ${f(AE)} = ${p(re2)}, désormais inférieure au coût de la dette (${p(i * (1 - t))}).`,
        `R_f = ${p(re2)} + (${p(re2)} − ${p(i * (1 - t))}) × ${f(D / CP, 3)} = ${p(rf2)} (vérification : ${f(rn2)} / ${f(CP)}).`,
        "L'effet de levier s'inverse : c'est « l'effet massue ». La dette, qui amplifiait les gains, amplifie maintenant la baisse. Une entreprise à activité saisonnière ou risquée doit limiter son endettement.",
      ] },
    ],
    retenir: "R_f = R_e + (R_e − i(1 − t)) × D/CP. Le levier joue dans les deux sens : il n'enrichit les actionnaires que si R_e dépasse le coût net de la dette.",
  });
}

// ───────── 5. EVA
{
  const CI = 12e6, RE = 2.4e6, t = 0.3, c = 0.13, dCI = 2e6, dRE = 0.25e6;
  const nopat = RE * (1 - t), eva = nopat - c * CI, roce = nopat / CI;
  const nopat2 = (RE + dRE) * (1 - t), eva2 = nopat2 - c * (CI + dCI), marg = dRE * (1 - t) / dCI;
  CAS.push({
    theme: THEMES.dg, titre: "Création de valeur : l'EVA",
    enonce: ["La brasserie BOMOKO SA (Lubumbashi) présente les données suivantes (en USD) :"],
    donnees: [["Capitaux investis", f(CI)], ["Résultat d'exploitation", f(RE)], ["IBP", p(t, 0)], ["CMPC", p(c, 0)]],
    questions: [
      "Calculez le résultat d'exploitation après impôt (NOPAT), la rentabilité des capitaux investis et l'EVA.",
      `La direction propose une nouvelle ligne d'embouteillage : ${f(dCI)} USD d'investissement pour ${f(dRE)} USD de résultat d'exploitation supplémentaire. Calculez la nouvelle EVA. Faut-il investir ?`,
    ],
    corrige: [
      { q: 1, t: [
        `NOPAT = ${f(RE)} × 0,70 = ${f(nopat)} USD.`,
        `Rentabilité des capitaux investis = ${f(nopat)} / ${f(CI)} = ${p(roce)}, supérieure au CMPC de ${p(c, 0)}.`,
        `EVA = NOPAT − CMPC × capitaux investis = ${f(nopat)} − ${p(c, 0)} × ${f(CI)} = ${f(eva)} USD. BOMOKO crée de la valeur.`,
      ] },
      { q: 2, t: [
        `NOPAT = ${f(RE + dRE)} × 0,70 = ${f(nopat2)} ; capitaux investis ${f(CI + dCI)}.`,
        `EVA = ${f(nopat2)} − ${p(c, 0)} × ${f(CI + dCI)} = ${f(eva2)} USD, en baisse de ${f(eva - eva2)} USD.`,
        `La nouvelle ligne ne rapporte que ${p(marg)} après impôt (${f(dRE * (1 - t))} / ${f(dCI)}), moins que le CMPC : elle détruit de la valeur. Le résultat augmente, mais pas assez pour rémunérer les fonds engagés. Refus.`,
      ] },
    ],
    retenir: "EVA = NOPAT − CMPC × capitaux investis = (ROCE − CMPC) × capitaux investis. Un bénéfice en hausse ne signifie pas une création de valeur.",
  });
}

// ───────── 6. VAN, TRI, IP, DRCI
{
  const I = 600000, n = 5, am = I / n, ca = [500000, 550000, 600000, 600000, 600000], cv = 0.4, cf = 120000, t = 0.3, b = 0.15, vr = 60000, r = 0.15;
  const bfr = ca.map(x => b * x), dbfr = bfr.map((x, k) => x - (bfr[k - 1] || 0));
  const re = ca.map(x => x * (1 - cv) - cf - am), rn = re.map(x => x * (1 - t)), caf = rn.map(x => x + am), vrn = vr * (1 - t);
  const flux = [-I - dbfr[0]];
  for (let k = 1; k <= n; k++) flux.push(caf[k - 1] - (dbfr[k] || 0) + (k === n ? bfr[n - 1] + vrn : 0));
  const actu = flux.map((v, k) => v / (1 + r) ** k), van = act(flux, r), tr = tri(flux), ip = 1 + van / -flux[0];
  let cum = 0, drci = null; actu.slice(1).forEach((v, k) => { const av = cum; cum += v; if (drci === null && cum >= -flux[0]) drci = k + (-flux[0] - av) / v; });
  const col = k => (k === 0 ? "0" : String(k));
  CAS.push({
    theme: THEMES.inv, titre: "Projet de boulangerie industrielle : VAN, TRI, indice de profitabilité, délai de récupération",
    enonce: [
      "La société PAIN D'OR SARL étudie l'ouverture d'une boulangerie industrielle à Kinshasa (commune de Limete). Tous les montants sont en USD.",
    ],
    donnees: [
      ["Investissement en matériel (début d'année 1)", f(I) + ", amorti en linéaire sur " + n + " ans"],
      ["Chiffre d'affaires prévu (années 1 à 5)", ca.map(x => f(x)).join(" ; ")],
      ["Charges variables", p(cv, 0) + " du chiffre d'affaires"],
      ["Charges fixes décaissées (hors amortissements)", f(cf) + " par an"],
      ["Besoin en fonds de roulement (BFR)", p(b, 0) + " du chiffre d'affaires de l'année, constitué en début d'année, récupéré à la fin du projet"],
      ["Prix de revente du matériel en fin d'année 5", f(vr) + " (matériel totalement amorti)"],
      ["IBP / taux d'actualisation", p(t, 0) + " / " + p(r, 0)],
    ],
    questions: [
      "Établissez le tableau des flux nets de trésorerie (FNT).",
      "Calculez la VAN, le TRI et l'indice de profitabilité.",
      "Calculez le délai de récupération actualisé (DRCI). Le projet est-il acceptable ?",
    ],
    corrige: [
      { q: 1, t: ["La revente du matériel totalement amorti dégage une plus-value imposable : " + f(vr) + " × (1 − 30 %) = " + f(vrn) + " USD nets d'impôt. Le BFR se constitue par variations : seule l'augmentation de chaque année est décaissée."],
        tab: { e: ["", ...flux.map((_, k) => col(k))], l: [
          ["Chiffre d'affaires", "", ...ca.map(x => f(x))],
          ["Résultat d'exploitation", "", ...re.map(x => f(x))],
          ["Résultat net (× 0,70)", "", ...rn.map(x => f(x))],
          ["+ Amortissements", "", ...ca.map(() => f(am))],
          ["= CAF d'exploitation", "", ...caf.map(x => f(x))],
          ["Investissement", f(-I), "", "", "", "", ""],
          ["Variation du BFR", f(-dbfr[0]), ...[1, 2, 3, 4].map(k => f(-(dbfr[k] || 0))), f(0)],
          ["Récupération du BFR", "", "", "", "", "", f(bfr[n - 1])],
          ["Revente nette d'impôt", "", "", "", "", "", f(vrn)],
          ["Flux net de trésorerie", ...flux.map(x => f(x))],
          ["Flux actualisé à 15 %", ...actu.map(x => f(x))],
        ] } },
      { q: 2, t: [
        `VAN = somme des flux actualisés = ${f(van)} USD : positive, le projet crée de la valeur.`,
        `TRI (taux qui annule la VAN, obtenu par interpolation ou avec la fonction TRI d'Excel) = ${p(tr)}, supérieur au taux exigé de ${p(r, 0)}.`,
        `Indice de profitabilité = 1 + VAN / investissement initial = 1 + ${f(van)} / ${f(-flux[0])} = ${f(ip, 3)} : chaque dollar investi rapporte ${f(ip, 3)} dollar en valeur actuelle.`,
      ] },
      { q: 3, t: [
        `Cumul des flux actualisés : ${actu.slice(1).reduce((a, v, k) => (a.push((a[k - 1] || 0) + v), a), []).map(x => f(x)).join(" ; ")}. L'investissement initial de ${f(-flux[0])} est récupéré au cours de la 5e année, au bout de ${f(drci, 2)} ans environ.`,
        "Le projet est acceptable mais la marge de sécurité est mince : VAN faible, TRI proche du taux exigé, récupération tout à la fin. Une baisse des ventes ou une hausse de la farine importée suffirait à le rendre non rentable. Une analyse de sensibilité s'impose avant de décider.",
      ] },
    ],
    retenir: "FNT = CAF d'exploitation − investissement − variation du BFR + récupération du BFR + valeur résiduelle nette d'impôt. On actualise des flux de trésorerie, jamais des résultats comptables.",
  });
}

// ───────── 7. Durées différentes
{
  const r = 0.12, A = { I: 100000, F: 45000, n: 3 }, B = { I: 160000, F: 42000, n: 6 };
  const vA = -A.I + A.F * ann(r, A.n), vB = -B.I + B.F * ann(r, B.n);
  const eA = vA / ann(r, A.n), eB = vB / ann(r, B.n), vA2 = vA + vA / (1 + r) ** 3;
  CAS.push({
    theme: THEMES.inv, titre: "Choisir entre deux machines de durées différentes",
    enonce: [`L'imprimerie MWINDA SARL (Kisangani) doit remplacer sa presse. Deux modèles sont proposés ; le taux d'actualisation est de ${p(r, 0)}. Les flux nets sont annuels et constants (en USD).`],
    tableau: { e: ["", "Presse A (reconditionnée)", "Presse B (neuve)"], l: [["Investissement", f(A.I), f(B.I)], ["Flux net annuel", f(A.F), f(B.F)], ["Durée de vie", A.n + " ans", B.n + " ans"]] },
    questions: [
      "Calculez la VAN de chaque presse. Peut-on les comparer directement ?",
      "Comparez-les par l'annuité équivalente, puis par le renouvellement de A sur 6 ans.",
    ],
    corrige: [
      { q: 1, t: [
        `VAN A = −${f(A.I)} + ${f(A.F)} × [1 − 1,12⁻³] / 0,12 = ${f(vA)} USD.`,
        `VAN B = −${f(B.I)} + ${f(B.F)} × [1 − 1,12⁻⁶] / 0,12 = ${f(vB)} USD.`,
        "B a la VAN la plus forte, mais sur 6 ans contre 3 : la comparaison directe n'est pas valable.",
      ] },
      { q: 2, t: [
        `Annuité équivalente = VAN / facteur d'annuité. A : ${f(vA)} / ${f(ann(r, 3), 4)} = ${f(eA)} USD par an. B : ${f(vB)} / ${f(ann(r, 6), 4)} = ${f(eB)} USD par an.`,
        `Renouvellement de A à l'identique en fin d'année 3 : VAN sur 6 ans = ${f(vA)} + ${f(vA)} / 1,12³ = ${f(vA2)} USD, contre ${f(vB)} pour B.`,
        `Les deux méthodes concordent : la presse A est préférable${eA > eB ? "" : " (à vérifier)"}, à condition qu'on puisse la racheter dans les mêmes conditions dans 3 ans.`,
      ] },
    ],
    retenir: "Pour des projets de durées différentes, comparer les annuités équivalentes (VAN / facteur d'annuité) ou ramener les projets à une durée commune.",
  });
}

// ───────── 8. Avenir incertain
{
  const I = 200000, n = 4, r = 0.14, sc = [["Saison favorable", 90000, 0.3], ["Saison moyenne", 70000, 0.5], ["Saison défavorable", 40000, 0.2]];
  const v = sc.map(([, F]) => -I + F * ann(r, n)), E = v.reduce((s, x, i) => s + x * sc[i][2], 0);
  const sd = Math.sqrt(v.reduce((s, x, i) => s + sc[i][2] * (x - E) ** 2, 0));
  CAS.push({
    theme: THEMES.inv, titre: "Projet agricole en avenir incertain",
    enonce: [`La coopérative MAÏS DU KONGO (Kongo Central) envisage d'acheter un tracteur et un séchoir pour ${f(I)} USD, utilisés ${n} ans sans valeur résiduelle. Les flux nets annuels dépendent de la pluviométrie. Taux d'actualisation : ${p(r, 0)}.`],
    tableau: { e: ["Scénario", "Flux net annuel (USD)", "Probabilité"], l: sc.map(([s, F, q]) => [s, f(F), p(q, 0)]) },
    questions: ["Calculez la VAN de chaque scénario.", "Calculez l'espérance et l'écart-type de la VAN.", "Quelle décision recommandez-vous ?"],
    corrige: [
      { q: 1, t: [`Facteur d'annuité sur ${n} ans à ${p(r, 0)} : ${f(ann(r, n), 4)}.`], tab: { e: ["Scénario", "Calcul", "VAN (USD)"], l: sc.map(([s, F], i) => [s, `−${f(I)} + ${f(F)} × ${f(ann(r, n), 4)}`, f(v[i])]) } },
      { q: 2, t: [
        `E(VAN) = ${sc.map(([, , q], i) => `${f(q, 1)} × ${v[i] < 0 ? "(" + f(v[i]) + ")" : f(v[i])}`).join(" + ")} = ${f(E)} USD.`,
        `Écart-type = √[Σ p × (VAN − E)²] = ${f(sd)} USD.`,
      ] },
      { q: 3, t: [`L'espérance est positive mais très faible (${f(E)} USD) comparée à l'écart-type (${f(sd)} USD). Il y a une chance sur cinq de perdre ${f(-v[2])} USD en valeur actuelle. Pour une coopérative aux fonds propres limités, ce risque est élevé. Pistes : assurance récolte, irrigation d'appoint, location du matériel aux autres producteurs en mauvaise saison, ou contrat d'achat garanti avec un minotier.`] },
    ],
    retenir: "En avenir probabilisable : E(VAN) mesure la rentabilité attendue, l'écart-type mesure le risque. Une VAN espérée positive ne suffit pas si le risque de perte est fort.",
  });
}

// ───────── 9. Emprunt ou crédit-bail
{
  const K = 300000, n = 4, i = 0.12, fr = 0.02, t = 0.3, loyer = 102000;
  const amort = K / n, ints = [0, 1, 2, 3].map(k => (K - amort * k) * i);
  const fE = [K * (1 - fr), ...ints.map((x, k) => -amort - x * (1 - t) + (k === 0 ? K * fr * t : 0))];
  const fC = [K, ...ints.map(() => -loyer * (1 - t) - amort * t)];
  const cE = -tri(fE.map(x => -x)) , cC = -tri(fC.map(x => -x));
  const kE = tri(fE.map(x => -x)), kC = tri(fC.map(x => -x));
  CAS.push({
    theme: THEMES.fin, titre: "Financer une machine : emprunt bancaire ou crédit-bail ?",
    enonce: [`La société AGRO-KASAÏ SA doit financer une décortiqueuse de ${f(K)} USD, amortissable en linéaire sur ${n} ans. IBP : ${p(t, 0)}. Deux offres :`],
    donnees: [
      ["Emprunt bancaire", `${f(K)} USD sur ${n} ans, taux ${p(i, 0)}, remboursement par amortissements constants, frais de dossier ${p(fr, 0)} payés à la signature (déductibles l'année 1)`],
      ["Crédit-bail", `${n} loyers annuels de ${f(loyer)} USD payés en fin d'année, option d'achat finale négligeable`],
    ],
    questions: ["Établissez les flux de l'emprunt et calculez son coût actuariel après impôt.", "Établissez les flux du crédit-bail et calculez son coût actuariel après impôt.", "Quelle solution retenir ?"],
    corrige: [
      { q: 1, t: [`L'entreprise reçoit ${f(K)} − ${f(K * fr)} de frais = ${f(K * (1 - fr))} USD. Elle rembourse ${f(amort)} par an et paie des intérêts déductibles ; les frais procurent une économie d'impôt de ${f(K * fr * t)} l'année 1. Comme elle est propriétaire, l'amortissement fiscal de la machine reste acquis : il ne change pas la comparaison et n'entre pas dans ces flux.`],
        tab: { e: ["Année", "0", "1", "2", "3", "4"], l: [["Fonds reçus nets de frais", f(K * (1 - fr)), "", "", "", ""], ["Remboursement du capital", "", ...ints.map(() => f(-amort))], ["Intérêts après impôt", "", ...ints.map(x => f(-x * (1 - t)))], ["Économie d'impôt sur frais", "", f(K * fr * t), "", "", ""], ["Flux de l'emprunt", ...fE.map(x => f(x))]] },
        t2: [`Coût actuariel (taux qui égalise fonds reçus et décaissements) : ${p(kE)}.`] },
      { q: 2, t: [`Avec le crédit-bail, l'entreprise n'achète pas la machine : elle « reçoit » l'équivalent de ${f(K)} USD. Elle paie des loyers déductibles, mais perd l'économie d'impôt sur l'amortissement qu'elle aurait eue comme propriétaire (${f(amort)} × 30 % = ${f(amort * t)} par an).`],
        tab: { e: ["Année", "0", "1", "2", "3", "4"], l: [["Valeur de la machine financée", f(K), "", "", "", ""], ["Loyers après impôt", "", ...ints.map(() => f(-loyer * (1 - t)))], ["Perte d'économie d'impôt sur amortissement", "", ...ints.map(() => f(-amort * t))], ["Flux du crédit-bail", ...fC.map(x => f(x))]] },
        t2: [`Coût actuariel : ${p(kC)}.`] },
      { q: 3, t: [`L'emprunt coûte ${p(kE)} après impôt, le crédit-bail ${p(kC)}. La solution la moins chère est ${kE < kC ? "l'emprunt bancaire" : "le crédit-bail"}. Le crédit-bail garde des avantages qualitatifs : pas d'apport, pas de garantie hypothécaire, mise en place rapide, ce qui compte pour une PME qui manque de garanties.`] },
    ],
    retenir: "Coût d'un financement = taux actuariel qui égalise les fonds reçus et les décaissements après impôt. En crédit-bail, ne pas oublier la perte des économies d'impôt sur amortissement.",
  });
}

// ───────── 10. Approche patrimoniale + goodwill
{
  const t = 0.3, ecarts = [["Terrain (Gombe)", 200, 350], ["Bâtiments nets", 300, 380], ["Matériel et véhicules nets", 150, 140], ["Stocks (dont 20 de marchandises périmées)", 220, 200], ["Créances clients (dont 15 irrécouvrables)", 180, 165]];
  const ANC = 400 + 250 + 100, delta = ecarts.reduce((s, [, a, b]) => s + b - a, 0), impot = delta * t, ANCC = ANC + delta - impot;
  const bn = 140, rn = 0.12, ra = 0.15, nr = 5, rente = bn - rn * ANCC, gw = rente * ann(ra, nr), val = ANCC + gw;
  CAS.push({
    theme: THEMES.ev, titre: "Évaluer une PME par l'actif net corrigé et le goodwill",
    enonce: ["Un investisseur souhaite racheter MBOKA DISTRIBUTION SARL, grossiste en produits alimentaires à Kinshasa. Bilan SYSCOHADA simplifié au 31 décembre N (en milliers d'USD) :"],
    tableau: { e: ["Actif", "Montant net", "Passif", "Montant"], l: [
      ["Terrain", "200", "Capital", "400"], ["Bâtiments", "300", "Réserves", "250"], ["Matériel et véhicules", "150", "Résultat net N", "100"],
      ["Stocks", "220", "Emprunts bancaires", "250"], ["Créances clients", "180", "Fournisseurs et dettes fiscales", "150"], ["Trésorerie", "50", "", ""], ["Total", "1 150", "Total", "1 150"],
    ] },
    donnees: [
      ["Valeurs réelles retenues par l'expert", ecarts.map(([n, , b]) => `${n} : ${f(b)}`).join(" ; ")],
      ["Impôt latent sur les écarts d'évaluation", p(t, 0)],
      ["Bénéfice net normatif attendu", f(bn) + " par an"],
      ["Rémunération normale de l'actif net", p(rn, 0)],
      ["Durée et taux d'actualisation de la rente de goodwill", nr + " ans à " + p(ra, 0)],
    ],
    questions: ["Calculez l'actif net comptable puis l'actif net comptable corrigé (ANCC), en tenant compte de l'impôt latent.", "Calculez le goodwill par la méthode de la rente actualisée et la valeur de l'entreprise."],
    corrige: [
      { q: 1, t: [`Actif net comptable = capital + réserves + résultat = 400 + 250 + 100 = ${f(ANC)}.`],
        tab: { e: ["Poste", "Valeur comptable", "Valeur réelle", "Écart"], l: [...ecarts.map(([n, a, b]) => [n, f(a), f(b), f(b - a)]), ["Total des écarts", "", "", f(delta)]] },
        t2: [`Impôt latent : ${f(delta)} × 30 % = ${f(impot, 1)}. ANCC = ${f(ANC)} + ${f(delta)} − ${f(impot, 1)} = ${f(ANCC, 1)} milliers d'USD.`] },
      { q: 2, t: [
        `Rente de goodwill = bénéfice normatif − rémunération normale de l'ANCC = ${f(bn)} − 12 % × ${f(ANCC, 1)} = ${f(rente, 2)}.`,
        `Goodwill = rente × [1 − 1,15⁻⁵] / 0,15 = ${f(rente, 2)} × ${f(ann(ra, nr), 4)} = ${f(gw, 1)}.`,
        `Valeur de l'entreprise = ANCC + goodwill = ${f(ANCC, 1)} + ${f(gw, 1)} = ${f(val, 1)} milliers d'USD, soit environ ${f(Math.round(val))} 000 USD.`,
        "Le goodwill rémunère la capacité de MBOKA à gagner plus que ce que rapporterait normalement son patrimoine : emplacement, clientèle, réseau de fournisseurs.",
      ] },
    ],
    retenir: "ANCC = actif net comptable ± écarts d'évaluation − impôt latent − non-valeurs. Goodwill = (bénéfice − r × ANCC) actualisé sur une durée limitée.",
  });
}

// ───────── 11. DCF
{
  const ebe = [900, 1000, 1100, 1180, 1250], dot = [300, 320, 340, 350, 360], capex = [350, 350, 360, 370, 380], dbfr = [60, 50, 50, 40, 30];
  const t = 0.3, c = 0.16, g = 0.05, dn = 1200, nb = 100000;
  const re = ebe.map((x, k) => x - dot[k]), is = re.map(x => x * t), fcf = ebe.map((x, k) => re[k] - is[k] + dot[k] - capex[k] - dbfr[k]);
  const fa = fcf.map((x, k) => x / (1 + c) ** (k + 1)), vt = fcf[4] * (1 + g) / (c - g), vta = vt / (1 + c) ** 5;
  const VE = fa.reduce((a, b) => a + b) + vta, VCP = VE - dn, prix = VCP * 1000 / nb;
  const VE4 = fa.reduce((a, b) => a + b) + fcf[4] * 1.04 / (c - 0.04) / (1 + c) ** 5;
  CAS.push({
    theme: THEMES.ev, titre: "Évaluer une entreprise par l'actualisation des flux de trésorerie (DCF)",
    enonce: [`La société CONGO PLASTIQUES SA (fabrication d'emballages à Kinshasa) prépare l'entrée d'un partenaire. Son plan d'affaires sur 5 ans (en milliers d'USD) est le suivant. IBP ${p(t, 0)}, CMPC ${p(c, 0)}, croissance à l'infini des flux au-delà de l'année 5 : ${p(g, 0)}. Dette financière nette : ${f(dn)}. Le capital compte ${f(nb)} actions.`],
    tableau: { e: ["Année", "1", "2", "3", "4", "5"], l: [["EBE", ...ebe.map(x => f(x))], ["Dotations aux amortissements", ...dot.map(x => f(x))], ["Investissements", ...capex.map(x => f(x))], ["Augmentation du BFR", ...dbfr.map(x => f(x))]] },
    questions: ["Calculez les flux de trésorerie disponibles (FCF) des années 1 à 5.", "Calculez la valeur terminale et la valeur de l'entreprise.", "Déduisez la valeur des capitaux propres et la valeur d'une action. Quelle est la part de la valeur terminale ?"],
    corrige: [
      { q: 1, t: ["FCF = résultat d'exploitation − impôt théorique sur ce résultat + dotations − investissements − augmentation du BFR. L'impôt est calculé sur le résultat d'exploitation, comme si l'entreprise n'était pas endettée : la dette est traitée à part."],
        tab: { e: ["Année", "1", "2", "3", "4", "5"], l: [["Résultat d'exploitation (EBE − dotations)", ...re.map(x => f(x))], ["− IBP théorique 30 %", ...is.map(x => f(-x))], ["+ Dotations", ...dot.map(x => f(x))], ["− Investissements", ...capex.map(x => f(-x))], ["− Augmentation du BFR", ...dbfr.map(x => f(-x))], ["= FCF", ...fcf.map(x => f(x))], ["FCF actualisé à 16 %", ...fa.map(x => f(x, 1))]] } },
      { q: 2, t: [
        `Valeur terminale en fin d'année 5 (Gordon-Shapiro) = FCF₅ × (1 + g) / (CMPC − g) = ${f(fcf[4])} × 1,05 / (16 % − 5 %) = ${f(vt, 1)} ; actualisée : ${f(vt, 1)} / 1,16⁵ = ${f(vta, 1)}.`,
        `Valeur de l'entreprise = ${f(fa.reduce((a, b) => a + b), 1)} (flux des 5 ans) + ${f(vta, 1)} = ${f(VE, 1)} milliers d'USD.`,
      ] },
      { q: 3, t: [
        `Valeur des capitaux propres = valeur de l'entreprise − dette nette = ${f(VE, 1)} − ${f(dn)} = ${f(VCP, 1)} milliers d'USD, soit ${f(prix, 2)} USD par action.`,
        `La valeur terminale représente ${p(vta / VE, 0)} de la valeur de l'entreprise : le résultat dépend surtout des hypothèses de long terme (g et CMPC). Il faut tester la sensibilité : avec g = 4 % au lieu de 5 %, la valeur de l'entreprise tomberait à ${f(VE4, 1)} et celle des capitaux propres à ${f(VE4 - dn, 1)}, soit ${p((VE4 - VE) / VCP, 0)}.`,
      ] },
    ],
    retenir: "Valeur des capitaux propres = Σ FCF actualisés au CMPC + valeur terminale actualisée − dette financière nette.",
  });
}

// ───────── 12. Multiples
{
  const ebe = 900, rn = 320, dn = 1200, comp = [["Comparable 1", 4.8, 10], ["Comparable 2", 5.4, 11.5], ["Comparable 3", 4.5, 9.5]], dec = 0.2;
  const me = comp.reduce((s, x) => s + x[1], 0) / 3, mp = comp.reduce((s, x) => s + x[2], 0) / 3;
  const v1 = ebe * me - dn, v2 = rn * mp, v1d = v1 * (1 - dec), v2d = v2 * (1 - dec);
  CAS.push({
    theme: THEMES.ev, titre: "Évaluer par les multiples de sociétés comparables",
    enonce: [`On reprend CONGO PLASTIQUES SA (exercice 11). Prévisions de l'année 1 : EBE ${f(ebe)}, résultat net (après intérêts et IBP) ${f(rn)} ; dette nette ${f(dn)} (milliers d'USD). Un analyste a relevé les multiples de trois fabricants d'emballages cotés à la BRVM (Abidjan) ou sur d'autres marchés africains :`],
    tableau: { e: ["Société", "Valeur d'entreprise / EBE", "PER (cours / bénéfice)"], l: comp.map(([n, a, b]) => [n, f(a, 1), f(b, 1)]) },
    questions: ["Évaluez les capitaux propres avec le multiple d'EBE moyen, puis avec le PER moyen.", `CONGO PLASTIQUES n'étant pas cotée, on applique une décote d'illiquidité de ${p(dec, 0)}. Donnez la fourchette de valeur et comparez-la au DCF de l'exercice 11 (2 822 milliers d'USD).`],
    corrige: [
      { q: 1, t: [
        `Multiple d'EBE moyen = ${f(me, 2)}. Valeur d'entreprise = ${f(ebe)} × ${f(me, 2)} = ${f(ebe * me, 1)} ; capitaux propres = ${f(ebe * me, 1)} − ${f(dn)} = ${f(v1, 1)}.`,
        `PER moyen = ${f(mp, 2)}. Le PER s'applique au bénéfice, qui revient déjà aux actionnaires : capitaux propres = ${f(rn)} × ${f(mp, 2)} = ${f(v2, 1)}, sans retrancher la dette.`,
      ] },
      { q: 2, t: [
        `Après décote : ${f(v1d, 1)} (multiple d'EBE) et ${f(v2d, 1)} (PER), en milliers d'USD.`,
        `Fourchette des multiples : ${f(Math.min(v1d, v2d), 0)} à ${f(Math.max(v1d, v2d), 0)} ; DCF : 2 822. Les approches convergent, ce qui conforte l'évaluation. Les multiples donnent une valeur de marché instantanée, le DCF une valeur intrinsèque fondée sur le plan d'affaires. Si l'écart avait été important, il aurait fallu revoir les hypothèses du plan ou la comparabilité des sociétés retenues. En pratique, on présente une fourchette et on négocie à l'intérieur.`,
      ] },
    ],
    retenir: "Multiple d'EBE → valeur d'entreprise, puis on retranche la dette nette. PER → directement les capitaux propres. Société non cotée : décote d'illiquidité de 15 à 30 %.",
  });
}

// ───────── 13. Gordon BRVM
{
  const D0 = 1200, g = 0.04, k = 0.13, P = 12500, g1 = 0.1;
  const V = D0 * (1 + g) / (k - g), kimp = D0 * (1 + g) / P + g;
  const D = [1, 2, 3].map(t => D0 * (1 + g1) ** t), V3 = D[2] * (1 + g) / (k - g), V2 = D.reduce((s, d, i) => s + d / (1 + k) ** (i + 1), 0) + V3 / (1 + k) ** 3;
  CAS.push({
    theme: THEMES.ev, titre: "Valeur d'une action par les dividendes (Gordon-Shapiro)",
    enonce: [`Une société de télécommunications cotée à la BRVM vient de verser un dividende de ${f(D0)} FCFA par action. Les dividendes devraient croître de ${p(g, 0)} par an à l'infini. Les actionnaires exigent ${p(k, 0)}. L'action cote ${f(P)} FCFA.`],
    questions: ["Calculez la valeur théorique de l'action. Est-elle sous- ou surévaluée ?", "Quelle rentabilité exige implicitement le marché au cours actuel ?", `Le déploiement de la 5G pourrait faire croître le dividende de ${p(g1, 0)} par an pendant 3 ans, puis de ${p(g, 0)} ensuite. Recalculez la valeur.`],
    corrige: [
      { q: 1, t: [`V₀ = D₁ / (k − g) avec D₁ = ${f(D0)} × 1,04 = ${f(D0 * (1 + g))}. V₀ = ${f(D0 * (1 + g))} / (13 % − 4 %) = ${f(V)} FCFA. Le cours (${f(P)}) est inférieur : l'action paraît sous-évaluée, donc intéressante à l'achat si les hypothèses sont justes.`] },
      { q: 2, t: [`k = D₁ / P₀ + g = ${f(D0 * (1 + g))} / ${f(P)} + 4 % = ${p(kimp)}. Le marché exige plus que 13 % : il juge le titre plus risqué que l'analyste.`] },
      { q: 3, t: [`Dividendes : ${D.map(d => f(d, 1)).join(" ; ")}. Valeur en fin d'année 3 : D₄ / (k − g) = ${f(D[2] * (1 + g), 1)} / 9 % = ${f(V3)}.`, `V₀ = ${D.map((d, i) => `${f(d, 1)} / 1,13${["", "²", "³"][i]}`).join(" + ")} + ${f(V3)} / 1,13³ = ${f(V2)} FCFA.`] },
    ],
    retenir: "V₀ = D₁ / (k − g), valable seulement si g < k. Inversée, la formule donne la rentabilité exigée par le marché : k = D₁ / P₀ + g.",
  });
}

// ───────── 14. Change à terme USD/CDF
{
  const M = 250000, S = 2850, iC = 0.18, iU = 0.06, j = 90, sc = [2750, 2950, 3150];
  const F = S * (1 + iC * j / 360) / (1 + iU * j / 360);
  CAS.push({
    theme: THEMES.chg, titre: "Importateur : couvrir une dette en dollars par un change à terme",
    enonce: [
      `La société KIVU PHARMA SARL importe des médicaments. Elle doit payer ${f(M)} USD à son fournisseur dans ${j} jours. Ses ventes sont encaissées en francs congolais (CDF).`,
      "Hypothèses de marché (fictives, à actualiser avec les cours du jour) :",
    ],
    donnees: [["Cours au comptant", f(S) + " CDF pour 1 USD"], ["Taux d'intérêt en CDF à 90 jours", p(iC, 0) + " l'an"], ["Taux d'intérêt en USD à 90 jours", p(iU, 0) + " l'an"], ["Convention", "année de 360 jours"]],
    questions: ["Quelle est la position de change de KIVU PHARMA et quel risque court-elle ?", "Calculez le cours à terme que la banque peut proposer.", `Comparez le coût en CDF avec et sans couverture si le cours dans ${j} jours est de ${sc.map(x => f(x)).join(", ")} CDF.`],
    corrige: [
      { q: 1, t: ["Elle doit des USD qu'elle n'a pas : position courte en USD. Elle perd si le dollar s'apprécie (si le franc se déprécie), car il lui faudra plus de CDF pour payer la même facture."] },
      { q: 2, t: [
        "Le cours à terme découle de l'égalité des placements : emprunter des CDF, les convertir au comptant et placer les USD doit coûter autant qu'acheter à terme.",
        `F = S × (1 + i_CDF × j/360) / (1 + i_USD × j/360) = ${f(S)} × ${f(1 + iC * j / 360, 4)} / ${f(1 + iU * j / 360, 4)} = ${f(F, 2)} CDF.`,
        `Le dollar est plus cher à terme (« report ») parce que les taux en CDF sont plus élevés que les taux en USD.`,
      ] },
      { q: 3, t: [`Avec la couverture, le coût est figé : ${f(M)} × ${f(F, 2)} = ${f(M * F)} CDF, quel que soit le cours futur.`],
        tab: { e: ["Cours dans 90 jours", "Sans couverture (CDF)", "Avec change à terme (CDF)", "Écart"], l: sc.map(x => [f(x), f(M * x), f(M * F), f(M * x - M * F)]) },
        t2: ["Le change à terme supprime le risque mais aussi le gain possible si le franc s'apprécie. Pour un importateur dont la marge est faible, la certitude du coût prime : il peut fixer ses prix de vente en connaissant son coût d'achat."] },
    ],
    retenir: "F = S × (1 + i_domestique × j/360) / (1 + i_étranger × j/360). La devise du pays aux taux les plus bas cote en report à terme.",
  });
}

// ───────── 15. Option de change
{
  const M = 250000, K = 2950, pr = 45, F = 2850 * (1 + 0.18 / 4) / (1 + 0.06 / 4), sc = [2750, 2950, 3150];
  const cout = s => Math.min(s, K) + pr;
  CAS.push({
    theme: THEMES.chg, titre: "Importateur : se couvrir par une option d'achat de dollars",
    enonce: [`KIVU PHARMA (exercice 14) préfère garder une chance de profiter d'une baisse du dollar. Sa banque lui propose une option d'achat (call) sur ${f(M)} USD à 90 jours, au prix d'exercice de ${f(K)} CDF, pour une prime de ${f(pr)} CDF par dollar payée aujourd'hui. On néglige l'actualisation de la prime.`],
    questions: ["Calculez le coût total en CDF pour chacun des cours de l'exercice 14.", `Pour quels cours l'option est-elle préférable au change à terme (${f(F, 2)}) ? et à l'absence de couverture ?`],
    corrige: [
      { q: 1, t: ["À l'échéance, KIVU PHARMA exerce l'option si le cours dépasse 2 950 ; sinon elle achète au comptant. Coût par dollar = min(cours, prix d'exercice) + prime."],
        tab: { e: ["Cours à l'échéance", "Exercice ?", "Coût par USD", "Coût total (CDF)"], l: sc.map(s => [f(s), s > K ? "Oui" : s === K ? "Indifférent" : "Non", f(cout(s)), f(M * cout(s))]) } },
      { q: 2, t: [
        `Option préférable au change à terme si cours + ${pr} < ${f(F, 2)}, soit un cours inférieur à ${f(F - pr, 2)} CDF.`,
        `Option préférable à l'absence de couverture si le cours dépasse ${f(K + pr)} CDF (prix d'exercice + prime).`,
        `Entre ${f(F - pr, 2)} et ${f(K + pr)}, le change à terme fait mieux que l'option. L'option fixe un coût maximum (${f(K + pr)} par USD) tout en laissant profiter d'une baisse du dollar ; la prime est le prix de cette souplesse.`,
      ] },
    ],
    retenir: "Un call devise plafonne le coût d'achat à « prix d'exercice + prime » et laisse profiter d'une baisse de la devise. Le change à terme est gratuit, mais fige le cours.",
  });
}

// ───────── 16. Affectation du résultat OHADA
{
  const cap = 200e6, nAct = 20000, RL = 36e6, ran = 8e6, BN = 90e6, rs = 0.05, pd = 0.06, rf_ = 10e6, irm = 0.2;
  const rl = Math.min((BN - ran) * 0.1, cap * 0.2 - RL), dist = BN - ran - rl, rst = rs * (BN - ran), d1 = pd * cap;
  const solde = dist - rst - d1 - rf_, sup = Math.floor(solde / nAct / 100) * 100, supT = sup * nAct, nvran = solde - supT;
  const divA = d1 / nAct + sup, divT = divA * nAct, ret = divT * irm;
  CAS.push({
    theme: THEMES.res, titre: "Affecter le résultat d'une SA selon l'Acte uniforme OHADA",
    enonce: ["L'assemblée générale ordinaire de LUALABA INDUSTRIES SA doit statuer sur l'affectation du résultat de l'exercice N. Les statuts prévoient une réserve statutaire de 5 % du bénéfice diminué des pertes antérieures, puis un premier dividende de 6 % du capital libéré. Le conseil d'administration propose une réserve facultative de 10 000 000 FC, un superdividende arrondi à la centaine de francs inférieure par action, et le report du solde."],
    donnees: [
      ["Capital entièrement libéré", f(cap) + " FC (" + f(nAct) + " actions de " + f(cap / nAct) + " FC)"],
      ["Réserve légale déjà constituée", f(RL) + " FC"],
      ["Report à nouveau débiteur (pertes antérieures)", f(ran) + " FC"],
      ["Bénéfice net de l'exercice N", f(BN) + " FC"],
      ["Impôt mobilier (IRM) retenu sur les dividendes", p(irm, 0) + " (hypothèse de l'exercice)"],
    ],
    questions: ["Calculez la dotation à la réserve légale.", "Calculez le bénéfice distribuable.", "Établissez le tableau d'affectation et le dividende par action.", "Passez les écritures SYSCOHADA de l'affectation, de la retenue de l'IRM et du paiement des dividendes."],
    corrige: [
      { q: 1, t: [
        "Acte uniforme relatif aux sociétés commerciales et au GIE (AUSCGIE), art. 346 : on prélève au moins 1/10 du bénéfice de l'exercice, diminué le cas échéant des pertes antérieures, jusqu'à ce que la réserve légale atteigne 1/5 du capital.",
        `10 % × (${f(BN)} − ${f(ran)}) = ${f((BN - ran) * 0.1)} FC. Plafond : 1/5 × ${f(cap)} = ${f(cap * 0.2)} FC ; déjà constitué ${f(RL)} ; il manque ${f(cap * 0.2 - RL)} FC. Dotation retenue : ${f(rl)} FC.`,
      ] },
      { q: 2, t: [`AUSCGIE, art. 143 : bénéfice distribuable = bénéfice de l'exercice − pertes antérieures − réserves légales et statutaires + report bénéficiaire. Avant réserve statutaire : ${f(BN)} − ${f(ran)} − ${f(rl)} = ${f(dist)} FC ; après la réserve statutaire de ${f(rst)} FC : ${f(dist - rst)} FC.`] },
      { q: 3, t: [], tab: { e: ["Affectation", "Montant (FC)"], l: [
        ["Bénéfice de l'exercice", f(BN)], ["− Apurement du report à nouveau débiteur", f(-ran)], ["− Réserve légale", f(-rl)], ["− Réserve statutaire (5 % × " + f(BN - ran) + ")", f(-rst)],
        ["− Premier dividende (6 % × " + f(cap) + ")", f(-d1)], ["− Réserve facultative", f(-rf_)], [`− Superdividende (${f(solde)} / ${f(nAct)} = ${f(solde / nAct, 2)}, arrondi à ${f(sup)} FC par action)`, f(-supT)], ["= Nouveau report à nouveau créditeur", f(nvran)],
      ] }, t2: [`Dividende brut par action : ${f(d1 / nAct)} + ${f(sup)} = ${f(divA)} FC, soit ${f(divT)} FC au total. IRM retenu : ${f(ret)} FC ; dividende net versé : ${f(divT - ret)} FC (${f(divA * (1 - irm))} FC par action).`] },
      { q: 4, t: ["Écritures au journal (montants en FC) :"], tab: { w: [1000, 4638, 2000, 2000], e: ["Compte", "Libellé", "Débit", "Crédit"], l: [
        ["131", "Résultat net : bénéfice", f(BN), ""], ["129", "Report à nouveau débiteur", "", f(ran)], ["111", "Réserve légale", "", f(rl)], ["112", "Réserves statutaires", "", f(rst)], ["1181", "Réserves facultatives", "", f(rf_)], ["465", "Associés, dividendes à payer", "", f(divT)], ["121", "Report à nouveau créditeur", "", f(nvran)],
        ["", "Retenue de l'IRM sur les dividendes", "", ""], ["465", "Associés, dividendes à payer", f(ret), ""], ["447", "État, impôts retenus à la source", "", f(ret)],
        ["", "Paiement des dividendes nets", "", ""], ["465", "Associés, dividendes à payer", f(divT - ret), ""], ["521", "Banque", "", f(divT - ret)],
        ["", "Reversement de l'IRM à l'administration fiscale", "", ""], ["447", "État, impôts retenus à la source", f(ret), ""], ["521", "Banque", "", f(ret)],
      ] } },
    ],
    retenir: "Ordre : apurer les pertes antérieures, doter la réserve légale (10 % jusqu'à 1/5 du capital), puis les réserves statutaires ; le reste, augmenté du report bénéficiaire, est distribuable.",
  });
}

CAS.forEach((e, i) => (e.n = i + 1));
export const casParNum = n => CAS[n - 1];
export const valeurs = { act, tri, ann };
