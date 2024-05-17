import * as chai from 'chai';
const { isObject, isBoolean, isString } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { balanceLookup } from '../src/modules/balance_lookup';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Balance Lookup', () => {
  it('should work for existing address', async () => {
    const blockchain: Blockchains = Blockchains.QUBIC
    const assetType: AssetTypes = AssetTypes.NATIVE
    const assetId: string = '0'
    const addrXpub: string = 'YROXPGAQMWOWTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA'    
    let resp = await balanceLookup(createContext('Balance'), {
      blockchain, assetType, assetId, addrXpub
    })
    console.log('response', resp)
    isObject(resp)
    let result = resp.value
    chai.expect(parseInt(result?.value!)).to.be.greaterThan(0)
    chai.expect(result?.exists).to.be.true
  });
  it('should work for non existing address', async () => {
    const blockchain: Blockchains = Blockchains.QUBIC
    const assetType: AssetTypes = AssetTypes.NATIVE
    const assetId: string = '0'
    const addrXpub: string = 'DOESNOTEXISTTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA'    
    let resp = await balanceLookup(createContext('Balance'), {
      blockchain, assetType, assetId, addrXpub
    })
    console.log('response', resp)
    isObject(resp)
    let result = resp.value
    chai.expect(parseInt(result?.value!)).to.equal(0)
    chai.expect(result?.exists).to.be.false
  });  

  it('should provide a balance', async () => {
    const blockchain: Blockchains = Blockchains.QUBIC
    const assetType: AssetTypes = AssetTypes.NATIVE
    const assetId: string = '0'
    const addrXpub: string = 'EMSSYMCBMVXSSBZZDFFNLYTVZBVBWQNAWIEDYZLBDCFYIBAKFUOOGWLAEXCL'    
    let resp = await balanceLookup(createContext('Balance'), {
      blockchain, assetType, assetId, addrXpub
    })
    console.log('response', resp)
    isObject(resp)
    let result = resp.value
    chai.expect(parseInt(result?.value!)).to.be.greaterThan(0)
    chai.expect(result?.exists).to.be.true    
    
  })


});