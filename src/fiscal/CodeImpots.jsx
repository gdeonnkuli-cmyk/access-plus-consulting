import React,{useState,useEffect,useMemo}from"react";
import LecteurAudio from"../audio/LecteurAudio";
import{texteModuleFiscal}from"../audio/lecture";
import{doc,updateDoc}from"firebase/firestore";
import{MODULES_FISC}from"./modules";
import{tirerSerie,lireSerie,ecrireSerie}from"./tirage";
import{calculPaie,INPP}from"./paie";
import{liquidationTVA}from"./tva";
import{LIB_ACCES}from"../acces/plateforme";

// ══════════════════ CODE DES IMPÔTS RDC EXPLIQUÉ ══════════════════
// 12 modules (src/fiscal/modules : Code des impôts mis à jour au 31 mars 2021, TVA pratique, import-export et paie) : leçon structurée en blocs,
// schémas dessinés et QCM (banque de 15 questions, séries de 10).
// Score enregistré dans users/{uid}.scores["FISC-F2"] = { s, t, pct, date } (meilleur score conservé).
// QCM : chaque tentative tire 10 questions dans la banque du module (15), dont au moins 30 % de nouvelles
// par rapport à l'essai précédent, avec les propositions mélangées (voir tirage.js).
const NB_Q=10;
export const cleScore=id=>`FISC-${id}`;
const fmt=v=>Math.round(v).toLocaleString("fr-FR").replace(/ | /g," ");
const fmtFC=v=>`${v<0?"− ":""}${fmt(Math.abs(v))} FC`;

// Texte avec **gras**
export const T=({t})=>{const p=String(t||"").split("**");return <>{p.map((x,i)=>i%2?<b key={i}>{x}</b>:<React.Fragment key={i}>{x}</React.Fragment>)}</>;};

export function Carte({K,children,sx}){return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14,...sx}}>{children}</div>;}
export function Titre({K,ico,col,children}){return <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1,marginBottom:10,lineHeight:1.3}}>
  {ico&&<i className={`ti ti-${ico}`} style={{fontSize:18,color:col||K.in_,flexShrink:0}}/>}<span>{children}</span></div>;}
export function Bouton({K,ch,on,v="p",ico,dis,sx}){
  const st=v==="p"?{background:`linear-gradient(135deg,${K.emD},${K.em})`,color:"#fff",border:"none"}:{background:K.c2,color:K.t1,border:`1px solid ${K.b1}`};
  return <button onClick={on} disabled={dis} className="bt" style={{...st,borderRadius:11,padding:"11px 16px",fontWeight:800,fontSize:14,fontFamily:"'Outfit',sans-serif",cursor:dis?"not-allowed":"pointer",opacity:dis?.55:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:44,...sx}}>
    {ico&&<i className={`ti ti-${ico}`} style={{fontSize:16}}/>}{ch}</button>;
}

