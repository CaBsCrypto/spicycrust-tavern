import { Sound } from './sound.js';

export function initModals() {
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const docsBtn = document.getElementById('docs-btn');
  
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const docsModal = document.getElementById('docs-modal');
  
  const leaderboardClose = document.getElementById('leaderboard-close');
  const docsClose = document.getElementById('docs-close');

  const trophyBtn = document.getElementById('trophy-btn');

  // --- LEADERBOARD MODAL ---
  if (leaderboardBtn && leaderboardModal && leaderboardClose) {
    const handleOpenLeaderboard = (e) => {
      e.preventDefault();
      Sound.playToggleSound();
      openModal(leaderboardModal);
      populateLeaderboard();
    };

    leaderboardBtn.addEventListener('mouseenter', () => Sound.playHoverBlip());
    leaderboardBtn.addEventListener('click', handleOpenLeaderboard);

    leaderboardClose.addEventListener('mouseenter', () => Sound.playHoverBlip());
    leaderboardClose.addEventListener('click', () => {
      Sound.playToggleSound();
      closeModal(leaderboardModal);
    });
  }

  // --- DOCS / WIKI MODAL ---
  if (docsBtn && docsModal && docsClose) {
    docsBtn.addEventListener('mouseenter', () => Sound.playHoverBlip());
    
    docsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Sound.playToggleSound();
      openModal(docsModal);
    });

    docsClose.addEventListener('mouseenter', () => Sound.playHoverBlip());
    docsClose.addEventListener('click', () => {
      Sound.playToggleSound();
      closeModal(docsModal);
    });
  }

  // Cerrar modales al hacer clic fuera del panel de contenido
  window.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
      Sound.playToggleSound();
      closeModal(leaderboardModal);
    }
    if (e.target === docsModal) {
      Sound.playToggleSound();
      closeModal(docsModal);
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

  // Rellenar dinámicamente la tabla de Leaderboard con soporte persistente
  const defaultHighscores = [
    { name: 'ROYAL_KING', game: 'Rhythm Slice', score: 184300, verified: true },
    { name: 'ELIXIR_KNIGHT', game: 'Spicy Challenge', score: 162900, verified: true },
    { name: 'PIZZA_PRINCESS', game: 'Slash Slice', score: 145000, verified: false },
    { name: 'GOBLIN_SLICE', game: 'Rhythm Slice', score: 121400, verified: true },
    { name: 'CROWN_CHEF', game: 'Slash Slice', score: 98150, verified: false }
  ];

  function populateLeaderboard() {
    const tableBody = document.getElementById('leaderboard-tbody');
    if (!tableBody) return;

    let scores = JSON.parse(localStorage.getItem('clandestine_highscores'));
    if (!scores) {
      scores = defaultHighscores;
      localStorage.setItem('clandestine_highscores', JSON.stringify(scores));
    }

    scores.sort((a, b) => b.score - a.score);

    tableBody.innerHTML = scores.map((player, idx) => `
      <tr class="border-b border-mafia-gold/10 hover:bg-[#3d1d07]/20 transition-colors">
        <td class="px-4 py-3 font-arcade text-xs text-center ${
          idx === 0 ? 'text-mafia-amber' : idx === 1 ? 'text-mafia-gold' : 'text-mafia-gold/50'
        }">${idx + 1}</td>
        <td class="px-4 py-3 font-semibold text-provolone-cheese flex items-center gap-2">
          ${player.name}
          ${player.verified ? `
            <span class="text-[9px] bg-mafia-green/20 text-provolone-cheese px-1.5 py-0.5 rounded border border-mafia-green/40 flex items-center font-typewriter">
              [ZK_VERIFIED]
            </span>
          ` : ''}
        </td>
        <td class="px-4 py-3 text-xs text-provolone-cheese/70 font-typewriter">${player.game}</td>
        <td class="px-4 py-3 text-right font-arcade text-xs text-mafia-amber glow-amber">${player.score.toLocaleString()}</td>
      </tr>
    `).join('');
  }

  // Capturar registro del formulario
  const recordForm = document.getElementById('record-form');
  if (recordForm) {
    recordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('record-name');
      const gameInput = document.getElementById('record-game');
      const scoreInput = document.getElementById('record-score');
      
      if (!nameInput || !gameInput || !scoreInput) return;
      
      const name = nameInput.value.toUpperCase().trim();
      const game = gameInput.value;
      const score = parseInt(scoreInput.value) || 0;
      
      if (!name || score <= 0) return;
      
      Sound.playInsertCoin();
      
      let currentScores = JSON.parse(localStorage.getItem('clandestine_highscores')) || defaultHighscores;
      currentScores.push({ name, game, score, verified: true });
      
      currentScores.sort((a, b) => b.score - a.score);
      if (currentScores.length > 8) {
        currentScores = currentScores.slice(0, 8);
      }
      
      localStorage.setItem('clandestine_highscores', JSON.stringify(currentScores));
      
      nameInput.value = '';
      scoreInput.value = '';
      
      populateLeaderboard();
    });
  }
}
