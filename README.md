# Cut Scenes

Film stills cut into puzzles, for someone you love. Or tolerate.

A non-commercial design exploration by [Álida Díaz de Freijo](https://alidadiazdefreijo.framer.website/).
All film stills belong to their studios and filmmakers.

## Structure

```
index.html      the page
css/style.css   all styles
js/app.js       puzzle engine, flows, credits
stills/         catalogue images
```

## Run it locally

Open `index.html` in a browser. No build step.

## Supabase

The database lives in Supabase. Everything it needs is in `supabase/`:

- `schema.sql`: tables (`films`, `puzzles`, `admins`), security rules, the `stills` storage bucket and the starting catalogue. Run it once in the SQL Editor.
- `make-me-admin.sql`: gives your user access to the review queue.

The browser only ever uses the public (publishable / anon) key. Security comes from the Row Level Security rules in `schema.sql`, not from hiding the key.

## Roadmap

- [x] Static prototype: catalogue, puzzle, credits, create, ticket, review
- [x] GitHub Pages
- [x] Supabase schema
- [ ] Connect the site: catalogue, uploads (Storage), share links, review queue
- [ ] Admin login for the projection room
