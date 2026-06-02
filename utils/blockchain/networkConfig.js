import { ethers } from "ethers";
export const NETWORK_CONFIG = {
  chainId: 5700,
  chainIdHex: "0x1644",
  chainName: "Syscoin NEVM Testnet",
  nativeCurrency: {
    name: "TSYS",
    symbol: "TSYS",
    decimals: 18
  },
  rpcUrl: "https://rpc.tanenbaum.io/",
  blockExplorerUrl: "https://explorer.tanenbaum.io/",
  blockExplorerUrls: ["https://explorer.tanenbaum.io/"],
};
export function getProvider() {
  if (!window.ethereum) {
    throw new Error("No Ethereum provider found");
  }
  return window.ethereum;
}
async function switchToZkSys(provider) {
  const currentChainId = await provider.request({
    method: "eth_chainId"
  });
  if (currentChainId === NETWORK_CONFIG.chainIdHex) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainIdHex }]
    });
  } catch (error) {
    if (error.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: NETWORK_CONFIG.chainIdHex,
          chainName: NETWORK_CONFIG.chainName,
          nativeCurrency: NETWORK_CONFIG.nativeCurrency,
          rpcUrls: [NETWORK_CONFIG.rpcUrl],
          blockExplorerUrls: [NETWORK_CONFIG.blockExplorerUrl]
        }]
      });
    } else {
      throw error;
    }
  }
}
async function verifyBalance(ethersProvider, address) {
  const balance = await ethersProvider.getBalance(address);
  const formatted = ethers.utils.formatEther(balance);
  console.log("Balance TSYS:", formatted);
  if (balance.isZero()) {
    throw new Error("La cuenta no tiene TSYS para pagar gas");
  }
}
export async function connectWallet() {
  const externalProvider = getProvider();
  const accounts = await externalProvider.request({
    method: "eth_requestAccounts"
  });
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts available");
  }
  const activeAddress = accounts[0].toLowerCase();
  await switchToZkSys(externalProvider);
  const ethersProvider = new ethers.providers.Web3Provider(externalProvider, "any");
  const signer = ethersProvider.getSigner();
  const address = await signer.getAddress();
  try {
    const balance = await ethersProvider.getBalance(address);
    console.log("Balance TSYS:", ethers.utils.formatEther(balance));
  } catch (e) {
    console.warn("No se pudo verificar el balance:", e);
  }
  return {
    provider: ethersProvider,
    signer,
    address
  };
}
export function setupWalletListeners() {
  const provider = getProvider();
  provider.on("accountsChanged", () => {
    window.location.reload();
  });
  provider.on("chainChanged", () => {
    window.location.reload();
  });
}
