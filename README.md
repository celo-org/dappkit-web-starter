# DappKit Web Starter (With Expo)

This is an example base for building a web DApp on Celo using Expo. This is heavily based on [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) but adapted for web DApps using Expo.

Please see `App.tsx` for an example flow including connecting to the Alfajores Wallet and transferring 1 WEI (1e-18 cUSD) to an arbitrary account on Alfajores. It is highly recommended to read and go through the [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) tutorial first, and only to use this example if you plan on writing a DApp that will run in a mobile web browser, as opposed to a native DApp. Please take a look at the code in `App.tsx` to see the DappKit `login` (obtain the user's account address and phone number from the Alfajores Wallet) and `transfer` (use ContractKit to create a transaction object, and ask the user to sign this transaction in the Alfajores Wallet).

## Running this Project

## Prerequisites

- Go through the [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) tutorial. This includes installing the Expo CLI (via `npm install -g expo-cli`), the [Yarn package manager](https://yarnpkg.com/), and **are using Node.js version 10.x**
- Make sure the [Celo Wallet](https://celo.org/developers/wallet) is installed on your mobile device to sign transactions
- [Optional] Go to `App.tsx` and fill in your own Alfajores account address if desired.

## Running & Development

After cloning the repository, navigate into the root of the repo (`cd dappkit-web-starter`) and run:

```sh
yarn && yarn web
```

When you are in dev mode (via the above command), any changes that you make to the `App.tsx` will be reflected in your browser.

## Known Issues

DappKit's web functionality should be regarded as a beta solution that includes workarounds to some typical issues that other devs have come across while developing web apps for mobile browsers. There are a few known issues with the current solution that lack fixes:

- Safari on iOS: if the web DApp is open in a tab that is not the most recently opened tab (bottom tab when viewing all open tabs), the user will return to the following tab after completing authentication or signing the transaction in Valora. The information is properly populated in the original web DApp's tab.
- Chrome on iOS: on returning to the web DApp from Valora, a second tab is opened which must be manually closed. The information is properly populated in the original web DApp's tab.
