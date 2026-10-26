-- ============================================================
-- Cut Scenes · migration 005
-- Speed leaderboard: one row per finished puzzle from the catalogue.
-- Nobody reads or writes the table directly; two functions do it:
--   log_play()  saves a time and returns your rank + the top 5
--   sign_play() puts your alias on it (only from the browser that played)
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================

create table if not exists public.plays (
  id         bigint generated always as identity primary key,
  film_id    uuid not null references public.films(id) on delete cascade,
  level      text not null check (level in ('easy', 'difficult', 'extreme')),
  ms         integer not null check (ms between 1000 and 86400000),
  alias      text check (char_length(alias) between 1 and 24),
  token      uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists plays_board on public.plays (film_id, level, ms);
alter table public.plays enable row level security;
-- No policies on purpose: the table is closed. Admins can still read it here, in Supabase.

-- The top 5 for a film and level, as JSON the site can print.
create or replace function public.board(p_film uuid, p_level text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('alias', coalesce(alias, 'Anonymous'), 'ms', ms) order by ms), '[]'::jsonb)
  from (select alias, ms from public.plays where film_id = p_film and level = p_level order by ms limit 5) t;
$$;

create or replace function public.log_play(p_film uuid, p_level text, p_ms integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  -- faster than this is not a person, it is a script
  floor_ms integer := case p_level when 'easy' then 8000 when 'difficult' then 20000 else 45000 end;
  r public.plays;
begin
  if not exists (select 1 from public.films where id = p_film and status = 'published') then
    raise exception 'unknown film';
  end if;
  if p_ms < floor_ms then
    return jsonb_build_object('rejected', true);
  end if;
  insert into public.plays (film_id, level, ms) values (p_film, p_level, p_ms) returning * into r;
  return jsonb_build_object(
    'id', r.id, 'token', r.token,
    'rank',  (select count(*) + 1 from public.plays where film_id = p_film and level = p_level and ms < p_ms),
    'total', (select count(*) from public.plays where film_id = p_film and level = p_level),
    'top',   public.board(p_film, p_level));
end;
$$;

create or replace function public.sign_play(p_id bigint, p_token uuid, p_alias text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare r public.plays;
begin
  update public.plays set alias = left(trim(p_alias), 24)
  where id = p_id and token = p_token and alias is null and char_length(trim(p_alias)) between 1 and 24
  returning * into r;
  if r.id is null then raise exception 'cannot sign this play'; end if;
  return public.board(r.film_id, r.level);
end;
$$;

grant execute on function public.board(uuid, text) to anon, authenticated;
grant execute on function public.log_play(uuid, text, integer) to anon, authenticated;
grant execute on function public.sign_play(bigint, uuid, text) to anon, authenticated;
