import React,{useState,useEffect,useMemo}from"react";
import LecteurAudio from"../audio/LecteurAudio";
import{Bloc,Qcm,Carte,Bouton}from"../fiscal/CodeImpots";
import{ExamenFinal}from"./ExamenFinal";
import{SEUIL_ELEMENT,SEUIL_MOYENNE,COEF_FINAL,EXAMENS,etatParcours}from"../attest/regles";
import{LIB_ACCES}from"../acces/plateforme";

// ══════════════════ PAGE D'UN PARCOURS À MODULES (SYCEBNL, comptabilité bancaire…) ══════════════════
// Chemin vertical : modules ouverts dans l'ordre (le suivant à SEUIL_ELEMENT %, acquis conservés), leçon en blocs, schémas,
// narration audio et évaluation (séries de NB_Q), puis examen final (EXAMENS[id], coefficient 2) et certificat avec relevé.
// cfg : { id, modules, cle(idModule), audio(mod), nom, hero: { fond, ico, kicker, titre, texte }, libre, libreTexte?, source }
// apercu : administrateur ou formateur, tout est ouvert.
const NB_Q=10;

const Pastille=({K,pct})=>{if(pct==null)return null;const ok=pct>=SEUIL_ELEMENT;
  return <span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:ok?K.emBg:K.erBg,color:ok?K.em:K.er,border:`1px solid ${ok?K.emBd:K.erBd}`,whiteSpace:"nowrap"}}>{pct} %</span>;};

