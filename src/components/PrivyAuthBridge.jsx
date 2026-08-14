import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { avalancheFuji, avalanche } from 'viem/chains';
import { setWalletCookie, deleteWalletCookie, broadcastWalletSync } from '../modules/auth.js';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmqdk627p00na0cjsi6ioszjx';

// Componente interno que expone hooks de Privy y sincroniza estado global
function PrivyController() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();

  // Exponer triggers globales para JS vanilla y responder a solicitudes de iframes
  useEffect(() => {
    window.PrivyLoginTrigger = () => {
      if (ready) {
        login();
      } else {
        console.warn('[PrivyBridge] Privy SDK not ready yet.');
      }
    };

    window.PrivyLogoutTrigger = () => {
      if (ready) {
        logout();
      }
    };

    window.PrivySignMessageTrigger = async (messageText) => {
      const activeWallet = wallets.find(w => w.address?.startsWith('0x'));
      if (activeWallet) {
        const provider = await activeWallet.getEthereumProvider();
        const signature = await provider.request({
          method: 'personal_sign',
          params: [messageText, activeWallet.address]
        });
        return signature;
      }
      throw new Error('No embedded wallet active');
    };

    window.PrivySendTransactionTrigger = async (toAddress, valueHex) => {
      const activeWallet = wallets.find(w => w.address?.startsWith('0x'));
      if (activeWallet) {
        const provider = await activeWallet.getEthereumProvider();
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: activeWallet.address,
            to: toAddress || activeWallet.address,
            value: valueHex || '0x0'
          }]
        });
        return txHash;
      }
      throw new Error('No embedded wallet active');
    };

    // Escuchar mensajes de iframes (subjuegos) para Login y Firma de Puntajes
    const handleGameIframeMessage = async (event) => {
      const { type, payload } = event.data || {};
      if (type === 'GAME_LOGIN_REQUEST') {
        if (ready) login();
      } else if (type === 'GAME_SIGN_REQUEST' && payload) {
        try {
          const sig = await window.PrivySignMessageTrigger(payload);
          event.source?.postMessage({ type: 'HUB_SIGN_RESPONSE', signature: sig }, '*');
        } catch (err) {
          event.source?.postMessage({ type: 'HUB_SIGN_RESPONSE', error: err.message || err }, '*');
        }
      }
    };

    window.addEventListener('message', handleGameIframeMessage);
    return () => window.removeEventListener('message', handleGameIframeMessage);
  }, [ready, login, logout, wallets]);

  // Sincronizar billetera EVM tan pronto como el usuario se autentique
  useEffect(() => {
    if (authenticated && user) {
      // Buscar la dirección EVM (0x...) de las billeteras del usuario o de wallets activas
      const activeEvmWallet = wallets.find(w => w.address?.startsWith('0x'))?.address || 
                             user.wallet?.address || 
                             user.wallets?.find(w => w.address?.startsWith('0x'))?.address;

      if (activeEvmWallet) {
        setWalletCookie(activeEvmWallet);
        broadcastWalletSync(activeEvmWallet);
        if (typeof window.AuthSystemUpdateUI === 'function') {
          window.AuthSystemUpdateUI();
        }
      }
    } else if (ready && !authenticated) {
      deleteWalletCookie();
      broadcastWalletSync(null);
      if (typeof window.AuthSystemUpdateUI === 'function') {
        window.AuthSystemUpdateUI();
      }
    }
  }, [authenticated, user, wallets, ready]);

  return null;
}

// Proveedor oficial de Privy con estilo ultralimpio (Fondo claro, Google / Email primario)
export function PrivyAuthBridge() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: avalancheFuji,
        supportedChains: [avalancheFuji, avalanche],
        loginMethods: ['google', 'email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#E84142',
          logo: '/favicon.svg',
          showWalletLoginFirst: false
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <PrivyController />
    </PrivyProvider>
  );
}

// Inicializador automático del DOM root de React en Vite
let bridgeRoot = null;

export function initPrivyReactBridge() {
  let container = document.getElementById('privy-react-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'privy-react-root';
    document.body.appendChild(container);
  }

  if (!bridgeRoot) {
    bridgeRoot = createRoot(container);
    bridgeRoot.render(<PrivyAuthBridge />);
  }
}
