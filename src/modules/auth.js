import { Sound } from './sound.js';
import { initPrivyReactBridge } from '../components/PrivyAuthBridge.jsx';

// Configuración de variables de entorno para Privy & Avalanche C-Chain
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmqdk627p00na0cjsi6ioszjx';
const HUB_ORIGIN_URL = import.meta.env.VITE_HUB_ORIGIN_URL || 'https://spicycrust.com';
const ENABLE_PRIVY = import.meta.env.VITE_ENABLE_PRIVY !== 'false';

export function isPrivyEnabled() {
  return ENABLE_PRIVY;
}

export function isValidEvmAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function setWalletCookie(address) {
  if (!address) return;
  const isProd = window.location.hostname.endsWith('spicycrust.com');
  const domain = isProd ? '; domain=.spicycrust.com' : '';
  document.cookie = `avalanche_wallet=${address}${domain}; path=/; max-age=86400; Secure; SameSite=Lax`;
  document.cookie = `evm_wallet=${address}${domain}; path=/; max-age=86400; Secure; SameSite=Lax`;
}

export function getWalletCookie() {
  const match = document.cookie.match(new RegExp('(^| )(avalanche_wallet|evm_wallet)=([^;]+)'));
  return match ? match[3] : null;
}

export function deleteWalletCookie() {
  const isProd = window.location.hostname.endsWith('spicycrust.com');
  const domain = isProd ? '; domain=.spicycrust.com' : '';
  document.cookie = `avalanche_wallet=; path=/; max-age=0${domain}; Secure; SameSite=Lax`;
  document.cookie = `evm_wallet=; path=/; max-age=0${domain}; Secure; SameSite=Lax`;
}

export function broadcastWalletSync(address) {
  const payload = {
    type: 'HUB_WALLET_SYNC',
    address: address || null,
    chain: 'avalanche-fuji',
    chainId: 43113,
    hubOrigin: HUB_ORIGIN_URL
  };

  try {
    window.postMessage(payload, '*');
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.contentWindow?.postMessage(payload, '*');
    });
  } catch (err) {
    console.warn('[SessionSync] Error broadcasting postMessage:', err);
  }
}

