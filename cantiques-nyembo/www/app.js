import * as store from "./store.js";
import { ACCES_LIBRE, CONTACT } from "./firebase-config.js";

const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[’'`´]/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

// ── Préférences (localStorage, facultatif) ──────────────────────────────────
const prefs = (() => {
  let p = {};
  try { p = JSON.parse(localStorage.getItem("nyembo-prefs") || "{}"); } catch {}
  const save = () => { try { localStorage.setItem("nyembo-prefs", JSON.stringify(p)); } catch {} };
  return {
    get: (k, d) => (k in p ? p[k] : d),
    set: (k, v) => { p[k] = v; save(); },
  };
})();

let HYMNS = [];
let BY_N = new Map();
let SECTIONS = [];
let AUDIO = []; // enregistrements publiés (ou locaux)
let audioCount = new Map();
const state = { q: "", section: "", audioOnly: false };

// ── Accès : limité sans code, complet avec un code (ou pour un responsable) ──
let isAdminUser = false;
const accesCode = () => prefs.get("acces", null)?.code || "";
const accesComplet = () => store.getMode() !== "firebase" || isAdminUser || !!accesCode();
const verrouille = (h) => !accesComplet() && h.n > ACCES_LIBRE.cantiquesMax;
const ecoutePermise = () => accesComplet() || ACCES_LIBRE.ecouteAudio;

// ── Démarrage ──────────────────────────────────────────────────────────────
applyTheme(prefs.get("theme", ""));
document.documentElement.style.setProperty("--lyrics", prefs.get("taille", 1.15) + "rem");

(async function start() {
  const [data] = await Promise.all([fetch("data/cantiques.json").then((r) => r.json()), store.init()]);
  HYMNS = data;
  for (const h of HYMNS) {
    BY_N.set(h.n, h);
    h._t = norm(h.titre);
    h._x = norm(h.parties.map((p) => p.texte).join(" "));
    if (h.section && !SECTIONS.includes(h.section)) SECTIONS.push(h.section);
  }
  await refreshAudio();
  if (store.getMode() === "firebase") {
    store.onAdmin((admin) => { const was = isAdminUser; isAdminUser = !!admin; if (was !== isAdminUser) route(); });
    // Vérifie en arrière-plan qu'un code activé est toujours valable (révocation par le responsable)
    if (accesCode()) store.checkCode(accesCode()).then((ok) => {
      if (ok === false) { prefs.set("acces", null); toast("Votre code d'accès n'est plus valable."); route(); }
    });
  }
  window.addEventListener("hashchange", route);
  route();
  setTimeout(() => $("#splash").classList.add("out"), 350);
  // Service worker uniquement sur le web : dans l'application Android/iPhone, tout est déjà embarqué
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !window.Capacitor?.isNativePlatform?.()) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();

async function refreshAudio() {
  try { AUDIO = await store.listPublished(); } catch (e) { console.warn(e); AUDIO = []; }
  audioCount = new Map();
  for (const a of AUDIO) audioCount.set(a.cantique, (audioCount.get(a.cantique) || 0) + 1);
}

// ── Routage ────────────────────────────────────────────────────────────────
function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [page, arg] = h.split("/");
  let tab = "liste";
  if (page === "c" && BY_N.has(+arg)) renderHymn(+arg);
  else if (page === "favoris") { tab = "favoris"; renderFavs(); }
  else if (page === "audio") { tab = "audio"; renderAudio(); }
  else if (page === "admin") { tab = "admin"; renderAdmin(); }
  else if (page === "apropos") { tab = "apropos"; renderAbout(); }
  else renderList();
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  if (page !== "") window.scrollTo(0, 0);
}

// ── Liste & recherche ──────────────────────────────────────────────────────
function search() {
  const q = norm(state.q);
  let res = HYMNS;
  if (state.section) res = res.filter((h) => h.section === state.section);
  if (state.audioOnly) res = res.filter((h) => audioCount.has(h.n));
  if (!q) return res.map((h) => ({ h }));
  const out = [];
  const isNum = /^\d+$/.test(q);
  for (const h of res) {
    let score = 0;
    if (isNum && String(h.n) === q) score = 100;
    else if (isNum && String(h.n).startsWith(q)) score = 50;
    else if (h._t.startsWith(q)) score = 40;
    else if (h._t.includes(q)) score = 30;
    else if (h._x.includes(q)) score = 10;
    else if (norm(h.melodie).includes(q) || norm(h.auteur).includes(q)) score = 5;
    if (score) out.push({ h, score, snip: score === 10 ? snippet(h, q) : "" });
  }
  return out.sort((a, b) => b.score - a.score || a.h.n - b.h.n);
}

function snippet(h, q) {
  for (const p of h.parties) for (const line of p.texte.split("\n")) if (norm(line).includes(q)) return line;
  return "";
}

function hl(text, q) {
  if (!q) return esc(text);
  const words = norm(q).split(" ").filter((w) => w.length > 1);
  if (!words.length) return esc(text);
  // surlignage tolérant aux accents : on compare sur la version normalisée caractère par caractère
  const src = String(text);
  const flat = [...src].map((c) => norm(c) || " ").join("");
  const marks = new Array(src.length).fill(false);
  for (const w of words) {
    let i = flat.indexOf(w);
    while (i >= 0) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = flat.indexOf(w, i + w.length); }
  }
  let out = "", on = false;
  [...src].forEach((c, i) => {
    if (marks[i] !== on) { out += marks[i] ? "<mark>" : "</mark>"; on = marks[i]; }
    out += esc(c);
  });
  return out + (on ? "</mark>" : "");
}

