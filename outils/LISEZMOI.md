# Outils

## cartes-statiques.py

Fabrique les vignettes de carte des fiches programme, dans
`assets/img/cartes/`. Les fonds proviennent des tuiles d'OpenStreetMap,
assemblées une fois puis hébergées par nous : aucune requête n'est faite
vers un tiers quand un visiteur ouvre une fiche.

Le crédit « © OpenStreetMap contributors » est incrusté dans chaque image
et répété sous la carte. Il doit le rester : c'est la condition de la
licence ODbL.

Pour régénérer après l'ajout d'un programme :

    python3 outils/cartes-statiques.py

Le script lit `progs.json` (slug, latitude, longitude de chaque
programme) et met les tuiles en cache dans `tuiles/`, afin de ne pas
les redemander à chaque exécution.

## refonte-2026-10.py

Applique aux pages HTML la refonte d'octobre 2026 : une seule famille de
police, titres de section en deux colonnes, cartes d'annonce regroupées
en un seul encart, menu mobile sorti de l'en-tête, FAQ fermées à
l'arrivée, espaces insécables (« 199 000 € », « 7 à 8 % », « ? », « : »).

Le script est idempotent : on peut le relancer sans risque, il ne touche
que ce qui n'a pas encore été transformé. Utile après l'ajout d'une page
écrite sur l'ancien modèle.

    python3 outils/refonte-2026-10.py

## retouches-2026-10b.py

Retouches du 16/10 : menu « Programmes » groupé par département, surtitre
retiré des bandeaux quand il répétait le nom de la page, héros d'accueil
sans surtitre, « À la une » en titre sur les actualités, légende retirée
sous la photo des clés. Idempotent, comme le précédent.

    python3 outils/retouches-2026-10b.py

## versionner.py

Ajoute une empreinte (`?v=1a2b3c4d`) aux adresses des fichiers de
`assets/` dans toutes les pages. `vercel.json` fait garder ces fichiers un
an par les navigateurs sans revérification : sans empreinte, un visiteur
déjà venu verrait l'ancienne feuille de style après une mise à jour.

**À relancer après chaque modification d'un fichier de `assets/`**
(CSS, JS, images) :

    python3 outils/versionner.py
