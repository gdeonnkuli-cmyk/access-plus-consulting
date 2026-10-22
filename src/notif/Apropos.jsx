import React from"react";
import LOGO from"../assets/logo.png";
import LOGO_CLAIR from"../assets/logo-clair.png";

// Page « À propos » : mission, contenus, sources, version, contact et liens utiles
export const VERSION_APP="1.1.0"; // à garder aligné sur package.json
// Thème sombre détecté d'après la couleur de fond (logo clair sur fond foncé)
const estSombre=K=>{const h=String(K.bg||"").replace("#","");if(!/^[0-9a-f]{6}/i.test(h))return false;const[r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return r*.299+g*.587+b*.114<128;};
export default function Apropos({K,mob,onGo}){
  const sombre=estSombre(K);
  const Bloc=({ico,col,titre,children})=><div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
    <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1,marginBottom:8}}><i className={`ti ti-${ico}`} style={{fontSize:19,color:col}}/>{titre}</div>{children}</div>;
  const P=({children})=><p style={{fontSize:14.5,color:K.t2,lineHeight:1.7,margin:"0 0 6px"}}>{children}</p>;
  const lien={color:K.in_,fontWeight:700,textDecoration:"none"};
  return <div style={{maxWidth:760,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:20,padding:mob?"20px 18px":"26px 28px",marginBottom:14,textAlign:"center"}}>
      <img src={sombre?LOGO_CLAIR:LOGO} alt="Éco-Campus" style={{height:mob?44:54,width:"auto",margin:"0 auto 12px",display:"block"}}/>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:mob?22:27,color:K.t1,lineHeight:1.2}}>Former les professionnels de la comptabilité et de la fiscalité en RDC</div>
      <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6,marginTop:8}}>Éco-Campus RDC est une plateforme de formation en ligne, pensée pour le téléphone, qui accompagne étudiants, comptables et entrepreneurs congolais de la théorie à la pratique.</div>
      <div style={{display:"inline-flex",gap:6,marginTop:12,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,padding:"5px 12px",fontSize:12.5,color:K.t2,fontWeight:700}}><i className="ti ti-info-circle"/>Version {VERSION_APP}</div>
    </div>
    <Bloc ico="target" col="#1E4FA3" titre="Notre mission">
      <P>Rendre accessibles à tous, partout en RDC, les savoirs comptables et fiscaux indispensables au monde professionnel : le droit comptable OHADA (SYSCOHADA révisé), la fiscalité congolaise et la pratique des états financiers.</P>
      <P>Nous privilégions les exemples chiffrés en francs congolais, les cas pratiques tirés de la vie des entreprises congolaises et l'évaluation par QCM corrigés.</P>
    </Bloc>
    <Bloc ico="apps" col="#0D7A6B" titre="Ce que vous trouverez">
      {[["book-2","Modules de cours SYSCOHADA avec QCM et exercices corrigés"],["receipt-tax","Le Code des impôts expliqué, la TVA en pratique, la paie et l'import-export : 12 modules, schémas, simulateurs et QCM renouvelés"],["report-money","L'atelier États financiers : Bilan, Compte de résultat, TFT, notes annexes et IBP, avec cas pratiques"],["video","Vidéos, cours en direct, présentations et supports PDF"],["briefcase","Stages virtuels, services aux entreprises et attestations de formation"]].map(([ic,t])=>
        <div key={t} style={{display:"flex",gap:9,fontSize:14.5,color:K.t2,lineHeight:1.55,marginBottom:6}}><i className={`ti ti-${ic}`} style={{color:"#0D7A6B",fontSize:17,marginTop:2,flexShrink:0}}/>{t}</div>)}
    </Bloc>
    <Bloc ico="books" col="#A3122A" titre="Sources de référence">
      <P><b>Comptabilité :</b> Acte uniforme OHADA relatif au droit comptable et à l'information financière (AUDCIF, 26 janvier 2017) et SYSCOHADA révisé.</P>
      <P><b>Fiscalité :</b> Code des impôts de la République démocratique du Congo publié par la Direction Générale des Impôts, mis à jour au 31 mars 2021. Les lois de finances postérieures peuvent modifier certains taux : vérifiez toujours les textes en vigueur avant une déclaration.</P>
      <P>Les contenus ont une vocation pédagogique et ne remplacent pas un conseil professionnel.</P>
    </Bloc>
    <Bloc ico="lifebuoy" col="#C98A1B" titre="Contact et aide">
      <P>Une question, un problème ou une idée ? Écrivez-nous depuis la boîte à suggestions ou par e-mail.</P>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
        {onGo&&<button onClick={()=>onGo("sugg")} className="bt" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:11,background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",color:"#fff",fontWeight:800,fontSize:13.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-bulb"/>Envoyer une suggestion</button>}
        <a href="mailto:contact@accessplusconsulting.com" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:11,background:K.c2,border:`1px solid ${K.b1}`,color:K.t1,fontWeight:700,fontSize:13.5,textDecoration:"none"}}><i className="ti ti-mail"/>contact@accessplusconsulting.com</a>
      </div>
    </Bloc>
    <Bloc ico="shield-lock" col="#4A5B78" titre="Vos données">
      <P>Vos données servent uniquement à votre formation (progression, scores, dossiers). Consultez la <a href="/confidentialite.html" target="_blank" rel="noreferrer" style={lien}>politique de confidentialité</a> ou la page de <a href="/suppression-compte.html" target="_blank" rel="noreferrer" style={lien}>suppression du compte</a>.</P>
    </Bloc>
    <div style={{textAlign:"center",fontSize:12.5,color:K.t3,margin:"6px 0 22px"}}>© {new Date().getFullYear()} Éco-Campus RDC · Kinshasa, République démocratique du Congo</div>
  </div>;
}
