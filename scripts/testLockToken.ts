import { ethers } from "hardhat";
import { vars } from "hardhat/config";
import * as fs from "fs";


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

  let usdtERC20Balance = await usdtERC20.balanceOf(account1.address);
  let usdtMappingBalance = await usdtMapping.balanceOf(account1.address);

  console.log('before chain1 ' + account1.address + ' usdt erc20 balance : ' + ethers.formatUnits(usdtERC20Balance, 6));
  console.log('before chain2 ' + account1.address + ' usdt mapping balance : ' + ethers.formatUnits(usdtMappingBalance, 6));


    const crossBridgeChain1Address = vars.get("chain1_crossbridge");
    const tokenAmount = ethers.parseUnits('100', 6);
    const usdt = ethers.getContractAt("ERC20Token", chain1_erc20_usdt, account1);
    const approveTx = (await usdt).approve(crossBridgeChain1Address, tokenAmount);
    (await approveTx).wait();

    const crossBridgeChain1 = ethers.getContractAt("CrossBridge", crossBridgeChain1Address, account1);
    const bridgeTx = (await crossBridgeChain1).bridge(chain1_erc20_usdt, tokenAmount, account1.address);
    (await bridgeTx).wait();


  setTimeout(async () => {
    usdtERC20Balance = await usdtERC20.balanceOf(account1.address);
    usdtMappingBalance = await usdtMapping.balanceOf(account1.address);
  
    console.log('after chain1 ' + account1.address + ' usdt erc20 balance : ' + ethers.formatUnits(usdtERC20Balance, 6));
    console.log('after chain2 ' + account1.address + ' usdt mapping balance : ' + ethers.formatUnits(usdtMappingBalance, 6));
  }, 10000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
