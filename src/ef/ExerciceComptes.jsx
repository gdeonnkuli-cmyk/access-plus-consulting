import { useMemo, useState } from "react";
import { CLASSES_REV } from "./syscohada";
import { NB_QUESTIONS, corriger, enonce, reservoir, tirer } from "./syscohada/exercice";
import { cleCpt, niveau } from "./syscohada/scores";

// ══════════════ EXERCICE « QUEL COMPTE ? » ══════════════
// Série de 10 écritures tirées des écritures types d'une classe (ou de toutes) : l'apprenant saisit comptes et sens,
// la correction est donnée ligne par ligne, avec l'écriture type et le lien vers la fiche du compte.
// Le meilleur score de chaque champ (users.scores["CPT-…"], reçu dans `scores`) est rappelé sur le choix de la classe et au bilan.
// Rendu par fonctions (et non par sous-composants) pour que les champs de saisie gardent le focus.

const mono = "'JetBrains Mono',monospace";
const carte = K => ({ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 12 });
const btn = (K, v) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", minHeight: 38, whiteSpace: "nowrap",
  ...(v === "p" ? { background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", border: "none" } : { background: "transparent", color: K.t2, border: `1px solid ${K.b1}` }) });
const ETATS = {
  ok: ["circle-check", "ok", "Correct"],
  proche: ["circle-check", "ok", "Accepté — subdivision attendue :"],
  sens: ["arrows-exchange", "wa", "Bon compte, mauvais sens"],
  vague: ["zoom-question", "wa", "Trop général — précisez au moins 3 chiffres"],
  faux: ["circle-x", "er", "Compte inattendu"],
};
const vide = () => [{ c: "", s: "D" }, { c: "", s: "C" }];

export default function ExerciceComptes({ K, mob, classes, k0 = 0, titreDe, ecriture, onFiche, onScore, scores = {} }) {
  const [k, sK] = useState(k0);
  const [serie, sSerie] = useState(null);
  const [i, sI] = useState(0);
  const [saisie, sSaisie] = useState(vide);
  const [res, sRes] = useState(null);
  const [bilan, sBilan] = useState([]);
  const [indice, sIndice] = useState(false);
  const [enreg, sEnreg] = useState(null); // null | "encours" | "ok" | "erreur"
  const pool = useMemo(() => reservoir(classes, k), [classes, k]);

  const demarrer = (kk = k) => { sK(kk); sSerie(tirer(reservoir(classes, kk))); sI(0); sSaisie(vide()); sRes(null); sBilan([]); sIndice(false); sEnreg(null); };
  const q = serie && serie[i];
  const majLigne = (j, champ, v) => sSaisie(L => L.map((l, x) => x === j ? { ...l, [champ]: v } : l));
  const valider = abandon => {
    const r = corriger(q.e, abandon ? [] : saisie);
    sRes({ ...r, abandon });
    const b = [...bilan, { id: q.id, c: q.c, ok: r.ok }];
    sBilan(b);
    if (b.length === serie.length && onScore) {
      sEnreg("encours");
      Promise.resolve(onScore({ k, s: b.filter(x => x.ok).length, t: b.length })).then(() => sEnreg("ok"), () => sEnreg("erreur"));
    }
  };
  const suivante = () => { sI(i + 1); sSaisie(vide()); sRes(null); sIndice(false); };

  const couleur = c => ({ ok: K.em, wa: K.wa, er: K.er }[c]);
  const teinte = pct => ({ bon: K.em, moyen: K.wa, faible: K.er, aucun: K.t3 }[niveau(pct)]);
  const meilleur = n => scores[cleCpt(n)];
  const choixClasse = (actif, onPick) => <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
    {[[0, "Toutes"], ...CLASSES_REV.map(([n]) => [n, `Classe ${n}`])].map(([n, l]) => { const m = meilleur(n); return <button key={n} onClick={() => onPick(n)} className="bt" title={m ? `Meilleur score : ${m.pct} % (${m.n || 1} série${(m.n || 1) > 1 ? "s" : ""})` : "Pas encore de série"} style={{ ...btn(K), minHeight: 32, padding: "5px 11px", fontSize: 11.5, ...(actif === n ? { background: K.emBg, color: K.em, border: `1px solid ${K.emBd}` } : {}) }}>{l}{m && <span style={{ fontSize: 10.5, fontWeight: 800, color: teinte(m.pct) }}>{m.pct} %</span>}</button>; })}
  </div>;

  // ── Accueil de l'exercice
  if (!serie) return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ ...carte(K), padding: "16px 18px", background: `linear-gradient(135deg,${K.emBg},transparent)` }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 19 : 22, color: K.t1 }}>Quel compte ?</div>
      <div style={{ fontSize: 13, color: K.t2, lineHeight: 1.6, marginTop: 6 }}>Pour chaque opération, saisissez les comptes à mouvementer et leur sens (débit ou crédit). Pas de montants : l'exercice porte sur le choix des comptes. Un compte à 3 chiffres suffit ; une subdivision voisine est acceptée, avec la subdivision attendue en rappel.</div>
    </div>
    <div style={{ ...carte(K), padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4, marginBottom: 8 }}>Choisissez le champ de la série</div>
      {choixClasse(k, sK)}
      <div style={{ fontSize: 12, color: K.t3, margin: "10px 0 12px" }}>{pool.length} écritures disponibles{k ? ` en classe ${k}` : ""} · série de {Math.min(NB_QUESTIONS, pool.length)} questions tirées au hasard.</div>
      <button onClick={() => demarrer()} disabled={!pool.length} className="bt" style={btn(K, "p")}><i className="ti ti-player-play" style={{ fontSize: 15 }} />Commencer</button>
    </div>
  </div>;

  // ── Bilan de la série (affiché à la demande, après lecture de la dernière correction)
  const nBons = bilan.filter(x => x.ok).length;
  const vueBilan = () => {
    const pct = Math.round(nBons / serie.length * 100);
    return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...carte(K), padding: "18px", textAlign: "center" }}>
        <i className={`ti ti-${pct >= 80 ? "trophy" : pct >= 50 ? "thumb-up" : "book-2"}`} style={{ fontSize: 34, color: pct >= 50 ? K.em : K.wa }} />
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 26, color: K.t1, marginTop: 6 }}>{nBons} / {serie.length}</div>
        {(() => { const m = meilleur(k); return m ? <div style={{ fontSize: 12, color: K.t3, marginTop: 6 }}>Meilleur score {k ? `en classe ${k}` : "toutes classes"} : <b style={{ color: teinte(m.pct) }}>{m.pct} %</b> · {m.n || 1} série{(m.n || 1) > 1 ? "s" : ""}</div> : null; })()}
        {enreg && <div style={{ fontSize: 11.5, marginTop: 4, color: enreg === "erreur" ? K.er : K.t3 }}><i className={`ti ti-${enreg === "ok" ? "cloud-check" : enreg === "erreur" ? "cloud-off" : "loader-2"}`} style={{ fontSize: 13, verticalAlign: -2 }} /> {enreg === "ok" ? "Score enregistré dans votre suivi" : enreg === "erreur" ? "Score non enregistré (connexion ?) — il le sera à la prochaine série réussie" : "Enregistrement du score…"}</div>}
        <div style={{ fontSize: 13, color: K.t2, marginTop: 4 }}>{pct >= 80 ? "Très bonne maîtrise des comptes de cette série." : pct >= 50 ? "Bonne base : revoyez les fiches des écritures manquées." : "Reprenez les fiches des comptes concernés, puis relancez une série."}</div>
      </div>
      <div style={carte(K)}>
        {serie.map((x, j) => { const b = bilan[j]; return <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: j ? `1px solid ${K.b0}` : "none" }}>
          <i className={`ti ti-${b && b.ok ? "circle-check" : "circle-x"}`} style={{ fontSize: 17, color: b && b.ok ? K.em : K.er, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, color: K.t1, lineHeight: 1.4 }}>{enonce(x.e)}</span>
          <button onClick={() => onFiche(x.c)} className="bt" style={{ ...btn(K), minHeight: 28, padding: "3px 8px", fontSize: 11 }}>Fiche {x.c}</button>
        </div>; })}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => demarrer()} className="bt" style={btn(K, "p")}><i className="ti ti-refresh" style={{ fontSize: 15 }} />Nouvelle série</button>
        <button onClick={() => sSerie(null)} className="bt" style={btn(K)}>Changer de classe</button>
      </div>
    </div>;
  };
  if (serie && bilan.length === serie.length && res && res.bilan) return vueBilan();

  // ── Question
  const nLignes = q.e.l.reduce((n, [D, C]) => n + D.length + C.length, 0);
  // Résultat de correction aligné sur les lignes saisies (les lignes vides ne sont pas corrigées)
  const resLigne = [];
  saisie.reduce((rang, l) => { const n = l.c ? rang + 1 : rang; resLigne.push(l.c && res && !res.abandon ? res.lignes[n] : null); return n; }, -1);
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: K.t2, whiteSpace: "nowrap" }}>Question {i + 1} / {serie.length}</span>
      <div style={{ flex: 1, height: 6, background: K.b0, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(bilan.length / serie.length) * 100}%`, height: "100%", background: K.em, transition: "width .3s" }} /></div>
      <span style={{ fontSize: 12, fontWeight: 800, color: K.em, whiteSpace: "nowrap" }}>{nBons} ✓</span>
    </div>

    <div style={{ ...carte(K), padding: "14px 16px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: K.t3, textTransform: "uppercase", letterSpacing: .4 }}>Opération à comptabiliser · classe {q.k}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: mob ? 17 : 19, color: K.t1, lineHeight: 1.35, margin: "6px 0 8px" }}>{enonce(q.e)}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: K.t3 }}>
        <span><i className="ti ti-list-numbers" style={{ fontSize: 13, verticalAlign: -2 }} /> Écriture en {nLignes} ligne{nLignes > 1 ? "s" : ""}</span>
        {!res && (indice ? <span style={{ color: K.wa, fontWeight: 700 }}>Indice : fiche {q.c} — {q.titre}</span>
          : <button onClick={() => sIndice(true)} style={{ background: "none", border: "none", padding: 0, color: K.em, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}><i className="ti ti-bulb" style={{ fontSize: 13, verticalAlign: -2 }} /> Indice</button>)}
      </div>
    </div>

    <div style={{ ...carte(K), padding: "12px 14px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {saisie.map((l, j) => {
          const r = resLigne[j], et = r && ETATS[r.etat];
          const t = l.c.length >= 2 ? titreDe(l.c) : "";
          return <div key={j}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: l.s === "C" ? (mob ? 14 : 28) : 0 }}>
              <div style={{ display: "inline-flex", border: `1px solid ${K.b1}`, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                {[["D", "Débit"], ["C", "Crédit"]].map(([s, lib]) => <button key={s} disabled={!!res} onClick={() => majLigne(j, "s", s)} style={{ padding: "7px 9px", fontSize: 11, fontWeight: 800, border: "none", cursor: res ? "default" : "pointer", fontFamily: "'Outfit',sans-serif", background: l.s === s ? (s === "D" ? K.emBg : K.waBg) : "transparent", color: l.s === s ? (s === "D" ? K.em : K.wa) : K.t3 }}>{mob ? s : lib}</button>)}
              </div>
              <input value={l.c} disabled={!!res} inputMode="numeric" maxLength={6} placeholder="N° de compte" onChange={e => majLigne(j, "c", e.target.value.replace(/\D/g, ""))}
                style={{ width: mob ? 96 : 120, padding: "8px 10px", background: K.c2, border: `1px solid ${et ? couleur(et[1]) : K.b0}`, borderRadius: 8, color: K.t1, fontSize: 14, fontFamily: mono, fontWeight: 700, outline: "none", boxSizing: "border-box", minHeight: 38 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: K.t3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t}</span>
              {!res && saisie.length > 1 && <button onClick={() => sSaisie(L => L.filter((_, x) => x !== j))} aria-label="Supprimer la ligne" style={{ background: "none", border: "none", color: K.t3, cursor: "pointer", padding: 4 }}><i className="ti ti-trash" style={{ fontSize: 15 }} /></button>}
            </div>
            {et && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: couleur(et[1]), margin: "4px 0 0", paddingLeft: l.s === "C" ? (mob ? 14 : 28) : 0 }}>
              <i className={`ti ti-${et[0]}`} style={{ fontSize: 14 }} />{et[2]}{r.etat === "proche" && <span style={{ fontFamily: mono }}> {r.attendu} — {titreDe(r.attendu)}</span>}
            </div>}
          </div>;
        })}
      </div>
      {!res && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={() => sSaisie(L => [...L, { c: "", s: "C" }])} className="bt" style={btn(K)}><i className="ti ti-plus" style={{ fontSize: 14 }} />Ligne</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => valider(true)} className="bt" style={btn(K)}>Je ne sais pas</button>
        <button onClick={() => valider(false)} disabled={!saisie.some(l => l.c)} className="bt" style={{ ...btn(K, "p"), opacity: saisie.some(l => l.c) ? 1 : .5 }}><i className="ti ti-check" style={{ fontSize: 15 }} />Corriger</button>
      </div>}
    </div>

    {res && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...carte(K), padding: "12px 14px", borderLeft: `4px solid ${res.ok ? K.em : K.er}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, color: res.ok ? K.em : K.er }}>
          <i className={`ti ti-${res.ok ? "circle-check" : "circle-x"}`} style={{ fontSize: 19 }} />{res.ok ? "Bonne écriture" : res.abandon ? "Voici l'écriture attendue" : `${res.nOk} ligne${res.nOk > 1 ? "s" : ""} correcte${res.nOk > 1 ? "s" : ""} sur ${res.nAtt}`}
        </div>
        {!res.ok && !res.abandon && res.manquants.length > 0 && <div style={{ fontSize: 12.5, color: K.t2, marginTop: 6, lineHeight: 1.6 }}>
          <b>Manquant :</b>{res.manquants.map((m, j) => <div key={j} style={{ display: "flex", gap: 6, alignItems: "baseline" }}><b style={{ color: m.s === "D" ? K.em : K.wa, minWidth: 42 }}>{m.s === "D" ? "Débit" : "Crédit"}</b><span style={{ fontFamily: mono, fontWeight: 800 }}>{m.n}</span><span>{titreDe(m.n)}</span></div>)}
        </div>}
      </div>
      {ecriture({ ...q.e, op: enonce(q.e) }, i)}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onFiche(q.c)} className="bt" style={btn(K)}><i className="ti ti-book" style={{ fontSize: 14 }} />Fiche du compte {q.c}</button>
        <span style={{ flex: 1 }} />
        {i < serie.length - 1 ? <button onClick={suivante} className="bt" style={btn(K, "p")}>Question suivante<i className="ti ti-arrow-right" style={{ fontSize: 15 }} /></button>
          : <button onClick={() => sRes({ ...res, bilan: true })} className="bt" style={btn(K, "p")}>Voir le bilan<i className="ti ti-flag" style={{ fontSize: 15 }} /></button>}
      </div>
    </div>}
  </div>;
}
