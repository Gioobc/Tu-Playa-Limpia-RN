import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    syscoin_nevm_testnet: {
      url: "https://rpc.tanenbaum.io/",
      chainId: 5700,
      accounts: OWNER_PRIVATE_KEY ? [OWNER_PRIVATE_KEY] : [],
    },

    zkTanenbaum_Testnet: {
      url: "https://rpc-zk.tanenbaum.io/",
      chainId: 57057,
      accounts: OWNER_PRIVATE_KEY ? [OWNER_PRIVATE_KEY] : [],
      gasPrice: 400_000_000_000, // 400 Gwei, legacy type 0x0
      gas: 5_000_000,
      timeout: 120000,
    },
  },

  etherscan: {
    apiKey: {
      syscoin_nevm_testnet: "abc"
    },
    customChains: [
      {
        network: "syscoin_nevm_testnet",
        chainId: 5700,
        urls: {
          apiURL: "https://explorer.tanenbaum.io/api",
          browserURL: "https://explorer.tanenbaum.io"
        }
      }
    ]
  },
};

export default config;