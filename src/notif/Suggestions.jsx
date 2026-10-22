import React,{useState,useEffect}from"react";
import{collection,doc,addDoc,updateDoc,deleteDoc,onSnapshot,query,where,serverTimestamp}from"firebase/firestore";
import{notifier,depuis}from"./notif";

// ══════════════════ BOÎTE À SUGGESTIONS ══════════════════
// Collection « suggestions » : { uid, nom, mail, role, cat, texte, ts, statut, reponse?, reponseTs? }
export const CATS={idee:{l:"Idée d'amélioration",ico:"bulb",col:"#C98A1B"},bug:{l:"Problème / bug",ico:"bug",col:"#A3122A"},contenu:{l:"Contenu pédagogique",ico:"book-2",col:"#1E4FA3"},autre:{l:"Autre",ico:"message-2",col:"#4A5B78"}};
export const STATUTS={nouveau:{l:"Reçue",col:"#1E4FA3"},en_cours:{l:"En cours d'étude",col:"#C98A1B"},realise:{l:"Réalisée",col:"#0D7A6B"},rejete:{l:"Non retenue",col:"#8492AB"}};
const tms=d=>d.ts?.toMillis?.()??Date.now();
const champ=K=>({width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"});
const Pastille=({s})=>{const x=STATUTS[s]||STATUTS.nouveau;return <span style={{fontSize:11.5,fontWeight:800,color:x.col,background:`${x.col}16`,border:`1px solid ${x.col}35`,borderRadius:99,padding:"2px 9px",whiteSpace:"nowrap"}}>{x.l}</span>;};

// Espace utilisateur (apprenant, formateur) : envoyer une suggestion et suivre les réponses
export function Suggestions({K,mob,db,me}){
  const[cat,sCat]=useState("idee"),[texte,sTexte]=useState(""),[busy,sBusy]=useState(false),[msg,sMsg]=useState(null),[mes,sMes]=useState([]);
  useEffect(()=>{if(!me?.uid)return;return onSnapshot(query(collection(db,"suggestions"),where("uid","==",me.uid)),s=>sMes(s.docs.map(d=>({id:d.id,...d.data(),t:tms(d.data())})).sort((a,b)=>b.t-a.t)),()=>{});},[db,me?.uid]);
  const envoyer=async()=>{
    const t=texte.trim();if(t.length<5)return sMsg({t:"e",m:"Décrivez votre suggestion en quelques mots (5 caractères au moins)."});
    sBusy(true);
    try{
      await addDoc(collection(db,"suggestions"),{uid:me.uid,nom:me.nom||"",mail:me.mail||"",role:me.role,cat,texte:t.slice(0,2000),ts:serverTimestamp(),statut:"nouveau"});
      notifier({dest:"admin",type:"suggestion",titre:`Nouvelle suggestion : ${CATS[cat].l}`,texte:`${me.nom||me.mail||""} : ${t.slice(0,200)}`,vue:"sg",auteurNom:me.nom||""});
      sTexte("");sMsg({t:"o",m:"Merci ! Votre suggestion a été transmise à l'équipe Éco-Campus. Vous serez notifié(e) de sa réponse."});
    }catch(e){sMsg({t:"e",m:"Envoi impossible. Vérifiez votre connexion et réessayez."});}
    sBusy(false);
  };
  const st=champ(K);
  return <div style={{maxWidth:760,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:`linear-gradient(135deg,#7A5A12,#C98A1B)`,borderRadius:20,padding:mob?"18px 16px":"22px 24px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-bulb" style={{position:"absolute",right:-6,bottom:-18,fontSize:120,opacity:.12}}/>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?23:28}}>Boîte à suggestions</div>
      <div style={{fontSize:14.5,opacity:.92,lineHeight:1.55,marginTop:4,maxWidth:520}}>Une idée, un module à ajouter, un problème rencontré ? Écrivez-nous : chaque message est lu par l'équipe et reçoit une réponse.</div>
    </div>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14}}>
      <div style={{fontSize:12.5,fontWeight:700,color:K.t2,marginBottom:6}}>Catégorie</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {Object.entries(CATS).map(([k,c])=>{const a=cat===k;return <button key={k} onClick={()=>sCat(k)} className="bt" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:99,border:`1px solid ${a?c.col:K.b1}`,background:a?`${c.col}16`:K.c2,color:a?c.col:K.t2,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-${c.ico}`}/>{c.l}</button>;})}
      </div>
      <div style={{fontSize:12.5,fontWeight:700,color:K.t2,marginBottom:6}}>Votre message ({texte.length}/2000)</div>
      <textarea value={texte} onChange={e=>sTexte(e.target.value)} maxLength={2000} rows={5} placeholder={cat==="bug"?"Décrivez ce qui ne fonctionne pas : écran, action, message d'erreur, téléphone utilisé…":"Votre idée, en quelques lignes…"} style={{...st,resize:"vertical"}}/>
      {msg&&<div style={{marginTop:10,background:msg.t==="o"?K.emBg:K.erBg,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,color:msg.t==="o"?K.em:K.er,borderRadius:10,padding:"9px 12px",fontSize:13.5,fontWeight:600}}>{msg.m}</div>}
      <button onClick={envoyer} disabled={busy} className="bt" style={{marginTop:12,width:"100%",padding:"12px",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7,opacity:busy?.6:1}}>
        <i className="ti ti-send"/>{busy?"Envoi…":"Envoyer ma suggestion"}</button>
    </div>
    {mes.length>0&&<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 18px",marginBottom:20}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:6}}>Mes suggestions ({mes.length})</div>
      {mes.map(s=>{const c=CATS[s.cat]||CATS.autre;return <div key={s.id} style={{padding:"11px 0",borderTop:`1px solid ${K.b0}`}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:12.5,fontWeight:800,color:c.col}}><i className={`ti ti-${c.ico}`} style={{marginRight:4}}/>{c.l} · <span style={{color:K.t3,fontWeight:600}}>{depuis(s.t)}</span></span><Pastille s={s.statut}/></div>
        <div style={{fontSize:14,color:K.t1,lineHeight:1.55,whiteSpace:"pre-line"}}>{s.texte}</div>
        {s.reponse&&<div style={{marginTop:8,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:10,padding:"9px 12px"}}><div style={{fontSize:12,fontWeight:800,color:K.in_,marginBottom:2}}>Réponse de l'équipe Éco-Campus</div><div style={{fontSize:14,color:K.t1,lineHeight:1.55,whiteSpace:"pre-line"}}>{s.reponse}</div></div>}
      </div>;})}
    </div>}
  </div>;
}

// Espace administrateur : toutes les suggestions, filtre par statut, réponse (notifiée à l'auteur, copie e-mail)
export function AdminSuggestions({K,mob,db}){
  const[liste,sListe]=useState([]),[filtre,sFiltre]=useState("ouvertes"),[rep,sRep]=useState({}),[busy,sBusy]=useState("");
  useEffect(()=>onSnapshot(collection(db,"suggestions"),s=>sListe(s.docs.map(d=>({id:d.id,...d.data(),t:tms(d.data())})).sort((a,b)=>b.t-a.t)),()=>{}),[db]);
  const vis=liste.filter(s=>filtre==="toutes"?true:filtre==="ouvertes"?["nouveau","en_cours"].includes(s.statut):s.statut===filtre);
  const repondre=async(s,statut)=>{
    const r=(rep[s.id]??s.reponse??"").trim();sBusy(s.id);
    try{
      await updateDoc(doc(db,"suggestions",s.id),{statut,...(r?{reponse:r.slice(0,2000),reponseTs:serverTimestamp()}:{})});
      notifier({dest:s.uid,type:"suggestion",titre:`Votre suggestion : ${STATUTS[statut].l.toLowerCase()}`,texte:r||`« ${s.texte.slice(0,120)} »`,vue:"sugg",auteurNom:"Éco-Campus RDC",email:!!r});
    }catch(e){alert("Enregistrement impossible : "+e.message);}
    sBusy("");
  };
  const n=k=>liste.filter(s=>k==="ouvertes"?["nouveau","en_cours"].includes(s.statut):k==="toutes"||s.statut===k).length;
  const st=champ(K);
  return <div style={{animation:"up .25s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,color:K.t1,marginBottom:3}}>Suggestions</div>
    <div style={{color:K.t3,fontSize:13,marginBottom:12}}>Idées, problèmes et demandes de contenu envoyés par les utilisateurs. Votre réponse est notifiée à l'auteur (et envoyée par e-mail selon ses préférences).</div>
    <div className="tn" style={{gap:6,marginBottom:12}}>
      {[["ouvertes","À traiter"],["realise","Réalisées"],["rejete","Non retenues"],["toutes","Toutes"]].map(([k,l])=>{const a=filtre===k;return <button key={k} onClick={()=>sFiltre(k)} className="bt" style={{padding:"7px 13px",borderRadius:99,border:`1px solid ${a?K.em:K.b0}`,background:a?K.emBg:K.c2,color:a?K.em:K.t2,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0}}>{l} ({n(k)})</button>;})}
    </div>
    {!vis.length&&<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:16,padding:"30px",textAlign:"center",color:K.t3}}><i className="ti ti-mood-smile" style={{fontSize:28,display:"block",marginBottom:6}}/>Aucune suggestion dans cette liste.</div>}
    {vis.map(s=>{const c=CATS[s.cat]||CATS.autre;return <div key={s.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap",marginBottom:6}}>
        <div><div style={{fontWeight:800,fontSize:14.5,color:K.t1}}>{s.nom||"—"} <span style={{fontWeight:600,color:K.t3,fontSize:12.5}}>· {s.role==="formateur"?"formateur":"apprenant"} · {s.mail}</span></div>
          <div style={{fontSize:12.5,color:c.col,fontWeight:800,marginTop:2}}><i className={`ti ti-${c.ico}`} style={{marginRight:4}}/>{c.l} · <span style={{color:K.t3,fontWeight:600}}>{depuis(s.t)}</span></div></div>
        <Pastille s={s.statut}/>
      </div>
      <div style={{fontSize:14.5,color:K.t1,lineHeight:1.6,whiteSpace:"pre-line",marginBottom:10}}>{s.texte}</div>
      <textarea value={rep[s.id]??s.reponse??""} onChange={e=>sRep({...rep,[s.id]:e.target.value})} rows={2} placeholder="Réponse à l'auteur (facultatif)…" style={{...st,resize:"vertical",fontSize:13.5}}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
        {[["en_cours","hourglass","En cours",K.wa],["realise","check","Réalisée",K.em],["rejete","x","Non retenue",K.t3]].map(([k,ic,l,col])=><button key={k} disabled={busy===s.id} onClick={()=>repondre(s,k)} className="bt" style={{display:"flex",alignItems:"center",gap:4,padding:"7px 11px",borderRadius:9,border:`1px solid ${K.b1}`,background:s.statut===k?`${col}18`:K.c2,color:col,fontWeight:800,fontSize:12.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-${ic}`}/>{l}</button>)}
        <button onClick={()=>window.confirm("Supprimer cette suggestion ?")&&deleteDoc(doc(db,"suggestions",s.id))} className="bt" style={{marginLeft:"auto",background:"none",border:"none",color:K.t3,cursor:"pointer"}} title="Supprimer"><i className="ti ti-trash"/></button>
      </div>
    </div>;})}
  </div>;
}
