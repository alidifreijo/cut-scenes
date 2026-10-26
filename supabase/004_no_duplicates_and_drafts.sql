-- ============================================================
-- Cut Scenes · migration 004
-- 1. No duplicates: every film gets a TMDB id and a normalised title key.
--    The database refuses a second copy of the same film (unless the
--    first one was rejected).
-- 2. Drafts: a new status for films waiting for your curation.
-- 3. The 25 best films on Filmin (Espinof ranking), as drafts.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================

-- 1. columns -------------------------------------------------------
alter table public.films
  add column if not exists tmdb_id        integer,
  add column if not exists original_title text,
  add column if not exists rating         numeric(3,1),
  add column if not exists stills         text[];

alter table public.films drop constraint if exists films_status_check;
alter table public.films add constraint films_status_check
  check (status in ('draft', 'published', 'pending', 'rejected'));

-- "The Godfather", "the godfather", "THE GODFATHER" → "thegodfather"
create or replace function public.title_key(t text)
returns text language sql immutable as $$
  select regexp_replace(translate(lower(coalesce(t, '')), 'áàäâãéèëêíìïîóòöôõúùüûñçø', 'aaaaaeeeeiiiiooooouuuunco'), '[^a-z0-9]+', '', 'g');
$$;

alter table public.films
  add column if not exists title_key text generated always as (public.title_key(title)) stored;

-- 2. backfill TMDB ids for what is already there -------------------
update public.films set tmdb_id = 4808 where title_key = public.title_key('Charade') and tmdb_id is null;
update public.films set tmdb_id = 149871 where title_key = public.title_key('The Tale of the Princess Kaguya') and tmdb_id is null;
update public.films set tmdb_id = 575604 where title_key = public.title_key('The Call') and tmdb_id is null;
update public.films set tmdb_id = 944952 where title_key = public.title_key('The Royal Hotel') and tmdb_id is null;
update public.films set tmdb_id = 49530 where title_key = public.title_key('In Time') and tmdb_id is null;
update public.films set tmdb_id = 194 where title_key = public.title_key('Amélie') and tmdb_id is null;
update public.films set tmdb_id = 26719 where title_key = public.title_key('House of Games') and tmdb_id is null;
update public.films set tmdb_id = 665429 where title_key = public.title_key('Eyimofe') and tmdb_id is null;
update public.films set tmdb_id = 10144 where title_key = public.title_key('The Little Mermaid') and tmdb_id is null;
update public.films set tmdb_id = 10166 where title_key = public.title_key('The Witches') and tmdb_id is null;
update public.films set tmdb_id = 9610 where title_key = public.title_key('Conan the Destroyer') and tmdb_id is null;
update public.films set tmdb_id = 391713 where title_key = public.title_key('Lady Bird') and tmdb_id is null;
update public.films set tmdb_id = 67070 where title_key = public.title_key('Fleabag') and tmdb_id is null;
update public.films set tmdb_id = 1422041 where title_key = public.title_key('La bola negra') and tmdb_id is null;

-- 3. the rules: one live copy per film ----------------------------
create unique index if not exists films_tmdb_live
  on public.films (tmdb_id) where tmdb_id is not null and status <> 'rejected';
create unique index if not exists films_title_live
  on public.films (title_key, coalesce(year, '')) where status <> 'rejected';

-- Anyone can ask "is this film already here?" without seeing drafts or the queue itself.
create or replace function public.film_exists(p_title text, p_year text default null, p_tmdb integer default null)
returns table (id uuid, title text, year text, status text)
language sql stable security definer set search_path = public
as $$
  select f.id, f.title, f.year, case when f.status = 'published' then 'published' else 'queued' end
  from public.films f
  where f.status <> 'rejected'
    and ( (p_tmdb is not null and f.tmdb_id = p_tmdb)
       or (f.title_key = public.title_key(p_title) and (p_year is null or p_year = '' or f.year = p_year)) )
  order by (f.status = 'published') desc
  limit 1;
$$;
grant execute on function public.film_exists(text, text, integer) to anon, authenticated;

