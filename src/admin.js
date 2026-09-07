/**
 * SpicyCrust — Controlador del Panel de Administración (Frontend V2)
 */

let apiUrl = localStorage.getItem('spicy_admin_api_url') || 'https://api.spicycrust.com';
let adminKey = sessionStorage.getItem('spicy_admin_key') || '';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const userNav = document.getElementById('admin-user-nav');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

document.addEventListener('DOMContentLoaded', () => {
  if (adminKey) {
    showDashboard();
  } else {
    showLogin();
  }

  // Handle Login Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.add('hidden');

      const urlInput = document.getElementById('login-api-url').value.trim();
      const keyInput = document.getElementById('login-admin-key').value.trim();

      apiUrl = urlInput.replace(/\/+$/, '');
      adminKey = keyInput;

      // Probar conexión llamando a /api/v1/health y /api/v1/stats
      try {
        const res = await fetch(`${apiUrl}/api/v1/stats`, {
          headers: {
            'X-Admin-Key': adminKey,
            'Accept': 'application/json'
          }
        });

        const json = await res.json();
        if (res.ok && json.success) {
          localStorage.setItem('spicy_admin_api_url', apiUrl);
          sessionStorage.setItem('spicy_admin_key', adminKey);
          showDashboard();
        } else {
          loginError.textContent = json.error?.message || 'Clave de administración incorrecta o error de conexión.';
          loginError.classList.remove('hidden');
        }
      } catch (err) {
        loginError.textContent = `Error de red: No se pudo contactar con ${apiUrl}`;
        loginError.classList.remove('hidden');
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('spicy_admin_key');
      adminKey = '';
      showLogin();
    });
  }

  // Setup Dashboard Tabs
  const tabs = document.querySelectorAll('.dash-tab');
  const contents = document.querySelectorAll('.dash-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      tabs.forEach(t => {
        t.classList.remove('bg-[#ffd866]', 'text-black', 'active-tab');
        t.classList.add('bg-[#1a0f0a]', 'border', 'border-[#ffd866]/30', 'text-[#ffd866]');
      });

      tab.classList.add('bg-[#ffd866]', 'text-black', 'active-tab');
      tab.classList.remove('bg-[#1a0f0a]', 'border', 'border-[#ffd866]/30', 'text-[#ffd866]');

      contents.forEach(c => {
        if (c.id === target) {
          c.classList.remove('hidden');
        } else {
          c.classList.add('hidden');
        }
      });
    });
  });

  // Setup Leaderboard Refresh
  const leadRefreshBtn = document.getElementById('admin-lead-refresh');
  const leadGameSelect = document.getElementById('admin-lead-game');
  if (leadRefreshBtn) {
    leadRefreshBtn.addEventListener('click', () => loadAdminLeaderboard());
  }
  if (leadGameSelect) {
    leadGameSelect.addEventListener('change', () => loadAdminLeaderboard());
  }
});

function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  userNav.classList.add('hidden');
}

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  userNav.classList.remove('hidden');

  loadStats();
  loadGames();
  loadSeasons();
  loadAdminLeaderboard();
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Accept': 'application/json',
    'X-Admin-Key': adminKey,
    ...(options.headers || {})
  };

  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers
  });

  return res.json();
}

