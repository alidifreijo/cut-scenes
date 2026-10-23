-- ============================================================
-- Cut Scenes · Supabase schema
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================


-- ------------------------------------------------------------
-- 1. ADMINS
-- Who can review submissions. Only you, for now.
-- Nobody reads this table from the browser: is_admin() does it.
-- ------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;


-- ------------------------------------------------------------
-- 2. FILMS
-- The catalogue ("Now showing") plus community submissions.
-- status: published = everyone sees it · pending = waiting for
-- review · rejected = hidden forever.
-- ------------------------------------------------------------
create table public.films (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 80),
  year         text,
  genre        text,
  kind         text not null default 'film' check (kind in ('film', 'tv')),
  director     text,
  runtime      text,
  line         text check (char_length(line) <= 280),
  image_url    text not null,
  status       text not null default 'pending' check (status in ('published', 'pending', 'rejected')),
  community    boolean not null default false,
  submitted_by text check (char_length(submitted_by) <= 60),
  note         text check (char_length(note) <= 140),
  created_at   timestamptz not null default now()
);
alter table public.films enable row level security;

-- Everyone (logged in or not) sees the published catalogue.
create policy "Anyone sees published films"
  on public.films for select
  using (status = 'published');

-- You see everything, including the review queue.
create policy "Admins see everything"
  on public.films for select to authenticated
  using (public.is_admin());

-- Anyone can submit a still, but it always lands as pending.
create policy "Anyone can submit, as pending"
  on public.films for insert to anon, authenticated
  with check (
    status = 'pending'
    and community = true
    and image_url like '%/storage/v1/object/public/stills/uploads/%'
  );

-- Only you approve, reject, edit or delete.
create policy "Admins add to the catalogue"
  on public.films for insert to authenticated
  with check (public.is_admin());
create policy "Admins review"
  on public.films for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete"
  on public.films for delete to authenticated
  using (public.is_admin());


-- ------------------------------------------------------------
-- 3. PUZZLES
-- One row per shared link. The id IS the link: cutscenes/p/<id>.
-- Either it points at a catalogue film, or at an uploaded still.
-- ------------------------------------------------------------
create table public.puzzles (
  id         text primary key check (id ~ '^[A-Za-z0-9]{8,16}$'),
  film_id    uuid references public.films(id) on delete set null,
  image_url  text,
  title      text check (char_length(title) <= 80),
  level      text not null default 'easy' check (level in ('easy', 'difficult', 'extreme')),
  from_name  text check (char_length(from_name) <= 60),
  to_name    text check (char_length(to_name) <= 60),
  note       text check (char_length(note) <= 140),
  created_at timestamptz not null default now(),
  check (film_id is not null or image_url is not null)
);
alter table public.puzzles enable row level security;

-- Anyone can create a link (no account needed).
create policy "Anyone can make a puzzle link"
  on public.puzzles for insert to anon, authenticated
  with check (
    image_url is null
    or image_url like '%/storage/v1/object/public/stills/uploads/%'
  );

-- There is deliberately NO public select policy: nobody can list
-- other people's puzzles. A link is opened one id at a time,
-- through get_puzzle() below.
create policy "Admins see all puzzles"
  on public.puzzles for select to authenticated
  using (public.is_admin());

create or replace function public.get_puzzle(p_id text)
returns table (
  id text, level text, from_name text, to_name text, note text, title text,
  image_url text, film_id uuid, film_title text, film_year text, film_genre text,
  film_director text, film_runtime text, film_line text
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.level, p.from_name, p.to_name, p.note, p.title,
         coalesce(p.image_url, f.image_url),
         f.id, f.title, f.year, f.genre, f.director, f.runtime, f.line
  from public.puzzles p
  left join public.films f on f.id = p.film_id
  where p.id = p_id;
$$;
grant execute on function public.get_puzzle(text) to anon, authenticated;


-- ------------------------------------------------------------
-- 4. STORAGE
-- One public bucket for images. Max 5 MB, images only.
-- Visitors can only upload inside uploads/. You manage the rest.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stills', 'stills', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Anyone uploads into uploads/"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'stills' and (storage.foldername(name))[1] = 'uploads');

create policy "Admins manage stills"
  on storage.objects for all to authenticated
  using (bucket_id = 'stills' and public.is_admin())
  with check (bucket_id = 'stills' and public.is_admin());


-- ------------------------------------------------------------
-- 5. THE CATALOGUE
-- The five stills live in the GitHub repo (stills/), so the path
-- is relative to the site.
-- ------------------------------------------------------------
insert into public.films (title, year, genre, kind, director, runtime, line, image_url, status) values
  ('Charade', '1963', 'Romantic thriller', 'film', 'Stanley Donen', '113 min',
   'Cary Grant and Audrey Hepburn being charming while everyone around them dies. <em>Priorities.</em>',
   'stills/charade.jpg', 'published'),
  ('The Tale of the Princess Kaguya', '2013', 'Animation', 'film', 'Isao Takahata', '137 min',
   'Drawn in charcoal and heartbreak. <em>Bring tissues.</em>',
   'stills/kaguya.jpg', 'published'),
  ('The Call', '2020', 'Thriller', 'film', 'Lee Chung-hyun', '112 min',
   'Two women, one phone line, twenty years apart. <em>Still better reception than yours.</em>',
   'stills/call.jpg', 'published'),
  ('The Royal Hotel', '2023', 'Thriller', 'film', 'Kitty Green', '91 min',
   'Two backpackers take a bar job in the Outback. <em>Every man there is a red flag.</em>',
   'stills/royal.jpg', 'published'),
  ('In Time', '2011', 'Sci-fi', 'film', 'Andrew Niccol', '109 min',
   'Time is literally money. <em>Capitalism, minus the subtlety.</em>',
   'stills/intime.jpg', 'published');
