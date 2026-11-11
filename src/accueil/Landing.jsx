import React,{useEffect,useState}from"react";
import{PARCOURS,EXAMENS,SEUIL_ELEMENT,SEUIL_MOYENNE,elementsParcours}from"../attest/regles";
import{FORMATIONS}from"../parcours/MesFormations";

// ══════════════════ PAGE D'ACCUEIL PUBLIQUE (visiteurs non connectés) ══════════════════
// Présente le catalogue réel : les parcours certifiants (mêmes données que « Mes formations » et les certificats),
// le chemin vers le certificat (seuils de regles.js) et les outils de l'application. Aucun chiffre n'est écrit en dur.

const NAVY="#0A2A5C",BLEU="#1E4FA3",ROUGE="#A3122A",OR="#F2A93B";
const SERIF="'Fraunces',serif",SANS="'Outfit',sans-serif";

// Catalogue affiché : une carte par parcours, avec le nombre d'éléments hors examen final
export function catalogue(){
  return FORMATIONS.map(f=>{
    const p=PARCOURS.find(x=>x.id===f.id),x=EXAMENS[f.id];
    const n=elementsParcours(f.id,[]).filter(e=>!e.final).length;
    // SYS-N1 : ses modules de cours sont publiés en ligne (non comptés ici) ; SYS-N2 : exercices pratiques
    const contenu=f.id==="SYS-N1"?"Modules de cours":f.id==="SYS-N2"?`${n} exercices pratiques`:`${n} modules`;
    return{...f,court:p.court,titre:p.titre,contenu,nbQ:x.nbQ,n};
  });
}
const OUTILS=[
  {ico:"headphones",col:"#0E7490",t:"Cours audio",d:"Chaque leçon s'écoute comme un podcast, dans les transports ou en marchant."},
  {ico:"calculator",col:ROUGE,t:"Simulateurs de paie et de TVA",d:"Du brut au net avec CNSS et impôt, déclaration de TVA du mois : vous changez les chiffres, le calcul suit."},
  {ico:"report-money",col:BLEU,t:"Atelier États financiers",d:"Bilan, compte de résultat, tableau des flux et notes annexes construits à partir d'une balance."},
  {ico:"books",col:"#7C3AED",t:"Guide des comptes SYSCOHADA",d:"Contenu et fonctionnement de chaque compte, avec l'exercice « Quel compte ? » classe par classe."},
  {ico:"clipboard-check",col:"#B7791F",t:"Cas corrigés",d:"Une monographie comptable complète et des cas de finance chiffrés en francs congolais et en dollars."},
  {ico:"video",col:"#C2410C",t:"Vidéos, présentations et stages",d:"Replays, supports de cours et stages virtuels pour passer de la théorie à la pratique."},
];
const PUBLICS=[["school","Étudiants"],["calculator","Comptables et auditeurs"],["building-store","Entrepreneurs"],["user-search","Chercheurs d'emploi"],["building-community","ONG et associations"]];

