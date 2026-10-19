import React,{useState,useEffect,useRef,useMemo}from"react";
import{collection,doc,addDoc,updateDoc,deleteDoc,onSnapshot,query,where,getDocs,arrayUnion,arrayRemove}from"firebase/firestore";
import{computeAll,parseBalance,mapCompte,num,fmt,LIB,ACTIF,PASSIF,CR,TFT}from"./ef/engine";
import{CAS_PRATIQUES}from"./ef/casPratiques";

// ══════════════════ ATELIER ÉTATS FINANCIERS SYSCOHADA (multi-utilisateurs) ══════════════════
// Collection Firestore « ef_dossiers » : un document par dossier (balance, compléments TFT, membres, suivi).
const COLL="ef_dossiers";
const STATUTS={
  brouillon:{l:"Brouillon",c:"#8B97BC"},
  soumis:{l:"Soumis au formateur",c:"#DAA854"},
  renvoye:{l:"À corriger",c:"#C05A2A"},
  valide:{l:"Validé",c:"#1A6B3A"},
};
const now=()=>new Date().toISOString();
const fDT=i=>!i?"—":new Date(i).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const mono="'JetBrains Mono',monospace";

const downloadCSV=(name,rows)=>{
  const esc=v=>{const s=v==null?"":String(v);return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
  const blob=new Blob(["﻿"+rows.map(r=>r.map(esc).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name.replace(/[^\w.-]+/g,"_")+".csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
const PRINT_CSS=`@media print{body *{visibility:hidden!important;}.ef-print,.ef-print *{visibility:visible!important;color:#000!important;background:#fff!important;border-color:#999!important;}.ef-print{position:absolute;left:0;top:0;width:100%;}.ef-noprint{display:none!important;}}`;

// ── Petits composants ──────────────────────────────────────────────────────────
function B({K,ch,on,v="p",sm,dis,ico,title}){
  const st={p:{background:`linear-gradient(135deg,${K.emD},${K.em})`,color:"#F5EDD8",border:"none"},g:{background:"transparent",color:K.t2,border:`1px solid ${K.b1}`},d:{background:K.erBg,color:K.er,border:`1px solid ${K.erBd}`},w:{background:K.waBg,color:K.wa,border:`1px solid ${K.waBd}`}}[v];
  return <button title={title} onClick={dis?undefined:on} className="bt" style={{...st,display:"inline-flex",alignItems:"center",gap:5,padding:sm?"6px 10px":"9px 15px",borderRadius:8,fontSize:sm?11:13,fontWeight:700,cursor:dis?"not-allowed":"pointer",opacity:dis?.45:1,fontFamily:"'Outfit',sans-serif",minHeight:sm?32:38,whiteSpace:"nowrap"}}>{ico&&<i className={`ti ti-${ico}`} style={{fontSize:sm?13:15}}/>}{ch}</button>;
}
function Modal({K,title,onClose,children,w=520}){
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(5px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
    <div style={{width:"100%",maxWidth:w,background:K.card,border:`1px solid ${K.b1}`,borderRadius:"16px 16px 0 0",padding:"16px 18px max(16px,env(safe-area-inset-bottom))",maxHeight:"92vh",overflowY:"auto",animation:"su .26s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
        <div style={{fontWeight:700,fontSize:15,color:K.t1}}>{title}</div>
        <button onClick={onClose} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
      </div>{children}
    </div>
  </div>;
}
const fieldSt=K=>({width:"100%",padding:"9px 11px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif",minHeight:40});
function Field({K,lb,children,note}){return <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>{lb}</div>{children}{note&&<div style={{color:K.t3,fontSize:11,marginTop:3,lineHeight:1.4}}>{note}</div>}</div>;}
const Badge=({s})=>{const x=STATUTS[s]||STATUTS.brouillon;return <span style={{background:`${x.c}1A`,color:x.c,border:`1px solid ${x.c}44`,borderRadius:99,padding:"2px 9px",fontSize:10,fontWeight:800,whiteSpace:"nowrap"}}>{x.l}</span>;};

// Cellule montant : affichage formaté, saisie brute au focus
function NumCell({K,value,onChange,dis}){
  const[ed,sEd]=useState(null);
  const st={width:"100%",minWidth:96,padding:"5px 6px",background:ed!==null?K.card:"transparent",border:`1px solid ${ed!==null?K.emBd:"transparent"}`,borderRadius:5,color:K.t1,fontSize:12,textAlign:"right",fontFamily:mono,outline:"none"};
  if(dis)return <div style={{...st,border:"1px solid transparent"}}>{value?fmt(value):""}</div>;
  return <input inputMode="decimal" style={st} value={ed!==null?ed:(value?fmt(value):"")}
    onFocus={()=>sEd(value?String(value):"")} onChange={e=>sEd(e.target.value)}
    onBlur={()=>{const v=num(ed);sEd(null);if(v!==num(value))onChange(v);}}
    onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}/>;
}

// ══════════════════ RACINE ══════════════════
export default function EtatsFinanciers({db,K,mob,me,ok=true,onSub}){
  const staff=me.role==="formateur"||me.role==="admin";
  const[dossiers,sDos]=useState([]),[loading,sL]=useState(true),[err,sErr]=useState("");
  const[openId,sOpen]=useState(null),[creer,sCreer]=useState(false),[scope,sScope]=useState(staff?"tous":"miens"),[filtre,sFiltre]=useState("");
  useEffect(()=>{
    if(!me.uid)return;
    const q=staff&&scope==="tous"?collection(db,COLL):query(collection(db,COLL),where("membres","array-contains",me.uid));
    sL(true);
    return onSnapshot(q,snap=>{sDos(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||"")));sL(false);sErr("");},
      e=>{sErr("Accès aux dossiers refusé : "+e.message);sL(false);});
  },[db,me.uid,staff,scope]);
  const cur=dossiers.find(d=>d.id===openId);
  if(!ok&&!staff)return <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"36px 20px",textAlign:"center"}}>
    <i className="ti ti-lock" style={{fontSize:34,color:K.t3}}/>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,margin:"10px 0 6px"}}>Atelier États financiers SYSCOHADA</div>
    <div style={{color:K.t3,fontSize:13,marginBottom:16}}>Réservé aux apprenants disposant d'un abonnement actif.</div>
    {onSub&&<B K={K} ch="Obtenir l'accès" on={onSub}/>}
  </div>;
  if(cur)return <><style>{PRINT_CSS}</style><Dossier db={db} K={K} mob={mob} me={me} staff={staff} d={cur} onBack={()=>sOpen(null)}/></>;
  const list=dossiers.filter(d=>!filtre||d.statut===filtre);
  return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:14}}>
      <div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?20:24,color:K.t1}}>Atelier États financiers</div>
        <div style={{color:K.t3,fontSize:12,marginTop:3}}>SYSCOHADA révisé · Système Normal · Bilan, Compte de résultat, TFT générés depuis la balance</div>
      </div>
      <B K={K} ico="plus" ch="Nouveau dossier" on={()=>sCreer(true)}/>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {staff&&[["tous","Tous les dossiers"],["miens","Mes dossiers"]].map(([k,l])=><B key={k} K={K} sm v={scope===k?"p":"g"} ch={l} on={()=>sScope(k)}/>)}
      <select value={filtre} onChange={e=>sFiltre(e.target.value)} style={{...fieldSt(K),width:"auto",minHeight:32,padding:"5px 9px",fontSize:12}}>
        <option value="">Tous statuts</option>{Object.entries(STATUTS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
      </select>
    </div>
    {err&&<div style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"9px 12px",fontSize:12,marginBottom:10}}>{err}</div>}
    {loading?<div style={{color:K.t3,fontSize:13,padding:20}}>Chargement…</div>
    :!list.length?<div style={{background:K.card,border:`1px dashed ${K.b1}`,borderRadius:14,padding:"36px 20px",textAlign:"center"}}>
      <i className="ti ti-report-money" style={{fontSize:34,color:K.em}}/>
      <div style={{fontWeight:700,color:K.t1,margin:"8px 0 4px"}}>Aucun dossier</div>
      <div style={{color:K.t3,fontSize:12,marginBottom:14}}>Créez un dossier vierge ou partez du cas pratique « SA KIN NÉGOCE ».</div>
      <B K={K} ico="plus" ch="Créer mon premier dossier" on={()=>sCreer(true)}/>
    </div>
    :<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
      {list.map(d=>{const r=computeAll(d.lignes||[],d.complements);const errs=r.ctrl.filter(c=>c.niv==="err").length;
        return <div key={d.id} onClick={()=>sOpen(d.id)} className="hv" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:6}}>
            <div style={{fontWeight:800,color:K.t1,fontSize:14}}>{d.societe||"Sans nom"}</div><Badge s={d.statut}/>
          </div>
          <div style={{color:K.t3,fontSize:11,fontFamily:mono,marginBottom:8}}>Exercice {d.exercice} · {d.devise} · {(d.lignes||[]).length} comptes</div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:K.t2}}>
            <span><i className="ti ti-users" style={{fontSize:12}}/> {Object.values(d.membresInfo||{}).map(m=>m.nom).join(", ")||d.ownerNom}</span>
            <span style={{color:errs?K.er:K.em,fontWeight:700}}>{errs?`${errs} anomalie(s)`:"✓ Cohérent"}</span>
          </div>
          <div style={{color:K.t3,fontSize:10,marginTop:6}}>Modifié {fDT(d.updatedAt)}{d.updatedByNom?` par ${d.updatedByNom}`:""}</div>
        </div>;})}
    </div>}
    {creer&&<NewDossier db={db} K={K} me={me} onClose={()=>sCreer(false)} onCreated={id=>{sCreer(false);sOpen(id);}}/>}
  </div>;
}

