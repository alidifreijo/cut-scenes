-- ============================================================
-- Cut Scenes · migration 002
-- Gifts made from your own still now carry the film details
-- (year, director, genre, format, runtime, line) for the credits.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================

alter table public.puzzles
  add column year     text check (char_length(year) <= 10),
  add column director text check (char_length(director) <= 80),
  add column genre    text check (char_length(genre) <= 40),
  add column kind     text check (kind in ('film', 'tv')),
  add column runtime  text check (char_length(runtime) <= 20),
  add column line     text check (char_length(line) <= 140);

-- The function returns new columns, so it has to be recreated.
drop function if exists public.get_puzzle(text);

create function public.get_puzzle(p_id text)
returns table (
  id text, level text, from_name text, to_name text, note text,
  image_url text, film_id uuid,
  title text, year text, genre text, kind text, director text, runtime text, line text,
  community boolean
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.level, p.from_name, p.to_name, p.note,
         coalesce(p.image_url, f.image_url), f.id,
         coalesce(f.title, p.title), coalesce(f.year, p.year), coalesce(f.genre, p.genre),
         coalesce(f.kind, p.kind), coalesce(f.director, p.director),
         coalesce(f.runtime, p.runtime), coalesce(f.line, p.line),
         coalesce(f.community, true)
  from public.puzzles p
  left join public.films f on f.id = p.film_id
  where p.id = p_id;
$$;
grant execute on function public.get_puzzle(text) to anon, authenticated;
