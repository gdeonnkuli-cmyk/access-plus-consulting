import { useEffect, useMemo, useRef, useState } from "react";
import ExerciceComptes from "./ExerciceComptes";
import LecteurAudio from "../audio/LecteurAudio";
import { texteFiche, texteSection } from "../audio/lecture";
import { CLES_CPT, niveau, resumeCpt } from "./syscohada/scores";
import { CLASSES_REV, REMARQUES, REPERES, CLOTURE, POINTS_CLES, chargerClasse, chargerTout, chargerPlan, subdivisions, chercherPlan, chercherTexte, decouper } from "./syscohada";

// ══════════════ GUIDE « CONTENU ET FONCTIONNEMENT DES COMPTES » — SYSCOHADA RÉVISÉ ══════════════
// Accueil (9 classes + recherche) → classe (présentation + comptes à deux chiffres) → fiche du compte
// (contenu, écritures types, fonctionnement, distinctions et exclusions, éléments de contrôle, subdivisions du plan
// révisé, commentaires, changements, correspondances). Vues transversales : repères débit/crédit, contrôles de clôture,
// correspondances 2000 → révisé, et l'exercice « Quel compte ? » (ExerciceComptes) bâti sur les écritures types.
// `fiche(c)` (facultatif) affiche sous la fiche la présentation aux états financiers fournie par l'atelier.

const mono = "'JetBrains Mono',monospace";
const carte = K => ({ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 12 });
const btn = (K, actif) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", minHeight: 32, whiteSpace: "nowrap", background: actif ? K.emBg : "transparent", color: actif ? K.em : K.t2, border: `1px solid ${actif ? K.emBd : K.b1}` });
const SECTIONS = [["contenu", "Contenu"], ["ecr", "Écritures types"], ["fonct", "Fonctionnement"], ["dist", "Distinctions"], ["ctrl", "Contrôle"], ["subdiv", "Subdivisions"], ["comm", "Commentaires"], ["chg", "Ce qui change"], ["corr", "Correspondances"], ["ef", "États financiers"]];
const SUBS_VISIBLES = 14;
const sansNumero = t => t.replace(/^\s*\d+\s*[—–).-]\s*/, "");
const sansPrefixe = t => { const r = t.replace(/^Ce qui change avec le SYSCOHADA révisé\s*:\s*/i, ""); return r.charAt(0).toUpperCase() + r.slice(1); };

