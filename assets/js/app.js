/* ==========================================================================
   Homelia — couche applicative : comptes, annonces, favoris, messages
   Nécessite supabase-js (chargé depuis le CDN) et supabase-config.js.
   Tout est optionnel : sans configuration, le site reste un site statique.
   ========================================================================== */
window.Homelia = (function () {
  "use strict";

  var cfg = window.HOMELIA_SUPABASE || {};
  var actif = Boolean(cfg.url && cfg.anonKey && window.supabase);
  var db = actif ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
  var session = null, profil = null;
  var abonnes = [];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  function echappe(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function date(v) {
    try {
      return new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return ""; }
  }

  /* ---------------- session ---------------- */
  function estResponsable() { return Boolean(profil && profil.role === "responsable"); }
  function utilisateur() { return session ? session.user : null; }

  function prevenir() { abonnes.forEach(function (f) { try { f(session, profil); } catch (e) {} }); }
  function auChangement(f) { abonnes.push(f); f(session, profil); }

  async function chargerProfil() {
    profil = null;
    if (!session) return;
    var r = await db.from("profils").select("*").eq("id", session.user.id).maybeSingle();
    profil = r.data || null;
  }

  /* ---------------- reprise des annonces sur les pages publiques ---------------- */
  function diapo(a, premiere) {
    var specs = (a.specs || []).slice(0, 3).join(" · ");
    return '<article class="slide' + (premiere ? " on" : "") + '" role="tabpanel" aria-hidden="'
      + (premiere ? "false" : "true") + '" aria-label="' + echappe(a.nom + " à " + a.ville) + '">'
      + '<img src="' + echappe(image(a)) + '" alt="' + echappe(a.nom + " à " + a.ville + " (" + a.departement + ")") + '"'
      + (premiere ? "" : ' loading="lazy"') + ">"
      + '<span class="hero-tag">' + echappe(a.statut) + " · " + echappe(a.typologies || "") + "</span>"
      + '<div class="hero-ann"><div><h2>' + echappe(a.nom) + "</h2>"
      + '<div class="loc"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z"/><circle cx="12" cy="11" r="2.5"/></svg>'
      + echappe(a.ville) + " · " + echappe(a.departement_nom || "") + " (" + echappe(a.departement) + ")</div>"
      + '<p class="meta">' + echappe(specs) + "</p></div>"
      + '<div class="tarif"><b class="tabnum">' + echappe(a.prix || "Nous consulter") + "</b><span>"
      + echappe(a.prix_libelle || "") + "</span></div>"
      + '<a class="btn" href="' + lien(a) + "\">Voir l'annonce "
      + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a>'
      + "</div></article>";
  }

  async function reprendreAnnonces() {
    var rotator = $("#heroRotator"), liste = $("#liste");
    if (!rotator && !liste) return;
    var toutes = await annonces();
    if (!toutes || !toutes.length) return;

    if (rotator) {
      var avant = toutes.filter(function (a) { return a.mis_en_avant; });
      if (!avant.length) avant = toutes.slice(0, 5);
      $$(".slide", rotator).forEach(function (sl) { sl.remove(); });
      rotator.insertAdjacentHTML("afterbegin", avant.map(function (a, i) { return diapo(a, i === 0); }).join(""));
      if (window.homeliaInitRotator) window.homeliaInitRotator();
    }

    if (liste) {
      var connus = $$("[data-slug]", liste).map(function (el) { return el.dataset.slug; });
      var nouvelles = toutes.filter(function (a) { return connus.indexOf(a.slug) === -1; });
      nouvelles.forEach(function (a) {
        var bloc = document.createElement("div");
        bloc.dataset.tags = "d" + a.departement;
        bloc.dataset.slug = a.slug;
        bloc.innerHTML = carte(a);
        liste.appendChild(bloc);
      });
      var compteur = $("#count");
      if (compteur && nouvelles.length) compteur.textContent = connus.length + nouvelles.length;
    }
  }

  async function init() {
    if (!actif) { majEntete(); return; }
    var r = await db.auth.getSession();
    session = r.data.session;
    await chargerProfil();
    majEntete();
    prevenir();
    reprendreAnnonces();
    db.auth.onAuthStateChange(async function (_e, s) {
      session = s;
      await chargerProfil();
      majEntete();
      prevenir();
    });
  }

  /* ---------------- en-tête : bouton compte ---------------- */
  function majEntete() {
    $$("[data-compte]").forEach(function (el) {
      if (!actif) { el.hidden = true; return; }
      el.hidden = false;
      if (session) {
        var nom = (profil && profil.nom) || session.user.email.split("@")[0];
        el.textContent = estResponsable() ? "Administration" : "Mon espace";
        el.href = estResponsable() ? "/admin.html" : "/espace.html";
        el.title = nom;
      } else {
        el.textContent = "Connexion";
        el.href = "/connexion.html";
      }
    });
  }

  /* ---------------- annonces ---------------- */
  async function annonces(options) {
    options = options || {};
    if (!actif) return null;
    var r = db.from("annonces").select("*").order("ordre").order("nom");
    if (options.misEnAvant) r = db.from("annonces").select("*").eq("mis_en_avant", true).order("ordre");
    if (!options.toutes) r = r.eq("publiee", true);
    var res = await r;
    if (res.error) { console.warn("Annonces indisponibles :", res.error.message); return null; }
    return res.data;
  }

  async function annonce(slug) {
    if (!actif) return null;
    var r = await db.from("annonces").select("*").eq("slug", slug).maybeSingle();
    return r.data;
  }

  function lien(a) { return a.page_statique || ("/annonce.html?a=" + encodeURIComponent(a.slug)); }

  function image(a) {
    return a.image_url || "/assets/img/communay-1.jpg";
  }

  /* ---------------- favoris ---------------- */
  async function mesFavoris() {
    if (!actif || !session) return [];
    var r = await db.from("favoris").select("annonce, cree_le, annonces(*)").order("cree_le", { ascending: false });
    return (r.data || []).map(function (f) { return f.annonces; }).filter(Boolean);
  }

  async function estFavori(id) {
    if (!actif || !session) return false;
    var r = await db.from("favoris").select("annonce").eq("annonce", id).maybeSingle();
    return Boolean(r.data);
  }

  async function basculerFavori(id) {
    if (!session) { window.location.href = "/connexion.html?retour=" + encodeURIComponent(location.pathname + location.search); return null; }
    var deja = await estFavori(id);
    if (deja) { await db.from("favoris").delete().eq("annonce", id); return false; }
    await db.from("favoris").insert({ utilisateur: session.user.id, annonce: id });
    return true;
  }

  /* ---------------- messages ---------------- */
  async function envoyerMessage(m) {
    if (!actif) return { error: { message: "Messagerie non configurée" } };
    m.utilisateur = session ? session.user.id : null;
    return await db.from("messages").insert(m);
  }

  async function mesMessages() {
    if (!actif || !session) return [];
    var r = await db.from("messages").select("*, annonces(nom, ville)").order("cree_le", { ascending: false });
    return r.data || [];
  }

  async function tousLesMessages() {
    if (!actif || !estResponsable()) return [];
    var r = await db.from("messages").select("*, annonces(nom, ville)").order("cree_le", { ascending: false });
    return r.data || [];
  }

  /* ---------------- authentification ---------------- */
  async function connexion(email, mdp) { return await db.auth.signInWithPassword({ email: email, password: mdp }); }
  async function inscription(email, mdp, nom, tel) {
    return await db.auth.signUp({ email: email, password: mdp, options: { data: { nom: nom, telephone: tel } } });
  }
  async function motDePasseOublie(email) {
    return await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/connexion.html?reinit=1" });
  }
  async function deconnexion() { await db.auth.signOut(); window.location.href = "/index.html"; }
  async function majCompte(champs) { return await db.auth.updateUser(champs); }

  /* ---------------- carte d'annonce (réutilisée partout) ---------------- */
  function carte(a, options) {
    options = options || {};
    var specs = (a.specs || []).slice(0, 4).map(function (s) { return "<span>" + echappe(s) + "</span>"; }).join("");
    var coeur = options.favori
      ? '<button class="fav" type="button" data-fav="' + a.id + '" aria-label="Ajouter aux favoris">'
        + '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-9.4A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.6C19 15.4 12 20 12 20z"/></svg></button>'
      : "";
    return '<a class="card" href="' + lien(a) + '">'
      + '<div class="card-img"><span class="chip">' + echappe(a.statut) + " · " + echappe(a.typologies || "") + "</span>" + coeur
      + '<img src="' + echappe(image(a)) + '" alt="' + echappe(a.nom + " à " + a.ville) + '" loading="lazy"></div>'
      + '<div class="card-bar"><div><h3>' + echappe(a.nom) + "</h3>"
      + '<div class="loc"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z"/><circle cx="12" cy="11" r="2.5"/></svg>'
      + echappe(a.ville) + " · " + echappe(a.departement_nom || "") + " (" + echappe(a.departement) + ")</div></div>"
      + '<span class="price">' + echappe(a.prix || "Nous consulter") + "<small>" + echappe(a.prix_libelle || "") + "</small></span></div>"
      + '<div class="card-specs">' + specs + "</div></a>";
  }

  return {
    actif: actif, db: db, init: init, auChangement: auChangement,
    utilisateur: utilisateur, profil: function () { return profil; }, estResponsable: estResponsable,
    annonces: annonces, annonce: annonce, reprendreAnnonces: reprendreAnnonces, lien: lien, image: image, carte: carte,
    mesFavoris: mesFavoris, estFavori: estFavori, basculerFavori: basculerFavori,
    envoyerMessage: envoyerMessage, mesMessages: mesMessages, tousLesMessages: tousLesMessages,
    connexion: connexion, inscription: inscription, motDePasseOublie: motDePasseOublie,
    deconnexion: deconnexion, majCompte: majCompte,
    echappe: echappe, date: date, $: $, $$: $$
  };
})();

document.addEventListener("DOMContentLoaded", function () { window.Homelia.init(); });
