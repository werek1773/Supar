'use strict';

const CFG = {
  OMDB_KEY: '7e9a7b41',
  OMDB:     'https://www.omdbapi.com/',

  // Hit-sphere radii (match visual card/pill size in world units)
  RADIUS: { movie: 38, actor: 22, genre: 22, theme: 22 },

  // Colors (subtle, near-white tints)
  COLOR: {
    movie: { hex: '#a8d8ff', int: 0xa8d8ff },
    actor: { hex: '#d4b4ff', int: 0xd4b4ff },
    genre: { hex: '#a8ffcc', int: 0xa8ffcc },
    theme: { hex: '#ffd4a8', int: 0xffd4a8 },
  },

  // Layout
  SPREAD: 170,
  MIN_DIST: 60,

  // Animation
  AUTO_ROT_SPEED: 0.0022,
  FLOAT_SPEED: 0.38,
  FLOAT_AMP: 3.2,

  // Recommendation
  REC_DELAY: 1800,
};
