import { NetworkStatusParam, NetworkStatusResult, CallContext, ModuleResponse } from "heat-server-common";
export interface LatestTickResponse {
    latestTick: number;
}
export interface TickDataResponse {
    tickData: {
        computorIndex: number;
        epoch: number;
        tickNumber: number;
        timestamp: string;
        varStruct: string;
        timeLock: string;
        transactionIds: string[];
        contractFees: [];
        signatureHex: string;
    };
}
export declare function getLatestTickResponse(context: CallContext): Promise<LatestTickResponse>;
export declare function getTickDataResponse(context: CallContext, tickNumber: number): Promise<TickDataResponse>;
export declare function networkStatus(context: CallContext, param: NetworkStatusParam): Promise<ModuleResponse<NetworkStatusResult>>;
