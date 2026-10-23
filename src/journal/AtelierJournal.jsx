import React,{useState,useEffect,useMemo,useRef}from"react";
import{doc,updateDoc}from"firebase/firestore";
import*as ZAO from"./zao";
import{verifier,corrigeComplet}from"./moteur";
import{COMPTES}from"../ef/guide";

// ══════════════════ ATELIER « TENUE COMPTABLE » : du journal aux états financiers ══════════════════
// L'apprenant passe chaque écriture ; l'application vérifie (comptes par racine, montants au franc près,
// équilibre), explique, puis présente la balance du corrigé et ouvre l'atelier États financiers.
// Progression : localStorage (par appareil) ; score : users/{uid}.scores["JRN-ZAO"] = { s, t, pct, date }.
export const CAS_JOURNAL={id:"zao-immo",cle:"JRN-ZAO",societe:"ZAO IMMO SARL",exercice:2021,titre:"ZAO IMMO SARL — Tenue comptable 2021",
  intro:"Société immobilière de Kinshasa (location de bureaux, d'appartements et nuitées), assujettie à la TVA de 16 %. Comptabilité tenue en francs congolais : 1 $ = 2 000 FC pendant l'exercice, 2 350 FC au 31/12/2021. Passez les écritures de l'exercice puis celles d'inventaire, à partir du bilan d'ouverture."};
const fmt=v=>Math.round(Number(v)||0).toLocaleString("fr-FR").replace(/ | /g," ");
const chiffres=s=>String(s||"").replace(/\D/g,"");
const mono="'JetBrains Mono',monospace";
const PLAN={...Object.fromEntries(Object.entries(COMPTES).map(([c,x])=>[c,x.l])),...ZAO.LIBELLES};
const libelle=c=>{const a=chiffres(c);for(let n=a.length;n>0;n--){const l=PLAN[a.slice(0,n)];if(l)return n<a.length&&n<3?`${l} (racine ${a.slice(0,n)})`:l;}return"";};
const SUGG=Object.keys(PLAN).filter(c=>c.length>=2).sort();
const vide=()=>({c:"",d:"",cr:""});
const cleLocale=uid=>`ec_jrn_${CAS_JOURNAL.id}_${uid||"invite"}`;
const lire=uid=>{try{return JSON.parse(localStorage.getItem(cleLocale(uid))||"{}");}catch(e){return{};}};
const ecrire=(uid,v)=>{try{localStorage.setItem(cleLocale(uid),JSON.stringify(v));}catch(e){}};

