import React,{useState,useEffect}from"react";
import{collection,doc,onSnapshot,setDoc,deleteDoc,writeBatch,serverTimestamp}from"firebase/firestore";
import{DUR,OFFRES,OPERATEURS,offresAvecPrix,parMois,fUSD,usePaiement,nouveauCodeOffert}from"./acces";

// Onglet admin « Accès » : tarifs et numéros Mobile Money (config/paiement), codes offerts (bons).
export const URL_APP="https://eco-campus-rdc.vercel.app";
export const texteInvitation=(code,duree)=>`Bonjour ! Voici votre code d'accès offert à Éco-Campus RDC (${duree}) : ${code}\n\n1. Créez votre compte sur ${URL_APP}\n2. Touchez la clé 🔑 « J'ai un code » en haut de l'écran\n3. Saisissez le code : tous les contenus s'ouvrent.`;
const MAX_LOT=50;

const champ=K=>({width:"100%",boxSizing:"border-box",background:K.c2,border:`1px solid ${K.b1}`,borderRadius:10,padding:"10px 12px",color:K.t1,fontSize:14,fontFamily:"'Outfit',sans-serif"});
function Lb({K,children}){return <div style={{fontSize:12.5,fontWeight:700,color:K.t2,margin:"0 0 5px"}}>{children}</div>;}
function Carte({K,children,sx}){return <div style={{background:K.card,border:`1px solid ${K.b0}`,boxShadow:K.sh,borderRadius:16,padding:"16px 18px",marginBottom:14,...sx}}>{children}</div>;}
function Titre({K,ico,col,children,sous}){return <div style={{marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:16,color:K.t1}}><i className={`ti ti-${ico}`} style={{fontSize:19,color:col}}/>{children}</div>{sous&&<div style={{fontSize:13,color:K.t3,marginTop:3,lineHeight:1.5}}>{sous}</div>}</div>;}

