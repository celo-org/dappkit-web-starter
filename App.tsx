import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  // requestTxSig,
  // waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  // FeeCurrency
} from '@celo/dappkit'

// TODO: this uses the local "web DappKit" but does not work as a drop-in replacement yet
// } from './dappkit'
// import * as Linking from './linking'

import * as Linking from 'expo-linking'

export default class App extends React.Component {
  state = {
    address: 'Not logged in',
    phoneNumber: 'Not logged in',
  }

  login = async () => {
    console.log("entering login")
    // A string you can pass to DAppKit, that you can use to listen to the response for that request
    const requestId = 'login'

    // A string that will be displayed to the user, indicating the DApp requesting access/signature
    const dappName = 'Web DappKit'

    // The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload.
    const callback = Linking.makeUrl('/')

    // Ask the Celo Alfajores Wallet for user info
    requestAccountAddress({
      requestId,
      dappName,
      callback,
    })

    // Wait for the Celo Wallet response
    const dappkitResponse = await waitForAccountAuth(requestId)

    // TODO: this should work, and update the address displayed in the component
    // Update state
    this.setState({
      address: dappkitResponse.address,
      phoneNumber: dappkitResponse.phoneNumber
    })
    // TODO: use dappkit to have app request that user signs a tx
  }

  render(){
    return (
      <View style={styles.container}>
      <Button title="Connect to Wallet" onPress={()=> this.login()} />
        <Text style={styles.title}>Address: {this.state.address}</Text>
        <Text style={styles.title}>Phone number: {this.state.phoneNumber}</Text>
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
