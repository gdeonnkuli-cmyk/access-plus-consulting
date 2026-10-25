import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { numeroValide } from "./regles";

// ══════════════ VÉRIFICATION PUBLIQUE D'UNE ATTESTATION ══════════════
// Ouverte par le QR code ou le lien imprimé : /?attestation=EC-AAAA-XXXXXX (sans connexion).

const dateFr = iso => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—");

export default function VerifAttestation({ K, db, numero, logo, onFermer }) {
  const n = String(numero || "").trim().toUpperCase();
  const [etat, sEtat] = useState(numeroValide(n) ? "charge" : "introuvable");
  const [a, sA] = useState(null);

  useEffect(() => {
    if (!numeroValide(n)) return;
    getDoc(doc(db, "attestations", n))
      .then(s => { if (s.exists()) { sA(s.data()); sEtat(s.data().statut === "valide" ? "valide" : "revoquee"); } else sEtat("introuvable"); })
      .catch(() => sEtat("erreur"));
  }, [db, n]);

  const V = {
    valide: { ic: "rosette-discount-check", col: K.em, bg: K.emBg, bd: K.emBd, t: "Attestation authentique", s: "Cette attestation a bien été délivrée par Éco-Campus RDC." },
    revoquee: { ic: "alert-octagon", col: K.er, bg: K.erBg, bd: K.erBd, t: "Attestation révoquée", s: "Cette attestation a été délivrée puis révoquée : elle n'est plus valable." },
    introuvable: { ic: "help-octagon", col: K.er, bg: K.erBg, bd: K.erBd, t: "Attestation introuvable", s: "Aucune attestation ne porte ce numéro. Vérifiez la saisie (format EC-AAAA-XXXXXX)." },
    erreur: { ic: "wifi-off", col: K.wa, bg: K.waBg, bd: K.waBd, t: "Vérification impossible", s: "Connexion indisponible. Réessayez dans un instant." },
  }[etat];
  const ligne = (l, v) => <div style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: `1px solid ${K.b0}`, fontSize: 13.5 }}><span style={{ color: K.t3, minWidth: 120 }}>{l}</span><span style={{ color: K.t1, fontWeight: 700, flex: 1 }}>{v}</span></div>;

  return <div style={{ minHeight: "100vh", background: K.bg, fontFamily: "'Outfit',sans-serif", padding: "28px 16px" }}>
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        {logo && <img src={logo} alt="" style={{ width: 38, height: 38, borderRadius: 10 }} />}
        <div><div style={{ fontWeight: 800, fontSize: 16, color: K.t1 }}>Éco-Campus RDC</div><div style={{ fontSize: 12.5, color: K.t3 }}>Vérification d'attestation</div></div>
      </div>
      {etat === "charge" ? <div style={{ color: K.t3, fontSize: 14, padding: 20, textAlign: "center" }}>Vérification de {n}…</div>
        : <div style={{ background: K.card, border: `1px solid ${V.bd}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ background: V.bg, padding: "18px 18px 14px", display: "flex", gap: 12, alignItems: "center" }}>
            <i className={`ti ti-${V.ic}`} style={{ fontSize: 34, color: V.col }} />
            <div><div style={{ fontWeight: 900, fontSize: 18, color: V.col }}>{V.t}</div><div style={{ fontSize: 13, color: K.t2, lineHeight: 1.45 }}>{V.s}</div></div>
          </div>
          <div style={{ padding: "6px 18px 14px" }}>
            {ligne("Numéro", <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{n || "—"}</span>)}
            {a && <>
              {ligne("Titulaire", a.nom)}
              {ligne("Attestation", a.type === "reussite" ? "de réussite" : "de suivi de formation")}
              {ligne("Parcours", a.parcoursTitre)}
              {a.type === "reussite" && ligne("Résultat", `Moyenne ${a.moyenne} %${a.mention ? ` — mention ${a.mention}` : ""}`)}
              {ligne("Volume horaire", `${a.heures} h (indicatif)`)}
              {ligne("Période", `du ${dateFr(a.debut)} au ${dateFr(a.fin)}`)}
              {ligne("Délivrée le", dateFr(a.date))}
              {ligne("Signataire", `${(a.signataire && a.signataire.nom) || ""}, ${(a.signataire && a.signataire.fonction) || ""}`)}
              {etat === "revoquee" && a.revoqueLe && ligne("Révoquée le", dateFr(a.revoqueLe))}
            </>}
          </div>
        </div>}
      <div style={{ fontSize: 12, color: K.t3, lineHeight: 1.5, marginTop: 14 }}>Les informations affichées sont celles enregistrées par Éco-Campus RDC au moment de la délivrance. Elles doivent correspondre à celles du document présenté.</div>
      {onFermer && <button onClick={onFermer} className="bt" style={{ marginTop: 16, background: "transparent", border: `1px solid ${K.b1}`, color: K.t2, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Aller sur Éco-Campus</button>}
    </div>
  </div>;
}