function NewDossier({db,K,me,onClose,onCreated}){
  const[f,sF]=useState({societe:"",exercice:new Date().getFullYear()-1,devise:"CDF",forme:"SA",src:"vierge"});
  const[busy,sBusy]=useState(false),[err,sErr]=useState("");
  const cas=CAS_PRATIQUES.find(c=>c.id===f.src);
  const create=async()=>{
    if(!cas&&!f.societe.trim())return sErr("Indiquez la raison sociale.");
    sBusy(true);
    try{
      const r=await addDoc(collection(db,COLL),{
        societe:cas?cas.societe:f.societe.trim(),exercice:cas?cas.exercice:Number(f.exercice)||f.exercice,devise:cas?cas.devise:f.devise,forme:f.forme,
        casId:cas?cas.id:null,lignes:cas?cas.lignes:[],complements:{},
        ownerUid:me.uid,ownerNom:me.nom||"",membres:[me.uid],membresInfo:{[me.uid]:{nom:me.nom||"",mail:me.mail||""}},
        statut:"brouillon",commentaires:[],createdAt:now(),updatedAt:now(),updatedBy:me.uid,updatedByNom:me.nom||""});
      onCreated(r.id);
    }catch(e){sErr(e.message);sBusy(false);}
  };
  const st=fieldSt(K);
  return <Modal K={K} title="Nouveau dossier d'états financiers" onClose={onClose}>
    <Field K={K} lb="Point de départ">
      <select style={st} value={f.src} onChange={e=>sF({...f,src:e.target.value})}>
        <option value="vierge">Dossier vierge (saisie ou import de ma balance)</option>
        {CAS_PRATIQUES.map(c=><option key={c.id} value={c.id}>Cas pratique — {c.titre}</option>)}
      </select>
    </Field>
    {cas?<div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",fontSize:12,color:K.t2,lineHeight:1.55,marginBottom:12}}>{cas.enonce[0]}</div>
    :<>
      <Field K={K} lb="Raison sociale"><input style={st} value={f.societe} onChange={e=>sF({...f,societe:e.target.value})} placeholder="Ex. SARL MBOKA SERVICES"/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <Field K={K} lb="Exercice"><input style={st} value={f.exercice} onChange={e=>sF({...f,exercice:e.target.value})}/></Field>
        <Field K={K} lb="Devise"><select style={st} value={f.devise} onChange={e=>sF({...f,devise:e.target.value})}>{["CDF","USD","XAF","XOF","EUR"].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field K={K} lb="Forme"><select style={st} value={f.forme} onChange={e=>sF({...f,forme:e.target.value})}>{["SA","SARL","SAS","SNC","EI","GIE"].map(x=><option key={x}>{x}</option>)}</select></Field>
      </div>
    </>}
    {err&&<div style={{color:K.er,fontSize:12,marginBottom:10}}>{err}</div>}
    <B K={K} ch={busy?"Création…":"Créer le dossier →"} on={create} dis={busy}/>
  </Modal>;
}

// ══════════════════ DOSSIER ══════════════════
function Dossier({db,K,mob,me,staff,d,onBack}){
  const[tab,sTab]=useState("bal");
  const[lignes,sLignes]=useState(d.lignes||[]),[comp,sComp]=useState(d.complements||{});
  const dirty=useRef(false),timer=useRef(null),[saveSt,sSaveSt]=useState("");
  // Synchronisation temps réel : on adopte la version distante tant qu'aucune saisie locale n'est en attente
  useEffect(()=>{if(!dirty.current){sLignes(d.lignes||[]);sComp(d.complements||{});}},[d.lignes,d.complements]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const isMember=(d.membres||[]).includes(me.uid);
  const canEdit=staff||(isMember&&["brouillon","renvoye"].includes(d.statut||"brouillon"));
  const ref=doc(db,COLL,d.id);
  const persist=(patch)=>{
    dirty.current=true;sSaveSt("…");clearTimeout(timer.current);
    timer.current=setTimeout(async()=>{
      try{await updateDoc(ref,{...patch(),updatedAt:now(),updatedBy:me.uid,updatedByNom:me.nom||""});sSaveSt("✓ Enregistré");}
      catch(e){sSaveSt("⚠ "+e.message);}
      dirty.current=false;
    },900);
  };
  const latest=useRef({lignes,comp});latest.current={lignes,comp};
  const setL=fn=>{sLignes(prev=>{const n=typeof fn==="function"?fn(prev):fn;latest.current.lignes=n;return n;});persist(()=>({lignes:latest.current.lignes}));};
  const setC=n=>{sComp(n);latest.current.comp=n;persist(()=>({complements:latest.current.comp}));};
  const R=useMemo(()=>computeAll(lignes,comp),[lignes,comp]);
  const nErr=R.ctrl.filter(c=>c.niv==="err").length,nWarn=R.ctrl.filter(c=>c.niv==="warn").length;
  const cas=CAS_PRATIQUES.find(c=>c.id===d.casId);
  const TABS=[["bal","table","Balance"],["ctrl","shield-check",`Contrôles${nErr+nWarn?` (${nErr+nWarn})`:""}`],["bilan","scale","Bilan"],["cr","chart-bar","Compte de résultat"],["tft","arrows-exchange","TFT"],["suivi","users","Équipe & suivi"]];
  const meta={societe:d.societe,exercice:d.exercice,devise:d.devise};
  return <div style={{animation:"fadeIn .3s ease"}}>
    <div className="ef-noprint" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:12}}>
      <B K={K} v="g" sm ico="arrow-left" ch="Dossiers" on={onBack}/>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontWeight:800,fontSize:17,color:K.t1}}>{d.societe}</div>
        <div style={{color:K.t3,fontSize:11,fontFamily:mono}}>Exercice {d.exercice} · {d.forme||""} · {d.devise}{cas?" · Cas pratique":""}</div>
      </div>
      <Badge s={d.statut}/>
      <span style={{fontSize:11,color:saveSt.startsWith("⚠")?K.er:K.t3,minWidth:80}}>{saveSt||(canEdit?"":"Lecture seule")}</span>
    </div>
    {cas&&tab==="bal"&&<details className="ef-noprint" style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:10,padding:"9px 12px",marginBottom:10,fontSize:12,color:K.t2,lineHeight:1.6}}>
      <summary style={{cursor:"pointer",fontWeight:700,color:K.wa}}>Énoncé du cas pratique</summary>
      {cas.enonce.map((p,i)=><p key={i} style={{marginTop:6}}>{p}</p>)}
    </details>}
    <div className="tn ef-noprint" style={{borderBottom:`1px solid ${K.b0}`,marginBottom:12}}>
      {TABS.map(([k,ico,l])=>{const a=tab===k;return <button key={k} onClick={()=>sTab(k)} className="bt" style={{display:"flex",alignItems:"center",gap:5,padding:"8px 12px",border:"none",background:a?K.c2:"transparent",color:a?K.t1:K.t3,fontWeight:a?700:500,fontSize:12,whiteSpace:"nowrap",borderBottom:a?`2px solid ${K.em}`:"2px solid transparent",borderRadius:"6px 6px 0 0",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
        <i className={`ti ti-${ico}`} style={{fontSize:14,color:a?K.em:K.t3}}/>{l}</button>;})}
    </div>
    {tab==="bal"&&<BalanceTab K={K} mob={mob} lignes={lignes} setL={setL} canEdit={canEdit} R={R} meta={meta}/>}
    {tab==="ctrl"&&<ControlsTab K={K} R={R} go={sTab}/>}
    {tab==="bilan"&&<BilanTab K={K} R={R} meta={meta}/>}
    {tab==="cr"&&<CRTab K={K} R={R} meta={meta}/>}
    {tab==="tft"&&<TFTTab K={K} R={R} meta={meta} comp={comp} setC={setC} canEdit={canEdit}/>}
    {tab==="suivi"&&<SuiviTab db={db} K={K} me={me} staff={staff} d={d} dref={ref} onDeleted={onBack} nErr={nErr}/>}
  </div>;
}

// ── Styles de tableau ────────────────────────────────────────────────────────────
const th=K=>({padding:"7px 8px",fontSize:10,fontWeight:800,color:K.t3,textAlign:"right",textTransform:"uppercase",letterSpacing:.4,borderBottom:`1px solid ${K.b1}`,whiteSpace:"nowrap",background:K.c2,position:"sticky",top:0});
const td=K=>({padding:"5px 8px",fontSize:12,color:K.t1,borderBottom:`1px solid ${K.b0}`,textAlign:"right",fontFamily:mono,whiteSpace:"nowrap"});
const Wrap=({K,children,print})=><div className={print?"ef-print":undefined} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,overflow:"hidden"}}>{children}</div>;
const Scroll=({children,max})=><div style={{overflowX:"auto",maxHeight:max,overflowY:max?"auto":undefined,WebkitOverflowScrolling:"touch"}}>{children}</div>;
const PrintHead=({K,meta,titre})=><div style={{padding:"12px 14px",borderBottom:`1px solid ${K.b0}`,display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
  <div><div style={{fontWeight:800,fontSize:15,color:K.t1}}>{titre}</div><div style={{color:K.t3,fontSize:11}}>{meta.societe} · Exercice clos le 31/12/{meta.exercice} · Montants en {meta.devise}</div></div>
  <div style={{color:K.t3,fontSize:10,alignSelf:"flex-end"}}>SYSCOHADA révisé — Système Normal</div>
</div>;
const Toolbar=({K,children})=><div className="ef-noprint" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{children}</div>;

// ── BALANCE ──────────────────────────────────────────────────────────────────────
function BalanceTab({K,mob,lignes,setL,canEdit,R,meta}){
  const[q,sQ]=useState(""),[imp,sImp]=useState(false);
  const upd=(i,k,v)=>setL(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const view=lignes.map((x,i)=>({x,i})).filter(({x})=>!q||x.c.startsWith(q)||(x.l||"").toLowerCase().includes(q.toLowerCase()));
  const tot=k=>lignes.reduce((s,x)=>s+num(x[k]),0);
  const T={dn:tot("dn"),cn:tot("cn"),dn1:tot("dn1"),cn1:tot("cn1")};
  const okN=Math.abs(T.dn-T.cn)<0.5,okN1=Math.abs(T.dn1-T.cn1)<0.5;
  const exp=()=>downloadCSV(`Balance_${meta.societe}_${meta.exercice}`,[["Compte","Intitulé","Débit N","Crédit N","Débit N-1","Crédit N-1","Rubrique"],...lignes.map(x=>{const m=mapCompte(x.c);return[x.c,x.l,num(x.dn),num(x.cn),num(x.dn1),num(x.cn1),m?(typeof m.r==="object"?`${m.r.d}/${m.r.c}`:m.r):""];})]);
  const inp={background:"transparent",border:"1px solid transparent",borderRadius:5,color:K.t1,fontSize:12,padding:"5px 6px",outline:"none",width:"100%"};
  return <>
    <Toolbar K={K}>
      {canEdit&&<B K={K} sm ico="clipboard" ch="Coller depuis Excel" on={()=>sImp(true)}/>}
      {canEdit&&<B K={K} sm v="g" ico="plus" ch="Ajouter un compte" on={()=>setL(p=>[...p,{c:"",l:"",dn:0,cn:0,dn1:0,cn1:0}])}/>}
      <B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp} dis={!lignes.length}/>
      <input placeholder="Filtrer : compte ou intitulé" value={q} onChange={e=>sQ(e.target.value)} style={{...fieldSt(K),width:mob?"100%":220,minHeight:32,padding:"5px 10px",fontSize:12}}/>
    </Toolbar>
    <Wrap K={K}>
      <Scroll max="62vh">
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
          <thead><tr>
            <th style={{...th(K),textAlign:"left",width:90}}>Compte</th><th style={{...th(K),textAlign:"left"}}>Intitulé</th><th style={{...th(K),textAlign:"center"}}>Rubrique</th>
            <th style={th(K)}>Débit N</th><th style={th(K)}>Crédit N</th><th style={th(K)}>Débit N-1</th><th style={th(K)}>Crédit N-1</th>{canEdit&&<th style={th(K)}/>}
          </tr></thead>
          <tbody>
            {view.map(({x,i})=>{const m=mapCompte(x.c);let rub=m?m.r:null;
              if(rub&&typeof rub==="object")rub=num(x.dn)-num(x.cn)>=0?rub.d:rub.c;
              return <tr key={i}>
                <td style={{...td(K),textAlign:"left",padding:"2px 4px"}}>{canEdit?<input style={{...inp,fontFamily:mono}} value={x.c} onChange={e=>upd(i,"c",e.target.value.replace(/\D/g,""))}/>:x.c}</td>
                <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:"2px 4px",minWidth:200}}>{canEdit?<input style={inp} value={x.l} onChange={e=>upd(i,"l",e.target.value)}/>:x.l}</td>
                <td style={{...td(K),textAlign:"center"}} title={rub?LIB[rub]+(m.amort?" (amort./dépréc.)":""):"Compte non reconnu"}>
                  {x.c?<span style={{fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:5,background:rub?K.emBg:K.erBg,color:rub?K.em:K.er}}>{rub?rub+(m.amort?"·A":""):"?"}</span>:null}
                </td>
                {["dn","cn","dn1","cn1"].map(k=><td key={k} style={{...td(K),padding:"2px 4px"}}><NumCell K={K} value={x[k]} dis={!canEdit} onChange={v=>upd(i,k,v)}/></td>)}
                {canEdit&&<td style={{...td(K),padding:"2px 4px"}}><button title="Supprimer" onClick={()=>setL(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-trash" style={{fontSize:14}}/></button></td>}
              </tr>;})}
            {!lignes.length&&<tr><td colSpan={8} style={{...td(K),textAlign:"center",fontFamily:"'Outfit',sans-serif",color:K.t3,padding:24}}>Balance vide — collez votre balance depuis Excel ou ajoutez les comptes un par un.</td></tr>}
          </tbody>
          <tfoot><tr>
            <td colSpan={3} style={{...td(K),textAlign:"left",fontWeight:800,fontFamily:"'Outfit',sans-serif",background:K.c2}}>TOTAUX · {lignes.length} comptes</td>
            {["dn","cn","dn1","cn1"].map(k=><td key={k} style={{...td(K),fontWeight:800,background:K.c2}}>{fmt(T[k])}</td>)}{canEdit&&<td style={{...td(K),background:K.c2}}/>}
          </tr></tfoot>
        </table>
      </Scroll>
    </Wrap>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8,fontSize:12}}>
      <span style={{color:okN?K.em:K.er,fontWeight:700}}>{okN?"✓ Balance N équilibrée":`✗ Balance N déséquilibrée : écart ${fmt(T.dn-T.cn)}`}</span>
      {(T.dn1||T.cn1)?<span style={{color:okN1?K.em:K.er,fontWeight:700}}>{okN1?"✓ Balance N-1 équilibrée":`✗ Écart N-1 : ${fmt(T.dn1-T.cn1)}`}</span>:<span style={{color:K.t3}}>Colonnes N-1 vides (nécessaires au comparatif et au TFT)</span>}
      <span style={{color:K.t3}}>Rubrique : référence SYSCOHADA du poste · « A » = amortissement/dépréciation</span>
    </div>
    {imp&&<ImportModal K={K} onClose={()=>sImp(false)} onImport={(rows,mode)=>{setL(p=>mode==="add"?[...p,...rows]:rows);sImp(false);}}/>}
  </>;
}

function ImportModal({K,onClose,onImport}){
  const[txt,sTxt]=useState(""),[mode,sMode]=useState("replace");
  const rows=useMemo(()=>parseBalance(txt),[txt]);
  return <Modal K={K} title="Importer une balance depuis Excel" onClose={onClose} w={640}>
    <div style={{fontSize:12,color:K.t2,lineHeight:1.6,marginBottom:10}}>
      Copiez les colonnes dans Excel puis collez-les ci-dessous, dans cet ordre :<br/>
      <b style={{fontFamily:mono}}>Compte | Intitulé | Débit N | Crédit N | Débit N-1 | Crédit N-1</b><br/>
      Les lignes d'en-tête et de totaux sont ignorées automatiquement. Formats acceptés : « 1 250 000,50 » ou « 1250000.50 », séparateur tabulation ou point-virgule.
    </div>
    <textarea value={txt} onChange={e=>sTxt(e.target.value)} rows={10} placeholder={"101\tCapital social\t0\t250000000\t0\t200000000\n5211\tBanque\t159550000\t0\t84000000\t0"} style={{...fieldSt(K),fontFamily:mono,fontSize:11,resize:"vertical"}}/>
    <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",margin:"10px 0"}}>
      <span style={{fontSize:12,color:rows.length?K.em:K.t3,fontWeight:700}}>{rows.length} compte(s) détecté(s)</span>
      <label style={{fontSize:12,color:K.t2}}><input type="radio" checked={mode==="replace"} onChange={()=>sMode("replace")}/> Remplacer la balance</label>
      <label style={{fontSize:12,color:K.t2}}><input type="radio" checked={mode==="add"} onChange={()=>sMode("add")}/> Ajouter à la balance</label>
    </div>
    <B K={K} ch="Importer →" on={()=>onImport(rows,mode)} dis={!rows.length}/>
  </Modal>;
}

// ── CONTRÔLES ────────────────────────────────────────────────────────────────────
function ControlsTab({K,R,go}){
  const col={ok:K.em,warn:K.wa,err:K.er},ico={ok:"circle-check",warn:"alert-triangle",err:"circle-x"};
  const N=R.N;
  const kpi=[["Chiffre d'affaires",N.cr.XB],["Valeur ajoutée",N.cr.XC],["EBE",N.cr.XD],["Résultat net",N.cr.XI],["Total bilan",N.act.BZ.n],["Trésorerie nette",N.act.BT.n-N.pas.DT]];
  return <>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:12}}>
      {kpi.map(([l,v])=><div key={l} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:10,padding:"10px 12px"}}>
        <div style={{color:K.t3,fontSize:11}}>{l}</div><div style={{color:v<0?K.er:K.t1,fontWeight:800,fontSize:15,fontFamily:mono,marginTop:3}}>{fmt(v)}</div></div>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {R.ctrl.map((c,i)=><div key={i} style={{background:K.card,border:`1px solid ${K.b0}`,borderLeft:`3px solid ${col[c.niv]}`,borderRadius:9,padding:"10px 12px",display:"flex",gap:10}}>
        <i className={`ti ti-${ico[c.niv]}`} style={{fontSize:18,color:col[c.niv],flexShrink:0}}/>
        <div><div style={{fontWeight:700,fontSize:13,color:K.t1}}>{c.titre}</div><div style={{fontSize:12,color:K.t2,marginTop:2,lineHeight:1.5}}>{c.detail}</div></div>
      </div>)}
    </div>
    <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}><B K={K} sm v="g" ch="Voir le Bilan" on={()=>go("bilan")}/><B K={K} sm v="g" ch="Voir le Compte de résultat" on={()=>go("cr")}/><B K={K} sm v="g" ch="Voir le TFT" on={()=>go("tft")}/></div>
  </>;
}