function itemHTML({ h, snip }, q) {
  const fav = isFav(h.n) ? "★" : "";
  const n = audioCount.get(h.n);
  const sub = snip ? hl(snip, q) : esc(h.melodie || h.section || "");
  return `<li><a href="#/c/${h.n}">
    <span class="num">${h.n}</span>
    <span class="li-main"><div class="li-title">${hl(h.titre, q)}</div><div class="li-sub">${sub}</div></span>
    <span class="li-badges">${verrouille(h) ? `<span title="Accès complet requis">🔒</span>` : ""}${n ? `<span title="${n} enregistrement(s)">♪</span>` : ""}${fav}</span>
  </a></li>`;
}

function renderList() {
  view.innerHTML = `
    <div class="search"><input id="q" type="search" placeholder="Numéro, titre ou paroles…" value="${esc(state.q)}" autocomplete="off" enterkeyhint="search" aria-label="Rechercher un cantique"></div>
    <div class="filters">
      <select id="sec" aria-label="Rubrique">
        <option value="">Toutes les rubriques</option>
        ${SECTIONS.map((s) => `<option ${s === state.section ? "selected" : ""}>${esc(s)}</option>`).join("")}
      </select>
      <button class="chip" id="aud" aria-pressed="${state.audioOnly}">♪ Avec audio</button>
    </div>
    <p class="count" id="count"></p>
    <div id="results"></div>`;
  const draw = () => {
    const res = search();
    $("#count").textContent = `${res.length} cantique${res.length > 1 ? "s" : ""}`;
    if (!res.length) { $("#results").innerHTML = `<div class="empty">Aucun cantique trouvé.</div>`; return; }
    const grouped = !state.q && !state.section;
    let html = "", cur = null, open = false;
    for (const r of res) {
      const s = r.h.section || "";
      if (grouped && s !== cur) {
        if (open) html += "</ul>";
        if (s) html += `<h3 class="section-head">${esc(s)}</h3>`;
        html += `<ul class="list">`; open = true; cur = s;
      } else if (!open) { html += `<ul class="list">`; open = true; }
      html += itemHTML(r, state.q);
    }
    $("#results").innerHTML = html + (open ? "</ul>" : "");
  };
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; draw(); });
  $("#q").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && /^\d+$/.test(state.q.trim()) && BY_N.has(+state.q)) location.hash = `#/c/${+state.q}`;
  });
  $("#sec").addEventListener("change", (e) => { state.section = e.target.value; draw(); });
  $("#aud").addEventListener("click", (e) => {
    state.audioOnly = !state.audioOnly; e.currentTarget.setAttribute("aria-pressed", state.audioOnly); draw();
  });
  draw();
}

