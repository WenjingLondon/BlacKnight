require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        accounts: [`${process.env.PRIVATE_KEY}`],
      },
      sourcify: {
        enabled: true,
      },
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
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
      sepolia: "66RCGFDV81VBSQSS4MFBA7KY46M9XX8BW4",
    },
  },

  mocha: {
    timeout: 1000000000,
  },
};
