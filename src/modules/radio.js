// SpicyCrust Synthwave Walkman Music Player Module
// Manages HTML5 audio streaming, cassette rotations, and UI triggers.

import { Sound } from './sound.js';

class WalkmanRadio {
  constructor() {
    this.tracks = [
      {
        title: "Synthwave Breeze",
        channel: "CH 1 // OUTRUN FM",
        url: "https://assets.mixkit.co/music/preview/mixkit-synthwave-breeze-277.mp3"
      },
      {
        title: "Retro Arcade Groover",
        channel: "CH 2 // CHIPTUNE BEATS",
        url: "https://assets.mixkit.co/music/preview/mixkit-retro-gaming-groover-265.mp3"
      },
      {
        title: "Slow Synthwave Grid",
        channel: "CH 3 // MIDNIGHT DEEP",
        url: "https://assets.mixkit.co/music/preview/mixkit-slow-retro-synth-wave-881.mp3"
      }
    ];

    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = 0.5;

    // DOM References
    this.widget = null;
    this.disc = null; // Walkman cassette tape container
    this.tonearm = null; // Walkman tape indicator/laser line
    this.playBtn = null;
    this.nextBtn = null;
    this.volumeSlider = null;
    this.titleText = null;
    this.channelText = null;
    this.minimizeBtn = null;
    this.restoreBtn = null;
    this.equalizer = null;
  }

  // Initialise the walkman components and bind DOM event listeners
  init() {
    this.widget = document.getElementById('vinyl-player-widget');
    this.disc = document.getElementById('vinyl-disc');
    this.tonearm = document.getElementById('tonearm');
    this.playBtn = document.getElementById('vinyl-play-btn');
    this.nextBtn = document.getElementById('vinyl-next-btn');
    this.volumeSlider = document.getElementById('vinyl-volume');
    this.titleText = document.getElementById('vinyl-track-title');
    this.channelText = document.getElementById('vinyl-track-channel');
    this.minimizeBtn = document.getElementById('vinyl-toggle-minimize');
    this.restoreBtn = document.getElementById('vinyl-restore-btn');
    this.equalizer = document.getElementById('walkman-equalizer');

    if (!this.widget) return;

    // Load initial metadata
    this.updateTrackMetadata();

    // Event listeners
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    this.nextBtn.addEventListener('click', () => this.playNextTrack());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    this.minimizeBtn.addEventListener('click', () => this.minimizePlayer());
    this.restoreBtn.addEventListener('click', () => this.restorePlayer());

    // Play blips on hover
    const hoverElements = [this.playBtn, this.nextBtn, this.volumeSlider, this.minimizeBtn, this.restoreBtn];
    hoverElements.forEach(el => {
      if (el) el.addEventListener('mouseenter', () => Sound.playHoverBlip());
    });
  }

  // Reveal the player inside the main dashboard viewport
  reveal() {
    if (!this.widget) return;
    this.widget.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
    this.widget.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
  }

  // Toggle play/pause stream and trigger relative animations
  togglePlayback() {
    Sound.playToggleSound();
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.playBtn.innerText = "⏸";
    this.playBtn.classList.add('brightness-125', 'bg-mafia-gold/20');
    
    // Set Audio Source if empty
    if (!this.audio.src) {
      this.audio.src = this.tracks[this.currentTrackIndex].url;
    }

    this.audio.play().catch(err => {
      console.warn("Audio playback blocked or interrupted:", err);
    });

    // Animation 1: Move laser pointer/tonearm
    if (this.tonearm) {
      this.tonearm.style.transform = "rotate(28deg)";
    }
    
    // Animation 2: Start Cassette reel rotation & Equalizer bars
    if (this.disc) {
      this.disc.classList.add('vinyl-spin');
    }
    if (this.equalizer) {
      this.equalizer.classList.remove('opacity-0');
      this.equalizer.classList.add('opacity-100');
    }
  }

  pause() {
    this.isPlaying = false;
    this.playBtn.innerText = "▶";
    this.playBtn.classList.remove('brightness-125', 'bg-mafia-gold/20');
    
    this.audio.pause();

    if (this.tonearm) {
      this.tonearm.style.transform = "rotate(0deg)";
    }

    if (this.disc) {
      const style = window.getComputedStyle(this.disc);
      const transform = style.getPropertyValue('transform');
      
      if (transform && transform !== 'none') {
        const values = transform.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        
        this.disc.classList.remove('vinyl-spin');
        this.disc.style.transform = `rotate(${angle + 30}deg)`;
      } else {
        this.disc.classList.remove('vinyl-spin');
      }
    }

    if (this.equalizer) {
      this.equalizer.classList.remove('opacity-100');
      this.equalizer.classList.add('opacity-0');
    }
  }

  playNextTrack() {
    Sound.playInsertCoin();
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    
    const wasPlaying = this.isPlaying;
    
    this.audio.pause();
    this.audio.src = this.tracks[this.currentTrackIndex].url;
    
    this.updateTrackMetadata();

    if (wasPlaying) {
      this.play();
    }
  }

  setVolume(val) {
    this.audio.volume = parseFloat(val);
  }

  updateTrackMetadata() {
    const track = this.tracks[this.currentTrackIndex];
    if (this.titleText) this.titleText.innerText = track.title;
    if (this.channelText) this.channelText.innerText = track.channel;
  }

  minimizePlayer() {
    Sound.playToggleSound();
    if (this.widget) {
      this.widget.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
      setTimeout(() => {
        if (this.restoreBtn) this.restoreBtn.classList.remove('hidden');
      }, 300);
    }
  }

  restorePlayer() {
    Sound.playToggleSound();
    if (this.restoreBtn) this.restoreBtn.classList.add('hidden');
    if (this.widget) {
      this.widget.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
      this.widget.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }
  }
}

// Export singleton instance
export const Radio = new WalkmanRadio();
