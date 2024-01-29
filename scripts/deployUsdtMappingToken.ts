import { ethers } from "hardhat";

async function main() {

  const usdtMapping = await ethers.deployContract("MappingToken", ['Tether USD', 'USDT', 6]);
  await usdtMapping.waitForDeployment();

  console.log(await usdtMapping.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});