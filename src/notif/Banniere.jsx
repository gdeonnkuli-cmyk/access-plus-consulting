import React,{useState,useEffect,useRef}from"react";
import{doc,onSnapshot,setDoc}from"firebase/firestore";
import{TYPES_MKT,CIBLES,INTERVALLES,MKT_DEFAUT,BANQUE,rotation,intervalleMs,useBanniere,mktDesactive,setMktDesactive}from"./marketing";
import{VUES}from"./AdminNotif";

const CSS_PUB=`@keyframes pubIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pubBarre{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.pub-anim{animation:none!important}}`;

// Bannière publicitaire de l'accueil : un court message toutes les 30 secondes, en fondu ;
// pause au survol ou au toucher ; points pour naviguer ; croix pour la masquer (réactivable dans Paramètres).
export default function Banniere({K,mob,db,uid,user,onGo}){
  const{cfg,prix,off}=useBanniere(db);
  const L=cfg&&!off?rotation({uid,user,cfg,prix}):[];
  const[i,sI]=useState(0),[pause,sPause]=useState(false),[cache,sCache]=useState(typeof document!=="undefined"&&document.hidden);
  const pas=intervalleMs(cfg),n=L.length,idx=n?i%n:0;
  const minuteur=useRef(null);
  useEffect(()=>{const f=()=>sCache(document.hidden);document.addEventListener("visibilitychange",f);return()=>document.removeEventListener("visibilitychange",f);},[]);
  useEffect(()=>{
    clearTimeout(minuteur.current);
    if(n<2||pause||cache)return;
    minuteur.current=setTimeout(()=>sI(x=>x+1),pas);
    return()=>clearTimeout(minuteur.current);
  },[i,n,pas,pause,cache]);
  if(!n)return null;
  const m=L[idx],ty=TYPES_MKT[m.type]||TYPES_MKT.astuce;
  const aller=()=>{if(m.vue&&onGo)onGo(m.vue);};
  return <div onPointerEnter={()=>sPause(true)} onPointerLeave={()=>sPause(false)} onTouchStart={()=>sPause(true)} onTouchEnd={()=>setTimeout(()=>sPause(false),4000)}
    role="region" aria-roledescription="carrousel" aria-label="Annonces Éco-Campus"
    style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:16,background:`linear-gradient(120deg,${ty.col},${ty.col}CC 55%,${K.emD||"#0A2A5C"})`,color:"#fff",boxShadow:`0 10px 28px ${ty.col}33`,transition:"background .8s ease"}}>
    <style>{CSS_PUB}</style>
    <i className={`ti ti-${ty.ico}`} aria-hidden style={{position:"absolute",right:mob?-14:6,bottom:mob?-18:-24,fontSize:mob?110:140,opacity:.14,pointerEvents:"none"}}/>
    <div key={`${m.id}-${idx}`} className="pub-anim" aria-live="polite" style={{position:"relative",padding:mob?"14px 44px 40px 16px":"16px 52px 38px 20px",minHeight:mob?128:112,animation:"pubIn .55s ease both"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:800,letterSpacing:.7,textTransform:"uppercase",background:"rgba(255,255,255,.18)",borderRadius:99,padding:"3px 9px"}}><i className={`ti ti-${ty.ico}`}/>{ty.l}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?18:20,lineHeight:1.25,marginTop:7}}>{m.titre}</div>
      <div style={{fontSize:13.5,lineHeight:1.5,opacity:.93,marginTop:4,maxWidth:620}}>{m.texte}</div>
      {m.vue&&<button onClick={aller} className="bt" style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,background:"#fff",color:ty.col,border:"none",borderRadius:10,padding:"7px 13px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{m.vue==="acces"?"Voir les offres":"Découvrir"}<i className="ti ti-arrow-right"/></button>}
    </div>
    <button onClick={()=>setMktDesactive(true)} className="bt" title="Masquer les annonces" aria-label="Masquer les annonces" style={{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.18)",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-x" style={{fontSize:16}}/></button>
    {n>1&&<div style={{position:"absolute",right:mob?8:12,bottom:9,display:"flex",alignItems:"center",gap:4}}>
      {[["chevron-left",-1,"Annonce précédente"],["chevron-right",1,"Annonce suivante"]].map(([ic,d,l])=><button key={ic} onClick={()=>sI(x=>x+d+n)} aria-label={l} className="bt" style={{width:26,height:26,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.18)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><i className={`ti ti-${ic}`} style={{fontSize:15}}/></button>)}
      <span style={{fontSize:11.5,fontWeight:700,opacity:.85,minWidth:38,textAlign:"right"}}>{idx+1} / {n}</span>
    </div>}
    {n>1&&<div key={`b-${i}-${pause||cache}`} className="pub-anim" style={{position:"absolute",left:0,right:0,bottom:0,height:3,background:"rgba(255,255,255,.55)",transformOrigin:"left",animation:pause||cache?"none":`pubBarre ${pas}ms linear both`,transform:pause||cache?"scaleX(0)":undefined}}/>}
  </div>;
}

// Réglage propre à l'appareil, dans Paramètres
export function ReglageMarketing({Interrupteur}){
  const[off,sOff]=useState(mktDesactive());
  useEffect(()=>{const f=()=>sOff(mktDesactive());window.addEventListener("ec-mkt",f);return()=>window.removeEventListener("ec-mkt",f);},[]);
  return <Interrupteur on={!off} set={v=>setMktDesactive(!v)} lib="Bannière d'annonces sur l'accueil" sous="Offres, astuces et nouveautés qui défilent en haut de l'accueil. Rien n'est envoyé dans la cloche ni sur le téléphone."/>;
}

// Panneau admin : activer, rythme, aperçu, retirer des messages, ajouter les vôtres
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
    await maj({perso:[...(cfg.perso||[]),{...n,id:`p${Date.now().toString(36)}`,titre:n.titre.trim().slice(0,90),texte:n.texte.trim().slice(0,240)}]});sN({...n,titre:"",texte:""});flash("o","Annonce ajoutée à la bannière.");};
  const retirer=id=>maj({perso:(cfg.perso||[]).filter(m=>m.id!==id)});
  const apercu=c=>rotation({uid:`apercu-${c}`,user:c==="abonnes"?{abonnement:"actif",dateExpiration:"2999-01-01"}:{},cfg}).slice(0,3);
  const nActifs=BANQUE.filter(m=>!off.has(m.id)).length+(cfg.perso||[]).length;
  const Ligne=({m,perso})=><div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderTop:`1px solid ${K.b0}`,opacity:!perso&&off.has(m.id)?.5:1}}>
    <i className={`ti ti-${(TYPES_MKT[m.type]||TYPES_MKT.astuce).ico}`} style={{fontSize:17,color:(TYPES_MKT[m.type]||TYPES_MKT.astuce).col,marginTop:2}}/>
    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5,color:K.t1}}>{m.titre}</div><div style={{fontSize:12.5,color:K.t3,lineHeight:1.45}}>{m.texte}</div><div style={{fontSize:11.5,color:K.t3,marginTop:2}}>{CIBLES[m.cible]}{perso?" · ajoutée par vous":""}</div></div>
    {perso?<button onClick={()=>retirer(m.id)} className="bt" title="Supprimer" style={{background:"none",border:"none",color:K.er,cursor:"pointer"}}><i className="ti ti-trash"/></button>
      :<button onClick={()=>basculer(m.id)} className="bt" style={{background:"none",border:`1px solid ${K.b1}`,borderRadius:8,color:K.t2,cursor:"pointer",fontSize:12,fontWeight:700,padding:"4px 8px",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>{off.has(m.id)?"Réactiver":"Retirer"}</button>}
  </div>;
  return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1}}><i className="ti ti-speakerphone" style={{fontSize:19,color:"#C98A1B"}}/>Bannière d'annonces de l'accueil</div>
    <div style={{fontSize:13,color:K.t3,margin:"3px 0 12px",lineHeight:1.5}}>De courts messages défilent en haut de l'accueil des apprenants : offres pour ceux qui n'ont pas d'accès, défis et nouveautés pour les abonnés, astuces pour tous. Rien dans la cloche ni sur le téléphone ; chaque apprenant peut masquer la bannière.</div>
    {msg&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,color:msg.t==="o"?K.em:K.er,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,borderRadius:10,padding:"8px 12px",fontSize:13.5,fontWeight:600,marginBottom:10}}>{msg.m}</div>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
      <button onClick={()=>maj({actif:!cfg.actif})} className="bt" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:11,cursor:"pointer",fontWeight:800,fontSize:13.5,fontFamily:"'Outfit',sans-serif",background:cfg.actif?K.emBg:K.c2,border:`1px solid ${cfg.actif?K.emBd:K.b1}`,color:cfg.actif?K.em:K.t2}}><i className={`ti ti-toggle-${cfg.actif?"right":"left"}`} style={{fontSize:18}}/>{cfg.actif?"Bannière activée":"Bannière désactivée"}</button>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13.5,color:K.t2,fontWeight:700}}>Changement toutes les
        <select value={Number(cfg.intervalleS)||30} onChange={e=>maj({intervalleS:Number(e.target.value)})} style={{...champ(K),width:"auto",padding:"7px 10px"}}>{INTERVALLES.map(x=><option key={x} value={x}>{x} s</option>)}</select></label>
      <span style={{fontSize:12.5,color:K.t3}}>{nActifs} annonces en rotation</span>
    </div>
    {cfg.actif&&<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>{["visiteurs","abonnes"].map(c=><div key={c} style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
      <div style={{fontSize:11.5,fontWeight:800,color:K.t3,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Aujourd'hui · {CIBLES[c]}</div>
      {apercu(c).map((m,j)=><div key={m.id} style={{fontSize:12.5,color:K.t2,lineHeight:1.45,padding:"2px 0"}}><b style={{color:K.t1}}>{j+1}. {m.titre}</b></div>)}
    </div>)}</div>}
    <div style={{fontWeight:800,fontSize:14,color:K.t1,margin:"4px 0 8px"}}>Ajouter votre annonce</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
      <select value={n.cible} onChange={e=>sN({...n,cible:e.target.value})} style={champ(K)}>{Object.entries(CIBLES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
      <select value={n.type} onChange={e=>sN({...n,type:e.target.value})} style={champ(K)}>{Object.entries(TYPES_MKT).map(([k,t])=><option key={k} value={k}>{t.l}</option>)}</select>
      <select value={n.vue} onChange={e=>sN({...n,vue:e.target.value})} style={{...champ(K),...(mob?{gridColumn:"1 / -1"}:{})}}>{[...VUES,["acces","Obtenir l'accès (offres)"]].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    </div>
    <input value={n.titre} onChange={e=>sN({...n,titre:e.target.value})} maxLength={90} placeholder="Titre court (ex. : Promo de rentrée : 3 mois pour {t} $)" style={{...champ(K),marginBottom:8}}/>
    <textarea value={n.texte} onChange={e=>sN({...n,texte:e.target.value})} maxLength={240} rows={2} placeholder="Texte (240 caractères au plus). {m}, {t} et {a} sont remplacés par vos prix." style={{...champ(K),resize:"vertical",marginBottom:8}}/>
    <button onClick={ajouter} className="bt" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:11,cursor:"pointer",fontWeight:800,fontSize:13.5,fontFamily:"'Outfit',sans-serif",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",color:"#fff"}}><i className="ti ti-plus"/>Ajouter à la bannière</button>
    {(cfg.perso||[]).length>0&&<div style={{marginTop:12}}>{cfg.perso.map(m=><Ligne key={m.id} m={m} perso/>)}</div>}
    <button onClick={()=>sVoir(v=>!v)} className="bt" style={{marginTop:12,background:"none",border:"none",color:K.in_,fontWeight:700,fontSize:13.5,cursor:"pointer",padding:0,fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-chevron-${voir?"up":"down"}`}/> {voir?"Masquer":"Voir"} les {BANQUE.length} annonces fournies</button>
    {voir&&<div style={{marginTop:6}}>{BANQUE.map(m=><Ligne key={m.id} m={m}/>)}</div>}
  </div>;
}
