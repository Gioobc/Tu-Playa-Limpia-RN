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
    zkTanenbaum: {
      url: "https://rpc-zk.tanenbaum.io/",
      ethNetwork: "https://rpc.tanenbaum.io",
      zksync: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  defaultNetwork: "zkTanenbaum",
};

export default config;
