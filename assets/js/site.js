/* ==========================================================================
   Homelia — interactions du site
   ========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---- navigation : condensation, progression, parallaxe ---- */
  var nav = $("#nav"), progress = $("#progress"), heroImg = $("#heroImg");
  function onScroll() {
    if (nav) nav.classList.toggle("stuck", window.scrollY > 24);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
    if (heroImg && !reduce && window.scrollY < 900) {
      heroImg.style.transform = "translateY(" + (window.scrollY * -0.06) + "px)";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- menu mobile ---- */
  var burger = $("#burger"), drawer = $("#drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      drawer.classList.toggle("open", !open);
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        drawer.classList.remove("open");
      }
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
    if (dots) cards.forEach(function () { dots.insertAdjacentHTML("beforeend", "<i></i>"); });
    var step = function () { return cards[0].getBoundingClientRect().width + 22; };
    var sync = function () {
      var i = Math.round(rail.scrollLeft / step());
      if (dots) $$("i", dots).forEach(function (d, n) { d.classList.toggle("on", n === i); });
      if (prev) prev.disabled = rail.scrollLeft < 8;
      if (next) next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    };
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
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
    /* Plafonds de revenu fiscal de référence (N-2), zone B1.
       Source : documentation Homelia. Les autres zones sont communiquées sur demande. */
    var plafonds = { B1: { 1: 37581, 2: 50023, 3: 60543, 4: 70718, 5: 80183, 6: 90863 } };
    var foyer = 3, zone = "B1";
    var seg = $("#seg"), rfr = $("#rfr"), verdict = $("#verdict"), big = $("#vBig"), zoneSel = $("#zone");
    var euro = function (n) { return Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " €"; };
    function render(pulse) {
      var v = Number(rfr.value), p = plafonds[zone][foyer], ok = v <= p;
      $("#rfrVal").textContent = euro(v);
      $("#gCap").textContent = "Plafond " + euro(p);
      $("#gFill").style.width = Math.min(v / p * 100, 100) + "%";
      verdict.classList.toggle("no", !ok);
      $("#vState").lastChild.textContent = ok ? "Éligible" : "Au-dessus du plafond";
      big.textContent = ok ? euro(p - v) + " de marge" : euro(v - p) + " au-dessus";
      var label = foyer === 6 ? "6 personnes et plus" : foyer + (foyer > 1 ? " personnes" : " personne");
      $("#vText").textContent = ok
        ? "Votre foyer de " + label + " reste sous le plafond de la zone " + zone + "."
        : "Votre foyer de " + label + " dépasse le plafond de la zone " + zone + ". D'autres zones ou programmes peuvent rester accessibles.";
      if (pulse && !reduce) { big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop"); }
    }
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", seg).forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      foyer = Number(b.dataset.p); render(true);
    });
    rfr.addEventListener("input", function () { render(false); });
    if (zoneSel) zoneSel.addEventListener("change", function () { zone = zoneSel.value; render(true); });
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
})();
