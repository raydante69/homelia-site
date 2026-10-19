#!/usr/bin/env python3
"""Plafonds de ressources 2026 et durée du bail.

Plafonds : fichier « Plafonds SIEG 2026 » transmis par Homelia (opérations
PSLA et BRS, hors Île-de-France), revenu fiscal de référence N-2 :
  zone A, zone B1 (plafonds intermédiaires), zones B2 et C.
Zone de chaque commune : zonage ABC officiel en vigueur depuis le
26 juin 2026 (data.gouv.fr, « Liste des communes selon le zonage ABC »).

Le script :
- refait les tableaux de plafonds (Éligibilité, Guide du BRS) avec les
  trois grilles ;
- règle le simulateur de chaque fiche programme sur la zone de sa commune ;
- ajoute un choix « Programme visé » au simulateur de l'accueil et de la
  page Éligibilité ;
- écrit la durée du bail : 99 ans, renouvelable.

Idempotent : on peut le relancer sans risque.
"""
import io, re

# slug, nom du programme, commune, département, zone ABC (IDF : Île-de-France,
# hors du champ du fichier de plafonds)
PROGRAMMES = [
    ("communay", "Le 16 Télégraphe", "Communay", "69", "B1"),
    ("saint-julien", "Le Clos Chopin", "Saint-Julien", "69", "C"),
    ("gleize", "Via Edena", "Gleizé", "69", "B1"),
    ("les-cheres", "Côme", "Les Chères", "69", "B1"),
    ("bourg-saint-christophe", "Le Domaine des Chênes 2", "Bourg-Saint-Christophe", "01", "B1"),
    ("frans", "Green Parc", "Frans", "01", "B2"),
    ("savigneux", "L'Orée des champs", "Savigneux", "01", "C"),
    ("coublevie", "Les Terrasses des 3 Parcs", "Coublevie", "38", "B1"),
    ("bassens", "Camberia", "Bassens", "73", "A"),
    ("la-chapelle-de-guinchay", "Le Bois de la Croix", "La Chapelle-de-Guinchay", "71", "C"),
    ("drancy", "L'Essentiel", "Drancy", "93", "IDF"),
    ("thorigne-fouillard", "Serenia", "Thorigné-Fouillard", "35", "B1"),
]

PLAFONDS = {
    "A":  [38844, 58057, 76105, 90863, 108107, 121650, 13557],
    "B1": [38844, 53579, 64431, 77783, 91503, 103122, 11506],
    "BC": [33771, 45100, 54235, 65476, 77023, 86805, 9683],
}

def euro(n):
    return "{:,}".format(n).replace(",", "&nbsp;") + "&nbsp;€"

def euro_tableau(n):
    # sur mobile, le signe € disparaît des cellules (la note précise « en euros »)
    return "{:,}".format(n).replace(",", "&nbsp;") + '<span class="eur">&nbsp;€</span>'

def note_zone(zone, commune):
    if zone == "IDF":
        return ("%s est en Île-de-France&nbsp;: les plafonds franciliens diffèrent de ceux affichés ici, "
                "nous vous les communiquons." % commune)
    return "Plafonds 2026 de la zone %s, celle de %s." % (zone, commune)

# ---------------------------------------------------------------- tableaux
LIGNES = ["1 personne", "2 personnes", "3 personnes", "4 personnes", "5 personnes", "6 personnes",
          "Par personne en plus"]
COURTS = ["1 pers.", "2 pers.", "3 pers.", "4 pers.", "5 pers.", "6 pers.", "En plus"]
def tableau():
    tete = ('<thead><tr><th><span class="l-long">Composition du foyer</span><span class="l-court">Foyer</span></th><th class="num">Zone A</th>'
            '<th class="num">Zone B1</th><th class="num">Zones B2 et C</th></tr></thead>')
    corps = "".join(
        '<tr><td data-col="Foyer"><span class="l-long">%s</span><span class="l-court">%s</span></td>%s</tr>' % (LIGNES[i], COURTS[i], "".join(
            '<td class="num" data-col="%s"><strong>%s%s</strong></td>' % (
                col, "+&nbsp;" if i == 6 else "", euro_tableau(PLAFONDS[z][i]))
            for z, col in (("A", "Zone A"), ("B1", "Zone B1"), ("BC", "Zones B2 et C"))))
        for i in range(7))
    return '<div class="table-wrap"><table class="plafonds">%s<tbody>%s</tbody></table></div>' % (tete, corps)

NOTE_PRECEDENTE = '<p class="note">Plafonds 2026 de revenu fiscal de référence (N−2), hors Île-de-France. '
NOTE_TABLEAU = ('<p class="note">Plafonds 2026 de revenu fiscal de référence (N−2), en euros, hors Île-de-France. '
                'Une personne seule avec des personnes à charge passe à la ligne du dessus&nbsp;: avec un enfant, '
                'elle relève de la ligne «&nbsp;3 personnes&nbsp;», comme un jeune ménage. En zones A et B1, ces '
                'plafonds dits intermédiaires valent pour une partie seulement des logements vendus chaque année&nbsp;: '
                'nous vous confirmons votre situation.</p>')

ANCIEN_TABLEAU = re.compile(
    r'<div class="table-wrap"><table style="min-width:0">\s*<thead><tr><th>Composition du foyer</th>'
    r'<th class="num">Plafond RFR — zone B1</th></tr></thead>\s*<tbody>(?:(?!</table>).)*</tbody>\s*</table></div>', re.S)
