import React from"react";

// Étape d'un parcours sur téléphone : rail vertical (pastille d'état + trait) à gauche de la carte du module,
// comme le chemin du SYCEBNL. Sur grand écran, la carte est rendue telle quelle (grille).
// etat : "ok" (réussi), "ko" (passé sous le seuil), "lock" (verrouillé), "todo" (ouvert, pas encore passé)
export default function Etape({K,mob,col,etat,children}){
  if(!mob)return children;
  const c=etat==="ok"?K.em:etat==="ko"?K.er:etat==="lock"?K.t3:col;
  const ico=etat==="ok"?"circle-check":etat==="ko"?"alert-circle":etat==="lock"?"lock":"player-play";
  return <div style={{display:"flex",gap:10,alignItems:"stretch"}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:32,flexShrink:0}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:etat==="ok"?K.emBg:etat==="lock"?K.c2:`${c}18`,border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${ico}`} style={{fontSize:16,color:c}}/></div>
      <div style={{flex:1,width:2,background:etat==="ok"?K.em:K.b1,minHeight:10}}/>
    </div>
    <div style={{flex:1,minWidth:0,paddingBottom:10,display:"flex",flexDirection:"column"}}>{children}</div>
  </div>;
}
