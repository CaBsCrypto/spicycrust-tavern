import { Sound } from './sound.js';

export function initLeads() {
  const leadForm = document.getElementById('lead-form');
  const emailInput = document.getElementById('lead-email');
  const submitBtn = document.getElementById('lead-submit-btn');
  const statusMsg = document.getElementById('lead-status');
  
  const lockedOverlay = document.getElementById('locked-card-overlay');
  const unlockedOverlay = document.getElementById('unlocked-card-overlay');
  
  if (!leadForm || !emailInput || !submitBtn || !statusMsg) return;

  // Efecto de sonido leve al pasar el mouse por encima del botón
  submitBtn.addEventListener('mouseenter', () => Sound.playHoverBlip());

  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    // 1. Validación de Sintaxis
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Sound.playToggleSound();
      showStatus('ERROR: CREDENCIAL INVÁLIDA // CORREO INVÁLIDO', 'text-mafia-red');
      return;
    }

    // 2. Transición de Carga Blockchain Clandestina (Simulada)
    emailInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'pointer-events-none');
    
    let step = 0;
    const progressTexts = [
      'PREPARANDO EL CONTRABANDO...',
      'FORJANDO LA LLAVE DE LA BÓVEDA...',
      'REGISTRANDO MIEMBRO EN LA FAMIGLIA...',
      'GENERANDO ACCESO COSA NOSTRA...'
    ];

    Sound.playHoverBlip();
    showStatus(progressTexts[0], 'text-mafia-amber animate-pulse');

    const progressInterval = setInterval(() => {
      step++;
      if (step < progressTexts.length) {
        Sound.playHoverBlip();
        showStatus(progressTexts[step], 'text-mafia-amber animate-pulse');
      } else {
        clearInterval(progressInterval);
        
        // 3. Registro Exitoso y Desbloqueo
        saveLead(email);
        Sound.playInsertCoin();
        
        // Generar un ID de Jugador único aleatorio
        const randomId = 'CHEF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Ocultar formulario de entrada y mostrar panel de Éxito
        if (lockedOverlay && unlockedOverlay) {
          lockedOverlay.classList.add('opacity-0', 'scale-95');
          
          setTimeout(() => {
            lockedOverlay.classList.add('hidden');
            unlockedOverlay.classList.remove('hidden');
            
            // Forzar reflow para animación
            void unlockedOverlay.offsetWidth;
            unlockedOverlay.classList.remove('opacity-0', 'scale-95');
            unlockedOverlay.classList.add('opacity-100', 'scale-100');
            
            // Insertar ID en el HTML
            const idBadge = document.getElementById('beta-gamer-id');
            if (idBadge) idBadge.innerText = randomId;
          }, 300);
        }
      }
    }, 600);
  });

  function showStatus(text, colorClass) {
    statusMsg.className = `text-[10px] font-mono text-center mt-3 tracking-wider ${colorClass}`;
    statusMsg.innerText = text;
  }

  function saveLead(email) {
    let leads = [];
    try {
      const stored = localStorage.getItem('spicycrust_beta_leads');
      if (stored) leads = JSON.parse(stored);
    } catch (e) {
      console.error('Error leyendo localStorage', e);
    }
    
    if (!leads.includes(email)) {
      leads.push(email);
      localStorage.setItem('spicycrust_beta_leads', JSON.stringify(leads));
    }
  }
}
