import React,{useState,useEffect,useRef,useMemo}from"react";
import{collection,doc,addDoc,setDoc,getDoc,updateDoc,deleteDoc,onSnapshot,query,where,getDocs,arrayUnion,arrayRemove}from"firebase/firestore";
import{computeAll,parseBalance,mapCompte,num,fmt,LIB,ACTIF,PASSIF,CR,TFT}from"./ef/engine";
import{CAS_PRATIQUES}from"./ef/casPratiques";
import AtelierJournal,{CAS_JOURNAL}from"./journal/AtelierJournal";
import{DEVISES,FORMES,PROVINCES,IDENTITE,FISC_DEFAUT,CATEGORIES,FORFAIT_SANS_CA,categorieDe,computeIBP}from"./ef/rdc";
import{REGLES,ficheCompte,anomaliesSens,rubriqueDe}from"./ef/guide";
import GuideComptes from"./ef/GuideComptes";
import{computeNotes,fmtPct,TRANCHES,NATURES_TITRES,EFF_COLS,EFF_PROPRE,EFF_STATUT,EFF_EXT}from"./ef/notes";

// ══════════════════ ATELIER ÉTATS FINANCIERS SYSCOHADA (multi-utilisateurs) ══════════════════
// Collection Firestore « ef_dossiers » : un document par dossier (balance, compléments TFT, membres, suivi).
const COLL="ef_dossiers";
const STATUTS={
  brouillon:{l:"Brouillon",c:"#8B97BC"},
  soumis:{l:"Soumis au formateur",c:"#DAA854"},
  renvoye:{l:"À corriger",c:"#C05A2A"},
  valide:{l:"Validé",c:"#0A2A5C"},
};
const now=()=>new Date().toISOString();

// ── Annuaire des invitations ─────────────────────────────────────────────────────
// Collection « ef_annuaire » : une fiche par utilisateur, identifiée par son e-mail en minuscules,
// ne contenant que l'uid, le nom et l'e-mail. Les règles Firestore autorisent la lecture d'une fiche
// par son identifiant exact (get) mais pas le listage : on ne peut retrouver que les e-mails déjà connus.
const ANNUAIRE="ef_annuaire";
export async function inscrireAnnuaire(db,{uid,nom,mail}){
  const m=(mail||"").trim().toLowerCase();
  if(!uid||!m.includes("@"))return;
  try{await setDoc(doc(db,ANNUAIRE,m),{uid,nom:nom||m.split("@")[0],mail:m,maj:now()},{merge:true});}
  catch(e){console.log("inscrireAnnuaire",e.message);}
}
async function chercherCompte(db,m,staff){
  const fiche=await getDoc(doc(db,ANNUAIRE,m));
  if(fiche.exists())return{uid:fiche.data().uid,nom:fiche.data().nom||m};
  if(staff){ // l'encadrement a accès à « users » : utile pour les comptes pas encore inscrits à l'annuaire
    const snap=await getDocs(query(collection(db,"users"),where("mail","==",m)));
    if(!snap.empty)return{uid:snap.docs[0].id,nom:snap.docs[0].data().nom||m};
  }
  return null;
}
const fDT=i=>!i?"—":new Date(i).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const mono="'JetBrains Mono',monospace";

