import React,{useState}from"react";
import{budget,credit,epargne,tauxEndettement}from"./calculs";

// ══════════════════ ÉDUCATION FINANCIÈRE : SIMULATEURS INTERACTIFS ══════════════════
// Schémas « budget », « credit » et « epargne » des modules (rendus par Bloc, src/fiscal/CodeImpots.jsx).
// L'apprenant change les montants, le résultat se recalcule ; aucune donnée n'est enregistrée.

const fmt=n=>Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g," ");
const pc=x=>String(x).replace(".",",");
const num=s=>Number(String(s).replace(/[^\d,.]/g,"").replace(",","."))||0;

function Champs({K,v,sV,champs}){
  const style={width:"100%",boxSizing:"border-box",background:K.card,border:`1px solid ${K.b1}`,borderRadius:9,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"};
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
    {champs.map(([k,l,opts])=><label key={k} style={{display:"block"}}><div style={{fontSize:12,fontWeight:700,color:K.t2,marginBottom:4}}>{l}</div>
      {opts?<select value={v[k]} onChange={e=>sV({...v,[k]:e.target.value})} style={style}>{opts.map(([o,lo])=><option key={o} value={o}>{lo}</option>)}</select>
        :<input value={v[k]} onChange={e=>sV({...v,[k]:e.target.value})} onBlur={()=>sV(x=>({...x,[k]:num(x[k])?fmt(num(x[k])):""}))} inputMode="decimal" placeholder="0" style={style}/>}
    </label>)}
  </div>;
}
function Ligne({K,l,x,suffixe=" FC",fort,c}){
  return <div style={{display:"flex",justifyContent:"space-between",gap:10,padding:"6px 0",borderTop:`1px solid ${K.b0}`,fontSize:13.5,fontWeight:fort?900:500,color:c||(fort?K.t1:K.t2)}}>
    <span>{l}</span><span style={{whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>{typeof x==="number"?`${x<0?"− ":""}${fmt(Math.abs(x))}${suffixe}`:x}</span></div>;
}
const Resultat=({K,col,ico,titre,children})=><div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"10px 12px"}}>
  <div style={{fontSize:12.5,fontWeight:800,color:K.t1,marginBottom:4}}><i className={`ti ti-${ico}`} style={{marginRight:5,color:col}}/>{titre}</div>{children}</div>;
const Conseil=({K,ok,children})=><div style={{display:"flex",gap:8,fontSize:13,lineHeight:1.5,marginTop:8,color:ok?K.em:K.wa,fontWeight:700}}>
  <i className={`ti ti-${ok?"circle-check":"alert-triangle"}`} style={{fontSize:17,flexShrink:0,marginTop:1}}/><span>{children}</span></div>;

function SimBudget({K,col,defaut={}}){
  const[v,sV]=useState({revenu:fmt(defaut.revenu||800000),essentiel:fmt(defaut.essentiel||520000),autres:fmt(defaut.autres||180000)});
  const r=budget({revenu:num(v.revenu),essentiel:num(v.essentiel),autres:num(v.autres)});
  return <div>
    <Champs K={K} v={v} sV={sV} champs={[["revenu","Revenu du mois (FC)"],["essentiel","Dépenses indispensables (FC)"],["autres","Autres dépenses (FC)"]]}/>
    <Resultat K={K} col={col} ico="wallet" titre="Mon mois">
      <Ligne K={K} l="Revenu" x={num(v.revenu)}/>
      <Ligne K={K} l={`− Dépenses indispensables (${pc(r.partEssentiel)} %)`} x={-num(v.essentiel)}/>
      <Ligne K={K} l={`− Autres dépenses (${pc(r.partAutres)} %)`} x={-num(v.autres)}/>
      <Ligne K={K} l={r.deficit?"Il manque":"Reste pour épargner"} x={r.reste} fort c={r.deficit?K.er:col}/>
      {r.deficit?<Conseil K={K}>Vos dépenses dépassent votre revenu : commencez par réduire les « autres dépenses », puis revoyez les indispensables.</Conseil>
        :r.reste>=r.objectif10?<Conseil K={K} ok>Vous pouvez épargner {pc(r.tauxEpargne)} % de votre revenu : vous atteignez le repère de 10 % ({fmt(r.objectif10)} FC).</Conseil>
        :<Conseil K={K}>Vous épargnez {pc(r.tauxEpargne)} % : visez au moins 10 % ({fmt(r.objectif10)} FC) en réduisant une dépense.</Conseil>}
    </Resultat>
  </div>;
}

function SimCredit({K,col,defaut={}}){
  const[v,sV]=useState({capital:fmt(defaut.capital||1000000),taux:String(defaut.taux??24),mois:String(defaut.mois||12),frais:fmt(defaut.frais||20000),revenu:fmt(defaut.revenu||800000)});
  const r=credit({capital:num(v.capital),tauxAnnuel:num(v.taux),mois:num(v.mois),frais:num(v.frais)});
  const t=tauxEndettement(r.mensualite,num(v.revenu));
  return <div>
    <Champs K={K} v={v} sV={sV} champs={[["capital","Montant emprunté (FC)"],["taux","Taux d'intérêt annuel (%)"],["mois","Durée (mois)"],["frais","Frais de dossier (FC)"],["revenu","Mon revenu mensuel (FC)"]]}/>
    <Resultat K={K} col={col} ico="calculator" titre="Ce que coûte ce crédit">
      <Ligne K={K} l="Mensualité" x={r.mensualite} fort c={col}/>
      <Ligne K={K} l="Total remboursé (hors frais)" x={r.totalRembourse}/>
      <Ligne K={K} l="Intérêts payés" x={r.interets}/>
      <Ligne K={K} l="Coût total du crédit (intérêts + frais)" x={r.coutTotal} fort/>
      <Ligne K={K} l="Part de mon revenu" x={`${pc(t)} %`}/>
      {t>33?<Conseil K={K}>La mensualité dépasse le tiers de votre revenu : empruntez moins, ou plus longtemps, ou renoncez.</Conseil>
        :<Conseil K={K} ok>La mensualité reste sous le tiers de votre revenu : un repère de prudence.</Conseil>}
    </Resultat>
  </div>;
}

function SimEpargne({K,col,defaut={}}){
  const[v,sV]=useState({versement:fmt(defaut.versement||10000),frequence:defaut.frequence||"semaine",mois:String(defaut.mois||12),taux:String(defaut.taux??0)});
  const r=epargne({versement:num(v.versement),frequence:v.frequence,mois:num(v.mois),tauxAnnuel:num(v.taux)});
  return <div>
    <Champs K={K} v={v} sV={sV} champs={[["versement","Je mets de côté (FC)"],["frequence","Chaque",[["semaine","semaine"],["mois","mois"]]],["mois","Pendant (mois)"],["taux","Rémunération annuelle (%)"]]}/>
    <Resultat K={K} col={col} ico="pig-money" titre="Mon épargne au bout de la période">
      <Ligne K={K} l="Soit par mois" x={r.parMois}/>
      <Ligne K={K} l="Total versé" x={r.verse}/>
      <Ligne K={K} l="Intérêts gagnés" x={r.interets}/>
      <Ligne K={K} l="Épargne disponible" x={r.total} fort c={col}/>
      <Conseil K={K} ok>Le plus important n'est pas le montant mais la régularité : programmez votre épargne le jour où vous êtes payé.</Conseil>
    </Resultat>
  </div>;
}

export const SIMULATEURS_EDUF={budget:SimBudget,credit:SimCredit,epargne:SimEpargne};
