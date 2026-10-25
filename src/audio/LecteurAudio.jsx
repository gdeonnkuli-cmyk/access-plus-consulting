import { useEffect, useMemo, useRef, useState } from "react";
import { dureeMinutes } from "./lecture";

// ══════════════ LECTEUR AUDIO (synthèse vocale du navigateur) ══════════════
// Lit une liste de segments (voir lecture.js) phrase par phrase, avec pause / reprise, retour, avance et vitesse.
// La pause arrête la phrase en cours et reprend au début de celle-ci (pause() n'est pas fiable sur Android).
// Un seul lecteur parle à la fois : démarrer un lecteur arrête les autres.
// compact : petit bouton 🔊 (titre en info-bulle) tant que rien ne joue ; autoStart : lecture lancée dès l'affichage
// (après un geste de l'utilisateur) ; onFin : appelé quand la lecture arrive au bout, pour enchaîner un autre contenu.

const VITESSES = [0.9, 1, 1.15, 1.3];
const EVT = "ec-audio";
const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);
let compteur = 0;

function voixFr() {
  const s = synth();
  const V = s ? s.getVoices().filter(v => /^fr/i.test(v.lang)) : [];
  return V.find(v => /fr[-_]FR/i.test(v.lang) && /google|natural|premium|enhanced/i.test(v.name)) || V.find(v => /fr[-_]FR/i.test(v.lang)) || V[0] || null;
}

