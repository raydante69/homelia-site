#!/usr/bin/env python3
"""Finitions du 19/10/2026 : ce qui fait « bricolé » à l'œil.

- en-tête : le bouton « Connexion » est présent dès l'affichage de la page.
  Il était caché puis révélé par le script une fois la session vérifiée,
  ce qui décalait les liens du menu de 65 px à chaque changement de page ;
- questions fréquentes (accueil, guide) : le titre et son bouton forment un
  bloc qui reste à l'écran pendant qu'on parcourt les questions, au lieu
  d'une colonne vide sous le titre ;
- page Éligibilité : le titre « Où trouver votre revenu fiscal de
  référence ? » n'est plus coupé à la main en trois lignes.

Idempotent : on peut le relancer sans risque.
"""
import io, re, subprocess

PAGES = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()
bilan = {}
def compter(k, n=1):
    if n:
        bilan[k] = bilan.get(k, 0) + n

FAQ = re.compile(
    r'(<div class="faq">)\s*(<p class="eyebrow reveal">Questions fréquentes</p>)\s*'
    r'(<h2 class="reveal titre">(?:(?!</h2>).)*</h2>)\s*'
    r'(<div class="reveal"><div class="q">.*?</div></div></div>\n?)'
    r'(\s*<p style="margin-top:26px">(?:(?!</p>).)*</p>)?(\s*</div></div></section>)', re.S)

def faq(m, bouton_guide):
    bouton = (m.group(5) or "").strip()
    if not bouton:
        bouton = bouton_guide
    bouton = bouton.replace('<p style="margin-top:26px">', '<p class="faq-lien">')
    return ('%s\n  <div class="faq-tete reveal">%s\n    %s\n    %s</div>\n  %s%s' % (
        m.group(1), m.group(2).replace(" reveal", ""), m.group(3).replace("reveal ", ""), bouton,
        m.group(4).rstrip("\n"), m.group(6)))

BOUTON_GUIDE = ('<p class="faq-lien"><a class="btn btn-ghost" href="/contact.html">Poser une autre question '
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'
                '<path d="M5 12h13M12 5l7 7-7 7"/></svg></a></p>')

for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    avant = s

    # bouton du compte : visible d'emblée, libellé dans un <span> que le script remplace
    s, n = re.subn(r'<a class="nav-compte" data-compte href="/connexion.html" hidden>(<svg(?:(?!</svg>).)*</svg>)Connexion</a>',
                   r'<a class="nav-compte" data-compte href="/connexion.html">\1<span>Connexion</span></a>', s)
    compter("boutons Connexion d'en-tête", n)
    s, n = re.subn(r'<a data-compte href="/connexion.html" hidden>Connexion</a>', '<a data-compte href="/connexion.html">Connexion</a>', s)
    compter("liens Connexion du menu mobile", n)

    if 'class="faq-tete' not in s:
        s, n = FAQ.subn(lambda m: faq(m, BOUTON_GUIDE), s, count=1)
        compter("questions fréquentes", n)

    if f == "eligibilite.html":
        a = '<h2 style="margin-top:34px">Où trouver votre revenu fiscal<br>de référence&nbsp;?</h2>'
        if a in s:
            s = s.replace(a, '<h2>Où trouver votre revenu fiscal de référence&nbsp;?</h2>')
            compter("titre Éligibilité")

    if s != avant:
        io.open(f, "w", encoding="utf-8").write(s)

for k in sorted(bilan):
    print("%-32s %d" % (k, bilan[k]))
