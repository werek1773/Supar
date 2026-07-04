/* ─── MójBukiet.com — konfigurator bukietów (wersja foto) ───────── */
'use strict';

/* ── dane ── */
const SPECIES = [
  { id: 'piwonie',  name: 'Piwonie',  sub: 'puszyste i romantyczne', price: 9 },
  { id: 'roze',     name: 'Róże',     sub: 'klasyka elegancji',      price: 7 },
  { id: 'lilie',    name: 'Lilie',    sub: 'pachnące i dostojne',    price: 8 },
  { id: 'tulipany', name: 'Tulipany', sub: 'radosne i wiosenne',     price: 4 },
];

const SIZES = [
  { id: 'S',   stems: 10, who: 'dla koleżanki',   scale: 0.82, off: 0    },
  { id: 'M',   stems: 20, who: 'dla dziewczyny',  scale: 0.90, off: 0.05 },
  { id: 'L',   stems: 40, who: 'dla tej jedynej', scale: 0.97, off: 0.10 },
  { id: 'XL',  stems: 70, who: 'dla żony',        scale: 1.03, off: 0.15 },
  { id: 'XXL', stems: 80, who: 'DLA TEŚCIOWEJ',   scale: 1.09, off: 0.20 },
];
const SIZE_LETTER_COLORS = ['#ef8fa6', '#e2557e', '#c73a63', '#a52a50', '#8e2043'];

const COLORS = [
  { id: 'jasny',     name: 'jasny różowy', hex: '#f6c4d2' },
  { id: 'lososiowy', name: 'łososiowy',    hex: '#f4b57e' },
  { id: 'rozowy',    name: 'różowy',       hex: '#ee8f9e' },
  { id: 'fiolet',    name: 'fioletowy',    hex: '#cba8ec' },
  { id: 'ciemny',    name: 'ciemny róż',   hex: '#d4407a' },
  { id: 'bordo',     name: 'bordowy',      hex: '#8e2043' },
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

/* źródła zdjęć — build Artifactu podmienia ścieżki na data URI */
const PHOTO_SRC = {
  piwonie: 'img/piwonie.jpg',
  roze: 'img/roze.jpg',
  lilie: 'img/lilie.jpg',
  tulipany: 'img/tulipany.jpg',
};

const state = {
  step: 0,
  species: 'piwonie',
  size: 'M',
  color: 'jasny',
  extras: new Set(),
};

const $ = (s) => document.querySelector(s);
const byId = (arr, id) => arr.find((x) => x.id === id);

/* ── konwersje kolorów ── */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgbToHsl(n >> 16 & 255, n >> 8 & 255, n & 255);
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

/* ── silnik foto: przebarwianie kwiatów na canvasie ── */
const REF = hexToHsl(COLORS[0].hex); // "jasny różowy" = kolor neutralny dla zdjęć bazowych

function greenFade(h) { // 0 dla zieleni (liście, łodygi), 1 poza nią, miękkie brzegi
  if (h <= 52 || h >= 185) return 1;
  if (h < 62) return (62 - h) / 10;
  if (h > 175) return (h - 175) / 10;
  return 0;
}

function recolorPixels(ctx, w, h, hex) {
  const [tH, tS, tL] = hexToHsl(hex);
  const sFac = Math.min(1.6, Math.max(0.3, tS / REF[1]));
  const lFac = Math.min(1.25, Math.max(0.45, tL / REF[2]));
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (ss < 0.16) continue;               // biele, szarości, wazon, papier
    const fade = greenFade(hh);
    if (fade === 0) continue;              // zieleń zostaje zielenią
    const t = Math.min(1, (ss - 0.16) / 0.15) * fade;
    const [r, g, b] = hslToRgb(tH, Math.min(1, ss * sFac), Math.min(0.97, ll * lFac));
    d[i]     += (r - d[i]) * t;
    d[i + 1] += (g - d[i + 1]) * t;
    d[i + 2] += (b - d[i + 2]) * t;
  }
  ctx.putImageData(id, 0, 0);
}

const imgPromises = {};
function loadImg(sp) {
  if (!imgPromises[sp]) {
    imgPromises[sp] = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = PHOTO_SRC[sp];
    });
  }
  return imgPromises[sp];
}

const tintCache = new Map();
async function tintedCanvas(sp, colorId) {
  const key = `${sp}|${colorId}`;
  if (tintCache.has(key)) return tintCache.get(key);
  const img = await loadImg(sp);
  const c = document.createElement('canvas');
  c.width = 660; c.height = 825;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, c.width, c.height);
  try {
    recolorPixels(ctx, c.width, c.height, byId(COLORS, colorId).hex);
  } catch {
    // canvas "tainted" (podgląd z file://) — pokaż zdjęcie bez przebarwienia
  }
  tintCache.set(key, c);
  return c;
}

/* crossfade między dwiema warstwami canvas */
let activeLayer = 0, showToken = 0;
async function showPhoto() {
  const my = ++showToken;
  let src;
  try {
    src = await tintedCanvas(state.species, state.color);
  } catch {
    return; // brak zdjęcia — zostaje tło karty
  }
  if (my !== showToken) return;
  const layers = [$('#layerA'), $('#layerB')];
  const next = layers[1 - activeLayer], cur = layers[activeLayer];
  next.width = src.width; next.height = src.height;
  next.getContext('2d').drawImage(src, 0, 0);
  next.getBoundingClientRect(); // zatwierdź stan startowy przejścia
  next.classList.add('show');
  cur.classList.remove('show');
  activeLayer = 1 - activeLayer;
}

/* ── rozmiar: sprężyste skalowanie karty + chip z liczbą ── */
function applySize() {
  const s = byId(SIZES, state.size);
  $('#photoCard').style.transform = `scale(${s.scale})`;
  const chip = $('#sizeChip');
  chip.textContent = `${s.stems} szt · ${s.id}`;
  chip.classList.remove('pop');
  chip.getBoundingClientRect();
  chip.classList.add('pop');
}

function applyExtras() {
  $('#badgeChoc').classList.toggle('on', state.extras.has('bombonierka'));
  $('#badgeRibbon').classList.toggle('on', state.extras.has('wstazka'));
  $('#badgeCard').classList.toggle('on', state.extras.has('bilecik'));
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
          <span class="opt-thumb" style="background-image:url('${PHOTO_SRC[s.id]}')"></span>
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
    showPhoto(); refresh();
  }));
  panel.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    if (state.size === b.dataset.size) return;
    state.size = b.dataset.size;
    applySize(); refresh();
  }));
  panel.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
    state.color = b.dataset.color;
    showPhoto(); refresh();
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

showPhoto();
applySize();
applyExtras();
refresh();

/* dogrzej cache pozostałych gatunków w tle */
setTimeout(() => SPECIES.forEach((s) => loadImg(s.id).catch(() => {})), 1500);