export class AuthSystem {
  static init() {
    window.AuthSystemUpdateUI = () => this.updateHeaderUI();
    this.triggerBtn = document.getElementById('trophy-btn');
    
    // Modal de Perfil
    this.profileModal = document.getElementById('profile-modal');
    this.profileCloseBtn = document.getElementById('profile-close');
    this.profileCopyBtn = document.getElementById('profile-copy-btn');
    this.profileLogoutBtn = document.getElementById('profile-logout-btn');
    this.profileAddressSpan = document.getElementById('profile-address');

    // Listener postMessage
    window.addEventListener('message', (event) => {
      const { type, address } = event.data || {};
      if ((type === 'HUB_WALLET_SYNC' || type === 'GAME_WALLET_SYNC') && isValidEvmAddress(address)) {
        const current = getWalletCookie();
        if (current !== address) {
          this.loginSuccess(address, false);
        }
      }
    });

    if (ENABLE_PRIVY) {
      initPrivyReactBridge();
    }

    // Al hacer clic en el botón del header
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playToggleSound();
        const activeWallet = getWalletCookie();
        if (activeWallet && isValidEvmAddress(activeWallet)) {
          // Si ya está logueado, ABRIR PERFIL (en lugar de desconectar directo)
          this.openProfileModal(activeWallet);
        } else {
          // Si no está logueado, abrir modal de Privy
          this.handlePrivyLogin();
        }
      });
    }

    // Controles del modal de perfil
    if (this.profileCloseBtn) {
      this.profileCloseBtn.addEventListener('click', () => {
        Sound.playToggleSound();
        this.closeProfileModal();
      });
    }

    if (this.profileLogoutBtn) {
      this.profileLogoutBtn.addEventListener('click', () => {
        this.closeProfileModal();
        this.logout();
      });
    }

    if (this.profileCopyBtn) {
      this.profileCopyBtn.addEventListener('click', () => {
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          navigator.clipboard.writeText(activeWallet);
          Sound.playHoverBlip();
          const origText = this.profileCopyBtn.textContent;
          this.profileCopyBtn.textContent = '✅ ¡COPIADO!';
          setTimeout(() => {
            this.profileCopyBtn.textContent = origText;
          }, 2000);
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.profileModal) {
        Sound.playToggleSound();
        this.closeProfileModal();
      }
    });

    const existing = getWalletCookie();
    if (existing) {
      broadcastWalletSync(existing);
    }
    this.updateHeaderUI();
  }

  static openProfileModal(address) {
    if (!this.profileModal) return;

    if (this.profileAddressSpan) {
      this.profileAddressSpan.textContent = address;
    }

    this.profileModal.classList.remove('hidden');
    void this.profileModal.offsetWidth;
    this.profileModal.style.opacity = '1';
    
    const panel = this.profileModal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
    }
  }

  static closeProfileModal() {
    if (!this.profileModal) return;

    this.profileModal.style.opacity = '0';
    const panel = this.profileModal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(0.95)';
      panel.style.opacity = '0';
    }
    setTimeout(() => {
      this.profileModal.classList.add('hidden');
    }, 300);
  }

  static async handlePrivyLogin() {
    Sound.playHoverBlip();

    if (ENABLE_PRIVY && typeof window.PrivyLoginTrigger === 'function') {
      window.PrivyLoginTrigger();
      return;
    }

    const email = prompt(
      window.localStorage.getItem('lang') === 'en'
        ? 'Enter your Email for local test session:'
        : 'Ingresa tu Correo para sesión de prueba local:'
    );

    if (email) {
      const derivedAddress = await this.deriveEvmAddress(email.toLowerCase().trim() + '_avalanche_fuji_spicycrust');
      this.loginSuccess(derivedAddress);
    }
  }

  static async deriveEvmAddress(seedText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(seedText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.slice(0, 20).map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hex;
  }

  static loginSuccess(address, notifyUser = true) {
    if (!isValidEvmAddress(address)) {
      console.error('[AuthSystem] Invalid EVM address provided:', address);
      return;
    }

    Sound.playInsertCoin();
    setWalletCookie(address);
    broadcastWalletSync(address);
    this.updateHeaderUI();
    
    if (notifyUser) {
      const lang = window.localStorage.getItem('lang');
      const shortAddr = `${address.substring(0, 6)}...${address.substring(38)}`;
      alert(
        lang === 'en' 
          ? `Connected to Avalanche Fuji: ${shortAddr}` 
          : `Billetera Avalanche Fuji conectada: ${shortAddr}`
      );
    }
  }

  static logout() {
    Sound.playToggleSound();
    deleteWalletCookie();
    broadcastWalletSync(null);

    if (typeof window.PrivyLogoutTrigger === 'function') {
      window.PrivyLogoutTrigger();
    }

    this.updateHeaderUI();
    const lang = window.localStorage.getItem('lang');
    alert(lang === 'en' ? 'Avalanche Wallet disconnected.' : 'Billetera Avalanche desconectada.');
  }

  static updateHeaderUI() {
    const activeWallet = getWalletCookie();
    const trophySpan = document.querySelector('[data-t="trophies"]');
    
    if (activeWallet && isValidEvmAddress(activeWallet)) {
      const shortAddr = `${activeWallet.substring(0, 6)}...${activeWallet.substring(activeWallet.length - 4)}`;
      if (trophySpan) {
        trophySpan.textContent = `🔺 ${shortAddr}`;
      }
    } else {
      const lang = window.localStorage.getItem('lang') || 'es';
      if (trophySpan) {
        trophySpan.textContent = lang === 'es' ? '🏆 CONECTAR WALLET' : '🏆 CONNECT WALLET';
      }
    }
  }
}
