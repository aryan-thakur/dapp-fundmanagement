const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Fund", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFund() {
    const DEPOSIT_AMOUNT = 10n**17n;

    const accountArray = await ethers.getSigners();
    const admin = accountArray[0];
    const Token = await ethers.getContractFactory("contracts/ShareToken.sol:ShareToken");
    const token = await Token.deploy();
    await token.deployed();
    const Fund = await ethers.getContractFactory("Fund");
    const fund = await Fund.deploy(await admin.getAddress(), DEPOSIT_AMOUNT, 75, token.address);
    await fund.deployed();

    await token.transferOwnership(fund.address);
    
    return { fund, accountArray, DEPOSIT_AMOUNT, admin };
  }

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const { fund, admin } = await loadFixture(deployFund);
      expect(await fund.admin()).to.equal(await admin.getAddress());
    });
    
    
    it("Should set the right minBuy", async function () {
      const { fund, DEPOSIT_AMOUNT } = await loadFixture(deployFund);
      expect(await fund.minBuy()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should set the minimum percentage", async function () {
      const { fund, admin } = await loadFixture(deployFund);
      expect(await fund.spendingMinVotePercent()).to.equal(75);
    });
  });

  describe("Deposits", function () {
    describe("Validations", function () {
      it("Should revert with an error if the deposit doesn't match the argument", async function () {
        const { fund, DEPOSIT_AMOUNT } = await loadFixture(deployFund);

        await expect(fund.deposit(DEPOSIT_AMOUNT, {value: ethers.utils.parseEther("1")})).to.be.revertedWith(
          "ETH paid does not equal the amount of ETH specified in the argument!"
          );
      });
      it("Should revert with an error if the deposit doesn't match the argument", async function () {
        const { fund, DEPOSIT_AMOUNT } = await loadFixture(deployFund);

        await expect(fund.deposit(10n**16n, {value: ethers.utils.parseEther("0.01")})).to.be.revertedWith(
        "Minimum deposit is 0.1 ETH"
        );
      });

      it("Shouldn't revert with an error if you deposit 0.1 and then 0.01", async function () {
        const { fund, DEPOSIT_AMOUNT } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {value: ethers.utils.parseEther("0.1")});
        await expect(fund.deposit(10n**16n, {value: ethers.utils.parseEther("0.01")})).not.to.be.reverted;
      });
      
      it("Shouldn't fail if we pay 0.1 ETH with the same argument", async function () {
        const { fund, DEPOSIT_AMOUNT, admin } = await loadFixture(deployFund);

        await expect(fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")})).not.to.be.reverted;
      });
    });
   describe("Workings", function () {
    it("Stakeholder should have been set", async function () {
        const { fund, admin } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        await expect(await fund.stakeholders(await admin.getAddress())).to.equal(10n**17n);
      });
    });
    describe("Events", function () {
      it("Check for Deposit event", async function () {
        const { fund, admin } = await loadFixture(deployFund);

        await expect(fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")})).to.emit(fund, "Deposit").withArgs(await admin.getAddress(), 10n**17n);
  
        /*await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );*/
      });
    });
  });
  describe("Create Spendings", function () {
    describe("Validations", function () {
      it("Should revert with an error if the caller is not admin", async function () {
        const { fund, DEPOSIT_AMOUNT, accountArray } = await loadFixture(deployFund);

        await expect(fund.connect(accountArray[1]).createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop")).to.be.revertedWith(
          "Not the admin!"
        );
      });
    });
    describe("Workings", function () {
      it("Spending request needs to be created", async function () {
          const { fund, accountArray } = await loadFixture(deployFund);
          
          fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
       
          await expect((await fund.spending(0))[0]).to.equal("Buy a laptop"); //cannot match a mapping through tests
        });
    });
    describe("Events", function () {
      it("Check for CreateSpending event", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);

        await expect(fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop")).to.emit(fund, "NewSpending").withArgs(await accountArray[2].getAddress(), ethers.utils.parseEther("1"));
  
        /*await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );*/
      });
    });
  });
  describe("Approve Spendings", function () {
    describe("Validations", function () {
      it("Should revert with an error if the caller is not a stakeholder", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
        
        //right now, only the admin is a stakeholder
        await expect(fund.connect(accountArray[1]).approveSpending(0, true)).to.be.revertedWith(
          "Not a stakeholder!"
        );
      });
      it("Should revert with an error if the spending request does not exist", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
        
        //right now, only the admin is a stakeholder
        await expect(fund.approveSpending(1, true, {from: await admin.getAddress()})).to.be.revertedWith(
          "This spending request does not exist!"
        );
      });
      it("Should not allow double votes", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
        fund.approveSpending(0, true, {from: await admin.getAddress()});
        //right now, only the admin is a stakeholder
        await expect(fund.approveSpending(0, false, {from: await admin.getAddress()})).to.be.revertedWith(
          "Can't double vote!"
        );
      });
    });
    describe("Workings", function () {
      it("Spending request variables must change - one account", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
        
        //right now, only the admin is a stakeholder, this is basically a 100% vote
        fund.approveSpending(0, true, {from: await admin.getAddress()});
     
        await expect((await fund.spending(0))[4]).to.equal(1);
        await expect((await fund.spending(0))[5]).to.equal(10n**18n);
        await expect((await fund.spending(0))[6]).to.equal(true);
        });
      it("Spending request variables must change - multi account small", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);

        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        await fund.connect(accountArray[1]).deposit(10n**18n, {from: await accountArray[1].getAddress(), value: ethers.utils.parseEther("1")});
          
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop multi");
          
        //right now, admin to 2nd account in array is a 1:10 share ratio. Admin votes should not make this executable.
        fund.approveSpending(0, true, {from: await admin.getAddress()});
        fund.connect(accountArray[1]).approveSpending(0, false, {from: await accountArray[1].getAddress()});

        await expect((await fund.spending(0))[4]).to.equal(1);
        await expect((await fund.spending(0))[5]).to.equal(10n**18n);
        await expect((await fund.spending(0))[6]).to.equal(false);
      });
      it("Spending request variables must change - multi account large", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
  
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        await fund.connect(accountArray[1]).deposit(10n**18n, {from: await accountArray[1].getAddress(), value: ethers.utils.parseEther("1")});
            
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop multi");
            
        //right now, admin to 2nd account in array is a 1:10 share ratio. 2nd account votes must make this executable.
        fund.approveSpending(0, false, {from: await admin.getAddress()});
        await fund.connect(accountArray[1]).approveSpending(0, true, {from: await accountArray[1].getAddress()});
            
        await expect((await fund.spending(0))[4]).to.equal(1);
        await expect((await fund.spending(0))[5]).to.equal(10n**19n);
        await expect((await fund.spending(0))[6]).to.equal(true);
      });
    });
  });
  describe("Execute Spendings", function () {
    describe("Validations", function () {
      it("Should revert with an error if the caller is not admin", async function () {
        const { fund, DEPOSIT_AMOUNT, accountArray } = await loadFixture(deployFund);

        await expect(fund.connect(accountArray[1]).executeSpending(250)).to.be.revertedWith("Not the admin!");
      });
      it("Should revert with an error if spending request doesn't exist", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop");
        
        await expect(fund.executeSpending(1)).to.be.revertedWith("This spending request does not exist!");
      });
      it("Should revert with an error if spending request cannot be executed yet", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);

        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        await fund.connect(accountArray[1]).deposit(10n**18n, {from: await accountArray[1].getAddress(), value: ethers.utils.parseEther("1")});
          
        fund.createSpending(await accountArray[2].getAddress(), 10n**18n, "Buy a laptop multi");
          
        //right now, admin to 2nd account in array is a 1:10 share ratio. Admin votes should not make this executable.
        fund.approveSpending(0, true, {from: await admin.getAddress()});
        await fund.connect(accountArray[1]).approveSpending(0, false, {from: await accountArray[1].getAddress()});
        
        await expect(fund.executeSpending(0)).to.be.revertedWith("Approval votes not yet met!");
      });
      it("Should revert with an error if the contract has insufficient balance", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);

        fund.deposit(10n**17n, {from: await admin.getAddress(), value: ethers.utils.parseEther("0.1")});
        await fund.connect(accountArray[1]).deposit(10n**18n, {from: await accountArray[1].getAddress(), value: ethers.utils.parseEther("1")});
          
        fund.createSpending(await accountArray[2].getAddress(), 30n**18n, "Buy a laptop multi");
          
        //right now, admin to 2nd account in array is a 1:10 share ratio. Admin votes should not make this executable.
        fund.approveSpending(0, true, {from: await admin.getAddress()});
        await fund.connect(accountArray[1]).approveSpending(0, true, {from: await accountArray[1].getAddress()});
        
        await expect(fund.executeSpending(0)).to.be.revertedWith("Insufficient balance!");
      });
    });
    describe("Workings", function () {
      it("Should transfer ETH to the address specified when executed", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**18n, {from: await admin.getAddress(), value: ethers.utils.parseEther("1")});
        fund.createSpending(await accountArray[2].getAddress(), 500, "Buy a laptop");
        
        //right now, only the admin is a stakeholder, this is basically a 100% vote
        await fund.approveSpending(0, true, {from: await admin.getAddress()});

        await expect(fund.executeSpending(0)).to.changeEtherBalances(
          [fund, accountArray[2]],
          [-500, 500]
        );
      });
      it("Should not be able to execute twice", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**18n, {from: await admin.getAddress(), value: ethers.utils.parseEther("1")});
        fund.createSpending(await accountArray[2].getAddress(), 500, "Buy a laptop");
        
        //right now, only the admin is a stakeholder, this is basically a 100% vote
        await fund.approveSpending(0, true, {from: await admin.getAddress()});
        fund.executeSpending(0);
        await expect(fund.executeSpending(0)).to.be.revertedWith("This spending request has already been executed!");
      });
    });
    describe("Events", function () {
      it("Should emit SpendingExecuted event", async function () {
        const { fund, admin, accountArray } = await loadFixture(deployFund);
        fund.deposit(10n**18n, {from: await admin.getAddress(), value: ethers.utils.parseEther("1")});
        fund.createSpending(await accountArray[2].getAddress(), 500, "Buy a laptop");
        
        //right now, only the admin is a stakeholder, this is basically a 100% vote
        await fund.approveSpending(0, true, {from: await admin.getAddress()});

        await expect(fund.executeSpending(0)).to.emit(fund, "SpendingExecuted").withArgs(await admin.getAddress(), 0);
      })
    });
  });
});
