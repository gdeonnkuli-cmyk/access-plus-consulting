// ══════════════════ PARCS NATIONAUX ET SITES PROTÉGÉS DE LA RDC ══════════════════
// Données communes au module de cours (src/parcs/module.js) et au jeu de la carte (src/parcs/OuParcs.jsx).
// Positions : centre approximatif de chaque site (latitude, longitude), projeté sur la carte des provinces.
// Années, statuts et superficies arrondies : sources publiques usuelles (ICCN, UNESCO, Convention de Ramsar) ;
// à vérifier avant tout usage officiel (les statuts « en péril » évoluent).
import { projeter } from "../psycho/carteRdc";

// type : parc (parc national), reserve, ramsar (zone humide d'importance internationale), biosphere (réserve de biosphère UNESCO)
const BRUT = [
  { id: "virunga", nom: "Parc national des Virunga", court: "Virunga", type: "parc", provinces: ["Nord-Kivu"], cree: 1925, unesco: 1979, km2: 7800, lat: -0.8, lon: 29.25,
    faune: "gorilles de montagne, hippopotames, volcans Nyiragongo et Nyamulagira, monts Rwenzori",
    indice: "Le plus ancien parc national d'Afrique, celui des gorilles de montagne et des volcans",
    inter: "Patrimoine mondial ; transfrontalier avec le Rwanda (parc des Volcans) et l'Ouganda" },
  { id: "garamba", nom: "Parc national de la Garamba", court: "Garamba", type: "parc", provinces: ["Haut-Uele"], cree: 1938, unesco: 1980, km2: 4900, lat: 4.1, lon: 29.3,
    faune: "éléphants, girafes du Kordofan, savanes ; dernier refuge du rhinocéros blanc du Nord, aujourd'hui disparu à l'état sauvage",
    indice: "Le parc des savanes et des girafes, à la frontière du Soudan du Sud",
    inter: "Patrimoine mondial ; frontalier du Soudan du Sud" },
  { id: "upemba", nom: "Parc national de l'Upemba", court: "Upemba", type: "parc", provinces: ["Haut-Lomami", "Haut-Katanga"], cree: 1939, km2: 11700, lat: -9.0, lon: 26.6,
    faune: "lacs et marais de la dépression de Kamalondo, zèbres, antilopes, plateaux",
    indice: "Le parc des lacs et des plateaux du Katanga, créé en 1939" },
  { id: "kahuzi", nom: "Parc national de Kahuzi-Biega", court: "Kahuzi-Biega", type: "parc", provinces: ["Sud-Kivu"], cree: 1970, unesco: 1980, km2: 6000, lat: -2.1, lon: 28.0,
    faune: "gorilles des plaines de l'Est (gorilles de Grauer), forêts de montagne et de basse altitude",
    indice: "Le parc des gorilles des plaines de l'Est, près de Bukavu",
    inter: "Patrimoine mondial" },
  { id: "salonga", nom: "Parc national de la Salonga", court: "Salonga", type: "parc", provinces: ["Tshuapa", "Mai-Ndombe", "Kasaï", "Sankuru"], cree: 1970, unesco: 1984, km2: 36000, lat: -2.0, lon: 21.4,
    faune: "bonobos, éléphants de forêt, paons congolais ; forêt tropicale en deux blocs",
    indice: "Le plus grand parc de forêt tropicale d'Afrique, celui des bonobos",
    inter: "Patrimoine mondial (retiré de la liste du patrimoine en péril en 2021)" },
  { id: "maiko", nom: "Parc national de la Maïko", court: "Maïko", type: "parc", provinces: ["Nord-Kivu", "Tshopo", "Maniema"], cree: 1970, km2: 10800, lat: -0.6, lon: 27.6,
    faune: "okapis, paons congolais, gorilles de Grauer ; forêt dense très isolée",
    indice: "Le parc forestier isolé de l'Est, à cheval sur trois provinces, refuge du paon congolais" },
  { id: "kundelungu", nom: "Parc national de Kundelungu", court: "Kundelungu", type: "parc", provinces: ["Haut-Katanga"], cree: 1970, km2: 7600, lat: -10.3, lon: 28.0,
    faune: "plateau de savane, chutes de la Lofoi, parmi les plus hautes d'Afrique",
    indice: "Le parc du plateau et des chutes de la Lofoi, au Haut-Katanga" },
  { id: "mangroves", nom: "Parc marin des Mangroves", court: "Mangroves", type: "parc", provinces: ["Kongo-Central"], cree: 1992, km2: 770, lat: -5.95, lon: 12.45,
    faune: "mangroves de l'embouchure du fleuve Congo, lamantins, tortues marines",
    indice: "Le seul parc marin du pays, à l'embouchure du fleuve Congo près de Moanda",
    inter: "Site Ramsar (zone humide d'importance internationale)" },
  { id: "lomami", nom: "Parc national de la Lomami", court: "Lomami", type: "parc", provinces: ["Tshopo", "Maniema"], cree: 2016, km2: 8900, lat: -1.6, lon: 25.1,
    faune: "forêt entre les rivières Lomami et Lualaba ; singe lesula, décrit par les scientifiques en 2012",
    indice: "Le plus récent parc national (2016), où vit le singe lesula" },
  { id: "okapis", nom: "Réserve de faune à okapis", court: "Réserve à okapis", type: "reserve", provinces: ["Ituri"], cree: 1992, unesco: 1996, km2: 13700, lat: 1.6, lon: 28.5,
    faune: "okapis, forêt de l'Ituri, peuples autochtones Mbuti et Efe",
    indice: "La réserve de l'animal emblème du pays, dans la forêt de l'Ituri",
    inter: "Patrimoine mondial" },
  { id: "ngiri", nom: "Ngiri-Tumba-Maindombe", court: "Ngiri-Tumba-Maindombe", type: "ramsar", provinces: ["Équateur", "Mai-Ndombe"], cree: 2008, km2: 65700, lat: -0.5, lon: 18.4,
    faune: "forêts inondées, lacs Tumba et Mai-Ndombe, poissons et oiseaux d'eau",
    indice: "L'une des plus grandes zones humides protégées du monde, autour des lacs Tumba et Mai-Ndombe",
    inter: "Site Ramsar (inscrit en 2008)" },
  { id: "yangambi", nom: "Réserve de biosphère de Yangambi", court: "Yangambi", type: "biosphere", provinces: ["Tshopo"], cree: 1976, lat: 0.8, lon: 24.5,
    faune: "forêt dense le long du fleuve Congo, ancienne station de recherche agronomique",
    indice: "La réserve de biosphère de la forêt et de la recherche, à l'ouest de Kisangani",
    inter: "Réserve de biosphère de l'UNESCO" },
  { id: "luki", nom: "Réserve de biosphère de Luki", court: "Luki", type: "biosphere", provinces: ["Kongo-Central"], cree: 1976, lat: -5.6, lon: 13.1,
    faune: "forêt du Mayombe, la plus proche de l'océan",
    indice: "La réserve de biosphère de la forêt du Mayombe, au Kongo-Central",
    inter: "Réserve de biosphère de l'UNESCO" },
  { id: "lufira", nom: "Réserve de biosphère de la Lufira", court: "Lufira", type: "biosphere", provinces: ["Haut-Katanga"], cree: 1982, lat: -11.0, lon: 27.3,
    faune: "savanes boisées (miombo) de la vallée de la Lufira",
    indice: "La réserve de biosphère des savanes boisées du Haut-Katanga",
    inter: "Réserve de biosphère de l'UNESCO" },
];

