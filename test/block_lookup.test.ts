import * as chai from 'chai';
const { isObject } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { blockLookup } from '../src/modules/block_lookup';
import { Blockchains } from 'heat-server-common';

describe('Block Lookup Test', () => {
  it('should work', async () => {
    let resp = await blockLookup(createContext('Block'), { blockchain: Blockchains.QUBIC, height: 14053145 })
    console.log(JSON.stringify(resp,null,2))
    isObject(resp)
    let result = resp.value
    isObject(result)
  });
});