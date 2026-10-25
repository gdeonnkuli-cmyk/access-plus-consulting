import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { PARCOURS } from "./regles";
import { lienVerification, telechargerAttestation } from "./pdf";

// ══════════════ ADMIN : ATTESTATIONS DÉLIVRÉES ══════════════
// Liste, recherche, téléchargement du PDF, révocation et rétablissement (seuls statut, revoqueLe et motif changent).

const dateFr = iso => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "—");

export default function AdminAttestations({ K, mob, db }) {
  const [liste, sListe] = useState(null);
  const [q, sQ] = useState(""), [filtre, sFiltre] = useState("tous");
  const [err, sErr] = useState("");

  useEffect(() => onSnapshot(collection(db, "attestations"),
    s => sListe(s.docs.map(d => d.data()).sort((a, b) => String(b.date).localeCompare(String(a.date)))),
    e => { sErr(e.message); sListe([]); }), [db]);

  const vues = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (liste || []).filter(a => (filtre === "tous" || a.parcours === filtre || (filtre === "revoquee" && a.statut !== "valide"))
      && (!t || `${a.numero} ${a.nom}`.toLowerCase().includes(t)));
  }, [liste, q, filtre]);
  const nb = type => (liste || []).filter(a => a.type === type && a.statut === "valide").length;

  const revoquer = async a => {
    const motif = window.prompt(`Révoquer l'attestation ${a.numero} de ${a.nom} ?\nMotif (affiché uniquement aux administrateurs) :`, "");
    if (motif == null) return;
    try { await updateDoc(doc(db, "attestations", a.numero), { statut: "revoquee", revoqueLe: new Date().toISOString(), motif: motif.trim() || "—" }); }
    catch (e) { sErr(e.message); }
  };
  const retablir = async a => {
    if (!window.confirm(`Rétablir l'attestation ${a.numero} ?`)) return;
    try { await updateDoc(doc(db, "attestations", a.numero), { statut: "valide", revoqueLe: null, motif: null }); }
    catch (e) { sErr(e.message); }
  };
  const petit = (col, plein) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", minHeight: 32,
    background: plein ? col : "transparent", color: plein ? "#fff" : col, border: `1px solid ${plein ? col : K.b1}` });

  return <div style={{ animation: "fadeIn .35s ease" }}>
    <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 21, color: K.t1, display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}><i className="ti ti-certificate" style={{ color: K.em }} />Attestations</div>
    <div style={{ fontSize: 13, color: K.t3, marginBottom: 12 }}>{liste ? `${nb("reussite")} de réussite · ${nb("suivi")} de suivi en vigueur` : "Chargement…"}</div>
    {err && <div style={{ background: K.erBg, border: `1px solid ${K.erBd}`, color: K.er, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 10 }}>{err}</div>}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      <input value={q} onChange={e => sQ(e.target.value)} placeholder="Nom ou numéro EC-…" style={{ flex: 1, minWidth: 180, padding: "9px 12px", borderRadius: 10, border: `1px solid ${K.b1}`, background: K.card, color: K.t1, fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
      <select value={filtre} onChange={e => sFiltre(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: `1px solid ${K.b1}`, background: K.card, color: K.t1, fontSize: 13.5, fontFamily: "'Outfit',sans-serif" }}>
        <option value="tous">Tous les parcours</option>
        {PARCOURS.map(p => <option key={p.id} value={p.id}>{p.court}</option>)}
        <option value="revoquee">Révoquées</option>
      </select>
    </div>
    {liste && !vues.length && <div style={{ color: K.t3, fontSize: 14, padding: 18, textAlign: "center", background: K.card, border: `1px solid ${K.b0}`, borderRadius: 12 }}>Aucune attestation.</div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {vues.map(a => {
        const ok = a.statut === "valide";
        return <div key={a.numero} style={{ background: K.card, border: `1px solid ${ok ? K.b0 : K.erBd}`, borderRadius: 12, padding: "11px 13px", display: "flex", gap: 10, alignItems: mob ? "flex-start" : "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: K.t1 }}>{a.nom} <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: K.t3 }}>{a.numero}</span></div>
            <div style={{ fontSize: 12.5, color: K.t2, marginTop: 2 }}>{a.type === "reussite" ? "Réussite" : "Suivi"} · {(PARCOURS.find(p => p.id === a.parcours) || {}).court || a.parcours}{a.type === "reussite" ? ` · ${a.moyenne} %${a.mention ? ` (${a.mention})` : ""}` : ""} · {dateFr(a.date)}</div>
            {!ok && <div style={{ fontSize: 12, color: K.er, marginTop: 2 }}>Révoquée le {dateFr(a.revoqueLe)}{a.motif ? ` — ${a.motif}` : ""}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => telechargerAttestation(a).catch(e => sErr(e.message))} className="bt" style={petit(K.t2)}><i className="ti ti-download" style={{ fontSize: 14 }} />PDF</button>
            <a href={lienVerification(a.numero)} target="_blank" rel="noreferrer" className="bt" style={{ ...petit(K.t2), textDecoration: "none" }}><i className="ti ti-external-link" style={{ fontSize: 14 }} />Vérifier</a>
            {ok ? <button onClick={() => revoquer(a)} className="bt" style={petit(K.er)}><i className="ti ti-ban" style={{ fontSize: 14 }} />Révoquer</button>
              : <button onClick={() => retablir(a)} className="bt" style={petit(K.em, true)}><i className="ti ti-restore" style={{ fontSize: 14 }} />Rétablir</button>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
