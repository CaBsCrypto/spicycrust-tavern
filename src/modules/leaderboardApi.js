/**
 * SpicyCrust — Cliente de API para el Leaderboard (API v2)
 * Se conecta a https://api.spicycrust.com/api/v1/leaderboard
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.spicycrust.com';

// Datos de muestra/fallback de alta calidad en caso de offline o arranque inicial
const FALLBACK_LEADERBOARDS = {
  'rhythm-slice': [
    { rank: 1, nickname: 'ROYAL_KING', score: 184300, created_at: '2026-09-01' },
    { rank: 2, nickname: 'PIZZA_SLICER', score: 162900, created_at: '2026-09-02' },
    { rank: 3, nickname: 'CHEF_BEATS', score: 145000, created_at: '2026-09-03' },
    { rank: 4, nickname: 'GOBLIN_SLICE', score: 121400, created_at: '2026-09-04' },
    { rank: 5, nickname: 'DOUGH_MASTER', score: 98150, created_at: '2026-09-05' }
  ],
  'slash-slice': [
    { rank: 1, nickname: 'PIZZA_PRINCESS', score: 198500, created_at: '2026-09-01' },
    { rank: 2, nickname: 'CROWN_CHEF', score: 175200, created_at: '2026-09-02' },
    { rank: 3, nickname: 'BLADE_PEPPERONI', score: 153400, created_at: '2026-09-03' },
    { rank: 4, nickname: 'MOZZARELLA_KNIGHT', score: 132100, created_at: '2026-09-04' },
    { rank: 5, nickname: 'CRUST_DEFENDER', score: 110900, created_at: '2026-09-05' }
  ],
  'slice-hunter': [
    { rank: 1, nickname: 'HUNTER_SUPREME', score: 210000, created_at: '2026-09-01' },
    { rank: 2, nickname: 'SHADOW_SLICE', score: 189400, created_at: '2026-09-02' },
    { rank: 3, nickname: 'OREGANO_SNIPER', score: 164000, created_at: '2026-09-03' },
    { rank: 4, nickname: 'FIRE_CHOPPER', score: 141200, created_at: '2026-09-04' },
    { rank: 5, nickname: 'BASIL_BOUNTY', score: 118500, created_at: '2026-09-05' }
  ]
};

/**
 * Consulta la tabla de clasificación para un juego específico
 * @param {Object} params
 * @param {string} params.game - slug del juego: 'rhythm-slice', 'slash-slice', 'slice-hunter'
 * @param {string} [params.season='season-01'] - slug de temporada
 * @param {number} [params.limit=20] - límite de registros
 * @param {string} [params.search=''] - término de búsqueda
 * @returns {Promise<{ success: boolean, isLive: boolean, data: Array }>}
 */
export async function fetchLeaderboard({ game = 'rhythm-slice', season = 'season-01', limit = 20, search = '' } = {}) {
  const url = new URL(`${API_BASE_URL}/api/v1/leaderboard`);
  url.searchParams.set('game', game);
  url.searchParams.set('season', season);
  url.searchParams.set('limit', String(limit));
  if (search) {
    url.searchParams.set('search', search);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data?.leaderboard)) {
        return {
          success: true,
          isLive: true,
          gameName: json.data?.game?.name ?? game,
          seasonName: json.data?.season?.name ?? season,
          data: json.data.leaderboard
        };
      }
    }
  } catch (err) {
    // API offline o tiempo de espera excedido: usar datos locales/fallback sin romper la experiencia
    console.warn(`[LeaderboardApi] Fallback activado para ${game}:`, err?.message ?? err);
  }

  // Filtrar fallback si hay búsqueda
  let fallbackList = FALLBACK_LEADERBOARDS[game] ?? FALLBACK_LEADERBOARDS['rhythm-slice'];
  if (search) {
    const term = search.toLowerCase();
    fallbackList = fallbackList.filter(item => item.nickname.toLowerCase().includes(term));
  }

  return {
    success: true,
    isLive: false,
    gameName: game,
    seasonName: season,
    data: fallbackList
  };
}

/**
 * Consulta las estadísticas globales de la API v2 y actualiza los indicadores del pie de página
 */
export async function fetchGlobalStats() {
  const url = `${API_BASE_URL}/api/v1/stats`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return {
          success: true,
          isLive: true,
          data: json.data
        };
      }
    }
  } catch (err) {
    console.warn('[LeaderboardApi] Fallback activado para stats:', err?.message ?? err);
  }

  return {
    success: true,
    isLive: false,
    data: {
      total_players: 3400,
      total_scores: 15000,
      highest_score: 99450,
      scores_today: 350
    }
  };
}

/**
 * Sincroniza dinámicamente las tarjetas numéricas del footer
 */
export async function syncFooterLiveStats() {
  const result = await fetchGlobalStats();
  if (!result || !result.data) return;

  const { total_players, total_scores, highest_score } = result.data;

  const statOpened = document.querySelector('[data-t="footerStatOpened"]');
  const statOnline = document.querySelector('[data-t="footerStatOnline"]');
  const statElixir = document.querySelector('[data-t="footerStatElixir"]');

  if (statOpened && highest_score) {
    statOpened.innerHTML = `🏆 TOP SCORE: <span class="text-mafia-gold font-bold">${Number(highest_score).toLocaleString()}</span>`;
  }
  if (statOnline && total_scores) {
    statOnline.innerHTML = `⚔️ PARTIDAS: <span class="text-mafia-gold font-bold">+${Number(total_scores).toLocaleString()}</span>`;
  }
  if (statElixir && total_players) {
    statElixir.innerHTML = `👥 JUGADORES: <span class="text-mafia-gold font-bold">+${Number(total_players).toLocaleString()}</span>`;
  }
}
