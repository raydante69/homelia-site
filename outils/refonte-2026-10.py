#!/usr/bin/env python3
"""Refonte visuelle d'octobre 2026, appliquée aux pages publiées.

Le générateur d'origine n'existe plus : ce script transforme directement les
fichiers HTML. Il est idempotent — le relancer sur des pages déjà
transformées ne change rien.

  1. une seule police de texte (Schibsted Grotesk), Fraunces gardée pour
     les mots en relief
  2. un seul rythme vertical : les marges intérieures posées à la main sur
     chaque section disparaissent
  3. un seul style de titre de section, et une tête à deux colonnes
     (titre à gauche, texte à droite) quand un chapeau suit le titre
  4. la nouvelle carte d'annonce
  5. le menu mobile, sorti de l'en-tête et réorganisé
  6. les questions fréquentes fermées à l'ouverture de la page
"""
import glob, html, io, os, re, sys

RACINE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..")
os.chdir(RACINE)
PAGES = sorted(glob.glob("*.html") + glob.glob("*/*.html"))
bilan = {}

def compter(cle, n=1):
    bilan[cle] = bilan.get(cle, 0) + n

# ───────────────────────────── 1. la police ──────────────────────────────
POLICES_ANC = re.compile(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*">')
POLICES = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
           'family=Schibsted+Grotesk:wght@400..800&amp;family=Fraunces:ital,opsz,wght@1,9..144,400&amp;display=swap">')

# ───────────────────────── 4. la carte d'annonce ─────────────────────────
TYPE = {  # maison ou appartement, d'après la fiche de chaque programme
    "communay": "maison", "bourg-saint-christophe": "maison", "frans": "maison", "savigneux": "maison",
    "saint-julien": "maison", "la-chapelle-de-guinchay": "maison", "gleize": "maison",
    "coublevie": "appartement", "bassens": "appartement", "drancy": "appartement",
    "les-cheres": "appartement", "thorigne-fouillard": "appartement",
}
ICONE = {
    "maison": '<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>',
    "appartement": '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/>'
                   '<path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5V18h3v2.5"/></svg>',
}
LIBELLE = {"maison": "Maisons", "appartement": "Appartements"}
FLECHE = '<svg viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg>'
MOTS_VIDES = {"en", "et", "à", "a", "de", "·", "-", "+"}
MOTS_TYPE = {"maison", "maisons", "appartement", "appartements"}

def jetons(texte):
    t = html.unescape(texte).lower().replace("·", " ")
    return {m for m in re.findall(r"[\wéèêàâîôûç²]+", t) if m not in MOTS_VIDES}

def infos(typo, specs):
    """La typologie d'abord, puis le reste, sans répéter la typologie."""
    j_typo, garde = jetons(typo), []
    for s in specs:
        j = jetons(s)
        if not any(re.fullmatch(r"t\d", x) for x in j):
            garde.append(s)
        elif j == j_typo or j <= j_typo or (j >= j_typo and j - j_typo <= MOTS_TYPE):
            continue                      # même information que la typologie
        elif j >= j_typo:
            typo = s                      # plus précis : « T4 duplex » remplace « T4 »
        else:
            garde.append(s)
    return typo, garde

CARTE = re.compile(r'<a class="card" href="(?P<href>[^"]+)">\s*'
                   r'<div class="card-img"><span class="chip">(?P<chip>[^<]*)</span>\s*'
                   r'(?P<img><img [^>]*>)</div>\s*'
                   r'<div class="card-bar">\s*<div><h3>(?P<nom>[^<]*)</h3><div class="loc"><svg(?:(?!</svg>).)*</svg>(?P<loc>[^<]*)</div></div>\s*'
                   r'<span class="price">(?P<prix>[^<]*)<small>(?P<prix_txt>[^<]*)</small></span>\s*</div>\s*'
                   r'<div class="card-specs">(?P<specs>(?:(?!</div>).)*)</div>\s*</a>', re.S)

