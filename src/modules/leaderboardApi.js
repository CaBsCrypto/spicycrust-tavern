/**
 * SpicyCrust - Cliente de API para el Leaderboard
 * API Base: https://spicycrust-api.alphadocere.cl/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://spicycrust-api.alphadocere.cl';

// Cache de la temporada activa (se refresca al abrir el modal)
let _cachedSeasonSlug = null;
let _cachedSeasonName = null;

// Datos de fallback para cuando la API no esta disponible
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
  'smash-the-crust': [
    { rank: 1, nickname: 'MOLE_CRUSHER', score: 215000, created_at: '2026-09-01' },
    { rank: 2, nickname: 'DOUGH_HAMMER', score: 193400, created_at: '2026-09-02' },
    { rank: 3, nickname: 'ROLLING_PIN_ACE', score: 174000, created_at: '2026-09-03' },
    { rank: 4, nickname: 'KITCHEN_GUARD', score: 152200, created_at: '2026-09-04' },
    { rank: 5, nickname: 'CHEF_PANIC', score: 129500, created_at: '2026-09-05' }
  ],
  'slice-hunter': [
    { rank: 1, nickname: 'HUNTER_SUPREME', score: 210000, created_at: '2026-09-01' },
    { rank: 2, nickname: 'SHADOW_SLICE', score: 189400, created_at: '2026-09-02' },
    { rank: 3, nickname: 'OREGANO_SNIPER', score: 164000, created_at: '2026-09-03' },
    { rank: 4, nickname: 'FIRE_CHOPPER', score: 141200, created_at: '2026-09-04' },
    { rank: 5, nickname: 'BASIL_BOUNTY', score: 118500, created_at: '2026-09-05' }
  ]
};

export async function fetchActiveSeason() {
  if (_cachedSeasonSlug) {
    return { slug: _cachedSeasonSlug, name: _cachedSeasonName ?? _cachedSeasonSlug };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE_URL}/api/v1/seasons?status=active`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      const season = Array.isArray(json) ? json[0] : (json.data ?? json);
      if (season?.slug) {
        _cachedSeasonSlug = season.slug;
        _cachedSeasonName = season.name ?? season.slug;
        return { slug: _cachedSeasonSlug, name: _cachedSeasonName };
      }
    }
  } catch (err) {
    console.warn('[LeaderboardApi] No se pudo obtener la temporada activa:', err?.message ?? err);
  }
  return { slug: 'season-01', name: 'TEMPORADA 1' };
}

export function invalidateSeasonCache() {
  _cachedSeasonSlug = null;
  _cachedSeasonName = null;
}

export async function fetchLeaderboard({ game = 'rhythm-slice', limit = 20, search = '' } = {}) {
  const { slug: seasonSlug, name: seasonName } = await fetchActiveSeason();
  const url = new URL(`${API_BASE_URL}/api/v1/leaderboard`);
  url.searchParams.set('game', game);
  url.searchParams.set('season', seasonSlug);
  url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
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
          seasonName: json.data?.season?.name ?? seasonName,
          data: json.data.leaderboard
        };
      }
    }
  } catch (err) {
    console.warn(`[LeaderboardApi] Fallback activado para ${game}:`, err?.message ?? err);
  }

  let fallbackList = FALLBACK_LEADERBOARDS[game] ?? FALLBACK_LEADERBOARDS['rhythm-slice'];
  if (search) {
    const term = search.toLowerCase();
    fallbackList = fallbackList.filter(item => item.nickname.toLowerCase().includes(term));
  }
  return { success: true, isLive: false, gameName: game, seasonName, data: fallbackList };
}

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
        return { success: true, isLive: true, data: json.data };
      }
    }
  } catch (err) {
    console.warn('[LeaderboardApi] Fallback activado para stats:', err?.message ?? err);
  }
  return {
    success: true,
    isLive: false,
    data: { total_players: 3400, total_scores: 15000, highest_score: 99450, scores_today: 350 }
  };
}

export async function syncFooterLiveStats() {
  const result = await fetchGlobalStats();
  if (!result || !result.data) return;
  const { total_players, total_scores, highest_score } = result.data;
  const statOpened = document.querySelector('[data-t="footerStatOpened"]');
  const statOnline = document.querySelector('[data-t="footerStatOnline"]');
  const statElixir = document.querySelector('[data-t="footerStatElixir"]');
  if (statOpened && highest_score) {
    statOpened.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">🏆 Top Score</span><span class="block text-sm font-black text-mafia-amber font-mono mt-0.5">${Number(highest_score).toLocaleString()}</span>`;
  }
  if (statOnline && total_scores) {
    statOnline.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">⚔️ Partidas</span><span class="block text-sm font-black text-mafia-green font-mono mt-0.5">+${Number(total_scores).toLocaleString()}</span>`;
  }
  if (statElixir && total_players) {
    statElixir.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">👥 Jugadores</span><span class="block text-sm font-black text-blue-400 font-mono mt-0.5">+${Number(total_players).toLocaleString()}</span>`;
  }
}