export default function AdminAcces({K,mob,db}){
  const cfg=usePaiement(db);
  const[f,sF]=useState(null);
  useEffect(()=>{if(cfg&&!f){const o=offresAvecPrix(cfg);sF({m:o[0].prix,t:o[1].prix,a:o[2].prix,mpesa:cfg.mpesa||"",airtel:cfg.airtel||"",orange:cfg.orange||"",beneficiaire:cfg.beneficiaire||""});}},[cfg,f]);
  const[bons,sBons]=useState([]),[g,sG]=useState({dureeId:"3m",nb:1,note:""}),[lot,sLot]=useState([]),[filtre,sFiltre]=useState("tous");
  const[busy,sBusy]=useState(false),[msg,sMsg]=useState(null),[copie,sCopie]=useState("");
  useEffect(()=>onSnapshot(collection(db,"bons"),s=>{const L=s.docs.map(d=>({id:d.id,...d.data(),t:d.data().creeLe?.toMillis?.()??Date.now()}));L.sort((a,b)=>b.t-a.t);sBons(L);},()=>{}),[db]);
  const flash=(t,m)=>{sMsg({t,m});setTimeout(()=>sMsg(null),4500);};
  const copier=v=>{try{navigator.clipboard.writeText(v);sCopie(v);setTimeout(()=>sCopie(""),1800);}catch(e){}};
  const wa=(code,duree)=>`https://wa.me/?text=${encodeURIComponent(texteInvitation(code,duree))}`;
  const lDuree=id=>DUR.find(d=>d.id===id)?.l||"—";

  const enregistrer=async()=>{
    const prix={};for(const o of OFFRES){const v=Number(String(f[o.id]).replace(",","."));if(!(v>0))return flash("e",`Prix invalide pour l'offre ${o.l}.`);prix[o.id]=Math.round(v*100)/100;}
    sBusy(true);
    try{await setDoc(doc(db,"config","paiement"),{prix,mpesa:f.mpesa.trim(),airtel:f.airtel.trim(),orange:f.orange.trim(),beneficiaire:f.beneficiaire.trim()},{merge:true});flash("o","Tarifs et numéros enregistrés : ils s'affichent dans « Obtenir l'accès ».");}
    catch(e){flash("e","Enregistrement impossible : vérifiez votre connexion.");}
    sBusy(false);
  };
  const generer=async()=>{
    const n=Math.min(MAX_LOT,Math.max(1,parseInt(g.nb,10)||1)),d=DUR.find(x=>x.id===g.dureeId);
    sBusy(true);
    try{
      const pris=new Set(bons.map(b=>b.id)),codes=[];
      while(codes.length<n){const c=nouveauCodeOffert();if(!pris.has(c)){pris.add(c);codes.push(c);}}
      const b=writeBatch(db);
      codes.forEach(c=>b.set(doc(db,"bons",c),{code:c,dureeId:d.id,jours:d.j,note:g.note.trim().slice(0,120),creeLe:serverTimestamp(),uid:null,nom:null,utiliseLe:null}));
      await b.commit();sLot(codes.map(c=>({code:c,duree:d.l})));
      flash("o",`${n} code${n>1?"s":""} offert${n>1?"s":""} créé${n>1?"s":""} (${d.l}).`);
    }catch(e){flash("e","Création impossible : publiez les règles Firestore mises à jour (collection « bons »).");}
    sBusy(false);
  };
  const supprimer=async b=>{if(!window.confirm(`Supprimer le code ${b.id} ? Il ne pourra plus être utilisé.`))return;try{await deleteDoc(doc(db,"bons",b.id));}catch(e){flash("e",e.message);}};

  const nUtil=bons.filter(b=>b.uid).length;
  const liste=bons.filter(b=>filtre==="tous"||(filtre==="libres"?!b.uid:!!b.uid));
  const bouton=(v="s")=>({display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 14px",borderRadius:11,cursor:"pointer",fontWeight:800,fontSize:13.5,fontFamily:"'Outfit',sans-serif",textDecoration:"none",
    ...(v==="p"?{background:`linear-gradient(135deg,${K.emD},${K.em})`,border:"none",color:"#fff"}:v==="w"?{background:"#1FA855",border:"none",color:"#fff"}:{background:K.c2,border:`1px solid ${K.b1}`,color:K.t1})});
  const petit={...bouton(),padding:"6px 10px",fontSize:12.5,borderRadius:9};
  const grille={display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:12};
  if(!f)return <div style={{color:K.t3,fontSize:14,padding:20}}>Chargement…</div>;
  const offres=offresAvecPrix({prix:{m:f.m,t:f.t,a:f.a}});

  return <div style={{maxWidth:860,margin:"0 auto"}}>
    {msg&&<div style={{background:msg.t==="o"?K.emBg:K.erBg,border:`1px solid ${msg.t==="o"?K.emBd:K.erBd}`,color:msg.t==="o"?K.em:K.er,borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:14,fontWeight:600}}>{msg.m}</div>}

    <Carte K={K}>
      <Titre K={K} ico="credit-card" col="#0D7A6B" sous="Chaque abonnement donne accès à tous les contenus pendant sa durée. Les prix et numéros s'affichent dans l'écran « Obtenir l'accès » des apprenants.">Tarifs et paiement</Titre>
      <div style={grille}>{offres.map(o=><div key={o.id}><Lb K={K}>{o.l} · {o.duree} (USD)</Lb>
        <input value={f[o.id]} onChange={e=>sF({...f,[o.id]:e.target.value})} inputMode="decimal" style={champ(K)}/>
        {o.mois>1&&<div style={{fontSize:12,color:K.t3,marginTop:4}}>soit {fUSD(parMois(o))} par mois</div>}</div>)}</div>
      <div style={grille}>{OPERATEURS.map(o=><div key={o.k}><Lb K={K}>Numéro {o.l}</Lb>
        <input value={f[o.k]} onChange={e=>sF({...f,[o.k]:e.target.value})} placeholder="+243 …" inputMode="tel" style={champ(K)}/></div>)}</div>
      <Lb K={K}>Nom du bénéficiaire affiché par l'opérateur</Lb>
      <input value={f.beneficiaire} onChange={e=>sF({...f,beneficiaire:e.target.value})} placeholder="Ex. : ACCESS PLUS CONSULTING" style={{...champ(K),marginBottom:12}}/>
      <div style={{fontSize:12.5,color:K.t3,marginBottom:12,lineHeight:1.5}}>Laissez vide un opérateur que vous n'utilisez pas : il ne sera pas affiché.</div>
      <button onClick={enregistrer} disabled={busy} className="bt" style={bouton("p")}><i className="ti ti-device-floppy"/>Enregistrer</button>
    </Carte>

    <Carte K={K}>
      <Titre K={K} ico="gift" col="#A3122A" sous="Codes gratuits à distribuer : chaque code ouvre tous les contenus pour la durée choisie, à partir du jour où il est utilisé. Un code ne sert qu'une fois.">Codes offerts</Titre>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 110px 2fr",gap:10,marginBottom:12}}>
        <div><Lb K={K}>Durée d'accès</Lb><select value={g.dureeId} onChange={e=>sG({...g,dureeId:e.target.value})} style={champ(K)}>{DUR.map(d=><option key={d.id} value={d.id}>{d.l}</option>)}</select></div>
        <div><Lb K={K}>Nombre</Lb><input type="number" min={1} max={MAX_LOT} value={g.nb} onChange={e=>sG({...g,nb:e.target.value})} style={champ(K)}/></div>
        <div style={mob?{gridColumn:"1 / -1"}:null}><Lb K={K}>Destinataire ou campagne (facultatif)</Lb><input value={g.note} onChange={e=>sG({...g,note:e.target.value})} placeholder="Ex. : Promotion ISC L3, Jean K." style={champ(K)}/></div>
      </div>
      <button onClick={generer} disabled={busy} className="bt" style={bouton("p")}><i className="ti ti-ticket"/>{busy?"Création…":"Créer les codes"}</button>
      {lot.length>0&&<div style={{marginTop:14,background:K.emBg,border:`1px solid ${K.emBd}`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <div style={{fontWeight:800,fontSize:14,color:K.t1}}>Codes créés</div>
          <button onClick={()=>copier(lot.map(x=>x.code).join("\n"))} className="bt" style={petit}><i className={`ti ti-${copie.includes("\n")||(lot.length===1&&copie===lot[0].code)?"check":"copy"}`}/>Copier {lot.length>1?"tous les codes":"le code"}</button>
        </div>
        {lot.map(x=><div key={x.code} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"6px 0",borderTop:`1px solid ${K.emBd}`}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:14.5,color:K.em,letterSpacing:1}}>{x.code}</span>
          <a href={wa(x.code,x.duree)} target="_blank" rel="noreferrer" className="bt" style={{...petit,...bouton("w"),padding:"6px 10px",fontSize:12.5}}><i className="ti ti-brand-whatsapp"/>Envoyer</a>
        </div>)}
      </div>}
    </Carte>

    <Carte K={K}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <div style={{fontWeight:800,fontSize:15.5,color:K.t1}}>Suivi des codes offerts <span style={{fontSize:13,color:K.t3,fontWeight:700}}>· {bons.length} créé{bons.length>1?"s":""}, {nUtil} utilisé{nUtil>1?"s":""}</span></div>
        <div style={{display:"flex",gap:6}}>{[["tous","Tous"],["libres","Disponibles"],["utilises","Utilisés"]].map(([k,l])=><button key={k} onClick={()=>sFiltre(k)} className="bt" style={{...petit,...(filtre===k?{background:K.emBg,border:`1px solid ${K.emBd}`,color:K.em}:{})}}>{l}</button>)}</div>
      </div>
      {!liste.length&&<div style={{color:K.t3,fontSize:14,padding:"14px 0"}}>Aucun code pour l'instant.</div>}
      {liste.map(b=><div key={b.id} style={{display:"flex",alignItems:mob?"flex-start":"center",justifyContent:"space-between",gap:10,padding:"10px 0",borderTop:`1px solid ${K.b0}`,flexDirection:mob?"column":"row"}}>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:14,color:b.uid?K.t3:K.em}}>{b.id}</span>
            <span style={{fontSize:12,fontWeight:800,borderRadius:99,padding:"2px 9px",background:b.uid?K.c2:K.emBg,color:b.uid?K.t2:K.em,border:`1px solid ${b.uid?K.b1:K.emBd}`}}>{b.uid?"Utilisé":"Disponible"}</span>
            <span style={{fontSize:12.5,color:K.t3}}>{lDuree(b.dureeId)}</span></div>
          <div style={{fontSize:12.5,color:K.t3,marginTop:3}}>{b.note?`${b.note} · `:""}créé le {new Date(b.t).toLocaleDateString("fr-FR")}{b.uid&&<> · utilisé par <b style={{color:K.t2}}>{b.nom||"un apprenant"}</b>{b.utiliseLe?.toMillis?` le ${new Date(b.utiliseLe.toMillis()).toLocaleDateString("fr-FR")}`:""}</>}</div>
        </div>
        {!b.uid&&<div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>copier(b.id)} className="bt" title="Copier le code" style={petit}><i className={`ti ti-${copie===b.id?"check":"copy"}`}/></button>
          <a href={wa(b.id,lDuree(b.dureeId))} target="_blank" rel="noreferrer" className="bt" title="Envoyer par WhatsApp" style={{...petit,...bouton("w"),padding:"6px 10px",fontSize:12.5}}><i className="ti ti-brand-whatsapp"/></a>
          <button onClick={()=>supprimer(b)} className="bt" title="Supprimer le code" style={{...petit,color:K.er}}><i className="ti ti-trash"/></button>
        </div>}
      </div>)}
    </Carte>
  </div>;
}
