import React,{useCallback,useEffect,useState}from"react";
import{getAuth}from"firebase/auth";

// ══════════════════ TABLEAU DE BORD EN LECTURE SEULE ══════════════════
// Affiché aux observateurs désignés par l'administrateur (et en aperçu à l'administrateur).
// Les chiffres viennent de /api/tableau (calculés côté serveur, agrégés, sans données personnelles).

const TONS=K=>({ok:K.em,info:K.in_,alerte:K.wa,danger:K.er});
const fmtNb=v=>v==null?"—":Number(v).toLocaleString("fr-FR").replace(/[  ]/g," ");

export default function TableauLecture({K,mob,apercu}){
  const[d,sD]=useState(null),[err,sErr]=useState(""),[enc,sEnc]=useState(false);
  const charger=useCallback(async()=>{
    sEnc(true);sErr("");
    try{
      const u=getAuth().currentUser;
      if(!u)throw new Error("Session expirée : reconnectez-vous.");
      const r=await fetch("/api/tableau",{headers:{Authorization:`Bearer ${await u.getIdToken()}`}});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||!j.ok)throw new Error(j.raison||"Tableau de bord indisponible pour le moment.");
      sD(j);
    }catch(e){sErr(e.message||String(e));}
    sEnc(false);
  },[]);
  useEffect(()=>{charger();},[charger]);
  const T=TONS(K);
  const carte={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16};
  return <div style={{maxWidth:980,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:"linear-gradient(135deg,#011B33,#0A2A5C 60%,#1E4FA3)",borderRadius:22,padding:mob?"20px 18px":"26px 28px",color:"#fff",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-chart-dots" style={{position:"absolute",right:-8,bottom:-24,fontSize:150,opacity:.1}}/>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:800,letterSpacing:.6,textTransform:"uppercase",background:"rgba(255,255,255,.14)",border:"1px solid rgba(255,255,255,.22)",borderRadius:99,padding:"5px 11px"}}><i className="ti ti-eye"/>Lecture seule{apercu?" · aperçu administrateur":""}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?26:31,lineHeight:1.15,margin:"10px 0 6px"}}>Tableau de bord Éco-Campus</div>
      <div style={{fontSize:14.5,opacity:.9,lineHeight:1.55,maxWidth:620}}>Les chiffres clés de la plateforme, mis à jour à chaque ouverture. Ils sont agrégés : aucune information personnelle sur les apprenants n'est affichée.</div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:14,flexWrap:"wrap"}}>
        <button onClick={charger} disabled={enc} className="bt" style={{background:"rgba(255,255,255,.16)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:11,padding:"8px 14px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
          <i className={`ti ti-refresh`}/>{enc?"Mise à jour…":"Actualiser"}</button>
        {d&&<span style={{fontSize:12.5,opacity:.8}}>Données du {new Date(d.genereLe).toLocaleString("fr-FR",{dateStyle:"long",timeStyle:"short"})}</span>}
      </div>
    </div>

    {err&&<div style={{...carte,padding:"14px 16px",marginBottom:14,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,fontWeight:700,fontSize:14}}><i className="ti ti-alert-triangle" style={{marginRight:6}}/>{err}</div>}
    {!d&&!err&&<div style={{...carte,padding:30,textAlign:"center",color:K.t3}}>Chargement des indicateurs…</div>}

    {d&&<>
      {d.groupes.map(g=><div key={g.titre} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:800,color:K.t2,letterSpacing:.6,textTransform:"uppercase",marginBottom:10}}><i className={`ti ti-${g.ico}`} style={{fontSize:16}}/>{g.titre}</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(auto-fill,minmax(170px,1fr))",gap:mob?8:10}}>
          {g.kpis.map(k=><div key={k.l} style={{...carte,padding:mob?"12px 12px":"14px 15px"}}>
            <div style={{width:26,height:4,borderRadius:4,background:T[k.ton]||K.t2,marginBottom:10,opacity:.85}}/>
            <div style={{fontSize:mob?22:26,fontWeight:900,color:T[k.ton]||K.t1,lineHeight:1,letterSpacing:"-.5px"}}>{fmtNb(k.v)}{k.v!=null&&k.suffixe?k.suffixe:""}</div>
            <div style={{fontSize:mob?12:12.5,color:K.t2,marginTop:7,fontWeight:600,lineHeight:1.3}}>{k.l}</div>
          </div>)}
        </div>
      </div>)}

      <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:800,color:K.t2,letterSpacing:.6,textTransform:"uppercase",marginBottom:10}}><i className="ti ti-route" style={{fontSize:16}}/>Parcours certifiants</div>
      <div style={{...carte,overflow:"hidden",marginBottom:22}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5,minWidth:0}}>
            <thead><tr>{["Parcours","Apprenants","Examen final réussi","Certificats"].map((h,i)=><th key={h} style={{textAlign:i?"right":"left",padding:mob?"9px 7px":"10px 12px",background:K.c2,color:K.t2,fontWeight:800,fontSize:mob?11.5:12.5,lineHeight:1.25,verticalAlign:"bottom"}}>{h}</th>)}</tr></thead>
            <tbody>{d.parcours.map(p=><tr key={p.id} style={{borderTop:`1px solid ${K.b0}`}}>
              <td style={{padding:mob?"9px 7px":"9px 12px",color:K.t1,fontWeight:700,fontSize:mob?13:13.5}}>{p.titre}</td>
              {[p.commence,p.finalReussi,p.certificats].map((v,i)=><td key={i} style={{padding:mob?"9px 7px":"9px 12px",textAlign:"right",color:K.t1,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNb(v)}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
        <div style={{fontSize:12,color:K.t3,padding:"8px 12px",borderTop:`1px solid ${K.b0}`}}>Apprenants : comptes ayant commencé au moins un élément du parcours.</div>
      </div>
    </>}
  </div>;
}
