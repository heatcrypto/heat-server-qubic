import * as chai from 'chai';
const { isObject } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { addressExistsLookup } from '../src/modules/address_exists_lookup';
import { Blockchains } from 'heat-server-common';

describe('Address Exists', () => {
  it('should work for exsiting address', async () => {
    let resp = await addressExistsLookup(createContext('Address Exists'), {
      blockchain: Blockchains.QUBIC,
      addrXpub: 'YROXPGAQMWOWTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA'
    })
    console.log(resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    chai.expect(result?.exists).to.true
  });
  it('should work for non exsiting address', async () => {
    let resp = await addressExistsLookup(createContext('Address Exists'), {
      blockchain: Blockchains.QUBIC,
      addrXpub: 'DOESNOTEXISTTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA'
    })
    console.log(resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    chai.expect(result?.exists).to.false
  });  
});