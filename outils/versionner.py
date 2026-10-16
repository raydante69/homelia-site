#!/usr/bin/env python3
"""Ajoute une empreinte aux adresses des fichiers de /assets/ dans les pages.

vercel.json fait garder ces fichiers un an par les navigateurs, sans jamais
les revérifier (« immutable »). Sans empreinte, un visiteur déjà passé sur le
site garderait l'ancienne feuille de style ou l'ancien logo après une mise à
jour. Avec « site.css?v=1a2b3c4d », l'adresse change dès que le fichier
change, et le navigateur va chercher la nouvelle version.

À relancer après chaque modification d'un fichier de assets/ :

    python3 outils/versionner.py
"""
import hashlib, io, os, re, subprocess

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RACINE)
PAGES = subprocess.check_output(["git", "ls-files", "*.html"]).decode().split()
REF = re.compile(r'((?:href|src)=")(/assets/[^"?#]+)(?:\?v=[0-9a-f]*)?(")')
empreintes = {}

def empreinte(chemin):
    if chemin not in empreintes:
        fichier = chemin.lstrip("/")
        if not os.path.isfile(fichier):
            empreintes[chemin] = None
        else:
            empreintes[chemin] = hashlib.md5(open(fichier, "rb").read()).hexdigest()[:8]
    return empreintes[chemin]

modifiees, absents = 0, set()
for f in PAGES:
    s = io.open(f, encoding="utf-8").read()
    def versionner(m):
        e = empreinte(m.group(2))
        if e is None:
            absents.add(m.group(2))
            return m.group(0)
        return "%s%s?v=%s%s" % (m.group(1), m.group(2), e, m.group(3))
    t = REF.sub(versionner, s)
    if t != s:
        io.open(f, "w", encoding="utf-8").write(t)
        modifiees += 1

print("pages mises à jour : %d" % modifiees)
for a in sorted(absents):
    print("introuvable :", a)
