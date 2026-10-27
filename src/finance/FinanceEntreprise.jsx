import React,{useState,useEffect,useMemo}from"react";
import LecteurAudio from"../audio/LecteurAudio";
import{texteModuleFinance}from"../audio/lecture";
import{Bloc,Qcm,Carte,Bouton}from"../fiscal/CodeImpots";
import{MODULES_FIN}from"./modules";
import{casParNum}from"./cas";
import{LIB_ACCES}from"../acces/plateforme";

// ══════════════════ FINANCE D'ENTREPRISE ══════════════════
// 7 modules (src/finance/modules.js) : leçon en blocs avec narration audio, cas corrigés (src/finance/cas.js) et QCM.
// Score enregistré dans users/{uid}.scores["FIN-FE2"] = { s, t, pct, date } (meilleur score conservé).
// QCM : séries de 8 questions tirées dans une banque de 10 (au moins 30 % de nouvelles d'un essai à l'autre).
const NB_Q=8;
export const cleScoreFin=id=>`FIN-${id}`;

// Tableau d'un cas : chiffres alignés à droite, défilement horizontal sur téléphone
const estNombre=v=>/^[−\-+(]?\d[\d.,]*\)?%?$/.test(String(v).replace(/\s/g,""));
const estTotal=l=>/^(=|Total|Moyenne|Flux net de trésorerie|Flux de l'emprunt|Flux du crédit)/.test(String(l[0]));
function TableCas({K,col,e,l}){
  const num=e.map((_,j)=>j>0&&l.some(r=>estNombre(r[j]))&&l.every(r=>r[j]===""||estNombre(r[j])||estTotal(r)));
  return <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",borderRadius:10,border:`1px solid ${K.b0}`,margin:"8px 0 12px"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:e.length>4?560:e.length>3?500:e.length>2?380:0}}>
      {e.some(x=>x!=="")&&<thead><tr>{e.map((h,i)=><th key={i} style={{background:col,color:"#fff",textAlign:num[i]?"right":"left",padding:"7px 9px",fontWeight:800,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>}
      <tbody>{l.map((r,i)=>{const tot=estTotal(r);return <tr key={i} style={{background:tot?`${col}14`:i%2?K.c2:K.card}}>
        {r.map((c,j)=><td key={j} style={{padding:"7px 9px",color:j?K.t2:K.t1,fontWeight:tot||!j?700:500,borderTop:`1px solid ${K.b0}`,lineHeight:1.4,verticalAlign:"top",
          textAlign:j&&estNombre(c)?"right":"left",whiteSpace:j&&estNombre(c)?"nowrap":"normal",fontVariantNumeric:"tabular-nums"}}>{c}</td>)}</tr>;})}</tbody>
    </table>
  </div>;
}

function Cas({K,col,c,ouvert,onBascule}){
  return <Carte K={K} sx={{borderTop:`4px solid ${col}`}}>
    <div style={{fontSize:11.5,fontWeight:800,color:col,letterSpacing:.6,textTransform:"uppercase",marginBottom:2}}>Cas {c.n} · {c.theme}</div>
    <div style={{fontWeight:800,fontSize:16.5,color:K.t1,lineHeight:1.35,marginBottom:10}}>{c.titre}</div>
    {c.enonce.map((t,i)=><p key={i} style={{fontSize:14.5,color:K.t2,lineHeight:1.65,marginBottom:8}}>{t}</p>)}
    {c.tableau&&<TableCas K={K} col={col} e={c.tableau.e} l={c.tableau.l}/>}
    {c.donnees&&<TableCas K={K} col={col} e={["Donnée","Valeur"]} l={c.donnees}/>}
    <div style={{fontWeight:800,fontSize:14,color:K.t1,margin:"6px 0 6px"}}><i className="ti ti-pencil" style={{color:col,marginRight:6}}/>Travail à faire</div>
    <ol style={{margin:"0 0 12px",paddingLeft:22}}>{c.questions.map((q,i)=><li key={i} style={{fontSize:14.5,color:K.t1,lineHeight:1.6,marginBottom:4}}>{q}</li>)}</ol>
    <Bouton K={K} v={ouvert?"g":"p"} ico={ouvert?"eye-off":"eye"} ch={ouvert?"Masquer le corrigé":"Voir le corrigé"} on={onBascule}/>
    {ouvert&&<div style={{marginTop:14,paddingTop:12,borderTop:`1px dashed ${K.b1}`,animation:"fadeIn .25s ease"}}>
      {c.corrige.map((x,i)=><div key={i} style={{marginBottom:12}}>
        <div style={{fontSize:13.5,fontWeight:900,color:col,marginBottom:4}}>Question {x.q}</div>
        {x.t.map((t,j)=><p key={j} style={{fontSize:14.5,color:K.t1,lineHeight:1.65,marginBottom:6}}>{t}</p>)}
        {x.tab&&<TableCas K={K} col={col} e={x.tab.e} l={x.tab.l}/>}
        {(x.t2||[]).map((t,j)=><p key={j} style={{fontSize:14.5,color:K.t1,lineHeight:1.65,marginBottom:6}}>{t}</p>)}
      </div>)}
      <div style={{display:"flex",gap:10,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"11px 13px"}}>
        <i className="ti ti-bulb" style={{fontSize:19,color:K.wa,flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:14,color:K.t1,lineHeight:1.6}}><b style={{color:K.wa}}>À retenir : </b>{c.retenir}</div>
      </div>
    </div>}
  </Carte>;
}

export default function FinanceEntreprise({K,mob,db,uid,scores={},ok,onSub}){
  const[open,sOpen]=useState(null),[mode,sMode]=useState("lecon"),[loc,sLoc]=useState({}),[vus,sVus]=useState({});
  const sc=id=>loc[id]||scores[cleScoreFin(id)];
  const mod=MODULES_FIN.find(m=>m.id===open);
  const segs=useMemo(()=>mod?texteModuleFinance(mod):[],[mod]);
  const acces=m=>ok||m.libre;
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[open,mode]);
  const valides=MODULES_FIN.filter(m=>(sc(m.id)?.pct||0)>=60).length;
  const ouvrir=m=>{if(acces(m)){sOpen(m.id);sMode("lecon");}else onSub&&onSub();};

  if(mod){
    const idx=MODULES_FIN.indexOf(mod),prev=MODULES_FIN[idx-1],next=MODULES_FIN[idx+1],s=sc(mod.id),cas=mod.cas.map(casParNum);
    return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      <button onClick={()=>{sOpen(null);sMode("lecon");}} className="bt" style={{background:"none",border:"none",color:K.t2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginBottom:10,fontFamily:"'Outfit',sans-serif",padding:0}}>
        <i className="ti ti-arrow-left" style={{fontSize:16}}/>Tous les modules</button>
      <div style={{background:`linear-gradient(135deg,${mod.col},${mod.col}CC)`,borderRadius:18,padding:mob?"18px 16px":"22px 24px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <i className={`ti ti-${mod.ico}`} style={{position:"absolute",right:-8,bottom:-16,fontSize:110,opacity:.12}}/>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:1,opacity:.85,textTransform:"uppercase"}}>Module {mod.id} · {mod.duree}</div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:27,lineHeight:1.2,margin:"4px 0 6px"}}>{mod.titre}</div>
        <div style={{fontSize:14,opacity:.9,lineHeight:1.5}}>{mod.resume}</div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {[["lecon","book-2","Leçon"],["cas","calculator",`Cas corrigés · ${cas.length}`],["qcm","checklist",`QCM · ${Math.min(NB_Q,mod.qcm.length)} questions`]].map(([k,ic,l])=><button key={k} onClick={()=>sMode(k)} className="bt" style={{background:mode===k?"#fff":"rgba(255,255,255,.16)",color:mode===k?mod.col:"#fff",border:"1px solid rgba(255,255,255,.35)",borderRadius:99,padding:"7px 13px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <i className={`ti ti-${ic}`} style={{fontSize:14}}/>{l}</button>)}
          {s&&<span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"7px 12px",fontWeight:800,fontSize:13}}>Meilleur score : {s.pct} %</span>}
        </div>
      </div>
      {mode==="lecon"&&<>
        <div style={{marginBottom:14}}><LecteurAudio K={K} segments={segs} titre="Écouter le cours"/></div>
        {mod.blocs.map((b,i)=><Bloc key={i} K={K} b={b} col={mod.col}/>)}
        <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",margin:"6px 0 18px"}}>
          <Bouton K={K} ico="calculator" ch="Faire les cas corrigés" on={()=>sMode("cas")} sx={{minWidth:220}}/>
          <Bouton K={K} v="g" ico="checklist" ch="Passer le QCM" on={()=>sMode("qcm")}/>
        </div>
      </>}
      {mode==="cas"&&<>
        <div style={{fontSize:13.5,color:K.t2,lineHeight:1.55,marginBottom:12}}><i className="ti ti-info-circle" style={{color:mod.col,marginRight:5}}/>Cherchez d'abord la solution, avec une calculatrice ou un tableur, puis ouvrez le corrigé. Les données de marché sont des hypothèses pédagogiques.</div>
        {cas.map(c=><Cas key={c.n} K={K} col={mod.col} c={c} ouvert={!!vus[c.n]} onBascule={()=>sVus(v=>({...v,[c.n]:!v[c.n]}))}/>)}
        <div style={{display:"flex",justifyContent:"center",margin:"6px 0 18px"}}><Bouton K={K} ico="checklist" ch="Passer le QCM du module" on={()=>sMode("qcm")} sx={{minWidth:240}}/></div>
      </>}
      {mode==="qcm"&&<Qcm key={mod.id} K={K} mod={mod} db={db} uid={uid} ancien={s} cle={cleScoreFin(mod.id)} nbQ={NB_Q} onFin={(r,retour)=>{if(r)sLoc(l=>({...l,[mod.id]:r}));if(retour)sMode("lecon");}}/>}
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:20}}>
        {prev?<Bouton K={K} v="g" ico="arrow-left" ch={mob?prev.id:`${prev.id} · ${prev.court}`} on={()=>ouvrir(prev)}/>:<span/>}
        {next&&<Bouton K={K} v="g" ch={<>{mob?next.id:`${next.id} · ${next.court}`}<i className="ti ti-arrow-right" style={{fontSize:16}}/></>} on={()=>ouvrir(next)}/>}
      </div>
    </div>;
  }

  return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{background:"linear-gradient(135deg,#001433,#0A2A5C 55%,#B7791F)",borderRadius:20,padding:mob?"20px 18px":"26px 28px",color:"#fff",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-chart-pie" style={{position:"absolute",right:-10,bottom:-22,fontSize:150,opacity:.1}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",opacity:.85}}>Finance · RDC et espace OHADA</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?24:31,lineHeight:1.15,margin:"6px 0 8px"}}>Finance d'entreprise</div>
      <div style={{fontSize:14.5,opacity:.92,lineHeight:1.55,maxWidth:580}}>7 modules et 16 cas corrigés situés dans des entreprises congolaises : coût du capital, levier et création de valeur, investissement, financement, évaluation, risque de change USD/CDF et affectation du résultat selon l'OHADA. Chaque leçon s'écoute en audio. Réussissez les 7 QCM pour obtenir votre attestation (rubrique « Mes résultats »).</div>
      <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>{valides} / {MODULES_FIN.length} modules validés</span>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}><i className="ti ti-headphones" style={{marginRight:4}}/>Cours audio</span>
      </div>
    </div>
    {!ok&&<div style={{display:"flex",alignItems:"center",gap:10,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:14,padding:"11px 14px",marginBottom:14,flexWrap:"wrap"}}>
      <i className="ti ti-lock-open" style={{fontSize:18,color:K.wa}}/>
      <div style={{flex:1,minWidth:200,fontSize:13.5,color:K.t1,lineHeight:1.5}}>Le module <b>FE1</b> est en accès libre. Les modules FE2 à FE7 sont réservés aux apprenants disposant d'un accès actif.</div>
      {onSub&&<Bouton K={K} ch={LIB_ACCES} on={onSub} sx={{minHeight:38,padding:"8px 14px",fontSize:13}}/>}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
      {MODULES_FIN.map(m=>{const s=sc(m.id),lk=!acces(m);return <div key={m.id} onClick={()=>ouvrir(m)} className="hv tile"
        style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 15px",cursor:"pointer",opacity:lk?.75:1,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${m.col}16`,border:`1px solid ${m.col}35`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ti-${lk?"lock":m.ico}`} style={{fontSize:20,color:m.col}}/></div>
          {s?<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:s.pct>=60?K.emBg:K.erBg,color:s.pct>=60?K.em:K.er,border:`1px solid ${s.pct>=60?K.emBd:K.erBd}`}}>{s.pct} %</span>
            :m.libre?<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:K.inBg,color:K.in_,border:`1px solid ${K.inBd}`}}>Libre</span>:null}
        </div>
        <div style={{fontSize:11.5,fontWeight:800,color:m.col,letterSpacing:.6,textTransform:"uppercase"}}>{m.id} · {m.court}</div>
        <div style={{fontWeight:800,fontSize:15.5,color:K.t1,lineHeight:1.3}}>{m.titre}</div>
        <div style={{fontSize:13,color:K.t3,lineHeight:1.5,flex:1}}>{m.resume}</div>
        <div style={{display:"flex",gap:12,fontSize:12,color:K.t3,marginTop:2,flexWrap:"wrap"}}>
          <span><i className="ti ti-clock" style={{marginRight:3}}/>{m.duree}</span>
          <span><i className="ti ti-calculator" style={{marginRight:3}}/>{m.cas.length} cas</span>
          <span><i className="ti ti-headphones" style={{marginRight:3}}/>Audio</span>
        </div>
      </div>;})}
    </div>
    <div style={{fontSize:12.5,color:K.t3,lineHeight:1.6,marginTop:16}}>
      Exercices originaux d'Éco-Campus RDC. Pour s'entraîner davantage : <b>Pascale Recroix</b>, <i>DSCG 2 – Finance. 120 exercices corrigés</i>, Gualino (Lextenso), 2020.
    </div>
  </div>;
}
