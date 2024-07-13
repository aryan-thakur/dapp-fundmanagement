require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");

const config = require("./secrets.json");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${config.ALCHEMY_API_KEY}`,
      accounts: [config.PRIVATE_KEY]
    }
  }
};
