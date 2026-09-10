import { Sound } from './sound.js';
import { fetchLeaderboard, invalidateSeasonCache } from './leaderboardApi.js';

export function initModals() {
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const leaderboardClose = document.getElementById('leaderboard-close');
  const searchInput = document.getElementById('leaderboard-search');

  let currentGame = 'rhythm-slice';
  let searchQuery = '';

  // Tab listeners
  const tabs = document.querySelectorAll('.lead-tab');
  tabs.forEach(tab => {
    tab.addEventListener('mouseenter', () => Sound.playHoverBlip());
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      Sound.playToggleSound();
      tabs.forEach(t => t.classList.remove('active-tab'));
      tab.classList.add('active-tab');
      
      currentGame = tab.getAttribute('data-game') || 'rhythm-slice';
      loadLeaderboard();
    });
  });

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadLeaderboard();
      }, 300);
    });
  }

  // --- LEADERBOARD MODAL OPEN / CLOSE ---
  const leaderboardMobileBtn = document.getElementById('leaderboard-btn-mobile');
  const openButtons = [leaderboardBtn, leaderboardMobileBtn].filter(Boolean);

  if (openButtons.length > 0 && leaderboardModal && leaderboardClose) {
    const handleOpenLeaderboard = (e) => {
      e.preventDefault();
      Sound.playToggleSound();
      invalidateSeasonCache(); // Refrescar temporada activa al abrir
      openModal(leaderboardModal);
      loadLeaderboard();
    };

    openButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => Sound.playHoverBlip());
      btn.addEventListener('click', handleOpenLeaderboard);
    });

    leaderboardClose.addEventListener('mouseenter', () => Sound.playHoverBlip());
    leaderboardClose.addEventListener('click', () => {
      Sound.playToggleSound();
      closeModal(leaderboardModal);
    });
  }

  // Cerrar modales al hacer clic fuera del panel de contenido
  window.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
      Sound.playToggleSound();
      closeModal(leaderboardModal);
    }
  });

  // Funciones de utilidad para animación
  function openModal(modal) {
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.style.opacity = '1';
    
    const panel = modal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
    }
  }

  function closeModal(modal) {
    modal.style.opacity = '0';
    
    const panel = modal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(0.95)';
      panel.style.opacity = '0';
    }
    
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }

  async function loadLeaderboard() {
    const tableBody = document.getElementById('leaderboard-tbody');
    const statusText = document.getElementById('leaderboard-api-status');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-8 text-center text-mafia-gold/60 font-typewriter text-xs">
          <div class="flex items-center justify-center gap-2">
            <span class="animate-spin inline-block w-4 h-4 border-2 border-mafia-gold border-t-transparent rounded-full"></span>
            Cargando clasificación...
          </div>
        </td>
      </tr>
    `;

    const result = await fetchLeaderboard({ game: currentGame, search: searchQuery });

    if (statusText) {
      if (result.isLive) {
        statusText.innerHTML = `<span class="inline-flex items-center gap-1.5"><span class="lb-badge-live">🟢 LIVE</span> SPICYCRUST API // TEMPORADA: <span class="text-mafia-gold">${String(result.seasonName ?? 'SEASON-01').toUpperCase()}</span></span>`;
      } else {
        statusText.innerHTML = `<span class="inline-flex items-center gap-1.5"><span class="lb-badge-demo">⚠️ DEMO</span> API NO DISPONIBLE // DATOS DE MUESTRA</span>`;
      }
    }

    if (!result.data || result.data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-4 py-8 text-center text-mafia-gold/50 font-typewriter text-xs">
            No se encontraron jugadores registrados para este juego.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = result.data.map((player, idx) => {
      const rank = player.rank ?? (idx + 1);
      const score = Number(player.score || 0).toLocaleString();
      
      let rankBadge = '';
      let rowHighlight = 'hover:bg-[#23150d]/80';
      if (rank === 1) {
        rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-[#ffe066] to-[#b38600] text-black font-black text-sm shadow-[0_0_12px_rgba(255,224,102,0.4)]">🥇</span>';
        rowHighlight = 'bg-[#ffe066]/10 hover:bg-[#ffe066]/15';
      } else if (rank === 2) {
        rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-[#e2e8f0] to-[#64748b] text-black font-black text-sm shadow-[0_0_12px_rgba(226,232,240,0.3)]">🥈</span>';
        rowHighlight = 'bg-[#e2e8f0]/5 hover:bg-[#e2e8f0]/10';
      } else if (rank === 3) {
        rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-[#f97316] to-[#7c2d12] text-white font-black text-sm shadow-[0_0_12px_rgba(249,115,22,0.3)]">🥉</span>';
        rowHighlight = 'bg-[#f97316]/5 hover:bg-[#f97316]/10';
      } else {
        rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a0f0a] text-[#ffd866] font-mono font-bold text-xs border border-[#ffd866]/30">${rank}</span>`;
      }

      const formattedDate = player.created_at ? player.created_at.split(' ')[0] || player.created_at.split('T')[0] : 'HOY';

      return `
        <tr class="transition-all duration-200 border-b border-[#ffd866]/10 ${rowHighlight}">
          <td class="px-3 sm:px-4 py-3.5 text-center w-14 sm:w-16">
            ${rankBadge}
          </td>
          <td class="px-3 sm:px-4 py-3.5 font-semibold text-white">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="lb-player-name text-sm sm:text-base text-white tracking-normal">${player.nickname || player.name || 'JUGADOR'}</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 inline-flex items-center gap-1 font-sans font-semibold tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> VERIFICADO
              </span>
            </div>
          </td>
          <td class="px-3 sm:px-4 py-3.5 text-right">
            <span class="font-mono font-black text-base sm:text-lg text-[#ffd866] tracking-tight drop-shadow">
              ${score}
            </span>
          </td>
          <td class="px-3 sm:px-4 py-3.5 text-right text-xs text-white/60 font-mono hidden sm:table-cell">
            ${formattedDate}
          </td>
        </tr>
      `;
    }).join('');
  }
}
