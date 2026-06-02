import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con cuenta:", deployer.address);

  // === Deploy MissionNFT ===
  console.log("🚀 Desplegando MissionNFT...");
  const MissionNFT = await ethers.getContractFactory("MissionNFT");
  const missionNFT = await MissionNFT.deploy();
  const deployMTx = missionNFT.deploymentTransaction();
  console.log("TX hash:", deployMTx?.hash);
  await missionNFT.waitForDeployment();
  console.log("✅ MissionNFT desplegado en:", await missionNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});