const downloadCSV=(name,rows)=>{
  const esc=v=>{const s=v==null?"":String(v);return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
  const blob=new Blob(["﻿"+rows.map(r=>r.map(esc).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name.replace(/[^\w.-]+/g,"_")+".csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
const PRINT_CSS=`@media print{body *{visibility:hidden!important;}.ef-print,.ef-print *{visibility:visible!important;color:#000!important;background:#fff!important;border-color:#999!important;}.ef-print{position:absolute;left:0;top:0;width:100%;}.ef-noprint{display:none!important;}.ef-printonly{display:block!important;}table.ef-printonly{display:table!important;}.ef-pb{break-before:page;}}.ef-printonly{display:none;}.ef-swipe{display:none;}@media(max-width:639px){.ef-swipe{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;opacity:.65;padding:6px 12px;}}`;

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
export default function EtatsFinanciers({db,K,mob,me,ok=true,onSub,journal0=false,guide0=false}){
  const staff=me.role==="formateur"||me.role==="admin";
  useEffect(()=>{if(me.role!=="admin")inscrireAnnuaire(db,me);},[db,me.uid,me.nom,me.mail,me.role]);
  const[dossiers,sDos]=useState([]),[loading,sL]=useState(true),[err,sErr]=useState("");
  const[openId,sOpen]=useState(null),[guide,sGuide]=useState(guide0),[creer,sCreer]=useState(false),[journal,sJournal]=useState(journal0),[scope,sScope]=useState(staff?"tous":"miens"),[filtre,sFiltre]=useState("");
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
  if(journal)return <AtelierJournal K={K} mob={mob} db={db} me={me} onBack={()=>sJournal(false)} onEtats={()=>{sJournal(false);sCreer(CAS_JOURNAL.id);}}/>;
  if(guide)return <div style={{animation:"fadeIn .3s ease"}}><div style={{marginBottom:12}}><B K={K} v="g" sm ico="arrow-left" ch="Dossiers" on={()=>sGuide(false)}/></div><GuideView K={K} mob={mob}/></div>;
  if(cur)return <><style>{PRINT_CSS}</style><Dossier db={db} K={K} mob={mob} me={me} staff={staff} d={cur} onBack={()=>sOpen(null)}/></>;
  const list=dossiers.filter(d=>!filtre||d.statut===filtre);
  return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:14}}>
      <div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?20:24,color:K.t1}}>Atelier États financiers</div>
        <div style={{color:K.t3,fontSize:12,marginTop:3}}>République Démocratique du Congo · SYSCOHADA révisé · Système Normal · Bilan, Compte de résultat, TFT et IBP générés depuis la balance</div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><B K={K} v="g" ico="notebook" ch="Monographie ZAO IMMO (journal)" on={()=>sJournal(true)}/><B K={K} v="g" ico="book" ch="Guide des comptes (SYSCOHADA révisé)" on={()=>sGuide(true)}/><B K={K} ico="plus" ch="Nouveau dossier" on={()=>sCreer(true)}/></div>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {staff&&[["tous","Tous les dossiers"],["miens","Mes dossiers"]].map(([k,l])=><B key={k} K={K} sm v={scope===k?"p":"g"} ch={l} on={()=>sScope(k)}/>)}
      <select value={filtre} onChange={e=>sFiltre(e.target.value)} style={{...fieldSt(K),width:"auto",minHeight:32,padding:"5px 9px",fontSize:12}}>
        <option value="">Tous statuts</option>{Object.entries(STATUTS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
      </select>
    </div>
    <div onClick={()=>sJournal(true)} className="hv" style={{display:"flex",gap:12,alignItems:"center",background:`linear-gradient(135deg,${K.emBg},${K.card})`,border:`1px solid ${K.emBd}`,borderRadius:14,padding:"12px 14px",marginBottom:12,cursor:"pointer"}}>
      <div style={{width:42,height:42,borderRadius:12,background:K.em,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-notebook" style={{fontSize:21,color:"#fff"}}/></div>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14.5,color:K.t1}}>Nouveau : monographie ZAO IMMO, du journal aux états financiers</div>
        <div style={{fontSize:12.5,color:K.t3,lineHeight:1.45}}>Passez les 35 écritures de {CAS_JOURNAL.societe} (exercice {CAS_JOURNAL.exercice}) : l'application corrige et explique chaque écriture, puis vous montez le Bilan et le Compte de résultat.</div></div>
      <i className="ti ti-chevron-right" style={{color:K.em,fontSize:20}}/>
    </div>
    {err&&<div style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"9px 12px",fontSize:12,marginBottom:10}}>{err}</div>}
    {loading?<div style={{color:K.t3,fontSize:13,padding:20}}>Chargement…</div>
    :!list.length?<div style={{background:K.card,border:`1px dashed ${K.b1}`,borderRadius:14,padding:"36px 20px",textAlign:"center"}}>
      <i className="ti ti-report-money" style={{fontSize:34,color:K.em}}/>
      <div style={{fontWeight:700,color:K.t1,margin:"8px 0 4px"}}>Aucun dossier</div>
      <div style={{color:K.t3,fontSize:12,marginBottom:14}}>Créez un dossier vierge ou partez d'un cas pratique (SA KIN NÉGOCE, SA MEUBLES DU FLEUVE, SARL MALACHITE LOGISTIQUE).</div>
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
    {creer&&<NewDossier db={db} K={K} me={me} src0={typeof creer==="string"?creer:"vierge"} onClose={()=>sCreer(false)} onCreated={id=>{sCreer(false);sOpen(id);}}/>}
  </div>;
}

function NewDossier({db,K,me,src0="vierge",onClose,onCreated}){
  const[f,sF]=useState({societe:"",exercice:new Date().getFullYear()-1,devise:"CDF",forme:"SA",province:"Kinshasa",src:src0});
  const[busy,sBusy]=useState(false),[err,sErr]=useState("");
  const cas=CAS_PRATIQUES.find(c=>c.id===f.src);
  const create=async()=>{
    if(!cas&&!f.societe.trim())return sErr("Indiquez la raison sociale.");
    sBusy(true);
    try{
      const r=await addDoc(collection(db,COLL),{
        societe:cas?cas.societe:f.societe.trim(),exercice:cas?cas.exercice:Number(f.exercice)||f.exercice,devise:cas?cas.devise:f.devise,forme:cas?.identite?.forme||f.forme,
        casId:cas?cas.id:null,lignes:cas?cas.lignes:[],complements:{},fiscal:{...FISC_DEFAUT},
        identite:cas?{...(cas.identite||{})}:{forme:f.forme,province:f.province,ville:f.province==="Kinshasa"?"Kinshasa":"",duree:"12",dureeN1:"12"},
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field K={K} lb="Exercice"><input style={st} value={f.exercice} onChange={e=>sF({...f,exercice:e.target.value})}/></Field>
        <Field K={K} lb="Monnaie de présentation"><select style={st} value={f.devise} onChange={e=>sF({...f,devise:e.target.value})}>{DEVISES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field>
        <Field K={K} lb="Forme juridique"><select style={st} value={f.forme} onChange={e=>sF({...f,forme:e.target.value})}>{FORMES.map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field K={K} lb="Province du siège"><select style={st} value={f.province} onChange={e=>sF({...f,province:e.target.value})}>{PROVINCES.map(x=><option key={x}>{x}</option>)}</select></Field>
      </div>
    </>}
    {err&&<div style={{color:K.er,fontSize:12,marginBottom:10}}>{err}</div>}
    <B K={K} ch={busy?"Création…":"Créer le dossier →"} on={create} dis={busy}/>
  </Modal>;
}

// ══════════════════ DOSSIER ══════════════════
function Dossier({db,K,mob,me,staff,d,onBack}){
  const[tab,sTab]=useState("bal");
  const[lignes,sLignes]=useState(d.lignes||[]),[comp,sComp]=useState(d.complements||{}),[ident,sIdent]=useState(d.identite||{}),[fisc,sFisc]=useState(d.fiscal||FISC_DEFAUT),[notesS,sNotesS]=useState(d.notes||{});
  const dirty=useRef(false),timer=useRef(null),[saveSt,sSaveSt]=useState("");
  // Synchronisation temps réel : on adopte la version distante tant qu'aucune saisie locale n'est en attente
  useEffect(()=>{if(!dirty.current){sLignes(d.lignes||[]);sComp(d.complements||{});sIdent(d.identite||{});sFisc(d.fiscal||FISC_DEFAUT);sNotesS(d.notes||{});}},[d.lignes,d.complements,d.identite,d.fiscal,d.notes]);
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
  const latest=useRef({});latest.current={lignes,comp,ident,fisc,notesS};
  const setL=fn=>{sLignes(prev=>{const n=typeof fn==="function"?fn(prev):fn;latest.current.lignes=n;return n;});persist(()=>({lignes:latest.current.lignes}));};
  const setC=n=>{sComp(n);latest.current.comp=n;persist(()=>({complements:latest.current.comp}));};
  const setI=n=>{sIdent(n);latest.current.ident=n;persist(()=>({identite:latest.current.ident}));};
  const setF=n=>{sFisc(n);latest.current.fisc=n;persist(()=>({fiscal:latest.current.fisc}));};
  const setN=n=>{sNotesS(n);latest.current.notesS=n;persist(()=>({notes:latest.current.notesS}));};
  const R=useMemo(()=>computeAll(lignes,comp),[lignes,comp]);
  const nErr=R.ctrl.filter(c=>c.niv==="err").length,nWarn=R.ctrl.filter(c=>c.niv==="warn").length;
  const cas=CAS_PRATIQUES.find(c=>c.id===d.casId);
  const TABS=[["id","id-badge-2","Identification"],["bal","table","Balance"],["ctrl","shield-check",`Contrôles${nErr+nWarn?` (${nErr+nWarn})`:""}`],["bilan","scale","Bilan"],["cr","chart-bar","Compte de résultat"],["tft","arrows-exchange","TFT"],["notes","notes","Notes annexes"],["fisc","receipt-tax","Fiscalité (IBP)"],["guide","book","Règles & comptes"],["suivi","users","Équipe & suivi"]];
  const meta={societe:d.societe,exercice:d.exercice,devise:d.devise,ident};
  return <div style={{animation:"fadeIn .3s ease"}}>
    <div className="ef-noprint" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:12}}>
      <B K={K} v="g" sm ico="arrow-left" ch="Dossiers" on={onBack}/>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontWeight:800,fontSize:17,color:K.t1}}>{d.societe}</div>
        <div style={{color:K.t3,fontSize:11,fontFamily:mono}}>Exercice {d.exercice} · {ident.forme||d.forme||""} · {d.devise}{ident.nif?` · NIF ${ident.nif}`:""}{cas?" · Cas pratique":""}</div>
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
    {tab==="id"&&<IdentTab K={K} ident={ident} setI={setI} canEdit={canEdit} meta={meta}/>}
    {tab==="notes"&&<NotesTab K={K} mob={mob} R={R} saisies={notesS} setN={setN} canEdit={canEdit} meta={meta}/>}
    {tab==="fisc"&&<FiscTab K={K} R={R} fisc={fisc} setF={setF} canEdit={canEdit} meta={meta}/>}
    {tab==="bal"&&<BalanceTab K={K} mob={mob} lignes={lignes} setL={setL} canEdit={canEdit} R={R} meta={meta}/>}
    {tab==="ctrl"&&<ControlsTab K={K} R={R} go={sTab} lignes={lignes}/>}
    {tab==="guide"&&<GuideView K={K} mob={mob} lignes={lignes}/>}
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
const Scroll=({children,max})=><><div className="ef-swipe ef-noprint"><i className="ti ti-arrows-horizontal"/> Faites glisser le tableau pour voir toutes les colonnes</div><div style={{overflowX:"auto",maxHeight:max,overflowY:max?"auto":undefined,WebkitOverflowScrolling:"touch"}}>{children}</div></>;
const SIGLES=["HAO","TVA","IBP","RDC","OHADA","SYSCOHADA","CNSS","INPP","ONEM","DGI","TFT"];
const casPhrase=t=>(t.charAt(0)+t.slice(1).toLowerCase()).replace(/[a-zà-ÿ]+/gi,w=>SIGLES.includes(w.toUpperCase())?w.toUpperCase():w);
const PrintHead=({K,meta,titre})=>{const i=meta.ident||{};const ids=[i.nif&&`NIF : ${i.nif}`,i.rccm&&`RCCM : ${i.rccm}`,i.idnat&&`Id. Nat. : ${i.idnat}`].filter(Boolean).join(" · ");
  return <div style={{padding:"12px 14px",borderBottom:`1px solid ${K.b0}`,display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
  <div><div style={{fontWeight:800,fontSize:15,color:K.t1}}>{titre}</div><div style={{color:K.t3,fontSize:11}}>{meta.societe}{i.sigle?` (${i.sigle})`:""} · Exercice clos le 31/12/{meta.exercice} · Montants en {meta.devise==="USD"?"dollars américains (USD)":"francs congolais (CDF)"}</div>{ids&&<div style={{color:K.t3,fontSize:11}}>{ids}</div>}</div>
  <div style={{color:K.t3,fontSize:10,alignSelf:"flex-end",textAlign:"right"}}>République Démocratique du Congo<br/>SYSCOHADA révisé — Système Normal</div>
</div>;};
const Toolbar=({K,children})=><div className="ef-noprint" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{children}</div>;

// ── BALANCE ──────────────────────────────────────────────────────────────────────
function BalanceTab({K,mob,lignes,setL,canEdit,R,meta}){
  const[q,sQ]=useState(""),[imp,sImp]=useState(false),[fiche,sFiche]=useState(null),[mvt,sMvt]=useState(()=>lignes.some(x=>num(x.md)||num(x.mc)));
  const COLS=["dn","cn","dn1","cn1",...(mvt?["md","mc"]:[])];
  const upd=(i,k,v)=>setL(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const view=lignes.map((x,i)=>({x,i})).filter(({x})=>!q||x.c.startsWith(q)||(x.l||"").toLowerCase().includes(q.toLowerCase()));
  const tot=k=>lignes.reduce((s,x)=>s+num(x[k]),0);
  const T={dn:tot("dn"),cn:tot("cn"),dn1:tot("dn1"),cn1:tot("cn1"),md:tot("md"),mc:tot("mc")};
  const okN=Math.abs(T.dn-T.cn)<0.5,okN1=Math.abs(T.dn1-T.cn1)<0.5;
  const exp=()=>downloadCSV(`Balance_${meta.societe}_${meta.exercice}`,[["Compte","Intitulé","Débit N","Crédit N","Débit N-1","Crédit N-1","Mouvement débit N","Mouvement crédit N","Rubrique"],...lignes.map(x=>{const m=mapCompte(x.c);return[x.c,x.l,num(x.dn),num(x.cn),num(x.dn1),num(x.cn1),num(x.md),num(x.mc),m?(typeof m.r==="object"?`${m.r.d}/${m.r.c}`:m.r):""];})]);
  const inp={background:"transparent",border:"1px solid transparent",borderRadius:5,color:K.t1,fontSize:12,padding:"5px 6px",outline:"none",width:"100%"};
  return <>
    <Toolbar K={K}>
      {canEdit&&<B K={K} sm ico="clipboard" ch="Coller depuis Excel" on={()=>sImp(true)}/>}
      {canEdit&&<B K={K} sm v="g" ico="plus" ch="Ajouter un compte" on={()=>setL(p=>[...p,{c:"",l:"",dn:0,cn:0,dn1:0,cn1:0,md:0,mc:0}])}/>}
      <B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp} dis={!lignes.length}/>
      <B K={K} sm v={mvt?"w":"g"} ico="arrows-left-right" ch={mvt?"Masquer les mouvements N":"Afficher les mouvements N"} on={()=>sMvt(!mvt)}/>
      <input placeholder="Filtrer : compte ou intitulé" value={q} onChange={e=>sQ(e.target.value)} style={{...fieldSt(K),width:mob?"100%":220,minHeight:32,padding:"5px 10px",fontSize:12}}/>
    </Toolbar>
    <Wrap K={K}>
      <Scroll max="62vh">
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
          <thead><tr>
            <th style={{...th(K),textAlign:"left",width:90}}>Compte</th><th style={{...th(K),textAlign:"left"}}>Intitulé</th><th style={{...th(K),textAlign:"center"}}>Rubrique</th>
            <th style={th(K)}>Débit N</th><th style={th(K)}>Crédit N</th><th style={th(K)}>Débit N-1</th><th style={th(K)}>Crédit N-1</th>{mvt&&<><th style={th(K)}>Mvt débit N</th><th style={th(K)}>Mvt crédit N</th></>}{canEdit&&<th style={th(K)}/>}
          </tr></thead>
          <tbody>
            {view.map(({x,i})=>{const m=mapCompte(x.c);let rub=m?m.r:null;
              if(rub&&typeof rub==="object")rub=num(x.dn)-num(x.cn)>=0?rub.d:rub.c;
              return <tr key={i}>
                <td style={{...td(K),textAlign:"left",padding:"2px 4px"}}>{canEdit?<input style={{...inp,fontFamily:mono}} value={x.c} onChange={e=>upd(i,"c",e.target.value.replace(/\D/g,""))}/>:x.c}</td>
                <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",padding:"2px 4px",minWidth:200}}>{canEdit?<input style={inp} value={x.l} onChange={e=>upd(i,"l",e.target.value)}/>:x.l}</td>
                <td style={{...td(K),textAlign:"center"}} title={rub?LIB[rub]+(m.amort?" (amort./dépréc.)":""):"Compte non reconnu"}>
                  {x.c?<button onClick={()=>sFiche(x)} title="Fonctionnement du compte" style={{fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:5,border:"none",cursor:"pointer",background:rub?K.emBg:K.erBg,color:rub?K.em:K.er,fontFamily:mono}}>{rub?rub+(m.amort?"·A":""):"?"} <i className="ti ti-info-circle" style={{fontSize:10}}/></button>:null}
                </td>
                {COLS.map(k=><td key={k} style={{...td(K),padding:"2px 4px"}}><NumCell K={K} value={x[k]} dis={!canEdit} onChange={v=>upd(i,k,v)}/></td>)}
                {canEdit&&<td style={{...td(K),padding:"2px 4px"}}><button title="Supprimer" onClick={()=>setL(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-trash" style={{fontSize:14}}/></button></td>}
              </tr>;})}
            {!lignes.length&&<tr><td colSpan={10} style={{...td(K),textAlign:"center",fontFamily:"'Outfit',sans-serif",color:K.t3,padding:24}}>Balance vide — collez votre balance depuis Excel ou ajoutez les comptes un par un.</td></tr>}
          </tbody>
          <tfoot><tr>
            <td colSpan={3} style={{...td(K),textAlign:"left",fontWeight:800,fontFamily:"'Outfit',sans-serif",background:K.c2}}>TOTAUX · {lignes.length} comptes</td>
            {COLS.map(k=><td key={k} style={{...td(K),fontWeight:800,background:K.c2}}>{fmt(T[k])}</td>)}{canEdit&&<td style={{...td(K),background:K.c2}}/>}
          </tr></tfoot>
        </table>
      </Scroll>
    </Wrap>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8,fontSize:12}}>
      <span style={{color:okN?K.em:K.er,fontWeight:700}}>{okN?"✓ Balance N équilibrée":`✗ Balance N déséquilibrée : écart ${fmt(T.dn-T.cn)}`}</span>
      {(T.dn1||T.cn1)?<span style={{color:okN1?K.em:K.er,fontWeight:700}}>{okN1?"✓ Balance N-1 équilibrée":`✗ Écart N-1 : ${fmt(T.dn1-T.cn1)}`}</span>:<span style={{color:K.t3}}>Colonnes N-1 vides (nécessaires au comparatif et au TFT)</span>}
      {mvt&&<span style={{color:Math.abs(T.md-T.mc)<0.5?K.em:K.er,fontWeight:700}}>{Math.abs(T.md-T.mc)<0.5?"✓ Mouvements N équilibrés":`✗ Mouvements N : écart ${fmt(T.md-T.mc)}`}</span>}
      <span style={{color:K.t3}}>Rubrique : référence SYSCOHADA du poste · « A » = amortissement/dépréciation</span>
    </div>
    {fiche&&<FicheModal K={K} ligne={fiche} onClose={()=>sFiche(null)}/>}
    {imp&&<ImportModal K={K} onClose={()=>sImp(false)} onImport={(rows,mode)=>{setL(p=>mode==="add"?[...p,...rows]:rows);sImp(false);}}/>}
  </>;
}

function ImportModal({K,onClose,onImport}){
  const[txt,sTxt]=useState(""),[mode,sMode]=useState("replace"),[fmtB,sFmtB]=useState("8");
  const rows=useMemo(()=>parseBalance(txt,fmtB),[txt,fmtB]);
  return <Modal K={K} title="Importer une balance depuis Excel" onClose={onClose} w={640}>
    <div style={{fontSize:12,color:K.t2,lineHeight:1.6,marginBottom:10}}>
      Copiez les colonnes dans Excel puis collez-les ci-dessous. Choisissez le format de votre balance :<br/>
      <label style={{display:"block",marginTop:4}}><input type="radio" checked={fmtB==="8"} onChange={()=>sFmtB("8")}/> <b>Balance à 8 colonnes</b> (recommandé, alimente les notes 3A, 3C, 3D et 28) : <span style={{fontFamily:mono}}>Compte | Intitulé | Solde N-1 D | Solde N-1 C | Mouvement D | Mouvement C | Solde N D | Solde N C</span></label>
      <label style={{display:"block"}}><input type="radio" checked={fmtB==="6"} onChange={()=>sFmtB("6")}/> <b>Balance à 6 colonnes</b> : <span style={{fontFamily:mono}}>Compte | Intitulé | Débit N | Crédit N | Débit N-1 | Crédit N-1</span></label>
      Les lignes d'en-tête et de totaux sont ignorées automatiquement. Formats acceptés : « 1 250 000,50 » ou « 1250000.50 », séparateur tabulation ou point-virgule.
    </div>
    <textarea value={txt} onChange={e=>sTxt(e.target.value)} rows={10} placeholder={fmtB==="8"?"101\tCapital social\t0\t200000000\t0\t50000000\t0\t250000000\n5211\tBanque\t84000000\t0\t500000000\t424450000\t159550000\t0":"101\tCapital social\t0\t250000000\t0\t200000000\n5211\tBanque\t159550000\t0\t84000000\t0"} style={{...fieldSt(K),fontFamily:mono,fontSize:11,resize:"vertical"}}/>
    <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",margin:"10px 0"}}>
      <span style={{fontSize:12,color:rows.length?K.em:K.t3,fontWeight:700}}>{rows.length} compte(s) détecté(s)</span>
      <label style={{fontSize:12,color:K.t2}}><input type="radio" checked={mode==="replace"} onChange={()=>sMode("replace")}/> Remplacer la balance</label>
      <label style={{fontSize:12,color:K.t2}}><input type="radio" checked={mode==="add"} onChange={()=>sMode("add")}/> Ajouter à la balance</label>
    </div>
    <B K={K} ch="Importer →" on={()=>onImport(rows,mode)} dis={!rows.length}/>
  </Modal>;
}

// ── CONTRÔLES ────────────────────────────────────────────────────────────────────
function ControlsTab({K,R,go,lignes=[]}){
  const[fiche,sFiche]=useState(null);
  const sens=anomaliesSens(lignes);
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
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderLeft:`3px solid ${sens.length?K.wa:K.em}`,borderRadius:9,padding:"10px 12px",marginTop:7}}>
      <div style={{display:"flex",gap:10}}><i className={`ti ti-${sens.length?"alert-triangle":"circle-check"}`} style={{fontSize:18,color:sens.length?K.wa:K.em,flexShrink:0}}/>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:K.t1}}>Sens des soldes, compte par compte</div>
          <div style={{fontSize:12,color:K.t2,marginTop:2,lineHeight:1.5}}>{sens.length?`${sens.length} compte(s) à vérifier : leur solde est dans le sens inverse de leur fonctionnement normal. Certains sous-comptes (retours, rabais) peuvent l'expliquer ; sinon, recherchez une erreur d'imputation.`:"Tous les comptes ont un solde conforme à leur fonctionnement."}</div>
          {sens.length>0&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:3}}>{sens.map(a=><button key={a.c} onClick={()=>sFiche(a)} className="bt" style={{textAlign:"left",background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:6,padding:"5px 8px",fontSize:11,color:K.t1,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            <b style={{fontFamily:mono}}>{a.c}</b> {a.l} — solde {a.solde>0?"débiteur":"créditeur"} de {fmt(Math.abs(a.solde))}, attendu {a.attendu} <i className="ti ti-info-circle"/></button>)}</div>}
        </div></div>
    </div>
    {fiche&&<FicheModal K={K} ligne={fiche} onClose={()=>sFiche(null)}/>}
    <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}><B K={K} sm v="g" ch="Voir le Bilan" on={()=>go("bilan")}/><B K={K} sm v="g" ch="Voir le Compte de résultat" on={()=>go("cr")}/><B K={K} sm v="g" ch="Voir le TFT" on={()=>go("tft")}/></div>
  </>;
}

// ── GUIDE : RÈGLES ET FONCTIONNEMENT DES COMPTES ─────────────────────────────────
const SENS_LIB={D:"Débiteur",C:"Créditeur",V:"Variable (selon le sens)"};
const ETAT_LIB={A:"Actif du bilan",P:"Passif du bilan","A-":"Actif, en déduction (amortissements / dépréciations)","CR-":"Compte de résultat — charge","CR+":"Compte de résultat — produit"};
function FicheContenu({K,c,f,ligne}){
  const solde=ligne?num(ligne.dn)-num(ligne.cn):0;
  const rub=rubriqueDe(c,solde);
  const Row=({l,v})=>v?<div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:8,padding:"5px 0",borderBottom:`1px solid ${K.b0}`,fontSize:12}}><span style={{color:K.t3,fontWeight:700}}>{l}</span><span style={{color:K.t1,lineHeight:1.5}}>{v}</span></div>:null;
  return <div>
    {f?<>
      <Row l="Compte" v={`${f.prefixe} — ${f.l}`}/>
      <Row l="Nature" v={ETAT_LIB[f.etat]}/>
      <Row l="Solde normal" v={SENS_LIB[f.sens]}/>
      <Row l="Débité de" v={f.d}/>
      <Row l="Crédité de" v={f.c}/>
      <Row l="À retenir" v={f.r}/>
    </>:<div style={{fontSize:12,color:K.t3,marginBottom:6}}>Pas de fiche détaillée pour ce compte : consultez le compte principal de la même classe.</div>}
    <Row l="Poste" v={rub?(rub.alt?`${rub.alt.d} s'il est débiteur (${LIB[rub.alt.d]}) · ${rub.alt.c} s'il est créditeur (${LIB[rub.alt.c]})`:`${rub.ref} — ${rub.lib}${rub.amort?" (colonne amortissements / dépréciations)":""}`):"Compte non rattaché à un poste"}/>
    {ligne&&<Row l="Dans ce dossier" v={`Solde N ${solde>=0?"débiteur":"créditeur"} de ${fmt(Math.abs(solde))}${rub&&rub.alt?` → classé en ${rub.ref}`:""}${f&&f.sens!=="V"&&Math.abs(solde)>0.5&&((f.sens==="D")!==(solde>0))?" — ⚠ sens inhabituel":""}`}/>}
  </div>;
}
function FicheModal({K,ligne,onClose}){
  const c=String(ligne.c||"");const f=ficheCompte(c);
  return <Modal K={K} title={`Compte ${c}${ligne.l?` — ${ligne.l}`:""}`} onClose={onClose}><FicheContenu K={K} c={c} f={f} ligne={ligne}/></Modal>;
}
function GuideView({K,mob,lignes}){
  const[vue,sVue]=useState("comptes");
  const ligneDe=k=>(lignes||[]).find(x=>String(x.c).startsWith(k));
  return <div>
    <div className="tn ef-noprint" style={{gap:6,marginBottom:12}}>
      {[["comptes","books","Contenu et fonctionnement des comptes"],["regles","list-check","Règles de montage"]].map(([k,ico,l])=><B key={k} K={K} sm v={vue===k?"p":"g"} ico={ico} ch={l} on={()=>sVue(k)}/>)}
    </div>
    {vue==="regles"?<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:12,color:K.t3,lineHeight:1.5}}>Synthèse du manuel « Montage des états financiers du SYSCOHADA révisé » et de l'Acte uniforme relatif au droit comptable et à l'information financière, adaptée à la RDC.</div>
      {REGLES.map((r,i)=><details key={i} open={i<2} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:10,padding:"10px 13px"}}>
        <summary style={{cursor:"pointer",fontWeight:800,fontSize:13,color:K.t1}}>{i+1}. {r.t}</summary>
        <ul style={{margin:"8px 0 2px 18px",display:"flex",flexDirection:"column",gap:5}}>{r.p.map((x,j)=><li key={j} style={{fontSize:12,color:K.t2,lineHeight:1.55}}>{x}</li>)}</ul>
      </details>)}
    </div>
    :<GuideComptes K={K} mob={mob} fiche={c=><FicheContenu K={K} c={c} f={ficheCompte(c)} ligne={ligneDe(c)}/>}/>}
  </div>;
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
  ["nouvEmp","Nouveaux emprunts encaissés (mouvement crédit des 16/18 ; vide = variation nette)"],
  ["rembFin","Remboursements encaissés de prêts, dépôts et cautionnements (crédit des 27)"],
  ["locAcq","Nouveaux contrats de location-acquisition (vide = augmentation du compte 17)"],
  ["prelev","Prélèvements de l'exploitant sur le capital"],
];
function TFTTab({K,R,meta,comp,setC,canEdit}){
  const t=R.tft;const[calc,sCalc]=useState(true);
  if(!t)return <div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"18px",fontSize:13,color:K.t2,lineHeight:1.6}}>
    <b style={{color:K.wa}}>Balance N-1 requise.</b> Le Tableau des flux de trésorerie se construit par différence entre les bilans N et N-1 : renseignez les colonnes « Débit N-1 / Crédit N-1 » dans l'onglet Balance.</div>;
  const ok=Math.abs(t.ZH-t.tresoBilan)<0.5;
  const exp=()=>downloadCSV(`TFT_${meta.societe}_${meta.exercice}`,[["Réf","Libellé","Exercice N"],...TFT.filter(x=>x.t!=="h").map(x=>[x.ref,x.lib,Math.round(t[x.ref])])]);
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer / PDF" on={()=>window.print()}/><B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp}/><B K={K} sm v={calc?"w":"g"} ico="math-function" ch={calc?"Masquer les calculs":"Afficher les calculs"} on={()=>sCalc(!calc)}/></Toolbar>
    <div className="ef-noprint" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:3}}>Informations complémentaires</div>
      <div style={{color:K.t3,fontSize:11,marginBottom:10,lineHeight:1.5}}>Mouvements non déductibles des seuls soldes de la balance. Méthode du guide d'application : acquisitions = Δ immobilisations nettes + dotations + valeur comptable des cessions − réévaluations (106, 154) − Δ dettes sur immobilisations (404, 481, 482).</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:"0 10px"}}>
        {COMP.map(([k,l])=><Field key={k} K={K} lb={l}><NumCellBox K={K} value={comp[k]} dis={!canEdit} onChange={v=>setC({...comp,[k]:v===""?"":v})}/></Field>)}
      </div>
    </div>
    <Wrap K={K} print>
      <PrintHead K={K} meta={meta} titre="TABLEAU DES FLUX DE TRÉSORERIE"/>
      <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
        <thead><tr><th style={{...th(K),textAlign:"left",width:44}}>Réf</th><th style={{...th(K),textAlign:"left"}}>Libellés</th><th style={th(K)}>Exercice N</th></tr></thead>
        <tbody>{TFT.map(x=>x.t==="h"?<tr key={x.ref}><td colSpan={3} style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",fontWeight:700,color:K.in_,paddingTop:10}}>{x.lib}</td></tr>
          :<tr key={x.ref} style={rowSt(K,x.t)}><td style={{...td(K),textAlign:"left",color:K.t3}}>{x.ref}</td><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:x.t==="d"?18:8}}>{x.lib}{calc&&t.ex[x.ref]&&<div className="ef-noprint" style={{fontSize:10,color:K.t3,fontFamily:mono,marginTop:2,lineHeight:1.4}}>{t.ex[x.ref]}</div>}</td>
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

