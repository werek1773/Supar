'use strict';

// ── TRENDING WIDGET ──────────────────────────────────────────────
// Shows top 4 movies daily (rotates at 15:00).
// Source: curated pool of recent acclaimed films, date-seeded rotation.
// Each row clickable → adds movie to the network.

const TRENDING = (() => {

  // ── Curated pool (title, year, imdbId for reliability) ─────────
  const POOL = [
    { title: 'Oppenheimer',                year: 2023, imdbId: 'tt15398776' },
    { title: 'Killers of the Flower Moon', year: 2023, imdbId: 'tt5537002'  },
    { title: 'The Zone of Interest',       year: 2023, imdbId: 'tt7160372'  },
    { title: 'Poor Things',                year: 2023, imdbId: 'tt14230458' },
    { title: 'Past Lives',                 year: 2023, imdbId: 'tt13238346' },
    { title: 'Anatomy of a Fall',          year: 2023, imdbId: 'tt17009710' },
    { title: 'The Holdovers',              year: 2023, imdbId: 'tt14849194' },
    { title: 'Godzilla Minus One',         year: 2023, imdbId: 'tt23289160' },
    { title: 'Saltburn',                   year: 2023, imdbId: 'tt17351924' },
    { title: 'American Fiction',           year: 2023, imdbId: 'tt23561236' },
    { title: 'Barbie',                     year: 2023, imdbId: 'tt1517268'  },
    { title: 'Dune: Part Two',             year: 2024, imdbId: 'tt15239678' },
    { title: 'The Brutalist',              year: 2024, imdbId: 'tt8971480'  },
    { title: 'Conclave',                   year: 2024, imdbId: 'tt23754258' },
    { title: 'Anora',                      year: 2024, imdbId: 'tt28607951' },
    { title: 'The Substance',              year: 2024, imdbId: 'tt17526714' },
    { title: 'Challengers',                year: 2024, imdbId: 'tt16426418' },
    { title: 'Inside Out 2',               year: 2024, imdbId: 'tt22022452' },
    { title: 'Alien: Romulus',             year: 2024, imdbId: 'tt18412256' },
    { title: 'A Real Pain',                year: 2024, imdbId: 'tt21823606' },
    { title: 'Emilia Pérez',               year: 2024, imdbId: 'tt20221478' },
    { title: 'Flow',                       year: 2024, imdbId: 'tt4772188'  },
    { title: 'Nickel Boys',                year: 2024, imdbId: 'tt22687790' },
  ];

  const CACHE_KEY = 'cn_trending_v2';
  const COUNT = 4;

  // ── Daily seed: epoch-days; flips at 15:00 local ────────────────
  function _daySeed() {
    const now = new Date();
    const msInDay = 86400000;
    const offsetMs = now.getHours() < 15 ? -msInDay : 0;
    const dayEpoch = Math.floor((Date.now() + offsetMs) / msInDay);
    return dayEpoch;
  }

  // ── Seeded shuffle (Fisher-Yates with LCG) ──────────────────────
  function _seededShuffle(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _todaysEntries() {
    const seed = _daySeed();
    return _seededShuffle(POOL, seed).slice(0, COUNT);
  }

  // ── Persistent cache ─────────────────────────────────────────────
  function _loadCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  }
  function _saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  }

  // ── Fetch movie data (cache-aware) ──────────────────────────────
  async function _fetchMovie(entry) {
    const cache = _loadCache();
    if (cache[entry.imdbId]) return cache[entry.imdbId];
    const data = await OMDB.byId(entry.imdbId);
    if (data) {
      cache[entry.imdbId] = data;
      _saveCache(cache);
    }
    return data;
  }

  // ── DOM helpers ──────────────────────────────────────────────────
  function _starRating(r) {
    const filled = Math.round(r / 2);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  function _renderSkeleton() {
    const el = document.getElementById('trending-list');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < COUNT; i++) {
      const row = document.createElement('div');
      row.className = 'tr-row tr-skeleton';
      row.innerHTML = `
        <div class="tr-rank">${i + 1}</div>
        <div class="tr-thumb tr-thumb-skel"></div>
        <div class="tr-info">
          <div class="tr-skel-line tr-skel-title"></div>
          <div class="tr-skel-line tr-skel-meta"></div>
        </div>`;
      el.appendChild(row);
    }
  }

  function _renderRow(movie, rank, entry) {
    const row = document.createElement('div');
    row.className = 'tr-row';
    row.title = `Add "${movie.title}" to network`;

    const posterHtml = movie.poster
      ? `<img class="tr-thumb-img" src="${movie.poster}" alt="" loading="lazy" />`
      : `<div class="tr-thumb-blank"></div>`;

    const rating = movie.imdbRating
      ? `<span class="tr-stars">${_starRating(movie.imdbRating)}</span><span class="tr-rating">${movie.imdbRating}</span>`
      : '';

    row.innerHTML = `
      <div class="tr-rank">${rank}</div>
      <div class="tr-thumb">${posterHtml}</div>
      <div class="tr-info">
        <div class="tr-title">${movie.title}</div>
        <div class="tr-meta">${movie.year}${rating ? ' · ' : ''}${rating}</div>
      </div>
      <div class="tr-add-ico">+</div>`;

    row.addEventListener('click', () => {
      // Add to network if addNode is available (defined in network.js)
      if (typeof addNode === 'function') {
        addNode('movie', movie);
      }
      // Hide intro if visible
      const intro = document.getElementById('intro');
      if (intro) intro.style.opacity = '0';
    });

    return row;
  }

  // ── Refresh the widget content ───────────────────────────────────
  async function refresh() {
    const el = document.getElementById('trending-list');
    if (!el) return;

    _renderSkeleton();

    const entries = _todaysEntries();
    const movies = await Promise.all(entries.map(_fetchMovie));

    el.innerHTML = '';
    movies.forEach((movie, i) => {
      if (!movie) return;
      el.appendChild(_renderRow(movie, i + 1, entries[i]));
    });
  }

  // ── Schedule next refresh at 15:00 ──────────────────────────────
  function _scheduleNextRefresh() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(15, 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const ms = next - now;
    setTimeout(() => {
      refresh();
      _scheduleNextRefresh();
    }, ms);
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    refresh();
    _scheduleNextRefresh();
  }

  return { init, refresh };
})();
