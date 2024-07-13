// npx hardhat run scripts/liquidation.js

const hre = require('hardhat');
const { ethers } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Accessing contract with account: ', deployer.address);

    const cdpAbi = `[
        {
          "inputs": [
            {
              "internalType": "uint16",
              "name": "_collateralRatio",
              "type": "uint16"
            },
            {
              "internalType": "uint16",
              "name": "_liquidationRatio",
              "type": "uint16"
            },
            {
              "internalType": "uint8",
              "name": "_stabilityFee",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "_stablecoinAddress",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_USDinWei",
              "type": "uint256"
            },
            {
              "internalType": "address payable",
              "name": "_auctionAddress",
              "type": "address"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "CDPKey",
              "type": "uint256"
            }
          ],
          "name": "ClosedCDP",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "CDPKey",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "borrower",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "depositedAmt",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amtOwing",
              "type": "uint256"
            }
          ],
          "name": "NewCDP",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "OwnershipTransferred",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "USDinWei",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "auction",
          "outputs": [
            {
              "internalType": "contract Auction",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "CDPKey",
              "type": "uint256"
            }
          ],
          "name": "closeCDP",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "collateralRatio",
          "outputs": [
            {
              "internalType": "uint16",
              "name": "",
              "type": "uint16"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "depositAmt",
              "type": "uint256"
            }
          ],
          "name": "createCDP",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getPositions",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "id",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "collateralAmt",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "amtOwing",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "active",
                  "type": "bool"
                }
              ],
              "internalType": "struct CDP.PositionDTO[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "start",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "end",
              "type": "uint256"
            }
          ],
          "name": "getPositionsInRange",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "collateralAmt",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "amtOwing",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "internalType": "bool",
                  "name": "active",
                  "type": "bool"
                }
              ],
              "internalType": "struct CDP.Position[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "CDPKey",
              "type": "uint256"
            }
          ],
          "name": "liquidateCDP",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "liquidationRatio",
          "outputs": [
            {
              "internalType": "uint16",
              "name": "",
              "type": "uint16"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "pos_idx",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "positions",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "collateralAmt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amtOwing",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "borrower",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "renounceOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint8",
              "name": "newFee",
              "type": "uint8"
            }
          ],
          "name": "setStabilityFee",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_USDinWei",
              "type": "uint256"
            }
          ],
          "name": "setUSDinWei",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "stabilityFee",
          "outputs": [
            {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "stablecoin",
          "outputs": [
            {
              "internalType": "contract D71C",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
            }
          ],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]`;

    const CDP = new ethers.Contract('0x3a10334812C664C10AcBD8a4A8502216192B3558', cdpAbi, deployer);

    let positions = [];
    const lr = await CDP.liquidationRatio();
    const sf = await CDP.stabilityFee();

    let tempPos = null;
    let x = 0;
    while (true) {
        tempPos = await CDP.positions(x);
        x = x + 1;
        if (tempPos.collateralAmt == 0) {
            break;
        } //not created the position
        positions.push(tempPos);
    }

    /* All active/inactive CDP positions in positions array */

    const USDinWei = await CDP.USDinWei();

    let keys = [];

    positions.forEach((pos, key) => {
        if (pos.active) {
            let totalAmtRequired = pos.amtOwing * (100 + sf) / 100;
            if (pos.collateralAmt < (totalAmtRequired * ((USDinWei * lr) / 100))) {
                keys.push(key);
            }
        }
    });

    /* For all active CDPs we have checked if it's below the liquidation threshold and saved the key */
    console.log(keys);
    for (let i = 0; i < keys.length; i++) {
        await CDP.liquidateCDP(keys[i]);
        setTimeout(()=>{}, 5000);
    }

    /* Liquidate all saved CDPs */
}

function repeat() {
    setTimeout(function () {
        main()
            .then(() => {
                console.log('Successfully liquidated contracts');
            })
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        repeat();
        // Every 30 sec
    }, 30000);
}

repeat();
