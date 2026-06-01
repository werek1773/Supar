// ── DOM refs ──────────────────────────────────────────────────────────────
const pickupInput      = document.getElementById('pickup');
const dropoffInput     = document.getElementById('dropoff');
const pickupSuggestions  = document.getElementById('pickup-suggestions');
const dropoffSuggestions = document.getElementById('dropoff-suggestions');
const swapBtn          = document.getElementById('swap-btn');
const compareBtn       = document.getElementById('compare-btn');
const btnText          = document.getElementById('btn-text');
const btnSpinner       = document.getElementById('btn-spinner');
const passengersSelect = document.getElementById('passengers');
const timeSelect       = document.getElementById('time-of-day');
const resultsSection   = document.getElementById('results-section');
const resultsGrid      = document.getElementById('results-grid');
const routeSummary     = document.getElementById('route-summary');
const errorSection     = document.getElementById('error-section');
const errorMsg         = document.getElementById('error-msg');

// ── State ─────────────────────────────────────────────────────────────────
let pickupCoords  = null; // { lat, lon, display }
let dropoffCoords = null;

// ── Geocoding via Nominatim ───────────────────────────────────────────────
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const debounceTimers = {};

function debounce(key, fn, ms = 380) {
  clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, ms);
}

async function geocode(query) {
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=pl`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } });
  if (!res.ok) throw new Error('Błąd geokodowania');
  return res.json();
}

function buildSuggestionHTML(item) {
  const address = item.address;
  let name = item.name || address.road || address.pedestrian || '';
  const city = address.city || address.town || address.village || address.county || '';
  const secondary = [address.road, address.house_number, city].filter(Boolean).join(', ');

  const div = document.createElement('div');
  div.className = 'suggestion-item';
  div.innerHTML = `
    <span class="icon">📍</span>
    <div>
      <div class="name">${escapeHTML(name || secondary)}</div>
      ${name ? `<div class="address">${escapeHTML(secondary)}</div>` : ''}
    </div>
  `;
  return div;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function attachAutocomplete(input, suggestionsEl, onSelect) {
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val.length < 3) { suggestionsEl.innerHTML = ''; return; }
    debounce(input.id, async () => {
      try {
        const results = await geocode(val);
        suggestionsEl.innerHTML = '';
        results.slice(0, 5).forEach((item) => {
          const el = buildSuggestionHTML(item);
          el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const displayName = item.display_name.split(',').slice(0, 3).join(',');
            input.value = displayName;
            onSelect({ lat: parseFloat(item.lat), lon: parseFloat(item.lon), display: displayName });
            suggestionsEl.innerHTML = '';
          });
          suggestionsEl.appendChild(el);
        });
      } catch { suggestionsEl.innerHTML = ''; }
    }, 380);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { suggestionsEl.innerHTML = ''; }, 200);
  });
}

attachAutocomplete(pickupInput,  pickupSuggestions,  (c) => { pickupCoords  = c; });
attachAutocomplete(dropoffInput, dropoffSuggestions, (c) => { dropoffCoords = c; });

// ── Swap ──────────────────────────────────────────────────────────────────
swapBtn.addEventListener('click', () => {
  [pickupInput.value, dropoffInput.value] = [dropoffInput.value, pickupInput.value];
  [pickupCoords, dropoffCoords] = [dropoffCoords, pickupCoords];
});

// ── Distance / duration helpers ───────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

// Road distance ≈ straight-line × detour factor (typical urban factor ~1.35)
function roadDistance(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1.35;
}

// Average speed by time-of-day (km/h)
const AVG_SPEED = { normal: 28, peak: 18, night: 38 };

function estimateDuration(distKm, timeOfDay) {
  return (distKm / AVG_SPEED[timeOfDay]) * 60; // minutes
}

// ── Rendering ─────────────────────────────────────────────────────────────
function fmt(n) { return n.toFixed(2).replace('.', ',') + ' zł'; }
function fmtMin(m) {
  const mins = Math.round(m);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function renderResults(comparison, distKm, durationMin, pickup, dropoff) {
  // Find global cheapest tier price
  const allPrices = comparison.flatMap((p) => p.tiers.map((t) => t.price));
  const globalMin = Math.min(...allPrices);

  // Route summary
  routeSummary.innerHTML = `
    <div class="route-text">
      <strong>${escapeHTML(pickup.split(',')[0])}</strong>
      &rarr;
      <strong>${escapeHTML(dropoff.split(',')[0])}</strong>
    </div>
    <div class="route-meta">
      <div class="meta-item">
        <span class="meta-value">${distKm.toFixed(1)} km</span>
        <span class="meta-label">Dystans</span>
      </div>
      <div class="meta-item">
        <span class="meta-value">${fmtMin(durationMin)}</span>
        <span class="meta-label">Szac. czas</span>
      </div>
    </div>
  `;

  // Provider cards
  const sorted = [...comparison].sort((a, b) => a.minPrice - b.minPrice);

  resultsGrid.innerHTML = '';
  sorted.forEach((provider) => {
    const isCheapestProvider = provider.minPrice === Math.min(...sorted.map((p) => p.minPrice));
    const card = document.createElement('div');
    card.className = 'provider-card' + (isCheapestProvider ? ' cheapest' : '');

    const tiersHTML = provider.tiers.length
      ? provider.tiers.map((tier) => {
          const isCheapestTier = Math.abs(tier.price - globalMin) < 0.01;
          return `
            <div class="tier-item ${isCheapestTier ? 'cheapest-tier' : ''}">
              <div class="tier-info">
                <span class="tier-icon">${tier.icon}</span>
                <div class="tier-details">
                  <div class="tier-name">${escapeHTML(tier.name)}</div>
                  <div class="tier-seats">do ${tier.seats} osób</div>
                </div>
              </div>
              <div class="tier-price">
                <div class="price-value">${fmt(tier.price)}</div>
                <div class="price-time">${fmtMin(durationMin)}</div>
              </div>
            </div>
          `;
        }).join('')
      : `<p class="unavailable-note">Brak dostępnych opcji dla ${passengersSelect.value} pasażerów.</p>`;

    card.innerHTML = `
      <div class="card-header">
        <div class="provider-brand">
          <div class="provider-logo ${provider.logoClass}">${escapeHTML(provider.logoText)}</div>
          <span class="provider-name">${escapeHTML(provider.name)}</span>
        </div>
        ${isCheapestProvider ? '<span class="cheapest-badge">Najtańszy</span>' : ''}
      </div>
      <div class="tier-list">${tiersHTML}</div>
    `;

    resultsGrid.appendChild(card);
  });

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Compare action ────────────────────────────────────────────────────────
compareBtn.addEventListener('click', async () => {
  hideError();
  resultsSection.classList.add('hidden');

  // If coords not set but text present, try to geocode on-the-fly
  if (!pickupCoords && pickupInput.value.trim().length > 2) {
    setLoading(true, 'Szukam lokalizacji…');
    try {
      const results = await geocode(pickupInput.value.trim());
      if (results.length) {
        const item = results[0];
        pickupCoords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon), display: item.display_name };
        pickupInput.value = item.display_name.split(',').slice(0, 3).join(',');
      }
    } catch { /* will fail below */ }
  }

  if (!dropoffCoords && dropoffInput.value.trim().length > 2) {
    try {
      const results = await geocode(dropoffInput.value.trim());
      if (results.length) {
        const item = results[0];
        dropoffCoords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon), display: item.display_name };
        dropoffInput.value = item.display_name.split(',').slice(0, 3).join(',');
      }
    } catch { /* will fail below */ }
  }

  setLoading(false);

  if (!pickupCoords) { showError('Nie znaleziono miejsca startowego. Spróbuj wpisać dokładniejszy adres.'); return; }
  if (!dropoffCoords) { showError('Nie znaleziono miejsca docelowego. Spróbuj wpisać dokładniejszy adres.'); return; }

  const distKm = roadDistance(pickupCoords.lat, pickupCoords.lon, dropoffCoords.lat, dropoffCoords.lon);
  if (distKm < 0.1) { showError('Miejsca startowe i docelowe są zbyt blisko siebie lub identyczne.'); return; }

  const timeOfDay   = timeSelect.value;
  const passengers  = parseInt(passengersSelect.value, 10);
  const durationMin = estimateDuration(distKm, timeOfDay);

  const comparison = buildComparison(distKm, durationMin, timeOfDay, passengers);
  renderResults(comparison, distKm, durationMin, pickupInput.value, dropoffInput.value);
});

// ── Helpers ───────────────────────────────────────────────────────────────
function setLoading(on, label = 'Porównaj ceny') {
  compareBtn.disabled = on;
  btnText.textContent = on ? label : 'Porównaj ceny';
  btnSpinner.classList.toggle('hidden', !on);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorSection.classList.remove('hidden');
}

function hideError() {
  errorSection.classList.add('hidden');
}

// Allow pressing Enter in inputs
[pickupInput, dropoffInput].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') compareBtn.click();
  });
});
