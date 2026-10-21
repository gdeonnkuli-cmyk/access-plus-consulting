// Module F8 — Sanctions, recouvrement et contentieux
// Source : fiche D-procedures (L. n° 004/2003, Code des impôts à jour au 15 juillet 2017).
export default {
  id: "F8",
  titre: "Sanctions, recouvrement et contentieux",
  court: "Contentieux",
  ico: "gavel",
  col: "#C98A1B",
  duree: "30 min",
  resume: "Pénalités, intérêts de 4 % par mois, AMR, poursuites, réclamation : ce que coûte un retard et comment contester un impôt.",
  blocs: [
    {
      type: "essentiel",
      texte:
        "Un retard ou une erreur coûte cher : une **majoration d'assiette** (de 20 % à 100 % de l'impôt selon les cas) s'ajoute à un **intérêt moratoire de 4 % par mois de retard**. Les impôts établis par l'Administration sont réclamés par un **avis de mise en recouvrement (AMR)**, payable dans les 15 jours, puis par des poursuites (commandement, avis à tiers détenteur, saisies, fermeture). Pour contester la base ou le montant de l'impôt, on adresse une **réclamation dans les 6 mois** au Directeur ou au Chef de Centre ; elle ne suspend pas le paiement, sauf **sursis** obtenu en versant au moins **un cinquième** du supplément contesté. Pour contester un acte de poursuite, on s'adresse d'abord au **Receveur**.",
    },
    {
      type: "texte",
      titre: "Les familles de sanctions et leurs bases de calcul",
      p: [
        "La L. n° 004/2003 distingue cinq familles : les **pénalités d'assiette** (majorations), les **pénalités de recouvrement** (intérêts moratoires), les **astreintes**, les **amendes administratives** et les **sanctions pénales** (art. 83-84).",
      ],
      puces: [
        "**Pénalités d'assiette** : calculées sur l'impôt dû, éludé, reconstitué ou forfaitaire (art. 85).",
        "**Intérêt moratoire** : **4 % par mois de retard** (art. 91), réclamé par AMR à l'initiative du Receveur (art. 99).",
        "**Base de l'intérêt** (art. 86) : en cas de **redressement ou de taxation d'office**, uniquement le **principal** ; en cas de paiement tardif de l'impôt, les **droits et les pénalités d'assiette**.",
        "**Récidive** : même infraction déjà sanctionnée dans un délai de **deux ans** (impôts annuels) ou de **six mois** (autres impôts) (art. 84). En récidive, il n'y a pas de lettre de relance (art. 5).",
        "**Acompte provisionnel** non versé ou insuffisant : amende de **50 % du montant non versé** (art. 98 bis).",
      ],
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Barème des principales pénalités (L. n° 004/2003)",
      entetes: ["Situation", "Pénalité", "Récidive", "Article"],
      lignes: [
        ["Déclaration régularisée dans les 5 jours de la relance", "25 % de l'impôt dû", "—", "art. 89"],
        ["Taxation d'office pour absence de déclaration", "50 % de l'impôt dû", "100 %", "art. 89"],
        ["Autres cas de taxation d'office", "25 %", "50 %", "art. 89"],
        ["Redressement", "20 % de l'impôt éludé", "40 %", "art. 89"],
        ["Retard de paiement", "Intérêt de 4 % par mois de retard", "—", "art. 91"],
        ["Acompte IBP non versé ou insuffisant", "50 % de l'acompte non versé", "—", "art. 98 bis"],
        ["Déclaration hors délai : exonéré, opérations exonérées ou « Néant »", "200 000 FC", "—", "L.F. 14/002, art. 9"],
        ["Frais de poursuites", "Commandement 3 % ; saisie 5 % ; vente 3 %", "—", "art. 100"],
      ],
      note: "Taux et montants de l'édition 2017 ; le Ministre peut les modifier par arrêté (art. 91 et 98 ter).",
    },
    {
      type: "texte",
      titre: "Amendes, astreintes et sanctions pénales",
      puces: [
        "**Astreinte** pour refus de répondre à une demande de renseignements (hors contrôle) : **100 000 FC par jour de retard** (personne morale) ou **25 000 FC** (personne physique), jusqu'à la réponse (art. 92).",
        "**Annexes manquantes** à la déclaration d'IBP : **100 000 FC par annexe**, 200 000 FC en récidive (art. 93).",
        "**Déclaration qui ne sert pas au calcul de l'impôt** (ex. relevé trimestriel des sommes versées aux tiers) non déposée : 500 000 FC (PM) ou 250 000 FC (PP) (art. 94).",
        "**Faux renseignements** : 1 500 000 FC (PM) ou 250 000 FC (PP) ; **renseignements incomplets** : 750 000 FC ou 125 000 FC (art. 97).",
        "**Mention obligatoire omise sur une facture** : 750 000 FC (PM) ou 250 000 FC (PP) par omission (art. 97 bis). **Opposition** à l'enquête ou au contrôle inopiné : 1 000 000 FC, doublée en récidive (art. 97 ter).",
        "**Défaut de retenue sur loyers** : amende égale à la retenue due (art. 96).",
        "**Sanctions pénales** (intention frauduleuse, à prouver par l'Administration) : 1 à 30 jours de prison et/ou amende égale à l'impôt éludé ; en récidive, 40 à 60 jours et/ou le double (art. 101-103).",
        "Infractions visées : omission ou dissimulation volontaire, écritures fictives ou inexactes, fausses factures, opposition à l'action de l'Administration, agression ou outrage envers un agent (art. 102).",
      ],
    },
    {
      type: "exemple",
      titre: "Exemple 1 — SA KIVU TRANS paie son IBP en retard",
      enonce:
        "Les deux acomptes de 2025 ont été versés à temps et il reste un solde d'IBP 2025 de 120 000 000 FC (taux de 30 %), à payer avec la déclaration au plus tard le 30 avril 2026. SA KIVU TRANS ne dépose rien. Elle reçoit une lettre de relance et dépose sa déclaration dans les 5 jours, mais ne paie l'impôt que 2 mois après l'échéance. Ce n'est pas une récidive.",
      lignes: [
        ["Solde d'IBP 2025 (principal)", 120000000],
        ["+ Majoration d'assiette : régularisation après relance, 120 000 000 × 25 % (art. 89)", 30000000],
        ["= Droits et pénalités d'assiette", 150000000, "total"],
        ["+ Intérêt moratoire : 150 000 000 × 4 % × 2 mois (art. 86 et 91)", 12000000],
        ["= Total à payer", 162000000, "resultat"],
      ],
      conclusion:
        "Le retard coûte 42 000 000 FC, soit 35 % de l'impôt. Sans régularisation après la relance, la société aurait été taxée d'office avec une majoration de 50 % (60 000 000 FC), ou de 100 % en récidive, sans délai de 20 jours ni sursis. Si en plus un acompte de 20 000 000 FC n'avait pas été versé, l'amende aurait été de 20 000 000 × 50 % = 10 000 000 FC (art. 98 bis).",
    },
    {
      type: "exemple",
      titre: "Exemple 2 — Supplément après redressement",
      enonce:
        "Après une vérification, la SARL BOMOKO doit un supplément d'IBP de 15 000 000 FC. On suppose que l'intérêt de retard court sur 3 mois.",
      lignes: [
        ["Supplément d'impôt (principal)", 15000000],
        ["+ Majoration de redressement : 15 000 000 × 20 % (art. 89)", 3000000],
        ["+ Intérêt moratoire sur le principal seul : 15 000 000 × 4 % × 3 mois (art. 86)", 1800000],
        ["= Total réclamé", 19800000, "resultat"],
      ],
      conclusion:
        "En cas de redressement, l'intérêt se calcule sur le principal seul, pas sur la majoration. Si la SARL BOMOKO réclame, elle peut obtenir le sursis de paiement en versant au moins 1/5 du supplément contesté : 15 000 000 ÷ 5 = 3 000 000 FC (art. 110).",
    },
    {
      type: "texte",
      titre: "Le recouvrement : de l'AMR aux poursuites",
      puces: [
        "**AMR** : signé par le Receveur, il indique le NIF, l'impôt, la base, le principal, les pénalités et le délai ; il est payable **dans les 15 jours** de sa réception (art. 58-60).",
        "**Déclaration sans paiement** (ou paiement insuffisant) : **mise en demeure** de payer dans un délai de **8 jours** (art. 64).",
        "**Commandement** : à l'expiration de ces délais, paiement **dans les 8 jours** sous peine de poursuites ; signifié par un huissier (art. 65).",
        "**Mesures de poursuite** (art. 66) : avis à tiers détenteur (ATD), saisies mobilières et immobilières, **fermeture provisoire** de l'établissement par apposition de scellés.",
        "**ATD** : la banque, le locataire ou le client du redevable paie à sa place ; faute d'exécution dans les **8 jours**, il est poursuivi comme débiteur direct (art. 67).",
        "**Saisie-vente** : les meubles saisis sont vendus 8 jours au moins après la signification du procès-verbal de saisie (art. 68).",
        "**Saisie conservatoire** si le Trésor est en péril, à convertir en saisie-vente dans les **2 mois** (art. 71) ; **privilège** du Trésor pendant 2 ans et **hypothèque légale** sur les immeubles (art. 75-76).",
        "**Prescription** : **quinze ans** à compter du dépôt de la déclaration ou de l'émission de l'AMR ; chaque acte interruptif (commandement, ATD…) ouvre un nouveau délai de quinze ans (art. 73).",
      ],
    },
    {
      type: "texte",
      titre: "Alléger la dette : échelonnement, transaction, non-valeur, recours gracieux",
      puces: [
        "**Échelonnement** : en cas de difficultés de trésorerie, le Directeur peut suspendre les poursuites contre un plan de paiement de **six mois au plus** ; il est révoqué si une échéance n'est pas respectée (art. 74).",
        "**Transaction** : après mise en recouvrement, l'Administration peut proposer de modérer les **pénalités** ; le redevable répond dans les 5 jours (art. 105 quarto).",
        "Compétence pour transiger : Directeur jusqu'à 500 000 000 FC, Directeur Général jusqu'à 2 500 000 000 FC, Ministre des Finances au-delà (art. 105 quarto).",
        "En acceptant la transaction, le redevable s'engage à ne pas réclamer, à se désister de ses recours et à payer immédiatement le solde.",
        "**Recours gracieux** : remise ou modération des pénalités en cas d'indigence ou de gêne, demandée au Ministre après renonciation aux autres recours ; décision dans les 15 jours, le silence valant rejet (art. 105 ter).",
        "**Admission en non-valeur** : créance irrécouvrable constatée par un PV de carence et admise par le Ministre. Le contribuable **n'est pas libéré** : les poursuites reprennent s'il redevient solvable (art. 74 bis).",
      ],
    },
    {
      type: "texte",
      titre: "Contester l'impôt : le contentieux d'assiette",
      p: [
        "Le contribuable qui conteste la base ou le montant de son impôt doit d'abord présenter une **réclamation préalable** à l'Administration : on ne peut pas saisir directement le juge.",
      ],
      puces: [
        "**Réclamation** : écrite, motivée, au **Directeur ou Chef de Centre**, sans preuve du paiement, **dans les 6 mois** de la déclaration ou de la réception de l'AMR, sous peine de déchéance (art. 104).",
        "**Décision** dans les **6 mois** de la réception ; le silence vaut **rejet**. Si le redevable ne fournit pas les pièces demandées pendant plus de 20 jours, la réclamation est rejetée (art. 105-106).",
        "**Pas d'effet suspensif** : l'impôt reste exigible. Sursis possible pour un supplément contre le versement d'au moins **un cinquième** du montant contesté ; pas en cas de taxation d'office (art. 110).",
        "**Recours** devant la **Cour administrative d'appel** dans les **6 mois** de la décision (ou de l'expiration du délai de décision), principal contesté **payé** (art. 108) ; puis cassation (art. 109).",
        "**Dégrèvement d'office**, même hors délai : **erreur matérielle** (plume, calcul, AMR) ou **double emploi** (même impôt, même base, même contribuable) ; restitution limitée à 3 ans (art. 105).",
        "**Compétence de dégrèvement** : Directeur urbain ou provincial entre 50 000 000 et 500 000 000 FC ; Directeur Général au-delà de 500 000 000 FC (art. 105 bis).",
      ],
    },
    {
      type: "schema",
      kind: "chronologie",
      titre: "Le parcours d'une réclamation contre un supplément d'impôt",
      jalons: [
        { date: "Réception de l'AMR", l: "Paiement dans les 15 jours", d: "La réclamation ne suspend pas l'exigibilité (art. 60 et 110)." },
        { date: "Dans les 6 mois", l: "Réclamation écrite et motivée", d: "Au Directeur ou au Chef de Centre ; sursis si 1/5 du supplément est versé (art. 104 et 110)." },
        { date: "6 mois après réception", l: "Décision de l'Administration", d: "Le silence vaut rejet (art. 105)." },
        { date: "6 mois après la décision", l: "Cour administrative d'appel", d: "Principal contesté payé, aucune demande nouvelle (art. 108)." },
        { date: "Ensuite", l: "Cassation", d: "Contre l'arrêt de la Cour administrative d'appel (art. 109)." },
      ],
    },
    {
      type: "texte",
      titre: "Contester les poursuites : le contentieux du recouvrement",
      p: [
        "Ici, on ne discute pas le montant de l'impôt (l'assiette) mais **la régularité des poursuites** : forme de l'acte, existence de l'obligation de payer, montant compte tenu des paiements déjà faits, exigibilité (art. 72 ; A.M. n° 020/2016).",
      ],
      puces: [
        "**Réclamation préalable obligatoire** auprès du **Receveur**, qui décide dans un délai de **8 jours** (ouvrables) à compter de sa réception.",
        "**Recours** devant le **Tribunal administratif** du ressort **dans un délai d'un mois**, sous peine de forclusion ; sans pièces ni faits nouveaux.",
        "Les poursuites sont **suspendues** dès que le Tribunal se déclare saisi ; il doit juger **dans les 30 jours**, faute de quoi la suspension est levée.",
      ],
    },
    {
      type: "schema",
      kind: "arbre",
      titre: "Quel recours choisir ?",
      question: "Que voulez-vous contester ?",
      branches: [
        { si: "La base ou le montant de l'impôt", alors: "Contentieux d'assiette", d: "Réclamation au Directeur ou au Chef de Centre dans les 6 mois (art. 104)." },
        { si: "Un acte de poursuite (ATD, commandement, saisie)", alors: "Contentieux du recouvrement", d: "Receveur (8 jours), puis Tribunal administratif dans le mois (art. 72)." },
        { si: "Une erreur matérielle ou un double emploi", alors: "Dégrèvement d'office", d: "Possible même après les délais (art. 105)." },
        { si: "Les pénalités, faute de moyens", alors: "Recours gracieux ou transaction", d: "Remise ou modération des pénalités (art. 105 ter et 105 quarto)." },
      ],
    },
    {
      type: "pieges",
      puces: [
        "Croire que la réclamation suspend le paiement : sans sursis (versement d'au moins 1/5 du supplément), les poursuites continuent.",
        "Laisser passer les 6 mois après l'AMR : la réclamation est irrecevable (déchéance), sauf erreur matérielle ou double emploi.",
        "Saisir la Cour administrative d'appel sans avoir payé le principal contesté : le recours est irrecevable.",
        "Calculer l'intérêt de 4 % sur la majoration en cas de redressement : il ne porte alors que sur le **principal** (art. 86).",
        "Confondre l'amende pour acompte IBP non versé (**50 %**, art. 98 bis L. n° 004/2003) et celle du régime des petites entreprises (**25 %**, art. 7 O.-L. n° 13/006).",
        "Penser qu'une admission en non-valeur efface la dette : les poursuites reprennent si le contribuable redevient solvable.",
      ],
    },
    {
      type: "maj",
      texte:
        "Les taux et montants de ce module (majorations de l'art. 89, intérêt de 4 % par mois soit 48 % par an sans plafond, amendes, frais de poursuites) sont ceux de l'édition du Code à jour au **15 juillet 2017**. Le Ministre peut modifier l'intérêt moratoire par voie réglementaire (art. 91, al. 2) et les montants des pénalités **par arrêté** (art. 98 ter) : vérifiez les arrêtés et les lois de finances postérieurs à 2017. Le taux d'IBP de l'exemple est de **30 %**, taux en vigueur retenu par Éco-Campus ; l'édition 2017 indiquait 35 % (art. 83 O.-L. n° 69/009).",
    },
    {
      type: "maj",
      texte:
        "**Contradiction à signaler (art. 72)** : la loi prévoit une décision du Receveur sous « huit jours », puis renvoie à « huit jours ouvrables », et désigne le **Tribunal administratif**. L'A.M. n° 020/2016 prévoyait au contraire « trois jours ouvrables » et le **Tribunal de Grande Instance** ; le Code de 2017 le corrige entre crochets en renvoyant à la L.F. n° 17/005 et à la L.O. n° 16/027. Vérifiez quel texte prévaut et si les juridictions administratives sont effectivement installées dans votre ressort.",
    },
    {
      type: "articles",
      refs: [
        "Art. 83 à 88 — L. n° 004/2003 : typologie des sanctions, récidive, bases de calcul",
        "Art. 89 — L. n° 004/2003 : pénalités d'assiette (25 %, 50 %, 20 % ; récidive)",
        "Art. 91 et 99 — L. n° 004/2003 : intérêt moratoire de 4 % par mois",
        "Art. 92 à 98 ter — L. n° 004/2003 : astreintes et amendes administratives",
        "Art. 9 — L.F. n° 14/002 : amende de 200 000 FC pour déclaration tardive sans impôt",
        "Art. 100 à 103 — L. n° 004/2003 : frais de poursuites et sanctions pénales",
        "Art. 58 à 74 bis — L. n° 004/2003 : AMR, poursuites, contestations, échelonnement, non-valeur",
        "Art. 75 à 82 — L. n° 004/2003 : garanties du Trésor",
        "Art. 104 à 110 — L. n° 004/2003 : réclamation, dégrèvement, transaction, recours, sursis",
        "A.M. n° 020 du 28 juin 2016 : contestations en matière de recouvrement",
        "A.M. n° 013 du 11 mai 2015 : recours gracieux",
      ],
    },
  ],
  qcm: [
    {
      q: "Quel est le taux de l'intérêt moratoire en cas de paiement tardif ?",
      r: ["1 % par mois", "2 % par mois", "4 % par mois", "10 % par an"],
      b: 2,
      e: "L'intérêt moratoire est égal à 4 % par mois de retard ; le Ministre peut le modifier par voie réglementaire.",
      art: "art. 91 L. n° 004/2003",
    },
    {
      q: "Quelle majoration s'applique à un impôt éludé découvert lors d'un redressement (première infraction) ?",
      r: ["20 % de l'impôt éludé", "25 % de l'impôt éludé", "50 % de l'impôt éludé", "100 % de l'impôt éludé"],
      b: 0,
      e: "En cas de redressement, la majoration est de 20 % de l'impôt éludé, portée à 40 % en récidive.",
      art: "art. 89 L. n° 004/2003",
    },
    {
      q: "ETS MAMA NZINGA n'a pas déposé sa déclaration malgré la relance et est taxée d'office pour la première fois. Quelle majoration ?",
      r: ["20 %", "25 %", "40 %", "50 %"],
      b: 3,
      e: "La taxation d'office pour absence de déclaration entraîne une majoration de 50 % de l'impôt dû (100 % en récidive).",
      art: "art. 89 L. n° 004/2003",
    },
    {
      q: "Une entreprise n'a pas versé un acompte provisionnel d'IBP de 8 000 000 FC. Quelle amende encourt-elle ?",
      r: ["2 000 000 FC", "4 000 000 FC", "8 000 000 FC", "320 000 FC"],
      b: 1,
      e: "Le défaut d'acompte est sanctionné par une amende de 50 % de l'acompte non versé : 8 000 000 × 50 % = 4 000 000 FC.",
      art: "art. 98 bis L. n° 004/2003",
    },
    {
      q: "Dans quel délai faut-il introduire une réclamation contre un impôt mis en recouvrement par AMR ?",
      r: [
        "15 jours à compter de la réception de l'AMR",
        "1 mois à compter de la réception de l'AMR",
        "6 mois à compter de la réception de l'AMR",
        "3 ans à compter de la prise en recettes",
      ],
      b: 2,
      e: "Sous peine de déchéance, la réclamation est introduite dans les six mois à partir de la date de la déclaration ou de la réception de l'AMR.",
      art: "art. 104 L. n° 004/2003",
    },
    {
      q: "La SARL BOMOKO conteste un supplément d'impôt de 30 000 000 FC et demande le sursis de paiement. Combien doit-elle verser au minimum ?",
      r: ["6 000 000 FC", "3 000 000 FC", "15 000 000 FC", "30 000 000 FC"],
      b: 0,
      e: "Le sursis est accordé contre le versement d'au moins un cinquième du supplément contesté : 30 000 000 ÷ 5 = 6 000 000 FC.",
      art: "art. 110 L. n° 004/2003",
    },
    {
      q: "L'Administration n'a pas répondu à une réclamation six mois après l'avoir reçue. Que signifie ce silence ?",
      r: [
        "La réclamation est acceptée",
        "L'impôt est dégrevé automatiquement",
        "Le délai est prolongé de trois mois",
        "La réclamation est rejetée",
      ],
      b: 3,
      e: "À défaut de décision dans les six mois qui suivent la réception, le silence est considéré comme une décision de rejet ; le contribuable peut alors saisir la Cour administrative d'appel.",
      art: "art. 105 L. n° 004/2003",
    },
    {
      q: "SA KIVU TRANS estime qu'un avis à tiers détenteur adressé à sa banque est irrégulier en la forme. Quelle est la bonne démarche ?",
      r: [
        "Saisir directement la Cour administrative d'appel dans les 6 mois",
        "Réclamer auprès du Receveur, puis saisir le Tribunal administratif dans le mois",
        "Adresser un recours gracieux au Ministre",
        "Réclamer auprès du Directeur dans les 6 mois",
      ],
      b: 1,
      e: "Une contestation des poursuites passe d'abord par le Receveur, qui décide dans les 8 jours, puis par le Tribunal administratif dans un délai d'un mois.",
      art: "art. 72 L. n° 004/2003",
    },
    {
      q: "Pendant combien de temps l'Administration peut-elle recouvrer un impôt déclaré, sans acte interruptif ?",
      r: ["4 ans", "5 ans", "15 ans", "30 ans"],
      b: 2,
      e: "Le recouvrement se prescrit par quinze ans à compter du dépôt de la déclaration ou de l'émission de l'AMR ; chaque acte interruptif fait courir un nouveau délai de quinze ans.",
      art: "art. 73 L. n° 004/2003",
    },
    {
      q: "Un supplément d'impôt de 10 000 000 FC issu d'un redressement (majoration de 20 %) est payé avec 2 mois de retard. Quel est l'intérêt moratoire ?",
      r: ["960 000 FC", "400 000 FC", "2 000 000 FC", "800 000 FC"],
      b: 3,
      e: "En cas de redressement, l'intérêt porte sur le principal seul : 10 000 000 × 4 % × 2 = 800 000 FC (960 000 FC serait le calcul erroné incluant la majoration).",
      art: "art. 86 et 91 L. n° 004/2003",
    },
  ],
};
