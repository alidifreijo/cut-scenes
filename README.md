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
js/vercel-queues.js  Vercel Analytics queues (kept out of the HTML for the CSP)
vercel.json     security headers (CSP and friends)
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
- `008_elm_street_rocky_horror.sql`: A Nightmare on Elm Street and The Rocky Horror Picture Show as drafts, with song.
- `009_thumbnails.sql`: light WebP copies of each still for the grid (served from `thumbs/` by Vercel); the full still loads only when a film is opened.
- `010_limits.sql`: hourly limits on uploads, submissions, gift links and scores; no rude leaderboard names.
- `011_bola_negra_song.sql`: La Nieve (Guitarricadelafuente) for La bola negra.
- `004_no_duplicates_and_drafts.sql`: one live copy per film (TMDB id + title/year), a `draft` status, and the Filmin top 25 as drafts.

## Importing from TMDB

`tools/tmdb-lookup.mjs` looks a list of titles up on TMDB (details + 4 stills each). It reads the token from the `TMDB_TOKEN` environment variable; never commit it.

```
TMDB_TOKEN=... node tools/tmdb-lookup.mjs list.json > out.json
```

Film data and stills from [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.

The browser only ever uses the public (publishable / anon) key. Security comes from the Row Level Security rules in `schema.sql`, not from hiding the key.

## Security

- **Headers** (`vercel.json`): a Content-Security-Policy that only lets the page load its own files, Supabase and Spotify; no inline scripts; the site can't be framed by other sites; plus nosniff, Referrer-Policy and Permissions-Policy. `'unsafe-eval'` is there only because Spotify's player API needs it. If you add a new outside service (an image host, a font, an embed), add its address to the CSP or the browser will block it.
- **Data**: Row Level Security on every table, hourly limits, a 5 MB image-only upload folder, and a review queue before anything goes public.
- **Secrets**: only the publishable key is in the code. The secret key, the database URL and the backup passphrase live in GitHub → Settings → Secrets and nowhere else.

## Scheduled jobs (GitHub Actions)

| Workflow | When | Needs |
|---|---|---|
| Keep Supabase awake | every 3 days | nothing |
| Weekly database backup | Mondays | `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` |
| Monthly cleanup (12-month retention) | 2nd of each month | `SUPABASE_DB_URL`, `SUPABASE_SECRET_KEY` |

## If something goes wrong

1. **A key leaked** (secret key or database password pasted somewhere public): Supabase → Project Settings → API Keys → roll the secret key, or Database → reset the password. Then update the GitHub secret with the new value. The publishable key is public anyway.
2. **Someone is flooding uploads**: in the SQL Editor run `drop policy "Anyone uploads into uploads/" on storage.objects;`. Making gifts from your own photo stops until you run that policy again from `schema.sql`; the catalogue keeps working.
3. **Bad image or text on the site**: projection room → reject it. Or in the SQL Editor: `update films set status = 'rejected' where id = '…';`
4. **The site is broken after a push**: Vercel → Deployments → the last good one → ⋯ → Promote to Production. Then fix it calmly.
5. **Data lost or damaged**: Actions → Weekly database backup → newest run → download the artifact, `gpg --decrypt` it, and run it in a fresh SQL Editor tab.
6. **Your account was taken over**: change the password and check 2FA on GitHub, Vercel and Supabase first, then go through steps 1 and 4.

## Roadmap

- [x] Static prototype: catalogue, puzzle, credits, create, ticket, review
- [x] Hosting on Vercel (deploys on every push to main)
- [x] Supabase schema
- [x] Connect the site: catalogue, uploads (Storage), share links, review queue
- [ ] Filters, more stills, TV
- [x] Admin login for the projection room
