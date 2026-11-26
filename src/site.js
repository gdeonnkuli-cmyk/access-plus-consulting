// ══════════════════ ADRESSE DU SITE ET CONTACT (UN SEUL ENDROIT À MODIFIER) ══════════════════
// Bascule vers le domaine professionnel : quand ecocampus-rdc.com sert l'application (Firebase Hosting) et que
// contact@ecocampus-rdc.com reçoit les e-mails (Cloudflare Email Routing), passer BASCULE à true.
// Les pages statiques de public/ (confidentialité, suppression de compte) sont mises à jour en même temps (docs/domaine.md).
// CommonJS : lu aussi par les tâches serveur (functions/taches.js) pour les liens des notifications.
const DOMAINE = "ecocampus-rdc.com";
const BASCULE = true;
const SITE_URL = BASCULE ? `https://${DOMAINE}` : "https://eco-campus-rdc.vercel.app";
const SITE_LABEL = SITE_URL.replace(/^https:\/\//, "");
const CONTACT_EMAIL = BASCULE ? `contact@${DOMAINE}` : "gnkuli@outlook.fr";

// Application servie depuis le domaine professionnel (ou un de ses sous-domaines, ex. www)
const surDomainePro = (hote = typeof window !== "undefined" ? window.location.hostname : "") =>
  hote === DOMAINE || hote.endsWith(`.${DOMAINE}`);

module.exports = { DOMAINE, BASCULE, SITE_URL, SITE_LABEL, CONTACT_EMAIL, surDomainePro };
