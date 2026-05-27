'use strict';

// ════════════════════════════════════════════════════════════════
// APP.JS  — Search · Recommendation · Panel · UI
// ════════════════════════════════════════════════════════════════

// ── Polish ↔ English theme/genre map ────────────────────────────
const PL_EN = {
  'więzienie':'prison','ucieczka':'escape','zemsta':'revenge',
  'miłość':'love','rodzina':'family','wojna':'war',
  'kryminał':'crime','mafia':'mafia','przetrwanie':'survival',
  'psychologia':'psychology','odkupienie':'redemption',
  'korupcja':'corruption','tożsamość':'identity','tajemnica':'mystery',
  'uzależnienie':'addiction','władza':'power','zdrada':'betrayal',
  'sprawiedliwość':'justice','obsesja':'obsession',
  'horror':'horror','thriller':'thriller','dramat':'drama',
  'akcja':'action','komedia':'comedy','animacja':'animation',
  'historia':'history','romans':'romance','fantazja':'fantasy',
  'mroczny':'dark','nauka':'sci-fi','przyjaźń':'friendship',
  'nadzieja':'hope','ambicja':'ambition','zdolność':'genius',
};

// Known themes and genres for quick-add nodes
const KNOWN_THEMES = new Set([
  'prison','escape','revenge','love','family','war','crime','mafia','survival',
  'psychology','redemption','corruption','identity','mystery','addiction','power',
  'betrayal','justice','obsession','dark','hope','friendship','ambition',
  'genius','loyalty','freedom','honor','manipulation','jealousy','grief',
]);
const KNOWN_GENRES = new Set([
  'drama','action','thriller','horror','comedy','sci-fi','animation','romance',
  'biography','mystery','adventure','fantasy','history','documentary','western',
  'musical','sport','family',
]);

// ── Short DOM helper ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════
const toastEl = $('toast');
let _toastT;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// ════════════════════════════════════════════════════════════════
// PILL HELPERS
// ════════════════════════════════════════════════════════════════
function showPill(el) {
  el.classList.remove('hidden');
  // Double rAF so the browser paints display:flex before the opacity transition fires
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
}

function hidePill(el) {
  el.classList.remove('show');
  setTimeout(() => el.classList.add('hidden'), 350);
}

// ════════════════════════════════════════════════════════════════
// INTRO  /  NODE-COUNT  /  HINT
// ════════════════════════════════════════════════════════════════
const introEl = $('intro');
let _introGone = false;

function fadeIntro() {
  if (_introGone) return;
  _introGone = true;
  introEl.style.opacity = '0';
  setTimeout(() => introEl.classList.add('hidden'), 720);
  $('hint').classList.remove('hidden');
}

function updateNC() {
  const n = getNodes().length;
  const c = getConns().length;
  const nc = $('nc');
  if (n === 0) { nc.classList.add('hidden'); return; }
  nc.classList.remove('hidden');
  $('nc-n').textContent = n;
  $('nc-c').textContent = c;
}

// ════════════════════════════════════════════════════════════════
// PANEL
// ════════════════════════════════════════════════════════════════
const panelEl    = $('panel');
const pPosterCv  = $('p-poster-cv');
const pPosterImg = $('p-poster-img');
const pTitleEl   = $('p-title');
const pOrigEl    = $('p-orig');
const pMatchEl   = $('p-match');
const pPctEl     = $('p-pct');
const pWhyEl     = $('p-why');
const pStarsEl   = $('p-stars');
const pRvalEl    = $('p-rval');
const pYrEl      = $('p-yr');
const pGenresEl  = $('p-genres');
const pPlotEl    = $('p-plot');
const pDirEl     = $('p-dir');
const pCastEl    = $('p-cast');
const pAddEl     = $('p-add');

let _panelMovie  = null;
let _panelMatchPct = null;
let _panelWhy    = null;

function makeChip(text) {
  const s = document.createElement('span');
  s.className = 'chip';
  s.textContent = text;
  return s;
}

