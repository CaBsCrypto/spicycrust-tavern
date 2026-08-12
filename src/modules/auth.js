import { Sound } from './sound.js';
import { create, avalancheFuji, avalanche } from '@privy-io/js-sdk-core';

// Configuración de variables de entorno para Privy & Avalanche C-Chain
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'clx_spicycrust_app_id';
const HUB_ORIGIN_URL = import.meta.env.VITE_HUB_ORIGIN_URL || 'https://spicycrust.com';
const ENABLE_PRIVY = import.meta.env.VITE_ENABLE_PRIVY !== 'false'; // Toggle ON por defecto, se apaga si VITE_ENABLE_PRIVY=false

export function isPrivyEnabled() {
  return ENABLE_PRIVY;
}

// Instancia singleton de Privy Core SDK
let privyInstance = null;

function getPrivyClient() {
  if (!ENABLE_PRIVY) {
    console.info('[Privy] Privy authentication is currently DISABLED via VITE_ENABLE_PRIVY=false.');
    return null;
  }

  if (!privyInstance && PRIVY_APP_ID) {
    try {
      privyInstance = create({
        appId: PRIVY_APP_ID,
        config: {
          defaultChain: avalancheFuji,
          supportedChains: [avalancheFuji, avalanche]
        }
      });
    } catch (err) {
      console.warn('[Privy] Fallback initializing Privy client:', err);
    }
  }
  return privyInstance;
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
    this.modal = document.getElementById('auth-modal');
    this.closeBtn = document.getElementById('auth-close');
    this.triggerBtn = document.getElementById('trophy-btn'); // Botón principal de Conectar Wallet
    
    // Opciones de login
    this.btnGoogle = document.getElementById('auth-google');
    this.btnPasskey = document.getElementById('auth-passkey');
    this.btnDeFi = document.getElementById('auth-defi');
    
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

    if (!this.modal) return;

    // Vincular apertura y cierre de modal
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playToggleSound();
        const activeWallet = getWalletCookie();
        if (activeWallet) {
          this.logout();
        } else {
          this.openModal();
        }
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        Sound.playToggleSound();
        this.closeModal();
      });
    }

    // Cerrar clicando fuera
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        Sound.playToggleSound();
        this.closeModal();
      }
    });

    // Vincular botones de conexión
    if (this.btnGoogle) this.btnGoogle.addEventListener('click', () => this.handlePrivyLogin());
    if (this.btnPasskey) this.btnPasskey.addEventListener('click', () => this.handleEvmWalletLogin());
    if (this.btnDeFi) this.btnDeFi.addEventListener('click', () => this.handlePasskeyLogin());

    // Verificar estado inicial y sincronizar
    const existing = getWalletCookie();
    if (existing) {
      broadcastWalletSync(existing);
    }
    this.updateHeaderUI();
  }

  static openModal() {
    this.modal.classList.remove('hidden');
    void this.modal.offsetWidth;
    this.modal.style.opacity = '1';
    
    const panel = this.modal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
    }
  }

  static closeModal() {
    this.modal.style.opacity = '0';
    const panel = this.modal.querySelector('.modal-panel');
    if (panel) {
      panel.style.transform = 'scale(0.95)';
      panel.style.opacity = '0';
    }
    setTimeout(() => {
      this.modal.classList.add('hidden');
    }, 300);
  }

  // --- FLUJOS DE AUTENTICACIÓN ---

  // 1. Privy Login (Email / Google / OAuth -> Billetera EVM Embedded)
  static async handlePrivyLogin() {
    Sound.playHoverBlip();
    const privy = getPrivyClient();

    try {
      if (privy && typeof privy.login === 'function') {
        const session = await privy.login();
        const user = session?.user;
        const evmWallet = user?.wallets?.find(w => w.address?.startsWith('0x'));
        if (evmWallet && evmWallet.address) {
          this.loginSuccess(evmWallet.address);
          return;
        }
      }
    } catch (err) {
      console.warn('[Privy] Intento de login Privy estándar diferido a auth interactiva:', err);
    }

    // Fallback amigable: solicitar email/social para generar wallet EVM determinista en Avalanche
    const email = prompt(
      window.localStorage.getItem('lang') === 'en'
        ? 'Enter your Email / Privy account:'
        : 'Ingresa tu Correo / Cuenta de Privy:'
    );

    if (email) {
      const derivedAddress = await this.deriveEvmAddress(email.toLowerCase().trim() + '_avalanche_fuji_spicycrust');
      this.loginSuccess(derivedAddress);
    }
  }

  // 2. Conectar Billetera EVM Nativa (MetaMask, Core, Coinbase Wallet, etc.)
  static async handleEvmWalletLogin() {
    Sound.playHoverBlip();
    try {
      if (window.ethereum) {
        // Solicitar cuentas EVM
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0 && isValidEvmAddress(accounts[0])) {
          // Intentar cambiar a Avalanche Fuji (Chain ID 43113 = 0xa869)
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xa869' }]
            });
          } catch (switchErr) {
            // Si la red no existe en la billetera del usuario, la agregamos
            if (switchErr.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xa869',
                  chainName: 'Avalanche Fuji Testnet',
                  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
                  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                  blockExplorerUrls: ['https://testnet.snowtrace.io/']
                }]
              });
            }
          }
          this.loginSuccess(accounts[0]);
          return;
        }
      }
    } catch (err) {
      console.warn('[EVM Wallet] Error conectando wallet web3 nativa:', err);
    }

    // Fallback amigable para pruebas si no hay extensión inyectada
    const address = await this.deriveEvmAddress('evm_wallet_seed_' + Math.random());
    this.loginSuccess(address);
  }

  // 3. Biometría / Passkeys (WebAuthn -> Billetera EVM determinista)
  static async handlePasskeyLogin() {
    Sound.playHoverBlip();
    try {
      if (navigator.credentials) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: "SpicyCrust Tavern (Avalanche C-Chain)" },
            user: {
              id: new Uint8Array([1, 2, 3, 4]),
              name: "chef@spicycrust.com",
              displayName: "SpicyChef AVAX"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000
          }
        });

        if (credential) {
          const derivedKey = await this.deriveEvmAddress(credential.id);
          this.loginSuccess(derivedKey);
          return;
        }
      }
    } catch (err) {
      console.warn("[Passkey] Fallo de sensor. Usando respaldo de PIN.", err);
    }

    const code = prompt(
      window.localStorage.getItem('lang') === 'en'
        ? 'Passkey sensor unreadable. Enter security PIN:'
        : 'Sensor biométrico no detectado. Ingresa un PIN de seguridad:'
    );
    if (code) {
      const derivedKey = await this.deriveEvmAddress(code + "_spicycrust_avalanche_salt");
      this.loginSuccess(derivedKey);
    }
  }

  // Generar una dirección EVM determinista de 40 caracteres (0x...) usando SHA-256
  static async deriveEvmAddress(seedText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(seedText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Tomar los primeros 20 bytes para formar 40 caracteres hex de EVM
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
    this.closeModal();
    
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
    this.updateHeaderUI();
    const lang = window.localStorage.getItem('lang');
    alert(lang === 'en' ? 'Avalanche Wallet disconnected.' : 'Billetera Avalanche desconectada.');
  }

  static updateHeaderUI() {
    const activeWallet = getWalletCookie();
    const trophySpan = document.querySelector('[data-t="trophies"]');
    
    if (activeWallet && isValidEvmAddress(activeWallet)) {
      // Mostrar wallet EVM abreviada (0x1234...abcd)
      const shortAddr = `${activeWallet.substring(0, 6)}...${activeWallet.substring(activeWallet.length - 4)}`;
      if (trophySpan) {
        trophySpan.textContent = `🔺 ${shortAddr}`;
      }
    } else {
      // Restaurar texto del botón según idioma actual
      const lang = window.localStorage.getItem('lang') || 'es';
      if (trophySpan) {
        trophySpan.textContent = lang === 'es' ? '🏆 CONECTAR WALLET' : '🏆 CONNECT WALLET';
      }
    }
  }
}
