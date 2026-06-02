import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import "dotenv/config";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.5.8",
    settings: {},
  },
  solidity: {
    version: "0.8.20",
  },
  networks: {
    syscoinNevm: {
      url: "https://rpc.tanenbaum.io",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 5700,
    },
  },
  defaultNetwork: "syscoinNevm",
};

export default config;
