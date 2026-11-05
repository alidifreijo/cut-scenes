# Operations

How the site is protected, what runs on its own and what to do when something goes wrong.

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

## Monitoring

- **Vercel Analytics and Speed Insights**: visits and real loading speed, without cookies.
- **UptimeRobot**: checks the site every five minutes and emails the owner if it stops answering.
