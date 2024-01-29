import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@primitivefi/hardhat-dodoc';
import * as dotenv from "dotenv";
dotenv.config();


const config: HardhatUserConfig = {

  defaultNetwork: "hardhat",

  networks: {

    localnet1: {
      url: "http://127.0.0.1:8545",
    },

    localnet2: {
      url: "http://127.0.0.1:8546",
    },

    hardhat: {

    },

    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },

    hobby: {
      url: "http://103.39.218.177:8545",
      accounts: [process.env.PRIVATE_KEY]
    }
  },

  solidity: {

    version: "0.8.20",
    
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },

  dodoc: {
    include: ["interfaces"],
  }

};

export default config;
