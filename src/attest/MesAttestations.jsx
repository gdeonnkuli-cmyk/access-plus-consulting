import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PARCOURS, SEUIL_ELEMENT, SEUIL_MOYENNE, evaluer } from "./regles";
import { lienVerification, telechargerAttestation } from "./pdf";
import { LIB_ACCES } from "../acces/plateforme";

// ══════════════ MES ATTESTATIONS (apprenant) ══════════════
// Avancement de chaque parcours (aperçu local), puis délivrance par le serveur (/api/attestation), qui relit
// les scores et enregistre l'attestation numérotée ; téléchargement du PDF et lien de vérification.

const carte = K => ({ background: K.card, border: `1px solid ${K.b0}`, borderRadius: 14 });
const btn = (K, v) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", minHeight: 36,
  ...(v === "p" ? { background: `linear-gradient(135deg,${K.emD},${K.em})`, color: "#fff", border: "none" } : { background: "transparent", color: K.t2, border: `1px solid ${K.b1}` }) });

export default function MesAttestations({ K, mob, db, uid, user, mods, ok, onSub }) {
  const [delivrees, sDelivrees] = useState([]);
  const [ouvert, sOuvert] = useState(null);
  const [encours, sEncours] = useState(null);
  const [msg, sMsg] = useState(null);

  useEffect(() => {
    if (!db || !uid) return;
    return onSnapshot(query(collection(db, "attestations"), where("uid", "==", uid)), s => sDelivrees(s.docs.map(d => d.data())), () => sDelivrees([]));
  }, [db, uid]);
  const evals = useMemo(() => PARCOURS.map(p => ({ p, ev: evaluer(p.id, mods, user) })), [mods, user]);
  const trouve = (p, type) => delivrees.find(a => a.parcours === p && a.type === type && a.statut === "valide");

  const obtenir = async (p, type) => {
    sMsg(null); sEncours(`${p}-${type}`);
    try {
      const u = getAuth().currentUser;
      if (!u) throw new Error("Session expirée : reconnectez-vous.");
      const r = await fetch("/api/attestation", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await u.getIdToken()}` }, body: JSON.stringify({ parcours: p, type }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.raison || "Délivrance impossible pour le moment.");
      sMsg({ t: "o", m: `Attestation ${j.attestation.numero} délivrée. Le téléchargement démarre.` });
      await telechargerAttestation(j.attestation);
    } catch (e) { sMsg({ t: "e", m: e.message || String(e) }); }
    sEncours(null);
  };
  const partager = async a => {
    const l = lienVerification(a.numero);
    try {
      if (navigator.share) await navigator.share({ title: `Attestation ${a.numero}`, text: `Vérifier mon attestation Éco-Campus : ${a.parcoursTitre}`, url: l });
      else { await navigator.clipboard.writeText(l); sMsg({ t: "o", m: "Lien de vérification copié." }); }
    } catch (e) { /* partage annulé */ }
  };

  if (!ok) return <div style={{ ...carte(K), padding: "14px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <i className="ti ti-certificate" style={{ fontSize: 22, color: K.t3 }} />
    <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontWeight: 800, fontSize: 14, color: K.t1 }}>Attestations de formation</div><div style={{ fontSize: 12.5, color: K.t3 }}>Réservées aux abonnés actifs.</div></div>
    {onSub && <button onClick={onSub} className="bt" style={btn(K, "p")}>{LIB_ACCES}</button>}
  </div>;

  return <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><i className="ti ti-certificate" style={{ fontSize: 20, color: K.em }} /><span style={{ fontWeight: 800, fontSize: 16, color: K.t1 }}>Mes attestations</span></div>
    <div style={{ fontSize: 12.5, color: K.t3, lineHeight: 1.5, marginBottom: 10 }}>Attestation de <b>suivi</b> : tous les éléments du parcours faits. Attestation de <b>réussite</b> : chaque élément à {SEUIL_ELEMENT} % au moins et une moyenne d'au moins {SEUIL_MOYENNE} % (meilleur score retenu). Chaque attestation porte un numéro et un QR code vérifiables.</div>
    {msg && <div style={{ background: msg.t === "e" ? K.erBg : K.emBg, border: `1px solid ${msg.t === "e" ? K.erBd : K.emBd}`, color: msg.t === "e" ? K.er : K.em, borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>{msg.m}</div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {evals.map(({ p, ev }) => {
        const as = trouve(p.id, "suivi"), ar = trouve(p.id, "reussite"), pct = ev.nTotal ? Math.round((ev.nFaits / ev.nTotal) * 100) : 0;
        const action = (type, a, eligible) => a
          ? <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => telechargerAttestation(a).catch(e => sMsg({ t: "e", m: e.message }))} className="bt" style={btn(K, "p")}><i className="ti ti-download" style={{ fontSize: 14 }} />{type === "reussite" ? "Réussite" : "Suivi"} · PDF</button>
            <button onClick={() => partager(a)} className="bt" style={btn(K)}><i className="ti ti-share" style={{ fontSize: 14 }} />Lien</button></span>
          : <button onClick={() => obtenir(p.id, type)} disabled={!eligible || !!encours} className="bt" style={{ ...btn(K, eligible ? "p" : "g"), opacity: eligible && !encours ? 1 : 0.5, cursor: eligible ? "pointer" : "not-allowed" }}>
            <i className={`ti ti-${eligible ? "certificate" : "lock"}`} style={{ fontSize: 14 }} />{encours === `${p.id}-${type}` ? "Délivrance…" : type === "reussite" ? "Attestation de réussite" : "Attestation de suivi"}</button>;
        return <div key={p.id} style={{ ...carte(K), padding: "13px 15px", borderColor: ar ? K.emBd : K.b0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: K.t1, lineHeight: 1.3 }}>{p.titre}</div>
              <div style={{ fontSize: 12, color: K.t3, marginTop: 2 }}>{ev.nFaits} / {ev.nTotal} éléments · moyenne {ev.moyenne == null ? "—" : `${ev.moyenne} %`} · {ev.heures} h{ev.mention ? ` · mention ${ev.mention}` : ""}</div>
            </div>
            {ar && <span style={{ fontSize: 11, fontWeight: 800, color: K.em, background: K.emBg, border: `1px solid ${K.emBd}`, borderRadius: 99, padding: "3px 9px" }}>Réussi</span>}
          </div>
          <div style={{ height: 6, background: K.b0, borderRadius: 99, overflow: "hidden", margin: "9px 0" }}><div style={{ width: `${pct}%`, height: "100%", background: K.em }} /></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {(as || (!ar && !ev.reussite)) && action("suivi", as, ev.suivi)}{action("reussite", ar, ev.reussite)}
            <button onClick={() => sOuvert(o => (o === p.id ? null : p.id))} className="bt" style={{ ...btn(K), marginLeft: mob ? 0 : "auto" }}><i className={`ti ti-chevron-${ouvert === p.id ? "up" : "down"}`} style={{ fontSize: 14 }} />Détail</button>
          </div>
          {!ar && ev.suivi && !ev.reussite && <div style={{ fontSize: 12, color: K.wa, marginTop: 8, lineHeight: 1.5 }}>Pour la réussite : {ev.aAmeliorer.length ? `améliorez ${ev.aAmeliorer.length} élément${ev.aAmeliorer.length > 1 ? "s" : ""} sous ${SEUIL_ELEMENT} %` : ""}{ev.aAmeliorer.length && ev.moyenne < SEUIL_MOYENNE ? " et " : ""}{ev.moyenne < SEUIL_MOYENNE ? `portez la moyenne à ${SEUIL_MOYENNE} %` : ""}.</div>}
          {ouvert === p.id && <div style={{ marginTop: 10, borderTop: `1px solid ${K.b0}`, paddingTop: 8 }}>
            <div style={{ fontSize: 12, color: K.t3, marginBottom: 6 }}>{p.description}</div>
            {ev.elements.map(e => <div key={e.cle} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12.5 }}>
              <i className={`ti ti-${!e.fait ? "circle-dashed" : e.reussi ? "circle-check" : "alert-circle"}`} style={{ fontSize: 16, color: !e.fait ? K.t3 : e.reussi ? K.em : K.wa, flexShrink: 0 }} />
              <span style={{ flex: 1, color: K.t1, lineHeight: 1.35 }}>{e.titre}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: !e.fait ? K.t3 : e.reussi ? K.em : K.wa }}>{!e.fait ? "à faire" : e.evalue ? `${e.pct} %` : "fait"}</span>
            </div>)}
          </div>}
        </div>;
      })}
    </div>
  </div>;
}
