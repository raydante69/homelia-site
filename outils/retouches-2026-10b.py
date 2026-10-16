#!/usr/bin/env python3
"""Retouches du 16/10/2026, à la suite des retours sur la refonte.

- menu « Programmes » : chaque département devient un groupe distinct,
  ses programmes rangés dessous (nom du programme, puis commune) ;
- bandeau des pages : le surtitre qui répétait le nom de la page sous le
  fil d'Ariane disparaît (il reste là où il apporte une information :
  fiches programme, territoires, articles, page 404) ;
- accueil : plus de surtitre dans le héros ;
- actualités : « À la une » devient un titre, comme « Les publications
  précédentes » ;
- accompagnement : la légende sous la photo des clés est retirée.

Idempotent : on peut le relancer sans risque.
"""
import io, re, subprocess
from collections import Counter

bilan = Counter()
PAGES = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()

# 1. menu « Programmes »
COLONNES = [["rhone", "savoie"], ["ain", "isere"], ["saone-et-loire", "seine-saint-denis", "ille-et-vilaine"]]
MENU = re.compile(r'<ul class="menu-prog">(?:(?!</ul>).)*</ul>', re.S)
source = io.open("index.html", encoding="utf-8").read()
ancien = MENU.search(source).group(0)
deps = {}
if 'class="mp-groupe"' in ancien:
    for g in re.findall(r'<div class="mp-groupe">(.*?)</div>', ancien, re.S):
        d = re.search(r'href="/territoires/([^"]+)\.html"><b>([^<]+)</b><span>(\d+)', g)
        progs = re.findall(r'<a class="mp-prog" href="([^"]+)"><b>([^<]+)</b><span>([^<]+)</span></a>', g)
        deps[d.group(1)] = (d.group(2), d.group(3), progs)
else:
    for bloc in re.split(r'(?=<p class="mp-dep">)', ancien)[1:]:
        d = re.search(r'href="/territoires/([^"]+)\.html">([^<]+?) <span>(\d+)</span>', bloc)
        progs = re.findall(r'<a href="(/programmes/[^"]+)">([^<]+)<span>([^<]+)</span></a>', bloc)
        deps[d.group(1)] = (d.group(2), d.group(3), progs)
tout = re.search(r'<li class="mp-tout">.*?</li>', ancien, re.S).group(0)

def groupe(slug):
    nom, num, progs = deps[slug]
    n = len(progs)
    tete = '<a class="mp-dep" href="/territoires/%s.html"><b>%s</b><span>%s · %d programme%s</span></a>' % (
        slug, nom, num, n, "s" if n > 1 else "")
    lignes = "".join('<a class="mp-prog" href="%s"><b>%s</b><span>%s</span></a>' % p for p in progs)
    return '<div class="mp-groupe">%s%s</div>' % (tete, lignes)

NOUVEAU = '<ul class="menu-prog">%s%s</ul>' % (
    "".join('<li class="mp-col">%s</li>' % "".join(groupe(s) for s in col) for col in COLONNES), tout)

# 2. surtitres de bandeau conservés : ils portent une information
GARDER = re.compile(r'^(programmes/|territoires/|actualites/|404\.html|annonce\.html)')
SURTITRE = re.compile(r'(<section class="phead[^"]*"[^>]*><div class="wrap">\s*<p class="crumb">(?:(?!</p>).)*</p>)\s*<p class="eyebrow">(?:(?!</p>).)*</p>', re.S)

for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    avant = s

    if MENU.search(s) and MENU.search(s).group(0) != NOUVEAU:
        s = MENU.sub(lambda m: NOUVEAU, s, count=1)
        bilan["menus Programmes"] += 1

    if not GARDER.match(f):
        s, n = SURTITRE.subn(r"\1", s)
        bilan["surtitres de bandeau retirés"] += n

    if f == "index.html":
        s, n = re.subn(r'\s*<p class="eyebrow anim d1">[^<]*</p>', "", s, count=1)
        bilan["surtitre du héros d'accueil"] += n
        if '<main id="main">' in s:
            s = s.replace('<main id="main">', '<main id="main" class="accueil">', 1)
            bilan["accueil marqué"] += 1

    if f == "actualites.html":
        s, n = re.subn(r'<p class="eyebrow reveal">À la une</p>',
                       '<div class="actus-titre reveal"><h2>À la une</h2></div>', s)
        bilan["« À la une » en titre"] += n

    if f == "accompagnement.html":
        s, n = re.subn(r'\s*<figcaption>Le jour de la remise des clés[^<]*</figcaption>', "", s)
        bilan["légende retirée"] += n

    if s != avant:
        io.open(f, "w", encoding="utf-8").write(s)

for k in sorted(bilan):
    print("%-36s %d" % (k, bilan[k]))