function openPanel(movie, matchPct, whyText) {
  _panelMovie    = movie;
  _panelMatchPct = matchPct;
  _panelWhy      = whyText;

  // ── Poster ──────────────────────────────────────────────────
  pPosterImg.classList.remove('loaded');
  const ctx = pPosterCv.getContext('2d');
  ctx.fillStyle = '#09090f';
  ctx.fillRect(0, 0, 370, 220);

  if (movie.poster) {
    const bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.onload = () => {
      ctx.filter = 'blur(22px) brightness(0.28) saturate(140%)';
      ctx.drawImage(bg, -30, -30, 430, 280);
    };
    bg.src = movie.poster;

    pPosterImg.onload = () => pPosterImg.classList.add('loaded');
    pPosterImg.src = movie.poster;
  }

  // ── Title / year / director ──────────────────────────────────
  pTitleEl.textContent = movie.title || '—';
  const sub = [movie.year, movie.director].filter(Boolean).join(' · ');
  pOrigEl.textContent = sub;

  // ── Match section ────────────────────────────────────────────
  if (matchPct !== null && matchPct !== undefined) {
    pMatchEl.style.display = 'flex';
    pPctEl.textContent = matchPct + '%';
    pWhyEl.textContent  = whyText || 'Thematic match';
  } else {
    pMatchEl.style.display = 'none';
  }

  // ── IMDb rating ──────────────────────────────────────────────
  if (movie.imdbRating) {
    pStarsEl.textContent = '★';
    pRvalEl.textContent  = movie.imdbRating;
    pYrEl.textContent    = movie.year || '';
  } else {
    pStarsEl.textContent = '';
    pRvalEl.textContent  = '';
    pYrEl.textContent    = movie.year || '';
  }

  // ── Genre chips ──────────────────────────────────────────────
  pGenresEl.innerHTML = '';
  (movie.genres || []).forEach(g => pGenresEl.appendChild(makeChip(g)));

  // ── Plot ─────────────────────────────────────────────────────
  pPlotEl.textContent = movie.plot || '';

  // ── Director chips ───────────────────────────────────────────
  pDirEl.innerHTML = '';
  if (movie.director) {
    movie.director.split(', ').forEach(d => pDirEl.appendChild(makeChip(d)));
  }

  // ── Cast chips ───────────────────────────────────────────────
  pCastEl.innerHTML = '';
  (movie.actors || []).slice(0, 4).forEach(a => pCastEl.appendChild(makeChip(a)));

  // ── Add button ───────────────────────────────────────────────
  const alreadyIn = getNodes().some(n => n.type === 'movie' && n.data.imdbId === movie.imdbId);
  pAddEl.textContent = alreadyIn ? '✓ Already in network' : '+ Add to network';
  pAddEl.style.opacity = alreadyIn ? '0.4' : '1';
  pAddEl.disabled = alreadyIn;

  panelEl.classList.add('open');
}

function closePanel() {
  panelEl.classList.remove('open');
  // Solar system layout persists — closing panel doesn't reset it
}

$('p-close').addEventListener('click', closePanel);

pAddEl.addEventListener('click', () => {
  if (!_panelMovie) return;
  if (addNode('movie', _panelMovie)) {
    pAddEl.textContent = '✓ Already in network';
    pAddEl.style.opacity = '0.4';
    pAddEl.disabled = true;
  }
});

// ════════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ════════════════════════════════════════════════════════════════
let _recTimer;
let _recMovie = null;
let _recScore = 0;
let _recWhy   = '';

function onNetworkChange() {
  updateNC();
  fadeIntro();

  clearTimeout(_recTimer);
  const nodes = getNodes();
  if (nodes.length === 0) {
    hidePill($('thinking'));
    hidePill($('rec-pill'));
    return;
  }

  showPill($('thinking'));
  hidePill($('rec-pill'));
  _recTimer = setTimeout(computeRec, CFG.REC_DELAY);
}

