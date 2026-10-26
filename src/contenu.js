// ══════════════ CONTENUS PUBLIÉS ET VALIDATION PAR L'ADMINISTRATEUR ══════════════
// Un contenu de formateur (vidéo, présentation) n'est visible des apprenants qu'une fois approuvé ;
// l'admin le prévisualise avant d'approuver.
import { embedPresentation } from "./presentation";

// Lien vidéo → lecteur intégrable (YouTube, Vimeo, Facebook, sinon l'adresse telle quelle)
export const pVid = u => {
  if (!u) return null;
  u = u.trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return { t: "yt", id: m[1], src: `https://www.youtube.com/embed/${m[1]}?rel=0` };
  m = u.match(/vimeo\.com\/(\d+)/);
  if (m) return { t: "vi", src: `https://player.vimeo.com/video/${m[1]}` };
  if (u.includes("facebook.com")) return { t: "fb", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false` };
  if (u.startsWith("http")) return { t: "url", src: u };
  return null;
};

// Visible des apprenants : contenu de l'admin (sans statut) ou contenu de formateur approuvé, et non masqué
export const estPublie = c => !!c && c.on !== false && (!c.status || c.status === "approved");

// Lien Google (Drive, Docs, Slides) : le partage doit être « Tous les utilisateurs disposant du lien »
export const lienGoogle = u => /drive\.google\.com|docs\.google\.com/i.test(u || "");

// Adresse de l'aperçu intégré pour la validation (null : à ouvrir dans un nouvel onglet)
export function apercuValidation(url, video) {
  if (!url) return null;
  if (video) {
    const p = pVid(url);
    if (!p) return null;
    if (p.t !== "url") return p.src;
    const e = embedPresentation(url);
    return e.hebergeur === "google" ? e.src : null; // vidéo déposée dans Drive
  }
  return embedPresentation(url).src;
}
