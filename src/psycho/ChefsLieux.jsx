import React from"react";
import{PAR_NOM}from"./puzzle";

// Côté de l'étiquette : à droite par défaut ; à gauche près de la frontière est ou d'une ville voisine ; dessous pour Mbuji-Mayi
const COTE={Bunia:"g",Goma:"g",Bukavu:"g",Kalemie:"g",Kananga:"g",Tshikapa:"g","Mbuji-Mayi":"b"};

// Points des chefs-lieux sur la carte (coordonnées c de carteRdc.js), avec le nom de la ville en option.
export function PointsChefsLieux({noms,etiquettes=false,mob}){
  const r=mob?10:7,fs=mob?25:17;
  return <g style={{pointerEvents:"none"}}>
    {noms.map(n=>{const p=PAR_NOM[n];return <g key={n}>
      <circle cx={p.c[0]} cy={p.c[1]} r={r} fill="#fff" stroke="#0B1730" strokeWidth={mob?4:3}/>
      <circle cx={p.c[0]} cy={p.c[1]} r={r*.35} fill="#0B1730"/>
      {etiquettes&&<text x={COTE[p.chef]==="g"?p.c[0]-r-4:COTE[p.chef]==="b"?p.c[0]:p.c[0]+r+4} y={COTE[p.chef]==="b"?p.c[1]+r+fs*.75:p.c[1]} textAnchor={COTE[p.chef]==="g"?"end":COTE[p.chef]==="b"?"middle":"start"} dominantBaseline="middle" fontSize={fs} fontWeight={800} fontStyle="italic" fill="#0B1730" stroke="#fff" strokeWidth={mob?6:5} paintOrder="stroke" style={{fontFamily:"'Outfit',sans-serif"}}>{p.chef}</text>}
    </g>;})}
  </g>;
}

// Bascule des noms affichés sur la carte finale : provinces ou chefs-lieux
export function ChoixNoms({K,valeur,onChange}){
  return <div style={{display:"inline-flex",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,padding:3,gap:2}} role="group" aria-label="Noms affichés sur la carte">
    {[["prov","Provinces"],["chef","Chefs-lieux"]].map(([k,l])=><button key={k} onClick={()=>onChange(k)} aria-pressed={valeur===k} className="bt"
      style={{border:"none",borderRadius:99,padding:"6px 13px",fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif",background:valeur===k?K.card:"transparent",color:valeur===k?K.t1:K.t3,boxShadow:valeur===k?K.sh:"none"}}>{l}</button>)}
  </div>;
}
