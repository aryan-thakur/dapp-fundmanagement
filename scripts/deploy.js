// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ShareToken = await ethers.getContractFactory("contracts/ShareToken.sol:ShareToken");
  const shareToken = await ShareToken.deploy();

  console.log("ShareToken address:", shareToken.address);

  const Fund = await ethers.getContractFactory("Fund");
  const fund = await Fund.deploy(await deployer.getAddress(), 10n**17n, 75, shareToken.address);

  console.log("Fund address:", fund.address);

  await shareToken.transferOwnership(fund.address);
}

//async-await
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
