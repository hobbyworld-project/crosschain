import { ethers } from "hardhat";
import { vars } from "hardhat/config";


async function main() {

    const [account1] = await ethers.getSigners();

    const usdtMappingAddress = vars.get("chain2_mapping_usdt");
    const usdtMapping = await ethers.getContractAt("MappingToken", usdtMappingAddress, account1);

    const chain2_crossbridge = vars.get("chain2_crossbridge");
    const setOperatorTx = await usdtMapping.setOperator(chain2_crossbridge);
    await setOperatorTx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
