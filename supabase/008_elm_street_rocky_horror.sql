-- ============================================================
-- Cut Scenes · migration 008
-- Two more for the catalogue: A Nightmare on Elm Street and
-- The Rocky Horror Picture Show. They land as drafts: pick the
-- still in the Projection room and publish.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again (duplicates are skipped).
-- ============================================================

insert into public.films (tmdb_id, title, original_title, year, genre, kind, director, runtime, line, image_url, stills, spotify, status) values
  (377, 'A Nightmare on Elm Street', 'A Nightmare on Elm Street', '1984', 'Horror', 'film', 'Wes Craven', '91 min',
   'Four teenagers, one rule: don''t fall asleep. <em>Same rule as finishing this puzzle at 2 a.m.</em>',
   'https://image.tmdb.org/t/p/w1280/nzSjTiecdosBfwMGAdpt9CxltCI.jpg',
   array['https://image.tmdb.org/t/p/w1280/nzSjTiecdosBfwMGAdpt9CxltCI.jpg','https://image.tmdb.org/t/p/w1280/u9Izap5fRHGR0S9om2KSm9eGFYR.jpg','https://image.tmdb.org/t/p/w1280/cDKZp1puRfkiKTdwv4hWMPk5kEj.jpg','https://image.tmdb.org/t/p/w1280/sqq2o08yrgfm4tKHiFxvlqNnDYP.jpg']::text[],
   'track/68ml3Lm4GNTlpNmmUJfvUu', 'draft'),
  (36685, 'The Rocky Horror Picture Show', 'The Rocky Horror Picture Show', '1975', 'Musical', 'film', 'Jim Sharman', '100 min',
   'A flat tyre, a castle and a scientist in fishnets. <em>Worst roadside assistance in history.</em>',
   'https://image.tmdb.org/t/p/w1280/lg2mfrN0HjiDdBE6uJRcZJgNK0p.jpg',
   array['https://image.tmdb.org/t/p/w1280/lg2mfrN0HjiDdBE6uJRcZJgNK0p.jpg','https://image.tmdb.org/t/p/w1280/ArCg0OfpzfWuHNSBdxiDA8adVno.jpg','https://image.tmdb.org/t/p/w1280/cuBWaK5Y1QUcQVapm44YNH5rrhg.jpg','https://image.tmdb.org/t/p/w1280/1IzJoIVnnpphKxvyv9cWRxDvyDp.jpg']::text[],
   'track/1esIh49tNEGrXEHorSTHZ1', 'draft')
on conflict do nothing;

select title, status from public.films where tmdb_id in (377, 36685);
