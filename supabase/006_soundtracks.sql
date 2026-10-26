-- ============================================================
-- Cut Scenes · migration 006
-- Soundtracks: each film can point at its score on Spotify.
-- The value is "album/<id>" or "track/<id>" (the bit after open.spotify.com/).
-- The site embeds Spotify's own player, so nothing is hosted here.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again: it only fills empty values.
-- ============================================================

alter table public.films
  add column if not exists spotify text
  check (spotify ~ '^(album|track|playlist)/[A-Za-z0-9]{22}$');

-- Matched by TMDB id, so a renamed title can't break it.
update public.films f set spotify = v.s
from (values
  (4808,   'album/1liumaVjSFdj8VfmFolmWy'),  -- Charade · Henry Mancini
  (149871, 'album/0RkkwrIWDzsYSw11lmhNYx'),  -- The Tale of the Princess Kaguya · Joe Hisaishi
  (944952, 'album/6lR5zgMOAaQ8hd4Nq4YORd'),  -- The Royal Hotel · Jed Palmer
  (49530,  'album/3yYvwII5bI7MZ2sVog0pUc'),  -- In Time · Craig Armstrong
  (194,    'album/6PRPYATK5VvjZ2p911y6U0'),  -- Amélie · Yann Tiersen
  (391713, 'album/0LIWkw76T7O499slpRTeQ1'),  -- Lady Bird · Jon Brion
  (19,     'album/1jVIhR5czAma4jfcL5qMjm'),  -- Metropolis · Gottfried Huppertz
  (19542,  'album/2qz7cwEfdFYjJlXEApXzsa'),  -- The Red Shoes · Brian Easdale
  (935,    'track/60r0u4TgU9JcbPhCoxZhs9'),  -- Dr. Strangelove · Laurie Johnson (main title)
  (238,    'track/3Ii2KG3YLrC0KNbuJKAFj2'),  -- The Godfather · Nino Rota (love theme)
  (30497,  'album/3ocB0wr2TcWxS2kbcHks3A'),  -- The Texas Chain Saw Massacre · Hooper & Bell
  (1398,   'album/4xzo1a6JCiN2rIWE4Q0in3'),  -- Stalker · Eduard Artemyev
  (24128,  'album/4FR8Z6TvIsC56NLyNomNRE'),  -- Stop Making Sense · Talking Heads
  (11782,  'album/1KiBsLUnm58Tsyg9YrbCpJ'),  -- Hard Boiled · Michael Gibbs
  (108,    'album/3Zu6Xz9GRFEW0UBGUfD58F'),  -- Three Colors: Blue · Zbigniew Preisner
  (884,    'album/6ZbDpAzNnPQEPLsYOjr2Up')   -- Crash · Howard Shore
) as v(tmdb, s)
where f.tmdb_id = v.tmdb and f.spotify is null;

-- How many got a score? (should say 16)
select count(*) as films_with_a_score from public.films where spotify is not null;
