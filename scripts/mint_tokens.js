import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-zk.tanenbaum.io/';
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_TPL_TOKEN_ADDRESS || "0x6b5A158bD2558F5C484efE7dFC9E330213e8c6e8";
const ADMIN_PRIVATE_KEY = process.env.EXPO_PUBLIC_ADMIN_PRIVATE_KEY;

const ABI = [
    "function mint(address to, uint256 amount) external",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

async function main() {
    if (!ADMIN_PRIVATE_KEY) {
        console.error("❌ ADMIN_PRIVATE_KEY not found in .env");
        return;
    }

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const adminAddress = await wallet.getAddress();

        const amountToMint = "1000000"; // Minting 1 Million tokens
        const amountInWei = ethers.utils.parseUnits(amountToMint, decimals);

        console.log(`📡 Minting ${amountToMint} ${symbol} to admin: ${adminAddress}...`);
        
        const tx = await contract.mint(adminAddress, amountInWei);
        console.log(`⏳ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Success! Tokens minted. Block: ${receipt.blockNumber}`);

    } catch (error) {
        console.error("❌ Minting failed:", error.message);
        if (error.message.includes("execution reverted")) {
            console.error("Tip: Check if the contract has a maxSupply or if the wallet has MINTER_ROLE.");
        }
    }
}

main();
