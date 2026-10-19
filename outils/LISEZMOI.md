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

## retouches-2026-10c.py

Bandeaux de page identiques partout : fil d'Ariane, titre, chapeau, puis
la ligne d'information (commune, région, date) et les boutons. Le
surtitre au-dessus du titre disparaît ; la page 404 reçoit un fil
d'Ariane. Idempotent.

    python3 outils/retouches-2026-10c.py

## plafonds-2026.py

Plafonds de ressources 2026 (fichier « Plafonds SIEG 2026 » transmis par
Homelia, hors Île-de-France) et zone ABC de chaque commune (zonage officiel
en vigueur depuis le 26 juin 2026, data.gouv.fr). Refait les tableaux de
plafonds, règle le simulateur de chaque fiche sur la zone de sa commune,
ajoute le choix « Programme visé » à l'accueil et sur Éligibilité, et écrit
la durée du bail (99 ans, renouvelable). Les montants sont aussi dans
`assets/js/site.js` (simulateur) : les deux doivent rester identiques.

Pour un nouveau programme : l'ajouter à la liste `PROGRAMMES` du script,
avec la zone de sa commune, puis relancer le script et `versionner.py`.

## finitions-2026-10.py

Finitions du 19/10 : bouton « Connexion » présent dès l'affichage (il
décalait le menu de 65 px à chaque changement de page), bloc titre des
questions fréquentes qui reste à l'écran, titre de la page Éligibilité qui
n'est plus coupé à la main. Idempotent.

    python3 outils/finitions-2026-10.py
