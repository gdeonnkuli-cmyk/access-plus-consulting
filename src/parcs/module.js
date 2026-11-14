// ══════════════════ MODULE DE CULTURE GÉNÉRALE : PARCS NATIONAUX ET SITES PROTÉGÉS DE LA RDC ══════════════════
// Format des modules de leçon (Bloc et Qcm de src/fiscal/CodeImpots.jsx) ; carte interactive : schéma « carteParcs ».
// Contenu fondé sur des informations publiques (ICCN, UNESCO, Convention de Ramsar) : dates et superficies arrondies.
import { SITES } from "./sites";

const parcsNationaux = SITES.filter(s => s.type === "parc").sort((a, b) => a.cree - b.cree);

export const MODULE_PARCS = {
  id: "PARCS", titre: "Parcs nationaux et sites protégés de la RDC", court: "Parcs et sites", ico: "trees", col: "#15803D", duree: "30 min",
  resume: "Les 9 parcs nationaux, la Réserve à okapis, les 5 sites du patrimoine mondial, les sites Ramsar et les réserves de biosphère : où ils se trouvent, ce qu'ils protègent et pourquoi le monde les regarde.",
  blocs: [
    { type: "essentiel", texte: "La RDC abrite une part considérable des forêts tropicales d'Afrique. Pour les protéger, l'État a créé **9 parcs nationaux**, du **parc des Virunga** (1925, le plus ancien d'Afrique) au **parc de la Lomami** (2016), ainsi que des **réserves**. Ils sont gérés par l'**ICCN** (Institut congolais pour la conservation de la nature). **Cinq** sites sont inscrits au **patrimoine mondial de l'UNESCO** : Virunga, Garamba, Kahuzi-Biega, Salonga et la Réserve de faune à okapis. D'autres sont reconnus par la **Convention de Ramsar** (zones humides) ou comme **réserves de biosphère**." },
    { type: "schema", kind: "carteParcs", titre: "Carte des parcs et sites protégés",
      note: "Touchez un point pour afficher le site. Positions approximatives : le point indique le centre du site, pas ses limites." },
    { type: "schema", kind: "tableau", titre: "Les 9 parcs nationaux", entetes: ["Parc", "Province(s)", "Créé en", "À retenir"],
      lignes: parcsNationaux.map(s => [s.court, s.provinces.join(", "), String(s.cree), s.indice]) },
    { type: "schema", kind: "cartes", titre: "Quatre façons de protéger un site", cartes: [
      { ico: "trees", t: "Parc national", d: "Aire protégée créée par l'État pour conserver la nature ; chasse, mines et installations y sont interdites ou très encadrées." },
      { ico: "paw", t: "Réserve de faune", d: "Aire protégée centrée sur une espèce ou un milieu (la Réserve à okapis), avec des usages traditionnels parfois tolérés." },
      { ico: "droplet", t: "Site Ramsar", d: "Zone humide d'importance internationale, selon la Convention de Ramsar (1971) : lacs, marais, mangroves." },
      { ico: "leaf", t: "Réserve de biosphère", d: "Label du programme « L'Homme et la biosphère » de l'UNESCO : concilier conservation, recherche et activités humaines." },
    ] },
    { type: "schema", kind: "chronologie", titre: "Repères historiques", jalons: [
      { date: "1925", l: "Création du parc Albert, futur parc des Virunga", d: "Le premier parc national d'Afrique." },
      { date: "1938-1939", l: "Garamba puis Upemba", d: "Savanes du nord-est et plateaux du Katanga." },
      { date: "1970", l: "Quatre nouveaux parcs", d: "Kahuzi-Biega, Salonga, Maïko et Kundelungu." },
      { date: "1979-1996", l: "Inscriptions au patrimoine mondial", d: "Virunga (1979), Garamba et Kahuzi-Biega (1980), Salonga (1984), Réserve à okapis (1996)." },
      { date: "1992", l: "Parc marin des Mangroves et Réserve à okapis", d: "La façade maritime et la forêt de l'Ituri." },
      { date: "2008", l: "Ngiri-Tumba-Maindombe, site Ramsar", d: "L'une des plus grandes zones humides protégées du monde." },
      { date: "2016", l: "Parc national de la Lomami", d: "Le plus récent parc national." },
    ] },
    { type: "schema", kind: "cartes", titre: "Les 5 sites du patrimoine mondial de l'UNESCO", cartes: SITES.filter(s => s.unesco).sort((a, b) => a.unesco - b.unesco).map(s => (
      { ico: s.type === "reserve" ? "paw" : "trees", t: `${s.court} (${s.unesco})`, d: s.faune.charAt(0).toUpperCase() + s.faune.slice(1) + "." })) },
    { type: "schema", kind: "tableau", titre: "Ordres de grandeur : superficie des grands sites (arrondie)", entetes: ["Site", "Superficie"], lignes: [
      ["Ngiri-Tumba-Maindombe (site Ramsar)", "plus de 65 000 km²"], ["Parc de la Salonga (plus grand parc national)", "environ 36 000 km²"],
      ["Réserve de faune à okapis", "environ 13 700 km²"], ["Parc de l'Upemba", "environ 11 700 km²"], ["Parc des Virunga", "environ 7 800 km²"],
      ["Parc marin des Mangroves (le plus petit)", "environ 770 km²"], ["Pour comparer : la ville-province de Kinshasa", "environ 10 000 km²"],
    ], note: "La Salonga est plus de trois fois plus grande que la ville-province de Kinshasa." },
    { type: "texte", titre: "Des sites menacés, des gardiens exposés", puces: [
      "**Braconnage** : éléphants pour l'ivoire, viande de brousse ; le rhinocéros blanc du Nord a disparu de la Garamba.",
      "**Groupes armés** dans l'Est : les écogardes de l'ICCN paient un lourd tribut, en particulier aux Virunga.",
      "**Exploitation illégale** : mines artisanales, bois, charbon de bois (makala), projets pétroliers contestés.",
      "**Déforestation** et pression agricole aux abords des parcs.",
      "**Atouts** : écotourisme (visite des gorilles), recherche scientifique, stockage du carbone par les forêts, emplois locaux.",
    ] },
    { type: "pieges", puces: [
      "Confondre les gorilles : **de montagne** aux Virunga, **des plaines de l'Est** (de Grauer) à Kahuzi-Biega.",
      "Appeler la Réserve à okapis « parc national » : c'est une **réserve de faune**, inscrite au patrimoine mondial.",
      "Placer la Salonga dans une seule province : elle s'étend sur **quatre** provinces, en deux blocs de forêt.",
      "Oublier le **Parc marin des Mangroves** : c'est le seul parc côtier du pays, près de Moanda.",
      "Croire qu'un site du patrimoine mondial ne risque rien : plusieurs ont été inscrits sur la **liste du patrimoine en péril**.",
    ] },
    { type: "articles", refs: [
      "Loi n° 14/003 du 11 février 2014 relative à la conservation de la nature.",
      "Convention du patrimoine mondial (UNESCO, 1972) ; Convention de Ramsar sur les zones humides (1971) ; programme « L'Homme et la biosphère » (UNESCO).",
      "ICCN : Institut congolais pour la conservation de la nature, gestionnaire des aires protégées.",
    ] },
  ],
  narration: [
    "Bienvenue dans ce module consacré aux parcs nationaux et aux sites protégés de la République démocratique du Congo.",
    "Le pays compte neuf parcs nationaux. Le plus ancien est celui des Virunga, créé en 1925 : c'est aussi le premier parc national d'Afrique. Le plus récent est celui de la Lomami, créé en 2016.",
    "Cinq sites sont inscrits au patrimoine mondial de l'UNESCO : les Virunga, la Garamba, Kahuzi-Biega, la Salonga et la Réserve de faune à okapis.",
    "Chacun a sa signature. Les Virunga, au Nord-Kivu, abritent les gorilles de montagne et les volcans. Kahuzi-Biega, au Sud-Kivu, protège les gorilles des plaines de l'Est. La Garamba, au Haut-Uele, est le parc des savanes et des girafes. La Salonga, plus grand parc de forêt tropicale d'Afrique, est le domaine des bonobos. Et la réserve de l'Ituri protège l'okapi, animal emblème du pays.",
    "Au Katanga, l'Upemba et Kundelungu protègent des plateaux, des lacs et les chutes de la Lofoi. À l'Ouest, le Parc marin des Mangroves, près de Moanda, est le seul parc côtier.",
    "D'autres reconnaissances internationales existent : les sites Ramsar pour les zones humides, comme Ngiri-Tumba-Maindombe, et les réserves de biosphère de Yangambi, Luki et la Lufira.",
    "Ces sites sont menacés par le braconnage, les groupes armés et l'exploitation illégale. Les écogardes de l'Institut congolais pour la conservation de la nature les défendent, parfois au prix de leur vie.",
    "Explorez la carte, puis testez-vous avec le quiz, et avec le jeu « Où se trouve… ? » dans les tests psychotechniques.",
  ],
  qcm: [
    { q: "Quel est le plus ancien parc national d'Afrique ?", r: ["Le parc des Virunga", "Le parc de la Salonga", "Le parc de la Garamba", "Le parc de l'Upemba"], b: 0, e: "Créé en 1925 sous le nom de parc Albert, le parc des Virunga est le premier parc national d'Afrique." },
    { q: "Combien de sites de la RDC sont inscrits au patrimoine mondial de l'UNESCO pour leur nature ?", r: ["5", "2", "9", "12"], b: 0, e: "Virunga, Garamba, Kahuzi-Biega, Salonga et la Réserve de faune à okapis." },
    { q: "Quel parc protège les bonobos et est le plus grand parc de forêt tropicale d'Afrique ?", r: ["La Salonga", "La Maïko", "Kundelungu", "La Garamba"], b: 0, e: "La Salonga couvre environ 36 000 km², en deux blocs de forêt." },
    { q: "Dans quelle province se trouve le parc de Kahuzi-Biega ?", r: ["Sud-Kivu", "Nord-Kivu", "Ituri", "Maniema"], b: 0, e: "Kahuzi-Biega se trouve au Sud-Kivu, à l'ouest de Bukavu." },
    { q: "Quels gorilles peut-on observer au parc de Kahuzi-Biega ?", r: ["Les gorilles des plaines de l'Est (de Grauer)", "Les gorilles de montagne", "Les gorilles des plaines de l'Ouest", "Aucun gorille"], b: 0, e: "Les gorilles de montagne vivent aux Virunga ; Kahuzi-Biega protège ceux des plaines de l'Est." },
    { q: "Quel animal emblématique protège la réserve de l'Ituri ?", r: ["L'okapi", "Le rhinocéros blanc", "Le lamantin", "Le bonobo"], b: 0, e: "La Réserve de faune à okapis, en Ituri, est inscrite au patrimoine mondial depuis 1996." },
    { q: "Quel est le seul parc national côtier du pays ?", r: ["Le Parc marin des Mangroves", "Le parc de la Lomami", "Le parc de l'Upemba", "Le parc de la Maïko"], b: 0, e: "Il se trouve au Kongo-Central, à l'embouchure du fleuve Congo, près de Moanda." },
    { q: "Quel est le parc national le plus récent ?", r: ["La Lomami (2016)", "Kundelungu (1970)", "La Garamba (1938)", "Les Virunga (1925)"], b: 0, e: "Créé en 2016 entre les rivières Lomami et Lualaba, il abrite le singe lesula." },
    { q: "Dans quelle province se trouve le parc de la Garamba ?", r: ["Haut-Uele", "Bas-Uele", "Tshopo", "Nord-Ubangi"], b: 0, e: "La Garamba est au Haut-Uele, à la frontière du Soudan du Sud." },
    { q: "Quel organisme gère les parcs nationaux de la RDC ?", r: ["L'ICCN", "La BCC", "La DGI", "La CNSS"], b: 0, e: "L'Institut congolais pour la conservation de la nature gère les aires protégées." },
    { q: "Qu'est-ce qu'un site Ramsar ?", r: ["Une zone humide d'importance internationale", "Un site minier protégé", "Un parc réservé à la chasse", "Une forêt de montagne"], b: 0, e: "La Convention de Ramsar (1971) protège les zones humides : lacs, marais, mangroves." },
    { q: "Dans quelle partie de la RDC se trouvent les parcs de l'Upemba et de Kundelungu ?", r: ["Au Katanga (Haut-Lomami, Haut-Katanga)", "Au Kivu", "Dans l'Équateur", "Au Kongo-Central"], b: 0, e: "Ils protègent les plateaux, les lacs et les chutes de la Lofoi du Katanga." },
    { q: "Quelle espèce a disparu à l'état sauvage du parc de la Garamba ?", r: ["Le rhinocéros blanc du Nord", "L'okapi", "La girafe du Kordofan", "L'éléphant de savane"], b: 0, e: "La Garamba était le dernier refuge sauvage du rhinocéros blanc du Nord." },
    { q: "Lequel de ces sites est une réserve de biosphère de l'UNESCO ?", r: ["Yangambi", "Le parc des Virunga", "La Réserve à okapis", "Le Parc marin des Mangroves"], b: 0, e: "Yangambi, Luki et la Lufira sont des réserves de biosphère du programme « L'Homme et la biosphère »." },
    { q: "Quelle loi encadre la conservation de la nature en RDC ?", r: ["La loi n° 14/003 du 11 février 2014", "La loi n° 23/053 du 30 novembre 2023", "La loi n° 16/009 du 15 juillet 2016", "La loi n° 002/2002 du 2 février 2002"], b: 0, e: "La loi de 2014 relative à la conservation de la nature organise notamment les aires protégées." },
  ],
};
