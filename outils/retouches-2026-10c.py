#!/usr/bin/env python3
"""Retouches du 17/10/2026 : bandeaux de page strictement identiques.

Toutes les pages s'ouvrent sur la même suite : fil d'Ariane, titre,
chapeau, puis, s'il y en a, une ligne d'information (commune et statut
d'un programme, région d'un territoire, date d'un article) et les boutons.
Le surtitre au-dessus du titre disparaît partout ; sur la page 404, il est
remplacé par un fil d'Ariane comme ailleurs.

Idempotent : on peut le relancer sans risque.
"""
import io, re, subprocess

PAGES = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()
BANDEAU = re.compile(r'<section class="phead[^"]*"[^>]*>.*?</section>', re.S)
SURTITRE = re.compile(r'\n\s*<p class="eyebrow"( id="[^"]+")?>((?:(?!</p>).)*)</p>', re.S)
CHAPEAU = re.compile(r'(<h1[^>]*>(?:(?!</h1>).)*</h1>\s*<p(?: [^>]*)?>(?:(?!</p>).)*</p>)', re.S)

n = 0
for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    m = BANDEAU.search(s)
    if not m:
        continue
    b = m.group(0)
    sur = SURTITRE.search(b)
    if not sur:
        continue
    b2 = SURTITRE.sub("", b, count=1)
    if f == "404.html":
        b2 = b2.replace('<div class="wrap">', '<div class="wrap">\n  <p class="crumb"><a href="/index.html">Accueil</a> · Page introuvable</p>', 1)
    else:
        meta = '\n  <p class="phead-meta"%s>%s</p>' % (sur.group(1) or "", sur.group(2))
        b2, k = CHAPEAU.subn(lambda c: c.group(1) + meta, b2, count=1)
        assert k == 1, f
    s = s.replace(b, b2, 1)
    io.open(f, "w", encoding="utf-8").write(s)
    n += 1

print("bandeaux harmonisés : %d" % n)
