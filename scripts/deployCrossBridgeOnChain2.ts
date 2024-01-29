import { ethers } from "hardhat";
import { vars } from "hardhat/config";


async function main() {

    const [account1, account2] = await ethers.getSigners();

    const crossBridge = await ethers.deployContract("CrossBridge", [account2.address]);
    await crossBridge.waitForDeployment();
    console.log(await crossBridge.getAddress());

    const usdtERC20 = vars.get("chain1_erc20_usdt");
    const usdtMapping = vars.get("chain2_mapping_usdt");
    const tx = await crossBridge.setRelatedToken(usdtMapping, usdtERC20);
    await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
