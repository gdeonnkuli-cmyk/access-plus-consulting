import { useMemo, useState } from "react";
import { CLES_CPT, moyenne, niveau, resumeCpt } from "./syscohada/scores";

// ══════════════ SUIVI ADMIN — EXERCICES DU GUIDE DES COMPTES ══════════════
// Tableau apprenants × champs (« Quel compte ? » toutes classes et classes 1 à 9, monographie ZAO) :
// meilleur score par champ, nombre de séries, moyenne par classe et classe la moins maîtrisée.

const mono = "'JetBrains Mono',monospace";
const COLS = [...CLES_CPT.map(c => [c, c === "CPT-T" ? "Toutes" : `Cl. ${c.slice(4)}`]), ["JRN-ZAO", "ZAO"]];

export default function SuiviExercices({ K, mob, users }) {
  const [tri, sTri] = useState("moyenne");
  const teinte = pct => ({ bon: K.em, moyen: K.wa, faible: K.er, aucun: K.t3 }[niveau(pct)]);
  const lignes = useMemo(() => users.map(u => ({ u, r: resumeCpt(u.scores || {}), zao: (u.scores || {})["JRN-ZAO"] }))
    .filter(x => Object.keys(x.r.parCle).length || x.zao), [users]);
  const valeur = (x, c) => (c === "JRN-ZAO" ? x.zao : x.r.parCle[c]);
  const tries = [...lignes].sort((a, b) => tri === "nom" ? String(a.u.nom || "").localeCompare(String(b.u.nom || "")) : (a.r.moyenne ?? -1) - (b.r.moyenne ?? -1));
  const parCol = COLS.map(([c]) => { const L = lignes.map(x => valeur(x, c)).filter(v => v && v.pct != null).map(v => v.pct); return { c, n: L.length, moy: moyenne(L) }; });
  const classes = parCol.filter(p => /^CPT-\d$/.test(p.c) && p.n);
  const faible = classes.length ? classes.reduce((a, b) => (b.moy < a.moy ? b : a)) : null;
  const cell = { padding: "7px 6px", fontSize: 12, textAlign: "center", borderBottom: `1px solid ${K.b0}`, whiteSpace: "nowrap" };

  return <div style={{ marginTop: 18 }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, color: K.t1 }}>Exercices du guide des comptes</div>
        <div style={{ fontSize: 12.5, color: K.t3, marginTop: 2 }}>Meilleur score par apprenant à l'exercice « Quel compte ? » et à la monographie ZAO. Ces scores ne comptent pas dans la moyenne des QCM.</div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {[["moyenne", "Plus faibles d'abord"], ["nom", "Par nom"]].map(([v, l]) => <button key={v} onClick={() => sTri(v)} className="bt" style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: tri === v ? K.emBg : "transparent", color: tri === v ? K.em : K.t2, border: `1px solid ${tri === v ? K.emBd : K.b1}` }}>{l}</button>)}
      </div>
    </div>
    {!lignes.length ? <div style={{ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 16, padding: 28, textAlign: "center", color: K.t3, fontSize: 13 }}>Aucun apprenant n'a encore terminé de série.</div> : <>
      {faible && <div style={{ background: K.waBg, border: `1px solid ${K.waBd}`, borderRadius: 12, padding: "9px 13px", marginBottom: 10, fontSize: 13, color: K.t1, display: "flex", gap: 8, alignItems: "center" }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 17, color: K.wa }} />Classe la moins maîtrisée : <b>classe {faible.c.slice(4)}</b> — moyenne {faible.moy} % sur {faible.n} apprenant{faible.n > 1 ? "s" : ""}.
      </div>}
      <div style={{ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
            <thead><tr style={{ background: K.c2 }}>
              <th style={{ ...cell, textAlign: "left", fontSize: 10.5, color: K.t3, position: "sticky", left: 0, background: K.c2, minWidth: mob ? 120 : 170 }}>APPRENANT</th>
              {COLS.map(([c, l]) => <th key={c} style={{ ...cell, fontSize: 10.5, color: K.t3, fontWeight: 800 }}>{l}</th>)}
              <th title="Moyenne des meilleurs scores « Quel compte ? » (hors ZAO)" style={{ ...cell, fontSize: 10.5, color: K.t3 }}>MOY. QUEL<br />COMPTE ?</th><th style={{ ...cell, fontSize: 10.5, color: K.t3 }}>SÉRIES</th>
            </tr></thead>
            <tbody>
              {tries.map(({ u, r, zao }) => <tr key={u.uid || u.mail}>
                <td style={{ ...cell, textAlign: "left", position: "sticky", left: 0, background: K.card }}>
                  <div style={{ fontWeight: 700, color: K.t1, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", maxWidth: mob ? 120 : 200 }}>{u.nom || "—"}</div>
                  <div style={{ fontSize: 10.5, color: K.t3, fontFamily: mono, overflow: "hidden", textOverflow: "ellipsis", maxWidth: mob ? 120 : 200 }}>{u.mail}</div>
                </td>
                {COLS.map(([c]) => { const v = c === "JRN-ZAO" ? zao : r.parCle[c]; return <td key={c} title={v ? `${v.n || 1} série${(v.n || 1) > 1 ? "s" : ""}${v.derniere ? ` · dernière ${v.derniere.pct} %` : ""}${v.date ? ` · ${new Date(v.date).toLocaleDateString("fr-FR")}` : ""}` : ""} style={{ ...cell, fontWeight: 800, fontFamily: mono, color: v ? teinte(v.pct) : K.t3, background: v ? teinte(v.pct) + "12" : "transparent" }}>{v ? `${v.pct}` : "·"}</td>; })}
                <td style={{ ...cell, fontWeight: 800, fontFamily: mono, color: teinte(r.moyenne) }}>{r.moyenne != null ? `${r.moyenne} %` : "—"}</td>
                <td style={{ ...cell, fontFamily: mono, color: K.t2 }}>{r.nSeries || "—"}</td>
              </tr>)}
              <tr style={{ background: K.c2 }}>
                <td style={{ ...cell, textAlign: "left", fontWeight: 800, color: K.t1, position: "sticky", left: 0, background: K.c2 }}>Moyenne · apprenants</td>
                {parCol.map(p => <td key={p.c} style={{ ...cell, fontFamily: mono, fontWeight: 800, color: teinte(p.moy) }}>{p.n ? <>{p.moy}<span style={{ display: "block", fontSize: 10, fontWeight: 600, color: K.t3 }}>{p.n}</span></> : "·"}</td>)}
                <td style={cell} /><td style={cell} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: K.t3, marginTop: 6 }}>Scores en % (meilleure série). Survolez une case pour voir le nombre de séries et la dernière.{" "}
        {[["bon", "≥ 80 %"], ["moyen", "50 à 79 %"], ["faible", "< 50 %"]].map(([n, l]) => <span key={n} style={{ marginLeft: 8, whiteSpace: "nowrap" }}><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: { bon: K.em, moyen: K.wa, faible: K.er }[n], marginRight: 4 }} />{l}</span>)}</div>
    </>}
  </div>;
}