-- 4. the Filmin 25, as drafts. Already there? Skipped, not duplicated.
insert into public.films (tmdb_id, title, original_title, year, genre, kind, director, runtime, rating, line, image_url, stills, status) values
  (992, 'Sherlock Jr.', 'Sherlock Jr.', '1924', 'Comedy', 'film', 'Buster Keaton', '45 min', 8,
   'A projectionist falls asleep and walks into the film. <em>Relatable, honestly.</em>',
   'https://image.tmdb.org/t/p/w1280/dRKCNvOjXkRTIA3D3KAve7GRu4k.jpg', array['https://image.tmdb.org/t/p/w1280/dRKCNvOjXkRTIA3D3KAve7GRu4k.jpg','https://image.tmdb.org/t/p/w1280/tSipsYTp565LkopntX1lZNLPYHP.jpg','https://image.tmdb.org/t/p/w1280/9kriZvlf2d5b1nAew3ybSGCKiMK.jpg','https://image.tmdb.org/t/p/w1280/zrYD5ffpBOBCXI6hkc6jBpHtYex.jpg']::text[], 'draft'),
  (19, 'Metropolis', 'Metropolis', '1927', 'Drama', 'film', 'Fritz Lang', '148 min', 8.1,
   'The rich live upstairs, the workers downstairs. <em>A hundred years later, same building.</em>',
   'https://image.tmdb.org/t/p/w1280/r8pUcom5Mw8igtBpj3AHSAUvH0R.jpg', array['https://image.tmdb.org/t/p/w1280/r8pUcom5Mw8igtBpj3AHSAUvH0R.jpg','https://image.tmdb.org/t/p/w1280/eeMoFKxjjiCi6iep2GEZtSAMYIr.jpg','https://image.tmdb.org/t/p/w1280/f0oDtB2JCMlPKjphBJ90GcfVzWg.jpg','https://image.tmdb.org/t/p/w1280/e5kr5W12zgJneQvOJGBbxYLr5eo.jpg']::text[], 'draft'),
  (780, 'The Passion of Joan of Arc', 'La Passion de Jeanne d''Arc', '1928', 'Drama', 'film', 'Carl Theodor Dreyer', '81 min', 8,
   'Eighty minutes of close-ups and suffering. <em>She never blinks. You will.</em>',
   'https://image.tmdb.org/t/p/w1280/ozDJWv5KNQ3s64EWOYt759jmUWE.jpg', array['https://image.tmdb.org/t/p/w1280/ozDJWv5KNQ3s64EWOYt759jmUWE.jpg','https://image.tmdb.org/t/p/w1280/A1mteOfKdvK5er2sD5i02Qw3CWz.jpg','https://image.tmdb.org/t/p/w1280/wmmrw1ORWTpbLi5Ha5UgyFLW2tZ.jpg','https://image.tmdb.org/t/p/w1280/cFgCf2XqnhErS3HmgSOBCe4kL4d.jpg']::text[], 'draft'),
  (77210, 'Design for Living', 'Design for Living', '1933', 'Comedy', 'film', 'Ernst Lubitsch', '91 min', 7.1,
   'Two men, one woman, one gentlemen''s agreement. <em>1933 was more relaxed than you think.</em>',
   'https://image.tmdb.org/t/p/w1280/cMUjH61we5JUDLmIpLFxlS0tHvB.jpg', array['https://image.tmdb.org/t/p/w1280/cMUjH61we5JUDLmIpLFxlS0tHvB.jpg','https://image.tmdb.org/t/p/w1280/b46lxSzbLboD9nWrUBh7hObYSbL.jpg','https://image.tmdb.org/t/p/w1280/ET5j59Ffq8X60BaTWqvJ2jf0lo.jpg','https://image.tmdb.org/t/p/w1280/mrAiMqoIH5ccTSxPxffuhknAjwo.jpg']::text[], 'draft'),
  (995, 'Stagecoach', 'Stagecoach', '1939', 'Western', 'film', 'John Ford', '96 min', 7.6,
   'Nine strangers share a coach across Apache country. <em>Worst group trip ever booked.</em>',
   'https://image.tmdb.org/t/p/w1280/lmPqMn50o4LAYlWHweNKYp9C5xg.jpg', array['https://image.tmdb.org/t/p/w1280/lmPqMn50o4LAYlWHweNKYp9C5xg.jpg','https://image.tmdb.org/t/p/w1280/7SYNEG50fKODsTP6h9phYM3BueV.jpg','https://image.tmdb.org/t/p/w1280/hNIvGXaQmdW7hKNDYsGp3NDMR5f.jpg','https://image.tmdb.org/t/p/w1280/z8t37pqt6fLueKHSVlrL4Rdk0mz.jpg']::text[], 'draft'),
  (19542, 'The Red Shoes', 'The Red Shoes', '1948', 'Drama', 'film', 'Michael Powell & Emeric Pressburger', '133 min', 8,
   'A ballerina must choose between love and dancing. <em>The shoes choose for her.</em>',
   'https://image.tmdb.org/t/p/w1280/cSbBSHHiy849SUhyTW6FX4Dbj43.jpg', array['https://image.tmdb.org/t/p/w1280/cSbBSHHiy849SUhyTW6FX4Dbj43.jpg','https://image.tmdb.org/t/p/w1280/Aa1jUhkenqspgGQlqbsXFax6iW.jpg','https://image.tmdb.org/t/p/w1280/xQfD7SvRwt9GsVcNJwsALSHxaXB.jpg','https://image.tmdb.org/t/p/w1280/5N3xfpHHjtObC63E6zKO4lixRMi.jpg']::text[], 'draft'),
  (41462, 'The Hitch-Hiker', 'The Hitch-Hiker', '1953', 'Thriller', 'film', 'Ida Lupino', '71 min', 6.8,
   'Two friends pick up a stranger. <em>Never stop for anyone. Ida Lupino warned you.</em>',
   'https://image.tmdb.org/t/p/w1280/r25MOqbIjOVw2lK7MrZ1dGFNjiy.jpg', array['https://image.tmdb.org/t/p/w1280/r25MOqbIjOVw2lK7MrZ1dGFNjiy.jpg','https://image.tmdb.org/t/p/w1280/tbQ5ddLRpq5wCxjAua6k8f3liuF.jpg','https://image.tmdb.org/t/p/w1280/bHIvCJwvpFoAzX1m7B8PDCCyz0m.jpg','https://image.tmdb.org/t/p/w1280/18yMA8epPXxXp1JiEK22JwBv8tj.jpg']::text[], 'draft'),
  (12493, 'High and Low', '天国と地獄', '1963', 'Drama', 'film', 'Akira Kurosawa', '142 min', 8.4,
   'A rich man pays a ransom for a child who isn''t his. <em>The house on the hill sees everything.</em>',
   'https://image.tmdb.org/t/p/w1280/2nXhcIi3zzBB71hRcG8rTkWlixf.jpg', array['https://image.tmdb.org/t/p/w1280/2nXhcIi3zzBB71hRcG8rTkWlixf.jpg','https://image.tmdb.org/t/p/w1280/adkWjKeklbfVIw9y2KKPSCwZl9N.jpg','https://image.tmdb.org/t/p/w1280/2xliq3zIrQPIWG66Fc0bgVoBUWc.jpg','https://image.tmdb.org/t/p/w1280/A62quSOB8otoZvGiLvMVZ9G4BiO.jpg']::text[], 'draft'),
  (935, 'Dr. Strangelove', 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb', '1964', 'Comedy', 'film', 'Stanley Kubrick', '95 min', 8.1,
   'Nuclear war, played for laughs. <em>Still the most accurate film about politics.</em>',
   'https://image.tmdb.org/t/p/w1280/sTp8K0SfcC2RQef1Tu160z3niHO.jpg', array['https://image.tmdb.org/t/p/w1280/sTp8K0SfcC2RQef1Tu160z3niHO.jpg','https://image.tmdb.org/t/p/w1280/7i0L2ee4Iy0aXV6vR5u1ZmblOrx.jpg','https://image.tmdb.org/t/p/w1280/4LmNLvXP5SZ5TrZEkNhC7dbjUNV.jpg','https://image.tmdb.org/t/p/w1280/AezAkLbfBM6IvsJQYzUuPleg8QS.jpg']::text[], 'draft'),
  (797, 'Persona', 'Persona', '1966', 'Drama', 'film', 'Ingmar Bergman', '85 min', 8.1,
   'A nurse talks, an actress doesn''t. <em>By the end nobody knows who''s who. Including you.</em>',
   'https://image.tmdb.org/t/p/w1280/32YB3OXR036XBi1Dm5i9D0hDM2o.jpg', array['https://image.tmdb.org/t/p/w1280/32YB3OXR036XBi1Dm5i9D0hDM2o.jpg','https://image.tmdb.org/t/p/w1280/m7U3G8TyUIUsIXVvXrqd2VmVGjC.jpg','https://image.tmdb.org/t/p/w1280/sj2aZDetPE8RoOCAm5QJitCNfLr.jpg','https://image.tmdb.org/t/p/w1280/32gSSQeykkCvmQ3rJ6mt6pht8cz.jpg']::text[], 'draft'),
  (47576, 'Memories of Underdevelopment', 'Memorias del subdesarrollo', '1968', 'Drama', 'film', 'Tomás Gutiérrez Alea', '99 min', 7.2,
   'A bourgeois stays in Havana after the revolution. <em>And complains. Beautifully.</em>',
   'https://image.tmdb.org/t/p/w1280/cIm21q38szgMQ691raU8NRwdk9S.jpg', array['https://image.tmdb.org/t/p/w1280/cIm21q38szgMQ691raU8NRwdk9S.jpg','https://image.tmdb.org/t/p/w1280/mE58wQKaXb09zjrGrCVjWrkp7Xn.jpg','https://image.tmdb.org/t/p/w1280/bQrJhRDICaYTqfD9POhl7BOSJTF.jpg','https://image.tmdb.org/t/p/w1280/nW61xxh2LcIaA0QDLWtrO7VRp9l.jpg']::text[], 'draft'),
  (238, 'The Godfather', 'The Godfather', '1972', 'Drama', 'film', 'Francis Ford Coppola', '175 min', 8.7,
   'A family business with <em>a very strict exit policy.</em>',
   'https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', array['https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg','https://image.tmdb.org/t/p/w1280/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg','https://image.tmdb.org/t/p/w1280/41xIKcLiM5ryfz4C9sZFcBOJGsK.jpg','https://image.tmdb.org/t/p/w1280/ejdD20cdHNFAYAN2DlqPToXKyzx.jpg']::text[], 'draft'),
  (30497, 'The Texas Chain Saw Massacre', 'The Texas Chain Saw Massacre', '1974', 'Horror', 'film', 'Tobe Hooper', '83 min', 7.3,
   'Five friends, one road trip, one family dinner. <em>Never accept the invitation.</em>',
   'https://image.tmdb.org/t/p/w1280/1I1cFIKnXEdaOfN4597Y91oNXyo.jpg', array['https://image.tmdb.org/t/p/w1280/1I1cFIKnXEdaOfN4597Y91oNXyo.jpg','https://image.tmdb.org/t/p/w1280/rCCje7XF5n89pf53AK7SpSz9lkq.jpg','https://image.tmdb.org/t/p/w1280/wvBx1Q1FcQE1BPLfBbgA3y9aaS1.jpg','https://image.tmdb.org/t/p/w1280/5aXWGgEsK273mXGGAoToUF7cdQz.jpg']::text[], 'draft'),
  (59143, 'Mikey and Nicky', 'Mikey and Nicky', '1976', 'Crime', 'film', 'Elaine May', '106 min', 6.9,
   'Two old friends, one long night, one contract. <em>Friendship, the Elaine May way.</em>',
   'https://image.tmdb.org/t/p/w1280/ikKB3UCXJ9acTrXEkyqGsWzCfvv.jpg', array['https://image.tmdb.org/t/p/w1280/ikKB3UCXJ9acTrXEkyqGsWzCfvv.jpg','https://image.tmdb.org/t/p/w1280/2xcjWxbJzAvk7GOde2JySXXO0Jk.jpg','https://image.tmdb.org/t/p/w1280/pzST8cae4CTsfj0nPP63YOdPLiO.jpg','https://image.tmdb.org/t/p/w1280/8g4IwZL8xPGGWfvts7thhp7t2wf.jpg']::text[], 'draft'),
  (583, 'Life of Brian', 'Life of Brian', '1979', 'Comedy', 'film', 'Terry Jones', '94 min', 7.8,
   'He''s not the Messiah. <em>Nobody listens.</em>',
   'https://image.tmdb.org/t/p/w1280/lOrM3OQhHlzEkpF7Ih3GghecrA8.jpg', array['https://image.tmdb.org/t/p/w1280/lOrM3OQhHlzEkpF7Ih3GghecrA8.jpg','https://image.tmdb.org/t/p/w1280/hudKBabOC0PSuAd2TCQQxinU4kn.jpg','https://image.tmdb.org/t/p/w1280/rMfphrYgAVyvxsvAvjClYf0KlAs.jpg','https://image.tmdb.org/t/p/w1280/gbLeMznYBlI7rsyg766oBwkdo2w.jpg']::text[], 'draft'),
  (1398, 'Stalker', 'Сталкер', '1979', 'Sci-fi', 'film', 'Andrei Tarkovsky', '162 min', 8.1,
   'Three men cross the Zone to reach their deepest wish. <em>It takes 162 minutes. Wish for coffee.</em>',
   'https://image.tmdb.org/t/p/w1280/6yrbWzzrPp7pwz6zHdifspJk8t3.jpg', array['https://image.tmdb.org/t/p/w1280/6yrbWzzrPp7pwz6zHdifspJk8t3.jpg','https://image.tmdb.org/t/p/w1280/xhet9FxP6VoRdlBSsfc9FhCsKSW.jpg','https://image.tmdb.org/t/p/w1280/qyXLykgxPbEccocjaF7rVb99mTR.jpg','https://image.tmdb.org/t/p/w1280/h62ICHW3nHFoaLoBG9duRtwOutA.jpg']::text[], 'draft'),
  (18254, 'Reds', 'Reds', '1981', 'Drama', 'film', 'Warren Beatty', '195 min', 6.9,
   'Revolution, romance and a 195-minute runtime. <em>Bring a sandwich. Bring two.</em>',
   'https://image.tmdb.org/t/p/w1280/cDdB8JBflT4vBYlftoopSdTf4Wz.jpg', array['https://image.tmdb.org/t/p/w1280/cDdB8JBflT4vBYlftoopSdTf4Wz.jpg','https://image.tmdb.org/t/p/w1280/y4CB2Bu0XGU2C94zbhCP9Y1bNCa.jpg','https://image.tmdb.org/t/p/w1280/sFnm51pA5roE1FwEyq9iLWEDwtW.jpg','https://image.tmdb.org/t/p/w1280/dU4a4YJreEcb5sdUJeKVYCC2wRP.jpg']::text[], 'draft'),
  (24128, 'Stop Making Sense', 'Stop Making Sense', '1984', 'Documentary', 'film', 'Jonathan Demme', '88 min', 8.4,
   'A man in a suit far too big. <em>The best concert you were never at.</em>',
   'https://image.tmdb.org/t/p/w1280/kdDQn3Oi7iy1VK7GWhMRyPXUf9K.jpg', array['https://image.tmdb.org/t/p/w1280/kdDQn3Oi7iy1VK7GWhMRyPXUf9K.jpg','https://image.tmdb.org/t/p/w1280/1hQlln9B2G1moBtuhj9adWmBhuk.jpg','https://image.tmdb.org/t/p/w1280/kPDmoP4BCFaELJVBog4nIV4CPge.jpg','https://image.tmdb.org/t/p/w1280/onTM7lVy6svGodMxuaEMkvQ6j0x.jpg']::text[], 'draft'),
  (11782, 'Hard Boiled', '辣手神探', '1992', 'Action', 'film', 'John Woo', '126 min', 7.5,
   'A hospital, two cops and a frankly unreasonable number of bullets. <em>Also a baby. Somehow fine.</em>',
   'https://image.tmdb.org/t/p/w1280/kxTWssqcwsHqH6Sj2ivu0FHP5QK.jpg', array['https://image.tmdb.org/t/p/w1280/kxTWssqcwsHqH6Sj2ivu0FHP5QK.jpg','https://image.tmdb.org/t/p/w1280/bL3rgYFs0NTAoLBMpCBIJ7aX6hp.jpg','https://image.tmdb.org/t/p/w1280/cN5vfBHJYxEqbrtuWXPJ0hyGDI2.jpg','https://image.tmdb.org/t/p/w1280/bNdP5MPz3eWFY3MB1inrA8IxhAl.jpg']::text[], 'draft'),
  (108, 'Three Colors: Blue', 'Trois couleurs : Bleu', '1993', 'Drama', 'film', 'Krzysztof Kieślowski', '98 min', 7.6,
   'A woman loses everything and tries to feel nothing. <em>The colour does the crying.</em>',
   'https://image.tmdb.org/t/p/w1280/s9rWmLANsVlSV4XmuC0IUcseGzO.jpg', array['https://image.tmdb.org/t/p/w1280/s9rWmLANsVlSV4XmuC0IUcseGzO.jpg','https://image.tmdb.org/t/p/w1280/1Lw01MQIH2fnsDuHm2M79PqSzdD.jpg','https://image.tmdb.org/t/p/w1280/pXvYw0QOPbHJVvwGbZfrSNY2vnB.jpg','https://image.tmdb.org/t/p/w1280/yAmHOzB19pcDToBrYraFsqRL3di.jpg']::text[], 'draft'),
  (884, 'Crash', 'Crash', '1996', 'Thriller', 'film', 'David Cronenberg', '100 min', 6.5,
   'People turned on by car crashes. <em>Not that Crash. The other one.</em>',
   'https://image.tmdb.org/t/p/w1280/vQNknPEVSAui6IL6eUlDBPfUzcW.jpg', array['https://image.tmdb.org/t/p/w1280/vQNknPEVSAui6IL6eUlDBPfUzcW.jpg','https://image.tmdb.org/t/p/w1280/3aOtvFWQ2P2jP57sVs65NT7EKP0.jpg','https://image.tmdb.org/t/p/w1280/cjMGc2LAQISzlvpuJ3bas3utFS9.jpg','https://image.tmdb.org/t/p/w1280/ddqaBF2o3d5ZQqKVSiV9iM9LMtF.jpg']::text[], 'draft'),
  (18329, 'Happy Together', '春光乍洩', '1997', 'Drama', 'film', 'Wong Kar-wai', '96 min', 7.6,
   'Two lovers stranded in Buenos Aires. <em>Breaking up was never this well lit.</em>',
   'https://image.tmdb.org/t/p/w1280/2Xkd3WeAx11cHxb4Lr3wnSNDWcd.jpg', array['https://image.tmdb.org/t/p/w1280/2Xkd3WeAx11cHxb4Lr3wnSNDWcd.jpg','https://image.tmdb.org/t/p/w1280/oIj0OoGhJEDPwQm5GmZkmvMRyHc.jpg','https://image.tmdb.org/t/p/w1280/7DlBcw1zBhr1cHGJzB9i0n1V3i6.jpg','https://image.tmdb.org/t/p/w1280/rzrF5AloLY1ccet2KwwvS6pLIbt.jpg']::text[], 'draft'),
  (7294, 'The Man Without a Past', 'Mies vailla menneisyyttä', '2002', 'Drama', 'film', 'Aki Kaurismäki', '97 min', 7.4,
   'A man loses his memory and finds a better life. <em>Deadpan, with maximum warmth.</em>',
   'https://image.tmdb.org/t/p/w1280/Awi8k3z4z81AW7nqHq1uBoNN4je.jpg', array['https://image.tmdb.org/t/p/w1280/Awi8k3z4z81AW7nqHq1uBoNN4je.jpg','https://image.tmdb.org/t/p/w1280/nvzRMLQSYB1XYooexBr8Nqp5vcU.jpg','https://image.tmdb.org/t/p/w1280/jQ2TMXg2jcX4IoQtcBIqGXUAl5O.jpg','https://image.tmdb.org/t/p/w1280/9JAS7RGpw1FNG8oqPP1FNsTaK68.jpg']::text[], 'draft'),
  (4550, 'Sympathy for Lady Vengeance', '친절한 금자씨', '2005', 'Thriller', 'film', 'Park Chan-wook', '115 min', 7.5,
   'Thirteen years in prison, one very patient plan. <em>Do not test her.</em>',
   'https://image.tmdb.org/t/p/w1280/wP1nu98mgiSOyuPmMWdZ8109S9j.jpg', array['https://image.tmdb.org/t/p/w1280/wP1nu98mgiSOyuPmMWdZ8109S9j.jpg','https://image.tmdb.org/t/p/w1280/1N45Z1UQY3LMNJEHuyHj6NygOYq.jpg','https://image.tmdb.org/t/p/w1280/aV1fsUBDYQGIyUT1fJbToJpjjwY.jpg','https://image.tmdb.org/t/p/w1280/wGV7OkVNJMbtGFqLEf9nCcd3aWI.jpg']::text[], 'draft'),
  (467244, 'The Zone of Interest', 'The Zone of Interest', '2023', 'Drama', 'film', 'Jonathan Glazer', '105 min', 7,
   'A family tends its garden. <em>The horror is over the wall, and they never look.</em>',
   'https://image.tmdb.org/t/p/w1280/bq9FpkTw9I3s1cSRuZxQibM2xOx.jpg', array['https://image.tmdb.org/t/p/w1280/bq9FpkTw9I3s1cSRuZxQibM2xOx.jpg','https://image.tmdb.org/t/p/w1280/pnTSOKcYnvdpQNQElAtJM1rWOxH.jpg','https://image.tmdb.org/t/p/w1280/aPQsU3yLDUOhLJYnSqkhKRkQTAw.jpg','https://image.tmdb.org/t/p/w1280/zA4sQNuZc4WcZtnbwE5xe5sy9jC.jpg']::text[], 'draft')
on conflict do nothing;

-- Check: how many drafts are waiting for you?
select count(*) as drafts from public.films where status = 'draft';
