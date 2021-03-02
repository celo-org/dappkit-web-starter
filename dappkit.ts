import { ContractSendMethod } from '@celo/connect';
import { CeloContract, ContractKit } from '@celo/contractkit';
import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  parseDappkitResponseDeeplink,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
  TxToSignParam,
} from '@celo/utils';

// TODO: investigate tradeoffs of custom linking lib vs. react native dep

// import Linking from './linking';
import { Linking } from 'react-native';
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils';

const localStorageKey = 'dappkit-web';
// hack to get around dappkit issue where new tabs are opened
// and the url hash state is not respected (Note this implementation
// of dappkit doesn't use URL hashes to always force the newtab experience).

// TODO Reinvestigate this regarding chrome vs. iOS differences -- may need to add handling here to close tabs on certain OSs, open new tabs, etc.
if (typeof window !== 'undefined') {
  console.log("In the first block of dappkit-web")
  const params = new URL(window.location.href).searchParams;
  console.log("params: ", params.toString())
  if (params.get('type') && params.get('requestId')) {
    console.log("Setting window location in storage")
    localStorage.setItem(localStorageKey, window.location.href);
    // TODO: seems like the below line is not getting executed in Chrome on iOS
    // on iOS though, the newly opened window gets closed and the following window (instead of the previously opened tab) gets opened
    window.close();
  }
}

async function waitForResponse() {
  console.log("Entered waitForResponse");
  while (true) {
    const value = localStorage.getItem(localStorageKey);
    console.log('Poll', value);
    if (value) {
      localStorage.removeItem(localStorageKey);
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function waitForAccountAuth(
  requestId: string
): Promise<AccountAuthResponseSuccess> {
  console.log("Entered waitForAccountAuth")
  const url = await waitForResponse();
  const dappKitResponse = parseDappkitResponseDeeplink(url);
  console.log("dappKitResponse: ", JSON.stringify(dappKitResponse))
  if (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  ) {
    return dappKitResponse;
  }

  console.log('Unable to parse url', url);
  throw new Error('Unable to parse Valora response');
}

export async function waitForSignedTxs(
  requestId: string
): Promise<SignTxResponseSuccess> {
  const url = await waitForResponse();

  const dappKitResponse = parseDappkitResponseDeeplink(url);
  if (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  ) {
    return dappKitResponse;
  }

  console.warn('Unable to parse url', url);
  throw new Error('Unable to parse Valora response');
}

// TODO import this directly from dappkit?
export function requestAccountAddress(meta: DappKitRequestMeta) {
  console.log("Entering requestAccountAddress");
  const deepLink = serializeDappKitRequestDeeplink(AccountAuthRequest(meta));
  console.log("deepLink: ", deepLink)
  Linking.openURL(deepLink);
  console.log("Leaving requestAccountAddress");
}

export enum FeeCurrency {
  cUSD = 'cUSD',
  cGLD = 'cGLD',
}

async function getFeeCurrencyContractAddress(
  kit: ContractKit,
  feeCurrency: FeeCurrency
): Promise<string> {
  switch (feeCurrency) {
    case FeeCurrency.cUSD:
      return kit.registry.addressFor(CeloContract.StableToken);
    case FeeCurrency.cGLD:
      return kit.registry.addressFor(CeloContract.GoldToken);
    default:
      return kit.registry.addressFor(CeloContract.StableToken);
  }
}

// TODO import directly from dappkit (once expo dep is gone)
export interface TxParams {
  tx: ContractSendMethod
  from: string
  to?: string
  feeCurrency?: FeeCurrency
  estimatedGas?: number
  value?: string
}

export async function requestTxSig(
  kit: ContractKit,
  txParams: TxParams[],
  meta: DappKitRequestMeta
) {
  // TODO: For multi-tx payloads, we for now just assume the same from address for all txs. We should apply a better heuristic
  const baseNonce = await kit.connection.nonce(txParams[0].from)
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam, index) => {
      const feeCurrency = txParam.feeCurrency ? txParam.feeCurrency : FeeCurrency.cGLD
      const feeCurrencyContractAddress = await getFeeCurrencyContractAddress(kit, feeCurrency)
      const value = txParam.value === undefined ? '0' : txParam.value

      const estimatedTxParams = {
        feeCurrency: feeCurrencyContractAddress,
        from: txParam.from,
        value,
      } as any
      const estimatedGas =
        txParam.estimatedGas === undefined
          ? await txParam.tx.estimateGas(estimatedTxParams)
          : txParam.estimatedGas

      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce: baseNonce + index,
        feeCurrencyAddress: feeCurrencyContractAddress,
        value,
        ...txParam,
      }
    })
  )
  const request = SignTxRequest(txs, meta)

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}


