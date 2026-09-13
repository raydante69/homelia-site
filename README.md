# Site Homelia — accession immobilière en BRS

Site vitrine statique de **Homelia**, spécialiste de la commercialisation de logements
neufs en **Bail Réel Solidaire** (BRS). Aucune dépendance, aucun build : ce sont des
fichiers HTML, CSS et JavaScript servis tels quels.

## Mise en ligne sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer ce dépôt GitHub.
2. **Framework Preset** : `Other`.
3. **Root Directory** : `homelia` (le dossier qui contient `index.html`).
4. Laisser vides *Build Command* et *Output Directory*, puis **Deploy**.
5. Brancher le domaine `homelia-accession.fr` dans *Settings → Domains*.

Le fichier `vercel.json` ajoute la mise en cache des images et trois en-têtes de sécurité.

## Structure

```
index.html              Accueil (carrousel d'annonces, simulateur, mécanisme, FAQ)
programmes.html         Liste filtrable des programmes
programmes/*.html       Une fiche rédigée par programme (9 fiches)
annonce.html            Fiche générée pour les annonces créées depuis l'administration
guide-du-brs.html       Guide complet du dispositif
eligibilite.html        Simulateur et plafonds de ressources
accompagnement.html     Parcours acquéreur
promoteurs.html         Espace promoteurs et OFS
nous-connaitre.html     Présentation de la société
contact.html            Formulaire de contact
connexion.html          Connexion et création de compte
espace.html             Espace membre : favoris, demandes, profil
admin.html              Espace responsable : annonces, demandes, compte
mentions-legales.html   Mentions légales
confidentialite.html    Politique de confidentialité (RGPD)
cookies.html            Politique de cookies
plan-du-site.html       Plan du site
404.html                Page d'erreur
assets/css/site.css     Feuille de styles unique
assets/js/site.js       Interactions du site public
assets/js/app.js        Comptes, annonces, favoris, messagerie
assets/js/supabase-config.js  Clés Supabase (renseignées)
assets/js/vendor/supabase.js  Bibliothèque supabase-js, servie avec le site
assets/img/             Visuels des programmes et logos
supabase/schema.sql     Tables et règles d'accès
supabase/seed.sql       Chargement des 9 annonces existantes
supabase/correctif-01.sql  Règle d'accès des profils + promotion du responsable
supabase/correctif-02.sql  Colonnes carte et simulateur de mensualité
sitemap.xml, robots.txt Référencement
```

## Les trois espaces

Le site sert trois publics depuis un seul déploiement :

| Espace | Adresse | Qui y accède |
|---|---|---|
| Public | toutes les pages | tout le monde, sans compte |
| Membre | `/espace.html` | toute personne inscrite : favoris, suivi de ses demandes, profil |
| Responsable | `/admin.html` | comptes dont le rôle est `responsable` : annonces, demandes reçues, réglages du compte |

L'accès n'est pas seulement masqué dans l'interface : les règles *Row Level Security*
de Supabase refusent côté serveur toute écriture d'annonce et toute lecture des
demandes d'autrui à un compte qui n'est pas responsable.

## Activer les comptes (Supabase)

Les clés sont renseignées : les comptes sont actifs. Si l'on vide
`assets/js/supabase-config.js`, le site retombe en mode statique — les pages de
connexion et d'administration affichent un message et le formulaire de contact
bascule sur le logiciel de messagerie du visiteur.

La bibliothèque `supabase-js` est servie depuis `assets/js/vendor/` plutôt que
depuis un CDN : une dépendance externe de moins, et rien à déclarer de plus
côté RGPD.

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit), région Europe.
2. **SQL Editor → New query** : coller `supabase/schema.sql`, exécuter.
3. Nouvelle requête : coller `supabase/seed.sql`, exécuter (charge les 9 annonces).
4. **Authentication → Users → Add user** : e-mail `contact@homelia-accession.fr`,
   mot de passe choisi, cocher *Auto Confirm User*.
5. Revenir au SQL Editor et exécuter `supabase/correctif-01.sql`, qui promeut ce
   compte en responsable (et corrige une règle d'accès). La requête de
   vérification en fin de fichier doit renvoyer `role = responsable`.
6. **Project Settings → API** : copier *Project URL* et la clé *anon public*
   dans `assets/js/supabase-config.js`, puis pousser le fichier. *(Fait.)*
7. **Authentication → URL Configuration** : renseigner l'adresse du site
   (`https://…vercel.app` puis le domaine définitif) dans *Site URL* et
   *Redirect URLs*, sinon les liens de confirmation et de réinitialisation échouent.

La clé *anon* est publique par conception : elle ne donne accès qu'à ce que les
règles d'accès autorisent. La clé *service_role*, elle, ne doit jamais être
placée dans ce dépôt.

## Carte et simulateur de mensualité

Chaque fiche affiche une carte OpenStreetMap et un simulateur de coût mensuel
(crédit + redevance foncière). Les deux se nourrissent de cinq colonnes ajoutées
par `supabase/correctif-02.sql` : `lat`, `lon`, `prix_num`, `surface_ref` et
`redevance_m2`, renseignables depuis l'administration.

La carte n'est chargée qu'après un clic du visiteur : aucune requête ne part
vers OpenStreetMap avant, ce qui évite d'avoir à la déclarer comme traceur.

## Gérer les annonces

Dans `/admin.html`, onglet **Annonces** : créer, modifier, masquer ou supprimer.
Une annonce créée ici apparaît automatiquement dans le carrousel de la page
d'accueil (si elle est mise en avant) et dans la liste des programmes, avec une
fiche à l'adresse `/annonce.html?a=identifiant`.

Les 9 fiches rédigées à la main dans `programmes/` restent prioritaires : elles
sont mieux référencées. Pour remplacer l'une d'elles par la fiche générée, vider
le champ `page_statique` de l'annonce correspondante.

## À compléter avant la mise en ligne

- **Mentions légales** : forme juridique, capital, RCS, TVA intracommunautaire,
  directeur de la publication, carte professionnelle (loi Hoguet), garantie financière,
  assurance RCP, médiateur de la consommation. Les champs sont signalés entre crochets.
- **Politique de confidentialité** : délégué à la protection des données s'il en existe un,
  confirmation de la documentation de transfert de l'hébergeur, et mention de Supabase
  comme sous-traitant une fois les comptes activés.
- **Programmes manquants** : Gleizé (69), Les Chères (69) et Thorigné-Fouillard (35) — leurs
  fiches n'étaient pas accessibles sur le site actuel ; elles peuvent désormais être créées
  directement depuis l'espace d'administration.

## Ajouter un programme

Dupliquer un fichier de `programmes/`, remplacer les textes, déposer le visuel dans
`assets/img/`, puis ajouter la carte correspondante dans `programmes.html`, dans le
menu déroulant de l'en-tête et dans `sitemap.xml`.

## Données affichées

Prix, surfaces et disponibilités proviennent des fiches publiées par Homelia.
La grille de lots du 16 Télégraphe est datée du 4 juin 2026 : elle doit être
actualisée à chaque mise à jour commerciale. Les plafonds de ressources
affichés sont ceux de la zone B1.
