import { useEffect, useMemo, useState } from "react";
import LecteurAudio from "./LecteurAudio";
import { dureeMinutes, texteFiche, texteModuleCours, texteModuleFiscal } from "./lecture";
import { MODULES_FISC } from "../fiscal/modules";
import { CLASSES_REV, chargerPlan, chargerTout } from "../ef/syscohada";

// ══════════════ ÉCOUTER LES COURS ══════════════
// Page audio de l'accueil : leçons du Code des impôts, fiches du guide des comptes et modules de cours,
// lues par la voix de synthèse, avec enchaînement automatique sur le contenu suivant de la même liste.
// Accès : leçons fiscales « libres » ou abonnés ; fiches du guide réservées aux abonnés ; modules ouverts
// (l'exercice n'est lu qu'aux abonnés).

const carte = K => ({ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 14 });
const puce = (K, actif) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap",
  background: actif ? `linear-gradient(135deg,${K.emD},${K.em})` : "transparent", color: actif ? "#fff" : K.t2, border: actif ? "none" : `1px solid ${K.b1}` });

export default function EcouterCours({ K, mob, mods = [], ok, onSub }) {
  const [onglet, sOnglet] = useState("fisc");
  const [guide, sGuide] = useState(null);
  const [classe, sClasse] = useState(4);
  const [sel, sSel] = useState(null); // { cle, titre, segs, liste }
  const [enchainer, sEnchainer] = useState(true);

  useEffect(() => {
    if (onglet !== "guide" || guide) return;
    Promise.all([chargerTout(), chargerPlan()]).then(([L, plan]) => {
      const titres = new Map(L.flatMap(C => C.comptes.map(x => [x.c, x.titre])));
      sGuide({ classes: L, titreDe: n => plan.index.get(n) || titres.get(n) || "" });
    });
  }, [onglet, guide]);

  const listes = useMemo(() => ({
    fisc: MODULES_FISC.map(m => ({ cle: `F-${m.id}`, titre: `${m.id} · ${m.titre}`, sous: m.court, libre: ok || m.libre, segs: texteModuleFiscal(m) })),
    mod: mods.filter(m => m.on !== false).map(m => ({ cle: `M-${m.id}`, titre: m.titre, sous: m.mat || m.code || "", libre: true, segs: texteModuleCours(m, ok) })),
    guide: guide ? guide.classes.filter(C => C.classe === classe).flatMap(C => C.comptes.map(x => ({ cle: `C-${x.c}`, titre: `${x.c} — ${x.titre}`, sous: `Classe ${C.classe}`, libre: ok, segs: texteFiche(x, guide.titreDe) }))) : [],
  }), [mods, ok, guide, classe]);
  const liste = listes[onglet];

  const jouer = (it, L) => { if (!it.libre) { if (onSub) onSub(); return; } sSel({ cle: it.cle, titre: it.titre, segs: it.segs, liste: L }); };
  const suivant = () => {
    if (!sel || !enchainer) return;
    const L = sel.liste || [], i = L.findIndex(x => x.cle === sel.cle);
    const n = L.slice(i + 1).find(x => x.libre);
    if (n) sSel({ cle: n.cle, titre: n.titre, segs: n.segs, liste: L });
  };

  return <div style={{ maxWidth: 760, margin: "0 auto", animation: "fadeIn .3s ease" }}>
    <div style={{ background: `linear-gradient(135deg,${K.emD},${K.em})`, borderRadius: 18, padding: mob ? "18px 16px" : "22px 24px", color: "#fff", marginBottom: 14, position: "relative", overflow: "hidden" }}>
      <i className="ti ti-headphones" style={{ position: "absolute", right: -8, bottom: -18, fontSize: 120, opacity: .12 }} />
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, opacity: .85, textTransform: "uppercase" }}>Audio</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 22 : 27, lineHeight: 1.2, margin: "4px 0 6px" }}>Écouter les cours</div>
      <div style={{ fontSize: 14, opacity: .9, lineHeight: 1.5, maxWidth: 520 }}>Choisissez une leçon ou une fiche : la lecture démarre et enchaîne sur la suivante. Pause, retour et vitesse à tout moment.</div>
    </div>

    {sel && <div style={{ ...carte(K), padding: "12px 14px", marginBottom: 12, borderColor: K.emBd, position: "sticky", top: 8, zIndex: 5, boxShadow: K.sh }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.5, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4 }}>En écoute</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: K.t1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.titre}</div></div>
        <button onClick={() => sSel(null)} aria-label="Fermer" className="bt" style={{ background: "none", border: "none", color: K.t3, cursor: "pointer", padding: 4 }}><i className="ti ti-x" style={{ fontSize: 18 }} /></button>
      </div>
      <LecteurAudio key={sel.cle} K={K} segments={sel.segs} titre="Écouter" autoStart onFin={suivant} />
      <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: K.t2, marginTop: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={enchainer} onChange={e => sEnchainer(e.target.checked)} />Enchaîner automatiquement sur le contenu suivant
      </label>
    </div>}

    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {[["fisc", "receipt-tax", `Code des impôts (${MODULES_FISC.length})`], ["guide", "books", "Guide des comptes"], ["mod", "book-2", `Modules (${listes.mod.length})`]].map(([k, ico, l]) => <button key={k} onClick={() => sOnglet(k)} className="bt" style={puce(K, onglet === k)}><i className={`ti ti-${ico}`} style={{ fontSize: 14 }} />{l}</button>)}
    </div>
    {onglet === "guide" && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
      {CLASSES_REV.map(([k]) => <button key={k} onClick={() => sClasse(k)} className="bt" style={{ ...puce(K, classe === k), padding: "5px 10px", fontSize: 11.5 }}>Classe {k}</button>)}
    </div>}
    {onglet === "guide" && !ok && <div style={{ background: K.waBg, border: `1px solid ${K.waBd}`, borderRadius: 12, padding: "9px 12px", fontSize: 12.5, color: K.t1, marginBottom: 10 }}><i className="ti ti-lock" style={{ color: K.wa }} /> Les fiches du guide des comptes sont réservées aux abonnés.</div>}

    {onglet === "guide" && !guide ? <div style={{ ...carte(K), padding: 22, textAlign: "center", color: K.t3, fontSize: 13 }}>Chargement des fiches…</div>
      : <div style={carte(K)}>
        {!liste.length && <div style={{ padding: 16, fontSize: 13, color: K.t3 }}>Aucun contenu.</div>}
        {liste.map((it, j) => { const actif = sel && sel.cle === it.cle; return <button key={it.cle} onClick={() => jouer(it, liste)} className="bt" style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "10px 13px", border: "none", borderTop: j ? `1px solid ${K.b0}` : "none", background: actif ? K.emBg : "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ width: 34, height: 34, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", background: it.libre ? (actif ? `linear-gradient(135deg,${K.emD},${K.em})` : K.emBg) : K.c2, color: it.libre ? (actif ? "#fff" : K.em) : K.t3 }}>
            <i className={`ti ti-${!it.libre ? "lock" : actif ? "volume" : "player-play"}`} style={{ fontSize: 15 }} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: K.t1, lineHeight: 1.35 }}>{it.titre}</span>
            <span style={{ display: "block", fontSize: 11.5, color: K.t3 }}>{it.sous ? `${it.sous} · ` : ""}≈ {dureeMinutes(it.segs)} min{!it.libre ? " · abonnés" : ""}</span>
          </span>
        </button>; })}
      </div>}
    <div style={{ fontSize: 11.5, color: K.t3, marginTop: 10, lineHeight: 1.5 }}>Astuce : pour une voix plus naturelle, installez la voix française de votre téléphone (Paramètres → Synthèse vocale → Google → Français). Gardez l'écran allumé pendant l'écoute.</div>
  </div>;
}