// ── BILAN ────────────────────────────────────────────────────────────────────────
const rowSt=(K,t)=>t==="t"?{fontWeight:800,background:K.emBg}:t==="s"?{fontWeight:700,background:K.c2}:{};
const accts=(R,ref)=>[...new Set([...(R.N.detail[ref]||[]),...(R.P1.detail[ref]||[])])].join(", ");
function BilanTab({K,R,meta}){
  const{N,P1}=R;
  const exp=()=>downloadCSV(`Bilan_${meta.societe}_${meta.exercice}`,[["ACTIF"],["Réf","Libellé","Brut","Amort./Dépréc.","Net N","Net N-1"],...ACTIF.map(x=>[x.ref,x.lib,Math.round(N.act[x.ref].b),Math.round(N.act[x.ref].a),Math.round(N.act[x.ref].n),Math.round(P1.act[x.ref].n)]),[],["PASSIF"],["Réf","Libellé","Net N","Net N-1"],...PASSIF.map(x=>[x.ref,x.lib,Math.round(N.pas[x.ref]),Math.round(P1.pas[x.ref])])]);
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer / PDF" on={()=>window.print()}/><B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp}/></Toolbar>
    <Wrap K={K} print>
      <PrintHead K={K} meta={meta} titre="BILAN"/>
      <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
        <thead><tr><th style={{...th(K),textAlign:"left",width:44}}>Réf</th><th style={{...th(K),textAlign:"left"}}>ACTIF</th><th style={th(K)}>Brut</th><th style={th(K)}>Amort. / Dépréc.</th><th style={th(K)}>Net N</th><th style={th(K)}>Net N-1</th></tr></thead>
        <tbody>{ACTIF.map(x=>{const v=N.act[x.ref],v1=P1.act[x.ref];return <tr key={x.ref} style={rowSt(K,x.t)} title={accts(R,x.ref)}>
          <td style={{...td(K),textAlign:"left",color:K.t3}}>{x.ref}</td><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:x.t==="d"?18:8}}>{x.lib}</td>
          <td style={td(K)}>{fmt(v.b)}</td><td style={td(K)}>{fmt(v.a)}</td><td style={{...td(K),fontWeight:700}}>{fmt(v.n)}</td><td style={td(K)}>{fmt(v1.n)}</td></tr>;})}</tbody>
      </table></Scroll>
      <div style={{height:14}}/>
      <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
        <thead><tr><th style={{...th(K),textAlign:"left",width:44}}>Réf</th><th style={{...th(K),textAlign:"left"}}>PASSIF</th><th style={th(K)}>Net N</th><th style={th(K)}>Net N-1</th></tr></thead>
        <tbody>{PASSIF.map(x=><tr key={x.ref} style={rowSt(K,x.t)} title={accts(R,x.ref)}>
          <td style={{...td(K),textAlign:"left",color:K.t3}}>{x.ref}</td><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:x.t==="d"?18:8}}>{x.lib}</td>
          <td style={{...td(K),fontWeight:700}}>{fmt(N.pas[x.ref])}</td><td style={td(K)}>{fmt(P1.pas[x.ref])}</td></tr>)}</tbody>
      </table></Scroll>
    </Wrap>
  </>;
}

