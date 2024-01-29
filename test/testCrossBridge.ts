import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { CrossBridge, ERC20Token, ITokenFactory, MappingToken, MappingToken__factory, TokenFactory, Wrapped } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";


describe("CrossBridge", function () {

    async function deployVars() {

        const [account1, account2] = await ethers.getSigners();
        const zeroAddress = "0x0000000000000000000000000000000000000000";
        const srcChain = 31337n;
        const srcAddress = account1.address;
        const dstChain = 31338n;
        const dstAddress = account1.address;
        const relayer = account2.address;
        const usdtDecimals = 6;
        const usdtSymbol = "USDT";
        const usdtName = "Tether USD";
        const usdtAmount = ethers.parseUnits("100", usdtDecimals);
        const wethDecimals = 18;
        const wethSymbol = "WETH";
        const wethName = "Wrapped Ether";
        const ethAmount = ethers.parseEther("1");

        const tokenFactory = await ethers.deployContract("TokenFactory");
        await tokenFactory.waitForDeployment();
        const tokenFactoryAddress = await tokenFactory.getAddress();

        const crossBridge = await ethers.deployContract("CrossBridge", [relayer, tokenFactoryAddress]);
        await crossBridge.waitForDeployment();
        const crossBridgeAddress = await crossBridge.getAddress();

        const setCrossBridgeTX = await tokenFactory.setCrossBridge(crossBridgeAddress);
        await setCrossBridgeTX.wait();

        const usdtToken = await ethers.deployContract("ERC20Token", [usdtName, usdtSymbol, usdtDecimals]);
        await usdtToken.waitForDeployment();
        const usdtTokenAddress = await usdtToken.getAddress();

        const wethToken = await ethers.deployContract("Wrapped", [wethName, wethSymbol, wethDecimals]);
        await wethToken.waitForDeployment();
        const wethTokenAddress = await wethToken.getAddress();

        const usdtAttestation: ITokenFactory.TokenAttestationStruct = {
            tokenAddress: usdtTokenAddress,
            tokenChain: dstChain,
            tokenType: 0,
            decimals: usdtDecimals,
            symbol: usdtSymbol,
            name: usdtName,
            wrappedTokenAddress: zeroAddress
        };
        const usdtAttestTokenTX = await crossBridge.connect(account2).attestToken(usdtAttestation);
        await usdtAttestTokenTX.wait();
        const usdtWrappedTokenAddress = await crossBridge.getWrappedToken(usdtTokenAddress, dstChain);
        const usdtWrappedToken = await ethers.getContractAt("MappingToken", usdtWrappedTokenAddress, account1);

        const usdtAttestationID = ethers.solidityPackedKeccak256(
            ["address", "uint256"],
            [usdtTokenAddress, dstChain]
        );
        const releaseWrappedUsdtTX = await crossBridge.connect(account2).releaseWrappedTokens(
            usdtAmount * 10n,
            account1.address,
            usdtAttestationID,
        );
        await releaseWrappedUsdtTX.wait();

        const wethAttestation: ITokenFactory.TokenAttestationStruct = {
            tokenAddress: wethTokenAddress,
            tokenChain: dstChain,
            tokenType: 0,
            decimals: wethDecimals,
            symbol: wethSymbol,
            name: wethName,
            wrappedTokenAddress: zeroAddress
        };
        const wethAttestTokenTX = await crossBridge.connect(account2).attestToken(wethAttestation);
        await wethAttestTokenTX.wait();
        const wethwrappedTokenAddress = await crossBridge.getWrappedToken(wethTokenAddress, dstChain);
        const wethwrappedToken = await ethers.getContractAt("MappingToken", wethwrappedTokenAddress, account1);

        const wethAttestationID = ethers.solidityPackedKeccak256(
            ["address", "uint256"],
            [wethTokenAddress, dstChain]
        );
        const releaseWrappedWethTX = await crossBridge.connect(account2).releaseWrappedTokens(
            ethAmount * 10n,
            account1.address,
            wethAttestationID,
        );
        await releaseWrappedWethTX.wait();

        return {
            account1, account2, zeroAddress, usdtAmount, ethAmount, srcChain, srcAddress,
            dstChain, dstAddress, relayer, usdtDecimals, usdtSymbol, usdtName, wethDecimals,
            wethSymbol, wethName, tokenFactory, tokenFactoryAddress, crossBridge, crossBridgeAddress,
            usdtToken, usdtTokenAddress, wethToken, wethTokenAddress, usdtAttestationID, wethAttestationID,
            usdtWrappedToken, usdtWrappedTokenAddress, wethwrappedToken, wethwrappedTokenAddress
        };
    }


    describe("bridgeTokens method", async function () {

        it("Should revert with right error if error params", async function () {
           const { zeroAddress, usdtAmount, dstChain, dstAddress, crossBridge, usdtToken, usdtTokenAddress } = await loadFixture(deployVars);
    
            await expect(crossBridge.bridgeTokens(
                zeroAddress,
                usdtAmount,
                dstChain,
                dstAddress
            )).to.be.revertedWith("invalid token address");
            await expect(crossBridge.bridgeTokens(
                usdtTokenAddress,
                0n,
                dstChain,
                dstAddress
            )).to.be.revertedWith("amount can not be zero");
            await expect(crossBridge.bridgeTokens(
                usdtTokenAddress,
                usdtAmount,
                dstChain,
                zeroAddress
            )).to.be.revertedWith("invalid dst address");
            await expect(crossBridge.bridgeTokens(
                usdtTokenAddress,
                usdtAmount,
                dstChain,
                dstAddress
            )).to.be.revertedWithCustomError(usdtToken, "ERC20InsufficientAllowance");
        });
    
        it("Should deposit WETH if transfer ETH", async function () {
           const { account1, ethAmount, dstChain, dstAddress, crossBridge, wethToken, wethTokenAddress } = await loadFixture(deployVars);
    
            await expect(crossBridge.bridgeTokens(
                wethTokenAddress,
                ethAmount,
                dstChain,
                dstAddress,
                { value: ethAmount }
            )).to.changeEtherBalance(account1, -ethAmount);
    
            await expect(crossBridge.bridgeTokens(
                wethTokenAddress,
                ethAmount,
                dstChain,
                dstAddress,
                { value: ethAmount }
            )).to.changeTokenBalance(wethToken, crossBridge, ethAmount);
        });

        it("Should deposit usdt if transfer usdt", async function () {
            const { account1, usdtAmount, dstChain, dstAddress, crossBridge, usdtToken, crossBridgeAddress, usdtTokenAddress } = await loadFixture(deployVars);

            const approveTX = await usdtToken.approve(crossBridgeAddress, usdtAmount);
            await approveTX.wait();

            await expect(crossBridge.bridgeTokens(
                usdtTokenAddress,
                usdtAmount,
                dstChain,
                dstAddress
            )).to.changeTokenBalances(usdtToken, [account1, crossBridgeAddress], [-usdtAmount, usdtAmount]);
        });

        it("Should emit TokensBridged event", async function () {
            const { account1, usdtAmount, dstChain, dstAddress, crossBridge, crossBridgeAddress, usdtToken, usdtTokenAddress } = await loadFixture(deployVars);

            const approveTX = await usdtToken.approve(crossBridgeAddress, usdtAmount);
            await approveTX.wait();

            await expect(crossBridge.bridgeTokens(
                usdtTokenAddress,
                usdtAmount,
                dstChain,
                dstAddress
            )).to.emit(crossBridge, "TokensBridged");
        });

        it("Should get TokenTransfer by transferID", async function () {
            const { account1, ethAmount, srcChain, srcAddress, dstChain, dstAddress, wethToken, crossBridge, wethTokenAddress } = await loadFixture(deployVars);

            const bridgeTokensTX = await crossBridge.bridgeTokens(
                wethTokenAddress,
                ethAmount,
                dstChain,
                dstAddress,
                { value: ethAmount }
            );
            await bridgeTokensTX.wait();
            const txTime = await time.latest();

            const filter = crossBridge.filters.TokensBridged;
            const events = await crossBridge.queryFilter(filter);
            const [transferID] = events[0].args;
            expect((await crossBridge.tokenTransfers(transferID))).to.deep.equal([
                [
                    txTime,
                    srcChain,
                    srcAddress,
                    dstChain,
                    dstAddress,
                    wethTokenAddress
                ],
                ethAmount
            ]);
        })
    });


    describe("bridgeTokensBack method", async function () {

        it("Should revert with right error if error params", async function () {
            const { account1, zeroAddress, usdtAttestationID, usdtAmount, usdtTokenAddress, dstChain, crossBridge } = await loadFixture(deployVars);

            await expect(crossBridge.bridgeTokensBack(
                0n,
                account1.address,
                usdtAttestationID,
                false
            )).to.be.revertedWith("amount can not be zero");
            await expect(crossBridge.bridgeTokensBack(
                usdtAmount,
                zeroAddress,
                usdtAttestationID,
                false
            )).to.be.revertedWith("invalid to address");
        });

        it("Should the change of wrapped usdt token is correct", async function () {
            const { account1, usdtAttestationID, usdtAmount, usdtWrappedToken, crossBridge } = await loadFixture(deployVars);

            await expect(crossBridge.bridgeTokensBack(
                usdtAmount,
                account1.address,
                usdtAttestationID,
                false
            )).to.changeTokenBalance(usdtWrappedToken, account1, -usdtAmount);
        });

        it("Should the change of wrapped weth token is correct", async function () {
            const { account1, wethAttestationID, ethAmount, wethwrappedToken, crossBridge } = await loadFixture(deployVars);

            await expect(crossBridge.bridgeTokensBack(
                ethAmount,
                account1.address,
                wethAttestationID,
                true
            )).to.changeTokenBalance(wethwrappedToken, account1, -ethAmount);
        });

        it("Should emit TokensBridgedBack event", async function () {
            const { account1, usdtAttestationID, usdtAmount, usdtWrappedToken, crossBridge } = await loadFixture(deployVars);

            await expect(crossBridge.bridgeTokensBack(
                usdtAmount,
                account1.address,
                usdtAttestationID,
                false
            )).to.emit(crossBridge, "TokensBridgedBack");
        });

        it("Should the data of event TokensBridgedBack are correct", async function () {
            const { account1, wethAttestationID, ethAmount, wethwrappedToken, crossBridge } = await loadFixture(deployVars);

            await expect(crossBridge.bridgeTokensBack(
                ethAmount,
                account1.address,
                wethAttestationID,
                true
            )).to.emit(crossBridge, "TokensBridgedBack")
            .withArgs(ethAmount, account1.address, wethAttestationID, true);
        });
    });


    describe("releaseWrappedTokens method", async function () {
        
        it("Should revert with only relayer can call when other account call", async function () {
            const { usdtAmount, account1, crossBridge, usdtAttestationID } = await loadFixture(deployVars);

            await expect(crossBridge.releaseWrappedTokens(
                usdtAmount,
                account1.address,
                usdtAttestationID
            )).to.revertedWith("only relayer can call");
        });

        it("Should revert with right error if error params", async function () {
            const { usdtAmount, account1, account2, zeroAddress, crossBridge, usdtAttestationID } = await loadFixture(deployVars);

            await expect(crossBridge.connect(account2).releaseWrappedTokens(
                0n,
                account1.address,
                usdtAttestationID
            )).to.revertedWith("amount can not be zero");
            await expect(crossBridge.connect(account2).releaseWrappedTokens(
                usdtAmount,
                zeroAddress,
                usdtAttestationID
            )).to.revertedWith("invalid to address");
        });

        it("Should revert with invalid attestationID if wrapped token not exsit", async function () {
            const { usdtAmount, account1, account2, crossBridge, usdtTokenAddress, srcChain } = await loadFixture(deployVars);

            const usdtAttestationID = ethers.solidityPackedKeccak256(
                ["address", "uint256"],
                [usdtTokenAddress, srcChain]
            );
            await expect(crossBridge.connect(account2).releaseWrappedTokens(
                usdtAmount,
                account1.address,
                usdtAttestationID
            )).to.revertedWith("invalid attestationID");
        });

        it("Should emit WrappedTokensReleased event", async function () {
            const { usdtAmount, account1, account2, crossBridge, usdtAttestationID } = await loadFixture(deployVars);

            await expect(crossBridge.connect(account2).releaseWrappedTokens(
                usdtAmount,
                account1.address,
                usdtAttestationID
            )).to.emit(crossBridge, "WrappedTokensReleased");
        });

        it("Should the data of event TokensBridgedBack are correct", async function () {
            const { usdtAmount, account1, account2, crossBridge, usdtAttestationID } = await loadFixture(deployVars);

            await expect(crossBridge.connect(account2).releaseWrappedTokens(
                usdtAmount,
                account1.address,
                usdtAttestationID
            )).to.emit(crossBridge, "WrappedTokensReleased")
            .withArgs(usdtAmount, account1.address, usdtAttestationID);
        });
    });

});