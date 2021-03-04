import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  requestTxSig,
  waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  FeeCurrency,
  parseURLOnRender,
// TODO replace with @celo/dappkit/lib/web once published
} from './dappkit/src/web'

import { newKitFromWeb3 } from "@celo/contractkit";
import { toTxResult } from "@celo/connect"
import Web3 from 'web3';

// set up ContractKit
// testnet
export const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
// // mainnet
// export const web3 = new Web3('https://forno.celo.org');

// @ts-ignore
export const kit = newKitFromWeb3(web3);

export default class App extends React.Component {
  state = {
    status: null,
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
    try {
      const dappkitResponse = await waitForAccountAuth(requestId)
      this.setState({
        status: "Login succeeded",
        address: dappkitResponse.address,
        phoneNumber: dappkitResponse.phoneNumber,
        loggedIn: true,
      })  
    } catch (error) {
      console.log(error)
      this.setState({
        status: "Login timed out, try again: " + error.strin,
      })
    }
    // TODO: this should work, and update the address displayed in the component
    // Update state
  }

  transfer = async () => {
    if (this.state.address) {
      console.log("Entering transfer")
      const requestId = 'transfer';
      const dappName = 'Hello Celo';
      // Replace with your own account address
      const transferToAccount = "0xbe3908aCEC362AF0382ebc56E06b82ce819b19E8";

      // Create a transaction object using ContractKit
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
      console.log("Tx receipt: ", result)
      this.setState({
        status: "transfer succeeded with receipt: " + result.transactionHash,
      })
    }
  }

  render(){
    // This circumvents new tab behavior
    parseURLOnRender()
    console.log("rendering")
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dummy Web DApp</Text>
        <Button title="Connect to Valora" onPress={()=> this.login()} />
        <Text style={styles.text}>Status: {this.state.status}</Text>
        <Text style={styles.text}>Address: {this.state.address}</Text>
        <Text style={styles.text}>Phone number: {this.state.phoneNumber}</Text>
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
    padding: 10,
  },
  text: {
    fontSize: 16,
    padding: 5,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
