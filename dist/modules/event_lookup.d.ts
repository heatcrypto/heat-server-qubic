import { EventLookupParam, EventLookupResult, CallContext, ModuleResponse } from "heat-server-common";
export interface TransferTransactionsPerTickResponse {
    transferTransactionsPerTick: Array<{
        tickNumber: number;
        identity: string;
        transactions: Array<{
            sourceId: string;
            destId: string;
            amount: string;
            tickNumber: number;
            inputType: number;
            inputSize: number;
            inputHex: string;
            signatureHex: string;
            txId: string;
        }>;
    }>;
}
export interface FlatTransfer {
    tickNumber: number;
    sender: string;
    recipient: string;
    amount: string;
    txId: string;
    type: number;
    timestamp: number;
    confirmations: number;
}
export declare function eventLookup(context: CallContext, param: EventLookupParam): Promise<ModuleResponse<Array<EventLookupResult>>>;
