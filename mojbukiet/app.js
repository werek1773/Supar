/* ─── MójBukiet.com — konfigurator bukietów ─────────────────────── */
'use strict';
const NS = 'http://www.w3.org/2000/svg';

/* ── dane ── */
const SPECIES = [
  { id: 'piwonie',  name: 'Piwonie',  sub: 'puszyste i romantyczne', price: 9 },
  { id: 'roze',     name: 'Róże',     sub: 'klasyka elegancji',      price: 7 },
  { id: 'lilie',    name: 'Lilie',    sub: 'pachnące i dostojne',    price: 8 },
  { id: 'tulipany', name: 'Tulipany', sub: 'radosne i wiosenne',     price: 4 },
];

const SIZES = [
  { id: 'S',   stems: 10, who: 'dla koleżanki',   heads: 7,  scale: 0.78, off: 0    },
  { id: 'M',   stems: 20, who: 'dla dziewczyny',  heads: 10, scale: 0.88, off: 0.05 },
  { id: 'L',   stems: 40, who: 'dla tej jedynej', heads: 13, scale: 1.00, off: 0.10 },
  { id: 'XL',  stems: 70, who: 'dla żony',        heads: 16, scale: 1.10, off: 0.15 },
  { id: 'XXL', stems: 80, who: 'DLA TEŚCIOWEJ',   heads: 19, scale: 1.18, off: 0.20 },
];
const SIZE_LETTER_COLORS = ['#ef8fa6', '#e2557e', '#c73a63', '#a52a50', '#8e2043'];

const COLORS = [
  { id: 'jasny',   name: 'jasny różowy', hex: '#f6c4d2' },
  { id: 'lososiowy', name: 'łososiowy',  hex: '#f4b57e' },
  { id: 'rozowy',  name: 'różowy',       hex: '#ee8f9e' },
  { id: 'fiolet',  name: 'fioletowy',    hex: '#e3d0f5' },
  { id: 'ciemny',  name: 'ciemny róż',   hex: '#d4407a' },
  { id: 'bordo',   name: 'bordowy',      hex: '#8e2043' },
];

const EXTRAS = [
  { id: 'bombonierka', emoji: '🍫', name: 'Bombonierka pralinek', desc: '12 belgijskich pralinek w pudełku-sercu', price: 39, hit: true },
  { id: 'wstazka',     emoji: '🎀', name: 'Wstążka premium',      desc: 'aksamit przeszywany złotą nicią',          price: 15 },
  { id: 'bilecik',     emoji: '💌', name: 'Bilecik z życzeniami', desc: 'Twoje słowa zapisane kaligrafią',          price: 9 },
];

const STEPS = [
  { id: 'gatunek',  label: 'GATUNEK' },
  { id: 'rozmiar',  label: 'ROZMIARY' },
  { id: 'kolor',    label: 'KOLOR' },
  { id: 'dodatki',  label: 'DODATKI' },
  { id: 'koszyk',   label: 'KOSZYK' },
];

const state = {
  step: 0,
  species: 'piwonie',
  size: 'M',
  color: 'jasny',
  extras: new Set(),
};

const $ = (s) => document.querySelector(s);
const byId = (arr, id) => arr.find((x) => x.id === id);

/* ── kolory pomocnicze ── */
function shade(hex, amt) { // amt -1..1 : miesza z czernią (ujemne) lub bielą (dodatnie)
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const ch = (v) => Math.round(v + (t - v) * p);
  const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(ch);
  return `rgb(${r},${g},${b})`;
}