// ── Schémas ─────────────────────────────────────────────────────────────────────
function Flux({K,col,etapes}){
  return <div>{etapes.map((e,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"stretch"}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:30,flexShrink:0}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:e.fort?col:K.c2,border:`1.5px solid ${e.fort?col:K.b1}`,color:e.fort?"#fff":K.t1,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:e.op==="max"?9:15,flexShrink:0}}>{e.op||"•"}</div>
      {i<etapes.length-1&&<div style={{flex:1,width:2,background:K.b1,minHeight:10}}/>}
    </div>
    <div style={{flex:1,minWidth:0,padding:"4px 12px 12px",marginBottom:4,borderRadius:10,background:e.fort?`${col}14`:"transparent",border:e.fort?`1px solid ${col}40`:"1px solid transparent"}}>
      <div style={{fontWeight:e.fort?900:700,fontSize:14.5,color:e.fort?col:K.t1,lineHeight:1.35}}><T t={e.l}/></div>
      {e.d&&<div style={{fontSize:12.5,color:K.t3,marginTop:2,lineHeight:1.45}}><T t={e.d}/></div>}
    </div>
  </div>)}</div>;
}
function Chronologie({K,col,jalons}){
  return <div style={{position:"relative",paddingLeft:22}}>
    <div style={{position:"absolute",left:7,top:6,bottom:6,width:2,background:`linear-gradient(${col},${K.b1})`}}/>
    {jalons.map((j,i)=><div key={i} style={{position:"relative",marginBottom:i<jalons.length-1?14:0}}>
      <div style={{position:"absolute",left:-21,top:3,width:14,height:14,borderRadius:"50%",background:K.card,border:`3px solid ${col}`}}/>
      <div style={{display:"inline-block",background:`${col}16`,color:col,fontWeight:800,fontSize:12,borderRadius:99,padding:"2px 10px",marginBottom:4}}>{j.date}</div>
      <div style={{fontWeight:800,fontSize:14.5,color:K.t1}}><T t={j.l}/></div>
      {j.d&&<div style={{fontSize:13,color:K.t2,lineHeight:1.5,marginTop:1}}><T t={j.d}/></div>}
    </div>)}
  </div>;
}
function Arbre({K,col,question,branches}){
  return <div>
    <div style={{textAlign:"center",margin:"0 auto 10px",maxWidth:420,background:col,color:"#fff",fontWeight:800,borderRadius:12,padding:"10px 14px",fontSize:14.5}}><i className="ti ti-help-hexagon" style={{marginRight:6}}/>{question}</div>
    <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fit,minmax(${branches.length>3?150:180}px,1fr))`,gap:10}}>
      {branches.map((b,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:2,height:12,background:K.b1}}/>
        <div style={{fontSize:12,fontWeight:800,color:col,background:`${col}14`,border:`1px solid ${col}35`,borderRadius:99,padding:"3px 10px",textAlign:"center"}}>{b.si}</div>
        <i className="ti ti-arrow-down" style={{color:K.t3,fontSize:16,margin:"4px 0"}}/>
        <div style={{width:"100%",flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontWeight:800,fontSize:14,color:K.t1}}><T t={b.alors}/></div>
          {b.d&&<div style={{fontSize:12.5,color:K.t2,marginTop:3,lineHeight:1.45}}><T t={b.d}/></div>}
        </div>
      </div>)}
    </div>
  </div>;
}
function Tableau({K,col,entetes,lignes}){
  return <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",borderRadius:10,border:`1px solid ${K.b0}`}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5,minWidth:entetes.length>3?460:0}}>
      <thead><tr>{entetes.map((h,i)=><th key={i} style={{background:col,color:"#fff",textAlign:"left",padding:"8px 10px",fontWeight:800,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{lignes.map((l,i)=><tr key={i} style={{background:i%2?K.c2:K.card}}>{l.map((c,j)=><td key={j} style={{padding:"8px 10px",color:j?K.t2:K.t1,fontWeight:j?500:700,borderTop:`1px solid ${K.b0}`,lineHeight:1.4,verticalAlign:"top"}}><T t={c}/></td>)}</tr>)}</tbody>
    </table>
  </div>;
}
// Chaque tranche commence là où finit la précédente (les bornes du texte sont des francs entiers)
const impotBareme=(tranches,r)=>tranches.reduce((s,t,i)=>{const bas=i?tranches[i-1].a:t.de,haut=t.a==null?Infinity:t.a;return s+Math.max(0,Math.min(r,haut)-bas)*t.taux/100;},0);
function Bareme({K,col,tranches}){
  const max=Math.max(...tranches.map(t=>t.taux),1);
  const[rev,sRev]=useState("");
  const r=Number(String(rev).replace(/[^\d]/g,""))||0;
  const imp=impotBareme(tranches,r);
  return <div>
    {tranches.map((t,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(0,1fr) 52px",alignItems:"center",gap:8,marginBottom:5}}>
      <div style={{fontSize:12,color:K.t2,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.3}}>{t.a==null?`> ${fmt(t.de-1)}`:`${fmt(t.de)} – ${fmt(t.a)}`}</div>
      <div style={{height:14,background:K.c2,borderRadius:99,overflow:"hidden"}}><div style={{width:`${t.taux/max*100}%`,height:"100%",background:`linear-gradient(90deg,${col}99,${col})`,borderRadius:99}}/></div>
      <div style={{fontWeight:900,fontSize:13.5,color:col,textAlign:"right"}}>{String(t.taux).replace(".",",")} %</div>
    </div>)}
    <div style={{fontSize:11.5,color:K.t3,margin:"6px 0 10px"}}>Tranches en francs congolais : chaque taux ne s'applique qu'à la part du revenu comprise dans sa tranche.</div>
    <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
      <div style={{fontSize:12.5,fontWeight:800,color:K.t1,marginBottom:6}}><i className="ti ti-calculator" style={{marginRight:5,color:col}}/>Simulateur du barème</div>
      <input value={rev} onChange={e=>sRev(e.target.value)} inputMode="numeric" placeholder="Revenu imposable en FC" style={{width:"100%",boxSizing:"border-box",background:K.card,border:`1px solid ${K.b1}`,borderRadius:9,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"}}/>
      {r>0&&<div style={{marginTop:8,fontSize:13.5,color:K.t2,lineHeight:1.6}}>Impôt selon le barème : <b style={{color:col}}>{fmtFC(imp)}</b> · taux moyen <b>{(imp/r*100).toFixed(2).replace(".",",")} %</b>
        <div style={{fontSize:11.5,color:K.t3}}>Avant plafonnement et réductions éventuelles prévus par le texte (voir la leçon).</div></div>}
    </div>
  </div>;
}
function Chaine({K,col,maillons,taux=16}){
  const L=maillons.map(m=>{const c=m.vente*taux/100,d=(m.achat||0)*taux/100;return{...m,c,d,v:c-d};});
  const total=L.reduce((s,x)=>s+x.v,0);
  return <div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {L.map((m,i)=><React.Fragment key={i}>
        <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,flexWrap:"wrap",marginBottom:6}}>
            <div style={{fontWeight:900,fontSize:14.5,color:K.t1}}>{i+1}. {m.acteur}</div>
            <div style={{fontSize:12.5,color:K.t3}}>vend {fmtFC(m.vente)} HT{m.achat?` · achète ${fmtFC(m.achat)} HT`:""}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,fontSize:12}}>
            {[["TVA collectée",m.c,K.t1],["TVA déductible",-m.d,K.t2],["À reverser",m.v,col]].map(([l,v,c])=><div key={l} style={{background:K.card,borderRadius:9,padding:"6px 8px",border:`1px solid ${K.b0}`}}>
              <div style={{color:K.t3,fontWeight:700,fontSize:11}}>{l}</div><div style={{fontWeight:900,color:c,fontSize:13}}>{fmtFC(v)}</div></div>)}
          </div>
        </div>
        {i<L.length-1&&<div style={{textAlign:"center",color:K.t3,lineHeight:1}}><i className="ti ti-arrow-down" style={{fontSize:16}}/></div>}
      </React.Fragment>)}
    </div>
    <div style={{marginTop:10,background:`${col}12`,border:`1px solid ${col}40`,borderRadius:12,padding:"10px 12px",fontSize:13.5,color:K.t1,lineHeight:1.55}}>
      Total reversé à l'État : <b style={{color:col}}>{fmtFC(total)}</b>, soit {taux} % du prix final hors taxe ({fmtFC(L[L.length-1]?.vente||0)}). Chaque entreprise ne reverse que la TVA sur <b>sa</b> valeur ajoutée : c'est le consommateur final qui supporte la taxe.
    </div>
  </div>;
}
function Cartes({K,col,cartes}){
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
    {cartes.map((c,i)=><div key={i} style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"11px 12px"}}>
      <div style={{width:32,height:32,borderRadius:9,background:`${col}16`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:7}}><i className={`ti ti-${c.ico||"point"}`} style={{fontSize:17,color:col}}/></div>
      <div style={{fontWeight:900,fontSize:14,color:K.t1,marginBottom:2}}><T t={c.t}/></div>
      <div style={{fontSize:12.5,color:K.t2,lineHeight:1.45}}><T t={c.d}/></div>
    </div>)}
  </div>;
}
// Simulateur de bulletin de paie (module F11) : calcul dans paie.js
function Paie({K,col,defaut={}}){
  const[v,sV]=useState({base:"",primes:"",logement:"",transport:"",allocations:"",charges:0,taille:"1-50",...Object.fromEntries(Object.entries(defaut).map(([k,x])=>[k,typeof x==="number"&&k!=="charges"?fmt(x):x]))});
  const n=k=>Number(String(v[k]).replace(/[^\d]/g,""))||0;
  const r=calculPaie({base:n("base"),primes:n("primes"),logement:n("logement"),transport:n("transport"),allocations:n("allocations"),charges:Number(v.charges)||0,taille:v.taille});
  const champ={width:"100%",boxSizing:"border-box",background:K.card,border:`1px solid ${K.b1}`,borderRadius:9,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"};
  const ch=(k,l)=><label key={k} style={{display:"block"}}><div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:4}}>{l}</div>
    <input value={v[k]} onChange={e=>sV({...v,[k]:e.target.value})} onBlur={()=>sV(x=>({...x,[k]:n(k)?fmt(n(k)):""}))} inputMode="numeric" placeholder="0" style={champ}/></label>;
  const L=({l,x,fort,c})=><div style={{display:"flex",justifyContent:"space-between",gap:10,padding:"5px 0",borderTop:`1px solid ${K.b0}`,fontSize:13.5,fontWeight:fort?900:500,color:c||(fort?K.t1:K.t2)}}><span>{l}</span><span style={{whiteSpace:"nowrap"}}>{fmtFC(x)}</span></div>;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
      {ch("base","Salaire de base (FC)")}{ch("primes","Primes (FC)")}{ch("logement","Indemnité de logement (FC)")}
      {ch("transport","Indemnité de transport (FC)")}{ch("allocations","Allocations familiales (FC)")}
      <label style={{display:"block"}}><div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:4}}>Personnes à charge</div>
        <select value={v.charges} onChange={e=>sV({...v,charges:Number(e.target.value)})} style={champ}>{Array.from({length:10},(_,i)=><option key={i} value={i}>{i}{i===9?" (maximum)":""}</option>)}</select></label>
      <label style={{display:"block",gridColumn:"1 / -1"}}><div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:4}}>Employeur (taux INPP)</div>
        <select value={v.taille} onChange={e=>sV({...v,taille:e.target.value})} style={champ}>{INPP.map(x=><option key={x.k} value={x.k}>{x.l} : {String(x.taux).replace(".",",")} %</option>)}</select></label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
      <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
        <div style={{fontSize:12.5,fontWeight:800,color:K.t1,marginBottom:4}}><i className="ti ti-receipt" style={{marginRight:5,color:col}}/>Bulletin du salarié</div>
        <L l="Brut total" x={r.brut} fort/>
        {r.logementImposable>0&&<L l={`Logement imposable (au-delà de ${fmtFC(r.logementImmunise)})`} x={r.logementImposable}/>}
        <L l="Assiette CNSS et IPR" x={r.assiette}/>
        <L l="− CNSS salarié (5 %)" x={-r.cnssSalarie}/>
        <L l="Revenu imposable" x={r.imposable}/>
        <L l="− IPR du mois" x={-r.ipr}/>
        <L l="Net à payer" x={r.net} fort c={col}/>
      </div>
      <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
        <div style={{fontSize:12.5,fontWeight:800,color:K.t1,marginBottom:4}}><i className="ti ti-building" style={{marginRight:5,color:col}}/>Coût pour l'employeur</div>
        <L l="Brut total" x={r.brut}/>
        <L l="+ CNSS employeur (13 %)" x={r.cnssEmployeur}/>
        <L l={`+ INPP (${String(r.tauxInpp).replace(".",",")} %)`} x={r.inpp}/>
        <L l="+ ONEM (0,5 %)" x={r.onem}/>
        <L l="Coût total" x={r.coutEmployeur} fort c={col}/>
        <div style={{fontSize:11.5,color:K.t3,marginTop:6,lineHeight:1.45}}>À reverser le 15 du mois suivant : CNSS {fmtFC(r.cnssSalarie+r.cnssEmployeur)}, IPR {fmtFC(r.ipr)}, INPP et ONEM {fmtFC(r.inpp+r.onem)}.</div>
      </div>
    </div>
  </div>;
}
// Simulateur de déclaration mensuelle de TVA (module F12) : calcul dans tva.js
const CHAMPS_TVA=[["ventes","Ventes de biens livrées (HT)"],["services","Services encaissés (HT)"],["exportations","Exportations (FOB, 0 %)"],["exonerees","Recettes exonérées"],
  ["achats","Achats et services déductibles (HT)"],["immobilisations","Immobilisations (HT)"],["carburant","Carburant (HT, 50 %)"],["exclus","Dépenses exclues ou payées en espèces (HT)"],
  ["douane","TVA payée en douane"],["credit","Crédit du mois précédent"]];
function Tva({K,col,defaut={}}){
  const[v,sV]=useState(Object.fromEntries(CHAMPS_TVA.map(([k])=>[k,defaut[k]?fmt(defaut[k]):""])));
  const n=k=>Number(String(v[k]).replace(/[^\d]/g,""))||0;
  const r=liquidationTVA(Object.fromEntries(CHAMPS_TVA.map(([k])=>[k,n(k)])));
  const champ={width:"100%",boxSizing:"border-box",background:K.card,border:`1px solid ${K.b1}`,borderRadius:9,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"};
  const ch=(k,l)=><label key={k} style={{display:"block"}}><div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:4}}>{l}</div>
    <input value={v[k]} onChange={e=>sV({...v,[k]:e.target.value})} onBlur={()=>sV(x=>({...x,[k]:n(k)?fmt(n(k)):""}))} inputMode="numeric" placeholder="0" style={champ}/></label>;
  const L=({l,x,fort,c})=><div style={{display:"flex",justifyContent:"space-between",gap:10,padding:"5px 0",borderTop:`1px solid ${K.b0}`,fontSize:13.5,fontWeight:fort?900:500,color:c||(fort?K.t1:K.t2)}}><span>{l}</span><span style={{whiteSpace:"nowrap"}}>{fmtFC(x)}</span></div>;
  return <div>
    <div style={{fontSize:12.5,fontWeight:800,color:K.t1,margin:"0 0 6px"}}>Opérations du mois</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>{CHAMPS_TVA.map(([k,l])=>ch(k,l))}</div>
    <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
      <div style={{fontSize:12.5,fontWeight:800,color:K.t1,marginBottom:4}}><i className="ti ti-file-text" style={{marginRight:5,color:col}}/>Déclaration du mois</div>
      <L l="TVA collectée (16 %)" x={r.collectee}/>
      <L l="TVA déductible avant prorata" x={r.brute}/>
      {r.prorata<100&&<div style={{fontSize:12.5,color:K.t3,padding:"3px 0"}}>Prorata de déduction : <b style={{color:K.t1}}>{r.prorata} %</b> (arrondi à l'unité supérieure)</div>}
      <L l="− TVA déductible retenue" x={-r.deductible}/>
      {n("credit")>0&&<L l="− Crédit du mois précédent" x={-n("credit")}/>}
      {r.aPayer>0?<L l="TVA à payer (arrondie à la centaine)" x={r.aPayer} fort c={col}/>:<L l="Crédit de TVA à reporter" x={r.creditReporte} fort c={K.em}/>}
      {r.remboursable>0&&<div style={{fontSize:12.5,color:K.t2,marginTop:4,lineHeight:1.5}}>Exportateur : remboursement demandable jusqu'à <b>{fmtFC(r.remboursable)}</b> (16 % des exportations du mois), le reste est reporté.</div>}
      {r.perdue>0&&<div style={{fontSize:11.5,color:K.t3,marginTop:6,lineHeight:1.45}}>TVA non récupérable ce mois-ci : {fmtFC(r.perdue)}, à laisser dans le coût des charges.</div>}
    </div>
  </div>;
}
const SCHEMAS={flux:Flux,chronologie:Chronologie,arbre:Arbre,tableau:Tableau,bareme:Bareme,chaine:Chaine,cartes:Cartes,paie:Paie,tva:Tva};

// ── Blocs de leçon ──────────────────────────────────────────────────────────────
export function Bloc({K,b,col}){
  if(b.type==="essentiel")return <div style={{background:`linear-gradient(135deg,${col}18,${col}06)`,border:`1px solid ${col}40`,borderRadius:16,padding:"16px 18px",marginBottom:14}}>
    <Titre K={K} ico="bolt" col={col}>L'essentiel en 30 secondes</Titre>
    <div style={{fontSize:15,color:K.t1,lineHeight:1.7}}><T t={b.texte}/></div></div>;
  if(b.type==="texte")return <Carte K={K}>
    {b.titre&&<Titre K={K} ico="circle-dot" col={col}>{b.titre}</Titre>}
    {(b.p||[]).map((p,i)=><p key={i} style={{fontSize:14.5,color:K.t2,lineHeight:1.7,marginBottom:8}}><T t={p}/></p>)}
    {b.puces?.length>0&&<ul style={{margin:0,paddingLeft:0,listStyle:"none"}}>{b.puces.map((x,i)=><li key={i} style={{display:"flex",gap:8,fontSize:14.5,color:K.t2,lineHeight:1.6,marginBottom:6}}>
      <i className="ti ti-check" style={{color:col,fontSize:15,marginTop:3,flexShrink:0}}/><span><T t={x}/></span></li>)}</ul>}
  </Carte>;
  if(b.type==="schema"){const S=SCHEMAS[b.kind];return S?<Carte K={K}>
    <Titre K={K} ico="schema" col={col}>{b.titre||"Schéma"}</Titre>
    <S K={K} col={col} {...b}/>
    {b.note&&<div style={{fontSize:12.5,color:K.t3,marginTop:10,lineHeight:1.5}}><T t={b.note}/></div>}
  </Carte>:null;}
  if(b.type==="exemple")return <Carte K={K} sx={{borderLeft:`4px solid ${col}`}}>
    <Titre K={K} ico="calculator" col={col}>{b.titre||"Exemple chiffré"}</Titre>
    {b.enonce&&<p style={{fontSize:14,color:K.t2,lineHeight:1.65,marginBottom:10}}><T t={b.enonce}/></p>}
    <div style={{borderRadius:10,overflow:"hidden",border:`1px solid ${K.b0}`}}>
      {(b.lignes||[]).map(([l,v,st],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"8px 11px",fontSize:13.5,
        background:st==="resultat"?col:st==="total"?K.c2:K.card,color:st==="resultat"?"#fff":K.t1,fontWeight:st?800:500,borderTop:i?`1px solid ${K.b0}`:"none"}}>
        <span style={{minWidth:0}}><T t={l}/></span><span style={{whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:st==="resultat"?"#fff":v<0?K.er:K.t1}}>{fmtFC(v)}</span></div>)}
    </div>
    {b.conclusion&&<div style={{fontSize:14,color:K.t1,lineHeight:1.6,marginTop:10}}><i className="ti ti-arrow-right" style={{color:col,marginRight:5}}/><T t={b.conclusion}/></div>}
  </Carte>;
  if(b.type==="pieges")return <Carte K={K} sx={{background:K.erBg,border:`1px solid ${K.erBd}`,boxShadow:"none"}}>
    <Titre K={K} ico="alert-triangle" col={K.er}>Les pièges à éviter</Titre>
    {(b.puces||[]).map((x,i)=><div key={i} style={{display:"flex",gap:8,fontSize:14,color:K.t1,lineHeight:1.6,marginBottom:6}}><span style={{color:K.er,fontWeight:900}}>!</span><span><T t={x}/></span></div>)}
  </Carte>;
  if(b.type==="maj")return <div style={{display:"flex",gap:10,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:14,padding:"12px 14px",marginBottom:14}}>
    <i className="ti ti-refresh-alert" style={{fontSize:20,color:K.wa,flexShrink:0,marginTop:1}}/>
    <div><div style={{fontWeight:900,fontSize:13.5,color:K.wa,marginBottom:2}}>Mise à jour</div><div style={{fontSize:13.5,color:K.t1,lineHeight:1.6}}><T t={b.texte}/></div></div></div>;
  if(b.type==="articles")return <Carte K={K} sx={{background:K.c2,boxShadow:"none"}}>
    <Titre K={K} ico="book" col={col}>Articles de référence</Titre>
    {(b.refs||[]).map((r,i)=><div key={i} style={{fontSize:13,color:K.t2,lineHeight:1.55,padding:"4px 0",borderTop:i?`1px dashed ${K.b1}`:"none"}}><T t={r}/></div>)}
  </Carte>;
  return null;
}

// ── QCM ─────────────────────────────────────────────────────────────────────────
// cle : clé du score dans users/{uid}.scores (FISC-… par défaut) ; nbQ : taille d'une série
export function Qcm({K,mod,db,uid,ancien,onFin,cle=cleScore(mod.id),nbQ=NB_Q}){
  const nouvelle=prec=>{const s=tirerSerie(mod.qcm,prec,{n:nbQ});ecrireSerie(cle,s);return s;};
  const[serie,sSerie]=useState(()=>nouvelle(lireSerie(cle)));
  const[i,sI]=useState(0),[choix,sChoix]=useState(null),[bonnes,sBonnes]=useState(0),[fini,sFini]=useState(false),[saveErr,sSaveErr]=useState("");
  const q=serie[i],n=serie.length,col=mod.col;
  const valider=c=>{if(choix!=null)return;sChoix(c);if(c===q.b)sBonnes(x=>x+1);};
  const suivant=async()=>{
    if(i<n-1){sI(i+1);sChoix(null);return;}
    sFini(true);
    const pct=Math.round(bonnes/n*100);
    if(uid&&db&&(!ancien||pct>=(ancien.pct||0))){
      try{await updateDoc(doc(db,"users",uid),{[`scores.${cle}`]:{s:bonnes,t:n,pct,date:new Date().toISOString()}});onFin&&onFin({s:bonnes,t:n,pct});}
      catch(e){sSaveErr("Score non enregistré (connexion ?). Réessayez plus tard.");}
    }
  };
  if(fini){const pct=Math.round(bonnes/n*100),ok=pct>=60;return <Carte K={K} sx={{textAlign:"center",padding:"26px 18px"}}>
    <div style={{fontSize:44,marginBottom:6}}>{pct>=80?"🏆":ok?"✅":"📚"}</div>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:26,color:ok?K.em:K.er}}>{bonnes} / {n} · {pct} %</div>
    <div style={{fontSize:14.5,color:K.t2,margin:"6px 0 16px",lineHeight:1.6}}>{pct>=80?"Excellent : vous maîtrisez ce module.":ok?"Module validé. Relisez les points manqués pour consolider.":"Pas encore validé (60 % requis). Relisez la leçon puis retentez."}</div>
    {ancien&&ancien.pct>pct&&<div style={{fontSize:12.5,color:K.t3,marginBottom:10}}>Votre meilleur score ({ancien.pct} %) reste enregistré.</div>}
    {mod.qcm.length>nbQ&&<div style={{fontSize:12.5,color:K.t3,marginBottom:12,lineHeight:1.5}}><i className="ti ti-arrows-shuffle" style={{marginRight:4}}/>Chaque nouvelle série renouvelle au moins 30 % des questions ({mod.qcm.length} dans la banque) et mélange l'ordre des réponses.</div>}
    {saveErr&&<div style={{fontSize:12.5,color:K.er,marginBottom:10}}>{saveErr}</div>}
    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
      <Bouton K={K} v="g" ico="refresh" ch="Nouvelle série" on={()=>{sSerie(nouvelle(serie.map(x=>x.idx)));sI(0);sChoix(null);sBonnes(0);sFini(false);sSaveErr("");}}/>
      <Bouton K={K} ico="book-2" ch="Retour à la leçon" on={()=>onFin&&onFin(null,true)}/>
    </div></Carte>;}
  return <Carte K={K}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{fontSize:12.5,fontWeight:800,color:col}}>Question {i+1} / {n}</div>
      <div style={{fontSize:12.5,color:K.t3}}>{bonnes} bonne{bonnes>1?"s":""} réponse{bonnes>1?"s":""}</div>
    </div>
    <div style={{height:6,background:K.c2,borderRadius:99,overflow:"hidden",marginBottom:14}}><div style={{width:`${(i+(choix!=null?1:0))/n*100}%`,height:"100%",background:col,transition:"width .3s"}}/></div>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,lineHeight:1.45,marginBottom:12}}><T t={q.q}/></div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {q.r.map((r,j)=>{const bon=choix!=null&&j===q.b,faux=choix===j&&j!==q.b;
        return <button key={j} onClick={()=>valider(j)} disabled={choix!=null} className="bt" style={{textAlign:"left",display:"flex",gap:10,alignItems:"flex-start",padding:"11px 12px",borderRadius:12,cursor:choix!=null?"default":"pointer",fontFamily:"'Outfit',sans-serif",fontSize:14.5,lineHeight:1.45,
          background:bon?K.emBg:faux?K.erBg:K.c2,border:`1.5px solid ${bon?K.em:faux?K.er:K.b0}`,color:K.t1}}>
          <span style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,background:bon?K.em:faux?K.er:K.card,color:bon||faux?"#fff":K.t2,border:`1px solid ${K.b1}`}}>{bon?"✓":faux?"✕":"ABCD"[j]}</span>
          <span><T t={r}/></span></button>;})}
    </div>
    {choix!=null&&<div style={{marginTop:12,background:choix===q.b?K.emBg:K.waBg,border:`1px solid ${choix===q.b?K.emBd:K.waBd}`,borderRadius:12,padding:"11px 13px"}}>
      <div style={{fontWeight:900,fontSize:14,color:choix===q.b?K.em:K.wa,marginBottom:3}}>{choix===q.b?"Bonne réponse":"Réponse attendue : "+"ABCD"[q.b]}</div>
      <div style={{fontSize:14,color:K.t1,lineHeight:1.6}}><T t={q.e}/></div>
      {q.art&&<div style={{fontSize:12.5,color:K.t3,marginTop:4}}><i className="ti ti-book" style={{marginRight:4}}/>{q.art}</div>}
    </div>}
    {choix!=null&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><Bouton K={K} ico={i<n-1?"arrow-right":"flag"} ch={i<n-1?"Question suivante":"Voir mon score"} on={suivant}/></div>}
  </Carte>;
}

// ── Écran principal ─────────────────────────────────────────────────────────────
export default function CodeImpots({K,mob,db,uid,scores={},ok,onSub}){
  const[open,sOpen]=useState(null),[mode,sMode]=useState("lecon"),[loc,sLoc]=useState({});
  const sc=id=>loc[id]||scores[cleScore(id)];
  const mod=MODULES_FISC.find(m=>m.id===open);
  const segsLecon=useMemo(()=>mod?texteModuleFiscal(mod):[],[mod]);
  const acces=m=>ok||m.libre;
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[open,mode]);
  const valides=MODULES_FISC.filter(m=>(sc(m.id)?.pct||0)>=60).length;
  const pcts=MODULES_FISC.map(m=>sc(m.id)?.pct).filter(x=>x!=null);
  const moy=pcts.length?Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length):null;

  if(mod){
    const idx=MODULES_FISC.indexOf(mod),prev=MODULES_FISC[idx-1],next=MODULES_FISC[idx+1],s=sc(mod.id);
    return <div style={{maxWidth:820,margin:"0 auto",animation:"fadeIn .3s ease"}}>
      <button onClick={()=>{sOpen(null);sMode("lecon");}} className="bt" style={{background:"none",border:"none",color:K.t2,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginBottom:10,fontFamily:"'Outfit',sans-serif",padding:0}}>
        <i className="ti ti-arrow-left" style={{fontSize:16}}/>Tous les modules</button>
      <div style={{background:`linear-gradient(135deg,${mod.col},${mod.col}CC)`,borderRadius:18,padding:mob?"18px 16px":"22px 24px",color:"#fff",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <i className={`ti ti-${mod.ico}`} style={{position:"absolute",right:-8,bottom:-16,fontSize:110,opacity:.12}}/>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:1,opacity:.85,textTransform:"uppercase"}}>Module {mod.id} · {mod.duree}</div>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:27,lineHeight:1.2,margin:"4px 0 6px"}}>{mod.titre}</div>
        <div style={{fontSize:14,opacity:.9,lineHeight:1.5}}>{mod.resume}</div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {[["lecon","book-2","Leçon"],["qcm","checklist",`QCM · ${Math.min(NB_Q,mod.qcm.length)} questions`]].map(([k,ic,l])=><button key={k} onClick={()=>sMode(k)} className="bt" style={{background:mode===k?"#fff":"rgba(255,255,255,.16)",color:mode===k?mod.col:"#fff",border:"1px solid rgba(255,255,255,.35)",borderRadius:99,padding:"7px 13px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <i className={`ti ti-${ic}`} style={{fontSize:14}}/>{l}</button>)}
          {s&&<span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"7px 12px",fontWeight:800,fontSize:13}}>Meilleur score : {s.pct} %</span>}
        </div>
      </div>
      {mode==="lecon"?<>
        <div style={{marginBottom:14}}><LecteurAudio K={K} segments={segsLecon} titre="Écouter la leçon"/></div>
        {mod.blocs.map((b,i)=><Bloc key={i} K={K} b={b} col={mod.col}/>)}
        <div style={{display:"flex",justifyContent:"center",margin:"6px 0 18px"}}><Bouton K={K} ico="checklist" ch="Passer le QCM du module" on={()=>sMode("qcm")} sx={{minWidth:240}}/></div>
      </>:<Qcm key={mod.id} K={K} mod={mod} db={db} uid={uid} ancien={s} onFin={(r,retour)=>{if(r)sLoc(l=>({...l,[mod.id]:r}));if(retour)sMode("lecon");}}/>}
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:20}}>
        {prev?<Bouton K={K} v="g" ico="arrow-left" ch={mob?prev.id:`${prev.id} · ${prev.court}`} on={()=>{if(acces(prev)){sOpen(prev.id);sMode("lecon");}else onSub&&onSub();}}/>:<span/>}
        {next&&<Bouton K={K} v="g" ch={<>{mob?next.id:`${next.id} · ${next.court}`}<i className="ti ti-arrow-right" style={{fontSize:16}}/></>} on={()=>{if(acces(next)){sOpen(next.id);sMode("lecon");}else onSub&&onSub();}}/>}
      </div>
    </div>;
  }

  return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{background:`linear-gradient(135deg,${K.emD},${K.em} 60%,#A3122A)`,borderRadius:20,padding:mob?"20px 18px":"26px 28px",color:"#fff",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <i className="ti ti-receipt-tax" style={{position:"absolute",right:-10,bottom:-22,fontSize:150,opacity:.1}}/>
      <div style={{fontSize:12,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",opacity:.85}}>Fiscalité · République démocratique du Congo</div>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?24:31,lineHeight:1.15,margin:"6px 0 8px"}}>Le Code des impôts expliqué</div>
      <div style={{fontSize:14.5,opacity:.92,lineHeight:1.55,maxWidth:560}}>12 modules clairs (fiscalité, TVA pratique, paie et import-export), avec schémas, exemples chiffrés en francs congolais et QCM corrigés, construits à partir du Code des impôts de la DGI mis à jour au 31 mars 2021 et, pour la paie, des textes sociaux en vigueur en 2026.</div>
      <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
        <span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>{valides} / {MODULES_FISC.length} modules validés</span>
        {moy!=null&&<span style={{background:"rgba(255,255,255,.16)",borderRadius:99,padding:"6px 12px",fontWeight:800,fontSize:13}}>Score moyen : {moy} %</span>}
      </div>
    </div>
    {!ok&&<div style={{display:"flex",alignItems:"center",gap:10,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:14,padding:"11px 14px",marginBottom:14,flexWrap:"wrap"}}>
      <i className="ti ti-lock-open" style={{fontSize:18,color:K.wa}}/>
      <div style={{flex:1,minWidth:200,fontSize:13.5,color:K.t1,lineHeight:1.5}}>Le module <b>F1</b> est en accès libre. Les modules F2 à F10 sont réservés aux abonnés.</div>
      {onSub&&<Bouton K={K} ch={LIB_ACCES} on={onSub} sx={{minHeight:38,padding:"8px 14px",fontSize:13}}/>}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
      {MODULES_FISC.map(m=>{const s=sc(m.id),lk=!acces(m);return <div key={m.id} onClick={()=>lk?onSub&&onSub():(sOpen(m.id),sMode("lecon"))} className="hv tile"
        style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 15px",cursor:"pointer",opacity:lk?.75:1,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${m.col}16`,border:`1px solid ${m.col}35`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ti-${lk?"lock":m.ico}`} style={{fontSize:20,color:m.col}}/></div>
          {s?<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:s.pct>=60?K.emBg:K.erBg,color:s.pct>=60?K.em:K.er,border:`1px solid ${s.pct>=60?K.emBd:K.erBd}`}}>{s.pct} %</span>
            :m.libre?<span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"3px 9px",background:K.inBg,color:K.in_,border:`1px solid ${K.inBd}`}}>Libre</span>:null}
        </div>
        <div style={{fontSize:11.5,fontWeight:800,color:m.col,letterSpacing:.6,textTransform:"uppercase"}}>{m.id} · {m.court}</div>
        <div style={{fontWeight:800,fontSize:15.5,color:K.t1,lineHeight:1.3}}>{m.titre}</div>
        <div style={{fontSize:13,color:K.t3,lineHeight:1.5,flex:1}}>{m.resume}</div>
        <div style={{display:"flex",gap:12,fontSize:12,color:K.t3,marginTop:2}}>
          <span><i className="ti ti-clock" style={{marginRight:3}}/>{m.duree}</span><span><i className="ti ti-checklist" style={{marginRight:3}}/>QCM {Math.min(NB_Q,m.qcm.length)} q.</span>
        </div>
      </div>;})}
    </div>
  </div>;
}
