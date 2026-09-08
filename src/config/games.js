/**
 * SpicyCrust — Configuración centralizada de URLs de juegos.
 * Lee desde variables de entorno de Vite (import.meta.env).
 * En dev: .env (localhost:5174, etc.)
 * En prod: .env.production (subdominios spicycrust.com)
 */

export const GAME_URLS = {
  /** Slash Slice Arena — retro arcade con Stellar */
  invaders: import.meta.env.VITE_URL_SLASH_SLICE ?? 'https://slashslice.spicycrust.com',

  /** Spicy Challenge (Clash of Pizzas) — multijugador ZK/Cardano */
  dash: import.meta.env.VITE_URL_SPICY_CHALLENGE ?? 'https://spicychallenge.spicycrust.com',

  /** Rhythm Slice — ritmo tipo Guitar Hero en Stellar */
  slasher: import.meta.env.VITE_URL_RHYTHM_SLICE ?? 'https://rhythmslice.spicycrust.com',

  /** Slice Hunter — caza de ingredientes y jefes de pizza */
  hunter: import.meta.env.VITE_URL_SLICE_HUNTER ?? 'https://slicehunter.spicycrust.com',

  /** Smash The Crust — defiende la pizzería de los topos ladrones */
  smash: import.meta.env.VITE_URL_SMASH_THE_CRUST ?? 'https://smashthecrust.spicycrust.com',
}

/** Metadatos de cada juego para notificaciones y UI */
export const GAME_META = {
  invaders: {
    name: 'SLASH SLICE',
    opTitle: 'OPERACIÓN: SLASH SLICE // RETRO ARCADE',
    opMsg: 'Abriendo terminal de corte retro de la Famiglia. Cuchilla dual de oro y latón calibrada al 100%.',
  },
  dash: {
    name: 'SPICY CHALLENGE',
    opTitle: 'OPERACIÓN: SPICY CHALLENGE // ZK SHIELDED',
    opMsg: 'Estableciendo tablero blindado ZK en Midnight L2. Conexión segura P2P activa... ¡Desafía a tus oponentes!',
  },
  slasher: {
    name: 'RHYTHM SLICE',
    opTitle: 'OPERACIÓN: RHYTHM SLICE // SECURE ZKP',
    opMsg: 'Estableciendo túnel ZK con la red Stellar. Calibrando trastes de pizza... ¡Contrabando melódico listo!',
  },
  hunter: {
    name: 'SLICE HUNTER',
    opTitle: 'OPERACIÓN: SLICE HUNTER // BOUNTY HUNT',
    opMsg: 'Rastreando ingredientes raros en el bosque de la taberna. Cuchillas duales preparadas. ¡Caza la porción legendaria!',
  },
  smash: {
    name: 'SMASH THE CRUST',
    opTitle: 'OPERACIÓN: SMASH THE CRUST // KITCHEN DEFENSE',
    opMsg: '¡Pánico en la Pizzería! Bandada de topos ladrones detectada. Rodillo de chef cargado. ¡Defiende la masa madre!',
  },
}

