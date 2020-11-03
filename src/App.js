//https://github.com/danfinlay/js-eth-personal-sign-examples/blob/master/index.js

import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

var ethUtil = require('ethereumjs-util')
const secp256k1 = require('secp256k1')
const CryptoJS = require('crypto-js');
const axios = require('axios').default;
const cbor = require('cbor')
const Web3 = require('web3');

//https://github.com/ethereum/web3.js/blob/0.20.7/DOCUMENTATION.md
// let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
let web3;
if (typeof window.web3 !== 'undefined') {
  web3 = new Web3(window.web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const hash = (x) =>
  CryptoJS.SHA512(x).toString(CryptoJS.enc.Hex)

// https://stackoverflow.com/questions/33914764/how-to-read-a-binary-file-with-filereader-in-order-to-hash-it-with-sha-256-in-cr
function arrayBufferToWordArray(ab) {
  var i8a = new Uint8Array(ab);
  var a = [];
  for (var i = 0; i < i8a.length; i += 4) {
    a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
}


function App() {

  const [apiResult, setApiResult] = useState("");
  
  async function onClick(){
    const ethereum = window.ethereum;

    var from = web3.eth.accounts[0]

    // var msgHash = ethUtil.keccak256(Buffer.from('An amazing message, for use with MetaMask!'))
    var msgHash = Buffer.from('8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede', 'hex');
    console.log(from);
    
    
    let signature1 = await new Promise((resolve, reject)=>{
      web3.eth.sign(from, msgHash, function (err, result) {
        if (err) return reject(err)
        return resolve(result)
      })
    });

    const rpk3 = secp256k1.ecdsaRecover(Uint8Array.from(Buffer.from(signature1.slice(2, -2), 'hex')), parseInt(signature1.slice(-2), 16) - 27, Uint8Array.from(msgHash));
    let publicKey = Buffer.from(rpk3, 'hex').toString('hex')

    console.log(msgHash.toString('hex'));
    console.log(signature1);
    console.log(publicKey);

    console.log();


    const INT_KEY_FAMILY = 'intkey'
    const INT_KEY_NAMESPACE = hash(INT_KEY_FAMILY).substring(0, 6)
    const address = INT_KEY_NAMESPACE + hash('foo').slice(-64)
    console.log('address:',address);
    const payload = {
      Verb: 'set',
      Name: 'foo',
      Value: 41
    }

    console.log('public:', publicKey);

    const payloadBytes = cbor.encode(payload)

    const protobuf = require('sawtooth-sdk/protobuf')
    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: 'intkey',
      familyVersion: '1.0',
      inputs: [address],
      outputs: [address],
      signerPublicKey: publicKey,
      // In this example, we're signing the batch with the same private key,
      // but the batch can be signed by another party, in which case, the
      // public key will need to be associated with that key.
      batcherPublicKey: publicKey,
      // In this example, there are no dependencies.  This list should include
      // an previous transaction header signatures that must be applied for
      // this transaction to successfully commit.
      // For example,
      // dependencies: ['540a6803971d1880ec73a96cb97815a95d374cbad5d865925e5aa0432fcf1931539afe10310c122c5eaae15df61236079abbf4f258889359c4d175516934484a'],
      dependencies: [],
      payloadSha512: CryptoJS.SHA512(arrayBufferToWordArray(payloadBytes)).toString(CryptoJS.enc.Hex),
      nonce:"hey4"
    }).finish()


    let sss=CryptoJS.SHA256(arrayBufferToWordArray(transactionHeaderBytes)).toString(CryptoJS.enc.Hex);
    let dataHash=Uint8Array.from(Buffer.from(sss, 'hex'));

    let signature = await new Promise((resolve, reject)=>{
      web3.eth.sign(from, dataHash, function (err, result) {
        if (err) return reject(err)
        return resolve(result)
      })
    });
    signature = signature.slice(2, -2)

    console.log('sha1:', CryptoJS.SHA512(arrayBufferToWordArray(transactionHeaderBytes)).toString(CryptoJS.enc.Hex))
    console.log('signature1:', signature)

    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes
    })
  
    //--------------------------------------
    //Optional
    //If sending to sign outside
    
    const txnListBytes = protobuf.TransactionList.encode({transactions:[
      transaction
    ]}).finish()
    
    //const txnBytes2 = transaction.finish()
    
    let transactions = protobuf.TransactionList.decode(txnListBytes).transactions;
    
    //----------------------------------------
    
    //transactions = [transaction]
    
    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: publicKey,
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish()
    
    //
    sss=CryptoJS.SHA256(arrayBufferToWordArray(batchHeaderBytes)).toString(CryptoJS.enc.Hex);
    dataHash=Uint8Array.from(Buffer.from(sss, 'hex'));


    signature = await new Promise((resolve, reject)=>{
      web3.eth.sign(from, dataHash, function (err, result) {
        if (err) return reject(err)
        return resolve(result)
      })
    });
    signature = signature.slice(2, -2)


    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: signature,
      transactions: transactions
    })
    
    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch]
    }).finish()
    
    console.log(Buffer.from(batchListBytes).toString('hex'));

    console.log('batchListBytes has the batch bytes that ca be sent to sawtooth')
    // axios.post(`${HOST}/batches`, batchListBytes, {
    //   headers: {'Content-Type': 'application/octet-stream'}
    // })
    //   .then((response) => {
    //     console.log(response.data);
    //   })
    //   .catch((err)=>{
    //     console.log(err);
    //   });

      
  }


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={() => {onClick()}}>
          Call API
        </button>
        <h2>Result: {apiResult}</h2>
      </header>
    </div>
  );
}

export default App;



//Ethers
//https://github.com/ethers-io/ethers.js/issues/447
//https://www.npmjs.com/package/secp256k1
//https://docs.ethers.io/ethers.js/v5-beta/cookbook-signing.html


//Signing
//https://docs.metamask.io/guide/signing-data.html#signing-data-with-metamask
//https://ethereum.stackexchange.com/questions/13778/get-public-key-of-any-ethereum-account
//https://github.com/danfinlay/js-eth-personal-sign-examples
//
//https://github.com/MetaMask/eth-sig-util
//
//

