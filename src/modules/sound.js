// SpicyCrust Web Audio API Procedural Chiptune & SFX Synthesizer
// Genera sonido retro de 8-bits en tiempo real mediante código puro.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicActive = false;
    this.masterVolume = null;
    this.sfxVolume = null;
  }

  // Inicializa el AudioContext bajo interacción del usuario
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(err => console.warn('Failed to resume context:', err));
      }
      return;
    }
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Nodos de volumen
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.value = 0.4;
      this.masterVolume.connect(this.ctx.destination);
      
      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.value = 0.3;
      this.sfxVolume.connect(this.masterVolume);

      // Desbloqueo global ante cualquier clic o tecla
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
          });
        }
      };
      document.addEventListener('click', unlock);
      document.addEventListener('keydown', unlock);

    } catch (err) {
      console.error('Failed to initialize SoundEngine:', err);
    }
  }

  // Activa / Desactiva la música de fondo (desactivada por requerimiento)
  toggleMusic(forceState = null) {
    return false;
  }

  // SFX: Blip retro clásico al pasar el mouse por encima de un botón o tarjeta
  playHoverBlip() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume);
    
    osc.type = 'square';
    // Deslizamiento rápido de frecuencia hacia arriba (efecto chirp)
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // SFX: Tono doble clásico de moneda de arcade al pulsar jugar
  playInsertCoin() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    
    // Nota 1: E5 (659.25 Hz)
    this.playTone(659.25, 0.08, 'square', now);
    
    // Nota 2: B5 (987.77 Hz) retrasado por 0.08s
    this.playTone(987.77, 0.22, 'square', now + 0.08);
  }

  // Reproduce un tono puro
  playTone(freq, duration, type, startTime) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gainNode.gain.setValueAtTime(0.25, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // SFX: Sonido de transición masiva láser-explosión al abrir la caja de pizza
  playUnboxingSound() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const now = this.ctx.currentTime;
    
    // Canal 1: Sweep de frecuencia láser descendente
    const osc1 = this.ctx.createOscillator();
    const gainNode1 = this.ctx.createGain();
    osc1.connect(gainNode1);
    gainNode1.connect(this.sfxVolume);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2200, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 1.2);
    
    gainNode1.gain.setValueAtTime(0.4, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    
    osc1.start(now);
    osc1.stop(now + 1.3);
    
    // Canal 2: Ruido blanco / Explosión de vapor
    // Creamos un buffer de audio corto lleno de valores aleatorios
    const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 segundos
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Filtro pasa-bajos para amortiguar la explosión en el tiempo
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 1.4);
    
    const gainNode2 = this.ctx.createGain();
    gainNode2.gain.setValueAtTime(0.6, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    noiseSource.connect(filter);
    filter.connect(gainNode2);
    gainNode2.connect(this.sfxVolume);
    
    noiseSource.start(now);
    noiseSource.stop(now + 1.5);
  }

  // SFX: Blip de activación mecánica corto para los toggles
  playToggleSound() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(150, now + 0.03);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const Sound = new SoundEngine();
