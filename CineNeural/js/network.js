'use strict';

// ════════════════════════════════════════════════════════════════
// NETWORK.JS  —  Pure 2D force-directed graph
// HTML poster cards + SVG connection lines, no Three.js
// ════════════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────────────
let nodes         = [];
let conns         = [];
let focalNode     = null;
let connectSource = null;

// ── DOM refs ──────────────────────────────────────────────────────
let _labelsEl;          // #labels — contains all node HTML elements
let _svgEl;             // SVG overlay for edge lines
const _NS = 'http://www.w3.org/2000/svg';

// ── Physics constants ─────────────────────────────────────────────
const PHY = {
  REPEL:  7000,   // repulsion constant (all pairs)
  SPRING: 0.020,  // spring constant along edges
  CENTER: 0.10,   // pull focal node toward screen centre
  DAMP:   0.80,   // velocity damping per frame
  MAX_V:  14,     // velocity cap
};

// Ideal resting edge length by node-type pair
const EDGE_LEN = {
  'movie-movie':  240, 'movie-actor':  165,
  'movie-genre':  145, 'movie-theme':  145,
  'actor-actor':  120, 'genre-genre':  100,
  'theme-theme':  100, 'actor-genre':  110,
  'actor-theme':  110, 'genre-theme':  100,
};
function _edgeLen(ta, tb) {
  return EDGE_LEN[`${ta}-${tb}`] || EDGE_LEN[`${tb}-${ta}`] || 155;
}

// ── Tiny helpers ──────────────────────────────────────────────────
function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _stars(r) {
  const f = Math.max(0, Math.min(5, Math.round(Number(r) / 2)));
  return '★'.repeat(f) + '☆'.repeat(5 - f);
}
function _lerp(a, b, t) { return a + (b - a) * t; }