TABLEAU_2026 = re.compile(r'<div class="table-wrap"><table class="plafonds">.*?</table></div>', re.S)
ANCIENNE_NOTE = re.compile(r'<p class="note">Plafonds de revenu fiscal de référence \(N−2\) applicables en zone B1\.(?:(?!</p>).)*</p>')

# -------------------------------------------------------------- simulateur
ANCIENNE_NOTE_SIM = re.compile(
    r'<p style="font-size:12px;color:var\(--mut\);margin:0">Plafonds de la zone B1, celle du programme de Communay\.(?:(?!</p>).)*</p>')

def choix_programme():
    options = "".join(
        '<option value="%s" data-zone="%s" data-commune="%s"%s>%s · %s (%s)</option>' % (
            slug, zone, commune, " selected" if slug == "communay" else "", nom.replace("'", "&#39;"), commune, dep)
        for slug, nom, commune, dep, zone in PROGRAMMES)
    return ('<div class="field"><label for="sim-prog">Programme visé</label>'
            '<select id="sim-prog">%s</select></div>\n    ' % options)

DUREES = [
    ("Le bail réel solidaire est conclu pour une longue durée, généralement de 18 à 99 ans selon l'OFS, et il est «&nbsp;rechargé&nbsp;» à sa durée initiale à chaque mutation&nbsp;: l'acquéreur suivant repart donc sur une durée pleine.",
     "Le bail réel solidaire est conclu pour 99 ans, renouvelable. À chaque revente, il est «&nbsp;rechargé&nbsp;» à sa durée initiale&nbsp;: l'acquéreur suivant repart donc sur 99 ans."),
    ("Vous signez un bail de longue durée — jusqu'à 99 ans — qui vous permet",
     "Vous signez un bail de 99 ans, renouvelable, qui vous permet"),
    ("le loue via un bail de longue durée (18 à 99 ans).",
     "le loue via un bail de 99 ans, renouvelable."),
]

bilan = {}
def compter(k, n=1):
    bilan[k] = bilan.get(k, 0) + n

pages = ["index.html", "eligibilite.html", "guide-du-brs.html",
         "actualites/devenir-proprietaire-petit-budget.html",
         "actualites/qu-est-ce-que-le-bail-reel-solidaire.html"] + \
        ["programmes/%s.html" % p[0] for p in PROGRAMMES]

for f in pages:
    s = io.open(f, encoding="utf-8").read()
    avant = s

    s, n = ANCIEN_TABLEAU.subn(lambda m: tableau(), s)
    compter("tableaux de plafonds", n)
    t = TABLEAU_2026.sub(lambda m: tableau(), s)
    if t != s:
        s = t
        compter("tableaux 2026 mis à jour", 1)
    if NOTE_PRECEDENTE in s:
        s = s.replace(NOTE_PRECEDENTE, NOTE_TABLEAU[:NOTE_TABLEAU.index("hors Île-de-France. ") + len("hors Île-de-France. ")])
        compter("notes de tableau", 1)
    s, n = ANCIENNE_NOTE.subn(lambda m: NOTE_TABLEAU, s)
    compter("notes de tableau", n)

    if 'id="sim-form"' in s:
        s = s.replace('<input type="range" id="rfr" min="10000" max="110000"', '<input type="range" id="rfr" min="10000" max="125000"')
        prog = next((p for p in PROGRAMMES if f == "programmes/%s.html" % p[0]), None)
        if prog:
            slug, nom, commune, dep, zone = prog
            s = re.sub(r'<div class="sim flat" id="sim-form"(?: data-zone="[^"]*" data-commune="[^"]*")?>',
                       '<div class="sim flat" id="sim-form" data-zone="%s" data-commune="%s">' % (zone, commune), s, count=1)
            s, n = ANCIENNE_NOTE_SIM.subn('<p class="sim-note" id="sim-note">%s</p>' % note_zone(zone, commune), s)
            compter("simulateurs de fiche", n)
        else:
            if 'id="sim-prog"' not in s:
                s, n = re.subn(r'(<div class="field">\s*<div class="rfr-head">)', lambda m: choix_programme() + m.group(1), s, count=1)
                compter("choix du programme ajouté", n)
            s, n = ANCIENNE_NOTE_SIM.subn('<p class="sim-note" id="sim-note">%s</p>' % note_zone("B1", "Communay"), s)
            compter("notes de simulateur", n)
        # valeurs affichées avant le calcul : zone B1, 3 personnes, 44 000 €
        s = s.replace('id="gCap">Plafond 60&nbsp;543&nbsp;€', 'id="gCap">Plafond 64&nbsp;431&nbsp;€')
        s = s.replace('id="vBig">16&nbsp;543&nbsp;€ de marge', 'id="vBig">20&nbsp;431&nbsp;€ de marge')

    if f == "guide-du-brs.html" and 'class="plafonds"' in s and NOTE_TABLEAU not in s:
        i = s.index("</table></div>", s.index('class="plafonds"')) + len("</table></div>")
        s = s[:i] + "\n      " + NOTE_TABLEAU + s[i:]
        compter("notes de tableau", 1)

    s = s.replace("Il applique les plafonds de la zone B1, celle de la plupart de nos programmes.",
                  "Il applique les plafonds 2026 de la zone du programme choisi, hors Île-de-France.")

    for a, b in DUREES:
        if a in s:
            s = s.replace(a, b)
            compter("durées du bail", 1)

    if s != avant:
        io.open(f, "w", encoding="utf-8").write(s)

for k in sorted(bilan):
    print("%-30s %d" % (k, bilan[k]))