/* ── generatory kształtów kwiatów ── */
function scallop(r, bumps, phase = 0) { // falbaniasty okrąg (płatki piwonii/róży)
  const P = (a) => `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  let d = `M ${P(phase)}`;
  for (let k = 1; k <= bumps; k++) {
    const mid = phase + ((k - 0.5) / bumps) * 2 * Math.PI;
    const end = phase + (k / bumps) * 2 * Math.PI;
    d += ` Q ${(r * 1.38 * Math.cos(mid)).toFixed(1)},${(r * 1.38 * Math.sin(mid)).toFixed(1)} ${P(end)}`;
  }
  return d + ' Z';
}

const ROSE_SPIRAL =
  'M2,-1 a3,3 0 0 1 -5,1 a5,5 0 0 1 9,-3 a8.5,8.5 0 0 1 -16,6 a12,12 0 0 1 21,-10 a16,16 0 0 1 -27,14';

function lilyPetals() {
  let out = '';
  for (let k = 0; k < 6; k++) {
    out += `<path class="petal-a" transform="rotate(${k * 60})"
      d="M0,-3 C -7,-11 -11,-23 0,-35 C 11,-23 7,-11 0,-3 Z"/>`;
  }
  return out;
}

/* markup jednego kwiatu; klasy petal-a/petal-b/lines służą do przemalowania */
const SYMBOLS = {
  piwonie: () => `
    <path class="petal-a" d="${scallop(26, 8)}"/>
    <path class="petal-b" d="${scallop(15, 6, 0.4)}" transform="translate(2,-3)"/>
    <path class="lines" fill="none" stroke-linecap="round"
      d="M-7,-4 q 5,-8 12,-3 M-3,6 q 6,-3 9,2 M-11,3 q 2,-7 7,-6"/>`,
  roze: () => `
    <path class="petal-a" d="${scallop(24, 6, 0.5)}"/>
    <path class="lines" fill="none" stroke-linecap="round" d="${ROSE_SPIRAL}"/>`,
  lilie: () => `
    ${lilyPetals()}
    <circle class="lines" r="4.5" fill="#e9b64f" stroke="none"/>
    <path class="lines" fill="none" stroke-linecap="round"
      d="M0,-6 l -3,-9 M0,-6 l 3,-9 M0,-6 l 0,-11"/>`,
  tulipany: () => `
    <path class="petal-a" transform="scale(1.15)"
      d="M0,24 C -16,20 -24,6 -21,-14 C -19,-26 -8,-27 -6,-13 C -5,-24 5,-24 6,-13 C 8,-27 19,-26 21,-14 C 24,6 16,20 0,24 Z"/>
    <path class="lines" fill="none" stroke-linecap="round" d="M-7,-12 C -8,2 -7,12 -5,20 M7,-12 C 8,2 7,12 5,20"/>`,
};

const LEAF = (rot) => `
  <path class="leaf" transform="rotate(${rot}) translate(0,4)" fill="#5d8f4c" stroke="#3f6b33"
    stroke-width="2" stroke-linejoin="round"
    d="M0,0 C -13,-5 -21,-17 -19,-31 C -5,-27 3,-14 0,0 Z"/>`;

/* ── rozmieszczenie kwiatów: spirala złotego kąta (stabilna po prefiksie) ── */
function layout(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + 0.7;
    const rad = 31 * Math.sqrt(i + 0.55);
    pts.push({
      x: Math.cos(a) * rad * 1.22,
      y: -102 + Math.sin(a) * rad * 0.8,
      rot: ((i * 47) % 25) - 12,
      s: 1.04 + ((i * 29) % 5) * 0.05,
    });
  }
  return pts;
}

/* ── warstwa kwiatów ── */
const flowersLayer = $('#flowers');
let flowerEls = [];

function flowerTransform(p, scale = 1) {
  return `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${p.rot}deg) scale(${(p.s * scale).toFixed(3)})`;
}

function paintMarkup(el) {
  const c = byId(COLORS, state.color).hex;
  el.querySelectorAll('.petal-a').forEach((p) => { p.setAttribute('fill', c); p.setAttribute('stroke', shade(c, -0.42)); p.setAttribute('stroke-width', '2.6'); p.setAttribute('stroke-linejoin', 'round'); });
  el.querySelectorAll('.petal-b').forEach((p) => { p.setAttribute('fill', shade(c, 0.22)); p.setAttribute('stroke', shade(c, -0.42)); p.setAttribute('stroke-width', '2.2'); p.setAttribute('stroke-linejoin', 'round'); });
  el.querySelectorAll('.lines').forEach((p) => { if (!p.getAttribute('fill') || p.getAttribute('fill') === 'none') p.setAttribute('stroke', shade(c, -0.45)); p.setAttribute('stroke-width', p.getAttribute('stroke-width') || '2.2'); });
}

function makeFlower(i, p) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'flower');
  g.innerHTML = (i % 2 ? LEAF(80 + (i * 67) % 200) : '') + SYMBOLS[state.species]();
  paintMarkup(g);
  // start: schowany nisko przy rożku, potem sprężynowy „wystrzał” na miejsce
  g.style.transform = `translate(${(p.x * 0.3).toFixed(1)}px,${(p.y * 0.3 - 20).toFixed(1)}px) rotate(${p.rot}deg) scale(0)`;
  g.style.opacity = '0';
  return g;
}

function popIn(el, p, delay) {
  el.getBoundingClientRect(); // wymuś zatwierdzenie stanu startowego, by transition ruszyła
  el.style.transitionDelay = `${delay}ms, ${delay}ms`;
  el.style.transform = flowerTransform(p);
  el.style.opacity = '1';
  setTimeout(() => { el.style.transitionDelay = '0ms'; }, delay + 850);
}

function popOut(el, delay) {
  el.style.transitionDelay = `${delay}ms, ${delay}ms`;
  el.style.transform += ' scale(0.01)';
  el.style.opacity = '0';
  setTimeout(() => el.remove(), delay + 700);
}

function setHeads(n) {
  const pts = layout(Math.max(n, flowerEls.length));
  while (flowerEls.length > n) popOut(flowerEls.pop(), (flowerEls.length - n) * 40);
  const firstNew = flowerEls.length;
  for (let i = firstNew; i < n; i++) {
    const el = makeFlower(i, pts[i]);
    flowersLayer.appendChild(el);
    flowerEls.push(el);
    popIn(el, pts[i], (i - firstNew) * 60);
  }
}

function rebuildSpecies() { // podmiana gatunku: stare znikają, nowe wyrastają
  const old = flowerEls;
  flowerEls = [];
  old.forEach((el, i) => popOut(el, i * 22));
  setTimeout(() => setHeads(byId(SIZES, state.size).heads), old.length * 22 + 160);
}

function recolor() {
  flowersLayer.querySelectorAll('.flower').forEach(paintMarkup);
}

function applySize() {
  const s = byId(SIZES, state.size);
  $('#bouquetScale').style.transform = `scale(${s.scale})`;
  setHeads(s.heads);
}

function applyExtras() {
  $('#addonChoc').classList.toggle('on', state.extras.has('bombonierka'));
  $('#addonCard').classList.toggle('on', state.extras.has('bilecik'));
  $('#bow').classList.toggle('premium', state.extras.has('wstazka'));
}

/* ── cena ── */
function calcPrice() {
  const sp = byId(SPECIES, state.species);
  const sz = byId(SIZES, state.size);
  const base = sp.price * sz.stems;
  const flowersNow = Math.round(base * (1 - sz.off));
  const extras = [...state.extras].reduce((a, id) => a + byId(EXTRAS, id).price, 0);
  return { base: base + extras, now: flowersNow + extras, save: base - flowersNow };
}

let shownPrice = 0;
function animatePrice(target) {
  const from = shownPrice, delta = target - from;
  if (!delta) return;
  const t0 = performance.now();
  (function tick(t) {
    const k = Math.min(1, (t - t0) / 450);
    shownPrice = Math.round(from + delta * (1 - Math.pow(1 - k, 3)));
    $('#priceNow').textContent = shownPrice;
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ── UI: kroki ── */
function renderSteps() {
  $('#steps').innerHTML = STEPS.map((s, i) => `
    <li class="${i === state.step ? 'active' : i < state.step ? 'done' : ''}" data-step="${i}">
      <span class="dot">${i < state.step ? '✓' : i + 1}</span>${s.label}
    </li>`).join('');
  $('#steps').querySelectorAll('li.done').forEach((li) =>
    li.addEventListener('click', () => go(+li.dataset.step)));
}

function speciesIcon(id) {
  const g = document.createElementNS(NS, 'g');
  g.innerHTML = SYMBOLS[id]();
  paintMarkup(g);
  return `<svg class="flower-ico" viewBox="-36 -40 72 78" aria-hidden="true">${g.innerHTML}</svg>`;
}

const CHECK = '<span class="check">✓</span>';

function renderPanel() {
  const step = STEPS[state.step].id;
  const sp = byId(SPECIES, state.species);
  const sz = byId(SIZES, state.size);
  let html = '';

  if (step === 'gatunek') {
    html = `<div class="pill">GATUNEK</div><div class="panel-sub">jakie kwiaty mówią to, co czujesz?</div>
      <div class="options">${SPECIES.map((s) => `
        <button class="opt ${s.id === state.species ? 'sel' : ''}" data-species="${s.id}">
          ${speciesIcon(s.id)}
          <span><span class="opt-name">${s.name}</span><br>
            <span class="opt-sub">${s.sub}</span><br>
            <span class="opt-price">od ${s.price * SIZES[0].stems} zł</span></span>
          ${CHECK}
        </button>`).join('')}
      </div>`;
  }

  if (step === 'rozmiar') {
    html = `<div class="pill">ROZMIARY</div><div class="panel-sub">im więcej kwiatów, tym niższa cena za sztukę</div>
      <div class="options">${SIZES.map((s, i) => {
        const price = Math.round(sp.price * s.stems * (1 - s.off));
        return `
        <button class="opt opt-size ${s.id === state.size ? 'sel' : ''}" data-size="${s.id}">
          <span class="size-letter" style="color:${SIZE_LETTER_COLORS[i]}">${s.id}</span>
          <span><span class="size-count">${s.stems} <b>szt</b></span><br>
            <span class="size-who">${s.who}</span></span>
          <span class="size-price">${price} zł${s.off ? `<br><small style="color:#4d7c3b">−${Math.round(s.off * 100)}%</small>` : ''}</span>
          ${CHECK}
        </button>`;
      }).join('')}
      </div>`;
  }

  if (step === 'kolor') {
    html = `<div class="pill">KOLOR</div><div class="panel-sub">wybierz odcień swoich ${sp.name.toLowerCase()}</div>
      <div class="options">${COLORS.map((c) => `
        <button class="opt opt-color ${c.id === state.color ? 'sel' : ''}" data-color="${c.id}">
          <span class="swatch" style="background:${c.hex}"></span>
          <span class="color-name">${c.name}</span>
          ${CHECK}
        </button>`).join('')}
      </div>`;
  }

  if (step === 'dodatki') {
    html = `<div class="pill">DODATKI</div><div class="panel-sub">drobiazg, który robi całe wrażenie</div>
      <div class="options">${EXTRAS.map((e) => `
        <button class="opt opt-extra ${state.extras.has(e.id) ? 'sel' : ''}" data-extra="${e.id}">
          <span class="extra-emoji">${e.emoji}</span>
          <span><span class="extra-name">${e.name}</span>${e.hit ? '<span class="badge">HIT ♥</span>' : ''}<br>
            <span class="extra-desc">${e.desc}</span></span>
          <span class="extra-price">+${e.price} zł</span>
          ${CHECK}
        </button>`).join('')}
      </div>
      <div class="upsell-note">💡 9 na 10 zamawiających dodaje bombonierkę — kwiaty cieszą oko, pralinki serce.</div>`;
  }

  if (step === 'koszyk') {
    const p = calcPrice();
    const col = byId(COLORS, state.color);
    html = `<div class="pill">KOSZYK</div><div class="panel-sub">wszystko gotowe — sprawdź i zamów</div>
      <div class="recap">
        <div class="recap-row"><span class="lbl">Bukiet</span><span>${sp.name} · ${sz.stems} szt (${sz.id})</span></div>
        <div class="recap-row"><span class="lbl">Kolor</span><span>${col.name}</span></div>
        <div class="recap-row"><span class="lbl">Kwiaty</span><span>${Math.round(sp.price * sz.stems * (1 - sz.off))} zł</span></div>
        ${[...state.extras].map((id) => { const e = byId(EXTRAS, id); return `<div class="recap-row"><span class="lbl">${e.emoji} ${e.name}</span><span>+${e.price} zł</span></div>`; }).join('')}
        ${p.save ? `<div class="recap-row"><span class="lbl">Twoja oszczędność</span><span style="color:#4d7c3b">−${p.save} zł</span></div>` : ''}
        <div class="recap-row total"><span>RAZEM</span><span>${p.now} zł</span></div>
      </div>
      <button class="btn-order" id="btnOrder">ZAMAWIAM I PŁACĘ <span class="arrow">→</span></button>`;
  }

  const panel = $('#panel');
  panel.innerHTML = html;

  panel.querySelectorAll('[data-species]').forEach((b) => b.addEventListener('click', () => {
    if (state.species === b.dataset.species) return;
    state.species = b.dataset.species;
    rebuildSpecies(); refresh();
  }));
  panel.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    if (state.size === b.dataset.size) return;
    state.size = b.dataset.size;
    applySize(); refresh();
  }));
  panel.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
    state.color = b.dataset.color;
    recolor(); refresh();
  }));
  panel.querySelectorAll('[data-extra]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.extra;
    state.extras.has(id) ? state.extras.delete(id) : state.extras.add(id);
    applyExtras(); refresh();
  }));
  const order = $('#btnOrder');
  if (order) order.addEventListener('click', showModal);
}

function renderSummary() {
  const sp = byId(SPECIES, state.species);
  const sz = byId(SIZES, state.size);
  const col = byId(COLORS, state.color);
  const p = calcPrice();
  $('#sumList').innerHTML = `
    <li><span class="k">Gatunek</span><span class="v">${sp.name}</span></li>
    <li><span class="k">Rozmiar</span><span class="v">${sz.id} · ${sz.stems} szt<small>${sz.who.toLowerCase()}</small></span></li>
    <li><span class="k">Kolor</span><span class="v">${col.name}</span></li>
    <li><span class="k">Dodatki</span><span class="v">${state.extras.size ? [...state.extras].map((id) => byId(EXTRAS, id).emoji).join(' ') : '—'}</span></li>`;
  $('#priceOld').textContent = p.save ? `${p.base} zł` : '';
  $('#priceSave').textContent = p.save ? `oszczędzasz ${p.save} zł!` : '';
  animatePrice(p.now);

  const last = state.step === STEPS.length - 1;
  $('#btnNext').style.display = last ? 'none' : '';
  $('#btnBack').classList.toggle('show', state.step > 0);
  $('#stageCaption').textContent =
    `${sz.stems} × ${sp.name.toLowerCase()} · ${col.name} · ${sz.who.toLowerCase()}`;
}

function refresh() { renderSteps(); renderPanel(); renderSummary(); }

function go(n) {
  if (n < 0 || n >= STEPS.length) return;
  const panel = $('#panel');
  panel.classList.add('swap-out');
  setTimeout(() => {
    state.step = n;
    refresh();
    panel.classList.remove('swap-out');
    if (window.matchMedia('(max-width:660px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 180);
}

$('#btnNext').addEventListener('click', () => go(state.step + 1));
$('#btnBack').addEventListener('click', () => go(state.step - 1));

/* ── modal ── */
function showModal() {
  const sp = byId(SPECIES, state.species);
  const sz = byId(SIZES, state.size);
  const p = calcPrice();
  $('#modalText').textContent =
    `Twój bukiet ${sz.stems} × ${sp.name.toLowerCase()} (${sz.id}) za ${p.now} zł jest już pakowany. Kurier zapuka w 24 h. 💐`;
  $('#modal').hidden = false;
}
$('#btnCloseModal').addEventListener('click', () => { $('#modal').hidden = true; });
$('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) $('#modal').hidden = true; });

/* ── start (opcjonalna konfiguracja z adresu URL) ── */
const q = new URLSearchParams(location.search);
if (byId(SPECIES, q.get('gatunek'))) state.species = q.get('gatunek');
if (byId(SIZES, q.get('rozmiar'))) state.size = q.get('rozmiar');
if (byId(COLORS, q.get('kolor'))) state.color = q.get('kolor');
(q.get('dodatki') || '').split(',').forEach((id) => { if (byId(EXTRAS, id)) state.extras.add(id); });
const krok = parseInt(q.get('krok'), 10);
if (krok >= 1 && krok <= STEPS.length) state.step = krok - 1;

applySize();
applyExtras();
refresh();
