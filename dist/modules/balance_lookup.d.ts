import { BalanceLookupParam, BalanceLookupResult, CallContext, ModuleResponse } from 'heat-server-common';
export interface BalanceResponse {
    balance: {
        id: string;
        balance: string;
        validForTick: number;
        latestIncomingTransferTick: number;
        latestOutgoingTransferTick: number;
    };
}
export declare function getBalanceResponse(context: CallContext, addrXpub: string): Promise<BalanceResponse>;
export declare function balanceLookup(context: CallContext, param: BalanceLookupParam): Promise<ModuleResponse<BalanceLookupResult>>;
