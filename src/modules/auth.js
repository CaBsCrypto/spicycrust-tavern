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
          setTimeout(() => {
            this.dropdownCopyBtn.textContent = origText;
          }, 2000);
        }
      });
    }

    // Botón Faucet de Prueba Directa (Core App Oficial & Chainstack)
    if (this.dropdownFaucetBtn) {
      this.dropdownFaucetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Sound.playHoverBlip();
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          navigator.clipboard.writeText(activeWallet);
        }
        
        const choice = prompt(
          "Selecciona un Faucet activo de Avalanche Fuji (Dirección 0x... copiada):\n\n" +
          "1. Core App Testnet Faucet (Oficial Ava Labs)\n" +
          "2. Chainstack Faucet\n" +
          "3. QuickNode Faucet\n\n" +
          "Ingresa 1, 2 o 3:",
          "1"
        );

        if (choice === "2") {
          window.open('https://faucet.chainstack.com/avalanche-fuji-faucet', '_blank');
        } else if (choice === "3") {
          window.open('https://faucet.quicknode.com/avalanche/fuji', '_blank');
        } else if (choice !== null) {
          window.open('https://core.app/tools/testnet-faucet/', '_blank');
        }
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
            alert(`✅ FIRMA DIGITAL OFF-CHAIN GENERADA EXITOSAMENTE:\n\nPayload:\n${testPayload}\n\nFirma criptográfica (EIP-712):\n${signature.substring(0, 30)}...${signature.substring(signature.length - 20)}\n\nEsta firma es gratuita (0$ Gas) y es la que el jugador le entregaría al Backend Relayer.`);
          } else {
            alert('El SDK de Privy no está listo para firmar.');
          }
        } catch (err) {
          console.error('[RelayerTest] Error signing payload:', err);
          alert('No se completó la firma: ' + (err.message || err));
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
            alert(`🎉 ¡TRANSACCIÓN ON-CHAIN EMITIDA EXITOSAMENTE A AVALANCHE FUJI!\n\nTx Hash:\n${txHash}\n\nSe abrirá el explorador Snowtrace en vivo.`);
            window.open(`https://testnet.snowtrace.io/tx/${txHash}`, '_blank');
          } else {
            alert('El SDK de Privy no está listo para emitir transacciones.');
          }
        } catch (err) {
          console.error('[TxTest] Error sending transaction:', err);
          alert('Error en transacción: ' + (err.message || err) + '\n\nRequiere saldo AVAX de prueba (usa el botón de Faucet arriba).');
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
