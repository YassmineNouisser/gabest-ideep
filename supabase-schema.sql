-- ============================================================
-- GABEST · Schéma Supabase pour la table des patients
-- ------------------------------------------------------------
-- À exécuter UNE FOIS dans le SQL Editor de Supabase :
-- https://app.supabase.com → ton projet → SQL Editor → New query
-- ============================================================

-- 1) Table principale
create table if not exists public.patients (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  prenom      text        not null,
  age         int         not null,
  zone        text        not null,
  symptomes   text[]      not null default '{}',
  duree       text        not null,
  profil      text[]      not null default '{}',
  pollution   jsonb       not null,
  rapport     jsonb
);

-- 2) Index pour le tri (le plus récent en premier)
create index if not exists patients_created_at_idx
  on public.patients (created_at desc);

-- 3) Row Level Security — anon peut lire et insérer
alter table public.patients enable row level security;

drop policy if exists "anon read" on public.patients;
create policy "anon read"
  on public.patients
  for select
  using (true);

drop policy if exists "anon insert" on public.patients;
create policy "anon insert"
  on public.patients
  for insert
  with check (true);

-- 4) Realtime — pour que le médecin voie les nouveaux signalements en direct
alter publication supabase_realtime add table public.patients;

-- 5) (optionnel) données de démo pour ne pas avoir un tableau vide
insert into public.patients (prenom, age, zone, symptomes, duree, profil, pollution, rapport)
values
  ('Amira', 34, 'Ghannouch',
   array['Toux sèche','Maux de tête'], '2-3 jours', array[]::text[],
   '{"so2":87,"pm25":42,"pm10":65,"no2":28,"aqi":3}'::jsonb,
   '{
     "cause_probable":"Exposition SO₂ industriel",
     "lien_pollution":"oui",
     "niveau_gravite":"modéré",
     "explication":"Les symptômes correspondent à une irritation des voies respiratoires liée au SO₂ émis par les complexes industriels de Ghannouch. La concentration mesurée dépasse les seuils OMS.",
     "recommandation_patient":"Limiter les sorties matinales, porter un masque FFP2 à l’extérieur, hydratation accrue.",
     "recommandation_medecin":"Surveiller fonction respiratoire",
     "action_immediate":"Consultation 24h",
     "resume":"Patiente exposée aux rejets SO₂ de Ghannouch présentant céphalées et toux sèche depuis 2-3 jours. Lien environnemental probable. Surveillance recommandée."
   }'::jsonb),
  ('Mohamed', 67, 'Bou Chemma',
   array['Difficultés respiratoires','Fatigue'], '1 semaine', array['Personne âgée +65 ans'],
   '{"so2":95,"pm25":58,"pm10":78,"no2":35,"aqi":4}'::jsonb,
   '{
     "cause_probable":"Particules fines PM2.5 élevées",
     "lien_pollution":"oui",
     "niveau_gravite":"critique",
     "explication":"Le taux de PM2.5 atteint un seuil critique à Bou Chemma. Chez un patient âgé, ces particules pénètrent profondément les alvéoles et provoquent dyspnée et fatigue intense.",
     "recommandation_patient":"Confinement immédiat, éviter tout effort physique, contacter SAMU si aggravation.",
     "recommandation_medecin":"Spirométrie urgente, antécédents cardiaques à vérifier",
     "action_immediate":"Urgences",
     "resume":"Patient âgé exposé à PM2.5 critique présentant dyspnée et asthénie d''aggravation progressive. Risque cardio-respiratoire élevé. Prise en charge urgente requise."
   }'::jsonb),
  ('Sarra', 8, 'Métouia',
   array['Yeux irrités','Toux sèche'], 'Aujourd''hui', array['Enfant -12 ans'],
   '{"so2":34,"pm25":28,"pm10":40,"no2":18,"aqi":2}'::jsonb,
   '{
     "cause_probable":"NO₂ et poussières agricoles",
     "lien_pollution":"probable",
     "niveau_gravite":"faible",
     "explication":"Les niveaux modérés de NO₂ combinés à des poussières d’origine agricole peuvent expliquer l’irritation oculaire et la toux légère chez l’enfant.",
     "recommandation_patient":"Rinçage oculaire au sérum physiologique, repos, surveillance parentale.",
     "recommandation_medecin":"Antihistaminiques, revoir si aggravation",
     "action_immediate":"Repos à domicile",
     "resume":"Enfant avec symptômes légers liés à la qualité de l’air à Métouia. Aucun signe de gravité. Suivi à 48h conseillé."
   }'::jsonb)
on conflict do nothing;
