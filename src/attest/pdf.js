// ══════════════ ATTESTATION : DOCUMENT PDF ══════════════
// Généré dans le navigateur à partir de l'attestation délivrée par le serveur (attestations/{numero}).
// jsPDF et le générateur de QR code sont chargés à la demande (cdnjs) ; sans QR code, le lien reste imprimé.

const charger = (src, test) => new Promise((ok, ko) => {
  if (test()) return ok(test());
  const s = document.createElement("script");
  s.src = src; s.onload = () => (test() ? ok(test()) : ko(new Error("chargement")));
  s.onerror = () => ko(new Error("Impossible de charger le générateur PDF. Vérifiez votre connexion."));
  document.head.appendChild(s);
});
const jsPDFdispo = () => charger("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => window.jspdf && window.jspdf.jsPDF);
const qrDispo = () => charger("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js", () => window.qrcode);

export const lienVerification = numero => `${window.location.origin}/?attestation=${encodeURIComponent(numero)}`;
const dateFr = iso => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

// QR code dessiné en carrés vectoriels (net à l'impression)
function dessinerQR(d, qrcode, texte, x, y, taille) {
  const q = qrcode(0, "M");
  q.addData(texte); q.make();
  const n = q.getModuleCount(), c = taille / n;
  d.setFillColor(20, 20, 20);
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) d.rect(x + k * c, y + r * c, c + 0.02, c + 0.02, "F");
}

export async function telechargerAttestation(a) {
  const jsPDF = await jsPDFdispo();
  let qrcode = null;
  try { qrcode = await qrDispo(); } catch (e) { qrcode = null; }
  const reussite = a.type === "reussite", lien = lienVerification(a.numero);
  const d = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const C = 148.5;
  d.setDrawColor(10, 42, 92); d.setLineWidth(1.5); d.rect(8, 8, 281, 194);
  d.setDrawColor(218, 168, 84); d.setLineWidth(0.5); d.rect(11, 11, 275, 188);

  d.setTextColor(10, 42, 92); d.setFont("times", "bold"); d.setFontSize(27);
  d.text(reussite ? "ATTESTATION DE RÉUSSITE" : "ATTESTATION DE SUIVI DE FORMATION", C, 34, { align: "center" });
  d.setDrawColor(218, 168, 84); d.setLineWidth(0.8); d.line(98, 39, 199, 39);
  d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(120, 120, 120);
  d.text(`N° ${a.numero}`, C, 45, { align: "center" });

  d.setFontSize(12.5); d.setTextColor(80, 80, 80);
  d.text(`${a.organisme || "Éco-Campus RDC"} atteste que`, C, 56, { align: "center" });
  d.setFont("times", "bolditalic"); d.setFontSize(25); d.setTextColor(20, 20, 20);
  d.text(a.nom || "—", C, 70, { align: "center" });
  d.setFont("helvetica", "normal"); d.setFontSize(12); d.setTextColor(80, 80, 80);
  d.text(reussite ? "a suivi et réussi le parcours de formation" : "a suivi l'intégralité du parcours de formation", C, 81, { align: "center" });
  d.setFont("helvetica", "bold"); d.setFontSize(14); d.setTextColor(10, 42, 92);
  d.text(a.parcoursTitre || "", C, 90, { align: "center", maxWidth: 250 });
  d.setFont("helvetica", "normal"); d.setFontSize(11.5); d.setTextColor(60, 60, 60);
  if (reussite) d.text(`avec une moyenne de ${a.moyenne} %${a.mention ? ` — mention ${a.mention}` : ""}`, C, 99, { align: "center" });
  else if (a.moyenne != null) d.text(`Score moyen obtenu : ${a.moyenne} %`, C, 99, { align: "center" });
  d.setFontSize(9.5); d.setTextColor(100, 100, 100);
  d.text(`Volume horaire indicatif : ${a.heures} h  ·  Période : du ${dateFr(a.debut)} au ${dateFr(a.fin)}`, C, 106, { align: "center" });

  // Éléments du parcours (deux colonnes au-delà de 6)
  const E = a.elements || [], deux = E.length > 6, lignes = deux ? Math.ceil(E.length / 2) : E.length;
  d.setFontSize(8.5); d.setTextColor(90, 90, 90);
  E.slice(0, 14).forEach((e, i) => {
    const col = deux && i >= lignes ? 1 : 0, ligne = deux && i >= lignes ? i - lignes : i;
    const x = deux ? (col ? C + 6 : 40) : 70, y = 114 + ligne * 5;
    const t = `${e.titre}${e.evalue && e.pct != null ? ` — ${e.pct} %` : e.evalue ? "" : " — terminé"}`;
    d.text(`• ${t.length > 72 ? `${t.slice(0, 70)}…` : t}`, x, y);
  });

  // Lieu, date, signature
  d.setFontSize(10.5); d.setTextColor(80, 80, 80);
  d.text(`Fait à Kinshasa, le ${dateFr(a.date)}`, 50, 168);
  const sx = 215;
  d.setDrawColor(150, 150, 150); d.setLineWidth(0.3); d.line(sx - 32, 172, sx + 32, 172);
  d.setFont("helvetica", "bold"); d.setFontSize(11); d.setTextColor(20, 20, 20);
  d.text((a.signataire && a.signataire.nom) || "Gédéon NKULI", sx, 178, { align: "center" });
  d.setFont("helvetica", "normal"); d.setFontSize(9.5); d.setTextColor(90, 90, 90);
  d.text((a.signataire && a.signataire.fonction) || "Responsable pédagogique", sx, 183, { align: "center" });

  // Vérification
  if (qrcode) { try { dessinerQR(d, qrcode, lien, 18, 160, 24); } catch (e) { /* QR facultatif */ } }
  d.setFontSize(7.5); d.setTextColor(110, 110, 110);
  d.text(`Vérifier l'authenticité : ${lien}`, C, 192, { align: "center" });
  d.setFont("helvetica", "bold"); d.setTextColor(10, 42, 92); d.setFontSize(8.5);
  d.text("Éco-Campus RDC · eco-campus-rdc.vercel.app · +243 979 075 970", C, 197, { align: "center" });
  d.save(`attestation-${a.numero}.pdf`);
}
