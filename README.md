# How to run

The website is already deployed at https://fundmanagementdapp.netlify.app/

1. Connect your wallet by pressing the 'Connect Wallet' button
2. Connect to the contract by pressing the 'Launch Contract connection' button
3. You can interact with the contract using the inputs and buttons

# Repository organization

The `frontend` folder has all the front end files relevant to the React front end of this website. This is the development folder/repo and is not minified. <br />
The `contracts` folder has all the Solidity contracts relevant to this project. This is equivalent to the backend of this project. Note that these contracts have already been complied and deployed to the ethereum Goerli net. <br />
The `test` folder has a file called `fund.js` that contains extensive tests for the `Fund.sol` contract. <br />
The `scripts` folder has a file called `deploy.js` that is a simple script to deploy the contracts.

## Addresses 

ShareToken Address: `0x1d7d4E1414C9b1c4e7ad3044470cFA3952e5B347` <br />
Fund Contract Address: `0xf70786fe915F014691b37ad6Df56b221fb0d0541`

## Note

You need to have a secrets.json file with relevant API keys to be able to work on this project
