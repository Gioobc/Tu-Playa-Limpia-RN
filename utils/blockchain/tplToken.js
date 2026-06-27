import { ethers } from 'ethers';
import { NETWORK_CONFIG } from './networkConfig';
export const TPL_TOKEN_ADDRESS = process.env.EXPO_PUBLIC_TPL_TOKEN_ADDRESS || "0x6b5A158bD2558F5C484efE7dFC9E330213e8c6e8";
export const TPL_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function getTitle(address user) view returns (string)",
    "function mint(address to, uint256 amount) external",
    "function symbol() view returns (string)"
];
export const fetchUserTitle = async (address, customProvider = null) => {
    try {
        const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
        const provider = customProvider ||
            (window.ethereum ? new Web3Provider(window.ethereum, "any") : null);

        if (!provider) return "Cleanup Rookie";

        const contract = new ethers.Contract(TPL_TOKEN_ADDRESS, TPL_TOKEN_ABI, provider);
        const title = await contract.getTitle(address);
        return title;
    } catch (error) {
        console.error("Error fetching title from contract:", error);
        return "Cleanup Rookie";
    }
};

export const fetchTPLBalance = async (address, customProvider = null) => {
    try {
        if (!address) return "0";

        const JsonRpcProvider = ethers.providers?.JsonRpcProvider;
        const Web3Provider = ethers.providers?.Web3Provider || ethers.BrowserProvider;
        const provider = customProvider ||
            (JsonRpcProvider ? new JsonRpcProvider(NETWORK_CONFIG.rpcUrl) : null) ||
            (window.ethereum ? new Web3Provider(window.ethereum, "any") : null);

        if (!provider) return "0";

        const contract = new ethers.Contract(TPL_TOKEN_ADDRESS, TPL_TOKEN_ABI, provider);
        const balance = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
        console.error("Error fetching TPL balance:", error);
        return "0";
    }
};
