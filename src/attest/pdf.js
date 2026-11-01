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
  const certificat = reussite && !!a.certificat;
  const d = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const C = 148.5;
  d.setDrawColor(10, 42, 92); d.setLineWidth(1.5); d.rect(8, 8, 281, 194);
  d.setDrawColor(218, 168, 84); d.setLineWidth(0.5); d.rect(11, 11, 275, 188);

  d.setTextColor(10, 42, 92); d.setFont("times", "bold"); d.setFontSize(27);
  d.text(certificat ? "CERTIFICAT DE RÉUSSITE" : reussite ? "ATTESTATION DE RÉUSSITE" : "ATTESTATION DE SUIVI DE FORMATION", C, 34, { align: "center" });
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
  d.text(`Vérifier l'authenticité : ${lien}${E.length ? "  ·  Relevé de notes en page 2" : ""}`, C, 192, { align: "center" });
  d.setFont("helvetica", "bold"); d.setTextColor(10, 42, 92); d.setFontSize(8.5);
  d.text("Éco-Campus RDC · eco-campus-rdc.vercel.app · +243 979 075 970", C, 197, { align: "center" });
  if (E.length) releve(d, a, { certificat, reussite, lien, qrcode });
  d.save(`${certificat ? "certificat" : "attestation"}-${a.numero}.pdf`);
}

// Page 2 : relevé de notes (chaque élément, coefficient, note, résultat ; moyenne pondérée et mention)
function releve(d, a, { certificat, reussite, lien, qrcode }) {
  const E = a.elements || [], C = 148.5, seuilE = (a.seuils && a.seuils.element) || 70, seuilM = (a.seuils && a.seuils.moyenne) || 80;
  d.addPage("a4", "landscape");
  d.setDrawColor(10, 42, 92); d.setLineWidth(1.5); d.rect(8, 8, 281, 194);
  d.setDrawColor(218, 168, 84); d.setLineWidth(0.5); d.rect(11, 11, 275, 188);
  d.setTextColor(10, 42, 92); d.setFont("times", "bold"); d.setFontSize(20);
  d.text("RELEVÉ DE NOTES", C, 27, { align: "center" });
  d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(110, 110, 110);
  d.text(`Annexé ${certificat ? "au certificat" : "à l'attestation"} n° ${a.numero}`, C, 33, { align: "center" });
  d.setFontSize(10.5); d.setTextColor(40, 40, 40);
  d.setFont("helvetica", "bold"); d.text(a.nom || "—", 22, 44);
  d.setFont("helvetica", "normal"); d.text(a.parcoursTitre || "", 22, 50, { maxWidth: 170 });
  d.setFontSize(9.5); d.setTextColor(90, 90, 90);
  d.text(`Période : du ${dateFr(a.debut)} au ${dateFr(a.fin)}`, 275, 44, { align: "right" });
  d.text(`Volume horaire indicatif : ${a.heures} h`, 275, 50, { align: "right" });

  // Tableau
  const x = [22, 34, 196, 216, 240, 275], y0 = 58, h = Math.min(8, 104 / Math.max(E.length, 1));
  d.setFillColor(10, 42, 92); d.rect(x[0], y0, x[5] - x[0], 8, "F");
  d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(255, 255, 255);
  d.text("N°", x[0] + 3, y0 + 5.4); d.text("Élément évalué", x[1] + 2, y0 + 5.4);
  d.text("Coef.", x[2] + 10, y0 + 5.4, { align: "center" }); d.text("Note", x[3] + 12, y0 + 5.4, { align: "center" });
  d.text("Résultat", x[4] + 17.5, y0 + 5.4, { align: "center" });
  d.setFontSize(h < 7 ? 8 : 9);
  E.forEach((e, i) => {
    const y = y0 + 8 + i * h, ok = e.evalue ? e.pct != null && e.pct >= seuilE : true;
    if (i % 2) { d.setFillColor(244, 246, 250); d.rect(x[0], y, x[5] - x[0], h, "F"); }
    const ty = y + h / 2 + 1.3;
    d.setFont("helvetica", "normal"); d.setTextColor(60, 60, 60);
    d.text(String(i + 1), x[0] + 3, ty);
    const t = String(e.titre || ""); d.setTextColor(25, 25, 25);
    d.text(t.length > 88 ? `${t.slice(0, 86)}…` : t, x[1] + 2, ty);
    d.text(String(e.coef || 1), x[2] + 10, ty, { align: "center" });
    d.setFont("helvetica", "bold");
    d.text(e.evalue ? (e.pct != null ? `${e.pct} %` : "—") : "terminé", x[3] + 12, ty, { align: "center" });
    if (ok) d.setTextColor(13, 122, 107); else d.setTextColor(185, 28, 28);
    d.text(e.evalue ? (e.pct == null ? "non passé" : ok ? "Validé" : "Non validé") : "Fait", x[4] + 17.5, ty, { align: "center" });
  });
  const yb = y0 + 8 + E.length * h;
  d.setDrawColor(10, 42, 92); d.setLineWidth(0.4); d.rect(x[0], y0, x[5] - x[0], yb - y0);
  d.setFillColor(253, 246, 232); d.rect(x[0], yb, x[5] - x[0], 9, "F"); d.rect(x[0], yb, x[5] - x[0], 9);
  d.setFont("helvetica", "bold"); d.setFontSize(10); d.setTextColor(10, 42, 92);
  d.text("Moyenne générale pondérée", x[1] + 2, yb + 6);
  d.text(a.moyenne != null ? `${a.moyenne} %` : "—", x[3] + 12, yb + 6, { align: "center" });
  d.text(reussite ? (a.mention ? `Mention ${a.mention}` : "Réussi") : "Suivi", x[4] + 17.5, yb + 6, { align: "center" });

  d.setFont("helvetica", "normal"); d.setFontSize(8.5); d.setTextColor(100, 100, 100);
  d.text(`Règles de délivrance : chaque élément évalué à ${seuilE} % au moins et moyenne pondérée d'au moins ${seuilM} % (meilleur score retenu). Mentions : Bien à partir de ${seuilM} %, Très bien à partir de 90 %, Excellent à partir de 95 %.`, x[0], yb + 16, { maxWidth: x[5] - x[0] });

  d.setFontSize(10); d.setTextColor(80, 80, 80);
  d.text(`Fait à Kinshasa, le ${dateFr(a.date)}`, 60, 180);
  const sx = 215;
  d.setDrawColor(150, 150, 150); d.setLineWidth(0.3); d.line(sx - 32, 178, sx + 32, 178);
  d.setFont("helvetica", "bold"); d.setFontSize(10.5); d.setTextColor(20, 20, 20);
  d.text((a.signataire && a.signataire.nom) || "Gédéon NKULI", sx, 184, { align: "center" });
  d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(90, 90, 90);
  d.text((a.signataire && a.signataire.fonction) || "Responsable pédagogique", sx, 189, { align: "center" });
  if (qrcode) { try { dessinerQR(d, qrcode, lien, 22, 168, 20); } catch (e) { /* QR facultatif */ } }
  d.setFontSize(7.5); d.setTextColor(110, 110, 110);
  d.text(`Vérifier l'authenticité : ${lien}`, C, 196, { align: "center" });
}
