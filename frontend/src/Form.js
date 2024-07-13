import './Form.css';
import React from 'react';


function Form(props) {

    return (
        <div className='formWrapper'>
        <div className='forms'>
            <h5>Deposit</h5>
            <div className='singleInput'>
            <p className='inputHelps'>Amount (ETH)</p><input className='inputs' value={props.depositAmt} onChange={props.onDepositChange}></input>
            </div>
            <button className='sendButtons' onClick={props.sendDeposit}>Send</button>
        </div>
        <div className='forms'>
            <h5>Create Spending Request</h5>
            <div className='singleInput'>
            <p className='inputHelps'>Receiver</p><input className='inputs' value={props.receiverAddr} onChange={props.onReceiverAddrChange}></input>
            </div>
            <div className='singleInput'>
            <p className='inputHelps'>Amount (ETH)</p><input className='inputs' value={props.receiverAmt} onChange={props.onReceiverAmtChange}></input>
            </div>
            <div className='singleInput'>
            <p className='inputHelps'>Purpose</p><input className='inputs' value={props.receiverPurpose} onChange={props.onReceiverPurposeChange}></input>
            </div>
            <button className='sendButtons' onClick={props.sendCreateSpending}>Send</button>
        </div>
        </div>
    );
}
export default Form;