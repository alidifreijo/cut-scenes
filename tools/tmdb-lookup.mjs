// Look films up on TMDB and print JSON with details and stills.
// Usage: TMDB_TOKEN=xxx node tools/tmdb-lookup.mjs list.json > out.json
// list.json: [{"q":"Metropolis","year":1927,"kind":"film"}, ...]
// The token is read from the environment and never written anywhere.
import fs from 'node:fs';
const TOKEN = process.env.TMDB_TOKEN;
if (!TOKEN) { console.error('Set TMDB_TOKEN'); process.exit(1); }
const api = async (path) => {
  const r = await fetch('https://api.themoviedb.org/3' + path, { headers: { Authorization: 'Bearer ' + TOKEN, accept: 'application/json' } });
  if (!r.ok) throw new Error(path + ' → ' + r.status);
  return r.json();
};
const ONE_WORD = { 'Science Fiction': 'Sci-fi', 'TV Movie': 'Drama', 'Action & Adventure': 'Adventure', 'Sci-Fi & Fantasy': 'Sci-fi', 'War & Politics': 'War' };
const genreWord = (g) => ONE_WORD[g] || g;
const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = [];
for (const it of list) {
  const kind = it.kind || 'film', t = kind === 'tv' ? 'tv' : 'movie';
  const yr = kind === 'tv' ? 'first_air_date_year' : 'primary_release_year';
  let res = (await api(`/search/${t}?query=${encodeURIComponent(it.q)}${it.year ? `&${yr}=${it.year}` : ''}&language=en-US`)).results;
  if (!res.length && it.year) res = (await api(`/search/${t}?query=${encodeURIComponent(it.q)}&language=en-US`)).results;
  if (!res.length) { out.push({ ...it, error: 'not found' }); continue; }
  const hit = it.id ? { id: it.id } : res[0];
  const d = await api(`/${t}/${hit.id}?language=en-US&append_to_response=credits`);
  const imgs = await api(`/${t}/${hit.id}/images?include_image_language=null,xx`);
  const stills = (imgs.backdrops || []).filter(b => b.width >= 1280).sort((a, b) => b.vote_count - a.vote_count || b.vote_average - a.vote_average)
    .slice(0, 4).map(b => 'https://image.tmdb.org/t/p/w1280' + b.file_path);
  const dirs = kind === 'tv' ? (d.created_by || []).map(c => c.name) : (d.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name);
  out.push({
    q: it.q, tmdb_id: d.id, kind,
    title: d.title || d.name, original_title: d.original_title || d.original_name,
    year: (d.release_date || d.first_air_date || '').slice(0, 4),
    director: dirs.join(' & '), genre: genreWord((d.genres || [])[0]?.name || 'Drama'),
    runtime: kind === 'tv' ? `${d.number_of_seasons} series · ${d.number_of_episodes} episodes` : (d.runtime ? d.runtime + ' min' : null),
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    stills, alternatives: res.slice(0, 3).map(r => `${r.title || r.name} (${(r.release_date || r.first_air_date || '').slice(0, 4)}) #${r.id}`)
  });
}
console.log(JSON.stringify(out, null, 2));
