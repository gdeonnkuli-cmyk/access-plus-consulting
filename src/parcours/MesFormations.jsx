import React,{useMemo}from"react";
import{PARCOURS,EXAMENS,SEUIL_ELEMENT,SEUIL_MOYENNE,etatParcours,evaluer}from"../attest/regles";
import{LIB_ACCES}from"../acces/plateforme";

// ══════════════════ MES FORMATIONS : LES 5 PARCOURS CERTIFIANTS ══════════════════
// Une carte par parcours (même présentation pour tous) : niveau, durée, progression et bouton « prochaine étape »
// (continuer le module en cours, passer l'examen final, améliorer ses notes, obtenir le certificat).
// En dessous, les outils pratiques (ateliers et référentiels) qui ne délivrent pas de certificat.

// Ordre conseillé et présentation (les titres et noms courts viennent de PARCOURS, comme sur les certificats)
export const FORMATIONS = [
  { id: "SYS-N1", ico: "book-2", col: "#0A2A5C", niveau: "Débutant", libre: false,
    resume: "Principes comptables, plan de comptes, écritures courantes, TVA, paie, amortissements et clôture." },
  { id: "SYS-N2", ico: "notebook", col: "#1D4ED8", niveau: "Intermédiaire", libre: false,
    resume: "Tenir la comptabilité d'une société sur un exercice complet (ZAO IMMO SARL) et maîtriser l'imputation classe par classe." },
  { id: "FISC", ico: "receipt-tax", col: "#A3122A", niveau: "Intermédiaire", libre: "F1",
    resume: "IBP, IPR, TVA, impôts réels, contentieux, import-export, paie, facture normalisée, IRPP et IS 2026." },
  { id: "FIN", ico: "chart-pie", col: "#B7791F", niveau: "Avancé", libre: "FE1",
    resume: "Coût du capital, investissement, financement, évaluation, change USD/CDF et affectation du résultat OHADA." },
  { id: "BANQUE", ico: "building-bank", col: "#0F766E", niveau: "Spécialisation", libre: "B1",
    resume: "Le Guide comptable des établissements de crédit de la BCC : dépôts et crédits, compensation, trésorerie, devises, hors-bilan, créances en souffrance, états financiers, analyse, agios, affacturage, crédit-bail et crédit documentaire." },
  { id: "SYCEBNL", ico: "building-community", col: "#0F766E", niveau: "Spécialisation", libre: "SB1",
    resume: "Associations, ONG, fondations, églises : dotations, fonds affectés, bailleurs, bénévolat et analyse financière." },
];
export const OUTILS = [
  { vue: "ef", ico: "report-money", titre: "Atelier États financiers", d: "Bilan, compte de résultat, TFT et notes annexes à partir d'une balance." },
  { vue: "cpt", ico: "books", titre: "Guide des comptes", d: "Contenu et fonctionnement des comptes SYSCOHADA révisé, exercice « Quel compte ? »." },
  { vue: "audio", ico: "headphones", titre: "Écouter les cours", d: "Toutes les leçons en audio, à écouter partout." },
];

// Page qui héberge un élément du parcours
const vueElement = (id, cle) => (id === "SYS-N2" ? (cle === "JRN-ZAO" ? "jrn" : "cpt") : EXAMENS[id].vue);
const sansNumero = t => String(t || "").replace(/^[A-Z]+\d+\s·\s/, "");