// ── NOTES ANNEXES ────────────────────────────────────────────────────────────────
const fv=(v,u)=>v==null||!isFinite(v)?"":u==="%"?`${v.toFixed(1).replace(".",",")} %`:u==="x"?v.toFixed(2).replace(".",","):fmt(v);
const noteCells=r=>r.cells?r.cells.map((v,i)=>({v,u:i===r.cells.length-1&&r.cells.length===3&&!r.u?"var":r.u})):[{v:r.n},{v:r.n1},{v:r.var,u:"var"}];
const noteCsv=n=>[[`NOTE ${n.id} : ${n.titre}`],...(n.cols?[n.cols]:[]),...(n.rows||[]).map(r=>r.h?[r.l]:[r.l,...noteCells(r).map(c=>c.v==null?"":c.u==="var"||c.u==="%"||c.u==="x"?Number(c.v.toFixed(2)):Math.round(c.v))]),...(n.texte||[]).map(t=>[t]),
  ...(n.ech&&n.ech.rows.length?[[],["Échéancier","Montant N",...TRANCHES.map(t=>t[1])],...n.ech.rows.map(r=>[r.l,Math.round(r.n),Math.round(r.a),Math.round(r.b),Math.round(r.c)])]:[]),
  ...(n.act&&n.act.rows.length?[[],["Associés","Nationalité","Pays de résidence","Nature des titres","Nombre","Montant","% du capital"],...n.act.rows.map(r=>[r.nom,r.nat,r.pays,r.nature,num(r.nb),Math.round(r.montant),r.pct==null?"":Number(r.pct.toFixed(2))]),["Valeur nominale",n.act.nominal]]:[]),
  ...(n.eff&&n.eff.saisi?[[],["Qualification",...EFF_COLS.map(c=>"Effectif "+c),"Effectif total",...EFF_COLS.map(c=>"Masse "+c),"Masse totale"],...[...EFF_PROPRE,["YE","TOTAL (1)"],...EFF_STATUT,...EFF_EXT,["YL","TOTAL (2)"]].map(([c,l])=>{const L=n.eff.lines[c]||n.eff.tot[c];return[`${c} ${l}`,...L.e,L.te,...L.m,L.tm];})]:[]),
  ...(n.txt?[["Commentaire"],[n.txt]]:[]),[]];

