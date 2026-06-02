import { createContext, useContext, useState } from "react"
import { ethers } from "ethers"
import { Platform, DeviceEventEmitter, Alert } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage';
import EthereumProvider from "@walletconnect/ethereum-provider"
import { useEffect } from "react"
import { useAuth } from './AuthContext'
import ENV from '../constants/env'

const WalletContext = createContext()

const NETWORK = {
  chainId: 5700,
  chainIdHex: "0x1644",
  chainName: "Syscoin NEVM Testnet",
  rpcUrl: "https://rpc.tanenbaum.io",
  blockExplorerUrl: "https://explorer.tanenbaum.io/",
  nativeCurrency: {
    name: "TSYS",
    symbol: "TSYS",
    decimals: 18
  }
}

export function WalletProvider({ children }) {
  const { mongoUserId, hydrateSessionFromUser } = useAuth()

  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState(null)
  const [connectedWalletType, setConnectedWalletType] = useState(null)
  const [hasSkippedConnection, setHasSkippedConnection] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // --------------------------------------------------
  // PERSISTENCE: RESTORE SESSION ON MOUNT
  // --------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedUser, storedType] = await Promise.all([
          AsyncStorage.getItem('@tpl_game_user_meta'),
          AsyncStorage.getItem('@tpl_connected_wallet_type')
        ]);

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.walletAddress) {
            console.log("♻️ Restoring session for:", userData.walletAddress);
            setAddress(userData.walletAddress);
            if (storedType) setConnectedWalletType(storedType);

            // Trigger reload in GameContext
            DeviceEventEmitter.emit('TPL_ACCOUNT_IMPORTED');
          }
        }
      } catch (e) {
        console.warn("Failed to restore wallet session:", e);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // Sync wallet address with app metadata and notify observers
  const syncWalletWithApp = async (walletAddress) => {
    try {
      const storedUser = await AsyncStorage.getItem('@tpl_game_user_meta');
      const userData = storedUser ? JSON.parse(storedUser) : {};

      const updatedUser = { ...userData, walletAddress: walletAddress };
      await AsyncStorage.setItem('@tpl_game_user_meta', JSON.stringify(updatedUser));

      // Global event to trigger reload in GameContext, etc.
      DeviceEventEmitter.emit('TPL_ACCOUNT_IMPORTED');
      console.log("📡 App state synced with wallet address:", walletAddress);
    } catch (e) {
      console.warn("Error syncing wallet with storage:", e);
    }
  }

  const setWalletConnectedType = async (walletType) => {
    setConnectedWalletType(walletType)
    await AsyncStorage.setItem('@tpl_connected_wallet_type', walletType)
  }

  const resolveWalletOwner = async (walletAddress) => {
    const apiUrl = ENV.API_BASE_URL
    const response = await fetch(`${apiUrl}/api/users/address/${encodeURIComponent(walletAddress)}`)
    if (response.status === 404) return null
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`)
    }
    const data = await response.json()
    return data.user || null
  }

  const persistWalletAddress = async (walletAddress) => {
    if (!mongoUserId) return
    const apiUrl = ENV.API_BASE_URL
    const response = await fetch(`${apiUrl}/api/users/${mongoUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: walletAddress })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  const askToUseExistingAccount = (existingUser) => new Promise((resolve) => {
    Alert.alert(
      'Address ya vinculada',
      `Esta address ya está asociada a la cuenta de ${existingUser.username}. Si continúas, se abrirá esa cuenta.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Vincular a esa cuenta', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    )
  })

  const finalizeWalletConnection = async ({ walletAddress, walletType, ethersProvider, walletSigner }) => {
    const existingOwner = await resolveWalletOwner(walletAddress)

    if (existingOwner && existingOwner._id && existingOwner._id !== mongoUserId) {
      const shouldSwitch = await askToUseExistingAccount(existingOwner)
      if (!shouldSwitch) {
        await disconnectWallet()
        setHasSkippedConnection(true)
        return false
      }

      await setWalletConnectedType(walletType)
      setProvider(ethersProvider)
      setSigner(walletSigner)
      setAddress(walletAddress)
      await hydrateSessionFromUser(existingOwner, walletAddress)
      await syncWalletWithApp(walletAddress)
      return true
    }

    await persistWalletAddress(walletAddress)
    await setWalletConnectedType(walletType)
    setProvider(ethersProvider)
    setSigner(walletSigner)
    setAddress(walletAddress)
    await syncWalletWithApp(walletAddress)
    return true
  }

  // --------------------------------------------------
  // SWITCH / ADD NETWORK
  // --------------------------------------------------
  const switchNetwork = async (externalProvider) => {
    try {
      await externalProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainIdHex }]
      })
    } catch (switchError) {

      if (switchError.code === 4902) {
        await externalProvider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: NETWORK.chainIdHex,
              chainName: NETWORK.chainName,
              nativeCurrency: NETWORK.nativeCurrency,
              rpcUrls: [NETWORK.rpcUrl],
              blockExplorerUrls: [NETWORK.blockExplorerUrl]
            }
          ]
        })
      } else {
        throw switchError
      }
    }
  }

  // --------------------------------------------------
  // 🦊 METAMASK (EXTENSIÓN DESKTOP / MOBILE FALLBACK)
  // --------------------------------------------------
  const connectMetaMask = async () => {
    try {
      // 📱 En móvil (fuera de in-app browser de MetaMask), usamos WalletConnect como puente
      if (Platform.OS !== 'web' || !window.ethereum) {
        console.log("📱 Mobile detection or missing window.ethereum: triggering WalletConnect fallback");
        return await connectWalletConnect();
      }

      // 🖥️ Lógica de Desktop (cuando existe window.ethereum)
      if (!window.ethereum) {
        alert("MetaMask no está instalado")
        return
      }

      // 🔥 detecta MetaMask cuando hay múltiples wallets
      let mmProvider = window.ethereum

      if (Array.isArray(window.ethereum.providers)) {
        mmProvider = window.ethereum.providers.find(p => p.isMetaMask)
      }

      if (!mmProvider) {
        alert("MetaMask no disponible")
        return
      }
      // ✅ Soporte robusto para ethers v5 y v6
      const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
      if (!Web3Provider) {
        throw new Error("No se pudo encontrar el proveedor de Ethers (v5/v6 mismatch)");
      }
      const ethersProvider = new Web3Provider(mmProvider)

      // ✅ ESTO ABRE LA EXTENSIÓN
      if (ethersProvider.send) {
        await ethersProvider.send("eth_requestAccounts", [])
      } else {
        await mmProvider.request({ method: "eth_requestAccounts" });
      }

      await switchNetwork(mmProvider)

      const signer = await ethersProvider.getSigner()
      const address = await signer.getAddress()

      const connected = await finalizeWalletConnection({
        walletAddress: address,
        walletType: 'metamask',
        ethersProvider,
        walletSigner: signer,
      })
      if (connected) {
        console.log("🦊 MetaMask conectado:", address)
      }

    } catch (err) {
      console.log("MetaMask connection error:", err)
    }
  }

  // --------------------------------------------------
  // 📱 WALLETCONNECT (MÓVIL / QR)
  // --------------------------------------------------
  const connectWalletConnect = async () => {
    try {

      const wcProvider = await EthereumProvider.init({
        projectId: "5c7937e314de0f188fccc2d1f9927e11",
        chains: [NETWORK.chainId],
        optionalChains: [NETWORK.chainId],
        rpcMap: {
          [NETWORK.chainId]: NETWORK.rpcUrl
        },
        showQrModal: true
      })

      await wcProvider.enable()

      await switchNetwork(wcProvider)

      const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
      const ethersProvider = new Web3Provider(wcProvider)

      const signer = ethersProvider.getSigner ? await ethersProvider.getSigner() : await ethersProvider.getSigner();
      const address = signer.getAddress ? await signer.getAddress() : await signer.address;

      const connected = await finalizeWalletConnection({
        walletAddress: address,
        walletType: 'walletconnect',
        ethersProvider,
        walletSigner: signer,
      })
      if (connected) {
        console.log("📱 WalletConnect conectado:", address)
      }

    } catch (err) {
      console.log("WalletConnect error:", err)
    }
  }

  // --------------------------------------------------
  // 🟢 PALI WALLET
  // --------------------------------------------------
  const connectPali = async () => {
    try {
      let ethProvider = window.pali || window.ethereum;

      if (window.ethereum?.providers) {
        ethProvider =
          window.ethereum.providers.find((p) => p.isPali || p.isPaliWallet) ||
          window.ethereum;
      }

      if (!ethProvider) {
        alert("Pali Wallet no detectada.");
        return;
      }

      const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
      const ethersProvider = new Web3Provider(ethProvider);
      
      try {
        await ethProvider.request({ method: "eth_requestAccounts" });
      } catch (reqErr) {
        if (reqErr.code === 4100) {
          alert("Pali Wallet está bloqueada. Por favor, abre la extensión, ingresa tu contraseña y vuelve a hacer clic en conectar.");
          return;
        }
        throw reqErr;
      }

      await switchNetwork(ethProvider);

      const signer = ethersProvider.getSigner ? await ethersProvider.getSigner() : await ethersProvider.getSigner();
      const address = signer.getAddress ? await signer.getAddress() : await signer.address;

      const connected = await finalizeWalletConnection({
        walletAddress: address,
        walletType: 'pali',
        ethersProvider,
        walletSigner: signer,
      })
      if (connected) {
        console.log("🟢 Pali Wallet conectado:", address);
      }

    } catch (err) {
      console.log("Pali connection error:", err);
    }
  }

  // --------------------------------------------------
  // DISCONNECT
  // --------------------------------------------------
  const disconnectWallet = async () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setConnectedWalletType(null)
    setHasSkippedConnection(false)
    await AsyncStorage.removeItem('@tpl_connected_wallet_type');
    // We don't remove @tpl_game_user_meta address here to allow recovery but we could
  }

  return (
    <WalletContext.Provider
      value={{
        connectMetaMask,
        connectWalletConnect,
        connectPali,
        disconnectWallet,
        provider,
        signer,
        address,
        connectedWalletType,
        hasSkippedConnection,
        setHasSkippedConnection
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}