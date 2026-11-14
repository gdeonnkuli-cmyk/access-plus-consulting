import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{PROVINCES,PAYS,LARGEUR,HAUTEUR,SOURCE_CARTE}from"./carteRdc";
import{NIVEAUX_CARTE,bienPlacee,provinceEn,cadre,chemin,tirage,scoreCarte}from"./puzzle";

// ══════════════════ TEST PSYCHOTECHNIQUE : PUZZLE DE LA CARTE DE LA RDC ══════════════════
// Placer les provinces sur la carte (raisonnement spatial et connaissance du pays), chronométré.
// Téléphone : toucher une pièce, puis son emplacement sur la carte. Ordinateur : toucher ou glisser-déposer.
// Score : pièces bien placées, pénalisées par les erreurs (scoreCarte) ; enregistré par la page des tests (onFin).

const COULEURS=["#1E4FA3","#0D7A6B","#B7791F","#A3122A","#7C3AED","#0E7490","#15803D","#C2410C"];
const COL=Object.fromEntries(PROVINCES.map((p,i)=>[p.nom,COULEURS[i%COULEURS.length]]));
const PAR_NOM=Object.fromEntries(PROVINCES.map(p=>[p.nom,p]));
const CHEMIN=Object.fromEntries(PROVINCES.map(p=>[p.nom,chemin(p)]));
const CHEMIN_PAYS=PAYS.map(r=>"M"+r.reduce((s,v,i)=>s+(i%2?","+v:(i?"L":"")+v),"")+"Z").join("");
const fmt=s=>`${Math.floor(s/60)}:${String(Math.max(0,s%60)).padStart(2,"0")}`;

function Miniature({nom,col,taille=54}){
  const c=cadre(PAR_NOM[nom]),m=Math.max(c.w,c.h)*.08;
  return <svg viewBox={`${c.x0-m} ${c.y0-m} ${c.w+2*m} ${c.h+2*m}`} width={taille} height={taille} style={{display:"block"}} aria-hidden="true">
    <path d={CHEMIN[nom]} fill={col} stroke="#fff" strokeWidth={Math.max(c.w,c.h)/40}/></svg>;
}

