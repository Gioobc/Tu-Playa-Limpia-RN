import { ethers } from 'ethers';

// Syscoin NEVM Testnet Configuration
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.tanenbaum.io';
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_TPL_TOKEN_ADDRESS || "0x6b5A158bD2558F5C484efE7dFC9E330213e8c6e8";
const ADMIN_PRIVATE_KEY = process.env.EXPO_PUBLIC_ADMIN_PRIVATE_KEY;

const ABI = [
    "function mint(address to, uint256 amount) external",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)"
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { address, amount } = req.body;

        if (!address || !amount) {
            return res.status(400).json({ error: 'Missing address or amount' });
        }

        if (!ADMIN_PRIVATE_KEY) {
            return res.status(500).json({ error: 'Server configuration error: Missing Private Key' });
        }

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        console.log(`📡 Fetching decimals and minting ${amount} TPL to ${address}...`);
        
        const decimals = await contract.decimals();
        const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);

        const tx = await contract.mint(address, amountInWei);
        const receipt = await tx.wait();

        console.log(`✅ Minting complete. Hash: ${receipt.transactionHash}`);

        return res.status(200).json({
            success: true,
            hash: receipt.transactionHash,
            message: `Tokens minted successfully to ${address}`
        });

    } catch (error) {
        console.error('❌ Minting error:', error);
        // Aseguramos que el error también devuelva JSON con cabeceras CORS (que ya se setearon al inicio)
        return res.status(500).json({
            error: 'Transaction failed',
            details: error.message
        });
    }
}
