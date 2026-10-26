-- ============================================================
-- Cut Scenes · migration 007
-- One song per film instead of whole albums: the main theme.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again.
-- ============================================================

update public.films f set spotify = v.s
from (values
  (4808,   'track/0G0SPViSDa3ajAkzna1bZD'),  -- Charade · Charade (Main Title)
  (149871, 'track/4WdhtCbcNLyXewxXEFaThY'),  -- Kaguya · When I Remember This Life
  (944952, 'track/3V6tRxmaFqBsybik7q7QCP'),  -- The Royal Hotel · The Axe
  (49530,  'track/7zqCaIEeFt9iTVFhLguRv3'),  -- In Time · Main Theme
  (194,    'track/14rZjW3RioG7WesZhYESso'),  -- Amélie · Comptine d'un autre été
  (391713, 'track/6yzzno5cXBkh5c6UzRxcyM'),  -- Lady Bird · Lady Bird
  (19,     'track/4R2wfSyNqoTkjEsYJmPVZw'),  -- Metropolis · Metropolis Thema
  (19542,  'track/0tvtF2oNQRzriaN4NJdU3B'),  -- The Red Shoes · The Red Shoes Ballet
  (935,    'track/60r0u4TgU9JcbPhCoxZhs9'),  -- Dr. Strangelove · Main Title
  (238,    'track/3Ii2KG3YLrC0KNbuJKAFj2'),  -- The Godfather · Love Theme
  (30497,  'track/5ANPCKfcKzbJzUVQnO5BQs'),  -- The Texas Chain Saw Massacre · Main Title
  (1398,   'track/4V5UW31kW26I3dYdxfZnNl'),  -- Stalker · Meditation
  (24128,  'track/2t8GBp5kQEXVamVq4Odwe2'),  -- Stop Making Sense · Psycho Killer (Live)
  (11782,  'track/3XQli2SmH148RVh1PmXBlA'),  -- Hard Boiled · Body Count
  (108,    'track/2EBbKuFOhFZLkvprGFuCvr'),  -- Three Colors: Blue · Song for the Unification of Europe
  (884,    'track/5ET60vCkhiNsPWxzJfFTHD')   -- Crash · Crash
) as v(tmdb, s)
where f.tmdb_id = v.tmdb;

select count(*) as films_with_a_song from public.films where spotify like 'track/%';