export default function GuideComptes({ K, mob, fiche, onScore, scores }) {
  const [nav, sNav] = useState({ v: "accueil" }); // { v: accueil | classe | compte | annexe | reperes | cloture, k, c, sub }
  const [tousSubs, sTousSubs] = useState(false);
  const [plan, sPlan] = useState(null);
  const [classes, sClasses] = useState({});
  const [tout, sTout] = useState(false);
  const [q, sQ] = useState("");
  const haut = useRef(null);

  useEffect(() => { let vivant = true; chargerPlan().then(p => vivant && sPlan(p)); return () => { vivant = false; }; }, []);
  useEffect(() => { if (nav.k) chargerClasse(nav.k).then(C => sClasses(o => o[C.classe] ? o : { ...o, [C.classe]: C })); }, [nav.k]);
  const besoinTout = nav.v === "annexe" || nav.v === "exo" || (q.trim().length >= 3 && !/^\d+$/.test(q.trim()));
  useEffect(() => {
    if (!besoinTout || tout) return;
    chargerTout().then(L => { sClasses(Object.fromEntries(L.map(C => [C.classe, C]))); sTout(true); });
  }, [besoinTout, tout]);

  const aller = n => { sNav(n); sQ(""); sTousSubs(false); setTimeout(() => haut.current && haut.current.scrollIntoView({ block: "start", behavior: "smooth" }), 30); };
  const ouvrirCompte = num => { const c2 = String(num).slice(0, 2); aller({ v: "compte", k: +c2[0], c: c2, sub: num.length > 2 ? num : null }); };

  // Sous-compte demandé : défilement vers sa ligne une fois la fiche affichée
  useEffect(() => {
    if (nav.v !== "compte" || !nav.sub || !classes[nav.k]) return;
    const t = setTimeout(() => { const el = document.getElementById(`gc-sub-${nav.sub}`); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 250);
    return () => clearTimeout(t);
  }, [nav, classes]);

  const resPlan = useMemo(() => plan ? chercherPlan(plan.liste, q) : [], [plan, q]);
  const resTexte = useMemo(() => tout && q.trim().length >= 3 && !/^\d+$/.test(q.trim()) ? chercherTexte(Object.values(classes).sort((a, b) => a.classe - b.classe), q) : [], [tout, classes, q]);

  // Texte riche : **gras** et numéros de compte cliquables
  const riche = t => decouper(t, plan && plan.index).map((x, i) => x.gras ? <b key={i} style={{ color: K.t1 }}>{x.t}</b>
    : x.compte ? <button key={i} onClick={() => ouvrirCompte(x.compte)} title={plan.index.get(x.compte)} style={{ background: "none", border: "none", padding: 0, color: K.em, fontWeight: 700, cursor: "pointer", font: "inherit", textDecoration: "underline dotted", textUnderlineOffset: 2 }}>{x.t}</button>
    : <span key={i}>{x.t}</span>);
  const para = (t, i) => <p key={i} style={{ fontSize: 13, color: K.t2, lineHeight: 1.65, margin: "0 0 8px", textAlign: mob ? "left" : "justify" }}>{riche(t)}</p>;
  // Titre de section ; segs (facultatif) : bouton 🔊 pour écouter cette section seule
  const titreSec = (id, l, ico, segs) => <div id={`gc-${id}`} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11, fontWeight: 800, color: K.em, textTransform: "uppercase", letterSpacing: .5, margin: "18px 0 8px", scrollMarginTop: 70 }}><i className={`ti ti-${ico}`} style={{ fontSize: 14 }} />{l}
    {segs && segs.length > 0 && <span className="ef-noprint" style={{ marginLeft: "auto", display: "contents" }}><LecteurAudio K={K} segments={segs} titre={`Écouter : ${l}`} compact sx={{ marginLeft: "auto" }} /></span>}</div>;
  const puces = L => <ul style={{ margin: "0 0 4px 18px", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>{L.map((t, i) => <li key={i} style={{ fontSize: 13, color: K.t2, lineHeight: 1.6 }}>{riche(t)}</li>)}</ul>;
  const fil = items => <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", fontSize: 12, marginBottom: 10 }}>
    {items.map(([l, n], i) => <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {i > 0 && <i className="ti ti-chevron-right" style={{ fontSize: 12, color: K.t3 }} />}
      {n ? <button onClick={() => aller(n)} style={{ background: "none", border: "none", padding: 0, color: K.em, fontWeight: 700, cursor: "pointer", font: "inherit" }}>{l}</button> : <span style={{ color: K.t3, fontWeight: 600 }}>{l}</span>}
    </span>)}
  </div>;
  const titreDe = n => (plan && plan.index.get(n)) || (classes[n[0]] && (classes[n[0]].comptes.find(x => x.c === n) || {}).titre) || "";
  const lienCompte = n => <button onClick={() => ouvrirCompte(n)} title="Ouvrir la fiche" style={{ background: "none", border: "none", padding: 0, fontFamily: mono, fontSize: 12, fontWeight: 800, color: K.em, cursor: "pointer", minWidth: 40, textAlign: "left" }}>{n}</button>;
  // Écriture type : débits puis crédits décalés (présentation du journal)
  const ecriture = (e, j) => <div key={j} style={{ background: K.c2, border: `1px solid ${K.b0}`, borderRadius: 10, padding: "9px 12px" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}><span style={{ fontSize: 10.5, fontWeight: 800, color: K.t3, minWidth: 16 }}>{j + 1}.</span><span style={{ fontSize: 13, fontWeight: 700, color: K.t1, lineHeight: 1.35 }}>{e.op}</span></div>
    {e.l.map(([D, Cr], k) => <div key={k} style={{ borderTop: k ? `1px dashed ${K.b1}` : "none", paddingTop: k ? 5 : 0, marginTop: k ? 5 : 0 }}>
      {[...D.map(n => ["D", n]), ...Cr.map(n => ["C", n])].map(([s, n]) => <div key={s + n} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "2px 0", paddingLeft: s === "C" ? (mob ? 22 : 40) : 0 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: s === "D" ? K.em : K.wa, background: s === "D" ? K.emBg : K.waBg, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{s === "D" ? "Débit" : "Crédit"}</span>
        {lienCompte(n)}<span style={{ fontSize: 12, color: K.t2, lineHeight: 1.35 }}>{titreDe(n)}</span>
      </div>)}
    </div>)}
    {e.n && <div style={{ fontSize: 11.5, color: K.t3, fontStyle: "italic", lineHeight: 1.45, marginTop: 6 }}>{riche(e.n)}</div>}
  </div>;
  const attente = <div style={{ ...carte(K), padding: 24, textAlign: "center", color: K.t3, fontSize: 13 }}><i className="ti ti-loader-2" style={{ fontSize: 22, display: "block", marginBottom: 6 }} />Chargement du guide…</div>;

  // ── Barre de recherche + résultats
  const recherche = <div style={{ position: "relative", marginBottom: 12 }}>
    <i className="ti ti-search" style={{ position: "absolute", left: 11, top: 11, fontSize: 16, color: K.t3 }} />
    <input value={q} onChange={e => sQ(e.target.value)} placeholder="Numéro (ex. 4782, 601) ou mot-clé (ex. location-acquisition)" style={{ width: "100%", padding: "9px 34px", background: K.c2, border: `1px solid ${K.b0}`, borderRadius: 10, color: K.t1, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif", minHeight: 40 }} />
    {q && <button onClick={() => sQ("")} aria-label="Effacer" style={{ position: "absolute", right: 6, top: 6, background: "none", border: "none", color: K.t3, cursor: "pointer", padding: 4 }}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>}
  </div>;
  const resultats = <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={carte(K)}>
      <div style={{ fontSize: 10, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4, padding: "10px 12px 4px" }}>Plan de comptes révisé · {resPlan.length}{resPlan.length >= 40 ? "+" : ""} résultat{resPlan.length > 1 ? "s" : ""}</div>
      {!plan ? <div style={{ padding: 12, fontSize: 12, color: K.t3 }}>Chargement du plan…</div>
        : !resPlan.length ? <div style={{ padding: "4px 12px 12px", fontSize: 12, color: K.t3 }}>Aucun compte ne correspond.</div>
        : resPlan.map(([c, l]) => <button key={c} onClick={() => ouvrirCompte(c)} className="bt" style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "7px 12px", border: "none", borderTop: `1px solid ${K.b0}`, background: "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: K.em, minWidth: 46, paddingLeft: (c.length - 2) * 4 }}>{c}</span>
          <span style={{ fontSize: 12.5, color: K.t1, lineHeight: 1.35, fontWeight: c.length <= 2 ? 800 : c.length === 3 ? 600 : 400 }}>{l}</span>
        </button>)}
    </div>
    {q.trim().length >= 3 && !/^\d+$/.test(q.trim()) && <div style={carte(K)}>
      <div style={{ fontSize: 10, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4, padding: "10px 12px 4px" }}>Dans le texte du guide</div>
      {!tout ? <div style={{ padding: "4px 12px 12px", fontSize: 12, color: K.t3 }}>Recherche dans les 9 classes…</div>
        : !resTexte.length ? <div style={{ padding: "4px 12px 12px", fontSize: 12, color: K.t3 }}>Aucune mention trouvée.</div>
        : resTexte.map(r => <button key={r.c} onClick={() => ouvrirCompte(r.c)} className="bt" style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderTop: `1px solid ${K.b0}`, background: "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: K.t1 }}><span style={{ fontFamily: mono, color: K.em, marginRight: 6 }}>{r.c}</span>{r.titre}</div>
          <div style={{ fontSize: 11.5, color: K.t3, lineHeight: 1.45, marginTop: 2 }}>{r.extrait}</div>
        </button>)}
    </div>}
  </div>;

  // ── Vues
  const accueil = () => <>
    <button onClick={() => aller({ v: "exo", k: 0 })} className="bt" style={{ ...carte(K), display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", marginBottom: 12, textAlign: "left", cursor: "pointer", fontFamily: "'Outfit',sans-serif", border: `1px solid ${K.emBd}` }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-pencil-check" style={{ fontSize: 21 }} /></span>
      <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 800, color: K.t1 }}>S'exercer : Quel compte ?</span><span style={{ display: "block", fontSize: 12, color: K.t3, lineHeight: 1.4, marginTop: 2 }}>Séries de 10 opérations à comptabiliser, corrigées ligne par ligne · 270 écritures, par classe ou toutes classes</span></span>
      <i className="ti ti-chevron-right" style={{ color: K.t3, fontSize: 16 }} />
    </button>
    {(() => {
      const r = resumeCpt(scores || {});
      if (!Object.keys(r.parCle).length) return null;
      const teinte = pct => ({ bon: K.em, moyen: K.wa, faible: K.er, aucun: K.t3 }[niveau(pct)]);
      return <div style={{ ...carte(K), padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4 }}>Mes exercices — meilleurs scores</span>
          <span style={{ fontSize: 11.5, color: K.t3 }}>{r.nSeries} série{r.nSeries > 1 ? "s" : ""} · moyenne <b style={{ color: teinte(r.moyenne) }}>{r.moyenne} %</b></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(5,1fr)" : "repeat(10,1fr)", gap: 6 }}>
          {CLES_CPT.map(c => { const x = r.parCle[c], n = c === "CPT-T" ? 0 : +c.slice(4); return <button key={c} onClick={() => aller({ v: "exo", k: n })} className="bt" title={x ? `${x.n || 1} série${(x.n || 1) > 1 ? "s" : ""}${x.derniere ? ` · dernière : ${x.derniere.pct} %` : ""}` : "Pas encore de série"} style={{ border: `1px solid ${x ? teinte(x.pct) + "55" : K.b0}`, background: x ? teinte(x.pct) + "12" : "transparent", borderRadius: 9, padding: "6px 2px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "center" }}>
            <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: K.t3 }}>{n ? `Cl. ${n}` : "Toutes"}</span>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: x ? teinte(x.pct) : K.t3 }}>{x ? `${x.pct}%` : "—"}</span>
          </button>; })}
        </div>
      </div>;
    })()}
    <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 12, background: `linear-gradient(135deg,${K.emBg},transparent)` }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 18 : 21, color: K.t1 }}>Contenu et fonctionnement des comptes</div>
      <div style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.6, marginTop: 6 }}>Chapitre 2 du plan comptable, mis à jour selon le <b>SYSCOHADA révisé</b> (AUDCIF du 26 janvier 2017, applicable depuis le 1er janvier 2018). Pour chaque compte à deux chiffres : contenu, écritures types, fonctionnement au débit et au crédit, distinctions et exclusions, éléments de contrôle, subdivisions du plan révisé, commentaires et ce qui change par rapport au plan de 2000.</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 8 }}>
      {CLASSES_REV.map(([k, l]) => <button key={k} onClick={() => aller({ v: "classe", k })} className="bt" style={{ ...carte(K), display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textAlign: "left", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: K.emBg, color: K.em, display: "grid", placeItems: "center", fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 19, flexShrink: 0 }}>{k}</span>
        <span><span style={{ display: "block", fontSize: 10, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4 }}>Classe {k}</span><span style={{ display: "block", fontSize: 13, fontWeight: 700, color: K.t1, lineHeight: 1.3 }}>{l}</span></span>
      </button>)}
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
      <button onClick={() => aller({ v: "reperes" })} className="bt" style={btn(K)}><i className="ti ti-scale" style={{ fontSize: 13 }} />Repères débit / crédit</button>
      <button onClick={() => aller({ v: "cloture" })} className="bt" style={btn(K)}><i className="ti ti-checklist" style={{ fontSize: 13 }} />Contrôles de clôture</button>
      <button onClick={() => aller({ v: "annexe" })} className="bt" style={btn(K)}><i className="ti ti-arrows-exchange" style={{ fontSize: 13 }} />Correspondances plan 2000 → plan révisé</button>
    </div>
    <details style={{ ...carte(K), padding: "10px 13px" }}>
      <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 12.5, color: K.t1 }}>Sources et avertissement</summary>
      <div style={{ fontSize: 12, color: K.t2, lineHeight: 1.6, marginTop: 8 }}>Les subdivisions reprennent la liste des comptes du plan révisé (1 330 comptes en 9 classes) ; chaque numéro cité dans le texte a été contrôlé par rapport à cette liste. Ce guide est un support de formation : il ne remplace pas les textes officiels de l'OHADA (AUDCIF, plan comptable général, guide d'application). En RDC, les règles du Code des impôts s'ajoutent aux règles comptables. Les écritures types sont des schémas pédagogiques, à adapter aux pièces, à la forme juridique et aux obligations fiscales de l'entité. Les entités à but non lucratif relèvent en principe, depuis le 1er janvier 2024, du SYCEBNL.</div>
      <ul style={{ margin: "8px 0 2px 18px", display: "flex", flexDirection: "column", gap: 4 }}>{REMARQUES.map((t, i) => <li key={i} style={{ fontSize: 12, color: K.t2, lineHeight: 1.5 }}>{riche(t)}</li>)}</ul>
    </details>
  </>;

  const vueClasse = () => {
    const C = classes[nav.k];
    if (!C) return attente;
    return <>
      {fil([["Classes", { v: "accueil" }], [`Classe ${C.classe}`]])}
      <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 18 : 20, color: K.t1, marginBottom: 8 }}>Classe {C.classe} — {C.titre}</div>
        {(C.intro || []).map(para)}
        <button onClick={() => aller({ v: "exo", k: C.classe })} className="bt" style={{ ...btn(K, true), marginTop: 4 }}><i className="ti ti-pencil-check" style={{ fontSize: 13 }} />S'exercer sur la classe {C.classe}</button>
      </div>
      <div style={carte(K)}>
        {C.comptes.map(x => <button key={x.c} onClick={() => aller({ v: "compte", k: nav.k, c: x.c })} className="bt" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: `1px solid ${K.b0}`, background: "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 14, color: K.em, minWidth: 26 }}>{x.c}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: K.t1, lineHeight: 1.35 }}>{x.titre}</span>
          {!!(x.changements || []).length && <span title="Évolutions avec le SYSCOHADA révisé" style={{ fontSize: 10, fontWeight: 800, color: K.wa, background: K.waBg, border: `1px solid ${K.waBd}`, borderRadius: 99, padding: "2px 7px", whiteSpace: "nowrap" }}>révisé</span>}
          <i className="ti ti-chevron-right" style={{ color: K.t3, fontSize: 15 }} />
        </button>)}
      </div>
    </>;
  };

  const vueCompte = () => {
    const C = classes[nav.k];
    if (!C) return attente;
    const i = C.comptes.findIndex(x => x.c === nav.c), x = C.comptes[i];
    if (!x) return <>{fil([["Classes", { v: "accueil" }], [`Classe ${C.classe}`, { v: "classe", k: nav.k }]])}<div style={{ ...carte(K), padding: 16, fontSize: 13, color: K.t2 }}>Le compte {nav.c} n'a pas de fiche dans ce guide{plan && plan.index.get(nav.c) ? ` (${plan.index.get(nav.c)})` : ""}. Consultez la présentation de la classe {C.classe}.</div></>;
    const prec = C.comptes[i - 1], suiv = C.comptes[i + 1];
    const subs = plan ? subdivisions(plan.liste, x.c) : [];
    const fo = x.fonctionnement || {};
    const extra = fiche ? fiche(x.c) : null;
    const presentes = { contenu: (x.contenu || []).length, ecr: (x.ecr || []).length, fonct: (fo.credit || []).length + (fo.debit || []).length, dist: (x.dist ? 1 : 0) + (x.exclusions || []).length, ctrl: x.ctrl ? 1 : 0, subdiv: subs.length, comm: (x.commentaires || []).length, chg: (x.changements || []).length, corr: (x.correspondance || []).length, ef: !!extra };
    const voirSubs = tousSubs || subs.length <= SUBS_VISIBLES + 4 || (nav.sub && subs.findIndex(([c]) => c === nav.sub) >= SUBS_VISIBLES);
    const sens = (cle, l, ico) => (fo[cle] || []).length ? <div style={{ background: K.c2, border: `1px solid ${K.b0}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 12.5, color: K.t1, marginBottom: 6 }}><i className={`ti ti-${ico}`} style={{ color: K.em }} />{l}</div>{puces(fo[cle])}</div> : null;
    return <>
      {fil([["Classes", { v: "accueil" }], [`Classe ${C.classe}`, { v: "classe", k: nav.k }], [`Compte ${x.c}`]])}
      <div style={{ ...carte(K), padding: mob ? "14px 14px" : "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontFamily: mono, fontWeight: 800, fontSize: 22, color: K.em, lineHeight: 1.1 }}>{x.c}</span>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 17 : 20, color: K.t1, lineHeight: 1.25 }}>{x.titre}</div>
        </div>
        <div className="ef-noprint" style={{ marginTop: 12 }}><LecteurAudio K={K} segments={texteFiche(x, titreDe)} titre="Écouter la fiche" /></div>
        <div className="ef-noprint" style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "12px 0 2px" }}>
          {SECTIONS.filter(([id]) => presentes[id]).map(([id, l]) => <button key={id} onClick={() => { const el = document.getElementById(`gc-${id}`); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }} style={{ ...btn(K), minHeight: 28, padding: "4px 9px", fontSize: 10.5 }}>{l}</button>)}
        </div>

        {presentes.contenu > 0 && <>{titreSec("contenu", "Contenu", "file-text", texteSection(x, "contenu", titreDe))}{x.contenu.map(para)}</>}

        {presentes.ecr > 0 && <>{titreSec("ecr", "Écritures types", "notebook", texteSection(x, "ecr", titreDe))}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8, alignItems: "start" }}>{x.ecr.map(ecriture)}</div></>}

        {presentes.fonct > 0 && <>{titreSec("fonct", "Fonctionnement", "arrows-left-right", texteSection(x, "fonct", titreDe))}
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>{sens("credit", "Le compte est crédité", "arrow-bar-to-right")}{sens("debit", "Le compte est débité", "arrow-bar-to-left")}</div></>}

        {presentes.dist > 0 && <>{titreSec("dist", "Distinctions et exclusions", "ban", texteSection(x, "dist", titreDe))}{x.dist && para(x.dist, "d")}{(x.exclusions || []).length > 0 && puces(x.exclusions)}</>}

        {presentes.ctrl > 0 && <>{titreSec("ctrl", "Éléments de contrôle", "shield-check", texteSection(x, "ctrl", titreDe))}
          <div style={{ background: K.emBg, border: `1px solid ${K.emBd}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, color: K.t2, lineHeight: 1.6 }}><b style={{ color: K.t1 }}>Pièces et rapprochements à réunir : </b>{riche(x.ctrl)}</div></>}

        {presentes.subdiv > 0 && <>{titreSec("subdiv", `Subdivisions du plan révisé · ${subs.length}`, "list-tree")}
          <div style={{ border: `1px solid ${K.b0}`, borderRadius: 10, overflow: "hidden" }}>
            {(voirSubs ? subs : subs.slice(0, SUBS_VISIBLES)).map(([c, l]) => { const n3 = c.length === 3, vise = nav.sub && c === nav.sub; return <div key={c} id={`gc-sub-${c}`} style={{ display: "flex", gap: 10, padding: "6px 10px", borderTop: `1px solid ${K.b0}`, background: vise ? K.waBg : n3 ? K.c2 : "transparent", outline: vise ? `2px solid ${K.waBd}` : "none", outlineOffset: -2 }}>
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: n3 ? 800 : 600, color: n3 ? K.em : K.t2, minWidth: 48, paddingLeft: n3 ? 0 : 10 }}>{c}</span>
              <span style={{ fontSize: 12.5, color: K.t1, fontWeight: n3 ? 700 : 400, lineHeight: 1.4 }}>{l}</span>
            </div>; })}
          </div>
          {!voirSubs && <button onClick={() => sTousSubs(true)} className="bt" style={{ ...btn(K), marginTop: 8 }}><i className="ti ti-chevron-down" style={{ fontSize: 13 }} />Voir les {subs.length} subdivisions</button>}</>}

        {presentes.comm > 0 && <>{titreSec("comm", "Commentaires", "message-2", texteSection(x, "comm", titreDe))}
          <ol style={{ margin: "0 0 4px 20px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>{x.commentaires.map((t, j) => <li key={j} style={{ fontSize: 13, color: K.t2, lineHeight: 1.65, paddingLeft: 2 }}>{riche(sansNumero(t))}</li>)}</ol></>}

        {presentes.chg > 0 && <div id="gc-chg" style={{ marginTop: 18, background: K.waBg, borderLeft: `4px solid ${K.wa}`, borderRadius: "0 10px 10px 0", padding: "10px 14px", scrollMarginTop: 70 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontWeight: 800, fontSize: 13, color: K.wa, marginBottom: 6 }}><i className="ti ti-sparkles" />Ce qui change avec le SYSCOHADA révisé<span className="ef-noprint" style={{ display: "contents" }}><LecteurAudio K={K} segments={texteSection(x, "chg", titreDe)} titre="Écouter : Ce qui change" compact sx={{ marginLeft: "auto" }} /></span></div>
          {puces(x.changements.map(sansPrefixe))}
        </div>}

        {presentes.corr > 0 && <>{titreSec("corr", "Correspondances avec le plan de 2000", "arrows-exchange")}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{x.correspondance.map((r, j) => <div key={j} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "150px 1fr", gap: 8, background: K.c2, borderRadius: 8, padding: "8px 10px" }}>
            <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: K.t1 }}>{r.ancien || "—"} <i className="ti ti-arrow-right" style={{ color: K.t3, fontSize: 12 }} /> {r.nouveau ? riche(String(r.nouveau)) : "—"}</span>
            <span style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.5 }}>{riche(r.note || "")}</span>
          </div>)}</div></>}

        {extra && <>{titreSec("ef", "Présentation aux états financiers", "report-money")}<div style={{ background: K.c2, borderRadius: 10, padding: "6px 12px" }}>{extra}</div></>}
      </div>
      <div className="ef-noprint" style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
        {prec ? <button onClick={() => aller({ v: "compte", k: nav.k, c: prec.c })} className="bt" style={btn(K)}><i className="ti ti-chevron-left" style={{ fontSize: 13 }} />{prec.c}{mob ? "" : ` — ${prec.titre.slice(0, 32)}${prec.titre.length > 32 ? "…" : ""}`}</button> : <span />}
        {suiv ? <button onClick={() => aller({ v: "compte", k: nav.k, c: suiv.c })} className="bt" style={btn(K)}>{suiv.c}{mob ? "" : ` — ${suiv.titre.slice(0, 32)}${suiv.titre.length > 32 ? "…" : ""}`}<i className="ti ti-chevron-right" style={{ fontSize: 13 }} /></button>
          : nav.k < 9 ? <button onClick={() => aller({ v: "classe", k: nav.k + 1 })} className="bt" style={btn(K)}>Classe {nav.k + 1}<i className="ti ti-chevron-right" style={{ fontSize: 13 }} /></button> : <span />}
      </div>
    </>;
  };

  const vueReperes = () => <>
    {fil([["Classes", { v: "accueil" }], ["Repères débit / crédit"]])}
    <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 17 : 20, color: K.t1 }}>Repères débit / crédit</div>
      <div style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.6, marginTop: 6 }}>Sens habituel des mouvements selon la nature du compte. La fiche de chaque compte précise les exceptions.</div>
    </div>
    <div style={carte(K)}>
      {REPERES.map((r, j) => <div key={j} style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1.4fr .7fr .7fr 1.6fr", gap: mob ? "4px 10px" : 12, padding: "10px 14px", borderTop: j ? `1px solid ${K.b0}` : "none", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: K.t1, gridColumn: mob ? "1 / -1" : "auto", lineHeight: 1.35 }}>{riche(r.n)}</span>
        <span style={{ fontSize: 12 }}><span style={{ display: "block", fontSize: 9.5, fontWeight: 800, color: K.t3, textTransform: "uppercase" }}>Augmente</span><b style={{ color: K.em }}>{r.plus}</b></span>
        <span style={{ fontSize: 12 }}><span style={{ display: "block", fontSize: 9.5, fontWeight: 800, color: K.t3, textTransform: "uppercase" }}>Diminue</span><b style={{ color: K.wa }}>{r.moins}</b></span>
        <span style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.5, gridColumn: mob ? "1 / -1" : "auto" }}>{riche(r.r)}</span>
      </div>)}
    </div>
  </>;

  const vueCloture = () => <>
    {fil([["Classes", { v: "accueil" }], ["Contrôles de clôture"]])}
    <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 17 : 20, color: K.t1 }}>Synthèse des contrôles de clôture</div>
      <div style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.6, marginTop: 6 }}>Les travaux à mener avant d'arrêter la balance et d'établir les états financiers. Chaque fiche de compte détaille les pièces justificatives correspondantes.</div>
    </div>
    <div style={carte(K)}>
      {CLOTURE.map((t, j) => <div key={j} style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: j ? `1px solid ${K.b0}` : "none" }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: K.emBg, color: K.em, fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{j + 1}</span>
        <span style={{ fontSize: 13, color: K.t2, lineHeight: 1.55 }}>{riche(t)}</span>
      </div>)}
    </div>
  </>;

  const vueExo = () => !tout ? attente : <>
    {fil([["Classes", { v: "accueil" }], ["Exercice « Quel compte ? »"]])}
    <ExerciceComptes key={nav.k} K={K} mob={mob} classes={Object.values(classes).sort((a, b) => a.classe - b.classe)} k0={nav.k || 0} titreDe={titreDe} ecriture={ecriture} onFiche={c => ouvrirCompte(c)} onScore={onScore} scores={scores || {}} />
  </>;

  const vueAnnexe = () => {
    if (!tout) return attente;
    const L = Object.values(classes).sort((a, b) => a.classe - b.classe).flatMap(C => C.comptes.flatMap(x => (x.correspondance || []).map(r => ({ ...r, k: C.classe, c: x.c }))));
    return <>
      {fil([["Classes", { v: "accueil" }], ["Correspondances"]])}
      <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 17 : 20, color: K.t1 }}>Correspondances plan 2000 → plan révisé</div>
        <ul style={{ margin: "8px 0 8px 18px", display: "flex", flexDirection: "column", gap: 5 }}>{POINTS_CLES.map((t, j) => <li key={j} style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.55 }}>{riche(t)}</li>)}</ul>
        <div style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.6, marginTop: 6 }}>{L.length} comptes du SYSCOHADA de 2000 dont le numéro, l'intitulé ou le traitement change, relevés au fil des fiches. Cliquez sur un numéro pour ouvrir le compte.</div>
      </div>
      <div style={carte(K)}>
        {L.map((r, j) => <div key={j} style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "60px 170px 1fr", gap: mob ? 3 : 10, padding: "8px 12px", borderTop: j ? `1px solid ${K.b0}` : "none", alignItems: "baseline" }}>
          <button onClick={() => aller({ v: "compte", k: r.k, c: r.c })} style={{ background: "none", border: "none", padding: 0, textAlign: "left", fontSize: 10.5, fontWeight: 800, color: K.t3, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textTransform: "uppercase" }}>Cpte {r.c}</button>
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 800, color: K.t1 }}>{r.ancien || "—"} <i className="ti ti-arrow-right" style={{ color: K.t3, fontSize: 12 }} /> {r.nouveau ? riche(String(r.nouveau)) : "—"}</span>
          <span style={{ fontSize: 12.5, color: K.t2, lineHeight: 1.5 }}>{riche(r.note || "")}</span>
        </div>)}
      </div>
    </>;
  };

  return <div ref={haut} style={{ scrollMarginTop: 70 }}>
    {recherche}
    {q.trim() ? resultats : nav.v === "classe" ? vueClasse() : nav.v === "compte" ? vueCompte() : nav.v === "annexe" ? vueAnnexe() : nav.v === "exo" ? vueExo() : nav.v === "reperes" ? vueReperes() : nav.v === "cloture" ? vueCloture() : accueil()}
  </div>;
}