async function computeRec() {
  const nodes = getNodes();
  if (nodes.length === 0) { hidePill($('thinking')); return; }

  // ── Build signal sets from network ──────────────────────────
  const movieIds = new Set();
  const genres   = new Set();
  const themes   = new Set();
  const actors   = new Set();

  nodes.forEach(n => {
    if (n.type === 'movie') {
      if (n.data.imdbId) movieIds.add(n.data.imdbId);
      (n.data.genres  || []).forEach(g => genres.add(g.toLowerCase()));
      (n.data._themes || []).forEach(t => themes.add(t.toLowerCase()));
      (n.data.actors  || []).forEach(a => actors.add(a.toLowerCase()));
      // Also pull MOVIES index keywords for this movie
      const idx = MOVIES.find(m => m.id === n.data.imdbId);
      if (idx) {
        idx.g.forEach(g => genres.add(g.toLowerCase()));
        idx.k.forEach(k => themes.add(k.toLowerCase()));
      }
    } else if (n.type === 'genre') {
      genres.add(String(n.data).toLowerCase());
    } else if (n.type === 'theme') {
      themes.add(String(n.data).toLowerCase());
    } else if (n.type === 'actor') {
      actors.add(String(n.data).toLowerCase());
    }
  });

  // ── Score all MOVIES candidates ──────────────────────────────
  let best = null;
  let bestScore = 0;
  let bestMatchedGenres = [];
  let bestMatchedThemes = [];

  MOVIES.forEach(candidate => {
    if (movieIds.has(candidate.id)) return;

    let score = 0;
    const matchedG = [];
    const matchedT = [];

    candidate.g.forEach(g => {
      if (genres.has(g.toLowerCase())) { score += 22; matchedG.push(g); }
    });
    candidate.k.forEach(k => {
      const kl = k.toLowerCase();
      if (themes.has(kl)) { score += 13; matchedT.push(k); }
    });

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
      bestMatchedGenres = matchedG;
      bestMatchedThemes = matchedT;
    }
  });

  if (!best || bestScore === 0) { hidePill($('thinking')); return; }

  // ── Fetch full OMDB data ─────────────────────────────────────
  const movie = await OMDB.byId(best.id);
  if (!movie) { hidePill($('thinking')); return; }

  // ── Compute display match % (50–99 range feels better than raw) ─
  const maxPossible = best.g.length * 22 + best.k.length * 13;
  const rawPct = maxPossible > 0 ? (bestScore / maxPossible) * 100 : 0;
  const pct    = Math.round(50 + rawPct * 0.49); // remap to 50–99
  _recScore = pct;
  _recMovie = movie;

  // ── Build "why" explanation ──────────────────────────────────
  const reasons = [...bestMatchedGenres.slice(0, 2), ...bestMatchedThemes.slice(0, 2)].slice(0, 3);
  _recWhy = reasons.length > 0
    ? `Matched: ${reasons.join(' · ')}`
    : 'Similar style and themes';

  // ── Show recommendation pill ─────────────────────────────────
  hidePill($('thinking'));
  $('rec-title').textContent = movie.title;
  $('rec-score').textContent = `${pct}% match · ${movie.year || ''}`;
  showPill($('rec-pill'));
}

// Rec pill click → open panel
$('rec-pill').addEventListener('click', () => {
  if (_recMovie) {
    openPanel(_recMovie, _recScore, _recWhy);
    const n = getNodes().find(nd => nd.type === 'movie' && nd.data.imdbId === _recMovie.imdbId);
    if (n) setFocalNode(n);
  }
});
$('rec-pill').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') $('rec-pill').click();
});

// ════════════════════════════════════════════════════════════════
// SEARCH  &  DROPDOWN
// ════════════════════════════════════════════════════════════════
const searchInput  = $('search-input');
const dropdownEl   = $('dropdown');
const loaderEl     = $('search-loader');

let _searchTimer;
let _ddActive = -1;
let _ddOMDB   = [];   // latest OMDB results
let _ddLocal  = [];   // latest local index results

// ── Open / close ─────────────────────────────────────────────────
function ddShow() { dropdownEl.style.display = 'block'; }
function ddHide() {
  dropdownEl.style.display = 'none';
  _ddActive = -1;
  loaderEl.classList.remove('active');
}

// ── Keyboard nav ─────────────────────────────────────────────────
function ddHighlight() {
  const items = dropdownEl.querySelectorAll('.dd-item[data-idx]');
  items.forEach((it, i) => it.classList.toggle('active', i === _ddActive));
  if (_ddActive >= 0 && items[_ddActive]) {
    items[_ddActive].scrollIntoView({ block: 'nearest' });
  }
}

searchInput.addEventListener('keydown', e => {
  if (dropdownEl.style.display === 'none') return;
  const items = dropdownEl.querySelectorAll('.dd-item[data-idx]');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _ddActive = Math.min(_ddActive + 1, items.length - 1);
    ddHighlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _ddActive = Math.max(_ddActive - 1, -1);
    ddHighlight();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const target = _ddActive >= 0 ? items[_ddActive] : items[0];
    if (target) target.click();
  } else if (e.key === 'Escape') {
    ddHide(); searchInput.blur();
  }
});

