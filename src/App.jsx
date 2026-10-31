import React,{useState,useRef,useEffect,useCallback,useMemo,createContext,useContext}from"react";
import{initializeApp,deleteApp}from"firebase/app";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,GoogleAuthProvider,FacebookAuthProvider,signInWithPopup,updatePassword,reauthenticateWithCredential,EmailAuthProvider}from"firebase/auth";
import{getFirestore,doc,getDoc,setDoc,updateDoc,addDoc,collection,getDocs,onSnapshot,deleteDoc,serverTimestamp,query,where,orderBy,limit,deleteField,runTransaction,writeBatch}from"firebase/firestore";
import{getStorage,ref,uploadBytes,getDownloadURL,deleteObject}from"firebase/storage";
import EtatsFinanciers,{inscrireAnnuaire}from"./EtatsFinanciers";
import CodeImpots from"./fiscal/CodeImpots";
import FinanceEntreprise from"./finance/FinanceEntreprise";
import{initNotif,notifier}from"./notif/notif";
import Cloche from"./notif/Cloche";
import AdminNotif from"./notif/AdminNotif";
import{Suggestions,AdminSuggestions}from"./notif/Suggestions";
import PourVous from"./notif/Recommandations";
import Apropos from"./notif/Apropos";
import Banniere,{ReglageMarketing,AdminMarketing}from"./notif/Banniere";
import{DUR,OFFRES,INCLUS,offresAvecPrix,parMois,fUSD,numerosRenseignes,usePaiement,utiliserCodeOffert}from"./acces/acces";
import AdminAcces from"./acces/AdminAcces";
import{PLAY_STORE,LIB_ACCES}from"./acces/plateforme";
import{pushPossible,pushActif,activerPush,desactiverPush}from"./notif/push";
import{htmlCodeAcces,htmlNotification}from"./emails";
import{PROVINCES}from"./ef/rdc";
import SuiviExercices from"./ef/SuiviExercices";
import{embedPresentation,srcIframe,estOneDrive}from"./presentation";
import{pVid,estPublie,lienGoogle,apercuValidation}from"./contenu";
import LecteurAudio from"./audio/LecteurAudio";
import{texteModuleCours,texteNarration,paragraphesNarration}from"./audio/lecture";
import EcouterCours from"./audio/EcouterCours";
import{pctQcm,resumeCpt,fusionScore,CLES_CPT,moyenne}from"./ef/syscohada/scores";
import MesAttestations from"./attest/MesAttestations";
import{GROUPES_APPRENANT,GROUPES_ADMIN,groupeDe,normaliserVue,badgeGroupe,VUES_ADMIN}from"./nav/navigation";
import{MODULES_FISC}from"./fiscal/modules";
import{MODULES_FIN}from"./finance/modules";
import VerifAttestation from"./attest/VerifAttestation";
import AdminAttestations from"./attest/AdminAttestations";
import LOGO from"./assets/logo.png";
import LOGO_CLAIR from"./assets/logo-clair.png";
import LOGO_ICONE from"./assets/logo-icone.png";

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
        template_params:{to_email,subject:"Éco-Campus RDC — Votre code d'accès",nom:nom||"Apprenant",code,duree:duree||"—",expiration:expiration||"—",
          html:htmlCodeAcces({nom:nom||"Apprenant",code,duree:duree||"—",expiration:expiration||"—"})}})
    });
    return res.ok;
  }catch(e){console.log("sendCodeEmail error",e);return false;}
};
const sendNotifEmail=async({to_email,subject,nom,message})=>{
  try{
    await fetch("https://api.emailjs.com/api/v1.0/email/send",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({service_id:EMAILJS_SERVICE,template_id:EMAILJS_TPL_NOTIF,user_id:EMAILJS_KEY,
        template_params:{to_email,subject,nom:nom||"",message:message||"",html:htmlNotification({nom:nom||"",message:message||""})}})
    });
  }catch(e){console.log("sendNotifEmail error",e);}
};
initNotif({db,auth,email:sendNotifEmail});
const googleProvider=new GoogleAuthProvider();
const facebookProvider=new FacebookAuthProvider();

// ── THÈMES ────────────────────────────────────────────────────────────────────
const TH={
  eco:{n:"Éco-Campus",i:"📘",bg:"#F4F6FB",ca:"#FFFFFF",c2:"#EEF2F8",b0:"rgba(10,42,92,.09)",b1:"rgba(10,42,92,.17)",t1:"#0B1A33",t2:"#4A5B78",t3:"#8492AB"},
  dark:{n:"Sombre",i:"🌙",bg:"#0C0F19",ca:"#13172A",c2:"#1A1F35",b0:"rgba(255,255,255,.06)",b1:"rgba(255,255,255,.11)",t1:"#F0F3FF",t2:"#8B97BC",t3:"#505A78"},
  light:{n:"Clair",i:"☀️",bg:"#F2F5FC",ca:"#FFFFFF",c2:"#E8EDF7",b0:"rgba(0,0,0,.07)",b1:"rgba(0,0,0,.13)",t1:"#1A1D2E",t2:"#5A6380",t3:"#9BA3BF"},
  sepia:{n:"Sépia",i:"📜",bg:"#F5EFE3",ca:"#FDFAF4",c2:"#EDE6D6",b0:"rgba(120,90,40,.09)",b1:"rgba(120,90,40,.17)",t1:"#2C2416",t2:"#7A6540",t3:"#B09A70"},
  blue:{n:"Océan",i:"🌊",bg:"#071525",ca:"#0C1E36",c2:"#102544",b0:"rgba(100,180,255,.08)",b1:"rgba(100,180,255,.16)",t1:"#E4F1FF",t2:"#7BAFD4",t3:"#3D6E94"},
  green:{n:"Forêt",i:"🌿",bg:"#0B1A10",ca:"#0F2416",c2:"#13301E",b0:"rgba(80,200,100,.07)",b1:"rgba(80,200,100,.14)",t1:"#E4F5E8",t2:"#72B883",t3:"#3D7A50"},
  purple:{n:"Violet",i:"💜",bg:"#100C1E",ca:"#180E30",c2:"#201244",b0:"rgba(160,100,255,.08)",b1:"rgba(160,100,255,.16)",t1:"#EDE8FF",t2:"#9070C8",t3:"#5E4A88"},
};
const ACC={em:"#0A2A5C",emD:"#001433",emBg:"rgba(10,42,92,.08)",emBd:"rgba(10,42,92,.22)",in_:"#1E4FA3",inD:"#163B7A",inBg:"rgba(30,79,163,.09)",inBd:"rgba(30,79,163,.24)",wa:"#C98A1B",waBg:"rgba(201,138,27,.12)",waBd:"rgba(201,138,27,.30)",er:"#A3122A",erBg:"rgba(163,18,42,.08)",erBd:"rgba(163,18,42,.24)",rd:"#A3122A",rdBg:"rgba(163,18,42,.08)",rdBd:"rgba(163,18,42,.24)",ok:"#0A2A5C"};
// Thèmes sombres : bleus éclaircis pour rester lisibles
const ACC_SOMBRE={em:"#7FA8F5",emD:"#1E4FA3",emBg:"rgba(127,168,245,.12)",emBd:"rgba(127,168,245,.30)",in_:"#9CC2FF",inD:"#5B8DEF",inBg:"rgba(156,194,255,.10)",inBd:"rgba(156,194,255,.26)",er:"#F2667C",erBg:"rgba(242,102,124,.12)",erBd:"rgba(242,102,124,.30)",rd:"#F2667C",rdBg:"rgba(242,102,124,.12)",rdBd:"rgba(242,102,124,.30)"};
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
const TILE_COLORS={modules:["#1E4FA3","#4F7FD6"],qcm:["#4F46E5","#8B7CF6"],pres:["#D97706","#F5B342"],stages:["#0D7A6B","#19B39B"],videos:["#C2410C","#F2733F"],ef:["#1D4ED8","#4F8DF7"],fisc:["#A3122A","#E0475F"],jrn:["#0D7A6B","#2BB39B"],cpt:["#7C3AED","#A78BFA"],audio:["#0E7490","#22B8CF"],parcours:["#0A2A5C","#B7791F"],res:["#B45309","#F2A93B"]};
const getCardPalette=(tid,idx)=>{const p=CARD_PALETTES[tid]||CARD_PALETTES.dark;return p[idx%p.length];};
const bK=id=>{const t=TH[id]||TH.eco;const sombre=["dark","blue","green","purple"].includes(id);return{sh:sombre?"0 8px 22px rgba(0,0,0,.28)":"0 1px 2px rgba(10,42,92,.04),0 8px 22px rgba(10,42,92,.07)",bg:t.bg,card:t.ca,c2:t.c2,b0:t.b0,b1:t.b1,t1:t.t1,t2:t.t2,t3:t.t3,...ACC,...(sombre?ACC_SOMBRE:{})};};
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
.gm{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;}
@media(min-width:760px){.gm{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}}
.gq{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
@media(min-width:760px){.gq{grid-template-columns:repeat(3,1fr);gap:16px;}}
.tile{background:${K.card};border:1px solid ${K.b0};border-radius:20px;position:relative;overflow:hidden;cursor:pointer;box-shadow:0 1px 2px rgba(30,18,8,.04),0 8px 22px rgba(30,18,8,.07);transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s;}
.tile:hover{transform:translateY(-4px);border-color:${K.b1};box-shadow:0 2px 4px rgba(30,18,8,.05),0 18px 38px rgba(30,18,8,.13);}
.tile:active{transform:scale(.98);}
@media(max-width:639px){.tp-btn{bottom:calc(88px + env(safe-area-inset-bottom))!important;right:12px!important;width:38px!important;height:38px!important;font-size:17px!important;}}
.h-sec{font-family:'Fraunces',serif;font-weight:700;font-size:20px;letter-spacing:-.3px;line-height:1.2;}
.gv{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;}
.gs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.hf{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;}
.tn{display:flex;gap:1px;overflow-x:auto;scrollbar-width:none;}
.tn::-webkit-scrollbar{display:none;}
.ar{display:grid;grid-template-columns:1.5fr 1.5fr .8fr 1.1fr auto;gap:12px;padding:12px 18px;align-items:center;transition:background .15s;}.ar:hover{background:rgba(127,140,170,.06);}
.ah{display:grid;grid-template-columns:1.5fr 1.5fr .8fr 1.1fr auto;gap:12px;padding:11px 18px;}
@media(max-width:640px){.gm{grid-template-columns:repeat(2,1fr);}.gv{grid-template-columns:1fr;}.hf{flex-direction:column;align-items:flex-start;}.hs{display:none!important;}.ar{grid-template-columns:1fr auto;}.ah{display:none;}}
@media(min-width:640px)and(max-width:1024px){.gm{grid-template-columns:repeat(3,1fr);}.gv{grid-template-columns:repeat(2,1fr);}}
@media(hover:none){.hv:hover{transform:none;box-shadow:none;}.bt:hover{filter:none;}}
.nb{padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right));}
.mp{padding:18px max(14px,env(safe-area-inset-right)) max(80px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));}`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const dE=j=>{const d=new Date();d.setDate(d.getDate()+j);return d.toISOString();};
const jR=i=>!i?0:Math.max(0,Math.ceil((new Date(i)-new Date())/864e5));
const fD=i=>!i?"—":new Date(i).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const xp=i=>!i||new Date(i)<new Date();
const COLS=["#34D399","#818CF8","#FBBF24","#F87171","#60A5FA","#A78BFA","#FB923C","#5B8DEF","#F472B6","#38BDF8"];
const icoEl=(ico,col,sz=16)=>{
  if(!ico)return null;
  const isTabler=/^[a-z]/.test(ico);
  if(isTabler)return <i className={"ti ti-"+ico} style={{fontSize:sz,color:col||"inherit"}}/>;
  return <span style={{fontSize:sz}}>{ico}</span>;
};
const ICOS=["book-2","world","pencil","scale","chart-bar","building-bank","shopping-cart","users","crane","shield","clipboard-list","briefcase","target","microscope","bulb","building","bolt","globe"];

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


// ── AUDIT : PRÉSENCE EN LIGNE ET JOURNAL DES CONNEXIONS ─────────────────────
// activite/{uid} : dernière activité de chaque compte (signal toutes les 90 s quand l'onglet est visible)
// connexions/{id} : une ligne par ouverture de session (une fois par onglet)
const ENLIGNE_MS=4*60*1000;
const VUE_LBL={home:"Accueil",msg:"Messages",pres:"Présentations",jrn:"Monographie ZAO",cpt:"Guide des comptes",audio:"Écouter les cours",fisc:"Code des impôts",fin:"Finance d'entreprise",sugg:"Suggestions",apropos:"À propos",stages:"Stages",videos:"Vidéos",ef:"États financiers",psycho:"Tests psychotechniques",services:"Services",prog:"Progrès",res:"Résultats",mods:"Mes modules",vids:"Mes vidéos",docs:"Documents",corr:"Corrections",fmsg:"Messages",stats:"Statistiques",admin:"Administration",param:"Paramètres"};
const appareil=()=>{const ua=navigator.userAgent||"";const os=/Android/i.test(ua)?"Android":/iPhone|iPad|iPod/i.test(ua)?"iOS":/Windows/i.test(ua)?"Windows":/Mac OS/i.test(ua)?"Mac":/Linux/i.test(ua)?"Linux":"Autre";
  const nav=/Edg\//.test(ua)?"Edge":/OPR\//.test(ua)?"Opera":/SamsungBrowser/.test(ua)?"Samsung":/Chrome\//.test(ua)?"Chrome":/Firefox\//.test(ua)?"Firefox":/Safari\//.test(ua)?"Safari":"Navigateur";
  const app=(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||String(document.referrer).startsWith("android-app://")?"Application":"Site web";
  return{type:/Android|iPhone|iPad|iPod|Mobile/i.test(ua)?"Mobile":"Ordinateur",os,nav,app};};
const tsMs=t=>!t?0:typeof t==="number"?t:t.toMillis?t.toMillis():t.seconds?t.seconds*1000:0;
const ilya=ms=>{const d=Math.max(0,Date.now()-ms)/1000;if(d<60)return"à l'instant";if(d<3600)return`il y a ${Math.floor(d/60)} min`;if(d<86400)return`il y a ${Math.floor(d/3600)} h`;const j=Math.floor(d/86400);return j===1?"hier":`il y a ${j} j`;};
function usePresence({uid,nom,mail,role,vue}){
  useEffect(()=>{
    if(!uid||!nom)return;
    const ref_=doc(db,"activite",uid);
    const ping=()=>{if(document.visibilityState!=="visible")return;setDoc(ref_,{uid,nom,mail:mail||"",role,vue:vue||"",appareil:appareil(),enLigne:true,lastSeen:serverTimestamp()},{merge:true}).catch(()=>{});};
    const quitte=()=>{setDoc(ref_,{enLigne:false,lastSeen:serverTimestamp()},{merge:true}).catch(()=>{});};
    const vis=()=>{if(document.visibilityState==="visible")ping();else quitte();};
    ping();const t=setInterval(ping,90000);
    document.addEventListener("visibilitychange",vis);window.addEventListener("pagehide",quitte);
    return()=>{clearInterval(t);document.removeEventListener("visibilitychange",vis);window.removeEventListener("pagehide",quitte);};
  },[uid,nom,mail,role,vue]);
  useEffect(()=>{
    if(!uid||!nom)return;
    const k="ec_cx_"+uid;try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");}catch(e){}
    const app_=appareil();
    addDoc(collection(db,"connexions"),{uid,nom,mail:mail||"",role,appareil:app_,ts:serverTimestamp()}).catch(()=>{});
    // 10 dernières connexions, consultables par l'utilisateur dans ses paramètres
    const ref_=doc(db,"activite",uid);
    getDoc(ref_).then(s=>{const r=[{t:Date.now(),appareil:app_},...((s.exists()&&s.data().recents)||[])].slice(0,10);
      return setDoc(ref_,{uid,nom,mail:mail||"",role,appareil:app_,enLigne:true,lastSeen:serverTimestamp(),recents:r},{merge:true});}).catch(()=>{});
  },[uid,nom,mail,role]);
}
function useActiviteAll(){
  const[a,sA]=useState([]);
  useEffect(()=>onSnapshot(collection(db,"activite"),snap=>sA(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{}),[]);
  return a;
}
// Supprime les lignes du journal plus anciennes que la date limite (par lots de 400) ; renvoie le nombre supprimé
const purgerConnexions=async(avant)=>{
  let total=0;
  for(;;){
    const snap=await getDocs(query(collection(db,"connexions"),where("ts","<",avant),limit(400)));
    if(snap.empty)break;
    const b=writeBatch(db);snap.docs.forEach(d=>b.delete(d.ref));await b.commit();
    total+=snap.size;if(snap.size<400)break;
  }
  return total;
};
function useConnexions(n=400){
  const[c,sC]=useState([]);
  useEffect(()=>onSnapshot(query(collection(db,"connexions"),orderBy("ts","desc"),limit(n)),snap=>sC(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{}),[n]);
  return c;
}

// ── FIRESTORE ACTIONS ─────────────────────────────────────────────────────────
const saveUserData=async(uid,data)=>{await setDoc(doc(db,"users",uid),data,{merge:true});};
// Code saisi par l'utilisateur : formateur (FO-), offert (OF-) ou délivré par l'administrateur après paiement.
const activerCode=async(uid,saisie)=>{
  const c=String(saisie||"").trim().toUpperCase();if(!c)return{err:"Entrez votre code"};
  const snap=await getDoc(doc(db,"users",uid));if(!snap.exists())return{err:"Profil introuvable."};
  const ud=snap.data();
  if(c.startsWith("FO-")){
    if(ud.formateurCode!==c)return{err:"Code formateur incorrect."};
    await updateDoc(doc(db,"users",uid),{role:"formateur",formateurCodeValide:true});return{ok:true};
  }
  if(c.startsWith("OF-")){
    const r=await utiliserCodeOffert(db,uid,ud,c);if(!r.ok)return{err:r.err};
    notifier({dest:"admin",type:"message",titre:`Code offert utilisé : ${ud.nom||ud.mail||""}`,texte:`${c} · ${r.duree}`,vue:"ac",auteurNom:ud.nom||"",push:false});
    return{ok:true};
  }
  if(ud.activationCode!==c)return{err:"Code incorrect."};
  await updateDoc(doc(db,"users",uid),{abonnement:"actif",codeValide:true});return{ok:true};
};
// QCM d'un module : meilleur score conservé (fusionScore : n séries, dernière tentative) — base des attestations
const saveProgress=async(uid,modId,score)=>{
  const ref=doc(db,"users",uid);
  await runTransaction(db,async tx=>{const d=await tx.get(ref);const ancien=((d.data()||{}).scores||{})[modId];
    tx.update(ref,{[`scores.${modId}`]:fusionScore(ancien,{s:score.s,t:score.t}),[`progress.${modId}`]:"done"});});
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
  const headers=["Nom","Email","Rôle","Abonnement","Créé le","Dernière connexion","Modules complétés","Score moyen QCM","Quel compte ? (moyenne des meilleurs scores)","Monographie ZAO"];
  const rows=users.map(u=>{
    const nMods=Object.values(u.progress||{}).filter(v=>v==="done").length;
    const scoreVals=pctQcm(u);
    const avg=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length):"";
    const cpt=resumeCpt(u.scores||{}).moyenne,zao=u.scores?.["JRN-ZAO"]?.pct;
    const lastLogin=u.lastLogin?new Date(u.lastLogin).toLocaleString("fr-FR"):"Jamais";
    return [u.nom||"",u.mail||"",u.role==="formateur"?"Formateur":"Apprenant",u.abonnement||"aucun",u.createdAt||"",lastLogin,nMods,avg,cpt??"",zao??""]
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
  const extrait=String(texte||"").slice(0,200);
  if(fromRole==="apprenant")notifier({dest:formateurUid||"admin",type:"message",titre:`Nouveau message de ${fromNom||apprenantNom||"un apprenant"}`,texte:extrait,vue:formateurUid?"fmsg":"msg",auteurNom:fromNom||apprenantNom||""});
  else notifier({dest:apprenantUid,type:"message",titre:`Nouveau message de ${fromNom||"l'équipe Éco-Campus"}`,texte:extrait,vue:"msg",auteurNom:fromNom||""});
};
const markMsgsRead=async(apprenantUid,side)=>{
  try{
    const snap=await getDocs(query(collection(db,"messages"),where("apprenantUid","==",apprenantUid)));
    const field=side==="apprenant"?"luApprenant":"luAdmin";
    await Promise.all(snap.docs.filter(d=>!d.data()[field]).map(d=>updateDoc(d.ref,{[field]:true})));
  }catch(e){console.log("markMsgsRead error",e);}
};
// Contenu soumis par un formateur : notification à l'administration (cloche + push), qui ouvre « À valider »
const alerterAdmin=async(coll,id)=>{
  try{
    const c=(await getDoc(doc(db,coll,id))).data()||{};
    const u=c.createdBy?(await getDoc(doc(db,"users",c.createdBy))).data()||{}:{};
    const genre={modules:"un module",presentations:"une présentation",videos:"une vidéo",documents:"un document"}[coll]||"un contenu";
    const nom=u.nom||"Un formateur";
    notifier({dest:"admin",type:"contenu",titre:`À valider : ${c.titre||genre}`,texte:`${nom} a soumis ${genre} pour validation.`,vue:"val",auteurNom:nom});
  }catch(e){console.log("alerterAdmin",e.message);}
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
// Certains sélecteurs de fichiers (Android) ne donnent pas le type MIME : on se fie aussi à l'extension
const estPdf=f=>!!f&&(f.type==="application/pdf"||/\.pdf$/i.test(f.name||""));
// Message clair à partir d'une erreur Firebase Storage
const msgStorage=e=>{
  const c=e?.code||"";
  if(e?.message==="timeout"||c==="storage/retry-limit-exceeded")return"L'envoi a expiré. Vérifiez votre connexion et réessayez.";
  if(c==="storage/unauthorized")return"Permission refusée par Firebase Storage : vérifiez que les règles Storage sont publiées et que vous êtes connecté avec le bon compte.";
  if(c==="storage/unauthenticated")return"Session expirée : reconnectez-vous puis réessayez.";
  if(c==="storage/quota-exceeded")return"Quota de stockage Firebase dépassé : vérifiez la formule (Blaze) dans la console Firebase.";
  if(c==="storage/bucket-not-found"||c==="storage/project-not-found"||c==="storage/unknown")return"Stockage Firebase indisponible (formule Blaze requise). Utilisez plutôt un lien Google Drive.";
  if(c==="storage/canceled")return"Envoi annulé.";
  return e?.message||"Erreur inconnue lors de l'envoi.";
};
// Documents par lien (Google Drive, Docs, Slides…) : solution qui ne dépend pas de Firebase Storage
const lienValide=u=>/^https:\/\/\S+\.\S+/i.test((u||"").trim());
const lienDrive=u=>(u||"").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
const lienDocs=u=>(u||"").match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]{10,})/);
const apercuLien=u=>{
  const d=lienDrive(u);if(d)return`https://drive.google.com/file/d/${d[1]}/preview`;
  const g=lienDocs(u);if(g)return /[?&]rtpof=true/i.test(u)?`https://drive.google.com/file/d/${g[2]}/preview`:`https://docs.google.com/${g[1]}/d/${g[2]}/preview`;
  return null;
};
// Miniature de la première page, générée par Google Drive (fichier partagé par lien)
const miniatureLien=(u,l=400)=>{const id=lienDrive(u)?.[1]||lienDocs(u)?.[2];return id?`https://drive.google.com/thumbnail?id=${id}&sz=w${l}`:null;};
const avecDelai=(p,ms=90000)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))]);
const uploadPdf=async(modId,file)=>{
  const r=ref(storage,`pdfs/${modId}/${file.name}`);
  await avecDelai(uploadBytes(r,file,{contentType:"application/pdf"}));
  const url=await getDownloadURL(r);
  await setDoc(doc(db,"pdfs",modId),{name:file.name,url,modId});
  return{name:file.name,url};
};
const deletePdf=async(modId,name,lien=false)=>{
  if(!lien)try{await deleteObject(ref(storage,`pdfs/${modId}/${name}`));}catch(e){}
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
  notifier({dest:formateurUid||"admin",type:"message",titre:`Nouvelle copie à corriger : ${modTitre||"module"}`,texte:`${apprenantNom||"Un apprenant"} a remis ses réponses.`,vue:"corr",auteurNom:apprenantNom||""});
  await updateDoc(doc(db,"users",apprenantUid),{[`progress.${modId}`]:"done"});
};
const gradeOpenAnswers=async(answerId,notes,apprenantUid,modId,maxPoints,modTitre="")=>{
  const totalPoints=Object.values(notes).reduce((a,b)=>a+(Number(b)||0),0);
  const pct=maxPoints>0?Math.round(totalPoints/maxPoints*100):0;
  await updateDoc(doc(db,"openAnswers",answerId),{graded:true,notes,totalPoints,pct,gradedAt:Date.now()});
  await updateDoc(doc(db,"users",apprenantUid),{[`scores.${modId}`]:{s:totalPoints,t:maxPoints,pct}});
  notifier({dest:apprenantUid,type:"correction",titre:`Votre copie a été corrigée : ${pct} %`,texte:`${modTitre?`Module « ${modTitre} » : `:""}${totalPoints} / ${maxPoints} points.`,vue:"home",auteurNom:"Votre formateur",email:true});
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
const Logo=({sm,h})=>{const{tid}=useContext(Ctx);const sombre=["dark","blue","green","purple"].includes(tid);
  return <img src={sombre?LOGO_CLAIR:LOGO} alt="Éco-Campus" style={{height:h||(sm?28:34),width:"auto",display:"block",flexShrink:0}}/>;};
const Tg=({c,bg,bd,ch})=>{const K=useK();return <span style={{background:bg||K.c2,color:c||K.t2,border:`1px solid ${bd||K.b0}`,borderRadius:99,padding:"2px 8px",fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",display:"inline-block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",verticalAlign:"middle",boxSizing:"border-box"}}>{ch}</span>;};
const Bar=({p,col,h=4})=>{const K=useK();return <div style={{background:K.b0,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(p,100)}%`,height:"100%",background:col||K.em,borderRadius:99,transition:"width .6s ease"}}/></div>;};
const Spin=()=>{const K=useK();return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:24,background:K.bg}}><div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{position:"absolute",width:70,height:70,borderRadius:"50%",background:`${K.em}14`,animation:"pulse 2s ease-in-out infinite"}}/><div style={{position:"absolute",width:52,height:52,borderRadius:"50%",background:`${K.em}0D`,animation:"pulse 2s ease-in-out infinite .4s"}}/><div style={{width:46,height:46,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 24px ${K.emD}40`,animation:"logofl 2.4s ease-in-out infinite"}}><img src={LOGO_ICONE} alt="" style={{width:46,height:46,borderRadius:14}}/></div></div><div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:6}}>Éco-Campus</div><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:K.em,display:"inline-block",animation:"dotfl 1.4s ease-in-out infinite",animationDelay:`${i*0.22}s`}}/>)}</div></div></div>;};
function Btn({ch,on,v="p",sm,full,dis,sx}){const K=useK();const M={p:{bg:`linear-gradient(135deg,${K.emD},${K.em})`,col:"#FFFFFF",sh:`0 6px 16px ${K.emD}40`},g:{bg:"transparent",col:K.t2,bo:`1px solid ${K.b1}`},d:{bg:K.erBg,col:K.er,bo:`1px solid ${K.erBd}`},w:{bg:K.waBg,col:K.wa,bo:`1px solid ${K.waBd}`},i:{bg:`linear-gradient(135deg,${K.inD},${K.in_})`,col:"#fff",sh:`0 2px 10px ${K.inD}44`},s:{bg:K.c2,col:K.t2,bo:`1px solid ${K.b0}`},r:{bg:K.rdBg,col:K.rd,bo:`1px solid ${K.rdBd}`}}[v]||{};return <button onClick={dis?null:on} className="bt" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:sm?"7px 12px":"11px 19px",borderRadius:sm?10:12,fontSize:sm?13:14,fontWeight:700,letterSpacing:.1,border:M.bo||"none",background:M.bg,color:M.col,boxShadow:M.sh||"none",width:full?"100%":undefined,opacity:dis?.45:1,cursor:dis?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",minHeight:sm?36:44,transition:"filter .15s,transform .12s,box-shadow .2s",...sx}}>{ch}</button>;}
function Inp({lb,rf,type,ph,mono,note,ok,def,rows,val,onChange}){const K=useK();const base={width:"100%",padding:"11px 14px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,color:K.t1,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:mono?"'JetBrains Mono',monospace":"'Outfit',sans-serif",caretColor:K.em};const fe=e=>{e.target.style.borderColor=K.em;e.target.style.boxShadow=`0 0 0 3px ${K.emBg}`;if(!rows)e.target.style.background=K.card;};const fb=e=>{e.target.style.borderColor=K.b0;e.target.style.boxShadow="none";if(!rows)e.target.style.background=K.c2;};const props={onFocus:fe,onBlur:fb};if(val!==undefined){props.value=val;props.onChange=onChange||function(){};}else{props.defaultValue=def||"";}return <div style={{marginBottom:13}}>{lb&&<div style={{color:K.t1,fontSize:13.5,fontWeight:700,marginBottom:6}}>{lb}</div>}{rows?<textarea ref={rf} rows={rows} placeholder={ph||""} style={{...base,resize:"vertical",lineHeight:1.6,minHeight:44}} {...props}/>:<input ref={rf} type={type||"text"} placeholder={ph||""} style={{...base,minHeight:46,letterSpacing:mono?3:0}} {...props} onKeyDown={ok}/>}{note&&<div style={{color:K.t3,fontSize:12,marginTop:3,lineHeight:1.4}}>{note}</div>}</div>;}
function Pop({t,m}){const K=useK();if(!m)return null;const s={e:{bg:K.erBg,bd:K.erBd,col:K.er,ic:"⚠"},o:{bg:K.emBg,bd:K.emBd,col:K.em,ic:"✓"}}[t]||{};return <div style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:12,color:s.col,fontSize:14,fontWeight:600,padding:"11px 14px",marginBottom:11,display:"flex",gap:7,lineHeight:1.5,animation:"sc .2s ease"}}><span>{s.ic}</span><span>{m}</span></div>;}
function Sheet({title,onClose,children,w=460}){const K=useK();return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,12,30,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}><div style={{width:"100%",maxWidth:w,background:K.card,border:`1px solid ${K.b1}`,borderRadius:"24px 24px 0 0",padding:"16px 20px max(18px,env(safe-area-inset-bottom))",boxShadow:"0 -12px 40px rgba(0,0,0,.18)",maxHeight:"92vh",overflowY:"auto",animation:"su .26s ease"}}><div style={{width:36,height:4,background:K.b1,borderRadius:99,margin:"0 auto 13px"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:19,color:K.t1}}>{title}</div><button onClick={onClose} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,width:34,height:34,borderRadius:"50%",fontSize:19,cursor:"pointer",lineHeight:1}}>×</button></div>{children}</div></div>;}
function Donut({pct}){const K=useK();const[p,sP]=useState(0);useEffect(()=>{const t=setTimeout(()=>sP(pct),200);return()=>clearTimeout(t);},[pct]);const r=38,c=2*Math.PI*r;return <svg width={84} height={84} viewBox="0 0 84 84" style={{flexShrink:0}}><circle cx={42} cy={42} r={r} fill="none" stroke={K.c2} strokeWidth={7}/><circle cx={42} cy={42} r={r} fill="none" stroke={K.em} strokeWidth={7} strokeDasharray={`${c*p/100} ${c}`} strokeLinecap="round" transform="rotate(-90 42 42)" style={{transition:"stroke-dasharray .8s ease"}}/><text x={42} y={39} textAnchor="middle" fill={K.t1} style={{fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:700}}>{p}%</text><text x={42} y={51} textAnchor="middle" fill={K.t3} style={{fontFamily:"'Outfit',sans-serif",fontSize:10}}>global</text></svg>;}
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
        <div style={{color:K.t1,fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cur.titre||"Vidéo"}</div>
        {list.length>1&&<div style={{color:K.t3,fontSize:11,marginTop:1}}>{idx+1}/{list.length} · {list[idx]?.mat||""}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
        {list.length>1&&<button onClick={()=>sShowPlan(p=>!p)} className="bt" style={{background:showPlan?K.emBg:K.c2,border:`1px solid ${showPlan?K.emBd:K.b0}`,color:showPlan?K.em:K.t3,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:30}}>📋 Plan</button>}
        <button onClick={()=>sAuto(a=>!a)} className="bt" style={{background:autoPlay?K.emBg:K.c2,border:`1px solid ${autoPlay?K.emBd:K.b0}`,color:autoPlay?K.em:K.t3,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:30,display:list.length>1?"flex":"none",alignItems:"center",gap:4}}><i className="ti ti-player-skip-forward" style={{fontSize:13}}/>Auto</button>
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
          <button onClick={()=>go(idx-1)} disabled={!hasPrev} className="bt" style={{background:hasPrev?K.c2:"transparent",border:`1px solid ${hasPrev?K.b1:K.b0}`,color:hasPrev?K.t1:K.t3,borderRadius:8,padding:"7px 13px",cursor:hasPrev?"pointer":"default",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,minHeight:36,opacity:hasPrev?1:.4}}>
            <i className="ti ti-chevron-left" style={{fontSize:14}}/>Précédent
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:3}}>
              {list.slice(Math.max(0,idx-2),idx+3).map((_,i)=>{const realI=Math.max(0,idx-2)+i;return <button key={realI} onClick={()=>go(realI)} className="bt" style={{width:realI===idx?22:8,height:8,borderRadius:99,background:realI===idx?K.em:K.b1,border:"none",padding:0,cursor:"pointer",transition:"all .2s"}}/>;})}
            </div>
            <div style={{color:K.t3,fontSize:11}}>{idx+1} / {list.length}</div>
          </div>
          <button onClick={()=>go(idx+1)} disabled={!hasNext} className="bt" style={{background:hasNext?K.emBg:"transparent",border:`1px solid ${hasNext?K.emBd:K.b0}`,color:hasNext?K.em:K.t3,borderRadius:8,padding:"7px 13px",cursor:hasNext?"pointer":"default",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,minHeight:36,opacity:hasNext?1:.4}}>
            Suivant<i className="ti ti-chevron-right" style={{fontSize:14}}/>
          </button>
        </div>}
      </div>
      {/* Plan sidebar */}
      {showPlan&&list.length>1&&<div style={{width:mob?"100%":260,background:K.card,borderLeft:`1px solid ${K.b0}`,overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 14px",borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
          <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:1}}>Plan du cours</div>
          <div style={{fontSize:12,color:K.t3}}>{list.length} vidéos</div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {list.map((v,i)=>{const pv=pVid(v.url);const isCur=i===idx;return <div key={i} onClick={()=>{go(i);if(mob)sShowPlan(false);}} className="bt" style={{padding:"10px 14px",borderBottom:`1px solid ${K.b0}`,cursor:"pointer",background:isCur?K.emBg:"transparent",borderLeft:isCur?`3px solid ${K.em}`:"3px solid transparent",display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:48,height:32,borderRadius:5,background:K.c2,flexShrink:0,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:null}
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><i className={isCur?"ti ti-player-play":"ti ti-player-play"} style={{fontSize:12,color:isCur?K.em:"#fff"}}/></div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:isCur?700:500,color:isCur?K.em:K.t1,lineHeight:1.35,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{v.titre}</div>
              <div style={{fontSize:11,color:K.t3,marginTop:3}}>{i+1}/{list.length}</div>
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
        <div style={{fontSize:12,color:K.t3,marginTop:3}}>{ratings.length} avis</div>
      </div>
    </div>}
    {/* Ma notation */}
    <div style={{marginBottom:10}}>
      <div style={{fontSize:13,fontWeight:700,color:K.t1,marginBottom:8}}>{submitted?"Votre avis":"Notez ce cours"}</div>
      <StarRating value={myRating} onChange={submitted?null:setMyRating} readonly={submitted} size={24}/>
    </div>
    {!submitted&&<>
      <textarea value={myComment} onChange={e=>setMyComment(e.target.value)}
        placeholder="Commentaire optionnel..."
        style={{width:"100%",background:K.card,border:`1px solid ${K.b1}`,borderRadius:8,padding:"8px 10px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",minHeight:60,boxSizing:"border-box",marginBottom:8}}/>
      <button onClick={submitRating} disabled={saving||!myRating} className="bt"
        style={{width:"100%",padding:"10px",background:myRating?"linear-gradient(135deg,#D97706,#F59E0B)":"#333",border:"none",borderRadius:8,color:myRating?"#fff":K.t3,fontWeight:700,fontSize:14,cursor:myRating?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
        {saving?"Enregistrement...":"⭐ Soumettre mon avis"}
      </button>
    </>}
    {submitted&&<div style={{fontSize:13,color:K.em,display:"flex",alignItems:"center",gap:5,marginTop:6}}>
      <i className="ti ti-check" style={{fontSize:14}}/>Merci pour votre avis !
    </div>}
    {/* Derniers avis */}
    {ratings.filter(r=>r.comment).length>0&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${K.b0}`}}>
      <div style={{fontSize:12,fontWeight:700,color:K.t3,marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Avis récents</div>
      {ratings.filter(r=>r.comment).slice(0,3).map(r=><div key={r.id} style={{marginBottom:8,padding:"8px 10px",background:K.card,borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <StarRating value={r.note} readonly size={11}/>
          <span style={{fontSize:11,color:K.t3}}>{r.date}</span>
        </div>
        <div style={{fontSize:13,color:K.t2,lineHeight:1.5}}>{r.comment}</div>
      </div>)}
    </div>}
  </div>;
}

// Validation par l'admin : lien du contenu, rappel du partage Google et aperçu intégré avant d'approuver
function ApercuLien({url,video,ouvrir=true}){
  const K=useK();const[vu,sVu]=useState(false);
  if(!url)return <div style={{fontSize:12,color:K.er,marginBottom:8}}>Aucun lien fourni.</div>;
  const src=apercuValidation(url,video);
  const bouton={display:"inline-flex",alignItems:"center",gap:4,background:K.inBg,border:`1px solid ${K.inBd}`,color:K.in_,borderRadius:8,padding:"6px 10px",fontSize:12.5,fontWeight:700,fontFamily:"'Outfit',sans-serif",cursor:"pointer",textDecoration:"none",minHeight:32};
  return <div style={{marginBottom:8}}>
    <div style={{fontSize:12,color:K.t3,marginBottom:6,wordBreak:"break-all",lineHeight:1.4}}><i className="ti ti-link" style={{fontSize:12,marginRight:3}}/>{url}</div>
    {lienGoogle(url)&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,color:K.t2,borderRadius:8,padding:"7px 10px",fontSize:12,lineHeight:1.5,marginBottom:6}}><b style={{color:K.wa}}>Partage à vérifier :</b> le fichier doit être réglé sur « Tous les utilisateurs disposant du lien ». Test : ouvrez le lien dans une fenêtre de navigation privée ; s'il demande l'accès, les apprenants seront bloqués.</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {ouvrir&&<a href={url} target="_blank" rel="noreferrer" className="bt" style={bouton}><i className="ti ti-external-link" style={{fontSize:13}}/>Ouvrir le lien</a>}
      {src?<button onClick={()=>sVu(x=>!x)} className="bt" style={bouton}><i className={`ti ti-${vu?"eye-off":"eye"}`} style={{fontSize:13}}/>{vu?"Masquer l'aperçu":"Aperçu"}</button>
        :<span style={{fontSize:12,color:K.t3,alignSelf:"center"}}>Aperçu intégré impossible pour ce lien : ouvrez-le pour le vérifier.</span>}
    </div>
    {vu&&src&&<iframe src={src} title="Aperçu du contenu" style={{width:"100%",aspectRatio:"16/9",border:`1px solid ${K.b0}`,borderRadius:10,marginTop:8,background:"#000"}} allow="autoplay; fullscreen" allowFullScreen/>}
  </div>;
}
function Miniature({url,w,h,r=8,K,alt="",fallback=null}){
  const src=miniatureLien(url,typeof w==="number"?Math.max(w,h)*2:600);
  const[ko,sKo]=useState(false);
  if(!src||ko)return fallback;
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>sKo(true)}
    style={{width:w,height:h,objectFit:"cover",objectPosition:"top",borderRadius:r,border:`1px solid ${K.b0}`,background:K.c2,flexShrink:0,display:"block"}}/>;
}

// Rappel du partage Drive : sans « Tous les utilisateurs disposant du lien », l'apprenant tombe sur « Demander l'accès »
const PARTAGE_DRIVE="Tous les utilisateurs disposant du lien";
function RappelPartage({K,url}){
  return <div style={{marginTop:7,background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:8,padding:"8px 10px",fontSize:11.5,color:K.t2,lineHeight:1.5}}>
    <div style={{fontWeight:800,color:K.t1,marginBottom:2}}><i className="ti ti-share" style={{fontSize:13,verticalAlign:-2,color:K.wa}}/> Avant d'enregistrer, vérifiez le partage dans Drive</div>
    Partager → Accès général → <b>« {PARTAGE_DRIVE} »</b> → rôle <b>Lecteur</b>. Sinon, l'apprenant verra « Demander l'accès ». Conseil : dans ⚙ (paramètres du partage), décochez le téléchargement, l'impression et la copie pour les lecteurs.
    <div style={{marginTop:5}}><a href={apercuLien(url)} target="_blank" rel="noopener noreferrer" style={{color:K.em,fontWeight:700,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:12,verticalAlign:-1}}/> Tester comme un apprenant</a> <span style={{color:K.t3}}>— ouvrez le lien dans une fenêtre de navigation privée : si Google demande l'accès, le partage n'est pas encore ouvert.</span></div>
  </div>;
}

function ChampLien({K,val,onChange,lb}){
  const ok=!val.trim()||lienValide(val);
  return <div>
    <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-link" style={{fontSize:13}}/>{lb}</div>
    <input value={val} onChange={e=>onChange(e.target.value)} inputMode="url" placeholder="https://drive.google.com/file/d/…"
      style={{width:"100%",background:K.c2,border:`1px solid ${ok?K.b1:K.erBd}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
    {val.trim()&&<div style={{fontSize:11.5,marginTop:4,color:!ok?K.er:apercuLien(val)?K.em:K.t3}}>
      {!ok?"Le lien doit commencer par https://":apercuLien(val)?"✓ Lien Google reconnu : il s'ouvrira dans l'application.":"Lien externe : il doit pointer directement vers un fichier PDF public."}
    </div>}
    {ok&&apercuLien(val)&&<RappelPartage K={K} url={val}/>}
    {ok&&miniatureLien(val)&&<div style={{marginTop:7,display:"flex",alignItems:"center",gap:9}}>
      <Miniature key={val} url={val} w={54} h={72} r={6} K={K} fallback={<div style={{fontSize:11.5,color:K.wa}}>⚠ Couverture indisponible : vérifiez que le fichier est partagé en « Tous les utilisateurs disposant du lien ».</div>}/>
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
  const od=estOneDrive(url)?embedPresentation(url):null;
  const embedUrl=apercuLien(url)||(od&&od.src)||(od?null:`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:1000,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 15px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <i className="ti ti-file-text" style={{fontSize:16,color:K.em}}/>
        <div>
          <div style={{color:K.t1,fontWeight:700,fontSize:14}}>{name}</div>
          <div style={{color:K.t3,fontSize:11,display:"flex",alignItems:"center",gap:4}}>
            <i className="ti ti-lock" style={{fontSize:10}}/>Lecture seule · Non téléchargeable
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {showRating&&uid&&<button onClick={()=>setTab(t=>t==="pdf"?"rating":"pdf")} className="bt"
          style={{background:tab==="rating"?"#F59E0B18":"rgba(255,255,255,.08)",border:`1px solid ${tab==="rating"?"#F59E0B30":"rgba(255,255,255,.15)"}`,borderRadius:7,padding:"5px 9px",color:tab==="rating"?"#F59E0B":"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
          <i className="ti ti-star" style={{fontSize:12}}/>Notes
        </button>}
        <Btn ch="✕" on={onClose} v="g" sm/>
      </div>
    </div>
    {tab==="pdf"
      ?<div style={{flex:1,position:"relative",overflow:"hidden"}} onContextMenu={e=>e.preventDefault()}>
        {embedUrl?<iframe src={embedUrl} title={name}
          style={{width:"100%",height:"100%",border:"none"}}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          allow="fullscreen"/>
        :<div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24,color:"rgba(255,255,255,.85)"}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:6}}>Document hébergé sur OneDrive</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:14,maxWidth:380,lineHeight:1.55}}>OneDrive n'autorise pas l'affichage de ce lien dans l'application.</div>
          <a href={srcIframe(url)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:10,background:"#FFFFFF",color:ACC.em,fontWeight:800,fontSize:14,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:15}}/>Ouvrir le document</a>
        </div>}
        {apercuLien(url)&&<div style={{position:"absolute",left:0,right:0,bottom:0,padding:"6px 12px",background:"rgba(0,0,0,.72)",color:"rgba(255,255,255,.85)",fontSize:11.5,textAlign:"center",lineHeight:1.4}}>
          <i className="ti ti-info-circle" style={{fontSize:12,verticalAlign:-1}}/> Google vous demande une autorisation ? Le fichier n'est pas encore partagé par lien : signalez-le à l'équipe Éco-Campus (Messages).
        </div>}
      </div>
      :<div style={{flex:1,overflowY:"auto",padding:mob?"14px":"20px 28px",maxWidth:560,margin:"0 auto",width:"100%"}}>
        <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4}}>{name}</div>
        <div style={{fontSize:13,color:K.t3,marginBottom:12}}>Donnez votre avis sur ce cours</div>
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
    {ico:"ti-history",title:"Journal de connexion",body:"Pour la sécurité de la plateforme et le suivi pédagogique, nous enregistrons la date et l'heure de vos connexions, le type d'appareil (téléphone ou ordinateur, système, navigateur ou application) et la rubrique consultée. Ces informations sont visibles uniquement par l'administrateur."},
    {ico:"ti-share",title:"Partage des données",body:"Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Elles sont stockées de manière sécurisée sur Firebase (Google Cloud), conforme au RGPD."},
    {ico:"ti-clock",title:"Durée de conservation",body:"Vos données sont conservées pendant la durée de votre abonnement et 12 mois après expiration. Vous pouvez demander la suppression de votre compte à tout moment."},
    {ico:"ti-adjustments",title:"Vos droits",body:"Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour toute demande : gnkuli@outlook.fr"},
    {ico:"ti-brand-google",title:"Connexion sociale",body:"Si vous utilisez la connexion Google ou Facebook, nous récupérons uniquement votre nom et email publics. Aucun autre accès à vos comptes n'est effectué."},
    {ico:"ti-cookie",title:"Cookies",body:"Nous utilisons uniquement un cookie de session Firebase pour maintenir votre connexion et un cookie de préférence de thème (stocké localement). Aucun cookie publicitaire."},
    {ico:"ti-mail",title:"Contact",body:"Éco-Campus RDC · gnkuli@outlook.fr · Pour toute question relative à vos données personnelles."},
  ];
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)",zIndex:1200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:mob?"0":"20px 16px"}}>
    <div style={{width:"100%",maxWidth:560,background:K.card,border:`1px solid ${K.b1}`,borderRadius:mob?"18px 18px 0 0":"18px",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"su .25s ease",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${K.b0}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:34,height:34,borderRadius:10,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-shield-check" style={{fontSize:17,color:K.in_}}/></div>
          <div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Politique de confidentialité</div><div style={{fontSize:11,color:K.t3}}>Éco-Campus RDC · v{PRIVACY_VERSION}</div></div>
        </div>
        <button onClick={onClose} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:7,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button>
      </div>
      {/* Body scrollable */}
      <div style={{overflowY:"auto",padding:"14px 18px",flex:1}}>
        <div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:13,color:K.t2,lineHeight:1.6}}>
          <i className="ti ti-info-circle" style={{fontSize:14,color:K.em,verticalAlign:"middle",marginRight:5}}/>
          En créant un compte sur Éco-Campus RDC, vous acceptez que vos données soient traitées conformément à la présente politique.
        </div>
        {sections.map((s,i)=><div key={i} style={{marginBottom:13,display:"flex",gap:11,alignItems:"flex-start"}}>
          <div style={{width:30,height:30,borderRadius:8,background:K.c2,border:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
            <i className={`ti ${s.ico}`} style={{fontSize:14,color:K.in_}}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:3}}>{s.title}</div>
            <div style={{fontSize:13,color:K.t2,lineHeight:1.65}}>{s.body}</div>
          </div>
        </div>)}
        <div style={{marginTop:6,padding:"9px 12px",background:K.c2,borderRadius:8,fontSize:11,color:K.t3,textAlign:"center"}}>
          Dernière mise à jour : mai 2026 · Version {PRIVACY_VERSION}
        </div>
      </div>
      {/* Footer */}
      <div style={{padding:"12px 18px",borderTop:`1px solid ${K.b0}`,flexShrink:0}}>
        <button onClick={onClose} className="bt" style={{width:"100%",padding:"11px",background:`linear-gradient(135deg,${ACC.emD},${ACC.em})`,border:"none",borderRadius:9,color:"#FFFFFF",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:42}}>
          J'ai compris ✓
        </button>
      </div>
    </div>
  </div>;
}

// ── SÉLECTEUR THÈME ───────────────────────────────────────────────────────────
function PresViewer({url,titre,desc,narration,onClose}){
  const K=useK();const{mob}=useW();
  const segsAudio=useMemo(()=>texteNarration({titre,narration}),[titre,narration]);
  // Lien d'intégration selon l'hébergeur (Google Slides, Drive, Canva, OneDrive) — voir src/presentation.js
  const{src:embedUrl,hebergeur}=embedPresentation(url);
  const lienExterne=srcIframe(url);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:1000,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 15px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:32,height:32,borderRadius:8,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-presentation" style={{fontSize:16,color:K.in_}}/></div>
        <div><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{titre}</div>{desc&&<div style={{color:K.t3,fontSize:11,marginTop:1}}>{desc}</div>}</div>
      </div>
      <Btn ch="✕" on={onClose} v="g" sm/>
    </div>
    <div style={{flex:1,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {embedUrl
        ?<iframe src={embedUrl} title={titre} style={{width:"100%",height:"100%",border:"none"}} allowFullScreen/>
        :hebergeur==="onedrive"
          ?<div style={{textAlign:"center",color:"rgba(255,255,255,.85)",padding:"32px 24px",maxWidth:420}}>
            <i className="ti ti-presentation" style={{fontSize:42,color:"rgba(255,255,255,.6)"}}/>
            <div style={{fontWeight:800,fontSize:16,margin:"10px 0 6px"}}>Présentation hébergée sur OneDrive</div>
            <div style={{fontSize:13,lineHeight:1.55,color:"rgba(255,255,255,.7)",marginBottom:16}}>OneDrive n'autorise pas l'affichage de ce lien à l'intérieur de l'application. Ouvrez la présentation dans un nouvel onglet.</div>
            <a href={lienExterne} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"11px 18px",borderRadius:10,background:"#FFFFFF",color:ACC.em,fontWeight:800,fontSize:14,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:16}}/>Ouvrir la présentation</a>
          </div>
          :<div style={{textAlign:"center",color:K.t3,padding:40}}><div style={{fontSize:40,marginBottom:10}}>⚠️</div><div>URL non supportée.</div><div style={{fontSize:13,marginTop:5}}>Utilisez un lien Google Slides, Canva ou le lien « Incorporer » de PowerPoint en ligne.</div></div>
      }
    </div>
    {segsAudio.length>0&&<div style={{background:K.card,borderTop:`1px solid ${K.b0}`,padding:"8px 15px",flexShrink:0}}>
      <LecteurAudio K={K} segments={segsAudio} titre="Écouter la présentation"/>
      <div style={{fontSize:11.5,color:K.t3,marginTop:4}}>La narration annonce chaque diapositive : avancez la présentation au fil de l'écoute.</div>
    </div>}
    <div style={{background:K.card,borderTop:`1px solid ${K.b0}`,padding:"8px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{fontSize:12,color:K.t3}}>{mob?"":"💡 Utilisez les flèches du clavier pour naviguer dans la présentation"}</div>
      <a href={lienExterne} target="_blank" rel="noreferrer" style={{fontSize:12,color:K.in_,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><i className="ti ti-external-link" style={{fontSize:13}}/>Ouvrir dans un nouvel onglet</a>
    </div>
  </div>;
}

function ThemePicker({open,onClose}){
  const K=useK();const{tid,setT}=useContext(Ctx);
  if(!open)return null;
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1001}}>
    <div style={{width:"100%",maxWidth:500,background:K.card,border:`1px solid ${K.b1}`,borderRadius:"24px 24px 0 0",padding:"16px 20px max(18px,env(safe-area-inset-bottom))",boxShadow:"0 -12px 40px rgba(0,0,0,.18)",animation:"su .25s ease"}}>
      <div style={{width:36,height:4,background:K.b1,borderRadius:99,margin:"0 auto 14px"}}/>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:3}}>🎨 Apparence</div>
      <div style={{color:K.t3,fontSize:13,marginBottom:16}}>Choisissez votre thème d'affichage.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:16}}>
        {Object.entries(TH).map(([id,t])=>{const sel=tid===id;return <button key={id} onClick={()=>{setT(id);}} className="bt" style={{background:t.bg,border:`2px solid ${sel?ACC.em:t.b0}`,borderRadius:12,padding:"13px 8px 11px",cursor:"pointer",textAlign:"center",position:"relative",minHeight:76}}>{sel&&<span style={{position:"absolute",top:4,right:6,fontSize:11,color:ACC.em,fontWeight:800}}>✓</span>}<div style={{fontSize:20,marginBottom:4}}>{t.i}</div><div style={{fontSize:12,fontWeight:700,color:t.t1,lineHeight:1,marginBottom:6}}>{t.n}</div><div style={{display:"flex",justifyContent:"center",gap:3}}>{[t.bg,t.ca,t.c2].map((c,i)=><span key={i} style={{width:8,height:8,borderRadius:"50%",background:c,border:`1px solid ${t.b1}`,display:"inline-block"}}/>)}</div></button>;})}
      </div>
      <button onClick={onClose} className="bt" style={{width:"100%",padding:"11px",background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:9,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:42}}>Fermer</button>
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
    PLAY_STORE?{val:"1 code",label:"pour tout débloquer",ico:"key"}:{val:"24h",label:"Accès après paiement",ico:"bolt"},
  ];
  const publics=[
    {ico:"building-store",label:"Entrepreneurs",desc:"Services et accompagnement pour structurer votre activité"},
    {ico:"user-search",label:"Chercheurs d'emploi",desc:"Renforcez vos compétences pour vous démarquer"},
    {ico:"school",label:"Étudiants",desc:"Tous niveaux, toutes filières"},
    {ico:"briefcase",label:"Professionnels",desc:"Quel que soit votre secteur d'activité"},
  ];
  const features=[
    {ico:"book-2",     col:"#1E4FA3",label:"Modules structurés",  desc:"Des modules organisés par thème, du fondamental à l'avancé."},
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
        <Logo h={mob?28:34}/>
      </div>
      <button onClick={onLogin} className="bt" style={{
        background:`linear-gradient(135deg,#0A2A5C,#1E4FA3)`,border:"none",
        borderRadius:9,padding:mob?"8px 16px":"9px 22px",
        color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",
        fontFamily:"'Outfit',sans-serif",boxShadow:"0 4px 14px rgba(30,79,163,.35)"}}>
        Se connecter →
      </button>
    </nav>

    {/* ── HERO ── */}
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:mob?"100px 20px 60px":"120px 32px 80px",
      position:"relative",textAlign:"center",overflow:"hidden"}}>

      {/* Background decorations */}
      <div style={{position:"absolute",top:"10%",left:"5%",width:300,height:300,borderRadius:"50%",
        background:`radial-gradient(circle,#1E4FA318,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"5%",width:250,height:250,borderRadius:"50%",
        background:`radial-gradient(circle,#3B82F618,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"40%",right:"15%",width:120,height:120,borderRadius:"50%",
        background:`radial-gradient(circle,#F59E0B12,transparent 70%)`,pointerEvents:"none"}}/>

      {/* Badge */}
      <div style={{display:"inline-flex",alignItems:"center",gap:7,background:K.emBg,
        border:`1px solid ${K.emBd}`,borderRadius:99,padding:"6px 16px",marginBottom:28,animation:"up .5s ease"}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:"#1E4FA3",display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/>
        <span style={{fontSize:13,fontWeight:700,color:"#1E4FA3",letterSpacing:.4}}>🇨🇩 Services et formations en RDC</span>
      </div>

      {/* Logo hero */}
      <div style={{marginBottom:20,animation:"up .5s ease .05s both",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        <Logo h={mob?54:76}/>
      </div>

      {/* Titre */}
      <h1 style={{margin:"0 0 16px",fontSize:mob?"1.9rem":"3.4rem",fontWeight:900,lineHeight:1.1,
        color:K.t1,letterSpacing:"-1px",maxWidth:720,animation:"up .6s ease .1s both"}}>
        La plateforme de{" "}
        <span style={{background:"linear-gradient(135deg,#1E4FA3,#A3122A)",
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
          <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:14,color:K.t2,fontWeight:600}}>
            <span>{e}</span><span>{l}</span>
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",
        animation:"up .6s ease .3s both",marginBottom:56}}>
        <button onClick={onLogin} className="bt" style={{
          background:`linear-gradient(135deg,#0A2A5C,#1E4FA3)`,border:"none",
          borderRadius:12,padding:"14px 28px",color:"#fff",fontWeight:800,
          fontSize:15,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
          boxShadow:"0 8px 24px rgba(30,79,163,.4)",minHeight:50}}>
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
          background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,
          padding:"16px 12px",textAlign:"center"}}>
          <i className={`ti ti-${ico}`} style={{fontSize:20,color:"#1E4FA3",display:"block",marginBottom:6}}/>
          <div style={{fontWeight:900,fontSize:mob?20:24,color:K.t1,lineHeight:1}}>{val}</div>
          <div style={{fontSize:12,color:K.t3,marginTop:4,lineHeight:1.3}}>{label}</div>
        </div>)}
      </div>
    </div>

    {/* ── POUR QUI ── */}
    <div style={{padding:mob?"48px 20px":"64px 32px",maxWidth:900,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1E4FA3",letterSpacing:2,
          textTransform:"uppercase",marginBottom:10}}>Audience</div>
        <h2 style={{margin:0,fontSize:mob?"1.6rem":"2.2rem",fontWeight:900,color:K.t1}}>
          Conçu pour vous, où que vous soyez
        </h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:14}}>
        {publics.map(({ico,label,desc},i)=>{const c=["#0A2A5C","#2563EB","#D97706","#7C3AED"][i];return <div key={label} className="tile" style={{
          padding:"22px",display:"flex",gap:16,alignItems:"flex-start",cursor:"default"}}>
          <div style={{width:52,height:52,borderRadius:15,flexShrink:0,
            background:`linear-gradient(135deg,${c},${c}B0)`,boxShadow:`0 8px 18px ${c}40`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className={`ti ti-${ico}`} style={{fontSize:25,color:"#fff"}}/>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:K.t1,marginBottom:5}}>{label}</div>
            <div style={{fontSize:14.5,color:K.t2,lineHeight:1.55}}>{desc}</div>
          </div>
        </div>;})}
      </div>
    </div>

    {/* ── FONCTIONNALITÉS ── */}
    <div style={{padding:mob?"48px 20px":"64px 32px",
      background:K.card,borderTop:`1px solid ${K.b0}`,borderBottom:`1px solid ${K.b0}`}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:13,fontWeight:700,color:"#1E4FA3",letterSpacing:2,
            textTransform:"uppercase",marginBottom:10}}>Fonctionnalités</div>
          <h2 style={{margin:0,fontSize:mob?"1.6rem":"2.2rem",fontWeight:900,color:K.t1}}>
            Tout ce dont vous avez besoin
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14}}>
          {features.map(({ico,col,label,desc})=><div key={label} className="tile" style={{padding:"24px 22px",cursor:"default"}}>
            <div style={{position:"absolute",top:-40,right:-40,width:130,height:130,borderRadius:"50%",background:`radial-gradient(circle,${col}20,transparent 70%)`}}/>
            <div style={{width:54,height:54,borderRadius:16,position:"relative",
              background:`linear-gradient(135deg,${col},${col}B0)`,boxShadow:`0 8px 18px ${col}40`,
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              <i className={`ti ti-${ico}`} style={{fontSize:26,color:"#fff"}}/>
            </div>
            <div style={{fontWeight:800,fontSize:17,color:K.t1,marginBottom:7}}>{label}</div>
            <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6}}>{desc}</div>
          </div>)}
        </div>
      </div>
    </div>

    {/* ── CTA FINAL ── */}
    <div style={{padding:mob?"56px 20px":"80px 32px",textAlign:"center"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{margin:"0 auto 20px",display:"flex",justifyContent:"center",alignItems:"center",gap:10}}>
          <Logo h={44}/>
        </div>
        <h2 style={{margin:"0 0 14px",fontSize:mob?"1.8rem":"2.4rem",
          fontWeight:900,color:K.t1,lineHeight:1.2}}>
          Passez de la théorie à la pratique.
        </h2>
        <p style={{margin:"0 auto 32px",fontSize:16,color:K.t2,lineHeight:1.7,maxWidth:560}}>
          Comptabilité SYSCOHADA, états financiers, fiscalité congolaise et audit : formez-vous sur des cas réels de la RDC, à votre rythme.
        </p>
        <button onClick={onLogin} className="bt" style={{
          background:`linear-gradient(135deg,#0A2A5C,#1E4FA3)`,border:"none",
          borderRadius:14,padding:mob?"16px 26px":"16px 36px",color:"#fff",fontWeight:900,
          fontSize:16,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
          boxShadow:"0 8px 28px rgba(30,79,163,.4)",minHeight:54,whiteSpace:"nowrap",
          display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10}}>
          Créer mon compte gratuit
          <i className="ti ti-arrow-right" style={{fontSize:18}}/>
        </button>
        <div style={{marginTop:16,fontSize:13,color:K.t3}}>
          Déjà inscrit ?{" "}
          <button onClick={onLogin} className="bt" style={{background:"none",border:"none",
            color:"#1E4FA3",fontWeight:700,fontSize:13,cursor:"pointer",
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
      <div style={{fontSize:13,color:K.t3}}>© 2026 Éco-Campus RDC · Tous droits réservés</div>
      <div style={{fontSize:13,color:K.t3,display:"flex",gap:"6px 16px",flexWrap:"wrap"}}>
        <span>gnkuli@outlook.fr</span>
        <a href="https://wa.me/243979075970" target="_blank" rel="noreferrer" style={{color:K.t3,textDecoration:"none"}}>WhatsApp +243 979 075 970</a>
      </div>
    </div>

  </div>;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({u,onDone,mods}){
  const K=useK();const{mob}=useW();
  const[step,setStep]=useState(0);
  const steps=[
    {ico:"rocket",col:"#1E4FA3",title:`Bienvenue, ${(u.nom||"").split(" ")[0]} ! 🎉`,
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
              borderRadius:12,color:"#FFFFFF",fontWeight:800,fontSize:14,
              cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:46,
              boxShadow:`0 6px 20px ${K.em}35`}}>
            {isLast?`Commencer ${firstMod?`"${firstMod.titre}"`:""} →`:"Suivant →"}
          </button>
          {!isLast&&<button onClick={()=>onDone()} className="bt"
            style={{background:"none",border:"none",color:K.t3,fontSize:14,
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
    <div style={{fontSize:14,color:K.t2,lineHeight:1.6,maxWidth:280,marginBottom:action?20:0}}>{desc}</div>
    {action&&<button onClick={action} className="bt" style={{
      background:`linear-gradient(135deg,${K.emD},K.em)`,
      border:`1px solid ${K.emBd}`,borderRadius:9,padding:"9px 20px",
      color:K.em,fontWeight:700,fontSize:14,cursor:"pointer",
      fontFamily:"'Outfit',sans-serif"}}>
      {actionLabel}
    </button>}
  </div>;
}

// ── BADGES SYSTÈME ────────────────────────────────────────────────────────────
const BADGES=[
  {id:"first",ico:"rocket",label:"Premier pas",desc:"Premier module complété",col:"#1E4FA3",check:(nd)=>nd>=1},
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
  return <div style={{marginTop:26}}>
    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
      <div className="h-sec" style={{color:K.t1}}>Mes badges</div>
      <span style={{fontSize:13,fontWeight:600,color:K.t3}}>{unlocked.length}/{BADGES.length} débloqués</span>
    </div>
    <div className="tn" style={{gap:10,paddingBottom:6}}>
      {[...unlocked,...locked].map(b=>{
        const earned=b.check(nd,total,sc);
        return <div key={b.id} title={b.desc} style={{flex:"0 0 auto",width:118,textAlign:"center",background:K.card,
          border:`1px solid ${earned?b.col+"40":K.b0}`,borderRadius:18,padding:"14px 10px 12px",
          boxShadow:earned?`0 8px 20px ${b.col}22`:"none",opacity:earned?1:.55,animation:earned?"popIn .35s ease both":"none"}}>
          <div style={{width:52,height:52,margin:"0 auto 9px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            background:earned?`linear-gradient(135deg,${b.col},${b.col}AA)`:K.c2,border:earned?"3px solid #fff":`2px dashed ${K.b1}`,
            boxShadow:earned?`0 0 0 2px ${b.col}55`:"none"}}>
            <i className={`ti ti-${earned?b.ico:"lock"}`} style={{fontSize:23,color:earned?"#fff":K.t3}}/>
          </div>
          <div style={{fontWeight:800,fontSize:13,color:earned?K.t1:K.t3,lineHeight:1.2}}>{b.label}</div>
          <div style={{fontSize:11,color:K.t3,marginTop:3,lineHeight:1.3}}>{b.desc}</div>
        </div>;
      })}
    </div>
  </div>;
}

function ProgressRing({pct,size=80,stroke=7,col,track,txt}){
  const K=useK();
  const r=( size-stroke*2)/2,circ=2*Math.PI*r;
  const offset=circ-(pct/100)*circ;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track||K.b0} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col||K.em} strokeWidth={stroke}
      strokeDasharray={circ} strokeDashoffset={offset}
      strokeLinecap="round" style={{transition:"stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)"}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
      fill={txt||K.t1} fontSize={size*0.22} fontWeight="800" fontFamily="Outfit,sans-serif"
      style={{transform:"rotate(90deg)",transformOrigin:"50% 50%"}}>{pct}%</text>
  </svg>;
}


// ── COMPOSANTS COMMUNS ESPACES FORMATEUR / ADMIN ──────────────────────────────
const ROLE_COL={formateur:["#5B21B6","#8B5CF6"],admin:["#001433","#1E4FA3"]};
function StaffNav({role,nom,onOut,tabs,active,onTab,extra,onProfil}){
  const K=useK();const{mob}=useW();const[c1,c2]=ROLE_COL[role];
  return <nav className="nb" style={{background:`${K.card}f4`,backdropFilter:"blur(18px)",borderBottom:`1px solid ${K.b0}`,position:"sticky",top:0,zIndex:99,boxShadow:"0 4px 18px rgba(0,0,0,.04)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,minHeight:mob?54:60,padding:mob?"6px 12px":"6px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <Logo sm={mob}/>
        {/* Sur téléphone, badge réduit à l'icône : la place sert à la cloche et au profil */}
        <span title={role==="admin"?"Administrateur":"Formateur"} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",borderRadius:99,padding:mob?0:"4px 11px",width:mob?26:"auto",height:mob?26:"auto",fontSize:11,fontWeight:800,letterSpacing:.6,boxShadow:`0 4px 12px ${c2}40`,flexShrink:0}}>
          <i className={`ti ti-${role==="admin"?"shield-check":"school"}`} style={{fontSize:13}}/>{!mob&&(role==="admin"?"ADMIN":"FORMATEUR")}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:mob?6:8,flexShrink:0}}>
        {extra}
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"3px 4px 3px 3px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99}}>
          <div onClick={onProfil} title="Paramètres" className="bt" style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>{(nom||"?")[0].toUpperCase()}</div>
            {!mob&&<span style={{fontSize:13,fontWeight:700,color:K.t2}}>{(nom||"").split(" ")[0]}</span>}
            <i className="ti ti-settings" style={{fontSize:15,color:K.t3}}/>
          </div>
          <button onClick={onOut} className="bt" title="Se déconnecter" style={{display:"flex",alignItems:"center",gap:4,background:K.card,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:99,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
            <i className="ti ti-logout" style={{fontSize:14}}/>{!mob&&"Quitter"}
          </button>
        </div>
      </div>
    </div>
    <div className="tn" style={{gap:6,padding:mob?"0 12px 9px":"0 20px 10px"}}>
      {tabs.map(({k,ico,label,badge,bc})=>{const a=active===k;return <button key={k} onClick={()=>onTab(k)} className="bt" style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:a?800:600,
        background:a?`linear-gradient(135deg,${c1},${c2})`:K.c2,color:a?"#fff":K.t2,border:a?"1px solid transparent":`1px solid ${K.b0}`,boxShadow:a?`0 4px 12px ${c2}40`:"none",flexShrink:0}}>
        <i className={`ti ti-${ico.replace(/^ti-/,"")}`} style={{fontSize:15,color:a?"#fff":K.t3}}/>{label}
        {badge>0&&<span style={{background:a?"rgba(255,255,255,.25)":(bc||K.rd),color:"#fff",borderRadius:99,fontSize:11,fontWeight:800,padding:"0 6px",minWidth:18,textAlign:"center",lineHeight:"17px"}}>{badge}</span>}
      </button>;})}
    </div>
  </nav>;
}
function StaffHero({role,label,title,sub,stats,children}){
  const{mob}=useW();const[c1,c2]=ROLE_COL[role];
  return <div className="card-enter" style={{background:`linear-gradient(135deg,${c1} 0%,${c2} 100%)`,borderRadius:24,padding:mob?"22px 18px":"28px 30px",marginBottom:22,position:"relative",overflow:"hidden",color:"#fff",boxShadow:`0 16px 36px ${c2}35`}}>
    <div style={{position:"absolute",top:-70,right:-50,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
    <div style={{position:"absolute",bottom:-90,right:mob?-40:160,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
    <div style={{position:"absolute",top:mob?16:22,right:mob?16:30,opacity:.12,fontSize:mob?80:110,lineHeight:1,pointerEvents:"none"}}><i className={`ti ti-${role==="admin"?"shield-check":"school"}`}/></div>
    <div style={{position:"relative"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",background:"rgba(255,255,255,.14)",border:"1px solid rgba(255,255,255,.22)",borderRadius:99,padding:"5px 11px",marginBottom:12}}><i className="ti ti-sparkles" style={{fontSize:14}}/>{label}</div>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:mob?26:32,fontWeight:800,marginBottom:6,letterSpacing:"-.4px",lineHeight:1.15}}>{title}</div>
      <div style={{fontSize:mob?15:16,color:"rgba(255,255,255,.86)",marginBottom:stats?18:0,lineHeight:1.55,maxWidth:560}}>{sub}</div>
      {stats&&<div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":`repeat(${stats.length},minmax(0,150px))`,gap:8}}>
        {stats.map(([v,l,ic,on])=><div key={l} onClick={on} className={on?"bt":undefined} style={{background:"rgba(255,255,255,.13)",backdropFilter:"blur(8px)",borderRadius:14,padding:"11px 14px",border:"1px solid rgba(255,255,255,.2)",cursor:on?"pointer":"default"}}>
          <div style={{fontSize:mob?21:24,fontWeight:900,lineHeight:1.1}}>{v}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.8)",marginTop:3,display:"flex",alignItems:"center",gap:4}}><i className={`ti ti-${ic}`} style={{fontSize:13}}/>{l}</div>
        </div>)}
      </div>}
      {children}
    </div>
  </div>;
}
// Tuile d'action : icône en dégradé, titre, description, pastille facultative
function ActionTile({ico,col,label,desc,badge,on,i=0,compact}){
  const K=useK();const{mob}=useW();
  if(compact)return <div onClick={on} className="tile" style={{padding:"14px 6px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:8,animation:`slideUp .4s cubic-bezier(.22,1,.36,1) ${i*25}ms both`}}>
    {!!badge&&<span style={{position:"absolute",top:7,right:7,background:col,color:"#fff",borderRadius:99,fontSize:11,fontWeight:800,padding:"1px 6px",minWidth:18,textAlign:"center"}}>{badge}</span>}
    <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${col},${col}B0)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 14px ${col}40`}}><i className={`ti ti-${ico}`} style={{fontSize:21,color:"#fff"}}/></div>
    <div style={{fontWeight:700,fontSize:12.5,color:K.t1,lineHeight:1.2}}>{label}</div>
  </div>;
  return <div onClick={on} className="tile" style={{padding:mob?"15px 14px":"18px 18px",display:"flex",flexDirection:"column",minHeight:desc?(mob?132:146):(mob?108:118),animation:`slideUp .4s cubic-bezier(.22,1,.36,1) ${i*35}ms both`}}>
    <div style={{position:"absolute",top:-34,right:-34,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle,${col}22,transparent 70%)`}}/>
    {!!badge&&<span style={{position:"absolute",top:12,right:12,background:col,color:"#fff",borderRadius:99,fontSize:12,fontWeight:800,padding:"2px 8px",minWidth:22,textAlign:"center",boxShadow:`0 4px 10px ${col}50`}}>{badge}</span>}
    <div style={{width:mob?44:48,height:mob?44:48,borderRadius:14,background:`linear-gradient(135deg,${col},${col}B0)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,boxShadow:`0 8px 18px ${col}40`,position:"relative"}}><i className={`ti ti-${ico}`} style={{fontSize:mob?22:24,color:"#fff"}}/></div>
    <div style={{fontWeight:800,fontSize:mob?15:16,color:K.t1,marginBottom:desc?4:0,letterSpacing:"-.2px",lineHeight:1.25}}>{label}</div>
    {desc&&<div style={{fontSize:13,color:K.t2,lineHeight:1.45,flex:1}}>{desc}</div>}
  </div>;
}

// ── PARAMÈTRES PERSONNELS ─────────────────────────────────────────────────────
// Préférences enregistrées dans users/{uid}.preferences : { delaiDeco, taille, notifEmails }
// Réglages de l'administrateur dans config/securite : { delaiMax, delaiAdmin }
const DELAIS=[10,20,30,60];
const TAILLES=[["normale","Normale",1],["grande","Grande",1.12],["tres","Très grande",1.25]];
const appliquerTaille=t=>{const z=(TAILLES.find(x=>x[0]===t)||TAILLES[0])[2];try{document.body.style.zoom=z===1?"":String(z);localStorage.setItem("ec_taille",t||"normale");}catch(e){}};
try{appliquerTaille(localStorage.getItem("ec_taille")||"normale");}catch(e){}
function useConfigSecurite(){
  const[c,sC]=useState({});
  useEffect(()=>onSnapshot(doc(db,"config","securite"),s=>sC(s.exists()?s.data():{}),()=>{}),[]);
  return c;
}
// Délai de déconnexion effectif d'un compte (minutes), plafonné par l'administrateur
const delaiCompte=(prefs,cfg)=>Math.min(prefs?.delaiDeco||20,cfg?.delaiMax||60);

function ParamCarte({ico,col,titre,sous,children}){
  const K=useK();const{mob}=useW();
  return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:18,padding:mob?"16px 14px":"20px 22px",marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:sous?4:14}}>
      <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${col},${col}B0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${ico}`} style={{fontSize:20,color:"#fff"}}/></div>
      <div style={{fontWeight:800,fontSize:17,color:K.t1}}>{titre}</div>
    </div>
    {sous&&<div style={{fontSize:13.5,color:K.t2,marginBottom:14,marginLeft:52,lineHeight:1.5}}>{sous}</div>}
    {children}
  </div>;
}
function Choix({options,val,on,col}){
  const K=useK();
  return <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{options.map(([v,l,dis])=>{const a=val===v;return <button key={v} onClick={()=>!dis&&on(v)} disabled={dis} className="bt" style={{padding:"9px 15px",borderRadius:12,border:`1.5px solid ${a?(col||K.em):K.b1}`,background:a?(col||K.em):K.c2,color:a?"#fff":dis?K.t3:K.t1,fontWeight:800,fontSize:14,cursor:dis?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",opacity:dis?.5:1}}>{l}</button>;})}</div>;
}
// Notifications push sur l'appareil courant (Firebase Cloud Messaging)
function ReglagePush({uid,role}){
  const K=useK();const[actif,sActif]=useState(pushActif()),[busy,sBusy]=useState(false),[err,sErr]=useState("");
  if(!pushPossible())return <div style={{fontSize:13,color:K.t3,padding:"10px 0",lineHeight:1.5}}><i className="ti ti-device-mobile-off" style={{marginRight:5}}/>Notifications sur téléphone indisponibles dans ce navigateur. Sur iPhone, installez d'abord l'application sur l'écran d'accueil (Safari → Partager → « Sur l'écran d'accueil »).</div>;
  const basculer=async v=>{sBusy(true);sErr("");try{if(v)await activerPush(db,uid,role);else await desactiverPush(db);sActif(v);}catch(e){sErr(e.message);}sBusy(false);};
  return <div style={{opacity:busy?.6:1}}>
    <Interrupteur on={actif} set={v=>!busy&&basculer(v)} lib="Notifications sur ce téléphone" sous={busy?"Activation…":"Alertes même application fermée : nouveaux modules, messages, corrections, accès."}/>
    {err&&<div style={{fontSize:12.5,color:K.er,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:9,padding:"8px 11px",marginTop:4}}>{err}</div>}
  </div>;
}
function Interrupteur({on,set,lib,sous}){
  const K=useK();
  return <div onClick={()=>set(!on)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"10px 0"}}>
    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14.5,color:K.t1}}>{lib}</div>{sous&&<div style={{fontSize:13,color:K.t3,marginTop:2,lineHeight:1.45}}>{sous}</div>}</div>
    <div style={{width:48,height:28,borderRadius:99,background:on?K.em:K.b1,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:on?23:3,width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 2px 6px rgba(0,0,0,.25)",transition:"left .2s"}}/></div>
  </div>;
}
function ChoixTheme(){
  const K=useK();const{tid,setT}=useContext(Ctx);
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:9}}>
    {Object.entries(TH).map(([id,t])=>{const sel=tid===id;return <button key={id} onClick={()=>setT(id)} className="bt" style={{background:t.bg,border:`2px solid ${sel?K.em:t.b1}`,borderRadius:14,padding:"12px 6px 10px",cursor:"pointer",textAlign:"center",position:"relative"}}>
      {sel&&<span style={{position:"absolute",top:4,right:7,fontSize:12,color:K.em,fontWeight:900}}>✓</span>}
      <div style={{fontSize:20,marginBottom:4}}>{t.i}</div><div style={{fontSize:12.5,fontWeight:800,color:t.t1}}>{t.n}</div>
    </button>;})}
  </div>;
}
function ChoixTaille({val,on}){return <Choix options={TAILLES.map(([v,l])=>[v,l])} val={val} on={v=>{appliquerTaille(v);on(v);}}/>;}

function ParametresPage({role,uid,data,onOut,onGo}){
  const K=useK();const{mob}=useW();
  const cfg=useConfigSecurite();
  const prefs=data?.preferences||{};
  const[f,sF]=useState({nom:data?.nom||"",tel:data?.tel||"",province:data?.province||"",ville:data?.ville||""});
  const[msg,sMsg]=useState({t:"",m:""});
  const[pw,sPw]=useState({a:"",n:"",c:""}),[pwBusy,sPwBusy]=useState(false),[pwMsg,sPwMsg]=useState({t:"",m:""});
  const[recents,sRecents]=useState([]);
  const[supp,sSupp]=useState(false);
  const user=auth.currentUser;
  const motDePasse=(user?.providerData||[]).some(p=>p.providerId==="password");
  const fournisseur=(user?.providerData||[]).map(p=>p.providerId==="google.com"?"Google":p.providerId==="facebook.com"?"Facebook":"E-mail et mot de passe").join(", ");
  useEffect(()=>{getDoc(doc(db,"activite",uid)).then(s=>sRecents(s.exists()?(s.data().recents||[]):[])).catch(()=>{});},[uid]);
  const flash=(t,m)=>{sMsg({t,m});setTimeout(()=>sMsg({t:"",m:""}),3500);};
  const majPrefs=async p=>{try{await updateDoc(doc(db,"users",uid),{preferences:{...prefs,...p}});flash("o","Préférence enregistrée.");}catch(e){flash("e","Enregistrement impossible : "+e.message);}};
  const enrProfil=async()=>{
    if(!f.nom.trim())return flash("e","Le nom ne peut pas être vide.");
    try{await updateDoc(doc(db,"users",uid),{nom:f.nom.trim(),tel:f.tel.trim(),province:f.province,ville:f.ville.trim()});flash("o","Profil enregistré.");}
    catch(e){flash("e","Enregistrement impossible : "+e.message);}
  };
  const changerMdp=async()=>{
    sPwMsg({t:"",m:""});
    if(pw.n.length<6)return sPwMsg({t:"e",m:"Le nouveau mot de passe doit contenir au moins 6 caractères."});
    if(pw.n!==pw.c)return sPwMsg({t:"e",m:"La confirmation ne correspond pas."});
    sPwBusy(true);
    try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,pw.a));await updatePassword(user,pw.n);sPw({a:"",n:"",c:""});sPwMsg({t:"o",m:"Mot de passe modifié."});}
    catch(e){sPwMsg({t:"e",m:e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Mot de passe actuel incorrect.":e.code==="auth/too-many-requests"?"Trop de tentatives. Réessayez plus tard.":"Modification impossible : "+e.message});}
    sPwBusy(false);
  };
  const telecharger=()=>{
    const {activationCode,formateurCode,...rest}=data||{};
    const contenu={exporteLe:new Date().toISOString(),compte:{uid,email:user?.email||data?.mail,connexion:fournisseur},profil:rest,dernieresConnexions:recents.map(r=>({date:new Date(r.t).toISOString(),appareil:r.appareil}))};
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(contenu,null,2)],{type:"application/json"}));a.download=`mes-donnees-eco-campus_${new Date().toISOString().slice(0,10)}.json`;a.click();
  };
  const demanderSuppression=async()=>{
    try{await saveDemande({nom:data?.nom||"",email:user?.email||data?.mail||"",tel:data?.tel||"",service:"Suppression de compte",message:`Je demande la suppression de mon compte Éco-Campus RDC et de mes données (compte ${role}, identifiant ${uid}).`,type:"suppression",uid});
      sSupp(false);flash("o","Demande envoyée. L'équipe Éco-Campus supprimera votre compte et vous confirmera par e-mail.");}
    catch(e){flash("e","Envoi impossible : "+e.message);}
  };
  const delai=delaiCompte(prefs,cfg),max=cfg.delaiMax||60;
  const champ={width:"100%",padding:"11px 14px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:12,color:K.t1,fontSize:15,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",minHeight:46};
  const lab=t=><div style={{color:K.t1,fontSize:13.5,fontWeight:700,marginBottom:6}}>{t}</div>;
  return <div style={{maxWidth:760,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,flexWrap:"wrap"}}>
      <div style={{width:58,height:58,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:22,flexShrink:0}}>{(data?.nom||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div>
      <div style={{flex:"1 1 160px",minWidth:0}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:mob?24:28,color:K.t1,lineHeight:1.15}}>Paramètres</div>
        <div style={{fontSize:14,color:K.t2,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data?.nom} · {role==="formateur"?"Formateur":"Apprenant"}</div>
      </div>
      <Btn ch={<><i className="ti ti-logout" style={{fontSize:16}}/>Se déconnecter</>} on={onOut} v="d" sm/>
    </div>
    {msg.m&&<div style={{position:"sticky",top:mob?60:112,zIndex:5}}><Pop t={msg.t} m={msg.m}/></div>}

    <ParamCarte ico="user-circle" col="#1E4FA3" titre="Mon profil">
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
        <div>{lab("Nom complet")}<input value={f.nom} onChange={e=>sF({...f,nom:e.target.value})} style={champ}/></div>
        <div>{lab("E-mail")}<input value={user?.email||data?.mail||""} disabled style={{...champ,opacity:.65}}/></div>
        <div>{lab("Téléphone")}<input value={f.tel} onChange={e=>sF({...f,tel:e.target.value})} placeholder="+243 …" inputMode="tel" style={champ}/></div>
        <div>{lab("Province")}<select value={f.province} onChange={e=>sF({...f,province:e.target.value})} style={champ}><option value="">—</option>{PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
        <div>{lab("Ville")}<input value={f.ville} onChange={e=>sF({...f,ville:e.target.value})} placeholder="Kinshasa, Lubumbashi…" style={champ}/></div>
      </div>
      <div style={{marginTop:14}}><Btn ch="Enregistrer le profil" on={enrProfil}/></div>
    </ParamCarte>

    <ParamCarte ico="clock-shield" col="#A3122A" titre="Déconnexion automatique" sous={`Tant que l'application est affichée, elle reste ouverte. Fermée ou mise de côté, elle vous déconnecte après ${delai} minutes.`}>
      <Choix options={DELAIS.map(m=>[m,`${m} min`,m>max])} val={delai} on={m=>majPrefs({delaiDeco:m})} col="#A3122A"/>
      {max<60&&<div style={{fontSize:12.5,color:K.t3,marginTop:8}}>Délai maximum autorisé par l'administrateur : {max} minutes.</div>}
    </ParamCarte>

    <ParamCarte ico="lock" col="#0A2A5C" titre="Sécurité">
      <div style={{fontSize:14,color:K.t2,marginBottom:12}}>Mode de connexion : <b style={{color:K.t1}}>{fournisseur||"—"}</b></div>
      {motDePasse?<>
        <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:10}}>Changer de mot de passe</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10}}>
          <input type="password" value={pw.a} onChange={e=>sPw({...pw,a:e.target.value})} placeholder="Mot de passe actuel" autoComplete="current-password" style={champ}/>
          <input type="password" value={pw.n} onChange={e=>sPw({...pw,n:e.target.value})} placeholder="Nouveau (6 car. min.)" autoComplete="new-password" style={champ}/>
          <input type="password" value={pw.c} onChange={e=>sPw({...pw,c:e.target.value})} placeholder="Confirmer" autoComplete="new-password" style={champ}/>
        </div>
        <div style={{marginTop:10}}><Pop t={pwMsg.t} m={pwMsg.m}/><Btn ch={pwBusy?"Modification…":"Modifier le mot de passe"} on={changerMdp} dis={pwBusy||!pw.a||!pw.n} v="s"/></div>
      </>:<div style={{fontSize:13.5,color:K.t3}}>Vous vous connectez avec {fournisseur} : le mot de passe se gère depuis ce compte.</div>}
      <div style={{fontWeight:800,fontSize:14.5,color:K.t1,margin:"18px 0 8px"}}>Mes dernières connexions</div>
      {!recents.length&&<div style={{fontSize:13.5,color:K.t3}}>Les prochaines connexions s'afficheront ici.</div>}
      {recents.map((r,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i?`1px solid ${K.b0}`:"none"}}>
        <i className={`ti ti-${r.appareil?.type==="Mobile"?"device-mobile":"device-desktop"}`} style={{fontSize:18,color:K.t2}}/>
        <span style={{flex:1,fontSize:14,color:K.t1}}>{new Date(r.t).toLocaleString("fr-FR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
        <span style={{fontSize:13,color:K.t3}}>{r.appareil?.os} · {r.appareil?.app==="Application"?"Application":r.appareil?.nav}</span>
      </div>)}
      <div style={{fontSize:12.5,color:K.t3,marginTop:8}}>Une connexion que vous ne reconnaissez pas ? Changez votre mot de passe et prévenez l'équipe Éco-Campus.</div>
    </ParamCarte>

    <ParamCarte ico="palette" col="#7C3AED" titre="Apparence">
      {lab("Thème")}<ChoixTheme/>
      <div style={{height:16}}/>
      {lab("Taille du texte")}<ChoixTaille val={prefs.taille||"normale"} on={v=>majPrefs({taille:v})}/>
    </ParamCarte>

    <ParamCarte ico="bell" col="#C98A1B" titre="Notifications">
      <ReglagePush uid={uid} role={role}/>
      {role==="apprenant"&&<ReglageMarketing Interrupteur={Interrupteur}/>}
      <Interrupteur on={prefs.notifEmails!==false} set={v=>majPrefs({notifEmails:v})} lib="Copie par e-mail" sous="Messages de l'équipe, corrections et réponses à vos suggestions. Les e-mails importants (code d'accès, sécurité du compte) sont toujours envoyés."/>
    </ParamCarte>

    <ParamCarte ico="info-circle" col="#4A5B78" titre="Aide et informations">
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <Btn ch={<><i className="ti ti-bulb" style={{fontSize:16}}/>Boîte à suggestions</>} on={()=>onGo&&onGo("sugg")} v="s"/>
        <Btn ch={<><i className="ti ti-info-circle" style={{fontSize:16}}/>À propos d'Éco-Campus</>} on={()=>onGo&&onGo("apropos")} v="s"/>
      </div>
    </ParamCarte>

    <ParamCarte ico="database" col="#0D7A6B" titre="Mes données" sous="Vos données vous appartiennent : vous pouvez les télécharger ou demander la suppression de votre compte.">
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <Btn ch={<><i className="ti ti-download" style={{fontSize:16}}/>Télécharger mes données</>} on={telecharger} v="s"/>
        <Btn ch={<><i className="ti ti-user-x" style={{fontSize:16}}/>Demander la suppression du compte</>} on={()=>sSupp(true)} v="d"/>
      </div>
      <div style={{fontSize:12.5,color:K.t3,marginTop:10}}>Voir aussi la <a href="/confidentialite.html" target="_blank" rel="noreferrer" style={{color:K.in_,fontWeight:700}}>politique de confidentialité</a>.</div>
    </ParamCarte>

    {supp&&<Sheet title="Supprimer mon compte ?" onClose={()=>sSupp(false)} w={420}>
      <div style={{fontSize:14.5,color:K.t2,lineHeight:1.6,marginBottom:16}}>Votre demande sera transmise à l'équipe Éco-Campus. Votre compte, votre progression, vos scores et vos dossiers seront supprimés définitivement. Pensez à télécharger vos données avant.</div>
      <div style={{display:"flex",gap:8}}><Btn ch="Annuler" on={()=>sSupp(false)} v="g" full/><Btn ch="Envoyer la demande" on={demanderSuppression} v="d" full/></div>
    </Sheet>}
  </div>;
}

// Paramètres de l'administrateur : sécurité de tous les comptes et préférences locales
function ParametresAdmin({onOut}){
  const K=useK();const{mob}=useW();
  const cfg=useConfigSecurite();
  const[taille,sTaille]=useState(()=>{try{return localStorage.getItem("ec_taille")||"normale";}catch(e){return"normale";}});
  const[msg,sMsg]=useState("");
  const maj=async p=>{try{await setDoc(doc(db,"config","securite"),p,{merge:true});sMsg("Réglage enregistré.");}catch(e){sMsg("Enregistrement impossible : "+e.message);}setTimeout(()=>sMsg(""),3000);};
  return <div style={{maxWidth:760,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,flexWrap:"wrap"}}>
      <div style={{flex:"1 1 200px",minWidth:0}}><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:mob?24:28,color:K.t1}}>Paramètres</div><div style={{fontSize:14,color:K.t2,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Administrateur · {ADM_EMAIL}</div></div>
      <Btn ch={<><i className="ti ti-logout" style={{fontSize:16}}/>Se déconnecter</>} on={onOut} v="d" sm/>
    </div>
    {msg&&<Pop t={msg.startsWith("Enregistrement impossible")?"e":"o"} m={msg}/>}
    <ParamCarte ico="shield-lock" col="#A3122A" titre="Déconnexion automatique des utilisateurs" sous="Délai maximum que les apprenants et formateurs peuvent choisir dans leurs paramètres (20 min par défaut pour chacun).">
      <Choix options={DELAIS.map(m=>[m,`${m} min`])} val={cfg.delaiMax||60} on={m=>maj({delaiMax:m})} col="#A3122A"/>
    </ParamCarte>
    <ParamCarte ico="clock-shield" col="#0A2A5C" titre="Ma déconnexion automatique" sous="Délai appliqué au compte administrateur lorsque l'application est fermée ou mise de côté.">
      <Choix options={DELAIS.map(m=>[m,`${m} min`])} val={cfg.delaiAdmin||20} on={m=>maj({delaiAdmin:m})}/>
    </ParamCarte>
    <ParamCarte ico="bell" col="#C98A1B" titre="Notifications sur ce téléphone" sous="Recevez les nouvelles suggestions et les messages des apprenants, même application fermée.">
      <ReglagePush uid={auth.currentUser?.uid} role="admin"/>
    </ParamCarte>
    <ParamCarte ico="palette" col="#7C3AED" titre="Apparence">
      <div style={{color:K.t1,fontSize:13.5,fontWeight:700,marginBottom:6}}>Thème</div><ChoixTheme/>
      <div style={{height:16}}/>
      <div style={{color:K.t1,fontSize:13.5,fontWeight:700,marginBottom:6}}>Taille du texte</div><ChoixTaille val={taille} on={sTaille}/>
    </ParamCarte>
  </div>;
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

  const cfgSecF=useConfigSecurite();
  const{warning:faWarn}=useAutoLogout(onOut,delaiCompte(fData?.preferences,cfgSecF));
  useEffect(()=>{if(fData?.preferences?.taille)appliquerTaille(fData.preferences.taille);},[fData?.preferences?.taille]);
  useEffect(()=>{if(fData)inscrireAnnuaire(db,{uid,nom:fData.nom,mail:auth.currentUser?.email||fData.mail});},[uid,fData?.nom,fData?.mail]);
  const myOpenAnswersFA=useFormateurOpenAnswers(uid);
  const myMsgsFA=useFormateurMessages(uid);
  const unreadMsgFA=myMsgsFA.filter(m=>m.fromRole==="apprenant"&&!m.luAdmin).length;

  usePresence({uid,nom:fData?.nom,mail:auth.currentUser?.email||fData?.mail,role:"formateur",vue:VUE_LBL[vue]||vue});
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
    alerterAdmin(coll,id);
    toast("o","Soumis pour validation : l'administrateur est prévenu.");sSav(false);
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
    {k:"ef",ico:"report-money",label:"États financiers"},
    {k:"fisc",ico:"receipt-tax",label:"Code des impôts"},
    {k:"fin",ico:"chart-pie",label:"Finance"},
    {k:"sugg",ico:"bulb",label:"Suggestions"},
    {k:"apropos",ico:"info-circle",label:"À propos"},
  ];
  const ALLER_FA={msg:"fmsg",videos:"vids"};
  const allerFA=v=>sV(NAV.some(n=>n.k===v)||v==="param"?v:ALLER_FA[v]||"home");

  const W=ch=><div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}>
    <style>{mCss(K)}</style>
    <AutoLogoutBanner warning={faWarn} mob={mob}/>
    <StaffNav role="formateur" nom={fData.nom} onOut={onOut} tabs={NAV} active={vue} onTab={sV} onProfil={()=>sV("param")} extra={<Cloche K={K} db={db} uid={uid} role="formateur" user={fData} mob={mob} onGo={allerFA}/>}/>
    <main style={{maxWidth:1060,margin:"0 auto",padding:mob?"18px 14px 80px":"24px 24px 40px"}}>
      {msg.m&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,borderRadius:9,padding:"9px 14px",marginBottom:12,fontSize:14,color:msg.t==="o"?K.em:K.er,display:"flex",gap:7}}><i className={`ti ti-${msg.t==="o"?"check":"alert-triangle"}`} style={{fontSize:14}}/>{msg.m}</div>}
      {ch}
    </main>
  </div>;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if(vue==="home")return W(<div style={{animation:"fadeIn .35s ease"}}>
    <StaffHero role="formateur" label="Espace formateur" title={<>Bonjour, {(fData.nom||"").split(" ")[0]} 👋</>}
      sub="Créez du contenu de qualité pour vos apprenants et suivez leur progression."
      stats={[[`${myMods.length}`,"Modules créés","book-2",()=>sV("mods")],[`${myVids.length}`,"Vidéos","video",()=>sV("vids")],[`${myLearners.length}`,"Apprenants","users",()=>sV("stats")],[`${avgScore}%`,"Score moyen","chart-line",()=>sV("stats")]]}/>

    <div className="h-sec" style={{color:K.t1,marginBottom:12}}>Actions rapides</div>
    <div className="gq" style={{marginBottom:24}}>
      {[
        {ico:"book-upload",col:"#7C3AED",label:"Créer un module",desc:"Contenu, QCM et exercice corrigé",on:()=>sV("mods")},
        {ico:"video-plus",col:"#2563EB",label:"Ajouter une vidéo",desc:"Lien YouTube ou URL directe",on:()=>sV("vids")},
        {ico:"presentation",col:"#D97706",label:"Mes slides",desc:`${myPres.length} présentation${myPres.length>1?"s":""}`,on:()=>sV("pres")},
        {ico:"checkbox",col:"#DC2626",label:"Corrections",desc:nUngraded?`${nUngraded} copie${nUngraded>1?"s":""} à corriger`:"Aucune copie en attente",badge:nUngraded,on:()=>sV("corr")},
        {ico:"message-circle",col:"#0D7A6B",label:"Messages",desc:unreadMsgFA?`${unreadMsgFA} non lu${unreadMsgFA>1?"s":""}`:"Échanges avec vos apprenants",badge:unreadMsgFA,on:()=>sV("fmsg")},
        {ico:"report-money",col:"#1D4ED8",label:"États financiers",desc:"Atelier SYSCOHADA et suivi des dossiers",on:()=>sV("ef")},
        {ico:"receipt-tax",col:"#A3122A",label:"Code des impôts",desc:"15 modules : fiscalité, TVA, paie, facture normalisée, IRPP et IS 2026",on:()=>sV("fisc")},
        {ico:"chart-pie",col:"#B7791F",label:"Finance d'entreprise",desc:"7 modules, 16 cas corrigés et cours audio",on:()=>sV("fin")},
      ].map((t,i)=><ActionTile key={t.label} {...t} i={i}/>)}
    </div>

    {/* Modules récents */}
    {myMods.length>0&&<>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12}}>
        <div className="h-sec" style={{color:K.t1}}>Mes derniers modules</div>
        <button onClick={()=>sV("mods")} className="bt" style={{background:"none",border:"none",color:"#7C3AED",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Tout voir →</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {myMods.slice(0,4).map(m=>{
          const statusCol={pending:"#D97706",approved:"#0A2A5C",rejected:"#DC2626"}[m.status]||K.t3;
          const statusLbl={pending:"En attente",approved:"Publié",rejected:"Rejeté"}[m.status]||"Brouillon";
          return <div key={m.id} onClick={()=>sV("mods")} className="tile" style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:13,borderLeft:`4px solid ${statusCol}`}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${statusCol}16`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className="ti ti-book-2" style={{fontSize:19,color:statusCol}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:15,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>
              <div style={{fontSize:13,color:K.t3,marginTop:2}}>{m.mat?`${m.mat} · `:""}{m.q?.length||0} questions</div>
            </div>
            <div style={{background:`${statusCol}16`,border:`1px solid ${statusCol}35`,borderRadius:99,padding:"3px 11px",fontSize:12,fontWeight:800,color:statusCol,flexShrink:0}}>{statusLbl}</div>
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
  if(vue==="param")return W(<ParametresPage role="formateur" uid={uid} data={fData} onOut={onOut} onGo={sV}/>);
  if(vue==="ef")return W(<EtatsFinanciers db={db} K={K} mob={mob} me={{uid,nom:fData.nom,mail:fData.mail,role:"formateur"}}/>);
  if(vue==="fisc")return W(<CodeImpots K={K} mob={mob} db={db} uid={uid} scores={fData.scores||{}} ok/>);
  if(vue==="fin")return W(<FinanceEntreprise K={K} mob={mob} db={db} uid={uid} scores={fData.scores||{}} ok/>);
  if(vue==="sugg")return W(<Suggestions K={K} mob={mob} db={db} me={{uid,nom:fData.nom,mail:fData.mail,role:"formateur"}}/>);
  if(vue==="apropos")return W(<Apropos K={K} mob={mob} onGo={sV}/>);

  return W(<div/>);
}

// ── MODULES FORMATEUR ─────────────────────────────────────────────────────────
function FAModules({uid,mods,onSubmit,saving,toast}){
  const K=useK();const{mob}=useW();
  const[creating,setCreating]=useState(false);
  const[form,setForm]=useState({titre:"",mat:"",desc:"",ico:"book-2",col:"#1E4FA3"});
  const[evalType,setEvalType]=useState("qcm");
  const[questions,setQuestions]=useState([{q:"",opts:["","","",""],ans:0}]);
  const[openQuestions,setOpenQuestions]=useState([{q:"",points:10}]);
  const[savingNew,setSavingNew]=useState(false);
  const[slideFile,setSlideFile]=useState(null),[slideLien,setSlideLien]=useState("");
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
    if(!slideFile&&slideLien.trim()&&!lienValide(slideLien))return toast("e","Lien des slides invalide : collez un lien complet commençant par https://");
    setSavingNew(true);
    try{
      const id="M"+Date.now();
      let slideUrl=slideFile?"":slideLien.trim();
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
      setCreating(false);setForm({titre:"",mat:"",desc:"",ico:"book-2",col:"#1E4FA3"});
      setQuestions([{q:"",opts:["","","",""],ans:0}]);setOpenQuestions([{q:"",points:10}]);setEvalType("qcm");setSlideFile(null);setSlideLien("");
    }catch(e){toast("e",slideFile?`Échec de l'envoi des slides : ${msgStorage(e)}`:e.message);setSlideUploading(false);}
    setSavingNew(false);
  };

  if(creating)return <div style={{animation:"fadeIn .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button onClick={()=>setCreating(false)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
        <i className="ti ti-arrow-left" style={{fontSize:14}}/>Retour
      </button>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Nouveau module</div>
    </div>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:12}}>Informations</div>
      {[["Titre du module","titre","Fondements SYSCOHADA..."],["Matière","mat","SYSCOHADA Révisé"],["Description courte","desc","Aperçu du module..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            placeholder={ph} style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
    </div>
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:12}}>Type d'encadrement</div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:2}}>
        {[["none","Sans évaluation","circle-off"],["qcm","QCM","list-check"],["open","Questions ouvertes","message-2"]].map(([v,lb,ic])=>
          <button key={v} onClick={()=>setEvalType(v)} className="bt" style={{flex:"1 1 100px",padding:"10px 8px",borderRadius:9,background:evalType===v?"#8B5CF618":K.bg,border:`1.5px solid ${evalType===v?"#8B5CF6":K.b0}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <i className={`ti ti-${ic}`} style={{fontSize:16,color:evalType===v?"#8B5CF6":K.t3}}/>
            <span style={{fontSize:12,fontWeight:700,color:evalType===v?"#8B5CF6":K.t2,textAlign:"center"}}>{lb}</span>
          </button>
        )}
      </div>
    </div>
    {evalType==="qcm"&&<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,color:K.t1}}>Questions QCM ({questions.length})</div>
        <button onClick={addQ} className="bt" style={{background:"#8B5CF618",border:"1px solid #8B5CF630",color:"#8B5CF6",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-plus" style={{fontSize:13}}/>Question
        </button>
      </div>
      {questions.map((qu,i)=><div key={i} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px",marginBottom:10}}>
        <div style={{fontSize:12,color:K.t3,marginBottom:5,fontWeight:600}}>Question {i+1}</div>
        <input value={qu.q} onChange={e=>updQ(i,"q",e.target.value)} placeholder="Énoncé de la question..."
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"8px 10px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",marginBottom:8,boxSizing:"border-box"}}/>
        {qu.opts.map((o,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div onClick={()=>updQ(i,"ans",j)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${qu.ans===j?"#1E4FA3":K.b1}`,background:qu.ans===j?"#1E4FA3":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {qu.ans===j&&<i className="ti ti-check" style={{fontSize:11,color:"#fff"}}/>}
          </div>
          <input value={o} onChange={e=>updOpt(i,j,e.target.value)} placeholder={`Option ${j+1}${j===0?" (correcte si cochée)":""}`}
            style={{flex:1,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"7px 9px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif"}}/>
        </div>)}
      </div>)}
    </div>}
    {evalType==="open"&&<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,color:K.t1}}>Questions ouvertes ({openQuestions.length})</div>
        <button onClick={addOQ} className="bt" style={{background:"#8B5CF618",border:"1px solid #8B5CF630",color:"#8B5CF6",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-plus" style={{fontSize:13}}/>Question
        </button>
      </div>
      <div style={{fontSize:12,color:K.t3,marginBottom:12}}>Réponse libre de l'apprenant. Vous noterez chaque réponse manuellement — le score final sera calculé automatiquement.</div>
      {openQuestions.map((oq,i)=><div key={i} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px",marginBottom:10,display:"flex",gap:8,alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:12,color:K.t3,marginBottom:5,fontWeight:600}}>Question {i+1}</div>
          <textarea value={oq.q} onChange={e=>updOQ(i,"q",e.target.value)} placeholder="Énoncé de la question ouverte..." rows={2}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"8px 10px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",marginBottom:6,boxSizing:"border-box",resize:"vertical"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,color:K.t3}}>Points :</span>
            <input type="number" min="1" value={oq.points} onChange={e=>updOQ(i,"points",e.target.value)}
              style={{width:60,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:6,padding:"5px 7px",color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif"}}/>
          </div>
        </div>
        {openQuestions.length>1&&<button onClick={()=>rmOQ(i)} className="bt" style={{background:"none",border:"none",color:K.er,cursor:"pointer",fontSize:16,padding:2,flexShrink:0}}>✕</button>}
      </div>)}
    </div>}
    {/* Upload slides */}
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-file-text" style={{fontSize:14,color:"#F59E0B"}}/>Slides PDF (optionnel)
      </div>
      <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"18px",border:`2px dashed ${slideFile?"#1E4FA3":K.b1}`,borderRadius:10,cursor:"pointer",background:slideFile?"#1E4FA308":K.bg,transition:"all .2s"}}>
        <input type="file" accept=".pdf,application/pdf" style={{display:"none"}} onChange={e=>{setSlideFile(e.target.files[0]||null);setSlideLien("");}}/>
        <i className={`ti ti-${slideFile?"circle-check":"upload"}`} style={{fontSize:28,color:slideFile?"#1E4FA3":K.t3}}/>
        <div style={{fontSize:14,fontWeight:600,color:slideFile?"#1E4FA3":K.t2}}>{slideFile?slideFile.name:"Cliquez pour choisir un PDF"}</div>
        <div style={{fontSize:12,color:K.t3}}>PDF uniquement · Max 10 MB</div>
      </label>
      {slideFile&&<button onClick={()=>setSlideFile(null)} className="bt"
        style={{marginTop:8,background:"none",border:"none",color:K.er,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
        <i className="ti ti-x" style={{fontSize:13}}/>Supprimer
      </button>}
      {!slideFile&&<ChampLien K={K} val={slideLien} onChange={setSlideLien} lb="ou collez un lien Google Drive / Google Slides"/>}
    </div>
    <button onClick={saveModule} disabled={savingNew||slideUploading} className="bt"
      style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,#7C3AED,#8B5CF6)`,border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
      {slideUploading?"Upload PDF...":savingNew?"Enregistrement...":"💾 Enregistrer le module"}
    </button>
  </div>;

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Mes modules ({mods.length})</div>
      <button onClick={()=>setCreating(true)} className="bt" style={{background:`linear-gradient(135deg,#7C3AED,#8B5CF6)`,border:"none",color:"#fff",borderRadius:12,padding:"10px 16px",boxShadow:"0 6px 16px #8B5CF640",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
        <i className="ti ti-plus" style={{fontSize:14}}/>Nouveau module
      </button>
    </div>
    {!mods.length&&<EmptyState ico="book-2" title="Aucun module créé" desc="Créez votre premier module SYSCOHADA avec QCM intégré."/>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {mods.map(m=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publié",rejected:"Rejeté"}[m.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#1E4FA3",rejected:"#EF4444"}[m.status||"draft"];
        return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"14px 16px",borderLeft:`4px solid ${cc}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${m.col||"#7C3AED"},${m.col||"#7C3AED"}B0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icoEl(m.ico||"book-2","#fff",20)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:15.5,color:K.t1,marginBottom:3}}>{m.titre}</div>
              <div style={{fontSize:13,color:K.t3}}>{m.mat||"SYSCOHADA"} · {m.evalType==="open"?`${m.openQ?.length||0} question(s) ouverte(s)`:m.evalType==="none"?"Sans évaluation":`${m.q?.length||0} questions QCM`}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              <span style={{background:`${cc}16`,border:`1px solid ${cc}35`,borderRadius:99,padding:"3px 11px",fontSize:12.5,fontWeight:800,color:cc}}>{sc}</span>
              {(m.status==="draft"||m.status==="rejected")&&
                <button onClick={()=>onSubmit("mod",m.id)} disabled={saving} className="bt"
                  style={{background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",border:"none",color:"#fff",borderRadius:10,padding:"7px 13px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:5}}>
                  <i className="ti ti-send" style={{fontSize:14}}/>Soumettre
                </button>
              }
              {m.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${m.titre}" ?`))deleteModule(m.id);}} className="bt"
                style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <i className="ti ti-trash" style={{fontSize:13}}/>
              </button>}
            </div>
          </div>
          {m.status==="rejected"&&m.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:13,marginRight:5}}/>{m.rejectReason}</div>}
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
        status:"pending",submittedBy:uid,submittedAt:new Date().toISOString(),on:false,createdBy:uid,createdAt:new Date().toISOString(),gr:true,ordre:Date.now()
      });
      alerterAdmin("presentations",id);
      toast("o","Slide envoyée pour validation : l'administrateur est prévenu.");
      setForm({titre:"",url:"",desc:"",mat:""});
    }catch(e){toast("e",e.message);}
    setSavingNew(false);
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14}}>Mes slides ({pres.length})</div>
    <div style={{background:K.card,border:`1px solid #1E4FA330`,borderRadius:14,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-presentation" style={{fontSize:15,color:"#1E4FA3"}}/>Ajouter une présentation
      </div>
      {[["Titre","titre","Titre de la présentation"],["URL (PDF/Drive/Slides)","url","https://..."],["Matière","mat","SYSCOHADA"],["Description","desc","Aperçu du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
      <button onClick={savePres} disabled={savingNew} className="bt"
        style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#0A2A5C,#1E4FA3)",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4}}>
        {savingNew?"Enregistrement...":"+ Ajouter la slide"}
      </button>
    </div>
    {!pres.length&&<EmptyState ico="presentation" title="Aucune slide ajoutée" desc="Ajoutez des supports de présentation pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {pres.map(p=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publiée",rejected:"Rejetée"}[p.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#1E4FA3",rejected:"#EF4444"}[p.status||"draft"];
        return <div key={p.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#1E4FA318",border:"1px solid #1E4FA330",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="ti ti-presentation" style={{fontSize:16,color:"#1E4FA3"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div>
            <div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.url}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{background:`${cc}16`,border:`1px solid ${cc}35`,borderRadius:99,padding:"3px 11px",fontSize:12.5,fontWeight:800,color:cc}}>{sc}</span>
            {(p.status==="draft"||p.status==="rejected")&&
              <button onClick={()=>onSubmit("pres",p.id)} disabled={saving} className="bt"
                style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                Soumettre
              </button>
            }
            {p.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${p.titre}" ?`))deletePresentation(p.id);}} className="bt"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
              <i className="ti ti-trash" style={{fontSize:13}}/>
            </button>}
          </div>
          </div>
          {p.status==="rejected"&&p.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:13,marginRight:5}}/>{p.rejectReason}</div>}
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
        <button onClick={()=>sThread(null)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:K.t2,display:"flex",alignItems:"center",gap:4,fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-arrow-left" style={{fontSize:14}}/>Retour</button>
        <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{aNom}</div>
      </div>
      <div style={{background:K.c2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{height:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
          {tMsgs.map(m=>{const mine=m.fromRole==="formateur";return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
            <div style={{background:mine?"#8B5CF6":K.card,color:mine?"#fff":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:14,lineHeight:1.5,border:mine?"none":`1px solid ${K.b0}`}}>{m.texte}</div>
            <div style={{fontSize:10,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.apprenantNom} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
          </div>;})}
          <div ref={endRef}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Répondre…" style={{flex:1,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"10px 15px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
        <Btn ch={sending?"…":"Envoyer"} on={send} v="i" sx={{minHeight:40}}/>
      </div>
    </div>;
  }
  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><i className="ti ti-message-circle" style={{fontSize:20,color:"#8B5CF6"}}/>Messages de vos apprenants</div>
    {!convs.length&&<EmptyState ico="message-circle" title="Aucun message" desc="Les questions de vos apprenants (envoyées depuis vos modules) apparaîtront ici."/>}
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {convs.map(c=>{
        const unread=msgs.filter(m=>m.apprenantUid===c.apprenantUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;
        return <div key={c.apprenantUid} onClick={()=>sThread(c.apprenantUid)} className="bt" style={{background:K.card,border:`1px solid ${unread>0?"#8B5CF640":K.b0}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{(c.apprenantNom||"?")[0].toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{c.apprenantNom||"Apprenant"}</div>
            <div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.fromRole==="formateur"?"Vous : ":""}{c.texte}</div>
          </div>
          {unread>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:99,padding:"2px 7px",flexShrink:0}}>{unread}</span>}
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
        <button onClick={()=>setGrading(null)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-arrow-left" style={{fontSize:14}}/>Retour
        </button>
        <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{grading.apprenantNom} — {grading.modTitre}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        {grading.answers.map(a=><div key={a.qId} style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:"14px 16px"}}>
          <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:8}}>{a.q}</div>
          <div style={{background:K.c2,borderRadius:9,padding:"10px 12px",color:K.t2,fontSize:14,lineHeight:1.6,marginBottom:10,whiteSpace:"pre-wrap"}}>{a.texte}</div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:12,color:K.t3,fontWeight:600}}>Note :</span>
            <input type="number" min="0" value={notes[a.qId]} onChange={e=>setNotes(n=>({...n,[a.qId]:e.target.value}))} placeholder="0"
              style={{width:70,background:K.c2,border:`1px solid ${K.b1}`,borderRadius:7,padding:"6px 9px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"}}/>
          </div>
        </div>)}
      </div>
      <div style={{background:overMax?K.erBg:K.emBg,border:`1px solid ${overMax?K.erBd:K.emBd}`,borderRadius:10,padding:"11px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:14,color:K.t2,fontWeight:600}}>Total</span>
        <span style={{fontSize:16,fontWeight:800,color:overMax?K.er:K.em}}>{totalNotes} / {grading.maxPoints} pts</span>
      </div>
      <Btn ch={saving?"Enregistrement…":"✓ Valider la correction"} dis={saving||overMax} on={async()=>{
        setSaving(true);
        try{await gradeOpenAnswers(grading.id,notes,grading.apprenantUid,grading.modId,grading.maxPoints,grading.modTitre||"");setGrading(null);}
        catch(e){alert(e.message);}
        setSaving(false);
      }} full sx={{minHeight:46}}/>
    </div>;
  }

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14}}>Corrections ({ungraded.length} à faire)</div>
    {!ungraded.length&&!graded.length&&<EmptyState ico="checkbox" title="Aucune soumission" desc="Les réponses aux questions ouvertes de vos apprenants apparaîtront ici."/>}
    {ungraded.length>0&&<div style={{marginBottom:20}}>
      <div style={{fontSize:12,fontWeight:700,color:K.wa,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>⏳ À corriger</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ungraded.map(a=><div key={a.id} onClick={()=>openGrading(a)} className="bt" style={{cursor:"pointer",background:K.card,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:K.waBg,border:`1px solid ${K.waBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-message-circle" style={{fontSize:15,color:K.wa}}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{a.apprenantNom}</div>
            <div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.modTitre} · {a.answers.length} réponse(s)</div>
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:16,color:K.t3,flexShrink:0}}/>
        </div>)}
      </div>
    </div>}
    {graded.length>0&&<div>
      <div style={{fontSize:12,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>✓ Corrigées</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {graded.map(a=><div key={a.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"12px 15px",display:"flex",alignItems:"center",gap:10,opacity:.75}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{a.apprenantNom}</div>
            <div style={{fontSize:12,color:K.t3}}>{a.modTitre}</div>
          </div>
          <span style={{fontSize:14,fontWeight:800,color:K.em,flexShrink:0}}>{a.totalPoints}/{a.maxPoints} · {a.pct}%</span>
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
        status:"pending",submittedBy:uid,submittedAt:new Date().toISOString(),on:false,createdBy:uid,createdAt:new Date().toISOString(),gr:false
      });
      alerterAdmin("videos",id);
      toast("o","Vidéo envoyée pour validation : l'administrateur est prévenu.");
      setForm({titre:"",url:"",desc:""});
    }catch(e){toast("e",e.message);}
    setSavingNew(false);
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14}}>Mes vidéos ({vids.length})</div>
    {/* Formulaire ajout */}
    <div style={{background:K.card,border:`1px solid #3B82F630`,borderRadius:14,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-video-plus" style={{fontSize:15,color:"#3B82F6"}}/>Ajouter une vidéo
      </div>
      {[["Titre","titre","Titre de la vidéo"],["URL (YouTube/Drive)","url","https://..."],["Description","desc","Aperçu du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
            style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}
      <button onClick={saveVid} disabled={savingNew} className="bt"
        style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4}}>
        {savingNew?"Enregistrement...":"+ Ajouter la vidéo"}
      </button>
    </div>
    {/* Liste */}
    {!vids.length&&<EmptyState ico="video" title="Aucune vidéo ajoutée" desc="Ajoutez des liens YouTube ou Drive pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {vids.map(v=>{
        const sc={draft:"Brouillon",pending:"En attente",approved:"Publiée",rejected:"Rejetée"}[v.status||"draft"];
        const cc={draft:K.t3,pending:"#F59E0B",approved:"#1E4FA3",rejected:"#EF4444"}[v.status||"draft"];
        return <div key={v.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#3B82F618",border:"1px solid #3B82F630",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className="ti ti-video" style={{fontSize:16,color:"#3B82F6"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div>
            <div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.url}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{background:`${cc}16`,border:`1px solid ${cc}35`,borderRadius:99,padding:"3px 11px",fontSize:12.5,fontWeight:800,color:cc}}>{sc}</span>
            {(v.status==="draft"||v.status==="rejected")&&
              <button onClick={()=>onSubmit("vid",v.id)} disabled={saving} className="bt"
                style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                Soumettre
              </button>
            }
            {v.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${v.titre}" ?`))deleteVideo(v.id);}} className="bt"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
              <i className="ti ti-trash" style={{fontSize:13}}/>
            </button>}
          </div>
          </div>
          {v.status==="rejected"&&v.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:13,marginRight:5}}/>{v.rejectReason}</div>}
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
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14}}>Statistiques de vos cours</div>
    {!myMods.length&&<EmptyState ico="chart-bar" title="Aucune statistique" desc="Créez et publiez des modules pour voir les statistiques de vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {myMods.filter(m=>m.status==="approved"||m.on).map(m=>{
        const learners=allUsers.filter(u=>u.progress?.[m.id]==="done");
        const scores=allUsers.map(u=>u.scores?.[m.id]?.pct).filter(p=>p!=null);
        const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
        const above80=scores.filter(s=>s>=80).length;
        return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:9,background:"#8B5CF618",border:"1px solid #8B5CF630",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className="ti ti-book-2" style={{fontSize:16,color:"#8B5CF6"}}/>
            </div>
            <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{m.titre}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              [learners.length,"Complétés","#1E4FA3"],
              [`${avg}%`,"Score moyen","#3B82F6"],
              [above80,"Score ≥80%","#F59E0B"],
            ].map(([v,l,c])=><div key={l} style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:11,color:K.t3,marginTop:3}}>{l}</div>
            </div>)}
          </div>
          {scores.length>0&&<>
            <div style={{fontSize:12,color:K.t3,marginTop:10,marginBottom:4}}>Distribution des scores</div>
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
// Déconnexion automatique après 20 minutes sans utilisation.
// Tant que l'application est affichée à l'écran, elle compte comme utilisée (lecture, vidéo, PDF…)
// et ne se ferme jamais. Le délai court seulement quand elle est fermée, réduite, dans un autre
// onglet ou que le téléphone est verrouillé : au retour, si plus de 20 min se sont écoulées,
// l'utilisateur est déconnecté. La dernière utilisation est mémorisée dans le navigateur.
// Délai par défaut : 20 min ; chaque compte peut le régler dans ses paramètres (alerte 2 min avant)
const CLE_ACTIVITE = "ec_derniere_activite";
const CLE_DECO = "ec_deconnexion_inactivite";

function useAutoLogout(onLogout, minutes = 20) {
  const [warning, setWarning] = useState(false);
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;
  const delaiRef = useRef(minutes);
  delaiRef.current = minutes || 20;

  useEffect(() => {
    const lire = () => { try { return +localStorage.getItem(CLE_ACTIVITE) || 0; } catch (e) { return 0; } };
    const ecrire = t => { try { localStorage.setItem(CLE_ACTIVITE, String(t)); } catch (e) {} };
    // Une connexion plus récente que la dernière activité enregistrée repart de zéro
    const connexion = Date.parse(auth.currentUser?.metadata?.lastSignInTime || "") || 0;
    let derniere = Math.max(lire(), connexion) || Date.now(), ecrite = 0, fini = false;

    const verifier = () => {
      if (fini) return;
      derniere = Math.max(derniere, lire()); // activité dans un autre onglet
      const DELAI = delaiRef.current * 60000, ALERTE = DELAI - 2 * 60000;
      if (document.visibilityState === "visible" && Date.now() - derniere < DELAI) { activite(); return; } // affichée = utilisée
      const inactif = Date.now() - derniere;
      if (inactif >= DELAI) {
        fini = true; setWarning(false);
        try { localStorage.removeItem(CLE_ACTIVITE); sessionStorage.setItem(CLE_DECO, "1"); } catch (e) {}
        onLogoutRef.current();
        return;
      }
      setWarning(inactif >= ALERTE ? derniere + DELAI : false); // heure prévue de déconnexion
    };
    const activite = () => {
      if (fini) return;
      derniere = Date.now();
      if (derniere - ecrite > 15000) { ecrite = derniere; ecrire(derniere); }
      setWarning(false);
    };
    const retour = () => { if (document.visibilityState === "visible") verifier(); else if (!fini) { derniere = Date.now(); ecrite = derniere; ecrire(derniere); } };
    const quitte = () => { if (!fini) ecrire(Date.now()); };

    verifier();
    if (!fini) ecrire(derniere);
    const events = ["mousemove","keydown","mousedown","touchstart","scroll","click"];
    events.forEach(e => window.addEventListener(e, activite, {passive:true}));
    document.addEventListener("visibilitychange", retour);
    window.addEventListener("focus", verifier);
    window.addEventListener("pagehide", quitte);
    const iv = setInterval(verifier, 15000);

    return () => {
      events.forEach(e => window.removeEventListener(e, activite));
      document.removeEventListener("visibilitychange", retour);
      window.removeEventListener("focus", verifier);
      window.removeEventListener("pagehide", quitte);
      clearInterval(iv);
    };
  }, []);

  return { warning };
}

// ── DOCUMENTS FORMATEUR ───────────────────────────────────────────────────────
const DOC_TYPES = {
  "application/pdf":                    {label:"PDF",         ico:"file-text",    col:"#EF4444"},
  "lien":                               {label:"Lien",        ico:"link",         col:"#1E4FA3"},
  "application/vnd.ms-powerpoint":      {label:"PowerPoint",  ico:"presentation", col:"#F59E0B"},
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                                        {label:"PowerPoint",  ico:"presentation", col:"#F59E0B"},
  "application/msword":                 {label:"Word",        ico:"file-type-doc",    col:"#3B82F6"},
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                                        {label:"Word",        ico:"file-type-doc",    col:"#3B82F6"},
  "application/vnd.ms-excel":           {label:"Excel",       ico:"file-spreadsheet", col:"#1E4FA3"},
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                                        {label:"Excel",       ico:"file-spreadsheet", col:"#1E4FA3"},
};
const ACCEPT_DOCS=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx";
const MAX_SIZE_MB=20;

function FADocs({uid,toast}){
  const K=useK();const{mob}=useW();
  const[docs,setDocs]=useState([]);
  const[uploading,setUploading]=useState(false);
  const[form,setForm]=useState({titre:"",desc:"",modId:""});
  const[file,setFile]=useState(null),[lien,setLien]=useState("");
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
    setFile(f);setLien("");
    if(!form.titre)setForm(fm=>({...fm,titre:f.name.replace(/\.[^/.]+$/,"")}));
  };

  const enregistrerLien=async()=>{
    if(!lienValide(lien))return toast("e","Lien invalide : collez un lien complet commençant par https://");
    if(!form.titre.trim())return toast("e","Titre requis");
    setUploading(true);
    try{
      const id="DOC"+Date.now();
      await setDoc(doc(db,"documents",id),{
        id,titre:form.titre,desc:form.desc,
        url:lien.trim(),type:"lien",ext:"lien",size:0,
        modId:form.modId||"",
        status:"draft",createdBy:uid,
        createdAt:new Date().toISOString(),
        fileName:"",
      });
      toast("o","Lien enregistré ! Soumettez-le pour validation.");
      setLien("");setForm({titre:"",desc:"",modId:""});
    }catch(e){toast("e",e.message);}
    setUploading(false);
  };

  const uploadDoc=async()=>{
    if(!file&&lien.trim())return enregistrerLien();
    if(!file)return toast("e","Choisissez un fichier ou collez un lien");
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
      if(!timedOut){toast("e",`Échec de l'envoi : ${msgStorage(e)}`);setUploading(false);}
    }
  };

  const submitDoc=async(id)=>{
    await updateDoc(doc(db,"documents",id),{status:"pending",submittedAt:new Date().toISOString()});
    alerterAdmin("documents",id);
    toast("o","Soumis pour validation : l'administrateur est prévenu.");
  };

  const statusInfo={
    draft:   {label:"Brouillon", col:K.t3},
    pending: {label:"En attente",col:"#F59E0B"},
    approved:{label:"Publié",    col:"#1E4FA3"},
    rejected:{label:"Rejeté",    col:"#EF4444"},
  };

  return <div style={{animation:"fadeIn .35s ease"}}>
    <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
      <i className="ti ti-files" style={{fontSize:20,color:"#8B5CF6"}}/>
      Documents ({docs.length})
    </div>

    {/* Zone upload */}
    <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-upload" style={{fontSize:14,color:"#8B5CF6"}}/>Uploader un document
      </div>

      {/* Drop zone */}
      <label
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,
          padding:"22px 16px",border:`2px dashed ${dragOver?"#8B5CF6":file?"#1E4FA3":K.b1}`,
          borderRadius:12,cursor:"pointer",
          background:dragOver?"#8B5CF608":file?"#1E4FA306":K.bg,
          transition:"all .2s",marginBottom:14}}>
        <input type="file" accept={ACCEPT_DOCS} style={{display:"none"}}
          onChange={e=>handleFile(e.target.files[0])}/>
        {file
          ?<>
            <div style={{width:48,height:48,borderRadius:14,background:`${getFileType(file).col}18`,border:`1px solid ${getFileType(file).col}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className={`ti ti-${getFileType(file).ico}`} style={{fontSize:22,color:getFileType(file).col}}/>
            </div>
            <div style={{fontWeight:700,fontSize:14,color:"#1E4FA3",textAlign:"center"}}>{file.name}</div>
            <div style={{fontSize:12,color:K.t3}}>{getFileType(file).label} · {(file.size/1024/1024).toFixed(1)} MB</div>
          </>
          :<>
            <i className="ti ti-cloud-upload" style={{fontSize:36,color:K.t3}}/>
            <div style={{fontWeight:600,fontSize:14,color:K.t2}}>Glissez un fichier ou cliquez pour choisir</div>
            <div style={{fontSize:12,color:K.t3}}>PDF · PowerPoint · Word · Excel · Max {MAX_SIZE_MB} MB</div>
            {/* Badges formats */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
              {[["file-text","PDF","#EF4444"],["presentation","PPT/PPTX","#F59E0B"],["file-type-doc","DOC/DOCX","#3B82F6"],["file-spreadsheet","XLS/XLSX","#1E4FA3"]].map(([ico,lbl,col])=>
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:4,background:`${col}14`,border:`1px solid ${col}25`,borderRadius:6,padding:"3px 8px"}}>
                  <i className={`ti ti-${ico}`} style={{fontSize:12,color:col}}/>
                  <span style={{fontSize:11,fontWeight:700,color:col}}>{lbl}</span>
                </div>
              )}
            </div>
          </>
        }
      </label>

      {!file&&<div style={{marginTop:-4,marginBottom:14}}><ChampLien K={K} val={lien} onChange={setLien} lb="ou collez un lien (Google Drive, Docs, Slides…)"/></div>}

      {/* Formulaire */}
      {[["Titre du document","titre","Fondements SYSCOHADA — Chapitre 1"],["Description (optionnel)","desc","Résumé du contenu..."]].map(([lb,k,ph])=>
        <div key={k} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600}}>{lb}</div>
          <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            placeholder={ph} style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        </div>
      )}

      {/* Associer à un module */}
      {myMods.length>0&&<div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:K.t3,marginBottom:4,fontWeight:600}}>Associer à un module (optionnel)</div>
        <select value={form.modId} onChange={e=>setForm(f=>({...f,modId:e.target.value}))}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"}}>
          <option value="">Aucun module associé</option>
          {myMods.map(m=><option key={m.id} value={m.id}>{m.titre}</option>)}
        </select>
      </div>}

      <div style={{display:"flex",gap:8}}>
        {(file||lien)&&<button onClick={()=>{setFile(null);setLien("");setForm({titre:"",desc:"",modId:""});}} className="bt"
          style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t3,borderRadius:9,padding:"10px 14px",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif"}}>
          Annuler
        </button>}
        <button onClick={uploadDoc} disabled={uploading||(!file&&!lien.trim())} className="bt"
          style={{flex:1,padding:"12px",background:file||lien.trim()?"linear-gradient(135deg,#7C3AED,#8B5CF6)":"#333",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:14,cursor:file||lien.trim()?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          {uploading?<><i className="ti ti-loader-2" style={{fontSize:14,animation:"spin .8s linear infinite"}}/>Enregistrement...</>:!file&&lien.trim()?<><i className="ti ti-link" style={{fontSize:14}}/>Enregistrer le lien</>:<><i className="ti ti-upload" style={{fontSize:14}}/>Uploader le document</>}
        </button>
      </div>
    </div>

    {/* Liste des documents */}
    {!docs.length&&<EmptyState ico="files" title="Aucun document uploadé" desc="Uploadez vos supports PDF, PowerPoint, Word ou Excel pour vos apprenants."/>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {docs.map(d=>{
        const ft=DOC_TYPES[d.type]||{label:d.ext?.toUpperCase()||"Fichier",ico:"file",col:"#8B5CF6"};
        const si=statusInfo[d.status||"draft"];
        return <div key={d.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {(()=>{const ico=<div style={{width:40,height:40,borderRadius:11,background:`${ft.col}18`,border:`1px solid ${ft.col}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className={`ti ti-${ft.ico}`} style={{fontSize:19,color:ft.col}}/>
            </div>;return d.type==="lien"?<Miniature url={d.url} w={40} h={52} r={8} K={K} fallback={ico}/>:ico;})()}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.titre}</div>
              <div style={{fontSize:12,color:K.t3,display:"flex",gap:8,alignItems:"center"}}>
                <span>{ft.label}</span>
                {d.size&&<span>{(d.size/1024/1024).toFixed(1)} MB</span>}
                {d.modId&&mods.find(m=>m.id===d.modId)&&<span>· {mods.find(m=>m.id===d.modId)?.titre}</span>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              <span style={{background:`${si.col}18`,border:`1px solid ${si.col}30`,borderRadius:99,padding:"2px 9px",fontSize:12,fontWeight:700,color:si.col,whiteSpace:"nowrap"}}>{si.label}</span>
              {(d.status==="draft"||d.status==="rejected")&&
                <button onClick={()=>submitDoc(d.id)} className="bt"
                  style={{background:"#F59E0B18",border:"1px solid #F59E0B30",color:"#F59E0B",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>
                  Soumettre
                </button>
              }
              {d.status!=="approved"&&<button onClick={()=>{if(window.confirm(`Supprimer "${d.titre}" ?`))deleteDoc(doc(db,"documents",d.id));}} className="bt"
                style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <i className="ti ti-trash" style={{fontSize:13}}/>
              </button>}
            </div>
          </div>
          {d.desc&&<div style={{fontSize:13,color:K.t2,marginTop:8,paddingTop:8,borderTop:`1px solid ${K.b0}`,lineHeight:1.5}}>{d.desc}</div>}
          {d.status==="rejected"&&d.rejectReason&&<div style={{marginTop:9,background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:K.er}}><i className="ti ti-alert-circle" style={{fontSize:13,marginRight:5}}/>{d.rejectReason}</div>}
        </div>;
      })}
    </div>
  </div>;
}

function AutoLogoutBanner({warning, mob}){
  // warning : heure prévue de la déconnexion (ms) ou false
  const reste=()=>Math.max(0,Math.round((warning-Date.now())/1000));
  const[secs,setSecs]=useState(reste);
  useEffect(()=>{
    if(!warning)return;
    setSecs(reste());
    const iv=setInterval(()=>setSecs(reste()),1000);
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
      <div style={{fontWeight:700,fontSize:14,color:"#fff",marginBottom:2}}>Déconnexion imminente</div>
      <div style={{fontSize:13,color:"#A8A29E"}}>Déconnexion dans <strong style={{color:"#F59E0B"}}>{mins}:{String(rem).padStart(2,"0")}</strong></div>
    </div>
    <button onClick={()=>{}} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"6px 12px",color:"#1C1917",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0}}>
      Rester connecté
    </button>
  </div>;
}

function Auth({onL}){
  const K=useK();const{mob}=useW();
  const[tab,sT]=useState("l"),[err,sE]=useState(""),[ok,sO]=useState(""),[busy,sB]=useState(false),[step,sS]=useState(1);
  const[consent,sConsent]=useState(false),[showPrivacy,sShowPrivacy]=useState(false),[needConsent,sNeedConsent]=useState(false);
  useEffect(()=>{try{if(sessionStorage.getItem(CLE_DECO)){sessionStorage.removeItem(CLE_DECO);sO("Vous avez été déconnecté après une période sans utilisation. Reconnectez-vous pour continuer.");}}catch(e){}},[]);
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
    // Code offert
    if(c.toUpperCase().startsWith("OF-")){
      try{
        const r=await activerCode(cred.user.uid,c);
        if(r.err){sB(false);return sE(r.err);}
        sO("✓ Accès débloqué !");setTimeout(()=>onL(cred.user.uid,cred.user),700);
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
    sE("");sO("");
    if(tab==="r"&&!consent){sNeedConsent(true);return sE("Cochez d'abord la politique de confidentialité, puis cliquez à nouveau.");}
    sB(true);
    try{
      const cred=await signInWithPopup(auth,provider);
      const user=cred.user;
      if(user.email===ADM_EMAIL){onL("__admin__",user);return;}
      const snap=await getDoc(doc(db,"users",user.uid));
      if(!snap.exists()){
        if(!consent){
          await signOut(auth);sB(false);sT("r");sNeedConsent(true);
          return sE("Première connexion avec ce compte : acceptez la politique de confidentialité ci-dessous, puis cliquez à nouveau sur le bouton.");
        }
        await setDoc(doc(db,"users",user.uid),{nom:user.displayName||user.email.split("@")[0],mail:user.email,createdAt:new Date().toLocaleDateString("fr-FR"),abonnement:"aucun",activationCode:null,codeValide:false,demandeDate:null,dureeId:null,dateExpiration:null,progress:{},scores:{},consentDate:new Date().toISOString(),consentVersion:PRIVACY_VERSION,lastLogin:Date.now()});
        sendNotifEmail({to_email:user.email,subject:"Bienvenue sur Éco-Campus RDC 🎉",nom:user.displayName||user.email.split("@")[0],message:"Votre compte vient d'être créé avec succès sur Éco-Campus RDC.\n\nProchaine étape : faites votre demande d'accès à une formation depuis votre espace, puis réglez votre inscription. Vous recevrez ensuite votre code d'activation par email pour débloquer vos modules.\n\nÀ très vite !"});
      }else{
        const u=snap.data();
        if(u.abonnement==="actif"&&xp(u.dateExpiration)){await updateDoc(doc(db,"users",user.uid),{abonnement:"expiré"});}
        updateDoc(doc(db,"users",user.uid),{lastLogin:Date.now()}).catch(()=>{});
      }
      onL(user.uid,user);
    }catch(e){
      const msg={
        "auth/unauthorized-domain":`Ce site (${window.location.hostname}) n'est pas autorisé dans Firebase. L'administrateur doit l'ajouter dans Authentication > Paramètres > Domaines autorisés.`,
        "auth/operation-not-allowed":"Ce mode de connexion n'est pas activé dans Firebase (Authentication > Méthode de connexion).",
        "auth/popup-blocked":"La fenêtre de connexion a été bloquée. Autorisez les fenêtres pop-up pour ce site, puis réessayez.",
        "auth/account-exists-with-different-credential":"Cet e-mail est déjà inscrit avec une autre méthode. Connectez-vous avec votre e-mail et votre mot de passe.",
        "auth/network-request-failed":"Connexion Internet indisponible. Réessayez.",
      }[e.code];
      if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request")sE(msg||"Connexion échouée : "+e.message);
      sB(false);
    }
  },[onL,tab,consent]);
  const go=useCallback(()=>step===2?code():tab==="r"?reg():login(),[step,tab,code,reg,login]);
  const hk=useCallback(e=>{if(e.key==="Enter")go();},[go]);
  return <div style={{minHeight:"100vh",background:K.bg,display:"flex",flexDirection:"column",fontFamily:"'Outfit',sans-serif",position:"relative"}}>
    <style>{mCss(K)}</style>
    <div style={{position:"fixed",top:-140,left:"50%",transform:"translateX(-50%)",width:460,height:220,background:`radial-gradient(ellipse,${K.em}0D,transparent 70%)`,pointerEvents:"none"}}/>
    <header style={{padding:mob?"14px 15px":"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:1}}><Logo/><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Formation en ligne"/></header>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:mob?"10px 14px 22px":"18px",position:"relative",zIndex:1}}>
      <div style={{width:"100%",maxWidth:385,animation:"sc .3s ease"}}>
        <div style={{textAlign:"center",marginBottom:mob?17:23}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"4px 12px",marginBottom:12}}><span style={{width:5,height:5,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:12,color:K.t2}}>Plateforme active</span></div>
          <h1 style={{fontSize:mob?20:25,fontWeight:900,color:K.t1,lineHeight:1.15,letterSpacing:"-.4px",marginBottom:5}}><span style={{background:`linear-gradient(135deg,${K.em},${K.in_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Éco-Campus</span><br/><span style={{fontSize:mob?14:17,fontWeight:700,color:K.t2}}>Services et formations</span></h1>
          <p style={{color:K.t3,fontSize:13,lineHeight:1.6}}>Modules · QCM · Exercices · Vidéos · Direct</p>
        </div>
        <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"17px 15px":"21px 19px",boxShadow:"0 20px 55px rgba(0,0,0,.3)"}}>
          {step===1&&<div style={{display:"flex",background:K.bg,borderRadius:9,padding:3,marginBottom:17,gap:2}}>{[["l","Connexion"],["r","Inscription"]].map(([k,l])=><button key={k} onClick={()=>sw(k)} className="bt" style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontWeight:700,fontSize:14,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:tab===k?K.c2:"transparent",color:tab===k?K.t1:K.t3,minHeight:38}}>{l}</button>)}</div>}
          <div style={{marginBottom:15}}><div style={{fontSize:15,fontWeight:800,color:K.t1,marginBottom:3}}>{step===2?"🔐 Code d'activation":tab==="l"?"Bon retour 👋":"Créer un compte"}</div><div style={{fontSize:13,color:K.t3,lineHeight:1.5}}>{step===2?"Code reçu de l'administrateur":tab==="l"?"Accédez à votre formation":"Inscription gratuite · Accès sur abonnement"}</div></div>
          {step===2&&<Inp lb="Mot de passe" rf={rP} type="password" ph="Le même qu'à l'inscription" ok={hk}/>}
          {step===2&&<Inp lb="Code d'activation" rf={rC} ph="EC-XXXXXXXX ou OF-XXXXXXXX" mono note="Code d'accès ou code offert reçu d'Éco-Campus" ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Nom complet" rf={rN} ph="Votre nom" ok={hk}/>}
          {step===1&&<Inp lb="Email" rf={rM} type="email" ph="vous@exemple.com" ok={hk}/>}
          {step===1&&<Inp lb="Mot de passe" rf={rP} type="password" ph="Min. 6 car." ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Confirmer" rf={rP2} type="password" ph="Répéter" ok={hk}/>}
          {step===1&&tab==="r"&&<div style={{marginBottom:13}}>
            <div onClick={()=>sConsent(c=>!c)} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",background:consent?K.emBg:K.c2,border:`1px solid ${consent?K.emBd:K.b0}`,borderRadius:9,transition:"all .15s"}}>
              <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${consent?K.em:K.b1}`,background:consent?K.em:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
                {consent&&<i className="ti ti-check" style={{fontSize:12,color:"#FFFFFF"}}/>}
              </div>
              <span style={{fontSize:13,color:K.t2,lineHeight:1.55,flex:1}}>
                J'ai lu et j'accepte la{" "}
                <button onClick={e=>{e.stopPropagation();sShowPrivacy(true);}} style={{background:"none",border:"none",color:K.em,fontWeight:700,fontSize:13,cursor:"pointer",padding:0,textDecoration:"underline",fontFamily:"'Outfit',sans-serif"}}>
                  politique de confidentialité
                </button>
                {" "}d'Éco-Campus RDC.
              </span>
            </div>
            {needConsent&&<div style={{marginTop:6,fontSize:12,color:K.wa,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-alert-triangle" style={{fontSize:13}}/>Acceptez la politique avant de continuer avec Google ou Facebook.</div>}
          </div>}
          {step===1&&tab==="l"&&<div style={{textAlign:"right",marginTop:-5,marginBottom:11}}><button onClick={()=>{const m=rM.current?.value?.trim()||"";if(!m.includes("@"))return sE("Saisissez votre email d'abord");pm.current=m;sS(2);sE("");}} className="bt" style={{background:"none",border:"none",color:K.em,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>J'ai un code →</button></div>}
          <Pop t="e" m={err}/><Pop t="o" m={ok}/>
          <Btn ch={busy?"…":step===2?"Valider →":tab==="l"?"Se connecter →":"Créer →"} on={go} full sx={{padding:"12px",fontSize:14,minHeight:46}} dis={busy}/>
          {step===2&&<button onClick={()=>{sS(1);sE("");}} className="bt" style={{width:"100%",marginTop:7,padding:"10px",background:"none",border:`1px solid ${K.b0}`,color:K.t3,borderRadius:8,fontFamily:"'Outfit',sans-serif",fontSize:13,cursor:"pointer",minHeight:40}}>← Retour</button>}
          {showPrivacy&&<PrivacyModal onClose={()=>sShowPrivacy(false)}/>}
          {tab==="r"&&step===1&&<div style={{marginBottom:6,padding:"7px 10px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,fontSize:12,color:K.t3,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-lock" style={{fontSize:13,color:K.em}}/>Données protégées · Firebase sécurisé · Jamais revendues
          </div>}
          {step===1&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0"}}>
              <div style={{flex:1,height:1,background:K.b0}}/>
              <span style={{fontSize:12,color:K.t3}}>{tab==="r"?"ou s'inscrire avec":"ou continuer avec"}</span>
              <div style={{flex:1,height:1,background:K.b0}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button onClick={()=>socialLogin(googleProvider)} disabled={busy} className="bt"
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:9,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:14,color:K.t1,minHeight:44}}>
                <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.72 17.76 9.5 24 9.5z"/><path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.46c-.54 2.9-2.18 5.36-4.64 7.01l7.14 5.54C43.27 37.22 46.14 31.28 46.14 24.5z"/><path fill="#FBBC05" d="M10.72 28.28A14.5 14.5 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.57 10.75l8.15-6.47z"/><path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.49-4.95l-7.14-5.54C28.57 38.3 26.4 39 24 39c-6.24 0-11.57-4.22-13.28-9.93l-8.15 6.47C6.07 43.48 14.54 47 24 47z"/></svg>
                Google
              </button>
              <button onClick={()=>socialLogin(facebookProvider)} disabled={busy} className="bt"
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",background:"#1877F2",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:14,color:"#fff",minHeight:44}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                Facebook
              </button>
            </div>
          </>}
        </div>
      </div>
    </div>
  </div>;
}

// ── USER APP ──────────────────────────────────────────────────────────────────
function UA({uid,onOut}){
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  // Vue initiale : raccourcis de l'application installée (?vue=ef, ?vue=pres…)
  const[vue,sV]=useState(()=>{try{return normaliserVue(new URLSearchParams(window.location.search).get("vue"));}catch{return"home";}}),[mod,sM]=useState(null),[quiz,sQ]=useState(null),[openQuiz,sOpenQuiz]=useState(null),[sub,sSub]=useState(false);
  const[uData,sUD]=useState(null),[pdfs,sPdfs]=useState({});
  const[showOnboarding,sShowOnboarding]=useState(false);
  const{mods,loading:mL}=useModules();
  const allPres=usePresentations();
  const allStages=useStages();
  const allPlats=usePlateformes();
  const{vids:tousVids,live}=useVideos();
  const vids=useMemo(()=>tousVids.filter(estPublie),[tousVids]); // vidéos des formateurs : visibles une fois approuvées
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
    if(firstMod&&firstMod.id){sM(firstMod);}
  };
  const cfgSec=useConfigSecurite();
  const{warning:uaWarn}=useAutoLogout(onOut,delaiCompte(uData?.preferences,cfgSec));
  useEffect(()=>{if(uData?.preferences?.taille)appliquerTaille(uData.preferences.taille);},[uData?.preferences?.taille]);
  // Fiche d'annuaire (nom, e-mail) permettant aux collègues d'inviter cet apprenant dans un dossier d'états financiers
  useEffect(()=>{if(uData)inscrireAnnuaire(db,{uid,nom:uData.nom,mail:auth.currentUser?.email||uData.mail});},[uid,uData?.nom,uData?.mail]);
  const myOpenAnswers=useMyOpenAnswers(uid);
  usePresence({uid,nom:uData?.nom,mail:auth.currentUser?.email||uData?.mail,role:"apprenant",vue:mod?`Module : ${mod.titre}`:VUE_LBL[vue]||vue});
  if(!uData||mL)return <div style={{minHeight:"100vh",background:K.bg}}><style>{mCss(K)}</style><Spin/></div>;
  const ok=uData.abonnement==="actif"&&!xp(uData.dateExpiration);
  const aMods=mods.filter(m=>m.on!==false);
  const pr=uData.progress||{},sc=uData.scores||{};
  const nd=aMods.filter(m=>pr[m.id]==="done").length,gp=aMods.length?Math.round(nd/aMods.length*100):0;
  const save=async(modId,s,t)=>{try{await saveProgress(uid,modId,{s,t,pct:Math.round(s/t*100)});}catch(e){alert("Score non enregistré (connexion ?). Repassez l'évaluation une fois en ligne.");}};
  const markDoneNoEval=async modId=>{await updateDoc(doc(db,"users",uid),{[`progress.${modId}`]:"done"});sM(null);sV("res");};
  const W=(ch,hideNav)=><div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}><style>{mCss(K)}</style>{!hideNav&&<Nav u={uData} vue={vue} sV={v=>{sV(v);sM(null);}} ok={ok} onSub={()=>sSub(true)} onOut={onOut} live={live.on} uid={uid}/>}<main className="mp" style={{maxWidth:1060,margin:"0 auto",padding:hideNav?"14px":undefined,paddingBottom:hideNav?20:(mob?80:20)}}>{ch}</main>{sub&&<SubM onClose={()=>sSub(false)} uid={uid} u={uData}/>}{showOnboarding&&<Onboarding u={uData} onDone={doneOnboarding} mods={aMods}/>}<AutoLogoutBanner warning={uaWarn} mob={mob}/></div>;
  if(quiz)return W(<QZ mod={quiz} onDone={async(s,t)=>{await save(quiz.id,s,t);sQ(null);sM(null);sV("res");}} onBack={()=>sQ(null)}/>);
  if(openQuiz)return W(<OpenQuiz mod={openQuiz} uid={uid} uNom={uData.nom} onDone={()=>{sOpenQuiz(null);sM(null);sV("res");}} onBack={()=>sOpenQuiz(null)}/>,true);
  if(mod)return W(<MV mod={mod} sc={sc[mod.id]} ok={ok} onQ={()=>sQ(mod)} onOpenQ={()=>sOpenQuiz(mod)} onMarkDone={()=>markDoneNoEval(mod.id)} doneNoEval={pr[mod.id]==="done"} openAnswer={myOpenAnswers.find(a=>a.modId===mod.id)} onBack={()=>sM(null)} onSub={()=>sSub(true)} vids={vids.filter(v=>v.mid===mod.id)} pdf={pdfs[mod.id]} uid={uid} uNom={uData.nom}/>,true);
  return W(<>
    <SousNav groupes={GROUPES_APPRENANT} vue={vue} onGo={sV}/>
    {vue==="home"&&<Home u={uData} pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods} vids={vids} onOpen={sM} onSub={()=>sSub(true)} onVid={()=>sV("videos")} onPres={()=>sV("pres")} onStages={()=>sV("stages")} onEf={()=>sV("ef")} onFisc={()=>sV("fisc")} onFin={()=>sV("fin")} onJrn={()=>sV("jrn")} onCpt={()=>sV("cpt")} onAudio={()=>sV("audio")} live={live} presCount={allPres.filter(estPublie).length} uid={uid} onGo={sV}/>}
    {vue==="videos"&&<VidsPage ok={ok} onSub={()=>sSub(true)} vids={vids} live={live}/>}
    {vue==="pres"&&<PresPage ok={ok} onSub={()=>sSub(true)} pres={allPres.filter(estPublie)}/>
    }{vue==="stages"&&<StagePage stages={allStages} plats={allPlats} ok={ok}/>
    }{vue==="services"&&<ServicesPage user={uData}/>}
    {vue==="mods"&&<ModulesCours mods={aMods} pr={pr} sc={sc} ok={ok} vids={vids} onOpen={sM} uid={uid} onSub={()=>sSub(true)}/>}
    {vue==="res"&&<MesResultats pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods} u={uData} uid={uid} onSub={()=>sSub(true)} onGo={sV}/>}
    {vue==="psycho"&&<PsychoPage uid={uid} u={uData}/>}
    {vue==="param"&&<ParametresPage role="apprenant" uid={uid} data={uData} onOut={onOut} onGo={sV}/>}
    {vue==="ef"&&<EtatsFinanciers key="ef" sansRaccourcis db={db} K={K} mob={mob} me={{uid,nom:uData.nom,mail:uData.mail,role:"apprenant"}} ok={ok} onSub={()=>sSub(true)}/>}
    {vue==="jrn"&&<EtatsFinanciers key="jrn" db={db} K={K} mob={mob} me={{uid,nom:uData.nom,mail:uData.mail,role:"apprenant"}} ok={ok} onSub={()=>sSub(true)} journal0/>}
    {vue==="cpt"&&<EtatsFinanciers key="cpt" db={db} K={K} mob={mob} me={{uid,nom:uData.nom,mail:uData.mail,role:"apprenant"}} ok={ok} onSub={()=>sSub(true)} guide0/>}
    {vue==="audio"&&<EcouterCours K={K} mob={mob} mods={aMods} pres={allPres.filter(estPublie)} ok={ok} onSub={()=>sSub(true)}/>}
    {vue==="fisc"&&<CodeImpots K={K} mob={mob} db={db} uid={uid} scores={uData.scores||{}} ok={ok} onSub={()=>sSub(true)}/>}
    {vue==="fin"&&<FinanceEntreprise K={K} mob={mob} db={db} uid={uid} scores={uData.scores||{}} ok={ok} onSub={()=>sSub(true)}/>}
    {vue==="sugg"&&<Suggestions K={K} mob={mob} db={db} me={{uid,nom:uData.nom,mail:uData.mail,role:"apprenant"}}/>}
    {vue==="apropos"&&<Apropos K={K} mob={mob} onGo={sV} services/>}
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
{id:"at_d2",cat:"att",niv:"difficile",libre:true,q:"Combien de lettres A dans « ÉCO-CAMPUS ACADEMIA KINSHASA » ?",a:"6",exp:"1 + 3 + 2 = 6."},
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
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:99,padding:"4px 13px",marginBottom:12,fontSize:12,fontWeight:700,color:K.in_,letterSpacing:.5}}>
        <i className="ti ti-brain" style={{fontSize:14}}/>AUTO-ÉVALUATION CHRONOMÉTRÉE
      </div>
      <div style={{fontSize:mob?22:27,fontWeight:900,color:K.t1,marginBottom:6}}>Tests psychotechniques</div>
      <div style={{fontSize:14,color:K.t2,lineHeight:1.6,maxWidth:460,margin:"0 auto"}}>Choisissez votre niveau · 9 catégories : suites, logique, figures, dominos, calcul, français, anglais, attention… · QCM et réponses libres · 5 à 15 minutes</div>
    </div>

    {/* Tuiles de niveau */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:mob?10:12,marginBottom:26}}>
      {PSY_LEVELS.map(l=><div key={l.id} onClick={()=>start(l.id)} className="bt" style={{cursor:"pointer",padding:mob?"16px 12px":"20px 14px",borderRadius:14,background:K.card,border:`1px solid ${K.b1}`,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:l.col}}/>
        <div style={{width:40,height:40,borderRadius:11,background:`${l.col}1e`,border:`1px solid ${l.col}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
          <i className={`ti ti-${l.ico}`} style={{fontSize:19,color:l.col}}/>
        </div>
        <div style={{fontSize:14,fontWeight:800,color:K.t1,marginBottom:6}}>{l.label}</div>
        <div style={{fontSize:11,color:K.t3,fontWeight:600}}>{Math.round(l.dur/60)} min · {l.n} questions</div>
      </div>)}
    </div>

    {/* Matières couvertes */}
    <div style={{fontSize:13,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>Matières mélangées à chaque test</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:26}}>
      {PSY_CATS.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",gap:6,background:`${c.col}12`,border:`1px solid ${c.col}30`,borderRadius:99,padding:"6px 12px",fontSize:12,fontWeight:700,color:c.col}}>
        <i className={`ti ti-${c.ico}`} style={{fontSize:14}}/>{c.label}
      </div>)}
    </div>

    {/* Historique personnel */}
    {uid&&<div>
      <div style={{fontSize:13,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>Historique complet ({hist.length})</div>
      {histLoading?<div style={{fontSize:13,color:K.t3,padding:"10px 2px"}}>Chargement…</div>
      :hist.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"18px",textAlign:"center",fontSize:13,color:K.t3}}>Aucun test passé pour l'instant. Lancez-vous !</div>
      :<div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:hist.length>6?420:"none",overflowY:hist.length>6?"auto":"visible",paddingRight:hist.length>6?4:0}}>
        {hist.map(h=>{const lc=PSY_LEVELS.find(l=>l.id===h.niveau)?.col||K.em;return <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"10px 13px"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:lc,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:K.t1}}>{h.niveauLabel||h.niveau}</div>
            <div style={{fontSize:11,color:K.t3}}>{psyRelTime(h.ts)}</div>
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
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12,fontWeight:700,color:K.t3}}>
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

      <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"20px 18px":"26px 24px",marginBottom:14}}>
        <div style={{fontSize:mob?16:18,fontWeight:700,color:K.t1,lineHeight:1.5,marginBottom:20}}>{q.q}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.libre?<div>
            <input value={typeof ans[idx]==="string"?ans[idx]:""} onChange={e=>{const v=e.target.value;setAns(a=>{const b=[...a];b[idx]=v;return b;});}} placeholder="Tapez votre réponse…"
              style={{width:"100%",background:K.c2,border:`1.5px solid ${ci.col}60`,borderRadius:11,padding:"13px 15px",color:K.t1,fontSize:15,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
            <div style={{fontSize:12,color:K.t3,marginTop:7}}>✍️ Réponse libre — corrigée automatiquement (majuscules et accents ignorés).</div>
          </div>
          :q.opts.map((o,oi)=>{
            const sel=ans[idx]===oi;
            return <button key={oi} onClick={()=>pick(oi)} className="bt" style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",borderRadius:11,border:`1.5px solid ${sel?ci.col:K.b0}`,background:sel?`${ci.col}18`:K.c2,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
              <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,border:`1.5px solid ${sel?ci.col:K.b1}`,background:sel?ci.col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:sel?"#071209":K.t3}}>{String.fromCharCode(65+oi)}</div>
              <span style={{fontSize:14,fontWeight:600,color:K.t1}}>{o}</span>
            </button>;
          })}
        </div>
      </div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={prev} disabled={idx===0} className="bt" style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${K.b0}`,borderRadius:10,color:idx===0?K.t3:K.t2,fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:700,cursor:idx===0?"default":"pointer",opacity:idx===0?.4:1,minHeight:46}}>← Précédent</button>
        <div style={{flex:2}}><Btn ch={idx<qs.length-1?"Suivant →":"Terminer le test ✓"} on={next} full sx={{padding:"12px",fontSize:14,minHeight:46}}/></div>
      </div>
    </div>;
  }

  // ── ÉCRAN : RÉSULTATS + CORRECTION ──
  const msg=pct>=80?"Excellent ! 🎉":pct>=50?"Bien joué 👍":"Continuez à vous entraîner 💪";
  const msgCol=pct>=80?K.em:pct>=50?K.wa:K.rd;
  return <div style={{padding:mob?"14px":"24px 0",animation:"fadeIn .35s ease",maxWidth:640,margin:"0 auto"}}>
    <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:18,padding:mob?"24px 18px":"30px",textAlign:"center",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><ProgressRing pct={pct} size={104} stroke={9} col={msgCol}/></div>
      <div style={{fontSize:22,fontWeight:900,color:K.t1,marginBottom:4}}>{score} / {qs.length} bonnes réponses</div>
      <div style={{fontSize:14,fontWeight:700,color:msgCol,marginBottom:2}}>{msg}</div>
      <div style={{fontSize:13,color:K.t3}}>Niveau {curLvl?.label} · {psyFmt((curLvl?.dur||0)-tLeft)} utilisées</div>
    </div>

    <div style={{fontSize:13,fontWeight:700,color:K.t3,letterSpacing:.5,textTransform:"uppercase",marginBottom:12,paddingLeft:2}}>Correction détaillée</div>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
      {qs.map((q,i)=>{
        const good=q.libre?psyNorm(ans[i])===psyNorm(q.a):ans[i]===q.a;const given=ans[i];const ci=catInfo(q.cat);
        return <div key={q.id} style={{background:K.card,border:`1px solid ${good?K.emBd:K.rdBd}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
            <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:good?K.em:K.rd,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
              <i className={good?"ti ti-check":"ti ti-x"} style={{fontSize:13,color:"#fff"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:800,color:ci.col,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{ci.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:K.t1,lineHeight:1.4}}>{i+1}. {q.q}</div>
            </div>
          </div>
          <div style={{fontSize:13,color:K.t2,paddingLeft:28,lineHeight:1.6}}>
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
      <button onClick={backToLevels} className="bt" style={{flex:1,padding:"13px",background:"transparent",border:`1px solid ${K.b1}`,borderRadius:11,color:K.t2,fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",minHeight:46}}>Autres niveaux</button>
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
        return <button key={c.id} onClick={()=>sChan(c.id)} className="bt" style={{background:chan===c.id?K.em:K.c2,border:`1px solid ${chan===c.id?K.em:K.b0}`,color:chan===c.id?"#FFFFFF":K.t2,borderRadius:99,padding:"5px 13px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>{c.label}{unread>0&&<span style={{background:K.rd,color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{unread}</span>}</button>;
      })}
    </div>}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,padding:"4px 2px",marginBottom:12}}>
      {shown.length===0&&<div style={{textAlign:"center",color:K.t3,fontSize:14,marginTop:40}}>Aucun message dans cette conversation. Écrivez le premier !</div>}
      {shown.map(m=>{
        const mine=m.fromRole==="apprenant";
        return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
          <div style={{background:mine?K.em:K.c2,color:mine?"#FFFFFF":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:14,lineHeight:1.5}}>{m.texte}</div>
          <div style={{fontSize:10,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.fromNom||"Éco-Campus"} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
        </div>;
      })}
      <div ref={endRef}/>
    </div>
    <div style={{display:"flex",gap:8,flexShrink:0}}>
      <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Écrivez votre message…" style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,padding:"11px 16px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      <button onClick={send} disabled={sending||!texte.trim()} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",cursor:"pointer",flexShrink:0,opacity:sending||!texte.trim()?.5:1}}>
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
  const[showMore,sShowMore]=useState(false);
  const submitNavCode=async()=>{
    sHcErr("");sHcBusy(true);
    try{
      const r=await activerCode(uid,rHc.current?.value);
      sHcBusy(false);if(r.err)return sHcErr(r.err);
      sShowCode(false);window.location.reload();
    }catch(e){sHcBusy(false);sHcErr(e.message);}
  };
  const codeModal=showCode&&<Sheet title="🔑 J'ai un code" onClose={()=>sShowCode(false)}>
    <Inp lb="Code d'activation" rf={rHc} ph="EC-XXXXXXXX, OF-XXXXXXXX ou FO-XXXXXXXX" mono note="Code d'accès, code offert ou code formateur"/>
    {hcErr&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{hcErr}</div>}
    <Btn ch={hcBusy?"…":"Valider →"} on={submitNavCode} full dis={hcBusy}/>
  </Sheet>;
  // Menu : 6 rubriques (src/nav/navigation.js) ; chaque rubrique rouvre le dernier écran consulté
  const NAV_ITEMS=GROUPES_APPRENANT.map(g=>({k:g.k,ico:g.ico,label:mob&&g.court?g.court:g.label,badgeCount:g.k==="echanges"?unreadMsg:0,live:g.k==="apprendre"}));
  const gActif=groupeDe(GROUPES_APPRENANT,vue)?.k;
  const dernier=useRef({});
  useEffect(()=>{if(gActif)dernier.current[gActif]=vue;},[vue,gActif]);
  const allerGroupe=k=>{const g=GROUPES_APPRENANT.find(x=>x.k===k);sV(dernier.current[k]||g.vues[0][0]);};
  const allerVue=v=>v==="acces"?onSub&&onSub():sV(normaliserVue(v));
  if(mob){
    // ── BOTTOM NAV MOBILE ──
    return <>
      {/* Top bar mobile : logo + statut + avatar */}
      <div className="nb" style={{background:`${K.card}f0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"space-between",height:50,position:"sticky",top:0,zIndex:99}}>
        <Logo sm/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {ok
            ?<div style={{display:"flex",alignItems:"center",gap:5,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"3px 9px"}}><span style={{width:6,height:6,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:11,fontWeight:700,color:K.em}}>{u.dureeId==="v"?"∞ Actif":"✓ Actif"}</span></div>
            :<button onClick={onSub} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:99,padding:"4px 11px",fontSize:12,fontWeight:800,color:"#FFFFFF",cursor:"pointer"}}>Accéder</button>
          }
          <Cloche K={K} db={db} uid={uid} role="apprenant" user={u} mob onGo={allerVue} taille={28}/>
          <button onClick={()=>sShowCode(true)} className="bt" title="J'ai un code" style={{width:28,height:28,borderRadius:"50%",background:K.c2,border:`1px solid ${K.b1}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <i className="ti ti-key" style={{fontSize:14,color:K.t2}}/>
          </button>
          <div onClick={()=>sV("param")} title="Paramètres" style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontWeight:800,fontSize:13,cursor:"pointer",flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div>
        </div>
      </div>
      {/* Bottom nav : 4 rubriques principales + « Plus » */}
      {(()=>{
        const MAIN=["home","apprendre","parcours","resultats"];
        const main=NAV_ITEMS.filter(n=>MAIN.includes(n.k));
        // « Plus » : écrans des autres rubriques, puis À propos et services
        const more=[...GROUPES_APPRENANT.filter(g=>!MAIN.includes(g.k)).flatMap(g=>g.vues.map(([k,ico,label])=>({k,ico,label,badgeCount:k==="msg"?unreadMsg:0}))),{k:"apropos",ico:"info-circle",label:"À propos"},{k:"services",ico:"building",label:"Services"}];
        const moreActive=more.some(n=>n.k===vue);
        const moreLive=false;
        const Item=({ico,label,active,onClick,dot,badge})=><button onClick={onClick} className="bt" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"7px 2px 5px",background:"none",border:"none",cursor:"pointer",position:"relative",minHeight:56,fontFamily:"'Outfit',sans-serif"}}>
          <div style={{position:"relative",width:52,height:30,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",background:active?K.emBg:"transparent",transition:"background .2s"}}>
            <i className={`ti ti-${ico}`} style={{fontSize:22,color:active?K.em:K.t2,display:"block"}}/>
            {dot&&<span style={{position:"absolute",top:2,right:12,width:8,height:8,borderRadius:"50%",background:K.rd,border:`1.5px solid ${K.card}`,animation:"blink 1.5s ease-in-out infinite"}}/>}
            {!!badge&&<span style={{position:"absolute",top:-3,right:8,minWidth:17,height:17,borderRadius:99,background:K.rd,color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:`1.5px solid ${K.card}`}}>{badge>9?"9+":badge}</span>}
          </div>
          <span style={{fontSize:12,fontWeight:active?800:600,color:active?K.em:K.t2,whiteSpace:"nowrap"}}>{label}</span>
        </button>;
        return <>
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:99,background:`${K.card}f7`,backdropFilter:"blur(20px)",borderTop:`1px solid ${K.b0}`,boxShadow:"0 -6px 20px rgba(0,0,0,.06)",display:"flex",alignItems:"stretch",paddingBottom:"max(4px,env(safe-area-inset-bottom))"}}>
            {main.map(n=><Item key={n.k} ico={n.ico} label={n.label} active={gActif===n.k&&!showMore} badge={n.badgeCount} dot={n.live&&live} onClick={()=>{sShowMore(false);allerGroupe(n.k);}}/>)}
            <Item ico={showMore?"x":"layout-grid"} label="Plus" active={showMore||moreActive} dot={moreLive} badge={showMore?0:unreadMsg} onClick={()=>sShowMore(v=>!v)}/>
          </div>
          {showMore&&<div onClick={()=>sShowMore(false)} style={{position:"fixed",inset:0,zIndex:98,background:"rgba(0,0,0,.35)",backdropFilter:"blur(2px)",animation:"fadeIn .2s ease"}}>
            <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:10,right:10,bottom:"calc(72px + env(safe-area-inset-bottom))",background:K.card,border:`1px solid ${K.b0}`,borderRadius:22,padding:"16px 14px 14px",boxShadow:"0 18px 40px rgba(0,0,0,.25)",animation:"slideUp .25s cubic-bezier(.22,1,.36,1)"}}>
              <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:12,paddingLeft:4}}>Toutes les rubriques</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {more.map(n=>{const active=vue===n.k;const c={stages:"#0D7A6B",psycho:"#7C3AED",services:"#1D4ED8",msg:"#BE123C",sugg:"#C98A1B",apropos:"#475569"}[n.k]||K.em;return <button key={n.k} onClick={()=>{sShowMore(false);sV(n.k);}} className="bt" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"14px 6px 12px",background:active?K.emBg:K.c2,border:`1px solid ${active?K.emBd:K.b0}`,borderRadius:16,cursor:"pointer",fontFamily:"'Outfit',sans-serif",position:"relative"}}>
                  <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${c},${c}B0)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 14px ${c}35`}}><i className={`ti ti-${n.ico}`} style={{fontSize:21,color:"#fff"}}/></div>
                  <span style={{fontSize:13,fontWeight:700,color:active?K.em:K.t1}}>{n.label}</span>
                  {!!n.badgeCount&&<span style={{position:"absolute",top:8,right:8,fontSize:10,fontWeight:800,color:"#fff",background:K.rd,borderRadius:99,padding:"1px 6px"}}>{n.badgeCount>9?"9+":n.badgeCount}</span>}
                </button>;})}
              </div>
            </div>
          </div>}
        </>;
      })()}
      {codeModal}
    </>;
  }
  // ── DESKTOP NAV ──
  return <nav className="nb" style={{background:`${K.card}f0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",gap:4,height:56,position:"sticky",top:0,zIndex:99}}>
    <Logo/>
    <div style={{width:1,height:22,background:K.b0,margin:"0 6px",flexShrink:0}}/>
    <div className="tn" style={{flex:1,gap:2}}>
      {NAV_ITEMS.map(({k,ico,label,live:isLive,badgeCount})=>{
        const active=gActif===k;
        const hasLive=isLive&&live;
        return <button key={k} onClick={()=>allerGroupe(k)} className="bt" style={{display:"flex",alignItems:"center",gap:5,padding:"6px 8px",borderRadius:8,border:"none",cursor:"pointer",background:active?K.c2:"transparent",color:active?K.t1:K.t3,fontWeight:active?700:600,fontSize:13,whiteSpace:"nowrap",minHeight:34,fontFamily:"'Outfit',sans-serif",position:"relative",transition:"background .15s,color .15s"}}>
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
        ?<div style={{display:"flex",alignItems:"center",gap:5,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"4px 11px"}}><span style={{width:6,height:6,borderRadius:"50%",background:K.em,display:"inline-block",animation:"gw 2s ease-in-out infinite"}}/><span style={{fontSize:12,fontWeight:700,color:K.em}}>{u.dureeId==="v"?"∞ À vie":"✓ Actif"}</span></div>
        :<button onClick={onSub} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:800,color:"#FFFFFF",cursor:"pointer"}}>{LIB_ACCES}</button>
      }
      <Cloche K={K} db={db} uid={uid} role="apprenant" user={u} onGo={allerVue} taille={32}/>
      <button onClick={()=>sShowCode(true)} className="bt" title="J'ai un code" style={{width:32,height:32,borderRadius:"50%",background:K.c2,border:`1px solid ${K.b1}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
        <i className="ti ti-key" style={{fontSize:15,color:K.t2}}/>
      </button>
      <div onClick={()=>sV("param")} title="Paramètres" style={{display:"flex",alignItems:"center",gap:7,padding:"4px 9px 4px 5px",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:99,cursor:"pointer"}} className="bt">
        <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontWeight:800,fontSize:12}}>{(u.nom||"U")[0].toUpperCase()}</div>
        <span style={{color:K.t2,fontSize:13,fontWeight:600}}>{(u.nom||"").split(" ")[0]}</span>
        <i className="ti ti-settings" style={{fontSize:14,color:K.t3}}/>
      </div>
    </div>
    {codeModal}
  </nav>;
}

function Home({u,pr,sc,gp,nd,ok,mods,vids,onOpen,onSub,onVid,onPres,onStages,onEf,onFisc,onFin,onJrn,onCpt,onAudio,live,presCount=0,uid,onGo}){
  const K=useK();const{mob}=useW();const jr=jR(u.dateExpiration);
  const{tid}=useContext(Ctx);
  const mats=[...new Set(mods.map(m=>m.mat||"Général"))];
  const[showCode,sShowCode]=useState(false);
  const rHc=useRef();
  const[hcErr,sHcErr]=useState("");
  const[hcBusy,sHcBusy]=useState(false);
  const isSocial=(auth.currentUser?.providerData||[]).some(p=>p.providerId==="google.com"||p.providerId==="facebook.com");
  const annonces=useAnnonces();
  const[dismissed,sDismissed]=useState([]);
  const activeAnnonces=annonces.filter(a=>a.actif&&(!a.expireAt||new Date(a.expireAt)>=new Date())&&!dismissed.includes(a.id));
  const submitHomeCode=async()=>{
    sHcErr("");sHcBusy(true);
    try{
      const r=await activerCode(uid,rHc.current?.value);
      sHcBusy(false);if(r.err)return sHcErr(r.err);
      sShowCode(false);window.location.reload();
    }catch(e){sHcBusy(false);sHcErr(e.message);}
  };
  const recentMods=mods.filter(m=>pr[m.id]==="done").slice(-3).reverse();
  const isLight=['light','sepia'].includes(tid);

  // Raccourcis : le menu donne accès à tout le reste (src/nav/navigation.js)
  const aller=v=>onGo&&onGo(v);
  const features=[
    {key:"modules",ico:"book-2",label:"Modules de cours",desc:`${mods.length} cours SYSCOHADA avec QCM et exercices corrigés`,action:()=>aller("mods")},
    {key:"parcours",ico:"route",label:"Parcours métier",desc:"États financiers, Code des impôts et Finance d'entreprise",action:()=>aller("ef")},
    {key:"audio",ico:"headphones",label:"Écouter les cours",desc:"Leçons en audio, à écouter partout",action:()=>aller("audio")},
    {key:"res",ico:"trophy",label:"Mes résultats",desc:"Scores de tous vos QCM, badges et attestations",action:()=>aller("res")},
  ];

  return <div style={{animation:"up .3s ease"}}>
    {/* Annonces */}
    {activeAnnonces.map(a=>{
      const typeInfo={info:{bg:K.inBg,bd:K.inBd,col:K.in_,ico:"info-circle"},promo:{bg:K.waBg,bd:K.waBd,col:K.wa,ico:"gift"},urgent:{bg:K.erBg,bd:K.erBd,col:K.er,ico:"alert-triangle"}}[a.type||"info"];
      return <div key={a.id} style={{background:typeInfo.bg,border:`1px solid ${typeInfo.bd}`,borderRadius:12,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:10}}>
        <i className={`ti ti-${typeInfo.ico}`} style={{fontSize:16,color:typeInfo.col,marginTop:1,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:2}}>{a.titre}</div>
          <div style={{fontSize:13,color:K.t2,lineHeight:1.5}}>{a.contenu}</div>
        </div>
        <button onClick={()=>sDismissed(d=>[...d,a.id])} className="bt" style={{background:"none",border:"none",color:K.t3,cursor:"pointer",fontSize:16,lineHeight:1,padding:2,flexShrink:0}}>×</button>
      </div>;
    })}
    {/* Alertes */}
    {!ok&&<div style={{background:u.abonnement==="expiré"?K.erBg:K.waBg,border:`1px solid ${u.abonnement==="expiré"?K.erBd:K.waBd}`,borderRadius:12,padding:"11px 14px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div><div style={{fontWeight:700,fontSize:14,color:u.abonnement==="expiré"?K.er:K.wa,marginBottom:2}}>{u.abonnement==="expiré"?"Accès expiré":"Cours verrouillés"}</div><div style={{fontSize:13,color:K.t3}}>{u.abonnement==="demande"?"Demande en cours — code sous 24h.":u.abonnement==="expiré"?"Contactez Éco-Campus.":"Effectuez le paiement."}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{isSocial&&<Btn ch="J'ai un code" on={()=>sShowCode(true)} v="s" sm/>}{u.abonnement!=="demande"&&<Btn ch="Obtenir l'accès" on={onSub} v="w" sm/>}</div></div>}
    {ok&&jr<=30&&jr>0&&u.dureeId!=="v"&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"9px 14px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><div style={{fontSize:14,color:K.wa}}>⏰ Expire dans <b>{jr}j</b></div><Btn ch={PLAY_STORE?"Saisir un code":"Renouveler"} on={onSub} v="w" sm/></div>}

    {/* Bannière principale */}
    <div className="card-enter" style={{background:"linear-gradient(135deg,#001433 0%,#0A2A5C 55%,#1E4FA3 100%)",borderRadius:24,padding:mob?"22px 18px 20px":"30px 32px",marginBottom:20,position:"relative",overflow:"hidden",color:"#fff",boxShadow:"0 16px 36px rgba(10,42,92,.28)"}}>
      <div style={{position:"absolute",top:-60,right:-40,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
      <div style={{position:"absolute",bottom:-80,right:mob?-30:120,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
      {mob&&<div style={{position:"absolute",top:18,right:18,opacity:.13,fontSize:84,lineHeight:1,pointerEvents:"none"}}><i className="ti ti-school"/></div>}
      <div style={{position:"relative",display:"flex",gap:18,alignItems:"center",justifyContent:"space-between",flexWrap:mob?"wrap":"nowrap"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",background:"rgba(255,255,255,.14)",border:"1px solid rgba(255,255,255,.22)",borderRadius:99,padding:"5px 11px",marginBottom:12}}><i className="ti ti-sparkles" style={{fontSize:14}}/>Tableau de bord</div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:mob?27:34,fontWeight:800,marginBottom:6,letterSpacing:"-.4px",lineHeight:1.15}}>Bonjour, {(u.nom||"").split(" ")[0]} 👋</div>
          <div style={{fontSize:mob?15:16,color:"rgba(255,255,255,.86)",marginBottom:18,lineHeight:1.55,maxWidth:520}}>{!ok?"Abonnez-vous pour accéder à tous les cours.":nd===0?"Commencez votre parcours de formation dès aujourd'hui.":`${nd} module${nd>1?"s":""} sur ${mods.length} complété${nd>1?"s":""}. Continuez sur votre lancée !`}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            {[[`${nd}/${mods.length}`,"Modules","book-2"],[`${gp}%`,"Progression","trending-up"],[`${mats.length}`,"Matières","category"]].map(([v,l,ic])=><div key={l} style={{background:"rgba(255,255,255,.13)",backdropFilter:"blur(8px)",borderRadius:14,padding:"10px 14px",border:"1px solid rgba(255,255,255,.2)",minWidth:mob?0:96,flex:mob?1:"0 0 auto"}}>
              <div style={{fontSize:mob?20:22,fontWeight:900,lineHeight:1.1}}>{v}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.78)",marginTop:3,display:"flex",alignItems:"center",gap:4}}><i className={`ti ti-${ic}`} style={{fontSize:13}}/>{l}</div>
            </div>)}
          </div>
          <button onClick={ok?()=>aller("mods"):onSub} className="bt" style={{background:"#fff",color:"#0A2A5C",border:"none",borderRadius:12,padding:"12px 20px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 6px 18px rgba(0,0,0,.18)"}}>
            {ok?(nd===0?"Commencer":"Continuer mes cours"):LIB_ACCES}<i className="ti ti-arrow-right" style={{fontSize:17}}/>
          </button>
        </div>
        {!mob&&<div style={{flexShrink:0,background:"rgba(255,255,255,.1)",borderRadius:"50%",padding:10,border:"1px solid rgba(255,255,255,.18)"}}><ProgressRing pct={gp} size={124} stroke={10} col="#fff" track="rgba(255,255,255,.18)" txt="#fff"/></div>}
      </div>
    </div>

    {/* Bannière live */}
    {live.on&&<div onClick={onVid} className="hv" style={{background:`linear-gradient(135deg,${K.rdBg},${K.c2})`,border:`1px solid ${K.rdBd}`,borderRadius:13,padding:"13px 16px",marginBottom:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><div style={{width:42,height:42,borderRadius:12,background:K.rdBg,border:`1px solid ${K.rdBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-broadcast" style={{fontSize:20,color:K.rd,animation:"blink 1.5s ease-in-out infinite"}}/></div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:1}}>{live.titre||"Cours en direct"}</div><div style={{fontSize:12,color:K.t3}}>En cours maintenant · Rejoindre</div></div><Btn ch="▶ Rejoindre" v="r" sm sx={{flexShrink:0}}/></div>}

    {/* Recommandations personnalisées */}
    <Banniere K={K} mob={mob} db={db} uid={uid} user={u} onGo={v=>v==="acces"?onSub&&onSub():v==="fisc"?onFisc&&onFisc():v==="ef"?onEf&&onEf():v==="videos"?onVid&&onVid():v==="pres"?onPres&&onPres():onGo&&onGo(v)}/>
    <PourVous K={K} mob={mob} u={u} mods={mods} pr={pr} sc={sc} ok={ok} onOpen={onOpen} onSub={onSub} onEf={onEf} onFisc={onFisc}/>
    {/* Cartes fonctionnalités */}
    <div style={{marginBottom:22}}>
      <div className="h-sec" style={{color:K.t1,marginBottom:12}}>Accès rapide</div>
      <div className="gq">
        {features.map((f,i)=>{const[c1,c2]=TILE_COLORS[f.key]||TILE_COLORS.modules;return <div key={f.key} onClick={f.action} className="tile" style={{padding:mob?"16px 14px":"20px 18px",minHeight:mob?150:170,display:"flex",flexDirection:"column",animation:`slideUp .4s cubic-bezier(.22,1,.36,1) ${i*50}ms both`}}>
          <div style={{position:"absolute",top:-34,right:-34,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle,${c1}22,transparent 70%)`}}/>
          <div style={{width:mob?46:52,height:mob?46:52,borderRadius:15,background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:`0 8px 18px ${c1}45`,position:"relative"}}><i className={"ti ti-"+f.ico} style={{fontSize:mob?23:26,color:"#fff"}}/></div>
          <div style={{fontWeight:800,fontSize:mob?16:17,color:K.t1,marginBottom:4,letterSpacing:"-.2px"}}>{f.label}</div>
          <div style={{fontSize:13,color:K.t2,lineHeight:1.45,flex:1}}>{f.desc}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
            <span style={{fontSize:13,fontWeight:700,color:c1}}>Accéder</span>
            <span style={{width:30,height:30,borderRadius:"50%",background:`${c1}16`,display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-arrow-right" style={{fontSize:16,color:c1}}/></span>
          </div>
        </div>;})}
      </div>
    </div>

    {/* Récents */}
    {recentMods.length>0&&<div style={{marginTop:24}}>
      <div className="h-sec" style={{color:K.t1,marginBottom:12}}>Récemment complétés</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recentMods.map((m,i)=>{const s=sc[m.id];const cp=getCardPalette(tid,i);return <div key={m.id} onClick={()=>onOpen(m)} className="tile" style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:13,borderLeft:`4px solid ${cp.ac}`}}>
          <div style={{width:36,height:36,borderRadius:10,background:isLight?"rgba(255,255,255,.8)":K.b1,border:`1px solid ${cp.bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icoEl(m.ico,cp.ac,16)}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div><div style={{fontSize:12,color:K.t2,marginTop:1}}>{m.mat||"SYSCOHADA"}</div></div>
          {s&&<div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:800,fontSize:15,color:s.pct>=60?K.em:K.er}}>{s.pct}%</div><div style={{fontSize:11,color:K.t3}}>Score</div></div>}
        </div>;})}
      </div>
    </div>}
    {showCode&&<Sheet title="🔐 Code d'activation" onClose={()=>sShowCode(false)}>
      <Inp lb="Code d'activation" rf={rHc} ph="EC-XXXXXXXX, OF-XXXXXXXX ou FO-XXXXXXXX" mono note="Code d'accès, code offert ou code formateur"/>
      {hcErr&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{hcErr}</div>}
      <Btn ch={hcBusy?"…":"Valider →"} on={submitHomeCode} full dis={hcBusy}/>
    </Sheet>}
  </div>;
}

function SubM({onClose,uid,u}){
  const K=useK();const cfg=usePaiement(db);const offres=offresAvecPrix(cfg);const nums=numerosRenseignes(cfg);
  const a=u.abonnement==="demande";
  const[o,sO]=useState(OFFRES.some(x=>x.id===u.demandeOffre)?u.demandeOffre:"t");
  const[err,sErr]=useState(""),[busy,sBusy]=useState(false),[copie,sCopie]=useState("");
  const[cErr,sCErr]=useState(""),[cBusy,sCBusy]=useState(false);
  const rRef=useRef(),rTel=useRef(),rCode=useRef();
  const off=offres.find(x=>x.id===o)||offres[1];
  const ask=async()=>{
    const ref=rRef.current?.value?.trim()||"",tel=rTel.current?.value?.trim()||"";
    sErr("");if(!ref)return sErr("Indiquez la référence de la transaction, reçue par SMS après le paiement.");
    sBusy(true);
    try{
      await saveUserData(uid,{abonnement:"demande",demandeDate:new Date().toLocaleDateString("fr-FR"),demandeOffre:off.id,demandeRef:ref.slice(0,60),demandeTel:tel.slice(0,30)});
      notifier({dest:"admin",type:"message",titre:`Demande d'accès : ${off.l} (${fUSD(off.prix)})`,texte:`${u.nom||u.mail||""} · Réf. ${ref}${tel?` · ${tel}`:""}`,vue:"d",auteurNom:u.nom||""});
      onClose();
    }catch(e){sErr("Envoi impossible. Vérifiez votre connexion et réessayez.");}
    sBusy(false);
  };
  const code=async()=>{
    sCErr("");sCBusy(true);
    try{const r=await activerCode(uid,rCode.current?.value);sCBusy(false);if(r.err)return sCErr(r.err);window.location.reload();}
    catch(e){sCBusy(false);sCErr(e.message);}
  };
  const copier=v=>{try{navigator.clipboard.writeText(v);sCopie(v);setTimeout(()=>sCopie(""),1800);}catch(e){}};
  const boite={background:K.bg,border:`1px solid ${K.b0}`,borderRadius:12,padding:"12px 14px",marginBottom:12};
  const Numeros=({rappel=true})=><div style={boite}>
    <div style={{fontWeight:800,fontSize:14.5,color:K.t1,marginBottom:8}}>Payez {fUSD(off.prix)} par Mobile Money</div>
    {nums.length?nums.map(n=><div key={n.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"6px 0",borderTop:`1px solid ${K.b0}`}}>
      <span style={{fontSize:13.5,color:K.t2}}>{n.l}</span>
      <button onClick={()=>copier(cfg[n.k])} className="bt" title="Copier le numéro" style={{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:14,color:K.em}}>{cfg[n.k]}<i className={`ti ti-${copie===cfg[n.k]?"check":"copy"}`} style={{fontSize:15}}/></button>
    </div>):<div style={{fontSize:13.5,color:K.t2,lineHeight:1.6}}>Les numéros de paiement seront bientôt affichés ici. En attendant, écrivez-nous à <b>gnkuli@outlook.fr</b>.</div>}
    {cfg?.beneficiaire&&<div style={{fontSize:13,color:K.t2,marginTop:6}}>Bénéficiaire : <b style={{color:K.t1}}>{cfg.beneficiaire}</b></div>}
    {rappel&&<div style={{fontSize:12.5,color:K.t3,marginTop:6,lineHeight:1.5}}>Gardez le SMS de confirmation : sa référence est demandée ci-dessous.</div>}
  </div>;
  if(PLAY_STORE)return <Sheet title="Activer mon accès" onClose={onClose}>
    <div style={{color:K.t2,fontSize:14,marginBottom:12,lineHeight:1.55}}>Saisissez le code d'accès qui vous a été remis par Éco-Campus RDC : tous les contenus s'ouvrent aussitôt.</div>
    <Inp lb="Code d'accès ou code offert" rf={rCode} ph="EC-XXXXXXXX ou OF-XXXXXXXX" mono/>
    {cErr&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{cErr}</div>}
    <Btn ch={cBusy?"Vérification…":"Activer mon code"} on={code} full dis={cBusy} sx={{minHeight:46}}/>
  </Sheet>;
  return <Sheet title="Obtenir l'accès" onClose={onClose}>
    {a?<div style={{padding:"2px 0"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>⏳</div><div style={{fontWeight:800,fontSize:15.5,color:K.t1,marginBottom:5}}>Demande en cours de vérification</div>
      <div style={{color:K.t3,fontSize:14,lineHeight:1.7,marginBottom:12}}>Envoyée le <b style={{color:K.t2}}>{u.demandeDate}</b>{u.demandeOffre&&<> · offre <b style={{color:K.t2}}>{(offres.find(x=>x.id===u.demandeOffre)||{}).l}</b></>}{u.demandeRef&&<> · réf. <b style={{color:K.t2,fontFamily:"'JetBrains Mono',monospace"}}>{u.demandeRef}</b></>}.<br/>Votre code d'accès arrive sous 24 h, par message et par e-mail.</div></div>
      <Numeros rappel={false}/>
      <Btn ch="Fermer" on={onClose} v="g" full sx={{minHeight:44}}/>
    </div>:<>
      <div style={{color:K.t2,fontSize:14,marginBottom:12,lineHeight:1.55}}>Chaque abonnement donne accès à <b style={{color:K.t1}}>tous les contenus</b> pendant sa durée.</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>{offres.map(x=>{const sel=x.id===o;return <button key={x.id} onClick={()=>sO(x.id)} className="bt" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,textAlign:"left",padding:"12px 14px",borderRadius:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",background:sel?K.emBg:K.c2,border:`${sel?2:1}px solid ${sel?K.em:K.b0}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><i className={`ti ti-${sel?"circle-check":"circle"}`} style={{fontSize:20,color:sel?K.em:K.t3}}/>
          <div><div style={{fontWeight:800,fontSize:15,color:K.t1}}>{x.l} <span style={{fontWeight:600,fontSize:13,color:K.t3}}>· {x.duree}</span></div>{x.mois>1&&<div style={{fontSize:12.5,color:K.t3}}>soit {fUSD(parMois(x))} par mois</div>}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:K.t1}}>{fUSD(x.prix)}</div>{x.badge&&<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={x.badge}/>}</div>
      </button>;})}</div>
      <div style={{...boite,background:"transparent"}}>{INCLUS.map(f=><div key={f} style={{display:"flex",gap:7,fontSize:13.5,color:K.t2,marginBottom:3}}><span style={{color:K.em}}>✓</span>{f}</div>)}</div>
      <Numeros/>
      <Inp lb="Référence de la transaction" rf={rRef} ph="Ex. : PP261022.1430.A12345" mono note="Indiquée dans le SMS de confirmation"/>
      <Inp lb="Numéro utilisé pour payer (facultatif)" rf={rTel} type="tel" ph="+243 …"/>
      {err&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{err}</div>}
      <Btn ch={busy?"Envoi…":`J'ai payé ${fUSD(off.prix)} — Envoyer ma demande`} on={ask} full dis={busy} sx={{padding:"12px",fontSize:14,minHeight:46}}/>
      <div style={{borderTop:`1px solid ${K.b0}`,margin:"16px 0 12px"}}/>
      <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:8}}>Vous avez reçu un code ?</div>
      <Inp lb="Code d'accès ou code offert" rf={rCode} ph="OF-XXXXXXXX ou EC-XXXXXXXX" mono/>
      {cErr&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{cErr}</div>}
      <Btn ch={cBusy?"Vérification…":"Activer mon code"} on={code} v="g" full dis={cBusy} sx={{minHeight:44}}/>
    </>}
  </Sheet>;
}

function MV({mod,sc,ok,onQ,onOpenQ,onMarkDone,doneNoEval,openAnswer,onBack,onSub,vids,pdf,uid,uNom}){
  const K=useK();const{mob}=useW();
  const[pl,sPl]=useState(null),[plIdx,sPlIdx]=useState(0),[pdfO,sPdfO]=useState(false),[corr,sCorr]=useState(false),[exO,sExO]=useState(false);
  const[contact,sContact]=useState(false),[cTxt,sCTxt]=useState(""),[cSending,sCSending]=useState(false),[cSent,sCSent]=useState(false);
  const ex=mod.ex;
  const segsAudio=useMemo(()=>texteModuleCours(mod,ok),[mod,ok]);
  return <div style={{maxWidth:640,margin:"0 auto",animation:"up .25s ease"}}>
    {pl&&<Player url={pl.url} titre={pl.titre} onClose={()=>{sPl(null);sPlIdx(0);}} playlist={vids.map(v=>({url:v.url,titre:v.titre,gr:v.gr}))} startIdx={plIdx}/>}
    {pdfO&&pdf&&<PdfV url={pdf.url} name={pdf.name} onClose={()=>sPdfO(false)}/>}
    <button onClick={onBack} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:14,cursor:"pointer",marginBottom:13,padding:"5px 0",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>← Retour</button>
    {mod.createdBy&&ok&&<button onClick={()=>{sContact(true);sCSent(false);}} className="bt" style={{background:K.c2,border:`1px solid ${K.b1}`,color:K.t2,borderRadius:99,padding:"5px 13px",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:13,marginLeft:10,fontFamily:"'Outfit',sans-serif"}}>💬 Contacter le formateur</button>}
    {contact&&<Sheet title="💬 Message au formateur" onClose={()=>sContact(false)}>
      {cSent?<div style={{textAlign:"center",padding:"14px 0"}}><div style={{fontSize:30,marginBottom:8}}>✅</div><div style={{fontSize:14,color:K.t1,fontWeight:700,marginBottom:4}}>Message envoyé !</div><div style={{fontSize:13,color:K.t3}}>Retrouvez la réponse dans votre onglet Messages.</div></div>
      :<><div style={{fontSize:13,color:K.t3,marginBottom:10}}>À propos de : <b style={{color:K.t1}}>{mod.titre}</b></div>
      <textarea value={cTxt} onChange={e=>sCTxt(e.target.value)} rows={4} placeholder="Votre question au formateur…" style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>
      <Btn ch={cSending?"Envoi…":"Envoyer"} dis={cSending||!cTxt.trim()} on={async()=>{sCSending(true);try{await sendMessage({apprenantUid:uid,apprenantNom:uNom,from:uid,fromNom:uNom,fromRole:"apprenant",texte:`[${mod.titre}] ${cTxt.trim()}`,formateurUid:mod.createdBy});sCTxt("");sCSent(true);}catch(e){alert(e.message);}sCSending(false);}} full/></>}
    </Sheet>}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"13px":"18px 20px",marginBottom:10}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}><div style={{width:42,height:42,borderRadius:11,background:`${mod.col}18`,border:`1px solid ${mod.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icoEl(mod.ico,mod.col,20)}</div><div><Tg c={K.t3} bg="none" bd={K.b0} ch={mod.code}/>{mod.mat&&<span style={{marginLeft:7}}><Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={mod.mat}/></span>}<div style={{fontWeight:800,fontSize:mob?14:17,color:K.t1,marginTop:5,marginBottom:3}}>{mod.titre}</div><div style={{color:K.t3,fontSize:13}}>{mod.desc||""}</div></div></div>
      <div style={{marginBottom:10}}><LecteurAudio K={K} segments={segsAudio} titre={ok&&ex?"Écouter le module et l'exercice":"Écouter le module"}/></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["❓",`${mod.q?.length||0}q`],["📝","Exercice"],vids.length>0?["🎬",`${vids.length} vid.`]:null,pdf?["📄","PDF"]:null].filter(Boolean).map(([ic,v])=><div key={v} style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,padding:"4px 9px",fontSize:12,color:K.t2,display:"flex",alignItems:"center",gap:3}}>{ic} {v}</div>)}</div>
    </div>
    {sc&&ok&&<div style={{background:sc.pct>=60?K.emBg:K.erBg,border:`1px solid ${sc.pct>=60?K.emBd:K.erBd}`,borderRadius:11,padding:"10px 13px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:K.t2,fontSize:14}}>Dernier résultat</span><span style={{color:sc.pct>=60?K.em:K.er,fontWeight:700,fontSize:14}}>{sc.s}/{sc.t} — {sc.pct}%</span></div><Bar p={sc.pct} col={sc.pct>=60?K.em:K.er} h={4}/></div>}
    {vids.length>0&&<div style={{background:K.card,border:`1px solid ${K.rdBd}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}><div style={{padding:"11px 13px",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",gap:7}}><span>🎬</span><span style={{fontWeight:700,fontSize:14,color:K.t1}}>Vidéos</span><Tg c={K.rd} bg={K.rdBg} bd={K.rdBd} ch={`${vids.length}`}/></div><div style={{padding:"9px 11px",display:"flex",flexDirection:"column",gap:6}}>{vids.map(v=>{const lk=!v.gr&&!ok;const pv=pVid(v.url);return <div key={v.id} onClick={()=>lk?onSub():(sPlIdx(vids.indexOf(v)),sPl({url:v.url,titre:v.titre}))} className="bt" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",background:K.c2,borderRadius:9,cursor:"pointer",border:`1px solid ${K.b0}`,opacity:lk?.7:1}}><div style={{width:34,height:26,borderRadius:6,background:"rgba(0,0,0,.3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:13}}>{lk?"🔒":"▶"}</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,color:lk?K.t3:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div></div>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}</div>;})} </div></div>}
    {ex&&<div style={{background:K.card,border:`1px solid ${exO?K.inBd:K.b0}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
      <button onClick={()=>sExO(o=>!o)} className="bt" style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:30,height:30,borderRadius:8,background:ok?K.inBg:"rgba(128,128,128,.08)",border:`1px solid ${ok?K.inBd:K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{ok?"📝":"🔒"}</div><div style={{textAlign:"left"}}><div style={{fontWeight:700,fontSize:14,color:K.t1}}>Exercice pratique</div><div style={{fontSize:12,color:K.t3,marginTop:1}}>{ex.ti}</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>{pdf&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch="📄 PDF"/>}<span style={{color:K.t3,fontSize:15,transform:exO?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▾</span></div>
      </button>
      {exO&&<div style={{borderTop:`1px solid ${K.b0}`,padding:"13px"}}>
        {!ok?<div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontSize:22,marginBottom:5}}>🔒</div><div style={{color:K.t3,fontSize:14}}>Abonnés actifs uniquement.</div></div>:<>
          <div style={{background:K.c2,borderRadius:9,padding:"10px 12px",marginBottom:10}}><div style={{color:K.t3,fontSize:11,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Énoncé</div><div style={{color:K.t1,fontSize:14,lineHeight:1.7}}>{ex.en}</div></div>
          {ex.dn?.length>0&&<div style={{marginBottom:10}}><div style={{color:K.t3,fontSize:11,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Données</div><div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:8,overflow:"hidden"}}>{ex.dn.map((row,i)=><div key={i} style={{display:"flex",padding:"7px 11px",borderBottom:i<ex.dn.length-1?`1px solid ${K.b0}`:"none",gap:9}}>{[row.a,row.b,row.c].filter(v=>v!==undefined).map((v,j)=><span key={j} style={{color:j===0?K.t2:K.t1,fontFamily:j>0?"'JetBrains Mono',monospace":"'Outfit',sans-serif",fontSize:j>0?12:13,flex:j===0?1:"none",fontWeight:j>0?600:400}}>{v}</span>)}</div>)}</div></div>}
          {ex.tv?.length>0&&<div style={{marginBottom:10}}><div style={{color:K.t3,fontSize:11,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>Travail demandé</div>{ex.tv.map((t,i)=><div key={i} style={{display:"flex",gap:8,background:K.c2,borderRadius:8,padding:"8px 11px",marginBottom:4}}><div style={{width:18,height:18,borderRadius:5,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:K.in_,flexShrink:0}}>{i+1}</div><div style={{color:K.t1,fontSize:14,lineHeight:1.6}}>{t}</div></div>)}</div>}
          <button onClick={()=>sCorr(c=>!c)} className="bt" style={{background:corr?K.emBg:K.c2,border:`1px solid ${corr?K.emBd:K.b0}`,borderRadius:8,padding:"7px 11px",cursor:"pointer",color:corr?K.em:K.t3,fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5,width:"100%",minHeight:34}}><span>{corr?"🔼":"🔽"}</span><span>{corr?"Masquer le corrigé":"Voir le corrigé"}</span></button>
          {corr&&<div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:8,padding:"10px 12px",marginTop:6}}><div style={{color:K.em,fontSize:13,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"}}>{ex.co}</div></div>}
          {pdf&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${K.b0}`}}>
            {miniatureLien(pdf.url)&&<div onClick={()=>sPdfO(true)} className="hv" style={{cursor:"pointer",marginBottom:8,display:"flex",justifyContent:"center"}}><Miniature url={pdf.url} w={150} h={200} r={10} K={K} alt={pdf.name}/></div>}
            <Btn ch="📄 Ouvrir PDF" on={()=>sPdfO(true)} v="i" full sx={{minHeight:40,fontSize:14}}/></div>}
        </>}
      </div>}
    </div>}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"13px":"16px 18px"}}>
      {!ok?<div style={{textAlign:"center",padding:"7px 0"}}><div style={{fontSize:28,marginBottom:7}}>🔒</div><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Module verrouillé</div><div style={{color:K.t3,fontSize:13,marginBottom:12}}>Réservé aux apprenants disposant d'un accès actif.</div><Btn ch={`${LIB_ACCES} →`} on={onSub} v="w" sx={{minHeight:44}}/></div>
      :mod.evalType==="none"?<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Sans évaluation</div><div style={{color:K.t3,fontSize:13,marginBottom:13}}>Ce module ne comporte pas de test noté.</div><Btn ch={doneNoEval?"✓ Terminé":"Marquer comme terminé"} on={onMarkDone} dis={doneNoEval} sx={{minHeight:44,fontSize:14}}/></>
      :mod.evalType==="open"?<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Questions ouvertes</div><div style={{color:K.t3,fontSize:13,marginBottom:13}}>{mod.openQ?.length||0} question(s) · Corrigé par votre formateur</div>{openAnswer?<div style={{background:openAnswer.graded?K.emBg:K.waBg,border:`1px solid ${openAnswer.graded?K.emBd:K.waBd}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:openAnswer.graded?K.em:K.wa,fontWeight:600}}>{openAnswer.graded?`✓ Corrigé — ${openAnswer.totalPoints}/${openAnswer.maxPoints} pts (${openAnswer.pct}%)`:"⏳ En attente de correction par le formateur"}</div>:<Btn ch="Répondre →" on={onOpenQ} sx={{minHeight:44,fontSize:14}} dis={!mod.openQ?.length}/>}</>
      :<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Évaluation QCM</div><div style={{color:K.t3,fontSize:13,marginBottom:13}}>{mod.q?.length||0} questions · Feedback immédiat</div><Btn ch={sc?"Repasser →":"Commencer →"} on={onQ} sx={{minHeight:44,fontSize:14}} dis={!mod.q?.length}/></>}
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
      <span style={{color:K.t3,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{qs.length} question{qs.length>1?"s":""} · {maxPoints} pts</span>
    </div>
    <div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:10,padding:"10px 13px",marginBottom:15,fontSize:13,color:K.t2}}>
      ✍️ Répondez librement à chaque question. Votre formateur corrigera et notera vos réponses — le score final apparaîtra dans votre progression une fois la correction faite.
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {qs.map((q,i)=><div key={q.id} style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"14px":"16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9,gap:8}}>
          <div style={{color:K.t1,fontSize:mob?13:14,fontWeight:700,lineHeight:1.45}}>{i+1}. {q.q}</div>
          <span style={{flexShrink:0,fontSize:11,fontWeight:700,color:K.t3,background:K.c2,borderRadius:99,padding:"2px 8px"}}>{q.points} pts</span>
        </div>
        <textarea value={answers[q.id]} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Votre réponse..." rows={4}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box"}}/>
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
  if(fin){const s=log.filter(l=>l.ok).length,p=Math.round(s/tot*100),w=p>=60;return <div style={{maxWidth:530,margin:"0 auto",animation:"sc .28s ease"}}><div style={{background:K.card,border:`1px solid ${w?K.emBd:K.erBd}`,borderRadius:14,padding:mob?"19px 15px":"26px 22px",textAlign:"center"}}><div style={{fontSize:48,marginBottom:8}}>{w?"🏆":"📚"}</div><div style={{fontWeight:800,fontSize:19,color:K.t1,marginBottom:3}}>{w?"Réussi !":"À retravailler"}</div><div style={{color:K.t3,fontSize:13,marginBottom:15}}>{mod.titre}</div><div style={{fontWeight:900,fontSize:40,letterSpacing:"-.5px",marginBottom:3,background:`linear-gradient(135deg,${w?K.em:K.er},${w?K.in_:"#FCA5A5"})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s}/{tot}</div><div style={{color:K.t3,fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>{p}%</div><div style={{color:w?K.em:K.er,fontWeight:700,marginBottom:17}}>{p>=80?"Excellent":p>=60?"Bien":p>=40?"Passable":"Insuffisant"}</div><div style={{maxWidth:190,margin:"0 auto 18px"}}><Bar p={p} col={w?K.em:K.er} h={5}/></div><div style={{textAlign:"left",marginBottom:17}}><div style={{color:K.t3,fontSize:13,marginBottom:6,fontWeight:600}}>Correction</div>{log.map((l,i)=><div key={i} style={{background:l.ok?K.emBg:K.erBg,border:`1px solid ${l.ok?K.emBd:K.erBd}`,borderRadius:8,padding:"7px 10px",marginBottom:4}}><div style={{color:K.t3,fontSize:12,marginBottom:2}}>Q{i+1} · {l.txt}</div><div style={{color:l.ok?K.em:K.er,fontWeight:600,fontSize:13}}>{l.ok?"✓ Correct":`✗ Faux · ${l.r[l.bon]}`}</div></div>)}</div><div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}><Btn ch="Recommencer" on={()=>{sQi(0);sSel(null);sCf(false);sLog([]);sFin(false);}} v="g" sx={{minHeight:42}}/><Btn ch="Enregistrer →" on={()=>onDone(s,tot)} sx={{minHeight:42}}/></div></div></div>;}
  return <div style={{maxWidth:600,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}><Btn ch="Quitter" on={onBack} v="g" sm/><span style={{color:K.t3,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{mod.code} · {qi+1}/{tot}</span><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={`${log.filter(l=>l.ok).length} ✓`}/></div>
    <div style={{marginBottom:17}}><Bar p={Math.round(qi/tot*100)} col={mod.col} h={3}/></div>
    <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"15px 13px":"20px 18px"}}>
      <div style={{color:K.t3,fontSize:11,fontWeight:700,letterSpacing:"1.5px",marginBottom:8,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>Question {qi+1}</div>
      <div style={{color:K.t1,fontSize:mob?14:15,fontWeight:700,lineHeight:1.45,marginBottom:19}}>{q.q}</div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:19}}>
        {q.r.map((op,oi)=>{let bg=K.c2,bd=K.b0,col=K.t2;if(conf){if(oi===q.b){bg=K.emBg;bd=K.em;col=K.em;}else if(oi===sel){bg=K.erBg;bd=K.er;col=K.er;}}else if(sel===oi){bg=`${mod.col}15`;bd=mod.col;col=K.t1;}return <button key={oi} onClick={()=>{if(!conf)sSel(oi);}} style={{padding:"11px 12px",background:bg,border:`1.5px solid ${bd}`,borderRadius:10,cursor:conf?"default":"pointer",color:col,fontSize:14,fontWeight:600,textAlign:"left",transition:"all .15s",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:8,minHeight:46}}><span style={{width:22,height:22,borderRadius:6,background:`${bd}20`,border:`1px solid ${bd}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:bd,flexShrink:0}}>{["A","B","C","D"][oi]}</span><span style={{flex:1}}>{op}</span>{conf&&oi===q.b&&<span style={{color:K.em}}>✓</span>}{conf&&oi===sel&&oi!==q.b&&<span style={{color:K.er}}>✗</span>}</button>;})}
      </div>
      {!conf?<Btn ch="Valider" on={val} dis={sel===null} full sx={{minHeight:44,fontSize:14}}/>:<Btn ch={qi+1<tot?"Suivant →":"Résultats →"} on={nxt} full sx={{minHeight:44,fontSize:14}}/>}
    </div>
  </div>;
}

// ── SOUS-RUBRIQUES ───────────────────────────────────────────────────────────
// Écrans de la rubrique en cours (src/nav/navigation.js), sous le menu principal ; rien si la rubrique n'en a qu'un
function SousNav({groupes,vue,onGo,badges={},c1,c2}){
  const K=useK();const g=groupeDe(groupes,vue);
  if(!g||g.vues.length<2)return null;
  const a1=c1||K.emD,a2=c2||K.em;
  return <div className="tn" style={{gap:6,marginBottom:14,paddingBottom:3,alignItems:"center"}}>
    <span style={{fontSize:11.5,fontWeight:800,color:K.t3,textTransform:"uppercase",letterSpacing:.6,marginRight:2,whiteSpace:"nowrap",flexShrink:0}}>{g.label}</span>
    {g.vues.map(([k,ico,label])=>{const a=vue===k,b=badges[k]||0;return <button key={k} onClick={()=>onGo(k)} className="bt" style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:a?800:600,flexShrink:0,
      background:a?`linear-gradient(135deg,${a1},${a2})`:K.card,color:a?"#fff":K.t2,border:a?"1px solid transparent":`1px solid ${K.b0}`,boxShadow:a?`0 4px 12px ${a2}35`:"none"}}>
      <i className={`ti ti-${ico}`} style={{fontSize:15,color:a?"#fff":K.t3}}/>{label}
      {b>0&&<span style={{background:a?"rgba(255,255,255,.25)":K.rd,color:"#fff",borderRadius:99,fontSize:11,fontWeight:800,padding:"0 6px",minWidth:18,textAlign:"center",lineHeight:"17px"}}>{b}</span>}
    </button>;})}
  </div>;
}

// ── MODULES DE COURS (rubrique Apprendre) : catalogue, recherche et filtre par matière ──
function ModulesCours({mods,pr,sc,ok,vids,onOpen,uid,onSub}){
  const K=useK();
  const[pdfMod,setPdfMod]=useState(null),[fi,sF]=useState("Toutes"),[modQ,sModQ]=useState("");
  const mats=[...new Set(mods.map(m=>m.mat||"Général"))];
  const filMat=fi==="Toutes"?mods:mods.filter(m=>(m.mat||"Général")===fi);
  const fil=modQ.trim()?filMat.filter(m=>(m.titre||"").toLowerCase().includes(modQ.toLowerCase())||(m.desc||"").toLowerCase().includes(modQ.toLowerCase())):filMat;
  return <div style={{animation:"fadeIn .3s ease"}}>
    {/* Modules */}
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:7}}>
        <div className="h-sec" style={{color:K.t1}}>Modules de cours <span style={{color:K.t3,fontWeight:500,fontSize:15,fontFamily:"'Outfit',sans-serif"}}>({fil.length})</span></div>
        {!ok&&<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="🔒 Abonnement requis"/>}
      </div>
      <div style={{position:"relative",marginBottom:11}}>
        <i className="ti ti-search" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:K.t3}}/>
        <input value={modQ} onChange={e=>sModQ(e.target.value)} placeholder="Rechercher un module…"
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"9px 12px 9px 32px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
        {modQ&&<button onClick={()=>sModQ("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:K.t3,cursor:"pointer",fontSize:15,padding:2}}>×</button>}
      </div>
      {mats.length>1&&<div className="tn" style={{gap:6,marginBottom:11,paddingBottom:3}}>{["Toutes",...mats].map(m=><button key={m} onClick={()=>sF(m)} className="bt" style={{background:fi===m?K.c2:"transparent",border:`1px solid ${fi===m?K.b1:K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:600,color:fi===m?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{m}</button>)}</div>}
      {fil.length===0&&modQ&&<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"20px",textAlign:"center",fontSize:14,color:K.t3,marginBottom:11}}>Aucun module ne correspond à « {modQ} ».</div>}
      <div className="gm">
        {fil.map((m,i)=>{
          const f=pr[m.id]==="done",s=sc[m.id],lk=!ok;
          const c=lk?K.t3:(m.col||K.em);
          return <div key={m.id} onClick={()=>onOpen(m)} className="tile" style={{display:"flex",flexDirection:"column",animation:`slideUp .4s cubic-bezier(.22,1,.36,1) ${i*40}ms both`,opacity:lk?.72:1}}>
            <div style={{height:6,background:lk?K.b1:`linear-gradient(90deg,${c},${c}88)`}}/>
            <div style={{padding:"14px 14px 15px",display:"flex",flexDirection:"column",flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                <div style={{width:42,height:42,borderRadius:13,background:lk?K.c2:`${c}16`,border:`1px solid ${lk?K.b0:c+"30"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {lk?<i className="ti ti-lock" style={{fontSize:18,color:K.t3}}/>:icoEl(m.ico,c,20)}
                </div>
                {f&&s?<Tg c={s.pct>=60?K.em:K.er} bg={s.pct>=60?K.emBg:K.erBg} bd={s.pct>=60?K.emBd:K.erBd} ch={`${s.pct}%`}/>:f?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="✓"/>:null}
              </div>
              {m.mat&&<div style={{fontSize:11,color:c,marginBottom:4,fontWeight:800,textTransform:"uppercase",letterSpacing:.5}}>{m.mat}</div>}
              <div style={{fontWeight:800,fontSize:15,color:lk?K.t2:K.t1,marginBottom:6,lineHeight:1.3,flex:1}}>{m.titre}</div>
              <div style={{fontSize:12,color:K.t3,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:3}}><i className="ti ti-help-circle" style={{fontSize:13}}/>{m.q?.length||0} question{(m.q?.length||0)>1?"s":""}</span>
                {vids.some(v=>v.mid===m.id)&&<span style={{display:"inline-flex",alignItems:"center",gap:3}}><i className="ti ti-video" style={{fontSize:13}}/>Vidéo</span>}
              </div>
              <Bar p={lk?0:f?100:0} col={c} h={5}/>
              <div style={{marginTop:10,fontSize:13,fontWeight:700,color:lk?K.t3:c,display:"flex",alignItems:"center",gap:4}}>
                {lk?<><i className="ti ti-lock" style={{fontSize:13}}/><span>Verrouillé</span></>:f?<><i className="ti ti-circle-check" style={{fontSize:14}}/><span>Complété</span></>:<><span>Commencer</span><i className="ti ti-arrow-right" style={{fontSize:14}}/></>}
              </div>
              {m.slideUrl&&!lk&&miniatureLien(m.slideUrl)&&<div onClick={e=>{e.stopPropagation();setPdfMod(m);}} style={{marginTop:10,cursor:"pointer"}}><Miniature url={m.slideUrl} w="100%" h={110} r={9} K={K} alt={`Slides — ${m.titre}`}/></div>}
              {m.slideUrl&&!lk&&<button onClick={e=>{e.stopPropagation();setPdfMod(m);}} className="bt"
                style={{marginTop:10,width:"100%",background:"#F59E0B14",border:"1px solid #F59E0B30",borderRadius:9,padding:"7px 8px",color:"#D97706",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <i className="ti ti-file-text" style={{fontSize:13}}/>Slides PDF
              </button>}
            </div>
          </div>;
        })}
      </div>
    </div>

    {!ok&&onSub&&<div style={{display:"flex",justifyContent:"center",marginTop:16}}><Btn ch={LIB_ACCES} on={onSub}/></div>}
    {pdfMod&&<PdfV url={pdfMod.slideUrl} name={pdfMod.titre} onClose={()=>setPdfMod(null)} modId={pdfMod.id} uid={uid} showRating={true}/>}
  </div>;
}

// ── MES RÉSULTATS : progression, scores de tous les QCM, badges et attestations ──
// QCM : modules de cours (clé = id), Code des impôts (FISC-…), Finance d'entreprise (FIN-…) → moyenne.
// Exercices pratiques (« Quel compte ? » CPT-…, monographie JRN-ZAO) : suivis à part, hors moyenne (voir ef/syscohada/scores.js).
function MesResultats({pr,sc,gp,nd,ok,mods,u,uid,onSub,onGo}){
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const isLight=['light','sepia'].includes(tid);
  const[onglet,sOnglet]=useState("cours");
  const aller=v=>onGo&&onGo(v);
  const L={
    cours:mods.map(m=>({cle:m.id,titre:m.titre,sous:m.mat||"",s:sc[m.id],fait:pr[m.id]==="done",ico:m.ico,col:m.col,go:"mods"})),
    fisc:MODULES_FISC.map(m=>({cle:`FISC-${m.id}`,titre:`${m.id} · ${m.titre}`,sous:"Code des impôts",s:sc[`FISC-${m.id}`],col:m.col,go:"fisc"})),
    fin:MODULES_FIN.map(m=>({cle:`FIN-${m.id}`,titre:`${m.id} · ${m.titre}`,sous:"Finance d'entreprise",s:sc[`FIN-${m.id}`],col:m.col,go:"fin"})),
    exo:[{cle:"JRN-ZAO",titre:"Monographie ZAO IMMO : du journal aux états financiers",sous:"États financiers",s:sc["JRN-ZAO"],go:"jrn"},
      ...CLES_CPT.map(c=>({cle:c,titre:c==="CPT-T"?"« Quel compte ? » : toutes les classes":`« Quel compte ? » : classe ${c.slice(4)}`,sous:"Guide des comptes",s:sc[c],go:"cpt"}))],
  };
  const qcm=[...L.cours,...L.fisc,...L.fin].filter(x=>x.s&&x.s.pct!=null);
  const moy=moyenne(qcm.map(x=>x.s.pct)),best=qcm.length?Math.max(...qcm.map(x=>x.s.pct)):null;
  const reussis=qcm.filter(x=>x.s.pct>=60).length;
  const ONGLETS=[["cours","book-2","Modules de cours"],["fisc","receipt-tax","Code des impôts"],["fin","chart-pie","Finance d'entreprise"],["exo","pencil","Exercices pratiques"]];
  const nFaits=k=>L[k].filter(x=>(x.s&&x.s.pct!=null)||x.fait).length;
  const liste=L[onglet];
  return <div style={{maxWidth:760,margin:"0 auto",animation:"fadeIn .3s ease"}}>
    <div style={{background:`linear-gradient(135deg,${K.wa}18,${K.em}10)`,border:`1px solid ${K.waBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:13,color:K.wa,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-trophy" style={{fontSize:14}}/> Mes résultats</div>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",flexWrap:"wrap",gap:14,margin:"8px 0 14px"}}>
        {[["Modules de cours terminés",gp,K.em],["Moyenne des QCM",moy||0,"#3B82F6"],["Meilleur score",best||0,"#F59E0B"]].map(([l,pct,col])=><div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
          <ProgressRing pct={pct} size={72} stroke={6} col={col}/><div style={{fontSize:12,color:K.t2,fontWeight:600,textAlign:"center",maxWidth:110}}>{l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[[`${nd}/${mods.length}`,"Modules terminés",K.em],[`${qcm.length}`,"QCM passés",K.t2],[`${reussis}`,"Réussis (≥ 60 %)",K.em],[`${qcm.length-reussis}`,"À retravailler",K.er]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,borderRadius:9,padding:"7px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:11,marginTop:2}}>{l}</div></div>)}
      </div>
    </div>
    <MesAttestations K={K} mob={mob} db={db} uid={uid} user={u} mods={mods} ok={ok} onSub={onSub}/>
    <div className="tn" style={{gap:6,margin:"18px 0 12px",paddingBottom:3}}>
      {ONGLETS.map(([k,ico,l])=>{const a=onglet===k;return <button key={k} onClick={()=>sOnglet(k)} className="bt" style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:a?800:600,flexShrink:0,background:a?`linear-gradient(135deg,${K.emD},${K.em})`:K.card,color:a?"#fff":K.t2,border:a?"1px solid transparent":`1px solid ${K.b0}`}}>
        <i className={`ti ti-${ico}`} style={{fontSize:15,color:a?"#fff":K.t3}}/>{l}<span style={{fontSize:11.5,opacity:.8}}>{nFaits(k)}/{L[k].length}</span></button>;})}
    </div>
    {onglet==="exo"&&<div style={{fontSize:12.5,color:K.t3,marginBottom:10,lineHeight:1.5}}><i className="ti ti-info-circle" style={{marginRight:4}}/>Les exercices pratiques sont suivis à part : ils ne comptent pas dans la moyenne des QCM.</div>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {liste.map(x=>{const pct=x.s&&x.s.pct!=null?x.s.pct:null,ok_=pct!=null&&pct>=60,col=pct==null?(x.fait?K.em:K.t3):ok_?K.em:K.er;
        return <div key={x.cle} onClick={()=>aller(x.go)} className="hv" style={{background:K.card,border:`1px solid ${pct!=null&&!ok_?K.erBd:K.b0}`,boxShadow:K.sh,borderRadius:13,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <div style={{width:36,height:36,borderRadius:10,background:pct!=null||x.fait?`${col}16`:K.c2,border:`1px solid ${pct!=null||x.fait?col+"35":K.b0}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <i className={`ti ti-${pct!=null?(ok_?"circle-check":"alert-circle"):x.fait?"circle-check":"clock"}`} style={{fontSize:17,color:col}}/></div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14,color:K.t1,lineHeight:1.35}}>{x.titre}</div>{x.sous&&<div style={{fontSize:11.5,color:K.t3,marginTop:1}}>{x.sous}</div>}</div>
          <div style={{textAlign:"right",flexShrink:0}}>{pct!=null?<><div style={{fontWeight:900,fontSize:18,color:col}}>{pct}%</div><div style={{fontSize:10.5,color:K.t3}}>{x.s.s!=null&&x.s.t?`${x.s.s}/${x.s.t}`:"Meilleur score"}</div></>
            :<div style={{fontSize:12,color:x.fait?K.em:K.t3,fontWeight:700}}>{x.fait?"Terminé":"À faire"}</div>}</div>
        </div>;})}
    </div>
    <BadgesPanel nd={nd} total={mods.length} sc={sc}/>
  </div>;
}

function VidsPage({ok,onSub,vids,live}){
  const K=useK();const{mob}=useW();const[fi,sF]=useState("tous");const[pl,sPl]=useState(null);
  const fil=fi==="tous"?vids:fi==="gr"?vids.filter(v=>v.gr):fi==="pm"?vids.filter(v=>!v.gr):vids.filter(v=>v.mid===fi);
  if(!vids.length&&!live.on)return <EmptyState ico="video" title="Aucune vidéo pour le moment" desc="Les vidéos de cours et replays apparaîtront ici dès que votre formateur les publiera."/>;
  return <div style={{animation:"up .3s ease"}}>
    {pl&&<Player url={pl.url} titre={pl.titre} onClose={()=>{sPl(null);}} playlist={fil.map(v=>({url:v.url,titre:v.titre,gr:v.gr}))} startIdx={fil.findIndex(v=>v.url===pl.url)}/>}
    {live.on&&<div onClick={()=>ok||live.gr?sPl({url:live.url,titre:live.titre||"Direct"}):onSub()} className="hv" style={{background:K.rdBg,border:`1px solid ${K.rdBd}`,borderRadius:12,padding:"13px 15px",marginBottom:13,cursor:"pointer",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><span style={{fontSize:20,animation:"blink 1.5s ease-in-out infinite",flexShrink:0}}>🔴</span><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}><span style={{fontWeight:800,fontSize:14,color:K.t1}}>{live.titre||"Cours en direct"}</span><Tg c={K.rd} bg={K.rdBg} bd={K.rdBd} ch="EN DIRECT"/></div><div style={{fontSize:13,color:K.t3}}>{live.desc||""}</div></div><Btn ch="▶ Rejoindre" v="r" sm sx={{flexShrink:0}}/></div>}
    <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:10}}>Vidéothèque {vids.length>0&&<span style={{color:K.t3,fontWeight:400,fontSize:14}}>({vids.length})</span>}</div>
    <div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>{[["tous","Toutes"],["gr","Gratuites"],["pm","Premium"]].map(([k,l])=><button key={k} onClick={()=>sF(k)} className="bt" style={{background:fi===k?K.c2:"transparent",border:`1px solid ${fi===k?K.b1:K.b0}`,borderRadius:99,padding:"4px 10px",fontSize:12,fontWeight:600,color:fi===k?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{l}</button>)}</div>
    {fil.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"44px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>🎬</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune vidéo</div><div style={{color:K.t3,fontSize:13}}>L'admin n'a pas encore ajouté de vidéos.</div></div>
    :<div className="gv">{fil.map(v=>{const lk=!v.gr&&!ok;const pv=pVid(v.url);const th=pv?.t==="yt"?`https://img.youtube.com/vi/${pv.id}/mqdefault.jpg`:null;
      return <div key={v.id} className="hv" onClick={()=>lk?onSub():sPl({url:v.url,titre:v.titre})} style={{background:K.card,border:`1px solid ${lk?K.b0:K.b1}`,borderRadius:12,overflow:"hidden",cursor:"pointer",opacity:lk?.7:1}}>
        <div style={{width:"100%",paddingTop:"56.25%",position:"relative",background:K.c2}}>{th?<img src={th} alt={v.titre} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:null}<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.32)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:40,height:40,borderRadius:"50%",background:lk?"rgba(0,0,0,.55)":"rgba(52,211,153,.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{lk?"🔒":"▶"}</div></div><div style={{position:"absolute",top:6,right:6}}>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}</div></div>
        <div style={{padding:"10px 12px"}}><div style={{fontWeight:700,fontSize:14,color:lk?K.t3:K.t1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div>{v.desc&&<div style={{fontSize:12,color:K.t3,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:5}}>{v.desc}</div>}</div>
      </div>;})}
    </div>}
  </div>;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
// Admin : narration audio d'une présentation (lue par la synthèse vocale dans la visionneuse et « Écouter les cours »)
function NarrationPres({K,p}){
  const[ouvert,sOuvert]=useState(false);const[t,sT]=useState(p.narration||"");const[etat,sEtat]=useState("");
  useEffect(()=>{if(!ouvert)sT(p.narration||"");},[p.narration,ouvert]);
  const n=texteNarration({titre:p.titre,narration:t}).length,nP=paragraphesNarration(t).length;
  const importer=e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;const r=new FileReader();r.onload=()=>{sT(String(r.result||""));sEtat("Fichier chargé : vérifiez, puis enregistrez");};r.onerror=()=>sEtat("Erreur : fichier illisible");r.readAsText(f,"utf-8");};
  const enregistrer=async()=>{sEtat("…");try{await updateDoc(doc(db,"presentations",p.id),{narration:t.trim()});sEtat("Enregistré");}catch(e){sEtat(`Erreur : ${e.message}`);}};
  const b={background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 10px",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",cursor:"pointer",minHeight:30,display:"inline-flex",alignItems:"center",gap:4};
  return <div style={{flexBasis:"100%",minWidth:0,maxWidth:"100%",display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <button onClick={()=>sOuvert(o=>!o)} className="bt" style={b}><i className="ti ti-headphones" style={{fontSize:13}}/>{p.narration?"Narration audio ✓":"Ajouter une narration audio"}</button>
      {etat&&<span style={{fontSize:12,color:/^Erreur/.test(etat)?K.er:K.em,fontWeight:700}}>{etat}</span>}
    </div>
    {ouvert&&<>
      <textarea value={t} onChange={e=>{sT(e.target.value);sEtat("");}} rows={8} placeholder={"Diapositive 1. Texte lu pour la première diapositive…\n\nDiapositive 2. …"}
        style={{width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:13.5,lineHeight:1.5,fontFamily:"'Outfit',sans-serif",resize:"vertical"}}/>
      <div style={{fontSize:12,color:K.t3,lineHeight:1.5}}>Un paragraphe par diapositive, séparés par une ligne vide. {nP?`${nP} paragraphe${nP>1?"s":""} (diapositives), ${n} phrases lues.`:""}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",minWidth:0}}>
        <label className="bt" style={b}><i className="ti ti-file-upload" style={{fontSize:13}}/>Importer un fichier .txt<input type="file" accept=".txt,text/plain" onChange={importer} style={{display:"none"}}/></label>
        <Btn ch="Enregistrer" on={enregistrer} sm/>
      </div>
      {n>0&&<div style={{minWidth:0,maxWidth:"100%"}}><LecteurAudio K={K} segments={texteNarration({titre:p.titre,narration:t})} titre="Écouter un aperçu" compact/></div>}
    </>}
  </div>;
}
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
    {open&&<PresViewer url={open.url} titre={open.titre} desc={open.desc} narration={open.narration} onClose={()=>sOpen(null)}/>}
    {/* Bannière */}
    <div style={{background:`linear-gradient(135deg,${K.in_}18,${K.inD}10)`,border:`1px solid ${K.inBd}`,borderRadius:16,padding:mob?"16px":"20px 24px",marginBottom:16}}>
      <div style={{fontSize:13,color:K.in_,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-presentation" style={{fontSize:14}}/> Présentations</div>
      <div style={{fontSize:mob?18:22,fontWeight:900,color:K.t1,marginBottom:4}}>Supports de cours</div>
      <div style={{fontSize:14,color:K.t2}}>{pres.length} présentation{pres.length>1?"s":""} disponible{pres.length>1?"s":""}</div>
    </div>
    {/* Filtres */}
    {mats.length>1&&<div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>{["Toutes",...mats].map(m=><button key={m} onClick={()=>sF(m)} className="bt" style={{background:fi===m?K.c2:"transparent",border:`1px solid ${fi===m?K.b1:K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:600,color:fi===m?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{m}</button>)}</div>}
    {fil.length===0
      ?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"44px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>📊</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune présentation</div><div style={{color:K.t3,fontSize:13}}>L'admin n'a pas encore ajouté de présentations.</div></div>
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
                  {p.narration&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch="🎧 Audio"/>}
                  {p.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}
                </div>
              </div>
              <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3,lineHeight:1.3}}>{p.titre}</div>
              {p.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={p.mat}/>}
            </div>
            {/* Footer carte */}
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              {p.desc?<div style={{fontSize:12,color:K.t2,flex:1,marginRight:8,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.desc}</div>:<div style={{flex:1}}/>}
              {!lk&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:13,fontWeight:700,color:K.in_,flexShrink:0}}><span>Voir</span><i className="ti ti-arrow-right" style={{fontSize:13}}/></div>}
              {lk&&<div style={{fontSize:12,color:K.t3}}>🔒 Abonnement</div>}
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
      <div style={{fontSize:13,color:K.wa,fontWeight:700,marginBottom:5,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-briefcase" style={{fontSize:14}}/> Stages Virtuels</div>
      <div style={{fontSize:mob?18:22,fontWeight:900,color:K.t1,marginBottom:4}}>Développez votre expérience</div>
      <div style={{fontSize:14,color:K.t2,marginBottom:14}}>Plateformes internationales · Offres structurées · Certifications reconnues</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[[`${plats.length}`,"Plateformes",K.wa],[`${stages.length}`,"Offres",K.em],["4","Catégories",K.in_]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,borderRadius:9,padding:"7px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:11,marginTop:2}}>{l}</div></div>)}
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",background:K.c2,borderRadius:10,padding:3,marginBottom:14,gap:2}}>
      {[["offres","🎯 Offres de stages"],["plats","🌐 Plateformes"]].map(([k,l])=><button key={k} onClick={()=>sTab(k)} className="bt" style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontWeight:700,fontSize:mob?12:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:tab===k?K.card:"transparent",color:tab===k?K.t1:K.t3,minHeight:38,boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.08)":"none"}}>{l}</button>)}
    </div>

    {/* Filtres catégories */}
    <div className="tn" style={{gap:6,marginBottom:12,paddingBottom:3}}>
      {cats.map(c=>{const cc=CAT_COLORS[c];return <button key={c} onClick={()=>sCat(c)} className="bt" style={{background:cat===c?(cc?cc.bg:K.c2):"transparent",border:`1px solid ${cat===c?(cc?cc.bd:K.b1):K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:600,color:cat===c?(cc?cc.ac:K.t1):K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28,display:"flex",alignItems:"center",gap:5}}>{cc&&<i className={"ti ti-"+cc.ic} style={{fontSize:13}}/>}{c}</button>;})}
    </div>

    {/* OFFRES */}
    {tab==="offres"&&<>
      <div style={{marginBottom:11}}><input value={search} onChange={e=>sSearch(e.target.value)} placeholder="🔍 Rechercher une offre ou entreprise..." style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,color:K.t1,fontSize:14,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box",minHeight:42,caretColor:K.em}} onFocus={e=>e.target.style.borderColor=K.emBd} onBlur={e=>e.target.style.borderColor=K.b0}/></div>
      {filStages.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"44px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>🎯</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune offre</div><div style={{color:K.t3,fontSize:13}}>L'admin n'a pas encore posté d'offres de stages.</div></div>
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
                {s.desc&&<div style={{fontSize:13,color:K.t2,lineHeight:1.5,marginBottom:8}}>{s.desc}</div>}
                {s.competences&&s.competences.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{s.competences.map(c=><span key={c} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,border:`1px solid ${K.b1}`,borderRadius:5,padding:"2px 7px",fontSize:11,color:K.t2}}>{c}</span>)}</div>}
              </div>
            </div>
            <a href={s.url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:`linear-gradient(135deg,${cc.ac}22,${cc.ac}11)`,border:`1px solid ${cc.bd}`,borderRadius:8,padding:"8px 14px",color:cc.ac,fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}>
              <i className="ti ti-external-link" style={{fontSize:14}}/>Postuler / Voir l'offre
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
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14,color:K.t1}}>{p.nom}</div><div style={{fontSize:11,color:K.t3,marginTop:1}}>🌐 {p.langue||"EN"} · {p.gratuit?"Gratuit":"Payant/Freemium"}</div></div>
              {p.gratuit?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Freemium"/>}
            </div>
            <div style={{fontSize:13,color:K.t2,lineHeight:1.55,marginBottom:10}}>{p.desc}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {p.cats?.map(c=>{const ccc=CAT_COLORS[c];return <span key={c} style={{background:ccc?ccc.bg:K.c2,border:`1px solid ${ccc?ccc.bd:K.b0}`,borderRadius:5,padding:"2px 7px",fontSize:11,color:ccc?ccc.ac:K.t2,display:"flex",alignItems:"center",gap:3}}><i className={"ti ti-"+(ccc?ccc.ic:"tag")} style={{fontSize:11}}/>{c}</span>;})}
            </div>
          </div>
          <div style={{padding:"10px 14px"}}>
            <a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:`linear-gradient(135deg,${cc.ac},${cc.ac}CC)`,borderRadius:8,padding:"9px",color:"#fff",fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:36}}>
              <i className="ti ti-external-link" style={{fontSize:14}}/>Accéder à {p.nom}
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

  const WA_NUM="+243979075970";
  const EMAIL="gnkuli@outlook.fr";

  return <div style={{animation:"up .3s ease",maxWidth:900,margin:"0 auto"}}>
    {/* Bannière hero */}
    <div style={{background:`linear-gradient(135deg,${K.em}20,${K.in_}12)`,border:`1px solid ${K.emBd}`,borderRadius:18,padding:mob?"20px 16px":"30px 32px",marginBottom:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:`${K.em}0A`}}/>
      <div style={{position:"absolute",bottom:-30,left:20,width:100,height:100,borderRadius:"50%",background:`${K.in_}08`}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:isLight?"rgba(255,255,255,.7)":K.b0,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"4px 12px",marginBottom:14}}><i className="ti ti-building" style={{fontSize:13,color:K.em}}/><span style={{fontSize:12,color:K.em,fontWeight:700}}>Éco-Campus RDC</span></div>
        <div style={{fontSize:mob?22:30,fontWeight:900,color:K.t1,lineHeight:1.2,marginBottom:10,letterSpacing:"-.5px"}}>Nos Services<br/><span style={{background:`linear-gradient(135deg,${K.em},${K.in_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Professionnels</span></div>
        <div style={{fontSize:14,color:K.t2,lineHeight:1.6,marginBottom:18,maxWidth:520}}>Expertise comptable, fiscale et financière au service des entreprises de la zone OHADA. Des solutions sur mesure pour votre croissance.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href={`https://wa.me/${WA_NUM.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,background:`linear-gradient(135deg,#25D366,#128C7E)`,borderRadius:10,padding:"10px 18px",color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-brand-whatsapp" style={{fontSize:16}}/>WhatsApp</a>
          <a href={`mailto:${EMAIL}`} style={{display:"inline-flex",alignItems:"center",gap:7,background:isLight?"rgba(255,255,255,.8)":K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 18px",color:K.t1,fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-mail" style={{fontSize:16}}/>Email</a>
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
            <span style={{background:s.colBg,border:`1px solid ${s.colBd}`,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700,color:s.col}}>{s.badge}</span>
          </div>
          <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4}}>{s.titre}</div>
          <div style={{fontSize:13,color:s.col,fontWeight:600,fontStyle:"italic",marginBottom:8}}>{s.tagline}</div>
          <div style={{fontSize:13,color:K.t2,lineHeight:1.55}}>{s.desc}</div>
        </div>
        {/* Prestations (expandable) */}
        <div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sel?.id===s.id?10:0}}>
            <div style={{fontSize:12,color:K.t3,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><i className="ti ti-list-check" style={{fontSize:13,color:s.col}}/>{s.prestations.length} prestations incluses</div>
            <i className={"ti ti-chevron-"+(sel?.id===s.id?"up":"down")} style={{fontSize:14,color:K.t3}}/>
          </div>
          {sel?.id===s.id&&<div style={{animation:"up .2s ease"}}>
            {s.prestations.map((p,j)=><div key={j} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:j<s.prestations.length-1?`1px solid ${s.colBd}`:"none"}}>
              <i className="ti ti-check" style={{fontSize:14,color:s.col,flexShrink:0,marginTop:2}}/>
              <span style={{fontSize:13,color:K.t1,lineHeight:1.5}}>{p}</span>
            </div>)}
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,color:K.t3,fontWeight:600,marginBottom:6}}>Public cible</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{s.cibles.map(c=><span key={c} style={{background:isLight?"rgba(255,255,255,.8)":K.b0,border:`1px solid ${s.colBd}`,borderRadius:5,padding:"2px 8px",fontSize:11,color:s.col,fontWeight:600}}>{c}</span>)}</div>
            </div>
            <button onClick={e=>{e.stopPropagation();document.getElementById("contact-form")?.scrollIntoView({behavior:"smooth"});sForm(f=>({...f,service:s.titre}));}} className="bt" style={{width:"100%",marginTop:12,padding:"10px",background:`linear-gradient(135deg,${s.col},${s.col}BB)`,border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:38}}>
              <i className="ti ti-send" style={{fontSize:14}}/>Demander ce service
            </button>
          </div>}
        </div>
      </div>)}
    </div>

    {/* Pourquoi nous choisir */}
    <div style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"16px":"22px 24px",marginBottom:24}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-star" style={{fontSize:16,color:K.wa}}/>Pourquoi choisir Éco-Campus ?</div>
      <div style={{color:K.t3,fontSize:13,marginBottom:16}}>Notre engagement envers l'excellence et la proximité</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        {WHY.map((w,i)=><div key={i} style={{background:isLight?K.c2:K.c2,borderRadius:12,padding:"14px 12px",textAlign:"center",border:`1px solid ${K.b0}`}}>
          <div style={{width:40,height:40,borderRadius:11,background:K.emBg,border:`1px solid ${K.emBd}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><i className={"ti ti-"+w.ico} style={{fontSize:19,color:K.em}}/></div>
          <div style={{fontWeight:700,fontSize:13,color:K.t1,marginBottom:4}}>{w.titre}</div>
          <div style={{fontSize:12,color:K.t3,lineHeight:1.5}}>{w.desc}</div>
        </div>)}
      </div>
    </div>

    {/* Formulaire de contact */}
    <div id="contact-form" style={{background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:16,padding:mob?"18px 16px":"24px 28px",marginBottom:16}}>
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:3,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-message-circle" style={{fontSize:16,color:K.in_}}/>Demande de service</div>
      <div style={{color:K.t3,fontSize:13,marginBottom:18}}>Remplissez le formulaire — nous vous répondons sous 24h.</div>
      {sent?<div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"24px",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10,animation:"fl 3s ease-in-out infinite"}}>✅</div>
        <div style={{fontWeight:800,fontSize:16,color:K.t1,marginBottom:4}}>Demande envoyée !</div>
        <div style={{color:K.t2,fontSize:14,lineHeight:1.6,marginBottom:16}}>Nous avons bien reçu votre demande. Notre équipe vous contactera sous <b>24 heures ouvrables</b>.</div>
        <button onClick={()=>{sSent(false);sForm({nom:"",email:"",tel:"",service:"",message:""}); }} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"9px 18px",color:K.t2,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Nouvelle demande</button>
      </div>:<>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Inp lb="Nom complet *" val={form.nom||userNom} onChange={e=>sForm(f=>({...f,nom:e.target.value}))} ph="Votre nom"/>
          <Inp lb="Email *" val={form.email||userEmail} onChange={e=>sForm(f=>({...f,email:e.target.value}))} ph="votre@email.com" type="email"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Inp lb="Téléphone / WhatsApp" val={form.tel} onChange={e=>sForm(f=>({...f,tel:e.target.value}))} ph="+243 XXX XXX XXX"/>
          <div style={{marginBottom:13}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:5}}>Service souhaité *</div>
            <select value={form.service} onChange={e=>sForm(f=>({...f,service:e.target.value}))} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:form.service?K.t1:K.t3,fontSize:14,outline:"none",minHeight:44,fontFamily:"'Outfit',sans-serif"}}>
              <option value="">-- Choisir un service --</option>
              {SERVICES.map(s=><option key={s.id} value={s.titre}>{s.titre}</option>)}
              <option value="Autre">Autre / Non listé</option>
            </select>
          </div>
        </div>
        <Inp lb="Message (optionnel)" val={form.message} onChange={e=>sForm(f=>({...f,message:e.target.value}))} ph="Décrivez votre situation, vos besoins spécifiques..." rows={4}/>
        {err&&<div style={{background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:8,color:K.er,fontSize:14,padding:"8px 12px",marginBottom:10,display:"flex",gap:7}}><span>⚠</span><span>{err}</span></div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={send} disabled={sending} className="bt" style={{flex:1,minWidth:180,padding:"12px",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:10,color:"#FFFFFF",fontWeight:800,fontSize:14,cursor:sending?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:46,opacity:sending?.7:1}}>
            <i className="ti ti-send" style={{fontSize:16}}/>{sending?"Envoi en cours…":"Envoyer ma demande"}
          </button>
          <a href={`https://wa.me/${WA_NUM.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#25D366,#128C7E)",borderRadius:10,padding:"12px 18px",color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-brand-whatsapp" style={{fontSize:16}}/>WhatsApp
          </a>
          <a href={`mailto:${EMAIL}?subject=Demande de service — ${form.service||"Éco-Campus"}`} style={{display:"inline-flex",alignItems:"center",gap:6,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:10,padding:"12px 18px",color:K.in_,fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-mail" style={{fontSize:16}}/>Email
          </a>
        </div>
        <div style={{marginTop:12,padding:"9px 12px",background:K.c2,borderRadius:8,fontSize:12,color:K.t3,display:"flex",alignItems:"center",gap:6}}><i className="ti ti-lock" style={{fontSize:13,color:K.em}}/>Vos informations sont confidentielles et ne seront jamais partagées.</div>
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
    let veutEmail=true;try{const us=await getDoc(doc(db,"users",apprenantUid));veutEmail=us.data()?.preferences?.notifEmails!==false;}catch(e){}
    if(apprenantMail&&veutEmail){
      sendNotifEmail({to_email:apprenantMail,subject:"Nouveau message — Éco-Campus RDC",nom:apprenantNom,message:`Vous avez reçu un nouveau message de l'équipe Éco-Campus RDC :\n\n« ${t} »\n\nConnectez-vous à votre compte, onglet Messages, pour répondre.`}).catch(()=>{});
    }
    sTexte("");sSending(false);
  };
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <button onClick={onBack} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:K.t2,display:"flex",alignItems:"center",gap:4,fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}><i className="ti ti-arrow-left" style={{fontSize:14}}/>Retour</button>
      <div style={{fontWeight:800,fontSize:14,color:K.t1}}>{apprenantNom}</div>
    </div>
    <div style={{background:K.c2,borderRadius:12,padding:14,marginBottom:12}}>
      <div style={{height:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
        {msgs.map(m=>{
          const mine=m.fromRole==="admin";
          return <div key={m.id} style={{alignSelf:mine?"flex-end":"flex-start",maxWidth:"78%"}}>
            <div style={{background:mine?K.em:K.card,color:mine?"#FFFFFF":K.t1,borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:14,lineHeight:1.5,border:mine?"none":`1px solid ${K.b0}`}}>{m.texte}</div>
            <div style={{fontSize:10,color:K.t3,marginTop:3,textAlign:mine?"right":"left"}}>{mine?"Vous":m.apprenantNom} · {new Date(m.ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
          </div>;
        })}
        <div ref={endRef}/>
      </div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <input value={texte} onChange={e=>sTexte(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Répondre…" style={{flex:1,background:K.card,border:`1px solid ${K.b0}`,borderRadius:99,padding:"10px 15px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      <Btn ch={sending?"…":"Envoyer"} on={send} v="i" sx={{minHeight:40}}/>
    </div>
  </div>;
}
function AA({onOut}){
  const K=useK();const{mob}=useW();
  const cfgSecA=useConfigSecurite();
  const offresA=offresAvecPrix(usePaiement(db));
  const{warning:aaWarn}=useAutoLogout(onOut,cfgSecA.delaiAdmin||20);
  usePresence({uid:auth.currentUser?.uid,nom:"Administrateur",mail:ADM_EMAIL,role:"admin",vue:"Administration"});
  const[pendingDocs,setPendingDocs]=useState([]);
  const[nSugg,sNSugg]=useState(0);
  useEffect(()=>onSnapshot(query(collection(db,"suggestions"),where("statut","==","nouveau")),s=>sNSugg(s.size),()=>{}),[]);
  useEffect(()=>{
    const unsub=onSnapshot(query(collection(db,"documents"),where("status","==","pending")),
      snap=>setPendingDocs(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  },[]);
  const approveDoc=async(id)=>{
    await updateDoc(doc(db,"documents",id),{status:"approved",approvedAt:new Date().toISOString()});
    const d=pendingDocs.find(x=>x.id===id);
    if(d?.createdBy)notifier({dest:d.createdBy,type:"contenu",titre:`Document approuvé : ${d.titre||""}`,texte:"Votre document est validé par l'administration.",vue:"docs",auteurNom:"Éco-Campus RDC"});
    sMsg({t:"o",m:"Document approuvé !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const rejectDoc=async(id,reason)=>{
    await updateDoc(doc(db,"documents",id),{status:"rejected",rejectedAt:new Date().toISOString(),rejectReason:reason||""});
    const d=pendingDocs.find(x=>x.id===id);
    if(d?.createdBy)notifier({dest:d.createdBy,type:"contenu",titre:`Document à revoir : ${d.titre||""}`,texte:reason?`Motif : ${reason}`:"Consultez vos documents pour le corriger.",vue:"docs",auteurNom:"Éco-Campus RDC"});
    sMsg({t:"o",m:"Document rejeté."});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const[tab,sT]=useState("home"),[msg,sMsg]=useState({t:"",m:""});
  const[cm,sCm]=useState(null),[vm,sVm]=useState(null),[dm,sDm]=useState(null),[q,sQ]=useState("");
  const[editMod,sEM]=useState(null),[newMod,sNM]=useState(false);
  const[addVid,sAV]=useState(false),[saving,sSav]=useState(false),[pdfEnvoi,sPdfEnvoi]=useState(null),[pdfMsg,sPdfMsg]=useState({t:"",m:""}),[lienMod,sLienMod]=useState(null),[lienVal,sLienVal]=useState(""),[addPres,sAddPres]=useState(false),[presGr,sPresGr]=useState(true),[addStage,sAddStage]=useState(false),[stageTab,sStageTab]=useState("offres"),[addPlat,sAddPlat]=useState(false);
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
  const activite=useActiviteAll(),connexions=useConnexions();
  const[auPer,sAuPer]=useState("7"),[auQ,sAuQ]=useState(""),[auRole,sAuRole]=useState("tous"),[,sTick]=useState(0);
  const[auGarde,sAuGarde]=useState("12"),[auPurge,sAuPurge]=useState(false);
  const lancerPurge=async()=>{
    const mois=+auGarde,limite=new Date();limite.setMonth(limite.getMonth()-mois);
    if(!window.confirm(`Supprimer définitivement les connexions antérieures au ${limite.toLocaleDateString("fr-FR")} (plus de ${mois} mois) ?\n\nCette action est irréversible. Pensez à exporter le journal avant si vous souhaitez le conserver.`))return;
    sAuPurge(true);
    try{const n=await purgerConnexions(limite);window.alert(n?`${n} connexion${n>1?"s":""} de plus de ${mois} mois supprimée${n>1?"s":""}.`:`Aucune connexion de plus de ${mois} mois à supprimer.`);}
    catch(e){window.alert("Purge impossible : "+e.message);}
    sAuPurge(false);
  };
  useEffect(()=>{const t=setInterval(()=>sTick(x=>x+1),30000);return()=>clearInterval(t);},[]);
  const[activeThread,sActiveThread]=useState(null);
  const[plDate,sPlDate]=useState(new Date().toISOString().slice(0,10));
  const[plAll,sPlAll]=useState([]);
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"presences"),(snap)=>{sPlAll(snap.docs.map(d=>({id:d.id,...d.data()})));});
    return unsub;
  },[]);
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
  let code="EC-";
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
    notifier({dest:uid,type:"code",titre:"Votre espace formateur est activé",texte:"Vous pouvez créer vos modules, slides et documents, et corriger les copies de vos apprenants.",vue:"home",auteurNom:"Éco-Campus RDC"});
    sMsg({t:"o",m:"Formateur activé !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const approveContent=async(type,id)=>{
    const coll=type==="mod"?"modules":type==="pres"?"presentations":"videos";
    await updateDoc(doc(db,coll,id),{status:"approved",on:true,approvedAt:new Date().toISOString()});
    try{const c=(await getDoc(doc(db,coll,id))).data()||{};const genre={mod:["module","Nouveau module","home"],pres:["pres","Nouveau cours","pres"],vid:["video","Nouvelle vidéo","videos"]}[type]||["info","Nouveau contenu","home"];
      notifier({dest:"apprenants",type:genre[0],titre:`${genre[1]} : ${c.titre||""}`,texte:c.desc||"",vue:genre[2],auteurNom:"Éco-Campus RDC"});
      if(c.createdBy)notifier({dest:c.createdBy,type:"contenu",titre:`Contenu publié : ${c.titre||""}`,texte:"Votre contenu a été approuvé et il est visible par les apprenants.",vue:type==="mod"?"mods":type==="pres"?"pres":"vids",auteurNom:"Éco-Campus RDC"});}catch(e){}
    sMsg({t:"o",m:"Contenu approuvé et publié !"});setTimeout(()=>sMsg({t:"",m:""}),3000);
  };
  const rejectContent=async(type,id,reason)=>{
    const coll=type==="mod"?"modules":type==="pres"?"presentations":"videos";
    await updateDoc(doc(db,coll,id),{status:"rejected",rejectedAt:new Date().toISOString(),rejectReason:reason||""});
    try{const c=(await getDoc(doc(db,coll,id))).data()||{};if(c.createdBy)notifier({dest:c.createdBy,type:"contenu",titre:`Contenu à revoir : ${c.titre||""}`,texte:reason?`Motif : ${reason}`:"Consultez vos contenus pour le corriger.",vue:type==="mod"?"mods":type==="pres"?"pres":"vids",auteurNom:"Éco-Campus RDC"});}catch(e){}
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
    notifier({dest:uid,type:"code",titre:"Votre accès est activé 🎉",texte:`Durée : ${d.l||"—"}. Tous les modules, QCM et ateliers sont maintenant disponibles.`,vue:"home",auteurNom:"Éco-Campus RDC"});
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
  const addVidFn=async()=>{const url=rVU.current?.value?.trim()||"",titre=rVT.current?.value?.trim()||"";if(!titre||!url){alert("Titre et URL requis");return;}if(!pVid(url)){alert("URL invalide");return;}sSav(true);await saveVideo({titre,url,desc:rVD.current?.value?.trim()||"",mid:rVM.current?.value||null,gr});notifier({dest:"apprenants",type:"video",titre:`Nouvelle vidéo : ${titre}`,texte:rVD.current?.value?.trim()||"",vue:"videos",auteurNom:"Éco-Campus RDC"});sSav(false);sAV(false);[rVU,rVT,rVD].forEach(r=>{if(r.current)r.current.value="";});};
  const IB=({ico,t,on,v="s",lbl})=>{const c={p:[K.em,"#fff",K.em],s:[K.c2,K.t2,K.b1],d:[K.erBg,K.er,K.erBd],i:[K.inBg,K.in_,K.inBd],w:[K.waBg,K.wa,K.waBd]}[v];return <button onClick={on} title={t} className="bt" style={{display:"inline-flex",alignItems:"center",gap:5,height:34,minWidth:34,padding:lbl?"0 11px":0,justifyContent:"center",borderRadius:10,background:c[0],color:c[1],border:`1px solid ${c[2]}`,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}><i className={`ti ti-${ico}`} style={{fontSize:16}}/>{lbl}</button>;};
  const Acts=({u,st})=><>{st==="demande"&&<><IB ico="check" t="Valider l'accès" lbl="Valider" v="p" on={()=>sVm(u.uid)}/><IB ico="x" t="Refuser" v="d" on={()=>ref_(u.uid)}/></>}{st==="actif"&&<><IB ico="key" t="Voir le code" on={()=>sCm(u)}/><IB ico="send" t="Envoyer le code par e-mail et message" v="i" on={()=>mL(u)}/><IB ico="player-pause" t="Suspendre l'accès" v="w" on={()=>rev(u.uid)}/></>}{(st==="expiré"||st==="aucun")&&<IB ico="player-play" t="Réactiver / donner accès" lbl="Accès" on={()=>sVm(u.uid)}/>}<IB ico="trash" t="Supprimer le compte" v="d" on={()=>sDm(u.uid)}/></>;
  const Av=({u,sz=38})=>{const cs=["#0A2A5C","#1E4FA3","#A3122A","#0D7A6B","#7C3AED","#C98A1B"];const c=cs[((u.nom||"U").charCodeAt(0)+(u.nom||"").length)%cs.length];return <div style={{width:sz,height:sz,borderRadius:"50%",background:`linear-gradient(135deg,${c},${c}B0)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:sz*.38,flexShrink:0}}>{(u.nom||"U").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div>;};
  const Stat=({st})=><span style={{display:"inline-flex",alignItems:"center",gap:5,background:`${sc_(st)}14`,color:sc_(st),border:`1px solid ${sc_(st)}33`,borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:sc_(st)}}/>{sl_(st)}</span>;
  const Code=({u,jr})=>u.activationCode?<div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:K.em,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:7,padding:"2px 7px"}}>{u.activationCode}</span>{u.dateExpiration&&<span style={{fontSize:12,fontWeight:700,color:jr<=7?K.er:jr<=30?K.wa:K.t3}}>{jr>0?`${jr} j restants`:"Expiré"}</span>}</div>:<span style={{color:K.t3,fontSize:13}}>—</span>;
  const Dem=({u})=>{if(u.abonnement!=="demande"||!(u.demandeOffre||u.demandeRef))return null;const o=offresA.find(x=>x.id===u.demandeOffre);
    return <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",alignItems:"center",fontSize:12.5,color:K.t2,marginTop:3}}>{o&&<b style={{color:K.wa}}>{o.l} · {fUSD(o.prix)}</b>}{u.demandeRef&&<span>Réf. <b style={{fontFamily:"'JetBrains Mono',monospace",color:K.t1}}>{u.demandeRef}</b></span>}{u.demandeTel&&<span>{u.demandeTel}</span>}</div>;};
  function RC({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:18,padding:"14px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Av u={u}/><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:800,fontSize:15}}>{u.nom}</div><div style={{color:K.t3,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div><Dem u={u}/></div><Stat st={st}/></div>{u.activationCode&&<div style={{marginBottom:10}}><Code u={u} jr={jr}/></div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Acts u={u} st={st}/></div></div>;}
  function RR({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div className="ar" style={{borderBottom:`1px solid ${K.b0}`}}><div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}><Av u={u} sz={36}/><div style={{minWidth:0}}><div style={{color:K.t1,fontWeight:800,fontSize:14.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nom}</div><div style={{color:K.t3,fontSize:12}}>Inscrit le {u.createdAt||"—"}</div><Dem u={u}/></div></div><div style={{color:K.t2,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div><div><Stat st={st}/></div><div><Code u={u} jr={jr}/></div><div style={{display:"flex",gap:5,justifyContent:"flex-end",flexWrap:"wrap"}}><Acts u={u} st={st}/></div></div>;}
  function Liste({list,empty}){if(list.length===0)return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"38px",textAlign:"center"}}><div style={{fontSize:26,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>👤</div><div style={{color:K.t3,fontSize:14}}>{empty}</div></div>;if(mob)return <div>{list.map(u=><RC key={u.uid} u={u}/>)}</div>;return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,overflow:"hidden"}}><div className="ah" style={{background:K.c2,borderBottom:`1px solid ${K.b0}`,color:K.t3,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".6px"}}><div>Apprenant</div><div>E-mail</div><div>Statut</div><div>Accès</div><div style={{textAlign:"right"}}>Actions</div></div>{list.map(u=><RR key={u.uid} u={u}/>)}</div>;}
  function ModEditor({mod,onSave,onCancel}){
    const isNew=!mod.id;const[qs,sQs]=useState(mod.q?JSON.parse(JSON.stringify(mod.q)):[{q:"",r:["","","",""],b:0}]);
    const[ex,sEx]=useState(mod.ex?JSON.parse(JSON.stringify(mod.ex)):{ti:"",en:"",tv:[""],dn:[],co:""});
    const[ico,sIco]=useState(mod.ico||"📚");const[col,sCol]=useState(mod.col||COLS[0]);const[on,sOn]=useState(mod.on!==false);
    const rT=useRef(),rD=useRef(),rM=useRef(),rC=useRef();
    const save=async()=>{const titre=rT.current?.value?.trim()||"";const code=rC.current?.value?.trim()||"";if(!titre||!code){alert("Titre et Code requis");return;}sSav(true);const vq=qs.filter(q=>q.q.trim()&&q.r.filter(r=>r.trim()).length>=2);await saveModule({id:mod.id,code,ico,col,titre,desc:rD.current?.value?.trim()||"",mat:rM.current?.value?.trim()||"Général",on,q:vq,ex,ordre:mod.ordre||Date.now()});sSav(false);onSave();};
    return <div style={{animation:"sc .2s ease"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:12}}>{isNew?"➕ Nouveau module":"✏️ Modifier"}</div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><div style={{flex:"0 0 100px"}}><Inp lb="Code *" rf={rC} ph="M11" def={mod.code||""}/></div><div style={{flex:1,minWidth:140}}><Inp lb="Titre *" rf={rT} ph="Nom du cours" def={mod.titre||""}/></div></div>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><div style={{flex:1,minWidth:120}}><Inp lb="Matière" rf={rM} ph="SYSCOHADA, Droit..." def={mod.mat||""}/></div><div style={{flex:1,minWidth:140}}><Inp lb="Description" rf={rD} ph="Résumé court" def={mod.desc||""}/></div></div>
        <div style={{marginBottom:10}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:6}}>Icône</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ICOS.map(i=><button key={i} onClick={()=>sIco(i)} className="bt" style={{width:34,height:34,borderRadius:8,background:ico===i?K.emBg:K.bg,border:`1px solid ${ico===i?K.emBd:K.b0}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{icoEl(i,ico===i?K.em:K.t2,16)}</button>)}</div></div>
        <div style={{marginBottom:10}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:6}}>Couleur</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{COLS.map(c=><button key={c} onClick={()=>sCol(c)} className="bt" style={{width:26,height:26,borderRadius:"50%",background:c,border:`2px solid ${col===c?"#fff":"transparent"}`,cursor:"pointer"}}/>)}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:K.t2,fontSize:14,fontWeight:600}}>Actif</span><button onClick={()=>sOn(a=>!a)} className="bt" style={{width:42,height:22,borderRadius:99,background:on?K.em:K.c2,border:`1px solid ${on?K.emBd:K.b0}`,position:"relative",cursor:"pointer",transition:"background .2s"}}><span style={{position:"absolute",top:2,left:on?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",display:"block"}}/></button><span style={{fontSize:13,color:on?K.em:K.t3}}>{on?"Visible":"Masqué"}</span></div>
      </div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontWeight:700,fontSize:14,color:K.t1}}>QCM ({qs.length})</div><Btn ch="+ Question" on={()=>sQs(q=>[...q,{q:"",r:["","","",""],b:0}])} sm v="s"/></div>
        {qs.map((qi_,idx)=><div key={idx} style={{background:K.bg,borderRadius:9,padding:"10px",marginBottom:8,border:`1px solid ${K.b0}`}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{color:K.t3,fontSize:12,fontWeight:700,flexShrink:0}}>Q{idx+1}</span><input value={qi_.q} onChange={e=>{const n=[...qs];n[idx]={...n[idx],q:e.target.value};sQs(n);}} placeholder="Question..." style={{flex:1,padding:"7px 10px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif"}}/><Btn ch="✕" on={()=>sQs(q=>q.filter((_,j)=>j!==idx))} v="d" sm/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{qi_.r.map((r,ri)=><div key={ri} style={{display:"flex",alignItems:"center",gap:4}}><button onClick={()=>{const n=[...qs];n[idx]={...n[idx],b:ri};sQs(n);}} className="bt" style={{width:18,height:18,borderRadius:"50%",background:qi_.b===ri?K.em:K.c2,border:`2px solid ${qi_.b===ri?K.em:K.b1}`,cursor:"pointer",flexShrink:0}}/><input value={r} onChange={e=>{const n=[...qs];const rr=[...n[idx].r];rr[ri]=e.target.value;n[idx]={...n[idx],r:rr};sQs(n);}} placeholder={`Option ${["A","B","C","D"][ri]}`} style={{flex:1,padding:"5px 8px",background:K.c2,border:`1px solid ${qi_.b===ri?K.emBd:K.b0}`,borderRadius:6,color:qi_.b===ri?K.em:K.t1,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}}/></div>)}</div>
        </div>)}
      </div>
      <div style={{background:K.c2,borderRadius:11,padding:"13px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:10}}>Exercice</div>
        <div style={{marginBottom:8}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:4}}>Titre</div><input value={ex.ti} onChange={e=>sEx(x=>({...x,ti:e.target.value}))} placeholder="Titre de l'exercice" style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:8}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:4}}>Énoncé</div><textarea value={ex.en} onChange={e=>sEx(x=>({...x,en:e.target.value}))} rows={2} placeholder="Situation pratique..." style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{color:K.t2,fontSize:13,fontWeight:600}}>Travail</div><Btn ch="+" on={()=>sEx(x=>({...x,tv:[...x.tv,""]}))} sm v="s"/></div>{ex.tv.map((t,i)=><div key={i} style={{display:"flex",gap:5,marginBottom:4}}><input value={t} onChange={e=>{const tv=[...ex.tv];tv[i]=e.target.value;sEx(x=>({...x,tv}));}} placeholder={`Étape ${i+1}`} style={{flex:1,padding:"7px 9px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:6,color:K.t1,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}}/><Btn ch="✕" on={()=>sEx(x=>({...x,tv:x.tv.filter((_,j)=>j!==i)}))} v="d" sm/></div>)}</div>
        <div style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{color:K.t2,fontSize:13,fontWeight:600}}>Données</div><Btn ch="+ Ligne" on={()=>sEx(x=>({...x,dn:[...x.dn,{a:"",b:"",c:""}]}))} sm v="s"/></div>{ex.dn.map((row,i)=><div key={i} style={{display:"flex",gap:4,marginBottom:3,alignItems:"center"}}>{["a","b","c"].map((k,j)=><input key={k} value={row[k]||""} onChange={e=>{const dn=[...ex.dn];dn[i]={...dn[i],[k]:e.target.value};sEx(x=>({...x,dn}));}} placeholder={j===0?"Libellé":j===1?"Valeur":"Unité (opt.)"} style={{flex:1,padding:"6px 8px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:6,color:K.t1,fontSize:12,outline:"none",fontFamily:j>0?"'JetBrains Mono',monospace":"'Outfit',sans-serif"}}/>)}<Btn ch="✕" on={()=>sEx(x=>({...x,dn:x.dn.filter((_,j)=>j!==i)}))} v="d" sm/></div>)}</div>
        <div><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:4}}>Corrigé</div><textarea value={ex.co} onChange={e=>sEx(x=>({...x,co:e.target.value}))} rows={2} placeholder="Résultats attendus..." style={{width:"100%",padding:"8px 10px",background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,color:K.t1,fontSize:12,outline:"none",fontFamily:"'JetBrains Mono',monospace",resize:"vertical",boxSizing:"border-box"}}/></div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn ch="Annuler" on={onCancel} v="g" full/><Btn ch={saving?"Enregistrement…":isNew?"Créer →":"Enregistrer →"} on={save} full dis={saving}/></div>
    </div>;
  }
    const nAValider=mods.filter(m=>m.status==="pending").length+allPresAdmin.filter(p=>p.status==="pending").length+vids.filter(v=>v.status==="pending").length+pendingDocs.length;
    // Menu : 10 rubriques (src/nav/navigation.js) ; pastilles = éléments à traiter
    const badgesAdmin={val:nAValider,d:nD,dm:allDemandesAdmin.filter(d=>d.statut==="nouveau").length,sg:nSugg,msg:allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length};
    const ADMIN_TABS=GROUPES_ADMIN.map(g=>({k:g.k,ico:g.ico,label:g.court||g.label,badge:badgeGroupe(g,badgesAdmin),bc:g.k==="ech"?K.rd:K.wa}));
    const gAdmin=groupeDe(GROUPES_ADMIN,tab)?.k||"home";
    const allerGroupeA=k=>sT(GROUPES_ADMIN.find(g=>g.k===k).vues[0][0]);
  // Contenus des formateurs à valider (modules, présentations, vidéos, documents)
  const blocValidation=()=>{
        const pendingMods=mods.filter(m=>m.status==="pending");
        const pendingPres=allPresAdmin.filter(p=>p.status==="pending");
        const pendingVids=vids.filter(v=>v.status==="pending");
        const total=pendingMods.length+pendingPres.length+pendingVids.length+pendingDocs.length;
        if(!total)return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:14,color:K.t3,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-circle-check" style={{fontSize:14,color:K.em}}/>Aucun contenu en attente de validation.</div>;
        const DocTypeInfo={
          "application/pdf":{label:"PDF",ico:"file-text",col:"#EF4444"},
          "lien":{label:"Lien",ico:"link",col:"#1E4FA3"},
          "application/vnd.openxmlformats-officedocument.presentationml.presentation":{label:"PPT",ico:"presentation",col:"#F59E0B"},
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":{label:"Word",ico:"file-type-doc",col:"#3B82F6"},
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{label:"Excel",ico:"file-spreadsheet",col:"#1E4FA3"},
        };
        return <div style={{marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,color:"#F59E0B",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-clock" style={{fontSize:14}}/>En attente de validation ({total})
          </div>
          {/* Modules en attente */}
          {pendingMods.map(m=><div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{background:"#8B5CF618",border:"1px solid #8B5CF630",borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#8B5CF6"}}>MODULE</div>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.titre}</div>
            </div>
            <div style={{fontSize:12,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===m.createdBy)?.nom||"—"} · {m.q?.length||0} questions</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>approveContent("mod",m.id)} className="bt"
                style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-check" style={{fontSize:13}}/>Approuver
              </button>
              <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent("mod",m.id,r);}} className="bt"
                style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-x" style={{fontSize:13}}/>Rejeter
              </button>
            </div>
          </div>)}
          {/* Slides en attente */}
          {pendingPres.map(p=><div key={p.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{background:"#1E4FA318",border:"1px solid #1E4FA330",borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#1E4FA3"}}>SLIDE</div>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div>
            </div>
            <div style={{fontSize:12,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===p.createdBy)?.nom||"—"} · {p.mat||"—"}</div>
            <ApercuLien url={p.url}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>approveContent("pres",p.id)} className="bt"
                style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-check" style={{fontSize:13}}/>Approuver
              </button>
              <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent("pres",p.id,r);}} className="bt"
                style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-x" style={{fontSize:13}}/>Rejeter
              </button>
            </div>
          </div>)}
          {/* Vidéos en attente */}
          {pendingVids.map(p=><div key={p.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{background:"#C2410C18",border:"1px solid #C2410C30",borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#C2410C"}}>VIDÉO</div>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div>
            </div>
            <div style={{fontSize:12,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===p.createdBy)?.nom||"—"}{p.desc?` · ${p.desc}`:""}</div>
            <ApercuLien url={p.url} video/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>approveContent("vid",p.id)} className="bt"
                style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-check" style={{fontSize:13}}/>Approuver
              </button>
              <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent("vid",p.id,r);}} className="bt"
                style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <i className="ti ti-x" style={{fontSize:13}}/>Rejeter
              </button>
            </div>
          </div>)}
          {/* Documents en attente */}
          {pendingDocs.map(d=>{
            const ft=DocTypeInfo[d.type]||{label:d.ext?.toUpperCase()||"Doc",ico:"file",col:"#8B5CF6"};
            return <div key={d.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{background:`${ft.col}18`,border:`1px solid ${ft.col}30`,borderRadius:7,padding:"2px 8px",fontSize:11,fontWeight:700,color:ft.col}}>{ft.label}</div>
                <div style={{fontWeight:700,fontSize:14,color:K.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.titre}</div>
              </div>
              <div style={{fontSize:12,color:K.t3,marginBottom:8}}>Par : {users.find(u=>u.uid===d.createdBy)?.nom||"—"} · {d.size?(d.size/1024/1024).toFixed(1)+" MB":""}</div>
              {d.desc&&<div style={{fontSize:13,color:K.t2,marginBottom:8,lineHeight:1.5}}>{d.desc}</div>}
              {d.type==="lien"&&<div style={{marginBottom:8}}><Miniature url={d.url} w={90} h={120} r={8} K={K} alt={d.titre}/></div>}
              {d.type==="lien"&&<ApercuLien url={d.url} ouvrir={false}/>}
              <div style={{display:"flex",gap:6}}>
                {d.url&&<a href={d.url} target="_blank" rel="noreferrer" className="bt"
                  style={{flex:1,background:K.inBg,border:`1px solid ${K.inBd}`,color:K.in_,borderRadius:8,padding:"7px",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4,textDecoration:"none"}}>
                  <i className="ti ti-external-link" style={{fontSize:13}}/>Ouvrir
                </a>}
                <button onClick={()=>approveDoc(d.id)} className="bt"
                  style={{flex:1,background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <i className="ti ti-check" style={{fontSize:13}}/>Approuver
                </button>
                <button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectDoc(d.id,r);}} className="bt"
                  style={{flex:1,background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:8,padding:"7px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <i className="ti ti-x" style={{fontSize:13}}/>Rejeter
                </button>
              </div>
            </div>;
          })}
        </div>;
        };
  // Statut d'un contenu de formateur dans les listes Présentations / Vidéos, avec publication directe
  const statutContenu=(c,type)=>{
    if(!c.createdBy||c.status==="approved")return null;
    const st={pending:["En attente de validation",K.wa,K.waBg,K.waBd],rejected:["Rejetée",K.er,K.erBg,K.erBd]}[c.status]||["Brouillon (non soumis)",K.t3,K.c2,K.b0];
    const b=(col,bg,bd)=>({background:bg,border:`1px solid ${bd}`,color:col,borderRadius:7,padding:"5px 9px",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",cursor:"pointer",minHeight:30,display:"inline-flex",alignItems:"center",gap:4});
    return <div style={{flexBasis:"100%",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",paddingTop:6,borderTop:`1px dashed ${K.b0}`}}>
      <Tg c={st[1]} bg={st[2]} bd={st[3]} ch={st[0]}/>
      <span style={{fontSize:12,color:K.t3,flex:1,minWidth:120}}>Formateur : {users.find(u=>u.uid===c.createdBy)?.nom||"—"}</span>
      <button onClick={()=>approveContent(type,c.id)} className="bt" style={b(K.em,K.emBg,K.emBd)}><i className="ti ti-check" style={{fontSize:13}}/>Publier</button>
      {c.status!=="rejected"&&<button onClick={()=>{const r=window.prompt("Motif du rejet (visible par le formateur) :");if(r!==null)rejectContent(type,c.id,r);}} className="bt" style={b(K.er,K.erBg,K.erBd)}><i className="ti ti-x" style={{fontSize:13}}/>Rejeter</button>}
    </div>;
  };
  return <div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}>
    <style>{mCss(K)}</style>
    <AutoLogoutBanner warning={aaWarn} mob={mob}/>
    <StaffNav role="admin" nom="Administrateur" onOut={onOut} tabs={ADMIN_TABS} active={gAdmin} onTab={allerGroupeA} onProfil={()=>sT("param")}
      extra={<>{!mob&&<div style={{display:"flex",gap:12,alignItems:"center",marginRight:4}}>
        {[[`${users.length}`,"users",K.t2,"Inscrits"],[`${nD}`,"clock",K.wa,"Demandes d'accès"],[`${nA}`,"circle-check",K.em,"Actifs"]].map(([v,ic,c,t])=>(
          <div key={ic} title={t} style={{display:"flex",alignItems:"center",gap:4}}><i className={`ti ti-${ic}`} style={{fontSize:16,color:c}}/><span style={{fontSize:14,fontWeight:800,color:c}}>{v}</span></div>))}
      </div>}<Cloche K={K} db={db} uid={auth.currentUser?.uid} role="admin" mob={mob} onGo={v=>sT(VUES_ADMIN.includes(v)?v:"home")}/></>}/>
    <div className="mp" style={{maxWidth:1060,margin:"0 auto"}}>
      {msg.m&&<Pop t={msg.t} m={msg.m}/>}
      {tab!=="home"&&<SousNav groupes={GROUPES_ADMIN} vue={tab} onGo={sT} badges={badgesAdmin} c1={ROLE_COL.admin[0]} c2={ROLE_COL.admin[1]}/>}
      {tab==="home"&&(()=>{
        const dashTiles=[
          {k:"d", ico:"clock",          label:"Demandes",       badge:nD, col:"#D97706"},
          {k:"val",ico:"checklist",     label:"Contenus à valider",badge:nAValider, col:"#C98A1B"},
          {k:"a", ico:"circle-check",   label:"Actifs",         badge:nA, col:"#0A2A5C"},
          {k:"e", ico:"clock-off",      label:"Expirés",        badge:nE, col:"#DC2626"},
          {k:"t", ico:"users",          label:"Tous les inscrits",badge:users.length, col:"#475569"},
          {k:"s", ico:"chart-bar",      label:"Statistiques",   col:"#0D7A6B"},
          {k:"m", ico:"book-2",         label:"Cours",          col:"#0A2A5C"},
          {k:"v", ico:"video",          label:"Vidéos",         col:"#C2410C"},
          {k:"pr",ico:"presentation",   label:"Présentations",  col:"#CA8A04"},
          {k:"st",ico:"briefcase",      label:"Stages",         col:"#0891B2"},
          {k:"dm",ico:"message-circle", label:"Demandes services",badge:allDemandesAdmin.filter(d=>d.statut==="nouveau").length, col:"#2563EB"},
          {k:"p", ico:"file-text",      label:"PDF",            col:"#B91C1C"},
          {k:"fo",ico:"school",         label:"Formateurs",     badge:users.filter(u=>u.role==="formateur").length, col:"#7C3AED"},
          {k:"an",ico:"speakerphone",   label:"Annonces",       badge:allAnnonces.filter(a=>a.actif).length, col:"#EA580C"},
          {k:"au",ico:"shield-check",   label:"Audit",          col:"#011B33"},
          {k:"pl",ico:"calendar-check", label:"Présentiel",     col:"#0A2A5C"},
          {k:"ef",ico:"report-money",   label:"États financiers",col:"#1D4ED8"},
          {k:"fisc",ico:"receipt-tax",  label:"Code des impôts",col:"#A3122A"},
          {k:"fin",ico:"chart-pie",     label:"Finance d'entreprise",col:"#B7791F"},
          {k:"ac",ico:"ticket",         label:"Tarifs et codes offerts",col:"#0D7A6B"},
          {k:"att",ico:"certificate",   label:"Attestations",   col:"#B7791F"},
          {k:"nt",ico:"bell",           label:"Notifications",col:"#1E4FA3"},
          {k:"sg",ico:"bulb",           label:"Suggestions",    badge:nSugg, col:"#C98A1B"},
          {k:"msg",ico:"message-circle",label:"Messages",       badge:allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length, col:"#BE123C"},
        ];
        // ── Calcul des indicateurs ──
        const apprenants=users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL);
        const formateurs=users.filter(u=>u.role==="formateur");
        const scoreValsAll=apprenants.flatMap(pctQcm);
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
        const vidsAttente=vids.filter(v=>v.status==="pending").length;
        const totalApprenantsEncadres=formateurs.reduce((sum,f)=>{
          const fModIds=mods.filter(m=>m.createdBy===f.uid).map(m=>m.id);
          return sum+apprenants.filter(u=>fModIds.some(id=>u.progress?.[id]||u.scores?.[id])).length;
        },0);
        const psychoAvg=allPsychoScores.length?Math.round(allPsychoScores.reduce((a,s)=>a+(s.pct||0),0)/allPsychoScores.length):null;
        const nMsgNonLus=allMessages.filter(m=>!m.formateurUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;

        const KpiCard=({label,val,col,suffix})=>
          <div className="tile" style={{padding:mob?"11px 10px":"13px 15px",cursor:"default"}}>
            <div style={{width:26,height:4,borderRadius:4,background:col||K.t2,marginBottom:10,opacity:.85}}/>
            <div style={{fontSize:mob?22:26,fontWeight:900,color:col||K.t1,lineHeight:1,letterSpacing:"-.5px"}}>{val==null?"—":val}{suffix||""}</div>
            <div style={{fontSize:mob?11.5:12.5,color:K.t2,marginTop:7,fontWeight:600,lineHeight:1.3}}>{label}</div>
          </div>;
        const KpiGroup=({title,ico,children})=><div style={{marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:800,color:K.t2,letterSpacing:.6,textTransform:"uppercase",marginBottom:10}}><i className={`ti ti-${ico||"chart-dots"}`} style={{fontSize:16,color:K.em}}/>{title}</div>
          <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(auto-fill,minmax(160px,1fr))",gap:mob?8:10}}>{children}</div>
        </div>;

        return <div style={{animation:"fadeIn .35s ease"}}>
          <StaffHero role="admin" label="Administration" title="Tableau de bord"
            sub={`${nD} demande${nD>1?"s":""} d'accès en attente · ${nMsgNonLus} message${nMsgNonLus>1?"s":""} non lu${nMsgNonLus>1?"s":""} · ${modsAttente+presAttente+docsAttente+vidsAttente} contenu${modsAttente+presAttente+docsAttente+vidsAttente>1?"s":""} à valider`}
            stats={[[`${users.length}`,"Inscrits","users",()=>sT("t")],[`${nD}`,"Demandes d'accès","clock",()=>sT("d")],[`${nA}`,"Actifs","circle-check",()=>sT("a")],[`${mods.filter(m=>m.on!==false).length}`,"Modules","book-2",()=>sT("m")]]}/>

          {/* Une carte par rubrique du menu : écrans et compteurs (en rouge : à traiter) */}
          {(()=>{const T_=Object.fromEntries(dashTiles.map(t=>[t.k,t]));return <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(250px,1fr))",gap:10,marginBottom:26}}>
            {GROUPES_ADMIN.filter(g=>g.k!=="home").map(g=>{const col=T_[g.vues[0][0]]?.col||"#0A2A5C",bg=badgeGroupe(g,badgesAdmin);return <div key={g.k} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"12px 12px 6px"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${col},${col}B0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ti-${g.ico}`} style={{fontSize:18,color:"#fff"}}/></div>
                <div style={{fontWeight:800,fontSize:15,color:K.t1,flex:1}}>{g.label}</div>
                {bg>0&&<span style={{background:K.rd,color:"#fff",borderRadius:99,fontSize:11.5,fontWeight:800,padding:"1px 8px"}}>{bg}</span>}
              </div>
              {g.vues.map(([k,ico,label])=>{const n=T_[k]?.badge,urg=badgesAdmin[k]>0;return <button key={k} onClick={()=>sT(k)} className="bt" style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 6px",background:"none",border:"none",borderTop:`1px solid ${K.b0}`,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:13.5,fontWeight:600,color:K.t1,textAlign:"left"}}>
                <i className={`ti ti-${ico}`} style={{fontSize:16,color:K.t3}}/><span style={{flex:1}}>{label}</span>
                {n>0&&<span style={{fontSize:12.5,fontWeight:800,color:urg?K.rd:K.t3}}>{n}</span>}<i className="ti ti-chevron-right" style={{fontSize:15,color:K.t3}}/></button>;})}
            </div>;})}
          </div>;})()}

          <div className="h-sec" style={{color:K.t1,marginBottom:14}}>Indicateurs</div>

          <KpiGroup title="Utilisateurs" ico="users">
            <KpiCard label="Inscrits au total" val={users.length} col={K.t1}/>
            <KpiCard label="Nouveaux ce mois" val={(()=>{const now=new Date();return users.filter(u=>{const p=String(u.createdAt||"").split("/");if(p.length!==3)return false;return +p[1]===now.getMonth()+1&&+p[2]===now.getFullYear();}).length;})()} col={K.em}/>
            <KpiCard label="Apprenants" val={apprenants.length} col={K.in_}/>
            <KpiCard label="Formateurs" val={formateurs.length} col="#8B5CF6"/>
            <KpiCard label="Abonnements actifs" val={nA} col={K.em}/>
            <KpiCard label="Demandes en attente" val={nD} col={K.wa}/>
            <KpiCard label="Expirés" val={nE} col={K.er}/>
          </KpiGroup>

          <KpiGroup title="Engagement apprenants" ico="activity">
            <KpiCard label="🟢 Engagés" val={nEngage} col="#1E4FA3"/>
            <KpiCard label="🟡 À surveiller" val={nSurveiller} col="#F59E0B"/>
            <KpiCard label="🔴 Inactifs" val={nInactif} col="#EF4444"/>
            <KpiCard label="Ont progressé" val={apprenants.length?Math.round(withProgress/apprenants.length*100):0} suffix="%" col={K.in_}/>
            <KpiCard label="Score moyen (modules)" val={avgScoreGlobal} suffix="%" col={K.em}/>
          </KpiGroup>

          <KpiGroup title="Contenu pédagogique" ico="books">
            <KpiCard label="Modules publiés" val={modsPubliees} col={K.em}/>
            <KpiCard label="Modules en attente" val={modsAttente} col={K.wa}/>
            <KpiCard label="Vidéos" val={vids.length} col={K.in_}/>
            <KpiCard label="Slides publiées" val={presPubliees} col="#1E4FA3"/>
            <KpiCard label="Slides en attente" val={presAttente} col={K.wa}/>
            <KpiCard label="Documents en attente" val={docsAttente} col={K.wa}/>
            <KpiCard label="Vidéos en attente" val={vidsAttente} col={K.wa}/>
            <KpiCard label="Stages" val={allStagesAdmin.length} col={K.t2}/>
          </KpiGroup>

          <KpiGroup title="Formateurs & encadrement" ico="school">
            <KpiCard label="Formateurs actifs" val={formateurs.length} col="#8B5CF6"/>
            <KpiCard label="Apprenants encadrés" val={totalApprenantsEncadres} col="#8B5CF6"/>
          </KpiGroup>

          <KpiGroup title="Psychotechnique" ico="brain">
            <KpiCard label="Tests passés" val={allPsychoScores.length} col={K.in_}/>
            <KpiCard label="Score moyen" val={psychoAvg} suffix="%" col={K.em}/>
          </KpiGroup>

          <KpiGroup title="Activité courante" ico="bell">
            <KpiCard label="Demandes de services" val={allDemandesAdmin.filter(d=>d.statut==="nouveau").length} col={K.in_}/>
            <KpiCard label="Messages non lus" val={nMsgNonLus} col={K.rd}/>
            <KpiCard label="Annonces actives" val={allAnnonces.filter(a=>a.actif).length} col={K.wa}/>
          </KpiGroup>

        </div>;
      })()}
      {["d","a","e","t"].includes(tab)&&<><div style={{marginBottom:10}}><input type="text" placeholder="🔍 Rechercher un nom ou un e-mail…" defaultValue="" onChange={e=>sQ(e.target.value)} style={{padding:"11px 14px",background:K.card,border:`1px solid ${K.b1}`,boxShadow:K.sh,borderRadius:12,color:K.t1,fontSize:15,outline:"none",width:"100%",maxWidth:420,fontFamily:"'Outfit',sans-serif",caretColor:K.em,minHeight:38}} onFocus={e=>e.target.style.borderColor=K.emBd} onBlur={e=>e.target.style.borderColor=K.b0}/></div>{tab==="d"&&nD>0&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"11px 14px",marginBottom:12,fontSize:14,color:K.t1,display:"flex",gap:8,alignItems:"center"}}><i className="ti ti-bulb" style={{fontSize:18,color:K.wa}}/>Vérifiez le paiement, puis <b>Valider</b> → choisissez la durée → le code est créé → envoyez-le avec <i className="ti ti-send"/>.</div>}<Liste list={byT[tab]||fl} empty="Aucun résultat"/></>}
      {tab==="s"&&<div style={{animation:"up .25s ease"}}><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:10}}>Performance modules</div>{users.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"38px",textAlign:"center"}}><div style={{color:K.t3,fontSize:14}}>Aucune donnée.</div></div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>{mods.map(m=>{const at=users.filter(u=>u.scores?.[m.id]),av=at.length?Math.round(at.reduce((a,u)=>a+u.scores[m.id].pct,0)/at.length):0,pa=at.filter(u=>u.scores[m.id].pct>=60).length;return <div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><div style={{width:24,height:24,borderRadius:7,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icoEl(m.ico,m.col,14)}</div><div><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{m.titre}</div><div style={{color:K.t3,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{m.code}</div></div></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:K.t3,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}><span>{at.length} tentatives</span><span>{pa} réussi · {av}%</span></div><Bar p={av} col={m.col} h={3}/></div>;})}</div>}<SuiviExercices K={K} mob={mob} users={users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL)}/></div>}
      {tab==="m"&&<div style={{animation:"up .25s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}><div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Gestion des cours</div><div style={{color:K.t3,fontSize:13,marginTop:2}}>{mods.length} modules · {mods.filter(m=>m.on!==false).length} actifs</div></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{mods.length===0&&<Btn ch="🚀 Initialiser SYSCOHADA" on={seedModules} v="i" sx={{minHeight:38,fontSize:13}}/>}<Btn ch="➕ Nouveau" on={()=>{sEM(null);sNM(true);}} sx={{minHeight:38,fontSize:14}}/></div></div>
        {newMod&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:13,maxHeight:"80vh",overflowY:"auto"}}><ModEditor mod={{}} onSave={()=>{sNM(false);}} onCancel={()=>sNM(false)}/></div>}
        {editMod&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:13,maxHeight:"80vh",overflowY:"auto"}}><ModEditor mod={editMod} onSave={()=>{sEM(null);}} onCancel={()=>sEM(null)}/></div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {mods.map(m=><div key={m.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"12px 15px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",opacity:m.on!==false?1:.62,borderLeft:`4px solid ${m.on!==false?(m.col||K.em):K.b1}`}}>
            <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${m.col||K.em},${m.col||K.em}B0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 6px 14px ${m.col||K.em}35`}}>{icoEl(m.ico,"#fff",20)}</div>
            <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}><span style={{fontWeight:800,fontSize:15.5,color:K.t1}}>{m.titre}</span>{m.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={m.mat}/>}{m.on===false&&<Tg c={K.t3} bg={K.c2} bd={K.b0} ch="Masqué"/>}</div><div style={{color:K.t3,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{m.code} · {m.q?.length||0} questions</div></div>
            <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}>
              <button onClick={()=>saveModule({...m,on:m.on===false})} className="bt" style={{background:m.on!==false?K.waBg:K.emBg,border:`1px solid ${m.on!==false?K.waBd:K.emBd}`,color:m.on!==false?K.wa:K.em,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"'Outfit',sans-serif",minHeight:34}}>{m.on!==false?"Masquer":"Publier"}</button>
              <Btn ch="✏️" on={()=>{sNM(false);sEM(JSON.parse(JSON.stringify(m)));}} v="s" sm/>
              <Btn ch="🗑" on={async()=>{if(window.confirm(`Supprimer "${m.titre}" ?`))await deleteModule(m.id);}} v="d" sm/>
            </div>
          </div>)}
        </div>
      </div>}
      {tab==="v"&&<div style={{animation:"up .25s ease"}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:3}}>Vidéos</div>
        <div style={{background:K.card,border:`1px solid ${live.on?K.rdBd:K.b0}`,borderRadius:12,padding:"13px 15px",marginBottom:13}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11,flexWrap:"wrap",gap:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,animation:live.on?"blink 1.5s ease-in-out infinite":undefined}}>🔴</span><div><div style={{fontWeight:800,fontSize:14,color:K.t1}}>Cours en direct</div></div></div><button onClick={async()=>{await saveLive({...live,on:!live.on,url:rLU.current?.value?.trim()||live.url});}} className="bt" style={{background:live.on?K.rdBg:K.emBg,border:`1px solid ${live.on?K.rdBd:K.emBd}`,color:live.on?K.rd:K.em,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",minHeight:32}}>{live.on?"⏹ Arrêter":"▶ Activer"}</button></div>
          <Inp lb="URL du direct" rf={rLU} ph="https://youtube.com/live/..." def={live.url}/>
          <Inp lb="Titre" rf={rLT} ph="Cours en direct" def={live.titre}/>
          <Inp lb="Description" rf={rLD} ph="Décrivez le cours..." def={live.desc}/>
          <Btn ch={saving?"Enregistrement…":"💾 Enregistrer"} on={saveLiveFn} full sx={{minHeight:40,fontSize:14}} dis={saving}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11,flexWrap:"wrap",gap:8}}><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Vidéothèque ({vids.length})</div><Btn ch="➕ Ajouter" on={()=>sAV(f=>!f)} sx={{minHeight:36,fontSize:13}}/></div>
        {addVid&&<div style={{background:K.card,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"14px",marginBottom:12,animation:"sc .2s ease"}}>
          <Inp lb="Titre *" rf={rVT} ph="Titre de la vidéo"/>
          <Inp lb="URL *" rf={rVU} ph="YouTube · Vimeo · Facebook · lien direct" note="https://youtube.com/watch?v=... ou lien .mp4"/>
          <Inp lb="Description" rf={rVD} ph="Description optionnelle"/>
          <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:5}}>Module associé</div><select ref={rVM} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:14,outline:"none",minHeight:42}}><option value="">Aucun — Vidéothèque générale</option>{mods.filter(m=>m.on!==false).map(m=><option key={m.id} value={m.id}>{m.code} — {m.titre}</option>)}</select></div>
          <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:7}}>{[[true,"🆓 Gratuit","Tous"],[false,"💎 Premium","Abonnés"]].map(([val,lb,note])=><div key={String(val)} onClick={()=>sGr(val)} style={{flex:1,background:gr===val?K.emBg:K.c2,border:`1px solid ${gr===val?K.emBd:K.b0}`,borderRadius:9,padding:"9px 11px",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:13,color:gr===val?K.em:K.t1,marginBottom:1}}>{lb}</div><div style={{fontSize:11,color:K.t3}}>{note}</div></div>)}</div></div>
          <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAV(false)} v="g" full/><Btn ch={saving?"…":"➕ Ajouter"} on={addVidFn} full dis={saving}/></div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:7}}>{vids.map(v=>{const pv=pVid(v.url);return <div key={v.id} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{width:46,height:32,borderRadius:6,background:K.c2,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{pv?.t==="yt"?<img src={`https://img.youtube.com/vi/${pv.id}/default.jpg`} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:14}}>🎬</span>}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.titre}</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap"}}>{v.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}{v.mid&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={mods.find(m=>m.id===v.mid)?.code||""}/>}</div></div><Btn ch="🗑" on={async()=>deleteVideo(v.id)} v="d" sm/>{statutContenu(v,"vid")}</div>;})} </div>
      </div>}
      {tab==="pr"&&<div style={{animation:"up .25s ease"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
    <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Présentations</div><div style={{color:K.t3,fontSize:13,marginTop:2}}>{allPresAdmin.length} présentation{allPresAdmin.length>1?"s":""}</div></div>
    <Btn ch="➕ Ajouter" on={()=>sAddPres(p=>!p)} sx={{minHeight:38,fontSize:14}}/>
  </div>
  {addPres&&<div style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
    <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:10}}>Nouvelle présentation</div>
    <Inp lb="Titre *" rf={rPT} ph="Titre de la présentation"/>
    <Inp lb="URL *" rf={rPU} ph="https://docs.google.com/presentation/... ou lien Canva" note="Google Slides (lien de publication : Fichier → Partager → Publier sur le Web) · Canva (lien d'intégration) · PowerPoint OneDrive : Fichier → Partager → Incorporer, collez le code obtenu (un simple lien de partage OneDrive ne s'affiche pas dans l'app) · URL directe. Un fichier Drive doit être partagé en « Tous les utilisateurs disposant du lien — Lecteur », sinon l'apprenant verra « Demander l'accès »."/>
    <Inp lb="Description" rf={rPD} ph="Résumé du contenu"/>
    <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:5}}>Matière</div><input ref={rPM} placeholder="SYSCOHADA, Droit OHADA..." style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:14,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box",minHeight:44}}/></div>
    <div style={{marginBottom:12}}><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:7}}>{[[true,"🆓 Gratuit","Tous"],[false,"💎 Premium","Abonnés"]].map(([val,lb,note])=><div key={String(val)} onClick={()=>sPresGr(val)} style={{flex:1,background:presGr===val?K.inBg:K.c2,border:`1px solid ${presGr===val?K.inBd:K.b0}`,borderRadius:9,padding:"9px 11px",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:13,color:presGr===val?K.in_:K.t1,marginBottom:1}}>{lb}</div><div style={{fontSize:11,color:K.t3}}>{note}</div></div>)}</div></div>
    <div style={{display:"flex",gap:7}}><Btn ch="Annuler" on={()=>sAddPres(false)} v="g" full/><Btn ch={saving?"…":"➕ Ajouter"} on={async()=>{const titre=rPT.current?.value?.trim()||"";const url=srcIframe(rPU.current?.value||"");if(!titre||!url){alert("Titre et URL requis");return;}if(estOneDrive(url)&&!embedPresentation(url).src&&!window.confirm("Ce lien OneDrive ne pourra pas s'afficher dans l'application : les apprenants devront l'ouvrir dans un nouvel onglet.\n\nPour l'afficher dans l'app : PowerPoint en ligne → Fichier → Partager → Incorporer, puis collez le code obtenu.\n\nEnregistrer quand même ?"))return;sSav(true);await savePresentation({titre,url,desc:rPD.current?.value?.trim()||"",mat:rPM.current?.value?.trim()||"",gr:presGr,ordre:Date.now()});sSav(false);sAddPres(false);[rPT,rPU,rPD,rPM].forEach(r=>{if(r.current)r.current.value="";});}} full dis={saving}/></div>
  </div>}
  {allPresAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"38px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>📊</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune présentation</div><div style={{color:K.t3,fontSize:13}}>Ajoutez votre première présentation Google Slides ou Canva.</div></div>
  :<div style={{display:"flex",flexDirection:"column",gap:8}}>{allPresAdmin.map(p=><div key={p.id} style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:11,padding:"12px 14px",display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
    <div style={{width:38,height:38,borderRadius:10,background:K.inBg,border:`1px solid ${K.inBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-presentation" style={{fontSize:18,color:K.in_}}/></div>
    <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titre}</div><div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>{p.gr?<Tg c={K.em} bg={K.emBg} bd={K.emBd} ch="Gratuit"/>:<Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Premium"/>}{p.mat&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch={p.mat}/>}</div></div>
    <div style={{display:"flex",gap:5,flexShrink:0}}><a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:13}}/>Voir</a><Btn ch="🗑" on={async()=>deletePresentation(p.id)} v="d" sm/></div>{statutContenu(p,"pres")}<NarrationPres K={K} p={p}/>
  </div>)}</div>}
</div>}
{tab==="st"&&<div style={{animation:"up .25s ease"}}>
  {/* Sub-tabs */}
  <div style={{display:"flex",background:K.c2,borderRadius:9,padding:3,marginBottom:13,gap:2}}>
    {[["offres","🎯 Offres de stages"],["plats","🌐 Plateformes"]].map(([k,l])=><button key={k} onClick={()=>sStageTab(k)} className="bt" style={{flex:1,padding:"8px",borderRadius:7,border:"none",fontWeight:700,fontSize:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:stageTab===k?K.card:"transparent",color:stageTab===k?K.t1:K.t3,minHeight:36}}>{l}</button>)}
  </div>

  {/* OFFRES */}
  {stageTab==="offres"&&<>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Offres de stages</div><div style={{color:K.t3,fontSize:13,marginTop:2}}>{allStagesAdmin.length} offre{allStagesAdmin.length>1?"s":""}</div></div>
      <Btn ch="➕ Ajouter une offre" on={()=>sAddStage(p=>!p)} sx={{minHeight:38,fontSize:13}}/>
    </div>
    {addStage&&<div style={{background:K.card,border:`1px solid ${K.waBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:10}}>Nouvelle offre de stage</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp lb="Titre *" rf={rST} ph="Stage Finance Virtuel"/>
        <Inp lb="Entreprise *" rf={rSE} ph="Deloitte, KPMG..."/>
      </div>
      <Inp lb="URL / Lien *" rf={rSU} ph="https://www.theforage.com/..."/>
      <Inp lb="Description" rf={rSD} ph="Décrivez le stage, objectifs, contenu..." rows={3}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:5}}>Catégorie</div><select ref={rSC} style={{width:"100%",padding:"10px 12px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,color:K.t1,fontSize:13,outline:"none",minHeight:42}}>{["Finance & Comptabilité","Droit des affaires","Audit & Contrôle","Banque & Assurance"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <Inp lb="Durée" rf={rSDur} ph="5-6h, 2 semaines..."/>
        <Inp lb="Date fin" ref={rSDF} rf={rSDF} ph="31/12/2025"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Inp lb="Logo (emoji)" rf={rSLogo} ph="🏦 💼 📊..."/>
        <div><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:6}}>{[[true,"Gratuit"],[false,"Payant"]].map(([val,lb])=><div key={String(val)} onClick={()=>{}} style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"8px",cursor:"pointer",textAlign:"center",fontSize:12,fontWeight:600,color:K.t2}}>{lb}</div>)}</div></div>
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
    {allStagesAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"32px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>🎯</div><div style={{color:K.t3,fontSize:14}}>Aucune offre publiée.</div></div>
    :<div style={{display:"flex",flexDirection:"column",gap:7}}>{allStagesAdmin.map(s=>{const cc=CAT_COLORS[s.cat]||{bg:K.c2,bd:K.b0,ac:K.em,ic:"briefcase"};return <div key={s.id} style={{background:K.card,border:`1px solid ${cc.bd}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{width:36,height:36,borderRadius:9,background:cc.bg,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:s.logo?18:14,flexShrink:0}}>{s.logo||<i className={"ti ti-"+cc.ic} style={{fontSize:16,color:cc.ac}}/>}</div>
      <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.titre}</div><div style={{display:"flex",gap:5,marginTop:2,flexWrap:"wrap"}}><Tg c={cc.ac} bg={cc.bg} bd={cc.bd} ch={s.entreprise}/><Tg c={K.t3} bg="none" bd={K.b0} ch={s.cat}/></div></div>
      <div style={{display:"flex",gap:5,flexShrink:0}}><a href={s.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:13}}/>Voir</a><Btn ch="🗑" on={async()=>deleteStage(s.id)} v="d" sm/></div>
    </div>;})}
    </div>}
  </>}

  {/* PLATEFORMES */}
  {stageTab==="plats"&&<>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1}}>Plateformes</div><div style={{color:K.t3,fontSize:13,marginTop:2}}>{allPlatsAdmin.length} plateforme{allPlatsAdmin.length>1?"s":""}</div></div>
        {allPlatsAdmin.length===0?<Btn ch="🚀 Charger plateformes" on={async()=>{sSav(true);await seedPlateformes();sSav(false);sMsg({t:"o",m:"8 plateformes chargées !"});setTimeout(()=>sMsg({t:"",m:""}),3000);}} v="i" sx={{minHeight:36,fontSize:13}} dis={saving}/>:<Btn ch="➕ Ajouter" on={()=>sAddPlat(p=>!p)} sx={{minHeight:36,fontSize:13}}/>}
    </div>
    {addPlat&&<div style={{background:K.card,border:`1px solid ${K.inBd}`,borderRadius:12,padding:"14px",marginBottom:13,animation:"sc .2s ease"}}>
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:10}}>Nouvelle plateforme</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Inp lb="Nom *" rf={rPN} ph="The Forage, Coursera..."/>
        <Inp lb="Logo (emoji)" rf={rPLogo} ph="🌾 🎓 💼..."/>
      </div>
      <Inp lb="URL *" rf={rPUrl} ph="https://www.theforage.com"/>
      <Inp lb="Description *" rf={rPDesc} ph="Décrivez la plateforme..." rows={2}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <Inp lb="Langue" rf={rPLang} ph="FR, EN, FR/EN..."/>
        <div><div style={{color:K.t2,fontSize:13,fontWeight:600,marginBottom:5}}>Catégories</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["Finance & Comptabilité","Droit des affaires","Audit & Contrôle","Banque & Assurance"].map(c=>{
            const[selCats,sSelCats]=window._platCats||[[],(f)=>{window._platCats=[f(window._platCats?.[0]||[]),window._platCats?.[1]];window._platCatsForce&&window._platCatsForce();}];
            return null;
          })}
          <div style={{fontSize:12,color:K.t3}}>Sélectionnez après création</div>
        </div></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>{[[true,"🆓 Gratuit"],[false,"💎 Freemium"]].map(([val,lb])=><div key={String(val)} style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"8px",textAlign:"center",fontSize:12,fontWeight:600,color:K.t2,cursor:"pointer"}}>{lb}</div>)}</div>
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
    {allPlatsAdmin.length===0?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"32px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:7,animation:"fl 3s ease-in-out infinite"}}>🌐</div><div style={{color:K.t3,fontSize:14,marginBottom:7}}>Aucune plateforme.</div><div style={{color:K.t3,fontSize:12}}>Cliquez "Charger plateformes" pour les 8 plateformes pré-configurées, ou "➕ Ajouter" pour la vôtre.</div></div>
    :<div style={{display:"flex",flexDirection:"column",gap:7}}>{allPlatsAdmin.map(p=>{const cc=CAT_COLORS[p.cats?.[0]]||{bg:K.c2,bd:K.b0,ac:K.em};return <div key={p.id} style={{background:K.card,border:`1px solid ${cc.bd}`,borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{width:36,height:36,borderRadius:9,background:cc.bg,border:`1px solid ${cc.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.logo}</div>
      <div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{p.nom}</div><div style={{fontSize:11,color:K.t3,marginTop:1}}>{p.langue} · {p.gratuit?"Gratuit":"Freemium"}</div></div>
      <div style={{display:"flex",gap:5,flexShrink:0}}><a href={p.url} target="_blank" rel="noreferrer" className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"5px 9px",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,minHeight:30,textDecoration:"none"}}><i className="ti ti-external-link" style={{fontSize:13}}/>Visiter</a><Btn ch="🗑" on={async()=>deletePlateforme(p.id)} v="d" sm/></div>
    </div>;})}
    </div>}
  </>}
</div>}
{tab==="dm"&&<div style={{animation:"up .25s ease"}}>
  <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:3}}>Demandes de services</div>
  <div style={{color:K.t3,fontSize:13,marginBottom:13}}>{allDemandesAdmin.filter(d=>d.statut==="nouveau").length} nouvelle{allDemandesAdmin.filter(d=>d.statut==="nouveau").length>1?"s":""} · {allDemandesAdmin.length} au total</div>
  {allDemandesAdmin.length===0
    ?<div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"38px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:9,animation:"fl 3s ease-in-out infinite"}}>💼</div><div style={{color:K.t2,fontWeight:700,fontSize:14,marginBottom:3}}>Aucune demande</div><div style={{color:K.t3,fontSize:13}}>Les demandes des clients apparaîtront ici.</div></div>
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
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}><span style={{fontWeight:800,fontSize:14,color:K.t1}}>{d.nom}</span><span style={{background:sBg,border:`1px solid ${sBd}`,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700,color:sCol}}>{d.statut}</span></div>
              <div style={{color:K.t3,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{d.email}{d.tel?` · ${d.tel}`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:12,color:K.t3}}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</div></div>
          </div>
          <div style={{background:K.c2,borderRadius:9,padding:"8px 11px",marginBottom:10}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:d.message?6:0}}>
              <span style={{background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:5,padding:"2px 8px",fontSize:12,color:K.in_,fontWeight:600}}>{d.service}</span>
            </div>
            {d.message&&<div style={{fontSize:13,color:K.t2,lineHeight:1.5,marginTop:5}}>{d.message}</div>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <a href={`mailto:${d.email}?subject=Re: Votre demande — ${d.service}`} style={{display:"inline-flex",alignItems:"center",gap:5,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:7,padding:"6px 11px",color:K.in_,fontWeight:700,fontSize:12,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:30}}><i className="ti ti-mail" style={{fontSize:13}}/>Répondre</a>
            {d.tel&&<a href={`https://wa.me/${d.tel.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.3)",borderRadius:7,padding:"6px 11px",color:"#25D366",fontWeight:700,fontSize:12,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:30}}><i className="ti ti-brand-whatsapp" style={{fontSize:13}}/>WhatsApp</a>}
            {isNew&&<Btn ch="✓ Marquer traité" on={async()=>updateDemande(d.id,{statut:"traité"})} v="s" sm/>}
            {!isNew&&<Btn ch="↩ Rouvrir" on={async()=>updateDemande(d.id,{statut:"nouveau"})} v="g" sm/>}
          </div>
        </div>;
      })}
    </div>
  }
</div>}
{tab==="val"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:6,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-checklist" style={{fontSize:20,color:K.wa}}/>Contenus à valider</div>
      <div style={{fontSize:13,color:K.t3,marginBottom:14,lineHeight:1.5}}>Modules, présentations, vidéos et documents soumis par les formateurs. Un brouillon non soumis se publie depuis les onglets Présentations ou Vidéos.</div>
      {blocValidation()}
    </div>}
{tab==="fo"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
        <i className="ti ti-school" style={{fontSize:20,color:"#8B5CF6"}}/>Gestion des formateurs
      </div>
      {blocValidation()}
      {/* Liste formateurs */}
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:10}}>Formateurs actifs</div>
      {(()=>{
        const formateurs=users.filter(u=>u.role==="formateur");
        if(!formateurs.length)return <EmptyState ico="school" title="Aucun formateur" desc="Générez un code FO- pour inviter un formateur."/>;
        return <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {formateurs.map(f=>{
            const fModIds=mods.filter(m=>m.createdBy===f.uid).map(m=>m.id);
            const fApprenants=users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL&&fModIds.some(id=>u.progress?.[id]||u.scores?.[id])).length;
            return <div key={f.uid} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>{(f.nom||"F")[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{f.nom}</div>
              <div style={{fontSize:12,color:K.t3}}>{f.mail} · {fModIds.length} module{fModIds.length>1?"s":""} · <span style={{color:"#8B5CF6",fontWeight:700}}>{fApprenants} apprenant{fApprenants>1?"s":""} encadré{fApprenants>1?"s":""}</span></div>
            </div>
            {f.formateurCode&&<span style={{background:"#8B5CF618",border:"1px solid #8B5CF630",borderRadius:7,padding:"3px 8px",fontSize:11,fontWeight:700,color:"#8B5CF6",fontFamily:"monospace",flexShrink:0}}>{f.formateurCode}</span>}
            <button onClick={()=>{if(window.confirm(`Rétrograder ${f.nom} en apprenant ? Il perdra son accès formateur.`))updateDoc(doc(db,"users",f.uid),{role:deleteField(),formateurCodeValide:false});}} className="bt" title="Rétrograder en apprenant"
              style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:7,padding:"5px 8px",cursor:"pointer",flexShrink:0}}>
              <i className="ti ti-user-down" style={{fontSize:14}}/>
            </button>
          </div>;})}
        </div>;
      })()}
      {/* Inviter */}
      <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:8}}>Inviter un formateur</div>
      <div style={{background:K.card,border:`1px solid #8B5CF630`,borderRadius:12,padding:"16px"}}>
        <div style={{fontSize:13,color:K.t2,marginBottom:12,lineHeight:1.6}}>Choisissez un utilisateur inscrit pour lui générer un code FO-. Il devra saisir ce code pour accéder à l'espace formateur.</div>
        <select onChange={e=>{if(e.target.value){genFormateurCode(e.target.value);e.target.value="";}}}
          style={{width:"100%",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:8,padding:"9px 11px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif",cursor:"pointer",marginBottom:12}}>
          <option value="">Choisir un utilisateur...</option>
          {users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL).map(u=><option key={u.uid} value={u.uid}>{u.nom} ({u.mail})</option>)}
        </select>
        {/* Code généré — affiché en permanence */}
        {lastFoCode.code&&<div style={{background:"#8B5CF618",border:"1px solid #8B5CF640",borderRadius:10,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"#8B5CF6",fontWeight:700,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>Code formateur généré</div>
          <div style={{fontFamily:"monospace",fontSize:22,fontWeight:900,color:"#8B5CF6",letterSpacing:4,marginBottom:8}}>{lastFoCode.code}</div>
          <div style={{fontSize:12,color:K.t3,marginBottom:10}}>Pour : {users.find(u=>u.uid===lastFoCode.uid)?.nom||""}</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>navigator.clipboard?.writeText(lastFoCode.code)} className="bt"
              style={{background:"#8B5CF6",border:"none",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-copy" style={{fontSize:13}}/>Copier le code
            </button>
            <button onClick={async()=>{
              const u=users.find(x=>x.uid===lastFoCode.uid);
              if(!u)return;
              await sendNotifEmail({to_email:u.mail,subject:"Votre code formateur — Éco-Campus RDC",nom:u.nom,message:`Félicitations ! Vous avez été désigné(e) formateur sur Éco-Campus RDC.\n\nVotre code formateur : ${lastFoCode.code}\n\nPour l'activer :\n1. Connectez-vous sur eco-campus-rdc.vercel.app\n2. Cliquez sur "J'ai un code"\n3. Saisissez votre mot de passe puis le code : ${lastFoCode.code}\n\nÀ très vite !`});
              sMsg({t:"o",m:`✅ Email envoyé à ${u.mail}`});setTimeout(()=>sMsg({t:"",m:""}),3000);
            }} className="bt"
              style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
              <i className="ti ti-mail" style={{fontSize:13}}/>Envoyer automatiquement
            </button>
          </div>
        </div>}
      </div>
    </div>}
    {tab==="p"&&<div style={{animation:"up .25s ease"}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:3}}>PDF d'exercices</div>
        <div style={{color:K.t3,fontSize:13,marginBottom:13}}>Un PDF par module · Fichier 📤 ou lien Google Drive 🔗 · Lecture seule pour abonnés.</div>
        {pdfMsg.m&&<div style={{position:"sticky",top:mob?60:112,zIndex:5,marginBottom:10}}><Pop t={pdfMsg.t} m={pdfMsg.m}/></div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{mods.filter(m=>m.on!==false).map(m=>{const pdf=pdfs[m.id];const ico=<div style={{width:32,height:32,borderRadius:9,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icoEl(m.ico,m.col,15)}</div>;return <div key={m.id} style={{background:K.card,border:`1px solid ${pdf?K.inBd:K.b0}`,borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>{pdf?.lien?<Miniature url={pdf.url} w={36} h={48} r={6} K={K} fallback={ico}/>:ico}<div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{m.titre}</div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{m.code}{pdf?(pdf.lien?" · 🔗 Lien Google Drive":` · 📄 ${pdf.name}`):" · Aucun PDF"}</div></div><div style={{display:"flex",gap:5,flexShrink:0}}>
          <label className="bt" style={{background:pdf?K.c2:`linear-gradient(135deg,${K.inD},${K.in_})`,color:pdf?K.t2:"#fff",border:pdf?`1px solid ${K.b0}`:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:4,minHeight:34}}>
            {pdfEnvoi===m.id?"⏳":pdf?"🔄":"📤"}
            <input type="file" accept=".pdf,application/pdf" style={{display:"none"}} disabled={!!pdfEnvoi} onChange={async e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;
              const err=t=>{sPdfMsg({t:"e",m:t});setTimeout(()=>sPdfMsg({t:"",m:""}),6000);};
              if(!estPdf(f))return err(`« ${f.name} » n'est pas un PDF.`);
              if(f.size>15*1024*1024)return err("Fichier trop lourd : 15 Mo maximum.");
              sPdfEnvoi(m.id);
              try{const res=await uploadPdf(m.id,f);sPdfs(p=>({...p,[m.id]:res}));sPdfMsg({t:"o",m:`✓ PDF « ${f.name} » enregistré pour ${m.titre}.`});setTimeout(()=>sPdfMsg({t:"",m:""}),3500);}
              catch(x){err(`Échec de l'envoi : ${msgStorage(x)}`);}
              finally{sPdfEnvoi(null);}}}/>
          </label>
          <Btn ch="🔗" on={()=>{sLienMod(lienMod===m.id?null:m.id);sLienVal(pdf?.lien?pdf.url:"");}} v="g" sm/>
          {pdf&&<Btn ch="🗑" on={async()=>{try{await deletePdf(m.id,pdf.name,pdf.lien);sPdfs(p=>{const n={...p};delete n[m.id];return n;});}catch(x){sPdfMsg({t:"e",m:`Suppression impossible : ${msgStorage(x)}`});setTimeout(()=>sPdfMsg({t:"",m:""}),6000);}}} v="d" sm/>}
        </div>
        {lienMod===m.id&&<div style={{flexBasis:"100%",display:"flex",flexDirection:"column",gap:7}}>
          <ChampLien K={K} val={lienVal} onChange={sLienVal} lb="Lien Google Drive du PDF"/>
          <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
            <Btn ch="Annuler" on={()=>{sLienMod(null);sLienVal("");}} v="g" sm/>
            <Btn ch={pdfEnvoi===m.id?"⏳":"Enregistrer le lien"} on={async()=>{
              const u=lienVal.trim();
              if(!lienValide(u)){sPdfMsg({t:"e",m:"Lien invalide : collez un lien complet commençant par https://"});setTimeout(()=>sPdfMsg({t:"",m:""}),6000);return;}
              sPdfEnvoi(m.id);
              try{const res={name:m.titre,url:u,modId:m.id,lien:true};await setDoc(doc(db,"pdfs",m.id),res);
                if(pdf&&!pdf.lien)try{await deleteObject(ref(storage,`pdfs/${m.id}/${pdf.name}`));}catch(e){}
                sPdfs(p=>({...p,[m.id]:res}));sLienMod(null);sLienVal("");
                sPdfMsg({t:"o",m:`✓ Lien enregistré pour ${m.titre}.`});setTimeout(()=>sPdfMsg({t:"",m:""}),3500);}
              catch(x){sPdfMsg({t:"e",m:`Enregistrement impossible : ${x.message}`});setTimeout(()=>sPdfMsg({t:"",m:""}),6000);}
              finally{sPdfEnvoi(null);}}} sm/>
          </div>
        </div>}
        </div>;})}
        </div>
        <div style={{marginTop:13,padding:"10px 13px",background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:9,fontSize:13,color:K.t2}}>🔗 <b>Lien Google Drive</b> : dans Drive, Partager → « Tous les utilisateurs disposant du lien » (Lecteur), puis copiez le lien. Pour empêcher le téléchargement : Partager → ⚙️ → décochez « Les lecteurs et les commentateurs peuvent voir l'option de téléchargement ».</div>
      </div>}
    {tab==="param"&&<ParametresAdmin onOut={onOut}/>}
    {tab==="ac"&&<AdminAcces K={K} mob={mob} db={db}/>}
    {tab==="att"&&<AdminAttestations K={K} mob={mob} db={db}/>}
    {tab==="nt"&&<><AdminNotif K={K} mob={mob} db={db} users={users}/><AdminMarketing K={K} mob={mob} db={db}/></>}
    {tab==="sg"&&<AdminSuggestions K={K} mob={mob} db={db}/>}
    {tab==="an"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-speakerphone" style={{fontSize:20,color:K.wa}}/>Annonces & Publicités
        </div>
        <Btn ch="+ Nouvelle annonce" on={()=>sEditAn({titre:"",contenu:"",type:"info",actif:true,expireAt:""})} v="i" sm/>
      </div>
      {allAnnonces.length===0
        ?<div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"20px",textAlign:"center",fontSize:14,color:K.t3}}>Aucune annonce pour l'instant.</div>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {allAnnonces.map(a=>{
            const typeInfo={info:{label:"Info",col:K.in_},promo:{label:"Promo",col:K.wa},urgent:{label:"Urgent",col:K.er}}[a.type||"info"];
            const expired=a.expireAt&&new Date(a.expireAt)<new Date();
            return <div key={a.id} style={{background:K.card,border:`1px solid ${a.actif&&!expired?K.b1:K.b0}`,borderRadius:12,padding:"13px 15px",opacity:a.actif&&!expired?1:.6}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{background:`${typeInfo.col}18`,border:`1px solid ${typeInfo.col}30`,borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700,color:typeInfo.col}}>{typeInfo.label}</span>
                {!a.actif&&<span style={{fontSize:11,color:K.t3}}>Désactivée</span>}
                {expired&&<span style={{fontSize:11,color:K.er}}>Expirée</span>}
              </div>
              <div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>{a.titre}</div>
              <div style={{fontSize:13,color:K.t2,marginBottom:10,lineHeight:1.5}}>{a.contenu}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>saveAnnonce({...a,actif:!a.actif})} className="bt" style={{background:a.actif?K.waBg:K.emBg,border:`1px solid ${a.actif?K.waBd:K.emBd}`,color:a.actif?K.wa:K.em,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>{a.actif?"Désactiver":"Activer"}</button>
                <button onClick={()=>sEditAn(a)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,color:K.t2,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Éditer</button>
                <button onClick={async()=>{if(window.confirm(`Supprimer "${a.titre}" ?`))await deleteAnnonce(a.id);}} className="bt" style={{background:K.erBg,border:`1px solid ${K.erBd}`,color:K.er,borderRadius:7,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Supprimer</button>
              </div>
            </div>;
          })}
        </div>}
    </div>}
    {editAn&&<Sheet title={editAn.id?"Modifier l'annonce":"Nouvelle annonce"} onClose={()=>sEditAn(null)}>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Titre</label>
        <input value={editAn.titre} onChange={e=>sEditAn({...editAn,titre:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Contenu</label>
        <textarea value={editAn.contenu} onChange={e=>sEditAn({...editAn,contenu:e.target.value})} rows={4} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14,resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Type</label>
          <select value={editAn.type} onChange={e=>sEditAn({...editAn,type:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}>
            <option value="info">Info</option>
            <option value="promo">Promo</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Expire le (optionnel)</label>
          <input type="date" value={editAn.expireAt||""} onChange={e=>sEditAn({...editAn,expireAt:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
        </div>
      </div>
      <Btn ch="Enregistrer" on={async()=>{if(!editAn.titre.trim())return;await saveAnnonce(editAn);if(!editAn.id&&editAn.actif)notifier({dest:"apprenants",type:"annonce",titre:editAn.titre.trim(),texte:editAn.contenu||"",vue:"home",auteurNom:"Éco-Campus RDC"});sEditAn(null);}} full/>
    </Sheet>}
    {tab==="msg"&&<div style={{animation:"fadeIn .35s ease"}}>
      {!activeThread?<>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-message-circle" style={{fontSize:20,color:K.rd}}/>Messagerie
        </div>
        {(()=>{
          const convMap={};
          allMessages.filter(m=>!m.formateurUid).forEach(m=>{if(!convMap[m.apprenantUid]||m.ts>convMap[m.apprenantUid].ts)convMap[m.apprenantUid]=m;});
          const convs=Object.values(convMap).sort((a,b)=>b.ts-a.ts);
          if(convs.length===0)return <div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"20px",textAlign:"center",fontSize:14,color:K.t3}}>Aucun message pour l'instant.</div>;
          return <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {convs.map(c=>{
              const unread=allMessages.filter(m=>!m.formateurUid&&m.apprenantUid===c.apprenantUid&&m.fromRole==="apprenant"&&!m.luAdmin).length;
              return <div key={c.apprenantUid} onClick={()=>sActiveThread(c.apprenantUid)} className="bt" style={{background:K.card,border:`1px solid ${unread>0?K.rdBd:K.b0}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontWeight:800,fontSize:14,flexShrink:0}}>{(c.apprenantNom||"?")[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{c.apprenantNom||"Apprenant"}</div>
                  <div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.fromRole==="admin"?"Vous : ":""}{c.texte}</div>
                </div>
                {unread>0&&<span style={{background:K.rd,color:"#fff",fontSize:11,fontWeight:800,borderRadius:99,padding:"2px 7px",flexShrink:0}}>{unread}</span>}
              </div>;
            })}
          </div>;
        })()}
      </>:<AdminThread apprenantUid={activeThread} apprenantMail={users.find(u=>u.uid===activeThread)?.mail} onBack={()=>sActiveThread(null)}/>}
    </div>}
    {tab==="au"&&<div style={{animation:"fadeIn .35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,display:"flex",alignItems:"center",gap:7}}>
          <i className="ti ti-shield-check" style={{fontSize:20,color:K.in_}}/>Audit & Utilisateurs
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>exportUsersCsv(users)} className="bt" style={{background:K.c2,border:`1px solid ${K.b1}`,color:K.t2,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <i className="ti ti-download" style={{fontSize:14}}/>Export CSV
          </button>
          <Btn ch="+ Nouvel utilisateur" on={()=>{sNewUser({nom:"",mail:"",password:"",role:"apprenant"});sNuErr("");}} v="i" sm/>
        </div>
      </div>
      {(()=>{
        const now=Date.now(),J=86400000,debutJour=new Date().setHours(0,0,0,0);
        const enLigne=activite.filter(a=>a.enLigne!==false&&now-tsMs(a.lastSeen)<ENLIGNE_MS).sort((a,b)=>tsMs(b.lastSeen)-tsMs(a.lastSeen));
        const recents=activite.filter(a=>!enLigne.includes(a)&&now-tsMs(a.lastSeen)<7*J).sort((a,b)=>tsMs(b.lastSeen)-tsMs(a.lastSeen)).slice(0,12);
        const cxJour=connexions.filter(c=>tsMs(c.ts)>=debutJour);
        const uniq=d=>new Set(connexions.filter(c=>now-tsMs(c.ts)<d*J).map(c=>c.uid)).size;
        const per={jour:debutJour,"7":now-7*J,"30":now-30*J,tout:0}[auPer];
        const ql=auQ.trim().toLowerCase();
        const journal=connexions.filter(c=>tsMs(c.ts)>=per&&(auRole==="tous"||c.role===auRole)&&(!ql||(c.nom||"").toLowerCase().includes(ql)||(c.mail||"").toLowerCase().includes(ql)));
        const RC_={apprenant:[K.in_,"Apprenant"],formateur:["#7C3AED","Formateur"],admin:[K.wa,"Admin"]};
        const Role=({r})=>{const[c,l]=RC_[r]||[K.t3,r||"—"];return <span style={{fontSize:11.5,fontWeight:800,color:c,background:`${c}14`,border:`1px solid ${c}30`,borderRadius:99,padding:"1px 8px",whiteSpace:"nowrap"}}>{l}</span>;};
        const App_=({a})=>a?<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12.5,color:K.t3,whiteSpace:"nowrap"}}><i className={`ti ti-${a.type==="Mobile"?"device-mobile":"device-desktop"}`} style={{fontSize:14}}/>{a.os} · {a.app==="Application"?"Application":a.nav}</span>:null;
        const Av=({n,on})=><div style={{position:"relative",flexShrink:0}}><div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>{(n||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><span style={{position:"absolute",right:-1,bottom:-1,width:12,height:12,borderRadius:"50%",background:on?"#16A34A":K.t3,border:`2px solid ${K.c2}`}}/></div>;
        const jourDe=t=>new Date(t).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
        const exportJournal=()=>{
          const rows=[["Date","Heure","Nom","E-mail","Rôle","Appareil","Système","Accès"],...journal.map(c=>{const d=new Date(tsMs(c.ts));return[d.toLocaleDateString("fr-FR"),d.toLocaleTimeString("fr-FR"),c.nom,c.mail,c.role,c.appareil?.type||"",c.appareil?.os||"",c.appareil?.app==="Application"?"Application":(c.appareil?.nav||"")];})];
          const csv="﻿"+rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
          const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`connexions_${new Date().toISOString().slice(0,10)}.csv`;a.click();
        };
        const card={background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:18,padding:mob?"14px":"16px 18px",marginBottom:16};
        const H=({ico,t,n,col})=><div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1}}><i className={`ti ti-${ico}`} style={{fontSize:19,color:col||K.em}}/>{t}{n!=null&&<span style={{fontSize:13,fontWeight:800,color:col||K.em,background:`${col||K.em}14`,borderRadius:99,padding:"1px 9px"}}>{n}</span>}</div>;
        return <>
          <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[[enLigne.length,"En ligne maintenant","wifi","#16A34A"],[cxJour.length,"Connexions aujourd'hui","login",K.in_],[uniq(7),"Personnes actives (7 j)","users",K.em],[uniq(30),"Personnes actives (30 j)","calendar-stats",K.wa]].map(([v,l,ic,c])=>
              <div key={l} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"13px 15px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:mob?24:28,fontWeight:900,color:c,lineHeight:1}}>{v}</span><i className={`ti ti-${ic}`} style={{fontSize:22,color:c,opacity:.8}}/></div>
                <div style={{fontSize:12.5,color:K.t2,fontWeight:600,marginTop:7}}>{l}</div>
              </div>)}
          </div>
          <div style={card}>
            <div style={{marginBottom:12}}><H ico="wifi" t="En ligne maintenant" n={enLigne.length} col="#16A34A"/></div>
            {!enLigne.length&&<div style={{fontSize:14,color:K.t3}}>Personne n'est connecté en ce moment.</div>}
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(2,1fr)",gap:10}}>
              {enLigne.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",background:K.c2,borderRadius:14,border:`1px solid ${K.b0}`}}>
                <Av n={a.nom} on/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontWeight:800,fontSize:14.5,color:K.t1}}>{a.nom}</span><Role r={a.role}/></div>
                  <div style={{fontSize:13,color:K.t2,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><i className="ti ti-eye" style={{fontSize:13,marginRight:4}}/>{a.vue||"—"}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:2}}><App_ a={a.appareil}/><span style={{fontSize:12.5,color:"#16A34A",fontWeight:700}}>{ilya(tsMs(a.lastSeen))}</span></div>
                </div>
              </div>)}
            </div>
            {recents.length>0&&<>
              <div style={{fontSize:13,fontWeight:800,color:K.t3,textTransform:"uppercase",letterSpacing:.6,margin:"16px 0 8px"}}>Vus récemment (7 jours)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {recents.map(a=><div key={a.id} title={`${a.vue||""} · ${a.appareil?.os||""}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px 6px 6px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:K.b1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:K.t2}}>{(a.nom||"?")[0].toUpperCase()}</div>
                  <span style={{fontSize:13,fontWeight:700,color:K.t1}}>{a.nom}</span><span style={{fontSize:12,color:K.t3}}>{ilya(tsMs(a.lastSeen))}</span>
                </div>)}
              </div>
            </>}
          </div>
          <div style={card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <H ico="history" t="Journal des connexions" n={journal.length}/>
              <button onClick={exportJournal} className="bt" style={{background:K.c2,border:`1px solid ${K.b1}`,color:K.t2,borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}><i className="ti ti-download" style={{fontSize:15}}/>Export Excel (CSV)</button>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              {[["jour","Aujourd'hui"],["7","7 jours"],["30","30 jours"],["tout","Tout"]].map(([k,l])=><button key={k} onClick={()=>sAuPer(k)} className="bt" style={{padding:"6px 13px",borderRadius:99,border:`1px solid ${auPer===k?K.em:K.b0}`,background:auPer===k?K.em:K.c2,color:auPer===k?"#fff":K.t2,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{l}</button>)}
              <select value={auRole} onChange={e=>sAuRole(e.target.value)} style={{padding:"6px 10px",borderRadius:99,border:`1px solid ${K.b0}`,background:K.c2,color:K.t1,fontSize:13,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}><option value="tous">Tous les rôles</option><option value="apprenant">Apprenants</option><option value="formateur">Formateurs</option><option value="admin">Administrateur</option></select>
              <input value={auQ} onChange={e=>sAuQ(e.target.value)} placeholder="🔍 Nom ou e-mail…" style={{flex:1,minWidth:160,padding:"6px 12px",borderRadius:99,border:`1px solid ${K.b0}`,background:K.c2,color:K.t1,fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
            </div>
            {!journal.length&&<div style={{fontSize:14,color:K.t3}}>Aucune connexion sur cette période.</div>}
            <div style={{maxHeight:460,overflowY:"auto"}}>
              {journal.map((c,i)=>{const t=tsMs(c.ts),d=new Date(t),jour=jourDe(t),prev=i>0?jourDe(tsMs(journal[i-1].ts)):null;
                return <React.Fragment key={c.id}>
                  {jour!==prev&&<div style={{fontSize:12.5,fontWeight:800,color:K.t3,textTransform:"capitalize",padding:"10px 2px 6px",position:"sticky",top:0,background:K.card}}>{jour}</div>}
                  <div style={{display:"grid",gridTemplateColumns:mob?"52px 1fr":"64px 1.4fr auto 1fr",gap:10,alignItems:"center",padding:"9px 4px",borderTop:`1px solid ${K.b0}`}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:K.t1}}>{d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:K.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                      {!mob&&c.mail&&<div style={{fontSize:12,color:K.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.mail}</div>}
                      {mob&&<div style={{display:"flex",gap:8,alignItems:"center",marginTop:3,flexWrap:"wrap"}}><Role r={c.role}/><App_ a={c.appareil}/></div>}
                    </div>
                    {!mob&&<Role r={c.role}/>}{!mob&&<App_ a={c.appareil}/>}
                  </div>
                </React.Fragment>;})}
            </div>
            <div style={{fontSize:12,color:K.t3,marginTop:10}}>Les {connexions.length} dernières connexions enregistrées. Une connexion est notée à chaque ouverture de l'application.</div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:14,padding:"12px 14px",background:K.erBg,border:`1px solid ${K.erBd}`,borderRadius:14}}>
              <i className="ti ti-trash" style={{fontSize:18,color:K.er}}/>
              <span style={{fontSize:13.5,fontWeight:700,color:K.t1,flex:1,minWidth:180}}>Purger le journal : supprimer les connexions de plus de</span>
              <select value={auGarde} onChange={e=>sAuGarde(e.target.value)} style={{padding:"6px 10px",borderRadius:10,border:`1px solid ${K.erBd}`,background:K.card,color:K.t1,fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
                {[["3","3 mois"],["6","6 mois"],["12","12 mois"],["24","24 mois"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={lancerPurge} disabled={auPurge} className="bt" style={{background:K.er,border:"none",color:"#fff",borderRadius:10,padding:"8px 14px",cursor:auPurge?"wait":"pointer",fontSize:13,fontWeight:800,fontFamily:"'Outfit',sans-serif",opacity:auPurge?.6:1}}>{auPurge?"Suppression…":"Purger"}</button>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1,margin:"6px 0 10px"}}><i className="ti ti-users" style={{fontSize:19,color:K.em}}/>Comptes et engagement</div>
        </>;
      })()}
      <div style={{fontSize:13,color:K.t3,marginBottom:8}}>{users.length} compte{users.length>1?"s":""} · {users.filter(u=>u.lastLogin).length} déjà connecté{users.filter(u=>u.lastLogin).length>1?"s":""}</div>
      <div style={{display:"flex",gap:12,marginBottom:13,flexWrap:"wrap"}}>
        {[["#EF4444","🔴 Inactif","+ de 14 jours sans connexion"],["#F59E0B","🟡 À surveiller","peu actif ou 8-14 jours"],["#1E4FA3","🟢 Engagé","actif et progresse"]].map(([c,l,d])=>
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:K.t3}}><span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>{l} <span style={{color:K.t3,opacity:.7}}>— {d}</span></div>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {[...users].sort((a,b)=>Math.max(b.lastLogin||0,tsMs(activite.find(x=>x.id===b.uid)?.lastSeen))-Math.max(a.lastLogin||0,tsMs(activite.find(x=>x.id===a.uid)?.lastSeen))).map(u=>{
          const jamais=!u.lastLogin&&!activite.some(a=>a.id===u.uid);
          const isApprenant=u.role!=="formateur"&&u.mail!==ADM_EMAIL;
          const nMods=Object.values(u.progress||{}).filter(v=>v==="done").length;
          const scoreVals=pctQcm(u);
          const avgScore=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length):null;
          const avgCpt=resumeCpt(u.scores||{}).moyenne;
          const act=activite.find(a=>a.id===u.uid);const vuLe=Math.max(u.lastLogin||0,tsMs(act?.lastSeen));
          const enL=act&&act.enLigne!==false&&Date.now()-tsMs(act.lastSeen)<ENLIGNE_MS;
          const daysSince=vuLe?Math.floor((Date.now()-vuLe)/86400000):null;
          const engagement=jamais?{c:"#EF4444",l:"Jamais connecté"}:daysSince>14?{c:"#EF4444",l:"Inactif"}:(daysSince>7||nMods===0)?{c:"#F59E0B",l:"À surveiller"}:{c:"#1E4FA3",l:"Engagé"};
          return <div key={u.uid} style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontWeight:800,fontSize:14,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div>
            <div style={{flex:1,minWidth:120}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:14,color:K.t1}}>{u.nom}</span>
                {u.role==="formateur"&&<Tg c="#8B5CF6" bg="#8B5CF618" bd="#8B5CF630" ch="Formateur"/>}
                {u.creePar==="admin"&&<Tg c={K.in_} bg={K.inBg} bd={K.inBd} ch="Créé par admin"/>}
                {isApprenant&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:engagement.c}}><span style={{width:6,height:6,borderRadius:"50%",background:engagement.c,display:"inline-block"}}/>{engagement.l}</span>}
              </div>
              <div style={{fontSize:12,color:K.t3,fontFamily:"'JetBrains Mono',monospace"}}>{u.mail}</div>
              {isApprenant&&<div style={{fontSize:11,color:K.t3,marginTop:2}}>{nMods} module{nMods>1?"s":""} complété{nMods>1?"s":""}{avgScore!=null?` · ${avgScore}% de moyenne aux QCM`:""}{avgCpt!=null?` · Quel compte ? ${avgCpt}%`:""}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:11,color:K.t3}}>Créé le {u.createdAt}</div>
              <div style={{fontSize:12,color:enL?"#16A34A":jamais?K.wa:K.em,fontWeight:700}}>{enL?"● En ligne":jamais?"Jamais connecté":`Vu ${ilya(vuLe)}`}</div>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {newUser&&<Sheet title="Nouvel utilisateur" onClose={()=>sNewUser(null)}>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Nom complet</label>
        <input value={newUser.nom} onChange={e=>sNewUser({...newUser,nom:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Email</label>
        <input type="email" value={newUser.mail} onChange={e=>sNewUser({...newUser,mail:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Mot de passe</label>
        <input type="text" value={newUser.password} onChange={e=>sNewUser({...newUser,password:e.target.value})} placeholder="Min. 6 caractères" style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,fontWeight:700,color:K.t3,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Rôle</label>
        <select value={newUser.role} onChange={e=>sNewUser({...newUser,role:e.target.value})} style={{width:"100%",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}>
          <option value="apprenant">Apprenant</option>
          <option value="formateur">Formateur</option>
        </select>
      </div>
      {nuErr&&<div style={{color:K.er,fontSize:13,marginBottom:10}}>{nuErr}</div>}
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
    {tab==="ef"&&<EtatsFinanciers db={db} K={K} mob={mob} me={{uid:auth.currentUser?.uid,nom:"Administrateur",mail:ADM_EMAIL,role:"admin"}}/>}
    {tab==="fisc"&&<CodeImpots K={K} mob={mob} db={db} ok/>}
    {tab==="fin"&&<FinanceEntreprise K={K} mob={mob} db={db} ok/>}
    {tab==="pl"&&(()=>{
      const apprs=users.filter(u=>u.role!=="formateur"&&u.mail!==ADM_EMAIL);
      const day=plAll.find(p=>p.id===plDate);
      const present=day?.present||[];
      const toggle=async uid=>{
        const next=present.includes(uid)?present.filter(x=>x!==uid):[...present,uid];
        await setDoc(doc(db,"presences",plDate),{date:plDate,present:next,updatedAt:Date.now()},{merge:true});
      };
      return <div style={{animation:"fadeIn .35s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:21,letterSpacing:"-.3px",lineHeight:1.2,color:K.t1,display:"flex",alignItems:"center",gap:7}}>
            <i className="ti ti-calendar-check" style={{fontSize:20,color:K.em}}/>Présence en présentiel
          </div>
          <input type="date" value={plDate} onChange={e=>sPlDate(e.target.value)} style={{background:K.c2,border:`1px solid ${K.b1}`,borderRadius:9,padding:"8px 11px",color:K.t1,fontFamily:"'Outfit',sans-serif",fontSize:14}}/>
        </div>
        <div style={{fontSize:13,color:K.t3,marginBottom:12}}>{present.length} présent{present.length>1?"s":""} le {plDate.split("-").reverse().join("/")} · cochez pour marquer la présence</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {apprs.map(u=>{
            const isP=present.includes(u.uid);
            const total=plAll.filter(p=>p.present?.includes(u.uid)).length;
            return <div key={u.uid} onClick={()=>toggle(u.uid)} className="bt" style={{background:K.card,border:`1px solid ${isP?K.emBd:K.b0}`,borderRadius:11,padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${isP?K.em:K.b1}`,background:isP?K.em:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {isP&&<i className="ti ti-check" style={{fontSize:14,color:"#FFFFFF"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:K.t1}}>{u.nom}</div>
                <div style={{fontSize:12,color:K.t3,fontFamily:"'JetBrains Mono',monospace"}}>{u.mail}</div>
              </div>
              <span style={{fontSize:11,color:K.t3,flexShrink:0}}>{total} séance{total>1?"s":""} au total</span>
            </div>;
          })}
          {!apprs.length&&<div style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:10,padding:"20px",textAlign:"center",fontSize:14,color:K.t3}}>Aucun apprenant inscrit.</div>}
        </div>
      </div>;
    })()}
    </div>
    {vm&&(()=>{const uV=users.find(u=>u.uid===vm)||{},oV=uV.abonnement==="demande"?offresA.find(x=>x.id===uV.demandeOffre):null;return <Sheet title="Valider — Choisir la durée" onClose={()=>sVm(null)}><div style={{color:K.t3,fontSize:14,marginBottom:oV?6:12}}>Paiement confirmé pour <b style={{color:K.t1}}>{uV.nom}</b>.</div>{oV&&<div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:10,padding:"8px 11px",fontSize:13,color:K.t2,marginBottom:12,lineHeight:1.55}}>Offre demandée : <b style={{color:K.t1}}>{oV.l} ({oV.duree}) · {fUSD(oV.prix)}</b>{uV.demandeRef&&<><br/>Référence : <b style={{fontFamily:"'JetBrains Mono',monospace",color:K.t1}}>{uV.demandeRef}</b>{uV.demandeTel?` · ${uV.demandeTel}`:""}</>}<br/>Vérifiez la réception du paiement avant de valider.</div>}<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>{DUR.map(d=><div key={d.id} onClick={()=>genC(vm,d.id)} className="bt" style={{background:oV&&oV.dureeId===d.id?K.emBg:K.c2,border:`${oV&&oV.dureeId===d.id?2:1}px solid ${oV&&oV.dureeId===d.id?K.em:K.b0}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",minHeight:50}} onMouseEnter={e=>{e.currentTarget.style.borderColor=K.emBd;e.currentTarget.style.background=K.emBg;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=K.b0;e.currentTarget.style.background=K.c2;}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{d.l}{oV&&oV.dureeId===d.id&&<span style={{color:K.em,fontSize:12.5,fontWeight:800}}> · demandée</span>}</div><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={d.j===36500?"∞":d.j+"j"}/></div></div>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t3,fontSize:13}}>Ou activer directement :</div><Btn ch={`⚡ ${(DUR.find(d=>d.id===(oV?.dureeId||"3m"))||{}).l}`} on={()=>actD(vm,oV?.dureeId||"3m")} v="s" sm/></div></Sheet>;})()}
    {cm&&<Sheet title="Code généré ✅" onClose={()=>sCm(null)} w={400}><div style={{background:K.bg,border:`2px solid ${K.emBd}`,borderRadius:12,padding:"16px",textAlign:"center",marginBottom:11}}><div style={{color:K.t3,fontSize:10,letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:7}}>Code d'accès</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:32,letterSpacing:6,color:K.em,marginBottom:7}}>{cm.code}</div><div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={cm.d?.l||"—"}/><Tg c={K.t3} bg="none" bd={K.b0} ch={fD(dE(cm.d?.j||30))}/></div></div><Btn ch="✉ Envoyer par email + message" on={()=>mL({...users.find(u=>u.uid===cm.uid),...cm})} v="i" full sx={{padding:"10px",fontSize:14,marginBottom:7,minHeight:42}}/><div style={{background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:8,padding:"7px 10px",marginBottom:11,fontSize:13,color:K.t2}}>📨 Envoyé par email et dans la messagerie interne de l'apprenant.</div><Btn ch="Fermer" on={()=>sCm(null)} v="g" full/></Sheet>}
    {dm&&<Sheet title="Supprimer ?" onClose={()=>sDm(null)} w={320}><div style={{textAlign:"center",padding:"4px 0"}}><div style={{fontSize:30,marginBottom:7}}>⚠️</div><div style={{color:K.t1,fontWeight:700,fontSize:14,marginBottom:4}}>{users.find(u=>u.uid===dm)?.nom}</div><div style={{color:K.t3,fontSize:13,marginBottom:17}}>Action irréversible.</div><div style={{display:"flex",gap:7,justifyContent:"center"}}><Btn ch="Annuler" on={()=>sDm(null)} v="g" sx={{minHeight:42}}/><Btn ch="Supprimer" on={()=>delU(dm)} v="d" sx={{minHeight:42}}/></div></div></Sheet>}
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
      const K_EB={bg:"#0A0F0B",card:"#111812",t1:"#E8F5EA",t2:"#A8C4AC",t3:"#5A7A5E",em:"#1E4FA3",er:"#EF4444",b0:"rgba(255,255,255,.07)"};
      return <div style={{minHeight:"100vh",background:K_EB.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Outfit',sans-serif"}}>
        <div style={{maxWidth:420,width:"100%",background:K_EB.card,border:`1px solid ${K_EB.b0}`,borderRadius:16,padding:28,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:16}}>⚠️</div>
          <div style={{fontWeight:800,fontSize:18,color:K_EB.t1,marginBottom:8}}>Une erreur est survenue</div>
          <div style={{fontSize:14,color:K_EB.t2,marginBottom:20,lineHeight:1.6}}>{this.state.error?.message||"Erreur inattendue"}</div>
          <button onClick={()=>window.location.reload()}
            style={{background:"linear-gradient(135deg,#0A2A5C,#1E4FA3)",border:"none",borderRadius:10,padding:"11px 24px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Recharger la page
          </button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

// ── INSTALLATION DE L'APPLICATION (PWA) ─────────────────────────────────────────
function InstallPrompt(){
  const K=useK();const{mob}=useW();
  const[evt,sEvt]=useState(null),[ios,sIos]=useState(false),[show,sShow]=useState(false);
  useEffect(()=>{
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone;
    let refus=0;try{refus=Number(localStorage.getItem("ap_install_refus")||0);}catch{}
    if(standalone||Date.now()-refus<7*864e5)return;
    const onPrompt=e=>{e.preventDefault();sEvt(e);sShow(true);};
    window.addEventListener("beforeinstallprompt",onPrompt);
    const ua=window.navigator.userAgent||"";
    const t=/iphone|ipad|ipod/i.test(ua)&&/safari/i.test(ua)&&!/crios|fxios/i.test(ua)?setTimeout(()=>{sIos(true);sShow(true);},4000):null;
    const onInstalled=()=>sShow(false);
    window.addEventListener("appinstalled",onInstalled);
    return()=>{window.removeEventListener("beforeinstallprompt",onPrompt);window.removeEventListener("appinstalled",onInstalled);if(t)clearTimeout(t);};
  },[]);
  if(!show)return null;
  const fermer=()=>{sShow(false);try{localStorage.setItem("ap_install_refus",String(Date.now()));}catch{}};
  const installer=async()=>{if(!evt)return;evt.prompt();try{await evt.userChoice;}catch{}sEvt(null);sShow(false);};
  return <div style={{position:"fixed",left:12,right:mob?12:"auto",bottom:mob?78:18,maxWidth:380,zIndex:997,background:K.card,border:`1px solid ${K.emBd}`,borderRadius:14,boxShadow:"0 10px 30px rgba(0,0,0,.25)",padding:"12px 14px",display:"flex",gap:11,alignItems:"center",animation:"slideUp .35s ease"}}>
    <img src={LOGO_ICONE} alt="" style={{width:44,height:44,borderRadius:11,flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontWeight:800,fontSize:14,color:K.t1}}>Installer Éco-Campus</div>
      <div style={{fontSize:12,color:K.t2,lineHeight:1.45,marginTop:2}}>{ios?<>Touchez <b>Partager</b> <i className="ti ti-share-2"/> puis <b>« Sur l'écran d'accueil »</b>.</>:"Accès direct depuis votre écran d'accueil, en plein écran."}</div>
    </div>
    {!ios&&<button onClick={installer} className="bt" style={{background:`linear-gradient(135deg,${K.emD},${K.em})`,color:"#FFFFFF",border:"none",borderRadius:9,padding:"8px 12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0}}>Installer</button>}
    <button onClick={fermer} aria-label="Fermer" className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:20,cursor:"pointer",lineHeight:1,flexShrink:0}}>×</button>
  </div>;
}

export default function App(){
  const[who,sW]=useState(null);const[loading,sL]=useState(true);const[showAuth,sShowAuth]=useState(false);
  const[tid,sTid]=useState(()=>{try{return localStorage.getItem("ap_theme")||"eco";}catch{return"eco";}});
  const[showTP,sShowTP]=useState(false);
  const K=bK(tid);
  const[verif,sVerif]=useState(()=>{try{return new URLSearchParams(window.location.search).get("attestation");}catch{return null;}});
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
        } else sW(w=>w?.uid===user.uid?w:null); // profil en cours de création (inscription Google/Facebook)
      }else{sW(null);}
      sL(false);
    });
    return unsub;
  },[]);
  return <Ctx.Provider value={{K,tid,setT}}>
    <style>{mCss(K)}</style>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/dist/tabler-icons.min.css"/>
    {verif!=null&&<VerifAttestation K={K} db={db} numero={verif} logo={LOGO_ICONE} onFermer={()=>{try{window.history.replaceState(null,"",window.location.pathname);}catch{}sVerif(null);}}/>}
    {verif==null&&<>
    <ThemePicker open={showTP} onClose={()=>sShowTP(false)}/>
    <button onClick={()=>sShowTP(true)} className="bt tp-btn" title="Changer de thème"
      style={{position:"fixed",bottom:18,right:18,zIndex:998,width:44,height:44,borderRadius:"50%",background:K.card,border:`1px solid ${K.b1}`,color:K.t2,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.25)"}}>
      {TH[tid]?.i||"🎨"}
    </button>
    <InstallPrompt/>
    {loading&&<Spin/>}
    {!loading&&!who&&!showAuth&&<LandingPage onLogin={()=>sShowAuth(true)}/>}
    {!loading&&!who&&showAuth&&<Auth onL={(role,user)=>{const r=role==="__admin__"?{role:"admin",user}:role?.startsWith("__formateur__:")?{role:"formateur",uid:role.split(":")[1],user}:{role:"user",uid:user.uid,user};sW(r);sShowAuth(false);}}/>}
    {!loading&&who?.role==="admin"&&<ErrorBoundary><AA onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
    {!loading&&who?.role==="formateur"&&<ErrorBoundary><FA uid={who.uid} onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
    {!loading&&who?.role==="user"&&<ErrorBoundary><UA uid={who.uid} onOut={async()=>{await signOut(auth);sW(null);}}/></ErrorBoundary>}
    </>}
  </Ctx.Provider>;
}
