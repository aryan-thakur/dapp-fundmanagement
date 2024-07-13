// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ShareTokenInterface.sol";
// Uncomment this line to use console.log
//import "hardhat/console.sol";

contract Fund {
    uint public minBuy; // public information
    address public admin; // public information
    uint public spendingMinVotePercent; //percentage of total votes needed
    
    mapping(address => uint256) public stakeholders; //stakeholder => amount deposited
    mapping(uint => Spending) public spending; //maps an id to a Spending struct
    
    ShareToken public shareToken; //object created by address in constructor

    uint private idcnt;

    struct Spending {
        string purpose; //reason for spend
        uint amt; //amount of ETH being spent
        address receiver; //who is being paid?
        bool executed; //has the spending already been executed?
        mapping(address => bool) approvals; //mapping of stakeholders to vote decision bool
        uint approvalCount; //sum of approvals, a yes adds one, a no doesn't change this
        uint256 currentSum; //sum of vote tokens 
        mapping(address => bool) hasVoted; //has this address voted on this before?
        bool canExecute; //ready to be executed? 
    }

    event Deposit(address newStakeholder, uint depositAmt); //newStakeholder has deposit depositAmt Wei (0.1ETH = 1 Token)
    event Vote(address voter, bool vote); //the stakeholder voter has cast a vote vote
    event NewSpending(address receiver, uint spendingAmt); //new spending request with the payee receiver and spendingAmt amount
    event SpendingExecuted(address executor, uint spendingId); //spending has been executed by executor with the id spendingId

    constructor(address _admin, uint _minBuy, uint _minSpendPercent, address _shareTokenAddress)  {
        admin = _admin;
        minBuy = _minBuy;
        spendingMinVotePercent = _minSpendPercent;
        shareToken = ShareToken(_shareTokenAddress);
        idcnt = 0;
    }

    /**
     * @dev Deposits money to the fund managers account, you can deposit multiple times
     * @param depositAmt the amount of Wei being deposited
    */
    function deposit(uint depositAmt) public payable {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        require(msg.value == depositAmt, "ETH paid does not equal the amount of ETH specified in the argument!");
        require((stakeholders[msg.sender] + msg.value) >= minBuy, "Minimum deposit is 0.1 ETH");
        
         
        stakeholders[msg.sender] += depositAmt; //Adding function caller as stakeholder
 
        emit Deposit(msg.sender, depositAmt); //Emitting event

        uint tokenAmt;
        tokenAmt = depositAmt * 10;

        shareToken.mint(msg.sender, tokenAmt);
    }

    /**
     * @dev Creates a spending request, only the admin can create a spending request
     * @param receiver: The address receiving the payment
     * @param spendingAmt: The amount of Wei being sent
     * @param purpose: The reason for the spending
    */
    function createSpending(address receiver, uint spendingAmt, string calldata purpose) public {
        require(msg.sender == admin, "Not the admin!"); //only the admin can create a spending request

         //adding to the mapping
        
        Spending storage spendingReq = spending[idcnt];
        idcnt = idcnt + 1;
        
        spendingReq.purpose = purpose;
        spendingReq.amt = spendingAmt;
        spendingReq.receiver = receiver;
        spendingReq.executed = false;
        spendingReq.approvalCount = 0;
        spendingReq.currentSum = 0;
        spendingReq.canExecute = false;
    
        emit NewSpending(receiver, spendingAmt);
    }

    /**
     * @dev Stakeholder casts a vote on a spending request
     * @param spendingId: The spending to be cast a vote on 
     * @param vote: The vote itself, true for approve, false for disapprove
    */
    function approveSpending(uint spendingId, bool vote) public{
       require(stakeholders[msg.sender] > 0, "Not a stakeholder!"); // the minimum spend is 0.1 ETH anyways
       require(spendingId < idcnt, "This spending request does not exist!");
       require(spending[spendingId].executed == false, "This spending request has already been executed!");
       require(spending[spendingId].hasVoted[msg.sender] == false, "Can't double vote!");
       
       spending[spendingId].approvals[msg.sender] = vote; //set the vote
       spending[spendingId].hasVoted[msg.sender] = true;  //set that the sender has voted
       
       /* The more you invest, the more voting power you have. So we set the amount of vote you cast equal to 
        * the amount of Wei you have invested all time. We look at a fraction of the total amount invested all
        * time to decide when the spending criteria is met.
        */
        
       if (vote) {
           spending[spendingId].approvalCount += 1; //raise the approval count
           spending[spendingId].currentSum += shareToken.balanceOf(msg.sender); //accumulate total share tokens
       }

       if (((spending[spendingId].currentSum * 100)/shareToken.totalSupply()) >= spendingMinVotePercent) {
           spending[spendingId].canExecute = true; // we have hit the required votes, can execute
       }

       /* If a large stakeholder decides to deposit before we hit the min votes, there is no issue but if this
        * stakeholder decides to join after the min votes have been hit, the spending is still approved and
        * money from this large stakeholder may be used to complete this same request the stakeholder had no real 
        * decisionmaking in.
        */

    }

    /**
     * @dev Execute the spending request
     * @param spendingId: The spending to be cast a vote on 
    */
    function executeSpending(uint spendingId) public{
       require(msg.sender == admin, "Not the admin!"); 
       require(spendingId < idcnt, "This spending request does not exist!");
       require(spending[spendingId].executed == false, "This spending request has already been executed!");
       require(spending[spendingId].canExecute == true, "Approval votes not yet met!");
       require(address(this).balance > spending[spendingId].amt, "Insufficient balance!");

       address payable receiver = payable(spending[spendingId].receiver);
       receiver.transfer(spending[spendingId].amt);
       spending[spendingId].executed = true;

       emit SpendingExecuted(msg.sender, spendingId);
    }
} 
