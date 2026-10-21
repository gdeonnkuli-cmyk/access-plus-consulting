export default {
  id: "F5",
  titre: "Le régime des entreprises de petite taille",
  court: "Petites ent.",
  ico: "building-store",
  col: "#0F7B6C",
  duree: "20 min",
  resume: "Micro ou petite entreprise ? Un impôt simple sur le chiffre d'affaires, avec acompte, solde et option possible.",
  blocs: [
    {
      type: "essentiel",
      texte:
        "Les entreprises dont le chiffre d'affaires annuel est **inférieur à 80 000 000 FC** ne paient pas l'IBP de droit commun : elles relèvent du régime des **entreprises de petite taille** (O.-L. n° 13/006). Jusqu'à **10 000 000 FC**, la **micro-entreprise** paie un forfait annuel de **50 000 FC** au plus tard le 30 avril N+1. Au-delà, la **petite entreprise** paie **1 %** de son chiffre d'affaires (ventes) ou **2 %** (services), en deux temps : **60 % au 31 janvier** et **40 % au 30 avril** N+1. Elle peut aussi opter pour le droit commun.",
    },
    {
      type: "texte",
      titre: "Qui est concerné ?",
      p: [
        "Le régime s'applique « à compter de l'exercice fiscal 2013 » et déroge au droit commun de l'impôt sur les bénéfices et profits (art. 1er et 16 O.-L. n° 13/006). La forme juridique ne compte pas : seul le **chiffre d'affaires annuel** décide.",
      ],
      puces: [
        "**Entreprise de petite taille (EPT) :** chiffre d'affaires annuel **inférieur à 80 000 000 FC** (art. 2).",
        "**Micro-entreprise :** chiffre d'affaires **ne dépassant pas 10 000 000 FC**. Une entreprise à exactement 10 000 000 FC est donc une micro-entreprise.",
        "**Petite entreprise :** chiffre d'affaires **supérieur à 10 000 000 FC et inférieur à 80 000 000 FC**. À exactement 80 000 000 FC, on sort du régime.",
        "Les **professions libérales** et les charges ou offices sous ce seuil suivent les mêmes catégories (art. 3).",
        "**Comptabilité :** obligatoire « suivant les dispositions réduites » pour la petite entreprise ; simple faculté pour la micro-entreprise (art. 4).",
      ],
    },
    {
      type: "schema",
      kind: "arbre",
      titre: "Quel régime pour mon entreprise ?",
      question: "Chiffre d'affaires annuel ?",
      branches: [
        { si: "≤ 10 000 000 FC", alors: "Micro-entreprise", d: "Forfait de 50 000 FC par an, payé au plus tard le 30 avril N+1 (art. 11)" },
        { si: "> 10 000 000 FC et < 80 000 000 FC", alors: "Petite entreprise", d: "1 % du CA (ventes) ou 2 % (services) : 60 % au 31 janvier, 40 % au 30 avril N+1 (art. 6 et 7)" },
        { si: "≥ 80 000 000 FC", alors: "Droit commun", d: "IBP sur le bénéfice, impôt minimum de 1 % du CA, et assujettissement à la TVA" },
      ],
    },
    {
      type: "texte",
      titre: "La petite entreprise : 1 % ou 2 % du chiffre d'affaires",
      puces: [
        "**Base :** le chiffre d'affaires annuel réalisé, et non le bénéfice. Pour une période de moins d'un an, la base est réduite au prorata (art. 5).",
        "**Taux :** **1 %** pour les activités de **vente**, **2 %** pour les **prestations de services** (art. 6).",
        "**Activités mixtes :** on additionne tous les chiffres d'affaires et on applique le taux de l'**activité principale** (art. 6).",
        "**Acompte de 60 %** versé par bordereau au plus tard le **31 janvier** de l'année qui suit celle des revenus (art. 7).",
        "**Solde de 40 %** payé avec la déclaration autoliquidative au plus tard le **30 avril** de la même année (art. 7).",
        "**Sanction :** un acompte non versé ou insuffisant entraîne une **amende de 25 %** du montant non versé (art. 7).",
      ],
    },
    {
      type: "texte",
      titre: "La micro-entreprise : un forfait de 50 000 FC",
      puces: [
        "**Impôt forfaitaire annuel de 50 000 FC**, payé par déclaration autoliquidative au plus tard le **30 avril** de l'année qui suit celle des revenus (art. 11).",
        "Les contribuables **dispensés de patente** au titre de la législation sur le petit commerce ne paient pas ce forfait (art. 11).",
        "**Pas de vérification de comptabilité :** l'Administration se limite au recensement, à l'immatriculation, à l'éducation fiscale, à l'évaluation du chiffre d'affaires et à l'aide au paiement (art. 12).",
        "**Salariés des micro-entreprises :** leur IPR suit des **taux forfaitaires fixés par arrêté**, reversés par **quotités trimestrielles**, sans réduction pour charges de famille (art. 84 § 3 et art. 89 O.-L. n° 69/009). Le Code ne chiffre pas ces taux.",
      ],
    },
    {
      type: "texte",
      titre: "Option, sortie du régime et TVA",
      puces: [
        "**Option pour le droit commun :** demande écrite **avant le 1er février** de l'année de réalisation des revenus. L'option est **définitive et irrévocable** (art. 9).",
        "**Sortie :** si le chiffre d'affaires dépasse la limite **au cours de deux années successives**, l'entreprise passe au droit commun sur décision de l'Administration (art. 8 et 13).",
        "**Minoration du chiffre d'affaires :** l'entreprise est reclassée au droit commun, avec les pénalités de la L. n° 004/2003 (art. 8).",
        "**Procédure :** identification (NIF), déclaration, contrôle, recouvrement et recours suivent le droit commun (art. 10).",
        "**TVA :** le seuil d'assujettissement est un chiffre d'affaires **égal ou supérieur à 80 000 000 FC** hors TVA (art. 14 O.-L. n° 10/001). Les EPT sont donc en principe hors TVA, mais peuvent opter pour la TVA (option définitive pendant deux ans).",
        "Attention : les **professions libérales** organisées en ordres sont assujetties à la TVA **quel que soit leur chiffre d'affaires** (art. 44 D. n° 011/42).",
      ],
    },
    {
      type: "schema",
      kind: "chronologie",
      titre: "Le calendrier d'une petite entreprise",
      jalons: [
        { date: "Avant le 1er février N", l: "Option éventuelle pour le droit commun", d: "Par écrit, définitive et irrévocable (art. 9)" },
        { date: "Année N", l: "Réalisation du chiffre d'affaires", d: "Base de l'impôt de l'année (art. 5)" },
        { date: "31 janvier N+1", l: "Acompte de 60 %", d: "Par bordereau ; amende de 25 % si défaut ou insuffisance (art. 7)" },
        { date: "30 avril N+1", l: "Déclaration et solde de 40 %", d: "Déclaration autoliquidative (art. 7)" },
        { date: "30 avril N+1", l: "Micro-entreprise : forfait de 50 000 FC", d: "Payé avec la déclaration autoliquidative (art. 11)" },
      ],
    },
    {
      type: "exemple",
      titre: "Exemple 1 — La boutique des ETS MAMA NZINGA",
      enonce:
        "Les ETS MAMA NZINGA vendent des pagnes et des produits alimentaires à Lubumbashi. Leur chiffre d'affaires de l'année N s'élève à 40 000 000 FC, uniquement en ventes. Ils n'ont pas opté pour le droit commun.",
      lignes: [
        ["Chiffre d'affaires annuel N (ventes)", 40000000],
        ["Impôt à 1 % (activité de vente, art. 6)", 400000, "total"],
        ["Acompte de 60 % — au plus tard le 31 janvier N+1", 240000],
        ["Solde de 40 % — au plus tard le 30 avril N+1", 160000, "resultat"],
      ],
      conclusion:
        "Avec 40 000 000 FC de chiffre d'affaires, la boutique est une petite entreprise (entre 10 M et 80 M FC). Elle paie 400 000 FC en tout : 240 000 FC fin janvier et 160 000 FC avec la déclaration d'avril. Elle reste hors TVA, sous le seuil de 80 000 000 FC.",
    },
    {
      type: "exemple",
      titre: "Exemple 2 — Le cabinet de services BOMOKO CONSEIL",
      enonce:
        "BOMOKO CONSEIL fait de la saisie comptable et du conseil de gestion. Son chiffre d'affaires de l'année N est de 30 000 000 FC. Au 31 janvier N+1, le cabinet n'a versé que 200 000 FC d'acompte.",
      lignes: [
        ["Chiffre d'affaires annuel N (services)", 30000000],
        ["Impôt à 2 % (prestations de services, art. 6)", 600000, "total"],
        ["Acompte dû au 31 janvier N+1 (60 %)", 360000],
        ["− Acompte effectivement versé", -200000],
        ["= Insuffisance d'acompte", 160000, "total"],
        ["Amende de 25 % de l'insuffisance (art. 7)", 40000, "resultat"],
      ],
      conclusion:
        "Le cabinet doit 600 000 FC d'impôt. Ayant versé 200 000 FC, il lui reste 400 000 FC à payer au 30 avril N+1, plus une amende de 40 000 FC pour l'acompte insuffisant. S'il avait payé 360 000 FC à temps, son solde aurait été de 240 000 FC, sans amende.",
    },
    {
      type: "exemple",
      titre: "Exemple 3 — Un petit atelier de couture",
      enonce: "Un atelier de couture de Kisangani réalise 9 000 000 FC de chiffre d'affaires sur l'année N.",
      lignes: [
        ["Chiffre d'affaires annuel N", 9000000],
        ["Impôt forfaitaire de la micro-entreprise (art. 11)", 50000, "resultat"],
      ],
      conclusion:
        "Avec un chiffre d'affaires ne dépassant pas 10 000 000 FC, l'atelier est une micro-entreprise : il paie 50 000 FC au plus tard le 30 avril N+1, quel que soit son bénéfice.",
    },
    {
      type: "pieges",
      puces: [
        "Calculer l'impôt sur le **bénéfice** : pour une petite entreprise, la base est le **chiffre d'affaires** (art. 5).",
        "Appliquer 1 % sur les ventes et 2 % sur les services d'une activité mixte : on **cumule** et on applique le taux de l'**activité principale** (art. 6).",
        "Se tromper sur les bornes : 10 000 000 FC pile = micro-entreprise ; 80 000 000 FC pile = **hors régime** et assujettie à la TVA.",
        "Opter pour le droit commun à la légère : l'option est **irrévocable** et doit être faite **avant le 1er février** de l'année concernée (art. 9).",
        "Oublier l'acompte du **31 janvier** : l'amende est de 25 % du montant non versé (art. 7).",
        "Confondre le forfait de 50 000 FC de la micro-entreprise avec l'impôt forfaitaire de 30 000 FC prévu par l'art. 92 de l'O.-L. n° 69/009 pour les entreprises de petite taille **sans chiffre d'affaires** ou en cessation.",
      ],
    },
    {
      type: "maj",
      texte:
        "Les seuils (10 000 000 FC et 80 000 000 FC), le forfait de 50 000 FC, les taux de 1 % et 2 %, les échéances du 31 janvier et du 30 avril et le seuil TVA de 80 000 000 FC sont ceux du Code des impôts mis à jour au 15 juillet 2017. Le ministre des Finances peut réajuster les seuils et le forfait (art. 14 O.-L. n° 13/006). Vérifie la dernière loi de finances et les arrêtés en vigueur.",
    },
    {
      type: "articles",
      refs: [
        "Art. 1er et 2 — O.-L. n° 13/006 : champ du régime et définitions (EPT, micro, petite entreprise)",
        "Art. 4 — O.-L. n° 13/006 : comptabilité réduite",
        "Art. 5 à 7 — O.-L. n° 13/006 : base, taux de 1 % et 2 %, acompte, solde et amende de 25 %",
        "Art. 8 et 9 — O.-L. n° 13/006 : sortie du régime et option pour le droit commun",
        "Art. 11 à 14 — O.-L. n° 13/006 : forfait de la micro-entreprise, contrôle, réajustement",
        "Art. 84 § 3 et 89 — O.-L. n° 69/009 : IPR forfaitaire des salariés des micro-entreprises",
        "Art. 92 — O.-L. n° 69/009 : impôt forfaitaire des entreprises sans chiffre d'affaires",
        "Art. 14 — O.-L. n° 10/001 : seuil d'assujettissement à la TVA (80 000 000 FC)",
      ],
    },
  ],
  qcm: [
    {
      q: "Une entreprise réalise un chiffre d'affaires annuel d'exactement 10 000 000 FC. Quelle est sa catégorie ?",
      r: ["Petite entreprise", "Micro-entreprise", "Entreprise de droit commun"],
      b: 1,
      e: "La micro-entreprise a un chiffre d'affaires « ne dépassant pas » 10 000 000 FC : 10 000 000 FC pile reste donc dans cette catégorie.",
      art: "art. 2 O.-L. n° 13/006",
    },
    {
      q: "Quel impôt annuel paie une micro-entreprise ?",
      r: ["100 000 FC", "1 % de son chiffre d'affaires", "50 000 FC", "30 000 FC"],
      b: 2,
      e: "La micro-entreprise paie un impôt forfaitaire annuel de 50 000 FC, au plus tard le 30 avril de l'année suivante.",
      art: "art. 11 O.-L. n° 13/006",
    },
    {
      q: "Une boutique (activité de vente) réalise 60 000 000 FC de chiffre d'affaires. Quel est son impôt annuel ?",
      r: ["600 000 FC", "1 200 000 FC", "360 000 FC", "50 000 FC"],
      b: 0,
      e: "Petite entreprise, activité de vente : 60 000 000 × 1 % = 600 000 FC.",
      art: "art. 6 O.-L. n° 13/006",
    },
    {
      q: "Un cabinet de services réalise 25 000 000 FC de chiffre d'affaires. Quel acompte doit-il verser au 31 janvier N+1 ?",
      r: ["200 000 FC", "500 000 FC", "300 000 FC", "250 000 FC"],
      b: 2,
      e: "Impôt = 25 000 000 × 2 % = 500 000 FC. Acompte de 60 % = 300 000 FC ; le solde de 200 000 FC est payé au 30 avril.",
      art: "art. 6 et 7 O.-L. n° 13/006",
    },
    {
      q: "Une petite entreprise devait verser 300 000 FC d'acompte et n'a payé que 100 000 FC. Quelle est l'amende ?",
      r: ["50 000 FC", "75 000 FC", "100 000 FC", "25 000 FC"],
      b: 0,
      e: "Montant non versé : 300 000 − 100 000 = 200 000 FC. Amende de 25 % : 200 000 × 25 % = 50 000 FC.",
      art: "art. 7 O.-L. n° 13/006",
    },
    {
      q: "Comment une petite entreprise peut-elle choisir le régime de droit commun ?",
      r: [
        "À tout moment, et elle peut revenir en arrière",
        "Par écrit, avant le 1er février de l'année de réalisation des revenus ; l'option est irrévocable",
        "Avec sa déclaration du 30 avril N+1",
        "Avant le 31 janvier N+1, pour deux ans",
      ],
      b: 1,
      e: "L'option est faite par écrit avant le 1er février de l'année de réalisation des revenus. Elle est définitive et irrévocable.",
      art: "art. 9 O.-L. n° 13/006",
    },
    {
      q: "Une entreprise réalise 35 000 000 FC en services et 15 000 000 FC en ventes. Quel est son impôt ?",
      r: ["850 000 FC", "500 000 FC", "1 000 000 FC", "1 500 000 FC"],
      b: 2,
      e: "On cumule : 50 000 000 FC. L'activité principale est le service, donc 2 % : 50 000 000 × 2 % = 1 000 000 FC.",
      art: "art. 6 O.-L. n° 13/006",
    },
    {
      q: "Une entreprise réalise exactement 80 000 000 FC de chiffre d'affaires hors TVA. Quelle est sa situation ?",
      r: [
        "Petite entreprise, hors TVA",
        "Micro-entreprise",
        "Hors régime des EPT (droit commun) et assujettie à la TVA",
        "Petite entreprise assujettie à la TVA",
      ],
      b: 2,
      e: "L'EPT doit avoir un chiffre d'affaires « inférieur à » 80 000 000 FC, alors que la TVA vise un chiffre d'affaires « égal ou supérieur » à ce montant.",
      art: "art. 2 O.-L. n° 13/006 ; art. 14 O.-L. n° 10/001",
    },
    {
      q: "Une petite entreprise dépasse 80 000 000 FC de chiffre d'affaires une seule année. Que se passe-t-il ?",
      r: [
        "Elle passe automatiquement au droit commun l'année suivante",
        "Elle ne passe au droit commun qu'après un dépassement au cours de deux années successives, sur décision de l'Administration",
        "Elle paie 3 % de son chiffre d'affaires",
        "Elle devient micro-entreprise",
      ],
      b: 1,
      e: "La sortie du régime suppose un dépassement de la limite au cours de deux années successives et une décision de l'Administration.",
      art: "art. 8 O.-L. n° 13/006",
    },
    {
      q: "Comment est calculé l'IPR des salariés d'une micro-entreprise ?",
      r: [
        "Avec le barème progressif et la réduction pour charges de famille",
        "Ils sont exonérés d'IPR",
        "Au taux unique de 20 %",
        "Selon des taux forfaitaires fixés par arrêté, reversés par quotités trimestrielles",
      ],
      b: 3,
      e: "L'art. 84 § 3 renvoie à des taux forfaitaires fixés par arrêté, avec un reversement trimestriel ; la réduction pour charges de famille ne s'applique pas.",
      art: "art. 84 § 3 et 89 O.-L. n° 69/009",
    },
  ],
};