// ── COMPTE DE RÉSULTAT ───────────────────────────────────────────────────────────
function CRTab({K,R,meta}){
  const{N,P1}=R;
  const exp=()=>downloadCSV(`CompteResultat_${meta.societe}_${meta.exercice}`,[["Réf","Libellé","Signe","Net N","Net N-1"],...CR.map(x=>[x.ref,x.lib,x.s||"",Math.round(N.cr[x.ref]),Math.round(P1.cr[x.ref])])]);
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer / PDF" on={()=>window.print()}/><B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp}/></Toolbar>
    <Wrap K={K} print>
      <PrintHead K={K} meta={meta} titre="COMPTE DE RÉSULTAT"/>
      <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
        <thead><tr><th style={{...th(K),textAlign:"left",width:44}}>Réf</th><th style={{...th(K),textAlign:"left"}}>Libellés</th><th style={{...th(K),textAlign:"center",width:44}}>+/-</th><th style={th(K)}>Net N</th><th style={th(K)}>Net N-1</th></tr></thead>
        <tbody>{CR.map(x=><tr key={x.ref} style={rowSt(K,x.t)} title={accts(R,x.ref)}>
          <td style={{...td(K),textAlign:"left",color:K.t3}}>{x.ref}</td><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:x.t==="d"?18:8}}>{x.lib}</td>
          <td style={{...td(K),textAlign:"center",color:K.t3}}>{x.s||""}</td>
          <td style={{...td(K),fontWeight:x.t!=="d"?800:500,color:x.t!=="d"&&N.cr[x.ref]<0?K.er:K.t1}}>{fmt(N.cr[x.ref])}</td><td style={td(K)}>{fmt(P1.cr[x.ref])}</td></tr>)}</tbody>
      </table></Scroll>
    </Wrap>
  </>;
}