// Saisie numérique compacte (tableaux de saisie des notes)
function SmallNum({K,value,onChange,dis,w=84}){
  const[ed,sEd]=useState(null);
  const has=value!==undefined&&value!==""&&value!==null&&num(value)!==0;
  const st={width:w,padding:"4px 6px",background:dis?"transparent":K.c2,border:`1px solid ${ed!==null?K.emBd:dis?"transparent":K.b0}`,borderRadius:5,color:K.t1,fontSize:11,textAlign:"right",fontFamily:mono,outline:"none"};
  return <input disabled={dis} inputMode="decimal" style={st} value={ed!==null?ed:(has?fmt(value):"")} onFocus={()=>sEd(has?String(value):"")} onChange={e=>sEd(e.target.value)}
    onBlur={()=>{const v=ed.trim()===""?"":num(ed);sEd(null);if(v!==value)onChange(v);}} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}/>;
}
const SubTitle=({K,children,note})=><div style={{padding:"12px 14px 6px",borderTop:`1px solid ${K.b0}`}}><div style={{fontWeight:800,fontSize:12,color:K.t1,textTransform:"uppercase",letterSpacing:.4}}>{children}</div>{note&&<div className="ef-noprint" style={{fontSize:11,color:K.t3,marginTop:2,lineHeight:1.5}}>{note}</div>}</div>;

