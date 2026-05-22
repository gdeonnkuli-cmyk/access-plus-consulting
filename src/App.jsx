import{useState,useRef,useEffect,useCallback,createContext,useContext}from"react";
import{initializeApp}from"firebase/app";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged}from"firebase/auth";
import{getFirestore,doc,getDoc,setDoc,updateDoc,collection,getDocs,onSnapshot,deleteDoc,serverTimestamp}from"firebase/firestore";
import{getStorage,ref,uploadBytes,getDownloadURL,deleteObject}from"firebase/storage";

// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────
const fbApp=initializeApp({
  apiKey:"AIzaSyAO2IfWpqgxFB5jyykCugrxu1fvNRwZMcU",
  authDomain:"access-plus-consulting.firebaseapp.com",
  projectId:"access-plus-consulting",
  storageBucket:"access-plus-consulting.firebasestorage.app",
  messagingSenderId:"601435028350",
  appId:"1:601435028350:web:d8852e2f17e6c65266d12f"
});
const auth=getAuth(fbApp);
const db=getFirestore(fbApp);
const storage=getStorage(fbApp);
const ADM_EMAIL="admin@accessplus.com";

// ── THÈMES ────────────────────────────────────────────────────────────────────
const TH={
  dark:{n:"Sombre",i:"🌙",bg:"#0C0F19",ca:"#13172A",c2:"#1A1F35",b0:"rgba(255,255,255,.06)",b1:"rgba(255,255,255,.11)",t1:"#F0F3FF",t2:"#8B97BC",t3:"#505A78"},
  light:{n:"Clair",i:"☀️",bg:"#F2F5FC",ca:"#FFFFFF",c2:"#E8EDF7",b0:"rgba(0,0,0,.07)",b1:"rgba(0,0,0,.13)",t1:"#1A1D2E",t2:"#5A6380",t3:"#9BA3BF"},
  sepia:{n:"Sépia",i:"📜",bg:"#F5EFE3",ca:"#FDFAF4",c2:"#EDE6D6",b0:"rgba(120,90,40,.09)",b1:"rgba(120,90,40,.17)",t1:"#2C2416",t2:"#7A6540",t3:"#B09A70"},
  blue:{n:"Océan",i:"🌊",bg:"#071525",ca:"#0C1E36",c2:"#102544",b0:"rgba(100,180,255,.08)",b1:"rgba(100,180,255,.16)",t1:"#E4F1FF",t2:"#7BAFD4",t3:"#3D6E94"},
  green:{n:"Forêt",i:"🌿",bg:"#0B1A10",ca:"#0F2416",c2:"#13301E",b0:"rgba(80,200,100,.07)",b1:"rgba(80,200,100,.14)",t1:"#E4F5E8",t2:"#72B883",t3:"#3D7A50"},
  purple:{n:"Violet",i:"💜",bg:"#100C1E",ca:"#180E30",c2:"#201244",b0:"rgba(160,100,255,.08)",b1:"rgba(160,100,255,.16)",t1:"#EDE8FF",t2:"#9070C8",t3:"#5E4A88"},
};
const ACC={em:"#34D399",emD:"#059669",emBg:"rgba(52,211,153,.10)",emBd:"rgba(52,211,153,.22)",in_:"#818CF8",inD:"#4F46E5",inBg:"rgba(129,140,248,.10)",inBd:"rgba(129,140,248,.22)",wa:"#FBBF24",waBg:"rgba(251,191,36,.10)",waBd:"rgba(251,191,36,.24)",er:"#F87171",erBg:"rgba(248,113,113,.10)",erBd:"rgba(248,113,113,.24)",rd:"#EF4444",rdBg:"rgba(239,68,68,.10)",rdBd:"rgba(239,68,68,.24)"};
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
const bK=id=>{const t=TH[id]||TH.dark;return{bg:t.bg,card:t.ca,c2:t.c2,b0:t.b0,b1:t.b1,t1:t.t1,t2:t.t2,t3:t.t3,...ACC};};
const Ctx=createContext({K:bK("dark"),tid:"dark",setT:()=>{}});
const useK=()=>useContext(Ctx).K;
const mCss=K=>`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=JetBrains+Mono:wght@500&display=swap');
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
.mp{padding:18px max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));}`;

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
  ex:m.ex?{...m.ex,dn:JSON.stringify(m.ex.dn||[]),tv:JSON.stringify(m.ex.tv||[])}:null,
});
const expandMod=m=>({
  ...m,
  q:typeof m.q==="string"?JSON.parse(m.q||"[]"):m.q||[],
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
const Logo=({sm})=>{const K=useK();return <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}><svg width={sm?18:22} height={sm?18:22} viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke={K.em} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/><path d="M10 2L18 11L10 20" stroke={K.em} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg><div><div style={{fontWeight:800,fontSize:sm?12:14,color:K.t1,lineHeight:1}}>Access Plus</div>{!sm&&<div style={{fontSize:8,color:K.t3,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>Consulting</div>}</div></div>;};
const Tg=({c,bg,bd,ch})=>{const K=useK();return <span style={{background:bg||K.c2,color:c||K.t2,border:`1px solid ${bd||K.b0}`,borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{ch}</span>;};
const Bar=({p,col,h=4})=>{const K=useK();return <div style={{background:K.b0,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(p,100)}%`,height:"100%",background:col||K.em,borderRadius:99,transition:"width .6s ease"}}/></div>;};
const Spin=()=>{const K=useK();return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:24,background:K.bg}}><div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{position:"absolute",width:70,height:70,borderRadius:"50%",background:`${K.em}14`,animation:"pulse 2s ease-in-out infinite"}}/><div style={{position:"absolute",width:52,height:52,borderRadius:"50%",background:`${K.em}0D`,animation:"pulse 2s ease-in-out infinite .4s"}}/><div style={{width:46,height:46,borderRadius:14,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 24px ${K.emD}55`,animation:"logofl 2.4s ease-in-out infinite"}}><svg width={22} height={22} viewBox="0 0 22 22" fill="none"><path d="M3 2L11 11L3 20" stroke="rgba(7,18,9,.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 2L18 11L10 20" stroke="#071209" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div><div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:6}}>Access Plus</div><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:K.em,display:"inline-block",animation:"dotfl 1.4s ease-in-out infinite",animationDelay:`${i*0.22}s`}}/>)}</div></div></div>;};
function Btn({ch,on,v="p",sm,full,dis,sx}){const K=useK();const M={p:{bg:`linear-gradient(135deg,${K.emD},${K.em})`,col:"#071209",sh:`0 2px 10px ${K.emD}44`},g:{bg:"transparent",col:K.t2,bo:`1px solid ${K.b1}`},d:{bg:K.erBg,col:K.er,bo:`1px solid ${K.erBd}`},w:{bg:K.waBg,col:K.wa,bo:`1px solid ${K.waBd}`},i:{bg:`linear-gradient(135deg,${K.inD},${K.in_})`,col:"#fff",sh:`0 2px 10px ${K.inD}44`},s:{bg:K.c2,col:K.t2,bo:`1px solid ${K.b0}`},r:{bg:K.rdBg,col:K.rd,bo:`1px solid ${K.rdBd}`}}[v]||{};return <button onClick={dis?null:on} className="bt" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:sm?"7px 11px":"10px 17px",borderRadius:9,fontSize:sm?12:13,fontWeight:700,border:M.bo||"none",background:M.bg,color:M.col,boxShadow:M.sh||"none",width:full?"100%":undefined,opacity:dis?.45:1,cursor:dis?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",minHeight:sm?36:40,...sx}}>{ch}</button>;}
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

function PdfV({url,name,onClose}){const K=useK();return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:1000,display:"flex",flexDirection:"column"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 15px",background:K.card,borderBottom:`1px solid ${K.b0}`,flexShrink:0}}><div style={{display:"flex",alignItems:"center",gap:8}}><span>📄</span><div><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{name}</div><div style={{color:K.t3,fontSize:10}}>Lecture seule</div></div></div><Btn ch="✕" on={onClose} v="g" sm/></div><iframe src={url} title={name} style={{flex:1,border:"none"}} sandbox="allow-same-origin"/></div>;}

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
function Auth({onL}){
  const K=useK();const{mob}=useW();
  const[tab,sT]=useState("l"),[err,sE]=useState(""),[ok,sO]=useState(""),[busy,sB]=useState(false),[step,sS]=useState(1);
  const pm=useRef(null),rN=useRef(),rM=useRef(),rP=useRef(),rP2=useRef(),rC=useRef();
  const sw=useCallback(t=>{sT(t);sS(1);sE("");sO("");setTimeout(()=>[rN,rM,rP,rP2,rC].forEach(r=>{if(r.current)r.current.value="";}),0);},[]);
  const reg=useCallback(async()=>{
    const n=rN.current?.value?.trim()||"",m=rM.current?.value?.trim()||"",p=rP.current?.value||"",p2=rP2.current?.value||"";
    sE("");sO("");
    if(n.length<2)return sE("Nom requis");if(!m.includes("@"))return sE("Email invalide");if(p.length<6)return sE("Mot de passe min. 6 caractères");if(p!==p2)return sE("Mots de passe différents");
    sB(true);
    try{
      const cred=await createUserWithEmailAndPassword(auth,m,p);
      await saveUserData(cred.user.uid,{nom:n,mail:m,createdAt:new Date().toLocaleDateString("fr-FR"),abonnement:"aucun",activationCode:null,codeValide:false,demandeDate:null,dureeId:null,dateExpiration:null,progress:{},scores:{}});
      sO("Compte créé !");setTimeout(()=>sw("l"),1100);
    }catch(e){sE(e.code==="auth/email-already-in-use"?"Email déjà utilisé.":e.message);}
    sB(false);
  },[]);
  const login=useCallback(async()=>{
    const m=rM.current?.value?.trim()||"",p=rP.current?.value||"";sE("");sO("");sB(true);
    try{
      const cred=await signInWithEmailAndPassword(auth,m,p);
      if(cred.user.email===ADM_EMAIL){onL("__admin__",cred.user);return;}
      const snap=await getDoc(doc(db,"users",cred.user.uid));
      if(!snap.exists()){sE("Profil introuvable.");sB(false);return;}
      const u=snap.data();
      if(u.abonnement==="actif"&&xp(u.dateExpiration)){await updateDoc(doc(db,"users",cred.user.uid),{abonnement:"expiré"});}
      onL(cred.user.uid,cred.user);
    }catch(e){sE(e.code==="auth/invalid-credential"?"Email ou mot de passe incorrect.":e.message);sB(false);}
  },[onL]);
  const code=useCallback(async()=>{
    const c=rC.current?.value?.trim()||"";sE("");if(!c)return sE("Entrez votre code");
    try{
      const snap=await getDoc(doc(db,"users",pm.current));
      if(!snap.exists())return sE("Utilisateur introuvable.");
      const u=snap.data();
      if(u.activationCode!==c)return sE("Code incorrect.");
      await updateDoc(doc(db,"users",pm.current),{abonnement:"actif",codeValide:true});
      sO("✓ Accès débloqué !");setTimeout(()=>onL(pm.current,auth.currentUser),700);
    }catch(e){sE(e.message);}
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
          <h1 style={{fontSize:mob?20:25,fontWeight:900,color:K.t1,lineHeight:1.15,letterSpacing:"-.4px",marginBottom:5}}><span style={{background:`linear-gradient(135deg,${K.em},${K.in_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Access Plus</span><br/><span style={{fontSize:mob?14:17,fontWeight:700,color:K.t2}}>Consulting</span></h1>
          <p style={{color:K.t3,fontSize:12,lineHeight:1.6}}>Modules · QCM · Exercices · Vidéos · Direct</p>
        </div>
        <div style={{background:K.card,border:`1px solid ${K.b1}`,borderRadius:14,padding:mob?"17px 15px":"21px 19px",boxShadow:"0 20px 55px rgba(0,0,0,.3)"}}>
          {step===1&&<div style={{display:"flex",background:K.bg,borderRadius:9,padding:3,marginBottom:17,gap:2}}>{[["l","Connexion"],["r","Inscription"]].map(([k,l])=><button key={k} onClick={()=>sw(k)} className="bt" style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontWeight:700,fontSize:13,fontFamily:"'Outfit',sans-serif",cursor:"pointer",background:tab===k?K.c2:"transparent",color:tab===k?K.t1:K.t3,minHeight:38}}>{l}</button>)}</div>}
          <div style={{marginBottom:15}}><div style={{fontSize:15,fontWeight:800,color:K.t1,marginBottom:3}}>{step===2?"🔐 Code d'activation":tab==="l"?"Bon retour 👋":"Créer un compte"}</div><div style={{fontSize:12,color:K.t3,lineHeight:1.5}}>{step===2?"Code reçu de l'administrateur":tab==="l"?"Accédez à votre formation":"Inscription gratuite · Accès sur abonnement"}</div></div>
          {step===2&&<Inp lb="Code d'activation" rf={rC} ph="ACC-001" mono note="Communiqué par Access Plus" ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Nom complet" rf={rN} ph="Votre nom" ok={hk}/>}
          {step===1&&<Inp lb="Email" rf={rM} type="email" ph="vous@exemple.com" ok={hk}/>}
          {step===1&&<Inp lb="Mot de passe" rf={rP} type="password" ph="Min. 6 car." ok={hk}/>}
          {step===1&&tab==="r"&&<Inp lb="Confirmer" rf={rP2} type="password" ph="Répéter" ok={hk}/>}
          {step===1&&tab==="l"&&<div style={{textAlign:"right",marginTop:-5,marginBottom:11}}><button onClick={()=>{const m=rM.current?.value?.trim()||"";if(!m.includes("@"))return sE("Saisissez votre email d'abord");pm.current=m;sS(2);sE("");}} className="bt" style={{background:"none",border:"none",color:K.em,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>J'ai un code →</button></div>}
          <Pop t="e" m={err}/><Pop t="o" m={ok}/>
          <Btn ch={busy?"…":step===2?"Valider →":tab==="l"?"Se connecter →":"Créer →"} on={go} full sx={{padding:"12px",fontSize:14,minHeight:46}} dis={busy}/>
          {step===2&&<button onClick={()=>{sS(1);sE("");}} className="bt" style={{width:"100%",marginTop:7,padding:"10px",background:"none",border:`1px solid ${K.b0}`,color:K.t3,borderRadius:8,fontFamily:"'Outfit',sans-serif",fontSize:12,cursor:"pointer",minHeight:40}}>← Retour</button>}
          {tab==="l"&&step===1&&<div style={{marginTop:11,padding:"7px 10px",background:K.bg,borderRadius:7,border:`1px solid ${K.b0}`,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:K.t3,lineHeight:1.8}}>admin@accessplus.com</div>}
        </div>
      </div>
    </div>
  </div>;
}

// ── USER APP ──────────────────────────────────────────────────────────────────
function UA({uid,onOut}){
  const K=useK();const{mob}=useW();
  const[vue,sV]=useState("home"),[mod,sM]=useState(null),[quiz,sQ]=useState(null),[sub,sSub]=useState(false);
  const[uData,sUD]=useState(null),[pdfs,sPdfs]=useState({});
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
  if(!uData||mL)return <div style={{minHeight:"100vh",background:K.bg}}><style>{mCss(K)}</style><Spin/></div>;
  const ok=uData.abonnement==="actif"&&!xp(uData.dateExpiration);
  const aMods=mods.filter(m=>m.on!==false);
  const pr=uData.progress||{},sc=uData.scores||{};
  const nd=aMods.filter(m=>pr[m.id]==="done").length,gp=aMods.length?Math.round(nd/aMods.length*100):0;
  const save=async(modId,s,t)=>{await saveProgress(uid,modId,{s,t,pct:Math.round(s/t*100)});};
  const W=ch=><div style={{minHeight:"100vh",background:K.bg,fontFamily:"'Outfit',sans-serif"}}><style>{mCss(K)}</style><Nav u={uData} vue={vue} sV={v=>{sV(v);sM(null);}} ok={ok} onSub={()=>sSub(true)} onOut={onOut} live={live.on}/><main className="mp" style={{maxWidth:1060,margin:"0 auto"}}>{ch}</main>{sub&&<SubM onClose={()=>sSub(false)} uid={uid} u={uData}/>}</div>;
  if(quiz)return W(<QZ mod={quiz} onDone={async(s,t)=>{await save(quiz.id,s,t);sQ(null);sM(null);sV("res");}} onBack={()=>sQ(null)}/>);
  if(mod)return W(<MV mod={mod} sc={sc[mod.id]} ok={ok} onQ={()=>sQ(mod)} onBack={()=>sM(null)} onSub={()=>sSub(true)} vids={vids.filter(v=>v.mid===mod.id)} pdf={pdfs[mod.id]}/>);
  return W(<>
    {vue==="home"&&<Home u={uData} pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods} vids={vids} onOpen={sM} onSub={()=>sSub(true)} onVid={()=>sV("videos")} onPres={()=>sV("pres")} onStages={()=>sV("stages")} live={live} presCount={allPres.length}/>}
    {vue==="videos"&&<VidsPage ok={ok} onSub={()=>sSub(true)} vids={vids} live={live}/>}
    {vue==="pres"&&<PresPage ok={ok} onSub={()=>sSub(true)} pres={allPres}/>
    }{vue==="stages"&&<StagePage stages={allStages} plats={allPlats} ok={ok}/>
    }{vue==="services"&&<ServicesPage user={uData}/>}
    {vue==="prog"&&<Prog pr={pr} sc={sc} gp={gp} nd={nd} ok={ok} mods={aMods}/>}
    {vue==="res"&&<Res sc={sc} ok={ok} mods={aMods}/>}
  </>);
}

function Nav({u,vue,sV,ok,onSub,onOut,live}){
  const K=useK();const{mob}=useW();
  return <nav className="nb" style={{background:`${K.card}ee`,backdropFilter:"blur(14px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"space-between",height:52,position:"sticky",top:0,zIndex:99}}>
    <Logo sm={mob}/>
    <div className="tn" style={{flex:1,margin:"0 7px"}}>
      {[["home",mob?"🏠":"Accueil"],["pres",mob?"📊":"Présentations"],["stages",mob?"🎯":"Stages"],["services",mob?"💼":"Services"],["videos",live?(mob?<span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:K.rd,display:"inline-block",animation:"blink 1.5s ease-in-out infinite"}}/>{"🎬"}</span>:"🔴 Vidéos"):(mob?"🎬":"🎬 Vidéos")],["prog",mob?"📈":"Progression"],["res",mob?"🏆":"Résultats"]].map(([k,l])=>(
        <button key={k} onClick={()=>sV(k)} className="bt" style={{background:vue===k?K.c2:"none",border:"none",cursor:"pointer",padding:"5px 9px",borderRadius:6,fontSize:12,fontWeight:700,color:vue===k?K.t1:K.t3,whiteSpace:"nowrap",minHeight:34,borderBottom:vue===k?`2px solid ${K.em}`:"2px solid transparent"}}>{l}</button>
      ))}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
      {ok?<div className="hs"><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={u.dureeId==="v"?"♾️":"✓ Actif"}/></div>:<Btn ch={mob?"💳":"Accéder"} on={onSub} v="w" sm/>}
      <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 7px 3px 4px",background:K.c2,border:`1px solid ${K.b0}`,borderRadius:99,cursor:"pointer"}} onClick={onOut}>
        <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#071209",fontWeight:800,fontSize:11}}>{(u.nom||"U")[0].toUpperCase()}</div>
        <span className="hs" style={{color:K.t2,fontSize:12,fontWeight:600}}>{(u.nom||"").split(" ")[0]}</span>
      </div>
    </div>
  </nav>;
}

function Home({u,pr,sc,gp,nd,ok,mods,vids,onOpen,onSub,onVid,onPres,onStages,live,presCount=0}){
  const K=useK();const{mob}=useW();const jr=jR(u.dateExpiration);
  const{tid}=useContext(Ctx);
  const mats=[...new Set(mods.map(m=>m.mat||"Général"))];
  const[fi,sF]=useState("Toutes");
  const fil=fi==="Toutes"?mods:mods.filter(m=>(m.mat||"Général")===fi);
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
    {/* Alertes */}
    {!ok&&<div style={{background:u.abonnement==="expiré"?K.erBg:K.waBg,border:`1px solid ${u.abonnement==="expiré"?K.erBd:K.waBd}`,borderRadius:12,padding:"11px 14px",marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}><div><div style={{fontWeight:700,fontSize:13,color:u.abonnement==="expiré"?K.er:K.wa,marginBottom:2}}>{u.abonnement==="expiré"?"Accès expiré":"Cours verrouillés"}</div><div style={{fontSize:12,color:K.t3}}>{u.abonnement==="demande"?"Demande en cours — code sous 24h.":u.abonnement==="expiré"?"Contactez Access Plus.":"Effectuez le paiement."}</div></div>{u.abonnement!=="demande"&&<Btn ch="Obtenir l'accès" on={onSub} v="w" sm/>}</div>}
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
          {[[`${nd}/${mods.length}`,"Modules",K.em],[`${gp}%`,"Progression",K.in_],[`${mats.length}`,"Matières",K.wa]].map(([v,l,c])=><div key={l} style={{background:isLight?"rgba(255,255,255,.7)":K.b0,backdropFilter:"blur(8px)",borderRadius:10,padding:"8px 12px",border:`1px solid ${K.b1}`}}><div style={{color:c,fontWeight:800,fontSize:16,lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}
        </div>
        <div style={{flexShrink:0}}><Donut pct={gp}/></div>
      </div>
    </div>

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
      {mats.length>1&&<div className="tn" style={{gap:6,marginBottom:11,paddingBottom:3}}>{["Toutes",...mats].map(m=><button key={m} onClick={()=>sF(m)} className="bt" style={{background:fi===m?K.c2:"transparent",border:`1px solid ${fi===m?K.b1:K.b0}`,borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:600,color:fi===m?K.t1:K.t3,whiteSpace:"nowrap",cursor:"pointer",minHeight:28}}>{m}</button>)}</div>}
      <div className="gm">
        {fil.map((m,i)=>{
          const f=pr[m.id]==="done",s=sc[m.id],lk=!ok;
          const cp=getCardPalette(tid,i);
          return <div key={m.id} onClick={()=>lk?onSub():onOpen(m)} className="hv"
            style={{background:f?cp.bg:K.card,border:`1px solid ${f?cp.bd:K.b0}`,borderRadius:13,padding:"13px",cursor:"pointer",position:"relative",overflow:"hidden",animation:`up .3s ease ${i*15}ms both`,opacity:lk?.65:1}}>
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
          </div>;
        })}
      </div>
    </div>

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

function MV({mod,sc,ok,onQ,onBack,onSub,vids,pdf}){
  const K=useK();const{mob}=useW();
  const[pl,sPl]=useState(null),[plIdx,sPlIdx]=useState(0),[pdfO,sPdfO]=useState(false),[corr,sCorr]=useState(false),[exO,sExO]=useState(false);
  const ex=mod.ex;
  return <div style={{maxWidth:640,margin:"0 auto",animation:"up .25s ease"}}>
    {pl&&<Player url={pl.url} titre={pl.titre} onClose={()=>{sPl(null);sPlIdx(0);}} playlist={vids.map(v=>({url:v.url,titre:v.titre,gr:v.gr}))} startIdx={plIdx}/>}
    {pdfO&&pdf&&<PdfV url={pdf.url} name={pdf.name} onClose={()=>sPdfO(false)}/>}
    <button onClick={onBack} className="bt" style={{background:"none",border:"none",color:K.t3,fontSize:13,cursor:"pointer",marginBottom:13,padding:"5px 0",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>← Retour</button>
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
      {ok?<><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Évaluation QCM</div><div style={{color:K.t3,fontSize:12,marginBottom:13}}>{mod.q?.length||0} questions · Feedback immédiat</div><Btn ch={sc?"Repasser →":"Commencer →"} on={onQ} sx={{minHeight:44,fontSize:14}} dis={!mod.q?.length}/></>:<div style={{textAlign:"center",padding:"7px 0"}}><div style={{fontSize:28,marginBottom:7}}>🔒</div><div style={{fontWeight:700,fontSize:14,color:K.t1,marginBottom:4}}>Module verrouillé</div><div style={{color:K.t3,fontSize:12,marginBottom:12}}>Abonnement requis (50 USD).</div><Btn ch="Obtenir l'accès →" on={onSub} v="w" sx={{minHeight:44}}/></div>}
    </div>
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
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const isLight=['light','sepia'].includes(tid);
  const done=mods.filter(m=>pr[m.id]==="done");
  const todo=mods.filter(m=>pr[m.id]!=="done");
  return <div style={{maxWidth:700,margin:"0 auto",animation:"up .25s ease"}}>
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
  </div>;
}

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
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const[open,sOpen]=useState(null);
  const[fi,sF]=useState("Toutes");
  const isLight=['light','sepia'].includes(tid);
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
  const K=useK();const{mob}=useW();const{tid}=useContext(Ctx);
  const[tab,sTab]=useState("offres");
  const[cat,sCat]=useState("Toutes");
  const[search,sSearch]=useState("");
  const isLight=['light','sepia'].includes(tid);
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

  const WA_NUM="+243979075970"; // À remplacer
  const EMAIL="contact@accessplusconsulting.com";

  return <div style={{animation:"up .3s ease",maxWidth:900,margin:"0 auto"}}>
    {/* Bannière hero */}
    <div style={{background:`linear-gradient(135deg,${K.em}20,${K.in_}12)`,border:`1px solid ${K.emBd}`,borderRadius:18,padding:mob?"20px 16px":"30px 32px",marginBottom:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:`${K.em}0A`}}/>
      <div style={{position:"absolute",bottom:-30,left:20,width:100,height:100,borderRadius:"50%",background:`${K.in_}08`}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:isLight?"rgba(255,255,255,.7)":K.b0,border:`1px solid ${K.emBd}`,borderRadius:99,padding:"4px 12px",marginBottom:14}}><i className="ti ti-building" style={{fontSize:12,color:K.em}}/><span style={{fontSize:11,color:K.em,fontWeight:700}}>Access Plus Consulting</span></div>
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
      <div style={{fontWeight:800,fontSize:15,color:K.t1,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><i className="ti ti-star" style={{fontSize:16,color:K.wa}}/>Pourquoi choisir Access Plus ?</div>
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
          <button onClick={send} disabled={sending} className="bt" style={{flex:1,minWidth:180,padding:"12px",background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",borderRadius:10,color:"#071209",fontWeight:800,fontSize:14,cursor:sending?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:46,opacity:sending?.7:1}}>
            <i className="ti ti-send" style={{fontSize:16}}/>{sending?"Envoi en cours…":"Envoyer ma demande"}
          </button>
          <a href={`https://wa.me/${WA_NUM.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#25D366,#128C7E)",borderRadius:10,padding:"12px 18px",color:"#fff",fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-brand-whatsapp" style={{fontSize:16}}/>WhatsApp
          </a>
          <a href={`mailto:${EMAIL}?subject=Demande de service — ${form.service||"Access Plus"}`} style={{display:"inline-flex",alignItems:"center",gap:6,background:K.inBg,border:`1px solid ${K.inBd}`,borderRadius:10,padding:"12px 18px",color:K.in_,fontWeight:700,fontSize:13,textDecoration:"none",fontFamily:"'Outfit',sans-serif",minHeight:46}}>
            <i className="ti ti-mail" style={{fontSize:16}}/>Email
          </a>
        </div>
        <div style={{marginTop:12,padding:"9px 12px",background:K.c2,borderRadius:8,fontSize:11,color:K.t3,display:"flex",alignItems:"center",gap:6}}><i className="ti ti-lock" style={{fontSize:12,color:K.em}}/>Vos informations sont confidentielles et ne seront jamais partagées.</div>
      </>}
    </div>
  </div>;
}

function AA({onOut}){
  const K=useK();const{mob}=useW();
  const[tab,sT]=useState("d"),[msg,sMsg]=useState({t:"",m:""});
  const[cm,sCm]=useState(null),[vm,sVm]=useState(null),[dm,sDm]=useState(null),[q,sQ]=useState("");
  const[editMod,sEM]=useState(null),[newMod,sNM]=useState(false);
  const[addVid,sAV]=useState(false),[saving,sSav]=useState(false),[addPres,sAddPres]=useState(false),[presGr,sPresGr]=useState(true),[addStage,sAddStage]=useState(false),[stageTab,sStageTab]=useState("offres"),[addPlat,sAddPlat]=useState(false);
  const{mods}=useModules();const users=useUsers();const{vids,live}=useVideos();const allPresAdmin=usePresentations();
  const allStagesAdmin=useStages();
  const allPlatsAdmin=usePlateformes();
  const allDemandesAdmin=useDemandes();
  const[pdfs,sPdfs]=useState({});
  useEffect(()=>{const loadPdfs=async()=>{const snap=await getDocs(collection(db,"pdfs"));const p={};snap.forEach(d=>p[d.id]=d.data());sPdfs(p);};loadPdfs();},[]);
  const fl=users.filter(u=>(u.nom||"").toLowerCase().includes(q.toLowerCase())||(u.mail||"").toLowerCase().includes(q.toLowerCase()));
  const dem=fl.filter(u=>u.abonnement==="demande"),nD=users.filter(u=>u.abonnement==="demande").length;
  const act=fl.filter(u=>u.abonnement==="actif"&&!xp(u.dateExpiration)),nA=users.filter(u=>u.abonnement==="actif"&&!xp(u.dateExpiration)).length;
  const exp_=fl.filter(u=>u.abonnement==="expiré"||(u.abonnement==="actif"&&xp(u.dateExpiration))),nE=users.filter(u=>u.abonnement==="expiré"||(u.abonnement==="actif"&&xp(u.dateExpiration))).length;
  const tabs=[["d",`Dem.(${nD})`],["a",`Act.(${nA})`],["e",`Exp.(${nE})`],["t",`Tous(${users.length})`],["s","Stats"],["m","📚 Cours"],["v","🎬 Vidéos"],["pr","📊 Présentations"],["st","🎯 Stages"],["dm","💼 Demandes"],["p","📄 PDF"]];
  const byT={d:dem,a:act,e:exp_,t:fl};
  let CC_LOCAL=users.reduce((mx,u)=>{const n=parseInt((u.activationCode||"").replace("ACC-",""))||0;return Math.max(mx,n);},0);
  const nC=()=>{
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code="AP-";
  for(let i=0;i<8;i++)code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
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
  const mL=u=>{const d=DUR.find(x=>x.id===u.dureeId);window.open(`mailto:${u.mail}?subject=${encodeURIComponent("Access Plus — Code d'accès")}&body=${encodeURIComponent(`Bonjour ${u.nom},\n\nCODE : ${u.activationCode}\nDurée : ${d?.l}\nExpire : ${fD(u.dateExpiration)}\n\n1. Connectez-vous avec ${u.mail}\n2. Cliquez "J'ai un code"\n3. Saisissez : ${u.activationCode}\n\nAccess Plus Consulting`)}`,"_blank");};
  const sc_=s=>s==="actif"?K.em:s==="demande"?K.wa:K.er,sl_=s=>s==="actif"?"Actif":s==="demande"?"Demande":"Inactif";
  const rLU=useRef(),rLT=useRef(),rLD=useRef(),rVU=useRef(),rVT=useRef(),rVD=useRef(),rVM=useRef();
  const rPT=useRef(),rPU=useRef(),rPD=useRef(),rPM=useRef();
  const rST=useRef(),rSE=useRef(),rSU=useRef(),rSD=useRef(),rSC=useRef(),rSDur=useRef(),rSDF=useRef(),rSLogo=useRef();
  const rPN=useRef(),rPUrl=useRef(),rPDesc=useRef(),rPLang=useRef(),rPLogo=useRef();
  const[gr,sGr]=useState(true);
  const saveLiveFn=async()=>{sSav(true);await saveLive({on:live.on,url:rLU.current?.value?.trim()||"",titre:rLT.current?.value?.trim()||"",desc:rLD.current?.value?.trim()||""});sSav(false);sMsg({t:"o",m:"Direct enregistré."});setTimeout(()=>sMsg({t:"",m:""}),2000);};
  const addVidFn=async()=>{const url=rVU.current?.value?.trim()||"",titre=rVT.current?.value?.trim()||"";if(!titre||!url){alert("Titre et URL requis");return;}if(!pVid(url)){alert("URL invalide");return;}sSav(true);await saveVideo({titre,url,desc:rVD.current?.value?.trim()||"",mid:rVM.current?.value||null,gr});sSav(false);sAV(false);[rVU,rVT,rVD].forEach(r=>{if(r.current)r.current.value="";});};
  function RC({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:11,padding:"12px",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#071209",fontWeight:800,fontSize:12,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{u.nom}</div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div></div><Tg c={sc_(st)} bg={`${sc_(st)}12`} bd={`${sc_(st)}28`} ch={sl_(st)}/></div>{u.activationCode&&<div style={{background:K.bg,border:`1px solid ${K.b0}`,borderRadius:7,padding:"5px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13,color:K.em}}>{u.activationCode}</span><span style={{fontSize:10,color:jr<=30?K.wa:K.t3}}>· {jr>0?`${jr}j`:"Exp."}</span></div>}<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{st==="demande"&&<><Btn ch="✓" on={()=>sVm(u.uid)} sm/><Btn ch="✗" on={()=>ref_(u.uid)} v="d" sm/></>}{st==="actif"&&<><Btn ch="Code" on={()=>sCm(u)} v="s" sm/><Btn ch="✉" on={()=>mL(u)} v="i" sm/><Btn ch="⏸" on={()=>rev(u.uid)} v="d" sm/></>}{(st==="expiré"||st==="aucun")&&<Btn ch="▶" on={()=>sVm(u.uid)} v="s" sm/>}<Btn ch="🗑" on={()=>sDm(u.uid)} v="d" sm/></div></div>;}
  function RR({u}){const ex=xp(u.dateExpiration)&&u.abonnement==="actif",st=ex?"expiré":u.abonnement,jr=jR(u.dateExpiration);return <div className="ar" style={{borderBottom:`1px solid ${K.b0}`,background:"transparent"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:22,borderRadius:7,background:`linear-gradient(135deg,${K.emD},${K.em})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#071209",fontWeight:800,fontSize:10,flexShrink:0}}>{(u.nom||"U")[0].toUpperCase()}</div><div><div style={{color:K.t1,fontWeight:700,fontSize:12}}>{u.nom}</div><div style={{color:K.t3,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>{u.createdAt}</div></div></div><div style={{color:K.t3,fontSize:11,fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.mail}</div><div>{u.activationCode&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:11,color:K.em,background:K.emBg,borderRadius:5,padding:"1px 5px",display:"inline-block",marginBottom:2}}>{u.activationCode}</div>}{u.dateExpiration&&<div style={{fontSize:9,color:jr<=7?K.er:jr<=30?K.wa:K.t3,fontFamily:"'JetBrains Mono',monospace"}}>{jr>0?`${jr}j`:"Exp."}</div>}</div><div style={{display:"flex",gap:3,justifyContent:"flex-end",flexWrap:"wrap"}}>{st==="demande"&&<><Btn ch="✓" on={()=>sVm(u.uid)} sm/><Btn ch="✗" on={()=>ref_(u.uid)} v="d" sm/></>}{st==="actif"&&<><Btn ch="Code" on={()=>sCm(u)} v="s" sm/><Btn ch="✉" on={()=>mL(u)} v="i" sm/><Btn ch="⏸" on={()=>rev(u.uid)} v="d" sm/></>}{(st==="expiré"||st==="aucun")&&<Btn ch="▶" on={()=>sVm(u.uid)} v="s" sm/>}<Btn ch="🗑" on={()=>sDm(u.uid)} v="d" sm/></div></div>;}
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
    <nav className="nb" style={{background:`${K.card}ee`,backdropFilter:"blur(14px)",borderBottom:`1px solid ${K.b0}`,display:"flex",alignItems:"center",justifyContent:"space-between",height:52,position:"sticky",top:0,zIndex:99}}>
      <Logo sm={mob}/>
      <div className="tn" style={{flex:1,margin:"0 7px"}}>{tabs.map(([k,l])=><button key={k} onClick={()=>sT(k)} className="bt" style={{background:tab===k?K.c2:"none",border:"none",cursor:"pointer",padding:"5px 8px",borderRadius:6,fontSize:11,fontWeight:700,color:tab===k?K.t1:K.t3,whiteSpace:"nowrap",minHeight:34,borderBottom:tab===k?`2px solid ${K.em}`:"2px solid transparent"}}>{l}</button>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}><Tg c={K.wa} bg={K.waBg} bd={K.waBd} ch="Admin"/><button onClick={onOut} className="bt" style={{background:"none",border:`1px solid ${K.b0}`,color:K.t3,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,minHeight:32}}>⎋</button></div>
    </nav>
    <div className="mp" style={{maxWidth:1060,margin:"0 auto"}}>
      {msg.m&&<Pop t={msg.t} m={msg.m}/>}
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:13}}>{[[`${users.length}`,"Inscrits",K.t2],[`${nD}`,"Dem.",K.wa],[`${nA}`,"Actifs",K.em],[`${nE}`,"Exp.",K.er],[`${mods.filter(m=>m.on!==false).length}`,"Modules",K.in_]].map(([v,l,c])=><div key={l} style={{background:K.card,border:`1px solid ${K.b0}`,borderRadius:9,padding:"7px 11px",minWidth:mob?56:68,textAlign:"center"}}><div style={{color:c,fontWeight:800,fontSize:mob?14:16,letterSpacing:"-.5px",lineHeight:1}}>{v}</div><div style={{color:K.t3,fontSize:10,marginTop:2}}>{l}</div></div>)}</div>
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
        <div><div style={{color:K.t2,fontSize:12,fontWeight:600,marginBottom:6}}>Accès</div><div style={{display:"flex",gap:6}}>{[[true,"Gratuit"],[false,"Payant"]].map(([val,lb])=><div key={String(val)} onClick={()=>sStageGr&&null} style={{flex:1,background:K.c2,border:`1px solid ${K.b0}`,borderRadius:8,padding:"8px",cursor:"pointer",textAlign:"center",fontSize:11,fontWeight:600,color:K.t2}}>{lb}</div>)}</div></div>
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
{tab==="p"&&<div style={{animation:"up .25s ease"}}>
        <div style={{fontWeight:800,fontSize:14,color:K.t1,marginBottom:3}}>PDF d'exercices</div>
        <div style={{color:K.t3,fontSize:12,marginBottom:13}}>Un PDF par module · Stocké sur Firebase Storage · Lecture seule pour abonnés.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{mods.filter(m=>m.on!==false).map(m=>{const pdf=pdfs[m.id];return <div key={m.id} style={{background:K.card,border:`1px solid ${pdf?K.inBd:K.b0}`,borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{width:32,height:32,borderRadius:9,background:`${m.col}18`,border:`1px solid ${m.col}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{m.ico}</div><div style={{flex:1,minWidth:0}}><div style={{color:K.t1,fontWeight:700,fontSize:13}}>{m.titre}</div><div style={{color:K.t3,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{m.code}{pdf?` · 📄 ${pdf.name}` : " · Aucun PDF"}</div></div><div style={{display:"flex",gap:5,flexShrink:0}}>
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
    {vm&&<Sheet title="Valider — Choisir la durée" onClose={()=>sVm(null)}><div style={{color:K.t3,fontSize:13,marginBottom:12}}>Paiement confirmé pour <b style={{color:K.t1}}>{users.find(u=>u.uid===vm)?.nom}</b>.</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>{DUR.map(d=><div key={d.id} onClick={()=>genC(vm,d.id)} className="bt" style={{background:K.c2,border:`1px solid ${K.b0}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",minHeight:50}} onMouseEnter={e=>{e.currentTarget.style.borderColor=K.emBd;e.currentTarget.style.background=K.emBg;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=K.b0;e.currentTarget.style.background=K.c2;}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t1,fontWeight:700,fontSize:14}}>{d.l}</div><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={d.j===36500?"∞":d.j+"j"}/></div></div>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:K.t3,fontSize:12}}>Ou activer directement :</div><Btn ch="⚡ 3 mois" on={()=>actD(vm,"3m")} v="s" sm/></div></Sheet>}
    {cm&&<Sheet title="Code généré ✅" onClose={()=>sCm(null)} w={400}><div style={{background:K.bg,border:`2px solid ${K.emBd}`,borderRadius:12,padding:"16px",textAlign:"center",marginBottom:11}}><div style={{color:K.t3,fontSize:9,letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginBottom:7}}>Code d'accès</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:32,letterSpacing:6,color:K.em,marginBottom:7}}>{cm.code}</div><div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}><Tg c={K.em} bg={K.emBg} bd={K.emBd} ch={cm.d?.l||"—"}/><Tg c={K.t3} bg="none" bd={K.b0} ch={fD(dE(cm.d?.j||30))}/></div></div><Btn ch="✉ Envoyer par email" on={()=>mL({...users.find(u=>u.uid===cm.uid),...cm})} v="i" full sx={{padding:"10px",fontSize:13,marginBottom:7,minHeight:42}}/><div style={{background:K.waBg,border:`1px solid ${K.waBd}`,borderRadius:8,padding:"7px 10px",marginBottom:11,fontSize:12,color:K.t2}}>Ouvre votre messagerie avec le code pré-rédigé.</div><Btn ch="Fermer" on={()=>sCm(null)} v="g" full/></Sheet>}
    {dm&&<Sheet title="Supprimer ?" onClose={()=>sDm(null)} w={320}><div style={{textAlign:"center",padding:"4px 0"}}><div style={{fontSize:30,marginBottom:7}}>⚠️</div><div style={{color:K.t1,fontWeight:700,fontSize:14,marginBottom:4}}>{users.find(u=>u.uid===dm)?.nom}</div><div style={{color:K.t3,fontSize:12,marginBottom:17}}>Action irréversible.</div><div style={{display:"flex",gap:7,justifyContent:"center"}}><Btn ch="Annuler" on={()=>sDm(null)} v="g" sx={{minHeight:42}}/><Btn ch="Supprimer" on={()=>delU(dm)} v="d" sx={{minHeight:42}}/></div></div></Sheet>}
  </div>;
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[who,sW]=useState(null);const[loading,sL]=useState(true);
  const[tid,sTid]=useState(()=>{try{return localStorage.getItem("ap_theme")||"dark";}catch{return"dark";}});
  const[showTP,sShowTP]=useState(false);
  const K=bK(tid);
  function setT(id){sTid(id);try{localStorage.setItem("ap_theme",id);}catch{}}
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async user=>{
      if(user){
        if(user.email===ADM_EMAIL){sW({role:"admin",user});sL(false);return;}
        const snap=await getDoc(doc(db,"users",user.uid));
        if(snap.exists()){sW({role:"user",uid:user.uid,user});} else sW(null);
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
    {!loading&&!who&&<Auth onL={(role,user)=>{sW(role==="__admin__"?{role:"admin",user}:{role:"user",uid:user.uid,user});}}/>}
    {!loading&&who?.role==="admin"&&<AA onOut={async()=>{await signOut(auth);sW(null);}}/>}
    {!loading&&who?.role==="user"&&<UA uid={who.uid} onOut={async()=>{await signOut(auth);sW(null);}}/>}
  </Ctx.Provider>;
}
