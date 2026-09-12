# Site Homelia — accession immobilière en BRS

Site vitrine statique de **Homelia**, spécialiste de la commercialisation de logements
neufs en **Bail Réel Solidaire** (BRS). Aucune dépendance, aucun build : ce sont des
fichiers HTML, CSS et JavaScript servis tels quels.

## Mise en ligne sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer ce dépôt GitHub.
2. **Framework Preset** : `Other`. Le site est à la racine du dépôt : ne pas toucher au *Root Directory*.
3. Laisser vides *Build Command* et *Output Directory*, puis **Deploy**.
4. Brancher le domaine `homelia-accession.fr` dans *Settings → Domains*.

Le fichier `vercel.json` ajoute la mise en cache des images et trois en-têtes de sécurité.

## Structure

```
index.html              Accueil (simulateur, carrousel, mécanisme, FAQ)
programmes.html         Liste filtrable des programmes
programmes/*.html       Une fiche par programme (9 fiches)
guide-du-brs.html       Guide complet du dispositif
eligibilite.html        Simulateur et plafonds de ressources
accompagnement.html     Parcours acquéreur
promoteurs.html         Espace promoteurs et OFS
nous-connaitre.html     Présentation de la société
contact.html            Formulaire de contact
mentions-legales.html   Mentions légales
confidentialite.html    Politique de confidentialité (RGPD)
cookies.html            Politique de cookies
plan-du-site.html       Plan du site
404.html                Page d'erreur
assets/css/site.css     Feuille de styles unique
assets/js/site.js       Interactions (nav, carrousel, simulateur, FAQ, formulaire, cookies)
assets/img/             Visuels des programmes et logos
sitemap.xml, robots.txt Référencement
```

## À compléter avant la mise en ligne

- **Mentions légales** : forme juridique, capital, RCS, TVA intracommunautaire,
  directeur de la publication, carte professionnelle (loi Hoguet), garantie financière,
  assurance RCP, médiateur de la consommation. Les champs sont signalés entre crochets.
- **Politique de confidentialité** : délégué à la protection des données s'il en existe un,
  et confirmation de la documentation de transfert de l'hébergeur.
- **Formulaire de contact** : il ouvre aujourd'hui le logiciel de messagerie du visiteur
  (`mailto:`). Pour recevoir les demandes directement, brancher un service de formulaire
  (Formspree, Vercel Functions, Brevo…) sur le `submit` dans `assets/js/site.js`.
- **Programmes manquants** : Gleizé (69), Les Chères (69) et Thorigné-Fouillard (35) — leurs
  fiches n'étaient pas accessibles sur le site actuel ; elles restent à créer sur le modèle
  de `programmes/communay.html`.

## Ajouter un programme

Dupliquer un fichier de `programmes/`, remplacer les textes, déposer le visuel dans
`assets/img/`, puis ajouter la carte correspondante dans `programmes.html`, dans le
menu déroulant de l'en-tête et dans `sitemap.xml`.

## Données affichées

Prix, surfaces et disponibilités proviennent des fiches publiées par Homelia.
La grille de lots du 16 Télégraphe est datée du 4 juin 2026 : elle doit être
actualisée à chaque mise à jour commerciale. Les plafonds de ressources
affichés sont ceux de la zone B1.
