import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TuPlayaLimpiaModule = buildModule("TuPlayaLimpia", (m) => {

  // === Deploy TPL Token ===
  const tplToken = m.contract("TPLToken", [],);

  // === Deploy MissionNFT ===
  const missionNFT = m.contract("MissionNFT", []);

  // Opcional: Transferir ownership al OWNER si quieres (recomendado)
  // m.call(missionNFT, "transferOwnership", [/* tu dirección */]);
  // m.call(tplToken, "transferOwnership", [/* tu dirección */]);

  return {
    tplToken,
    missionNFT
  };
});

export default TuPlayaLimpiaModule;