// ── Favoris ────────────────────────────────────────────────────────────────
const favs = () => prefs.get("favoris", []);
const isFav = (n) => favs().includes(n);
function toggleFav(n) {
  const f = favs();
  prefs.set("favoris", f.includes(n) ? f.filter((x) => x !== n) : [...f, n].sort((a, b) => a - b));
  return isFav(n);
}
function renderFavs() {
  const list = favs().map((n) => BY_N.get(n)).filter(Boolean);
  view.innerHTML = `<h1 class="page-title">Mes favoris</h1>` + (list.length
    ? `<ul class="list">${list.map((h) => itemHTML({ h })).join("")}</ul>`
    : `<div class="empty">Aucun favori pour l'instant.<br>Touchez ☆ sur un cantique pour l'ajouter ici.</div>`);
}

// ── Cantique ───────────────────────────────────────────────────────────────
function renderHymn(n) {
  const h = BY_N.get(n);
  if (verrouille(h)) return renderLocked(h);
  const prev = BY_N.get(n - 1), next = BY_N.get(n + 1);
  const body = h.parties.map((p) => p.type === "strophe"
    ? `<div class="stanza"><span class="sn">${p.n}</span><p>${esc(p.texte)}</p></div>`
    : `<div class="refrain"><p>${esc(p.texte)}</p></div>`).join("");
  view.innerHTML = `
    <div class="hymn-head">
      <span class="hymn-num">CANTIQUE ${h.n}</span>
      <h1 class="hymn-title">${esc(h.titre)}</h1>
      <div class="hymn-meta">${esc(h.melodie)}${h.section ? `<br>${esc(h.section)}` : ""}</div>
    </div>
    <div class="toolbar">
      <button class="tool" id="t-minus" aria-label="Réduire le texte">A−</button>
      <button class="tool" id="t-plus" aria-label="Agrandir le texte">A+</button>
      <button class="tool ${isFav(n) ? "on" : ""}" id="t-fav">${isFav(n) ? "★ Favori" : "☆ Favori"}</button>
      <button class="tool" id="t-share">Partager</button>
    </div>
    <article class="lyrics">${body}${h.auteur ? `<div class="author">${esc(h.auteur)}</div>` : ""}</article>
    <section class="card" id="audio-card"></section>
    <nav class="pager">
      <a href="#/c/${n - 1}" ${prev ? "" : 'aria-disabled="true"'}>‹ ${prev ? prev.n : ""}</a>
      <a href="#/c/${n + 1}" ${next ? "" : 'aria-disabled="true"'}>${next ? next.n : ""} ›</a>
    </nav>`;
  const size = (d) => {
    const v = Math.min(2, Math.max(0.85, +(prefs.get("taille", 1.15) + d).toFixed(2)));
    prefs.set("taille", v); document.documentElement.style.setProperty("--lyrics", v + "rem");
  };
  $("#t-minus").onclick = () => size(-0.1);
  $("#t-plus").onclick = () => size(0.1);
  $("#t-fav").onclick = (e) => {
    const on = toggleFav(n);
    e.currentTarget.classList.toggle("on", on);
    e.currentTarget.textContent = on ? "★ Favori" : "☆ Favori";
  };
  $("#t-share").onclick = () => shareHymn(h);
  renderAudioCard(h);
  swipe(n);
}

function renderAudioCard(h) {
  const recs = AUDIO.filter((a) => a.cantique === h.n);
  const local = store.getMode() === "local";
  if (recs.length && !ecoutePermise()) {
    $("#audio-card").innerHTML = `
      <div class="card-head"><div><h2>Sons & enregistrements</h2>
        <span class="muted" style="font-size:.85rem">🔒 ${recs.length} son${recs.length > 1 ? "s" : ""} — écoute réservée à l'accès complet</span></div>
        <a class="btn primary small" href="#/apropos">Activer un code</a></div>
      <div class="rec-actions"><button class="btn ghost small" id="btn-up">＋ Envoyer un son</button></div>`;
    $("#btn-up").onclick = () => openUpload(h);
    return;
  }
  $("#audio-card").innerHTML = `
    <div class="card-head">
      <div><h2>Sons & enregistrements</h2>
      <span class="muted" style="font-size:.85rem">${recs.length ? `${recs.length} disponible${recs.length > 1 ? "s" : ""}` : "Aucun son pour ce cantique."}</span></div>
      <button class="btn primary small" id="btn-up">＋ Envoyer un son</button>
    </div>
    ${recs.length ? `<ul class="rec-list">${recs.map((r) => recHTML(r)).join("")}</ul>` : ""}
    ${local ? `<p class="rec-note">Mode local : les sons restent sur cet appareil tant que le partage n'est pas activé.</p>` : ""}`;
  $("#btn-up").onclick = () => openUpload(h);
}

