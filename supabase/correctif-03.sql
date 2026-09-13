-- =============================================================================
-- Homelia — correctif n° 3 : les trois programmes ajoutés au catalogue
--   Via Edena (Gleizé, 69) · Côme (Les Chères, 69) · Serenia (Thorigné-Fouillard, 35)
-- À exécuter dans l'éditeur SQL de Supabase, après schema.sql, seed.sql et
-- correctif-02.sql. Relançable sans risque : les lignes déjà présentes sont
-- simplement mises à jour, les neuf autres annonces ne sont pas touchées.
-- =============================================================================

insert into public.annonces
  (slug, nom, ville, departement, departement_nom, region, statut, typologies, prix, prix_libelle,
   logements, livraison, accroche, description, specs, prestations, localisation,
   image_url, image2_url, page_statique)
values
  ('gleize', 'Via Edena', 'Gleizé', '69', 'Rhône', 'Auvergne-Rhône-Alpes', 'En vente', 'T4 · T5', '277 000 €', 'T4 en duplex à partir de', 'Maisons', 'Nous consulter', 'Un nouveau quartier pavillonnaire à huit minutes du centre de Villefranche-sur-Saône.', 'À seulement 8 minutes du centre de Villefranche-sur-Saône, Gleizé déploie un cadre de vie empreint de sérénité. Au cœur d''un secteur paisible, bordé de paysages au charme préservé, un nouveau quartier pavillonnaire prend forme, conçu comme un univers où la nature est omniprésente.

Les maisons de 4 ou 5 pièces dévoilent des surfaces généreuses et des agencements soigneusement conçus pour aménager chaque espace selon vos envies. Chacune s''ouvre sur un jardin privatif, prolongé d''une terrasse ombragée par une pergola.', '["Maisons T4 et T5", "Duplex avec jardin", "Garage + stationnement", "Terrasse et pergola"]'::jsonb, '[{"titre": "Jardin privatif et pergola", "detail": "Chaque maison s''ouvre sur un jardin privatif prolongé d''une terrasse ombragée par une pergola."}, {"titre": "Garage et stationnement", "detail": "Un garage et une place de stationnement sont compris dans le prix affiché."}, {"titre": "Maisons en duplex", "detail": "Des T4 et T5 sur deux niveaux, aux surfaces généreuses et aux agencements modulables."}, {"titre": "Quartier pavillonnaire neuf", "detail": "Un secteur paisible bordé de paysages préservés, aux portes de Villefranche-sur-Saône."}]'::jsonb, '[{"titre": "En voiture", "points": ["Centre de Villefranche-sur-Saône : 8 min", "Accès A6 par Villefranche", "Lyon : environ 45 min"]}, {"titre": "À proximité", "points": ["Commerces, écoles et services de Gleizé", "Équipements de Villefranche-sur-Saône"]}, {"titre": "Cadre", "points": ["Secteur pavillonnaire calme", "Paysages du Beaujolais"]}]'::jsonb, '/assets/img/gleize-1.jpg', '/assets/img/gleize-2.jpg', '/programmes/gleize.html'),
  ('les-cheres', 'Côme', 'Les Chères', '69', 'Rhône', 'Auvergne-Rhône-Alpes', 'En vente', 'T2 à T4', '159 400 €', 'T2 à partir de', '18 appartements', 'Nous consulter', 'Dix-huit appartements dans un village authentique, à vingt minutes de l''entrée de Lyon.', 'Idéalement située à 20 minutes de l''entrée de Lyon, Côme propose 18 appartements du 2 au 4 pièces. Cette résidence intimiste s''intègre dans un cadre pavillonnaire calme et verdoyant, au cœur du village des Chères, à quelques pas des commerces, des écoles et des transports.

Pensée comme un lieu de vie apaisant et contemporain, Côme séduit par ses lignes douces, ses teintes naturelles et son architecture soignée. Chaque logement bénéficie d''un extérieur privatif — balcon, terrasse ou jardin — et d''au moins une place de stationnement incluse dans le prix.', '["18 appartements", "T2 à T4", "Extérieur privatif", "Stationnement inclus"]'::jsonb, '[{"titre": "Extérieur privatif", "detail": "Un balcon, une terrasse ou un jardin pour chaque appartement."}, {"titre": "Stationnement inclus", "detail": "Au moins une place de stationnement comprise dans le prix affiché."}, {"titre": "Résidence intimiste", "detail": "Dix-huit logements seulement, dans un cadre pavillonnaire calme et verdoyant."}, {"titre": "Architecture soignée", "detail": "Des lignes douces, des teintes naturelles et des espaces ouverts et lumineux."}]'::jsonb, '[{"titre": "En voiture", "points": ["Entrée de Lyon : 20 min", "Villefranche-sur-Saône à proximité"]}, {"titre": "En transport", "points": ["Arrêt de bus à 5 min à pied", "Liaisons vers Lyon et Villefranche-sur-Saône"]}, {"titre": "À proximité", "points": ["Commerces du village", "Écoles et transports en commun"]}]'::jsonb, '/assets/img/lescheres-1.jpg', '/assets/img/lescheres-2.jpg', '/programmes/les-cheres.html'),
  ('thorigne-fouillard', 'Serenia', 'Thorigné-Fouillard', '35', 'Ille-et-Vilaine', 'Bretagne', 'En vente', 'T2 · T3', '159 900 €', 'T2 à partir de', 'Appartements', 'Nous consulter', 'Notre adresse bretonne, dans la première couronne de Rennes.', 'Au cœur de Thorigné-Fouillard, l''adresse séduit par son cadre de vie agréable et pratique : le calme d''une petite ville et les avantages d''une grande agglomération toute proche. La ligne de bus 50 rejoint le métro rennais en 15 minutes.

Le quartier est particulièrement apprécié des familles : commerces de proximité, cadre verdoyant avec le parc pédagogique de la Juteauderie et ses potagers associatifs, et des projets d''aménagement qui préservent l''équilibre entre logements neufs et espaces naturels.', '["T2 et T3", "Stationnement inclus", "Bus 50 vers le métro", "Première couronne rennaise"]'::jsonb, '[{"titre": "Stationnement inclus", "detail": "Une place de stationnement comprise dans le prix affiché."}, {"titre": "À 15 minutes du métro", "detail": "La ligne de bus 50 rejoint le métro rennais en un quart d''heure."}, {"titre": "Commerces de proximité", "detail": "Boulangeries, services et équipements à quelques pas de la résidence."}, {"titre": "Un quartier verdoyant", "detail": "Le parc pédagogique de la Juteauderie, ses potagers associatifs et ses petits animaux."}]'::jsonb, '[{"titre": "En transport", "points": ["Bus 50 : métro rennais en 15 min", "Rennes centre à proximité"]}, {"titre": "À proximité", "points": ["Commerces de proximité et boulangeries", "Écoles et équipements de la commune"]}, {"titre": "Cadre", "points": ["Parc pédagogique de la Juteauderie", "Première couronne de Rennes"]}]'::jsonb, '/assets/img/thorigne-1.jpg', '/assets/img/thorigne-2.jpg', '/programmes/thorigne-fouillard.html')
on conflict (slug) do update set
  nom = excluded.nom, ville = excluded.ville, departement = excluded.departement,
  departement_nom = excluded.departement_nom, region = excluded.region, statut = excluded.statut,
  typologies = excluded.typologies, prix = excluded.prix, prix_libelle = excluded.prix_libelle,
  logements = excluded.logements, livraison = excluded.livraison, accroche = excluded.accroche,
  description = excluded.description, specs = excluded.specs, prestations = excluded.prestations,
  localisation = excluded.localisation, image_url = excluded.image_url,
  image2_url = excluded.image2_url, page_statique = excluded.page_statique;

-- Coordonnées de la carte et données du simulateur de mensualité
update public.annonces set lat = 45.98883, lon = 4.69715, prix_num = 277000 where slug = 'gleize';
update public.annonces set lat = 45.89016, lon = 4.74329, prix_num = 159400 where slug = 'les-cheres';
update public.annonces set lat = 48.15352, lon = -1.58002, prix_num = 159900 where slug = 'thorigne-fouillard';

-- Ces trois programmes s'affichent après les cinq mis en avant
update public.annonces set ordre = 50, mis_en_avant = false
where slug in ('gleize', 'les-cheres', 'thorigne-fouillard') and mis_en_avant is not true;

-- Vérification : les trois lignes doivent apparaître avec leurs coordonnées
select slug, nom, ville, departement, prix, lat, lon, prix_num
from public.annonces where slug in ('gleize', 'les-cheres', 'thorigne-fouillard') order by ville;
