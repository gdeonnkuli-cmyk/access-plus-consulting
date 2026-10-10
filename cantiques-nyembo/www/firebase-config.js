// ─────────────────────────────────────────────────────────────────────────────
// Configuration du stockage partagé des enregistrements audio.
//
// Tant que `firebaseConfig` est à null, l'application fonctionne en MODE LOCAL :
// les sons envoyés restent sur le téléphone de l'utilisateur (non partagés).
//
// Pour partager les sons entre tous les fidèles, créer un projet Firebase
// (voir README.md, section « Activer le partage »), puis coller ici l'objet
// de configuration fourni par la console Firebase.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = null;
/* Exemple :
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "cantiques-nyembo.firebaseapp.com",
  projectId: "cantiques-nyembo",
  storageBucket: "cantiques-nyembo.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx"
};
*/

// Comptes autorisés à valider / rejeter les envois (onglet « Gestion »).
// Doit correspondre à la liste déclarée dans firestore.rules et storage.rules.
export const ADMIN_EMAILS = ["gdeonnkuli@gmail.com"];

// Stockage des fichiers audio sur Cloudinary (offre gratuite, sans carte bancaire).
// Laisser à null pour utiliser Firebase Storage (formule Blaze requise).
// uploadPreset : préréglage « Unsigned » créé dans Cloudinary → Settings → Upload.
export const cloudinary = { cloudName: "o8shaqu1", uploadPreset: "nyembo_audio" };

// Taille maximale d'un fichier audio (octets).
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
