-- ============================================================
-- Cut Scenes · migration 011
-- La bola negra gets its song: "La Nieve", Guitarricadelafuente's
-- original song for the film.
-- Run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- ============================================================

update public.films set spotify = 'track/6W4fSGsqNmyPTYo29rJ50z'
where id = '5a19f081-75be-4d3c-a608-0638b9c99078';

select title, spotify from public.films where id = '5a19f081-75be-4d3c-a608-0638b9c99078';
