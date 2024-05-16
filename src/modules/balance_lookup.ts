import { BalanceLookupParam, BalanceLookupResult, tryParse, CallContext, ModuleResponse, compareCaseInsensitive, AssetTypes } from 'heat-server-common'

// https://testapi.qubic.org/v1/balances/YROXPGAQMWOWTEFEWUVTGPVUOECCTXZYGMOXHHRBHGCYPOGSYVZLYLOECDZA
export interface BalanceResponse {
  balance: {
    id:string, 
    balance:string, 
    validForTick: number, 
    latestIncomingTransferTick:number, 
    latestOutgoingTransferTick:number
  }
}

export async function getBalanceResponse(context: CallContext, addrXpub: string): Promise<BalanceResponse> {
  const { req, protocol, host, logger } = context
  const url = `${protocol}://${host}/v1/balances/${addrXpub}`;
  const json = await req.get(url);
  const data: BalanceResponse = tryParse(json, logger);
  return data;
}

export async function balanceLookup(context: CallContext, param: BalanceLookupParam): Promise<ModuleResponse<BalanceLookupResult>> {
  try {
    const { blockchain, assetType, addrXpub, assetId } = param
    if (assetType != AssetTypes.NATIVE) {
      return {
        error: 'AssetType not supported' 
      } 
    }
    const data = await getBalanceResponse(context, addrXpub)
    if (data && data.balance) {
      return {
        value: {
          value: data.balance.balance,
          exists: data.balance.latestIncomingTransferTick != 0 || data.balance.latestOutgoingTransferTick != 0
        }
      }
    }
    return {
      error: 'Invalid api response',
    };    
  } catch (e) {
    return {
      error: e.message,
    };
  }
}