// Modules « Code des impôts RDC expliqué » (contenu : voir le format décrit dans CodeImpots.jsx).
// F1 est en accès libre ; F2 à F11 sont réservés aux abonnés. F10 : import-export ; F11 : paie en RDC.
import F1 from "./F1";
import F2 from "./F2";
import F3 from "./F3";
import F4 from "./F4";
import F5 from "./F5";
import F6 from "./F6";
import F7 from "./F7";
import F8 from "./F8";
import F9 from "./F9";
import F10 from "./F10";
import F11 from "./F11";

export const MODULES_FISC = [F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11].map(m => ({ ...m, libre: m.id === "F1" }));
