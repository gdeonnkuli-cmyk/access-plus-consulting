import React,{useState,useRef,useEffect,useCallback,createContext,useContext}from"react";
import{initializeApp,deleteApp}from"firebase/app";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,GoogleAuthProvider,FacebookAuthProvider,signInWithPopup}from"firebase/auth";
import{getFirestore,doc,getDoc,setDoc,updateDoc,collection,getDocs,onSnapshot,deleteDoc,serverTimestamp,query,where,deleteField}from"firebase/firestore";
import{getStorage,ref,uploadBytes,getDownloadURL,deleteObject}from"firebase/storage";

// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────
const FB_CONFIG={
  apiKey:"AIzaSyAO2IfWpqgxFB5jyykCugrxu1fvNRwZMcU",
  authDomain:"access-plus-consulting.firebaseapp.com",
  projectId:"access-plus-consulting",
  storageBucket:"access-plus-consulting.firebasestorage.app",
  messagingSenderId:"601435028350",
  appId:"1:601435028350:web:d8852e2f17e6c65266d12f"
};
const fbApp=initializeApp(FB_CONFIG);
const auth=getAuth(fbApp);
const db=getFirestore(fbApp);
const storage=getStorage(fbApp);
const ADM_EMAIL="admin@accessplus.com";
const EMAILJS_SERVICE="access_plus_service";
const EMAILJS_KEY="5Fvh3h8xBasE_APDn";
const EMAILJS_TPL_CODE="template_3v1a6i6";
const EMAILJS_TPL_NOTIF="template_aisjy5e";
const sendCodeEmail=async({to_email,nom,code,duree,expiration})=>{
  try{
    const res=await fetch("https://api.emailjs.com/api/v1.0/email/send",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({service_id:EMAILJS_SERVICE,template_id:EMAILJS_TPL_CODE,user_id:EMAILJS_KEY,
        template_params:{to_email,subject:"Éco-Campus RDC — Votre code d'accès",nom:nom||"Apprenant",code,duree:duree||"—",expiration:expiration||"—"}})
    });
    return res.ok;
  }catch(e){console.log("sendCodeEmail error",e);return false;}
};
const sendNotifEmail=async({to_email,subject,nom,message})=>{
  try{
    await fetch("https://api.emailjs.com/api/v1.0/email/send",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({service_id:EMAILJS_SERVICE,template_id:EMAILJS_TPL_NOTIF,user_id:EMAILJS_KEY,
        template_params:{to_email,subject,nom:nom||"",message:message||""}})
    });
  }catch(e){console.log("sendNotifEmail error",e);}
};
const googleProvider=new GoogleAuthProvider();
const facebookProvider=new FacebookAuthProvider();

// ── THÈMES ────────────────────────────────────────────────────────────────────
const TH={
  eco:{n:"Éco-Campus",i:"🌿",bg:"#F7F3EC",ca:"#FFFFFF",c2:"#FBF8F2",b0:"rgba(120,90,40,.10)",b1:"rgba(120,90,40,.20)",t1:"#1E1208",t2:"#7A6248",t3:"#A8916E"},
  dark:{n:"Sombre",i:"🌙",bg:"#0C0F19",ca:"#13172A",c2:"#1A1F35",b0:"rgba(255,255,255,.06)",b1:"rgba(255,255,255,.11)",t1:"#F0F3FF",t2:"#8B97BC",t3:"#505A78"},
  light:{n:"Clair",i:"☀️",bg:"#F2F5FC",ca:"#FFFFFF",c2:"#E8EDF7",b0:"rgba(0,0,0,.07)",b1:"rgba(0,0,0,.13)",t1:"#1A1D2E",t2:"#5A6380",t3:"#9BA3BF"},
  sepia:{n:"Sépia",i:"📜",bg:"#F5EFE3",ca:"#FDFAF4",c2:"#EDE6D6",b0:"rgba(120,90,40,.09)",b1:"rgba(120,90,40,.17)",t1:"#2C2416",t2:"#7A6540",t3:"#B09A70"},
  blue:{n:"Océan",i:"🌊",bg:"#071525",ca:"#0C1E36",c2:"#102544",b0:"rgba(100,180,255,.08)",b1:"rgba(100,180,255,.16)",t1:"#E4F1FF",t2:"#7BAFD4",t3:"#3D6E94"},
  green:{n:"Forêt",i:"🌿",bg:"#0B1A10",ca:"#0F2416",c2:"#13301E",b0:"rgba(80,200,100,.07)",b1:"rgba(80,200,100,.14)",t1:"#E4F5E8",t2:"#72B883",t3:"#3D7A50"},
  purple:{n:"Violet",i:"💜",bg:"#100C1E",ca:"#180E30",c2:"#201244",b0:"rgba(160,100,255,.08)",b1:"rgba(160,100,255,.16)",t1:"#EDE8FF",t2:"#9070C8",t3:"#5E4A88"},
};
const ACC={em:"#1A6B3A",emD:"#0C2E1E",emBg:"rgba(26,107,58,.10)",emBd:"rgba(26,107,58,.26)",in_:"#0D7A6B",inD:"#0A5F53",inBg:"rgba(13,122,107,.10)",inBd:"rgba(13,122,107,.26)",wa:"#DAA854",waBg:"rgba(218,168,84,.14)",waBd:"rgba(218,168,84,.30)",er:"#C05A2A",erBg:"rgba(192,90,42,.10)",erBd:"rgba(192,90,42,.26)",rd:"#C05A2A",rdBg:"rgba(192,90,42,.10)",rdBd:"rgba(192,90,42,.26)"};
const CARD_PALETTES={
  dark:[
    {bg:"rgba(52,211,153,.12)",bd:"rgba(52,211,153,.2)",ac:"#34D399"},
    {bg:"rgba(129,140,248,.12)",bd:"rgba(129,140,248,.2)",ac:"#818CF8"},
    {bg:"rgba(251,191,36,.12)",bd:"rgba(251,191,36,.2)",ac:"#FBBF24"},
    {bg:"rgba(248,113,113,.12)",bd:"rgba(248,113,113,.2)",ac:"#F87171"},
    {bg:"rgba(96,165,250,.12)",bd:"rgba(96,165,250,.2)",ac:"#60A5FA"},
    {bg:"rgba(167,139,250,.12)",bd:"rgba(167,139,250,.2)",ac:"#A78BFA"},
  ],
  light:[
    {bg:"#E8FBF3",bd:"#A7F0D0",ac:"#059669"},
    {bg:"#EEF0FF",bd:"#C7D2FE",ac:"#4F46E5"},
    {bg:"#FFFBEB",bd:"#FDE68A",ac:"#D97706"},
    {bg:"#FEF2F2",bd:"#FECACA",ac:"#DC2626"},
    {bg:"#EFF6FF",bd:"#BFDBFE",ac:"#2563EB"},
    {bg:"#F5F3FF",bd:"#DDD6FE",ac:"#7C3AED"},
  ],
  sepia:[
    {bg:"#F0FAF5",bd:"#A7D7BC",ac:"#2D7A50"},
    {bg:"#F3F0FF",bd:"#C9C0F0",ac:"#5B4FC4"},
    {bg:"#FDF8EC",bd:"#F0DFA0",ac:"#A07820"},
    {bg:"#FDF0F0",bd:"#F0C0C0",ac:"#B04040"},
    {bg:"#EFF5FF",bd:"#B8D0F0",ac:"#3060B0"},
    {bg:"#F5F0FF",bd:"#D0C0F0",ac:"#6040A0"},
  ],
};
const getCardPalette=(tid,idx)=>{const p=CARD_PALETTES[tid]||CARD_PALETTES.dark;return p[idx%p.length];};
const bK=id=>{const t=TH[id]||TH.eco;return{bg:t.bg,card:t.ca,c2:t.c2,b0:t.b0,b1:t.b1,t1:t.t1,t2:t.t2,t3:t.t3,...ACC};};
const Ctx=createContext({K:bK("dark"),tid:"dark",setT:()=>{}});
const useK=()=>useContext(Ctx).K;
const mCss=K=>`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Outfit:wght@500;700;800;900&family=JetBrains+Mono:wght@500&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
body{background:${K.bg};color:${K.t1};font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${K.b1};border-radius:9px;}
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes sc{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes gw{0%,100%{box-shadow:0 0 10px #34D39944}50%{box-shadow:0 0 20px #34D39977}}
@keyframes su{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.2);opacity:1}}
@keyframes logofl{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.05)}}
@keyframes dotfl{0%,60%,100%{transform:scale(.5);opacity:.25}30%{transform:scale(1.1);opacity:1}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.18);opacity:1}}
@keyframes logofl{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.04)}}
@keyframes dotfl{0%,80%,100%{transform:scale(.6);opacity:.3}40%{transform:scale(1);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes streak{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
.card-enter{animation:slideUp .35s cubic-bezier(.22,1,.36,1) both}
.card-enter-1{animation:slideUp .35s cubic-bezier(.22,1,.36,1) .05s both}
.card-enter-2{animation:slideUp .35s cubic-bezier(.22,1,.36,1) .10s both}
.card-enter-3{animation:slideUp .35s cubic-bezier(.22,1,.36,1) .15s both}
.card-enter-4{animation:slideUp .35s cubic-bezier(.22,1,.36,1) .20s both}
.card-enter-5{animation:slideUp .35s cubic-bezier(.22,1,.36,1) .25s both}
.page-enter{animation:fadeIn .3s ease both}
.shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.08) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 1.6s infinite}
.hv{transition:transform .2s,box-shadow .2s;cursor:pointer;}.hv:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.3);}.hv:active{transform:scale(.98);}
.bt{transition:filter .15s,transform .12s;cursor:pointer;}.bt:hover{filter:brightness(1.08);}.bt:active{transform:scale(.96);}
.gm{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px;}
.gv{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;}
.gs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.hf{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;}
.tn{display:flex;gap:1px;overflow-x:auto;scrollbar-width:none;}
.tn::-webkit-scrollbar{display:none;}
.ar{display:grid;grid-template-columns:1.1fr 1.5fr .6fr auto;gap:6px;padding:9px 12px;align-items:center;}
.ah{display:grid;grid-template-columns:1.1fr 1.5fr .6fr auto;gap:6px;padding:7px 12px;}
@media(max-width:640px){.gm{grid-template-columns:repeat(2,1fr);}.gv{grid-template-columns:1fr;}.hf{flex-direction:column;align-items:flex-start;}.hs{display:none!important;}.ar{grid-template-columns:1fr auto;}.ah{display:none;}}
@media(min-width:640px)and(max-width:1024px){.gm{grid-template-columns:repeat(3,1fr);}.gv{grid-template-columns:repeat(2,1fr);}}
@media(hover:none){.hv:hover{transform:none;box-shadow:none;}.bt:hover{filter:none;}}
.nb{padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right));}
.mp{padding:18px max(14px,env(safe-area-inset-right)) max(80px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));}`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const DUR=[{id:"1m",l:"1 mois",j:30},{id:"3m",l:"3 mois",j:90},{id:"6m",l:"6 mois",j:180},{id:"1a",l:"1 an",j:365},{id:"v",l:"À vie",j:36500}];
const dE=j=>{const d=new Date();d.setDate(d.getDate()+j);return d.toISOString();};
const jR=i=>!i?0:Math.max(0,Math.ceil((new Date(i)-new Date())/864e5));
const fD=i=>!i?"—":new Date(i).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const xp=i=>!i||new Date(i)<new Date();
const COLS=["#34D399","#818CF8","#FBBF24","#F87171","#60A5FA","#A78BFA","#FB923C","#4ADE80","#F472B6","#38BDF8"];
const icoEl=(ico,col,sz=16)=>{
  if(!ico)return null;
  const isTabler=/^[a-z]/.test(ico);
  if(isTabler)return <i className={"ti ti-"+ico} style={{fontSize:sz,color:col||"inherit"}}/>;
  return <span style={{fontSize:sz}}>{ico}</span>;
};
const ICOS=["book-2","world","pencil","scale","chart-bar","building-bank","shopping-cart","users","crane","shield","clipboard-list","briefcase","target","microscope","bulb","building","bolt","globe"];
const pVid=u=>{if(!u)return null;u=u.trim();let m=u.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);if(m)return{t:"yt",id:m[1],src:`https://www.youtube.com/embed/${m[1]}?rel=0`};m=u.match(/vimeo\.com\/(\d+)/);if(m)return{t:"vi",src:`https://player.vimeo.com/video/${m[1]}`};if(u.includes("facebook.com"))return{t:"fb",src:`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false`};if(u.startsWith("http"))return{t:"url",src:u};return null;};

// ── FIREBASE HOOKS ────────────────────────────────────────────────────────────
function useModules(){
  const[mods,sMods]=useState([]);const[loading,sL]=useState(true);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"modules"),(snap)=>{
      const data=snap.docs.map(d=>expandMod({id:d.id,...d.data()})).sort((a,b)=>(a.ordre||0)-(b.ordre||0));
      sMods(data);sL(false);
    });
    return unsub;
  },[]);
  return{mods,loading};
}
function useVideos(){
  const[vids,sV]=useState([]);const[live,sL]=useState({on:false,url:"",titre:"",desc:""});
  useEffect(()=>{
    const u1=onSnapshot(collection(db,"videos"),(snap)=>{sV(snap.docs.map(d=>({id:d.id,...d.data()})));});
    const u2=onSnapshot(doc(db,"config","live"),(snap)=>{if(snap.exists())sL(snap.data());});
    return()=>{u1();u2();};
  },[]);
  return{vids,live};
}
function useUsers(){
  const[users,sU]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"users"),(snap)=>{sU(snap.docs.map(d=>({uid:d.id,...d.data()})));});
    return unsub;
  },[]);
  return users;
}

// ── FIRESTORE ACTIONS ─────────────────────────────────────────────────────────
const saveUserData=async(uid,data)=>{await setDoc(doc(db,"users",uid),data,{merge:true});};
const saveProgress=async(uid,modId,score)=>{
  await updateDoc(doc(db,"users",uid),{[`scores.${modId}`]:score,[`progress.${modId}`]:"done"});
};
const saveModule=async(mod)=>{
  const{id,...data}=mod;
  const flat=flattenMod(data);
  if(id&&id.length>4){await setDoc(doc(db,"modules",id),flat,{merge:true});}
  else{const ref_=doc(collection(db,"modules"));await setDoc(ref_,flat);}
};
const deleteModule=async(id)=>{await deleteDoc(doc(db,"modules",id));};
const saveAnnonce=async(an)=>{
  const{id,...data}=an;
  if(id&&id.length>4){await setDoc(doc(db,"annonces",id),data,{merge:true});}
  else{const ref_=doc(collection(db,"annonces"));await setDoc(ref_,{...data,createdAt:Date.now()});}
};
const deleteAnnonce=async(id)=>{await deleteDoc(doc(db,"annonces",id));};
const exportUsersCsv=users=>{
  const headers=["Nom","Email","Rôle","Abonnement","Créé le","Dernière connexion","Modules complétés","Score moyen"];
  const rows=users.map(u=>{
    const nMods=Object.values(u.progress||{}).filter(v=>v==="done").length;
    const scoreVals=Object.values(u.scores||{}).map(sc=>sc?.pct).filter(p=>p!=null);
    const avg=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length):"";
    const lastLogin=u.lastLogin?new Date(u.lastLogin).toLocaleString("fr-FR"):"Jamais";
    return [u.nom||"",u.mail||"",u.role==="formateur"?"Formateur":"Apprenant",u.abonnement||"aucun",u.createdAt||"",lastLogin,nMods,avg]
      .map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  const csv="\uFEFF"+[headers.join(","),...rows].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`eco-campus-utilisateurs-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
const createUserAsAdmin=async({nom,mail,password,role})=>{
  const secApp=initializeApp(FB_CONFIG,"Secondary_"+Date.now());
  const secAuth=getAuth(secApp);
  try{
    const cred=await createUserWithEmailAndPassword(secAuth,mail,password);
    const data={nom,mail,createdAt:new Date().toLocaleDateString("fr-FR"),abonnement:"aucun",activationCode:null,codeValide:false,demandeDate:null,dureeId:null,dateExpiration:null,progress:{},scores:{},consentDate:new Date().toISOString(),consentVersion:PRIVACY_VERSION,lastLogin:null,creePar:"admin"};
    if(role==="formateur"){data.role="formateur";data.formateurCodeValide=true;}
    await setDoc(doc(db,"users",cred.user.uid),data);
    await signOut(secAuth);
  }finally{
    await deleteApp(secApp);
  }
};
const sendMessage=async({apprenantUid,apprenantNom,from,fromNom,fromRole,texte,formateurUid})=>{
  const ref_=doc(collection(db,"messages"));
  await setDoc(ref_,{apprenantUid,apprenantNom,from,fromNom,fromRole,texte,formateurUid:formateurUid||null,ts:Date.now(),luApprenant:fromRole==="apprenant",luAdmin:fromRole!=="apprenant"});
};
const markMsgsRead=async(apprenantUid,side)=>{
  try{
    const snap=await getDocs(query(collection(db,"messages"),where("apprenantUid","==",apprenantUid)));
    const field=side==="apprenant"?"luApprenant":"luAdmin";
    await Promise.all(snap.docs.filter(d=>!d.data()[field]).map(d=>updateDoc(d.ref,{[field]:true})));
  }catch(e){console.log("markMsgsRead error",e);}
};
const saveVideo=async(vid)=>{
  const{id,...data}=vid;
  if(id){await setDoc(doc(db,"videos",id),data,{merge:true});}
  else{const r=doc(collection(db,"videos"));await setDoc(r,data);}
};
const deleteVideo=async(id)=>{await deleteDoc(doc(db,"videos",id));};

// ── SEED MODULES ──────────────────────────────────────────────────────────────
const SEED_MODS=[
  {code:"M01",ico:"book-2",col:"#34D399",titre:"Fondements SYSCOHADA",desc:"Zone OHADA · Principes fondamentaux",mat:"SYSCOHADA",on:true,ordre:1,
   q:[{q:"Combien d'États membres de l'OHADA ?",r:["10","17","21","25"],b:1},{q:"Année de révision du SYSCOHADA ?",r:["2011","2014","2017","2020"],b:2},{q:"N'est PAS un principe comptable ?",r:["Prudence","Continuité","Maximisation","Permanence"],b:2},{q:"Délai dépôt au RCCM ?",r:["2 mois","3 mois","4 mois","6 mois"],b:2},{q:"La permanence des méthodes garantit :",r:["La rentabilité","La comparabilité","Le capital","La liquidité"],b:1}],
   ex:{ti:"Principes SYSCOHADA",en:"Une entreprise change de méthode d'amortissement sans justification. Analysez les violations et proposez la correction.",tv:["1. Identifiez le principe violé.","2. Expliquez l'impact sur les états financiers.","3. Décrivez la procédure correcte SYSCOHADA.","4. Rédigez la note annexe obligatoire."],dn:[],co:"Violation du principe de permanence des méthodes (art.40 SYSCOHADA). Tout changement doit être exceptionnel, justifié et mentionné en annexe avec impact chiffré."}},
  {code:"M02",ico:"pencil",col:"#818CF8",titre:"Écriture Comptable",desc:"Débit · Crédit · Journal · Balance",mat:"SYSCOHADA",on:true,ordre:2,
   q:[{q:"Augmentation d'un actif →",r:["Crédit","Débit","Hors bilan","Annexe"],b:1},{q:"Achat de marchandises à crédit HT :",r:["D601/C521","D601/C401","D401/C601","D521/C401"],b:1},{q:"La balance vérifie :",r:["La rentabilité","Σdébits = Σcrédits","Les stocks","La trésorerie"],b:1},{q:"Vente de marchandises TTC :",r:["D521/C701","D411/C701+4431","D401/C701","D521/C411"],b:1},{q:"Le grand livre regroupe :",r:["Clients uniquement","Tous les comptes","Fournisseurs","Trésorerie"],b:1}],
   ex:{ti:"Journal et Grand livre",en:"CONGO SA réalise les opérations d'octobre 2024. Journalisez et reportez au compte 521 Banque.",tv:["1. Passez les écritures au journal.","2. Ouvrez le compte 521 Banque.","3. Calculez le solde final.","4. Vérifiez l'équilibre de la balance."],dn:[{a:"02/10",b:"Achat marchd. crédit HT",c:"500 000"},{a:"08/10",b:"Vente TTC (TVA 16%)",c:"708 000"},{a:"15/10",b:"Règlement fournisseur banque",c:"500 000"},{a:"22/10",b:"Encaissement client banque",c:"708 000"},{a:"28/10",b:"Loyer payé banque",c:"120 000"}],co:"Solde 521 débiteur final : 88 000 CDF. Débits (708 000) − Crédits (620 000) = 88 000 CDF."}},
  {code:"M03",ico:"scale",col:"#FBBF24",titre:"Actif, Passif & Bilan",desc:"9 classes · Structure du bilan SYSCOHADA",mat:"SYSCOHADA",on:true,ordre:3,
   q:[{q:"Règle fondamentale du bilan :",r:["Actif > Passif","Actif = Passif","Actif < Passif","Aucune règle"],b:1},{q:"Les stocks appartiennent à la classe :",r:["2","3","4","5"],b:1},{q:"Le compte 521 représente :",r:["La caisse","Les effets","La banque","Les clients"],b:2},{q:"Les capitaux propres sont dans :",r:["Actif immobilisé","Actif circulant","Passif Classe 1","Trésorerie"],b:2},{q:"Le passif représente :",r:["Un bien possédé","Une obligation envers les tiers","Un droit","Un actif"],b:1}],
   ex:{ti:"Bilan SYSCOHADA",en:"Établissez le bilan au 31/12/2024 (système normal) à partir des soldes fournis.",tv:["1. Classez chaque solde actif/passif.","2. Calculez les totaux par masse.","3. Vérifiez Actif = Passif.","4. Calculez les ratios de liquidité."],dn:[{a:"211 Terrains",b:"2 000 000",c:"Dt"},{a:"241 Matériel",b:"1 500 000",c:"Dt"},{a:"2841 Amort.",b:"300 000",c:"Ct"},{a:"31 Stocks",b:"450 000",c:"Dt"},{a:"411 Clients",b:"320 000",c:"Dt"},{a:"521 Banque",b:"180 000",c:"Dt"},{a:"101 Capital",b:"3 000 000",c:"Ct"},{a:"401 Fourn.",b:"150 000",c:"Ct"}],co:"Actif brut = 4 450 000 | Amort. = 300 000 | Actif net = 4 150 000 = Passif (Capital 3 000 000 + Fourn. 150 000 + RAN 1 000 000)."}},
  {code:"M04",ico:"chart-bar",col:"#34D399",titre:"Charges & Résultat",desc:"Classes 6 & 7 · SIG · Compte de résultat",mat:"SYSCOHADA",on:true,ordre:4,
   q:[{q:"Le résultat net est égal à :",r:["Actif − Passif","Produits − Charges","CA − Stocks","Charges − Produits"],b:1},{q:"Le compte de ventes de marchandises est :",r:["601","701","401","521"],b:1},{q:"Les charges de personnel sont en :",r:["Classe 60","Classe 64","Classe 66","Classe 67"],b:2},{q:"Si Produits > Charges, on constate :",r:["Une perte","Un bénéfice","Un résultat nul","Un passif"],b:1},{q:"Les dotations aux amortissements sont en :",r:["691","681","791","481"],b:1}],
   ex:{ti:"SIG et résultat",en:"Calculez les Soldes Intermédiaires de Gestion de KINSHASA TRADE SA pour 2024 et commentez la rentabilité.",tv:["1. Calculez la Marge Brute.","2. Calculez la Valeur Ajoutée.","3. Calculez l'EBE.","4. Calculez le Résultat net.","5. Commentez en 5 lignes."],dn:[{a:"Ventes (701)",b:"12 500 000"},{a:"Achats (601)",b:"7 200 000"},{a:"Var. stocks",b:"−200 000"},{a:"Services ext.",b:"1 100 000"},{a:"Personnel",b:"2 000 000"},{a:"Amortissements",b:"350 000"}],co:"MB = 5 500 000 | VA = 4 400 000 | EBE = 2 220 000 | Résultat exploitation = 1 870 000. Taux de marge nette ≈ 15% — rentabilité correcte."}},
  {code:"M05",ico:"building-bank",col:"#818CF8",titre:"TVA SYSCOHADA",desc:"Mécanisme · Comptes · Liquidation mensuelle",mat:"SYSCOHADA",on:true,ordre:5,
   q:[{q:"La TVA collectée est enregistrée au :",r:["44566","4431","4441","44561"],b:1},{q:"La TVA déductible sur achats est au :",r:["4431","4441","44566","44591"],b:2},{q:"La TVA à décaisser est égale à :",r:["Déduc.−Coll.","Coll.+Déduc.","Coll.−Déduc.","Coll.×16%"],b:2},{q:"Un crédit de TVA est enregistré au :",r:["4431","4441","44566","44591"],b:3},{q:"La TVA déductible sur immobilisations est au :",r:["44566","44561","4431","4441"],b:1}],
   ex:{ti:"TVA SYSCOHADA",en:"MBOKA SARL (assujettie TVA 16%) — comptabilisez les opérations de novembre 2024 et établissez la déclaration.",tv:["1. Enregistrez chaque opération avec TVA.","2. Calculez la TVA collectée.","3. Calculez la TVA déductible.","4. Déterminez TVA à décaisser ou crédit.","5. Passez l'écriture de liquidation."],dn:[{a:"Ventes TTC",b:"1 392 000"},{a:"Achats matières TTC",b:"580 000"},{a:"Achat matériel TTC",b:"464 000"},{a:"Charges div. TTC",b:"232 000"}],co:"TVA coll.(4431)=192 000 | TVA déduc. achats(4441)=80 000 | TVA déduc. immob(44561)=64 000 | TVA à payer=48 000 CDF au compte 44566."}},
  {code:"M06",ico:"shopping-cart",col:"#FBBF24",titre:"Achats & Règlements",desc:"Factures · Réductions · Effets de commerce",mat:"SYSCOHADA",on:true,ordre:6,
   q:[{q:"Le rabais est accordé pour :",r:["Fidélité","Paiement anticipé","Défaut de qualité","Volume"],b:2},{q:"L'escompte de règlement est une :",r:["Ch. commerciale","Ch. financière 671","Réduction du capital","Provision"],b:1},{q:"Les effets à recevoir sont au compte :",r:["401","411","412","403"],b:2},{q:"Une lettre de change est tirée par :",r:["Le débiteur","Le créancier","La banque","L'État"],b:1},{q:"Un avoir fournisseur sur achat est enregistré au :",r:["609","701","521","661"],b:0}],
   ex:{ti:"Effets de commerce",en:"LUMUMBA & Frères vend 2 360 000 CDF TTC à PATRICE SA le 01/11/2024 et tire une LC à 60 jours (escompte 12%/an).",tv:["1. Écriture de vente à crédit.","2. Création de la traite (LC).","3. Remise à l'escompte bancaire.","4. Encaissement à l'échéance.","5. Cas de non-paiement."],dn:[{a:"Valeur LC",b:"2 360 000 CDF"},{a:"Durée",b:"60 jours"},{a:"Taux escompte",b:"12%/an"}],co:"Escompte = 2 360 000 × 12% × 60/360 = 47 200 CDF. D521(2 312 800) + D671(47 200) / C412(2 360 000)."}},
  {code:"M07",ico:"users",col:"#34D399",titre:"Paie & Personnel",desc:"Bulletin de paie · Cotisations · Écritures",mat:"SYSCOHADA",on:true,ordre:7,
   q:[{q:"Le salaire net est égal à :",r:["Brut + charges patronales","Brut − retenues salariales","Brut × 16%","Salaire de base"],b:1},{q:"Les rémunérations du personnel sont au :",r:["641","661","421","431"],b:1},{q:"Les cotisations patronales sont enregistrées au :",r:["641","645","664","421"],b:2},{q:"Le paiement du salaire génère :",r:["D661","D421","C521","C431"],b:2},{q:"Le compte 431 représente :",r:["Un actif","Une dette — passif","Une charge","Un produit"],b:1}],
   ex:{ti:"Bulletin de paie",en:"M. KABILA Jean, salaire de base 1 800 000 CDF. Établissez le bulletin d'octobre 2024 et passez les écritures.",tv:["1. Calculez les retenues salariales.","2. Calculez le salaire net.","3. Calculez les charges patronales.","4. Passez les écritures comptables.","5. Calculez le coût employeur total."],dn:[{a:"Salaire de base",b:"1 800 000"},{a:"Prime transport",b:"80 000"},{a:"Prime rendement",b:"120 000"},{a:"INSS salarial",b:"5% du brut"},{a:"INSS patronal",b:"13% du brut"},{a:"ONEM",b:"0,2% du brut"}],co:"Brut = 2 000 000 | INSS sal. = 100 000 | Net = 1 900 000 | INSS patron. = 260 000 | Coût employeur = 2 264 000 CDF."}},
  {code:"M08",ico:"crane",col:"#818CF8",titre:"Immobilisations",desc:"Méthodes d'amortissement · Tableau · Cession",mat:"SYSCOHADA",on:true,ordre:8,
   q:[{q:"L'amortissement linéaire est calculé par :",r:["VO × Durée","VO ÷ Durée","VNC × Taux","VO × Taux dégressif"],b:1},{q:"La dotation aux amortissements est au :",r:["28x","291","681","81"],b:2},{q:"Les terrains s'amortissent-ils ?",r:["Oui, sur 50 ans","Non, sauf exception","Oui, sur 20 ans","Oui, en dégressif"],b:1},{q:"Les logiciels sont enregistrés au :",r:["212","213","215","216"],b:1},{q:"La VNC lors d'une cession est au :",r:["675","81","82","28x"],b:2}],
   ex:{ti:"Amortissements & Cession",en:"Camion acquis 9 000 000 CDF HT le 01/01/2022 (5 ans linéaire). Cédé le 01/07/2024 pour 5 000 000 CDF.",tv:["1. Établissez le tableau d'amortissement sur 5 ans.","2. Calculez la VNC à la date de cession.","3. Passez la dotation prorata temporis 2024.","4. Passez l'écriture de sortie et de cession.","5. Calculez le résultat de cession."],dn:[{a:"Coût HT",b:"9 000 000"},{a:"Acquisition",b:"01/01/2022"},{a:"Durée",b:"5 ans linéaire"},{a:"Prix cession",b:"5 000 000"},{a:"Date cession",b:"01/07/2024"}],co:"Amort/an = 1 800 000 | Cumul au 01/07/2024 = 4 500 000 | VNC = 4 500 000 | Plus-value = 500 000 CDF (compte 82)."}},
  {code:"M09",ico:"shield-check",col:"#FBBF24",titre:"Provisions & Dépréciations",desc:"Risques · Dépréciations · Reprises",mat:"SYSCOHADA",on:true,ordre:9,
   q:[{q:"La provision pour litige est au :",r:["1511","191","151","19"],b:1},{q:"La dépréciation d'une créance est au :",r:["411","491","416","681"],b:1},{q:"On reprend une provision quand :",r:["Chaque mois","Le risque a disparu","Jamais","Chaque année"],b:1},{q:"La dotation aux provisions est en :",r:["Classe 7","Compte 691","Classe 1","Classe 2"],b:1},{q:"La dépréciation des stocks est au :",r:["391","39x","491","291"],b:1}],
   ex:{ti:"Provisions & Dépréciations",en:"Au 31/12/2024, KINOIS SA identifie trois situations nécessitant des provisions. Comptabilisez et analysez l'impact.",tv:["1. Calculez le montant de chaque provision.","2. Passez les dotations au 31/12/2024.","3. Passez la reprise si le risque disparaît en 2025.","4. Analysez l'impact sur le résultat et le bilan."],dn:[{a:"Client DOUTEUX SA",b:"Créance 800 000 — recouvrement 40%"},{a:"Litige social",b:"Risque estimé à 350 000 CDF"},{a:"Stock obsolète",b:"Coût 200 000 — valeur nette 120 000"}],co:"Dépréc. client = 480 000 (D6912/C491) | Prov. litige = 350 000 (D6911/C191) | Dépréc. stock = 80 000 (D6913/C39x). Impact résultat = −910 000 CDF."}},
  {code:"M10",ico:"clipboard-list",col:"#34D399",titre:"Clôture & États Financiers",desc:"Régularisations · Affectation · SYSCOHADA",mat:"SYSCOHADA",on:true,ordre:10,
   q:[{q:"Les charges constatées d'avance sont au :",r:["486","476","487","477"],b:1},{q:"Le TAFIRE est obligatoire pour le système :",r:["Minimal","Allégé","Normal","Tous les systèmes"],b:2},{q:"L'affectation du résultat est décidée par :",r:["Le comptable","L'AGO","Le directeur","L'État"],b:1},{q:"La réserve légale est fixée à :",r:["1%","5%","10%","20%"],b:1},{q:"Les produits constatés d'avance sont au :",r:["476","477","486","487"],b:1}],
   ex:{ti:"Travaux de clôture",en:"BOMA SA clôture au 31/12/2024. Effectuez les régularisations et proposez une affectation du résultat.",tv:["1. Passez les écritures de régularisation.","2. Calculez le résultat de l'exercice.","3. Identifiez les postes de régularisation au bilan.","4. Affectation : réserve légale 5%, dividendes 60%, RAN le reste."],dn:[{a:"Loyer d'avance (janv. 2025)",b:"180 000"},{a:"Intérêts courus à recevoir",b:"45 000"},{a:"Abonnement (janv-mars 2025)",b:"90 000"},{a:"Résultat brut",b:"2 400 000"}],co:"CCA = 270 000 | PIAN = 45 000 | Résultat ajusté = 2 175 000 | Réserve légale = 108 750 | Dividendes = 1 305 000 | RAN = 761 250."}},
];

const flattenMod=m=>({
  ...m,
  q:JSON.stringify(m.q||[]),
  openQ:JSON.stringify(m.openQ||[]),
  ex:m.ex?{...m.ex,dn:JSON.stringify(m.ex.dn||[]),tv:JSON.stringify(m.ex.tv||[])}:null,
});
const expandMod=m=>({
  ...m,
  q:typeof m.q==="string"?JSON.parse(m.q||"[]"):m.q||[],
  openQ:typeof m.openQ==="string"?JSON.parse(m.openQ||"[]"):m.openQ||[],
  ex:m.ex?{...m.ex,dn:typeof m.ex.dn==="string"?JSON.parse(m.ex.dn||"[]"):m.ex.dn||[],tv:typeof m.ex.tv==="string"?JSON.parse(m.ex.tv||"[]"):m.ex.tv||[]}:m.ex,
});
const seedModules=async()=>{
  try{
    const snap=await getDocs(collection(db,"modules"));
    if(snap.size>0){alert(`${snap.size} modules déjà présents dans Firestore. Supprimez-les d'abord si vous souhaitez réinitialiser.`);return;}
    let count=0;
    for(const m of SEED_MODS){
      const r=doc(collection(db,"modules"));
      await setDoc(r,flattenMod(m));
      count++;
    }
    alert(`✅ ${count} modules SYSCOHADA initialisés avec succès dans Firestore !`);
  }catch(e){alert("Erreur : "+e.message);}
};
const saveDemande=async(d)=>{
  const r=doc(collection(db,"demandes"));
  await setDoc(r,{...d,createdAt:Date.now(),statut:"nouveau"});
  sendNotifEmail({to_email:ADM_EMAIL,subject:`Nouvelle demande — ${d.nom||"Utilisateur"}`,nom:"Admin",message:`Une nouvelle demande vient d'être reçue sur Éco-Campus RDC.\n\nNom : ${d.nom||"—"}\nEmail : ${d.email||"—"}\nTéléphone : ${d.tel||"—"}\nService/Objet : ${d.service||"—"}\nMessage : ${d.message||"—"}\n\nConnectez-vous à l'espace admin pour la traiter.`});
};
const updateDemande=async(id,data)=>{
  await updateDoc(doc(db,"demandes",id),data);
};
const saveStage=async(s)=>{
  const{id,...data}=s;
  if(id){await setDoc(doc(db,"stages",id),data,{merge:true});}
  else{const r=doc(collection(db,"stages"));await setDoc(r,data);}
};
const deleteStage=async(id)=>{await deleteDoc(doc(db,"stages",id));};
const savePlateforme=async(p)=>{
  const{id,...data}=p;
  if(id){await setDoc(doc(db,"plateformes",id),data,{merge:true});}
  else{const r=doc(collection(db,"plateformes"));await setDoc(r,data);}
};
const deletePlateforme=async(id)=>{await deleteDoc(doc(db,"plateformes",id));};
const savePresentation=async(pres)=>{
  const{id,...data}=pres;
  if(id){await setDoc(doc(db,"presentations",id),data,{merge:true});}
  else{const r=doc(collection(db,"presentations"));await setDoc(r,data);}
};
const deletePresentation=async(id)=>{await deleteDoc(doc(db,"presentations",id));};
const saveLive=async(data)=>{await setDoc(doc(db,"config","live"),data,{merge:true});};
const uploadPdf=async(modId,file)=>{
  const r=ref(storage,`pdfs/${modId}/${file.name}`);
  await uploadBytes(r,file);
  const url=await getDownloadURL(r);
  await setDoc(doc(db,"pdfs",modId),{name:file.name,url,modId});
  return{name:file.name,url};
};
const deletePdf=async(modId,name)=>{
  try{await deleteObject(ref(storage,`pdfs/${modId}/${name}`));}catch(e){}
  await deleteDoc(doc(db,"pdfs",modId));
};

// ── RESPONSIVE ────────────────────────────────────────────────────────────────
function useMessages(apprenantUid){
  const[msgs,sMsgs]=useState([]);
  useEffect(()=>{
    if(!apprenantUid){sMsgs([]);return;}
    const unsub=onSnapshot(query(collection(db,"messages"),where("apprenantUid","==",apprenantUid)),(snap)=>{
      sMsgs(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.ts||0)-(b.ts||0)));
    });
    return unsub;
  },[apprenantUid]);
  return msgs;
}
function usePsychoScoresAll(){
  const[scores,sScores]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"psychoScores"),(snap)=>{
      sScores(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[]);
  return scores;
}
function useMyOpenAnswers(uid){
  const[ans,sAns]=useState([]);
  useEffect(()=>{
    if(!uid){sAns([]);return;}
    const unsub=onSnapshot(query(collection(db,"openAnswers"),where("apprenantUid","==",uid)),(snap)=>{
      sAns(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[uid]);
  return ans;
}
function useFormateurOpenAnswers(formateurUid){
  const[ans,sAns]=useState([]);
  useEffect(()=>{
    if(!formateurUid){sAns([]);return;}
    const unsub=onSnapshot(query(collection(db,"openAnswers"),where("formateurUid","==",formateurUid)),(snap)=>{
      sAns(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[formateurUid]);
  return ans;
}
const submitOpenAnswers=async({modId,modTitre,apprenantUid,apprenantNom,formateurUid,answers,maxPoints})=>{
  const ref_=doc(collection(db,"openAnswers"));
  await setDoc(ref_,{modId,modTitre,apprenantUid,apprenantNom,formateurUid,answers,maxPoints,graded:false,notes:{},totalPoints:0,pct:null,submittedAt:Date.now()});
  await updateDoc(doc(db,"users",apprenantUid),{[`progress.${modId}`]:"done"});
};
const gradeOpenAnswers=async(answerId,notes,apprenantUid,modId,maxPoints)=>{
  const totalPoints=Object.values(notes).reduce((a,b)=>a+(Number(b)||0),0);
  const pct=maxPoints>0?Math.round(totalPoints/maxPoints*100):0;
  await updateDoc(doc(db,"openAnswers",answerId),{graded:true,notes,totalPoints,pct,gradedAt:Date.now()});
  await updateDoc(doc(db,"users",apprenantUid),{[`scores.${modId}`]:{s:totalPoints,t:maxPoints,pct}});
};
function useAllDocs(){
  const[docs,sDocs]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"documents"),(snap)=>{
      sDocs(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[]);
  return docs;
}
function useFormateurMessages(formateurUid){
  const[msgs,sMsgs]=useState([]);
  useEffect(()=>{
    if(!formateurUid){sMsgs([]);return;}
    const unsub=onSnapshot(query(collection(db,"messages"),where("formateurUid","==",formateurUid)),(snap)=>{
      sMsgs(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.ts||0)-(b.ts||0)));
    });
    return unsub;
  },[formateurUid]);
  return msgs;
}
function useAllMessages(){
  const[msgs,sMsgs]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"messages"),(snap)=>{
      sMsgs(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[]);
  return msgs;
}
function useDemandes(){
  const[demandes,sD]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"demandes"),(snap)=>{
      sD(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
    });
    return unsub;
  },[]);
  return demandes;
}
function useAnnonces(){
  const[annonces,sAn]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"annonces"),(snap)=>{
      sAn(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
    });
    return unsub;
  },[]);
  return annonces;
}
function useStages(){
  const[stages,sS]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"stages"),(snap)=>{
      sS(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
    });
    return unsub;
  },[]);
  return stages;
}
function usePlateformes(){
  const[plats,sP]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"plateformes"),(snap)=>{
      sP(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.ordre||0)-(b.ordre||0)));
    });
    return unsub;
  },[]);
  return plats;
}
function usePresentations(){
  const[pres,sP]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"presentations"),(snap)=>{
      sP(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.ordre||0)-(b.ordre||0)));
    });
    return unsub;
  },[]);
  return pres;
}
function useW(){const[w,sW]=useState(typeof window!=="undefined"?window.innerWidth:375);useEffect(()=>{const h=()=>sW(window.innerWidth);window.addEventListener("resize",h,{passive:true});return()=>window.removeEventListener("resize",h);},[]);return{mob:w<640};}

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const Logo=({sm})=>{const K=useK();return <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
  <img src="/logo.png" alt="Éco-Campus RDC"
    style={{height:sm?28:36,width:"auto",objectFit:"contain",display:"none"}}
    onError={e=>{e.target.style.display="none";if(e.target.nextSibling)e.target.nextSibling.style.display="flex";}}
  />
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    <svg width={sm?18:22} height={sm?18:22} viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke={K.em} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/><path d="M10 2L18 11L10 20" stroke={K.em} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div><div style={{fontWeight:800,fontSize:sm?13:15,color:K.t1,lineHeight:1,fontFamily:"'Fraunces',serif"}}>Éco-Campus</div>{!sm&&<div style={{fontSize:8,color:K.t3,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>RDC</div>}</div>
  </div>
</div>;};
const Tg=({c,bg,bd,ch})=>{const K=useK();return <span style={{background:bg||K.c2,color:c||K.t2,border:`1px solid ${bd||K.b0}`,borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{ch}</span>;};
const Bar=({p,col,h=4})=>{const K=useK();return <div style={{background:K.b0,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(p,100)}%`,height:"100%",background:col||K.em,borderRadius:99,transition:"width .6s ease"}}/></div>;};
const Spin=()=>{const K=useK();return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:24,background:K.bg}}><div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{position:"absolute",width:70,height:70,borderRadius:"50%",background:`${K.em}14`,animation:"pulse 2s ease-in-out infinite"}}/><div style={{position:"absolute",width:52,height:52,borderRadius:"50%",background:`${K.em}0D`,animation:"pulse 2s ease-in-out infinite .4s"}}/><div style={{width:46,height:46,borderRadius:14,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 24px ${K.emD}55`,animation:"logofl 2.4s ease-in-out infinite"}}><svg width={22} height={22} viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke="rgba(7,18,9,.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 2L18 11L10 20" stroke="#F5EDD8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div><div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:6}}>Éco-Campus</div><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:K.em,display:"inline-block",animation:"dotfl 1.4s ease-in-out infinite",animationDelay:`${i*0.22}s`}}/>)}</div></div></div>;};
function Btn({ch,on,v="p",sm,full,dis,sx}){const K=useK();const M={p:{bg:`linear-gradient(135deg,${K.emD},${K.em})`,col:"#F5EDD8",sh:`0 2px 10px ${K.emD}44`},g:{bg:"transparent",col:K.t2,bo:`1px solid ${K.b1}`},d:{bg:K.erBg,col:K.er,bo:`1px solid ${K.erBd}`},w:{bg:K.waBg,col:K.wa,bo:`1px solid ${K.waBd}`},i:{bg:`linear-gradient(135deg,${K.inD},${K.in_})`,col:"#fff",sh:`0 2px 10px ${K.inD}44`},s:{bg:K.c2,col:K.t2,bo:`1px solid ${K.b0}`},r:{bg:K.rdBg,col:K.rd,bo:`1px solid ${K.rdBd}`}}[v]||{};return <button onClick={dis?null:on} className="bt" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:sm?"7px 11px":"10px 17px",borderRadius:9,fontSize:sm?12:13,fontWeight:700,border:M.bo||"none",background:M.bg,color:M.col,boxShadow:M.sh||"none",width:full?"100%":undefined,opacity:dis?.45:1,cursor:dis?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",minHeight:sm?36:40,...sx}}>{ch}</button>;}
function Inp({lb,rf,type,ph,mono,note,ok,def,rows,val,onChange}){const K=useK();const base={width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:mono?"'JetBrains Mono',monospace":"'Outfit',sans-serif",caretColor:K.em};const fe=e=>{e.target.style.borderColor=K.emBd;if(!rows)e.target.style.background=K.card;};const fb=e=>{e.target.style.borderColor=K.b0;if(!rows)e.target.style.background=K.c2;};const props={onFocus:fe,onBlur:fb};if(val!==undefined){props.value=val;props.onChange=onChange||function(){};}else{props.defaultValue=def||"";}return <div style={{marginBottom:13}}>{lb&&<div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>{lb}</div>}{rows?<textarea ref={rf} rows={rows} placeholder={ph||""} style={{...base,resize:"vertical",lineHeight:1.6,minHeight:44}} {...props}/>:<input ref={rf} type={type||"text"} placeholder={ph||""} style={{...base,minHeight:44,letterSpacing:mono?3:0}} {...props} onKeyDown={ok}/>}{note&&<div style={{color:K.t3,fontSize:11,marginTop:3,lineHeight:1.4}}>{note}</div>}</div>;}
function Pop({t,m}){const K=useK();if(!m)return null;const s={e:{bg:K.erBg,bd:K.erBd,col:K.er,ic:"⚠"},o:{bg:K.emBg,bd:K.emBd,col:K.em,ic:"✓"}}[t]||{};return <div style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:8,color:s.col,fontSize:13,padding:"9px 12px",marginBottom:11,display:"flex",gap:7,lineHeight:1.5,animation:"sc .2s ease"}}><span>{s.ic}</span><span>{m}</span></div>;}
function Sheet({title,onClose,children,w=460}){const K=useK();return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(5px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}><div style={{width:"100%",maxWidth:w,background:K.card,border:`1px solid ${K.b1}`,borderRadius:"16px 16px 0 0",padding:"16px 18px max(16px,env(safe-area-inset-bottom))",maxHeight:"92vh",overflowY:"auto",animation:"su .26s ease"}}><div style={{width:36,height:4,background:K.b1,borderRadius:99,margin:"0 auto 13px"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}><div style={{fontWeight:700,fontSize:15,color:K.t1}}>{title}</div><button onClick={onClose} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button></div>{children}</div></div>;}
function Donut({pct}){const K=useK();const[p,sP]=useState(0);useEffect(()=>{const t=setTimeout(()=>sP(pct),200);return()=>clearTimeout(t);},[pct]);const r=38,c=2*Math.PI*r;return <svg width={84} height={84} viewBox="0 0 84 84" style={{flexShrink:0}}><circle cx={42} cy={42} r={r} fill="none" stroke={K.c2} strokeWidth={7}/><circle cx={42} cy={42} r={r} fill="none" stroke={K.em} strokeWidth={7} strokeDasharray={`${c*p/100} ${c}`} strokeLinecap="round" transform="rotate(-90 42 42)" style={{transition:"stroke-dasharray .8s ease"}}/><text x={42} y={39} textAnchor="middle" fill={K.t1} style={{fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:700}}>{p}%</text><text x={42} y={51} textAnchor="middle" fill={K.t3} style={{fontFamily:"'Outfit',sans-serif",fontSize:9}}>global</text></svg>;}
function Player({url,titre,onClose,playlist,startIdx=0}){
  const K=useK();const{mob}=useW();
  const[idx,sIdx]=useState(startIdx);
  const[autoPlay,sAuto]=useState(true);
  const[showPlan,sShowPlan]=useState(!mob);
  const ifrRef=useRef(null);
  const list=playlist&&playlist.length>0?playlist:[{url,titre}];
  const cur=list[idx]||list[0];
  const v=pVid(cur.url);
  const hasPrev=idx>0;
  const hasNext=idx<list.length-1;
  const go=useCallback(i=>{if(i>=0&&i<list.length)sIdx(i);},[list.length]);
  // Auto-advance: listen for message from YouTube iframe
  useEffect(()=>{
    if(!autoPlay)return;
    const h=e=>{try{const d=JSON.parse(e.data);if(d.event==="onStateChange"&&d.info===0&&hasNext)setTimeout(()=>go(idx+1),1500);}catch{}};
    window.addEventListener("message",h);
    return()=>window.removeEventListener("message",h);
  },[autoPlay,hasNext,idx,go]);
  return <div style={{position:"fixed",inset:0,background:"#000",zIndex:1000,display:"flex",flexDirection:"column"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0,minHeight:50}}>
      <button onClick={onClose} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:20,cursor:"pointer",lineHeight:1,padding:"2px 6px",flexShrink:0}}>✕</button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:K.t1,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cur.titre||"Vidéo"}</div>
        {list.length>1&&<div style={{color:K.t3,fontSize:10,marginTop:1}}>{idx+1}/{list.length} · {list[idx]?.mat||""}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
        {list.length>1&&<button onClick={()=>sShowPlan(p=>!p)} className="bt" style={{background:showPlan?K.emBg:K.c2,border:`1px solid ${showPlan?K.emBd:K.b0}`,color:showPlan?K.em:K.t3,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:30}}>📋 Plan</button>}
        <button onClick={()=>sAuto(a=>!a)} className="bt" style={{background:autoPlay?K.emBg:K.c2,border:`1px solid ${autoPlay?K.emBd:K.b0}`,color:autoPlay?K.em:K.t3,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:30,display:list.length>1?"flex":"none",alignItems:"center",gap:4}}><i className="ti ti-player-skip-forward" style={{fontSize:12}}/>Auto</button>
      </div>
    </div>
    {/* Main content */}
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Video */}
      <div style={{flex:1,background:"#000",position:"relative",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,position:"relative"}}>
          {v?<iframe ref={ifrRef} key={cur.url} src={v.t==="yt"?`${v.src}&enablejsapi=1&autoplay=1`:v.src} title={cur.titre} style={{width:"100%",height:"100%",border:"none",position:"absolute",inset:0}} allow="autoplay;encrypted-media;picture-in-picture" allowFullScreen/>:<div style={{color:K.t3,textAlign:"center",padding:40,position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><div style={{fontSize:36,marginBottom:10}}>⚠️</div>URL non supportée.</div>}
        </div>
        {/* Nav controls */}
        {list.length>1&&<div style={{background:`${K.card}ee`,backdropFilter:"blur(8px)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexShrink:0,borderTop:`1px solid ${K.b0}`}}>
          <button onClick={()=>go(idx-1)} disabled={!hasPrev} className="bt" style={{background:hasPrev?K.c2:"transparent",border:`1px solid ${hasPrev?K.b1:K.b0}`,color:hasPrev?K.t1:K.t3,borderRadius:8,padding:"7px 13px",cursor:hasPrev?"pointer":"default",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,minHeight:36,opacity:hasPrev?1:.4}}>
            <i className="ti ti-chevron-left" style={{fontSize:14}}/>Précédent
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:3}}>
              {list.slice(Math.max(0,idx-2),idx+3).map((_,i)=>{const realI=Math.max(0,idx-2)+i;return <button key={realI} onClick={()=>go(realI)} className="bt" style={{width:realI===idx?22:8,height:8,borderRadius:99,background:realI===idx?K.em:K.b1,border:"none",padding:0,cursor:"pointer",transition:"all .2s"}}/>;})}
            </div>
            <div style={{color:K.t3,fontSize:10}}>{idx+1} / {list.length}</div>
          </div>
          <button onClick={()=>go(idx+1)} disabled={!hasNext} className="bt" style={{background:hasNext?K.emBg:"transparent",border:`1px solid ${hasNext?K.emBd:K.b0}`,color:hasNext?K.em:K.t3,borderRadius:8,padding:"7px 13px",cursor:hasNext?"pointer":"default",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,minHeight:36,opacity:hasNext?1:.4}}>
            Suivant<i className="ti ti-chevron-right" style={{fontSize:14}}/>
          </button>
        </div>}
      </div>
      {/* Plan sidebar */}
      {showPlan&&list.length>1&&<div style={{width:mob?"100%":260,background:K.card,borderLeft:`1px solid ${K.b0}`,overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
          <div style={{fontWeight:800,fontSize:13,color:K.t1,marginBottom:1}}>Plan du cours</div>
          <div style={{fontSize:11,color:K.t3}}>{list.length} vidéos</div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {list.map((v,i)=>{const pv=pVid(v.url);const isCur=i===idx;return <div key={i} onClick={()=>{go(i);if(mob)sShowPlan(false);}} className="bt" style={{padding:"10px 14px",borderBottom:`1px solid ${K.b0}`,cursor:"pointer",background:isCur?K.emBg:"transparent",borderLeft:isCur?`3px solid ${K.em}`:"3px solid transparent",display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:48,height:32,borderRadius:5,background:K.c2,flexShrink:0,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:null}
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><i className={isCur?"ti ti-player-play-filled":"ti ti-player-play"} style={{fontSize:11,color:isCur?K.em:"#fff"}}/></div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:isCur?700:500,color:isCur?K.em:K.t1,lineHeight:1.35,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{v.titre}</div>
              <div style={{fontSize:10,color:K.t3,marginTop:3}}>{i+1}/{list.length}</div>
            </div>
          </div>;})}
        </div>
      </div>}
    </div>
  </div>;
}

function StarRating({value,onChange,readonly=false,size=20}){
  const K=useK();
  const[hover,setHover]=useState(0);
  return <div style={{display:"flex",gap:3}}>
    {[1,2,3,4,5].map(i=><i key={i}
      className={`ti ti-star${(hover||value)>=i?"-filled":""}`}
      onMouseEnter={()=>!readonly&&setHover(i)}
      onMouseLeave={()=>!readonly&&setHover(0)}
      onClick={()=>!readonly&&onChange&&onChange(i)}
      style={{fontSize:size,color:(hover||value)>=i?"#F59E0B":K.b1,cursor:readonly?"default":"pointer",transition:"color .15s"}}
    />)}
  </div>;
}

function RatingPanel({modId,uid,K,mob}){
  const[myRating,setMyRating]=useState(0);
  const[myComment,setMyComment]=useState("");
  const[ratings,setRatings]=useState([]);
  const[saving,setSaving]=useState(false);
  const[submitted,setSubmitted]=useState(false);

  useEffect(()=>{
    if(!modId)return;
    // Load all ratings for this module
    const unsub=onSnapshot(collection(db,`modules/${modId}/ratings`),snap=>{
      const rs=snap.docs.map(d=>({id:d.id,...d.data()}));
      setRatings(rs);
      const mine=rs.find(r=>r.uid===uid);
      if(mine){setMyRating(mine.note||0);setMyComment(mine.comment||"");setSubmitted(true);}
    });
    return unsub;
  },[modId,uid]);

  const avgRating=ratings.length?Math.round(ratings.reduce((s,r)=>s+(r.note||0),0)/ratings.length*10)/10:0;

  const submitRating=async()=>{
    if(!myRating)return;
    setSaving(true);
    await setDoc(doc(db,`modules/${modId}/ratings`,uid),{
      uid,note:myRating,comment:myComment,date:new Date().toLocaleDateString("fr-FR")
    });
    setSubmitted(true);setSaving(false);
  };

  return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,padding:"14px",marginTop:8}}>
    {/* Moyenne globale */}
    {ratings.length>0&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${K.b0}`}}>
      <div style={{fontWeight:900,fontSize:28,color:"#F59E0B",lineHeight:1}}>{avgRating}</div>
      <div>
        <StarRating value={Math.round(avgRating)} readonly size={14}/>
        <div style={{fontSize:11,color:K.t3,marginTop:3}}>{ratings.length} avis</div>
      </div>
    </div>}
    {/* Ma notation */}
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:K.t1,marginBottom:8}}>{submitted?"Votre avis":"Notez ce cours"}</div>
      <StarRating value={myRating} onChange={submitted?null:setMyRating} readonly={submitted} size={24}/>
    </div>
    {!submitted&&<>
      <textarea value={myComment} onChange={e=>setMyComment(e.target.value)}
        placeholder="Commentaire optionnel..."
        style={{width:"100%",background:K.card,border:`1px solid ${K.b1}`,borderRadius:8,padding:"8px 10px",color:K.t1,fontSize:12,fontFamily:"'Outfit',sans-serif",resize:"vertical",minHeight:60,boxSizing:"border-box",marginBottom:8}}/>
      <button onClick={submitRating} disabled={saving||!myRating} className="bt"
        style={{width:"100%",padding:"10px",background:myRating?"linear-gradient(135deg,#D97706,#F59E0B)":"#333",border:"none",borderRadius:8,color:myRating?"#fff":K.t3,fontWeight:700,fontSize:13,cursor:myRating?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
        {saving?"Enregistrement...":"⭐ Soumettre mon avis"}
      </button>
    </>}
    {submitted&&<div style={{fontSize:12,color:K.em,display:"flex",alignItems:"center",gap:5,marginTop:6}}>
      <i className="ti ti-check" style={{fontSize:13}}/>Merci pour votre avis !
    </div>}
    {/* Derniers avis */}
    {ratings.filter(r=>r.comment).length>0&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${K.b0}`}}>
      <div style={{fontSize:11,fontWeight:700,color:K.t3,marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Avis récents</div>
      {ratings.filter(r=>r.comment).slice(0,3).map(r=><div key={r.id} style={{marginBottom:8,padding:"8px 10px",background:K.card,borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <StarRating value={r.note} readonly size={11}/>
          <span style={{fontSize:10,color:K.t3}}>{r.date}</span>
        </div>
        <div style={{fontSize:12,color:K.t2,lineHeight:1.5}}>{r.comment}</div>
      </div>)}
    </div>}
  </div>;
}

function PdfV({url,name,onClose,modId,uid,showRating=false}){
  const K=useK();const{mob}=useW();
  const[tab,setTab]=useState("pdf");
  // Désactiver le clic droit et le raccourci Ctrl+S sur le viewer
  const blockSave=e=>{if((e.ctrlKey||e.metaKey)&&(e.key==="s"||e.key==="p"))e.preventDefault();};
  useEffect(()=>{
    document.addEventListener("keydown",blockSave);
    return()=>document.removeEventListener("keydown",blockSave);
  },[]);
  const embedUrl=`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:1000,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 15px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <i className="ti ti-file-text" style={{fontSize:16,color:K.em}}/>
        <div>
          <div style={{color:K.t1,fontWeight:700,fontSize:13}}>{name}</div>
          <div style={{color:K.t3,fontSize:10,display:"flex",alignItems:"center",gap:4}}>
            <i className="ti ti-lock" style={{fontSize:9}}/>Lecture seule · Non téléchargeable
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {showRating&&uid&&<button onClick={()=>setTab(t=>t==="pdf"?"rating":"pdf")} className="bt"
          style={{background:tab==="rating"?"#F59E0B18":"rgba(255,255,255,.08)",border:`1px solid ${tab==="rating"?"#F59E0B30":"rgba(255,255,255,.15)"}`,borderRadius:7,padding:"5px 9px",color:tab==="rating"?"#F59E0B":"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
          <i className="ti ti-star" style={{fontSize:11}}/>Notes
        </button>}
        <Btn ch="✕" on={onClose} v="g" sm/>
      </div>
    </div>
    {tab==="pdf"
      ?<div style={{flex:1,position:"relative",overflow:"hidden"}} onContextMenu={e=>e.preventDefault()}>
        <iframe src={embedUrl} title={name}
          style={{width:"100%",height:"100%",border:"none"}}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          allow="fullscreen"/>
      </div>
      :<div style={{flex:1,overflowY:"auto",padding:mob?"14px":"20px 28px",maxWidth:560,margin:"0 auto",width:"100%"}}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4}}>{name}</div>
        <div style={{fontSize:12,color:K.t3,marginBottom:12}}>Donnez votre avis sur ce cours</div>
        <RatingPanel modId={modId} uid={uid} K={K} mob={mob}/>
      </div>
    }
  </div>;
}

// ── POLITIQUE DE CONFIDENTIALITÉ ─────────────────────────────────────────────
const PRIVACY_VERSION="1.0";
function PrivacyModal({onClose}){
  const K=useK();const{mob}=useW();
  const sections=[
    {ico:"ti-user",title:"Données collectées",body:"Nous collectons votre nom, adresse email, progression dans les modules, scores aux QCM et date d'inscription. Ces données sont nécessaires au fonctionnement de la plateforme."},
    {ico:"ti-shield-lock",title:"Utilisation des données",body:"Vos données sont utilisées exclusivement pour : gérer votre accès à la formation, suivre votre progression, vous envoyer votre code d'activation, et améliorer le contenu pédagogique."},
    {ico:"ti-share",title:"Partage des données",body:"Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Elles sont stockées de manière sécurisée sur Firebase (Google Cloud), conforme au RGPD."},
    {ico:"ti-clock",title:"Durée de conservation",body:"Vos données sont conservées pendant la durée de votre abonnement et 12 mois après expiration. Vous pouvez demander la suppression de votre compte à tout moment."},
    {ico:"ti-adjustments",title:"Vos droits",body:"Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour toute demande : contact@accessplusconsulting.com"},
    {ico:"ti-brand-google",title:"Connexion sociale",body:"Si vous utilisez la connexion Google ou Facebook, nous récupérons uniquement votre nom et email publics. Aucun autre accès à vos comptes n'est effectué."},
    {ico:"ti-cookie",title:"Cookies",body:"Nous utilisons uniquement un cookie de session Firebase pour maintenir votre connexion et un cookie de préférence de thème (stocké localement). Aucun cookie publicitaire."},
    {ico:"ti-mail",title:"Contact",body:"Éco-Campus RDC · contact@accessplusconsulting.com · Pour toute question relative à vos données personnelles."},
  ];
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)",zIndex:1200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:mob?"0":"20px 16px"}}>
    <div style={{width:"100%",maxWidth:560,background:K.card,border:`1px solid ${K.b1}`,borderRadius:mob?"18px 18px 0 0":"18px",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"su .25s ease",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${K.b0}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:34,height:34,borderRadius:10,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-shield-check" style={{fontSize:17,color:K.in_}}/></div>
          <div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Politique de confidentialité</div><div style={{fontSize:10,color:K.t3}}>Éco-Campus RDC · v{PRIVACY_VERSION}</div></div>
        </div>
        <button onClick={onClose} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:7,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button>
      </div>
      {/* Body scrollable */}
      <div style={{overflowY:"auto",padding:"14px 18px",flex:1}}>
        <div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:12,color:K.t2,lineHeight:1.6}}>
          <i className="ti ti-info-circle" style={{fontSize:13,color:K.em,verticalAlign:"middle",marginRight:5}}/>
          En créant un compte sur Éco-Campus RDC, vous acceptez que vos données soient traitées conformément à la présente politique.
        </div>
        {sections.map((s,i)=><div key={i} style={{marginBottom:13,display:"flex",gap:11,alignItems:"flex-start"}}>
          <div style={{width:30,height:30,borderRadius:8,background:K.c2,border:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
            <i className={`ti ${s.ico}`} style={{fontSize:14,color:K.in_}}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:3}}>{s.title}</div>
            <div style={{fontSize:12,color:K.t2,lineHeight:1.65}}>{s.body}</div>
          </div>
        </div>)}
        <div style={{marginTop:6,padding:"9px 12px",background:K.c2,borderRadius:8,fontSize:10,color:K.t3,textAlign:"center"}}>
          Dernière mise à jour : mai 2026 · Version {PRIVACY_VERSION}
        </div>
      </div>
      {/* Footer */}
      <div style={{padding:"12px 18px",borderTop:`1px solid ${K.b0}`,flexShrink:0}}>
        <button onClick={onClose} className="bt" style={{width:"100%",padding:"11px",background:`linear-gradient(135deg,${ACC.emD},${ACC.em})`,border:"none",borderRadius:9,color:"#F5EDD8",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:42}}>
          J'ai compris ✓
        </button>
      </div>
    </div>
  </div>;
}

// ── SÉLECTEUR THÈME ───────────────────────────────────────────────────────────
function PresViewer({url,titre,desc,onClose}){
  const K=useK();const{mob}=useW();
  // Detect Google Slides / Canva / generic embed
  const getEmbedUrl=u=>{
    if(!u)return null;
    // Google Slides: convert /pub to /embed or extract embed src
    let m=u.match(/docs\.google\.com\/presentation\/d\/([^/]+)/);
    if(m)return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=3000`;
    // Canva embed
    if(u.includes('canva.com'))return u;
    // Generic iframe src
    if(u.startsWith('http'))return u;
    return null;
  };
  const embedUrl=getEmbedUrl(url);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:1000,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 15px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:32,height:32,borderRadius:8,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-presentation" style={{fontSize:16,color:K.in_}}/></div>
        <div><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{titre}</div>{desc&&<div style={{color:K.t3,fontSize:10,marginTop:1}}>{desc}</div>}</div>
      </div>
      <Btn ch="✕" on={onClose} v="g" sm/>
    </div>
    <div style={{flex:1,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {embedUrl
        ?<iframe src={embedUrl} title={titre} style={{width:"100%",height:"100%",border:"none"}} allowFullScreen/>
        :<div style={{textAlign:"center",color:K.t3,padding:40}}><div style={{fontSize:40,marginBottom:10}}>⚠️</div><div>URL non supportée.</div><div style={{fontSize:12,marginTop:5}}>Utilisez un lien Google Slides ou Canva.</div></div>
      }
    </div>
    <div style={{background:K.card,borderTop:`1px solid ${K.b0}`,padding:"8px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{fontSize:11,color:K.t3}}>💡 Utilisez les flèches du clavier pour naviguer dans la présentation</div>
      <a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:K.in_,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><i className="ti ti-external-link" style={{fontSize:12}}/>Ouvrir dans un nouvel onglet</a>
    </div>
  </div>;
}

function ThemePicker({open,onClose}){
  const K=useK();const{tid,setT}=useContext(Ctx);
  if(!open)return null;
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1001}}>
    <div style={{width:"100%",maxWidth:500,background:K.card,border:`1px solid ${K.b1}`,borderRadius:"16px 16px 0 0",padding:"16px 18px max(16px,env(safe-area-inset-bottom))",animation:"su .25s ease"}}>
      <div style={{width:36,height:4,background:K.b1,borderRadius:99,margin:"0 auto 14px"}}/>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:3}}>🎨 Apparence</div>
      <div style={{color:K.t3,fontSize:12,marginBottom:16}}>Choisissez votre thème d'affichage.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:16}}>
        {Object.entries(TH).map(([id,t])=>{const sel=tid===id;return <button key={id} onClick={()=>{setT(id);}} className="bt" style={{background:t.bg,border:`2px solid ${sel?ACC.em:t.b0}`,borderRadius:12,padding:"13px 8px 11px",cursor:"pointer",textAlign:"center",position:"relative",minHeight:76}}>{sel&&<span style={{position:"absolute",top:4,right:6,fontSize:10,color:ACC.em,fontWeight:800}}>✓</span>}<div style={{fontSize:20,marginBottom:4}}>{t.i}</div><div style={{fontSize:11,fontWeight:700,color:t.t1,lineHeight:1,marginBottom:6}}>{t.n}</div><div style={{display:"flex",justifyContent:"center",gap:3}}>{[t.bg,t.ca,t.c2].map((c,i)=><span key={i} style={{width:8,height:8,borderRadius:"50%",background:c,border:`1px solid ${t.b1}`,display:"inline-block"}}/>)}</div></button>;})}
      </div>
      <button onClick={onClose} className="bt" style={{width:"100%",padding:"11px",background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:42}}>Fermer</button>
    </div>
  </div>;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
// ── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({onLogin}){
  const K=useK();const{mob}=useW();
  const[scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>40);
    window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);
  },[]);

  const stats=[
    {val:"10+",label:"Modules SYSCOHADA",ico:"book-2"},
    {val:"100%",label:"En ligne, partout",ico:"wifi"},
    {val:"3",label:"Types de profils",ico:"users"},
    {val:"24h",label:"Accès après paiement",ico:"bolt"},
  ];
  const publics=[
    {ico:"building-store",label:"Entrepreneurs",desc:"Services et accompagnement pour structurer votre activité"},
    {ico:"user-search",label:"Chercheurs d'emploi",desc:"Renforcez vos compétences pour vous démarquer"},
    {ico:"school",label:"Étudiants",desc:"Tous niveaux, toutes filières"},
    {ico:"briefcase",label:"Professionnels",desc:"Quel que soit votre secteur d'activité"},
  ];
  const features=[
    {ico:"book-2",     col:"#22C55E",label:"Modules structurés",  desc:"Des modules organisés par thème, du fondamental à l'avancé."},
    {ico:"help-circle",col:"#3B82F6",label:"QCM interactifs",     desc:"Évaluez vos connaissances avec des quiz corrigés et des scores détaillés."},
    {ico:"file-text",  col:"#F59E0B",label:"PDF d'exercices",     desc:"Téléchargez les supports de cours et exercices pratiques par module."},
    {ico:"presentation",col:"#8B5CF6",label:"Présentations",      desc:"Slides professionnelles téléchargeables pour chaque thème de formation."},
    {ico:"video",      col:"#EF4444",label:"Vidéos & Direct",     desc:"Replays de cours et sessions live avec votre formateur en temps réel."},
    {ico:"briefcase",  col:"#06B6D4",label:"Stages virtuels",     desc:"Accédez aux meilleures plateformes de stages et d'expériences pratiques."},
  ];

  return <div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif",overflowX:"hidden"}}>

    {/* ── NAVBAR ── */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,transition:"all .3s ease",
      background:scrolled?`${K.card}f0`:"transparent",
      backdropFilter:scrolled?"blur(20px)":"none",
      borderBottom:scrolled?`1px solid ${K.b0}`:"none",
      padding:mob?"10px 16px":"12px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/><path d="M10 2L18 11L10 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:K.t1,lineHeight:1,fontFamily:"'Fraunces',serif"}}>Éco-Campus</div>
          <div style={{fontSize:9,color:K.t3,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>RDC</div>
        </div>
      </div>
      <button onClick={onLogin} className="bt" style={{
        background:`linear-gradient(135deg,#16A34A,#22C55E)`,border:"none",
        borderRadius:9,padding:mob?"8px 16px":"9px 22px",
        color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",
        fontFamily:"'Outfit',sans-serif",boxShadow:"0 4px 14px rgba(34,197,94,.35)"}}>
        Se connecter →
      </button>
    </nav>

    {/* ── HERO ── */}
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:mob?"100px 20px 60px":"120px 32px 80px",
      position:"relative",textAlign:"center",overflow:"hidden"}}>

      {/* Background decorations */}
      <div style={{position:"absolute",top:"10%",left:"5%",width:300,height:300,borderRadius:"50%",
        background:`radial-gradient(circle,#22C55E18,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"5%",width:250,height:250,borderRadius:"50%",
        background:`radial-gradient(circle,#3B82F618,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"40%",right:"15%",width:120,height:120,borderRadius:"50%",
        background:`radial-gradient(circle,#F59E0B12,transparent 70%)`,pointerEvents:"none"}}/>

      {/* Badge */}
      <div style={{display:"inline-flex",alignItems:"center",gap:7,background:K.emBg,
        border:`1px solid ${K.emBd}`,borderRadius:99,padding:"6px 16px",marginBottom:28,animation:"up .5s ease"}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:"#22C55E",display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/>
        <span style={{fontSize:12,fontWeight:700,color:"#22C55E",letterSpacing:.4}}>🇨🇩 Services et formations en RDC</span>
      </div>

      {/* Logo hero */}
      <div style={{marginBottom:20,animation:"up .5s ease .05s both",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        <svg width={mob?32:42} height={mob?32:42} viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/><path d="M10 2L18 11L10 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div style={{textAlign:"left"}}>
          <div style={{fontWeight:900,fontSize:mob?24:32,color:K.t1,lineHeight:1,fontFamily:"'Fraunces',serif"}}>Éco-Campus</div>
          <div style={{fontSize:mob?10:12,color:K.t3,letterSpacing:"3px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>RDC</div>
        </div>
      </div>

      {/* Titre */}
      <h1 style={{margin:"0 0 16px",fontSize:mob?"1.9rem":"3.4rem",fontWeight:900,lineHeight:1.1,
        color:K.t1,letterSpacing:"-1px",maxWidth:720,animation:"up .6s ease .1s both"}}>
        La plateforme de{" "}
        <span style={{background:"linear-gradient(135deg,#16A34A,#22C55E,#4ADE80)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          services et formations
        </span>
        {" "}en République démocratique du Congo
      </h1>

      {/* Sous-titre */}
      <p style={{margin:"0 0 12px",fontSize:mob?14:17,color:K.t2,lineHeight:1.7,
        maxWidth:580,animation:"up .6s ease .2s both"}}>
        Une référence pour <strong style={{color:K.t1}}>entrepreneurs</strong>, <strong style={{color:K.t1}}>chercheurs d'emploi</strong> et <strong style={{color:K.t1}}>étudiants</strong> :
        modules structurés, accompagnement professionnel, tests d'auto-évaluation et sessions en direct avec nos experts.
      </p>

      {/* Preuves sociales */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32,flexWrap:"wrap",justifyContent:"center",animation:"up .6s ease .25s both"}}>
        {[["🎓","Certifiante"],["📱","100% en ligne"],["🇨🇩","Pensée pour la RDC"]].map(([e,l])=>
          <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:K.t2,fontWeight:600}}>
            <span>{e}</span><span>{l}</span>
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",
        animation:"up .6s ease .3s both",marginBottom:56}}>
        <button onClick={onLogin} className="bt" style={{
          background:`linear-gradient(135deg,#16A34A,#22C55E)`,border:"none",
          borderRadius:12,padding:"14px 28px",color:"#fff",fontWeight:800,
          fontSize:15,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
          boxShadow:"0 8px 24px rgba(34,197,94,.4)",minHeight:50}}>
          Commencer maintenant →
        </button>
        <button onClick={onLogin} className="bt" style={{
          background:"transparent",border:`1.5px solid ${K.b1}`,
          borderRadius:12,padding:"14px 24px",color:K.t2,fontWeight:700,
          fontSize:15,cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:50}}>
          Se connecter
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",
        gap:12,maxWidth:640,width:"100%",animation:"up .6s ease .4s both"}}>
        {stats.map(({val,label,ico})=><div key={label} style={{
          background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,
          padding:"16px 12px",textAlign:"center"}}>
          <i className={`ti ti-${ico}`} style={{fontSize:20,color:"#22C55E",display:"block",marginBottom:6}}/>
          <div style={{fontWeight:900,fontSize:mob?20:24,color:K.t1,lineHeight:1}}>{val}</div>
          <div style={{fontSize:11,color:K.t3,marginTop:4,lineHeight:1.3}}>{label}</div>
        </div>)}
      </div>
    </div>

    {/* ── POUR QUI ── */}
    <div style={{padding:mob?"48px 20px":"64px 32px",maxWidth:900,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:12,fontWeight:700,color:"#22C55E",letterSpacing:2,
          textTransform:"uppercase",marginBottom:10}}>Audience</div>
        <h2 style={{margin:0,fontSize:mob?"1.6rem":"2.2rem",fontWeight:900,color:K.t1}}>
          Conçu pour vous, où que vous soyez
        </h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:14}}>
        {publics.map(({ico,label,desc},i)=><div key={label} style={{
          background:K.card,border:`1px solid ${K.b0}`,borderRadius:16,
          padding:"20px",display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
            background:["#22C55E18","#3B82F618","#F59E0B18","#8B5CF618"][i],
            border:`1px solid ${["#22C55E30","#3B82F630","#F59E0B30","#8B5CF630"][i]}`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className={`ti ti-${ico}`} style={{fontSize:20,color:["#22C55E","#3B82F6","#F59E0B","#8B5CF6"][i]}}/>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:5}}>{label}</div>
            <div style={{fontSize:13,color:K.t2,lineHeight:1.55}}>{desc}</div>
          </div>
        </div>)}
      </div>
    </div>

    {/* ── FONCTIONNALITÉS ── */}
    <div style={{padding:mob?"48px 20px":"64px 32px",
      background:K.card,borderTop:`1px solid ${K.b0}`,borderBottom:`1px solid ${K.b0}`}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:12,fontWeight:700,color:"#22C55E",letterSpacing:2,
            textTransform:"uppercase",marginBottom:10}}>Fonctionnalités</div>
          <h2 style={{margin:0,fontSize:mob?"1.6rem":"2.2rem",fontWeight:900,color:K.t1}}>
            Tout ce dont vous avez besoin
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14}}>
          {features.map(({ico,col,label,desc})=><div key={label} style={{
            background:K.bg,border:`1px solid ${K.b0}`,borderRadius:16,padding:"20px",
            transition:"transform .2s ease,box-shadow .2s ease"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 32px ${col}20`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{width:42,height:42,borderRadius:12,
              background:`${col}18`,border:`1px solid ${col}30`,
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
              <i className={`ti ti-${ico}`} style={{fontSize:20,color:col}}/>
            </div>
            <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:6}}>{label}</div>
            <div style={{fontSize:12,color:K.t2,lineHeight:1.6}}>{desc}</div>
          </div>)}
        </div>
      </div>
    </div>

    {/* ── CTA FINAL ── */}
    <div style={{padding:mob?"56px 20px":"80px 32px",textAlign:"center"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{margin:"0 auto 20px",display:"flex",justifyContent:"center",alignItems:"center",gap:10}}>
          <svg width="30" height="30" viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/><path d="M10 2L18 11L10 20" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{textAlign:"left"}}>
            <div style={{fontWeight:900,fontSize:22,color:K.t1,lineHeight:1,fontFamily:"'Fraunces',serif"}}>Éco-Campus</div>
            <div style={{fontSize:9,color:K.t3,letterSpacing:"2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>RDC</div>
          </div>
        </div>
        <h2 style={{margin:"0 0 14px",fontSize:mob?"1.8rem":"2.4rem",
          fontWeight:900,color:K.t1,lineHeight:1.2}}>
          Prêt à maîtriser SYSCOHADA ?
        </h2>
        <p style={{margin:"0 0 32px",fontSize:14,color:K.t2,lineHeight:1.7}}>
          Rejoignez les apprenants Éco-Campus RDC et transformez votre maîtrise de la comptabilité OHADA.
        </p>
        <button onClick={onLogin} className="bt" style={{
          background:`linear-gradient(135deg,#16A34A,#22C55E)`,border:"none",
          borderRadius:13,padding:"16px 36px",color:"#fff",fontWeight:900,
          fontSize:16,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
          boxShadow:"0 8px 28px rgba(34,197,94,.4)",minHeight:54,
          display:"inline-flex",alignItems:"center",gap:10}}>
          <i className="ti ti-arrow-right" style={{fontSize:18}}/>
          Créer mon compte gratuitement
        </button>
        <div style={{marginTop:16,fontSize:12,color:K.t3}}>
          Déjà inscrit ?{" "}
          <button onClick={onLogin} className="bt" style={{background:"none",border:"none",
            color:"#22C55E",fontWeight:700,fontSize:12,cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",padding:0}}>
            Se connecter →
          </button>
        </div>
      </div>
    </div>

    {/* ── FOOTER ── */}
    <div style={{borderTop:`1px solid ${K.b0}`,padding:"20px 32px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      flexWrap:"wrap",gap:10}}>
      <div style={{fontSize:12,color:K.t3}}>© 2026 Éco-Campus RDC · Tous droits réservés</div>
      <div style={{fontSize:12,color:K.t3,display:"flex",gap:16}}>
        <span>contact@accessplusconsulting.com</span>
      </div>
    </div>

  </div>;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({u,onDone,mods}){
  const K=useK();const{mob}=useW();
  const[step,setStep]=useState(0);
  const steps=[
    {ico:"rocket",col:"#22C55E",title:`Bienvenue, ${(u.nom||"").split(" ")[0]} ! 🎉`,
     desc:"Votre espace de formation est prêt. Découvrons ensemble comment en tirer le meilleur."},
    {ico:"book-2",col:"#3B82F6",title:"10 modules structurés",
     desc:"Du fondamental à l'avancé — chaque module contient des leçons, QCM et exercices pratiques alignés sur le plan comptable OHADA."},
    {ico:"chart-line",col:"#8B5CF6",title:"Suivez votre progression",
     desc:"Votre tableau de bord affiche vos scores, votre progression globale et vos badges de réussite en temps réel."},
    {ico:"trophy",col:"#F59E0B",title:"Obtenez des badges",
     desc:"Complétez des modules, atteignez 80%+ aux QCM et débloquez des badges de niveau. Chaque effort est récompensé."},
  ];
  const cur=steps[step];
  const isLast=step===steps.length-1;
  const firstMod=mods[0];

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",
    zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{width:"100%",maxWidth:440,background:K.card,border:`1px solid ${K.b1}`,
      borderRadius:20,overflow:"hidden",animation:"popIn .35s cubic-bezier(.22,1,.36,1)"}}>

      {/* Progress bar */}
      <div style={{height:3,background:K.b0}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${K.emD},${K.em})`,
          width:`${((step+1)/steps.length)*100}%`,transition:"width .4s ease",borderRadius:99}}/>
      </div>

      {/* Content */}
      <div style={{padding:mob?"28px 24px":"32px 28px",textAlign:"center"}}>
        {/* Icon */}
        <div style={{width:72,height:72,borderRadius:20,margin:"0 auto 20px",
          background:`${cur.col}18`,border:`1px solid ${cur.col}30`,
          display:"flex",alignItems:"center",justifyContent:"center",
          animation:"popIn .4s cubic-bezier(.22,1,.36,1) .1s both"}}>
          <i className={`ti ti-${cur.ico}`} style={{fontSize:32,color:cur.col}}/>
        </div>

        <h2 style={{margin:"0 0 12px",fontSize:mob?20:22,fontWeight:900,
          color:K.t1,lineHeight:1.2,animation:"slideUp .35s ease .15s both"}}>
          {cur.title}
        </h2>
        <p style={{margin:"0 0 28px",fontSize:14,color:K.t2,lineHeight:1.7,
          animation:"slideUp .35s ease .2s both"}}>
          {cur.desc}
        </p>

        {/* Dots */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
          {steps.map((_,i)=><div key={i} onClick={()=>setStep(i)}
            style={{width:i===step?20:6,height:6,borderRadius:99,cursor:"pointer",
              background:i===step?K.em:K.b1,transition:"all .3s ease"}}/>)}
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:10,flexDirection:"column"}}>
          <button onClick={()=>isLast?onDone(firstMod):setStep(s=>s+1)}
            className="bt" style={{width:"100%",padding:"13px",
              background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",
              borderRadius:12,color:"#F5EDD8",fontWeight:800,fontSize:14,
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:46,
              boxShadow:`0 6px 20px ${K.em}35`}}>
            {isLast?`Commencer ${firstMod?`"${firstMod.titre}"`:""} →`:"Suivant →"}
          </button>
          {!isLast&&<button onClick={onDone} className="bt"
            style={{background:"none",border:"none",color:K.t3,fontSize:13,
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:"6px"}}>
            Passer l'introduction
          </button>}
        </div>
      </div>
    </div>
  </div>;
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ico,title,desc,action,actionLabel}){
  const K=useK();
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",
    justifyContent:"center",padding:"48px 24px",textAlign:"center",
    animation:"fadeIn .4s ease"}}>
    <div style={{width:72,height:72,borderRadius:20,background:K.c2,
      border:`1px solid ${K.b0}`,display:"flex",alignItems:"center",
      justifyContent:"center",marginBottom:16,
      animation:"popIn .4s cubic-bezier(.22,1,.36,1)"}}>
      <i className={`ti ti-${ico}`} style={{fontSize:30,color:K.t3}}/>
    </div>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:8}}>{title}</div>
    <div style={{fontSize:13,color:K.t2,lineHeight:1.6,maxWidth:280,marginBottom:action?20:0}}>{desc}</div>
    {action&&<button onClick={action} className="bt" style={{
      background:`linear-gradient(135deg,${K.emD},K.em)`,
      border:`1px solid ${K.emBd}`,borderRadius:9,padding:"9px 20px",
      color:K.em,fontWeight:700,fontSize:13,cursor:"pointer",
      fontFamily:"'Outfit',sans-serif"}}>
      {actionLabel}
    </button>}
  </div>;
}

// ── BADGES SYSTÈME ────────────────────────────────────────────────────────────
const BADGES=[
  {id:"first",ico:"rocket",label:"Premier pas",desc:"Premier module complété",col:"#22C55E",check:(nd)=>nd>=1},
  {id:"three",ico:"flame",label:"En feu !",desc:"3 modules complétés",col:"#F59E0B",check:(nd)=>nd>=3},
  {id:"half",ico:"star",label:"Mi-parcours",desc:"5 modules complétés",col:"#8B5CF6",check:(nd)=>nd>=5},
  {id:"master",ico:"crown",label:"Maître OHADA",desc:"Tous les modules complétés",col:"#EF4444",check:(nd,total)=>nd>=total&&total>0},
  {id:"ace",ico:"trophy",label:"As du QCM",desc:"Score ≥ 80% sur un module",col:"#3B82F6",check:(_,__,sc)=>Object.values(sc||{}).some(s=>s?.pct>=80)},
  {id:"perfect",ico:"circle-check",label:"Perfectionniste",desc:"Score 100% sur un module",col:"#06B6D4",check:(_,__,sc)=>Object.values(sc||{}).some(s=>s?.pct===100)},
];

function BadgesPanel({nd,total,sc}){
  const K=useK();
  const unlocked=BADGES.filter(b=>b.check(nd,total,sc));
  const locked=BADGES.filter(b=>!b.check(nd,total,sc));
  return <div style={{marginTop:20}}>
    <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
      <i className="ti ti-trophy" style={{fontSize:15,color:"#F59E0B"}}/>
      Badges <span style={{fontSize:12,fontWeight:400,color:K.t3,marginLeft:4}}>{unlocked.length}/{BADGES.length} débloqués</span>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {[...unlocked,...locked].map(b=>{
        const earned=b.check(nd,total,sc);
        return <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,
          background:earned?`${b.col}14`:K.c2,border:`1px solid ${earned?b.col+"33":K.b0}`,
          borderRadius:10,padding:"8px 12px",opacity:earned?1:.5,
          transition:"all .2s ease",animation:earned?"popIn .35s ease both":"none"}}>
          <div style={{width:30,height:30,borderRadius:8,background:earned?`${b.col}20`:K.b0,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className={`ti ti-${b.ico}`} style={{fontSize:15,color:earned?b.col:K.t3}}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:earned?K.t1:K.t3,lineHeight:1}}>{b.label}</div>
            <div style={{fontSize:10,color:K.t3,marginTop:2}}>{b.desc}</div>
          </div>
          {earned&&<i className="ti ti-check" style={{fontSize:12,color:b.col,marginLeft:2}}/>}
        </div>;
      })}
    </div>
  </div>;
}

function ProgressRing({pct,size=80,stroke=7,col}){
  const K=useK();
  const r=( size-stroke*2)/2,circ=2*Math.PI*r;
  const offset=circ-(pct/100)*circ;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={K.b0} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col||K.em} strokeWidth={stroke}
      strokeDasharray={circ} strokeDashoffset={offset}
      strokeLinecap="round" style={{transition:"stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)"}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
      fill={K.t1} fontSize={size*0.22} fontWeight="800" fontFamily="Outfit,sans-serif"
      style={{transform:"rotate(90deg)",transformOrigin:"50% 50%"}}>{pct}%</text>
  </svg>;
}

// ── FORMATEUR APP ─────────────────────────────────────────────────────────────
function FA({uid,onOut}){
  const K=useK();const{mob}=useW();
  const[vue,sV]=useState("home");
  const[fData,sFD]=useState(null);
  const[saving,sSav]=useState(false);
  const[msg,sMsg]=useState({t:"",m:""});
  const{mods}=useModules();
  const{vids}=useVideos();
  const allPres=usePresentations();
  const allUsers=useUsers();
  // Load formateur data
  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"users",uid),(snap)=>{if(snap.exists())sFD({uid,...snap.data()});});
    return unsub;
  },[uid]);

  const{warning:faWarn}=useAutoLogout(onOut);
  const myOpenAnswersFA=useFormateurOpenAnswers(uid);
  const myMsgsFA=useFormateurMessages(uid);
  const unreadMsgFA=myMsgsFA.filter(m=>m.fromRole==="apprenant"&&!m.luAdmin).length;

  if(!fData)return <div style={{minHeight:"100vh",background:K.bg}}><style>{mCss(K)}</style><Spin/></div>;

  // Stats sur les modules créés par ce formateur
  const myMods=mods.filter(m=>m.createdBy===uid);
  const myVids=vids.filter(v=>v.createdBy===uid);
  const myPres=allPres.filter(p=>p.createdBy===uid);
  const myModIds=new Set(myMods.map(m=>m.id));
  // Apprenants ayant fait au moins 1 module du formateur
  const myLearners=allUsers.filter(u=>u.progress&&myModIds.size>0&&[...myModIds].some(id=>u.progress[id]));
  const avgScore=myMods.length>0?Math.round(allUsers.reduce((sum,u)=>{
    const scores=myMods.map(m=>u.scores?.[m.id]?.pct||0).filter(p=>p>0);
    return sum+(scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0);
  },0)/(allUsers.filter(u=>myMods.some(m=>u.scores?.[m.id])).length||1)):0;

  const toast=(t,m)=>{sMsg({t,m});setTimeout(()=>sMsg({t:"",m:""}),3000);};

  // Générer un code de publication
  const submitContent=async(type,id)=>{
    sSav(true);
    const coll=type==="mod"?"modules":type==="pres"?"presentations":"videos";
    await updateDoc(doc(db,coll,id),{status:"pending",submittedBy:uid,submittedAt:new Date().toISOString()});
    toast("o","Soumis pour validation !");sSav(false);
  };

  const nUngraded=myOpenAnswersFA.filter(a=>!a.graded).length;
  const NAV=[
    {k:"home",ico:"home-2",label:"Tableau de bord"},
    {k:"mods",ico:"book-2",label:"Mes modules"},
    {k:"vids",ico:"video",label:"Mes vidéos"},
    {k:"pres",ico:"presentation",label:"Mes slides"},
    {k:"docs",ico:"files",label:"Documents"},
    {k:"corr",ico:"checkbox",label:"Corrections",badge:nUngraded},
    {k:"fmsg",ico:"message-circle",label:"Messages",badge:unreadMsgFA},
    {k:"stats",ico:"chart-bar",label:"Statistiques"},
  ];

  const W=ch=><div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}>
    <style>{mCss(K)}</style>
    <AutoLogoutBanner warning={faWarn} mob={mob}/>
    {/* Navbar formateur */}
    <nav className="nb" style={{background:`${K.card}f2`,backdropFilter:"blur(18px)",borderBottom:`1px solid ${K.b0}`,position:"sticky",top:0,zIndex:99}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",rowGap:6,minHeight:50,padding:"8px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Logo sm={mob}/>
          <div style={{width:1,height:16,background:K.b0}}/>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"#8B5CF618",border:"1px solid #8B5CF630",borderRadius:99,padding:"2px 10px"}}>
            <i className="ti ti-school" style={{fontSize:11,color:"#8B5CF6"}}/>
            <span style={{fontSize:10,fontWeight:800,color:"#8B5CF6",letterSpacing:.4}}>FORMATEUR</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:K.t2,fontWeight:600}}>{(fData.nom||"").split(" ")[0]}</span>
          <button onClick={onOut} className="bt" style={{display:"flex",alignItems:"center",gap:5,background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:7,padding:"4px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
            <i className="ti ti-logout" style={{fontSize:12}}/>
            {!mob&&"Quitter"}
          </button>
        </div>
      </div>
      {/* Sous-nav */}
      <div className="tn" style={{borderTop:`1px solid ${K.b0}`,gap:1,paddingBottom:2}}>
        {NAV.map(({k,ico,label,badge})=>{
          const active=vue===k;
          return <button key={k} onClick={()=>sV(k)} className="bt"
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"none",cursor:"pointer",
              background:active?K.c2:"transparent",color:active?K.t1:K.t3,
              fontWeight:active?700:500,fontSize:12,whiteSpace:"nowrap",
              fontFamily:"'Outfit',sans-serif",borderBottom:active?`2px solid #8B5CF6`:"2px solid transparent",
              borderRadius:"6px 6px 0 0",minHeight:34}}>
            <i className={`ti ti-${ico}`} style={{fontSize:13,color:active?"#8B5CF6":K.t3}}/>
            {label}
            {!!badge&&<span style={{background:"#EF4444",color:"#fff",borderRadius:99,fontSize:9,fontWeight:800,padding:"1px 6px",marginLeft:2}}>{badge}</span>}
          </button>;
        })}
      </div>
    </nav>
    <main style={{maxWidth:960,margin:"0 auto",padding:mob?"16px 14px 80px":"20px 24px"}}>
      {msg.m&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,borderRadius:9,padding:"9px 14px",marginBottom:12,fontSize:13,color:msg.t==="o"?K.em:K.er,display:"flex",gap:7}}><i className={`ti ti-${msg.t==="o"?"check":"alert-triangle"}`} style={{fontSize:14}}/>{msg.m}</div>}
      {ch}
    </main>
  </div>;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if(vue==="home")return W(<div style={{animation:"fadeIn .35s ease"}}>
    {/* Bannière bienvenue */}
    <div style={{background:`linear-gradient(135deg,#8B5CF618,#6D28D918)`,border:`1px solid #8B5CF630`,borderRadius:16,padding:"20px 22px",marginBottom:16}}>
      <div style={{fontSize:12,color:"#8B5CF6",fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
        <i className="ti ti-school" style={{fontSize:13}}/>Espace Formateur
      </div>
      <div style={{fontSize:mob?18:22,fontWeight:900,color:K.t1,marginBottom:4}}>Bonjour, {(fData.nom||"").split(" ")[0]} 👋</div>
      <div style={{fontSize:13,color:K.t2,marginBottom:16}}>Créez du contenu de qualité pour vos apprenants SYSCOHADA.</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[
          [`${myMods.length}`,"Modules créés","#8B5CF6"],
          [`${myVids.length}`,"Vidéos","#3B82F6"],
          [`${myLearners.length}`,"Apprenants","#22C55E"],
          [`${avgScore}%`,"Score moyen","#F59E0B"],
        ].map(([v,l,c])=><div key={l} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:10,padding:"10px 14px"}}>
          <div style={{fontWeight:900,fontSize:18,color:c,lineHeight:1}}>{v}</div>
          <div style={{fontSize:11,color:K.t3,marginTop:3}}>{l}</div>
        </div>)}
      </div>
    </div>

    {/* Actions rapides */}
    <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:12}}>Actions rapides</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:12,marginBottom:20}}>
      {[
        {ico:"book-plus",col:"#8B5CF6",bg:"#8B5CF618",bd:"#8B5CF630",label:"Créer un module",desc:"Nouveau module avec QCM et contenu",action:()=>sV("mods")},
        {ico:"video-plus",col:"#3B82F6",bg:"#3B82F618",bd:"#3B82F630",label:"Ajouter une vidéo",desc:"Lien YouTube ou URL de la vidéo",action:()=>sV("vids")},
        {ico:"chart-bar",col:"#22C55E",bg:"#22C55E18",bd:"#22C55E30",label:"Voir les stats",desc:"Progression et scores de vos apprenants",action:()=>sV("stats")},
        {ico:"clock",col:"#F59E0B",bg:"#F59E0B18",bd:"#F59E0B30",label:"En attente",desc:`${myMods.filter(m=>m.status==="pending").length} module(s) en validation`,action:()=>sV("mods")},
      ].map(({ico,col,bg,bd,label,desc,action})=><div key={label} onClick={action} className="hv"
        style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",gap:14,alignItems:"flex-start"}}>
        <div style={{width:40,height:40,borderRadius:11,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <i className={`ti ti-${ico}`} style={{fontSize:19,color:col}}/>
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:3}}>{label}</div>
          <div style={{fontSize:12,color:K.t2}}>{desc}</div>
        </div>
      </div>)}
    </div>

    {/* Modules récents */}
    {myMods.length>0&&<>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:10}}>Mes derniers modules</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {myMods.slice(0,3).map(m=>{
          const statusCol={pending:"#F59E0B",approved:"#22C55E",rejected:"#EF4444"}[m.status]||K.t3;
          const statusLbl={pending:"En attente",approved:"Publié",rejected:"Rejeté"}[m.status]||"Brouillon";
          return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:9,background:`${statusCol}18`,border:`1px solid ${statusCol}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className="ti ti-book-2" style={{fontSize:16,color:statusCol}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>
              <div style={{fontSize:11,color:K.t3}}>{m.q?.length||0} questions</div>
            </div>
            <div style={{background:`${statusCol}18`,border:`1px solid ${statusCol}30`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,color:statusCol,flexShrink:0}}>{statusLbl}</div>
          </div>;
        })}
      </div>
    </>}
  </div>);

  // ── MES MODULES ──────────────────────────────────────────────────────────
  if(vue==="mods")return W(<FAModules uid={uid} mods={myMods} onSubmit={submitContent} saving={saving} toast={toast}/>);

  // ── MES VIDÉOS ───────────────────────────────────────────────────────────
  if(vue==="vids")return W(<FAVids uid={uid} vids={myVids} onSubmit={submitContent} saving={saving} toast={toast}/>);

  // ── MES SLIDES ───────────────────────────────────────────────────────────
  if(vue==="pres")return W(<FASlides uid={uid} pres={myPres} onSubmit={submitContent} saving={saving} toast={toast}/>);

  // ── DOCUMENTS ────────────────────────────────────────────────────────────
  if(vue==="docs")return W(<FADocs uid={uid} toast={toast}/>);

  // ── STATISTIQUES ─────────────────────────────────────────────────────────
  if(vue==="stats")return W(<FAStats uid={uid} myMods={myMods} allUsers={allUsers}/>);

  // ── CORRECTIONS ──────────────────────────────────────────────────────────
  if(vue==="corr")return W(<FACorrections answers={myOpenAnswersFA}/>);

  // ── MESSAGES ─────────────────────────────────────────────────────────────
  if(vue==="fmsg")return W(<FAMessages msgs={myMsgsFA} uid={uid} fNom={fData.nom}/>);

  return W(<div/>);
}

// ── MODULES FORMATEUR ─────────────────────────────────────────────────────────
function FAModules({uid,mods,onSubmit,saving,toast}){
  const K=useK();const{mob}=useW();
  const[creating,setCreating]=useState(false);
  const[form,setForm]=useState({titre:"",mat:"",desc:"",ico:"book-2",col:"#22C55E"});
  const[evalType,setEvalType]=useState("qcm");
  const[questions,setQuestions]=useState([{q:"",opts:["","","",""],ans:0}]);
  const[openQuestions,setOpenQuestions]=useState([{q:"",points:10}]);
  const[savingNew,setSavingNew]=useState(false);
  const[slideFile,setSlideFile]=useState(null);
  const[slideUploading,setSlideUploading]=useState(false);

  const addQ=()=>setQuestions(qs=>[...qs,{q:"",opts:["","","",""],ans:0}]);
  const updQ=(i,field,val)=>setQuestions(qs=>qs.map((q,j)=>j===i?{...q,[field]:val}:q));
  const updOpt=(i,oi,val)=>setQuestions(qs=>qs.map((q,j)=>j===i?{...q,opts:q.opts.map((o,k)=>k===oi?val:o)}:q));
  const addOQ=()=>setOpenQuestions(qs=>[...qs,{q:"",points:10}]);
  const updOQ=(i,field,val)=>setOpenQuestions(qs=>qs.map((q,j)=>j===i?{...q,[field]:val}:q));
  const rmOQ=i=>setOpenQuestions(qs=>qs.filter((_,j)=>j!==i));

  const saveModule=async()=>{
    if(!form.titre.trim())return toast("e","Titre requis");
    if(evalType==="qcm"&&questions.some(q=>!q.q.trim()||q.opts.some(o=>!o.trim())))return toast("e","Complétez toutes les questions QCM");
    if(evalType==="open"&&openQuestions.some(q=>!q.q.trim()||!q.points))return toast("e","Complétez toutes les questions ouvertes (énoncé + points)");
    setSavingNew(true);
    try{
      const id="M"+Date.now();
      let slideUrl="";
      if(slideFile){
        setSlideUploading(true);
        const r=ref(storage,`slides/${uid}/${id}.pdf`);
        await uploadBytes(r,slideFile);
        slideUrl=await getDownloadURL(r);
        setSlideUploading(false);
      }
      await setDoc(doc(db,"modules",id),{
        id,titre:form.titre,mat:form.mat||"SYSCOHADA",desc:form.desc,
        ico:form.ico,col:form.col,on:false,status:"draft",
        createdBy:uid,createdAt:new Date().toISOString(),
        slideUrl,evalType,
        q:evalType==="qcm"?questions.map(({q,opts,ans})=>({q,r:opts,b:ans})):[],
        openQ:evalType==="open"?openQuestions.map((oq,i)=>({id:"OQ"+i,q:oq.q,points:Number(oq.points)||10})):[]
      });
      toast("o","Module créé ! Soumettez-le pour validation.");
      setCreating(false);setForm({titre:"",mat:"",desc:"",ico:"book-2",col:"#22C55E"});
      setQuestions([{q:"",opts:["","","",""],ans:0}]);setOpenQuestions([{q:"",points:10}]);setEvalType("qcm");setSlideFile(null);
    }catch(e){toast("e",e.message);setSlideUploading(false);}
    setSavingNew(false);
  };

  if(creating)return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button onClick={()=>setCreating(false)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
        <i className="ti ti-arrow-left" style={{fontSize:13}}/>Retour
      </button>
      <div style={{fontWeight:800,fontSize:15,color:K.t1}}>Nouveau module</div>
    </div>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:12}}>Informations</div>
      {[["Titre du module","titre","Fondements SYSCOHADA..."],["Matière","mat","SYSCOHADA Révisé"],["Description courte","desc","Aperçu du module..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            placeholder={ph} style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
    </div>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:12}}>Type d'encadrement</div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:2}}>
        {[["none","Sans évaluation","circle-off"],["qcm","QCM","list-check"],["open","Questions ouvertes","message-2"]].map(([v,lb,ic])=>
          <button key={v} onClick={()=>setEvalType(v)} className="bt" style={{flex:"1 1 100px",padding:"10px 8px",borderRadius:9,background:evalType===v?"#8B5CF618":K.bg,border:`1.5px solid ${evalType===v?"#8B5CF6":K.b0}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <i className={`ti ti-${ic}`} style={{fontSize:16,color:evalType===v?"#8B5CF6":K.t3}}/>
            <span style={{fontSize:11,fontWeight:700,color:evalType===v?"#8B5CF6":K.t2,textAlign:"center"}}>{lb}</span>
          </button>
        )}
      </div>
    </div>
    {evalType==="qcm"&&<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:13,color:K.t1}}>Questions QCM ({questions.length})</div>
        <button onClick={addQ} className="bt" style={{background:"#8B5CF618",border:"1px solid #8B5CF630",color:"#8B5CF6",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-plus" style={{fontSize:12}}/>Question
        </button>
      </div>
      {questions.map((qu,i)=><div key={i} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px",marginBottom:10}}>
        <div style={{fontSize:11,color:K.t3,marginBottom:5,fontWeight:600}}>Question {i+1}</div>
        <input value={qu.q} onChange={e=>updQ(i,"q",e.target.value)} placeholder="Énoncé de la question..."
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"8px 10px",color:K.t1,fontSize:12,fontFamily:"'Outfit',sans-serif",marginBottom:8,boxSizing:"border-box"}}/>
        {qu.opts.map((o,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div onClick={()=>updQ(i,"ans",j)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${qu.ans===j?"#22C55E":K.b1}`,background:qu.ans===j?"#22C55E":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {qu.ans===j&&<i className="ti ti-check" style={{fontSize:10,color:"#fff"}}/>}
          </div>
          <input value={o} onChange={e=>updOpt(i,j,e.target.value)} placeholder={`Option ${j+1}${j===0?" (correcte si cochée)":""}`}
            style={{flex:1,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"7px 9px",color:K.t1,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
        </div>)}
      </div>)}
    </div>}
    {evalType==="open"&&<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:13,color:K.t1}}>Questions ouvertes ({openQuestions.length})</div>
        <button onClick={addOQ} className="bt" style={{background:"#8B5CF618",border:"1px solid #8B5CF630",color:"#8B5CF6",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-plus" style={{fontSize:12}}/>Question
        </button>
      </div>
      <div style={{fontSize:11,color:K.t3,marginBottom:12}}>Réponse libre de l'apprenant. Vous noterez chaque réponse manuellement — le score final sera calculé automatiquement.</div>
      {openQuestions.map((oq,i)=><div key={i} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px",marginBottom:10,display:"flex",gap:8,alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:K.t3,marginBottom:5,fontWeight:600}}>Question {i+1}</div>
          <textarea value={oq.q} onChange={e=>updOQ(i,"q",e.target.value)} placeholder="Énoncé de la question ouverte..." rows={2}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"8px 10px",color:K.t1,fontSize:12,fontFamily:"'Outfit',sans-serif",marginBottom:6,boxSizing:"border-box",resize:"vertical"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:K.t3}}>Points :</span>
            <input type="number" min="1" value={oq.points} onChange={e=>updOQ(i,"points",e.target.value)}
              style={{width:60,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:6,padding:"5px 7px",color:K.t1,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          </div>
        </div>
        {openQuestions.length>1&&<button onClick={()=>rmOQ(i)} className="bt" style={{background:"none",border:"none",color:K.er,cursor:"pointer",fontSize:16,padding:2,flexShrink:0}}>✕</button>}
      </div>)}
    </div>}
    {/* Upload slides */}
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-file-text" style={{fontSize:14,color:"#F59E0B"}}/>Slides PDF (optionnel)
      </div>
      <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"18px",border:`2px dashed ${slideFile?"#22C55E":K.b1}`,borderRadius:10,cursor:"pointer",background:slideFile?"#22C55E08":K.bg,transition:"all .2s"}}>
        <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>setSlideFile(e.target.files[0]||null)}/>
        <i className={`ti ti-${slideFile?"circle-check":"upload"}`} style={{fontSize:28,color:slideFile?"#22C55E":K.t3}}/>
        <div style={{fontSize:13,fontWeight:600,color:slideFile?"#22C55E":K.t2}}>{slideFile?slideFile.name:"Cliquez pour choisir un PDF"}</div>
        <div style={{fontSize:11,color:K.t3}}>PDF uniquement · Max 10 MB</div>
      </label>
      {slideFile&&<button onClick={()=>setSlideFile(null)} className="bt"
        style={{marginTop:8,background:"none",border:"none",color:K.er,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
        <i className="ti ti-x" style={{fontSize:12}}/>Supprimer
      </button>}
    </div>
    <button onClick={saveModule} disabled={savingNew||slideUploading} className="bt"
      style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,#7C3AED,#8B5CF6)`,border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
      {slideUploading?"Upload PDF...":savingNew?"Enregistrement...":"💾 Enregistrer le module"}
    </button>
  </div>;

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1}}>Mes modules ({mods.length})</div>
      <button onClick={()=>setCreating(true)} className="bt" style={{background:`linear-gradient(135deg,#7C3AED,#8B5CF6)`,border:"none",color:"#fff",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
        <i className="ti ti-plus" style={{fontSize:14}}/>Nouveau module
      </button>
    </div>
    {!mods.length&&<EmptyState ico="book-2" title="Aucun module créé" desc="Créez votre premier module SYSCOHADA avec QCM intégré."/>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {mods.map(m=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publié",rejected:"Rejeté"}[m.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#22C55E",rejected:"#EF4444"}[m.status||"draft"];
        return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:13,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:3}}>{m.titre}</div>
              <div style={{fontSize:12,color:K.t3}}>{m.mat||"SYSCOHADA"} · {m.evalType==="open"?`${m.openQ?.length||0} question(s) ouverte(s)`:m.evalType==="none"?"Sans évaluation":`${m.q?.length||0} questions QCM`}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              <span style={{background:`${cc}18`,border:`1px solid ${cc}30`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,color:cc}}>{sc}</span>
              {(m.status==="draft"||m.status==="rejected")&&
                <button onClick={()=>onSubmit("mod",m.id)} disabled={saving} className="bt"
                  style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                  Soumettre
                </button>
              }
              {m.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${m.titre}" ?`))deleteModule(m.id);}} className="bt"
                style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <i className="ti ti-trash" style={{fontSize:12}}/>
              </button>}
            </div>
          </div>
          {m.status==="rejected"&&m.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:12,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:12,marginRight:5}}/>{m.rejectReason}</div>}
        </div>;
      })}
    </div>
  </div>;
}

// ── VIDÉOS FORMATEUR ──────────────────────────────────────────────────────────
// ── SLIDES FORMATEUR ──────────────────────────────────────────────────────────
function FASlides({uid,pres,onSubmit,saving,toast}){
  const K=useK();
  const[form,setForm]=useState({titre:"",url:"",desc:"",mat:""});
  const[savingNew,setSavingNew]=useState(false);

  const savePres=async()=>{
    if(!form.titre.trim()||!form.url.trim())return toast("e","Titre et URL requis");
    setSavingNew(true);
    try{
      const id="P"+Date.now();
      await setDoc(doc(db,"presentations",id),{
        id,titre:form.titre,url:form.url,desc:form.desc,mat:form.mat||"SYSCOHADA",
        status:"draft",on:false,createdBy:uid,createdAt:new Date().toISOString(),gr:true,ordre:Date.now()
      });
      toast("o","Slide ajoutée ! Soumettez-la pour validation.");
      setForm({titre:"",url:"",desc:"",mat:""});
    }catch(e){toast("e",e.message);}
    setSavingNew(false);
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14}}>Mes slides ({pres.length})</div>
    <div style={{background:K.card,border:`1px solid #22C55E30`,borderRadius:14,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-presentation" style={{fontSize:15,color:"#22C55E"}}/>Ajouter une présentation
      </div>
      {[["Titre","titre","Titre de la présentation"],["URL (PDF/Drive/Slides)","url","https://..."],["Matière","mat","SYSCOHADA"],["Description","desc","Aperçu du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
      <button onClick={savePres} disabled={savingNew} className="bt"
        style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#15803D,#22C55E)",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4}}>
        {savingNew?"Enregistrement...":"+ Ajouter la slide"}
      </button>
    </div>
    {!pres.length&&<EmptyState ico="presentation" title="Aucune slide ajoutée" desc="Ajoutez des supports de présentation pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {pres.map(p=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publiée",rejected:"Rejetée"}[p.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#22C55E",rejected:"#EF4444"}[p.status||"draft"];
        return <div key={p.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#22C55E18",border:"1px solid #22C55E30",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="ti ti-presentation" style={{fontSize:16,color:"#22C55E"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div>
            <div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.url}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{background:`${cc}18`,border:`1px solid ${cc}30`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,color:cc}}>{sc}</span>
            {(p.status==="draft"||p.status==="rejected")&&
              <button onClick={()=>onSubmit("pres",p.id)} disabled={saving} className="bt"
                style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                Soumettre
              </button>
            }
            {p.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${p.titre}" ?`))deletePresentation(p.id);}} className="bt"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
              <i className="ti ti-trash" style={{fontSize:12}}/>
            </button>}
          </div>
          </div>
          {p.status==="rejected"&&p.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:12,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:12,marginRight:5}}/>{p.rejectReason}</div>}
        </div>;
      })}
    </div>
  </div>;
}

// ── CORRECTIONS (questions ouvertes) ────────────────────────────────────────────
function FAMessages({msgs,uid,fNom}){
  const K=useK();
  const[thread,sThread]=useState(null);
  const[texte,sTexte]=useState("");
  const[sending,sSending]=useState(false);
  const endRef=useRef();
  useEffect(()=>{
    if(!thread)return;
    msgs.filter(m=>m.apprenantUid===thread&&m.fromRole==="apprenant"&&!m.luAdmin).forEach(m=>{updateDoc(doc(db,"messages",m.id),{luAdmin:true}).catch(()=>{});});
  },[thread,msgs.length]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs.length,thread]);
  const convMap={};
  msgs.forEach(m=>{if(!convMap[m.apprenantUid]||m.ts>convMap[m.apprenantUid].ts)convMap[m.apprenantUid]=m;});
  const convs=Object.values(convMap).sort((a,b)=>b.ts-a.ts);
  if(thread){
    const tMsgs=msgs.filter(m=>m.apprenantUid===thread);
    const aNom=tMsgs[0]?.apprenantNom||"Apprenant";
    const send=async()=>{
      const t=texte.trim();if(!t||sending)return;
      sSending(true);
      await sendMessage({apprenantUid:thread,apprenantNom:aNom,from:uid,fromNom:fNom,fromRole:"formateur",texte:t,formateurUid:uid});
      sTexte("");sSending(false);
    };
    return <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>sThread(null)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:K.t2,display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-arrow-left" style={{fontSize:13}}/>Retour</button>
        <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{aNom}</div>
      </div>
      <div style={{background:K.c2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{height:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
          {tMsgs.map(m=>{const mine=m.fromRole==="formateur";return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
            <div style={{background:mine?"#8B5CF6":K.card,color:mine?"#fff":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:13,lineHeight:1.5,border:mine?"none":`1px solid ${K.b0}`}}>{m.texte}</div>
            <div style={{fontSize:9,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.apprenantNom} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
          </div>;})}
          <div ref={endRef}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Répondre…" style={{flex:1,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"10px 15px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}/>
        <Btn ch={sending?"…":"Envoyer"} on={send} v="i" sx={{minHeight:40}}/>
      </div>
    </div>;
  }
  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><i className="ti ti-message-circle" style={{fontSize:16,color:"#8B5CF6"}}/>Messages de vos apprenants</div>
    {!convs.length&&<EmptyState ico="message-circle" title="Aucun message" desc="Les questions de vos apprenants (envoyées depuis vos modules) apparaîtront ici."/>}
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {convs.map(c=>{
        const unread=msgs.filter(m=>m.apprenantUid===c.apprenantUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;
        return <div key={c.apprenantUid} onClick={()=>sThread(c.apprenantUid)} className="bt" style={{background:K.card,border:`1px solid ${unread>0?"#8B5CF640":K.b0}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{(c.apprenantNom||"?")[0].toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:K.t1}}>{c.apprenantNom||"Apprenant"}</div>
            <div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.fromRole==="formateur"?"Vous : ":""}{c.texte}</div>
          </div>
          {unread>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:10,fontWeight:800,borderRadius:99,padding:"2px 7px",flexShrink:0}}>{unread}</span>}
        </div>;
      })}
    </div>
  </div>;
}
function FACorrections({answers}){
  const K=useK();const{mob}=useW();
  const[grading,setGrading]=useState(null);
  const[notes,setNotes]=useState({});
  const[saving,setSaving]=useState(false);
  const ungraded=answers.filter(a=>!a.graded).sort((a,b)=>(a.submittedAt||0)-(b.submittedAt||0));
  const graded=answers.filter(a=>a.graded).sort((a,b)=>(b.gradedAt||0)-(a.gradedAt||0));

  const openGrading=a=>{setGrading(a);setNotes(Object.fromEntries(a.answers.map(x=>[x.qId,""])));};
  const totalNotes=Object.values(notes).reduce((s,v)=>s+(Number(v)||0),0);

  if(grading){
    const overMax=totalNotes>grading.maxPoints;
    return <div style={{animation:"fadeIn .3s ease",maxWidth:640,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={()=>setGrading(null)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-arrow-left" style={{fontSize:13}}/>Retour
        </button>
        <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{grading.apprenantNom} — {grading.modTitre}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        {grading.answers.map(a=><div key={a.qId} style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:8}}>{a.q}</div>
          <div style={{background:K.c2,borderRadius:9,padding:"10px 12px",color:K.t2,fontSize:13,lineHeight:1.6,marginBottom:10,whiteSpace:"pre-wrap"}}>{a.texte}</div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:11,color:K.t3,fontWeight:600}}>Note :</span>
            <input type="number" min="0" value={notes[a.qId]} onChange={e=>setNotes(n=>({...n,[a.qId]:e.target.value}))} placeholder="0"
              style={{width:70,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"6px 9px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif"}}/>
          </div>
        </div>)}
      </div>
      <div style={{background:overMax?K.erBg:K.emBg,border:`1px solid ${overMax?K.erBd:K.emBd}`,borderRadius:10,padding:"11px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,color:K.t2,fontWeight:600}}>Total</span>
        <span style={{fontSize:16,fontWeight:800,color:overMax?K.er:K.em}}>{totalNotes} / {grading.maxPoints} pts</span>
      </div>
      <Btn ch={saving?"Enregistrement…":"✓ Valider la correction"} dis={saving||overMax} on={async()=>{
        setSaving(true);
        try{await gradeOpenAnswers(grading.id,notes,grading.apprenantUid,grading.modId,grading.maxPoints);setGrading(null);}
        catch(e){alert(e.message);}
        setSaving(false);
      }} full sx={{minHeight:46}}/>
    </div>;
  }

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14}}>Corrections ({ungraded.length} à faire)</div>
    {!ungraded.length&&!graded.length&&<EmptyState ico="checkbox" title="Aucune soumission" desc="Les réponses aux questions ouvertes de vos apprenants apparaîtront ici."/>}
    {ungraded.length>0&&<div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:K.wa,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>⏳ À corriger</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ungraded.map(a=><div key={a.id} onClick={()=>openGrading(a)} className="bt" style={{cursor:"pointer",background:K.card,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:K.waBg,border:`1px solid ${K.waBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-message-circle" style={{fontSize:15,color:K.wa}}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:K.t1}}>{a.apprenantNom}</div>
            <div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.modTitre} · {a.answers.length} réponse(s)</div>
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:16,color:K.t3,flexShrink:0}}/>
        </div>)}
      </div>
    </div>}
    {graded.length>0&&<div>
      <div style={{fontSize:11,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>✓ Corrigées</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {graded.map(a=><div key={a.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 15px",display:"flex",alignItems:"center",gap:10,opacity:.75}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:K.t1}}>{a.apprenantNom}</div>
            <div style={{fontSize:11,color:K.t3}}>{a.modTitre}</div>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:K.em,flexShrink:0}}>{a.totalPoints}/{a.maxPoints} · {a.pct}%</span>
        </div>)}
      </div>
    </div>}
  </div>;
}

function FAVids({uid,vids,onSubmit,saving,toast}){
  const K=useK();
  const[form,setForm]=useState({titre:"",url:"",desc:""});
  const[savingNew,setSavingNew]=useState(false);

  const saveVid=async()=>{
    if(!form.titre.trim()||!form.url.trim())return toast("e","Titre et URL requis");
    setSavingNew(true);
    try{
      const id="V"+Date.now();
      await setDoc(doc(db,"videos",id),{
        id,titre:form.titre,url:form.url,desc:form.desc,
        status:"draft",createdBy:uid,createdAt:new Date().toISOString(),gr:false
      });
      toast("o","Vidéo ajoutée ! Soumettez-la pour validation.");
      setForm({titre:"",url:"",desc:""});
    }catch(e){toast("e",e.message);}
    setSavingNew(false);
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14}}>Mes vidéos ({vids.length})</div>
    {/* Formulaire ajout */}
    <div style={{background:K.card,border:`1px solid #3B82F630`,borderRadius:14,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-video-plus" style={{fontSize:15,color:"#3B82F6"}}/>Ajouter une vidéo
      </div>
      {[["Titre","titre","Titre de la vidéo"],["URL (YouTube/Drive)","url","https://..."],["Description","desc","Aperçu du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
      <button onClick={saveVid} disabled={savingNew} className="bt"
        style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4}}>
        {savingNew?"Enregistrement...":"+ Ajouter la vidéo"}
      </button>
    </div>
    {/* Liste */}
    {!vids.length&&<EmptyState ico="video" title="Aucune vidéo ajoutée" desc="Ajoutez des liens YouTube ou Drive pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {vids.map(v=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publiée",rejected:"Rejetée"}[v.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#22C55E",rejected:"#EF4444"}[v.status||"draft"];
        return <div key={v.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#3B82F618",border:"1px solid #3B82F630",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="ti ti-video" style={{fontSize:16,color:"#3B82F6"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div>
            <div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.url}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{background:`${cc}18`,border:`1px solid ${cc}30`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,color:cc}}>{sc}</span>
            {(v.status==="draft"||v.status==="rejected")&&
              <button onClick={()=>onSubmit("vid",v.id)} disabled={saving} className="bt"
                style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                Soumettre
              </button>
            }
            {v.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${v.titre}" ?`))deleteVideo(v.id);}} className="bt"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
              <i className="ti ti-trash" style={{fontSize:12}}/>
            </button>}
          </div>
          </div>
          {v.status==="rejected"&&v.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:12,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:12,marginRight:5}}/>{v.rejectReason}</div>}
        </div>;
      })}
    </div>
  </div>;
}

// ── STATS FORMATEUR ───────────────────────────────────────────────────────────
function FAStats({uid,myMods,allUsers}){
  const K=useK();const{mob}=useW();
  const myModIds=new Set(myMods.map(m=>m.id));

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14}}>Statistiques de vos cours</div>
    {!myMods.length&&<EmptyState ico="chart-bar" title="Aucune statistique" desc="Créez et publiez des modules pour voir les statistiques de vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {myMods.filter(m=>m.status==="approved"||m.on).map(m=>{
        const learners=allUsers.filter(u=>u.progress?.[m.id]==="done");
        const scores=allUsers.map(u=>u.scores?.[m.id]?.pct).filter(p=>p!=null);
        const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
        const above80=scores.filter(s=>s>=80).length;
        return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:9,background:"#8B5CF618",border:"1px solid #8B5CF630",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className="ti ti-book-2" style={{fontSize:16,color:"#8B5CF6"}}/>
            </div>
            <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{m.titre}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              [learners.length,"Complétés","#22C55E"],
              [`${avg}%`,"Score moyen","#3B82F6"],
              [above80,"Score ≥80%","#F59E0B"],
            ].map(([v,l,c])=><div key={l} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:K.t3,marginTop:3}}>{l}</div>
            </div>)}
          </div>
          {scores.length>0&&<>
            <div style={{fontSize:11,color:K.t3,marginTop:10,marginBottom:4}}>Distribution des scores</div>
            <div style={{height:6,background:K.b0,borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${avg}%`,background:`linear-gradient(90deg,#3B82F6,#8B5CF6)`,borderRadius:99,transition:"width .6s ease"}}/>
            </div>
          </>}
        </div>;
      })}
    </div>
  </div>;
}

// ── AUTO-LOGOUT après 20 min d'inactivité ────────────────────────────────────
const INACTIVITY_MS = 20 * 60 * 1000;
const WARN_MS = 10 * 60 * 1000; // alerte à 10 min

function useAutoLogout(onLogout) {
  const [warning, setWarning] = useState(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  useEffect(() => {
    let timer = null;
    let warnTimer = null;

    const reset = () => {
      setWarning(false);
      clearTimeout(timer);
      clearTimeout(warnTimer);
      warnTimer = setTimeout(() => setWarning(true), WARN_MS);
      timer = setTimeout(() => { onLogoutRef.current(); }, INACTIVITY_MS);
    };

    const events = ["mousemove","keydown","mousedown","touchstart","scroll","click"];
    events.forEach(e => window.addEventListener(e, reset, {passive:true}));
    reset();

    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(timer);
      clearTimeout(warnTimer);
    };
  }, []);

  return { warning };
}

// ── DOCUMENTS FORMATEUR ───────────────────────────────────────────────────────
const DOC_TYPES = {
  "application/pdf":                    {label:"PDF",         ico:"file-text",    col:"#EF4444"},
  "application/vnd.ms-powerpoint":      {label:"PowerPoint",  ico:"presentation", col:"#F59E0B"},
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                                        {label:"PowerPoint",  ico:"presentation", col:"#F59E0B"},
  "application/msword":                 {label:"Word",        ico:"file-word",    col:"#3B82F6"},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                                        {label:"Word",        ico:"file-word",    col:"#3B82F6"},
  "application/vnd.ms-excel":           {label:"Excel",       ico:"file-spreadsheet", col:"#22C55E"},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                                        {label:"Excel",       ico:"file-spreadsheet", col:"#22C55E"},
};
const ACCEPT_DOCS=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx";
const MAX_SIZE_MB=20;

function FADocs({uid,toast}){
  const K=useK();const{mob}=useW();
  const[docs,setDocs]=useState([]);
  const[uploading,setUploading]=useState(false);
  const[form,setForm]=useState({titre:"",desc:"",modId:""});
  const[file,setFile]=useState(null);
  const[dragOver,setDragOver]=useState(false);
  const{mods}=useModules();
  const myMods=mods.filter(m=>m.createdBy===uid);

  useEffect(()=>{
    const unsub=onSnapshot(
      query(collection(db,"documents"),where("createdBy","==",uid)),
      snap=>setDocs(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    return unsub;
  },[uid]);

  const getFileType=f=>DOC_TYPES[f?.type]||{label:f?.name?.split(".").pop()?.toUpperCase()||"Fichier",ico:"file",col:"#8B5CF6"};

  const handleFile=f=>{
    if(!f)return;
    if(f.size>MAX_SIZE_MB*1024*1024){toast("e",`Fichier trop lourd (max ${MAX_SIZE_MB} MB)`);return;}
    if(!Object.keys(DOC_TYPES).some(t=>f.type===t)&&!ACCEPT_DOCS.split(",").some(ext=>f.name.endsWith(ext.replace(".",".")))){
      toast("e","Format non supporté — PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX uniquement");return;
    }
    setFile(f);
    if(!form.titre)setForm(fm=>({...fm,titre:f.name.replace(/\.[^/.]+$/,"")}));
  };

  const uploadDoc=async()=>{
    if(!file)return toast("e","Choisissez un fichier");
    if(!form.titre.trim())return toast("e","Titre requis");
    setUploading(true);
    const timeoutMs=90000;
    let timedOut=false;
    const timeoutId=setTimeout(()=>{timedOut=true;setUploading(false);toast("e","L'envoi prend trop de temps. Vérifiez votre connexion et réessayez avec un fichier plus léger si possible.");},timeoutMs);
    try{
      const id="DOC"+Date.now();
      const ext=file.name.split(".").pop();
      const r=ref(storage,`documents/${uid}/${id}.${ext}`);
      await Promise.race([
        uploadBytes(r,file),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),timeoutMs))
      ]);
      if(timedOut)return;
      const url=await getDownloadURL(r);
      await setDoc(doc(db,"documents",id),{
        id,titre:form.titre,desc:form.desc,
        url,type:file.type,ext,size:file.size,
        modId:form.modId||"",
        status:"draft",createdBy:uid,
        createdAt:new Date().toISOString(),
        fileName:file.name,
      });
      clearTimeout(timeoutId);
      toast("o","Document uploadé ! Soumettez-le pour validation.");
      setFile(null);setForm({titre:"",desc:"",modId:""});
      setUploading(false);
    }catch(e){
      clearTimeout(timeoutId);
      if(!timedOut){toast("e",e.message==="timeout"?"L'envoi a expiré. Vérifiez votre connexion.":e.message);setUploading(false);}
    }
  };

  const submitDoc=async(id)=>{
    await updateDoc(doc(db,"documents",id),{status:"pending",submittedAt:new Date().toISOString()});
    toast("o","Soumis pour validation !");
  };

  const statusInfo={
    draft:   {label:"Brouillon", col:K.t3},
    pending: {label:"En attente",col:"#F59E0B"},
    approved:{label:"Publié",    col:"#22C55E"},
    rejected:{label:"Rejeté",    col:"#EF4444"},
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
      <i className="ti ti-files" style={{fontSize:16,color:"#8B5CF6"}}/>
      Documents ({docs.length})
    </div>

    {/* Zone upload */}
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-upload" style={{fontSize:14,color:"#8B5CF6"}}/>Uploader un document
      </div>

      {/* Drop zone */}
      <label
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,
          padding:"22px 16px",border:`2px dashed ${dragOver?"#8B5CF6":file?"#22C55E":K.b1}`,
          borderRadius:12,cursor:"pointer",
          background:dragOver?"#8B5CF608":file?"#22C55E06":K.bg,
          transition:"all .2s",marginBottom:14}}>
        <input type="file" accept={ACCEPT_DOCS} style={{display:"none"}}
          onChange={e=>handleFile(e.target.files[0])}/>
        {file
          ?<>
            <div style={{width:48,height:48,borderRadius:14,background:`${getFileType(file).col}18`,border:`1px solid ${getFileType(file).col}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className={`ti ti-${getFileType(file).ico}`} style={{fontSize:22,color:getFileType(file).col}}/>
            </div>
            <div style={{fontWeight:700,fontSize:13,color:"#22C55E",textAlign:"center"}}>{file.name}</div>
            <div style={{fontSize:11,color:K.t3}}>{getFileType(file).label} · {(file.size/1024/1024).toFixed(1)} MB</div>
          </>
          :<>
            <i className="ti ti-cloud-upload" style={{fontSize:36,color:K.t3}}/>
            <div style={{fontWeight:600,fontSize:13,color:K.t2}}>Glissez un fichier ou cliquez pour choisir</div>
            <div style={{fontSize:11,color:K.t3}}>PDF · PowerPoint · Word · Excel · Max {MAX_SIZE_MB} MB</div>
            {/* Badges formats */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
              {[["file-text","PDF","#EF4444"],["presentation","PPT/PPTX","#F59E0B"],["file-word","DOC/DOCX","#3B82F6"],["file-spreadsheet","XLS/XLSX","#22C55E"]].map(([ico,lbl,col])=>
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:4,background:`${col}14`,border:`1px solid ${col}25`,borderRadius:6,padding:"3px 8px"}}>
                  <i className={`ti ti-${ico}`} style={{fontSize:11,color:col}}/>
                  <span style={{fontSize:10,fontWeight:700,color:col}}>{lbl}</span>
                </div>
              )}
            </div>
          </>
        }
      </label>

      {/* Formulaire */}
      {[["Titre du document","titre","Fondements SYSCOHADA — Chapitre 1"],["Description (optionnel)","desc","Résumé du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            placeholder={ph} style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}

      {/* Associer à un module */}
      {myMods.length>0&&<div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:K.t3,marginBottom:4,fontWeight:600}}>Associer à un module (optionnel)</div>
        <select value={form.modId} onChange={e=>setForm(f=>({...f,modId:e.target.value}))}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>
          <option value="">Aucun module associé</option>
          {myMods.map(m=><option key={m.id} value={m.id}>{m.titre}</option>)}
        </select>
      </div>}

      <div style={{display:"flex",gap:8}}>
        {file&&<button onClick={()=>{setFile(null);setForm({titre:"",desc:"",modId:""});}} className="bt"
          style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:9,padding:"10px 14px",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>
          Annuler
        </button>}
        <button onClick={uploadDoc} disabled={uploading||!file} className="bt"
          style={{flex:1,padding:"12px",background:file?"linear-gradient(135deg,#7C3AED,#8B5CF6)":"#333",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:13,cursor:file?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          {uploading?<><i className="ti ti-loader-2" style={{fontSize:14,animation:"spin .8s linear infinite"}}/>Upload en cours...</>:<><i className="ti ti-upload" style={{fontSize:14}}/>Uploader le document</>}
        </button>
      </div>
    </div>

    {/* Liste des documents */}
    {!docs.length&&<EmptyState ico="files" title="Aucun document uploadé" desc="Uploadez vos supports PDF, PowerPoint, Word ou Excel pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {docs.map(d=>{
        const ft=DOC_TYPES[d.type]||{label:d.ext?.toUpperCase()||"Fichier",ico:"file",col:"#8B5CF6"};
        const si=statusInfo[d.status||"draft"];
        return <div key={d.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:13,padding:"13px 15px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${ft.col}18`,border:`1px solid ${ft.col}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className={`ti ti-${ft.ico}`} style={{fontSize:19,color:ft.col}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.titre}</div>
              <div style={{fontSize:11,color:K.t3,display:"flex",gap:8,alignItems:"center"}}>
                <span>{ft.label}</span>
                {d.size&&<span>{(d.size/1024/1024).toFixed(1)} MB</span>}
                {d.modId&&mods.find(m=>m.id===d.modId)&&<span>· {mods.find(m=>m.id===d.modId)?.titre}</span>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              <span style={{background:`${si.col}18`,border:`1px solid ${si.col}30`,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700,color:si.col,whiteSpace:"nowrap"}}>{si.label}</span>
              {(d.status==="draft"||d.status==="rejected")&&
                <button onClick={()=>submitDoc(d.id)} className="bt"
                  style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>
                  Soumettre
                </button>
              }
              {d.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${d.titre}" ?`))deleteDoc(doc(db,"documents",d.id));}} className="bt"
                style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <i className="ti ti-trash" style={{fontSize:12}}/>
              </button>}
            </div>
          </div>
          {d.desc&&<div style={{fontSize:12,color:K.t2,marginTop:8,paddingTop:8,borderTop:`1px solid ${K.b0}`,lineHeight:1.5}}>{d.desc}</div>}
          {d.status==="rejected"&&d.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:12,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:12,marginRight:5}}/>{d.rejectReason}</div>}
        </div>;
      })}
    </div>
  </div>;
}

function AutoLogoutBanner({warning, mob}){
  const[secs,setSecs]=useState(120);
  useEffect(()=>{
    if(!warning)return;
    setSecs(120);
    const iv=setInterval(()=>setSecs(s=>{if(s<=1){clearInterval(iv);return 0;}return s-1;}),1000);
    return()=>clearInterval(iv);
  },[warning]);
  if(!warning)return null;
  const mins=Math.floor(secs/60),rem=secs%60;
  return <div style={{
    position:"fixed",bottom:mob?70:20,left:"50%",transform:"translateX(-50%)",
    background:"#1C1917",border:"1px solid #F59E0B40",borderRadius:12,
    padding:"12px 18px",zIndex:9999,display:"flex",alignItems:"center",gap:12,
    boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"slideUp .3s ease",
    fontFamily:"'Outfit',sans-serif",maxWidth:360,width:"calc(100% - 32px)"
  }}>
    <i className="ti ti-clock-exclamation" style={{fontSize:20,color:"#F59E0B",flexShrink:0}}/>
    <div style={{flex:1}}>
      <div style={{fontWeight:700,fontSize:13,color:"#fff",marginBottom:2}}>Déconnexion imminente</div>
      <div style={{fontSize:12,color:"#A8A29E"}}>Déconnexion dans <strong style={{color:"#F59E0B"}}>{mins}:{String(rem).padStart(2,"0")}</strong></div>
    </div>
    <button onClick={()=>{}} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"6px 12px",color:"#1C1917",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0}}>
      Rester connecté
    </button>
  </div>;
}

function Auth({onL}){
  const K=useK();const{mob}=useW();
  const[tab,sT]=useState("l"),[err,sE]=useState(""),[ok,sO]=useState(""),[busy,sB]=useState(false),[step,sS]=useState(1);
  const[consent,sConsent]=useState(false),[showPrivacy,sShowPrivacy]=useState(false),[needConsent,sNeedConsent]=useState(false);
  const pm=useRef(null),rN=useRef(),rM=useRef(),rP=useRef(),rP2=useRef(),rC=useRef();
  const sw=useCallback(t=>{sT(t);sS(1);sE("");sO("");sConsent(false);sNeedConsent(false);setTimeout(()=>[rN,rM,rP,rP2,rC].forEach(r=>{if(r.current)r.current.value="";}),0);},[]);
  const reg=useCallback(async()=>{
    const n=rN.current?.value?.trim()||"",m=rM.current?.value?.trim()||"",p=rP.current?.value||"",p2=rP2.current?.value||"";
    sE("");sO("");
    if(n.length<2)return sE("Nom requis");if(!m.includes("@"))return sE("Email invalide");if(p.length<6)return sE("Mot de passe min. 6 caractères");if(p!==p2)return sE("Mots de passe différents");
    if(!consent)return sE("Vous devez accepter la politique de confidentialité.");
    sB(true);
    try{
      const cred=await createUserWithEmailAndPassword(auth,m,p);
      await saveUserData(cred.user.uid,{nom:n,mail:m,createdAt:new Date().toLocaleDateString("fr-FR"),abonnement:"aucun",activationCode:null,codeValide:false,demandeDate:null,dureeId:null,dateExpiration:null,progress:{},scores:{},consentDate:new Date().toISOString(),consentVersion:PRIVACY_VERSION});
      sendNotifEmail({to_email:m,subject:"Bienvenue sur Éco-Campus RDC 🎉",nom:n,message:"Votre compte vient d'être créé avec succès sur Éco-Campus RDC.\n\nProchaine étape : faites votre demande d'accès à une formation depuis votre espace, puis réglez votre inscription. Vous recevrez ensuite votre code d'activation par email pour débloquer vos modules.\n\nÀ très vite !"});
      sO("Compte créé !");setTimeout(()=>sw("l"),1100);
    }catch(e){sE(e.code==="auth/email-already-in-use"?"Email déjà utilisé.":e.message);}
    sB(false);
  },[consent]);
  const login=useCallback(async()=>{
    const m=rM.current?.value?.trim()||"",p=rP.current?.value||"";sE("");sO("");sB(true);
    try{
      const cred=await signInWithEmailAndPassword(auth,m,p);
      if(cred.user.email===ADM_EMAIL){onL("__admin__",cred.user);return;}
      const snap=await getDoc(doc(db,"users",cred.user.uid));
      if(!snap.exists()){sE("Profil introuvable.");sB(false);return;}
      const u=snap.data();
      updateDoc(doc(db,"users",cred.user.uid),{lastLogin:Date.now()}).catch(()=>{});
      if(u.role==="formateur"){onL("__formateur__:"+cred.user.uid,cred.user);return;}
      if(u.abonnement==="actif"&&xp(u.dateExpiration)){await updateDoc(doc(db,"users",cred.user.uid),{abonnement:"expiré"});}
      onL(cred.user.uid,cred.user);
    }catch(e){sE(["auth/invalid-credential","auth/invalid-login-credentials","auth/wrong-password","auth/user-not-found"].includes(e.code)?"Email ou mot de passe incorrect.":e.message);sB(false);}
  },[onL]);
  const code=useCallback(async()=>{
    const c=rC.current?.value?.trim()||"";const pw=rP.current?.value||"";
    sE("");if(!c)return sE("Entrez votre code");if(!pw)return sE("Entrez votre mot de passe");
    sB(true);
    let cred;
    try{
      cred=await signInWithEmailAndPassword(auth,pm.current,pw);
    }catch(e){sB(false);return sE(["auth/invalid-credential","auth/invalid-login-credentials","auth/wrong-password","auth/user-not-found"].includes(e.code)?"Email ou mot de passe incorrect.":e.message);}
    // Detect formateur code (FO- prefix)
    if(c.startsWith("FO-")){
      try{
        const snap=await getDoc(doc(db,"users",cred.user.uid));
        if(!snap.exists()){sB(false);return sE("Profil introuvable.");}
        const u=snap.data();
        if(u.formateurCode!==c){sB(false);return sE("Code formateur incorrect.");}
        await updateDoc(doc(db,"users",cred.user.uid),{role:"formateur",formateurCodeValide:true});
        sO("✓ Accès formateur débloqué !");setTimeout(()=>onL("__formateur__:"+cred.user.uid,cred.user),700);
      }catch(e){sB(false);sE(e.message);}
      return;
    }
    // Code apprenant standard
    try{
      const snap=await getDoc(doc(db,"users",cred.user.uid));
      if(!snap.exists()){sB(false);return sE("Profil introuvable.");}
      const u=snap.data();
      if(u.activationCode!==c){sB(false);return sE("Code incorrect.");}
      await updateDoc(doc(db,"users",cred.user.uid),{abonnement:"actif",codeValide:true});
      sO("✓ Accès débloqué !");setTimeout(()=>onL(cred.user.uid,cred.user),700);
    }catch(e){sB(false);sE(e.message);}
  },[onL]);
  const socialLogin=useCallback(async(provider)=>{
    sE("");sO("");sB(true);
    try{
      const cred=await signInWithPopup(auth,provider);
      const user=cred.user;
      if(user.email===ADM_EMAIL){onL("__admin__",user);return;}
      const snap=await getDoc(doc(db,"users",user.uid));
      if(!snap.exists()){
        if(!consent){sNeedConsent(true);await signOut(auth);sB(false);return;}
        await setDoc(doc(db,"users",user.uid),{nom:user.displayName||user.email.split("@")[0],mail:user.email,createdAt:new Date().toLocaleDateString("fr-FR"),abonnement:"aucun",activationCode:null,codeValide:false,demandeDate:null,dureeId:null,dateExpiration:null,progress:{},scores:{},consentDate:new Date().toISOString(),consentVersion:PRIVACY_VERSION,lastLogin:Date.now()});
        sendNotifEmail({to_email:user.email,subject:"Bienvenue sur Éco-Campus RDC 🎉",nom:user.displayName||user.email.split("@")[0],message:"Votre compte vient d'être créé avec succès sur Éco-Campus RDC.\n\nProchaine étape : faites votre demande d'accès à une formation depuis votre espace, puis réglez votre inscription. Vous recevrez ensuite votre code d'activation par email pour débloquer vos modules.\n\nÀ très vite !"});
      }else{
        const u=snap.data();
        if(u.abonnement==="actif"&&xp(u.dateExpiration)){await updateDoc(doc(db,"users",user.uid),{abonnement:"expiré"});}
        updateDoc(doc(db,"users",user.uid),{lastLogin:Date.now()}).catch(()=>{});
      }
      onL(user.uid,user);
    }catch(e){
      if(e.code!=="auth/popup-closed-by-user")sE("Connexion échouée : "+e.message);
      sB(false);
    }
  },[onL]);
  const go=useCallback(()=>step===2?code():tab==="r"?reg():login(),[step,tab,code,reg,login]);
  const hk=useCallback(e=>{if(e.key==="Enter")go();},[go]);
  return <div style={{minHeight:"100vh",background:K.bg,display:"flex",flexDirection:"column",fontFamily:"'Outfit',sans-serif",position:"relative"}}>
    <style>{mCss(K)}</style>
    <div style={{position:"fixed",top:-140,left:"50%",transform:"translateX(-50%)",width:460,height:220,background:`radial-gradient(ellipse,${K.em}0D,transparent 70%)`,pointerEvents:"none"}}/>
    <header style={{padding:mob?"14px 15px":"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:1}}><Logo/><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Formation en ligne"/></header>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:mob?"10px 14px 22px":"18px",position:"relative",zIndex:1}}>
      <div style={{width:"100%",maxWidth:385,animation:"sc .3s ease"}}>
        <div style={{textAlign:"center",marginBottom:mob?17:23}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"4px 12px",marginBottom:12}}><span style={{width:5,height:5,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:11,color:K.t2}}>Plateforme active</span></div>
          <h1 style={{fontSize:mob?20:25,fontWeight:900,color:K.t1,lineHeight:1.15,letterSpacing:"-.4px",marginBottom:5}}><span style={{background:`linear-gradient(135deg,${K.em},${K.in_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Éco-Campus</span><br/><span style={{fontSize:mob?14:17,fontWeight:700,color:K.t2}}>Consulting</span></h1>
          <p style={{color:K.t3,fontSize:12,lineHeight:1.6}}>Modules · QCM · Exercices · Vidéos · Direct</p>
        </div>
        <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:14,padding:mob?"17px 15px":"21px 19px",boxShadow:"0 20px 55px rgba(0,0,0,.3)"}}>
          {step===1&&<div style={{display:"flex",background:K.bg,borderRadius:9,padding:3,marginBottom:17,gap:2}}>{[["l","Connexion"],["r","Inscription"]].map(([k,l])=><button key={k} onClick={()=>sw(k)} className="bt" style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontWeight:700,fontSize:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:tab===k?K.c2:"transparent",color:tab===k?K.t1:K.t3,minHeight:38}}>{l}</button>)}</div>}
          <div style={{marginBottom:15}}><div style={{fontSize:15,fontWeight:800,color:K.t1,marginBottom:3}}>{step===2?"🔐 Code d'activation":tab==="l"?"Bon retour 👋":"Créer un compte"}</div><div style={{fontSize:12,color:K.t3,lineHeight:1.5}}>{step===2?"Code reçu de l'administrateur":tab==="l"?"Accédez à votre formation":"Inscription gratuite · Accès sur abonnement"}</div></div>
          {step===2&&<Inp lb="Mot de passe" rf={rP} type="password" ph="Le même qu'à l'inscription" ok={hk}/>}
          {step===2&&<Inp lb="Code d'activation" rf={rC} ph="ACC-001" mono note="Communiqué par Éco-Campus" ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Nom complet" rf={rN} ph="Votre nom" ok={hk}/>}
          {step===1&&<Inp lb="Email" rf={rM} type="email" ph="vous@exemple.com" ok={hk}/>}
          {step===1&&<Inp lb="Mot de passe" rf={rP} type="password" ph="Min. 6 car." ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Confirmer" rf={rP2} type="password" ph="Répéter" ok={hk}/>}
          {step===1&&tab==="r"&&<div style={{marginBottom:13}}>
            <div onClick={()=>sConsent(c=>!c)} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",background:consent?K.emBg:K.c2,border:`1px solid ${consent?K.emBd:K.b0}`,borderRadius:9,transition:"all .15s"}}>
              <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${consent?K.em:K.b1}`,background:consent?K.em:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
                {consent&&<i className="ti ti-check" style={{fontSize:11,color:"#F5EDD8"}}/>}
              </div>
              <span style={{fontSize:12,color:K.t2,lineHeight:1.55,flex:1}}>
                J'ai lu et j'accepte la{" "}
                <button onClick={e=>{e.stopPropagation();sShowPrivacy(true);}} style={{background:"none",border:"none",color:K.em,fontWeight:700,fontSize:12,cursor:"pointer",padding:0,textDecoration:"underline",fontFamily:"'Outfit',sans-serif"}}>
                  politique de confidentialité
                </button>
                {" "}d'Éco-Campus RDC.
              </span>
            </div>
            {needConsent&&<div style={{marginTop:6,fontSize:11,color:K.wa,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-alert-triangle" style={{fontSize:12}}/>Acceptez la politique avant de continuer avec Google ou Facebook.</div>}
          </div>}
          {step===1&&tab==="l"&&<div style={{textAlign:"right",marginTop:-5,marginBottom:11}}><button onClick={()=>{const m=rM.current?.value?.trim()||"";if(!m.includes("@"))return sE("Saisissez votre email d'abord");pm.current=m;sS(2);sE("");}} className="bt" style={{background:"none",border:"none",color:K.em,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>J'ai un code →</button></div>}
          <Pop t="e" m={err}/><Pop t="o" m={ok}/>
          <Btn ch={busy?"…":step===2?"Valider →":tab==="l"?"Se connecter →":"Créer →"} on={go} full sx={{padding:"12px",fontSize:14,minHeight:46}} dis={busy}/>
          {step===2&&<button onClick={()=>{sS(1);sE("");}} className="bt" style={{width:"100%",marginTop:7,padding:"10px",background:"none",border:`1px solid ${K.b0}`,color:K.t3,borderRadius:8,fontFamily:"'Outfit',sans-serif",fontSize:12,cursor:"pointer",minHeight:40}}>← Retour</button>}
          {showPrivacy&&<PrivacyModal onClose={()=>sShowPrivacy(false)}/>}
          {tab==="r"&&step===1&&<div style={{marginBottom:6,padding:"7px 10px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,fontSize:11,color:K.t3,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-lock" style={{fontSize:12,color:K.em}}/>Données protégées · Firebase sécurisé · Jamais revendues
          </div>}
          {tab==="l"&&step===1&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0"}}>
              <div style={{flex:1,height:1,background:K.b0}}/>
              <span style={{fontSize:11,color:K.t3}}>ou continuer avec</span>
              <div style={{flex:1,height:1,background:K.b0}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button onClick={()=>socialLogin(googleProvider)} disabled={busy} className="bt"
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:9,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:13,color:K.t1,minHeight:44}}>
                <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.72 17.76 9.5 24 9.5z"/><path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.46c-.54 2.9-2.18 5.36-4.64 7.01l7.14 5.54C43.27 37.22 46.14 31.28 46.14 24.5z"/><path fill="#FBBC05" d="M10.72 28.28A14.5 14.5 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.57 10.75l8.15-6.47z"/><path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.49-4.95l-7.14-5.54C28.57 38.3 26.4 39 24 39c-6.24 0-11.57-4.22-13.28-9.93l-8.15 6.47C6.07 43.48 14.54 47 24 47z"/></svg>
                Google
              </button>
              <button onClick={()=>socialLogin(facebookProvider)} disabled={busy} className="bt"
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",background:"#1877F2",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:13,color:"#fff",minHeight:44}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                Facebook
              </button>
            </div>
            <div style={{marginTop:3,padding:"7px 10px",background:K.bg,borderRadius:7,border:`1px solid ${K.b0}`,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:K.t3,lineHeight:1.8}}>admin@accessplus.com</div>
          </>}
        </div>
      </div>
    </div>
  </div>;
}

// ── USER APP ──────────────────────────────────────────────────────────────────
function UA({uid,onOut}){
  const K=useK();const{mob}=useW();
  const[vue,sV]=useState("home"),[mod,sM]=useState(null),[quiz,sQ]=useState(null),[openQuiz,sOpenQuiz]=useState(null),[sub,sSub]=useState(false);
  const[uData,sUD]=useState(null),[pdfs,sPdfs]=useState({});
  const[showOnboarding,sShowOnboarding]=useState(false);
  const{mods,loading:mL}=useModules();
  const allPres=usePresentations();
  const allStages=useStages();
  const allPlats=usePlateformes();
  const allDemandes=useDemandes();
  const{vids,live}=useVideos();
  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"users",uid),(snap)=>{if(snap.exists())sUD({uid,...snap.data()});});
    const loadPdfs=async()=>{const snap=await getDocs(collection(db,"pdfs"));const p={};snap.forEach(d=>p[d.id]=d.data());sPdfs(p);};
    loadPdfs();
    return unsub;
  },[uid]);
  // Trigger onboarding for brand-new users (no progress, first visit)
  // Must be BEFORE any conditional return (Rules of Hooks)
  useEffect(()=>{
    if(uData&&Object.keys(uData.progress||{}).length===0&&!uData.onboardingDone){
      const t=setTimeout(()=>sShowOnboarding(true),800);return()=>clearTimeout(t);
    }
  },[uData]);
  const doneOnboarding=async(firstMod)=>{
    sShowOnboarding(false);
    await updateDoc(doc(db,"users",uid),{onboardingDone:true});
    if(firstMod){sM(firstMod);}
  };
  const{warning:uaWarn}=useAutoLogout(onOut);
  const myOpenAnswers=useMyOpenAnswers(uid);
  if(!uData||mL)return <div style={{minHeight:"100vh",background:K.bg}}><style>{mCss(K)}</style><Spin/></div>;
  const ok=uData.abonnement==="actif"&&!xp(uData.dateExpiration);
  const aMods=mods.filter(m=>m.on!==false);
  const pr=uData.progress||{},sc=uData.scores||{};
  const nd=aMods.filter(m=>pr[m.id]==="done").length,gp=aMods.length?Math.round(nd/aMods.length*100):0;
  const save=async(modId,s,t)=>{await saveProgress(uid,modId,{s,t,pct:Math.round(s/t*100)});};
  const markDoneNoEval=async modId=>{await updateDoc(doc(db,"users",uid),{[`progress.${modId}`]:"done"});sM(null);sV("res");};
  const W=(ch,hideNav)=><div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}><style>{mCss(K)}</style>{!hideNav&&<Nav u={uData} vue={vue} sV={v=>{sV(v);sM(null);}} ok={ok} onSub={()=>sSub(true)} onOut={onOut} live={live.on} uid={uid}/>}<main className="mp" style={{maxWidth:1060,margin:"0 auto",padding:hideNav?"14px":undefined,paddingBottom:hideNav?20:(mob?80:20)}}>{ch}</main>{sub&&<SubM onClose={()=>sSub(false)} uid={uid} u={uData}/>}{showOnboarding&&<Onboarding u={uData} onDone={doneOnboarding} mods={aMods}/>}<AutoLogoutBanner warning={uaWarn} mob={mob}/></div>;
  if(quiz)return W(<QZ mod={quiz} onDone={async(s,t)=>{await save(quiz.id,s,t);sQ(null);sM(null);sV("res");}} onBack={()=>sQ(null)}/>);
  if(openQuiz)return W(<OpenQuiz mod={openQuiz} uid={uid} uNom={uData.nom} onDone={()=>{sOpenQuiz(null);sM(null);sV("res");}} onBack={()=>sOpenQuiz(null)}/>,true);
  if(mod)return W(<MV mod={mod} sc={sc[mod.id]} ok={ok} onQ={()=>sQ(mod)} onOpenQ={()=>sOpenQuiz(mod)} onMarkDone={()=>markDoneNoEval(mod.id)} doneNoEval={pr[mod.id]==="done"} openAnswer={myOpenAnswers.find(a=>a.modId===mod.id)} onBack={()=>sM(null)} onSub={()=>sSub(true)} vids={vids.filter(v=>v.mid===mod.id)} pdf={pdfs[mod.id]} uid={uid} uNom={uData.nom}/>,true);
  return W(<>
    {vue==="home"&&<Home u={uData} pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods} vids={vids} onOpen={sM} onSub={()=>sSub(true)} onVid={()=>sV("videos")} onPres={()=>sV("pres")} onStages={()=>sV("stages")} live={live} presCount={allPres.length} uid={uid}/>}
    {vue==="videos"&&<VidsPage ok={ok} onSub={()=>sSub(true)} vids={vids} live={live}/>}
    {vue==="pres"&&<PresPage ok={ok} onSub={()=>sSub(true)} pres={allPres.filter(p=>p.on!==false)}/>
    }{vue==="stages"&&<StagePage stages={allStages} plats={allPlats} ok={ok}/>
    }{vue==="services"&&<ServicesPage user={uData}/>}
    {vue==="prog"&&<Prog pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods}/>}
    {vue==="res"&&<Res sc={sc} ok={ok} mods={aMods}/>}
    {vue==="psycho"&&<PsychoPage uid={uid} u={uData}/>}
    {vue==="msg"&&<MessagerieApprenant uid={uid} uNom={uData.nom}/>}
  </>);
}

// ══════════════════ PSYCHOTECHNIQUE ══════════════════
const PSY_LEVELS=[
  {id:"facile",   label:"Facile",         n:10,dur:300,col:"#34D399",ico:"mood-smile"},
  {id:"moyen",    label:"Moyen",          n:12,dur:420,col:"#60A5FA",ico:"gauge"},
  {id:"difficile",label:"Difficile",      n:15,dur:600,col:"#FBBF24",ico:"flame"},
  {id:"tresdiff", label:"Très difficile", n:15,dur:720,col:"#FB923C",ico:"bolt"},
  {id:"expert",   label:"Expert",         n:20,dur:900,col:"#F87171",ico:"crown"},
];
const PSY_CATS=[
  {id:"suites",label:"Suites logiques & numériques",ico:"arrows-shuffle",col:"#34D399"},
  {id:"intel", label:"Jeux d'intelligence",          ico:"bulb",           col:"#60A5FA"},
  {id:"fig",   label:"Figures",                      ico:"shape",          col:"#FBBF24"},
  {id:"fr",    label:"Grammaire & vocabulaire",      ico:"language",       col:"#A78BFA"},
  {id:"ang",   label:"Anglais de base",              ico:"flag",           col:"#FB923C"},
  {id:"dominos",label:"Dominos & cartes",             ico:"dice-5",         col:"#F87171"},
  {id:"calc",  label:"Calcul mental & problèmes",     ico:"calculator",     col:"#2DD4BF"},
  {id:"logv",  label:"Logique verbale",               ico:"abc",            col:"#F472B6"},
  {id:"att",   label:"Attention & observation",       ico:"eye",            col:"#94A3B8"},
];
const psyNorm=v=>String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"").replace(/,/g,".");
const PSY_BANK=[
// ───── DOMINOS & CARTES ─────
{id:"do_f1",cat:"dominos",niv:"facile",q:"Série de dominos : 1-2, 3-4, 5-6, ?-? (valeurs de 0 à 6, en boucle)",opts:["0-1","6-0","1-2","2-3"],a:0,exp:"Après 6, on repasse à 0 : la suite continue 0-1."},
{id:"do_f2",cat:"dominos",niv:"facile",libre:true,q:"Suite de dominos (valeurs 0 à 6) : 2, 3, 4, 5, … Quelle valeur suit ?",a:"6",exp:"Progression +1 : après 5 vient 6."},
{id:"do_m1",cat:"dominos",niv:"moyen",q:"Série décroissante : 6-5, 4-3, 2-1, ?-?",opts:["0-6","1-0","6-5","0-5"],a:0,exp:"On continue à descendre : 0, puis boucle sur 6."},
{id:"do_m2",cat:"dominos",niv:"moyen",libre:true,q:"Dominos (0 à 6, en boucle), on ajoute 2 à chaque case : 1, 3, 5, 0, 2, … Valeur suivante ?",a:"4",exp:"2 + 2 = 4."},
{id:"do_d1",cat:"dominos",niv:"difficile",q:"Chaque colonne de dominos totalise 10 points. Une colonne affiche 6 et 3 : la case manquante vaut…",opts:["0","1","2","3"],a:1,exp:"6 + 3 = 9, il manque 1 pour atteindre 10."},
{id:"do_d2",cat:"dominos",niv:"difficile",libre:true,q:"La somme des deux cases de chaque domino est toujours 7. Un domino montre 5 : l'autre case ?",a:"2",exp:"7 − 5 = 2."},
{id:"do_t1",cat:"dominos",niv:"tresdiff",q:"Progression alternée +1, +2 (valeurs 0 à 6 en boucle) : 1, 2, 4, 5, …",opts:["6","0","1","7"],a:1,exp:"5 + 2 = 7, mais le maximum est 6 : on boucle → 0."},
{id:"do_t2",cat:"dominos",niv:"tresdiff",libre:true,q:"Cartes : les colonnes totalisent 6, 8, 10. Total de la 4e colonne ?",a:"12",exp:"Progression de +2 : 10 + 2 = 12."},
{id:"do_e1",cat:"dominos",niv:"expert",q:"Deux séries imbriquées : cases hautes 2, 3, 4, ? — cases basses 6, 5, 4, ?",opts:["5 et 3","4 et 3","5 et 4","6 et 2"],a:0,exp:"Haut : +1 → 5. Bas : −1 → 3."},
{id:"do_e2",cat:"dominos",niv:"expert",libre:true,q:"Dominos en boucle (0 à 6), on retire 2 à chaque case : 5, 3, 1, 6, … Valeur suivante ?",a:"4",exp:"6 − 2 = 4."},
// ───── CALCUL MENTAL & PROBLÈMES ─────
{id:"ca_f1",cat:"calc",niv:"facile",q:"17 + 26 = ?",opts:["41","43","33","45"],a:1,exp:"17 + 26 = 43."},
{id:"ca_f2",cat:"calc",niv:"facile",libre:true,q:"12 × 5 = ?",a:"60",exp:"12 × 5 = 60."},
{id:"ca_m1",cat:"calc",niv:"moyen",q:"15 % de 240 = ?",opts:["24","36","32","40"],a:1,exp:"10 % = 24 ; 5 % = 12 ; total 36."},
{id:"ca_m2",cat:"calc",niv:"moyen",libre:true,q:"144 ÷ 12 = ?",a:"12",exp:"12 × 12 = 144."},
{id:"ca_d1",cat:"calc",niv:"difficile",q:"Un article de 80 000 FC est soldé de 25 %. Prix final ?",opts:["55 000 FC","60 000 FC","65 000 FC","20 000 FC"],a:1,exp:"25 % de 80 000 = 20 000 ; 80 000 − 20 000 = 60 000."},
{id:"ca_d2",cat:"calc",niv:"difficile",libre:true,q:"3 ouvriers construisent un mur en 12 jours. Combien de jours faut-il à 4 ouvriers ?",a:"9",exp:"3 × 12 = 36 jours-homme ; 36 ÷ 4 = 9."},
{id:"ca_t1",cat:"calc",niv:"tresdiff",q:"200 000 FC placés à 5 % par an (intérêt simple). Intérêts après 2 ans ?",opts:["10 000 FC","20 000 FC","25 000 FC","15 000 FC"],a:1,exp:"5 % de 200 000 = 10 000 par an × 2 = 20 000."},
{id:"ca_t2",cat:"calc",niv:"tresdiff",libre:true,q:"17 × 6 = ?",a:"102",exp:"17 × 6 = 102."},
{id:"ca_e1",cat:"calc",niv:"expert",q:"Un père a 3 fois l'âge de son fils. Dans 12 ans, il aura le double. Âge actuel du fils ?",opts:["10 ans","12 ans","14 ans","15 ans"],a:1,exp:"3x + 12 = 2(x + 12) → x = 12."},
{id:"ca_e2",cat:"calc",niv:"expert",libre:true,q:"1 + 2 + 3 + … + 20 = ?",a:"210",exp:"n(n+1)/2 = 20 × 21 ÷ 2 = 210."},
// ───── LOGIQUE VERBALE ─────
{id:"lv_f1",cat:"logv",niv:"facile",q:"Quel est l'intrus ?",opts:["Pomme","Banane","Carotte","Mangue"],a:2,exp:"La carotte est un légume, les autres sont des fruits."},
{id:"lv_f2",cat:"logv",niv:"facile",libre:true,q:"Le chat est au chaton ce que la poule est au…",a:"poussin",exp:"Relation adulte → petit."},
{id:"lv_m1",cat:"logv",niv:"moyen",q:"Tous les comptables sont rigoureux. Jean est comptable. Donc…",opts:["Jean est rigoureux","Jean est prudent","On ne peut rien conclure","Jean aime les chiffres"],a:0,exp:"Syllogisme valide : la conclusion découle des prémisses."},
{id:"lv_m2",cat:"logv",niv:"moyen",libre:true,q:"Anagramme d'un métier : T-R-É-S-O-R-I-E-R",a:"tresorier",exp:"TRÉSORIER."},
{id:"lv_d1",cat:"logv",niv:"difficile",q:"Antonyme de « prodigue » ?",opts:["Généreux","Économe","Riche","Dépensier"],a:1,exp:"Prodigue = qui dépense sans compter ; son contraire est économe."},
{id:"lv_d2",cat:"logv",niv:"difficile",libre:true,q:"« Recevoir » au passé simple, 3e personne du singulier ?",a:"reçut",exp:"Il reçut."},
{id:"lv_t1",cat:"logv",niv:"tresdiff",q:"Si aucun A n'est B, et que certains C sont B, alors…",opts:["Certains C ne sont pas A","Tous les C sont A","Aucun C n'est A","Certains A sont C"],a:0,exp:"Les C qui sont B ne peuvent pas être A."},
{id:"lv_t2",cat:"logv",niv:"tresdiff",libre:true,q:"Devinette : je commence la nuit et je finis le matin. Qui suis-je ? (une lettre)",a:"n",exp:"La lettre N : Nuit… matiN."},
{id:"lv_e1",cat:"logv",niv:"expert",q:"PLUME est à ÉCRIRE ce que CISEAUX est à…",opts:["Couper","Papier","Coudre","Tailleur"],a:0,exp:"Relation outil → fonction."},
{id:"lv_e2",cat:"logv",niv:"expert",libre:true,q:"Anagramme : C-O-M-P-T-A-B-I-L-I-T-É",a:"comptabilite",exp:"COMPTABILITÉ."},
// ───── ATTENTION & OBSERVATION ─────
{id:"at_f1",cat:"att",niv:"facile",q:"Combien de voyelles dans « FORMATION » ?",opts:["3","4","5","2"],a:1,exp:"O, A, I, O = 4 voyelles."},
{id:"at_f2",cat:"att",niv:"facile",libre:true,q:"Combien de fois la lettre S apparaît-elle dans « SYSCOHADA » ?",a:"2",exp:"S-Y-S… : 2 fois."},
{id:"at_m1",cat:"att",niv:"moyen",q:"Dans 5 8 2 7 3 6 4 5 9 1, combien de chiffres pairs ?",opts:["3","4","5","6"],a:1,exp:"8, 2, 6, 4 : quatre chiffres pairs."},
{id:"at_m2",cat:"att",niv:"moyen",libre:true,q:"Combien de lettres E dans « ECO-CAMPUS EXCELLENCE » ?",a:"5",exp:"1 dans ECO + 4 dans EXCELLENCE = 5."},
{id:"at_d1",cat:"att",niv:"difficile",q:"Si vous lisez VENDREDI à l'envers, la 3e lettre est…",opts:["D","E","R","N"],a:1,exp:"IDERDNEV → I, D, E : la 3e est E."},
{id:"at_d2",cat:"att",niv:"difficile",libre:true,q:"Combien de lettres A dans « ACCESS PLUS ACADEMIA KINSHASA » ?",a:"6",exp:"1 + 3 + 2 = 6."},
{id:"at_t1",cat:"att",niv:"tresdiff",q:"Suite répétitive : 7 4 9 2 7 4 9 2 7 4 … Quel est le 11e élément ?",opts:["7","4","9","2"],a:2,exp:"Période de 4 : le 11e correspond au 3e → 9."},
{id:"at_t2",cat:"att",niv:"tresdiff",libre:true,q:"Quelle est la 4e lettre après P dans l'alphabet ?",a:"t",exp:"Q, R, S, T."},
{id:"at_e1",cat:"att",niv:"expert",q:"Dans « 383538335833 », combien de fois voit-on « 83 » ?",opts:["2","3","4","5"],a:1,exp:"Positions 2-3, 6-7 et 10-11 : trois fois."},
{id:"at_e2",cat:"att",niv:"expert",libre:true,q:"Combien de lettres différentes dans « MERCREDI » ?",a:"6",exp:"M, E, R, C, D, I = 6."},
// ───── SUITES (logiques & numériques) ─────
{id:"su_f1",cat:"suites",niv:"facile",q:"Quel nombre complète la suite ? 5, 10, 15, 20, 25, …",opts:["28","30","35","32"],a:1,exp:"On ajoute 5 à chaque terme : 25 + 5 = 30."},
{id:"su_f2",cat:"suites",niv:"facile",q:"Quel nombre complète la suite ? 2, 4, 6, 8, 10, …",opts:["11","12","14","13"],a:1,exp:"Suite des nombres pairs : 10 + 2 = 12."},
{id:"su_f3",cat:"suites",niv:"facile",q:"Quel nombre complète la suite ? 1, 3, 5, 7, 9, …",opts:["10","11","13","12"],a:1,exp:"Suite des nombres impairs : 9 + 2 = 11."},
{id:"su_f4",cat:"suites",niv:"facile",q:"Quel nombre complète la suite ? 100, 90, 80, 70, …",opts:["65","50","60","55"],a:2,exp:"On retire 10 à chaque terme : 70 − 10 = 60."},
{id:"su_m1",cat:"suites",niv:"moyen",q:"Quel nombre complète la suite ? 1, 2, 4, 8, 16, …",opts:["24","30","32","20"],a:2,exp:"Chaque terme est multiplié par 2 : 16 × 2 = 32."},
{id:"su_m2",cat:"suites",niv:"moyen",q:"Quel nombre complète la suite ? 3, 6, 12, 24, …",opts:["36","42","30","48"],a:3,exp:"Chaque terme est multiplié par 2 : 24 × 2 = 48."},
{id:"su_m3",cat:"suites",niv:"moyen",q:"Quel nombre complète la suite ? 2, 5, 8, 11, 14, …",opts:["16","17","18","20"],a:1,exp:"On ajoute 3 à chaque terme : 14 + 3 = 17."},
{id:"su_m4",cat:"suites",niv:"moyen",q:"Quel nombre complète la suite ? 1, 4, 9, 16, 25, …",opts:["30","32","49","36"],a:3,exp:"Suite des carrés (1², 2², 3²…) : 6² = 36."},
{id:"su_d1",cat:"suites",niv:"difficile",q:"Quel nombre complète la suite ? 2, 3, 5, 8, 12, …",opts:["16","18","15","17"],a:3,exp:"Les écarts augmentent de 1 en 1 (+1,+2,+3,+4,+5) : 12+5=17."},
{id:"su_d2",cat:"suites",niv:"difficile",q:"Quel nombre complète la suite ? 1, 1, 2, 3, 5, 8, …",opts:["11","12","13","14"],a:2,exp:"Suite de Fibonacci : chaque terme est la somme des deux précédents (5+8=13)."},
{id:"su_d3",cat:"suites",niv:"difficile",q:"Quel nombre complète la suite ? 1, 2, 6, 24, 120, …",opts:["600","640","720","540"],a:2,exp:"Chaque terme est multiplié par le rang suivant (×2,×3,×4,×5,×6) : 120×6=720."},
{id:"su_d4",cat:"suites",niv:"difficile",q:"Quel nombre complète la suite ? 3, 7, 15, 31, 63, …",opts:["125","124","127","128"],a:2,exp:"Chaque terme = (précédent × 2) + 1 : 63×2+1=127."},
{id:"su_t1",cat:"suites",niv:"tresdiff",q:"Quel nombre complète la suite ? 1, 4, 9, 16, 25, 36, …",opts:["42","45","48","49"],a:3,exp:"Suite des carrés successifs : 7² = 49."},
{id:"su_t2",cat:"suites",niv:"tresdiff",q:"Quel nombre complète la suite ? 2, 3, 5, 7, 11, 13, …",opts:["15","16","17","19"],a:2,exp:"Suite des nombres premiers : après 13, le suivant est 17."},
{id:"su_t3",cat:"suites",niv:"tresdiff",q:"Quel nombre complète la suite ? 1, 8, 27, 64, 125, …",opts:["200","196","210","216"],a:3,exp:"Suite des cubes (1³, 2³, 3³…) : 6³ = 216."},
{id:"su_t4",cat:"suites",niv:"tresdiff",q:"Quel nombre complète la suite ? 1, 2, 4, 7, 11, 16, …",opts:["20","21","23","22"],a:3,exp:"Les écarts augmentent de 1 (+1,+2,+3,+4,+5,+6) : 16+6=22."},
{id:"su_e1",cat:"suites",niv:"expert",q:"Quel nombre complète la suite ? 2, 6, 12, 20, 30, 42, …",opts:["54","52","58","56"],a:3,exp:"Formule n(n+1) : 7×8=56 (2=1×2, 6=2×3, 12=3×4…)."},
{id:"su_e2",cat:"suites",niv:"expert",q:"Quel nombre complète la suite ? 1, 3, 6, 10, 15, 21, …",opts:["27","26","29","28"],a:3,exp:"Nombres triangulaires : on ajoute +2,+3,+4,+5,+6,+7 : 21+7=28."},
{id:"su_e3",cat:"suites",niv:"expert",q:"Quel nombre complète la suite ? 5, 11, 23, 47, 95, …",opts:["189","192","188","191"],a:3,exp:"Chaque terme = (précédent × 2) + 1 : 95×2+1=191."},
{id:"su_e4",cat:"suites",niv:"expert",q:"Quel nombre complète la suite ? 2, 3, 7, 16, 32, 57, …",opts:["90","95","88","93"],a:3,exp:"Écarts : +1,+4,+9,+16,+25 (carrés). Après +25 vient +36 : 57+36=93."},
// ───── JEUX D'INTELLIGENCE ─────
{id:"in_f1",cat:"intel",niv:"facile",q:"Si tous les chats sont des animaux et que Félix est un chat, alors Félix est…",opts:["un animal","une plante","un objet","un chien"],a:0,exp:"Félix appartient à la catégorie « chat », donc à la catégorie « animal »."},
{id:"in_f2",cat:"intel",niv:"facile",q:"Marie est plus grande que Julie. Julie est plus grande que Sophie. Qui est la plus petite ?",opts:["Marie","Julie","Sophie","Impossible à dire"],a:2,exp:"Marie > Julie > Sophie, donc Sophie est la plus petite."},
{id:"in_f3",cat:"intel",niv:"facile",q:"Combien font 2 douzaines ?",opts:["20","24","12","26"],a:1,exp:"Une douzaine = 12, donc 2 douzaines = 24."},
{id:"in_f4",cat:"intel",niv:"facile",q:"Un train part à 14h et arrive à 16h30. Combien de temps a duré le trajet ?",opts:["2h","2h30","3h","1h30"],a:1,exp:"De 14h à 16h30, il s'écoule 2 heures et 30 minutes."},
{id:"in_m1",cat:"intel",niv:"moyen",q:"J'ai 3 ans de plus que mon frère. Il a 10 ans. Quel âge ai-je ?",opts:["10 ans","12 ans","13 ans","7 ans"],a:2,exp:"10 + 3 = 13 ans."},
{id:"in_m2",cat:"intel",niv:"moyen",q:"Si 3 crayons coûtent 6 $, combien coûtent 5 crayons (au même prix unitaire) ?",opts:["8 $","9 $","10 $","12 $"],a:2,exp:"1 crayon = 2 $, donc 5 crayons = 10 $."},
{id:"in_m3",cat:"intel",niv:"moyen",q:"Paul est plus rapide que Marc. Marc est plus rapide que Julie. Qui est le plus lent ?",opts:["Paul","Marc","Julie","Impossible à dire"],a:2,exp:"Paul > Marc > Julie en rapidité, donc Julie est la plus lente."},
{id:"in_m4",cat:"intel",niv:"moyen",q:"Un fermier a 10 vaches. Toutes sauf 3 s'échappent. Combien lui en reste-t-il ?",opts:["3","7","10","0"],a:0,exp:"« Toutes sauf 3 » s'échappent signifie qu'il ne reste que ces 3 vaches-là."},
{id:"in_d1",cat:"intel",niv:"difficile",q:"3 ouvriers construisent un mur en 6 jours. Combien de jours faudra-t-il à 6 ouvriers, au même rythme, pour le même mur ?",opts:["2","3","4","6"],a:1,exp:"3 ouvriers × 6 jours = 18 « jours-ouvrier ». Avec 6 ouvriers : 18 ÷ 6 = 3 jours."},
{id:"in_d2",cat:"intel",niv:"difficile",q:"Dans 5 ans, j'aurai le double de l'âge que j'avais il y a 5 ans. Quel âge ai-je aujourd'hui ?",opts:["10 ans","15 ans","20 ans","25 ans"],a:1,exp:"Si x est mon âge : x+5 = 2(x−5) → x+5 = 2x−10 → x = 15 ans."},
{id:"in_d3",cat:"intel",niv:"difficile",q:"Trois amies (Ana, Léa, Zoé) aiment chacune une couleur différente (rouge, bleu, vert). Ana n'aime pas le rouge. Léa n'aime ni le bleu ni le rouge. Quelle est la couleur préférée de Léa ?",opts:["Rouge","Bleu","Vert","Impossible à dire"],a:2,exp:"Léa n'aime ni le bleu ni le rouge : il ne lui reste que le vert."},
{id:"in_d4",cat:"intel",niv:"difficile",q:"Combien de fois par jour (24h) les aiguilles d'une horloge se superposent-elles exactement ?",opts:["24","22","12","20"],a:1,exp:"Les aiguilles se superposent 22 fois en 24 heures (fait classique d'horlogerie)."},
{id:"in_t1",cat:"intel",niv:"tresdiff",q:"A fait un travail en 4 heures, B le même travail en 6 heures. En combien de temps le termineront-ils en travaillant ensemble ?",opts:["2h","2h24","2h30","5h"],a:1,exp:"1/4 + 1/6 = 5/12 du travail par heure → temps = 12/5 = 2,4h = 2h24."},
{id:"in_t2",cat:"intel",niv:"tresdiff",q:"Le père a 4 fois l'âge de son fils. Dans 20 ans, il aura seulement le double de l'âge de son fils. Quel âge a le fils aujourd'hui ?",opts:["5 ans","8 ans","10 ans","15 ans"],a:2,exp:"4x+20 = 2(x+20) → 4x+20 = 2x+40 → 2x = 20 → x = 10 ans."},
{id:"in_t3",cat:"intel",niv:"tresdiff",q:"Trois personnes (Tom, Ali, Zia) ont chacune un métier différent (médecin, ingénieur, professeur). Tom n'est pas médecin. Ali n'est ni ingénieur ni médecin. Quel est le métier d'Ali ?",opts:["Médecin","Ingénieur","Professeur","Impossible à dire"],a:2,exp:"Ali n'est ni ingénieur ni médecin : il ne lui reste que professeur."},
{id:"in_t4",cat:"intel",niv:"tresdiff",q:"Un fermier doit traverser une rivière avec un loup, une chèvre et un chou. Le bateau ne transporte que le fermier et un seul élément à la fois. Seuls ensemble, le loup mangerait la chèvre, et la chèvre mangerait le chou. Que doit-il transporter en premier ?",opts:["Le loup","La chèvre","Le chou","Peu importe"],a:1,exp:"Il faut emmener la chèvre en premier : seule, ni le loup-chou (qui ne se menacent pas) ne posent problème."},
{id:"in_e1",cat:"intel",niv:"expert",q:"A, B et C terminent seuls un travail en 6h, 8h et 12h. Combien de temps mettront-ils en travaillant tous les trois ensemble ?",opts:["2h","2h40","3h","4h"],a:1,exp:"1/6+1/8+1/12 = 9/24 = 3/8 du travail par heure → temps = 8/3 ≈ 2h40."},
{id:"in_e2",cat:"intel",niv:"expert",q:"La mère a le triple de l'âge de sa fille. Dans 12 ans, elle aura seulement le double de l'âge de sa fille. Quel est l'âge actuel de la fille ?",opts:["8 ans","10 ans","12 ans","15 ans"],a:2,exp:"3x+12 = 2(x+12) → 3x+12 = 2x+24 → x = 12 ans."},
{id:"in_e3",cat:"intel",niv:"expert",q:"Quatre coureurs : A finit avant B. C finit après D mais avant A. Qui a fini en dernier ?",opts:["A","B","C","D"],a:1,exp:"Ordre déduit : D < C < A < B. Le dernier arrivé est B."},
{id:"in_e4",cat:"intel",niv:"expert",q:"On lance deux dés à 6 faces. Quelle est la probabilité d'obtenir une somme égale à 7 ?",opts:["1/12","1/6","1/8","1/4"],a:1,exp:"6 combinaisons sur 36 donnent 7 (1-6,2-5,3-4,4-3,5-2,6-1) : 6/36 = 1/6."},
// ───── FIGURES ─────
{id:"fi_f1",cat:"fig",niv:"facile",q:"Combien de côtés a un triangle ?",opts:["2","3","4","5"],a:1,exp:"Un triangle possède 3 côtés."},
{id:"fi_f2",cat:"fig",niv:"facile",q:"Combien de côtés a un carré ?",opts:["3","4","5","6"],a:1,exp:"Un carré possède 4 côtés égaux."},
{id:"fi_f3",cat:"fig",niv:"facile",q:"Quelle figure complète la suite ? ○ △ ○ △ ○ △ ?",opts:["○","△","▢","◇"],a:0,exp:"La suite alterne cercle puis triangle : après △ vient ○."},
{id:"fi_f4",cat:"fig",niv:"facile",q:"Combien de sommets (coins) a un carré ?",opts:["3","4","5","6"],a:1,exp:"Un carré a 4 sommets, un à chaque coin."},
{id:"fi_m1",cat:"fig",niv:"moyen",q:"Combien de faces possède un cube ?",opts:["4","6","8","12"],a:1,exp:"Un cube a 6 faces carrées."},
{id:"fi_m2",cat:"fig",niv:"moyen",q:"Combien d'arêtes possède un cube ?",opts:["6","8","10","12"],a:3,exp:"Un cube possède 12 arêtes."},
{id:"fi_m3",cat:"fig",niv:"moyen",q:"Quelle figure complète la suite ? △ △ ▢ △ △ ▢ △ △ ?",opts:["△","▢","○","◇"],a:1,exp:"Le motif se répète par groupes de 3 (△ △ ▢) : le 9ᵉ élément est ▢."},
{id:"fi_m4",cat:"fig",niv:"moyen",q:"Combien de sommets a une pyramide à base carrée ?",opts:["4","5","6","8"],a:1,exp:"4 sommets à la base + 1 sommet au-dessus = 5."},
{id:"fi_d1",cat:"fig",niv:"difficile",q:"Combien de diagonales possède un carré ?",opts:["1","2","3","4"],a:1,exp:"Un carré (4 côtés) possède 2 diagonales."},
{id:"fi_d2",cat:"fig",niv:"difficile",q:"Combien de diagonales possède un hexagone (6 côtés) ?",opts:["6","9","12","15"],a:1,exp:"Formule n(n−3)/2 : 6×3/2 = 9 diagonales."},
{id:"fi_d3",cat:"fig",niv:"difficile",q:"Une flèche pointe vers le Nord. Elle tourne de 90° dans le sens horaire, puis encore de 90°. Vers où pointe-t-elle maintenant ?",opts:["Nord","Est","Sud","Ouest"],a:2,exp:"Nord +90°=Est, Est +90°=Sud. Elle pointe vers le Sud."},
{id:"fi_d4",cat:"fig",niv:"difficile",q:"Combien de côtés a un polygone dont la somme des angles intérieurs vaut 540° ?",opts:["4","5","6","7"],a:1,exp:"Formule (n−2)×180=540 → n−2=3 → n=5 côtés (pentagone)."},
{id:"fi_t1",cat:"fig",niv:"tresdiff",q:"Combien de diagonales possède un octogone (8 côtés) ?",opts:["16","20","24","28"],a:1,exp:"Formule n(n−3)/2 : 8×5/2 = 20 diagonales."},
{id:"fi_t2",cat:"fig",niv:"tresdiff",q:"Une aiguille pointe sur le 3 (comme sur une horloge). Elle avance de 6 heures dans le sens horaire, puis encore de 3 heures. Sur quel chiffre s'arrête-t-elle ?",opts:["6","9","12","3"],a:2,exp:"3 + 6 = 9, puis 9 + 3 = 12 (modulo 12). Elle s'arrête sur le 12."},
{id:"fi_t3",cat:"fig",niv:"tresdiff",q:"Combien de faces possède un prisme à base pentagonale (5 côtés) ?",opts:["5","6","7","8"],a:2,exp:"2 bases pentagonales + 5 faces rectangulaires latérales = 7 faces."},
{id:"fi_t4",cat:"fig",niv:"tresdiff",q:"Un cube est peint en rouge puis découpé en 27 petits cubes égaux (3×3×3). Combien de petits cubes ont exactement 2 faces peintes ?",opts:["6","8","12","24"],a:2,exp:"Ce sont les petits cubes situés sur les arêtes (hors coins) : 12 arêtes × 1 cube = 12."},
{id:"fi_e1",cat:"fig",niv:"expert",q:"Un cube peint en rouge est découpé en 64 petits cubes égaux (4×4×4). Combien ont exactement 1 face peinte ?",opts:["8","12","24","36"],a:2,exp:"Ce sont les centres de face : 6 faces × (4−2)² = 6×4 = 24."},
{id:"fi_e2",cat:"fig",niv:"expert",q:"Combien de diagonales possède un décagone (10 côtés) ?",opts:["25","30","35","40"],a:2,exp:"Formule n(n−3)/2 : 10×7/2 = 35 diagonales."},
{id:"fi_e3",cat:"fig",niv:"expert",q:"Une aiguille part du 12. Elle avance de 5 heures dans le sens horaire, recule de 8 heures, puis avance de 11 heures. Sur quel chiffre s'arrête-t-elle ?",opts:["6","7","8","9"],a:2,exp:"12(0) +5=5, −8=−3≡9, +11=20≡8 (modulo 12). Elle s'arrête sur le 8."},
{id:"fi_e4",cat:"fig",niv:"expert",q:"Un cube peint en rouge est découpé en 125 petits cubes égaux (5×5×5). Combien n'ont AUCUNE face peinte ?",opts:["8","27","54","64"],a:1,exp:"Ce sont les petits cubes du cœur, invisibles de l'extérieur : (5−2)³ = 3³ = 27."},
// ───── GRAMMAIRE & VOCABULAIRE ─────
{id:"fr_f1",cat:"fr",niv:"facile",q:"Quel est le synonyme de « content » ?",opts:["Triste","Joyeux","Fâché","Fatigué"],a:1,exp:"« Content » et « joyeux » expriment tous deux la satisfaction."},
{id:"fr_f2",cat:"fr",niv:"facile",q:"Quel est le pluriel de « journal » ?",opts:["Journals","Journaux","Journales","Journeaux"],a:1,exp:"Les mots en -al font leur pluriel en -aux : journaux."},
{id:"fr_f3",cat:"fr",niv:"facile",q:"Quel est le contraire de « grand » ?",opts:["Petit","Gros","Long","Large"],a:0,exp:"« Petit » est l'antonyme direct de « grand »."},
{id:"fr_f4",cat:"fr",niv:"facile",q:"Complétez : « Les enfants ___ au parc. »",opts:["joue","jouent","joues","jouer"],a:1,exp:"Sujet pluriel « les enfants » → « jouent »."},
{id:"fr_m1",cat:"fr",niv:"moyen",q:"Quel est le contraire de « généreux » ?",opts:["Avare","Riche","Gentil","Aimable"],a:0,exp:"« Avare » est l'antonyme de « généreux »."},
{id:"fr_m2",cat:"fr",niv:"moyen",q:"Quel est le synonyme de « rapide » ?",opts:["Lent","Véloce","Lourd","Faible"],a:1,exp:"« Véloce » signifie qui va vite."},
{id:"fr_m3",cat:"fr",niv:"moyen",q:"Complétez : « Elle ___ partie hier. »",opts:["a","est","es","ont"],a:1,exp:"Le verbe « partir » se conjugue avec « être » : elle est partie."},
{id:"fr_m4",cat:"fr",niv:"moyen",q:"Quel est le féminin de « heureux » ?",opts:["Heureuxe","Heureuse","Heureus","Heureue"],a:1,exp:"Les adjectifs en -eux font leur féminin en -euse : heureuse."},
{id:"fr_d1",cat:"fr",niv:"difficile",q:"Quel est le participe passé du verbe « prendre » ?",opts:["Prendu","Prit","Pris","Prendé"],a:2,exp:"Le participe passé de « prendre » est « pris »."},
{id:"fr_d2",cat:"fr",niv:"difficile",q:"Complétez : « Il faut que tu ___ tes devoirs. »",opts:["fais","fait","fasses","faire"],a:2,exp:"« Il faut que » impose le subjonctif : que tu fasses."},
{id:"fr_d3",cat:"fr",niv:"difficile",q:"Que signifie « éphémère » ?",opts:["Qui dure longtemps","Qui dure peu de temps","Qui est solide","Qui est ancien"],a:1,exp:"« Éphémère » qualifie ce qui dure très peu de temps."},
{id:"fr_d4",cat:"fr",niv:"difficile",q:"Complétez correctement : « ___ chiens aboient fort. »",opts:["Leur","Leurs","Leures","Leurres"],a:1,exp:"Devant un nom pluriel, on écrit « leurs » : leurs chiens."},
{id:"fr_t1",cat:"fr",niv:"tresdiff",q:"Quel est le pluriel de « un travail » ?",opts:["Travails","Travaux","Travaus","Travailles"],a:1,exp:"Les mots en -ail font souvent leur pluriel en -aux : travaux."},
{id:"fr_t2",cat:"fr",niv:"tresdiff",q:"Complétez : « Je me suis ___ les mains. »",opts:["lavé","lavée","lavés","lavées"],a:0,exp:"Le COD « les mains » est placé après le verbe : le participe reste invariable (lavé)."},
{id:"fr_t3",cat:"fr",niv:"tresdiff",q:"Que signifie « acrimonie » ?",opts:["Une joie profonde","Une amertume, un ton aigre","Une grande générosité","Un calme absolu"],a:1,exp:"« Acrimonie » désigne une amertume ou une aigreur dans le ton, les propos."},
{id:"fr_t4",cat:"fr",niv:"tresdiff",q:"Quel est le contraire de « prolixe » (qui parle beaucoup) ?",opts:["Bavard","Laconique","Verbeux","Loquace"],a:1,exp:"« Laconique » signifie qui s'exprime en peu de mots, l'inverse de « prolixe »."},
{id:"fr_e1",cat:"fr",niv:"expert",q:"Quelle est la nature grammaticale de « que » dans « Je pense que tu as raison » ?",opts:["Pronom relatif","Conjonction de subordination","Adverbe","Préposition"],a:1,exp:"Il introduit une proposition subordonnée complétive : c'est une conjonction de subordination."},
{id:"fr_e2",cat:"fr",niv:"expert",q:"Complétez avec le bon accord : « Les fleurs que j'ai ___. »",opts:["cueilli","cueillie","cueillis","cueillies"],a:3,exp:"Le COD « que » (=fleurs, féminin pluriel) est placé avant le verbe : accord obligatoire → cueillies."},
{id:"fr_e3",cat:"fr",niv:"expert",q:"Que signifie l'expression « avoir maille à partir avec quelqu'un » ?",opts:["Être ami intime avec lui","Avoir un différend avec lui","Partager un repas avec lui","Être en vacances avec lui"],a:1,exp:"Cette expression signifie avoir une dispute, un différend avec quelqu'un."},
{id:"fr_e4",cat:"fr",niv:"expert",q:"Que signifie le mot « pléonasme » ?",opts:["Une figure de style comparant deux choses","Une répétition inutile d'une idée déjà exprimée","Une exagération volontaire","Un jeu de mots"],a:1,exp:"Un pléonasme est une redondance : répéter une idée déjà exprimée (ex : « monter en haut »)."},
// ───── ANGLAIS DE BASE ─────
{id:"an_f1",cat:"ang",niv:"facile",q:"Comment dit-on « chat » en anglais ?",opts:["Cat","Dog","Bird","Fish"],a:0,exp:"« Cat » signifie chat en anglais."},
{id:"an_f2",cat:"ang",niv:"facile",q:"Comment dit-on « merci » en anglais ?",opts:["Please","Thank you","Sorry","Hello"],a:1,exp:"« Thank you » signifie merci."},
{id:"an_f3",cat:"ang",niv:"facile",q:"Complétez : « I ___ a student. »",opts:["is","are","am","be"],a:2,exp:"À la 1ʳᵉ personne du singulier, le verbe « to be » donne « am »."},
{id:"an_f4",cat:"ang",niv:"facile",q:"Comment dit-on « rouge » en anglais ?",opts:["Blue","Red","Green","Yellow"],a:1,exp:"« Red » signifie rouge en anglais."},
{id:"an_m1",cat:"ang",niv:"moyen",q:"Quel est le pluriel de « child » (enfant) en anglais ?",opts:["Childs","Children","Childes","Childrens"],a:1,exp:"Le pluriel irrégulier de « child » est « children »."},
{id:"an_m2",cat:"ang",niv:"moyen",q:"Complétez : « She ___ to school every day. »",opts:["go","goes","going","gone"],a:1,exp:"À la 3ᵉ personne du singulier au présent simple, on ajoute -es : goes."},
{id:"an_m3",cat:"ang",niv:"moyen",q:"Comment dit-on « hier » en anglais ?",opts:["Today","Tomorrow","Yesterday","Now"],a:2,exp:"« Yesterday » signifie hier."},
{id:"an_m4",cat:"ang",niv:"moyen",q:"Quel est le contraire de « big » en anglais ?",opts:["Tall","Small","Wide","Long"],a:1,exp:"« Small » (petit) est l'antonyme de « big » (grand)."},
{id:"an_d1",cat:"ang",niv:"difficile",q:"Complétez : « I have ___ this book before. » (present perfect de « read »)",opts:["read","readed","reading","reads"],a:0,exp:"Le participe passé de « read » s'écrit « read » (mais se prononce différemment)."},
{id:"an_d2",cat:"ang",niv:"difficile",q:"Quel est le comparatif de « good » en anglais ?",opts:["Gooder","Better","Best","More good"],a:1,exp:"« Good » a un comparatif irrégulier : « better »."},
{id:"an_d3",cat:"ang",niv:"difficile",q:"Complétez : « They ___ playing football when it started to rain. »",opts:["was","were","are","is"],a:1,exp:"Sujet pluriel « they » au prétérit continu → « were »."},
{id:"an_d4",cat:"ang",niv:"difficile",q:"Que signifie l'expression « to give up » ?",opts:["Commencer","Abandonner","Continuer","Réussir"],a:1,exp:"« To give up » signifie abandonner, renoncer."},
{id:"an_t1",cat:"ang",niv:"tresdiff",q:"Complétez : « I have been living here ___ 2015. »",opts:["for","since","from","during"],a:1,exp:"« Since » s'utilise avec un point de départ précis dans le temps (depuis 2015)."},
{id:"an_t2",cat:"ang",niv:"tresdiff",q:"Complétez : « If I ___ rich, I would travel the world. »",opts:["am","was","were","be"],a:2,exp:"Dans une hypothèse irréelle (2nd conditionnel), on utilise « were » pour tous les sujets."},
{id:"an_t3",cat:"ang",niv:"tresdiff",q:"Que signifie le phrasal verb « to look after » ?",opts:["Chercher","S'occuper de","Regarder vers","Admirer"],a:1,exp:"« To look after » signifie s'occuper de, prendre soin de."},
{id:"an_t4",cat:"ang",niv:"tresdiff",q:"Quelle phrase est correctement construite à la voix passive ?",opts:["The author wrote by the book.","The book was written by the author.","The book is writing by the author.","The author was wrote the book."],a:1,exp:"La voix passive correcte est : « The book was written by the author. »"},
{id:"an_e1",cat:"ang",niv:"expert",q:"Que signifie l'expression idiomatique « to bite the bullet » ?",opts:["Manger rapidement","Accepter une situation difficile avec courage","Être très précis","Avoir peur"],a:1,exp:"Cette expression signifie affronter une situation difficile avec courage, malgré la douleur."},
{id:"an_e2",cat:"ang",niv:"expert",q:"Complétez : « By the time we arrived, the movie ___ already ___. »",opts:["had / started","has / started","was / starting","did / start"],a:0,exp:"Une action antérieure à une autre action passée se forme avec le past perfect : had started."},
{id:"an_e3",cat:"ang",niv:"expert",q:"Laquelle de ces phrases exprime un sens plutôt négatif (pas assez) ?",opts:["I have a few friends.","I have few friends.","I have some friends.","I have many friends."],a:1,exp:"« Few » (sans « a ») a une connotation négative : peu, pas assez. « A few » est positif : quelques-uns."},
{id:"an_e4",cat:"ang",niv:"expert",q:"Que signifie le phrasal verb « to come across » ?",opts:["Traverser","Tomber sur, rencontrer par hasard","Revenir en arrière","Se rapprocher"],a:1,exp:"« To come across » signifie tomber sur quelque chose ou quelqu'un par hasard."},
];
const psyShuffle=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=x[i];x[i]=x[j];x[j]=t;}return x;};
const psyFmt=s=>`${Math.floor(s/60)}:${String(Math.max(0,s%60)).padStart(2,"0")}`;
const psyRelTime=ts=>{
  if(!ts?.seconds)return"";
  const diff=Date.now()/1000-ts.seconds;
  if(diff<3600)return`il y a ${Math.max(1,Math.round(diff/60))} min`;
  if(diff<86400)return`il y a ${Math.round(diff/3600)} h`;
  return`il y a ${Math.round(diff/86400)} j`;
};

function PsychoPage({uid,u}){
  const K=useK();const{mob}=useW();
  const[phase,setPhase]=useState("level");   // level | test | done
  const[niv,setNiv]=useState(null);
  const[qs,setQs]=useState([]);
  const[idx,setIdx]=useState(0);
  const[ans,setAns]=useState([]);
  const[tLeft,setTLeft]=useState(0);
  const[hist,setHist]=useState([]);
  const[histLoading,setHistLoading]=useState(true);
  const savedRef=useRef(false);

  useEffect(()=>{
    let active=true;
    (async()=>{
      if(!uid){setHistLoading(false);return;}
      setHistLoading(true);
      try{
        const snap=await getDocs(query(collection(db,"psychoScores"),where("uid","==",uid)));
        const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b)=>(b.ts?.seconds||0)-(a.ts?.seconds||0));
        if(active)setHist(rows);
      }catch(e){console.log("psycho hist error",e);}
      if(active)setHistLoading(false);
    })();
    return()=>{active=false;};
  },[uid,phase]);

  const finish=useCallback(async(finalAns,finalTLeft)=>{
    if(savedRef.current)return;
    savedRef.current=true;
    const lvl=PSY_LEVELS.find(l=>l.id===niv);
    const sc=qs.reduce((s,q,i)=>s+((q.libre?psyNorm(finalAns[i])===psyNorm(q.a):finalAns[i]===q.a)?1:0),0);
    const pct=qs.length?Math.round(sc/qs.length*100):0;
    if(!uid)return;
    try{
      const ref=doc(collection(db,"psychoScores"));
      await setDoc(ref,{uid,nom:u?.nom||"",mail:u?.mail||"",niveau:niv,niveauLabel:lvl?.label||niv,score:sc,total:qs.length,pct,dureeUtilisee:(lvl?.dur||0)-finalTLeft,ts:serverTimestamp()});
    }catch(e){console.log("psycho save error",e);}
  },[qs,niv,uid,u]);

  useEffect(()=>{
    if(phase!=="test")return;
    if(tLeft<=0){finish(ans,0);setPhase("done");return;}
    const t=setInterval(()=>setTLeft(s=>s-1),1000);
    return()=>clearInterval(t);
  },[phase,tLeft,ans,finish]);

  const start=nivId=>{
    const lvl=PSY_LEVELS.find(l=>l.id===nivId);
    const pool=psyShuffle(PSY_BANK.filter(q=>q.niv===nivId));
    const picked=pool.slice(0,Math.min(lvl.n,pool.length));
    savedRef.current=false;
    setNiv(nivId);setQs(picked);setAns(new Array(picked.length).fill(null));setIdx(0);setTLeft(lvl.dur);setPhase("test");
  };
  const pick=oi=>setAns(a=>{const b=a.slice();b[idx]=oi;return b;});
  const next=()=>{
    if(idx<qs.length-1){setIdx(idx+1);}
    else{finish(ans,tLeft);setPhase("done");}
  };
  const prev=()=>{if(idx>0)setIdx(idx-1);};
  const backToLevels=()=>{setPhase("level");setNiv(null);setQs([]);setIdx(0);setAns([]);};

  const score=qs.reduce((s,q,i)=>s+(ans[i]===q.a?1:0),0);
  const pct=qs.length?Math.round(score/qs.length*100):0;
  const curLvl=PSY_LEVELS.find(l=>l.id===niv);
  const catInfo=cid=>PSY_CATS.find(c=>c.id===cid)||{label:"—",col:K.em};

  // ── ÉCRAN : CHOIX DU NIVEAU (tuiles) ──
  if(phase==="level")return <div style={{padding:mob?"14px":"24px 0",animation:"fadeIn .35s ease"}}>
    <div style={{textAlign:"center",marginBottom:22}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:99,padding:"4px 13px",marginBottom:12,fontSize:11,fontWeight:700,color:K.in_,letterSpacing:.5}}>
        <i className="ti ti-brain" style={{fontSize:13}}/>AUTO-ÉVALUATION CHRONOMÉTRÉE
      </div>
      <div style={{fontSize:mob?22:27,fontWeight:900,color:K.t1,marginBottom:6}}>Tests psychotechniques</div>
      <div style={{fontSize:13,color:K.t2,lineHeight:1.6,maxWidth:460,margin:"0 auto"}}>Choisissez votre niveau · Suites, intelligence, figures, français, anglais · 5 à 15 minutes</div>
    </div>

    {/* Tuiles de niveau */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:mob?10:12,marginBottom:26}}>
      {PSY_LEVELS.map(l=><div key={l.id} onClick={()=>start(l.id)} className="bt" style={{cursor:"pointer",padding:mob?"16px 12px":"20px 14px",borderRadius:14,background:K.card,border:`1px solid ${K.b1}`,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:l.col}}/>
        <div style={{width:40,height:40,borderRadius:11,background:`${l.col}1e`,border:`1px solid ${l.col}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
          <i className={`ti ti-${l.ico}`} style={{fontSize:19,color:l.col}}/>
        </div>
        <div style={{fontSize:13,fontWeight:800,color:K.t1,marginBottom:6}}>{l.label}</div>
        <div style={{fontSize:10,color:K.t3,fontWeight:600}}>{Math.round(l.dur/60)} min · {l.n} questions</div>
      </div>)}
    </div>

    {/* Matières couvertes */}
    <div style={{fontSize:12,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>Matières mélangées à chaque test</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:26}}>
      {PSY_CATS.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:6,background:`${c.col}12`,border:`1px solid ${c.col}30`,borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:700,color:c.col}}>
        <i className={`ti ti-${c.ico}`} style={{fontSize:13}}/>{c.label}
      </div>)}
    </div>

    {/* Historique personnel */}
    {uid&&<div>
      <div style={{fontSize:12,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>Historique complet ({hist.length})</div>
      {histLoading?<div style={{fontSize:12,color:K.t3,padding:"10px 2px"}}>Chargement…</div>
      :hist.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"18px",textAlign:"center",fontSize:12,color:K.t3}}>Aucun test passé pour l'instant. Lancez-vous !</div>
      :<div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:hist.length>6?420:"none",overflowY:hist.length>6?"auto":"visible",paddingRight:hist.length>6?4:0}}>
        {hist.map(h=>{const lc=PSY_LEVELS.find(l=>l.id===h.niveau)?.col||K.em;return <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"10px 13px"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:lc,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:K.t1}}>{h.niveauLabel||h.niveau}</div>
            <div style={{fontSize:10,color:K.t3}}>{psyRelTime(h.ts)}</div>
          </div>
          <div style={{fontSize:14,fontWeight:900,color:h.pct>=70?K.em:h.pct>=40?K.wa:K.rd}}>{h.score}/{h.total}</div>
        </div>;})}
      </div>}
    </div>}
  </div>;

  // ── ÉCRAN : TEST EN COURS ──
  if(phase==="test"){
    const q=qs[idx];const ci=catInfo(q.cat);const low=tLeft<=60;
    return <div style={{padding:mob?"12px":"22px 0",animation:"fadeIn .3s ease",maxWidth:640,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11,fontWeight:700,color:K.t3}}>
            <span>Question {idx+1} / {qs.length} · {curLvl?.label}</span>
            <span style={{color:ci.col}}>{ci.label}</span>
          </div>
          <Bar p={(idx+1)/qs.length*100} col={ci.col}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:low?K.rdBg:K.c2,border:`1px solid ${low?K.rdBd:K.b0}`,borderRadius:10,padding:"7px 11px",flexShrink:0,animation:low?"blink 1s ease-in-out infinite":"none"}}>
          <i className="ti ti-clock" style={{fontSize:14,color:low?K.rd:K.t2}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:low?K.rd:K.t1}}>{psyFmt(tLeft)}</span>
        </div>
      </div>

      <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:16,padding:mob?"20px 18px":"26px 24px",marginBottom:14}}>
        <div style={{fontSize:mob?16:18,fontWeight:700,color:K.t1,lineHeight:1.5,marginBottom:20}}>{q.q}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.libre?<div>
            <input value={typeof ans[idx]==="string"?ans[idx]:""} onChange={e=>{const v=e.target.value;setAns(a=>{const b=[...a];b[idx]=v;return b;});}} placeholder="Tapez votre réponse…"
              style={{width:"100%",background:K.c2,border:`1.5px solid ${ci.col}60`,borderRadius:11,padding:"13px 15px",color:K.t1,fontSize:15,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
            <div style={{fontSize:11,color:K.t3,marginTop:7}}>✍️ Réponse libre — corrigée automatiquement (majuscules et accents ignorés).</div>
          </div>
          :q.opts.map((o,oi)=>{
            const sel=ans[idx]===oi;
            return <button key={oi} onClick={()=>pick(oi)} className="bt" style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",borderRadius:11,border:`1.5px solid ${sel?ci.col:K.b0}`,background:sel?`${ci.col}18`:K.c2,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
              <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,border:`1.5px solid ${sel?ci.col:K.b1}`,background:sel?ci.col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:sel?"#071209":K.t3}}>{String.fromCharCode(65+oi)}</div>
              <span style={{fontSize:14,fontWeight:600,color:K.t1}}>{o}</span>
            </button>;
          })}
        </div>
      </div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={prev} disabled={idx===0} className="bt" style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${K.b0}`,borderRadius:10,color:idx===0?K.t3:K.t2,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,cursor:idx===0?"default":"pointer",opacity:idx===0?.4:1,minHeight:46}}>← Précédent</button>
        <div style={{flex:2}}><Btn ch={idx<qs.length-1?"Suivant →":"Terminer le test ✓"} on={next} full sx={{padding:"12px",fontSize:14,minHeight:46}}/></div>
      </div>
    </div>;
  }

  // ── ÉCRAN : RÉSULTATS + CORRECTION ──
  const msg=pct>=80?"Excellent ! 🎉":pct>=50?"Bien joué 👍":"Continuez à vous entraîner 💪";
  const msgCol=pct>=80?K.em:pct>=50?K.wa:K.rd;
  return <div style={{padding:mob?"14px":"24px 0",animation:"fadeIn .35s ease",maxWidth:640,margin:"0 auto"}}>
    <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:18,padding:mob?"24px 18px":"30px",textAlign:"center",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><ProgressRing pct={pct} size={104} stroke={9} col={msgCol}/></div>
      <div style={{fontSize:22,fontWeight:900,color:K.t1,marginBottom:4}}>{score} / {qs.length} bonnes réponses</div>
      <div style={{fontSize:14,fontWeight:700,color:msgCol,marginBottom:2}}>{msg}</div>
      <div style={{fontSize:12,color:K.t3}}>Niveau {curLvl?.label} · {psyFmt((curLvl?.dur||0)-tLeft)} utilisées</div>
    </div>

    <div style={{fontSize:12,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:12,paddingLeft:2}}>Correction détaillée</div>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
      {qs.map((q,i)=>{
        const good=q.libre?psyNorm(ans[i])===psyNorm(q.a):ans[i]===q.a;const given=ans[i];const ci=catInfo(q.cat);
        return <div key={q.id} style={{background:K.card,border:`1px solid ${good?K.emBd:K.rdBd}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
            <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:good?K.em:K.rd,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
              <i className={good?"ti ti-check":"ti ti-x"} style={{fontSize:12,color:"#fff"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:9,fontWeight:800,color:ci.col,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{ci.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:K.t1,lineHeight:1.4}}>{i+1}. {q.q}</div>
            </div>
          </div>
          <div style={{fontSize:12,color:K.t2,paddingLeft:28,lineHeight:1.6}}>
            {given==null
              ?<div style={{color:K.wa}}>Sans réponse</div>
              :!good&&<div>Votre réponse : <span style={{color:K.rd,fontWeight:700}}>{q.libre?(given||"—"):q.opts[given]}</span></div>}
            <div>Bonne réponse : <span style={{color:K.em,fontWeight:700}}>{q.libre?q.a:q.opts[q.a]}</span></div>
            <div style={{marginTop:4,color:K.t3,fontStyle:"italic"}}>{q.exp}</div>
          </div>
        </div>;
      })}
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={backToLevels} className="bt" style={{flex:1,padding:"13px",background:"transparent",border:`1px solid ${K.b1}`,borderRadius:11,color:K.t2,fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",minHeight:46}}>Autres niveaux</button>
      <div style={{flex:1}}><Btn ch="↻ Recommencer" on={()=>start(niv)} full sx={{padding:"13px",fontSize:14,minHeight:46}}/></div>
    </div>
  </div>;
}

function MessagerieApprenant({uid,uNom}){
  const K=useK();const{mob}=useW();
  const msgs=useMessages(uid);
  const[texte,sTexte]=useState("");
  const[sending,sSending]=useState(false);
  const[chan,sChan]=useState("admin");
  const endRef=useRef();
  useEffect(()=>{markMsgsRead(uid,"apprenant");},[uid,msgs.length]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs.length,chan]);
  const fChans=[...new Set(msgs.filter(m=>m.formateurUid).map(m=>m.formateurUid))].map(f=>({id:f,label:msgs.find(m=>m.formateurUid===f&&m.fromRole==="formateur")?.fromNom||"Formateur"}));
  const shown=msgs.filter(m=>chan==="admin"?!m.formateurUid:m.formateurUid===chan);
  const send=async()=>{
    const t=texte.trim();if(!t||sending)return;
    sSending(true);
    await sendMessage({apprenantUid:uid,apprenantNom:uNom,from:uid,fromNom:uNom,fromRole:"apprenant",texte:t,formateurUid:chan==="admin"?null:chan});
    sTexte("");sSending(false);
  };
  return <div style={{maxWidth:700,margin:"0 auto",animation:"up .25s ease",display:"flex",flexDirection:"column",height:mob?"calc(100vh - 130px)":"calc(100vh - 160px)"}}>
    <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      <i className="ti ti-message-circle" style={{fontSize:18,color:K.em}}/>Messagerie — Éco-Campus RDC
    </div>
    {fChans.length>0&&<div style={{display:"flex",gap:6,marginBottom:10,flexShrink:0,flexWrap:"wrap"}}>
      {[{id:"admin",label:"Éco-Campus"},...fChans].map(c=>{
        const unread=msgs.filter(m=>(c.id==="admin"?!m.formateurUid:m.formateurUid===c.id)&&m.fromRole!=="apprenant"&&!m.luApprenant).length;
        return <button key={c.id} onClick={()=>sChan(c.id)} className="bt" style={{background:chan===c.id?K.em:K.c2,border:`1px solid ${chan===c.id?K.em:K.b0}`,color:chan===c.id?"#F5EDD8":K.t2,borderRadius:99,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>{c.label}{unread>0&&<span style={{background:K.rd,color:"#fff",borderRadius:99,fontSize:9,fontWeight:800,padding:"1px 6px"}}>{unread}</span>}</button>;
      })}
    </div>}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,padding:"4px 2px",marginBottom:12}}>
      {shown.length===0&&<div style={{textAlign:"center",color:K.t3,fontSize:13,marginTop:40}}>Aucun message dans cette conversation. Écrivez le premier !</div>}
      {shown.map(m=>{
        const mine=m.fromRole==="apprenant";
        return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
          <div style={{background:mine?K.em:K.c2,color:mine?"#F5EDD8":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:13,lineHeight:1.5}}>{m.texte}</div>
          <div style={{fontSize:9,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.fromNom||"Éco-Campus"} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
        </div>;
      })}
      <div ref={endRef}/>
    </div>
    <div style={{display:"flex",gap:8,flexShrink:0}}>
      <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Écrivez votre message…" style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,padding:"11px 16px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}/>
      <button onClick={send} disabled={sending||!texte.trim()} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",cursor:"pointer",flexShrink:0,opacity:sending||!texte.trim()?.5:1}}>
        <i className="ti ti-send" style={{fontSize:17}}/>
      </button>
    </div>
  </div>;
}
function Nav({u,vue,sV,ok,onSub,onOut,live,uid}){
  const K=useK();const{mob}=useW();
  const myMsgs=useMessages(uid);
  const unreadMsg=myMsgs.filter(m=>m.fromRole!=="apprenant"&&!m.luApprenant).length;
  const[showCode,sShowCode]=useState(false);
  const rHc=useRef();
  const[hcErr,sHcErr]=useState("");
  const[hcBusy,sHcBusy]=useState(false);
  const submitNavCode=async()=>{
    const c=rHc.current?.value?.trim()||"";
    sHcErr("");if(!c)return sHcErr("Entrez votre code");
    sHcBusy(true);
    try{
      const snap=await getDoc(doc(db,"users",uid));
      if(!snap.exists()){sHcBusy(false);return sHcErr("Profil introuvable.");}
      const ud=snap.data();
      if(c.startsWith("FO-")){
        if(ud.formateurCode!==c){sHcBusy(false);return sHcErr("Code formateur incorrect.");}
        await updateDoc(doc(db,"users",uid),{role:"formateur",formateurCodeValide:true});
        sHcBusy(false);sShowCode(false);
        window.location.reload();
        return;
      }
      if(ud.activationCode!==c){sHcBusy(false);return sHcErr("Code incorrect.");}
      await updateDoc(doc(db,"users",uid),{abonnement:"actif",codeValide:true});
      sHcBusy(false);sShowCode(false);
      window.location.reload();
    }catch(e){sHcBusy(false);sHcErr(e.message);}
  };
  const codeModal=showCode&&<Sheet title="🔑 J'ai un code" onClose={()=>sShowCode(false)}>
    <Inp lb="Code d'activation" rf={rHc} ph="AP-XXXXXXXX ou FO-XXXXXXXX" mono note="Communiqué par Éco-Campus"/>
    {hcErr&&<div style={{color:K.er,fontSize:12,marginBottom:10}}>{hcErr}</div>}
    <Btn ch={hcBusy?"…":"Valider →"} on={submitNavCode} full dis={hcBusy}/>
  </Sheet>;
  const NAV_ITEMS=[
    {k:"home",   ico:"home-2",        label:"Accueil"},
    {k:"msg",    ico:"message-circle",label:"Messages", badgeCount:unreadMsg},
    {k:"pres",   ico:"presentation",  label:"Cours"},
    {k:"stages", ico:"briefcase",     label:"Stages"},
    {k:"videos", ico:"video",         label:"Vidéos", live:true},
    {k:"psycho", ico:"brain",         label:"Psycho"},
    {k:"services",ico:"building",     label:"Services"},
    {k:"prog",   ico:"chart-line",    label:"Progrès"},
    {k:"res",    ico:"trophy",        label:"Résultats"},
  ];
  if(mob){
    // ── BOTTOM NAV MOBILE ──
    const visible=NAV_ITEMS.slice(0,6);
    return <>
      {/* Top bar mobile : logo + statut + avatar */}
      <div className="nb" style={{background:`${K.card}f0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"space-between",height:50,position:"sticky",top:0,zIndex:99}}>
        <Logo sm/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {ok
            ?<div style={{display:"flex",alignItems:"center",gap:5,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"3px 9px"}}><span style={{width:6,height:6,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:10,fontWeight:700,color:K.em}}>{u.dureeId==="v"?"∞ Actif":"✓ Actif"}</span></div>
            :<button onClick={onSub} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:99,padding:"4px 11px",fontSize:11,fontWeight:800,color:"#F5EDD8",cursor:"pointer"}}>Accéder</button>
          }
          <button onClick={()=>sShowCode(true)} className="bt" title="J'ai un code" style={{width:28,height:28,borderRadius:"50%",background:K.c2,border:`1px solid ${K.b1}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <i className="ti ti-key" style={{fontSize:14,color:K.t2}}/>
          </button>
          <div onClick={onOut} style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div>
        </div>
      </div>
      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:99,background:`${K.card}f5`,backdropFilter:"blur(20px)",borderTop:`1px solid ${K.b0}`,display:"flex",alignItems:"center",paddingBottom:"max(6px,env(safe-area-inset-bottom))"}}>
        {visible.map(({k,ico,label,live:isLive,badgeCount})=>{
          const active=vue===k;
          const hasLive=isLive&&live;
          return <button key={k} onClick={()=>sV(k)} className="bt" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"8px 4px 4px",background:"none",border:"none",cursor:"pointer",position:"relative",minHeight:52}}>
            {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:3,borderRadius:"0 0 3px 3px",background:K.em}}/>}
            <div style={{position:"relative"}}>
              <i className={`ti ti-${ico}`} style={{fontSize:20,color:active?K.em:K.t3,display:"block"}}/>
              {hasLive&&<span style={{position:"absolute",top:-2,right:-4,width:7,height:7,borderRadius:"50%",background:K.rd,border:`1.5px solid ${K.card}`,animation:"blink 1.5s ease-in-out infinite"}}/>}
              {!!badgeCount&&<span style={{position:"absolute",top:-5,right:-7,minWidth:14,height:14,borderRadius:99,background:K.rd,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:`1.5px solid ${K.card}`}}>{badgeCount>9?"9+":badgeCount}</span>}
            </div>
            <span style={{fontSize:9,fontWeight:active?800:600,color:active?K.em:K.t3,letterSpacing:.2}}>{label}</span>
          </button>;
        })}
      </div>
      {codeModal}
    </>;
  }
  // ── DESKTOP NAV ──
  return <nav className="nb" style={{background:`${K.card}f0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",gap:4,height:56,position:"sticky",top:0,zIndex:99}}>
    <Logo/>
    <div style={{width:1,height:22,background:K.b0,margin:"0 6px",flexShrink:0}}/>
    <div className="tn" style={{flex:1,gap:2}}>
      {NAV_ITEMS.map(({k,ico,label,live:isLive,badgeCount})=>{
        const active=vue===k;
        const hasLive=isLive&&live;
        return <button key={k} onClick={()=>sV(k)} className="bt" style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:8,border:"none",cursor:"pointer",background:active?K.c2:"transparent",color:active?K.t1:K.t3,fontWeight:active?700:600,fontSize:12,whiteSpace:"nowrap",minHeight:34,fontFamily:"'Outfit',sans-serif",position:"relative",transition:"background .15s,color .15s"}}>
          <div style={{position:"relative"}}>
            <i className={`ti ti-${ico}`} style={{fontSize:15,color:active?K.em:K.t3}}/>
            {hasLive&&<span style={{position:"absolute",top:-3,right:-4,width:7,height:7,borderRadius:"50%",background:K.rd,border:`1.5px solid ${K.card}`,animation:"blink 1.5s ease-in-out infinite"}}/>}
            {!!badgeCount&&<span style={{position:"absolute",top:-5,right:-7,minWidth:13,height:13,borderRadius:99,background:K.rd,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:`1.5px solid ${K.card}`}}>{badgeCount>9?"9+":badgeCount}</span>}
          </div>
          {label}
          {active&&<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"60%",height:2,borderRadius:"2px 2px 0 0",background:K.em}}/>}
        </button>;
      })}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      {ok
        ?<div style={{display:"flex",alignItems:"center",gap:5,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"4px 11px"}}><span style={{width:6,height:6,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:11,fontWeight:700,color:K.em}}>{u.dureeId==="v"?"∞ À vie":"✓ Actif"}</span></div>
        :<button onClick={onSub} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:800,color:"#F5EDD8",cursor:"pointer"}}>Obtenir l'accès</button>
      }
      <button onClick={()=>sShowCode(true)} className="bt" title="J'ai un code" style={{width:32,height:32,borderRadius:"50%",background:K.c2,border:`1px solid ${K.b1}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
        <i className="ti ti-key" style={{fontSize:15,color:K.t2}}/>
      </button>
      <div onClick={onOut} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 9px 4px 5px",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:99,cursor:"pointer"}} className="bt">
        <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:11}}>{(u.nom||"U")[0].toUpperCase()}</div>
        <span style={{color:K.t2,fontSize:12,fontWeight:600}}>{(u.nom||"").split(" ")[0]}</span>
        <i className="ti ti-chevron-down" style={{fontSize:11,color:K.t3}}/>
      </div>
    </div>
    {codeModal}
  </nav>;
}

function Home({u,pr,sc,gp,nd,ok,mods,vids,onOpen,onSub,onVid,onPres,onStages,live,presCount=0,uid}){
  const K=useK();const{mob}=useW();const jr=jR(u.dateExpiration);
  const{tid}=useContext(Ctx);
  const[pdfMod,setPdfMod]=useState(null);
  const mats=[...new Set(mods.map(m=>m.mat||"Général"))];
  const[fi,sF]=useState("Toutes");
  const[showCode,sShowCode]=useState(false);
  const rHc=useRef();
  const[hcErr,sHcErr]=useState("");
  const[hcBusy,sHcBusy]=useState(false);
  const isSocial=(auth.currentUser?.providerData||[]).some(p=>p.providerId==="google.com"||p.providerId==="facebook.com");
  const annonces=useAnnonces();
  const[dismissed,sDismissed]=useState([]);
  const[modQ,sModQ]=useState("");
  const activeAnnonces=annonces.filter(a=>a.actif&&(!a.expireAt||new Date(a.expireAt)>=new Date())&&!dismissed.includes(a.id));
  const submitHomeCode=async()=>{
    const c=rHc.current?.value?.trim()||"";
    sHcErr("");if(!c)return sHcErr("Entrez votre code");
    sHcBusy(true);
    try{
      const snap=await getDoc(doc(db,"users",uid));
      if(!snap.exists()){sHcBusy(false);return sHcErr("Profil introuvable.");}
      const ud=snap.data();
      if(c.startsWith("FO-")){
        if(ud.formateurCode!==c){sHcBusy(false);return sHcErr("Code formateur incorrect.");}
        await updateDoc(doc(db,"users",uid),{role:"formateur",formateurCodeValide:true});
        sHcBusy(false);sShowCode(false);
        window.location.reload();
        return;
      }
      if(ud.activationCode!==c){sHcBusy(false);return sHcErr("Code incorrect.");}
      await updateDoc(doc(db,"users",uid),{abonnement:"actif",codeValide:true});
      sHcBusy(false);sShowCode(false);
      window.location.reload();
    }catch(e){sHcBusy(false);sHcErr(e.message);}
  };
  const filMat=fi==="Toutes"?mods:mods.filter(m=>(m.mat||"Général")===fi);
  const fil=modQ.trim()?filMat.filter(m=>(m.titre||"").toLowerCase().includes(modQ.toLowerCase())||(m.desc||"").toLowerCase().includes(modQ.toLowerCase())):filMat;
  const recentMods=mods.filter(m=>pr[m.id]==="done").slice(-3).reverse();
  const isLight=['light','sepia'].includes(tid);

  // Feature cards
  const features=[
    {key:"modules",ico:"book-2",label:"Modules",desc:`${mods.filter(m=>m.on!==false).length} cours disponibles`,action:()=>document.getElementById('modules-section')?.scrollIntoView({behavior:'smooth'})},
    {key:"qcm",ico:"help-circle",label:"QCM",desc:`${Object.keys(sc).length} évaluations passées`,action:()=>document.getElementById('modules-section')?.scrollIntoView({behavior:'smooth'})},
    {key:"pres",ico:"presentation",label:"Présentations",desc:`${presCount||0} support${presCount>1?"s":""} de cours`,action:onPres},
    {key:"stages",ico:"briefcase",label:"Stages",desc:"Expériences virtuelles",action:onStages},{key:"videos",ico:"video",label:"Vidéos",desc:`${vids.length} vidéos disponibles`,action:onVid},
  ];

  return <div style={{animation:"up .3s ease"}}>
    {/* Annonces */}
    {activeAnnonces.map(a=>{
      const typeInfo={info:{bg:K.inBg,bd:K.inBd,col:K.in_,ico:"info-circle"},promo:{bg:K.waBg,bd:K.waBd,col:K.wa,ico:"gift"},urgent:{bg:K.erBg,bd:K.erBd,col:K.er,ico:"alert-triangle"}}[a.type||"info"];
      return <div key={a.id} style={{background:typeInfo.bg,border:`1px solid ${typeInfo.bd}`,borderRadius:12,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:10}}>
        <i className={`ti ti-${typeInfo.ico}`} style={{fontSize:16,color:typeInfo.col,marginTop:1,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:2}}>{a.titre}</div>
          <div style={{fontSize:12,color:K.t2,lineHeight:1.5}}>{a.contenu}</div>
        </div>
        <button onClick={()=>sDismissed(d=>[...d,a.id])} className="bt" style={{background:"none",border:"none",color:K.t3,cursor:"pointer",fontSize:16,lineHeight:1,padding:2,flexShrink:0}}>×</button>
      </div>;
    })}
    {/* Alertes */}
    {!ok&&<div style={{background:u.abonnement==="expiré"?K.erBg:K.waBg,border:`1px solid ${u.abonnement==="expiré"?K.erBd:K.waBd}`,borderRadius:12,padding:"11px 14px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div><div style={{fontWeight:700,fontSize:13,color:u.abonnement==="expiré"?K.er:K.wa,marginBottom:2}}>{u.abonnement==="expiré"?"Accès expiré":"Cours verrouillés"}</div><div style={{fontSize:12,color:K.t3}}>{u.abonnement==="demande"?"Demande en cours — code sous 24h.":u.abonnement==="expiré"?"Contactez Éco-Campus.":"Effectuez le paiement."}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{isSocial&&<Btn ch="J'ai un code" on={()=>sShowCode(true)} v="s" sm/>}{u.abonnement!=="demande"&&<Btn ch="Obtenir l'accès" on={onSub} v="w" sm/>}</div></div>}
    {ok&&jr<=30&&jr>0&&u.dureeId!=="v"&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"9px 14px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><div style={{fontSize:13,color:K.wa}}>⏰ Expire dans <b>{jr}j</b></div><Btn ch="Renouveler" on={onSub} v="w" sm/></div>}

    {/* Bannière principale */}
    <div style={{background:`linear-gradient(135deg,${K.em}18,${K.in_}10)`,border:`1px solid ${K.emBd}`,borderRadius:16,padding:mob?"18px 16px":"22px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:`${K.em}10`}}/>
      <div style={{position:"absolute",bottom:-30,right:30,width:70,height:70,borderRadius:"50%",background:`${K.in_}0D`}}/>
      <div style={{fontSize:12,color:K.em,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-star" style={{fontSize:13}}/> Tableau de bord</div>
      <div style={{fontSize:mob?19:24,fontWeight:900,color:K.t1,marginBottom:4,letterSpacing:"-.3px",lineHeight:1.2}}>Bonjour, {(u.nom||"").split(" ")[0]} 👋</div>
      <div style={{fontSize:13,color:K.t2,marginBottom:16,lineHeight:1.5}}>{!ok?"Abonnez-vous pour accéder à tous les cours.":nd===0?"Commencez votre parcours de formation.":`${nd}/${mods.length} modules complétés — continuez !`}</div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          {[[`${nd}/${mods.length}`,"Modules",K.em],[`${gp}%`,"Progression",K.in_],[`${mats.length}`,"Matières",K.wa]].map(([v,l,c])=><div key={l} className="card-enter" style={{background:isLight?"rgba(255,255,255,.7)":K.b0,backdropFilter:"blur(8px)",borderRadius:10,padding:"8px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}
        </div>
        <div style={{flexShrink:0}}><ProgressRing pct={gp} size={76} stroke={6} col={K.em}/></div>
      </div>
    </div>
    {/* Badges */}
    <BadgesPanel nd={nd} total={mods.length} sc={sc}/>

    {/* Bannière live */}
    {live.on&&<div onClick={onVid} className="hv" style={{background:`linear-gradient(135deg,${K.rdBg},${K.c2})`,border:`1px solid ${K.rdBd}`,borderRadius:13,padding:"13px 16px",marginBottom:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><div style={{width:42,height:42,borderRadius:12,background:K.rdBg,border:`1px solid ${K.rdBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-broadcast" style={{fontSize:20,color:K.rd,animation:"blink 1.5s ease-in-out infinite"}}/></div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:1}}>{live.titre||"Cours en direct"}</div><div style={{fontSize:11,color:K.t3}}>En cours maintenant · Rejoindre</div></div><Btn ch="▶ Rejoindre" v="r" sm sx={{flexShrink:0}}/></div>}

    {/* Cartes fonctionnalités */}
    <div style={{marginBottom:6}}><div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:12}}>Accès rapide</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
      {features.map((f,i)=>{const cp=getCardPalette(tid,i);return <div key={f.key} onClick={f.action} className="hv" style={{background:cp.bg,border:`1px solid ${cp.bd}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,width:50,height:50,borderRadius:"50%",background:`${cp.ac}15`}}/>
        <div style={{width:38,height:38,borderRadius:11,background:isLight?"rgba(255,255,255,.8)":K.b1,border:`1px solid ${cp.bd}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><i className={"ti ti-"+f.ico} style={{fontSize:19,color:cp.ac}}/></div>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3}}>{f.label}</div>
        <div style={{fontSize:11,color:K.t2,lineHeight:1.4,marginBottom:10}}>{f.desc}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:cp.ac}}><span>Accéder</span><i className="ti ti-arrow-right" style={{fontSize:12}}/></div>
      </div>;})}
    </div></div>

    {/* Modules */}
    <div id="modules-section">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:7}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1}}>Modules <span style={{color:K.t3,fontWeight:400,fontSize:13}}>({fil.length})</span></div>
        {!ok&&<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="🔒 Abonnement requis"/>}
      </div>
      <div style={{position:"relative",marginBottom:11}}>
        <i className="ti ti-search" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:K.t3}}/>
        <input value={modQ} onChange={e=>sModQ(e.target.value)} placeholder="Rechercher un module…"
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"9px 12px 9px 32px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        {modQ&&<button onClick={()=>sModQ("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:K.t3,cursor:"pointer",fontSize:15,padding:2}}>×</button>}
      </div>
      {mats.length>1&&<div className="tn" style={{gap:6,marginBottom:11,paddingBottom:3}}>{["Toutes",...mats].map(m=><button key={m} onClick={()=>sF(m)} className="bt" style={{background:fi===m?K.c2:"transparent",border:`1px solid ${fi===m?K.b1:K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:600,color:fi===m?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{m}</button>)}</div>}
      {fil.length===0&&modQ&&<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"20px",textAlign:"center",fontSize:13,color:K.t3,marginBottom:11}}>Aucun module ne correspond à « {modQ} ».</div>}
      <div className="gm">
        {fil.map((m,i)=>{
          const f=pr[m.id]==="done",s=sc[m.id],lk=!ok;
          const cp=getCardPalette(tid,i);
          const hasPdf=m.slideUrl&&m.slideUrl.length>0;
          return <div key={m.id} className="hv"
            style={{background:f?cp.bg:K.card,border:`1px solid ${f?cp.bd:K.b0}`,borderRadius:13,padding:"13px",cursor:"pointer",position:"relative",overflow:"hidden",animation:`slideUp .4s cubic-bezier(.22,1,.36,1) ${i*40}ms both`,opacity:lk?.65:1,transition:"transform .2s ease,box-shadow .2s ease"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:f?cp.ac:"transparent",borderRadius:"13px 13px 0 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:9,background:f?`${cp.ac}20`:isLight?"rgba(0,0,0,.05)":"rgba(255,255,255,.06)",border:`1px solid ${f?cp.bd:K.b0}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {lk?<i className="ti ti-lock" style={{fontSize:14,color:K.t3}}/>:icoEl(m.ico,f?cp.ac:m.col,15)}
              </div>
              {f&&s&&<Tg c={s.pct>=60?K.em:K.er} bg={s.pct>=60?K.emBg:K.erBg} bd={s.pct>=60?K.emBd:K.erBd} ch={`${s.pct}%`}/>}
            </div>
            <div style={{fontWeight:700,fontSize:12,color:lk?K.t3:K.t1,marginBottom:2,lineHeight:1.3}}>{m.titre}</div>
            {m.mat&&<div style={{fontSize:10,color:f?cp.ac:K.in_,marginBottom:5,fontWeight:600}}>{m.mat}</div>}
            <div style={{fontSize:10,color:K.t3,marginBottom:8}}>{m.q?.length||0}q{vids.some(v=>v.mid===m.id)?" · 🎬":""}</div>
            <Bar p={lk?0:f?100:0} col={f?cp.ac:m.col} h={3}/>
            {!lk&&!f&&<div style={{marginTop:8,fontSize:11,fontWeight:600,color:cp.ac,display:"flex",alignItems:"center",gap:3}}><span>Commencer</span><i className="ti ti-arrow-right" style={{fontSize:11}}/></div>}
            {f&&<div style={{marginTop:8,fontSize:11,fontWeight:600,color:cp.ac,display:"flex",alignItems:"center",gap:3}}><i className="ti ti-check" style={{fontSize:11}}/><span>Complété</span></div>}
            {m.slideUrl&&!lk&&<button onClick={e=>{e.stopPropagation();setPdfMod(m);}} className="bt"
              style={{marginTop:6,width:"100%",background:"#F59E0B14",border:"1px solid #F59E0B30",borderRadius:7,padding:"5px 8px",color:"#F59E0B",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
              <i className="ti ti-file-text" style={{fontSize:11}}/>Slides PDF
            </button>}
          </div>;
        })}
      </div>
    </div>
    {pdfMod&&<PdfV url={pdfMod.slideUrl} name={pdfMod.titre} onClose={()=>setPdfMod(null)} modId={pdfMod.id} uid={uid} showRating={true}/>}

    {/* Récents */}
    {recentMods.length>0&&<div style={{marginTop:18}}>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:10}}>Récemment complétés</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recentMods.map((m,i)=>{const s=sc[m.id];const cp=getCardPalette(tid,i);return <div key={m.id} onClick={()=>onOpen(m)} className="hv" style={{background:cp.bg,border:`1px solid ${cp.bd}`,borderRadius:12,padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:isLight?"rgba(255,255,255,.8)":K.b1,border:`1px solid ${cp.bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icoEl(m.ico,cp.ac,16)}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div><div style={{fontSize:11,color:K.t2,marginTop:1}}>{m.mat||"SYSCOHADA"}</div></div>
          {s&&<div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:800,fontSize:15,color:s.pct>=60?K.em:K.er}}>{s.pct}%</div><div style={{fontSize:10,color:K.t3}}>Score</div></div>}
        </div>;})}
      </div>
    </div>}
    {showCode&&<Sheet title="🔐 Code d'activation" onClose={()=>sShowCode(false)}>
      <Inp lb="Code d'activation" rf={rHc} ph="AP-XXXXXXXX ou FO-XXXXXXXX" mono note="Communiqué par Éco-Campus"/>
      {hcErr&&<div style={{color:K.er,fontSize:12,marginBottom:10}}>{hcErr}</div>}
      <Btn ch={hcBusy?"…":"Valider →"} on={submitHomeCode} full dis={hcBusy}/>
    </Sheet>}
  </div>;
}

function SubM({onClose,uid,u}){
  const K=useK();const a=u.abonnement==="demande";
  const ask=async()=>{await saveUserData(uid,{abonnement:"demande",demandeDate:new Date().toLocaleDateString("fr-FR")});onClose();};
  return <Sheet title="Obtenir l'accès" onClose={onClose}>
    {a?<div style={{textAlign:"center",padding:"5px 0"}}><div style={{fontSize:40,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>⏳</div><div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:5}}>Demande en cours</div><div style={{color:K.t3,fontSize:13,lineHeight:1.7,marginBottom:12}}>Demande du <b style={{color:K.t2}}>{u.demandeDate}</b>. Code sous 24h.</div><div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:9,padding:"8px 11px",marginBottom:12,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:K.t2,lineHeight:1.9}}>📱 +243 XXX XXX XXX<br/>✉️ contact@accessplusconsulting.com</div><Btn ch="Fermer" on={onClose} v="g" full sx={{minHeight:44}}/></div>:<>
      <div style={{color:K.t3,fontSize:13,marginBottom:12}}>Paiement unique · Durée définie après validation.</div>
      <div style={{background:K.bg,border:`1px solid ${K.emBd}`,borderRadius:11,padding:"12px 14px",marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontWeight:900,fontSize:18,color:K.t1}}>50 USD</div><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Paiement unique"/></div>{["Tous les modules actifs","QCM + Exercices + PDF","Vidéos premium + Direct","Accès selon durée validée"].map(f=><div key={f} style={{display:"flex",gap:7,fontSize:13,color:K.t2,marginBottom:3}}><span style={{color:K.em}}>✓</span>{f}</div>)}</div>
      <div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:9,padding:"8px 11px",marginBottom:12,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:K.t2,lineHeight:1.9}}>💳 M-Pesa · Airtel Money · Orange Money<br/>✉️ contact@accessplusconsulting.com</div>
      <Btn ch="J'ai payé — Soumettre" on={ask} full sx={{padding:"12px",fontSize:14,minHeight:46}}/>
    </>}
  </Sheet>;
}

function MV({mod,sc,ok,onQ,onOpenQ,onMarkDone,doneNoEval,openAnswer,onBack,onSub,vids,pdf,uid,uNom}){
  const K=useK();const{mob}=useW();
  const[pl,sPl]=useState(null),[plIdx,sPlIdx]=useState(0),[pdfO,sPdfO]=useState(false),[corr,sCorr]=useState(false),[exO,sExO]=useState(false);
  const[contact,sContact]=useState(false),[cTxt,sCTxt]=useState(""),[cSending,sCSending]=useState(false),[cSent,sCSent]=useState(false);
  const ex=mod.ex;
  return <div style={{maxWidth:640,margin:"0 auto",animation:"up .25s ease"}}>
    {pl&&<Player url={pl.url} titre={pl.titre} onClose={()=>{sPl(null);sPlIdx(0);}} playlist={vids.map(v=>({url:v.url,titre:v.titre,gr:v.gr}))} startIdx={plIdx}/>}
    {pdfO&&pdf&&<PdfV url={pdf.url} name={pdf.name} onClose={()=>sPdfO(false)}/>}
    <button onClick={onBack} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:13,cursor:"pointer",marginBottom:13,padding:"5px 0",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>← Retour</button>
    {mod.createdBy&&ok&&<button onClick={()=>{sContact(true);sCSent(false);}} className="bt" style={{background:K.c2,border:`1px solid ${K.b1}`,color:K.t2,borderRadius:99,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:13,marginLeft:10,fontFamily:"'Outfit',sans-serif"}}>💬 Contacter le formateur</button>}
    {contact&&<Sheet title="💬 Message au formateur" onClose={()=>sContact(false)}>
      {cSent?<div style={{textAlign:"center",padding:"14px 0"}}><div style={{fontSize:30,marginBottom:8}}>✅</div><div style={{fontSize:13,color:K.t1,fontWeight:700,marginBottom:4}}>Message envoyé !</div><div style={{fontSize:12,color:K.t3}}>Retrouvez la réponse dans votre onglet Messages.</div></div>
      :<><div style={{fontSize:12,color:K.t3,marginBottom:10}}>À propos de : <b style={{color:K.t1}}>{mod.titre}</b></div>
      <textarea value={cTxt} onChange={e=>sCTxt(e.target.value)} rows={4} placeholder="Votre question au formateur…" style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>
      <Btn ch={cSending?"Envoi…":"Envoyer"} dis={cSending||!cTxt.trim()} on={async()=>{sCSending(true);try{await sendMessage({apprenantUid:uid,apprenantNom:uNom,from:uid,fromNom:uNom,fromRole:"apprenant",texte:`[${mod.titre}] ${cTxt.trim()}`,formateurUid:mod.createdBy});sCTxt("");sCSent(true);}catch(e){alert(e.message);}sCSending(false);}} full/></>}
    </Sheet>}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:13,padding:mob?"13px":"18px 20px",marginBottom:10}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}><div style={{width:42,height:42,borderRadius:11,background:`${mod.col}18`,border:`1px solid ${mod.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icoEl(mod.ico,mod.col,20)}</div><div><Tg c={K.t3} bg="none" bd={K.b0} ch={mod.code}/>{mod.mat&&<span style={{marginLeft:7}}><Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={mod.mat}/></span>}<div style={{fontWeight:800,fontSize:mob?14:17,color:K.t1,marginTop:5,marginBottom:3}}>{mod.titre}</div><div style={{color:K.t3,fontSize:12}}>{mod.desc||""}</div></div></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["❓",`${mod.q?.length||0}q`],["📝","Exercice"],vids.length>0?["🎬",`${vids.length} vid.`]:null,pdf?["📄","PDF"]:null].filter(Boolean).map(([ic,v])=><div key={v} style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,padding:"4px 9px",fontSize:11,color:K.t2,display:"flex",alignItems:"center",gap:3}}>{ic} {v}</div>)}</div>
    </div>
    {sc&&ok&&<div style={{background:sc.pct>=60?K.emBg:K.erBg,border:`1px solid ${sc.pct>=60?K.emBd:K.erBd}`,borderRadius:11,padding:"10px 13px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:K.t2,fontSize:13}}>Dernier résultat</span><span style={{color:sc.pct>=60?K.em:K.er,fontWeight:700,fontSize:13}}>{sc.s}/{sc.t} — {sc.pct}%</span></div><Bar p={sc.pct} col={sc.pct>=60?K.em:K.er} h={4}/></div>}
    {vids.length>0&&<div style={{background:K.card,border:`1px solid ${K.rdBd}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"11px 13px",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",gap:7}}><span>🎬</span><span style={{fontWeight:700,fontSize:13,color:K.t1}}>Vidéos</span><Tg c={K.rd} bg={K.rdBg} bd={K.rdBd} ch={`${vids.length}`}/></div><div style={{padding:"9px 11px",display:"flex",flexDirection:"column",gap:6}}>{vids.map(v=>{const lk=!v.gr&&!ok;const pv=pVid(v.url);return <div key={v.id} onClick={()=>lk?onSub():(sPlIdx(vids.indexOf(v)),sPl({url:v.url,titre:v.titre}))} className="bt" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",background:K.c2,borderRadius:9,cursor:"pointer",border:`1px solid ${K.b0}`,opacity:lk?.7:1}}><div style={{width:34,height:26,borderRadius:6,background:"rgba(0,0,0,.3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:12}}>{lk?"🔒":"▶"}</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:12,color:lk?K.t3:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div></div>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}</div>;})} </div></div>}
    {ex&&<div style={{background:K.card,border:`1px solid ${exO?K.inBd:K.b0}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
      <button onClick={()=>sExO(o=>!o)} className="bt" style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:30,height:30,borderRadius:8,background:ok?K.inBg:"rgba(128,128,128,.08)",border:`1px solid ${ok?K.inBd:K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{ok?"📝":"🔒"}</div><div style={{textAlign:"left"}}><div style={{fontWeight:700,fontSize:13,color:K.t1}}>Exercice pratique</div><div style={{fontSize:11,color:K.t3,marginTop:1}}>{ex.ti}</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>{pdf&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch="📄 PDF"/>}<span style={{color:K.t3,fontSize:15,transform:exO?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▾</span></div>
      </button>
      {exO&&<div style={{borderTop:`1px solid ${K.b0}`,padding:"13px"}}>
        {!ok?<div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontSize:22,marginBottom:5}}>🔒</div><div style={{color:K.t3,fontSize:13}}>Abonnés actifs uniquement.</div></div>:<>
          <div style={{background:K.c2,borderRadius:9,padding:"10px 12px",marginBottom:10}}><div style={{color:K.t3,fontSize:10,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Énoncé</div><div style={{color:K.t1,fontSize:13,lineHeight:1.7}}>{ex.en}</div></div>
          {ex.dn?.length>0&&<div style={{marginBottom:10}}><div style={{color:K.t3,fontSize:10,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Données</div><div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:8,overflow:"hidden"}}>{ex.dn.map((row,i)=><div key={i} style={{display:"flex",padding:"7px 11px",borderBottom:i<ex.dn.length-1?`1px solid ${K.b0}`:"none",gap:9}}>{[row.a,row.b,row.c].filter(v=>v!==undefined).map((v,j)=><span key={j} style={{color:j===0?K.t2:K.t1,fontFamily:j>0?"'JetBrains Mono',monospace":"'Outfit',sans-serif",fontSize:j>0?12:13,flex:j===0?1:"none",fontWeight:j>0?600:400}}>{v}</span>)}</div>)}</div></div>}
          {ex.tv?.length>0&&<div style={{marginBottom:10}}><div style={{color:K.t3,fontSize:10,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Travail demandé</div>{ex.tv.map((t,i)=><div key={i} style={{display:"flex",gap:8,background:K.c2,borderRadius:8,padding:"8px 11px",marginBottom:4}}><div style={{width:18,height:18,borderRadius:5,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:K.in_,flexShrink:0}}>{i+1}</div><div style={{color:K.t1,fontSize:13,lineHeight:1.6}}>{t}</div></div>)}</div>}
          <button onClick={()=>sCorr(c=>!c)} className="bt" style={{background:corr?K.emBg:K.c2,border:`1px solid ${corr?K.emBd:K.b0}`,borderRadius:8,padding:"7px 11px",cursor:"pointer",color:corr?K.em:K.t3,fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,width:"100%",minHeight:34}}><span>{corr?"🔼":"🔽"}</span><span>{corr?"Masquer le corrigé":"Voir le corrigé"}</span></button>
          {corr&&<div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:8,padding:"10px 12px",marginTop:6}}><div style={{color:K.em,fontSize:12,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"}}>{ex.co}</div></div>}
          {pdf&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${K.b0}`}}><Btn ch="📄 Ouvrir PDF" on={()=>sPdfO(true)} v="i" full sx={{minHeight:40,fontSize:13}}/></div>}
        </>}
      </div>}
    </div>}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:13,padding:mob?"13px":"16px 18px"}}>
      {!ok?<div style={{textAlign:"center",padding:"7px 0"}}><div style={{fontSize:28,marginBottom:7}}>🔒</div><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Module verrouillé</div><div style={{color:K.t3,fontSize:12,marginBottom:12}}>Abonnement requis (50 USD).</div><Btn ch="Obtenir l'accès →" on={onSub} v="w" sx={{minHeight:44}}/></div>
      :mod.evalType==="none"?<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Sans évaluation</div><div style={{color:K.t3,fontSize:12,marginBottom:13}}>Ce module ne comporte pas de test noté.</div><Btn ch={doneNoEval?"✓ Terminé":"Marquer comme terminé"} on={onMarkDone} dis={doneNoEval} sx={{minHeight:44,fontSize:14}}/></>
      :mod.evalType==="open"?<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Questions ouvertes</div><div style={{color:K.t3,fontSize:12,marginBottom:13}}>{mod.openQ?.length||0} question(s) · Corrigé par votre formateur</div>{openAnswer?<div style={{background:openAnswer.graded?K.emBg:K.waBg,border:`1px solid ${openAnswer.graded?K.emBd:K.waBd}`,borderRadius:9,padding:"9px 12px",fontSize:12,color:openAnswer.graded?K.em:K.wa,fontWeight:600}}>{openAnswer.graded?`✓ Corrigé — ${openAnswer.totalPoints}/${openAnswer.maxPoints} pts (${openAnswer.pct}%)`:"⏳ En attente de correction par le formateur"}</div>:<Btn ch="Répondre →" on={onOpenQ} sx={{minHeight:44,fontSize:14}} dis={!mod.openQ?.length}/>}</>
      :<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Évaluation QCM</div><div style={{color:K.t3,fontSize:12,marginBottom:13}}>{mod.q?.length||0} questions · Feedback immédiat</div><Btn ch={sc?"Repasser →":"Commencer →"} on={onQ} sx={{minHeight:44,fontSize:14}} dis={!mod.q?.length}/></>}
    </div>
  </div>;
}

function OpenQuiz({mod,uid,uNom,onDone,onBack}){
  const K=useK();const{mob}=useW();
  const qs=mod.openQ||[];
  const[answers,setAnswers]=useState(()=>Object.fromEntries(qs.map(q=>[q.id,""])));
  const[sending,setSending]=useState(false);
  const maxPoints=qs.reduce((a,q)=>a+(q.points||0),0);
  if(!qs.length)return <div style={{textAlign:"center",padding:40,color:K.t3}}>Aucune question.<br/><br/><Btn ch="← Retour" on={onBack} v="g"/></div>;
  const submit=async()=>{
    if(qs.some(q=>!answers[q.id]?.trim()))return alert("Répondez à toutes les questions avant de soumettre.");
    setSending(true);
    try{
      await submitOpenAnswers({
        modId:mod.id,modTitre:mod.titre,apprenantUid:uid,apprenantNom:uNom,formateurUid:mod.createdBy,
        answers:qs.map(q=>({qId:q.id,q:q.q,texte:answers[q.id]})),maxPoints
      });
      onDone();
    }catch(e){alert(e.message);setSending(false);}
  };
  return <div style={{maxWidth:600,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
      <Btn ch="Quitter" on={onBack} v="g" sm/>
      <span style={{color:K.t3,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{qs.length} question{qs.length>1?"s":""} · {maxPoints} pts</span>
    </div>
    <div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:10,padding:"10px 13px",marginBottom:15,fontSize:12,color:K.t2}}>
      ✍️ Répondez librement à chaque question. Votre formateur corrigera et notera vos réponses — le score final apparaîtra dans votre progression une fois la correction faite.
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {qs.map((q,i)=><div key={q.id} style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:13,padding:mob?"14px":"16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9,gap:8}}>
          <div style={{color:K.t1,fontSize:mob?13:14,fontWeight:700,lineHeight:1.45}}>{i+1}. {q.q}</div>
          <span style={{flexShrink:0,fontSize:10,fontWeight:700,color:K.t3,background:K.c2,borderRadius:99,padding:"2px 8px"}}>{q.points} pts</span>
        </div>
        <textarea value={answers[q.id]} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Votre réponse..." rows={4}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box"}}/>
      </div>)}
    </div>
    <div style={{marginTop:16}}><Btn ch={sending?"Envoi…":"Soumettre mes réponses →"} on={submit} dis={sending} full sx={{minHeight:46,fontSize:14}}/></div>
  </div>;
}

function QZ({mod,onDone,onBack}){
  const K=useK();const{mob}=useW();
  const[qi,sQi]=useState(0),[sel,sSel]=useState(null),[conf,sCf]=useState(false),[log,sLog]=useState([]),[fin,sFin]=useState(false);
  const qs=mod.q||[];const q=qs[qi];const tot=qs.length;
  if(!tot)return <div style={{textAlign:"center",padding:40,color:K.t3}}>Aucune question.<br/><br/><Btn ch="← Retour" on={onBack} v="g"/></div>;
  const val=()=>{if(sel===null)return;sCf(true);sLog(l=>[...l,{sel,bon:q.b,ok:sel===q.b,txt:q.q,r:q.r}]);};
  const nxt=()=>{if(qi+1>=tot)sFin(true);else{sQi(i=>i+1);sSel(null);sCf(false);}};
  if(fin){const s=log.filter(l=>l.ok).length,p=Math.round(s/tot*100),w=p>=60;return <div style={{maxWidth:530,margin:"0 auto",animation:"sc .28s ease"}}><div style={{background:K.card,border:`1px solid ${w?K.emBd:K.erBd}`,borderRadius:14,padding:mob?"19px 15px":"26px 22px",textAlign:"center"}}><div style={{fontSize:48,marginBottom:8}}>{w?"🏆":"📚"}</div><div style={{fontWeight:800,fontSize:19,color:K.t1,marginBottom:3}}>{w?"Réussi !":"À retravailler"}</div><div style={{color:K.t3,fontSize:12,marginBottom:15}}>{mod.titre}</div><div style={{fontWeight:900,fontSize:40,letterSpacing:"-.5px",marginBottom:3,background:`linear-gradient(135deg,${w?K.em:K.er},${w?K.in_:"#FCA5A5"})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s}/{tot}</div><div style={{color:K.t3,fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>{p}%</div><div style={{color:w?K.em:K.er,fontWeight:700,marginBottom:17}}>{p>=80?"Excellent":p>=60?"Bien":p>=40?"Passable":"Insuffisant"}</div><div style={{maxWidth:190,margin:"0 auto 18px"}}><Bar p={p} col={w?K.em:K.er} h={5}/></div><div style={{textAlign:"left",marginBottom:17}}><div style={{color:K.t3,fontSize:12,marginBottom:6,fontWeight:600}}>Correction</div>{log.map((l,i)=><div key={i} style={{background:l.ok?K.emBg:K.erBg,border:`1px solid ${l.ok?K.emBd:K.erBd}`,borderRadius:8,padding:"7px 10px",marginBottom:4}}><div style={{color:K.t3,fontSize:11,marginBottom:2}}>Q{i+1} · {l.txt}</div><div style={{color:l.ok?K.em:K.er,fontWeight:600,fontSize:12}}>{l.ok?"✓ Correct":`✗ Faux · ${l.r[l.bon]}`}</div></div>)}</div><div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}><Btn ch="Recommencer" on={()=>{sQi(0);sSel(null);sCf(false);sLog([]);sFin(false);}} v="g" sx={{minHeight:42}}/><Btn ch="Enregistrer →" on={()=>onDone(s,tot)} sx={{minHeight:42}}/></div></div></div>;}
  return <div style={{maxWidth:600,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><Btn ch="Quitter" on={onBack} v="g" sm/><span style={{color:K.t3,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{mod.code} · {qi+1}/{tot}</span><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={`${log.filter(l=>l.ok).length} ✓`}/></div>
    <div style={{marginBottom:17}}><Bar p={Math.round(qi/tot*100)} col={mod.col} h={3}/></div>
    <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:13,padding:mob?"15px 13px":"20px 18px"}}>
      <div style={{color:K.t3,fontSize:10,fontWeight:700,letterSpacing:"1.5px",marginBottom:8,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>Question {qi+1}</div>
      <div style={{color:K.t1,fontSize:mob?14:15,fontWeight:700,lineHeight:1.45,marginBottom:19}}>{q.q}</div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:19}}>
        {q.r.map((op,oi)=>{let bg=K.c2,bd=K.b0,col=K.t2;if(conf){if(oi===q.b){bg=K.emBg;bd=K.em;col=K.em;}else if(oi===sel){bg=K.erBg;bd=K.er;col=K.er;}}else if(sel===oi){bg=`${mod.col}15`;bd=mod.col;col=K.t1;}return <button key={oi} onClick={()=>{if(!conf)sSel(oi);}} style={{padding:"11px 12px",background:bg,border:`1.5px solid ${bd}`,borderRadius:10,cursor:conf?"default":"pointer",color:col,fontSize:13,fontWeight:600,textAlign:"left",transition:"all .15s",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:8,minHeight:46}}><span style={{width:22,height:22,borderRadius:6,background:`${bd}20`,border:`1px solid ${bd}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:bd,flexShrink:0}}>{["A","B","C","D"][oi]}</span><span style={{flex:1}}>{op}</span>{conf&&oi===q.b&&<span style={{color:K.em}}>✓</span>}{conf&&oi===sel&&oi!==q.b&&<span style={{color:K.er}}>✗</span>}</button>;})}
      </div>
      {!conf?<Btn ch="Valider" on={val} dis={sel===null} full sx={{minHeight:44,fontSize:14}}/>:<Btn ch={qi+1<tot?"Suivant →":"Résultats →"} on={nxt} full sx={{minHeight:44,fontSize:14}}/>}
    </div>
  </div>;
}

function Prog({pr,sc,gp,nd,ok,mods}){
  const K=useK();const{mob}=useW();
  const total=mods.length;
  const avgScore=Object.values(sc||{}).length?Math.round(Object.values(sc||{}).reduce((a,s)=>a+(s?.pct||0),0)/Object.values(sc||{}).length):0;
  const bestScore=Object.values(sc||{}).length?Math.max(...Object.values(sc||{}).map(s=>s?.pct||0)):0;
  // Progress rings section
  const rings=[
    {label:"Progression",pct:gp,col:K.em},
    {label:"Score moyen",pct:avgScore,col:"#3B82F6"},
    {label:"Meilleur score",pct:bestScore,col:"#F59E0B"},
  ];const{tid}=useContext(Ctx);
  const isLight=['light','sepia'].includes(tid);
  const done=mods.filter(m=>pr[m.id]==="done");
  const todo=mods.filter(m=>pr[m.id]!=="done");
  if(!ok)return <EmptyState ico="lock" title="Accès requis" desc="Abonnez-vous pour suivre votre progression et accéder à tous les modules."/>;
  return <div style={{maxWidth:700,margin:"0 auto",animation:"fadeIn .35s ease"}}>
    {/* Rings de progression */}
    <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:16,padding:"20px",marginBottom:16,display:"flex",justifyContent:"space-around",alignItems:"center",flexWrap:"wrap",gap:16}}>
      {rings.map(({label,pct,col})=><div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <ProgressRing pct={pct} size={72} stroke={6} col={col}/>
        <div style={{fontSize:11,color:K.t2,fontWeight:600,textAlign:"center"}}>{label}</div>
      </div>)}
    </div>
    {/* Badges */}
    <BadgesPanel nd={nd} total={total} sc={sc}/>
    <div style={{marginTop:20}}>
    {/* Header bannière */}
    <div style={{background:`linear-gradient(135deg,${K.in_}18,${K.em}10)`,border:`1px solid ${K.inBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:12,color:K.in_,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-chart-line" style={{fontSize:13}}/> Progression globale</div>
      <div style={{fontSize:mob?20:26,fontWeight:900,color:K.t1,marginBottom:4}}>{gp}% accompli</div>
      <div style={{fontSize:13,color:K.t2,marginBottom:14}}>{nd} module{nd>1?"s":""} terminé{nd>1?"s":""} sur {mods.length}</div>
      <Bar p={gp} col={K.in_} h={6}/>
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        {[[`${nd}`,"Complétés",K.em],[`${mods.length-nd}`,"Restants",K.t3],[`${Object.values(sc).filter(s=>s.pct>=60).length}`,"Réussis",K.in_]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,borderRadius:9,padding:"7px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}
      </div>
    </div>

    {/* Modules complétés */}
    {done.length>0&&<><div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:10,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-check-circle" style={{fontSize:16,color:K.em}}/> Complétés ({done.length})</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
      {done.map((m,i)=>{const s=sc[m.id];const cp=getCardPalette(tid,i);return <div key={m.id} style={{background:cp.bg,border:`1px solid ${cp.bd}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,animation:`up .25s ease ${i*15}ms both`}}>
        <div style={{width:38,height:38,borderRadius:11,background:isLight?"rgba(255,255,255,.8)":K.b1,border:`1px solid ${cp.bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icoEl(m.ico,cp.ac,17)}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>{m.mat&&<div style={{fontSize:10,color:cp.ac,fontWeight:600,marginTop:1}}>{m.mat}</div>}</div>
        {s&&<div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:800,fontSize:17,color:s.pct>=60?K.em:K.er}}>{s.pct}%</div><div style={{fontSize:9,color:K.t3}}>Score QCM</div></div>}
        <i className="ti ti-check-circle" style={{fontSize:18,color:K.em,flexShrink:0}}/>
      </div>;})}
    </div></>}

    {/* Modules à faire */}
    {todo.length>0&&<><div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:10,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-clock" style={{fontSize:16,color:K.t3}}/> À compléter ({todo.length})</div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {todo.map((m,i)=><div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:11,opacity:.75,animation:`up .25s ease ${i*12}ms both`}}>
        <div style={{width:36,height:36,borderRadius:10,background:K.c2,border:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{!ok?<i className="ti ti-lock" style={{fontSize:14,color:K.t3}}/>:icoEl(m.ico,K.t3,15)}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:K.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>{m.mat&&<div style={{fontSize:10,color:K.t3,marginTop:1}}>{m.mat}</div>}</div>
        <div style={{fontSize:11,color:K.t3,flexShrink:0}}>{m.q?.length||0} questions</div>
      </div>)}
    </div></>}
  </div></div>;}

function Res({sc,ok,mods}){
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const isLight=['light','sepia'].includes(tid);
  const att=mods.filter(m=>sc[m.id]);
  const avg=att.length?Math.round(att.reduce((a,m)=>a+sc[m.id].pct,0)/att.length):0;
  const pass=att.filter(m=>sc[m.id].pct>=60).length;
  const fail=att.filter(m=>sc[m.id].pct<60).length;
  return <div style={{maxWidth:700,margin:"0 auto",animation:"up .25s ease"}}>
    {/* Header */}
    <div style={{background:`linear-gradient(135deg,${K.wa}18,${K.em}10)`,border:`1px solid ${K.waBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:12,color:K.wa,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-trophy" style={{fontSize:13}}/> Tableau des résultats</div>
      <div style={{fontSize:mob?20:26,fontWeight:900,color:K.t1,marginBottom:4}}>Moyenne : {avg}%</div>
      <div style={{fontSize:13,color:K.t2,marginBottom:14}}>{att.length} évaluation{att.length>1?"s":""} passée{att.length>1?"s":""}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[[`${att.length}`,"Évaluations",K.t2],[`${pass}`,"Réussies",K.em],[`${fail}`,"À retravailler",K.er],[`${avg}%`,"Moyenne",avg>=60?K.em:K.er]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,borderRadius:9,padding:"7px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}
      </div>
    </div>

    {!ok||att.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"44px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:10,animation:"fl 3s ease-in-out infinite"}}>{!ok?"🔒":"📊"}</div><div style={{color:K.t2,fontSize:14,fontWeight:700,marginBottom:4}}>{!ok?"Accès requis":"Aucun résultat"}</div><div style={{color:K.t3,fontSize:12}}>{!ok?"Abonnez-vous.":"Commencez un module !"}</div></div>:
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {att.map((m,i)=>{const s=sc[m.id];const w=s.pct>=60;const cp=getCardPalette(tid,i);return <div key={m.id} style={{background:w?cp.bg:K.card,border:`1px solid ${w?cp.bd:K.erBd}`,borderRadius:13,padding:"14px 16px",animation:`up .25s ease ${i*22}ms both`}}>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
          <div style={{width:40,height:40,borderRadius:11,background:isLight?w?"rgba(255,255,255,.8)":K.erBg:K.b1,border:`1px solid ${w?cp.bd:K.erBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icoEl(m.ico,w?cp.ac:K.er,17)}</div>
          <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div><div style={{color:K.t3,fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{m.code}{m.mat?` · ${m.mat}`:""}</div></div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:900,fontSize:22,color:w?cp.ac:K.er,letterSpacing:"-.5px"}}>{s.pct}%</div>
            <div style={{fontSize:10,color:K.t3}}>{s.s}/{s.t} bonnes</div>
          </div>
        </div>
        <Bar p={s.pct} col={w?cp.ac:K.er} h={4}/>
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>{w?<><i className="ti ti-check-circle" style={{fontSize:14,color:K.em}}/><span style={{fontSize:12,color:K.em,fontWeight:600}}>{s.pct>=80?"Excellent !":s.pct>=70?"Très bien":"Bien"}</span></>:<><i className="ti ti-alert-circle" style={{fontSize:14,color:K.er}}/><span style={{fontSize:12,color:K.er,fontWeight:600}}>À retravailler</span></>}</div>
      </div>;})}
    </div>}
  </div>;
}

function VidsPage({ok,onSub,vids,live}){
  const K=useK();const{mob}=useW();const[fi,sF]=useState("tous");const[pl,sPl]=useState(null);
  const fil=fi==="tous"?vids:fi==="gr"?vids.filter(v=>v.gr):fi==="pm"?vids.filter(v=>!v.gr):vids.filter(v=>v.mid===fi);
  if(!vids.length&&!live.on)return <EmptyState ico="video" title="Aucune vidéo pour le moment" desc="Les vidéos de cours et replays apparaîtront ici dès que votre formateur les publiera."/>;
  return <div style={{animation:"up .3s ease"}}>
    {pl&&<Player url={pl.url} titre={pl.titre} onClose={()=>{sPl(null);}} playlist={fil.map(v=>({url:v.url,titre:v.titre,gr:v.gr}))} startIdx={fil.findIndex(v=>v.url===pl.url)}/>}
    {live.on&&<div onClick={()=>ok||live.gr?sPl({url:live.url,titre:live.titre||"Direct"}):onSub()} className="hv" style={{background:K.rdBg,border:`1px solid ${K.rdBd}`,borderRadius:12,padding:"13px 15px",marginBottom:13,cursor:"pointer",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><span style={{fontSize:20,animation:"blink 1.5s ease-in-out infinite",flexShrink:0}}>🔴</span><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}><span style={{fontWeight:800,fontSize:14,color:K.t1}}>{live.titre||"Cours en direct"}</span><Tg c={K.rd} bg={K.rdBg} bd={K.rdBd} ch="EN DIRECT"/></div><div style={{fontSize:12,color:K.t3}}>{live.desc||""}</div></div><Btn ch="▶ Rejoindre" v="r" sm sx={{flexShrink:0}}/></div>}
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:10}}>Vidéothèque {vids.length>0&&<span style={{color:K.t3,fontWeight:400,fontSize:13}}>({vids.length})</span>}</div>
    <div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>{[["tous","Toutes"],["gr","Gratuites"],["pm","Premium"]].map(([k,l])=><button key={k} onClick={()=>sF(k)} className="bt" style={{background:fi===k?K.c2:"transparent",border:`1px solid ${fi===k?K.b1:K.b0}`,borderRadius:99,padding:"4px 10px",fontSize:11,fontWeight:600,color:fi===k?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{l}</button>)}</div>
    {fil.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"44px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>🎬</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune vidéo</div><div style={{color:K.t3,fontSize:12}}>L'admin n'a pas encore ajouté de vidéos.</div></div>
    :<div className="gv">{fil.map(v=>{const lk=!v.gr&&!ok;const pv=pVid(v.url);const th=pv?.t==="yt"?`https://img.youtube.com/vi/${pv.id}/mqdefault.jpg`:null;
      return <div key={v.id} className="hv" onClick={()=>lk?onSub():sPl({url:v.url,titre:v.titre})} style={{background:K.card,border:`1px solid ${lk?K.b0:K.b1}`,borderRadius:12,overflow:"hidden",cursor:"pointer",opacity:lk?.7:1}}>
        <div style={{width:"100%",paddingTop:"56.25%",position:"relative",background:K.c2}}>{th?<img src={th} alt={v.titre} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:null}<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.32)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:40,height:40,borderRadius:"50%",background:lk?"rgba(0,0,0,.55)":"rgba(52,211,153,.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{lk?"🔒":"▶"}</div></div><div style={{position:"absolute",top:6,right:6}}>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}</div></div>
        <div style={{padding:"10px 12px"}}><div style={{fontWeight:700,fontSize:13,color:lk?K.t3:K.t1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div>{v.desc&&<div style={{fontSize:11,color:K.t3,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:5}}>{v.desc}</div>}</div>
      </div>;})}
    </div>}
  </div>;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function PresPage({ok,onSub,pres}){
  const K=useK();const{mob}=useW();
  const{tid}=useContext(Ctx);
  const[open,sOpen]=useState(null);
  const[fi,sF]=useState("Toutes");
  const isLight=['light','sepia'].includes(tid);
  if(!pres.length)return <EmptyState ico="presentation" title="Aucune présentation disponible"
    desc="Les supports de cours PDF et présentations seront accessibles ici après leur publication."/>;
  const mats=[...new Set(pres.map(p=>p.mat||"Général"))];
  const fil=fi==="Toutes"?pres:pres.filter(p=>(p.mat||"Général")===fi);
  return <div style={{animation:"up .3s ease"}}>
    {open&&<PresViewer url={open.url} titre={open.titre} desc={open.desc} onClose={()=>sOpen(null)}/>}
    {/* Bannière */}
    <div style={{background:`linear-gradient(135deg,${K.in_}18,${K.inD}10)`,border:`1px solid ${K.inBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:12,color:K.in_,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-presentation" style={{fontSize:13}}/> Présentations</div>
      <div style={{fontSize:mob?18:22,fontWeight:900,color:K.t1,marginBottom:4}}>Supports de cours</div>
      <div style={{fontSize:13,color:K.t2}}>{pres.length} présentation{pres.length>1?"s":""} disponible{pres.length>1?"s":""}</div>
    </div>
    {/* Filtres */}
    {mats.length>1&&<div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>{["Toutes",...mats].map(m=><button key={m} onClick={()=>sF(m)} className="bt" style={{background:fi===m?K.c2:"transparent",border:`1px solid ${fi===m?K.b1:K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:600,color:fi===m?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{m}</button>)}</div>}
    {fil.length===0
      ?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"44px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>📊</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune présentation</div><div style={{color:K.t3,fontSize:12}}>L'admin n'a pas encore ajouté de présentations.</div></div>
      :<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {fil.map((p,i)=>{
          const lk=!p.gr&&!ok;
          const cp={bg:K.inBg,bd:K.inBd,ac:K.in_};
          return <div key={p.id} onClick={()=>lk?onSub():sOpen(p)} className="hv"
            style={{background:isLight?"#F0F4FF":K.card,border:`1px solid ${lk?K.b0:K.inBd}`,borderRadius:14,overflow:"hidden",cursor:"pointer",opacity:lk?.7:1,animation:`up .3s ease ${i*20}ms both`}}>
            {/* Header carte */}
            <div style={{background:`linear-gradient(135deg,${K.in_}22,${K.inD}10)`,padding:"16px 16px 12px",borderBottom:`1px solid ${K.inBd}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{width:40,height:40,borderRadius:11,background:isLight?"rgba(255,255,255,.8)":K.b1,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={lk?"ti ti-lock":"ti ti-presentation"} style={{fontSize:18,color:lk?K.t3:K.in_}}/></div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  {p.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}
                </div>
              </div>
              <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3,lineHeight:1.3}}>{p.titre}</div>
              {p.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={p.mat}/>}
            </div>
            {/* Footer carte */}
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              {p.desc?<div style={{fontSize:11,color:K.t2,flex:1,marginRight:8,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.desc}</div>:<div style={{flex:1}}/>}
              {!lk&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:K.in_,flexShrink:0}}><span>Voir</span><i className="ti ti-arrow-right" style={{fontSize:12}}/></div>}
              {lk&&<div style={{fontSize:11,color:K.t3}}>🔒 Abonnement</div>}
            </div>
          </div>;
        })}
      </div>
    }
  </div>;
}

// Plateformes de stages virtuels pré-chargées (seed)
const SEED_PLATS=[
  {nom:"The Forage",url:"https://www.theforage.com",logo:"🌾",desc:"Stages virtuels gratuits proposés par les plus grandes entreprises mondiales (Deloitte, KPMG, JP Morgan, BCG...). Programmes de 5 à 6h.",cats:["Finance & Comptabilité","Audit & Contrôle","Banque & Assurance"],gratuit:true,langue:"EN",ordre:1},
  {nom:"LinkedIn Learning",url:"https://www.linkedin.com/learning",logo:"💼",desc:"Programmes de formation et stages certifiants en finance, comptabilité et droit. Accès via votre profil LinkedIn.",cats:["Finance & Comptabilité","Droit des affaires","Banque & Assurance"],gratuit:false,langue:"FR/EN",ordre:2},
  {nom:"Coursera",url:"https://www.coursera.org",logo:"🎓",desc:"Cours et stages virtuels des meilleures universités et entreprises (Google, IBM, HEC Paris, Université de Genève).",cats:["Finance & Comptabilité","Audit & Contrôle","Banque & Assurance"],gratuit:false,langue:"FR/EN",ordre:3},
  {nom:"ACCA Global",url:"https://www.accaglobal.com",logo:"📊",desc:"Stages virtuels et ressources professionnelles pour comptables. Certifications reconnues internationalement.",cats:["Finance & Comptabilité","Audit & Contrôle"],gratuit:false,langue:"EN",ordre:4},
  {nom:"OHADA Business",url:"https://www.ohada.com",logo:"⚖️",desc:"Ressources juridiques et formations sur le droit OHADA, les affaires en Afrique et le droit des sociétés.",cats:["Droit des affaires"],gratuit:true,langue:"FR",ordre:5},
  {nom:"Banque de France",url:"https://www.banque-france.fr/fr/publications-et-statistiques/formation",logo:"🏦",desc:"Formations et stages virtuels sur la banque, la finance et la stabilité financière.",cats:["Banque & Assurance","Finance & Comptabilité"],gratuit:true,langue:"FR",ordre:6},
  {nom:"IFACI",url:"https://www.ifaci.com",logo:"🔍",desc:"Institut Français de l'Audit et du Contrôle Internes — formations certifiantes pour auditeurs et contrôleurs.",cats:["Audit & Contrôle"],gratuit:false,langue:"FR",ordre:7},
  {nom:"Virtusa Virtual Internship",url:"https://www.virtualsimulator.com",logo:"💻",desc:"Simulations de travail en entreprise pour développer des compétences pratiques en finance et comptabilité.",cats:["Finance & Comptabilité","Audit & Contrôle"],gratuit:true,langue:"EN",ordre:8},
];

const CAT_COLORS={
  "Finance & Comptabilité":{bg:"rgba(52,211,153,.12)",bd:"rgba(52,211,153,.25)",ac:"#059669",ic:"chart-bar"},
  "Droit des affaires":{bg:"rgba(129,140,248,.12)",bd:"rgba(129,140,248,.25)",ac:"#4F46E5",ic:"scale"},
  "Audit & Contrôle":{bg:"rgba(251,191,36,.12)",bd:"rgba(251,191,36,.25)",ac:"#D97706",ic:"shield-check"},
  "Banque & Assurance":{bg:"rgba(96,165,250,.12)",bd:"rgba(96,165,250,.25)",ac:"#2563EB",ic:"building-bank"},
};
const seedPlateformes=async()=>{
  try{
    const snap=await getDocs(collection(db,"plateformes"));
    if(snap.size>0)return;
    for(const p of SEED_PLATS){const r=doc(collection(db,"plateformes"));await setDoc(r,p);}
  }catch(e){console.error(e);}
};

function StagePage({stages,plats,ok}){
  const K=useK();const{mob}=useW();
  const{tid}=useContext(Ctx);
  const[tab,sTab]=useState("offres");
  const[cat,sCat]=useState("Toutes");
  const[search,sSearch]=useState("");
  const isLight=['light','sepia'].includes(tid);
  if(!stages.length&&!plats.length)return <EmptyState ico="briefcase" title="Stages et plateformes à venir"
    desc="Les offres de stages et plateformes d'expériences virtuelles seront chargées ici très prochainement."/>;
  const cats=["Toutes","Finance & Comptabilité","Droit des affaires","Audit & Contrôle","Banque & Assurance"];

  const filStages=stages.filter(s=>{
    const matchCat=cat==="Toutes"||s.cat===cat;
    const matchSearch=!search||s.titre?.toLowerCase().includes(search.toLowerCase())||s.entreprise?.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchSearch;
  });
  const filPlats=cat==="Toutes"?plats:plats.filter(p=>p.cats?.includes(cat));

  return <div style={{animation:"up .3s ease"}}>
    {/* Bannière */}
    <div style={{background:`linear-gradient(135deg,${K.wa}18,${K.em}10)`,border:`1px solid ${K.waBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:12,color:K.wa,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-briefcase" style={{fontSize:13}}/> Stages Virtuels</div>
      <div style={{fontSize:mob?18:22,fontWeight:900,color:K.t1,marginBottom:4}}>Développez votre expérience</div>
      <div style={{fontSize:13,color:K.t2,marginBottom:14}}>Plateformes internationales · Offres structurées · Certifications reconnues</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[[`${plats.length}`,"Plateformes",K.wa],[`${stages.length}`,"Offres",K.em],["4","Catégories",K.in_]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,borderRadius:9,padding:"7px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",background:K.c2,borderRadius:10,padding:3,marginBottom:14,gap:2}}>
      {[["offres","🎯 Offres de stages"],["plats","🌐 Plateformes"]].map(([k,l])=><button key={k} onClick={()=>sTab(k)} className="bt" style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontWeight:700,fontSize:mob?12:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:tab===k?K.card:"transparent",color:tab===k?K.t1:K.t3,minHeight:38,boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.08)":"none"}}>{l}</button>)}
    </div>

    {/* Filtres catégories */}
    <div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>
      {cats.map(c=>{const cc=CAT_COLORS[c];return <button key={c} onClick={()=>sCat(c)} className="bt" style={{background:cat===c?(cc?cc.bg:K.c2):"transparent",border:`1px solid ${cat===c?(cc?cc.bd:K.b1):K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:600,color:cat===c?(cc?cc.ac:K.t1):K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28,display:"flex",alignItems:"center",gap:5}}>{cc&&<i className={"ti ti-"+cc.ic} style={{fontSize:12}}/>}{c}</button>;})}
    </div>

    {/* OFFRES */}
    {tab==="offres"&&<>
      <div style={{marginBottom:11}}><input value={search} onChange={e=>sSearch(e.target.value)} placeholder="🔍 Rechercher une offre ou entreprise..." style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,color:K.t1,fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box",minHeight:42,caretColor:K.em}} onFocus={e=>e.target.style.borderColor=K.emBd} onBlur={e=>e.target.style.borderColor=K.b0}/></div>
      {filStages.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:14,padding:"44px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>🎯</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune offre</div><div style={{color:K.t3,fontSize:12}}>L'admin n'a pas encore posté d'offres de stages.</div></div>
      :<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filStages.map((s,i)=>{
          const cc=CAT_COLORS[s.cat]||{bg:K.c2,bd:K.b0,ac:K.em,ic:"briefcase"};
          const exp=s.dateFin&&new Date(s.dateFin)<new Date();
          return <div key={s.id} style={{background:isLight?cc.bg:K.card,border:`1px solid ${exp?K.b0:cc.bd}`,borderRadius:13,padding:"14px 16px",opacity:exp?.6:1,animation:`up .25s ease ${i*15}ms both`}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10,flexWrap:"wrap"}}>
              <div style={{width:44,height:44,borderRadius:12,background:isLight?"rgba(255,255,255,.9)":K.b1,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:s.logo?20:16}}>{s.logo||<i className={"ti ti-"+cc.ic} style={{fontSize:20,color:cc.ac}}/>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3,lineHeight:1.3}}>{s.titre}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
                  {s.entreprise&&<Tg c={cc.ac} bg={cc.bg} bd={cc.bd} ch={s.entreprise}/>}
                  {s.cat&&<Tg c={K.t2} bg={K.c2} bd={K.b0} ch={s.cat}/>}
                  {s.duree&&<Tg c={K.t3} bg="none" bd={K.b0} ch={"⏱ "+s.duree}/>}
                  {s.gratuit?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Payant"/>}
                  {exp?<Tg c={K.er} bg={K.erBg} bd={K.erBd} ch="Expiré"/>:s.dateFin?<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch={"📅 "+s.dateFin}/>:null}
                </div>
                {s.desc&&<div style={{fontSize:12,color:K.t2,lineHeight:1.5,marginBottom:8}}>{s.desc}</div>}
                {s.competences&&s.competences.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{s.competences.map(c=><span key={c} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,border:`1px solid ${K.b1}`,borderRadius:5,padding:"2px 7px",fontSize:10,color:K.t2}}>{c}</span>)}</div>}
              </div>
            </div>
            <a href={s.url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:`linear-gradient(135deg,${cc.ac}22,${cc.ac}11)`,border:`1px solid ${cc.bd}`,borderRadius:8,padding:"8px 14px",color:cc.ac,fontWeight:700,fontSize:12,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}>
              <i className="ti ti-external-link" style={{fontSize:13}}/>Postuler / Voir l'offre
            </a>
          </div>;
        })}
      </div>}
    </>}

    {/* PLATEFORMES */}
    {tab==="plats"&&<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
      {filPlats.map((p,i)=>{
        const mainCat=p.cats?.[0];const cc=CAT_COLORS[mainCat]||{bg:K.c2,bd:K.b0,ac:K.em,ic:"globe"};
        return <div key={p.id} style={{background:isLight?cc.bg:K.card,border:`1px solid ${cc.bd}`,borderRadius:14,overflow:"hidden",animation:`up .25s ease ${i*20}ms both`}}>
          <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${cc.bd}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:44,height:44,borderRadius:12,background:isLight?"rgba(255,255,255,.9)":K.b1,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{p.logo}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14,color:K.t1}}>{p.nom}</div><div style={{fontSize:10,color:K.t3,marginTop:1}}>🌐 {p.langue||"EN"} · {p.gratuit?"Gratuit":"Payant/Freemium"}</div></div>
              {p.gratuit?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Freemium"/>}
            </div>
            <div style={{fontSize:12,color:K.t2,lineHeight:1.55,marginBottom:10}}>{p.desc}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {p.cats?.map(c=>{const ccc=CAT_COLORS[c];return <span key={c} style={{background:ccc?ccc.bg:K.c2,border:`1px solid ${ccc?ccc.bd:K.b0}`,borderRadius:5,padding:"2px 7px",fontSize:10,color:ccc?ccc.ac:K.t2,display:"flex",alignItems:"center",gap:3}}><i className={"ti ti-"+(ccc?ccc.ic:"tag")} style={{fontSize:10}}/>{c}</span>;})}
            </div>
          </div>
          <div style={{padding:"10px 14px"}}>
            <a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:`linear-gradient(135deg,${cc.ac},${cc.ac}CC)`,borderRadius:8,padding:"9px",color:"#fff",fontWeight:700,fontSize:12,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:36}}>
              <i className="ti ti-external-link" style={{fontSize:13}}/>Accéder à {p.nom}
            </a>
          </div>
        </div>;
      })}
    </div>}
  </div>;
}

// ── DONNÉES SERVICES ─────────────────────────────────────────────────────────
const SERVICES=[
  {
    id:"compta",
    ico:"calculator",
    col:"#34D399",colBg:"rgba(52,211,153,.12)",colBd:"rgba(52,211,153,.25)",
    titre:"Assistance Comptable",
    tagline:"Votre comptabilité SYSCOHADA, entre de bonnes mains",
    desc:"Nous prenons en charge votre comptabilité générale selon les normes SYSCOHADA Révisé : tenue des livres, établissement des états financiers, assistance aux arrêtés de comptes et préparation aux contrôles.",
    prestations:[
      "Tenue de comptabilité générale (SYSCOHADA)",
      "Établissement des états financiers annuels",
      "Bilan, compte de résultat, TAFIRE",
      "Assistance aux arrêtés mensuels et trimestriels",
      "Mise en place du plan comptable adapté",
      "Formation du personnel comptable interne",
    ],
    cibles:["PME","Startups","ONG","Associations","Professions libérales"],
    badge:"Service phare",badgeCol:"#34D399",
  },
  {
    id:"fiscal",
    ico:"receipt-tax",
    col:"#818CF8",colBg:"rgba(129,140,248,.12)",colBd:"rgba(129,140,248,.25)",
    titre:"Assistance Fiscale",
    tagline:"Maîtrisez vos obligations fiscales en toute sérénité",
    desc:"Nos experts vous accompagnent dans la gestion de vos obligations fiscales : déclarations TVA, impôt sur les bénéfices, taxes diverses, et optimisation fiscale dans le respect de la législation en vigueur.",
    prestations:[
      "Déclarations TVA mensuelles / trimestrielles",
      "Déclaration d'impôt sur les bénéfices (IBP)",
      "Taxes professionnelles et parafiscales",
      "Assistance lors des contrôles fiscaux",
      "Optimisation fiscale légale",
      "Veille sur la réglementation fiscale locale",
    ],
    cibles:["Entreprises","Commerçants","Importateurs","Exportateurs"],
    badge:"Populaire",badgeCol:"#818CF8",
  },
  {
    id:"controle",
    ico:"chart-dots-3",
    col:"#FBBF24",colBg:"rgba(251,191,36,.12)",colBd:"rgba(251,191,36,.25)",
    titre:"Contrôle de Gestion",
    tagline:"Pilotez votre performance avec des indicateurs fiables",
    desc:"Nous mettons en place des outils de pilotage adaptés à votre structure : tableaux de bord, budgets prévisionnels, analyse des écarts et reporting périodique pour une prise de décision éclairée.",
    prestations:[
      "Mise en place de tableaux de bord de gestion",
      "Budgets prévisionnels et plans de trésorerie",
      "Analyse des écarts et commentaires",
      "Calcul et suivi des coûts de revient",
      "Reporting mensuel / trimestriel",
      "Indicateurs clés de performance (KPI)",
    ],
    cibles:["Directions générales","Gérants","Investisseurs","Groupes"],
    badge:"Premium",badgeCol:"#FBBF24",
  },
  {
    id:"formation",
    ico:"school",
    col:"#60A5FA",colBg:"rgba(96,165,250,.12)",colBd:"rgba(96,165,250,.25)",
    titre:"Formation sur Mesure",
    tagline:"Des formations adaptées à vos équipes et vos besoins",
    desc:"Nous concevons et animons des formations professionnelles personnalisées en comptabilité SYSCOHADA, fiscalité, contrôle de gestion et droit des affaires OHADA, en présentiel ou en ligne.",
    prestations:[
      "Formation SYSCOHADA Révisé pour équipes",
      "Ateliers pratiques sur cas réels d'entreprise",
      "Formation en fiscalité locale et OHADA",
      "Séminaires contrôle de gestion",
      "Supports pédagogiques inclus",
      "Certification de participation délivrée",
    ],
    cibles:["Équipes comptables","Directions financières","Étudiants","Professionnels"],
    badge:"Sur mesure",badgeCol:"#60A5FA",
  },
];

const WHY=[
  {ico:"certificate",titre:"Expertise certifiée",desc:"Comptables et contrôleurs financiers certifiés SYSCOHADA avec plus de 10 ans d'expérience terrain."},
  {ico:"clock",titre:"Réactivité",desc:"Réponse sous 24h, rapports livrés dans les délais convenus."},
  {ico:"lock",titre:"Confidentialité",desc:"Vos données financières sont traitées avec la plus stricte confidentialité."},
  {ico:"users",titre:"Accompagnement personnalisé",desc:"Chaque client bénéficie d'un interlocuteur dédié qui connaît son dossier."},
];

function ServicesPage({user}){
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const isLight=['light','sepia'].includes(tid);
  const[sel,sSel]=useState(null);
  const[form,sForm]=useState({nom:"",email:"",tel:"",service:"",message:""});
  const[sent,sSent]=useState(false);
  const[sending,sSending]=useState(false);
  const[err,sErr]=useState("");

  // Pre-fill user info
  const userNom=user?.nom||"";
  const userEmail=user?.mail||"";

  const send=async()=>{
    if(!form.nom||!form.email||!form.service){sErr("Nom, email et service requis.");return;}
    if(!form.email.includes("@")){sErr("Email invalide.");return;}
    sSending(true);sErr("");
    try{
      await saveDemande({...form,nom:form.nom||userNom,email:form.email||userEmail,source:"plateforme"});
      sSent(true);
    }catch(e){sErr("Erreur d'envoi. Réessayez.");}
    sSending(false);
  };

  const WA_NUM="+243813165403";
  const EMAIL="contact@accessplusconsulting.com";

  return <div style={{animation:"up .3s ease",maxWidth:900,margin:"0 auto"}}>
    {/* Bannière hero */}
    <div style={{background:`linear-gradient(135deg,${K.em}20,${K.in_}12)`,border:`1px solid ${K.emBd}`,borderRadius:18,padding:mob?"20px 16px":"30px 32px",marginBottom:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:`${K.em}0A`}}/>
      <div style={{position:"absolute",bottom:-30,left:20,width:100,height:100,borderRadius:"50%",background:`${K.in_}08`}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:isLight?"rgba(255,255,255,.7)":K.b0,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"4px 12px",marginBottom:14}}><i className="ti ti-building" style={{fontSize:12,color:K.em}}/><span style={{fontSize:11,color:K.em,fontWeight:700}}>Éco-Campus RDC</span></div>
        <div style={{fontSize:mob?22:30,fontWeight:900,color:K.t1,lineHeight:1.2,marginBottom:10,letterSpacing:"-.5px"}}>Nos Services<br/><span style={{background:`linear-gradient(135deg,${K.em},${K.in_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Professionnels</span></div>
        <div style={{fontSize:14,color:K.t2,lineHeight:1.6,marginBottom:18,maxWidth:520}}>Expertise comptable, fiscale et financière au service des entreprises de la zone OHADA. Des solutions sur mesure pour votre croissance.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href={`https://wa.me/${WA_NUM.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,#25D366,#128C7E)`,borderRadius:10,padding:"10px 18px",color:"#fff",fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-brand-whatsapp" style={{fontSize:16}}/>WhatsApp</a>
          <a href={`mailto:${EMAIL}`} style={{display:"inline-flex",alignItems:"center",gap:7,background:isLight?"rgba(255,255,255,.8)":K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 18px",color:K.t1,fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-mail" style={{fontSize:16}}/>Email</a>
        </div>
      </div>
    </div>

    {/* Grille services */}
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:13,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-briefcase" style={{fontSize:16,color:K.em}}/>Nos offres de services</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:13,marginBottom:24}}>
      {SERVICES.map((s,i)=><div key={s.id} className="hv" onClick={()=>sSel(sel?.id===s.id?null:s)}
        style={{background:isLight?s.colBg:K.card,border:`2px solid ${sel?.id===s.id?s.col:s.colBd}`,borderRadius:16,overflow:"hidden",cursor:"pointer",animation:`up .3s ease ${i*60}ms both`,transition:"border-color .2s"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${s.col}20,${s.col}08)`,padding:"18px 18px 14px",borderBottom:`1px solid ${s.colBd}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
            <div style={{width:46,height:46,borderRadius:13,background:isLight?"rgba(255,255,255,.9)":K.b1,border:`1px solid ${s.colBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={"ti ti-"+s.ico} style={{fontSize:22,color:s.col}}/></div>
            <span style={{background:s.colBg,border:`1px solid ${s.colBd}`,borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:700,color:s.col}}>{s.badge}</span>
          </div>
          <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4}}>{s.titre}</div>
          <div style={{fontSize:12,color:s.col,fontWeight:600,fontStyle:"italic",marginBottom:8}}>{s.tagline}</div>
          <div style={{fontSize:12,color:K.t2,lineHeight:1.55}}>{s.desc}</div>
        </div>
        {/* Prestations (expandable) */}
        <div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sel?.id===s.id?10:0}}>
            <div style={{fontSize:11,color:K.t3,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-list-check" style={{fontSize:12,color:s.col}}/>{s.prestations.length} prestations incluses</div>
            <i className={"ti ti-chevron-"+(sel?.id===s.id?"up":"down")} style={{fontSize:14,color:K.t3}}/>
          </div>
          {sel?.id===s.id&&<div style={{animation:"up .2s ease"}}>
            {s.prestations.map((p,j)=><div key={j} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:j<s.prestations.length-1?`1px solid ${s.colBd}`:"none"}}>
              <i className="ti ti-check" style={{fontSize:13,color:s.col,flexShrink:0,marginTop:2}}/>
              <span style={{fontSize:12,color:K.t1,lineHeight:1.5}}>{p}</span>
            </div>)}
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,color:K.t3,fontWeight:600,marginBottom:6}}>Public cible</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{s.cibles.map(c=><span key={c} style={{background:isLight?"rgba(255,255,255,.8)":K.b0,border:`1px solid ${s.colBd}`,borderRadius:5,padding:"2px 8px",fontSize:10,color:s.col,fontWeight:600}}>{c}</span>)}</div>
            </div>
            <button onClick={e=>{e.stopPropagation();document.getElementById("contact-form")?.scrollIntoView({behavior:"smooth"});sForm(f=>({...f,service:s.titre}));}} className="bt" style={{width:"100%",marginTop:12,padding:"10px",background:`linear-gradient(135deg,${s.col},${s.col}BB)`,border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:38}}>
              <i className="ti ti-send" style={{fontSize:14}}/>Demander ce service
            </button>
          </div>}
        </div>
      </div>)}
    </div>

    {/* Pourquoi nous choisir */}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:16,padding:mob?"16px":"22px 24px",marginBottom:24}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-star" style={{fontSize:16,color:K.wa}}/>Pourquoi choisir Éco-Campus ?</div>
      <div style={{color:K.t3,fontSize:12,marginBottom:16}}>Notre engagement envers l'excellence et la proximité</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        {WHY.map((w,i)=><div key={i} style={{background:isLight?K.c2:K.c2,borderRadius:12,padding:"14px 12px",textAlign:"center",border:`1px solid ${K.b0}`}}>
          <div style={{width:40,height:40,borderRadius:11,background:K.emBg,border:`1px solid ${K.emBd}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><i className={"ti ti-"+w.ico} style={{fontSize:19,color:K.em}}/></div>
          <div style={{fontWeight:700,fontSize:12,color:K.t1,marginBottom:4}}>{w.titre}</div>
          <div style={{fontSize:11,color:K.t3,lineHeight:1.5}}>{w.desc}</div>
        </div>)}
      </div>
    </div>

    {/* Formulaire de contact */}
    <div id="contact-form" style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:16,padding:mob?"18px 16px":"24px 28px",marginBottom:16}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:3,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-message-circle" style={{fontSize:16,color:K.in_}}/>Demande de service</div>
      <div style={{color:K.t3,fontSize:12,marginBottom:18}}>Remplissez le formulaire — nous vous répondons sous 24h.</div>
      {sent?<div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"24px",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10,animation:"fl 3s ease-in-out infinite"}}>✅</div>
        <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:4}}>Demande envoyée !</div>
        <div style={{color:K.t2,fontSize:13,lineHeight:1.6,marginBottom:16}}>Nous avons bien reçu votre demande. Notre équipe vous contactera sous <b>24 heures ouvrables</b>.</div>
        <button onClick={()=>{sSent(false);sForm({nom:"",email:"",tel:"",service:"",message:""}); }} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"9px 18px",color:K.t2,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Nouvelle demande</button>
      </div>:<>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Inp lb="Nom complet *" val={form.nom||userNom} onChange={e=>sForm(f=>({...f,nom:e.target.value}))} ph="Votre nom"/>
          <Inp lb="Email *" val={form.email||userEmail} onChange={e=>sForm(f=>({...f,email:e.target.value}))} ph="votre@email.com" type="email"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Inp lb="Téléphone / WhatsApp" val={form.tel} onChange={e=>sForm(f=>({...f,tel:e.target.value}))} ph="+243 XXX XXX XXX"/>
          <div style={{marginBottom:13}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>Service souhaité *</div>
            <select value={form.service} onChange={e=>sForm(f=>({...f,service:e.target.value}))} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:form.service?K.t1:K.t3,fontSize:13,outline:"none",minHeight:44,fontFamily:"'Outfit',sans-serif"}}>
              <option value="">-- Choisir un service --</option>
              {SERVICES.map(s=><option key={s.id} value={s.titre}>{s.titre}</option>)}
              <option value="Autre">Autre / Non listé</option>
            </select>
          </div>
        </div>
        <Inp lb="Message (optionnel)" val={form.message} onChange={e=>sForm(f=>({...f,message:e.target.value}))} ph="Décrivez votre situation, vos besoins spécifiques..." rows={4}/>
        {err&&<div style={{background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,color:K.er,fontSize:13,padding:"8px 12px",marginBottom:10,display:"flex",gap:7}}><span>⚠</span><span>{err}</span></div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={send} disabled={sending} className="bt" style={{flex:1,minWidth:180,padding:"12px",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:10,color:"#F5EDD8",fontWeight:800,fontSize:14,cursor:sending?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:46,opacity:sending?.7:1}}>
            <i className="ti ti-send" style={{fontSize:16}}/>{sending?"Envoi en cours…":"Envoyer ma demande"}
          </button>
          <a href={`https://wa.me/${WA_NUM.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#25D366,#128C7E)",borderRadius:10,padding:"12px 18px",color:"#fff",fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-brand-whatsapp" style={{fontSize:16}}/>WhatsApp
          </a>
          <a href={`mailto:${EMAIL}?subject=Demande de service — ${form.service||"Éco-Campus"}`} style={{display:"inline-flex",alignItems:"center",gap:6,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:10,padding:"12px 18px",color:K.in_,fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-mail" style={{fontSize:16}}/>Email
          </a>
        </div>
        <div style={{marginTop:12,padding:"9px 12px",background:K.c2,borderRadius:8,fontSize:11,color:K.t3,display:"flex",alignItems:"center",gap:6}}><i className="ti ti-lock" style={{fontSize:12,color:K.em}}/>Vos informations sont confidentielles et ne seront jamais partagées.</div>
      </>}
    </div>
  </div>;
}

function AdminThread({apprenantUid,apprenantMail,onBack}){
  const K=useK();
  const msgs=useMessages(apprenantUid);
  const[texte,sTexte]=useState("");
  const[sending,sSending]=useState(false);
  const endRef=useRef();
  const apprenantNom=msgs[0]?.apprenantNom||"Apprenant";
  useEffect(()=>{markMsgsRead(apprenantUid,"admin");},[apprenantUid,msgs.length]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs.length]);
  const send=async()=>{
    const t=texte.trim();if(!t||sending)return;
    sSending(true);
    await sendMessage({apprenantUid,apprenantNom,from:"admin",fromNom:"Éco-Campus RDC",fromRole:"admin",texte:t});
    if(apprenantMail){
      sendNotifEmail({to_email:apprenantMail,subject:"Nouveau message — Éco-Campus RDC",nom:apprenantNom,message:`Vous avez reçu un nouveau message de l'équipe Éco-Campus RDC :\n\n« ${t} »\n\nConnectez-vous à votre compte, onglet Messages, pour répondre.`}).catch(()=>{});
    }
    sTexte("");sSending(false);
  };
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <button onClick={onBack} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:K.t2,display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-arrow-left" style={{fontSize:13}}/>Retour</button>
      <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{apprenantNom}</div>
    </div>
    <div style={{background:K.c2,borderRadius:12,padding:14,marginBottom:12}}>
      <div style={{height:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
        {msgs.map(m=>{
          const mine=m.fromRole==="admin";
          return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
            <div style={{background:mine?K.em:K.card,color:mine?"#F5EDD8":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:13,lineHeight:1.5,border:mine?"none":`1px solid ${K.b0}`}}>{m.texte}</div>
            <div style={{fontSize:9,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.apprenantNom} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
          </div>;
        })}
        <div ref={endRef}/>
      </div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Répondre…" style={{flex:1,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"10px 15px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}/>
      <Btn ch={sending?"…":"Envoyer"} on={send} v="i" sx={{minHeight:40}}/>
    </div>
  </div>;
}
function AA({onOut}){
  const K=useK();const{mob}=useW();
  const{warning:aaWarn}=useAutoLogout(onOut);
  const[pendingDocs,setPendingDocs]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(query(collection(db,"documents"),where("status","==","pending")),
      snap=>setPendingDocs(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  },[]);
  const approveDoc=async(id)=>{
    await updateDoc(doc(db,"documents",id),{status:"approved",approvedAt:new Date().toISOString()});
    sMsg({t:"o",m:"Document approuvé !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const rejectDoc=async(id,reason)=>{
    await updateDoc(doc(db,"documents",id),{status:"rejected",rejectedAt:new Date().toISOString(),rejectReason:reason||""});
    sMsg({t:"o",m:"Document rejeté."});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const[tab,sT]=useState("home"),[msg,sMsg]=useState({t:"",m:""});
  const[cm,sCm]=useState(null),[vm,sVm]=useState(null),[dm,sDm]=useState(null),[q,sQ]=useState("");
  const[editMod,sEM]=useState(null),[newMod,sNM]=useState(false);
  const[addVid,sAV]=useState(false),[saving,sSav]=useState(false),[addPres,sAddPres]=useState(false),[presGr,sPresGr]=useState(true),[addStage,sAddStage]=useState(false),[stageTab,sStageTab]=useState("offres"),[addPlat,sAddPlat]=useState(false);
  const{mods}=useModules();const users=useUsers();const{vids,live}=useVideos();const allPresAdmin=usePresentations();
  const allStagesAdmin=useStages();
  const allPlatsAdmin=usePlateformes();
  const allDemandesAdmin=useDemandes();
  const allAnnonces=useAnnonces();
  const[editAn,sEditAn]=useState(null);
  const[newUser,sNewUser]=useState(null);
  const[nuErr,sNuErr]=useState("");
  const[nuBusy,sNuBusy]=useState(false);
  const allMessages=useAllMessages();
  const[activeThread,sActiveThread]=useState(null);
  const allPsychoScores=usePsychoScoresAll();
  const allDocsAdmin=useAllDocs();
  const[pdfs,sPdfs]=useState({});
  useEffect(()=>{const loadPdfs=async()=>{const snap=await getDocs(collection(db,"pdfs"));const p={};snap.forEach(d=>p[d.id]=d.data());sPdfs(p);};loadPdfs();},[]);
  const fl=users.filter(u=>(u.nom||"").toLowerCase().includes(q.toLowerCase())||(u.mail||"").toLowerCase().includes(q.toLowerCase()));
  const dem=fl.filter(u=>u.abonnement==="demande"),nD=users.filter(u=>u.abonnement==="demande").length;
  const act=fl.filter(u=>u.abonnement==="actif"&&!xp(u.dateExpiration)),nA=users.filter(u=>u.abonnement==="actif"&&!xp(u.dateExpiration)).length;
  const exp_=fl.filter(u=>u.abonnement==="expiré"||(u.abonnement==="actif"&&xp(u.dateExpiration))),nE=users.filter(u=>u.abonnement==="expiré"||(u.abonnement==="actif"&&xp(u.dateExpiration))).length;
  const tabs=[["d",`Dem.(${nD})`],["a",`Act.(${nA})`],["e",`Exp.(${nE})`],["t",`Tous(${users.length})`],["s","Stats"],["m","📚 Cours"],["v","🎬 Vidéos"],["pr","📊 Présentations"],["st","🎯 Stages"],["dm","💼 Demandes"],["p","📄 PDF"],["fo","🎓 Formateurs"]];
  const byT={d:dem,a:act,e:exp_,t:fl};
  let CC_LOCAL=users.reduce((mx,u)=>{const n=parseInt((u.activationCode||"").replace("ACC-",""))||0;return Math.max(mx,n);},0);
  const nC=()=>{
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code="AP-";
  for(let i=0;i<8;i++)code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
};
  const[lastFoCode,sLastFoCode]=useState({uid:"",code:""});
  const nFC=()=>{
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code="FO-";
  for(let i=0;i<8;i++)code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
};
  const genFormateurCode=async(uid)=>{
    const code=nFC();
    await saveUserData(uid,{formateurCode:code,formateurCodeValide:false});
    const u=users.find(x=>x.uid===uid);
    sendMessage({apprenantUid:uid,apprenantNom:u?.nom||"",from:"admin",fromNom:"Éco-Campus RDC",fromRole:"admin",texte:`🎓 Félicitations ! Vous avez été désigné(e) formateur sur Éco-Campus RDC.\n\nVotre code d'activation : ${code}\n\nPour l'activer : cliquez sur l'icône 🔑 en haut de votre écran, saisissez ce code, et validez. Vous accéderez directement à votre espace formateur.`});
    sLastFoCode({uid,code});
    sMsg({t:"o",m:`Code généré et envoyé par message !`});setTimeout(()=>sMsg({t:"",m:""}),2500);
  };
  const activateFormateur=async(uid)=>{
    await saveUserData(uid,{role:"formateur",formateurCodeValide:true});
    sMsg({t:"o",m:"Formateur activé !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const approveContent=async(type,id)=>{
    const coll=type==="mod"?"modules":type==="pres"?"presentations":"videos";
    await updateDoc(doc(db,coll,id),{status:"approved",on:true,approvedAt:new Date().toISOString()});
    sMsg({t:"o",m:"Contenu approuvé et publié !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const rejectContent=async(type,id,reason)=>{
    const coll=type==="mod"?"modules":type==="pres"?"presentations":"videos";
    await updateDoc(doc(db,coll,id),{status:"rejected",rejectedAt:new Date().toISOString(),rejectReason:reason||""});
    sMsg({t:"o",m:"Contenu rejeté."});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const genC=async(uid,did)=>{
    sSav(true);const d=DUR.find(x=>x.id===did);const code=nC();
    await saveUserData(uid,{activationCode:code,codeValide:false,dureeId:did,dateExpiration:dE(d.j)});
    sSav(false);sVm(null);sCm({uid,code,d});
  };
  const actD=async(uid,did)=>{
    sSav(true);const d=DUR.find(x=>x.id===did)||DUR[4];const code=nC();
    await saveUserData(uid,{activationCode:code,codeValide:true,dureeId:did||"v",dateExpiration:dE(d.j),abonnement:"actif"});
    sSav(false);sVm(null);sMsg({t:"o",m:`✓ ${users.find(u=>u.uid===uid)?.nom} activé.`});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const rev=async uid=>{await saveUserData(uid,{abonnement:"expiré",codeValide:false});};
  const ref_=async uid=>{await saveUserData(uid,{abonnement:"aucun"});};
  const delU=async uid=>{await deleteDoc(doc(db,"users",uid));sDm(null);};
  const mL=async u=>{
    const d=DUR.find(x=>x.id===u.dureeId);
    const ok=await sendCodeEmail({to_email:u.mail,nom:u.nom,code:u.activationCode,duree:d?.l,expiration:fD(u.dateExpiration)});
    sendMessage({apprenantUid:u.uid,apprenantNom:u.nom,from:"admin",fromNom:"Éco-Campus RDC",fromRole:"admin",texte:`🔑 Votre code d'accès à la plateforme est prêt !\n\nCode : ${u.activationCode}\nDurée : ${d?.l||"—"}\nExpire le : ${fD(u.dateExpiration)}\n\nPour l'activer : cliquez sur l'icône 🔑 en haut de votre écran, saisissez ce code, et validez.`});
    if(ok)sMsg({t:"o",m:`✅ Envoyé par email et message à ${u.mail}`});else sMsg({t:"e",m:"⚠️ Message envoyé, mais l'email a échoué. Réessayez l'email."});
    setTimeout(()=>sMsg({t:"",m:""}),3500);
  };
  const sc_=s=>s==="actif"?K.em:s==="demande"?K.wa:K.er,sl_=s=>s==="actif"?"Actif":s==="demande"?"Demande":"Inactif";
  const rLU=useRef(),rLT=useRef(),rLD=useRef(),rVU=useRef(),rVT=useRef(),rVD=useRef(),rVM=useRef();
  const rPT=useRef(),rPU=useRef(),rPD=useRef(),rPM=useRef();
  const rST=useRef(),rSE=useRef(),rSU=useRef(),rSD=useRef(),rSC=useRef(),rSDur=useRef(),rSDF=useRef(),rSLogo=useRef();
  const rPN=useRef(),rPUrl=useRef(),rPDesc=useRef(),rPLang=useRef(),rPLogo=useRef();
  const[gr,sGr]=useState(true);
  const saveLiveFn=async()=>{sSav(true);await saveLive({on:live.on,url:rLU.current?.value?.trim()||"",titre:rLT.current?.value?.trim()||"",desc:rLD.current?.value?.trim()||""});sSav(false);sMsg({t:"o",m:"Direct enregistré."});setTimeout(()=>sMsg({t:"",m:""}),2000);};
  const addVidFn=async()=>{const url=rVU.current?.value?.trim()||"",titre=rVT.current?.value?.trim()||"";if(!titre||!url){alert("Titre et URL requis");return;}if(!pVid(url)){alert("URL invalide");return;}sSav(true);await saveVideo({titre,url,desc:rVD.current?.value?.trim()||"",mid:rVM.current?.value||null,gr});sSav(false);sAV(false);[rVU,rVT,rVD].forEach(r=>{if(r.current)r.current.value="";});};
  function RC({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"12px",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:12,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{u.nom}</div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div></div><Tg c={sc_(st)} bg={`${sc_(st)}12`} bd={`${sc_(st)}28`} ch={sl_(st)}/></div>{u.activationCode&&<div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,padding:"5px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:K.em}}>{u.activationCode}</span><span style={{fontSize:10,color:jr<=30?K.wa:K.t3}}>· {jr>0?`${jr}j`:"Exp."}</span></div>}<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{st==="demande"&&<><Btn ch="✓" on={()=>sVm(u.uid)} sm/><Btn ch="✗" on={()=>ref_(u.uid)} v="d" sm/></>}{st==="actif"&&<><Btn ch="Code" on={()=>sCm(u)} v="s" sm/><Btn ch="✉" on={()=>mL(u)} v="i" sm/><Btn ch="⏸" on={()=>rev(u.uid)} v="d" sm/></>}{(st==="expiré"||st==="aucun")&&<Btn ch="▶" on={()=>sVm(u.uid)} v="s" sm/>}<Btn ch="🗑" on={()=>sDm(u.uid)} v="d" sm/></div></div>;}
  function RR({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div className="ar" style={{borderBottom:`1px solid ${K.b0}`,background:"transparent"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:22,borderRadius:7,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:10,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div><div><div style={{color:K.t1,fontWeight:700,fontSize:12}}>{u.nom}</div><div style={{color:K.t3,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>{u.createdAt}</div></div></div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div><div>{u.activationCode&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:11,color:K.em,background:K.emBg,borderRadius:5,padding:"1px 5px",display:"inline-block",marginBottom:2}}>{u.activationCode}</div>}{u.dateExpiration&&<div style={{fontSize:9,color:jr<=7?K.er:jr<=30?K.wa:K.t3,fontFamily:"'JetBrains Mono',monospace"}}>{jr>0?`${jr}j`:"Exp."}</div>}</div><div style={{display:"flex",gap:3,justifyContent:"flex-end",flexWrap:"wrap"}}>{st==="demande"&&<><Btn ch="✓" on={()=>sVm(u.uid)} sm/><Btn ch="✗" on={()=>ref_(u.uid)} v="d" sm/></>}{st==="actif"&&<><Btn ch="Code" on={()=>sCm(u)} v="s" sm/><Btn ch="✉" on={()=>mL(u)} v="i" sm/><Btn ch="⏸" on={()=>rev(u.uid)} v="d" sm/></>}{(st==="expiré"||st==="aucun")&&<Btn ch="▶" on={()=>sVm(u.uid)} v="s" sm/>}<Btn ch="🗑" on={()=>sDm(u.uid)} v="d" sm/></div></div>;}
  function Liste({list,empty}){if(list.length===0)return <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"38px",textAlign:"center"}}><div style={{fontSize:26,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>👤</div><div style={{color:K.t3,fontSize:13}}>{empty}</div></div>;if(mob)return <div>{list.map(u=><RC key={u.uid} u={u}/>)}</div>;return <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,overflow:"hidden"}}><div className="ah" style={{background:K.bg,borderBottom:`1px solid ${K.b0}`,color:K.t3,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:".7px"}}><div>Nom</div><div>Email</div><div>Code</div><div style={{textAlign:"right"}}>Actions</div></div>{list.map(u=><RR key={u.uid} u={u}/>)}</div>;}
  function ModEditor({mod,onSave,onCancel}){
    const isNew=!mod.id;const[qs,sQs]=useState(mod.q?JSON.parse(JSON.stringify(mod.q)):[{q:"",r:["","","",""],b:0}]);
    const[ex,sEx]=useState(mod.ex?JSON.parse(JSON.stringify(mod.ex)):{ti:"",en:"",tv:[""],dn:[],co:""});
    const[ico,sIco]=useState(mod.ico||"📚");const[col,sCol]=useState(mod.col||COLS[0]);const[on,sOn]=useState(mod.on!==false);
    const rT=useRef(),rD=useRef(),rM=useRef(),rC=useRef();
    const save=async()=>{const titre=rT.current?.value?.trim()||"";const code=rC.current?.value?.trim()||"";if(!titre||!code){alert("Titre et Code requis");return;}sSav(true);const vq=qs.filter(q=>q.q.trim()&&q.r.filter(r=>r.trim()).length>=2);await saveModule({id:mod.id,code,ico,col,titre,desc:rD.current?.value?.trim()||"",mat:rM.current?.value?.trim()||"Général",on,q:vq,ex,ordre:mod.ordre||Date.now()});sSav(false);onSave();};
    return <div style={{animation:"sc .2s ease"}}>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:12}}>{isNew?"➕ Nouveau module":"✏️ Modifier"}</div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><div style={{flex:"0 0 100px"}}><Inp lb="Code *" rf={rC} ph="M11" def={mod.code||""}/></div><div style={{flex:1,minWidth:140}}><Inp lb="Titre *" rf={rT} ph="Nom du cours" def={mod.titre||""}/></div></div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><div style={{flex:1,minWidth:120}}><Inp lb="Matière" rf={rM} ph="SYSCOHADA, Droit..." def={mod.mat||""}/></div><div style={{flex:1,minWidth:140}}><Inp lb="Description" rf={rD} ph="Résumé court" def={mod.desc||""}/></div></div>
        <div style={{marginBottom:10}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Icône</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ICOS.map(i=><button key={i} onClick={()=>sIco(i)} className="bt" style={{width:34,height:34,borderRadius:8,background:ico===i?K.emBg:K.bg,border:`1px solid ${ico===i?K.emBd:K.b0}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{icoEl(i,ico===i?K.em:K.t2,16)}</button>)}</div></div>
        <div style={{marginBottom:10}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Couleur</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{COLS.map(c=><button key={c} onClick={()=>sCol(c)} className="bt" style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${col===c?"#fff":"transparent"}`,cursor:"pointer"}}/>)}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:K.t2,fontSize:13,fontWeight:600}}>Actif</span><button onClick={()=>sOn(a=>!a)} className="bt" style={{width:42,height:22,borderRadius:99,background:on?K.em:K.c2,border:`1px solid ${on?K.emBd:K.b0}`,position:"relative",cursor:"pointer",transition:"background .2s"}}><span style={{position:"absolute",top:2,left:on?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",display:"block"}}/></button><span style={{fontSize:12,color:on?K.em:K.t3}}>{on?"Visible":"Masqué"}</span></div>
      </div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontWeight:700,fontSize:13,color:K.t1}}>QCM ({qs.length})</div><Btn ch="+ Question" on={()=>sQs(q=>[...q,{q:"",r:["","","",""],b:0}])} sm v="s"/></div>
        {qs.map((qi_,idx)=><div key={idx} style={{background:K.bg,borderRadius:9,padding:"10px",marginBottom:8,border:`1px solid ${K.b0}`}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{color:K.t3,fontSize:11,fontWeight:700,flexShrink:0}}>Q{idx+1}</span><input value={qi_.q} onChange={e=>{const n=[...qs];n[idx]={...n[idx],q:e.target.value};sQs(n);}} placeholder="Question..." style={{flex:1,padding:"7px 10px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}}/><Btn ch="✕" on={()=>sQs(q=>q.filter((_,j)=>j!==idx))} v="d" sm/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{qi_.r.map((r,ri)=><div key={ri} style={{display:"flex",alignItems:"center",gap:4}}><button onClick={()=>{const n=[...qs];n[idx]={...n[idx],b:ri};sQs(n);}} className="bt" style={{width:18,height:18,borderRadius:"50%",background:qi_.b===ri?K.em:K.c2,border:`2px solid ${qi_.b===ri?K.em:K.b1}`,cursor:"pointer",flexShrink:0}}/><input value={r} onChange={e=>{const n=[...qs];const rr=[...n[idx].r];rr[ri]=e.target.value;n[idx]={...n[idx],r:rr};sQs(n);}} placeholder={`Option ${["A","B","C","D"][ri]}`} style={{flex:1,padding:"5px 8px",background:K.c2,border:`1px solid ${qi_.b===ri?K.emBd:K.b0}`,borderRadius:6,color:qi_.b===ri?K.em:K.t1,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}/></div>)}</div>
        </div>)}
      </div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:10}}>Exercice</div>
        <div style={{marginBottom:8}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:4}}>Titre</div><input value={ex.ti} onChange={e=>sEx(x=>({...x,ti:e.target.value}))} placeholder="Titre de l'exercice" style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:8}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:4}}>Énoncé</div><textarea value={ex.en} onChange={e=>sEx(x=>({...x,en:e.target.value}))} rows={2} placeholder="Situation pratique..." style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{color:K.t2,fontSize:12,fontWeight:600}}>Travail</div><Btn ch="+" on={()=>sEx(x=>({...x,tv:[...x.tv,""]}))} sm v="s"/></div>{ex.tv.map((t,i)=><div key={i} style={{display:"flex",gap:5,marginBottom:4}}><input value={t} onChange={e=>{const tv=[...ex.tv];tv[i]=e.target.value;sEx(x=>({...x,tv}));}} placeholder={`Étape ${i+1}`} style={{flex:1,padding:"7px 9px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:6,color:K.t1,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}/><Btn ch="✕" on={()=>sEx(x=>({...x,tv:x.tv.filter((_,j)=>j!==i)}))} v="d" sm/></div>)}</div>
        <div style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{color:K.t2,fontSize:12,fontWeight:600}}>Données</div><Btn ch="+ Ligne" on={()=>sEx(x=>({...x,dn:[...x.dn,{a:"",b:"",c:""}]}))} sm v="s"/></div>{ex.dn.map((row,i)=><div key={i} style={{display:"flex",gap:4,marginBottom:3,alignItems:"center"}}>{["a","b","c"].map((k,j)=><input key={k} value={row[k]||""} onChange={e=>{const dn=[...ex.dn];dn[i]={...dn[i],[k]:e.target.value};sEx(x=>({...x,dn}));}} placeholder={j===0?"Libellé":j===1?"Valeur":"Unité (opt.)"} style={{flex:1,padding:"6px 8px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:6,color:K.t1,fontSize:11,outline:"none",fontFamily:j>0?"'JetBrains Mono',monospace":"'Outfit',sans-serif"}}/>)}<Btn ch="✕" on={()=>sEx(x=>({...x,dn:x.dn.filter((_,j)=>j!==i)}))} v="d" sm/></div>)}</div>
        <div><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:4}}>Corrigé</div><textarea value={ex.co} onChange={e=>sEx(x=>({...x,co:e.target.value}))} rows={2} placeholder="Résultats attendus..." style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:11,outline:"none",fontFamily:"'JetBrains Mono',monospace",resize:"vertical",boxSizing:"border-box"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn ch="Annuler" on={onCancel} v="g" full/><Btn ch={saving?"Enregistrement…":isNew?"Créer →":"Enregistrer →"} on={save} full dis={saving}/></div>
    </div>;
  }
  return <div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}>
    <style>{mCss(K)}</style>
    <AutoLogoutBanner warning={aaWarn} mob={mob}/>
    {/* ── ADMIN NAV ── */}
    <nav className="nb" style={{background:`${K.card}f2`,backdropFilter:"blur(18px)",borderBottom:`1px solid ${K.b0}`,position:"sticky",top:0,zIndex:99}}>
      {/* Ligne 1 : logo + badge + déconnexion */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:46,paddingLeft:mob?0:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Logo sm={mob}/>
          <div style={{width:1,height:16,background:K.b0,flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:5,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:99,padding:"2px 9px"}}>
            <i className="ti ti-shield-check" style={{fontSize:11,color:K.wa}}/>
            <span style={{fontSize:10,fontWeight:800,color:K.wa,letterSpacing:.4}}>ADMIN</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {[[`${users.length}`,"ti-users",K.t2],[`${nD}`,"ti-clock",K.wa],[`${nA}`,"ti-check-circle",K.em]].map(([v,ic,c])=>(
              <div key={ic} style={{display:"flex",alignItems:"center",gap:3}}>
                <i className={`ti ${ic}`} style={{fontSize:12,color:c}}/>
                <span style={{fontSize:11,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{width:1,height:16,background:K.b0}}/>
          <button onClick={onOut} className="bt" style={{display:"flex",alignItems:"center",gap:5,background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:7,padding:"4px 9px",cursor:"pointer",fontSize:11,fontWeight:700,minHeight:28,fontFamily:"'Outfit',sans-serif"}}>
            <i className="ti ti-logout" style={{fontSize:12}}/>
            {!mob&&"Quitter"}
          </button>
        </div>
      </div>
      {/* Ligne 2 : onglets avec icônes */}
      {(()=>{
        const ADMIN_TABS=[
          {k:"home",ico:"ti-layout-grid",  label:"Accueil"},
          {k:"d",  ico:"ti-clock",         label:`Dem.`,      badge:nD,  bc:K.wa},
          {k:"a",  ico:"ti-check-circle",  label:"Actifs",    badge:nA,  bc:K.em},
          {k:"e",  ico:"ti-clock-off",     label:"Expirés",   badge:nE,  bc:K.er},
          {k:"t",  ico:"ti-users",         label:"Tous",      badge:users.length, bc:K.t2},
          {k:"s",  ico:"ti-chart-bar",     label:"Stats"},
          {k:"m",  ico:"ti-book-2",        label:"Cours"},
          {k:"v",  ico:"ti-video",         label:"Vidéos"},
          {k:"pr", ico:"ti-presentation",  label:"Présentations"},
          {k:"st", ico:"ti-briefcase",     label:"Stages"},
          {k:"dm", ico:"ti-message-circle",label:"Demandes",  badge:allDemandesAdmin.filter(d=>d.statut==="nouveau").length, bc:K.in_},
          {k:"p",  ico:"ti-file-text",     label:"PDF"},
          {k:"fo", ico:"ti-school",          label:"Formateurs", badge:users.filter(u=>u.role==="formateur").length, bc:"#8B5CF6"},
          {k:"an", ico:"ti-speakerphone",    label:"Annonces",   badge:allAnnonces.filter(a=>a.actif).length, bc:K.wa},
          {k:"au", ico:"ti-shield-check",     label:"Audit",       bc:K.in_},
          {k:"msg", ico:"ti-message-circle",  label:"Messages",   badge:allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length, bc:K.rd},
        ];
        return <div className="tn" style={{borderTop:`1px solid ${K.b0}`,gap:1,paddingBottom:2}}>
          {ADMIN_TABS.map(({k,ico,label,badge,bc})=>{
            const active=tab===k;
            return <button key={k} onClick={()=>sT(k)} className="bt"
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",border:"none",cursor:"pointer",
                background:active?K.c2:"transparent",color:active?K.t1:K.t3,
                fontWeight:active?700:500,fontSize:11,whiteSpace:"nowrap",
                fontFamily:"'Outfit',sans-serif",position:"relative",minHeight:34,
                borderBottom:active?`2px solid ${K.em}`:"2px solid transparent",
                borderRadius:"6px 6px 0 0",transition:"background .12s,color .12s"}}>
              <i className={`ti ${ico}`} style={{fontSize:13,color:active?K.em:K.t3}}/>
              {label}
              {badge>0&&<span style={{background:bc,color:"#F5EDD8",borderRadius:99,fontSize:9,fontWeight:800,padding:"1px 5px",minWidth:16,textAlign:"center",lineHeight:1.4}}>{badge}</span>}
            </button>;
          })}
        </div>;
      })()}
    </nav>
    <div className="mp" style={{maxWidth:1060,margin:"0 auto"}}>
      {msg.m&&<Pop t={msg.t} m={msg.m}/>}
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:13}}>{[[`${users.length}`,"Inscrits",K.t2],[`${nD}`,"Dem.",K.wa],[`${nA}`,"Actifs",K.em],[`${nE}`,"Exp.",K.er],[`${mods.filter(m=>m.on!==false).length}`,"Modules",K.in_]].map(([v,l,c])=><div key={l} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:9,padding:"7px 11px",minWidth:mob?56:68,textAlign:"center"}}><div style={{color:c,fontWeight:800,fontSize:mob?14:16,letterSpacing:"-.5px",lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}</div>
      {tab==="home"&&(()=>{
        const dashTiles=[
          {k:"d", ico:"clock",          label:"Demandes",       badge:nD, col:K.wa},
          {k:"a", ico:"check-circle",   label:"Actifs",         badge:nA, col:K.em},
          {k:"e", ico:"clock-off",      label:"Expirés",        badge:nE, col:K.er},
          {k:"t", ico:"users",          label:"Tous",           badge:users.length, col:K.t2},
          {k:"s", ico:"chart-bar",      label:"Statistiques",   col:K.in_},
          {k:"m", ico:"book-2",         label:"Cours",          col:K.em},
          {k:"v", ico:"video",          label:"Vidéos",         col:K.in_},
          {k:"pr",ico:"presentation",   label:"Présentations",  col:"#22C55E"},
          {k:"st",ico:"briefcase",      label:"Stages",         col:K.wa},
          {k:"dm",ico:"message-circle", label:"Demandes services",badge:allDemandesAdmin.filter(d=>d.statut==="nouveau").length, col:K.in_},
          {k:"p", ico:"file-text",      label:"PDF",            col:K.er},
          {k:"fo",ico:"school",         label:"Formateurs",     badge:users.filter(u=>u.role==="formateur").length, col:"#8B5CF6"},
          {k:"an",ico:"speakerphone",   label:"Annonces",       badge:allAnnonces.filter(a=>a.actif).length, col:K.wa},
          {k:"au",ico:"shield-check",   label:"Audit",          col:K.in_},
          {k:"msg",ico:"message-circle",label:"Messages",       badge:allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length, col:K.rd},
        ];
        // ── Calcul des indicateurs ──
        const apprenants=users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL);
        const formateurs=users.filter(u=>u.role==="formateur");
        const scoreValsAll=apprenants.flatMap(u=>Object.values(u.scores||{}).map(s=>s?.pct).filter(p=>p!=null));
        const avgScoreGlobal=scoreValsAll.length?Math.round(scoreValsAll.reduce((a,b)=>a+b,0)/scoreValsAll.length):null;
        const withProgress=apprenants.filter(u=>Object.keys(u.progress||{}).length>0).length;
        let nEngage=0,nSurveiller=0,nInactif=0;
        apprenants.forEach(u=>{
          const jamais=!u.lastLogin;
          const nMods=Object.values(u.progress||{}).filter(v=>v==="done").length;
          const daysSince=u.lastLogin?Math.floor((Date.now()-u.lastLogin)/86400000):null;
          if(jamais||daysSince>14)nInactif++;
          else if(daysSince>7||nMods===0)nSurveiller++;
          else nEngage++;
        });
        const modsPubliees=mods.filter(m=>m.status==="approved"||m.on).length;
        const modsAttente=mods.filter(m=>m.status==="pending").length;
        const presPubliees=allPresAdmin.filter(p=>p.on!==false).length;
        const presAttente=allPresAdmin.filter(p=>p.status==="pending").length;
        const docsAttente=allDocsAdmin.filter(d=>d.status==="pending").length;
        const totalApprenantsEncadres=formateurs.reduce((sum,f)=>{
          const fModIds=mods.filter(m=>m.createdBy===f.uid).map(m=>m.id);
          return sum+apprenants.filter(u=>fModIds.some(id=>u.progress?.[id]||u.scores?.[id])).length;
        },0);
        const psychoAvg=allPsychoScores.length?Math.round(allPsychoScores.reduce((a,s)=>a+(s.pct||0),0)/allPsychoScores.length):null;
        const nMsgNonLus=allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;

        const KpiCard=({label,val,col,suffix})=>
          <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:12,padding:"12px 13px"}}>
            <div style={{fontSize:20,fontWeight:900,color:col||K.t1,lineHeight:1}}>{val==null?"—":val}{suffix||""}</div>
            <div style={{fontSize:10,color:K.t3,marginTop:5,fontWeight:600,lineHeight:1.3}}>{label}</div>
          </div>;
        const KpiGroup=({title,children})=><div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>{title}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>{children}</div>
        </div>;

        return <div style={{animation:"fadeIn .35s ease"}}>
          <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:14}}>Tableau de bord</div>

          <KpiGroup title="Utilisateurs">
            <KpiCard label="Inscrits au total" val={users.length} col={K.t1}/>
            <KpiCard label="Apprenants" val={apprenants.length} col={K.in_}/>
            <KpiCard label="Formateurs" val={formateurs.length} col="#8B5CF6"/>
            <KpiCard label="Abonnements actifs" val={nA} col={K.em}/>
            <KpiCard label="Demandes en attente" val={nD} col={K.wa}/>
            <KpiCard label="Expirés" val={nE} col={K.er}/>
          </KpiGroup>

          <KpiGroup title="Engagement apprenants">
            <KpiCard label="🟢 Engagés" val={nEngage} col="#22C55E"/>
            <KpiCard label="🟡 À surveiller" val={nSurveiller} col="#F59E0B"/>
            <KpiCard label="🔴 Inactifs" val={nInactif} col="#EF4444"/>
            <KpiCard label="Ont progressé" val={apprenants.length?Math.round(withProgress/apprenants.length*100):0} suffix="%" col={K.in_}/>
            <KpiCard label="Score moyen (modules)" val={avgScoreGlobal} suffix="%" col={K.em}/>
          </KpiGroup>

          <KpiGroup title="Contenu pédagogique">
            <KpiCard label="Modules publiés" val={modsPubliees} col={K.em}/>
            <KpiCard label="Modules en attente" val={modsAttente} col={K.wa}/>
            <KpiCard label="Vidéos" val={vids.length} col={K.in_}/>
            <KpiCard label="Slides publiées" val={presPubliees} col="#22C55E"/>
            <KpiCard label="Slides en attente" val={presAttente} col={K.wa}/>
            <KpiCard label="Documents en attente" val={docsAttente} col={K.wa}/>
            <KpiCard label="Stages" val={allStagesAdmin.length} col={K.t2}/>
          </KpiGroup>

          <KpiGroup title="Formateurs & encadrement">
            <KpiCard label="Formateurs actifs" val={formateurs.length} col="#8B5CF6"/>
            <KpiCard label="Apprenants encadrés" val={totalApprenantsEncadres} col="#8B5CF6"/>
          </KpiGroup>

          <KpiGroup title="Psychotechnique">
            <KpiCard label="Tests passés" val={allPsychoScores.length} col={K.in_}/>
            <KpiCard label="Score moyen" val={psychoAvg} suffix="%" col={K.em}/>
          </KpiGroup>

          <KpiGroup title="Activité courante">
            <KpiCard label="Demandes services" val={allDemandesAdmin.filter(d=>d.statut==="nouveau").length} col={K.in_}/>
            <KpiCard label="Messages non lus" val={nMsgNonLus} col={K.rd}/>
            <KpiCard label="Annonces actives" val={allAnnonces.filter(a=>a.actif).length} col={K.wa}/>
          </KpiGroup>

          <div style={{fontSize:11,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Accès rapide</div>
          <div className="gm">
            {dashTiles.map(({k,ico,label,badge,col})=>
              <div key={k} onClick={()=>sT(k)} className="bt" style={{cursor:"pointer",padding:"14px 12px",borderRadius:13,background:K.card,border:`1px solid ${K.b1}`,position:"relative",overflow:"hidden",transition:"transform .15s"}}>
                {!!badge&&<span style={{position:"absolute",top:9,right:9,background:col,color:"#F5EDD8",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 7px",minWidth:18,textAlign:"center"}}>{badge}</span>}
                <div style={{width:34,height:34,borderRadius:10,background:`${col}18`,border:`1px solid ${col}30`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                  <i className={`ti ti-${ico}`} style={{fontSize:17,color:col}}/>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:K.t1,lineHeight:1.3}}>{label}</div>
              </div>
            )}
          </div>
        </div>;
      })()}
      {["d","a","e","t"].includes(tab)&&<><div style={{marginBottom:10}}><input type="text" placeholder="🔍 Rechercher…" defaultValue="" onChange={e=>sQ(e.target.value)} style={{padding:"8px 11px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",width:"100%",maxWidth:290,fontFamily:"'Outfit',sans-serif",caretColor:K.em,minHeight:38}} onFocus={e=>e.target.style.borderColor=K.emBd} onBlur={e=>e.target.style.borderColor=K.b0}/></div>{tab==="d"&&nD>0&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:9,padding:"8px 12px",marginBottom:9,fontSize:12,color:K.t2}}>💡 Vérifiez paiement → <b>✓</b> Valider → Durée → Code → <b>✉</b> mail.</div>}<Liste list={byT[tab]||fl} empty="Aucun résultat"/></>}
      {tab==="s"&&<div style={{animation:"up .25s ease"}}><div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:10}}>Performance modules</div>{users.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"38px",textAlign:"center"}}><div style={{color:K.t3,fontSize:13}}>Aucune donnée.</div></div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>{mods.map(m=>{const at=users.filter(u=>u.scores?.[m.id]),av=at.length?Math.round(at.reduce((a,u)=>a+u.scores[m.id].pct,0)/at.length):0,pa=at.filter(u=>u.scores[m.id].pct>=60).length;return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:10,padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><div style={{width:24,height:24,borderRadius:7,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{icoEl(m.ico,m.col,14)}</div><div><div style={{color:K.t1,fontWeight:700,fontSize:12}}>{m.titre}</div><div style={{color:K.t3,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>{m.code}</div></div></div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:K.t3,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}><span>{at.length} tentatives</span><span>{pa} réussi · {av}%</span></div><Bar p={av} col={m.col} h={3}/></div>;})}</div>}</div>}
      {tab==="m"&&<div style={{animation:"up .25s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}><div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Gestion des cours</div><div style={{color:K.t3,fontSize:12,marginTop:2}}>{mods.length} modules · {mods.filter(m=>m.on!==false).length} actifs</div></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{mods.length===0&&<Btn ch="🚀 Initialiser SYSCOHADA" on={seedModules} v="i" sx={{minHeight:38,fontSize:12}}/>}<Btn ch="➕ Nouveau" on={()=>{sEM(null);sNM(true);}} sx={{minHeight:38,fontSize:13}}/></div></div>
        {newMod&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:13,maxHeight:"80vh",overflowY:"auto"}}><ModEditor mod={{}} onSave={()=>{sNM(false);}} onCancel={()=>sNM(false)}/></div>}
        {editMod&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:13,maxHeight:"80vh",overflowY:"auto"}}><ModEditor mod={editMod} onSave={()=>{sEM(null);}} onCancel={()=>sEM(null)}/></div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {mods.map(m=><div key={m.id} style={{background:K.card,border:`1px solid ${m.on!==false?K.b1:K.b0}`,borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",opacity:m.on!==false?1:.6}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{icoEl(m.ico,m.col,18)}</div>
            <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}><span style={{fontWeight:700,fontSize:13,color:K.t1}}>{m.titre}</span>{m.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={m.mat}/>}{m.on===false&&<Tg c={K.t3} bg={K.c2} bd={K.b0} ch="Masqué"/>}</div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{m.code} · {m.q?.length||0} questions</div></div>
            <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
              <button onClick={()=>saveModule({...m,on:m.on===false})} className="bt" style={{background:m.on!==false?K.waBg:K.emBg,border:`1px solid ${m.on!==false?K.waBd:K.emBd}`,color:m.on!==false?K.wa:K.em,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:28}}>{m.on!==false?"Masquer":"Activer"}</button>
              <Btn ch="✏️" on={()=>{sNM(false);sEM(JSON.parse(JSON.stringify(m)));}} v="s" sm/>
              <Btn ch="🗑" on={async()=>{if(window.confirm(`Supprimer "${m.titre}" ?`))await deleteModule(m.id);}} v="d" sm/>
            </div>
          </div>)}
        </div>
      </div>}
      {tab==="v"&&<div style={{animation:"up .25s ease"}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3}}>Vidéos</div>
        <div style={{background:K.card,border:`1px solid ${live.on?K.rdBd:K.b0}`,borderRadius:12,padding:"13px 15px",marginBottom:13}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11,flexWrap:"wrap",gap:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,animation:live.on?"blink 1.5s ease-in-out infinite":undefined}}>🔴</span><div><div style={{fontWeight:800,fontSize:13,color:K.t1}}>Cours en direct</div></div></div><button onClick={async()=>{await saveLive({...live,on:!live.on,url:rLU.current?.value?.trim()||live.url});}} className="bt" style={{background:live.on?K.rdBg:K.emBg,border:`1px solid ${live.on?K.rdBd:K.emBd}`,color:live.on?K.rd:K.em,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:32}}>{live.on?"⏹ Arrêter":"▶ Activer"}</button></div>
          <Inp lb="URL du direct" rf={rLU} ph="https://youtube.com/live/..." def={live.url}/>
          <Inp lb="Titre" rf={rLT} ph="Cours en direct" def={live.titre}/>
          <Inp lb="Description" rf={rLD} ph="Décrivez le cours..." def={live.desc}/>
          <Btn ch={saving?"Enregistrement…":"💾 Enregistrer"} on={saveLiveFn} full sx={{minHeight:40,fontSize:13}} dis={saving}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11,flexWrap:"wrap",gap:8}}><div style={{fontWeight:800,fontSize:13,color:K.t1}}>Vidéothèque ({vids.length})</div><Btn ch="➕ Ajouter" on={()=>sAV(f=>!f)} sx={{minHeight:36,fontSize:12}}/></div>
        {addVid&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:12,animation:"sc .2s ease"}}>
          <Inp lb="Titre *" rf={rVT} ph="Titre de la vidéo"/>
          <Inp lb="URL *" rf={rVU} ph="YouTube · Vimeo · Facebook · lien direct" note="https://youtube.com/watch?v=... ou lien .mp4"/>
          <Inp lb="Description" rf={rVD} ph="Description optionnelle"/>
          <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>Module associé</div><select ref={rVM} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",minHeight:42}}><option value="">Aucun — Vidéothèque générale</option>{mods.filter(m=>m.on!==false).map(m=><option key={m.id} value={m.id}>{m.code} — {m.titre}</option>)}</select></div>
          <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:7}}>{[[true,"🆓 Gratuit","Tous"],[false,"💎 Premium","Abonnés"]].map(([val,lb,note])=><div key={String(val)} onClick={()=>sGr(val)} style={{flex:1,background:gr===val?K.emBg:K.c2,border:`1px solid ${gr===val?K.emBd:K.b0}`,borderRadius:9,padding:"9px 11px",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:12,color:gr===val?K.em:K.t1,marginBottom:1}}>{lb}</div><div style={{fontSize:10,color:K.t3}}>{note}</div></div>)}</div></div>
          <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAV(false)} v="g" full/><Btn ch={saving?"…":"➕ Ajouter"} on={addVidFn} full dis={saving}/></div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:7}}>{vids.map(v=>{const pv=pVid(v.url);return <div key={v.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{width:46,height:32,borderRadius:6,background:K.c2,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:14}}>🎬</span>}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap"}}>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}{v.mid&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={mods.find(m=>m.id===v.mid)?.code||""}/>}</div></div><Btn ch="🗑" on={async()=>deleteVideo(v.id)} v="d" sm/></div>;})} </div>
      </div>}
      {tab==="pr"&&<div style={{animation:"up .25s ease"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
    <div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Présentations</div><div style={{color:K.t3,fontSize:12,marginTop:2}}>{allPresAdmin.length} présentation{allPresAdmin.length>1?"s":""}</div></div>
    <Btn ch="➕ Ajouter" on={()=>sAddPres(p=>!p)} sx={{minHeight:38,fontSize:13}}/>
  </div>
  {addPres&&<div style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
    <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:10}}>Nouvelle présentation</div>
    <Inp lb="Titre *" rf={rPT} ph="Titre de la présentation"/>
    <Inp lb="URL *" rf={rPU} ph="https://docs.google.com/presentation/... ou lien Canva" note="Google Slides (lien de publication) · Canva (lien d'intégration) · URL directe"/>
    <Inp lb="Description" rf={rPD} ph="Résumé du contenu"/>
    <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>Matière</div><input ref={rPM} placeholder="SYSCOHADA, Droit OHADA..." style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box",minHeight:44}}/></div>
    <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:7}}>{[[true,"🆓 Gratuit","Tous"],[false,"💎 Premium","Abonnés"]].map(([val,lb,note])=><div key={String(val)} onClick={()=>sPresGr(val)} style={{flex:1,background:presGr===val?K.inBg:K.c2,border:`1px solid ${presGr===val?K.inBd:K.b0}`,borderRadius:9,padding:"9px 11px",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:12,color:presGr===val?K.in_:K.t1,marginBottom:1}}>{lb}</div><div style={{fontSize:10,color:K.t3}}>{note}</div></div>)}</div></div>
    <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAddPres(false)} v="g" full/><Btn ch={saving?"…":"➕ Ajouter"} on={async()=>{const titre=rPT.current?.value?.trim()||"";const url=rPU.current?.value?.trim()||"";if(!titre||!url){alert("Titre et URL requis");return;}sSav(true);await savePresentation({titre,url,desc:rPD.current?.value?.trim()||"",mat:rPM.current?.value?.trim()||"",gr:presGr,ordre:Date.now()});sSav(false);sAddPres(false);[rPT,rPU,rPD,rPM].forEach(r=>{if(r.current)r.current.value="";});}} full dis={saving}/></div>
  </div>}
  {allPresAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"38px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>📊</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune présentation</div><div style={{color:K.t3,fontSize:12}}>Ajoutez votre première présentation Google Slides ou Canva.</div></div>
  :<div style={{display:"flex",flexDirection:"column",gap:8}}>{allPresAdmin.map(p=><div key={p.id} style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:11,padding:"12px 14px",display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
    <div style={{width:38,height:38,borderRadius:10,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-presentation" style={{fontSize:18,color:K.in_}}/></div>
    <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div><div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>{p.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}{p.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={p.mat}/>}</div></div>
    <div style={{display:"flex",gap:5,flexShrink:0}}><a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:12}}/>Voir</a><Btn ch="🗑" on={async()=>deletePresentation(p.id)} v="d" sm/></div>
  </div>)}</div>}
</div>}
{tab==="st"&&<div style={{animation:"up .25s ease"}}>
  {/* Sub-tabs */}
  <div style={{display:"flex",background:K.c2,borderRadius:9,padding:3,marginBottom:13,gap:2}}>
    {[["offres","🎯 Offres de stages"],["plats","🌐 Plateformes"]].map(([k,l])=><button key={k} onClick={()=>sStageTab(k)} className="bt" style={{flex:1,padding:"8px",borderRadius:7,border:"none",fontWeight:700,fontSize:12,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:stageTab===k?K.card:"transparent",color:stageTab===k?K.t1:K.t3,minHeight:36}}>{l}</button>)}
  </div>

  {/* OFFRES */}
  {stageTab==="offres"&&<>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Offres de stages</div><div style={{color:K.t3,fontSize:12,marginTop:2}}>{allStagesAdmin.length} offre{allStagesAdmin.length>1?"s":""}</div></div>
      <Btn ch="➕ Ajouter une offre" on={()=>sAddStage(p=>!p)} sx={{minHeight:38,fontSize:12}}/>
    </div>
    {addStage&&<div style={{background:K.card,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:10}}>Nouvelle offre de stage</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp lb="Titre *" rf={rST} ph="Stage Finance Virtuel"/>
        <Inp lb="Entreprise *" rf={rSE} ph="Deloitte, KPMG..."/>
      </div>
      <Inp lb="URL / Lien *" rf={rSU} ph="https://www.theforage.com/..."/>
      <Inp lb="Description" rf={rSD} ph="Décrivez le stage, objectifs, contenu..." rows={3}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>Catégorie</div><select ref={rSC} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:12,outline:"none",minHeight:42}}>{["Finance & Comptabilité","Droit des affaires","Audit & Contrôle","Banque & Assurance"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <Inp lb="Durée" rf={rSDur} ph="5-6h, 2 semaines..."/>
        <Inp lb="Date fin" ref={rSDF} rf={rSDF} ph="31/12/2025"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Inp lb="Logo (emoji)" rf={rSLogo} ph="🏦 💼 📊..."/>
        <div><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:6}}>{[[true,"Gratuit"],[false,"Payant"]].map(([val,lb])=><div key={String(val)} onClick={()=>{}} style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"8px",cursor:"pointer",textAlign:"center",fontSize:11,fontWeight:600,color:K.t2}}>{lb}</div>)}</div></div>
      </div>
      <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAddStage(false)} v="g" full/><Btn ch={saving?"…":"➕ Publier l'offre"} on={async()=>{
        const titre=rST.current?.value?.trim()||"";
        const entreprise=rSE.current?.value?.trim()||"";
        const url=rSU.current?.value?.trim()||"";
        if(!titre||!entreprise||!url){alert("Titre, entreprise et URL requis");return;}
        sSav(true);
        await saveStage({titre,entreprise,url,desc:rSD.current?.value?.trim()||"",cat:rSC.current?.value||"Finance & Comptabilité",duree:rSDur.current?.value?.trim()||"",dateFin:rSDF.current?.value?.trim()||"",logo:rSLogo.current?.value?.trim()||"",gratuit:true,createdAt:Date.now()});
        sSav(false);sAddStage(false);
        [rST,rSE,rSU,rSD,rSDur,rSDF,rSLogo].forEach(r=>{if(r.current)r.current.value="";});
      }} full dis={saving}/></div>
    </div>}
    {allStagesAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"32px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>🎯</div><div style={{color:K.t3,fontSize:13}}>Aucune offre publiée.</div></div>
    :<div style={{display:"flex",flexDirection:"column",gap:7}}>{allStagesAdmin.map(s=>{const cc=CAT_COLORS[s.cat]||{bg:K.c2,bd:K.b0,ac:K.em,ic:"briefcase"};return <div key={s.id} style={{background:K.card,border:`1px solid ${cc.bd}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{width:36,height:36,borderRadius:9,background:cc.bg,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s.logo?18:14,flexShrink:0}}>{s.logo||<i className={"ti ti-"+cc.ic} style={{fontSize:16,color:cc.ac}}/>}</div>
      <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.titre}</div><div style={{display:"flex",gap:5,marginTop:2,flexWrap:"wrap"}}><Tg c={cc.ac} bg={cc.bg} bd={cc.bd} ch={s.entreprise}/><Tg c={K.t3} bg="none" bd={K.b0} ch={s.cat}/></div></div>
      <div style={{display:"flex",gap:5,flexShrink:0}}><a href={s.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:12}}/>Voir</a><Btn ch="🗑" on={async()=>deleteStage(s.id)} v="d" sm/></div>
    </div>;})}
    </div>}
  </>}

  {/* PLATEFORMES */}
  {stageTab==="plats"&&<>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Plateformes</div><div style={{color:K.t3,fontSize:12,marginTop:2}}>{allPlatsAdmin.length} plateforme{allPlatsAdmin.length>1?"s":""}</div></div>
        {allPlatsAdmin.length===0?<Btn ch="🚀 Charger plateformes" on={async()=>{sSav(true);await seedPlateformes();sSav(false);sMsg({t:"o",m:"8 plateformes chargées !"});setTimeout(()=>sMsg({t:"",m:""}),3000);}} v="i" sx={{minHeight:36,fontSize:12}} dis={saving}/>:<Btn ch="➕ Ajouter" on={()=>sAddPlat(p=>!p)} sx={{minHeight:36,fontSize:12}}/>}
    </div>
    {addPlat&&<div style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:10}}>Nouvelle plateforme</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp lb="Nom *" rf={rPN} ph="The Forage, Coursera..."/>
        <Inp lb="Logo (emoji)" rf={rPLogo} ph="🌾 🎓 💼..."/>
      </div>
      <Inp lb="URL *" rf={rPUrl} ph="https://www.theforage.com"/>
      <Inp lb="Description *" rf={rPDesc} ph="Décrivez la plateforme..." rows={2}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Inp lb="Langue" rf={rPLang} ph="FR, EN, FR/EN..."/>
        <div><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:5}}>Catégories</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["Finance & Comptabilité","Droit des affaires","Audit & Contrôle","Banque & Assurance"].map(c=>{
            const[selCats,sSelCats]=window._platCats||[[],(f)=>{window._platCats=[f(window._platCats?.[0]||[]),window._platCats?.[1]];window._platCatsForce&&window._platCatsForce();}];
            return null;
          })}
          <div style={{fontSize:11,color:K.t3}}>Sélectionnez après création</div>
        </div></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>{[[true,"🆓 Gratuit"],[false,"💎 Freemium"]].map(([val,lb])=><div key={String(val)} style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"8px",textAlign:"center",fontSize:11,fontWeight:600,color:K.t2,cursor:"pointer"}}>{lb}</div>)}</div>
      <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAddPlat(false)} v="g" full/><Btn ch={saving?"…":"➕ Ajouter"} on={async()=>{
        const nom=rPN.current?.value?.trim()||"";
        const url=rPUrl.current?.value?.trim()||"";
        const desc=rPDesc.current?.value?.trim()||"";
        if(!nom||!url||!desc){alert("Nom, URL et description requis");return;}
        sSav(true);
        await savePlateforme({nom,url,desc,logo:rPLogo.current?.value?.trim()||"🌐",langue:rPLang.current?.value?.trim()||"EN",cats:["Finance & Comptabilité"],gratuit:true,ordre:Date.now()});
        sSav(false);sAddPlat(false);
        [rPN,rPUrl,rPDesc,rPLang,rPLogo].forEach(r=>{if(r.current)r.current.value="";});
        sMsg({t:"o",m:"Plateforme ajoutée !"});setTimeout(()=>sMsg({t:"",m:""}),2500);
      }} full dis={saving}/></div>
    </div>}
    {allPlatsAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"32px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>🌐</div><div style={{color:K.t3,fontSize:13,marginBottom:7}}>Aucune plateforme.</div><div style={{color:K.t3,fontSize:11}}>Cliquez "Charger plateformes" pour les 8 plateformes pré-configurées, ou "➕ Ajouter" pour la vôtre.</div></div>
    :<div style={{display:"flex",flexDirection:"column",gap:7}}>{allPlatsAdmin.map(p=>{const cc=CAT_COLORS[p.cats?.[0]]||{bg:K.c2,bd:K.b0,ac:K.em};return <div key={p.id} style={{background:K.card,border:`1px solid ${cc.bd}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{width:36,height:36,borderRadius:9,background:cc.bg,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.logo}</div>
      <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{p.nom}</div><div style={{fontSize:10,color:K.t3,marginTop:1}}>{p.langue} · {p.gratuit?"Gratuit":"Freemium"}</div></div>
      <div style={{display:"flex",gap:5,flexShrink:0}}><a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:12}}/>Visiter</a><Btn ch="🗑" on={async()=>deletePlateforme(p.id)} v="d" sm/></div>
    </div>;})}
    </div>}
  </>}
</div>}
{tab==="dm"&&<div style={{animation:"up .25s ease"}}>
  <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3}}>Demandes de services</div>
  <div style={{color:K.t3,fontSize:12,marginBottom:13}}>{allDemandesAdmin.filter(d=>d.statut==="nouveau").length} nouvelle{allDemandesAdmin.filter(d=>d.statut==="nouveau").length>1?"s":""} · {allDemandesAdmin.length} au total</div>
  {allDemandesAdmin.length===0
    ?<div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"38px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>💼</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune demande</div><div style={{color:K.t3,fontSize:12}}>Les demandes des clients apparaîtront ici.</div></div>
    :<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {allDemandesAdmin.map((d,i)=>{
        const isNew=d.statut==="nouveau";
        const isTraite=d.statut==="traité";
        const sCol=isNew?K.em:isTraite?K.t3:K.wa;
        const sBg=isNew?K.emBg:isTraite?K.c2:K.waBg;
        const sBd=isNew?K.emBd:isTraite?K.b0:K.waBd;
        return <div key={d.id} style={{background:K.card,border:`1px solid ${isNew?K.emBd:K.b0}`,borderRadius:12,padding:"13px 15px",animation:`up .25s ease ${i*12}ms both`}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <div style={{width:38,height:38,borderRadius:10,background:sBg,border:`1px solid ${sBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-user" style={{fontSize:18,color:sCol}}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}><span style={{fontWeight:800,fontSize:13,color:K.t1}}>{d.nom}</span><span style={{background:sBg,border:`1px solid ${sBd}`,borderRadius:99,padding:"1px 8px",fontSize:10,fontWeight:700,color:sCol}}>{d.statut}</span></div>
              <div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{d.email}{d.tel?` · ${d.tel}`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:11,color:K.t3}}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</div></div>
          </div>
          <div style={{background:K.c2,borderRadius:9,padding:"8px 11px",marginBottom:10}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:d.message?6:0}}>
              <span style={{background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:5,padding:"2px 8px",fontSize:11,color:K.in_,fontWeight:600}}>{d.service}</span>
            </div>
            {d.message&&<div style={{fontSize:12,color:K.t2,lineHeight:1.5,marginTop:5}}>{d.message}</div>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <a href={`mailto:${d.email}?subject=Re: Votre demande — ${d.service}`} style={{display:"inline-flex",alignItems:"center",gap:5,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:7,padding:"6px 11px",color:K.in_,fontWeight:700,fontSize:11,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:30}}><i className="ti ti-mail" style={{fontSize:12}}/>Répondre</a>
            {d.tel&&<a href={`https://wa.me/${d.tel.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.3)",borderRadius:7,padding:"6px 11px",color:"#25D366",fontWeight:700,fontSize:11,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:30}}><i className="ti ti-brand-whatsapp" style={{fontSize:12}}/>WhatsApp</a>}
            {isNew&&<Btn ch="✓ Marquer traité" on={async()=>updateDemande(d.id,{statut:"traité"})} v="s" sm/>}
            {!isNew&&<Btn ch="↩ Rouvrir" on={async()=>updateDemande(d.id,{statut:"nouveau"})} v="g" sm/>}
          </div>
        </div>;
      })}
    </div>
  }
</div>}
{tab==="fo"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-school" style={{fontSize:16,color:"#8B5CF6"}}/>Gestion des formateurs
      </div>
      {/* Contenu en attente de validation */}
      {(()=>{
        const pendingMods=mods.filter(m=>m.status==="pending");
        const pendingPres=allPresAdmin.filter(p=>p.status==="pending");
        const total=pendingMods.length+pendingPres.length+pendingDocs.length;
        if(!total)return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13,color:K.t3,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-check-circle" style={{fontSize:14,color:K.em}}/>Aucun contenu en attente de validation.</div>;
        const DocTypeInfo={
          "application/pdf":{label:"PDF",ico:"file-text",col:"#EF4444"},
          "application/vnd.openxmlformats-officedocument.presentationml.presentation":{label:"PPT",ico:"presentation",col:"#F59E0B"},
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":{label:"Word",ico:"file-word",col:"#3B82F6"},
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{label:"Excel",ico:"file-spreadsheet",col:"#22C55E"},
        };
        return <div style={{marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:13,color:"#F59E0B",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-clock" style={{fontSize:14}}/>En attente de validation ({total})
          </div>
          {/* Modules en attente */}
          {pendingMods.map(m=><div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 15px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{background:"#8B5CF618",border:"1px solid #8B5CF630",borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#8B5CF6"}}>MODULE</div>
              <div style={{fontWeight:700,fontSize:13,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>
            </div>
            <div style={{fontSize:11,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===m.createdBy)?.nom||"—"} · {m.q?.length||0} questions</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>approveContent("mod",m.id)} className="bt"
                style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-check" style={{fontSize:12}}/>Approuver
              </button>
              <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent("mod",m.id,r);}} className="bt"
                style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-x" style={{fontSize:12}}/>Rejeter
              </button>
            </div>
          </div>)}
          {/* Slides en attente */}
          {pendingPres.map(p=><div key={p.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 15px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{background:"#22C55E18",border:"1px solid #22C55E30",borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#22C55E"}}>SLIDE</div>
              <div style={{fontWeight:700,fontSize:13,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div>
            </div>
            <div style={{fontSize:11,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===p.createdBy)?.nom||"—"} · {p.mat||"—"}</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>approveContent("pres",p.id)} className="bt"
                style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-check" style={{fontSize:12}}/>Approuver
              </button>
              <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent("pres",p.id,r);}} className="bt"
                style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-x" style={{fontSize:12}}/>Rejeter
              </button>
            </div>
          </div>)}
          {/* Documents en attente */}
          {pendingDocs.map(d=>{
            const ft=DocTypeInfo[d.type]||{label:d.ext?.toUpperCase()||"Doc",ico:"file",col:"#8B5CF6"};
            return <div key={d.id} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 15px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{background:`${ft.col}18`,border:`1px solid ${ft.col}30`,borderRadius:7,padding:"2px 8px",fontSize:10,fontWeight:700,color:ft.col}}>{ft.label}</div>
                <div style={{fontWeight:700,fontSize:13,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.titre}</div>
              </div>
              <div style={{fontSize:11,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===d.createdBy)?.nom||"—"} · {d.size?(d.size/1024/1024).toFixed(1)+" MB":""}</div>
              {d.desc&&<div style={{fontSize:12,color:K.t2,marginBottom:8,lineHeight:1.5}}>{d.desc}</div>}
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>approveDoc(d.id)} className="bt"
                  style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <i className="ti ti-check" style={{fontSize:12}}/>Approuver
                </button>
                <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectDoc(d.id,r);}} className="bt"
                  style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <i className="ti ti-x" style={{fontSize:12}}/>Rejeter
                </button>
              </div>
            </div>;
          })}
        </div>;
      })()}
      {/* Liste formateurs */}
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:10}}>Formateurs actifs</div>
      {(()=>{
        const formateurs=users.filter(u=>u.role==="formateur");
        if(!formateurs.length)return <EmptyState ico="school" title="Aucun formateur" desc="Générez un code FO- pour inviter un formateur."/>;
        return <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {formateurs.map(f=>{
            const fModIds=mods.filter(m=>m.createdBy===f.uid).map(m=>m.id);
            const fApprenants=users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL&&fModIds.some(id=>u.progress?.[id]||u.scores?.[id])).length;
            return <div key={f.uid} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{(f.nom||"F")[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:K.t1}}>{f.nom}</div>
              <div style={{fontSize:11,color:K.t3}}>{f.mail} · {fModIds.length} module{fModIds.length>1?"s":""} · <span style={{color:"#8B5CF6",fontWeight:700}}>{fApprenants} apprenant{fApprenants>1?"s":""} encadré{fApprenants>1?"s":""}</span></div>
            </div>
            {f.formateurCode&&<span style={{background:"#8B5CF618",border:"1px solid #8B5CF630",borderRadius:7,padding:"3px 8px",fontSize:10,fontWeight:700,color:"#8B5CF6",fontFamily:"monospace",flexShrink:0}}>{f.formateurCode}</span>}
            <button onClick={()=>{if(window.confirm(`Rétrograder ${f.nom} en apprenant ? Il perdra son accès formateur.`))updateDoc(doc(db,"users",f.uid),{role:deleteField(),formateurCodeValide:false});}} className="bt" title="Rétrograder en apprenant"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:7,padding:"5px 8px",cursor:"pointer",flexShrink:0}}>
              <i className="ti ti-user-down" style={{fontSize:13}}/>
            </button>
          </div>;})}
        </div>;
      })()}
      {/* Inviter */}
      <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:8}}>Inviter un formateur</div>
      <div style={{background:K.card,border:`1px solid #8B5CF630`,borderRadius:12,padding:"16px"}}>
        <div style={{fontSize:12,color:K.t2,marginBottom:12,lineHeight:1.6}}>Choisissez un utilisateur inscrit pour lui générer un code FO-. Il devra saisir ce code pour accéder à l'espace formateur.</div>
        <select onChange={e=>{if(e.target.value){genFormateurCode(e.target.value);e.target.value="";}}}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",marginBottom:12}}>
          <option value="">Choisir un utilisateur...</option>
          {users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL).map(u=><option key={u.uid} value={u.uid}>{u.nom} ({u.mail})</option>)}
        </select>
        {/* Code généré — affiché en permanence */}
        {lastFoCode.code&&<div style={{background:"#8B5CF618",border:"1px solid #8B5CF640",borderRadius:10,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#8B5CF6",fontWeight:700,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>Code formateur généré</div>
          <div style={{fontFamily:"monospace",fontSize:22,fontWeight:900,color:"#8B5CF6",letterSpacing:4,marginBottom:8}}>{lastFoCode.code}</div>
          <div style={{fontSize:11,color:K.t3,marginBottom:10}}>Pour : {users.find(u=>u.uid===lastFoCode.uid)?.nom||""}</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>navigator.clipboard?.writeText(lastFoCode.code)} className="bt"
              style={{background:"#8B5CF6",border:"none",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-copy" style={{fontSize:12}}/>Copier le code
            </button>
            <button onClick={async()=>{
              const u=users.find(x=>x.uid===lastFoCode.uid);
              if(!u)return;
              await sendNotifEmail({to_email:u.mail,subject:"Votre code formateur — Éco-Campus RDC",nom:u.nom,message:`Félicitations ! Vous avez été désigné(e) formateur sur Éco-Campus RDC.\n\nVotre code formateur : ${lastFoCode.code}\n\nPour l'activer :\n1. Connectez-vous sur eco-campus-rdc.vercel.app\n2. Cliquez sur "J'ai un code"\n3. Saisissez votre mot de passe puis le code : ${lastFoCode.code}\n\nÀ très vite !`});
              sMsg({t:"o",m:`✅ Email envoyé à ${u.mail}`});setTimeout(()=>sMsg({t:"",m:""}),3000);
            }} className="bt"
              style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-mail" style={{fontSize:12}}/>Envoyer automatiquement
            </button>
          </div>
        </div>}
      </div>
    </div>}
    {tab==="p"&&<div style={{animation:"up .25s ease"}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3}}>PDF d'exercices</div>
        <div style={{color:K.t3,fontSize:12,marginBottom:13}}>Un PDF par module · Stocké sur Firebase Storage · Lecture seule pour abonnés.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{mods.filter(m=>m.on!==false).map(m=>{const pdf=pdfs[m.id];return <div key={m.id} style={{background:K.card,border:`1px solid ${pdf?K.inBd:K.b0}`,borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{width:32,height:32,borderRadius:9,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icoEl(m.ico,m.col,15)}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{m.titre}</div><div style={{color:K.t3,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{m.code}{pdf?` · 📄 ${pdf.name}` : " · Aucun PDF"}</div></div><div style={{display:"flex",gap:5,flexShrink:0}}>
          <label className="bt" style={{background:pdf?K.c2:`linear-gradient(135deg,${K.inD},${K.in_})`,color:pdf?K.t2:"#fff",border:pdf?`1px solid ${K.b0}`:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:4,minHeight:34}}>
            {saving?"⏳":pdf?"🔄":"📤"}
            <input type="file" accept=".pdf" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(!f||f.type!=="application/pdf")return;if(f.size>15*1024*1024){alert("Max 15 Mo");return;}sSav(true);const res=await uploadPdf(m.id,f);sPdfs(p=>({...p,[m.id]:res}));sSav(false);e.target.value="";}}/>
          </label>
          {pdf&&<Btn ch="🗑" on={async()=>{await deletePdf(m.id,pdf.name);sPdfs(p=>{const n={...p};delete n[m.id];return n;});}} v="d" sm/>}
        </div></div>;})}
        </div>
        <div style={{marginTop:13,padding:"10px 13px",background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:9,fontSize:12,color:K.t2}}>✅ PDF stockés sur Firebase Storage — persistants et sécurisés.</div>
      </div>}
    </div>
    {tab==="an"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-speakerphone" style={{fontSize:16,color:K.wa}}/>Annonces & Publicités
        </div>
        <Btn ch="+ Nouvelle annonce" on={()=>sEditAn({titre:"",contenu:"",type:"info",actif:true,expireAt:""})} v="i" sm/>
      </div>
      {allAnnonces.length===0
        ?<div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"20px",textAlign:"center",fontSize:13,color:K.t3}}>Aucune annonce pour l'instant.</div>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {allAnnonces.map(a=>{
            const typeInfo={info:{label:"Info",col:K.in_},promo:{label:"Promo",col:K.wa},urgent:{label:"Urgent",col:K.er}}[a.type||"info"];
            const expired=a.expireAt&&new Date(a.expireAt)<new Date();
            return <div key={a.id} style={{background:K.card,border:`1px solid ${a.actif&&!expired?K.b1:K.b0}`,borderRadius:12,padding:"13px 15px",opacity:a.actif&&!expired?1:.6}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{background:`${typeInfo.col}18`,border:`1px solid ${typeInfo.col}30`,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,color:typeInfo.col}}>{typeInfo.label}</span>
                {!a.actif&&<span style={{fontSize:10,color:K.t3}}>Désactivée</span>}
                {expired&&<span style={{fontSize:10,color:K.er}}>Expirée</span>}
              </div>
              <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:4}}>{a.titre}</div>
              <div style={{fontSize:12,color:K.t2,marginBottom:10,lineHeight:1.5}}>{a.contenu}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>saveAnnonce({...a,actif:!a.actif})} className="bt" style={{background:a.actif?K.waBg:K.emBg,border:`1px solid ${a.actif?K.waBd:K.emBd}`,color:a.actif?K.wa:K.em,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{a.actif?"Désactiver":"Activer"}</button>
                <button onClick={()=>sEditAn(a)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Éditer</button>
                <button onClick={async()=>{if(window.confirm(`Supprimer "${a.titre}" ?`))await deleteAnnonce(a.id);}} className="bt" style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Supprimer</button>
              </div>
            </div>;
          })}
        </div>}
    </div>}
    {editAn&&<Sheet title={editAn.id?"Modifier l'annonce":"Nouvelle annonce"} onClose={()=>sEditAn(null)}>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Titre</label>
        <input value={editAn.titre} onChange={e=>sEditAn({...editAn,titre:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Contenu</label>
        <textarea value={editAn.contenu} onChange={e=>sEditAn({...editAn,contenu:e.target.value})} rows={4} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13,resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Type</label>
          <select value={editAn.type} onChange={e=>sEditAn({...editAn,type:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}>
            <option value="info">Info</option>
            <option value="promo">Promo</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Expire le (optionnel)</label>
          <input type="date" value={editAn.expireAt||""} onChange={e=>sEditAn({...editAn,expireAt:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}/>
        </div>
      </div>
      <Btn ch="Enregistrer" on={async()=>{if(!editAn.titre.trim())return;await saveAnnonce(editAn);sEditAn(null);}} full/>
    </Sheet>}
    {tab==="msg"&&<div style={{animation:"fadeIn .35s ease"}}>
      {!activeThread?<>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-message-circle" style={{fontSize:16,color:K.rd}}/>Messagerie
        </div>
        {(()=>{
          const convMap={};
          allMessages.filter(m=>!m.formateurUid).forEach(m=>{if(!convMap[m.apprenantUid]||m.ts>convMap[m.apprenantUid].ts)convMap[m.apprenantUid]=m;});
          const convs=Object.values(convMap).sort((a,b)=>b.ts-a.ts);
          if(convs.length===0)return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"20px",textAlign:"center",fontSize:13,color:K.t3}}>Aucun message pour l'instant.</div>;
          return <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {convs.map(c=>{
              const unread=allMessages.filter(m=>!m.formateurUid&&m.apprenantUid===c.apprenantUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;
              return <div key={c.apprenantUid} onClick={()=>sActiveThread(c.apprenantUid)} className="bt" style={{background:K.card,border:`1px solid ${unread>0?K.rdBd:K.b0}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:14,flexShrink:0}}>{(c.apprenantNom||"?")[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:K.t1}}>{c.apprenantNom||"Apprenant"}</div>
                  <div style={{fontSize:11,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.fromRole==="admin"?"Vous : ":""}{c.texte}</div>
                </div>
                {unread>0&&<span style={{background:K.rd,color:"#fff",fontSize:10,fontWeight:800,borderRadius:99,padding:"2px 7px",flexShrink:0}}>{unread}</span>}
              </div>;
            })}
          </div>;
        })()}
      </>:<AdminThread apprenantUid={activeThread} apprenantMail={users.find(u=>u.uid===activeThread)?.mail} onBack={()=>sActiveThread(null)}/>}
    </div>}
    {tab==="au"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-shield-check" style={{fontSize:16,color:K.in_}}/>Audit & Utilisateurs
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>exportUsersCsv(users)} className="bt" style={{background:K.c2,border:`1px solid ${K.b1}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <i className="ti ti-download" style={{fontSize:13}}/>Export CSV
          </button>
          <Btn ch="+ Nouvel utilisateur" on={()=>{sNewUser({nom:"",mail:"",password:"",role:"apprenant"});sNuErr("");}} v="i" sm/>
        </div>
      </div>
      <div style={{fontSize:12,color:K.t3,marginBottom:8}}>{users.length} compte{users.length>1?"s":""} · {users.filter(u=>u.lastLogin).length} déjà connecté{users.filter(u=>u.lastLogin).length>1?"s":""}</div>
      <div style={{display:"flex",gap:12,marginBottom:13,flexWrap:"wrap"}}>
        {[["#EF4444","🔴 Inactif","+ de 14 jours sans connexion"],["#F59E0B","🟡 À surveiller","peu actif ou 8-14 jours"],["#22C55E","🟢 Engagé","actif et progresse"]].map(([c,l,d])=>
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:K.t3}}><span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>{l} <span style={{color:K.t3,opacity:.7}}>— {d}</span></div>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {[...users].sort((a,b)=>(b.lastLogin||0)-(a.lastLogin||0)).map(u=>{
          const jamais=!u.lastLogin;
          const isApprenant=u.role!=="formateur"&&u.mail!==ADM_EMAIL;
          const nMods=Object.values(u.progress||{}).filter(v=>v==="done").length;
          const scoreVals=Object.values(u.scores||{}).map(s=>s?.pct).filter(p=>p!=null);
          const avgScore=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length):null;
          const daysSince=u.lastLogin?Math.floor((Date.now()-u.lastLogin)/86400000):null;
          const engagement=jamais?{c:"#EF4444",l:"Jamais connecté"}:daysSince>14?{c:"#EF4444",l:"Inactif"}:(daysSince>7||nMods===0)?{c:"#F59E0B",l:"À surveiller"}:{c:"#22C55E",l:"Engagé"};
          return <div key={u.uid} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#F5EDD8",fontWeight:800,fontSize:13,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:120}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:13,color:K.t1}}>{u.nom}</span>
                {u.role==="formateur"&&<Tg c="#8B5CF6" bg="#8B5CF618" bd="#8B5CF630" ch="Formateur"/>}
                {u.creePar==="admin"&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch="Créé par admin"/>}
                {isApprenant&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:engagement.c}}><span style={{width:6,height:6,borderRadius:"50%",background:engagement.c,display:"inline-block"}}/>{engagement.l}</span>}
              </div>
              <div style={{fontSize:11,color:K.t3,fontFamily:"'JetBrains Mono',monospace"}}>{u.mail}</div>
              {isApprenant&&<div style={{fontSize:10,color:K.t3,marginTop:2}}>{nMods} module{nMods>1?"s":""} complété{nMods>1?"s":""}{avgScore!=null?` · ${avgScore}% de moyenne`:""}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:10,color:K.t3}}>Créé le {u.createdAt}</div>
              <div style={{fontSize:10,color:jamais?K.wa:K.em,fontWeight:600}}>{jamais?"Jamais connecté":new Date(u.lastLogin).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {newUser&&<Sheet title="Nouvel utilisateur" onClose={()=>sNewUser(null)}>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Nom complet</label>
        <input value={newUser.nom} onChange={e=>sNewUser({...newUser,nom:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Email</label>
        <input type="email" value={newUser.mail} onChange={e=>sNewUser({...newUser,mail:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Mot de passe</label>
        <input type="text" value={newUser.password} onChange={e=>sNewUser({...newUser,password:e.target.value})} placeholder="Min. 6 caractères" style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Rôle</label>
        <select value={newUser.role} onChange={e=>sNewUser({...newUser,role:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:13}}>
          <option value="apprenant">Apprenant</option>
          <option value="formateur">Formateur</option>
        </select>
      </div>
      {nuErr&&<div style={{color:K.er,fontSize:12,marginBottom:10}}>{nuErr}</div>}
      <Btn ch={nuBusy?"Création…":"Créer le compte"} dis={nuBusy} on={async()=>{
        if(!newUser.nom.trim()||!newUser.mail.trim()||newUser.password.length<6){sNuErr("Nom, email et mot de passe (6 car. min) requis.");return;}
        sNuBusy(true);sNuErr("");
        try{
          await createUserAsAdmin(newUser);
          sNuBusy(false);sNewUser(null);
        }catch(e){
          sNuBusy(false);
          sNuErr(e.code==="auth/email-already-in-use"?"Cet email est déjà utilisé.":e.message);
        }
      }} full/>
    </Sheet>}
    {vm&&<Sheet title="Valider — Choisir la durée" onClose={()=>sVm(null)}><div style={{color:K.t3,fontSize:13,marginBottom:12}}>Paiement confirmé pour <b style={{color:K.t1}}>{users.find(u=>u.uid===vm)?.nom}</b>.</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>{DUR.map(d=><div key={d.id} onClick={()=>genC(vm,d.id)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",minHeight:50}} onMouseEnter={e=>{e.currentTarget.style.borderColor=K.emBd;e.currentTarget.style.background=K.emBg;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=K.b0;e.currentTarget.style.background=K.c2;}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{d.l}</div><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={d.j===36500?"∞":d.j+"j"}/></div></div>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t3,fontSize:12}}>Ou activer directement :</div><Btn ch="⚡ 3 mois" on={()=>actD(vm,"3m")} v="s" sm/></div></Sheet>}
    {cm&&<Sheet title="Code généré ✅" onClose={()=>sCm(null)} w={400}><div style={{background:K.bg,border:`2px solid ${K.emBd}`,borderRadius:12,padding:"16px",textAlign:"center",marginBottom:11}}><div style={{color:K.t3,fontSize:9,letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:7}}>Code d'accès</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:32,letterSpacing:6,color:K.em,marginBottom:7}}>{cm.code}</div><div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={cm.d?.l||"—"}/><Tg c={K.t3} bg="none" bd={K.b0} ch={fD(dE(cm.d?.j||30))}/></div></div><Btn ch="✉ Envoyer par email + message" on={()=>mL({...users.find(u=>u.uid===cm.uid),...cm})} v="i" full sx={{padding:"10px",fontSize:13,marginBottom:7,minHeight:42}}/><div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:8,padding:"7px 10px",marginBottom:11,fontSize:12,color:K.t2}}>📨 Envoyé par email et dans la messagerie interne de l'apprenant.</div><Btn ch="Fermer" on={()=>sCm(null)} v="g" full/></Sheet>}
    {dm&&<Sheet title="Supprimer ?" onClose={()=>sDm(null)} w={320}><div style={{textAlign:"center",padding:"4px 0"}}><div style={{fontSize:30,marginBottom:7}}>⚠️</div><div style={{color:K.t1,fontWeight:700,fontSize:14,marginBottom:4}}>{users.find(u=>u.uid===dm)?.nom}</div><div style={{color:K.t3,fontSize:12,marginBottom:17}}>Action irréversible.</div><div style={{display:"flex",gap:7,justifyContent:"center"}}><Btn ch="Annuler" on={()=>sDm(null)} v="g" sx={{minHeight:42}}/><Btn ch="Supprimer" on={()=>delU(dm)} v="d" sx={{minHeight:42}}/></div></div></Sheet>}
  </div>;
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  componentDidCatch(e,info){console.error("ErrorBoundary:",e,info);}
  render(){
    if(this.state.error){
      const K_EB={bg:"#0A0F0B",card:"#111812",t1:"#E8F5EA",t2:"#A8C4AC",t3:"#5A7A5E",em:"#22C55E",er:"#EF4444",b0:"rgba(255,255,255,.07)"};
      return <div style={{minHeight:"100vh",background:K_EB.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Outfit',sans-serif"}}>
        <div style={{maxWidth:420,width:"100%",background:K_EB.card,border:`1px solid ${K_EB.b0}`,borderRadius:16,padding:28,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:16}}>⚠️</div>
          <div style={{fontWeight:800,fontSize:18,color:K_EB.t1,marginBottom:8}}>Une erreur est survenue</div>
          <div style={{fontSize:13,color:K_EB.t2,marginBottom:20,lineHeight:1.6}}>{this.state.error?.message||"Erreur inattendue"}</div>
          <button onClick={()=>window.location.reload()}
            style={{background:"linear-gradient(135deg,#16A34A,#22C55E)",border:"none",borderRadius:10,padding:"11px 24px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Recharger la page
          </button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function App(){
  const[who,sW]=useState(null);const[loading,sL]=useState(true);const[showAuth,sShowAuth]=useState(false);
  const[tid,sTid]=useState(()=>{try{return localStorage.getItem("ap_theme")||"eco";}catch{return"eco";}});
  const[showTP,sShowTP]=useState(false);
  const K=bK(tid);
  function setT(id){sTid(id);try{localStorage.setItem("ap_theme",id);}catch{}}
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async user=>{
      if(user){
        if(user.email===ADM_EMAIL){sW({role:"admin",user});sL(false);return;}
        const snap=await getDoc(doc(db,"users",user.uid));
        if(snap.exists()){
          const d=snap.data();
          if(d.role==="formateur"){sW({role:"formateur",uid:user.uid,user});}
          else{sW({role:"user",uid:user.uid,user});}
        } else sW(null);
      }else{sW(null);}
      sL(false);
    });
    return unsub;
  },[]);
  return <Ctx.Provider value={{K,tid,setT}}>
    <style>{mCss(K)}</style>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/dist/tabler-icons.min.css"/>
    <ThemePicker open={showTP} onClose={()=>sShowTP(false)}/>
    <button onClick={()=>sShowTP(true)} className="bt"
      style={{position:"fixed",bottom:18,right:18,zIndex:998,width:44,height:44,borderRadius:"50%",background:K.card,border:`1px solid ${K.b1}`,color:K.t2,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.25)"}}>
      {TH[tid]?.i||"🎨"}
    </button>
    {loading&&<Spin/>}
    {!loading&&!who&&!showAuth&&<LandingPage onLogin={()=>sShowAuth(true)}/>}
    {!loading&&!who&&showAuth&&<Auth onL={(role,user)=>{const r=role==="__admin__"?{role:"admin",user}:role?.startsWith("__formateur__:")?{role:"formateur",uid:role.split(":")[1],user}:{role:"user",uid:user.uid,user};sW(r);sShowAuth(false);}}/>}
    {!loading&&who?.role==="admin"&&<ErrorBoundary><AA onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
    {!loading&&who?.role==="formateur"&&<ErrorBoundary><FA uid={who.uid} onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
    {!loading&&who?.role==="user"&&<ErrorBoundary><UA uid={who.uid} onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
  </Ctx.Provider>;
}
