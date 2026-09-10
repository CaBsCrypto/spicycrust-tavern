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
      tabs.forEach(t => {
        t.classList.remove('active-tab', 'border-mafia-gold', 'text-mafia-gold', 'bg-mafia-mahogany/90');
        t.classList.add('border-mafia-gold/20', 'text-provolone-cheese/60', 'bg-[#1a0f0a]');
      });
      
      tab.classList.add('active-tab', 'border-mafia-gold', 'text-mafia-gold', 'bg-mafia-mahogany/90');
      tab.classList.remove('border-mafia-gold/20', 'text-provolone-cheese/60', 'bg-[#1a0f0a]');
      
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
      let rowHighlight = 'hover:bg-mafia-mahogany/30';
      if (rank === 1) {
        rankBadge = '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 text-black font-black text-xs shadow-md">🥇</span>';
        rowHighlight = 'bg-yellow-500/10 hover:bg-yellow-500/15 border-yellow-500/30';
      } else if (rank === 2) {
        rankBadge = '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 text-black font-black text-xs shadow-md">🥈</span>';
        rowHighlight = 'bg-slate-300/5 hover:bg-slate-300/10 border-slate-400/20';
      } else if (rank === 3) {
        rankBadge = '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 text-white font-black text-xs shadow-md">🥉</span>';
        rowHighlight = 'bg-amber-700/5 hover:bg-amber-700/10 border-amber-600/20';
      } else {
        rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-mafia-dark/80 text-mafia-gold/70 font-mono font-bold text-xs border border-mafia-gold/20">${rank}</span>`;
      }

      const formattedDate = player.created_at ? player.created_at.split(' ')[0] || player.created_at.split('T')[0] : 'HOY';

      return `
        <tr class="transition-all duration-200 ${rowHighlight}">
          <td class="px-3 sm:px-4 py-3 text-center">
            ${rankBadge}
          </td>
          <td class="px-3 sm:px-4 py-3 font-semibold text-provolone-cheese">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-lilita text-sm sm:text-base text-white tracking-wide">${player.nickname || player.name || 'JUGADOR'}</span>
              <span class="text-[9px] bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-sans font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> VERIFICADO
              </span>
            </div>
          </td>
          <td class="px-3 sm:px-4 py-3 text-right">
            <span class="font-mono font-black text-sm sm:text-base text-mafia-amber tracking-tight drop-shadow-sm">
              ${score}
            </span>
          </td>
          <td class="px-3 sm:px-4 py-3 text-right text-[11px] text-provolone-cheese/50 font-mono hidden sm:table-cell">
            ${formattedDate}
          </td>
        </tr>
      `;
    }).join('');
  }
}
