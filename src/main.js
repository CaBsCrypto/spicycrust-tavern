import './style.css';
import { Sound } from './modules/sound.js';
import { initUnboxing3D } from './modules/unboxing3d.js';
import { Games } from './modules/games.js';
import { initModals } from './modules/modals.js';
import { initLeads } from './modules/leads.js';
import { initLogo3D } from './modules/logo3d.js';
import { initCabinet3D } from './modules/cabinet3d.js';
import { initTranslations } from './modules/translation.js';
import { AuthSystem, getWalletCookie } from './modules/auth.js';
import { GAME_URLS, GAME_META } from './config/games.js';

// Inicialización general al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar sistema de autenticación multi-modal
  AuthSystem.init();
  
  // Iniciar traducciones
  initTranslations();
  
  // Iniciar los bucles concurrentes de los Canvases de juegos inmediatamente
  // para que se dibujen en segundo plano durante la introducción 3D
  Games.start();
  
  // 1. Iniciar la fase cinemática de unboxing en 3D (Three.js)
  // Al completarse la animación 3D de apertura de la caja, se ejecuta el callback.
  initUnboxing3D(() => {
    
    // --- DASHBOARD DESBLOQUEADO ---
    

    
    // Inicializar el logo 3D giratorio
    initLogo3D();

    // Inicializar los armarios interactivos 3D de las cartas de juego
    initCabinet3D();
    
    // Inicializar modales de Leaderboard y Docs
    initModals();
    
    // Inicializar el captador de leads de la tarjeta 4
    initLeads();
    
    // Inicializar listeners de sonido e interacciones del Dashboard
    setupDashboardInteractions();
  });

  // Efectos de sonido preliminares durante la fase de carga (Unboxing Button)
  const openBoxBtn = document.getElementById('open-box-btn');
  if (openBoxBtn) {
    openBoxBtn.addEventListener('mouseenter', () => Sound.playHoverBlip());
  }
});

// Orquesta todas las micro-interacciones post-unboxing
function setupDashboardInteractions() {
  
  // El botón de sonido ha sido removido por requerimiento del usuario (música desactivada).

  // 2. Adjuntar Blips chiptunes a enlaces de navegación y botones
  const hoverElements = [
    document.getElementById('nav-home'),
    document.getElementById('leaderboard-btn'),
    document.getElementById('docs-btn'),
    document.getElementById('leaderboard-close'),
    document.getElementById('docs-close'),
    document.querySelector('#record-form button[type="submit"]')
  ];

  hoverElements.forEach(el => {
    if (el) {
      el.addEventListener('mouseenter', () => Sound.playHoverBlip());
    }
  });

  // Sonido al enviar formulario de récords
  const recordForm = document.getElementById('record-form');
  if (recordForm) {
    recordForm.addEventListener('submit', () => {
      Sound.playHoverBlip();
    });
  }

  // 3. Controladores de los Botones "JUGAR AHORA / INSERT COIN"
  const playButtons = document.querySelectorAll('.play-btn');
  
  playButtons.forEach(btn => {
    // Sonido blip al pasar el cursor sobre la tarjeta/botón
    btn.addEventListener('mouseenter', () => Sound.playHoverBlip());
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const gameType = btn.getAttribute('data-game');
      
      // Redirecciones a juegos — URL resuelta por entorno con transmisión de billetera EVM
      const baseUrl = GAME_URLS[gameType];
      if (baseUrl) {
        const activeWallet = getWalletCookie();
        const fullUrl = activeWallet 
          ? `${baseUrl}?embed=1&mode=game&address=${encodeURIComponent(activeWallet)}`
          : `${baseUrl}?mode=game`;
        window.location.href = fullUrl;
      }
    });
  });
}

// Crea una notificación cyberpunk dinámica en la esquina de la pantalla
function showCyberNotification(gameType) {
  const meta = GAME_META[gameType] ?? {}
  const titles = {
    invaders: meta.opTitle ?? 'OPERACIÓN: SLASH SLICE // RETRO ARCADE',
    dash: meta.opTitle ?? 'OPERACIÓN: SPICY CHALLENGE // ZK SHIELDED',
    slasher: meta.opTitle ?? 'OPERACIÓN: RHYTHM SLICE // SECURE ZKP'
  };

  const msgs = {
    invaders: meta.opMsg ?? 'Abriendo terminal de corte retro de la Famiglia.',
    dash: meta.opMsg ?? 'Estableciendo tablero blindado ZK en Midnight L2.',
    slasher: meta.opMsg ?? 'Estableciendo túnel ZK con la red Stellar.'
  };

  // Crear elemento de notificación clandestina flotante
  const notif = document.createElement('div');
  notif.className = 'fixed bottom-6 right-6 z-50 cyber-glass border border-mafia-gold/30 rounded-lg p-5 max-w-sm w-[90%] shadow-[0_0_20px_rgba(229,169,60,0.15)] flex flex-col gap-2 transform translate-y-12 opacity-0 transition-all duration-500';
  
  notif.innerHTML = `
    <div class="flex items-center gap-2 text-mafia-amber font-cinzel font-black text-[11px] tracking-wider">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-mafia-amber opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-mafia-amber"></span>
      </span>
      ${titles[gameType] || 'OPERACIONES CLANDESTINAS'}
    </div>
    <p class="text-[11px] text-provolone-cheese/90 font-typewriter tracking-wide leading-relaxed">
      ${msgs[gameType] || 'Operación de contrabando inicializada correctamente.'}
    </p>
    <div class="text-[8px] text-mafia-gold/40 font-typewriter text-right mt-1">
      STATUS: CLANDESTINE_OPS_ACTIVE
    </div>
  `;

  document.body.appendChild(notif);
  
  // Activar entrada chiptune
  Sound.playHoverBlip();

  // Forzar reflow para animación
  void notif.offsetWidth;
  notif.classList.remove('translate-y-12', 'opacity-0');
  notif.classList.add('translate-y-0', 'opacity-100');

  // Programar desvanecimiento y remoción
  setTimeout(() => {
    notif.classList.remove('translate-y-0', 'opacity-100');
    notif.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => notif.remove(), 600);
  }, 4000);
}
