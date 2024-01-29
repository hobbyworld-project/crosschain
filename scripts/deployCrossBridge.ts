import { ethers } from "hardhat";


async function main() {

    const [account] = await ethers.getSigners();
    const relayer = "0x34072086c3FEfAdA937950682a7e9872dd37559E";

    const tokenFactory = await ethers.deployContract("TokenFactory");
    await tokenFactory.waitForDeployment();

    const crossBridge = await ethers.deployContract("CrossBridge", [relayer, await tokenFactory.getAddress()]);
    await crossBridge.waitForDeployment();
    const crossBridgeAddress = await crossBridge.getAddress();
    console.log(crossBridgeAddress);

    const setCrossBridgeTX = await tokenFactory.setCrossBridge(crossBridgeAddress);
    await setCrossBridgeTX.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