export default function Landing({K,mob,onLogin,logo,logoClair,sombre}){
  const[scrolled,setScrolled]=useState(false);
  useEffect(()=>{const h=()=>setScrolled(window.scrollY>40);window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h);},[]);
  const cat=catalogue();
  const fisc=cat.find(c=>c.id==="FISC")||cat[0];
  const total=cat.reduce((a,c)=>a+c.n,0),libres=cat.filter(c=>c.libre).length;
  const aller=id=>{const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});};
  const titre={margin:0,fontFamily:SERIF,fontWeight:700,color:K.t1,letterSpacing:"-.4px",lineHeight:1.15};
  const sur={fontSize:12.5,fontWeight:800,color:sombre?"#8FB4FF":BLEU,letterSpacing:1.6,textTransform:"uppercase",marginBottom:10};
  const section={padding:mob?"44px 18px":"72px 32px"},large={maxWidth:1040,margin:"0 auto"};
  const carte={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:18};
  const btnP={background:"#fff",border:"none",borderRadius:12,padding:"14px 24px",color:NAVY,fontWeight:800,fontSize:15.5,cursor:"pointer",fontFamily:SANS,minHeight:50,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:9,boxShadow:"0 10px 26px rgba(0,0,0,.25)"};
  const btnS={background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.35)",borderRadius:12,padding:"14px 22px",color:"#fff",fontWeight:700,fontSize:15.5,cursor:"pointer",fontFamily:SANS,minHeight:50,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:9};

  return <div style={{minHeight:"100vh",background:K.bg,fontFamily:SANS,overflowX:"hidden"}}>

    {/* ── BARRE DE NAVIGATION ── */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,transition:"background .3s,border-color .3s",
      background:scrolled?`${K.card}f2`:"transparent",backdropFilter:scrolled?"blur(18px)":"none",WebkitBackdropFilter:scrolled?"blur(18px)":"none",
      borderBottom:`1px solid ${scrolled?K.b0:"transparent"}`,padding:mob?"10px 16px":"12px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <img src={scrolled&&!sombre?logo:logoClair} alt="Éco-Campus" style={{height:mob?28:34,width:"auto",display:"block"}}/>
      <div style={{display:"flex",alignItems:"center",gap:mob?6:10}}>
        {!mob&&<button onClick={()=>aller("parcours")} className="bt" style={{background:"none",border:"none",color:scrolled?K.t2:"rgba(255,255,255,.9)",fontWeight:700,fontSize:14.5,cursor:"pointer",fontFamily:SANS,padding:"8px 10px"}}>Les parcours</button>}
        {!mob&&<button onClick={()=>aller("certificat")} className="bt" style={{background:"none",border:"none",color:scrolled?K.t2:"rgba(255,255,255,.9)",fontWeight:700,fontSize:14.5,cursor:"pointer",fontFamily:SANS,padding:"8px 10px"}}>Le certificat</button>}
        <button onClick={onLogin} className="bt" style={{background:scrolled?`linear-gradient(135deg,${NAVY},${BLEU})`:"#fff",border:"none",borderRadius:10,padding:mob?"9px 16px":"10px 20px",color:scrolled?"#fff":NAVY,fontWeight:800,fontSize:14.5,cursor:"pointer",fontFamily:SANS,minHeight:40}}>Se connecter</button>
      </div>
    </nav>

    {/* ── EN-TÊTE ── */}
    <header style={{background:`radial-gradient(1200px 500px at 85% -10%,rgba(163,18,42,.55),transparent 60%),linear-gradient(150deg,#001433,${NAVY} 55%,${BLEU})`,color:"#fff",padding:mob?"96px 18px 44px":"132px 32px 84px",position:"relative",overflow:"hidden"}}>
      <i className="ti ti-certificate" style={{position:"absolute",right:mob?-40:-30,bottom:mob?-50:-70,fontSize:mob?220:380,opacity:.06,pointerEvents:"none"}}/>
      <div style={{...large,display:"grid",gridTemplateColumns:mob?"1fr":"1.15fr .85fr",gap:mob?30:48,alignItems:"center",position:"relative"}}>
        <div style={{animation:"up .5s ease"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.22)",borderRadius:99,padding:"6px 14px",marginBottom:18,fontSize:13,fontWeight:700}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:OR,display:"inline-block"}}/>Formations certifiantes · RDC et espace OHADA
          </div>
          <h1 style={{margin:"0 0 16px",fontFamily:SERIF,fontWeight:700,fontSize:mob?"2.05rem":"3.25rem",lineHeight:1.08,letterSpacing:"-.8px"}}>
            Maîtrisez la comptabilité, la fiscalité et la finance <span style={{color:OR}}>telles qu'on les pratique en RDC</span>
          </h1>
          <p style={{margin:"0 0 24px",fontSize:mob?15.5:18,lineHeight:1.65,color:"rgba(255,255,255,.88)",maxWidth:560}}>
            {cat.length} parcours certifiants : SYSCOHADA révisé, fiscalité à jour de la réforme 2026, comptabilité bancaire, finance d'entreprise et SYCEBNL. Des leçons claires, des exemples en francs congolais, un examen final et un certificat vérifiable.
          </p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>
            <button onClick={onLogin} className="bt" style={{...btnP,flex:mob?"1 1 100%":"0 0 auto"}}>Créer mon compte gratuit<i className="ti ti-arrow-right" style={{fontSize:18}}/></button>
            <button onClick={()=>aller("parcours")} className="bt" style={{...btnS,flex:mob?"1 1 100%":"0 0 auto"}}>Voir les parcours</button>
          </div>
          <div style={{display:"flex",gap:"8px 18px",flexWrap:"wrap",fontSize:13.5,color:"rgba(255,255,255,.85)",fontWeight:600}}>
            {[["device-mobile","Sur téléphone et ordinateur"],["gift",`${libres} modules d'essai gratuits`],["qrcode","Certificat vérifiable par QR code"]].map(([ic,l])=>
              <span key={l} style={{display:"inline-flex",alignItems:"center",gap:6}}><i className={`ti ti-${ic}`} style={{fontSize:16,color:OR}}/>{l}</span>)}
          </div>
        </div>

        {/* Illustration : un certificat et une étape réussie (exemple) */}
        <div style={{position:"relative",maxWidth:mob?340:400,width:"100%",margin:mob?"6px auto 0":"0 0 0 auto",animation:"up .6s ease .1s both"}} aria-hidden="true">
          <div style={{background:"#fff",color:"#0B1730",borderRadius:18,padding:mob?"18px 18px 16px":"24px 24px 20px",boxShadow:"0 24px 60px rgba(0,0,0,.35)",transform:mob?"none":"rotate(1.5deg)",border:`1px solid rgba(183,121,31,.45)`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12}}>
              <img src={logo} alt="" style={{height:24,width:"auto"}}/>
              <span style={{fontSize:10.5,fontWeight:800,letterSpacing:1.2,color:"#B7791F",textTransform:"uppercase"}}>Exemple</span>
            </div>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1.6,color:ROUGE,textTransform:"uppercase"}}>Certificat de réussite</div>
            <div style={{fontFamily:SERIF,fontWeight:700,fontSize:mob?19:22,lineHeight:1.2,margin:"6px 0 4px",color:NAVY}}>Fiscalité congolaise : le Code des impôts</div>
            <div style={{fontSize:13,color:"#4A5B78",marginBottom:14}}>Décerné à <b style={{color:"#0B1730"}}>Grâce K.</b> · {fisc.n} modules et examen final</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,borderTop:"1px dashed #C9D4E8",paddingTop:12}}>
              <div>
                <div style={{fontSize:11.5,color:"#6B7A94",fontWeight:700}}>Moyenne générale</div>
                <div style={{fontWeight:900,fontSize:24,color:"#0D7A6B",lineHeight:1.1}}>86 %</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5,color:"#6B7A94",fontWeight:700,textAlign:"right",lineHeight:1.3}}>Vérifiable<br/>en ligne<i className="ti ti-qrcode" style={{fontSize:40,color:NAVY}}/></div>
            </div>
          </div>
          <div style={{position:mob?"relative":"absolute",left:mob?0:-34,bottom:mob?0:-58,marginTop:mob?12:0,background:K.card,color:K.t1,border:`1px solid ${K.b0}`,borderRadius:14,padding:"11px 14px",boxShadow:"0 14px 34px rgba(0,0,0,.28)",display:"flex",alignItems:"center",gap:11,maxWidth:mob?"none":270}}>
            <div style={{width:38,height:38,borderRadius:11,background:"#0D7A6B",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-check" style={{fontSize:20,color:"#fff"}}/></div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:800,fontSize:14,lineHeight:1.25}}>Module réussi : 90 %</div>
              <div style={{fontSize:12.5,color:K.t3,lineHeight:1.3}}>Le module suivant est ouvert</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chiffres clés, calculés à partir du catalogue */}
      <div style={{...large,display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:mob?10:14,marginTop:mob?30:64,position:"relative"}}>
        {[[String(cat.length),"parcours certifiants"],[`${Math.floor(total/10)*10}+`,"modules et exercices"],[`${SEUIL_ELEMENT} %`,"pour valider un module"],["100 %","en ligne, à votre rythme"]].map(([v,l])=>
          <div key={l} style={{background:"rgba(255,255,255,.09)",border:"1px solid rgba(255,255,255,.16)",borderRadius:14,padding:mob?"12px 12px":"16px 18px"}}>
            <div style={{fontFamily:SERIF,fontWeight:700,fontSize:mob?24:30,lineHeight:1}}>{v}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.8)",marginTop:5,lineHeight:1.3}}>{l}</div>
          </div>)}
      </div>
    </header>

    {/* ── LES PARCOURS ── */}
    <section id="parcours" style={{...section,scrollMarginTop:64}}>
      <div style={large}>
        <div style={{textAlign:"center",marginBottom:mob?24:38}}>
          <div style={sur}>Le catalogue</div>
          <h2 style={{...titre,fontSize:mob?"1.65rem":"2.3rem"}}>{cat.length} parcours, du débutant à la spécialisation</h2>
          <p style={{margin:"12px auto 0",fontSize:mob?15:16.5,color:K.t2,lineHeight:1.6,maxWidth:620}}>Chaque parcours se termine par un examen final et délivre un certificat avec relevé de notes.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14}}>
          {cat.map((c,i)=><button key={c.id} onClick={onLogin} className="tile bt" style={{textAlign:"left",padding:"20px 20px 18px",fontFamily:SANS,display:"flex",flexDirection:"column",gap:10,borderTop:`3px solid ${c.col}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,width:"100%"}}>
              <div style={{width:46,height:46,borderRadius:13,background:`${c.col}18`,border:`1px solid ${c.col}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${c.ico}`} style={{fontSize:23,color:sombre?"#fff":c.col}}/></div>
              <span style={{fontSize:12,fontWeight:800,color:K.t2,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,padding:"3px 10px",whiteSpace:"nowrap"}}>{i+1} · {c.niveau}</span>
            </div>
            <div style={{fontWeight:800,fontSize:17.5,color:K.t1,lineHeight:1.25}}>{c.court}</div>
            <div style={{fontSize:14,color:K.t2,lineHeight:1.55,flex:1}}>{c.resume}</div>
            <div style={{display:"flex",alignItems:"center",gap:"6px 12px",flexWrap:"wrap",fontSize:12.5,color:K.t3,fontWeight:700}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:5}}><i className="ti ti-book-2" style={{fontSize:14}}/>{c.contenu}</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:5}}><i className="ti ti-certificate" style={{fontSize:14}}/>Examen de {c.nbQ} questions</span>
            </div>
            {c.libre&&<span style={{alignSelf:"flex-start",fontSize:12.5,fontWeight:800,color:sombre?"#4FD1B5":"#0D7A6B",background:"rgba(13,122,107,.12)",border:"1px solid rgba(13,122,107,.3)",borderRadius:99,padding:"3px 10px",display:"inline-flex",alignItems:"center",gap:5}}><i className="ti ti-gift" style={{fontSize:14}}/>Premier module gratuit</span>}
          </button>)}
        </div>
      </div>
    </section>

    {/* ── LE CHEMIN VERS LE CERTIFICAT ── */}
    <section id="certificat" style={{...section,background:K.card,borderTop:`1px solid ${K.b0}`,borderBottom:`1px solid ${K.b0}`,scrollMarginTop:64}}>
      <div style={large}>
        <div style={{textAlign:"center",marginBottom:mob?24:38}}>
          <div style={sur}>Comment ça marche</div>
          <h2 style={{...titre,fontSize:mob?"1.65rem":"2.3rem"}}>Trois étapes jusqu'au certificat</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:mob?12:18}}>
          {[["book-2","Apprenez","Des leçons courtes avec schémas, exemples chiffrés et pièges à éviter. Chaque leçon existe aussi en audio."],
            ["checklist",`Validez chaque module à ${SEUIL_ELEMENT} %`,"Un QCM corrigé à la fin de chaque module. Le module suivant s'ouvre dès que le précédent est réussi."],
            ["certificate","Obtenez votre certificat",`Avec ${SEUIL_MOYENNE} % de moyenne, passez l'examen final. Le certificat est numéroté, vérifiable par QR code et accompagné du relevé de notes.`]].map(([ic,t,d],i)=>
            <div key={t} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:18,padding:mob?"18px":"24px 22px",display:"flex",flexDirection:mob?"row":"column",gap:14,alignItems:"flex-start"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${NAVY},${BLEU})`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ti-${ic}`} style={{fontSize:25,color:"#fff"}}/></div>
                <span style={{position:"absolute",top:-7,right:-7,width:22,height:22,borderRadius:"50%",background:OR,color:"#3A2600",fontWeight:900,fontSize:12.5,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${K.bg}`}}>{i+1}</span>
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:17,color:K.t1,marginBottom:6,lineHeight:1.25}}>{t}</div>
                <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6}}>{d}</div>
              </div>
            </div>)}
        </div>
      </div>
    </section>

    {/* ── LES OUTILS ── */}
    <section style={section}>
      <div style={large}>
        <div style={{textAlign:"center",marginBottom:mob?24:38}}>
          <div style={sur}>Dans l'application</div>
          <h2 style={{...titre,fontSize:mob?"1.65rem":"2.3rem"}}>Plus que des cours : des outils pour pratiquer</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:mob?10:14}}>
          {OUTILS.map(({ico,col,t,d})=><div key={t} style={{...carte,padding:mob?"16px":"20px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:13,flexShrink:0,background:`linear-gradient(135deg,${col},${col}C0)`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ti-${ico}`} style={{fontSize:22,color:"#fff"}}/></div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:4,lineHeight:1.25}}>{t}</div>
              <div style={{fontSize:14,color:K.t2,lineHeight:1.55}}>{d}</div>
            </div>
          </div>)}
        </div>
        <div style={{marginTop:mob?22:32,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px 10px",flexWrap:"wrap"}}>
          <span style={{fontSize:14,color:K.t3,fontWeight:700,width:mob?"100%":"auto",textAlign:"center"}}>Conçu pour :</span>
          {PUBLICS.map(([ic,l])=><span key={l} style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13.5,fontWeight:700,color:K.t2,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"6px 13px"}}><i className={`ti ti-${ic}`} style={{fontSize:15,color:sombre?"#8FB4FF":BLEU}}/>{l}</span>)}
        </div>
      </div>
    </section>

    {/* ── APPEL FINAL ── */}
    <section style={{padding:mob?"0 18px 44px":"0 32px 72px"}}>
      <div style={{...large,background:`linear-gradient(135deg,#001433,${NAVY} 60%,${ROUGE})`,borderRadius:24,padding:mob?"30px 20px":"48px 40px",color:"#fff",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <i className="ti ti-school" style={{position:"absolute",left:-20,bottom:-40,fontSize:200,opacity:.07,pointerEvents:"none"}}/>
        <h2 style={{margin:"0 0 12px",fontFamily:SERIF,fontWeight:700,fontSize:mob?"1.6rem":"2.2rem",lineHeight:1.15,position:"relative"}}>Commencez aujourd'hui, gratuitement</h2>
        <p style={{margin:"0 auto 24px",fontSize:mob?15:16.5,lineHeight:1.65,color:"rgba(255,255,255,.88)",maxWidth:560,position:"relative"}}>Créez votre compte en une minute et suivez les modules d'essai sans payer. Vous débloquerez ensuite l'ensemble des parcours quand vous le souhaitez.</p>
        <button onClick={onLogin} className="bt" style={{...btnP,position:"relative"}}>Créer mon compte gratuit<i className="ti ti-arrow-right" style={{fontSize:18}}/></button>
        <div style={{marginTop:14,fontSize:14,color:"rgba(255,255,255,.85)",position:"relative"}}>Déjà inscrit ?{" "}
          <button onClick={onLogin} className="bt" style={{background:"none",border:"none",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:SANS,padding:0,textDecoration:"underline"}}>Se connecter</button>
        </div>
      </div>
    </section>

    {/* ── PIED DE PAGE ── */}
    <footer style={{borderTop:`1px solid ${K.b0}`,padding:mob?"20px 18px 28px":"22px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px 18px"}}>
      <div style={{fontSize:13,color:K.t3}}>© {new Date().getFullYear()} Éco-Campus RDC · Access Plus Consulting, Kinshasa</div>
      <div style={{fontSize:13,color:K.t3,display:"flex",gap:"6px 16px",flexWrap:"wrap"}}>
        <a href="/confidentialite.html" style={{color:K.t3,textDecoration:"none"}}>Confidentialité</a>
        <span>gnkuli@outlook.fr</span>
        <a href="https://wa.me/243979075970" target="_blank" rel="noreferrer" style={{color:K.t3,textDecoration:"none"}}>WhatsApp +243 979 075 970</a>
      </div>
    </footer>
  </div>;
}
