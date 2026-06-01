// Pricing data based on approximate Polish market rates (PLN)
// Structure: baseFare + (pricePerKm * km) + (pricePerMin * min)
// All prices include VAT

const PROVIDERS = [
  {
    id: 'uber',
    name: 'Uber',
    logoClass: 'uber',
    logoText: 'UBER',
    tiers: [
      {
        id: 'uberx',
        name: 'UberX',
        icon: '🚗',
        seats: 4,
        baseFare: 3.99,
        perKm: 1.79,
        perMin: 0.39,
        minFare: 8.00,
        // xl not included — separate tier
      },
      {
        id: 'uber-comfort',
        name: 'Comfort',
        icon: '🚙',
        seats: 4,
        baseFare: 4.99,
        perKm: 2.39,
        perMin: 0.49,
        minFare: 10.00,
      },
      {
        id: 'uber-xl',
        name: 'UberXL',
        icon: '🚐',
        seats: 6,
        baseFare: 5.99,
        perKm: 2.89,
        perMin: 0.59,
        minFare: 12.00,
      },
    ],
  },
  {
    id: 'bolt',
    name: 'Bolt',
    logoClass: 'bolt',
    logoText: '⚡',
    tiers: [
      {
        id: 'bolt-standard',
        name: 'Standard',
        icon: '🚗',
        seats: 4,
        baseFare: 2.99,
        perKm: 1.59,
        perMin: 0.35,
        minFare: 6.50,
      },
      {
        id: 'bolt-comfort',
        name: 'Comfort',
        icon: '🚙',
        seats: 4,
        baseFare: 3.99,
        perKm: 1.99,
        perMin: 0.45,
        minFare: 9.00,
      },
      {
        id: 'bolt-xl',
        name: 'XL',
        icon: '🚐',
        seats: 6,
        baseFare: 4.99,
        perKm: 2.39,
        perMin: 0.55,
        minFare: 11.00,
      },
    ],
  },
  {
    id: 'freenow',
    name: 'FreeNow',
    logoClass: 'freenow',
    logoText: 'FREE\nNOW',
    tiers: [
      {
        id: 'fn-eco',
        name: 'Eco',
        icon: '🌿',
        seats: 4,
        baseFare: 3.49,
        perKm: 1.69,
        perMin: 0.37,
        minFare: 7.50,
      },
      {
        id: 'fn-comfort',
        name: 'Comfort',
        icon: '🚙',
        seats: 4,
        baseFare: 4.49,
        perKm: 2.19,
        perMin: 0.47,
        minFare: 10.00,
      },
      {
        id: 'fn-business',
        name: 'Business',
        icon: '💼',
        seats: 4,
        baseFare: 7.99,
        perKm: 3.49,
        perMin: 0.69,
        minFare: 15.00,
      },
    ],
  },
];

// Surge multipliers by time-of-day
const SURGE = {
  normal: 1.0,
  peak: 1.25,   // rush hour
  night: 1.15,  // night tariff
};

/**
 * Calculate price for a single tier.
 * @param {object} tier
 * @param {number} distanceKm - road distance
 * @param {number} durationMin - estimated drive time in minutes
 * @param {string} timeOfDay - 'normal' | 'peak' | 'night'
 * @param {number} passengers
 * @returns {number} price in PLN
 */
function calcTierPrice(tier, distanceKm, durationMin, timeOfDay, passengers) {
  const surge = SURGE[timeOfDay] ?? 1.0;
  const raw = tier.baseFare + tier.perKm * distanceKm + tier.perMin * durationMin;
  const surged = raw * surge;
  return Math.max(surged, tier.minFare);
}

/**
 * Returns whether a tier supports the given passenger count.
 */
function tierSupportsPassengers(tier, passengers) {
  return tier.seats >= passengers;
}

/**
 * Build the full comparison result for all providers.
 */
function buildComparison(distanceKm, durationMin, timeOfDay, passengers) {
  passengers = parseInt(passengers, 10) || 1;

  return PROVIDERS.map((provider) => {
    const tiers = provider.tiers
      .filter((t) => tierSupportsPassengers(t, passengers))
      .map((t) => ({
        ...t,
        price: calcTierPrice(t, distanceKm, durationMin, timeOfDay, passengers),
      }));

    const minPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : Infinity;

    return { ...provider, tiers, minPrice };
  });
}
