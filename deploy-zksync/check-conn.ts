import { Wallet, Provider } from "zksync-ethers";
import "dotenv/config";

async function main() {
  const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  if (!DEPLOYER_PRIVATE_KEY) throw new Error("No private key");

  const provider = new Provider("https://rpc.tanenbaum.io");
  const wallet = new Wallet(DEPLOYER_PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", balance.toString());
}

main().catch(console.error);
