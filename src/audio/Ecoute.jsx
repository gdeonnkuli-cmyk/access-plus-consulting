import LecteurAudio from "./LecteurAudio";
import { formatDuree, lectureVoix, useVoix } from "./voix";

// ══════════════ ÉCOUTE D'UN CONTENU ══════════════
// Voix du formateur (enregistrement, si l'administrateur en a déposé un) en premier, voix de synthèse ensuite.

export default function Ecoute({ K, db, cle, segments, titre = "Écouter", sx }) {
  const voix = useVoix(db, cle);
  const lec = voix && lectureVoix(voix.url);
  if (!lec) return <LecteurAudio K={K} segments={segments} titre={titre} sx={sx} />;
  return <div style={{ display: "flex", flexDirection: "column", gap: 8, ...sx }}>
    <div style={{ border: `1px solid ${K.emBd}`, background: K.emBg, borderRadius: 14, padding: "9px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: K.em, marginBottom: 6 }}>
        <i className="ti ti-microphone" style={{ fontSize: 15 }} />Voix du formateur{voix.auteur ? ` · ${voix.auteur}` : ""}
        {voix.duree ? <span style={{ fontWeight: 600, color: K.t3 }}>· {formatDuree(voix.duree)}</span> : null}
      </div>
      {lec.mode === "audio"
        ? <audio controls preload="none" src={lec.src} style={{ width: "100%", height: 40 }} controlsList="nodownload" onContextMenu={e => e.preventDefault()} />
        : <iframe src={lec.src} title="Voix du formateur" allow="autoplay" style={{ width: "100%", height: 96, border: "none", borderRadius: 8, background: "#000" }} />}
    </div>
    <LecteurAudio K={K} segments={segments} titre="Voix de synthèse" />
  </div>;
}
