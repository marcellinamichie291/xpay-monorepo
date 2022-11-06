import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

let env = require('./env.json');

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: 'https://rpc-mumbai.matic.today',
      chainId: 80001,
      gasPrice: 20000000000,
      accounts: [env.privateKey]
    },
    polygon: {
      // url: `https://polygon-mainnet.infura.io/v3/${env.infuraApiKey}`,
      url: `https://polygon-mainnet.g.alchemy.com/v2/${env.alchemyApiKey}`,
      // url: `https://rpc-mainnet.maticvigil.com/v1/${env.maticvigilKey}`,
      chainId: 137,
      // gasPrice: 20000000000,
      accounts: [env.privateKey]
    }
  },
};

export default config;