// Prochaine étape d'un parcours : { lib, ico, go: vue | "exam" | "res", v }
export function prochaineEtape(id, et, ev) {
  const x = EXAMENS[id];
  if (ev.reussite) return { lib: "Obtenir mon certificat", ico: "certificate", go: "res" };
  if (et.final != null && et.final >= SEUIL_ELEMENT) return { lib: `Améliorer mes notes (moyenne ${ev.moyenne} % pour ${SEUIL_MOYENNE} %)`, ico: "trending-up", go: vueElement(id, (ev.elements.find(e => e.evalue && e.pct != null && !e.final && e.pct < 95) || {}).cle) };
  if (et.finalOuvert) return { lib: et.final != null ? "Repasser l'examen final" : "Passer l'examen final", ico: "certificate", go: "exam", v: x.vue };
  const e = et.elements.find(e => !e.reussi && e.ouvert);
  if (e) return { lib: `${e.pct != null || e.fait ? "Reprendre" : et.nReussis ? "Continuer" : "Commencer"} : ${sansNumero(e.titre)}`, ico: e.pct != null ? "refresh" : "player-play", go: vueElement(id, e.cle) };
  if (et.tousReussis) return { lib: `Moyenne ${et.moyenne} % : portez-la à ${SEUIL_MOYENNE} % pour l'examen`, ico: "trending-up", go: vueElement(id, et.elements[0] && et.elements[0].cle) };
  return { lib: "Voir le parcours", ico: "arrow-right", go: x.vue };
}

