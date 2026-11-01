import React from"react";
import ParcoursModules from"../parcours/ParcoursModules";
import{texteModuleSycebnl}from"../audio/lecture";
import{MODULES_SYC}from"./modules";
import{cleSyc}from"../attest/regles";

// ══════════════════ SYCEBNL : PARCOURS PROGRESSIF (8 modules, examen final, certificat) ══════════════════
// Page commune : src/parcours/ParcoursModules.jsx. Scores : users/{uid}.scores["SYC-SB1"…] et ["SYC-FINAL"].
export const CFG_SYC = {
  id: "SYCEBNL", modules: MODULES_SYC, cle: cleSyc, audio: texteModuleSycebnl, nom: "Le parcours SYCEBNL", libre: "SB1",
  hero: { fond: "linear-gradient(135deg,#053B36,#0F766E 55%,#B7791F)", ico: "building-community", kicker: "SYCEBNL",
    titre: "Comptabilité des entités à but non lucratif (SYCEBNL)",
    texte: "Associations, ONG, fondations, églises et projets : 8 modules avec schémas, cours audio et évaluation." },
  source: "Contenu pédagogique fondé sur l'Acte uniforme OHADA relatif au SYCEBNL (2022) et son guide d'application (2023). Pour la saisie réelle, vérifier chaque numéro dans le plan de comptes officiel.",
};
export default function Sycebnl(props){return <ParcoursModules cfg={CFG_SYC} {...props}/>;}
