# Cut Scenes

Film stills cut into puzzles, for someone you love. Or tolerate.

**Live:** https://cut-scenes.vercel.app

A non-commercial design exploration by [Álida Díaz de Freijo](https://alidadiazdefreijo.framer.website/).
All film stills belong to their studios and filmmakers.

## Structure

```
index.html      the page
css/style.css   all styles
js/app.js       puzzle engine, flows, credits
js/db.js        every call to Supabase
js/config.js    Supabase URL and public key
supabase/       database schema, run once in Supabase
stills/         catalogue images
```

## Run it locally

Shared links and uploads need a real web address, so serve the folder instead of double-clicking the file:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No build step.

## Supabase

The database lives in Supabase. Everything it needs is in `supabase/`:

- `schema.sql`: tables (`films`, `puzzles`, `admins`), security rules, the `stills` storage bucket and the starting catalogue. Run it once in the SQL Editor.
- `make-me-admin.sql`: gives your user access to the review queue.
- `002_film_details.sql`: film details (year, director, genre…) for gifts made from your own still.
- `003_more_stills.sql`: eight more stills for Now Showing, including the first TV series.
- `005_leaderboard.sql`: speed leaderboard (plays table, log_play / sign_play / board functions).
- `006_soundtracks.sql`: `spotify` column on films (`album/<id>` or `track/<id>`), filled for 16 films. The site embeds Spotify's own player: full tracks if you're logged in to Spotify in that browser, 30-second previews if not.
- `007_one_track_each.sql`: one song per film (the main theme) instead of whole albums.
- `004_no_duplicates_and_drafts.sql`: one live copy per film (TMDB id + title/year), a `draft` status, and the Filmin top 25 as drafts.

## Importing from TMDB

`tools/tmdb-lookup.mjs` looks a list of titles up on TMDB (details + 4 stills each). It reads the token from the `TMDB_TOKEN` environment variable; never commit it.

```
TMDB_TOKEN=... node tools/tmdb-lookup.mjs list.json > out.json
```

Film data and stills from [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.

The browser only ever uses the public (publishable / anon) key. Security comes from the Row Level Security rules in `schema.sql`, not from hiding the key.

## Roadmap

- [x] Static prototype: catalogue, puzzle, credits, create, ticket, review
- [x] Hosting on Vercel (deploys on every push to main)
- [x] Supabase schema
- [x] Connect the site: catalogue, uploads (Storage), share links, review queue
- [ ] Filters, more stills, TV
- [x] Admin login for the projection room
