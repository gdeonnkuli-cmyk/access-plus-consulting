import React from"react";
import ParcoursModules from"../parcours/ParcoursModules";
import{texteModuleBanque}from"../audio/lecture";
import{MODULES_BQ}from"./modules";
import{cleBq}from"../attest/regles";

// ══════════════════ COMPTABILITÉ BANCAIRE (GCEC — BCC) : PARCOURS PROGRESSIF ══════════════════
// Page commune : src/parcours/ParcoursModules.jsx. Scores : users/{uid}.scores["BQ-B1"…] et ["BQ-FINAL"].
export const CFG_BQ = {
  id: "BANQUE", modules: MODULES_BQ, cle: cleBq, audio: texteModuleBanque, nom: "Le parcours Comptabilité bancaire", libre: "B1",
  hero: { fond: "linear-gradient(135deg,#001433,#0A2A5C 55%,#15803D)", ico: "building-bank", kicker: "Comptabilité bancaire",
    titre: "Comptabilité bancaire en RDC (GCEC de la BCC)",
    texte: "Le Guide comptable des établissements de crédit de la Banque Centrale du Congo en 10 modules : plan de comptes, dépôts et crédits, compensation, trésorerie et BCC, titres, devises, hors-bilan, créances en souffrance, PNB et reporting, états financiers et analyse d'une banque, avec schémas, cours audio et évaluation." },
  source: "Contenu pédagogique fondé sur le Guide comptable des établissements de crédit (GCEC) de la Banque Centrale du Congo, volumes 1 et 2, version de décembre 2007, et la loi bancaire n° 003/2002. Vérifier les instructions de la BCC publiées depuis, notamment pour les taux de provisionnement et les états prudentiels.",
};
export default function Banque(props){return <ParcoursModules cfg={CFG_BQ} {...props}/>;}