function recHTML(r, opts = {}) {
  const meta = [store.TYPES[r.type] || r.type, r.voix].filter(Boolean);
  const d = store.dateOf(r);
  return `<li class="rec-item" data-id="${esc(r.id)}">
    <div class="rec-top">
      ${opts.showHymn ? `<a class="tag gold" href="#/c/${r.cantique}">N° ${r.cantique}</a>` : ""}
      ${meta.map((m, i) => `<span class="tag ${i ? "gold" : ""}">${esc(m)}</span>`).join("")}
      <span>${esc(r.contributeur)}</span>
      ${opts.showStatus ? `<span class="tag ${{ en_attente: "warn", rejete: "bad", approuve: "ok" }[r.statut] || ""}">${esc(store.STATUTS[r.statut] || r.statut)}</span>` : ""}
      <span class="muted" style="font-size:.78rem;margin-left:auto">${isNaN(d) ? "" : d.toLocaleDateString("fr-FR")}</span>
    </div>
    <audio controls preload="none" src="${esc(r.url)}"></audio>
    ${r.note ? `<p class="rec-note">${esc(r.note)}</p>` : ""}
    ${opts.actions || ""}
  </li>`;
}

async function shareHymn(h) {
  const url = location.href;
  const text = `Cantique ${h.n} — ${h.titre}`;
  try {
    if (navigator.share) await navigator.share({ title: text, text, url });
    else { await navigator.clipboard.writeText(`${text}\n${url}`); toast("Lien copié."); }
  } catch {}
}

function swipe(n) {
  let x0 = null, y0 = null;
  const art = $(".lyrics");
  art.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  art.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 80 && Math.abs(dx) > 2 * Math.abs(dy)) {
      const t = n + (dx < 0 ? 1 : -1);
      if (BY_N.has(t)) location.hash = `#/c/${t}`;
    }
    x0 = null;
  });
}

// ── Onglet Audio ───────────────────────────────────────────────────────────
function renderAudio() {
  const local = store.getMode() === "local";
  if (!ecoutePermise()) {
    view.innerHTML = `<h1 class="page-title">Enregistrements</h1>${lockCard("L'écoute des enregistrements est réservée à l'accès complet.")}`;
    bindCodeForm();
    return;
  }
  view.innerHTML = `<h1 class="page-title">Enregistrements</h1>
    ${local ? `<div class="notice">Mode local : seuls les sons enregistrés sur cet appareil apparaissent. Activez le partage (Firebase) pour que chacun profite des envois validés.</div>` : ""}
    ${AUDIO.length
      ? `<div class="card" style="margin-top:0"><ul class="rec-list">${AUDIO.map((r) => recHTML(r, { showHymn: true })).join("")}</ul></div>`
      : `<div class="empty">Aucun enregistrement pour le moment.<br>Ouvrez un cantique puis touchez « Envoyer un son ».</div>`}`;
}

