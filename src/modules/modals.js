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
  if (leaderboardBtn && leaderboardModal && leaderboardClose) {
    const handleOpenLeaderboard = (e) => {
      e.preventDefault();
      Sound.playToggleSound();
      invalidateSeasonCache(); // Refrescar temporada activa al abrir
      openModal(leaderboardModal);
      loadLeaderboard();
    };

    leaderboardBtn.addEventListener('mouseenter', () => Sound.playHoverBlip());
    leaderboardBtn.addEventListener('click', handleOpenLeaderboard);

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
      const rankClass = rank === 1 ? 'text-mafia-amber font-bold text-sm' : rank === 2 ? 'text-mafia-gold font-bold' : rank === 3 ? 'text-amber-200 font-bold' : 'text-mafia-gold/50';
      const medal = rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';

      return `
        <tr class="border-b border-mafia-gold/10 hover:bg-[#3d1d07]/30 transition-colors">
          <td class="px-4 py-3 font-arcade text-xs text-center ${rankClass}">
            ${medal}${rank}
          </td>
          <td class="px-4 py-3 font-semibold text-provolone-cheese flex items-center gap-2">
            ${player.nickname || player.name || 'JUGADOR'}
            <span class="text-[9px] bg-mafia-green/20 text-provolone-cheese px-1.5 py-0.5 rounded border border-mafia-green/40 flex items-center font-typewriter">
              [VERIFICADO]
            </span>
          </td>
          <td class="px-4 py-3 text-right font-arcade text-xs text-mafia-amber glow-amber">
            ${score}
          </td>
          <td class="px-4 py-3 text-right text-[10px] text-provolone-cheese/50 font-typewriter hidden sm:table-cell">
            ${player.created_at ? player.created_at.split('T')[0] : 'HOY'}
          </td>
        </tr>
      `;
    }).join('');
  }
}