export default function PuzzleCarte({K,mob,niveauId,onFin,onQuitter}){
  const niveau=NIVEAUX_CARTE.find(n=>n.id===niveauId)||NIVEAUX_CARTE[0];
  const[partie,sPartie]=useState(0);
  const jeu=useMemo(()=>tirage(niveau),[niveau,partie]);
  const[posees,sPosees]=useState([]),[sel,sSel]=useState(null),[erreurs,sErreurs]=useState(0),[errPiece,sErrPiece]=useState({});
  const[tLeft,sTLeft]=useState(niveau.dur),[fin,sFin]=useState(false),[msg,sMsg]=useState(null),[flash,sFlash]=useState(null),[drag,sDrag]=useState(null);
  const svgRef=useRef(null),finRef=useRef(false),debut=useRef(Date.now());
  const reste=jeu.aPlacer.filter(n=>!posees.includes(n));
  const total=jeu.aPlacer.length;
  const placees=new Set([...jeu.dejaPosees,...posees]);

  useEffect(()=>{sPosees([]);sSel(jeu.aPlacer[0]);sErreurs(0);sErrPiece({});sTLeft(niveau.dur);sFin(false);sMsg(null);finRef.current=false;debut.current=Date.now();},[jeu,niveau]);

  const terminer=useCallback((placees,errs)=>{
    if(finRef.current)return;finRef.current=true;sFin(true);sSel(null);
    const duree=Math.round((Date.now()-debut.current)/1000);
    onFin&&onFin({niveau:niveau.id,niveauLabel:`Puzzle carte RDC · ${niveau.label}`,score:placees,total,erreurs:errs,pct:scoreCarte(placees,total,errs),duree});
  },[niveau,total,onFin]);

  useEffect(()=>{
    if(fin)return;
    if(tLeft<=0){terminer(posees.length,erreurs);return;}
    const t=setTimeout(()=>sTLeft(s=>s-1),1000);return()=>clearTimeout(t);
  },[tLeft,fin,terminer,posees.length,erreurs]);

  // Coordonnées de la carte à partir d'un point de l'écran
  const versCarte=(cx,cy)=>{
    const s=svgRef.current;if(!s)return null;
    const r=s.getBoundingClientRect();
    if(cx<r.left||cx>r.right||cy<r.top||cy>r.bottom)return null;
    return{x:(cx-r.left)*LARGEUR/r.width,y:(cy-r.top)*HAUTEUR/r.height,unite:LARGEUR/r.width};
  };
  const tenter=(nom,cx,cy)=>{
    if(!nom||fin)return;
    const pt=versCarte(cx,cy);if(!pt)return;
    const p=PAR_NOM[nom];
    if(bienPlacee(p,pt.x,pt.y,12*pt.unite)){
      const np=[...posees,nom];sPosees(np);
      sMsg({ok:true,t:niveau.etiquette==="chef"?`${p.chef} est le chef-lieu du ${p.nom}.`:`${p.nom} : chef-lieu ${p.chef}.`});
      const suivant=jeu.aPlacer.find(n=>!np.includes(n));
      sSel(suivant||null);
      if(!suivant)terminer(np.length,erreurs);
    }else{
      const touchee=provinceEn(pt.x,pt.y);
      sErreurs(e=>e+1);sErrPiece(m=>({...m,[nom]:(m[nom]||0)+1}));
      sFlash({x:pt.x,y:pt.y,k:Date.now()});
      sMsg({ok:false,t:!touchee?"Touchez un endroit à l'intérieur du pays.":placees.has(touchee.nom)?`Cet emplacement est celui de ${touchee.nom}, déjà placé. Réessayez.`:"Ce n'est pas le bon emplacement. Réessayez."});
    }
  };

  // Glisser-déposer à la souris (sur téléphone : toucher la pièce, puis la carte)
  useEffect(()=>{
    if(!drag)return;
    const mv=e=>sDrag(d=>d&&{...d,x:e.clientX,y:e.clientY,bouge:d.bouge||Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>6});
    const up=e=>{const d=drag;sDrag(null);if(d&&(d.bouge||Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>6))tenter(d.nom,e.clientX,e.clientY);};
    window.addEventListener("pointermove",mv);window.addEventListener("pointerup",up,{once:true});
    return()=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);};
  });

  const indice=sel&&(errPiece[sel]||0)>=3; // après 3 erreurs sur la même pièce, son emplacement clignote
  const etiquette=n=>niveau.etiquette==="chef"?PAR_NOM[n].chef:n;
  const carte={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16};
  const bouton=p=>({background:p?`linear-gradient(135deg,${K.emD},${K.em})`:K.c2,color:p?"#fff":K.t1,border:p?"none":`1px solid ${K.b1}`,borderRadius:11,padding:"10px 15px",fontWeight:800,fontSize:13.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6,minHeight:42});

  const dessinCarte=complete=><svg ref={complete?undefined:svgRef} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} style={{width:"100%",height:"auto",display:"block",cursor:sel&&!complete?"crosshair":"default",touchAction:"manipulation"}}
    onClick={complete?undefined:e=>tenter(sel,e.clientX,e.clientY)} role="img" aria-label="Carte de la République démocratique du Congo">
    <style>{`@keyframes pzClig{50%{opacity:.15}}@keyframes pzErr{from{opacity:.9;r:28}to{opacity:0;r:60}}`}</style>
    <path d={CHEMIN_PAYS} fill={K.c2} stroke="none"/>
    {!complete&&niveau.cases&&PROVINCES.filter(p=>!placees.has(p.nom)).map(p=><path key={p.nom} d={CHEMIN[p.nom]} fill="none" stroke={K.t3} strokeWidth={1.6} strokeDasharray="7 6" opacity={.7}/>)}
    {PROVINCES.filter(p=>complete||placees.has(p.nom)).map(p=><path key={p.nom} d={CHEMIN[p.nom]} fill={jeu.dejaPosees.includes(p.nom)&&!complete?`${COL[p.nom]}55`:COL[p.nom]} stroke="#fff" strokeWidth={2.2}/>)}
    {!complete&&indice&&<path d={CHEMIN[sel]} fill={`${COL[sel]}66`} stroke={COL[sel]} strokeWidth={4} style={{animation:"pzClig 1s ease-in-out infinite"}}/>}
    <path d={CHEMIN_PAYS} fill="none" stroke="#0A2A5C" strokeWidth={4} strokeLinejoin="round"/>
    {(complete||!mob)&&PROVINCES.filter(p=>complete||placees.has(p.nom)).map(p=><text key={p.nom} x={p.l[0]} y={p.l[1]} textAnchor="middle" dominantBaseline="middle" fontSize={complete?(mob?24:17):16} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,.45)" strokeWidth={complete?(mob?5:4):4} paintOrder="stroke" style={{pointerEvents:"none",fontFamily:"'Outfit',sans-serif"}}>{p.nom}</text>)}
    {!complete&&flash&&<circle key={flash.k} cx={flash.x} cy={flash.y} r={28} fill="none" stroke={K.er||"#DC2626"} strokeWidth={6} style={{animation:"pzErr .7s ease-out forwards"}}/>}
  </svg>;

  // ── Fin de partie ──
  if(fin){
    const pct=scoreCarte(posees.length,total,erreurs);
    return <div style={{maxWidth:900,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      <div style={{...carte,padding:mob?"18px 16px":"22px 24px",marginBottom:14,textAlign:"center"}}>
        <i className="ti ti-trophy" style={{fontSize:34,color:pct>=70?K.em:pct>=40?K.wa:K.er}}/>
        <div style={{fontSize:mob?30:36,fontWeight:900,color:K.t1,margin:"4px 0"}}>{pct} %</div>
        <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6}}>{posees.length} / {total} provinces placées · {erreurs} erreur{erreurs>1?"s":""} · {fmt(Math.round((Date.now()-debut.current)/1000))} · niveau {niveau.label}</div>
        {posees.length<total&&<div style={{fontSize:13.5,color:K.wa,fontWeight:700,marginTop:6}}>Temps écoulé : {total-posees.length} province{total-posees.length>1?"s":""} non placée{total-posees.length>1?"s":""}.</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
          <button onClick={()=>sPartie(x=>x+1)} className="bt" style={bouton(true)}><i className="ti ti-arrow-back-up"/>Rejouer</button>
          <button onClick={onQuitter} className="bt" style={bouton(false)}><i className="ti ti-layout-grid"/>Autres tests</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"minmax(0,1fr)":"minmax(0,1.3fr) minmax(0,1fr)",gap:14,alignItems:"start"}}>
        <div style={{...carte,padding:10}}>{dessinCarte(true)}</div>
        <div style={{...carte,padding:"12px 14px"}}>
          <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}><i className="ti ti-map-pin" style={{marginRight:6,color:K.in_}}/>Les 26 provinces et leurs chefs-lieux</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px"}}>
            {PROVINCES.map(p=><div key={p.nom} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"4px 0",borderBottom:`1px solid ${K.b0}`,minWidth:0}}>
              <span style={{width:9,height:9,borderRadius:3,background:COL[p.nom],flexShrink:0}}/>
              <span style={{minWidth:0}}><b style={{color:K.t1}}>{p.nom}</b><span style={{color:K.t3}}> · {p.chef}</span></span></div>)}
          </div>
        </div>
      </div>
      <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_CARTE}</div>
    </div>;
  }

  // ── Partie en cours ──
  const low=tLeft<=30;
  return <div style={{maxWidth:1000,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
      <button onClick={()=>{if(window.confirm("Quitter le puzzle ? La partie ne sera pas enregistrée."))onQuitter();}} className="bt" style={{...bouton(false),minHeight:36,padding:"7px 11px"}}><i className="ti ti-arrow-left"/></button>
      <div style={{flex:1,minWidth:140}}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1}}>Puzzle de la carte · {niveau.label}</div>
        <div style={{fontSize:12.5,color:K.t3}}>{posees.length} / {total} placées · {erreurs} erreur{erreurs>1?"s":""}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,background:low?K.rdBg:K.c2,border:`1px solid ${low?K.rdBd:K.b0}`,borderRadius:10,padding:"7px 11px"}}>
        <i className="ti ti-clock" style={{fontSize:14,color:low?K.rd:K.t2}}/><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:low?K.rd:K.t1}}>{fmt(tLeft)}</span></div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:mob?"minmax(0,1fr)":"minmax(0,1.45fr) minmax(0,1fr)",gap:12,alignItems:"start"}}>
      <div style={{...carte,padding:mob?6:10}}>{dessinCarte(false)}</div>
      <div style={{minWidth:0}}>
        <div style={{...carte,padding:"10px 12px",marginBottom:10,minHeight:mob?0:64,background:msg?(msg.ok?K.emBg:K.erBg):K.card,border:`1px solid ${msg?(msg.ok?K.emBd:K.erBd):K.b0}`}}>
          {sel?<div style={{fontSize:13.5,color:K.t1,lineHeight:1.45}}><i className="ti ti-hand-click" style={{marginRight:5,color:K.in_}}/>Placez <b>{etiquette(sel)}</b>{niveau.etiquette==="chef"?" (sa province)":""} : {mob?"touchez":"cliquez sur"} son emplacement sur la carte{mob?"":", ou faites glisser la pièce"}.</div>
            :<div style={{fontSize:13.5,color:K.t2}}>Choisissez une pièce.</div>}
          {msg&&<div style={{fontSize:13,fontWeight:700,marginTop:5,color:msg.ok?K.em:K.er}}>{msg.ok?"✓ ":"✗ "}{msg.t}</div>}
          {indice&&<div style={{fontSize:12.5,color:K.wa,fontWeight:700,marginTop:4}}><i className="ti ti-bulb" style={{marginRight:4}}/>Indice : son emplacement clignote sur la carte.</div>}
        </div>
        <div style={mob?{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch"}:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:8,maxHeight:560,overflowY:"auto",paddingRight:4}}>
          {reste.map(n=>{const actif=sel===n;return <button key={n} onClick={()=>sSel(n)}
            onPointerDown={e=>{if(e.pointerType==="mouse"){sSel(n);sDrag({nom:n,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,bouge:false});}}}
            className="bt" aria-pressed={actif} style={{flexShrink:0,width:mob?96:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"8px 6px",background:actif?`${COL[n]}18`:K.card,border:`2px solid ${actif?COL[n]:K.b0}`,borderRadius:12,cursor:"grab",fontFamily:"'Outfit',sans-serif",userSelect:"none"}}>
            <Miniature nom={n} col={COL[n]}/>
            <span style={{fontSize:12,fontWeight:800,color:K.t1,lineHeight:1.2,textAlign:"center"}}>{etiquette(n)}</span>
          </button>;})}
        </div>
      </div>
    </div>
    {drag&&drag.bouge&&<div style={{position:"fixed",left:drag.x-30,top:drag.y-30,pointerEvents:"none",zIndex:1000,opacity:.85}}><Miniature nom={drag.nom} col={COL[drag.nom]} taille={60}/></div>}
    <div style={{fontSize:11.5,color:K.t3,marginTop:10,textAlign:"center"}}>{SOURCE_CARTE}</div>
  </div>;
}
