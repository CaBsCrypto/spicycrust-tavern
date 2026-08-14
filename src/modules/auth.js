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

// Notificación Flotante Cyberpunk / Mafia (Reemplaza los alert nativos del navegador)
export function showCyberToast(title, message, icon = '🔺', duration = 4500) {
  const existing = document.querySelectorAll('.cyber-toast-notification');
  existing.forEach(el => el.remove());

  const notif = document.createElement('div');
  notif.className = 'cyber-toast-notification fixed top-6 right-6 z-[99999] bg-[#16110f]/95 border-2 border-[#C5A059]/60 rounded-2xl p-4 max-w-md w-[90vw] sm:w-96 shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col gap-2 transform -translate-y-6 opacity-0 transition-all duration-300 pointer-events-auto';
  
  notif.innerHTML = `
    <div class="flex items-center justify-between border-b border-[#C5A059]/25 pb-2">
      <div class="flex items-center gap-2 text-[#E5A93C] font-cinzel font-bold text-xs tracking-wider">
        <span class="text-base">${icon}</span>
        <span>${title.toUpperCase()}</span>
      </div>
      <button class="toast-close text-[#C5A059]/50 hover:text-[#C5A059] text-xs font-mono px-1 cursor-pointer transition-colors">✕</button>
    </div>
    <p class="text-xs text-[#EFEBE4]/90 font-typewriter tracking-wide leading-relaxed break-words whitespace-pre-wrap">
      ${message}
    </p>
  `;

  document.body.appendChild(notif);
  
  try {
    Sound.playHoverBlip();
  } catch (e) {}

  void notif.offsetWidth;
  notif.classList.remove('-translate-y-6', 'opacity-0');
  notif.classList.add('translate-y-0', 'opacity-100');

  const closeBtn = notif.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => removeToast(notif));
  }

  const timer = setTimeout(() => removeToast(notif), duration);

  function removeToast(el) {
    clearTimeout(timer);
    if (!el || !el.parentNode) return;
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('-translate-y-6', 'opacity-0');
    setTimeout(() => el.remove(), 350);
  }
}

