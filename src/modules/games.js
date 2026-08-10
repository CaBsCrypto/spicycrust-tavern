import { Sound } from './sound.js';

class GameSimulators {
  constructor() {
    this.loops = { game1: null, game2: null, game3: null, game4: null };
    this.active = false;

    // Estado de hover para cambiar el contenido del canvas dinámicamente
    this.hoverStates = {
      game1: false,
      game2: false,
      game3: false,
      game4: false
    };

    // Flags para indicar que el canvas ha dibujado un nuevo frame (Optimización de GPU)
    this.textureUpdated = {
      game1: true,
      game2: true,
      game3: true,
      game4: true
    };

    // Metadatos de cada juego para dibujar en el canvas
    this.gameInfo = {
      game1: { title: 'SLASH SLICE', rarity: 'ESPECIAL', color: '#d85f00', elixir: '3' },
      game2: { title: 'SPICY CHALLENGE', rarity: 'ÉPICO', color: '#d800a6', elixir: '5' },
      game3: { title: 'RHYTHM SLICE', rarity: 'LEGENDARIO', color: '#8a2be2', elixir: '4' },
      game4: { title: 'SLICE HUNTER', rarity: 'MÍTICO', color: '#00cc66', elixir: '2' }
    };

    // Instanciar e iniciar descarga inmediata de las imágenes en segundo plano al importar el módulo
    this.images = {
      game1: new Image(),
      game2: new Image(),
      game3: new Image(),
      game4: new Image()
    };
    
    this.images.game1.src = '/slashslice_preview.png';
    this.images.game2.src = '/spicychallenge_preview.png';
    this.images.game3.src = '/rhythmslice_preview.png';
    this.images.game4.src = '/slicehunter_preview.png';
  }

  // Inicializa todos los monitores a la vez
  start() {
    if (this.active) return;
    this.active = true;

    this.initCrustInvaders();
    this.initDoughDash();
    this.initPizzaSlasher();
    this.initSliceHunter();
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.loops.game1);
    cancelAnimationFrame(this.loops.game2);
    cancelAnimationFrame(this.loops.game3);
    cancelAnimationFrame(this.loops.game4);
  }

  // Helper para renderizar un preview de juego premium en un canvas
  renderPremiumPreview(canvasId, img, loopKey) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Configurar resolución interna estándar 16:9
    canvas.width = 480;
    canvas.height = 270;

    const loop = () => {
      if (!this.active) return;

      const isHovered = this.hoverStates[loopKey];

      // Optimización de Recursos: Throttle a ~15 FPS cuando no está hovered
      if (!isHovered) {
        const now = performance.now();
        if (!this.lastRenderTime) this.lastRenderTime = {};
        if (!this.lastRenderTime[loopKey]) this.lastRenderTime[loopKey] = 0;
        if (now - this.lastRenderTime[loopKey] < 66) {
          this.loops[loopKey] = requestAnimationFrame(loop);
          return;
        }
        this.lastRenderTime[loopKey] = now;
      }

      // Limpiar con fondo oscuro de taberna/speakeasy (caoba profundo)
      ctx.fillStyle = '#16110f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar la captura del juego
      if (img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        // Spinner de carga retro si aún no se ha cargado la imagen
        ctx.fillStyle = '#C5A059';
        ctx.font = '14px "Lilita One"';
        ctx.textAlign = 'center';
        ctx.fillText('CARGANDO...', canvas.width / 2, canvas.height / 2);
      }

      // Indicar que la textura ha sido actualizada y requiere re-carga en WebGL
      this.textureUpdated[loopKey] = true;

      this.loops[loopKey] = requestAnimationFrame(loop);
    };

    this.loops[loopKey] = requestAnimationFrame(loop);
  }

  // --- MONITORES DE JUEGO (Mapeados correctamente con sus capturas reales) ---
  
  // SLASH SLICE (Card 3 -> game-canvas-1)
  initCrustInvaders() {
    this.renderPremiumPreview('game-canvas-1', this.images.game1, 'game1');
  }

  // SPICY CHALLENGE (Card 2 -> game-canvas-2)
  initDoughDash() {
    this.renderPremiumPreview('game-canvas-2', this.images.game2, 'game2');
  }

  // RHYTHM SLICE (Card 1 -> game-canvas-3)
  initPizzaSlasher() {
    this.renderPremiumPreview('game-canvas-3', this.images.game3, 'game3');
  }

  // SLICE HUNTER (Card 4 -> game-canvas-4)
  initSliceHunter() {
    this.renderPremiumPreview('game-canvas-4', this.images.game4, 'game4');
  }
}

export const Games = new GameSimulators();
