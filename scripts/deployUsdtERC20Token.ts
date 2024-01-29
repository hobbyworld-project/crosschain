import { ethers } from "hardhat";
import { vars } from "hardhat/config";

async function main() {

  const usdtERC20 = await ethers.deployContract("ERC20Token", ['Tether USD', 'USDT', 6]);
  await usdtERC20.waitForDeployment();
  
  console.log(await usdtERC20.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
