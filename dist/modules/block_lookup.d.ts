import { CallContext, ModuleResponse, BlockLookupParam, BlockLookupResult } from "heat-server-common";
export interface ApprovedTransactionsResponse {
    approvedTransactions: Array<TransactionObject>;
}
interface TransactionObject {
    sourceId: string;
    destId: string;
    amount: string;
    tickNumber: number;
    inputType: number;
    inputSize: number;
    inputHex: string;
    signatureHex: string;
    txId: string;
}
export declare function getApprovedTransactionsResponse(context: CallContext, tickNumber: number): Promise<ApprovedTransactionsResponse>;
export declare function blockLookup(context: CallContext, param: BlockLookupParam): Promise<ModuleResponse<BlockLookupResult>>;
export {};