// ── Onglet Gestion (modération) ────────────────────────────────────────────
let adminTab = "en_attente";
function renderAdmin() {
  if (store.getMode() === "local") return renderLocalAdmin();
  view.innerHTML = `<h1 class="page-title">Gestion des envois</h1><div id="adm">Chargement…</div>`;
  store.onAdmin((admin, user) => {
    if (!location.hash.startsWith("#/admin")) return;
    const box = $("#adm");
    if (!box) return;
    if (!admin) {
      box.innerHTML = `
        ${user && !user.isAnonymous ? `<div class="notice">Le compte ${esc(user.email)} n'est pas autorisé à modérer.</div>` : ""}
        <p class="muted">Réservé aux responsables du recueil : validation des sons envoyés avant publication.</p>
        <form class="login" id="login">
          <label>E-mail <input name="email" type="email" required autocomplete="username"></label>
          <label>Mot de passe <input name="mdp" type="password" required autocomplete="current-password"></label>
          <button class="btn primary">Se connecter</button>
          <p class="form-msg err"></p>
        </form>`;
      $("#login").onsubmit = async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        try { await store.signIn(f.get("email"), f.get("mdp")); }
        catch { $(".form-msg", e.target).textContent = "Identifiants incorrects."; }
      };
      return;
    }
    drawAdmin(admin);
  });
}

async function drawAdmin(admin) {
  const box = $("#adm");
  box.innerHTML = `
    <div class="filters">
      ${Object.entries({ en_attente: "En attente", approuve: "Publiés", rejete: "Rejetés", codes: "Codes d'accès" })
        .map(([k, v]) => `<button class="chip" data-s="${k}" aria-pressed="${k === adminTab}">${v}</button>`).join("")}
      <button class="chip" id="logout" style="margin-left:auto">Déconnexion (${esc(admin.email)})</button>
    </div>
    <div class="card" style="margin-top:0"><ul class="rec-list" id="adm-list"><li class="muted">Chargement…</li></ul></div>`;
  box.querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { adminTab = b.dataset.s; drawAdmin(admin); }));
  $("#logout").onclick = () => store.signOut();
  if (adminTab === "codes") return drawCodes(admin);
  let recs = [];
  try { recs = await store.listByStatus(adminTab); }
  catch (e) { $("#adm-list").innerHTML = `<li class="form-msg err">Erreur : ${esc(e.message)}</li>`; return; }
  const actions = (r) => `<div class="rec-actions">
    ${r.statut !== "approuve" ? `<button class="btn ok small" data-a="approuve">✓ Publier</button>` : ""}
    ${r.statut !== "rejete" ? `<button class="btn ghost small" data-a="rejete">Rejeter</button>` : ""}
    <button class="btn danger small" data-a="suppr">Supprimer</button></div>`;
  $("#adm-list").innerHTML = recs.length
    ? recs.map((r) => recHTML(r, { showHymn: true, showStatus: true, actions: actions(r) })).join("")
    : `<li class="muted">Rien ici.</li>`;
  $("#adm-list").onclick = async (e) => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const r = recs.find((x) => x.id === b.closest("[data-id]").dataset.id);
    b.disabled = true;
    try {
      if (b.dataset.a === "suppr") {
        if (!confirm(`Supprimer définitivement le son de ${r.contributeur} (n° ${r.cantique}) ?`)) { b.disabled = false; return; }
        await store.remove(r);
      } else await store.setStatus(r.id, b.dataset.a);
      toast({ approuve: "Publié.", rejete: "Rejeté.", suppr: "Supprimé." }[b.dataset.a]);
      await refreshAudio();
      drawAdmin(admin);
    } catch (err) { toast("Erreur : " + err.message); b.disabled = false; }
  };
}

function renderLocalAdmin() {
  view.innerHTML = `<h1 class="page-title">Gestion</h1>
    <div class="notice">Le partage n'est pas encore activé : l'application fonctionne en mode local.
    Pour que les sons envoyés soient partagés (après validation) entre tous les utilisateurs,
    renseignez <code>firebase-config.js</code> (voir README).</div>
    <div class="card" style="margin-top:0"><h2>Sons enregistrés sur cet appareil</h2>
    <ul class="rec-list" id="adm-list">${AUDIO.length
      ? AUDIO.map((r) => recHTML(r, { showHymn: true, actions: `<div class="rec-actions"><button class="btn danger small" data-a="suppr">Supprimer</button></div>` })).join("")
      : `<li class="muted">Aucun son.</li>`}</ul></div>`;
  $("#adm-list").onclick = async (e) => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const r = AUDIO.find((x) => x.id === b.closest("[data-id]").dataset.id);
    if (!confirm("Supprimer ce son ?")) return;
    await store.remove(r); await refreshAudio(); renderLocalAdmin();
  };
}

// ── Envoi d'un son ─────────────────────────────────────────────────────────
const dlg = $("#dlg-upload");
const form = $("#form-upload");
let recBlob = null, recorder = null, recTimer = null, upHymn = null;

function openUpload(h) {
  upHymn = h;
  form.reset(); recBlob = null; stopRec(true);
  $("#rec-preview").hidden = true; $("#rec-time").textContent = "00:00";
  $("#src-fichier").hidden = false; $("#src-micro").hidden = true;
  $(".progress", form).hidden = true; msg("");
  $("#up-hymn").textContent = `Cantique ${h.n} — ${h.titre}`;
  const c = prefs.get("contributeur", "");
  if (c) form.contributeur.value = c;
  dlg.showModal();
}
form.addEventListener("change", (e) => {
  if (e.target.name === "source") {
    const micro = e.target.value === "micro";
    $("#src-fichier").hidden = micro; $("#src-micro").hidden = !micro;
  }
});
$("[data-close]", form).onclick = () => { stopRec(true); dlg.close(); };
dlg.addEventListener("close", () => stopRec(true));

$("#rec-btn").onclick = async () => {
  if (recorder?.state === "recording") return stopRec();
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return msg("L'enregistrement n'est pas pris en charge par ce navigateur. Utilisez un fichier.", true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t));
    recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (recorder._cancel) return;
      recBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const p = $("#rec-preview"); p.src = URL.createObjectURL(recBlob); p.hidden = false;
    };
    recorder.start();
    const t0 = Date.now();
    $("#rec-btn").classList.add("on"); $("#rec-btn").textContent = "■ Arrêter";
    recTimer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      $("#rec-time").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 250);
  } catch { msg("Accès au micro refusé.", true); }
};
function stopRec(cancel = false) {
  clearInterval(recTimer);
  $("#rec-btn").classList.remove("on"); $("#rec-btn").textContent = "● Enregistrer";
  if (recorder?.state === "recording") { recorder._cancel = cancel; recorder.stop(); }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const micro = f.get("source") === "micro";
  const file = form.fichier.files[0];
  const blob = micro ? recBlob : file;
  if (!blob) return msg(micro ? "Enregistrez d'abord un son." : "Choisissez un fichier audio.", true);
  if (blob.size > store.MAX_AUDIO_BYTES) return msg("Fichier trop lourd (25 Mo maximum).", true);
  const btn = $("[type=submit]", form);
  btn.disabled = true; msg("Envoi en cours…");
  const bar = $(".progress", form); bar.hidden = false;
  try {
    prefs.set("contributeur", f.get("contributeur"));
    const res = await store.submit({
      cantique: upHymn.n, type: f.get("type"), voix: f.get("voix"), contributeur: f.get("contributeur"),
      note: f.get("note"), blob, nomFichier: micro ? `enregistrement.${(blob.type.includes("mp4") ? "m4a" : "webm")}` : file.name,
    }, (p) => ($(".bar", bar).style.width = Math.round(p * 100) + "%"));
    dlg.close();
    toast(res.statut === "en_attente" ? "Merci ! Votre son sera publié après validation." : "Son enregistré sur cet appareil.");
    await refreshAudio();
    if (location.hash === `#/c/${upHymn.n}`) renderAudioCard(upHymn);
  } catch (err) {
    msg("Échec de l'envoi : " + (err.message || err), true);
  } finally { btn.disabled = false; }
});
function msg(t, err = false) { const m = $(".form-msg", form); m.textContent = t; m.classList.toggle("err", err); }

// ── Aller au numéro, thème, toast ──────────────────────────────────────────
const dGoto = $("#dlg-goto");
$("#btn-goto").onclick = () => { $("#goto-num").value = ""; dGoto.showModal(); };
dGoto.addEventListener("close", () => {
  const n = +$("#goto-num").value;
  if (dGoto.returnValue === "ok" && BY_N.has(n)) location.hash = `#/c/${n}`;
  else if (dGoto.returnValue === "ok") toast("Numéro introuvable (1 à 450).");
});

$("#btn-theme").onclick = () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  const t = dark ? "light" : "dark";
  prefs.set("theme", t); applyTheme(t);
};
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; }

