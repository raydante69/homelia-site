-- =============================================================================
-- Homelia — correctif n° 1
-- À exécuter dans l'éditeur SQL de Supabase, après schema.sql et seed.sql.
-- Deux corrections :
--   1. la règle de modification du profil interrogeait la table qu'elle protège,
--      ce qui déclenche une erreur « infinite recursion » à l'enregistrement ;
--   2. la promotion du compte responsable échouait silencieusement lorsque la
--      fiche de profil n'existait pas encore.
-- Relançable sans risque.
-- =============================================================================

-- 1. Lecture du rôle sans repasser par les règles d'accès
create or replace function public.mon_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profils where id = auth.uid();
$$;

drop policy if exists "profil modifiable par son propriétaire" on public.profils;
create policy "profil modifiable par son propriétaire" on public.profils
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = public.mon_role());

-- 2. Promotion du compte responsable, que la fiche de profil existe ou non
insert into public.profils (id, role)
select id, 'responsable' from auth.users
where email = 'contact@homelia-accession.fr'
on conflict (id) do update set role = 'responsable';

-- Vérification : doit renvoyer une ligne avec role = responsable
select u.email, p.role
from auth.users u join public.profils p on p.id = u.id
where u.email = 'contact@homelia-accession.fr';