def nouvelle_carte(m):
    slug = m.group("href").rstrip("/").split("/")[-1].replace(".html", "")
    genre = TYPE.get(slug, "appartement")
    statut, _, typo = [x.strip() for x in m.group("chip").partition("·")]
    typo, reste = infos(typo, re.findall(r"<span>(.*?)</span>", m.group("specs")))
    puces = '<li class="typo">%s</li>' % typo + "".join("<li>%s</li>" % s for s in reste)
    return ('<a class="card" href="%s">\n'
            '      <div class="card-tete">\n'
            '        <span class="card-type" title="%s">%s<span class="vh">%s</span></span>\n'
            '        <div class="card-titre"><h3>%s</h3><p class="loc">%s</p></div>\n'
            '      </div>\n'
            '      <ul class="card-infos">%s</ul>\n'
            '      <div class="card-img"><span class="chip">%s</span>\n'
            '        %s\n'
            '        <span class="card-prix"><span><small>%s</small><b>%s</b></span><i aria-hidden="true">%s</i></span>\n'
            '      </div>\n'
            '    </a>') % (m.group("href"), LIBELLE[genre], ICONE[genre], LIBELLE[genre],
                          m.group("nom"), m.group("loc").strip(), puces, statut,
                          m.group("img"), m.group("prix_txt"), m.group("prix"), FLECHE)

# ──────────────────────────── 5. le menu mobile ───────────────────────────
TERRITOIRES = [("rhone", "Rhône", 4), ("ain", "Ain", 3), ("isere", "Isère", 1), ("savoie", "Savoie", 1),
               ("saone-et-loire", "Saône-et-Loire", 1), ("seine-saint-denis", "Seine-Saint-Denis", 1),
               ("ille-et-vilaine", "Ille-et-Vilaine", 1)]
PRINCIPAUX = [("/guide-du-brs.html", "Le BRS"), ("/eligibilite.html", "Éligibilité"),
              ("/accompagnement.html", "Accompagnement"), ("/actualites.html", "Actualités"),
              ("/nous-connaitre.html", "Nous connaître")]

def tiroir(actif):
    def lien(href, texte):
        return '<a href="%s"%s>%s</a>' % (href, ' class="on"' if href == actif else "", texte)
    sous = ('<a href="/programmes.html"><strong>Tous les programmes</strong><span>12</span></a>'
            + "".join('<a href="/territoires/%s.html">%s<span>%d programme%s</span></a>'
                      % (s, n, k, "s" if k > 1 else "") for s, n, k in TERRITOIRES))
    return ('<div class="drawer" id="drawer"><div class="in">\n'
            '  %s\n'
            '  <button class="tiroir-ouvrir%s" type="button" aria-expanded="false" aria-controls="tiroir-prog">'
            'Programmes <i aria-hidden="true"></i></button>\n'
            '  <div class="tiroir-sous" id="tiroir-prog"><div>%s</div></div>\n'
            '  %s\n'
            '  <a data-compte href="/connexion.html" hidden>Connexion</a>\n'
            '  <a class="btn btn-sand" href="/contact.html">Être rappelé</a>\n'
            '</div></div>') % (lien("/index.html", "Accueil"),
                               " on" if actif == "/programmes.html" else "", sous,
                               "\n  ".join(lien(h, t) for h, t in PRINCIPAUX))

# l'ancien menu seulement (il porte un niveau de <div> de plus) : le nouveau
# ne doit jamais être repris, sinon le motif pourrait avaler la suite de la page
TIROIR_ANC = re.compile(r'\s*<div class="drawer" id="drawer"><div><div class="in">(?:(?!</div>).)*</div></div></div>\n', re.S)

# ─────────────────────────── 3. titres de section ─────────────────────────
TITRE = re.compile(r'(<p class="eyebrow[^"]*"[^>]*>[^<]*</p>\s*)<h2(?P<attr>[^>]*)>')

def marquer_titre(m):
    attr = m.group("attr")
    if 'style="margin:8px 0 6px"' in attr or "titre" in attr:   # titre du simulateur : on n'y touche pas
        return m.group(0)
    style = re.search(r'style="([^"]*)"', attr)
    if style:
        decl = [d for d in style.group(1).split(";") if d.strip()
                and d.split(":")[0].strip() not in ("font-size", "line-height", "margin", "max-width", "margin-top", "margin-inline")]
        attr = attr.replace(style.group(0), ('style="%s"' % ";".join(decl)) if decl else "").rstrip()
    cls = re.search(r'class="([^"]*)"', attr)
    attr = attr.replace(cls.group(0), 'class="%s titre"' % cls.group(1)) if cls else attr + ' class="titre"'
    compter("titres harmonisés")
    return m.group(1) + "<h2" + re.sub(r"\s+", " ", attr) + ">"