let toastT;
function toast(t) {
  const el = $("#toast"); el.textContent = t; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 3200);
}

// ── Accès limité : écran de verrouillage et saisie du code ────────────────
function lockCard(raison) {
  return `<div class="card lock">
    <div class="lock-ico">🔒</div>
    <h2>Accès complet requis</h2>
    <p class="muted">${esc(raison)}</p>
    <p class="muted">Sans code, vous avez accès aux cantiques 1 à ${ACCES_LIBRE.cantiquesMax}.
      Un <strong>code d'accès</strong> personnel débloque les ${HYMNS.length} cantiques et les enregistrements, sans limite de durée.</p>
    <form class="code-form" id="code-form">
      <input name="code" placeholder="NYB-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" required>
      <button class="btn primary">Activer</button>
    </form>
    <p class="form-msg" id="code-msg" role="status"></p>
    <p class="muted" style="font-size:.85rem">Pas encore de code ? <a href="#/apropos">Contactez le responsable</a>.</p>
  </div>`;
}

function bindCodeForm() {
  const f = $("#code-form");
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const m = $("#code-msg"), b = $("button", f);
    b.disabled = true; m.classList.remove("err"); m.textContent = "Vérification…";
    try {
      const code = await store.activateCode(f.code.value);
      prefs.set("acces", { code, le: Date.now() });
      toast("Accès complet activé. Merci !");
      route();
    } catch (err) {
      m.classList.add("err");
      m.textContent = navigator.onLine === false ? "Pas de connexion internet. Réessayez une fois connecté." : (err.message || "Activation impossible.");
    } finally { b.disabled = false; }
  };
}

