import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{LARGEUR,HAUTEUR}from"../psycho/carteRdc";
import{fmtDuree}from"../psycho/puzzle";
import{SITES,TYPES_SITES,SOURCE_SITES,NIVEAUX_PARCS,RAYON_SITE,distanceSite,siteLePlusProche,tirageSites}from"./sites";
import{FondCarte,Repere,FicheSite}from"./CarteParcs";

// ══════════════════ TEST PSYCHOTECHNIQUE : « OÙ SE TROUVE… ? » — PARCS ET SITES PROTÉGÉS ══════════════════
// Un site est demandé (par son nom, ou par un indice au niveau Très difficile) : le toucher avant la fin du minuteur.
// Niveaux Facile et Moyen : les points des sites sont affichés ; Difficile et Très difficile : toucher l'endroit.

const PAUSE=1700,VERT="#16A34A",ROUGE="#DC2626",NEUTRE="#475569";
const PAR_ID=Object.fromEntries(SITES.map(s=>[s.id,s]));

export default function OuParcs({K,mob,niveauId,onFin,onQuitter}){
  const niveau=NIVEAUX_PARCS.find(n=>n.id===niveauId)||NIVEAUX_PARCS[0];
  const[partie,sPartie]=useState(0);
  const questions=useMemo(()=>tirageSites(niveau),[niveau,partie]);
  const[i,sI]=useState(0),[rep,sRep]=useState([]),[tQ,sTQ]=useState(niveau.parQ),[corrige,sCorrige]=useState(null),[fin,sFin]=useState(false),[fiche,sFiche]=useState(null);
  const svgRef=useRef(null),finRef=useRef(false),debut=useRef(Date.now()),debutQ=useRef(Date.now());
  const id=questions[i],site=PAR_ID[id];

  useEffect(()=>{sI(0);sRep([]);sTQ(niveau.parQ);sCorrige(null);sFin(false);sFiche(null);finRef.current=false;debut.current=Date.now();debutQ.current=Date.now();},[questions,niveau]);

  const terminer=useCallback(liste=>{
    if(finRef.current)return;finRef.current=true;sFin(true);
    const bonnes=liste.filter(r=>r.ok).length;
    onFin&&onFin({cle:`parcs-${niveau.id}`,niveauLabel:`Parcs de la RDC · ${niveau.label}`,score:bonnes,total:questions.length,erreurs:questions.length-bonnes,
      pct:questions.length?Math.round(100*bonnes/questions.length):0,duree:Math.round((Date.now()-debut.current)/1000)});
  },[niveau,questions,onFin]);

  const repondre=useCallback((ok,touche,tempsEcoule)=>{
    if(corrige||fin)return;
    const r={id,ok,touche,tempsEcoule,s:Math.round((Date.now()-debutQ.current)/100)/10};
    const liste=[...rep,r];sRep(liste);sCorrige(r);
    setTimeout(()=>{
      sCorrige(null);
      if(i+1>=questions.length)terminer(liste);
      else{sI(i+1);sTQ(niveau.parQ);debutQ.current=Date.now();}
    },PAUSE);
  },[corrige,fin,id,rep,i,questions.length,niveau.parQ,terminer]);

  useEffect(()=>{
    if(fin||corrige)return;
    if(tQ<=0){repondre(false,null,true);return;}
    const t=setTimeout(()=>sTQ(s=>s-1),1000);return()=>clearTimeout(t);
  },[tQ,fin,corrige,repondre]);

  const toucher=e=>{
    if(corrige||fin)return;
    const s=svgRef.current;if(!s)return;
    const b=s.getBoundingClientRect(),x=(e.clientX-b.left)*LARGEUR/b.width,y=(e.clientY-b.top)*HAUTEUR/b.height,unite=LARGEUR/b.width;
    if(niveau.reperes){
      const p=siteLePlusProche(x,y);
      if(distanceSite(p,x,y)>Math.max(40,26*unite))return; // à côté de tout point : on ignore
      repondre(p.id===id,p.id,false);
    }else{
      repondre(distanceSite(site,x,y)<=RAYON_SITE,{x,y},false);
    }
  };

  const carte={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16};
  const bouton=p=>({background:p?`linear-gradient(135deg,${K.emD},${K.em})`:K.c2,color:p?"#fff":K.t1,border:p?"none":`1px solid ${K.b1}`,borderRadius:11,padding:"10px 15px",fontWeight:800,fontSize:13.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6,minHeight:42});

  // ── Fin de partie ──
  if(fin){
    const bonnes=rep.filter(r=>r.ok).length,pct=Math.round(100*bonnes/questions.length);
    const justes=rep.filter(r=>r.ok),moy=justes.length?Math.round(justes.reduce((a,r)=>a+r.s,0)/justes.length*10)/10:null;
    const ratees=rep.filter(r=>!r.ok),f=fiche&&PAR_ID[fiche];
    return <div style={{maxWidth:900,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      <div style={{...carte,padding:mob?"18px 16px":"22px 24px",marginBottom:14,textAlign:"center"}}>
        <i className="ti ti-trophy" style={{fontSize:34,color:pct>=70?K.em:pct>=40?K.wa:K.er}}/>
        <div style={{fontSize:mob?30:36,fontWeight:900,color:K.t1,margin:"4px 0"}}>{pct} %</div>
        <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6}}>{bonnes} / {questions.length} sites trouvés{moy!=null?` · ${String(moy).replace(".",",")} s en moyenne`:""} · niveau {niveau.label}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
          <button onClick={()=>sPartie(x=>x+1)} className="bt" style={bouton(true)}><i className="ti ti-arrow-back-up"/>Rejouer</button>
          <button onClick={onQuitter} className="bt" style={bouton(false)}><i className="ti ti-layout-grid"/>Autres tests</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"minmax(0,1fr)":"minmax(0,1.3fr) minmax(0,1fr)",gap:14,alignItems:"start"}}>
        <div style={{...carte,padding:10}}>
          <div style={{fontSize:12.5,color:K.t3,marginBottom:6,textAlign:"center"}}>Touchez un point pour revoir le site.</div>
          <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label="Carte des parcs et sites protégés de la RDC">
            <FondCarte K={K}/>
            {SITES.map(s=><Repere key={s.id} s={s} col={TYPES_SITES[s.type].col} mob={mob} actif={s.id===fiche} etiquette={s.id===fiche||!mob?s.court:null} onClick={()=>sFiche(s.id)}/>)}
          </svg>
          {f&&<div style={{marginTop:8}}><FicheSite K={K} s={f}/></div>}
        </div>
        <div style={{...carte,padding:"12px 14px"}}>
          <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}><i className="ti ti-map-pin" style={{marginRight:6,color:ratees.length?K.wa:K.em}}/>{ratees.length?`À revoir (${ratees.length})`:"Aucune erreur : bravo !"}</div>
          {ratees.map((r,k)=>{const s=PAR_ID[r.id];return <button key={k} onClick={()=>sFiche(s.id)} className="bt" style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",borderBottom:`1px solid ${K.b0}`,padding:"7px 0",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            <div style={{fontSize:13.5,color:K.t1,fontWeight:800}}>{s.court} <span style={{fontWeight:500,color:K.t3}}>· {s.provinces.join(", ")}</span></div>
            <div style={{fontSize:12.5,color:K.er}}>{r.tempsEcoule?"Temps écoulé":r.touche&&typeof r.touche==="string"?`Vous avez touché : ${PAR_ID[r.touche].court}`:"Trop loin du site"}</div></button>;})}
        </div>
      </div>
      <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_SITES}</div>
    </div>;
  }

  // ── Question en cours ──
  const low=tQ<=3,touche=corrige&&corrige.touche;
  return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
      <button onClick={()=>{if(window.confirm("Quitter le test ? La partie ne sera pas enregistrée."))onQuitter();}} className="bt" style={{...bouton(false),minHeight:36,padding:"7px 11px"}}><i className="ti ti-arrow-left"/></button>
      <div style={{flex:1,minWidth:140}}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1}}>Parcs de la RDC · {niveau.label}</div>
        <div style={{fontSize:12.5,color:K.t3}}>Site {Math.min(i+1,questions.length)} / {questions.length} · {rep.filter(r=>r.ok).length} trouvé{rep.filter(r=>r.ok).length>1?"s":""} · {fmtDuree(Math.round((Date.now()-debut.current)/1000))}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,background:low?K.rdBg:K.c2,border:`1px solid ${low?K.rdBd:K.b0}`,borderRadius:10,padding:"7px 11px",minWidth:62,justifyContent:"center"}}>
        <i className="ti ti-clock" style={{fontSize:14,color:low?K.rd:K.t2}}/><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:800,color:low?K.rd:K.t1}}>{Math.max(0,tQ)} s</span></div>
    </div>
    <div style={{height:6,background:K.c2,borderRadius:99,overflow:"hidden",marginBottom:10}} aria-label="Temps restant pour ce site">
      <div style={{width:`${corrige?0:Math.max(0,tQ)/niveau.parQ*100}%`,height:"100%",background:low?K.rd:niveau.col,transition:"width 1s linear"}}/></div>

    <div style={{...carte,padding:"12px 14px",marginBottom:10,textAlign:"center",background:corrige?(corrige.ok?K.emBg:K.erBg):K.card,border:`1px solid ${corrige?(corrige.ok?K.emBd:K.erBd):K.b0}`}}>
      {!corrige?<div style={{fontSize:mob?16.5:18.5,color:K.t1,lineHeight:1.4}}><i className="ti ti-map-search" style={{marginRight:6,color:niveau.col}}/>
          Touchez {niveau.demande==="indice"?<b>{site.indice.charAt(0).toLowerCase()+site.indice.slice(1)}</b>:<b>{site.nom}</b>}</div>
        :<div style={{fontSize:mob?15:16.5,fontWeight:800,color:corrige.ok?K.em:K.er}}>
          {corrige.ok?`✓ Exact : ${site.court} (${site.provinces.join(", ")})`:corrige.tempsEcoule?`⏱ Temps écoulé : c'était ${site.court}, en vert`:typeof touche==="string"?`✗ Non, ici c'est ${PAR_ID[touche].court} ; ${site.court} est en vert`:`✗ Trop loin : ${site.court} est en vert`}</div>}
    </div>
    <div style={{...carte,padding:mob?6:10}}>
      <svg ref={svgRef} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} onClick={toucher} style={{width:"100%",height:"auto",display:"block",cursor:"crosshair",touchAction:"manipulation"}} role="img" aria-label="Carte de la RDC">
        <FondCarte K={K} limites={niveau.limites}/>
        {niveau.reperes&&SITES.filter(s=>!corrige||(s.id!==corrige.id&&s.id!==touche)).map(s=><Repere key={s.id} s={s} col={NEUTRE} mob={mob}/>)}
        {corrige&&typeof touche==="string"&&!corrige.ok&&<Repere s={PAR_ID[touche]} col={ROUGE} mob={mob} etiquette={PAR_ID[touche].court}/>}
        {corrige&&touche&&typeof touche==="object"&&<circle cx={touche.x} cy={touche.y} r={mob?16:12} fill={ROUGE} stroke="#fff" strokeWidth={3}/>}
        {corrige&&!niveau.reperes&&<circle cx={site.c[0]} cy={site.c[1]} r={RAYON_SITE} fill={VERT} opacity={.15}/>}
        {corrige&&<Repere s={site} col={VERT} mob={mob} actif etiquette={site.court}/>}
      </svg>
    </div>
    <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_SITES}</div>
  </div>;
}
