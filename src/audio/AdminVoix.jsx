import { useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { MODULES_FISC } from "../fiscal/modules";
import { CLASSES_REV, chargerPlan, chargerTout } from "../ef/syscohada";
import { texteFiche, texteModuleCours, texteModuleFiscal } from "./lecture";
import { cleFiche, cleFisc, cleModule, extensionAudio, formatDuree, lectureVoix } from "./voix";

// ══════════════ ADMIN — « MA VOIX » ══════════════
// Pour chaque leçon fiscale, module de cours et fiche du guide des comptes : enregistrer sa voix au micro
// (le texte à lire s'affiche comme un prompteur), ou coller le lien d'un fichier audio (Google Drive, MP3…).
// Enregistrement envoyé dans Firebase Storage (audios/{cle}/…) ; si Storage n'est pas disponible,
// le fichier peut être téléchargé puis déposé sur Drive et collé en lien.

const carte = K => ({ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 14 });
const btn = (K, v) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", minHeight: 32,
  ...(v === "p" ? { background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", border: "none" } : v === "d" ? { background: K.erBg, color: K.er, border: `1px solid ${K.erBd}` } : { background: "transparent", color: K.t2, border: `1px solid ${K.b1}` }) });
const FORMATS = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
const delai = (p, ms = 180000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
const NOM_DEFAUT = "Gédéon NKULI";

export default function AdminVoix({ K, mob, db, storage, mods = [] }) {
  const [groupe, sGroupe] = useState("fisc");
  const [q, sQ] = useState("");
  const [audios, sAudios] = useState({});
  const [guide, sGuide] = useState(null); // { fiches: [{c, titre, k, x}], titreDe }
  const [auteur, sAuteur] = useState(() => { try { return localStorage.getItem("ec_voix_auteur") || NOM_DEFAUT; } catch (e) { return NOM_DEFAUT; } });
  const [sel, sSel] = useState(null); // contenu ouvert { cle, titre, segs }
  const [lien, sLien] = useState("");
  const [rec, sRec] = useState({ phase: "pret" }); // pret | enreg | pause | fini | envoi
  const [msg, sMsg] = useState(null);
  const mr = useRef(null), morceaux = useRef([]), flux = useRef(null), minuteur = useRef(null), debut = useRef(0), cumul = useRef(0);

  useEffect(() => onSnapshot(collection(db, "audios"), s => sAudios(Object.fromEntries(s.docs.map(d => [d.id, d.data()]))), () => {}), [db]);
  useEffect(() => {
    if (groupe !== "guide" || guide) return;
    Promise.all([chargerTout(), chargerPlan()]).then(([L, plan]) => {
      const fiches = L.flatMap(C => C.comptes.map(x => ({ c: x.c, titre: x.titre, k: C.classe, x })));
      const titres = new Map(fiches.map(f => [f.c, f.titre]));
      sGuide({ fiches, titreDe: n => plan.index.get(n) || titres.get(n) || "" });
    });
  }, [groupe, guide]);
  useEffect(() => () => { // départ de l'onglet : micro coupé
    const r = mr.current, f = flux.current, m = minuteur.current;
    clearInterval(m);
    if (r && r.state !== "inactive") { r.onstop = null; r.stop(); }
    if (f) f.getTracks().forEach(t => t.stop());
  }, []);

  const contenus = useMemo(() => {
    if (groupe === "fisc") return MODULES_FISC.map(m => ({ cle: cleFisc(m.id), titre: `${m.id} · ${m.titre}`, sous: m.duree, texte: () => texteModuleFiscal(m) }));
    if (groupe === "mod") return mods.map(m => ({ cle: cleModule(m.id), titre: m.titre, sous: [m.code, m.mat].filter(Boolean).join(" · "), texte: () => texteModuleCours(m, true) }));
    return guide ? guide.fiches.map(f => ({ cle: cleFiche(f.c), titre: `${f.c} — ${f.titre}`, sous: `Classe ${f.k}`, texte: () => texteFiche(f.x, guide.titreDe) })) : [];
  }, [groupe, mods, guide]);
  const filtres = contenus.filter(c => !q.trim() || c.titre.toLowerCase().includes(q.trim().toLowerCase()));
  const nAvec = contenus.filter(c => audios[c.cle]).length;

  const arreterFlux = () => { if (flux.current) { flux.current.getTracks().forEach(t => t.stop()); flux.current = null; } };
  const ouvrir = c => { annulerEnreg(); sSel({ cle: c.cle, titre: c.titre, segs: c.texte() }); sLien(""); sMsg(null); };
  const fermer = () => { annulerEnreg(); sSel(null); sMsg(null); };
  const annulerEnreg = () => {
    clearInterval(minuteur.current);
    if (mr.current && mr.current.state !== "inactive") { mr.current.onstop = null; mr.current.stop(); }
    arreterFlux();
    sRec(r => { if (r.url) URL.revokeObjectURL(r.url); return { phase: "pret" }; });
  };
  const secondes = () => cumul.current + (debut.current ? (Date.now() - debut.current) / 1000 : 0);

  const demarrer = async () => {
    sMsg(null);
    if (!navigator.mediaDevices || !window.MediaRecorder) { sMsg({ t: "e", m: "Ce navigateur ne permet pas d'enregistrer. Utilisez Chrome à jour, ou enregistrez avec votre téléphone et collez le lien du fichier." }); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      flux.current = s;
      const type = FORMATS.find(f => MediaRecorder.isTypeSupported(f)) || "";
      const r = new MediaRecorder(s, type ? { mimeType: type, audioBitsPerSecond: 64000 } : undefined);
      morceaux.current = [];
      r.ondataavailable = e => { if (e.data && e.data.size) morceaux.current.push(e.data); };
      r.onstop = () => {
        const blob = new Blob(morceaux.current, { type: r.mimeType || type || "audio/webm" });
        arreterFlux();
        sRec({ phase: "fini", blob, url: URL.createObjectURL(blob), duree: secondes() });
        debut.current = 0;
      };
      mr.current = r;
      cumul.current = 0; debut.current = Date.now();
      r.start(1000);
      clearInterval(minuteur.current);
      minuteur.current = setInterval(() => sRec(x => (x.phase === "enreg" ? { ...x, s: secondes() } : x)), 500);
      sRec({ phase: "enreg", s: 0 });
    } catch (e) {
      sMsg({ t: "e", m: e && e.name === "NotAllowedError" ? "Accès au micro refusé : autorisez le micro pour ce site (icône du cadenas dans la barre d'adresse), puis réessayez." : `Micro indisponible : ${e && e.message ? e.message : e}` });
    }
  };
  const pause = () => { if (mr.current && mr.current.state === "recording") { mr.current.pause(); cumul.current = secondes(); debut.current = 0; sRec(x => ({ ...x, phase: "pause", s: cumul.current })); } };
  const reprendre = () => { if (mr.current && mr.current.state === "paused") { mr.current.resume(); debut.current = Date.now(); sRec(x => ({ ...x, phase: "enreg" })); } };
  const terminer = () => { clearInterval(minuteur.current); cumul.current = secondes(); debut.current = 0; if (mr.current && mr.current.state !== "inactive") mr.current.stop(); };

  const supprimerFichier = async ancien => { if (ancien && ancien.source === "storage" && ancien.chemin) { try { await deleteObject(ref(storage, ancien.chemin)); } catch (e) { /* déjà supprimé */ } } };
  const envoyer = async () => {
    const { blob, duree } = rec;
    if (!blob || !sel) return;
    sRec(r => ({ ...r, phase: "envoi" }));
    const ext = extensionAudio(blob.type), chemin = `audios/${sel.cle}/${Date.now()}.${ext}`;
    try {
      await delai(uploadBytes(ref(storage, chemin), blob, { contentType: blob.type.split(";")[0] || "audio/webm" }));
      const url = await getDownloadURL(ref(storage, chemin));
      const ancien = audios[sel.cle];
      await setDoc(doc(db, "audios", sel.cle), { url, source: "storage", chemin, duree: Math.round(duree || 0), date: new Date().toISOString(), auteur: auteur.trim() || NOM_DEFAUT, titre: sel.titre });
      await supprimerFichier(ancien);
      sMsg({ t: "o", m: "Votre voix est en ligne : les apprenants l'entendent dès maintenant sur ce contenu." });
      annulerEnreg();
    } catch (e) {
      const c = e && e.code;
      const raison = c === "storage/unauthorized" ? "les règles Storage ne sont pas encore publiées" : (c === "storage/unknown" || c === "storage/bucket-not-found" || c === "storage/project-not-found" || c === "storage/quota-exceeded") ? "le stockage Firebase demande la formule Blaze" : e && e.message === "timeout" ? "l'envoi a expiré (connexion lente)" : "l'envoi a échoué";
      sMsg({ t: "e", m: `Enregistrement non envoyé : ${raison}. Téléchargez le fichier ci-dessous, déposez-le dans Google Drive (partage « Tous les utilisateurs disposant du lien — Lecteur »), puis collez son lien dans « Lien d'un fichier audio ».` });
      sRec(r => ({ ...r, phase: "fini", echec: true }));
    }
  };
  const enregistrerLien = async () => {
    const lec = lectureVoix(lien);
    if (!lec || !sel) { sMsg({ t: "e", m: "Collez un lien complet (https://…) vers le fichier audio." }); return; }
    try {
      const ancien = audios[sel.cle];
      await setDoc(doc(db, "audios", sel.cle), { url: lien.trim(), source: lec.mode === "drive" ? "drive" : "lien", duree: null, date: new Date().toISOString(), auteur: auteur.trim() || NOM_DEFAUT, titre: sel.titre });
      await supprimerFichier(ancien);
      sLien("");
      sMsg({ t: "o", m: lec.mode === "drive" ? "Lien enregistré. Vérifiez que le fichier Drive est partagé en « Tous les utilisateurs disposant du lien — Lecteur »." : "Lien enregistré." });
    } catch (e) { sMsg({ t: "e", m: `Lien non enregistré : ${e && e.message ? e.message : e}` }); }
  };
  const retirer = async () => {
    if (!sel || !audios[sel.cle] || !window.confirm("Retirer votre voix de ce contenu ? Les apprenants retrouveront la voix de synthèse.")) return;
    const ancien = audios[sel.cle];
    try { await deleteDoc(doc(db, "audios", sel.cle)); await supprimerFichier(ancien); sMsg({ t: "o", m: "Voix retirée." }); } catch (e) { sMsg({ t: "e", m: `Suppression impossible : ${e && e.message ? e.message : e}` }); }
  };

  const etat = c => audios[c.cle];
  const lecteur = v => { const l = lectureVoix(v && v.url); return !l ? null : l.mode === "audio" ? <audio controls preload="none" src={l.src} style={{ width: "100%", height: 40 }} /> : <iframe src={l.src} title="Voix" style={{ width: "100%", height: 96, border: "none", borderRadius: 8, background: "#000" }} />; };

  // ── Panneau d'un contenu : prompteur, enregistreur, lien
  const panneau = () => {
    const v = audios[sel.cle];
    return <div style={{ ...carte(K), padding: mob ? 12 : 16, borderColor: K.emBd }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
        <div><div style={{ fontSize: 10.5, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4 }}>Enregistrer ma voix</div><div style={{ fontWeight: 800, fontSize: 15, color: K.t1, lineHeight: 1.3 }}>{sel.titre}</div></div>
        <button onClick={fermer} className="bt" style={btn(K)}><i className="ti ti-x" style={{ fontSize: 14 }} />Fermer</button>
      </div>
      {msg && <div style={{ background: msg.t === "e" ? K.erBg : K.emBg, border: `1px solid ${msg.t === "e" ? K.erBd : K.emBd}`, color: msg.t === "e" ? K.er : K.em, borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>{msg.m}</div>}
      {v && <div style={{ background: K.c2, borderRadius: 10, padding: "9px 11px", marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 12, color: K.t2 }}>
          <span><i className="ti ti-microphone" style={{ fontSize: 13, color: K.em }} /> Voix en ligne{v.duree ? ` · ${formatDuree(v.duree)}` : ""} · {v.source === "storage" ? "fichier de l'application" : v.source === "drive" ? "Google Drive" : "lien"}{v.date ? ` · ${new Date(v.date).toLocaleDateString("fr-FR")}` : ""}</span>
          <button onClick={retirer} className="bt" style={btn(K, "d")}><i className="ti ti-trash" style={{ fontSize: 13 }} />Retirer</button>
        </div>
        {lecteur(v)}
      </div>}
      <div style={{ fontSize: 11, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4, margin: "4px 0 6px" }}>Texte à lire (prompteur)</div>
      <div style={{ maxHeight: mob ? 220 : 280, overflowY: "auto", background: K.c2, border: `1px solid ${K.b0}`, borderRadius: 10, padding: "10px 12px", fontSize: mob ? 15 : 16, lineHeight: 1.7, color: K.t1, marginBottom: 10 }}>
        {sel.segs.map((t, i) => <p key={i} style={{ margin: "0 0 6px" }}>{t}</p>)}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {rec.phase === "pret" && <button onClick={demarrer} className="bt" style={{ ...btn(K, "p"), padding: "9px 14px", fontSize: 13 }}><i className="ti ti-microphone" style={{ fontSize: 16 }} />Commencer l'enregistrement</button>}
        {(rec.phase === "enreg" || rec.phase === "pause") && <>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 15, color: rec.phase === "enreg" ? K.er : K.t2 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: rec.phase === "enreg" ? K.er : K.t3, animation: rec.phase === "enreg" ? "pulse 1.2s ease-in-out infinite" : "none" }} />{formatDuree(rec.s)}</span>
          {rec.phase === "enreg" ? <button onClick={pause} className="bt" style={btn(K)}><i className="ti ti-player-pause" style={{ fontSize: 14 }} />Pause</button> : <button onClick={reprendre} className="bt" style={btn(K)}><i className="ti ti-player-record" style={{ fontSize: 14 }} />Reprendre</button>}
          <button onClick={terminer} className="bt" style={btn(K, "p")}><i className="ti ti-player-stop" style={{ fontSize: 14 }} />Terminer</button>
          <button onClick={annulerEnreg} className="bt" style={btn(K)}>Annuler</button>
        </>}
        {(rec.phase === "fini" || rec.phase === "envoi") && <div style={{ width: "100%" }}>
          <audio controls src={rec.url} style={{ width: "100%", height: 40, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={envoyer} disabled={rec.phase === "envoi"} className="bt" style={{ ...btn(K, "p"), opacity: rec.phase === "envoi" ? .6 : 1 }}><i className="ti ti-cloud-upload" style={{ fontSize: 14 }} />{rec.phase === "envoi" ? "Envoi…" : `Mettre en ligne (${formatDuree(rec.duree)})`}</button>
            <button onClick={() => { annulerEnreg(); }} className="bt" style={btn(K)}><i className="ti ti-refresh" style={{ fontSize: 14 }} />Recommencer</button>
            <a href={rec.url} download={`${sel.cle}.${extensionAudio(rec.blob && rec.blob.type)}`} className="bt" style={{ ...btn(K), textDecoration: "none" }}><i className="ti ti-download" style={{ fontSize: 14 }} />Télécharger le fichier</a>
          </div>
        </div>}
      </div>
      <div style={{ borderTop: `1px solid ${K.b0}`, paddingTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: K.t2, marginBottom: 5 }}>Ou : lien d'un fichier audio (Google Drive, MP3…)</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={lien} onChange={e => sLien(e.target.value)} inputMode="url" placeholder="https://drive.google.com/file/d/…" style={{ flex: 1, minWidth: 0, background: K.c2, border: `1px solid ${K.b1}`, borderRadius: 8, padding: "8px 10px", color: K.t1, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
          <button onClick={enregistrerLien} disabled={!lien.trim()} className="bt" style={{ ...btn(K, "p"), opacity: lien.trim() ? 1 : .5 }}>Enregistrer</button>
        </div>
        <div style={{ fontSize: 11.5, color: K.t3, marginTop: 5, lineHeight: 1.5 }}>Astuce : enregistrez avec l'application « Enregistreur » du téléphone, déposez le fichier dans Drive, partagez-le en « Tous les utilisateurs disposant du lien — Lecteur » et collez le lien ici.</div>
      </div>
    </div>;
  };

  return <div style={{ animation: "up .25s ease" }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 21, color: K.t1 }}>Ma voix</div>
      <div style={{ color: K.t3, fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>Enregistrez votre voix sur les leçons, modules et fiches : les apprenants l'entendent à la place de la voix de synthèse (qui reste disponible).</div>
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: K.t2, fontWeight: 600 }}>Nom affiché :</span>
      <input value={auteur} onChange={e => { sAuteur(e.target.value); try { localStorage.setItem("ec_voix_auteur", e.target.value); } catch (er) { /* stockage indisponible */ } }} style={{ background: K.c2, border: `1px solid ${K.b1}`, borderRadius: 8, padding: "6px 10px", color: K.t1, fontSize: 13, width: 200, fontFamily: "'Outfit',sans-serif" }} />
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {[["fisc", "receipt-tax", `Code des impôts (${MODULES_FISC.length})`], ["mod", "book-2", `Modules de cours (${mods.length})`], ["guide", "books", "Guide des comptes (85)"]].map(([g, ico, l]) => <button key={g} onClick={() => { sGroupe(g); sQ(""); }} className="bt" style={{ ...btn(K, groupe === g ? "p" : "g") }}><i className={`ti ti-${ico}`} style={{ fontSize: 14 }} />{l}</button>)}
    </div>
    {sel && <div style={{ marginBottom: 12 }}>{panneau()}</div>}
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
      <input value={q} onChange={e => sQ(e.target.value)} placeholder="Rechercher…" style={{ flex: 1, minWidth: 160, background: K.card, border: `1px solid ${K.b1}`, borderRadius: 10, padding: "8px 12px", color: K.t1, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
      <span style={{ fontSize: 12, color: K.t3, fontWeight: 600 }}>{nAvec} / {contenus.length} avec votre voix</span>
    </div>
    {groupe === "guide" && !guide ? <div style={{ ...carte(K), padding: 20, textAlign: "center", color: K.t3, fontSize: 13 }}>Chargement des fiches…</div>
      : <div style={carte(K)}>
        {!filtres.length && <div style={{ padding: 16, fontSize: 13, color: K.t3 }}>{groupe === "mod" ? "Aucun module de cours." : "Aucun résultat."}</div>}
        {filtres.map((c, j) => { const v = etat(c); return <div key={c.cle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderTop: j ? `1px solid ${K.b0}` : "none", background: sel && sel.cle === c.cle ? K.emBg : "transparent" }}>
          <i className={`ti ti-${v ? "microphone" : "microphone-off"}`} style={{ fontSize: 17, color: v ? K.em : K.t3, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: K.t1, lineHeight: 1.35 }}>{c.titre}</div>
            <div style={{ fontSize: 11.5, color: K.t3 }}>{c.sous}{v ? ` · voix en ligne${v.duree ? ` (${formatDuree(v.duree)})` : ""}` : " · voix de synthèse"}</div>
          </div>
          <button onClick={() => ouvrir(c)} className="bt" style={btn(K, v ? "g" : "p")}><i className="ti ti-microphone" style={{ fontSize: 13 }} />{v ? "Modifier" : "Enregistrer"}</button>
        </div>; })}
      </div>}
    <div style={{ fontSize: 11.5, color: K.t3, marginTop: 8, lineHeight: 1.5 }}>{CLASSES_REV.length} classes du guide · conseil : enregistrez dans une pièce calme, téléphone à 20 cm, en lisant le texte du prompteur ; vous pouvez faire une pause à tout moment.</div>
  </div>;
}
