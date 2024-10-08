import * as chai from 'chai';
const { isObject, isTrue, isNumber, isString, isArray, isBoolean } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { tokenDiscovery } from '../src/modules/token_discovery';
import { Blockchains, AssetTypes, prettyPrint } from 'heat-server-common';

describe('Token Discovery', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.QUBIC
    const assetType: AssetTypes = AssetTypes.NATIVE
    // const addrXpub: string = 'IGJQYTMFLVNIMEAKLANHKGNGZPFCFJGSMVOWMNGLWCZWKFHANHGCBYODMKBC'
    // const addrXpub: string = 'XLEKUDKWFPJAQGDXAQNAIWUUOHEDVQNNFDYDNGHLBEOUZDGHJTCHCPFEXFLD'
    //const addrXpub: string = 'EOKXREPZIQRTTDHZUTVDGBUBIWVATNGUGCTOUWAJWBAVQWQZESDHQSTAVGQN' // <-- this address has all assets
    const addrXpub: string = 'APSCCECDBJTEXEVXWHSJCRMKDPFCWOWWVITNTPIPWDSEUMKEUYLYJLTCYIYA' // <-- has single asset
    
    
    const context = createContext('Token')
    let resp = await tokenDiscovery(context, {
      blockchain, assetType, addrXpub
    })
    console.log('response', prettyPrint(resp))
    isObject(resp)
    let result = resp.value!
    isArray(result)
    for (const token of result) {
      isObject(token)
      isString(token.assetId)
      isNumber(token.assetType)
      isString(token.value)
      isBoolean(token.exists)
    }
  });
  // it('does assets', async () => {
  //   const context = createContext('Token')
  //   const result = await tokenDiscovery(context, 'IGJQYTMFLVNIMEAKLANHKGNGZPFCFJGSMVOWMNGLWCZWKFHANHGCBYODMKBC')
  //   console.log('assets', result)
  // })
});