export default function LecteurAudio({ K, segments, titre = "Écouter", sx, compact, autoStart, onFin }) {
  const [etat, sEtat] = useState("arret"); // arret | lecture | pause
  const [i, sI] = useState(0);
  const [vitesse, sVitesse] = useState(() => { try { return +localStorage.getItem("ec_audio_vitesse") || 1; } catch (e) { return 1; } });
  const id = useRef(++compteur), jeton = useRef(0), iRef = useRef(0), vRef = useRef(vitesse), finRef = useRef(onFin), demarrerRef = useRef(null);
  finRef.current = onFin;
  const segs = useMemo(() => segments || [], [segments]);
  const duree = useMemo(() => dureeMinutes(segs), [segs]);

  const arreterVoix = () => { jeton.current++; const s = synth(); if (s) s.cancel(); };
  const lire = n => {
    const s = synth();
    if (!s || n >= segs.length) { sEtat("arret"); sI(0); iRef.current = 0; if (s && n > 0 && finRef.current) finRef.current(); return; }
    const t = ++jeton.current;
    iRef.current = n; sI(n); sEtat("lecture");
    const u = new SpeechSynthesisUtterance(segs[n]);
    const v = voixFr();
    if (v) u.voice = v;
    u.lang = v ? v.lang : "fr-FR";
    u.rate = vRef.current;
    u.onend = () => { if (jeton.current === t) lire(n + 1); };
    u.onerror = e => { if (jeton.current === t && e.error !== "interrupted" && e.error !== "canceled") lire(n + 1); };
    try { s.speak(u); } catch (e) { sEtat("arret"); }
  };
  const demarrer = n => {
    window.dispatchEvent(new CustomEvent(EVT, { detail: id.current }));
    arreterVoix();
    setTimeout(() => lire(n), 80); // Android ignore parfois speak() juste après cancel()
  };
  demarrerRef.current = demarrer;
  const pause = () => { arreterVoix(); sEtat("pause"); };
  const stop = () => { arreterVoix(); sEtat("arret"); sI(0); iRef.current = 0; };

  useEffect(() => {
    const autre = e => { if (e.detail !== id.current) { jeton.current++; sEtat(x => (x === "lecture" ? "pause" : x)); } };
    window.addEventListener(EVT, autre);
    const s = synth();
    if (s && s.getVoices().length === 0 && "onvoiceschanged" in s) s.onvoiceschanged = () => {};
    return () => { window.removeEventListener(EVT, autre); if (s) { jeton.current++; s.cancel(); } };
  }, []);
  // Nouveau contenu (autre module, autre fiche) : on repart de zéro — signature du texte, pas de l'objet
  const signature = `${segs.length}|${segs[0] || ""}|${segs[segs.length - 1] || ""}`;
  useEffect(() => {
    jeton.current++; const s = synth(); if (s) s.cancel(); sEtat("arret"); sI(0); iRef.current = 0;
    if (autoStart && s) demarrerRef.current(0);
  }, [signature, autoStart]);

  if (!synth() || !segs.length) return null;
  const changerVitesse = () => {
    const v = VITESSES[(VITESSES.indexOf(vitesse) + 1) % VITESSES.length] || 1;
    sVitesse(v); vRef.current = v;
    try { localStorage.setItem("ec_audio_vitesse", String(v)); } catch (e) { /* stockage indisponible */ }
    if (etat === "lecture") demarrer(iRef.current);
  };
  const rond = (ico, on, lib, plein) => <button onClick={on} aria-label={lib} title={lib} className="bt" style={{ width: 36, height: 36, borderRadius: 99, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, border: plein ? "none" : `1px solid ${K.b1}`, background: plein ? `linear-gradient(135deg,${K.emD},${K.em})` : "transparent", color: plein ? "#fff" : K.t2 }}><i className={`ti ti-${ico}`} style={{ fontSize: 17 }} /></button>;

  if (etat === "arret" && compact) return <button onClick={() => demarrer(0)} aria-label={titre} title={`${titre} · ≈ ${duree} min`} className="bt" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px 4px 6px", borderRadius: 99, border: `1px solid ${K.emBd}`, background: K.emBg, color: K.em, fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textTransform: "none", letterSpacing: 0, ...sx }}>
    <i className="ti ti-volume" style={{ fontSize: 14 }} />Écouter<span style={{ fontWeight: 600, color: K.t3 }}>· {duree} min</span>
  </button>;
  if (etat === "arret") return <button onClick={() => demarrer(0)} className="bt" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 10px", borderRadius: 99, border: `1px solid ${K.emBd}`, background: K.emBg, color: K.em, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", ...sx }}>
    <span style={{ width: 26, height: 26, borderRadius: 99, background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", display: "grid", placeItems: "center" }}><i className="ti ti-player-play" style={{ fontSize: 13 }} /></span>
    {titre}<span style={{ fontWeight: 600, color: K.t3, fontSize: 12 }}>· ≈ {duree} min</span>
  </button>;

  return <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 14, border: `1px solid ${K.emBd}`, background: K.card, boxShadow: K.sh, flexWrap: "wrap", textTransform: "none", letterSpacing: 0, ...(compact ? { width: "100%", boxSizing: "border-box" } : null), ...sx }}>
    {rond("player-skip-back", () => demarrer(Math.max(0, iRef.current - 1)), "Phrase précédente")}
    {etat === "lecture" ? rond("player-pause", pause, "Pause", true) : rond("player-play", () => demarrer(iRef.current), "Reprendre", true)}
    {rond("player-skip-forward", () => demarrer(Math.min(segs.length - 1, iRef.current + 1)), "Phrase suivante")}
    {rond("player-stop", stop, "Arrêter")}
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: K.t3, fontWeight: 700, marginBottom: 4 }}>
        <span>{etat === "lecture" ? "Lecture en cours" : "En pause"}</span><span>{i + 1} / {segs.length}</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: K.b0, overflow: "hidden" }}><div style={{ width: `${((i + 1) / segs.length) * 100}%`, height: "100%", background: K.em, transition: "width .3s" }} /></div>
      <div style={{ fontSize: 11.5, color: K.t2, marginTop: 5, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{segs[i]}</div>
    </div>
    <button onClick={changerVitesse} title="Vitesse de lecture" className="bt" style={{ padding: "6px 9px", borderRadius: 8, border: `1px solid ${K.b1}`, background: "transparent", color: K.t2, fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>{String(vitesse).replace(".", ",")}×</button>
  </div>;
}
