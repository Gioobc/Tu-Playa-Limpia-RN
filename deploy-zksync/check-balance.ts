import { Wallet, Provider } from "zksync-ethers";
import "dotenv/config";

async function main() {
  const provider = new Provider("https://rpc.tanenbaum.io");
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("No private key");
  
  const wallet = new Wallet(privateKey, provider);
  const balance = await wallet.getBalance("latest");
  const address = await wallet.getAddress();
  const network = await provider.getNetwork();
  
  console.log(`Address: ${address}`);
  console.log(`Network: ${JSON.stringify(network)}`);
  console.log(`Balance: ${balance.toString()} wei`);
}

main().catch(console.error);