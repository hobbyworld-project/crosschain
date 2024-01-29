import { ethers } from "hardhat";
import * as fs from "fs";
import { vars } from "hardhat/config";


async function main() {

    const localHost1Provier = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const crossBridgeChain1Address = vars.get("chain1_crossbridge");
    const crossBridgeData = fs.readFileSync('artifacts/contracts/CrossBridge.sol/CrossBridge.json');
    const crossBridgeJson = JSON.parse(crossBridgeData.toString());
    const crossBridgeChain1 = new ethers.Contract(crossBridgeChain1Address, crossBridgeJson.abi, localHost1Provier);

    const [account1, account2] = await ethers.getSigners();
    const crossBridgeChain2Address = vars.get("chain2_crossbridge");
    const crossBridgeChain2 = ethers.getContractAt("CrossBridge", crossBridgeChain2Address, account2);

    crossBridgeChain1.on("Bridge",async (ID, destToken, destTokenAmount, destRecipient) => {
        
        console.log(ID + ' ' + destToken + ' ' + destTokenAmount + ' ' + destRecipient);

        const mintTx = (await crossBridgeChain2).mintToken(destToken, destTokenAmount, destRecipient);
        (await mintTx).wait();
    });

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});