'use strict';

// ── OMDB API ─────────────────────────────────────────────────

const OMDB = {
  _cache: new Map(),

  _url(params) {
    const p = new URLSearchParams({ ...params, apikey: CFG.OMDB_KEY });
    return CFG.OMDB + '?' + p.toString();
  },

  async _fetch(params) {
    const key = JSON.stringify(params);
    if (this._cache.has(key)) return this._cache.get(key);
    try {
      const r = await fetch(this._url(params));
      const d = await r.json();
      if (d.Response === 'True') {
        this._cache.set(key, d);
        return d;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Search for movies by query string → returns array of search results
  async search(query) {
    const d = await this._fetch({ s: query, type: 'movie' });
    if (!d || !d.Search) return [];
    return d.Search.map(m => ({
      imdbId: m.imdbID,
      title: m.Title,
      year: parseInt(m.Year) || 0,
      poster: m.Poster !== 'N/A' ? m.Poster : null,
    }));
  },

  // Get full movie details by IMDb ID
  async byId(imdbId) {
    const d = await this._fetch({ i: imdbId, plot: 'short' });
    return d ? this._parse(d) : null;
  },

  // Get full movie details by title (+ optional year)
  async byTitle(title, year) {
    const p = { t: title, type: 'movie', plot: 'short' };
    if (year) p.y = year;
    const d = await this._fetch(p);
    return d ? this._parse(d) : null;
  },

  _parse(d) {
    return {
      imdbId:     d.imdbID,
      title:      d.Title,
      year:       parseInt(d.Year) || 0,
      rated:      d.Rated !== 'N/A' ? d.Rated : null,
      runtime:    parseInt(d.Runtime) || 0,
      genres:     d.Genre !== 'N/A' ? d.Genre.split(', ') : [],
      director:   d.Director !== 'N/A' ? d.Director : '',
      actors:     d.Actors !== 'N/A' ? d.Actors.split(', ') : [],
      plot:       d.Plot !== 'N/A' ? d.Plot : '',
      poster:     d.Poster !== 'N/A' ? d.Poster : null,
      imdbRating: parseFloat(d.imdbRating) || 0,
      imdbVotes:  d.imdbVotes !== 'N/A' ? d.imdbVotes : '',
      // Derive keyword themes from genres + plot words for recommendation
      _themes:    deriveThemes(d),
    };
  },
};

// Extract rough theme keywords from OMDB data (used by recommendation engine)
function deriveThemes(d) {
  const themes = new Set();
  // From genres
  (d.Genre || '').split(', ').forEach(g => themes.add(g.toLowerCase()));
  // From plot — look for common thematic words
  const plotWords = (d.Plot || '').toLowerCase();
  const themeMap = {
    'prison': ['prison','imprisoned','inmate','jail','penitentiary','cellblock','warden','sentence'],
    'escape': ['escape','escaped','flee','break out','breakout','run away'],
    'revenge': ['revenge','vengeance','avenge','retaliation','retribution'],
    'love': ['love','romance','romantic','fall in love','lover','relationship'],
    'family': ['family','father','mother','son','daughter','brother','sister','parent'],
    'war': ['war','battle','combat','soldier','military','army','fought','wwii','vietnam'],
    'crime': ['crime','criminal','murder','theft','robbery','assassination'],
    'mafia': ['mafia','mob','gang','cartel','organized crime','don','boss'],
    'survival': ['survival','survive','stranded','lost','wilderness','alone'],
    'psychology': ['psychology','psychological','mind','mental','therapy','therapist'],
    'redemption': ['redemption','redeem','atone','forgiveness','second chance'],
    'corruption': ['corruption','corrupt','bribery','scandal','cover-up'],
    'identity': ['identity','who he is','who she is','who they are','disguise','undercover'],
    'mystery': ['mystery','mysterious','disappeared','missing','secret','unknown'],
    'addiction': ['addiction','addict','drug','substance','alcohol','dependent'],
    'power': ['power','control','authority','domination','rule','leadership'],
    'betrayal': ['betrayal','betray','traitor','double cross','deceive','backstab'],
    'justice': ['justice','injustice','trial','court','law','verdict','innocent'],
    'obsession': ['obsession','obsessed','fixated','consumed','haunted'],
  };
  Object.entries(themeMap).forEach(([theme, words]) => {
    if (words.some(w => plotWords.includes(w))) themes.add(theme);
  });
  // From actors — director style signals
  if ((d.Director || '').includes('Nolan')) themes.add('mind-bending');
  if ((d.Director || '').includes('Tarantino')) themes.add('stylized violence');
  if ((d.Director || '').includes('Fincher')) themes.add('dark psychological');
  if ((d.Director || '').includes('Scorsese')) themes.add('crime drama');
  return [...themes];
}
