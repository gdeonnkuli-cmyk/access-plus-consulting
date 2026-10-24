// ══════════════ PRÉSENTATIONS : LIEN D'INTÉGRATION SELON L'HÉBERGEUR ══════════════
// Google Slides, fichier Drive (PowerPoint/PDF), Canva, OneDrive / PowerPoint en ligne.
// OneDrive refuse d'être affiché dans une page (« onedrive.live.com n'autorise pas la connexion ») avec un simple
// lien de partage : il faut son lien d'intégration (PowerPoint en ligne → Fichier → Partager → Incorporer).
// On accepte aussi le code <iframe …> copié tel quel depuis « Incorporer ».

// Code d'intégration collé → adresse src ; sinon l'adresse telle quelle
export const srcIframe = u => {
  const t = String(u || "").trim();
  const m = t.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (m ? m[1] : t).replace(/&amp;/g, "&").trim();
};

export const estOneDrive = u => /onedrive\.live\.com|1drv\.ms|sharepoint\.com|onedrive\.com|officeapps\.live\.com/i.test(u || "");

// → { src, hebergeur } ; src = null quand le lien ne peut pas être affiché dans l'application
export function embedPresentation(brut) {
  const u = srcIframe(brut);
  if (!/^https?:\/\//i.test(u)) return { src: null, hebergeur: null };
  let m = u.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  // Fichier PowerPoint stocké dans Drive (ouvert dans Slides : « rtpof=true ») : le lecteur Slides intégré ne l'affiche pas, l'aperçu Drive oui
  if (m && /[?&]rtpof=true/i.test(u)) return { src: `https://drive.google.com/file/d/${m[1]}/preview`, hebergeur: "google" };
  if (m) return { src: `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=3000`, hebergeur: "google" };
  m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  if (m) return { src: `https://drive.google.com/file/d/${m[1]}/preview`, hebergeur: "google" };
  if (/canva\.com/i.test(u)) return { src: u, hebergeur: "canva" };
  if (estOneDrive(u)) {
    if (/onedrive\.live\.com\/embed|officeapps\.live\.com\/op\/embed|[?&]action=embedview/i.test(u)) return { src: u, hebergeur: "onedrive" };
    let q = null;
    try { q = new URL(u).searchParams; } catch (e) { q = null; }
    const resid = q && (q.get("resid") || (q.get("id") && q.get("id").includes("!") ? q.get("id") : null));
    if (/onedrive\.live\.com/i.test(u) && resid) {
      const authkey = q.get("authkey");
      return { src: `https://onedrive.live.com/embed?resid=${encodeURIComponent(resid)}${authkey ? `&authkey=${encodeURIComponent(authkey)}` : ""}&em=2`, hebergeur: "onedrive" };
    }
    if (/sharepoint\.com\/.*\/Doc\.aspx/i.test(u)) return { src: `${u}${u.includes("?") ? "&" : "?"}action=embedview`, hebergeur: "onedrive" };
    return { src: null, hebergeur: "onedrive" };
  }
  return { src: u, hebergeur: "autre" };
}
