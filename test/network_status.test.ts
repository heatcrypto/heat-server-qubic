import * as chai from 'chai';
const { isObject, isNumber, isString } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { networkStatus } from '../src/modules/network_status';

describe('Network Status', () => {
  it('should work', async () => {
    let resp = await networkStatus(createContext('Status'), {})
    console.log(resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    chai.expect(result?.lastBlockTime).to.be.instanceOf(Date)
    isNumber(result?.lastBlockHeight)
    isString(result?.lastBlockId)
  });
});