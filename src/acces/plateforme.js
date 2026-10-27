// ══════════════ VERSION PLAY STORE (application Android) ══════════════
// L'application du Play Store est une Trusted Web Activity qui ouvre le site sur /?source=android.
// Les règles de Google Play interdisent d'y proposer un paiement extérieur pour des contenus numériques :
// dans cette version, l'accès s'active uniquement par code (ni tarifs, ni Mobile Money, ni offres de prix).
// Le repère est conservé sur l'appareil pour les navigations suivantes ; /?source=web le retire.

const CLE = "ec_play";
const REFERENT = /^android-app:\/\/cd\.ecocampus\.rdc/i;

export function detecterPlayStore(search = "", referrer = "", stockage = null) {
  const source = new URLSearchParams(search).get("source");
  const vu = source === "android" || REFERENT.test(referrer || "");
  try {
    if (stockage) {
      if (vu) stockage.setItem(CLE, "1");
      else if (source === "web") stockage.removeItem(CLE);
      return stockage.getItem(CLE) === "1";
    }
  } catch (e) { /* stockage indisponible : on s'en tient à l'adresse */ }
  return vu;
}

const navigateur = typeof window !== "undefined";
let stockage = null;
try { stockage = navigateur ? window.localStorage : null; } catch (e) { stockage = null; }
export const PLAY_STORE = navigateur ? detecterPlayStore(window.location.search, document.referrer, stockage) : false;

// Libellés des boutons d'accès : dans la version Play Store, on active un code
export const LIB_ACCES = PLAY_STORE ? "Activer mon accès" : "Obtenir l'accès";

// Messages de la bannière qui parlent de prix ou mènent aux offres : retirés de la version Play Store
export const parlePrix = m => /\{[mta]\}|\$|USD|\bprix\b|tarif/i.test(`${m.titre || ""} ${m.texte || ""}`) || m.vue === "acces";
