import { TokenDiscoveryParam, TokenDiscoveryResult, CallContext, ModuleResponse } from "heat-server-common";
export interface OwnedAssetsResponse {
    ownedAssets: Array<{
        data: {
            ownerIdentity: string;
            type: number;
            padding: number;
            managingContractIndex: number;
            issuanceIndex: number;
            numberOfUnits: string;
            issuedAsset: {
                issuerIdentity: string;
                type: number;
                name: string;
                numberOfDecimalPlaces: number;
                unitOfMeasurement: number[];
            };
        };
        info: {
            tick: number;
            universeIndex: number;
        };
    }>;
}
export declare function getOwnedAssetsResponse(context: CallContext, addrXpub: string): Promise<OwnedAssetsResponse>;
export declare function tokenDiscovery(context: CallContext, param: TokenDiscoveryParam): Promise<ModuleResponse<Array<TokenDiscoveryResult>>>;
