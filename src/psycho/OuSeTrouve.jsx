import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{PROVINCES,LARGEUR,HAUTEUR,SOURCE_CARTE}from"./carteRdc";
import{PointsChefsLieux,ChoixNoms}from"./ChefsLieux";
import{NIVEAUX_OU,bienPlacee,provinceEn,tirageOu,COL,PAR_NOM,CHEMIN,CHEMIN_PAYS,fmtDuree}from"./puzzle";

// ══════════════════ TEST PSYCHOTECHNIQUE : « OÙ SE TROUVE… ? » (CARTE DE LA RDC) ══════════════════
// Une province est demandée (par son nom, ou par son chef-lieu au niveau Très difficile) : la toucher sur la carte
// avant la fin du minuteur de la question. Après chaque réponse, la bonne province est montrée.
// Score : bonnes réponses / questions ; enregistré par la page des tests (onFin).

const PAUSE=1400;
const VERT="#16A34A",ROUGE="#DC2626"; // affichage du corrigé avant la question suivante (ms)

export default function OuSeTrouve({K,mob,niveauId,onFin,onQuitter}){
  const niveau=NIVEAUX_OU.find(n=>n.id===niveauId)||NIVEAUX_OU[0];
  const[partie,sPartie]=useState(0),[noms,sNoms]=useState("prov"); // noms sur la carte finale : provinces ou chefs-lieux
  const questions=useMemo(()=>tirageOu(niveau),[niveau,partie]);
  const[i,sI]=useState(0),[rep,sRep]=useState([]),[tQ,sTQ]=useState(niveau.parQ),[corrige,sCorrige]=useState(null),[fin,sFin]=useState(false);
  const svgRef=useRef(null),finRef=useRef(false),debut=useRef(Date.now()),debutQ=useRef(Date.now());
  const nom=questions[i];

  useEffect(()=>{sI(0);sRep([]);sTQ(niveau.parQ);sCorrige(null);sFin(false);finRef.current=false;debut.current=Date.now();debutQ.current=Date.now();},[questions,niveau]);

  const terminer=useCallback(liste=>{
    if(finRef.current)return;finRef.current=true;sFin(true);
    const bonnes=liste.filter(r=>r.ok).length;
    onFin&&onFin({cle:`ou-${niveau.id}`,niveauLabel:`Où se trouve ? · ${niveau.label}`,score:bonnes,total:questions.length,erreurs:questions.length-bonnes,
      pct:questions.length?Math.round(100*bonnes/questions.length):0,duree:Math.round((Date.now()-debut.current)/1000)});
  },[niveau,questions,onFin]);

  // Réponse (touchee : province touchée, ou null si le temps est écoulé)
  const repondre=useCallback((ok,touchee,tempsEcoule)=>{
    if(corrige||fin)return;
    const r={nom,ok,touchee,tempsEcoule,s:Math.round((Date.now()-debutQ.current)/100)/10};
    const liste=[...rep,r];sRep(liste);sCorrige(r);
    setTimeout(()=>{
      sCorrige(null);
      if(i+1>=questions.length)terminer(liste);
      else{sI(i+1);sTQ(niveau.parQ);debutQ.current=Date.now();}
    },PAUSE);
  },[corrige,fin,nom,rep,i,questions.length,niveau.parQ,terminer]);

  // Minuteur de la question
  useEffect(()=>{
    if(fin||corrige)return;
    if(tQ<=0){repondre(false,null,true);return;}
    const t=setTimeout(()=>sTQ(s=>s-1),1000);return()=>clearTimeout(t);
  },[tQ,fin,corrige,repondre]);

  const toucher=e=>{
    if(corrige||fin)return;
    const s=svgRef.current;if(!s)return;
    const r=s.getBoundingClientRect(),x=(e.clientX-r.left)*LARGEUR/r.width,y=(e.clientY-r.top)*HAUTEUR/r.height,unite=LARGEUR/r.width;
    const touchee=provinceEn(x,y);
    if(!touchee&&!bienPlacee(PAR_NOM[nom],x,y,10*unite))return; // hors du pays : on ignore le toucher
    const ok=bienPlacee(PAR_NOM[nom],x,y,touchee?0:10*unite)||(touchee&&touchee.nom===nom);
    repondre(!!ok,touchee?touchee.nom:null,false);
  };

  const carte={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16};
  const bouton=p=>({background:p?`linear-gradient(135deg,${K.emD},${K.em})`:K.c2,color:p?"#fff":K.t1,border:p?"none":`1px solid ${K.b1}`,borderRadius:11,padding:"10px 15px",fontWeight:800,fontSize:13.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6,minHeight:42});
  const demande=n=>niveau.etiquette==="chef"?<>la province dont le chef-lieu est <b>{PAR_NOM[n].chef}</b></>:<b>{n}</b>;

  const dessin=complete=><svg ref={complete?undefined:svgRef} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} onClick={complete?undefined:toucher}
    style={{width:"100%",height:"auto",display:"block",cursor:complete?"default":"crosshair",touchAction:"manipulation"}} role="img" aria-label="Carte de la République démocratique du Congo">
    <style>{`@keyframes ouClig{50%{opacity:.35}}`}</style>
    <path d={CHEMIN_PAYS} fill={K.c2}/>
    {(complete||niveau.cases)&&PROVINCES.map(p=><path key={p.nom} d={CHEMIN[p.nom]} fill={complete?COL[p.nom]:"none"} stroke={complete?"#fff":K.t3} strokeWidth={complete?2.2:1.6} opacity={complete?1:.75}/>)}
    {!complete&&corrige&&corrige.touchee&&!corrige.ok&&<path d={CHEMIN[corrige.touchee]} fill={`${ROUGE}55`} stroke={ROUGE} strokeWidth={3}/>}
    {!complete&&corrige&&<path d={CHEMIN[corrige.nom]} fill={`${VERT}${corrige.ok?"CC":"99"}`} stroke={VERT} strokeWidth={4} style={{animation:corrige.ok?"none":"ouClig .5s ease-in-out 2"}}/>}
    <path d={CHEMIN_PAYS} fill="none" stroke="#0A2A5C" strokeWidth={4} strokeLinejoin="round"/>
    {complete&&noms==="prov"&&PROVINCES.map(p=><text key={p.nom} x={p.l[0]} y={p.l[1]} textAnchor="middle" dominantBaseline="middle" fontSize={mob?24:17} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,.45)" strokeWidth={mob?5:4} paintOrder="stroke" style={{pointerEvents:"none",fontFamily:"'Outfit',sans-serif"}}>{p.nom}</text>)}
    {complete&&<PointsChefsLieux mob={mob} noms={PROVINCES.map(p=>p.nom)} etiquettes={noms==="chef"}/>}
    {!complete&&corrige&&(()=>{const p=PAR_NOM[corrige.nom];return <text x={p.l[0]} y={p.l[1]} textAnchor="middle" dominantBaseline="middle" fontSize={mob?30:22} fontWeight={800} fill="#fff" stroke="rgba(0,0,0,.55)" strokeWidth={6} paintOrder="stroke" style={{pointerEvents:"none",fontFamily:"'Outfit',sans-serif"}}>{p.nom}</text>;})()}
    {!complete&&corrige&&<PointsChefsLieux mob={mob} noms={[corrige.nom]} etiquettes/>}
  </svg>;

  // ── Fin de partie ──
  if(fin){
    const bonnes=rep.filter(r=>r.ok).length,pct=rep.length?Math.round(100*bonnes/questions.length):0;
    const justes=rep.filter(r=>r.ok),moy=justes.length?Math.round(justes.reduce((a,r)=>a+r.s,0)/justes.length*10)/10:null;
    const ratees=rep.filter(r=>!r.ok);
    return <div style={{maxWidth:900,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      <div style={{...carte,padding:mob?"18px 16px":"22px 24px",marginBottom:14,textAlign:"center"}}>
        <i className="ti ti-trophy" style={{fontSize:34,color:pct>=70?K.em:pct>=40?K.wa:K.er}}/>
        <div style={{fontSize:mob?30:36,fontWeight:900,color:K.t1,margin:"4px 0"}}>{pct} %</div>
        <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6}}>{bonnes} / {questions.length} provinces trouvées{moy!=null?` · ${String(moy).replace(".",",")} s en moyenne`:""} · niveau {niveau.label}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
          <button onClick={()=>sPartie(x=>x+1)} className="bt" style={bouton(true)}><i className="ti ti-arrow-back-up"/>Rejouer</button>
          <button onClick={onQuitter} className="bt" style={bouton(false)}><i className="ti ti-layout-grid"/>Autres tests</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"minmax(0,1fr)":"minmax(0,1.3fr) minmax(0,1fr)",gap:14,alignItems:"start"}}>
        <div style={{...carte,padding:10}}><div style={{display:"flex",justifyContent:"center",marginBottom:8}}><ChoixNoms K={K} valeur={noms} onChange={sNoms}/></div>{dessin(true)}</div>
        <div style={{...carte,padding:"12px 14px"}}>
          <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}><i className="ti ti-map-pin" style={{marginRight:6,color:ratees.length?K.wa:K.em}}/>{ratees.length?`À revoir (${ratees.length})`:"Aucune erreur : bravo !"}</div>
          {ratees.map((r,k)=><div key={k} style={{fontSize:13.5,padding:"6px 0",borderBottom:`1px solid ${K.b0}`,lineHeight:1.45}}>
            <b style={{color:K.t1}}>{r.nom}</b><span style={{color:K.t3}}> · chef-lieu {PAR_NOM[r.nom].chef}</span>
            <div style={{fontSize:12.5,color:K.er}}>{r.tempsEcoule?"Temps écoulé":r.touchee?`Vous avez touché : ${r.touchee}`:"Mauvais emplacement"}</div></div>)}
        </div>
      </div>
      <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_CARTE}</div>
    </div>;
  }

  // ── Question en cours ──
  const low=tQ<=3;
  return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
      <button onClick={()=>{if(window.confirm("Quitter le test ? La partie ne sera pas enregistrée."))onQuitter();}} className="bt" style={{...bouton(false),minHeight:36,padding:"7px 11px"}}><i className="ti ti-arrow-left"/></button>
      <div style={{flex:1,minWidth:140}}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1}}>Où se trouve… ? · {niveau.label}</div>
        <div style={{fontSize:12.5,color:K.t3}}>Province {Math.min(i+1,questions.length)} / {questions.length} · {rep.filter(r=>r.ok).length} trouvée{rep.filter(r=>r.ok).length>1?"s":""} · {fmtDuree(Math.round((Date.now()-debut.current)/1000))}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,background:low?K.rdBg:K.c2,border:`1px solid ${low?K.rdBd:K.b0}`,borderRadius:10,padding:"7px 11px",minWidth:62,justifyContent:"center"}}>
        <i className="ti ti-clock" style={{fontSize:14,color:low?K.rd:K.t2}}/><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:800,color:low?K.rd:K.t1}}>{Math.max(0,tQ)} s</span></div>
    </div>
    <div style={{height:6,background:K.c2,borderRadius:99,overflow:"hidden",marginBottom:10}} aria-label="Temps restant pour cette province">
      <div style={{width:`${corrige?0:Math.max(0,tQ)/niveau.parQ*100}%`,height:"100%",background:low?K.rd:niveau.col,transition:"width 1s linear"}}/></div>

    <div style={{...carte,padding:"12px 14px",marginBottom:10,textAlign:"center",background:corrige?(corrige.ok?K.emBg:K.erBg):K.card,border:`1px solid ${corrige?(corrige.ok?K.emBd:K.erBd):K.b0}`}}>
      {!corrige?<div style={{fontSize:mob?17:19,color:K.t1,lineHeight:1.4}}><i className="ti ti-map-search" style={{marginRight:6,color:niveau.col}}/>Touchez {demande(nom)}</div>
        :<div style={{fontSize:mob?15.5:17,fontWeight:800,color:corrige.ok?K.em:K.er}}>
          {corrige.ok?`✓ Exact : ${corrige.nom} (chef-lieu ${PAR_NOM[corrige.nom].chef})`:corrige.tempsEcoule?`⏱ Temps écoulé : c'était ${corrige.nom}`:`✗ Non, ici c'est ${corrige.touchee||"hors province"} ; ${corrige.nom} clignote en vert`}</div>}
    </div>
    <div style={{...carte,padding:mob?6:10}}>{dessin(false)}</div>
    <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_CARTE}</div>
  </div>;
}
