/* Everything that talks to Supabase lives in this file.
   app.js only calls DB.something(), so if the backend changes one day,
   this is the only file to touch. */
const sb = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_KEY);

const DB = {
  /* Catalogue: only what is published. RLS hides the rest anyway. */
  async films() {
    const { data, error } = await sb.from('films').select('*').eq('status', 'published').order('created_at');
    if (error) throw error;
    return data;
  },

  /* Upload a still into stills/uploads/ and return its public URL. */
  async uploadStill(blob, name) {
    const path = 'uploads/' + name + '.jpg';
    const { error } = await sb.storage.from('stills').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return sb.storage.from('stills').getPublicUrl(path).data.publicUrl;
  },

  /* A shared link. We pick the id ourselves, so we don't need to read the row back
     (visitors aren't allowed to read the puzzles table). */
  async createPuzzle(row) {
    const { error } = await sb.from('puzzles').insert(row);
    if (error) throw error;
  },

  /* A submission to Now Showing. It always lands as pending. */
  async submitFilm(row) {
    const { error } = await sb.from('films').insert(row);
    if (error) throw error;
  },

  /* Open one link by its id. */
  async getPuzzle(id) {
    const { data, error } = await sb.rpc('get_puzzle', { p_id: id });
    if (error) throw error;
    return data && data[0];
  },

  /* Projection room: your login and the review queue. */
  async session() {
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  async signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() {
    await sb.auth.signOut();
  },
  async pending() {
    const { data, error } = await sb.from('films').select('*').eq('status', 'pending').order('created_at');
    if (error) throw error;
    return data;
  },
  async setStatus(id, status) {
    const { error } = await sb.from('films').update({ status }).eq('id', id);
    if (error) throw error;
  }
};
