import React,{useEffect,useMemo,useState}from"react";
import LecteurAudio from"../audio/LecteurAudio";
import{texteModuleParcs}from"../audio/lecture";
import{Bloc,Qcm,Bouton}from"../fiscal/CodeImpots";
import{SEUIL_ELEMENT}from"../attest/regles";
import{MODULE_PARCS}from"./module";
import{SITES}from"./sites";

// ══════════════════ CULTURE GÉNÉRALE : PARCS NATIONAUX ET SITES PROTÉGÉS DE LA RDC ══════════════════
// Module en accès libre : leçon (carte interactive, tableaux, repères), cours audio, quiz de 10 questions tirées de 15.
// Score : users/{uid}.scores["PARCS-RDC"]. Le jeu « Où se trouve… ? » des parcs est dans les tests psychotechniques.
export const CLE_PARCS="PARCS-RDC";

export default function ParcsRdc({K,mob,db,uid,scores={},onGo,apercu}){
  const mod=MODULE_PARCS;
  const[mode,sMode]=useState("lecon"),[loc,sLoc]=useState(null);
  const s=loc||scores[CLE_PARCS];
  const segs=useMemo(()=>texteModuleParcs(mod),[mod]);
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[mode]);
  const nb={parcs:SITES.filter(x=>x.type==="parc").length,unesco:SITES.filter(x=>x.unesco).length,sites:SITES.length};
  return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:"linear-gradient(135deg,#052E16,#15803D 60%,#0E7490)",borderRadius:20,padding:mob?"20px 18px":"26px 28px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-trees" style={{position:"absolute",right:-10,bottom:-24,fontSize:150,opacity:.1}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",opacity:.85}}>Culture générale · accès libre · {mod.duree}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?24:30,lineHeight:1.15,margin:"6px 0 8px"}}>{mod.titre}</div>
      <div style={{fontSize:14.5,opacity:.92,lineHeight:1.55,maxWidth:620}}>{mod.resume}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
        {[[`${nb.parcs} parcs nationaux`,"trees"],[`${nb.unesco} sites UNESCO`,"world"],[`${nb.sites} sites sur la carte`,"map-pin"]].map(([l,ic])=><span key={l} style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}><i className={`ti ti-${ic}`} style={{marginRight:4}}/>{l}</span>)}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        {[["lecon","book-2","Leçon et carte"],["qcm","checklist","Quiz · 10 questions"]].map(([k,ic,l])=><button key={k} onClick={()=>sMode(k)} className="bt" style={{background:mode===k?"#fff":"rgba(255,255,255,.14)",color:mode===k?"#15803D":"#fff",border:"1px solid rgba(255,255,255,.35)",borderRadius:99,padding:"8px 14px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
          <i className={`ti ti-${ic}`} style={{fontSize:14}}/>{l}</button>)}
        {s&&<span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"8px 12px",fontWeight:800,fontSize:13}}>Meilleur score : {s.pct} %{s.pct>=SEUIL_ELEMENT?" · réussi":""}</span>}
      </div>
    </div>
    {mode==="lecon"&&<>
      <div style={{marginBottom:14}}><LecteurAudio K={K} segments={segs} titre="Écouter le cours"/></div>
      {mod.blocs.map((b,i)=><Bloc key={i} K={K} b={b} col={mod.col}/>)}
      <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",margin:"6px 0 18px"}}>
        <Bouton K={K} ico="checklist" ch="Passer le quiz" on={()=>sMode("qcm")}/>
        {onGo&&!apercu&&<Bouton K={K} v="g" ico="map-search" ch="Jouer : où se trouvent les parcs ?" on={()=>onGo("psycho")}/>}
      </div>
    </>}
    {mode==="qcm"&&<Qcm key="parcs" K={K} mod={mod} db={db} uid={uid} ancien={s} cle={CLE_PARCS} nbQ={10} seuil={SEUIL_ELEMENT}
      onFin={(r,ret)=>{if(r)sLoc({...r,date:new Date().toISOString()});if(ret)sMode("lecon");}}/>}
  </div>;
}