function renderLocked(h) {
  view.innerHTML = `
    <div class="hymn-head">
      <span class="hymn-num">CANTIQUE ${h.n}</span>
      <h1 class="hymn-title">${esc(h.titre)}</h1>
      <div class="hymn-meta">${esc(h.melodie)}</div>
    </div>
    ${lockCard(`Le cantique ${h.n} fait partie de l'accès complet.`)}
    <nav class="pager"><a href="#/">‹ Retour à la liste</a></nav>`;
  bindCodeForm();
}

// ── À propos ───────────────────────────────────────────────────────────────
function renderAbout() {
  const code = accesCode();
  const om = CONTACT.orangeMoney;
  view.innerHTML = `
    <div class="about-head">
      <img src="icons/logo-full.png" alt="Logo Nyembo" class="about-logo">
      <p class="muted">Recueil de cantiques · version ${esc(window.NYEMBO_VERSION || "1.0")}</p>
    </div>

    <section class="card">
      <h2>À propos</h2>
      <p>« Nyembo » réunit les <strong>${HYMNS.length} cantiques</strong> du recueil communautaire, conservés dans leur langue originale :
        paroles, mélodies, refrains et auteurs, consultables même sans connexion.</p>
      <p>L'application permet aussi aux chantres, solistes et chorales de <strong>partager des enregistrements</strong>
        (solo, pupitres, accompagnement) pour aider chacun à apprendre et à transmettre les chants.
        Chaque son est écouté et validé avant publication.</p>
      <p class="muted" style="margin-bottom:0">Chanter • Célébrer • Transmettre</p>
    </section>

    <section class="card">
      <h2>Mon accès</h2>
      ${accesComplet()
        ? `<p>✅ <strong>Accès complet</strong>${code ? ` — code <code>${esc(code)}</code>` : isAdminUser ? " — responsable" : ""}.</p>`
        : `<p>Accès limité : cantiques 1 à ${ACCES_LIBRE.cantiquesMax}${ACCES_LIBRE.ecouteAudio ? "" : ", sans écoute des enregistrements"}.</p>
           <form class="code-form" id="code-form">
             <input name="code" placeholder="NYB-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" required>
             <button class="btn primary">Activer</button>
           </form>
           <p class="form-msg" id="code-msg" role="status"></p>
           <p class="muted" style="font-size:.85rem">Pour obtenir votre code personnel, écrivez au responsable (ci-dessous).</p>`}
    </section>

    <section class="card">
      <h2>Soutenir le projet</h2>
      <p>Vous aimez cette application et souhaitez soutenir sa réalisation, son hébergement et ses mises à jour ?
        Toute contribution est la bienvenue, par <strong>Orange Money</strong> :</p>
      <div class="pay">
        <span class="pay-num">${esc(om.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3"))}</span>
        <button class="btn small" id="copy-om">Copier</button>
      </div>
      <p class="muted" style="font-size:.85rem;margin-bottom:0">Bénéficiaire : ${esc(CONTACT.auteur)}. Merci pour votre générosité 🙏</p>
    </section>

    <section class="card">
      <h2>Écrire au responsable</h2>
      <p>Une remarque, une correction de paroles, une proposition ou une demande de code d'accès ?</p>
      <a class="btn primary" href="mailto:${esc(CONTACT.email)}?subject=${encodeURIComponent("Cantiques Nyembo – remarque / proposition")}">✉️ ${esc(CONTACT.email)}</a>
    </section>

    <p class="muted" style="text-align:center;font-size:.8rem;margin:20px 0 4px">Conçu par ${esc(CONTACT.auteur)} · Kinshasa</p>`;
  $("#copy-om").onclick = async () => {
    try { await navigator.clipboard.writeText(om); toast("Numéro copié."); }
    catch { toast(om); }
  };
  bindCodeForm();
}

// ── Gestion des codes d'accès (responsable) ───────────────────────────────
async function drawCodes(admin) {
  const box = $("#adm-list").closest(".card");
  box.innerHTML = `
    <form class="code-gen" id="code-gen">
      <label>Nombre <input name="n" type="number" min="1" max="50" value="5"></label>
      <label>Pour (facultatif) <input name="note" maxlength="60" placeholder="Ex. : Chorale Saint-Paul"></label>
      <button class="btn primary">Générer</button>
    </form>
    <p class="muted" style="font-size:.85rem">Chaque code ne s'active que sur <strong>un seul téléphone</strong> et donne un accès complet illimité.
      « Libérer » permet de le réutiliser (changement de téléphone).</p>
    <ul class="rec-list" id="code-list"><li class="muted">Chargement…</li></ul>`;
  $("#code-gen").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, b = $("button", f);
    b.disabled = true;
    try {
      const codes = await store.generateCodes(Math.min(50, Math.max(1, +f.n.value || 1)), f.note.value.trim());
      toast(`${codes.length} code(s) créé(s).`);
      drawCodes(admin);
    } catch (err) { toast("Erreur : " + err.message); b.disabled = false; }
  };
  let codes = [];
  try { codes = await store.listCodes(); }
  catch (e) { $("#code-list").innerHTML = `<li class="form-msg err">Erreur : ${esc(e.message)}</li>`; return; }
  const libres = codes.filter((c) => !c.utilisePar).length;
  $("#code-list").innerHTML = codes.length
    ? `<li class="muted" style="font-size:.85rem">${codes.length} code(s) · ${libres} libre(s) · ${codes.length - libres} utilisé(s)</li>` +
      codes.map((c) => `<li class="rec-item" data-code="${esc(c.code)}">
        <div class="rec-top">
          <code class="code-val">${esc(c.code)}</code>
          <span class="tag ${c.utilisePar ? "warn" : "ok"}">${c.utilisePar ? "Utilisé" : "Libre"}</span>
          ${c.note ? `<span class="muted">${esc(c.note)}</span>` : ""}
          ${c.utiliseLe?.toDate ? `<span class="muted" style="font-size:.78rem;margin-left:auto">le ${c.utiliseLe.toDate().toLocaleDateString("fr-FR")}</span>` : ""}
        </div>
        <div class="rec-actions">
          <button class="btn small" data-a="partager">Partager</button>
          ${c.utilisePar ? `<button class="btn ghost small" data-a="liberer">Libérer</button>` : ""}
          <button class="btn danger small" data-a="suppr">Supprimer</button>
        </div></li>`).join("")
    : `<li class="muted">Aucun code pour l'instant.</li>`;
  $("#code-list").onclick = async (e) => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const code = b.closest("[data-code]").dataset.code;
    if (b.dataset.a === "partager") {
      const text = `Votre code d'accès à l'application Cantiques Nyembo : ${code}\nOuvrez l'application → « À propos » (ⓘ) → saisissez le code.`;
      try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast("Message copié."); } } catch {}
      return;
    }
    const q = b.dataset.a === "suppr" ? `Supprimer le code ${code} ? Le téléphone qui l'utilise perdra l'accès complet.`
      : `Libérer le code ${code} ? Le téléphone actuel perdra l'accès et le code pourra être réutilisé.`;
    if (!confirm(q)) return;
    b.disabled = true;
    try {
      await (b.dataset.a === "suppr" ? store.deleteCode(code) : store.resetCode(code));
      toast(b.dataset.a === "suppr" ? "Code supprimé." : "Code libéré.");
      drawCodes(admin);
    } catch (err) { toast("Erreur : " + err.message); b.disabled = false; }
  };
}
