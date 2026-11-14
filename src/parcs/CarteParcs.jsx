import React,{useState}from"react";
import{PROVINCES,LARGEUR,HAUTEUR}from"../psycho/carteRdc";
import{CHEMIN,CHEMIN_PAYS}from"../psycho/puzzle";
import{SITES,TYPES_SITES,SOURCE_SITES}from"./sites";

// ══════════════════ CARTE INTERACTIVE DES PARCS ET SITES PROTÉGÉS (schéma « carteParcs ») ══════════════════
// Un point par site, coloré selon son type ; toucher un point affiche sa fiche.

export function FondCarte({K,limites=true}){
  return <>
    <path d={CHEMIN_PAYS} fill={K.c2}/>
    {limites&&PROVINCES.map(p=><path key={p.nom} d={CHEMIN[p.nom]} fill="none" stroke={K.t3} strokeWidth={1.4} opacity={.55}/>)}
    <path d={CHEMIN_PAYS} fill="none" stroke="#0A2A5C" strokeWidth={4} strokeLinejoin="round"/>
  </>;
}

export function Repere({s,col,actif,mob,etiquette,onClick}){
  const r=(mob?17:12)*(actif?1.25:1);
  return <g onClick={onClick} style={{cursor:onClick?"pointer":"default"}}>
    {actif&&<circle cx={s.c[0]} cy={s.c[1]} r={r+9} fill={col} opacity={.25}/>}
    <circle cx={s.c[0]} cy={s.c[1]} r={r} fill={col} stroke="#fff" strokeWidth={mob?4:3}/>
    {etiquette&&<text x={s.c[0]} y={s.c[1]-r-8} textAnchor="middle" fontSize={mob?26:18} fontWeight={800} fill="#0B1730" stroke="#fff" strokeWidth={mob?6:5} paintOrder="stroke" style={{pointerEvents:"none",fontFamily:"'Outfit',sans-serif"}}>{etiquette}</text>}
  </g>;
}

export function FicheSite({K,s}){
  const t=TYPES_SITES[s.type];
  return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderLeft:`4px solid ${t.col}`,borderRadius:12,padding:"10px 12px"}}>
    <div style={{fontSize:11.5,fontWeight:800,color:t.col,textTransform:"uppercase",letterSpacing:.5}}><i className={`ti ti-${t.ico}`} style={{marginRight:4}}/>{t.l}{s.unesco?" · Patrimoine mondial":""}</div>
    <div style={{fontWeight:900,fontSize:15.5,color:K.t1,margin:"3px 0"}}>{s.nom}</div>
    <div style={{fontSize:13,color:K.t2,lineHeight:1.55}}>
      <b>{s.provinces.length>1?"Provinces":"Province"} :</b> {s.provinces.join(", ")} · <b>{s.type==="ramsar"?"Inscrit":s.type==="biosphere"?"Désignée":"Créé"} en</b> {s.cree}{s.km2?<> · <b>environ {s.km2.toLocaleString("fr-FR").replace(/[  ]/g," ")} km²</b></>:null}
      <div style={{marginTop:3}}>{s.faune.charAt(0).toUpperCase()+s.faune.slice(1)}.</div>
      {s.inter&&<div style={{marginTop:3,color:K.t1}}><i className="ti ti-world" style={{marginRight:4,color:t.col}}/>{s.inter}{s.unesco?` (inscrit en ${s.unesco})`:""}.</div>}
    </div>
  </div>;
}

function CarteParcs({K,mob:m}){
  const mob=m??(typeof window!=="undefined"&&window.innerWidth<700); // le schéma est rendu par Bloc, sans l'indication « mobile »
  const[sel,sSel]=useState("virunga");
  const s=SITES.find(x=>x.id===sel);
  return <div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
      {Object.entries(TYPES_SITES).map(([k,t])=><span key={k} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:K.t2}}>
        <span style={{width:11,height:11,borderRadius:"50%",background:t.col,display:"inline-block"}}/>{t.l}</span>)}
    </div>
    <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label="Carte des parcs et sites protégés de la RDC">
      <FondCarte K={K}/>
      {SITES.filter(x=>x.id!==sel).map(x=><Repere key={x.id} s={x} col={TYPES_SITES[x.type].col} mob={mob} onClick={()=>sSel(x.id)}/>)}
      {s&&<Repere s={s} col={TYPES_SITES[s.type].col} mob={mob} actif etiquette={s.court}/>}
    </svg>
    {s&&<div style={{marginTop:8}}><FicheSite K={K} s={s}/></div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
      {SITES.map(x=><button key={x.id} onClick={()=>sSel(x.id)} className="bt" style={{fontSize:12,fontWeight:700,borderRadius:99,padding:"5px 10px",cursor:"pointer",fontFamily:"'Outfit',sans-serif",
        background:x.id===sel?TYPES_SITES[x.type].col:K.card,color:x.id===sel?"#fff":K.t2,border:`1px solid ${x.id===sel?TYPES_SITES[x.type].col:K.b1}`}}>{x.court}</button>)}
    </div>
    <div style={{fontSize:11.5,color:K.t3,marginTop:6}}>{SOURCE_SITES}</div>
  </div>;
}

export const SCHEMAS_PARCS={carteParcs:CarteParcs};
