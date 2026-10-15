import json, math, os, subprocess, time, urllib.request

Z, LARG, HAUT = 13, 1200, 525
UA = "HomeliaSiteBuilder/1.0 (+https://www.homelia-accession.fr; contact@homelia-accession.fr)"
progs = json.load(open("progs.json", encoding="utf-8"))

def pixel(lat, lon, z):
    n = 2 ** z * 256
    x = (lon + 180.0) / 360.0 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return x, y

def tuile(z, tx, ty):
    chemin = "tuiles/%d_%d_%d.png" % (z, tx, ty)
    if os.path.exists(chemin):
        return chemin
    url = "https://tile.openstreetmap.org/%d/%d/%d.png" % (z, tx, ty)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r, open(chemin, "wb") as f:
        f.write(r.read())
    time.sleep(0.15)
    return chemin

for slug, p in progs.items():
    px, py = pixel(p["lat"], p["lon"], Z)
    gauche, haut = px - LARG / 2, py - HAUT / 2
    tx0, ty0 = int(gauche // 256), int(haut // 256)
    tx1, ty1 = int((gauche + LARG) // 256), int((haut + HAUT) // 256)
    colonnes = []
    for tx in range(tx0, tx1 + 1):
        col = [tuile(Z, tx, ty) for ty in range(ty0, ty1 + 1)]
        bande = "cartes/_col_%d.png" % tx
        subprocess.run(["convert"] + col + ["-append", bande], check=True)
        colonnes.append(bande)
    brut = "cartes/_brut.png"
    subprocess.run(["convert"] + colonnes + ["+append", brut], check=True)
    dx, dy = int(gauche - tx0 * 256), int(haut - ty0 * 256)
    cx, cy = LARG // 2, HAUT // 2
    sortie = "cartes/%s.jpg" % slug
    subprocess.run([
        "convert", brut, "-crop", "%dx%d+%d+%d" % (LARG, HAUT, dx, dy), "+repage",
        # repère en forme d'épingle : la pointe marque l'adresse, le corps
        # se place au-dessus pour ne pas masquer le nom de la commune
        "-stroke", "none", "-fill", "rgba(15,29,36,0.20)",
        "-draw", "ellipse %d,%d 9,3 0,360" % (cx, cy + 1),
        "-fill", "#1E3A48", "-stroke", "#FFFFFF", "-strokewidth", "2.5",
        "-draw", "path 'M %d,%d L %d,%d L %d,%d Z'" % (cx, cy, cx - 8, cy - 20, cx + 8, cy - 20),
        "-draw", "circle %d,%d %d,%d" % (cx, cy - 26, cx + 11, cy - 26),
        "-fill", "#D9B27C", "-stroke", "none",
        "-draw", "circle %d,%d %d,%d" % (cx, cy - 26, cx + 4, cy - 26),
        # crédit obligatoire
        "-fill", "rgba(255,255,255,0.82)", "-stroke", "none",
        "-draw", "rectangle %d,%d %d,%d" % (LARG - 236, HAUT - 24, LARG, HAUT),
        "-fill", "#3C4F58", "-pointsize", "13", "-gravity", "SouthEast",
        "-annotate", "+8+6", "© OpenStreetMap contributors",
        "-quality", "80", sortie], check=True)
    print(sortie, os.path.getsize(sortie) // 1024, "Ko")

for f in os.listdir("cartes"):
    if f.startswith("_"):
        os.remove("cartes/" + f)