// ── TFT ──────────────────────────────────────────────────────────────────────────
const COMP=[
  ["cbIncorp","Valeur brute des immobilisations incorporelles cédées"],
  ["cbCorp","Valeur brute des immobilisations corporelles cédées"],
  ["cbFin","Valeur brute des immobilisations financières cédées / remboursées"],
  ["pcFin","Prix de cession des immobilisations financières (inclus dans le compte 82)"],
  ["nouvEmp","Nouveaux emprunts obtenus (vide = variation nette des dettes financières)"],
  ["prelev","Prélèvements de l'exploitant sur le capital"],
];
function TFTTab({K,R,meta,comp,setC,canEdit}){
  const t=R.tft;
  if(!t)return <div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"18px",fontSize:13,color:K.t2,lineHeight:1.6}}>
    <b style={{color:K.wa}}>Balance N-1 requise.</b> Le Tableau des flux de trésorerie se construit par différence entre les bilans N et N-1 : renseignez les colonnes « Débit N-1 / Crédit N-1 » dans l'onglet Balance.</div>;
  const ok=Math.abs(t.ZH-t.tresoBilan)<0.5;
  const exp=()=>downloadCSV(`TFT_${meta.societe}_${meta.exercice}`,[["Réf","Libellé","Exercice N"],...TFT.filter(x=>x.t!=="h").map(x=>[x.ref,x.lib,Math.round(t[x.ref])])]);
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer / PDF" on={()=>window.print()}/><B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp}/></Toolbar>
    <div className="ef-noprint" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:3}}>Informations complémentaires</div>
      <div style={{color:K.t3,fontSize:11,marginBottom:10,lineHeight:1.5}}>Données non déductibles de la balance seule. Les acquisitions sont calculées ainsi : variation des valeurs brutes + valeurs brutes cédées.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:"0 10px"}}>
        {COMP.map(([k,l])=><Field key={k} K={K} lb={l}><NumCellBox K={K} value={comp[k]} dis={!canEdit} onChange={v=>setC({...comp,[k]:v===""?"":v})}/></Field>)}
      </div>
    </div>
    <Wrap K={K} print>
      <PrintHead K={K} meta={meta} titre="TABLEAU DES FLUX DE TRÉSORERIE"/>
      <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
        <thead><tr><th style={{...th(K),textAlign:"left",width:44}}>Réf</th><th style={{...th(K),textAlign:"left"}}>Libellés</th><th style={th(K)}>Exercice N</th></tr></thead>
        <tbody>{TFT.map(x=>x.t==="h"?<tr key={x.ref}><td colSpan={3} style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",fontWeight:700,color:K.in_,paddingTop:10}}>{x.lib}</td></tr>
          :<tr key={x.ref} style={rowSt(K,x.t)}><td style={{...td(K),textAlign:"left",color:K.t3}}>{x.ref}</td><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:x.t==="d"?18:8}}>{x.lib}</td>
          <td style={{...td(K),fontWeight:x.t!=="d"?800:500,color:t[x.ref]<0?K.er:K.t1}}>{fmt(t[x.ref])}</td></tr>)}</tbody>
      </table></Scroll>
      <div style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:ok?K.em:K.wa}}>{ok?"✓":"⚠"} Contrôle : ZH = {fmt(t.ZH)} — Trésorerie nette au bilan (BT − DT) = {fmt(t.tresoBilan)}</div>
    </Wrap>
  </>;
}
function NumCellBox({K,value,onChange,dis}){
  const[ed,sEd]=useState(null);
  const has=value!==undefined&&value!=="";
  return <input disabled={dis} inputMode="decimal" style={{...fieldSt(K),fontFamily:mono,textAlign:"right"}} placeholder="0"
    value={ed!==null?ed:(has?fmt(value):"")} onFocus={()=>sEd(has?String(value):"")} onChange={e=>sEd(e.target.value)}
    onBlur={()=>{const v=ed.trim()===""?"":num(ed);sEd(null);if(v!==value)onChange(v);}}/>;
}