export default function MesFormations({ K, mob, user, mods, ok, onGo, onExam, onSub }) {
  const lignes = useMemo(() => FORMATIONS.map(f => {
    const p = PARCOURS.find(x => x.id === f.id), et = etatParcours(f.id, mods, user), ev = evaluer(f.id, mods, user);
    return { f, p, et, ev, etape: prochaineEtape(f.id, et, ev) };
  }), [mods, user]);
  const agir = (id, s) => {
    if (s.go === "exam") { if (onExam && (id === "SYS-N1" || id === "SYS-N2")) onExam(id); else onGo(s.v); return; }
    onGo(s.go);
  };
  const carte = { background: K.card, border: `1px solid ${K.b0}`, boxShadow: K.sh, borderRadius: 16 };
  return <div style={{ maxWidth: 900, margin: "0 auto", animation: "fadeIn .3s ease" }}>
    <div style={{ background: `linear-gradient(135deg,#001433,#0A2A5C 55%,#B7791F)`, borderRadius: 20, padding: mob ? "20px 18px" : "26px 28px", color: "#fff", marginBottom: 16, position: "relative", overflow: "hidden" }}>
      <i className="ti ti-certificate" style={{ position: "absolute", right: -10, bottom: -22, fontSize: 150, opacity: .1 }} />
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: .85 }}>Parcours métier</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: mob ? 24 : 31, lineHeight: 1.15, margin: "6px 0 8px" }}>Mes formations certifiantes</div>
      <div style={{ fontSize: 14.5, opacity: .92, lineHeight: 1.55, maxWidth: 620 }}>{lignes.length} parcours construits de la même façon : les modules s'ouvrent dans l'ordre (le suivant quand le précédent est réussi à {SEUIL_ELEMENT} %), puis un examen final, coefficient 2, ouvert à {SEUIL_MOYENNE} % de moyenne, mène au <b>certificat</b> et à son <b>relevé de notes</b>.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, fontSize: 12.5, fontWeight: 700, alignItems: "center" }}>
        <span style={{ opacity: .8 }}>Ordre conseillé :</span>
        {lignes.map(({ p }, i) => <React.Fragment key={p.id}><span style={{ background: "rgba(255,255,255,.16)", borderRadius: 99, padding: "4px 10px" }}>{p.court}</span>{i < lignes.length - 1 && <i className="ti ti-chevron-right" style={{ opacity: .6 }} />}</React.Fragment>)}
      </div>
    </div>

    {!ok && <div style={{ display: "flex", alignItems: "center", gap: 10, background: K.waBg, border: `1px solid ${K.waBd}`, borderRadius: 14, padding: "11px 14px", marginBottom: 14, flexWrap: "wrap" }}>
      <i className="ti ti-lock-open" style={{ fontSize: 18, color: K.wa }} />
      <div style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: K.t1, lineHeight: 1.5 }}>Le premier module de la Fiscalité, de la Finance d'entreprise, de la Comptabilité bancaire et du SYCEBNL est gratuit. Les parcours complets, les examens et les certificats sont réservés aux abonnés.</div>
      {onSub && <button onClick={onSub} className="bt" style={{ background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", border: "none", borderRadius: 11, padding: "9px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{LIB_ACCES}</button>}
    </div>}

    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(2,minmax(0,1fr))", gap: 12 }}>
      {lignes.map(({ f, p, et, ev, etape }, i) => {
        const n = et.elements.length, fait = et.nReussis + (et.final != null && et.final >= SEUIL_ELEMENT ? 1 : 0), pct = Math.round(fait / (n + 1) * 100);
        const verrou = !ok && !f.libre;
        return <div key={f.id} style={{ ...carte, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 8, borderTop: `4px solid ${f.col}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${f.col}16`, border: `1px solid ${f.col}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className={`ti ti-${f.ico}`} style={{ fontSize: 21, color: f.col }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: f.col, letterSpacing: .6, textTransform: "uppercase" }}>{i + 1}. {p.court}</div>
              <div style={{ fontSize: 12, color: K.t3 }}>{f.niveau} · {ev.heures} h · {n} {f.id === "SYS-N2" ? "exercices" : "modules"} + examen</div>
            </div>
            {ev.reussite ? <span style={{ fontSize: 11.5, fontWeight: 800, color: K.em, background: K.emBg, border: `1px solid ${K.emBd}`, borderRadius: 99, padding: "3px 9px" }}>Réussi{ev.mention ? ` · ${ev.mention}` : ""}</span>
              : !ok && f.libre ? <span style={{ fontSize: 11.5, fontWeight: 800, color: K.in_, background: K.inBg, border: `1px solid ${K.inBd}`, borderRadius: 99, padding: "3px 9px" }}>{f.libre} gratuit</span> : null}
          </div>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: K.t1, lineHeight: 1.3 }}>{p.titre}</div>
          <div style={{ fontSize: 13, color: K.t3, lineHeight: 1.5, flex: 1 }}>{f.resume}</div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: K.t2, marginBottom: 4 }}>
              <span>{fait} / {n + 1} étapes réussies</span><span>{ev.moyenne != null ? `moyenne ${ev.moyenne} %` : "pas encore de note"}</span>
            </div>
            <div style={{ height: 7, background: K.c2, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: ev.reussite ? K.em : f.col, borderRadius: 99 }} /></div>
          </div>
          <button onClick={() => verrou ? onSub && onSub() : agir(f.id, etape)} className="bt" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 42, borderRadius: 11, fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "center", lineHeight: 1.3, padding: "8px 12px",
            ...(verrou ? { background: K.c2, color: K.t1, border: `1px solid ${K.b1}` } : { background: `linear-gradient(135deg,${f.col},${f.col}CC)`, color: "#fff", border: "none" }) }}>
            <i className={`ti ti-${verrou ? "lock" : etape.ico}`} style={{ fontSize: 16, flexShrink: 0 }} /><span>{verrou ? LIB_ACCES : etape.lib}</span></button>
        </div>;
      })}
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 10px" }}><i className="ti ti-tools" style={{ fontSize: 19, color: K.t2 }} /><span style={{ fontWeight: 800, fontSize: 16, color: K.t1 }}>Outils pratiques</span><span style={{ fontSize: 12.5, color: K.t3 }}>sans certificat</span></div>
    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,minmax(0,1fr))", gap: 10 }}>
      {OUTILS.map(o => <div key={o.vue} onClick={() => onGo(o.vue)} className="hv" style={{ ...carte, padding: "12px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <i className={`ti ti-${o.ico}`} style={{ fontSize: 20, color: K.em, marginTop: 1 }} />
        <div><div style={{ fontWeight: 800, fontSize: 14, color: K.t1 }}>{o.titre}</div><div style={{ fontSize: 12.5, color: K.t3, lineHeight: 1.45, marginTop: 2 }}>{o.d}</div></div>
      </div>)}
    </div>
  </div>;
}