// ════════════════════════════════════════════════════════════════
// NODE CLASS
// ════════════════════════════════════════════════════════════════
class Node2D {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    this.id   = `${type}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

    // Place near centre, small random jitter
    const cx = innerWidth / 2, cy = innerHeight / 2;
    this.x  = cx + (Math.random() - 0.5) * 100;
    this.y  = cy + (Math.random() - 0.5) * 100;
    this.vx = 0;
    this.vy = 0;

    // Smooth visual state (animated each frame)
    this._sc  = 1;    // current scale
    this._op  = 1;    // current opacity
    this._hov = false;

    this._buildEl();
  }

  get name() {
    if (this.type === 'movie') return this.data.title || '';
    return typeof this.data === 'string' ? this.data : (this.data.name || '');
  }

  // ── Build the HTML element ─────────────────────────────────────
  _buildEl() {
    this.el = document.createElement('div');

    if (this.type === 'movie') {
      const m = this.data;
      const poster = m.poster
        ? `<img class="node-poster" src="${_esc(m.poster)}" alt="" loading="lazy">`
        : `<div class="node-poster-blank"></div>`;
      const yr    = m.year ? String(m.year) : '';
      const stars = m.imdbRating
        ? ` <span class="nc-stars">${_stars(m.imdbRating)}</span>`
        : '';
      this.el.className = 'node-card';
      this.el.innerHTML = `
        ${poster}
        <div class="node-card-footer">
          <div class="node-card-title">${_esc(m.title || '')}</div>
          <div class="node-card-year">${_esc(yr)}${stars}</div>
        </div>`;
    } else {
      this.el.className = `node-pill node-pill-${this.type}`;
      const label = this.name;
      this.el.textContent = label.length > 26 ? label.slice(0, 24) + '…' : label;
    }

    // Inline CSS — overrides stylesheet pointer-events:none on cards/pills
    this.el.style.cssText =
      'position:absolute;cursor:pointer;pointer-events:auto;' +
      'will-change:transform,opacity;user-select:none;-webkit-user-select:none;';

    this.el.addEventListener('click',    e => { e.stopPropagation(); _onNodeClick(this); });
    this.el.addEventListener('dblclick', e => { e.stopPropagation(); e.preventDefault(); removeNode(this); });
    this.el.addEventListener('mouseenter', () => { this._hov = true;  });
    this.el.addEventListener('mouseleave', () => { this._hov = false; });

    _labelsEl.appendChild(this.el);
  }

  // ── Called every animation frame ───────────────────────────────
  tick() {
    // Target scale
    let ts = 1.0;
    if      (this === focalNode)     ts = this.type === 'movie' ? 1.52 : 1.22;
    else if (this === connectSource) ts = 1.12;
    else if (this._hov)              ts = 1.07;

    // Target opacity
    let to = 1.0;
    if (focalNode && this !== focalNode) {
      const linked = conns.some(c =>
        (c.a === this && c.b === focalNode) ||
        (c.b === this && c.a === focalNode));
      to = linked ? 0.88 : 0.14;
    }

    // Smooth lerp toward targets
    this._sc = _lerp(this._sc, ts, 0.11);
    this._op = _lerp(this._op, to, 0.09);

    this.el.style.left      = this.x + 'px';
    this.el.style.top       = this.y + 'px';
    this.el.style.transform = `translate(-50%,-50%) scale(${this._sc.toFixed(4)})`;
    this.el.style.opacity   = this._op.toFixed(4);
    this.el.style.zIndex    = this === focalNode ? '10' : this._hov ? '8' : '5';

    this.el.classList.toggle('focal',      this === focalNode);
    this.el.classList.toggle('hovered',    this._hov && this !== focalNode);
    this.el.classList.toggle('connecting', this === connectSource);
  }

  destroy() { this.el.remove(); }
}

// ════════════════════════════════════════════════════════════════
// CONNECTION CLASS
// ════════════════════════════════════════════════════════════════
class Conn2D {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.line = document.createElementNS(_NS, 'line');
    this.line.setAttribute('stroke-linecap', 'round');
    _svgEl.appendChild(this.line);
    this.tick();
  }

  tick() {
    const { a, b } = this;
    this.line.setAttribute('x1', a.x.toFixed(1));
    this.line.setAttribute('y1', a.y.toFixed(1));
    this.line.setAttribute('x2', b.x.toFixed(1));
    this.line.setAttribute('y2', b.y.toFixed(1));

    const active = focalNode && (a === focalNode || b === focalNode);
    this.line.setAttribute('stroke',       active ? 'rgba(168,216,255,0.42)' : 'rgba(255,255,255,0.09)');
    this.line.setAttribute('stroke-width', active ? '1.6' : '1');
    this.line.setAttribute('opacity',      active ? '1'   : '0.8');
  }

  destroy() { this.line.remove(); }
}

// ════════════════════════════════════════════════════════════════
// PHYSICS SIMULATION
// ════════════════════════════════════════════════════════════════
function _simulate() {
  const cx = innerWidth / 2, cy = innerHeight / 2;

  for (const n of nodes) {
    let fx = 0, fy = 0;

    // Repulsion from every other node
    for (const m of nodes) {
      if (m === n) continue;
      const dx = n.x - m.x, dy = n.y - m.y;
      const d2 = dx * dx + dy * dy + 0.1;
      const d  = Math.sqrt(d2);
      const f  = PHY.REPEL / d2;
      fx += (dx / d) * f;
      fy += (dy / d) * f;
    }

    // Spring attraction along connections
    for (const c of conns) {
      const other = c.a === n ? c.b : c.b === n ? c.a : null;
      if (!other) continue;
      const dx  = other.x - n.x, dy = other.y - n.y;
      const d   = Math.sqrt(dx * dx + dy * dy) || 1;
      const len = _edgeLen(n.type, other.type);
      const str = d - len;   // positive = too far, negative = too close
      fx += (dx / d) * str * PHY.SPRING;
      fy += (dy / d) * str * PHY.SPRING;
    }

    // Focal node pulled toward screen centre
    if (n === focalNode) {
      fx += (cx - n.x) * PHY.CENTER;
      fy += (cy - n.y) * PHY.CENTER;
    }

    // Unconnected non-focal nodes drift gently to perimeter
    if (focalNode && n !== focalNode) {
      const linked = conns.some(c =>
        (c.a === n && c.b === focalNode) ||
        (c.b === n && c.a === focalNode));
      if (!linked) {
        const dx = n.x - cx, dy = n.y - cy;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / d) * 0.5;
        fy += (dy / d) * 0.5;
      }
    }

    // Soft boundary — nodes bounce off screen edges
    const pad = 90;
    if (n.x < pad)               fx += (pad - n.x) * 0.30;
    if (n.x > innerWidth  - pad) fx -= (n.x - (innerWidth  - pad)) * 0.30;
    if (n.y < pad)               fy += (pad - n.y) * 0.30;
    if (n.y > innerHeight - pad) fy -= (n.y - (innerHeight - pad)) * 0.30;

    // Integrate velocity
    n.vx = (n.vx + fx) * PHY.DAMP;
    n.vy = (n.vy + fy) * PHY.DAMP;

    // Velocity cap
    const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
    if (spd > PHY.MAX_V) { n.vx *= PHY.MAX_V / spd; n.vy *= PHY.MAX_V / spd; }

    n.x += n.vx;
    n.y += n.vy;
  }
}

// ════════════════════════════════════════════════════════════════
// ANIMATION LOOP
// ════════════════════════════════════════════════════════════════
function _loop() {
  requestAnimationFrame(_loop);
  _simulate();
  for (const n of nodes) n.tick();
  for (const c of conns) c.tick();
}

// ════════════════════════════════════════════════════════════════
// CLICK HANDLING
// ════════════════════════════════════════════════════════════════
function _onNodeClick(node) {
  // In connection mode: complete the connection
  if (connectSource) {
    if (connectSource !== node) connectNodes(connectSource, node);
    connectSource = null;
    return;
  }

  // Clicking the current focal movie: open panel
  if (node === focalNode) {
    if (node.type === 'movie' && typeof openPanel === 'function') {
      openPanel(node.data, null, null);
    }
    return;
  }

  // Clicking a different movie: switch focal
  if (node.type === 'movie') {
    setFocalNode(node);
    if (typeof openPanel === 'function') openPanel(node.data, null, null);
    return;
  }

  // Clicking a non-movie node: mark as connection source
  connectSource = node;
}

// ════════════════════════════════════════════════════════════════
// PUBLIC API  (used by app.js and trending.js)
// ════════════════════════════════════════════════════════════════

function getNodes() { return nodes; }
function getConns() { return conns; }

function setFocalNode(node) {
  focalNode = node || null;
}

function addNode(type, data) {
  // Dedup check
  if (type === 'movie') {
    const id = data.imdbId || data.title;
    if (nodes.some(n => n.type === 'movie' &&
        (n.data.imdbId === id || n.data.title === id))) {
      if (typeof showToast === 'function') showToast(`${data.title || 'Movie'} is already in the network`);
      return false;
    }
  } else {
    const name = (typeof data === 'string' ? data : (data.name || '')).toLowerCase();
    if (nodes.some(n => n.type === type && n.name.toLowerCase() === name)) return false;
  }

  const node = new Node2D(type, data);
  nodes.push(node);

  if (type === 'movie') {
    setFocalNode(node);
    if (typeof openPanel === 'function') openPanel(node.data, null, null);
  }

  if (typeof onNetworkChange === 'function') onNetworkChange();
  return node;
}

function removeNode(node) {
  // Remove all edges touching this node
  const dead = conns.filter(c => c.a === node || c.b === node);
  dead.forEach(c => { c.destroy(); conns.splice(conns.indexOf(c), 1); });

  node.destroy();
  nodes.splice(nodes.indexOf(node), 1);

  if (focalNode    === node) setFocalNode(nodes.find(n => n.type === 'movie') || null);
  if (connectSource === node) connectSource = null;

  if (typeof onNetworkChange === 'function') onNetworkChange();
}

function connectNodes(a, b) {
  if (conns.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a))) {
    if (typeof showToast === 'function') showToast('Already connected');
    return false;
  }
  const conn = new Conn2D(a, b);
  conns.push(conn);
  if (typeof onNetworkChange === 'function') onNetworkChange();
  return conn;
}

// ════════════════════════════════════════════════════════════════
// BACKGROUND — subtle floating star-field  (replaces Three.js scene)
// ════════════════════════════════════════════════════════════════
function _initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const STARS = Array.from({ length: 65 }, () => ({
    x:  Math.random() * innerWidth,
    y:  Math.random() * innerHeight,
    r:  Math.random() * 1.2 + 0.2,
    vx: (Math.random() - 0.5) * 0.11,
    vy: (Math.random() - 0.5) * 0.11,
    a:  Math.random() * 0.32 + 0.04,
  }));

  (function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of STARS) {
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x += canvas.width;
      if (s.x > canvas.width)  s.x -= canvas.width;
      if (s.y < 0) s.y += canvas.height;
      if (s.y > canvas.height) s.y -= canvas.height;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    }
    requestAnimationFrame(drawFrame);
  })();
}

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
function initNetwork() {
  _labelsEl = document.getElementById('labels');

  // SVG overlay — inserted just before #labels
  _svgEl = document.createElementNS(_NS, 'svg');
  _svgEl.setAttribute('aria-hidden', 'true');
  _svgEl.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:78;overflow:visible;';
  _labelsEl.parentNode.insertBefore(_svgEl, _labelsEl);

  // Clicking the bare background cancels connection mode
  const mountEl = document.getElementById('mount');
  if (mountEl) {
    mountEl.addEventListener('click', () => {
      if (connectSource) connectSource = null;
    });
  }

  _initBackground();
  _loop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNetwork);
} else {
  initNetwork();
}
