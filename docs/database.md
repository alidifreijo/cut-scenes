# Database

The database lives in Supabase. Everything it needs is in `supabase/`. Run the files in the SQL Editor in this order.

| File | What it adds |
|---|---|
| `schema.sql` | Tables `films`, `puzzles` and `admins`, the security rules, the `stills` storage bucket and the first catalogue. |
| `make-me-admin.sql` | Gives your user access to the review queue (the projection room). |
| `002_film_details.sql` | Year, director, genre and runtime, also for gifts made from your own still. |
| `003_more_stills.sql` | Eight more stills for Now Showing, including the first TV series. |
| `004_no_duplicates_and_drafts.sql` | One live copy per film (TMDB id, or title and year), a `draft` status and the Filmin top 25 as drafts. |
| `005_leaderboard.sql` | Speed board: the `plays` table and the `log_play`, `sign_play` and `board` functions. |
| `006_soundtracks.sql` | `spotify` column on films (`album/<id>` or `track/<id>`). |
| `007_one_track_each.sql` | One song per film, the main theme, instead of whole albums. |
| `008_elm_street_rocky_horror.sql` | A Nightmare on Elm Street and The Rocky Horror Picture Show as drafts, with their songs. |
| `009_thumbnails.sql` | Light WebP copies of each still for the grid, served from `thumbs/`. The full still only loads when a film is opened. |
| `010_limits.sql` | Hourly limits on uploads, submissions, gift links and scores, and no rude names on the board. |
| `011_bola_negra_song.sql` | La Nieve (Guitarricadelafuente) for La bola negra. |

## How the rules work

- **films**: anyone reads what's published and can submit, but only as `pending`. Admins see and change everything.
- **puzzles**: anyone can create a gift link. Nobody can list them. A link is read through `get_puzzle(id)`, which returns that one gift and nothing else.
- **plays**: never touched directly. `log_play` rejects impossible times and `sign_play` needs the token it handed out.
- **admins**: `is_admin()` checks this table. It is the only way to the review queue.
- **storage**: visitors can only upload images under 5 MB into `stills/uploads/`, with an hourly limit.

The browser only ever uses the publishable key. Security comes from these rules, not from hiding the key.

## Importing from TMDB

`tools/tmdb-lookup.mjs` looks up a list of titles on TMDB and returns their details and four stills each. It reads the token from the `TMDB_TOKEN` environment variable. Never commit it.

```
TMDB_TOKEN=... node tools/tmdb-lookup.mjs list.json > out.json
```