// ── ÉQUIPE & SUIVI ───────────────────────────────────────────────────────────────
function SuiviTab({db,K,me,staff,d,dref,onDeleted,nErr}){
  const[mail,sMail]=useState(""),[msg,sMsg]=useState(""),[txt,sTxt]=useState(""),[busy,sBusy]=useState(false);
  const isOwner=d.ownerUid===me.uid;
  const stamp={updatedAt:now(),updatedBy:me.uid,updatedByNom:me.nom||""};
  const comment=(texte,extra={})=>updateDoc(dref,{...extra,...stamp,commentaires:arrayUnion({auteur:me.nom||me.mail||"",uid:me.uid,role:me.role,texte,date:now()})});
  const invite=async()=>{
    const m=mail.trim().toLowerCase();if(!m.includes("@"))return sMsg("Adresse e-mail invalide.");
    sBusy(true);sMsg("");
    try{
      const snap=await getDocs(query(collection(db,"users"),where("mail","==",m)));
      if(snap.empty){sMsg("Aucun compte Éco-Campus avec cette adresse.");sBusy(false);return;}
      const u=snap.docs[0];
      if((d.membres||[]).includes(u.id)){sMsg("Déjà membre du dossier.");sBusy(false);return;}
      await updateDoc(dref,{membres:arrayUnion(u.id),[`membresInfo.${u.id}`]:{nom:u.data().nom||m,mail:m},...stamp});
      sMail("");sMsg("✓ Collaborateur ajouté : il voit désormais ce dossier dans son atelier.");
    }catch(e){sMsg("⚠ "+e.message);}
    sBusy(false);
  };
  const retirer=async uid=>{if(!window.confirm("Retirer ce membre du dossier ?"))return;const info={...(d.membresInfo||{})};delete info[uid];await updateDoc(dref,{membres:arrayRemove(uid),membresInfo:info,...stamp});};
  const setStatut=async(statut,texte)=>{sBusy(true);try{await comment(texte,{statut});sTxt("");}catch(e){sMsg("⚠ "+e.message);}sBusy(false);};
  const st=d.statut||"brouillon";
  const card={background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 14px",marginBottom:10};
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:10,alignItems:"start"}}>
    <div>
      <div style={card}>
        <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:8}}>Équipe du dossier</div>
        {Object.entries(d.membresInfo||{}).map(([uid,m])=><div key={uid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${K.b0}`}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:K.emBg,color:K.em,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12}}>{(m.nom||"?")[0].toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:K.t1}}>{m.nom}{uid===d.ownerUid&&<span style={{color:K.t3,fontWeight:500}}> · créateur</span>}</div><div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis"}}>{m.mail}</div></div>
          {(isOwner||staff)&&uid!==d.ownerUid&&<button onClick={()=>retirer(uid)} title="Retirer" style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-user-minus"/></button>}
        </div>)}
        {(isOwner||staff)&&<div style={{display:"flex",gap:6,marginTop:10}}>
          <input value={mail} onChange={e=>sMail(e.target.value)} placeholder="E-mail d'un collègue apprenant" style={{...fieldSt(K),minHeight:34,fontSize:12}}/>
          <B K={K} sm ico="user-plus" ch="Inviter" on={invite} dis={busy}/>
        </div>}
        {msg&&<div style={{fontSize:12,color:msg.startsWith("✓")?K.em:K.er,marginTop:6}}>{msg}</div>}
        <div style={{fontSize:11,color:K.t3,marginTop:8,lineHeight:1.5}}>Tous les membres modifient la balance en temps réel. Dernière modification : {fDT(d.updatedAt)}{d.updatedByNom?` par ${d.updatedByNom}`:""}.</div>
      </div>
      <div style={card}>
        <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:8}}>Circuit de validation</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {["brouillon","soumis","valide"].map((s,i)=><React.Fragment key={s}>{i>0&&<i className="ti ti-chevron-right" style={{color:K.t3,fontSize:12}}/>}<span style={{opacity:st===s||(s==="brouillon"&&st==="renvoye")?1:.4}}><Badge s={s==="brouillon"&&st==="renvoye"?"renvoye":s}/></span></React.Fragment>)}
        </div>
        <textarea value={txt} onChange={e=>sTxt(e.target.value)} rows={3} placeholder={staff?"Appréciation / corrections attendues…":"Message au formateur (facultatif)…"} style={{...fieldSt(K),resize:"vertical",marginBottom:8}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {!staff&&["brouillon","renvoye"].includes(st)&&<B K={K} sm ico="send" ch="Soumettre au formateur" dis={busy} on={()=>{if(nErr&&!window.confirm(`Il reste ${nErr} anomalie(s) bloquante(s). Soumettre quand même ?`))return;setStatut("soumis",txt.trim()||"Dossier soumis pour correction.");}}/>}
          {!staff&&st==="soumis"&&<B K={K} sm v="g" ico="arrow-back-up" ch="Reprendre le dossier" dis={busy} on={()=>setStatut("brouillon",txt.trim()||"Dossier repris par l'apprenant.")}/>}
          {staff&&st!=="valide"&&<B K={K} sm ico="circle-check" ch="Valider" dis={busy} on={()=>setStatut("valide",txt.trim()||"Dossier validé.")}/>}
          {staff&&<B K={K} sm v="w" ico="arrow-back-up" ch="Renvoyer pour correction" dis={busy||!txt.trim()} title="Saisissez d'abord les corrections attendues" on={()=>setStatut("renvoye",txt.trim())}/>}
          <B K={K} sm v="g" ico="message" ch="Commenter" dis={busy||!txt.trim()} on={async()=>{await comment(txt.trim());sTxt("");}}/>
        </div>
      </div>
      {(isOwner||staff)&&<B K={K} sm v="d" ico="trash" ch="Supprimer le dossier" on={async()=>{if(window.confirm(`Supprimer définitivement le dossier « ${d.societe} » ?`)){await deleteDoc(dref);onDeleted();}}}/>}
    </div>
    <div style={card}>
      <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:8}}>Fil de discussion</div>
      {!(d.commentaires||[]).length&&<div style={{color:K.t3,fontSize:12}}>Aucun échange pour l'instant.</div>}
      {[...(d.commentaires||[])].reverse().map((c,i)=><div key={i} style={{padding:"8px 10px",background:c.role==="apprenant"?K.c2:K.emBg,borderRadius:9,marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,marginBottom:3}}><b style={{color:K.t1}}>{c.auteur}{c.role!=="apprenant"&&<span style={{color:K.em}}> · {c.role}</span>}</b><span style={{color:K.t3}}>{fDT(c.date)}</span></div>
        <div style={{fontSize:12,color:K.t2,whiteSpace:"pre-wrap",lineHeight:1.5}}>{c.texte}</div>
      </div>)}
    </div>
  </div>;
}