function EchTable({K,n,saisie,canEdit,upd}){
  const E=n.ech;if(!E||!E.rows.length)return null;
  const set=(i,k,v)=>{const ech={...(saisie.ech||{})};ech[i]={...(ech[i]||{}),[k]:v};upd(n.id,{ech});};
  const restLib=TRANCHES.find(([k])=>k===E.rest)[1].toLowerCase();
  return <>
    <SubTitle K={K} note={`Saisissez deux tranches : la tranche « ${restLib} » est calculée par différence avec le solde N, l'échéancier reste ainsi égal à la note.`}>Échéancier des {n.id==="4"||n.id==="7"||n.id==="8"?"créances":"dettes"}</SubTitle>
    <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:680}}>
      <thead><tr><th style={{...th(K),textAlign:"left"}}>Libellés</th><th style={th(K)}>Montant N</th>{TRANCHES.map(([k,l])=><th key={k} style={{...th(K),whiteSpace:"normal"}}>{l}</th>)}</tr></thead>
      <tbody>{E.rows.map(r=><tr key={r.i}>
        <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal"}}>{r.l}</td><td style={td(K)}>{fmt(r.n)}</td>
        {TRANCHES.map(([k])=><td key={k} style={{...td(K),padding:"3px 6px"}}>{k===E.rest?<span style={{color:r.neg?K.er:K.t2,fontStyle:"italic"}} title="Calculé par différence">{fmt(r[k])}</span>
          :<SmallNum K={K} w={110} value={(saisie.ech||{})[r.i]?.[k]} dis={!canEdit} onChange={v=>set(r.i,k,v)}/>}</td>)}
      </tr>)}
      <tr style={{fontWeight:800,background:K.c2}}><td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif"}}>TOTAL</td><td style={td(K)}>{fmt(E.tot.n)}</td>{TRANCHES.map(([k])=><td key={k} style={td(K)}>{fmt(E.tot[k])}</td>)}</tr>
      </tbody></table></Scroll>
    {!E.ok&&<div style={{padding:"6px 14px",fontSize:11,fontWeight:700,color:K.er}}>✗ Les tranches saisies dépassent le solde N de certaines lignes (montant négatif dans la colonne calculée).</div>}
  </>;
}

