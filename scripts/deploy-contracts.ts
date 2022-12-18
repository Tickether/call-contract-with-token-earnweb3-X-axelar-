import fs from "fs/promises";
import { getDefaultProvider } from "ethers";
import { isTestnet, wallet } from "../config/constants";

const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

// load contracts
const DistributionExecutableContract = require("../artifacts/contracts/DistributionExecutable.sol/DistributionExecutable.json");

let chains = isTestnet
  ? require("../config/testnet.json")
  : require("../config/local.json");

// get chains
const moonbeamChain = chains.find((chain: any) => chain.name === "Moonbeam");
const etherChain = chains.find((chain: any) => chain.name === "Ethereum");

// deploy script
async function main() {
  /**
   * DEPLOY ON MOONBEAM
   */
  const moonbeamProvider = getDefaultProvider(moonbeamChain.rpc);
  const moonbeamConnectedWallet = wallet.connect(moonbeamProvider);
  
  const moonbeeamSender = await deployContract(
    moonbeamConnectedWallet,
    DistributionExecutableContract,
    [moonbeamChain.gateway, moonbeamChain.gasReceiver],
  );
  console.log("DistributionExecutable deployed on Moonbeam:", moonbeeamSender.address);
  moonbeamChain.distributionExecutable = moonbeeamSender.address;
  

  /**
   * DEPLOY ON AVALANCHE
   */
  const etherProvider = getDefaultProvider(etherChain.rpc);
  const etherConnectedWallet = wallet.connect(etherProvider);
  
  const etherReceiver = await deployContract(
    etherConnectedWallet,
    DistributionExecutableContract,
    [etherChain.gateway, etherChain.gasReceiver],
  );
  console.log(
    "DistributionExecutable deployed on Ethereum:",
    etherReceiver.address,
  );
  etherChain.distributionExecutable = etherReceiver.address;

  // update chains
  const updatedChains = [moonbeamChain, etherChain];
  if (isTestnet) {
    await fs.writeFile(
      "config/testnet.json",
      JSON.stringify(updatedChains, null, 2),
    );
  } else {
    await fs.writeFile(
      "config/local.json",
      JSON.stringify(updatedChains, null, 2),
    );
  }
}

main();
