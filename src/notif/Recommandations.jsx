import React from"react";
import{MODULES_FISC}from"../fiscal/modules";

// « Pour vous » : jusqu'à 3 actions recommandées à l'apprenant, calculées à partir de sa progression
export function recommandations({u,mods=[],pr={},sc={},ok}){
  const R=[];
  if(!ok)R.push({k:"acces",ico:"lock-open",col:"#C98A1B",titre:"Débloquez toute la plateforme",texte:"Modules, QCM, Code des impôts et atelier États financiers : demandez votre accès.",act:"sub"});
  const actifs=mods.filter(m=>m.on!==false).sort((a,b)=>(a.ordre||99)-(b.ordre||99));
  const faible=actifs.filter(m=>sc[m.id]?.pct!=null&&sc[m.id].pct<60).sort((a,b)=>sc[a.id].pct-sc[b.id].pct)[0];
  if(faible)R.push({k:"refaire",ico:"refresh",col:"#A3122A",titre:`Refaire le QCM : ${faible.titre}`,texte:`Votre score est de ${sc[faible.id].pct} % : 60 % sont nécessaires pour valider le module.`,act:"mod",mod:faible});
  const suivant=actifs.find(m=>pr[m.id]!=="done"&&!sc[m.id]);
  if(suivant)R.push({k:"suivant",ico:"player-play",col:"#1E4FA3",titre:`Continuer : ${suivant.titre}`,texte:suivant.desc||"Le prochain module de votre parcours.",act:"mod",mod:suivant});
  const fisc=MODULES_FISC.find(m=>(ok||m.libre)&&!((sc[`FISC-${m.id}`]?.pct||0)>=60));
  if(fisc)R.push({k:"fisc",ico:"receipt-tax",col:"#A3122A",titre:`Code des impôts : ${fisc.id} · ${fisc.court}`,texte:fisc.resume,act:"fisc"});
  if(ok)R.push({k:"ef",ico:"report-money",col:"#1D4ED8",titre:"Atelier États financiers",texte:"Entraînez-vous sur un cas pratique : Bilan, Compte de résultat, TFT et IBP.",act:"ef"});
  if(!R.length)R.push({k:"bravo",ico:"trophy",col:"#0D7A6B",titre:"Bravo, parcours à jour !",texte:"Tous vos modules sont validés. Revenez bientôt pour les nouveautés.",act:""});
  return R.slice(0,3);
}

export default function PourVous({K,mob,u,mods,pr,sc,ok,onOpen,onSub,onEf,onFisc}){
  const R=recommandations({u,mods,pr,sc,ok});
  const go=r=>r.act==="sub"?onSub&&onSub():r.act==="mod"?onOpen&&onOpen(r.mod):r.act==="fisc"?onFisc&&onFisc():r.act==="ef"?onEf&&onEf():null;
  return <div style={{marginBottom:16}}>
    <div className="h-sec" style={{color:K.t1,marginBottom:10,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-sparkles" style={{color:"#C98A1B"}}/>Pour vous</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":`repeat(${R.length},minmax(0,1fr))`,gap:10}}>
      {R.map(r=><button key={r.k} onClick={()=>go(r)} className="bt hv tile" style={{textAlign:"left",background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 15px",cursor:r.act?"pointer":"default",display:"flex",gap:11,alignItems:"flex-start",fontFamily:"'Outfit',sans-serif"}}>
        <div style={{width:38,height:38,borderRadius:11,background:`${r.col}16`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${r.ico}`} style={{fontSize:19,color:r.col}}/></div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontWeight:800,fontSize:14.5,color:K.t1,lineHeight:1.3}}>{r.titre}</div>
          <div style={{fontSize:12.5,color:K.t3,lineHeight:1.45,marginTop:3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{r.texte}</div>
        </div>
        {r.act&&<i className="ti ti-arrow-right" style={{fontSize:16,color:r.col,marginTop:2}}/>}
      </button>)}
    </div>
  </div>;
}