function ActTable({K,n,saisie,canEdit,upd}){
  const A=n.act;if(!A)return null;
  const act=saisie.act||{},rows=act.rows||[];
  const save=patch=>upd(n.id,{act:{...act,...patch}});
  const setRow=(i,k,v)=>save({rows:rows.map((r,j)=>j===i?{...r,[k]:v}:r)});
  const inp={background:canEdit?K.c2:"transparent",border:`1px solid ${canEdit?K.b0:"transparent"}`,borderRadius:5,color:K.t1,fontSize:11,padding:"4px 6px",outline:"none",width:"100%",fontFamily:"'Outfit',sans-serif"};
  return <>
    <SubTitle K={K} note="Répartition du capital : le montant de chaque associé est égal au nombre de titres × valeur nominale ; le total doit égaler le capital social (comptes 101 à 104).">Associés et répartition du capital</SubTitle>
    <div style={{padding:"0 14px 8px",display:"flex",alignItems:"center",gap:8,fontSize:12,color:K.t2}}>Valeur nominale des actions ou parts : <SmallNum K={K} w={130} value={act.nominal} dis={!canEdit} onChange={v=>save({nominal:v})}/> {n.ident?.devise||""}</div>
    <Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
      <thead><tr>{["Nom et prénoms ou raison sociale","Nationalité","Pays de résidence","Nature des titres","Nombre","Montant total","% du capital"].map((c,i)=><th key={i} style={{...th(K),textAlign:i<4?"left":"right"}}>{c}</th>)}{canEdit&&<th style={th(K)}/>}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}>
        <td style={{...td(K),padding:"3px 4px",minWidth:180}}><input disabled={!canEdit} style={inp} value={r.nom||""} onChange={e=>setRow(i,"nom",e.target.value)}/></td>
        <td style={{...td(K),padding:"3px 4px"}}><input disabled={!canEdit} list="ef-nat" style={inp} value={r.nat||""} onChange={e=>setRow(i,"nat",e.target.value)}/></td>
        <td style={{...td(K),padding:"3px 4px"}}><input disabled={!canEdit} style={inp} value={r.pays||""} onChange={e=>setRow(i,"pays",e.target.value)}/></td>
        <td style={{...td(K),padding:"3px 4px"}}><select disabled={!canEdit} style={inp} value={r.nature||NATURES_TITRES[0]} onChange={e=>setRow(i,"nature",e.target.value)}>{NATURES_TITRES.map(x=><option key={x}>{x}</option>)}</select></td>
        <td style={{...td(K),padding:"3px 4px"}}><SmallNum K={K} value={r.nb} dis={!canEdit} onChange={v=>setRow(i,"nb",v)}/></td>
        <td style={td(K)}>{fmt(A.rows[i]?.montant)}</td><td style={td(K)}>{A.rows[i]?.pct==null?"":`${A.rows[i].pct.toFixed(2).replace(".",",")} %`}</td>
        {canEdit&&<td style={td(K)}><button onClick={()=>save({rows:rows.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-trash"/></button></td>}
      </tr>)}
      {!rows.length&&<tr><td colSpan={8} style={{...td(K),textAlign:"center",fontFamily:"'Outfit',sans-serif",color:K.t3,padding:14}}>Aucun associé saisi.</td></tr>}
      <tr style={{fontWeight:800,background:K.c2}}><td colSpan={4} style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif"}}>TOTAL</td><td style={td(K)}>{fmt(A.nb)}</td><td style={td(K)}>{fmt(A.total)}</td><td style={td(K)}>{A.total?"100 %":""}</td>{canEdit&&<td style={td(K)}/>}</tr>
      </tbody></table></Scroll>
    <datalist id="ef-nat">{["Congolaise (RDC)","Belge","Française","Libanaise","Indienne","Chinoise","Sud-africaine","Angolaise","Zambienne","Rwandaise"].map(x=><option key={x} value={x}/>)}</datalist>
    <div style={{padding:"6px 14px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      {canEdit&&<B K={K} sm v="g" ico="user-plus" ch="Ajouter un associé" on={()=>save({rows:[...rows,{nom:"",nat:"Congolaise (RDC)",pays:"RDC",nature:NATURES_TITRES[0],nb:""}]})}/>}
      {rows.length>0&&<span style={{fontSize:11,fontWeight:700,color:A.ok?K.em:K.er}}>{A.ok?"✓":"✗"} Total des associés {fmt(A.total)} — capital social {fmt(A.capital)}</span>}
    </div>
  </>;
}

function EffTable({K,n,saisie,canEdit,upd}){
  const E=n.eff;if(!E)return null;
  const eff=saisie.eff||{};
  const set=(code,kind,i,v)=>{const x={...(eff[code]||{})};if(kind==="f")x.f=v;else{const a=[...(x[kind]||[])];a[i]=v;x[kind]=a;}upd(n.id,{eff:{...eff,[code]:x}});};
  const grid=(rows,ext)=><Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:ext?820:1320}}>
    <thead>
      <tr><th style={{...th(K),textAlign:"left"}} rowSpan={2}>Qualifications</th><th style={{...th(K),textAlign:"center"}} colSpan={7}>Effectifs</th><th style={{...th(K),textAlign:"center"}} colSpan={ext?1:7}>{ext?"Facturation à l'entité":"Masse salariale"}</th></tr>
      <tr>{[...EFF_COLS,"Total"].map((c,i)=><th key={i} style={{...th(K),top:27}}>{c}</th>)}{ext?<th style={{...th(K),top:27}}>Montant</th>:[...EFF_COLS,"Total"].map((c,i)=><th key={"m"+i} style={{...th(K),top:27}}>{c}</th>)}</tr>
    </thead>
    <tbody>{rows.map(([code,lib,total])=>{const L=total?E.tot[total]:E.lines[code];return <tr key={code} style={total?{fontWeight:800,background:K.c2}:{}}>
      <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",minWidth:200}}><b style={{fontFamily:mono,color:K.t3}}>{code}</b> {lib}</td>
      {EFF_COLS.map((_,i)=><td key={i} style={{...td(K),padding:"3px 4px"}}>{total?fmt(L.e[i]):<SmallNum K={K} w={62} value={(eff[code]?.e||[])[i]} dis={!canEdit} onChange={v=>set(code,"e",i,v)}/>}</td>)}
      <td style={{...td(K),fontWeight:800}}>{fmt(L.te)}</td>
      {ext?<td style={{...td(K),padding:"3px 4px"}}>{total?fmt(L.f):<SmallNum K={K} w={110} value={eff[code]?.f} dis={!canEdit} onChange={v=>set(code,"f",0,v)}/>}</td>
      :<>{EFF_COLS.map((_,i)=><td key={"m"+i} style={{...td(K),padding:"3px 4px"}}>{total?fmt(L.m[i]):<SmallNum K={K} w={96} value={(eff[code]?.m||[])[i]} dis={!canEdit} onChange={v=>set(code,"m",i,v)}/>}</td>)}<td style={{...td(K),fontWeight:800}}>{fmt(L.tm)}</td></>}
    </tr>;})}</tbody></table></Scroll>;
  return <>
    <SubTitle K={K} note="Effectifs et masse salariale de l'exercice par qualification, nationalité (nationaux, autres États de l'OHADA, hors OHADA) et sexe. La masse salariale du personnel propre est rapprochée des comptes 661 à 663 et doit concorder avec les déclarations CNSS, INPP, ONEM et IPR.">1. Personnel propre</SubTitle>
    {grid([...EFF_PROPRE,["YE","TOTAL (1)","YE"],...EFF_STATUT])}
    <SubTitle K={K}>2. Personnel extérieur</SubTitle>
    {grid([...EFF_EXT,["YL","TOTAL (2)","YL"]],true)}
    <div style={{padding:"8px 14px",fontSize:12,fontWeight:700,color:K.t1}}>YO — TOTAL (1 + 2) : {fmt(E.tot.YO.te)} personnes · masse salariale du personnel propre {fmt(E.tot.YE.tm)} · comptabilisée (661 à 663) {fmt(E.masseCompta)}</div>
  </>;
}

function NoteBody({K,n,meta,canEdit,upd,saisie={}}){
  const st=fieldSt(K);
  return <div className="ef-pb">
    <PrintHead K={K} meta={meta} titre={`NOTE ${n.id} : ${n.titre}`}/>
    {n.estime&&<div style={{padding:"8px 14px",fontSize:11,color:K.wa,background:K.waBg}}>Mouvements N absents de la balance : augmentations et diminutions estimées par différence entre les soldes N et N-1. Saisissez la balance à 8 colonnes pour un tableau exact.</div>}
    {n.texte&&<div style={{padding:"10px 14px",fontSize:12,color:K.t1,lineHeight:1.6}}>{n.texte.map((t,i)=>/^[A-Z]\. /.test(t)?<div key={i} style={{fontWeight:800,marginTop:i?8:0}}>{t}</div>:<p key={i} style={{marginTop:3}}>{t}</p>)}</div>}
    {n.rows&&<Scroll><table style={{width:"100%",borderCollapse:"collapse",minWidth:n.cols&&n.cols.length>4?760:520}}>
      <thead><tr>{(n.cols||[]).map((c,i)=><th key={i} style={{...th(K),textAlign:i?"right":"left",whiteSpace:"normal",minWidth:i?100:220}}>{c}</th>)}</tr></thead>
      <tbody>{n.rows.map((r,i)=>r.h?<tr key={i}><td colSpan={(n.cols||[]).length||4} style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",fontWeight:700,color:K.in_,paddingTop:9}}>{r.l}</td></tr>
        :<tr key={i} style={r.tot?{fontWeight:800,background:K.c2}:{}}>
          <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal",paddingLeft:r.tot?8:16}}>{r.l}</td>
          {noteCells(r).map((c,j)=><td key={j} style={{...td(K),color:c.u==="var"?K.t3:c.v<0?K.er:K.t1}}>{c.u==="var"?fmtPct(c.v):fv(c.v,c.u)}</td>)}
        </tr>)}</tbody>
    </table></Scroll>}
    {n.remarque&&<div style={{padding:"8px 14px",fontSize:11,color:K.t3}}>{n.remarque}</div>}
    <EchTable K={K} n={n} saisie={saisie} canEdit={canEdit} upd={upd}/>
    <ActTable K={K} n={n} saisie={saisie} canEdit={canEdit} upd={upd}/>
    <EffTable K={K} n={n} saisie={saisie} canEdit={canEdit} upd={upd}/>
    {(n.ctrl||[]).length>0&&<div className="ef-noprint" style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:3}}>
      {n.ctrl.map((c,i)=><div key={i} style={{fontSize:11,fontWeight:700,color:c.ok?K.em:K.er}}>{c.ok?"✓":"✗"} Contrôle {c.lib}{c.info?"":` : note ${fmt(c.note)} — ${n.id==="27B"?"référence":"états financiers"} ${fmt(c.etat)}`}</div>)}
    </div>}
    <div style={{padding:"8px 14px 12px"}}>
      {n.aide&&<div className="ef-noprint" style={{fontSize:11,color:K.t3,lineHeight:1.5,marginBottom:6}}><i className="ti ti-info-circle"/> {n.aide}</div>}
      {canEdit?<textarea className="ef-noprint" rows={n.t==="txt"?6:2} value={n.txt} onChange={e=>upd(n.id,{txt:e.target.value})} placeholder={n.t==="txt"?"Rédigez le contenu de la note…":"Commentaire (variations significatives, méthodes, précisions…)"} style={{...st,resize:"vertical"}}/>
      :n.txt&&<div className="ef-noprint" style={{fontSize:12,color:K.t2,whiteSpace:"pre-wrap"}}>{n.txt}</div>}
      {n.txt&&<div className="ef-printonly" style={{fontSize:12,whiteSpace:"pre-wrap",marginTop:6}}><b>Commentaire :</b> {n.txt}</div>}
    </div>
  </div>;
}

