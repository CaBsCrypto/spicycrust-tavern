/**
 * SpicyCrust - Cliente de API para el Leaderboard
 * API Base: https://spicycrust-api.alphadocere.cl/api/v1
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://spicycrust-api.alphadocere.cl';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

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
      const rows = json.data?.ranking ?? json.data?.leaderboard;
      if (json && json.success && Array.isArray(rows)) {
        return {
          success: true,
          isLive: true,
          gameName: json.data?.game?.name ?? game,
          seasonName: json.data?.season?.name ?? seasonName,
          data: rows
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

const SLUG_ALIASES = {
  'slasher': 'rhythm-slice',
  'pizza-slasher': 'rhythm-slice',
  'pizzaslasher': 'rhythm-slice',
  'rhythm': 'rhythm-slice',
  'rhythm-slice': 'rhythm-slice',
  'rhythmslice': 'rhythm-slice',
  'rhythm slice': 'rhythm-slice',
  'invaders': 'slash-slice',
  'crust-invaders': 'slash-slice',
  'crustinvaders': 'slash-slice',
  'slash': 'slash-slice',
  'slash-slice': 'slash-slice',
  'slashslice': 'slash-slice',
  'slash slice': 'slash-slice',
  'smash': 'smash-the-crust',
  'smash-crust': 'smash-the-crust',
  'smashcrust': 'smash-the-crust',
  'smash-the-crust': 'smash-the-crust',
  'smashthecrust': 'smash-the-crust',
  'smash the crust': 'smash-the-crust',
  'hunter': 'slice-hunter',
  'slice-hunter': 'slice-hunter',
  'slicehunter': 'slice-hunter',
  'slice hunter': 'slice-hunter',
  'slicehunt': 'slice-hunter'
};

function normalizeSlug(rawSlug, rawName) {
  const cleanSlug = (rawSlug || '').toString().toLowerCase().trim().replace(/_/g, '-');
  if (SLUG_ALIASES[cleanSlug]) return SLUG_ALIASES[cleanSlug];
  const cleanName = (rawName || '').toString().toLowerCase().trim().replace(/_/g, '-');
  if (SLUG_ALIASES[cleanName]) return SLUG_ALIASES[cleanName];

  const s = `${cleanSlug} ${cleanName}`.trim();
  for (const [key, canonical] of Object.entries(SLUG_ALIASES)) {
    if (s.includes(key)) return canonical;
  }

  if (s.includes('rhythm') || s.includes('slasher')) return 'rhythm-slice';
  if (s.includes('slash') || s.includes('invader')) return 'slash-slice';
  if (s.includes('smash') || (s.includes('crust') && !s.includes('slash'))) return 'smash-the-crust';
  if (s.includes('hunter')) return 'slice-hunter';

  return cleanSlug || cleanName || '';
}

export async function fetchGlobalStats() {
  const url = `${API_BASE_URL}/api/v1/stats`;
  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success !== false) {
        const rawData = json.data ?? (json.total_players !== undefined || json.totalPlayers !== undefined ? json : null);
        if (rawData) {
          const highest_score = rawData.highest_score ?? rawData.highestScore ?? rawData.top_score ?? rawData.topScore ?? rawData.max_score;
          const total_scores = rawData.total_scores ?? rawData.totalScores ?? rawData.scores_count ?? rawData.score_count ?? rawData.total_matches ?? rawData.matches_count;
          const total_players = rawData.total_players ?? rawData.totalPlayers ?? rawData.players_count ?? rawData.player_count ?? rawData.total_users ?? rawData.users_count;
          const scores_today = rawData.scores_today ?? rawData.scoresToday ?? 0;

          if (highest_score !== undefined || total_scores !== undefined || total_players !== undefined) {
            return {
              success: true,
              isLive: true,
              data: {
                highest_score: Number.isFinite(Number(highest_score)) ? Number(highest_score) : 188500,
                total_scores: Number.isFinite(Number(total_scores)) ? Number(total_scores) : 31,
                total_players: Number.isFinite(Number(total_players)) ? Number(total_players) : 26,
                scores_today: Number.isFinite(Number(scores_today)) ? Number(scores_today) : 30
              }
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[LeaderboardApi] Fallback activado para stats:', err?.message ?? err);
  } finally {
    clearTimeout(timeoutId);
  }
  return {
    success: true,
    isLive: false,
    data: { total_players: 26, total_scores: 31, highest_score: 188500, scores_today: 30 }
  };
}

export async function fetchGamesList() {
  const url = `${API_BASE_URL}/api/v1/games`;
  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json?.data) 
        ? json.data 
        : (Array.isArray(json?.data?.games) 
            ? json.data.games 
            : (Array.isArray(json?.games) ? json.games : (Array.isArray(json) ? json : null)));
      if (list && list.length > 0) {
        return { success: true, isLive: true, data: list };
      }
    }
  } catch (err) {
    console.warn('[LeaderboardApi] Fallback activado para games:', err?.message ?? err);
  } finally {
    clearTimeout(timeoutId);
  }
  return {
    success: true,
    isLive: false,
    data: [
      { slug: 'rhythm-slice', name: 'Rhythm Slice', score_count: 8 },
      { slug: 'slash-slice', name: 'Slash Slice', score_count: 13 },
      { slug: 'smash-the-crust', name: 'Smash The Crust', score_count: 5 },
      { slug: 'slice-hunter', name: 'Slice Hunter', score_count: 5 }
    ]
  };
}

// Cache en memoria para sincronización instantánea y soporte multilenguaje
let _cachedGlobalStats = {
  success: true,
  isLive: true,
  data: { total_players: 26, total_scores: 31, highest_score: 188500, scores_today: 30 }
};

let _cachedGameCounts = {
  'rhythm-slice': 8,
  'slash-slice': 15,
  'smash-the-crust': 5,
  'slice-hunter': 5
};

let _cachedGameTopScores = {
  'rhythm-slice': 188500,
  'slash-slice': 3810,
  'smash-the-crust': 28987,
  'slice-hunter': 257
};

export function renderLiveStatsUI() {
  const currentLang = localStorage.getItem('lang') || 'es';
  const isEn = currentLang === 'en';
  const locale = isEn ? 'en-US' : 'es-ES';

  const stats = _cachedGlobalStats?.data;
  const isLive = Boolean(_cachedGlobalStats?.isLive);

  // 1. Banner Hero de Estadísticas Vivas
  const highestScoreEl = document.getElementById('hero-highest-score');
  const totalScoresEl = document.getElementById('hero-total-scores');
  const totalPlayersEl = document.getElementById('hero-total-players');
  const liveIndicatorEl = document.getElementById('hero-live-indicator');

  if (highestScoreEl) {
    const num = Number(stats?.highest_score);
    const safeVal = Number.isFinite(num) ? num : 188500;
    highestScoreEl.textContent = safeVal.toLocaleString(locale);
  }

  if (totalScoresEl) {
    const num = Number(stats?.total_scores);
    const safeVal = Number.isFinite(num) ? num : 31;
    const formatted = safeVal.toLocaleString(locale);
    const unit = isEn ? 'matches' : 'partidas';
    totalScoresEl.innerHTML = `+${formatted} <span class="text-xs sm:text-sm font-sans font-semibold tracking-normal opacity-85 uppercase">${unit}</span>`;
  }

  if (totalPlayersEl) {
    const num = Number(stats?.total_players);
    const safeVal = Number.isFinite(num) ? num : 26;
    const formatted = safeVal.toLocaleString(locale);
    const unit = isEn ? 'chefs' : 'pizzeros';
    totalPlayersEl.innerHTML = `+${formatted} <span class="text-xs sm:text-sm font-sans font-semibold tracking-normal opacity-85 uppercase">${unit}</span>`;
  }

  if (liveIndicatorEl) {
    if (isLive) {
      liveIndicatorEl.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.25)] w-fit self-start sm:self-auto';
      liveIndicatorEl.innerHTML = `
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span>${isEn ? '🟢 LIVE / LIVE API' : '🟢 EN VIVO / LIVE API'}</span>
      `;
    } else {
      liveIndicatorEl.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 font-mono text-xs font-bold tracking-wider w-fit self-start sm:self-auto';
      liveIndicatorEl.innerHTML = `
        <span class="relative flex h-2 w-2">
          <span class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
        <span>${isEn ? '🟡 CACHED API' : '🟡 DATOS EN CACHÉ'}</span>
      `;
    }
  }

  // 2. Cajas 3D: Sincronización de Partidas y Top Score reales por juego
  const gameElements = {
    'rhythm-slice': {
      stat: document.getElementById('game-stat-rhythm-slice'),
      top: document.getElementById('game-top-rhythm-slice')
    },
    'slash-slice': {
      stat: document.getElementById('game-stat-slash-slice'),
      top: document.getElementById('game-top-slash-slice')
    },
    'smash-the-crust': {
      stat: document.getElementById('game-stat-smash-the-crust'),
      top: document.getElementById('game-top-smash-the-crust')
    },
    'slice-hunter': {
      stat: document.getElementById('game-stat-slice-hunter'),
      top: document.getElementById('game-top-slice-hunter')
    }
  };

  const defaultCounts = {
    'rhythm-slice': 8,
    'slash-slice': 15,
    'smash-the-crust': 5,
    'slice-hunter': 5
  };

  const defaultTops = {
    'rhythm-slice': 188500,
    'slash-slice': 3810,
    'smash-the-crust': 28987,
    'slice-hunter': 257
  };

  Object.entries(gameElements).forEach(([slug, els]) => {
    if (els.stat) {
      const val = _cachedGameCounts[slug];
      const num = Number(val);
      const safeVal = Number.isFinite(num) ? num : (defaultCounts[slug] ?? 0);
      els.stat.textContent = safeVal.toLocaleString(locale);
    }
    if (els.top) {
      const val = _cachedGameTopScores[slug];
      const num = Number(val);
      const safeVal = Number.isFinite(num) ? num : (defaultTops[slug] ?? 0);
      els.top.textContent = safeVal.toLocaleString(locale);
    }
  });

  // 3. Footer Stats Sync
  if (stats) {
    const statOpened = document.getElementById('footer-stat-score') || document.querySelector('[data-t="footerStatOpened"]');
    const statOnline = document.getElementById('footer-stat-matches') || document.querySelector('[data-t="footerStatOnline"]');
    const statElixir = document.getElementById('footer-stat-players') || document.querySelector('[data-t="footerStatElixir"]');
    if (statOpened && stats.highest_score !== undefined && stats.highest_score !== null) {
      const num = Number(stats.highest_score);
      const safeVal = Number.isFinite(num) ? num : 188500;
      statOpened.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">🏆 Top Score</span><span class="block text-sm font-black text-mafia-amber font-mono mt-0.5">${safeVal.toLocaleString(locale)}</span>`;
    }
    if (statOnline && stats.total_scores !== undefined && stats.total_scores !== null) {
      const num = Number(stats.total_scores);
      const safeVal = Number.isFinite(num) ? num : 31;
      const label = isEn ? '⚔️ Matches' : '⚔️ Partidas';
      statOnline.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">${label}</span><span class="block text-sm font-black text-mafia-green font-mono mt-0.5">+${safeVal.toLocaleString(locale)}</span>`;
    }
    if (statElixir && stats.total_players !== undefined && stats.total_players !== null) {
      const num = Number(stats.total_players);
      const safeVal = Number.isFinite(num) ? num : 26;
      const label = isEn ? '👥 Players' : '👥 Jugadores';
      statElixir.innerHTML = `<span class="block text-[9px] uppercase tracking-widest text-mafia-gold/50 font-sans">${label}</span><span class="block text-sm font-black text-blue-400 font-mono mt-0.5">+${safeVal.toLocaleString(locale)}</span>`;
    }
  }
}

let _syncArcadePromise = null;

export async function syncLiveArcadeStats() {
  if (_syncArcadePromise) return _syncArcadePromise;

  _syncArcadePromise = (async () => {
    try {
      const [statsResult, gamesResult] = await Promise.allSettled([
        fetchGlobalStats(),
        fetchGamesList()
      ]);

      const statsLive = statsResult.status === 'fulfilled' && Boolean(statsResult.value?.success && statsResult.value?.isLive);
      const gamesLive = gamesResult.status === 'fulfilled' && Boolean(gamesResult.value?.success && gamesResult.value?.isLive);

      if (statsResult.status === 'fulfilled' && statsResult.value?.data) {
        _cachedGlobalStats = {
          success: true,
          isLive: statsLive && gamesLive,
          data: statsResult.value.data
        };
      } else {
        _cachedGlobalStats = {
          ..._cachedGlobalStats,
          isLive: false
        };
      }

      if (gamesResult.status === 'fulfilled' && gamesResult.value?.data) {
        const list = gamesResult.value.data;
        list.forEach(item => {
          const g = item?.game || item;
          if (!g) return;
          const rawCount = g.score_count ?? g.scores_count ?? g.total_scores 
            ?? g.scoreCount ?? g.scoresCount ?? g.totalScores
            ?? g.stats?.score_count ?? g.stats?.scores_count ?? g.stats?.total_scores;
          const rawSlugOrName = g.slug || g.name;
          if (rawSlugOrName && rawCount !== undefined && rawCount !== null) {
            const count = Number(rawCount);
            if (!isNaN(count)) {
              const canonicalSlug = normalizeSlug(g.slug, g.name);
              if (_cachedGameCounts[canonicalSlug] !== undefined) {
                _cachedGameCounts[canonicalSlug] = count;
              }
            }
          }
        });
      }

      // 3. Consulta de Top Score real para cada juego desde la API
      const gameSlugs = ['rhythm-slice', 'slash-slice', 'smash-the-crust', 'slice-hunter'];
      const topPromises = gameSlugs.map(async (slug) => {
        try {
          const { slug: seasonSlug } = await fetchActiveSeason();
          const res = await fetch(`${API_BASE_URL}/api/v1/leaderboard?game=${slug}&season=${seasonSlug}&limit=1`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) {
            const json = await res.json();
            const topScore = json?.data?.ranking?.[0]?.score ?? json?.data?.leaderboard?.[0]?.score;
            if (topScore !== undefined && topScore !== null) {
              const num = Number(topScore);
              if (!isNaN(num)) {
                _cachedGameTopScores[slug] = num;
              }
            }
          }
        } catch (e) {
          // Mantener valor en cache
        }
      });
      await Promise.allSettled(topPromises);
    } catch (err) {
      console.warn('[LeaderboardApi] Error sincronizando estadísticas arcade:', err);
      _cachedGlobalStats = {
        ..._cachedGlobalStats,
        isLive: false
      };
    } finally {
      try {
        renderLiveStatsUI();
      } catch (e) {
        console.error('[LeaderboardApi] Error in renderLiveStatsUI:', e);
      }
      _syncArcadePromise = null;
    }
  })();

  return _syncArcadePromise;
}

export async function syncFooterLiveStats() {
  await syncLiveArcadeStats();
}

// Actualización periódica en segundo plano (cada 60s) y al volver a la pestaña activa
let _pollInterval = null;
export function startLiveStatsPolling(intervalMs = 60000) {
  if (typeof window === 'undefined') return;
  if (_pollInterval) clearInterval(_pollInterval);
  _pollInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncLiveArcadeStats();
    }
  }, intervalMs);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncLiveArcadeStats();
    }
  });
}

// Escuchar cambios de idioma para refrescar las etiquetas dinámicas
if (typeof window !== 'undefined') {
  window.addEventListener('spicycrust:lang-changed', () => {
    renderLiveStatsUI();
  });
}
