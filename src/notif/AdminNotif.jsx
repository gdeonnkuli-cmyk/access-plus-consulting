import React,{useState,useEffect}from"react";
import{collection,doc,onSnapshot,deleteDoc,writeBatch,setDoc,getDoc}from"firebase/firestore";
import{TYPES,GROUPES,estGroupe,notifier,depuis}from"./notif";

// Liens proposés : vue ouverte quand le destinataire touche la notification
export const VUES=[["","Aucun lien"],["home","Accueil"],["audio","Écouter les cours"],["cpt","Guide des comptes"],["fisc","Code des impôts"],["ef","États financiers"],["videos","Vidéos"],["pres","Cours"],["msg","Messages"],["sugg","Suggestions"],["param","Paramètres"]];
const PURGE_J=90;

const champ=K=>({width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"});
function Lb({K,children}){return <div style={{fontSize:12.5,fontWeight:700,color:K.t2,margin:"0 0 5px"}}>{children}</div>;}
function Carte({K,children,sx}){return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14,...sx}}>{children}</div>;}

export default function AdminNotif({K,mob,db,users=[]}){
  const[f,sF]=useState({dest:"apprenants",uid:"",type:"info",titre:"",texte:"",vue:"",email:false,push:true});
  const[q,sQ]=useState(""),[busy,sBusy]=useState(false),[msg,sMsg]=useState(null);
  const[hist,sHist]=useState([]),[vapid,sVapid]=useState(""),[vapidOk,sVapidOk]=useState(false),[serveur,sServeur]=useState(null);
  useEffect(()=>onSnapshot(collection(db,"notifications"),s=>{const L=s.docs.map(d=>({id:d.id,...d.data(),t:d.data().ts?.toMillis?.()??Date.now()}));L.sort((a,b)=>b.t-a.t);sHist(L);},()=>{}),[db]);
  useEffect(()=>{getDoc(doc(db,"config","push")).then(s=>{const v=s.data()?.vapid||"";sVapid(v);sVapidOk(!!v);}).catch(()=>{});
    fetch("/api/push").then(r=>r.ok?r.json():null).then(j=>sServeur(j?!!j.configure:false)).catch(()=>sServeur(false));},[db]);
  const flash=(t,m)=>{sMsg({t,m});setTimeout(()=>sMsg(null),4500);};
  const seul=f.dest==="user";
  const cible=seul?users.find(u=>u.uid===f.uid):null;
  const trouves=q.trim()?users.filter(u=>`${u.nom||""} ${u.mail||""}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0,8):[];
  const envoyer=async()=>{
    if(!f.titre.trim())return flash("e","Indiquez un titre.");
    if(seul&&!cible)return flash("e","Choisissez le destinataire.");
    sBusy(true);
    const id=await notifier({dest:seul?cible.uid:f.dest,type:f.type,titre:f.titre.trim(),texte:f.texte.trim(),vue:f.vue,auteurNom:"Éco-Campus RDC",email:seul&&f.email,push:f.push});
    sBusy(false);
    if(id){flash("o",`Notification envoyée à ${seul?cible.nom||cible.mail:GROUPES[f.dest]}.`);sF({...f,titre:"",texte:""});}else flash("e","Envoi impossible : vérifiez votre connexion et les règles Firestore publiées.");
  };
  const purger=async()=>{
    const lim=Date.now()-PURGE_J*864e5,vieux=hist.filter(n=>n.t<lim);
    if(!vieux.length)return flash("o",`Aucune notification de plus de ${PURGE_J} jours.`);
    if(!window.confirm(`Supprimer ${vieux.length} notification(s) de plus de ${PURGE_J} jours ?`))return;
    for(let i=0;i<vieux.length;i+=400){const b=writeBatch(db);vieux.slice(i,i+400).forEach(n=>b.delete(doc(db,"notifications",n.id)));await b.commit();}
    flash("o",`${vieux.length} notification(s) supprimée(s).`);
  };
  const saveVapid=async()=>{try{await setDoc(doc(db,"config","push"),{vapid:vapid.trim()},{merge:true});sVapidOk(!!vapid.trim());flash("o","Clé publique enregistrée.");}catch(e){flash("e",e.message);}};
  const nomDest=d=>estGroupe(d)?GROUPES[d]:(users.find(u=>u.uid===d)?.nom||"Utilisateur");
  const st=champ(K);
  return <div style={{animation:"up .25s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,color:K.t1,marginBottom:3}}>Notifications</div>
    <div style={{color:K.t3,fontSize:13,marginBottom:13}}>Envoyez une information dans la cloche de l'application, sur les téléphones (push) et, pour une personne, par e-mail.</div>
    {msg&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,color:msg.t==="o"?K.em:K.er,borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:14,fontWeight:600}}>{msg.m}</div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"minmax(0,1.1fr) minmax(0,.9fr)",gap:14,alignItems:"start"}}>
      <Carte K={K}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:12}}><i className="ti ti-send" style={{marginRight:6,color:K.in_}}/>Nouvelle notification</div>
        <Lb K={K}>Destinataires</Lb>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {[["apprenants","users","Apprenants"],["formateurs","school","Formateurs"],["all","world","Tout le monde"],["user","user","Une personne"]].map(([k,ic,l])=>{const a=f.dest===k;
            return <button key={k} onClick={()=>sF({...f,dest:k})} className="bt" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:99,border:`1px solid ${a?K.em:K.b1}`,background:a?K.emBg:K.c2,color:a?K.em:K.t2,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-${ic}`}/>{l}</button>;})}
        </div>
        {seul&&<div style={{marginBottom:10}}>
          {cible?<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:10,padding:"8px 11px"}}>
            <span style={{fontSize:14,color:K.t1}}><b>{cible.nom||"—"}</b> · {cible.mail}</span>
            <button onClick={()=>sF({...f,uid:""})} className="bt" style={{background:"none",border:"none",color:K.er,cursor:"pointer"}}><i className="ti ti-x"/></button></div>
          :<><input value={q} onChange={e=>sQ(e.target.value)} placeholder="Rechercher un nom ou un e-mail…" style={st}/>
            {trouves.map(u=><button key={u.uid} onClick={()=>{sF({...f,uid:u.uid});sQ("");}} className="bt" style={{display:"block",width:"100%",textAlign:"left",background:K.card,border:`1px solid ${K.b0}`,borderRadius:9,padding:"8px 11px",marginTop:5,color:K.t1,fontSize:13.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{u.nom||"—"} <span style={{color:K.t3}}>· {u.mail} · {u.role==="formateur"?"formateur":"apprenant"}</span></button>)}</>}
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><Lb K={K}>Type</Lb><select value={f.type} onChange={e=>sF({...f,type:e.target.value})} style={st}>{["info","annonce","module","video","pres","abonnement"].map(k=><option key={k} value={k}>{TYPES[k].l}</option>)}</select></div>
          <div><Lb K={K}>Ouvre</Lb><select value={f.vue} onChange={e=>sF({...f,vue:e.target.value})} style={st}>{VUES.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        <div style={{marginTop:10}}><Lb K={K}>Titre ({f.titre.length}/120)</Lb><input value={f.titre} maxLength={120} onChange={e=>sF({...f,titre:e.target.value})} placeholder="Ex. Nouveau module : la TVA en 30 minutes" style={st}/></div>
        <div style={{marginTop:10}}><Lb K={K}>Message ({f.texte.length}/1000)</Lb><textarea value={f.texte} maxLength={1000} onChange={e=>sF({...f,texte:e.target.value})} rows={4} placeholder="Détails, date, lien…" style={{...st,resize:"vertical"}}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:7,margin:"12px 0"}}>
          <label style={{display:"flex",gap:8,alignItems:"center",fontSize:13.5,color:K.t2,cursor:"pointer"}}><input type="checkbox" checked={f.push} onChange={e=>sF({...f,push:e.target.checked})}/>Notification sur les téléphones (push){serveur===false&&<span style={{color:K.wa,fontSize:12}}> — non configurée</span>}</label>
          <label style={{display:"flex",gap:8,alignItems:"center",fontSize:13.5,color:seul?K.t2:K.t3,cursor:seul?"pointer":"default"}}><input type="checkbox" disabled={!seul} checked={seul&&f.email} onChange={e=>sF({...f,email:e.target.checked})}/>Copie par e-mail (une personne seulement, selon ses préférences)</label>
        </div>
        <button onClick={envoyer} disabled={busy} className="bt" style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7,opacity:busy?.6:1}}>
          <i className="ti ti-send"/>{busy?"Envoi…":"Envoyer la notification"}</button>
      </Carte>
      <div>
        <Carte K={K}>
          <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:6}}><i className="ti ti-device-mobile" style={{marginRight:6,color:K.in_}}/>Notifications sur téléphone</div>
          <div style={{fontSize:13,color:K.t2,lineHeight:1.55,marginBottom:8}}>
            Serveur d'envoi : {serveur==null?"vérification…":serveur?<b style={{color:K.em}}>configuré</b>:<b style={{color:K.wa}}>à configurer</b>} · Clé publique : {vapidOk?<b style={{color:K.em}}>enregistrée</b>:<b style={{color:K.wa}}>manquante</b>}
          </div>
          <Lb K={K}>Clé publique Web Push (VAPID)</Lb>
          <input value={vapid} onChange={e=>sVapid(e.target.value)} placeholder="Console Firebase → Paramètres → Cloud Messaging → Certificats Web Push" style={{...st,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
          <button onClick={saveVapid} className="bt" style={{marginTop:8,padding:"8px 13px",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:10,color:K.t1,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Enregistrer la clé</button>
        </Carte>
        <Carte K={K}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}}>
            <div style={{fontWeight:800,fontSize:15,color:K.t1}}><i className="ti ti-history" style={{marginRight:6,color:K.in_}}/>Historique ({hist.length})</div>
            <button onClick={purger} className="bt" style={{padding:"6px 11px",background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:9,color:K.er,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-trash" style={{marginRight:4}}/>Purger &gt; {PURGE_J} j</button>
          </div>
          <div style={{maxHeight:420,overflowY:"auto"}}>
            {!hist.length&&<div style={{color:K.t3,fontSize:13.5,padding:"10px 0"}}>Aucune notification envoyée.</div>}
            {hist.slice(0,80).map(n=>{const ty=TYPES[n.type]||TYPES.info;return <div key={n.id} style={{display:"flex",gap:9,padding:"9px 0",borderTop:`1px solid ${K.b0}`}}>
              <i className={`ti ti-${ty.ico}`} style={{fontSize:17,color:ty.col,marginTop:2}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5,color:K.t1}}>{n.titre}</div>
                <div style={{fontSize:12,color:K.t3}}>→ {nomDest(n.dest)} · {n.auteurNom||"—"} · {depuis(n.t)}</div></div>
              <button onClick={()=>window.confirm("Supprimer cette notification ?")&&deleteDoc(doc(db,"notifications",n.id))} className="bt" title="Supprimer" style={{background:"none",border:"none",color:K.t3,cursor:"pointer"}}><i className="ti ti-trash"/></button>
            </div>;})}
          </div>
        </Carte>
      </div>
    </div>
  </div>;
}