function NotesTab({K,mob,R,saisies,setN,canEdit,meta}){
  const notes=useMemo(()=>computeNotes(R,saisies,{denomination:meta.societe,...(meta.ident||{})},meta.devise),[R,saisies,meta]);
  const[sel,sSel]=useState("R4"),[all,sAll]=useState(false);
  const upd=(id,patch)=>setN({...saisies,[id]:{...(saisies[id]||{}),...patch}});
  const cur=notes.find(n=>n.id===sel);
  const ko=n=>(n.ctrl||[]).some(c=>!c.ok);
  const nA=notes.filter(n=>n.applicable).length,nKo=notes.filter(n=>n.applicable&&ko(n)).length;
  const exportAll=()=>downloadCSV(`NotesAnnexes_${meta.societe}_${meta.exercice}`,[["FICHE R4 : FICHE RÉCAPITULATIVE DES NOTES ANNEXES"],["Note","Intitulé","A / N/A"],...notes.map(n=>[n.id,n.titre,n.applicable?"A":"N/A"]),[],...notes.filter(n=>n.applicable).flatMap(noteCsv)]);
  const R4=<div className={sel==="R4"||all?"":"ef-noprint"}>
    <PrintHead K={K} meta={meta} titre="FICHE R4 : FICHE RÉCAPITULATIVE DES NOTES ANNEXES"/>
    {mob&&<div className="ef-noprint">{notes.map(n=><div key={n.id} onClick={()=>{sSel(n.id);sAll(false);}} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",borderBottom:`1px solid ${K.b0}`,cursor:"pointer"}}>
      <div style={{flex:"0 0 46px",fontFamily:mono,fontWeight:800,fontSize:13,color:K.t1,paddingTop:2}}>{n.id}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:K.t1,lineHeight:1.35,textTransform:"none"}}>{casPhrase(n.titre)}</div>
        {ko(n)&&n.applicable&&<div style={{color:K.er,fontWeight:800,fontSize:12,marginTop:2}}>Contrôle à revoir</div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}} onClick={e=>e.stopPropagation()}>
          <span style={{fontSize:11,fontWeight:800,borderRadius:99,padding:"2px 9px",whiteSpace:"nowrap",background:n.applicable?K.emBg:K.c2,color:n.applicable?K.em:K.t3,border:`1px solid ${n.applicable?K.emBd:K.b0}`}}>{n.applicable?"Applicable":"Non applicable"}</span>
          <select disabled={!canEdit} value={n.force||""} onChange={e=>upd(n.id,{a:e.target.value||null})} style={{...fieldSt(K),minHeight:28,padding:"2px 6px",fontSize:12,width:"auto",flex:"0 1 auto"}}>
            <option value="">Auto</option><option value="A">Forcer : applicable</option><option value="NA">Forcer : non applicable</option>
          </select>
        </div>
      </div>
      <i className="ti ti-chevron-right" style={{color:K.t3,fontSize:16,paddingTop:2}}/>
    </div>)}</div>}
    <table className={mob?"ef-printonly":undefined} style={{width:"100%",borderCollapse:"collapse"}}>
      <thead><tr><th style={{...th(K),textAlign:"left",width:70}}>Notes</th><th style={{...th(K),textAlign:"left"}}>Intitulés</th><th style={{...th(K),textAlign:"center",width:50}}>A</th><th style={{...th(K),textAlign:"center",width:50}}>N/A</th><th className="ef-noprint" style={{...th(K),textAlign:"center",width:130}}>Applicabilité</th></tr></thead>
      <tbody>{notes.map(n=><tr key={n.id} onClick={()=>{sSel(n.id);sAll(false);}} style={{cursor:"pointer"}}>
        <td style={{...td(K),textAlign:"left",fontWeight:700}}>NOTE {n.id}</td>
        <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal"}}>{n.titre}{ko(n)&&n.applicable&&<span className="ef-noprint" style={{color:K.er,fontWeight:800}}> · contrôle à revoir</span>}</td>
        <td style={{...td(K),textAlign:"center",fontWeight:800}}>{n.applicable?"X":""}</td><td style={{...td(K),textAlign:"center",fontWeight:800}}>{n.applicable?"":"X"}</td>
        <td className="ef-noprint" style={{...td(K),textAlign:"center"}} onClick={e=>e.stopPropagation()}>
          <select disabled={!canEdit} value={n.force||""} onChange={e=>upd(n.id,{a:e.target.value||null})} style={{...fieldSt(K),minHeight:28,padding:"2px 6px",fontSize:11}}>
            <option value="">Auto ({n.auto?"A":"N/A"})</option><option value="A">Applicable</option><option value="NA">Non applicable</option>
          </select></td>
      </tr>)}</tbody>
    </table>
    <div style={{padding:"8px 14px",fontSize:11,color:K.t3}}>A : Applicable · N/A : Non applicable. Les notes non applicables ne sont pas jointes aux états financiers. Applicabilité déterminée automatiquement d'après la balance (montants non nuls) ou le texte saisi.</div>
  </div>;
  return <>
    <Toolbar K={K}>
      <B K={K} sm ico="printer" ch={all?"Imprimer la liasse des notes":"Imprimer cette note"} on={()=>window.print()}/>
      <B K={K} sm v={all?"w":"g"} ico="files" ch={all?"Revenir à la note":`Liasse complète (${nA} notes applicables)`} on={()=>sAll(!all)}/>
      <B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV) de toutes les notes" on={exportAll}/>
      <span style={{fontSize:12,fontWeight:700,color:nKo?K.er:K.em,alignSelf:"center"}}>{nKo?`${nKo} note(s) en écart avec les états`:"✓ Notes cohérentes avec le Bilan et le Compte de résultat"}</span>
    </Toolbar>
    {all?<Wrap K={K} print>{R4}{notes.filter(n=>n.applicable).map(n=><NoteBody key={n.id} K={K} n={n} meta={meta} canEdit={false} upd={upd} saisie={saisies[n.id]}/>)}</Wrap>
    :<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"240px 1fr",gap:10,alignItems:"start"}}>
      {mob?<select className="ef-noprint" value={sel} onChange={e=>sSel(e.target.value)} style={fieldSt(K)}><option value="R4">Fiche R4 — récapitulatif</option>{notes.map(n=><option key={n.id} value={n.id}>Note {n.id} — {n.titre}</option>)}</select>
      :<div className="ef-noprint" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:6,maxHeight:"70vh",overflowY:"auto"}}>
        {[{id:"R4",titre:"Fiche récapitulative",applicable:true},...notes].map(n=>{const a=sel===n.id;return <button key={n.id} onClick={()=>sSel(n.id)} className="bt" style={{display:"flex",gap:7,alignItems:"center",width:"100%",textAlign:"left",padding:"6px 8px",border:"none",borderRadius:7,background:a?K.c2:"transparent",cursor:"pointer",fontFamily:"'Outfit',sans-serif",opacity:n.applicable?1:.5}}>
          <span style={{fontFamily:mono,fontSize:10,fontWeight:800,color:a?K.em:K.t3,minWidth:30}}>{n.id}</span>
          <span style={{fontSize:11,color:K.t1,flex:1,lineHeight:1.3}}>{casPhrase(n.titre)}</span>
          {n.id!=="R4"&&ko(n)&&n.applicable&&<i className="ti ti-alert-triangle" style={{color:K.er,fontSize:13}}/>}
        </button>;})}
      </div>}
      <Wrap K={K} print>{sel==="R4"?R4:cur&&<NoteBody K={K} n={cur} meta={meta} canEdit={canEdit} upd={upd} saisie={saisies[cur.id]}/>}</Wrap>
    </div>}
  </>;
}

// ── IDENTIFICATION (contexte RDC) ────────────────────────────────────────────────
function IdentTab({K,ident,setI,canEdit,meta}){
  const st=fieldSt(K);
  const set=(k,v)=>setI({...ident,[k]:v});
  const docs=["Fiche d'identification et renseignements divers","Bilan","Compte de résultat","Tableau des flux de trésorerie","Notes annexes"];
  const L=({l,v})=><div style={{display:"flex",gap:8,fontSize:12,padding:"3px 0"}}><span style={{color:K.t3,minWidth:190}}>{l}</span><b style={{color:K.t1}}>{v||"……………………"}</b></div>;
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer la page de garde" on={()=>window.print()}/></Toolbar>
    {canEdit&&<div className="ef-noprint" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"0 10px"}}>
        {IDENTITE.map((f,i)=>f.t?<div key={i} style={{gridColumn:"1/-1",fontWeight:800,fontSize:12,color:K.em,margin:"6px 0 8px",textTransform:"uppercase",letterSpacing:.5}}>{f.t}</div>
          :<div key={f.k} style={{gridColumn:f.wide?"1/-1":undefined}}><Field K={K} lb={f.l}>
            {f.opts?<select style={st} value={ident[f.k]||""} onChange={e=>set(f.k,e.target.value)}><option value="">—</option>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
            :f.rows?<textarea rows={f.rows} style={{...st,resize:"vertical"}} value={ident[f.k]||""} onChange={e=>set(f.k,e.target.value)}/>
            :<input type={f.date?"date":"text"} inputMode={f.num?"decimal":undefined} placeholder={f.ph||""} style={st} value={ident[f.k]||""} onChange={e=>set(f.k,e.target.value)}/>}
          </Field></div>)}
      </div>
    </div>}
    <Wrap K={K} print>
      <div style={{padding:"22px 20px",textAlign:"center",borderBottom:`1px solid ${K.b0}`}}>
        <div style={{fontWeight:800,fontSize:13,color:K.t1,letterSpacing:.5}}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</div>
        <div style={{fontSize:11,color:K.t2,marginTop:2}}>MINISTÈRE DES FINANCES — DIRECTION GÉNÉRALE DES IMPÔTS</div>
        <div style={{fontSize:11,color:K.t3,marginTop:2}}>Centre de dépôt : {ident.centre||"……………………"}</div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:20,color:K.t1,marginTop:16}}>ÉTATS FINANCIERS NORMALISÉS</div>
        <div style={{fontSize:12,color:K.t2,marginTop:3}}>SYSTÈME COMPTABLE OHADA RÉVISÉ (SYSCOHADA) — SYSTÈME NORMAL</div>
        <div style={{fontSize:13,fontWeight:700,color:K.t1,marginTop:10}}>EXERCICE CLOS LE 31 DÉCEMBRE {meta.exercice}</div>
      </div>
      <div style={{padding:"14px 20px"}}>
        <L l="Dénomination sociale" v={meta.societe}/><L l="Sigle usuel" v={ident.sigle}/><L l="Forme juridique" v={ident.forme}/>
        <L l="Capital social" v={ident.capital?`${fmt(ident.capital)} ${meta.devise}`:""}/>
        <L l="Adresse complète" v={[ident.avenue,ident.quartier&&`Q/ ${ident.quartier}`,ident.commune&&`C/ ${ident.commune}`,ident.ville,ident.province].filter(Boolean).join(", ")}/>
        <L l="Téléphone / e-mail" v={[ident.tel,ident.email].filter(Boolean).join(" · ")}/>
        <L l="N° RCCM" v={ident.rccm}/><L l="Identification nationale" v={ident.idnat}/><L l="Numéro Impôt (NIF)" v={ident.nif}/>
        <L l="CNSS / INPP / ONEM" v={[ident.cnss,ident.inpp,ident.onem].filter(Boolean).join(" · ")}/>
        <L l="Activité principale" v={ident.activite}/>
        <L l="Durée de l'exercice" v={`${ident.duree||12} mois (exercice précédent : ${ident.dureeN1||12} mois)`}/>
        <L l="Date d'arrêté des comptes" v={ident.dateArrete?new Date(ident.dateArrete).toLocaleDateString("fr-FR"):""}/>
        <L l="États approuvés par l'AG" v={ident.ago}/>
        <L l="Établis par" v={[ident.comptable,ident.onec&&`ONEC n° ${ident.onec}`].filter(Boolean).join(" — ")}/>
        <L l="Signataire" v={[ident.signataire,ident.qualite].filter(Boolean).join(", ")}/>
        {ident.banques&&<L l="Domiciliations bancaires" v={ident.banques}/>}
        {ident.dirigeants&&<L l="Dirigeants" v={ident.dirigeants}/>}
        <div style={{marginTop:12,fontSize:11,color:K.t2}}><b>Documents déposés :</b> {docs.join(" · ")}</div>
      </div>
    </Wrap>
  </>;
}

