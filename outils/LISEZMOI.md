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