export default function ParcoursModules({cfg,K,mob,db,uid,scores={},ok,onSub,onGo,apercu=false}){
  const MODS=cfg.modules,X=EXAMENS[cfg.id],CLE_F=X.cle;
  const[open,sOpen]=useState(null),[mode,sMode]=useState("lecon"),[loc,sLoc]=useState({});
  const tous=useMemo(()=>({...scores,...loc}),[scores,loc]);
  const etat=useMemo(()=>etatParcours(cfg.id,[],{scores:tous}),[tous,cfg.id]);
  const em=id=>etat.elements.find(x=>x.cle===cfg.cle(id));
  const mod=MODS.find(m=>m.id===open);
  const segs=useMemo(()=>mod?cfg.audio(mod):[],[mod,cfg]);
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[open,mode]);
  const abonne=m=>apercu||ok||(m&&m.libre);
  const ouvertParcours=m=>apercu||em(m.id).ouvert;
  const finalOuvert=apercu||(ok&&etat.finalOuvert);
  const nbReussis=etat.nReussis;
  const notesFaites=etat.elements.filter(x=>x.pct!=null).map(x=>x.pct);
  const moyFaites=notesFaites.length?Math.round(notesFaites.reduce((a,b)=>a+b,0)/notesFaites.length):null;
  const enregistrer=(cle,r)=>{if(r)sLoc(l=>({...l,[cle]:{...r,date:new Date().toISOString()}}));};
  const ouvrir=m=>{if(!abonne(m)){onSub&&onSub();return;}if(!ouvertParcours(m))return;sOpen(m.id);sMode("lecon");};
  const retour=<button onClick={()=>{sOpen(null);sMode("lecon");}} className="bt" style={{background:"none",border:"none",color:K.t2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginBottom:10,fontFamily:"'Outfit',sans-serif",padding:0}}>
    <i className="ti ti-arrow-left" style={{fontSize:16}}/>{cfg.nom}</button>;

  // ── Examen final (composant partagé par tous les parcours) ─────────────────────
  if(open==="FINAL")return <ExamenFinal K={K} mob={mob} db={db} uid={uid} id={cfg.id} ancien={tous[CLE_F]}
    onRetour={()=>{sOpen(null);sMode("lecon");}} onScore={(cle,r)=>enregistrer(cle,r)}/>;

  // ── Module ────────────────────────────────────────────────────────────────────
  if(mod){
    const idx=MODS.indexOf(mod),prev=MODS[idx-1],next=MODS[idx+1],s=tous[cfg.cle(mod.id)];
    const reussi=s&&s.pct>=SEUIL_ELEMENT;
    return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      {retour}
      <div style={{background:`linear-gradient(135deg,${mod.col},${mod.col}CC)`,borderRadius:18,padding:mob?"18px 16px":"22px 24px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <i className={`ti ti-${mod.ico}`} style={{position:"absolute",right:-8,bottom:-16,fontSize:110,opacity:.12}}/>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:1,opacity:.85,textTransform:"uppercase"}}>Module {idx+1} / {MODS.length} · {mod.duree}</div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:27,lineHeight:1.2,margin:"4px 0 6px"}}>{mod.titre}</div>
        <div style={{fontSize:14,opacity:.9,lineHeight:1.5}}>{mod.resume}</div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {[["lecon","book-2","Leçon et schémas"],["qcm","checklist",`Évaluation · ${Math.min(NB_Q,mod.qcm.length)} questions`]].map(([k,ic,l])=><button key={k} onClick={()=>sMode(k)} className="bt" style={{background:mode===k?"#fff":"rgba(255,255,255,.16)",color:mode===k?mod.col:"#fff",border:"1px solid rgba(255,255,255,.35)",borderRadius:99,padding:"7px 13px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <i className={`ti ti-${ic}`} style={{fontSize:14}}/>{l}</button>)}
          {s&&<span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"7px 12px",fontWeight:800,fontSize:13}}>Meilleur score : {s.pct} %{reussi?" · validé":""}</span>}
        </div>
      </div>
      {mode==="lecon"&&<>
        <div style={{marginBottom:14}}><LecteurAudio K={K} segments={segs} titre="Écouter le cours"/></div>
        {mod.blocs.map((b,i)=><Bloc key={i} K={K} b={b} col={mod.col}/>)}
        <div style={{display:"flex",justifyContent:"center",margin:"6px 0 18px"}}>
          <Bouton K={K} ico="checklist" ch={`Passer l'évaluation (${SEUIL_ELEMENT} % pour avancer)`} on={()=>sMode("qcm")} sx={{minWidth:260}}/>
        </div>
      </>}
      {mode==="qcm"&&<Qcm key={mod.id} K={K} mod={mod} db={db} uid={uid} ancien={s} cle={cfg.cle(mod.id)} nbQ={NB_Q} seuil={SEUIL_ELEMENT}
        onFin={(r,ret)=>{enregistrer(cfg.cle(mod.id),r);if(ret)sMode("lecon");}}/>}
      {mode==="qcm"&&reussi&&next&&<div style={{display:"flex",justifyContent:"center",margin:"0 0 14px"}}><Bouton K={K} ico="lock-open" ch={`Module suivant : ${next.id} · ${next.court}`} on={()=>ouvrir(next)}/></div>}
      {mode==="qcm"&&reussi&&!next&&<div style={{display:"flex",justifyContent:"center",margin:"0 0 14px"}}><Bouton K={K} ico="certificate" ch="Voir l'accès à l'examen final" on={()=>{sOpen(null);sMode("lecon");}}/></div>}
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:20}}>
        {prev?<Bouton K={K} v="g" ico="arrow-left" ch={mob?prev.id:`${prev.id} · ${prev.court}`} on={()=>ouvrir(prev)}/>:<span/>}
        {next&&<Bouton K={K} v="g" dis={!abonne(next)?false:!ouvertParcours(next)} ch={<>{mob?next.id:`${next.id} · ${next.court}`}<i className={`ti ti-${ouvertParcours(next)?"arrow-right":"lock"}`} style={{fontSize:16}}/></>} on={()=>ouvrir(next)}/>}
      </div>
    </div>;
  }

  // ── Accueil du parcours ───────────────────────────────────────────────────────
  const sf=tous[CLE_F],finalReussi=sf&&sf.pct>=SEUIL_ELEMENT;
  const pctParcours=Math.round((nbReussis+(finalReussi?1:0))/(MODS.length+1)*100);
  return <div style={{maxWidth:860,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:cfg.hero.fond,borderRadius:20,padding:mob?"20px 18px":"26px 28px",color:"#fff",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <i className={`ti ti-${cfg.hero.ico}`} style={{position:"absolute",right:-10,bottom:-22,fontSize:150,opacity:.1}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",opacity:.85}}>Parcours certifiant · {cfg.hero.kicker}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?24:31,lineHeight:1.15,margin:"6px 0 8px"}}>{cfg.hero.titre}</div>
      <div style={{fontSize:14.5,opacity:.92,lineHeight:1.55,maxWidth:620}}>{cfg.hero.texte} Chaque module s'ouvre quand le précédent est réussi à {SEUIL_ELEMENT} %. Avec une moyenne d'au moins {SEUIL_MOYENNE} %, vous accédez à l'examen final de {X.nbQ} questions, puis au <b>certificat</b> et à son <b>relevé de notes</b>.</div>
      <div style={{height:8,background:"rgba(255,255,255,.2)",borderRadius:99,overflow:"hidden",margin:"14px 0 10px",maxWidth:420}}><div style={{width:`${pctParcours}%`,height:"100%",background:"#fff",borderRadius:99}}/></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>{nbReussis} / {MODS.length} modules réussis</span>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>Moyenne des modules : {moyFaites==null?"—":`${moyFaites} %`}</span>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}><i className="ti ti-headphones" style={{marginRight:4}}/>Cours audio</span>
      </div>
    </div>
    {!ok&&!apercu&&<div style={{display:"flex",alignItems:"center",gap:10,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:14,padding:"11px 14px",marginBottom:14,flexWrap:"wrap"}}>
      <i className="ti ti-lock-open" style={{fontSize:18,color:K.wa}}/>
      <div style={{flex:1,minWidth:200,fontSize:13.5,color:K.t1,lineHeight:1.5}}>{cfg.libreTexte||<>Le module <b>{cfg.libre}</b> est en accès libre.</>} Les autres modules, l'examen final et le certificat sont réservés aux apprenants disposant d'un accès actif.</div>
      {onSub&&<Bouton K={K} ch={LIB_ACCES} on={onSub} sx={{minHeight:38,padding:"8px 14px",fontSize:13}}/>}
    </div>}
    {apercu&&<div style={{fontSize:12.5,color:K.t3,marginBottom:10}}><i className="ti ti-eye" style={{marginRight:4}}/>Aperçu : tous les modules sont ouverts.</div>}

    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {MODS.map((m,i)=>{const e=em(m.id),lkAbo=!abonne(m),lkParc=!ouvertParcours(m),lk=lkAbo||lkParc;
        const etatIco=e.reussi?"circle-check":lk?"lock":e.pct!=null?"alert-circle":"player-play";
        const colI=e.reussi?K.em:lk?K.t3:e.pct!=null?K.er:m.col;
        return <div key={m.id} style={{display:"flex",gap:12,alignItems:"stretch"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:34,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:e.reussi?K.emBg:lk?K.c2:`${m.col}18`,border:`2px solid ${colI}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${etatIco}`} style={{fontSize:17,color:colI}}/></div>
            <div style={{flex:1,width:2,background:e.reussi?K.em:K.b1,minHeight:12}}/>
          </div>
          <div onClick={()=>ouvrir(m)} className={lkParc&&!lkAbo?"":"hv"} style={{flex:1,minWidth:0,background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",marginBottom:10,cursor:lkParc&&!lkAbo?"not-allowed":"pointer",opacity:lk?.72:1,borderLeft:`4px solid ${m.col}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <div style={{fontSize:11.5,fontWeight:800,color:m.col,letterSpacing:.6,textTransform:"uppercase"}}>{m.id} · {m.court}</div>
              {e.pct!=null?<Pastille K={K} pct={e.pct}/>:m.libre&&!ok&&!apercu?<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:K.inBg,color:K.in_,border:`1px solid ${K.inBd}`}}>Libre</span>:null}
            </div>
            <div style={{fontWeight:800,fontSize:15.5,color:K.t1,lineHeight:1.3,margin:"3px 0 4px"}}>{m.titre}</div>
            <div style={{fontSize:13,color:K.t3,lineHeight:1.5}}>{m.resume}</div>
            <div style={{display:"flex",gap:12,fontSize:12,color:K.t3,marginTop:6,flexWrap:"wrap"}}>
              <span><i className="ti ti-clock" style={{marginRight:3}}/>{m.duree}</span>
              <span><i className="ti ti-schema" style={{marginRight:3}}/>{m.blocs.filter(b=>b.type==="schema").length} schémas</span>
              <span><i className="ti ti-headphones" style={{marginRight:3}}/>Audio</span>
              {lkParc&&!lkAbo&&<span style={{color:K.wa,fontWeight:700}}><i className="ti ti-lock" style={{marginRight:3}}/>Réussir {MODS[i-1].id} à {SEUIL_ELEMENT} %</span>}
              {lkAbo&&<span style={{color:K.wa,fontWeight:700}}><i className="ti ti-lock" style={{marginRight:3}}/>Accès abonné</span>}
            </div>
          </div>
        </div>;})}
      {/* Examen final */}
      <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:34,flexShrink:0}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:finalReussi?K.emBg:K.c2,border:`2px solid ${finalReussi?K.em:finalOuvert?"#B7791F":K.t3}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ti-${finalReussi?"trophy":finalOuvert?"certificate":"lock"}`} style={{fontSize:17,color:finalReussi?K.em:finalOuvert?"#B7791F":K.t3}}/></div>
        </div>
        <div style={{flex:1,minWidth:0,background:finalOuvert?`linear-gradient(135deg,#B7791F14,${K.card})`:K.card,border:`1px solid ${finalOuvert?"#B7791F66":K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 15px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <div style={{fontSize:11.5,fontWeight:800,color:"#B7791F",letterSpacing:.6,textTransform:"uppercase"}}>Évaluation finale · coefficient {COEF_FINAL}</div>
            <Pastille K={K} pct={sf?sf.pct:null}/>
          </div>
          <div style={{fontWeight:800,fontSize:15.5,color:K.t1,lineHeight:1.3,margin:"3px 0 4px"}}>Examen final : {X.nbQ} questions sur les {MODS.length} modules</div>
          <div style={{fontSize:13,color:K.t3,lineHeight:1.55}}>
            {finalOuvert?`Ouvert. Note minimale ${SEUIL_ELEMENT} % ; corrigé détaillé à la fin.`
              :!ok&&!apercu?"Réservé aux abonnés."
              :!etat.tousReussis?`S'ouvre quand les ${MODS.length} modules sont réussis à ${SEUIL_ELEMENT} % au moins (${nbReussis} / ${MODS.length} pour l'instant).`
              :`Moyenne des modules ${etat.moyenne} % : portez-la à ${SEUIL_MOYENNE} % au moins (refaites les évaluations les plus faibles) pour ouvrir l'examen.`}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
            <Bouton K={K} ico={finalOuvert?"player-play":"lock"} dis={!finalOuvert} ch={sf?"Repasser l'examen":"Passer l'examen final"} on={()=>{sOpen("FINAL");sMode("intro");}}/>
            {finalReussi&&onGo&&<Bouton K={K} v="g" ico="certificate" ch="Obtenir mon certificat" on={()=>onGo("res")}/>}
          </div>
        </div>
      </div>
    </div>
    <Carte K={K} sx={{background:K.c2,boxShadow:"none",marginTop:6}}>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:6}}><i className="ti ti-certificate" style={{color:"#B7791F",marginRight:6}}/>Certificat et relevé de notes</div>
      <div style={{fontSize:13,color:K.t2,lineHeight:1.6}}>Le certificat de réussite est délivré lorsque chaque évaluation ({MODS.length} modules et examen final) atteint {SEUIL_ELEMENT} % et que la moyenne pondérée (examen coefficient {COEF_FINAL}) atteint {SEUIL_MOYENNE} %. Mentions : Bien (80 %), Très bien (90 %), Excellent (95 %). Le PDF comprend le certificat numéroté avec QR code de vérification et, en page 2, le relevé de notes détaillé. À demander dans « Mes résultats ».</div>
      <div style={{fontSize:12,color:K.t3,lineHeight:1.55,marginTop:8}}>{cfg.source}</div>
    </Carte>
  </div>;
}