async function loadStats() {
  try {
    const json = await apiRequest('/api/v1/stats');
    if (json.success && json.data) {
      document.getElementById('stat-players').textContent = Number(json.data.total_players || 0).toLocaleString();
      document.getElementById('stat-scores').textContent = Number(json.data.total_scores || 0).toLocaleString();
      document.getElementById('stat-highest').textContent = Number(json.data.highest_score || 0).toLocaleString();
      document.getElementById('stat-today').textContent = Number(json.data.scores_today || 0).toLocaleString();
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadGames() {
  const tbody = document.getElementById('games-table-body');
  try {
    const json = await apiRequest('/api/v1/games');
    if (json.success && Array.isArray(json.data?.games)) {
      tbody.innerHTML = json.data.games.map(game => `
        <tr class="hover:bg-[#1f1712]">
          <td class="px-4 py-3 text-[#ffd866]/60">${game.id}</td>
          <td class="px-4 py-3 font-bold text-white">${game.name}</td>
          <td class="px-4 py-3 text-emerald-400 font-mono">${game.slug}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-[10px] ${game.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-red-950 text-red-300 border border-red-500/30'}">
              ${game.status.toUpperCase()}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button onclick="toggleGameStatus(${game.id}, '${game.status === 'active' ? 'inactive' : 'active'}')" class="text-[11px] text-[#ffd866] hover:underline cursor-pointer">
              ${game.status === 'active' ? 'Desactivar' : 'Activar'}
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Error al cargar juegos: ${err.message}</td></tr>`;
  }
}

async function loadSeasons() {
  const tbody = document.getElementById('seasons-table-body');
  try {
    const json = await apiRequest('/api/v1/seasons');
    if (json.success && Array.isArray(json.data?.seasons)) {
      tbody.innerHTML = json.data.seasons.map(s => `
        <tr class="hover:bg-[#1f1712]">
          <td class="px-4 py-3 text-[#ffd866]/60">${s.id}</td>
          <td class="px-4 py-3 font-bold text-white">${s.name}</td>
          <td class="px-4 py-3 text-orange-400 font-mono">${s.slug}</td>
          <td class="px-4 py-3 text-[#ffd866]/60 text-[10px]">${s.starts_at?.split(' ')[0]} al ${s.ends_at?.split(' ')[0]}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-[10px] ${s.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-300'}">
              ${s.status.toUpperCase()}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button onclick="toggleSeasonStatus(${s.id}, '${s.status === 'active' ? 'completed' : 'active'}')" class="text-[11px] text-[#ffd866] hover:underline cursor-pointer">
              ${s.status === 'active' ? 'Completar' : 'Activar'}
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-400">Error al cargar temporadas: ${err.message}</td></tr>`;
  }
}

async function loadAdminLeaderboard() {
  const tbody = document.getElementById('admin-lead-tbody');
  const game = document.getElementById('admin-lead-game')?.value || 'rhythm-slice';
  const season = document.getElementById('admin-lead-season')?.value || 'season-01';

  tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-[#ffd866]/60">Consultando API...</td></tr>`;

  try {
    const json = await apiRequest(`/api/v1/leaderboard?game=${encodeURIComponent(game)}&season=${encodeURIComponent(season)}&limit=50`);
    if (json.success && Array.isArray(json.data?.leaderboard)) {
      if (json.data.leaderboard.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-[#ffd866]/40">No hay puntajes para esta combinación.</td></tr>`;
        return;
      }

      tbody.innerHTML = json.data.leaderboard.map(row => `
        <tr class="hover:bg-[#1f1712]">
          <td class="px-4 py-3 text-center font-bold text-[#ffd866]">${row.rank}</td>
          <td class="px-4 py-3 font-bold text-white">${row.nickname || 'Player'}</td>
          <td class="px-4 py-3 text-[#ffd866]/60 text-[10px]">${row.email || row.player_id}</td>
          <td class="px-4 py-3 text-right font-mono text-emerald-400 font-bold">${Number(row.score).toLocaleString()}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="deleteScore('${row.score_id}')" class="text-xs text-red-400 hover:text-red-300 cursor-pointer">
              🗑️ Eliminar
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Error: ${err.message}</td></tr>`;
  }
}

window.deleteScore = async function(scoreId) {
  if (!confirm(`¿Seguro que deseas eliminar el score #${scoreId}?`)) return;
  try {
    const res = await apiRequest(`/api/v1/scores/${scoreId}`, { method: 'DELETE' });
    if (res.success) {
      loadAdminLeaderboard();
      loadStats();
    } else {
      alert(res.error?.message || 'Error al eliminar');
    }
  } catch (err) {
    alert(err.message);
  }
};

window.toggleGameStatus = async function(gameId, newStatus) {
  try {
    const res = await apiRequest(`/api/v1/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      loadGames();
    } else {
      alert(res.error?.message || 'Error al cambiar estado');
    }
  } catch (err) {
    alert(err.message);
  }
};

window.toggleSeasonStatus = async function(seasonId, newStatus) {
  try {
    const res = await apiRequest(`/api/v1/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      loadSeasons();
    } else {
      alert(res.error?.message || 'Error al cambiar estado');
    }
  } catch (err) {
    alert(err.message);
  }
};