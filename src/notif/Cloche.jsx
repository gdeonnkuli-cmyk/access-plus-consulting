import React,{useState,useEffect,useRef}from"react";
import{TYPES,useNotifications,useNotifEtat,estLue,marquerLue,toutMarquerLu,rappelsLocaux,depuis}from"./notif";

// Cloche de notifications : badge des non-lues, panneau (liste, tout marquer lu), ouverture de la vue liée.
// Les réglages (push, copie e-mail) sont dans Paramètres ; l'effacement est réservé à l'administrateur.
export default function Cloche({K,db,uid,role,user,mob,onGo,taille=30}){
  const liste=useNotifications(db,uid,role),etat=useNotifEtat(db,uid);
  const[open,sOpen]=useState(false);const ref=useRef(null);
  const tout=[...rappelsLocaux(user),...liste];
  const nonLues=tout.filter(n=>!n.local&&!estLue(n,etat)).length+tout.filter(n=>n.local).length;
  useEffect(()=>{if(!open)return;const f=e=>{if(ref.current&&!ref.current.contains(e.target))sOpen(false);};document.addEventListener("mousedown",f);return()=>document.removeEventListener("mousedown",f);},[open]);
  const ouvrir=n=>{if(!n.local&&!estLue(n,etat))marquerLue(db,uid,etat,n.id);sOpen(false);if(n.vue&&onGo)onGo(n.vue);};
  const panneau={background:K.card,border:`1px solid ${K.b0}`,boxShadow:"0 18px 48px rgba(0,12,30,.22)",borderRadius:mob?"18px 18px 0 0":16,overflow:"hidden",display:"flex",flexDirection:"column",
    ...(mob?{position:"fixed",left:0,right:0,bottom:0,maxHeight:"78vh",zIndex:1001}:{position:"absolute",right:0,top:taille+10,width:380,maxHeight:520,zIndex:1001})};
  return <div ref={ref} style={{position:"relative"}}>
    <button onClick={()=>sOpen(o=>!o)} className="bt" title="Notifications" aria-label={`Notifications${nonLues?` (${nonLues} non lues)`:""}`}
      style={{position:"relative",width:taille,height:taille,borderRadius:"50%",background:open?K.emBg:K.c2,border:`1px solid ${open?K.emBd:K.b1}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
      <i className={`ti ti-bell${nonLues?"-ringing":""}`} style={{fontSize:taille>30?17:15,color:nonLues?K.em:K.t2}}/>
      {nonLues>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:17,height:17,borderRadius:99,background:K.rd||K.er,color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:`1.5px solid ${K.card}`}}>{nonLues>99?"99+":nonLues}</span>}
    </button>
    {open&&<>
      {mob&&<div onClick={()=>sOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,12,30,.45)",zIndex:1000}}/>}
      <div style={panneau} role="dialog" aria-label="Notifications">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderBottom:`1px solid ${K.b0}`}}>
          <div style={{fontWeight:800,fontSize:15.5,color:K.t1}}>Notifications{nonLues>0&&<span style={{marginLeft:6,fontSize:12,color:K.t3,fontWeight:700}}>{nonLues} non lue{nonLues>1?"s":""}</span>}</div>
          {liste.some(n=>!estLue(n,etat))&&<button onClick={()=>toutMarquerLu(db,uid)} className="bt" style={{background:"none",border:"none",color:K.in_,fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Tout marquer comme lu</button>}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {!tout.length&&<div style={{padding:"34px 18px",textAlign:"center",color:K.t3,fontSize:14}}><i className="ti ti-bell-off" style={{fontSize:30,display:"block",marginBottom:8}}/>Aucune notification pour l'instant.</div>}
          {tout.map(n=>{const ty=TYPES[n.type]||TYPES.info,lu=!n.local&&estLue(n,etat);
            return <button key={n.id} onClick={()=>ouvrir(n)} className="bt" style={{display:"flex",gap:11,width:"100%",textAlign:"left",padding:"12px 16px",background:lu?"transparent":`${ty.col}0D`,border:"none",borderBottom:`1px solid ${K.b0}`,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              <div style={{width:36,height:36,borderRadius:11,background:`${ty.col}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${ty.ico}`} style={{fontSize:18,color:ty.col}}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline"}}>
                  <span style={{fontWeight:lu?600:800,fontSize:14,color:K.t1,lineHeight:1.35}}>{n.titre}</span>
                  {!lu&&<span style={{width:8,height:8,borderRadius:"50%",background:ty.col,flexShrink:0,marginTop:5}}/>}
                </div>
                {n.texte&&<div style={{fontSize:13,color:K.t2,lineHeight:1.45,marginTop:2,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",whiteSpace:"pre-line"}}>{n.texte}</div>}
                <div style={{fontSize:11.5,color:K.t3,marginTop:4}}>{ty.l}{n.auteurNom?` · ${n.auteurNom}`:""} · {n.local?"rappel":depuis(n.t)}</div>
              </div>
            </button>;})}
        </div>
      </div>
    </>}
  </div>;
}