export async function fetchAvaxBalance(address) {
  if (!isValidEvmAddress(address)) return '0.0000';
  try {
    const res = await fetch('https://api.avax-test.network/ext/bc/C/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    });
    const data = await res.json();
    if (data && data.result) {
      const balanceWei = BigInt(data.result);
      const balanceAvax = Number(balanceWei) / 1e18;
      return balanceAvax.toFixed(4);
    }
  } catch (err) {
    console.warn('[RPC] Could not fetch AVAX Fuji balance:', err);
  }
  return '0.0000';
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
    
    // Elementos del Dropdown de Perfil
    this.dropdown = document.getElementById('profile-dropdown');
    this.dropdownCopyBtn = document.getElementById('dropdown-copy-btn');
    this.dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
    this.dropdownAddressSpan = document.getElementById('dropdown-address');
    this.dropdownBalanceSpan = document.getElementById('dropdown-balance');
    this.dropdownFaucetBtn = document.getElementById('dropdown-faucet-btn');
    this.dropdownSignBtn = document.getElementById('dropdown-sign-btn');
    this.dropdownTxBtn = document.getElementById('dropdown-tx-btn');

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
        e.stopPropagation();
        Sound.playToggleSound();
        const activeWallet = getWalletCookie();
        if (activeWallet && isValidEvmAddress(activeWallet)) {
          this.toggleDropdown(activeWallet);
        } else {
          this.handlePrivyLogin();
        }
      });
    }

    // Eventos del Dropdown
    if (this.dropdownLogoutBtn) {
      this.dropdownLogoutBtn.addEventListener('click', () => {
        this.closeDropdown();
        this.logout();
      });
    }

    if (this.dropdownCopyBtn) {
      this.dropdownCopyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          navigator.clipboard.writeText(activeWallet);
          Sound.playHoverBlip();
          const origText = this.dropdownCopyBtn.textContent;
          this.dropdownCopyBtn.textContent = '✅ ¡COPIADO!';
          showCyberToast('Dirección Copiada', `Wallet ${activeWallet.substring(0, 8)}... copiada al portapapeles.`, '📋');
          setTimeout(() => {
            this.dropdownCopyBtn.textContent = origText;
          }, 2000);
        }
      });
    }

    // Botón Faucet de Prueba Directa (PK910 Proof of Work Direct Faucet)
    if (this.dropdownFaucetBtn) {
      this.dropdownFaucetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Sound.playHoverBlip();
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          navigator.clipboard.writeText(activeWallet);
        }
        showCyberToast(
          'Faucet Avalanche Fuji', 
          'Dirección copiada. Abriendo minador PK910 de prueba (100% libre sin registros)...', 
          '🚰', 
          5000
        );
        window.open('https://fuji-faucet.pk910.de/', '_blank');
      });
    }

    // Botón Prueba de Firma Relayer (Gasless Off-Chain)
    if (this.dropdownSignBtn) {
      this.dropdownSignBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        Sound.playHoverBlip();
        const activeWallet = getWalletCookie();
        if (!activeWallet) return;

        try {
          if (typeof window.PrivySignMessageTrigger === 'function') {
            const testPayload = `SpicyCrust Gasless Relayer Test:\nPlayer: ${activeWallet}\nScore: 77777\nTimestamp: ${Date.now()}`;
            const signature = await window.PrivySignMessageTrigger(testPayload);
            Sound.playInsertCoin();
            showCyberToast(
              'Firma Gasless Creada', 
              `Firma EIP-712 ($0 Gas):\n${signature.substring(0, 24)}...${signature.substring(signature.length - 12)}\n\nLista para enviar al Backend Relayer.`, 
              '⚡', 
              6000
            );
          } else {
            showCyberToast('Error de Firma', 'El SDK de Privy no está listo para firmar.', '⚠️');
          }
        } catch (err) {
          console.error('[RelayerTest] Error signing payload:', err);
          showCyberToast('Firma Cancelada', (err.message || err), '❌');
        }
      });
    }

    // Botón Emisión de Transacción On-Chain a Snowtrace
    if (this.dropdownTxBtn) {
      this.dropdownTxBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        Sound.playHoverBlip();
        const activeWallet = getWalletCookie();
        if (!activeWallet) return;

        try {
          if (typeof window.PrivySendTransactionTrigger === 'function') {
            const txHash = await window.PrivySendTransactionTrigger(activeWallet, '0x38D7EA4C68000');
            Sound.playInsertCoin();
            showCyberToast(
              'Transacción Enviada', 
              `Tx Hash en Avalanche Fuji:\n${txHash.substring(0, 20)}...\n\nAbriendo explorador Snowtrace...`, 
              '🚀', 
              6000
            );
            window.open(`https://testnet.snowtrace.io/tx/${txHash}`, '_blank');
          } else {
            showCyberToast('Error de Transacción', 'El SDK de Privy no está listo para emitir transacciones.', '⚠️');
          }
        } catch (err) {
          console.error('[TxTest] Error sending transaction:', err);
          showCyberToast('Transacción Fallida', (err.message || err) + '\n\nRequiere saldo AVAX de prueba.', '❌', 6000);
        }
      });
    }

    // Cerrar dropdown al hacer clic fuera
    window.addEventListener('click', (e) => {
      if (this.dropdown && !this.dropdown.classList.contains('hidden') && !this.dropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });

    const existing = getWalletCookie();
    if (existing) {
      broadcastWalletSync(existing);
    }
    this.updateHeaderUI();
  }

  static toggleDropdown(address) {
    if (!this.dropdown) return;
    if (this.dropdown.classList.contains('hidden')) {
      this.openDropdown(address);
    } else {
      this.closeDropdown();
    }
  }

  static async openDropdown(address) {
    if (!this.dropdown) return;

    if (this.dropdownAddressSpan) {
      this.dropdownAddressSpan.textContent = address;
    }

    if (this.dropdownBalanceSpan) {
      this.dropdownBalanceSpan.textContent = 'Cargando...';
      const bal = await fetchAvaxBalance(address);
      this.dropdownBalanceSpan.textContent = `${bal} AVAX`;
    }

    this.dropdown.classList.remove('hidden');
    void this.dropdown.offsetWidth;
    this.dropdown.classList.remove('opacity-0', 'scale-95');
    this.dropdown.classList.add('opacity-100', 'scale-100');
  }

  static closeDropdown() {
    if (!this.dropdown) return;

    this.dropdown.classList.remove('opacity-100', 'scale-100');
    this.dropdown.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      this.dropdown.classList.add('hidden');
    }, 200);
  }

  static async handlePrivyLogin() {
    Sound.playHoverBlip();

    if (ENABLE_PRIVY && typeof window.PrivyLoginTrigger === 'function') {
      window.PrivyLoginTrigger();
      return;
    }

    // Fallback local en desarrollo si Privy está desactivado
    const derivedAddress = await this.deriveEvmAddress('test_player_avalanche_fuji_spicycrust');
    this.loginSuccess(derivedAddress);
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
      showCyberToast(
        lang === 'en' ? 'Wallet Connected' : 'Billetera Conectada',
        lang === 'en' 
          ? `Connected to Avalanche Fuji: ${shortAddr}` 
          : `Billetera Avalanche Fuji conectada: ${shortAddr}`,
        '🟢'
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
    showCyberToast(
      lang === 'en' ? 'Session Closed' : 'Sesión Cerrada',
      lang === 'en' ? 'Avalanche Wallet disconnected.' : 'Billetera Avalanche desconectada.',
      '🚪'
    );
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
