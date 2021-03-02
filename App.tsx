import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  requestTxSig,
  waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  FeeCurrency
// } from '@celo/dappkit'

// TODO: this uses the local "web DappKit" but does not work as a drop-in replacement yet
} from './dappkit'
import { newKitFromWeb3 } from "@celo/contractkit";
import { toTxResult } from "@celo/connect"
import Web3 from 'web3';


// set up ContractKit
// testnet
export const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
// // mainnet
// export const web3 = new Web3('https://forno.celo.org');
export const kit = newKitFromWeb3(web3);
const transferToAccount = "0xbe3908aCEC362AF0382ebc56E06b82ce819b19E8";

export default class App extends React.Component {
  state = {
    address: null,
    phoneNumber: null,
  }

  login = async () => {
    console.log("entering login")
    // A string you can pass to DAppKit, that you can use to listen to the response for that request
    const requestId = 'login'

    // A string that will be displayed to the user, indicating the DApp requesting access/signature
    const dappName = 'Web DappKit'
    // Ask the Celo Alfajores Wallet for user info
    requestAccountAddress({
      requestId,
      dappName: dappName,
      callback: window.location.href,
    })

    // Wait for the Celo Wallet response
    const dappkitResponse = await waitForAccountAuth(requestId)
    // TODO: this should work, and update the address displayed in the component
    // Update state
    this.setState({
      address: dappkitResponse.address,
      phoneNumber: dappkitResponse.phoneNumber,
      loggedIn: true,
    })
  }

  transfer = async () => {
    if (this.state.address) {
      console.log("Entering transfer")
      const requestId = 'transfer';
      const dappName = 'Hello Celo';
      // Create a transaction object to update the contract with the 'textInput'
      // const txObject = await this.state.helloWorldContract.methods.setName(this.state.textInput)
      const stableToken = await kit.contracts.getStableToken();
      const txObject = stableToken.transfer(transferToAccount, "1").txo;
      // Send a request to the Celo wallet to send an update transaction to the HelloWorld contract
      console.log(txObject)
      console.log(this.state.address)
      requestTxSig(
        kit,
        [
          {
            // TODO: fix this type error in a more robust way --> specify the ContractSendMethod funcs needed
            // @ts-ignore
            tx: txObject,
            from: this.state.address!,
            to: stableToken.address,
            feeCurrency: FeeCurrency.cUSD
          }
        ],
        { requestId, dappName, callback: window.location.href }
      )
  
      // Get the response from the Celo wallet
      const dappkitResponse = await waitForSignedTxs(requestId)
      const tx = dappkitResponse.rawTxs[0]
      console.log(tx)
      let result = await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()
      console.log(`Tx receipt: `, result)
    }
  }

  render(){
    return (
      <View style={styles.container}>
      <Button title="Connect to Wallet" onPress={()=> this.login()} />
        <Text style={styles.title}>Address: {this.state.address}</Text>
        <Text style={styles.title}>Phone number: {this.state.phoneNumber}</Text>
      {this.state.address? <Button title="Transfer" onPress={()=> this.transfer()} /> : <></>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
