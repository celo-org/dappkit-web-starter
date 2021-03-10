import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  requestTxSig,
  waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  FeeCurrency,
  // Ensure that we are importing the functions from dappkit/lib/web
} from '@celo/dappkit/lib/web'

import { newKitFromWeb3 } from "@celo/contractkit";
import Web3 from 'web3';

// set up ContractKit, using forno as a provider
// testnet
export const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
// mainnet -- comment out the above, uncomment below for mainnet
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
    // Catch and handle possible timeout errors
    } catch (error) {
      console.log(error)
      this.setState({
        status: "Login timed out, try again.",
      })
    }  }

  transfer = async () => {
    if (this.state.address) {
      console.log("Entering transfer")
      const requestId = 'transfer';
      const dappName = 'Hello Celo';

      // Replace with your own account address and desired value in WEI to transfer
      const transferToAccount = "0xbe3908aCEC362AF0382ebc56E06b82ce819b19E8";
      const transferValue = "1";

      // Create a transaction object using ContractKit
      const stableToken = await kit.contracts.getStableToken();
      const txObject = stableToken.transfer(transferToAccount, transferValue).txo;

      // Send a request to the Celo wallet to send an update transaction to the HelloWorld contract
      requestTxSig(
        // @ts-ignore
        kit,
        [
          {
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
      // Wait for signed transaction object and handle possible timeout
      let rawTx;
      try {
        const dappkitResponse = await waitForSignedTxs(requestId)
        rawTx = dappkitResponse.rawTxs[0]
      } catch (error) {
        console.log(error)
        this.setState({status: "transaction signing timed out, try again."})
        return
      }

      // Wait for transaction result and check for success
      let status;
      const tx = await kit.connection.sendSignedTransaction(rawTx);
      const receipt = await tx.waitReceipt();

      if (receipt.status) {
        status = "transfer succeeded with receipt: " + receipt.transactionHash;
      } else {
        console.log(JSON.stringify(receipt))
        status = "failed to send transaction"
      }
      this.setState({status: status})
    }
  }

  render(){
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