TETE = re.compile(r'(<div class="wrap">\s*)<p class="eyebrow(?P<ec>[^"]*)"(?P<ea>[^>]*)>(?P<eb>[^<]*)</p>\s*'
                  r'<h2(?P<ha>[^>]*class="[^"]*titre[^"]*"[^>]*)>(?P<h>(?:(?!</h2>).)*)</h2>\s*'
                  r'<p(?P<pa>[^>]*)>(?P<p>(?:(?!</p>).){1,480})</p>', re.S)

def tete_de_section(m):
    pa = m.group("pa")
    if "eyebrow" in pa or "class=\"crumb" in pa or "btn" in m.group("p"):
        return m.group(0)
    ha = re.sub(r'\s*class="([^"]*)"', lambda c: ' class="%s"' % c.group(1).replace("reveal", "").strip(), m.group("ha"))
    compter("têtes à deux colonnes")
    return ('%s<div class="sec-tete reveal"><div><p class="eyebrow%s"%s>%s</p>\n'
            '  <h2%s>%s</h2></div>\n  <p class="sec-intro">%s</p></div>') % (
        m.group(1), m.group("ec").replace("reveal", "").rstrip(), m.group("ea"), m.group("eb"),
        ha, m.group("h"), m.group("p").strip())

# ──────────────────────────────── passage ────────────────────────────────
INSECABLE = re.compile(r"(?<=\d) (?=%|€|\d{3}\b)|(?<=\S) (?=[:;?!»])|(?<=«) (?=\S)")

for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    avant = s

    s = POLICES_ANC.sub(POLICES, s)

    # 2. rythme : plus de marges intérieures posées section par section
    def section(m):
        attrs = m.group(1)
        st = re.search(r'\s*style="([^"]*)"', attrs)
        if not st or "padding" not in st.group(1):
            return m.group(0)
        reste = ";".join(d for d in st.group(1).split(";") if d.strip() and "padding" not in d)
        attrs = attrs.replace(st.group(0), (' style="%s"' % reste) if reste else "")
        if m.group(2) and "margin-top:-" in m.group(2):          # image qui chevauche le bandeau
            attrs = (attrs.replace('class="', 'class="chevauche ') if 'class="' in attrs
                     else attrs + ' class="chevauche"')
        compter("sections remises au rythme commun")
        return "<section%s>%s" % (attrs, m.group(2) or "")
    s = re.sub(r'<section([^>]*)>(\s*<div class="wrap[^"]*" style="[^"]*">)?', section, s)

    # un paragraphe ne s'arrête plus à mi-colonne : sa colonne suffit à le borner
    def sans_largeur(m):
        st = re.sub(r"max-width:\s*[\d.]+ch;?", "", m.group(2)).strip().strip(";")
        compter("paragraphes libérés")
        return "<p%s%s>" % (m.group(1), (' style="%s"' % st) if st else "")
    s = re.sub(r'<p([^>]*?) style="([^"]*max-width:\s*[\d.]+ch[^"]*)">', sans_largeur, s)

    s = TITRE.sub(marquer_titre, s)
    s = TETE.sub(tete_de_section, s)

    n = len(CARTE.findall(s))
    if n:
        s = CARTE.sub(nouvelle_carte, s)
        compter("cartes d'annonce", n)

    # 5. menu mobile : sorti de l'en-tête, pour pouvoir couvrir l'écran
    if TIROIR_ANC.search(s):
        on = re.search(r'<li><a href="(/[^"]+)" class="on">', s)
        s = TIROIR_ANC.sub("\n", s, count=1)
        s = s.replace("</header>", "</header>\n" + tiroir(on.group(1) if on else ""), 1)
        compter("menus mobiles")

    # 6. questions fréquentes : toutes fermées à l'arrivée
    if 'class="panel open"' in s:
        s = s.replace('aria-expanded="true"><span>', 'aria-expanded="false"><span>')
        s = s.replace('class="panel open"', 'class="panel"')
        compter("FAQ refermées")

    # 7. espaces insécables : « 7 à 8 % », « 199 000 € » et la ponctuation haute ne se coupent plus en fin de ligne
    morceaux = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)', s, flags=re.S)
    for i in range(0, len(morceaux), 2):
        morceaux[i], n = INSECABLE.subn("&nbsp;", morceaux[i])
        if n:
            compter("espaces insécables", n)
    s = "".join(morceaux)

    if s != avant:
        io.open(f, "w", encoding="utf-8").write(s)

for k in sorted(bilan):
    print("%-36s %d" % (k, bilan[k]))
