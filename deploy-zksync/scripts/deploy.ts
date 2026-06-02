import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

export default async function () {
  const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  if (!DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
  }

  const wallet = new Wallet(DEPLOYER_PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);

  // ─── 1. Deploy TPLToken ───────────────────────────────────────────
  console.log("\n🚀 Compilando y desplegando TPLToken...");
  const tplArtifact = await deployer.loadArtifact("TPLToken");
  const tplContract = await deployer.deploy(tplArtifact, []);
  const tplAddress = await tplContract.getAddress();
  console.log(`✅ TPLToken desplegado en: ${tplAddress}`);

  // ─── 2. Deploy MissionNFT ─────────────────────────────────────────
  console.log("\n🚀 Compilando y desplegando MissionNFT...");
  const nftArtifact = await deployer.loadArtifact("MissionNFT");
  const nftContract = await deployer.deploy(nftArtifact, []);
  const nftAddress = await nftContract.getAddress();
  console.log(`✅ MissionNFT desplegado en: ${nftAddress}`);

  // ─── 3. Test mint de TPLToken ─────────────────────────────────────
  console.log("\n🧪 Probando mint de 10 TPL al deployer...");
  const mintTx = await tplContract.mint(wallet.address, 10);
  await mintTx.wait();
  console.log(`✅ Mint exitoso. TX: ${mintTx.hash}`);

  // ─── 4. Verificar balance ─────────────────────────────────────────
  const balance = await tplContract.balanceOf(wallet.address);
  console.log(`💰 Balance del deployer: ${balance.toString()} wei TPL`);

  // ─── 5. Guardar ABIs para el frontend ─────────────────────────────
  const outputDir = path.join(__dirname, "..", "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "TPLToken.abi.json"),
    JSON.stringify(tplArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, "MissionNFT.abi.json"),
    JSON.stringify(nftArtifact.abi, null, 2)
  );

  // ─── 6. Resumen ───────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  📋 RESUMEN DE DESPLIEGUE");
  console.log("═".repeat(60));
  console.log(`  Red:           Syscoin NEVM Testnet (5700)`);
  console.log(`  Deployer:      ${wallet.address}`);
  console.log(`  TPLToken:      ${tplAddress}`);
  console.log(`  MissionNFT:    ${nftAddress}`);
  console.log("═".repeat(60));
  console.log("\n📁 ABIs guardadas en deploy-zksync/output/");
  console.log("\n🔧 Actualiza tu .env con:");
  console.log(`  EXPO_PUBLIC_TPL_TOKEN_ADDRESS=${tplAddress}`);
  console.log(`  EXPO_PUBLIC_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`  EXPO_PUBLIC_MISSION_NFT_ADDRESS=${nftAddress}`);
}