// ── FISCALITÉ : IMPÔT SUR LES BÉNÉFICES ET PROFITS (RDC) ─────────────────────────
function FiscTab({K,R,fisc,setF,canEdit,meta}){
  const f={...FISC_DEFAUT,categorie:categorieDe(meta?.ident?.centre),...fisc};
  const I=computeIBP(R,f);
  const st=fieldSt(K);
  const Lines=({k,titre})=><div style={{marginBottom:10}}>
    <div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:5}}>{titre}</div>
    {(f[k]||[]).map((x,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:5}}>
      <input disabled={!canEdit} style={{...st,minHeight:34,fontSize:12}} placeholder="Libellé" value={x.lib} onChange={e=>setF({...f,[k]:f[k].map((y,j)=>j===i?{...y,lib:e.target.value}:y)})}/>
      <div style={{width:160,flexShrink:0}}><NumCellBox K={K} value={x.m} dis={!canEdit} onChange={v=>setF({...f,[k]:f[k].map((y,j)=>j===i?{...y,m:v}:y)})}/></div>
      {canEdit&&<button onClick={()=>setF({...f,[k]:f[k].filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-trash"/></button>}
    </div>)}
    {canEdit&&<B K={K} sm v="g" ico="plus" ch="Ajouter" on={()=>setF({...f,[k]:[...(f[k]||[]),{lib:"",m:""}]})}/>}
  </div>;
  const rows=[
    ["Résultat net comptable (XI)",R.N.cr.XI],["+ IBP comptabilisé (compte 89)",I.ibpCompta],["= Résultat comptable avant impôt",I.rai,1],
    ...I.reint.map(x=>[`+ ${x.lib||"Réintégration"}${x.auto?" (repris de la balance)":""}`,x.m]),
    ...I.deduc.map(x=>[`− ${x.lib||"Déduction"}`,-x.m]),
    ["= Résultat fiscal avant imputation des déficits",I.avantDef,1],[`− ${num(f.minAnterieurs)>0?"Déficits et impôt minimum antérieurs imputés":"Déficits antérieurs imputés"} (plafond ${num(f.plafondDef)} % : ${fmt(I.plafondImput)}, art. 42)`,-I.imput],["= RÉSULTAT FISCAL",I.rf,2],
    ...(I.defReport>0?[[num(f.minAnterieurs)>0?"Reste reportable (déficits et impôt minimum) sur les exercices suivants":"Déficit restant reportable sur les exercices suivants",I.defReport]]:[]),
    [`IBP au taux de ${num(f.tauxIBP)} % du résultat fiscal`,I.ibpTheo],
    [I.sansCA?`Impôt forfaitaire sans chiffre d'affaires (${(CATEGORIES.find(c=>c[0]===f.categorie)||CATEGORIES[1])[1]})`:`Impôt minimum (${num(f.tauxMin)} % du chiffre d'affaires déclaré ${fmt(R.N.cr.XB)})`,I.minimum],
    [`= IBP DÛ${I.minApplique?(I.sansCA?" (impôt forfaitaire, art. 92)":` (impôt minimum, art. 92${I.enPerte?" : résultat déficitaire":" : IBP calculé inférieur au minimum"})`):" (taux de l'IBP)"}`,I.ibp,2],["− Acomptes provisionnels versés",-I.acomptes],[I.solde>=0?"= SOLDE D'IBP À PAYER":"= CRÉDIT D'IBP",I.solde,2],
  ];
  const exp=()=>downloadCSV(`IBP_${meta.societe}_${meta.exercice}`,[["Libellé","Montant"],...rows.map(([l,v])=>[l,Math.round(v)])]);
  const okC=Math.abs(I.ecart)<0.5;
  return <>
    <Toolbar K={K}><B K={K} sm ico="printer" ch="Imprimer / PDF" on={()=>window.print()}/><B K={K} sm v="g" ico="file-spreadsheet" ch="Export Excel (CSV)" on={exp}/></Toolbar>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:10,alignItems:"start"}}>
      <div className="ef-noprint" style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontWeight:700,color:K.t1,fontSize:13,marginBottom:3}}>Paramètres et retraitements extra-comptables</div>
        <div style={{color:K.t3,fontSize:11,marginBottom:10,lineHeight:1.5}}>L'IBP dû est le plus élevé de l'IBP au taux légal sur le résultat fiscal et de l'impôt minimum de 1 % du chiffre d'affaires déclaré, applicable en cas de perte ou lorsque l'IBP calculé lui est inférieur (art. 92). Sans chiffre d'affaires, l'impôt forfaitaire de la catégorie s'applique. Les dotations aux provisions et dépréciations sont réintégrées et leurs reprises déduites automatiquement (art. 46-6°) ; les déficits antérieurs et l'impôt minimum payé en période déficitaire s'imputent dans la limite de 60 % du bénéfice fiscal (art. 42). Les amendes et pénalités (647) sont réintégrées automatiquement.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 8px"}}>
          <Field K={K} lb="Taux IBP (%)"><NumCellBox K={K} value={f.tauxIBP} dis={!canEdit} onChange={v=>setF({...f,tauxIBP:v})}/></Field>
          <Field K={K} lb="Minimum (% du CA)"><NumCellBox K={K} value={f.tauxMin} dis={!canEdit} onChange={v=>setF({...f,tauxMin:v})}/></Field>
          <Field K={K} lb="Plafond d'imputation des déficits (%)"><NumCellBox K={K} value={f.plafondDef} dis={!canEdit} onChange={v=>setF({...f,plafondDef:v})}/></Field>
          <label style={{gridColumn:"1 / -1",display:"flex",alignItems:"flex-start",gap:8,fontSize:12,color:K.t2,marginBottom:12,cursor:canEdit?"pointer":"default",lineHeight:1.45}}>
            <input type="checkbox" disabled={!canEdit} checked={!!f.provAdmises} onChange={e=>setF({...f,provAdmises:e.target.checked})} style={{marginTop:2}}/>
            <span>Provisions admises en déduction : établissement de crédit ou de microfinance (créances douteuses) ou entreprise minière (art. 46-6°). Décochée, les dotations sont réintégrées.</span>
          </label>
          <div style={{gridColumn:"1 / -1"}}><Field K={K} lb="Catégorie (impôt forfaitaire si aucun chiffre d'affaires)"><select disabled={!canEdit} style={fieldSt(K)} value={f.categorie} onChange={e=>setF({...f,categorie:e.target.value})}>{CATEGORIES.map(([k,l])=><option key={k} value={k}>{l} — {fmt(FORFAIT_SANS_CA[k])} FC</option>)}</select></Field></div>
          <Field K={K} lb="Déficits antérieurs reportables"><NumCellBox K={K} value={f.deficits} dis={!canEdit} onChange={v=>setF({...f,deficits:v})}/></Field>
          <Field K={K} lb="Impôt minimum payé (exercices déficitaires antérieurs)" note="Déductible avec les déficits, dans la limite de 60 % (art. 42)."><NumCellBox K={K} value={f.minAnterieurs} dis={!canEdit} onChange={v=>setF({...f,minAnterieurs:v})}/></Field>
          <Field K={K} lb="Acomptes provisionnels versés"><NumCellBox K={K} value={f.acomptes} dis={!canEdit} onChange={v=>setF({...f,acomptes:v})}/></Field>
        </div>
        {Lines({k:"reint",titre:"Réintégrations (charges non déductibles)"})}
        {Lines({k:"deduc",titre:"Déductions (produits non imposables, abattements)"})}
      </div>
      <Wrap K={K} print>
        <PrintHead K={K} meta={meta} titre="DÉTERMINATION DE L'IMPÔT SUR LES BÉNÉFICES ET PROFITS (IBP)"/>
        <table style={{width:"100%",borderCollapse:"collapse"}}><tbody>
          {rows.map(([l,v,lvl],i)=><tr key={i} style={lvl===2?{fontWeight:800,background:K.emBg}:lvl===1?{fontWeight:700,background:K.c2}:{}}>
            <td style={{...td(K),textAlign:"left",fontFamily:"'Outfit',sans-serif",whiteSpace:"normal"}}>{l}</td>
            <td style={{...td(K),color:v<0?K.er:K.t1}}>{fmt(v)}</td></tr>)}
        </tbody></table>
        <div style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:okC?K.em:K.wa}}>{okC?"✓ L'IBP comptabilisé (89) correspond à l'IBP dû.":`⚠ Écart de ${fmt(I.ecart)} entre l'IBP dû et l'IBP comptabilisé (89) : régularisez l'écriture d'IBP (débit 891 / crédit 441) puis régénérez les états.`}</div>
      </Wrap>
    </div>
  </>;
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
      const u=await chercherCompte(db,m,staff);
      if(!u){sMsg("Aucun compte trouvé : votre collègue doit être inscrit sur Éco-Campus et s'être connecté au moins une fois depuis la mise en service de l'atelier.");sBusy(false);return;}
      if((d.membres||[]).includes(u.uid)){sMsg("Déjà membre du dossier.");sBusy(false);return;}
      await updateDoc(dref,{membres:arrayUnion(u.uid),[`membresInfo.${u.uid}`]:{nom:u.nom,mail:m},...stamp});
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
