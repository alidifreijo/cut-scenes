-- ============================================================
-- Cut Scenes · migration 010
-- Low-cost guard rails, no captcha needed at this size:
--   · hourly limits on uploads, submissions, gift links and scores
--     (site-wide, generous for real people, a wall for a spam script)
--   · no rude names on the leaderboard
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again.
-- ============================================================

-- 1. Hourly limits ------------------------------------------------

-- Submissions to Now Showing: 30 an hour.
create or replace function public.limit_submissions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and
     (select count(*) from public.films where community and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate limit: too many submissions this hour';
  end if;
  return new;
end $$;
drop trigger if exists films_rate_limit on public.films;
create trigger films_rate_limit before insert on public.films
  for each row execute function public.limit_submissions();

-- Gift links: 300 an hour.
create or replace function public.limit_puzzles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.puzzles where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate limit: too many links this hour';
  end if;
  return new;
end $$;
drop trigger if exists puzzles_rate_limit on public.puzzles;
create trigger puzzles_rate_limit before insert on public.puzzles
  for each row execute function public.limit_puzzles();

-- Leaderboard scores: 600 an hour.
create or replace function public.limit_plays() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.plays where created_at > now() - interval '1 hour') >= 600 then
    raise exception 'rate limit: too many scores this hour';
  end if;
  return new;
end $$;
drop trigger if exists plays_rate_limit on public.plays;
create trigger plays_rate_limit before insert on public.plays
  for each row execute function public.limit_plays();

-- Image uploads into stills/uploads/: 60 an hour.
create or replace function public.uploads_last_hour() returns integer
language sql stable security definer set search_path = public, storage as $$
  select count(*)::integer from storage.objects
  where bucket_id = 'stills' and name like 'uploads/%' and created_at > now() - interval '1 hour';
$$;
drop policy if exists "Upload rate limit" on storage.objects;
create policy "Upload rate limit"
  on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'stills' or name not like 'uploads/%' or public.uploads_last_hour() < 60);

-- 2. Polite leaderboard ------------------------------------------

-- Leetspeak and accents are folded first (5h1t → shit, coño → cono).
-- Long words are caught anywhere; short ones only as whole words,
-- so Hitchcock and Dickens still pass.
create or replace function public.alias_ok(a text) returns boolean
language plpgsql immutable as $$
declare
  n text := translate(lower(coalesce(a, '')), 'áéíóúüñ013457@$', 'aeiouunoieastas');
  squash text := regexp_replace(n, '[^a-z]', '', 'g');
begin
  if squash ~ '(fuck|shit|cunt|nigg|faggot|retard|whore|mierda|gilipolla|maricon|cabron|follar|joder|hijoputa|hijodeputa|subnormal|negrata|sudaca)' then
    return false;
  end if;
  if regexp_split_to_array(n, '[^a-z]+') && array['puta','puto','putas','cono','zorra','verga','polla','porn','porno','rape','nazi','nazis','hitler','dick','cock','pussy','slut','bitch','fag','fags','spic','chink','kike','tranny','marica','mongolo','pendejo'] then
    return false;
  end if;
  return true;
end $$;

create or replace function public.sign_play(p_id bigint, p_token uuid, p_alias text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare r public.plays;
begin
  if not public.alias_ok(p_alias) then raise exception 'alias not allowed'; end if;
  update public.plays set alias = left(trim(p_alias), 24)
  where id = p_id and token = p_token and alias is null and char_length(trim(p_alias)) between 1 and 24
  returning * into r;
  if r.id is null then raise exception 'cannot sign this play'; end if;
  return public.board(r.film_id, r.level);
end;
$$;
grant execute on function public.sign_play(bigint, uuid, text) to anon, authenticated;

-- To remove a name that slipped through: Table Editor → plays → find the row → set alias to empty (NULL).
select public.alias_ok('Hitchcock fan') as hitchcock_ok, public.alias_ok('5h1tlord') as caught;
