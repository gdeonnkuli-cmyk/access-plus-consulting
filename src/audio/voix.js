// ══════════════ VOIX DU FORMATEUR ══════════════
// Enregistrements audio associés aux contenus, dans audios/{cle} :
// { url, source: "storage" | "drive" | "lien", chemin?, duree? (s), date, auteur }.
// Clés : « FISC-F11 » (leçon du Code des impôts), « FICHE-41 » (fiche du guide des comptes), « MOD-<id> » (module de cours).
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

export const cleFisc = id => `FISC-${id}`;
export const cleFiche = c => `FICHE-${c}`;
export const cleModule = id => `MOD-${id}`;

// Lien collé → lecture : audio direct (<audio>) ou lecteur Google Drive (iframe d'aperçu)
export function lectureVoix(url) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) return null;
  const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  if (m) return { mode: "drive", src: `https://drive.google.com/file/d/${m[1]}/preview` };
  return { mode: "audio", src: u };
}

// Extension du fichier enregistré selon le format proposé par le navigateur
export const extensionAudio = type => (/mp4|aac|m4a/i.test(type) ? "m4a" : /ogg/i.test(type) ? "ogg" : /mpeg|mp3/i.test(type) ? "mp3" : "webm");
export const formatDuree = s => { const t = Math.max(0, Math.round(s || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

// Abonnement à l'enregistrement d'un contenu (null tant qu'il n'y en a pas)
export function useVoix(db, cle) {
  const [voix, sVoix] = useState(null);
  useEffect(() => {
    sVoix(null);
    if (!db || !cle) return;
    return onSnapshot(doc(db, "audios", cle), d => sVoix(d.exists() ? { id: d.id, ...d.data() } : null), () => sVoix(null));
  }, [db, cle]);
  return voix;
}
