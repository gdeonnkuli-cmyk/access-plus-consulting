import React,{useState,useEffect}from"react";
import{doc,onSnapshot,setDoc}from"firebase/firestore";
import{TYPES_MKT,CIBLES,INTERVALLES,MKT_DEFAUT,BANQUE,useMessageDuMoment,messageDuMoment,mktDesactive,setMktDesactive}from"./marketing";
import{VUES}from"./AdminNotif";

// Bandeau « message du moment » sur l'accueil de l'apprenant (même message que dans la cloche)
export default function MessageDuMoment({K,mob,db,uid,user,onGo}){
  const{msg,lu,marquer}=useMessageDuMoment({db,uid,user});
  if(!msg||lu)return null;
  const ty=TYPES_MKT[msg.type]||TYPES_MKT.astuce;
  const ouvrir=()=>{marquer();if(msg.vue&&onGo)onGo(msg.vue);};
  return <div style={{display:"flex",gap:12,alignItems:"flex-start",background:`linear-gradient(135deg,${ty.col}14,${ty.col}05)`,border:`1px solid ${ty.col}40`,borderRadius:16,padding:mob?"12px 13px":"14px 16px",marginBottom:16,animation:"fadeIn .3s ease"}}>
    <div style={{width:40,height:40,borderRadius:12,background:`${ty.col}1F`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${ty.ico}`} style={{fontSize:20,color:ty.col}}/></div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:11.5,fontWeight:800,color:ty.col,textTransform:"uppercase",letterSpacing:.6}}>{ty.l} du moment</div>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,lineHeight:1.3,marginTop:2}}>{msg.titre}</div>
      <div style={{fontSize:13.5,color:K.t2,lineHeight:1.5,marginTop:3}}>{msg.texte}</div>
      {msg.vue&&<button onClick={ouvrir} className="bt" style={{marginTop:9,display:"inline-flex",alignItems:"center",gap:6,background:ty.col,border:"none",color:"#fff",borderRadius:10,padding:"8px 13px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{msg.vue==="acces"?"Voir les offres":"J'y vais"}<i className="ti ti-arrow-right"/></button>}
    </div>
    <button onClick={marquer} className="bt" title="Masquer" aria-label="Masquer le message" style={{background:"none",border:"none",color:K.t3,cursor:"pointer",padding:2,flexShrink:0}}><i className="ti ti-x" style={{fontSize:18}}/></button>
  </div>;
}

// Réglage propre à l'appareil, dans Paramètres
export function ReglageMarketing({K,Interrupteur}){
  const[off,sOff]=useState(mktDesactive());
  return <Interrupteur on={!off} set={v=>{setMktDesactive(!v);sOff(!v);}} lib="Astuces et offres du moment" sous="Un court message toutes les quelques heures dans la cloche et sur l'accueil : astuces fiscales, défis, nouveautés."/>;
}

// Panneau admin : activer, régler la fréquence, désactiver des messages, ajouter les vôtres
const champ=K=>({width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"});
export function AdminMarketing({K,mob,db}){
  const[cfg,sCfg]=useState(null),[voir,sVoir]=useState(false),[n,sN]=useState({cible:"tous",type:"astuce",titre:"",texte:"",vue:""}),[msg,sMsg]=useState(null);
  useEffect(()=>onSnapshot(doc(db,"config","marketing"),s=>sCfg({...MKT_DEFAUT,...(s.data()||{})}),()=>sCfg({...MKT_DEFAUT})),[db]);
  if(!cfg)return null;
  const flash=(t,m)=>{sMsg({t,m});setTimeout(()=>sMsg(null),3500);};
  const maj=async p=>{try{await setDoc(doc(db,"config","marketing"),p,{merge:true});}catch(e){flash("e","Enregistrement impossible : vérifiez votre connexion.");}};
  const off=new Set(cfg.desactives||[]);
  const basculer=id=>maj({desactives:off.has(id)?[...off].filter(x=>x!==id):[...off,id]});
  const ajouter=async()=>{if(!n.titre.trim()||!n.texte.trim())return flash("e","Indiquez un titre et un texte.");
    await maj({perso:[...(cfg.perso||[]),{...n,id:`p${Date.now().toString(36)}`,titre:n.titre.trim().slice(0,90),texte:n.texte.trim().slice(0,240)}]});sN({...n,titre:"",texte:""});flash("o","Message ajouté à la rotation.");};
  const retirer=id=>maj({perso:(cfg.perso||[]).filter(m=>m.id!==id)});
  const apercu=c=>messageDuMoment({uid:`apercu-${c}`,user:c==="abonnes"?{abonnement:"actif",dateExpiration:"2999-01-01"}:{},cfg});
  const nActifs=BANQUE.filter(m=>!off.has(m.id)).length+(cfg.perso||[]).length;
  const Ligne=({m,perso})=><div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderTop:`1px solid ${K.b0}`,opacity:!perso&&off.has(m.id)?.5:1}}>
    <i className={`ti ti-${(TYPES_MKT[m.type]||TYPES_MKT.astuce).ico}`} style={{fontSize:17,color:(TYPES_MKT[m.type]||TYPES_MKT.astuce).col,marginTop:2}}/>
    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5,color:K.t1}}>{m.titre}</div><div style={{fontSize:12.5,color:K.t3,lineHeight:1.45}}>{m.texte}</div><div style={{fontSize:11.5,color:K.t3,marginTop:2}}>{CIBLES[m.cible]}{perso?" · ajouté par vous":""}</div></div>
    {perso?<button onClick={()=>retirer(m.id)} className="bt" title="Supprimer" style={{background:"none",border:"none",color:K.er,cursor:"pointer"}}><i className="ti ti-trash"/></button>
      :<button onClick={()=>basculer(m.id)} className="bt" style={{background:"none",border:`1px solid ${K.b1}`,borderRadius:8,color:K.t2,cursor:"pointer",fontSize:12,fontWeight:700,padding:"4px 8px",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>{off.has(m.id)?"Réactiver":"Retirer"}</button>}
  </div>;
  return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1}}><i className="ti ti-speakerphone" style={{fontSize:19,color:"#C98A1B"}}/>Messages automatiques</div>
    <div style={{fontSize:13,color:K.t3,margin:"3px 0 12px",lineHeight:1.5}}>Un message tiré au hasard, renouvelé automatiquement, s'affiche dans la cloche et sur l'accueil des apprenants : offres pour ceux qui n'ont pas d'accès, défis et nouveautés pour les abonnés, astuces pour tous. Pas de notification sur le téléphone.</div>
    {msg&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,color:msg.t==="o"?K.em:K.er,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,borderRadius:10,padding:"8px 12px",fontSize:13.5,fontWeight:600,marginBottom:10}}>{msg.m}</div>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
      <button onClick={()=>maj({actif:!cfg.actif})} className="bt" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:11,cursor:"pointer",fontWeight:800,fontSize:13.5,fontFamily:"'Outfit',sans-serif",background:cfg.actif?K.emBg:K.c2,border:`1px solid ${cfg.actif?K.emBd:K.b1}`,color:cfg.actif?K.em:K.t2}}><i className={`ti ti-toggle-${cfg.actif?"right":"left"}`} style={{fontSize:18}}/>{cfg.actif?"Activés":"Désactivés"}</button>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13.5,color:K.t2,fontWeight:700}}>Nouveau message toutes les
        <select value={cfg.intervalleH} onChange={e=>maj({intervalleH:Number(e.target.value)})} style={{...champ(K),width:"auto",padding:"7px 10px"}}>{INTERVALLES.map(h=><option key={h} value={h}>{h} h</option>)}</select></label>
      <span style={{fontSize:12.5,color:K.t3}}>{nActifs} messages en rotation</span>
    </div>
    {cfg.actif&&<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>{["visiteurs","abonnes"].map(c=>{const m=apercu(c);return <div key={c} style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
      <div style={{fontSize:11.5,fontWeight:800,color:K.t3,textTransform:"uppercase",letterSpacing:.5}}>En ce moment · {CIBLES[c]}</div>
      {m?<><div style={{fontWeight:800,fontSize:13.5,color:K.t1,marginTop:3}}>{m.titre}</div><div style={{fontSize:12.5,color:K.t2,lineHeight:1.45}}>{m.texte}</div></>:<div style={{fontSize:12.5,color:K.t3}}>Aucun message pour ce public.</div>}
    </div>;})}</div>}
    <div style={{fontWeight:800,fontSize:14,color:K.t1,margin:"4px 0 8px"}}>Ajouter votre message</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
      <select value={n.cible} onChange={e=>sN({...n,cible:e.target.value})} style={champ(K)}>{Object.entries(CIBLES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
      <select value={n.type} onChange={e=>sN({...n,type:e.target.value})} style={champ(K)}>{Object.entries(TYPES_MKT).map(([k,t])=><option key={k} value={k}>{t.l}</option>)}</select>
      <select value={n.vue} onChange={e=>sN({...n,vue:e.target.value})} style={{...champ(K),...(mob?{gridColumn:"1 / -1"}:{})}}>{[...VUES,["acces","Obtenir l'accès (offres)"]].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    </div>
    <input value={n.titre} onChange={e=>sN({...n,titre:e.target.value})} maxLength={90} placeholder="Titre accrocheur (ex. : Promo de rentrée : 3 mois pour {t} $)" style={{...champ(K),marginBottom:8}}/>
    <textarea value={n.texte} onChange={e=>sN({...n,texte:e.target.value})} maxLength={240} rows={2} placeholder="Message (240 caractères au plus). {m}, {t} et {a} sont remplacés par vos prix." style={{...champ(K),resize:"vertical",marginBottom:8}}/>
    <button onClick={ajouter} className="bt" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:11,cursor:"pointer",fontWeight:800,fontSize:13.5,fontFamily:"'Outfit',sans-serif",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",color:"#fff"}}><i className="ti ti-plus"/>Ajouter à la rotation</button>
    {(cfg.perso||[]).length>0&&<div style={{marginTop:12}}>{cfg.perso.map(m=><Ligne key={m.id} m={m} perso/>)}</div>}
    <button onClick={()=>sVoir(v=>!v)} className="bt" style={{marginTop:12,background:"none",border:"none",color:K.in_,fontWeight:700,fontSize:13.5,cursor:"pointer",padding:0,fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-chevron-${voir?"up":"down"}`}/> {voir?"Masquer":"Voir"} les {BANQUE.length} messages fournis</button>
    {voir&&<div style={{marginTop:6}}>{BANQUE.map(m=><Ligne key={m.id} m={m}/>)}</div>}
  </div>;
}
