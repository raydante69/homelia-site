#!/usr/bin/env python3
"""Passe mobile du 21/10/2026 : changements de contenu des pages.

- menu mobile : dans « Programmes », le lien vers la liste complète passe en
  dernière ligne et s'intitule « Voir tous les programmes » ;
- page Programmes : l'encart sous les annonces est raccourci. Il annonçait
  que les programmes de Gleizé, Les Chères et Thorigné-Fouillard n'avaient
  pas encore de fiche, alors qu'ils sont désormais publiés ;
- cartes d'annonce : le département est isolé dans un <span>, pour n'afficher
  que la commune sur les petites cartes mobiles ;
- Nous connaître : « Nos valeurs » devient une partie distincte (titre de la
  taille de « Notre histoire », valeurs en encarts) ; la case « 3 régions »
  passe à 4 (la Bretagne s'est ajoutée avec Thorigné-Fouillard) et les
  libellés des quatre cases ont une longueur comparable.

Idempotent : on peut le relancer sans risque.
"""
import io, re, subprocess

PAGES = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()
FLECHE = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
          'aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>')
bilan = {}
def compter(k, n=1):
    if n:
        bilan[k] = bilan.get(k, 0) + n

TOUS = re.compile(r'(<div class="tiroir-sous" id="tiroir-prog"><div>)<a href="/programmes.html"( class="on")?>'
                  r'<strong>Tous les programmes</strong><span>12</span></a>((?:(?!</div>).)*)</div>', re.S)

ANCIEN_ENCART = re.compile(r'<div class="callout" style="margin-top:40px">\s*<p><strong>Également en préparation\.</strong>.*?</p>\s*</div>', re.S)
NOUVEL_ENCART = ('<div class="callout encart-suite">\n'
                 '    <p><strong>D\'autres programmes arrivent.</strong> Soyez prévenu avant leur mise en vente.</p>\n'
                 '    <a class="btn btn-sm btn-ghost" href="/contact.html">Être prévenu ' + FLECHE + '</a>\n'
                 '  </div>')

VALEURS = re.compile(r'<h2>Nos valeurs</h2>\s*((?:<h3>(?:(?!</h3>).)*</h3>\s*<p>(?:(?!</p>).)*</p>\s*){3})', re.S)
def valeurs(m):
    items = re.findall(r'<h3>((?:(?!</h3>).)*)</h3>\s*<p>((?:(?!</p>).)*)</p>', m.group(1), re.S)
    corps = "".join('\n      <div><h3>%s</h3><p>%s</p></div>' % it for it in items)
    return '<h2 class="valeurs-titre">Nos valeurs</h2>\n    <div class="valeurs">%s\n    </div>\n' % corps

for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    avant = s

    s, n = TOUS.subn(lambda m: '%s%s<a class="tiroir-tout%s" href="/programmes.html">Voir tous les programmes %s</a></div>' % (
        m.group(1), m.group(3), " on" if m.group(2) else "", FLECHE), s)
    compter("menus mobiles", n)

    # cartes : le département dans un <span>, masqué sur les petites cartes mobiles
    s, n = re.subn(r'(<div class="card-titre"><h3>(?:(?!</h3>).)*</h3><p class="loc">)([^<·]+?) · ([^<]+)</p>',
                   r'\1\2<span class="loc-dep"> · \3</span></p>', s)
    compter("lieux de carte", n)

    if f == "programmes.html":
        s, n = ANCIEN_ENCART.subn(NOUVEL_ENCART, s)
        compter("encart sous les annonces", n)

    if f == "nous-connaitre.html":
        s, n = VALEURS.subn(valeurs, s)
        compter("bloc Nos valeurs", n)
        a = ('<div class="stat"><strong class="tabnum" data-count="3">3</strong>'
             '<span>régions&nbsp;: Auvergne-Rhône-Alpes, Bourgogne, Île-de-France</span></div>')
        if a in s:
            s = s.replace(a, '<div class="stat"><strong class="tabnum" data-count="4">4</strong><span>régions couvertes</span></div>')
            compter("case des régions", 1)
        a = '<span>des ménages français sous les plafonds</span>'
        if a in s:
            s = s.replace(a, '<span>des ménages sous les plafonds</span>')
            compter("case des 87 %", 1)

    if s != avant:
        io.open(f, "w", encoding="utf-8").write(s)

for k in sorted(bilan):
    print("%-28s %d" % (k, bilan[k]))
