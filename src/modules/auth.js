import { Sound } from './sound.js';
import { initPrivyReactBridge } from '../components/PrivyAuthBridge.jsx';

// Configuración de variables de entorno para Privy & Avalanche C-Chain
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmqdk627p00na0cjsi6ioszjx';
const HUB_ORIGIN_URL = import.meta.env.VITE_HUB_ORIGIN_URL || 'https://spicycrust.com';
const ENABLE_PRIVY = import.meta.env.VITE_ENABLE_PRIVY !== 'false'; // Toggle ON por defecto

export function isPrivyEnabled() {
  return ENABLE_PRIVY;
}

// Check si una dirección es un formato EVM válido (0x + 40 hex chars)
export function isValidEvmAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helpers para manejo de Cookies compartidas (.spicycrust.com)
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

// Transmisión de sesión vía postMessage (Cross-Domain)
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
    this.triggerBtn = document.getElementById('trophy-btn'); // Botón principal "CONECTAR WALLET"

    // Escuchar mensajes entrantes (postMessage) desde subdominios/juegos
    window.addEventListener('message', (event) => {
      const { type, address } = event.data || {};
      if ((type === 'HUB_WALLET_SYNC' || type === 'GAME_WALLET_SYNC') && isValidEvmAddress(address)) {
        const current = getWalletCookie();
        if (current !== address) {
          this.loginSuccess(address, false);
        }
      }
    });

    // Inicializar el Bridge de React con PrivyProvider oficial
    if (ENABLE_PRIVY) {
      initPrivyReactBridge();
    }

    // Vincular apertura de login con el modal oficial de Privy
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playToggleSound();
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          this.logout();
        } else {
          this.handlePrivyLogin();
        }
      });
    }

    // Verificar estado inicial y sincronizar
    const existing = getWalletCookie();
    if (existing) {
      broadcastWalletSync(existing);
    }
    this.updateHeaderUI();
  }

  // Lanza directamente el Modal Oficial Nativo de Privy SDK
  static async handlePrivyLogin() {
    Sound.playHoverBlip();

    if (ENABLE_PRIVY && typeof window.PrivyLoginTrigger === 'function') {
      window.PrivyLoginTrigger();
      return;
    }

    // Fallback amigable si VITE_ENABLE_PRIVY=false
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

  // Generar una dirección EVM determinista (0x...) para fallbacks
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
