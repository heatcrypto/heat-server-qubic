import { CallContext, ModuleResponse, AddressExistsLookupParam, AddressExistsLookupResult } from 'heat-server-common'
import { getBalanceResponse } from './balance_lookup';

export async function addressExistsLookup(context: CallContext, param: AddressExistsLookupParam): Promise<ModuleResponse<AddressExistsLookupResult>> {
  try {
    const { blockchain, addrXpub } = param
    const data = await getBalanceResponse(context, addrXpub)
    if (data) {
      return {
        value: {
          exists: data.balance.latestIncomingTransferTick != 0 || data.balance.latestOutgoingTransferTick != 0
        },
      };
    }
    else {
      return {
        error: `Unregognized response: ${JSON.stringify(data)}`
      }
    }
  } catch (e) {
    return {
      error: e.message,
    };
  }
}