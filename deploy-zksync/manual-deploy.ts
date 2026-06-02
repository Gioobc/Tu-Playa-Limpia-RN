import { Wallet, Provider, ContractFactory } from "zksync-ethers";
import * as ethers from "ethers";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
    const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
    if (!PRIVATE_KEY) throw new Error("No private key found in .env");

    const RPC_URL = "https://rpc.tanenbaum.io";
    const CHAIN_ID = 5700;

    // CONFIGURACIÓN CLAVE: Agregamos Fetch Options con User-Agent para saltar el bloqueo 301 de Cloudflare
    const provider = new Provider(RPC_URL, CHAIN_ID, {
        fetchOptions: {
            headers: {
                "User-Agent": "Mozilla/5.0 (Hardhat/zksync-ethers)",
                "Content-Type": "application/json"
            }
        }
    });

    const wallet = new Wallet(PRIVATE_KEY, provider);
    console.log("Wallet address:", wallet.address);

    // Consulta nativa del balance usando el nuevo proveedor configurado
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "TSYS");

    if (balance === 0n) {
        throw new Error("Insufficient funds for deployment");
    }

    const rootDir = process.cwd();
    const tplArtifactPath = path.join(rootDir, "artifacts-zk/contracts/TPLToken.sol/TPLToken.json");

    if (!fs.existsSync(tplArtifactPath)) {
        throw new Error("Missing artifacts. Please run 'npx hardhat compile' first.");
    }

    const tplArtifact = JSON.parse(fs.readFileSync(tplArtifactPath, "utf8"));
    const tplBytecode = tplArtifact.bytecode.object || tplArtifact.bytecode;

    console.log("\nDeploying TPLToken...");
    const tplFactory = new ContractFactory(tplArtifact.abi, tplBytecode, wallet);
    
    try {
        // Ejecución nativa EIP-712 sin overrides heredados de Ethereum (sin gasPrice/type manual)
        const tplContract = await tplFactory.deploy({
            customData: {
                factoryDeps: [tplBytecode]
            }
        });
        
        console.log("Transaction hash sent:", tplContract.deploymentTransaction()?.hash);
        console.log("Waiting for zkSYS confirmation...");
        
        await tplContract.waitForDeployment();
        const tplAddress = await tplContract.getAddress();
        console.log("✅ TPLToken deployed to:", tplAddress);

    } catch (deployError: any) {
        console.error("❌ Deployment step failed:", deployError.message);
        if (deployError.error) console.error("RPC Raw Error:", JSON.stringify(deployError.error, null, 2));
    }
}

main().catch(console.error);
