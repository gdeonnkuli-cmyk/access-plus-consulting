import React,{useState,useEffect}from"react";
import{Qcm,Carte,Bouton}from"../fiscal/CodeImpots";
import{SEUIL_ELEMENT,SEUIL_MOYENNE,COEF_FINAL,EXAMENS,PARCOURS}from"../attest/regles";
import{EXAMENS_FINAUX}from"./examens";

// ══════════════════ EXAMEN FINAL D'UN PARCOURS (composants partagés) ══════════════════
// CarteExamenFinal : état de l'examen dans la page du parcours (verrouillé, ouvert, réussi) et lien vers le certificat.
// ExamenFinal : consignes puis épreuve (QCM en mode examen, corrigé détaillé à la fin), score dans users.scores[EXAMENS[id].cle].
// etat : résultat de etatParcours(id, modules, user) (src/attest/regles.js).

const pctF=(etat,local)=>local!=null?local:etat.final;

export function CarteExamenFinal({K,id,etat,ok,apercu,local,onOuvrir,onCertificat}){
  const x=EXAMENS[id],F=EXAMENS_FINAUX[id],p=pctF(etat,local),reussi=p!=null&&p>=SEUIL_ELEMENT;
  const ouvert=apercu||(ok&&etat.finalOuvert),n=etat.elements.length;
  const raison=ouvert?`Ouvert : ${x.nbQ} questions, note minimale ${SEUIL_ELEMENT} %, corrigé détaillé à la fin.`
    :!ok?"Réservé aux abonnés."
    :!etat.tousReussis?`S'ouvre quand les ${n} éléments du parcours sont réussis à ${SEUIL_ELEMENT} % au moins (${etat.nReussis} / ${n} pour l'instant).`
    :`Moyenne actuelle ${etat.moyenne} % : portez-la à ${SEUIL_MOYENNE} % au moins (refaites les évaluations les plus faibles).`;
  const or="#B7791F";
  return <div style={{background:ouvert?`linear-gradient(135deg,${or}14,${K.card})`:K.card,border:`1px solid ${ouvert?or+"66":K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 15px",margin:"14px 0"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <div style={{fontSize:11.5,fontWeight:800,color:or,letterSpacing:.6,textTransform:"uppercase"}}><i className={`ti ti-${reussi?"trophy":ouvert?"certificate":"lock"}`} style={{marginRight:5}}/>Évaluation finale · coefficient {COEF_FINAL}</div>
      {p!=null&&<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:reussi?K.emBg:K.erBg,color:reussi?K.em:K.er,border:`1px solid ${reussi?K.emBd:K.erBd}`}}>{p} %</span>}
    </div>
    <div style={{fontWeight:800,fontSize:15.5,color:K.t1,lineHeight:1.3,margin:"4px 0"}}>{F.titre}</div>
    <div style={{fontSize:13,color:K.t3,lineHeight:1.55}}>{raison}</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
      <Bouton K={K} ico={ouvert?"player-play":"lock"} dis={!ouvert} ch={p!=null?"Repasser l'examen":"Passer l'examen final"} on={onOuvrir}/>
      {reussi&&onCertificat&&<Bouton K={K} v="g" ico="certificate" ch="Obtenir mon certificat" on={onCertificat}/>}
    </div>
  </div>;
}

export function ExamenFinal({K,mob,db,uid,id,ancien,onRetour,onScore}){
  const x=EXAMENS[id],F=EXAMENS_FINAUX[id],P=PARCOURS.find(p=>p.id===id)||{};
  const[banque,sBanque]=useState(null),[err,sErr]=useState(""),[go,sGo]=useState(false);
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[go]);
  useEffect(()=>{let vivant=true;Promise.resolve().then(F.charger).then(b=>{if(vivant)sBanque(b);}).catch(()=>vivant&&sErr("Impossible de charger les questions. Vérifiez votre connexion."));return()=>{vivant=false;};},[F]);
  const exam=banque&&{id:`FINAL-${id}`,titre:F.titre,col:F.col,qcm:banque};
  return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <button onClick={onRetour} className="bt" style={{background:"none",border:"none",color:K.t2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginBottom:10,fontFamily:"'Outfit',sans-serif",padding:0}}>
      <i className="ti ti-arrow-left" style={{fontSize:16}}/>Retour au parcours</button>
    <div style={{background:`linear-gradient(135deg,#001433,${F.col} 60%,#B7791F)`,borderRadius:18,padding:mob?"18px 16px":"22px 24px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-certificate" style={{position:"absolute",right:-8,bottom:-16,fontSize:110,opacity:.12}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1,opacity:.85,textTransform:"uppercase"}}>Évaluation finale · {P.court||id}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:27,lineHeight:1.2,margin:"4px 0 6px"}}>{F.titre}</div>
      <div style={{fontSize:14,opacity:.92,lineHeight:1.55}}>{x.nbQ} questions tirées au hasard{banque?` dans une banque de ${banque.length}`:""}. Pas de correction pendant l'épreuve : le corrigé détaillé s'affiche à la fin. Note minimale : {SEUIL_ELEMENT} %. L'examen compte <b>coefficient {COEF_FINAL}</b> dans la moyenne du certificat.</div>
      {ancien&&<div style={{marginTop:10}}><span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>Meilleure note : {ancien.pct} %</span></div>}
    </div>
    {err?<Carte K={K}><div style={{color:K.er,fontSize:14}}>{err}</div></Carte>
    :!go||!exam?<Carte K={K}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:8}}><i className="ti ti-info-circle" style={{color:K.in_,marginRight:6}}/>Avant de commencer</div>
      {["Prévoyez une heure au calme, avec une calculatrice : plusieurs questions sont chiffrées.","Vous pouvez changer de réponse tant que vous n'êtes pas passé à la question suivante.","Ne quittez pas la page pendant l'épreuve : la série serait perdue.","Votre meilleure note est conservée ; chaque nouvelle tentative renouvelle au moins 30 % des questions."].map((t,i)=><div key={i} style={{display:"flex",gap:8,fontSize:14,color:K.t2,lineHeight:1.6,marginBottom:5}}><i className="ti ti-check" style={{color:K.em,marginTop:3}}/><span>{t}</span></div>)}
      <div style={{display:"flex",justifyContent:"center",marginTop:12}}><Bouton K={K} ico={exam?"player-play":"loader-2"} dis={!exam} ch={exam?"Commencer l'examen":"Préparation des questions…"} on={()=>sGo(true)} sx={{minWidth:240}}/></div>
    </Carte>
    :<Qcm key={`final-${id}`} K={K} mod={exam} db={db} uid={uid} ancien={ancien} cle={x.cle} nbQ={x.nbQ} seuil={SEUIL_ELEMENT} examen libRetour="Retour au parcours"
      onFin={(r,ret)=>{if(r&&onScore)onScore(x.cle,r);if(ret)onRetour();}}/>}
  </div>;
}
