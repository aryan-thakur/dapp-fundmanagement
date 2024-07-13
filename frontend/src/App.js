import './App.css';
import React, {useState, useEffect} from 'react';
import abi from './fundABI.js';
import Form from './Form.js';
const { ethers } = require("ethers");

function App() {
  const [connectWalletText, setConnectWalletText] = useState("Connect Wallet");
  const [defaultAcc, setDefaultAcc] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const [admin, setAdmin] = useState("");

  const [contractAddr, setContractAddr] = useState("");

  const [contractError, setContractError] = useState("");

  const [depositAmt, setDepositAmt] = useState("");

  const [receiverAddr, setReceiverAddr] = useState("");
  const [receiverAmt, setReceiverAmt] = useState("");
  const [receiverPurpose, setReceiverPurpose] = useState("");

  const [spendings, setSpendings] = useState([]);

  const handleDepositChange = (evt) => {
    setDepositAmt(evt.target.value);
  }

  const handleReceiverAddrChange = (evt) => {
    setReceiverAddr(evt.target.value);
  }

  const handleReceiverAmtChange = (evt) => {
    setReceiverAmt(evt.target.value);
  }

  const handleReceiverPurposeChange = (evt) => {
    setReceiverPurpose(evt.target.value);
  }

  const connectWallerHandler = () => {
    if (window.ethereum){
      window.ethereum.request({method: 'eth_requestAccounts'}).then(result => {
        accountChangeHandler(result[0]);
        setConnectWalletText("Wallet Connected!");
      });
      
    }
    else {
      setErrorMessage("Need to install Metamask");
    }

  }

  const accountChangeHandler = (newAcc) => {
    setDefaultAcc(newAcc);
  }
  
  const buildSpendings = async () => {
    let tempArr = []
    let i = 0;
    while(true){
      let tempSpending = await contract.spending(i);
      i++;
      console.log(tempSpending);
      if(tempSpending['receiver'] == 0){
        break;
      }
      else{
        tempArr.push(tempSpending);
      }
    }
    setSpendings(tempArr);   
  }

  useEffect(() => {
    let getInfo = async () => {
    if(contract) 
    {
    setContractAddr(contract.address);
    setAdmin(await contract.admin());
    buildSpendings();
    }
    }
    getInfo();
  }, [contract]);

  const connectEthers = async () =>  {
    let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(tempProvider);

    let tempSigner = tempProvider.getSigner();
    setSigner(tempSigner);

    let tempContract = new ethers.Contract("0xf70786fe915F014691b37ad6Df56b221fb0d0541", abi, tempSigner);
    if (tempContract != null) {
      setContract(tempContract);
    }
    else {
      console.warn("No contract!");
    }
  }

  const sendDeposit = async () => {
    if(contract){
     contract.deposit(ethers.utils.parseEther(depositAmt), {value: ethers.utils.parseEther(depositAmt)}).then(() => {}, (err)=>{setContractError(err.reason)});
    }
    else{
      setContractError("Contract connection failed!");
    }
  }

  const sendCreateSpending = () => {
    if(contract){
      contract.createSpending(receiverAddr, ethers.utils.parseEther(receiverAmt), receiverPurpose).then(() => {}, (err)=>{setContractError(err.reason)});
    }
    else{
      setContractError("Contract connection failed!");
    }
  }

  const executeSpending = (idx) => {
    if(contract){
      contract.executeSpending(idx).then(() => {}, (err)=>{setContractError(err.reason)});
    }
    else{
      setContractError("Contract connection failed!");
    }
  }

  const vote = (idx, v) => {
    if(contract){
      contract.approveSpending(idx, v).then(() => {}, (err)=>{setContractError(err.reason)});
    }
    else{
      setContractError("Contract connection failed!");
    }
  }

  return (
    <div className="App">
      <div className="App-title">
      <h1> Fund Management dApp</h1>
      </div>
      <header className="App-header">  
      <p>{errorMessage}</p>
      <button className="connectButton" onClick={connectWallerHandler}>{connectWalletText}</button>  
      <p>Account connected: {defaultAcc}</p>
      <button onClick={connectEthers} className="connectButton" id ="launchConnection">Launch Contract Connection</button>
      <p>Contract connected: {contractAddr}</p>
      <p>Admin address: {admin}</p>
      <p id='contractError'>Contract says: {contractError}</p>
      <Form sendDeposit={sendDeposit} sendCreateSpending={sendCreateSpending} onDepositChange={handleDepositChange} onReceiverAddrChange={handleReceiverAddrChange} onReceiverAmtChange={handleReceiverAmtChange} onReceiverPurposeChange={handleReceiverPurposeChange} depositAmt={depositAmt} receiverAddr={receiverAddr} receiverAmt={receiverAmt} receiverPurpose={receiverPurpose}></Form>
      <div className='spendingWrapperMain'>
          <h3>Spending Requests</h3><p id="refreshSpendings" onClick={buildSpendings}>Click to refresh!</p>
          {spendings.map((spending, idx) => {
            return (
            <div className='spendingWrapper' key={idx}>
              <h6>Purpose: {spending['purpose']}</h6>
              <h6>Amount: {ethers.utils.formatEther(spending['amt'].toString())} ETH</h6>
              <h6>Receiver: {spending['receiver'].toString()}</h6>
              <h6>Approvals Received: {spending['approvalCount'].toString()}</h6>
              <h6>Executed: {spending['executed'].toString()}</h6>
              {(() => {
                if(!spending['executed']){
                return (
                <div className='voting'>
                <button className='voteButtons' id='yesButton' onClick={() => {vote(idx, true)}}>Yes</button>
                <button className='voteButtons' id='noButton' onClick={() => {vote(idx, false)}}>No</button>
                </div>);
                }
              })()
              }
              {(() => {
                if(spending['canExecute'] && !spending['executed']){
                  return (<button className='voteButtons' id='executeButton' onClick={() => {executeSpending(idx)}}>Execute</button>);
                }})()}
            </div>);
           })
          } 
        </div>
      </header>
    </div>
  );
}

export default App;