function Bt({K,ch,on,v="p",ico,dis,sm,sx}){
  const st=v==="p"?{background:`linear-gradient(135deg,${K.emD},${K.em})`,color:"#fff",border:"none"}:v==="o"?{background:K.emBg,color:K.em,border:`1px solid ${K.emBd}`}:{background:K.c2,color:K.t1,border:`1px solid ${K.b1}`};
  return <button onClick={on} disabled={dis} className="bt" style={{...st,borderRadius:10,padding:sm?"7px 11px":"10px 15px",fontWeight:800,fontSize:sm?12.5:14,fontFamily:"'Outfit',sans-serif",cursor:dis?"not-allowed":"pointer",opacity:dis?.5:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:sm?32:42,...sx}}>
    {ico&&<i className={`ti ti-${ico}`} style={{fontSize:sm?14:16}}/>}{ch}</button>;
}
const Carte=({K,children,sx})=><div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"15px 16px",marginBottom:12,...sx}}>{children}</div>;
function Table({K,lignes,lib=true}){
  const tD=lignes.reduce((s,l)=>s+(Number(l.d)||0),0),tC=lignes.reduce((s,l)=>s+(Number(l.cr)||0),0);
  const td={padding:"6px 8px",borderTop:`1px solid ${K.b0}`,fontSize:13,color:K.t2,verticalAlign:"top"};
  return <div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${K.b0}`}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:lib?420:0}}>
    <thead><tr>{["Compte",...(lib?["Libellé"]:[]),"Débit","Crédit"].map((h,i)=><th key={h} style={{background:K.c2,color:K.t1,fontSize:12,fontWeight:800,padding:"7px 8px",textAlign:i>=(lib?2:1)?"right":"left"}}>{h}</th>)}</tr></thead>
    <tbody>{lignes.map((l,i)=><tr key={i}><td style={{...td,fontFamily:mono,fontWeight:700,color:K.t1}}>{l.c}</td>{lib&&<td style={td}>{ZAO.LIBELLES[l.c]||libelle(l.c)}</td>}
      <td style={{...td,textAlign:"right",fontFamily:mono}}>{Number(l.d)?fmt(l.d):""}</td><td style={{...td,textAlign:"right",fontFamily:mono}}>{Number(l.cr)?fmt(l.cr):""}</td></tr>)}
      <tr><td colSpan={lib?2:1} style={{...td,fontWeight:800,color:K.t1}}>Total</td><td style={{...td,textAlign:"right",fontFamily:mono,fontWeight:800}}>{fmt(tD)}</td><td style={{...td,textAlign:"right",fontFamily:mono,fontWeight:800}}>{fmt(tC)}</td></tr></tbody>
  </table></div>;
}
const STATUT={ok:{ico:"circle-check",l:"Réussie",c:"#0D7A6B"},ko:{ico:"alert-circle",l:"À revoir",c:"#C2410C"},corrige:{ico:"eye",l:"Corrigé consulté",c:"#4A5B78"}};

export default function AtelierJournal({K,mob,db,me,onBack,onEtats}){
  const C=useMemo(()=>corrigeComplet(ZAO),[]);
  const ops=C.ops,total=ops.length;
  const[etat,sEtat]=useState(()=>lire(me?.uid).etat||{}),[vue,sVue]=useState("sommaire"),[i,sI]=useState(()=>Math.min(lire(me?.uid).i||0,ops.length-1));
  useEffect(()=>{ecrire(me?.uid,{etat,i});},[etat,i,me?.uid]);
  const nOk=ops.filter(o=>etat[o.n]?.statut==="ok").length,nFait=ops.filter(o=>etat[o.n]?.statut).length;
  // Score enregistré sur la fiche de l'apprenant (meilleur effort : la progression locale reste la référence)
  const tScore=useRef(null);
  useEffect(()=>{
    if(!db||!me?.uid||me.role==="admin"||!nFait)return;
    clearTimeout(tScore.current);
    tScore.current=setTimeout(()=>{updateDoc(doc(db,"users",me.uid),{[`scores.${CAS_JOURNAL.cle}`]:{s:nOk,t:total,pct:Math.round(nOk/total*100),date:new Date().toISOString()}}).catch(()=>{});},1500);
    return()=>clearTimeout(tScore.current);
  },[nOk,nFait,db,me?.uid,me?.role,total]);
  const ouvrir=k=>{sI(k);sVue("op");window.scrollTo?.({top:0,behavior:"smooth"});};
  const maj=(n,p)=>sEtat(e=>({...e,[n]:{...(e[n]||{}),...p}}));
  const reprendre=ops.findIndex(o=>etat[o.n]?.statut!=="ok"&&etat[o.n]?.statut!=="corrige");

  const entete=<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:12}}>
    <Bt K={K} v="g" sm ico="arrow-left" ch={vue==="sommaire"?"Atelier États financiers":"Sommaire"} on={()=>vue==="sommaire"?onBack&&onBack():sVue("sommaire")}/>
    <div style={{fontSize:12.5,color:K.t3,fontWeight:700}}>{nOk} / {total} écritures réussies · {Math.round(nOk/total*100)} %</div>
  </div>;

  if(vue==="ouverture")return <div style={{animation:"fadeIn .3s ease"}}>{entete}<Carte K={K}>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:4}}>Bilan d'ouverture au 01/01/2021</div>
    <div style={{fontSize:13,color:K.t3,marginBottom:10,lineHeight:1.5}}>Soldes au 31/12/2020, en francs congolais. Les créances de 2020 (Congo Futur, ENGEN, Trace Congo) y figurent déjà.</div>
    <Table K={K} lignes={ZAO.OUVERTURE}/></Carte></div>;
  if(vue==="hyp")return <div style={{animation:"fadeIn .3s ease"}}>{entete}<Carte K={K}>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:8}}>Conventions du corrigé</div>
    {ZAO.HYPOTHESES.map(h=><div key={h} style={{fontSize:13.5,color:K.t2,lineHeight:1.55,padding:"6px 0",borderTop:`1px solid ${K.b0}`}}>{h}</div>)}</Carte></div>;
  if(vue==="balance")return <div style={{animation:"fadeIn .3s ease"}}>{entete}<Carte K={K}>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:4}}>Balance après inventaire au 31/12/2021 (corrigé)</div>
    <div style={{fontSize:13,color:K.t3,marginBottom:10,lineHeight:1.5}}>Soldes N calculés à partir du bilan d'ouverture et des {total} écritures du corrigé. Résultat net : <b style={{color:K.t1}}>{fmt(C.R.N.cr.XI)} FC</b> · IBP : <b style={{color:K.t1}}>{fmt(C.ibp)} FC</b>.</div>
    <Table K={K} lignes={C.lignes.map(l=>({c:l.c,d:l.dn,cr:l.cn}))}/>
    {onEtats&&<div style={{marginTop:12}}><Bt K={K} ico="report-money" ch="Monter les états financiers de ZAO IMMO" on={onEtats}/></div>}
  </Carte></div>;

  if(vue==="op"){const o=ops[i];return <OpVue key={o.n} K={K} mob={mob} o={o} total={total} e={etat[o.n]||{}} maj={p=>maj(o.n,p)} entete={entete}
    prec={i>0?()=>ouvrir(i-1):null} suiv={i<total-1?()=>ouvrir(i+1):()=>sVue("balance")} dernier={i===total-1}/>;}

  return <div style={{animation:"fadeIn .3s ease"}}>
    {entete}
    <div style={{background:`linear-gradient(135deg,${K.emD},${K.em} 60%,#0D7A6B)`,borderRadius:20,padding:mob?"18px 16px":"24px 26px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-notebook" style={{position:"absolute",right:-8,bottom:-20,fontSize:140,opacity:.1}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1.1,textTransform:"uppercase",opacity:.85}}>Tenue comptable · SYSCOHADA révisé</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:28,lineHeight:1.2,margin:"6px 0 8px"}}>Du journal aux états financiers : {CAS_JOURNAL.societe}</div>
      <div style={{fontSize:14,opacity:.92,lineHeight:1.55,maxWidth:640}}>{CAS_JOURNAL.intro}</div>
      <div style={{height:8,background:"rgba(255,255,255,.2)",borderRadius:99,overflow:"hidden",margin:"14px 0 6px",maxWidth:420}}><div style={{width:`${nFait/total*100}%`,height:"100%",background:"#fff",borderRadius:99}}/></div>
      <div style={{fontSize:12.5,opacity:.9}}>{nFait} / {total} opérations traitées · {nOk} réussies sans le corrigé</div>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
      <Bt K={K} ico="player-play" ch={nFait?"Continuer":"Commencer"} on={()=>ouvrir(reprendre<0?0:reprendre)}/>
      <Bt K={K} v="g" ico="table" ch="Bilan d'ouverture" on={()=>sVue("ouverture")}/>
      <Bt K={K} v="g" ico="list-check" ch="Conventions" on={()=>sVue("hyp")}/>
      <Bt K={K} v="g" ico="report-money" ch="Balance et états financiers" on={()=>sVue("balance")}/>
      {nFait>0&&<Bt K={K} v="g" ico="refresh" ch="Recommencer" on={()=>{if(window.confirm("Effacer toutes vos saisies et recommencer l'exercice ?")){sEtat({});sI(0);}}}/>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
      {ops.map((o,k)=>{const s=STATUT[etat[o.n]?.statut];return <button key={o.n} onClick={()=>ouvrir(k)} className="bt hv" style={{textAlign:"left",display:"flex",gap:10,alignItems:"flex-start",background:K.card,border:`1px solid ${s?`${s.c}55`:K.b0}`,borderRadius:12,padding:"10px 12px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
        <div style={{width:30,height:30,borderRadius:9,background:s?`${s.c}18`:K.c2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:13,color:s?s.c:K.t2}}>{s?<i className={`ti ti-${s.ico}`} style={{fontSize:17}}/>:o.n}</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11.5,fontWeight:800,color:o.inventaire?"#7C3AED":K.t3}}>{o.n}. {o.date}{o.inventaire?" · inventaire":""}</div>
          <div style={{fontSize:13,color:K.t2,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{o.enonce}</div>
        </div>
      </button>;})}
    </div>
  </div>;
}

function OpVue({K,mob,o,total,e,maj,entete,prec,suiv,dernier}){
  const[lignes,sLignes]=useState(()=>e.lignes?.length?e.lignes:[vide(),vide()]);
  const[res,sRes]=useState(null),[aide,sAide]=useState(false),[voir,sVoir]=useState(e.statut==="corrige"||e.statut==="ok");
  const setL=(k,p)=>sLignes(L=>L.map((l,j)=>j===k?{...l,...p}:l));
  const num=v=>Number(chiffres(v))||0;
  const saisie=lignes.map(l=>({c:l.c,d:num(l.d),cr:num(l.cr)}));
  const tD=saisie.reduce((s,l)=>s+l.d,0),tC=saisie.reduce((s,l)=>s+l.cr,0);
  const verif=()=>{const r=verifier(o,saisie);sRes(r);const essais=(e.essais||0)+1;
    maj({lignes,essais,statut:r.ok?(e.statut==="corrige"?"corrige":"ok"):(e.statut==="ok"?"ok":e.statut==="corrige"?"corrige":"ko")});if(r.ok)sVoir(true);};
  const corrige=()=>{sVoir(true);if(e.statut!=="ok")maj({lignes,statut:"corrige"});};
  const champ={width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:9,padding:"9px 10px",color:K.t1,fontSize:14,fontFamily:mono};
  const cols=mob?"minmax(0,1.15fr) minmax(0,1fr) minmax(0,1fr) 30px":"minmax(0,.9fr) minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) 34px";
  const s=STATUT[e.statut];
  return <div style={{animation:"fadeIn .3s ease"}}>
    {entete}
    <Carte K={K}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontWeight:900,fontSize:15,color:K.t1}}>Opération {o.n} / {total}</span>
          <span style={{fontSize:12,fontWeight:800,color:K.em,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"2px 9px"}}>{o.date}</span>
          {o.inventaire&&<span style={{fontSize:12,fontWeight:800,color:"#7C3AED",background:"#7C3AED14",borderRadius:99,padding:"2px 9px"}}>Inventaire</span>}
          {s&&<span style={{fontSize:12,fontWeight:800,color:s.c}}><i className={`ti ti-${s.ico}`}/> {s.l}</span>}
        </div>
        <div style={{display:"flex",gap:6}}><Bt K={K} v="g" sm ico="chevron-left" ch="" on={prec} dis={!prec}/><Bt K={K} v="g" sm ico="chevron-right" ch="" on={suiv}/></div>
      </div>
      <div style={{fontSize:15,color:K.t1,lineHeight:1.6}}>{o.enonce}</div>
      {o.aide&&<div style={{marginTop:8}}>{aide?<div style={{fontSize:13,color:"#C98A1B",background:"#C98A1B12",border:"1px solid #C98A1B40",borderRadius:10,padding:"8px 11px"}}><i className="ti ti-bulb"/> {o.aide}</div>
        :<button onClick={()=>sAide(true)} className="bt" style={{background:"none",border:"none",color:"#C98A1B",fontWeight:700,fontSize:13,cursor:"pointer",padding:0,fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-bulb"/> Un indice ?</button>}</div>}
    </Carte>
    <Carte K={K}>
      <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}>Votre écriture <span style={{fontWeight:600,fontSize:12.5,color:K.t3}}>(montants en FC)</span></div>
      <div style={{display:"grid",gridTemplateColumns:cols,gap:6,fontSize:11.5,fontWeight:800,color:K.t3,marginBottom:4}}>
        <span>Compte</span>{!mob&&<span>Libellé</span>}<span style={{textAlign:"right"}}>Débit</span><span style={{textAlign:"right"}}>Crédit</span><span/>
      </div>
      <datalist id="plan-syscohada">{SUGG.map(c=><option key={c} value={c}>{PLAN[c]}</option>)}</datalist>
      {lignes.map((l,k)=>{const lb=libelle(l.c);return <div key={k} style={{marginBottom:6}}>
        <div style={{display:"grid",gridTemplateColumns:cols,gap:6,alignItems:"center"}}>
          <input value={l.c} onChange={ev=>setL(k,{c:chiffres(ev.target.value).slice(0,8)})} list="plan-syscohada" inputMode="numeric" placeholder="ex. 521" aria-label={`Compte, ligne ${k+1}`} style={champ}/>
          {!mob&&<div style={{fontSize:12.5,color:lb?K.t2:K.t3,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis"}}>{lb||"—"}</div>}
          <input value={l.d} onChange={ev=>setL(k,{d:ev.target.value,cr:ev.target.value?"":l.cr})} onBlur={()=>setL(k,{d:num(l.d)?fmt(num(l.d)):""})} inputMode="numeric" placeholder="0" aria-label={`Débit, ligne ${k+1}`} style={{...champ,textAlign:"right"}}/>
          <input value={l.cr} onChange={ev=>setL(k,{cr:ev.target.value,d:ev.target.value?"":l.d})} onBlur={()=>setL(k,{cr:num(l.cr)?fmt(num(l.cr)):""})} inputMode="numeric" placeholder="0" aria-label={`Crédit, ligne ${k+1}`} style={{...champ,textAlign:"right"}}/>
          <button onClick={()=>sLignes(L=>L.length>1?L.filter((_,j)=>j!==k):[vide()])} className="bt" aria-label="Supprimer la ligne" style={{background:"none",border:"none",color:K.t3,cursor:"pointer",padding:0}}><i className="ti ti-x" style={{fontSize:16}}/></button>
        </div>
        {mob&&lb&&<div style={{fontSize:11.5,color:K.t3,margin:"2px 0 0 2px"}}>{lb}</div>}
      </div>;})}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",margin:"8px 0 12px"}}>
        <button onClick={()=>sLignes(L=>[...L,vide()])} className="bt" style={{background:"none",border:`1px dashed ${K.b1}`,borderRadius:9,color:K.t2,fontWeight:700,fontSize:13,cursor:"pointer",padding:"7px 11px",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-plus"/> Ajouter une ligne</button>
        <div style={{fontSize:12.5,fontFamily:mono,color:Math.abs(tD-tC)<=1&&tD?K.em:K.t3}}>D {fmt(tD)} · C {fmt(tC)}{tD||tC?Math.abs(tD-tC)<=1?" · équilibrée":` · écart ${fmt(Math.abs(tD-tC))}`:""}</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Bt K={K} ico="check" ch="Vérifier" on={verif} dis={!tD&&!tC}/>
        <Bt K={K} v="g" ico="eye" ch="Voir le corrigé" on={corrige}/>
        {(res?.ok||voir)&&<Bt K={K} v="o" ico={dernier?"report-money":"arrow-right"} ch={dernier?"Balance et états financiers":"Opération suivante"} on={suiv}/>}
      </div>
      {res&&<div style={{marginTop:12,borderRadius:12,padding:"11px 13px",background:res.ok?K.emBg:K.erBg,border:`1px solid ${res.ok?K.emBd:K.erBd}`}}>
        <div style={{fontWeight:800,fontSize:14,color:res.ok?K.em:K.er,marginBottom:res.ok?0:6}}><i className={`ti ti-${res.ok?"circle-check":"alert-circle"}`}/> {res.ok?"Écriture juste, bravo !":`À revoir : ${res.nOk} compte${res.nOk>1?"s":""} juste${res.nOk>1?"s":""} sur ${res.nTotal}`}</div>
        {!res.ok&&<>
          {!res.equilibre&&<div style={{fontSize:13,color:K.t2,marginBottom:4}}>• L'écriture n'est pas équilibrée : débit {fmt(res.totD)} FC, crédit {fmt(res.totC)} FC.</div>}
          {res.detail.filter(g=>!g.ok).map(g=><div key={g.r} style={{fontSize:13,color:K.t2,marginBottom:3}}>• {g.lignes?`Montant à revoir sur le compte ${g.r}… (${libelle(g.comptes[0])})`:`Il manque un compte : pensez à ${libelle(g.comptes[0]).toLowerCase()||g.r}`}{g.lignes&&Math.sign(g.saisi)!==Math.sign(g.attendu)&&g.attendu?" : vérifiez aussi le sens (débit ou crédit).":"."}</div>)}
          {res.inattendus.map(a=><div key={a} style={{fontSize:13,color:K.t2,marginBottom:3}}>• Le compte {a}{libelle(a)?` (${libelle(a)})`:""} n'est pas attendu dans cette écriture.</div>)}
          {(e.essais||0)>=2&&!voir&&<div style={{fontSize:12.5,color:K.t3,marginTop:6}}>Bloqué ? Consultez le corrigé, puis réessayez sur l'opération suivante.</div>}
        </>}
      </div>}
    </Carte>
    {voir&&<Carte K={K} sx={{borderLeft:`4px solid ${K.em}`}}>
      <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}><i className="ti ti-book-2" style={{color:K.em}}/> Corrigé</div>
      <Table K={K} lignes={o.lignes} lib={!mob}/>
      <div style={{fontSize:13.5,color:K.t2,lineHeight:1.6,marginTop:10}}>{o.expl}</div>
    </Carte>}
  </div>;
}