export const TYPES_SITES = {
  parc: { l: "Parc national", col: "#15803D", ico: "trees" },
  reserve: { l: "Réserve de faune", col: "#B7791F", ico: "paw" },
  ramsar: { l: "Site Ramsar", col: "#0E7490", ico: "droplet" },
  biosphere: { l: "Réserve de biosphère", col: "#7C3AED", ico: "leaf" },
};

export const SITES = BRUT.map(s => ({ ...s, c: projeter(s.lat, s.lon) }));
export const SITES_UNESCO = SITES.filter(s => s.unesco).sort((a, b) => a.unesco - b.unesco);
export const SOURCE_SITES = "Positions approximatives (centre des sites) ; statuts d'après l'ICCN, l'UNESCO et la Convention de Ramsar.";

// ── Jeu « Où se trouve… ? » (tests psychotechniques) : 4 niveaux, minuteur par question ──
// reperes : les points des sites sont affichés (il faut toucher le bon) ; sinon, toucher l'endroit (rayon de tolérance).
export const NIVEAUX_PARCS = [
  { id: "facile", label: "Facile", n: 6, parQ: 20, reperes: true, limites: true, demande: "nom", col: "#15803D", ico: "mood-smile",
    d: "6 sites, 20 secondes chacun. Les points des sites sont affichés : touchez le bon." },
  { id: "moyen", label: "Moyen", n: 10, parQ: 15, reperes: true, limites: true, demande: "nom", col: "#1E4FA3", ico: "gauge",
    d: "10 sites, 15 secondes chacun. Les points des sites sont affichés." },
  { id: "difficile", label: "Difficile", n: 12, parQ: 12, reperes: false, limites: true, demande: "nom", col: "#B7791F", ico: "flame",
    d: "12 sites, 12 secondes chacun, sans les points : touchez l'endroit, sur la carte des provinces." },
  { id: "tresdiff", label: "Très difficile", n: 14, parQ: 10, reperes: false, limites: false, demande: "indice", col: "#A3122A", ico: "bolt",
    d: "Les 14 sites décrits par un indice (« le parc des bonobos… »), 10 secondes chacun, sur le seul contour du pays." },
];
export const RAYON_SITE = 75; // tolérance (unités de la carte, environ 160 km) quand les points ne sont pas affichés
export const distanceSite = (s, x, y) => Math.hypot(s.c[0] - x, s.c[1] - y);
export const siteLePlusProche = (x, y) => SITES.reduce((m, s) => (distanceSite(s, x, y) < distanceSite(m, x, y) ? s : m), SITES[0]);
export const tirageSites = (niveau, alea = Math.random) => SITES.map(s => [alea(), s.id]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, niveau.n);
