-- =============================================================================
-- Homelia — correctif n° 2 : carte et simulateur de mensualité
-- À exécuter dans l'éditeur SQL de Supabase, après schema.sql et seed.sql.
-- Ajoute cinq colonnes aux annonces et renseigne les programmes existants.
-- Relançable sans risque.
-- =============================================================================

alter table public.annonces
  add column if not exists lat          numeric,
  add column if not exists lon          numeric,
  add column if not exists prix_num     integer,
  add column if not exists redevance_m2 numeric,
  add column if not exists surface_ref  numeric;

update public.annonces set lat = 45.60433, lon = 4.83247, prix_num = 199000, redevance_m2 = 1.15, surface_ref = 60.44 where slug = 'communay';
update public.annonces set lat = 45.35583, lon = 5.616, prix_num = 129000, surface_ref = 45 where slug = 'coublevie';
update public.annonces set lat = 45.8905, lon = 5.16165, prix_num = 235500, surface_ref = 90 where slug = 'bourg-saint-christophe';
update public.annonces set lat = 45.99147, lon = 4.77421, prix_num = 219000, surface_ref = 85 where slug = 'frans';
update public.annonces set lat = 46.0007, lon = 4.84815, prix_num = 225000, surface_ref = 85 where slug = 'savigneux';
update public.annonces set lat = 46.02533, lon = 4.65228, prix_num = 257500, surface_ref = 100 where slug = 'saint-julien';
update public.annonces set lat = 46.21102, lon = 4.75552, prix_num = 185000, surface_ref = 85 where slug = 'la-chapelle-de-guinchay';
update public.annonces set lat = 45.5816, lon = 5.9408, prix_num = 153000, surface_ref = 45 where slug = 'bassens';
update public.annonces set lat = 48.92298, lon = 2.44552, prix_num = 169000, surface_ref = 45 where slug = 'drancy';
update public.annonces set lat = 45.98883, lon = 4.69715, prix_num = 277000 where slug = 'gleize';
update public.annonces set lat = 45.89016, lon = 4.74329, prix_num = 159400 where slug = 'les-cheres';
update public.annonces set lat = 48.15352, lon = -1.58002, prix_num = 159900 where slug = 'thorigne-fouillard';

-- Vérification : les 12 programmes doivent avoir des coordonnées
select slug, ville, lat, lon, prix_num, surface_ref, redevance_m2
from public.annonces order by ordre, nom;
