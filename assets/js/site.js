/* ==========================================================================
   Homelia — interactions du site
   ========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---- navigation : condensation, progression, parallaxe ---- */
  var nav = $("#nav"), progress = $("#progress");
  function onScroll() {
    /* menu ouvert : la page est figée, l'en-tête garde son état */
    if (document.documentElement.classList.contains("menu-ouvert")) return;
    if (nav) nav.classList.toggle("stuck", window.scrollY > 24);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();


  /* ---- annonces du hero : défilement automatique ---- */
  /* Les annonces sont remplacées par app.js dès que la base a répondu, ce qui
     relance ce carrousel. Chaque relance porte un numéro : les écouteurs posés
     sur document et window par les générations précédentes se taisent, sinon
     ils pilotaient des diapositives détachées et le hero restait figé. */
  var timer = null, generation = 0;
  window.homeliaInitRotator = function () {
    var rotator = $("#heroRotator");
    if (!rotator) return;
    clearTimeout(timer);
    var moi = ++generation;
    var perime = function () { return moi !== generation; };
    var slides = $$(".slide", rotator), dots = $("#hDots"),
        idx = 0, paused = reduce, DELAY = 3000;
    /* la barre de progression et le zoom lent de l'image durent exactement le
       temps d'affichage d'une annonce : la barre arrive au bout quand on change */
    rotator.style.setProperty("--defile", DELAY + "ms");
    dots.style.setProperty("--defile", DELAY + "ms");
    dots.innerHTML = "";
    slides.forEach(function (sl, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Annonce " + (i + 1) + " sur " + slides.length);
      b.setAttribute("aria-current", i === 0 ? "true" : "false");
      b.innerHTML = "<i></i>";
      b.addEventListener("click", function () { go(i); relancer(); });
      dots.appendChild(b);
    });
    var bullets = $$("button", dots);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (sl, n) {
        sl.classList.toggle("on", n === idx);
        sl.setAttribute("aria-hidden", n === idx ? "false" : "true");
      });
      bullets.forEach(function (b, n) {
        b.setAttribute("aria-current", n === idx ? "true" : "false");
      });
    }

    /* La barre repart de zéro exactement au moment où le minuteur est armé :
       les deux partagent la même horloge, elle ne peut plus dériver. */
    function barre() {
      bullets.forEach(function (b) {
        var bar = b.firstChild;
        bar.style.animation = "none";
        void bar.offsetWidth;
        bar.style.animation = "";
      });
    }
    function restart() {
      clearTimeout(timer);
      if (perime() || paused) return;
      barre();
      timer = setTimeout(function () { go(idx + 1); restart(); }, DELAY);
    }
    function setPaused(v) {
      paused = v;
      dots.classList.toggle("paused", v);
      var b = $("#hPause");
      b.setAttribute("aria-label", v ? "Reprendre le défilement" : "Mettre en pause le défilement");
      b.innerHTML = v
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
      restart();
    }
    /* Cliquer sur une flèche relance le remplissage de la barre : sans cela
       le focus pris par le bouton la laissait figée sur place. */
    function relancer() {
      if (!paused) dots.classList.remove("paused");
      restart();
    }
    $("#hNext").addEventListener("click", function () { go(idx + 1); relancer(); });
    $("#hPrev").addEventListener("click", function () { go(idx - 1); relancer(); });
    $("#hPause").addEventListener("click", function () { setPaused(!paused); });
    /* Le survol ne met plus le carrousel en pause : le pointeur reste souvent
       posé sur le hero, et le défilement semblait alors bloqué. Seuls le bouton
       pause et le focus clavier l'arrêtent. */
    /* Même égard au clavier qu'à la souris : le défilement s'arrête tant que le
       focus est dans le carrousel, sinon le contenu bouge sous les doigts. */
    function zone(e) { return rotator.contains(e.target) || dots.contains(e.target); }
    document.addEventListener("focusin", function (e) {
      if (perime() || !zone(e)) return;
      /* Au clavier seulement : à la souris, le clic vaut action délibérée et
         le défilement doit reprendre aussitôt. */
      try { if (!e.target.matches(":focus-visible")) return; } catch (err) { /* navigateur ancien */ }
      clearTimeout(timer); dots.classList.add("paused");
    });
    document.addEventListener("focusout", function (e) {
      if (perime() || !zone(e) || paused) return;
      dots.classList.remove("paused"); restart();
    });
    document.addEventListener("keydown", function (e) {
      if (perime() || !zone(e)) return;
      if (e.key === "ArrowLeft") { go(idx - 1); restart(); }
      if (e.key === "ArrowRight") { go(idx + 1); restart(); }
    });
    document.addEventListener("visibilitychange", function () {
      if (perime()) return;
      if (document.hidden) clearTimeout(timer); else restart();
    });
    go(0);
    if (reduce) setPaused(true); else restart();
  };
  window.homeliaInitRotator();

  /* ---- menu mobile ----
     Le panneau couvre l'écran sous la barre et défile seul. Tant qu'il est
     ouvert, la page est figée à sa position (body en position fixe) et
     l'en-tête est fixé en haut de l'écran.
     Un simple overflow:hidden ne suffit pas : sur iPhone le doigt fait
     encore glisser la page, et l'en-tête « collant » perd son point
     d'accroche et remonte hors de l'écran. */
  var burger = $("#burger"), drawer = $("#drawer"), defileMenu = 0;
  if (burger && drawer) {
    var ouvrirMenu = function (oui) {
      var racine = document.documentElement;
      if (oui === racine.classList.contains("menu-ouvert")) return;
      burger.setAttribute("aria-expanded", String(oui));
      burger.setAttribute("aria-label", oui ? "Fermer le menu" : "Ouvrir le menu");
      if (oui) {
        defileMenu = window.scrollY;
        racine.style.setProperty("--haut-tiroir", (nav ? Math.round(nav.getBoundingClientRect().height) : 72) + "px");
        document.body.style.top = -defileMenu + "px";
        racine.classList.add("menu-ouvert");
        drawer.classList.add("open");
        drawer.scrollTop = 0;
      } else {
        drawer.classList.remove("open");
        racine.classList.remove("menu-ouvert");
        document.body.style.top = "";
        window.scrollTo({ top: defileMenu, behavior: "instant" });
      }
    };
    burger.addEventListener("click", function () {
      ouvrirMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) ouvrirMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) { ouvrirMenu(false); burger.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1060 && drawer.classList.contains("open")) ouvrirMenu(false);
    });
    /* « Programmes » se déplie sur place, fermé à l'ouverture du menu */
    $$(".tiroir-ouvrir", drawer).forEach(function (b) {
      var sous = document.getElementById(b.getAttribute("aria-controls"));
      if (!sous) return;
      b.addEventListener("click", function () {
        var oui = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(oui));
        sous.classList.toggle("open", oui);
      });
    });
  }

  /* ---- apparitions au scroll (contenu visible si le JS ne tourne pas) ---- */
  var reveals = $$(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) el.classList.add("pre");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove("pre");
        e.target.classList.add("in");
        io.unobserve(e.target);
        if (e.target.querySelector("[data-count]")) countUp(e.target);
        if (e.target.querySelector(".track")) growBars(e.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () { reveals.forEach(function (el) { el.classList.remove("pre"); }); }, 4000);
  } else {
    growBars(document);
  }

  function countUp(scope) {
    $$("[data-count]", scope).forEach(function (el) {
      var end = parseFloat(el.dataset.count), dec = Number(el.dataset.dec || 0),
          suf = el.dataset.suffix || "", pre = el.dataset.prefix || "", t0 = null;
      function frame(t) {
        if (!t0) t0 = t;
        var k = Math.min((t - t0) / 1100, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + (end * e).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (k < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function growBars(scope) {
    $$(".track i", scope).forEach(function (i, n) {
      setTimeout(function () { i.style.width = i.dataset.w + "%"; }, reduce ? 0 : 90 * n);
    });
  }

  /* ---- carrousel de programmes ---- */
  var rail = $("#rail");
  if (rail) {
    var dots = $("#dots"), prev = $("#prev"), next = $("#next"),
        cards = $$(".card", rail);
    /* pas d'une carte à la suivante, écart compris, mesuré plutôt que supposé */
    var step = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : rail.clientWidth; };
    var bout = function () { return rail.scrollWidth - rail.clientWidth; };
    /* Un point par position que le rail peut réellement atteindre : avec trois
       cartes visibles sur sept, cinq positions et non sept. Recalculé quand la
       fenêtre change de largeur, puisque le nombre de cartes visibles change. */
    var poser = function () {
      if (!dots) return 0;
      var n = bout() <= 8 ? 1 : Math.ceil((bout() - 8) / step()) + 1;
      n = Math.min(n, cards.length);
      if (dots.children.length !== n) {
        dots.innerHTML = "";
        for (var k = 0; k < n; k++) dots.insertAdjacentHTML("beforeend", "<i></i>");
      }
      return n;
    };
    var sync = function () {
      var n = poser();
      var i = rail.scrollLeft >= bout() - 8 ? n - 1 : Math.round(rail.scrollLeft / step());
      if (dots) $$("i", dots).forEach(function (d, k) { d.classList.toggle("on", k === i); });
      if (prev) prev.disabled = rail.scrollLeft < 8;
      if (next) next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    };
    /* Un clic avance d'une carte ; un appui maintenu fait défiler en continu
       jusqu'au relâchement. */
    var course = null, maintenu = false;
    function stopper() {
      if (!course) return;
      clearInterval(course);
      course = null;
      /* le rail retrouve son magnétisme et se recale sur la carte la plus proche */
      rail.classList.remove("libre");
      /* appui trop bref pour avoir bougé : c'est un clic, on laisse faire */
      if (maintenu) rail.scrollTo({ left: Math.round(rail.scrollLeft / step()) * step(), behavior: "smooth" });
    }
    function lancer(sens) {
      var debut = Date.now();
      maintenu = false;
      stopper();
      course = setInterval(function () {
        if (Date.now() - debut < 240) return;   /* en deçà, c'est un clic : on ne bouge pas */
        if (!maintenu) {
          maintenu = true;
          /* sans cela le magnétisme (scroll-snap) ramène le rail à chaque image */
          rail.classList.add("libre");
        }
        rail.scrollLeft += sens * 10;
      }, 16);
    }
    function flecher(bouton, sens) {
      if (!bouton) return;
      bouton.addEventListener("click", function () {
        if (maintenu) { maintenu = false; return; }   /* le maintien a déjà fait défiler */
        rail.scrollBy({ left: sens * step(), behavior: "smooth" });
      });
      bouton.addEventListener("pointerdown", function () { lancer(sens); });
      bouton.addEventListener("pointerleave", stopper);
    }
    flecher(prev, -1);
    flecher(next, 1);
    /* Le relâchement compte où qu'il ait lieu : le bouton peut se désactiver
       en cours de course quand on atteint le bout du rail. */
    window.addEventListener("pointerup", stopper);
    window.addEventListener("pointercancel", stopper);
    window.addEventListener("blur", stopper);
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    var down = false, x0 = 0, l0 = 0, moved = 0;
    rail.addEventListener("pointerdown", function (e) { down = true; moved = 0; x0 = e.clientX; l0 = rail.scrollLeft; rail.classList.add("drag"); });
    window.addEventListener("pointerup", function () { if (down) { down = false; rail.classList.remove("drag"); } });
    rail.addEventListener("pointermove", function (e) {
      if (!down) return;
      moved += Math.abs(e.clientX - x0);
      e.preventDefault();
      rail.scrollLeft = l0 - (e.clientX - x0);
    });
    rail.addEventListener("click", function (e) { if (moved > 12) e.preventDefault(); }, true);
  }

  /* ---- simulateur d'éligibilité (plafonds BRS) ---- */
  var sim = $("#sim-form");
  if (sim) {
    /* Plafonds 2026 de revenu fiscal de référence (N-2) pour les opérations
       PSLA et BRS, hors Île-de-France (fichier « Plafonds SIEG 2026 » transmis
       par Homelia). En zones A et B1, ce sont les plafonds intermédiaires.
       Index 0 à 5 : foyer de 1 à 6 personnes. */
    var plafonds = {
      A:  [38844, 58057, 76105, 90863, 108107, 121650],
      B1: [38844, 53579, 64431, 77783, 91503, 103122],
      B2: [33771, 45100, 54235, 65476, 77023, 86805],
      C:  [33771, 45100, 54235, 65476, 77023, 86805]
    };
    var foyer = 3;
    var seg = $("#seg"), rfr = $("#rfr"), verdict = $("#verdict"), big = $("#vBig"),
        choix = $("#sim-prog"), note = $("#sim-note"), jauge = $(".gauge", sim);
    var euro = function (n) { return Math.round(n).toLocaleString("fr-FR").replace(/\u202F|\u00A0| /g, "\u00A0") + "\u00A0€"; };
    /* la zone vient de la fiche programme (data-zone) ou du programme choisi */
    function cible() {
      if (choix) { var o = choix.options[choix.selectedIndex]; return { zone: o.dataset.zone, commune: o.dataset.commune }; }
      return { zone: sim.dataset.zone || "B1", commune: sim.dataset.commune || "" };
    }
    function render(pulse) {
      var c = cible(), v = Number(rfr.value), grille = plafonds[c.zone];
      $("#rfrVal").textContent = euro(v);
      var label = foyer === 6 ? "6 personnes et plus" : foyer + (foyer > 1 ? " personnes" : " personne");
      if (note) note.textContent = c.zone === "IDF"
        ? c.commune + " est en Île-de-France\u00A0: les plafonds franciliens diffèrent de ceux affichés ici, nous vous les communiquons."
        : "Plafonds 2026 de la zone " + c.zone + ", celle de " + c.commune + ".";
      /* Île-de-France : hors du champ des plafonds dont nous disposons */
      if (!grille) {
        verdict.classList.remove("no");
        if (jauge) jauge.hidden = true;
        $("#vState").lastChild.textContent = "À vérifier avec nous";
        big.textContent = "Plafonds franciliens";
        $("#vText").textContent = "Pour un programme en Île-de-France, nous vérifions votre éligibilité avec les plafonds propres à la région.";
        return;
      }
      if (jauge) jauge.hidden = false;
      var p = grille[foyer - 1], ok = v <= p;
      $("#gCap").textContent = "Plafond " + euro(p);
      $("#gFill").style.width = Math.min(v / p * 100, 100) + "%";
      verdict.classList.toggle("no", !ok);
      $("#vState").lastChild.textContent = ok ? "Éligible" : "Au-dessus du plafond";
      big.textContent = ok ? euro(p - v) + " de marge" : euro(v - p) + " au-dessus";
      $("#vText").textContent = ok
        ? "Votre foyer de " + label + " reste sous le plafond de la zone " + c.zone + "."
        : "Votre foyer de " + label + " dépasse le plafond de la zone " + c.zone + ". D'autres programmes, dans une autre zone, peuvent rester accessibles.";
      if (pulse && !reduce) { big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop"); }
    }
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", seg).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      foyer = Number(b.dataset.p); render(true);
    });
    rfr.addEventListener("input", function () { render(false); });
    if (choix) choix.addEventListener("change", function () { render(true); });
    render(false);
  }

  /* ---- accordéons ---- */
  $$(".q button").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true";
      var group = b.closest(".faq") || document;
      $$(".q button", group).forEach(function (o) {
        o.setAttribute("aria-expanded", "false");
        o.nextElementSibling.classList.remove("open");
      });
      if (!open) { b.setAttribute("aria-expanded", "true"); b.nextElementSibling.classList.add("open"); }
    });
  });

  /* ---- filtres (programmes, lots) ---- */
  $$("[data-filter-group]").forEach(function (group) {
    var targets = $$("[data-tags]", document.querySelector(group.dataset.filterTarget));
    group.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", group).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      var f = b.dataset.f;
      targets.forEach(function (t) {
        var show = f === "*" || (" " + t.dataset.tags + " ").indexOf(" " + f + " ") > -1;
        t.hidden = !show;
      });
      var count = $(group.dataset.filterCount || "#nothing");
      if (count) count.textContent = targets.filter(function (t) { return !t.hidden; }).length;
    });
  });

  /* ---- formulaire de contact ---- */
  var form = $("#contact-form");
  if (form) {
    /* pré-sélection du programme depuis l'URL : /contact.html?programme=communay */
    try {
      var slug = new URLSearchParams(window.location.search).get("programme");
      if (slug) {
        var opt = $('#programme option[data-slug="' + slug.replace(/[^a-z0-9-]/gi, "") + '"]');
        if (opt) {
          opt.selected = true;
          $("#message").placeholder = "Je souhaite des informations sur " + opt.value + ".";
        }
      }
    } catch (err) { /* URL non exploitable */ }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      $$("[data-req]", form).forEach(function (f) {
        var wrap = f.closest(".fw"), ok = f.type === "checkbox" ? f.checked : f.value.trim().length > 1;
        if (ok && f.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value);
        wrap.classList.toggle("bad", !ok);
        if (!ok) valid = false;
      });
      if (!valid) { $(".bad [data-req]", form).focus(); return; }
      var get = function (n) { var el = form.elements[n]; return el ? el.value : ""; };

      /* Si la base est configurée, la demande est enregistrée et suivie dans l'espace du visiteur. */
      var H = window.Homelia;
      if (H && H.actif) {
        var opt = form.elements.programme ? form.elements.programme.selectedOptions[0] : null;
        var slug = opt ? opt.dataset.slug : null;
        (async function () {
          var a = slug ? await H.annonce(slug) : null;
          var r = await H.envoyerMessage({
            nom: get("nom"), email: get("email"), telephone: get("tel"),
            annonce: a ? a.id : null, foyer: get("foyer"), rfr: get("rfr"), contenu: get("message")
          });
          var ok = $("#form-ok");
          if (r.error) {
            ok.textContent = "Envoi impossible pour le moment. Écrivez-nous à contact@homelia-accession.fr.";
            ok.classList.add("show");
            return;
          }
          ok.innerHTML = H.utilisateur()
            ? "Demande envoyée. Vous la retrouvez, ainsi que notre réponse, dans <a href=\"/espace.html\">votre espace</a>."
            : "Demande envoyée. Nous vous répondons sous 24 h. <a href=\"/connexion.html\">Créez un compte</a> pour suivre vos échanges.";
          ok.classList.add("show");
          form.reset();
        })();
        return;
      }

      var body = [
        "Nom : " + get("nom"),
        "Email : " + get("email"),
        "Téléphone : " + get("tel"),
        "Programme : " + get("programme"),
        "Composition du foyer : " + get("foyer"),
        "Revenu fiscal de référence : " + get("rfr"),
        "", get("message")
      ].join("\n");
      window.location.href = "mailto:contact@homelia-accession.fr"
        + "?subject=" + encodeURIComponent("Demande de contact — " + (get("programme") || "site Homelia"))
        + "&body=" + encodeURIComponent(body);
      $("#form-ok").classList.add("show");
      form.reset();
    });
  }

  /* ---- bandeau cookies ---- */
  var cookie = $("#cookie");
  if (cookie) {
    var KEY = "homelia-cookies";
    var choice = null;
    try { choice = localStorage.getItem(KEY); } catch (err) { choice = null; }
    if (!choice) setTimeout(function () { cookie.classList.add("show"); }, 900);
    $$("button", cookie).forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem(KEY, b.dataset.choice); } catch (err) { /* stockage indisponible */ }
        cookie.classList.remove("show");
      });
    });
  }


  /* ---- carte : chargée seulement à la demande du visiteur ---- */
  window.homeliaCarte = function (bloc) {
    var b = $("button", bloc);
    if (!b || bloc.dataset.lie) return;
    bloc.dataset.lie = "1";
    b.addEventListener("click", function () {
      var cadre = document.createElement("iframe");
      cadre.src = bloc.dataset.src;
      cadre.title = bloc.dataset.titre || "Carte";
      cadre.loading = "lazy";
      cadre.setAttribute("referrerpolicy", "no-referrer");
      bloc.innerHTML = "";
      bloc.appendChild(cadre);
    });
  };
  $$("[data-carte]").forEach(window.homeliaCarte);

  /* ---- plaquette : mise en page d'impression du navigateur ---- */
  $$("[data-imprimer]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  /* ---- simulateur de mensualité ---- */
  var mens = $("#sim-mens");
  if (mens) {
    var euro = function (n) {
      return Math.round(n).toLocaleString("fr-FR").replace(/\u202F|\u00A0| /g, "\u00A0") + "\u00A0€";
    };
    var champs = {
      prix: $("#m-prix"), apport: $("#m-apport"), duree: $("#m-duree"),
      taux: $("#m-taux"), surface: $("#m-surface"), redevance: $("#m-redevance")
    };
    champs.prix.value = mens.dataset.prix || 199000;
    champs.surface.value = mens.dataset.surface || 60;
    champs.redevance.value = mens.dataset.redevance || "";
    champs.redevance.placeholder = mens.dataset.redevance ? "" : "non communiquée";

    function calculer() {
      var prix = Number(champs.prix.value) || 0,
          apport = Math.min(Number(champs.apport.value) || 0, prix),
          annees = Number(champs.duree.value),
          taux = Number(champs.taux.value),
          surface = Number(champs.surface.value) || 0,
          parM2 = Number(champs.redevance.value) || 0;

      $("#m-duree-val").textContent = annees + " ans";
      $("#m-taux-val").textContent = taux.toFixed(2).replace(".", ",") + "\u00A0%";

      var emprunt = Math.max(prix - apport, 0),
          t = taux / 100 / 12,
          n = annees * 12,
          credit = t > 0 ? emprunt * t / (1 - Math.pow(1 + t, -n)) : emprunt / n,
          redev = surface * parM2;

      $("#m-credit").textContent = euro(credit);
      $("#m-redev").textContent = parM2 ? euro(redev) : "à confirmer";
      $("#m-total").textContent = euro(credit + redev);
      $("#m-emprunt").textContent = euro(emprunt);
      $("#m-interets").textContent = euro(Math.max(credit * n - emprunt, 0));
    }
    Object.keys(champs).forEach(function (k) {
      champs[k].addEventListener("input", calculer);
    });
    calculer();

    /* Les fiches générées depuis la base renseignent le simulateur après coup. */
    window.homeliaMensualite = function (prix, surface, redevance) {
      if (prix) champs.prix.value = prix;
      if (surface) champs.surface.value = surface;
      champs.redevance.value = redevance || "";
      champs.redevance.placeholder = redevance ? "" : "non communiquée";
      calculer();
    };
  }

  /* ---- recherche et filtres de la liste des programmes ---- */
  var recherche = $("#recherche");
  if (recherche) {
    var liste = $("#liste"), compteur = $("#count"), raz = $("#f-raz");
    var sansAccent = function (v) {
      return (v || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    var vide = document.createElement("div");
    vide.className = "aucun";
    vide.hidden = true;
    vide.innerHTML = "<p><strong>Aucun programme ne correspond à cette recherche.</strong></p>"
      + "<p>Élargissez le budget ou le département — ou <a href=\"/contact.html\">dites-nous ce que vous cherchez</a>, "
      + "nous vous préviendrons au prochain lancement.</p>";
    liste.parentNode.insertBefore(vide, liste.nextSibling);

    function filtrer() {
      var q = sansAccent($("#f-texte").value.trim()),
          dep = $("#f-dep").value,
          typo = $("#f-typo").value,
          budget = Number($("#f-budget").value) || 0,
          visibles = 0;

      $$("[data-slug]", liste).forEach(function (bloc) {
        var ok = true;
        if (q && sansAccent(bloc.dataset.texte).indexOf(q) === -1) ok = false;
        if (ok && dep && bloc.dataset.dep !== dep) ok = false;
        if (ok && typo) {
          var vise = Number(typo.slice(1));
          var offerts = (bloc.dataset.typo || "").split(" ").filter(Boolean)
            .map(function (t) { return Number(t.slice(1)); });
          if (!offerts.some(function (n) { return n >= vise; })) ok = false;
        }
        if (ok && budget) {
          var prix = Number(bloc.dataset.prix);
          if (!prix || prix > budget) ok = false;
        }
        bloc.hidden = !ok;
        if (ok) visibles++;
      });

      compteur.textContent = visibles;
      $$("[data-pluriel]").forEach(function (el) { el.textContent = visibles > 1 ? "s" : ""; });
      vide.hidden = visibles > 0;
      raz.hidden = !(q || dep || typo || budget);
    }

    $$("#f-texte, #f-dep, #f-typo, #f-budget").forEach(function (el) {
      el.addEventListener("input", filtrer);
      el.addEventListener("change", filtrer);
    });
    raz.addEventListener("click", function () {
      $("#f-texte").value = "";
      $$("#f-dep, #f-typo, #f-budget").forEach(function (el) {
        el.value = "";
        el.dispatchEvent(new Event("change"));   /* remet aussi à jour les listes compactes */
      });
      filtrer();
    });
    window.homeliaFiltrer = filtrer;   /* rappelé après ajout d'annonces depuis la base */
    filtrer();
  }


  /* ---- le chantier : la maison se construit au fil du défilement ---- */
  var chantier = $("#chantier");
  if (chantier) {
    var pieces = $$(".piece", chantier),
        fumee = $(".fumee", chantier),
        lueurs = $$(".lueur", chantier),
        posees = -1,
        attente = false;

    function avancement() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      return h > 40 ? Math.min(Math.max(window.scrollY / h, 0), 1) : 1;
    }

    function batir() {
      attente = false;
      var p = avancement();
      /* la dernière pièce se pose un peu avant le bas de page, pour que la
         maison soit finie quand on arrive au pied de page */
      var n = Math.min(Math.round(p * (pieces.length + 0.6)), pieces.length);
      if (n !== posees) {
        posees = n;
        pieces.forEach(function (g, i) { g.classList.toggle("posee", i < n); });
        fumee.classList.toggle("posee", n > 5);
        lueurs.forEach(function (r) { r.style.fill = n >= pieces.length ? "#F6DFA8" : "#EEF3F4"; });
      }
      chantier.classList.toggle("visible", window.scrollY > 160);
      chantier.classList.toggle("fini", p > 0.97);
    }

    window.addEventListener("scroll", function () {
      if (!attente) { attente = true; requestAnimationFrame(batir); }
    }, { passive: true });
    window.addEventListener("resize", batir);
    batir();
  }


  /* ---- carte des territoires : encart au survol ---- */
  var carteTerr = $("#carte-terr");
  if (carteTerr) {
    var info = $("#carte-info"),
        nom = $(".carte-info-nom", info),
        nb = $(".carte-info-nb", info),
        sortie = null;

    function montrer(zone) {
      clearTimeout(sortie);
      nom.textContent = zone.dataset.nom;
      nb.textContent = zone.dataset.nb + " · " + zone.dataset.region;
      info.classList.add("on");
    }
    function cacher() {
      sortie = setTimeout(function () { info.classList.remove("on"); }, 160);
    }
    $$(".zone", carteTerr).forEach(function (zone) {
      zone.addEventListener("mouseenter", function () { montrer(zone); });
      zone.addEventListener("mouseleave", cacher);
      zone.addEventListener("focus", function () { montrer(zone); });
      zone.addEventListener("blur", cacher);
      /* au doigt, le premier contact affiche la fiche sans ouvrir la page */
      zone.addEventListener("touchstart", function (e) {
        if (!info.classList.contains("on") || nom.textContent !== zone.dataset.nom) {
          e.preventDefault();
          montrer(zone);
        }
      }, { passive: false });
    });
  }

  /* ---- ancres avec décalage de l'en-tête ---- */
  $$('a[href^="#"]:not([href="#"])').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---- année du pied de page ---- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- encarts interactifs ----
     Quand une valeur change, le champ frémit une fois ; quand on fait un
     choix, le bouton rebondit. L'en-tête, le pied de page et le menu mobile
     ne sont pas concernés : tout est limité à <main>. */
  var rejouer = function (el, classe) {
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
  };
  var CHAMPS = "main input:not([type=range]):not([type=checkbox]):not([type=radio]), main select, main textarea";
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches(CHAMPS)) rejouer(e.target, "fremit");
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("main .seg button, main .filters button, main .tabs button, main .pastille");
    if (b) rejouer(b, "tapote");
  });
  document.addEventListener("animationend", function (e) {
    if (e.animationName === "fremit" || e.animationName === "tapote") e.target.classList.remove("fremit", "tapote");
  });
  /* curseurs : la piste se remplit jusqu'à la valeur choisie */
  var remplir = function (r) {
    var min = parseFloat(r.min) || 0, max = parseFloat(r.max) || 100;
    r.style.setProperty("--rempli", ((parseFloat(r.value) - min) / (max - min || 1) * 100).toFixed(2) + "%");
  };
  $$("main input[type=range]").forEach(function (r) {
    remplir(r);
    r.addEventListener("input", function () { remplir(r); });
    r.addEventListener("change", function () { remplir(r); });
  });

  /* ---- listes déroulantes compactes ----
     Sur téléphone, la liste native s'ouvre en grand, dans la police du
     système. Ces listes-ci restent sous le champ, en petit. Le <select>
     d'origine est conservé (masqué) : il garde la valeur et prévient les
     scripts existants par son événement « change ». */
  var listesOuvertes = [];
  function fermerListes(sauf) {
    listesOuvertes.forEach(function (f) { if (f !== sauf) f(); });
  }
  $$(".recherche select, #sim-prog").forEach(function (sel, n) {
    var boite = document.createElement("div"),
        bouton = document.createElement("button"),
        texte = document.createElement("span"),
        liste = document.createElement("ul");
    boite.className = "choix";
    sel.parentNode.insertBefore(boite, sel);
    boite.appendChild(sel);
    sel.classList.add("choix-natif");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");

    bouton.type = "button";
    bouton.className = "choix-bouton";
    bouton.id = (sel.id || "choix-" + n) + "-bouton";
    bouton.setAttribute("aria-haspopup", "listbox");
    bouton.setAttribute("aria-expanded", "false");
    texte.className = "choix-texte";
    bouton.appendChild(texte);
    var etiquette = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    if (etiquette) {
      etiquette.id = etiquette.id || sel.id + "-etiquette";
      etiquette.htmlFor = bouton.id;
      bouton.setAttribute("aria-labelledby", etiquette.id + " " + bouton.id);
    }

    liste.className = "choix-liste";
    liste.id = bouton.id + "-liste";
    liste.setAttribute("role", "listbox");
    liste.hidden = true;
    bouton.setAttribute("aria-controls", liste.id);
    [].forEach.call(sel.options, function (o, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.tabIndex = -1;
      li.dataset.i = i;
      li.textContent = o.textContent;
      liste.appendChild(li);
    });
    boite.appendChild(bouton);
    boite.appendChild(liste);
    var options = $$("li", liste);

    function majChoix() {
      var o = sel.options[sel.selectedIndex];
      texte.textContent = o ? o.textContent : "";
      options.forEach(function (li, i) { li.setAttribute("aria-selected", String(i === sel.selectedIndex)); });
    }
    function fermer(rendreFocus) {
      if (liste.hidden) return;
      liste.hidden = true;
      bouton.setAttribute("aria-expanded", "false");
      boite.classList.remove("ouverte");
      if (rendreFocus) bouton.focus();
    }
    function ouvrir() {
      fermerListes(fermer);
      liste.hidden = false;
      bouton.setAttribute("aria-expanded", "true");
      boite.classList.add("ouverte");
      /* la liste s'aligne à droite du champ si elle déborde de l'écran */
      liste.classList.remove("a-droite");
      if (liste.getBoundingClientRect().right > window.innerWidth - 8) liste.classList.add("a-droite");
      (options[sel.selectedIndex] || options[0]).focus();
    }
    function choisir(i) {
      if (i !== sel.selectedIndex) {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      fermer(true);
    }
    listesOuvertes.push(fermer);

    bouton.addEventListener("click", function () { if (liste.hidden) ouvrir(); else fermer(false); });
    bouton.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); ouvrir(); }
    });
    liste.addEventListener("click", function (e) {
      var li = e.target.closest("li");
      if (li) choisir(Number(li.dataset.i));
    });
    liste.addEventListener("keydown", function (e) {
      var i = options.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); options[Math.min(i + 1, options.length - 1)].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); options[Math.max(i - 1, 0)].focus(); }
      else if (e.key === "Home") { e.preventDefault(); options[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); options[options.length - 1].focus(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (i >= 0) choisir(i); }
      else if (e.key === "Escape") { e.preventDefault(); fermer(true); }
      else if (e.key === "Tab") fermer(false);
    });
    sel.addEventListener("change", majChoix);
    majChoix();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".choix")) fermerListes(null);
  });

})();
