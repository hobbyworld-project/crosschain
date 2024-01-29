import { ethers } from "hardhat";
import * as fs from "fs";
import { vars } from "hardhat/config";


async function main() {

    const [account1] = await ethers.getSigners();
    const localHost1Provier = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const localHost2Provier = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

    const erc20Data = fs.readFileSync('artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
    const erc20Json = JSON.parse(erc20Data.toString());
    const chain1_erc20_usdt = vars.get("chain1_erc20_usdt");
    const chain2_mapping_usdt =  vars.get("chain2_mapping_usdt");

    const usdtERC20 = new ethers.Contract(chain1_erc20_usdt, erc20Json.abi, localHost1Provier);
    const usdtMapping = new ethers.Contract(chain2_mapping_usdt, erc20Json.abi, localHost2Provier);

    const usdtERC20Balance = await usdtERC20.balanceOf(account1.address);
    const usdtMappingBalance = await usdtMapping.balanceOf(account1.address);

    console.log('chain1 ' + account1.address + ' usdt erc20 balance : ' + ethers.formatUnits(usdtERC20Balance, 6));
    console.log('chain2 ' + account1.address + ' usdt mapping balance : ' + ethers.formatUnits(usdtMappingBalance, 6));
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});