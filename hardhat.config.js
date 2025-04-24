require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
        accounts: [`${process.env.PRIVATE_KEY}`],
      },
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETH_SEPOLIA_API_KEY,
    },
  },

  mocha: {
    timeout: 1000000000,
  },
};
