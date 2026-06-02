import { Wallet, Provider, ContractFactory } from "zksync-ethers";
import * as fs from "fs";
import "dotenv/config";

async function main() {
    const provider = new Provider("https://sepolia.era.zksync.dev");
    const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
    const art = JSON.parse(fs.readFileSync("artifacts-zk/contracts/TPLToken.sol/TPLToken.json", "utf8"));
    const factory = new ContractFactory(art.abi, art.bytecode, wallet);
    try {
        console.log("Testing on Official Sepolia RPC...");
        await factory.deploy();
    } catch (e: any) {
        console.log("Result on Official RPC:", e.message);
    }
}
main();