// ── Input handler ────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  clearTimeout(_searchTimer);
  if (!q) { ddHide(); _ddOMDB = []; _ddLocal = []; return; }

  buildLocalResults(q);
  renderDropdown(q);
  ddShow();

  loaderEl.classList.add('active');
  _searchTimer = setTimeout(async () => {
    _ddOMDB = await OMDB.search(q);
    renderDropdown(q);
    loaderEl.classList.remove('active');
  }, 340);
});

searchInput.addEventListener('focus', () => {
  const q = searchInput.value.trim();
  if (q) { buildLocalResults(q); renderDropdown(q); ddShow(); }
});

document.addEventListener('mousedown', e => {
  if (!e.target.closest('#search-wrap')) ddHide();
});

// ── Build local results from MOVIES index ───────────────────────
function buildLocalResults(q) {
  const ql = q.toLowerCase();
  _ddLocal = MOVIES.filter(m => {
    const tl = m.t.toLowerCase();
    if (tl.includes(ql)) return true;
    if (m.g.some(g => g.toLowerCase().includes(ql))) return true;
    if (m.k.some(k => k.toLowerCase().includes(ql))) return true;
    return false;
  }).slice(0, 5);
}

// ── Render dropdown ──────────────────────────────────────────────
function renderDropdown(q) {
  const ql         = q.toLowerCase();
  const translated = PL_EN[ql] || ql;

  const omdbIds    = new Set(_ddOMDB.map(m => m.imdbId));
  const localOnly  = _ddLocal.filter(m => !omdbIds.has(m.id));

  // Determine node-type quick-add options
  const quickItems = [];

  if (KNOWN_GENRES.has(translated)) {
    quickItems.push({ kind: 'genre', label: translated, sub: 'Add genre node' });
  }
  if (KNOWN_THEMES.has(translated)) {
    quickItems.push({ kind: 'theme', label: translated, sub: 'Add theme node' });
  }

  // Actor: looks like a person's name (2+ words, not a known genre/theme)
  const words = q.trim().split(/\s+/);
  const looksLikeName = words.length >= 2 && !KNOWN_GENRES.has(translated) && !KNOWN_THEMES.has(translated);
  const actorItems = [];
  if (looksLikeName) {
    actorItems.push({ kind: 'actor', label: q.trim(), sub: 'Actor · add to network' });
  }

  // ── Assemble sections ──────────────────────────────────────
  const html = [];
  let idx = 0;

  // Movie results — only show entries with a poster (filters out shorts/docs/spam)
  const movieItems = _ddOMDB.length > 0
    ? _ddOMDB.filter(m => m.poster).slice(0, 6).map(m => ({ kind: 'movie-omdb', label: m.title, sub: m.year ? String(m.year) : '', id: m.imdbId, poster: m.poster }))
    : localOnly.map(m => ({ kind: 'movie-local', label: m.t, sub: m.g.slice(0,2).join(' · '), id: m.id, poster: null }));

  if (movieItems.length > 0) {
    html.push('<div class="dd-section">');
    html.push('<div class="dd-label">Movies</div>');
    movieItems.forEach(item => {
      html.push(ddItemHTML(item, idx++));
    });
    html.push('</div>');
  }

  // People section (actors)
  if (actorItems.length > 0) {
    html.push('<div class="dd-section">');
    html.push('<div class="dd-label">People</div>');
    actorItems.forEach(item => {
      html.push(ddItemHTML(item, idx++));
    });
    html.push('</div>');
  }

  if (quickItems.length > 0) {
    html.push('<div class="dd-section">');
    html.push('<div class="dd-label">Add node</div>');
    quickItems.forEach(item => {
      html.push(ddItemHTML(item, idx++));
    });
    html.push('</div>');
  }

  if (html.length === 0) {
    html.push('<div class="dd-section"><div style="padding:14px 16px;font-size:12px;color:rgba(255,255,255,0.2)">No results — try another search</div></div>');
  }

  dropdownEl.innerHTML = html.join('');

  // Attach click listeners
  dropdownEl.querySelectorAll('.dd-item[data-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const kind = el.dataset.kind;
      const id   = el.dataset.id;
      const lbl  = el.dataset.label;
      handleDDSelect(kind, id, lbl);
    });
  });
}

function colorFor(kind) {
  if (kind === 'movie-omdb' || kind === 'movie-local') return CFG.COLOR.movie.hex;
  if (kind === 'genre') return CFG.COLOR.genre.hex;
  if (kind === 'actor') return CFG.COLOR.actor.hex;
  return CFG.COLOR.theme.hex;  // theme
}

function nameInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

function ddItemHTML(item, idx) {
  const c       = colorFor(item.kind);
  const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const isMovie = item.kind === 'movie-omdb' || item.kind === 'movie-local';
  const isActor = item.kind === 'actor';

  // Left element: poster, actor avatar, or colored dot
  let leftEl;
  if (isMovie && item.poster) {
    leftEl = `<img src="${esc(item.poster)}" class="dd-poster" alt="" loading="lazy">`;
  } else if (isActor) {
    leftEl = `<div class="dd-avatar">${esc(nameInitials(item.label))}</div>`;
  } else {
    leftEl = `<div class="dd-dot" style="background:${c};box-shadow:0 0 5px ${c}80;opacity:0.8"></div>`;
  }

  // Right element: year badge for movies
  const rightEl = isMovie && item.sub
    ? `<span class="dd-right">${esc(item.sub)}</span>`
    : '';

  // Sub-label for actors
  const subEl = isActor && item.sub
    ? `<div class="dd-sub">${esc(item.sub)}</div>`
    : '';

  return `
    <div class="dd-item" data-idx="${idx}" data-kind="${item.kind}" data-id="${esc(item.id||'')}" data-label="${esc(item.label)}">
      ${leftEl}
      <div class="dd-info">
        <div class="dd-name">${esc(item.label)}</div>
        ${subEl}
      </div>
      ${rightEl}
    </div>`;
}

// ── Handle dropdown selection ────────────────────────────────────
async function handleDDSelect(kind, id, label) {
  ddHide();
  searchInput.value = '';
  searchInput.blur();

  if (kind === 'movie-omdb') {
    loaderEl.classList.add('active');
    const movie = await OMDB.byId(id);
    loaderEl.classList.remove('active');
    if (movie) {
      addNode('movie', movie);
    } else {
      showToast('Could not load movie data');
    }
  } else if (kind === 'movie-local') {
    loaderEl.classList.add('active');
    const movie = await OMDB.byId(id);
    loaderEl.classList.remove('active');
    if (movie) {
      addNode('movie', movie);
    } else {
      // Fallback: create minimal node from index data
      const idx = MOVIES.find(m => m.id === id);
      if (idx) addNode('movie', { imdbId: idx.id, title: idx.t, genres: idx.g, _themes: idx.k, year: 0 });
    }
  } else if (kind === 'genre') {
    addNode('genre', label);
  } else if (kind === 'theme') {
    addNode('theme', label);
  } else if (kind === 'actor') {
    addNode('actor', label);
  }
}

// Node clicks are now handled in network.js:
// · Click focal movie → opens panel
// · Click another movie → switches focal (solar system re-centres)
// · Click satellite node → marks as connection source (pulsing ring)
// · Click another node  → connects them

// ════════════════════════════════════════════════════════════════
// GLOBAL KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  // '/' focuses search
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  // Escape closes panel
  if (e.key === 'Escape') {
    if (panelEl.classList.contains('open')) { closePanel(); return; }
    ddHide();
  }
});

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════

// ── Trending widget ──────────────────────────────────────────────
(function initTrending() {
  // Set the date label
  const dateEl = document.getElementById('trending-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // Start the widget
  if (typeof TRENDING !== 'undefined') TRENDING.init();

  // Hide widget when user adds their first movie (network takes over)
  const _origAddNode = typeof addNode === 'function' ? addNode : null;
  // We'll hook into node count changes via MutationObserver on #nc
  const ncEl = document.getElementById('nc');
  if (ncEl) {
    const obs = new MutationObserver(() => {
      const nText = document.getElementById('nc-n');
      const count = nText ? parseInt(nText.textContent) || 0 : 0;
      const tEl = document.getElementById('trending');
      if (tEl) {
        if (count > 0) {
          tEl.style.opacity = '0';
          tEl.style.pointerEvents = 'none';
          setTimeout(() => tEl.classList.add('hidden'), 500);
        } else {
          tEl.classList.remove('hidden');
          tEl.style.pointerEvents = '';
          requestAnimationFrame(() => { tEl.style.opacity = '1'; });
        }
      }
    });
    obs.observe(ncEl, { childList: true, subtree: true, characterData: true });
  }
})();

// (2.5D mode — no auto-rotation)
