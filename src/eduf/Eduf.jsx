import React from"react";
import ParcoursModules from"../parcours/ParcoursModules";
import{texteModuleEduf}from"../audio/lecture";
import{MODULES_EDUF}from"./modules";
import{cleEf}from"../attest/regles";

// ══════════════════ ÉDUCATION FINANCIÈRE (GRAND PUBLIC) : PARCOURS PROGRESSIF ══════════════════
// Page commune : src/parcours/ParcoursModules.jsx. Scores : users/{uid}.scores["EF-EF1"…] et ["EF-FINAL"].
// EF1 à EF3 sont en accès libre (champ libre des modules) ; simulateurs de budget, de crédit et d'épargne dans les leçons.
export const CFG_EF = {
  id: "EDUF", modules: MODULES_EDUF, cle: cleEf, audio: texteModuleEduf, nom: "Le parcours Éducation financière", libre: "EF1",
  libreTexte: <>Les modules <b>EF1</b>, <b>EF2</b> et <b>EF3</b> sont en accès libre.</>,
  hero: { fond: "linear-gradient(135deg,#052E16,#15803D 55%,#B7791F)", ico: "pig-money", kicker: "Éducation financière",
    titre: "Bien gérer son argent en RDC",
    texte: "Budget, épargne, Mobile Money, crédit, dollar et franc congolais, assurances, arnaques et projets d'avenir : 8 modules pour tous, avec des simulateurs, des exemples en francs congolais et des cours audio." },
  source: "Contenu pédagogique fondé sur les principes de gestion financière personnelle, adapté au contexte congolais. Les frais, taux et cours de change des exemples sont des hypothèses : renseignez-vous auprès de votre banque, de votre coopérative ou de votre opérateur. Ce parcours ne constitue pas un conseil financier personnalisé.",
};
export default function Eduf(props){return <ParcoursModules cfg={CFG_EF} {...props}/>;}
