-- ============================================================
-- Cut Scenes · migration 003
-- Eight more stills for Now Showing. The images live in the repo (stills/).
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================
insert into public.films (title, year, genre, kind, director, runtime, line, image_url, status) values
  ('Amélie', '2001', 'Comedy', 'film', 'Jean-Pierre Jeunet', '122 min',
   'She fixes everyone''s life except her own. <em>The French call this romance.</em>',
   'stills/amelie.jpg', 'published'),
  ('House of Games', '1987', 'Thriller', 'film', 'David Mamet', '102 min',
   'A psychiatrist meets a con man. <em>Guess who gets analysed.</em>',
   'stills/houseofgames.jpg', 'published'),
  ('Eyimofe', '2020', 'Drama', 'film', 'Arie & Chuko Esiri', '116 min',
   'Two people in Lagos trying to leave. <em>The city has other plans.</em>',
   'stills/eyimofe.jpg', 'published'),
  ('The Little Mermaid', '1989', 'Animation', 'film', 'Ron Clements & John Musker', '83 min',
   'She gives up her voice for a man. <em>Nobody stopped her.</em>',
   'stills/mermaid.jpg', 'published'),
  ('The Witches', '1990', 'Horror', 'film', 'Nicolas Roeg', '91 min',
   'Every grandmother''s warning, turned into a horror film. <em>Also, mice.</em>',
   'stills/witches.jpg', 'published'),
  ('Conan the Destroyer', '1984', 'Fantasy', 'film', 'Richard Fleischer', '103 min',
   'Muscles, swords, and a script that <em>also skipped leg day.</em>',
   'stills/conan.jpg', 'published'),
  ('Lady Bird', '2017', 'Comedy', 'film', 'Greta Gerwig', '94 min',
   'A teenager fights her mother for 94 minutes. <em>Then calls her.</em>',
   'stills/ladybird.jpg', 'published'),
  ('Fleabag', '2016', 'Comedy', 'tv', 'Phoebe Waller-Bridge', '2 series · 12 episodes',
   'She falls for a priest. He says it''ll pass. <em>It doesn''t.</em>',
   'stills/fleabag.jpg', 'published');
