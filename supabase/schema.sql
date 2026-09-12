-- =============================================================================
-- Homelia — schéma Supabase
-- À exécuter une fois dans l'éditeur SQL du projet Supabase (SQL Editor → New query).
-- Il crée les tables, les règles d'accès et les 9 annonces existantes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILS  (une ligne par compte, porte le rôle)
-- ---------------------------------------------------------------------------
create table if not exists public.profils (
  id          uuid primary key references auth.users on delete cascade,
  nom         text,
  telephone   text,
  role        text not null default 'membre' check (role in ('membre', 'responsable')),
  cree_le     timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profils (id, nom, telephone)
  values (new.id, new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'telephone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists creer_profil_apres_inscription on auth.users;
create trigger creer_profil_apres_inscription
  after insert on auth.users
  for each row execute function public.creer_profil();

-- Test de rôle, en security definer pour éviter toute récursion dans les policies
create or replace function public.est_responsable()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profils
    where id = auth.uid() and role = 'responsable'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. ANNONCES  (les programmes immobiliers)
-- ---------------------------------------------------------------------------
create table if not exists public.annonces (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  nom              text not null,
  ville            text not null,
  departement      text not null,
  departement_nom  text,
  region           text,
  statut           text not null default 'En vente',
  typologies       text,
  prix             text,
  prix_libelle     text default 'à partir de',
  logements        text,
  livraison        text,
  accroche         text,
  description      text,
  specs            jsonb not null default '[]'::jsonb,
  prestations      jsonb not null default '[]'::jsonb,
  localisation     jsonb not null default '[]'::jsonb,
  image_url        text,
  image2_url       text,
  page_statique    text,
  mis_en_avant     boolean not null default false,
  ordre            integer not null default 100,
  publiee          boolean not null default true,
  cree_le          timestamptz not null default now(),
  maj_le           timestamptz not null default now()
);

create index if not exists annonces_publiee_ordre on public.annonces (publiee, ordre);

create or replace function public.touch_maj_le()
returns trigger language plpgsql as $$
begin new.maj_le = now(); return new; end;
$$;

drop trigger if exists annonces_maj_le on public.annonces;
create trigger annonces_maj_le before update on public.annonces
  for each row execute function public.touch_maj_le();

-- ---------------------------------------------------------------------------
-- 3. FAVORIS
-- ---------------------------------------------------------------------------
create table if not exists public.favoris (
  utilisateur uuid not null references auth.users on delete cascade,
  annonce     uuid not null references public.annonces on delete cascade,
  cree_le     timestamptz not null default now(),
  primary key (utilisateur, annonce)
);

-- ---------------------------------------------------------------------------
-- 4. MESSAGES  (demandes de contact)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  utilisateur  uuid references auth.users on delete set null,
  nom          text not null,
  email        text not null,
  telephone    text,
  annonce      uuid references public.annonces on delete set null,
  foyer        text,
  rfr          text,
  contenu      text not null,
  statut       text not null default 'nouveau' check (statut in ('nouveau', 'en_cours', 'traite')),
  reponse      text,
  repondu_le   timestamptz,
  cree_le      timestamptz not null default now()
);

create index if not exists messages_statut on public.messages (statut, cree_le desc);
create index if not exists messages_utilisateur on public.messages (utilisateur, cree_le desc);

-- ---------------------------------------------------------------------------
-- 5. RÈGLES D'ACCÈS (Row Level Security)
-- ---------------------------------------------------------------------------
alter table public.profils  enable row level security;
alter table public.annonces enable row level security;
alter table public.favoris  enable row level security;
alter table public.messages enable row level security;

-- Profils : chacun voit et modifie le sien ; les responsables voient tout
drop policy if exists "profil lisible par son propriétaire" on public.profils;
create policy "profil lisible par son propriétaire" on public.profils
  for select using (auth.uid() = id or public.est_responsable());

drop policy if exists "profil modifiable par son propriétaire" on public.profils;
create policy "profil modifiable par son propriétaire" on public.profils
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profils where id = auth.uid()));

drop policy if exists "profil créable par son propriétaire" on public.profils;
create policy "profil créable par son propriétaire" on public.profils
  for insert with check (auth.uid() = id);

-- Annonces : lecture publique des annonces publiées, écriture réservée aux responsables
drop policy if exists "annonces publiques en lecture" on public.annonces;
create policy "annonces publiques en lecture" on public.annonces
  for select using (publiee = true or public.est_responsable());

drop policy if exists "annonces gérées par les responsables" on public.annonces;
create policy "annonces gérées par les responsables" on public.annonces
  for all using (public.est_responsable()) with check (public.est_responsable());

-- Favoris : chacun gère les siens
drop policy if exists "favoris privés" on public.favoris;
create policy "favoris privés" on public.favoris
  for all using (auth.uid() = utilisateur) with check (auth.uid() = utilisateur);

-- Messages : tout le monde peut écrire, chacun relit les siens, les responsables lisent tout
drop policy if exists "message déposable par tous" on public.messages;
create policy "message déposable par tous" on public.messages
  for insert with check (
    utilisateur is null or utilisateur = auth.uid()
  );

drop policy if exists "message lisible par son auteur" on public.messages;
create policy "message lisible par son auteur" on public.messages
  for select using (
    (utilisateur is not null and utilisateur = auth.uid()) or public.est_responsable()
  );

drop policy if exists "message traité par les responsables" on public.messages;
create policy "message traité par les responsables" on public.messages
  for update using (public.est_responsable()) with check (public.est_responsable());

drop policy if exists "message supprimable par les responsables" on public.messages;
create policy "message supprimable par les responsables" on public.messages
  for delete using (public.est_responsable());

-- ---------------------------------------------------------------------------
-- 6. STOCKAGE DES PHOTOS D'ANNONCES
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('annonces', 'annonces', true)
on conflict (id) do nothing;

drop policy if exists "photos d'annonces visibles par tous" on storage.objects;
create policy "photos d'annonces visibles par tous" on storage.objects
  for select using (bucket_id = 'annonces');

drop policy if exists "photos d'annonces déposées par les responsables" on storage.objects;
create policy "photos d'annonces déposées par les responsables" on storage.objects
  for insert with check (bucket_id = 'annonces' and public.est_responsable());

drop policy if exists "photos d'annonces supprimées par les responsables" on storage.objects;
create policy "photos d'annonces supprimées par les responsables" on storage.objects
  for delete using (bucket_id = 'annonces' and public.est_responsable());
